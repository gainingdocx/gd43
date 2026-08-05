import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, CircleCheck, FileSearch } from "lucide-react";

import { FaqList } from "@/components/marketing/deep-content";
import { Button } from "@/components/ui/button";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { PARSER_PAGES } from "@/content/parsers";
import { PARSER_SEO } from "@/content/seo-copy";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";
import { parserMode, type FreightMode } from "@/lib/freight/mode";
import { BreadcrumbBar } from "@/components/marketing/breadcrumb-bar";

const TITLE = "Shipping Document Parsers: OCR & AI Data Extraction";
const DESCRIPTION =
  "Extract structured data from Bills of Lading, commercial invoices, packing lists, air waybills, arrival notices, purchase orders, freight invoices and more. Every parser is document-specific and validated in code.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | GainingDocx` },
  description: DESCRIPTION,
  keywords: [
    "shipping document parser",
    "logistics document OCR",
    "freight document data extraction",
    "bill of lading OCR",
    "air waybill OCR",
    "customs document extraction",
    "trade document AI",
  ],
  alternates: { canonical: "/document-parsers" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/document-parsers", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const GROUPS: { mode: FreightMode; heading: string; blurb: string }[] = [
  {
    mode: "ocean",
    heading: "Ocean freight documents",
    blurb:
      "Transport documents and destination notices for container shipping, with ISO 6346 container check digits recomputed and every routing point matched against the UN/LOCODE dataset.",
  },
  {
    mode: "air",
    heading: "Air freight documents",
    blurb:
      "Air waybills, instructions, manifests and the specialist declarations that travel with them, with modulus-7 AWB validation and gross weight kept strictly separate from chargeable weight.",
  },
  {
    mode: "multimodal",
    heading: "Commercial and customs documents",
    blurb:
      "The invoices, packing lists, orders and receipts that move with cargo regardless of mode, extracted line by line so three-way matching and customs review work on rows rather than totals.",
  },
];

const FAQS = [
  {
    q: "What is a shipping document parser?",
    a: "Software that reads a freight document and returns its contents as structured fields rather than as page text. A document-specific parser knows that a Bill of Lading has a consignee, four routing points and a container table, so it maps values to meaning instead of returning a wall of characters that still has to be interpreted by hand.",
  },
  {
    q: "How is this different from generic OCR?",
    a: "Generic OCR converts images to text. It does not know which block is the notify party, which of four place fields it is looking at, or which weight belongs to which container. GainingDocx adds a document-specific field model on top of reading, then runs deterministic validation in code — container check digits, port codes, weight and package arithmetic — so results carry a reason rather than a confidence score.",
  },
  {
    q: "Which documents are supported?",
    a: "Bills of lading, sea waybills, arrival notices and booking confirmations for ocean; air waybills, shipper's letters of instruction, dangerous goods declarations, cargo manifests and security declarations for air; and commercial invoices, packing lists, purchase orders, freight invoices and goods receipts across both modes.",
  },
  {
    q: "Do I need an account to try it?",
    a: "No. Your first document can be parsed without signing up, and anonymous test parses are processed without being retained against an account. Signing in gives you a private workspace where documents, review history and exports are stored and can be deleted at any time.",
  },
  {
    q: "What file formats can I upload?",
    a: "Native PDFs, scans and photographs, including images taken on a phone at a terminal or warehouse. Multi-page documents and continuation sheets are processed page by page, which matters for packing lists and manifests where tables routinely run over a page break.",
  },
  {
    q: "How accurate is the extraction?",
    a: "Accuracy varies with document quality, and the honest design response is not to claim otherwise. Extracted values stay next to the source so they can be confirmed, deterministic checks flag anything the arithmetic cannot support, and the review step exists precisely because a field a person confirms in two seconds is worth more than a field a model asserted confidently.",
  },
  {
    q: "Can documents be compared against each other?",
    a: "Yes. Grouping documents as one shipment compares parties, references, quantities, weights, containers and descriptions across the whole set, and reports the disagreements as prioritised discrepancies rather than leaving them to a manual side-by-side read.",
  },
  {
    q: "What can I export?",
    a: "Excel workbooks with line items and container rows on their own sheets, CSV for flat feeds, structured JSON that preserves array detail, and PDF review reports. Reviewed data can also be pushed to a downstream system through a connector rather than re-keyed.",
  },
  {
    q: "Can a parser prove a document is genuine?",
    a: "No. Validation detects internal inconsistency — arithmetic that fails, references that contradict each other, dates in an impossible order. It cannot authenticate an issuer or confirm that a carrier actually issued a document. Confirm existence and validity through the issuing party's own systems.",
  },
  {
    q: "Is my document data kept private?",
    a: "Signed-in documents are stored privately in your own workspace and are not shared between accounts. You can export or delete them at any time, and deletion removes the document together with its extracted data.",
  },
];

export default function DocumentParsersPage() {
  const items = PARSER_PAGES.map((parser) => ({ name: parser.h1, path: `/${parser.slug}`, description: parser.metaDescription }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Document parsers", path: "/document-parsers" },
          ]),
          collectionPageLd("Shipping document parsers", "/document-parsers", items),
          itemListLd("Shipping document parsers", "/document-parsers", items),
          faqLd(FAQS),
        ]}
      />

      <section className="section-edge bg-[radial-gradient(circle_at_80%_8%,rgba(1,59,179,0.13),transparent_28rem)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <BreadcrumbBar>
            <Link href="/">Home</Link>
            <ChevronRight className="size-3" aria-hidden />
            <span>Document parsers</span>
          </BreadcrumbBar>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">
            {PARSER_PAGES.length} document-specific parsers
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">
            Shipping document parsers for ocean, air and customs paperwork
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Every freight document has its own fields, its own arithmetic and its own failure modes. Rather than one
            generic reader, GainingDocx runs a dedicated parser per document type — so a Bill of Lading returns
            containers and routing, an invoice returns priced line items, and a packing list returns package rows with
            weights that are checked against each other.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/app/scan" />} size="lg" className="bg-signal text-white hover:bg-signal/90">
              Parse a document free <ArrowRight aria-hidden />
            </Button>
            <Button render={<Link href="/pricing" />} size="lg" variant="outline">
              See pricing
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No sign-up for your first document</p>
        </div>
      </section>

      <section className="section-edge border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-extrabold text-brand-deep">What a document-specific parser does differently</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Fields, not page text",
                body: "Values are mapped to meaning — this block is the notify party, this place field is the port of discharge, this weight belongs to this container — so the output is usable without being re-read.",
              },
              {
                title: "Checks written in code",
                body: "Container check digits, IMO checksums, port codes, package totals, weight relationships and invoice arithmetic are evaluated deterministically. Every finding has a reproducible reason and, where calculable, an expected value.",
              },
              {
                title: "Review before export",
                body: "Extracted values sit next to the source page. Warnings are separated from contradictions so the review queue stays short enough that people actually work it.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <CircleCheck className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-brand-deep">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {GROUPS.map((group) => {
        const groupParsers = PARSER_PAGES.filter((parser) => parserMode(parser.slug) === group.mode);
        if (!groupParsers.length) return null;
        return (
          <section key={group.mode} className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">{group.heading}</h2>
            <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{group.blurb}</p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupParsers.map((parser) => {
                const seo = PARSER_SEO[parser.slug];
                return (
                  <li key={parser.slug}>
                    <Link
                      href={`/${parser.slug}`}
                      className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <FreightModeTag mode={parserMode(parser.slug)} />
                        <FileSearch className="size-4 text-signal" aria-hidden />
                      </span>
                      <span className="mt-3 font-bold text-primary">{seo?.h1 ?? parser.h1}</span>
                      <span className="mt-2 text-sm leading-6 text-muted-foreground">{parser.metaDescription}</span>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-signal">
                        Open parser <ArrowRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <FaqList
          faqs={FAQS}
          heading="Shipping document extraction FAQ"
          intro="Common questions about how document parsing works, what it can establish and what still needs a human."
        />
      </section>
    </>
  );
}
