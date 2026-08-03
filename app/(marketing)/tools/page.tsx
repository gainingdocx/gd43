import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";

import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { TOOLS } from "@/content/tools";
import { toolMode } from "@/lib/freight/mode";
import { breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Free Air & Ocean Freight Calculators and Tools",
  description: "Use free air and ocean freight tools for AWB numbers, air paperwork, chargeable weight, CBM, containers, LCL charges, demurrage, port codes, HS codes and shipping marks.",
  alternates: { canonical: "/tools" },
};

export default function ToolsHub() {
  const sections = [
    { mode: "air" as const, title: "Air freight tools", copy: "Prepare AWBs, calculate chargeable weight and organize the correct air cargo document pack." },
    { mode: "ocean" as const, title: "Ocean freight tools", copy: "Check containers, ports, LCL charges, loading assumptions and free-time exposure." },
    { mode: "multimodal" as const, title: "Shared trade tools", copy: "Use these customs, packaging and commercial tools with either freight mode." },
  ];
  return <>
    <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-signal">No login required</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-primary">Choose the Right Freight Tool</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">Start with Air, Ocean or Shared. Mode-specific tools use the correct transport references and calculations; shared trade tools work with either mode.</p>
      <div className="mt-12 space-y-14">
        {sections.map((section) => {
          const tools = TOOLS.filter((tool) => toolMode(tool.slug) === section.mode);
          return <section key={section.mode}>
            <div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={section.mode} /><h2 className="text-2xl font-extrabold text-brand-deep">{section.title}</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">{section.copy}</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group flex min-h-56 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><Calculator className="size-8 text-signal" aria-hidden /><FreightModeTag mode={section.mode} /></div><h3 className="mt-4 text-xl font-bold text-primary">{tool.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{tool.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Open tool <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>)}</div>
          </section>;
        })}
      </div>
    </section>
  </>;
}
