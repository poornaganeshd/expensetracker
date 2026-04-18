const RATE_CACHE_KEY = "nomad-fx-rates";
const META_KEY = "nomad-currency-meta";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCachedRate(currency) {
  try {
    const cache = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || "{}");
    const entry = cache[currency + "_" + todayStr()];
    return entry ?? null;
  } catch { return null; }
}

function saveRateCache(currency, rate) {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const today = todayStr();
    // Remove stale entries for this currency
    Object.keys(cache).filter(k => k.startsWith(currency + "_") && !k.endsWith(today)).forEach(k => delete cache[k]);
    cache[currency + "_" + today] = rate;
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(cache));
  } catch { }
}

export async function getINRRate(fromCurrency) {
  const c = fromCurrency.trim().toUpperCase();
  if (!c || c === "INR") return 1;
  const cached = getCachedRate(c);
  if (cached !== null) return cached;
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${c.toLowerCase()}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data[c.toLowerCase()]?.inr;
    if (!rate) return null;
    saveRateCache(c, rate);
    return rate;
  } catch { return null; }
}

export function saveCurrencyMeta(txId, currency, originalAmount, rateUsed) {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
    meta[txId] = { currency: currency.toUpperCase(), originalAmount, rateUsed };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { }
}

export function getCurrencyMeta(txId) {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
    return meta[txId] || null;
  } catch { return null; }
}
