import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import {
  makeHeaders, userGet, userPatch, userPost,
  withRetry, getPeriod, getNextSendAt, processSchedule,
} from "./_shared.js";
import type { UserEntry, Schedule } from "./_shared.js";

const REGISTRY_URL = process.env.VITE_SUPABASE_URL!;
const REGISTRY_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET  = process.env.CRON_SECRET!;
const GMAIL_USER   = process.env.GMAIL_USER!;
const GMAIL_PASS   = process.env.GMAIL_APP_PASSWORD!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader  = req.headers.authorization ?? "";
  const querySecret = (req.query?.secret as string) ?? "";
  const isVercelCron = req.headers["x-vercel-cron"] === "1";

  if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ error: "GMAIL_USER or GMAIL_APP_PASSWORD is not set" });
  }

  const now         = new Date();
  const nowIso      = now.toISOString();
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
  const results: { user: string; scheduleId: string; status: string; error?: string }[] = [];

  const registryRaw = await fetch(`${REGISTRY_URL}/rest/v1/user_registry?select=*`, { headers: makeHeaders(REGISTRY_KEY) });
  let registry: UserEntry[] = [];
  if (registryRaw.ok) {
    registry = await registryRaw.json();
  } else {
    const body = await registryRaw.text().catch(() => "(unreadable)");
    console.error(`[send-reports] Registry fetch failed: ${registryRaw.status} — ${body}`);
  }

  const allUsers: UserEntry[] = [
    { supabase_url: REGISTRY_URL, anon_key: REGISTRY_KEY },
    ...registry.filter(u => u.supabase_url !== REGISTRY_URL),
  ];

  for (const user of allUsers) {
    let schedules: Schedule[] = [];
    try {
      schedules = await userGet(user.supabase_url, user.anon_key, `/report_schedules?is_active=eq.true&next_send_at=lte.${nowIso}&select=*`);
    } catch { continue; }

    for (const s of schedules) {
      const { start, end } = getPeriod(s, now);
      const pStart = format(start, "yyyy-MM-dd");
      const pEnd   = format(end,   "yyyy-MM-dd");
      let status = "success";
      let errMsg: string | undefined;

      try {
        await withRetry(() => processSchedule(s, user.supabase_url, user.anon_key, transporter, GMAIL_USER, now));
        await userPatch(user.supabase_url, user.anon_key, `/report_schedules?id=eq.${s.id}`, {
          next_send_at: getNextSendAt(s, now).toISOString(),
          last_sent_at: nowIso,
        });
      } catch (e) {
        status = "failed";
        errMsg = (e as Error).message;
      }

      await userPost(user.supabase_url, user.anon_key, "report_delivery_log", {
        schedule_id: s.id, user_id: s.user_id, status,
        period_start: pStart, period_end: pEnd,
        error_message: errMsg ?? null,
      }).catch(() => {});

      results.push({ user: user.supabase_url, scheduleId: s.id, status, error: errMsg });
    }
  }

  return res.status(200).json({ processed: results.length, results });
}
