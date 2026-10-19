import { describe, expect, it } from 'vitest';
import { isMinuteTickDue } from './useObserverContext';

describe('isMinuteTickDue (F3.1 visibility/minute gate)', () => {
  it('fires when the minute flips', () => {
    expect(isMinuteTickDue(60_000, 0, 'visible')).toBe(true);
  });

  it('does not fire twice within the same minute', () => {
    expect(isMinuteTickDue(59_999, 0, 'visible')).toBe(false);
  });

  it('skips ticks while the document is hidden', () => {
    expect(isMinuteTickDue(60_000, 0, 'hidden')).toBe(false);
  });

  it('treats a missing document (node/SSR) as visible', () => {
    expect(isMinuteTickDue(60_000, 0, undefined)).toBe(true);
  });
});
