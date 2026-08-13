import { eq as sqlEq } from "drizzle-orm";
import { db } from "./client";
import { companies, sedes, users, checklistCatalog } from "./schema";
import { hashPassword } from "../lib/password";
import { checklistMaestroSeed, perfilesPorNegocioSeed } from "./seed-data/checklist-maestro";

// Uso: bun run db:seed
// Crea: catálogo maestro de checklist (idempotente-ish, ver nota abajo),
// un usuario bpm_admin (staff de BPM Consulting) y una empresa demo con sede,
// admin y datos mínimos para poder probar la API/el front contra datos reales.

async function seedChecklistCatalog() {
  const existing = await db.select({ id: checklistCatalog.id }).from(checklistCatalog).limit(1);
  if (existing.length > 0) {
    console.log("· checklist_catalog ya tiene datos, se omite el seed (borra la tabla si quieres re-sembrar).");
    return;
  }
  const rows = [...checklistMaestroSeed, ...perfilesPorNegocioSeed];
  await db.insert(checklistCatalog).values(rows);
  console.log(`· checklist_catalog: ${rows.length} ítems insertados (Checklist Maestro + Perfiles por Negocio).`);
}

async function seedBpmAdmin() {
  const email = "staff@bpmconsulting.co";
  const [existing] = await db.select().from(users).where(sqlEq(users.email, email)).limit(1);
  if (existing) {
    console.log("· Usuario bpm_admin ya existe, se omite.");
    return;
  }
  const passwordHash = await hashPassword("CambiaEstaClave123!");
  await db.insert(users).values({
    companyId: null,
    sedeId: null,
    fullName: "Staff BPM Consulting",
    email,
    passwordHash,
    role: "bpm_admin",
  });
  console.log(`· Usuario bpm_admin creado: ${email} / CambiaEstaClave123! (cámbiala después del primer login)`);
}

async function seedDemoCompany() {
  const [existingCompany] = await db.select().from(companies).where(sqlEq(companies.nit, "900.123.456-7")).limit(1);
  if (existingCompany) {
    console.log("· Empresa demo ya existe, se omite.");
    return;
  }

  const [company] = await db
    .insert(companies)
    .values({
      name: "Restaurante La Cosecha S.A.S.",
      nit: "900.123.456-7",
      email: "admin@lacosecha.demo",
      plan: "pro",
      status: "prueba",
      businessProfile: "restaurante_general",
      sedesIncluded: 3,
    })
    .returning();

  const [sede] = await db
    .insert(sedes)
    .values({ companyId: company!.id, name: "Sede Principal", isMain: true })
    .returning();

  const passwordHash = await hashPassword("CambiaEstaClave123!");
  await db.insert(users).values({
    companyId: company!.id,
    sedeId: null, // admin de la empresa: acceso a todas las sedes
    fullName: "Admin Demo",
    email: "admin@lacosecha.demo",
    passwordHash,
    role: "admin",
  });

  console.log(`· Empresa demo creada: ${company!.name} (sede: ${sede!.name})`);
  console.log("  Login: admin@lacosecha.demo / CambiaEstaClave123!");
}

async function main() {
  console.log("Sembrando datos iniciales...");
  await seedChecklistCatalog();
  await seedBpmAdmin();
  await seedDemoCompany();
  console.log("Listo.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error sembrando datos:", err);
  process.exit(1);
});
