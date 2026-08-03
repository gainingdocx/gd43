import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, KeyRound, LockKeyhole, UserRound } from "lucide-react";

import { loginAdmin } from "./actions";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { hasAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid: "The administrator username or password is incorrect.",
  limited: "Too many attempts. Please wait 15 minutes before trying again.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasAdminSession()) redirect("/app/admin");
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(1,59,179,0.16),transparent_28rem),linear-gradient(145deg,#f7faff_0%,#edf3ff_100%)] px-4 py-12">
      <div className="absolute -right-24 -top-24 size-72 rounded-full border-[3rem] border-primary/5" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandWordmark compact />
        </div>
        <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_28px_90px_-35px_rgba(7,27,78,0.45)]">
          <header className="border-b border-border bg-[linear-gradient(135deg,#013bb3,#01267c)] px-6 py-7 text-white">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12">
              <BarChart3 className="size-6" aria-hidden />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f4c400]">
              Restricted administration
            </p>
            <h1 className="mt-1 text-2xl font-black">Dashboard sign in</h1>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Access website analytics and the customer feedback inbox.
            </p>
          </header>

          <form action={loginAdmin} className="space-y-5 px-6 py-7">
            <label className="block">
              <span className="text-sm font-bold text-foreground">Administrator username</span>
              <span className="relative mt-2 block">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  name="username"
                  required
                  autoComplete="username"
                  defaultValue="suhasgovind"
                  className="min-h-12 w-full rounded-xl border border-input bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-foreground">Password</span>
              <span className="relative mt-2 block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="min-h-12 w-full rounded-xl border border-input bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                />
              </span>
            </label>

            {error && ERRORS[error] && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-semibold text-destructive">
                {ERRORS[error]}
              </p>
            )}

            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-signal px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#b90404] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <KeyRound className="size-4" aria-hidden /> Open admin dashboard
            </button>
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Sessions expire automatically after 12 hours. Five failed attempts temporarily lock this login.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
