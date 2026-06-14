const RATE_CACHE_KEY = "nomad-fx-rates";
const META_KEY = "nomad-currency-meta";
// 12h (not 24h): @fawazahmed0/currency-api publishes once per day, so a 12h
// TTL guarantees we pick up each day's update within half a day instead of
// potentially showing a rate that's ~2 days stale (yesterday's number cached
// for a full 24h).
const RATE_TTL_MS = 12 * 60 * 60 * 1000;

// PRIMARY is the Cloudflare-hosted mirror, which serves the CURRENT day's rate.
// jsdelivr's `@latest` npm tag is cached aggressively by its CDN and routinely
// lags ~1 day behind, so it's the FALLBACK (used only when the primary is
// unreachable) — querying it first was the root cause of "rates don't match
// today's value". Both are official endpoints of the same dataset.
const PRIMARY_CDN  = "https://latest.currency-api.pages.dev/v1/currencies";
const FALLBACK_CDN = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

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

// Returns { rate, date } on success (date is the dataset's publish date, e.g.
// "2026-06-13"; may be undefined for mocked/minimal responses), or null on any
// failure so the caller can fall through to the backup CDN.
async function fetchRateFrom(baseUrl, lower) {
  const res = await fetch(`${baseUrl}/${lower}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  const rate = data?.[lower]?.inr;
  return typeof rate === "number" ? { rate, date: data?.date } : null;
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
    let result = null;
    try { result = await fetchRateFrom(PRIMARY_CDN, lower); } catch { result = null; }
    if (result === null) {
      try { result = await fetchRateFrom(FALLBACK_CDN, lower); } catch { result = null; }
    }
    inFlight.delete(c);
    if (result !== null) saveRateCache(c, result.rate, result.date);
    return result === null ? null : result.rate;
  })();
  inFlight.set(c, promise);
  return promise;
}

// Read-only accessor for the cached rate's publish date + freshness, so the UI
// can show "rates as of <date>" and set the right expectation (this is a daily
// reference feed, not a live market quote — it won't tick to match Google's
// mid-market rate intraday). Returns null when nothing is cached yet.
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
