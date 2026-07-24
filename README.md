# GainingDocx

Mobile-first PWA that parses ocean shipping documents (Bill of Lading, Commercial Invoice, Packing List), validates them with deterministic maritime rules, cross-checks documents against each other, exports structured data, and generates counterpart documents.

Master specification: `BUILD_SPEC.md` (build strictly in milestone order).

## Stack

Next.js 15 (App Router, TypeScript strict, Tailwind v4, shadcn/ui) deployed to Cloudflare Workers via `@opennextjs/cloudflare` + `wrangler`. Supabase (DB/Auth/Storage), OpenRouter (AI), Resend (email), PostHog (analytics), Sentry (errors), Paddle (billing).

Dependency versions are pinned exactly (`.npmrc` has `save-exact=true`). Never upgrade Next.js without confirming support in the [@opennextjs/cloudflare docs](https://opennext.js.org/cloudflare).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server at http://localhost:3000 |
| `npm run build` | Production Next.js build (webpack — required by OpenNext) |
| `npm run deploy` | Let OpenNext build Next.js in standalone mode, package it, and deploy the Worker |
| `npm run preview` | Build for Cloudflare and preview the Worker locally |
| `npm run deploy` | Build for Cloudflare and deploy to Cloudflare Workers |
| `npm run cf-typegen` | Generate TypeScript types for Cloudflare bindings |

## Environment variables

Copy `.env.example` to `.env.local` (already done locally) and fill values as each service is set up in later milestones. `.env.local` is gitignored — **secrets are never committed**. Production secrets go into Cloudflare via `wrangler secret put NAME`.

| Variable | Where to get it |
| --- | --- |
| `OPENROUTER_API_KEY` | openrouter.ai → sign in → **Keys** → Create Key |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → your project → **Settings → API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` (server-only secret — never expose to browser) |
| `CLOUDFLARE_ACCOUNT_ID` | dash.cloudflare.com → any page → Account ID in the right sidebar (or **Workers & Pages** overview) |
| `RESEND_API_KEY` | resend.com → **API Keys** → Create API Key |
| `NEXT_PUBLIC_POSTHOG_KEY` | us.posthog.com → Project → **Settings → Project API key** |
| `NEXT_PUBLIC_POSTHOG_HOST` | Leave as `https://us.i.posthog.com` (US cloud) |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → your project → **Settings → Client Keys (DSN)** |
| `PADDLE_ENV` | `sandbox` until launch, then `production` |
| `PADDLE_API_KEY` | Paddle dashboard → **Developer Tools → Authentication** → API keys |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Same page → Client-side tokens |
| `PADDLE_WEBHOOK_SECRET` | Paddle dashboard → **Developer Tools → Notifications** → your webhook → secret |

None of these are needed for M0/M1 — fill each one in the milestone that introduces the service (Supabase in M2, OpenRouter in M3, Paddle in M9, etc.).

## Supabase auth settings

Two settings are configured in the hosted project rather than in this repo, so
they survive no deploy and are easy to lose track of:

| Setting | Value | Why |
| --- | --- | --- |
| `mailer_autoconfirm` | `true` | Sign-up completes without a confirmation email. The built-in Supabase SMTP allows only `rate_limit_email_sent: 2` messages per hour, which is not enough to gate registration on, and there is no paid email provider configured. `signUpWithPassword` already handles both cases — it redirects to `/app/onboarding` when a session comes back and to `/auth/check-email` when one does not — so flipping this back to `false` needs no code change. |
| Built-in SMTP | in use (`smtp_host: null`) | Its 2/hour budget is reserved for password recovery, the one flow that genuinely needs email. |

Read or change them with `SUPABASE_ACCESS_TOKEN` against
`https://api.supabase.com/v1/projects/<ref>/config/auth`.
