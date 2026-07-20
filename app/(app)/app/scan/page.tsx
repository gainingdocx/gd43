import { Scanner } from "@/components/scan/scanner";
import { createClient } from "@/lib/supabase/server";

const HINTS = new Set(["bill_of_lading", "sea_waybill", "commercial_invoice", "packing_list", "arrival_notice", "booking_confirmation"]);

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Scan</h1>
      <Scanner signedIn={Boolean(user)} docTypeHint={HINTS.has((await searchParams).type ?? "") ? (await searchParams).type : undefined} />
    </div>
  );
}
