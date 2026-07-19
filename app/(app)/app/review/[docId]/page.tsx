import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReviewScreen } from "@/components/review/review-screen";
import { createClient } from "@/lib/supabase/server";
import type { ValidationResult } from "@/lib/validators";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/app/account");

  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type, status, fields, validation, shipment_id, page_count, storage_path, created_at")
    .eq("id", docId)
    .maybeSingle();
  if (!doc) notFound();

  if (doc.status !== "parsed" || !doc.fields) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Review</h1>
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {doc.status === "parsing"
            ? "This document is still parsing — check back in a moment."
            : doc.status === "failed"
              ? "Parsing failed for this document."
              : "This document has not been parsed yet."}
          <div className="mt-4">
            <Link href="/app/scan" className="font-medium text-signal underline">
              Go to Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Signed page URLs for the source-page thumbnails.
  const pageUrls: string[] = [];
  const pageCount = Math.min(doc.page_count ?? 1, 15);
  if (doc.storage_path) {
    const paths = Array.from({ length: pageCount }, (_, i) => `${doc.storage_path}/page-${i + 1}.jpg`);
    const { data: signed } = await supabase.storage.from("docs").createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.signedUrl && !s.error) pageUrls.push(s.signedUrl);
  }

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, bl_number, ref")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ReviewScreen
      docId={doc.id}
      docType={doc.doc_type}
      fields={doc.fields as Record<string, unknown>}
      validation={(doc.validation ?? []) as ValidationResult[]}
      pageUrls={pageUrls}
      shipmentId={doc.shipment_id}
      shipments={shipments ?? []}
    />
  );
}
