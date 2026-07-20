import Image from "next/image";
import Link from "next/link";

import { MobileMenu } from "@/components/marketing/mobile-menu";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 shadow-[0_8px_30px_-24px_rgba(1,59,179,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 font-extrabold tracking-tight text-primary"
        >
          <Image
            src="/logo.png"
            alt="GainingDocx logo"
            width={48}
            height={48}
            unoptimized
            className="size-12 rounded-full drop-shadow-sm"
          />
          <span className="hidden text-xl sm:inline">GainingDocx</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/tools"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
          >
            Tools
          </Link>
          <Link
            href="/templates"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
          >
            Templates
          </Link>
          <Link
            href="/guides"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
          >
            Guides
          </Link>
          <Link
            href="/pricing"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            Pricing
          </Link>
          <Button
            render={<Link href="/app/scan" />}
            size="lg"
            className="bg-signal text-signal-foreground hover:bg-signal/90"
          >
            Parse a document
          </Button>
          <MobileMenu />
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2">
          <div className="flex items-center gap-3 font-semibold">
            <Image
              src="/logo.png"
              alt="GainingDocx logo"
              width={48}
              height={48}
              unoptimized
              className="size-12 rounded-full bg-white"
            />
            <span className="text-xl">GainingDocx</span>
          </div>
          <p className="max-w-sm text-sm text-primary-foreground/70">
            AI parsing and deterministic validation for ocean shipping
            documents. Upload a Bill of Lading, review the extracted fields,
            export clean data — in minutes, not hours.
          </p>
        </div>
        <nav aria-label="Product" className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-primary-foreground/50">
            Product
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/pricing" className="inline-flex min-h-11 items-center hover:underline">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/app/scan" className="inline-flex min-h-11 items-center hover:underline">
                Parse a document
              </Link>
            </li>
            <li>
              <Link href="/tools" className="inline-flex min-h-11 items-center hover:underline">
                Free tools
              </Link>
            </li>
            <li>
              <Link href="/templates" className="inline-flex min-h-11 items-center hover:underline">
                Document templates
              </Link>
            </li>
            <li>
              <Link href="/guides" className="inline-flex min-h-11 items-center hover:underline">
                Guides
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Company" className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-primary-foreground/50">
            Company
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/contact" className="inline-flex min-h-11 items-center hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-flex min-h-11 items-center hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="inline-flex min-h-11 items-center hover:underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-foreground/50 sm:px-6">
          © {new Date().getFullYear()} GainingDocx. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
