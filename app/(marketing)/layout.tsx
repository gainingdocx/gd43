import Link from "next/link";

import { MobileMenu } from "@/components/marketing/mobile-menu";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Button } from "@/components/ui/button";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo/jsonld";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 shadow-[0_8px_30px_-24px_rgba(1,59,179,0.7)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="GainingDocx home" className="flex min-h-12 items-center">
          <BrandWordmark compact />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/features"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            Features
          </Link>
          <Link
            href="/tools"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            Tools
          </Link>
          <Link
            href="/templates"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            Templates
          </Link>
          <Link
            href="/guides"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            Guides
          </Link>
          <Link
            href="/pricing"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground xl:flex"
          >
            About
          </Link>
          <Button
            render={<Link href="/auth/login" />}
            size="default"
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/auth/sign-up" />}
            size="default"
            className="hidden bg-signal text-signal-foreground hover:bg-signal/90 sm:inline-flex"
          >
            Create account
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
          <BrandWordmark inverse />
          <p className="max-w-md text-base leading-7 text-white">
            AI parsing and deterministic validation for ocean shipping
            documents. Upload a Bill of Lading, review the extracted fields,
            export clean data — in minutes, not hours.
          </p>
        </div>
        <nav aria-label="Product" className="space-y-3 text-base text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-[#f4c400]">
            Product
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/features" className="inline-flex min-h-11 items-center hover:underline">
                Features
              </Link>
            </li>
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
        <nav aria-label="Company" className="space-y-3 text-base text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-[#f4c400]">
            Company
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="inline-flex min-h-11 items-center hover:underline">
                About us
              </Link>
            </li>
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
            <li>
              <Link href="/sitemap.xml" className="inline-flex min-h-11 items-center hover:underline">
                Sitemap
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-white sm:px-6">
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
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
