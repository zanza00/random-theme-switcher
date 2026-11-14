import { describe, it, expect } from 'vitest';
import { localDateKey, shouldSwitchDaily } from './daily';

describe('localDateKey', () => {
  it('zero-pads month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('formats a date with two-digit month and day', () => {
    expect(localDateKey(new Date(2026, 11, 31, 12))).toBe('2026-12-31');
  });

  it('uses local calendar fields regardless of time of day', () => {
    expect(localDateKey(new Date(2026, 6, 9, 0, 0, 0))).toBe('2026-07-09');
    expect(localDateKey(new Date(2026, 6, 9, 23, 59, 59))).toBe('2026-07-09');
  });
});

describe('shouldSwitchDaily', () => {
  it('returns true when no previous date is stored', () => {
    expect(shouldSwitchDaily(undefined, new Date(2026, 0, 5, 12))).toBe(true);
  });

  it('returns false when the stored date matches today', () => {
    const now = new Date(2026, 0, 5, 12);
    expect(shouldSwitchDaily('2026-01-05', now)).toBe(false);
  });

  it('returns true when the stored date is different', () => {
    const now = new Date(2026, 0, 5, 12);
    expect(shouldSwitchDaily('2026-01-04', now)).toBe(true);
  });

  it('compares against the local date of the provided instant', () => {
    const now = new Date(2026, 0, 5, 12);
    expect(shouldSwitchDaily(localDateKey(now), now)).toBe(false);
  });
});
