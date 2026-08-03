import { Scanner } from "@/components/scan/scanner";
import Link from "next/link";
import { BatchUploader } from "@/components/scan/batch-uploader";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getFlagshipWorkflow, isFlagshipWorkflowKey } from "@/lib/workflows/flagship";
import { Plane, Ship } from "lucide-react";

const HINTS = new Set(["bill_of_lading", "sea_waybill", "air_waybill", "shipper_letter_of_instruction", "dangerous_goods_declaration", "air_cargo_manifest", "cargo_security_declaration", "commercial_invoice", "purchase_order", "freight_invoice", "goods_receipt", "packing_list", "arrival_notice", "booking_confirmation", "shipping_instructions", "certificate_of_origin", "quotation", "rate_confirmation", "container_event", "demurrage_detention_invoice"]);

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ type?: string; workflow?: string; shipment?: string }> }) {
  const query = await searchParams;
  const workflowKey = isFlagshipWorkflowKey(query.workflow) ? query.workflow : undefined;
  const workflow = workflowKey ? getFlagshipWorkflow(workflowKey) : null;
  const batchMode = query.type === "batch" || Boolean(workflow);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: shipments }, { data: profile }] = user
    ? await Promise.all([
        supabase.from("shipments").select("id, bl_number, ref").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("default_translation_language").eq("id", user.id).maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  return (
    <div className="space-y-6">
      <div>
        <p className="hidden text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground lg:block">Document workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary lg:text-3xl">{workflow ? workflow.name : batchMode ? "Batch upload" : "Upload a document"}</h1>
        <p className="mt-2 hidden text-sm text-muted-foreground lg:block">{workflow ? workflow.sequence : batchMode ? "Process a document set through one visible queue." : "Add a PDF or scanned page image. Files are prepared locally before parsing."}</p>
      </div>
      <nav aria-label="Document intake method" className="grid grid-cols-3 rounded-xl bg-muted p-1">
        <Link href="/app/scan" className={cn("rounded-lg px-2 py-2 text-center text-xs font-semibold sm:px-4 sm:text-sm", !batchMode && "bg-card text-primary shadow-sm")}>Single file</Link>
        <Link href="/app/scan?type=batch" className={cn("rounded-lg px-2 py-2 text-center text-xs font-semibold sm:px-4 sm:text-sm", batchMode && "bg-card text-primary shadow-sm")}>Document set</Link>
        <Link href="/app/email-in" className="rounded-lg px-2 py-2 text-center text-xs font-semibold sm:px-4 sm:text-sm">Email forward</Link>
      </nav>
      {!workflow && (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Choose freight mode">
          <Link href="/app/air-freight" className="flex min-h-24 items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-primary transition hover:border-primary/40 hover:bg-sky-100">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white"><Plane className="size-5" aria-hidden /></span>
            <span><strong className="block">Air freight paperwork</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">AWB, SLI, MAWB–HAWB, DGD, manifest and airfreight invoice workflows.</span></span>
          </Link>
          <Link href="/app/ocean-freight" className="flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-card p-4 text-primary transition hover:border-primary/30 hover:bg-secondary">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><Ship className="size-5" aria-hidden /></span>
            <span><strong className="block">Ocean freight paperwork</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">B/L, booking, shipping-instruction, arrival and free-time workflows.</span></span>
          </Link>
        </div>
      )}
      {batchMode
        ? <BatchUploader signedIn={Boolean(user)} shipments={shipments ?? []} defaultTargetLanguage={profile?.default_translation_language ?? ""} workflowKey={workflowKey} initialShipmentId={query.shipment} />
        : <Scanner signedIn={Boolean(user)} docTypeHint={HINTS.has(query.type ?? "") ? query.type : undefined} initialShipmentId={query.shipment} defaultTargetLanguage={profile?.default_translation_language ?? ""} />}
    </div>
  );
}
