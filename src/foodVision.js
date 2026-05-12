/**
 * foodVision.js — Client-side helper for food photo → nutrition analysis.
 *
 * Compress photo client-side (reuses same canvas logic as receiptUpload.js)
 * then POST to /api/food-vision. Returns structured nutrition data.
 *
 * Usage in Routine.jsx:
 *   import { analyzeFood } from './foodVision';
 *   const result = await analyzeFood(file);
 *   // { name, serving_desc, calories, protein_g, carbs_g, fat_g, confidence, provider }
 */

const MAX_WIDTH  = 800;   // px — same as receiptUpload.js
const QUALITY    = 0.70;  // JPEG quality — same as receiptUpload.js

/**
 * Compress an image File/Blob to a base64 JPEG string.
 * Returns the raw base64 content (no "data:..." prefix).
 *
 * @param {File|Blob} file
 * @returns {Promise<string>} base64 string
 */
export function compressFoodImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      // Guard: corrupt or zero-dimension images produce Infinity scale → 0×0 canvas
      if (!img.width || !img.height) {
        reject(new Error("Image has zero dimensions — file may be corrupt."));
        return;
      }

      const scale  = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      // toDataURL returns "data:image/jpeg;base64,<content>"
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      // Strip the prefix — API only wants the raw base64 content
      const base64  = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image for compression."));
    };

    img.src = blobUrl;
  });
}

/**
 * Analyse a food photo and return nutrition data.
 *
 * Compresses the image client-side then calls POST /api/food-vision.
 * Throws on network failure or when all AI providers are exhausted.
 *
 * @param {File|Blob} file — photo from camera or gallery
 * @returns {Promise<{
 *   name: string,
 *   serving_desc: string,
 *   calories: number,
 *   protein_g: number,
 *   carbs_g: number,
 *   fat_g: number,
 *   confidence: "high"|"medium"|"low",
 *   provider: string
 * }>}
 */
export async function analyzeFood(file) {
  if (!file) throw new Error("No file provided.");

  const imageBase64 = await compressFoodImageToBase64(file);

  const res = await fetch("/api/food-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || `Food analysis failed (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  // 200 with unparseable body (network proxy, CDN error page, etc.)
  if (!data) {
    throw new Error("Food analysis returned an unreadable response. Try again.");
  }

  return data;
}

/**
 * Format a nutrition result into a compact one-line summary string.
 * Useful for pre-filling the food log text input.
 *
 * @param {{ name: string, serving_desc: string, calories: number }} result
 * @returns {string}  e.g. "Dal Tadka (1 bowl)"
 */
export function foodResultToText(result) {
  if (!result?.name) return "";
  const serving = result.serving_desc ? ` (${result.serving_desc})` : "";
  return `${result.name}${serving}`;
}

/**
 * Format macros into a short badge string.
 *
 * @param {{ calories: number, protein_g: number, carbs_g: number, fat_g: number }} result
 * @returns {string}  e.g. "280 cal · P 14g · C 38g · F 6g"
 */
export function foodResultToMacroString(result) {
  if (!result?.calories && result?.calories !== 0) return "";
  return `${result.calories} cal · P ${result.protein_g}g · C ${result.carbs_g}g · F ${result.fat_g}g`;
}
