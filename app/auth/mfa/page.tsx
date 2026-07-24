import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaChallenge } from "@/components/auth/mfa-challenge";

export const metadata = { title: "Two-step verification" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/app";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === "aal2" || data?.nextLevel !== "aal2") redirect(next);
  return <MfaChallenge next={next} />;
}
