import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}

/**
 * Shared brand lockup so every surface uses the same name and promise.
 *
 * "Gaining" is red on every surface, and that red is the site's `signal` red
 * rather than a value invented for the logo. Light grounds use the token
 * directly (`#d40505`, 5.5:1 on white), so the wordmark tracks the theme.
 *
 * Dark grounds hardcode `#ff5a5a` — the dark-theme value of the same token —
 * because `inverse` is about the *ground*, not the theme: these lockups sit on
 * deep blue even while the page is in light mode, where `--signal` would still
 * resolve to `#d40505` and score 1.7:1. The hardcoded value gives 5.5:1 on the
 * marketing header's `#001a4d` and 3.0:1 on `#013bb3` in the app and auth
 * shells, clearing the 3:1 floor the 20px bold lockup qualifies for.
 *
 * "Docx" follows the same rule: amber on dark (10.7:1), and a deeper bronze on
 * light, because the original gold `#f4c400` scored 1.7:1 on white and needed a
 * text-shadow just to be visible.
 */
export function BrandWordmark({ compact = false, inverse = false, className }: BrandWordmarkProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={compact ? 42 : 46}
        height={compact ? 42 : 46}
        unoptimized
        className={cn(
          "shrink-0 rounded-full",
          compact ? "size-10" : "size-11",
          inverse ? "ring-1 ring-white/25" : "drop-shadow-sm"
        )}
      />
      <span className="min-w-0 leading-none">
        <span className="block whitespace-nowrap text-xl font-extrabold tracking-[-0.04em]">
          <span className={inverse ? "text-[#ff5a5a]" : "text-signal"}>Gaining</span>
          <span className={inverse ? "text-amber" : "text-[#9a6b00]"}>Docx</span>
        </span>
        <span
          className={cn(
            "mt-1 block whitespace-nowrap text-[0.6rem] font-semibold uppercase leading-none tracking-[0.1em]",
            inverse ? "text-white/70" : "text-muted-foreground"
          )}
        >
          Freight Document Manager
        </span>
      </span>
    </span>
  );
}
