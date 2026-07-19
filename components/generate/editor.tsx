"use client";

// Editable generation draft (BUILD_SPEC §M7): user reviews/edits every
// value before the PDF is rendered. All edits stay client-side; the server
// only receives the final draft to render.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FileDown, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GenDoc, GenLine, GenType } from "@/lib/generate/map";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<GenType, string> = {
  packing_list: "Packing list",
  commercial_invoice: "Commercial invoice",
  shipping_instructions: "Shipping instructions",
};

const EMPTY_LINE: GenLine = {
  description: "", hs_code: "", packages: "", cartons: "",
  net_kg: "", gross_kg: "", volume_cbm: "", unit_price: "", amount: "",
};

const LINE_COLS: { key: keyof GenLine; label: string; wide?: boolean }[] = [
  { key: "description", label: "Description", wide: true },
  { key: "hs_code", label: "HS code" },
  { key: "packages", label: "Pkgs" },
  { key: "cartons", label: "Cartons" },
  { key: "net_kg", label: "Net kg" },
  { key: "gross_kg", label: "Gross kg" },
  { key: "volume_cbm", label: "CBM" },
  { key: "unit_price", label: "Unit price" },
  { key: "amount", label: "Amount" },
];

export function GenerateEditor(props: {
  docId: string;
  draft: GenDoc;
  alternatives: GenType[];
  current: GenType;
}) {
  const router = useRouter();
  const [gen, setGen] = useState<GenDoc>(props.draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setHeader = (i: number, value: string) =>
    setGen((g) => ({
      ...g,
      header: g.header.map((h, hi) => (hi === i ? { ...h, value } : h)),
    }));
  const setParty = (i: number, value: string) =>
    setGen((g) => ({
      ...g,
      parties: g.parties.map((p, pi) => (pi === i ? { ...p, value } : p)),
    }));
  const setTotal = (i: number, value: string) =>
    setGen((g) => ({
      ...g,
      totals: g.totals.map((t, ti) => (ti === i ? { ...t, value } : t)),
    }));
  const setLine = (i: number, key: keyof GenLine, value: string) =>
    setGen((g) => ({
      ...g,
      lines: g.lines.map((l, li) => (li === i ? { ...l, [key]: value } : l)),
    }));

  async function download() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: props.docId, gen }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `PDF render failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gen.type}-draft.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const input =
    "h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring";

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href={`/app/review/${props.docId}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to document
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {TYPE_LABEL[gen.type]} draft
          </h1>
        </div>
      </div>

      {props.alternatives.length > 1 && (
        <div className="flex gap-2">
          {props.alternatives.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => router.push(`/app/generate/${props.docId}?type=${t}`)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                t === props.current
                  ? "border-signal bg-accent text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <p className="rounded-lg bg-accent px-3 py-2 text-xs text-muted-foreground">
        Every value below was copied from your parsed document — nothing is
        invented. Edit anything, then download the PDF.
      </p>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gen.header.map((h, i) => (
          <label key={h.label} className="block">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{h.label}</span>
            <input className={input} value={h.value} onChange={(e) => setHeader(i, e.target.value)} />
          </label>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gen.parties.map((p, i) => (
          <label key={p.label} className="block">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</span>
            <textarea
              rows={4}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
              value={p.value}
              onChange={(e) => setParty(i, e.target.value)}
            />
          </label>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lines</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-accent text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {LINE_COLS.map((c) => (
                  <th key={c.key} className={cn("px-2 py-2 text-left font-medium", c.wide && "min-w-[220px]")}>
                    {c.label}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {gen.lines.map((line, i) => (
                <tr key={i} className="border-t border-border">
                  {LINE_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <input
                        aria-label={`Line ${i + 1} ${c.label}`}
                        className="h-8 w-full rounded border border-transparent bg-transparent px-1.5 text-sm outline-none focus-visible:border-ring"
                        value={line[c.key]}
                        onChange={(e) => setLine(i, c.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-1 text-center">
                    <button
                      type="button"
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() => setGen((g) => ({ ...g, lines: g.lines.filter((_, li) => li !== i) }))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGen((g) => ({ ...g, lines: [...g.lines, { ...EMPTY_LINE }] }))}
        >
          <Plus className="size-4" aria-hidden /> Add line
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gen.totals.map((t, i) => (
          <label key={t.label} className="block">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</span>
            <input className={input} value={t.value} onChange={(e) => setTotal(i, e.target.value)} />
          </label>
        ))}
      </section>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Notes</span>
        <textarea
          rows={3}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
          value={gen.notes}
          onChange={(e) => setGen((g) => ({ ...g, notes: e.target.value }))}
        />
      </label>

      <Button
        size="lg"
        className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
        disabled={busy}
        onClick={() => void download()}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <FileDown className="size-5" aria-hidden />
        )}
        Download PDF
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Free plan PDFs carry a watermark — Pro removes it.
      </p>
    </div>
  );
}
