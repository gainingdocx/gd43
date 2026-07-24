"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, Building2, Check, FileStack, Loader2, Ship, Sparkles, Users } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/app/(app)/app/onboarding/actions";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  job_role?: string | null;
  company_type?: string | null;
  country_code?: string | null;
  timezone?: string | null;
  primary_modes?: string[] | null;
  use_cases?: string[] | null;
  monthly_document_volume?: string | null;
  deadline_reminders?: boolean | null;
  review_notifications?: boolean | null;
  product_updates?: boolean | null;
  marketing_consent?: boolean | null;
};

type OnboardingData = {
  first_name: string;
  last_name: string;
  company: string;
  job_role: string;
  company_type: string;
  country_code: string;
  timezone: string;
  monthly_document_volume: string;
  primary_modes: string[];
  use_cases: string[];
  deadline_reminders: boolean;
  review_notifications: boolean;
  product_updates: boolean;
  marketing_consent: boolean;
  accepted_terms: boolean;
};

const roles = [
  ["operations", "Operations / logistics"],
  ["documentation", "Documentation"],
  ["freight_forwarding", "Freight forwarding"],
  ["customs", "Customs / compliance"],
  ["finance", "Finance / audit"],
  ["management", "Management"],
  ["technology", "Technology / API"],
  ["other", "Other"],
];
const companyTypes = [
  ["shipper", "Shipper / importer / exporter"],
  ["freight_forwarder", "Freight forwarder / NVOCC"],
  ["customs_broker", "Customs broker"],
  ["carrier", "Carrier / agent"],
  ["3pl", "3PL / logistics provider"],
  ["manufacturer", "Manufacturer"],
  ["trader", "Trading company"],
  ["consultant", "Consultant / individual"],
  ["other", "Other"],
];
const countries = [
  ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["AE", "United Arab Emirates"],
  ["SG", "Singapore"], ["CN", "China"], ["HK", "Hong Kong"], ["DE", "Germany"], ["FR", "France"],
  ["NL", "Netherlands"], ["BE", "Belgium"], ["AU", "Australia"], ["CA", "Canada"], ["JP", "Japan"],
  ["BR", "Brazil"], ["ZA", "South Africa"], ["SA", "Saudi Arabia"], ["", "Other"],
];
const modes = [["ocean", "Ocean"], ["air", "Air"], ["road", "Road"], ["rail", "Rail"], ["multimodal", "Multimodal"]];
const useCases = [
  ["document_extraction", "Extract document data", FileStack],
  ["shipment_checks", "Check shipment consistency", Check],
  ["team_review", "Review with my team", Users],
  ["dangerous_goods", "Validate dangerous goods", Ship],
  ["charge_alerts", "Avoid demurrage charges", BellRing],
  ["api_automation", "Automate through API", Sparkles],
] as const;
const notificationChoices: Array<{
  key: "deadline_reminders" | "review_notifications" | "product_updates" | "marketing_consent";
  label: string;
  description: string;
}> = [
  { key: "deadline_reminders", label: "Deadline and charge reminders", description: "Last-free-date, demurrage and detention reminders." },
  { key: "review_notifications", label: "Team review notifications", description: "Assignments, comments, correction requests and approvals." },
  { key: "product_updates", label: "Product updates", description: "Important changes to features you already use." },
  { key: "marketing_consent", label: "Tips and occasional announcements", description: "Optional educational and promotional email." },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="h-12 flex-1" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Finish setup</Button>;
}

export function OnboardingWizard({ profile, email, error }: { profile: Profile; email: string; error?: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    company: profile.company ?? "",
    job_role: profile.job_role ?? "",
    company_type: profile.company_type ?? "",
    country_code: profile.country_code ?? "IN",
    timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Calcutta",
    monthly_document_volume: profile.monthly_document_volume ?? "",
    primary_modes: profile.primary_modes ?? ["ocean"],
    use_cases: profile.use_cases ?? ["document_extraction", "shipment_checks"],
    deadline_reminders: profile.deadline_reminders ?? true,
    review_notifications: profile.review_notifications ?? true,
    product_updates: profile.product_updates ?? true,
    marketing_consent: profile.marketing_consent ?? false,
    accepted_terms: false,
  });
  const stepValid = useMemo(() => [
    Boolean(data.first_name.trim() && data.last_name.trim() && data.company.trim() && data.job_role && data.company_type && /^[A-Z]{2}$/.test(data.country_code)),
    Boolean(data.monthly_document_volume && data.primary_modes.length && data.use_cases.length),
    data.accepted_terms,
  ], [data]);
  const toggleList = (key: "primary_modes" | "use_cases", value: string) => setData((current) => ({
    ...current,
    [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
  }));

  return (
    <div data-wide className="mx-auto max-w-4xl py-2 sm:py-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Workspace setup</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-primary sm:text-4xl">Make GainingDocx fit your operation</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A few operational details let us prioritize the right checks, document defaults and alerts. No sales call required.</p>
      </div>
      <ol className="mx-auto mt-7 flex max-w-xl items-center">
        {["About you", "Your workflow", "Preferences"].map((label, index) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <span className={cn("flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold", index <= step ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground")}>{index < step ? <Check className="size-4" aria-hidden /> : index + 1}</span>
            {index < 2 && <span className={cn("mx-2 h-0.5 flex-1", index < step ? "bg-primary" : "bg-border")} />}
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error === "incomplete" ? "Complete every required field before finishing setup." : "Your settings could not be saved. Please try again."}</p>}
      <form action={completeOnboarding} className="mt-6 rounded-3xl border border-border bg-white p-5 shadow-xl shadow-primary/5 sm:p-8">
        {step === 0 && (
          <section>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Building2 className="size-5" aria-hidden /></span><div><h2 className="text-xl font-bold text-primary">About you and your company</h2><p className="text-sm text-muted-foreground">{email}</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">First name<input value={data.first_name} onChange={(e) => setData({ ...data, first_name: e.target.value })} autoComplete="given-name" className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 font-normal" /></label>
              <label className="text-sm font-semibold">Last name<input value={data.last_name} onChange={(e) => setData({ ...data, last_name: e.target.value })} autoComplete="family-name" className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 font-normal" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Company or practice<input value={data.company} onChange={(e) => setData({ ...data, company: e.target.value })} autoComplete="organization" className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 font-normal" /></label>
              <label className="text-sm font-semibold">Your role<select value={data.job_role} onChange={(e) => setData({ ...data, job_role: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 font-normal"><option value="">Select role</option>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm font-semibold">Business type<select value={data.company_type} onChange={(e) => setData({ ...data, company_type: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 font-normal"><option value="">Select business type</option>{companyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm font-semibold">Primary country<select value={countries.some(([value]) => value && value === data.country_code) ? data.country_code : ""} onChange={(e) => setData({ ...data, country_code: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 font-normal">{countries.map(([value, label]) => <option key={value || "other"} value={value}>{label}</option>)}</select>{!countries.some(([value]) => value && value === data.country_code) && <input aria-label="Two-letter country code" value={data.country_code} onChange={(e) => setData({ ...data, country_code: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) })} placeholder="Two-letter code, e.g. MX" className="mt-2 h-11 w-full rounded-xl border border-input px-3 font-normal" />}</label>
              <label className="text-sm font-semibold">Time zone<input value={data.timezone} onChange={(e) => setData({ ...data, timezone: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 font-normal" /></label>
            </div>
          </section>
        )}
        {step === 1 && (
          <section>
            <h2 className="text-xl font-bold text-primary">What does your workflow look like?</h2>
            <p className="mt-1 text-sm text-muted-foreground">These answers personalize defaults; they do not limit what you can use.</p>
            <div className="mt-6">
              <p className="text-sm font-semibold">Transport modes</p>
              <div className="mt-2 flex flex-wrap gap-2">{modes.map(([value, label]) => <button key={value} type="button" onClick={() => toggleList("primary_modes", value)} className={cn("rounded-xl border px-4 py-2 text-sm font-medium", data.primary_modes.includes(value) ? "border-primary bg-secondary text-primary" : "border-border bg-white")}>{label}</button>)}</div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold">What would you like to improve?</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">{useCases.map(([value, label, Icon]) => <button key={value} type="button" onClick={() => toggleList("use_cases", value)} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold", data.use_cases.includes(value) ? "border-primary bg-secondary text-primary" : "border-border bg-white")}><span className="flex size-9 items-center justify-center rounded-lg bg-white"><Icon className="size-4" aria-hidden /></span>{label}{data.use_cases.includes(value) && <Check className="ml-auto size-4" aria-hidden />}</button>)}</div>
            </div>
            <label className="mt-6 block text-sm font-semibold">Documents processed per month<select value={data.monthly_document_volume} onChange={(e) => setData({ ...data, monthly_document_volume: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 font-normal"><option value="">Select a range</option>{["1-20", "21-100", "101-500", "501-2000", "2000+"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </section>
        )}
        {step === 2 && (
          <section>
            <h2 className="text-xl font-bold text-primary">Alerts, updates and privacy</h2>
            <p className="mt-1 text-sm text-muted-foreground">Operational alerts are independent from optional marketing.</p>
            <div className="mt-6 space-y-3">
              {notificationChoices.map(({ key, label, description }) => <label key={key} className="flex items-start gap-3 rounded-xl border border-border p-4"><input type="checkbox" checked={data[key]} onChange={(e) => setData({ ...data, [key]: e.target.checked })} className="mt-1 size-4 rounded border-input" /><span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span></span></label>)}
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-xl bg-accent/65 p-4 text-sm leading-6"><input type="checkbox" checked={data.accepted_terms} onChange={(e) => setData({ ...data, accepted_terms: e.target.checked })} className="mt-1 size-4 rounded border-input" /><span>I agree to the <Link href="/terms" className="font-semibold underline">Terms</Link> and acknowledge the <Link href="/privacy" className="font-semibold underline">Privacy Policy</Link>.</span></label>
          </section>
        )}
        <input type="hidden" name="first_name" value={data.first_name} />
        <input type="hidden" name="last_name" value={data.last_name} />
        <input type="hidden" name="company" value={data.company} />
        <input type="hidden" name="job_role" value={data.job_role} />
        <input type="hidden" name="company_type" value={data.company_type} />
        <input type="hidden" name="country_code" value={data.country_code} />
        <input type="hidden" name="timezone" value={data.timezone} />
        <input type="hidden" name="monthly_document_volume" value={data.monthly_document_volume} />
        {data.primary_modes.map((item) => <input key={`mode-${item}`} type="hidden" name="primary_modes" value={item} />)}
        {data.use_cases.map((item) => <input key={`use-${item}`} type="hidden" name="use_cases" value={item} />)}
        <input type="hidden" name="deadline_reminders" value={data.deadline_reminders ? "on" : ""} />
        <input type="hidden" name="review_notifications" value={data.review_notifications ? "on" : ""} />
        <input type="hidden" name="product_updates" value={data.product_updates ? "on" : ""} />
        <input type="hidden" name="marketing_consent" value={data.marketing_consent ? "on" : ""} />
        <input type="hidden" name="accepted_terms" value={data.accepted_terms ? "on" : ""} />
        <div className="mt-8 flex gap-3 border-t border-border pt-5">
          {step > 0 && <Button type="button" size="lg" variant="outline" className="h-12" onClick={() => setStep((value) => value - 1)}><ArrowLeft className="size-4" aria-hidden /> Back</Button>}
          {step < 2 ? <Button type="button" size="lg" className="ml-auto h-12" disabled={!stepValid[step]} onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight className="size-4" aria-hidden /></Button> : <SubmitButton />}
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">You can change every preference later from Account.</p>
    </div>
  );
}
