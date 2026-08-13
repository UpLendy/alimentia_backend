import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, queryClient } from "../db/client";
import {
  checklistCatalog,
  companies,
  employees,
  equipment,
  notifications,
  sedes,
  signatures,
  trainings,
  users,
} from "../db/schema";
import { hashPassword } from "../lib/password";
import { authRoutes } from "../modules/auth/auth.routes";
import { companiesRoutes } from "../modules/companies/http/companies.routes";
import { attachmentsRoutes } from "../modules/attachments/http/attachments.routes";
import { dailyFormsRoutes } from "../modules/daily-forms/http/daily-forms.routes";
import { employeesRoutes } from "../modules/employees/http/employees.routes";
import { equipmentRoutes } from "../modules/equipment/http/equipment.routes";
import { fixedDocumentsRoutes } from "../modules/fixed-documents/http/fixed-documents.routes";
import { scheduledEventsRoutes } from "../modules/scheduled-events/http/scheduled-events.routes";
import { suppliersRoutes } from "../modules/suppliers/http/suppliers.routes";
import { traceabilityRoutes } from "../modules/traceability/http/traceability.routes";
import { qualityRoutes } from "../modules/quality/http/quality.routes";
import { notificationsRoutes } from "../modules/notifications/http/notifications.routes";
import { trainingsRoutes } from "../modules/trainings/http/trainings.routes";
import { checklistRoutes } from "../modules/checklist/http/checklist.routes";
import { signaturesRoutes } from "../modules/signatures/http/signatures.routes";
import { reportsRoutes } from "../modules/reports/http/reports.routes";
import { sedesRoutes } from "../modules/sedes/http/sedes.routes";
import { errorHandler } from "../plugins/error-handler";
import type { Plan } from "../config/plans";

// El control de seguridad más importante de toda la plataforma: un usuario
// de la empresa A jamás debe poder leer ni escribir datos de la empresa B,
// por ningún endpoint. Hoy esto solo se valida manualmente — este test lo
// automatiza contra una base de datos real (no mocks), ejercitando la app
// completa vía HTTP tal como lo haría un cliente.
const app = new Elysia()
  .use(errorHandler)
  .use(authRoutes)
  .use(companiesRoutes)
  .use(employeesRoutes)
  .use(equipmentRoutes)
  .use(dailyFormsRoutes)
  .use(sedesRoutes)
  .use(scheduledEventsRoutes)
  .use(attachmentsRoutes)
  .use(fixedDocumentsRoutes)
  .use(suppliersRoutes)
  .use(traceabilityRoutes)
  .use(qualityRoutes)
  .use(notificationsRoutes)
  .use(trainingsRoutes)
  .use(checklistRoutes)
  .use(signaturesRoutes)
  .use(reportsRoutes);

async function request(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }),
  );
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

interface Tenant {
  companyId: string;
  sedeId: string;
  adminToken: string;
  employeeId: string;
  equipmentId: string;
}

const seededCompanyIds: string[] = [];

async function seedTenant(label: string, plan: Plan = "pro"): Promise<Tenant> {
  const [company] = await db
    .insert(companies)
    .values({ name: `Empresa de prueba ${label} ${crypto.randomUUID()}`, plan })
    .returning();
  seededCompanyIds.push(company!.id);

  const [sede] = await db
    .insert(sedes)
    .values({ companyId: company!.id, name: `Sede ${label}`, isMain: true })
    .returning();

  const email = `admin-${label.toLowerCase()}-${crypto.randomUUID()}@test.local`;
  const password = "password123";
  await db.insert(users).values({
    companyId: company!.id,
    sedeId: null,
    fullName: `Admin ${label}`,
    email,
    passwordHash: await hashPassword(password),
    role: "admin",
  });

  const login = await request("POST", "/auth/login", { body: { email, password } });
  if (login.status !== 200) {
    throw new Error(`No se pudo autenticar el admin semilla de ${label}: ${JSON.stringify(login.json)}`);
  }
  const adminToken = (login.json as { token: string }).token;

  const [employee] = await db
    .insert(employees)
    .values({
      companyId: company!.id,
      sedeId: sede!.id,
      fullName: `Empleado ${label}`,
      documentId: `DOC-${label}-${crypto.randomUUID().slice(0, 8)}`,
      position: "Cocinero",
      hireDate: "2024-01-01",
    })
    .returning();

  const [equipmentRow] = await db
    .insert(equipment)
    .values({
      companyId: company!.id,
      sedeId: sede!.id,
      name: `Nevera ${label}`,
      lastCalibrationDate: "2024-01-01",
      calibrationFrequency: "anual",
    })
    .returning();

  return {
    companyId: company!.id,
    sedeId: sede!.id,
    adminToken,
    employeeId: employee!.id,
    equipmentId: equipmentRow!.id,
  };
}

let tenantA: Tenant;
let tenantB: Tenant;
// Empresa en plan básico: sirve para probar que el módulo de Proveedores
// (feature Pro/Plus) queda cerrado por completo, no solo su escritura.
let tenantBasico: Tenant;
// Staff de BPM Consulting (companyId null): el único role que puede ver/editar
// el avance del Checklist Maestro de cualquier empresa cliente.
let bpmAdminToken: string;
let bpmAdminUserId: string;

beforeAll(async () => {
  tenantA = await seedTenant("A");
  tenantB = await seedTenant("B");
  tenantBasico = await seedTenant("Basico", "basico");

  const bpmEmail = `bpm-admin-${crypto.randomUUID()}@test.local`;
  const bpmPassword = "Password123!";
  const [bpmUser] = await db
    .insert(users)
    .values({
      companyId: null,
      sedeId: null,
      fullName: "BPM Admin Test",
      email: bpmEmail,
      passwordHash: await hashPassword(bpmPassword),
      role: "bpm_admin",
    })
    .returning();
  bpmAdminUserId = bpmUser!.id;

  const bpmLogin = await request("POST", "/auth/login", { body: { email: bpmEmail, password: bpmPassword } });
  if (bpmLogin.status !== 200) {
    throw new Error(`No se pudo autenticar el bpm_admin de prueba: ${JSON.stringify(bpmLogin.json)}`);
  }
  bpmAdminToken = (bpmLogin.json as { token: string }).token;
});

afterAll(async () => {
  // signatures.user_id es "restrict" (no cascade): hay que borrar las firmas
  // creadas en las pruebas antes de borrar las empresas/usuarios semilla, o
  // el delete de companies falla por violación de FK.
  const testUsers = await db.select({ id: users.id }).from(users).where(inArray(users.companyId, seededCompanyIds));
  if (testUsers.length > 0) {
    await db.delete(signatures).where(
      inArray(
        signatures.userId,
        testUsers.map((u) => u.id),
      ),
    );
  }

  for (const companyId of seededCompanyIds) {
    await db.delete(companies).where(eq(companies.id, companyId));
  }
  await db.delete(users).where(eq(users.id, bpmAdminUserId));
  await queryClient.end();
});

describe("aislamiento multi-tenant", () => {
  test("un admin no ve empleados de otra empresa en el listado", async () => {
    const res = await request("GET", "/employees", { token: tenantB.adminToken });
    expect(res.status).toBe(200);
    const ids = (res.json as { id: string }[]).map((e) => e.id);
    expect(ids).not.toContain(tenantA.employeeId);
  });

  test("GET /employees/:id de otra empresa devuelve 404, no el registro", async () => {
    const res = await request("GET", `/employees/${tenantA.employeeId}`, { token: tenantB.adminToken });
    expect(res.status).toBe(404);
  });

  test("PATCH /employees/:id de otra empresa devuelve 404 y no modifica el registro", async () => {
    const res = await request("PATCH", `/employees/${tenantA.employeeId}`, {
      token: tenantB.adminToken,
      body: { fullName: "Hackeado" },
    });
    expect(res.status).toBe(404);

    const [row] = await db.select().from(employees).where(eq(employees.id, tenantA.employeeId)).limit(1);
    expect(row!.fullName).toBe("Empleado A");
  });

  test("DELETE /employees/:id de otra empresa devuelve 404 y no lo desactiva", async () => {
    const res = await request("DELETE", `/employees/${tenantA.employeeId}`, { token: tenantB.adminToken });
    expect(res.status).toBe(404);

    const [row] = await db.select().from(employees).where(eq(employees.id, tenantA.employeeId)).limit(1);
    expect(row!.active).toBe(true);
  });

  test("un admin no ve equipos de otra empresa en el listado", async () => {
    const res = await request("GET", "/equipment", { token: tenantB.adminToken });
    expect(res.status).toBe(200);
    const ids = (res.json as { id: string }[]).map((e) => e.id);
    expect(ids).not.toContain(tenantA.equipmentId);
  });

  test("PATCH /equipment/:id de otra empresa devuelve 404 y no lo modifica", async () => {
    const res = await request("PATCH", `/equipment/${tenantA.equipmentId}`, {
      token: tenantB.adminToken,
      body: { name: "Hackeado" },
    });
    expect(res.status).toBe(404);

    const [row] = await db.select().from(equipment).where(eq(equipment.id, tenantA.equipmentId)).limit(1);
    expect(row!.name).toBe("Nevera A");
  });

  test("no se puede crear un formato diario usando la sede de otra empresa", async () => {
    const res = await request("POST", "/daily-forms/temperatura", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        formDate: "2024-01-01",
        payload: { responsable: "Admin B", equipos: [{ name: "Nevera 1", time: "08:00", temp: 4 }] },
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear un empleado usando la sede de otra empresa", async () => {
    const res = await request("POST", "/employees", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        fullName: "Intruso",
        documentId: "DOC-INTRUSO",
        position: "Cocinero",
        hireDate: "2024-01-01",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear un equipo usando la sede de otra empresa", async () => {
    const res = await request("POST", "/equipment", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        name: "Intruso",
        lastCalibrationDate: "2024-01-01",
        calibrationFrequency: "anual",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede reasignar un empleado propio a la sede de otra empresa vía PATCH", async () => {
    const res = await request("PATCH", `/employees/${tenantB.employeeId}`, {
      token: tenantB.adminToken,
      body: { sedeId: tenantA.sedeId },
    });
    expect(res.status).toBe(404);
  });

  test("un formato diario creado por la empresa A es invisible y no accesible para B", async () => {
    const created = await request("POST", "/daily-forms/temperatura", {
      token: tenantA.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        formDate: "2024-01-02",
        payload: { responsable: "Admin A", equipos: [{ name: "Nevera 1", time: "08:00", temp: 4 }] },
      },
    });
    expect(created.status).toBe(200);
    const dailyFormId = (created.json as { dailyForm: { id: string } }).dailyForm.id;

    const getRes = await request("GET", `/daily-forms/${dailyFormId}`, { token: tenantB.adminToken });
    expect(getRes.status).toBe(404);

    const listRes = await request("GET", "/daily-forms", { token: tenantB.adminToken });
    const ids = (listRes.json as { id: string }[]).map((f) => f.id);
    expect(ids).not.toContain(dailyFormId);
  });

  test("un admin no ve sedes de otra empresa en el listado", async () => {
    const res = await request("GET", "/sedes", { token: tenantB.adminToken });
    expect(res.status).toBe(200);
    const ids = (res.json as { id: string }[]).map((s) => s.id);
    expect(ids).not.toContain(tenantA.sedeId);
  });

  test("PATCH /sedes/:id de otra empresa devuelve 404 y no la modifica", async () => {
    const res = await request("PATCH", `/sedes/${tenantA.sedeId}`, {
      token: tenantB.adminToken,
      body: { name: "Hackeada" },
    });
    expect(res.status).toBe(404);

    const [row] = await db.select().from(sedes).where(eq(sedes.id, tenantA.sedeId)).limit(1);
    expect(row!.name).toBe("Sede A");
  });

  // Regresión: CreateScheduledEventUseCase dejaba pasar un sedeId ajeno y
  // terminaba en un 500 sin manejar (violación de FK) en vez de un 404
  // controlado. Ver misma cobertura para employees/equipment más arriba.
  test("no se puede crear un evento programado usando la sede de otra empresa", async () => {
    const res = await request("POST", "/scheduled-events", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        serviceType: "fumigacion",
        proposedDate: "2024-06-01",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede reasignar un evento programado propio a la sede de otra empresa vía PATCH", async () => {
    const created = await request("POST", "/scheduled-events", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantB.sedeId,
        serviceType: "fumigacion",
        proposedDate: "2024-06-01",
      },
    });
    expect(created.status).toBe(200);
    const scheduledEventId = (created.json as { scheduledEvent: { id: string } }).scheduledEvent.id;

    const res = await request("PATCH", `/scheduled-events/${scheduledEventId}`, {
      token: tenantB.adminToken,
      body: { sedeId: tenantA.sedeId },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear un anexo usando la sede de otra empresa", async () => {
    const res = await request("POST", "/attachments", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        category: "certificado",
        name: "Anexo intruso",
        fileKey: "test/intruso.pdf",
        fileUrl: "https://example.com/intruso.pdf",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear un documento fijo usando la sede de otra empresa", async () => {
    const res = await request("POST", "/fixed-documents", {
      token: tenantB.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        name: "Documento intruso",
        fileKey: "test/intruso.pdf",
        fileUrl: "https://example.com/intruso.pdf",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear un documento de proveedor sobre un supplierId de otra empresa", async () => {
    const created = await request("POST", "/suppliers", {
      token: tenantA.adminToken,
      body: { name: "Proveedor A" },
    });
    expect(created.status).toBe(200);
    const supplierId = (created.json as { supplier: { id: string } }).supplier.id;

    const res = await request("POST", `/suppliers/${supplierId}/documents`, {
      token: tenantB.adminToken,
      body: {
        label: "Documento intruso",
        fileKey: "test/intruso.pdf",
        fileUrl: "https://example.com/intruso.pdf",
      },
    });
    expect(res.status).toBe(404);
  });

  test("no se puede crear una evaluación de proveedor sobre un supplierId de otra empresa", async () => {
    const created = await request("POST", "/suppliers", {
      token: tenantA.adminToken,
      body: { name: "Proveedor A para evaluación" },
    });
    expect(created.status).toBe(200);
    const supplierId = (created.json as { supplier: { id: string } }).supplier.id;

    const res = await request("POST", `/suppliers/${supplierId}/evaluations`, {
      token: tenantB.adminToken,
      body: { evaluatedAt: "2024-01-01", score: 80 },
    });
    expect(res.status).toBe(404);
  });

  // El módulo de Proveedores completo (lecturas incluidas) requiere plan
  // Pro/Plus — no solo las escrituras. requireSuppliersPlan corre antes de
  // cualquier otra validación en los 7 casos de uso del módulo.
  test("en plan básico, todos los endpoints de /suppliers devuelven 403", async () => {
    const fakeId = crypto.randomUUID();
    const cases: { method: string; path: string; body?: unknown }[] = [
      { method: "GET", path: "/suppliers" },
      { method: "GET", path: `/suppliers/${fakeId}` },
      { method: "GET", path: `/suppliers/${fakeId}/evaluations` },
      { method: "POST", path: "/suppliers", body: { name: "Proveedor básico" } },
      { method: "PATCH", path: `/suppliers/${fakeId}`, body: { name: "Nombre nuevo" } },
      {
        method: "POST",
        path: `/suppliers/${fakeId}/documents`,
        body: { label: "Documento x", fileKey: "test/x.pdf", fileUrl: "https://example.com/x.pdf" },
      },
      {
        method: "POST",
        path: `/suppliers/${fakeId}/evaluations`,
        body: { evaluatedAt: "2024-01-01", score: 50 },
      },
    ];

    for (const { method, path, body } of cases) {
      const res = await request(method, path, { token: tenantBasico.adminToken, body });
      expect(res.status).toBe(403);
    }
  });

  test("no se puede crear un recall sobre un lotId de otra empresa", async () => {
    const created = await request("POST", "/lots", {
      token: tenantA.adminToken,
      body: {
        sedeId: tenantA.sedeId,
        productName: "Producto A",
        lotCode: "LOTE-A-1",
        receivedDate: "2024-01-01",
      },
    });
    expect(created.status).toBe(200);
    const lotId = (created.json as { lot: { id: string } }).lot.id;

    const res = await request("POST", `/lots/${lotId}/recall`, {
      token: tenantB.adminToken,
      body: { reason: "Retiro intruso" },
    });
    expect(res.status).toBe(404);
  });

  // El módulo de Trazabilidad y Recall completo (lecturas incluidas) requiere
  // plan Pro/Plus — no solo las escrituras. requireTraceabilityPlan corre
  // antes de cualquier otra validación en los 4 casos de uso del módulo.
  test("en plan básico, todos los endpoints de trazabilidad devuelven 403", async () => {
    const fakeId = crypto.randomUUID();
    const cases: { method: string; path: string; body?: unknown }[] = [
      { method: "GET", path: "/lots" },
      {
        method: "POST",
        path: "/lots",
        body: { sedeId: fakeId, productName: "Producto básico", lotCode: "LOTE-X", receivedDate: "2024-01-01" },
      },
      { method: "POST", path: `/lots/${fakeId}/recall`, body: { reason: "Retiro básico" } },
      { method: "GET", path: "/recalls" },
    ];

    for (const { method, path, body } of cases) {
      const res = await request(method, path, { token: tenantBasico.adminToken, body });
      expect(res.status).toBe(403);
    }
  });

  test("una no conformidad de otra empresa devuelve 404 al leerla y al cerrarla", async () => {
    const created = await request("POST", "/non-conformities", {
      token: tenantA.adminToken,
      body: { sedeId: tenantA.sedeId, description: "Hallazgo de empresa A" },
    });
    expect(created.status).toBe(200);
    const nonConformityId = (created.json as { nonConformity: { id: string } }).nonConformity.id;

    const getRes = await request("GET", `/non-conformities/${nonConformityId}`, { token: tenantB.adminToken });
    expect(getRes.status).toBe(404);

    const closeRes = await request("PATCH", `/non-conformities/${nonConformityId}/close`, {
      token: tenantB.adminToken,
      body: { correctiveAction: "Cierre intruso" },
    });
    expect(closeRes.status).toBe(404);
  });

  // CloseNonConformityUseCase: no se puede pasar a status "cerrada" sin una
  // acción correctiva no vacía (ValidationError -> 400). Antes solo se había
  // verificado manualmente con curl; ahora queda como aserción automatizada.
  test("cerrar una no conformidad sin acción correctiva devuelve 400, y con ella queda cerrada", async () => {
    const created = await request("POST", "/non-conformities", {
      token: tenantA.adminToken,
      body: { sedeId: tenantA.sedeId, description: "Temperatura fuera de rango" },
    });
    expect(created.status).toBe(200);
    const nonConformityId = (created.json as { nonConformity: { id: string } }).nonConformity.id;

    const withoutAction = await request("PATCH", `/non-conformities/${nonConformityId}/close`, {
      token: tenantA.adminToken,
      body: {},
    });
    expect(withoutAction.status).toBe(400);

    const withAction = await request("PATCH", `/non-conformities/${nonConformityId}/close`, {
      token: tenantA.adminToken,
      body: { correctiveAction: "Se recalibró el termostato." },
    });
    expect(withAction.status).toBe(200);
    expect((withAction.json as { nonConformity: { status: string } }).nonConformity.status).toBe("cerrada");
  });

  // No Conformidades e Incidentes (CAPA) completo (lecturas incluidas)
  // requiere plan Pro/Plus — requireQualityPlan corre antes de cualquier
  // otra validación en los 8 casos de uso del módulo.
  test("en plan básico, todos los endpoints de /non-conformities e /incidents devuelven 403", async () => {
    const fakeId = crypto.randomUUID();
    const cases: { method: string; path: string; body?: unknown }[] = [
      { method: "GET", path: "/non-conformities" },
      { method: "GET", path: `/non-conformities/${fakeId}` },
      { method: "POST", path: "/non-conformities", body: { sedeId: fakeId, description: "Hallazgo básico" } },
      { method: "PATCH", path: `/non-conformities/${fakeId}`, body: { description: "Actualizado" } },
      { method: "PATCH", path: `/non-conformities/${fakeId}/close`, body: { correctiveAction: "Acción" } },
      { method: "GET", path: "/incidents" },
      { method: "GET", path: `/incidents/${fakeId}` },
      {
        method: "POST",
        path: "/incidents",
        body: { sedeId: fakeId, description: "Incidente básico", occurredAt: "2024-01-01T00:00:00Z" },
      },
    ];

    for (const { method, path, body } of cases) {
      const res = await request(method, path, { token: tenantBasico.adminToken, body });
      expect(res.status).toBe(403);
    }
  });

  // Notifications no tiene endpoint de creación propio (las filas las crea
  // CheckAlertsUseCase), así que la de empresa A se siembra directo en la
  // tabla, igual que employees/equipment en seedTenant.
  test("una notificación de otra empresa no aparece en el listado y devuelve 404 al marcarla como leída", async () => {
    const [notification] = await db
      .insert(notifications)
      .values({
        companyId: tenantA.companyId,
        sedeId: tenantA.sedeId,
        type: "examen_medico",
        referenceTable: "employees",
        referenceId: tenantA.employeeId,
        title: "Certificado médico por vencer o vencido",
        message: `Empleado A`,
      })
      .returning();

    const listRes = await request("GET", "/notifications", { token: tenantB.adminToken });
    expect(listRes.status).toBe(200);
    const ids = (listRes.json as { id: string }[]).map((n) => n.id);
    expect(ids).not.toContain(notification!.id);

    const readRes = await request("PATCH", `/notifications/${notification!.id}/read`, {
      token: tenantB.adminToken,
    });
    expect(readRes.status).toBe(404);

    const [row] = await db.select().from(notifications).where(eq(notifications.id, notification!.id)).limit(1);
    expect(row!.status).toBe("pendiente");
  });

  test("GET /employees/:id/trainings de otra empresa devuelve 404", async () => {
    const res = await request("GET", `/employees/${tenantA.employeeId}/trainings`, {
      token: tenantB.adminToken,
    });
    expect(res.status).toBe(404);
  });

  test("POST /employees/:id/trainings de otra empresa devuelve 404 y no crea el registro ni incrementa horas", async () => {
    const [before] = await db.select().from(employees).where(eq(employees.id, tenantA.employeeId)).limit(1);

    const res = await request("POST", `/employees/${tenantA.employeeId}/trainings`, {
      token: tenantB.adminToken,
      body: { topic: "Manipulación de alimentos", trainingDate: "2024-01-01", hours: 8 },
    });
    expect(res.status).toBe(404);

    const rows = await db.select().from(trainings).where(eq(trainings.employeeId, tenantA.employeeId));
    expect(rows).toHaveLength(0);

    const [after] = await db.select().from(employees).where(eq(employees.id, tenantA.employeeId)).limit(1);
    expect(after!.trainingHoursCompleted).toBe(before!.trainingHoursCompleted);
  });

  test("sin token, todos los endpoints scoped devuelven 401", async () => {
    const endpoints = ["/employees", "/equipment", "/daily-forms", "/sedes"];
    for (const path of endpoints) {
      const res = await request("GET", path);
      expect(res.status).toBe(401);
    }
  });
});

describe("Checklist Maestro (panel interno BPM Consulting)", () => {
  test("un admin de empresa cliente (no bpm_admin) no puede listar todas las empresas", async () => {
    const res = await request("GET", "/companies", { token: tenantA.adminToken });
    expect(res.status).toBe(403);
  });

  test("bpm_admin puede listar todas las empresas clientes (selector del panel)", async () => {
    const res = await request("GET", "/companies", { token: bpmAdminToken });
    expect(res.status).toBe(200);
    const ids = (res.json as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(tenantA.companyId);
    expect(ids).toContain(tenantB.companyId);
  });

  test("GET /checklist/catalog es visible para cualquier usuario autenticado, no solo bpm_admin", async () => {
    const res = await request("GET", "/checklist/catalog", { token: tenantA.adminToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json)).toBe(true);
    expect((res.json as unknown[]).length).toBeGreaterThan(0);
  });

  test("un admin de empresa cliente (no bpm_admin) no puede ver el avance de checklist de ninguna empresa", async () => {
    const res = await request("GET", `/companies/${tenantA.companyId}/checklist-status`, {
      token: tenantA.adminToken,
    });
    expect(res.status).toBe(403);
  });

  test("un admin de empresa cliente (no bpm_admin) no puede editar el avance de checklist", async () => {
    const [item] = await db.select().from(checklistCatalog).limit(1);
    const res = await request("PATCH", `/companies/${tenantA.companyId}/checklist-status/${item!.id}`, {
      token: tenantA.adminToken,
      body: { status: "completo" },
    });
    expect(res.status).toBe(403);
  });

  test("bpm_admin puede ver el avance de checklist de cualquier empresa cliente", async () => {
    const catalog = await db.select().from(checklistCatalog);
    const res = await request("GET", `/companies/${tenantA.companyId}/checklist-status`, {
      token: bpmAdminToken,
    });
    expect(res.status).toBe(200);
    const items = res.json as { status: string }[];
    expect(items).toHaveLength(catalog.length);
    expect(items.every((i) => i.status === "pendiente")).toBe(true);
  });

  test("bpm_admin puede actualizar status/notes de un ítem, y el cambio queda al volver a consultar", async () => {
    const [item] = await db.select().from(checklistCatalog).limit(1);

    const patchRes = await request("PATCH", `/companies/${tenantB.companyId}/checklist-status/${item!.id}`, {
      token: bpmAdminToken,
      body: { status: "en_desarrollo", notes: "En progreso, falta evidencia fotográfica." },
    });
    expect(patchRes.status).toBe(200);
    const patched = (patchRes.json as { item: { status: string; notes: string | null } }).item;
    expect(patched.status).toBe("en_desarrollo");
    expect(patched.notes).toBe("En progreso, falta evidencia fotográfica.");

    const listRes = await request("GET", `/companies/${tenantB.companyId}/checklist-status`, {
      token: bpmAdminToken,
    });
    const updatedItem = (listRes.json as { id: string; status: string }[]).find((i) => i.id === item!.id);
    expect(updatedItem?.status).toBe("en_desarrollo");

    // La empresa A no debe verse afectada por el cambio hecho sobre la B.
    const listResA = await request("GET", `/companies/${tenantA.companyId}/checklist-status`, {
      token: bpmAdminToken,
    });
    const itemInA = (listResA.json as { id: string; status: string }[]).find((i) => i.id === item!.id);
    expect(itemInA?.status).toBe("pendiente");
  });

  test("GET /companies/:companyId/checklist-status de una empresa inexistente devuelve 404", async () => {
    const res = await request("GET", `/companies/${crypto.randomUUID()}/checklist-status`, {
      token: bpmAdminToken,
    });
    expect(res.status).toBe(404);
  });

  test("PATCH de un ítem que no existe en el catálogo devuelve 404", async () => {
    const res = await request("PATCH", `/companies/${tenantA.companyId}/checklist-status/${crypto.randomUUID()}`, {
      token: bpmAdminToken,
      body: { status: "completo" },
    });
    expect(res.status).toBe(404);
  });
});

describe("red de seguridad: onError global vs. rutas 'naked' sin try/catch", () => {
  // bpm_admin tiene companyId: null en el JWT. Varias rutas GET "/" listan
  // recursos llamando a toScope(user!) sin envolverlo en try/catch (asumían
  // que todo usuario autenticado tiene empresa). Antes de agregar el
  // .onError global, esto escapaba como 500 crudo de Elysia en vez del 400
  // que mapError ya define para ValidationError. Estas pruebas fijan que
  // ahora responden limpio, sin importar que el handler no tenga su propio
  // try/catch.
  test("GET /employees con bpm_admin (sin empresa) devuelve 400 limpio, no 500 crudo", async () => {
    const res = await request("GET", "/employees", { token: bpmAdminToken });
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: "El usuario no está asociado a ninguna empresa." });
  });

  test("GET /equipment con bpm_admin (sin empresa) devuelve 400 limpio, no 500 crudo", async () => {
    const res = await request("GET", "/equipment", { token: bpmAdminToken });
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: "El usuario no está asociado a ninguna empresa." });
  });

  test("GET /notifications con bpm_admin (sin empresa) devuelve 400 limpio, no 500 crudo", async () => {
    const res = await request("GET", "/notifications", { token: bpmAdminToken });
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: "El usuario no está asociado a ninguna empresa." });
  });

  // El global es una red de seguridad adicional, no un reemplazo: los
  // handlers que ya envuelven toScope()/el caso de uso en su propio
  // try/catch + mapError deben seguir respondiendo exactamente igual.
  test("GET /employees/:id de otra empresa sigue devolviendo 404 vía su propio try/catch (no cambia con el onError global)", async () => {
    const res = await request("GET", `/employees/${tenantB.employeeId}`, { token: tenantA.adminToken });
    expect(res.status).toBe(404);
  });

  test("POST /equipment con body inválido sigue devolviendo 422 nativo de Elysia (no cambia con el onError global)", async () => {
    // Este 422 lo genera la validación de esquema (TypeBox) de Elysia antes
    // de llegar al handler — es un código distinto al ValidationError de
    // dominio que usa mapError, y confirma que el onError global no
    // intercepta ni reformatea las validaciones nativas de Elysia.
    const res = await request("POST", "/equipment", {
      token: tenantA.adminToken,
      body: { sedeId: tenantA.sedeId, name: "", calibrationFrequency: "anual", lastCalibrationDate: "2024-01-01" },
    });
    expect(res.status).toBe(422);
  });

  test("PATCH /non-conformities/:id/close sin acción correctiva sigue devolviendo 400 vía su propio try/catch + ValidationError de dominio (no cambia con el onError global)", async () => {
    const createRes = await request("POST", "/non-conformities", {
      token: tenantA.adminToken,
      body: { sedeId: tenantA.sedeId, sourceType: "manual", description: "Hallazgo de prueba", severity: "media" },
    });
    const created = (createRes.json as { nonConformity: { id: string } }).nonConformity;
    const res = await request("PATCH", `/non-conformities/${created.id}/close`, {
      token: tenantA.adminToken,
      body: { correctiveAction: "" },
    });
    expect(res.status).toBe(400);
    expect((res.json as { error: string }).error).toBe(
      "Debes registrar la acción correctiva antes de cerrar la no conformidad.",
    );
  });
});

describe("Firmas electrónicas (signatures)", () => {
  async function createFixedDocument(tenant: Tenant, label: string) {
    const res = await request("POST", "/fixed-documents", {
      token: tenant.adminToken,
      body: {
        sedeId: tenant.sedeId,
        name: `Documento ${label}`,
        fileKey: `test/${label}.pdf`,
        fileUrl: `https://example.com/${label}.pdf`,
      },
    });
    expect(res.status).toBe(200);
    return (res.json as { document: { id: string } }).document.id;
  }

  test("GET /signatures con entityId de un fixed_document de otra empresa devuelve 404", async () => {
    const documentId = await createFixedDocument(tenantA, "firma-get-cruzado");
    const res = await request(
      "GET",
      `/signatures?entityType=fixed_document&entityId=${documentId}`,
      { token: tenantB.adminToken },
    );
    expect(res.status).toBe(404);
  });

  test("POST /signatures con entityId de un fixed_document de otra empresa devuelve 404 y no crea la firma", async () => {
    const documentId = await createFixedDocument(tenantA, "firma-post-cruzado");
    const res = await request("POST", "/signatures", {
      token: tenantB.adminToken,
      body: { entityType: "fixed_document", entityId: documentId },
    });
    expect(res.status).toBe(404);
  });

  test("POST /signatures con un entityType no soportado devuelve 400", async () => {
    const documentId = await createFixedDocument(tenantA, "firma-tipo-invalido");
    const res = await request("POST", "/signatures", {
      token: tenantA.adminToken,
      body: { entityType: "daily_form", entityId: documentId },
    });
    expect(res.status).toBe(400);
  });

  async function createNonConformity(tenant: Tenant, description: string) {
    const res = await request("POST", "/non-conformities", {
      token: tenant.adminToken,
      body: { sedeId: tenant.sedeId, description },
    });
    expect(res.status).toBe(200);
    return (res.json as { nonConformity: { id: string } }).nonConformity.id;
  }

  test("GET/POST /signatures con entityId de una non_conformity de otra empresa devuelven 404", async () => {
    const nonConformityId = await createNonConformity(tenantA, "Hallazgo firma cruzada");

    const getRes = await request(
      "GET",
      `/signatures?entityType=non_conformity&entityId=${nonConformityId}`,
      { token: tenantB.adminToken },
    );
    expect(getRes.status).toBe(404);

    const postRes = await request("POST", "/signatures", {
      token: tenantB.adminToken,
      body: { entityType: "non_conformity", entityId: nonConformityId },
    });
    expect(postRes.status).toBe(404);
  });

  test("POST /signatures crea una firma sobre una non_conformity propia y aparece en el GET", async () => {
    const nonConformityId = await createNonConformity(tenantA, "Hallazgo firma exitosa");

    const createRes = await request("POST", "/signatures", {
      token: tenantA.adminToken,
      body: { entityType: "non_conformity", entityId: nonConformityId },
    });
    expect(createRes.status).toBe(200);

    const listRes = await request(
      "GET",
      `/signatures?entityType=non_conformity&entityId=${nonConformityId}`,
      { token: tenantA.adminToken },
    );
    expect(listRes.status).toBe(200);
    const signatures = listRes.json as { entityId: string }[];
    expect(signatures).toHaveLength(1);
    expect(signatures[0]!.entityId).toBe(nonConformityId);
  });

  test("POST /signatures crea una firma con userId, IP y hash SHA-256, y GET la lista después", async () => {
    const documentId = await createFixedDocument(tenantA, "firma-exitosa");
    const createRes = await request("POST", "/signatures", {
      token: tenantA.adminToken,
      body: { entityType: "fixed_document", entityId: documentId },
    });
    expect(createRes.status).toBe(200);
    const signature = (createRes.json as { signature: { hash: string; userId: string; entityId: string } }).signature;
    expect(signature.entityId).toBe(documentId);
    expect(signature.hash).toMatch(/^[0-9a-f]{64}$/);

    const listRes = await request(
      "GET",
      `/signatures?entityType=fixed_document&entityId=${documentId}`,
      { token: tenantA.adminToken },
    );
    expect(listRes.status).toBe(200);
    const signatures = listRes.json as { hash: string }[];
    expect(signatures.some((s) => s.hash === signature.hash)).toBe(true);
  });

  test("aprobar un documento fijo crea automáticamente una firma de auditoría", async () => {
    const documentId = await createFixedDocument(tenantA, "firma-al-aprobar");

    const approveRes = await request("PATCH", `/fixed-documents/${documentId}/approve`, {
      token: tenantA.adminToken,
    });
    expect(approveRes.status).toBe(200);

    const listRes = await request(
      "GET",
      `/signatures?entityType=fixed_document&entityId=${documentId}`,
      { token: tenantA.adminToken },
    );
    expect(listRes.status).toBe(200);
    const signatures = listRes.json as { entityId: string }[];
    expect(signatures).toHaveLength(1);
    expect(signatures[0]!.entityId).toBe(documentId);
  });

  test("GET y POST /signatures con bpm_admin (sin empresa) devuelven 400 limpio, no 500 crudo", async () => {
    const getRes = await request(
      "GET",
      `/signatures?entityType=fixed_document&entityId=${crypto.randomUUID()}`,
      { token: bpmAdminToken },
    );
    expect(getRes.status).toBe(400);
    expect(getRes.json).toEqual({ error: "El usuario no está asociado a ninguna empresa." });

    const postRes = await request("POST", "/signatures", {
      token: bpmAdminToken,
      body: { entityType: "fixed_document", entityId: crypto.randomUUID() },
    });
    expect(postRes.status).toBe(400);
    expect(postRes.json).toEqual({ error: "El usuario no está asociado a ninguna empresa." });
  });
});

// Reportes (actas de inspección en PDF): módulo de agregación de solo
// lectura. Estos tests cubren únicamente las 3 rutas que cortocircuitan
// ANTES de llegar a generar el PDF y subirlo a S3 (plan-gating, sede
// cruzada, rango de fechas inválido) — el caso de éxito (PDF real +
// storage.upload) se cubre aparte con repositorios/puertos falsos en
// generate-inspection-report.use-case.test.ts, porque este entorno no
// tiene credenciales S3 reales configuradas (ver .env: S3_ACCESS_KEY_ID
// y S3_SECRET_ACCESS_KEY vacías, sin contenedor MinIO en docker-compose.yml).
describe("Reportes (actas de inspección en PDF)", () => {
  test("en plan básico, POST /reports/inspection-report devuelve 403", async () => {
    const res = await request("POST", "/reports/inspection-report", {
      token: tenantBasico.adminToken,
      body: { sedeId: tenantBasico.sedeId, from: "2024-01-01", to: "2024-01-31" },
    });
    expect(res.status).toBe(403);
  });

  test("sedeId de otra empresa devuelve 404 y no genera el PDF", async () => {
    const res = await request("POST", "/reports/inspection-report", {
      token: tenantB.adminToken,
      body: { sedeId: tenantA.sedeId, from: "2024-01-01", to: "2024-01-31" },
    });
    expect(res.status).toBe(404);
  });

  test("from posterior a to devuelve 400", async () => {
    const res = await request("POST", "/reports/inspection-report", {
      token: tenantA.adminToken,
      body: { sedeId: tenantA.sedeId, from: "2024-02-01", to: "2024-01-01" },
    });
    expect(res.status).toBe(400);
  });
});
