import "server-only";

import { MODEL_PRIMARY, OPENROUTER_BASE_URL } from "./config";
import type { LineItem, NormalizedExtraction } from "./schemas/shared";

type Suggestion = {
  index: number;
  hs6: string;
  confidence: "low" | "medium" | "high";
  reason: string;
};

function eligibleLines(extraction: NormalizedExtraction): LineItem[] | null {
  switch (extraction.detected_type) {
    case "commercial_invoice":
    case "packing_list":
    case "air_waybill":
      return extraction.fields.line_items;
    default:
      return null;
  }
}

function extractJson(text: string): unknown {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  return JSON.parse(text.slice(start, end + 1));
}

async function usGeneralRate(hs6: string): Promise<string | null> {
  try {
    const response = await fetch(`https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(hs6)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<{ htsno?: string; general?: string }>;
    return rows.find((row) => row.htsno?.replace(/\D/g, "").startsWith(hs6) && row.general)?.general ?? null;
  } catch {
    return null;
  }
}

/** Add non-authoritative suggestions without replacing printed HS codes. */
export async function addHsSuggestions(extraction: NormalizedExtraction): Promise<void> {
  const lines = eligibleLines(extraction);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!lines?.length || !apiKey) return;
  const candidates = lines
    .map((line, index) => ({ index, description: line.description, origin: line.country_of_origin }))
    .filter((item) => !lines[item.index].hs_code && item.description?.trim())
    .slice(0, 30);
  if (!candidates.length) return;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gainingdocx.com",
        "X-Title": "GainingDocx HS suggestion",
      },
      body: JSON.stringify({
        model: MODEL_PRIMARY,
        temperature: 0,
        max_tokens: 1800,
        messages: [
          { role: "system", content: "You are a customs classification assistant. Suggest only a 6-digit international HS code from the stated product description. Never invent product facts. Return only JSON array items {index,hs6,confidence,reason}. confidence is low, medium, or high. Use low when material, function, composition, or product form is missing. This is not a customs ruling." },
          { role: "user", content: JSON.stringify(candidates) },
        ],
      }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) return;
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractJson(body.choices?.[0]?.message?.content ?? "");
    if (!Array.isArray(parsed)) return;
    const valid = parsed.filter((value): value is Suggestion => {
      if (!value || typeof value !== "object") return false;
      const item = value as Partial<Suggestion>;
      return Number.isInteger(item.index) && /^\d{6}$/.test(item.hs6 ?? "") &&
        ["low", "medium", "high"].includes(item.confidence ?? "") && typeof item.reason === "string";
    });
    await Promise.all(valid.map(async (suggestion) => {
      const line = lines[suggestion.index];
      if (!line || line.hs_code) return;
      line.hs_code_suggestion = suggestion.hs6;
      line.hs_suggestion_confidence = suggestion.confidence;
      line.hs_suggestion_reason = suggestion.reason.slice(0, 240);
      line.us_general_duty_rate = await usGeneralRate(suggestion.hs6);
    }));
  } catch {
    // Suggestions are optional; extraction remains usable if an upstream fails.
  }
}
