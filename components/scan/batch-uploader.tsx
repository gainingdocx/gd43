"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, CircleX, FileStack, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { fileToPageImages, ACCEPTED_DOCUMENT_TYPES } from "./file-to-pages";
import { readSse } from "./sse";
import { TRANSLATION_LANGUAGES } from "@/lib/ai/languages";
import { getFlagshipWorkflow, type FlagshipWorkflowKey } from "@/lib/workflows/flagship";

type ShipmentOption = { id: string; bl_number: string | null; ref: string | null };
type Item = { id: string; file: File; status: "queued" | "preparing" | "uploading" | "parsing" | "done" | "failed"; detail?: string; documentId?: string; shipmentId?: string };

export function BatchUploader({ signedIn, shipments, defaultTargetLanguage = "", workflowKey, initialShipmentId }: { signedIn: boolean; shipments: ShipmentOption[]; defaultTargetLanguage?: string; workflowKey?: FlagshipWorkflowKey; initialShipmentId?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [shipmentId, setShipmentId] = useState(initialShipmentId ?? "");
  const [running, setRunning] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const batchId = useRef(crypto.randomUUID());
  const workflow = workflowKey ? getFlagshipWorkflow(workflowKey) : null;
  const patch = (id: string, next: Partial<Item>) => setItems((rows) => rows.map((row) => row.id === id ? { ...row, ...next } : row));

  function choose(files: FileList | null) {
    if (!files) return;
    const selected = [...files].slice(0, 20).map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const }));
    setItems(selected);
    batchId.current = crypto.randomUUID();
  }

  async function run() {
    if (!signedIn || running || !items.length) return;
    setRunning(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRunning(false); return; }
    for (const item of items) {
      if (item.status === "done") continue;
      try {
        patch(item.id, { status: "preparing", detail: "Preparing pages" });
        const { blobs, truncated } = await fileToPageImages(item.file, 15);
        if (!blobs.length) throw new Error("No readable pages");
        const { data: doc, error: docError } = await supabase.from("documents").insert({
          owner: user.id,
          shipment_id: shipmentId || null,
          batch_id: batchId.current,
          source_filename: item.file.name,
          status: "uploaded",
          page_count: blobs.length,
        }).select("id").single();
        if (docError || !doc) throw new Error("Could not create document");
        patch(item.id, { status: "uploading", detail: `Uploading ${blobs.length} page${blobs.length === 1 ? "" : "s"}`, documentId: doc.id });
        const paths: string[] = [];
        for (let index = 0; index < blobs.length; index++) {
          const path = `${user.id}/${doc.id}/page-${index + 1}.jpg`;
          const { error } = await supabase.storage.from("docs").upload(path, blobs[index], { contentType: "image/jpeg", upsert: true });
          if (error) throw new Error(`Upload failed on page ${index + 1}`);
          paths.push(path);
        }
        await supabase.from("documents").update({ storage_path: `${user.id}/${doc.id}` }).eq("id", doc.id);
        patch(item.id, { status: "parsing", detail: "Reading and validating" });
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pages: paths.map((storagePath) => ({ storagePath })),
            docId: doc.id,
            targetLanguage: targetLanguage || undefined,
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(error?.error ?? "Parsing could not start");
        }
        let finished = false;
        for await (const message of readSse(response)) {
          if (message.event === "done") finished = true;
          if (message.event === "error") {
            const payload = message.data as { message?: string };
            throw new Error(payload.message ?? "Parsing failed");
          }
        }
        if (!finished) throw new Error("Parsing ended unexpectedly");
        const { data: linked } = await supabase.from("documents").select("shipment_id").eq("id", doc.id).maybeSingle();
        patch(item.id, { status: "done", detail: truncated ? "Parsed first 15 pages" : "Parsed and validated", shipmentId: linked?.shipment_id ?? undefined });
      } catch (error) {
        patch(item.id, { status: "failed", detail: error instanceof Error ? error.message : "Failed" });
      }
    }
    setRunning(false);
  }

  if (!signedIn) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <FileStack className="mx-auto size-8 text-signal" aria-hidden />
      <h2 className="mt-3 text-lg font-bold text-primary">Batch upload is saved to your workspace</h2>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to process up to 20 documents as a tracked batch.</p>
      <Link href="/auth/login" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Sign in</Link>
    </div>
  );

  const complete = items.filter((item) => item.status === "done").length;
  const linkedShipmentIds = [...new Set(items.map((item) => item.shipmentId).filter((id): id is string => Boolean(id)))];
  return (
    <div className="space-y-5">
      {workflow && <section className="rounded-2xl border border-signal/30 bg-secondary/55 p-4" aria-label="Selected workflow">
        <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffeb00] text-xs font-black text-[#171717]">{workflow.number}</span><div><p className="font-bold text-primary">{workflow.name}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{workflow.sequence}</p></div></div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Add these documents</p>
        <ul className="mt-2 flex flex-wrap gap-2">{workflow.roles.filter((role) => !role.derived).map((role) => <li key={role.key} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">{role.label}</li>)}</ul>
      </section>}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-signal/10 text-signal"><FileStack className="size-6" aria-hidden /></span><div>
          <h2 className="text-lg font-bold text-primary">Add the complete document set</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select up to 20 PDFs or images. A mixed PDF can be split into logical documents, and related files are grouped into a shipment automatically.</p>
        </div></div>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="batch-shipment">Destination</label>
        <select id="batch-shipment" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} disabled={running}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
          <option value="">Smart grouping (recommended)</option>
          {shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.bl_number ?? shipment.ref ?? shipment.id.slice(0, 8)}</option>)}
        </select>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="batch-language">Translation</label>
        <select id="batch-language" value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} disabled={running}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
          {TRANSLATION_LANGUAGES.map(([code, name]) => <option key={code || "original"} value={code}>{name}</option>)}
        </select>
        <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background text-center hover:border-signal/60" htmlFor="batch-files">
          <Upload className="size-6 text-signal" aria-hidden /><span className="mt-2 text-sm font-semibold">{items.length ? "Replace selected files" : "Choose documents"}</span><span className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WebP, BMP or TIFF · 20 files · 15 pages each</span>
        </label>
        <input id="batch-files" type="file" multiple accept={ACCEPTED_DOCUMENT_TYPES} className="sr-only" disabled={running} onChange={(event) => choose(event.target.files)} />
      </div>
      {items.length > 0 && <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-semibold">{complete} of {items.length} complete</p><span className="text-xs text-muted-foreground">{running ? "Processing in a reliable queue" : "Ready"}</span></div>
        <ul className="divide-y divide-border">{items.map((item) => <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          {item.status === "done" ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden /> : item.status === "failed" ? <CircleX className="size-5 shrink-0 text-destructive" aria-hidden /> : item.status !== "queued" ? <Loader2 className="size-5 shrink-0 animate-spin text-signal" aria-hidden /> : <span className="size-5 shrink-0 rounded-full border-2 border-border" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="text-xs text-muted-foreground">{item.detail ?? `${Math.max(1, Math.round(item.file.size / 1024))} KB`}</p></div>
          {item.documentId && item.status === "done" && <Link className="text-xs font-semibold text-signal underline" href={`/app/review/${item.documentId}`}>Review</Link>}
        </li>)}</ul>
        <div className="border-t border-border p-4"><Button size="lg" className="w-full bg-signal text-signal-foreground hover:bg-signal/90" onClick={() => void run()} disabled={running || items.every((item) => item.status === "done")}>{running ? "Processing batch…" : `Process ${items.length} document${items.length === 1 ? "" : "s"}`}</Button></div>
      </div>}
      {complete > 0 && complete === items.length && <section className="rounded-2xl border border-success/35 bg-success/8 p-4">
        <p className="font-bold text-primary">Document set processed</p>
        <p className="mt-1 text-sm text-muted-foreground">Open the connected shipment to review workflow coverage and run the discrepancy check.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {linkedShipmentIds.length === 1
            ? <Link href={`/app/shipments/${linkedShipmentIds[0]}`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white">Open connected check</Link>
            : <Link href="/app/shipments" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white">View grouped shipments</Link>}
          <Link href="/app/workflows" className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-bold text-primary">Choose another workflow</Link>
        </div>
      </section>}
    </div>
  );
}
