import { randomBytes } from "crypto";
import { eq as sqlEq, and as sqlAnd } from "drizzle-orm";
import { db } from "./client";
import { companies, sedes, users, employees, equipment, dailyForms, checklistCatalog } from "./schema";
import { hashPassword } from "../lib/password";
import { addMonths, addYears, toISODate } from "../lib/dates";
import { PLAN_SEDES_INCLUDED, type Plan } from "../config/plans";
import { checklistMaestroSeed, perfilesPorNegocioSeed } from "./seed-data/checklist-maestro";

// Uso: bun run db:seed:demo
//
// Siembra datos DEMO en una base de producción vacía (migraciones ya
// aplicadas, sin filas) para que el equipo de BPM Consulting revise la
// plataforma desplegada. A diferencia de seed.ts (uso en desarrollo), este
// script:
//   - genera una contraseña aleatoria distinta por usuario (nunca reutiliza
//     "CambiaEstaClave123!" ni ninguna otra del código/documentación),
//     hasheada con el mismo mecanismo que el registro real (hashPassword,
//     Bun.password/argon2id) — nunca inserta hashes a mano;
//   - es seguro de re-correr: cada paso verifica existencia antes de
//     insertar (por email en users, por nit en companies) y no falla ni
//     duplica si se ejecuta más de una vez;
//   - al final imprime una tabla con email + password de cada usuario CREADO
//     en esta corrida (los que ya existían no vuelven a aparecer, porque no
//     se les generó contraseña nueva).

interface CreatedUserRow {
  empresa: string;
  rol: string;
  email: string;
  password: string;
}

const createdUsers: CreatedUserRow[] = [];

function generatePassword(): string {
  // Equivalente a `openssl rand -base64 16`: 16 bytes de entropía en base64.
  return randomBytes(16).toString("base64");
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function seedChecklistCatalog() {
  const existing = await db.select({ id: checklistCatalog.id }).from(checklistCatalog).limit(1);
  if (existing.length > 0) {
    console.log("· checklist_catalog ya tiene datos, se omite el seed.");
    return;
  }
  const rows = [...checklistMaestroSeed, ...perfilesPorNegocioSeed];
  await db.insert(checklistCatalog).values(rows);
  console.log(`· checklist_catalog: ${rows.length} ítems insertados (Checklist Maestro + Perfiles por Negocio).`);
}

async function getOrCreateUser(params: {
  email: string;
  fullName: string;
  role: "bpm_admin" | "admin" | "supervisor" | "operario";
  companyId: string | null;
  sedeId: string | null;
  empresaLabel: string;
}): Promise<{ id: string; created: boolean }> {
  const [existing] = await db.select().from(users).where(sqlEq(users.email, params.email)).limit(1);
  if (existing) {
    console.log(`  · Usuario ${params.email} ya existe, se omite.`);
    return { id: existing.id, created: false };
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      companyId: params.companyId,
      sedeId: params.sedeId,
      fullName: params.fullName,
      email: params.email,
      passwordHash,
      role: params.role,
    })
    .returning();

  createdUsers.push({ empresa: params.empresaLabel, rol: params.role, email: params.email, password });
  console.log(`  · Usuario creado: ${params.email} (${params.role})`);
  return { id: user!.id, created: true };
}

async function seedBpmAdmin() {
  console.log("Sembrando usuario bpm_admin...");
  await getOrCreateUser({
    email: "staff@bpmconsulting.co",
    fullName: "Staff BPM Consulting",
    role: "bpm_admin",
    companyId: null,
    sedeId: null,
    empresaLabel: "BPM Consulting (staff)",
  });
}

async function getOrCreateCompany(params: {
  name: string;
  nit: string;
  email: string;
  plan: Plan;
  businessProfile: "restaurante_general" | "carnicos" | "bodega_almacenamiento" | "ambulantes";
  sedeName: string;
}): Promise<{ companyId: string; sedeId: string; created: boolean }> {
  const [existingCompany] = await db.select().from(companies).where(sqlEq(companies.nit, params.nit)).limit(1);
  if (existingCompany) {
    const [existingSede] = await db
      .select()
      .from(sedes)
      .where(sqlAnd(sqlEq(sedes.companyId, existingCompany.id), sqlEq(sedes.isMain, true)))
      .limit(1);
    console.log(`· Empresa "${params.name}" ya existe, se omite creación.`);
    return { companyId: existingCompany.id, sedeId: existingSede!.id, created: false };
  }

  const [company] = await db
    .insert(companies)
    .values({
      name: params.name,
      nit: params.nit,
      email: params.email,
      plan: params.plan,
      status: "prueba",
      businessProfile: params.businessProfile,
      sedesIncluded: PLAN_SEDES_INCLUDED[params.plan],
    })
    .returning();

  const [sede] = await db
    .insert(sedes)
    .values({ companyId: company!.id, name: params.sedeName, isMain: true })
    .returning();

  console.log(`· Empresa creada: ${company!.name} (plan ${params.plan}, sede "${sede!.name}")`);
  return { companyId: company!.id, sedeId: sede!.id, created: true };
}

async function seedDemoCompanies() {
  console.log("Sembrando empresas demo (una por plan)...");

  // Plan Básico: solo empresa + sede + admin.
  const basico = await getOrCreateCompany({
    name: "Panadería El Trigal S.A.S.",
    nit: "900.111.222-1",
    email: "admin@eltrigal.demo",
    plan: "basico",
    businessProfile: "restaurante_general",
    sedeName: "Sede Principal",
  });
  await getOrCreateUser({
    email: "admin@eltrigal.demo",
    fullName: "Admin El Trigal",
    role: "admin",
    companyId: basico.companyId,
    sedeId: null,
    empresaLabel: "Panadería El Trigal (Básico)",
  });

  // Plan Pro: empresa + sede + admin + datos de ejemplo (empleados, equipos, formatos).
  const pro = await getOrCreateCompany({
    name: "Restaurante Sabor Costeño S.A.S.",
    nit: "900.222.333-2",
    email: "admin@saborcosteno.demo",
    plan: "pro",
    businessProfile: "restaurante_general",
    sedeName: "Sede Principal",
  });
  const proAdmin = await getOrCreateUser({
    email: "admin@saborcosteno.demo",
    fullName: "Admin Sabor Costeño",
    role: "admin",
    companyId: pro.companyId,
    sedeId: null,
    empresaLabel: "Restaurante Sabor Costeño (Pro)",
  });
  await seedProSampleData(pro.companyId, pro.sedeId, proAdmin.id);

  // Plan Plus: empresa + sede + admin + supervisor + operario.
  const plus = await getOrCreateCompany({
    name: "Cadena La Nevera Fría S.A.S.",
    nit: "900.333.444-3",
    email: "admin@laneverafria.demo",
    plan: "plus",
    businessProfile: "bodega_almacenamiento",
    sedeName: "Sede Principal",
  });
  await getOrCreateUser({
    email: "admin@laneverafria.demo",
    fullName: "Admin La Nevera Fría",
    role: "admin",
    companyId: plus.companyId,
    sedeId: null,
    empresaLabel: "Cadena La Nevera Fría (Plus)",
  });
  await getOrCreateUser({
    email: "supervisor@laneverafria.demo",
    fullName: "Supervisor La Nevera Fría",
    role: "supervisor",
    companyId: plus.companyId,
    sedeId: plus.sedeId,
    empresaLabel: "Cadena La Nevera Fría (Plus)",
  });
  await getOrCreateUser({
    email: "operario@laneverafria.demo",
    fullName: "Operario La Nevera Fría",
    role: "operario",
    companyId: plus.companyId,
    sedeId: plus.sedeId,
    empresaLabel: "Cadena La Nevera Fría (Plus)",
  });
}

async function seedProSampleData(companyId: string, sedeId: string, adminUserId: string) {
  const existingEmployee = await db
    .select({ id: employees.id })
    .from(employees)
    .where(sqlEq(employees.companyId, companyId))
    .limit(1);

  if (existingEmployee.length === 0) {
    const today = new Date();
    const employeeDefs = [
      // vencido: el examen vence hace ~10 días
      { fullName: "María Fernanda López", position: "Cocinera", hireDate: addMonths(today, -28), medicalExamDate: addDays(addYears(today, -1), -10), hasFoodHandlerCert: true, trainingHoursCompleted: 8 },
      // vencido, hace más tiempo
      { fullName: "Carlos Andrés Gómez", position: "Mesero", hireDate: addMonths(today, -18), medicalExamDate: addDays(addYears(today, -1), -60), hasFoodHandlerCert: true, trainingHoursCompleted: 10 },
      // por_vencer: vence en ~20 días
      { fullName: "Laura Vanessa Ríos", position: "Auxiliar de Cocina", hireDate: addMonths(today, -6), medicalExamDate: addDays(addYears(today, -1), 20), hasFoodHandlerCert: false, trainingHoursCompleted: 3 },
      // vigente, con margen amplio
      { fullName: "Jorge Luis Martínez", position: "Jefe de Cocina", hireDate: addMonths(today, -44), medicalExamDate: addDays(addYears(today, -1), 200), hasFoodHandlerCert: true, trainingHoursCompleted: 10 },
    ];

    for (const [i, def] of employeeDefs.entries()) {
      const medicalExamExpiry = addYears(def.medicalExamDate, 1);
      await db.insert(employees).values({
        companyId,
        sedeId,
        fullName: def.fullName,
        documentId: `100${i}${Math.floor(Math.random() * 900000 + 100000)}`,
        position: def.position,
        hireDate: toISODate(def.hireDate),
        medicalExamDate: toISODate(def.medicalExamDate),
        medicalExamExpiry: toISODate(medicalExamExpiry),
        hasFoodHandlerCert: def.hasFoodHandlerCert,
        trainingHoursCompleted: def.trainingHoursCompleted,
        trainingHoursRequired: 10,
      });
    }
    console.log(`  · ${employeeDefs.length} empleados de ejemplo creados (Restaurante Sabor Costeño).`);
  } else {
    console.log("  · Ya hay empleados en Restaurante Sabor Costeño, se omite.");
  }

  const existingEquipment = await db
    .select({ id: equipment.id })
    .from(equipment)
    .where(sqlEq(equipment.companyId, companyId))
    .limit(1);

  let firstEquipmentName = "Nevera Industrial 1";

  if (existingEquipment.length === 0) {
    const today = new Date();
    const equipmentDefs = [
      // vencido: próxima calibración hace ~10 días
      { name: "Nevera Industrial 1", brandModel: "Frigidaire Commercial", locationArea: "Cocina fría", calibrationFrequency: "semestral" as const, lastCalibrationDate: addDays(addMonths(today, -6), -10) },
      // por_vencer: próxima calibración en ~20 días
      { name: "Horno Combinado", brandModel: "Rational SelfCookingCenter", locationArea: "Cocina caliente", calibrationFrequency: "anual" as const, lastCalibrationDate: addDays(addMonths(today, -12), 20) },
      // vigente, con margen amplio
      { name: "Congelador Vertical", brandModel: "Imbera VR-40", locationArea: "Bodega", calibrationFrequency: "bianual" as const, lastCalibrationDate: addDays(addMonths(today, -24), 200) },
    ];

    for (const def of equipmentDefs) {
      const nextCalibrationDate = addMonths(def.lastCalibrationDate, { semestral: 6, anual: 12, bianual: 24 }[def.calibrationFrequency]);
      await db.insert(equipment).values({
        companyId,
        sedeId,
        name: def.name,
        brandModel: def.brandModel,
        locationArea: def.locationArea,
        lastCalibrationDate: toISODate(def.lastCalibrationDate),
        calibrationFrequency: def.calibrationFrequency,
        nextCalibrationDate: toISODate(nextCalibrationDate),
      });
    }
    firstEquipmentName = equipmentDefs[0]!.name;
    console.log(`  · ${equipmentDefs.length} equipos de ejemplo creados (Restaurante Sabor Costeño).`);
  } else {
    console.log("  · Ya hay equipos en Restaurante Sabor Costeño, se omite.");
  }

  const existingForms = await db
    .select({ id: dailyForms.id })
    .from(dailyForms)
    .where(sqlEq(dailyForms.companyId, companyId))
    .limit(1);

  if (existingForms.length === 0) {
    const today = new Date();
    await db.insert(dailyForms).values({
      companyId,
      sedeId,
      formType: "temperatura",
      formDate: toISODate(addDays(today, -1)),
      shift: "manana",
      submittedBy: adminUserId,
      payload: {
        equipos: [
          { name: firstEquipmentName, time: "08:00", temp: 4 },
          { name: "Congelador Vertical", time: "08:05", temp: -18 },
        ],
      },
      observations: "Registro de apertura de turno, sin novedades.",
    });

    await db.insert(dailyForms).values({
      companyId,
      sedeId,
      formType: "higiene",
      formDate: toISODate(today),
      submittedBy: adminUserId,
      payload: {
        auditor: "Jorge Luis Martínez",
        empleados: [
          { nombre: "María Fernanda López", uniformeLimpio: true, unasLimpias: true, sinJoyas: true, saludOk: true },
          {
            nombre: "Carlos Andrés Gómez",
            uniformeLimpio: true,
            unasLimpias: false,
            sinJoyas: true,
            saludOk: true,
            observaciones: "Recortar uñas antes del próximo turno.",
          },
        ],
      },
      observations: "Auditoría diaria de higiene del personal.",
    });
    console.log("  · 2 formatos diarios de ejemplo creados (temperatura, higiene).");
  } else {
    console.log("  · Ya hay formatos diarios en Restaurante Sabor Costeño, se omite.");
  }
}

function printCredentialsTable() {
  if (createdUsers.length === 0) {
    console.log("\nNo se creó ningún usuario nuevo en esta corrida (todos ya existían).");
    return;
  }
  console.log("\n=== Credenciales generadas (relayar por canal seguro, NO por chat/email en claro) ===");
  console.log("empresa | rol | email | password");
  for (const u of createdUsers) {
    console.log(`${u.empresa} | ${u.rol} | ${u.email} | ${u.password}`);
  }
  console.log("=== Fin de la lista. Estas contraseñas no se guardan en ningún log ni archivo. ===\n");
}

async function main() {
  console.log("Sembrando datos DEMO de producción...");
  await seedChecklistCatalog();
  await seedBpmAdmin();
  await seedDemoCompanies();
  console.log("Listo.");
  printCredentialsTable();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error sembrando datos demo:", err);
  process.exit(1);
});
