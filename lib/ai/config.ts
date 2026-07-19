// AI layer configuration (BUILD_SPEC §M3).
// Model slugs verified against the OpenRouter catalog on 2026-07-19.

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai";

// Primary extraction model: vision-capable, 262k context, cheap.
export const MODEL_PRIMARY =
  process.env.MODEL_PRIMARY ?? "google/gemma-4-26b-a4b-it";

// Escalation default: same model, retried non-streaming (spec default).
// Override with MODEL_ESCALATION (e.g. "google/gemma-4-31b-it") when needed.
export const MODEL_ESCALATION = process.env.MODEL_ESCALATION ?? MODEL_PRIMARY;

// DeepInfra uses the same HF-style slug; override if their naming diverges.
export const DEEPINFRA_MODEL = process.env.DEEPINFRA_MODEL ?? MODEL_PRIMARY;

// OpenRouter provider routing preferences (spec-mandated).
export const PROVIDER_PREFS = {
  quantizations: ["fp8", "bf16"],
  sort: "throughput",
  allow_fallbacks: true,
} as const;

export const MAX_PAGES = 15;
export const REQUEST_TIMEOUT_MS = 120_000;
export const MAX_OUTPUT_TOKENS = 8192;
