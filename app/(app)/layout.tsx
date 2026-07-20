import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileText, House, ScanLine, Search, Ship, User } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(1,59,179,0.08),transparent_30rem)]">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 shadow-[0_8px_30px_-24px_rgba(1,59,179,0.7)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/app"
            className="flex min-h-11 items-center gap-2.5 font-extrabold tracking-tight text-primary"
          >
            <Image
              src="/logo.png"
              alt="GainingDocx logo"
              width={36}
              height={36}
              unoptimized
              className="size-9 rounded-full drop-shadow-sm"
            />
            GainingDocx
          </Link>
          <nav aria-label="Workspace" className="hidden items-center gap-1 md:flex">
            {[
              { href: "/app", label: "Home", icon: House },
              { href: "/app/scan", label: "Scan", icon: ScanLine },
              { href: "/app/shipments", label: "Shipments", icon: Ship },
              { href: "/app/search", label: "Search", icon: Search },
              { href: "/app/account", label: "Account", icon: User },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/app/scan"
            aria-label="Scan a document"
            className="flex size-11 items-center justify-center rounded-xl bg-signal text-white shadow-sm transition hover:bg-signal/90 md:hidden"
          >
            <FileText className="size-5" aria-hidden />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 pb-24 sm:px-6">
        <div className="mx-auto w-full max-w-lg [&:has([data-wide])]:max-w-4xl">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
