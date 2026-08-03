"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { paddleClientToken, paddleEnvironment } from "@/lib/paddle/config";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Opens Paddle Checkout for a given price. Requires a signed-in user: the
 * user's id is passed as `customData.userId` so the webhook can attribute the
 * resulting subscription to the right account. Anonymous clickers are sent to
 * sign-up first and returned to pricing.
 */
export function CheckoutButton({
  priceId,
  plan,
  children,
  ...buttonProps
}: { priceId: string; plan: "pro" | "team" } & ButtonProps) {
  const paddleRef = useRef<Paddle | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!paddleClientToken) return;
    let active = true;
    initializePaddle({ environment: paddleEnvironment, token: paddleClientToken })
      .then((paddle) => {
        if (!active || !paddle) return;
        paddleRef.current = paddle;
        setReady(true);
      })
      .catch((error) => console.error("Paddle init failed:", error));
    return () => {
      active = false;
    };
  }, []);

  async function startCheckout() {
    const paddle = paddleRef.current;
    if (!paddle) return;
    setBusy(true);
    try {
      const { data } = await createClient().auth.getUser();
      const user = data.user;
      if (!user) {
        window.location.href = "/auth/sign-up?next=/pricing";
        return;
      }
      const statusResponse = await fetch("/api/billing/status", { cache: "no-store" });
      if (statusResponse.ok) {
        const status = await statusResponse.json() as { isPaid?: boolean; plan?: string };
        if (status.isPaid) {
          if (status.plan === plan) {
            window.location.href = "/app/account";
            return;
          }
          const portalResponse = await fetch("/api/billing/portal", { method: "POST" });
          const portal = await portalResponse.json() as { url?: string };
          window.location.href = portal.url ?? "/app/account";
          return;
        }
      }
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id, plan },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/app/account?checkout=success`,
        },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button {...buttonProps} disabled={!ready || busy || buttonProps.disabled} onClick={() => void startCheckout()}>
      {busy ? "Opening checkout…" : children}
    </Button>
  );
}
