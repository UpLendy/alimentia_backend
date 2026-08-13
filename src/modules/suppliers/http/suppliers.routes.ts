import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleSupplierRepository } from "../infrastructure/supplier.drizzle-repository";
import { DrizzleCompanyRepository } from "../../companies/infrastructure/company.drizzle-repository";
import {
  ListSuppliersUseCase,
  GetSupplierUseCase,
  CreateSupplierUseCase,
  UpdateSupplierUseCase,
  AddSupplierDocumentUseCase,
  AddSupplierEvaluationUseCase,
  ListSupplierEvaluationsUseCase,
} from "../application";
import {
  createSupplierBody,
  updateSupplierBody,
  addSupplierDocumentBody,
  addSupplierEvaluationBody,
} from "./suppliers.schema";

// Composition root del módulo: se instancia una sola vez al cargar el
// archivo. Si mañana hay que testear los casos de uso con un repositorio en
// memoria, esto es lo único que cambia (no las rutas).
const repository = new DrizzleSupplierRepository();
const companyRepository = new DrizzleCompanyRepository();
const listSuppliers = new ListSuppliersUseCase(repository, companyRepository);
const getSupplier = new GetSupplierUseCase(repository, companyRepository);
const createSupplier = new CreateSupplierUseCase(repository, companyRepository);
const updateSupplier = new UpdateSupplierUseCase(repository, companyRepository);
const addSupplierDocument = new AddSupplierDocumentUseCase(repository, companyRepository);
const addSupplierEvaluation = new AddSupplierEvaluationUseCase(repository, companyRepository);
const listSupplierEvaluations = new ListSupplierEvaluationsUseCase(repository, companyRepository);

// Proveedores (feature Pro/Plus, ver require-suppliers-plan.ts). Este archivo
// es el "controlador": traduce HTTP <-> casos de uso. No tiene lógica de
// negocio ni sabe qué ORM se usa — eso vive en application/ e infrastructure/
// respectivamente.
export const suppliersRoutes = new Elysia({ prefix: "/suppliers", tags: ["Suppliers"] })
  .use(requireAuth)
  .get("/", async ({ user, set }) => {
    try {
      return await listSuppliers.execute(toScope(user!).companyId);
    } catch (err) {
      return mapError(err, set);
    }
  })
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        return await getSupplier.execute(toScope(user!).companyId, params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .get(
    "/:id/evaluations",
    async ({ user, params, set }) => {
      try {
        return await listSupplierEvaluations.execute(toScope(user!).companyId, params.id);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  )
  .use(requireRole(["admin", "supervisor", "bpm_admin"]))
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const supplier = await createSupplier.execute(toScope(user!).companyId, body);
        return { supplier };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createSupplierBody },
  )
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const supplier = await updateSupplier.execute(toScope(user!).companyId, params.id, body);
        return { supplier };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: updateSupplierBody },
  )
  .post(
    "/:id/documents",
    async ({ user, params, body, set }) => {
      try {
        const document = await addSupplierDocument.execute(toScope(user!).companyId, params.id, body);
        return { document };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: addSupplierDocumentBody },
  )
  .post(
    "/:id/evaluations",
    async ({ user, params, body, set }) => {
      try {
        const evaluation = await addSupplierEvaluation.execute(toScope(user!).companyId, params.id, user!.sub, body);
        return { evaluation };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: addSupplierEvaluationBody },
  );
