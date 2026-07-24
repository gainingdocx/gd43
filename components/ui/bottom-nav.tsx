"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ScanLine, Search, Ship, User } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/scan", label: "Scan", icon: ScanLine },
  { href: "/app/shipments", label: "Shipments", icon: Ship },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-24px_rgba(1,59,179,0.55)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[0.7rem] font-semibold transition-colors",
                active
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
