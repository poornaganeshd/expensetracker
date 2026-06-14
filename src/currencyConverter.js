const RATE_CACHE_KEY = "nomad-fx-rates";
const META_KEY = "nomad-currency-meta";
// 1h TTL: the primary source (fxratesapi) is real-time, so re-poll hourly to
// reflect intraday moves while still cushioning rapid re-entry of the add form
// with a cache. The daily fallbacks change at most once a day, so 1h never
// misses an update from them either.
const RATE_TTL_MS = 60 * 60 * 1000;

// Rate sources, FRESHEST FIRST — tried in order until one returns a usable INR
// rate, so a flaky/rate-limited primary degrades gracefully to the next:
//   1. fxratesapi  — real-time mid-market (intraday, closest to Google), no key
//   2. open.er-api — current-DAY rate, very reliable, no key
//   3/4. fawazahmed0 mirrors — daily reference dataset, last-resort fallback
// The earlier setup queried only the fawazahmed0 mirrors, which publish once a
// day and lagged ~1 day behind ("yesterday's rate"). `parse(json, lower)` returns
// { rate, date } or null; `date` is a YYYY-MM-DD stamp for the "as of" label.
// NOTE: any new host here must ALSO be added to connect-src in vercel.json (CSP),
// or the production build will block the request.
const SOURCES = [
  {
    url: (lower, upper) => `https://api.fxratesapi.com/latest?base=${upper}&currencies=INR`,
    parse: (d) => { const r = d?.rates?.INR; if (typeof r !== "number") return null; return { rate: r, date: d.timestamp ? new Date(d.timestamp * 1000).toISOString().slice(0, 10) : (d.date || null) }; },
  },
  {
    url: (lower, upper) => `https://open.er-api.com/v6/latest/${upper}`,
    parse: (d) => { const r = d?.rates?.INR; if (typeof r !== "number") return null; return { rate: r, date: d.time_last_update_unix ? new Date(d.time_last_update_unix * 1000).toISOString().slice(0, 10) : null }; },
  },
  {
    url: (lower) => `https://latest.currency-api.pages.dev/v1/currencies/${lower}.json`,
    parse: (d, lower) => { const r = d?.[lower]?.inr; return typeof r === "number" ? { rate: r, date: d?.date || null } : null; },
  },
  {
    url: (lower) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lower}.json`,
    parse: (d, lower) => { const r = d?.[lower]?.inr; return typeof r === "number" ? { rate: r, date: d?.date || null } : null; },
  },
];

function getCachedRate(currency) {
  try {
    const cache = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || "{}");
    const entry = cache[currency];
    if (!entry || typeof entry !== "object") return null;
    if (typeof entry.rate !== "number") return null;
    if (typeof entry.fetchedAt !== "number") return null;
    if (Date.now() - entry.fetchedAt > RATE_TTL_MS) return null;
    return entry.rate;
  } catch { return null; }
}

function saveRateCache(currency, rate, date) {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[currency] = { rate, fetchedAt: Date.now(), date: date || null };
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota or serialization failure — non-fatal */ }
}

// Try each source in order; the first usable { rate, date } wins. Returns null
// only if EVERY source fails (network error, non-OK response, or missing INR).
async function fetchRate(lower, upper) {
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url(lower, upper));
      if (!res || !res.ok) continue;
      const data = await res.json();
      const parsed = src.parse(data, lower);
      if (parsed && typeof parsed.rate === "number") return parsed;
    } catch { /* network/parse failure — fall through to the next source */ }
  }
  return null;
}

const inFlight = new Map();

export async function getExchangeRate(fromCurrency) {
  const c = fromCurrency.trim().toUpperCase();
  if (!c || c === "INR") return 1;
  const cached = getCachedRate(c);
  if (cached !== null) return cached;
  if (inFlight.has(c)) return inFlight.get(c);
  const lower = c.toLowerCase();
  const promise = (async () => {
    const result = await fetchRate(lower, c);
    inFlight.delete(c);
    if (result !== null) saveRateCache(c, result.rate, result.date);
    return result === null ? null : result.rate;
  })();
  inFlight.set(c, promise);
  return promise;
}

// Read-only accessor for the cached rate's source date + freshness, so the UI
// can show "rate as of <date>". The primary source is real-time mid-market, but
// it falls back to daily feeds when unavailable, so the date may be today (live)
// or the last published day. Returns null when nothing is cached yet.
export function getRateMeta(currency) {
  try {
    const c = String(currency || "").trim().toUpperCase();
    const cache = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || "{}");
    const entry = cache[c];
    if (!entry || typeof entry !== "object" || typeof entry.rate !== "number") return null;
    return { rate: entry.rate, date: entry.date || null, fetchedAt: entry.fetchedAt || null };
  } catch { return null; }
}

export function saveCurrencyMeta(txId, currency, originalAmount, rateUsed) {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
    meta[txId] = { currency: currency.toUpperCase(), originalAmount, rateUsed, fetchedAt: Date.now() };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* quota — non-fatal */ }
}

export function getCurrencyMeta(txId) {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
    return meta[txId] || null;
  } catch { return null; }
}
