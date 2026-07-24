import { discrepancyNoticePdf } from "@/lib/export/discrepancy-pdf";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading",
  sea_waybill: "Sea Waybill",
  commercial_invoice: "Commercial Invoice",
  purchase_order: "Purchase Order",
  freight_invoice: "Freight Invoice",
  goods_receipt: "Goods Receipt",
  packing_list: "Packing List",
  arrival_notice: "Arrival Notice",
  booking_confirmation: "Booking Confirmation",
  air_waybill: "Air Waybill",
  other: "Other document",
};

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const { data: shipment } = await supabase.from("shipments").select("id, bl_number, ref").eq("id", id).maybeSingle();
  if (!shipment) return Response.json({ error: "shipment not found" }, { status: 404 });

  const [{ data: docs }, { data: discrepancies }] = await Promise.all([
    supabase.from("documents").select("id, doc_type").eq("shipment_id", id),
    supabase.from("discrepancies").select("severity, field, doc_a, doc_b, value_a, value_b, message").eq("shipment_id", id).eq("resolved", false).order("severity", { ascending: false }),
  ]);
  if (!discrepancies?.length) return Response.json({ error: "no unresolved discrepancies" }, { status: 409 });
  const labels = new Map((docs ?? []).map((doc) => [doc.id, TYPE_LABEL[doc.doc_type] ?? "Document"]));
  const reference = shipment.bl_number ?? shipment.ref ?? `shipment-${id.slice(0, 8)}`;
  const pdf = await discrepancyNoticePdf({
    shipmentReference: reference,
    discrepancies: discrepancies.map((item) => ({
      severity: item.severity as "red" | "amber",
      field: item.field,
      documentA: labels.get(item.doc_a) ?? "Document A",
      documentB: labels.get(item.doc_b) ?? "Document B",
      valueA: item.value_a,
      valueB: item.value_b,
      message: item.message,
    })),
  });
  await supabase.from("events").insert({ owner: user.id, type: "discrepancy_notice_exported", payload: { shipment_id: id, finding_count: discrepancies.length } });
  const safe = reference.replace(/[^a-z0-9_-]+/gi, "_");
  return new Response(pdf as unknown as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${safe}-discrepancy-notice.pdf"`, "Cache-Control": "private, no-store" } });
}
