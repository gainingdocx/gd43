// GET /api/integrations/oauth/{provider}/callback — finish the consent flow.
//
// The security-critical half. Everything arriving here is attacker-controllable
// except the signature on `state`, so the order matters: verify state first,
// and take the account identity from the provider rather than from the query
// string. Trusting a `user_id` parameter here is how accounts get hijacked.

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { PROVIDERS, isOAuthProvider, type OAuthProvider } from "@/lib/integrations/oauth/providers";
import { readState } from "@/lib/integrations/oauth/state";
import { exchangeCode, saveTokens } from "@/lib/integrations/oauth/tokens";
import { logError, logInfo } from "@/lib/observability/logger";

const DONE = "/app/integrations";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // .../oauth/{provider}/callback
  const provider = decodeURIComponent(segments[segments.length - 2] ?? "");
  if (!isOAuthProvider(provider)) redirect(`${DONE}?error=unknown_provider`);

  // The user pressed Cancel on the consent screen. Not an error worth a scary
  // message — just take them back.
  const denied = url.searchParams.get("error");
  if (denied) redirect(`${DONE}?error=${encodeURIComponent(denied === "access_denied" ? "cancelled" : denied)}`);

  const state = await readState(url.searchParams.get("state"), provider as OAuthProvider);
  // Covers a forged state, an expired one, and one minted for a different
  // provider. All three mean the same thing to the user: start again.
  if (!state) redirect(`${DONE}?error=invalid_state`);

  const code = url.searchParams.get("code");
  if (!code) redirect(`${DONE}?error=missing_code`);

  try {
    const tokens = await exchangeCode(provider as OAuthProvider, code);
    // Identity comes from the provider, using the token we were just issued —
    // never from the callback's query string.
    const account = await PROVIDERS[provider as OAuthProvider].identify(tokens.accessToken);
    if (!account.externalAccountId) throw new Error("Provider returned no account identifier");

    const admin = createAdminClient();
    // Upsert on (owner, provider, external_account_id): reconnecting the same
    // account refreshes the grant in place rather than leaving a dead row and
    // a duplicate in the customer's list.
    const { data: connection, error } = await admin
      .from("oauth_connections")
      .upsert(
        {
          owner: state.owner,
          provider,
          external_account_id: account.externalAccountId,
          account_label: account.label,
          scopes: tokens.scopes,
          status: "active",
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner,provider,external_account_id" }
      )
      .select("id")
      .single();
    if (error || !connection) throw new Error(error?.message ?? "Could not save the connection");

    // Written separately so the token envelope is never part of a row the
    // upsert might log or return.
    await saveTokens(connection.id, tokens);

    logInfo("oauth connected", { provider, connectionId: connection.id });
    redirect(`${DONE}?connected=${provider}`);
  } catch (caught) {
    // `redirect()` works by throwing; rethrow so the success path above is not
    // swallowed as a failure.
    if (caught && typeof caught === "object" && "digest" in caught && String((caught as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw caught;
    }
    logError("oauth callback failed", caught, { provider });
    redirect(`${DONE}?error=connection_failed`);
  }
}
