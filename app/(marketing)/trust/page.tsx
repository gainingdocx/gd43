import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, LockKeyhole, Scale, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "GainingDocx Trust Center",
  description: "Review GainingDocx security controls, accuracy boundaries, standards alignment and operational limitations.",
  alternates: { canonical: "/trust" },
};

const cards = [
  { href: "/security", icon: LockKeyhole, title: "Security center", text: "How access, private document storage, account controls and incident reporting work." },
  { href: "/accuracy-and-limitations", icon: Scale, title: "Accuracy and limitations", text: "What AI extraction and deterministic checks can detect, what still needs human review, and how beta features are described." },
  { href: "/standards", icon: BookOpenCheck, title: "Standards alignment", text: "How the internal model relates to DCSA, UN/CEFACT, FIATA, ISO 6346, UN/LOCODE and Incoterms representations." },
  { href: "/privacy", icon: ShieldCheck, title: "Privacy", text: "What data is processed, why it is used, retention choices and account export or deletion controls." },
];

export default function TrustPage() {
  return <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
    <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Trust center</p>
    <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-primary sm:text-5xl">Know what the system checks - and where people stay responsible.</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">GainingDocx is a human-in-the-loop freight document workspace. AI reads source documents; deterministic code performs stated checks; authorized users review, correct and approve the result.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2">{cards.map(({ href, icon: Icon, title, text }) => <Link key={href} href={href} className="group rounded-3xl border border-amber/45 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"><span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="size-6" aria-hidden /></span><h2 className="mt-5 text-xl font-extrabold text-brand-deep">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Read details <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span></Link>)}</div>
    <section className="mt-10 rounded-3xl border border-[var(--amber)]/60 bg-[var(--surface-alt)] p-6"><h2 className="text-xl font-extrabold text-brand-deep">Current product status: public beta</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Core parsing, validation, shipment matching, reviewer workflows and exports are available. Rules continue to expand by document type and trade lane. Operational decisions must be confirmed against the original document, governing contract, carrier instructions and applicable law.</p></section>
  </main>;
}
