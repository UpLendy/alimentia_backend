// Puerto de infraestructura de almacenamiento de archivos. QUÉ se puede
// hacer (pedir una URL prefirmada de subida), no CÓMO (S3/R2/MinIO, ver
// infrastructure/s3-storage.adapter.ts).
export interface UploadUrlResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

export interface UploadedFile {
  fileKey: string;
  fileUrl: string;
}

export interface StoragePort {
  createUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult>;
  // Para archivos que genera el propio backend (ej. el PDF de un acta de
  // inspección en reports/) en vez de venir de una subida directa del
  // cliente vía URL prefirmada — ver reports/application/generate-inspection-report.use-case.ts.
  upload(fileName: string, contentType: string, data: Uint8Array): Promise<UploadedFile>;
}
