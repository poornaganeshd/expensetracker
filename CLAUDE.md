# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NOMAD** is a personal finance tracker (expenses, income, transfers, recurring bills, splits) with an optional daily-routine sub-app. It is a React 19 + Vite SPA deployed on Vercel, backed by the user's own Supabase project (BYODB model — no central data store).

## Tech stack

- **Frontend:** React 19, Vite, Recharts
- **Backend:** TypeScript, Vercel serverless functions (`api/`)
- **Database:** Supabase (PostgreSQL) — user-hosted, credentials stored in localStorage
- **Image uploads:** Cloudinary
- **Email reports:** Nodemailer (Gmail SMTP)
- **Date utilities:** date-fns

## Commands

```bash
# Development
npm run dev          # Start Vite dev server with HMR

# Build
npm run build        # Production build → dist/

# Lint
npm run lint         # ESLint (JS/JSX only — no TypeScript checker for src/)

# Preview built app
npm run preview

# Test
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run test:coverage  # Run tests with v8 coverage report
```

## Testing

These are **automated tests** — running `npm test` executes all 126 test cases automatically with no manual interaction. Vitest finds every `*.test.js` / `*.test.ts` file, runs each `it(...)` case, and reports pass/fail in the terminal.

**When to run them:**
- Before merging any change — catch regressions before they ship
- After refactoring — confirm behaviour is unchanged
- In CI — add `npm test` to a GitHub Actions workflow to validate every push automatically

**What they cover:** Unit tests for pure functions and utility modules (financial calculations, offline queue, credentials, currency conversion, bill reminders, backend scheduling logic). They test logic in isolation with mocked fetch and localStorage.

**What they don't cover:** Full UI interactions (clicking buttons, rendering screens). That would require an end-to-end tool like Playwright or Cypress.

Tests use **Vitest** with a **jsdom** environment (configured in `vite.config.js` under the `test` key). Coverage is collected via `@vitest/coverage-v8`.

### Test file locations

| Source file | Test file |
|---|---|
| `src/financeUtils.js` | `src/__tests__/financeUtils.test.js` |
| `src/billReminders.js` | `src/__tests__/billReminders.test.js` |
| `src/credentials.js` | `src/__tests__/credentials.test.js` |
| `src/currencyConverter.js` | `src/__tests__/currencyConverter.test.js` |
| `src/offlineSync.js` | `src/__tests__/offlineSync.test.js` |
| `api/_shared.ts` | `api/__tests__/_shared.test.ts` |

### Testing conventions

- **localStorage** is provided by jsdom. Call `localStorage.clear()` in `beforeEach`.
- **fetch** is mocked with `global.fetch = vi.fn(...)`. Restore with `vi.restoreAllMocks()` in `afterEach`.
- **navigator.onLine** is set via `Object.defineProperty(navigator, 'onLine', { value: ..., configurable: true })`.
- **offlineSync.js** has module-level state (`listeners` Set, `syncInitialized` flag). Use `vi.resetModules()` + dynamic `import()` inside each test or `describe` block to get a clean module instance.
- **Fake timers** (`vi.useFakeTimers`) — always pair with `afterEach(() => vi.useRealTimers())`. When testing code that throws after all retry attempts, register `expect(promise).rejects` **before** calling `vi.runAllTimersAsync()` to avoid unhandled-rejection warnings.

## Architecture

### Credential / data flow

Each user brings their own Supabase project. On first run, `CredentialSetup.jsx` prompts for a Supabase project URL + anon key (and optional Cloudinary details). These are saved to `localStorage` under the key `nomad-credentials` via `src/credentials.js`. The main app (`App.jsx`) reads them at module load time — `localStorage` credentials take priority over `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars.

### Frontend (`src/`)

- **`App.jsx`** — Single large component (~2 000+ lines) that owns all state and renders the entire app. It contains inline helper functions (`sbGet`, `sbWrite`, `sbUpsert`, `sbDelete`), all date utilities, inline SVG icon components (`DI2`, `Lion`, `LionM`), and every view (expenses, income, transfers, recurring, splits, settings, reports). Avoid splitting it into separate files without a clear need — the current design is intentional.
- **`Routine.jsx`** — Self-contained sub-app for daily food/skincare/habit tracking, accessible from a tab in the main app.
- **`CredentialSetup.jsx`** — Shown in place of the main app when no credentials exist. Also reachable from Settings.
- **`ReceiptPicker.jsx`** — Receipt photo capture/picker for attaching to transactions.
- **`components/TrendChart.jsx`** — Recharts-based spending trend chart.

### Support modules (`src/`)

| File | Purpose |
|---|---|
| `credentials.js` | Read/write Supabase + Cloudinary creds from localStorage |
| `offlineSync.js` | Write-ahead queue for Supabase mutations; replays on reconnect |
| `billReminders.js` | Computes due/upcoming recurring bills for toast reminders |
| `receiptUpload.js` | Compresses images (canvas, 800px / 70% JPEG) then uploads to Cloudinary |
| `currencyConverter.js` | Fetches INR exchange rates (daily-cached in localStorage) |
| `financeUtils.js` | Shared math/date helpers (`roundMoney`, `localDateKey`, period utilities, `distributeAmount`) used across components and tests |

### Offline-first write path

All Supabase writes go through `sendSupabaseRequest` in `offlineSync.js`. If the device is offline or the server returns 5xx, the request is serialised into a localStorage queue (`nomad-sync-queue-v1`) and replayed when the browser comes back online or the tab regains visibility. Deduplication uses `dedupeKey` (e.g. `expenses:delete:<id>`) so repeated mutations collapse.

### Local backup

The full in-memory state is also persisted to `localStorage` key `nomad-v5` as a JSON snapshot and loaded on startup as a fallback when Supabase is unreachable.

### PWA

The app is a Progressive Web App. `public/sw.js` is a cache-first service worker (cache key `nomad-app-v9`) that pre-caches the app shell (`/`, `/manifest.json`, `/icon-192.png`, `/icon-512.png`) on install and serves stale-while-revalidate for navigation requests. `public/manifest.json` declares `display: standalone` so the app installs to the home screen. When updating the service worker, increment `CACHE_NAME` to invalidate old caches.

### Backend (`api/` — Vercel serverless)

| File | Route | Purpose |
|---|---|---|
| `send-reports.ts` | `POST /api/send-reports` (also Vercel cron at `0 2 * * *`) | Reads `user_registry` in the owner's Supabase, iterates all registered users, sends scheduled email reports via Gmail/nodemailer |
| `send-now.ts` | `POST /api/send-now` | Sends a report immediately for a single user (manual trigger from Settings) |
| `setup-user.ts` | `POST /api/setup-user` | Creates report tables in a user's Supabase via the Management API |
| `_shared.ts` | — | Shared utilities: Supabase helpers, period/schedule math, HTML/CSV email builders |

The cron sends email via Gmail (`GMAIL_USER` + `GMAIL_APP_PASSWORD` env vars). The `OWNER_SETUP.md` references Resend, but the current implementation uses nodemailer with Gmail.

### Database (Supabase)

`nomad_setup.sql` is idempotent — safe to re-run. Key tables:

- Core: `expenses`, `incomes`, `transfers`, `settlements`, `splits`, `recurring`, `events`, `wallet_balances`
- Email: `report_schedules`, `report_delivery_log`
- Owner-only: `user_registry` (maps user Supabase URLs for the cron)
- Routine sub-app: `daily_logs`, `user_config`

Row-level security is **disabled** on all tables — access control relies entirely on the anon key being kept private per-user.

### IDs

All record IDs are generated client-side: `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` (defined as `uid()` in `App.jsx`). There are no server-generated IDs.

### Amounts and currency

All monetary amounts are stored in **INR (₹)**. Foreign-currency input converts at fetch time using `currencyConverter.js`; the original currency + rate are stored separately in localStorage (`nomad-currency-meta`) keyed by transaction ID.

### Hardcoded data

Wallets (`WALLETS`), default expense categories (`DC`), income sources (`DI`), and recurring categories (`RC`) are defined as constants in `App.jsx`. Users can add custom categories/sources; these are stored in Supabase alongside transactions.

## Key source conventions

- `financeUtils.js` contains all pure financial calculations (`roundMoney`, `distributeAmount`, recurring due-date logic, etc.). Keep this file free of side effects — no localStorage, no fetch.
- Supabase writes go through `sendSupabaseRequest` in `offlineSync.js`, which handles offline queuing automatically.
- Credentials (Supabase URL + anon key) are read from localStorage via `getCredentials()` at module load time in `App.jsx`. Build-time env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are fallbacks.
- The API (`api/`) uses CommonJS (`"type": "commonjs"` in `api/package.json`) while the frontend uses ESM (`"type": "module"` in the root `package.json`). Do not mix them.

## ESLint

`no-unused-vars` is configured to ignore names matching `/^[A-Z_]/` — uppercase constants and component names are exempt. The lint config covers `**/*.{js,jsx}` only; TypeScript files in `api/` are not linted by this config.

## Deployment

Deploy target is Vercel. The cron schedule is defined in `vercel.json`. Required environment variables for the backend:

- `VITE_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Owner's Supabase (for `user_registry`)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — Gmail sender for reports
- `CRON_SECRET` — Shared secret to protect the cron endpoint from external callers

---

## Audit & Fix Log — May 2026

A full system audit was performed on `claude/caveman-feature-34gSb`. This section is the canonical record of what was found, fixed, ruled out, and what remains. Future sessions: **read this before re-investigating any of the items below.**

### A. Summary

| Metric | Count |
|---|---|
| Total findings in audit | ~100 |
| Verified false positives (already correct in code) | 6 |
| Fixed in this branch | 5 |
| Discovered during fix work (new) | 2 |
| Still open | ~90 |

| Commit | Track | Items |
|---|---|---|
| `7d7537f` | Track 1 — stop the bleeding | Cloudinary defaults, full localStorage nuke, `CRON_SECRET` verification |
| `8667faa` | Track 2 — money correctness | Recurring double-pay guard, `submitRec` validation |

### B. Fixes Completed

#### B.1 (`7d7537f`) Cloudinary defaults removed — `src/receiptUpload.js:30-32`

**Before** the file used `creds.cloudName || "df1vedbox"` and `creds.uploadPreset || "receipt_upload"`. Every user without their own Cloudinary creds was silently uploading receipts to the original developer's Cloudinary account. **After** both fields are required and the function throws a clear error if either is missing. `df1vedbox` and `receipt_upload` are no longer referenced anywhere.

#### B.2 (`7d7537f`) "Clear All Data" sweeps the whole namespace — `src/App.jsx:1418`

**Before** only `nomad-v5` and `nomad-rec-snooze` were cleared from localStorage. **After** every key matching `nomad-*` is removed except `nomad-credentials` (preserved so the user can keep using the app). The critical leak was `nomad-sync-queue-v1`, whose queued mutations would replay against the just-emptied database and recreate ghost rows. Also cleaned: `nomad-currency-meta`, `nomad-fx-rates`, `nomad-bill-reminders-*`, `nomad-last-seen-sent-*`.

#### B.3 (`7d7537f`) `CRON_SECRET` enforcement — `api/send-reports.ts:21`

Verified already in place: `if (!isVercelCron && authHeader !== \`Bearer ${CRON_SECRET}\` && querySecret !== CRON_SECRET) return 401`. **No code change needed.** Note: `api/send-now.ts` does **not** have an equivalent check — see open finding D.1.1.

#### B.4 (`8667faa`) Recurring "✓ Paid" double-click guard — `src/App.jsx:1273`

The "✓ Paid" button in the Dashboard's due-bills row had no debounce. A fast double-click (or lag-induced double-click) ran the handler twice before React rerendered to hide the button, creating two duplicate expense rows for one bill cycle. **After** the handler checks/sets `ev.currentTarget.disabled` at the top:

```js
onClick={(ev) => {
  if (ev.currentTarget.disabled) return;
  ev.currentTarget.disabled = true;
  const ok = addE({...});
  if (ok === false) { ev.currentTarget.disabled = false; return; }
  // ...state updates
}}
```

The button gets unmounted on the next render (since the recurring leaves the `due` array), so leaving `disabled = true` is harmless.

#### B.5 (`8667faa`) `submitRec` validates recurring inputs — `src/App.jsx:466`

**Before** only validated name and amount. Empty `intervalDays` for a custom-frequency bill became `Number("") = 0`, which made `getRecurringDueDate` return `null` — the bill saved but **never appeared anywhere** (silent failure). Same for empty `dayOfMonth`, `yearMonth`, `yearDay`. **After** `submitRec` requires:

- `rStart` (start date) non-empty
- `rFreq === "custom"` → `Number(rInt) >= 1`
- `rFreq === "monthly"` → `Number(rDay) ∈ [1, 31]`
- `rFreq === "yearly"` → `Number(rYM) ∈ [1, 12]` and `Number(rYD) ∈ [1, 31]`

Each failure surfaces a toast via the new `onError` prop on `AddPage` (line 419), wired from the parent's `showT` (call site at line 1286). `AddPage` is a sub-component, so it cannot reach the parent's `showT` directly — the prop is the only correct way.

### C. False Positives (audit was wrong — do NOT reopen)

These were flagged by the original audit but are correct in the existing code. Recorded here so we don't waste a future session re-investigating.

| # | Audit claim | Reality | Where |
|---|---|---|---|
| C.1 | `distributeAmount` front-loads the paisa unfairly | Working as designed — call site assigns position 0 to "you" deliberately so you absorb the rounding, not your friends | `App.jsx:698` |
| C.2 | Bill-split custom amounts can sum > total | Already blocked by `canSub`; UI shows "(over!)" warning | `App.jsx:701, 712` |
| C.3 | Bill-split with empty roster lets you submit | Already blocked by `canSub` requiring `validPpl.length > 0` | `App.jsx:701` |
| C.4 | Backdated balance check uses current balance | Already uses `balanceOnDate()` for backdated entries | `App.jsx:957-959` |
| C.5 | `parseFloat` NaN amounts silently dropped | `roundMoney(NaN) = 0` (because `NaN \|\| 0 → 0`); the `amt <= 0` guard catches and toasts "Enter a valid amount" | `App.jsx:946-947` |
| C.6 | `_shared.ts` IST→UTC offset is inverted | Math is correct: `istMin = send_hour*60 - 330` correctly converts IST→UTC. Variable name is misleading but the result is right (verified by hand: 6 AM IST → 00:30 UTC ✓) | `api/_shared.ts:65-69` |

### D. Discovered During Fix Work (new findings, not in original audit)

#### D.1.1 `api/send-now.ts` has no auth — open Gmail relay

`api/send-now.ts:13-18` accepts `supabase_url` and `anon_key` from the request body and uses the dev's Gmail to send a "NOMAD report" to whatever `email` is in that schedule. Anyone can:

1. Spin up their own Supabase project.
2. Create a `report_schedules` row with `email: victim@anywhere.com`.
3. POST to `/api/send-now` with their own creds.
4. The dev's Gmail relays a NOMAD-branded email to anyone — burning sender reputation, consuming the 500/day quota, providing free spam infrastructure.

**Fix direction:** validate the calling `supabase_url` against the owner's `user_registry` (using `SUPABASE_SERVICE_ROLE_KEY`) before processing, OR require a per-user token issued during onboarding.

#### D.1.2 7 vitest failures in `_shared.ts:getNextSendAt`

7 tests in `api/__tests__/_shared.test.ts` fail with messages like `expected 30 to be +0` for `next.getUTCMinutes()`. The IST conversion correctly produces UTC times offset by 30 minutes (because IST = UTC+5:30), so for whole-hour `send_hour` inputs, UTC minutes will be `30`, not `0`. Either the tests are stale (pre-IST) or the conversion is silently shifting send times by 30 minutes for everyone. **Pre-existing — these failures predate this branch.** Worth a 30-minute investigation in a future session.

### E. Open Findings — Full List

> Priority legend: **C** Critical · **H** High · **M** Medium · **L** Low

#### E.1 Security (~8 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **C** | RLS disabled on every table — anon key is the entire authentication boundary. Leaked URL+key = full data access | `nomad_setup.sql:95-102, 160-161, 187-188` | BYODB model assumes per-user isolation; document the threat model |
| **H** | `send-now.ts` has no auth (open Gmail relay) | `api/send-now.ts:13-18` | See D.1.1 |
| **H** | Cloudinary preset is unsigned — anyone learning the preset name can upload to your account | `receiptUpload.js:36-40` | Switch to signed uploads via a server endpoint that issues a signature |
| **H** | Anon key in localStorage — extension with `host_permissions` reads it | `credentials.js:7` | App has no XSS surface today (verified — no `innerHTML`/`dangerouslySetInnerHTML`/`eval`) but adding one is instant credential exfil |
| **M** | Email leakage via `report_schedules` lookup with anon key | `App.jsx:786` | Implied by RLS=off but worth noting |
| **M** | `setup-user.ts` regex accepts single-letter Supabase subdomains | `api/setup-user.ts:61` | `/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/` accepts `https://a.supabase.co` |
| **M** | Verify Management API token handling in `setup-user.ts` | `api/setup-user.ts` | Confirm token is server-only, never echoed to client; avoid logging |
| **L** | SW caches opaque responses without size guard | `public/sw.js:21-23` | A huge 3rd-party image evicts the app shell |

#### E.2 Sync / Offline (~10 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **H** | Dedupe loses operations | `offlineSync.js:46-48` | Two queued upserts with same `dedupeKey` → only the second is kept; if the first carried fields the second omits, those fields are lost on replay |
| **H** | `flushSyncQueue` aborts entire batch on first 5xx | `offlineSync.js:109-134` | Item 3/100 fails → items 4-100 stay queued forever; same head retried with no backoff |
| **H** | 4xx silently dropped — lost edit when row was deleted on another device | `offlineSync.js:124-126` | User never told. Surface as toast |
| **H** | `status === 0` treated as 5xx | `offlineSync.js:119` | CORS / DNS failure = infinite retry instead of user-visible error |
| **H** | No conflict detection — last-write-wins; no `updated_at` | `nomad_setup.sql` core tables | Add `updated_at TIMESTAMPTZ DEFAULT now()` + BEFORE UPDATE trigger; reject stale writes |
| **H** | User can clear localStorage with pending queue (incognito close, "Clear site data") | Browser-level | Surface pending-count + warn before destructive browser actions where possible |
| **M** | LocalStorage quota (~5MB cap) — `setItem` throws unhandled | `offlineSync.js:21` and other `setItem` calls | Wrap in try/catch; surface a "storage full" toast |
| **M** | Two tabs / two devices have no cross-tab sync | App-wide | No `BroadcastChannel`/`storage` event listener — tab B writes back stale state |
| **M** | Visibility-change flush is a thundering herd | `offlineSync.js:151-153` | 50 queued items → 50 sequential requests with no backoff |
| **M** | No request timeout in `performRequest` | `offlineSync.js:60-65` | Flaky network → spinner for full network timeout (~120s mobile). Use `AbortController` |

#### E.3 Date / Timezone (~9 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **H** | Routine streak: today's points don't count until 2+ are logged | `Routine.jsx:3303-3305` | Logging morning water at 6 AM still shows yesterday's streak — users disengage |
| **H** | Routine streak silently capped at 365 | `Routine.jsx:3307` | 400-day streak shows as 365 forever. Show "365+" or remove cap |
| **H** | Timezone-tied date keys, no anchor stored | `Routine.jsx:2436`, `financeUtils.js:3-9` | Travel Mumbai→Tokyo flips a day forward; back trip overwrites. No `tzOffset` stored per record |
| **H** | Yearly recurring on the 31st clamps to Feb 28/29 silently | `financeUtils.js:14-15, 38-46` | Either document or add a "skip month" toggle |
| **H** | Cached FX rates expire on calendar boundary, not 24h | `currencyConverter.js:32` | Fetched at 09:00, used at 23:59 same day → 14h59 stale, no warning. No `fetchedAt` stored |
| **M** | `fullMonthsBetween` off-by-one with month-end starts | `financeUtils.js:17-21` | Start = Jan 31, today = Mar 30 → returns 1, not 2. Affects 31st-rent edge cases |
| **M** | Reminder dedup keyed on raw `todayStr` (local) | `billReminders.js:13-15` | Crossing date line at midnight may re-fire today's reminders |
| **M** | `report_schedules.send_day_of_month` UI capped at 28 | `nomad_setup.sql:122-123`, `_shared.ts:58, 61` | User wanting 30th gets 28th silently |
| **L** | DST edges in offset-naive math | `Routine.jsx:2447` | `new Date(year, month, i)` lacks the noon anchor used elsewhere in `financeUtils.js` |

#### E.4 Backend / Cron Scale (~7 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **C** | Cron is O(N) sequential, bound to one Vercel invocation | `send-reports.ts:47` | At 1M users, no chance. Re-architect to fan-out via Inngest / QStash / Vercel Queue / pg_cron |
| **H** | Gmail SMTP capped at 500/day | `send-reports.ts:30` | Past ~500 users on the same day, cron silently errors out for remaining users. Move to Resend (`OWNER_SETUP.md` already mentions it) |
| **H** | `processSchedule` fetches *all* expenses/incomes/transfers (not just period) for the backup attachment | `_shared.ts:148-155` | 10 years of data → multi-MB attachment, slow Supabase fetch, may bounce on size limits |
| **M** | `byCategory` aggregation uses opaque `categoryId` — CSV recipients see `food_abc` instead of "Food & Drinks" | `_shared.ts:161-162` | Use the available `categoryName` column |
| **M** | `user_registry` read in full each cron tick — no `next_send_at <= now()` filter | `send-reports.ts:33` | Add server-side filter + index on `next_send_at` |
| **M** | Per-user Supabase cold start can time out | Free-tier projects pause after 7 days idle | Cap concurrent cold-starts; surface "your project is paused" warning |
| **M** | Single-tenant DB → can't grep production at scale | Architectural | Plan opt-in anonymized telemetry channel |

#### E.5 Architecture / Performance (~10 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **H** | `App.jsx` is 1470 lines; near-minified one-line-per-block style | `App.jsx` whole file | Diff review is impossible (CLAUDE.md says "intentional"; cost is rising). Split along screen boundaries |
| **H** | `Routine.jsx` reads entire `allData` JSONB blob on every read/write | `nomad_setup.sql:175-179`, `Routine.jsx` | 3 years × ~1KB/day = 1MB+ per read. Migrate to one row per `(user_id, date)` |
| **H** | No `updated_at` columns on core tables | `nomad_setup.sql:7-93` | Required for conflict detection, incremental sync, audit trail |
| **H** | `wallet_balances` is a denormalized cache with no integrity invariant | `nomad_setup.sql:90-93` | Two tabs both read balance, both decrement, both write — last write wins, ledger drifts |
| **H** | Settlements/recurring/splits issue multiple writes without rollback | `App.jsx` recurring & settlement flows | Crash mid-sequence → wallet balance, expense row, split row mutually inconsistent. Add a "Verify & repair" tool |
| **M** | `App.jsx` re-renders on every state change — no `useMemo`/`React.memo` on `TxCard`, no virtualization on history list | App-wide | Janky after 5+ years of data |
| **M** | `events.participants` JSONB unvalidated on read | `nomad_setup.sql:87`, `App.jsx:684-685` | Bad shape from API replay or external write crashes the client |
| **M** | Heatmap renders all expenses, no windowing | `App.jsx:240` (`Heatmap`) | Janky after 5+ years |
| **M** | Service worker cache version is manual | `public/sw.js:1` | Forget to bump → users stuck on old assets. Use `vite-plugin-pwa` for build-time hash |
| **L** | Receipt upload + transaction insert not coupled | Add-expense flow | Crash between → orphan blob in Cloudinary; retry → second blob |

#### E.6 Other Edge Cases (~20 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **H** | No soft delete / "Recently deleted" recovery | All tables | Misclick on a 6-month-old expense → gone forever. Add `deleted_at` + 30-day retention view |
| **H** | "Clear All Data" non-atomic across tables | `App.jsx:1418` | Mid-network nuke leaves 3/8 tables empty, others not. Wrap in a server-side function |
| **H** | Refund flow doesn't exist | App-wide | Returned purchase becomes "negative expense" or "fake income"; either choice corrupts category analytics |
| **M** | Skipped-vs-paid recurring not visually distinct | `financeUtils.js:60-66`, history UI | Audit pain |
| **M** | Deleting a category orphans expenses | App-wide | Future filters list ghost data; bills render as "Uncategorized" with no path back |
| **M** | Deleting a participant from a group event after a split | App-wide | Settlement math no longer balances; orphan owes nobody |
| **M** | Custom split with ₹0 participants | `App.jsx:703` | Saves no-op rows. Add per-participant `> 0` validation |
| **M** | Notes accept arbitrary unicode/length — 100KB clipboard paste lands in localStorage | App-wide | Add `maxLength` |
| **M** | UPI Lite cap math is string-comparison brittle | `App.jsx:964-966` | Malformed dates from API replay break cap logic silently |
| **M** | `getINRRate` hardcodes INR target | `currencyConverter.js:29-31` | Misleading API name if non-INR users ever supported |
| **M** | No timestamp on stored FX meta | `currencyConverter.js:45-51` | Can't determine rate freshness; backdated foreign reconciliation impossible |
| **M** | Single CDN dependency for FX rates (jsdelivr) | `currencyConverter.js:35` | jsdelivr down = total FX outage. Add a fallback provider |
| **M** | `uid()` collision risk under burst | `App.jsx:16`, `offlineSync.js:35` | 4 random base36 chars + ms; offline replay flush + rapid clicks can collide. Use `crypto.randomUUID()` |
| **M** | `uid` shadowed by `const` in two scopes | `App.jsx:784, 1078` | Same name, different meaning (random ID vs subdomain). Rename to `userKey` |
| **L** | Reminder cleanup deletes all old dates | `billReminders.js:13-15` | Travel-day edge: midnight purge resets reminder dedup, possibly re-firing today's bills |
| **L** | `JSON.stringify` loses precision past 2^53 | `App.jsx:904` | Not relevant for INR; flagged for completeness |
| **L** | `report_schedules` UNIQUE on `user_id` | `nomad_setup.sql:117` | Only one schedule per user; can't have daily + weekly |
| **L** | `CredentialSetup` import doesn't validate JSON schema — only checks `d.sbUrl && d.sbKey` truthiness | `CredentialSetup.jsx:264` | Empty values pass |
| **L** | Streak gaming: edit `allData` JSON directly in Supabase | `Routine.jsx` data model | If you care about streak integrity, lock past days after midnight |
| **L** | Splits with imaginary friends (no identity check) | App-wide | Cosmetic risk only |

#### E.7 UX / Human Behavior (~10 open)

| Pri | Finding | Location | Notes |
|---|---|---|---|
| **H** | First-run friction is the #1 growth blocker — Supabase signup → SQL paste → URL/key copy → Cloudinary signup → preset config | `CredentialSetup.jsx` | Drop-off probably >80%. Build "demo data" mode + 3-screen guided onboarding |
| **H** | Routine Day-1 streak confusion (see E.3) | `Routine.jsx:3303-3305` | First action of the day shows yesterday's streak — feels broken |
| **H** | Backdating an expense rejected on insufficient *current* balance is misleading | `App.jsx:960` | Already uses `balanceOnDate` (correct) but error message could explain what happened |
| **H** | No quick-entry / templates for repeat transactions | App-wide | Daily ₹120 metro fare = 5 taps every day forever. Suggest last-N |
| **H** | Long expense entry form (5+ fields) | `App.jsx` AddPage | Compare Splitwise's two-tap flow |
| **M** | Receipt upload gated on Cloudinary setup — skip Cloudinary → no receipts ever | `App.jsx`, `receiptUpload.js` | Fall back to local-blob persistence with quota warning |
| **M** | "Wallet" terminology — `upi_lite`, `bank`, `cash` — unexplained | `App.jsx:86` | New user has no idea what "UPI Lite" is or why its cap is special-cased |
| **M** | Splits vs Settlements vs Events overlap conceptually | App-wide | No in-app explanation of the model |
| **M** | No empty-state guidance | App-wide | First open with no data shows blank pages |
| **M** | No tutorial / sample data toggle | App-wide | New users can't understand "Splits" without committing real data |
| **M** | Unsaved form state lost on tab switch | App-wide | Half-typed expense + notification → text gone |
| **L** | No undo on destructive actions | App-wide | Long-press delete → gone. Toast lacks "Undo" |

#### E.8 Product Gaps (~25 open)

> These are features competing apps ship that this app doesn't. Each is a feature, not a bug.

##### Table-stakes (HIGH)

| Pri | Feature | Notes |
|---|---|---|
| **H** | Budgets / per-category caps with progress + alerts | The #1 feature of every expense tracker; blocking adoption |
| **H** | CSV / PDF in-app export | Currently only via emailed report |
| **H** | CSV import (bank statements) | #1 reason expense apps die: hand-keying. Map HDFC/ICICI/SBI export formats |
| **H** | Transaction full-text search across years | History tab filter only covers current visible window |
| **H** | UI to manage hardcoded wallets/categories/sources | `WALLETS`, `DC`, `DI`, `RC` are constants in `App.jsx`. Custom-add exists but defaults can't be deleted/renamed |
| **H** | "Demo data" mode for new users | Lets them explore without committing |
| **H** | Multi-account / family sharing | Splits exist as personal IOUs, not a shared ledger |

##### Power user (MEDIUM)

| Pri | Feature | Notes |
|---|---|---|
| **M** | Rules / autocategorize from merchant text | Splitwise, Walnut do this |
| **M** | Tags (orthogonal to categories) | "Groceries for trip" vs "groceries normal" |
| **M** | PDF/non-image attachments | Statements, bills |
| **M** | Multi-currency display (drop INR hardcode) | Show original + INR |
| **M** | Subscription detection (auto-find recurring from history) | One-tap promote-to-recurring |
| **M** | Month-over-month / merchant frequency / spending projections | Beyond `TrendChart` + heatmap |
| **M** | Undo affordance on toasts | Critical for delete actions |
| **M** | Bulk operations (multi-select delete/edit) | History tab |

##### Retention (MEDIUM)

| Pri | Feature | Notes |
|---|---|---|
| **M** | "You haven't logged in 3 days" reminder | Push or email |
| **M** | Streak for the finance side | Routine has one; expenses don't |
| **M** | In-app insights (push) summary | Cheaper and faster than email |
| **M** | Inline category drilldowns | "Tap a category to see top merchants" |

### F. Recommended Sequence (next sessions)

| # | Track | Effort | Items |
|---|---|---|---|
| 1 | **Security** | ½ day | D.1.1 (`send-now.ts` auth), E.1#3 (signed Cloudinary uploads), E.1#6 (`setup-user.ts` regex) |
| 2 | **Sync hygiene** | ½ day | E.2#4 (`status === 0` not 5xx), E.2#3 (4xx-drop toast), E.2#10 (`AbortController` timeout), E.2#7 (quota guard), E.2#9 (exponential backoff on flush) |
| 3 | **Data integrity migration** | 1 day | E.5#3 (`updated_at` columns + trigger), E.5#5 ("Verify & repair wallet balances" tool) |
| 4 | **Routine streak fixes** | 2 hours | E.3#1 (count today's points immediately), E.3#2 (show "365+"), document/decide travel-day behavior |
| 5 | **Soft delete + recovery** | 1 day | E.6#1 (`deleted_at` columns), "Recently deleted" view in Settings (30-day retention) |
| 6 | **Onboarding overhaul** | 2 days | E.7#1, E.7#9, E.7#10, E.8 "Demo data" mode |
| 7 | **Cron fan-out** | 1 day | E.4#1 (Inngest/QStash/pg_cron with retries + dead-letter) |
| 8 | **Budgets + CSV export/import** | 2-3 days | E.8 top 3 — single biggest product gap |
| 9 | **Split `App.jsx`** | 1-2 days | E.5#1 — reformat into multi-line, then split along screen boundaries; add `React.memo` on hot components |
| 10 | **End-to-end tests with Playwright** | 1 day | Smoke tests on the 5 critical user flows |

### G. Quick Reference — Open Findings by File

| File | Open findings |
|---|---|
| `src/App.jsx` | uid collision (`:16`), uid shadowing (`:784, :1078`), event participant validation (`:684-685`), JSON.stringify precision (`:904`), UPI Lite string-compare (`:964-966`), reportSchedule email leak (`:786`), heatmap windowing (`:240`), 1470-line monolith |
| `src/Routine.jsx` | streak today rule (`:3303-3305`), 365 cap (`:3307`), TZ anchor (`:2436`), DST anchor (`:2447`), JSONB blob model |
| `src/financeUtils.js` | yearly 31st clamp (`:14-15, :38-46`), monthly off-by-one (`:17-21`) |
| `src/offlineSync.js` | dedupe data loss (`:46-48`), batch abort (`:109-134`), 4xx silent drop (`:124-126`), `status===0` (`:119`), no timeout (`:60-65`), thundering herd (`:151-153`), no quota guard (`:21`), uid collision (`:35`) |
| `src/billReminders.js` | reminder dedup TZ (`:13-15`) |
| `src/currencyConverter.js` | INR hardcoded (`:29-31`), calendar-day cache (`:32`), no `fetchedAt` (`:45-51`), single CDN (`:35`) |
| `src/credentials.js` | anon key in localStorage (`:7`) |
| `src/receiptUpload.js` | unsigned Cloudinary (`:36-40`) |
| `src/CredentialSetup.jsx` | import doesn't validate (`:264`) |
| `api/_shared.ts` | full-data fetch (`:148-155`), `categoryId` in CSV (`:161-162`), `send_day_of_month` clamp (`:58, :61`) |
| `api/send-reports.ts` | sequential cron (`:47`), Gmail 500/day (`:30`), full registry read (`:33`) |
| `api/send-now.ts` | **no auth** (`:13-18`) |
| `api/setup-user.ts` | loose regex (`:61`), token handling |
| `nomad_setup.sql` | RLS disabled everywhere (`:95-102, :160-161, :187-188`), no `updated_at`, `wallet_balances` no integrity, `events.participants` unvalidated, schedule UNIQUE on user_id (`:117`), `send_day_of_month` max 28 (`:122-123`), `daily_logs` JSONB blob model (`:175-179`) |
| `public/sw.js` | manual cache version (`:1`), opaque cache no size guard (`:21-23`) |
| `api/__tests__/_shared.test.ts` | 7 failing tests on `getNextSendAt` (pre-existing, see D.1.2) |

### H. Notes for Future Claude Sessions

1. **Do not re-investigate the items in section C (false positives).** They are correct in the existing code.
2. **Always run `npm run lint` and `npm test` before and after edits.** Baselines: 67 lint errors, 119 tests pass / 7 fail (the 7 failures are pre-existing in `_shared.test.ts:getNextSendAt`).
3. **`App.jsx` and `Routine.jsx` are written one-line-per-JSX-block.** When editing, use a unique substring as `old_string` — do **not** attempt to reformat. The build will break.
4. **`dist/` is gitignored but historically tracked.** Don't commit rebuilt `dist/` unless explicitly asked; Vercel rebuilds on push.
5. **`AddPage` is a sub-component** (line 419) without direct access to the main `App` state. Pass callbacks (like `onError`) as props rather than reaching for global state.
6. **Sync queue is the riskiest data structure.** Anything that mutates `nomad-sync-queue-v1` or replays it must be idempotent and must surface failures to the user. Silent drops are how data is lost.
7. **The 7 failing IST tests** in `_shared.test.ts` are pre-existing. Do not "fix" them by modifying production code without first confirming whether the production behavior or the test is wrong (see D.1.2).
