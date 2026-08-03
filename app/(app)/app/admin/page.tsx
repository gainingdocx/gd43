import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  FileText,
  Globe2,
  Inbox,
  MessageSquareText,
  MonitorSmartphone,
  MousePointerClick,
  Ship,
  Users,
} from "lucide-react";

import { updateFeedbackStatus } from "./actions";
import { logoutAdmin } from "@/app/suhasgovind/login/actions";
import { requireAdminUser } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AnalyticsPayload = {
  totals: { page_views: number; feature_uses: number; visitors: number; sessions: number };
  daily: Array<{ day: string; page_views: number; visitors: number }>;
  features: Array<{ feature: string; views: number; visitors: number }>;
  pages: Array<{ path: string; views: number; visitors: number }>;
  countries: Array<{ country: string; views: number }>;
  referrers: Array<{ referrer: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
};

type FeedbackRow = {
  id: string;
  category: string;
  message: string;
  email: string | null;
  page_path: string;
  country_code: string | null;
  status: "unread" | "read" | "resolved";
  created_at: string;
};

type BehaviorEvent = {
  event_type: "page_view" | "feature_use";
  feature: string;
  path: string;
  visitor_id: string;
  session_id: string;
  referrer_host: string | null;
  occurred_at: string;
};

const EMPTY_ANALYTICS: AnalyticsPayload = {
  totals: { page_views: 0, feature_uses: 0, visitors: 0, sessions: 0 },
  daily: [],
  features: [],
  pages: [],
  countries: [],
  referrers: [],
  devices: [],
};

const CATEGORY_LABELS: Record<string, string> = {
  suggestion: "Suggestion",
  problem: "Problem",
  praise: "Positive",
  other: "Other",
};

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAnalytics(value: unknown): AnalyticsPayload {
  if (!value || typeof value !== "object") return EMPTY_ANALYTICS;
  const raw = value as Partial<AnalyticsPayload>;
  return {
    totals: {
      page_views: integer(raw.totals?.page_views),
      feature_uses: integer(raw.totals?.feature_uses),
      visitors: integer(raw.totals?.visitors),
      sessions: integer(raw.totals?.sessions),
    },
    daily: Array.isArray(raw.daily) ? raw.daily : [],
    features: Array.isArray(raw.features) ? raw.features : [],
    pages: Array.isArray(raw.pages) ? raw.pages : [],
    countries: Array.isArray(raw.countries) ? raw.countries : [],
    referrers: Array.isArray(raw.referrers) ? raw.referrers : [],
    devices: Array.isArray(raw.devices) ? raw.devices : [],
  };
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_35px_-28px_rgba(1,59,179,0.7)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-primary">{value.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function Breakdown({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Globe2;
  rows: Array<{ label: string; value: number; secondary?: number }>;
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="flex items-center gap-2 font-black text-primary">
        <Icon className="size-5 text-signal" aria-hidden /> {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Data will appear after visitors use the site.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-foreground">{row.label}</span>
                <span className="shrink-0 font-bold text-primary">
                  {row.value.toLocaleString()}
                  {typeof row.secondary === "number" && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      · {row.secondary.toLocaleString()} users
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(3, (row.value / maximum) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function countryLabel(code: string): string {
  if (code === "Unknown") return "Unknown";
  try {
    return `${COUNTRY_NAMES.of(code) || code} (${code})`;
  } catch {
    return code;
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; period?: string; status?: string }>;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const view = params.view === "feedback" ? "feedback" : params.view === "behavior" ? "behavior" : "overview";
  const period = [7, 30, 90].includes(Number(params.period)) ? Number(params.period) : 30;
  const feedbackStatus = ["unread", "read", "resolved"].includes(params.status || "")
    ? params.status!
    : "all";
  const since = new Date(Date.now() - period * 86_400_000).toISOString();
  const admin = createAdminClient();

  let feedbackQuery = admin
    .from("feedback_submissions")
    .select("id, category, message, email, page_path, country_code, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (feedbackStatus !== "all") feedbackQuery = feedbackQuery.eq("status", feedbackStatus);

  const [
    analyticsResult,
    behaviorResult,
    feedbackResult,
    unreadResult,
    feedbackPeriodResult,
    profilesResult,
    documentsResult,
    shipmentsResult,
  ] = await Promise.all([
    admin.rpc("admin_analytics_dashboard", { p_since: since }),
    admin.from("analytics_events").select("event_type, feature, path, visitor_id, session_id, referrer_host, occurred_at").gte("occurred_at", since).order("occurred_at", { ascending: true }).limit(5000),
    feedbackQuery,
    admin.from("feedback_submissions").select("id", { count: "exact", head: true }).eq("status", "unread"),
    admin.from("feedback_submissions").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("documents").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("shipments").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const analytics = analyticsResult.error
    ? EMPTY_ANALYTICS
    : normalizeAnalytics(analyticsResult.data);
  const feedback = (feedbackResult.data || []) as FeedbackRow[];
  const behaviorEvents = (behaviorResult.data || []) as BehaviorEvent[];
  const maxDaily = Math.max(1, ...analytics.daily.map((day) => integer(day.page_views)));
  const sessionMap = new Map<string, BehaviorEvent[]>();
  for (const event of behaviorEvents) {
    const events = sessionMap.get(event.session_id) || [];
    events.push(event);
    sessionMap.set(event.session_id, events);
  }
  const sessionEvents = [...sessionMap.values()];
  const engagedSessions = sessionEvents.filter((events) => events.some((event) => event.feature === "Engaged visit · 30 seconds")).length;
  const halfReadSessions = sessionEvents.filter((events) => events.some((event) => event.feature === "Content read · 50%")).length;
  const deepReadSessions = sessionEvents.filter((events) => events.some((event) => event.feature === "Content read · 90%")).length;
  const toolStartEvents = behaviorEvents.filter((event) => event.feature.startsWith("Tool started:"));
  const ctaEvents = behaviorEvents.filter((event) => event.feature.startsWith("Guide CTA to tool:") || event.feature.startsWith("Guide to tool:"));
  const searchHosts = /(^|\.)google\.|(^|\.)bing\.|(^|\.)yahoo\.|duckduckgo\./i;
  const searchLandingEvents = behaviorEvents.filter((event) => event.event_type === "page_view" && !!event.referrer_host && searchHosts.test(event.referrer_host));
  const searchLandingPages = [...searchLandingEvents.reduce((map, event) => map.set(event.path, (map.get(event.path) || 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]).slice(0, 12);
  const toolStarts = [...toolStartEvents.reduce((map, event) => {
    const label = event.feature.replace("Tool started:", "").trim();
    map.set(label, (map.get(label) || 0) + 1);
    return map;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <div data-wide className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Administration</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Usage intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            First-party product analytics and customer feedback in one secure workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-white p-1">
            {[7, 30, 90].map((days) => (
              <Link
                key={days}
                href={`/app/admin?view=${view}&period=${days}${view === "feedback" ? `&status=${feedbackStatus}` : ""}`}
                className={cn(
                  "flex min-h-10 items-center rounded-lg px-3 text-xs font-bold",
                  period === days ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {days} days
              </Link>
            ))}
          </div>
          <form action={logoutAdmin}>
            <button className="min-h-10 rounded-xl border border-border bg-white px-3 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-primary">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <nav aria-label="Admin dashboard" className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary p-1.5">
        <Link
          href={`/app/admin?view=overview&period=${period}`}
          className={cn(
            "flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold",
            view === "overview" ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          <BarChart3 className="size-4" aria-hidden /> Analytics overview
        </Link>
        <Link
          href={`/app/admin?view=behavior&period=${period}`}
          className={cn(
            "flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold",
            view === "behavior" ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          <MousePointerClick className="size-4" aria-hidden /> User behavior
        </Link>
        <Link
          href={`/app/admin?view=feedback&period=${period}`}
          className={cn(
            "relative flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold",
            view === "feedback" ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          <MessageSquareText className="size-4" aria-hidden /> Feedback inbox
          {(unreadResult.count || 0) > 0 && (
            <span className="rounded-full bg-signal px-2 py-0.5 text-[0.68rem] text-white">
              {unreadResult.count}
            </span>
          )}
        </Link>
      </nav>

      {view === "overview" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Unique visitors" value={analytics.totals.visitors} note={`Last ${period} days`} icon={Users} />
            <StatCard label="Page views" value={analytics.totals.page_views} note={`${analytics.totals.sessions.toLocaleString()} sessions`} icon={Eye} />
            <StatCard label="Documents processed" value={documentsResult.count || 0} note={`Created in ${period} days`} icon={FileText} />
            <StatCard label="Feedback received" value={feedbackPeriodResult.count || 0} note={`${unreadResult.count || 0} waiting to be read`} icon={MessageSquareText} />
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-primary">Traffic trend</h2>
                <p className="text-xs text-muted-foreground">Daily page views and unique visitors</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span><strong className="text-primary">{profilesResult.count || 0}</strong> registered accounts</span>
                <span><strong className="text-primary">{shipmentsResult.count || 0}</strong> shipments created</span>
              </div>
            </div>
            {analytics.daily.length === 0 ? (
              <div className="mt-6 rounded-xl bg-background px-4 py-10 text-center text-sm text-muted-foreground">
                The chart will populate as visitors browse the site.
              </div>
            ) : (
              <div className="mt-6 flex h-52 items-end gap-1 overflow-x-auto border-b border-border pb-1">
                {analytics.daily.map((day) => (
                  <div key={day.day} className="group flex min-w-4 flex-1 flex-col items-center justify-end gap-1" title={`${day.day}: ${day.page_views} views, ${day.visitors} visitors`}>
                    <div
                      className="w-full max-w-7 rounded-t bg-primary transition group-hover:bg-signal"
                      style={{ height: `${Math.max(4, (integer(day.page_views) / maxDaily) * 168)}px` }}
                    />
                    <span className="hidden text-[0.6rem] text-muted-foreground lg:block">
                      {new Date(`${day.day}T00:00:00`).toLocaleDateString("en", { day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <Breakdown
              title="Most-used features"
              icon={MousePointerClick}
              rows={analytics.features.map((row) => ({ label: row.feature, value: integer(row.views), secondary: integer(row.visitors) }))}
            />
            <Breakdown
              title="Top pages"
              icon={Eye}
              rows={analytics.pages.map((row) => ({ label: row.path, value: integer(row.views), secondary: integer(row.visitors) }))}
            />
            <Breakdown
              title="Visitor locations"
              icon={Globe2}
              rows={analytics.countries.map((row) => ({ label: countryLabel(row.country), value: integer(row.views) }))}
            />
            <Breakdown
              title="Traffic sources"
              icon={Ship}
              rows={analytics.referrers.map((row) => ({ label: row.referrer, value: integer(row.views) }))}
            />
            <Breakdown
              title="Devices"
              icon={MonitorSmartphone}
              rows={analytics.devices.map((row) => ({ label: row.device, value: integer(row.views) }))}
            />
            <section className="rounded-2xl border border-border bg-primary p-6 text-white">
              <BarChart3 className="size-7 text-[#f4c400]" aria-hidden />
              <h2 className="mt-4 text-xl font-black">How to read this dashboard</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Feature popularity combines page views and explicitly tracked actions. Visitors are anonymous browser IDs; sessions reset when a browser tab session ends. Country comes from Cloudflare and no raw IP address is retained.
              </p>
              <p className="mt-4 text-sm font-bold">
                {analytics.totals.feature_uses.toLocaleString()} tracked feature interactions in this period
              </p>
            </section>
          </div>
        </>
      ) : view === "behavior" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Search landings" value={searchLandingEvents.length} note="Visits referred by search engines" icon={Ship} />
            <StatCard label="Engaged sessions" value={engagedSessions} note={`Stayed at least 30 seconds · ${sessionMap.size ? Math.round((engagedSessions / sessionMap.size) * 100) : 0}%`} icon={Users} />
            <StatCard label="Deep reads" value={deepReadSessions} note={`Reached 90% of a page · ${halfReadSessions} reached 50%`} icon={Eye} />
            <StatCard label="Tool starts" value={toolStartEvents.length} note={`${ctaEvents.length} guide-to-tool clicks`} icon={MousePointerClick} />
          </section>
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-black text-primary">Search-to-tool journey</h2>
            <p className="mt-1 text-sm text-muted-foreground">A first-party funnel for deciding which landing pages, guides and calculators deserve improvement.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Search landing", searchLandingEvents.length],
                ["30-second engagement", engagedSessions],
                ["Guide-to-tool click", ctaEvents.length],
                ["Tool started", toolStartEvents.length],
              ].map(([label, value], index) => (
                <div key={String(label)} className="rounded-2xl bg-secondary p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step {index + 1}</span>
                  <strong className="mt-2 block text-2xl text-primary">{Number(value).toLocaleString()}</strong>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </section>
          <div className="grid gap-4 xl:grid-cols-2">
            <Breakdown title="Organic-search landing pages" icon={Ship} rows={searchLandingPages.map(([label, value]) => ({ label, value }))} />
            <Breakdown title="Tools users actually started" icon={MousePointerClick} rows={toolStarts.map(([label, value]) => ({ label, value }))} />
            <section className="rounded-2xl border border-border bg-white p-6 xl:col-span-2">
              <h2 className="font-black text-primary">How to use these signals</h2>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
                <p><strong className="block text-primary">Impressions but few landings</strong>Improve the Search Console title and description, match the query wording and make the free result explicit.</p>
                <p><strong className="block text-primary">Landings but weak reading</strong>Improve the opening answer, examples, navigation, readability and alignment with search intent.</p>
                <p><strong className="block text-primary">Reading but few tool starts</strong>Strengthen the contextual tool call-to-action and ensure the calculator solves the exact problem explained.</p>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">This dashboard stores anonymous visitor/session IDs, page paths and interaction labels. Country is derived by Cloudflare; raw IP addresses and form values are not retained in analytics.</p>
            </section>
          </div>
        </>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 font-black text-primary">
                <Inbox className="size-5 text-signal" aria-hidden /> Customer feedback
              </h2>
              <p className="text-xs text-muted-foreground">Newest submissions appear first.</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {["all", "unread", "read", "resolved"].map((status) => (
                <Link
                  key={status}
                  href={`/app/admin?view=feedback&period=${period}&status=${status}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-bold capitalize",
                    feedbackStatus === status ? "bg-primary text-white" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {status}
                </Link>
              ))}
            </div>
          </div>

          {feedback.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-input bg-white px-6 py-16 text-center">
              <MessageSquareText className="mx-auto size-10 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-bold text-primary">No feedback in this view</p>
              <p className="mt-1 text-sm text-muted-foreground">New website submissions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "rounded-2xl border bg-white p-5",
                    item.status === "unread" ? "border-primary/40 shadow-[inset_4px_0_0_#013bb3]" : "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
                        item.status === "resolved" ? "bg-green-50 text-green-700" : item.status === "unread" ? "bg-red-50 text-destructive" : "bg-slate-100 text-slate-600",
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <time className="text-xs text-muted-foreground" dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{item.message}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Page: <strong className="font-medium text-foreground">{item.page_path}</strong></span>
                    <span>Country: <strong className="font-medium text-foreground">{item.country_code ? countryLabel(item.country_code) : "Unknown"}</strong></span>
                    {item.email && (
                      <a className="font-bold text-primary underline" href={`mailto:${item.email}`}>{item.email}</a>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status === "unread" && (
                      <form action={updateFeedbackStatus}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="read" />
                        <button className="min-h-10 rounded-lg border border-border px-3 text-xs font-bold text-primary hover:bg-secondary">
                          Mark as read
                        </button>
                      </form>
                    )}
                    {item.status !== "resolved" && (
                      <form action={updateFeedbackStatus}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <button className="flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-[#012f91]">
                          <CheckCircle2 className="size-3.5" aria-hidden /> Resolve
                        </button>
                      </form>
                    )}
                    {item.status === "resolved" && (
                      <form action={updateFeedbackStatus}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="read" />
                        <button className="min-h-10 rounded-lg border border-border px-3 text-xs font-bold text-primary hover:bg-secondary">
                          Reopen
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
