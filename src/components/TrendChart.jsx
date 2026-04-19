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
} from "recharts";

const EXPENSE_COLOR = "#C97B63";
const NET_COLOR = "#7C3AED";
const POSITIVE_COLOR = "#22C55E";
const NEGATIVE_COLOR = "#EF4444";
const EXPENSE_GRADIENT_TOP = "#E8C7AA";
const EXPENSE_GRADIENT_BOTTOM = "#C97B63";

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
const yearKey = (value) => {
  const d = value instanceof Date ? value : parseDate(value);
  return String(d.getFullYear());
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
  if (period === "year") return key;
  const [year, month] = key.split("-");
  return `${monthShort[Number(month) - 1]}${period === "month" ? "" : ` '${year.slice(2)}`}`;
};

const formatTooltipLabel = (key, period) => {
  if (period === "day") {
    return parseDate(key).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  if (period === "week") {
    const start = parseDate(key);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (period === "month") {
    const [year, month] = key.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  return key;
};

const getPeriodKey = (value, period) => {
  if (period === "day") return dayKey(value);
  if (period === "week") return weekKey(value);
  if (period === "year") return yearKey(value);
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

  if (period === "year") {
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      keys.push(String(year));
    }
    return keys.slice(-8);
  }

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys.slice(-12);
};

export function buildTrendChartData({ expenses = [], incomes = [], period = "month" }) {
  const keys = getRangeKeys(expenses, incomes, period);
  const rows = new Map(
    keys.map((key) => [
      key,
      {
        key,
        label: formatAxisLabel(key, period),
        tooltipLabel: formatTooltipLabel(key, period),
        income: 0,
        totalExpense: 0,
        net: 0,
      },
    ])
  );

  expenses.forEach((expense) => {
    if (!expense?.date) return;
    const bucket = getPeriodKey(expense.date, period);
    if (!rows.has(bucket)) return;
    const row = rows.get(bucket);
    row.totalExpense = toNumber(row.totalExpense + Number(expense.amount || 0));
  });

  incomes.forEach((income) => {
    if (!income?.date) return;
    const bucket = getPeriodKey(income.date, period);
    if (!rows.has(bucket)) return;
    const row = rows.get(bucket);
    row.income = toNumber(row.income + Number(income.amount || 0));
  });

  return {
    data: [...rows.values()].map((row) => ({
      ...row,
      net: toNumber(row.income - row.totalExpense),
      netVisual: Math.max(toNumber(row.income - row.totalExpense), 0),
    })),
  };
}

const formatAxisCurrency = (value) => `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
const formatDetailCurrency = (value) => `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

function TrendTooltip({ active, payload, formatter = formatDetailCurrency }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div
      style={{
        background: "rgba(10,10,10,0.94)",
        border: "1px solid rgba(201,123,99,0.18)",
        borderRadius: 12,
        padding: "11px 12px",
        boxShadow: "0 16px 32px rgba(0,0,0,0.28)",
        minWidth: 172,
      }}
    >
      <div style={{ color: "#f4efe2", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{row.tooltipLabel}</div>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Expense</span>
          <span style={{ color: "#f4efe2", fontSize: 11, fontWeight: 700 }}>{formatter(row.totalExpense)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Income</span>
          <span style={{ color: POSITIVE_COLOR, fontSize: 11, fontWeight: 700 }}>{formatter(row.income)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ color: "rgba(244,239,226,0.62)", fontSize: 11 }}>Net</span>
          <span style={{ color: row.net >= 0 ? NET_COLOR : NEGATIVE_COLOR, fontSize: 11, fontWeight: 700 }}>
            {formatter(row.net)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrendChart({
  expenses = [],
  incomes = [],
  period = "month",
  formatCurrency = formatDetailCurrency,
}) {
  const { data } = useMemo(
    () => buildTrendChartData({ expenses, incomes, period }),
    [expenses, incomes, period]
  );
  const yMax = useMemo(() => {
    if (!data.length) return 1000;
    const peak = Math.max(...data.map((row) => Math.max(row.totalExpense || 0, row.income || 0, row.netVisual || 0)));
    const padded = Math.max(1000, peak * 1.12);
    return Math.ceil(padded / 100) * 100;
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
    <div style={{ width: "100%", minWidth: 0, minHeight: 0 }}>
      <div style={{ width: "100%", height: 280, minWidth: 0, minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: -4, bottom: 0 }}
            barGap={8}
            barCategoryGap="32%"
          >
            <defs>
              <linearGradient id="trendExpenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPENSE_GRADIENT_TOP} stopOpacity="0.95" />
                <stop offset="100%" stopColor={EXPENSE_GRADIENT_BOTTOM} stopOpacity="0.88" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={58}
              type="number"
              scale="linear"
              tickCount={6}
              allowDecimals={false}
              tickFormatter={formatAxisCurrency}
              domain={[0, yMax]}
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-h)" }}
            />
            <Tooltip content={<TrendTooltip formatter={formatCurrency} />} cursor={{ fill: "rgba(201,123,99,0.08)" }} />
            <Bar
              dataKey="totalExpense"
              name="Expense"
              fill="url(#trendExpenseFill)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
              animationDuration={650}
            />
            <Line
              type="monotone"
              dataKey="netVisual"
              name="Net"
              stroke={NET_COLOR}
              strokeWidth={2.5}
              dot={{ r: 2.5, strokeWidth: 0, fill: NET_COLOR }}
              activeDot={{ r: 5, strokeWidth: 0, fill: NET_COLOR }}
              connectNulls
              animationDuration={850}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
