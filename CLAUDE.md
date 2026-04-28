# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NOMAD** is a personal finance tracker (expenses, income, transfers, recurring bills, splits) with an optional daily-routine sub-app. It is a React 19 + Vite SPA deployed on Vercel, backed by the user's own Supabase project (BYODB model — no central data store).

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

Tests use **Vitest** with a jsdom environment (configured in `vite.config.js` under the `test` key). Test files live in `src/__tests__/` (JS/JSX modules) and `api/__tests__/` (TypeScript API). Coverage is collected via `@vitest/coverage-v8`.

| Test file | What it covers |
|---|---|
| `src/__tests__/billReminders.test.js` | `billReminders.js` — due/upcoming recurring-bill logic |
| `src/__tests__/credentials.test.js` | `credentials.js` — localStorage credential read/write |
| `src/__tests__/currencyConverter.test.js` | `currencyConverter.js` — exchange-rate fetch + cache |
| `src/__tests__/financeUtils.test.js` | Date/finance utility helpers |
| `src/__tests__/offlineSync.test.js` | `offlineSync.js` — write-ahead queue and replay |
| `api/__tests__/_shared.test.ts` | `api/_shared.ts` — shared report/email utilities |

The `api/` directory is TypeScript (`@vercel/node` serverless functions). It has its own `package.json` (`"type": "commonjs"`). The TypeScript in `api/` is compiled by Vercel at deploy time — there is no local tsc build step for it.

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

### Offline-first write path

All Supabase writes go through `sendSupabaseRequest` in `offlineSync.js`. If the device is offline or the server returns 5xx, the request is serialised into a localStorage queue (`nomad-sync-queue-v1`) and replayed when the browser comes back online or the tab regains visibility. Deduplication uses `dedupeKey` (e.g. `expenses:delete:<id>`) so repeated mutations collapse.

### Local backup

The full in-memory state is also persisted to `localStorage` key `nomad-v5` as a JSON snapshot and loaded on startup as a fallback when Supabase is unreachable.

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

## ESLint

`no-unused-vars` is configured to ignore names matching `/^[A-Z_]/` — uppercase constants and component names are exempt. The lint config covers `**/*.{js,jsx}` only; TypeScript files in `api/` are not linted by this config.

## Deployment

Deploy target is Vercel. The cron schedule is defined in `vercel.json`. Required environment variables for the backend:

- `VITE_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Owner's Supabase (for `user_registry`)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — Gmail sender for reports
- `CRON_SECRET` — Shared secret to protect the cron endpoint from external callers
