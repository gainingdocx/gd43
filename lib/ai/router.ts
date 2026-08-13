// Single entry point to the AI layer (BUILD_SPEC §M3): parseDocument().
// Attempt ladder: OpenRouter Gemma fast streaming → non-stream, with Gemma
// dense escalation only when deterministic content-quality checks require it.
// One content-quality escalation retry (invalid JSON or ≥3 empty critical
// fields). The model only transcribes — validation/math live in TypeScript.

import {
  MAX_OUTPUT_TOKENS,
  MODEL_ESCALATION,
  MODEL_PRIMARY,
  OPENROUTER_BASE_URL,
  PROVIDER_PREFS,
  QUALITY_RETRY_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  USE_JSON_SCHEMA,
} from "./config";
import { tolerantParse, repairJson } from "./json";
import { pageImagesAsOcrPdf } from "./image-pdf";
import { evidenceSupports, rowsMatchOwnTotal } from "./merge-policy";
import { buildUserText, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompts/extract-v3";
import {
  EXTRACTION_JSON_SCHEMA,
  extractionQualityScore,
  needsQualityEscalation,
  normalizeModelOutput,
  type NormalizedExtraction,
} from "./schemas/extraction-v2";
import { logInfo, logWarn } from "@/lib/observability/logger";

export type ParseProvider = "openrouter";

export interface ParseResult {
  extraction: NormalizedExtraction;
  model: string;
  provider: ParseProvider;
  escalated: boolean;
  promptVersion: string;
  /** Deterministic extraction completeness (not a confidence probability). */
  qualityScore: number;
  /** Raw text of the winning model response (stored as raw_extraction). */
  rawText: string;
}

export interface ParseCallbacks {
  /** Called with the latest partial extraction while streaming. */
  onPartial?: (partial: unknown) => void;
  /** Called when the router moves to a fallback attempt or escalates. */
  onStatus?: (status: string) => void;
  /** Correlates internal diagnostics with a user-safe support reference. */
  requestId?: string;
}

export type DocumentInput =
  | { kind: "image"; url: string }
  | { kind: "pdf"; url: string; filename: string };

interface Attempt {
  provider: ParseProvider;
  base: string;
  apiKey: string | undefined;
  model: string;
  stream: boolean;
  timeoutMs?: number;
  /** OpenRouter PDF preprocessing. Cloudflare AI is deliberately unsupported:
   * browser/API uploads are page images sent straight to Gemma, while an
   * emailed PDF uses OpenRouter's scan-capable Mistral OCR before Gemma. */
  pdfEngine?: "mistral-ocr" | "native";
}

function buildMessages(inputs: DocumentInput[], docTypeHint?: string) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: buildUserText(docTypeHint) },
        ...inputs.map((input) => input.kind === "pdf"
          ? { type: "file", file: { filename: input.filename, file_data: input.url } }
          : { type: "image_url", image_url: { url: input.url, detail: "high" } }),
      ],
    },
  ];
}

async function callModel(
  attempt: Attempt,
  inputs: DocumentInput[],
  docTypeHint: string | undefined,
  useJsonSchema: boolean,
  onPartial?: (partial: unknown) => void
): Promise<string> {
  if (!attempt.apiKey) throw new Error(`${attempt.provider}: no API key`);

  const body: Record<string, unknown> = {
    model: attempt.model,
    messages: buildMessages(inputs, docTypeHint),
    stream: attempt.stream,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0,
  };
  if (useJsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: EXTRACTION_JSON_SCHEMA,
    };
  }
  if (attempt.provider === "openrouter") {
    body.provider = PROVIDER_PREFS;
    if (inputs.some((input) => input.kind === "pdf")) {
      body.plugins = [{ id: "file-parser", pdf: { engine: attempt.pdfEngine ?? "mistral-ocr" } }];
    }
  }

  const res = await fetch(`${attempt.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${attempt.apiKey}`,
      "Content-Type": "application/json",
      ...(attempt.provider === "openrouter"
        ? {
            "HTTP-Referer": "https://gainingdocx.com",
            "X-Title": "GainingDocx",
          }
        : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(attempt.timeoutMs ?? REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    const err = new Error(
      `${attempt.provider} ${res.status}: ${detail}`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (!attempt.stream) {
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error(`${attempt.provider}: empty completion`);
    return text;
  }

  // SSE stream: accumulate delta text, surface partial parses.
  if (!res.body) throw new Error(`${attempt.provider}: no response body`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let lastEmit = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        text += chunk.choices?.[0]?.delta?.content ?? "";
      } catch {
        // Ignore malformed keep-alive chunks.
      }
    }
    if (onPartial && text.length - lastEmit > 200) {
      lastEmit = text.length;
      const partial = tolerantParse(text);
      if (partial !== null) onPartial(partial);
    }
  }
  if (!text) throw new Error(`${attempt.provider}: empty stream`);
  return text;
}

function parseToExtraction(rawText: string): NormalizedExtraction {
  return normalizeModelOutput(repairJson(rawText), PROMPT_VERSION);
}

function markLowQuality(extraction: NormalizedExtraction, qualityScore: number) {
  const threshold = extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill"
    ? 82
    : 60;
  if (qualityScore >= threshold) return;
  const flag = `low_quality:${qualityScore}/${threshold}`;
  if (!extraction.fields._meta.confidence_flags.includes(flag)) {
    extraction.fields._meta.confidence_flags.push(flag);
  }
}

export function mergeComplementaryExtractions(
  primary: NormalizedExtraction,
  secondary: NormalizedExtraction
): NormalizedExtraction {
  if (primary.detected_type !== secondary.detected_type) return primary;
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  const a = clone(primary) as unknown as Record<string, unknown>;
  const b = secondary as unknown as Record<string, unknown>;
  const isObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const primaryFields = isObject(a.fields) ? a.fields : {};
  const secondaryFields = isObject(b.fields) ? b.fields : {};
  const primaryMeta = isObject(primaryFields._meta) ? primaryFields._meta : {};
  const secondaryMeta = isObject(secondaryFields._meta) ? secondaryFields._meta : {};
  const missing = (value: unknown) => value === null || value === "" ||
    (Array.isArray(value) && value.length === 0);
  const richness = (value: unknown): number => {
    if (missing(value)) return 0;
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + richness(item), 0);
    if (isObject(value)) return Object.values(value).reduce<number>((sum, item) => sum + richness(item), 0);
    return 1;
  };
  const repeatedRows = new Set(["cargo", "line_items", "charges", "containers", "equipment"]);
  const stringSets = new Set([
    "export_references", "purchase_order_refs", "bl_numbers", "booking_refs",
    "shipment_refs", "delivery_note_refs", "container_refs", "clauses",
  ]);
  const unresolvedConflicts: string[] = [];
  const resolvedConflicts: string[] = [];
  const selectedSecondaryEvidence = new Set<string>();
  const criticalScalars = new Set([
    "bl_number", "booking_no", "vessel_name", "voyage_no", "shipped_on_board_date",
    "issue_date", "total_packages", "total_net_kg", "total_gross_kg", "total_volume_cbm",
    "invoice_no", "po_number", "total_amount", "amount_due",
  ]);

  const evidenceFor = (meta: Record<string, unknown>, path: string) => {
    const evidence = isObject(meta.source_evidence) ? meta.source_evidence : {};
    const item = isObject(evidence[path]) ? evidence[path] : null;
    return typeof item?.quote === "string" ? item.quote : null;
  };
  const merge = (left: Record<string, unknown>, right: Record<string, unknown>, path = "") => {
    for (const [key, rightValue] of Object.entries(right)) {
      if (key === "_meta") continue;
      const leftValue = left[key];
      const fieldPath = path ? `${path}.${key}` : key;
      if (missing(leftValue) && !missing(rightValue)) {
        left[key] = clone(rightValue);
      } else if (stringSets.has(key) && Array.isArray(leftValue) && Array.isArray(rightValue)) {
        left[key] = [...new Set([...leftValue, ...rightValue].filter((x): x is string => typeof x === "string"))];
      } else if (repeatedRows.has(key) && Array.isArray(leftValue) && Array.isArray(rightValue)) {
        const primaryCoherent = rowsMatchOwnTotal(leftValue, primaryFields);
        const secondaryCoherent = rowsMatchOwnTotal(rightValue, secondaryFields);
        if (secondaryCoherent && !primaryCoherent) {
          left[key] = clone(rightValue);
          selectedSecondaryEvidence.add(fieldPath);
        } else if (primaryCoherent === secondaryCoherent && richness(rightValue) > richness(leftValue)) {
          left[key] = clone(rightValue);
          selectedSecondaryEvidence.add(fieldPath);
        }
      } else if (isObject(leftValue) && isObject(rightValue)) {
        merge(leftValue, rightValue, fieldPath);
      } else if (criticalScalars.has(key) && !missing(leftValue) && !missing(rightValue) &&
          String(leftValue).toUpperCase().replace(/\W/g, "") !== String(rightValue).toUpperCase().replace(/\W/g, "")) {
        const leftSupported = evidenceSupports(evidenceFor(primaryMeta, fieldPath), leftValue);
        const rightSupported = evidenceSupports(evidenceFor(secondaryMeta, fieldPath), rightValue);
        if (rightSupported && !leftSupported) {
          left[key] = clone(rightValue);
          selectedSecondaryEvidence.add(fieldPath);
          resolvedConflicts.push(fieldPath);
        } else if (leftSupported && !rightSupported) {
          resolvedConflicts.push(fieldPath);
        } else {
          left[key] = null;
          unresolvedConflicts.push(fieldPath);
        }
      }
    }
  };
  if (isObject(a.fields) && isObject(b.fields)) {
    merge(a.fields, b.fields);
    const primaryFlags = Array.isArray(primaryMeta.confidence_flags) ? primaryMeta.confidence_flags : [];
    const secondaryFlags = Array.isArray(secondaryMeta.confidence_flags) ? secondaryMeta.confidence_flags : [];
    const sourceEvidence: Record<string, unknown> = {
      ...(isObject(secondaryMeta.source_evidence) ? secondaryMeta.source_evidence : {}),
      ...(isObject(primaryMeta.source_evidence) ? primaryMeta.source_evidence : {}),
    };
    for (const path of selectedSecondaryEvidence) {
      const secondaryItem = isObject(secondaryMeta.source_evidence)
        ? secondaryMeta.source_evidence[path]
        : undefined;
      if (secondaryItem !== undefined) sourceEvidence[path] = clone(secondaryItem);
    }
    a.fields._meta = {
      ...primaryMeta,
      confidence_flags: [...new Set([
        ...primaryFlags,
        ...secondaryFlags,
        ...resolvedConflicts.map((path) => `cross_model_resolved:${path}`),
        ...unresolvedConflicts.map((path) => `cross_model:${path}`),
      ])],
      page_refs: { ...(isObject(secondaryMeta.page_refs) ? secondaryMeta.page_refs : {}), ...(isObject(primaryMeta.page_refs) ? primaryMeta.page_refs : {}) },
      source_evidence: sourceEvidence,
    };
  }
  return a as unknown as NormalizedExtraction;
}

export async function parseDocument(
  imageUrls: string[],
  docTypeHint?: string,
  callbacks?: ParseCallbacks
): Promise<ParseResult> {
  return parseDocumentInputs(
    imageUrls.map((url) => ({ kind: "image" as const, url })),
    docTypeHint,
    callbacks
  );
}

export async function parseDocumentInputs(
  inputs: DocumentInput[],
  docTypeHint?: string,
  callbacks?: ParseCallbacks
): Promise<ParseResult> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const hasPdf = inputs.some((input) => input.kind === "pdf");
  // Gemma 4 accepts image input, not native PDF input. Browser and public API
  // paths already render PDFs to page images and therefore go directly to
  // Gemma. Email attachments arrive server-side as PDFs; use OpenRouter's
  // Mistral OCR preprocessor there and never silently fall back to Cloudflare.
  const configuredPdfEngine: Attempt["pdfEngine"] =
    process.env.PDF_OCR_ENGINE === "native" ? "native" : "mistral-ocr";

  const ladder: Attempt[] = [
    {
      provider: "openrouter" as const,
      base: OPENROUTER_BASE_URL,
      apiKey: openrouterKey,
      model: MODEL_PRIMARY,
      stream: true,
      pdfEngine: hasPdf ? configuredPdfEngine : undefined,
    },
    {
      provider: "openrouter" as const,
      base: OPENROUTER_BASE_URL,
      apiKey: openrouterKey,
      model: MODEL_PRIMARY,
      stream: false,
      pdfEngine: hasPdf ? configuredPdfEngine : undefined,
    },
    ...(hasPdf && configuredPdfEngine !== "mistral-ocr"
      ? [{
          provider: "openrouter" as const,
          base: OPENROUTER_BASE_URL,
          apiKey: openrouterKey,
          model: MODEL_PRIMARY,
          stream: false,
          pdfEngine: "mistral-ocr" as const,
        }]
      : []),
  ].filter((a) => a.apiKey);

  if (ladder.length === 0) {
    throw new Error("no AI provider configured (OPENROUTER_API_KEY missing)");
  }

  let useJsonSchema = USE_JSON_SCHEMA;
  let lastError: unknown = null;
  let winner: { attempt: Attempt; rawText: string } | null = null;

  for (const [attemptIndex, attempt] of ladder.entries()) {
    const attemptStartedAt = Date.now();
    try {
      const rawText = await callModel(
        attempt,
        inputs,
        docTypeHint,
        useJsonSchema,
        attempt.stream ? callbacks?.onPartial : undefined
      );
      logInfo("ocr_attempt_succeeded", {
        requestId: callbacks?.requestId,
        attempt: attemptIndex + 1,
        provider: attempt.provider,
        model: attempt.model,
        streaming: attempt.stream,
        pdfEngine: attempt.pdfEngine,
        durationMs: Date.now() - attemptStartedAt,
      });
      winner = { attempt, rawText };
      break;
    } catch (error) {
      lastError = error;
      // Some providers reject response_format — drop it for later attempts.
      const status = (error as { status?: number }).status;
      if (status === 400) useJsonSchema = false;
      logWarn("ocr_attempt_failed", {
        requestId: callbacks?.requestId,
        attempt: attemptIndex + 1,
        provider: attempt.provider,
        model: attempt.model,
        streaming: attempt.stream,
        pdfEngine: attempt.pdfEngine,
        durationMs: Date.now() - attemptStartedAt,
        upstreamStatus: status,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : String(error).slice(0, 1000),
      });
      callbacks?.onStatus?.("retrying");
    }
  }
  if (!winner) {
    throw new Error(`all AI providers failed: ${String(lastError)}`);
  }

  // Content-quality gate: invalid JSON or ≥3 empty critical fields →
  // one streamed dense retry, followed by an independent fast verification
  // only if the dense request fails. Keep the better evidence-backed result.
  let extraction: NormalizedExtraction | null = null;
  try {
    extraction = parseToExtraction(winner.rawText);
  } catch {
    extraction = null;
  }

  const needsEscalation = extraction === null || needsQualityEscalation(extraction);

  if (needsEscalation) {
    callbacks?.onStatus?.("quality_retry");
    const ocrPdf = await pageImagesAsOcrPdf(inputs);
    const qualityInputs = ocrPdf ? [...inputs, ocrPdf] : inputs;
    const escalationAttempt: Attempt = {
      ...winner.attempt,
      model: MODEL_ESCALATION,
      stream: true,
      timeoutMs: QUALITY_RETRY_TIMEOUT_MS,
      pdfEngine: ocrPdf ? "mistral-ocr" : winner.attempt.pdfEngine,
    };
    const selectQualityResult = (rawText: string, attempt: Attempt): ParseResult | null => {
      const candidate = parseToExtraction(rawText);
      const merged = extraction === null
        ? candidate
        : mergeComplementaryExtractions(extraction, candidate);
      const mergedFlags = merged.fields._meta.confidence_flags;
      const hasCrossModelDecision = mergedFlags.some((flag) => flag.startsWith("cross_model"));
      const keepCandidate =
        extraction === null ||
        hasCrossModelDecision ||
        extractionQualityScore(merged) > extractionQualityScore(extraction);
      if (!keepCandidate) return null;
      const qualityScore = extractionQualityScore(merged);
      markLowQuality(merged, qualityScore);
      return {
        extraction: merged,
        model: attempt.model,
        provider: attempt.provider,
        escalated: true,
        promptVersion: PROMPT_VERSION,
        qualityScore,
        rawText,
      };
    };
    const escalationStartedAt = Date.now();
    try {
      const rawText = await callModel(
        escalationAttempt,
        qualityInputs,
        docTypeHint,
        useJsonSchema
      );
      logInfo("ocr_quality_retry_succeeded", {
        requestId: callbacks?.requestId,
        provider: escalationAttempt.provider,
        model: escalationAttempt.model,
        ocrAugmented: Boolean(ocrPdf),
        durationMs: Date.now() - escalationStartedAt,
      });
      const selected = selectQualityResult(rawText, escalationAttempt);
      if (selected) return selected;
    } catch (error) {
      logWarn("ocr_quality_retry_failed", {
        requestId: callbacks?.requestId,
        provider: escalationAttempt.provider,
        model: escalationAttempt.model,
        durationMs: Date.now() - escalationStartedAt,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : String(error).slice(0, 1000),
      });
      const verificationAttempt: Attempt = {
        ...winner.attempt,
        model: MODEL_PRIMARY,
        stream: false,
        timeoutMs: REQUEST_TIMEOUT_MS,
        pdfEngine: ocrPdf ? "mistral-ocr" : winner.attempt.pdfEngine,
      };
      const verificationStartedAt = Date.now();
      try {
        const rawText = await callModel(
          verificationAttempt,
          qualityInputs,
          docTypeHint,
          false
        );
        logInfo("ocr_quality_verification_succeeded", {
          requestId: callbacks?.requestId,
          provider: verificationAttempt.provider,
          model: verificationAttempt.model,
          ocrAugmented: Boolean(ocrPdf),
          durationMs: Date.now() - verificationStartedAt,
        });
        const selected = selectQualityResult(rawText, verificationAttempt);
        if (selected) return selected;
      } catch (verificationError) {
        logWarn("ocr_quality_verification_failed", {
          requestId: callbacks?.requestId,
          provider: verificationAttempt.provider,
          model: verificationAttempt.model,
          durationMs: Date.now() - verificationStartedAt,
          errorName: verificationError instanceof Error ? verificationError.name : undefined,
          errorMessage: verificationError instanceof Error
            ? verificationError.message.slice(0, 1000)
            : String(verificationError).slice(0, 1000),
        });
      }
      // Escalation failed — fall through to the original result if usable.
    }
  }

  if (extraction === null) {
    throw new Error("model returned unrepairable JSON (after escalation)");
  }

  const qualityScore = extractionQualityScore(extraction);
  markLowQuality(extraction, qualityScore);

  return {
    extraction,
    model: winner.attempt.model,
    provider: winner.attempt.provider,
    escalated: false,
    promptVersion: PROMPT_VERSION,
    qualityScore,
    rawText: winner.rawText,
  };
}
