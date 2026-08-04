import Link from "next/link";

import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { CommandPalette } from "@/components/search/command-palette";
import { BackButton } from "@/components/ui/back-button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { BackdropMark } from "@/components/ui/backdrop-mark";
import { Button } from "@/components/ui/button";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo/jsonld";

/** `wide` links appear one breakpoint later, matching the old xl-only Email-in. */
const NAV_LINKS: { href: string; label: string; wide?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/air-freight", label: "Air" },
  { href: "/ocean-freight", label: "Ocean" },
  { href: "/features", label: "Features" },
  { href: "/app/email-in", label: "Email-in", wide: true },
  { href: "/tools", label: "Tools" },
  { href: "/templates", label: "Templates" },
  { href: "/guides", label: "Guides" },
  { href: "/pricing", label: "Pricing" },
];

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-deep">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="GainingDocx home" className="flex min-h-12 items-center">
          <BrandWordmark compact inverse />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          <CommandPalette />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                // Was a saturated yellow fill with dark-red text, which flashed
                // an alarm-level chip on every hover.
                "hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white transition-colors hover:bg-white/15",
                link.wide ? "xl:flex" : "lg:flex"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            render={<Link href="/auth/login" />}
            size="default"
            variant="ghost"
            className="ml-1 hidden font-medium text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/auth/sign-up" />}
            size="default"
            className="hidden bg-amber font-semibold text-brand-deep hover:bg-amber/90 sm:inline-flex"
          >
            Create account
          </Button>
          <MobileMenu />
        </nav>
      </div>
      <div className="rule-amber h-px opacity-60" aria-hidden />
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative bg-brand-deep text-primary-foreground">
      <div className="rule-amber h-1" aria-hidden />
      <BackdropMark />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2">
          <BrandWordmark inverse />
          <p className="max-w-md text-base leading-7 text-white">
            Air and ocean freight document QA for forwarders and exporters.
            Connect shipment documents, review source-linked discrepancies and
            export corrected operational data.
          </p>
        </div>
        <nav aria-label="Product" className="space-y-3 text-base text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber">
            Product
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/air-freight" className="inline-flex min-h-11 items-center hover:underline">
                Air freight paperwork
              </Link>
            </li>
            <li>
              <Link href="/ocean-freight" className="inline-flex min-h-11 items-center hover:underline">
                Ocean freight paperwork
              </Link>
            </li>
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
              <Link href="/app/email-in" className="inline-flex min-h-11 items-center hover:underline">
                Email-in document intake
              </Link>
            </li>
            <li>
              <Link href="/document-parsers" className="inline-flex min-h-11 items-center hover:underline">
                Document parsers
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
            <li>
              <Link href="/sample-discrepancy-report" className="inline-flex min-h-11 items-center hover:underline">
                Sample discrepancy report
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Company" className="space-y-3 text-base text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber">
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
              <Link href="/trust" className="inline-flex min-h-11 items-center hover:underline">
                Trust Center
              </Link>
            </li>
            <li>
              <Link href="/security" className="inline-flex min-h-11 items-center hover:underline">
                Security Center
              </Link>
            </li>
            <li>
              <Link href="/accuracy-and-limitations" className="inline-flex min-h-11 items-center hover:underline">
                Accuracy & limitations
              </Link>
            </li>
            <li>
              <Link href="/standards" className="inline-flex min-h-11 items-center hover:underline">
                Standards alignment
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
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pt-4 empty:hidden sm:px-6">
          <BackButton />
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
