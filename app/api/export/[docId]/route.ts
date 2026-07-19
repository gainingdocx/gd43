import Papa from "papaparse";

import { csvTable, docRef } from "@/lib/export/rows";
import { summaryReportPdf } from "@/lib/export/pdf";
import { buildWorkbook } from "@/lib/export/xlsx";
import { createClient } from "@/lib/supabase/server";
import type { ValidationResult } from "@/lib/validators";

// Document export (BUILD_SPEC §M7): xlsx | csv | json | pdf.
// GET /api/export/[docId]?format=xlsx

const FORMATS = ["xlsx", "csv", "json", "pdf"] as const;
type Format = (typeof FORMATS)[number];

export async function GET(
  request: Request,
  ctx: { params: Promise<{ docId: string }> }
) {
  const { docId } = await ctx.params;
  const format = new URL(request.url).searchParams.get("format") as Format | null;
  if (!format || !FORMATS.includes(format)) {
    return Response.json({ error: `format must be one of ${FORMATS.join(", ")}` }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type, status, fields, validation, share_token")
    .eq("id", docId)
    .maybeSingle();
  if (!doc) return Response.json({ error: "document not found" }, { status: 404 });
  if (doc.status !== "parsed" || !doc.fields) {
    return Response.json({ error: "document is not parsed yet" }, { status: 409 });
  }

  const fields = doc.fields as Record<string, unknown>;
  const base = (docRef(fields) ?? doc.doc_type).replace(/[^\w-]+/g, "_");
  const filename = `${base}-${doc.id.slice(0, 8)}`;

  await supabase.from("events").insert({
    owner: user.id,
    type: "export",
    payload: { document_id: doc.id, format },
  });

  const attachment = (name: string, type: string, body: BodyInit) =>
    new Response(body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });

  switch (format) {
    case "json":
      // Spec: JSON = fields verbatim.
      return attachment(`${filename}.json`, "application/json", JSON.stringify(fields, null, 2));
    case "csv": {
      const csv = Papa.unparse(csvTable(doc.doc_type, fields).map((r) => r.map(String)));
      return attachment(`${filename}.csv`, "text/csv; charset=utf-8", csv);
    }
    case "xlsx": {
      const buffer = await buildWorkbook(doc.doc_type, fields);
      return attachment(
        `${filename}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer
      );
    }
    case "pdf": {
      const origin = new URL(request.url).origin;
      const pdf = await summaryReportPdf({
        docType: doc.doc_type,
        fields,
        validation: (doc.validation ?? []) as ValidationResult[],
        shareUrl: doc.share_token ? `${origin}/share/${doc.share_token}` : null,
      });
      return attachment(`${filename}.pdf`, "application/pdf", pdf as unknown as BodyInit);
    }
  }
}
