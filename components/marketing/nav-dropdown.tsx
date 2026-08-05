"use client";

// Grouped navigation menu for the marketing header.
//
// The site has five content hubs; showing all of them plus the mode pages as
// flat links produced a nine-item bar, where every comparable product ships
// five or six. Grouping is what lets `/document-parsers` — the highest
// commercial-intent hub — sit in the bar at all.
//
// Opens on hover for pointer users because a marketing nav that requires a
// click to browse is friction, but hover alone is unusable by keyboard and
// touch, so click and Enter/Space open it too and Escape always closes.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  blurb: string;
}

export function NavDropdown({
  label,
  items,
  className,
}: {
  label: string;
  items: NavItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const menuId = useId();

  // Navigating away must not leave a menu hanging open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // A small grace period on leave stops the menu snapping shut while the
  // pointer crosses the gap between the trigger and the panel.
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const active = items.some((item) => pathname.startsWith(item.href));

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-white transition-colors hover:bg-white/15",
          (open || active) && "bg-white/15"
        )}
      >
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute left-0 top-full z-50 w-80 pt-2"
        >
          <ul className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl shadow-brand-deep/20">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <span className="block text-sm font-bold text-brand-deep">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
