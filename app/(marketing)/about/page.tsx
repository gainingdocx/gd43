import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Database,
  FileOutput,
  FileSearch,
  FileSpreadsheet,
  GitCompareArrows,
  LibraryBig,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FEATURES } from "@/content/features";
import { GUIDES } from "@/content/guides";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { aboutPageLd, breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: { absolute: "About GainingDocx | Shipping Document Automation" },
  description:
    "Meet GainingDocx: AI shipping document extraction, deterministic validation, shipment matching, free calculators, practical guides and editable templates.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About GainingDocx — Freight Document Manager",
    description: "A visual tour of the parsers, checks, tools, templates and principles behind GainingDocx.",
    url: "/about",
    type: "website",
  },
};

const journey = [
  { icon: ScanLine, title: "Read", text: "Upload a PDF, image or phone photo. The parser identifies the document and structures its fields." },
  { icon: ShieldCheck, title: "Verify", text: "Deterministic code checks containers, IMO numbers, dates, ports, weights, currency and totals." },
  { icon: GitCompareArrows, title: "Connect", text: "Related records become a shipment. Differences across the B/L, invoice, packing list, PO and receipt surface clearly." },
  { icon: FileOutput, title: "Move forward", text: "Correct the result, export clean data, search it later or generate the next document." },
];

const audiences = [
  "Freight forwarders reviewing carrier and customer paperwork",
  "Exporters preparing invoices, packing lists and instructions",
  "Importers reconciling arrivals, freight charges and receipts",
  "Operations and finance teams moving shipment data into other systems",
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={[aboutPageLd(), breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])]} />

      <section className="relative overflow-hidden border-b border-border bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(1,59,179,0.14),transparent_30rem),radial-gradient(circle_at_12%_88%,rgba(244,196,0,0.14),transparent_25rem)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_.8fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">About GainingDocx</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.04em] text-primary sm:text-5xl">Shipping paperwork should create momentum, not more paperwork.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">GainingDocx is a document workspace for shipping teams. It combines AI extraction with transparent rule-based checks, so people can move from an uploaded document to reviewed, reusable data with less retyping and more confidence.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button render={<Link href="/app/scan" />} size="lg" className="bg-signal text-white hover:bg-signal/90">Try the document parser <ArrowRight aria-hidden /></Button><Button render={<Link href="#inside" />} size="lg" variant="outline">See what is inside</Button></div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-border bg-background p-4 shadow-xl">
            {[
              [PARSER_PAGES.length, "document parsers", FileSearch],
              [FEATURES.length, "workflow features", Sparkles],
              [TOOLS.length, "free tools", Calculator],
              [TEMPLATES.length, "templates", FileSpreadsheet],
            ].map(([value, label, Icon]) => {
              const IconComponent = Icon as typeof FileSearch;
              return <div key={String(label)} className="rounded-2xl bg-white p-5"><IconComponent className="size-6 text-signal" aria-hidden /><p className="mt-4 text-3xl font-extrabold text-brand-deep">{String(value).padStart(2, "0")}</p><p className="text-sm font-semibold text-muted-foreground">{String(label)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section id="inside" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">The information journey</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">From page image to usable shipment record.</h2><p className="mt-4 leading-7 text-muted-foreground">The workflow keeps the human reviewer in control while automating the mechanical work around them.</p></div>
        <ol className="relative mt-12 grid gap-5 lg:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-border lg:block" aria-hidden />
          {journey.map(({ icon: Icon, title, text }, index) => <li key={title} className="relative rounded-3xl border border-amber/45 bg-white p-6 shadow-sm"><span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-white ring-8 ring-background"><Icon className="size-6" aria-hidden /></span><p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-signal">0{index + 1}</p><h3 className="mt-2 text-xl font-extrabold text-brand-deep">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></li>)}
        </ol>
      </section>

      <section className="section-edge border-t border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">What is inside</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">A connected toolkit, not a single-purpose upload box.</h2><p className="mt-4 leading-7 text-muted-foreground">Each public resource explains its scope and links into the next useful step. That makes the site useful whether you need automation, a quick calculation, a blank form or a clear explanation.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: FileSearch, title: `${PARSER_PAGES.length} dedicated parsers`, text: "Bills of Lading, invoices, packing lists, waybills, notices, bookings, purchase orders, freight invoices and goods receipts.", href: "/#find" },
              { icon: ShieldCheck, title: `${FEATURES.length} workflow capabilities`, text: "Extraction, maritime validation, record matching, search, multi-format export and document generation.", href: "/features" },
              { icon: Calculator, title: `${TOOLS.length} transparent tools`, text: "Volume, container fit, ISO 6346, UN/LOCODE, chargeable weight, LCL W/M and free-time calculations.", href: "/tools" },
              { icon: FileSpreadsheet, title: `${TEMPLATES.length} editable templates`, text: "Browser forms plus PDF, Excel and Word downloads covering planning, transport and release.", href: "/templates" },
              { icon: LibraryBig, title: `${GUIDES.length} field guides`, text: "Practical explanations that connect document concepts to the exact tool or workflow that applies.", href: "/guides" },
              { icon: Database, title: "Structured outputs", text: "Reviewed data can move to Excel, CSV, JSON and PDF instead of being trapped inside a scan.", href: "/features/shipping-data-export" },
            ].map(({ icon: Icon, title, text, href }) => <Link key={title} href={href} className="group rounded-2xl border border-amber/45 bg-background p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"><Icon className="size-6 text-primary" aria-hidden /><h3 className="mt-4 font-extrabold text-brand-deep">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Explore <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="rounded-[2rem] bg-primary p-7 text-white sm:p-10"><Users className="size-9" aria-hidden /><p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-white/60">Who it is for</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">People who need the facts inside a shipment document.</h2><ul className="mt-7 space-y-4">{audiences.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-white/80"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--amber)]" aria-hidden />{item}</li>)}</ul></div>
        <div className="px-0 py-3 sm:px-4"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">How we build trust</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep">AI reads. Code checks. People decide.</h2><div className="mt-7 space-y-5">{[
          ["Visible checks", "Calculated fields and validation outcomes are shown to the reviewer instead of hidden behind a confidence score."],
          ["Editable results", "Extracted data can be corrected before it becomes an export, comparison or generated document."],
          ["Clear boundaries", "Calculators state their assumptions and templates include authority notes where carrier, customs or legal requirements may differ."],
          ["Useful privacy controls", "Page images are compressed locally, document storage is private, and account data can be exported or deleted."],
        ].map(([title, text]) => <div key={title} className="border-l-4 border-[var(--amber)] pl-5"><h3 className="font-extrabold text-brand-deep">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div>
      </section>

      <section className="section-edge border-t border-border bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Product and operator status</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep">A public-beta product, described without inflated claims.</h2></div>
          <div className="space-y-3 text-sm leading-7 text-muted-foreground"><p>GainingDocx is an independently developed freight-document software product. Core parsing, deterministic checks, shipment matching, reviewer workflows and exports are available in public beta. Business identity, contracting and data-processing details are supplied during commercial onboarding.</p><p>The service is not a carrier, customs broker, freight forwarder, bank, insurer, certification body or legally transferable electronic Bill of Lading platform. Users remain responsible for confirming operational and regulated decisions.</p><div className="flex flex-wrap gap-4"><Link href="/trust" className="font-bold text-primary underline">Visit the Trust Center</Link><Link href="/accuracy-and-limitations" className="font-bold text-primary underline">Read accuracy and limitations</Link></div></div>
        </div>
      </section>

      <section className="border-t border-border bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Freight Document Manager starts here</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">Bring one shipping document. Leave with structured data.</h2><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Try one complete document daily as a guest, review every field, then export the result when it is ready.</p><Button render={<Link href="/app/scan" />} size="lg" className="mt-7 bg-signal text-white hover:bg-signal/90">Parse a document now <ArrowRight aria-hidden /></Button></div>
      </section>
    </>
  );
}
