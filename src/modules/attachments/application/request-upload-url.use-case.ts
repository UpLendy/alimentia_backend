import type { StoragePort, UploadUrlResult } from "../domain/storage.port";

// Paso 1 del flujo de subida: el front pide una URL prefirmada, sube el
// archivo directo a S3 con PUT, y luego llama a CreateAttachmentUseCase con
// la fileKey/fileUrl resultante.
export class RequestUploadUrlUseCase {
  constructor(private readonly storage: StoragePort) {}

  async execute(fileName: string, contentType: string): Promise<UploadUrlResult> {
    return this.storage.createUploadUrl(fileName, contentType);
  }
}
