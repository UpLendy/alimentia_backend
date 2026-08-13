import { env } from "../config/env";
import { DrizzleCompanyRepository } from "../modules/companies/infrastructure/company.drizzle-repository";
import { DrizzleEmployeeRepository } from "../modules/employees/infrastructure/employee.drizzle-repository";
import { DrizzleEquipmentRepository } from "../modules/equipment/infrastructure/equipment.drizzle-repository";
import { DrizzleScheduledEventRepository } from "../modules/scheduled-events/infrastructure/scheduled-event.drizzle-repository";
import { DrizzleNotificationRepository } from "../modules/notifications/infrastructure/notification.drizzle-repository";
import { CheckAlertsUseCase } from "../modules/notifications/application/check-alerts.use-case";

// Job de alarmas: evalúa vencimientos (examen médico, calibración, eventos
// programados) y crea notificaciones pendientes. Este archivo SOLO instancia
// repositorios y llama a CheckAlertsUseCase.execute() — toda la lógica de
// negocio (qué cuenta como "por vencer", el dedup) vive en el caso de uso,
// no aquí.
//
// Dos formas de correrlo:
//
// 1. (la que usa hoy src/index.ts) en el mismo proceso del API: al arrancar
//    se llama startCheckAlertsJob(), que corre el check una vez y luego cada
//    CHECK_ALERTS_INTERVAL_MS via setInterval. No se instaló ningún paquete
//    de cron (no hace falta uno para un intervalo fijo) — si en el futuro se
//    necesitan horarios tipo cron (ej. "todos los días a las 6am"), recién
//    ahí valdría sumar `node-cron` o similar.
//
// 2. Como proceso aparte, disparado por el cron del sistema operativo en vez
//    del setInterval en memoria — más robusto si el API llega a correr en
//    múltiples instancias (con el setInterval, cada instancia dispararía su
//    propio check y se duplicaría el trabajo, aunque el dedup de
//    CheckAlertsUseCase evita que eso cree notificaciones repetidas). Para
//    usar este modo: no llamar startCheckAlertsJob() desde src/index.ts, y en
//    su lugar agregar al crontab algo como
//
//      */30 * * * * cd /ruta/al/backend && bun run src/jobs/check-alerts.ts >> /var/log/alimentia/check-alerts.log 2>&1
//
//    El bloque `if (import.meta.main)` de abajo ya deja este archivo listo
//    para ejecutarse solo así, con `bun run`.

const checkAlerts = new CheckAlertsUseCase(
  new DrizzleCompanyRepository(),
  new DrizzleEmployeeRepository(),
  new DrizzleEquipmentRepository(),
  new DrizzleScheduledEventRepository(),
  new DrizzleNotificationRepository(),
);

async function runCheck(): Promise<void> {
  try {
    const { created } = await checkAlerts.execute();
    if (created > 0) console.log(`[check-alerts] ${created} notificación(es) nueva(s) creada(s).`);
  } catch (err) {
    console.error("[check-alerts] Error ejecutando el job:", err);
  }
}

// Llamado una vez desde src/index.ts al arrancar el API (modo 1 de arriba).
// El intervalo por defecto sale de CHECK_ALERTS_INTERVAL_MS (env.checkAlertsIntervalMs,
// ver src/config/env.ts) — así se puede ajustar en producción sin redeploy.
export function startCheckAlertsJob(intervalMs = env.checkAlertsIntervalMs): void {
  void runCheck();
  setInterval(runCheck, intervalMs);
}

// Permite correr este archivo como proceso aparte con `bun run
// src/jobs/check-alerts.ts` (modo 2 de arriba, para invocarlo desde el cron
// del SO en vez del setInterval en memoria).
if (import.meta.main) {
  checkAlerts
    .execute()
    .then(({ created }) => {
      console.log(`[check-alerts] ${created} notificación(es) nueva(s) creada(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[check-alerts] Error ejecutando el job:", err);
      process.exit(1);
    });
}
