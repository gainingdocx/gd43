import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Check your email" };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  const recovery = purpose === "recovery";
  return (
    <div className="rounded-3xl border border-border bg-white/85 p-7 text-center shadow-xl shadow-primary/5 sm:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success"><MailCheck className="size-8" aria-hidden /></span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-success">Email sent</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-primary">Check your inbox</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        {recovery
          ? "If an account matches that address, a secure password-recovery link is on its way."
          : "Open the verification link to activate your account and continue setup."}
      </p>
      <div className="mt-6 rounded-xl bg-accent/65 p-4 text-left text-xs leading-5 text-muted-foreground">
        The link may take a minute. Check spam or corporate email filtering if it does not appear. Only use the newest link you requested.
      </div>
      <Button render={<Link href="/auth/login" />} size="lg" variant="outline" className="mt-6 w-full">Return to sign in</Button>
    </div>
  );
}
