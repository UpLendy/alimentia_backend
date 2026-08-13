import { planHasFeature } from "../../../config/plans";
import type { AccessScope } from "../../../shared/domain/access-scope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { DailyFormRepository } from "../../daily-forms/domain/daily-form.repository";
import type { NonConformityRepository } from "../../quality/domain/non-conformity.repository";
import type { NotificationRepository } from "../../notifications/domain/notification.repository";
import type { StoragePort } from "../../attachments/domain/storage.port";
import type { ReportRendererPort } from "../domain/report-renderer.port";
import type {
  GenerateInspectionReportInput,
  InspectionReport,
  InspectionReportData,
} from "../domain/inspection-report.entity";

// Acta de inspección en PDF (feature Pro/Plus, "reporte_acta_inspeccion" —
// ver src/config/plans.ts): no es un CRUD propio, es una agregación de solo
// lectura sobre companies/sedes/daily-forms/quality/notifications (mismo
// patrón que GetDashboardSummaryUseCase y CheckAlertsUseCase — reutiliza los
// repositorios ya existentes de esos módulos en vez de duplicar queries
// contra Drizzle). Las "alertas activas" se leen directo de
// NotificationRepository (las que ya dejó creadas el job CheckAlertsUseCase),
// en vez de volver a ejecutar ese caso de uso global — dispararlo desde un
// request HTTP de una sola empresa recorrería innecesariamente TODAS las
// empresas activas del sistema.
export class GenerateInspectionReportUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly sedeRepository: SedeRepository,
    private readonly dailyFormRepository: DailyFormRepository,
    private readonly nonConformityRepository: NonConformityRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly renderer: ReportRendererPort,
    private readonly storage: StoragePort,
  ) {}

  async execute(scope: AccessScope, input: GenerateInspectionReportInput): Promise<InspectionReport> {
    if (input.from > input.to) {
      throw new ValidationError("La fecha 'from' no puede ser posterior a 'to'.");
    }

    const company = await this.companyRepository.findById(scope.companyId);
    if (!company) throw new NotFoundError("Empresa", "f");
    if (!planHasFeature(company.plan, "reporte_acta_inspeccion")) {
      throw new ForbiddenError(
        "La generación de actas de inspección en PDF no está incluida en tu plan actual. Actualiza a Pro o Plus para usarla.",
      );
    }

    const sede = await this.sedeRepository.findById(scope.companyId, input.sedeId);
    if (!sede) throw new NotFoundError("Sede", "f");

    // Scope acotado a la sede pedida (no a scope.sedeId del usuario): un
    // admin de empresa, sin sede fija, puede pedir el acta de cualquiera de
    // sus sedes.
    const reportScope: AccessScope = { companyId: scope.companyId, sedeId: input.sedeId };

    const [dailyForms, nonConformities, notifications] = await Promise.all([
      this.dailyFormRepository.findAll(reportScope, { from: input.from, to: input.to }),
      this.nonConformityRepository.findAll(reportScope),
      this.notificationRepository.findAll(reportScope),
    ]);

    const countsByType = new Map<string, number>();
    for (const form of dailyForms) {
      countsByType.set(form.formType, (countsByType.get(form.formType) ?? 0) + 1);
    }
    const dailyFormsSummary = [...countsByType.entries()].map(([formType, count]) => ({ formType, count }));

    const openNonConformities = nonConformities
      .filter((nc) => nc.status !== "cerrada")
      .map((nc) => ({
        id: nc.id,
        description: nc.description,
        severity: nc.severity,
        status: nc.status,
        dueDate: nc.dueDate,
      }));

    const activeAlerts = notifications
      .filter((n) => n.status === "pendiente")
      .map((n) => ({ id: n.id, type: n.type, title: n.title, message: n.message, dueDate: n.dueDate }));

    const data: InspectionReportData = {
      company: { name: company.name, nit: company.nit, address: company.address },
      sede: { name: sede.name, address: sede.address, city: sede.city },
      range: { from: input.from, to: input.to },
      dailyFormsTotal: dailyForms.length,
      dailyFormsSummary,
      openNonConformities,
      activeAlerts,
      generatedAt: new Date(),
    };

    const pdfBytes = await this.renderer.renderInspectionReport(data);
    const fileName = `acta-inspeccion-${sede.name.replace(/[^a-zA-Z0-9]+/g, "_")}-${input.from}_${input.to}.pdf`;
    return this.storage.upload(fileName, "application/pdf", pdfBytes);
  }
}
