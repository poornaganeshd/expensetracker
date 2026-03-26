import { useState, useEffect, useMemo, useRef } from "react";

const APP_NAME = "NOMAD";
const CURRENCY = "₹";

const WALLETS = [
  { id: "upi_lite", name: "UPI Lite", emoji: "⚡", color: "#6a9bcc" },
  { id: "bank", name: "Bank Account", emoji: "🏦", color: "#788c5d" },
];

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Drinks", emoji: "🍜", color: "#d97757" },
  { id: "transport", name: "Transport", emoji: "🚌", color: "#6a9bcc" },
  { id: "rent", name: "Rent & Bills", emoji: "🏠", color: "#b07d4e" },
  { id: "entertainment", name: "Entertainment", emoji: "🎮", color: "#788c5d" },
  { id: "health", name: "Health", emoji: "💊", color: "#c4736e" },
  { id: "coffee", name: "Coffee / Snacks", emoji: "☕", color: "#c9a253" },
  { id: "personal", name: "Personal Care", emoji: "💇", color: "#8b7ec8" },
];

const DEFAULT_INCOME_SOURCES = [
  { id: "allowance", name: "Allowance", emoji: "💸", color: "#788c5d" },
  { id: "gifts", name: "Gifts", emoji: "🎁", color: "#d97757" },
  { id: "investments", name: "Investments", emoji: "📈", color: "#6a9bcc" },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n) => CURRENCY + Number(n).toLocaleString("en-IN");
const monthKey = (d) => d.slice(0, 7);
const monthLabel = (k) => { const [y, m] = k.split("-"); return new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); };
const dayLabel = (d) => {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Today";
  if (d === yest) return "Yesterday";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

/* ─── LION ─── */
const LION_TIPS = [
  "Track every chai! Small spends add up fast.",
  "Saving ₹50/day = ₹1500/month!",
  "Review your week every Sunday!",
  "Needs vs wants — ask before buying!",
  "You're doing great, keep tracking!",
  "Set a weekly food budget challenge!",
  "Unsubscribe from stuff you don't use!",
  "Cook at home once more this week!",
];
const LION_HAPPY = ["Roarrr! You're saving well!", "King of budgets right here!", "More income than spending! Nice!", "Proud of you, human!", "Your wallet is smiling!"];
const LION_SAD = ["Uh oh… spending > income", "Time to tighten the belt, friend.", "Let's slow down a bit, okay?", "I believe in you! Cut one expense!", "Ramen week? We got this."];

function LionSVG({ mood, dancing }) {
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (!dancing) { setBounce(false); return; }
    setBounce(true);
    const to = setTimeout(() => setBounce(false), 1600);
    return () => clearTimeout(to);
  }, [dancing]);
  const mane = mood === "happy" ? "#d97757" : "#b0aea5";
  const face = "#fae6c8", nose = mood === "happy" ? "#c4736e" : "#999";
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
  useEffect(() => {
    const pool = Math.random() < 0.5 ? LION_TIPS : (mood === "happy" ? LION_HAPPY : LION_SAD);
    setMsg(pool[Math.floor(Math.random() * pool.length)]);
  }, [balance, mood]);
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
      <path d={`${makePath("inc")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#788c5d" opacity="0.08"/>
      <path d={`${makePath("exp")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#d97757" opacity="0.08"/>
      <path d={makePath("inc")} fill="none" stroke="#788c5d" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      <path d={makePath("exp")} fill="none" stroke="#d97757" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (<g key={i}><circle cx={toX(i)} cy={toY(d.inc)} r={4} fill="var(--card)" stroke="#788c5d" strokeWidth={2}/><circle cx={toX(i)} cy={toY(d.exp)} r={4} fill="var(--card)" stroke="#d97757" strokeWidth={2}/><text x={toX(i)} y={h + 18} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-heading)">{monthLabel(months[i])}</text></g>))}
      <g transform={`translate(${w / 2 - 55}, ${h + 6})`}><circle cx={0} cy={16} r={4} fill="#788c5d"/><text x={8} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Income</text><circle cx={68} cy={16} r={4} fill="#d97757"/><text x={76} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Spent</text></g>
    </svg>
  );
}

/* ─── HEATMAP CALENDAR ─── */
function SpendingHeatmap({ expenses }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goBack = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const goForward = () => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const dailyTotals = {};
  expenses.forEach((e) => {
    if (e.date.startsWith(monthPrefix)) {
      dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    }
  });
  const maxDay = Math.max(...Object.values(dailyTotals), 1);
  const monthTotal = Object.values(dailyTotals).reduce((s, v) => s + v, 0);
  const activeDays = Object.keys(dailyTotals).length;

  const getColor = (amount) => {
    if (!amount) return "var(--border)";
    const ratio = amount / maxDay;
    if (ratio < 0.25) return "#788c5d";
    if (ratio < 0.5) return "#c9a253";
    if (ratio < 0.75) return "#d97757";
    return "#c4736e";
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} style={{ width: 36, height: 36 }}/>);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
    const amount = dailyTotals[dateStr] || 0;
    const isTodayCell = isCurrentMonth && d === today.getDate();
    cells.push(
      <div key={d} title={amount ? `${fmt(amount)}` : "No spending"} style={{
        width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        background: getColor(amount), color: amount ? "#fff" : "var(--muted)",
        fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: isTodayCell ? 700 : 500,
        border: isTodayCell ? "2px solid var(--text)" : "2px solid transparent",
        cursor: "default", transition: "all 0.15s",
      }}>{d}</div>
    );
  }

  const navBtn = { background: "none", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontFamily: "var(--font-heading)" };

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: 16, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={goBack} style={navBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{monthName}</div>
          {!isCurrentMonth && <button onClick={goToday} style={{ background: "none", border: "none", fontSize: 10, color: "#d97757", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600, marginTop: 2 }}>Jump to today</button>}
        </div>
        <button onClick={goForward} style={{ ...navBtn, opacity: isCurrentMonth ? 0.3 : 1, cursor: isCurrentMonth ? "default" : "pointer" }}>→</button>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>TOTAL</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "#d97757", marginTop: 2 }}>{fmt(monthTotal)}</div>
        </div>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>AVG/DAY</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", marginTop: 2 }}>{fmt(activeDays > 0 ? Math.round(monthTotal / activeDays) : 0)}</div>
        </div>
        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>DAYS</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", marginTop: 2 }}>{activeDays}/{daysInMonth}</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} style={{ width: 36, textAlign: "center", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{cells}</div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center", alignItems: "center" }}>
        {[{ c: "var(--border)", l: "None" }, { c: "#788c5d", l: "Low" }, { c: "#c9a253", l: "Med" }, { c: "#d97757", l: "High" }, { c: "#c4736e", l: "Heavy" }].map((x) => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: x.c }}/><span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-heading)" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── WEEKLY REPORT CARD ─── */
function WeeklyReport({ expenses, weeklyTarget }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - dayOfWeek);
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate() - 7);

  const inRange = (e, start, days) => {
    const d = new Date(e.date);
    const end = new Date(start); end.setDate(start.getDate() + days);
    return d >= start && d < end;
  };

  const thisWeek = expenses.filter((e) => inRange(e, weekStart, 7));
  const lastWeek = expenses.filter((e) => inRange(e, lastWeekStart, 7));
  const thisTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
  const lastTotal = lastWeek.reduce((s, e) => s + e.amount, 0);

  // Score 1: vs target (0-40 points)
  const targetScore = weeklyTarget > 0 ? Math.max(0, 40 - (thisTotal / weeklyTarget) * 40) : 20;

  // Score 2: vs last week trend (0-30 points)
  const trendScore = lastTotal > 0 ? (thisTotal <= lastTotal ? 30 : Math.max(0, 30 - ((thisTotal - lastTotal) / lastTotal) * 30)) : 15;

  // Score 3: category balance (0-30 points) — penalize if one cat > 50% of total
  const catTotals = {};
  thisWeek.forEach((e) => { catTotals[e.categoryId] = (catTotals[e.categoryId] || 0) + e.amount; });
  const catValues = Object.values(catTotals);
  const maxCatPct = thisTotal > 0 && catValues.length > 0 ? Math.max(...catValues) / thisTotal : 0;
  const catScore = catValues.length === 0 ? 15 : (maxCatPct > 0.5 ? Math.max(0, 30 - (maxCatPct - 0.5) * 60) : 30);

  const totalScore = Math.round(targetScore + trendScore + catScore);
  const grade = totalScore >= 85 ? "A" : totalScore >= 70 ? "B" : totalScore >= 50 ? "C" : totalScore >= 30 ? "D" : "F";
  const gradeColor = { A: "#788c5d", B: "#6a9bcc", C: "#c9a253", D: "#d97757", F: "#c4736e" }[grade];
  const gradeMsg = { A: "Outstanding week! Keep it up!", B: "Good job — small room to improve.", C: "Decent, but watch your spending.", D: "Spending is getting heavy…", F: "Rough week. Fresh start ahead!" }[grade];

  const pctChange = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal * 100).toFixed(0) : null;

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 16, letterSpacing: "0.5px", fontWeight: 600 }}>Weekly Report Card</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: gradeColor + "18", border: `3px solid ${gradeColor}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 32, fontWeight: 700, fontFamily: "var(--font-heading)", color: gradeColor }}>{grade}</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)", marginBottom: 4 }}>{gradeMsg}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
            Spent <strong style={{ color: "#d97757" }}>{fmt(thisTotal)}</strong> this week
            {pctChange !== null && <span style={{ color: Number(pctChange) <= 0 ? "#788c5d" : "#d97757" }}> ({Number(pctChange) > 0 ? "+" : ""}{pctChange}% vs last week)</span>}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {[{ label: "Target", score: Math.round(targetScore), max: 40 }, { label: "Trend", score: Math.round(trendScore), max: 30 }, { label: "Balance", score: Math.round(catScore), max: 30 }].map((s) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(s.score / s.max) * 100}%`, background: gradeColor, borderRadius: 3, transition: "width 0.4s" }}/>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", marginTop: 3 }}>{s.score}/{s.max}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SPLIT EXPENSES ─── */
function SplitExpenses({ splits, onAdd, onSettle, onDelete, expanded, onToggle }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState("owe");

  const add = () => {
    if (!name.trim() || !amount || Number(amount) <= 0) return;
    onAdd({ id: uid(), name: name.trim(), amount: Number(amount), direction: dir, settled: false });
    setName(""); setAmount("");
  };

  const totalOwed = splits.filter((s) => s.direction === "owe" && !s.settled).reduce((t, s) => t + s.amount, 0);
  const totalOwing = splits.filter((s) => s.direction === "owed" && !s.settled).reduce((t, s) => t + s.amount, 0);

  if (!expanded) {
    return (
      <div onClick={onToggle} style={{
        background: "var(--card)", borderRadius: 16, padding: "16px 18px", border: "1px solid var(--border)",
        marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.5px", fontWeight: 600 }}>Split Expenses</div>
          <div style={{ fontSize: 13, fontFamily: "var(--font-body)", color: "var(--text-secondary)", marginTop: 4 }}>
            {splits.filter((s) => !s.settled).length === 0 ? "No pending splits" : (
              <><span style={{ color: "#d97757" }}>You owe {fmt(totalOwed)}</span> · <span style={{ color: "#788c5d" }}>Owed {fmt(totalOwing)}</span></>
            )}
          </div>
        </div>
        <span style={{ fontSize: 18, color: "var(--muted)" }}>→</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.5px", fontWeight: 600 }}>Split Expenses</div>
        <button onClick={onToggle} style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>← Back</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#d9775712", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#d97757", fontFamily: "var(--font-heading)", fontWeight: 600 }}>YOU OWE</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#d97757", marginTop: 4 }}>{fmt(totalOwed)}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: 12, background: "#788c5d12", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#788c5d", fontFamily: "var(--font-heading)", fontWeight: 600 }}>OWED TO YOU</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "#788c5d", marginTop: 4 }}>{fmt(totalOwing)}</div>
        </div>
      </div>

      {splits.filter((s) => !s.settled).map((s) => (
        <div key={s.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: "var(--bg)", borderRadius: 10, marginBottom: 6, border: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 16 }}>{s.direction === "owe" ? "🔴" : "🟢"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--text)" }}>{s.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>{s.direction === "owe" ? "You owe" : "Owes you"}</div>
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: s.direction === "owe" ? "#d97757" : "#788c5d" }}>{fmt(s.amount)}</span>
          <button onClick={() => onSettle(s.id)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>Settle</button>
          <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
        </div>
      ))}

      {splits.filter((s) => s.settled).length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500, marginBottom: 6 }}>
            Settled ({splits.filter((s) => s.settled).length})
          </summary>
          {splits.filter((s) => s.settled).map((s) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: "var(--bg)", borderRadius: 10, marginBottom: 4, opacity: 0.5,
            }}>
              <span style={{ fontSize: 13 }}>✅</span>
              <span style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--text-secondary)" }}>{s.name}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-heading)", color: "var(--muted)" }}>{fmt(s.amount)}</span>
              <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, opacity: 0.4 }}>✕</button>
            </div>
          ))}
        </details>
      )}

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {["owe", "owed"].map((d) => (
            <button key={d} onClick={() => setDir(d)} style={{
              flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-heading)",
              border: `1.5px solid ${dir === d ? (d === "owe" ? "#d97757" : "#788c5d") : "var(--border)"}`,
              background: dir === d ? (d === "owe" ? "#d9775718" : "#788c5d18") : "var(--card)",
              color: dir === d ? (d === "owe" ? "#d97757" : "#788c5d") : "var(--muted)", cursor: "pointer", fontWeight: 500,
            }}>{d === "owe" ? "I owe them" : "They owe me"}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend name" style={{ ...inputStyle, flex: 1 }}/>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹" style={{ ...inputStyle, width: 80 }}/>
          <button onClick={add} style={{ padding: "10px 14px", border: "none", borderRadius: 10, background: "#d97757", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SWIPEABLE ADD ─── */
function SwipeableAdd({ categories, incomeSources, onAddExpense, onAddIncome }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("0");
  const [catId, setCatId] = useState(categories[0]?.id || "");
  const [srcId, setSrcId] = useState(incomeSources[0]?.id || "");
  const [walletId, setWalletId] = useState("upi_lite");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const touchStart = useRef(null);
  const handleTS = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTE = (e) => { if (!touchStart.current) return; const d = e.changedTouches[0].clientX - touchStart.current; if (d > 60) setType("income"); if (d < -60) setType("expense"); touchStart.current = null; };
  const submit = () => { const a = parseFloat(amount); if (!a || a <= 0) return; if (type === "expense") onAddExpense({ amount: a, categoryId: catId, date, note, walletId }); else onAddIncome({ amount: a, sourceId: srcId, date, note, walletId }); setAmount("0"); setNote(""); };
  const items = type === "expense" ? categories : incomeSources;
  const selected = type === "expense" ? catId : srcId;
  const setSelected = type === "expense" ? setCatId : setSrcId;

  return (
    <div onTouchStart={handleTS} onTouchEnd={handleTE} style={{ padding: "0 0 20px" }}>
      <div style={{ display: "flex", background: "var(--card)", borderRadius: 12, padding: 4, border: "1px solid var(--border)", marginBottom: 20 }}>
        {["expense", "income"].map((t) => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: 9, background: type === t ? (t === "expense" ? "#d97757" : "#788c5d") : "transparent", color: type === t ? "#fff" : "var(--muted)", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px", transition: "all 0.15s" }}>{t === "expense" ? "← Expense" : "Income →"}</button>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: -14, marginBottom: 14, fontFamily: "var(--font-body)", fontStyle: "italic" }}>Swipe left / right to switch</p>
      <div style={{ marginBottom: 16 }}><label style={labelStyle}>Amount ({CURRENCY})</label><input type="number" value={amount === "0" ? "" : amount} onChange={(e) => setAmount(e.target.value || "0")} placeholder="0" autoFocus style={{ ...inputStyle, fontSize: 32, fontWeight: 600, fontFamily: "var(--font-heading)", textAlign: "center", padding: "18px 14px", color: type === "expense" ? "#d97757" : "#788c5d", borderColor: type === "expense" ? "#d97757" : "#788c5d" }}/></div>

      {/* Wallet Picker */}
      <label style={labelStyle}>Pay from</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {WALLETS.map((w) => (
          <button key={w.id} onClick={() => setWalletId(w.id)} style={{
            flex: 1, padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            border: `2px solid ${walletId === w.id ? w.color : "var(--border)"}`,
            background: walletId === w.id ? w.color + "15" : "var(--card)",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 16 }}>{w.emoji}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: walletId === w.id ? 700 : 500, color: walletId === w.id ? w.color : "var(--muted)" }}>{w.name}</span>
          </button>
        ))}
      </div>

      <label style={labelStyle}>{type === "expense" ? "Category" : "Source"}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {items.map((c) => (<button key={c.id} onClick={() => setSelected(c.id)} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-body)", border: `1.5px solid ${selected === c.id ? c.color : "var(--border)"}`, background: selected === c.id ? c.color + "18" : "var(--card)", color: selected === c.id ? c.color : "var(--text-secondary)", cursor: "pointer", fontWeight: selected === c.id ? 600 : 400, transition: "all 0.15s" }}>{c.emoji} {c.name}</button>))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle}/></div>
        <div style={{ flex: 1 }}><label style={labelStyle}>Note</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional…" style={inputStyle}/></div>
      </div>
      <button onClick={submit} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 12, background: type === "expense" ? "#d97757" : "#788c5d", color: "#fff", fontSize: 15, fontFamily: "var(--font-heading)", fontWeight: 600, cursor: "pointer", letterSpacing: "0.3px" }}>Add {type === "expense" ? "Expense" : "Income"}</button>
    </div>
  );
}

/* ─── TRANSACTION CARD ─── */
function TransactionCard({ item, categories, incomeSources, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(null);
  const isExp = item.type === "expense";
  const cat = isExp ? categories.find((c) => c.id === item.categoryId) : incomeSources.find((s) => s.id === item.sourceId);
  const wallet = WALLETS.find((w) => w.id === item.walletId);
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 10 }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: "#c4736e", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, fontFamily: "var(--font-heading)", color: "#fff", fontSize: 12, fontWeight: 600 }}>Delete</div>
      <div onTouchStart={(e) => { startX.current = e.touches[0].clientX; }} onTouchMove={(e) => { if (!startX.current) return; const d = e.touches[0].clientX - startX.current; if (d < 0) setOffsetX(Math.max(d, -100)); }} onTouchEnd={() => { if (offsetX < -60) onDelete(item.id, item.type); else setOffsetX(0); startX.current = null; }}
        style={{ position: "relative", transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? "transform 0.2s" : "none", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: (cat?.color || "#999") + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat?.emoji || "❓"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{cat?.name || "Unknown"}</span>
            {wallet && <span style={{ fontSize: 9, fontFamily: "var(--font-heading)", fontWeight: 600, color: wallet.color, background: wallet.color + "18", padding: "2px 6px", borderRadius: 4 }}>{wallet.emoji} {wallet.name === "UPI Lite" ? "UPI" : "Bank"}</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{item.note ? item.note + " · " : ""}{dayLabel(item.date)}</div>
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: isExp ? "#d97757" : "#788c5d" }}>{isExp ? "−" : "+"}{fmt(item.amount)}</div>
        <button onClick={() => onDelete(item.id, item.type)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "4px 6px", opacity: 0.35 }}>✕</button>
      </div>
    </div>
  );
}

/* ─── STYLES ─── */
const labelStyle = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6, display: "block", fontFamily: "var(--font-heading)", fontWeight: 600 };
const inputStyle = { background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", width: "100%", boxSizing: "border-box" };

function NavIcon({ type, active }) {
  const c = active ? "#d97757" : "var(--muted)";
  if (type === "dashboard") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="13" width="7" height="8" rx="1.5"/></svg>;
  if (type === "add") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (type === "history") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>;
  if (type === "settings") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  if (type === "report") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  return null;
}

/* ─── MAIN APP ─── */
export default function Nomad() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [incomeSources, setIncomeSources] = useState(DEFAULT_INCOME_SOURCES);
  const [splits, setSplits] = useState([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [lionDancing, setLionDancing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState(2000);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newColor, setNewColor] = useState("#d97757");
  const [managerType, setManagerType] = useState("expense");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [splitExpanded, setSplitExpanded] = useState(false);
  const [walletStartBal, setWalletStartBal] = useState({ upi_lite: 0, bank: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nomad-v3");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.expenses) setExpenses(d.expenses);
        if (d.incomes) setIncomes(d.incomes);
        if (d.categories?.length) setCategories(d.categories);
        if (d.incomeSources?.length) setIncomeSources(d.incomeSources);
        if (d.splits) setSplits(d.splits);
        if (d.darkMode !== undefined) setDarkMode(d.darkMode);
        if (d.weeklyTarget) setWeeklyTarget(d.weeklyTarget);
        if (d.walletStartBal) setWalletStartBal(d.walletStartBal);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("nomad-v3", JSON.stringify({ expenses, incomes, categories, incomeSources, splits, darkMode, weeklyTarget, walletStartBal })); } catch {}
  }, [expenses, incomes, categories, incomeSources, splits, darkMode, weeklyTarget, walletStartBal, loaded]);

  const allMonths = useMemo(() => { const s = new Set(); expenses.forEach((e) => s.add(monthKey(e.date))); incomes.forEach((i) => s.add(monthKey(i.date))); return [...s].sort(); }, [expenses, incomes]);
  const filtered = useMemo(() => { if (filterMonth === "all") return { expenses, incomes }; return { expenses: expenses.filter((e) => monthKey(e.date) === filterMonth), incomes: incomes.filter((i) => monthKey(i.date) === filterMonth) }; }, [expenses, incomes, filterMonth]);

  const totalIncome = filtered.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = filtered.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  // Wallet balances (computed from starting balance + all income - all expenses per wallet)
  const walletBal = useMemo(() => {
    const bal = { upi_lite: walletStartBal.upi_lite || 0, bank: walletStartBal.bank || 0 };
    incomes.forEach((i) => { const w = i.walletId || "bank"; if (bal[w] !== undefined) bal[w] += i.amount; });
    expenses.forEach((e) => { const w = e.walletId || "upi_lite"; if (bal[w] !== undefined) bal[w] -= e.amount; });
    return bal;
  }, [expenses, incomes, walletStartBal]);

  const triggerDance = () => { setLionDancing(true); setTimeout(() => setLionDancing(false), 1800); };
  const addExpense = (data) => { setExpenses((p) => [{ id: uid(), type: "expense", ...data }, ...p]); triggerDance(); };
  const addIncome = (data) => { setIncomes((p) => [{ id: uid(), type: "income", ...data }, ...p]); triggerDance(); };
  const deleteItem = (id, type) => { if (type === "expense") setExpenses((p) => p.filter((e) => e.id !== id)); else setIncomes((p) => p.filter((i) => i.id !== id)); };
  const addCustomItem = () => { if (!newName.trim()) return; const id = newName.trim().toLowerCase().replace(/\s+/g, "_") + "_" + uid(); const item = { id, name: newName.trim(), emoji: newEmoji, color: newColor }; if (managerType === "expense") setCategories((p) => [...p, item]); else setIncomeSources((p) => [...p, item]); setNewName(""); setNewEmoji("📁"); setNewColor("#d97757"); };

  const exportCSV = () => {
    let csv = "Type,Date,Amount,Category/Source,Wallet,Note\n";
    incomes.forEach((i) => { const w = WALLETS.find((x) => x.id === i.walletId)?.name || "Bank Account"; csv += `Income,${i.date},${i.amount},"${incomeSources.find((s) => s.id === i.sourceId)?.name || i.sourceId}","${w}","${i.note || ""}"\n`; });
    expenses.forEach((e) => { const w = WALLETS.find((x) => x.id === e.walletId)?.name || "UPI Lite"; csv += `Expense,${e.date},${e.amount},"${categories.find((c) => c.id === e.categoryId)?.name || e.categoryId}","${w}","${e.note || ""}"\n`; });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `nomad_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf9f5", fontFamily: "Poppins, sans-serif", color: "#b0aea5" }}>Loading…</div>;

  const theme = darkMode ? {
    "--bg": "#141413", "--card": "#1e1e1c", "--border": "#2e2e2a", "--text": "#faf9f5",
    "--text-secondary": "#c5c3b8", "--muted": "#6b6960", "--nav-bg": "rgba(20,20,19,0.96)",
  } : {
    "--bg": "#faf9f5", "--card": "#ffffff", "--border": "#e8e6dc", "--text": "#141413",
    "--text-secondary": "#4a4940", "--muted": "#b0aea5", "--nav-bg": "rgba(250,249,245,0.96)",
  };

  return (
    <div style={{ ...theme, fontFamily: "var(--font-body)", background: "var(--bg)", color: "var(--text)", minHeight: "100vh", maxWidth: 430, margin: "0 auto", padding: "0 16px 90px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        :root { --font-heading: 'Poppins', Arial, sans-serif; --font-body: 'Lora', Georgia, serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${darkMode ? "#141413" : "#faf9f5"}; }
        input[type=date] { color-scheme: ${darkMode ? "dark" : "light"}; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lionDance { from { transform: translateY(-6px) rotate(-5deg); } to { transform: translateY(-4px) rotate(5deg); } }
        .page-enter { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "22px 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🦁</span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "1px" }}>{APP_NAME}</span>
        </div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", background: "var(--card)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", fontWeight: 500 }}>v2.1</span>
      </div>

      {/* MONTH FILTER */}
      {(tab === "dashboard" || tab === "history") && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0 16px", scrollbarWidth: "none" }}>
          <button onClick={() => setFilterMonth("all")} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${filterMonth === "all" ? "#d97757" : "var(--border)"}`, background: filterMonth === "all" ? "#d97757" : "var(--card)", color: filterMonth === "all" ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>All</button>
          {allMonths.map((m) => (<button key={m} onClick={() => setFilterMonth(m)} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)", border: `1.5px solid ${filterMonth === m ? "#788c5d" : "var(--border)"}`, background: filterMonth === m ? "#788c5d" : "var(--card)", color: filterMonth === m ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>{monthLabel(m)}</button>))}
        </div>
      )}

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="page-enter">
          <div style={{ background: "var(--card)", borderRadius: 20, padding: "28px 24px", border: "1px solid var(--border)", marginBottom: 16, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 500 }}>Balance</div>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-heading)", color: balance >= 0 ? "#788c5d" : "#d97757", marginTop: 8, lineHeight: 1.2 }}>{balance >= 0 ? "+" : ""}{fmt(balance)}</div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 22 }}>
              <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>INCOME</div><div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#788c5d", marginTop: 4, fontWeight: 600 }}>{fmt(totalIncome)}</div></div>
              <div style={{ width: 1, background: "var(--border)" }}/>
              <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>SPENT</div><div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#d97757", marginTop: 4, fontWeight: 600 }}>{fmt(totalExpense)}</div></div>
            </div>
          </div>

          {/* Wallet Cards */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {WALLETS.map((w) => {
              const bal = walletBal[w.id] || 0;
              return (
                <div key={w.id} style={{
                  flex: 1, background: "var(--card)", borderRadius: 14, padding: "14px 16px",
                  border: `1.5px solid ${w.color}30`, boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{w.emoji}</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--muted)" }}>{w.name}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-heading)", color: bal >= 0 ? w.color : "#d97757" }}>
                    {fmt(bal)}
                  </div>
                </div>
              );
            })}
          </div>

          <LionMascot balance={balance} dancing={lionDancing}/>

          {/* Split Expenses Card */}
          <SplitExpenses splits={splits} expanded={splitExpanded} onToggle={() => setSplitExpanded(!splitExpanded)}
            onAdd={(s) => setSplits((p) => [...p, s])}
            onSettle={(id) => setSplits((p) => p.map((s) => s.id === id ? { ...s, settled: true } : s))}
            onDelete={(id) => setSplits((p) => p.filter((s) => s.id !== id))}/>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: "18px 14px", border: "1px solid var(--border)", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px", fontWeight: 600 }}>Trend</div>
            <LineChart expenses={expenses} incomes={incomes} months={allMonths}/>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 16, letterSpacing: "0.5px", fontWeight: 600 }}>Spending by Category</div>
            {filtered.expenses.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20, fontFamily: "var(--font-body)" }}>No expenses yet</p> : (() => {
              const totals = {}; filtered.expenses.forEach((e) => { totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount; });
              const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]); const maxC = sorted[0]?.[1] || 1;
              return sorted.map(([cid, total]) => { const c = categories.find((x) => x.id === cid) || { name: cid, emoji: "❓", color: "#999" };
                return (<div key={cid} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{c.emoji}</span><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{c.name}</span><span style={{ fontSize: 13, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", fontWeight: 500 }}>{fmt(total)}</span></div><div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}><div style={{ height: "100%", width: `${(total / maxC) * 100}%`, background: c.color, borderRadius: 3, transition: "width 0.4s" }}/></div></div></div>);
              });
            })()}
          </div>
        </div>
      )}

      {/* ADD */}
      {tab === "add" && <div className="page-enter" style={{ paddingTop: 8 }}><SwipeableAdd categories={categories} incomeSources={incomeSources} onAddExpense={addExpense} onAddIncome={addIncome}/></div>}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="page-enter">
          <SpendingHeatmap expenses={expenses}/>
          {[...filtered.expenses.map((e) => ({ ...e, type: "expense" })), ...filtered.incomes.map((i) => ({ ...i, type: "income" }))].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => <TransactionCard key={item.id} item={item} categories={categories} incomeSources={incomeSources} onDelete={deleteItem}/>)}
          {filtered.expenses.length === 0 && filtered.incomes.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.8 }}>No transactions yet.<br/>Add your first one!</div>}
        </div>
      )}

      {/* REPORT */}
      {tab === "report" && (
        <div className="page-enter" style={{ paddingTop: 8 }}>
          <WeeklyReport expenses={expenses} weeklyTarget={weeklyTarget}/>
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px", fontWeight: 600 }}>Weekly Target</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" value={weeklyTarget} onChange={(e) => setWeeklyTarget(Number(e.target.value) || 0)} style={{ ...inputStyle, flex: 1, fontSize: 18, fontWeight: 600, fontFamily: "var(--font-heading)", textAlign: "center" }}/>
              <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)" }}>per week</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, fontFamily: "var(--font-body)", fontStyle: "italic" }}>This target is used to calculate your weekly grade.</p>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="page-enter" style={{ paddingTop: 8 }}>
          {/* Dark Mode */}
          <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px 18px", border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{darkMode ? "🌙" : "☀️"} Dark Mode</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>{darkMode ? "Currently dark" : "Currently light"}</div>
            </div>
            <div onClick={() => setDarkMode(!darkMode)} style={{
              width: 48, height: 26, borderRadius: 13, background: darkMode ? "#d97757" : "var(--border)",
              cursor: "pointer", position: "relative", transition: "background 0.2s",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: darkMode ? 25 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}/>
            </div>
          </div>

          {/* Wallet Starting Balances */}
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Wallet Starting Balances</div>
            <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginBottom: 12, fontStyle: "italic", lineHeight: 1.5 }}>
              Set how much you currently have in each wallet. All transactions adjust from here.
            </p>
            {WALLETS.map((w) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{w.emoji}</span>
                <span style={{ fontSize: 13, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text)", flex: 1 }}>{w.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-heading)" }}>{CURRENCY}</span>
                  <input type="number" value={walletStartBal[w.id] || ""} onChange={(e) => setWalletStartBal((prev) => ({ ...prev, [w.id]: Number(e.target.value) || 0 }))}
                    style={{ ...inputStyle, width: 100, fontSize: 16, fontWeight: 600, fontFamily: "var(--font-heading)", textAlign: "right", padding: "8px 10px" }}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Export</div>
            <button onClick={exportCSV} style={{ width: "100%", padding: "13px", border: "none", borderRadius: 10, background: "#d97757", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Download CSV</button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.6, fontFamily: "var(--font-body)", fontStyle: "italic" }}>Export all data as CSV — upload to ChatGPT for spending analysis.</p>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Manage</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {["expense", "income"].map((t) => (<button key={t} onClick={() => setManagerType(t)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-heading)", border: `1.5px solid ${managerType === t ? "#d97757" : "var(--border)"}`, background: managerType === t ? "#d97757" : "var(--card)", color: managerType === t ? "#fff" : "var(--muted)", cursor: "pointer", fontWeight: 500 }}>{t === "expense" ? "Categories" : "Income Sources"}</button>))}
            </div>
            {(managerType === "expense" ? categories : incomeSources).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 10, marginBottom: 6, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span><span style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500, fontFamily: "var(--font-heading)" }}>{c.name}</span>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.color }}/>
                <button onClick={() => { const defs = managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES; if (defs.find((d) => d.id === c.id)) return; if (managerType === "expense") setCategories((p) => p.filter((x) => x.id !== c.id)); else setIncomeSources((p) => p.filter((x) => x.id !== c.id)); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "2px 6px", opacity: (managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES).find((d) => d.id === c.id) ? 0.15 : 0.5 }}>✕</button>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
              <label style={labelStyle}>Add New</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={2} style={{ ...inputStyle, width: 48, textAlign: "center", flexShrink: 0 }}/>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name…" style={inputStyle}/>
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 42, height: 42, border: "none", cursor: "pointer", borderRadius: 8, flexShrink: 0 }}/>
              </div>
              <button onClick={addCustomItem} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, background: "#6a9bcc", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add {managerType === "expense" ? "Category" : "Source"}</button>
            </div>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Danger Zone</div>
            {!showClearConfirm ? (
              <button onClick={() => setShowClearConfirm(true)} style={{ width: "100%", padding: "13px", border: "1.5px solid #c4736e", borderRadius: 10, background: "#c4736e12", color: "#c4736e", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Clear All Data</button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#c4736e", fontFamily: "var(--font-body)", marginBottom: 12, lineHeight: 1.5 }}>Are you sure? This will delete everything permanently.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--card)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Cancel</button>
                  <button onClick={() => { setExpenses([]); setIncomes([]); setCategories(DEFAULT_CATEGORIES); setIncomeSources(DEFAULT_INCOME_SOURCES); setSplits([]); setWalletStartBal({ upi_lite: 0, bank: 0 }); setShowClearConfirm(false); }} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#c4736e", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Yes, Delete All</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", padding: "24px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.8, fontStyle: "italic" }}>NOMAD v2.0 — Built for college students.<br/>Track smart. Spend wise.</div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--nav-bg)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center", maxWidth: 430, margin: "0 auto", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[{id:"dashboard",label:"Home"},{id:"add",label:"Add"},{id:"report",label:"Report"},{id:"history",label:"History"},{id:"settings",label:"Settings"}].map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, padding: "10px 0 8px", border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: tab === n.id ? 1 : 0.45, transition: "opacity 0.15s" }}>
            <NavIcon type={n.id} active={tab === n.id}/>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 9, color: tab === n.id ? "#d97757" : "var(--muted)", fontWeight: tab === n.id ? 600 : 400, letterSpacing: "0.3px" }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
