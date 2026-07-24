"use client";

// Scan surface (BUILD_SPEC §M6.2): dropzone + camera capture, multi-page
// collector, client compression, upload → parse with a streaming field feed.
// Signed-in: pages go direct to Supabase Storage (spec §1.5), the route gets
// storage paths. Anonymous: up to 3 compressed pages travel inline and the
// result is held in sessionStorage until signup (spec §M2).

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ReviewScreen } from "@/components/review/review-screen";
import { csvTable, docRef } from "@/lib/export/rows";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/lib/validators";
import { TRANSLATION_LANGUAGES } from "@/lib/ai/languages";
import { blobToDataUrl, prepareInlineImage } from "./compress";
import { enhanceDocumentPhoto, type CaptureQuality } from "./document-enhance";
import { ACCEPTED_DOCUMENT_TYPES, fileToPageImages } from "./file-to-pages";
import { readSse } from "./sse";

interface PageItem {
  id: string;
  previewUrl: string;
  blob: Blob;
  sourceName: string;
  quality?: CaptureQuality;
}

interface FeedLine {
  key: string;
  value: string;
}

type Phase = "collect" | "working" | "done" | "error";

interface GuestValidation {
  field?: string;
  rule?: string;
  status?: "pass" | "warn" | "fail";
  message?: string;
}

interface GuestResult {
  extraction?: {
    detected_type?: string;
    fields?: Record<string, unknown>;
  };
  validation?: GuestValidation[];
  qualityScore?: number;
}

const ANON_KEY = "gdx-anon-doc";
const MAX_PAGES_UI = 15;

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 70) || "document";
}

function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const valueText = String(value);
  return /[",\r\n]/.test(valueText)
    ? `"${valueText.replace(/"/g, '""')}"`
    : valueText;
}

function fieldFeedLines(fields: Record<string, unknown>): FeedLine[] {
  const lines: FeedLine[] = [];
  const walk = (value: unknown, key: string, depth: number) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${key}[${i + 1}]`, depth + 1));
      return;
    }
    if (typeof value === "object") {
      if (depth > 2 || key === "_meta") return;
      Object.entries(value as Record<string, unknown>).forEach(([child, item]) =>
        walk(item, key ? `${key}.${child}` : child, depth + 1));
      return;
    }
    const s = String(value);
    if (s !== "") lines.push({ key, value: s.slice(0, 120) });
  };
  for (const [key, value] of Object.entries(fields)) {
    if (key !== "_meta") walk(value, key, 0);
  }
  return lines;
}

export function Scanner({ signedIn, docTypeHint, defaultTargetLanguage = "" }: { signedIn: boolean; docTypeHint?: string; defaultTargetLanguage?: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [phase, setPhase] = useState<Phase>("collect");
  const [status, setStatus] = useState<string>("");
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [error, setError] = useState<string>("");
  const [preparing, setPreparing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const pagesRef = useRef<PageItem[]>([]);
  pagesRef.current = pages;

  useEffect(() => {
    return () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const addFiles = useCallback(async (
    files: FileList | File[],
    options: { camera?: boolean } = {}
  ) => {
    setPreparing(true);
    setError("");
    try {
      for (const file of [...files]) {
        const remaining = MAX_PAGES_UI - pagesRef.current.length;
        if (remaining <= 0) {
          setError(`Only the first ${MAX_PAGES_UI} pages were added.`);
          break;
        }
        try {
          const { blobs, truncated } = await fileToPageImages(file, remaining);
          const items: PageItem[] = [];
          for (const original of blobs) {
            let blob = original;
            let quality: CaptureQuality | undefined;
            if (options.camera) {
              try {
                const enhanced = await enhanceDocumentPhoto(original);
                blob = enhanced.blob;
                quality = enhanced.quality;
              } catch {
                quality = {
                  glare: false,
                  glarePercent: 0,
                  edgeConfidence: 0,
                  corrected: false,
                  corners: null,
                  warnings: ["Automatic scan cleanup was unavailable; the original photo was kept."],
                };
              }
            }
            items.push({
              id: crypto.randomUUID(),
              previewUrl: URL.createObjectURL(blob),
              blob,
              sourceName: file.name,
              quality,
            });
          }
          setPages((prev) => [...prev, ...items]);
          pagesRef.current = [...pagesRef.current, ...items];
          if (truncated) {
            setError(`${file.name}: only the first ${remaining} pages were added (15-page limit).`);
          }
        } catch (fileError) {
          setError(fileError instanceof Error ? fileError.message : `Could not read ${file.name}`);
        }
      }
    } finally {
      setPreparing(false);
    }
  }, []);

  const removePage = (id: string) =>
    setPages((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((p) => p.id !== id);
    });

  async function parse() {
    if (pages.length === 0) return;
    setPhase("working");
    setError("");
    setFeed([]);
    setStatus("preparing pages");

    try {
      let body: Record<string, unknown>;
      let docId: string | null = null;

      if (signedIn) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("session expired — sign in again");

        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({ owner: user.id, status: "uploaded", page_count: pages.length })
          .select("id")
          .single();
        if (docErr || !doc) throw new Error("could not create the document");
        docId = doc.id as string;

        setStatus("uploading pages");
        const paths: string[] = [];
        for (let i = 0; i < pages.length; i++) {
          const path = `${user.id}/${docId}/page-${i + 1}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("docs")
            .upload(path, pages[i].blob, { contentType: "image/jpeg", upsert: true });
          if (upErr) throw new Error(`upload failed on page ${i + 1}`);
          paths.push(path);
        }
        await supabase
          .from("documents")
          .update({ storage_path: `${user.id}/${docId}` })
          .eq("id", docId);
        body = {
          pages: paths.map((p) => ({ storagePath: p })),
          docId,
          docTypeHint,
          targetLanguage: targetLanguage || undefined,
        };
      } else {
        if (pages.length > 3) {
          throw new Error("anonymous parsing is limited to 3 pages — sign in for up to 15");
        }
        setStatus("preparing high-resolution pages");
        const inlinePages = await Promise.all(
          pages.map((page) => prepareInlineImage(page.blob))
        );
        const dataUrls = await Promise.all(inlinePages.map(blobToDataUrl));
        body = {
          pages: dataUrls.map((d) => ({ dataUrl: d })),
          docTypeHint,
          targetLanguage: targetLanguage || undefined,
        };
      }

      setStatus("contacting the parser");
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          error?: string;
          reference?: string;
        } | null;
        const reference = j?.reference ? ` Reference: ${j.reference}` : "";
        throw new Error(`${j?.error ?? "We couldn't start reading this document."}${reference}`);
      }
      if (!signedIn) {
        const remaining = Number.parseInt(res.headers.get("X-Guest-Remaining") ?? "", 10);
        if (Number.isInteger(remaining)) setGuestRemaining(remaining);
      }

      for await (const { event, data } of readSse(res)) {
        if (event === "status") {
          const d = data as { state?: string };
          if (d.state) setStatus(d.state);
        } else if (event === "fields") {
          const d = data as { fields?: Record<string, unknown> };
          if (d.fields) setFeed(fieldFeedLines(d.fields));
        } else if (event === "done") {
          const d = data as Record<string, unknown>;
          if (signedIn && docId) {
            router.push(`/app/review/${docId}`);
            return;
          }
          sessionStorage.setItem(ANON_KEY, JSON.stringify(d));
          setPhase("done");
          return;
        } else if (event === "error") {
          const d = data as { message?: string; reference?: string };
          const reference = d.reference ? ` Reference: ${d.reference}` : "";
          throw new Error(`${d.message ?? "We couldn't finish reading this document."}${reference}`);
        }
      }
      throw new Error("stream ended unexpectedly");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }

  if (phase === "done") {
    // Anonymous result: useful immediately, held locally until the tab closes.
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(ANON_KEY) : null;
    let parsedDoc: GuestResult | null = null;
    try {
      parsedDoc = stored ? (JSON.parse(stored) as GuestResult) : null;
    } catch {
      parsedDoc = null;
    }
    if (parsedDoc?.extraction?.fields) {
      const restart = () => {
        pagesRef.current.forEach((page) => URL.revokeObjectURL(page.previewUrl));
        pagesRef.current = [];
        setPages([]);
        setFeed([]);
        setStatus("");
        setError("");
        sessionStorage.removeItem(ANON_KEY);
        setPhase("collect");
      };
      return (
        <ReviewScreen
          guest
          guestRemaining={guestRemaining}
          docId="guest"
          docType={parsedDoc.extraction.detected_type ?? "other"}
          fields={parsedDoc.extraction.fields}
          validation={(parsedDoc.validation ?? []) as ValidationResult[]}
          pageUrls={pages.map((page) => page.previewUrl)}
          shipmentId={null}
          shipments={[]}
          shareToken={null}
          qualityScore={parsedDoc.qualityScore ?? null}
          onGuestStartOver={restart}
          onGuestFieldsChange={(nextFields, nextValidation) => {
            const next = {
              ...parsedDoc,
              extraction: { ...parsedDoc.extraction, fields: nextFields },
              validation: nextValidation,
            };
            sessionStorage.setItem(ANON_KEY, JSON.stringify(next));
          }}
        />
      );
    }
    const fields = parsedDoc?.extraction?.fields ?? {};
    const docType = parsedDoc?.extraction?.detected_type ?? "document";
    const validations = parsedDoc?.validation ?? [];
    const failCount = validations.filter((v) => v.status === "fail").length;
    const warnCount = validations.filter((v) => v.status === "warn").length;
    const fieldLines = fieldFeedLines(fields);
    const baseName = safeFilename(docRef(fields) ?? docType);

    const exportCsv = () => {
      const csv = csvTable(docType, fields)
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");
      downloadText(`${baseName}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    };
    const exportJson = () => {
      const payload = {
        documentType: docType,
        fields,
        validation: validations,
        extractionCoverage: parsedDoc?.qualityScore ?? null,
      };
      downloadText(
        `${baseName}.json`,
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
      );
    };
    const parseAnother = () => {
      pagesRef.current.forEach((page) => URL.revokeObjectURL(page.previewUrl));
      pagesRef.current = [];
      setPages([]);
      setFeed([]);
      setStatus("");
      setError("");
      sessionStorage.removeItem(ANON_KEY);
      setPhase("collect");
    };

    return (
      <div className="space-y-5 pb-8">
        <div className="overflow-hidden rounded-3xl border border-success/35 bg-gradient-to-br from-success/12 via-card to-card shadow-[0_24px_70px_-45px_rgba(0,120,90,0.8)]">
          <div className="flex items-start gap-3 p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Document ready</p>
              <h2 className="mt-1 text-xl font-bold capitalize text-primary sm:text-2xl">
                {docType.replace(/_/g, " ")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {fieldLines.length} extracted value{fieldLines.length === 1 ? "" : "s"}. Review important shipment details before using them operationally.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border/70 bg-background/55 text-center">
            <div className="px-2 py-3">
              <p className="text-lg font-bold text-primary">{parsedDoc?.qualityScore ?? "—"}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Coverage</p>
            </div>
            <div className="border-x border-border/70 px-2 py-3">
              <p className="text-lg font-bold text-destructive">{failCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Failed checks</p>
            </div>
            <div className="px-2 py-3">
              <p className="text-lg font-bold text-warn">{warnCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Warnings</p>
            </div>
          </div>
        </div>

        <section aria-labelledby="next-steps-heading" className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Recommended workflow</p>
            <h3 id="next-steps-heading" className="mt-1 text-lg font-bold text-primary">What to do next</h3>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Review", "Verify the B/L number, parties, route, quantities and container numbers."],
              ["2", "Resolve checks", failCount || warnCount ? "Inspect the flagged values before export." : "No contradiction was found; still verify critical values."],
              ["3", "Export or save", "Download now, or sign in to edit, compare and keep a history."],
            ].map(([number, title, description]) => (
              <li key={number} className="rounded-2xl border border-border bg-card p-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{number}</span>
                <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        {(failCount > 0 || warnCount > 0) && (
          <section className="rounded-2xl border border-warn/35 bg-warn/10 p-4" aria-labelledby="checks-heading">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warn" aria-hidden />
              <h3 id="checks-heading" className="text-sm font-semibold text-foreground">Values needing attention</h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {validations.filter((item) => item.status !== "pass").slice(0, 6).map((item, index) => (
                <li key={`${item.rule ?? item.field ?? "check"}-${index}`} className="rounded-xl bg-background/70 px-3 py-2">
                  <span className="font-medium text-foreground">{item.field?.replace(/_/g, " ") || "Document check"}: </span>
                  {item.message || "Review this extracted value."}
                </li>
              ))}
            </ul>
          </section>
        )}

        <details open className="rounded-2xl border border-border bg-card">
          <summary className="cursor-pointer list-none px-4 py-4 text-sm font-semibold text-primary marker:hidden">
            Extracted data <span className="ml-1 font-normal text-muted-foreground">({fieldLines.length} values)</span>
          </summary>
          <ul className="max-h-[32rem] overflow-y-auto border-t border-border px-4">
            {fieldLines.map((line) => (
              <li key={line.key} className="grid gap-1 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[minmax(9rem,0.7fr)_1.3fr] sm:gap-4">
                <span className="text-xs capitalize text-muted-foreground">{line.key.replace(/[._]/g, " ")}</span>
                <span className="break-words text-sm font-medium text-foreground">{line.value}</span>
              </li>
            ))}
          </ul>
        </details>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="export-heading">
          <div className="flex items-center gap-2">
            <Download className="size-4 text-signal" aria-hidden />
            <h3 id="export-heading" className="text-sm font-semibold text-primary">Export this result</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Downloads are available now—no account required.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button type="button" size="lg" onClick={exportCsv} className="w-full">
              <FileSpreadsheet aria-hidden /> Download CSV
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={exportJson} className="w-full">
              <FileJson aria-hidden /> Download JSON
            </Button>
          </div>
        </section>

        <div className="rounded-2xl border border-signal/25 bg-secondary/70 p-4 text-sm">
          <p className="font-semibold text-primary">
            {guestRemaining === null
              ? "Keep working with this document"
              : guestRemaining > 0
                ? `${guestRemaining} free guest parse${guestRemaining === 1 ? "" : "s"} left today`
                : "You've used today's guest allowance"}
          </p>
          <p className="mt-1 leading-6 text-muted-foreground">
            You received the complete single-document analysis and downloads without an account. Sign in only when you want to save, edit or compare documents across a shipment.
          </p>
          <Button render={<Link href="/auth/sign-up" />} size="lg" className="mt-4 w-full">
            Sign in to save and review
          </Button>
        </div>
        <Button type="button" variant="ghost" size="lg" className="w-full" onClick={parseAnother}>
          <RotateCcw aria-hidden /> Parse another document
        </Button>
      </div>
    );
  }

  if (phase === "working") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Loader2 className="size-5 animate-spin text-signal" aria-hidden />
          <div>
            <p className="text-sm font-semibold capitalize">{status.replace(/[_-]/g, " ")}</p>
            <p className="text-xs text-muted-foreground">
              Usually 15–30 seconds per page. Keep this tab open.
            </p>
          </div>
        </div>
        {feed.length > 0 && (
          <ul aria-live="polite" className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
            {feed.map((l) => (
              <li key={l.key} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{l.key.replace(/_/g, " ")}</span>
                <span className="truncate font-medium">{l.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-5 rounded-[1.75rem] border-2 border-dashed px-5 py-9 text-center shadow-[0_18px_55px_-38px_rgba(1,59,179,0.7)] transition-all sm:px-8 lg:min-h-[28rem] lg:justify-center lg:px-12 lg:py-14",
          dragOver ? "border-signal bg-accent" : "border-input bg-card hover:border-primary/60"
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm lg:size-20 lg:rounded-3xl">
          <FileText className="size-8 lg:size-10" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-xl font-bold text-primary lg:text-2xl">Add {docTypeHint ? docTypeHint.replace(/_/g, " ") : "document"} pages</p>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
            Drop a PDF or document scan here. Multi-page PDF and TIFF files are split into pages,
            and everything is prepared on your device before upload.
          </p>
        </div>
        <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row lg:max-w-sm">
          <label
            htmlFor="document-files"
            aria-disabled={preparing}
            className={buttonVariants({
              size: "lg",
              className: "min-h-14 flex-1 cursor-pointer px-7 text-base shadow-md lg:min-h-12",
            })}
          >
            {preparing ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-6" aria-hidden />
            )}
            {preparing ? "Preparing document…" : "Choose files or PDF"}
          </label>
          <label
            htmlFor="camera-image"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "min-h-14 flex-1 cursor-pointer px-7 text-base shadow-sm sm:hidden",
            })}
          >
            <Camera className="size-6" aria-hidden /> Take a photo
          </label>
        </div>
        <input
          id="document-files"
          type="file"
          accept={ACCEPTED_DOCUMENT_TYPES}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          id="camera-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only sm:hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files, { camera: true });
            e.target.value = "";
          }}
        />
        <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
          Supported: PDF, JPG/JPEG, PNG, WebP, BMP and multi-page TIFF. HEIC/HEIF works when
          your device can decode it; otherwise export it as JPG. Save Word or Excel files as PDF first.
          <span className="sm:hidden"> On a phone, <span className="font-semibold text-foreground">Take a photo</span> opens the rear camera.</span>
          <span className="mt-1 block font-medium text-foreground">Camera photos are checked for glare, cropped to detected page edges and perspective-corrected on this device before upload.</span>
        </p>
      </div>

      {pages.length > 0 && (
        <>
          {pages.some((page) => page.quality?.warnings.length) && (
            <div role="status" className="rounded-2xl border border-warn/35 bg-warn/10 px-4 py-3 text-sm text-foreground">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4 text-warn" aria-hidden />
                Check capture quality before parsing
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {pages.flatMap((page, index) =>
                  (page.quality?.warnings ?? []).map((warning) => (
                    <li key={`${page.id}-${warning}`}>Page {index + 1}: {warning}</li>
                  ))
                )}
              </ul>
            </div>
          )}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {pages.map((p, i) => (
              <li key={p.id} className="relative">
                <Image
                  src={p.previewUrl}
                  alt={`Page ${i + 1}`}
                  width={200}
                  height={280}
                  unoptimized
                  className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                />
                <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {i + 1}
                </span>
                {p.quality?.corrected && (
                  <span className="absolute bottom-1 right-1 rounded bg-success/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    corrected
                  </span>
                )}
                {p.quality?.glare && (
                  <span className="absolute left-1 top-1 rounded bg-warn px-1.5 py-0.5 text-[9px] font-bold text-white">
                    glare
                  </span>
                )}
                <span className="sr-only">Source file: {p.sourceName}</span>
                <button
                  type="button"
                  aria-label={`Remove page ${i + 1}`}
                  onClick={() => removePage(p.id)}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-destructive"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="text-sm font-semibold text-foreground">
              Translate extracted text
              <select
                value={targetLanguage}
                onChange={(event) => setTargetLanguage(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring"
              >
                {TRANSLATION_LANGUAGES.map(([code, name]) => (
                  <option key={code || "original"} value={code}>{name}</option>
                ))}
              </select>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Originals are always preserved. Bilingual values are shown side by side.
              </span>
            </label>
            <label
              htmlFor="camera-image"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 cursor-pointer sm:hidden",
              })}
            >
              <Camera className="size-4" aria-hidden /> Capture next page
            </label>
          </div>
          <Button
              size="lg"
              className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
              onClick={() => void parse()}
            >
              Parse {pages.length} page{pages.length > 1 ? "s" : ""}
            </Button>
          {!signedIn && (
            <p className="text-center text-xs text-muted-foreground">
              Review, correct and export 1 complete document per day without an account (up to 3 pages).
              <Link href="/auth/login" className="ml-1 underline">
                Sign in
              </Link>{" "}
              for 20 documents per month, saved history, comparisons and up to 15 pages per document.
            </p>
          )}
        </>
      )}
    </div>
  );
}
