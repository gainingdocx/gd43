import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight,
  CircleAlert,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { resolveDiscrepancy, runShipmentCheck } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading",
  sea_waybill: "Sea Waybill",
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
  arrival_notice: "Arrival Notice",
  booking_confirmation: "Booking Confirmation",
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
  if (!user) redirect("/app/account");

  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, bl_number, ref, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!shipment) notFound();

  const [{ data: docs }, { data: discrepancies }, { data: checks }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, status, created_at, fields")
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
  ]);

  const docList = docs ?? [];
  const open = (discrepancies ?? []).filter((d) => !d.resolved);
  const resolved = (discrepancies ?? []).filter((d) => d.resolved);
  const lastCheck = checks?.[0] as
    | { payload: { findings?: number }; created_at: string }
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipment</p>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {shipment.bl_number ?? shipment.ref ?? `#${shipment.id.slice(0, 8)}`}
        </h1>
      </div>

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
          <ShieldCheck className="size-5" aria-hidden /> Run Shipment Check
        </Button>
        {docList.filter((d) => d.status === "parsed").length < 2 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Needs at least two parsed documents to cross-check.
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Discrepancies ({openSorted.length})
          </h2>
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
