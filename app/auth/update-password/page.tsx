import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient } from "@/lib/supabase/server";
import { updateRecoveredPassword } from "../actions";

export const metadata = { title: "Choose new password" };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/forgot-password?error=expired");
  return (
    <div>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><KeyRound className="size-6" aria-hidden /></span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-primary">Choose a new password</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Use a unique passphrase you do not use for email, banking or other logistics systems.</p>
      <div className="mt-6 space-y-4">
        <AuthNotice error={params.error} />
        <form action={updateRecoveredPassword} className="space-y-4 rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
          <PasswordField id="new-password" name="password" label="New password" autoComplete="new-password" hint="15–128 characters. Spaces and pasted password-manager values are allowed." />
          <PasswordField id="new-password-confirmation" name="password_confirmation" label="Confirm new password" autoComplete="new-password" />
          <Button type="submit" size="lg" className="h-12 w-full">Update password</Button>
        </form>
      </div>
    </div>
  );
}
