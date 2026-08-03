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
import { FlagshipWorkflows } from "@/components/shipments/flagship-workflows";
import { pushShipmentToConnection } from "@/app/(app)/app/integrations/actions";

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
  shipping_instructions: "Shipping Instructions",
  certificate_of_origin: "Certificate of Origin",
  quotation: "Freight Quotation",
  rate_confirmation: "Rate Confirmation",
  container_event: "Container Event",
  demurrage_detention_invoice: "D&D Invoice",
  air_waybill: "Air Waybill",
  shipper_letter_of_instruction: "Shipper's Letter of Instruction",
  dangerous_goods_declaration: "Dangerous Goods Declaration",
  air_cargo_manifest: "Air Cargo Manifest",
  cargo_security_declaration: "Cargo Security Declaration",
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

  const [{ data: docs }, { data: discrepancies }, { data: checks }, { data: matchRuns }, { data: connections }, { data: connectorPushes }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, status, created_at, updated_at, fields")
      .eq("shipment_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("discrepancies")
      .select("id, severity, field, workflow_key, rule_reason, source_evidence, questioned_amount, questioned_currency, doc_a, doc_b, value_a, value_b, message, resolved, resolution_status, resolved_by_email, resolved_at, resolution_note")
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
    supabase.from("integration_connections").select("id, name, profile, last_test_status, last_tested_at").eq("enabled", true).order("created_at", { ascending: false }),
    supabase.from("integration_pushes").select("id, connection_id, status, response_status, error, attempted_at").eq("shipment_id", id).order("attempted_at", { ascending: false }).limit(5),
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
    a.severity === b.severity ? 0 : a.severity === "red" ? -1 : b.severity === "red" ? 1 : a.severity === "amber" ? -1 : 1
  );
  const questionedByCurrency = open.reduce<Record<string, number>>((totals, item) => {
    if (item.questioned_amount && item.questioned_amount > 0) {
      const currency = item.questioned_currency || "UNSPECIFIED";
      totals[currency] = (totals[currency] ?? 0) + Number(item.questioned_amount);
    }
    return totals;
  }, {});

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
  const sourcePage = (docId: string | null, fieldPath: string | null) => {
    if (!docId || !fieldPath) return null;
    const document = docList.find((item) => item.id === docId);
    const fields = document?.fields as { _meta?: { page_refs?: Record<string, number> } } | null;
    const topLevel = fieldPath.replace(/^fields\./, "").split(".")[0].split("[")[0];
    return fields?._meta?.page_refs?.[topLevel] ?? null;
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

      <section className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-primary">Push reviewed shipment to TMS/ERP</h2><p className="mt-1 text-xs text-muted-foreground">Direct authenticated delivery is blocked while critical discrepancies remain open. Test the tenant connection before production use.</p></div>{(connections ?? []).length > 0 ? <form action={pushShipmentToConnection} className="flex flex-wrap gap-2"><input type="hidden" name="shipmentId" value={shipment.id}/><select name="connectionId" required className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm">{(connections ?? []).map((connection) => <option key={connection.id} value={connection.id}>{connection.name} Â· {connection.profile.replace(/_/g, " ")}{connection.last_test_status >= 200 && connection.last_test_status < 300 ? " Â· tested" : " Â· test required"}</option>)}</select><Button type="submit" disabled={open.some((item) => item.severity === "red")}>Push shipment</Button></form> : <Button render={<Link href="/app/integrations" />} variant="outline">Configure connection</Button>}</div>{(connectorPushes ?? []).length > 0 && <ul className="mt-3 divide-y rounded-lg border border-border">{(connectorPushes ?? []).map((push) => <li key={push.id} className="flex justify-between gap-3 px-3 py-2 text-xs"><span className={push.status === "delivered" ? "font-bold text-success" : "font-bold text-destructive"}>{push.status}</span><span className="text-muted-foreground">{push.response_status || push.error || "network error"} Â· {new Date(push.attempted_at).toLocaleString()}</span></li>)}</ul>}</section>

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

      <FlagshipWorkflows shipmentId={shipment.id} documents={docList.map((document) => ({
        id: document.id,
        doc_type: document.doc_type,
        status: document.status,
        fields: document.fields as Record<string, unknown> | null,
      }))} />

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-signal/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Connected shipment control</p>
              <h2 className="mt-1 text-xl font-bold text-primary">
                {!latestMatch ? "Ready for evidence" : latestMatch.decision === "matched" ? "Matched" : latestMatch.decision === "blocked" ? "Blocked" : latestMatch.decision === "review" ? "Needs review" : "Evidence incomplete"}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Active flagship evidence chains are reconciled with deterministic rules and preserved as an immutable audit result.
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
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {(latestMatch?.result.workflows ?? []).map((workflow) => (
            <div key={workflow.key} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
              {workflow.state === "ready" ? <CircleCheck className="size-5 text-primary" aria-hidden /> : <CircleDashed className="size-5 text-muted-foreground" aria-hidden />}
              <div>
                <p className="text-sm font-semibold">{workflow.name}</p>
                <p className="text-xs text-muted-foreground">{workflow.completeRoles}/{workflow.totalRoles} evidence roles ready</p>
              </div>
            </div>
          ))}
          {!latestMatch && <p className="col-span-full rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">Run the connected check to create a versioned workflow result.</p>}
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

      <form id="run-connected-check" action={runShipmentCheck}>
        <input type="hidden" name="shipmentId" value={shipment.id} />
        <details className="mb-3 rounded-xl border border-border bg-card p-3"><summary className="cursor-pointer text-sm font-semibold text-primary">Matching tolerances</summary><p className="mt-2 text-xs text-muted-foreground">Applied to this check run and saved with its immutable result. Exact identifiers, references and currencies never use these tolerances.</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><label className="text-xs font-medium">Amount percent<input name="amountPercent" type="number" min="0" max="100" step="0.01" defaultValue="0.5" className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-2"/></label><label className="text-xs font-medium">Amount absolute<input name="amountAbsolute" type="number" min="0" step="0.01" defaultValue="1" className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-2"/></label><label className="text-xs font-medium">Quantity percent<input name="quantityPercent" type="number" min="0" max="100" step="0.01" defaultValue="0" className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-2"/></label></div></details>
        <Button
          type="submit"
          size="lg"
          className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
          disabled={docList.filter((d) => d.status === "parsed").length < 2}
        >
          <ShieldCheck className="size-5" aria-hidden /> Run connected document check
        </Button>
        {docList.filter((d) => d.status === "parsed").length < 2 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Attach at least two parsed documents to start reconciliation. Each flagship workflow shows its own missing evidence.
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
          {Object.keys(questionedByCurrency).length > 0 && <div className="rounded-xl border border-[#f4c400]/70 bg-[#fffdf2] p-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">Open amount questioned</p><p className="mt-1 text-2xl font-black text-primary">{Object.entries(questionedByCurrency).map(([currency, amount]) => `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join(" Â· ")}</p><p className="mt-1 text-xs text-muted-foreground">Sum of quantified open charge exceptions; confirm currency and contractual entitlement before withholding payment.</p></div>}
          <ul className="space-y-3">
            {openSorted.map((d) => {
              const rule = latestMatch?.result.rules.find((item) => item.rule_id === d.field);
              const evidence = (d.source_evidence ?? {}) as { a?: { page?: number; quote?: string | null; bbox?: [number, number, number, number] | null; field_path?: string | null } | null; b?: { page?: number; quote?: string | null; bbox?: [number, number, number, number] | null; field_path?: string | null } | null };
              const pageA = evidence.a?.page ?? sourcePage(d.doc_a, rule?.field_a ?? d.field);
              const pageB = evidence.b?.page ?? sourcePage(d.doc_b, rule?.field_b ?? d.field);
              return (
              <li
                key={d.id}
                className={cn(
                  "space-y-3 rounded-xl border bg-card p-4",
                  d.severity === "red" ? "border-destructive/50" : d.severity === "amber" ? "border-warn/50" : "border-primary/30"
                )}
              >
                <div className="flex items-start gap-2">
                  <CircleAlert
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      d.severity === "red" ? "text-destructive" : d.severity === "amber" ? "text-warn" : "text-primary"
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium">{d.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.severity === "red" ? "Critical finding" : d.severity === "amber" ? "Warning finding" : "Information finding"} · {d.workflow_key?.replace(/_/g, " ") ?? "supporting"} · {d.field}
                    </p>
                    {(pageA || pageB) && <div className="mt-2 flex flex-wrap gap-2 text-xs">{pageA && d.doc_a && <Link href={`/app/review/${d.doc_a}?page=${pageA}${evidence.a?.field_path ? `&focus=${encodeURIComponent(evidence.a.field_path)}` : ""}`} className="rounded-full bg-secondary px-2.5 py-1 font-bold text-primary underline">{docLabel(d.doc_a)} {evidence.a?.bbox ? "highlight" : "source"} p.{pageA}</Link>}{pageB && d.doc_b && <Link href={`/app/review/${d.doc_b}?page=${pageB}${evidence.b?.field_path ? `&focus=${encodeURIComponent(evidence.b.field_path)}` : ""}`} className="rounded-full bg-secondary px-2.5 py-1 font-bold text-primary underline">{docLabel(d.doc_b)} {evidence.b?.bbox ? "highlight" : "source"} p.{pageB}</Link>}</div>}
                    {(evidence.a?.quote || evidence.b?.quote) && <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {evidence.a?.quote && <blockquote className="rounded-lg border border-border bg-background p-2 text-xs"><span className="block font-bold text-primary">{docLabel(d.doc_a)} evidence</span><mark className="mt-1 inline bg-[#fff0a6] px-1 text-foreground">{evidence.a.quote}</mark></blockquote>}
                      {evidence.b?.quote && <blockquote className="rounded-lg border border-border bg-background p-2 text-xs"><span className="block font-bold text-primary">{docLabel(d.doc_b)} evidence</span><mark className="mt-1 inline bg-[#fff0a6] px-1 text-foreground">{evidence.b.quote}</mark></blockquote>}
                    </div>}
                    {d.rule_reason && <p className="mt-2 text-xs"><span className="font-bold text-primary">Why this rule exists:</span> {d.rule_reason}</p>}
                    {d.questioned_amount && Number(d.questioned_amount) > 0 && <p className="mt-2 inline-flex rounded-full bg-[#fff3b0] px-2.5 py-1 text-xs font-black text-[#654500]">Amount questioned: {d.questioned_currency ?? ""} {Number(d.questioned_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Open until a reviewer selects the supported value or records a dismissal. The decision is preserved in the shipment activity trail.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <form action={resolveDiscrepancy}>
                    <input type="hidden" name="discrepancyId" value={d.id} />
                    <input type="hidden" name="winner" value="a" />
                    <input name="resolutionNote" maxLength={1000} placeholder="Optional resolution note" className="mb-2 min-h-9 w-full rounded-lg border border-border bg-background px-2 text-xs" />
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
                    <input name="resolutionNote" maxLength={1000} placeholder="Optional resolution note" className="mb-2 min-h-9 w-full rounded-lg border border-border bg-background px-2 text-xs" />
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
                  <input name="resolutionNote" maxLength={1000} placeholder="Why is this safe to dismiss?" className="mr-2 min-h-9 rounded-lg border border-border bg-background px-2 text-xs" />
                  <button type="submit" className="text-xs text-muted-foreground underline">
                    Dismiss without changing documents
                  </button>
                </form>
              </li>
              );
            })}
          </ul>
        </section>
      )}

      {resolved.length > 0 && <details className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold text-primary">Resolved discrepancies ({resolved.length})</summary><ul className="mt-3 divide-y divide-border">{resolved.map((item) => <li key={item.id} className="py-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold text-primary">{item.field}</span><span className="capitalize text-muted-foreground">{item.resolution_status?.replace(/_/g, " ") ?? "resolved"}</span></div><p className="mt-1 text-muted-foreground">Resolved {item.resolved_at ? new Date(item.resolved_at).toLocaleString() : "earlier"}{item.resolved_by_email ? ` by ${item.resolved_by_email}` : ""}.</p>{item.resolution_note && <p className="mt-1 rounded-md bg-muted px-2 py-1.5">{item.resolution_note}</p>}</li>)}</ul></details>}
    </div>
  );
}
