// Single entry point to the AI layer (BUILD_SPEC §M3): parseDocument().
// Attempt ladder: OpenRouter streaming → OpenRouter non-stream → DeepInfra.
// One content-quality escalation retry (invalid JSON or ≥3 empty critical
// fields). The model only transcribes — validation/math live in TypeScript.

import {
  DEEPINFRA_BASE_URL,
  DEEPINFRA_MODEL,
  MAX_OUTPUT_TOKENS,
  MODEL_ESCALATION,
  MODEL_PRIMARY,
  OPENROUTER_BASE_URL,
  PROVIDER_PREFS,
  REQUEST_TIMEOUT_MS,
} from "./config";
import { tolerantParse, repairJson } from "./json";
import { buildUserText, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompts/extract-v1";
import {
  countEmptyCriticalFields,
  EXTRACTION_JSON_SCHEMA,
  toExtractionV1,
  type ExtractionV1,
} from "./schemas/extraction-v1";

export type ParseProvider = "openrouter" | "deepinfra";

export interface ParseResult {
  extraction: ExtractionV1;
  model: string;
  provider: ParseProvider;
  escalated: boolean;
  promptVersion: string;
  /** Raw text of the winning model response (stored as raw_extraction). */
  rawText: string;
}

export interface ParseCallbacks {
  /** Called with the latest partial extraction while streaming. */
  onPartial?: (partial: unknown) => void;
  /** Called when the router moves to a fallback attempt or escalates. */
  onStatus?: (status: string) => void;
}

interface Attempt {
  provider: ParseProvider;
  base: string;
  apiKey: string | undefined;
  model: string;
  stream: boolean;
}

function buildMessages(imageUrls: string[], docTypeHint?: string) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: buildUserText(docTypeHint) },
        ...imageUrls.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ],
    },
  ];
}

async function callModel(
  attempt: Attempt,
  imageUrls: string[],
  docTypeHint: string | undefined,
  useJsonSchema: boolean,
  onPartial?: (partial: unknown) => void
): Promise<string> {
  if (!attempt.apiKey) throw new Error(`${attempt.provider}: no API key`);

  const body: Record<string, unknown> = {
    model: attempt.model,
    messages: buildMessages(imageUrls, docTypeHint),
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

function parseToExtraction(rawText: string): ExtractionV1 {
  return toExtractionV1(repairJson(rawText));
}

export async function parseDocument(
  imageUrls: string[],
  docTypeHint?: string,
  callbacks?: ParseCallbacks
): Promise<ParseResult> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const deepinfraKey = process.env.DEEPINFRA_API_KEY;

  const ladder: Attempt[] = [
    {
      provider: "openrouter" as const,
      base: OPENROUTER_BASE_URL,
      apiKey: openrouterKey,
      model: MODEL_PRIMARY,
      stream: true,
    },
    {
      provider: "openrouter" as const,
      base: OPENROUTER_BASE_URL,
      apiKey: openrouterKey,
      model: MODEL_PRIMARY,
      stream: false,
    },
    ...(deepinfraKey
      ? [
          {
            provider: "deepinfra" as const,
            base: DEEPINFRA_BASE_URL,
            apiKey: deepinfraKey,
            model: DEEPINFRA_MODEL,
            stream: false,
          },
        ]
      : []),
  ].filter((a) => a.apiKey);

  if (ladder.length === 0) {
    throw new Error("no AI provider configured (OPENROUTER_API_KEY missing)");
  }

  let useJsonSchema = true;
  let lastError: unknown = null;
  let winner: { attempt: Attempt; rawText: string } | null = null;

  for (const attempt of ladder) {
    try {
      const rawText = await callModel(
        attempt,
        imageUrls,
        docTypeHint,
        useJsonSchema,
        attempt.stream ? callbacks?.onPartial : undefined
      );
      winner = { attempt, rawText };
      break;
    } catch (error) {
      lastError = error;
      // Some providers reject response_format — drop it for later attempts.
      const status = (error as { status?: number }).status;
      if (status === 400) useJsonSchema = false;
      callbacks?.onStatus?.(
        `retrying: ${attempt.provider}/${attempt.model} failed`
      );
    }
  }
  if (!winner) {
    throw new Error(`all AI providers failed: ${String(lastError)}`);
  }

  // Content-quality gate: invalid JSON or ≥3 empty critical fields →
  // one escalation retry (non-stream). Keep the better result.
  let extraction: ExtractionV1 | null = null;
  try {
    extraction = parseToExtraction(winner.rawText);
  } catch {
    extraction = null;
  }

  const needsEscalation =
    extraction === null || countEmptyCriticalFields(extraction) >= 3;

  if (needsEscalation) {
    callbacks?.onStatus?.("escalating: retrying with escalation model");
    const escalationAttempt: Attempt = {
      ...winner.attempt,
      model:
        winner.attempt.provider === "openrouter"
          ? MODEL_ESCALATION
          : DEEPINFRA_MODEL,
      stream: false,
    };
    try {
      const rawText = await callModel(
        escalationAttempt,
        imageUrls,
        docTypeHint,
        useJsonSchema
      );
      const escalated = parseToExtraction(rawText);
      const keepEscalated =
        extraction === null ||
        countEmptyCriticalFields(escalated) <
          countEmptyCriticalFields(extraction);
      if (keepEscalated) {
        return {
          extraction: escalated,
          model: escalationAttempt.model,
          provider: escalationAttempt.provider,
          escalated: true,
          promptVersion: PROMPT_VERSION,
          rawText,
        };
      }
    } catch {
      // Escalation failed — fall through to the original result if usable.
    }
  }

  if (extraction === null) {
    throw new Error("model returned unrepairable JSON (after escalation)");
  }

  return {
    extraction,
    model: winner.attempt.model,
    provider: winner.attempt.provider,
    escalated: false,
    promptVersion: PROMPT_VERSION,
    rawText: winner.rawText,
  };
}
