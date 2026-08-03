"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function userId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/email-in");
  return user.id;
}

export async function updateEmailInPreferences(formData: FormData) {
  const id = await userId();
  const { error } = await createAdminClient().from("profiles").update({
    email_ingest_enabled: formData.get("enabled") === "on",
    email_ingest_reply: formData.get("reply") === "on",
  }).eq("id", id);
  redirect(error ? "/app/email-in?error=preferences" : "/app/email-in?message=preferences");
}

export async function rotateEmailInAddress() {
  const id = await userId();
  const token = randomUUID().replaceAll("-", "");
  const { error } = await createAdminClient().from("profiles").update({ email_ingest_token: token }).eq("id", id);
  redirect(error ? "/app/email-in?error=rotate" : "/app/email-in?message=rotate");
}
