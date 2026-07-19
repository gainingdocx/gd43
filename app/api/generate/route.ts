import { generatedDocPdf } from "@/lib/generate/pdf";
import type { GenDoc, GenLine } from "@/lib/generate/map";
import { createClient } from "@/lib/supabase/server";

// Render an edited generation draft to PDF (BUILD_SPEC §M7).
// POST { docId, gen } — watermarked on the free plan.

const GEN_TYPES = ["packing_list", "commercial_invoice", "shipping_instructions"];
const MAX_LINES = 50;

const str = (v: unknown, max = 400): string =>
  typeof v === "string" ? v.slice(0, max) : "";

function sanitizeGen(raw: unknown): GenDoc | null {
  if (raw === null || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  if (!GEN_TYPES.includes(g.type as string)) return null;
  const pairList = (v: unknown, max: number) =>
    Array.isArray(v)
      ? v.slice(0, max).map((p) => ({
          label: str((p as Record<string, unknown>)?.label, 60),
          value: str((p as Record<string, unknown>)?.value, 1200),
        }))
      : [];
  const lines: GenLine[] = Array.isArray(g.lines)
    ? g.lines.slice(0, MAX_LINES).map((l) => {
        const o = (l ?? {}) as Record<string, unknown>;
        return {
          description: str(o.description),
          hs_code: str(o.hs_code, 40),
          packages: str(o.packages, 20),
          cartons: str(o.cartons, 20),
          net_kg: str(o.net_kg, 20),
          gross_kg: str(o.gross_kg, 20),
          volume_cbm: str(o.volume_cbm, 20),
          unit_price: str(o.unit_price, 20),
          amount: str(o.amount, 20),
        };
      })
    : [];
  return {
    type: g.type as GenDoc["type"],
    title: str(g.title, 60) || "DRAFT DOCUMENT",
    header: pairList(g.header, 10),
    parties: pairList(g.parties, 4),
    lines,
    totals: pairList(g.totals, 8),
    notes: str(g.notes, 3000),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  let body: { docId?: unknown; gen?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const gen = sanitizeGen(body.gen);
  if (!gen) return Response.json({ error: "invalid draft payload" }, { status: 400 });

  const docId = typeof body.docId === "string" ? body.docId : null;
  if (docId) {
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", docId)
      .maybeSingle();
    if (!doc) return Response.json({ error: "document not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const watermark = (profile?.plan ?? "free") === "free";

  const pdf = await generatedDocPdf(gen, watermark);

  await supabase.from("events").insert({
    owner: user.id,
    type: "generate",
    payload: { document_id: docId, gen_type: gen.type, watermark },
  });

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${gen.type}-draft.pdf"`,
    },
  });
}
