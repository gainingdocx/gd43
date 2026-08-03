"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Menu } from "lucide-react";

const LINKS = [
  ["Air freight", "/air-freight"],
  ["Ocean freight", "/ocean-freight"],
  ["Email-in", "/app/email-in"],
  ["Features", "/features"],
  ["Free tools", "/tools"],
  ["Templates", "/templates"],
  ["Guides", "/guides"],
  ["Sample report", "/sample-discrepancy-report"],
  ["Trust center", "/trust"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
] as const;

export function MobileMenu() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = () => detailsRef.current?.removeAttribute("open");

  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <details ref={detailsRef} className="relative">
      <summary className="flex size-12 cursor-pointer list-none items-center justify-center rounded-full border-2 border-white/70 bg-[#ffe500] text-[#d40505] shadow-sm [&::-webkit-details-marker]:hidden">
        <Menu className="size-6" aria-hidden />
        <span className="sr-only">Open navigation</span>
      </summary>
      <div className="absolute right-0 top-14 z-50 grid w-56 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-2xl">
        <Link
          href="/auth/sign-up"
          onClick={close}
          className="mb-1 flex min-h-12 items-center rounded-xl bg-signal px-4 text-base font-bold text-white hover:bg-signal/90 sm:hidden"
        >
          Create free account
        </Link>
        <Link href="/auth/login" onClick={close} className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary">Sign in</Link>
        <Link href="/" onClick={close} className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-primary hover:bg-secondary">Home</Link>
        {LINKS.map(([label, href]) => (
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
      </details>
    </div>
  );
}
