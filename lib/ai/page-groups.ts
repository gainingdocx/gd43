import { MAX_OUTPUT_TOKENS, MODEL_PRIMARY, OPENROUTER_BASE_URL, PROVIDER_PREFS, REQUEST_TIMEOUT_MS } from "./config";
import { repairJson } from "./json";
import { DETECTED_TYPES, type DetectedType } from "./schemas/shared";

export interface LogicalPageGroup {
  pages: number[];
  detectedType: DetectedType;
  documentKey: string | null;
}

interface ClassifiedPage { page?: unknown; detected_type?: unknown; document_key?: unknown; starts_new_document?: unknown }

export function normalizePageGroups(raw: unknown, pageCount: number): LogicalPageGroup[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { pages?: unknown }).pages)) return [{ pages: Array.from({ length: pageCount }, (_, i) => i + 1), detectedType: "other", documentKey: null }];
  const classified = ((raw as { pages: ClassifiedPage[] }).pages).map((item) => ({
    page: typeof item.page === "number" && Number.isInteger(item.page) ? item.page : -1,
    detectedType: DETECTED_TYPES.includes(item.detected_type as DetectedType) ? item.detected_type as DetectedType : "other",
    documentKey: typeof item.document_key === "string" && item.document_key.trim() ? item.document_key.trim().slice(0, 120) : null,
    starts: item.starts_new_document === true,
  })).sort((a, b) => a.page - b.page);
  if (classified.length !== pageCount || classified.some((item, index) => item.page !== index + 1)) return [{ pages: Array.from({ length: pageCount }, (_, i) => i + 1), detectedType: "other", documentKey: null }];
  const groups: LogicalPageGroup[] = [];
  for (const item of classified) {
    const previous = groups.at(-1);
    const boundary = !previous || item.starts || (item.documentKey && previous.documentKey && item.documentKey !== previous.documentKey) || (item.detectedType !== "other" && previous.detectedType !== "other" && item.detectedType !== previous.detectedType);
    if (boundary) groups.push({ pages: [item.page], detectedType: item.detectedType, documentKey: item.documentKey });
    else {
      previous.pages.push(item.page);
      if (previous.detectedType === "other" && item.detectedType !== "other") previous.detectedType = item.detectedType;
      if (!previous.documentKey && item.documentKey) previous.documentKey = item.documentKey;
    }
  }
  return groups.length ? groups : [{ pages: Array.from({ length: pageCount }, (_, i) => i + 1), detectedType: "other", documentKey: null }];
}

export async function classifyPageGroups(imageUrls: string[]): Promise<LogicalPageGroup[]> {
  if (imageUrls.length <= 1 || !process.env.OPENROUTER_API_KEY) return [{ pages: [1], detectedType: "other", documentKey: null }];
  const prompt = `Classify each uploaded page and find logical document boundaries. A multi-page continuation stays with the previous document even when headers repeat. Start a new document only when the document type changes or a clearly different primary document reference begins. Return JSON only: {"pages":[{"page":1,"detected_type":"one supported type","document_key":"printed primary reference or null","starts_new_document":true}]}. Include every page exactly once in order. Supported types: ${DETECTED_TYPES.join(", ")}.`;
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://gainingdocx.com", "X-Title": "GainingDocx" },
    body: JSON.stringify({ model: MODEL_PRIMARY, stream: false, temperature: 0, max_tokens: Math.min(MAX_OUTPUT_TOKENS, 3000), provider: PROVIDER_PREFS, messages: [{ role: "system", content: "You classify freight-document pages into contiguous logical documents. Never invent references." }, { role: "user", content: [{ type: "text", text: prompt }, ...imageUrls.map((url) => ({ type: "image_url", image_url: { url, detail: "low" } }))] }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`page classifier HTTP ${response.status}`);
  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("page classifier returned no content");
  return normalizePageGroups(repairJson(content), imageUrls.length);
}
