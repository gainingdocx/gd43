import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with GainingDocx — support, billing questions, feature requests and partnership inquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-primary">
        Contact us
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Questions about parsing, plans, billing or anything else — email us and
        a human will reply, usually within one business day.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-signal">
            <Mail className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-primary">Email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For support, billing and general inquiries:
            </p>
            <p className="mt-2 font-medium">
              <a
                href="mailto:gainingdocx@gmail.com"
                className="text-primary underline underline-offset-4"
              >
                gainingdocx@gmail.com
              </a>
            </p>
          </div>
        </div>
        <Button
          render={<a href="mailto:gainingdocx@gmail.com" />}
          size="lg"
          className="mt-8 w-full bg-signal text-signal-foreground hover:bg-signal/90 sm:w-auto"
        >
          Write to us
        </Button>
      </div>

      <div className="mt-10 space-y-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Billing:</strong> subscriptions
          are processed by Paddle, our merchant of record. Include the email on
          your receipt so we can find your order quickly. See also our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          <strong className="text-foreground">Feature requests:</strong> tell
          us which document types or checks you need next — the roadmap is
          driven by working forwarders and traders.
        </p>
      </div>
    </div>
  );
}
