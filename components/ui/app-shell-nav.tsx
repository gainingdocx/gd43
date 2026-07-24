"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Blocks,
  ScanLine,
  Search,
  Ship,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const workspaceItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/app", label: "Overview", icon: House },
  { href: "/app/scan", label: "Upload document", icon: ScanLine },
  { href: "/app/shipments", label: "Shipments", icon: Ship },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/integrations", label: "API & webhooks", icon: Blocks },
  { href: "/app/account", label: "Account", icon: User },
];

export function DesktopAppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="space-y-1.5">
      {workspaceItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-white shadow-[0_12px_30px_-18px_rgba(1,59,179,0.9)]"
                : "text-muted-foreground hover:bg-secondary hover:text-primary"
            )}
          >
            <Icon className="size-[1.125rem] shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
