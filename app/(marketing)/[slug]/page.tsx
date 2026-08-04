import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, CircleCheck, ShieldCheck } from "lucide-react";

import { DeepContentBody, QuickAnswerCard } from "@/components/marketing/deep-content";
import { Button } from "@/components/ui/button";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { PARSER_DEEP } from "@/content/deep/parsers";
import { PARSER_PAGES } from "@/content/parsers";
import { PARSER_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, serviceLd, techArticleLd } from "@/lib/seo/jsonld";
import { parserMode } from "@/lib/freight/mode";

// Parser landing pages are statically generated from the document capability catalog.
// Keep runtime param handling enabled: OpenNext serves these prerendered paths
// through the Worker and otherwise treats dynamicParams=false as a hard 404.
export const dynamicParams = true;

export function generateStaticParams() {
  return PARSER_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = PARSER_PAGES.find((p) => p.slug === slug);
  if (!page) return {};
  const seo = PARSER_SEO[page.slug];
  const deep = PARSER_DEEP[page.slug];
  const title = seo?.title ?? page.metaTitle;
  const description = seo?.description ?? page.metaDescription;
  return {
    title: { absolute: title },
    description,
    keywords: deep?.keywords,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title, description, url: `/${page.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const HOWTO_STEPS = [
  "Upload or photograph the document — pages are compressed on your device.",
  "Review the extracted fields; deterministic checks flag anything suspicious.",
  "Export to Excel, CSV or JSON, or generate the counterpart document.",
];

const PARSER_HINTS: Record<string, string> = {
  "bill-of-lading-parser": "bill_of_lading",
  "commercial-invoice-parser": "commercial_invoice",
  "packing-list-parser": "packing_list",
  "sea-waybill-parser": "sea_waybill",
  "arrival-notice-parser": "arrival_notice",
  "booking-confirmation-parser": "booking_confirmation",
  "purchase-order-parser": "purchase_order",
  "freight-invoice-parser": "freight_invoice",
  "goods-receipt-parser": "goods_receipt",
  "air-waybill-parser": "air_waybill",
  "shipper-letter-of-instruction-parser": "shipper_letter_of_instruction",
  "dangerous-goods-declaration-parser": "dangerous_goods_declaration",
  "air-cargo-manifest-parser": "air_cargo_manifest",
  "cargo-security-declaration-parser": "cargo_security_declaration",
};

export default async function ParserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PARSER_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();
  const seo = PARSER_SEO[page.slug];
  const deep = PARSER_DEEP[page.slug];
  const headings = seo?.headings ?? ["What gets extracted", "Deterministic checks", "How it works", "Frequently asked questions"];
  const faqs = deep ? [...deep.faqs, ...page.faqs.filter((f) => !deep.faqs.some((d) => d.q === f.q))] : page.faqs;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Document parsers", path: "/document-parsers" },
            { name: page.h1, path: `/${page.slug}` },
          ]),
          serviceLd(page.h1, page.metaDescription, `/${page.slug}`),
          howToLd(`How to parse a document with ${page.h1}`, HOWTO_STEPS),
          faqLd(faqs),
          ...(deep
            ? [
                techArticleLd({
                  headline: seo?.h1 ?? page.h1,
                  description: seo?.description ?? page.metaDescription,
                  path: `/${page.slug}`,
                  dateModified: deep.updated,
                  keywords: deep.keywords,
                  sections: deep.sections.map((section) => section.heading),
                }),
              ]
            : []),
        ]}
      />

      <section className="section-edge bg-gradient-to-b from-background to-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/document-parsers" className="hover:underline">Document parsers</Link>
            <ChevronRight className="size-3" aria-hidden />
            <span>{page.h1}</span>
          </nav>
          <FreightModeTag mode={parserMode(page.slug)} className="mt-5" />
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">
            {seo?.h1 ?? page.h1}
          </h1>
          {seo && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{seo.intro}</p>}
          {page.intro.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              {p}
            </p>
          ))}
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              render={<Link href={`/app/scan?type=${PARSER_HINTS[page.slug]}`} />}
              size="lg"
              className="bg-signal text-signal-foreground hover:bg-signal/90"
            >
              Parse a document free
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
            <Button render={<Link href="/pricing" />} size="lg" variant="outline">
              See pricing
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No sign-up for your first document · 15–30 seconds per page
          </p>
        </div>
      </section>

      {deep && (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <QuickAnswerCard content={deep} />
        </section>
      )}

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-deep">{headings[0]}</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {page.extracted.map((item) => (
              <li key={item} className="flex gap-2 leading-6">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-brand-deep">{headings[1]}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Computed in code — the AI never does the math.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {page.checks.map((item) => (
              <li key={item} className="flex gap-2 leading-6">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-edge border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold text-brand-deep">{headings[2]}</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {HOWTO_STEPS.map((step, i) => (
              <li key={step} className="rounded-2xl bg-background p-5">
                <span className="text-sm font-extrabold text-signal">0{i + 1}</span>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {deep ? (
        <DeepContentBody
          content={{ ...deep, faqs }}
          faqHeading={headings[3]}
          faqIntro={`What teams ask most often before putting ${page.h1.toLowerCase()} output into a customs filing, a payment run or a downstream system.`}
        >
          <div className="rounded-3xl bg-primary p-8 text-center">
            <p className="text-lg font-semibold text-primary-foreground">
              Try it on your own document — free, no sign-up
            </p>
            <Button
              render={<Link href={`/app/scan?type=${PARSER_HINTS[page.slug]}`} />}
              size="lg"
              className="mt-4 bg-signal text-signal-foreground hover:bg-signal/90"
            >
              Start parsing
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </DeepContentBody>
      ) : (
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold text-brand-deep">{headings[3]}</h2>
          <div className="mt-6 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-primary">{f.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl bg-primary p-8 text-center">
            <p className="text-lg font-semibold text-primary-foreground">
              Try it on your own document — free, no sign-up
            </p>
            <Button
              render={<Link href={`/app/scan?type=${PARSER_HINTS[page.slug]}`} />}
              size="lg"
              className="mt-4 bg-signal text-signal-foreground hover:bg-signal/90"
            >
              Start parsing
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
