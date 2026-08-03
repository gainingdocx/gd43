import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, FileStack, ShieldCheck } from "lucide-react";

import { FLAGSHIP_WORKFLOWS, workflowLaunchHref } from "@/lib/workflows/flagship";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";

export default function WorkflowsPage() {
  const sections = [
    { mode: "air" as const, title: "Air freight workflows", copy: "Airports, AWBs, chargeable weight, MAWB–HAWB consolidation and air dangerous-goods document evidence." },
    { mode: "ocean" as const, title: "Ocean freight workflows", copy: "Bookings, shipping instructions, B/L drafts, container events, arrival notices and free-time evidence." },
    { mode: "multimodal" as const, title: "Shared shipment workflows", copy: "Commercial and freight-invoice checks that can begin from either an AWB or B/L." },
  ];
  return (
    <div data-wide className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Operational workflow launcher</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Choose Air, Ocean or Shared—then start the check</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Select a workflow, add its document set, and GainingDocx will classify, group, extract and compare the connected evidence. You can add missing documents later without starting over.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          [FileStack, "1. Add the set", "Upload separate files or one mixed PDF."],
          [ShieldCheck, "2. Run the check", "Review source-linked conflicts by severity."],
          [CheckCircle2, "3. Resolve and export", "Record decisions and download the audit result."],
        ].map(([Icon, title, text]) => {
          const StepIcon = Icon as typeof FileStack;
          return <li key={String(title)} className="rounded-2xl border border-border bg-card p-4"><StepIcon className="size-5 text-signal" aria-hidden /><p className="mt-3 text-sm font-bold text-primary">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(text)}</p></li>;
        })}
      </ol>

      <div className="space-y-10">
        {sections.map((section) => <section key={section.mode} aria-labelledby={`workflow-mode-${section.mode}`}><div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={section.mode} className="h-7 rounded-full px-3 text-[10px]" /><h2 id={`workflow-mode-${section.mode}`} className="text-2xl font-black text-primary">{section.title}</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{section.copy}</p><div className="mt-5 grid gap-5 lg:grid-cols-2">
        {FLAGSHIP_WORKFLOWS.filter((workflow) => workflow.mode === section.mode).map((workflow) => (
          <article key={workflow.key} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex items-start gap-4 p-5 sm:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ffeb00] text-sm font-black text-[#171717]">{workflow.number}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-primary">{workflow.name}</h2><FreightModeTag mode={workflow.mode} /></div>
                <p className="mt-1 text-sm font-semibold text-foreground">{workflow.sequence}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{workflow.outcome}</p>
              </div>
            </div>
            <div className="border-y border-border bg-background px-5 py-4 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Documents to add</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {workflow.roles.filter((role) => !role.derived).map((role) => (
                  <li key={role.key} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />{role.label}</li>
                ))}
              </ul>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 p-5 sm:p-6">
              <Link href={workflowLaunchHref(workflow.key)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-signal px-4 text-sm font-bold text-white hover:bg-signal/90">
                Start {workflow.name} <ArrowRight className="size-4" aria-hidden />
              </Link>
              {workflow.key === "arrival_free_time_control" && <Link href="/tools/demurrage-detention-calculator" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-primary hover:bg-muted"><Calculator className="size-4" aria-hidden /> Calculator</Link>}
            </div>
          </article>
        ))}</div></section>)}
      </div>
    </div>
  );
}
