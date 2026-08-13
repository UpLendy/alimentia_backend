import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { getClientIp } from "../../../lib/request-ip";
import { db } from "../../../db/client";
import { DrizzleFixedDocumentRepository } from "../infrastructure/fixed-document.drizzle-repository";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { DrizzleSignatureRepository } from "../../signatures/infrastructure/signature.drizzle-repository";
import {
  ListFixedDocumentsUseCase,
  ListFixedDocumentVersionsUseCase,
  CreateFixedDocumentUseCase,
  AddFixedDocumentVersionUseCase,
  ApproveFixedDocumentUseCase,
} from "../application";
import { createFixedDocumentBody, newVersionBody } from "./fixed-documents.schema";

const repository = new DrizzleFixedDocumentRepository();
const sedeRepository = new DrizzleSedeRepository();
const listFixedDocuments = new ListFixedDocumentsUseCase(repository);
const listVersions = new ListFixedDocumentVersionsUseCase(repository);
const createFixedDocument = new CreateFixedDocumentUseCase(repository, sedeRepository);
const addVersion = new AddFixedDocumentVersionUseCase(repository);

// Documentos Fijos / Programas de Saneamiento (src/app/documentos)
export const fixedDocumentsRoutes = new Elysia({ prefix: "/fixed-documents", tags: ["Fixed Documents"] })
  .use(requireAuth)
  .get("/", async ({ user, set }) => {
    try {
      return await listFixedDocuments.execute(toScope(user!).companyId);
    } catch (err) {
      return mapError(err, set);
    }
  })
  .get(
    "/:id/versions",
    async ({ user, params, set }) => {
      try {
        return await listVersions.execute(user!.companyId!, params.id);
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
        const document = await createFixedDocument.execute(toScope(user!).companyId, body);
        return { document };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createFixedDocumentBody },
  )
  .post(
    "/:id/versions",
    async ({ user, params, body, set }) => {
      try {
        const document = await addVersion.execute(user!.companyId!, params.id, user!.sub, body);
        return { document };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }), body: newVersionBody },
  )
  .patch(
    "/:id/approve",
    async ({ user, params, request, server, headers, set }) => {
      try {
        const ipAddress = getClientIp({ request, server, headers });
        // Instancias nuevas ligadas al `tx` (no las singleton de arriba, que
        // usan el `db` global): así aprobar el documento y crear la firma de
        // auditoría corren atómicamente — si una falla, se revierte la otra.
        const document = await db.transaction(async (tx) => {
          const scopedRepository = new DrizzleFixedDocumentRepository(tx);
          const scopedSignatureRepository = new DrizzleSignatureRepository(tx);
          const approveFixedDocument = new ApproveFixedDocumentUseCase(scopedRepository, scopedSignatureRepository);
          return approveFixedDocument.execute(user!.companyId!, params.id, user!.sub, ipAddress);
        });
        return { document };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { params: t.Object({ id: t.String({ format: "uuid" }) }) },
  );
