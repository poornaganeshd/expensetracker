/**
 * food-vision.ts  POST /api/food-vision
 *
 * Accepts a compressed food photo (base64) and returns structured nutrition
 * data estimated for Indian serving sizes, using a 3-provider AI waterfall.
 *
 * Request body:
 *   { imageBase64: string, mimeType?: string }
 *
 * Response 200:
 *   {
 *     name:         string   — e.g. "Dal Tadka"
 *     serving_desc: string   — e.g. "1 bowl (~250g)"
 *     calories:     number   — kcal
 *     protein_g:    number
 *     carbs_g:      number
 *     fat_g:        number
 *     confidence:   "high" | "medium" | "low"
 *     provider:     string   — which provider answered
 *   }
 *
 * Response 4xx / 5xx:
 *   { error: string, details?: string[] }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callVisionWithProvider, extractJSON, AiProviderError, configuredProviderCount } from "./_ai-provider.js";

// ~2 MB base64 limit — client must compress to 800px JPEG before sending.
// A 800×800 JPEG at 70% is typically 60-120 KB → base64 ~160 KB.
// 2.8 MB gives comfortable headroom even for large phones.
const MAX_BASE64_BYTES = 2_800_000;

const SYSTEM_PROMPT = `You are a nutrition expert specialising in Indian home-cooked food and restaurant meals.
Analyse the food photo and return ONLY valid JSON with no markdown fences or explanation:
{
  "name":         "food name in English (e.g. Dal Tadka, Aloo Paratha)",
  "serving_desc": "visible portion description (e.g. 1 bowl ~250g, 2 rotis, 1 plate)",
  "calories":     320,
  "protein_g":    12,
  "carbs_g":      45,
  "fat_g":        8,
  "confidence":   "high"
}

Rules:
- Use standard Indian home-cooked portion sizes as reference.
- If multiple dishes are visible, describe the dominant or combined plate.
- confidence: "high" if food is clearly identifiable, "medium" if partially obscured or mixed, "low" if unrecognisable.
- All numeric values must be integers or one-decimal floats — never null or strings.
- Return exactly this JSON structure, nothing else.`;

const USER_PROMPT = "Identify this food and estimate its nutrition for the visible Indian portion size.";

interface FoodResult {
  name: string;
  serving_desc: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "high" | "medium" | "low";
  provider?: string;
}

function validateResult(obj: unknown): obj is FoodResult {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.name         === "string" &&
    typeof o.serving_desc === "string" &&
    typeof o.calories     === "number" &&
    typeof o.protein_g    === "number" &&
    typeof o.carbs_g      === "number" &&
    typeof o.fat_g        === "number" &&
    ["high", "medium", "low"].includes(o.confidence as string)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  if (configuredProviderCount() === 0) {
    return res.status(503).json({
      error: "No AI vision providers configured. Add GEMINI_API_KEY, GROQ_API_KEY, or NVIDIA_API_KEY to Vercel env vars.",
    });
  }

  const body = req.body ?? {};
  const { imageBase64, mimeType = "image/jpeg" } = body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "imageBase64 (string) required in request body." });
  }

  if (imageBase64.length > MAX_BASE64_BYTES) {
    return res.status(413).json({
      error: `Image too large (${Math.round(imageBase64.length / 1024)} KB base64). Compress to under 800px before sending.`,
    });
  }

  // Validate mimeType is image/*
  if (!mimeType.startsWith("image/")) {
    return res.status(400).json({ error: `mimeType must be an image type, got: ${mimeType}` });
  }

  try {
    const { content: raw, provider } = await callVisionWithProvider(imageBase64, mimeType, USER_PROMPT, SYSTEM_PROMPT);

    let parsed: unknown;
    try {
      parsed = extractJSON(raw);
    } catch {
      console.error("[food-vision] JSON parse failed. Raw response:", raw.slice(0, 300));
      return res.status(502).json({
        error: "AI returned non-JSON response. Try again or enter manually.",
      });
    }

    if (!validateResult(parsed)) {
      console.error("[food-vision] Invalid result shape:", JSON.stringify(parsed).slice(0, 300));
      return res.status(502).json({
        error: "AI returned unexpected data shape. Try again or enter manually.",
      });
    }

    // Round numbers to keep payload clean; include provider for client debug info
    const result: FoodResult = {
      name:         parsed.name.trim(),
      serving_desc: parsed.serving_desc.trim(),
      calories:     Math.round(parsed.calories),
      protein_g:    Math.round(parsed.protein_g * 10) / 10,
      carbs_g:      Math.round(parsed.carbs_g   * 10) / 10,
      fat_g:        Math.round(parsed.fat_g      * 10) / 10,
      confidence:   parsed.confidence,
      provider,
    };

    return res.status(200).json(result);

  } catch (err) {
    if (err instanceof AiProviderError) {
      console.error("[food-vision] All providers failed:", err.providerErrors);
      return res.status(502).json({
        error: "Food analysis unavailable — all AI providers failed. Enter nutrition manually.",
        details: err.providerErrors,
      });
    }
    console.error("[food-vision] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
