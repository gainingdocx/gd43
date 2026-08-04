import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight } from "lucide-react";

import { DeepContentBody, QuickAnswerCard } from "@/components/marketing/deep-content";
import { Button } from "@/components/ui/button";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { FEATURE_DEEP } from "@/content/deep/features";
import { FEATURES } from "@/content/features";
import { FEATURE_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, serviceLd, techArticleLd } from "@/lib/seo/jsonld";
import { featureMode } from "@/lib/freight/mode";

export const dynamicParams = true;
export function generateStaticParams() { return FEATURES.map((feature) => ({ slug: feature.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) return {};
  const seo = FEATURE_SEO[slug];
  const deep = FEATURE_DEEP[slug];
  const title = seo?.title ?? feature.metaTitle;
  const description = seo?.description ?? feature.description;
  return {
    title: { absolute: title },
    description,
    keywords: deep?.keywords,
    alternates: { canonical: `/features/${slug}` },
    openGraph: { title, description, url: `/features/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = FEATURES.find((item) => item.slug === slug);
  if (!feature) notFound();
  const seo = FEATURE_SEO[slug];
  const deep = FEATURE_DEEP[slug];
  const headings = seo?.headings ?? ["What this helps you do", "How it works", "Frequently asked questions"];
  const startHref = feature.slug === "email-in-document-ingestion" ? "/app/email-in" : "/app/scan";
  const startLabel = feature.slug === "email-in-document-ingestion" ? "See my private intake address" : "Try it with a document";
  const faqs = deep ? [...deep.faqs, ...feature.faqs.filter((f) => !deep.faqs.some((d) => d.q === f.q))] : feature.faqs;

  return <>
    <JsonLd data={[
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: feature.name, path: `/features/${slug}` }]),
      serviceLd(feature.name, feature.description, `/features/${slug}`),
      howToLd(`How ${feature.name} works`, feature.workflow),
      faqLd(faqs),
      ...(deep ? [techArticleLd({ headline: seo?.h1 ?? feature.name, description: seo?.description ?? feature.description, path: `/features/${slug}`, dateModified: deep.updated, keywords: deep.keywords, sections: deep.sections.map((section) => section.heading) })] : []),
    ]} />
    <section className="section-edge bg-[radial-gradient(circle_at_82%_10%,rgba(1,59,179,0.13),transparent_28rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><Link href="/features">Features</Link><ChevronRight className="size-3" aria-hidden /><span>{feature.name}</span></nav>
        <div className="mt-8 flex items-center gap-2"><FreightModeTag mode={featureMode(feature.slug)} /><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">{feature.eyebrow}</p></div>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">{seo?.h1 ?? feature.name}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{seo?.intro ?? feature.description}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button render={<Link href={startHref} />} size="lg" className="bg-signal text-white hover:bg-signal/90">{startLabel} <ArrowRight aria-hidden /></Button><Button render={<Link href="/pricing" />} size="lg" variant="outline">See pricing</Button></div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
      <div>{feature.overview.map((paragraph) => <p key={paragraph.slice(0, 32)} className="mb-5 text-lg leading-8 text-muted-foreground">{paragraph}</p>)}</div>
      <aside className="rounded-3xl border border-amber/45 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-brand-deep">{headings[0]}</h2><ul className="mt-5 space-y-4">{feature.benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm font-medium"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Check className="size-3.5" aria-hidden /></span>{benefit}</li>)}</ul></aside>
    </section>
    {deep && <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6"><QuickAnswerCard content={deep} /></section>}
    <section className="section-edge border-t border-border bg-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><h2 className="text-3xl font-extrabold text-brand-deep">{headings[1]}</h2><ol className="mt-8 grid gap-5 md:grid-cols-3">{feature.workflow.map((step, index) => <li key={step} className="rounded-2xl bg-background p-5"><span className="text-sm font-extrabold text-signal">0{index + 1}</span><p className="mt-3 font-semibold text-primary">{step}</p></li>)}</ol></div></section>
    {deep
      ? <DeepContentBody content={{ ...deep, faqs }} faqHeading={headings[2]} faqIntro={`What teams ask before relying on ${feature.name.toLowerCase()} in a live operation.`} />
      : <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20"><h2 className="text-3xl font-extrabold text-brand-deep">{headings[2]}</h2><div className="mt-7 divide-y divide-border">{faqs.map((faq) => <details key={faq.q} className="group py-5"><summary className="cursor-pointer list-none font-bold text-primary">{faq.q}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.a}</p></details>)}</div></section>}
  </>;
}
