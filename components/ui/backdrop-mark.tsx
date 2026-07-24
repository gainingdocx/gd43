import { cn } from "@/lib/utils";

/**
 * Decorative backdrop layer the site owner asked to keep present behind key
 * surfaces. It is rendered into the DOM and positioned, but never seen:
 *
 *  - `opacity-0` so it paints nothing at any viewport or print size
 *  - `-z-10` so it sits behind its container's own content
 *  - `pointer-events-none` + `select-none` so it cannot be clicked or selected
 *  - `aria-hidden` so screen readers and other assistive tech skip it
 *  - a CSS background rather than an <img>, so crawlers do not treat it as
 *    page content; `/backdrop-seal.png` is also disallowed in robots.ts and
 *    kept out of the sitemap
 *
 * The parent must establish a positioning context (`relative`).
 */
export function BackdropMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 select-none bg-[url('/backdrop-seal.png')] bg-contain bg-center bg-no-repeat opacity-0",
        className
      )}
    />
  );
}
