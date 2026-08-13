// Entidades de dominio del acta de inspección: no importan nada de Drizzle,
// Elysia ni pdf-lib — son la forma "de negocio" de los datos ya agregados de
// companies/sedes/daily-forms/quality/notifications (ver
// application/generate-inspection-report.use-case.ts) y del PDF resultante.

export interface GenerateInspectionReportInput {
  sedeId: string;
  from: string; // fecha ISO (YYYY-MM-DD)
  to: string;
}

export interface DailyFormsSummaryItem {
  formType: string;
  count: number;
}

export interface OpenNonConformitySummary {
  id: string;
  description: string;
  severity: string;
  status: string;
  dueDate: string | null;
}

export interface ActiveAlertSummary {
  id: string;
  type: string;
  title: string;
  message: string;
  dueDate: string | null;
}

// Datos ya resueltos y aplanados que recibe el renderer de PDF (ver
// report-renderer.port.ts) — no sabe nada de los módulos de origen, solo de
// esta forma ya agregada.
export interface InspectionReportData {
  company: { name: string; nit: string | null; address: string | null };
  sede: { name: string; address: string | null; city: string | null };
  range: { from: string; to: string };
  dailyFormsTotal: number;
  dailyFormsSummary: DailyFormsSummaryItem[];
  openNonConformities: OpenNonConformitySummary[];
  activeAlerts: ActiveAlertSummary[];
  generatedAt: Date;
}

export interface InspectionReport {
  fileKey: string;
  fileUrl: string;
}
