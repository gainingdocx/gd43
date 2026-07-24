import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/paddle/checkout-button";
import { paddleConfigured, PADDLE_PRICES } from "@/lib/paddle/config";

export const metadata: Metadata = {
  title: "Shipping Document Parser Pricing",
  description:
    "GainingDocx pricing: a free tier plus Pro for teams that live in shipping documents. Parse, validate, generate and export freight paperwork.",
  alternates: { canonical: "/pricing" },
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Try everything, then save your workflow.",
    features: [
      "1 editable guest document per day",
      "20 saved documents per month after free sign-in",
      "AI extraction + full validation",
      "Excel, CSV, JSON & PDF exports",
      "Saved history and Shipment Check",
    ],
    cta: "Use early access",
    href: "/app",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month, or $190/year (2 months free)",
    tagline: "For forwarders and traders who live in documents.",
    features: [
      "200 documents per month",
      "Watermark-free exports",
      "Generate counterpart documents (CI ⇄ PL, Shipping Instructions)",
      "Unlimited cross-document Shipment Checks",
      "Priority support",
    ],
    cta: "Ask about Pro",
    href: "/contact",
    highlight: true,
  },
  {
    name: "Top-ups",
    price: "Pay as you go",
    period: "one-time packs",
    tagline: "Busy month? Add documents without changing plans.",
    features: [
      "One-time document packs",
      "Never expire mid-cycle surprises",
      "Same parsing, validation & exports",
      "Available on Free and Pro",
    ],
    cta: "Contact us",
    href: "/contact",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <h1 className="text-center text-4xl font-bold tracking-tight text-primary">
        Shipping Document Parser Pricing
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
        {paddleConfigured
          ? "Start free, upgrade to Pro when documents pile up. Billing is handled securely by Paddle, our merchant of record; cancel anytime."
          : "Early access is available now. Paid checkout is not live yet; Pro and top-up details below are targets and may change before launch."}
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isPro = plan.highlight;
          const badge = paddleConfigured ? "Most popular" : "Planned";
          return (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative rounded-2xl border-2 border-signal bg-card p-8 shadow-sm"
                  : "rounded-2xl border border-border bg-card p-8"
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-signal-foreground">
                  {badge}
                </span>
              )}
              <h2 className="text-lg font-semibold text-primary">
                {!paddleConfigured && isPro ? `Planned ${plan.name}` : plan.name}
              </h2>
              <p className="mt-4 text-4xl font-bold tracking-tight text-primary">
                {plan.price}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.period}</p>
              <p className="mt-4 text-sm text-muted-foreground">{plan.tagline}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CircleCheck
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {isPro && paddleConfigured ? (
                <div className="mt-8 space-y-2">
                  <CheckoutButton
                    priceId={PADDLE_PRICES.proMonthly}
                    size="lg"
                    className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
                  >
                    Get Pro — $19/month
                  </CheckoutButton>
                  <CheckoutButton
                    priceId={PADDLE_PRICES.proYearly}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    Pay yearly — $190 (2 months free)
                  </CheckoutButton>
                </div>
              ) : (
                <Button
                  render={<Link href={plan.href} />}
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  className={
                    plan.highlight
                      ? "mt-8 w-full bg-signal text-signal-foreground hover:bg-signal/90"
                      : "mt-8 w-full"
                  }
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-14 max-w-2xl space-y-6 text-sm text-muted-foreground">
        <div>
          <h2 className="font-semibold text-foreground">
            What counts as a document?
          </h2>
          <p className="mt-1">
            One uploaded file parsed once — regardless of page count (up to 15
            pages). Re-running validation or exporting never consumes extra
            documents.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Can I cancel anytime?
          </h3>
          <p className="mt-1">
            {paddleConfigured
              ? "Yes. Manage or cancel your subscription anytime from your account; access continues until the end of the paid period."
              : "Paid subscriptions are not available yet. Before checkout launches, this page will show the merchant of record, cancellation controls and final billing terms."}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Do you offer team plans?
          </h3>
          <p className="mt-1">
            Not yet — <Link href="/contact" className="underline">tell us</Link>{" "}
            about your team and we&apos;ll let you know when they arrive.
          </p>
        </div>
      </div>
    </div>
  );
}
