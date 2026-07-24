import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Check, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient } from "@/lib/supabase/server";
import { signUpWithPassword } from "../actions";

export const metadata = { title: "Create account" };

const PERKS = ["No card required", "20 docs / month", "Cancel anytime"];

export default async function SignUpPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
    redirect(profile?.onboarding_completed_at ? "/app" : "/app/onboarding");
  }

  return (
    <div>
      <div className="rounded-3xl border border-border bg-white/95 p-6 shadow-[0_18px_50px_-20px_rgba(1,59,179,0.28)] backdrop-blur sm:p-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-signal">Free workspace</p>
          <h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.035em] text-primary">Create your account</h1>
        </div>

        <div className="mt-5 space-y-3.5">
          <AuthNotice error={params.error} />

          <GoogleButton next="/app/onboarding" label="Sign up with Google" />

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form action={signUpWithPassword} className="space-y-3.5">
            {/* Consent is captured by the submit action itself, disclosed in the
                notice directly below the button — no separate checkbox row. */}
            <input type="hidden" name="accepted_terms" value="on" />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <AuthField id="first-name" name="first_name" label="First name" icon={UserRound} autoComplete="given-name" placeholder="Priya" />
              <AuthField id="last-name" name="last_name" label="Last name" icon={UserRound} autoComplete="family-name" placeholder="Sharma" />
              <AuthField id="signup-email" name="email" label="Work email" icon={Mail} type="email" autoComplete="email" placeholder="you@company.com" />
              <AuthField id="company" name="company" label="Company" icon={Building2} autoComplete="organization" placeholder="Optional" required={false} optional />
              <PasswordField id="signup-password" name="password" label="Create password" autoComplete="new-password" minLength={15} placeholder="Min. 15 characters" />
              <PasswordField id="signup-password-confirmation" name="password_confirmation" label="Confirm password" autoComplete="new-password" minLength={15} placeholder="Re-enter" />
            </div>

            <label className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <input name="marketing_consent" type="checkbox" className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary" />
              <span>Email me occasional product tips and feature news. Unsubscribe anytime.</span>
            </label>

            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Create free account <ArrowRight className="size-4" aria-hidden />
            </Button>

            <p className="text-center text-xs leading-5 text-muted-foreground">
              By continuing you agree to the <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link> and acknowledge the{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <div className="grid grid-cols-3 gap-2">
            {PERKS.map((perk) => (
              <span key={perk} className="flex items-center justify-center gap-1 rounded-lg bg-accent/60 px-2 py-1.5 text-center text-[11px] font-semibold text-accent-foreground">
                <Check className="size-3 shrink-0 text-success" aria-hidden />
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/auth/login" className="font-bold text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
