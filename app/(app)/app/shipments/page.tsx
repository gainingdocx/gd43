import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Ship } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function ShipmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/app/account");

  const [{ data: shipments }, { data: docs }, { data: open }] = await Promise.all([
    supabase
      .from("shipments")
      .select("id, bl_number, ref, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("documents").select("id, shipment_id").not("shipment_id", "is", null),
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
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
              >
                <Ship className="size-5 text-signal" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.bl_number ?? s.ref ?? `#${s.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {docCount.get(s.id) ?? 0} document{(docCount.get(s.id) ?? 0) === 1 ? "" : "s"}
                  </p>
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
