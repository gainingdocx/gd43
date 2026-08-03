import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileCheck2, ShieldAlert } from "lucide-react";

import { TemplateBuilder } from "@/components/templates/template-builder";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { TEMPLATES } from "@/content/templates";
import { TEMPLATE_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, templateLd } from "@/lib/seo/jsonld";
import { templateMode } from "@/lib/freight/mode";

export const dynamicParams = true;
export function generateStaticParams() { return TEMPLATES.map((template) => ({ slug: template.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const template = TEMPLATES.find((item) => item.slug === slug);
  if (!template) return {};
  const seo = TEMPLATE_SEO[slug];
  return { title: { absolute: seo?.title ? `${seo.title} | GainingDocx` : `Free ${template.name} — PDF, XLSX & DOCX | GainingDocx` }, description: seo?.description ?? template.description, alternates: { canonical: `/templates/${slug}` }, openGraph: { title: seo?.title ?? `Free ${template.name} Template`, description: seo?.description ?? template.description, url: `/templates/${slug}`, type: "website" } };
}

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = TEMPLATES.find((item) => item.slug === slug);
  if (!template) notFound();
  const seo = TEMPLATE_SEO[slug];
  const headings = seo?.headings ?? [template.lineTitle, "Document checks", "How to prepare this document", "Frequently asked questions"];
  const faqs = [
    ...template.faqs,
    { q: `Which formats can I download for this ${template.name}?`, a: "You can complete the browser form and download a generated PDF. Editable XLSX and DOCX starter files are also available for offline work." },
    { q: "Are the details I enter uploaded?", a: "The template form is designed to keep entries in the browser while you prepare the document. Review the finished file before sharing it with a carrier, customer, broker or authority." },
    { q: "Does this template replace carrier, customs or legal advice?", a: `No. ${template.authorityNotice}` },
  ];
  const steps = ["Fill the shipment, party and reference details.", "Add cargo lines; relevant totals and CBM update automatically.", "Review required fields and download PDF, XLSX or DOCX."];

  return <>
    <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }, { name: template.name, path: `/templates/${slug}` }]), templateLd(template.name, template.description, `/templates/${slug}`), howToLd(`How to use the ${template.name}`, steps), faqLd(faqs)]} />
    <section className="section-edge bg-white"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16"><nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground"><Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><Link href="/templates">Templates</Link><ChevronRight className="size-3" aria-hidden /><span>{template.name}</span></nav><div className="mt-8 flex items-center gap-2"><FreightModeTag mode={templateMode(template.slug)} /><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Fillable shipping document</p></div><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">{seo?.h1 ?? `Free ${template.name} Template`}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{seo?.intro ?? template.description}</p><div className="mt-6 flex max-w-3xl gap-3 rounded-2xl bg-secondary p-4 text-sm leading-6 text-secondary-foreground"><FileCheck2 className="mt-0.5 size-5 shrink-0" aria-hidden /><p>{template.purpose}</p></div></div></section>
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14"><TemplateBuilder template={template} sectionHeadings={headings} />{slug === "shipping-instructions-template" && <div className="mt-6 rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Detailed field guide</p><Link href="/guides/shipping-instructions-format-word-template" className="mt-2 inline-flex items-center gap-2 font-bold text-primary hover:underline">Read the complete shipping-instructions Word format guide<ChevronRight className="size-4" aria-hidden /></Link></div>}</section>
    <section className="section-edge border-t border-border bg-white"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.8fr]"><div><h2 className="text-2xl font-extrabold text-brand-deep">{headings[2]}</h2><ol className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">{steps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{index + 1}</span><p className="text-sm leading-6 text-muted-foreground">{step}</p></li>)}</ol></div><aside className="rounded-3xl border border-warning/30 bg-warning/10 p-6"><div className="flex items-center gap-2 font-bold text-primary"><ShieldAlert className="size-5" aria-hidden />Authority and compliance note</div><p className="mt-3 text-sm leading-6 text-muted-foreground">{template.authorityNotice}</p></aside></div></section>
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20"><h2 className="text-3xl font-extrabold text-brand-deep">{headings[3]}</h2><div className="mt-7 divide-y divide-border">{faqs.map((faq) => <details key={faq.q} className="py-5"><summary className="cursor-pointer font-bold text-primary">{faq.q}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.a}</p></details>)}</div></section>
  </>;
}
