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
 * "Gaining" is red on every surface. The exact red shifts by ground because one
 * value cannot serve both: the original `#ef1b16` scored 2.1:1 on the deep blue
 * header — below even the 3:1 large-text floor. Dark grounds get `#ff6b6b`,
 * which clears 3:1 on the lightest ground it lands on (`#013bb3` in the app and
 * auth shells, 3.3:1) and reaches 6.0:1 on the marketing header's `#001a4d`.
 * Light grounds keep the deeper `#d40505` (5.5:1). Both read unmistakably red.
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
          <span className={inverse ? "text-[#ff6b6b]" : "text-[#d40505]"}>Gaining</span>
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
