"use client";

// Site-wide search palette (Cmd/Ctrl-K).
//
// One surface serves both shells. On marketing it searches published content;
// inside the app it additionally queries the authenticated `search_documents`
// RPC and merges the user's own documents in as their own group, so a person
// hunting a B/L number and a person hunting the demurrage guide use the same
// box. The Supabase client is imported dynamically so the marketing bundle
// never pays for auth code it cannot use.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CornerDownLeft,
  FileSearch,
  FileText,
  Layers,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SearchHit, Segment } from "@/lib/search/engine";
import type { SearchKind } from "@/lib/search/corpus";

interface DocumentHit {
  id: string;
  docType: string;
  reference: string;
  createdAt: string;
}

// Destinations first, prose last. Someone typing into the palette is usually
// trying to *get somewhere*; the direct-answer card above the list already
// serves the case where they wanted prose, so answers do not also need to lead
// the list.
const KIND_META: Record<SearchKind, { label: string; icon: typeof Search; order: number }> = {
  tool: { label: "Tools & calculators", icon: Calculator, order: 1 },
  parser: { label: "Document parsers", icon: FileSearch, order: 2 },
  template: { label: "Templates", icon: FileText, order: 3 },
  feature: { label: "Features", icon: Sparkles, order: 4 },
  hub: { label: "Sections", icon: Layers, order: 5 },
  guide: { label: "Guides", icon: BookOpen, order: 6 },
  page: { label: "Pages", icon: Layers, order: 7 },
  answer: { label: "Answers", icon: Lightbulb, order: 8 },
};

const SUGGESTIONS = [
  "How do I calculate chargeable weight?",
  "Bill of lading parser",
  "Demurrage and detention",
  "Incoterms 2020",
  "Container number check",
  "Pricing",
];

const RECENT_KEY = "gdx.search.recent";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, 6);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // A private-mode storage failure must never break search.
  }
}

/** Render engine-provided highlight runs without dangerouslySetInnerHTML. */
function Snippet({ segments }: { segments: Segment[] }) {
  if (!segments.length) return null;
  return (
    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
      {segments.map((segment, i) =>
        segment.hit ? (
          <mark key={i} className="rounded bg-amber-soft px-0.5 text-amber-ink">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </p>
  );
}

export function CommandPalette({
  includeDocuments = false,
  triggerClassName,
}: {
  includeDocuments?: boolean;
  /** Overrides trigger width/shape where the shell is tighter than the header. */
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [answer, setAnswer] = useState<SearchHit | null>(null);
  const [documents, setDocuments] = useState<DocumentHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Global shortcut. "/" is included because it is the muscle memory for search
  // on content sites, but only when the user is not already typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Debounced query. `requestId` guards against a slow early response landing
  // after a fast later one and overwriting good results with stale ones.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setAnswer(null);
      setDocuments([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=24`);
        const data = (await response.json()) as { hits?: SearchHit[]; answer?: SearchHit | null };
        if (id !== requestId.current) return;
        setHits(data.hits ?? []);
        setAnswer(data.answer ?? null);
        setActive(0);
      } catch {
        if (id === requestId.current) {
          setHits([]);
          setAnswer(null);
        }
      } finally {
        if (id === requestId.current) setBusy(false);
      }

      if (!includeDocuments) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const { data, error } = await createClient().rpc("search_documents", { q: trimmed });
        if (id !== requestId.current || error) return;
        const rows = (data ?? []) as {
          id: string;
          doc_type: string;
          created_at: string;
          fields: Record<string, unknown> | null;
        }[];
        setDocuments(
          rows.slice(0, 5).map((row) => ({
            id: row.id,
            docType: row.doc_type,
            reference:
              (row.fields?.bl_number as string) ??
              (row.fields?.invoice_no as string) ??
              (row.fields?.awb_number as string) ??
              (row.fields?.pl_no as string) ??
              "Document",
            createdAt: row.created_at,
          }))
        );
      } catch {
        // Document search is additive; site results still stand on their own.
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, includeDocuments]);

  const groups = useMemo(() => {
    const map = new Map<SearchKind, SearchHit[]>();
    for (const hit of hits) {
      if (answer && hit.id === answer.id) continue;
      const list = map.get(hit.kind) ?? [];
      list.push(hit);
      map.set(hit.kind, list);
    }
    return [...map.entries()].sort((a, b) => KIND_META[a[0]].order - KIND_META[b[0]].order);
  }, [hits, answer]);

  // A single flat list of destinations backing arrow-key navigation, built in
  // the same order the groups render so the highlight tracks what is on screen.
  const flat = useMemo(() => {
    const items: { href: string; label: string }[] = [];
    if (answer) items.push({ href: answer.url, label: answer.title });
    for (const [, list] of groups) for (const hit of list) items.push({ href: hit.url, label: hit.title });
    for (const doc of documents) items.push({ href: `/app/review/${doc.id}`, label: doc.reference });
    return items;
  }, [answer, groups, documents]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setAnswer(null);
    setDocuments([]);
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      const trimmed = query.trim();
      if (trimmed) pushRecent(trimmed);
      close();
      router.push(href);
    },
    [close, query, router]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = flat[active];
      if (target) go(target.href);
      else if (query.trim()) {
        pushRecent(query.trim());
        const q = query.trim();
        close();
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }
    }
  };

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Mutable counter walked during render so each row's keyboard index matches
  // the flat navigation list. Index 0 belongs to the answer card when present.
  let cursor = answer ? 1 : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        // Defaults to a compact icon pill and stays that way unless the host
        // shell asks for more. It previously forced `sm:w-64`, which put a
        // 256px box next to Sign in, Create account and the hamburger between
        // 640px and 1024px — the widths fit, but nothing had room to breathe.
        className={cn(
          "group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm font-medium text-white/85 transition hover:bg-white/20 hover:text-white",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" aria-hidden />
          <span className="hidden lg:inline">Search</span>
        </span>
        {/* The shortcut hint waits for xl. At lg the header is already carrying
            two dropdowns, three links and both auth buttons, and this is the
            least useful 40px in the row. */}
        <kbd className="hidden rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-[0.65rem] font-bold tracking-wide xl:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]">
          <div
            className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search GainingDocx"
            className="relative flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-brand-deep/25"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 shrink-0 text-signal" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={includeDocuments ? "Search documents, tools, guides…" : "Search tools, guides, parsers…"}
                aria-label="Search query"
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {query.trim().length < 2 ? (
                <div className="p-4">
                  {recent.length > 0 && (
                    <>
                      <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Recent
                      </p>
                      <div className="mb-4 mt-2 flex flex-wrap gap-2">
                        {recent.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setQuery(item)}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-signal hover:text-primary"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Try searching for
                  </p>
                  <div className="mt-2 grid gap-1.5">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                      >
                        <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !busy && flat.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="font-bold text-brand-deep">No matches for “{query.trim()}”</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Try a document name, a shorthand like B/L or AWB, or a question such as “how is
                    chargeable weight calculated”.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {answer && (
                    <div className="mb-2 rounded-xl border border-amber/50 bg-amber-soft/40 p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-ink">
                        <Lightbulb className="size-3.5" aria-hidden /> Answer
                      </p>
                      <p className="mt-2 font-bold text-brand-deep">{answer.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-foreground/80">
                        {answer.answer && answer.answer.length > 320
                          ? `${answer.answer.slice(0, 317).trimEnd()}…`
                          : answer.answer}
                      </p>
                      <button
                        type="button"
                        data-active={active === 0}
                        onClick={() => go(answer.url)}
                        className={cn(
                          "mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-primary hover:underline",
                          active === 0 && "bg-accent"
                        )}
                      >
                        {answer.parentTitle ?? "Read the full page"}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  )}
                  {groups.map(([kind, list]) => {
                    const Icon = KIND_META[kind].icon;
                    return (
                      <div key={kind} className="mb-1">
                        <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {KIND_META[kind].label}
                        </p>
                        {list.map((hit) => {
                          const index = cursor++;
                          return (
                            <Link
                              key={hit.id}
                              href={hit.url}
                              data-active={active === index}
                              onClick={(e) => {
                                e.preventDefault();
                                go(hit.url);
                              }}
                              onMouseEnter={() => setActive(index)}
                              className={cn(
                                "flex items-start gap-3 rounded-lg px-3 py-2.5",
                                active === index ? "bg-accent" : "hover:bg-accent/60"
                              )}
                            >
                              <Icon className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-brand-deep">
                                  {hit.title}
                                </span>
                                <Snippet segments={hit.snippet} />
                              </span>
                              {active === index && (
                                <CornerDownLeft className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}

                  {documents.length > 0 && (
                    <div className="mb-1 border-t border-border pt-1">
                      <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Your documents
                      </p>
                      {documents.map((doc) => {
                        const index = cursor++;
                        return (
                          <Link
                            key={doc.id}
                            href={`/app/review/${doc.id}`}
                            data-active={active === index}
                            onClick={(e) => {
                              e.preventDefault();
                              go(`/app/review/${doc.id}`);
                            }}
                            onMouseEnter={() => setActive(index)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5",
                              active === index ? "bg-accent" : "hover:bg-accent/60"
                            )}
                          >
                            <FileText className="size-4 shrink-0 text-signal" aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-brand-deep">
                                {doc.reference}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {doc.docType.replace(/_/g, " ")} ·{" "}
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-2.5 text-[0.7rem] text-muted-foreground">
              <span className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 font-sans font-bold">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 font-sans font-bold">↵</kbd> open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 font-sans font-bold">esc</kbd> close
                </span>
              </span>
              {query.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const q = query.trim();
                    pushRecent(q);
                    close();
                    router.push(`/search?q=${encodeURIComponent(q)}`);
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  See all results
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
