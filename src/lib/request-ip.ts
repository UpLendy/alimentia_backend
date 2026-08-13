import type { Server } from "elysia/universal";

interface IpSource {
  request: Request;
  server: Server | null;
  headers: Record<string, string | undefined>;
}

// Si el backend corre detrás de un proxy/load balancer (Cloudflare, nginx,
// etc.) el socket de Bun ve la IP del proxy, no la del cliente real — por
// eso preferimos X-Forwarded-For cuando existe. Se usa para rate limiting
// y auditoría, no para decisiones de autorización.
export function getClientIp({ request, server, headers }: IpSource): string | null {
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();

  return server?.requestIP(request)?.address ?? null;
}
