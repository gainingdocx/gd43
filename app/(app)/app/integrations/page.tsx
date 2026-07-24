import { redirect } from "next/navigation";
import { CheckCircle2, CircleX, Code2, ExternalLink } from "lucide-react";
import { CredentialForms } from "@/components/integrations/credential-forms";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { removeWebhook, revokeApiKey } from "./actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/integrations");
  const [{ data: keys }, { data: hooks }, { data: deliveries }] = await Promise.all([
    supabase.from("api_keys").select("id, name, key_prefix, last_used_at, created_at, revoked_at").order("created_at", { ascending: false }),
    supabase.from("webhook_endpoints").select("id, url, description, enabled, created_at").order("created_at", { ascending: false }),
    supabase.from("webhook_deliveries").select("id, event_type, status, response_status, attempted_at").order("attempted_at", { ascending: false }).limit(10),
  ]);
  return (
    <div data-wide className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Developer platform</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary lg:text-3xl">API & webhooks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect a TMS, ERP, customs workflow, or automation without screen scraping.</p>
      </div>
      <CredentialForms />
      <section className="rounded-2xl border border-border bg-primary p-5 text-white">
        <div className="flex items-start gap-3"><Code2 className="mt-0.5 size-5 text-signal" aria-hidden /><div>
          <h2 className="font-bold">Parse endpoint</h2>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-black/20 px-3 py-2 text-xs">POST /api/v1/parse</code>
          <p className="mt-2 text-xs leading-5 text-white/70">Bearer authentication. Send 1–15 page objects with an HTTPS <code>url</code> or image <code>data_url</code>. Optional: <code>document_type</code>, <code>shipment_id</code>, and <code>source_filename</code>. Successful responses contain normalized fields, validation, and quality score.</p>
        </div></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">API keys</h2>
          <ul className="mt-2 space-y-2">{(keys ?? []).map((key) => <li key={key.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{key.name}</p><p className="text-xs text-muted-foreground">{key.key_prefix}… · {key.last_used_at ? `used ${new Date(key.last_used_at).toLocaleString()}` : "never used"}</p></div>
            {key.revoked_at ? <span className="text-xs text-muted-foreground">Revoked</span> : <form action={revokeApiKey}><input type="hidden" name="id" value={key.id}/><Button size="sm" variant="outline">Revoke</Button></form>}
          </li>)}</ul>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Webhook endpoints</h2>
          <ul className="mt-2 space-y-2">{(hooks ?? []).map((hook) => <li key={hook.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <ExternalLink className="size-4 shrink-0 text-signal" aria-hidden/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{hook.description || hook.url}</p><p className="truncate text-xs text-muted-foreground">{hook.url}</p></div>
            <form action={removeWebhook}><input type="hidden" name="id" value={hook.id}/><Button size="sm" variant="outline">Remove</Button></form>
          </li>)}</ul>
        </section>
      </div>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent deliveries</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">{(deliveries ?? []).map((delivery) => <li key={delivery.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          {delivery.status === "delivered" ? <CheckCircle2 className="size-4 text-success" aria-hidden/> : <CircleX className="size-4 text-destructive" aria-hidden/>}
          <span className="flex-1 font-medium">{delivery.event_type}</span><span className="text-xs text-muted-foreground">{delivery.response_status ?? "network error"} · {new Date(delivery.attempted_at).toLocaleString()}</span>
        </li>)}</ul>
      </section>
    </div>
  );
}
