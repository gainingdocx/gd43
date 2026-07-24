"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, ShieldPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string };
type Enrollment = { id: string; qrCode: string; secret: string };

export function MfaManager({ aal2 }: { aal2: boolean }) {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []).filter((factor) => factor.status === "verified"));
    setBusy(false);
  }
  useEffect(() => { void refresh(); }, []);

  async function enroll() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "GainingDocx authenticator" });
    if (enrollError || !data?.totp) {
      setError("Authenticator setup could not start. Try again.");
      setBusy(false);
      return;
    }
    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  }

  async function verifyEnrollment() {
    if (!enrollment || !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code shown in your authenticator app.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
    if (verifyError) {
      setError("That code was not accepted. Wait for the next code and try again.");
      setBusy(false);
      return;
    }
    setEnrollment(null);
    setCode("");
    await refresh();
    location.reload();
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (removeError) setError("Verify your current two-step code before removing this factor.");
    await refresh();
  }

  if (busy && !enrollment) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading security settings…</div>;

  return (
    <div className="space-y-4">
      {factors.length > 0 ? (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div><p className="text-sm font-semibold text-success">Authenticator protection is on</p><p className="mt-1 text-xs leading-5 text-muted-foreground">You’ll enter a six-digit code after password or Google sign-in.</p></div>
          </div>
          {factors.map((factor) => <div key={factor.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"><div><p className="text-sm font-semibold">{factor.friendly_name ?? "Authenticator app"}</p><p className="text-xs text-muted-foreground">Verified TOTP factor</p></div>{aal2 ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void remove(factor.id)}><Trash2 className="size-4 text-destructive" aria-hidden /> Remove</Button> : <Button render={<Link href="/auth/mfa?next=/app/account" />} variant="outline" size="sm">Verify to manage</Button>}</div>)}
        </>
      ) : enrollment ? (
        <div className="rounded-xl border border-primary/25 bg-secondary/45 p-4">
          <p className="text-sm font-bold text-primary">Scan this QR code</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Use Google Authenticator, Microsoft Authenticator, 1Password, Authy or another TOTP app.</p>
          {/* Supabase returns an inline data URI; it never leaves the browser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qrCode} alt="Authenticator enrollment QR code" className="mt-4 size-44 rounded-xl bg-white p-2" />
          <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold text-primary">Can’t scan the code?</summary><code className="mt-2 block break-all rounded-lg bg-white p-2">{enrollment.secret}</code></details>
          <label className="mt-4 block text-sm font-semibold">Six-digit code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-center font-mono text-lg tracking-[0.3em]" /></label>
          <div className="mt-3 flex gap-2"><Button type="button" disabled={busy} onClick={() => void verifyEnrollment()}>Verify and enable</Button><Button type="button" variant="outline" onClick={() => setEnrollment(null)}>Cancel</Button></div>
        </div>
      ) : (
        <Button type="button" variant="outline" disabled={busy} onClick={() => void enroll()}><ShieldPlus className="size-4" aria-hidden /> Add authenticator app</Button>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
