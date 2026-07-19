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
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <Link
            href="/app"
            className="flex min-h-11 items-center gap-2 font-semibold tracking-tight"
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
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
