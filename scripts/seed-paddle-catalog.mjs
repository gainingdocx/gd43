// Seed the Paddle catalog for GainingDocx: one product ("GainingDocx Pro")
// with a monthly and a yearly USD price. Idempotent — re-running reuses an
// existing product/prices instead of creating duplicates.
//
//   node scripts/seed-paddle-catalog.mjs
//
// Reads PADDLE_API_KEY and PADDLE_ENV from .env.local. Prints the price IDs.
import { readFileSync } from "node:fs";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

function loadEnv() {
  const out = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
  } catch {}
  return out;
}

const env = loadEnv();
const apiKey = process.env.PADDLE_API_KEY || env.PADDLE_API_KEY;
const mode = (process.env.PADDLE_ENV || env.PADDLE_ENV || "sandbox").toLowerCase();
if (!apiKey) {
  console.error("Missing PADDLE_API_KEY in .env.local");
  process.exit(1);
}
if (mode !== "sandbox") {
  console.error(`Refusing to seed: PADDLE_ENV is "${mode}", not "sandbox". This script is for sandbox catalog setup only.`);
  process.exit(1);
}
if (!/^pdl_sdbx_apikey_/.test(apiKey)) {
  console.error("Refusing to seed: PADDLE_API_KEY is not a sandbox key (expected pdl_sdbx_apikey_*).");
  process.exit(1);
}

const paddle = new Paddle(apiKey, { environment: Environment.sandbox });

const PRODUCT_NAME = "GainingDocx Pro";
const MONTHLY_DESC = "Pro monthly USD";
const YEARLY_DESC = "Pro yearly USD";

async function findExistingProduct() {
  const collection = paddle.products.list({ status: ["active"], include: "prices" });
  for await (const product of collection) {
    if (product.name === PRODUCT_NAME) return product;
  }
  return null;
}

async function seed() {
  let product = await findExistingProduct();
  if (product) {
    console.error(`Reusing existing product ${product.id} ("${PRODUCT_NAME}").`);
  } else {
    product = await paddle.products.create({
      name: PRODUCT_NAME,
      taxCategory: "saas",
      description: "Unlimited-tier plan for shipping teams: 200 documents/month, watermark-free exports, document generation and unlimited Shipment Checks.",
    });
    console.error(`Created product ${product.id}.`);
  }

  const existingPrices = [];
  const priceColl = paddle.prices.list({ productId: [product.id], status: ["active"] });
  for await (const p of priceColl) existingPrices.push(p);

  const byDesc = (desc) => existingPrices.find((p) => p.description === desc);

  let monthly = byDesc(MONTHLY_DESC);
  if (!monthly) {
    monthly = await paddle.prices.create({
      productId: product.id,
      description: MONTHLY_DESC,
      unitPrice: { amount: "1900", currencyCode: "USD" }, // $19.00
      billingCycle: { interval: "month", frequency: 1 },
    });
    console.error(`Created monthly price ${monthly.id}.`);
  } else {
    console.error(`Reusing monthly price ${monthly.id}.`);
  }

  let yearly = byDesc(YEARLY_DESC);
  if (!yearly) {
    yearly = await paddle.prices.create({
      productId: product.id,
      description: YEARLY_DESC,
      unitPrice: { amount: "19000", currencyCode: "USD" }, // $190.00
      billingCycle: { interval: "year", frequency: 1 },
    });
    console.error(`Created yearly price ${yearly.id}.`);
  } else {
    console.error(`Reusing yearly price ${yearly.id}.`);
  }

  // Machine-readable result on stdout (stderr carried the human log above).
  console.log(JSON.stringify({ productId: product.id, monthlyId: monthly.id, yearlyId: yearly.id }, null, 2));
}

seed().catch((e) => {
  console.error("SEED FAILED:", e?.detail || e?.message || e);
  process.exit(1);
});
