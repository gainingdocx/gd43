"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Menu } from "lucide-react";

// Mirrors the desktop grouping so the two navigations teach the same structure.
// A flat list of twelve gave no sense of which links were destinations and which
// were categories, and buried document parsers in the middle of it.
const GROUPS: { heading: string; links: readonly (readonly [string, string])[] }[] = [
  {
    heading: "Solutions",
    links: [
      ["Document parsers", "/document-parsers"],
      ["Ocean freight", "/ocean-freight"],
      ["Air freight", "/air-freight"],
    ],
  },
  {
    heading: "Resources",
    links: [
      ["Free tools", "/tools"],
      ["Guides", "/guides"],
      ["API reference", "/developers"],
    ],
  },
  {
    heading: "Company",
    links: [
      ["Sample report", "/sample-discrepancy-report"],
      ["Trust center", "/trust"],
      ["Contact", "/contact"],
    ],
  },
] as const;

/** Top-level destinations, shown above the grouped sections. */
const PRIMARY = [
  ["Features", "/features"],
  ["Templates", "/templates"],
  ["Pricing", "/pricing"],
] as const;

export function MobileMenu() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = () => detailsRef.current?.removeAttribute("open");

  useEffect(() => {
    close();
  }, [pathname]);

  return (
    // Extra left margin on top of the nav gap: the trigger is a filled amber
    // circle sitting next to the search pill, and two adjacent circles need
    // more separation than a row of text links does to stop reading as one
    // control.
    <div className="ml-1 flex items-center gap-2 lg:hidden">
      <details ref={detailsRef} className="relative">
      <summary className="flex size-12 cursor-pointer list-none items-center justify-center rounded-full border-2 border-white/70 bg-amber text-brand-deep shadow-sm [&::-webkit-details-marker]:hidden">
        <Menu className="size-6" aria-hidden />
        <span className="sr-only">Open navigation</span>
      </summary>
      <div className="absolute right-0 top-14 z-50 grid max-h-[78vh] w-64 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white p-2 shadow-2xl">
        <Link
          href="/auth/sign-up"
          onClick={close}
          className="mb-1 flex min-h-12 items-center rounded-xl bg-signal px-4 text-base font-bold text-white hover:bg-signal/90 sm:hidden"
        >
          Create free account
        </Link>
        <Link href="/auth/login" onClick={close} className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary">Sign in</Link>
        <Link href="/" onClick={close} className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary">Home</Link>
        {PRIMARY.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            onClick={close}
            className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary"
          >
            {label}
          </Link>
        ))}
        {GROUPS.map((group) => (
          <div key={group.heading} className="mt-1 border-t border-border pt-1">
            <p className="px-4 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {group.heading}
            </p>
            {group.links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary"
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      </details>
    </div>
  );
}
