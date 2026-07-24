import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}

/** Shared brand lockup so every surface uses the same name and promise. */
export function BrandWordmark({ compact = false, inverse = false, className }: BrandWordmarkProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={compact ? 42 : 46}
        height={compact ? 42 : 46}
        unoptimized
        className={cn("shrink-0 rounded-full drop-shadow-sm", compact ? "size-10" : "size-11")}
      />
      <span className="min-w-0 text-center leading-none">
        <span className="block whitespace-nowrap text-xl font-black tracking-[-0.045em]">
          <span className="text-[#ef1b16]">Gaining</span>
          <span className="text-[#f4c400] [text-shadow:0_1px_0_rgba(120,84,0,0.38)]">Docx</span>
        </span>
        <span className={cn(
          "-mt-0.5 block whitespace-nowrap text-[0.6rem] font-bold leading-none tracking-[0.08em]",
          inverse ? "text-white" : "text-muted-foreground"
        )}>
          Easy PaperWork
        </span>
      </span>
    </span>
  );
}
