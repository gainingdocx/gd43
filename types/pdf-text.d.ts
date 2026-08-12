declare module "arabic-persian-reshaper" {
  export const ArabicShaper: { convertArabic(value: string): string };
}

declare module "bidi-js" {
  type Embedding = { levels: Uint8Array; paragraphs: Array<{ start: number; end: number; level: number }> };
  type Bidi = {
    getEmbeddingLevels(value: string, direction?: "ltr" | "rtl"): Embedding;
    getReorderSegments(value: string, embedding: Embedding, start?: number, end?: number): Array<[number, number]>;
    getMirroredCharactersMap(value: string, embedding: Embedding, start?: number, end?: number): Map<number, string>;
  };
  export default function bidiFactory(): Bidi;
}
