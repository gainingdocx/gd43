import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, FileOutput, FileSearch, Files, Mail, Search, ShieldCheck } from "lucide-react";

import { FaqList } from "@/components/marketing/deep-content";
import { FEATURES } from "@/content/features";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { featureMode } from "@/lib/freight/mode";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";

const TITLE = "Shipping Document Automation Software Features";
const DESCRIPTION =
  "Air and ocean freight document ingestion, extraction, deterministic validation, cross-document matching, invoice audit, MAWB–HAWB reconciliation and structured export.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "shipping document automation",
    "freight document software",
    "logistics document extraction",
    "three way matching software",
    "freight invoice audit software",
    "air cargo document automation",
    "shipping data validation",
  ],
  alternates: { canonical: "/features" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/features", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const icons = [FileSearch, ShieldCheck, Files, Search, FileOutput, Boxes, Mail];

const FAQS = [
  {
    q: "What does GainingDocx actually do?",
    a: "It reads freight documents into structured fields, checks those fields with deterministic rules written in code, compares documents in a shipment against each other, and exports the reviewed result. The AI reads; the rules decide; a person confirms before anything leaves the workspace.",
  },
  {
    q: "How is this different from generic document OCR?",
    a: "Generic OCR returns the text on a page. It does not know which address block is the consignee, which of four place fields it is looking at, or which weight belongs to which container. Each document type here has its own field model, and every extraction is followed by checks — container check digits, port codes, arithmetic, weight relationships — that produce a reason rather than a confidence score.",
  },
  {
    q: "Do I need to configure templates for each carrier or supplier?",
    a: "No. Field models are built per document type rather than per layout, so a Bill of Lading from an unfamiliar NVOCC or an invoice from a new supplier extracts without setup. There is no template library to maintain and nothing to update when a partner redesigns their paperwork.",
  },
  {
    q: "Can it file documents with customs or a carrier?",
    a: "No. It extracts, checks and exports. It does not issue transport documents, does not transmit manifests, and does not lodge filings with any authority or carrier system — those are separate regulated processes with their own channels and their own responsible parties.",
  },
  {
    q: "How do documents get into the workspace?",
    a: "Forward a shipment email to your private intake address, upload single documents or batches, or push them from another system. Documents arriving together are grouped into a shipment record, which is what makes cross-document comparison possible rather than treating each file in isolation.",
  },
  {
    q: "What happens to findings that need a human?",
    a: "They surface as a prioritised list ordered by operational impact — what blocks customs first, then payment, then delivery. Contradictions that cannot be true are separated from warnings that could not be confirmed, because a queue that treats every finding as urgent stops being worked.",
  },
  {
    q: "Can reviewed data be pushed into my TMS or ERP?",
    a: "Yes. Reviewed records export as structured JSON preserving line and container arrays, as Excel and CSV, and as connector payloads that push to a downstream endpoint so records do not have to be re-keyed.",
  },
  {
    q: "Is my document data private?",
    a: "Documents are stored privately in your own workspace, are not shared between accounts, and can be exported or deleted at any time. Deletion removes the document together with its extracted data and its search entries.",
  },
  {
    q: "Which freight modes are supported?",
    a: "Both. Ocean controls cover bills of lading, sea waybills, bookings, arrival notices, containers, ports and free time. Air controls cover master and house air waybills, instructions, manifests, chargeable weight, dangerous goods and security declarations. Commercial documents — invoices, packing lists, orders, receipts — apply to either.",
  },
  {
    q: "Can I try it before signing up?",
    a: "Yes. Your first document can be parsed without an account, and anonymous test parses are processed without being retained. Signing in gives you the workspace, shipment grouping, cross-document matching, search and export.",
  },
];

export default function FeaturesPage() {
  const sections = [
    { mode: "air" as const, title: "Air freight controls", copy: "AWB, consolidation, chargeable-weight, invoice and dangerous-goods document workflows built around air-cargo evidence." },
    { mode: "ocean" as const, title: "Ocean freight controls", copy: "B/L, container, port, free-time and maritime validation built around ocean shipment evidence." },
    { mode: "multimodal" as const, title: "Shared document controls", copy: "Inbox intake, extraction, matching, search and export capabilities used with either freight mode." },
  ];
  const items = FEATURES.map((feature) => ({ name: feature.name, path: `/features/${feature.slug}`, description: feature.description }));
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]),
        collectionPageLd("Shipping document automation features", "/features", items),
        itemListLd("Shipping document automation features", "/features", items),
        faqLd(FAQS),
      ]} />
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
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <FaqList faqs={FAQS} heading="How the workspace works" />
      </section>
    </>
  );
}
