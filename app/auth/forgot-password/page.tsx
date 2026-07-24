import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthNotice } from "@/components/auth/auth-notice";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Mail className="size-6" aria-hidden /></span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-primary">Reset your password</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter your account email. For privacy, we show the same confirmation whether or not an account exists.</p>
      <div className="mt-6 space-y-4">
        <AuthNotice error={params.error} />
        <form action={requestPasswordReset} className="space-y-4 rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
          <label htmlFor="recovery-email" className="block text-sm font-semibold">Email address<input id="recovery-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" /></label>
          <Button type="submit" size="lg" className="h-12 w-full">Send recovery link</Button>
        </form>
      </div>
      <Link href="/auth/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="size-4" aria-hidden /> Back to sign in</Link>
    </div>
  );
}
