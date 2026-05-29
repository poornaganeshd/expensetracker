import { describe, it, expect } from 'vitest';
import { redactText, redactTransactions } from '../redactor.js';

// ---------------------------------------------------------------------------
// redactText
// ---------------------------------------------------------------------------
describe('redactText — PAN', () => {
  it('redacts a standalone PAN number', () => {
    expect(redactText('My PAN is ABCDE1234F ok')).toBe('My PAN is [PAN] ok');
  });

  it('does not redact a 9-char sequence that is not PAN format', () => {
    const result = redactText('ref ABC123');
    expect(result).not.toContain('[PAN]');
  });
});

describe('redactText — Aadhaar', () => {
  it('redacts a space-separated Aadhaar', () => {
    expect(redactText('Aadhaar: 1234 5678 9012')).toContain('[AADHAAR]');
  });

  it('redacts a hyphen-separated Aadhaar', () => {
    expect(redactText('id: 1234-5678-9012')).toContain('[AADHAAR]');
  });

  it('does not redact an INR amount like ₹5000', () => {
    expect(redactText('paid ₹5000 today')).toBe('paid ₹5000 today');
  });
});

describe('redactText — credit/debit card', () => {
  it('redacts a hyphen-grouped 16-digit card as [CARD]', () => {
    const result = redactText('Card 1234-5678-9012-3456 used');
    expect(result).toContain('[CARD]');
    expect(result).not.toContain('1234');
    expect(result).not.toContain('3456');
  });

  it('redacts a space-grouped 16-digit card fully (no last group leak)', () => {
    // Regression: the 12-digit Aadhaar rule used to fire first and consume the
    // first 3 groups, leaving the final 4 digits in plaintext.
    const result = redactText('paid 4111 1111 1111 1111 to John Smith');
    expect(result).toContain('[CARD]');
    expect(result).not.toMatch(/\d/);
  });

  it('does not leave raw 16-digit card number in output', () => {
    const result = redactText('1234 5678 9012 3456');
    expect(result).not.toMatch(/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/);
    expect(result).not.toContain('3456');
  });
});

describe('redactText — bank account', () => {
  // Use 9-digit number: long enough for Account pattern but below Aadhaar's 12.
  it('redacts a 9-digit account number', () => {
    expect(redactText('Account 123456789')).toContain('[ACCOUNT]');
  });

  // 13-digit number: too long for Aadhaar (exactly 12), caught by Account.
  it('redacts a 13-digit account number', () => {
    expect(redactText('acct 1234567890123')).toContain('[ACCOUNT]');
  });

  it('does not redact a 7-digit number (below threshold)', () => {
    const result = redactText('ref 1234567');
    expect(result).not.toContain('[ACCOUNT]');
  });
});

describe('redactText — UPI', () => {
  it('redacts okaxis UPI', () => {
    expect(redactText('pay to john@okaxis')).toContain('[UPI]');
  });

  it('redacts paytm UPI', () => {
    expect(redactText('john@paytm')).toContain('[UPI]');
  });

  it('does not redact a generic @domain email as UPI', () => {
    const result = redactText('user@gmail.com');
    expect(result).not.toContain('[UPI]');
  });
});

describe('redactText — email', () => {
  it('redacts a standard email', () => {
    expect(redactText('Contact user@example.com now')).toContain('[EMAIL]');
  });

  it('leaves the rest of the string intact', () => {
    const result = redactText('hi user@example.com bye');
    expect(result).toBe('hi [EMAIL] bye');
  });
});

describe('redactText — phone', () => {
  // Account pattern (9-18 digits) runs before Phone in the pattern list, so a
  // standalone 10-digit mobile number gets tagged as [ACCOUNT], not [PHONE].
  // The important property is that the raw number is not present in the output.
  it('removes 10-digit mobile number from output', () => {
    const result = redactText('Call 9876543210 now');
    expect(result).not.toContain('9876543210');
  });

  it('removes 10-digit number starting with 6 from output', () => {
    const result = redactText('num 6123456789');
    expect(result).not.toContain('6123456789');
  });

  it('does not redact a 5-digit short number', () => {
    const result = redactText('pin 12345');
    expect(result).toBe('pin 12345');
  });
});

describe('redactText — names', () => {
  it('redacts Title Case name after "paid"', () => {
    const result = redactText('paid Rahul Sharma for lunch');
    expect(result).toContain('[NAME]');
    expect(result).not.toContain('Rahul');
    expect(result).not.toContain('Sharma');
  });

  it('redacts name after "sent to"', () => {
    const result = redactText('sent to Priya Mehta today');
    expect(result).toContain('[NAME]');
  });

  it('does not redact lower-case words', () => {
    expect(redactText('paid for lunch today')).not.toContain('[NAME]');
  });
});

describe('redactText — edge cases', () => {
  it('returns null unchanged', () => {
    expect(redactText(null)).toBeNull();
  });

  it('returns undefined unchanged', () => {
    expect(redactText(undefined)).toBeUndefined();
  });

  it('returns a number unchanged', () => {
    expect(redactText(42)).toBe(42);
  });

  it('returns empty string as-is', () => {
    expect(redactText('')).toBe('');
  });

  it('gives identical results on repeated calls (no stale lastIndex)', () => {
    const input = 'user@example.com and 9876543210';
    const first  = redactText(input);
    const second = redactText(input);
    const third  = redactText(input);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('does not redact plain INR amounts like 12000', () => {
    expect(redactText('spent 12000 on rent')).toBe('spent 12000 on rent');
  });
});

// ---------------------------------------------------------------------------
// redactTransactions
// ---------------------------------------------------------------------------
describe('redactTransactions', () => {
  it('returns [] for null', () => {
    expect(redactTransactions(null)).toEqual([]);
  });

  it('returns [] for a non-array string', () => {
    expect(redactTransactions('oops')).toEqual([]);
  });

  it('strips id, receipt_url, and deleted_at', () => {
    const [r] = redactTransactions([{
      id: 'abc123',
      date: '2026-05-01',
      amount: 500,
      type: 'expense',
      categoryId: 'food',
      walletId: 'bank',
      note: 'lunch',
      receipt_url: 'https://cloudinary.com/img.jpg',
      deleted_at: null,
    }]);
    expect(r).not.toHaveProperty('id');
    expect(r).not.toHaveProperty('receipt_url');
    expect(r).not.toHaveProperty('deleted_at');
  });

  it('keeps date, amount, type, categoryId, walletId, sourceId', () => {
    const [r] = redactTransactions([{
      date: '2026-05-01',
      amount: 999,
      type: 'income',
      categoryId: null,
      sourceId: 'salary',
      walletId: 'bank',
      note: '',
    }]);
    expect(r.date).toBe('2026-05-01');
    expect(r.amount).toBe(999);
    expect(r.type).toBe('income');
    expect(r.sourceId).toBe('salary');
    expect(r.walletId).toBe('bank');
  });

  it('redacts PII in note', () => {
    const [r] = redactTransactions([{
      date: '2026-05-01',
      amount: 100,
      note: 'sent to user@example.com',
    }]);
    expect(r.note).toContain('[EMAIL]');
    expect(r.note).not.toContain('user@example.com');
  });

  it('handles missing note with empty string', () => {
    const [r] = redactTransactions([{ date: '2026-05-01', amount: 50 }]);
    expect(r.note).toBe('');
  });

  it('processes multiple transactions', () => {
    const result = redactTransactions([
      { date: '2026-05-01', amount: 100, note: 'a' },
      { date: '2026-05-02', amount: 200, note: 'b' },
    ]);
    expect(result).toHaveLength(2);
  });
});
