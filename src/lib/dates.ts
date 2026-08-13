// Helpers de vigencia usados por employees (examen médico) y equipment (calibración).

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export type VigenciaStatus = "vigente" | "por_vencer" | "vencido";

/**
 * Determina el estado de vigencia de una fecha límite.
 * @param expiryDate fecha de vencimiento
 * @param warningDays días antes del vencimiento en los que se considera "por_vencer"
 */
export function getVigenciaStatus(expiryDate: Date | string | null, warningDays = 30): VigenciaStatus {
  if (!expiryDate) return "vencido";
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "vencido";
  if (diffDays <= warningDays) return "por_vencer";
  return "vigente";
}

const CALIBRATION_MONTHS: Record<"semestral" | "anual" | "bianual", number> = {
  semestral: 6,
  anual: 12,
  bianual: 24,
};

export function computeNextCalibrationDate(
  lastCalibrationDate: Date | string,
  frequency: "semestral" | "anual" | "bianual",
): Date {
  const last = typeof lastCalibrationDate === "string" ? new Date(lastCalibrationDate) : lastCalibrationDate;
  return addMonths(last, CALIBRATION_MONTHS[frequency]);
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}
