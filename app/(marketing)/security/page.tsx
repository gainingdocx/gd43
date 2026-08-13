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
    {/* Subprocessors and data handling.
        Written from what the code actually does — every entry below corresponds
        to a real call site — because a freight buyer's procurement review asks
        these three questions first and a vague answer ends the evaluation. */}
    <section id="subprocessors" className="mt-8 scroll-mt-24 rounded-3xl border border-amber/45 bg-white p-6">
      <h2 className="text-2xl font-extrabold text-brand-deep">Where your documents go</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
        Processing a freight document means sending it somewhere. This is the complete list of
        services that receive any part of your data, and what each one gets.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold text-brand-deep">Service</th>
              <th scope="col" className="px-4 py-3 font-bold text-brand-deep">Purpose</th>
              <th scope="col" className="px-4 py-3 font-bold text-brand-deep">What it receives</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              ["Cloudflare", "Application hosting, email intake and background queues", "Request metadata and inbound intake email. Cloudflare does not parse document contents."],
              ["OpenRouter", "Runs Gemma vision extraction and the configured OCR quality retry", "Document page images or PDFs and the text extracted from them"],
              ["Supabase", "Database, file storage and authentication", "Original files, extracted values, shipments, discrepancies, account records"],
              ["Paddle", "Subscription billing and tax", "Billing name, email and payment details. No document data."],
              ["Resend", "Transactional and result email", "Recipient address and message content. No document data unless a report is attached at your request."],
              ["PostHog / Sentry", "Product analytics and error monitoring", "Page and event metadata, error traces. Not document contents."],
            ].map(([name, purpose, receives]) => (
              <tr key={name} className="align-top">
                <td className="px-4 py-3 font-semibold text-brand-deep">{name}</td>
                <td className="px-4 py-3 leading-6 text-muted-foreground">{purpose}</td>
                <td className="px-4 py-3 leading-6 text-muted-foreground">{receives}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="font-extrabold text-brand-deep">Are my documents used to train AI models?</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <strong className="text-brand-deep">GainingDocx does not train any model on your documents.</strong>{" "}
            There is no training pipeline in the product; your files are read once to extract values and are
            never added to a training set. Extraction runs as inference on the third-party model providers
            named above. We do not control their internal policies, so if your procurement process requires a
            written no-training commitment covering the full chain, ask us and we will confirm the current
            provider terms in writing rather than paraphrase them here.
          </p>
        </div>
        <div>
          <h3 className="font-extrabold text-brand-deep">Retention and deletion</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Documents, extracted values and shipment records are kept until you delete them — there is no
            automatic expiry, because a freight file is often needed months later for a claim or an audit.
            Deleting a document removes its stored file and extracted values. Deleting your account removes
            stored files and every record that hangs off it. Backups roll off on the infrastructure
            provider&rsquo;s own schedule after that.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface-alt p-5">
        <p className="font-bold text-brand-deep">Data processing agreement</p>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          A DPA, the current subprocessor list with regions, and answers to a vendor security questionnaire
          are available on request for organisations evaluating GainingDocx. This is a product in public
          beta: we will tell you plainly what is implemented and what is not rather than returning a
          certification we do not hold.
        </p>
        <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center font-bold text-primary underline">
          Request a DPA or security review
        </Link>
      </div>
    </section>

    <section className="mt-8 grid gap-6 rounded-3xl bg-primary p-6 text-white lg:grid-cols-2 lg:p-8"><div><h2 className="text-2xl font-extrabold">Responsible reporting</h2><p className="mt-3 text-sm leading-7 text-white/75">If you believe you found a security issue, do not submit document contents, credentials or exploit details through the feedback widget. Contact support with a minimal description and request a secure follow-up channel.</p><Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-bold text-[var(--amber)] underline">Contact security support</Link></div><div><h2 className="text-2xl font-extrabold">Vendor review</h2><p className="mt-3 text-sm leading-7 text-white/75">Organizations evaluating GainingDocx can request current architecture, subprocessors, retention, access-control and incident-response information. Formal certifications are not implied unless explicitly supplied during review.</p></div></section>
  </main>;
}
