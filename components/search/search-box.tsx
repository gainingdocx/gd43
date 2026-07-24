"use client";

// Search surface (BUILD_SPEC §M6.5): one box, server-side search via the
// search_documents RPC (GIN on fields + trigram on container numbers),
// doc-type filter chips.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, SearchX } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  doc_type: string;
  status: string;
  created_at: string;
  fields: Record<string, unknown> | null;
}

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "B/L",
  sea_waybill: "Sea Waybill",
  commercial_invoice: "Invoice",
  purchase_order: "Purchase order",
  freight_invoice: "Freight invoice",
  goods_receipt: "Goods receipt",
  packing_list: "Packing list",
  arrival_notice: "Arrival",
  booking_confirmation: "Booking",
  air_waybill: "AWB",
  other: "Other",
};

const CHIPS = [
  ["all", "All"],
  ["bill_of_lading", "B/L"],
  ["sea_waybill", "Sea waybill"],
  ["commercial_invoice", "Invoice"],
  ["purchase_order", "Purchase order"],
  ["freight_invoice", "Freight invoice"],
  ["goods_receipt", "Goods receipt"],
  ["packing_list", "Packing list"],
  ["arrival_notice", "Arrival"],
  ["booking_confirmation", "Booking"],
  ["air_waybill", "AWB"],
] as const;

export function SearchBox() {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<string>("all");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setRows(null);
      setBusy(false);
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("search_documents", { q: query });
      setRows(error ? [] : ((data ?? []) as Row[]));
      setBusy(false);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const visible = (rows ?? []).filter((r) => chip === "all" || r.doc_type === chip);

  const refOf = (r: Row) =>
    (r.fields?.bl_number ?? r.fields?.invoice_no ?? r.fields?.pl_no ?? null) as string | null;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="B/L no, container, party, vessel, port, invoice…"
        aria-label="Search documents"
        className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="flex gap-2">
        {CHIPS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setChip(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              chip === value
                ? "border-signal bg-accent text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
        </p>
      )}

      {!busy && rows !== null && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-10 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nothing matches &quot;{q.trim()}&quot;
          </p>
        </div>
      )}

      {!busy && visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/review/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent"
              >
                <FileText className="size-5 shrink-0 text-signal" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {refOf(r) ?? TYPE_LABEL[r.doc_type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[r.doc_type]} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows === null && !busy && (
        <p className="px-2 text-center text-xs text-muted-foreground">
          Searches B/L numbers, container numbers, parties, vessels, ports and
          invoice numbers across your documents.
        </p>
      )}
    </div>
  );
}
