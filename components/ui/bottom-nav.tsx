"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ScanLine, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/scan", label: "Scan", icon: ScanLine },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active
                  ? "text-signal"
                  : "text-muted-foreground hover:text-foreground"
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
