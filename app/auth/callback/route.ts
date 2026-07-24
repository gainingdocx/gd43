import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Completes both auth flows:
//  - OAuth / PKCE:   ?code=...            -> exchangeCodeForSession
//  - Email links:    ?token_hash=&type=   -> verifyOtp
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = url.searchParams.get("next") ?? "/app";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/app";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const destination = new URL("/auth/mfa", url.origin);
        destination.searchParams.set("next", next);
        return NextResponse.redirect(destination);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle()
        : { data: null };
      return NextResponse.redirect(new URL(
        profile?.onboarding_completed_at || next.startsWith("/auth/") ? next : "/app/onboarding",
        url.origin
      ));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=callback", url.origin)
  );
}
