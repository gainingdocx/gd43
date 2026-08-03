import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  FileCheck2,
  FileClock,
  FileText,
  Inbox,
  MailPlus,
  Plane,
  ScanLine,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Upload,
  WalletCards,
  Workflow,
} from "lucide-react";

import { AddressCopy } from "@/components/email-in/address-copy";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { Button } from "@/components/ui/button";
import { aggregateQuestionedAmounts, inferShipmentMode, percent } from "@/lib/dashboard/overview";
import { emailInAddress } from "@/lib/email-ingestion/address";
import { suggest, type NextActionDoc } from "@/lib/next-action";
import { getUsageContext } from "@/lib/billing/usage";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { assessFlagshipWorkflows, workflowLaunchHref } from "@/lib/workflows/flagship";

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
  shipping_instructions: "Shipping Instructions",
  certificate_of_origin: "Certificate of Origin",
  air_waybill: "Air Waybill",
  shipper_letter_of_instruction: "Shipper's Letter of Instruction",
  dangerous_goods_declaration: "Dangerous Goods Declaration",
  air_cargo_manifest: "Air Cargo Manifest",
  cargo_security_declaration: "Cargo Security Declaration",
  other: "Document",
};

const MINUTES_SAVED_PER_DOC = 12;

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function money(amount: number, currency: string) {
  if (currency === "UNSPECIFIED") return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

function documentReference(document: { fields: unknown; doc_type: string }) {
  const fields = document.fields as Record<string, unknown> | null;
  if (!fields) return TYPE_LABEL[document.doc_type] ?? "Document";
  const value = fields.awb_number ?? fields.master_awb_number ?? fields.bl_number ?? fields.invoice_no ?? fields.pl_no;
  return typeof value === "string" && value.trim() ? value : TYPE_LABEL[document.doc_type] ?? "Document";
}

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Workspace</h1>
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-input bg-card px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-signal"><ScanLine className="size-6" aria-hidden /></span>
          <div><p className="font-bold text-primary">Check a shipping document free</p><p className="mt-1 text-sm text-muted-foreground">Review, correct and export one complete document per day.</p></div>
          <Button render={<Link href="/app/scan" />} size="lg" className="bg-signal text-white">Scan a document</Button>
          <Link href="/app/account" className="text-sm font-semibold text-primary underline">Sign in to your operations dashboard</Link>
        </div>
      </div>
    );
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [shipmentsResult, documentsResult, discrepancyResult, checksResult, profileResult, ingestionResult] = await Promise.all([
    supabase.from("shipments").select("id, ref, bl_number, house_bl_number, bill_level, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(100),
    supabase.from("documents").select("id, doc_type, status, shipment_id, validation, fields, source_channel, source_filename, created_at, updated_at", { count: "exact" }).order("created_at", { ascending: false }).limit(250),
    supabase.from("discrepancies").select("id, severity, shipment_id, questioned_amount, questioned_currency, created_at").eq("resolved", false).order("created_at", { ascending: false }).limit(500),
    supabase.from("events").select("payload").eq("type", "check_run").limit(300),
    supabase.from("profiles").select("full_name, company, email_ingest_token, email_ingest_enabled").eq("id", user.id).maybeSingle(),
    supabase.from("email_ingestions").select("id, subject, status, processed_count, attachment_count, shipment_ids, created_at").order("created_at", { ascending: false }).limit(12),
  ]);

  const shipments = shipmentsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const discrepancies = discrepancyResult.data ?? [];
  const ingestions = ingestionResult.data ?? [];
  const profile = profileResult.data;
  const usage = await getUsageContext(user.id, monthStart);

  const processingCount = documents.filter((document) => document.status === "uploaded" || document.status === "parsing").length;
  const failedCount = documents.filter((document) => document.status === "failed").length;
  const redCount = discrepancies.filter((item) => item.severity === "red").length;
  const amberCount = discrepancies.length - redCount;
  const parsedCount = documents.filter((document) => document.status === "parsed").length;
  const savedMinutes = usage.used * MINUTES_SAVED_PER_DOC;
  const savedLabel = savedMinutes >= 60 ? `${Math.floor(savedMinutes / 60)}h ${savedMinutes % 60}m` : `${savedMinutes}m`;
  const financialExposure = aggregateQuestionedAmounts(discrepancies);
  const emailDocs = documents.filter((document) => document.source_channel === "email").length;
  const manualDocs = documents.filter((document) => document.source_channel !== "email").length;
  const parseRate = percent(parsedCount, parsedCount + failedCount);

  const checkedShipmentIds = [...new Set((checksResult.data ?? [])
    .map((event) => (event.payload as { shipment_id?: string } | null)?.shipment_id)
    .filter((value): value is string => typeof value === "string"))];
  const actionDocs: NextActionDoc[] = documents.map((document) => ({
    id: document.id,
    doc_type: document.doc_type,
    status: document.status,
    shipment_id: document.shipment_id,
    validation_fails: Array.isArray(document.validation)
      ? (document.validation as { status?: string }[]).filter((item) => item.status === "fail").length
      : 0,
  }));
  const actions = suggest({
    docs: actionDocs,
    openDiscrepancies: discrepancies.map((item) => ({ severity: item.severity as "red" | "amber", shipment_id: item.shipment_id })),
    checkedShipmentIds,
  });
  const [primaryAction, ...secondaryActions] = actions;

  const shipmentRows = shipments.map((shipment) => {
    const shipmentDocuments = documents.filter((document) => document.shipment_id === shipment.id);
    const open = discrepancies.filter((item) => item.shipment_id === shipment.id);
    const mode = inferShipmentMode(shipmentDocuments.map((document) => document.doc_type));
    const lastActivity = shipmentDocuments[0]?.updated_at ?? shipmentDocuments[0]?.created_at ?? shipment.created_at;
    return {
      ...shipment,
      documents: shipmentDocuments,
      open,
      mode,
      lastActivity,
      reference: shipment.bl_number ?? shipment.house_bl_number ?? shipment.ref ?? `#${shipment.id.slice(0, 8)}`,
    };
  }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  const workflowQueue = shipmentRows.flatMap((shipment) =>
    assessFlagshipWorkflows(shipment.documents).filter((workflow) => workflow.state !== "not_started").map((workflow) => ({ shipment, workflow }))
  ).sort((a, b) => {
    const stateRank = { ready: 2, collecting: 1, not_started: 0 };
    return stateRank[b.workflow.state] - stateRank[a.workflow.state] || b.workflow.coverage - a.workflow.coverage;
  }).slice(0, 4);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const privateAddress = profile?.email_ingest_token ? emailInAddress(profile.email_ingest_token) : null;
  const latestIngestion = ingestions[0];
  const operationalState = redCount > 0 ? "Decision needed" : failedCount > 0 ? "Review failed files" : processingCount > 0 ? "Documents processing" : "Workspace under control";

  return (
    <div data-wide className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Operations control tower</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-primary sm:text-4xl">{firstName ? `${firstName}, here is what needs attention.` : "Here is what needs attention."}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">One live view for air and ocean document work, exceptions, email intake and the next best action.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/app/search" />} variant="outline" className="bg-white"><Search className="size-4" aria-hidden /> Search</Button>
          <Button render={<Link href="/app/scan?type=batch" />} className="bg-signal text-white"><Upload className="size-4" aria-hidden /> Upload documents</Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl bg-primary text-white shadow-[0_28px_80px_-50px_rgba(1,59,179,.95)]" aria-labelledby="control-status-heading">
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold"><CircleGauge className="size-4 text-[#ffe500]" aria-hidden /> {operationalState}</span>
              <FreightModeTag mode="multimodal" className="h-7 rounded-full bg-[#d40505] px-3 text-[10px]" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-white/60">Intelligent priority</p>
            {primaryAction && <Link href={primaryAction.href} className="group mt-2 block max-w-3xl rounded-2xl bg-[#ffe500] p-5 text-[#171717] transition hover:-translate-y-0.5">
              <span className="flex items-start justify-between gap-4"><span><strong id="control-status-heading" className="text-xl font-black text-[#8b0909]">{primaryAction.label}</strong><span className="mt-2 block text-sm font-medium leading-6 text-black/65">{primaryAction.description}</span></span><ArrowUpRight className="size-6 shrink-0 text-[#d40505] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden /></span>
            </Link>}
            {secondaryActions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{secondaryActions.map((action) => <Link key={action.id} href={action.href} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold transition hover:bg-white/20">{action.label}<ChevronRight className="size-3.5" aria-hidden /></Link>)}</div>}
          </div>
          <div className="border-t-4 border-[#ffe500] bg-[#082d82] p-5 lg:border-l-4 lg:border-t-0 sm:p-7">
            <p className="flex items-center gap-2 text-sm font-black"><Sparkles className="size-4 text-[#ffe500]" aria-hidden /> Why this comes first</p>
            <p className="mt-2 text-xs leading-6 text-white/70">The dashboard ranks unresolved money or legal discrepancies first, then validation failures, failed extraction, ready checks and incomplete document sets.</p>
            <Link href="/app/shipments" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary">Open all shipments <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Workspace key performance indicators">
        {[
          [Ship, "Shipments", shipmentsResult.count ?? shipments.length, `${shipmentRows.filter((item) => item.open.length > 0).length} with open findings`, "bg-primary text-white"],
          [AlertTriangle, "Open exceptions", discrepancies.length, redCount ? `${redCount} critical · ${amberCount} warning` : `${amberCount} warning`, "bg-[#d40505] text-white"],
          [FileClock, "Processing now", processingCount, failedCount ? `${failedCount} failed file${failedCount === 1 ? "" : "s"}` : "No failed files", "bg-[#ffe500] text-[#171717]"],
          [Clock3, "Time saved this month", savedLabel, `${usage.used} of ${usage.limit} documents`, "bg-white text-primary"],
        ].map(([Icon, label, value, detail, style]) => {
          const MetricIcon = Icon as typeof Ship;
          return <article key={String(label)} className={cn("rounded-2xl border border-border p-4 sm:p-5", String(style))}><MetricIcon className="size-5 opacity-80" aria-hidden /><p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.14em] opacity-70">{String(label)}</p><p className="mt-1 text-2xl font-black tracking-tight">{String(value)}</p><p className="mt-1 text-xs font-semibold opacity-70">{String(detail)}</p></article>;
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="workflow-queue-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.15em] text-signal">Live work queue</p><h2 id="workflow-queue-heading" className="mt-1 text-xl font-black text-primary">Workflow readiness by shipment</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Ready checks rise above work still collecting evidence.</p></div>
            <Link href="/app/workflows" className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary underline">All workflows <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          {workflowQueue.length === 0 ? <div className="mt-5 rounded-2xl border-2 border-dashed border-border bg-background p-7 text-center"><Workflow className="mx-auto size-7 text-primary" aria-hidden /><p className="mt-3 font-bold text-primary">No workflow is in progress yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose an outcome and GainingDocx will show exactly which evidence is still needed.</p><Button render={<Link href="/app/workflows" />} className="mt-4 bg-primary text-white">Choose a workflow</Button></div> : <ul className="mt-5 space-y-3">{workflowQueue.map(({ shipment, workflow }) => <li key={`${shipment.id}-${workflow.key}`}><Link href={workflow.state === "ready" ? `/app/shipments/${shipment.id}` : workflowLaunchHref(workflow.key, shipment.id)} className="group block rounded-2xl border border-border bg-background p-4 transition hover:border-primary/35 hover:bg-secondary/30"><div className="flex items-start gap-3"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", workflow.state === "ready" ? "bg-primary text-white" : "bg-secondary text-primary")}>{workflow.state === "ready" ? <CheckCircle2 className="size-5" aria-hidden /> : <Workflow className="size-5" aria-hidden />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-primary">{workflow.name}</strong><FreightModeTag mode={workflow.mode} /></span><span className="mt-1 block text-xs text-muted-foreground">{shipment.reference} · {workflow.completeRoles}/{workflow.totalRoles} evidence roles ready</span><span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", workflow.state === "ready" ? "bg-primary" : "bg-signal")} style={{ width: `${workflow.coverage}%` }} /></span></span><span className="pt-1"><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden /></span></div></Link></li>)}</ul>}
        </article>

        <article className="overflow-hidden rounded-3xl border border-primary/20 bg-card" aria-labelledby="intake-heading">
          <div className="bg-[#ffe500] p-5 text-[#171717] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#d40505]">Fastest intake</p><h2 id="intake-heading" className="mt-1 text-xl font-black">Forward the shipment email</h2><p className="mt-2 text-sm leading-6 text-black/65">Attachments enter your workspace, get processed and return with a discrepancy result.</p></div><MailPlus className="size-7 shrink-0 text-[#d40505]" aria-hidden /></div></div>
          <div className="p-5 sm:p-6">
            {privateAddress ? <><div className={cn("mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold", profile?.email_ingest_enabled ? "bg-success/10 text-success" : "bg-warn/10 text-warn")}>{profile?.email_ingest_enabled ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}{profile?.email_ingest_enabled ? "Private intake active" : "Private intake paused"}</div><AddressCopy address={privateAddress} /></> : <p className="rounded-xl bg-warn/10 p-4 text-sm text-warn">Your private email address needs the latest account setup.</p>}
            <div className="mt-2 border-t border-border pt-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Prefer manual upload?</p>
              <Link href="/app/scan?type=batch" className="mt-2 flex min-h-12 items-center justify-between rounded-xl bg-primary px-4 text-sm font-bold text-white"><span className="flex items-center gap-2"><Upload className="size-4" aria-hidden /> Upload a complete document set</span><ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <article className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="recent-shipments-heading">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-signal">Single source of truth</p><h2 id="recent-shipments-heading" className="mt-1 text-xl font-black text-primary">Recent shipments</h2></div><Link href="/app/shipments" className="text-sm font-bold text-primary underline">View all</Link></div>
          {shipmentRows.length === 0 ? <div className="mt-5 rounded-2xl border-2 border-dashed border-border bg-background p-8 text-center"><Ship className="mx-auto size-7 text-primary" aria-hidden /><p className="mt-3 font-bold text-primary">Your first shipment starts with evidence</p><p className="mt-1 text-xs text-muted-foreground">Upload or email the AWB, B/L, invoice or packing list you already have.</p></div> : <div className="mt-5 overflow-hidden rounded-2xl border border-border"><div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_6rem] bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 sm:grid"><span>Shipment</span><span>Evidence</span><span>Health</span><span>Activity</span></div><ul className="divide-y divide-border">{shipmentRows.slice(0, 6).map((shipment) => <li key={shipment.id}><Link href={`/app/shipments/${shipment.id}`} className="grid gap-3 bg-white px-4 py-3.5 transition hover:bg-secondary/25 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_6rem] sm:items-center"><span className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-sm text-primary">{shipment.reference}</strong><FreightModeTag mode={shipment.mode} /></span><span className="mt-1 block truncate text-xs text-muted-foreground">{shipment.bill_level === "house" ? "House shipment" : shipment.bill_level === "master" ? "Master shipment" : "Shipment record"}</span></span><span className="text-xs font-semibold"><FileText className="mr-1 inline size-3.5 text-primary" aria-hidden />{shipment.documents.length} document{shipment.documents.length === 1 ? "" : "s"}</span><span>{shipment.open.length ? <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">{shipment.open.length} open</span> : <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">Clear</span>}</span><span className="flex items-center justify-between text-xs text-muted-foreground">{compactDate(shipment.lastActivity)}<ChevronRight className="size-4" aria-hidden /></span></Link></li>)}</ul></div>}
        </article>

        <div className="space-y-5">
          <article className="rounded-3xl border border-border bg-card p-5" aria-labelledby="financial-heading">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-signal"><WalletCards className="size-5" aria-hidden /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Money control</p><h2 id="financial-heading" className="font-black text-primary">Questioned exposure</h2></div></div>
            {financialExposure.length ? <ul className="mt-4 space-y-2">{financialExposure.slice(0, 3).map((item) => <li key={item.currency} className="flex items-center justify-between rounded-xl bg-background px-3 py-2"><span className="text-xs font-bold text-muted-foreground">{item.currency}</span><strong className="text-sm text-signal">{money(item.amount, item.currency)}</strong></li>)}</ul> : <div className="mt-4 rounded-xl bg-success/10 p-4"><p className="flex items-center gap-2 text-sm font-bold text-success"><ShieldCheck className="size-4" aria-hidden /> No questioned charges open</p><p className="mt-1 text-xs text-muted-foreground">Freight-audit discrepancies with amounts will appear here by currency.</p></div>}
            <Link href="/app/workflows" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary underline">Start an invoice audit <ArrowRight className="size-3.5" aria-hidden /></Link>
          </article>

          <article className="rounded-3xl border border-border bg-card p-5" aria-labelledby="pulse-heading">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-signal">Automation pulse</p><h2 id="pulse-heading" className="mt-1 font-black text-primary">How work is entering</h2>
            <div className="mt-4 space-y-3"><div><div className="flex justify-between text-xs font-semibold"><span>Email-in</span><span>{emailDocs}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${percent(emailDocs, emailDocs + manualDocs)}%` }} /></div></div><div><div className="flex justify-between text-xs font-semibold"><span>Manual upload</span><span>{manualDocs}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-signal" style={{ width: `${percent(manualDocs, emailDocs + manualDocs)}%` }} /></div></div></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-background p-3"><p className="text-[10px] font-bold uppercase text-muted-foreground">Parse success</p><p className="mt-1 text-lg font-black text-primary">{parseRate}%</p></div><div className="rounded-xl bg-background p-3"><p className="text-[10px] font-bold uppercase text-muted-foreground">Latest email</p><p className="mt-1 truncate text-sm font-black capitalize text-primary">{latestIngestion?.status ?? "None yet"}</p></div></div>
            <Link href="/app/email-in" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary underline">Open email tracker <ArrowRight className="size-3.5" aria-hidden /></Link>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="outcomes-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-signal">Outcome launcher</p><h2 id="outcomes-heading" className="mt-1 text-xl font-black text-primary">Start with the operational result you need</h2></div><Link href="/app/workflows" className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary underline">See all 8 workflows <ArrowRight className="size-4" aria-hidden /></Link></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Ship, "Ocean export check", "Catch draft B/L conflicts before approval.", "export_document_check", "ocean"],
            [Plane, "Air export readiness", "Check SLI, AWB, invoice and packing evidence.", "air_export_readiness", "air"],
            [WalletCards, "Freight invoice audit", "Surface duplicate and unsupported charges.", "freight_invoice_audit", "multimodal"],
            [FileCheck2, "Shipment document check", "Reconcile transport and commercial evidence.", "shipment_document_check", "multimodal"],
          ].map(([Icon, title, copy, key, mode]) => {
            const OutcomeIcon = Icon as typeof Ship;
            return <Link key={String(key)} href={workflowLaunchHref(key as Parameters<typeof workflowLaunchHref>[0])} className="group rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/25"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><OutcomeIcon className="size-5" aria-hidden /></span><FreightModeTag mode={mode as "air" | "ocean" | "multimodal"} /></div><p className="mt-4 text-sm font-black text-primary">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(copy)}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-signal">Start workflow <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden /></span></Link>;
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="recent-documents-heading">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-signal">Evidence stream</p><h2 id="recent-documents-heading" className="mt-1 text-xl font-black text-primary">Recent documents</h2></div><span className="text-xs font-semibold text-muted-foreground">{documentsResult.count ?? documents.length} total</span></div>
        {documents.length === 0 ? <div className="mt-5 rounded-2xl border-2 border-dashed border-border bg-background p-7 text-center"><Inbox className="mx-auto size-7 text-primary" aria-hidden /><p className="mt-3 text-sm font-bold text-primary">No documents yet</p><p className="mt-1 text-xs text-muted-foreground">Email or upload the documents already in your workflow.</p></div> : <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{documents.slice(0, 6).map((document) => { const validationFails = Array.isArray(document.validation) ? (document.validation as { status?: string }[]).filter((item) => item.status === "fail").length : 0; return <li key={document.id}><Link href={`/app/review/${document.id}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary/30 hover:bg-secondary/25"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary">{document.status === "parsed" ? <FileCheck2 className="size-5" aria-hidden /> : <FileClock className="size-5" aria-hidden />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-primary">{documentReference(document)}</strong><span className="mt-0.5 block truncate text-xs text-muted-foreground">{TYPE_LABEL[document.doc_type] ?? "Document"} · <span className="capitalize">{document.status}</span></span></span>{validationFails > 0 && <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">{validationFails}</span>}<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /></Link></li>; })}</ul>}
      </section>
    </div>
  );
}
