import type { Metadata } from "next";
import Link from "next/link";
import { Anchor, Box, ExternalLink, FileJson2, MapPinned, Scale } from "lucide-react";
import { STANDARD_SOURCES, STANDARDS_CROSSWALK_VERSION } from "@/lib/standards/crosswalk";

export const metadata: Metadata = {
  title: "Shipping Data Standards Alignment",
  description: "See how GainingDocx maps freight document data toward DCSA, UN/CEFACT, FIATA, ISO 6346, UN/LOCODE and standard Incoterms representations.",
  alternates: { canonical: "/standards" },
};

const standards = [
  { icon: Anchor, title: "DCSA Bill of Lading", state: `Crosswalk ${STANDARDS_CROSSWALK_VERSION}`, text: `The internal semantic profile is pinned to DCSA eBL ${STANDARD_SOURCES.dcsa.version} and Information Model ${STANDARD_SOURCES.dcsa.informationModel}. It is not a DCSA API payload, certification or carrier conformance claim.`, href: STANDARD_SOURCES.dcsa.url },
  { icon: FileJson2, title: "UN/CEFACT MMT RDM", state: `Crosswalk ${STANDARDS_CROSSWALK_VERSION}`, text: `Parties, locations, consignment references, equipment and goods concepts are mapped against the ${STANDARD_SOURCES.uncefact.version} public reference model for portable exchange.`, href: STANDARD_SOURCES.uncefact.url },
  { icon: Scale, title: "FIATA eFBL structures", state: `Crosswalk ${STANDARDS_CROSSWALK_VERSION}`, text: "The canonical profile maps common FBL concepts to FIATA's public eFBL model. GainingDocx does not issue a secured FIATA eFBL or act as a legally transferable eBL platform.", href: STANDARD_SOURCES.fiata.url },
  { icon: Box, title: "ISO 6346", state: "Deterministic check", text: "Container numbers are normalized and their check digits calculated. A valid number structure does not confirm ownership, physical condition, availability or current tracking state.", href: "/tools/container-number-check" },
  { icon: MapPinned, title: "UN/LOCODE", state: "Normalization and lookup", text: "Printed location codes and recognizable port names are normalized against the published UN/LOCODE dataset used by the application. Users still confirm the intended terminal and routing.", href: "/tools/port-code-lookup" },
  { icon: Scale, title: "Incoterms representation", state: "Preserve printed term", text: "The workspace preserves the printed rule and location text where available. It does not infer cost, risk or customs obligations from an incomplete term and does not replace the governing sales contract.", href: "/guides/commercial-invoice-vs-packing-list" },
];

export default function StandardsPage() {
  return <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
    <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Standards alignment</p>
    <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-primary sm:text-5xl">Portable shipping data, without pretending to be an eBL platform.</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">The immediate goal is to make reviewed document data interoperable with recognized trade and transport models. Alignment means deliberate field mapping and export semantics; it does not mean certification, legal transferability or endorsement by a standards body.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2">{standards.map(({ icon: Icon, title, state, text, href }) => {
      const external = href.startsWith("http");
      const card = <><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span><span className="rounded-full bg-[var(--amber-soft)] px-3 py-1 text-xs font-bold text-[var(--amber-ink)]">{state}</span></div><h2 className="mt-5 text-xl font-extrabold text-brand-deep">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Review reference {external && <ExternalLink className="size-3.5" aria-hidden />}</span></>;
      return external ? <a key={title} href={href} target="_blank" rel="noreferrer" className="rounded-3xl border border-amber/45 bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-lg">{card}</a> : <Link key={title} href={href} className="rounded-3xl border border-amber/45 bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-lg">{card}</Link>;
    })}</div>
    <section className="mt-8 rounded-3xl border border-amber/45 bg-white p-6"><h2 className="text-2xl font-extrabold text-brand-deep">Dangerous goods and IMDG</h2><p className="mt-3 leading-7 text-muted-foreground">The current system performs document-presence, format and cross-document consistency checks on printed dangerous-goods values. The IMO IMDG Code contains substance-specific classification, packing, marking, documentation, stowage and segregation requirements. Those broader decisions remain outside automated approval.</p><a href="https://www.imo.org/en/ourwork/safety/pages/dangerousgoods-default.aspx" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1 font-bold text-primary underline">Read the IMO overview <ExternalLink className="size-4" aria-hidden /></a></section>
    <p className="mt-6 text-xs leading-5 text-muted-foreground">Canonical exports now embed crosswalk version {STANDARDS_CROSSWALK_VERSION}, pinned public source versions, mapped-field coverage and an automated internal-profile result. This is traceable implementation metadata, not standards-body certification; use the official DCSA/FIATA validators and partner-specific schemas before exchanging a production eBL payload.</p>
  </main>;
}
