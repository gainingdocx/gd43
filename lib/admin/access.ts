import "server-only";

import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasAdminSession } from "@/lib/admin/session";

const DEFAULT_ADMIN = "gainingdocx@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.toLowerCase());
}

export async function requireAdminUser() {
  if (await hasAdminSession()) {
    return { email: "suhasgovind", authentication: "admin-session" as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/app/admin");
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
