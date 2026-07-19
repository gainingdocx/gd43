import { createClient } from "@/lib/supabase/server";
import { MAX_PAGES } from "@/lib/ai/config";
import { parseDocument } from "@/lib/ai/router";
import { containersOf, DETECTED_TYPES } from "@/lib/ai/schemas/extraction-v2";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Parse a document from already-uploaded page images (SSE response).
// Heavy bytes never touch this Worker (spec §1.5): the browser uploads pages
// to Supabase Storage first and sends { storagePath } per page; the route
// turns them into short-lived signed URLs for the model. Plain https URLs are
// accepted for anonymous/testing flows.
//
// Body: { pages: [{ storagePath?: string; url?: string }], docTypeHint?, docId? }
// Events: status | fields | done | error

interface PageRef {
  storagePath?: string;
  url?: string;
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

async function persistResult(
  supabase: SupabaseClient,
  user: User,
  documentId: string,
  result: Awaited<ReturnType<typeof parseDocument>>
) {
  const { extraction } = result;
  await supabase
    .from("documents")
    .update({
      status: "parsed",
      doc_type: extraction.detected_type,
      fields: extraction.fields,
      raw_extraction: {
        text: result.rawText.slice(0, 100_000),
        model: result.model,
        provider: result.provider,
        prompt_version: result.promptVersion,
        escalated: result.escalated,
      },
      validation: null, // validators land in M5
    })
    .eq("id", documentId);

  const containers = containersOf(extraction);
  await supabase.from("containers").delete().eq("document_id", documentId);
  if (containers.length > 0) {
    await supabase.from("containers").insert(
      containers.map((c) => ({
        document_id: documentId,
        owner: user.id,
        container_no: c.container_no,
        seal_no: c.seal_no,
        iso_type: c.iso_type,
        packages: c.packages,
        package_type: c.package_type,
        gross_kg: c.gross_kg,
        volume_cbm: c.volume_cbm,
        check_digit_valid: null, // validators land in M5
      }))
    );
  }

  await supabase.from("events").insert({
    owner: user.id,
    type: "parse_done",
    payload: {
      document_id: documentId,
      detected_type: extraction.detected_type,
      model: result.model,
      provider: result.provider,
      escalated: result.escalated,
      prompt_version: result.promptVersion,
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return bad("AI parsing is not configured yet", 503);
  }

  let body: { pages?: unknown; docTypeHint?: unknown; docId?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad("invalid JSON body");
  }

  const pages = Array.isArray(body.pages) ? (body.pages as PageRef[]) : [];
  if (pages.length < 1 || pages.length > MAX_PAGES) {
    return bad(`pages must contain 1–${MAX_PAGES} entries`);
  }

  const docTypeHint =
    typeof body.docTypeHint === "string" &&
    DETECTED_TYPES.includes(body.docTypeHint as (typeof DETECTED_TYPES)[number])
      ? body.docTypeHint
      : undefined;

  const docId = typeof body.docId === "string" ? body.docId : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve every page to a fetchable URL.
  const imageUrls: string[] = [];
  for (const page of pages) {
    if (typeof page?.storagePath === "string") {
      if (!user) return bad("sign in to parse uploaded documents", 401);
      if (!page.storagePath.startsWith(`${user.id}/`)) {
        return bad("storagePath outside your folder", 403);
      }
      const { data, error } = await supabase.storage
        .from("docs")
        .createSignedUrl(page.storagePath, 3600);
      if (error || !data?.signedUrl) {
        return bad(`cannot sign ${page.storagePath}`, 400);
      }
      imageUrls.push(data.signedUrl);
    } else if (
      typeof page?.url === "string" &&
      /^https:\/\/.{4,2000}$/.test(page.url)
    ) {
      imageUrls.push(page.url);
    } else {
      return bad("each page needs a storagePath or an https url");
    }
  }

  // Authenticated users get a documents row (created or reused via docId).
  let documentId: string | null = null;
  if (user) {
    if (docId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("id")
        .eq("id", docId)
        .maybeSingle();
      if (!doc) return bad("document not found", 404);
      documentId = doc.id as string;
      await supabase
        .from("documents")
        .update({ status: "parsing", page_count: pages.length })
        .eq("id", documentId);
    } else {
      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          owner: user.id,
          doc_type: docTypeHint ?? "other",
          status: "parsing",
          page_count: pages.length,
          storage_path:
            typeof pages[0]?.storagePath === "string"
              ? pages[0].storagePath.split("/").slice(0, 2).join("/")
              : null,
        })
        .select("id")
        .single();
      if (error || !doc) return bad("could not create document row", 500);
      documentId = doc.id as string;
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      send("status", { state: "parsing", documentId, pages: pages.length });
      try {
        const result = await parseDocument(imageUrls, docTypeHint, {
          onPartial: (partial) => send("fields", partial),
          onStatus: (status) => send("status", { state: status }),
        });

        if (user && documentId) {
          await persistResult(supabase, user, documentId, result);
        }

        send("done", {
          documentId,
          extraction: result.extraction,
          model: result.model,
          provider: result.provider,
          escalated: result.escalated,
        });
      } catch (error) {
        if (user && documentId) {
          await supabase
            .from("documents")
            .update({ status: "failed" })
            .eq("id", documentId);
        }
        send("error", { message: String(error).slice(0, 500) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
