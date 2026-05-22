import { describe, it, expect, beforeEach } from 'vitest';
import { getCredentials, saveCredentials, clearCredentials, isLocalMode } from '../credentials.js';

beforeEach(() => {
  localStorage.clear();
});

const KEY = 'nomad-credentials';

describe('getCredentials', () => {
  it('returns empty object when nothing is stored', () => {
    expect(getCredentials()).toEqual({});
  });

  it('returns the stored credentials object', () => {
    const creds = { sbUrl: 'https://example.supabase.co', sbKey: 'anon-key-123' };
    localStorage.setItem(KEY, JSON.stringify(creds));
    expect(getCredentials()).toEqual(creds);
  });

  it('returns empty object when stored value is invalid JSON', () => {
    localStorage.setItem(KEY, 'not-valid-json{{');
    expect(getCredentials()).toEqual({});
  });

  it('returns partial credentials correctly', () => {
    localStorage.setItem(KEY, JSON.stringify({ sbUrl: 'https://x.supabase.co' }));
    expect(getCredentials()).toEqual({ sbUrl: 'https://x.supabase.co' });
  });
});

describe('saveCredentials', () => {
  it('persists credentials to localStorage', () => {
    const creds = { sbUrl: 'https://test.supabase.co', sbKey: 'key-abc' };
    saveCredentials(creds);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(creds);
  });

  it('overwrites previously saved credentials', () => {
    saveCredentials({ sbUrl: 'old-url', sbKey: 'old-key' });
    saveCredentials({ sbUrl: 'new-url', sbKey: 'new-key' });
    expect(getCredentials()).toEqual({ sbUrl: 'new-url', sbKey: 'new-key' });
  });
});

describe('clearCredentials', () => {
  it('removes the credentials entry from localStorage', () => {
    saveCredentials({ sbUrl: 'https://x.supabase.co', sbKey: 'key' });
    clearCredentials();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('does not throw when there are no credentials to clear', () => {
    expect(() => clearCredentials()).not.toThrow();
  });

  it('causes getCredentials to return empty object after clearing', () => {
    saveCredentials({ sbUrl: 'https://x.supabase.co', sbKey: 'key' });
    clearCredentials();
    expect(getCredentials()).toEqual({});
  });
});

describe('isLocalMode', () => {
  it('returns true when creds are undefined', () => {
    expect(isLocalMode(undefined)).toBe(true);
  });

  it('returns true when creds are null', () => {
    expect(isLocalMode(null)).toBe(true);
  });

  it('returns true for empty creds object', () => {
    expect(isLocalMode({})).toBe(true);
  });

  it('returns true when sbUrl is empty string', () => {
    expect(isLocalMode({ sbUrl: '', sbKey: 'key' })).toBe(true);
  });

  it('returns true when sbUrl missing but other fields present', () => {
    expect(isLocalMode({ cloudName: 'foo', apiKey: 'bar' })).toBe(true);
  });

  it('returns false when sbUrl is a valid Supabase URL', () => {
    expect(isLocalMode({ sbUrl: 'https://abc.supabase.co', sbKey: 'k' })).toBe(false);
  });

  it('returns true when sbKey missing (matches SB_ENABLED semantics)', () => {
    expect(isLocalMode({ sbUrl: 'https://x.supabase.co' })).toBe(true);
  });

  it('returns true when sbKey is empty string', () => {
    expect(isLocalMode({ sbUrl: 'https://x.supabase.co', sbKey: '' })).toBe(true);
  });
});
