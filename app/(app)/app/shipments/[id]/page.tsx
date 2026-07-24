import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Gauge,
  FileDown,
  FileText,
  ShieldCheck,
  Network,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { ThreeWayMatchResult } from "@/lib/matching";
import { resolveDiscrepancy, runShipmentCheck } from "./actions";
import { ShipmentOperationsPanel } from "@/components/shipments/operations-panel";

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

export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/shipments");

  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, owner, bl_number, ref, bill_level, master_shipment_id, house_bl_number, export_approval_required, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!shipment) notFound();
  const [{ data: masterShipment }, { data: houseShipments }] = await Promise.all([
    shipment.master_shipment_id
      ? supabase.from("shipments").select("id, bl_number, ref").eq("id", shipment.master_shipment_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("shipments").select("id, bl_number, ref, house_bl_number").eq("master_shipment_id", id).order("created_at"),
  ]);

  const [{ data: docs }, { data: discrepancies }, { data: checks }, { data: matchRuns }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, status, created_at, updated_at, fields")
      .eq("shipment_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("discrepancies")
      .select("id, severity, field, doc_a, doc_b, value_a, value_b, message, resolved")
      .eq("shipment_id", id)
      .order("severity") // amber < red alphabetically — re-sorted below
      .order("resolved"),
    supabase
      .from("events")
      .select("payload, created_at")
      .eq("type", "check_run")
      .contains("payload", { shipment_id: id })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("match_runs")
      .select("decision, score, result, created_at")
      .eq("shipment_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const docList = docs ?? [];
  const { data: currentExportApproval } = shipment.export_approval_required
    ? await supabase.from("export_approvals").select("status, decided_at")
        .eq("shipment_id", id).eq("status", "approved").order("decided_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const latestDocumentUpdate = docList.reduce((latest, document) => document.updated_at > latest ? document.updated_at : latest, "");
  const exportReady = !shipment.export_approval_required ||
    Boolean(currentExportApproval?.decided_at && currentExportApproval.decided_at >= latestDocumentUpdate);
  const open = (discrepancies ?? []).filter((d) => !d.resolved);
  const resolved = (discrepancies ?? []).filter((d) => d.resolved);
  const lastCheck = checks?.[0] as
    | { payload: { findings?: number }; created_at: string }
    | undefined;
  const latestMatch = matchRuns?.[0] as
    | { decision: string; score: number; result: ThreeWayMatchResult; created_at: string }
    | undefined;
  const openSorted = [...open].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1
  );

  const bl = docList.find((d) => d.doc_type === "bill_of_lading" && d.fields);
  const blFields = (bl?.fields ?? null) as Record<string, unknown> | null;
  const partyName = (p: unknown) =>
    p && typeof p === "object" ? ((p as { name?: string }).name ?? null) : null;
  const portName = (p: unknown) =>
    p && typeof p === "object" ? ((p as { name?: string }).name ?? null) : null;
  const docLabel = (docId: string | null) => {
    const d = docList.find((x) => x.id === docId);
    return d ? (TYPE_LABEL[d.doc_type] ?? "Document") : "Document";
  };

  const summary: [string, string | null][] = blFields
    ? [
        ["B/L number", (blFields.bl_number as string) ?? null],
        ["Shipper", partyName(blFields.shipper)],
        ["Consignee", partyName(blFields.consignee)],
        ["From", portName(blFields.port_of_load)],
        ["To", portName(blFields.port_of_discharge)],
        [
          "Containers",
          Array.isArray(blFields.containers) && blFields.containers.length > 0
            ? String(blFields.containers.length)
            : null,
        ],
        [
          "Total gross",
          blFields.total_gross_kg != null ? `${blFields.total_gross_kg} kg` : null,
        ],
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{shipment.bill_level === "master" ? "Master bill shipment" : shipment.bill_level === "house" ? "House bill shipment" : "Shipment"}</p>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {shipment.bl_number ?? shipment.ref ?? `#${shipment.id.slice(0, 8)}`}
        </h1>
      </div>

      {(masterShipment || (houseShipments ?? []).length > 0) && <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><Network className="size-5 text-signal" aria-hidden/><h2 className="font-bold text-primary">B/L hierarchy</h2></div>
        {masterShipment && <p className="mt-3 text-sm">Master: <Link className="font-semibold text-signal underline" href={`/app/shipments/${masterShipment.id}`}>{masterShipment.bl_number ?? masterShipment.ref}</Link></p>}
        {(houseShipments ?? []).length > 0 && <ul className="mt-3 grid gap-2 sm:grid-cols-2">{(houseShipments ?? []).map((house) => <li key={house.id}><Link className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent" href={`/app/shipments/${house.id}`}><span>{house.house_bl_number ?? house.bl_number ?? house.ref}</span><ChevronRight className="size-4" aria-hidden/></Link></li>)}</ul>}
      </section>}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div><h2 className="font-bold text-primary">Complete shipment export</h2><p className="mt-1 text-xs text-muted-foreground">{shipment.bill_level === "master" ? "Includes this master record and every linked house shipment." : "Includes every parsed document and line item in this shipment."}</p></div>
        {exportReady ? <div className="flex flex-wrap gap-2"><Button render={<a href={`/api/shipments/${shipment.id}/export?format=json`} />} variant="outline">JSON</Button><Button render={<a href={`/api/shipments/${shipment.id}/export?format=pdf`} />} variant="outline">PDF summary</Button><Button render={<a href={`/api/shipments/${shipment.id}/export?format=xlsx`} />}><FileDown aria-hidden/> Excel workbook</Button></div> : <span className="rounded-full bg-warn/10 px-3 py-1.5 text-xs font-semibold text-warn">Locked pending approval</span>}
      </section>

      {summary.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
          {summary
            .filter(([, v]) => v !== null)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 truncate font-medium">{v}</dd>
              </div>
            ))}
        </dl>
      )}

      <ShipmentOperationsPanel shipmentId={shipment.id} />

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-signal/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Automated three-way match</p>
              <h2 className="mt-1 text-xl font-bold text-primary">
                {!latestMatch ? "Ready for evidence" : latestMatch.decision === "matched" ? "Matched" : latestMatch.decision === "blocked" ? "Blocked" : latestMatch.decision === "review" ? "Needs review" : "Evidence incomplete"}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Purchase order → transport evidence → invoice, reconciled with deterministic rules and an immutable audit result.
              </p>
            </div>
            <div className={cn(
              "flex min-w-24 items-center justify-center gap-2 rounded-2xl border px-4 py-3",
              latestMatch?.decision === "matched" ? "border-primary/25 bg-primary/8 text-primary" :
                latestMatch?.decision === "blocked" ? "border-destructive/30 bg-destructive/8 text-destructive" : "border-border bg-background text-muted-foreground"
            )}>
              <Gauge className="size-5" aria-hidden />
              <span className="text-2xl font-bold tabular-nums">{latestMatch?.score ?? "—"}</span>
              <span className="text-xs">/100</span>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {(latestMatch?.result.requirements ?? [
            { role: "purchase_order", label: "Purchase order", present: docList.some((d) => d.doc_type === "purchase_order") },
            { role: "transport_evidence", label: "B/L or receipt evidence", present: docList.some((d) => ["bill_of_lading", "sea_waybill", "packing_list", "goods_receipt"].includes(d.doc_type)) },
            { role: "invoice", label: "Freight or commercial invoice", present: docList.some((d) => ["freight_invoice", "commercial_invoice"].includes(d.doc_type)) },
          ]).map((requirement) => (
            <div key={requirement.role} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
              {requirement.present ? <CircleCheck className="size-5 text-primary" aria-hidden /> : <CircleDashed className="size-5 text-muted-foreground" aria-hidden />}
              <div>
                <p className="text-sm font-semibold">{requirement.label}</p>
                <p className="text-xs text-muted-foreground">{requirement.present ? "Evidence attached" : "Still required"}</p>
              </div>
            </div>
          ))}
        </div>
        {latestMatch && (
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/8 px-2.5 py-1 text-primary">{latestMatch.result.counts.pass} passed</span>
            <span className="rounded-full bg-destructive/8 px-2.5 py-1 text-destructive">{latestMatch.result.counts.fail} failed</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{latestMatch.result.counts.review} review</span>
            <span className="ml-auto">Run {new Date(latestMatch.created_at).toLocaleString()}</span>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Documents ({docList.length})
        </h2>
        {docList.length === 0 && (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No documents in this shipment yet — attach them from a document&apos;s
            review screen.
          </p>
        )}
        <ul className="space-y-2">
          {docList.map((d) => (
            <li key={d.id}>
              <Link
                href={`/app/review/${d.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
              >
                <FileText className="size-5 text-signal" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {TYPE_LABEL[d.doc_type] ?? "Document"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">{d.status}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <form action={runShipmentCheck}>
        <input type="hidden" name="shipmentId" value={shipment.id} />
        <Button
          type="submit"
          size="lg"
          className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
          disabled={docList.filter((d) => d.status === "parsed").length < 2}
        >
          <ShieldCheck className="size-5" aria-hidden /> Run three-way match
        </Button>
        {docList.filter((d) => d.status === "parsed").length < 2 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Attach at least two parsed documents to start reconciliation; all three evidence roles are required for approval.
          </p>
        )}
      </form>

      {lastCheck && openSorted.length === 0 && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
          <p className="font-semibold">No open discrepancies</p>
          <p className="text-xs text-muted-foreground">
            Last checked {new Date(lastCheck.created_at).toLocaleString()} across the parsed shipment documents.
          </p>
        </div>
      )}

      {openSorted.length > 0 && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Discrepancies ({openSorted.length})</h2>
            <Button render={<a href={`/api/shipments/${shipment.id}/discrepancy-notice`} />} variant="outline">
              <FileDown aria-hidden /> Download claims notice PDF
            </Button>
          </div>
          <ul className="space-y-3">
            {openSorted.map((d) => (
              <li
                key={d.id}
                className={cn(
                  "space-y-3 rounded-xl border bg-card p-4",
                  d.severity === "red" ? "border-destructive/50" : "border-warn/50"
                )}
              >
                <div className="flex items-start gap-2">
                  <CircleAlert
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      d.severity === "red" ? "text-destructive" : "text-warn"
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium">{d.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.severity === "red" ? "Money/legal field" : "Consistency issue"} · {d.field}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <form action={resolveDiscrepancy}>
                    <input type="hidden" name="discrepancyId" value={d.id} />
                    <input type="hidden" name="winner" value="a" />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="block text-xs text-muted-foreground">
                        {docLabel(d.doc_a)} is right
                      </span>
                      <span className="block truncate font-medium">{d.value_a ?? "—"}</span>
                    </button>
                  </form>
                  <form action={resolveDiscrepancy}>
                    <input type="hidden" name="discrepancyId" value={d.id} />
                    <input type="hidden" name="winner" value="b" />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="block text-xs text-muted-foreground">
                        {docLabel(d.doc_b)} is right
                      </span>
                      <span className="block truncate font-medium">{d.value_b ?? "—"}</span>
                    </button>
                  </form>
                </div>
                <form action={resolveDiscrepancy} className="text-right">
                  <input type="hidden" name="discrepancyId" value={d.id} />
                  <input type="hidden" name="winner" value="dismiss" />
                  <button type="submit" className="text-xs text-muted-foreground underline">
                    Dismiss without changing documents
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resolved.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {resolved.length} discrepanc{resolved.length > 1 ? "ies" : "y"} resolved earlier.
        </p>
      )}
    </div>
  );
}
