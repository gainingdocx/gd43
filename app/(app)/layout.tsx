import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { DesktopAppNav } from "@/components/ui/app-shell-nav";
import { BottomNav } from "@/components/ui/bottom-nav";

// The app surface is private: never indexed (spec §1.4).
export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_72%_0%,rgba(1,59,179,0.09),transparent_32rem)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/80 bg-white/95 px-5 py-6 lg:flex">
        <Link href="/app" aria-label="GainingDocx workspace home" className="flex min-h-12 items-center px-2">
          <BrandWordmark compact />
        </Link>
        <div className="mt-9">
          <p className="mb-3 px-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <DesktopAppNav />
        </div>
        <div className="mt-auto rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-bold text-primary">New document</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload PDFs or page images from this computer.</p>
          <Link href="/app/scan" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-signal px-3 text-sm font-bold text-white transition hover:bg-signal/90">
            <FileText className="size-4" aria-hidden /> Upload document
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 shadow-[0_8px_30px_-24px_rgba(1,59,179,0.7)] backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/app" aria-label="GainingDocx workspace home" className="flex min-h-11 items-center">
            <BrandWordmark compact />
          </Link>
          <Link
            href="/app/scan"
            aria-label="Scan a document"
            className="flex size-11 items-center justify-center rounded-xl bg-signal text-white shadow-sm transition hover:bg-signal/90"
          >
            <FileText className="size-5" aria-hidden />
          </Link>
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
