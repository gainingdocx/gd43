import { createClient as createServiceClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Account deletion (BUILD_SPEC §M6.6). Storage objects first, then the auth
// user — every table cascades from auth.users. Needs the service role key
// (auth.admin API); returns 503 until the owner configures it.

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return Response.json(
      { error: "account deletion is not configured yet — contact gainingdocx@gmail.com" },
      { status: 503 }
    );
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Remove storage pages (userId/docId/page-N.jpg) in batches.
  const { data: docs } = await admin.storage.from("docs").list(user.id, { limit: 100 });
  for (const folder of docs ?? []) {
    const { data: files } = await admin.storage
      .from("docs")
      .list(`${user.id}/${folder.name}`, { limit: 100 });
    const paths = (files ?? []).map((f) => `${user.id}/${folder.name}/${f.name}`);
    if (paths.length > 0) await admin.storage.from("docs").remove(paths);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return Response.json({ error: "deletion failed — try again" }, { status: 500 });
  }

  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
