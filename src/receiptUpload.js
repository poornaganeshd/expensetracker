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

// Compress + upload to Cloudinary, returns secure_url
export async function uploadReceipt(file) {
  const creds = getCredentials();
  const cloudName = creds.cloudName || "df1vedbox";
  const uploadPreset = creds.uploadPreset || "receipt_upload";
  if (!cloudName) throw new Error("Cloudinary not configured. Add your Cloud Name in Settings → Backend.");
  const blob = await compressImage(file);
  const form = new FormData();
  form.append("file", blob, "receipt.jpg");
  form.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  return data.secure_url;
}
