"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function MfaChallenge({ next }: { next: string }) {
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.mfa.listFactors().then(({ data }) => {
      const factor = data?.totp.find((item) => item.status === "verified");
      if (!factor) {
        location.replace(next);
        return;
      }
      setFactorId(factor.id);
      setLoading(false);
    });
  }, [next]);

  async function verify() {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Enter the current six-digit code from your authenticator app.");
      return;
    }
    setVerifying(true);
    setError("");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setError("That code was not accepted. Wait for a new code and try again.");
      setVerifying(false);
      return;
    }
    location.replace(next);
  }

  return (
    <div className="rounded-3xl border border-border bg-white/85 p-7 shadow-xl shadow-primary/5 sm:p-9">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><ShieldCheck className="size-6" aria-hidden /></span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-primary">Two-step verification</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Open your authenticator app and enter the current six-digit code.</p>
      {loading ? (
        <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Checking your security settings…</div>
      ) : (
        <div className="mt-7 space-y-4">
          <label htmlFor="mfa-code" className="block text-sm font-semibold">
            Authentication code
            <input id="mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(event) => { if (event.key === "Enter") void verify(); }} inputMode="numeric" autoComplete="one-time-code" autoFocus className="mt-1.5 h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-2xl tracking-[0.35em] outline-none focus-visible:border-ring" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button size="lg" className="h-12 w-full" disabled={verifying} onClick={() => void verify()}>{verifying && <Loader2 className="size-4 animate-spin" aria-hidden />} Verify and continue</Button>
        </div>
      )}
    </div>
  );
}
