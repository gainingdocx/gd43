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
import { Camera, FileText, Loader2, Upload, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { blobToDataUrl } from "./compress";
import { ACCEPTED_DOCUMENT_TYPES, fileToPageImages } from "./file-to-pages";
import { readSse } from "./sse";

interface PageItem {
  id: string;
  previewUrl: string;
  blob: Blob;
  sourceName: string;
}

interface FeedLine {
  key: string;
  value: string;
}

type Phase = "collect" | "working" | "done" | "error";

const ANON_KEY = "gdx-anon-doc";
const MAX_PAGES_UI = 15;

function fieldFeedLines(fields: Record<string, unknown>): FeedLine[] {
  const lines: FeedLine[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") {
      const name = (value as { name?: unknown }).name;
      if (typeof name === "string" && name) lines.push({ key, value: name });
      else if (Array.isArray(value) && value.length > 0)
        lines.push({ key, value: `${value.length} row${value.length > 1 ? "s" : ""}` });
      continue;
    }
    const s = String(value);
    if (s !== "") lines.push({ key, value: s.slice(0, 80) });
  }
  return lines;
}

export function Scanner({ signedIn, docTypeHint }: { signedIn: boolean; docTypeHint?: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [phase, setPhase] = useState<Phase>("collect");
  const [status, setStatus] = useState<string>("");
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [error, setError] = useState<string>("");
  const [preparing, setPreparing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const pagesRef = useRef<PageItem[]>([]);
  pagesRef.current = pages;

  useEffect(() => {
    return () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
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
          const items: PageItem[] = blobs.map((blob) => ({
            id: crypto.randomUUID(),
            previewUrl: URL.createObjectURL(blob),
            blob,
            sourceName: file.name,
          }));
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
        body = { pages: paths.map((p) => ({ storagePath: p })), docId, docTypeHint };
      } else {
        if (pages.length > 3) {
          throw new Error("anonymous parsing is limited to 3 pages — sign in for up to 15");
        }
        setStatus("encoding pages");
        const dataUrls = await Promise.all(pages.map((p) => blobToDataUrl(p.blob)));
        body = { pages: dataUrls.map((d) => ({ dataUrl: d })), docTypeHint };
      }

      setStatus("contacting the parser");
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `parse request failed (${res.status})`);
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
          const d = data as { message?: string };
          throw new Error(d.message ?? "parsing failed");
        }
      }
      throw new Error("stream ended unexpectedly");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }

  if (phase === "done") {
    // Anonymous result: parsed, held locally until signup.
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(ANON_KEY) : null;
    const parsedDoc = stored ? (JSON.parse(stored) as { extraction?: { detected_type?: string; fields?: Record<string, unknown> }; validation?: unknown[] }) : null;
    const fields = parsedDoc?.extraction?.fields ?? {};
    const failCount = (parsedDoc?.validation as { status?: string }[] | undefined)?.filter((v) => v.status === "fail").length ?? 0;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
          <p className="font-semibold text-success">
            Parsed — {String(parsedDoc?.extraction?.detected_type ?? "document").replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {failCount > 0
              ? `${failCount} deterministic check${failCount > 1 ? "s" : ""} failed — sign in to review and fix.`
              : "Deterministic checks look clean."}
          </p>
        </div>
        <ul className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
          {fieldFeedLines(fields).slice(0, 12).map((l) => (
            <li key={l.key} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{l.key.replace(/_/g, " ")}</span>
              <span className="truncate font-medium">{l.value}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This result is held in your browser only. Create a free account to
          save it, see every field, and run cross-document checks.
        </div>
        <Button render={<Link href="/app/account" />} size="lg" className="w-full">
          Sign in to keep this document
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
    <div className="space-y-4">
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
          "flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-6 py-12 text-center shadow-[0_18px_55px_-38px_rgba(1,59,179,0.7)] transition-all",
          dragOver ? "border-signal bg-accent" : "border-input bg-card hover:border-primary/60"
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-signal">
          <FileText className="size-8" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-bold text-primary">Add {docTypeHint ? docTypeHint.replace(/_/g, " ") : "document"} pages</p>
          <p className="text-sm text-muted-foreground">
            Drop a PDF or document scan here. Multi-page PDF and TIFF files are split into pages,
            and everything is prepared on your device before upload.
          </p>
        </div>
        <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <label
            htmlFor="document-files"
            aria-disabled={preparing}
            className={buttonVariants({
              size: "lg",
              className: "min-h-16 flex-1 cursor-pointer px-7 text-base shadow-md",
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
              className: "min-h-16 flex-1 cursor-pointer px-7 text-base shadow-sm",
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
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
          Supported: PDF, JPG/JPEG, PNG, WebP, BMP and multi-page TIFF. HEIC/HEIF works when
          your device can decode it; otherwise export it as JPG. Save Word or Excel files as PDF first.
          On a phone,
          <span className="font-semibold text-foreground"> Take a photo</span> opens the rear camera.
        </p>
      </div>

      {pages.length > 0 && (
        <>
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
          <Button
            size="lg"
            className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
            onClick={() => void parse()}
          >
            Parse {pages.length} page{pages.length > 1 ? "s" : ""}
          </Button>
          {!signedIn && (
            <p className="text-center text-xs text-muted-foreground">
              You can try one document without an account (up to 3 pages).
              <Link href="/app/account" className="ml-1 underline">
                Sign in
              </Link>{" "}
              to save documents and parse up to 15 pages.
            </p>
          )}
        </>
      )}
    </div>
  );
}
