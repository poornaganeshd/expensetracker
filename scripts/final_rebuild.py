import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Remove TrendsChart component (line 317 to function Report at 449) ──────
tc_start = '\nfunction TrendsChart({'
report_marker = '\nfunction Report('

tc_idx  = content.find(tc_start)
rep_idx = content.find(report_marker)
if tc_idx  == -1: print('ERROR: TrendsChart not found'); sys.exit(1)
if rep_idx == -1: print('ERROR: function Report not found'); sys.exit(1)
content = content[:tc_idx] + content[rep_idx:]
print('Step 1: removed TrendsChart component')

# ── 2. Remove TrendsChart render (line 1200) and trendPeriod usage ────────────
old_render = '<TrendsChart expenses={ex} categories={cats} period={trendPeriod} onPeriodChange={sTrendPeriod} formatCurrency={fmt} darkMode={dm} />'
if old_render not in content:
    print('ERROR: TrendsChart render not found'); sys.exit(1)
content = content.replace(old_render, '<SpendingBreakdown expenses={ex} categories={cats} period={trendPeriod} onPeriodChange={sTrendPeriod} formatCurrency={fmt} darkMode={dm} />', 1)
print('Step 2: swapped TrendsChart render for SpendingBreakdown')

# ── 3. Insert SpendingBreakdown component before function Report ──────────────
new_component = r'''
function SpendingBreakdown({ expenses, categories, period, onPeriodChange, formatCurrency, darkMode }) {
  const categoryMap = useMemo(
    () => Object.fromEntries((categories || []).map(c => [c.id, c])),
    [categories]
  );
  const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
  const startOfWeek = date => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d; };

  const { data, activeCats, peakKey, yMax } = useMemo(() => {
    const allDates = (expenses || []).map(e => e.date).filter(Boolean).sort();
    if (!allDates.length) return { data: [], activeCats: [], peakKey: null, yMax: 1000 };
    let buckets;
    if (period === "day") {
      const today = new Date();
      buckets = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, -(13 - i));
        const key = localDateKey(date);
        return { key, label: new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short" }) };
      });
    } else if (period === "week") {
      const cur = startOfWeek(new Date());
      buckets = Array.from({ length: 8 }, (_, i) => {
        const start = addDays(cur, -(7 * (7 - i)));
        const key = localDateKey(start);
        return { key, label: new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
      });
    } else if (period === "month") {
      buckets = [...new Set(allDates.map(d => d.slice(0, 7)))].sort().slice(-12).map(key => {
        const [y, m] = key.split("-");
        return { key, label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) };
      });
    } else {
      buckets = [...new Set(allDates.map(d => d.slice(0, 4)))].sort().slice(-8).map(key => ({ key, label: key }));
    }
    const catIds = [...new Set((expenses || []).map(e => e.categoryId).filter(Boolean))];
    const rows = new Map(buckets.map(b => [b.key, { ...b, total: 0, ...Object.fromEntries(catIds.map(id => [id, 0])) }]));
    (expenses || []).forEach(expense => {
      if (!expense?.date) return;
      let key = expense.date;
      if (period === "week") { const d = new Date(`${expense.date}T00:00:00`); d.setDate(d.getDate() - d.getDay()); key = localDateKey(d); }
      else if (period === "month") key = expense.date.slice(0, 7);
      else if (period === "year") key = expense.date.slice(0, 4);
      const row = rows.get(key);
      if (!row) return;
      row[expense.categoryId] = roundMoney((row[expense.categoryId] || 0) + Number(expense.amount || 0));
      row.total = roundMoney(row.total + Number(expense.amount || 0));
    });
    const raw = [...rows.values()];
    const activeCatIds = catIds.filter(id => raw.some(r => Number(r[id] || 0) > 0));
    const activeCatsData = activeCatIds.map(id => categoryMap[id] || { id, name: id, color: "#999" });
    const chartData = raw.map(row => ({ ...row, topCat: [...activeCatIds].reverse().find(id => Number(row[id] || 0) > 0) || null }));
    const peak = chartData.reduce((best, row) => row.total > (best?.total || 0) ? row : best, null);
    const maxTotal = Math.max(0, ...chartData.map(r => r.total || 0));
    return { data: chartData, activeCats: activeCatsData, peakKey: peak?.key || null, yMax: Math.max(1000, Math.ceil(maxTotal * 1.18 / 100) * 100) };
  }, [expenses, period, categoryMap]);

  const fmtY = v => { const n = Number(v || 0); if (n >= 100000) return `\u20b9${(n/100000).toFixed(1)}L`; if (n >= 1000) return `\u20b9${(n/1000).toFixed(1)}k`; return `\u20b9${Math.round(n)}`; };
  const lineStroke = darkMode ? "rgba(255,255,255,0.6)" : "rgba(44,42,36,0.4)";
  const ttBg = darkMode ? "#1A1917" : "#FAFAF7", ttBorder = darkMode ? "#2A2926" : "#DDD9D0", ttText = darkMode ? "#E8E4DC" : "#2C2A24", ttMuted = darkMode ? "#7A7870" : "#9A9488";

  const tabs = (
    <div style={{ display: "flex", gap: 2, background: darkMode ? "#1E1D1B" : "#E4E1D9", borderRadius: 20, padding: 3 }}>
      {["Day","Week","Month","Year"].map(tab => {
        const v = tab.toLowerCase(), active = period === v;
        return <button key={v} onClick={() => onPeriodChange(v)} style={{ padding: "5px 11px", borderRadius: 16, border: "none", background: active ? (darkMode ? "#2A2926" : "#F2F0EB") : "transparent", fontSize: 11, fontFamily: "var(--font-h)", fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--muted)", cursor: "pointer" }}>{tab}</button>;
      })}
    </div>
  );

  return (
    <div style={{ ...cc, padding: "18px 14px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 3, borderRadius: "3px 0 0 0", background: "#c97b63" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div style={{ fontFamily: "var(--font-h)", fontSize: 12, color: "var(--text)", letterSpacing: "0.04em", fontWeight: 600 }}>Spending Breakdown</div>
        {tabs}
      </div>
      {!data.length || !activeCats.length ? (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "28px 0 8px", fontFamily: "var(--font-b)" }}>Add transactions to see trends</p>
      ) : (
        <>
          <div style={{ width: "100%", height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }} />
                <YAxis tickLine={false} axisLine={false} width={48} domain={[0, yMax]} tickFormatter={fmtY} tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }} tickCount={5} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload;
                  const entries = payload.filter(p => activeCats.some(c => c.id === p.dataKey) && Number(p.value || 0) > 0);
                  return (
                    <div style={{ background: ttBg, borderRadius: 10, border: `0.5px solid ${ttBorder}`, padding: "10px 12px", minWidth: 155, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: ttText, fontFamily: "var(--font-h)", marginBottom: 7 }}>{row.label}</div>
                      <div style={{ display: "grid", gap: 5 }}>
                        {entries.map(p => { const cat = activeCats.find(c => c.id === p.dataKey); return <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: cat?.color || "#999", flexShrink: 0 }} /><span style={{ color: ttMuted, fontSize: 11, fontFamily: "var(--font-b)" }}>{cat?.name || p.dataKey}</span></div><span style={{ color: ttText, fontSize: 11, fontFamily: "var(--font-b)", fontWeight: 700 }}>{formatCurrency(p.value)}</span></div>; })}
                        {entries.length > 1 && <><div style={{ height: 1, background: ttBorder, margin: "2px 0" }} /><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: ttMuted, fontSize: 11, fontFamily: "var(--font-b)" }}>Total</span><span style={{ color: "#C17A5A", fontSize: 11, fontFamily: "var(--font-h)", fontWeight: 700 }}>{formatCurrency(row.total)}</span></div></>}
                      </div>
                    </div>
                  );
                }} cursor={{ fill: "rgba(201,123,99,0.06)" }} />
                {activeCats.map(cat => (
                  <Bar key={cat.id} dataKey={cat.id} name={cat.name} stackId="e" fill={cat.color} maxBarSize={32} animationDuration={650}>
                    {data.map((row, idx) => <Cell key={`${cat.id}-${idx}`} radius={row.topCat === cat.id ? [4, 4, 0, 0] : [0, 0, 0, 0]} />)}
                  </Bar>
                ))}
                <Line type="monotone" dataKey="total" stroke={lineStroke} strokeDasharray="5 4" strokeWidth={1.5}
                  dot={({ cx, cy, payload }) => {
                    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
                    return <circle key={payload?.key} cx={cx} cy={cy} r={payload?.key === peakKey && payload?.total > 0 ? 6 : 2.5} fill="#C17A5A" />;
                  }}
                  activeDot={{ r: 5, fill: "#C17A5A" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {activeCats.map(cat => (
              <div key={cat.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 20, padding: "3px 9px" }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                <span style={{ color: "var(--muted)", fontSize: 10, fontFamily: "var(--font-b)" }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
'''

content = content.replace(report_marker, new_component + report_marker, 1)
print('Step 3: inserted SpendingBreakdown component')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('All done.')
