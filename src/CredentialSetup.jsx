import { useState } from "react";
import { getCredentials, saveCredentials } from "./credentials";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,opsz,wght@0,8..18,400;0,8..18,500;0,8..18,600;0,8..18,700;0,8..18,800;1,8..18,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ns-root {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: linear-gradient(145deg, #EEE9FF 0%, #FFE8F5 38%, #E0F0FF 72%, #E8FFEF 100%);
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 44px 20px 72px;
    position: relative;
    overflow: hidden;
  }

  /* decorative blobs */
  .ns-root::before {
    content: '';
    position: fixed;
    top: -120px; left: -100px;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(196,181,253,0.38) 0%, transparent 70%);
    pointer-events: none;
  }
  .ns-root::after {
    content: '';
    position: fixed;
    bottom: -100px; right: -80px;
    width: 380px; height: 380px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249,168,212,0.32) 0%, transparent 70%);
    pointer-events: none;
  }

  .ns-col { width: 100%; max-width: 440px; position: relative; z-index: 1; }

  /* ── Header ── */
  .ns-head { text-align: center; margin-bottom: 30px; }

  .ns-logomark {
    width: 52px; height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, #A78BFA, #F472B6);
    display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
    box-shadow: 0 6px 24px rgba(167,139,250,0.38), 0 2px 8px rgba(244,114,182,0.2);
  }
  .ns-logomark svg { display: block; }

  .ns-title {
    font-size: 24px; font-weight: 800; letter-spacing: 5px;
    background: linear-gradient(120deg, #7C3AED, #DB2777);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 7px;
  }
  .ns-subtitle {
    font-size: 13px;
    color: #8B7EA8;
    line-height: 1.7; font-weight: 400;
  }

  /* ── Cards ── */
  .ns-card {
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(18px) saturate(1.6);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    border: 1.5px solid rgba(255,255,255,0.95);
    border-radius: 20px;
    padding: 22px 22px 24px;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .ns-card-sb {
    box-shadow: 0 4px 24px rgba(52,211,153,0.10), 0 1px 6px rgba(0,0,0,0.05);
  }
  .ns-card-sb:hover {
    box-shadow: 0 6px 32px rgba(52,211,153,0.18), 0 2px 8px rgba(0,0,0,0.06);
  }
  .ns-card-sb::before {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #34D399, #059669);
    border-radius: 20px 0 0 20px;
  }
  .ns-card-cl {
    box-shadow: 0 4px 24px rgba(167,139,250,0.12), 0 1px 6px rgba(0,0,0,0.05);
  }
  .ns-card-cl:hover {
    box-shadow: 0 6px 32px rgba(167,139,250,0.22), 0 2px 8px rgba(0,0,0,0.06);
  }
  .ns-card-cl::before {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #A78BFA, #7C3AED);
    border-radius: 20px 0 0 20px;
  }

  /* tinted card header area */
  .ns-card-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .ns-card-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 18px; line-height: 1;
  }
  .ns-card-sb .ns-card-icon-wrap {
    background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
    box-shadow: 0 2px 10px rgba(52,211,153,0.25);
  }
  .ns-card-cl .ns-card-icon-wrap {
    background: linear-gradient(135deg, #EDE9FE, #DDD6FE);
    box-shadow: 0 2px 10px rgba(167,139,250,0.25);
  }
  .ns-card-name {
    font-size: 14px; font-weight: 700; color: #1A1033;
    letter-spacing: 0.2px; flex: 1;
  }
  .ns-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
    border-radius: 20px; padding: 3px 9px;
    text-transform: uppercase; flex-shrink: 0;
  }
  .ns-badge-req {
    background: linear-gradient(120deg, #FEE2E2, #FCE7F3);
    color: #BE185D;
    box-shadow: 0 1px 6px rgba(244,114,182,0.2);
  }
  .ns-badge-opt {
    background: linear-gradient(120deg, #EDE9FE, #E0E7FF);
    color: #6D28D9;
    box-shadow: 0 1px 6px rgba(167,139,250,0.18);
  }

  /* ── Fields ── */
  .ns-field { margin-bottom: 14px; }
  .ns-field:last-child { margin-bottom: 0; }

  .ns-label {
    display: block; font-size: 12px; font-weight: 600;
    color: #4B3F6B; margin-bottom: 6px;
  }
  .ns-hint {
    font-size: 11px; color: #A79EC0; font-weight: 400;
    font-style: italic; margin-bottom: 16px; line-height: 1.55;
    display: block;
  }

  .ns-input {
    width: 100%; padding: 11px 14px;
    border-radius: 11px;
    border: 1.5px solid rgba(180,160,220,0.25);
    background: rgba(255,255,255,0.72);
    color: #1A1033;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .ns-input::placeholder { color: #C4B8D8; }

  .ns-card-sb .ns-input:focus {
    border-color: rgba(52,211,153,0.5);
    background: rgba(240,255,249,0.9);
    box-shadow: 0 0 0 3px rgba(52,211,153,0.12), inset 3px 0 0 #34D399;
  }
  .ns-card-cl .ns-input:focus {
    border-color: rgba(167,139,250,0.5);
    background: rgba(246,243,255,0.9);
    box-shadow: 0 0 0 3px rgba(167,139,250,0.14), inset 3px 0 0 #A78BFA;
  }

  /* ── Error ── */
  .ns-error {
    font-size: 12px; font-weight: 600;
    color: #BE185D;
    padding: 10px 14px;
    background: linear-gradient(120deg, rgba(254,226,226,0.85), rgba(252,231,243,0.85));
    border-radius: 10px;
    border: 1px solid rgba(244,114,182,0.2);
    text-align: center;
    margin: 4px 0 8px;
    backdrop-filter: blur(6px);
  }

  /* ── Footer ── */
  .ns-footer { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }

  .ns-btn-primary {
    width: 100%; padding: 15px;
    border-radius: 14px; border: none;
    background: linear-gradient(120deg, #A78BFA 0%, #F472B6 100%);
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.2px;
    box-shadow: 0 4px 20px rgba(167,139,250,0.40), 0 2px 8px rgba(244,114,182,0.24);
    transition: box-shadow 0.18s, transform 0.1s;
  }
  .ns-btn-primary:hover {
    box-shadow: 0 6px 28px rgba(167,139,250,0.55), 0 3px 12px rgba(244,114,182,0.32);
    transform: translateY(-1px);
  }
  .ns-btn-primary:active { transform: scale(0.99) translateY(0); }

  .ns-btn-restore {
    width: 100%; padding: 13px;
    border-radius: 14px;
    border: 1.5px solid rgba(167,139,250,0.35);
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(8px);
    color: #7C3AED;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; text-align: center;
    display: block;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .ns-btn-restore:hover {
    border-color: rgba(167,139,250,0.7);
    background: rgba(237,233,254,0.6);
    box-shadow: 0 2px 12px rgba(167,139,250,0.18);
  }

  .ns-btn-cancel {
    width: 100%; padding: 12px;
    border-radius: 14px;
    border: 1.5px solid rgba(180,160,220,0.22);
    background: transparent;
    color: #B0A0C8;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: color 0.15s;
  }
  .ns-btn-cancel:hover { color: #7C3AED; border-color: rgba(167,139,250,0.35); }

  .ns-guide-link {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    font-size: 12px; color: #B0A0C8; font-weight: 500;
    background: none; border: none; cursor: pointer;
    width: 100%; padding: 4px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: color 0.15s;
  }
  .ns-guide-link:hover { color: #A78BFA; }

  /* ── Guide panel ── */
  .ns-guide {
    margin-top: 4px;
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(12px);
    border: 1.5px solid rgba(255,255,255,0.9);
    border-radius: 14px;
    padding: 16px 18px;
    font-size: 12px; color: #5E4D7A; line-height: 1.95;
  }
  .ns-guide strong { color: #3B1F6E; font-weight: 700; }
  .ns-guide em { color: #A78BFA; font-style: normal; font-weight: 600; }
`;

/* ── SVG icon components ── */
function IconDb() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <ellipse cx="9" cy="5" rx="6" ry="2.5" stroke="#059669" strokeWidth="1.6" fill="rgba(52,211,153,0.18)" />
      <path d="M3 5v4c0 1.38 2.686 2.5 6 2.5S15 10.38 15 9V5" stroke="#059669" strokeWidth="1.6" fill="none" />
      <path d="M3 9v4c0 1.38 2.686 2.5 6 2.5S15 14.38 15 13V9" stroke="#059669" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M13.5 12.5H5a3 3 0 1 1 .424-5.976A4 4 0 1 1 13.5 9a2.5 2.5 0 0 1 0 3.5z"
        stroke="#7C3AED" strokeWidth="1.6" strokeLinejoin="round"
        fill="rgba(167,139,250,0.18)" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display:"inline", verticalAlign:"middle", marginRight:4, opacity:0.65 }}>
      <rect x="2.5" y="6" width="9" height="6.5" rx="2" stroke="#A78BFA" strokeWidth="1.4" fill="rgba(167,139,250,0.1)" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#A78BFA" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

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
    <div className="ns-root">
      <style>{STYLES}</style>
      <div className="ns-col">

        {/* ── Header ── */}
        <div className="ns-head">
          <div>
            <div className="ns-logomark">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M5 20 L5 6 L13 6 L21 13 L13 20 Z" fill="rgba(255,255,255,0.9)" />
                <circle cx="18" cy="18" r="5" fill="rgba(255,255,255,0.5)" />
              </svg>
            </div>
          </div>
          <div className="ns-title">NOMAD</div>
          <div className="ns-subtitle">
            Connect your own backend.<br />Your data stays completely private.
          </div>
        </div>

        {/* ── Supabase card ── */}
        <div className="ns-card ns-card-sb">
          <div className="ns-card-head">
            <div className="ns-card-icon-wrap"><IconDb /></div>
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
            <label className="ns-label">
              <IconLock />Anon / Public Key
            </label>
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
        <div className="ns-card ns-card-cl">
          <div className="ns-card-head">
            <div className="ns-card-icon-wrap"><IconCloud /></div>
            <span className="ns-card-name">Cloudinary</span>
            <span className="ns-badge ns-badge-opt">Optional</span>
          </div>
          <span className="ns-hint">Only needed for receipt photo uploads.</span>

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

        {/* ── Footer ── */}
        <div className="ns-footer">
          <button className="ns-btn-primary" onClick={save}>
            Save &amp; Continue →
          </button>

          <label className="ns-btn-restore">
            ↩ Restore from config backup
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) importConfig(e.target.files[0]); e.target.value = ""; }}
            />
          </label>

          {onCancel && (
            <button className="ns-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}

          <button className="ns-guide-link" onClick={() => setShowGuide(v => !v)}>
            How do I get these credentials?
            <span style={{ fontSize: 14, fontWeight: 700 }}>↗</span>
          </button>

          {showGuide && (
            <div className="ns-guide">
              <strong>Supabase (free)</strong><br />
              1. Sign up at supabase.com → New project<br />
              2. Settings → API → copy "Project URL" &amp; "anon public" key<br />
              3. Run <em>nomad_setup.sql</em> in the SQL Editor<br />
              <br />
              <strong>Cloudinary (free, optional)</strong><br />
              1. Sign up at cloudinary.com<br />
              2. Dashboard → copy your "Cloud name"<br />
              3. Settings → Upload → add unsigned preset → copy name
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
