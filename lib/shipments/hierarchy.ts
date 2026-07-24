import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";

export type BillIdentity =
  | { level: "master"; blNumber: string; masterBlNumber: string; houseBlNumber: null }
  | { level: "house"; blNumber: string; masterBlNumber: string; houseBlNumber: string }
  | { level: "standalone"; blNumber: string; masterBlNumber: null; houseBlNumber: null }
  | null;

export function normalizeBillNumber(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function billIdentity(extraction: NormalizedExtraction): BillIdentity {
  if (extraction.detected_type !== "bill_of_lading") return null;
  const fields = extraction.fields;
  const bl = normalizeBillNumber(fields.bl_number);
  if (!bl) return null;
  if (fields.bl_level === "house") {
    const house = normalizeBillNumber(fields.house_bl_number) || bl;
    const master = normalizeBillNumber(fields.master_bl_number);
    return master
      ? { level: "house", blNumber: house, masterBlNumber: master, houseBlNumber: house }
      : { level: "standalone", blNumber: house, masterBlNumber: null, houseBlNumber: null };
  }
  if (fields.bl_level === "master") {
    const master = normalizeBillNumber(fields.master_bl_number) || bl;
    return { level: "master", blNumber: master, masterBlNumber: master, houseBlNumber: null };
  }
  return { level: "standalone", blNumber: bl, masterBlNumber: null, houseBlNumber: null };
}

