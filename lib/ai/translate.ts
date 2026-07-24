import { MODEL_PRIMARY, OPENROUTER_BASE_URL, PROVIDER_PREFS } from "./config";
import { repairJson } from "./json";
import { isTranslationLanguage, languageName, type TranslationLanguage } from "./languages";
import type { NormalizedExtraction } from "./schemas/shared";

const IDENTIFIER_PATH = /(?:^|\.)(?:.*(?:_no|_number|_ref|_refs|_code|_codes|_date|_kg|_cbm|_amount|_rate|_count)|currency|incoterm|scac|tax_id|unlocode|hazard_class|subsidiary_risk|packing_group|flash_point_c|email|phone)$/i;
const NON_LINGUISTIC = /^(?:[A-Z0-9][A-Z0-9./:_-]{1,24}|\d[\d.,/% +-]*)$/;

export interface TranslationCandidate {
  path: string;
  text: string;
}

export function translationCandidates(fields: Record<string, unknown>): TranslationCandidate[] {
  const result: TranslationCandidate[] = [];
  const visit = (value: unknown, path: string) => {
    if (path === "_meta" || path.startsWith("_meta.")) return;
    if (typeof value === "string") {
      const text = value.trim();
      if (
        text.length >= 2 &&
        !IDENTIFIER_PATH.test(path) &&
        !NON_LINGUISTIC.test(text) &&
        result.length < 140
      ) {
        result.push({ path, text: text.slice(0, 1200) });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
        visit(item, path ? `${path}.${key}` : key)
      );
    }
  };
  visit(fields, "");
  return result;
}

export async function translateExtraction(
  extraction: NormalizedExtraction,
  targetLanguage: TranslationLanguage
): Promise<void> {
  if (!isTranslationLanguage(targetLanguage)) return;
  const targetName = languageName(targetLanguage);
  if (!targetName) return;
  const sourceLanguages = extraction.fields._meta.source_languages;
  if (sourceLanguages.length === 1 && sourceLanguages[0].toLowerCase() === targetLanguage) return;

  const candidates = translationCandidates(extraction.fields as unknown as Record<string, unknown>);
  if (!candidates.length || !process.env.OPENROUTER_API_KEY) return;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gainingdocx.com",
      "X-Title": "GainingDocx field translation",
    },
    body: JSON.stringify({
      model: MODEL_PRIMARY,
      provider: PROVIDER_PREFS,
      temperature: 0,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `Translate logistics document values into ${targetName}. Return only JSON {"translations":[{"path":"exact input path","text":"translation"}]}. Preserve proper names unless they have a conventional rendering. Never alter identifiers, numbers, dates, currency codes, UN numbers, hazard classes, packing groups, HS codes or abbreviations. For bilingual input, translate the meaning once without joining duplicate language columns.`,
        },
        { role: "user", content: JSON.stringify(candidates) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`translation provider returned ${response.status}`);
  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return;
  const parsed = repairJson(content) as { translations?: unknown };
  const allowed = new Set(candidates.map((candidate) => candidate.path));
  const translated_fields: Record<string, string> = {};
  if (Array.isArray(parsed.translations)) {
    for (const item of parsed.translations) {
      if (!item || typeof item !== "object") continue;
      const { path, text } = item as { path?: unknown; text?: unknown };
      if (typeof path === "string" && allowed.has(path) && typeof text === "string" && text.trim()) {
        translated_fields[path] = text.trim().slice(0, 1600);
      }
    }
  }
  if (Object.keys(translated_fields).length) {
    extraction.fields._meta.translation = {
      target_language: targetLanguage,
      target_language_name: targetName,
      translated_fields,
      generated_at: new Date().toISOString(),
    };
  }
}
