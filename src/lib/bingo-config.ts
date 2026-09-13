import type { GameMode } from '../types/bingo';

export const AUTO_ADVANCE_MIN_SECONDS = 1;
export const AUTO_ADVANCE_MAX_SECONDS = 180;
export const DEFAULT_AUTO_ADVANCE_SECONDS = 30;
export const MAX_NUMBER_VALUE = 10_000;

export function clampAutoAdvanceSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AUTO_ADVANCE_SECONDS;
  return Math.min(AUTO_ADVANCE_MAX_SECONDS, Math.max(AUTO_ADVANCE_MIN_SECONDS, Math.round(value)));
}

export function clampNumberValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_NUMBER_VALUE, Math.max(0, Math.trunc(value)));
}

export function getExpectedCallCount(mode: GameMode, numberRange: [number, number]): number {
  const [min, max] = numberRange;

  if (mode === 'tens') {
    const decades = new Set<number>();
    for (let number = min; number <= max; number++) {
      decades.add(Math.floor(number / 10) * 10);
    }
    return decades.size;
  }

  if (mode === 'even' || mode === 'odd') {
    let count = 0;
    for (let number = min; number <= max; number++) {
      if (mode === 'even' ? number % 2 === 0 : number % 2 !== 0) count++;
    }
    return count;
  }

  return Math.max(0, max - min + 1);
}
