/**
 * ai-chat.ts  POST /api/ai-chat
 *
 * Conversational finance Q&A grounded in the user's own transaction data.
 * Client sends a question + compact financial context built from last 90 days.
 * Endpoint returns a single plain-text answer.
 *
 * No persistent memory — each call is independent (stateless). For a personal
 * single-user app this is fine; the context payload carries enough info.
 *
 * Request body:
 *   {
 *     question: string
 *     context: {
 *       month:         string   YYYY-MM current month
 *       totalIncome:   number
 *       totalExpense:  number
 *       topCategories: Array<{ name: string, amount: number, pct: number }>
 *       recentExpenses:Array<{ date, amount, category, note }>  (last 30, PII-redacted)
 *       walletBalances:Array<{ name: string, balance: number }>
 *       recurringCount:number
 *       streak:        number
 *     }
 *   }
 *
 * Response 200:
 *   { answer: string }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callText, AiProviderError, configuredProviderCount } from "./_ai-provider.js";

const SYSTEM_PROMPT = `You are NOMAD's personal finance assistant for an Indian user tracking expenses in INR (₹).
You have access to their recent financial data provided in each message.

Your style:
- Concise, warm, direct — like a smart friend who knows finance
- Use ₹ symbol and round numbers (₹4,300 not ₹4,312.50)
- Reference specific data from the context when answering
- Give actionable advice, not generic platitudes
- 2-4 sentences per answer unless the question requires more
- Indian financial context: salary day, UPI, EMIs, festivals, grocery vs dining out
- If data is insufficient to answer, say so briefly and suggest what to track`;

interface TopCategory { name: string; amount: number; pct: number; }
interface RecentExpense { date: string; amount: number; category: string; note: string; }
interface WalletBalance { name: string; balance: number; }

interface ChatContext {
  month?:          string;
  totalIncome?:    number;
  totalExpense?:   number;
  topCategories?:  TopCategory[];
  recentExpenses?: RecentExpense[];
  walletBalances?: WalletBalance[];
  recurringCount?: number;
  streak?:         number;
}

function buildPrompt(question: string, ctx: ChatContext): string {
  const {
    month         = "unknown",
    totalIncome   = 0,
    totalExpense  = 0,
    topCategories = [],
    recentExpenses= [],
    walletBalances= [],
    recurringCount= 0,
    streak        = 0,
  } = ctx;

  const net = totalIncome - totalExpense;
  const savings = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

  const topCatsText = topCategories.length > 0
    ? topCategories.map(c => `  • ${c.name}: ₹${Math.round(c.amount)} (${c.pct}%)`).join("\n")
    : "  No category data";

  const recentText = recentExpenses.length > 0
    ? recentExpenses.slice(0, 20).map(e => `  ${e.date}  ₹${e.amount}  ${e.category}  ${e.note || ""}`).join("\n")
    : "  No recent expenses";

  const walletText = walletBalances.length > 0
    ? walletBalances.map(w => `  ${w.name}: ₹${Math.round(w.balance)}`).join("\n")
    : "  No wallet data";

  return `Financial context for ${month}:
Income:   ₹${Math.round(totalIncome)}
Expenses: ₹${Math.round(totalExpense)}
Net:      ₹${Math.round(net)} (${savings}% savings rate)
Logging streak: ${streak} days
Active recurring bills: ${recurringCount}

Top spending categories:
${topCatsText}

Wallet balances:
${walletText}

Recent expenses (last 30):
${recentText}

User question: ${question.trim()}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (configuredProviderCount() === 0) {
    return res.status(503).json({ error: "No AI providers configured." });
  }

  const { question, context = {} } = (req.body ?? {}) as {
    question?: string;
    context?: ChatContext;
  };

  if (!question || typeof question !== "string" || question.trim().length < 3) {
    return res.status(400).json({ error: "question must be a non-empty string." });
  }

  const prompt = buildPrompt(question, context);

  try {
    const raw = await callText(prompt, SYSTEM_PROMPT);
    return res.status(200).json({ answer: raw.trim() });

  } catch (err) {
    if (err instanceof AiProviderError) {
      return res.status(502).json({ error: "All AI providers failed. Try again later.", details: err.providerErrors });
    }
    console.error("[ai-chat] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
