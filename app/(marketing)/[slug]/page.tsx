import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { PARSER_PAGES } from "@/content/parsers";
import { PARSER_SEO } from "@/content/seo-copy";
import { breadcrumbLd, faqLd, howToLd, JsonLd, serviceLd } from "@/lib/seo/jsonld";
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
  return {
    title: { absolute: seo?.title ?? page.metaTitle },
    description: seo?.description ?? page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: seo?.title ?? page.metaTitle, description: seo?.description ?? page.metaDescription, url: `/${page.slug}`, type: "website" },
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
  const headings = seo?.headings ?? ["What gets extracted", "Deterministic checks", "How it works", "Frequently asked questions"];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: page.h1, path: `/${page.slug}` },
          ]),
          serviceLd(page.h1, page.metaDescription, `/${page.slug}`),
          howToLd(`How to parse a document with ${page.h1}`, HOWTO_STEPS),
          faqLd(page.faqs),
        ]}
      />

      <section className="section-edge bg-gradient-to-b from-background to-secondary/60">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              Home
            </Link>{" "}
            / {page.h1}
          </nav>
          <FreightModeTag mode={parserMode(page.slug)} className="mt-5" />
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary">
            {seo?.h1 ?? page.h1}
          </h1>
          {seo && <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{seo.intro}</p>}
          {page.intro.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 max-w-3xl text-lg text-muted-foreground">
              {p}
            </p>
          ))}
          <div className="mt-6 flex flex-wrap gap-3">
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

      <section className="mx-auto grid max-w-4xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-primary">{headings[0]}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {page.extracted.map((item) => (
              <li key={item} className="flex gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{headings[1]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Computed in code — the AI never does the math.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {page.checks.map((item) => (
              <li key={item} className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold text-primary">{headings[2]}</h2>
          <ol className="mt-4 space-y-3">
            {HOWTO_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-bold text-primary">{headings[3]}</h2>
        <div className="mt-6 space-y-6">
          {page.faqs.map((f) => (
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
    </>
  );
}
