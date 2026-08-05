import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, House } from "lucide-react";

import { CommandPalette } from "@/components/search/command-palette";
import { BackButton } from "@/components/ui/back-button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { DesktopAppNav } from "@/components/ui/app-shell-nav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { isAdminEmail } from "@/lib/admin/access";
import { hasAdminSession } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// The app surface is private: never indexed (spec §1.4).
export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showAdmin = isAdminEmail(user?.email) || (await hasAdminSession());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_72%_0%,rgba(255,229,0,0.18),transparent_32rem)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r-4 border-[#ffe500] bg-primary px-5 py-6 lg:flex">
        {/* Shares the brand row instead of taking a row of its own above the
            page content. */}
        <div className="flex min-w-0 items-center gap-2 px-2">
          <BackButton className="size-10 shrink-0" />
          <Link href="/app" aria-label="GainingDocx workspace home" className="flex min-h-12 min-w-0 items-center">
            <BrandWordmark compact inverse />
          </Link>
        </div>
        <div className="mt-6 px-1">
          <CommandPalette includeDocuments triggerClassName="w-full justify-between pl-3.5 pr-2" />
        </div>
        <div className="mt-7">
          <p className="mb-3 px-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/55">Workspace</p>
          <DesktopAppNav showAdmin={showAdmin} inverse />
        </div>
        <div className="mt-auto rounded-2xl bg-[#ffe500] p-4 text-[#171717] shadow-xl shadow-black/10">
          <p className="text-sm font-black">Start a shipment check</p>
          <p className="mt-1 text-xs font-medium leading-5 text-black/65">Choose an air, ocean or multimodal workflow.</p>
          <Link href="/app/workflows" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-signal px-3 text-sm font-bold text-white transition hover:bg-signal/90">
            <FileText className="size-4" aria-hidden /> Choose workflow
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-40 border-b-4 border-[#ffe500] bg-primary shadow-[0_8px_30px_-24px_rgba(1,59,179,0.9)] lg:hidden">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <BackButton className="size-9 shrink-0" />
            <Link href="/app" aria-label="GainingDocx workspace home" className="flex min-h-11 min-w-0 items-center">
              <BrandWordmark compact inverse />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette includeDocuments triggerClassName="size-11 justify-center rounded-full px-0" />
            <Link
              href="/app"
              aria-label="Workspace home"
              title="Home"
              className="flex size-11 items-center justify-center rounded-full bg-[#ffe500] text-[#d40505] shadow-sm transition hover:bg-white"
            >
              <House className="size-5" aria-hidden />
            </Link>
            {showAdmin && (
              <Link
                href="/app/admin"
                aria-label="Open admin dashboard"
                className="flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm transition hover:bg-[#ffe500]"
              >
                <BarChart3 className="size-5" aria-hidden />
              </Link>
            )}
            <Link
              href="/app/scan"
              aria-label="Scan a document"
              className="flex size-11 items-center justify-center rounded-xl bg-signal text-white shadow-sm transition hover:bg-signal/90"
            >
              <FileText className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-9 lg:pb-10 xl:px-14">
        <div className="mx-auto w-full max-w-5xl [&:has([data-wide])]:max-w-6xl">
          {children}
        </div>
      </main>
      <BottomNav />
      </div>
    </div>
  );
}
