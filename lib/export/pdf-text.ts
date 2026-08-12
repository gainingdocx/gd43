import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();
const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;

/** Converts Arabic-script text into presentation glyph order for PDF engines
 * that do not apply browser bidi layout. Other scripts are left untouched. */
export function shapePdfText(value: string) {
  if (!ARABIC.test(value)) return value;
  const shaped = ArabicShaper.convertArabic(value);
  const embedding = bidi.getEmbeddingLevels(shaped);
  const characters = [...shaped];
  for (const [index, replacement] of bidi.getMirroredCharactersMap(shaped, embedding)) {
    characters[index] = replacement;
  }
  for (const [start, end] of bidi.getReorderSegments(shaped, embedding)) {
    for (let left = start, right = end; left < right; left += 1, right -= 1) {
      [characters[left], characters[right]] = [characters[right], characters[left]];
    }
  }
  return characters.join("");
}

export function pdfFontRuns(value: string) {
  return value.split(/([\u0900-\u097f]+)/)
    .filter(Boolean)
    .map((text) => ({ text, script: /[\u0900-\u097f]/.test(text) ? "devanagari" as const : "default" as const }));
}
