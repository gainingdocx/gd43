import { createClient } from "@/lib/supabase/server";

// Data export (BUILD_SPEC §M6.6): everything the user owns, as one JSON
// download. RLS scopes every query to the caller.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const [profile, documents, containers, shipments, discrepancies, events, members, requirements, workflows, comments, approvals, alerts] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("documents")
        .select("id, shipment_id, doc_type, status, page_count, fields, validation, created_at, updated_at"),
      supabase.from("containers").select("*"),
      supabase.from("shipments").select("*"),
      supabase.from("discrepancies").select("*"),
      supabase.from("events").select("type, payload, created_at").limit(1000),
      supabase.from("shipment_members").select("*"),
      supabase.from("shipment_requirements").select("*"),
      supabase.from("document_workflows").select("*"),
      supabase.from("document_comments").select("*"),
      supabase.from("export_approvals").select("*"),
      supabase.from("charge_alerts").select("*"),
    ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile: profile.data ?? null,
      shipments: shipments.data ?? [],
      documents: documents.data ?? [],
      containers: containers.data ?? [],
      discrepancies: discrepancies.data ?? [],
      events: events.data ?? [],
      shipment_members: members.data ?? [],
      shipment_requirements: requirements.data ?? [],
      document_workflows: workflows.data ?? [],
      document_comments: comments.data ?? [],
      export_approvals: approvals.data ?? [],
      charge_alerts: alerts.data ?? [],
    },
    null,
    2
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gainingdocx-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
