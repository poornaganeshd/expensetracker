import { useState, useEffect, useMemo, useRef } from "react";

const APP_NAME = "NOMAD";
const CURRENCY = "₹";

const WALLETS = [
  { id: "upi_lite", name: "UPI Lite", color: "#00D4FF", neon: "#00E5FF" },
  { id: "bank", name: "Bank Account", color: "#34D399", neon: "#6EE7B7" },
  { id: "cash", name: "Cash", color: "#FBBF24", neon: "#FDE68A" },
];

// Wallets that can receive income
const INCOME_WALLETS = WALLETS.filter(w => w.id !== "upi_lite");

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Drinks", color: "#FF6B35", neon: "#FF9F1C" },
  { id: "transport", name: "Transport", color: "#00D4FF", neon: "#00E5FF" },
  { id: "rent", name: "Rent & Bills", color: "#A78BFA", neon: "#C4B5FD" },
  { id: "entertainment", name: "Entertainment", color: "#F472B6", neon: "#FF8ED4" },
  { id: "health", name: "Health", color: "#34D399", neon: "#6EE7B7" },
  { id: "coffee", name: "Coffee / Snacks", color: "#FBBF24", neon: "#FDE68A" },
  { id: "personal", name: "Personal Care", color: "#E879F9", neon: "#F0ABFC" },
];

/* ─── NEON ICON SYSTEM ─── */
function DualIcon({ id, accent, size = 18, outline }) {
  const N = accent || "#00E5FF";
  const glow = `drop-shadow(0 0 3px ${N}88) drop-shadow(0 0 8px ${N}44)`;
  const p = { viewBox: "0 0 24 24", width: size, height: size, fill: "none", style: { filter: glow } };
  const ls = { stroke: N, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const dim = { stroke: N, strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.4 };

  switch (id) {
    case "food": return <svg {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" {...ls}/><path d="M7 2v20" {...ls}/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" {...ls}/></svg>;
    case "transport": return <svg {...p}><rect x="3" y="7" width="18" height="10" rx="2" {...ls}/><circle cx="7.5" cy="17" r="2" {...ls}/><circle cx="16.5" cy="17" r="2" {...ls}/><path d="M5.5 7L7 3h10l1.5 4" {...dim}/></svg>;
    case "rent": return <svg {...p}><path d="M3 10l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...ls}/><polyline points="9 22 9 13 15 13 15 22" {...dim}/></svg>;
    case "entertainment": return <svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" {...ls}/><line x1="6" y1="12" x2="10" y2="12" {...dim}/><line x1="8" y1="10" x2="8" y2="14" {...dim}/><circle cx="16" cy="10.5" r="1.5" fill={N} stroke="none" opacity="0.7"/><circle cx="18.5" cy="13" r="1.5" fill={N} stroke="none" opacity="0.4"/></svg>;
    case "health": return <svg {...p}><rect x="4" y="8" width="16" height="13" rx="2" {...ls}/><path d="M8 2h8v6H8z" {...dim}/><line x1="10" y1="14.5" x2="14" y2="14.5" {...ls}/><line x1="12" y1="12.5" x2="12" y2="16.5" {...ls}/></svg>;
    case "coffee": return <svg {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1" {...dim}/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" {...ls}/><line x1="6" y1="2" x2="6" y2="5" {...ls} opacity="0.6"/><line x1="10" y1="2" x2="10" y2="5" {...ls} opacity="0.6"/><line x1="14" y1="2" x2="14" y2="5" {...ls} opacity="0.6"/></svg>;
    case "personal": return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...ls}/><circle cx="12" cy="7" r="4" {...ls}/></svg>;
    case "upi_lite": return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...ls}/></svg>;
    case "bank": return <svg {...p}><path d="M3 21h18" {...ls}/><path d="M3 10h18" {...ls}/><path d="M12 2L2 10h20L12 2z" {...ls}/><rect x="5" y="10" width="3" height="8" {...dim}/><rect x="10.5" y="10" width="3" height="8" {...dim}/><rect x="16" y="10" width="3" height="8" {...dim}/></svg>;
    case "cash": return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" {...ls}/><circle cx="12" cy="12" r="4" {...dim}/><circle cx="12" cy="12" r="1.5" fill={N} stroke="none" opacity="0.7"/></svg>;
    case "allowance": return <svg {...p}><path d="M12 2v20" {...ls}/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" {...ls}/></svg>;
    case "gifts": return <svg {...p}><rect x="3" y="8" width="18" height="14" rx="2" {...ls}/><path d="M12 8v14" {...dim}/><path d="M3 14h18" {...dim}/><path d="M7.5 8C6 6.5 6 4 8 3s3.5 2.5 4 5" {...ls}/><path d="M16.5 8c1.5-1.5 1.5-4-.5-5s-3.5 2.5-4 5" {...ls}/></svg>;
    case "investments": return <svg {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" {...ls}/><polyline points="16 7 22 7 22 13" {...ls}/></svg>;
    default: return <span style={{ fontSize: size * 0.9 }}>📁</span>;
  }
}
function ItemIcon({ item, size = 18 }) {
  return <DualIcon id={item.id} accent={item.neon || item.color} size={size}/>;
}

const DEFAULT_INCOME_SOURCES = [
  { id: "allowance", name: "Allowance", color: "#34D399", neon: "#6EE7B7" },
  { id: "gifts", name: "Gifts", color: "#FF6B35", neon: "#FF9F1C" },
  { id: "investments", name: "Investments", color: "#00D4FF", neon: "#00E5FF" },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n) => CURRENCY + Number(n).toLocaleString("en-IN");
const monthKey = (d) => d.slice(0, 7);

const labelStyle = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6, display: "block", fontFamily: "var(--font-heading)", fontWeight: 600 };
const inputStyle = { background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", width: "100%", boxSizing: "border-box" };
const monthLabel = (k) => { const [y, m] = k.split("-"); return new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); };
const dayLabel = (d) => {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Today";
  if (d === yest) return "Yesterday";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

/* ─── LION ─── */
const LION_TIPS = ["Track every chai! Small spends add up fast.","Saving ₹50/day = ₹1500/month!","Review your week every Sunday!","Needs vs wants — ask before buying!","You're doing great, keep tracking!","Set a weekly food budget challenge!","Unsubscribe from stuff you don't use!","Cook at home once more this week!"];
const LION_HAPPY = ["Roarrr! You're saving well!","King of budgets right here!","More income than spending! Nice!","Proud of you, human!","Your wallet is smiling!"];
const LION_SAD = ["Uh oh… spending > income","Time to tighten the belt, friend.","Let's slow down a bit, okay?","I believe in you! Cut one expense!","Ramen week? We got this."];

function LionSVG({ mood, dancing }) {
  const [bounce, setBounce] = useState(false);
  useEffect(() => { if (!dancing) { setBounce(false); return; } setBounce(true); const to = setTimeout(() => setBounce(false), 1600); return () => clearTimeout(to); }, [dancing]);
  const mane = mood === "happy" ? "#E07A5F" : "#b0aea5";
  const face = "#fae6c8", nose = mood === "happy" ? "#D4726A" : "#999";
  return (
    <svg viewBox="0 0 80 80" width="56" height="56" style={{ transition: "transform 0.2s", transform: bounce ? "translateY(-6px) rotate(-5deg)" : "none", animation: bounce ? "lionDance 0.3s ease infinite alternate" : "none" }}>
      <circle cx="40" cy="40" r="32" fill={mane} opacity="0.9"/><circle cx="20" cy="25" r="10" fill={mane} opacity="0.7"/><circle cx="60" cy="25" r="10" fill={mane} opacity="0.7"/>
      <circle cx="15" cy="42" r="9" fill={mane} opacity="0.6"/><circle cx="65" cy="42" r="9" fill={mane} opacity="0.6"/>
      <circle cx="24" cy="60" r="8" fill={mane} opacity="0.5"/><circle cx="56" cy="60" r="8" fill={mane} opacity="0.5"/>
      <circle cx="40" cy="42" r="22" fill={face}/>
      {mood === "happy" ? (<><path d="M30 38 Q33 34 36 38" stroke="#141413" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M44 38 Q47 34 50 38" stroke="#141413" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>) : (<><circle cx="33" cy="37" r="3" fill="#141413"/><circle cx="47" cy="37" r="3" fill="#141413"/><path d="M30 34 L36 36" stroke="#141413" strokeWidth="1.5" strokeLinecap="round"/><path d="M50 34 L44 36" stroke="#141413" strokeWidth="1.5" strokeLinecap="round"/></>)}
      <ellipse cx="40" cy="45" rx="4" ry="3" fill={nose}/>
      {mood === "happy" ? <path d="M34 49 Q40 55 46 49" stroke="#141413" strokeWidth="1.8" fill="none" strokeLinecap="round"/> : <path d="M34 52 Q40 48 46 52" stroke="#141413" strokeWidth="1.8" fill="none" strokeLinecap="round"/>}
      <circle cx="22" cy="22" r="6" fill={face}/><circle cx="58" cy="22" r="6" fill={face}/><circle cx="22" cy="22" r="3" fill="#f0c4b0"/><circle cx="58" cy="22" r="3" fill="#f0c4b0"/>
    </svg>
  );
}
function LionMascot({ balance, dancing }) {
  const [msg, setMsg] = useState("");
  const mood = balance >= 0 ? "happy" : "sad";
  useEffect(() => { const pool = Math.random() < 0.5 ? LION_TIPS : (mood === "happy" ? LION_HAPPY : LION_SAD); setMsg(pool[Math.floor(Math.random() * pool.length)]); }, [balance, mood]);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, padding: "12px 0" }}>
      <LionSVG mood={mood} dancing={dancing}/>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 220, fontFamily: "var(--font-body)", lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>{msg}</div>
    </div>
  );
}

/* ─── LINE CHART ─── */
function LineChart({ expenses, incomes, months }) {
  if (months.length < 1) return <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24, fontFamily: "var(--font-body)" }}>Add transactions to see trends</p>;
  const getData = (m) => ({ inc: incomes.filter((i) => monthKey(i.date) === m).reduce((s, i) => s + i.amount, 0), exp: expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0) });
  const data = months.map(getData);
  const maxVal = Math.max(...data.flatMap((d) => [d.inc, d.exp]), 1);
  const w = 320, h = 140, px = 44, py = 16, gw = w - px * 2, gh = h - py * 2;
  const toX = (i) => px + (months.length === 1 ? gw / 2 : (i / (months.length - 1)) * gw);
  const toY = (v) => py + gh - (v / maxVal) * gh;
  const makePath = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d[key])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 28}`} width="100%" style={{ display: "block" }}>
      {[0, 0.5, 1].map((f, i) => (<g key={i}><line x1={px} x2={w - px} y1={toY(maxVal * f)} y2={toY(maxVal * f)} stroke="var(--border)" strokeDasharray="3 3"/><text x={2} y={toY(maxVal * f) + 4} fill="var(--muted)" fontSize={9} fontFamily="var(--font-heading)">{fmt(Math.round(maxVal * f))}</text></g>))}
      <path d={`${makePath("inc")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#6BAA75" opacity="0.08"/>
      <path d={`${makePath("exp")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#E07A5F" opacity="0.08"/>
      <path d={makePath("inc")} fill="none" stroke="#6BAA75" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      <path d={makePath("exp")} fill="none" stroke="#E07A5F" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (<g key={i}><circle cx={toX(i)} cy={toY(d.inc)} r={4} fill="var(--card)" stroke="#6BAA75" strokeWidth={2}/><circle cx={toX(i)} cy={toY(d.exp)} r={4} fill="var(--card)" stroke="#E07A5F" strokeWidth={2}/><text x={toX(i)} y={h + 18} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-heading)">{monthLabel(months[i])}</text></g>))}
      <g transform={`translate(${w / 2 - 55}, ${h + 6})`}><circle cx={0} cy={16} r={4} fill="#6BAA75"/><text x={8} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Income</text><circle cx={68} cy={16} r={4} fill="#E07A5F"/><text x={76} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Spent</text></g>
    </svg>
  );
}

/* ─── HEATMAP ─── */
function SpendingHeatmap({ expenses }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const goBack = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const goForward = () => { const isCur = viewYear === today.getFullYear() && viewMonth === today.getMonth(); if (isCur) return; if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };
  const isCur = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
  const mName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const mPfx = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const dt = {}; expenses.forEach(e => { if (e.date.startsWith(mPfx)) dt[e.date] = (dt[e.date] || 0) + e.amount; });
  const mx = Math.max(...Object.values(dt), 1);
  const mTotal = Object.values(dt).reduce((s, v) => s + v, 0);
  const actD = Object.keys(dt).length;
  const gc = (a) => { if (!a) return "var(--border)"; const r = a / mx; return r < 0.25 ? "#6BAA75" : r < 0.5 ? "#c9a253" : r < 0.75 ? "#E07A5F" : "#D4726A"; };
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} style={{ width: 36, height: 36 }}/>);
  for (let d = 1; d <= dim; d++) {
    const ds = `${mPfx}-${String(d).padStart(2, "0")}`;
    const a = dt[ds] || 0; const isT = isCur && d === today.getDate();
    cells.push(<div key={d} title={a ? fmt(a) : "No spending"} style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: gc(a), color: a ? "#fff" : "var(--muted)", fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: isT ? 700 : 500, border: isT ? "2px solid var(--text)" : "2px solid transparent", cursor: "default" }}>{d}</div>);
  }
  const nb = { background: "none", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontFamily: "var(--font-heading)" };
  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={goBack} style={nb}>←</button>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{mName}</div>{!isCur && <button onClick={goToday} style={{ background: "none", border: "none", fontSize: 10, color: "#E07A5F", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600, marginTop: 2 }}>Jump to today</button>}</div>
        <button onClick={goForward} style={{ ...nb, opacity: isCur ? 0.3 : 1, cursor: isCur ? "default" : "pointer" }}>→</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}><div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>TOTAL</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "#E07A5F", marginTop: 2 }}>{fmt(mTotal)}</div></div>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}><div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>AVG/DAY</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", marginTop: 2 }}>{fmt(actD > 0 ? Math.round(mTotal / actD) : 0)}</div></div>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}><div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>DAYS</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", marginTop: 2 }}>{actD}/{dim}</div></div>
      </div>
      <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>{["S","M","T","W","T","F","S"].map((d, i) => <div key={i} style={{ width: 36, textAlign: "center", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>{d}</div>)}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{cells}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center", alignItems: "center" }}>
        {[{ c: "var(--border)", l: "None" },{ c: "#6BAA75", l: "Low" },{ c: "#c9a253", l: "Med" },{ c: "#E07A5F", l: "High" },{ c: "#D4726A", l: "Heavy" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: x.c }}/><span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)" }}>{x.l}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ─── WEEKLY REPORT ─── */
function WeeklyReport({ expenses }) {
  const today = new Date();
  const dow = today.getDay();
  const ws = new Date(today); ws.setDate(today.getDate() - dow);
  const lws = new Date(ws); lws.setDate(ws.getDate() - 7);
  const inR = (e, s, days) => { const d = new Date(e.date); const end = new Date(s); end.setDate(s.getDate() + days); return d >= s && d < end; };
  const tw = expenses.filter(e => inR(e, ws, 7));
  const lw = expenses.filter(e => inR(e, lws, 7));
  const tt = tw.reduce((s, e) => s + e.amount, 0);
  const lt = lw.reduce((s, e) => s + e.amount, 0);
  const pwt = []; for (let w = 1; w <= 12; w++) { const s = new Date(ws); s.setDate(ws.getDate() - w * 7); const t = expenses.filter(e => inR(e, s, 7)).reduce((sum, e) => sum + e.amount, 0); if (t > 0) pwt.push(t); }
  const avg = pwt.length > 0 ? pwt.reduce((s, v) => s + v, 0) / pwt.length : 0;
  const at = avg > 0 ? avg : (tt > 0 ? tt * 1.2 : 1000);
  const ts = Math.max(0, 40 - (tt / at) * 40);
  const trs = lt > 0 ? (tt <= lt ? 30 : Math.max(0, 30 - ((tt - lt) / lt) * 30)) : 15;
  const ct = {}; tw.forEach(e => { ct[e.categoryId] = (ct[e.categoryId] || 0) + e.amount; });
  const cv = Object.values(ct); const mcp = tt > 0 && cv.length > 0 ? Math.max(...cv) / tt : 0;
  const cs = cv.length === 0 ? 15 : (mcp > 0.5 ? Math.max(0, 30 - (mcp - 0.5) * 60) : 30);
  const total = Math.round(ts + trs + cs);
  const grade = total >= 85 ? "A" : total >= 70 ? "B" : total >= 50 ? "C" : total >= 30 ? "D" : "F";
  const gc = { A: "#6BAA75", B: "#7B8CDE", C: "#c9a253", D: "#E07A5F", F: "#D4726A" }[grade];
  const gm = { A: "Outstanding week!", B: "Good job — room to improve.", C: "Decent, watch spending.", D: "Spending is heavy…", F: "Rough week. Fresh start!" }[grade];
  const pc = lt > 0 ? ((tt - lt) / lt * 100).toFixed(0) : null;
  return (
    <div style={{ ...cleanCard, padding: 20, marginBottom: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#6BAA75" }}/>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "#6BAA75", marginBottom: 16, letterSpacing: "0.5px", fontWeight: 700 }}>Weekly Report Card</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: gc + "18", border: `3px solid ${gc}`, flexShrink: 0 }}><span style={{ fontSize: 32, fontWeight: 700, fontFamily: "var(--font-heading)", color: gc }}>{grade}</span></div>
        <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)", marginBottom: 4 }}>{gm}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>Spent <strong style={{ color: "#E07A5F" }}>{fmt(tt)}</strong> this week{pc !== null && <span style={{ color: Number(pc) <= 0 ? "#6BAA75" : "#E07A5F" }}> ({Number(pc) > 0 ? "+" : ""}{pc}%)</span>}</div></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {[{ label: "Target", score: Math.round(ts), max: 40 },{ label: "Trend", score: Math.round(trs), max: 30 },{ label: "Balance", score: Math.round(cs), max: 30 }].map(s => (
          <div key={s.label} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 4 }}>{s.label}</div><div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}><div style={{ height: "100%", width: `${(s.score / s.max) * 100}%`, background: gc, borderRadius: 3, transition: "width 0.4s" }}/></div><div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", marginTop: 3 }}>{s.score}/{s.max}</div></div>
        ))}
      </div>
    </div>
  );
}

/* ─── SETTLE MODAL ─── */
function SettleModal({ split, onConfirm, onClose }) {
  const [walletId, setWalletId] = useState("bank");
  const isOwed = split.direction === "owed"; // they owe me → money comes IN
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--card)", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxWidth: 430, boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          {isOwed ? `${split.name} pays you back` : `Pay ${split.name}`}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: isOwed ? "#6BAA75" : "#E07A5F", marginBottom: 16 }}>
          {isOwed ? "+" : "−"}{fmt(split.amount)}
        </div>
        <label style={labelStyle}>{isOwed ? "Receive into" : "Pay from"}</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {WALLETS.filter(w => w.id !== "upi_lite").map(w => (
            <button key={w.id} onClick={() => setWalletId(w.id)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              border: `2px solid ${walletId === w.id ? w.color : "var(--border)"}`,
              background: walletId === w.id ? w.color + "15" : "var(--card)", cursor: "pointer",
            }}>
              <DualIcon id={w.id} accent={w.neon || w.color} size={16}/>
              <span style={{ fontSize: 10, fontFamily: "var(--font-heading)", fontWeight: walletId === w.id ? 700 : 500, color: walletId === w.id ? w.color : "var(--muted)" }}>{w.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, border: "1.5px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onConfirm(walletId); onClose(); }} style={{ flex: 2, padding: 14, border: "none", borderRadius: 12, background: isOwed ? "#6BAA75" : "#E07A5F", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>
            {isOwed ? "Received ✓" : "Paid ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SPLIT EXPENSES ─── */
function SplitExpenses({ splits, onAdd, onSettle, onDelete, expanded, onToggle }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState("owe");
  const [settleTarget, setSettleTarget] = useState(null);

  const add = () => { if (!name.trim() || !amount || Number(amount) <= 0) return; onAdd({ id: uid(), name: name.trim(), amount: Number(amount), direction: dir, settled: false }); setName(""); setAmount(""); };
  const totalOwed = splits.filter(s => s.direction === "owe" && !s.settled).reduce((t, s) => t + s.amount, 0);
  const totalOwing = splits.filter(s => s.direction === "owed" && !s.settled).reduce((t, s) => t + s.amount, 0);

  if (!expanded) {
    return (
      <div onClick={onToggle} style={{ ...cleanCard, borderRadius: 16, padding: "16px 18px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#D4726A" }}/>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "#D4726A", letterSpacing: "0.5px", fontWeight: 700 }}>Split Expenses</div>
          <div style={{ fontSize: 13, fontFamily: "var(--font-body)", color: "var(--text-secondary)", marginTop: 4 }}>{splits.filter(s => !s.settled).length === 0 ? "No pending splits" : (<><span style={{ color: "#E07A5F" }}>You owe {fmt(totalOwed)}</span> · <span style={{ color: "#6BAA75" }}>Owed {fmt(totalOwing)}</span></>)}</div>
        </div>
        <span style={{ fontSize: 18, color: "var(--muted)" }}>→</span>
      </div>
    );
  }

  return (
    <div style={{ ...cleanCard, borderRadius: 16, padding: 18, marginBottom: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#D4726A" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "#D4726A", letterSpacing: "0.5px", fontWeight: 700 }}>Split Expenses</div>
        <button onClick={onToggle} style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>← Back</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#E07A5F12", borderRadius: 10 }}><div style={{ fontSize: 10, color: "#E07A5F", fontFamily: "var(--font-heading)", fontWeight: 600 }}>YOU OWE</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#E07A5F", marginTop: 4 }}>{fmt(totalOwed)}</div></div>
        <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#6BAA7512", borderRadius: 10 }}><div style={{ fontSize: 10, color: "#6BAA75", fontFamily: "var(--font-heading)", fontWeight: 600 }}>OWED TO YOU</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#6BAA75", marginTop: 4 }}>{fmt(totalOwing)}</div></div>
      </div>
      {splits.filter(s => !s.settled).map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 10, marginBottom: 6, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 16 }}>{s.direction === "owe" ? "🔴" : "🟢"}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>{s.direction === "owe" ? "You owe" : "Owes you"}</div></div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: s.direction === "owe" ? "#E07A5F" : "#6BAA75" }}>{fmt(s.amount)}</span>
          <button onClick={() => setSettleTarget(s)} style={{ border: "1px solid var(--border)", background: "none", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>Settle</button>
          <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
        </div>
      ))}
      {splits.filter(s => s.settled).length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500, marginBottom: 6 }}>Settled ({splits.filter(s => s.settled).length})</summary>
          {splits.filter(s => s.settled).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg)", borderRadius: 10, marginBottom: 4, opacity: 0.5 }}>
              <span style={{ fontSize: 13 }}>✅</span><span style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--text-secondary)" }}>{s.name}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--muted)" }}>{fmt(s.amount)}</span>
              <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, opacity: 0.4 }}>✕</button>
            </div>
          ))}
        </details>
      )}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["owe", "owed"].map(d => (<button key={d} onClick={() => setDir(d)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${dir === d ? (d === "owe" ? "#E07A5F" : "#6BAA75") : "var(--border)"}`, background: dir === d ? (d === "owe" ? "#E07A5F18" : "#6BAA7518") : "var(--card)", color: dir === d ? (d === "owe" ? "#E07A5F" : "#6BAA75") : "var(--muted)", cursor: "pointer", fontWeight: 500 }}>{d === "owe" ? "I owe them" : "They owe me"}</button>))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Friend name" style={{ ...inputStyle, flex: 1 }}/>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹" style={{ ...inputStyle, width: 80 }}/>
          <button onClick={add} style={{ padding: "10px 14px", border: "none", borderRadius: 10, background: "#E07A5F", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+</button>
        </div>
      </div>
      {settleTarget && <SettleModal split={settleTarget} onConfirm={(walletId) => onSettle(settleTarget.id, walletId)} onClose={() => setSettleTarget(null)}/>}
    </div>
  );
}

/* ─── SWIPEABLE ADD ─── */
function SwipeableAdd({ categories, incomeSources, onAddExpense, onAddIncome, onAddTransfer }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("0");
  const [catId, setCatId] = useState(categories[0]?.id || "");
  const [srcId, setSrcId] = useState(incomeSources[0]?.id || "");
  const [walletId, setWalletId] = useState("upi_lite");
  const [incWalletId, setIncWalletId] = useState("bank");
  const [transferFrom, setTransferFrom] = useState("bank");
  const [transferTo, setTransferTo] = useState("upi_lite");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const touchStart = useRef(null);
  const handleTS = e => { touchStart.current = e.touches[0].clientX; };
  const handleTE = e => { if (!touchStart.current) return; const d = e.changedTouches[0].clientX - touchStart.current; if (d < -60) setType(type === "expense" ? "income" : type === "income" ? "transfer" : "expense"); if (d > 60) setType(type === "transfer" ? "income" : type === "income" ? "expense" : "transfer"); touchStart.current = null; };

  const submit = () => {
    const a = parseFloat(amount); if (!a || a <= 0) return;
    if (type === "expense") onAddExpense({ amount: a, categoryId: catId, date, note, walletId });
    else if (type === "income") onAddIncome({ amount: a, sourceId: srcId, date, note, walletId: incWalletId });
    else if (type === "transfer") { if (transferFrom === transferTo) return; onAddTransfer({ amount: a, fromWallet: transferFrom, toWallet: transferTo, date, note }); }
    setAmount("0"); setNote("");
  };

  const typeColor = type === "expense" ? "#E07A5F" : type === "income" ? "#6BAA75" : "#7B8CDE";

  return (
    <div onTouchStart={handleTS} onTouchEnd={handleTE} style={{ padding: "0 0 20px" }}>
      <div style={{ display: "flex", background: "var(--card)", borderRadius: 12, padding: 4, border: "1px solid var(--border)", marginBottom: 20 }}>
        {[{ id: "expense", label: "Expense" },{ id: "income", label: "Income" },{ id: "transfer", label: "🔄 Transfer" }].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, background: type === t.id ? (t.id === "expense" ? "#E07A5F" : t.id === "income" ? "#6BAA75" : "#7B8CDE") : "transparent", color: type === t.id ? "#fff" : "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.3px", transition: "all 0.15s" }}>{t.label}</button>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: -14, marginBottom: 14, fontFamily: "var(--font-body)", fontStyle: "italic" }}>Swipe left / right to switch</p>
      <div style={{ marginBottom: 16 }}><label style={labelStyle}>Amount ({CURRENCY})</label><input type="number" value={amount === "0" ? "" : amount} onChange={e => setAmount(e.target.value || "0")} placeholder="0" autoFocus style={{ ...inputStyle, fontSize: 32, fontWeight: 600, fontFamily: "var(--font-heading)", textAlign: "center", padding: "18px 14px", color: typeColor, borderColor: typeColor }}/></div>

      {type === "expense" && (<>
        <label style={labelStyle}>Pay From</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {WALLETS.map(w => (<button key={w.id} onClick={() => setWalletId(w.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `2px solid ${walletId === w.id ? w.color : "var(--border)"}`, background: walletId === w.id ? w.color + "15" : "var(--card)", cursor: "pointer" }}><DualIcon id={w.id} accent={w.neon || w.color} size={14}/><span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: walletId === w.id ? 700 : 500, color: walletId === w.id ? w.color : "var(--muted)" }}>{w.name}</span></button>))}
        </div>
        <label style={labelStyle}>Category</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {categories.map(c => (<button key={c.id} onClick={() => setCatId(c.id)} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-body)", border: `1.5px solid ${catId === c.id ? c.color : "var(--border)"}`, background: catId === c.id ? c.color + "18" : "var(--card)", color: catId === c.id ? c.color : "var(--text-secondary)", cursor: "pointer", fontWeight: catId === c.id ? 600 : 400 }}><DualIcon id={c.id} accent={c.neon || c.color} size={14}/> {c.name}</button>))}
        </div>
      </>)}

      {type === "income" && (<>
        <label style={labelStyle}>Receive Into</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {INCOME_WALLETS.map(w => (<button key={w.id} onClick={() => setIncWalletId(w.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `2px solid ${incWalletId === w.id ? w.color : "var(--border)"}`, background: incWalletId === w.id ? w.color + "15" : "var(--card)", cursor: "pointer" }}><DualIcon id={w.id} accent={w.neon || w.color} size={14}/><span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: incWalletId === w.id ? 700 : 500, color: incWalletId === w.id ? w.color : "var(--muted)" }}>{w.name}</span></button>))}
        </div>
        <label style={labelStyle}>Source</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {incomeSources.map(c => (<button key={c.id} onClick={() => setSrcId(c.id)} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-body)", border: `1.5px solid ${srcId === c.id ? c.color : "var(--border)"}`, background: srcId === c.id ? c.color + "18" : "var(--card)", color: srcId === c.id ? c.color : "var(--text-secondary)", cursor: "pointer", fontWeight: srcId === c.id ? 600 : 400 }}><DualIcon id={c.id} accent={c.neon || c.color} size={14}/> {c.name}</button>))}
        </div>
      </>)}

      {type === "transfer" && (<>
        <label style={labelStyle}>From</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {WALLETS.map(w => (<button key={w.id} onClick={() => setTransferFrom(w.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `2px solid ${transferFrom === w.id ? w.color : "var(--border)"}`, background: transferFrom === w.id ? w.color + "15" : "var(--card)", cursor: "pointer" }}><DualIcon id={w.id} accent={w.neon || w.color} size={14}/><span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: transferFrom === w.id ? 700 : 500, color: transferFrom === w.id ? w.color : "var(--muted)" }}>{w.name}</span></button>))}
        </div>
        <div style={{ textAlign: "center", fontSize: 18, color: "var(--muted)", marginBottom: 12 }}>↓</div>
        <label style={labelStyle}>To</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {WALLETS.map(w => (<button key={w.id} onClick={() => setTransferTo(w.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `2px solid ${transferTo === w.id ? w.color : "var(--border)"}`, background: transferTo === w.id ? w.color + "15" : "var(--card)", cursor: "pointer", opacity: transferFrom === w.id ? 0.4 : 1 }}><DualIcon id={w.id} accent={w.neon || w.color} size={14}/><span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: transferTo === w.id ? 700 : 500, color: transferTo === w.id ? w.color : "var(--muted)" }}>{w.name}</span></button>))}
        </div>
        {transferFrom === transferTo && <p style={{ fontSize: 12, color: "#D4726A", fontFamily: "var(--font-body)", textAlign: "center", marginBottom: 12 }}>From and To must be different.</p>}
      </>)}

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}/></div>
        <div style={{ flex: 1 }}><label style={labelStyle}>Note</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional…" style={inputStyle}/></div>
      </div>
      <button onClick={submit} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 12, background: typeColor, color: "#fff", fontSize: 15, fontFamily: "var(--font-heading)", fontWeight: 600, cursor: "pointer", letterSpacing: "0.3px" }}>
        {type === "expense" ? "Add Expense" : type === "income" ? "Add Income" : "Transfer"}
      </button>
    </div>
  );
}

/* ─── TRANSACTION CARD ─── */
function TransactionCard({ item, categories, incomeSources, events, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(null);
  const isExp = item.type === "expense";
  const isInc = item.type === "income";
  const isTr = item.type === "transfer";
  const isSettle = item.type === "settlement";
  const cat = isExp ? categories.find(c => c.id === item.categoryId) : isInc ? incomeSources.find(s => s.id === item.sourceId) : null;
  const wallet = WALLETS.find(w => w.id === item.walletId);
  const fromW = WALLETS.find(w => w.id === item.fromWallet);
  const toW = WALLETS.find(w => w.id === item.toWallet);
  const ev = item.eventId ? events?.find(e => e.id === item.eventId) : null;
  const evTag = ev ? `● ${ev.name}` : null;

  if (isTr) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7B8CDE14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔄</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>Transfer</div><div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{fromW?.name} → {toW?.name} · {dayLabel(item.date)}</div></div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "#7B8CDE" }}>{fmt(item.amount)}</div>
        <button onClick={() => onDelete(item.id, item.type)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "4px 6px", opacity: 0.35 }}>✕</button>
      </div>
    );
  }

  if (isSettle) {
    const settleW = WALLETS.find(w => w.id === item.walletId);
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: item.direction === "owed" ? "#6BAA7514" : "#E07A5F14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.direction === "owed" ? "💰" : "💸"}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{item.direction === "owed" ? `${item.splitName} paid back` : `Paid ${item.splitName}`}</div><div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{settleW?.name} · {dayLabel(item.date)}</div></div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: item.direction === "owed" ? "#6BAA75" : "#E07A5F" }}>{item.direction === "owed" ? "+" : "−"}{fmt(item.amount)}</div>
        <button onClick={() => onDelete(item.id, item.type)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "4px 6px", opacity: 0.35 }}>✕</button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 10 }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: "#D4726A", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, fontFamily: "var(--font-heading)", color: "#fff", fontSize: 12, fontWeight: 600 }}>Delete</div>
      <div onTouchStart={e => { startX.current = e.touches[0].clientX; }} onTouchMove={e => { if (!startX.current) return; const d = e.touches[0].clientX - startX.current; if (d < 0) setOffsetX(Math.max(d, -100)); }} onTouchEnd={() => { if (offsetX < -60) onDelete(item.id, item.type); else setOffsetX(0); startX.current = null; }}
        style={{ position: "relative", transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? "transform 0.2s" : "none", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: (cat?.color || "#999") + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cat ? <DualIcon id={cat.id} accent={cat.neon || cat.color} size={22}/> : <span style={{ fontSize: 22 }}>❓</span>}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{cat?.name || "Unknown"}</span>
            {wallet && <span style={{ fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 600, color: wallet.color, background: wallet.color + "18", padding: "2px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 2 }}><DualIcon id={wallet.id} accent={wallet.neon || wallet.color} size={10}/></span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{evTag && <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{evTag} · </span>}{item.note ? item.note + " · " : ""}{dayLabel(item.date)}</div>
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: isExp ? "#E07A5F" : "#6BAA75" }}>{isExp ? "−" : "+"}{fmt(item.amount)}</div>
        <button onClick={() => onDelete(item.id, item.type)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "4px 6px", opacity: 0.35 }}>✕</button>
      </div>
    </div>
  );
}

/* ─── CALIBRATE MODAL ─── */
function CalibrateModal({ wallet, currentBal, onSave, onClose }) {
  const [val, setVal] = useState(currentBal.toString());
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--card)", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxWidth: 430, boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><DualIcon id={wallet.id} accent={wallet.neon || wallet.color} size={20}/> Calibrate {wallet.name}</div>
        <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-body)", marginBottom: 20, lineHeight: 1.5 }}>Enter your actual current balance. NOMAD will adjust accordingly.</p>
        <label style={labelStyle}>Current Real Balance ({CURRENCY})</label>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} autoFocus style={{ ...inputStyle, fontSize: 28, fontWeight: 700, fontFamily: "var(--font-heading)", textAlign: "center", padding: "16px", color: wallet.color, borderColor: wallet.color, marginBottom: 16 }}/>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, border: "1.5px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onSave(Number(val) || 0); onClose(); }} style={{ flex: 2, padding: 14, border: "none", borderRadius: 12, background: wallet.color, color: "#fff", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>Set Balance</button>
        </div>
      </div>
    </div>
  );
}

/* ─── EVENT BILL SPLITTER ─── */
function EventBillSplitter({ eventId, categories, onAddExpense, onAddSplit }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("equal");
  const [total, setTotal] = useState("");
  const [catId, setCatId] = useState(categories[0]?.id || "");
  const [walletId, setWalletId] = useState("upi_lite");
  const [note, setNote] = useState("");
  const [people, setPeople] = useState([{ name: "", amount: "" }]);
  const [step, setStep] = useState(1);

  const addPerson = () => setPeople(p => [...p, { name: "", amount: "" }]);
  const updatePerson = (i, f, v) => setPeople(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const removePerson = (i) => setPeople(p => p.filter((_, idx) => idx !== i));

  const totalNum = parseFloat(total) || 0;
  const validPeople = people.filter(p => p.name.trim());
  const headcount = validPeople.length + 1; // others + me

  // Equal: everyone pays same
  const equalPerPerson = headcount > 0 ? Math.floor(totalNum / headcount) : 0;
  const equalMyShare = totalNum - (equalPerPerson * validPeople.length);

  // Custom: others enter amounts, my share = remainder
  const customOthersTotal = people.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const customMyShare = Math.max(0, totalNum - customOthersTotal);

  const myShare = mode === "equal" ? equalMyShare : customMyShare;
  const canSubmit = totalNum > 0 && validPeople.length > 0 && (mode === "equal" || (customOthersTotal > 0 && customOthersTotal <= totalNum));

  const reset = () => { setTotal(""); setPeople([{ name: "", amount: "" }]); setNote(""); setStep(1); setOpen(false); };

  const submit = () => {
    if (!canSubmit) return;
    const groupId = uid();
    // 1. Create expense for user's share only
    if (myShare > 0) {
      onAddExpense({ amount: myShare, categoryId: catId, walletId, note: note || "Bill split — my share", date: new Date().toISOString().slice(0, 10), eventId, groupId });
    }
    // 2. Create split entries for others (they owe me)
    validPeople.forEach(p => {
      const amt = mode === "equal" ? equalPerPerson : (parseFloat(p.amount) || 0);
      if (amt > 0) {
        onAddSplit({ id: uid(), name: p.name.trim(), amount: amt, direction: "owed", settled: false, eventId, groupId });
      }
    });
    setStep(3);
    setTimeout(reset, 2000);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ width: "100%", padding: 14, border: "1.5px solid #7B8CDE", borderRadius: 14, background: "#7B8CDE12", color: "#7B8CDE", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14 }}>🧾 Bill Splitter</button>
    );
  }

  if (step === 3) {
    return (
      <div style={{ background: "var(--card)", borderRadius: 14, padding: 24, border: "1px solid #6BAA7540", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "#6BAA75", fontWeight: 600 }}>Split recorded!</div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 4 }}>Your share ({fmt(myShare)}) logged as expense.</div>
      </div>
    );
  }

  if (step === 2) {
    const cat = categories.find(c => c.id === catId) || categories[0];
    return (
      <div style={{ background: "var(--card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 14, letterSpacing: "0.5px" }}>🧾 CONFIRM SPLIT</div>
        <div style={{ background: "#E07A5F12", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #E07A5F30" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 6 }}>YOUR EXPENSE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex" }}><DualIcon id={cat?.id} accent={cat?.neon || cat?.color} size={20}/></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text)" }}>Your share</div><div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>{cat?.name}</div></div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#E07A5F" }}>−{fmt(myShare)}</div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 8 }}>THEY OWE YOU</div>
          {validPeople.map((p, i) => {
            const amt = mode === "equal" ? equalPerPerson : (parseFloat(p.amount) || 0);
            return (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 13, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{p.name}</span><span style={{ fontSize: 13, fontFamily: "var(--font-heading)", fontWeight: 600, color: "#6BAA75" }}>{fmt(amt)}</span></div>);
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, border: "1.5px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>← Edit</button>
          <button onClick={submit} style={{ flex: 2, padding: 12, border: "none", borderRadius: 10, background: "#6BAA75", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm ✓</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.5px" }}>🧾 BILL SPLITTER</div>
        <button onClick={reset} style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>✕ Close</button>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ id: "equal", label: "Equal Split" }, { id: "custom", label: "Custom Split" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${mode === m.id ? "#7B8CDE" : "var(--border)"}`, background: mode === m.id ? "#7B8CDE18" : "var(--card)", color: mode === m.id ? "#7B8CDE" : "var(--muted)", cursor: "pointer", fontWeight: 600 }}>{m.label}</button>
        ))}
      </div>

      <label style={labelStyle}>Total Bill (₹)</label>
      <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0" style={{ ...inputStyle, marginBottom: 14, fontSize: 20, fontWeight: 700, fontFamily: "var(--font-heading)", textAlign: "center" }}/>

      <label style={labelStyle}>People (excluding you)</label>
      {people.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <input value={p.name} onChange={e => updatePerson(i, "name", e.target.value)} placeholder="Name" style={{ ...inputStyle, flex: 1 }}/>
          {mode === "custom" && <input type="number" value={p.amount} onChange={e => updatePerson(i, "amount", e.target.value)} placeholder="₹" style={{ ...inputStyle, width: 78 }}/>}
          {people.length > 1 && <button onClick={() => removePerson(i)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, opacity: 0.4 }}>✕</button>}
        </div>
      ))}
      <button onClick={addPerson} style={{ background: "none", border: "1px dashed var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)", marginBottom: 14, width: "100%" }}>+ Add person</button>

      {/* Summary */}
      {totalNum > 0 && validPeople.length > 0 && (
        <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: "1px solid var(--border)" }}>
          {mode === "equal" ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--text-secondary)" }}>
              <span>Per person ({headcount})</span><span style={{ fontWeight: 600 }}>{fmt(equalPerPerson)}</span>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-heading)", color: customOthersTotal > totalNum ? "#D4726A" : "var(--text-secondary)" }}>
              <span>Others total</span><span style={{ fontWeight: 600 }}>{fmt(customOthersTotal)} / {fmt(totalNum)}{customOthersTotal > totalNum ? " (over!)" : ""}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "var(--font-heading)", color: "#E07A5F", fontWeight: 700, marginTop: 6 }}>
            <span>Your share</span><span>{fmt(myShare)}</span>
          </div>
        </div>
      )}

      <label style={labelStyle}>Category</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {categories.map(c => (<button key={c.id} onClick={() => setCatId(c.id)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)", border: `1.5px solid ${catId === c.id ? c.color : "var(--border)"}`, background: catId === c.id ? c.color + "18" : "var(--card)", color: catId === c.id ? c.color : "var(--text-secondary)", cursor: "pointer", fontWeight: catId === c.id ? 600 : 400 }}><DualIcon id={c.id} accent={c.neon || c.color} size={14}/> {c.name}</button>))}
      </div>

      <label style={labelStyle}>Paid From</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {WALLETS.map(w => (<button key={w.id} onClick={() => setWalletId(w.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${walletId === w.id ? w.color : "var(--border)"}`, background: walletId === w.id ? w.color + "15" : "var(--card)", fontSize: 12, fontWeight: walletId === w.id ? 600 : 500, fontFamily: "var(--font-heading)", color: walletId === w.id ? w.color : "var(--muted)", cursor: "pointer" }}><DualIcon id={w.id} accent={w.neon || w.color} size={12}/> {w.name}</button>))}
      </div>

      <button onClick={() => { if (canSubmit) setStep(2); }} disabled={!canSubmit} style={{ width: "100%", padding: 13, border: "none", borderRadius: 10, background: canSubmit ? "#6BAA75" : "var(--border)", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", opacity: canSubmit ? 1 : 0.5 }}>Review Split →</button>
    </div>
  );
}

/* ─── EVENTS TAB ─── */
function EventsTab({ events, expenses, splits, settlements, categories, onCreateEvent, onAddExpense, onAddSplit, onSettleSplit, onDeleteSplit, onMarkDone }) {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("film");
  const [expAmt, setExpAmt] = useState("");
  const [expCat, setExpCat] = useState(categories[0]?.id || "");
  const [expWallet, setExpWallet] = useState("upi_lite");
  const [expNote, setExpNote] = useState("");
  const [splitName, setSplitName] = useState("");
  const [splitAmt, setSplitAmt] = useState("");
  const [splitDir, setSplitDir] = useState("owed");
  const [settleTarget, setSettleTarget] = useState(null);

  const EVENT_ICONS = [
    { id: "film", label: "Movie", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg> },
    { id: "plane", label: "Travel", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg> },
    { id: "cake", label: "Birthday", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg> },
    { id: "sun", label: "Outing", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
    { id: "utensils", label: "Dinner", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> },
    { id: "party", label: "Party", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3L2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="M22 13l-1.34-.45a2.9 2.9 0 0 0-3.12 1.96v0a1.53 1.53 0 0 1-1.63 1.45h0a1.78 1.78 0 0 0-1.44 1.76L14 22"/></svg> },
    { id: "tent", label: "Camping", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 21L14 3"/><path d="M20.5 21L10 3"/><path d="M2 21h20"/><path d="M7 21l5-7 5 7"/></svg> },
    { id: "cart", label: "Shopping", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
    { id: "gamepad", label: "Gaming", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg> },
    { id: "ball", label: "Sports", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> },
    { id: "grad", label: "Study", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg> },
    { id: "coffee", label: "Cafe", svg: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg> },
  ];
  const getIconById = (id) => EVENT_ICONS.find(i => i.id === id);
  const selected = events.find(e => e.id === selectedId);

  const create = () => {
    if (!newName.trim()) return;
    onCreateEvent({ id: uid(), name: newName.trim(), emoji: newEmoji, date: new Date().toISOString().slice(0, 10), status: "active" });
    setNewName(""); setNewEmoji("film"); setView("list");
  };

  const addExp = () => {
    const a = parseFloat(expAmt); if (!a || a <= 0 || !selected) return;
    onAddExpense({ amount: a, categoryId: expCat, walletId: expWallet, note: expNote, date: new Date().toISOString().slice(0, 10), eventId: selected.id });
    setExpAmt(""); setExpNote("");
  };

  const addSplit = () => {
    if (!splitName.trim() || !splitAmt || Number(splitAmt) <= 0 || !selected) return;
    onAddSplit({ id: uid(), name: splitName.trim(), amount: Number(splitAmt), direction: splitDir, settled: false, eventId: selected.id });
    setSplitName(""); setSplitAmt("");
  };

  // CREATE VIEW
  if (view === "create") {
    return (
      <div style={{ paddingTop: 8 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-heading)", marginBottom: 16 }}>← Back</button>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>New Event</div>
        <label style={labelStyle}>Icon</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {EVENT_ICONS.map(ic => (<button key={ic.id} onClick={() => setNewEmoji(ic.id)} style={{ width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${newEmoji === ic.id ? "#E07A5F" : "var(--border)"}`, background: newEmoji === ic.id ? "#E07A5F18" : "var(--card)", cursor: "pointer", color: newEmoji === ic.id ? "#E07A5F" : "var(--muted)" }}>{ic.svg}</button>))}
        </div>
        <label style={labelStyle}>Event Name</label>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Movie Night, Goa Trip…" style={{ ...inputStyle, marginBottom: 20 }}/>
        <button onClick={create} style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "#E07A5F", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Create Event</button>
      </div>
    );
  }

  // DETAIL VIEW
  if (view === "detail" && selected) {
    const evExps = expenses.filter(e => e.eventId === selected.id);
    const evSplits = splits.filter(s => s.eventId === selected.id);
    const evSettles = settlements.filter(s => s.eventId === selected.id);
    const netSpent = evExps.reduce((s, e) => s + e.amount, 0)
      - evSettles.filter(s => s.direction === "owed").reduce((s, e) => s + e.amount, 0)
      + evSettles.filter(s => s.direction === "owe").reduce((s, e) => s + e.amount, 0);
    const totalOwed = evSplits.filter(s => s.direction === "owe" && !s.settled).reduce((t, s) => t + s.amount, 0);
    const totalOwing = evSplits.filter(s => s.direction === "owed" && !s.settled).reduce((t, s) => t + s.amount, 0);

    return (
      <div style={{ paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-heading)" }}>← Events</button>
          {selected.status === "active" && <button onClick={() => { onMarkDone(selected.id); }} style={{ padding: "6px 14px", border: "1.5px solid #6BAA75", borderRadius: 8, background: "#6BAA7518", color: "#6BAA75", fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark Done ✓</button>}
        </div>

        {/* Header */}
        <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E07A5F12", display: "flex", alignItems: "center", justifyContent: "center", color: "#E07A5F", flexShrink: 0 }}>{(() => { const ic = EVENT_ICONS.find(i => i.id === selected.emoji); return ic ? ic.svg : <span style={{ fontSize: 28 }}>{selected.emoji}</span>; })()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{selected.date} · {selected.status === "active" ? "🟡 Active" : "✅ Done"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>NET SPENT</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#E07A5F" }}>{fmt(netSpent)}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 500, marginTop: 3 }}>Total Paid: {fmt(evExps.reduce((s, e) => s + e.amount, 0))}</div>
          </div>
        </div>

        {/* Splits summary */}
        {evSplits.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, background: "#E07A5F12", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}><div style={{ fontSize: 9, color: "#E07A5F", fontFamily: "var(--font-heading)", fontWeight: 600 }}>YOU OWE</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#E07A5F" }}>{fmt(totalOwed)}</div></div>
            <div style={{ flex: 1, background: "#6BAA7512", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}><div style={{ fontSize: 9, color: "#6BAA75", fontFamily: "var(--font-heading)", fontWeight: 600 }}>OWED TO YOU</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#6BAA75" }}>{fmt(totalOwing)}</div></div>
          </div>
        )}

        {/* Event expenses */}
        {evExps.length > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 10, letterSpacing: "0.5px" }}>EXPENSES</div>
            {[...evExps].reverse().map(e => {
              const cat = categories.find(c => c.id === e.categoryId) || { emoji: "❓", name: "Unknown", color: "#999" };
              const w = WALLETS.find(x => x.id === e.walletId);
              return (<div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}><DualIcon id={cat.id} accent={cat.neon || cat.color} size={18}/><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{cat.name} {w && <span style={{ fontSize: 9, color: w.color, background: w.color + "18", padding: "2px 5px", borderRadius: 4, marginLeft: 4, display: "inline-flex", alignItems: "center" }}><DualIcon id={w.id} accent={w.neon || w.color} size={9}/></span>}</div>{e.note && <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 1 }}>{e.note}</div>}</div><span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#E07A5F", fontSize: 14 }}>−{fmt(e.amount)}</span></div>);
            })}
          </div>
        )}

        {/* Event splits */}
        {evSplits.length > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 10, letterSpacing: "0.5px" }}>SPLITS</div>
            {evSplits.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", opacity: s.settled ? 0.4 : 1 }}>
                <span style={{ fontSize: 14 }}>{s.settled ? "✅" : s.direction === "owe" ? "🔴" : "🟢"}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>{s.settled ? "Settled" : s.direction === "owe" ? "You owe" : "Owes you"}</div></div>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: s.direction === "owe" ? "#E07A5F" : "#6BAA75" }}>{fmt(s.amount)}</span>
                {!s.settled && <button onClick={() => setSettleTarget(s)} style={{ border: "1px solid var(--border)", background: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>Settle</button>}
                <button onClick={() => onDeleteSplit(s.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, opacity: 0.4 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add expense (only if active) */}
        {selected.status === "active" && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 12, letterSpacing: "0.5px" }}>ADD EXPENSE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {categories.map(c => (<button key={c.id} onClick={() => setExpCat(c.id)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)", border: `1.5px solid ${expCat === c.id ? c.color : "var(--border)"}`, background: expCat === c.id ? c.color + "18" : "var(--card)", color: expCat === c.id ? c.color : "var(--text-secondary)", cursor: "pointer", fontWeight: expCat === c.id ? 600 : 400 }}><DualIcon id={c.id} accent={c.neon || c.color} size={14}/> {c.name}</button>))}
            </div>
            <label style={labelStyle}>Paid From</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {WALLETS.map(w => (<button key={w.id} onClick={() => setExpWallet(w.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${expWallet === w.id ? w.color : "var(--border)"}`, background: expWallet === w.id ? w.color + "15" : "var(--card)", fontSize: 12, fontWeight: expWallet === w.id ? 600 : 500, fontFamily: "var(--font-heading)", color: expWallet === w.id ? w.color : "var(--muted)", cursor: "pointer" }}><DualIcon id={w.id} accent={w.neon || w.color} size={12}/> {w.name}</button>))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="₹" style={{ ...inputStyle, width: 80 }}/>
              <input value={expNote} onChange={e => setExpNote(e.target.value)} placeholder="Note" style={{ ...inputStyle, flex: 1 }}/>
              <button onClick={addExp} style={{ padding: "10px 14px", border: "none", borderRadius: 10, background: "#E07A5F", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+</button>
            </div>
          </div>
        )}

        {/* Bill Splitter (only if active) */}
        {selected.status === "active" && <EventBillSplitter eventId={selected.id} categories={categories} onAddExpense={onAddExpense} onAddSplit={onAddSplit}/>}

        {/* Add split (only if active) */}
        {selected.status === "active" && (
          <div style={{ background: "var(--card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 12, letterSpacing: "0.5px" }}>ADD SPLIT</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["owed", "owe"].map(d => (<button key={d} onClick={() => setSplitDir(d)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${splitDir === d ? (d === "owe" ? "#E07A5F" : "#6BAA75") : "var(--border)"}`, background: splitDir === d ? (d === "owe" ? "#E07A5F18" : "#6BAA7518") : "var(--card)", color: splitDir === d ? (d === "owe" ? "#E07A5F" : "#6BAA75") : "var(--muted)", cursor: "pointer", fontWeight: 500 }}>{d === "owe" ? "I owe them" : "They owe me"}</button>))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={splitName} onChange={e => setSplitName(e.target.value)} placeholder="Friend name" style={{ ...inputStyle, flex: 1 }}/>
              <input type="number" value={splitAmt} onChange={e => setSplitAmt(e.target.value)} placeholder="₹" style={{ ...inputStyle, width: 80 }}/>
              <button onClick={addSplit} style={{ padding: "10px 14px", border: "none", borderRadius: 10, background: "#6BAA75", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+</button>
            </div>
          </div>
        )}

        {settleTarget && <SettleModal split={settleTarget} onConfirm={(walletId) => { onSettleSplit(settleTarget.id, walletId); setSettleTarget(null); }} onClose={() => setSettleTarget(null)}/>}
      </div>
    );
  }

  // LIST VIEW
  const active = events.filter(e => e.status === "active");
  const done = events.filter(e => e.status === "completed");

  return (
    <div style={{ paddingTop: 8 }}>
      <button onClick={() => setView("create")} style={{ width: "100%", padding: 14, border: "2px dashed var(--border)", borderRadius: 14, background: "transparent", color: "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>+ New Event</button>
      {active.length === 0 && done.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 2 }}>No events yet.<br/>Create one for your next outing!</div>}
      {active.map(ev => {
        const evE = expenses.filter(e => e.eventId === ev.id).reduce((s, e) => s + e.amount, 0);
        const evSOwed = settlements.filter(s => s.eventId === ev.id && s.direction === "owed").reduce((s, e) => s + e.amount, 0);
        const evSOwe = settlements.filter(s => s.eventId === ev.id && s.direction === "owe").reduce((s, e) => s + e.amount, 0);
        const netSpent = evE - evSOwed + evSOwe;
        const pendingSplits = splits.filter(s => s.eventId === ev.id && !s.settled).length;
        return (
          <div key={ev.id} onClick={() => { setSelectedId(ev.id); setView("detail"); }} style={{ background: "var(--card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#E07A5F12", display: "flex", alignItems: "center", justifyContent: "center", color: "#E07A5F", flexShrink: 0 }}>{(() => { const ic = EVENT_ICONS.find(i => i.id === ev.emoji); return ic ? ic.svg : <span style={{ fontSize: 24 }}>{ev.emoji}</span>; })()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{ev.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{ev.date} · 🟡 Active{pendingSplits > 0 && ` · ⚠️ ${pendingSplits} unsettled`}</div>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "#E07A5F" }}>{fmt(netSpent)}</div>
          </div>
        );
      })}
      {done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 10, letterSpacing: "0.5px" }}>PAST EVENTS</div>
          {done.map(ev => {
            const evE = expenses.filter(e => e.eventId === ev.id).reduce((s, e) => s + e.amount, 0);
            const evSOwed = settlements.filter(s => s.eventId === ev.id && s.direction === "owed").reduce((s, e) => s + e.amount, 0);
            const evSOwe = settlements.filter(s => s.eventId === ev.id && s.direction === "owe").reduce((s, e) => s + e.amount, 0);
            const netSpent = evE - evSOwed + evSOwe;
            return (
              <div key={ev.id} onClick={() => { setSelectedId(ev.id); setView("detail"); }} style={{ background: "var(--card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", marginBottom: 8, cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", flexShrink: 0 }}>{(() => { const ic = EVENT_ICONS.find(i => i.id === ev.emoji); return ic ? ic.svg : <span style={{ fontSize: 20 }}>{ev.emoji}</span>; })()}</div>
                <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{ev.name}</div><div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>{ev.date} · ✅ Done</div></div>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{fmt(netSpent)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavIcon({ type, active }) {
  const c = active ? "#E07A5F" : "var(--muted)";
  if (type === "dashboard") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="13" width="7" height="8" rx="1.5"/></svg>;
  if (type === "add") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (type === "history") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>;
  if (type === "events") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/></svg>;
  if (type === "settings") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  return null;
}

/* ═══════════════ MAIN APP ═══════════════ */
export default function Nomad() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [incomeSources, setIncomeSources] = useState(DEFAULT_INCOME_SOURCES);
  const [splits, setSplits] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [lionDancing, setLionDancing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newColor, setNewColor] = useState("#E07A5F");
  const [managerType, setManagerType] = useState("expense");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [splitExpanded, setSplitExpanded] = useState(false);
  const [calibrateWallet, setCalibrateWallet] = useState(null);
  const [walletStartBal, setWalletStartBal] = useState({ upi_lite: 0, bank: 0, cash: 0 });
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2000); };

  // LOAD
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nomad-v5");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.expenses) setExpenses(d.expenses);
        if (d.incomes) setIncomes(d.incomes);
        if (d.transfers) setTransfers(d.transfers);
        if (d.settlements) setSettlements(d.settlements);
        if (d.categories?.length) setCategories(d.categories);
        if (d.incomeSources?.length) setIncomeSources(d.incomeSources);
        if (d.splits) setSplits(d.splits);
        if (d.events) setEvents(d.events);
        if (d.darkMode !== undefined) setDarkMode(d.darkMode);
        if (d.walletStartBal) setWalletStartBal(d.walletStartBal);
      }
    } catch {}
    setLoaded(true);
  }, []);

  // SAVE
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("nomad-v5", JSON.stringify({ expenses, incomes, transfers, settlements, categories, incomeSources, splits, events, darkMode, walletStartBal })); } catch {}
  }, [expenses, incomes, transfers, settlements, categories, incomeSources, splits, events, darkMode, walletStartBal, loaded]);

  const allMonths = useMemo(() => { const s = new Set(); expenses.forEach(e => s.add(monthKey(e.date))); incomes.forEach(i => s.add(monthKey(i.date))); return [...s].sort(); }, [expenses, incomes]);
  const filtered = useMemo(() => { if (filterMonth === "all") return { expenses, incomes }; return { expenses: expenses.filter(e => monthKey(e.date) === filterMonth), incomes: incomes.filter(i => monthKey(i.date) === filterMonth) }; }, [expenses, incomes, filterMonth]);

  const totalIncome = filtered.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = filtered.expenses.reduce((s, e) => s + e.amount, 0);

  // ═══ CLEAN WALLET BALANCE ═══
  // Balance = Starting + Income − Expenses ± Transfers ± Settlements
  const walletBal = useMemo(() => {
    const bal = { upi_lite: walletStartBal.upi_lite || 0, bank: walletStartBal.bank || 0, cash: walletStartBal.cash || 0 };
    // Income adds to chosen wallet
    incomes.forEach(i => { const w = i.walletId || "bank"; if (bal[w] !== undefined) bal[w] += i.amount; });
    // Expenses subtract from chosen wallet
    expenses.forEach(e => { const w = e.walletId || "upi_lite"; if (bal[w] !== undefined) bal[w] -= e.amount; });
    // Transfers move between wallets (net zero)
    transfers.forEach(t => { if (bal[t.fromWallet] !== undefined) bal[t.fromWallet] -= t.amount; if (bal[t.toWallet] !== undefined) bal[t.toWallet] += t.amount; });
    // Settlements: "owed" (they pay me) = +wallet, "owe" (I pay them) = -wallet
    settlements.forEach(s => {
      if (bal[s.walletId] !== undefined) {
        if (s.direction === "owed") bal[s.walletId] += s.amount;
        else bal[s.walletId] -= s.amount;
      }
    });
    return bal;
  }, [expenses, incomes, transfers, settlements, walletStartBal]);

  // Main balance = sum of all wallets
  const mainBalance = Object.values(walletBal).reduce((s, v) => s + v, 0);

  const triggerDance = () => { setLionDancing(true); setTimeout(() => setLionDancing(false), 1800); };

  const addExpense = (data) => {
    const w = WALLETS.find(x => x.id === data.walletId);
    const bal = walletBal[data.walletId] || 0;
    if (bal < data.amount) { showToast(`Not enough balance in ${w?.name || "wallet"}`, "error"); return false; }
    setExpenses(p => [{ id: uid(), type: "expense", ...data }, ...p]); triggerDance(); showToast("Expense added", "success"); return true;
  };

  const addIncome = (data) => {
    if (data.walletId === "upi_lite") { showToast("UPI Lite is for spending only", "error"); return false; }
    setIncomes(p => [{ id: uid(), type: "income", ...data }, ...p]); triggerDance(); showToast("Income added", "success"); return true;
  };

  const addTransfer = (data) => {
    const w = WALLETS.find(x => x.id === data.fromWallet);
    const bal = walletBal[data.fromWallet] || 0;
    if (bal < data.amount) { showToast(`Insufficient balance in ${w?.name || "wallet"}`, "error"); return false; }
    setTransfers(p => [{ id: uid(), type: "transfer", ...data }, ...p]); triggerDance(); showToast("Transfer successful", "success"); return true;
  };

  const settleSplit = (splitId, walletId) => {
    const split = splits.find(s => s.id === splitId);
    if (!split) return;
    // "owe" = I pay them → subtract from wallet
    if (split.direction === "owe") {
      if (walletId === "upi_lite") { showToast("UPI Lite is for spending only", "error"); return; }
      const bal = walletBal[walletId] || 0;
      if (bal < split.amount) { showToast("Not enough balance to settle", "error"); return; }
    }
    // "owed" = they pay me → add to wallet (block UPI Lite)
    if (split.direction === "owed" && walletId === "upi_lite") { showToast("UPI Lite is for spending only", "error"); return; }
    // Create a settlement transaction (carry groupId + eventId if present)
    setSettlements(p => [...p, { id: uid(), type: "settlement", splitName: split.name, amount: split.amount, direction: split.direction, walletId, date: new Date().toISOString().slice(0, 10), ...(split.groupId && { groupId: split.groupId }), ...(split.eventId && { eventId: split.eventId }) }]);
    // Mark split as settled
    setSplits(p => p.map(s => s.id === splitId ? { ...s, settled: true } : s));
    showToast("Settlement completed", "success");
  };

  const deleteItem = (id, type) => {
    if (type === "expense") setExpenses(p => p.filter(e => e.id !== id));
    else if (type === "income") setIncomes(p => p.filter(i => i.id !== id));
    else if (type === "transfer") setTransfers(p => p.filter(t => t.id !== id));
    else if (type === "settlement") setSettlements(p => p.filter(s => s.id !== id));
  };

  const addCustomItem = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "_") + "_" + uid();
    const item = { id, name: newName.trim(), emoji: newEmoji, color: newColor };
    if (managerType === "expense") setCategories(p => [...p, item]);
    else setIncomeSources(p => [...p, item]);
    setNewName(""); setNewEmoji("📁"); setNewColor("#E07A5F");
  };

  const handleCalibrate = (wId, desired) => {
    const current = walletBal[wId]; const start = walletStartBal[wId] || 0;
    setWalletStartBal(prev => ({ ...prev, [wId]: start + (desired - current) }));
  };

  const exportCSV = () => {
    let csv = "Type,Date,Amount,Category/Source,Wallet,Note\n";
    incomes.forEach(i => { const w = WALLETS.find(x => x.id === i.walletId)?.name || "Bank"; csv += `Income,${i.date},${i.amount},"${incomeSources.find(s => s.id === i.sourceId)?.name || ""}","${w}","${i.note || ""}"\n`; });
    expenses.forEach(e => { const w = WALLETS.find(x => x.id === e.walletId)?.name || "UPI Lite"; csv += `Expense,${e.date},${e.amount},"${categories.find(c => c.id === e.categoryId)?.name || ""}","${w}","${e.note || ""}"\n`; });
    transfers.forEach(t => { csv += `Transfer,${t.date},${t.amount},"${t.fromWallet} → ${t.toWallet}","","${t.note || ""}"\n`; });
    settlements.forEach(s => { csv += `Settlement,${s.date},${s.amount},"${s.splitName}","${WALLETS.find(w => w.id === s.walletId)?.name || ""}","${s.direction}"\n`; });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `nomad_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F2F0EB", fontFamily: "Plus Jakarta Sans, sans-serif", color: "#8A8A9A" }}>Loading…</div>;

  const theme = darkMode ? { "--bg": "#000000", "--card": "#111111", "--border": "rgba(255,255,255,0.08)", "--text": "#FFFFFF", "--text-secondary": "#A0A0A0", "--muted": "#666666", "--nav-bg": "rgba(0,0,0,0.92)" } : { "--bg": "#F2F0EB", "--card": "#FFFFFF", "--border": "rgba(0,0,0,0.06)", "--text": "#1A1A2E", "--text-secondary": "#4A4A5A", "--muted": "#8A8A9A", "--nav-bg": "rgba(242,240,235,0.92)" };

  // Clean white cards with colored accents
  const cleanCard = {
    background: darkMode ? "#111111" : "#FFFFFF",
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
    borderRadius: 20,
    boxShadow: darkMode ? "0 2px 16px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.04)",
  };

  return (
    <div style={{ ...theme, fontFamily: "var(--font-body)", background: "var(--bg)", color: "var(--text)", minHeight: "100vh", maxWidth: 430, margin: "0 auto", padding: "0 16px 90px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
        :root { --font-heading: 'Plus Jakarta Sans', sans-serif; --font-body: 'Nunito', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${darkMode ? "#000000" : "#F2F0EB"}; }
        input[type=date] { color-scheme: ${darkMode ? "dark" : "light"}; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes toastOut { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, 10px); } }
        @keyframes lionDance { from { transform: translateY(-6px) rotate(-5deg); } to { transform: translateY(-4px) rotate(5deg); } }
        .page-enter { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "22px 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>🦁</span><span style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "1px" }}>{APP_NAME}</span></div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", background: "var(--card)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", fontWeight: 500 }}>v4.1</span>
      </div>

      {/* MONTH FILTER */}
      {(tab === "dashboard" || tab === "history") && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0 16px", scrollbarWidth: "none" }}>
          <button onClick={() => setFilterMonth("all")} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${filterMonth === "all" ? "#E07A5F" : "var(--border)"}`, background: filterMonth === "all" ? "#E07A5F" : "var(--card)", color: filterMonth === "all" ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>All</button>
          {allMonths.map(m => (<button key={m} onClick={() => setFilterMonth(m)} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${filterMonth === m ? "#6BAA75" : "var(--border)"}`, background: filterMonth === m ? "#6BAA75" : "var(--card)", color: filterMonth === m ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>{monthLabel(m)}</button>))}
        </div>
      )}

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="page-enter">
          {/* Main Balance = sum of all wallets */}
          <div style={{ ...cleanCard, padding: "28px 24px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 500 }}>Total Money</div>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-heading)", color: mainBalance >= 0 ? "#6BAA75" : "#E07A5F", marginTop: 8, lineHeight: 1.2 }}>{fmt(mainBalance)}</div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 22 }}>
              <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>INCOME</div><div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#6BAA75", marginTop: 4, fontWeight: 600 }}>{fmt(totalIncome)}</div></div>
              <div style={{ width: 1, background: "var(--border)" }}/>
              <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>NET SPENT</div><div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#E07A5F", marginTop: 4, fontWeight: 600 }}>{fmt(totalExpense)}</div></div>
            </div>
          </div>

          {/* Wallet Cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {WALLETS.map(w => {
              const bal = walletBal[w.id] || 0;
              return (
                <div key={w.id} onClick={() => setCalibrateWallet(w)} style={{ ...cleanCard, flex: 1, minWidth: 0, padding: "12px 10px", cursor: "pointer", borderLeft: `3px solid ${w.color}`, borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <DualIcon id={w.id} accent={w.neon || w.color} size={14}/>
                    <span style={{ fontSize: 8, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{w.name}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: bal >= 0 ? w.color : "#E07A5F" }}>{fmt(bal)}</div>
                </div>
              );
            })}
          </div>

          <LionMascot balance={mainBalance} dancing={lionDancing}/>
          <SplitExpenses splits={splits} expanded={splitExpanded} onToggle={() => setSplitExpanded(!splitExpanded)} onAdd={s => setSplits(p => [...p, s])} onSettle={settleSplit} onDelete={id => setSplits(p => p.filter(s => s.id !== id))}/>
          <div style={{ ...cleanCard, padding: "18px 14px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#7B8CDE" }}/>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "#7B8CDE", marginBottom: 8, letterSpacing: "0.5px", fontWeight: 700 }}>Trend</div>
            <LineChart expenses={expenses} incomes={incomes} months={allMonths}/>
          </div>
          <div style={{ ...cleanCard, padding: 18, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#E07A5F" }}/>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "#E07A5F", marginBottom: 16, letterSpacing: "0.5px", fontWeight: 700 }}>Spending by Category</div>
            {filtered.expenses.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20, fontFamily: "var(--font-body)" }}>No expenses yet</p> : (() => {
              const t = {}; filtered.expenses.forEach(e => { t[e.categoryId] = (t[e.categoryId] || 0) + e.amount; });
              const s = Object.entries(t).sort((a, b) => b[1] - a[1]); const mx = s[0]?.[1] || 1;
              return s.map(([cid, total]) => { const c = categories.find(x => x.id === cid) || { name: cid, emoji: "❓", color: "#999" };
                return (<div key={cid} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><span style={{ width: 30, display: "flex", justifyContent: "center" }}><DualIcon id={c.id} accent={c.neon || c.color} size={20}/></span><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{c.name}</span><span style={{ fontSize: 13, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", fontWeight: 500 }}>{fmt(total)}</span></div><div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}><div style={{ height: "100%", width: `${(total / mx) * 100}%`, background: c.color, borderRadius: 3, transition: "width 0.4s" }}/></div></div></div>);
              });
            })()}
          </div>
          <WeeklyReport expenses={expenses}/>
        </div>
      )}

      {/* ADD */}
      {tab === "add" && <div className="page-enter" style={{ paddingTop: 8 }}><SwipeableAdd categories={categories} incomeSources={incomeSources} onAddExpense={addExpense} onAddIncome={addIncome} onAddTransfer={addTransfer}/></div>}

      {/* EVENTS */}
      {tab === "events" && (
        <div className="page-enter">
          <EventsTab events={events} expenses={expenses} splits={splits} settlements={settlements} categories={categories}
            onCreateEvent={ev => setEvents(p => [...p, ev])}
            onAddExpense={addExpense}
            onAddSplit={s => setSplits(p => [...p, s])}
            onSettleSplit={settleSplit}
            onDeleteSplit={id => setSplits(p => p.filter(s => s.id !== id))}
            onMarkDone={id => setEvents(p => p.map(e => e.id === id ? { ...e, status: "completed" } : e))}/>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="page-enter">
          <SpendingHeatmap expenses={expenses}/>
          {[
            ...filtered.expenses.map(e => ({ ...e, type: "expense" })),
            ...filtered.incomes.map(i => ({ ...i, type: "income" })),
            ...(filterMonth === "all" ? transfers : transfers.filter(t => monthKey(t.date) === filterMonth)).map(t => ({ ...t, type: "transfer" })),
            ...(filterMonth === "all" ? settlements : settlements.filter(s => monthKey(s.date) === filterMonth)).map(s => ({ ...s, type: "settlement" })),
          ].sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => (
            <TransactionCard key={item.id} item={item} categories={categories} incomeSources={incomeSources} events={events} onDelete={deleteItem}/>
          ))}
          {filtered.expenses.length === 0 && filtered.incomes.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.8 }}>No transactions yet.<br/>Add your first one!</div>}
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="page-enter" style={{ paddingTop: 8 }}>
          <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px 18px", border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{darkMode ? "🌙" : "☀️"} Dark Mode</div><div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{darkMode ? "Currently dark" : "Currently light"}</div></div>
            <div onClick={() => setDarkMode(!darkMode)} style={{ width: 48, height: 26, borderRadius: 13, background: darkMode ? "#E07A5F" : "var(--border)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: darkMode ? 25 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}/></div>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Export</div>
            <button onClick={exportCSV} style={{ width: "100%", padding: "13px", border: "none", borderRadius: 10, background: "#E07A5F", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Download CSV</button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.6, fontFamily: "var(--font-body)", fontStyle: "italic" }}>Export all data as CSV for analysis.</p>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Manage</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {["expense", "income"].map(t => (<button key={t} onClick={() => setManagerType(t)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-heading)", border: `1.5px solid ${managerType === t ? "#E07A5F" : "var(--border)"}`, background: managerType === t ? "#E07A5F" : "var(--card)", color: managerType === t ? "#fff" : "var(--muted)", cursor: "pointer", fontWeight: 500 }}>{t === "expense" ? "Categories" : "Income Sources"}</button>))}
            </div>
            {(managerType === "expense" ? categories : incomeSources).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 10, marginBottom: 6, border: "1px solid var(--border)" }}>
                <DualIcon id={c.id} accent={c.neon || c.color} size={18}/><span style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500, fontFamily: "var(--font-heading)" }}>{c.name}</span>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.color }}/>
                <button onClick={() => { const defs = managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES; if (defs.find(d => d.id === c.id)) return; if (managerType === "expense") setCategories(p => p.filter(x => x.id !== c.id)); else setIncomeSources(p => p.filter(x => x.id !== c.id)); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "2px 6px", opacity: (managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES).find(d => d.id === c.id) ? 0.15 : 0.5 }}>✕</button>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
              <label style={labelStyle}>Add New</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} maxLength={2} style={{ ...inputStyle, width: 48, textAlign: "center", flexShrink: 0 }}/>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name…" style={inputStyle}/>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 42, height: 42, border: "none", cursor: "pointer", borderRadius: 8, flexShrink: 0 }}/>
              </div>
              <button onClick={addCustomItem} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, background: "#7B8CDE", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add {managerType === "expense" ? "Category" : "Source"}</button>
            </div>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Danger Zone</div>
            {!showClearConfirm ? (
              <button onClick={() => setShowClearConfirm(true)} style={{ width: "100%", padding: "13px", border: "1.5px solid #D4726A", borderRadius: 10, background: "#D4726A12", color: "#D4726A", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Clear All Data</button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#D4726A", fontFamily: "var(--font-body)", marginBottom: 12, lineHeight: 1.5 }}>Are you sure? This deletes everything permanently.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--card)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
                  <button onClick={() => { setExpenses([]); setIncomes([]); setTransfers([]); setSettlements([]); setCategories(DEFAULT_CATEGORIES); setIncomeSources(DEFAULT_INCOME_SOURCES); setSplits([]); setEvents([]); setWalletStartBal({ upi_lite: 0, bank: 0, cash: 0 }); setShowClearConfirm(false); }} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#D4726A", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Yes, Delete All</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "24px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.8, fontStyle: "italic" }}>NOMAD v4.1 — Track smart. Spend wise. 🦁</div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--nav-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center", maxWidth: 430, margin: "0 auto", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[{ id: "dashboard", label: "Home" },{ id: "add", label: "Add" },{ id: "events", label: "Events" },{ id: "history", label: "History" },{ id: "settings", label: "Settings" }].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, padding: "10px 0 8px", border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: tab === n.id ? 1 : 0.45, transition: "opacity 0.15s" }}>
            <NavIcon type={n.id} active={tab === n.id}/>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 9, color: tab === n.id ? "#E07A5F" : "var(--muted)", fontWeight: tab === n.id ? 600 : 400, letterSpacing: "0.3px" }}>{n.label}</span>
          </button>
        ))}
      </div>

      {calibrateWallet && <CalibrateModal wallet={calibrateWallet} currentBal={walletBal[calibrateWallet.id] || 0} onSave={val => handleCalibrate(calibrateWallet.id, val)} onClose={() => setCalibrateWallet(null)}/>}

      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: toast.type === "error" ? "#D4726A" : toast.type === "success" ? "#6BAA75" : "#7B8CDE", color: "#fff", borderRadius: 50, padding: "9px 22px", fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", textAlign: "center", whiteSpace: "nowrap", animation: "toastIn 0.25s ease-out" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
