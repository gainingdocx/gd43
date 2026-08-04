"use client";

// The query box on /search. A plain form so it submits and works without
// JavaScript; the client boundary exists only to keep the field controlled and
// to let the user clear it in one click.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40"
    >
      <Search className="size-5 shrink-0 text-signal" aria-hidden />
      <input
        type="text"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search tools, parsers, guides and answers…"
        aria-label="Search query"
        autoComplete="off"
        className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push("/search");
          }}
          aria-label="Clear search"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      <button
        type="submit"
        className="my-1.5 rounded-lg bg-signal px-4 py-2 text-sm font-bold text-white hover:bg-signal/90"
      >
        Search
      </button>
    </form>
  );
}
