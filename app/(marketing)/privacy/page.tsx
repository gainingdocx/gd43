import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How GainingDocx collects, uses, stores and protects your data and the shipping documents you upload.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: July 30, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-6 text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary">
        <section className="space-y-3">
          <h2>1. What we collect</h2>
          <p>
            <strong>Account and onboarding data:</strong> email address, name,
            company, role, business type, country, time zone, transport modes,
            document-volume range, workflow goals, preferences, consent choices,
            plan and usage counts.
          </p>
          <p>
            <strong>Documents and extracted data:</strong> the files you upload
            and the structured data extracted from them, stored so you can
            review, search and export them.
          </p>
          <p>
            <strong>Usage and diagnostics:</strong> product analytics events
            (such as pages and features used), anonymous browser and session
            identifiers, device class, referring website, campaign tags,
            language and country code supplied by our hosting network. We do
            not retain raw IP addresses in our product analytics database.
          </p>
          <p>
            <strong>Feedback:</strong> the category, message, optional reply
            email, page where it was submitted, country code, submission time
            and workflow status used by our administrator to review and resolve
            your request.
          </p>
        </section>

        <section className="space-y-3">
          <h2>2.1 Sign-in providers</h2>
          <p>
            If you choose Google sign-in, Google authenticates you and shares
            basic account identity such as your email address, name and profile
            image. We receive a Supabase session, not your Google password. We
            do not request access to Gmail, Drive or other Google content for
            account sign-in.
          </p>
        </section>

        <section className="space-y-3">
          <h2>2. How we use your data</h2>
          <p>
            We process your data solely to provide the Service: parsing and
            validating documents, storing your results, handling billing, and
            supporting you. We do not sell personal data and we do not use your
            documents to train AI models.
          </p>
        </section>

        <section className="space-y-3">
          <h2>3. AI processing</h2>
          <p>
            When you parse a document, its page images are sent to an AI model
            via our inference provider (OpenRouter) to extract the text fields.
            The provider processes the document to return the extraction and is contractually restricted
            from using API data to train models. All validation logic (check
            digits, weight and date rules, cross-document comparison) runs on
            our own infrastructure.
          </p>
        </section>

        <section className="space-y-3">
          <h2>4. Where your data lives</h2>
          <p>
            Documents and extracted data are stored with Supabase (database and
            file storage) with access restricted to your account. The
            application runs on Cloudflare&apos;s network. Payments are handled
            by Paddle, our merchant of record — we never see your full card
            details. Website analytics use Google Analytics and our
            Supabase-backed first-party analytics. Transactional email and
            forwarded-document intake use Cloudflare&apos;s email services; website feedback is stored directly in
            Supabase for administrator review.
          </p>
        </section>

        <section className="space-y-3">
          <h2>5. Retention and deletion</h2>
          <p>
            Your documents and data are retained while your account is active
            so you can search and re-export them. Deleting a document removes
            the stored file and its extracted data. Deleting your account
            removes your documents, extracted data and profile. Backups roll
            off on a fixed schedule after deletion. Feedback and aggregated
            product analytics may be retained as operational records unless
            deletion is required by law or requested through the contact page.
          </p>
        </section>

        <section className="space-y-3">
          <h2>6. Anonymous parsing</h2>
          <p>
            You can parse your first document without an account. That document
            is processed in your browser session and is not persisted to your
            account unless you sign up; abandoning the session discards it.
          </p>
        </section>

        <section className="space-y-3">
          <h2>7. Cookies</h2>
          <p>
            We use essential cookies for authentication and anonymous usage
            limits. First-party browser and session identifiers are stored in
            local and session storage to count anonymous visitors without
            retaining raw IP addresses. Google Analytics may set analytics
            cookies so we can understand website usage and improve the Service.
            Advertising signals are disabled, and document contents and unique
            document, shipment and share identifiers are not sent to Analytics.
          </p>
        </section>

        <section className="space-y-3">
          <h2>8. Your rights</h2>
          <p>
            You can export your data from the account page and delete your
            account at any time. Depending on your jurisdiction you may have
            additional rights (access, correction, erasure, portability) —
            contact us and we will honor them.
          </p>
        </section>

        <section className="space-y-3">
          <h2>9. Changes and contact</h2>
          <p>
            We will announce material changes to this policy by email or
            in-app notice. Questions or requests: reach us via the{" "}
            <Link href="/contact" className="underline">
            contact page
            </Link>
            . 
            You can separately change operational notifications, product
            updates and optional marketing consent from Account.
          </p>
        </section>
      </div>
    </article>
  );
}
