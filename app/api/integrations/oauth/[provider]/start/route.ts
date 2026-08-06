// GET /api/integrations/oauth/{provider}/start — begin the consent flow.
//
// Not a public endpoint: the signed-in user's id is baked into the state, which
// is what lets the callback attach the resulting tokens to the right account
// without trusting anything the browser returns.

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, isOAuthProvider, providerCredentials, redirectUri } from "@/lib/integrations/oauth/providers";
import { createState } from "@/lib/integrations/oauth/state";

export async function GET(request: Request) {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  // .../oauth/{provider}/start
  const provider = decodeURIComponent(segments[segments.length - 2] ?? "");
  if (!isOAuthProvider(provider)) redirect("/app/integrations?error=unknown_provider");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/api/integrations/oauth/${provider}/start`);

  const credentials = providerCredentials(provider);
  // A provider with no registered app is not an error the customer caused, so
  // it says so plainly rather than showing them a broken consent screen.
  if (!credentials) redirect("/app/integrations?error=provider_not_configured");

  const definition = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: definition.scopes.join(" "),
    state: await createState(user.id, provider),
    ...(definition.authorizeParams ?? {}),
  });

  redirect(`${definition.authorizeUrl}?${params.toString()}`);
}
