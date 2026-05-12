/**
 * redactor.js — Client-side PII strip before any data leaves for AI APIs.
 *
 * Borrowed pattern from Ray Finance (src/ai/redactor.ts), adapted for
 * NOMAD's Indian-user context (PAN, Aadhaar, UPI IDs added).
 *
 * Rules:
 *   - No dependencies — pure string → string transforms
 *   - No false positives on amounts (₹500, 12000 etc.) — amount patterns excluded
 *   - Redact notes/descriptions only, never amounts or dates
 *   - Safe to run on every AI call; performance cost is negligible
 */

/**
 * Pattern descriptors — stored as source strings so we can build fresh RegExp
 * objects on every call. Using module-level /g regex objects is unsafe because
 * they maintain `lastIndex` state between calls, causing intermittent misses.
 */
const PATTERN_DEFS = [
  // Indian PAN card: ABCDE1234F (5 letters, 4 digits, 1 letter)
  { src: String.raw`\b[A-Z]{5}\d{4}[A-Z]\b`,                          flags: "g",  tag: "[PAN]"     },
  // Aadhaar: 12 digits (not preceded by ₹ or digits — avoid amount clash)
  { src: String.raw`(?<![₹\d])\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b`,      flags: "g",  tag: "[AADHAAR]" },
  // Credit/debit card: 16 digits in groups
  { src: String.raw`\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b`,        flags: "g",  tag: "[CARD]"    },
  // Bank account numbers: 9–18 digit standalone numbers
  { src: String.raw`(?<![₹\d])\b\d{9,18}\b(?!\.\d)`,                  flags: "g",  tag: "[ACCOUNT]" },
  // UPI IDs: something@upi / something@okaxis etc.
  { src: String.raw`\b[\w.\-]+@(?:upi|okaxis|okhdfcbank|oksbi|okicici|ybl|ibl|axl|paytm|apl|waicici)\b`, flags: "gi", tag: "[UPI]"  },
  // Email addresses
  { src: String.raw`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`, flags: "g", tag: "[EMAIL]" },
  // Indian mobile numbers: 10 digits starting with 6-9 (not preceded by ₹)
  { src: String.raw`(?<![₹\d])\b[6-9]\d{9}\b`,                        flags: "g",  tag: "[PHONE]"   },
  // Proper names heuristic: two consecutive Title-cased words after action verbs
  // Use a function tag — replaceAll ensures both occurrences of the captured name are replaced.
  { src: String.raw`\b(?:paid|sent|received|from|to|for)\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b`, flags: "g",
    tag: (m, name) => m.replaceAll(name, "[NAME]") },
];

/**
 * Redact PII from a single string (note, description, etc.)
 * Amounts (₹500, 12000) and dates are NOT touched.
 *
 * Fresh RegExp objects are built each call to avoid stale `lastIndex` issues
 * with stateful /g regexes reused across multiple input strings.
 *
 * @param {string} text
 * @returns {string}
 */
export function redactText(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const { src, flags, tag } of PATTERN_DEFS) {
    const re = new RegExp(src, flags);
    out = out.replace(re, tag);
  }
  return out;
}

/**
 * Redact PII from an array of transaction objects before sending to AI.
 * Strips fields the AI doesn't need (id, receipt_url, deleted_at).
 * Keeps: date, amount, categoryId, walletId, note (redacted), type.
 *
 * @param {Array<{id?, note?, date, amount, categoryId?, walletId?, sourceId?, type?}>} transactions
 * @returns {Array}
 */
export function redactTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.map(t => ({
    date:       t.date,
    amount:     t.amount,
    type:       t.type,
    categoryId: t.categoryId,
    sourceId:   t.sourceId,
    walletId:   t.walletId,
    note:       redactText(t.note || ""),
    // Omit: id, receipt_url, deleted_at, paidBy, eventId — AI doesn't need them
  }));
}

/**
 * Redact PII from a plain text summary or free-form string.
 * Alias for redactText — use this at call sites for clarity.
 *
 * @param {string} text
 * @returns {string}
 */
export const redact = redactText;
