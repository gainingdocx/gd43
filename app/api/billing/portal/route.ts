import { openBillingPortal } from "@/lib/paddle/portal";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await openBillingPortal();
  return Response.json(result, { status: "url" in result ? 200 : 400, headers: { "Cache-Control": "no-store" } });
}
