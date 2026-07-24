import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div>
      <div className="rounded-3xl border border-border bg-white/95 p-6 shadow-[0_18px_50px_-20px_rgba(1,59,179,0.28)] backdrop-blur sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Mail className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-[1.75rem] font-black tracking-[-0.035em] text-primary">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your account email. For privacy we show the same confirmation whether or not an account exists.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <AuthNotice error={params.error} />
          <form action={requestPasswordReset} className="space-y-4">
            <AuthField
              id="recovery-email"
              name="email"
              label="Email address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
            />
            <Button type="submit" size="lg" className="h-12 w-full text-base">Send recovery link</Button>
          </form>
        </div>
      </div>

      <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}
