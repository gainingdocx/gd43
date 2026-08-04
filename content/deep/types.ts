// Long-form editorial content shared by the tool, template, parser and feature
// landing pages. The four `[slug]` route components each own their interactive
// widget and hero; everything below the widget comes from here so that one
// component set renders the same depth of copy across all four families.
//
// Keep this module free of JSX — it is imported by `app/sitemap.ts` and by the
// hub pages, which must stay serialisable.

import type { Faq } from "@/lib/seo/jsonld";

export interface DeepTable {
  /** Rendered above the table as a caption element, and used as its aria-label. */
  caption?: string;
  columns: string[];
  rows: string[][];
  /** Short note rendered under the table, e.g. a rounding or source caveat. */
  note?: string;
}

export interface DeepSubsection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export type CalloutTone = "info" | "warn" | "check";

export interface DeepCallout {
  title: string;
  body: string;
  tone?: CalloutTone;
}

export interface DeepSection {
  /** Rendered as an <h2> and used as the table-of-contents entry. */
  heading: string;
  paragraphs?: string[];
  /** Unordered supporting points. */
  bullets?: string[];
  /** Ordered procedure steps; also feeds HowTo structured data when requested. */
  numbered?: string[];
  table?: DeepTable;
  callout?: DeepCallout;
  /** Rendered as <h3> blocks inside the section. */
  subsections?: DeepSubsection[];
}

export interface RelatedLink {
  href: string;
  label: string;
  blurb: string;
}

/**
 * A short, direct answer placed immediately under the H1-level intro. This is
 * the block that search engines lift for featured snippets, so it must answer
 * the page's primary query in two or three sentences without preamble.
 */
export interface QuickAnswer {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface DeepContent {
  /** Primary and secondary search terms the page is written to satisfy. */
  keywords: string[];
  quickAnswer: QuickAnswer;
  sections: DeepSection[];
  faqs: Faq[];
  related: RelatedLink[];
  /** ISO date; surfaces as a visible "Updated" stamp and in structured data. */
  updated?: string;
}

export type DeepContentMap = Record<string, DeepContent>;

/** Slug-keyed lookup that tolerates a missing entry during incremental rollout. */
export function deepContent(map: DeepContentMap, slug: string): DeepContent | undefined {
  return map[slug];
}

/**
 * Ordered procedure steps across every section, used to build HowTo structured
 * data without duplicating the copy in a second place.
 */
export function deepSteps(content: DeepContent | undefined): string[] {
  if (!content) return [];
  return content.sections.flatMap((section) => section.numbered ?? []);
}
