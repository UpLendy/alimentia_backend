import { Elysia } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { noStoreCache } from "../../../plugins/security-headers";
import { toScope } from "../../../shared/domain/to-scope";
import { DrizzleEmployeeRepository } from "../../employees/infrastructure/employee.drizzle-repository";
import { DrizzleEquipmentRepository } from "../../equipment/infrastructure/equipment.drizzle-repository";
import { DrizzleDailyFormRepository } from "../../daily-forms/infrastructure/daily-form.drizzle-repository";
import { GetDashboardSummaryUseCase } from "../application/get-dashboard-summary.use-case";

const getDashboardSummary = new GetDashboardSummaryUseCase(
  new DrizzleEmployeeRepository(),
  new DrizzleEquipmentRepository(),
  new DrizzleDailyFormRepository(),
);

// Dashboard principal (src/app/page.tsx): tarjetas de resumen + centro de
// alertas, calculados en vivo a partir de employees/equipment/daily_forms.
// (El % de cumplimiento desagregado por programa es una feature de plan
// Pro/Plus — ver src/config/plans.ts — por ahora se expone el % global.)
export const dashboardRoutes = new Elysia({ prefix: "/dashboard", tags: ["Dashboard"] })
  .use(requireAuth)
  .use(noStoreCache)
  .get("/summary", async ({ user }) => getDashboardSummary.execute(toScope(user!)));
