# NOMAD Expense Tracker — CLAUDE.md

## Project overview

Personal finance tracker with a React frontend and Node.js serverless backend (Vercel). Data lives in the user's own Supabase instance. Supports expenses, income, transfers, recurring bills, split settlements, offline sync, receipt uploads, and scheduled email reports.

## Tech stack

- **Frontend:** React 19, Vite, Recharts
- **Backend:** TypeScript, Vercel serverless functions (`api/`)
- **Database:** Supabase (PostgreSQL) — user-hosted, credentials stored in localStorage
- **Image uploads:** Cloudinary
- **Email reports:** Nodemailer (Gmail SMTP)
- **Date utilities:** date-fns

## Project structure

```
src/
  App.jsx            # Main app — UI, state, Supabase CRUD, chart
  Routine.jsx        # Food & skincare tracker (separate tab)
  CredentialSetup.jsx
  ReceiptPicker.jsx
  components/
    TrendChart.jsx   # Recharts trend visualisation
  financeUtils.js    # Pure financial calculation functions (exported for testing)
  billReminders.js   # Bill due-date reminder logic
  credentials.js     # localStorage credential helpers
  currencyConverter.js
  offlineSync.js     # Offline queue, flush, deduplication
  receiptUpload.js   # Cloudinary image compression & upload
  main.jsx           # App entry point, SW registration

api/
  _shared.ts         # Shared helpers: Supabase client, email builder, CSV, scheduling
  send-now.ts        # POST endpoint — trigger an immediate report
  send-reports.ts    # Cron endpoint — send scheduled reports to all users
  setup-user.ts      # POST endpoint — provision Supabase tables for a new user
```

## Running the project

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Testing

These are **automated tests** — running `npm test` executes all 126 test cases automatically with no manual interaction. Vitest finds every `*.test.js` / `*.test.ts` file, runs each `it(...)` case, and reports pass/fail in the terminal.

**When to run them:**
- Before merging any change — catch regressions before they ship
- After refactoring — confirm behaviour is unchanged
- In CI — add `npm test` to a GitHub Actions workflow to validate every push automatically

**What they cover:** Unit tests for pure functions and utility modules (financial calculations, offline queue, credentials, currency conversion, bill reminders, backend scheduling logic). They test logic in isolation with mocked fetch and localStorage.

**What they don't cover:** Full UI interactions (clicking buttons, rendering screens). That would require an end-to-end tool like Playwright or Cypress.

Tests use **Vitest** with a **jsdom** environment.

```bash
npm test             # Run all tests once
npm run test:watch   # Watch mode
npm run test:coverage  # Run with v8 coverage report
```

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

## Key source conventions

- `financeUtils.js` contains all pure financial calculations (`roundMoney`, `distributeAmount`, recurring due-date logic, etc.). Keep this file free of side effects — no localStorage, no fetch.
- Supabase writes go through `sendSupabaseRequest` in `offlineSync.js`, which handles offline queuing automatically.
- Credentials (Supabase URL + anon key) are read from localStorage via `getCredentials()` at module load time in `App.jsx`. Build-time env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are fallbacks.
- The API (`api/`) uses CommonJS (`"type": "commonjs"` in `api/package.json`) while the frontend uses ESM (`"type": "module"` in the root `package.json`). Do not mix them.
