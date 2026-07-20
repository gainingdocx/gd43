import { containersOf } from "@/lib/ai/schemas/extraction-v2";
import type { DetectedType, NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { createClient } from "@/lib/supabase/server";
import {
  containerCheckDigit,
  duplicates,
  validateDocument,
  type ValidationResult,
} from "@/lib/validators";

interface EditBody {
  fields?: unknown;
  path?: unknown;
  oldValue?: unknown;
  newValue?: unknown;
}

const EDITABLE_TYPES = new Set<DetectedType>([
  "bill_of_lading",
  "sea_waybill",
  "commercial_invoice",
  "packing_list",
  "arrival_notice",
  "booking_confirmation",
  "other",
]);

/** Save a Trust Screen edit and refresh validation plus the search index. */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ docId: string }> }
) {
  const { docId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  let body: EditBody;
  try {
    body = (await request.json()) as EditBody;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) {
    return Response.json({ error: "fields must be an object" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type")
    .eq("id", docId)
    .eq("owner", user.id)
    .maybeSingle();
  if (!doc) return Response.json({ error: "document not found" }, { status: 404 });
  if (!EDITABLE_TYPES.has(doc.doc_type as DetectedType)) {
    return Response.json({ error: "unsupported document type" }, { status: 409 });
  }

  const extraction = {
    detected_type: doc.doc_type,
    fields: body.fields,
  } as NormalizedExtraction;
  let validation: ValidationResult[] = validateDocument(extraction);

  if (doc.doc_type === "bill_of_lading" || doc.doc_type === "commercial_invoice") {
    const kind = doc.doc_type === "bill_of_lading" ? "bl_number" : "invoice_no";
    const value = (body.fields as Record<string, unknown>)[kind];
    const { data: candidates } = await supabase
      .from("documents")
      .select(`id, ref:fields->>${kind}`)
      .eq("owner", user.id)
      .neq("id", docId)
      .not(`fields->>${kind}`, "is", null)
      .limit(500);
    const duplicate = duplicates(
      kind,
      typeof value === "string" ? value : null,
      (candidates ?? []).map((candidate) => ({
        id: candidate.id as string,
        value: (candidate as { ref: string | null }).ref,
      }))
    );
    if (duplicate) validation = [...validation, duplicate];
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ fields: body.fields, validation })
    .eq("id", docId)
    .eq("owner", user.id);
  if (updateError) {
    return Response.json({ error: "could not save document" }, { status: 500 });
  }

  const containers = containersOf(extraction);
  await supabase.from("containers").delete().eq("document_id", docId).eq("owner", user.id);
  if (containers.length > 0) {
    const { error: containerError } = await supabase.from("containers").insert(
      containers.map((container) => ({
        document_id: docId,
        owner: user.id,
        container_no: container.container_no,
        seal_no: container.seal_no,
        iso_type: container.iso_type,
        packages: container.packages,
        package_type: container.package_type,
        gross_kg: container.gross_kg,
        volume_cbm: container.volume_cbm,
        check_digit_valid: container.container_no
          ? containerCheckDigit(container.container_no)
          : null,
      }))
    );
    if (containerError) {
      return Response.json(
        { error: "saved fields but could not refresh container search" },
        { status: 500 }
      );
    }
  }

  await supabase.from("events").insert({
    owner: user.id,
    type: "field_edited",
    payload: {
      document_id: docId,
      field: typeof body.path === "string" ? body.path : null,
      old: body.oldValue ?? null,
      new: body.newValue ?? null,
      validation_fail_count: validation.filter((result) => result.status === "fail").length,
    },
  });

  return Response.json({ fields: body.fields, validation });
}
