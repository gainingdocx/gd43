import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: {
    absolute: "AI Bill of Lading Parser & Shipping Document Data Extraction",
  },
  description:
    "Upload a Bill of Lading, Commercial Invoice or Packing List. GainingDocx extracts every field with AI, validates it with deterministic maritime rules, and exports to Excel, CSV or JSON.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: Upload,
    title: "1. Upload",
    text: "Snap a photo or drop a PDF of your shipping document — straight from your phone at the port or your desk.",
  },
  {
    icon: ScanLine,
    title: "2. Review",
    text: "AI extracts every field. Deterministic checks flag anything suspicious — check digits, weights, dates — so you review only what matters.",
  },
  {
    icon: FileSpreadsheet,
    title: "3. Export",
    text: "Send clean data to Excel, CSV or JSON, or generate the counterpart document. Three taps, start to finish.",
  },
];

const features = [
  {
    icon: FileText,
    title: "Built for sea-cargo documents",
    text: "Bills of Lading, Commercial Invoices, Packing Lists and other ocean shipping paperwork — the parser knows the layouts, clauses and field names.",
  },
  {
    icon: ShieldCheck,
    title: "Deterministic validation",
    text: "ISO 6346 container check digits, IMO number checksums, UN/LOCODE port lookups, weight and date sanity checks — computed in code, never guessed by AI.",
  },
  {
    icon: GitCompareArrows,
    title: "Cross-document checks",
    text: "Compare the B/L against the invoice and packing list. Mismatched consignees, containers, ports or totals surface as red and amber discrepancies.",
  },
  {
    icon: FileSpreadsheet,
    title: "Clean exports",
    text: "One-click Excel workbooks with summary, container and line-item sheets. CSV and JSON for your TMS or ERP. Branded PDF summary reports.",
  },
  {
    icon: FilePlus2,
    title: "Generate counterparts",
    text: "Turn a Commercial Invoice into a Packing List, or either into Shipping Instructions — mapped field by field, consistent by construction.",
  },
  {
    icon: Smartphone,
    title: "Works where you work",
    text: "Mobile-first and installable as an app. Capture documents with your camera, review with one thumb, export before you leave the terminal.",
  },
];

const heroChecks = [
  "Container check digits verified",
  "Weights cross-checked",
  "No spreadsheet retyping",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-background to-secondary/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              AI Bill of Lading Parser &amp; Shipping Document Data Extraction
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Stop retyping shipping documents. GainingDocx reads Bills of
              Lading, Commercial Invoices and Packing Lists, validates them
              with maritime rules, and hands you clean, structured data.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                render={<Link href="/app" />}
                size="lg"
                className="bg-signal text-signal-foreground hover:bg-signal/90"
              >
                Parse your first document
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Button>
              <Button render={<Link href="/pricing" />} size="lg" variant="outline">
                See pricing
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {heroChecks.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CircleCheck className="size-4 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Dropzone placeholder — becomes functional in the Scan milestone */}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-input bg-background px-6 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-signal">
                <Upload className="size-7" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-primary">
                  Drop your Bill of Lading here
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, JPG or PNG · up to 15 pages · first document free, no
                  sign-up
                </p>
              </div>
              <Button
                render={<Link href="/app" />}
                size="lg"
                variant="secondary"
              >
                Choose a file
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-primary">
          Upload → Review → Export
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          A parsed, validated, exported document in three taps — about 12
          minutes of manual data entry saved every time.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-primary">
            The AI extracts. The rules decide.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Every verdict you see — check digit, weight total, date window — is
            computed deterministically in code. The AI only reads the page; it
            never does the math.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-signal">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-primary-foreground">
            Your next Bill of Lading takes three taps, not thirty minutes
          </h2>
          <p className="max-w-xl text-primary-foreground/70">
            Parse your first document free — no account needed. Sign up only
            when you want to keep it.
          </p>
          <Button
            render={<Link href="/app" />}
            size="lg"
            className="bg-signal text-signal-foreground hover:bg-signal/90"
          >
            Parse a document now
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      </section>
    </>
  );
}
