import { getCredentials } from "./credentials";
const MAX_WIDTH = 800;
const QUALITY = 0.7;

// Compress image via canvas before upload
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error("Compression failed")); return; }
        resolve(blob);
      }, "image/jpeg", QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("Failed to load image")); };
    img.src = blobUrl;
  });
}

// SHA-1 hex digest via Web Crypto API (available in all modern browsers + Node 14.17+)
async function sha1Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Returns true when a receipt URL is a locally-stored data URL (no Cloudinary).
// Use this in UI to show a "stored locally" badge or suppress broken-link warnings.
export function isLocalReceipt(url) {
  return typeof url === "string" && url.startsWith("data:");
}

// Compress a file and return it as a base64 data URL (local storage fallback).
function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

// Compress + upload to Cloudinary.
//
// Two modes (backwards-compatible):
//   Signed   — apiKey + apiSecret present → SHA-1 signature, no upload preset required
//   Unsigned — uploadPreset present, no apiSecret required
//
// Local fallback — when Cloudinary is not configured (no cloudName) OR when the
//   Cloudinary upload fails (network error, CORS, etc.), the file is compressed and
//   returned as a base64 data URL stored directly in the expense's receipt_url column.
//   Callers should check isLocalReceipt(url) to surface a "stored locally" notice.
//
// Returns the secure_url (remote) or a data: URL (local fallback).
export async function uploadReceipt(file) {
  const creds = getCredentials();
  const { cloudName, apiKey, apiSecret, uploadPreset } = creds;

  const isPdf = file.type === "application/pdf";
  const blob = isPdf ? file : await compressImage(file);

  // No Cloudinary configured — store locally
  if (!cloudName) {
    return await toDataUrl(blob);
  }

  // ── Cloudinary upload ─────────────────────────────────────────────────────
  const form = new FormData();
  form.append("file", blob, isPdf ? "receipt.pdf" : "receipt.jpg");

  if (apiKey && apiSecret) {
    // Signed upload
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1Hex(`timestamp=${timestamp}${apiSecret}`);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
  } else if (uploadPreset) {
    // Unsigned upload via an unsigned upload preset
    form.append("upload_preset", uploadPreset);
  } else {
    // cloudName set but no auth — store locally rather than blocking the user
    return await toDataUrl(blob);
  }

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${isPdf ? "raw" : "image"}/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      // Cloudinary returned 4xx (bad signature, bad creds, expired preset, quota) or 5xx.
      // Earlier impl threw here, which blocked the entire expense save — the user lost
      // their form input and the receipt vanished. Fall back to local data URL instead
      // so the expense saves with the receipt, and surface a console warning so the
      // user can diagnose the Cloudinary config via DevTools.
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Upload failed (${res.status})`;
      console.warn("Cloudinary upload rejected, storing receipt locally:", msg);
      return await toDataUrl(blob);
    }
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    // Network failure (DNS, offline, CORS preflight fail, etc.) — fall back to local.
    console.warn("Cloudinary upload failed, storing receipt locally:", err?.message || err);
    return await toDataUrl(blob);
  }
}
