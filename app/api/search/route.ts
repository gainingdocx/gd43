// Site-wide search. The index is built from static content modules already
// bundled for the marketing routes, so this route makes no network calls and no
// database queries — it is pure CPU over an in-memory index cached per isolate.
// That is what lets the palette feel instant while still searching full page
// bodies rather than titles alone.
//
// Private document search is deliberately not here: it needs the caller's
// session and belongs on the authenticated Supabase RPC, which the palette
// queries directly and merges client-side.

import { directAnswer, search } from "@/lib/search/engine";
import type { SearchKind } from "@/lib/search/corpus";

const VALID_KINDS: SearchKind[] = ["answer", "tool", "template", "parser", "feature", "guide", "hub", "page"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ hits: [], answer: null, query });
  if (query.length > 120) return Response.json({ error: "Query too long." }, { status: 400 });

  const limit = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 40);
  const requested = params.getAll("kind").filter((k): k is SearchKind => VALID_KINDS.includes(k as SearchKind));

  const hits = search(query, { limit, kinds: requested.length ? requested : undefined });
  const answer = directAnswer(query, hits);

  return Response.json(
    { query, hits, answer },
    {
      // The corpus only changes on deploy, so this is safely cacheable and keeps
      // repeat keystrokes off the origin entirely.
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    }
  );
}
