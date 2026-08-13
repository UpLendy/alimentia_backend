// Feature-gating derivado de "Alimentia Plan Comercial.xlsx" (hoja "Planes y Precios").
// Cambiar aquí refleja cambios comerciales sin tocar la lógica de cada módulo.

export type Plan = "basico" | "pro" | "plus";

export type FeatureKey =
  | "tablero_desagregado" // tablero de cumplimiento por programa (no solo global)
  | "tablero_multisede" // mapas de calor / comparativo entre sedes
  | "trazabilidad_recall" // registro por lote + plan de retiro
  | "proveedores" // gestión y evaluación de proveedores
  | "no_conformidades" // CAPA / gestión de incidentes
  | "reporte_acta_inspeccion" // exportación PDF estilo acta de inspección
  | "perfiles_negocio" // checklist específico por tipo de negocio
  | "panel_multisede" // panel centralizado multi-sede / franquicias
  | "api_iot" // API abierta para sensores IoT
  | "white_label"; // modo aliado / consultor externo

export const PLAN_FEATURES: Record<Plan, FeatureKey[]> = {
  // Básico solo trae lo incluido por defecto para todos los planes (saneamiento,
  // formatos diarios, documentación fija, alarmas básicas, tablero global) —
  // ninguna de las FeatureKey de arriba aplica.
  basico: [],
  pro: [
    "tablero_desagregado",
    "trazabilidad_recall",
    "proveedores",
    "no_conformidades",
    "reporte_acta_inspeccion",
    "perfiles_negocio", // 1 perfil en Pro
  ],
  plus: [
    "tablero_desagregado",
    "tablero_multisede",
    "trazabilidad_recall",
    "proveedores",
    "no_conformidades",
    "reporte_acta_inspeccion",
    "perfiles_negocio", // todos los perfiles en Plus
    "panel_multisede",
    "api_iot",
    "white_label",
  ],
};

// Sedes incluidas por plan antes de cobrar sede adicional
export const PLAN_SEDES_INCLUDED: Record<Plan, number> = {
  basico: 1,
  pro: 3,
  plus: 5,
};

export function planHasFeature(plan: Plan, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}
