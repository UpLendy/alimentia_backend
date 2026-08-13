import { getVigenciaStatus } from "../../../lib/dates";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { EmployeeRepository } from "../../employees/domain/employee.repository";
import type { EquipmentRepository } from "../../equipment/domain/equipment.repository";
import type { ScheduledEventRepository } from "../../scheduled-events/domain/scheduled-event.repository";
import type { NotificationRepository } from "../domain/notification.repository";

const WARNING_DAYS = 30;

// Motor de alarmas (checklist "Monitoreo y Alarmas"): recorre TODAS las
// empresas activas y crea una notificación pendiente por cada vencimiento
// próximo o ya vencido (examen médico, calibración, evento programado). No
// es un CRUD propio de employees/equipment/scheduled-events: reutiliza los
// repositorios ya existentes de esos módulos (mismo patrón que
// GetDashboardSummaryUseCase) en vez de duplicar queries contra Drizzle.
// Este caso de uso NO está scopeado a una sola empresa como el resto de la
// app (no hay un request HTTP detrás) — por eso enumera las empresas activas
// él mismo y arma un AccessScope por cada una.
//
// TODO(fase 3 — envío real): este caso de uso solo CREA filas con
// status="pendiente" y channel="push" (default de la tabla). Falta el
// worker que las despache de verdad por WhatsApp/push/email (marcando
// status="enviada"/"fallida" y sentAt) — es integración con un proveedor
// externo (Twilio, WhatsApp Business API/Meta Cloud API, etc.) que se
// decide cuando haya presupuesto para eso. Hasta entonces, las
// notificaciones solo son visibles vía GET /notifications.
export class CheckAlertsUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly scheduledEventRepository: ScheduledEventRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(): Promise<{ created: number }> {
    const companies = await this.companyRepository.findAllActive();
    let created = 0;

    for (const company of companies) {
      const scope = { companyId: company.id, sedeId: null };

      const [employees, equipmentList, scheduledEvents] = await Promise.all([
        this.employeeRepository.findAll(scope),
        this.equipmentRepository.findAll(scope),
        this.scheduledEventRepository.findAll(scope),
      ]);

      for (const employee of employees) {
        if (getVigenciaStatus(employee.medicalExamExpiry, WARNING_DAYS) === "vigente") continue;
        const inserted = await this.createIfMissing(company.id, {
          sedeId: employee.sedeId,
          type: "examen_medico",
          referenceTable: "employees",
          referenceId: employee.id,
          title: "Certificado médico por vencer o vencido",
          message: `${employee.fullName} (${employee.position})`,
          dueDate: employee.medicalExamExpiry ?? undefined,
        });
        if (inserted) created++;
      }

      for (const equipment of equipmentList) {
        if (getVigenciaStatus(equipment.nextCalibrationDate, WARNING_DAYS) === "vigente") continue;
        const inserted = await this.createIfMissing(company.id, {
          sedeId: equipment.sedeId,
          type: "calibracion",
          referenceTable: "equipment",
          referenceId: equipment.id,
          title: "Calibración de equipo por vencer o vencida",
          message: equipment.name,
          dueDate: equipment.nextCalibrationDate ?? undefined,
        });
        if (inserted) created++;
      }

      for (const event of scheduledEvents) {
        if (event.status !== "pendiente") continue;
        if (getVigenciaStatus(event.proposedDate, WARNING_DAYS) === "vigente") continue;
        const inserted = await this.createIfMissing(company.id, {
          sedeId: event.sedeId,
          type: "evento_programado",
          referenceTable: "scheduled_events",
          referenceId: event.id,
          title: "Evento programado por vencer o vencido",
          message: `${event.serviceType} — ${event.providerName ?? "sin proveedor asignado"}`,
          dueDate: event.proposedDate,
        });
        if (inserted) created++;
      }
    }

    return { created };
  }

  // Evita duplicar notificaciones: si ya existe una pendiente para la misma
  // fila de origen (referenceTable+referenceId+status=pendiente), no crea otra.
  private async createIfMissing(
    companyId: string,
    input: {
      sedeId: string;
      type: string;
      referenceTable: string;
      referenceId: string;
      title: string;
      message: string;
      dueDate?: string;
    },
  ): Promise<boolean> {
    const existing = await this.notificationRepository.findPendingByReference(
      companyId,
      input.referenceTable,
      input.referenceId,
    );
    if (existing) return false;

    await this.notificationRepository.create(companyId, input);
    return true;
  }
}
