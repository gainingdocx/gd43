"use client";

import { useActionState, useState } from "react";
import { Copy, KeyRound, RadioTower, Send } from "lucide-react";
import { createApiKey, createWebhook, createIntegrationConnection, type CredentialState } from "@/app/(app)/app/integrations/actions";
import { Button } from "@/components/ui/button";

const initial: CredentialState = {};

type Kind = "webhook" | "slack" | "teams";

const URL_PLACEHOLDER: Record<Kind, string> = {
  webhook: "https://tms.example.com/gainingdocx",
  slack: "https://hooks.slack.com/services/T000/B000/xxxx",
  teams: "https://tenant.webhook.office.com/webhookb2/…",
};

function Secret({ value, label }: { value: string; label: string }) {
  return (
    <div className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3">
      <p className="text-xs font-semibold text-success">{label} — copy it now; it will not be shown again.</p>
      <div className="mt-2 flex gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-background px-3 py-2 text-xs">{value}</code>
        <button type="button" aria-label={`Copy ${label}`} onClick={() => navigator.clipboard.writeText(value)}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent">
          <Copy className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function CredentialForms() {
  const [keyState, keyAction, keyPending] = useActionState(createApiKey, initial);
  const [hookState, hookAction, hookPending] = useActionState(createWebhook, initial);
  const [connectorState, connectorAction, connectorPending] = useActionState(createIntegrationConnection, initial);
  const [kind, setKind] = useState<Kind>("webhook");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={keyAction} className="rounded-2xl border border-border bg-card p-5">
        <KeyRound className="size-6 text-signal" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-primary">Create API key</h2>
        <p className="mt-1 text-sm text-muted-foreground">Separate keys by system so access can be revoked cleanly.</p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="key-name">Key name</label>
        <input id="key-name" name="name" required maxLength={80} placeholder="Production TMS"
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        <Button type="submit" className="mt-3 w-full" disabled={keyPending}>{keyPending ? "Creating…" : "Create key"}</Button>
        {keyState.error && <p className="mt-2 text-sm text-destructive">{keyState.error}</p>}
        {keyState.secret && <Secret value={keyState.secret} label="API key" />}
      </form>

      <form action={hookAction} className="rounded-2xl border border-border bg-card p-5">
        <RadioTower className="size-6 text-signal" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-primary">Add destination</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A signed HTTPS webhook or a Slack channel. Failed deliveries retry
          for about seven hours and can be replayed by hand.
        </p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="hook-kind">Destination type</label>
        <select id="hook-kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value as Kind)}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
          <option value="webhook">Signed HTTPS webhook</option>
          <option value="slack">Slack channel</option>
          {/* Microsoft Teams is deliberately absent. Office 365 Connectors were
              disabled in May 2026, so offering it here would let someone create
              a destination that can never receive anything. The `teams` kind
              still works end to end for any row that already exists. */}
        </select>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="hook-url">
          {kind === "webhook" ? "Endpoint URL" : "Incoming webhook URL"}
        </label>
        <input id="hook-url" name="url" type="url" required placeholder={URL_PLACEHOLDER[kind]}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        {kind !== "webhook" && (
          <p className="mt-1 text-xs text-muted-foreground">
            {kind === "slack"
              ? "Slack → Apps → Incoming Webhooks → Add to a channel, then paste the hooks.slack.com URL."
              : "Teams → channel → Connectors → Incoming Webhook, then paste the office.com URL."}
          </p>
        )}
        <input name="description" maxLength={120} placeholder={kind === "webhook" ? "Production TMS (optional)" : "#freight-exceptions (optional)"}
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="hook-severity">Send</label>
        <select id="hook-severity" name="minSeverity" defaultValue={kind === "webhook" ? "all" : "critical"} key={kind}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
          <option value="critical">Critical only — failures, review requests, red discrepancies, free-time alerts</option>
          <option value="all">Every event</option>
        </select>
        <Button type="submit" className="mt-3 w-full" disabled={hookPending}>{hookPending ? "Adding…" : "Add destination"}</Button>
        {hookState.error && <p className="mt-2 text-sm text-destructive">{hookState.error}</p>}
        {hookState.success && <p className="mt-2 text-sm font-semibold text-success">{hookState.success}</p>}
        {hookState.secret && <Secret value={hookState.secret} label="Signing secret" />}
      </form>

      <form action={connectorAction} className="rounded-2xl border border-[#f4c400]/70 bg-[#fffdf2] p-5 lg:col-span-2">
        <Send className="size-6 text-signal" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-primary">Add authenticated TMS/ERP push connection</h2>
        <p className="mt-1 text-sm text-muted-foreground">Credentials are AES-GCM encrypted server-side. Test the customer tenant endpoint before pushing a reviewed shipment.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connection name<input name="name" required maxLength={100} placeholder="Production SAP TM" className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"/></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mapping profile<select name="profile" className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"><option value="canonical_json">Canonical JSON</option><option value="cargowise">CargoWise XML envelope</option><option value="sap_tm">SAP TM JSON mapping</option><option value="magaya">Magaya JSON mapping</option><option value="flexport">Flexport JSON mapping</option><option value="custom">Custom reviewed JSON</option></select></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authentication<select name="authType" className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"><option value="bearer">Bearer token</option><option value="api_key">API-key header</option><option value="basic">Basic authentication</option><option value="none">No authentication</option></select></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">API-key header<input name="authHeader" defaultValue="X-API-Key" maxLength={100} className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"/></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">Public HTTPS push endpoint<input name="endpoint" type="url" required placeholder="https://tenant.example.com/api/import" className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"/></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username for Basic auth<input name="username" autoComplete="off" maxLength={300} className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"/></label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Token / API key / password<input name="secret" type="password" autoComplete="new-password" maxLength={2000} className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-sm normal-case"/></label>
        </div>
        <Button type="submit" className="mt-4" disabled={connectorPending}>{connectorPending ? "Saving encrypted connectionâ€¦" : "Save push connection"}</Button>
        {connectorState.error && <p className="mt-2 text-sm text-destructive">{connectorState.error}</p>}
        {connectorState.success && <p className="mt-2 text-sm font-semibold text-success">{connectorState.success}</p>}
      </form>
    </div>
  );
}
