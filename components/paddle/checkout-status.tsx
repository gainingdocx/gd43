"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export function CheckoutStatus({ isPaid, plan }: { isPaid: boolean; plan: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isPaid) return;
    let attempts = 0;
    let stopped = false;
    const poll = async () => {
      attempts += 1;
      try {
        const response = await fetch("/api/billing/status", { cache: "no-store" });
        const status = await response.json() as { isPaid?: boolean };
        if (status.isPaid) {
          stopped = true;
          router.refresh();
          return;
        }
      } catch {}
      if (!stopped && attempts < 15) window.setTimeout(poll, 2000);
      else if (!stopped) setTimedOut(true);
    };
    void poll();
    return () => { stopped = true; };
  }, [isPaid, router]);

  if (isPaid) {
    return <div role="status" className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success"><CheckCircle2 className="size-4" aria-hidden />Payment confirmed. {plan === "team" ? "Team" : "Pro"} access is active.</div>;
  }
  return <div role="status" className="flex items-center gap-2 rounded-xl border border-signal/30 bg-secondary px-4 py-3 text-sm text-primary"><Loader2 className="size-4 animate-spin" aria-hidden />{timedOut ? "Payment was received, but access is still syncing. Refresh shortly or contact support if this continues." : "Payment received. Activating Pro access…"}</div>;
}
