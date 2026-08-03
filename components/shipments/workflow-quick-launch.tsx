import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";

import { FLAGSHIP_WORKFLOWS, workflowLaunchHref } from "@/lib/workflows/flagship";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";

export function WorkflowQuickLaunch() {
  return (
    <section className="space-y-3" aria-labelledby="workflow-launch-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Start with an outcome</p>
          <h2 id="workflow-launch-heading" className="mt-1 text-lg font-bold text-primary">Flagship workflows</h2>
        </div>
        <Link href="/app/workflows" className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary underline">
          See all <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FLAGSHIP_WORKFLOWS.map((workflow) => (
          <Link
            key={workflow.key}
            href={workflowLaunchHref(workflow.key)}
            className="group flex min-h-32 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#ffeb00] text-xs font-black text-[#171717]">{workflow.number}</span>
              <span className="flex items-center gap-2"><FreightModeTag mode={workflow.mode} /><Workflow className="size-5 text-signal" aria-hidden /></span>
            </div>
            <p className="mt-3 text-sm font-bold text-primary">{workflow.name}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-signal">Start document set <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
