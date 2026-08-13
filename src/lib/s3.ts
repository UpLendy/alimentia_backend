import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { env } from "../config/env";

// Cliente S3-compatible (AWS S3, Cloudflare R2, MinIO, etc.) — ver .env.example
//
// `credentials` solo se pasa si S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY están
// definidas. Si se omite el campo (undefined), @aws-sdk/client-s3 cae al
// proveedor de credenciales por defecto de la cadena estándar del SDK
// (env vars → shared config → rol IAM vía IMDS en EC2/ECS). Pasar un objeto
// `credentials` con strings vacíos rompe ese fallback: el SDK intenta
// autenticar con esas credenciales vacías en vez de resolver el rol IAM.
export const s3 = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint || undefined,
  ...(env.s3.accessKeyId && env.s3.secretAccessKey
    ? { credentials: { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey } }
    : {}),
  // Requerido por la mayoría de proveedores S3-compatible distintos de AWS
  forcePathStyle: Boolean(env.s3.endpoint),
});

export function buildFileKey(folder: string, originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : undefined;
  const id = nanoid(12);
  return ext ? `${folder}/${id}.${ext}` : `${folder}/${id}`;
}

export function publicUrlFor(fileKey: string): string {
  return `${env.s3.publicUrl.replace(/\/$/, "")}/${fileKey}`;
}

/** URL prefirmada para que el cliente suba el archivo directo a S3 (PUT). */
export async function getUploadUrl(fileKey: string, contentType: string, expiresInSeconds = 300) {
  const command = new PutObjectCommand({
    Bucket: env.s3.bucket,
    Key: fileKey,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/** URL prefirmada de descarga, útil si el bucket es privado. */
export async function getDownloadUrl(fileKey: string, expiresInSeconds = 300) {
  const command = new GetObjectCommand({ Bucket: env.s3.bucket, Key: fileKey });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export async function deleteFile(fileKey: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: fileKey }));
}

/** Sube el archivo directo desde el backend (ej. un PDF generado en el propio proceso, sin pasar por una URL prefirmada). */
export async function uploadObject(fileKey: string, body: Uint8Array, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: env.s3.bucket, Key: fileKey, Body: body, ContentType: contentType }));
}
