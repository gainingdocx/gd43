# Llama 4 Scout versus Gemma 4 bill-of-lading benchmark

Date: 2026-07-21

## Decision

Keep `google/gemma-4-26b-a4b-it`. The paid Llama 4 Scout endpoint is available and exceptionally fast, but it is not reliable enough for OCR or automated document matching. The requested free Scout route and both Llama 3.2 Vision routes are currently unavailable through OpenRouter.

## Availability verified through the live API

| Requested slug | Live catalog | Direct API result |
|---|---:|---|
| `meta-llama/llama-4-scout:free` | No | HTTP 404: free version unavailable; use paid Scout |
| `meta-llama/llama-3.2-11b-vision-instruct` | No | HTTP 404: no endpoints found |
| `meta-llama/llama-3.2-90b-vision-instruct` | No | HTTP 404: no endpoints found |
| `meta-llama/llama-4-scout` | Yes | Callable |

OpenRouter's older informational pages for Llama 3.2 Vision do not reflect callable endpoint availability. The live model catalog plus a real API request were used as the source of truth.

## Controlled document test

- Input: the same user-supplied 384 x 512 Maersk Sealand bill of lading.
- Conditions: identical production extraction prompt and schema, original PNG, temperature 0, and maximum 8,192 output tokens.
- Accuracy: 27 deterministic checks covering identifiers, parties, routing, dates, equipment, cargo, financial terms, and references.
- Trials: two successful runs per callable model.
- Cost: actual `usage.cost` returned by OpenRouter.

| Model | Accuracy | Mean latency | Mean actual cost | Provider | Verdict |
|---|---:|---:|---:|---|---|
| `google/gemma-4-26b-a4b-it` | **78%** (78%, 78%) | 3.8 s | $0.000795 | Wafer | **Keep** |
| `meta-llama/llama-4-scout` | 19% (15%, 22%) | **0.6 s** | **$0.000597** | Groq | Reject for extraction |

Scout saved about 3.2 seconds and $0.000198 per document, but lost 59 percentage points of extraction accuracy. This is not an acceptable trade-off for 3-way matching.

## Scout failure evidence

Scout returned schema-shaped JSON but hallucinated critical business data. Across the two trials it produced:

- false B/L numbers: `MAERSK SEALAND 64610` and `MAERSKSEALAND 646/0`, instead of `COKA06793`;
- false cargo: `Finished Poultry Canned` and `FROZEN PINEAPPLE`, instead of frozen squid;
- false container IDs: `MAUUSD656591` and `MAUR56656591`, instead of `MAEU5665691`;
- incorrect package totals, gross weights, volume, seal, routing, and financial/reference fields.

Its outputs were syntactically valid, making the hallucinations especially unsafe for unattended matching.

Gemma consistently recovered the B/L number, parties, voyage, dates, container, seal, equipment, weights, volume, freight term, LC number, shipping-bill reference, and customs reference. Its raw weaknesses remained route-role reversal, package arithmetic, cargo grouping, and number of originals; the application's deterministic validation and dense-Gemma escalation address these known uncertainty classes.

## Pricing

At test time the live OpenRouter catalog listed:

- Gemma 4 26B: $0.07/M input tokens and $0.34/M output tokens.
- Llama 4 Scout: $0.10/M input tokens and $0.30/M output tokens.

No production model configuration was changed.
