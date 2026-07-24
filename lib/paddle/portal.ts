"use server";

import { createClient } from "@/lib/supabase/server";
import { createPaddleServer } from "@/lib/paddle/server";

/**
 * Mint a Paddle customer-portal session for the signed-in user. The portal is
 * where a customer updates payment details, downloads invoices, or cancels —
 * Paddle hosts it, so we never build a billing UI. Returns a short-lived URL.
 */
export async function openBillingPortal(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const { data } = await supabase
    .from("subscriptions")
    .select("paddle_customer_id, paddle_sub_id")
    .eq("owner", user.id)
    .maybeSingle();

  if (!data?.paddle_customer_id) {
    return { error: "No billing account yet — start a subscription first." };
  }

  try {
    const paddle = createPaddleServer();
    const session = await paddle.customerPortalSessions.create(
      data.paddle_customer_id,
      data.paddle_sub_id ? [data.paddle_sub_id] : []
    );
    const url = session.urls?.general?.overview;
    if (!url) return { error: "Could not open the billing portal. Try again." };
    return { url };
  } catch (error) {
    console.error("Paddle portal session failed:", error);
    return { error: "Could not open the billing portal. Try again." };
  }
}
