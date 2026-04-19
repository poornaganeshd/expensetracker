import type { VercelRequest, VercelResponse } from "@vercel/node";

const DDL = `
CREATE TABLE IF NOT EXISTS report_schedules (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  frequency            TEXT        NOT NULL CHECK (frequency IN ('weekly','monthly','quarterly','custom')),
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
  status        TEXT        NOT NULL CHECK (status IN ('success','failed','retrying')),
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

ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS custom_days         INTEGER;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS send_hour           INTEGER NOT NULL DEFAULT 6;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_expenses    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_incomes     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS include_transfers   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS selected_categories JSONB;
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // No CRON_SECRET needed here — the Supabase personal access token IS the auth.
  // An attacker would need both a valid Supabase URL and the project owner's PAT.

  const { supabase_url, access_token } = (req.body ?? {}) as { supabase_url?: string; access_token?: string };
  if (!supabase_url || !access_token) {
    return res.status(400).json({ error: "supabase_url and access_token are required" });
  }

  // Extract project ref from https://{ref}.supabase.co
  const match = supabase_url.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/);
  if (!match) return res.status(400).json({ error: "Invalid Supabase URL — expected https://{ref}.supabase.co" });
  const ref = match[1];

  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`,
    },
    body: JSON.stringify({ query: DDL }),
  });

  if (!mgmtRes.ok) {
    const errorBody = await mgmtRes.text().catch(() => "(unreadable)");
    console.error(`[setup-user] Management API error: ${mgmtRes.status} — ${errorBody}`);
    return res.status(502).json({ error: "Supabase Management API rejected the request", detail: errorBody, status: mgmtRes.status });
  }

  console.log(`[setup-user] Tables created for project: ${ref}`);
  return res.status(200).json({ success: true, project: ref });
}
