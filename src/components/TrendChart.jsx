import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const DEFAULT_CATEGORY_COLOR = "#8A8A9A";
const NET_COLOR = "#D4AF37";

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toNumber = (value) => Math.round(Number(value || 0) * 100) / 100;
const parseDate = (value) => new Date(`${value}T00:00:00`);
const dayKey = (value) => {
  const d = value instanceof Date ? value : parseDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthKey = (value) => {
  const d = value instanceof Date ? value : parseDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const weekStart = (value) => {
  const d = value instanceof Date ? new Date(value) : parseDate(value);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start;
};
const weekKey = (value) => dayKey(weekStart(value));
const formatAxisLabel = (key, period) => {
  if (period === "day") {
    const d = parseDate(key);
    return `${dayShort[d.getDay()]} ${d.getDate()}`;
  }
  if (period === "week") {
    const d = parseDate(key);
    return `${monthShort[d.getMonth()]} ${d.getDate()}`;
  }
  const [year, month] = key.split("-");
  return `${monthShort[Number(month) - 1]}${period === "month" ? "" : ` '${year.slice(2)}`}`;
};
const getPeriodKey = (value, period) => {
  if (period === "day") return dayKey(value);
  if (period === "week") return weekKey(value);
  return monthKey(value);
};
const getRangeKeys = (expenses, incomes, period) => {
  const dates = [...expenses, ...incomes].map((item) => item.date).filter(Boolean);
  if (dates.length === 0) return [];
  const parsed = dates.map(parseDate).sort((a, b) => a - b);
  const start = parsed[0];
  const end = parsed[parsed.length - 1];
  const keys = [];

  if (period === "day") {
    const cursor = new Date(start);
    while (cursor <= end) {
      keys.push(dayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return keys.slice(-14);
  }

  if (period === "week") {
    const cursor = weekStart(start);
    const last = weekStart(end);
    while (cursor <= last) {
      keys.push(dayKey(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return keys.slice(-12);
  }

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys.slice(-12);
};

export function buildTrendChartData({ expenses = [], incomes = [], categories = [], period = "month" }) {
  const activeCategories = (categories || []).map((category) => ({
    key: category.id,
    label: category.name,
    color: category.color || category.neon || DEFAULT_CATEGORY_COLOR,
  }));
  const categorySet = new Set(activeCategories.map((category) => category.key));

  expenses.forEach((expense) => {
    if (!expense?.categoryId || categorySet.has(expense.categoryId)) return;
    activeCategories.push({
      key: expense.categoryId,
      label: expense.categoryId,
      color: DEFAULT_CATEGORY_COLOR,
    });
    categorySet.add(expense.categoryId);
  });

  const keys = getRangeKeys(expenses, incomes, period);
  const rows = new Map(
    keys.map((key) => [
      key,
      {
        key,
        label: formatAxisLabel(key, period),
        income: 0,
        totalExpense: 0,
        net: 0,
        ...Object.fromEntries(activeCategories.map((category) => [category.key, 0])),
      },
    ])
  );

  expenses.forEach((expense) => {
    if (!expense?.date) return;
    const bucket = getPeriodKey(expense.date, period);
    if (!rows.has(bucket)) return;
    const row = rows.get(bucket);
    const categoryKey = expense.categoryId || "other";
    if (!(categoryKey in row)) row[categoryKey] = 0;
    row[categoryKey] = toNumber(row[categoryKey] + Number(expense.amount || 0));
    row.totalExpense = toNumber(row.totalExpense + Number(expense.amount || 0));
  });

  incomes.forEach((income) => {
    if (!income?.date) return;
    const bucket = getPeriodKey(income.date, period);
    if (!rows.has(bucket)) return;
    const row = rows.get(bucket);
    row.income = toNumber(row.income + Number(income.amount || 0));
  });

  const data = [...rows.values()].map((row) => ({
    ...row,
    net: toNumber(row.income - row.totalExpense),
  }));

  const visibleCategories = activeCategories.filter((category) =>
    data.some((row) => Number(row[category.key] || 0) > 0)
  );

  return { data, categories: visibleCategories };
}

const formatCompactCurrency = (value) => {
  const abs = Math.abs(Number(value || 0));
  if (abs >= 100000) return `₹${(value / 100000).toFixed(abs >= 1000000 ? 1 : 0)}L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(Number(value || 0))}`;
};

function TrendTooltip({ active, payload, label, formatter = formatCompactCurrency, categoryMap }) {
  if (!active || !payload?.length) return null;

  const items = [...payload].filter((item) => item.dataKey && item.dataKey !== "income");
  const netItem = items.find((item) => item.dataKey === "net");
  const expenseItems = items
    .filter((item) => item.dataKey !== "net" && Number(item.value || 0) > 0)
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  const totalExpense = expenseItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const income = payload.find((item) => item.dataKey === "income")?.value || 0;

  return (
    <div
      style={{
        background: "rgba(10,10,10,0.96)",
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 14,
        padding: "12px 14px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        minWidth: 180,
      }}
    >
      <div style={{ color: "#f4efe2", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {expenseItems.map((item) => (
          <div key={item.dataKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: item.color, flexShrink: 0 }} />
              <span style={{ color: "rgba(244,239,226,0.86)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {categoryMap[item.dataKey]?.label || item.name}
              </span>
            </div>
            <span style={{ color: "#f4efe2", fontSize: 11, fontWeight: 600 }}>{formatter(item.value)}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Income</span>
          <span style={{ color: "#7ecb8d", fontSize: 11, fontWeight: 700 }}>{formatter(income)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Total expense</span>
          <span style={{ color: "#f4efe2", fontSize: 11, fontWeight: 700 }}>{formatter(totalExpense)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Net</span>
          <span style={{ color: netItem?.value >= 0 ? NET_COLOR : "#e07a5f", fontSize: 11, fontWeight: 700 }}>
            {formatter(netItem?.value || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrendChart({
  expenses = [],
  incomes = [],
  categories = [],
  period = "month",
  formatCurrency = formatCompactCurrency,
}) {
  const { data, categories: activeCategories } = useMemo(
    () => buildTrendChartData({ expenses, incomes, categories, period }),
    [expenses, incomes, categories, period]
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(activeCategories.map((category) => [category.key, category])),
    [activeCategories]
  );

  const maxValue = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(
      ...data.map((row) => Math.max(row.income || 0, row.totalExpense || 0, Math.abs(row.net || 0)))
    );
  }, [data]);

  if (!data.length || data.every((row) => row.totalExpense === 0 && row.income === 0)) {
    return (
      <p
        style={{
          color: "var(--muted)",
          fontSize: 13,
          textAlign: "center",
          padding: "34px 16px",
          fontFamily: "var(--font-b)",
        }}
      >
        Add transactions to see trends
      </p>
    );
  }

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <div style={{ width: "100%", height: 280, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            barGap={2}
            barCategoryGap="22%"
          >
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={formatCurrency}
              domain={[-Math.max(maxValue * 0.25, 100), maxValue === 0 ? 1000 : Math.ceil(maxValue * 1.15)]}
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }}
            />
            <Tooltip content={<TrendTooltip formatter={formatCurrency} categoryMap={categoryMap} />} cursor={{ fill: "rgba(212,175,55,0.08)" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: "var(--muted)" }}
              formatter={(value) => <span style={{ color: "var(--muted)", fontFamily: "var(--font-h)" }}>{value}</span>}
            />
            {activeCategories.map((category) => (
              <Bar
                key={category.key}
                dataKey={category.key}
                stackId="expense"
                name={category.label}
                fill={category.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                animationDuration={700}
              />
            ))}
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke={NET_COLOR}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 0, fill: NET_COLOR }}
              activeDot={{ r: 5, strokeWidth: 0, fill: NET_COLOR }}
              animationDuration={850}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: NET_COLOR, boxShadow: "0 0 0 3px rgba(212,175,55,0.12)" }} />
            <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-h)" }}>Net balance</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(244,239,226,0.18)" }} />
            <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--font-h)" }}>Stacked expenses</span>
          </div>
        </div>
        <div style={{ color: "rgba(244,239,226,0.52)", fontSize: 10, fontFamily: "var(--font-h)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Income - Expense
        </div>
      </div>
    </div>
  );
}
