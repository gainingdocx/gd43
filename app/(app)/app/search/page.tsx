import Link from "next/link";

import { SearchBox } from "@/components/search/search-box";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Search</h1>
      {user ? (
        <SearchBox />
      ) : (
        <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          <Link href="/app/account" className="font-medium text-signal underline">
            Sign in
          </Link>{" "}
          to search across your documents.
        </div>
      )}
    </div>
  );
}
