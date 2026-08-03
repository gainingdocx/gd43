import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, FileOutput, FileSearch, Files, Mail, Search, ShieldCheck } from "lucide-react";

import { FEATURES } from "@/content/features";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { featureMode } from "@/lib/freight/mode";
import { breadcrumbLd, collectionPageLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Shipping Document Automation Software Features",
  description: "Explore air and ocean freight document ingestion, extraction, validation, matching, invoice audits, MAWB–HAWB reconciliation and structured exports.",
  alternates: { canonical: "/features" },
};

const icons = [FileSearch, ShieldCheck, Files, Search, FileOutput, Boxes, Mail];

export default function FeaturesPage() {
  const sections = [
    { mode: "air" as const, title: "Air freight controls", copy: "AWB, consolidation, chargeable-weight, invoice and dangerous-goods document workflows built around air-cargo evidence." },
    { mode: "ocean" as const, title: "Ocean freight controls", copy: "B/L, container, port, free-time and maritime validation built around ocean shipment evidence." },
    { mode: "multimodal" as const, title: "Shared document controls", copy: "Inbox intake, extraction, matching, search and export capabilities used with either freight mode." },
  ];
  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]), collectionPageLd("Shipping document automation features", "/features", FEATURES.map((feature) => ({ name: feature.name, path: `/features/${feature.slug}` })))]} />
      <section className="section-edge bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Complete workflow</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">Air, Ocean and Shared Controls—Clearly Separated</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Open the transport mode you are working on first. Shared capabilities appear separately because they support both modes without changing the transport-specific rules.</p>
          <div className="mt-12 space-y-14">
            {sections.map((section) => {
              const features = FEATURES.filter((feature) => featureMode(feature.slug) === section.mode);
              return <section key={section.mode} aria-labelledby={`features-${section.mode}`}><div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={section.mode} className="h-7 rounded-full px-3 text-[10px]" /><h2 id={`features-${section.mode}`} className="text-2xl font-extrabold text-brand-deep">{section.title}</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{section.copy}</p><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map((feature) => { const index = FEATURES.findIndex((item) => item.slug === feature.slug); const Icon = icons[index] ?? Mail; return <Link key={feature.slug} href={`/features/${feature.slug}`} className="group flex min-h-72 flex-col rounded-3xl border border-amber/45 bg-background p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-xl"><div className="flex items-start justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white"><Icon className="size-6" aria-hidden /></span><FreightModeTag mode={section.mode} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-signal">{feature.eyebrow}</p><h3 className="mt-2 text-xl font-extrabold text-brand-deep">{feature.name}</h3><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{feature.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Explore feature <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>; })}</div></section>;
            })}
          </div>
        </div>
      </section>
    </>
  );
}
