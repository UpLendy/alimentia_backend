import { buildFileKey, getUploadUrl, publicUrlFor, uploadObject } from "../../../lib/s3";
import type { StoragePort, UploadUrlResult, UploadedFile } from "../domain/storage.port";

// Envuelve src/lib/s3.ts (detalle de infraestructura: S3-compatible —
// AWS S3, Cloudflare R2, MinIO). Es el único archivo del módulo que sabe
// que existe S3.
export class S3StorageAdapter implements StoragePort {
  constructor(private readonly folder = "attachments") {}

  async createUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult> {
    const fileKey = buildFileKey(this.folder, fileName);
    const uploadUrl = await getUploadUrl(fileKey, contentType);
    return { uploadUrl, fileKey, fileUrl: publicUrlFor(fileKey) };
  }

  async upload(fileName: string, contentType: string, data: Uint8Array): Promise<UploadedFile> {
    const fileKey = buildFileKey(this.folder, fileName);
    await uploadObject(fileKey, data, contentType);
    return { fileKey, fileUrl: publicUrlFor(fileKey) };
  }
}
