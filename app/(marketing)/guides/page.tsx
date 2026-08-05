import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";

import { FaqList } from "@/components/marketing/deep-content";
import { GUIDES } from "@/content/guides";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";
import { BreadcrumbBar } from "@/components/marketing/breadcrumb-bar";

const TITLE = "Shipping Document & Freight Guides";
const DESCRIPTION =
  "Practical guides to Bills of Lading, air waybills, Incoterms, HS classification, container types, demurrage, chargeable weight, letters of credit and the calculations freight teams run every day.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | GainingDocx` },
  description: DESCRIPTION,
  keywords: [
    "shipping guides",
    "freight documentation guide",
    "incoterms guide",
    "bill of lading guide",
    "air freight guide",
    "customs documentation guide",
    "logistics knowledge base",
  ],
  alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/**
 * Editorial grouping for the hub. Kept here rather than on each guide so the
 * taxonomy can be reorganised without touching the content modules.
 */
const CATEGORIES: { heading: string; blurb: string; slugs: string[] }[] = [
  {
    heading: "Ocean freight",
    blurb:
      "Transport documents, equipment, release methods and the time-based charges that follow a container to destination.",
    slugs: [
      "how-to-read-a-bill-of-lading",
      "telex-release-vs-original-bill-of-lading",
      "shipping-container-types-and-sizes",
      "iso-6346-container-number-check-digit",
      "lcl-vs-fcl-shipping",
      "verified-gross-mass-vgm-guide",
      "demurrage-detention-calculation-guide",
      "shipping-instructions-format-word-template",
    ],
  },
  {
    heading: "Air freight",
    blurb:
      "How air documents differ from ocean, how chargeable weight is rated, and what dangerous goods paperwork actually requires.",
    slugs: [
      "air-waybill-vs-bill-of-lading",
      "chargeable-weight-calculation-air-freight",
      "dangerous-goods-air-freight-guide",
    ],
  },
  {
    heading: "Trade and customs",
    blurb:
      "The rules that decide duty: trade terms, classification, origin, and the document set every export needs.",
    slugs: [
      "incoterms-2020-explained",
      "hs-code-classification-guide",
      "rules-of-origin-explained",
      "export-documents-checklist",
      "commercial-invoice-vs-packing-list",
    ],
  },
  {
    heading: "Costs, controls and calculations",
    blurb:
      "Checking what you are billed, controlling what you pay, and the arithmetic underneath both.",
    slugs: [
      "how-to-calculate-cbm-for-shipping",
      "freight-invoice-audit-guide",
      "three-way-matching-guide",
      "letter-of-credit-document-checklist",
    ],
  },
];

const FAQS = [
  {
    q: "Who are these guides written for?",
    a: "People who handle freight documents as part of their job — export coordinators, forwarder operations, customs brokers, accounts payable teams checking freight invoices, and shippers who move goods internationally without a dedicated logistics function. They assume you know your own business and explain the freight side.",
  },
  {
    q: "Are the guides specific to one country?",
    a: "Mostly not. The underlying standards — Incoterms, the Harmonized System, ISO 6346, SOLAS, the air and sea dangerous goods regulations — are international. Where something is genuinely jurisdiction-specific, such as United States tariff columns or demurrage billing rules, that is stated rather than presented as universal.",
  },
  {
    q: "How current is the information?",
    a: "Each guide carries an updated date, and the ones covering standards that change — tariff schedules, dangerous goods regulations, trade agreements — say explicitly that the current edition governs. Treat the guides as orientation and the governing document for your shipment as authority.",
  },
  {
    q: "Do the guides replace professional advice?",
    a: "No. Classification, origin determination, dangerous goods acceptance and customs valuation all carry legal consequences and, in several cases, require trained or licensed people. The guides explain how these things work so you can have a better conversation with the person who is qualified to decide.",
  },
  {
    q: "Which guide should I start with?",
    a: "If you are new to international shipping, start with the export documents checklist and Incoterms. If you handle ocean imports, start with reading a Bill of Lading and the demurrage guide. If you handle air, start with the air waybill comparison and chargeable weight. If you approve invoices, start with three-way matching and freight invoice audit.",
  },
  {
    q: "Do the guides connect to the free tools?",
    a: "Yes. Where a guide explains a calculation — CBM, chargeable weight, container check digits, demurrage, LCL freight — there is a free tool that performs it, with no account required. The guide explains the method; the tool does the arithmetic and exports an audit.",
  },
];

export default function GuidesHub() {
  const items = GUIDES.map((guide) => ({
    name: guide.title,
    path: `/guides/${guide.slug}`,
    description: guide.description,
  }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
          collectionPageLd("Shipping document and freight guides", "/guides", items),
          itemListLd("Shipping document and freight guides", "/guides", items),
          faqLd(FAQS),
        ]}
      />

      <section className="section-edge bg-[radial-gradient(circle_at_80%_8%,rgba(1,59,179,0.12),transparent_28rem)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <BreadcrumbBar>
            <Link href="/">Home</Link>
            <ChevronRight className="size-3" aria-hidden />
            <span>Guides</span>
          </BreadcrumbBar>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">
            {GUIDES.length} practical guides
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">
            Shipping document and freight guides
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Freight documentation is learned on the job, usually from whoever sat next to you, and usually in
            fragments. These guides set out how each document works, what each field means, which calculations
            underpin the charges, and where the genuine legal boundaries sit — written for people who have to get a
            shipment out this afternoon rather than for an exam.
          </p>
        </div>
      </section>

      {CATEGORIES.map((category) => {
        const guides = category.slugs
          .map((slug) => GUIDES.find((guide) => guide.slug === slug))
          .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide));
        if (!guides.length) return null;
        return (
          <section key={category.heading} className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">{category.heading}</h2>
            <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{category.blurb}</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <BookOpen className="size-6 text-signal" aria-hidden />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {guide.readMinutes} min read
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold leading-tight text-brand-deep">{guide.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    Read guide <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <FaqList faqs={FAQS} heading="About these guides" />
      </section>
    </>
  );
}
