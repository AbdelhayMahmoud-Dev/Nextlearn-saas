'use client';

/**
 * Client-side referral attribution. The affiliate code arrives as `?ref=CODE`,
 * is persisted to localStorage, and is attached to the next enrollment/checkout.
 */
const KEY = 'nl_ref';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day attribution window

interface StoredRef {
  code: string;
  ts: number;
}

/** Persists a referral code (called by ReferralCapture on landing). */
export function storeReferralCode(code: string): void {
  if (typeof window === 'undefined' || !code) return;
  try {
    const payload: StoredRef = { code: code.toUpperCase(), ts: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

/** Returns the active referral code, or undefined if absent/expired. */
export function getReferralCode(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed.code || Date.now() - parsed.ts > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return undefined;
    }
    return parsed.code;
  } catch {
    return undefined;
  }
}

/** Clears the stored referral code (after a successful conversion). */
export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
