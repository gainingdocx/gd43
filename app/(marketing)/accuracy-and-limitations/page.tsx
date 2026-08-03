import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Languages, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Accuracy, Validation Scope and Product Limitations",
  description: "Understand what GainingDocx extracts and validates, how results should be reviewed, and the limits of document, dangerous-goods and standards checks.",
  alternates: { canonical: "/accuracy-and-limitations" },
};

const canCheck = [
  "Printed shipment references, parties, ports, dates, container numbers, packages, weights, values and charge lines",
  "ISO 6346 container check digits, IMO number checks and UN/LOCODE normalization where a usable source value is present",
  "Arithmetic, totals, date order and configured cross-document tolerances",
  "Conflicting values across connected documents, with severity and reviewer resolution state",
];

const cannotDecide = [
  "Whether a document is authentic, legally effective, negotiable or issued by an authorized party",
  "Customs classification, sanctions, export-control, tax, banking, insurance or legal compliance",
  "Cargo condition, container suitability, stowage, segregation, carrier acceptance or physical events not evidenced by supplied data",
  "Whether a dangerous-goods shipment complies with every applicable IMDG, national, carrier or port requirement",
];

export default function AccuracyPage() {
  return <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
    <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Accuracy and limitations</p>
    <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-primary sm:text-5xl">AI reads. Deterministic rules check. People approve.</h1>
    <p className="mt-6 text-lg leading-8 text-muted-foreground">No document-understanding system is error-free. GainingDocx is designed to make evidence and uncertainty reviewable instead of hiding them behind a single confidence score.</p>

    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-amber/45 bg-white p-6"><CheckCircle2 className="size-7 text-success" aria-hidden /><h2 className="mt-4 text-2xl font-extrabold text-brand-deep">What the system can check</h2><ul className="mt-5 space-y-3">{canCheck.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />{item}</li>)}</ul></section>
      <section className="rounded-3xl border border-amber/45 bg-white p-6"><ShieldAlert className="size-7 text-destructive" aria-hidden /><h2 className="mt-4 text-2xl font-extrabold text-brand-deep">What it cannot decide</h2><ul className="mt-5 space-y-3">{cannotDecide.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />{item}</li>)}</ul></section>
    </div>

    <section className="mt-8 rounded-3xl border border-[var(--amber)]/70 bg-[var(--surface-alt)] p-6"><h2 className="text-2xl font-extrabold text-brand-deep">Dangerous-goods scope</h2><p className="mt-3 leading-7 text-muted-foreground">For declared dangerous-goods rows, GainingDocx checks the printed UN-number format, presence of hazard class, packing-group representation where printed, and consistency of declared values across supported documents. It can extract proper shipping name, subsidiary risk, marine-pollutant marking, flash point and emergency contact when present. It does not look up every substance-specific rule, packing instruction, quantity limit, segregation requirement, stowage category or carrier restriction, and it does not approve an IMDG declaration.</p><p className="mt-3 text-sm font-semibold text-primary">A trained and authorized dangerous-goods professional remains responsible for classification, declaration, packaging, marking, documentation and acceptance.</p></section>

    <section className="mt-8 rounded-3xl border border-amber/45 bg-white p-6"><div className="flex items-start gap-3"><Languages className="mt-1 size-6 shrink-0 text-primary" aria-hidden /><div><h2 className="text-2xl font-extrabold text-brand-deep">Multilingual documents</h2><p className="mt-3 leading-7 text-muted-foreground">The parser can read multilingual source text where the selected model supports it. Original legally significant values are preserved in the reviewed record. Translation assistance is kept separate and must not silently replace names, references, addresses, clauses or declarations.</p></div></div></section>

    <section className="mt-8 space-y-4 rounded-3xl bg-primary p-6 text-white"><h2 className="text-2xl font-extrabold">How to use results safely</h2><ol className="grid gap-3 text-sm leading-6 text-white/80 sm:grid-cols-2"><li>1. Compare critical values with the highlighted source.</li><li>2. Correct extraction errors before matching or export.</li><li>3. Resolve each material discrepancy with an accountable reviewer.</li><li>4. Confirm governing contracts, tariffs and regulations outside the system.</li></ol><p className="text-sm text-white/70">Found a repeatable error? Send the source type and expected behavior through the <Link href="/contact" className="font-bold text-white underline">support channel</Link> without including sensitive data in an unsecured message.</p></section>
  </main>;
}
