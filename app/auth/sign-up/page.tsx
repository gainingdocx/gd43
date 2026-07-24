import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient } from "@/lib/supabase/server";
import { signUpWithPassword } from "../actions";

export const metadata = { title: "Create account" };

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
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Free workspace</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-primary sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Start with the essentials. We’ll personalize document workflows after your email is verified.</p>
      <div className="mt-6 space-y-4">
        <AuthNotice error={params.error} />
        <GoogleButton next="/app/onboarding" label="Sign up with Google" />
        <p className="-mt-1 text-center text-xs leading-5 text-muted-foreground">
          By continuing with Google, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or create a password <span className="h-px flex-1 bg-border" />
        </div>
        <form action={signUpWithPassword} className="space-y-4 rounded-2xl border border-border bg-white/80 p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="first-name" className="block text-sm font-semibold">First name<input id="first-name" name="first_name" required autoComplete="given-name" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" /></label>
            <label htmlFor="last-name" className="block text-sm font-semibold">Last name<input id="last-name" name="last_name" required autoComplete="family-name" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" /></label>
          </div>
          <label htmlFor="signup-email" className="block text-sm font-semibold">Work email<input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" /></label>
          <label htmlFor="company" className="block text-sm font-semibold">Company <span className="font-normal text-muted-foreground">(optional)</span><input id="company" name="company" autoComplete="organization" placeholder="Your company or practice" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" /></label>
          <PasswordField id="signup-password" name="password" label="Create password" autoComplete="new-password" hint="Use a memorable passphrase of at least 15 characters. Spaces and password managers are supported." />
          <PasswordField id="signup-password-confirmation" name="password_confirmation" label="Confirm password" autoComplete="new-password" />
          <label className="flex items-start gap-3 text-sm leading-5"><input name="accepted_terms" type="checkbox" required className="mt-1 size-4 rounded border-input" /><span>I agree to the <Link href="/terms" className="font-semibold text-primary underline">Terms</Link> and acknowledge the <Link href="/privacy" className="font-semibold text-primary underline">Privacy Policy</Link>.</span></label>
          <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground"><input name="marketing_consent" type="checkbox" className="mt-1 size-4 rounded border-input" /><span>Send me occasional product education and feature announcements. Optional; unsubscribe anytime.</span></label>
          <Button type="submit" size="lg" className="h-12 w-full text-base">Create free account <ArrowRight className="size-4" aria-hidden /></Button>
        </form>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-muted-foreground">
          {["No card", "20 docs/month", "Cancel anytime"].map((item) => <span key={item} className="flex items-center justify-center gap-1 rounded-lg bg-accent/60 px-2 py-2"><Check className="size-3 text-success" aria-hidden />{item}</span>)}
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/auth/login" className="font-bold text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}
