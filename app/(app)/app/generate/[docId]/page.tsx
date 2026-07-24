import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GenerateEditor } from "@/components/generate/editor";
import { buildDraft, generatableTypes, type GenType } from "@/lib/generate/map";
import { createClient } from "@/lib/supabase/server";

// Generation editor (BUILD_SPEC §M7): deterministic draft from the parsed
// source document, fully editable, then rendered to PDF server-side.

export default async function GeneratePage({
  params,
  searchParams,
}: {
  params: Promise<{ docId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { docId } = await params;
  const { type } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/app/generate/${docId}`);

  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type, status, fields")
    .eq("id", docId)
    .maybeSingle();
  if (!doc) notFound();

  const allowed = generatableTypes(doc.doc_type);
  const genType = allowed.includes(type as GenType) ? (type as GenType) : allowed[0];

  if (doc.status !== "parsed" || !doc.fields || !genType) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Generate</h1>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {!genType
            ? "Nothing can be generated from this document type."
            : "This document is not parsed yet."}
          <div className="mt-4">
            <Link href={`/app/review/${docId}`} className="font-medium text-signal underline">
              Back to the document
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const draft = buildDraft(genType, doc.fields as Record<string, unknown>, doc.doc_type);

  return (
    <GenerateEditor
      docId={doc.id}
      draft={draft}
      alternatives={allowed}
      current={genType}
    />
  );
}
