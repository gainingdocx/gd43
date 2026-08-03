import { freightModeLabel, type FreightMode } from "@/lib/freight/mode";
import { cn } from "@/lib/utils";

/**
 * Every mode used to render as the same hard `#d40505` chip, which spent the
 * loudest colour in the palette on a neutral taxonomy label and left nothing
 * louder for actual critical findings. Each mode now carries its own light
 * chip: light-on-dark reads cleanly against the deep blue card headers, and the
 * tint plus hairline ring keeps it visible on white. All three clear 7:1.
 */
const MODE_CHIP: Record<FreightMode, string> = {
  air: "bg-[#dbeafe] text-[#0c4a6e]",
  ocean: "bg-[#ccfbf1] text-[#134e4a]",
  multimodal: "bg-amber-soft text-amber-ink",
};

export function FreightModeTag({ mode, className }: { mode: FreightMode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[9px] font-bold tracking-[0.12em] ring-1 ring-inset ring-black/5",
        MODE_CHIP[mode],
        className
      )}
    >
      {freightModeLabel(mode)}
    </span>
  );
}
