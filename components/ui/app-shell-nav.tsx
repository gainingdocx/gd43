"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  House,
  Blocks,
  MailPlus,
  Plane,
  ScanLine,
  Search,
  Ship,
  User,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const workspaceItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/scan", label: "Upload document", icon: ScanLine },
  { href: "/app/email-in", label: "Email-in", icon: MailPlus },
  { href: "/app/air-freight", label: "Air freight", icon: Plane },
  { href: "/app/ocean-freight", label: "Ocean freight", icon: Ship },
  { href: "/app/workflows", label: "Flagship workflows", icon: Workflow },
  { href: "/app/shipments", label: "Shipments", icon: Ship },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/integrations", label: "API & webhooks", icon: Blocks },
  { href: "/app/account", label: "Account", icon: User },
];

export function DesktopAppNav({ showAdmin = false, inverse = false }: { showAdmin?: boolean; inverse?: boolean }) {
  const pathname = usePathname();
  const items = showAdmin
    ? [...workspaceItems, { href: "/app/admin", label: "Admin dashboard", icon: BarChart3 }]
    : workspaceItems;

  return (
    <nav aria-label="Workspace" className="space-y-1.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all",
              active
                ? inverse
                  ? "bg-[#ffe500] text-[#8b0909] shadow-[0_14px_30px_-18px_rgba(0,0,0,.65)]"
                  : "bg-primary text-white shadow-[0_12px_30px_-18px_rgba(1,59,179,0.9)]"
                : inverse
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
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
