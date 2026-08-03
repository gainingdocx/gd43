import { Check, FileCheck2, Minus, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

type CellState = "match" | "differs" | "absent";

interface FieldRow {
  field: string;
  cells: CellState[];
  /** Shown only when the row has a finding, so the reader sees the actual clash. */
  values?: string[];
  severity?: "critical" | "warning";
  note?: string;
}

const DOCUMENTS = ["Bill of Lading", "Invoice", "Packing List"];

const ROWS: FieldRow[] = [
  { field: "Consignee", cells: ["match", "match", "match"] },
  { field: "Port of loading", cells: ["match", "match", "match"] },
  {
    field: "Freight terms",
    cells: ["match", "differs", "absent"],
    values: ["CIF", "FOB", "—"],
    severity: "critical",
    note: "Invoice contradicts the B/L — the wrong party gets billed.",
  },
  {
    field: "Gross weight",
    cells: ["match", "match", "differs"],
    values: ["12,480 kg", "12,480 kg", "12,840 kg"],
    severity: "warning",
    note: "Digits transposed on the packing list.",
  },
];

function StateIcon({ state }: { state: CellState }) {
  if (state === "match") {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-positive-soft text-positive">
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "differs") {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-signal text-white">
        <X className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Minus className="size-3" strokeWidth={3} aria-hidden />
    </span>
  );
}

const STATE_LABEL: Record<CellState, string> = {
  match: "agrees",
  differs: "differs",
  absent: "not present",
};

/**
 * The product's core idea drawn rather than described: the same field read from
 * three separate documents, lined up so a disagreement is visible at a glance.
 * Purely presentational — no client JS, no state.
 */
export function DocChain({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-panel",
        className
      )}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-border bg-brand-deep px-4 py-3 text-white sm:px-5">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <FileCheck2 className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.68rem] uppercase tracking-[0.12em] text-white/60">
              Shipment check
            </span>
            <span className="block truncate text-sm font-semibold">3 documents compared</span>
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-[0.68rem] font-bold text-brand-deep">
          2 findings
        </span>
      </figcaption>

      <div className="px-4 py-4 sm:px-5">
        <div
          className="grid items-center gap-x-2 gap-y-0 text-xs"
          style={{ gridTemplateColumns: "minmax(5.5rem,1fr) repeat(3, minmax(0,auto))" }}
        >
          <span aria-hidden />
          {DOCUMENTS.map((doc) => (
            <span
              key={doc}
              className="pb-2 text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground"
            >
              {doc.split(" ").map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
          ))}

          {ROWS.map((row) => (
            <div key={row.field} className="contents">
              <span
                className={cn(
                  "border-t border-border py-2.5 font-medium",
                  row.severity ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {row.field}
              </span>
              {row.cells.map((state, index) => (
                <span
                  key={`${row.field}-${DOCUMENTS[index]}`}
                  className="flex justify-center border-t border-border py-2.5"
                >
                  <StateIcon state={state} />
                  <span className="sr-only">
                    {DOCUMENTS[index]}: {STATE_LABEL[state]}
                    {row.values ? ` (${row.values[index]})` : ""}
                  </span>
                </span>
              ))}

              {row.values ? (
                <div
                  className={cn(
                    "col-span-full mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-[0.7rem] leading-5",
                    row.severity === "critical"
                      ? "bg-signal/8 text-foreground"
                      : "bg-amber-soft text-amber-ink"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-bold uppercase tracking-[0.08em]",
                      row.severity === "critical" ? "text-signal" : "text-amber-ink"
                    )}
                  >
                    <TriangleAlert className="size-3" aria-hidden />
                    {row.severity}
                  </span>
                  <span className="font-mono font-medium">{row.values.filter((value) => value !== "—").join("  vs  ")}</span>
                  <span className="w-full text-muted-foreground sm:w-auto">{row.note}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
