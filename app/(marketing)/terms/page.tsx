import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of GainingDocx, the AI shipping document parsing service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: July 19, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-6 text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary">
        <section className="space-y-3">
          <h2>1. Agreement</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of
            GainingDocx (&quot;the Service&quot;, &quot;we&quot;,
            &quot;us&quot;), a web application that extracts, validates and
            exports data from shipping documents. By creating an account or
            using the Service you agree to these Terms. If you use the Service
            on behalf of a company, you represent that you are authorized to
            bind that company.
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. The Service</h2>
          <p>
            GainingDocx uses artificial intelligence to extract data from
            documents you upload (such as Bills of Lading, Commercial Invoices
            and Packing Lists) and applies automated validation rules to the
            extracted data. Output is provided to assist your review — it is
            not legal, customs or freight advice, and it does not replace
            verification of the original documents.
          </p>
          <p>
            <strong>You remain responsible for the accuracy of any data you
            rely on or forward to third parties.</strong> AI extraction can
            contain errors; always review the extracted fields against the
            source document before using them.
          </p>
        </section>

        <section className="space-y-3">
          <h2>3. Your content</h2>
          <p>
            You retain all rights to the documents you upload and the data
            extracted from them. You grant us a limited license to store and
            process your documents solely to provide the Service (parsing,
            validation, export, generation). We do not sell your documents or
            use them to train AI models.
          </p>
          <p>
            You must have the right to upload the documents you submit. Do not
            upload documents containing information you are not permitted to
            process.
          </p>
        </section>

        <section className="space-y-3">
          <h2>4. Accounts and acceptable use</h2>
          <p>
            You are responsible for activity under your account. You agree not
            to: abuse rate limits or circumvent plan limits; attempt to access
            other users&apos; data; reverse engineer the Service; upload
            malicious files; or use the Service for unlawful purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2>5. Plans, billing and refunds</h2>
          <p>
            Paid subscriptions are processed by Paddle.com, our merchant of
            record. Paddle handles payment, invoicing and applicable taxes;
            Paddle&apos;s checkout terms apply to the purchase itself. Plan
            limits (such as documents per month) reset each billing cycle and
            unused allowance does not roll over. You can cancel at any time
            from your account page, effective at the end of the current billing
            period. Refund requests are handled in line with Paddle&apos;s
            buyer policies — contact us and we will help.
          </p>
        </section>

        <section className="space-y-3">
          <h2>6. Availability and changes</h2>
          <p>
            We aim for high availability but the Service is provided &quot;as
            is&quot; and &quot;as available&quot; without warranties of any
            kind. We may modify features over time; if we materially reduce
            core paid functionality we will notify subscribers in advance.
          </p>
        </section>

        <section className="space-y-3">
          <h2>7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, our total liability arising
            out of or related to the Service is limited to the amount you paid
            us in the twelve months before the claim. We are not liable for
            indirect, incidental or consequential damages, including losses
            arising from decisions made on extracted or validated data (such as
            demurrage, detention, customs penalties or rejected shipments).
          </p>
        </section>

        <section className="space-y-3">
          <h2>8. Termination</h2>
          <p>
            You may delete your account at any time from the account page,
            which removes your stored documents and data. We may suspend or
            terminate accounts that violate these Terms, with notice where
            practicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2>9. Changes to these Terms</h2>
          <p>
            We may update these Terms as the Service evolves. Material changes
            will be announced by email or in-app notice at least 14 days before
            they take effect. Continued use after the effective date
            constitutes acceptance.
          </p>
        </section>

        <section className="space-y-3">
          <h2>10. Contact</h2>
          <p>
            Questions about these Terms? Reach us via the{" "}
            <Link href="/contact" className="underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
