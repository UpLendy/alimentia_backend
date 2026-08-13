import { PDFDocument, PageSizes, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import type { ReportRendererPort } from "../domain/report-renderer.port";
import type { InspectionReportData } from "../domain/inspection-report.entity";

const [PAGE_WIDTH, PAGE_HEIGHT] = PageSizes.A4;
const MARGIN = 50;
const GRAY = rgb(0.4, 0.4, 0.4);
const BLACK = rgb(0, 0, 0);

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Modela un acta de inspección sanitaria al estilo de las de la Secretaría
// Distrital de Salud de Bogotá (encabezado con datos del establecimiento,
// tabla de hallazgos/no conformidades y espacio de firma) — es una
// estructura de referencia razonable, no una plantilla oficial. Único
// archivo del módulo que sabe que existe pdf-lib.
export class PdfLibReportRenderer implements ReportRendererPort {
  async renderInspectionReport(data: InspectionReportData): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage(PageSizes.A4);
    let y = PAGE_HEIGHT - MARGIN;

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN) {
        page = pdf.addPage(PageSizes.A4);
        y = PAGE_HEIGHT - MARGIN;
      }
    };

    const text = (
      value: string,
      opts: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
    ) => {
      const { x = MARGIN, size = 10, bold: isBold = false, color = BLACK } = opts;
      page.drawText(value, { x, y, size, font: isBold ? bold : font, color });
    };

    const advance = (height = 16) => {
      y -= height;
    };

    const sectionHeader = (title: string) => {
      ensureSpace(40);
      text(title, { size: 12, bold: true });
      advance(20);
    };

    // Encabezado
    text("ACTA DE INSPECCIÓN SANITARIA", { size: 16, bold: true });
    advance(20);
    text("Modelo de referencia — formato inspirado en las actas de la Secretaría Distrital de Salud de Bogotá", {
      size: 8,
      color: GRAY,
    });
    advance(26);

    text(`Empresa: ${data.company.name}${data.company.nit ? ` — NIT ${data.company.nit}` : ""}`, { bold: true });
    advance();
    if (data.company.address) {
      text(`Dirección empresa: ${data.company.address}`);
      advance();
    }
    text(`Sede inspeccionada: ${data.sede.name}`, { bold: true });
    advance();
    const sedeLocation = [data.sede.address, data.sede.city].filter(Boolean).join(", ");
    if (sedeLocation) {
      text(`Dirección sede: ${sedeLocation}`);
      advance();
    }
    text(`Periodo evaluado: ${data.range.from} a ${data.range.to}`);
    advance();
    text(`Fecha de generación: ${data.generatedAt.toISOString().slice(0, 10)}`);
    advance(28);

    // 1. Formatos de autocontrol diligenciados en el periodo
    sectionHeader("1. Resumen de formatos de autocontrol diligenciados");
    text(`Total de formatos diligenciados en el periodo: ${data.dailyFormsTotal}`);
    advance(18);
    if (data.dailyFormsSummary.length === 0) {
      text("No se diligenciaron formatos de autocontrol en el periodo evaluado.", { color: GRAY, size: 9 });
      advance(20);
    } else {
      text("Tipo de formato", { bold: true, size: 9 });
      text("Cantidad", { bold: true, size: 9, x: MARGIN + 300 });
      advance(16);
      for (const item of data.dailyFormsSummary) {
        ensureSpace(16);
        text(item.formType, { size: 9 });
        text(String(item.count), { size: 9, x: MARGIN + 300 });
        advance(16);
      }
      advance(8);
    }

    // 2. Hallazgos: no conformidades abiertas
    sectionHeader("2. Hallazgos — no conformidades abiertas");
    if (data.openNonConformities.length === 0) {
      text("Sin no conformidades abiertas a la fecha.", { color: GRAY, size: 9 });
      advance(20);
    } else {
      text("Descripción", { bold: true, size: 9 });
      text("Severidad", { bold: true, size: 9, x: MARGIN + 260 });
      text("Estado", { bold: true, size: 9, x: MARGIN + 340 });
      text("Vence", { bold: true, size: 9, x: MARGIN + 420 });
      advance(16);
      for (const nc of data.openNonConformities) {
        ensureSpace(16);
        text(truncate(nc.description, 40), { size: 9 });
        text(nc.severity, { size: 9, x: MARGIN + 260 });
        text(nc.status, { size: 9, x: MARGIN + 340 });
        text(nc.dueDate ?? "-", { size: 9, x: MARGIN + 420 });
        advance(16);
      }
      advance(8);
    }

    // 3. Alertas activas (vencimientos de examen médico, calibración, etc.)
    sectionHeader("3. Alertas activas");
    if (data.activeAlerts.length === 0) {
      text("Sin alertas activas a la fecha.", { color: GRAY, size: 9 });
      advance(20);
    } else {
      for (const alert of data.activeAlerts) {
        ensureSpace(16);
        const dueSuffix = alert.dueDate ? ` (vence ${alert.dueDate})` : "";
        text(`• ${alert.title}: ${truncate(alert.message, 55)}${dueSuffix}`, { size: 9 });
        advance(16);
      }
      advance(8);
    }

    // Firma
    ensureSpace(90);
    advance(40);
    drawSignatureLine(page, MARGIN, y, "Firma del responsable del establecimiento");
    drawSignatureLine(page, MARGIN + 280, y, "Firma del inspector / auditor");

    return pdf.save();
  }
}

function drawSignatureLine(page: PDFPage, x: number, y: number, label: string) {
  page.drawLine({ start: { x, y }, end: { x: x + 220, y }, thickness: 1, color: BLACK });
  page.drawText(label, { x, y: y - 14, size: 8, color: GRAY });
}
