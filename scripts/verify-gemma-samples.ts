import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { parseDocument } from "../lib/ai/router";
import { validateDocument } from "../lib/validators";

if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required");

type Fields = Record<string, unknown> & {
  cargo?: Array<Record<string, unknown>>;
  containers?: Array<Record<string, unknown>>;
};
type Check = [name: string, test: (fields: Fields) => boolean];
type Sample = { file: string; checks: Check[] };

const norm = (value: unknown) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const text = (value: unknown) => norm(JSON.stringify(value ?? null));
const fieldText = (fields: Fields, key: string) => text(fields[key]);
const numberAppears = (fields: Fields, expected: number) => {
  const candidates = [
    fields.total_packages, fields.total_net_kg, fields.total_gross_kg, fields.total_volume_cbm,
    fields.originals_count,
    ...(fields.cargo ?? []).flatMap((row: Fields) => [row.packages, row.cartons, row.net_kg, row.gross_kg, row.volume_cbm]),
    ...(fields.containers ?? []).flatMap((row: Fields) => [row.packages, row.gross_kg, row.volume_cbm]),
  ];
  return candidates.some((value) => Number(value) === expected);
};
const contains = (key: string, expected: string): Check => [key, (fields) => fieldText(fields, key).includes(norm(expected))];
const isNumber = (name: string, expected: number): Check => [name, (fields) => numberAppears(fields, expected)];

const samples: Sample[] = [
  {
    file: "1000048211.png",
    checks: [
      contains("bl_number", "COKA04793"), contains("carrier_name", "MAERSK SEALAND"),
      contains("shipper", "UPSANA EXPORTS"), contains("consignee", "YAPI VE KREDI BANKASI"),
      contains("notify", "OSMAN AKBIYIK"), contains("vessel_name", "MAERSK ATLANTIC"),
      contains("voyage_no", "0213"), contains("port_of_load", "COCHIN"), contains("port_of_discharge", "IZMIR"),
      contains("containers", "MAEU5665691"), contains("containers", "ML-IN0640885"),
      isNumber("packages_750", 750), isNumber("net_15000", 15_000), isNumber("gross_15750", 15_750),
      isNumber("volume_20", 20), contains("freight_terms", "PREPAID"), isNumber("originals_3", 3),
    ],
  },
  {
    file: "1.webp",
    checks: [
      contains("bl_number", "HLCUSZX2304BPJJ6"), contains("shipper", "XIN NAN TRADING LIMITED"),
      contains("consignee", "IMPORTACIONES Y REPRESENTACIONES"), contains("vessel_name", "CISNES"),
      contains("voyage_no", "2317E"), contains("port_of_load", "YANTIAN"), contains("port_of_discharge", "ARICA"),
      contains("containers", "FFAU1235086"), contains("containers", "HLD1296693"),
      isNumber("packages_262", 262), isNumber("gross_6650", 6_650), isNumber("volume_67", 67),
      contains("freight_terms", "PREPAID"), isNumber("originals_3", 3),
    ],
  },
  {
    file: "1 (1).webp",
    checks: [
      ["blank_bl_number", (fields) => fields.bl_number === null], contains("carrier_name", "MEDITERRANEAN SHIPPING COMPANY"),
      contains("shipper", "ADAMU BIRHANU DAYO"), contains("consignee", "TO ORDER"),
      contains("notify", "VOLCAFE LTD"), contains("port_of_load", "DJIBOUTI"),
      contains("port_of_discharge", "BERMERHAVEN"), isNumber("net_60", 60),
      isNumber("gross_19456", 19_456), isNumber("originals_3", 3),
    ],
  },
  {
    file: "1 (2).webp",
    checks: [
      contains("bl_number", "COSU34443593012"), contains("shipper", "CHONGQING HI-SEA MARINE EQUIPMENT"),
      contains("consignee", "TECNOLITE PRODUTOS TECNICOS LTDA"), contains("vessel_name", "XIN FU ZHOU"),
      contains("voyage_no", "075W"), contains("port_of_load", "SHANGHAI"), contains("port_of_discharge", "SANTOS"),
      isNumber("packages_2", 2), isNumber("gross_780", 780), isNumber("volume_1_17", 1.17),
      contains("freight_terms", "PREPAID"), isNumber("originals_3", 3),
    ],
  },
  {
    file: "1715835783.webp",
    checks: [
      contains("bl_number", "BEECL2910001"), contains("shipper", "GOLDEN TOP CO LTD"),
      contains("consignee", "ABC MART KOREA CO LTD"), contains("vessel_name", "YM CERTAINTY"),
      contains("voyage_no", "039N"), contains("port_of_load", "HAIPHONG"), contains("port_of_discharge", "INCHEON"),
      contains("containers", "HASC672129"), isNumber("packages_280", 280), isNumber("gross_1500", 1_500),
      isNumber("volume_28", 28), contains("freight_terms", "COLLECT"), isNumber("originals_3", 3),
    ],
  },
];

async function run(sample: Sample) {
  const sampleRoot = process.env.SAMPLE_ROOT ?? join(process.cwd(), "Sample", "Bill_Lading");
  const path = join(sampleRoot, sample.file);
  const source = await readFile(path);
  const metadata = await sharp(source).metadata();
  const isSupportedOcrPdfImage = metadata.format === "png" || metadata.format === "jpeg";
  const prepared = isSupportedOcrPdfImage
    ? source
    : await sharp(source).flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
  const mime = metadata.format === "png" ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mime};base64,${prepared.toString("base64")}`;
  const started = Date.now();
  const result = await parseDocument([dataUrl], "bill_of_lading");
  const extraction = result.extraction;
  const fields = extraction.fields as unknown as Fields;
  const results = sample.checks.map(([name, test]) => ({ name, passed: test(fields) }));
  const failures = results.filter((item) => !item.passed).map((item) => item.name);
  const blockingValidation = validateDocument(extraction).filter((item) => item.status === "fail");
  return {
    file: sample.file,
    model: result.model,
    provider: result.provider,
    escalated: result.escalated,
    qualityScore: result.qualityScore,
    seconds: Math.round((Date.now() - started) / 100) / 10,
    fieldsPassed: results.length - failures.length,
    fieldsTotal: results.length,
    accuracy: Math.round(((results.length - failures.length) / results.length) * 100),
    failures,
    blockingValidation: blockingValidation.map((item) => ({ rule: item.rule, field: item.field, message: item.message })),
    keyFields: {
      bl_number: fields.bl_number, vessel_name: fields.vessel_name, voyage_no: fields.voyage_no,
      total_packages: fields.total_packages, total_net_kg: fields.total_net_kg,
      total_gross_kg: fields.total_gross_kg, total_volume_cbm: fields.total_volume_cbm,
    },
  };
}

async function main() {
  const selectedSamples = process.env.SAMPLE_FILTER
    ? samples.filter((sample) => sample.file === process.env.SAMPLE_FILTER)
    : samples;
  // Run sequentially so a five-document benchmark measures extraction quality
  // rather than saturating OpenRouter and manufacturing timeout failures.
  const settled: PromiseSettledResult<Awaited<ReturnType<typeof run>>>[] = [];
  for (const sample of selectedSamples) settled.push(await Promise.resolve(run(sample)).then(
    (value) => ({ status: "fulfilled", value } as const),
    (reason) => ({ status: "rejected", reason } as const)
  ));
  const results = settled.map((item, index) => item.status === "fulfilled"
    ? item.value
    : { file: selectedSamples[index].file, error: String(item.reason) });
  console.log(JSON.stringify(results, null, 2));
  if (settled.some((item) => item.status === "rejected")) process.exitCode = 1;
}

void main();
