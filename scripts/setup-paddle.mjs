// Idempotently configures the monthly-only Free/Pro/Team Paddle catalog and
// production webhook. Live changes require an explicit confirmation flag.
import { readFileSync, writeFileSync } from "node:fs";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const ENV_FILE = ".env.local";
const WEBHOOK_URL = "https://gainingdocx.com/api/webhooks/paddle";
const EVENTS = [
  "subscription.activated", "subscription.canceled", "subscription.created",
  "subscription.past_due", "subscription.paused", "subscription.resumed",
  "subscription.trialing", "subscription.updated", "transaction.completed",
  "transaction.payment_failed",
];
const CATALOG = [
  { key: "pro", name: "GainingDocx Pro", description: "Individual freight-document automation with 500 documents per month, API, webhooks, integrations, and watermark-free output.", priceDescription: "Pro monthly USD — $31", amount: "3100" },
  { key: "team", name: "GainingDocx Team", description: "Five-seat shared freight-document workspace with 2,000 documents per month, roles, assignments, approvals, integrations, and pooled usage.", priceDescription: "Team monthly USD — $94", amount: "9400" },
];

function parseEnv(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}
function setEnv(source, name, value) {
  const escaped = String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const line = `${name}="${escaped}"`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

const mode = (process.argv[2] || "sandbox").toLowerCase();
const isLive = mode === "live";
if (!new Set(["sandbox", "live"]).has(mode) || (isLive && !process.argv.includes("--confirm-live"))) {
  throw new Error("Usage: node scripts/setup-paddle.mjs sandbox | live --confirm-live");
}
let envSource = readFileSync(ENV_FILE, "utf8");
const env = parseEnv(envSource);
const apiKeyName = isLive ? "PADDLE_LIVE_API_KEY" : "PADDLE_API_KEY";
const apiKey = process.env[apiKeyName] || env[apiKeyName];
if (!apiKey || (isLive ? !apiKey.startsWith("pdl_live_apikey_") : !apiKey.startsWith("pdl_sdbx_apikey_"))) throw new Error("Missing or mismatched Paddle API key");
const paddle = new Paddle(apiKey, { environment: isLive ? Environment.production : Environment.sandbox });

const allProducts = [];
for await (const product of paddle.products.list()) allProducts.push(product);
const allExistingPrices = [];
for await (const price of paddle.prices.list()) allExistingPrices.push(price);
const selectedPriceIds = new Set();
const resultCatalog = {};

for (const spec of CATALOG) {
  let product = allProducts.find((candidate) => candidate.name === spec.name && candidate.status === "active");
  if (!product) product = await paddle.products.create({ name: spec.name, taxCategory: "saas", description: spec.description });
  else product = await paddle.products.update(product.id, { description: spec.description, taxCategory: "saas" });
  let price = allExistingPrices.find((candidate) => candidate.productId === product.id && candidate.description === spec.priceDescription && candidate.status === "active");
  if (!price) price = await paddle.prices.create({ productId: product.id, description: spec.priceDescription, unitPrice: { amount: spec.amount, currencyCode: "USD" }, billingCycle: { interval: "month", frequency: 1 } });
  selectedPriceIds.add(price.id);
  resultCatalog[spec.key] = { productId: product.id, priceId: price.id, amount: spec.amount };
}

// With no existing subscribers, obsolete catalog prices can be archived. If a
// subscription is added later, this still stops new sales without canceling it.
const archivedPriceIds = [];
for (const price of allExistingPrices) {
  if (price.status === "active" && !selectedPriceIds.has(price.id)) {
    await paddle.prices.update(price.id, { status: "archived" });
    archivedPriceIds.push(price.id);
  }
}

const allSettings = await paddle.notificationSettings.list();
let notification = allSettings.find((setting) => setting.destination === WEBHOOK_URL) || allSettings.find((setting) => setting.description.toLowerCase().includes("gainingdocx"));
notification = notification
  ? await paddle.notificationSettings.update(notification.id, { description: `GainingDocx ${mode} production webhook`, destination: WEBHOOK_URL, active: true, trafficSource: "platform", subscribedEvents: EVENTS })
  : await paddle.notificationSettings.create({ description: `GainingDocx ${mode} production webhook`, destination: WEBHOOK_URL, type: "url", trafficSource: "platform", subscribedEvents: EVENTS });

const suffix = isLive ? "_LIVE" : "";
envSource = setEnv(envSource, `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY${suffix}`, resultCatalog.pro.priceId);
envSource = setEnv(envSource, `NEXT_PUBLIC_PADDLE_PRICE_TEAM_MONTHLY${suffix}`, resultCatalog.team.priceId);
envSource = setEnv(envSource, isLive ? "PADDLE_LIVE_WEBHOOK_SECRET" : "PADDLE_WEBHOOK_SECRET", notification.endpointSecretKey);
envSource = setEnv(envSource, `NEXT_PUBLIC_PADDLE_LEGACY_PRO_PRICE_IDS${suffix}`, archivedPriceIds.join(","));
writeFileSync(ENV_FILE, envSource, { encoding: "utf8", mode: 0o600 });

console.log(JSON.stringify({ mode, catalog: resultCatalog, archivedPriceIds, notificationId: notification.id, notificationDestination: notification.destination, credentialsSavedTo: ENV_FILE }, null, 2));
