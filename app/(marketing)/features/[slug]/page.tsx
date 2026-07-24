import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FEATURES } from "@/content/features";
import { FEATURE_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, serviceLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;
export function generateStaticParams() { return FEATURES.map((feature) => ({ slug: feature.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) return {};
  const seo = FEATURE_SEO[slug];
  return { title: { absolute: seo?.title ?? feature.metaTitle }, description: seo?.description ?? feature.description, alternates: { canonical: `/features/${slug}` }, openGraph: { title: seo?.title ?? feature.metaTitle, description: seo?.description ?? feature.description, url: `/features/${slug}`, type: "website" } };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) notFound();
  const seo = FEATURE_SEO[slug];
  const headings = seo?.headings ?? ["What this helps you do", "How it works", "Frequently asked questions"];

  return <>
    <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: feature.name, path: `/features/${slug}` }]), serviceLd(feature.name, feature.description, `/features/${slug}`), howToLd(`How ${feature.name} works`, feature.workflow), faqLd(feature.faqs)]} />
    <section className="border-b border-border bg-[radial-gradient(circle_at_82%_10%,rgba(1,59,179,0.13),transparent_28rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><Link href="/features">Features</Link><ChevronRight className="size-3" aria-hidden /><span>{feature.name}</span></nav>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">{feature.eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-primary sm:text-5xl">{seo?.h1 ?? feature.name}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{seo?.intro ?? feature.description}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button render={<Link href="/app/scan" />} size="lg" className="bg-signal text-white hover:bg-signal/90">Try it with a document <ArrowRight aria-hidden /></Button><Button render={<Link href="/pricing" />} size="lg" variant="outline">See pricing</Button></div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
      <div>{feature.overview.map((paragraph) => <p key={paragraph.slice(0, 32)} className="mb-5 text-lg leading-8 text-muted-foreground">{paragraph}</p>)}</div>
      <aside className="rounded-3xl border border-border bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-primary">{headings[0]}</h2><ul className="mt-5 space-y-4">{feature.benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm font-medium"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Check className="size-3.5" aria-hidden /></span>{benefit}</li>)}</ul></aside>
    </section>
    <section className="border-y border-border bg-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><h2 className="text-3xl font-black text-primary">{headings[1]}</h2><ol className="mt-8 grid gap-5 md:grid-cols-3">{feature.workflow.map((step, index) => <li key={step} className="rounded-2xl bg-background p-5"><span className="text-sm font-black text-signal">0{index + 1}</span><p className="mt-3 font-semibold text-primary">{step}</p></li>)}</ol></div></section>
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20"><h2 className="text-3xl font-black text-primary">{headings[2]}</h2><div className="mt-7 divide-y divide-border">{feature.faqs.map((faq) => <details key={faq.q} className="group py-5"><summary className="cursor-pointer list-none font-bold text-primary">{faq.q}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.a}</p></details>)}</div></section>
  </>;
}
