// Read-only audit of the configured Paddle sandbox or live account.
// Usage: node scripts/audit-paddle.mjs [sandbox|live]
import { readFileSync } from "node:fs";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

function loadEnvFile() {
  const values = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[match[1]] = value;
    }
  } catch {}
  return values;
}

const fileEnv = loadEnvFile();
const mode = (process.argv[2] || "sandbox").toLowerCase();
if (!new Set(["sandbox", "live"]).has(mode)) {
  throw new Error("Usage: node scripts/audit-paddle.mjs [sandbox|live]");
}

const isLive = mode === "live";
const apiKey = process.env[isLive ? "PADDLE_LIVE_API_KEY" : "PADDLE_API_KEY"] ||
  fileEnv[isLive ? "PADDLE_LIVE_API_KEY" : "PADDLE_API_KEY"];
const clientToken = process.env[isLive ? "PADDLE_LIVE_CLIENT_TOKEN" : "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"] ||
  fileEnv[isLive ? "PADDLE_LIVE_CLIENT_TOKEN" : "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"];

if (!apiKey) throw new Error(`Missing ${isLive ? "PADDLE_LIVE_API_KEY" : "PADDLE_API_KEY"}`);
if (isLive ? !apiKey.startsWith("pdl_live_apikey_") : !apiKey.startsWith("pdl_sdbx_apikey_")) {
  throw new Error(`${mode} API key has the wrong prefix`);
}

const paddle = new Paddle(apiKey, { environment: isLive ? Environment.production : Environment.sandbox });
const products = [];
for await (const product of paddle.products.list({ status: ["active"] })) {
  products.push({ id: product.id, name: product.name, status: product.status, taxCategory: product.taxCategory });
}
const prices = [];
for await (const price of paddle.prices.list({ status: ["active"] })) {
  prices.push({
    id: price.id,
    productId: price.productId,
    description: price.description,
    amount: price.unitPrice.amount,
    currency: price.unitPrice.currencyCode,
    billingCycle: price.billingCycle,
    status: price.status,
  });
}

let notifications;
try {
  notifications = (await paddle.notificationSettings.list()).map((setting) => ({
    id: setting.id,
    description: setting.description,
    destination: setting.destination,
    active: setting.active,
    trafficSource: setting.trafficSource,
    subscribedEvents: setting.subscribedEvents.map((event) => event.name),
  }));
} catch (error) {
  notifications = { unavailable: error?.message || String(error) };
}

let checkoutDomains;
try {
  const response = await fetch(`${isLive ? "https://api.paddle.com" : "https://sandbox-api.paddle.com"}/checkout-domains`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await response.json();
  checkoutDomains = response.ok
    ? body.data.map(({ id, domain, status }) => ({ id, domain, status }))
    : { unavailable: body?.error?.detail || `HTTP ${response.status}` };
} catch (error) {
  checkoutDomains = { unavailable: error?.message || String(error) };
}

const subscriptions = [];
try {
  for await (const subscription of paddle.subscriptions.list()) {
    subscriptions.push({
      id: subscription.id,
      status: subscription.status,
      priceIds: subscription.items.map((item) => item.price.id),
      nextBilledAt: subscription.nextBilledAt,
    });
  }
} catch (error) {
  subscriptions.push({ unavailable: error?.message || String(error) });
}

console.log(JSON.stringify({
  mode,
  credentials: {
    apiKey: "valid format; API requests succeeded",
    clientToken: clientToken
      ? (isLive ? clientToken.startsWith("live_") : clientToken.startsWith("test_")) ? "valid format" : "wrong prefix"
      : "missing",
  },
  products,
  prices,
  notifications,
  checkoutDomains,
  subscriptions,
}, null, 2));
