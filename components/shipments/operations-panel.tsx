import Link from "next/link";
import {
  AlertTriangle, BellRing, CheckCircle2, CircleDashed, ClipboardCheck,
  Clock3, FileWarning, MessageSquareText, ShieldCheck, UserRoundPlus, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { assessCompleteness, type ShipmentRequirement } from "@/lib/shipments/completeness";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  addChargeAlert, addDocumentComment, decideExportApproval, dismissChargeAlert,
  inviteTeamMember, removeTeamMember, requestExportApproval, saveRequirement,
  setExportApprovalRequired, updateDocumentWorkflow,
} from "@/app/(app)/app/shipments/[id]/actions";

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: "Bill of Lading", sea_waybill: "Sea Waybill", air_waybill: "Air Waybill",
  commercial_invoice: "Commercial Invoice", packing_list: "Packing List",
  arrival_notice: "Arrival Notice", booking_confirmation: "Booking Confirmation",
  purchase_order: "Purchase Order", freight_invoice: "Freight Invoice",
  goods_receipt: "Goods Receipt", other: "Other document",
};

function daysRemaining(value: string) {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((new Date(`${value}T00:00:00Z`).getTime() - start) / 86_400_000);
}

export async function ShipmentOperationsPanel({ shipmentId }: { shipmentId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: shipment }, { data: documents }, { data: requirements }, { data: members },
    { data: workflows }, { data: comments }, { data: alerts }, { data: approvals }] = await Promise.all([
    supabase.from("shipments").select("id, owner, export_approval_required").eq("id", shipmentId).maybeSingle(),
    supabase.from("documents").select("id, doc_type, status, source_filename, created_at").eq("shipment_id", shipmentId).order("created_at"),
    supabase.from("shipment_requirements").select("requirement_key, label, accepted_types, required, filename_hint").eq("shipment_id", shipmentId),
    supabase.from("shipment_members").select("id, member_id, email, display_name, role, status").eq("shipment_id", shipmentId).neq("status", "removed").order("created_at"),
    supabase.from("document_workflows").select("document_id, assignee_email, status, due_at, updated_at").eq("shipment_id", shipmentId),
    supabase.from("document_comments").select("id, document_id, author_email, body, kind, created_at").eq("shipment_id", shipmentId).order("created_at"),
    supabase.from("charge_alerts").select("id, alert_type, basis, free_until, notify_email, remind_days, sent_offsets, status, source_value").eq("shipment_id", shipmentId).neq("status", "dismissed").order("free_until"),
    supabase.from("export_approvals").select("id, status, decision_note, requested_at, decided_at, requested_by, decided_by").eq("shipment_id", shipmentId).order("requested_at", { ascending: false }).limit(5),
  ]);
  if (!shipment) return null;
  const selfMembership = (members ?? []).find((member) => member.member_id === user.id && member.status === "active");
  const role = shipment.owner === user.id ? "owner" : selfMembership?.role ?? "reviewer";
  const canConfigure = ["owner", "editor"].includes(role);
  const completeness = assessCompleteness(documents ?? [], (requirements ?? []) as ShipmentRequirement[]);
  const workflowMap = new Map((workflows ?? []).map((workflow) => [workflow.document_id, workflow]));
  const activeMembers = (members ?? []).filter((member) => member.status === "active");
  const latestApproval = approvals?.[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-primary/8 via-card to-signal/5 p-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shipment readiness</p><h2 className="mt-1 text-xl font-bold text-primary">Document completeness</h2><p className="mt-1 text-sm text-muted-foreground">Required evidence is checked continuously as documents arrive and finish parsing.</p></div>
          <div className="rounded-2xl border border-primary/20 bg-background px-4 py-3 text-center"><p className="text-2xl font-black text-primary">{completeness.percent}%</p><p className="text-[0.68rem] uppercase tracking-wide text-muted-foreground">{completeness.complete}/{completeness.required} ready</p></div>
        </div>
        <div className="h-2 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${completeness.percent}%` }} /></div>
        <ul className="grid gap-3 p-4 sm:grid-cols-2">{completeness.results.map((item) => <li key={item.requirement_key} className={cn("rounded-2xl border p-4", item.state === "missing" ? "border-destructive/35 bg-destructive/5" : "border-border bg-background")}>
          <div className="flex items-start gap-3">{item.state === "present" ? <CheckCircle2 className="mt-0.5 size-5 text-success" aria-hidden/> : item.state === "processing" ? <Clock3 className="mt-0.5 size-5 text-signal" aria-hidden/> : item.state === "missing" ? <FileWarning className="mt-0.5 size-5 text-destructive" aria-hidden/> : <CircleDashed className="mt-0.5 size-5 text-muted-foreground" aria-hidden/>}<div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.state === "optional" ? "Conditional — not currently required" : item.state}{item.matchingCount > 1 ? ` · ${item.matchingCount} files` : ""}</p></div>
          {canConfigure && <form action={saveRequirement}><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="requirementKey" value={item.requirement_key}/><input type="hidden" name="required" value={item.required ? "false" : "true"}/><button className="text-xs font-semibold text-signal underline">{item.required ? "Make optional" : "Require"}</button></form>}</div>
        </li>)}</ul>
        {canConfigure && <form action={saveRequirement} className="grid gap-2 border-t border-border p-4 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="requirementKey" value="custom"/><input type="hidden" name="required" value="true"/><input name="label" required maxLength={100} placeholder="Other required document" className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"/><input name="filenameHint" maxLength={80} placeholder="Filename words, e.g. fumigation" className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"/><Button type="submit">Add requirement</Button></form>}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3"><BellRing className="mt-0.5 size-6 text-signal" aria-hidden/><div><h2 className="text-xl font-bold text-primary">Demurrage & detention watch</h2><p className="mt-1 text-sm text-muted-foreground">Arrival-notice last-free dates are scheduled automatically. Daily reminders run at 08:00 UTC, with webhook delivery and email when configured.</p></div></div>
        {(alerts ?? []).length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">No charge clocks are active. Parsing an arrival notice with a last-free date creates one automatically.</p> : <ul className="mt-4 grid gap-3 sm:grid-cols-2">{(alerts ?? []).map((alert) => {
          const days = daysRemaining(alert.free_until);
          return <li key={alert.id} className={cn("rounded-2xl border p-4", days <= 1 ? "border-destructive/35 bg-destructive/5" : days <= 3 ? "border-warn/35 bg-warn/5" : "border-border bg-background")}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{alert.alert_type} · {alert.basis}</p><p className="mt-1 text-lg font-bold text-primary">{alert.free_until}</p><p className="text-xs text-muted-foreground">{days < 0 ? `Charges may have started ${Math.abs(days)} day${days === -1 ? "" : "s"} ago` : days === 0 ? "Last free day is today" : `${days} day${days === 1 ? "" : "s"} remaining`}</p></div>{canConfigure && <form action={dismissChargeAlert}><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="alertId" value={alert.id}/><button className="text-xs text-muted-foreground underline">Dismiss</button></form>}</div>
            <p className="mt-3 text-[0.7rem] text-muted-foreground">Reminder cadence: {(alert.remind_days ?? []).join(", ")} days · {(alert.sent_offsets ?? []).length} sent</p>
          </li>;
        })}</ul>}
        {canConfigure && <form action={addChargeAlert} className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-[auto_1fr_1fr_auto]"><input type="hidden" name="shipmentId" value={shipmentId}/><select name="alertType" className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="demurrage">Demurrage</option><option value="detention">Detention</option></select><input name="freeUntil" type="date" required className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"/><input name="notifyEmail" type="email" defaultValue={user.email ?? ""} placeholder="Reminder email" className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"/><Button type="submit">Add alert</Button></form>}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3"><UsersRound className="mt-0.5 size-6 text-signal" aria-hidden/><div><h2 className="text-xl font-bold text-primary">Team review</h2><p className="mt-1 text-sm text-muted-foreground">Assign ownership, keep correction requests beside the source document, and preserve every decision.</p></div></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Participants</h3>
            <ul className="mt-2 space-y-2"><li className="rounded-xl border border-border bg-background px-3 py-2"><p className="text-sm font-semibold">{shipment.owner === user.id ? "You" : "Shipment owner"}</p><p className="text-xs text-muted-foreground">Owner</p></li>{(members ?? []).map((member) => <li key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.display_name || member.email}</p><p className="text-xs capitalize text-muted-foreground">{member.role} · {member.status}</p></div>{role === "owner" && <form action={removeTeamMember}><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="memberId" value={member.id}/><button className="text-xs text-muted-foreground underline">Remove</button></form>}</li>)}</ul>
            {role === "owner" && <form action={inviteTeamMember} className="mt-3 space-y-2 rounded-2xl border border-dashed border-border p-3"><div className="flex items-center gap-2 text-sm font-semibold"><UserRoundPlus className="size-4 text-signal" aria-hidden/> Invite reviewer</div><input type="hidden" name="shipmentId" value={shipmentId}/><input name="email" type="email" required placeholder="colleague@company.com" className="min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"/><div className="flex gap-2"><select name="role" className="min-h-10 flex-1 rounded-lg border border-border bg-background px-2 text-sm"><option value="reviewer">Reviewer</option><option value="editor">Editor</option><option value="approver">Approver</option></select><Button type="submit" size="sm">Invite</Button></div></form>}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Document queue</h3>
            <ul className="mt-2 space-y-3">{(documents ?? []).map((document) => {
              const workflow = workflowMap.get(document.id);
              const thread = (comments ?? []).filter((comment) => comment.document_id === document.id);
              return <li key={document.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3"><div><Link href={`/app/review/${document.id}`} className="text-sm font-bold text-primary underline">{TYPE_LABEL[document.doc_type] ?? "Document"}</Link><p className="mt-1 text-xs capitalize text-muted-foreground">{workflow?.status?.replace(/_/g, " ") ?? "unassigned"}{workflow?.assignee_email ? ` · ${workflow.assignee_email}` : ""}</p></div><ClipboardCheck className={cn("size-5", workflow?.status === "approved" ? "text-success" : "text-muted-foreground")} aria-hidden/></div>
                <form action={updateDocumentWorkflow} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="documentId" value={document.id}/><select name="assigneeEmail" defaultValue={workflow?.assignee_email ?? ""} disabled={!canConfigure} className="min-h-10 rounded-lg border border-border bg-card px-2 text-sm"><option value="">Unassigned</option>{activeMembers.map((member) => <option key={member.id} value={member.email}>{member.display_name || member.email}</option>)}</select><select name="status" defaultValue={workflow?.status ?? "in_review"} className="min-h-10 rounded-lg border border-border bg-card px-2 text-sm"><option value="in_review">In review</option><option value="correction_requested">Correction requested</option><option value="approved">Approved</option><option value="unassigned">Unassigned</option></select><Button type="submit" size="sm">Update</Button></form>
                {thread.length > 0 && <ul className="mt-3 space-y-2">{thread.slice(-4).map((comment) => <li key={comment.id} className="rounded-lg bg-muted px-3 py-2 text-xs"><p><span className="font-semibold">{comment.author_email}</span> · <span className="capitalize">{comment.kind.replace(/_/g, " ")}</span></p><p className="mt-1 text-foreground">{comment.body}</p></li>)}</ul>}
                <form action={addDocumentComment} className="mt-3"><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="documentId" value={document.id}/><textarea name="body" required maxLength={2000} rows={2} placeholder="Add context or describe the correction needed…" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"/><div className="mt-2 flex flex-wrap gap-2"><Button name="kind" value="comment" size="sm" variant="outline"><MessageSquareText className="size-4" aria-hidden/> Comment</Button><Button name="kind" value="correction_request" size="sm" variant="outline"><AlertTriangle className="size-4" aria-hidden/> Request correction</Button><Button name="kind" value="approval" size="sm"><ShieldCheck className="size-4" aria-hidden/> Approve document</Button></div></form>
              </li>;
            })}</ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-primary">Export approval gate</h2><p className="mt-1 text-sm text-muted-foreground">When enabled, consolidated shipment exports stay locked until an owner or approver signs off.</p></div>{role === "owner" && <form action={setExportApprovalRequired}><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="required" value={shipment.export_approval_required ? "false" : "true"}/><Button type="submit" variant="outline">{shipment.export_approval_required ? "Disable gate" : "Require approval"}</Button></form>}</div>
        {shipment.export_approval_required && <div className="mt-4 rounded-2xl border border-border bg-background p-4"><p className="text-sm font-semibold">Latest request: <span className="capitalize">{latestApproval?.status ?? "not requested"}</span></p><p className="mt-1 text-xs text-muted-foreground">{latestApproval ? new Date(latestApproval.requested_at).toLocaleString() : "Request approval after the documents are ready."}</p><div className="mt-3 flex flex-wrap gap-2"><form action={requestExportApproval}><input type="hidden" name="shipmentId" value={shipmentId}/><Button size="sm" variant="outline">Request export approval</Button></form>{latestApproval?.status === "pending" && ["owner", "approver"].includes(role) && <form action={decideExportApproval} className="flex flex-wrap gap-2"><input type="hidden" name="shipmentId" value={shipmentId}/><input type="hidden" name="approvalId" value={latestApproval.id}/><input name="note" maxLength={500} placeholder="Decision note" className="min-h-9 rounded-lg border border-border px-2 text-sm"/><Button name="decision" value="rejected" size="sm" variant="outline">Reject</Button><Button name="decision" value="approved" size="sm">Approve export</Button></form>}</div></div>}
      </section>
    </div>
  );
}
