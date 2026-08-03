import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileStack,
  KeyRound,
  LockKeyhole,
  Mail,
  Paperclip,
  Send,
  ShieldCheck,
} from "lucide-react";

import { AddressCopy } from "@/components/email-in/address-copy";
import { EmailInSubmit } from "@/components/email-in/form-submit";
import { IngestionRefresh } from "@/components/email-in/ingestion-refresh";
import { Button } from "@/components/ui/button";
import { emailInAddress } from "@/lib/email-ingestion/address";
import { createClient } from "@/lib/supabase/server";
import { rotateEmailInAddress, updateEmailInPreferences } from "./actions";

const STATUS: Record<string, { label: string; detail: string; className: string; progress: number }> = {
  accepted: { label: "Received", detail: "Waiting for document processing to start", className: "text-signal", progress: 1 },
  processing: { label: "Processing", detail: "Extracting fields and running shipment checks", className: "text-signal", progress: 2 },
  processed: { label: "Completed", detail: "Documents processed successfully", className: "text-success", progress: 3 },
  partial: { label: "Completed — review needed", detail: "Some attachments need your attention", className: "text-warn", progress: 3 },
  failed: { label: "Needs attention", detail: "The attachments could not be processed", className: "text-destructive", progress: 3 },
  rejected: { label: "Not accepted", detail: "No supported attachment was found", className: "text-destructive", progress: 3 },
};

function receivedAt(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function EmailInPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/email-in");

  const [{ data: profile }, { data: ingestions }] = await Promise.all([
    supabase.from("profiles").select("email_ingest_token, email_ingest_enabled, email_ingest_reply").eq("id", user.id).maybeSingle(),
    supabase.from("email_ingestions").select("id, subject, sender, status, attachment_count, processed_count, shipment_ids, error, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  if (!profile?.email_ingest_token) {
    return <div role="alert" className="rounded-2xl border border-warn/30 bg-warn/10 p-5">Email-in needs the latest database migration before it can be used.</div>;
  }

  const address = emailInAddress(profile.email_ingest_token);
  const intakeActive = profile.email_ingest_enabled;
  const hasActiveIngestion = (ingestions ?? []).some((item) => item.status === "accepted" || item.status === "processing");

  return (
    <div data-wide className="space-y-6">
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Email-in document intake</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-primary">Your private intake address turns email attachments into checked shipments.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          <strong className="text-foreground">Where do you send the email?</strong> Put the exact private GainingDocx address shown below in the <strong className="text-foreground">To</strong> field. Forward the original shipment email or start a new one, keep the documents attached, and send it normally.
        </p>
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${intakeActive ? "bg-success/10 text-success" : "bg-warn/10 text-warn"}`}>
          {intakeActive ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertTriangle className="size-4" aria-hidden />}
          {intakeActive ? "Email intake is active" : "Email intake is paused — enable it under Delivery controls"}
        </div>
      </header>

      {params.message && (
        <div role="status" className="rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          {params.message === "rotate" ? "A new private address is active. The old address no longer accepts documents." : "Delivery controls saved and active."}
        </div>
      )}
      {params.error && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error === "rotate" ? "The private address could not be changed. Your current address still works." : "The delivery settings could not be saved. Your previous settings are unchanged."}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3" aria-label="How the private intake address works">
        <div className="rounded-2xl bg-[#ffe500] p-5 text-[#171717]"><KeyRound className="size-6 text-[#d40505]" aria-hidden /><h2 className="mt-3 font-black">Unique routing key</h2><p className="mt-2 text-sm leading-6">It is not a mailbox you must monitor. The random address identifies your account and routes supported attachments into your workspace.</p></div>
        <div className="rounded-2xl bg-primary p-5 text-white"><LockKeyhole className="size-6 text-[#ffe500]" aria-hidden /><h2 className="mt-3 font-black">Private workspace</h2><p className="mt-2 text-sm leading-6 text-white/75">Files are stored under your account. Shipment links require sign-in, and extracted results remain subject to your workspace access controls.</p></div>
        <div className="rounded-2xl bg-[#d40505] p-5 text-white"><ShieldCheck className="size-6 text-[#ffe500]" aria-hidden /><h2 className="mt-3 font-black">Revocable access</h2><p className="mt-2 text-sm leading-6 text-white/80">Anyone who learns the address can submit files, so keep it inside your team. Pause intake or rotate the address immediately if it is exposed.</p></div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[0_22px_70px_-48px_rgba(1,59,179,.8)]" aria-labelledby="destination-title">
        <div className="flex items-center justify-between gap-4 bg-primary px-5 py-4 text-white sm:px-6">
          <p id="destination-title" className="flex items-center gap-2 text-sm font-bold"><Mail className="size-4" aria-hidden /> Your unique private intake address</p>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">Use in the To field</span>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <AddressCopy address={address} />
          <div className="grid gap-3 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
            <p className="flex items-start gap-2 rounded-xl bg-background p-3"><Paperclip className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span><strong className="text-foreground">Attach:</strong> PDF, JPG, PNG or WebP. Up to 20 attachments within the 25 MiB email limit.</span></p>
            <p className="flex items-start gap-2 rounded-xl bg-background p-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /><span><strong className="text-foreground">Protected intake:</strong> supported file signatures are checked, duplicate messages are ignored, and unusual bursts are rate-limited.</span></p>
          </div>
        </div>
      </section>

      <section aria-labelledby="email-process-title">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-signal">The complete process</p>
        <h2 id="email-process-title" className="mt-1 text-xl font-black text-primary">From inbox to checked shipment in four clear steps</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Mail, "1. Address", "Copy the private address above and paste it into the To field."],
            [Paperclip, "2. Attach", "Keep the shipment PDFs or images attached. A useful AWB, B/L or shipment reference helps identification."],
            [FileStack, "3. Process", "After sending, the email appears below as Received, then Processing while fields and checks run."],
            [Send, "4. Reply", "When result replies are enabled, the sender receives secure shipment links and a discrepancy PDF when findings exist."],
          ].map(([Icon, title, copy]) => {
            const StepIcon = Icon as typeof Mail;
            return <div key={String(title)} className="relative rounded-2xl border border-border bg-card p-4"><span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary">Step</span><StepIcon className="size-5 text-signal" aria-hidden /><p className="mt-3 font-bold text-primary">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(copy)}</p></div>;
          })}
        </div>
        <p className="mt-3 rounded-xl border border-primary/10 bg-secondary/60 px-4 py-3 text-xs leading-5 text-muted-foreground"><strong className="text-primary">Do not send incoming documents to reports@docs.gainingdocx.com.</strong> That address sends the result reply. Incoming documents must go to the private address displayed above.</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h2 className="flex items-center gap-2 font-bold text-primary"><Clock3 className="size-5" aria-hidden /> Recent forwarded emails</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">This is your delivery tracker. You can leave the page; processing continues and the sender receives the result by email.</p></div>
            <IngestionRefresh active={hasActiveIngestion} />
          </div>

          {!ingestions?.length ? (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center"><Mail className="mx-auto size-7 text-primary" aria-hidden /><p className="mt-3 text-sm font-bold text-primary">No forwarded emails yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Copy the private address above, attach a supported document and send your first email. It will appear here after Cloudflare accepts it.</p></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {ingestions.map((item) => {
                const status = STATUS[item.status] ?? STATUS.processing;
                const stages = ["Email received", status.progress >= 3 ? "Documents checked" : "Processing documents", item.status === "processed" ? "Result ready" : item.status === "partial" ? "Ready — review" : item.status === "failed" || item.status === "rejected" ? "Action needed" : "Result reply"];
                return (
                  <li key={item.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><p className="truncate text-sm font-bold text-primary">{item.subject || "Shipment documents"}</p><p className="mt-1 text-xs text-muted-foreground">From {item.sender} · {receivedAt(item.created_at)}</p></div><span className={`w-fit shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black ${status.className}`}>{status.label}</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">{status.detail} · {item.processed_count}/{item.attachment_count} attachments processed</p>
                    <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={`Progress for ${item.subject || "shipment documents"}`}>
                      {stages.map((stage, index) => { const reached = status.progress >= index + 1; return <li key={stage} className={`rounded-lg border px-2 py-2 text-[10px] font-bold leading-4 ${reached ? "border-primary/20 bg-secondary text-primary" : "border-border bg-white text-muted-foreground"}`}><span className={`mr-1 inline-block size-1.5 rounded-full ${reached ? "bg-primary" : "bg-border"}`} aria-hidden />{stage}</li>; })}
                    </ol>
                    <div className="mt-3 flex flex-wrap items-center gap-3">{item.shipment_ids?.[0] && <Link href={`/app/shipments/${item.shipment_ids[0]}`} className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-signal">Open shipment <ArrowRight className="size-3" aria-hidden /></Link>}{item.error && <p role="alert" className="text-xs font-semibold text-warn">Attention: {item.error}</p>}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <form action={updateEmailInPreferences} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold text-primary">Delivery controls</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Changes take effect immediately. A confirmation appears at the top after saving.</p>
            <label className="mt-4 flex items-start gap-3 rounded-xl bg-background p-3 text-sm"><input name="enabled" type="checkbox" defaultChecked={intakeActive} className="mt-0.5 size-4 accent-primary" /><span><strong>Accept forwarded documents</strong><span className="mt-0.5 block text-xs text-muted-foreground">Pause intake without changing the address.</span></span></label>
            <label className="mt-3 flex items-start gap-3 rounded-xl bg-background p-3 text-sm"><input name="reply" type="checkbox" defaultChecked={profile.email_ingest_reply} className="mt-0.5 size-4 accent-primary" /><span><strong>Email the result to the sender</strong><span className="mt-0.5 block text-xs text-muted-foreground">Includes secure workspace links and a discrepancy PDF when one is generated.</span></span></label>
            <div className="mt-5"><EmailInSubmit label="Save delivery controls" pendingLabel="Saving controls…" /></div>
          </form>

          <form action={rotateEmailInAddress} className="rounded-2xl border border-warn/30 bg-warn/8 p-5">
            <p className="flex items-center gap-2 font-bold text-primary"><AlertTriangle className="size-4 text-warn" aria-hidden /> Address exposed?</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Rotate only when the address was shared outside the intended team. The old address stops accepting documents immediately, and a confirmation appears at the top.</p>
            <div className="mt-4"><EmailInSubmit label="Rotate private address" pendingLabel="Creating new address…" /></div>
          </form>
        </div>
      </section>

      <div className="flex flex-wrap gap-3"><Button render={<Link href="/app/scan?type=batch" />} variant="outline">Use manual batch upload</Button><Button render={<Link href="/app/shipments" />}>View shipments</Button></div>
    </div>
  );
}
