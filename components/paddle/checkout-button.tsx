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
  children,
  ...buttonProps
}: { priceId: string } & ButtonProps) {
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
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/app?upgraded=1`,
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
