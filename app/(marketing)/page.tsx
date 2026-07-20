import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Camera,
  Check,
  ChevronRight,
  CircleCheck,
  Container,
  FileCheck2,
  FileInput,
  FileOutput,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  LibraryBig,
  LockKeyhole,
  ScanLine,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: {
    absolute: "AI Bill of Lading Parser & Shipping Document Data Extraction",
  },
  description:
    "Upload a Bill of Lading, Commercial Invoice or Packing List. Extract every field, validate maritime data, compare documents, and export clean results.",
  alternates: { canonical: "/" },
};

const productLinks = [
  { href: "/app/scan", label: "AI parser", icon: ScanLine },
  { href: "/tools", label: "Free tools", icon: Calculator },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/guides", label: "Guides", icon: LibraryBig },
];

const documents = [
  {
    name: "Bill of Lading",
    eyebrow: "Parse & validate",
    text: "Capture parties, vessel, voyage, ports, containers, cargo, dates, freight terms and clauses.",
    href: "/bill-of-lading-parser",
    icon: Ship,
  },
  {
    name: "Commercial Invoice",
    eyebrow: "Extract line items",
    text: "Structure sellers, buyers, invoice references, Incoterms, currency, charges and item totals.",
    href: "/commercial-invoice-parser",
    icon: FileSpreadsheet,
  },
  {
    name: "Packing List",
    eyebrow: "Check cargo totals",
    text: "Read carton counts, dimensions, net and gross weights, CBM, marks and container references.",
    href: "/packing-list-parser",
    icon: Container,
  },
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Maritime validation",
    text: "ISO 6346 container digits, IMO checksums, ports, dates, weights and package totals are checked in code.",
  },
  {
    icon: GitCompareArrows,
    title: "Shipment Check",
    text: "Compare the B/L, invoice and packing list. Party, port, container and total mismatches become clear actions.",
  },
  {
    icon: Search,
    title: "Shipment search",
    text: "Find a record by B/L, invoice, container, party, vessel or port instead of hunting through folders.",
  },
  {
    icon: FileOutput,
    title: "Exports that are ready to use",
    text: "Download structured Excel, CSV, JSON and branded PDF summaries for handoff to your TMS or ERP.",
  },
  {
    icon: FileInput,
    title: "Generate counterpart documents",
    text: "Turn parsed data into an editable Packing List, Commercial Invoice or Shipping Instructions draft.",
  },
  {
    icon: LockKeyhole,
    title: "Private by design",
    text: "Images are compressed before upload, document storage is private, and account data can be exported or deleted.",
  },
];

const freeResources = [
  {
    icon: Calculator,
    label: "5 free calculators",
    title: "Solve shipping checks instantly",
    text: "CBM, container load, container number, port code and chargeable weight tools — no account required.",
    href: "/tools",
    cta: "Explore free tools",
  },
  {
    icon: FileText,
    label: "6 fillable documents",
    title: "Build clean shipping paperwork",
    text: "Use browser-based forms with automatic cargo totals and download PDF, XLSX or DOCX templates.",
    href: "/templates",
    cta: "Browse templates",
  },
  {
    icon: LibraryBig,
    label: "Practical shipping guides",
    title: "Understand every field",
    text: "Learn how B/Ls, invoices, packing lists, container numbers and shipment checks work.",
    href: "/guides",
    cta: "Read the guides",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(1,59,179,0.14),transparent_31%),radial-gradient(circle_at_8%_82%,rgba(212,5,5,0.06),transparent_25%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pb-24">
          <nav aria-label="Product shortcuts" className="mb-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {productLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <Icon className="size-4 text-signal" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="size-3.5 text-signal" aria-hidden />
                Shipping paperwork, finally structured
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-primary sm:text-5xl lg:text-[3.65rem]">
                From shipping document to trusted data in minutes.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                GainingDocx reads Bills of Lading, Commercial Invoices and Packing Lists, validates maritime details, compares the shipment, and gives your team clean exports.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  render={<Link href="/app/scan" />}
                  size="lg"
                  className="h-12 bg-signal px-6 text-signal-foreground hover:bg-signal/90"
                >
                  <Camera aria-hidden /> Upload a document
                  <ArrowRight data-icon="inline-end" aria-hidden />
                </Button>
                <Button render={<Link href="#capabilities" />} size="lg" variant="outline" className="h-12 px-6">
                  See everything it does
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
                {["First document free", "No sign-up to try", "Mobile camera ready"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CircleCheck className="size-4 text-primary" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.25rem] bg-secondary" />
              <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_30px_90px_-42px_rgba(1,59,179,0.65)]">
                <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="" width={36} height={36} unoptimized className="size-9 rounded-full bg-white" />
                    <div>
                      <p className="text-xs text-white/65">Document workspace</p>
                      <p className="text-sm font-bold">B/L MSCU-240718</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Parsed</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[.9fr_1.1fr]">
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-background px-5 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Upload className="size-6" aria-hidden />
                    </span>
                    <p className="mt-4 text-sm font-bold text-primary">Photo captured</p>
                    <p className="mt-1 text-xs text-muted-foreground">1 clear page · compressed locally</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      ["Container", "MSCU 663987 0"],
                      ["Vessel", "MV Ocean Pioneer"],
                      ["Route", "Shanghai → Rotterdam"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border px-3.5 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-0.5 text-sm font-bold text-primary">{value}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-3 text-sm font-bold text-primary">
                      <FileCheck2 className="size-4" aria-hidden /> All deterministic checks passed
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-primary shadow-xl sm:-left-7">
                <Check className="size-4 text-signal" aria-hidden /> Ready for Excel
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-primary text-white">
        <div className="mx-auto grid max-w-6xl divide-y divide-white/15 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {[
            ["01", "Upload", "Camera or page images"],
            ["02", "Review", "AI extraction + rule checks"],
            ["03", "Use", "Compare, export or generate"],
          ].map(([number, title, text]) => (
            <div key={number} className="flex items-center gap-4 py-5 sm:px-6 sm:first:pl-0">
              <span className="text-2xl font-black text-white/30">{number}</span>
              <div><p className="font-bold">{title}</p><p className="text-xs text-white/65">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Purpose-built document intelligence</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">One workspace for the documents that define a shipment.</h2>
          <p className="mt-4 text-muted-foreground">Each parser understands the document’s own structure, while every result feeds the same shipment record.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {documents.map(({ name, eyebrow, text, href, icon: Icon }, index) => (
            <Link key={name} href={href} className="group relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute right-5 top-4 text-6xl font-black text-secondary">0{index + 1}</span>
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-white"><Icon className="size-6" aria-hidden /></span>
              <p className="relative mt-6 text-xs font-bold uppercase tracking-widest text-signal">{eyebrow}</p>
              <h3 className="relative mt-2 text-xl font-black text-primary">{name}</h3>
              <p className="relative mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              <span className="relative mt-6 flex items-center gap-1 text-sm font-bold text-primary">See parser <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section id="capabilities" className="border-y border-border bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Complete workflow</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">More than OCR. A practical shipment workspace.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Extraction is only the start. GainingDocx helps the user decide what is trustworthy, resolve inconsistencies, and move the data onward.</p>
              <Button render={<Link href="/app/scan" />} size="lg" className="mt-7 bg-signal text-white hover:bg-signal/90">Open the scanner <ArrowRight aria-hidden /></Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-border bg-background p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span>
                  <h3 className="mt-4 font-black text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Useful before you upload</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">Free tools, templates and know-how.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">The public toolkit covers the day-to-day jobs around shipping documents, even when you do not need AI parsing.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {freeResources.map(({ icon: Icon, label, title, text, href, cta }) => (
            <article key={href} className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span>
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{label}</span>
              </div>
              <h3 className="mt-6 text-xl font-black text-primary">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{text}</p>
              <Link href={href} className="mt-6 flex min-h-11 items-center justify-between border-t border-border pt-4 text-sm font-bold text-primary">{cta}<ArrowRight className="size-4 text-signal" aria-hidden /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary text-white shadow-[0_32px_80px_-44px_rgba(1,59,179,0.8)]">
          <div className="grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">Ready for the next shipment?</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Stop retyping the same shipping data into the next system.</h2>
              <p className="mt-4 max-w-xl text-white/70">Upload one document free, see the extracted fields and checks, then decide whether it belongs in your workflow.</p>
            </div>
            <Button render={<Link href="/app/scan" />} size="lg" className="h-12 bg-signal px-6 text-white hover:bg-signal/90">Parse a document now <ArrowRight aria-hidden /></Button>
          </div>
        </div>
      </section>
    </>
  );
}
