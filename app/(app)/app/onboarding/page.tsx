import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/account/onboarding-wizard";

export const metadata = { title: "Set up your workspace" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/onboarding");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profile?.onboarding_completed_at) redirect("/app");
  return <OnboardingWizard profile={profile ?? {}} email={user.email ?? ""} error={params.error} />;
}
