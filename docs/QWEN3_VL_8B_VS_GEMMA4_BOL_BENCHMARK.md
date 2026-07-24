# Qwen3-VL 8B vs Gemma 4 26B — bill of lading benchmark

Date: 2026-07-21

## Method

- Input: the same genuine 384 × 512 Maersk bill of lading used for production verification.
- Prompt: GainingDocx extraction prompt v4.
- Ground truth: 27 matching-critical checks covering document type, identifiers, parties, routing, dates, container/seal/equipment, cargo, weights, volume, freight terms, LC/export/customs references, and originals.
- API: OpenRouter chat completions, original PNG, temperature 0, maximum 8,192 output tokens.
- Scores below measure raw model output before GainingDocx normalization and dense-model escalation.

## Results

| Model | Successful runs | Mean raw accuracy | Mean successful latency | Mean successful cost | Reliability |
|---|---:|---:|---:|---:|---|
| `google/gemma-4-26b-a4b-it` | 2/2 | 78% | 3.2 s | $0.000776 | 2 valid JSON responses |
| `qwen/qwen3-vl-8b-instruct` | 2/2 in clean rerun | 32% | 1.5 s | $0.000859 | An earlier provider attempt also returned HTTP 429 |
| `qwen/qwen3-vl-8b-thinking` | 1/2 | 15% | 1.0 s for the completed run | $0.023708 | Second request timed out at 180 s |

The Thinking model's completed run consumed 17,175 completion tokens, including 15,886 reasoning tokens. Its successful response was about 30.5 times the mean cost of Gemma while scoring far lower.

## Representative output differences

### Gemma 4 26B A4B

- Correct: `COKA06793`, shipper/consignee/notify parties, voyage `0213`, container `MAEU5665691`, seal `ML-IN0640885`, reefer equipment, dates, 15,000 kg net, 15,750 kg gross, 20 CBM, prepaid stamp, LC and export/customs references.
- Raw weaknesses: vessel prefix ambiguity, route inversion, noisy package hierarchy, and missed originals in these fast-only runs.
- Production result: the existing validators and dense 31B escalation produced quality score 86 and a reconciled 750-package total on the same image.

### Qwen3-VL 8B Instruct

- Repeatedly misread the B/L as `C0046793`.
- Returned both loading and discharge as Cochin.
- Invented or corrupted container/seal values such as `MAU 120645845`, `20/2008`, or `MAERSK665691`.
- Returned incorrect package totals, net/gross weights, equipment type, and cargo description.
- Missed the parties, export/customs references, originals, and structured freight term.
- One run invented HS code `0708.00.00` despite no reliable printed HS code.

### Qwen3-VL 8B Thinking

- Hallucinated a different shipment: Kolkata to Singapore, mango cargo, fake containers, 200 cartons, 19,500 kg gross and 15 CBM.
- Missed nearly all matching-critical identifiers and parties.
- One of two requests failed to finish within 180 seconds.

## Decision

Neither Qwen3-VL 8B model is suitable for the production OCR or fallback path on the evidence collected. Instruct is fast but materially inaccurate. Thinking is expensive, unreliable, and produced stronger hallucinations rather than better transcription. Keep the current Gemma 4 26B A4B fast path and Gemma 4 31B dense escalation.

This conclusion is scoped to the tested OpenRouter endpoints, current extraction prompt, and supplied difficult scan. It is not a universal claim about every Qwen deployment or task.

## Sources

- Qwen model card: https://huggingface.co/Qwen/Qwen3-VL-8B-Thinking
- Qwen FP8 model card and OCR claims: https://huggingface.co/Qwen/Qwen3-VL-8B-Thinking-FP8
- OpenRouter Instruct listing: https://openrouter.ai/qwen/qwen3-vl-8b-instruct
- OpenRouter Thinking listing: https://openrouter.ai/qwen/qwen3-vl-8b-thinking
