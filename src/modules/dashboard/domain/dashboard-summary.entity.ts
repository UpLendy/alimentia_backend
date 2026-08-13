export interface DashboardAlert {
  type: "examen_medico" | "calibracion";
  severity: "vigente" | "por_vencer" | "vencido";
  title: string;
  detail: string;
  referenceId: string;
}

export interface DashboardStats {
  employeesTotal: number;
  medicalExamsCritical: number;
  equipmentCalibratedPct: number;
  dailyFormsFilledToday: number;
  dailyFormsSubmittedLast30Days: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  alerts: DashboardAlert[];
}
