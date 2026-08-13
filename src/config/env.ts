function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

// Debe calzar exactamente con el placeholder de .env.example — si en
// producción alguien copia el .env.example sin cambiar el secreto, esto lo
// bloquea en vez de arrancar con un JWT_SECRET público y conocido.
const JWT_SECRET_PLACEHOLDER = "cambia-este-valor-por-un-secreto-largo-y-aleatorio";
const MIN_JWT_SECRET_LENGTH = 32;

// FRONTEND_URLS es la variable nueva (lista separada por comas); si no está
// seteada, cae a la FRONTEND_URL singular para no romper el .env de nadie
// que ya la tenga configurada así.
const frontendUrls = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim()).filter(Boolean)
  : [process.env.FRONTEND_URL ?? "http://localhost:3000"];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  frontendUrls,

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET"),
  // Access token de corta duración: si se filtra (XSS, log, etc.) la
  // ventana de uso indebido es mínima. La sesión larga vive en el refresh
  // token (tabla refresh_tokens), que sí se puede revocar individualmente.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",

  // Cada cuánto corre el job de alarmas (src/jobs/check-alerts.ts) cuando se
  // invoca en proceso via startCheckAlertsJob(). Son alertas de cadencia
  // diaria (vencimientos), así que 1 hora es un default razonable — pero
  // ajustable sin redeploy si en producción hace falta otra cosa.
  checkAlertsIntervalMs: Number(process.env.CHECK_ALERTS_INTERVAL_MS ?? 60 * 60 * 1000),

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "auto",
    bucket: process.env.S3_BUCKET ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    publicUrl: process.env.S3_PUBLIC_URL ?? "",
  },
};

// Falla rápido en producción en vez de servir tráfico real con un secreto
// de ejemplo o débil (ambos casos harían trivial forjar JWTs válidos).
if (env.nodeEnv === "production") {
  if (env.jwtSecret === JWT_SECRET_PLACEHOLDER) {
    throw new Error(
      "JWT_SECRET tiene el valor placeholder de .env.example. Configura un secreto real antes de arrancar en producción.",
    );
  }
  if (env.jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET es demasiado corto (mínimo ${MIN_JWT_SECRET_LENGTH} caracteres) para arrancar en producción.`,
    );
  }
  // Evita que una lista de orígenes de desarrollo (o el fallback a
  // localhost) se cuele por accidente en producción: ahí CORS debe aceptar
  // exactamente un dominio real, nunca localhost ni una lista abierta.
  if (!process.env.FRONTEND_URLS) {
    throw new Error("FRONTEND_URLS no está configurada. Es requerida para arrancar en producción.");
  }
  if (env.frontendUrls.some((url) => url.includes("localhost") || url.includes("127.0.0.1"))) {
    throw new Error("FRONTEND_URLS contiene un origen localhost/127.0.0.1, no permitido en producción.");
  }
  if (env.frontendUrls.length > 1) {
    throw new Error("FRONTEND_URLS debe tener exactamente un origen en producción.");
  }
}
