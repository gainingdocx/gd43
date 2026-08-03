import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, FilePlus2 } from "lucide-react";
import { assessFlagshipWorkflows, workflowLaunchHref, type WorkflowDocument } from "@/lib/workflows/flagship";
import { cn } from "@/lib/utils";

export function FlagshipWorkflows({ documents, shipmentId }: { documents: WorkflowDocument[]; shipmentId: string }) {
  const workflows = assessFlagshipWorkflows(documents);
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Four operational controls</p>
          <h2 className="mt-1 text-xl font-bold text-primary">Flagship workflow coverage</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Every attached document contributes to a defined evidence chain. A workflow becomes ready only when every required role has parsed evidence.</p>
        </div>
        <Link href="/app/workflows" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white">Choose workflow <FilePlus2 className="size-4" aria-hidden /></Link>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {workflows.map((workflow) => (
          <article key={workflow.key} className={cn("overflow-hidden rounded-2xl border", workflow.state === "ready" ? "border-success/35" : "border-border")}>
            <div className="flex items-start gap-3 bg-background p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffeb00] text-sm font-black text-[#171717]">{workflow.number}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-primary">{workflow.name}</h3><span className={cn("rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide", workflow.state === "ready" ? "bg-success/10 text-success" : workflow.state === "collecting" ? "bg-warn/10 text-warn" : "bg-muted text-muted-foreground")}>{workflow.state === "ready" ? "Ready to check" : workflow.state === "collecting" ? "Collecting evidence" : "Not started"}</span></div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{workflow.sequence}</p>
                <p className="mt-2 text-sm">{workflow.outcome}</p>
              </div>
            </div>
            <div className="h-1.5 bg-muted"><div className="h-full bg-signal" style={{ width: `${workflow.coverage}%` }} /></div>
            <ul className="divide-y divide-border">
              {workflow.roles.map((role) => {
                const documentId = role.documentIds[0];
                const body = <><span className="flex min-w-0 flex-1 items-center gap-2">{role.present ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> : role.processing ? <Clock3 className="size-4 shrink-0 text-warn" aria-hidden /> : <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-hidden />}<span className="truncate text-sm font-medium">{role.label}{role.derived ? " (extracted)" : ""}</span></span><span className="text-xs text-muted-foreground">{role.present ? "Open evidence" : role.processing ? "Processing" : "Add"}</span>{!role.present && !role.processing && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />}</>;
                return <li key={role.key}>{documentId ? <Link href={`/app/review/${documentId}`} className="flex items-center gap-2 px-4 py-3 hover:bg-accent">{body}</Link> : role.processing ? <div className="flex items-center gap-2 px-4 py-3">{body}</div> : <Link href={`/app/scan?type=${role.acceptedTypes[0]}&workflow=${workflow.key}&shipment=${shipmentId}`} className="flex items-center gap-2 px-4 py-3 hover:bg-accent">{body}</Link>}</li>;
              })}
            </ul>
            <div className="border-t border-border bg-background p-3">
              {workflow.state === "ready"
                ? <Link href="#run-connected-check" className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-signal px-3 text-sm font-bold text-white">Run this check <ArrowRight className="size-4" aria-hidden /></Link>
                : <Link href={workflowLaunchHref(workflow.key, shipmentId)} className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-primary">Add remaining documents <ArrowRight className="size-4" aria-hidden /></Link>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
