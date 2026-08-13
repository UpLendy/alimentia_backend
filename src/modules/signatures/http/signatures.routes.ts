import { Elysia } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { getClientIp } from "../../../lib/request-ip";
import { DrizzleSignatureRepository } from "../infrastructure/signature.drizzle-repository";
import { DrizzleFixedDocumentRepository } from "../../fixed-documents/infrastructure/fixed-document.drizzle-repository";
import { DrizzleNonConformityRepository } from "../../quality/infrastructure/non-conformity.drizzle-repository";
import { CreateSignatureUseCase, ListSignaturesUseCase } from "../application";
import { createSignatureBody, listSignaturesQuery } from "./signatures.schema";

const signatureRepository = new DrizzleSignatureRepository();
const fixedDocumentRepository = new DrizzleFixedDocumentRepository();
const nonConformityRepository = new DrizzleNonConformityRepository();
const createSignature = new CreateSignatureUseCase(signatureRepository, fixedDocumentRepository, nonConformityRepository);
const listSignatures = new ListSignaturesUseCase(signatureRepository, fixedDocumentRepository, nonConformityRepository);

// Firma electrónica con auditoría (quién, cuándo, desde qué IP) sobre
// cualquier entidad soportada (ver signature.entity.ts). No expone un
// endpoint de "verificar hash" porque, por ahora, ningún flujo lo pide.
export const signaturesRoutes = new Elysia({ prefix: "/signatures", tags: ["Signatures"] })
  .use(requireAuth)
  .get(
    "/",
    async ({ user, query, set }) => {
      try {
        return await listSignatures.execute(toScope(user!), query.entityType, query.entityId);
      } catch (err) {
        return mapError(err, set);
      }
    },
    { query: listSignaturesQuery },
  )
  .post(
    "/",
    async ({ user, body, request, server, headers, set }) => {
      try {
        const ipAddress = getClientIp({ request, server, headers });
        const signature = await createSignature.execute(toScope(user!), body, user!.sub, ipAddress);
        return { signature };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createSignatureBody },
  );
