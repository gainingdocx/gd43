import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  CircleCheck,
  FileCheck2,
  FileOutput,
  FileSearch,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  LibraryBig,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FEATURES } from "@/content/features";
import { GUIDES } from "@/content/guides";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { collectionPageLd, JsonLd, webApplicationLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: { absolute: "AI Shipping Document Parser & Freight Document OCR | GainingDocx" },
  description:
    "Extract and validate data from Bills of Lading, commercial invoices, packing lists, air waybills and other freight documents. Export to Excel, CSV or JSON.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GainingDocx — Easy PaperWork for Shipping Teams",
    description: "AI document parsing, maritime validation, free calculators and editable shipping templates in one practical workspace.",
    url: "/",
    type: "website",
  },
};

const featureIcons = [FileSearch, ShieldCheck, GitCompareArrows, Search, FileOutput, FileText];
const templateGroups = [
  { label: "Plan & clear", slugs: ["pro-forma-invoice-template", "commercial-invoice-template", "certificate-of-origin-template"] },
  { label: "Pack & instruct", slugs: ["simple-packing-list-template", "packing-list-template", "container-packing-list-template", "shipping-instructions-template"] },
  { label: "Move & release", slugs: ["bill-of-lading-template", "air-waybill-template", "arrival-notice-template", "delivery-order-template"] },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          webApplicationLd(
            "GainingDocx",
            "AI shipping document extraction, validation, matching, export and generation workspace.",
            "/",
          ),
          collectionPageLd(
            "GainingDocx shipping paperwork resources",
            "/",
            [
              ...PARSER_PAGES.map((item) => ({ name: item.h1, path: `/${item.slug}` })),
              ...FEATURES.map((item) => ({ name: item.name, path: `/features/${item.slug}` })),
              ...TOOLS.map((item) => ({ name: item.name, path: `/tools/${item.slug}` })),
              ...TEMPLATES.map((item) => ({ name: item.name, path: `/templates/${item.slug}` })),
            ],
          ),
        ]}
      />

      <section className="relative overflow-hidden border-b border-border bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(1,59,179,0.14),transparent_31%),radial-gradient(circle_at_8%_82%,rgba(212,5,5,0.06),transparent_25%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-[#d40505] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
                <Sparkles className="size-3.5 text-white" aria-hidden />
                Easy PaperWork for shipping teams
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-primary sm:text-5xl lg:text-[3.65rem]">
                AI Shipping Document Parser for Freight and Logistics
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Turn Bills of Lading, commercial invoices, packing lists, air waybills and other shipping PDFs or images into reviewed, structured data. Validate critical references, correct the result, and export to Excel, CSV or JSON.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button render={<Link href="/app/scan" />} size="lg" className="h-12 bg-signal px-6 text-white hover:bg-signal/90">
                  <Upload aria-hidden /> Parse a shipping document free <ArrowRight aria-hidden />
                </Button>
                <Button render={<Link href="#explore" />} size="lg" variant="outline" className="h-12 px-6">
                  Explore everything
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
                {["One guest document daily", "Edit before export", "No sign-up to try"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5"><CircleCheck className="size-4 text-primary" aria-hidden />{item}</li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-xl" aria-label="Preview of the GainingDocx document workflow">
              <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.25rem] bg-secondary" />
              <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_30px_90px_-42px_rgba(1,59,179,0.65)]">
                <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="" width={36} height={36} unoptimized className="size-9 rounded-full bg-white" />
                    <div><p className="text-xs text-white/65">Shipment workspace</p><p className="text-sm font-bold">B/L MSCU-240718</p></div>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Reviewed</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[.9fr_1.1fr]">
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-background px-5 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><ScanLine className="size-6" aria-hidden /></span>
                    <p className="mt-4 text-sm font-bold text-primary">10 document types</p>
                    <p className="mt-1 text-xs text-muted-foreground">PDF, image or phone photo</p>
                  </div>
                  <div className="space-y-2.5">
                    {[["Container", "MSCU 663987 0"], ["Route", "Shanghai → Rotterdam"], ["Cross-check", "Invoice + packing list"]].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border px-3.5 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold text-primary">{value}</p></div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-3 text-sm font-bold text-primary"><FileCheck2 className="size-4" aria-hidden />Checks passed · ready to export</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-primary shadow-xl sm:-left-7"><Check className="size-4 text-signal" aria-hidden />Excel · CSV · JSON · PDF</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-primary text-white" aria-label="How GainingDocx works">
        <div className="mx-auto grid max-w-6xl divide-y divide-white/15 px-4 sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:px-6">
          {[["01", "Upload", "PDF or page image"], ["02", "Extract", "Fields and line items"], ["03", "Verify", "Rules and cross-checks"], ["04", "Use", "Export or generate"]].map(([number, title, text]) => (
            <div key={number} className="flex items-center gap-3 py-5 sm:px-5 sm:first:pl-0"><span className="text-xl font-black text-white/30">{number}</span><div><p className="font-bold">{title}</p><p className="text-xs text-white/65">{text}</p></div></div>
          ))}
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Every document parser</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">Extract data from Bills of Lading, invoices and packing lists.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Choose a dedicated shipping document OCR parser to review supported fields, validation checks and export formats for each freight document type.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARSER_PAGES.map((parser, index) => (
            <Link key={parser.slug} href={`/${parser.slug}`} className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><FileSearch className="size-5" aria-hidden /></span><span className="text-xs font-black text-muted-foreground">0{index + 1}</span></div>
              <h3 className="mt-4 font-black text-primary">{parser.h1.replace("AI ", "")}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">Extracts {parser.extracted.slice(0, 3).join(", ").toLowerCase()}.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">View parser <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">The complete workflow</p><h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">Validate, match and export shipping document data.</h2><p className="mt-4 leading-7 text-muted-foreground">Move from freight document OCR to deterministic checks, PO-invoice-receipt matching, private search, structured exports and editable document drafts.</p></div>
          <div className="relative mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = featureIcons[index] ?? Sparkles;
              return <Link key={feature.slug} href={`/features/${feature.slug}`} className="group relative rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><Icon className="size-5" aria-hidden /></span><span className="text-xs font-black uppercase tracking-widest text-signal">Step {index + 1}</span></div><h3 className="mt-4 font-black text-primary">{feature.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">See how it works <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">9 free shipping tools</p><h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">Free freight calculators and shipping tools.</h2><p className="mt-4 leading-7 text-muted-foreground">Calculate CBM, container fit, chargeable weight, LCL freight and free-time charges, or look up container, port and U.S. tariff references without an account.</p></div><Link href="/tools" className="inline-flex min-h-11 items-center gap-1 font-bold text-primary">All tools <ArrowRight className="size-4" aria-hidden /></Link></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group flex min-h-56 flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Calculator className="size-7 text-signal" aria-hidden /><h3 className="mt-4 font-black text-primary">{tool.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{tool.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Open tool <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>
          ))}
          <div className="flex min-h-56 flex-col justify-center rounded-2xl bg-primary p-5 text-white"><ShieldCheck className="size-7" aria-hidden /><p className="mt-4 text-lg font-black">Transparent by design</p><p className="mt-2 text-sm leading-6 text-white/70">Inputs stay in the browser where possible, and every result shows the basis used.</p></div>
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">11 editable templates</p><h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">Follow the paperwork from quote to release.</h2><p className="mt-4 leading-7 text-muted-foreground">Open a browser form, calculate relevant totals, then download a polished PDF or editable XLSX and DOCX file.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {templateGroups.map((group, groupIndex) => (
              <section key={group.label} className="rounded-3xl border border-border bg-background p-5">
                <div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white"><FileSpreadsheet className="size-5" aria-hidden /></span><span className="text-xs font-black uppercase tracking-widest text-signal">0{groupIndex + 1}</span></div>
                <h3 className="mt-5 text-xl font-black text-primary">{group.label}</h3>
                <ul className="mt-4 divide-y divide-border">
                  {group.slugs.map((slug) => TEMPLATES.find((item) => item.slug === slug)).filter((item) => item !== undefined).map((template) => (
                    <li key={template.slug}><Link href={`/templates/${template.slug}`} className="group/link flex min-h-14 items-center justify-between gap-3 py-2 text-sm font-semibold text-primary"><span>{template.name}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover/link:translate-x-1" aria-hidden /></Link></li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2 text-[10px] font-black text-muted-foreground"><span className="rounded-full bg-white px-2 py-1">PDF</span><span className="rounded-full bg-white px-2 py-1">XLSX</span><span className="rounded-full bg-white px-2 py-1">DOCX</span></div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:py-24">
        <div><LibraryBig className="size-9 text-signal" aria-hidden /><p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-signal">Practical knowledge</p><h2 className="mt-3 text-3xl font-black tracking-tight text-primary">Know what every field means.</h2><p className="mt-4 leading-7 text-muted-foreground">Plain-language guides connect shipping concepts to the parsers, calculators and templates you can use next.</p><Button render={<Link href="/guides" />} variant="outline" size="lg" className="mt-6">Browse all guides</Button></div>
        <div className="grid gap-4 sm:grid-cols-2">{GUIDES.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><BookOpen className="size-6 text-primary" aria-hidden /><p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{guide.readMinutes} min guide</p><h3 className="mt-2 font-black text-primary">{guide.title}</h3><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Read guide <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>)}</div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-white shadow-[0_32px_80px_-44px_rgba(1,59,179,0.8)] sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">Built around real paperwork</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">See why GainingDocx exists and how the workflow fits together.</h2><p className="mt-4 max-w-xl text-white/70">Our About page gives a visual tour of the documents, checks, tools, templates and outputs behind Easy PaperWork.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button render={<Link href="/about" />} size="lg" className="h-12 bg-white px-6 text-primary hover:bg-white/90">Explore our approach <ArrowRight aria-hidden /></Button><Link href="/app/scan" className="inline-flex min-h-11 items-center justify-center font-bold text-white">Try one document</Link></div>
        </div>
      </section>
    </>
  );
}
