import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthField } from "@/components/auth/auth-field";
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
      <div className="rounded-3xl border border-border bg-white/95 p-6 shadow-[0_18px_50px_-20px_rgba(1,59,179,0.28)] backdrop-blur sm:p-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-signal">Welcome back</p>
          <h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.035em] text-primary">Sign in to your workspace</h1>
        </div>

        <div className="mt-6 space-y-4">
          <AuthNotice error={params.error} message={params.message} />

          <GoogleButton next={next} label="Continue with Google" />

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form action={signInWithPassword} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <AuthField
              id="login-email"
              name="email"
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
            />
            <PasswordField
              id="login-password"
              name="password"
              label="Password"
              autoComplete="current-password"
              trailing={
                <Link href="/auth/forgot-password" className="text-xs font-bold text-signal hover:underline">
                  Forgot password?
                </Link>
              }
            />
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Sign in <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            By continuing you agree to the <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link> and acknowledge the{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
          </p>

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> no account needed <span className="h-px flex-1 bg-border" />
          </div>

          <Button render={<Link href="/app/scan" />} size="lg" variant="outline" className="h-12 w-full bg-white text-base">
            Continue as guest
          </Button>
          <p className="-mt-1 text-center text-xs text-muted-foreground">Parse documents today, create the account later.</p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link href="/auth/sign-up" className="font-bold text-primary hover:underline">Create a free account</Link>
      </p>
    </div>
  );
}
