import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "lucide-react";

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
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Container className="size-4" aria-hidden />
            </span>
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
