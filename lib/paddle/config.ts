// Shared Paddle configuration, safe to import from client or server.
// Everything here is public: the client-side token, the environment, and the
// catalog price IDs. Secrets (API key, webhook secret) live only in server.ts.

const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";

/** Sandbox client tokens are prefixed `test_`; live ones `live_`. Deriving the
 *  environment from the token means there's no separate flag to keep in sync. */
export const paddleEnvironment: "sandbox" | "production" =
  clientToken.startsWith("test_") ? "sandbox" : "production";

export const paddleClientToken = clientToken;

export const PADDLE_PRICES = {
  proMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ?? "",
  proYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY ?? "",
} as const;

export type PlanId = "free" | "pro";

/** Map a Paddle price ID back to an internal plan. Unknown prices → null so the
 *  webhook can log and ignore rather than granting access by accident. */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === PADDLE_PRICES.proMonthly || priceId === PADDLE_PRICES.proYearly) return "pro";
  return null;
}

/** True only when the client token and both price IDs are present, so the UI
 *  can fall back to the "contact us" flow until billing is fully wired. */
export const paddleConfigured = Boolean(
  paddleClientToken && PADDLE_PRICES.proMonthly && PADDLE_PRICES.proYearly
);
