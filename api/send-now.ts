import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import {
  userGet, userPatch, userPost,
  getPeriod, getNextSendAt, processSchedule,
} from "./_shared.js";
import type { Schedule } from "./_shared.js";
import { format } from "date-fns";

const GMAIL_USER = process.env.GMAIL_USER!;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!GMAIL_USER || !GMAIL_PASS) return res.status(500).json({ error: "Gmail not configured" });

  const { supabase_url, anon_key } = (req.body ?? {}) as { supabase_url?: string; anon_key?: string };
  if (!supabase_url || !anon_key) return res.status(400).json({ error: "supabase_url and anon_key required" });

  const userId = supabase_url.replace("https://", "").split(".")[0];
  let schedules: Schedule[];
  try {
    schedules = await userGet(supabase_url, anon_key, `/report_schedules?user_id=eq.${userId}&select=*&limit=1`);
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Supabase", detail: (e as Error).message });
  }

  if (!schedules.length) return res.status(404).json({ error: "No schedule found — save one first" });

  const s = schedules[0];
  const now = new Date();
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

  try {
    await processSchedule(s, supabase_url, anon_key, transporter, GMAIL_USER, now);
  } catch (e) {
    return res.status(500).json({ error: "Email send failed", detail: (e as Error).message });
  }

  const nowIso = now.toISOString();
  const { start, end } = getPeriod(s, now);
  await userPatch(supabase_url, anon_key, `/report_schedules?id=eq.${s.id}`, {
    last_sent_at: nowIso,
    next_send_at: getNextSendAt(s, now).toISOString(),
  });
  await userPost(supabase_url, anon_key, "report_delivery_log", {
    schedule_id: s.id, user_id: s.user_id, status: "success",
    period_start: format(start, "yyyy-MM-dd"),
    period_end: format(end, "yyyy-MM-dd"),
    error_message: null,
  }).catch(() => {});

  return res.status(200).json({ success: true, sentTo: s.email });
}
