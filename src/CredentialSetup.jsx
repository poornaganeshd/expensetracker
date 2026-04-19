import { useState } from "react";
import { getCredentials, saveCredentials } from "./credentials";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .ns-root {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: #F5F2ED;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 40px 20px 60px;
  }
  .ns-root.dark { background: #0C0C0C; }

  .ns-col { width: 100%; max-width: 440px; }

  /* ── Header ── */
  .ns-head { text-align: center; margin-bottom: 32px; }
  .ns-lion { font-size: 44px; line-height: 1; margin-bottom: 10px; }
  .ns-title {
    font-size: 22px; font-weight: 800; letter-spacing: 5px;
    color: #111111; margin-bottom: 6px;
  }
  .dark .ns-title { color: #F0EDE6; }
  .ns-subtitle {
    font-size: 13px; color: #8A8476; line-height: 1.65;
    font-weight: 400;
  }
  .dark .ns-subtitle { color: #666; }

  /* ── Provider cards ── */
  .ns-card {
    background: #FFFFFF;
    border: 1.5px solid rgba(0,0,0,0.07);
    border-radius: 16px;
    padding: 20px 20px 22px;
    margin-bottom: 12px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03);
  }
  .dark .ns-card {
    background: #161616;
    border-color: rgba(255,255,255,0.07);
    box-shadow: 0 1px 8px rgba(0,0,0,0.3);
  }

  .ns-card-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 18px;
  }
  .ns-card-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
  .ns-card-name {
    font-size: 14px; font-weight: 700; color: #111111;
    letter-spacing: 0.3px; flex: 1;
  }
  .dark .ns-card-name { color: #F0EDE6; }

  .ns-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
    border-radius: 6px; padding: 3px 8px;
    text-transform: uppercase; flex-shrink: 0;
  }
  .ns-badge-req { background: #FCEAE6; color: #C1714F; }
  .dark .ns-badge-req { background: #2D1810; color: #E07A5F; }
  .ns-badge-opt { background: #ECEAE6; color: #8A8476; }
  .dark .ns-badge-opt { background: #222; color: #666; }

  /* ── Fields ── */
  .ns-field { margin-bottom: 14px; }
  .ns-field:last-child { margin-bottom: 0; }

  .ns-label {
    display: block; font-size: 12px; font-weight: 600;
    color: #333333; margin-bottom: 6px; letter-spacing: 0.1px;
  }
  .dark .ns-label { color: #AAAAAA; }

  .ns-input {
    width: 100%; padding: 11px 14px;
    border-radius: 10px;
    border: 1.5px solid rgba(0,0,0,0.10);
    background: #F5F2ED;
    color: #111111;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .dark .ns-input {
    background: #0E0E0E;
    border-color: rgba(255,255,255,0.08);
    color: #F0EDE6;
  }
  .ns-input::placeholder { color: #B0ACA4; }
  .dark .ns-input::placeholder { color: #444; }

  .ns-input:focus {
    border-color: rgba(193,113,79,0.35);
    box-shadow: inset 3px 0 0 #C1714F;
    background: #FDF9F6;
  }
  .dark .ns-input:focus {
    border-color: rgba(193,113,79,0.3);
    background: #160E08;
  }

  /* ── Divider ── */
  .ns-divider {
    height: 1px; background: rgba(0,0,0,0.06);
    margin: 4px 0 12px;
  }
  .dark .ns-divider { background: rgba(255,255,255,0.05); }

  /* ── Buttons ── */
  .ns-btn-primary {
    width: 100%; padding: 14px;
    border-radius: 12px; border: none;
    background: #C1714F; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.2px;
    transition: background 0.15s, transform 0.1s;
    margin-bottom: 8px;
  }
  .ns-btn-primary:hover { background: #B06040; }
  .ns-btn-primary:active { transform: scale(0.99); }

  .ns-btn-restore {
    width: 100%; padding: 13px;
    border-radius: 12px;
    border: 1.5px solid rgba(0,0,0,0.10);
    background: transparent;
    color: #555550; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; text-align: center;
    display: block; transition: border-color 0.15s, color 0.15s;
    margin-bottom: 8px;
  }
  .dark .ns-btn-restore {
    border-color: rgba(255,255,255,0.10);
    color: #888;
  }
  .ns-btn-restore:hover { border-color: #C1714F; color: #C1714F; }

  .ns-cancel {
    width: 100%; padding: 12px;
    border-radius: 12px;
    border: 1.5px solid rgba(0,0,0,0.07);
    background: transparent;
    color: #AAA5A0; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    margin-bottom: 8px;
    transition: color 0.15s;
  }
  .dark .ns-cancel { border-color: rgba(255,255,255,0.07); color: #555; }
  .ns-cancel:hover { color: #666; }

  .ns-guide-link {
    display: flex; align-items: center; justify-content: center; gap: 4px;
    font-size: 12px; color: #AAA5A0; font-weight: 500;
    background: none; border: none; cursor: pointer;
    width: 100%; padding: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: color 0.15s;
    text-decoration: none;
  }
  .dark .ns-guide-link { color: #555; }
  .ns-guide-link:hover { color: #C1714F; }

  /* ── Guide panel ── */
  .ns-guide {
    margin-top: 12px;
    background: #EDEAE5;
    border-radius: 12px;
    padding: 16px 18px;
    font-size: 12px; color: #4A4844; line-height: 1.9;
  }
  .dark .ns-guide {
    background: #1A1A1A;
    color: #888;
  }
  .ns-guide strong { color: #111111; font-weight: 700; }
  .dark .ns-guide strong { color: #C8C4BC; }

  /* ── Error ── */
  .ns-error {
    font-size: 12px; color: #C1714F; font-weight: 600;
    text-align: center; margin: 8px 0 4px;
    padding: 10px 14px; background: #FCEAE6;
    border-radius: 10px;
  }
  .dark .ns-error { background: #2D1810; }
`;

export default function CredentialSetup({ onDone, onCancel }) {
  const existing = getCredentials();
  const [sbUrl, setSbUrl]               = useState(existing.sbUrl || "");
  const [sbKey, setSbKey]               = useState(existing.sbKey || "");
  const [cloudName, setCloudName]       = useState(existing.cloudName || "");
  const [uploadPreset, setUploadPreset] = useState(existing.uploadPreset || "");
  const [error, setError]               = useState("");
  const [showGuide, setShowGuide]       = useState(false);

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const importConfig = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.sbUrl || !d.sbKey) { setError("Invalid config — missing Supabase credentials."); return; }
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

  return (
    <div className={`ns-root${prefersDark ? " dark" : ""}`}>
      <style>{STYLES}</style>

      <div className="ns-col">

        {/* ── Header ── */}
        <div className="ns-head">
          <div className="ns-lion">🦁</div>
          <div className="ns-title">NOMAD</div>
          <div className="ns-subtitle">
            Connect your own backend to keep<br />your data completely private.
          </div>
        </div>

        {/* ── Supabase card ── */}
        <div className="ns-card">
          <div className="ns-card-head">
            <span className="ns-card-icon">🗄️</span>
            <span className="ns-card-name">Supabase</span>
            <span className="ns-badge ns-badge-req">Required</span>
          </div>

          <div className="ns-field">
            <label className="ns-label">Project URL</label>
            <input
              className="ns-input"
              value={sbUrl}
              onChange={e => { setSbUrl(e.target.value); setError(""); }}
              placeholder="https://xxxx.supabase.co"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="ns-field">
            <label className="ns-label">Anon / Public Key</label>
            <input
              className="ns-input"
              value={sbKey}
              onChange={e => { setSbKey(e.target.value); setError(""); }}
              placeholder="eyJhbGciOiJIUzI1NiIs…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* ── Cloudinary card ── */}
        <div className="ns-card">
          <div className="ns-card-head">
            <span className="ns-card-icon">🖼️</span>
            <span className="ns-card-name">Cloudinary</span>
            <span className="ns-badge ns-badge-opt">Optional</span>
          </div>
          <p style={{ fontSize: 12, color: "#AAA5A0", margin: "0 0 16px", lineHeight: 1.6, fontStyle: "italic" }}>
            Only needed for receipt photo uploads.
          </p>

          <div className="ns-field">
            <label className="ns-label">Cloud Name</label>
            <input
              className="ns-input"
              value={cloudName}
              onChange={e => setCloudName(e.target.value)}
              placeholder="your-cloud-name"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="ns-field">
            <label className="ns-label">Upload Preset</label>
            <input
              className="ns-input"
              value={uploadPreset}
              onChange={e => setUploadPreset(e.target.value)}
              placeholder="receipt_upload"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* ── Error ── */}
        {error && <div className="ns-error">{error}</div>}

        {/* ── Footer actions ── */}
        <div style={{ marginTop: 16 }}>
          <button className="ns-btn-primary" onClick={save}>
            Save &amp; Continue →
          </button>

          <label className="ns-btn-restore">
            Restore from config backup
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) importConfig(e.target.files[0]); e.target.value = ""; }}
            />
          </label>

          {onCancel && (
            <button className="ns-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}

          <button
            className="ns-guide-link"
            onClick={() => setShowGuide(v => !v)}
          >
            How do I get these credentials?&nbsp;
            <span style={{ fontSize: 13, fontWeight: 700 }}>↗</span>
          </button>
        </div>

        {/* ── Credentials guide ── */}
        {showGuide && (
          <div className="ns-guide">
            <strong>Supabase (free)</strong><br />
            1. Sign up at supabase.com → New project<br />
            2. Settings → API → copy "Project URL" and "anon public" key<br />
            3. Run <em>nomad_setup.sql</em> in the SQL Editor<br />
            <br />
            <strong>Cloudinary (free, optional)</strong><br />
            1. Sign up at cloudinary.com<br />
            2. Dashboard → copy your "Cloud name"<br />
            3. Settings → Upload → add unsigned upload preset → copy name
          </div>
        )}

      </div>
    </div>
  );
}
