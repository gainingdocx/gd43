"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/session";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function loginAdmin(formData: FormData) {
  const headerStore = await headers();
  const client =
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (isRateLimited(client)) redirect("/suhasgovind/login?error=limited");

  const username = String(formData.get("username") || "").slice(0, 100);
  const password = String(formData.get("password") || "").slice(0, 200);
  if (!(await verifyAdminCredentials(username, password))) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    redirect("/suhasgovind/login?error=invalid");
  }

  attempts.delete(client);
  await createAdminSession();
  redirect("/app/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/suhasgovind/login");
}
