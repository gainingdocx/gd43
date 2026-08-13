import { PDFDocument } from "pdf-lib";

import type { DocumentInput } from "./router";

function decodeDataUrl(url: string) {
  const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/i.exec(url);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const isPng = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpeg) return null;
  return {
    mime: isPng ? "image/png" : "image/jpeg",
    bytes,
  };
}

function encodeBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

/**
 * Builds a transient PDF from browser-rendered JPEG/PNG pages. The PDF is sent
 * only to OpenRouter's Mistral OCR plugin during a quality retry; the original
 * page images remain in the same Gemma request so layout evidence is retained.
 */
export async function pageImagesAsOcrPdf(inputs: DocumentInput[]): Promise<DocumentInput | null> {
  if (!inputs.length || inputs.some((input) => input.kind !== "image")) return null;
  const decoded = inputs.map((input) => decodeDataUrl(input.url));
  if (decoded.some((item) => item === null)) return null;

  const pdf = await PDFDocument.create();
  for (const item of decoded) {
    if (!item) continue;
    const image = item.mime === "image/png"
      ? await pdf.embedPng(item.bytes)
      : await pdf.embedJpg(item.bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const bytes = await pdf.save({ useObjectStreams: true });
  return {
    kind: "pdf",
    filename: "gainingdocx-quality-retry.pdf",
    url: `data:application/pdf;base64,${encodeBase64(bytes)}`,
  };
}
