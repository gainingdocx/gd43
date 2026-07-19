import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DangerZone } from "@/components/account/danger-zone";

import { sendMagicLink, signOut } from "./actions";
import { GoogleButton } from "./google-button";

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 200 };

const MESSAGES: Record<string, { tone: "ok" | "err"; text: string }> = {
  sent: {
    tone: "ok",
    text: "Check your email — we sent you a sign-in link. It may take a minute.",
  },
  email: { tone: "err", text: "That doesn't look like a valid email address." },
  send: {
    tone: "err",
    text: "Could not send the sign-in link. Wait a minute and try again.",
  },
  auth: {
    tone: "err",
    text: "Sign-in link was invalid or expired. Request a new one below.",
  },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const message = params.sent
    ? MESSAGES.sent
    : params.error
      ? (MESSAGES[params.error] ?? MESSAGES.auth)
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const banner = message && (
    <div
      className={
        message.tone === "ok"
          ? "rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      }
    >
      {message.text}
    </div>
  );

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Sign in
        </h1>
        {banner}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <GoogleButton />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or with a magic link
            <span className="h-px flex-1 bg-border" />
          </div>
          <form action={sendMagicLink} className="space-y-3">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="lg" className="w-full">
              Email me a sign-in link
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            No password needed — we email you a link that signs you in.
          </p>
        </div>
      </div>
    );
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [{ data: profile }, { count: usedCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, full_name, company")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("owner", user.id)
      .gte("created_at", monthStart.toISOString()),
  ]);

  const plan = profile?.plan ?? "free";
  const used = usedCount ?? 0;
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">
        Account
      </h1>
      {banner}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Signed in as
          </p>
          <p className="mt-1 font-medium">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Plan
            </p>
            <p className="mt-1 font-medium capitalize">{plan}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Usage this month
            </p>
            <p className="mt-1 font-medium">
              {used} / {limit} documents
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Billing and plan upgrades arrive with the monetization milestone —
        you&apos;ll manage your subscription here.
      </div>
      <DangerZone />
      <form action={signOut}>
        <Button type="submit" size="lg" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
