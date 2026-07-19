import { createClient } from "@/lib/supabase/server";
import { MAX_PAGES } from "@/lib/ai/config";
import { parseDocument } from "@/lib/ai/router";
import { containersOf, DETECTED_TYPES } from "@/lib/ai/schemas/extraction-v2";
import {
  containerCheckDigit,
  duplicates,
  validateDocument,
  type ValidationResult,
} from "@/lib/validators";
import { decideLink, type DocCandidate } from "@/lib/shipments/link";
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
  /** Anonymous flow: compressed page as a data URL (no storage access). */
  dataUrl?: string;
}

const ANON_MAX_PAGES = 3;
const ANON_MAX_DATAURL = 3_000_000; // ~2.2MB of image after base64

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Duplicate-ref warn (spec §M5.6): other docs of this owner, same number. */
async function duplicateWarn(
  supabase: SupabaseClient,
  user: User,
  documentId: string,
  extraction: Awaited<ReturnType<typeof parseDocument>>["extraction"]
): Promise<ValidationResult | null> {
  let kind: "bl_number" | "invoice_no";
  let value: string | null;
  if (extraction.detected_type === "bill_of_lading") {
    kind = "bl_number";
    value = extraction.fields.bl_number;
  } else if (extraction.detected_type === "commercial_invoice") {
    kind = "invoice_no";
    value = extraction.fields.invoice_no;
  } else {
    return null;
  }
  if (!value) return null;
  const { data } = await supabase
    .from("documents")
    .select(`id, ref:fields->>${kind}`)
    .eq("owner", user.id)
    .neq("id", documentId)
    .not(`fields->>${kind}`, "is", null)
    .limit(500);
  const existing = (data ?? []).map((d) => ({
    id: d.id as string,
    value: (d as { ref: string | null }).ref,
  }));
  return duplicates(kind, value, existing);
}

/** Auto-link the parsed doc to a shipment (spec §M6.4); never re-links. */
async function autoLink(
  supabase: SupabaseClient,
  user: User,
  documentId: string,
  extraction: Awaited<ReturnType<typeof parseDocument>>["extraction"]
) {
  const { data: current } = await supabase
    .from("documents")
    .select("shipment_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!current || current.shipment_id !== null) return;

  const [{ data: shipments }, { data: docs }] = await Promise.all([
    supabase.from("shipments").select("id, bl_number").limit(200),
    supabase
      .from("documents")
      .select(
        "id, shipment_id, doc_type, invoice_no:fields->>invoice_no, invoice_ref:fields->>invoice_ref"
      )
      .neq("id", documentId)
      .limit(500),
  ]);

  const decision = decideLink(
    extraction,
    shipments ?? [],
    (docs ?? []) as unknown as DocCandidate[]
  );

  let shipmentId: string | null = null;
  if (decision.action === "attach") {
    shipmentId = decision.shipmentId;
  } else if (decision.action === "create") {
    const { data: created } = await supabase
      .from("shipments")
      .insert({ owner: user.id, bl_number: decision.bl_number })
      .select("id")
      .single();
    shipmentId = created?.id ?? null;
  }
  if (shipmentId) {
    await supabase
      .from("documents")
      .update({ shipment_id: shipmentId })
      .eq("id", documentId);
  }
}

async function persistResult(
  supabase: SupabaseClient,
  user: User,
  documentId: string,
  result: Awaited<ReturnType<typeof parseDocument>>,
  validation: ValidationResult[]
): Promise<ValidationResult[]> {
  const { extraction } = result;

  const dup = await duplicateWarn(supabase, user, documentId, extraction);
  if (dup) validation = [...validation, dup];

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
      validation,
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
        check_digit_valid: c.container_no
          ? containerCheckDigit(c.container_no)
          : null,
      }))
    );
  }

  await autoLink(supabase, user, documentId, extraction);

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
      validation_fail_count: validation.filter((v) => v.status === "fail").length,
    },
  });

  return validation;
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
    } else if (
      typeof page?.dataUrl === "string" &&
      /^data:image\/(jpeg|png|webp);base64,/.test(page.dataUrl)
    ) {
      // Anonymous scan flow: no storage access, so compressed pages travel
      // inline. Tightly capped; signed-in uploads still go direct to storage.
      if (page.dataUrl.length > ANON_MAX_DATAURL) {
        return bad("page image too large — compress below ~2MB");
      }
      if (pages.length > ANON_MAX_PAGES) {
        return bad(`inline pages are limited to ${ANON_MAX_PAGES} — sign in for more`);
      }
      imageUrls.push(page.dataUrl);
    } else {
      return bad("each page needs a storagePath, https url or image dataUrl");
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

        // Deterministic validation (spec §M3 step 3 / §M5) — server-side,
        // anonymous parses included; the duplicate check needs an owner.
        send("status", { state: "validating" });
        let validation = validateDocument(result.extraction);

        if (user && documentId) {
          validation = await persistResult(
            supabase,
            user,
            documentId,
            result,
            validation
          );
        }

        send("done", {
          documentId,
          extraction: result.extraction,
          validation,
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
