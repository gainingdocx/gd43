// GET /v1/content/search — the same site search behind the palette, exposed so
// customers can embed GainingDocx reference material in their own help centres
// and internal tools rather than duplicating it.
//
// Reads no account data, but is key-authenticated like every other v1 endpoint
// so usage is attributable and rate limited.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, list, preflight } from "@/lib/api/respond";
import { badRequest } from "@/lib/api/errors";
import { requireNumber } from "@/lib/api/validate";
import { directAnswer, search } from "@/lib/search/engine";
import type { SearchKind } from "@/lib/search/corpus";

const KINDS: SearchKind[] = ["answer", "tool", "template", "parser", "feature", "guide", "hub", "page"];

export const OPTIONS = preflight;

export const GET = handler(async (request, id) => {
  const caller = await authenticate(request);
  const url = new URL(request.url);

  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) throw badRequest("`q` must be at least 2 characters.", "q");
  if (query.length > 120) throw badRequest("`q` must be 120 characters or fewer.", "q");

  const limit = url.searchParams.has("limit")
    ? requireNumber(url.searchParams.get("limit"), "limit", { min: 1, max: 40, integer: true })
    : 10;

  const requested = url.searchParams.getAll("kind");
  for (const kind of requested) {
    if (!KINDS.includes(kind as SearchKind)) {
      throw badRequest(`\`kind\` must be one of: ${KINDS.join(", ")}.`, "kind");
    }
  }

  const hits = search(query, {
    limit,
    kinds: requested.length ? (requested as SearchKind[]) : undefined,
  });
  const answer = requested.length ? null : directAnswer(query, hits);

  return json(
    {
      query,
      // Present when the query reads as a question and one result is clearly
      // ahead — suitable for rendering directly rather than as a link.
      answer: answer
        ? { title: answer.title, body: answer.answer, url: absolute(answer.url), source: answer.parentTitle ?? null }
        : null,
      ...list(
        hits.map((hit) => ({
          object: "content_result" as const,
          type: hit.kind,
          title: hit.title,
          url: absolute(hit.url),
          description: hit.description,
          // Snippet is returned as plain text; the highlight runs the palette
          // uses are a UI concern and would only complicate a server client.
          snippet: hit.snippet.map((segment) => segment.text).join(""),
          updated: hit.updated ?? null,
        }))
      ),
    },
    { id, headers: rateHeaders(caller) }
  );
});

function absolute(path: string) {
  return `https://gainingdocx.com${path}`;
}
