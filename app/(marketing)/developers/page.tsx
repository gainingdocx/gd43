// Public API reference.
//
// Written as a single scrollable page rather than a doc site: the API is small
// enough that an integrator can read the whole thing in ten minutes, and one
// page is searchable with Ctrl-F and by our own site search.

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileDown, KeyRound, ShieldAlert, Terminal, Webhook, Zap } from "lucide-react";

import { breadcrumbLd, collectionPageLd, faqLd, JsonLd } from "@/lib/seo/jsonld";
import { BreadcrumbBar } from "@/components/marketing/breadcrumb-bar";
import { INTEGRATION_EVENTS } from "@/lib/integrations/events";
import { EXPORT_PROFILES, PROFILE_LABELS } from "@/lib/integrations/profiles";

const TITLE = "GainingDocx API: Freight Document Extraction & Validation";
const DESCRIPTION =
  "REST API for parsing Bills of Lading, air waybills, invoices and packing lists, validating container and AWB check digits, and calculating CBM, chargeable weight, LCL freight and demurrage.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | GainingDocx` },
  description: DESCRIPTION,
  keywords: [
    "freight document API", "shipping document API", "bill of lading API",
    "OCR API logistics", "container number validation API", "customs document API",
    "chargeable weight API",
  ],
  alternates: { canonical: "/developers" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/developers", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  summary: string;
  description: string;
  example?: string;
  response?: string;
}

const ENDPOINTS: { group: string; blurb: string; items: Endpoint[] }[] = [
  {
    group: "Account",
    blurb: "Confirm a key works and see how much quota is left before you build against it.",
    items: [
      {
        method: "GET",
        path: "/v1/me",
        summary: "Retrieve the authenticated account",
        description:
          "The first call to make. Returns your plan, key metadata and remaining rate-limit quota. If this returns 200, your key and headers are correct.",
        example: `curl https://gainingdocx.com/api/v1/me \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY"`,
        response: `{
  "object": "account",
  "plan": "pro",
  "api_key": { "name": "Production", "prefix": "gdx_live_" },
  "rate_limit": { "limit": 120, "remaining": 119 }
}`,
      },
    ],
  },
  {
    group: "Documents",
    blurb:
      "Parse freight documents into structured fields, then retrieve, list and delete them. Parsing is synchronous and can take up to two minutes on a long document.",
    items: [
      {
        method: "POST",
        path: "/v1/parse",
        summary: "Parse a document",
        description:
          "Send page images as HTTPS URLs or base64 data URLs. Document type is detected automatically; the optional hint only biases detection. Returns extracted fields plus deterministic validation findings.",
        example: `curl https://gainingdocx.com/api/v1/parse \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pages": [{ "url": "https://example.com/bl-page-1.jpg" }],
    "document_type": "bill_of_lading"
  }'`,
        response: `{
  "id": "b2c1…",
  "object": "document",
  "status": "parsed",
  "document_type": "bill_of_lading",
  "fields": { "bl_number": "MEDUX1234567", "containers": [ … ] },
  "validation": [ { "field": "container_no", "severity": "error", … } ]
}`,
      },
      {
        method: "GET",
        path: "/v1/documents",
        summary: "List documents",
        description:
          "Paginated with `limit` and `offset`, filterable by `status`, `document_type` and `shipment_id`. Extracted fields are omitted here — retrieve a document to get them.",
        example: `curl "https://gainingdocx.com/api/v1/documents?status=parsed&limit=10" \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY"`,
      },
      {
        method: "GET",
        path: "/v1/documents/{id}",
        summary: "Retrieve a document",
        description: "Returns the full document including `fields` and `validation`.",
      },
      {
        method: "DELETE",
        path: "/v1/documents/{id}",
        summary: "Delete a document",
        description:
          "Permanently deletes the document and its extracted data. This cannot be undone. An id belonging to another account returns 404, not 403.",
      },
    ],
  },
  {
    group: "Tools",
    blurb:
      "Stateless calculations and reference checks. These run the same code as the free on-site calculators, so an API answer and a browser answer cannot drift apart.",
    items: [
      {
        method: "POST",
        path: "/v1/tools/validate-reference",
        summary: "Validate container, AWB or port references",
        description:
          "Batch-checks ISO 6346 container check digits, IATA modulus-7 AWB check digits, or resolves port names and UN/LOCODEs. On failure it returns the expected check digit, which is what separates a typo from a fabricated number.",
        example: `curl https://gainingdocx.com/api/v1/tools/validate-reference \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "type": "container", "values": ["MSCU1234565", "TGHU7654321"] }'`,
        response: `{
  "object": "reference_validation",
  "valid_count": 1,
  "results": [
    { "input": "MSCU1234565", "valid": true, "expected_check_digit": 5 },
    { "input": "TGHU7654321", "valid": false,
      "expected_check_digit": 7, "suggested": "TGHU7654327" }
  ]
}`,
      },
      {
        method: "POST",
        path: "/v1/tools/volume",
        summary: "Calculate CBM and chargeable weight",
        description:
          "Totals volume across package groups and compares actual against volumetric weight, reporting which figure the carrier will rate on. Default divisor is 6000 cm³/kg (general air cargo); express is 5000.",
        example: `curl https://gainingdocx.com/api/v1/tools/volume \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "unit": "cm",
    "groups": [{ "length": 120, "width": 80, "height": 95, "quantity": 4, "gross_weight": 260 }]
  }'`,
        response: `{
  "totals": {
    "volume_m3": 3.648,
    "actual_weight": 260,
    "volumetric_weight": 608,
    "chargeable_weight": 608,
    "rated_on": "volumetric"
  }
}`,
      },
      {
        method: "POST",
        path: "/v1/tools/freight-charges",
        summary: "Calculate LCL freight or demurrage and detention",
        description:
          "Set `calculation` to `lcl_wm` for weight-or-measure ocean freight, or `free_time` for demurrage and detention against free days and rate tiers. Both return the working, not just a total, so you can show a carrier which figure controlled.",
        example: `curl https://gainingdocx.com/api/v1/tools/freight-charges \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "calculation": "lcl_wm",
    "cbm": 12.4, "gross_kg": 9800, "rate_per_revenue_ton": 48
  }'`,
      },
    ],
  },
  {
    group: "Content",
    blurb: "Embed GainingDocx reference material in your own help centre or internal tools.",
    items: [
      {
        method: "GET",
        path: "/v1/content/search",
        summary: "Search reference content",
        description:
          "Searches guides, tools, templates and the answers inside them. Trade shorthand is understood — B/L, AWB, VGM and D&D all resolve. Question-shaped queries may return a direct `answer` suitable for rendering inline.",
        example: `curl "https://gainingdocx.com/api/v1/content/search?q=how+is+chargeable+weight+calculated" \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY"`,
      },
    ],
  },
];

const FAQS = [
  {
    q: "How do I get an API key?",
    a: "Sign in, open Integrations in your workspace, and create a key. The plaintext key is shown once at creation and only its SHA-256 hash is stored, so it cannot be recovered later — save it to your secret manager immediately. Keys can be revoked at any time and revocation takes effect on the next request.",
  },
  {
    q: "What are the rate limits?",
    a: "120 requests per 60 seconds per key. Every response carries X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset; a 429 additionally carries Retry-After. Counting happens in the database rather than per worker, so the limit is the real limit regardless of which edge location serves you.",
  },
  {
    q: "Is the API versioned?",
    a: "Yes. Every path is prefixed with /v1. Additive changes — new endpoints, new response fields — ship within v1. Anything that could break a working integration would ship as a new version, and error codes are treated as part of the contract even though messages are not.",
  },
  {
    q: "Can I call the API from a browser?",
    a: "No. API keys carry full account access and must never appear in browser or mobile code, where anyone can read them. Call the API from your server. CORS is permissive so server-side proxies and tools work, which is not an invitation to embed a key client-side.",
  },
  {
    q: "How should I handle errors?",
    a: "Every error returns the same envelope with a stable `code`, a human `message`, an optional `param` naming the offending input, and a `request_id`. Branch on `code`, show `message`, and quote `request_id` to support. Retry 429 after Retry-After and 5xx with exponential backoff; do not retry 400 or 401 without changing something.",
  },
  {
    q: "Is there an OpenAPI specification?",
    a: "Yes, at /api/v1/openapi.json. It is OpenAPI 3.1 and is maintained in the same commit as the routes, so you can generate a client, import it into Postman or Insomnia, and diff it between releases.",
  },
];

const METHOD_STYLE: Record<Endpoint["method"], string> = {
  GET: "bg-brand/10 text-brand",
  POST: "bg-signal/10 text-signal",
  DELETE: "bg-amber-ink/10 text-amber-ink",
};

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "API", path: "/developers" },
          ]),
          collectionPageLd(
            "GainingDocx API reference",
            "/developers",
            ENDPOINTS.flatMap((group) => group.items.map((item) => ({ name: `${item.method} ${item.path}`, path: "/developers" })))
          ),
          faqLd(FAQS),
        ]}
      />

      <BreadcrumbBar>
        <Link href="/">Home</Link>
        <ChevronRight className="size-3" aria-hidden />
        <span>API</span>
      </BreadcrumbBar>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-signal">Developer reference</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">
        The GainingDocx API
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
        Parse freight documents into structured data, validate the reference numbers that carry check
        digits, and run the freight calculations your team already does by hand — from your own
        systems, on your own schedule.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Zap, title: "REST and JSON", body: "Predictable resources, one error envelope, standard status codes." },
          { icon: KeyRound, title: "Bearer keys", body: "Created and revoked in your workspace. Stored only as hashes." },
          { icon: Terminal, title: "OpenAPI 3.1", body: "Generate a client or import the spec straight into Postman." },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
            <card.icon className="size-5 text-signal" aria-hidden />
            <p className="mt-3 font-bold text-brand-deep">{card.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      {/* Quickstart */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">Quickstart</h2>
        <ol className="mt-5 space-y-4">
          {[
            <>Sign in and open <Link href="/app/integrations" className="font-bold text-primary hover:underline">Integrations</Link> in your workspace.</>,
            <>Create an API key. It is shown <strong>once</strong> — store it in your secret manager immediately.</>,
            <>Confirm it works by calling <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">GET /v1/me</code>.</>,
            <>Parse your first document with <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">POST /v1/parse</code>.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-7">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-brand-deep p-5">
          <pre className="text-sm leading-6 text-white/90">
            <code>{`export GAININGDOCX_API_KEY="gdx_live_..."

curl https://gainingdocx.com/api/v1/me \\
  -H "Authorization: Bearer $GAININGDOCX_API_KEY"`}</code>
          </pre>
        </div>
      </section>

      {/* Authentication */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">Authentication</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Every request needs an <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">Authorization: Bearer</code>{" "}
          header carrying a key that starts with <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">gdx_live_</code>.
          Only a SHA-256 hash of the key is stored, so a database compromise does not hand over working
          credentials — and neither we nor you can recover a lost key. Create a new one and revoke the old.
        </p>
        <div className="mt-5 flex gap-3 rounded-2xl border border-amber/50 bg-amber-soft/40 p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-ink" aria-hidden />
          <p className="text-sm leading-6 text-foreground/85">
            <strong>Never put an API key in browser or mobile code.</strong> A key carries full access to
            your account and is trivially readable by anyone who opens developer tools. Call the API from
            your server and keep the key in a secret manager or environment variable.
          </p>
        </div>
      </section>

      {/* Errors */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">Errors and rate limits</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Every failure returns the same envelope, so you write one error handler rather than one per
          endpoint. Branch on <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">code</code>, which is
          stable; <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">message</code> is for humans and
          may be reworded.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-brand-deep p-5">
          <pre className="text-sm leading-6 text-white/90">
            <code>{`{
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_request",
    "message": "\`cbm\` must be a number.",
    "param": "cbm",
    "request_id": "req_8f2c1a94be7d40118c3e"
  }
}`}</code>
          </pre>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-bold text-brand-deep">Status</th>
                <th className="py-2 pr-4 font-bold text-brand-deep">type</th>
                <th className="py-2 font-bold text-brand-deep">What to do</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["400", "invalid_request_error", "Fix the input named in param. Retrying unchanged will fail again."],
                ["401", "authentication_error", "Check the key and the Bearer header. A revoked key cannot be restored."],
                ["404", "not_found_error", "The id does not exist in your account. Ids from other accounts also return 404."],
                ["429", "rate_limit_error", "Wait for Retry-After seconds, then retry."],
                ["5xx", "api_error", "Retry with exponential backoff. Quote request_id if it persists."],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-foreground">{row[0]}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{row[1]}</td>
                  <td className="py-2.5 leading-6">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
          Rate limiting is 120 requests per 60 seconds per key, counted in the database rather than per
          worker — so the limit is the real limit no matter which edge location serves you. Every response
          carries <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">X-RateLimit-Remaining</code> and{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">X-Request-Id</code>.
        </p>
      </section>

      {/* Endpoints */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">Endpoints</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Base URL <code className="rounded bg-secondary px-1.5 py-0.5">https://gainingdocx.com/api/v1</code> ·{" "}
          <a href="/api/v1/openapi.json" className="font-bold text-primary hover:underline">OpenAPI spec</a>
        </p>

        {ENDPOINTS.map((group) => (
          <div key={group.group} className="mt-9">
            <h3 className="text-xl font-extrabold text-primary">{group.group}</h3>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{group.blurb}</p>

            <div className="mt-5 space-y-5">
              {group.items.map((endpoint) => (
                <div key={`${endpoint.method}${endpoint.path}`} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${METHOD_STYLE[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm font-semibold text-brand-deep">{endpoint.path}</code>
                  </div>
                  <p className="mt-3 font-bold text-brand-deep">{endpoint.summary}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{endpoint.description}</p>

                  {endpoint.example && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-brand-deep p-4">
                      <pre className="text-xs leading-6 text-white/90"><code>{endpoint.example}</code></pre>
                    </div>
                  )}
                  {endpoint.response && (
                    <>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Response</p>
                      <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-background p-4">
                        <pre className="text-xs leading-6 text-foreground/80"><code>{endpoint.response}</code></pre>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Webhooks. The `id` is the anchor `lib/integrations/catalog.ts` points
          at from the signed-webhook entry; without it the marketplace links
          land at the top of this page. */}
      <section id="webhooks" className="mt-12 scroll-mt-24">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-brand-deep sm:text-3xl">
          <Webhook className="size-6 text-signal" aria-hidden /> Webhooks
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Rather than polling for a parse to finish, register an HTTPS endpoint in{" "}
          <Link href="/app/integrations" className="font-bold text-primary hover:underline">Integrations</Link> and
          receive events as they happen. Delivery is durable: the event is queued before it is sent,
          retried at roughly 1m, 5m, 15m, 1h and 6h if your endpoint is unreachable, and dead-lettered
          into a log you can replay by hand rather than being dropped.
        </p>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Every attempt carries the same{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">Idempotency-Key</code> and a byte-identical
          body, so a receiver that already committed an earlier attempt can discard the repeat. Verify{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">X-GainingDocx-Signature</code> — an HMAC-SHA256
          of the raw request body, hex-encoded — before acting on any payload. A{" "}
          <Link href="/integrations#delivery" className="font-bold text-primary hover:underline">worked verification example</Link>{" "}
          is on the integrations page.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Published webhook event types and when each fires</caption>
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold text-brand-deep">Event</th>
                <th scope="col" className="px-4 py-3 font-bold text-brand-deep">Fires</th>
              </tr>
            </thead>
            {/* Rendered from the catalogue so an event cannot ship documented
                but unsent, or sent but undocumented. */}
            <tbody className="divide-y divide-border">
              {INTEGRATION_EVENTS.map((event) => (
                <tr key={event.type} className="align-top">
                  <td className="px-4 py-3">
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold">{event.type}</code>
                  </td>
                  <td className="px-4 py-3 leading-6 text-muted-foreground">{event.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A destination can subscribe to all of these or only the critical ones. Slack and Microsoft
          Teams channels are the same mechanism with a rendered message instead of a JSON body — see{" "}
          <Link href="/integrations" className="font-bold text-primary hover:underline">all integrations</Link>.
        </p>
      </section>

      {/* Exports. Anchored for the structured-export catalogue entry. */}
      <section id="exports" className="mt-12 scroll-mt-24">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-brand-deep sm:text-3xl">
          <FileDown className="size-6 text-signal" aria-hidden /> Exports
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">GET /v1/shipments/{"{id}"}/export?profile=…</code>{" "}
          returns one reviewed shipment shaped for the system that will import it. The canonical profiles
          are the mapping target every connector goes through; the system-specific ones are that same
          model rendered into the receiving format.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {EXPORT_PROFILES.map((profile) => (
            <div key={profile} className="rounded-2xl border border-border bg-card p-4">
              <code className="text-xs font-semibold text-signal">{profile}</code>
              <p className="mt-1 font-bold text-brand-deep">{PROFILE_LABELS[profile]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          Field names in CargoWise, Tally and the accounting APIs vary by tenant configuration and chart
          of accounts, so every export carries a notice saying what a person must check before importing
          it into a live system. An export is refused while a critical discrepancy is open on the shipment.
        </p>
      </section>

      {/* FAQs */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">API questions</h2>
        <dl className="mt-6 space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <dt className="font-bold text-brand-deep">{faq.q}</dt>
              <dd className="mt-1.5 leading-7 text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 rounded-2xl border border-border bg-surface-alt p-6">
        <p className="font-bold text-brand-deep">Ready to build?</p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Create a key in your workspace, or read how extraction and validation work before you integrate.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/integrations" className="rounded-xl bg-signal px-4 py-2.5 text-sm font-bold text-white hover:bg-signal/90">
            Create an API key
          </Link>
          <Link href="/features/shipping-document-data-extraction" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-primary hover:border-signal">
            How extraction works
          </Link>
        </div>
      </div>
    </div>
  );
}
