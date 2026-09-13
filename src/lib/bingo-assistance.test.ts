import { describe, expect, test } from 'bun:test';
import { FREE_CELL } from '@/types/bingo';
import { countUnmarkedCalledNumbers } from './bingo-assistance';

describe('bingo number assistance', () => {
  const card = [
    [7, 11, FREE_CELL],
    [24, 31, 42],
    [50, 60, 70],
  ];

  test('counts called card numbers that are still unmarked', () => {
    const marked = [
      [false, true, true],
      [false, false, false],
      [false, false, false],
    ];

    expect(countUnmarkedCalledNumbers(card, marked, [7, 11, 42, 99], 'classic')).toBe(2);
  });

  test('does not count the free cell as pending assistance', () => {
    const marked = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];

    expect(countUnmarkedCalledNumbers(card, marked, [FREE_CELL], 'classic')).toBe(0);
  });

  test('counts unmarked numbers from called decades in tens mode', () => {
    const marked = [
      [false, false, true],
      [false, false, false],
      [false, false, false],
    ];

    expect(countUnmarkedCalledNumbers(card, marked, [0, 20], 'tens')).toBe(2);
  });
});
