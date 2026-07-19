import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 shadow-[0_8px_30px_-24px_rgba(1,59,179,0.7)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
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
