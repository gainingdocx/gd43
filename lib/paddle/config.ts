// Public Paddle configuration shared by browser and server bundles.
const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";

export const paddleEnvironment: "sandbox" | "production" =
  clientToken.startsWith("test_") ? "sandbox" : "production";

export const paddleClientToken = clientToken;

export const PADDLE_PRICES = {
  proMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ?? "",
  teamMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAM_MONTHLY ?? "",
} as const;

export type PlanId = "free" | "pro" | "team";

/** Legacy IDs stay recognizable for existing subscribers, but are never shown
 * in checkout. This lets an older annual subscription retain Pro access until
 * it ends while the public catalog remains monthly-only. */
const LEGACY_PRO_PRICE_IDS = new Set(
  (process.env.NEXT_PUBLIC_PADDLE_LEGACY_PRO_PRICE_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === PADDLE_PRICES.proMonthly || LEGACY_PRO_PRICE_IDS.has(priceId)) return "pro";
  if (priceId === PADDLE_PRICES.teamMonthly) return "team";
  return null;
}

export const paddleConfigured = Boolean(
  paddleClientToken && PADDLE_PRICES.proMonthly && PADDLE_PRICES.teamMonthly
);

// A production build carrying test credentials never exposes checkout.
export const checkoutEnabled =
  paddleConfigured &&
  (paddleEnvironment === "production" || process.env.NODE_ENV === "development");
