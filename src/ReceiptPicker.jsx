import { useState, useRef } from "react";
import { uploadReceipt } from "./receiptUpload";

export default function ReceiptPicker({ onUrlReady }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const prevUrlRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const prev = URL.createObjectURL(file);
    prevUrlRef.current = prev;
    setPreview(prev);
    setUploading(true);
    setError(null);
    setDone(false);
    onUrlReady(null);
    try {
      const url = await uploadReceipt(file);
      onUrlReady(url);
      setDone(true);
    } catch (err) {
      setError("Upload failed. Tap to retry.");
      onUrlReady(null);
    } finally {
      setUploading(false);
    }
  };

  const clear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (prevUrlRef.current) { URL.revokeObjectURL(prevUrlRef.current); prevUrlRef.current = null; }
    setPreview(null);
    setError(null);
    setDone(false);
    onUrlReady(null);
  };

  if (!preview) {
    return (
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "1.5px dashed var(--border)", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: "var(--font-h)", fontWeight: 600, color: "var(--muted)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Attach Receipt
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      </label>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border)", flexShrink: 0 }}>
        <img src={preview} alt="receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg>
          </div>
        )}
        {done && !uploading && (
          <div style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: "#6BAA75", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        {uploading && <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-h)" }}>Uploading…</div>}
        {done && !uploading && <div style={{ fontSize: 11, color: "#6BAA75", fontFamily: "var(--font-h)", fontWeight: 600 }}>Receipt saved</div>}
        {error && (
          <label style={{ fontSize: 11, color: "#D4726A", fontFamily: "var(--font-h)", fontWeight: 600, cursor: "pointer" }}>
            {error}
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          </label>
        )}
      </div>
      <button onClick={clear} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, opacity: 0.5, padding: "4px 6px" }}>✕</button>
    </div>
  );
}
