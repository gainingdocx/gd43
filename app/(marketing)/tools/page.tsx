import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ChevronRight } from "lucide-react";

import { FaqList } from "@/components/marketing/deep-content";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { TOOLS } from "@/content/tools";
import { toolMode } from "@/lib/freight/mode";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";
import { BreadcrumbBar } from "@/components/marketing/breadcrumb-bar";

const TITLE = "Free Air & Ocean Freight Calculators and Tools";
const DESCRIPTION =
  "Free freight calculators for CBM, chargeable weight, container loading, LCL revenue tons, demurrage, container and AWB check digits, port codes, HS codes and shipping marks. No account required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "freight calculator",
    "CBM calculator",
    "chargeable weight calculator",
    "container number check",
    "demurrage calculator",
    "HS code lookup",
    "shipping tools free",
  ],
  alternates: { canonical: "/tools" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tools", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQS = [
  {
    q: "Are these tools really free?",
    a: "Yes. Every calculator on this page runs without an account and without a trial. They exist because the calculations behind freight charges should not be a black box — a shipper who can reproduce a carrier's arithmetic is in a much better position than one who cannot.",
  },
  {
    q: "Is my data stored when I use a calculator?",
    a: "The calculations are deterministic arithmetic performed for your session, not saved against an account. Where a tool needs a lookup — port codes, HS descriptions — that query goes to the relevant dataset or service. If you want a calculation retained as part of a shipment record with its source document and an export, use the workspace instead, where storage is explicit and deletable.",
  },
  {
    q: "Can I use these results to approve an invoice?",
    a: "Use them as a transparent working calculation and verify against the governing tariff, service contract or operational requirement. Each tool states its own limits, because the arithmetic is only as right as the assumptions — the day-count convention, the divisor, the rounding rule and the rate basis are all contractual rather than universal.",
  },
  {
    q: "Which tools should I use for air freight?",
    a: "The chargeable weight calculator for rating, the air waybill number checker for validating MAWB references, and the air cargo document checklist for working out what paperwork a shipment needs. The CBM calculator is useful for both modes, since volume feeds every volumetric calculation.",
  },
  {
    q: "Which tools should I use for ocean freight?",
    a: "The container number checker for ISO 6346 validation, the container load calculator for equipment selection, the LCL freight calculator for weight-or-measure pricing, the demurrage and detention calculator for time-based charges, and the UN/LOCODE lookup for routing references.",
  },
  {
    q: "Can I export the results?",
    a: "Most calculators export a CSV audit of the calculation, including the inputs and the assumptions applied. That matters more than the answer: a dispute raised three weeks later is won by whoever can show their working, and a reconstructed argument from memory rarely recovers the difference.",
  },
  {
    q: "Do the tools work on a phone?",
    a: "Yes. They are built to be usable on a phone at a warehouse or terminal, which is frequently where the question comes up. The shipping mark generator also prints and saves to PDF directly from a mobile browser.",
  },
  {
    q: "How do the tools relate to the guides?",
    a: "Each calculation has a guide explaining the method, the conventions and the mistakes that distort the result. The tool does the arithmetic; the guide tells you which arithmetic your contract actually calls for — which is usually the harder question.",
  },
];

export default function ToolsHub() {
  const sections = [
    { mode: "air" as const, title: "Air freight tools", copy: "Rate cargo correctly, validate airline references and organise the air document set before tender." },
    { mode: "ocean" as const, title: "Ocean freight tools", copy: "Validate equipment and routing references, choose the right container, and check the charges that follow a container to destination." },
    { mode: "multimodal" as const, title: "Shared trade tools", copy: "Volume, classification and packaging tools that apply to either freight mode." },
  ];
  const items = TOOLS.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}`, description: tool.description }));

  return <>
    <JsonLd data={[
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }]),
      collectionPageLd("Free freight calculators and tools", "/tools", items),
      itemListLd("Free freight calculators and tools", "/tools", items),
      faqLd(FAQS),
    ]} />
    <section className="section-edge bg-[radial-gradient(circle_at_82%_8%,rgba(1,59,179,0.12),transparent_28rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <BreadcrumbBar>
          <Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><span>Tools</span>
        </BreadcrumbBar>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">{TOOLS.length} free tools · no login required</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">Free freight calculators and reference tools</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Nearly every freight charge comes from a calculation somebody else performed. These tools reproduce those
          calculations transparently — the volumetric divisor, the revenue ton comparison, the free-time day count, the
          check digit — so you can verify a quotation or an invoice instead of taking it on trust.
        </p>
        <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">
          Start with Air, Ocean or Shared. Mode-specific tools use the correct transport references and conventions;
          shared trade tools work with either mode. Each one states the assumptions it applies and exports an audit of
          the calculation.
        </p>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-14">
        {sections.map((section) => {
          const tools = TOOLS.filter((tool) => toolMode(tool.slug) === section.mode);
          return <section key={section.mode}>
            <div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={section.mode} /><h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">{section.title}</h2></div>
            <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{section.copy}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group flex min-h-56 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><Calculator className="size-8 text-signal" aria-hidden /><FreightModeTag mode={section.mode} /></div><h3 className="mt-4 text-xl font-bold text-primary">{tool.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{tool.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Open tool <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>)}</div>
          </section>;
        })}
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
      <FaqList faqs={FAQS} heading="About the free tools" />
    </section>
  </>;
}
