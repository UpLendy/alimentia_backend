import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { db } from "../../../db/client";
import { DrizzleTrainingRepository } from "../infrastructure/training.drizzle-repository";
import { DrizzleEmployeeRepository } from "../../employees/infrastructure/employee.drizzle-repository";
import { ListTrainingsUseCase, CreateTrainingUseCase } from "../application";
import { createTrainingBody } from "./trainings.schema";

// Composition root del módulo. La URL cuelga de /employees/:id/trainings (no
// de /trainings), así que no se usa `prefix` de Elysia — cada ruta define el
// path completo.
const trainingRepository = new DrizzleTrainingRepository();
const employeeRepository = new DrizzleEmployeeRepository();
const listTrainings = new ListTrainingsUseCase(trainingRepository, employeeRepository);

// Personal y Capacitaciones (src/app/personal): historial + alta de
// capacitaciones por empleado.
export const trainingsRoutes = new Elysia({ tags: ["Trainings"] })
  .use(requireAuth)
  .get(
    "/employees/:id/trainings",
    async ({ user, params, set }) => {
      try {
        return await listTrainings.execute(toScope(user!), params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/employees/:id/trainings",
    async ({ user, params, body, set }) => {
      try {
        // Instancias nuevas ligadas al `tx` de esta transacción (no las
        // singleton de arriba, que usan el `db` global) — así el insert en
        // trainings y el incremento de employees.trainingHoursCompleted
        // corren atómicamente: si uno falla, se revierte el otro.
        const training = await db.transaction(async (tx) => {
          const scopedTrainingRepository = new DrizzleTrainingRepository(tx);
          const scopedEmployeeRepository = new DrizzleEmployeeRepository(tx);
          const createTraining = new CreateTrainingUseCase(scopedTrainingRepository, scopedEmployeeRepository);
          return createTraining.execute(toScope(user!), params.id, body);
        });
        return { training };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: createTrainingBody },
  );
