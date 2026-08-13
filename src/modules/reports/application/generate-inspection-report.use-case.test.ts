import { describe, expect, test } from "bun:test";
import type { AccessScope } from "../../../shared/domain/access-scope";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors";
import type { CompanyRepository } from "../../companies/domain/company.repository";
import type { Company, UpdateCompanyInput } from "../../companies/domain/company.entity";
import type { SedeRepository } from "../../sedes/domain/sede.repository";
import type { NewSedeInput, Sede, UpdateSedeInput } from "../../sedes/domain/sede.entity";
import type { DailyFormRepository } from "../../daily-forms/domain/daily-form.repository";
import type { DailyForm, DailyFormFilters, NewDailyFormInput } from "../../daily-forms/domain/daily-form.entity";
import type { NonConformityRepository } from "../../quality/domain/non-conformity.repository";
import type {
  NewNonConformityInput,
  NonConformity,
  NonConformityStatus,
} from "../../quality/domain/non-conformity.entity";
import type { NotificationRepository } from "../../notifications/domain/notification.repository";
import type { NewNotificationInput, Notification } from "../../notifications/domain/notification.entity";
import type { UploadedFile, StoragePort, UploadUrlResult } from "../../attachments/domain/storage.port";
import type { ReportRendererPort } from "../domain/report-renderer.port";
import type { InspectionReportData } from "../domain/inspection-report.entity";
import { GenerateInspectionReportUseCase } from "./generate-inspection-report.use-case";

// Pruebas unitarias con repositorios/puertos falsos en memoria (sin Postgres
// ni S3 de verdad) — el propósito de la arquitectura en capas es justamente
// poder testear application/ así (ver ARCHITECTURE.md). El caso de éxito
// completo (PDF real subido a S3) no se puede cubrir vía HTTP en este
// entorno porque no hay credenciales S3 configuradas (ver .env) — por eso
// vive acá en vez de en multi-tenant-isolation.test.ts.

const company: Company = {
  id: "company-1",
  name: "Restaurante de prueba",
  nit: "900123456-1",
  email: null,
  phone: null,
  address: "Calle 1 # 2-3",
  logoUrl: null,
  plan: "pro",
  status: "activo",
  businessProfile: "restaurante_general",
  sedesIncluded: 3,
  billingAnnualPrepay: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sede: Sede = {
  id: "sede-1",
  companyId: "company-1",
  name: "Sede Centro",
  address: "Carrera 4 # 5-6",
  city: "Bogotá",
  isMain: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeCompanyRepository(overrides: Partial<Company> = {}): CompanyRepository {
  return {
    async findById(id: string) {
      return id === company.id ? { ...company, ...overrides } : null;
    },
    async update(_id: string, _input: UpdateCompanyInput) {
      return null;
    },
    async findAllActive() {
      return [];
    },
  };
}

function makeSedeRepository(overrides: Partial<Sede> = {}): SedeRepository {
  return {
    async findAllByCompany() {
      return [];
    },
    async findById(companyId: string, id: string) {
      return companyId === sede.companyId && id === sede.id ? { ...sede, ...overrides } : null;
    },
    async countByCompany() {
      return 0;
    },
    async create(_companyId: string, _input: NewSedeInput): Promise<Sede> {
      throw new Error("no implementado");
    },
    async update(_companyId: string, _id: string, _input: UpdateSedeInput) {
      return null;
    },
  };
}

function makeDailyFormRepository(rows: DailyForm[]): DailyFormRepository {
  return {
    async findAll(_scope: AccessScope, _filters: DailyFormFilters) {
      return rows;
    },
    async findById() {
      return null;
    },
    async create(_companyId: string, _input: NewDailyFormInput): Promise<DailyForm> {
      throw new Error("no implementado");
    },
    async findFormTypesOnDate() {
      return [];
    },
    async countInRange() {
      return rows.length;
    },
  };
}

function makeNonConformityRepository(rows: NonConformity[]): NonConformityRepository {
  return {
    async findAll() {
      return rows;
    },
    async findById() {
      return null;
    },
    async create(_companyId: string, _input: NewNonConformityInput): Promise<NonConformity> {
      throw new Error("no implementado");
    },
    async update(
      _scope: AccessScope,
      _id: string,
      _input: Partial<NewNonConformityInput> & { status?: NonConformityStatus; closedAt?: Date | null },
    ) {
      return null;
    },
  };
}

function makeNotificationRepository(rows: Notification[]): NotificationRepository {
  return {
    async findAll() {
      return rows;
    },
    async markAsRead() {
      return null;
    },
    async create(_companyId: string, _input: NewNotificationInput): Promise<Notification> {
      throw new Error("no implementado");
    },
    async findPendingByReference() {
      return null;
    },
  };
}

function makeRenderer(): ReportRendererPort & { calls: InspectionReportData[] } {
  return {
    calls: [],
    async renderInspectionReport(data: InspectionReportData) {
      this.calls.push(data);
      return new Uint8Array([1, 2, 3]);
    },
  };
}

function makeStorage(result: UploadedFile): StoragePort & { calls: { fileName: string; contentType: string }[] } {
  return {
    calls: [],
    async createUploadUrl(): Promise<UploadUrlResult> {
      throw new Error("no implementado");
    },
    async upload(fileName: string, contentType: string, _data: Uint8Array) {
      this.calls.push({ fileName, contentType });
      return result;
    },
  };
}

function makeDailyForm(overrides: Partial<DailyForm>): DailyForm {
  return {
    id: "form-1",
    companyId: "company-1",
    sedeId: "sede-1",
    formType: "temperatura",
    formDate: "2024-01-15",
    shift: null,
    submittedBy: null,
    payload: {},
    observations: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeNonConformity(overrides: Partial<NonConformity>): NonConformity {
  return {
    id: "nc-1",
    companyId: "company-1",
    sedeId: "sede-1",
    sourceType: "manual",
    sourceReferenceId: null,
    description: "Hallazgo",
    severity: "media",
    correctiveAction: null,
    responsibleUserId: null,
    dueDate: null,
    status: "abierta",
    evidenceFileUrl: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeNotification(overrides: Partial<Notification>): Notification {
  return {
    id: "notif-1",
    companyId: "company-1",
    sedeId: "sede-1",
    userId: null,
    type: "examen_medico",
    referenceTable: null,
    referenceId: null,
    title: "Alerta",
    message: "Mensaje",
    dueDate: null,
    channel: "push",
    status: "pendiente",
    sentAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const scope: AccessScope = { companyId: "company-1", sedeId: null };

describe("GenerateInspectionReportUseCase", () => {
  test("plan básico: lanza ForbiddenError, no llega a generar el PDF", async () => {
    const renderer = makeRenderer();
    const useCase = new GenerateInspectionReportUseCase(
      makeCompanyRepository({ plan: "basico" }),
      makeSedeRepository(),
      makeDailyFormRepository([]),
      makeNonConformityRepository([]),
      makeNotificationRepository([]),
      renderer,
      makeStorage({ fileKey: "x", fileUrl: "https://example.com/x.pdf" }),
    );

    await expect(useCase.execute(scope, { sedeId: sede.id, from: "2024-01-01", to: "2024-01-31" })).rejects.toThrow(
      ForbiddenError,
    );
    expect(renderer.calls).toHaveLength(0);
  });

  test("sedeId que no pertenece a la empresa: lanza NotFoundError", async () => {
    const useCase = new GenerateInspectionReportUseCase(
      makeCompanyRepository(),
      makeSedeRepository(),
      makeDailyFormRepository([]),
      makeNonConformityRepository([]),
      makeNotificationRepository([]),
      makeRenderer(),
      makeStorage({ fileKey: "x", fileUrl: "https://example.com/x.pdf" }),
    );

    await expect(
      useCase.execute(scope, { sedeId: "sede-de-otra-empresa", from: "2024-01-01", to: "2024-01-31" }),
    ).rejects.toThrow(NotFoundError);
  });

  test("from posterior a to: lanza ValidationError", async () => {
    const useCase = new GenerateInspectionReportUseCase(
      makeCompanyRepository(),
      makeSedeRepository(),
      makeDailyFormRepository([]),
      makeNonConformityRepository([]),
      makeNotificationRepository([]),
      makeRenderer(),
      makeStorage({ fileKey: "x", fileUrl: "https://example.com/x.pdf" }),
    );

    await expect(useCase.execute(scope, { sedeId: sede.id, from: "2024-02-01", to: "2024-01-01" })).rejects.toThrow(
      ValidationError,
    );
  });

  test("agrega formatos por tipo, filtra no conformidades cerradas y alertas no pendientes, y sube el PDF resultante", async () => {
    const dailyForms = [
      makeDailyForm({ id: "f1", formType: "temperatura" }),
      makeDailyForm({ id: "f2", formType: "temperatura" }),
      makeDailyForm({ id: "f3", formType: "agua" }),
    ];
    const nonConformities = [
      makeNonConformity({ id: "nc-abierta", status: "abierta" }),
      makeNonConformity({ id: "nc-cerrada", status: "cerrada" }),
    ];
    const notifications = [
      makeNotification({ id: "n-pendiente", status: "pendiente" }),
      makeNotification({ id: "n-leida", status: "leida" }),
    ];
    const renderer = makeRenderer();
    const storage = makeStorage({ fileKey: "reports/acta.pdf", fileUrl: "https://cdn.example.com/reports/acta.pdf" });

    const useCase = new GenerateInspectionReportUseCase(
      makeCompanyRepository(),
      makeSedeRepository(),
      makeDailyFormRepository(dailyForms),
      makeNonConformityRepository(nonConformities),
      makeNotificationRepository(notifications),
      renderer,
      storage,
    );

    const result = await useCase.execute(scope, { sedeId: sede.id, from: "2024-01-01", to: "2024-01-31" });

    expect(result).toEqual({ fileKey: "reports/acta.pdf", fileUrl: "https://cdn.example.com/reports/acta.pdf" });

    expect(renderer.calls).toHaveLength(1);
    const data = renderer.calls[0]!;
    expect(data.dailyFormsTotal).toBe(3);
    expect(data.dailyFormsSummary).toEqual(
      expect.arrayContaining([
        { formType: "temperatura", count: 2 },
        { formType: "agua", count: 1 },
      ]),
    );
    expect(data.openNonConformities.map((nc) => nc.id)).toEqual(["nc-abierta"]);
    expect(data.activeAlerts.map((a) => a.id)).toEqual(["n-pendiente"]);
    expect(data.company.name).toBe(company.name);
    expect(data.sede.name).toBe(sede.name);

    expect(storage.calls).toHaveLength(1);
    expect(storage.calls[0]!.contentType).toBe("application/pdf");
    expect(storage.calls[0]!.fileName).toContain("Sede_Centro");
  });
});
