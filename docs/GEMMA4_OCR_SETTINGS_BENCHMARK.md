# Gemma 4 OCR settings benchmark

Date: 2026-07-21

## Scope

- Model: `google/gemma-4-26b-a4b-it` through OpenRouter
- Document: genuine low-resolution Maersk bill of lading supplied by the product owner
- Rubric: 27 exact matching-grade fields covering identifiers, parties, routing, dates, equipment, cargo, totals, freight terms, and references
- Prompt: production extraction prompt v4
- Provider selected by OpenRouter: Wafer

## Controlled observations

| Input / decoding | Run 1 | Run 2 | Latency observed |
|---|---:|---:|---:|
| Current forced raster enlargement, temperature 0 | 48% | 56% | 3.7–4.6 s |
| Original raster, temperature 0 | 78% | 85% | 1.4–1.5 s |
| Original raster, temperature 0.1, top_p 0.95, top_k 64 | — | 85% | 1.3 s |
| Original raster, temperature 1, top_p 0.95, top_k 64 | — | 85% | 1.1 s |
| Thinking enabled | no usable response before 180 s | — | failed production latency ceiling |

Scores are field-level extraction accuracy on this one difficult document, not a universal model-quality claim. Sampling variants tied on the clean comparison, so there is no evidence to replace deterministic temperature 0. The forced enlargement result reproduced and was materially worse, so small supported raster files are now passed through unchanged.

## Decisions

1. Keep `temperature: 0` for reproducible factual extraction.
2. Do not add `top_p` or `top_k`; they produced no measured accuracy gain.
3. Do not enable thinking globally; it failed the 120-second application latency requirement.
4. Keep OpenRouter `detail: high`. Both image sizes were billed as the same 2,620 prompt tokens, consistent with provider-side fixed high-detail processing; OpenRouter does not expose Gemma's native `visual_token_budget` as a supported request parameter for this model.
5. Preserve JPEG/PNG/WebP inputs at or below 2,400 px rather than enlarging or recompressing them.
6. Render PDF pages at 200 DPI, capped at a 2,400 px long edge. This creates real detail from vector/text PDFs without unbounded payload growth.

## Important limitation

The supplied source is only 384 × 512 pixels. No DPI setting can recreate detail already absent from that raster. A native PDF or higher-resolution scan remains the strongest accuracy improvement.

## Production verification

Cloudflare version `676a557b-803d-4f4d-ac78-15e6bd6ed146` was verified with the same Maersk image. The API returned HTTP 200 in 64 seconds, escalated from fast 26B A4B to dense 31B, and normalized the parent/child cargo structure to 750 total packages with the audit flag `total_packages:removed_parent_double_count`. It also returned the B/L number, full party blocks, Cochin-to-Izmir routing, voyage, container, seal, freight-prepaid stamp, LC/customs references, dates, 15,000 kg net, 15,750 kg gross, 20 CBM, and three originals. The ambiguous vessel reading remains flagged for human review.
