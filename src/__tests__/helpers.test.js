import { describe, it, expect } from 'vitest';

// Mirrors parseAmount in src/App.jsx. Keep in sync with the module-level
// helper there — these tests guard against locale-format regressions.
const parseAmount = (s) => {
  if (typeof s === "number") return s;
  if (s == null) return NaN;
  const str = String(s).trim();
  if (!str) return NaN;
  const hasComma = str.includes(",");
  const hasPeriod = str.includes(".");
  if (hasComma && !hasPeriod && str.split(",").length === 2 && /,\d{1,2}$/.test(str)) return Number(str.replace(",", "."));
  return Number(str.replace(/,/g, ""));
};

// Mirrors isUpiLite in src/App.jsx.
const isUpiLite = (walletOrId, walletList) => {
  if (!walletOrId) return false;
  if (typeof walletOrId === "string") {
    if (walletOrId === "upi_lite") return true;
    const w = (walletList || []).find(x => x?.id === walletOrId);
    return !!w?.upiLite;
  }
  return walletOrId.id === "upi_lite" || walletOrId.upiLite === true;
};

describe('parseAmount', () => {
  it('parses standard period decimal', () => {
    expect(parseAmount("3.24")).toBe(3.24);
    expect(parseAmount("100")).toBe(100);
    expect(parseAmount("0.01")).toBe(0.01);
  });

  it('parses EU comma decimal ("3,24" -> 3.24)', () => {
    expect(parseAmount("3,24")).toBe(3.24);
    expect(parseAmount("0,5")).toBe(0.5);
    expect(parseAmount("100,99")).toBe(100.99);
  });

  it('strips thousands commas ("1,234.56" -> 1234.56)', () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
    expect(parseAmount("12,345")).toBe(12345);
  });

  it('handles Indian lakh format ("1,23,456" -> 123456)', () => {
    expect(parseAmount("1,23,456")).toBe(123456);
    expect(parseAmount("1,23,456.78")).toBe(123456.78);
  });

  it('returns NaN for empty/null/invalid', () => {
    expect(Number.isNaN(parseAmount(""))).toBe(true);
    expect(Number.isNaN(parseAmount(null))).toBe(true);
    expect(Number.isNaN(parseAmount(undefined))).toBe(true);
    expect(Number.isNaN(parseAmount("abc"))).toBe(true);
  });

  it('passes numbers through unchanged', () => {
    expect(parseAmount(3.24)).toBe(3.24);
    expect(parseAmount(0)).toBe(0);
  });

  it('trims whitespace', () => {
    expect(parseAmount("  3.24  ")).toBe(3.24);
  });
});

describe('isUpiLite', () => {
  const walletList = [
    { id: "upi_lite", name: "UPI Lite" },
    { id: "bank", name: "Bank" },
    { id: "w_gpay_abc", name: "GPay", upiLite: true },
    { id: "w_credit_xyz", name: "Credit Card" },
  ];

  it('recognizes the literal "upi_lite" id', () => {
    expect(isUpiLite("upi_lite")).toBe(true);
    expect(isUpiLite({ id: "upi_lite" })).toBe(true);
  });

  it('recognizes a wallet with upiLite: true flag', () => {
    expect(isUpiLite({ id: "w_gpay_abc", upiLite: true })).toBe(true);
    expect(isUpiLite("w_gpay_abc", walletList)).toBe(true);
  });

  it('returns false for non-upi-lite wallets', () => {
    expect(isUpiLite("bank")).toBe(false);
    expect(isUpiLite({ id: "bank" })).toBe(false);
    expect(isUpiLite("w_credit_xyz", walletList)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isUpiLite(null)).toBe(false);
    expect(isUpiLite(undefined)).toBe(false);
  });

  it('returns false when id is unknown and no wallet list is passed', () => {
    expect(isUpiLite("w_unknown")).toBe(false);
  });
});
