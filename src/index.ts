import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";
import { securityHeaders } from "./plugins/security-headers";
import { errorHandler } from "./plugins/error-handler";

import { authRoutes } from "./modules/auth/auth.routes";
import { companiesRoutes } from "./modules/companies/http/companies.routes";
import { sedesRoutes } from "./modules/sedes/http/sedes.routes";
import { employeesRoutes } from "./modules/employees/http/employees.routes";
import { trainingsRoutes } from "./modules/trainings/http/trainings.routes";
import { equipmentRoutes } from "./modules/equipment/http/equipment.routes";
import { dailyFormsRoutes } from "./modules/daily-forms/http/daily-forms.routes";
import { fixedDocumentsRoutes } from "./modules/fixed-documents/http/fixed-documents.routes";
import { attachmentsRoutes } from "./modules/attachments/http/attachments.routes";
import { scheduledEventsRoutes } from "./modules/scheduled-events/http/scheduled-events.routes";
import { suppliersRoutes } from "./modules/suppliers/http/suppliers.routes";
import { traceabilityRoutes } from "./modules/traceability/http/traceability.routes";
import { qualityRoutes } from "./modules/quality/http/quality.routes";
import { dashboardRoutes } from "./modules/dashboard/http/dashboard.routes";
import { notificationsRoutes } from "./modules/notifications/http/notifications.routes";
import { checklistRoutes } from "./modules/checklist/http/checklist.routes";
import { signaturesRoutes } from "./modules/signatures/http/signatures.routes";
import { reportsRoutes } from "./modules/reports/http/reports.routes";
import { ticketsRoutes } from "./modules/tickets/http/tickets.routes";
import { startCheckAlertsJob } from "./jobs/check-alerts";

const app = new Elysia()
  .use(
    // origin valida contra una whitelist explícita (nunca "*"): solo los
    // orígenes en FRONTEND_URLS pueden hacer requests con credenciales.
    // Necesario en dev porque Next.js cambia de puerto según qué esté libre
    // (3000, 3002, ...); en prod la lista debe tener un único dominio real
    // (ver validación en src/config/env.ts).
    cors({
      origin: (request) => env.frontendUrls.includes(request.headers.get("origin") ?? ""),
      credentials: true,
    }),
  )
  .use(securityHeaders)
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Alimentia API",
          version: "0.1.0",
          description:
            "Backend de Alimentia (BPM Consulting): cumplimiento sanitario, formatos diarios y documentación para establecimientos de alimentos.",
        },
        // Orden y nombres de los grupos que aparecen en el sidebar de /docs.
        tags: [
          { name: "Auth", description: "Login y gestión de usuarios." },
          { name: "Companies", description: "Configuración e información del negocio." },
          { name: "Sedes", description: "Sedes / sucursales de la empresa." },
          { name: "Employees", description: "Personal y capacitaciones." },
          { name: "Equipment", description: "Infraestructura y equipos." },
          { name: "Daily Forms", description: "Formatos diarios de control (temperatura, agua, etc.)." },
          { name: "Fixed Documents", description: "Documentos fijos / programas de saneamiento." },
          { name: "Attachments", description: "Anexos y soportes subidos por el usuario." },
          { name: "Scheduled Events", description: "Eventos y análisis programados (fumigación, agua, etc.)." },
          { name: "Traceability", description: "Trazabilidad por lote y planes de retiro (recall)." },
          { name: "Quality", description: "No conformidades (CAPA) e incidentes." },
          { name: "Dashboard", description: "Resumen y centro de alertas del panel principal." },
          { name: "Notifications", description: "Notificaciones/alarmas (vencimientos de examen médico, calibración, eventos programados)." },
          { name: "Trainings", description: "Capacitaciones del personal (historial y alta por empleado)." },
          { name: "Checklist", description: "Checklist Maestro: catálogo de referencia y avance por empresa cliente (panel interno BPM Consulting)." },
          { name: "Signatures", description: "Firmas electrónicas con auditoría (usuario, fecha, IP y hash) sobre otras entidades." },
          { name: "Reports", description: "Reportes agregados (actas de inspección en PDF) — feature de plan Pro/Plus." },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        // Protege todas las rutas por defecto; las públicas (login, health)
        // se sobreescriben con `detail: { security: [] }` en su propia ruta.
        security: [{ bearerAuth: [] }],
      },
    }),
  )
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
    detail: { security: [] },
  })
  .use(errorHandler)
  .use(authRoutes)
  .use(companiesRoutes)
  .use(sedesRoutes)
  .use(employeesRoutes)
  .use(trainingsRoutes)
  .use(equipmentRoutes)
  .use(dailyFormsRoutes)
  .use(fixedDocumentsRoutes)
  .use(attachmentsRoutes)
  .use(scheduledEventsRoutes)
  .use(suppliersRoutes)
  .use(traceabilityRoutes)
  .use(qualityRoutes)
  .use(dashboardRoutes)
  .use(notificationsRoutes)
  .use(checklistRoutes)
  .use(signaturesRoutes)
  .use(reportsRoutes)
  .use(ticketsRoutes)
  .listen(env.port);

// Job en proceso (setInterval, ver comentario en src/jobs/check-alerts.ts
// para la alternativa de cron del SO como proceso aparte).
startCheckAlertsJob();

console.log(`🦊 Alimentia API corriendo en http://localhost:${app.server?.port} — docs en /docs`);

export type App = typeof app;
