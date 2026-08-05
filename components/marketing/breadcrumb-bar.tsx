// Back button and breadcrumb on one row.
//
// Back used to sit in a full-width band of its own above the page, which spent
// roughly 60px of vertical space on a single 44px control, and then briefly in
// the header, which crowded the nav. Here it shares the row the page was
// already going to render, so it costs nothing and reads the way it does on
// iOS: back at the top left, on the same line as where you are.
//
// The button hides itself on root paths, and `empty:hidden` on the row means a
// page with no breadcrumb children collapses rather than leaving a gap.

import type { ReactNode } from "react";

import { BackButton } from "@/components/ui/back-button";
import { cn } from "@/lib/utils";

export function BreadcrumbBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BackButton className="size-9 shrink-0" />
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        {children}
      </nav>
    </div>
  );
}
