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
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  FileDown,
  FilePlus2,
  Pencil,
  Ship,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { coerceEdit, flattenFields, getPath, setPath } from "@/lib/fields/display";
import { generatableTypes } from "@/lib/generate/map";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/lib/validators";

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
}

const EXPORT_FORMATS = [
  ["xlsx", "Excel (.xlsx)"],
  ["csv", "CSV"],
  ["json", "JSON"],
  ["pdf", "PDF summary report"],
] as const;

const GEN_LABEL: Record<string, string> = {
  packing_list: "Packing list",
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

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading",
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
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
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState<null | "export" | "generate" | "shipment">(null);
  const [shareToken, setShareToken] = useState(props.shareToken);

  const rows = useMemo(() => flattenFields(props.docType, fields), [props.docType, fields]);
  const byField = useMemo(() => {
    const map = new Map<string, ValidationResult[]>();
    for (const v of props.validation) {
      const key = v.field.replace(/\.(name|unlocode)$/, "");
      for (const k of [v.field, key]) {
        const list = map.get(k) ?? [];
        if (!list.includes(v)) list.push(v);
        map.set(k, list);
      }
    }
    return map;
  }, [props.validation]);

  const failCount = props.validation.filter((v) => v.status === "fail").length;

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
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .update({ fields: next })
      .eq("id", props.docId);
    if (error) {
      note("Could not save — try again");
    } else {
      setFields(next);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("events").insert({
          owner: user.id,
          type: "field_edited",
          payload: { document_id: props.docId, field: path, old: oldValue, new: newValue },
        });
      }
      note("Saved");
      router.refresh();
    }
    setSaving(false);
    setEditing(null);
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

  const pages = (
    <div className="flex gap-2 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:overflow-visible">
      {props.pageUrls.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground lg:py-16">
          Page images unavailable
        </div>
      ) : (
        props.pageUrls.map((url, i) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
            <Image
              src={url}
              alt={`Page ${i + 1}`}
              width={300}
              height={420}
              unoptimized
              className="w-24 rounded-lg border border-border object-cover lg:w-full"
            />
          </a>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-5 pb-16">
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
              "All deterministic checks passed"
            )}
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

      {toast && (
        <div className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {pages}

        <ul className="mt-4 space-y-2 lg:mt-0">
          {rows.map((row) => {
            const results = byField.get(row.path) ?? [];
            const chip = chipFor(row.value, results);
            const ChipIcon = chip.icon;
            const isEditing = editing === row.path;
            return (
              <li key={row.path} className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <ChipIcon className={cn("size-3.5", chip.cls)} aria-label={chip.label} />
                      {row.label}
                      {row.page !== null && (
                        <span className="rounded bg-accent px-1 text-[10px] normal-case">p.{row.page}</span>
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
                      <p className={cn("mt-0.5 truncate text-sm", row.value === "" ? "italic text-muted-foreground" : "font-medium")}>
                        {row.value === "" ? "—" : row.value}
                      </p>
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
      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-2 lg:max-w-4xl">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setMenu(menu === "export" ? null : "export")}
          >
            <FileDown className="size-4" aria-hidden /> Export
          </Button>
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
        </div>

        {menu === "export" && (
          <div className="mx-auto max-w-lg space-y-1 px-4 pb-3 lg:max-w-4xl">
            {EXPORT_FORMATS.map(([format, label]) => (
              <a
                key={format}
                href={`/api/export/${props.docId}?format=${format}`}
                download
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {label}
              </a>
            ))}
            <div className="rounded-lg border border-border bg-background px-3 py-2">
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
            </div>
          </div>
        )}

        {menu === "generate" && (
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

        {menu === "shipment" && (
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
