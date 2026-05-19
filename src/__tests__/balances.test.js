import { describe, it, expect } from 'vitest';
import { roundMoney } from '../financeUtils.js';

// Mirrors the accumulation pattern used by wBal in App.jsx after the float-drift fix.
// If this pattern is changed in App.jsx, mirror the change here.
const buildWBal = ({ wallets, wsb, inc, ex, tr, stl }) => {
  const b = {};
  wallets.forEach(w => { b[w.id] = roundMoney(wsb[w.id] || 0); });
  inc.forEach(i => { const w = i.walletId || 'bank'; if (b[w] !== undefined) b[w] = roundMoney(b[w] + i.amount); });
  ex.forEach(e => { const w = e.walletId || 'upi_lite'; if (b[w] !== undefined) b[w] = roundMoney(b[w] - e.amount); });
  tr.forEach(t => {
    if (b[t.fromWallet] !== undefined) b[t.fromWallet] = roundMoney(b[t.fromWallet] - t.amount);
    if (b[t.toWallet] !== undefined) b[t.toWallet] = roundMoney(b[t.toWallet] + t.amount);
  });
  stl.forEach(s => {
    if (b[s.walletId] !== undefined) {
      if (s.direction === 'owed') b[s.walletId] = roundMoney(b[s.walletId] + s.amount);
      else b[s.walletId] = roundMoney(b[s.walletId] - s.amount);
    }
  });
  return b;
};

describe('wBal float-drift fix', () => {
  const wallets = [{ id: 'upi_lite' }, { id: 'bank' }, { id: 'cash' }];

  it('stays exact through paisa-fraction additions', () => {
    const wsb = { upi_lite: 0, bank: 0, cash: 0 };
    const inc = [
      { walletId: 'upi_lite', amount: 0.10 },
      { walletId: 'upi_lite', amount: 0.10 },
      { walletId: 'upi_lite', amount: 0.10 },
    ];
    const b = buildWBal({ wallets, wsb, inc, ex: [], tr: [], stl: [] });
    expect(b.upi_lite).toBe(0.30);
  });

  it('reproduces the screenshot bug scenario (exact balance settles cleanly)', () => {
    // Build a balance that without rounding would drift below 3.24.
    // 0.1 + 0.2 = 0.30000000000000004 in raw IEEE-754.
    const wsb = {};
    const inc = [
      { walletId: 'upi_lite', amount: 3.04 },
      { walletId: 'upi_lite', amount: 0.10 },
      { walletId: 'upi_lite', amount: 0.10 },
    ];
    const b = buildWBal({ wallets, wsb, inc, ex: [], tr: [], stl: [] });
    expect(b.upi_lite).toBe(3.24);
    // The settle balance check after the fix: roundMoney(b) >= amount.
    const amount = roundMoney(3.24);
    expect(b.upi_lite >= amount).toBe(true);
  });

  it('handles 100 random sub-paisa-amplitude transactions without drift', () => {
    // Use amounts that we know are not exactly representable in binary.
    const txs = [];
    for (let i = 0; i < 100; i++) txs.push({ walletId: 'bank', amount: 0.10 });
    const b = buildWBal({ wallets, wsb: {}, inc: txs, ex: [], tr: [], stl: [] });
    expect(b.bank).toBe(10);
  });

  it('settlements net out exactly when paying back the same amount received', () => {
    const wsb = { bank: 100 };
    const stl = [
      { walletId: 'bank', direction: 'owed', amount: 3.24 },
      { walletId: 'bank', direction: 'owe', amount: 3.24 },
    ];
    const b = buildWBal({ wallets, wsb, inc: [], ex: [], tr: [], stl });
    expect(b.bank).toBe(100);
  });

  it('expense brings UPI Lite to exactly zero when the balance equals the spend', () => {
    const wsb = {};
    const inc = [{ walletId: 'upi_lite', amount: 3.24 }];
    const ex = [{ walletId: 'upi_lite', amount: 3.24 }];
    const b = buildWBal({ wallets, wsb, inc, ex, tr: [], stl: [] });
    expect(b.upi_lite).toBe(0);
  });

  it('UPI Lite cap comparison is drift-free after rounding day sum', () => {
    // Sum of micro-transactions just under the daily cap.
    const ex = [];
    for (let i = 0; i < 50; i++) ex.push({ walletId: 'upi_lite', date: '2026-05-19', amount: 99.98 });
    const daySum = roundMoney(ex.reduce((s, e) => s + e.amount, 0));
    expect(daySum).toBe(4999);
    // Adding one paisa keeps us under the cap with no drift artifact.
    expect(roundMoney(daySum + 0.01)).toBe(4999.01);
    expect(roundMoney(daySum + 0.01) > 5000).toBe(false);
  });
});
