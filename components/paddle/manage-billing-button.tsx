"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/lib/paddle/portal";

/** Opens the Paddle-hosted customer portal (update card, invoices, cancel). */
export function ManageBillingButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    setBusy(true);
    setError("");
    const result = await openBillingPortal();
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void open()}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CreditCard className="size-4" aria-hidden />}
        {busy ? "Opening…" : "Manage billing"}
      </Button>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
