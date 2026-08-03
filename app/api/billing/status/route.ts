import { getEntitlement } from "@/lib/paddle/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  const entitlement = await getEntitlement();
  return Response.json(
    { isPaid: entitlement.isPaid, isPro: entitlement.isPro, isTeam: entitlement.isTeam, plan: entitlement.plan, status: entitlement.status },
    { headers: { "Cache-Control": "no-store" } }
  );
}
