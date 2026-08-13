// Rate limiter simple en memoria para endpoints de autenticación
// (login, refresh). Frena fuerza bruta / credential stuffing sin depender
// de un paquete externo. Limitación conocida: el estado vive en el proceso
// del servidor, así que con más de una réplica cada una lleva su propio
// contador — si se despliega con múltiples instancias, mover esto a Redis
// (o similar) para compartir el estado entre procesos.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Bucket {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/** Consulta si `key` puede intentar de nuevo, sin registrar el intento. */
export function checkRateLimit(key: string): RateLimitCheck {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return { allowed: true };

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000) };
  }

  if (now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Registra un intento fallido para `key`. Al llegar a MAX_ATTEMPTS dentro
 * de la ventana, bloquea `key` por el resto de la ventana (backoff simple).
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAttemptAt: now, blockedUntil: null });
    return;
  }

  bucket.count += 1;
  if (bucket.count >= MAX_ATTEMPTS) {
    bucket.blockedUntil = now + WINDOW_MS;
  }
}

/** Limpia el contador de `key` (llamar tras un intento exitoso). */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
