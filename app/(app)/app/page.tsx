import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  FileText,
  ScanLine,
  Ship,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { suggest, type NextActionDoc } from "@/lib/next-action";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading",
  sea_waybill: "Sea Waybill",
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
  arrival_notice: "Arrival Notice",
  booking_confirmation: "Booking Confirmation",
  other: "Document",
};

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 200 };
const MINUTES_SAVED_PER_DOC = 12; // manual keying baseline (spec §M6.1)

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Home</h1>
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-signal">
            <ScanLine className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Parse your first shipping document</p>
            <p className="text-sm text-muted-foreground">
              Try one document free without an account — B/L, invoice or
              packing list.
            </p>
          </div>
          <Button
            render={<Link href="/app/scan" />}
            size="lg"
            className="bg-signal text-signal-foreground hover:bg-signal/90"
          >
            Scan a document
          </Button>
          <Link href="/app/account" className="text-sm text-muted-foreground underline">
            or sign in
          </Link>
        </div>
      </div>
    );
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [
    { data: docs },
    { data: openDisc },
    { data: checkEvents },
    { data: profile },
    { count: monthCount },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, status, shipment_id, validation, created_at, fields")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("discrepancies").select("severity, shipment_id").eq("resolved", false),
    supabase.from("events").select("payload").eq("type", "check_run").limit(200),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
  ]);

  const allDocs = docs ?? [];
  const parsedCount = allDocs.filter((d) => d.status === "parsed").length;
  const plan = profile?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const used = monthCount ?? 0;
  const savedMin = parsedCount * MINUTES_SAVED_PER_DOC;
  const savedLabel =
    savedMin >= 60 ? `${Math.floor(savedMin / 60)}h ${savedMin % 60}m` : `${savedMin}m`;

  const actionDocs: NextActionDoc[] = allDocs.map((d) => ({
    id: d.id,
    doc_type: d.doc_type,
    status: d.status,
    shipment_id: d.shipment_id,
    validation_fails: Array.isArray(d.validation)
      ? (d.validation as { status?: string }[]).filter((v) => v.status === "fail").length
      : 0,
  }));
  const checkedShipmentIds = [
    ...new Set(
      (checkEvents ?? [])
        .map((e) => (e.payload as { shipment_id?: string } | null)?.shipment_id)
        .filter((x): x is string => typeof x === "string")
    ),
  ];
  const actions = suggest({
    docs: actionDocs,
    openDiscrepancies: (openDisc ?? []) as { severity: "red" | "amber"; shipment_id: string }[],
    checkedShipmentIds,
  });
  const [primary, ...secondary] = actions;

  const refOf = (d: { fields: unknown; doc_type: string }) => {
    const f = d.fields as Record<string, unknown> | null;
    if (!f) return null;
    return (f.bl_number ?? f.invoice_no ?? f.pl_no ?? null) as string | null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Home</h1>

      {/* Usage + time saved */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Usage this month
          </p>
          <p className="mt-1 text-xl font-bold">
            {used}
            <span className="text-sm font-normal text-muted-foreground"> / {limit}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
            <div
              className={cn(
                "h-full rounded-full",
                used >= limit ? "bg-destructive" : "bg-signal"
              )}
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Time saved</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold">
            <Clock3 className="size-4 text-signal" aria-hidden /> {savedLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            vs. manual keying ({MINUTES_SAVED_PER_DOC} min/doc)
          </p>
        </div>
      </div>

      {/* Next action */}
      {primary && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Next action
          </h2>
          <Link
            href={primary.href}
            className="block rounded-2xl border border-signal/40 bg-accent p-4 hover:bg-accent/70"
          >
            <p className="flex items-center justify-between font-semibold text-primary">
              {primary.label}
              <ChevronRight className="size-4" aria-hidden />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{primary.description}</p>
          </Link>
          {secondary.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {secondary.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent documents */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent documents
          </h2>
          <Link
            href="/app/shipments"
            className="flex items-center gap-1 text-xs font-medium text-signal"
          >
            <Ship className="size-3.5" aria-hidden /> Shipments
          </Link>
        </div>
        {allDocs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No documents yet — scan your first one.
            </p>
            <Button
              render={<Link href="/app/scan" />}
              className="bg-signal text-signal-foreground hover:bg-signal/90"
            >
              Scan a document
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {allDocs.slice(0, 6).map((d) => {
              const fails = Array.isArray(d.validation)
                ? (d.validation as { status?: string }[]).filter((v) => v.status === "fail").length
                : 0;
              return (
                <li key={d.id}>
                  <Link
                    href={`/app/review/${d.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
                  >
                    <FileText className="size-5 shrink-0 text-signal" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {refOf(d) ?? TYPE_LABEL[d.doc_type] ?? "Document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABEL[d.doc_type]} ·{" "}
                        <span className="capitalize">{d.status}</span>
                      </p>
                    </div>
                    {fails > 0 && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        {fails}
                      </span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
