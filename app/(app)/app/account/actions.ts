"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

async function authenticated() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/account");
  return { supabase, user };
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await authenticated();
  const firstName = text(formData, "first_name", 80);
  const lastName = text(formData, "last_name", 80);
  const company = text(formData, "company", 160);
  const jobRole = text(formData, "job_role", 60);
  const companyType = text(formData, "company_type", 60);
  const countryCode = text(formData, "country_code", 2).toUpperCase();
  const timezone = text(formData, "timezone", 80);
  if (!firstName || !lastName || !company || !/^[A-Z]{2}$/.test(countryCode) || !timezone) {
    redirect("/app/account?error=profile");
  }
  const { error } = await supabase.from("profiles").update({
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    company,
    job_role: jobRole || null,
    company_type: companyType || null,
    country_code: countryCode,
    timezone,
  }).eq("id", user.id);
  redirect(error ? "/app/account?error=profile-save" : "/app/account?message=profile");
}

export async function updatePreferences(formData: FormData) {
  const { supabase, user } = await authenticated();
  const language = text(formData, "preferred_language", 10);
  const translation = text(formData, "default_translation_language", 10);
  const dateFormat = text(formData, "date_format", 20);
  const measurement = text(formData, "measurement_system", 20);
  if (!["en", "hi", "es", "fr", "de", "ar", "zh", "ja", "pt"].includes(language) ||
      (translation && !["en", "hi", "es", "fr", "de", "ar", "zh", "ja", "pt"].includes(translation)) ||
      !["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].includes(dateFormat) ||
      !["metric", "imperial"].includes(measurement)) {
    redirect("/app/account?error=preferences");
  }
  const { error } = await supabase.from("profiles").update({
    preferred_language: language,
    default_translation_language: translation || null,
    date_format: dateFormat,
    measurement_system: measurement,
    deadline_reminders: formData.get("deadline_reminders") === "on",
    review_notifications: formData.get("review_notifications") === "on",
    product_updates: formData.get("product_updates") === "on",
    marketing_consent: formData.get("marketing_consent") === "on",
  }).eq("id", user.id);
  redirect(error ? "/app/account?error=preferences-save" : "/app/account?message=preferences");
}

export async function changePassword(formData: FormData) {
  const { supabase } = await authenticated();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");
  if (password.length < 15 || password.length > 128 || password !== confirmation) {
    redirect("/app/account?error=password");
  }
  const { error } = await supabase.auth.updateUser({ password });
  redirect(error ? "/app/account?error=password-save" : "/app/account?message=password");
}

export async function changeEmail(formData: FormData) {
  const { supabase, user } = await authenticated();
  const email = text(formData, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === user.email) {
    redirect("/app/account?error=email");
  }
  const { error } = await supabase.auth.updateUser({ email });
  redirect(error ? "/app/account?error=email-save" : "/app/account?message=email");
}
