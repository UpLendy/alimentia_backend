import type { InspectionReportData } from "./inspection-report.entity";

// Puerto: QUÉ se necesita (convertir los datos ya agregados del acta en los
// bytes de un PDF), no CÓMO (pdf-lib, ver
// infrastructure/pdf-lib-report-renderer.ts). Permite testear
// GenerateInspectionReportUseCase con un renderer falso, sin generar PDFs de
// verdad.
export interface ReportRendererPort {
  renderInspectionReport(data: InspectionReportData): Promise<Uint8Array>;
}
