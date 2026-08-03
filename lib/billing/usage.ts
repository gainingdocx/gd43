import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS, type PlanId } from "@/lib/plans";

export type UsageContext = {
  plan: PlanId;
  limit: number;
  used: number;
  billingOwner: string;
};

/** Resolve personal or Team pooled usage. Team members consume the workspace
 * allowance while the workspace owner's active plan remains Team. */
export async function getUsageContext(userId: string, monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))): Promise<UsageContext> {
  const admin = createAdminClient();
  const { data: ownProfile } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
  let plan: PlanId = ownProfile?.plan === "pro" || ownProfile?.plan === "team" ? ownProfile.plan : "free";
  let billingOwner = userId;
  let owners = [userId];

  if (plan !== "team") {
    const { data: membership } = await admin.from("team_members")
      .select("workspace_id").eq("member_id", userId).eq("status", "active").maybeSingle();
    if (membership) {
      const { data: workspace } = await admin.from("team_workspaces").select("owner").eq("id", membership.workspace_id).maybeSingle();
      const { data: ownerProfile } = workspace
        ? await admin.from("profiles").select("plan").eq("id", workspace.owner).maybeSingle()
        : { data: null };
      if (workspace && ownerProfile?.plan === "team") {
        plan = "team";
        billingOwner = workspace.owner;
      }
    }
  }

  if (plan === "team") {
    const { data: workspace } = await admin.from("team_workspaces").select("id").eq("owner", billingOwner).maybeSingle();
    const { data: members } = workspace
      ? await admin.from("team_members").select("member_id").eq("workspace_id", workspace.id).eq("status", "active").not("member_id", "is", null)
      : { data: [] };
    owners = [billingOwner, ...(members ?? []).map((member) => member.member_id as string)];
  }

  const { count } = await admin.from("documents").select("id", { count: "exact", head: true })
    .in("owner", owners).eq("logical_child", false).eq("status", "parsed").gte("created_at", monthStart.toISOString());
  return { plan, limit: PLAN_LIMITS[plan], used: count ?? 0, billingOwner };
}
