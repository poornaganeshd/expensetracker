-- NOMAD — Supabase Table Setup
-- Run this entire script in your Supabase project → SQL Editor → New query → Run
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  amount NUMERIC,
  "categoryId" TEXT,
  "walletId" TEXT,
  note TEXT,
  date TEXT,
  "eventId" TEXT,
  "groupId" TEXT,
  receipt_url TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  amount NUMERIC,
  "sourceId" TEXT,
  "walletId" TEXT,
  note TEXT,
  date TEXT,
  receipt_url TEXT
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  amount NUMERIC,
  "fromWallet" TEXT,
  "toWallet" TEXT,
  note TEXT,
  date TEXT
);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  amount NUMERIC,
  "splitName" TEXT,
  "splitId" TEXT,
  direction TEXT,
  "walletId" TEXT,
  date TEXT,
  "groupId" TEXT,
  "eventId" TEXT
);

CREATE TABLE IF NOT EXISTS splits (
  id TEXT PRIMARY KEY,
  name TEXT,
  amount NUMERIC,
  direction TEXT,
  settled BOOLEAN,
  "eventId" TEXT,
  "groupId" TEXT
);

CREATE TABLE IF NOT EXISTS recurring (
  id TEXT PRIMARY KEY,
  name TEXT,
  amount NUMERIC,
  "categoryId" TEXT,
  "categoryName" TEXT,
  "walletId" TEXT,
  frequency TEXT,
  "dayOfMonth" INTEGER,
  "intervalDays" INTEGER,
  "yearMonth" INTEGER,
  "yearDay" INTEGER,
  "startDate" TEXT,
  active BOOLEAN,
  "lastPaidDate" TEXT,
  "lastSkippedDate" TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT,
  emoji TEXT,
  date TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  wallet_id TEXT PRIMARY KEY,
  balance NUMERIC
);

-- Allow full access via the anon (public) key — NOMAD uses no user auth
ALTER TABLE expenses        DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements     DISABLE ROW LEVEL SECURITY;
ALTER TABLE splits          DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring       DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances DISABLE ROW LEVEL SECURITY;

-- Allow upsert (insert + update on conflict)
ALTER TABLE expenses        REPLICA IDENTITY DEFAULT;
ALTER TABLE incomes         REPLICA IDENTITY DEFAULT;
ALTER TABLE transfers       REPLICA IDENTITY DEFAULT;
ALTER TABLE settlements     REPLICA IDENTITY DEFAULT;
ALTER TABLE splits          REPLICA IDENTITY DEFAULT;
ALTER TABLE recurring       REPLICA IDENTITY DEFAULT;
ALTER TABLE events          REPLICA IDENTITY DEFAULT;
ALTER TABLE wallet_balances REPLICA IDENTITY DEFAULT;
