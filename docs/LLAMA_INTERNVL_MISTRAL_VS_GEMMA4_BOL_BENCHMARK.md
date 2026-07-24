# OpenRouter vision-model comparison for bill-of-lading extraction

Date: 2026-07-21

## Decision

Keep `google/gemma-4-26b-a4b-it` as the fast production extractor. Do not replace it with Mistral Small 3.2 for document extraction. Llama 3.2 11B Vision, InternVL 2.5 8B, and Pixtral 12B cannot currently be tested or used through OpenRouter because they have no callable endpoint/model ID.

## Method

- Input: the same 384 x 512 Maersk Sealand bill-of-lading image supplied by the user.
- Prompt/schema: the application's production structured B/L extraction prompt and JSON schema.
- Sampling: temperature 0, maximum output 8,192 tokens.
- Scoring: 27 deterministic checks covering JSON validity, identifiers, parties, routing, dates, equipment, cargo totals, financial terms, and references.
- Trials: two per requested model slug.
- Timing and cost: OpenRouter response latency and returned `usage.cost`, not estimates.

This is a difficult single-document regression test, not a statistically representative corpus benchmark. It is intentionally useful because the scan contains low-resolution text, stamps, signatures, and a watermark.

## Results

| Model | OpenRouter status | Mean accuracy | Mean latency | Mean actual cost | Result |
|---|---:|---:|---:|---:|---|
| `google/gemma-4-26b-a4b-it` | Active | **80%** (81%, 78%) | 3.1 s | $0.000770 | Keep |
| `mistralai/mistral-small-3.2-24b-instruct` | Active | 37% (37%, 37%) | **1.3 s** | **$0.000548** | Reject for extraction |
| `meta-llama/llama-3.2-11b-vision-instruct` | No endpoint | N/A | N/A | N/A | OpenRouter HTTP 404 |
| `opengvlab/internvl2_5-8b` | Invalid ID | N/A | N/A | N/A | OpenRouter HTTP 400 |
| `mistralai/pixtral-12b` | No endpoint | N/A | N/A | N/A | OpenRouter HTTP 404 |

Gemma was 1.8 seconds slower and $0.000222 more expensive per extraction than Mistral Small 3.2 in this run, but delivered 43 percentage points more accuracy. The small cost saving is not remotely worth the extraction risk.

## Important field-level findings

Gemma correctly extracted both trials' B/L number (`COKA06793`), carrier, parties, voyage, dates, container (`MAEU5665691`), seal (`ML-IN0640885`), equipment, weights, volume, freight-prepaid term, LC number, shipping-bill reference, and customs reference. Its raw-output weaknesses were route-role reversal, vessel-prefix ambiguity, package arithmetic, cargo grouping, and number of originals. These are the exact kinds of errors the application's validators, evidence checks, and dense escalation are intended to catch.

Mistral Small 3.2 produced fluent, schema-shaped JSON but hallucinated critical values. Examples across its two trials included invented B/L numbers (`MAEU15000022`, `MAEUACN2022000001`), an invented carrier/vessel (`CMA CGM ATLANTIC`), incorrect discharge port (`ISTANBUL`), incorrect container (`MARU5665691`) or no container, and incorrect package/weight totals. This failure pattern is especially dangerous for automated 3-way matching because syntactically valid JSON can look trustworthy while containing fabricated business keys.

## Availability and list pricing

The live OpenRouter `/api/v1/models` catalog listed:

- Gemma 4 26B: $0.07/M input tokens and $0.34/M output tokens.
- Mistral Small 3.2 24B: $0.10/M input tokens and $0.30/M output tokens.

OpenRouter still exposes informational pages for Llama 3.2 11B Vision and Pixtral 12B, but the API returned `No endpoints found`; their old pages therefore must not be treated as evidence of current availability. InternVL 2.5 8B is absent from the live catalog and its attempted slug is invalid. OpenRouter currently lists newer InternVL3 models instead, which would be a separate model comparison rather than a valid test of InternVL 2.5 8B.

## Production recommendation

1. Keep Gemma 4 26B as the fast first pass.
2. Keep the existing Gemma 4 dense escalation for low-confidence or internally inconsistent documents.
3. Do not add Mistral Small 3.2 to the extraction path despite its speed.
4. Do not configure retired OpenRouter slugs; they would create runtime failures.
5. Revisit Llama, InternVL, or Pixtral only if a stable OpenRouter endpoint becomes available, and require the same document-level regression suite before rollout.

No production model configuration was changed by this comparison.
