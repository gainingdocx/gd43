import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient } from "@/lib/supabase/server";
import { signInWithPassword } from "../actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/app";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
    redirect(profile?.onboarding_completed_at ? next : "/app/onboarding");
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Welcome back</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-primary sm:text-4xl">Sign in to your workspace</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Continue reviewing shipment documents, alerts and team approvals.</p>
      <div className="mt-6 space-y-4">
        <AuthNotice error={params.error} message={params.message} />
        <GoogleButton next={next} label="Sign in with Google" />
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or use your email <span className="h-px flex-1 bg-border" />
        </div>
        <form action={signInWithPassword} className="space-y-4 rounded-2xl border border-border bg-white/80 p-5 shadow-sm sm:p-6">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="login-email" className="block text-sm font-semibold">
            Work email
            <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20" />
          </label>
          <PasswordField id="login-password" name="password" label="Password" autoComplete="current-password" />
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm font-semibold text-signal hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" size="lg" className="h-12 w-full text-base">Sign in <ArrowRight className="size-4" aria-hidden /></Button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to GainingDocx? <Link href="/auth/sign-up" className="font-bold text-primary hover:underline">Create a free account</Link>
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden /> Secure, encrypted session with automatic renewal.</p>
    </div>
  );
}
