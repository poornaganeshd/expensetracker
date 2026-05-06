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
    registry = await registryRaw.json() as UserEntry[];
  } else {
    const body = await registryRaw.text().catch(() => "(unreadable)");
    console.error(`[send-reports] Registry fetch failed: ${registryRaw.status} — ${body}`);
  }

  const allUsers: UserEntry[] = [
    { supabase_url: REGISTRY_URL, anon_key: REGISTRY_KEY },
    ...registry.filter(u => u.supabase_url !== REGISTRY_URL),
  ];

  // Per-user wall-clock cap: stops one slow Supabase project (cold start, throttled,
  // paused free-tier) from blocking everyone behind it within the Vercel function's
  // own timeout.
  const PER_USER_TIMEOUT_MS = 30_000;
  // Bounded concurrency. Gmail SMTP is the real bottleneck; 5 in flight keeps us
  // well under per-second sending limits while overlapping the Supabase fetches.
  const CONCURRENCY = 5;

  const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
    ]);

  const processUser = async (user: UserEntry) => {
    let schedules: Schedule[] = [];
    try {
      schedules = await withTimeout(
        userGet(user.supabase_url, user.anon_key, `/report_schedules?is_active=eq.true&next_send_at=lte.${nowIso}&select=*`),
        PER_USER_TIMEOUT_MS,
        `schedules ${user.supabase_url}`,
      ) as Schedule[];
    } catch (e) {
      results.push({ user: user.supabase_url, scheduleId: "—", status: "failed", error: (e as Error).message });
      return;
    }

    for (const s of schedules) {
      const { start, end } = getPeriod(s, now);
      const pStart = format(start, "yyyy-MM-dd");
      const pEnd   = format(end,   "yyyy-MM-dd");
      let status = "success";
      let errMsg: string | undefined;

      try {
        await withTimeout(
          withRetry(() => processSchedule(s, user.supabase_url, user.anon_key, transporter, GMAIL_USER, now)),
          PER_USER_TIMEOUT_MS,
          `send ${user.supabase_url}`,
        );
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
  };

  // Process users in chunks of CONCURRENCY at a time. Promise.allSettled means
  // one user's failure cannot break the chunk for everyone else.
  for (let i = 0; i < allUsers.length; i += CONCURRENCY) {
    const chunk = allUsers.slice(i, i + CONCURRENCY);
    await Promise.allSettled(chunk.map(processUser));
  }

  return res.status(200).json({ processed: results.length, results });
}
