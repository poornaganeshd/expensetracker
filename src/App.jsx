import { useState, useEffect, useMemo, useRef } from "react";

/* ─── CONSTANTS ─── */
const APP_NAME = "NOMAD";
const CURRENCY = "₹";

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

/* ─── LION MASCOT ─── */
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

const LION_COMMENTS_HAPPY = [
  "Roarrr! You're saving well!",
  "King of budgets right here!",
  "More income than spending! Nice!",
  "Proud of you, human!",
  "Your wallet is smiling!",
];

const LION_COMMENTS_SAD = [
  "Uh oh… spending > income",
  "Time to tighten the belt, friend.",
  "Let's slow down a bit, okay?",
  "I believe in you! Cut one expense!",
  "Ramen week? We got this.",
];

function LionSVG({ mood, dancing }) {
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (!dancing) { setBounce(false); return; }
    setBounce(true);
    const to = setTimeout(() => setBounce(false), 1600);
    return () => clearTimeout(to);
  }, [dancing]);

  const mane = mood === "happy" ? "#d97757" : "#b0aea5";
  const face = "#fae6c8";
  const nose = mood === "happy" ? "#c4736e" : "#999";

  return (
    <svg viewBox="0 0 80 80" width="56" height="56" style={{
      transition: "transform 0.2s",
      transform: bounce ? "translateY(-6px) rotate(-5deg)" : "none",
      animation: bounce ? "lionDance 0.3s ease infinite alternate" : "none",
    }}>
      <circle cx="40" cy="40" r="32" fill={mane} opacity="0.9" />
      <circle cx="20" cy="25" r="10" fill={mane} opacity="0.7" />
      <circle cx="60" cy="25" r="10" fill={mane} opacity="0.7" />
      <circle cx="15" cy="42" r="9" fill={mane} opacity="0.6" />
      <circle cx="65" cy="42" r="9" fill={mane} opacity="0.6" />
      <circle cx="24" cy="60" r="8" fill={mane} opacity="0.5" />
      <circle cx="56" cy="60" r="8" fill={mane} opacity="0.5" />
      <circle cx="40" cy="42" r="22" fill={face} />
      {mood === "happy" ? (
        <>
          <path d="M30 38 Q33 34 36 38" stroke="#141413" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M44 38 Q47 34 50 38" stroke="#141413" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="33" cy="37" r="3" fill="#141413" />
          <circle cx="47" cy="37" r="3" fill="#141413" />
          <path d="M30 34 L36 36" stroke="#141413" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50 34 L44 36" stroke="#141413" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      <ellipse cx="40" cy="45" rx="4" ry="3" fill={nose} />
      {mood === "happy" ? (
        <path d="M34 49 Q40 55 46 49" stroke="#141413" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M34 52 Q40 48 46 52" stroke="#141413" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      <circle cx="22" cy="22" r="6" fill={face} />
      <circle cx="58" cy="22" r="6" fill={face} />
      <circle cx="22" cy="22" r="3" fill="#f0c4b0" />
      <circle cx="58" cy="22" r="3" fill="#f0c4b0" />
    </svg>
  );
}

function LionMascot({ balance, dancing }) {
  const [msg, setMsg] = useState("");
  const mood = balance >= 0 ? "happy" : "sad";

  useEffect(() => {
    const pool = Math.random() < 0.5
      ? LION_TIPS
      : (mood === "happy" ? LION_COMMENTS_HAPPY : LION_COMMENTS_SAD);
    setMsg(pool[Math.floor(Math.random() * pool.length)]);
  }, [balance, mood]);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, padding: "12px 0" }}>
      <LionSVG mood={mood} dancing={dancing} />
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px",
        padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 220,
        fontFamily: "var(--font-body)", lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {msg}
      </div>
    </div>
  );
}

/* ─── LINE CHART ─── */
function LineChart({ expenses, incomes, months }) {
  if (months.length < 1) return <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24, fontFamily: "var(--font-body)" }}>Add transactions to see trends</p>;

  const getData = (m) => ({
    inc: incomes.filter((i) => monthKey(i.date) === m).reduce((s, i) => s + i.amount, 0),
    exp: expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0),
  });

  const data = months.map(getData);
  const maxVal = Math.max(...data.flatMap((d) => [d.inc, d.exp]), 1);
  const w = 320, h = 140, px = 44, py = 16;
  const gw = w - px * 2, gh = h - py * 2;
  const toX = (i) => px + (months.length === 1 ? gw / 2 : (i / (months.length - 1)) * gw);
  const toY = (v) => py + gh - (v / maxVal) * gh;
  const makePath = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d[key])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h + 28}`} width="100%" style={{ display: "block" }}>
      {[0, 0.5, 1].map((f, i) => (
        <g key={i}>
          <line x1={px} x2={w - px} y1={toY(maxVal * f)} y2={toY(maxVal * f)} stroke="var(--border)" strokeDasharray="3 3" />
          <text x={2} y={toY(maxVal * f) + 4} fill="var(--muted)" fontSize={9} fontFamily="var(--font-heading)">{fmt(Math.round(maxVal * f))}</text>
        </g>
      ))}
      <path d={`${makePath("inc")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#788c5d" opacity="0.08" />
      <path d={`${makePath("exp")} L${toX(data.length - 1)},${h - py} L${toX(0)},${h - py} Z`} fill="#d97757" opacity="0.08" />
      <path d={makePath("inc")} fill="none" stroke="#788c5d" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath("exp")} fill="none" stroke="#d97757" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.inc)} r={4} fill="#fff" stroke="#788c5d" strokeWidth={2} />
          <circle cx={toX(i)} cy={toY(d.exp)} r={4} fill="#fff" stroke="#d97757" strokeWidth={2} />
          <text x={toX(i)} y={h + 18} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-heading)">{monthLabel(months[i])}</text>
        </g>
      ))}
      <g transform={`translate(${w / 2 - 55}, ${h + 6})`}>
        <circle cx={0} cy={16} r={4} fill="#788c5d" /><text x={8} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Income</text>
        <circle cx={68} cy={16} r={4} fill="#d97757" /><text x={76} y={20} fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">Spent</text>
      </g>
    </svg>
  );
}

/* ─── SWIPEABLE ADD PAGE ─── */
function SwipeableAdd({ categories, incomeSources, onAddExpense, onAddIncome }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("0");
  const [catId, setCatId] = useState(categories[0]?.id || "");
  const [srcId, setSrcId] = useState(incomeSources[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const touchStart = useRef(null);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 60) setType("income");
    if (diff < -60) setType("expense");
    touchStart.current = null;
  };

  const submit = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    if (type === "expense") onAddExpense({ amount: a, categoryId: catId, date, note });
    else onAddIncome({ amount: a, sourceId: srcId, date, note });
    setAmount("0"); setNote("");
  };

  const items = type === "expense" ? categories : incomeSources;
  const selected = type === "expense" ? catId : srcId;
  const setSelected = type === "expense" ? setCatId : setSrcId;

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ padding: "0 0 20px" }}>
      <div style={{
        display: "flex", background: "var(--card)", borderRadius: 12, padding: 4,
        border: "1px solid var(--border)", marginBottom: 20
      }}>
        {["expense", "income"].map((t) => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: "11px 0", border: "none", borderRadius: 9,
            background: type === t ? (t === "expense" ? "#d97757" : "#788c5d") : "transparent",
            color: type === t ? "#fff" : "var(--muted)", fontFamily: "var(--font-heading)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px",
            transition: "all 0.15s",
          }}>{t === "expense" ? "← Expense" : "Income →"}</button>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: -14, marginBottom: 14, fontFamily: "var(--font-body)", fontStyle: "italic" }}>
        Swipe left / right to switch
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Amount ({CURRENCY})</label>
        <input type="number" value={amount === "0" ? "" : amount} onChange={(e) => setAmount(e.target.value || "0")}
          placeholder="0" autoFocus
          style={{
            ...inputStyle, fontSize: 32, fontWeight: 600, fontFamily: "var(--font-heading)",
            textAlign: "center", padding: "18px 14px",
            color: type === "expense" ? "#d97757" : "#788c5d",
            borderColor: type === "expense" ? "#d97757" : "#788c5d",
          }}
        />
      </div>

      <label style={labelStyle}>{type === "expense" ? "Category" : "Source"}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {items.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{
            padding: "8px 14px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-body)",
            border: `1.5px solid ${selected === c.id ? c.color : "var(--border)"}`,
            background: selected === c.id ? c.color + "18" : "var(--card)",
            color: selected === c.id ? c.color : "var(--text-secondary)", cursor: "pointer",
            fontWeight: selected === c.id ? 600 : 400, transition: "all 0.15s",
          }}>{c.emoji} {c.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional…" style={inputStyle} />
        </div>
      </div>

      <button onClick={submit} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: type === "expense" ? "#d97757" : "#788c5d", color: "#fff",
        fontSize: 15, fontFamily: "var(--font-heading)", fontWeight: 600, cursor: "pointer",
        letterSpacing: "0.3px", transition: "opacity 0.15s",
      }}>
        Add {type === "expense" ? "Expense" : "Income"}
      </button>
    </div>
  );
}

/* ─── TRANSACTION CARD ─── */
function TransactionCard({ item, categories, incomeSources, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(null);
  const isExpense = item.type === "expense";
  const cat = isExpense
    ? categories.find((c) => c.id === item.categoryId)
    : incomeSources.find((s) => s.id === item.sourceId);

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) setOffsetX(Math.max(diff, -100));
  };
  const handleTouchEnd = () => {
    if (offsetX < -60) onDelete(item.id, item.type);
    else setOffsetX(0);
    startX.current = null;
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 10 }}>
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 100,
        background: "#c4736e", display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 14, fontFamily: "var(--font-heading)", color: "#fff", fontSize: 12, fontWeight: 600,
      }}>Delete</div>
      <div
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          position: "relative", transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? "transform 0.2s" : "none",
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: (cat?.color || "#999") + "14",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
        }}>{cat?.emoji || "❓"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{cat?.name || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 2 }}>
            {item.note ? item.note + " · " : ""}{dayLabel(item.date)}
          </div>
        </div>
        <div style={{
          fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15,
          color: isExpense ? "#d97757" : "#788c5d",
        }}>
          {isExpense ? "−" : "+"}{fmt(item.amount)}
        </div>
        <button onClick={() => onDelete(item.id, item.type)} style={{
          background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
          fontSize: 14, padding: "4px 6px", borderRadius: 6, opacity: 0.35,
        }}>✕</button>
      </div>
    </div>
  );
}

/* ─── STYLES ─── */
const labelStyle = {
  fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.2px",
  marginBottom: 6, display: "block", fontFamily: "var(--font-heading)", fontWeight: 600,
};

const inputStyle = {
  background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 10,
  padding: "11px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)",
  outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s",
};

/* ─── NAV ICON ─── */
function NavIcon({ type, active }) {
  const c = active ? "#d97757" : "var(--muted)";
  if (type === "dashboard") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="13" width="7" height="8" rx="1.5"/></svg>;
  if (type === "add") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (type === "history") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>;
  if (type === "settings") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  return null;
}

/* ─── MAIN APP ─── */
export default function Nomad() {
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [incomeSources, setIncomeSources] = useState(DEFAULT_INCOME_SOURCES);
  const [filterMonth, setFilterMonth] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [lionDancing, setLionDancing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newColor, setNewColor] = useState("#d97757");
  const [managerType, setManagerType] = useState("expense");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem("nomad-data-v2");
      if (r) {
        const d = JSON.parse(r);
        if (d.expenses) setExpenses(d.expenses);
        if (d.incomes) setIncomes(d.incomes);
        if (d.categories?.length) setCategories(d.categories);
        if (d.incomeSources?.length) setIncomeSources(d.incomeSources);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("nomad-data-v2", JSON.stringify({ expenses, incomes, categories, incomeSources }));
    } catch {}
  }, [expenses, incomes, categories, incomeSources, loaded]);

  const allMonths = useMemo(() => {
    const s = new Set();
    expenses.forEach((e) => s.add(monthKey(e.date)));
    incomes.forEach((i) => s.add(monthKey(i.date)));
    return [...s].sort();
  }, [expenses, incomes]);

  const filtered = useMemo(() => {
    if (filterMonth === "all") return { expenses, incomes };
    return {
      expenses: expenses.filter((e) => monthKey(e.date) === filterMonth),
      incomes: incomes.filter((i) => monthKey(i.date) === filterMonth),
    };
  }, [expenses, incomes, filterMonth]);

  const totalIncome = filtered.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = filtered.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const triggerDance = () => { setLionDancing(true); setTimeout(() => setLionDancing(false), 1800); };
  const addExpense = (data) => { setExpenses((p) => [{ id: uid(), type: "expense", ...data }, ...p]); triggerDance(); };
  const addIncome = (data) => { setIncomes((p) => [{ id: uid(), type: "income", ...data }, ...p]); triggerDance(); };
  const deleteItem = (id, type) => {
    if (type === "expense") setExpenses((p) => p.filter((e) => e.id !== id));
    else setIncomes((p) => p.filter((i) => i.id !== id));
  };

  const addCustomItem = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "_") + "_" + uid();
    const item = { id, name: newName.trim(), emoji: newEmoji, color: newColor };
    if (managerType === "expense") setCategories((p) => [...p, item]);
    else setIncomeSources((p) => [...p, item]);
    setNewName(""); setNewEmoji("📁"); setNewColor("#d97757");
  };

  const exportCSV = () => {
    let csv = "Type,Date,Amount,Category/Source,Note\n";
    incomes.forEach((i) => {
      const src = incomeSources.find((s) => s.id === i.sourceId)?.name || i.sourceId;
      csv += `Income,${i.date},${i.amount},"${src}","${i.note || ""}"\n`;
    });
    expenses.forEach((e) => {
      const cat = categories.find((c) => c.id === e.categoryId)?.name || e.categoryId;
      csv += `Expense,${e.date},${e.amount},"${cat}","${e.note || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `nomad_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf9f5", fontFamily: "Poppins, sans-serif", color: "#b0aea5" }}>Loading…</div>;

  return (
    <div style={{
      fontFamily: "var(--font-body)", background: "var(--bg)", color: "var(--text)",
      minHeight: "100vh", maxWidth: 430, margin: "0 auto", padding: "0 16px 90px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        :root {
          --bg: #faf9f5;
          --card: #ffffff;
          --border: #e8e6dc;
          --text: #141413;
          --text-secondary: #4a4940;
          --muted: #b0aea5;
          --font-heading: 'Poppins', Arial, sans-serif;
          --font-body: 'Lora', Georgia, serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf9f5; }
        input[type=date] { color-scheme: light; }
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
        <span style={{
          fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)",
          background: "var(--card)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", fontWeight: 500,
        }}>v1.0</span>
      </div>

      {/* MONTH FILTER */}
      {(tab === "dashboard" || tab === "history") && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0 16px", scrollbarWidth: "none" }}>
          <button onClick={() => setFilterMonth("all")} style={{
            padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)",
            border: `1.5px solid ${filterMonth === "all" ? "#d97757" : "var(--border)"}`,
            background: filterMonth === "all" ? "#d97757" : "var(--card)",
            color: filterMonth === "all" ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500,
          }}>All</button>
          {allMonths.map((m) => (
            <button key={m} onClick={() => setFilterMonth(m)} style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 12, fontFamily: "var(--font-heading)",
              border: `1.5px solid ${filterMonth === m ? "#788c5d" : "var(--border)"}`,
              background: filterMonth === m ? "#788c5d" : "var(--card)",
              color: filterMonth === m ? "#fff" : "var(--muted)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500,
            }}>{monthLabel(m)}</button>
          ))}
        </div>
      )}

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="page-enter">
          <div style={{
            background: "var(--card)", borderRadius: 20, padding: "28px 24px",
            border: "1px solid var(--border)", marginBottom: 16, textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, color: "var(--muted)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 500 }}>Balance</div>
            <div style={{
              fontSize: 36, fontWeight: 700, fontFamily: "var(--font-heading)",
              color: balance >= 0 ? "#788c5d" : "#d97757", marginTop: 8, lineHeight: 1.2,
            }}>
              {balance >= 0 ? "+" : ""}{fmt(balance)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 22 }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>INCOME</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#788c5d", marginTop: 4, fontWeight: 600 }}>{fmt(totalIncome)}</div>
              </div>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 10, color: "var(--muted)", letterSpacing: "1px", fontWeight: 500 }}>SPENT</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#d97757", marginTop: 4, fontWeight: 600 }}>{fmt(totalExpense)}</div>
              </div>
            </div>
          </div>

          <LionMascot balance={balance} dancing={lionDancing} />

          <div style={{
            background: "var(--card)", borderRadius: 16, padding: "18px 14px",
            border: "1px solid var(--border)", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
          }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px", fontWeight: 600 }}>Trend</div>
            <LineChart expenses={expenses} incomes={incomes} months={allMonths} />
          </div>

          <div style={{
            background: "var(--card)", borderRadius: 16, padding: 18,
            border: "1px solid var(--border)", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
          }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 16, letterSpacing: "0.5px", fontWeight: 600 }}>Spending by Category</div>
            {filtered.expenses.length === 0
              ? <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20, fontFamily: "var(--font-body)" }}>No expenses yet</p>
              : (() => {
                  const totals = {};
                  filtered.expenses.forEach((e) => { totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount; });
                  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
                  const maxC = sorted[0]?.[1] || 1;
                  return sorted.map(([cid, total]) => {
                    const c = categories.find((x) => x.id === cid) || { name: cid, emoji: "❓", color: "#999" };
                    return (
                      <div key={cid} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{c.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading)" }}>{c.name}</span>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-heading)", color: "var(--text-secondary)", fontWeight: 500 }}>{fmt(total)}</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(total / maxC) * 100}%`, background: c.color, borderRadius: 3, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
            }
          </div>
        </div>
      )}

      {/* ADD */}
      {tab === "add" && <div className="page-enter" style={{ paddingTop: 8 }}><SwipeableAdd categories={categories} incomeSources={incomeSources} onAddExpense={addExpense} onAddIncome={addIncome} /></div>}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="page-enter">
          {[...filtered.expenses.map((e) => ({ ...e, type: "expense" })), ...filtered.incomes.map((i) => ({ ...i, type: "income" }))]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((item) => <TransactionCard key={item.id} item={item} categories={categories} incomeSources={incomeSources} onDelete={deleteItem} />)}
          {filtered.expenses.length === 0 && filtered.incomes.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.8 }}>
              No transactions yet.<br />Add your first one!
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="page-enter" style={{ paddingTop: 8 }}>
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Export</div>
            <button onClick={exportCSV} style={{
              width: "100%", padding: "13px", border: "none", borderRadius: 10,
              background: "#d97757", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 14, cursor: "pointer", fontWeight: 600,
            }}>Download CSV</button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.6, fontFamily: "var(--font-body)", fontStyle: "italic" }}>
              Export all data as CSV — upload to ChatGPT for spending analysis.
            </p>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Manage</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {["expense", "income"].map((t) => (
                <button key={t} onClick={() => setManagerType(t)} style={{
                  flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-heading)",
                  border: `1.5px solid ${managerType === t ? "#d97757" : "var(--border)"}`,
                  background: managerType === t ? "#d97757" : "var(--card)",
                  color: managerType === t ? "#fff" : "var(--muted)", cursor: "pointer", fontWeight: 500,
                }}>{t === "expense" ? "Categories" : "Income Sources"}</button>
              ))}
            </div>
            {(managerType === "expense" ? categories : incomeSources).map((c) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "var(--bg)", borderRadius: 10, marginBottom: 6, border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500, fontFamily: "var(--font-heading)" }}>{c.name}</span>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.color }} />
                <button onClick={() => {
                  const defaults = managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES;
                  if (defaults.find((d) => d.id === c.id)) return;
                  if (managerType === "expense") setCategories((p) => p.filter((x) => x.id !== c.id));
                  else setIncomeSources((p) => p.filter((x) => x.id !== c.id));
                }} style={{
                  background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "2px 6px",
                  opacity: (managerType === "expense" ? DEFAULT_CATEGORIES : DEFAULT_INCOME_SOURCES).find((d) => d.id === c.id) ? 0.15 : 0.5,
                }}>✕</button>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
              <label style={labelStyle}>Add New</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={2} style={{ ...inputStyle, width: 48, textAlign: "center", flexShrink: 0 }} />
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name…" style={inputStyle} />
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 42, height: 42, border: "none", cursor: "pointer", borderRadius: 8, flexShrink: 0 }} />
              </div>
              <button onClick={addCustomItem} style={{
                width: "100%", padding: "11px", border: "none", borderRadius: 10,
                background: "#6a9bcc", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600,
              }}>+ Add {managerType === "expense" ? "Category" : "Source"}</button>
            </div>
          </div>

          <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 12, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px", fontWeight: 600 }}>Danger Zone</div>
            {!showClearConfirm ? (
              <button onClick={() => setShowClearConfirm(true)} style={{
                width: "100%", padding: "13px", border: "1.5px solid #c4736e", borderRadius: 10,
                background: "#c4736e12", color: "#c4736e", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600,
              }}>Clear All Data</button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#c4736e", fontFamily: "var(--font-body)", marginBottom: 12, lineHeight: 1.5 }}>
                  Are you sure? This will delete all expenses, income, and custom categories permanently.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowClearConfirm(false)} style={{
                    flex: 1, padding: "11px", border: "1.5px solid var(--border)", borderRadius: 10,
                    background: "var(--card)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 500,
                  }}>Cancel</button>
                  <button onClick={() => {
                    setExpenses([]); setIncomes([]); setCategories(DEFAULT_CATEGORIES); setIncomeSources(DEFAULT_INCOME_SOURCES);
                    setShowClearConfirm(false);
                  }} style={{
                    flex: 1, padding: "11px", border: "none", borderRadius: 10,
                    background: "#c4736e", color: "#fff", fontFamily: "var(--font-heading)", fontSize: 13, cursor: "pointer", fontWeight: 600,
                  }}>Yes, Delete All</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", padding: "24px 20px", color: "var(--muted)", fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.8, fontStyle: "italic" }}>
            NOMAD v1.0 — Built for college students.<br />Track smart. Spend wise.
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(250, 249, 245, 0.96)", backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center",
        maxWidth: 430, margin: "0 auto", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {["dashboard", "add", "history", "settings"].map((id) => {
          const labels = { dashboard: "Home", add: "Add", history: "History", settings: "Settings" };
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "10px 0 8px", border: "none", background: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              cursor: "pointer", opacity: tab === id ? 1 : 0.45, transition: "opacity 0.15s",
            }}>
              <NavIcon type={id} active={tab === id} />
              <span style={{
                fontFamily: "var(--font-heading)", fontSize: 10,
                color: tab === id ? "#d97757" : "var(--muted)",
                fontWeight: tab === id ? 600 : 400, letterSpacing: "0.3px",
              }}>{labels[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}