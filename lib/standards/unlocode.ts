import dataset from "@/data/unlocode.json";

type UnlocodeDataset = {
  source: string;
  built: string;
  filter: string;
  count: number;
  ports: [string, string][];
};

export const UNLOCODE_DATASET = dataset as UnlocodeDataset;
export const UNLOCODE_RELEASE = "2025-1";
export const UNLOCODE_AUTHORITY = "UNECE";
export const UNLOCODE_SOURCE_URL = "https://unece.org/trade/cefact/unlocode-code-list-country-and-territory";
export const UNLOCODE_PROVENANCE = `${UNLOCODE_AUTHORITY} UN/LOCODE ${UNLOCODE_RELEASE} maritime dataset`;

