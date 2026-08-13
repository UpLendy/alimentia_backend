import { Elysia } from "elysia";
import { requireAuth } from "../../../plugins/auth";
import { toScope } from "../../../shared/domain/to-scope";
import { mapError } from "../../../shared/http/map-error";
import { DrizzleAttachmentRepository } from "../infrastructure/attachment.drizzle-repository";
import { S3StorageAdapter } from "../infrastructure/s3-storage.adapter";
import { DrizzleSedeRepository } from "../../sedes/infrastructure/sede.drizzle-repository";
import { ListAttachmentsUseCase, RequestUploadUrlUseCase, CreateAttachmentUseCase } from "../application";
import { requestUploadUrlBody, createAttachmentBody } from "./attachments.schema";

const repository = new DrizzleAttachmentRepository();
const sedeRepository = new DrizzleSedeRepository();
const storage = new S3StorageAdapter();
const listAttachments = new ListAttachmentsUseCase(repository);
const requestUploadUrl = new RequestUploadUrlUseCase(storage);
const createAttachment = new CreateAttachmentUseCase(repository, sedeRepository);

// Anexos y Soportes (src/app/anexos, src/app/anexos/subir)
export const attachmentsRoutes = new Elysia({ prefix: "/attachments", tags: ["Attachments"] })
  .use(requireAuth)
  .get("/", async ({ user, set }) => {
    try {
      return await listAttachments.execute(toScope(user!).companyId);
    } catch (err) {
      return mapError(err, set);
    }
  })
  // Paso 1 del flujo de subida: el front pide una URL prefirmada, sube el
  // archivo directo a S3 con PUT, y luego llama a POST /attachments con la
  // fileKey/fileUrl resultante (ver PROMPTS.md, módulo "Anexos").
  .post(
    "/upload-url",
    async ({ body }) => requestUploadUrl.execute(body.fileName, body.contentType),
    { body: requestUploadUrlBody },
  )
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const attachment = await createAttachment.execute(toScope(user!).companyId, user!.sub, body);
        return { attachment };
      } catch (err) {
        return mapError(err, set);
      }
    },
    { body: createAttachmentBody },
  );
