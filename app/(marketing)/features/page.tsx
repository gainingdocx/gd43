import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, FileOutput, FileSearch, Files, Search, ShieldCheck } from "lucide-react";

import { FEATURES } from "@/content/features";
import { breadcrumbLd, collectionPageLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Shipping Document Automation Software Features",
  description: "Explore AI data extraction, maritime validation, shipment matching, private search, structured exports and document generation.",
  alternates: { canonical: "/features" },
};

const icons = [FileSearch, ShieldCheck, Files, Search, FileOutput, Boxes];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]), collectionPageLd("Shipping document automation features", "/features", FEATURES.map((feature) => ({ name: feature.name, path: `/features/${feature.slug}` })))]} />
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Complete workflow</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-primary sm:text-5xl">Shipping Document Automation from OCR to Export</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Extract, validate, match, search, export and reuse logistics document data in one reviewed workflow.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = icons[index];
              return <Link key={feature.slug} href={`/features/${feature.slug}`} className="group flex min-h-72 flex-col rounded-3xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-xl"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white"><Icon className="size-6" aria-hidden /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-signal">{feature.eyebrow}</p><h2 className="mt-2 text-xl font-black text-primary">{feature.name}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{feature.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Explore feature <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>;
            })}
          </div>
        </div>
      </section>
    </>
  );
}
