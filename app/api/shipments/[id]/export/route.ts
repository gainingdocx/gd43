import { buildShipmentWorkbook } from "@/lib/export/xlsx";
import { createClient } from "@/lib/supabase/server";
import { assessCompleteness, type ShipmentRequirement } from "@/lib/shipments/completeness";
import { buildShipmentSummaryPdf } from "@/lib/export/shipment-pdf";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "xlsx";
  if (!["xlsx", "json", "pdf"].includes(format)) return Response.json({ error: "format must be xlsx, pdf or json" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const { data: shipment } = await supabase.from("shipments")
    .select("id, owner, ref, bl_number, bill_level, master_shipment_id, house_bl_number, export_approval_required")
    .eq("id", id).maybeSingle();
  if (!shipment) return Response.json({ error: "shipment not found" }, { status: 404 });
  const { data: children } = shipment.bill_level === "master"
    ? await supabase.from("shipments").select("id, ref, bl_number, bill_level, master_shipment_id, house_bl_number").eq("master_shipment_id", id)
    : { data: [] };
  const shipmentIds = [id, ...(children ?? []).map((child) => child.id)];
  const { data: documents } = await supabase.from("documents")
    .select("id, shipment_id, doc_type, status, source_filename, fields, validation, created_at, updated_at")
    .in("shipment_id", shipmentIds)
    .order("created_at");
  if (shipment.export_approval_required) {
    const { data: approval } = await supabase.from("export_approvals")
      .select("status, decided_at").eq("shipment_id", id).eq("status", "approved")
      .order("decided_at", { ascending: false }).limit(1).maybeSingle();
    const latestDocumentChange = (documents ?? []).reduce((latest, document) =>
      document.updated_at > latest ? document.updated_at : latest, "");
    if (!approval?.decided_at || approval.decided_at < latestDocumentChange) {
      return Response.json({ error: "This shipment needs a current export approval." }, { status: 423 });
    }
  }
  await supabase.from("events").insert({
    owner: shipment.owner,
    type: "shipment_bulk_export",
    payload: { shipment_id: id, included_shipments: shipmentIds, document_count: documents?.length ?? 0, format },
  });
  const base = (shipment.bl_number ?? shipment.ref ?? `shipment-${id.slice(0, 8)}`).replace(/[^\w-]+/g, "_");
  if (format === "json") {
    return new Response(JSON.stringify({ shipment, house_shipments: children ?? [], documents: documents ?? [] }, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${base}-complete.json"` },
    });
  }
  if (format === "pdf") {
    const [{ data: requirementRows }, { data: alerts }] = await Promise.all([
      supabase.from("shipment_requirements").select("requirement_key, label, accepted_types, required, filename_hint").eq("shipment_id", id),
      supabase.from("charge_alerts").select("alert_type, free_until, status").eq("shipment_id", id).eq("status", "active"),
    ]);
    const completeness = assessCompleteness(documents ?? [], (requirementRows ?? []) as ShipmentRequirement[]);
    const pdf = await buildShipmentSummaryPdf({
      reference: shipment.bl_number ?? shipment.ref ?? id.slice(0, 8),
      documents: (documents ?? []) as Parameters<typeof buildShipmentSummaryPdf>[0]["documents"],
      completeness: completeness.results,
      alerts: alerts ?? [],
    });
    return new Response(pdf as unknown as BodyInit, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}-summary.pdf"` },
    });
  }
  const workbook = await buildShipmentWorkbook(shipment, (documents ?? []) as Parameters<typeof buildShipmentWorkbook>[1]);
  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${base}-complete.xlsx"`,
    },
  });
}
