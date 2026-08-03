export const TRANSLATION_LANGUAGES = [
  ["", "Keep original only"],
  ["en", "English"],
  ["hi", "Hindi"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["ar", "Arabic"],
  ["zh", "Chinese"],
  ["ja", "Japanese"],
  ["pt", "Portuguese"],
  ["el", "Greek"],
  ["vi", "Vietnamese"],
  ["id", "Indonesian"],
  ["ko", "Korean"],
] as const;

export type TranslationLanguage = Exclude<(typeof TRANSLATION_LANGUAGES)[number][0], "">;

export function languageName(code: string): string | null {
  return TRANSLATION_LANGUAGES.find(([value]) => value === code)?.[1] ?? null;
}

export function isTranslationLanguage(value: unknown): value is TranslationLanguage {
  return typeof value === "string" && value !== "" && languageName(value) !== null;
}
