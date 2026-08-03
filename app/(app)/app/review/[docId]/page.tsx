import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReviewScreen } from "@/components/review/review-screen";
import { createClient } from "@/lib/supabase/server";
import type { ValidationResult } from "@/lib/validators";
import { Check, ShieldQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decideHsSuggestion } from "./actions";
import { addDocumentComment, updateDocumentWorkflow } from "@/app/(app)/app/shipments/[id]/actions";
import { ClipboardCheck, MessageSquareText } from "lucide-react";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ docId: string }>;
  searchParams: Promise<{ page?: string; focus?: string }>;
}) {
  const { docId } = await params;
  const query = await searchParams;
  const requestedPage = Number(query.page ?? "1");
  const requestedFocus = typeof query.focus === "string" ? query.focus.slice(0, 300) : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/app/review/${docId}`);

  const { data: doc } = await supabase
    .from("documents")
    .select("id, doc_type, status, fields, validation, raw_extraction, shipment_id, page_count, storage_path, source_pages, logical_group_index, logical_group_count, share_token, created_at")
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
    const sourcePages = Array.isArray(doc.source_pages) && doc.source_pages.length
      ? doc.source_pages.slice(0, 15)
      : Array.from({ length: pageCount }, (_, i) => i + 1);
    const paths = sourcePages.map((page) => `${doc.storage_path}/page-${page}.jpg`);
    const { data: signed } = await supabase.storage.from("docs").createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.signedUrl && !s.error) pageUrls.push(s.signedUrl);
  }

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, bl_number, ref")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: hsReviews } = await supabase
    .from("hs_reviews")
    .select("id, line_index, product_description, suggested_code, confidence, reason, duty_rate, status, decision_note, decided_at")
    .eq("document_id", doc.id)
    .order("line_index");
  const [{ data: workflow }, { data: teamComments }] = doc.shipment_id ? await Promise.all([
    supabase.from("document_workflows").select("status, assignee_email, updated_at").eq("document_id", doc.id).maybeSingle(),
    supabase.from("document_comments").select("id, author_email, body, kind, created_at").eq("document_id", doc.id).order("created_at"),
  ]) : [{ data: null }, { data: [] }];

  return (
    <div className="space-y-6">
    {(doc.logical_group_count ?? 0) > 1 && <section className="rounded-2xl border border-[#f4c400]/70 bg-[#fffdf2] p-4"><p className="font-bold text-primary">Logical document {doc.logical_group_index} of {doc.logical_group_count}</p><p className="mt-1 text-xs text-muted-foreground">The uploaded file contained multiple documents. This record uses only its assigned source pages; the other logical documents were extracted and saved separately.</p></section>}
    {doc.shipment_id && <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 size-5 text-signal" aria-hidden/><div className="min-w-0 flex-1"><h2 className="font-bold text-primary">Team review</h2><p className="mt-1 text-xs capitalize text-muted-foreground">{workflow?.status?.replace(/_/g, " ") ?? "Unassigned"}{workflow?.assignee_email ? ` · assigned to ${workflow.assignee_email}` : ""}</p></div>
        <form action={updateDocumentWorkflow}><input type="hidden" name="shipmentId" value={doc.shipment_id}/><input type="hidden" name="documentId" value={doc.id}/><input type="hidden" name="assigneeEmail" value={workflow?.assignee_email ?? ""}/><Button name="status" value="approved" size="sm">Approve</Button></form>
      </div>
      {(teamComments ?? []).length > 0 && <ul className="mt-3 space-y-2">{(teamComments ?? []).slice(-5).map((comment) => <li key={comment.id} className="rounded-lg bg-muted px-3 py-2 text-xs"><p><span className="font-semibold">{comment.author_email}</span> · <span className="capitalize">{comment.kind.replace(/_/g, " ")}</span></p><p className="mt-1">{comment.body}</p></li>)}</ul>}
      <form action={addDocumentComment} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="shipmentId" value={doc.shipment_id}/><input type="hidden" name="documentId" value={doc.id}/><input name="body" required maxLength={2000} placeholder="Comment or correction request…" className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm"/><Button name="kind" value="comment" size="sm" variant="outline"><MessageSquareText className="size-4" aria-hidden/> Comment</Button><Button name="kind" value="correction_request" size="sm" variant="outline">Request correction</Button></form>
    </section>}
    {(hsReviews ?? []).length > 0 && <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border bg-primary/5 p-4">
        <ShieldQuestion className="mt-0.5 size-5 text-signal" aria-hidden />
        <div><h2 className="font-bold text-primary">HS classification review</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Suggestions never become customs data until a person approves them. Each decision is recorded with who, when, and why.</p></div>
      </div>
      <ul className="divide-y divide-border">{(hsReviews ?? []).map((review) => <li key={review.id} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{review.product_description || `Line ${review.line_index + 1}`}</p><p className="mt-1 text-xs text-muted-foreground">{review.reason}</p></div><div className="text-right"><code className="rounded-lg bg-primary/8 px-2.5 py-1 text-sm font-bold text-primary">{review.suggested_code}</code><p className="mt-1 text-[0.7rem] uppercase tracking-wide text-muted-foreground">{review.confidence} confidence{review.duty_rate ? ` · US ${review.duty_rate}` : ""}</p></div></div>
        {review.status === "pending" ? <form action={decideHsSuggestion} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="reviewId" value={review.id}/><input name="note" maxLength={500} placeholder="Decision note (recommended)" className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm"/>
          <Button name="decision" value="rejected" variant="outline"><X className="size-4" aria-hidden/> Reject</Button>
          <Button name="decision" value="approved"><Check className="size-4" aria-hidden/> Approve</Button>
        </form> : <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs"><span className="font-semibold capitalize">{review.status}</span>{review.decided_at ? ` · ${new Date(review.decided_at).toLocaleString()}` : ""}{review.decision_note ? ` · ${review.decision_note}` : ""}</p>}
      </li>)}</ul>
    </section>}
    <ReviewScreen
      docId={doc.id}
      docType={doc.doc_type}
      fields={doc.fields as Record<string, unknown>}
      validation={(doc.validation ?? []) as ValidationResult[]}
      pageUrls={pageUrls}
      shipmentId={doc.shipment_id}
      shipments={shipments ?? []}
      shareToken={doc.share_token}
      qualityScore={typeof (doc.raw_extraction as { quality_score?: unknown } | null)?.quality_score === "number"
        ? (doc.raw_extraction as { quality_score: number }).quality_score
        : null}
      initialPage={Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1}
      initialEvidencePath={requestedFocus}
    />
    </div>
  );
}
