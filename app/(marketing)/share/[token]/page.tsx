import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";

import { containerRows, summaryPairs } from "@/lib/export/rows";
import { createClient } from "@/lib/supabase/server";
import type { ValidationResult } from "@/lib/validators";
import { cn } from "@/lib/utils";

// Public read-only document view (BUILD_SPEC §M7): unguessable token,
// revocable by the owner. Never indexed.
export const metadata: Metadata = {
  title: "Shared document",
  robots: { index: false, follow: false },
};

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
  other: "Shipping document",
};

interface SharedDoc {
  doc_type: string;
  fields: Record<string, unknown>;
  validation: ValidationResult[] | null;
  created_at: string;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[\w-]{24,128}$/.test(token)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_document", { token });
  if (!data) notFound();
  const doc = data as unknown as SharedDoc;

  const validation = doc.validation ?? [];
  const counts = {
    pass: validation.filter((v) => v.status === "pass").length,
    warn: validation.filter((v) => v.status === "warn").length,
    fail: validation.filter((v) => v.status === "fail").length,
  };
  const pairs = summaryPairs(doc.doc_type, doc.fields).filter((p) => p.value !== "");
  const containers = containerRows(doc.fields);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Shared read-only copy · parsed {new Date(doc.created_at).toLocaleDateString()}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
          {TYPE_LABEL[doc.doc_type] ?? "Document"}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 font-medium text-success">
          <CircleCheck className="size-4" aria-hidden /> {counts.pass} pass
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-warn/10 px-3 py-1 font-medium text-warn">
          <CircleAlert className="size-4" aria-hidden /> {counts.warn} warn
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
          <CircleAlert className="size-4" aria-hidden /> {counts.fail} fail
        </span>
        <span className="text-xs text-muted-foreground">
          deterministic checks by GainingDocx
        </span>
      </div>

      {validation.filter((v) => v.status !== "pass").length > 0 && (
        <ul className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
          {validation
            .filter((v) => v.status !== "pass")
            .slice(0, 6)
            .map((v, i) => (
              <li
                key={i}
                className={cn(
                  "flex gap-2",
                  v.status === "fail" ? "text-destructive" : "text-warn"
                )}
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {v.message}
              </li>
            ))}
        </ul>
      )}

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        {pairs.map((p) => (
          <div key={p.label}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium">{p.value}</dd>
          </div>
        ))}
      </dl>

      {containers.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                {["Container", "Seal", "Type", "Packages", "Gross kg", "CBM"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {containers.slice(1).map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2 font-medium">{row[0]}</td>
                  <td className="px-4 py-2">{row[1]}</td>
                  <td className="px-4 py-2">{row[2]}</td>
                  <td className="px-4 py-2">{row[3]}</td>
                  <td className="px-4 py-2">{row[5]}</td>
                  <td className="px-4 py-2">{row[7]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Shared via GainingDocx — AI shipping-document parsing with
        deterministic validation. The document owner can revoke this link at
        any time.
      </p>
    </div>
  );
}
