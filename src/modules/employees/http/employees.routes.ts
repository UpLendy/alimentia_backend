import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleEmployeeRepository } from "../infrastructure/employee.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import {
  ListEmployeesUseCase,
  GetEmployeeUseCase,
  CreateEmployeeUseCase,
  UpdateEmployeeUseCase,
  DeactivateEmployeeUseCase,
} from "../application";
import { createEmployeeBody, updateEmployeeBody } from "./employees.schema";

// Composition root del módulo: se instancia una sola vez al cargar el
// archivo. Si mañana hay que testear los casos de uso con un repositorio en
// memoria, esto es lo único que cambia (no las rutas).
const repository = new DrizzleEmployeeRepository();
const sedeRepository = new DrizzleSedeRepository();
const listEmployees = new ListEmployeesUseCase(repository);
const getEmployee = new GetEmployeeUseCase(repository);
const createEmployee = new CreateEmployeeUseCase(repository, sedeRepository);
const updateEmployee = new UpdateEmployeeUseCase(repository, sedeRepository);
const deactivateEmployee = new DeactivateEmployeeUseCase(repository);

// Personal y Capacitaciones (src/app/personal, src/app/personal/nuevo).
// Este archivo es el "controlador": traduce HTTP <-> casos de uso. No tiene
// lógica de negocio ni sabe qué ORM se usa — eso vive en application/ e
// infrastructure/ respectivamente.
export const employeesRoutes = new Elysia({ prefix: "/employees", tags: ["Employees"] })
  .use(requireAuth)
  .get("/", async ({ user }) => listEmployees.execute(toScope(user!)))
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        return await getEmployee.execute(toScope(user!), params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const employee = await createEmployee.execute(toScope(user!).companyId, body);
        return { employee };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createEmployeeBody },
  )
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const employee = await updateEmployee.execute(toScope(user!), params.id, body);
        return { employee };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateEmployeeBody },
  )
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        await deactivateEmployee.execute(toScope(user!), params.id);
        return { success: true };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
