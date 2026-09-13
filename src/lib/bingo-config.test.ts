import { describe, expect, test } from 'bun:test';
import {
  AUTO_ADVANCE_MAX_SECONDS,
  AUTO_ADVANCE_MIN_SECONDS,
  clampAutoAdvanceSeconds,
  clampNumberValue,
  getExpectedCallCount,
} from './bingo-config';

describe('bingo configuration helpers', () => {
  test('clamps unattended mode intervals to the supported range', () => {
    expect(clampAutoAdvanceSeconds(0)).toBe(AUTO_ADVANCE_MIN_SECONDS);
    expect(clampAutoAdvanceSeconds(30)).toBe(30);
    expect(clampAutoAdvanceSeconds(240)).toBe(AUTO_ADVANCE_MAX_SECONDS);
  });

  test('clamps number input values to the supported range', () => {
    expect(clampNumberValue(-4)).toBe(0);
    expect(clampNumberValue(10000)).toBe(10000);
    expect(clampNumberValue(10001)).toBe(10000);
  });

  test('counts every number available in classic mode', () => {
    expect(getExpectedCallCount('classic', [0, 100])).toBe(101);
  });

  test('counts only valid parity numbers', () => {
    expect(getExpectedCallCount('even', [0, 10])).toBe(6);
    expect(getExpectedCallCount('odd', [0, 10])).toBe(5);
  });

  test('counts unique decades in tens mode', () => {
    expect(getExpectedCallCount('tens', [5, 15])).toBe(2);
  });
});
