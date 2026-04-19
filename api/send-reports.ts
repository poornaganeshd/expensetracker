import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import {
  addDays, addMonths,
  subDays, subMonths,
  startOfMonth, endOfMonth,
  format,
} from "date-fns";

// ── env ───────────────────────────────────────────────────────────────────────
const REGISTRY_URL = process.env.VITE_SUPABASE_URL!;
const REGISTRY_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const CRON_SECRET  = process.env.CRON_SECRET!;
const FROM_EMAIL   = process.env.RESEND_FROM_EMAIL ?? "NOMAD Reports <reports@resend.dev>";
console.log("[send-reports] RESEND KEY EXISTS:", !!RESEND_KEY);
console.log("[send-reports] FROM_EMAIL:", FROM_EMAIL);

// ── types ─────────────────────────────────────────────────────────────────────
interface UserEntry   { supabase_url: string; anon_key: string; }
interface Schedule {
  id: string; user_id: string; email: string;
  frequency: "weekly" | "monthly" | "quarterly" | "custom";
  custom_days: number | null; send_hour: number;
  include_expenses: boolean; include_incomes: boolean; include_transfers: boolean;
  selected_categories: string[] | null;
  next_send_at: string; is_active: boolean;
}
interface Expense  { id: string; amount: number; categoryId: string; walletId: string; date: string; note?: string; }
interface Income   { id: string; amount: number; sourceId: string;   walletId: string; date: string; }
interface Transfer { id: string; amount: number; fromWallet: string; toWallet: string; date: string; note?: string; }

// ── per-user supabase fetch ───────────────────────────────────────────────────
function makeHeaders(key: string) {
  return { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=representation" };
}

async function userGet(baseUrl: string, key: string, path: string) {
  const r = await fetch(`${baseUrl}/rest/v1${path}`, { headers: makeHeaders(key) });
  if (!r.ok) throw new Error(`GET ${baseUrl}${path} → ${r.status}`);
  return r.json();
}
async function userPatch(baseUrl: string, key: string, path: string, body: object) {
  await fetch(`${baseUrl}/rest/v1${path}`, { method: "PATCH", headers: makeHeaders(key), body: JSON.stringify(body) });
}
async function userPost(baseUrl: string, key: string, table: string, body: object) {
  await fetch(`${baseUrl}/rest/v1/${table}`, { method: "POST", headers: makeHeaders(key), body: JSON.stringify(body) });
}

// ── retry ─────────────────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last!: Error;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) { last = e as Error; if (i < attempts) await new Promise(r => setTimeout(r, 2 ** i * 1000)); }
  }
  throw last;
}

// ── date math ─────────────────────────────────────────────────────────────────
function getPeriod(s: Schedule, now: Date) {
  if (s.frequency === "weekly")    return { start: subDays(now, 7),  end: subDays(now, 1) };
  if (s.frequency === "monthly")   { const p = subMonths(now, 1); return { start: startOfMonth(p), end: endOfMonth(p) }; }
  if (s.frequency === "quarterly") return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(subMonths(now, 1)) };
  return { start: subDays(now, s.custom_days ?? 7), end: subDays(now, 1) };
}
function getNextSendAt(s: Schedule, now: Date): Date {
  const n = new Date(now);
  if (s.frequency === "weekly")    n.setUTCDate(n.getUTCDate() + 7);
  else if (s.frequency === "monthly")   n.setUTCMonth(n.getUTCMonth() + 1);
  else if (s.frequency === "quarterly") n.setUTCMonth(n.getUTCMonth() + 3);
  else n.setUTCDate(n.getUTCDate() + (s.custom_days ?? 7));
  n.setUTCHours(s.send_hour, 0, 0, 0);
  return n;
}

// ── csv ───────────────────────────────────────────────────────────────────────
function buildCsv(expenses: Expense[], incomes: Income[], transfers: Transfer[], s: Schedule) {
  const q = (v?: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  let csv = "Type,Date,Amount,Category/Source/From,To/Wallet,Note\n";
  if (s.include_incomes)   incomes.forEach(i   => { csv += `Income,${i.date},${i.amount},${q(i.sourceId)},${q(i.walletId)},\n`; });
  if (s.include_expenses)  expenses.forEach(e  => { csv += `Expense,${e.date},${e.amount},${q(e.categoryId)},${q(e.walletId)},${q(e.note)}\n`; });
  if (s.include_transfers) transfers.forEach(t => { csv += `Transfer,${t.date},${t.amount},${q(t.fromWallet)},${q(t.toWallet)},${q(t.note)}\n`; });
  return csv;
}
function buildBackup(expenses: Expense[], incomes: Income[], transfers: Transfer[]) {
  return JSON.stringify({ expenses, incomes, transfers, _v: "nomad-v9", _date: new Date().toISOString() }, null, 2);
}

// ── email html ────────────────────────────────────────────────────────────────
function buildHtml(opts: { schedule: Schedule; periodStart: Date; periodEnd: Date; totalSpent: number; totalIncome: number; totalTransfers: number; byCategory: { name: string; amount: number }[] }) {
  const { schedule: s, periodStart, periodEnd, totalSpent, totalIncome, totalTransfers, byCategory } = opts;
  const inr  = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const net  = totalIncome - totalSpent;
  const netC = net >= 0 ? "#6BAA75" : "#D4726A";
  const label  = s.frequency === "custom" ? `Every ${s.custom_days}d` : s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1);
  const period = `${format(periodStart, "MMM d")} – ${format(periodEnd, "MMM d, yyyy")}`;

  const catRows = byCategory.sort((a, b) => b.amount - a.amount).slice(0, 10).map(c => {
    const pct = totalSpent > 0 ? Math.round((c.amount / totalSpent) * 100) : 0;
    return `<tr>
      <td style="padding:10px 20px 10px 24px;font-size:13px;color:#cccccc;font-family:'Segoe UI',Arial,sans-serif;white-space:nowrap;">${c.name}</td>
      <td style="padding:10px 8px;width:100%;"><div style="height:6px;border-radius:3px;background:#2a2a2a;"><div style="height:6px;border-radius:3px;background:#c9a96e;width:${Math.max(4, pct)}%;"></div></div></td>
      <td style="padding:10px 24px 10px 8px;font-size:13px;color:#c9a96e;font-family:'Segoe UI',Arial,sans-serif;text-align:right;font-weight:700;white-space:nowrap;">${inr(c.amount)} <span style="color:#555;font-weight:400;font-size:11px;">${pct}%</span></td>
    </tr>`;
  }).join("");

  const statCards = [
    s.include_expenses  && `<td style="background:#242424;border-radius:12px;padding:16px;vertical-align:top;"><div style="font-size:9px;color:#666;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Spent</div><div style="font-size:20px;font-weight:800;color:#c9a96e;">${inr(totalSpent)}</div></td>`,
    s.include_incomes   && `<td width="8"></td><td style="background:#242424;border-radius:12px;padding:16px;vertical-align:top;"><div style="font-size:9px;color:#666;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Income</div><div style="font-size:20px;font-weight:800;color:#6BAA75;">${inr(totalIncome)}</div></td>`,
    `<td width="8"></td><td style="background:#242424;border-radius:12px;padding:16px;vertical-align:top;"><div style="font-size:9px;color:#666;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Net</div><div style="font-size:20px;font-weight:800;color:${netC};">${net >= 0 ? "+" : ""}${inr(net)}</div></td>`,
    s.include_transfers && `<td width="8"></td><td style="background:#242424;border-radius:12px;padding:16px;vertical-align:top;"><div style="font-size:9px;color:#666;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Transfers</div><div style="font-size:20px;font-weight:800;color:#7B8CDE;">${inr(totalTransfers)}</div></td>`,
  ].filter(Boolean).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:36px 32px 28px;">
    <div style="font-size:30px;margin-bottom:6px;">🦁</div>
    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:4px;margin-bottom:6px;">NOMAD</div>
    <div style="font-size:13px;color:#c9a96e;font-weight:600;">${label} Report &nbsp;·&nbsp; ${period}</div>
  </td></tr>
  <tr><td style="background:#1a1a1a;padding:0 24px 28px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>${statCards}</tr></table></td></tr>
  ${s.include_expenses ? `<tr><td style="background:#1e1e1e;padding:28px 8px 20px;">
    <div style="font-size:10px;font-weight:700;color:#555;letter-spacing:1px;text-transform:uppercase;margin:0 24px 14px;">Spending by Category</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${catRows || '<tr><td colspan="3" style="padding:20px 24px;color:#555;font-size:13px;text-align:center;">No expenses this period</td></tr>'}
    </table>
  </td></tr>` : ""}
  <tr><td style="background:#141414;border-radius:0 0 16px 16px;padding:22px 32px;border-top:1px solid #2a2a2a;">
    <div style="font-size:12px;color:#555;line-height:2.2;">
      📎 &nbsp;Attached: <span style="color:#888;">nomad_report.csv &amp; nomad_backup.json</span><br>
      🔒 &nbsp;Your data lives in your own Supabase — NOMAD never stores it centrally.<br>
      <span style="color:#c9a96e;font-weight:600;">NOMAD</span> &nbsp;·&nbsp; Track smart. Spend wise. 🦁
    </div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// ── process one schedule ──────────────────────────────────────────────────────
async function processSchedule(s: Schedule, sbUrl: string, sbKey: string, resend: Resend, now: Date) {
  const { start, end } = getPeriod(s, now);
  const pStart = format(start, "yyyy-MM-dd");
  const pEnd   = format(end,   "yyyy-MM-dd");
  const catFilter = s.selected_categories?.length ? `&categoryId=in.(${s.selected_categories.join(",")})` : "";

  const [expenses, incomes, transfers] = await Promise.all([
    s.include_expenses  ? userGet(sbUrl, sbKey, `/expenses?date=gte.${pStart}&date=lte.${pEnd}${catFilter}&select=*`)  : [],
    s.include_incomes   ? userGet(sbUrl, sbKey, `/incomes?date=gte.${pStart}&date=lte.${pEnd}&select=*`)               : [],
    s.include_transfers ? userGet(sbUrl, sbKey, `/transfers?date=gte.${pStart}&date=lte.${pEnd}&select=*`)             : [],
  ]) as [Expense[], Income[], Transfer[]];

  const totalSpent     = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome    = incomes.reduce((sum, i)  => sum + Number(i.amount), 0);
  const totalTransfers = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
  const catMap = new Map<string, number>();
  expenses.forEach(e => catMap.set(e.categoryId, (catMap.get(e.categoryId) ?? 0) + Number(e.amount)));
  const byCategory = Array.from(catMap.entries()).map(([name, amount]) => ({ name, amount }));

  const lbl    = `${s.frequency}_${format(end, "yyyy-MM-dd")}`;
  const fLabel = s.frequency === "custom" ? `Every ${s.custom_days}d` : s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1);

  console.log(`[send-reports] Sending email to: ${s.email}`);
  const sendResult = await resend.emails.send({
    from: FROM_EMAIL,
    to: s.email,
    subject: `🦁 NOMAD ${fLabel} Report — ${format(start, "MMM d")} to ${format(end, "MMM d, yyyy")}`,
    html: buildHtml({ schedule: s, periodStart: start, periodEnd: end, totalSpent, totalIncome, totalTransfers, byCategory }),
    attachments: [
      { filename: `nomad_${lbl}.csv`,          content: Buffer.from(buildCsv(expenses, incomes, transfers, s)).toString("base64") },
      { filename: `nomad_backup_${lbl}.json`,  content: Buffer.from(buildBackup(expenses, incomes, transfers)).toString("base64") },
    ],
  });
  console.log("[send-reports] RESEND RESPONSE:", JSON.stringify(sendResult));
  if (sendResult.error) {
    throw new Error(`Resend error: ${sendResult.error.message}`);
  }
}

// ── handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization ?? "";
  const querySecret = (req.query?.secret as string) ?? "";
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}` || querySecret === CRON_SECRET;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!RESEND_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY is not set" });
  }

  const now    = new Date();
  const nowIso = now.toISOString();
  const resend = new Resend(RESEND_KEY);
  const results: { user: string; scheduleId: string; status: string; error?: string }[] = [];

  // ── 1. read all registered user Supabase instances from owner's registry ──
  const registryH = makeHeaders(REGISTRY_KEY);
  const registryRaw = await fetch(`${REGISTRY_URL}/rest/v1/user_registry?select=*`, { headers: registryH });
  let registry: UserEntry[] = [];
  if (registryRaw.ok) {
    registry = await registryRaw.json();
  } else {
    const errorBody = await registryRaw.text().catch(() => "(unreadable)");
    console.error(`[send-reports] Registry fetch failed: ${registryRaw.status} — ${errorBody}`);
  }

  // Always include owner's own Supabase (service role key for extra access)
  const ownerEntry = { supabase_url: REGISTRY_URL, anon_key: REGISTRY_KEY };
  const allUsers: UserEntry[] = [
    ownerEntry,
    ...registry.filter(u => u.supabase_url !== REGISTRY_URL),
  ];

  // ── 2. for each user, fetch and process their due schedules ───────────────
  for (const user of allUsers) {
    let schedules: Schedule[] = [];
    try {
      schedules = await userGet(user.supabase_url, user.anon_key, `/report_schedules?is_active=eq.true&next_send_at=lte.${nowIso}&select=*`);
    } catch { continue; } // user's Supabase unreachable — skip

    for (const s of schedules) {
      const { start, end } = getPeriod(s, now);
      const pStart = format(start, "yyyy-MM-dd");
      const pEnd   = format(end,   "yyyy-MM-dd");
      let status = "success";
      let errMsg: string | undefined;

      try {
        await withRetry(() => processSchedule(s, user.supabase_url, user.anon_key, resend, now));
        await userPatch(user.supabase_url, user.anon_key, `/report_schedules?id=eq.${s.id}`, {
          next_send_at: getNextSendAt(s, now).toISOString(),
          last_sent_at: nowIso,
        });
      } catch (e) {
        status = "failed";
        errMsg = (e as Error).message;
      }

      // Log to user's own delivery log
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
