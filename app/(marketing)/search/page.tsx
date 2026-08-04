// Full search results.
//
// Server-rendered rather than a client fetch so a result URL is shareable, works
// with JavaScript disabled, and renders in one pass. The palette handles the
// fast path; this page is for browsing a whole result set and filtering it.
//
// Deliberately noindex: search result pages are the classic thin-content trap,
// and there is nothing here a crawler cannot reach through the hubs.

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lightbulb, Search as SearchIcon, SearchX } from "lucide-react";

import { SearchInput } from "@/components/search/search-input";
import type { SearchKind } from "@/lib/search/corpus";
import { directAnswer, search, type Segment } from "@/lib/search/engine";

export const metadata: Metadata = {
  title: { absolute: "Search | GainingDocx" },
  description: "Search GainingDocx tools, parsers, templates, guides and answers.",
  robots: { index: false, follow: true },
};

const KIND_LABEL: Record<SearchKind, string> = {
  answer: "Answers",
  tool: "Tools",
  parser: "Parsers",
  guide: "Guides",
  template: "Templates",
  feature: "Features",
  hub: "Sections",
  page: "Pages",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Everything" },
  { value: "answer", label: "Answers" },
  { value: "tool", label: "Tools" },
  { value: "parser", label: "Parsers" },
  { value: "guide", label: "Guides" },
  { value: "template", label: "Templates" },
  { value: "feature", label: "Features" },
];

function Highlighted({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.hit ? (
          <mark key={i} className="rounded bg-amber-soft px-0.5 text-amber-ink">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const kind = (params.kind ?? "").trim();
  const kinds = kind && kind in KIND_LABEL ? [kind as SearchKind] : undefined;

  const hits = query.length >= 2 ? search(query, { limit: 40, kinds }) : [];
  const answer = query.length >= 2 && !kinds ? directAnswer(query, hits) : null;
  const listed = answer ? hits.filter((h) => h.id !== answer.id) : hits;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="size-3" aria-hidden />
        <span>Search</span>
      </nav>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">
        {query ? <>Results for “{query}”</> : "Search GainingDocx"}
      </h1>

      <div className="mt-6">
        <SearchInput initialQuery={query} />
      </div>

      {query.length >= 2 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const href = filter.value
              ? `/search?q=${encodeURIComponent(query)}&kind=${filter.value}`
              : `/search?q=${encodeURIComponent(query)}`;
            const activeFilter = kind === filter.value;
            return (
              <Link
                key={filter.value || "all"}
                href={href}
                className={
                  activeFilter
                    ? "rounded-full border border-signal bg-accent px-3.5 py-1.5 text-xs font-bold text-primary"
                    : "rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-signal hover:text-primary"
                }
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      )}

      {query.length < 2 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <SearchIcon className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-bold text-brand-deep">Search the whole site</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Tools, document parsers, templates, guides and the answers inside them. Trade shorthand
            works — try B/L, AWB, VGM or D&amp;D. Press{" "}
            <kbd className="rounded border border-border px-1 py-0.5 font-sans text-[0.7rem] font-bold">⌘K</kbd>{" "}
            anywhere on the site.
          </p>
        </div>
      ) : listed.length === 0 && !answer ? (
        <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <SearchX className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-bold text-brand-deep">Nothing matches “{query}”</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Try a shorter phrase, a document name, or a question such as “how is chargeable weight
            calculated”.
          </p>
          <Link
            href="/guides"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            Browse all guides <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          {answer && (
            <div className="mt-8 rounded-2xl border border-amber/50 bg-amber-soft/40 p-6">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-ink">
                <Lightbulb className="size-3.5" aria-hidden /> Answer
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-brand-deep">{answer.title}</h2>
              <p className="mt-2 leading-7 text-foreground/85">{answer.answer}</p>
              <Link
                href={answer.url}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                {answer.parentTitle ?? "Read the full page"}
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          )}

          <p className="mt-8 text-sm text-muted-foreground">
            {listed.length} {listed.length === 1 ? "result" : "results"}
            {kind ? ` in ${KIND_LABEL[kind as SearchKind]}` : ""}
          </p>

          <ul className="mt-4 space-y-3">
            {listed.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={hit.url}
                  className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-signal">
                    {KIND_LABEL[hit.kind]}
                  </span>
                  <span className="mt-1.5 block font-bold text-brand-deep">{hit.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    <Highlighted segments={hit.snippet} />
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground/80">
                    gainingdocx.com{hit.url}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
