// The searchable index over everything published on the site.
//
// Built once per worker isolate and cached in module scope. All sources are
// static TypeScript already bundled for the marketing routes, so indexing adds
// no network calls and no new payload — it re-reads what the pages themselves
// import.
//
// Two record granularities live in one index on purpose:
//   - page records, which answer navigational queries ("cbm calculator")
//   - answer records, one per FAQ and quick-answer, which answer informational
//     queries ("how do I calculate chargeable weight") with the actual prose
//     rather than a link the user still has to open.
// The engine ranks them together and the UI presents an answer record that wins
// as a direct answer card.

import { FEATURE_DEEP } from "@/content/deep/features";
import { PARSER_DEEP } from "@/content/deep/parsers";
import { TEMPLATE_DEEP } from "@/content/deep/templates";
import { TOOL_DEEP } from "@/content/deep/tools";
import type { DeepContent } from "@/content/deep/types";
import { FEATURES } from "@/content/features";
import { GUIDES } from "@/content/guides";
import { PARSER_PAGES } from "@/content/parsers";
import { FEATURE_SEO, PARSER_SEO, TEMPLATE_SEO, TOOL_SEO } from "@/content/seo-copy";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";

export type SearchKind =
  | "answer"
  | "tool"
  | "template"
  | "parser"
  | "feature"
  | "guide"
  | "hub"
  | "page";

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  url: string;
  description: string;
  /** High-signal terms; weighted just under the title. */
  keywords: string[];
  /** Section headings, weighted between keywords and body. */
  headings: string[];
  /** Flattened prose, weighted lowest but what makes snippets possible. */
  body: string;
  /** Present only on `answer` records: the prose to show directly. */
  answer?: string;
  /** Page an answer was lifted from, for attribution in the UI. */
  parentTitle?: string;
  updated?: string;
}

/** Section headings and prose from a deep-content entry, flattened for indexing. */
function deepText(deep: DeepContent | undefined): { headings: string[]; body: string } {
  if (!deep) return { headings: [], body: "" };
  const headings: string[] = [];
  const parts: string[] = [deep.quickAnswer.heading, deep.quickAnswer.body];

  for (const section of deep.sections) {
    headings.push(section.heading);
    if (section.paragraphs) parts.push(...section.paragraphs);
    if (section.bullets) parts.push(...section.bullets);
    if (section.numbered) parts.push(...section.numbered);
    if (section.callout) parts.push(section.callout.title, section.callout.body);
    for (const sub of section.subsections ?? []) {
      headings.push(sub.heading);
      parts.push(...sub.paragraphs);
      if (sub.bullets) parts.push(...sub.bullets);
    }
    if (section.table) {
      if (section.table.caption) parts.push(section.table.caption);
      parts.push(section.table.columns.join(" "));
      for (const row of section.table.rows) parts.push(row.join(" "));
    }
  }
  return { headings, body: parts.join(" ") };
}

/** One answer record per FAQ, plus the quick answer, for a deep-content page. */
function answerDocs(deep: DeepContent | undefined, url: string, parentTitle: string): SearchDoc[] {
  if (!deep) return [];
  const docs: SearchDoc[] = [
    {
      id: `${url}#quick`,
      kind: "answer",
      title: deep.quickAnswer.heading,
      url,
      description: parentTitle,
      keywords: deep.keywords,
      headings: [],
      body: [deep.quickAnswer.body, ...(deep.quickAnswer.bullets ?? [])].join(" "),
      answer: deep.quickAnswer.body,
      parentTitle,
      updated: deep.updated,
    },
  ];
  deep.faqs.forEach((faq, i) => {
    docs.push({
      id: `${url}#faq-${i}`,
      kind: "answer",
      title: faq.q,
      url,
      description: parentTitle,
      keywords: [],
      headings: [],
      body: `${faq.q} ${faq.a}`,
      answer: faq.a,
      parentTitle,
      updated: deep.updated,
    });
  });
  return docs;
}

/** Hubs and standalone pages have no content module, so they are declared here. */
const STATIC_PAGES: { url: string; title: string; description: string; keywords: string[]; kind: SearchKind }[] = [
  { url: "/", title: "GainingDocx — Freight Document Manager", description: "Air and ocean freight document QA for forwarders and exporters. Extract, validate and reconcile shipping paperwork.", keywords: ["home", "freight document", "shipping document software", "document automation"], kind: "page" },
  { url: "/document-parsers", title: "Shipping Document Parsers", description: "Every document-specific parser, grouped by freight mode.", keywords: ["parsers", "ocr", "extraction", "document types"], kind: "hub" },
  { url: "/tools", title: "Free Freight Tools and Calculators", description: "Calculators and checkers that run without an account.", keywords: ["calculator", "tools", "free", "checker"], kind: "hub" },
  { url: "/templates", title: "Shipping Document Templates", description: "Editable worksheets and templates for freight paperwork.", keywords: ["template", "worksheet", "form", "download"], kind: "hub" },
  { url: "/features", title: "Features", description: "What GainingDocx does across extraction, validation and reconciliation.", keywords: ["features", "capabilities", "product"], kind: "hub" },
  { url: "/guides", title: "Shipping and Freight Guides", description: "Practical guides to freight documents, Incoterms, classification and charges.", keywords: ["guide", "how to", "learn", "reference"], kind: "hub" },
  { url: "/pricing", title: "Pricing and Plans", description: "Plans, what is included at each tier, and what the free tier covers.", keywords: ["pricing", "price", "cost", "plan", "subscription", "billing", "free", "how much"], kind: "page" },
  { url: "/air-freight", title: "Air Freight Document Automation", description: "Air waybills, chargeable weight and dangerous goods paperwork.", keywords: ["air", "awb", "air freight", "airfreight"], kind: "page" },
  { url: "/ocean-freight", title: "Ocean Freight Document Automation", description: "Bills of lading, containers and arrival notices for container shipping.", keywords: ["ocean", "sea", "container", "maritime"], kind: "page" },
  { url: "/integrations", title: "Integrations", description: "Connect a TMS, accounting system, cloud storage or chat channel — and see exactly what each connector does.", keywords: ["integration", "integrations", "connector", "cargowise", "tally", "quickbooks", "xero", "zoho", "slack", "teams", "zapier", "make", "n8n", "netsuite", "sap", "tms", "erp", "webhook", "connect"], kind: "hub" },
  { url: "/developers", title: "API Reference", description: "REST endpoints, authentication, webhooks and the OpenAPI spec.", keywords: ["api", "developer", "developers", "rest", "endpoint", "openapi", "webhook", "bearer", "key", "integrate", "sdk"], kind: "hub" },
  { url: "/about", title: "About GainingDocx", description: "Who builds GainingDocx and why.", keywords: ["about", "company", "team"], kind: "page" },
  { url: "/contact", title: "Contact", description: "How to reach the team for support or questions.", keywords: ["contact", "support", "help", "email"], kind: "page" },
  { url: "/trust", title: "Trust", description: "How documents are handled, stored and deleted.", keywords: ["trust", "data", "handling", "confidence"], kind: "page" },
  { url: "/security", title: "Security", description: "Access control, storage and the security model.", keywords: ["security", "encryption", "access", "secure"], kind: "page" },
  { url: "/privacy", title: "Privacy Policy", description: "What data is collected, why, and how to have it deleted.", keywords: ["privacy", "gdpr", "data", "retention", "delete", "policy"], kind: "page" },
  { url: "/terms", title: "Terms of Service", description: "The terms that govern use of GainingDocx.", keywords: ["terms", "legal", "conditions", "service"], kind: "page" },
  { url: "/accuracy-and-limitations", title: "Accuracy and Limitations", description: "What extraction can and cannot be relied on to do.", keywords: ["accuracy", "limitations", "confidence", "reliable", "error"], kind: "page" },
  { url: "/standards", title: "Standards Referenced", description: "The published standards the validation rules implement.", keywords: ["standards", "iso 6346", "unlocode", "iata", "compliance"], kind: "page" },
  { url: "/sample-discrepancy-report", title: "Sample Discrepancy Report", description: "An example of the review output produced for a shipment.", keywords: ["sample", "example", "report", "discrepancy", "demo"], kind: "page" },
];

/**
 * Slug words, added to a page's keywords.
 *
 * Slugs are hand-written and keyword-dense — `packing-list-template`,
 * `chargeable-weight-calculator` — so they carry the exact nouns people type
 * when they are naming a thing rather than asking about it. Indexing them costs
 * nothing and rewards the page whose slug is the tightest match.
 */
function slugWords(url: string): string[] {
  return url.split("/").filter(Boolean).flatMap((segment) => segment.split("-"));
}

let cached: SearchDoc[] | null = null;

export function buildCorpus(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const page of STATIC_PAGES) {
    docs.push({ ...page, id: page.url, headings: [], body: page.description });
  }

  for (const tool of TOOLS) {
    const deep = TOOL_DEEP[tool.slug];
    const seo = TOOL_SEO[tool.slug];
    const url = `/tools/${tool.slug}`;
    const { headings, body } = deepText(deep);
    docs.push({
      id: url,
      kind: "tool",
      title: seo?.h1 ?? tool.name,
      url,
      description: tool.description,
      keywords: [tool.name, ...slugWords(url), ...(deep?.keywords ?? [])],
      headings,
      body: `${tool.intro} ${body}`,
      updated: deep?.updated,
    });
    docs.push(...answerDocs(deep, url, seo?.h1 ?? tool.name));
  }

  for (const template of TEMPLATES) {
    const deep = TEMPLATE_DEEP[template.slug];
    const seo = TEMPLATE_SEO[template.slug];
    const url = `/templates/${template.slug}`;
    const { headings, body } = deepText(deep);
    docs.push({
      id: url,
      kind: "template",
      title: seo?.h1 ?? template.name,
      url,
      description: template.description,
      keywords: [template.name, "template", ...slugWords(url), ...(deep?.keywords ?? [])],
      headings,
      body,
      updated: deep?.updated,
    });
    docs.push(...answerDocs(deep, url, seo?.h1 ?? template.name));
  }

  for (const parser of PARSER_PAGES) {
    const deep = PARSER_DEEP[parser.slug];
    const seo = PARSER_SEO[parser.slug];
    const url = `/${parser.slug}`;
    const { headings, body } = deepText(deep);
    docs.push({
      id: url,
      kind: "parser",
      title: seo?.h1 ?? parser.h1,
      url,
      description: parser.metaDescription,
      keywords: [parser.h1, "parser", "ocr", "extract", ...slugWords(url), ...(deep?.keywords ?? [])],
      headings: [...headings, ...(seo?.headings ?? [])],
      body: [...parser.intro, ...parser.extracted, ...parser.checks, body].join(" "),
      updated: deep?.updated,
    });
    for (const faq of parser.faqs) {
      docs.push({
        id: `${url}#pfaq-${faq.q.slice(0, 24)}`,
        kind: "answer",
        title: faq.q,
        url,
        description: seo?.h1 ?? parser.h1,
        keywords: [],
        headings: [],
        body: `${faq.q} ${faq.a}`,
        answer: faq.a,
        parentTitle: seo?.h1 ?? parser.h1,
      });
    }
    docs.push(...answerDocs(deep, url, seo?.h1 ?? parser.h1));
  }

  for (const feature of FEATURES) {
    const deep = FEATURE_DEEP[feature.slug];
    const seo = FEATURE_SEO[feature.slug];
    const url = `/features/${feature.slug}`;
    const { headings, body } = deepText(deep);
    docs.push({
      id: url,
      kind: "feature",
      title: seo?.h1 ?? feature.name,
      url,
      description: feature.description,
      keywords: [feature.name, feature.eyebrow, ...slugWords(url), ...(deep?.keywords ?? [])],
      headings,
      body: [...feature.overview, ...feature.benefits, ...feature.workflow, body].join(" "),
      updated: deep?.updated,
    });
    for (const faq of feature.faqs) {
      docs.push({
        id: `${url}#ffaq-${faq.q.slice(0, 24)}`,
        kind: "answer",
        title: faq.q,
        url,
        description: seo?.h1 ?? feature.name,
        keywords: [],
        headings: [],
        body: `${faq.q} ${faq.a}`,
        answer: faq.a,
        parentTitle: seo?.h1 ?? feature.name,
      });
    }
    docs.push(...answerDocs(deep, url, seo?.h1 ?? feature.name));
  }

  for (const guide of GUIDES) {
    const url = `/guides/${guide.slug}`;
    const headings: string[] = [];
    const parts: string[] = [];
    for (const section of guide.sections) {
      headings.push(section.heading);
      if (section.paragraphs) parts.push(...section.paragraphs);
      if (section.bullets) parts.push(...section.bullets);
      if (section.table) {
        if (section.table.caption) parts.push(section.table.caption);
        parts.push(section.table.columns.join(" "));
        for (const row of section.table.rows) parts.push(row.join(" "));
      }
    }
    docs.push({
      id: url,
      kind: "guide",
      title: guide.title,
      url,
      description: guide.description,
      keywords: [...(guide.keywords ?? []), "guide", ...slugWords(url)],
      headings,
      body: parts.join(" "),
      updated: guide.updated,
    });
    for (const faq of guide.faqs ?? []) {
      docs.push({
        id: `${url}#gfaq-${faq.q.slice(0, 24)}`,
        kind: "answer",
        title: faq.q,
        url,
        description: guide.title,
        keywords: [],
        headings: [],
        body: `${faq.q} ${faq.a}`,
        answer: faq.a,
        parentTitle: guide.title,
        updated: guide.updated,
      });
    }
  }

  return dedupeAnswers(docs);
}

/**
 * Collapse answer records that ask the same question.
 *
 * Two sources feed duplicates. Parser and feature pages contribute FAQs both
 * from their own module and from their deep content, and the generic SaaS
 * questions ("Do I need an account?", "How much does it cost?") are repeated
 * verbatim across a dozen pages by design — they belong on each page, but as
 * search results they would crowd out the page that actually answers the query.
 * First occurrence wins; page records are never touched.
 */
function dedupeAnswers(docs: SearchDoc[]): SearchDoc[] {
  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (doc.kind !== "answer") return true;
    const key = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function corpus(): SearchDoc[] {
  if (!cached) cached = buildCorpus();
  return cached;
}
