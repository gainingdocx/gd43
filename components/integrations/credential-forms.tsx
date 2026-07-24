"use client";

import { useActionState } from "react";
import { Copy, KeyRound, RadioTower } from "lucide-react";
import { createApiKey, createWebhook, type CredentialState } from "@/app/(app)/app/integrations/actions";
import { Button } from "@/components/ui/button";

const initial: CredentialState = {};

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
        <h2 className="mt-3 text-lg font-bold text-primary">Add webhook</h2>
        <p className="mt-1 text-sm text-muted-foreground">Receive signed events for parses, failures, and HS decisions.</p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="hook-url">Endpoint URL</label>
        <input id="hook-url" name="url" type="url" required placeholder="https://tms.example.com/gainingdocx"
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        <input name="description" maxLength={120} placeholder="Production TMS (optional)"
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        <Button type="submit" className="mt-3 w-full" disabled={hookPending}>{hookPending ? "Adding…" : "Add webhook"}</Button>
        {hookState.error && <p className="mt-2 text-sm text-destructive">{hookState.error}</p>}
        {hookState.secret && <Secret value={hookState.secret} label="Signing secret" />}
      </form>
    </div>
  );
}

