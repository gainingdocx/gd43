import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  GitCompareArrows,
  Mail,
  Plane,
  ShieldAlert,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { JsonLd, breadcrumbLd } from "@/lib/seo/jsonld";
import { FLAGSHIP_WORKFLOWS, workflowLaunchHref } from "@/lib/workflows/flagship";

export const metadata: Metadata = {
  title: "Air Freight Document Automation",
  description: "Forward or upload AWBs, SLI, invoices, packing lists, manifests and dangerous-goods declarations, then review connected air-cargo discrepancies.",
  alternates: { canonical: "/air-freight" },
};

const airWorkflows = FLAGSHIP_WORKFLOWS.filter((workflow) => workflow.mode === "air");

const workflowSteps = [
  { title: "Export readiness", chain: "SLI → AWB → invoice → packing list", copy: "Compare parties, airports, pieces, gross weight, chargeable weight and handling data before tender." },
  { title: "Consolidation", chain: "MAWB → HAWBs → manifest", copy: "Check parent references, route consistency and consolidated piece and weight totals." },
  { title: "Invoice audit", chain: "Rate → AWB → freight invoice", copy: "Compare the quoted lane and rate basis with AWB chargeable weight and billed charges." },
  { title: "Dangerous goods", chain: "DGD → AWB → SLI", copy: "Surface missing or conflicting declaration data for review by a qualified dangerous-goods professional." },
];

export default function AirFreightPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Air freight", path: "/air-freight" }])} />

      <section className="relative overflow-hidden bg-brand-deep">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ backgroundImage: "radial-gradient(ellipse 70% 60% at 8% 0%, rgba(47,109,240,0.42), transparent 62%), radial-gradient(ellipse 55% 55% at 96% 12%, rgba(255,199,0,0.16), transparent 60%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <div className="flex flex-wrap items-center gap-2"><FreightModeTag mode="air" /><span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Air freight paperwork workspace</span></div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.4rem]">Air cargo paperwork from inbox to checked shipment.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">Forward shipment attachments to your private GainingDocx address or upload them manually. Connect AWB, SLI, invoice, packing-list, manifest and dangerous-goods evidence in guided workflows built for exporters and freight forwarders.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/app/air-freight" />} size="lg" className="h-12 bg-amber px-6 font-semibold text-brand-deep hover:bg-amber/90">Open air freight workspace <ArrowRight aria-hidden /></Button>
              <Button render={<Link href="/app/email-in" />} size="lg" variant="outline" className="h-12 border-white/25 bg-white/5 px-6 font-semibold text-white hover:bg-white/15 hover:text-white"><Mail aria-hidden /> Get email-in address</Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/55">Decision-support only. GainingDocx does not issue an official e-AWB, book airline capacity, screen cargo or certify regulatory compliance.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber/45 bg-card shadow-panel">
            <div className="flex items-center justify-between bg-brand-deep px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-white/10"><Plane className="size-5" aria-hidden /></span><div><p className="text-[0.68rem] uppercase tracking-[0.12em] text-white/60">Air export set</p><p className="font-semibold">MAWB 176-12345675</p></div></div><FreightModeTag mode="air" /></div>
            <div className="space-y-2.5 p-5 sm:p-6">
              {["SLI and AWB parties agree", "Origin and destination airports agree", "Packing-list gross weight differs", "Chargeable weight basis needs review"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt p-3"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index < 2 ? "bg-positive-soft text-positive" : "bg-amber-soft text-amber-ink"}`}>{index < 2 ? "✓" : "!"}</span><p className="text-sm font-medium text-foreground">{item}</p></div>)}
              <div className="flex items-start gap-3 rounded-xl bg-secondary p-4"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-ink" aria-hidden /><p className="text-sm leading-6 text-secondary-foreground"><strong className="font-semibold">Source-linked review:</strong> open the original page and printed evidence behind each extracted value.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-edge bg-primary text-white" aria-label="Air freight document intake options">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6">
          <div className="flex items-start gap-3"><Mail className="mt-1 size-6 shrink-0 text-amber" aria-hidden /><div><p className="font-extrabold">Forward by email</p><p className="mt-1 text-sm leading-6 text-white/70">Best for live operations inboxes and recurring attachment traffic.</p></div></div>
          <span className="hidden text-sm font-extrabold text-white/40 sm:block">OR</span>
          <div className="flex items-start gap-3"><Upload className="mt-1 size-6 shrink-0 text-amber" aria-hidden /><div><p className="font-extrabold">Upload manually</p><p className="mt-1 text-sm leading-6 text-white/70">Best for one-off files, phone images or controlled review batches.</p></div></div>
        </div>
      </section>

      <section className="section-edge bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">One guided operating flow</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">Start with the job, not a document-type maze.</h2><p className="mt-4 leading-7 text-muted-foreground">Choose the outcome you need. The workspace tells you which documents are present, what is missing, what is still processing and which conflicts need a person to review.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {workflowSteps.map((step, index) => <article key={step.title} className="rounded-2xl border border-amber/45 bg-background p-5"><div className="flex items-center justify-between gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">0{index + 1}</span><FreightModeTag mode="air" /></div><h3 className="mt-4 text-lg font-extrabold text-brand-deep">{step.title}</h3><p className="mt-1 text-sm font-bold text-foreground">{step.chain}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section-edge bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">For exporters and forwarders</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">The right level of guidance for the person doing the work.</h2></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-amber/45 bg-white p-6"><h3 className="text-xl font-extrabold text-brand-deep">Exporter view</h3><p className="mt-3 leading-7 text-muted-foreground">Plain-language document checklists explain what to request, who normally prepares it and when it becomes conditional. Start with SLI, invoice and packing list; add DGD or other evidence only when the shipment requires it.</p><Link href="/tools/air-cargo-document-checklist" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-primary">Build my checklist <ArrowRight className="size-4" aria-hidden /></Link></article>
            <article className="rounded-3xl border border-amber/45 bg-white p-6"><h3 className="text-xl font-extrabold text-brand-deep">Forwarder view</h3><p className="mt-3 leading-7 text-muted-foreground">Use MAWB–HAWB reconciliation, chargeable-weight evidence, rate-to-invoice checks, source-linked findings and email-in intake to reduce repetitive re-keying and exception hunting.</p><Link href="/app/air-freight" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-primary">Open operations workspace <ArrowRight className="size-4" aria-hidden /></Link></article>
          </div>
        </div>
      </section>

      <section className="section-edge bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Launch a connected check</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">Four air workflows, ready from email or upload.</h2></div><Link href="/app/workflows" className="inline-flex min-h-11 items-center gap-1 font-bold text-primary">All workflows <ArrowRight className="size-4" aria-hidden /></Link></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {airWorkflows.map((workflow) => <article key={workflow.key} className="flex flex-col rounded-2xl border border-amber/45 bg-background p-5"><div className="flex items-center justify-between gap-3"><FreightModeTag mode="air" /><span className="text-xs font-extrabold text-muted-foreground">WORKFLOW 0{workflow.number}</span></div><h3 className="mt-4 text-lg font-extrabold text-brand-deep">{workflow.name}</h3><p className="mt-2 text-sm font-bold text-foreground">{workflow.sequence}</p><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{workflow.outcome}</p><Link href={workflowLaunchHref(workflow.key)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white">Start workflow <ArrowRight className="size-4" aria-hidden /></Link></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Calculator, "Chargeable weight", "Calculate volumetric and chargeable weight with the divisor shown.", "/tools/chargeable-weight-calculator"],
            [FileSearch, "AWB number check", "Check printed master AWB format and modulus-7 check digits in bulk.", "/tools/air-waybill-number-check"],
            [GitCompareArrows, "MAWB–HAWB check", "Reconcile route, parent references, pieces and weights.", workflowLaunchHref("air_consolidation_check")],
            [ShieldAlert, "DG document check", "Surface declaration gaps for qualified human review.", workflowLaunchHref("dangerous_goods_document_check")],
          ].map(([Icon, title, copy, href]) => { const ToolIcon = Icon as typeof Calculator; return <Link key={String(title)} href={String(href)} className="group rounded-2xl border border-amber/45 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-center justify-between"><ToolIcon className="size-6 text-signal" aria-hidden /><FreightModeTag mode="air" /></div><h2 className="mt-4 font-extrabold text-brand-deep">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(copy)}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Open <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>; })}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary p-5"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><p className="text-sm leading-6 text-muted-foreground"><strong className="text-primary">Clear boundary:</strong> results help teams find paperwork discrepancies and prepare for review. Carrier instructions, current tariffs, security programs and dangerous-goods regulations remain authoritative.</p></div>
      </section>
    </>
  );
}
