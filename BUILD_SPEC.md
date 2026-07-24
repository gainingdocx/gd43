# GAININGDOCX — MASTER BUILD SPEC (v1.0)
# Hand this entire file to Claude Code. Build strictly in milestone order. Do not skip ahead.

## 0. WHAT THIS IS
GainingDocx: mobile-first PWA that parses ocean shipping documents (Bill of Lading, Commercial Invoice, Packing List + generic sea-cargo docs), validates them with deterministic maritime rules, cross-checks documents against each other, exports structured data, and generates counterpart documents. Public marketing surface is SEO-first (templates, calculators, guides). Solo-maintainable. Zero fixed infra beyond Cloudflare $5 + Supabase.

## 1. NON-NEGOTIABLE PRINCIPLES
1. Deterministic logic in TypeScript for anything checkable (check digits, weights, dates, codes). The LLM only extracts and explains — it never does math or validation verdicts.
2. Secrets only in `.env.local` (gitignored) and Cloudflare secrets. Never in code, never committed. Verify `.gitignore` covers `.env*` in the first commit.
3. Pin exact dependency versions. Never auto-upgrade Next.js; upgrade only when @opennextjs/cloudflare docs confirm support.
4. `/app/*` routes: noindex. All marketing routes: static/ISR, LCP < 1.5s on 4G, one H1 per page.
5. Heavy bytes never touch the Worker: browser uploads go direct to Supabase Storage via signed URLs; images compressed client-side before upload (max long edge 2000px, JPEG q80).
6. Every feature reads/writes the shared shipment data spine. No siloed tools.
7. Mobile-first: bottom nav (Home / Scan / Search / Account), one-thumb reach, 3-tap rule (upload → review → export).

## 2. STACK (pinned at scaffold time to latest stable, then frozen)
Next.js 15 App Router + TypeScript strict + Tailwind + shadcn/ui + Framer Motion (sparingly). Deploy: Cloudflare Workers via @opennextjs/cloudflare + wrangler. DB/Auth/Storage/Realtime: Supabase (@supabase/supabase-js + @supabase/ssr). AI: OpenRouter (OpenAI-compatible fetch, streaming). Email: Resend. Analytics: PostHog. Errors: Sentry (@sentry/nextjs). Exports: exceljs (xlsx), papaparse (csv), pdf-lib or react-pdf for PDF reports. PWA: @serwist/next or next-pwa (choose the one currently maintained; verify docs).

## 3. MILESTONES (build order — finish, verify, commit, then next)

### M0 — Scaffold & environment (FIRST SESSION)
- `create-next-app` (TS, Tailwind, App Router, src OFF), init shadcn, init git, create GitHub repo `gainingdocx` (private) via `gh`, first commit.
- Create `.env.local` with this exact template (empty values) and print instructions telling the owner which dashboard each value comes from:
```
OPENROUTER_API_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
CLOUDFLARE_ACCOUNT_ID=""
RESEND_API_KEY=""
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_SENTRY_DSN=""
PADDLE_ENV="sandbox"
PADDLE_API_KEY=""
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=""
PADDLE_WEBHOOK_SECRET=""
```
- Install + configure @opennextjs/cloudflare, wrangler.jsonc, preview deploy to workers.dev to prove the pipeline end-to-end with a hello page. STOP and ask owner to run `npx wrangler login` + `gh auth login` if not done.
- Folder skeleton per §4.

### M1 — Design system + marketing shell
- Design tokens: deep navy `#0B1F3A` primary, signal orange `#FF6B2C` accent, off-white `#F7F7F5` bg, success green, warn amber, error red; Inter or Geist font; generous tap targets (min 44px).
- Layouts: (marketing) with header/footer, (app) with bottom nav shell.
- Homepage per SEO spec (H1 "AI Bill of Lading Parser & Shipping Document Data Extraction", dropzone hero non-functional placeholder), /pricing, /terms, /privacy, /contact (needed for Paddle application). Deploy. Owner applies to Paddle now.

### M2 — Supabase schema + auth
- Migrations in `supabase/migrations/` (SQL, versioned). Tables (all with RLS ON):
  - `profiles` (id=auth.uid PK, email, full_name, company, plan text default 'free', docs_used_this_month int, period_start date)
  - `shipments` (id uuid PK, owner uuid → auth.users, ref text nullable, bl_number text nullable, created_at)
  - `documents` (id uuid PK, owner uuid, shipment_id uuid nullable FK, doc_type text CHECK in ('bill_of_lading','commercial_invoice','packing_list','other'), status text CHECK in ('uploaded','parsing','parsed','failed'), storage_path text, page_count int, raw_extraction jsonb, fields jsonb, validation jsonb, created_at, updated_at)
  - `containers` (id uuid PK, document_id FK, owner uuid, container_no text, seal_no text, iso_type text, packages int, package_type text, gross_kg numeric, volume_cbm numeric, check_digit_valid bool)
  - `discrepancies` (id uuid PK, shipment_id FK, owner uuid, severity text CHECK in ('red','amber'), field text, doc_a uuid, doc_b uuid, value_a text, value_b text, message text, resolved bool default false)
  - `events` (id, owner, type, payload jsonb, created_at) — audit trail
  - `subscriptions` (owner uuid PK, paddle_customer_id, paddle_sub_id, status, plan, current_period_end, updated_at)
- RLS: every table `owner = auth.uid()` for select/insert/update/delete; service role bypass for webhooks. Write RLS tests (SQL) that prove cross-user reads fail.
- Auth: Supabase magic link + Google OAuth. Anonymous parse flow: first doc parses without auth, held in memory/sessionStorage; on signup, persist.
- Storage bucket `docs` (private) + signed-URL upload from browser; path `userId/docId/page-N.jpg`.

### M3 — AI layer (lib/ai/)
- `router.ts`: single `parseDocument(images[], docTypeHint?)` entry. Fetch to `https://openrouter.ai/api/v1/chat/completions`, model `google/gemma-4-26b-a4b-it` (VERIFY exact slug on the OpenRouter model page at build time), body includes:
  `provider: { quantizations: ["fp8","bf16"], sort: "throughput", allow_fallbacks: true }`, `stream: true`, structured JSON via response_format json_schema (fallback: strict prompt + robust JSON repair parse).
- Config via env/constants: MODEL_PRIMARY and MODEL_ESCALATION; both are Gemma 4 models routed through OpenRouter.
- Pipeline per document: (1) doc-type detection+extraction in ONE call (schema includes `detected_type`), (2) stream partial JSON → push field updates to client via SSE, (3) run validators server-side on final JSON, (4) if ≥3 critical fields empty OR JSON invalid → one escalation retry, (5) persist fields+validation, insert containers rows.
- Prompts in `lib/ai/prompts/` as versioned template strings; system prompt defines maritime context + exact JSON schema + "copy strings EXACTLY as printed, do not correct spelling, use null when absent".

### M4 — Extraction schema (lib/ai/schemas/)
Shared sub-types: `Party {name, address, city, country, tax_id?}`, `PortRef {name, unlocode?}`, `Weight {value, unit}`, `LineItem {description, hs_code?, marks?, packages, package_type, net_kg?, gross_kg?, volume_cbm?, unit_price?, amount?, currency?}`, `ContainerRow {container_no, seal_no?, iso_type?, packages?, package_type?, gross_kg?, tare_kg?, volume_cbm?}`.
- BillOfLading: bl_number, scac?, carrier_name, shipper:Party, consignee:Party (+`to_order` bool), notify:Party?, vessel_name, imo_number?, voyage_no?, port_of_load:PortRef, port_of_discharge:PortRef, place_of_receipt?, place_of_delivery?, shipped_on_board_date?, issue_date?, issue_place?, freight_terms? ('prepaid'|'collect'), incoterm?, containers:ContainerRow[], cargo:LineItem[], total_packages?, total_gross_kg?, total_volume_cbm?, originals_count?, bl_type? ('original'|'seaway'|'telex'), clauses?:string[]
- CommercialInvoice: invoice_no, invoice_date, po_no?, seller:Party, buyer:Party, incoterm?, currency, line_items:LineItem[], subtotal?, freight_charge?, insurance?, total_amount, payment_terms?, lc_number?, country_of_origin?, bank_details?
- PackingList: pl_no?, date?, invoice_ref?, po_no?, seller:Party, buyer:Party, line_items:LineItem[] (with per-line cartons + dims {l,w,h,unit}?), total_cartons, total_net_kg, total_gross_kg, total_volume_cbm?, container_refs?:string[]
All types also carry `_meta: {detected_type, confidence_flags: string[], page_refs: Record<field, pageNo>}` where feasible.

### M5 — Validators (lib/validators/, pure functions + unit tests, ≥95% coverage here)
1. `containerCheckDigit(no)`: ISO 6346 algorithm (letter values skip multiples of 11; weights 2^pos; mod 11; 10→0). 
2. `imoChecksum(imo)`: 7 digits, sum(digit_i × (8−i)) last digit rule.
3. `unlocode(portName)`: fuzzy lookup against `data/unlocode.json` (ship a trimmed dataset of ~10k seaports; source: UNECE UN/LOCODE list, filter function=port; document provenance).
4. `weights(doc)`: Σ container gross ≈ total gross (±0.5%); gross ≥ net per line and total; CI vs PL totals when both present.
5. `dates(doc)`: shipped_on_board ≥ issue−30d and ≤ today+2d; invoice_date ≤ B/L date+tolerance when in same shipment.
6. `duplicates(owner, bl_number|invoice_no)` → warn.
7. `crossCheck(shipment)` → discrepancies rows: consignee/shipper name exact-normalized compare (case/whitespace/punct-insensitive; flag if Levenshtein>0 after normalize), container sets equality, port pairs, incoterm equality, weight totals, package counts, currency/amount CI-vs-LC (later). Severity: red = money/legal fields (parties, containers, amounts, ports), amber = the rest.
Validation output shape: `{field, rule, status:'pass'|'warn'|'fail', message, expected?, actual?}` stored in documents.validation.

### M6 — App screens (app/(app)/)
1. **Home**: recent docs, usage meter, time-saved counter (sum of docs × 12min baseline), Next Action cards.
2. **Scan**: dropzone + camera capture (getUserMedia; client edge-crop nice-to-have later), multi-page collector, client compression, upload → parse; streaming field feed UI.
3. **Review/[docId]** (Trust Screen): mobile = swipeable field cards (value + source-page thumbnail crop when page_refs present + state chip ✅/🟡/⚪ + inline edit); desktop = side-by-side. Save edits (audit in events). Bottom bar: Export / Generate / Add to Shipment.
4. **Shipments/[id]**: docs grouped (auto-link by bl_number/invoice refs), summary card, Shipment Check button → discrepancy report screen (red/amber list, per-item "which doc is right?" resolver writing corrections back).
5. **Search**: single box, server-side across bl_number, container_no, party names, vessel, ports, invoice_no (Postgres GIN on documents.fields jsonb + trigram on containers.container_no); filter chips.
6. **Account**: plan, usage, billing portal link (Paddle), data export, delete account.
Next Action Engine `lib/next-action/`: pure `suggest(shipment, docs, validation) → Action[]` with the rule set from planning (CI w/o PL → generate PL; draft B/L → run Shipment Check; parsed final B/L → track link + LFD reminder; discrepancy present → resolve first; etc.). Max 1 primary + 2 secondary per surface. Unit-test every rule.

### M7 — Exports & generation
- Excel: one sheet "Summary" (key fields vertical), one "Containers" (row per container), one "Lines". CSV flat. JSON = fields verbatim. PDF Summary Report: branded one-pager, validation badge strip, QR/share link (public read-only route with unguessable token, revocable).
- Generation (lib/generate/): CI→PL, PL→CI, (CI|PL|B/L)→Shipping Instructions draft. Deterministic mapping from parsed fields into template render (same components as public template pages); consistency guaranteed by construction; user edits before PDF download. Watermark on free plan.

### M8 — Public SEO surface (per the separate SEO site design doc — implement exactly)
- Parser landing pages, /templates hub + 11 fillable template pages (live web form, auto totals/CBM, PDF download, XLSX/DOCX static downloads), and /tools hub with deterministic CBM, container-load, ISO 6346, UN/LOCODE, chargeable-weight, LCL W/M, and demurrage/detention calculators. FAQPage/HowTo/Breadcrumb schema, sitemap.xml, robots (app disallow), OG image generation, canonical, and per-page metadata.
- Tool pages work with zero login; each has "auto-fill from your document" CTA into /app.

### M9 — Monetization + hardening + launch
- Plans: Free (5 docs/mo, watermarked exports) / Pro $19/mo or $190/yr (200 docs, no watermark, generation, Shipment Check unlimited) / Top-up packs. (Owner confirms final pricing before Paddle catalog creation.)
- Paddle: checkout overlay client-side; webhook `/api/webhooks/paddle`: verify signature with PADDLE_WEBHOOK_SECRET, idempotency via event_id unique table, handle subscription.created/updated/canceled + transaction.completed → upsert subscriptions + reset/increment entitlements. All writes via service role. Extensive tests with sandbox events.
- Rate limits (per-IP anonymous parse: 2/day), file limits (≤15 pages, ≤20MB), Sentry wired, PostHog events (parse_started, parse_done, export, generate, check_run, upgrade_shown, upgraded), PWA manifest + install prompt after 2nd parse, Lighthouse mobile ≥90 all categories on marketing pages.
- Production deploy on gainingdocx.com via Cloudflare; secrets via wrangler; smoke tests; Search Console + sitemap submission.

## 4. FOLDER STRUCTURE
(as agreed) app/(marketing), app/(app), app/api/{parse,export,generate,webhooks/paddle}; components/{ui,scan,review,tools,templates}; lib/{ai/{router,prompts,schemas},validators,next-action,export,generate,paddle,supabase}; data/{unlocode.json,container-types.json,incoterms.json}; supabase/migrations; public/.

## 5. WORKING AGREEMENT FOR CLAUDE CODE
- One milestone per session where possible; end each with: build passes, tests pass, deploy preview, git commit + push, and a short "what I did / what you must do" note for the owner (a beginner — give exact click-paths for any dashboard task).
- Ask before: adding any dependency not listed, changing schema after M2, anything involving payments money-flow.
- When docs/APIs may have changed (OpenRouter slug, opennext config, Paddle API): check current official docs before writing code, do not rely on memory.
