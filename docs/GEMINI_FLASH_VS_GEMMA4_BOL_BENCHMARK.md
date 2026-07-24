# Gemini Flash vs Gemma 4 26B — bill of lading benchmark

Date: 2026-07-21

## Model selection

`google/gemini-flash-1.5` is no longer present in OpenRouter's active model catalog. The comparison therefore uses:

- `google/gemini-2.5-flash`: the available stable successor generation.
- `google/gemini-3.1-flash-lite`: Google's current stable cost/latency-oriented Flash model.
- `google/gemini-3.5-flash`: Google's current stable most-capable Flash model.
- `google/gemma-4-26b-a4b-it`: GainingDocx's current fast primary model.

## Method

- Same genuine 384 × 512 Maersk B/L.
- Same extraction prompt v4 and original PNG.
- Two runs per model, temperature 0, 8,192 output-token ceiling.
- 27 exact matching-critical checks.
- Accuracy is raw model output before GainingDocx normalization and dense escalation.
- Cost is the actual `usage.cost` returned by OpenRouter, not a theoretical estimate.

## Results

| Model | Mean raw accuracy | Range | Mean latency | Mean cost/document | Approx. cost/1,000 |
|---|---:|---:|---:|---:|---:|
| Gemma 4 26B A4B | 82% | 78–85% | 2.8 s | $0.000773 | $0.77 |
| Gemini 2.5 Flash | 78% | 78–78% | 3.5 s | $0.003883 | $3.88 |
| Gemini 3.1 Flash-Lite | 85% | 85–85% | 1.8 s | $0.002560 | $2.56 |
| Gemini 3.5 Flash | 89% | 89–89% | 2.6 s | $0.042708 | $42.71 |

All eight calls returned valid JSON.

## Field-level findings

### Gemma 4 26B A4B

- Correct B/L `COKA06793` in both runs.
- Correct parties, container, seal, dates, weights, volume, freight term and references.
- Raw weaknesses: route inversion, vessel prefix ambiguity and missed originals; cargo hierarchy varied between runs.
- The production workflow's normalization and dense escalation reached quality score 86 on the same scan.

### Gemini 2.5 Flash

- Same mean accuracy as Gemma but slower and about 5× the observed cost.
- Correct vessel, route, package total, gross weight, volume and originals.
- Missed/misread B/L number, notify party, seal, cargo groups, net weight and freight stamp.
- Not an improvement over the current fast model.

### Gemini 3.1 Flash-Lite

- Fastest model and three raw points more accurate than Gemma.
- Correct route, container/seal, 200/550 cargo groups, totals, dates, references and originals in both runs.
- Consistently misread the critical B/L as `COKA04793` instead of `COKA06793`.
- Also missed the exact notify name, vessel-only value and prepaid stamp.
- Promising as a cross-check/escalation candidate, but unsafe as the sole extractor without a broader identifier benchmark.

### Gemini 3.5 Flash

- Highest overall raw score and correctly captured route, equipment, 200/550 cargo split, all totals, freight stamp and originals.
- Still misread the critical B/L as `COKA04793` in both runs and included the carrier brand in the vessel value.
- Used about 2,700 reasoning tokens per run.
- Roughly 55× Gemma's observed per-document cost for only seven additional raw accuracy points.
- Not cost-effective as the default parser; potentially useful for exceptional high-value review cases.

## Recommendation

Do not replace Gemma 4 26B with Gemini 2.5 Flash or Gemini 3.5 Flash.

Gemini 3.1 Flash-Lite deserves a larger multi-document evaluation as a possible fast cross-check or escalation model because it was both faster and better on cargo/routing structure. Do not make it the sole primary model yet: a consistently wrong B/L identifier can cause a false three-way match even when the rest of the document is correct.

Keep production unchanged until Gemini 3.1 Flash-Lite passes a representative corpus of B/Ls, POs, freight invoices and goods receipts with identifier-weighted scoring.

## Sources

- Current Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini 3.5 Flash guidance: https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5
- Google pricing: https://ai.google.dev/gemini-api/docs/pricing
- OpenRouter Gemini 2.5 Flash: https://openrouter.ai/google/gemini-2.5-flash
- OpenRouter Gemini 3.1 Flash-Lite: https://openrouter.ai/google/gemini-3.1-flash-lite
- OpenRouter Gemini 3.5 Flash: https://openrouter.ai/google/gemini-3.5-flash
- OpenRouter Gemma 4 26B A4B: https://openrouter.ai/google/gemma-4-26b-a4b-it
