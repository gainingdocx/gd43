import { logError } from "@/lib/observability/logger";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (contentLength > MAX_BODY_BYTES || (fetchSite && !["same-origin", "same-site"].includes(fetchSite))) {
    return new Response(null, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const reference = typeof body.reference === "string" ? body.reference.slice(0, 32) : "unknown";
  const message = typeof body.message === "string" ? body.message.slice(0, 500) : "Client error";
  const digest = typeof body.digest === "string" ? body.digest.slice(0, 120) : undefined;
  const path = typeof body.path === "string" ? body.path.slice(0, 300) : undefined;

  logError("client_render_error", new Error(message), {
    reference,
    digest,
    path,
  });
  return new Response(null, { status: 204 });
}
