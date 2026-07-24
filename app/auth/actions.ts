"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function siteOrigin() {
  const values = await headers();
  return values.get("origin") ?? "https://gainingdocx.com";
}

function safeNext(value: FormDataEntryValue | null, fallback = "/app") {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function authError(path: string, code: string, next?: string): never {
  const query = new URLSearchParams({ error: code });
  if (next) query.set("next", next);
  redirect(`${path}?${query}`);
}

async function destinationAfterSignIn(next: string) {
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/auth/mfa?next=${encodeURIComponent(next)}`);
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();
  redirect(profile?.onboarding_completed_at ? next : "/app/onboarding");
}

export async function signUpWithPassword(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 80);
  const lastName = String(formData.get("last_name") ?? "").trim().slice(0, 80);
  const company = String(formData.get("company") ?? "").trim().slice(0, 160);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");
  const accepted = formData.get("accepted_terms") === "on";
  const marketing = formData.get("marketing_consent") === "on";

  if (!firstName || !lastName || !EMAIL.test(email)) authError("/auth/sign-up", "details");
  if (password.length < 15 || password.length > 128 || password !== confirmation) {
    authError("/auth/sign-up", "password");
  }
  if (!accepted) authError("/auth/sign-up", "terms");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/app/onboarding`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        company: company || null,
        accepted_terms: true,
        marketing_consent: marketing,
      },
    },
  });
  if (error) authError("/auth/sign-up", "signup");
  if (data.session) redirect("/app/onboarding");
  redirect("/auth/check-email?purpose=verify");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!EMAIL.test(email) || !password) authError("/auth/login", "credentials", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authError("/auth/login", "credentials", next);
  await destinationAfterSignIn(next);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (EMAIL.test(email)) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteOrigin()}/auth/callback?next=/auth/update-password`,
    });
  }
  redirect("/auth/check-email?purpose=recovery");
}

export async function updateRecoveredPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");
  if (password.length < 15 || password.length > 128 || password !== confirmation) {
    authError("/auth/update-password", "password");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) authError("/auth/forgot-password", "expired");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) authError("/auth/update-password", "update");
  redirect("/auth/login?message=password-updated");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login?message=signed-out");
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login?message=signed-out-all");
}
