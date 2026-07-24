import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Ship } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { assessCompleteness } from "@/lib/shipments/completeness";

export default async function ShipmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/shipments");

  const [{ data: shipments }, { data: docs }, { data: open }] = await Promise.all([
    supabase
      .from("shipments")
      .select("id, bl_number, ref, bill_level, master_shipment_id, house_bl_number, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("documents").select("id, shipment_id, doc_type, status, source_filename").not("shipment_id", "is", null),
    supabase.from("discrepancies").select("id, shipment_id").eq("resolved", false),
  ]);

  const docCount = new Map<string, number>();
  for (const d of docs ?? []) {
    if (d.shipment_id) docCount.set(d.shipment_id, (docCount.get(d.shipment_id) ?? 0) + 1);
  }
  const openCount = new Map<string, number>();
  for (const d of open ?? []) {
    openCount.set(d.shipment_id, (openCount.get(d.shipment_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Shipments</h1>
      {(shipments ?? []).length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Shipments appear automatically when you parse a bill of lading, or
          from a document&apos;s review screen.
        </p>
      ) : (
        <ul className="space-y-2">
          {(shipments ?? []).map((s) => (
            <li key={s.id}>
              <Link
                href={`/app/shipments/${s.id}`}
                className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent ${s.bill_level === "house" ? "ml-5 border-l-4 border-l-signal/45" : ""}`}
              >
                <Ship className="size-5 text-signal" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.bl_number ?? s.ref ?? `#${s.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-2 font-semibold uppercase tracking-wide">{s.bill_level === "master" ? "Master B/L" : s.bill_level === "house" ? "House B/L" : "Shipment"}</span>
                    {docCount.get(s.id) ?? 0} document{(docCount.get(s.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                  {(() => {
                    const readiness = assessCompleteness((docs ?? []).filter((document) => document.shipment_id === s.id));
                    return <p className={readiness.percent === 100 ? "mt-1 text-xs font-semibold text-success" : "mt-1 text-xs font-semibold text-warn"}>{readiness.percent === 100 ? "Document set complete" : `${readiness.required - readiness.complete} required document${readiness.required - readiness.complete === 1 ? "" : "s"} missing`}</p>;
                  })()}
                </div>
                {(openCount.get(s.id) ?? 0) > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {openCount.get(s.id)} open
                  </span>
                )}
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
