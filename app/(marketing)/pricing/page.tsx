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

      <section className="mt-12 grid gap-5 rounded-3xl bg-primary p-7 text-white md:grid-cols-[1fr_auto] md:items-center sm:p-9">
        <div><div className="flex items-center gap-2 text-signal"><ShieldCheck className="size-5" aria-hidden /><span className="text-xs font-bold uppercase tracking-[0.16em]">Secure billing</span></div><h2 className="mt-3 text-2xl font-extrabold">Billing without surprises</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">Paddle is the merchant of record and handles payment processing, invoices and applicable taxes. Manage payment details, download invoices, change or cancel the subscription from your account. Access continues through the paid period after cancellation.</p></div>
        <Button render={<Link href="/contact" />} variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Billing questions</Button>
      </section>

      <div className="mx-auto mt-12 max-w-3xl space-y-5 text-sm text-muted-foreground">
        <div><h3 className="font-bold text-foreground">What counts as a document?</h3><p className="mt-1">One manually uploaded file or one supported email attachment parsed once, up to 15 pages. Editing, validating, matching and exporting it again does not consume another document.</p></div>
        <div><h3 className="font-bold text-foreground">How does Team usage work?</h3><p className="mt-1">The workspace owner holds the subscription. Five seats and 2,000 documents per monthly billing cycle are included for the shared operation.</p></div>
        <div><h3 className="font-bold text-foreground">Can I change or cancel?</h3><p className="mt-1">Yes. The Paddle billing portal handles invoices, payment methods and cancellation. Plan changes are reflected after Paddle confirms the subscription event.</p></div>
      </div>
    </div>
  );
}
