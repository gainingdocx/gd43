// The public integration marketplace.
//
// Every word about a connector on this page is read from
// `lib/integrations/catalog.ts`, which is the same list the `/v1/integrations`
// endpoint and the in-app connection UI read. Nothing here is hand-written per
// connector, so the page cannot claim a capability the product does not
// declare — which is the entire failure mode of a competitor's logo wall.
//
// The deliberate choice: show the `planned` and `partner` entries rather than
// hiding them. A buyer evaluating us against an incumbent is going to ask about
// CargoWise and NetSuite regardless. Answering "here is exactly how that is
// delivered, and here is what we have not built" wins more of those
// conversations than a grid of logos that all silently mean "possible via API".
//
// The exception is `visibility: "internal"`, which publishes nothing at all.
// "Planned" is still a promise — it tells a customer this is coming and invites
// them to plan around it. Where we cannot yet say *when* something will work,
// even that is more than we can honour, so those entries are silent until they
// are real. Everything on this page renders from `publicCatalog()` for that
// reason; reading `INTEGRATION_CATALOG` directly here would leak them.

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, PlugZap, RefreshCcw, ShieldCheck } from "lucide-react";

import { BreadcrumbBar } from "@/components/marketing/breadcrumb-bar";
import {
  CATEGORY_LABELS,
  catalogByCategory,
  catalogCounts,
  publicCatalog,
  STATUS_BLURBS,
  STATUS_LABELS,
} from "@/lib/integrations/catalog";
import { INTEGRATION_EVENTS } from "@/lib/integrations/events";
import type { ConnectorDeclaration, ConnectorStatus } from "@/lib/integrations/connector";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";

const TITLE = "Freight Software Integrations: TMS, Accounting, Slack & API";
const DESCRIPTION =
  "Connect GainingDocx to your TMS, accounting system, cloud storage and chat. Signed webhooks with automatic retries, CargoWise and Tally exports, Slack and Teams alerts, and a documented REST API.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "freight software integrations",
    "CargoWise integration",
    "TMS integration shipping documents",
    "logistics webhook API",
    "Tally freight invoice import",
    "QuickBooks freight invoice",
    "Slack shipping alerts",
  ],
  alternates: { canonical: "/integrations" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/integrations", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ACCESS_LABELS: Record<ConnectorDeclaration["access"], string> = {
  read_only: "Reads into GainingDocx",
  read_write: "Reads and writes",
  write_only: "Writes only",
  outbound_only: "Sends out of GainingDocx",
};

const SETUP_LABELS: Record<ConnectorDeclaration["setup"], string> = {
  self_serve: "Set up yourself",
  guided: "Set up with us",
  partner_assisted: "Set up with your partner",
};

const PLAN_LABELS: Record<ConnectorDeclaration["requiredPlan"], string> = {
  free: "Free and up",
  pro: "Pro and up",
  team: "Team",
};

/**
 * Badge colour by release state.
 *
 * `via_api` gets the same visual weight as `live` on purpose. It is a real,
 * usable capability today, and dimming it would push us back toward pretending
 * only native connectors count — while `planned` stays visibly quieter so no
 * one skims the page and reads a roadmap item as shipped.
 */
const STATUS_STYLES: Record<ConnectorStatus, string> = {
  live: "bg-success/10 text-success ring-1 ring-success/25",
  beta: "bg-[var(--amber-soft)] text-[var(--amber-ink)] ring-1 ring-amber/40",
  via_api: "bg-primary/10 text-primary ring-1 ring-primary/20",
  partner: "bg-secondary text-secondary-foreground ring-1 ring-border",
  planned: "bg-muted text-muted-foreground ring-1 ring-border",
};

/** The order buyers scan in: what works now, then what needs help, then what does not exist. */
const STATUS_ORDER: readonly ConnectorStatus[] = ["live", "beta", "via_api", "partner", "planned"];

const FAQS = [
  {
    q: "Do you have a native CargoWise integration?",
    a: "Not an unsupervised one, and we say so rather than letting the logo imply it. We generate the UniversalShipment XML and the field mapping; your CargoWise partner or middleware deploys the eAdaptor route. Reconfiguring a customer's eAdaptor routing blind would break integrations they already depend on, so it is not something we will do on your behalf.",
  },
  {
    q: "What happens if my endpoint is down when an event fires?",
    a: "The event is queued before it is sent, attempted immediately, then retried at roughly 1 minute, 5 minutes, 15 minutes, 1 hour and 6 hours. After the last attempt it is dead-lettered and shown in your workspace, where you can replay it by hand with the original body. Nothing is silently dropped.",
  },
  {
    q: "Will a retry create a duplicate record in my system?",
    a: "Only if you ignore the Idempotency-Key header. Every attempt of one event carries the same key and the same body, byte for byte, so a receiver that already committed attempt two can safely discard attempt three.",
  },
  {
    q: "Do document images ever leave GainingDocx?",
    a: "Only where a connector's declaration says so — the cloud-storage connectors write the original file into your own drive. Webhook and chat deliveries carry identifiers, field names and values, never file contents. Every entry on this page lists exactly what it transmits.",
  },
  {
    q: "Can you stop a bad value reaching my accounting system?",
    a: "That is the point of the product. Every write-back path checks the review state first and refuses while a critical discrepancy is open on the shipment. A wrong shipment reference is an annoyance; a wrong invoice line is money.",
  },
  {
    q: "What if the system I use is not listed?",
    a: "Use the signed webhook or the structured export with an automation platform such as Make, Zapier or n8n — that covers most systems without waiting for us. Tell us what you need and we will tell you honestly whether it is on the roadmap.",
  },
];

function StatusBadge({ status }: { status: ConnectorStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function DetailList({ label, items }: { label: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-signal" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConnectorCard({ entry }: { entry: ConnectorDeclaration }) {
  return (
    // The id is the anchor every `docsPath` in the catalogue points at. Deriving
    // it here rather than keeping a second lookup is what stops the two lists
    // drifting apart the first time a connector is renamed.
    <section id={entry.id} className="scroll-mt-24 rounded-3xl border border-amber/45 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-extrabold text-brand-deep">{entry.provider}</h3>
        <StatusBadge status={entry.status} />
      </div>
      <p className="mt-2 leading-7 text-muted-foreground">{entry.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold">
        {[ACCESS_LABELS[entry.access], SETUP_LABELS[entry.setup], PLAN_LABELS[entry.requiredPlan]].map((chip) => (
          <span key={chip} className="rounded-lg bg-secondary px-2 py-1 text-secondary-foreground">
            {chip}
          </span>
        ))}
      </div>

      <DetailList label="What it does" items={entry.actions} />
      {/* Placed on every card, never in a footnote: "what exactly leaves your
          system" is the first question a freight operator asks and the one a
          logo wall never answers. */}
      <DetailList label="What data is sent" items={entry.dataTransmitted} />
      {entry.scopes && <DetailList label="Permissions you grant" items={entry.scopes} />}

      {entry.partnerNote && (
        <p className="mt-4 rounded-xl border border-amber/45 bg-[var(--amber-soft)] p-3 text-sm leading-6 text-[var(--amber-ink)]">
          {entry.partnerNote}
        </p>
      )}

      <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">Retries</dt>
          <dd>{entry.retryPolicy}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">Duplicates</dt>
          <dd>{entry.idempotency}</dd>
        </div>
        {entry.rateLimit && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold">Limits</dt>
            <dd>{entry.rateLimit}</dd>
          </div>
        )}
        {entry.attachmentLimit && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold">Attachments</dt>
            <dd>{entry.attachmentLimit}</dd>
          </div>
        )}
      </dl>

      {entry.docsPath && !entry.docsPath.startsWith("/integrations#") && (
        <Link href={entry.docsPath} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary hover:underline">
          Read the setup detail <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </section>
  );
}

export default function IntegrationsPage() {
  const counts = catalogCounts();
  const groups = catalogByCategory();
  const usableToday = counts.live + counts.beta + counts.via_api;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Integrations", path: "/integrations" },
          ]),
          collectionPageLd(
            "GainingDocx integrations",
            "/integrations",
            publicCatalog().map((entry) => ({ name: entry.provider, path: `/integrations#${entry.id}` }))
          ),
          itemListLd(
            "Freight document automation integrations",
            "/integrations",
            publicCatalog().map((entry) => ({
              name: entry.provider,
              path: `/integrations#${entry.id}`,
              description: entry.summary,
            }))
          ),
          faqLd(FAQS),
        ]}
      />

      <BreadcrumbBar>
        <Link href="/">Home</Link>
        <ChevronRight className="size-3" aria-hidden />
        <span>Integrations</span>
      </BreadcrumbBar>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-signal">Integrations</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-brand-deep sm:text-5xl">
        Reviewed shipment data, delivered into the systems you already run.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
        {usableToday} of the {counts.total} connectors below work today — {counts.live} natively, {counts.via_api}{" "}
        through the signed webhook or a structured export. The rest are listed with what they actually
        require, because a logo that quietly means &ldquo;possible if you build it&rdquo; wastes an
        evaluation you were doing in good faith.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: PlugZap, title: `${counts.live} live connectors`, body: "Built, tested, and configurable from your workspace without talking to us." },
          { icon: RefreshCcw, title: "Nothing is dropped", body: "Failed deliveries retry for about seven hours, then wait in a dead-letter log you can replay." },
          { icon: ShieldCheck, title: "Writes are gated", body: "No connector writes into your system while a critical discrepancy is open on the shipment." },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
            <card.icon className="size-5 text-signal" aria-hidden />
            <p className="mt-3 font-bold text-brand-deep">{card.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      {/* Status legend — the honesty contract, stated before the catalogue. */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">What each label means</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          These five words are used the same way on every card, on the{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">/v1/integrations</code> endpoint and
          inside the product. If a connector is labelled here as doing something, it does it.
        </p>
        <dl className="mt-6 space-y-3">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="shrink-0 sm:w-44">
                <StatusBadge status={status} />
              </dt>
              <dd className="text-sm leading-6 text-muted-foreground">{STATUS_BLURBS[status]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Delivery guarantees. The real differentiator, and the section an
          integrator reads before deciding whether to trust the webhook. */}
      <section id="delivery" className="mt-12 scroll-mt-24 rounded-3xl bg-primary p-6 text-white lg:p-8">
        <h2 className="text-2xl font-extrabold sm:text-3xl">How delivery actually works</h2>
        <p className="mt-3 max-w-3xl leading-7 text-white/75">
          An integration that silently drops an event is worse than no integration, because you believe
          your downstream system is in sync when it is not. So the queue is visible and the failures are
          yours to inspect.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Queued before it is sent", "The event row is written first, then attempted. A crash mid-send leaves work to pick up, not an event nobody recorded."],
            ["Retried on a real schedule", "About 1 minute, 5 minutes, 15 minutes, 1 hour, then 6 hours — a little over seven hours of cover for an endpoint that broke overnight."],
            ["Safe to receive twice", "One stable Idempotency-Key per event across every attempt, and the retry body is identical to the first attempt's."],
            ["Dead-lettered, not deleted", "After the final attempt the delivery is listed in your workspace with its status code and error, and can be replayed with the original payload."],
            ["Signed so you can verify it", "Each webhook carries X-GainingDocx-Signature: sha256=… — an HMAC of the exact request body using your endpoint's secret."],
            ["Told when it gives up", "A dead-lettered delivery raises integration.delivery_failed to your other destinations, so a broken endpoint surfaces somewhere you are looking."],
          ].map(([title, body], index) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-brand-deep">
                {index + 1}
              </span>
              <span>
                <span className="font-bold">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-white/75">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 overflow-x-auto rounded-2xl bg-black/25 p-5">
          <pre className="text-sm leading-6 text-white/90">
            <code>{`// Verify before you act on a payload.
import { createHmac, timingSafeEqual } from "node:crypto";

const raw = await request.text();               // the exact bytes, not a re-serialised object
const expected = "sha256=" + createHmac("sha256", process.env.GDX_WEBHOOK_SECRET)
  .update(raw).digest("hex");
const received = request.headers.get("x-gainingdocx-signature") ?? "";

if (expected.length !== received.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
  return new Response("bad signature", { status: 401 });
}

// Already processed this event? Acknowledge and stop.
const key = request.headers.get("idempotency-key");`}</code>
          </pre>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/75">
          {INTEGRATION_EVENTS.length} event types are published, each with the fields it carries.{" "}
          <Link href="/developers#webhooks" className="font-bold text-[var(--amber)] underline">
            See the full event reference
          </Link>
          .
        </p>
      </section>

      {/* The catalogue. */}
      {groups.map((group) => {
        const ordered = [...group.entries].sort(
          (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
        );
        return (
          <section key={group.category} id={group.category} className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {ordered.map((entry) => (
                <ConnectorCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">Integration questions</h2>
        <dl className="mt-6 space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <dt className="font-bold text-brand-deep">{faq.q}</dt>
              <dd className="mt-1.5 max-w-3xl leading-7 text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 rounded-2xl border border-border bg-surface-alt p-6">
        <p className="font-bold text-brand-deep">Connect your first destination</p>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Add a Slack channel or a signed endpoint in your workspace and send a test event to it before
          you write any code against it.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/integrations" className="rounded-xl bg-signal px-4 py-2.5 text-sm font-bold text-white hover:bg-signal/90">
            Open Integrations
          </Link>
          <Link href="/developers" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-primary hover:border-signal">
            Read the API reference
          </Link>
          <Link href="/contact" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-primary hover:border-signal">
            Ask about a system not listed
          </Link>
        </div>
      </div>
    </div>
  );
}
