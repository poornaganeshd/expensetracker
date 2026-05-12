/**
 * ai-insights.ts  POST /api/ai-insights
 *
 * Receives a redacted 90-day transaction summary and returns AI-generated
 * spending insights using the 3-provider waterfall (_ai-provider.ts).
 *
 * Client must redact PII with src/redactor.js BEFORE sending.
 *
 * Request body:
 *   {
 *     expenses:  Array<{ date, amount, categoryId, walletId, note }>
 *     incomes:   Array<{ date, amount, sourceId,   walletId        }>
 *     categories: Array<{ id, name }>
 *     wallets:   Array<{ id, name }>
 *     month:     string   current YYYY-MM (for context)
 *   }
 *
 * Response 200:
 *   {
 *     insights: Array<{
 *       type:     "warning" | "tip" | "pattern" | "achievement"
 *       title:    string
 *       detail:   string
 *       severity: "high" | "medium" | "low"
 *     }>
 *     summary:  string
 *   }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callText, extractJSON, AiProviderError, configuredProviderCount } from "./_ai-provider.js";

const MAX_TRANSACTIONS = 500; // cap to keep tokens reasonable

const SYSTEM_PROMPT = `You are a personal finance advisor for an Indian user tracking expenses in INR (₹).
Analyse the provided transaction data and return ONLY valid JSON with no markdown or explanation:
{
  "insights": [
    {
      "type":     "warning | tip | pattern | achievement",
      "title":    "Short headline (max 8 words)",
      "detail":   "1-2 sentence specific explanation with INR amounts where relevant",
      "severity": "high | medium | low"
    }
  ],
  "summary": "2-3 sentence plain-English summary of overall financial health this period"
}

Rules:
- Return 3 to 5 insights. No more, no less.
- Use actual amounts from the data (₹ symbol, round to nearest ₹10 for readability).
- type "warning"     → overspending, budget risk, unusual spike
- type "tip"         → actionable saving advice based on the data
- type "pattern"     → recurring behaviour (positive or neutral)
- type "achievement" → positive milestone worth celebrating
- severity "high"    → needs immediate attention
- severity "medium"  → worth noting
- severity "low"     → informational / positive
- Focus on Indian financial context (UPI, EMI, grocery vs dining, festivals, salary cycles).
- If data is sparse (< 5 transactions), still return insights but note the limited data.`;

interface Txn {
  date: string;
  amount: number;
  categoryId?: string;
  sourceId?: string;
  walletId?: string;
  note?: string;
  type?: string;
}

interface Category { id: string; name: string; }
interface Wallet   { id: string; name: string; }

interface InsightItem {
  type:     "warning" | "tip" | "pattern" | "achievement";
  title:    string;
  detail:   string;
  severity: "high" | "medium" | "low";
}

interface InsightsResult {
  insights: InsightItem[];
  summary:  string;
}

function validateResult(obj: unknown): obj is InsightsResult {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.insights) || typeof o.summary !== "string") return false;
  return o.insights.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const i = item as Record<string, unknown>;
    return (
      ["warning", "tip", "pattern", "achievement"].includes(i.type as string) &&
      typeof i.title    === "string" &&
      typeof i.detail   === "string" &&
      ["high", "medium", "low"].includes(i.severity as string)
    );
  });
}

function buildPrompt(
  expenses:   Txn[],
  incomes:    Txn[],
  categories: Category[],
  wallets:    Wallet[],
  month:      string,
): string {
  // Humanise category and wallet IDs so the model can reason about them
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  const walMap: Record<string, string> = {};
  wallets.forEach(w => { walMap[w.id] = w.name; });

  const mapExp = (e: Txn) => ({
    date:     e.date,
    amount:   e.amount,
    category: catMap[e.categoryId ?? ""] ?? e.categoryId ?? "Unknown",
    wallet:   walMap[e.walletId   ?? ""] ?? e.walletId   ?? "Unknown",
    note:     e.note || "",
  });
  const mapInc = (i: Txn) => ({
    date:   i.date,
    amount: i.amount,
    wallet: walMap[i.walletId ?? ""] ?? i.walletId ?? "Unknown",
  });

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInc = incomes.reduce((s, i) => s + i.amount, 0);

  return `Period: last 90 days (current month: ${month})
Total income:  ₹${Math.round(totalInc)}
Total expense: ₹${Math.round(totalExp)}
Net:           ₹${Math.round(totalInc - totalExp)}

Expenses (${expenses.length} transactions):
${JSON.stringify(expenses.slice(0, MAX_TRANSACTIONS).map(mapExp), null, 0)}

Incomes (${incomes.length} transactions):
${JSON.stringify(incomes.map(mapInc), null, 0)}

Provide 3-5 specific, actionable insights based on this data.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  if (configuredProviderCount() === 0) {
    return res.status(503).json({
      error: "No AI providers configured. Add GEMINI_API_KEY, GROQ_API_KEY, or NVIDIA_API_KEY to Vercel env vars.",
    });
  }

  const body = req.body ?? {};
  const {
    expenses   = [],
    incomes    = [],
    categories = [],
    wallets    = [],
    month      = new Date().toISOString().slice(0, 7),
  } = body as {
    expenses?:   Txn[];
    incomes?:    Txn[];
    categories?: Category[];
    wallets?:    Wallet[];
    month?:      string;
  };

  if (!Array.isArray(expenses) || !Array.isArray(incomes)) {
    return res.status(400).json({ error: "expenses and incomes must be arrays." });
  }

  const prompt = buildPrompt(expenses, incomes, categories, wallets, month);

  try {
    const raw = await callText(prompt, SYSTEM_PROMPT);

    let parsed: unknown;
    try {
      parsed = extractJSON(raw);
    } catch {
      console.error("[ai-insights] JSON parse failed. Raw:", raw.slice(0, 300));
      return res.status(502).json({ error: "AI returned non-JSON response. Try again." });
    }

    if (!validateResult(parsed)) {
      console.error("[ai-insights] Invalid shape:", JSON.stringify(parsed).slice(0, 300));
      return res.status(502).json({ error: "AI returned unexpected data shape. Try again." });
    }

    // Trim to max 5 insights regardless of what the model returns
    const result: InsightsResult = {
      insights: parsed.insights.slice(0, 5),
      summary:  parsed.summary.trim(),
    };

    return res.status(200).json(result);

  } catch (err) {
    if (err instanceof AiProviderError) {
      console.error("[ai-insights] All providers failed:", err.providerErrors);
      return res.status(502).json({
        error: "AI insights unavailable — all providers failed. Try again later.",
        details: err.providerErrors,
      });
    }
    console.error("[ai-insights] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
