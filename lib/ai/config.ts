// AI layer configuration (BUILD_SPEC §M3).
// Model slugs verified against the OpenRouter catalog on 2026-07-19.

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Primary extraction model: vision-capable, 262k context, cheap.
export const MODEL_PRIMARY =
  process.env.MODEL_PRIMARY ?? "google/gemma-4-26b-a4b-it";

// Dense multimodal fallback is reserved for incomplete/ambiguous first passes.
// The fast MoE model remains the default path for latency and cost.
export const MODEL_ESCALATION =
  process.env.MODEL_ESCALATION ?? "google/gemma-4-31b-it";

// OpenRouter provider routing preferences (spec-mandated).
export const PROVIDER_PREFS = {
  quantizations: ["fp8", "bf16"],
  sort: "throughput",
  allow_fallbacks: true,
} as const;

// response_format json_schema toggle. Default OFF: measured on 2026-07-19
// (synthetic ground-truth B/L, gemma-4-26b-a4b-it), grammar-constrained
// decoding produced digit transpositions, misread columns and null-outs at
// 2-4x the latency, while prompt + tolerant JSON repair extracted every
// field exactly in 25s. Set AI_JSON_SCHEMA=on to re-enable for capable
// models.
export const USE_JSON_SCHEMA = process.env.AI_JSON_SCHEMA === "on";

export const MAX_PAGES = 15;
export const REQUEST_TIMEOUT_MS = 120_000;
export const MAX_OUTPUT_TOKENS = 8192;
