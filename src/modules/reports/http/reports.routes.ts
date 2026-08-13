import { Elysia } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { DrizzleDailyFormRepository } from "../../daily-forms/infrastructure/daily-form.drizzle-repository";
import { DrizzleNonConformityRepository } from "../../quality/infrastructure/non-conformity.drizzle-repository";
import { DrizzleNotificationRepository } from "../../notifications/infrastructure/notification.drizzle-repository";
import { S3StorageAdapter } from "../../attachments/infrastructure/s3-storage.adapter";
import { PdfLibReportRenderer } from "../infrastructure/pdf-lib-report-renderer";
import { GenerateInspectionReportUseCase } from "../application";
import { generateInspectionReportBody } from "./reports.schema";

const generateInspectionReport = new GenerateInspectionReportUseCase(
  new DrizzleCompanyRepository(),
  new DrizzleSedeRepository(),
  new DrizzleDailyFormRepository(),
  new DrizzleNonConformityRepository(),
  new DrizzleNotificationRepository(),
  new PdfLibReportRenderer(),
  new S3StorageAdapter("reports"),
);

// Reportes: agregación de solo lectura sobre otros módulos (mismo patrón que
// src/modules/dashboard), no un CRUD propio — ver ARCHITECTURE.md. Feature
// de plan Pro/Plus ("reporte_acta_inspeccion", ver GenerateInspectionReportUseCase).
export const reportsRoutes = new Elysia({ prefix: "/reports", tags: ["Reports"] })
  .use(requireAuth)
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/inspection-report",
    async ({ user, body, set }) => {
      try {
        const report = await generateInspectionReport.execute(toScope(user!), body);
        return { report };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: generateInspectionReportBody },
  );
