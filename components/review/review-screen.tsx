"use client";

// Trust Screen (BUILD_SPEC §M6.3): every extracted field as a card with a
// deterministic state chip (✅ pass / 🟡 flagged / ⚪ empty), the source-page
// thumbnail when page_refs point at one, and inline edit that audits to
// events. Mobile: single column, thumbnails strip on top. Desktop:
// side-by-side pages | fields.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Eye,
  FileDown,
  FilePlus2,
  ListChecks,
  Minus,
  Pencil,
  Plus,
  Ship,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { csvTable, docRef } from "@/lib/export/rows";
import { integrationExport, type IntegrationProfile } from "@/lib/export/integrations";
import { coerceEdit, flattenFields, getPath, setPath } from "@/lib/fields/display";
import { generatableTypes } from "@/lib/generate/map";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { validateDocument, type ValidationResult } from "@/lib/validators";

interface ShipmentOption {
  id: string;
  bl_number: string | null;
  ref: string | null;
}

interface Props {
  docId: string;
  docType: string;
  fields: Record<string, unknown>;
  validation: ValidationResult[];
  pageUrls: string[];
  shipmentId: string | null;
  shipments: ShipmentOption[];
  shareToken: string | null;
  qualityScore: number | null;
  guest?: boolean;
  guestRemaining?: number | null;
  onGuestFieldsChange?: (fields: Record<string, unknown>, validation: ValidationResult[]) => void;
  onGuestStartOver?: () => void;
}

const EXPORT_FORMATS = [
  ["xlsx", "Excel (.xlsx)"],
  ["csv", "CSV"],
  ["json", "JSON"],
  ["pdf", "PDF summary report"],
  ["canonical_xml", "Canonical XML"],
  ["cargowise_xml", "CargoWise XML mapping"],
  ["sap_tm", "SAP TM mapping (JSON)"],
  ["magaya", "Magaya mapping (JSON)"],
  ["flexport", "Flexport mapping (JSON)"],
] as const;

const GEN_LABEL: Record<string, string> = {
  packing_list: "Packing list",
  sea_waybill: "Sea waybill",
  arrival_notice: "Arrival notice",
  booking_confirmation: "Booking confirmation",
  commercial_invoice: "Commercial invoice",
  shipping_instructions: "Shipping instructions",
};

function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 70) || "document";
}

function downloadBlob(filename: string, body: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading",
  sea_waybill: "Sea Waybill",
  commercial_invoice: "Commercial Invoice",
  purchase_order: "Purchase Order",
  freight_invoice: "Freight Invoice",
  goods_receipt: "Goods Receipt",
  packing_list: "Packing List",
  arrival_notice: "Arrival Notice",
  booking_confirmation: "Booking Confirmation",
  air_waybill: "Air Waybill",
  other: "Document",
};

function chipFor(value: string, results: ValidationResult[]) {
  if (results.some((r) => r.status === "fail"))
    return { icon: CircleAlert, cls: "text-destructive", label: "check failed" };
  if (results.some((r) => r.status === "warn"))
    return { icon: CircleAlert, cls: "text-warn", label: "check warning" };
  if (value === "")
    return { icon: CircleDashed, cls: "text-muted-foreground", label: "not on document" };
  if (results.length > 0)
    return { icon: CircleCheck, cls: "text-success", label: "verified" };
  return { icon: CircleCheck, cls: "text-muted-foreground/60", label: "extracted" };
}

export function ReviewScreen(props: Props) {
  const router = useRouter();
  const [fields, setFields] = useState(props.fields);
  const [validation, setValidation] = useState(props.validation);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState<null | "export" | "generate" | "shipment">(null);
  const [shareToken, setShareToken] = useState(props.shareToken);
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [mobilePanel, setMobilePanel] = useState<"source" | "fields">("fields");
  const [fieldFilter, setFieldFilter] = useState<"all" | "attention" | "empty">("all");

  const rows = useMemo(() => flattenFields(props.docType, fields), [props.docType, fields]);
  const meta = fields._meta && typeof fields._meta === "object"
    ? fields._meta as {
        source_languages?: string[];
        translation?: {
          target_language_name?: string;
          translated_fields?: Record<string, string>;
        };
      }
    : null;
  const translations = meta?.translation?.translated_fields ?? {};
  const byField = useMemo(() => {
    const map = new Map<string, ValidationResult[]>();
    for (const v of validation) {
      const key = v.field.replace(/\.(name|unlocode)$/, "");
      for (const k of [v.field, key]) {
        const list = map.get(k) ?? [];
        if (!list.includes(v)) list.push(v);
        map.set(k, list);
      }
    }
    return map;
  }, [validation]);

  const failCount = validation.filter((v) => v.status === "fail").length;
  const attentionCount = validation.filter((v) => v.status === "fail" || v.status === "warn").length;
  const filledCount = rows.filter((row) => row.value !== "").length;
  const filteredRows = useMemo(
    () => rows.filter((row) => {
      if (fieldFilter === "empty") return row.value === "";
      if (fieldFilter === "attention") {
        return (byField.get(row.path) ?? []).some((result) => result.status !== "pass");
      }
      return true;
    }),
    [byField, fieldFilter, rows]
  );

  function note(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function saveEdit(path: string) {
    const oldValue = getPath(fields, path) ?? null;
    const newValue = coerceEdit(oldValue, draft);
    if (newValue === oldValue) {
      setEditing(null);
      return;
    }
    setSaving(true);
    const next = setPath(fields, path, newValue);
    if (props.guest) {
      const nextValidation = validateDocument({
        detected_type: props.docType,
        fields: next,
      } as unknown as NormalizedExtraction);
      setFields(next);
      setValidation(nextValidation);
      props.onGuestFieldsChange?.(next, nextValidation);
      note("Saved in this browser tab");
      setSaving(false);
      setEditing(null);
      return;
    }
    const response = await fetch(`/api/documents/${props.docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: next, path, oldValue, newValue }),
    });
    if (!response.ok) {
      note("Could not save — try again");
    } else {
      const saved = (await response.json()) as {
        fields: Record<string, unknown>;
        validation: ValidationResult[];
      };
      setFields(saved.fields);
      setValidation(saved.validation);
      note("Saved");
      router.refresh();
    }
    setSaving(false);
    setEditing(null);
  }

  async function exportGuest(format: (typeof EXPORT_FORMATS)[number][0]) {
    const base = safeFilename(docRef(fields) ?? props.docType);
    if (format === "json") {
      downloadBlob(`${base}.json`, JSON.stringify(fields, null, 2), "application/json;charset=utf-8");
    } else if (format === "csv") {
      const csv = csvTable(props.docType, fields).map((row) => row.map(csvCell).join(",")).join("\r\n");
      downloadBlob(`${base}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    } else if (format === "xlsx") {
      const { buildWorkbook } = await import("@/lib/export/xlsx");
      const workbook = await buildWorkbook(props.docType, fields);
      downloadBlob(`${base}.xlsx`, workbook, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } else if (format === "pdf") {
      const { summaryReportPdf } = await import("@/lib/export/pdf");
      const pdf = await summaryReportPdf({ docType: props.docType, fields, validation, shareUrl: null });
      downloadBlob(`${base}.pdf`, pdf as unknown as BlobPart, "application/pdf");
    } else {
      const integration = integrationExport(format as IntegrationProfile, props.docType, fields);
      downloadBlob(`${base}-${format}.${integration.extension}`, integration.body, integration.mime);
    }
    note(`${format.toUpperCase()} downloaded`);
  }

  async function attachShipment(shipmentId: string | null) {
    const supabase = createClient();
    let target = shipmentId;
    if (target === "new") {
      const bl =
        props.docType === "bill_of_lading"
          ? ((getPath(fields, "bl_number") as string | null) ?? null)
          : null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: created } = await supabase
        .from("shipments")
        .insert({ owner: user.id, bl_number: bl })
        .select("id")
        .single();
      target = created?.id ?? null;
    }
    const { error } = await supabase
      .from("documents")
      .update({ shipment_id: target })
      .eq("id", props.docId);
    note(error ? "Could not update shipment" : "Shipment updated");
    setMenu(null);
    router.refresh();
  }

  async function setShare(token: string | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ share_token: token })
      .eq("id", props.docId);
    if (error) {
      note("Could not update the share link");
      return;
    }
    setShareToken(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("events").insert({
        owner: user.id,
        type: token ? "share_created" : "share_revoked",
        payload: { document_id: props.docId },
      });
    }
    note(token ? "Share link created" : "Share link revoked");
  }

  async function copyShare() {
    if (!shareToken) return;
    await navigator.clipboard.writeText(`${location.origin}/share/${shareToken}`);
    note("Link copied");
  }

  function showSource(page: number | null) {
    if (page !== null && props.pageUrls.length > 0) {
      setActivePage(Math.min(Math.max(page - 1, 0), props.pageUrls.length - 1));
    }
    setMobilePanel("source");
  }

  const sourceViewer = (
    <section aria-label="Original document" className="overflow-hidden rounded-2xl border border-border bg-[#e9eef7] shadow-sm lg:sticky lg:top-6">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-white px-3 sm:px-4">
        <div>
          <p className="text-sm font-bold text-primary">Original document</p>
          <p className="text-[0.68rem] text-muted-foreground">
            {props.pageUrls.length > 0 ? `Page ${activePage + 1} of ${props.pageUrls.length}` : "Source unavailable"}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <button type="button" aria-label="Zoom out" disabled={zoom <= 70} onClick={() => setZoom((value) => Math.max(70, value - 15))} className="flex size-9 items-center justify-center rounded-md hover:bg-white disabled:opacity-35">
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-10 text-center text-xs font-semibold tabular-nums">{zoom}%</span>
          <button type="button" aria-label="Zoom in" disabled={zoom >= 175} onClick={() => setZoom((value) => Math.min(175, value + 15))} className="flex size-9 items-center justify-center rounded-md hover:bg-white disabled:opacity-35">
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      {props.pageUrls.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center px-6 text-center text-sm text-muted-foreground lg:h-[calc(100vh-12rem)]">
          The original page image is unavailable for this document.
        </div>
      ) : (
        <>
          <div className="flex h-[62vh] min-h-[28rem] items-start justify-center overflow-auto p-3 lg:h-[calc(100vh-12rem)] lg:min-h-[36rem]">
            <a href={props.pageUrls[activePage]} target="_blank" rel="noreferrer" className="block w-full shrink-0" aria-label={`Open page ${activePage + 1} in a new tab`}>
              <Image
                src={props.pageUrls[activePage]}
                alt={`Original document, page ${activePage + 1}`}
                width={1100}
                height={1500}
                unoptimized
                style={{ width: `${zoom}%`, maxWidth: "none", height: "auto" }}
                className="block rounded-md bg-white shadow-xl"
              />
            </a>
          </div>
          {props.pageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-border bg-white p-2">
              {props.pageUrls.map((url, index) => (
                <button key={url} type="button" onClick={() => setActivePage(index)} aria-label={`Show page ${index + 1}`} aria-current={activePage === index ? "page" : undefined} className={cn("shrink-0 rounded-lg border-2 p-0.5", activePage === index ? "border-primary" : "border-transparent")}>
                  <Image src={url} alt="" width={48} height={64} unoptimized className="h-14 w-10 rounded object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );

  return (
    <div data-wide className="space-y-5 pb-20 lg:pb-16">
      {props.guest ? (
        <button type="button" onClick={props.onGuestStartOver} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Parse another document
        </button>
      ) : (
        <Link href="/app" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Documents
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            {TYPE_LABEL[props.docType] ?? "Document"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {failCount > 0 ? (
              <span className="font-medium text-destructive">
                {failCount} deterministic check{failCount > 1 ? "s" : ""} failed
              </span>
            ) : (
              "No deterministic contradictions found"
            )}
          </p>
          {props.qualityScore !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Extraction coverage {props.qualityScore}/100 — completeness indicator, not a confidence probability
            </p>
          )}
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {filledCount} of {rows.length} fields populated · {attentionCount} need attention
          </p>
        </div>
        {props.shipmentId && (
          <Link
            href={`/app/shipments/${props.shipmentId}`}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            <Ship className="size-3.5" aria-hidden /> Shipment
            <ChevronRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>

      {props.guest && (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <p className="font-semibold text-primary">Complete guest review</p>
          <p className="mt-1 text-muted-foreground">
            Correct any field and export Excel, CSV, JSON or PDF now. Your edits remain in this browser tab; a free account saves them and includes 20 documents per month.
          </p>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 rounded-xl border border-border bg-white p-1 lg:hidden" role="tablist" aria-label="Review mode">
        <button type="button" role="tab" aria-selected={mobilePanel === "source"} onClick={() => setMobilePanel("source")} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold", mobilePanel === "source" ? "bg-primary text-white" : "text-muted-foreground")}>
          <Eye className="size-4" aria-hidden /> Original
        </button>
        <button type="button" role="tab" aria-selected={mobilePanel === "fields"} onClick={() => setMobilePanel("fields")} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold", mobilePanel === "fields" ? "bg-primary text-white" : "text-muted-foreground")}>
          <ListChecks className="size-4" aria-hidden /> Fields
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-6">
        <div className={cn(mobilePanel === "source" ? "block" : "hidden", "lg:block")}>{sourceViewer}</div>

        <section className={cn(mobilePanel === "fields" ? "block" : "hidden", "lg:block")} aria-label="Extracted fields">
          <div className="mb-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-primary">Extracted data</p>
                <p className="text-xs text-muted-foreground">Edit any value, then save. New exports always use the saved values.</p>
              </div>
              <div className="flex gap-1 rounded-lg bg-muted p-1" aria-label="Filter fields">
                {(["all", "attention", "empty"] as const).map((filter) => (
                  <button key={filter} type="button" onClick={() => setFieldFilter(filter)} aria-pressed={fieldFilter === filter} className={cn("min-h-9 rounded-md px-2.5 text-xs font-semibold capitalize", fieldFilter === filter ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}>
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        <ul className="space-y-2">
          {filteredRows.map((row) => {
            const results = byField.get(row.path) ?? [];
            const chip = chipFor(row.value, results);
            const ChipIcon = chip.icon;
            const isEditing = editing === row.path;
            return (
              <li key={row.path} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_10px_35px_-30px_rgba(1,59,179,0.7)] transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <ChipIcon className={cn("size-3.5", chip.cls)} aria-label={chip.label} />
                      {row.label}
                      {row.page !== null && (
                        <button type="button" onClick={() => showSource(row.page)} className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold normal-case text-primary hover:bg-secondary" aria-label={`Show source on page ${row.page}`}>
                          source p.{row.page}
                        </button>
                      )}
                    </p>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveEdit(row.path);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                      />
                    ) : (
                      <>
                        <p className={cn("mt-0.5 break-words text-sm", row.value === "" ? "italic text-muted-foreground" : "font-medium")}>
                          {row.value === "" ? "—" : row.value}
                        </p>
                        {translations[row.path] && translations[row.path] !== row.value && (
                          <p
                            lang={meta?.translation?.target_language_name}
                            className="mt-1 break-words rounded-lg bg-accent/70 px-2.5 py-1.5 text-sm text-primary"
                          >
                            <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              {meta?.translation?.target_language_name ?? "Translation"}
                            </span>
                            {translations[row.path]}
                          </p>
                        )}
                      </>
                    )}
                    {results
                      .filter((r) => r.status !== "pass")
                      .slice(0, 1)
                      .map((r) => (
                        <p key={r.rule} className={cn("mt-1 text-xs", r.status === "fail" ? "text-destructive" : "text-warn")}>
                          {r.message}
                        </p>
                      ))}
                  </div>
                  {row.editable && (
                    <div className="flex shrink-0 gap-1">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            aria-label="Save"
                            disabled={saving}
                            onClick={() => void saveEdit(row.path)}
                            className="flex size-9 items-center justify-center rounded-md bg-success/15 text-success hover:bg-success/25"
                          >
                            <Check className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel"
                            onClick={() => setEditing(null)}
                            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Edit ${row.label}`}
                          onClick={() => {
                            setEditing(row.path);
                            setDraft(row.value);
                          }}
                          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {filteredRows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">No fields match this filter.</div>
        )}
        </section>
      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_-28px_rgba(1,59,179,0.7)] backdrop-blur lg:bottom-0 lg:left-[17rem]">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-2 lg:max-w-4xl">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setMenu(menu === "export" ? null : "export")}
          >
            <FileDown className="size-4" aria-hidden /> Export
          </Button>
          {props.guest ? (
            <Button render={<Link href="/auth/sign-up" />} className="flex-1">
              Save free · 20/month
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMenu(menu === "generate" ? null : "generate")}
              >
                <FilePlus2 className="size-4" aria-hidden /> Generate
              </Button>
              <Button className="flex-1" onClick={() => setMenu(menu === "shipment" ? null : "shipment")}>
                <Ship className="size-4" aria-hidden /> Shipment
              </Button>
            </>
          )}
        </div>

        {menu === "export" && (
          <div className="mx-auto max-w-lg space-y-1 px-4 pb-3 lg:max-w-4xl">
            {EXPORT_FORMATS.map(([format, label]) => props.guest ? (
              <button
                key={format}
                type="button"
                onClick={() => void exportGuest(format)}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {label}
              </button>
            ) : (
              <a key={format} href={`/api/export/${props.docId}?format=${format}`} download className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent">
                {label}
              </a>
            ))}
            {!props.guest && <div className="rounded-lg border border-border bg-background px-3 py-2">
              {shareToken ? (
                <div className="space-y-1.5">
                  <p className="truncate text-xs text-muted-foreground">
                    /share/{shareToken.slice(0, 18)}…
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyShare()}
                      className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs font-medium hover:bg-accent/70"
                    >
                      Copy share link
                    </button>
                    <button
                      type="button"
                      onClick={() => void setShare(null)}
                      className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void setShare(newShareToken())}
                  className="w-full text-left text-sm"
                >
                  Create public share link
                  <span className="block text-xs text-muted-foreground">
                    Read-only, unguessable URL — revoke any time
                  </span>
                </button>
              )}
            </div>}
          </div>
        )}

        {!props.guest && menu === "generate" && (
          <div className="mx-auto max-w-lg space-y-1 px-4 pb-3 lg:max-w-4xl">
            {generatableTypes(props.docType).length === 0 ? (
              <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                Nothing can be generated from this document type.
              </p>
            ) : (
              generatableTypes(props.docType).map((t) => (
                <Link
                  key={t}
                  href={`/app/generate/${props.docId}?type=${t}`}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {GEN_LABEL[t]} draft
                  <span className="block text-xs text-muted-foreground">
                    Prefilled from this document — edit before download
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {!props.guest && menu === "shipment" && (
          <div className="mx-auto max-w-lg space-y-1 px-4 pb-3 lg:max-w-4xl">
            <button
              type="button"
              onClick={() => void attachShipment("new")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
            >
              + New shipment
            </button>
            {props.shipments.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void attachShipment(s.id)}
                className={cn(
                  "w-full truncate rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent",
                  s.id === props.shipmentId && "border-signal"
                )}
              >
                {s.bl_number ?? s.ref ?? s.id.slice(0, 8)}
                {s.id === props.shipmentId && " (current)"}
              </button>
            ))}
            {props.shipmentId && (
              <button
                type="button"
                onClick={() => void attachShipment(null)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                Remove from shipment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
