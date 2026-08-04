import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleCheck,
  GitCompareArrows,
  Layers,
  LibraryBig,
  Mail,
  Plane,
  Ship,
  Sparkles,
  Upload,
  FileStack,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BackdropMark } from "@/components/ui/backdrop-mark";
import { DocChain } from "@/components/marketing/doc-chain";
import { ModeFinder, type FinderMode } from "@/components/marketing/mode-finder";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { FEATURES } from "@/content/features";
import { GUIDES } from "@/content/guides";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { featureMode, parserMode, templateMode, toolMode, type FreightMode } from "@/lib/freight/mode";
import { collectionPageLd, JsonLd, webApplicationLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";
import { FLAGSHIP_WORKFLOWS, workflowLaunchHref } from "@/lib/workflows/flagship";

/**
 * The six guides surfaced on the homepage — one per major intent, spanning both
 * freight modes. Everything else lives on the categorised /guides hub.
 */
const HOMEPAGE_GUIDE_SLUGS = [
  "how-to-read-a-bill-of-lading",
  "incoterms-2020-explained",
  "chargeable-weight-calculation-air-freight",
  "demurrage-detention-calculation-guide",
  "hs-code-classification-guide",
  "how-to-calculate-cbm-for-shipping",
];

export const metadata: Metadata = {
  title: { absolute: "GainingDocx — Freight Document Manager" },
  description:
    "Forward shipment documents to a private GainingDocx email address or upload them manually, then receive structured freight checks and discrepancy results by email.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GainingDocx — Freight Document Manager",
    description: "Forward air or ocean shipment documents by email and receive AWB, B/L, invoice and packing-list checks with connected source evidence.",
    url: "/",
    type: "website",
  },
};

/** Ocean leads: it is the primary mode, so it sits first and opens by default. */
const modeGateways = [
  { mode: "ocean" as const, title: "Ocean freight", href: "/ocean-freight", icon: Ship, prompt: "Working with a B/L or container shipment?", copy: "Use ocean-specific checks for bookings, shipping instructions, B/L drafts, container data, arrival and free time.", action: "Open ocean freight" },
  { mode: "air" as const, title: "Air freight", href: "/air-freight", icon: Plane, prompt: "Working with an AWB or airport shipment?", copy: "Use air-specific checks for SLI, AWB, MAWB–HAWB consolidation, chargeable weight and dangerous-goods paperwork.", action: "Open air freight" },
  { mode: "multimodal" as const, title: "Shared trade documents", href: "/features", icon: Layers, prompt: "Working on documents used with either mode?", copy: "Use shared controls for invoices, packing lists, certificates of origin, matching, search, email intake and export.", action: "Open shared controls" },
];

const workspaceHref: Record<FreightMode, string> = {
  air: "/air-freight",
  ocean: "/ocean-freight",
  multimodal: "/features",
};

/**
 * One data source for the tabbed finder, assembled from the same content
 * collections the five separate mode-split grids used to render. Every link
 * that existed before still appears here, so the internal-link graph and the
 * collection JSON-LD are unchanged.
 */
function groupsForMode(mode: FreightMode) {
  return [
    {
      key: "workflows" as const,
      title: "Guided workflows",
      items: FLAGSHIP_WORKFLOWS.filter((workflow) => workflow.mode === mode).map((workflow) => ({
        name: workflow.name,
        href: workflowLaunchHref(workflow.key),
        meta: workflow.sequence,
      })),
    },
    {
      key: "parsers" as const,
      title: "Document parsers",
      items: PARSER_PAGES.filter((parser) => parserMode(parser.slug) === mode).map((parser) => ({
        name: parser.h1.replace("AI ", ""),
        href: `/${parser.slug}`,
      })),
    },
    {
      key: "controls" as const,
      title: "Controls",
      items: FEATURES.filter((feature) => featureMode(feature.slug) === mode).map((feature) => ({
        name: feature.name,
        href: `/features/${feature.slug}`,
      })),
    },
    {
      key: "tools" as const,
      title: "Free tools",
      items: TOOLS.filter((tool) => toolMode(tool.slug) === mode).map((tool) => ({
        name: tool.name,
        href: `/tools/${tool.slug}`,
      })),
    },
    {
      key: "templates" as const,
      title: "Templates",
      items: TEMPLATES.filter((template) => templateMode(template.slug) === mode).map((template) => ({
        name: template.name,
        href: `/templates/${template.slug}`,
      })),
    },
  ];
}

const finderModes: FinderMode[] = modeGateways.map((gateway) => ({
  mode: gateway.mode,
  title: gateway.title,
  question: gateway.prompt,
  blurb: gateway.copy,
  href: workspaceHref[gateway.mode],
  cta: gateway.action,
  groups: groupsForMode(gateway.mode),
  // An ocean or air shipment still needs the commercial paperwork and the
  // platform controls, so those repeat inside both mode panels instead of
  // living only behind the Shared tab.
  sharedGroups: gateway.mode === "multimodal" ? undefined : groupsForMode("multimodal"),
}));

const heroProof = [
  "Private address for every signed-in account",
  "Automatic result reply to the sender",
  "AWB and B/L document matching",
  "Source-linked review",
];

const steps = [
  { number: "01", title: "Choose the mode", text: "Air, Ocean or Shared" },
  { number: "02", title: "Forward or upload", text: "Add the requested document set" },
  { number: "03", title: "Compare", text: "Mode-specific rules and evidence" },
  { number: "04", title: "Resolve", text: "Report, approve and export" },
];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export default function HomePage() {
  const HOMEPAGE_GUIDES = HOMEPAGE_GUIDE_SLUGS.map((slug) => GUIDES.find((guide) => guide.slug === slug)).filter(
    (guide): guide is NonNullable<typeof guide> => Boolean(guide),
  );
  return (
    <>
      <JsonLd
        data={[
          webApplicationLd(
            "GainingDocx",
            "AI shipping document extraction, validation, matching, export and generation workspace.",
            "/",
          ),
          collectionPageLd(
            "GainingDocx shipping paperwork resources",
            "/",
            [
              ...PARSER_PAGES.map((item) => ({ name: item.h1, path: `/${item.slug}` })),
              ...FEATURES.map((item) => ({ name: item.name, path: `/features/${item.slug}` })),
              ...TOOLS.map((item) => ({ name: item.name, path: `/tools/${item.slug}` })),
              ...TEMPLATES.map((item) => ({ name: item.name, path: `/templates/${item.slug}` })),
              ...GUIDES.map((item) => ({ name: item.title, path: `/guides/${item.slug}` })),
            ],
          ),
        ]}
      />

      {/* Hero. Depth and one confident accent carry the vibrancy; the old
          full-bleed max-chroma yellow field forced every element on top of it
          to compete for attention. */}
      <section className="relative overflow-hidden bg-brand-deep">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 8% 0%, rgba(47,109,240,0.42), transparent 62%), radial-gradient(ellipse 55% 55% at 96% 12%, rgba(255,199,0,0.16), transparent 60%), radial-gradient(ellipse 80% 50% at 50% 120%, rgba(47,109,240,0.22), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#a80404] bg-[linear-gradient(180deg,#e81111,#b80404)] px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-white shadow-[0_6px_18px_-8px_rgba(232,17,17,0.9),inset_0_1px_0_rgba(255,255,255,0.3)]">
                <Sparkles className="size-3.5" aria-hidden />
                Freight document QA
              </span>
              <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.4rem]">
                Choose the freight mode.{" "}
                <span className="text-amber">Run the right paperwork check.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Start with Air or Ocean so you see only the relevant workflows and tools. Shared commercial documents stay in one clearly marked place. Forward the set by email or upload it manually.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  render={<Link href="#find" />}
                  size="lg"
                  className="h-12 bg-amber px-6 text-base font-semibold text-brand-deep hover:bg-amber/90"
                >
                  Choose Air or Ocean <ArrowRight aria-hidden />
                </Button>
                <Button
                  render={<Link href="/app/email-in" />}
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/25 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/12 hover:text-white"
                >
                  <Mail aria-hidden /> Forward by email
                </Button>
              </div>
              <Link
                href="/sample-discrepancy-report"
                className="mt-5 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
              >
                View a sample discrepancy report <ArrowRight className="size-4" aria-hidden />
              </Link>
              <ul className="mt-8 grid gap-x-5 gap-y-2.5 border-t border-white/12 pt-6 text-sm text-white/80 sm:grid-cols-2">
                {heroProof.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-positive-on-dark" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <BackdropMark />
              <DocChain />
              <p className="mt-4 text-center text-xs leading-5 text-white/55">
                Every finding links back to the exact page and printed value it came from.
              </p>
            </div>
          </div>
        </div>
        <div className="rule-amber h-1" aria-hidden />
      </section>

      {/* How it works. A light band directly under the dark hero, so the two
          read as distinct stages rather than one long blue field. */}
      <section className="section-edge bg-card" aria-label="How GainingDocx works">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="absolute left-[12%] right-[12%] top-5 hidden h-px bg-border lg:block"
              aria-hidden
            />
            {steps.map((step) => (
              <li key={step.number} className="relative flex items-start gap-3">
                <span className="counter-lg ring-4 ring-card">{step.number}</span>
                <span className="pt-1">
                  <span className="block font-semibold text-foreground">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="choose-mode" className="section-edge scroll-mt-24 bg-surface-alt" aria-labelledby="choose-mode-title">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Start here</Eyebrow>
            <h2 id="choose-mode-title" className="mt-3 text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
              Which freight mode are you working on?
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Air and Ocean have different transport records, operational risks and calculations. Choose the mode first. Use Shared only for commercial and control capabilities that genuinely apply to both.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {modeGateways.map((gateway) => {
              const ModeIcon = gateway.icon;
              return (
                <Link
                  key={gateway.mode}
                  href={gateway.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-amber/45 bg-card shadow-card transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand/8 text-brand">
                        <ModeIcon className="size-5" aria-hidden />
                      </span>
                      <strong className="font-semibold text-foreground">{gateway.title}</strong>
                    </span>
                    <FreightModeTag mode={gateway.mode} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-semibold text-brand">{gateway.prompt}</p>
                    <p className="mt-2.5 flex-1 text-sm leading-6 text-muted-foreground">{gateway.copy}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal">
                      {gateway.action}
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/app/email-in" className="inline-flex min-h-10 items-center gap-2 font-semibold text-brand underline underline-offset-4">
              <Mail className="size-4" aria-hidden />Forward documents by email
            </Link>
            <Link href="/app/scan?type=batch" className="inline-flex min-h-10 items-center gap-2 font-semibold text-brand underline underline-offset-4">
              <Upload className="size-4" aria-hidden />Upload manually
            </Link>
          </div>
        </div>
      </section>

      <section id="email-in" className="section-edge bg-card">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <Eyebrow>
              <Mail className="size-3.5" aria-hidden />Email-in is live
            </Eyebrow>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
              Forward your shipment docs. Get the discrepancy result back.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              Stop downloading attachments from an operations inbox just to upload them again. Forward the original email to your private GainingDocx address and keep the documents, extracted fields, shipment links and review trail together.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["A routing address—not another inbox", "Each account gets a unique, hard-to-guess address that delivers attachments directly into its private GainingDocx workspace."],
                ["Results return automatically", "The sender receives a secure shipment link and a discrepancy PDF when cross-document findings exist."],
                ["Practical intake limits", "Attach up to 20 PDF, JPG, PNG or WebP documents within the 25 MiB email limit."],
                ["Private and controllable", "The address is unique to your account. Pause it or replace it instantly if it is shared outside your intended team."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-border bg-surface-alt p-4">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/app/email-in" />} size="lg" className="h-12 px-6 font-semibold">
                Open email-in <ArrowRight aria-hidden />
              </Button>
              <Button render={<Link href="/app/scan?type=batch" />} size="lg" variant="outline" className="h-12 px-6 font-semibold">
                Keep using manual upload
              </Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Automated extraction supports review; verify important values against the attached source documents before operational use.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber/45 bg-card shadow-lift" aria-label="Illustration of an email-in shipment check">
            <div className="flex items-center justify-between gap-3 bg-brand-deep px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Mail className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.12em] text-white/60">Forwarded shipment email</p>
                  <p className="text-sm font-semibold">Draft documents for review</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-positive-on-dark px-2.5 py-1 text-[0.68rem] font-bold text-brand-deep">Received</span>
            </div>
            <div className="space-y-4 p-5">
              <dl className="grid grid-cols-[4.5rem_1fr] gap-y-2 rounded-xl border border-border bg-surface-alt p-4 text-sm">
                <dt className="text-muted-foreground">To</dt>
                <dd className="font-medium text-brand">Private GainingDocx address</dd>
                <dt className="text-muted-foreground">Subject</dt>
                <dd className="font-medium">FWD: Draft B/L and commercial docs</dd>
                <dt className="text-muted-foreground">Attached</dt>
                <dd className="font-medium">Bill of Lading · Invoice · Packing List</dd>
              </dl>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["3", "documents connected", "bg-brand/8 text-brand"],
                  ["2", "items to review", "bg-amber-soft text-amber-ink"],
                  ["1", "reply sent", "bg-positive-soft text-positive"],
                ].map(([value, label, tone]) => (
                  <div key={label} className={cn("rounded-xl px-3 py-3", tone)}>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <p className="text-xs font-medium">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-positive/20 bg-positive-soft p-4">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">Shipment document check is ready</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The reply includes the secure workspace link. If discrepancies are found across connected documents, the generated report is attached.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-edge bg-surface-alt" aria-labelledby="intake-choice-title">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Choose the easiest intake</Eyebrow>
            <h2 id="intake-choice-title" className="mt-3 text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
              Two ways in. The same checked shipment comes out.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Use email-in for documents already sitting in an inbox. Use manual upload for files on your computer or phone. Both routes use the same extraction, validation, matching and review workflow.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {[
              {
                icon: Mail,
                kicker: "Best for an operations inbox",
                title: "Forward by email",
                badge: "Least handling",
                accent: true,
                steps: [["1", "Copy", "Open Email-in and copy your unique intake address."], ["2", "Forward", "Keep the PDF or image attachments and send."], ["3", "Track", "Watch live status and receive the result reply."]],
                href: "/app/email-in",
                cta: "See my private intake address",
              },
              {
                icon: Upload,
                kicker: "Best for files on your device",
                title: "Upload manually",
                badge: "Always available",
                accent: false,
                steps: [["1", "Open", "Choose single-document or batch upload."], ["2", "Select", "Pick PDFs or document images from your device."], ["3", "Review", "See progress, extracted fields and shipment checks."]],
                href: "/app/scan?type=batch",
                cta: "Open manual upload",
              },
            ].map((route) => {
              const RouteIcon = route.icon;
              return (
                <article
                  key={route.title}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl bg-card shadow-card",
                    route.accent ? "border-2 border-brand" : "border border-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-10 items-center justify-center rounded-xl", route.accent ? "bg-brand text-white" : "bg-muted text-brand")}>
                        <RouteIcon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">{route.kicker}</p>
                        <h3 className="font-semibold text-foreground">{route.title}</h3>
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold", route.accent ? "bg-amber-soft text-amber-ink" : "bg-muted text-muted-foreground")}>
                      {route.badge}
                    </span>
                  </div>
                  <ol className="grid flex-1 gap-3 p-5 sm:grid-cols-3">
                    {route.steps.map(([number, title, copy]) => (
                      <li key={number} className="rounded-xl bg-surface-alt p-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[0.7rem] font-bold text-white">{number}</span>
                        <p className="mt-2.5 text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="px-5 pb-5">
                    <Button
                      render={<Link href={route.href} />}
                      variant={route.accent ? "default" : "outline"}
                      className="w-full font-semibold"
                    >
                      {route.cta} <ArrowRight aria-hidden />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="relative mt-8 overflow-hidden rounded-2xl bg-brand-deep p-6 text-white sm:p-8">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{ backgroundImage: "radial-gradient(ellipse 60% 80% at 85% 0%, rgba(47,109,240,0.35), transparent 65%)" }}
            />
            <p className="relative text-center text-xs font-semibold uppercase tracking-[0.16em] text-amber">Both paths continue here</p>
            <div className="relative mt-6 grid gap-4 md:grid-cols-3">
              {[
                [FileStack, "Extract and group", "Read fields and connect related shipment records."],
                [GitCompareArrows, "Validate and compare", "Run document rules and cross-document discrepancy checks."],
                [CircleCheck, "Review and act", "Open the shipment, verify source evidence and export or reply."],
              ].map(([Icon, title, copy], index) => {
                const FlowIcon = Icon as typeof FileStack;
                return (
                  <div key={String(title)} className="flex items-start gap-3 rounded-xl bg-white/8 p-4 ring-1 ring-inset ring-white/10">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber text-brand-deep">
                      <FlowIcon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber">0{index + 1}</p>
                      <p className="mt-0.5 font-semibold">{String(title)}</p>
                      <p className="mt-1 text-xs leading-5 text-white/65">{String(copy)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* One finder in place of the five near-identical mode-split grids that
          used to run back to back here. Same links, one organising idea. */}
      <section id="find" className="section-edge scroll-mt-24 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <Eyebrow>Everything, grouped by mode</Eyebrow>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
              Find exactly what you need in one place.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Pick your freight mode and every guided workflow, document parser, control, calculator and template for that mode appears together. Air excludes container and B/L tasks; Ocean excludes AWB and airline requirements.
            </p>
          </div>
          <div className="mt-10">
            <ModeFinder modes={finderModes} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/tools" className="inline-flex min-h-10 items-center gap-1 font-semibold text-brand">
              All {TOOLS.length} tools <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/templates" className="inline-flex min-h-10 items-center gap-1 font-semibold text-brand">
              All {TEMPLATES.length} templates <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/features" className="inline-flex min-h-10 items-center gap-1 font-semibold text-brand">
              All features <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface-alt">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:py-20">
          <div>
            <LibraryBig className="size-8 text-signal" aria-hidden />
            <Eyebrow className="mt-5">Practical knowledge</Eyebrow>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand">Know what every field means.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Plain-language guides connect shipping concepts to the parsers, calculators and templates you can use next.
            </p>
            <Button render={<Link href="/guides" />} variant="outline" size="lg" className="mt-6 bg-card font-semibold">
              Browse all {GUIDES.length} guides
            </Button>
          </div>
          {/* The library outgrew the homepage: show a representative handful and
              send the rest of the traffic to the categorised hub. */}
          <div className="grid gap-4 sm:grid-cols-2">
            {HOMEPAGE_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-2xl border border-amber/45 bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift"
              >
                <BookOpen className="size-6 text-brand" aria-hidden />
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {guide.readMinutes} min guide
                </p>
                <h3 className="mt-2 font-semibold text-foreground">{guide.title}</h3>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Read guide <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-alt px-4 pb-16 sm:px-6 lg:pb-20">
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-2xl bg-brand-deep px-6 py-10 text-white shadow-panel sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{ backgroundImage: "radial-gradient(ellipse 60% 90% at 90% 10%, rgba(47,109,240,0.4), transparent 62%), radial-gradient(ellipse 50% 70% at 5% 90%, rgba(255,199,0,0.12), transparent 60%)" }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">Built around real paperwork</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              See why GainingDocx exists and how the workflow fits together.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-white/70">
              Our About page gives a visual tour of the documents, checks, tools, templates and outputs behind Freight Document Manager.
            </p>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button render={<Link href="/about" />} size="lg" className="h-12 bg-amber px-6 font-semibold text-brand-deep hover:bg-amber/90">
              Explore our approach <ArrowRight aria-hidden />
            </Button>
            <Link href="/app/scan" className="inline-flex min-h-11 items-center justify-center font-semibold text-white underline decoration-white/30 underline-offset-4">
              Try one document
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
