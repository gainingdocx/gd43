import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileText, Info, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SAMPLE_SHIPMENT } from "@/content/sample-shipment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample Ocean Freight Discrepancy Report",
  description: "Review a fictional booking, shipping-instructions and draft Bill of Lading check with field-level source evidence, severity and resolution status.",
  alternates: { canonical: "/sample-discrepancy-report" },
};

const severity = {
  critical: { label: "Critical", icon: ShieldAlert, className: "border-destructive/40 bg-destructive/5 text-destructive" },
  warning: { label: "Warning", icon: AlertTriangle, className: "border-[var(--amber-ink)]/40 bg-[var(--amber-soft)] text-[var(--amber-ink)]" },
  information: { label: "Information", icon: Info, className: "border-primary/25 bg-primary/5 text-primary" },
};

export default function SampleDiscrepancyReportPage() {
  const critical = SAMPLE_SHIPMENT.findings.filter((item) => item.severity === "critical").length;
  const warnings = SAMPLE_SHIPMENT.findings.filter((item) => item.severity === "warning").length;

  return (
    <div className="bg-background">
      <section className="section-edge bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--amber)]">Fictional demonstration shipment</p>
          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">See every draft B/L conflict before submission.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">This sample shows the review output for a booking confirmation, shipping instructions and carrier draft. Names and values are fictional; the controls mirror the product workflow.</p>
            </div>
            <Button render={<a href="/sample-discrepancy-report.pdf" download />} size="lg" className="h-12 bg-[var(--amber)] text-[var(--brand-deep)] hover:bg-[var(--amber)]">
              <Download aria-hidden /> Download sample PDF
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-16">
        <section className="grid gap-4 rounded-3xl border border-amber/45 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_repeat(3,.6fr)]">
          <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shipment</p><h2 className="mt-1 text-2xl font-extrabold text-brand-deep">{SAMPLE_SHIPMENT.reference}</h2><p className="mt-1 text-sm text-muted-foreground">{SAMPLE_SHIPMENT.route}</p></div>
          <div className="rounded-2xl bg-background p-4"><p className="text-xs text-muted-foreground">Decision</p><p className="mt-1 font-extrabold text-destructive">{SAMPLE_SHIPMENT.status}</p></div>
          <div className="rounded-2xl bg-background p-4"><p className="text-xs text-muted-foreground">Critical</p><p className="mt-1 text-2xl font-extrabold text-destructive">{critical}</p></div>
          <div className="rounded-2xl bg-background p-4"><p className="text-xs text-muted-foreground">Warnings</p><p className="mt-1 text-2xl font-extrabold text-[var(--amber-ink)]">{warnings}</p></div>
        </section>

        <section>
          <div className="flex items-center gap-3"><FileText className="size-6 text-signal" aria-hidden /><div><h2 className="text-2xl font-extrabold text-brand-deep">Connected source documents</h2><p className="text-sm text-muted-foreground">Every finding links back to the document, page and extracted source text.</p></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">{SAMPLE_SHIPMENT.documents.map((document) => <article key={document.id} className="rounded-2xl border border-amber/45 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><FileText className="size-5" aria-hidden /></span><span className="rounded-full bg-[var(--positive-soft)] px-2.5 py-1 text-xs font-bold text-[var(--positive)]">{document.state}</span></div><h3 className="mt-4 font-extrabold text-brand-deep">{document.name}</h3><p className="mt-1 text-xs text-muted-foreground">{document.file} - page {document.page}</p></article>)}</div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-brand-deep">Field-level findings</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Severity indicates operational priority, not legal effect. A reviewer confirms the source and records the resolution before export approval.</p>
          <div className="mt-5 space-y-4">{SAMPLE_SHIPMENT.findings.map((finding) => {
            const config = severity[finding.severity];
            const Icon = config.icon;
            return <article key={finding.id} className="overflow-hidden rounded-3xl border border-amber/45 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5"><div className="flex items-start gap-3"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", config.className)}><Icon className="size-5" aria-hidden /></span><div><span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{config.label}</span><h3 className="mt-1 text-lg font-extrabold text-brand-deep">{finding.field}</h3></div></div><span className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">{finding.resolution}</span></div>
              <div className="grid gap-5 p-5 lg:grid-cols-[.8fr_1.2fr]">
                <div className="space-y-3"><div className="rounded-xl border border-border bg-background p-3"><p className="text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">Expected</p><p className="mt-1 font-bold text-primary">{finding.expected}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground">Observed</p><p className="mt-1 font-bold text-foreground">{finding.observed}</p></div><p className="text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Why flagged:</strong> {finding.reason}</p><p className="text-xs text-muted-foreground">Assigned to: {finding.owner}</p></div>
                <div><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Source evidence</p><div className="mt-2 grid gap-3">{finding.sources.map((source) => <blockquote key={`${source.document}-${source.page}`} className="rounded-2xl border-l-4 border-[var(--amber)] bg-[var(--surface-alt)] p-4"><p className="text-xs font-bold text-primary">{source.document} - page {source.page}</p><p className="mt-2 font-mono text-sm leading-6 text-foreground">“{source.quote}”</p></blockquote>)}</div></div>
              </div>
            </article>;
          })}</div>
        </section>

        <section className="rounded-3xl bg-primary p-6 text-white sm:p-8"><div className="flex items-start gap-3"><CheckCircle2 className="mt-1 size-6 shrink-0 text-[var(--amber)]" aria-hidden /><div><h2 className="text-2xl font-extrabold">What the live workflow adds</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">Uploaded files are classified, grouped into a shipment, normalized, checked and routed to reviewers. Corrections, comments, assignments, approvals and exports are preserved in the shipment activity trail.</p><Button render={<Link href="/app/scan" />} size="lg" className="mt-5 bg-white text-primary hover:bg-white/90">Check one shipment free <ArrowRight aria-hidden /></Button></div></div></section>

        <p className="text-xs leading-5 text-muted-foreground">Demonstration only. This report does not authenticate documents, establish title, approve dangerous goods, make customs determinations or replace carrier, legal, banking or qualified operational review.</p>
      </main>
    </div>
  );
}
