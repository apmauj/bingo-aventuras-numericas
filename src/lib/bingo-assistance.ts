import type { GameMode } from '@/types/bingo';

export function countUnmarkedCalledNumbers(
  card: number[][],
  marked: boolean[][],
  calledNumbers: number[],
  mode: GameMode,
): number {
  const calledSet = new Set(calledNumbers);
  let count = 0;

  for (let row = 0; row < card.length; row++) {
    for (let col = 0; col < card[row].length; col++) {
      const number = card[row][col];
      if (number < 0 || marked[row]?.[col]) continue;

      const called = mode === 'tens'
        ? calledSet.has(Math.floor(number / 10) * 10)
        : calledSet.has(number);

      if (called) count++;
    }
  }

  return count;
}
