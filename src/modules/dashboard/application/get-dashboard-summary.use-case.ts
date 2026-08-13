import type { AccessScope } from "../../../shared/domain/access-scope";
import { getVigenciaStatus, toISODate } from "../../../lib/dates";
import type { EmployeeRepository } from "../../employees/domain/employee.repository";
import type { EquipmentRepository } from "../../equipment/domain/equipment.repository";
import type { DailyFormRepository } from "../../daily-forms/domain/daily-form.repository";
import type { DashboardSummary } from "../domain/dashboard-summary.entity";

// Dashboard principal (src/app/page.tsx): tarjetas de resumen + centro de
// alertas, calculados en vivo a partir de employees/equipment/daily-forms.
// No es un CRUD propio: reutiliza los repositorios ya existentes de esos
// tres módulos en vez de duplicar queries contra Drizzle.
export class GetDashboardSummaryUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly dailyFormRepository: DailyFormRepository,
  ) {}

  async execute(scope: AccessScope): Promise<DashboardSummary> {
    const [allEmployees, allEquipment] = await Promise.all([
      this.employeeRepository.findAll(scope),
      this.equipmentRepository.findAll(scope),
    ]);

    const alerts = [
      ...allEmployees
        .filter((e) => getVigenciaStatus(e.medicalExamExpiry) !== "vigente")
        .map((e) => ({
          type: "examen_medico" as const,
          severity: getVigenciaStatus(e.medicalExamExpiry),
          title: "Certificado médico por vencer o vencido",
          detail: `${e.fullName} (${e.position})`,
          referenceId: e.id,
        })),
      ...allEquipment
        .filter((e) => getVigenciaStatus(e.nextCalibrationDate) !== "vigente")
        .map((e) => ({
          type: "calibracion" as const,
          severity: getVigenciaStatus(e.nextCalibrationDate),
          title: "Calibración próxima a vencer o vencida",
          detail: e.name,
          referenceId: e.id,
        })),
    ];

    const today = toISODate(new Date());
    const formTypesFilledToday = new Set(await this.dailyFormRepository.findFormTypesOnDate(scope, today));

    // Últimos 30 días: % de días con al menos un formato diligenciado (proxy
    // simple de cumplimiento global; se puede reemplazar por una métrica por
    // programa cuando se habilite el tablero desagregado).
    const since = toISODate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const totalForms30d = await this.dailyFormRepository.countInRange(scope, since, today);

    return {
      stats: {
        employeesTotal: allEmployees.length,
        medicalExamsCritical: allEmployees.filter((e) => getVigenciaStatus(e.medicalExamExpiry) !== "vigente").length,
        equipmentCalibratedPct:
          allEquipment.length === 0
            ? 100
            : Math.round(
                (allEquipment.filter((e) => getVigenciaStatus(e.nextCalibrationDate) === "vigente").length /
                  allEquipment.length) *
                  100,
              ),
        dailyFormsFilledToday: formTypesFilledToday.size,
        dailyFormsSubmittedLast30Days: totalForms30d,
      },
      alerts,
    };
  }
}
