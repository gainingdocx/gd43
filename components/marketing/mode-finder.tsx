"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  FileSearch,
  FileSpreadsheet,
  Plane,
  Route,
  Ship,
  SlidersHorizontal,
  Layers,
  type LucideIcon,
} from "lucide-react";

import { type FreightMode } from "@/lib/freight/mode";
import { cn } from "@/lib/utils";

export interface FinderItem {
  name: string;
  href: string;
  meta?: string;
}

export interface FinderGroup {
  key: "workflows" | "parsers" | "controls" | "tools" | "templates";
  title: string;
  items: FinderItem[];
}

export interface FinderMode {
  mode: FreightMode;
  title: string;
  question: string;
  blurb: string;
  href: string;
  cta: string;
  groups: FinderGroup[];
  /**
   * Items that apply to either freight mode. An ocean shipment still needs a
   * commercial invoice and a packing list, so these are repeated inside the Air
   * and Ocean panels rather than being reachable only from the Shared tab.
   */
  sharedGroups?: FinderGroup[];
}

const MODE_ICON: Record<FreightMode, LucideIcon> = {
  air: Plane,
  ocean: Ship,
  multimodal: Layers,
};

const GROUP_ICON: Record<FinderGroup["key"], LucideIcon> = {
  workflows: Route,
  parsers: FileSearch,
  controls: SlidersHorizontal,
  tools: Calculator,
  templates: FileSpreadsheet,
};

/**
 * Replaces five consecutive, near-identical "3 columns split by Air / Ocean /
 * Shared" grids with one tabbed finder.
 *
 * Every panel stays mounted — only visibility toggles — so all internal links
 * remain in the served HTML and the existing internal-link graph is unchanged.
 */
export function ModeFinder({
  modes,
  defaultMode = "ocean",
}: {
  modes: FinderMode[];
  defaultMode?: FreightMode;
}) {
  const initial = Math.max(
    0,
    modes.findIndex((entry) => entry.mode === defaultMode)
  );
  const [active, setActive] = useState(initial);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent) {
    const last = modes.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose a freight mode"
        onKeyDown={onKeyDown}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-card sm:flex-row"
      >
        {modes.map((entry, index) => {
          const Icon = MODE_ICON[entry.mode];
          const selected = index === active;
          return (
            <button
              key={entry.mode}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`finder-tab-${entry.mode}`}
              aria-selected={selected}
              aria-controls={`finder-panel-${entry.mode}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "bg-brand text-white shadow-card"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5 shrink-0", selected ? "text-amber" : "text-brand")} aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{entry.title}</span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    selected ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {entry.question}
                </span>
              </span>
              {/* Counts keep the information scent of the two closed panels
                  visible, which is the main cost of hiding content behind
                  tabs (NN/g). */}
              <span className="counter ml-auto">
                {entry.groups.reduce((total, group) => total + group.items.length, 0)}
              </span>
            </button>
          );
        })}
      </div>

      {modes.map((entry, index) => (
        <div
          key={entry.mode}
          role="tabpanel"
          id={`finder-panel-${entry.mode}`}
          aria-labelledby={`finder-tab-${entry.mode}`}
          hidden={index !== active}
          className="mt-5"
        >
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{entry.blurb}</p>
              <Link
                href={entry.href}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                {entry.cta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-7 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-3">
              <GroupColumns groups={entry.groups} />
            </div>

            {entry.sharedGroups?.some((group) => group.items.length > 0) ? (
              <div className="mt-7 rounded-xl border border-amber/45 bg-secondary/50 p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-amber text-brand-deep">
                    <Layers className="size-4" aria-hidden />
                  </span>
                  <h3 className="text-sm font-bold text-brand-deep">
                    Also applies to {entry.title.toLowerCase()}
                  </h3>
                  <span className="counter h-5 min-w-5 text-[0.68rem]">
                    {entry.sharedGroups.reduce((total, group) => total + group.items.length, 0)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-secondary-foreground">
                  Commercial paperwork and platform controls used with either freight mode — an
                  {entry.mode === "air" ? " air" : " ocean"} shipment still needs these.
                </p>
                <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  <GroupColumns groups={entry.sharedGroups} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Shared renderer so mode groups and the "applies to both" block stay identical. */
function GroupColumns({ groups }: { groups: FinderGroup[] }) {
  return (
    <>
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => {
          const GroupIcon = GROUP_ICON[group.key];
          return (
            <section key={group.key}>
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <GroupIcon className="size-4 shrink-0 text-brand" aria-hidden />
                <span className="flex-1">{group.title}</span>
                <span className="counter h-5 min-w-5 text-[0.68rem]">{group.items.length}</span>
              </h3>
              <ul className="mt-3 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group -mx-2 flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-snug">{item.name}</span>
                        {item.meta ? (
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {item.meta}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-brand"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </>
  );
}
