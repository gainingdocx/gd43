"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AddressCopy({ address }: { address: string }) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setFeedback("copied");
      window.setTimeout(() => setFeedback("idle"), 2200);
    } catch {
      setFeedback("error");
    }
  }
  return (
    <div>
      <label htmlFor="email-in-address" className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Send or forward the email to this exact address</label>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row">
        <input id="email-in-address" readOnly value={address} onFocus={(event) => event.currentTarget.select()} className="min-h-12 min-w-0 flex-1 rounded-xl border border-primary/20 bg-background px-4 font-mono text-sm font-bold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Button type="button" onClick={() => void copy()} className="shrink-0" aria-describedby="copy-feedback">
            {feedback === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {feedback === "copied" ? "Copied" : "Copy address"}
          </Button>
          <Button render={<a href={`mailto:${address}?subject=${encodeURIComponent("Shipment documents for review")}`} />} type="button" variant="outline" className="shrink-0 bg-white">
            <Mail className="size-4" aria-hidden /> Open email app
          </Button>
        </div>
      </div>
      <p id="copy-feedback" role="status" aria-live="polite" className={`mt-2 min-h-5 text-xs ${feedback === "error" ? "text-destructive" : "text-success"}`}>
        {feedback === "copied" ? "Address copied. Paste it into the To field of your email." : feedback === "error" ? "Copy was blocked. Select the address above and copy it manually." : ""}
      </p>
    </div>
  );
}
