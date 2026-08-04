import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";

import { DeepContentBody, QuickAnswerCard } from "@/components/marketing/deep-content";
import { ToolCalculator } from "@/components/tools/tool-calculator";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { TOOL_DEEP } from "@/content/deep/tools";
import { deepSteps } from "@/content/deep/types";
import { TOOLS } from "@/content/tools";
import { TOOL_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, techArticleLd, webApplicationLd } from "@/lib/seo/jsonld";
import { toolMode } from "@/lib/freight/mode";

export const dynamicParams = true;
export function generateStaticParams() { return TOOLS.map((tool) => ({ slug: tool.slug })); }

const SEO_DETAILS: Record<string, { useCases: string[]; method: string; caution: string }> = {
  "air-waybill-number-check": { useCases: ["Batch-check airline-issued MAWB numbers", "Separate prefix, serial and check digit", "Find transcription errors", "Export a CSV review file"], method: "The checker removes spaces and hyphens, confirms the 11-digit airline MAWB structure, divides the seven-digit serial by seven and compares the remainder with the printed final digit.", caution: "A valid arithmetic check digit does not prove that the airline issued the number or that cargo was booked. HAWB references may use forwarder-specific formats." },
  "air-cargo-document-checklist": { useCases: ["Prepare a general air export", "Organize a MAWB–HAWB consolidation", "Collect dangerous-goods paperwork", "Prepare perishable-cargo evidence"], method: "The checklist combines a common commercial and transport document core with conditional records based on the user's role and selected cargo scenario, then links to the relevant working document workflow.", caution: "Airline, origin, destination, commodity, customs, security and dangerous-goods requirements vary. Confirm the current instructions for the actual shipment." },
  "cbm-calculator": { useCases: ["Calculate total shipment cubic metres", "Combine carton groups with different dimensions", "Check total gross weight before quoting", "Export an auditable CSV"], method: "Each package row converts its selected dimensions to metres, multiplies length × width × height by quantity, then sums the row volumes and weights.", caution: "Measured cargo can require carrier rounding rules or pallet allowances. Confirm the booking basis before tendering freight." },
  "container-load-calculator": { useCases: ["Estimate identical-carton capacity", "Compare 20GP, 40GP, 40HC and 45HC equipment", "Test six carton rotations", "Identify whether space or payload controls"], method: "The tool tests six orthogonal carton rotations against approximate internal equipment dimensions and separately compares the resulting spatial count with payload capacity.", caution: "This is an orthogonal fit estimate, not a mixed-SKU or operational stow plan. Door clearance, dunnage, load distribution and safe handling still apply." },
  "container-number-check": { useCases: ["Validate ISO 6346 check digits", "Batch-check up to 100 container numbers", "Find transcription errors", "Export a validation audit"], method: "Letters are converted to ISO 6346 numeric values, multiplied by powers of two, summed and reduced to the expected check digit.", caution: "A valid check digit confirms number structure, not ownership, availability, physical condition or current tracking status." },
  "port-code-lookup": { useCases: ["Find a port by name", "Confirm a five-character UN/LOCODE", "Standardize routing references", "Reduce ambiguous port naming"], method: "Search terms are matched against the bundled UN/LOCODE location name and code data, including the two-character country prefix and three-character location identifier.", caution: "Confirm terminal, facility and carrier routing details separately; a UN/LOCODE identifies a trade and transport location, not every terminal within it." },
  "chargeable-weight-calculator": { useCases: ["Compare actual and volumetric weight per cargo line", "Calculate multiple package groups", "Apply line rounding and estimate freight cost", "Export an invoice-audit CSV"], method: "Each cargo line calculates actual weight from weight per piece × quantity and volumetric weight from dimensions, quantity and the selected divisor. The higher line result is rounded as selected, then chargeable lines are summed.", caution: "Airlines, couriers and tariffs may compare or round at different levels and may apply minimum weights. Reproduce the contracted rating rule." },
  "lcl-freight-calculator": { useCases: ["Convert weight to revenue tons", "Compare CBM with W/M weight", "Estimate base ocean freight", "Add and audit accessorial charges"], method: "The calculator compares shipment CBM with metric tons under the W/M basis, applies the quoted rate to the controlling revenue tons, then adds entered charges.", caution: "Carrier tariffs can include minimums, rounding and local charges not represented by a simple W/M estimate." },
  "demurrage-detention-calculator": { useCases: ["Calculate demurrage, detention or combined D&D", "Choose calendar or Monday–Friday counting", "Set inclusive or exclusive start dates", "Export an invoice-audit CSV"], method: "The calculator counts days from the selected operational events under the disclosed day and start-date convention, deducts free time, allocates chargeable days through the entered rate tiers and adds fixed fees.", caution: "Contracts differ on inclusive dates, local holidays, start events, combined free time and storage. Confirm the governing tariff or service contract." },
  "hs-code-finder": { useCases: ["Search commodities by plain-language description", "Separate six-digit HS from U.S. HTS", "Review published general rate fields", "Copy a candidate code for invoice review"], method: "The search queries the official U.S. International Trade Commission HTS service, ranks matching descriptions and displays the first six digits separately from the longer U.S. statistical classification.", caution: "Search results are candidates, not binding rulings. Duty treatment depends on the full classification, origin, destination and applicable trade measures." },
  "shipping-mark-generator": { useCases: ["Create carton and case marks", "Keep packing-list references consistent", "Print or save a PDF", "Download an editable HTML mark"], method: "The browser formats the entered consignee, destination, purchase-order, case, weight, dimension and handling values into a high-contrast printable mark.", caution: "Marking rules vary by buyer, carrier, letter of credit and destination. Confirm required and prohibited package information before printing." },
};

const GUIDE_LINKS: Record<string, { href: string; label: string }> = {
  "chargeable-weight-calculator": { href: "/guides/chargeable-weight-calculation-air-freight", label: "Read the complete chargeable-weight calculation guide" },
  "demurrage-detention-calculator": { href: "/guides/demurrage-detention-calculation-guide", label: "Read the complete demurrage and detention guide" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((item) => item.slug === slug);
  if (!tool) return {};
  const seo = TOOL_SEO[slug];
  const deep = TOOL_DEEP[slug];
  const title = seo?.title ?? `Free ${tool.name} | GainingDocx`;
  const description = seo?.description ?? tool.description;
  return {
    title: { absolute: title },
    description,
    keywords: deep?.keywords,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: { title: seo?.title ?? `Free ${tool.name}`, description, url: `/tools/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title: seo?.title ?? `Free ${tool.name}`, description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOLS.find((item) => item.slug === slug);
  if (!tool) notFound();
  const seo = TOOL_SEO[slug];
  const headings = seo?.headings ?? ["What this tool helps you check", "Calculation method", "Frequently asked questions"];
  const details = SEO_DETAILS[slug];
  const deep = TOOL_DEEP[slug];
  const fallbackFaqs = [
    { q: `Is the ${tool.name} free to use?`, a: "Yes. The calculator is available without an account, and values entered into the form are calculated in the browser or by the tool endpoint required for the lookup." },
    { q: `How does the ${tool.name} work?`, a: details.method },
    { q: "Can I use the result for a booking or invoice approval?", a: `Use the result as a transparent working calculation and verify it against the governing carrier tariff, contract or operational requirement. ${details.caution}` },
  ];
  const faqs = deep?.faqs ?? fallbackFaqs;
  const steps = deepSteps(deep).length
    ? deepSteps(deep)
    : ["Enter the shipment values from the relevant document or quotation.", "Review the calculated result, units and assumptions.", "Export or record the result, then confirm contract-specific requirements."];

  return <>
    <JsonLd data={[
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free freight tools", path: "/tools" }, { name: tool.name, path: `/tools/${slug}` }]),
      webApplicationLd(tool.name, tool.description, `/tools/${slug}`),
      howToLd(`How to use the ${tool.name}`, steps),
      faqLd(faqs),
      ...(deep ? [techArticleLd({ headline: seo?.h1 ?? tool.name, description: seo?.description ?? tool.description, path: `/tools/${slug}`, dateModified: deep.updated, keywords: deep.keywords, sections: deep.sections.map((section) => section.heading) })] : []),
    ]} />
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground"><Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><Link href="/tools">Tools</Link><ChevronRight className="size-3" aria-hidden /><span>{tool.name}</span></nav>
        <div className="mt-7 grid items-end gap-8 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2"><FreightModeTag mode={toolMode(slug)} /><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Free freight tool</p></div><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">{seo?.h1 ?? tool.name}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{seo?.intro ?? tool.intro}</p></div><span className="hidden size-20 items-center justify-center rounded-3xl bg-secondary text-primary lg:flex"><Calculator className="size-9" aria-hidden /></span></div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14"><ToolCalculator slug={slug} />{GUIDE_LINKS[slug] && <div className="mt-6 rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Detailed learning guide</p><Link href={GUIDE_LINKS[slug].href} className="mt-2 inline-flex items-center gap-2 font-bold text-primary hover:underline">{GUIDE_LINKS[slug].label}<ChevronRight className="size-4" aria-hidden /></Link></div>}</section>
    {deep && <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6"><QuickAnswerCard content={deep} /></section>}
    <section className="section-edge border-t border-border bg-white"><div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2"><div><h2 className="text-2xl font-extrabold text-brand-deep">{headings[0]}</h2><ul className="mt-6 grid gap-3 sm:grid-cols-2">{details.useCases.map((item) => <li key={item} className="flex gap-2 rounded-xl bg-background p-3 text-sm font-medium"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />{item}</li>)}</ul></div><div><h2 className="text-2xl font-extrabold text-brand-deep">{headings[1]}</h2><p className="mt-5 leading-7 text-muted-foreground">{details.method}</p><div className="mt-5 flex gap-3 rounded-2xl bg-secondary p-4 text-sm leading-6 text-secondary-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden /><p>{details.caution}</p></div></div></div></section>
    {deep
      ? <DeepContentBody content={deep} faqHeading={headings[2]} faqIntro={`Practical answers to the questions operators, forwarders and shippers ask most often about ${tool.name.toLowerCase()} results.`} />
      : <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20"><h2 className="text-3xl font-extrabold text-brand-deep">{headings[2]}</h2><div className="mt-7 divide-y divide-border">{faqs.map((faq) => <details key={faq.q} className="py-5"><summary className="cursor-pointer font-bold text-primary">{faq.q}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.a}</p></details>)}</div></section>}
  </>;
}
