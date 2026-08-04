// Query understanding for freight vocabulary.
//
// Operators do not type the words our pages are written in. They type "bl",
// "awb", "d&d", "dim weight" — trade shorthand, often with the punctuation that
// makes it ambiguous to a tokenizer. A generic index scores those at zero, so
// this map is the single largest accuracy lever in the whole search: it turns
// what the user typed into what the corpus says.
//
// Expansion is one-directional and additive. A query token contributes its
// aliases as *extra* matchable terms; the original token is always kept, and a
// document matching the original still scores higher than one matching only an
// alias (see ALIAS_WEIGHT in engine.ts). That keeps "bill of lading" ranked
// above a page that merely mentions "B/L" in passing.

/**
 * Canonical expansions, keyed by the normalized form of what a user types.
 * Multi-word keys are matched as phrases against the normalized query before
 * single tokens are considered.
 */
export const SYNONYMS: Record<string, string[]> = {
  // ---- Transport documents -------------------------------------------------
  bl: ["bill", "lading", "ocean", "transport", "document"],
  bol: ["bill", "lading"],
  "b l": ["bill", "lading"],
  lading: ["bill", "bl"],
  swb: ["sea", "waybill"],
  awb: ["air", "waybill"],
  mawb: ["master", "air", "waybill"],
  hawb: ["house", "air", "waybill"],
  "air bill": ["air", "waybill", "awb"],
  sli: ["shipper", "letter", "instruction"],
  dgd: ["dangerous", "goods", "declaration"],
  do: ["delivery", "order"],
  si: ["shipping", "instructions"],
  manifest: ["cargo", "manifest", "air"],

  // ---- Commercial documents ------------------------------------------------
  ci: ["commercial", "invoice"],
  pl: ["packing", "list"],
  po: ["purchase", "order"],
  "p o": ["purchase", "order"],
  grn: ["goods", "receipt"],
  lc: ["letter", "credit", "documentary"],
  "l c": ["letter", "credit"],

  // ---- Measurement and rating ---------------------------------------------
  cbm: ["cubic", "metre", "meter", "volume"],
  m3: ["cubic", "metre", "cbm", "volume"],
  vgm: ["verified", "gross", "mass", "weight"],
  "dim weight": ["dimensional", "volumetric", "chargeable", "weight"],
  "dimensional weight": ["volumetric", "chargeable", "weight"],
  "volumetric weight": ["chargeable", "weight", "divisor"],
  "wm": ["weight", "measurement", "revenue", "ton"],
  "w m": ["weight", "measurement", "revenue", "ton"],
  teu: ["container", "twenty", "equivalent"],
  feu: ["container", "forty", "equivalent"],
  gp: ["general", "purpose", "container"],
  hc: ["high", "cube", "container"],

  // ---- Loads, charges, routing --------------------------------------------
  fcl: ["full", "container", "load"],
  lcl: ["less", "container", "load", "consolidation"],
  dnd: ["demurrage", "detention"],
  "d d": ["demurrage", "detention"],
  demurrage: ["detention", "free", "time", "charges"],
  pol: ["port", "loading"],
  pod: ["port", "discharge"],
  locode: ["unlocode", "port", "code", "location"],
  unlocode: ["port", "code", "location"],
  eta: ["arrival", "estimated"],
  etd: ["departure", "estimated"],

  // ---- Customs and classification -----------------------------------------
  hs: ["harmonized", "system", "code", "tariff", "classification"],
  hts: ["harmonized", "tariff", "schedule", "code", "classification"],
  "hs code": ["harmonized", "tariff", "classification", "duty"],
  tariff: ["duty", "hs", "classification"],
  incoterm: ["incoterms", "trade", "terms", "delivery"],
  incoterms: ["trade", "terms", "exw", "fob", "cif", "ddp"],
  fob: ["incoterms", "free", "board"],
  cif: ["incoterms", "cost", "insurance", "freight"],
  exw: ["incoterms", "ex", "works"],
  ddp: ["incoterms", "delivered", "duty", "paid"],
  origin: ["rules", "origin", "preferential", "certificate"],
  iso6346: ["container", "number", "check", "digit"],
  "iso 6346": ["container", "number", "check", "digit"],

  // ---- What the product does ----------------------------------------------
  ocr: ["extract", "extraction", "scan", "read", "parser", "data"],
  extract: ["extraction", "parser", "ocr", "data"],
  parse: ["parser", "extract", "extraction"],
  scan: ["upload", "extract", "ocr", "document"],
  validate: ["validation", "check", "verify", "discrepancy"],
  discrepancy: ["mismatch", "difference", "validation", "finding"],
  match: ["matching", "compare", "reconcile", "three", "way"],
  "3 way": ["three", "way", "matching", "reconcile"],
  "three way": ["matching", "reconcile", "invoice", "receipt"],
  reconcile: ["matching", "reconciliation", "compare"],
  audit: ["check", "verify", "invoice", "review"],

  // ---- SaaS and account intent --------------------------------------------
  price: ["pricing", "cost", "plan", "plans", "subscription"],
  pricing: ["price", "cost", "plan", "plans"],
  cost: ["price", "pricing", "plan"],
  "how much": ["price", "pricing", "cost", "plan"],
  free: ["pricing", "trial", "account", "cost"],
  trial: ["free", "pricing", "plan"],
  plan: ["pricing", "subscription", "plans"],
  subscription: ["pricing", "plan", "billing", "cancel"],
  billing: ["subscription", "pricing", "payment", "plan"],
  cancel: ["subscription", "cancel", "billing", "refund"],
  refund: ["billing", "subscription", "cancel"],
  login: ["log", "sign", "account", "signin"],
  signin: ["sign", "login", "account"],
  signup: ["sign", "register", "account", "create"],
  register: ["sign", "signup", "account", "create"],
  account: ["workspace", "profile", "sign", "settings"],
  password: ["reset", "forgot", "account", "sign"],

  // ---- Output and integration ---------------------------------------------
  export: ["download", "excel", "csv", "json", "xlsx", "pdf"],
  download: ["export", "excel", "csv", "pdf"],
  excel: ["xlsx", "export", "spreadsheet", "workbook"],
  xlsx: ["excel", "export", "spreadsheet"],
  csv: ["export", "download", "flat"],
  json: ["export", "api", "structured"],
  api: ["integration", "connector", "webhook", "developer"],
  integration: ["api", "connector", "webhook"],
  webhook: ["api", "integration", "connector"],
  erp: ["integration", "connector", "api", "system"],

  // ---- Trust ---------------------------------------------------------------
  privacy: ["data", "gdpr", "retention", "delete", "security"],
  private: ["privacy", "confidential", "data", "security", "retention"],
  confidential: ["privacy", "private", "security", "data"],
  retention: ["privacy", "delete", "data", "storage"],
  store: ["storage", "retention", "privacy", "data"],
  storage: ["retention", "privacy", "data"],
  gdpr: ["privacy", "data", "retention", "compliance"],
  secure: ["security", "privacy", "encryption", "trust"],
  security: ["privacy", "trust", "encryption", "data"],
  delete: ["retention", "privacy", "remove", "data"],
  accurate: ["accuracy", "limitations", "confidence", "validation"],
  accuracy: ["limitations", "accurate", "validation"],
  support: ["contact", "help", "email"],
  help: ["support", "contact", "guide"],
};

/**
 * Words carrying no discriminating power in a corpus that is *entirely* about
 * freight documents. Dropping "shipping" from "shipping document parser" is
 * what stops every page tying for first place.
 */
export const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
  "for", "from", "get", "has", "have", "how", "i", "in", "is", "it", "its",
  "me", "my", "of", "on", "or", "that", "the", "their", "them", "there",
  "these", "this", "to", "was", "what", "when", "where", "which", "who",
  "why", "will", "with", "you", "your",
]);

/** Question openers that signal the user wants an answer, not a page. */
const QUESTION_WORDS = /^(what|how|why|when|where|which|who|can|do|does|is|are|should|must|will)\b/i;

export function looksLikeQuestion(raw: string): boolean {
  return raw.includes("?") || QUESTION_WORDS.test(raw.trim());
}

/**
 * Lowercase, strip punctuation that splits trade shorthand ("B/L" -> "b l"),
 * and collapse whitespace. Kept deliberately simple: aggressive stemming hurts
 * a corpus this small, where "container" and "containers" both appear verbatim.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Naive plural fold, applied only where it cannot destroy a real term. */
export function singularize(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("es") && !token.endsWith("ses")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function tokenize(text: string, keepStopwords = false): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 0 && (keepStopwords || !STOPWORDS.has(t)))
    .map(singularize);
}

export interface ExpandedQuery {
  /** Tokens the user actually typed (minus stopwords). */
  terms: string[];
  /** Extra terms contributed by synonym expansion, scored lower. */
  aliases: string[];
  /** The normalized full string, for phrase matching. */
  phrase: string;
  isQuestion: boolean;
}

export function expandQuery(raw: string): ExpandedQuery {
  const phrase = normalize(raw);
  const terms = tokenize(raw);
  const aliases = new Set<string>();

  // Multi-word aliases first, so "hs code" and "three way" beat their parts.
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (key.includes(" ") && phrase.includes(key)) {
      for (const v of values) aliases.add(singularize(v));
    }
  }
  for (const token of terms) {
    for (const v of SYNONYMS[token] ?? []) aliases.add(singularize(v));
  }
  for (const t of terms) aliases.delete(t);

  return { terms, aliases: [...aliases], phrase, isQuestion: looksLikeQuestion(raw) };
}
