import Link from "next/link";
import {
  ArrowRight, Calculator, CheckCircle2, CircleDashed, FileCheck2, FileStack,
  MailPlus, Plane, Scale, ShieldAlert, Upload,
} from "lucide-react";

import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { Button } from "@/components/ui/button";
import { emailInAddress } from "@/lib/email-ingestion/address";
import { createClient } from "@/lib/supabase/server";
import { assessFlagshipWorkflows, FLAGSHIP_WORKFLOWS, workflowLaunchHref } from "@/lib/workflows/flagship";

export default async function AirFreightWorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: documents }, { data: profile }] = user ? await Promise.all([
    supabase.from("documents").select("id, doc_type, status, fields").order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("email_ingest_token, email_ingest_enabled").eq("id", user.id).maybeSingle(),
  ]) : [{ data: [] }, { data: null }];
  const progress = new Map(assessFlagshipWorkflows((documents ?? []).map((document) => ({
    id: document.id, doc_type: document.doc_type, status: document.status, fields: document.fields as Record<string, unknown> | null,
  }))).map((workflow) => [workflow.key, workflow]));
  const workflows = FLAGSHIP_WORKFLOWS.filter((workflow) => workflow.mode === "air");

  return <div data-wide className="space-y-8">
    <section className="overflow-hidden rounded-3xl border border-sky-200 bg-[radial-gradient(circle_at_92%_8%,rgba(1,59,179,0.18),transparent_22rem),linear-gradient(135deg,#f7fbff,#eef5ff)] p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2"><FreightModeTag mode="air" /><span className="text-xs font-black uppercase tracking-[0.14em] text-signal">Guided air operations</span></div>
      <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-center">
        <div><h1 className="max-w-3xl text-3xl font-black tracking-tight text-primary sm:text-4xl">Finish air freight paperwork without guessing what comes next.</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Choose the outcome you need. GainingDocx tells you which documents to collect, accepts them by email or upload, extracts the air-cargo data and shows the conflicts that need review.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button render={<Link href="/app/email-in" />} className="bg-signal text-white hover:bg-signal/90"><MailPlus aria-hidden /> Forward documents by email</Button><Button render={<Link href="/app/scan?type=batch" />} variant="outline" className="bg-white"><Upload aria-hidden /> Upload an air document set</Button></div></div>
        <div className="rounded-2xl bg-primary p-5 text-white"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary"><Plane className="size-5" aria-hidden /></span><div><p className="text-xs text-white/65">Your intake route</p><p className="font-black">Email or manual upload</p></div></div>{profile?.email_ingest_token ? <><p className="mt-4 text-xs text-white/65">Forward attachments to</p><code className="mt-1 block break-all rounded-lg bg-white/10 p-2 text-sm font-bold">{emailInAddress(profile.email_ingest_token)}</code>{!profile.email_ingest_enabled && <p className="mt-2 text-xs font-bold text-[#f4c400]">Email intake is paused. Open Email-in to enable it.</p>}</> : <p className="mt-4 text-sm leading-6 text-white/75">Sign in to receive your private forwarding address. Manual upload remains available.</p>}</div>
      </div>
    </section>

    <section aria-labelledby="air-outcomes">
      <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Start with the job to be done</p><h2 id="air-outcomes" className="mt-2 text-2xl font-black text-primary">Which air-freight task are you completing?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You do not need to select every document type individually. Start a workflow and add the requested set.</p></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{workflows.map((workflow) => {
        const state = progress.get(workflow.key);
        return <article key={workflow.key} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white"><Plane className="size-5" aria-hidden /></span><div className="flex items-center gap-2"><FreightModeTag mode="air" /><span className={state?.state === "ready" ? "rounded-full bg-success/10 px-2 py-1 text-[10px] font-black uppercase text-success" : state?.state === "collecting" ? "rounded-full bg-warning/15 px-2 py-1 text-[10px] font-black uppercase text-[#765600]" : "rounded-full bg-muted px-2 py-1 text-[10px] font-black uppercase text-muted-foreground"}>{state?.state === "ready" ? "Ready" : state?.state === "collecting" ? `${state.completeRoles}/${state.totalRoles} added` : "Start"}</span></div></div><h3 className="mt-4 text-xl font-black text-primary">{workflow.name}</h3><p className="mt-2 text-sm font-semibold">{workflow.sequence}</p><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{workflow.outcome}</p><ul className="mt-4 grid gap-2 sm:grid-cols-2">{workflow.roles.map((role) => { const done = state?.roles.find((item) => item.key === role.key)?.present; return <li key={role.key} className="flex items-start gap-2 text-xs leading-5">{done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}{role.label}</li>; })}</ul><Link href={workflowLaunchHref(workflow.key)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90">{state?.state === "collecting" ? "Continue this workflow" : "Start this workflow"}<ArrowRight className="size-4" aria-hidden /></Link></article>;
      })}</div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
      <div className="rounded-3xl border border-border bg-card p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-signal">For exporters</p><h2 className="mt-2 text-xl font-black text-primary">A simple general-cargo starting pack</h2><ol className="mt-5 space-y-4">{[["1", "Commercial invoice", "What is sold, its value, origin and parties."], ["2", "Packing list", "Pieces, dimensions and physical weights."], ["3", "Air SLI", "Your route and handling instructions to the forwarder."], ["4", "Air Waybill", "The resulting air transport record to check." ]].map(([number, title, copy]) => <li key={number} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-primary">{number}</span><div><p className="text-sm font-bold text-primary">{title}</p><p className="text-xs leading-5 text-muted-foreground">{copy}</p></div></li>)}</ol><Button render={<Link href="/tools/air-cargo-document-checklist" />} variant="outline" className="mt-5 w-full"><FileCheck2 aria-hidden /> Build my exact checklist</Button></div>
      <div className="rounded-3xl border border-border bg-primary p-5 text-white"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#f4c400]">Working air tools</p><h2 className="mt-2 text-xl font-black">Check the numbers before they reach an airline or invoice.</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{[[Calculator, "Chargeable weight", "Calculate actual versus volumetric weight.", "/tools/chargeable-weight-calculator"], [FileStack, "MAWB number", "Check airline prefix, serial and final digit.", "/tools/air-waybill-number-check"], [Scale, "Invoice audit", "Compare quotation, AWB and billed weight.", workflowLaunchHref("air_freight_invoice_audit")]].map(([Icon, title, copy, href]) => { const ToolIcon = Icon as typeof Calculator; return <Link key={String(title)} href={String(href)} className="rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"><ToolIcon className="size-5" aria-hidden /><p className="mt-3 text-sm font-black">{String(title)}</p><p className="mt-1 text-xs leading-5 text-white/65">{String(copy)}</p></Link>; })}</div></div>
    </section>

    <section className="flex gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm leading-6"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden /><p><strong>Human review remains required.</strong> GainingDocx checks extracted evidence and document consistency. It does not issue an AWB, book airline capacity, authenticate a security status or replace current customs and dangerous-goods requirements.</p></section>
  </div>;
}
