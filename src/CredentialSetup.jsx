import { useState } from "react";
import { getCredentials, saveCredentials } from "./credentials";

export default function CredentialSetup({ onDone, onCancel }) {
  const existing = getCredentials();
  const [sbUrl, setSbUrl]               = useState(existing.sbUrl || "");
  const [sbKey, setSbKey]               = useState(existing.sbKey || "");
  const [cloudName, setCloudName]       = useState(existing.cloudName || "");
  const [uploadPreset, setUploadPreset] = useState(existing.uploadPreset || "");
  const [error, setError]               = useState("");
  const [showGuide, setShowGuide]       = useState(false);

  const importConfig = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.sbUrl || !d.sbKey) { setError("Invalid config file — missing Supabase credentials."); return; }
        saveCredentials({ sbUrl: d.sbUrl, sbKey: d.sbKey, cloudName: d.cloudName || "", uploadPreset: d.uploadPreset || "" });
        onDone();
      } catch { setError("Failed to read config file."); }
    };
    r.readAsText(file);
  };

  const save = () => {
    if (!sbUrl.trim() || !sbKey.trim()) { setError("Supabase URL and Anon Key are required."); return; }
    saveCredentials({ sbUrl: sbUrl.trim(), sbKey: sbKey.trim(), cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() });
    onDone();
  };

  const bg       = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F2F0EB", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px 20px", boxSizing: "border-box" };
  const card     = { background: "#fff", borderRadius: 24, padding: "28px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" };
  const lbl      = { display: "block", fontSize: 11, fontWeight: 600, color: "#8A8A9A", letterSpacing: "1px", marginBottom: 6, textTransform: "uppercase" };
  const inp      = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.08)", background: "#F2F0EB", color: "#1A1A2E", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 14 };
  const secTitle = { fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={bg}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Nunito:wght@400;600&display=swap')`}</style>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🦁</div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 2, color: "#1A1A2E" }}>NOMAD</div>
          <div style={{ fontSize: 13, color: "#8A8A9A", marginTop: 6, lineHeight: 1.6 }}>Connect your own backend to keep<br />your data completely private.</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={secTitle}>☁️ Supabase <span style={{ fontWeight: 400, fontSize: 11, color: "#8A8A9A" }}>(required)</span></div>
          <label style={lbl}>Project URL</label>
          <input style={inp} value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoComplete="off" spellCheck={false} />
          <label style={lbl}>Anon / Public Key</label>
          <input style={{ ...inp, marginBottom: 0 }} value={sbKey} onChange={e => setSbKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." autoComplete="off" spellCheck={false} />
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", margin: "20px 0" }} />

        <div style={{ marginBottom: 8 }}>
          <div style={secTitle}>🖼️ Cloudinary <span style={{ fontWeight: 400, fontSize: 11, color: "#8A8A9A" }}>(optional — for receipt photos)</span></div>
          <label style={lbl}>Cloud Name</label>
          <input style={inp} value={cloudName} onChange={e => setCloudName(e.target.value)} placeholder="your-cloud-name" autoComplete="off" spellCheck={false} />
          <label style={lbl}>Upload Preset</label>
          <input style={{ ...inp, marginBottom: 0 }} value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} placeholder="receipt_upload" autoComplete="off" spellCheck={false} />
        </div>

        {error && <div style={{ fontSize: 12, color: "#D4726A", margin: "10px 0 4px", textAlign: "center", fontWeight: 600 }}>{error}</div>}

        <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#E07A5F", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 14 }} onClick={save}>
          Save & Continue →
        </button>

        <label style={{ display: "block", width: "100%", padding: "13px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.10)", background: "none", color: "#6BAA75", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center", marginTop: 8, boxSizing: "border-box" }}>
          Restore from config backup
          <input type="file" accept=".json" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) importConfig(e.target.files[0]); e.target.value = ""; }} />
        </label>
        {onCancel && <button onClick={onCancel} style={{ width: "100%", marginTop: 8, padding: "12px", border: "1.5px solid rgba(0,0,0,0.08)", borderRadius: 12, background: "none", color: "#8A8A9A", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>}

        <button onClick={() => setShowGuide(v => !v)} style={{ width: "100%", marginTop: 12, padding: "10px", border: "none", background: "none", color: "#8A8A9A", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
          {showGuide ? "Hide guide" : "How do I get these credentials?"}
        </button>

        {showGuide && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#4A4A5A", lineHeight: 1.9, background: "#F2F0EB", borderRadius: 12, padding: "14px 16px" }}>
            <strong>Supabase (free):</strong><br />
            1. Sign up at supabase.com → New project<br />
            2. Settings → API → copy "Project URL" and "anon public" key<br />
            3. Run the table setup SQL in the SQL Editor<br /><br />
            <strong>Cloudinary (free, optional):</strong><br />
            1. Sign up at cloudinary.com<br />
            2. Dashboard → copy your "Cloud name"<br />
            3. Settings → Upload → Add unsigned upload preset → copy preset name
          </div>
        )}
      </div>
    </div>
  );
}
