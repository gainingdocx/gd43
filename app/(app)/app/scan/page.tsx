import { Scanner } from "@/components/scan/scanner";
import { createClient } from "@/lib/supabase/server";

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Scan</h1>
      <Scanner signedIn={Boolean(user)} />
    </div>
  );
}
