import { Scanner } from "@/components/scan/scanner";
import Link from "next/link";
import { BatchUploader } from "@/components/scan/batch-uploader";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const HINTS = new Set(["bill_of_lading", "sea_waybill", "air_waybill", "commercial_invoice", "purchase_order", "freight_invoice", "goods_receipt", "packing_list", "arrival_notice", "booking_confirmation"]);

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const query = await searchParams;
  const batchMode = query.type === "batch";
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
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary lg:text-3xl">{batchMode ? "Batch upload" : "Upload a document"}</h1>
        <p className="mt-2 hidden text-sm text-muted-foreground lg:block">{batchMode ? "Process a folder of independent documents through one visible queue." : "Add a PDF or scanned page image. Files are prepared locally before parsing."}</p>
      </div>
      <nav aria-label="Upload mode" className="grid grid-cols-2 rounded-xl bg-muted p-1">
        <Link href="/app/scan" className={cn("rounded-lg px-4 py-2 text-center text-sm font-semibold", !batchMode && "bg-card text-primary shadow-sm")}>Single document</Link>
        <Link href="/app/scan?type=batch" className={cn("rounded-lg px-4 py-2 text-center text-sm font-semibold", batchMode && "bg-card text-primary shadow-sm")}>Batch upload</Link>
      </nav>
      {batchMode
        ? <BatchUploader signedIn={Boolean(user)} shipments={shipments ?? []} defaultTargetLanguage={profile?.default_translation_language ?? ""} />
        : <Scanner signedIn={Boolean(user)} docTypeHint={HINTS.has(query.type ?? "") ? query.type : undefined} defaultTargetLanguage={profile?.default_translation_language ?? ""} />}
    </div>
  );
}
