import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleX, Code2, ExternalLink, LockKeyhole } from "lucide-react";
import { CredentialForms } from "@/components/integrations/credential-forms";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { removeWebhook, revokeApiKey, removeIntegrationConnection, testIntegrationConnection } from "./actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/integrations");
  const [{ data: keys }, { data: hooks }, { data: deliveries }, { data: connections }, { data: pushes }, { data: profile }] = await Promise.all([
    supabase.from("api_keys").select("id, name, key_prefix, last_used_at, created_at, revoked_at").order("created_at", { ascending: false }),
    supabase.from("webhook_endpoints").select("id, url, description, enabled, created_at").order("created_at", { ascending: false }),
    supabase.from("webhook_deliveries").select("id, event_type, status, response_status, attempted_at").order("attempted_at", { ascending: false }).limit(10),
    supabase.from("integration_connections").select("id, name, profile, endpoint_url, auth_type, auth_header, enabled, last_test_status, last_tested_at, created_at").order("created_at", { ascending: false }),
    supabase.from("integration_pushes").select("id, connection_id, shipment_id, status, response_status, error, attempted_at").order("attempted_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
  ]);
  const automationEnabled = profile?.plan === "pro" || profile?.plan === "team";
  return (
    <div data-wide className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Developer platform</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary lg:text-3xl">API & webhooks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect a TMS, ERP, customs workflow, or automation without screen scraping.</p>
      </div>
      {automationEnabled ? <CredentialForms /> : <section className="flex flex-col justify-between gap-4 rounded-2xl border border-signal/30 bg-secondary p-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 text-signal" aria-hidden/><div><h2 className="font-bold text-primary">Automation is available on Pro and Team</h2><p className="mt-1 text-sm text-muted-foreground">Upgrade to create API keys, signed webhooks and direct ERP/TMS connections.</p></div></div><Button render={<Link href="/pricing" />}>Compare plans</Button></section>}
      <section><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Direct TMS/ERP connections</h2><ul className="mt-2 space-y-2">{(connections ?? []).map((connection) => <li key={connection.id} className="rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center gap-3"><ExternalLink className="size-4 text-signal" aria-hidden/><div className="min-w-0 flex-1"><p className="font-semibold">{connection.name}</p><p className="truncate text-xs text-muted-foreground">{connection.profile.replace(/_/g, " ")} Â· {connection.auth_type.replace(/_/g, " ")} Â· {connection.endpoint_url}</p>{connection.last_tested_at && <p className={`mt-1 text-xs ${connection.last_test_status >= 200 && connection.last_test_status < 300 ? "text-success" : "text-destructive"}`}>Last test: HTTP {connection.last_test_status || "network error"} Â· {new Date(connection.last_tested_at).toLocaleString()}</p>}</div><form action={testIntegrationConnection}><input type="hidden" name="id" value={connection.id}/><Button size="sm" variant="outline">Test</Button></form><form action={removeIntegrationConnection}><input type="hidden" name="id" value={connection.id}/><Button size="sm" variant="outline">Remove</Button></form></div></li>)}{(connections ?? []).length === 0 && <li className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No direct push connection configured yet.</li>}</ul></section>
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
      <section><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent direct pushes</h2><ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">{(pushes ?? []).map((push) => <li key={push.id} className="flex items-center gap-3 px-4 py-3 text-sm">{push.status === "delivered" ? <CheckCircle2 className="size-4 text-success" aria-hidden/> : <CircleX className="size-4 text-destructive" aria-hidden/>}<span className="flex-1 font-medium">Shipment push</span><span className="text-xs text-muted-foreground">{push.response_status || push.error || "network error"} Â· {new Date(push.attempted_at).toLocaleString()}</span></li>)}{(pushes ?? []).length === 0 && <li className="px-4 py-5 text-center text-sm text-muted-foreground">No shipment pushes yet.</li>}</ul></section>
    </div>
  );
}
