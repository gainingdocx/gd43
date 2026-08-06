// The OAuth provider registry.
//
// Every provider differs in four ways — where to send the user, where to trade
// the code, what to ask for, and how to learn whose account it is. Everything
// after that is identical, so those four things are data and the flow is one
// piece of code. Adding OneDrive or Dropbox later is an entry here plus a file
// client, not another copy of the consent dance.
//
// Credentials come from the environment, never from the database: a client
// secret belongs to the deployment, not to a customer's row.

export const OAUTH_PROVIDERS = [
  "google_drive",
  "gmail",
  "onedrive",
  "microsoft_365_mail",
  "dropbox",
] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface ProviderDefinition {
  id: OAuthProvider;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: readonly string[];
  /**
   * Extra parameters for the authorize request.
   *
   * Google only returns a refresh token on the *first* consent for an account,
   * so a customer who connects, disconnects and reconnects would otherwise get
   * an access token that expires in an hour and no way to renew it.
   * `prompt=consent` forces a fresh grant every time.
   */
  authorizeParams?: Record<string, string>;
  /** Env var names, so a missing credential names itself in the error. */
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Called after the token exchange to identify the connected account. */
  identify(accessToken: string): Promise<{ externalAccountId: string; label: string | null }>;
}

async function getJson(url: string, accessToken: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Identity lookup failed with HTTP ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

export const PROVIDERS: Record<OAuthProvider, ProviderDefinition> = {
  google_drive: {
    id: "google_drive",
    label: "Google Drive",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    // `drive.file` only ever sees files the user picked or that we created. It
    // is not a restricted scope, so it needs no Google security assessment —
    // which is the difference between shipping this and shipping it next year.
    scopes: ["https://www.googleapis.com/auth/drive.file", "openid", "email"],
    authorizeParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    async identify(accessToken) {
      const me = await getJson("https://www.googleapis.com/oauth2/v3/userinfo", accessToken);
      return { externalAccountId: String(me.sub ?? ""), label: typeof me.email === "string" ? me.email : null };
    },
  },

  gmail: {
    id: "gmail",
    label: "Gmail",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    // Restricted scope: Google requires an independent CASA security assessment
    // before this works for anyone outside the app's test users. Declared here
    // so the wiring exists, but the catalogue must keep Gmail as `planned`
    // until that assessment is actually passed.
    scopes: ["https://www.googleapis.com/auth/gmail.readonly", "openid", "email"],
    authorizeParams: { access_type: "offline", prompt: "consent" },
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    async identify(accessToken) {
      const me = await getJson("https://www.googleapis.com/oauth2/v3/userinfo", accessToken);
      return { externalAccountId: String(me.sub ?? ""), label: typeof me.email === "string" ? me.email : null };
    },
  },

  onedrive: {
    id: "onedrive",
    label: "OneDrive / SharePoint",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    // `offline_access` is how Microsoft issues a refresh token at all.
    scopes: ["offline_access", "openid", "email", "Files.ReadWrite"],
    clientIdEnv: "MICROSOFT_OAUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_OAUTH_CLIENT_SECRET",
    async identify(accessToken) {
      const me = await getJson("https://graph.microsoft.com/v1.0/me", accessToken);
      return {
        externalAccountId: String(me.id ?? ""),
        label: typeof me.userPrincipalName === "string" ? me.userPrincipalName : null,
      };
    },
  },

  microsoft_365_mail: {
    id: "microsoft_365_mail",
    label: "Microsoft 365 mailbox",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["offline_access", "openid", "email", "Mail.Read"],
    clientIdEnv: "MICROSOFT_OAUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_OAUTH_CLIENT_SECRET",
    async identify(accessToken) {
      const me = await getJson("https://graph.microsoft.com/v1.0/me", accessToken);
      return {
        externalAccountId: String(me.id ?? ""),
        label: typeof me.userPrincipalName === "string" ? me.userPrincipalName : null,
      };
    },
  },

  dropbox: {
    id: "dropbox",
    label: "Dropbox",
    authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    scopes: ["files.content.read", "files.content.write", "account_info.read"],
    // Dropbox issues short-lived tokens only when asked; without this the
    // connection silently stops working after four hours.
    authorizeParams: { token_access_type: "offline" },
    clientIdEnv: "DROPBOX_OAUTH_CLIENT_ID",
    clientSecretEnv: "DROPBOX_OAUTH_CLIENT_SECRET",
    async identify(accessToken) {
      const response = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Identity lookup failed with HTTP ${response.status}`);
      const me = (await response.json()) as { account_id?: string; email?: string };
      return { externalAccountId: String(me.account_id ?? ""), label: me.email ?? null };
    },
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Read a provider's credentials, or null when the deployment has none.
 *
 * Null is a normal state, not an error: a provider nobody has registered an app
 * for is simply not offered in the UI. Throwing here would make the whole
 * integrations page fail because one optional provider is unconfigured.
 */
export function providerCredentials(provider: OAuthProvider): ProviderCredentials | null {
  const definition = PROVIDERS[provider];
  const clientId = process.env[definition.clientIdEnv];
  const clientSecret = process.env[definition.clientSecretEnv];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  return providerCredentials(provider) !== null;
}

/** Providers this deployment can actually offer today. */
export function configuredProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter(isProviderConfigured);
}

export function redirectUri(provider: OAuthProvider): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://gainingdocx.com").replace(/\/$/, "");
  return `${base}/api/integrations/oauth/${provider}/callback`;
}
