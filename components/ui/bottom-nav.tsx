"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ScanLine, Ship, User, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/scan", label: "Scan", icon: ScanLine },
  { href: "/app/workflows", label: "Workflows", icon: Workflow },
  { href: "/app/shipments", label: "Shipments", icon: Ship },
  { href: "/app/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[#ffe500] bg-primary pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-24px_rgba(1,59,179,0.85)] lg:hidden"
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
                  ? "bg-[#ffe500] text-[#8b0909]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
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
