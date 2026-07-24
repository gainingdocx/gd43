import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, Database, KeyRound, Languages, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DangerZone } from "@/components/account/danger-zone";
import { MfaManager } from "@/components/account/mfa-manager";
import { PLAN_LIMITS } from "@/lib/plans";
import { changeEmail, changePassword, updatePreferences, updateProfile } from "./actions";
import { signOut, signOutEverywhere } from "@/app/auth/actions";

const MESSAGES: Record<string, string> = {
  profile: "Profile updated.",
  preferences: "Preferences updated.",
  password: "Password updated.",
  email: "Check both your old and new inboxes to confirm the email change.",
};
const ERRORS: Record<string, string> = {
  profile: "Complete the required profile fields.",
  "profile-save": "Profile changes could not be saved.",
  preferences: "One or more preferences are invalid.",
  "preferences-save": "Preferences could not be saved.",
  password: "Use matching passwords between 15 and 128 characters.",
  "password-save": "Password could not be changed. Sign in again and retry.",
  email: "Enter a different valid email address.",
  "email-save": "Email change could not be started.",
};

const input = "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring";
const ACCOUNT_NOTIFICATIONS = [
  { name: "deadline_reminders", label: "Deadline and charge reminders" },
  { name: "review_notifications", label: "Team review notifications" },
  { name: "product_updates", label: "Product updates" },
  { name: "marketing_consent", label: "Optional tips and announcements" },
] as const;

export default async function AccountPage({ searchParams }: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/app/account");

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [{ data: profile }, { count: usedCount }, { data: aal }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner", user.id).eq("status", "parsed").gte("created_at", monthStart.toISOString()),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const plan = profile?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers as string[]
    : user.app_metadata.provider ? [String(user.app_metadata.provider)] : ["email"];

  return (
    <div data-wide className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Workspace settings</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-primary">Account</h1><p className="mt-2 text-sm text-muted-foreground">Identity, workflow defaults, security and your data.</p></div>
        <div className="flex gap-2"><Button render={<a href="#security" />} variant="outline" size="sm"><ShieldCheck className="size-4" aria-hidden /> Security</Button><form action={signOut}><Button type="submit" variant="outline" size="sm"><LogOut className="size-4" aria-hidden /> Sign out</Button></form></div>
      </div>
      {params.message && MESSAGES[params.message] && <div role="status" className="rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{MESSAGES[params.message]}</div>}
      {params.error && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{ERRORS[params.error] ?? "That change could not be completed."}</div>}
      {!profile?.onboarding_completed_at && <div className="flex flex-col justify-between gap-3 rounded-2xl border border-signal/30 bg-secondary/60 p-4 sm:flex-row sm:items-center"><div><p className="font-bold text-primary">Finish workspace setup</p><p className="mt-1 text-sm text-muted-foreground">Choose document workflows and notification defaults.</p></div><Button render={<Link href="/app/onboarding" />} size="sm">Continue setup</Button></div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Plan</p><p className="mt-2 text-2xl font-black capitalize text-primary">{plan}</p><p className="mt-1 text-xs text-muted-foreground">No card required</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Documents this month</p><p className="mt-2 text-2xl font-black text-primary">{usedCount ?? 0} <span className="text-base font-medium text-muted-foreground">/ {limit}</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-accent"><div className="h-full rounded-full bg-signal" style={{ width: `${Math.min(100, ((usedCount ?? 0) / limit) * 100)}%` }} /></div></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Account status</p><p className="mt-2 flex items-center gap-2 font-bold text-success"><CheckCircle2 className="size-5" aria-hidden /> Active</p><p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><UserRound className="size-5" aria-hidden /></span><div><h2 className="text-lg font-bold text-primary">Profile and organization</h2><p className="text-xs text-muted-foreground">Used for team identity and exported document headers.</p></div></div>
          <form action={updateProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">First name<input name="first_name" required defaultValue={profile?.first_name ?? ""} autoComplete="given-name" className={input} /></label>
            <label className="text-sm font-semibold">Last name<input name="last_name" required defaultValue={profile?.last_name ?? ""} autoComplete="family-name" className={input} /></label>
            <label className="text-sm font-semibold sm:col-span-2">Company<input name="company" required defaultValue={profile?.company ?? ""} autoComplete="organization" className={input} /></label>
            <label className="text-sm font-semibold">Role<select name="job_role" defaultValue={profile?.job_role ?? ""} className={input}><option value="">Not specified</option><option value="operations">Operations / logistics</option><option value="documentation">Documentation</option><option value="freight_forwarding">Freight forwarding</option><option value="customs">Customs / compliance</option><option value="finance">Finance / audit</option><option value="management">Management</option><option value="technology">Technology / API</option><option value="other">Other</option></select></label>
            <label className="text-sm font-semibold">Business type<select name="company_type" defaultValue={profile?.company_type ?? ""} className={input}><option value="">Not specified</option><option value="shipper">Shipper / importer / exporter</option><option value="freight_forwarder">Freight forwarder / NVOCC</option><option value="customs_broker">Customs broker</option><option value="carrier">Carrier / agent</option><option value="3pl">3PL / logistics provider</option><option value="manufacturer">Manufacturer</option><option value="trader">Trading company</option><option value="consultant">Consultant / individual</option><option value="other">Other</option></select></label>
            <label className="text-sm font-semibold">Country code<input name="country_code" required pattern="[A-Za-z]{2}" maxLength={2} defaultValue={profile?.country_code ?? "IN"} className={input} /></label>
            <label className="text-sm font-semibold">Time zone<input name="timezone" required defaultValue={profile?.timezone ?? "Asia/Calcutta"} className={input} /></label>
            <Button type="submit" className="sm:col-span-2">Save profile</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Languages className="size-5" aria-hidden /></span><div><h2 className="text-lg font-bold text-primary">Document preferences</h2><p className="text-xs text-muted-foreground">Defaults for parsing, display and operational email.</p></div></div>
          <form action={updatePreferences} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Interface language<select name="preferred_language" defaultValue={profile?.preferred_language ?? "en"} className={input}>{[["en","English"],["hi","Hindi"],["es","Spanish"],["fr","French"],["de","German"],["ar","Arabic"],["zh","Chinese"],["ja","Japanese"],["pt","Portuguese"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm font-semibold">Default translation<select name="default_translation_language" defaultValue={profile?.default_translation_language ?? ""} className={input}><option value="">Keep originals only</option>{[["en","English"],["hi","Hindi"],["es","Spanish"],["fr","French"],["de","German"],["ar","Arabic"],["zh","Chinese"],["ja","Japanese"],["pt","Portuguese"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm font-semibold">Date format<select name="date_format" defaultValue={profile?.date_format ?? "DD/MM/YYYY"} className={input}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
            <label className="text-sm font-semibold">Measurements<select name="measurement_system" defaultValue={profile?.measurement_system ?? "metric"} className={input}><option value="metric">Metric (kg, cm, cbm)</option><option value="imperial">Imperial (lb, in, ft³)</option></select></label>
            <div className="space-y-3 sm:col-span-2">{ACCOUNT_NOTIFICATIONS.map(({ name, label }) => <label key={name} className="flex items-center gap-3 text-sm"><input name={name} type="checkbox" defaultChecked={profile?.[name] ?? name !== "marketing_consent"} className="size-4 rounded border-input" /><span>{label}</span></label>)}</div>
            <Button type="submit" className="sm:col-span-2">Save preferences</Button>
          </form>
        </section>
      </div>

      <section id="security" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><ShieldCheck className="size-5" aria-hidden /></span><div><h2 className="text-lg font-bold text-primary">Security and sign-in</h2><p className="text-xs text-muted-foreground">Manage sign-in methods, recovery and active sessions.</p></div></div>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div><p className="text-sm font-semibold">Connected sign-in methods</p><div className="mt-2 flex flex-wrap gap-2">{providers.map((provider) => <span key={provider} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold capitalize">{provider === "email" ? "Email + password" : provider}</span>)}</div></div>
            <div><p className="mb-2 text-sm font-semibold">Two-step verification</p><MfaManager aal2={aal?.currentLevel === "aal2"} /></div>
          </div>
          <div className="space-y-5">
            <form action={changeEmail} className="rounded-xl border border-border p-4"><p className="flex items-center gap-2 text-sm font-bold"><Mail className="size-4 text-primary" aria-hidden /> Change email</p><input name="email" type="email" required autoComplete="email" placeholder={user.email ?? "new@company.com"} className={input} /><Button type="submit" variant="outline" size="sm" className="mt-3">Send confirmation</Button></form>
            <form action={changePassword} className="rounded-xl border border-border p-4"><p className="flex items-center gap-2 text-sm font-bold"><KeyRound className="size-4 text-primary" aria-hidden /> Change or add password</p><input name="password" type="password" required minLength={15} maxLength={128} autoComplete="new-password" placeholder="New passphrase (15+ characters)" className={input} /><input name="password_confirmation" type="password" required minLength={15} maxLength={128} autoComplete="new-password" placeholder="Confirm new passphrase" className={input} /><Button type="submit" variant="outline" size="sm" className="mt-3">Update password</Button></form>
            <form action={signOutEverywhere}><Button type="submit" variant="outline" className="w-full"><LogOut className="size-4" aria-hidden /> Sign out on every device</Button></form>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Database className="size-5" aria-hidden /></span><div><h2 className="text-lg font-bold text-primary">Your data</h2><p className="text-xs text-muted-foreground">Export a portable copy or permanently remove the account.</p></div></div>
        <div className="mt-5"><DangerZone /></div>
      </section>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Bell className="size-3.5" aria-hidden /> Marketing consent is optional and separate from operational alerts.</p>
    </div>
  );
}
