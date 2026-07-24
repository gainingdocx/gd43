import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { buildUserText, SYSTEM_PROMPT } from "../lib/ai/prompts/extract-v3.ts";

const imagePath = process.argv[2];
const trials = Number(process.argv[3] ?? 2);
if (!imagePath) throw new Error("Usage: benchmark-bol-models.mjs <image> [trials]");
if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required");

const defaultModels = [
  "google/gemma-4-26b-a4b-it",
  "qwen/qwen3-vl-8b-instruct",
  "qwen/qwen3-vl-8b-thinking",
];
const models = process.argv[4]?.split(",").filter(Boolean) ?? defaultModels;
const mime = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
const image = `data:${mime};base64,${(await readFile(imagePath)).toString("base64")}`;
const norm = (value) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const textOf = (value) => JSON.stringify(value ?? {}).toUpperCase();

function jsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object returned");
  return JSON.parse(text.slice(start, end + 1));
}

function partyName(value) {
  return norm(value?.name ?? value);
}

function portName(value) {
  return norm(value?.name ?? value);
}

function anyNumber(fields, key, expected) {
  if (Number(fields?.[key]) === expected) return true;
  const rows = [...(fields?.line_items ?? []), ...(fields?.cargo ?? [])];
  return rows.some((row) => Number(row?.[key]) === expected);
}

function score(raw) {
  const f = raw?.fields ?? {};
  const cargoText = textOf({ raw: f.cargo_raw_text, lines: f.line_items ?? f.cargo });
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
    issue_date: norm(f.issue_date) === "FEB202002" || norm(f.issue_date) === "20FEB2002",
    issue_place: norm(f.issue_place) === "COCHIN",
    container: textOf(f.containers).includes("MAEU5665691"),
    seal: textOf(f.containers).includes("ML-IN0640885"),
    equipment: norm(textOf(f.containers)).includes("20REEF"),
    packages_total: anyNumber(f, "total_packages", 750),
    cargo_groups: /\b200\b/.test(cargoText) && /\b550\b/.test(cargoText),
    net_kg: anyNumber(f, "total_net_kg", 15000) || anyNumber(f, "net_kg", 15000),
    gross_kg: anyNumber(f, "total_gross_kg", 15750) || anyNumber(f, "gross_kg", 15750),
    volume_cbm: anyNumber(f, "total_volume_cbm", 20) || anyNumber(f, "volume_cbm", 20),
    freight_prepaid: norm(f.freight_terms) === "PREPAID",
    lc_number: norm(f.lc_number).includes("079736192") || cargoText.includes("079736192"),
    shipping_bill_ref: textOf(f.export_references).includes("00305/15-2-2002"),
    customs_ref: norm(f.customs_reference).includes("5102000728") || textOf(f.export_references).includes("5102000728"),
    originals: Number(f.originals_count) === 3,
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { passed, total: Object.keys(checks).length, percent: Math.round((passed / Object.keys(checks).length) * 100), checks };
}

async function run(model, trial) {
  const started = performance.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gainingdocx.com",
      "X-Title": "GainingDocx model benchmark",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [
          { type: "text", text: buildUserText("bill_of_lading") },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ] },
      ],
      temperature: 0,
      max_tokens: 8192,
      provider: model.startsWith("google/gemma-")
        ? { quantizations: ["fp8", "bf16"], sort: "throughput", allow_fallbacks: true }
        : { sort: "throughput", allow_fallbacks: true },
      ...(model.endsWith("-thinking") ? { reasoning: { enabled: true, exclude: true } } : {}),
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const elapsedSeconds = Math.round((performance.now() - started) / 100) / 10;
  if (!response.ok) throw new Error(`${model} HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content ?? "";
  const parsed = jsonObject(content);
  const result = score(parsed);
  return {
    model, trial, elapsedSeconds, ...result,
    failed: Object.entries(result.checks).filter(([, passed]) => !passed).map(([field]) => field),
    provider: body.provider,
    usage: body.usage,
    keyFields: {
      bl_number: parsed.fields?.bl_number,
      vessel_name: parsed.fields?.vessel_name,
      voyage_no: parsed.fields?.voyage_no,
      port_of_load: parsed.fields?.port_of_load,
      port_of_discharge: parsed.fields?.port_of_discharge,
      freight_terms: parsed.fields?.freight_terms,
      total_packages: parsed.fields?.total_packages,
      total_net_kg: parsed.fields?.total_net_kg,
      total_gross_kg: parsed.fields?.total_gross_kg,
      total_volume_cbm: parsed.fields?.total_volume_cbm,
      containers: parsed.fields?.containers,
      line_items: parsed.fields?.line_items ?? parsed.fields?.cargo,
    },
  };
}

const results = [];
for (let trial = 1; trial <= trials; trial++) {
  const order = trial % 2 === 1 ? models : [...models].reverse();
  for (const model of order) {
    try {
      const result = await run(model, trial);
      results.push(result);
      console.log(JSON.stringify(result));
    } catch (error) {
      const failed = { model, trial, error: String(error) };
      results.push(failed);
      console.log(JSON.stringify(failed));
    }
  }
}

for (const model of models) {
  const runs = results.filter((result) => result.model === model && !result.error);
  console.log(JSON.stringify({
    summary: model,
    runs: runs.length,
    meanAccuracy: runs.length ? Math.round(runs.reduce((sum, run) => sum + run.percent, 0) / runs.length) : null,
    meanSeconds: runs.length ? Math.round(runs.reduce((sum, run) => sum + run.elapsedSeconds, 0) / runs.length * 10) / 10 : null,
    minAccuracy: runs.length ? Math.min(...runs.map((run) => run.percent)) : null,
    meanCostUsd: runs.length ? Number((runs.reduce((sum, run) => sum + Number(run.usage?.cost ?? 0), 0) / runs.length).toFixed(6)) : null,
    jsonFailures: results.filter((result) => result.model === model && result.error).length,
  }));
}
