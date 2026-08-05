// Ranking over the site corpus.
//
// BM25-style term saturation with per-field weights, then two multipliers that
// matter more than the base score on a corpus this small:
//
//   coverage — the fraction of the user's own terms a document matched. A page
//   mentioning "container" once should never outrank one matching all of
//   "container number check digit". Without this, long bodies win everything.
//
//   kind prior — a small nudge so that when scores are close, a tool beats a
//   guide *about* that tool for a bare navigational query. Deliberately small;
//   it breaks ties, it does not overturn relevance.
//
// Typo tolerance is a fallback, not a default: a term is fuzzy-matched only when
// it has no exact posting anywhere, which keeps "port" from quietly matching
// "post" while real results exist.

import type { SearchDoc, SearchKind } from "./corpus";
import { corpus } from "./corpus";
import { expandQuery, normalize, tokenize } from "./synonyms";

const FIELD_WEIGHT = { title: 12, keywords: 7, headings: 3.5, body: 1 } as const;
/** Synonym-derived terms score below terms the user actually typed. */
const ALIAS_WEIGHT = 0.45;
const K1 = 1.4;
const B = 0.7;

/**
 * Destinations outrank prose.
 *
 * The palette is first a way to *reach* a tool, template, parser or feature, and
 * only second a way to read about one. Early tuning had answers only a hair
 * below tools, and because an FAQ title is short it wins the title field on
 * term density alone — "container number check" returned three answers and left
 * the actual calculator off the first page. These priors are wide enough that a
 * page beats its own FAQ on a naming query, and narrow enough that a genuinely
 * better prose match still surfaces.
 *
 * `answer` is scored separately in ANSWER_PRIOR because its value depends
 * entirely on whether the user asked a question.
 */
const KIND_PRIOR: Record<Exclude<SearchKind, "answer">, number> = {
  tool: 1.5,
  parser: 1.45,
  template: 1.4,
  feature: 1.35,
  hub: 1.25,
  page: 1.12,
  guide: 1.05,
};

/**
 * A question ("how is chargeable weight calculated") wants the prose. A name
 * ("chargeable weight calculator") wants the tool. Same corpus, opposite intent,
 * so the answer prior flips with the shape of the query.
 */
const ANSWER_PRIOR = { question: 1.3, lookup: 0.72 } as const;

/**
 * Exact-query shortcuts. Trade shorthand is unambiguous to the person typing it
 * and genuinely ambiguous to a scorer: "bl" appears inside "Air Waybill vs Bill
 * of Lading" as strongly as it does on the B/L parser itself. Matched against
 * the whole normalized query only — never a substring — so these pin the
 * obvious destination without distorting longer, more specific searches.
 */
const BEST_BETS: Record<string, string> = {
  bl: "/bill-of-lading-parser",
  "b l": "/bill-of-lading-parser",
  bol: "/bill-of-lading-parser",
  "bill of lading": "/bill-of-lading-parser",
  awb: "/air-waybill-parser",
  mawb: "/air-waybill-parser",
  hawb: "/air-waybill-parser",
  "air waybill": "/air-waybill-parser",
  swb: "/sea-waybill-parser",
  sli: "/shipper-letter-of-instruction-parser",
  dgd: "/dangerous-goods-declaration-parser",
  cbm: "/tools/cbm-calculator",
  vgm: "/guides/verified-gross-mass-vgm-guide",
  "hs code": "/tools/hs-code-finder",
  hts: "/tools/hs-code-finder",
  "d d": "/tools/demurrage-detention-calculator",
  dnd: "/tools/demurrage-detention-calculator",
  demurrage: "/tools/demurrage-detention-calculator",
  detention: "/tools/demurrage-detention-calculator",
  incoterms: "/guides/incoterms-2020-explained",
  incoterm: "/guides/incoterms-2020-explained",
  price: "/pricing",
  pricing: "/pricing",
  cost: "/pricing",
  plans: "/pricing",
  "how much": "/pricing",
  "how much does it cost": "/pricing",
  privacy: "/privacy",
  security: "/security",
  contact: "/contact",
  support: "/contact",
  accuracy: "/accuracy-and-limitations",
};

type FieldName = keyof typeof FIELD_WEIGHT;

interface IndexedDoc {
  doc: SearchDoc;
  fields: Record<FieldName, Map<string, number>>;
  length: number;
  normalizedTitle: string;
}

interface Index {
  docs: IndexedDoc[];
  postings: Map<string, Set<number>>;
  idf: Map<string, number>;
  avgLength: number;
  vocabulary: string[];
}

let index: Index | null = null;

function counts(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokenize(text)) map.set(token, (map.get(token) ?? 0) + 1);
  return map;
}

function buildIndex(): Index {
  const docs: IndexedDoc[] = corpus().map((doc) => {
    const fields: Record<FieldName, Map<string, number>> = {
      title: counts(doc.title),
      keywords: counts(doc.keywords.join(" ")),
      headings: counts(doc.headings.join(" ")),
      body: counts(`${doc.description} ${doc.body}`),
    };
    const length = Object.values(fields).reduce(
      (sum, map) => sum + [...map.values()].reduce((a, b) => a + b, 0),
      0
    );
    return { doc, fields, length, normalizedTitle: normalize(doc.title) };
  });

  const postings = new Map<string, Set<number>>();
  docs.forEach((entry, i) => {
    for (const map of Object.values(entry.fields)) {
      for (const term of map.keys()) {
        let set = postings.get(term);
        if (!set) postings.set(term, (set = new Set()));
        set.add(i);
      }
    }
  });

  const idf = new Map<string, number>();
  for (const [term, set] of postings) {
    idf.set(term, Math.log(1 + (docs.length - set.size + 0.5) / (set.size + 0.5)));
  }

  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(docs.length, 1);
  return { docs, postings, idf, avgLength, vocabulary: [...postings.keys()] };
}

function getIndex(): Index {
  if (!index) index = buildIndex();
  return index;
}

/** Bounded edit distance; returns Infinity once it provably exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return Infinity;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(v);
      if (v < best) best = v;
    }
    if (best > max) return Infinity;
    prev = row;
  }
  return prev[b.length];
}

/** Nearest vocabulary term for a token that matched nothing exactly. */
function fuzzyTerm(term: string, idx: Index): string | null {
  if (term.length < 4) return null;
  const max = term.length >= 7 ? 2 : 1;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of idx.vocabulary) {
    if (candidate.startsWith(term) || term.startsWith(candidate)) {
      // Prefix relationships are better signal than raw edit distance.
      if (Math.abs(candidate.length - term.length) <= 3) return candidate;
    }
    const d = editDistance(term, candidate, max);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
      if (d === 1) break;
    }
  }
  return bestDistance <= max ? best : null;
}

export interface Segment {
  text: string;
  hit: boolean;
}

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  url: string;
  description: string;
  score: number;
  /** Snippet split into plain and highlighted runs, ready to render. */
  snippet: Segment[];
  answer?: string;
  parentTitle?: string;
  updated?: string;
}

/** Split text into highlight runs around whole-word matches of `terms`. */
function highlight(text: string, terms: Set<string>): Segment[] {
  if (!text) return [];
  const segments: Segment[] = [];
  const words = text.split(/(\s+)/);
  let buffer = "";
  let bufferHit = false;

  const flush = () => {
    if (buffer) segments.push({ text: buffer, hit: bufferHit });
    buffer = "";
  };

  for (const word of words) {
    const bare = normalize(word).trim();
    const isHit = bare.length > 0 && [...terms].some((t) => bare === t || bare.startsWith(t));
    if (isHit !== bufferHit) {
      flush();
      bufferHit = isHit;
    }
    buffer += word;
  }
  flush();
  return segments;
}

/** Pick the densest ~240-character window of body text around query terms. */
function snippetFor(doc: SearchDoc, terms: Set<string>): Segment[] {
  const source = doc.answer ?? `${doc.description} ${doc.body}`.trim();
  if (!source) return [];
  const sentences = source.split(/(?<=[.!?])\s+/);

  let best = sentences[0] ?? "";
  let bestScore = -1;
  for (const sentence of sentences) {
    const tokens = tokenize(sentence);
    const score = tokens.filter((t) => terms.has(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }

  let snippet = best.trim();
  if (snippet.length > 260) snippet = `${snippet.slice(0, 257).trimEnd()}…`;
  return highlight(snippet, terms);
}

export interface SearchOptions {
  limit?: number;
  kinds?: SearchKind[];
}

export function search(rawQuery: string, options: SearchOptions = {}): SearchHit[] {
  const { limit = 20, kinds } = options;
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const idx = getIndex();
  const { terms, aliases, phrase, isQuestion } = expandQuery(query);
  const answerPrior = isQuestion ? ANSWER_PRIOR.question : ANSWER_PRIOR.lookup;
  const priorFor = (kind: SearchKind) => (kind === "answer" ? answerPrior : KIND_PRIOR[kind]);
  if (terms.length === 0 && aliases.length === 0) return [];

  // Resolve each typed term, falling back to a fuzzy neighbour only when the
  // term is unknown to the corpus entirely.
  const resolved: { term: string; weight: number; original: string }[] = [];
  for (const term of terms) {
    if (idx.postings.has(term)) {
      resolved.push({ term, weight: 1, original: term });
    } else {
      const near = fuzzyTerm(term, idx);
      if (near) resolved.push({ term: near, weight: 0.8, original: term });
    }
  }
  for (const alias of aliases) {
    if (idx.postings.has(alias)) resolved.push({ term: alias, weight: ALIAS_WEIGHT, original: alias });
  }
  if (resolved.length === 0) return [];

  const typedTerms = new Set(resolved.filter((r) => r.weight >= 0.8).map((r) => r.term));
  const highlightTerms = new Set(resolved.map((r) => r.term));

  const scores = new Map<number, { score: number; matched: Set<string> }>();

  for (const { term, weight } of resolved) {
    const posting = idx.postings.get(term);
    if (!posting) continue;
    const idf = idx.idf.get(term) ?? 0;

    for (const docId of posting) {
      const entry = idx.docs[docId];
      let termScore = 0;

      for (const field of Object.keys(FIELD_WEIGHT) as FieldName[]) {
        const tf = entry.fields[field].get(term);
        if (!tf) continue;
        const saturated =
          (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * entry.length) / idx.avgLength));
        termScore += FIELD_WEIGHT[field] * saturated;
      }

      if (termScore === 0) continue;
      const current = scores.get(docId) ?? { score: 0, matched: new Set<string>() };
      current.score += termScore * idf * weight;
      if (typedTerms.has(term)) current.matched.add(term);
      scores.set(docId, current);
    }
  }

  let results: SearchHit[] = [];
  for (const [docId, { score, matched }] of scores) {
    const entry = idx.docs[docId];
    if (kinds && !kinds.includes(entry.doc.kind)) continue;

    // Coverage: reward documents that matched more of what the user typed.
    const coverage = typedTerms.size > 0 ? matched.size / typedTerms.size : 1;
    let final = score * (0.35 + 0.65 * coverage) * priorFor(entry.doc.kind);

    // Exact phrase in the title is the strongest navigational signal there is,
    // but an answer earns less from it than a page does: generic SaaS questions
    // ("How much does it cost?") match the phrase verbatim on pages that are not
    // where the user should land.
    if (phrase.length > 2 && entry.normalizedTitle.includes(phrase)) {
      final *= entry.doc.kind === "answer" ? 1.5 : 2.6;
    }

    // Curated destination for shorthand that is unambiguous to an operator but
    // ambiguous to a scorer.
    if (BEST_BETS[phrase] === entry.doc.url && entry.doc.kind !== "answer") final *= 4;

    results.push({
      id: entry.doc.id,
      kind: entry.doc.kind,
      title: entry.doc.title,
      url: entry.doc.url,
      description: entry.doc.description,
      score: final,
      snippet: snippetFor(entry.doc, highlightTerms),
      answer: entry.doc.answer,
      parentTitle: entry.doc.parentTitle,
      updated: entry.doc.updated,
    });
  }

  results.sort((a, b) => b.score - a.score);

  // On a naming query, a page speaks for its own FAQs. Without this, searching
  // "air waybill parser" could return that page's FAQ above the page itself —
  // the right destination wearing the wrong label, and a wasted slot.
  if (!isQuestion) {
    const destinations = new Set(results.filter((hit) => hit.kind !== "answer").map((hit) => hit.url));
    results = results.filter((hit) => hit.kind !== "answer" || !destinations.has(hit.url));
  }

  // Collapse near-duplicate answers pointing at the same page: the best one
  // represents it, so one page cannot occupy five slots.
  const perUrl = new Map<string, number>();
  const deduped: SearchHit[] = [];
  for (const hit of results) {
    const seen = perUrl.get(hit.url) ?? 0;
    if (seen >= 2) continue;
    perUrl.set(hit.url, seen + 1);
    deduped.push(hit);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

/**
 * The single best answer-type hit, when the query reads as a question and that
 * hit is clearly ahead of the field. Returning nothing is the common case and
 * the right one — a weak answer card is worse than no answer card.
 */
export function directAnswer(rawQuery: string, hits: SearchHit[]): SearchHit | null {
  const { isQuestion } = expandQuery(rawQuery);
  const top = hits[0];
  if (!top || top.kind !== "answer" || !top.answer) return null;
  const runnerUp = hits.find((h) => h.kind !== "answer");
  const clear = !runnerUp || top.score > runnerUp.score * 1.15;
  return isQuestion || clear ? top : null;
}
