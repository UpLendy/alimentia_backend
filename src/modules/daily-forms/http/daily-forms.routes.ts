import { Elysia, t } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleDailyFormRepository } from "../infrastructure/daily-form.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { ListDailyFormsUseCase, GetDailyFormUseCase, CreateDailyFormUseCase } from "../application";
import { createDailyFormBody } from "./daily-forms.schema";

const repository = new DrizzleDailyFormRepository();
const sedeRepository = new DrizzleSedeRepository();
const listDailyForms = new ListDailyFormsUseCase(repository);
const getDailyForm = new GetDailyFormUseCase(repository);
const createDailyForm = new CreateDailyFormUseCase(repository, sedeRepository);

// Formatos Diarios (src/app/formatos/*). Una sola tabla, un tipo por URL:
// POST /daily-forms/temperatura, POST /daily-forms/agua, etc.
export const dailyFormsRoutes = new Elysia({ prefix: "/daily-forms", tags: ["Daily Forms"] })
  .use(requireAuth)
  .get(
    "/",
    async ({ user, query }) => listDailyForms.execute(toScope(user!), query),
    {
      query: t.Object({
        formType: t.Optional(t.String()),
        from: t.Optional(t.String({ format: "date" })),
        to: t.Optional(t.String({ format: "date" })),
      }),
    },
  )
  .post(
    "/:formType",
    async ({ user, params, body, set }) => {
      try {
        const scope = toScope(user!);
        const dailyForm = await createDailyForm.execute(scope.companyId, user!.sub, params.formType, body);
        return { dailyForm };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ formType: t.String() }), body: createDailyFormBody },
  )
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const dailyForm = await getDailyForm.execute(toScope(user!), params.id);
        return { dailyForm };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
