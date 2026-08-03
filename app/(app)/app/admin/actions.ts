"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = new Set(["unread", "read", "resolved"]);
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

export async function updateFeedbackStatus(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!UUID_PATTERN.test(id) || !STATUSES.has(status)) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("feedback_submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Feedback status could not be updated.");
  revalidatePath("/app/admin");
}
