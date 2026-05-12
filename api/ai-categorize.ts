/**
 * ai-categorize.ts  POST /api/ai-categorize
 *
 * Given a transaction note and list of available categories,
 * returns the best-matching category ID using the AI provider waterfall.
 *
 * Designed for the self-learning autocategorize loop:
 *   1. Client types a note → no local autoRules match
 *   2. Client calls this endpoint (debounced 800ms)
 *   3. Endpoint returns suggestion
 *   4. User accepts → client saves rule to autoRules (never calls AI for that keyword again)
 *   5. User rejects → client records the corrected choice as a rule instead
 *
 * Request body:
 *   { note: string, categories: Array<{ id: string, name: string }> }
 *
 * Response 200:
 *   { categoryId: string, confidence: "high" | "medium" | "low" }
 *
 * Response 4xx / 5xx:
 *   { error: string }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callText, extractJSON, AiProviderError, configuredProviderCount } from "./_ai-provider.js";

const SYSTEM_PROMPT = `You are an expense categorization assistant for an Indian user.
Given a transaction note and a list of categories, return ONLY valid JSON with no markdown:
{ "categoryId": "exact_id_from_list", "confidence": "high|medium|low" }

Rules:
- categoryId MUST be one of the IDs from the provided list — never invent one.
- confidence "high"   → clear match (e.g. "Swiggy" → Food, "Ola" → Transport)
- confidence "medium" → likely match but ambiguous
- confidence "low"    → no clear signal — pick best guess
- Indian context: Swiggy/Zomato=Food, Ola/Uber/BEST=Transport, Myntra/Amazon=Shopping, Netflix/Spotify=Entertainment, Apollo/MedPlus=Health
- UPI merchant names (e.g. "Pay to D-Mart") follow the merchant's sector.`;

interface Category { id: string; name: string; }

interface CategorizeResult {
  categoryId: string;
  confidence: "high" | "medium" | "low";
}

function validateResult(obj: unknown, validIds: Set<string>): obj is CategorizeResult {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.categoryId === "string" &&
    validIds.has(o.categoryId) &&
    ["high", "medium", "low"].includes(o.confidence as string)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (configuredProviderCount() === 0) {
    return res.status(503).json({ error: "No AI providers configured." });
  }

  const { note, categories } = (req.body ?? {}) as {
    note?: string;
    categories?: Category[];
  };

  if (!note || typeof note !== "string" || note.trim().length < 2) {
    return res.status(400).json({ error: "note must be a non-empty string (min 2 chars)." });
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: "categories must be a non-empty array." });
  }

  const validIds = new Set(categories.map(c => c.id));

  const prompt = `Transaction note: "${note.trim().slice(0, 200)}"

Available categories:
${categories.map(c => `- id: "${c.id}", name: "${c.name}"`).join("\n")}

Which category best matches this transaction?`;

  try {
    const raw = await callText(prompt, SYSTEM_PROMPT);

    let parsed: unknown;
    try { parsed = extractJSON(raw); }
    catch {
      console.error("[ai-categorize] JSON parse failed:", raw.slice(0, 200));
      return res.status(502).json({ error: "AI returned non-JSON. Try again." });
    }

    if (!validateResult(parsed, validIds)) {
      // Model returned an unknown ID — try to find closest match
      console.error("[ai-categorize] Invalid shape or unknown ID:", JSON.stringify(parsed).slice(0, 200));
      return res.status(502).json({ error: "AI returned unexpected category. Try again." });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    if (err instanceof AiProviderError) {
      return res.status(502).json({ error: "All AI providers failed.", details: err.providerErrors });
    }
    console.error("[ai-categorize] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
