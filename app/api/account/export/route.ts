import { createClient } from "@/lib/supabase/server";

// Data export (BUILD_SPEC §M6.6): everything the user owns, as one JSON
// download. RLS scopes every query to the caller.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const [documents, containers, shipments, discrepancies, events] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, shipment_id, doc_type, status, page_count, fields, validation, created_at, updated_at"),
      supabase.from("containers").select("*"),
      supabase.from("shipments").select("*"),
      supabase.from("discrepancies").select("*"),
      supabase.from("events").select("type, payload, created_at").limit(1000),
    ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      shipments: shipments.data ?? [],
      documents: documents.data ?? [],
      containers: containers.data ?? [],
      discrepancies: discrepancies.data ?? [],
      events: events.data ?? [],
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
