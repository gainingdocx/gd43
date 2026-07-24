import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import sharp from "sharp";

import { buildUserText, SYSTEM_PROMPT } from "../lib/ai/prompts/extract-v3.ts";

const imagePath = process.argv[2];
const selected = new Set((process.argv[3] ?? "baseline,raw,deterministic,native,thinking").split(","));
if (!imagePath) throw new Error("Usage: benchmark-gemma-settings.mjs <image> [comma-separated variants]");
if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required");

const source = await readFile(imagePath);
const prepared = await sharp(source)
  .resize({ width: 1536, height: 2048, fit: "inside", kernel: "lanczos3", withoutEnlargement: false })
  .modulate({ brightness: 1 })
  .linear(1.08, -10)
  .jpeg({ quality: 88 })
  .toBuffer();

const MODEL = "google/gemma-4-26b-a4b-it";
const variants = [
  { name: "baseline", image: prepared, parameters: { temperature: 0 } },
  { name: "raw", image: source, parameters: { temperature: 0 } },
  { name: "deterministic", image: source, parameters: { temperature: 0.1, top_p: 0.95, top_k: 64 } },
  { name: "native", image: source, parameters: { temperature: 1, top_p: 0.95, top_k: 64 } },
  { name: "thinking", image: source, parameters: { temperature: 0.1, top_p: 0.95, top_k: 64, reasoning: { enabled: true, exclude: true } } },
].filter((variant) => selected.has(variant.name));

const norm = (value) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const textOf = (value) => JSON.stringify(value ?? {}).toUpperCase();

function jsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object returned");
  return JSON.parse(text.slice(start, end + 1));
}

function anyNumber(fields, keys, expected) {
  if (keys.some((key) => Number(fields?.[key]) === expected)) return true;
  const rows = [...(fields?.line_items ?? []), ...(fields?.cargo ?? [])];
  return rows.some((row) => keys.some((key) => Number(row?.[key]) === expected));
}

function score(raw) {
  const f = raw?.fields ?? {};
  const cargoText = textOf({ raw: f.cargo_raw_text, lines: f.line_items ?? f.cargo });
  const partyName = (value) => norm(value?.name ?? value);
  const portName = (value) => norm(value?.name ?? value);
  const checks = {
    json_and_type: raw?.detected_type === "bill_of_lading",
    bl_number: norm(f.bl_number) === "COKA06793",
    carrier: norm(f.carrier_name).includes("MAERSKSEALAND"),
    shipper_name: partyName(f.shipper).includes("UPSANAEXPORTS"),
    shipper_zip: textOf(f.shipper).includes("682006"),
    consignee: partyName(f.consignee).includes("YAPIVEKREDIBANKASI"),
    notify: partyName(f.notify).includes("OSMANAKSIYIK"),
    vessel: norm(f.vessel_name) === "RSKATLANTIC",
    voyage: norm(f.voyage_no) === "0213",
    port_load: portName(f.port_of_load).startsWith("COCHIN"),
    port_discharge: portName(f.port_of_discharge) === "IZMIR",
    onboard_date: norm(f.shipped_on_board_date) === "19FEB2002",
    issue_date: ["FEB202002", "20FEB2002"].includes(norm(f.issue_date)),
    issue_place: norm(f.issue_place) === "COCHIN",
    container: textOf(f.containers).includes("MAEU5665691"),
    seal: textOf(f.containers).includes("ML-IN0640885"),
    equipment: norm(textOf(f.containers)).includes("20REEF"),
    packages_total: anyNumber(f, ["total_packages", "packages"], 750),
    cargo_groups: /\b200\b/.test(cargoText) && /\b550\b/.test(cargoText),
    net_kg: anyNumber(f, ["total_net_kg", "net_kg"], 15000),
    gross_kg: anyNumber(f, ["total_gross_kg", "gross_kg"], 15750),
    volume_cbm: anyNumber(f, ["total_volume_cbm", "volume_cbm"], 20),
    freight_prepaid: norm(f.freight_terms) === "PREPAID",
    lc_number: norm(f.lc_number).includes("079736192") || cargoText.includes("079736192"),
    shipping_bill_ref: textOf(f.export_references).includes("00305/15-2-2002"),
    customs_ref: norm(f.customs_reference).includes("5102000728") || textOf(f.export_references).includes("5102000728"),
    originals: Number(f.originals_count) === 3,
  };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return { passed: Object.keys(checks).length - failed.length, total: Object.keys(checks).length, failed };
}

for (const variant of variants) {
  const dataUrl = `data:image/jpeg;base64,${variant.image.toString("base64")}`;
  const started = performance.now();
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gainingdocx.com",
        "X-Title": "GainingDocx Gemma settings benchmark",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [
            { type: "text", text: buildUserText("bill_of_lading") },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ] },
        ],
        max_tokens: 8192,
        provider: { quantizations: ["fp8", "bf16"], sort: "throughput", allow_fallbacks: true },
        ...variant.parameters,
      }),
      signal: AbortSignal.timeout(125_000),
    });
    const elapsedSeconds = Math.round((performance.now() - started) / 100) / 10;
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const body = await response.json();
    const parsed = jsonObject(body.choices?.[0]?.message?.content ?? "");
    const result = score(parsed);
    console.log(JSON.stringify({
      variant: variant.name,
      model: body.model ?? MODEL,
      elapsedSeconds,
      accuracy: Math.round(result.passed / result.total * 100),
      ...result,
      usage: body.usage,
      provider: body.provider,
      keyFields: {
        bl_number: parsed.fields?.bl_number,
        vessel_name: parsed.fields?.vessel_name,
        freight_terms: parsed.fields?.freight_terms,
        total_packages: parsed.fields?.total_packages,
        export_references: parsed.fields?.export_references,
      },
    }));
  } catch (error) {
    console.log(JSON.stringify({ variant: variant.name, elapsedSeconds: Math.round((performance.now() - started) / 100) / 10, error: String(error) }));
  }
}
