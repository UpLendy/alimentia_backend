import { pgEnum } from "drizzle-orm/pg-core";

// ── Plataforma / negocio (Alimentia · BPM Consulting) ──────────────────────

// Plan comercial contratado por la empresa cliente (ver Plan Comercial.xlsx)
export const planEnum = pgEnum("plan", ["basico", "pro", "plus"]);

export const companyStatusEnum = pgEnum("company_status", ["activo", "suspendido", "prueba"]);

// Perfil de negocio: activa checklist/requisitos adicionales (ver Checklist Maestro > Perfiles por Negocio)
export const businessProfileEnum = pgEnum("business_profile", [
  "restaurante_general",
  "carnicos",
  "bodega_almacenamiento",
  "ambulantes",
]);

// Roles: bpm_admin = staff de BPM Consulting (acceso multi-cliente, sin companyId fijo)
export const userRoleEnum = pgEnum("user_role", ["bpm_admin", "admin", "supervisor", "operario"]);

// ── Personal / equipos ──────────────────────────────────────────────────────

export const vigenciaStatusEnum = pgEnum("vigencia_status", ["vigente", "por_vencer", "vencido"]);

export const calibrationFrequencyEnum = pgEnum("calibration_frequency", ["semestral", "anual", "bianual"]);

// ── Formatos diarios (src/app/formatos/*) ───────────────────────────────────

export const dailyFormTypeEnum = pgEnum("daily_form_type", [
  "temperatura",
  "plagas",
  "agua",
  "residuos",
  "materias_primas",
  "higiene",
  "almacenamiento",
  "transporte",
  "instalaciones",
  "equipos",
]);

// ── Documentos ──────────────────────────────────────────────────────────────

export const documentStatusEnum = pgEnum("document_status", ["borrador", "en_revision", "vigente", "vencido"]);

// ── Alertas / eventos programados ───────────────────────────────────────────

export const scheduledEventTypeEnum = pgEnum("scheduled_event_type", [
  "agua",
  "superficies",
  "fumigacion",
  "trampas",
]);

export const scheduledEventStatusEnum = pgEnum("scheduled_event_status", [
  "pendiente",
  "completado",
  "cancelado",
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["push", "whatsapp", "email"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pendiente", "enviada", "leida", "fallida"]);

// ── Proveedores ──────────────────────────────────────────────────────────────

export const supplierStatusEnum = pgEnum("supplier_status", ["activo", "inactivo"]);

// ── Trazabilidad y recall ───────────────────────────────────────────────────

export const lotStatusEnum = pgEnum("lot_status", ["activo", "agotado", "retirado"]);
export const recallStatusEnum = pgEnum("recall_status", ["en_proceso", "cerrado"]);

// ── No conformidades / incidentes ───────────────────────────────────────────

export const severityEnum = pgEnum("severity", ["baja", "media", "alta"]);
export const nonConformityStatusEnum = pgEnum("non_conformity_status", ["abierta", "en_proceso", "cerrada"]);

// ── Checklist maestro (perfiles) ────────────────────────────────────────────

export const checklistStatusEnum = pgEnum("checklist_item_status", ["pendiente", "en_desarrollo", "completo"]);
