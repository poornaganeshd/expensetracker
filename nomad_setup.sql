-- ============================================================
-- NOMAD — Full Database Setup
-- Supabase → SQL Editor → New query → paste all → Run
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS columns)
-- ============================================================


-- ── 1. CORE TABLES (everyone runs this) ─────────────────────

CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT    PRIMARY KEY,
  amount      NUMERIC,
  "categoryId" TEXT,
  "walletId"  TEXT,
  note        TEXT,
  date        TEXT,
  "eventId"   TEXT,
  "groupId"   TEXT,
  receipt_url TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id         TEXT    PRIMARY KEY,
  amount     NUMERIC,
  "sourceId" TEXT,
  "walletId" TEXT,
  note       TEXT,
  date       TEXT,
  receipt_url TEXT
);

CREATE TABLE IF NOT EXISTS transfers (
  id           TEXT    PRIMARY KEY,
  amount       NUMERIC,
  "fromWallet" TEXT,
  "toWallet"   TEXT,
  note         TEXT,
  date         TEXT
);

CREATE TABLE IF NOT EXISTS settlements (
  id          TEXT    PRIMARY KEY,
  amount      NUMERIC,
  "splitName" TEXT,
  "splitId"   TEXT,
  direction   TEXT,
  "walletId"  TEXT,
  date        TEXT,
  "groupId"   TEXT,
  "eventId"   TEXT
);

CREATE TABLE IF NOT EXISTS splits (
  id        TEXT    PRIMARY KEY,
  name      TEXT,
  amount    NUMERIC,
  direction TEXT,
  settled   BOOLEAN,
  "eventId" TEXT,
  "groupId" TEXT
);

CREATE TABLE IF NOT EXISTS recurring (
  id                TEXT    PRIMARY KEY,
  name              TEXT,
  amount            NUMERIC,
  "categoryId"      TEXT,
  "categoryName"    TEXT,
  "walletId"        TEXT,
  frequency         TEXT,
  "dayOfMonth"      INTEGER,
  "intervalDays"    INTEGER,
  "yearMonth"       INTEGER,
  "yearDay"         INTEGER,
  "startDate"       TEXT,
  active            BOOLEAN,
  "lastPaidDate"    TEXT,
  "lastSkippedDate" TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id     TEXT PRIMARY KEY,
  name   TEXT,
  emoji  TEXT,
  date   TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  wallet_id TEXT    PRIMARY KEY,
  balance   NUMERIC
);

ALTER TABLE expenses        DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements     DISABLE ROW LEVEL SECURITY;
ALTER TABLE splits          DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring       DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances DISABLE ROW LEVEL SECURITY;

ALTER TABLE expenses        REPLICA IDENTITY DEFAULT;
ALTER TABLE incomes         REPLICA IDENTITY DEFAULT;
ALTER TABLE transfers       REPLICA IDENTITY DEFAULT;
ALTER TABLE settlements     REPLICA IDENTITY DEFAULT;
ALTER TABLE splits          REPLICA IDENTITY DEFAULT;
ALTER TABLE recurring       REPLICA IDENTITY DEFAULT;
ALTER TABLE events          REPLICA IDENTITY DEFAULT;
ALTER TABLE wallet_balances REPLICA IDENTITY DEFAULT;


-- ── 2. EMAIL REPORTS TABLES (everyone runs this) ─────────────

CREATE TABLE IF NOT EXISTS report_schedules (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  frequency            TEXT        NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'custom')),
  custom_days          INTEGER,
  send_hour            INTEGER     NOT NULL DEFAULT 6 CHECK (send_hour BETWEEN 0 AND 23),
  include_expenses     BOOLEAN     NOT NULL DEFAULT true,
  include_incomes      BOOLEAN     NOT NULL DEFAULT true,
  include_transfers    BOOLEAN     NOT NULL DEFAULT false,
  selected_categories  JSONB,
  next_send_at         TIMESTAMPTZ NOT NULL,
  last_sent_at         TIMESTAMPTZ,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS report_delivery_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID        REFERENCES report_schedules(id) ON DELETE CASCADE,
  user_id       TEXT        NOT NULL,
  status        TEXT        NOT NULL CHECK (status IN ('success', 'failed', 'retrying')),
  attempted_at  TIMESTAMPTZ DEFAULT NOW(),
  period_start  DATE        NOT NULL,
  period_end    DATE        NOT NULL,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_due
  ON report_schedules (next_send_at)
  WHERE is_active = true;

ALTER TABLE report_schedules    DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_delivery_log DISABLE ROW LEVEL SECURITY;

-- Safe column additions if upgrading from older schema
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS custom_days          INTEGER;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS send_hour            INTEGER NOT NULL DEFAULT 6;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_expenses     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_incomes      BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_transfers    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS selected_categories  JSONB;


-- ── 3. USER REGISTRY (owner's Supabase only) ─────────────────
-- This table lives only in the app owner's Supabase.
-- It lets the cron job discover all users and send their reports.
-- Friends do NOT need this table — skip if you are a friend/user.

CREATE TABLE IF NOT EXISTS user_registry (
  supabase_url  TEXT        PRIMARY KEY,
  anon_key      TEXT        NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_registry DISABLE ROW LEVEL SECURITY;
