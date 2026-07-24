"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLES = new Set(["operations", "documentation", "freight_forwarding", "customs", "finance", "management", "technology", "other"]);
const COMPANY_TYPES = new Set(["shipper", "freight_forwarder", "customs_broker", "carrier", "3pl", "manufacturer", "trader", "consultant", "other"]);
const VOLUMES = new Set(["1-20", "21-100", "101-500", "501-2000", "2000+"]);
const MODES = new Set(["ocean", "air", "road", "rail", "multimodal"]);
const USE_CASES = new Set(["document_extraction", "shipment_checks", "team_review", "dangerous_goods", "charge_alerts", "api_automation"]);

function value(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/onboarding");

  const firstName = value(formData, "first_name", 80);
  const lastName = value(formData, "last_name", 80);
  const company = value(formData, "company", 160);
  const role = value(formData, "job_role", 60);
  const companyType = value(formData, "company_type", 60);
  const country = value(formData, "country_code", 2).toUpperCase();
  const timezone = value(formData, "timezone", 80);
  const volume = value(formData, "monthly_document_volume", 30);
  const modes = formData.getAll("primary_modes").map(String).filter((item) => MODES.has(item));
  const useCases = formData.getAll("use_cases").map(String).filter((item) => USE_CASES.has(item));
  if (
    !firstName || !lastName || !company || !ROLES.has(role) ||
    !COMPANY_TYPES.has(companyType) || !/^[A-Z]{2}$/.test(country) ||
    !timezone || !VOLUMES.has(volume) || modes.length === 0 || useCases.length === 0 ||
    formData.get("accepted_terms") !== "on"
  ) {
    redirect("/app/onboarding?error=incomplete");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").update({
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    company,
    job_role: role,
    company_type: companyType,
    country_code: country,
    timezone,
    primary_modes: modes,
    use_cases: useCases,
    monthly_document_volume: volume,
    deadline_reminders: formData.get("deadline_reminders") === "on",
    review_notifications: formData.get("review_notifications") === "on",
    product_updates: formData.get("product_updates") === "on",
    marketing_consent: formData.get("marketing_consent") === "on",
    terms_accepted_at: now,
    privacy_accepted_at: now,
    onboarding_completed_at: now,
  }).eq("id", user.id);
  if (error) redirect("/app/onboarding?error=save");

  await supabase.from("events").insert({
    owner: user.id,
    type: "onboarding_completed",
    payload: { company_type: companyType, primary_modes: modes, use_cases: useCases },
  });
  redirect("/app/scan?welcome=1");
}
