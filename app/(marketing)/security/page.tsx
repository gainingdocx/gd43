import type { Metadata } from "next";
import Link from "next/link";
import { Database, KeyRound, LockKeyhole, ScanEye, ShieldCheck, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "GainingDocx Security Center",
  description: "Review access controls, document handling, account security, auditability and responsible security reporting for GainingDocx.",
  alternates: { canonical: "/security" },
};

const controls = [
  { icon: LockKeyhole, title: "Private-by-default records", text: "Saved documents, shipments and operational records are access-controlled. Database row-level policies restrict authenticated access to the owner or authorized shipment participants." },
  { icon: KeyRound, title: "Account protection", text: "Authentication supports secure sessions, password recovery and multi-factor authentication. Sensitive service credentials remain server-side." },
  { icon: UserCheck, title: "Role-based review", text: "Shipment roles separate owners, editors, reviewers and approvers. Optional approval gates can prevent consolidated export until an authorized reviewer signs off." },
  { icon: ScanEye, title: "Activity trail", text: "Parsing, corrections, matching, comments, approvals and exports create operational events so teams can reconstruct who did what and when." },
  { icon: Database, title: "Data control", text: "Account holders can export or delete account data. Retention and processing details are documented in the Privacy Policy." },
  { icon: ShieldCheck, title: "Bounded automation", text: "Validation rules report evidence and limitations. The service does not claim to authenticate documents or replace regulated professional decisions." },
];

export default function SecurityPage() {
  return <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
    <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Security center</p>
    <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-primary sm:text-5xl">Security controls for sensitive freight documents.</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">This page describes controls implemented in the current public beta. It is a product overview, not a certification or audit report.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{controls.map(({ icon: Icon, title, text }) => <section key={title} className="rounded-3xl border border-amber/45 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span><h2 className="mt-5 text-lg font-extrabold text-brand-deep">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></section>)}</div>
    <section className="mt-8 grid gap-6 rounded-3xl bg-primary p-6 text-white lg:grid-cols-2 lg:p-8"><div><h2 className="text-2xl font-extrabold">Responsible reporting</h2><p className="mt-3 text-sm leading-7 text-white/75">If you believe you found a security issue, do not submit document contents, credentials or exploit details through the feedback widget. Contact support with a minimal description and request a secure follow-up channel.</p><Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-bold text-[var(--amber)] underline">Contact security support</Link></div><div><h2 className="text-2xl font-extrabold">Vendor review</h2><p className="mt-3 text-sm leading-7 text-white/75">Organizations evaluating GainingDocx can request current architecture, subprocessors, retention, access-control and incident-response information. Formal certifications are not implied unless explicitly supplied during review.</p></div></section>
  </main>;
}
