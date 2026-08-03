import { processEmailIngestion } from "@/lib/email-ingestion/process";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { ingestionId?: unknown } | null;
  if (!body || typeof body.ingestionId !== "string") return Response.json({ error: "invalid ingestion" }, { status: 400 });
  await processEmailIngestion(body.ingestionId);
  return Response.json({ processed: true });
}
