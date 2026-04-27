import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getINRRate, saveCurrencyMeta, getCurrencyMeta } from '../currencyConverter.js';

const RATE_CACHE_KEY = 'nomad-fx-rates';
const META_KEY = 'nomad-currency-meta';

// Build today's date key the same way the module does
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getINRRate
// ---------------------------------------------------------------------------
describe('getINRRate', () => {
  it('returns 1 for INR', async () => {
    expect(await getINRRate('INR')).toBe(1);
    expect(await getINRRate('inr')).toBe(1);
  });

  it('returns 1 for empty string', async () => {
    expect(await getINRRate('')).toBe(1);
    expect(await getINRRate('  ')).toBe(1);
  });

  it('returns cached rate when available and fresh', async () => {
    const cache = { [`USD_${todayKey()}`]: 83.5 };
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(cache));
    const rate = await getINRRate('USD');
    expect(rate).toBe(83.5);
  });

  it('fetches from API and caches when no cached rate', async () => {
    const mockRate = 83.12;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ usd: { inr: mockRate } }),
    });

    const rate = await getINRRate('USD');
    expect(rate).toBe(mockRate);
    expect(global.fetch).toHaveBeenCalledOnce();

    // Should now be in cache
    const cached = JSON.parse(localStorage.getItem(RATE_CACHE_KEY));
    expect(cached[`USD_${todayKey()}`]).toBe(mockRate);
  });

  it('returns null when fetch response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    const rate = await getINRRate('XYZ');
    expect(rate).toBeNull();
  });

  it('returns null when API response missing the inr field', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ eur: {} }),
    });
    const rate = await getINRRate('EUR');
    expect(rate).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    const rate = await getINRRate('GBP');
    expect(rate).toBeNull();
  });

  it('normalises currency to uppercase before lookup', async () => {
    const cache = { [`USD_${todayKey()}`]: 83.5 };
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(cache));
    expect(await getINRRate('usd')).toBe(83.5);
    expect(await getINRRate(' USD ')).toBe(83.5);
  });

  it('does not hit the API on a second call for the same currency', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ usd: { inr: 83 } }),
    });
    await getINRRate('USD');
    await getINRRate('USD');
    expect(global.fetch).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// saveCurrencyMeta / getCurrencyMeta
// ---------------------------------------------------------------------------
describe('saveCurrencyMeta & getCurrencyMeta', () => {
  it('stores and retrieves meta for a transaction', () => {
    saveCurrencyMeta('tx-001', 'USD', 100, 83.5);
    expect(getCurrencyMeta('tx-001')).toEqual({
      currency: 'USD',
      originalAmount: 100,
      rateUsed: 83.5,
    });
  });

  it('normalises currency to uppercase', () => {
    saveCurrencyMeta('tx-002', 'eur', 50, 90.2);
    expect(getCurrencyMeta('tx-002').currency).toBe('EUR');
  });

  it('returns null for unknown transaction id', () => {
    expect(getCurrencyMeta('unknown-tx')).toBeNull();
  });

  it('overwrites existing meta for the same transaction', () => {
    saveCurrencyMeta('tx-003', 'USD', 100, 83);
    saveCurrencyMeta('tx-003', 'GBP', 200, 105);
    expect(getCurrencyMeta('tx-003')).toEqual({
      currency: 'GBP',
      originalAmount: 200,
      rateUsed: 105,
    });
  });

  it('stores multiple transactions independently', () => {
    saveCurrencyMeta('tx-a', 'USD', 10, 83);
    saveCurrencyMeta('tx-b', 'EUR', 20, 90);
    expect(getCurrencyMeta('tx-a').currency).toBe('USD');
    expect(getCurrencyMeta('tx-b').currency).toBe('EUR');
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem(META_KEY, '{{invalid}');
    expect(getCurrencyMeta('any')).toBeNull();
  });
});
