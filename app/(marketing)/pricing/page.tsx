import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleCheck, Minus, ShieldCheck, UsersRound, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/paddle/checkout-button";
import { checkoutEnabled, PADDLE_PRICES } from "@/lib/paddle/config";

export const metadata: Metadata = {
  title: "Pricing — Free, Pro and Team",
  description: "Monthly GainingDocx plans for individuals and freight operations teams. Extract, validate, match, review and integrate shipping documents.",
  alternates: { canonical: "/pricing" },
};

const plans = [
  {
    id: "free", name: "Free", price: "$0", tagline: "Explore the complete document workflow.", icon: CircleCheck, popular: false,
    features: [
      "20 saved documents each month", "1 guest document per day before sign-in", "Private email-in address with automatic result replies", "Up to 15 pages per document",
      "AI extraction for 18+ freight document types", "Deterministic maritime and trade validation", "Editable review with confidence and source evidence",
      "Shipment document matching and discrepancy detection", "Excel, CSV, JSON and PDF exports", "Free-plan watermark on generated documents",
      "Saved history, search and shipment dashboard", "Shipping calculators, guides and templates", "Community email support",
    ],
  },
  {
    id: "pro", name: "Pro", price: "$31", tagline: "High-volume automation for one operator.", icon: Zap, popular: true,
    features: [
      "Everything in Free", "500 documents each month", "Watermark-free exports and generated documents", "Counterpart document generation: CI, packing list and shipping instructions",
      "Unlimited Shipment Checks and cross-document validation", "Advanced charge, deadline and dangerous-goods checks", "Public parsing API and signed outbound webhooks",
      "Direct TMS/ERP push connectors", "Configurable workflow requirements", "Priority processing and priority support", "Self-service billing, invoices and cancellation",
    ],
  },
  {
    id: "team", name: "Team", price: "$94", tagline: "A shared freight-document operations workspace.", icon: UsersRound, popular: false,
    features: [
      "Everything in Pro", "2,000 shared documents each month", "5 seats included", "Central workspace roster and automatic shipment access",
      "Owner, editor, reviewer and approver responsibilities", "Document assignment and review queues", "Correction requests, threaded operational comments and approval history",
      "Export approval gates and separation of duties", "Shared charge alerts and deadline visibility", "Team-wide API, webhooks and ERP/TMS connections",
      "Operational event trail and delivery monitoring", "Centralized billing for the workspace", "Priority team support",
    ],
  },
] as const;

const comparison = [
  ["Monthly documents", "20", "500", "2,000 shared"],
  ["Included users", "1", "1", "5"],
  ["AI extraction + validation", "Included", "Included", "Included"],
  ["Email-in document ingestion", "Included", "Included", "Included"],
  ["Shipment matching", "Included", "Unlimited", "Unlimited"],
  ["Watermark-free output", "—", "Included", "Included"],
  ["Document generation", "Watermarked", "Included", "Included"],
  ["API, webhooks and ERP/TMS push", "—", "Included", "Team-wide"],
  ["API rate limit", "—", "120 req/min", "300 req/min"],
  ["Cost per included document", "—", "$0.062", "$0.047"],
  ["Overage beyond the allowance", "—", "$0.04 / doc", "$0.03 / doc"],
  ["Shared shipment workspace", "—", "—", "Included"],
  ["Roles, assignments and comments", "—", "—", "Included"],
  ["Export approval gates", "—", "—", "Included"],
  ["Support", "Community", "Priority", "Priority team"],
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Simple monthly billing</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">From one document to a shared operations desk</h1>
        <p className="mt-5 text-lg text-muted-foreground">Every plan includes extraction, review and validation. Upgrade for volume, automation and controlled team workflows. No annual contracts.</p>
        <p className="mt-3 text-sm text-muted-foreground">Prices are USD per month. Taxes are calculated by Paddle at checkout. Cancel anytime.</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return <article key={plan.id} className={`relative flex flex-col rounded-3xl bg-card p-7 ${plan.popular ? "border-2 border-signal shadow-lg" : "border border-border"}`}>
            {plan.popular && <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 text-xs font-bold text-signal-foreground">Most popular</span>}
            <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span><h2 className="text-2xl font-extrabold text-brand-deep">{plan.name}</h2></div>
            <div className="mt-6 flex items-end gap-2"><span className="text-5xl font-extrabold tracking-tight text-brand-deep">{plan.price}</span><span className="pb-1 text-sm text-muted-foreground">USD / month</span></div>
            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{plan.tagline}</p>
            <div className="mt-6">
              {plan.id === "free" ? <Button render={<Link href="/auth/sign-up" />} variant="outline" size="lg" className="w-full">Start free</Button>
                : checkoutEnabled ? <CheckoutButton priceId={plan.id === "pro" ? PADDLE_PRICES.proMonthly : PADDLE_PRICES.teamMonthly} plan={plan.id} size="lg" className={`w-full ${plan.popular ? "bg-signal text-signal-foreground hover:bg-signal/90" : ""}`}>Choose {plan.name} — {plan.price}/mo</CheckoutButton>
                : <Button render={<Link href="/contact" />} size="lg" variant={plan.popular ? "default" : "outline"} className="w-full">{checkoutEnabled ? `Choose ${plan.name}` : `Join ${plan.name} waitlist`}</Button>}
            </div>
            <ul className="mt-7 space-y-3 border-t border-border pt-6 text-sm">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /><span>{feature}</span></li>)}</ul>
          </article>;
        })}
      </div>

      <section className="mt-16 overflow-hidden rounded-3xl border border-amber/45 bg-card">
        <div className="border-b border-border p-6 sm:p-8"><h2 className="text-2xl font-extrabold text-brand-deep">Compare plans</h2><p className="mt-2 text-sm text-muted-foreground">Clear limits and capabilities, with no annual-plan pricing.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-secondary"><tr><th className="p-4 sm:p-5">Capability</th><th className="p-4 sm:p-5">Free</th><th className="p-4 sm:p-5">Pro</th><th className="p-4 sm:p-5">Team</th></tr></thead><tbody className="divide-y divide-border">{comparison.map(([feature, free, pro, team]) => <tr key={feature}><th className="p-4 font-semibold sm:p-5">{feature}</th>{[free, pro, team].map((value, index) => <td key={`${feature}-${index}`} className="p-4 sm:p-5">{value === "—" ? <Minus className="size-4 text-muted-foreground" aria-label="Not included" /> : value}</td>)}</tr>)}</tbody></table></div>
      </section>

      {/* API usage. Kept on the pricing page rather than only in the developer
          docs because volume buyers compare cost per document before they ever
          read a reference. */}
      <section className="mt-14" aria-labelledby="api-pricing-title">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal">API and volume</p>
        <h2 id="api-pricing-title" className="mt-3 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">
          Pay for documents, not for access
        </h2>
        <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">
          The API is included with every paid plan — there is no separate platform fee, no annual
          commitment and no minimum seat count. A document costs the same whether it arrives by
          upload, by email or through <Link href="/developers" className="font-bold text-primary hover:underline">the API</Link>,
          because splitting that into two prices only makes a bill harder to predict.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Pro", price: "$31", docs: "500 documents", per: "$0.062 per document",
              rate: "120 requests / minute", over: "$0.04 per extra document",
              note: "One operator running an automated pipeline.",
            },
            {
              name: "Team", price: "$94", docs: "2,000 documents", per: "$0.047 per document",
              rate: "300 requests / minute", over: "$0.03 per extra document",
              note: "A shared operation with five seats and pooled volume.",
              highlight: true,
            },
            {
              name: "Scale", price: "Talk to us", docs: "20,000+ documents", per: "Volume rate",
              rate: "Raised on request", over: "Committed-volume pricing",
              note: "Custom limits, dedicated support and an agreed ceiling.",
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border bg-card p-6 ${tier.highlight ? "border-signal shadow-sm" : "border-border"}`}
            >
              <p className="font-bold text-brand-deep">{tier.name}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-brand-deep">{tier.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tier.name === "Scale" ? "custom" : "USD / month"}</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[tier.docs, tier.per, tier.rate, tier.over].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                    <span className="text-muted-foreground">{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-5 text-muted-foreground/85">{tier.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface-alt p-6">
          <p className="font-bold text-brand-deep">How that compares</p>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Published list pricing for document-extraction tools, converted to a cost per document
            where the vendor publishes enough to calculate one. Freight-specific platforms mostly
            quote privately, which is itself part of the comparison.
          </p>
          <table className="mt-5 w-full min-w-[38rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-bold text-brand-deep">Tool</th>
                <th className="py-2 pr-4 font-bold text-brand-deep">Entry price</th>
                <th className="py-2 pr-4 font-bold text-brand-deep">Per document</th>
                <th className="py-2 font-bold text-brand-deep">Commitment</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60 bg-amber-soft/30">
                <td className="py-2.5 pr-4 font-bold text-brand-deep">GainingDocx Pro</td>
                <td className="py-2.5 pr-4 font-semibold text-foreground">$31 / mo</td>
                <td className="py-2.5 pr-4 font-semibold text-foreground">$0.062</td>
                <td className="py-2.5">Monthly, cancel anytime</td>
              </tr>
              {[
                ["Docparser", "$39 / mo", "$0.39", "Monthly or annual"],
                ["Mindee", "Credit packs", "~$0.05 / credit", "Monthly"],
                ["Nanonets", "$499 / mo", "~$0.30 per extraction", "Monthly"],
                ["Shipamax", "$1,000+ / mo", "Not published", "Annual, custom quote"],
                ["Rossum", "~$18,000 / yr", "Not published", "Annual contract"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-medium text-foreground/90">{row[0]}</td>
                  <td className="py-2.5 pr-4">{row[1]}</td>
                  <td className="py-2.5 pr-4">{row[2]}</td>
                  <td className="py-2.5">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-5 text-muted-foreground/85">
            Competitor figures are list prices published by each vendor and last checked in August
            2026; they change, and enterprise quotes differ from list. Per-document figures assume a
            plan&rsquo;s full allowance is used. Check the current price with any vendor before deciding.
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-5 rounded-3xl bg-primary p-7 text-white md:grid-cols-[1fr_auto] md:items-center sm:p-9">
        <div><div className="flex items-center gap-2 text-signal"><ShieldCheck className="size-5" aria-hidden /><span className="text-xs font-bold uppercase tracking-[0.16em]">Secure billing</span></div><h2 className="mt-3 text-2xl font-extrabold">Billing without surprises</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">Paddle is the merchant of record and handles payment processing, invoices and applicable taxes. Manage payment details, download invoices, change or cancel the subscription from your account. Access continues through the paid period after cancellation.</p></div>
        <Button render={<Link href="/contact" />} variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Billing questions</Button>
      </section>

      <div className="mx-auto mt-12 max-w-3xl space-y-5 text-sm text-muted-foreground">
        <div><h3 className="font-bold text-foreground">What counts as a document?</h3><p className="mt-1">One manually uploaded file or one supported email attachment parsed once, up to 15 pages. Editing, validating, matching and exporting it again does not consume another document.</p></div>
        <div><h3 className="font-bold text-foreground">How does Team usage work?</h3><p className="mt-1">The workspace owner holds the subscription. Five seats and 2,000 documents per monthly billing cycle are included for the shared operation.</p></div>
        <div><h3 className="font-bold text-foreground">Do API documents count against the same allowance?</h3><p className="mt-1">Yes. One document is one document whether it arrives by upload, by email-in or through the API. There is no separate API fee and no per-call charge for calculators, validation or search — only parsing consumes an allowance.</p></div>
        <div><h3 className="font-bold text-foreground">What happens if I go over?</h3><p className="mt-1">Paid plans keep working and the extra documents are billed at the overage rate for your plan — failing a live integration mid-shipment is worse than a small invoice. Free plans stop at the allowance instead, so an unpaid account can never accrue a bill it did not agree to. Overage is capped at twice your allowance per cycle so a runaway integration hits a visible wall rather than billing without limit; <code className="rounded bg-secondary px-1 py-0.5 text-xs">GET /v1/me</code> reports usage and accrued overage at any time.</p></div>
        <div><h3 className="font-bold text-foreground">Can I change or cancel?</h3><p className="mt-1">Yes. The Paddle billing portal handles invoices, payment methods and cancellation. Plan changes are reflected after Paddle confirms the subscription event.</p></div>
      </div>
    </div>
  );
}
