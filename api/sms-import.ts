import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeHeaders } from "./_shared.js";

const CRON_SECRET = process.env.CRON_SECRET || "";

interface ParsedSms {
  amount: number;
  type: "expense" | "income";
  date: string;
  merchant: string | null;
  vpa: string | null;
  is_person_payment: boolean;
}

function parseSms(text: string): ParsedSms | null {
  const t = text.trim();

  // Amount: INR / Rs. / Rs / ₹ followed by digits
  const amtMatch = t.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amtMatch) return null;
  const amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  if (!amount || isNaN(amount) || amount <= 0) return null;

  // Type: debit = expense, credit = income
  const debitWords = /\b(debit|debited|withdrawn|spent|paid|purchase)\b/i;
  const creditWords = /\b(credit|credited|received|deposit|deposited|refund|cashback)\b/i;
  const isDebit = debitWords.test(t);
  const isCredit = creditWords.test(t);
  if (!isDebit && !isCredit) return null;
  const type: "expense" | "income" = isDebit ? "expense" : "income";

  // Date: DD-MM-YY, DD-MM-YYYY, DD/MM/YY, DD/MM/YYYY
  let date = new Date().toISOString().slice(0, 10);
  const dateMatch = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const [, dd, mm, yy] = dateMatch;
    const yyyy = yy.length === 2 ? "20" + yy : yy;
    const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T12:00:00`);
    if (!isNaN(d.getTime())) date = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // VPA: word@word
  const vpaMatch = t.match(/\b([\w.+-]+@[a-zA-Z0-9]+)\b/);
  const vpa = vpaMatch ? vpaMatch[1] : null;

  // Person payment: phone number VPA or personal UPI handles
  const is_person_payment = !!vpa && (
    /^\d{10}@/.test(vpa) ||
    /^[a-z0-9]+@(paytm|ybl|okhdfcbank|okicici|oksbi|axisbank|upi|ibl|timecosmos|ikwik|jiomoney|airtelpaymentsbank)$/i.test(vpa)
  );

  // Merchant: extract from common patterns
  let merchant: string | null = null;

  // UPI/merchant_name/... format
  const upiSlash = t.match(/UPI[\/\-]([\w\s.&\-]+?)(?:\/|\.|\s{2,}|$)/i);
  if (upiSlash) merchant = upiSlash[1].trim().slice(0, 60) || null;

  // "Info: <text>" pattern
  if (!merchant) {
    const infoMatch = t.match(/Info[:\s]+([\w\s.&\-@]+?)(?:\.|Avl|Bal|$)/i);
    if (infoMatch) merchant = infoMatch[1].trim().slice(0, 60) || null;
  }

  // "VPA: <vpa>" — use vpa itself as merchant fallback
  if (!merchant && vpa) merchant = vpa;

  return { amount, type, date, merchant, vpa, is_person_payment };
}

// Generate a short base-36 ID (same style as client-side uid())
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth: Bearer header OR ?secret= query param (for MacroDroid / no-header clients)
  const auth = req.headers["authorization"] || "";
  const querySecret = (req.query?.secret as string) || "";
  if (!CRON_SECRET || (auth !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { supabase_url, anon_key, sms, auto_rules } = (req.body ?? {}) as {
    supabase_url?: string;
    anon_key?: string;
    sms?: string;
    auto_rules?: Array<{ keyword: string; categoryId: string }>;
  };

  if (!supabase_url || !anon_key) return res.status(400).json({ error: "supabase_url and anon_key required" });
  if (!sms || typeof sms !== "string") return res.status(400).json({ error: "sms text required" });

  const parsed = parseSms(sms);
  if (!parsed) return res.status(422).json({ ok: false, error: "Could not parse amount/type from SMS" });

  // Apply auto_rules for category suggestion
  const smsLower = sms.toLowerCase();
  const matchedRule = (auto_rules || []).find(r => smsLower.includes(r.keyword.toLowerCase()));
  const suggested_category_id = matchedRule ? matchedRule.categoryId : null;

  const draft = {
    id: makeId(),
    source: "sms",
    raw_text: sms.slice(0, 500),
    date: parsed.date,
    amount: parsed.amount,
    type: parsed.type,
    merchant: parsed.merchant,
    vpa: parsed.vpa,
    suggested_category_id,
    suggested_wallet_id: "bank",
    is_person_payment: parsed.is_person_payment,
    status: "pending",
  };

  const headers = makeHeaders(anon_key);
  try {
    const r = await fetch(`${supabase_url}/rest/v1/drafts`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(draft),
    });
    if (!r.ok) {
      const err = await r.text().catch(() => String(r.status));
      return res.status(502).json({ ok: false, error: `Supabase insert failed: ${err}` });
    }
  } catch (e) {
    return res.status(503).json({ ok: false, error: (e as Error).message });
  }

  return res.status(200).json({ ok: true, draft });
}
