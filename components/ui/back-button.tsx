"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Paths that exist only as parents of a dynamic route — they have no page.tsx,
 * so navigating to them 404s. Back navigation has to walk straight past them.
 *
 * This is what sent "back" from /auth/sign-up to a 404: the old rule returned
 * the parent segment unconditionally, and /auth is not a page. Auth routes are
 * the common case because middleware sets `Referrer-Policy: no-referrer` on
 * /auth/*, so `document.referrer` is always empty there and a direct landing
 * always falls through to this fallback rather than router.back().
 */
const NOT_A_PAGE = new Set(["/auth", "/app/review", "/app/generate"]);

function fallbackFor(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const inApp = segments[0] === "app";

  let candidate = segments.slice(0, -1);
  while (candidate.length > 0) {
    const path = `/${candidate.join("/")}`;
    if (!NOT_A_PAGE.has(path)) return path;
    candidate = candidate.slice(0, -1);
  }

  return inApp ? "/app" : "/";
}

export function BackButton({
  className,
  hideOnRoots = true,
}: {
  className?: string;
  hideOnRoots?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const firstPath = useRef(pathname);
  const navigatedInsideSite = useRef(false);

  useEffect(() => {
    if (pathname !== firstPath.current) navigatedInsideSite.current = true;
  }, [pathname]);

  if (hideOnRoots && (pathname === "/" || pathname === "/app")) return null;

  function goBack() {
    let sameOriginReferrer = false;
    try {
      sameOriginReferrer = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
      sameOriginReferrer = false;
    }

    if (window.history.length > 1 && (sameOriginReferrer || navigatedInsideSite.current)) {
      router.back();
      return;
    }

    router.push(fallbackFor(pathname));
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      title="Go back"
      className={cn(
        // Red disc, white arrow. The gradient plus the inset highlight give it
        // dimension so it reads as a raised control, not a flat red dot.
        "inline-flex size-11 items-center justify-center rounded-full border border-[#a80404] bg-[linear-gradient(180deg,#e81111,#b80404)] p-0 text-white shadow-[0_2px_4px_rgba(9,26,62,0.18),0_10px_22px_-10px_rgba(168,4,4,0.65),inset_0_1px_0_rgba(255,255,255,0.28)] transition duration-200 hover:-translate-x-0.5 hover:brightness-110 hover:shadow-[0_3px_6px_rgba(9,26,62,0.2),0_14px_28px_-10px_rgba(168,4,4,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95",
        className,
      )}
    >
      <ArrowLeft className="size-5" strokeWidth={2.75} aria-hidden />
    </button>
  );
}
