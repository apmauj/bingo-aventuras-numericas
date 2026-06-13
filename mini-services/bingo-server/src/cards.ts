// ============================================================
// Card generation for Bingo Aventuras Numéricas
// ============================================================

import type { GameConfig, GameMode } from './types';
import { FREE_CELL } from './types';

/**
 * Calculate how many unique numbers are needed for a card.
 * If freeCell is true (and gridSize is odd for center placement), one cell is reserved for ⭐.
 */
function getNumbersNeeded(gridSize: number, freeCell: boolean): number {
  const hasFreeCell = freeCell && gridSize % 2 === 1;
  return hasFreeCell ? gridSize * gridSize - 1 : gridSize * gridSize;
}

/**
 * Get the pool of valid numbers for a given mode and range.
 */
function getNumberPool(mode: GameMode, numberRange: [number, number]): number[] {
  const [min, max] = numberRange;
  const pool: number[] = [];
  for (let i = min; i <= max; i++) {
    if (mode === 'even' && i % 2 !== 0) continue; // skip odd numbers
    if (mode === 'odd' && i % 2 !== 1) continue;  // skip even numbers
    pool.push(i);
  }
  return pool;
}

/**
 * Generate random numbers from a pool (classic, even, odd modes).
 * Fisher-Yates shuffle on the pool, take first N.
 */
function generateRandomNumbers(count: number, numberRange: [number, number], mode: GameMode = 'classic'): number[] {
  const pool = getNumberPool(mode, numberRange);

  if (pool.length < count) {
    const modeDesc = mode === 'even' ? 'PARES' : mode === 'odd' ? 'IMPARES' : '';
    throw new Error(
      `NO HAY SUFICIENTES NÚMEROS ${modeDesc} EN EL RANGO [${numberRange[0]}, ${numberRange[1]}] PARA UN CARTÓN (NECESITA ${count}, HAY ${pool.length})`
    );
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Generate numbers distributed across thirds of the range (comparison mode).
 * This ensures interesting comparisons: some numbers low, some mid, some high.
 */
function generateComparisonNumbers(count: number, numberRange: [number, number]): number[] {
  const [min, max] = numberRange;
  const range = max - min + 1;

  // Divide range into three segments
  const segmentSize = Math.floor(range / 3);
  const segments = [
    { min: min, max: min + segmentSize - 1 },
    { min: min + segmentSize, max: min + 2 * segmentSize - 1 },
    { min: min + 2 * segmentSize, max: max },
  ];

  const selected: number[] = [];
  const usedNumbers = new Set<number>();
  const perSegment = Math.ceil(count / 3);

  for (const seg of segments) {
    // Collect available numbers in this segment
    const segNumbers: number[] = [];
    for (let n = seg.min; n <= seg.max; n++) {
      if (!usedNumbers.has(n)) segNumbers.push(n);
    }
    // Shuffle segment numbers
    for (let i = segNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [segNumbers[i], segNumbers[j]] = [segNumbers[j], segNumbers[i]];
    }
    // Take up to perSegment numbers
    const take = Math.min(perSegment, segNumbers.length);
    for (let i = 0; i < take && selected.length < count; i++) {
      selected.push(segNumbers[i]);
      usedNumbers.add(segNumbers[i]);
    }
  }

  // If we still need more numbers, fill randomly from the full range
  if (selected.length < count) {
    const remaining: number[] = [];
    for (let n = min; n <= max; n++) {
      if (!usedNumbers.has(n)) remaining.push(n);
    }
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    while (selected.length < count) {
      const num = remaining.shift()!;
      selected.push(num);
      usedNumbers.add(num);
    }
  }

  // Final shuffle so numbers aren't grouped by segment on the card
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * Generate a unique bingo card (gridSize x gridSize) with random numbers
 * within the configured range. No duplicates within a single card.
 * If freeCell is true and gridSize is odd, the center cell is ⭐ (FREE_CELL).
 * Mode-specific number generation: classic (any), comparison (thirds),
 * even (only even numbers), odd (only odd numbers), tens/sequence (any).
 */
export function generateCard(config: GameConfig, mode: GameMode = 'classic'): number[][] {
  const { gridSize, numberRange, freeCell } = config;
  const [min, max] = numberRange;
  const hasFreeCell = freeCell && gridSize % 2 === 1;
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);
  const totalCells = getNumbersNeeded(gridSize, freeCell);

  // Validate range size
  const pool = getNumberPool(mode, numberRange);
  if (pool.length < totalCells) {
    const modeDesc = mode === 'even' ? ' PARES' : mode === 'odd' ? ' IMPARES' : '';
    throw new Error(
      `EL RANGO [${min}, ${max}]${modeDesc} ES MUY CHICO PARA UN CARTÓN DE ${gridSize}×${gridSize} (NECESITA ${totalCells} NÚMEROS ÚNICOS, HAY ${pool.length})`
    );
  }

  // Generate numbers based on mode
  const selected = mode === 'comparison'
    ? generateComparisonNumbers(totalCells, numberRange)
    : generateRandomNumbers(totalCells, numberRange, mode);

  // Build the card grid, placing FREE_CELL at center for odd grids
  const card: number[][] = [];
  let numIdx = 0;
  for (let row = 0; row < gridSize; row++) {
    const rowNumbers: number[] = [];
    for (let col = 0; col < gridSize; col++) {
      if (hasFreeCell && row === centerRow && col === centerCol) {
        rowNumbers.push(FREE_CELL);
      } else {
        rowNumbers.push(selected[numIdx++]);
      }
    }
    card.push(rowNumbers);
  }

  return card;
}

/**
 * Create a fresh marked grid (all false).
 * If freeCell is true and gridSize is odd, the center cell is pre-marked as true (⭐ cell).
 */
export function createMarkedGrid(gridSize: number, freeCell: boolean = true): boolean[][] {
  const hasFreeCell = freeCell && gridSize % 2 === 1;
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);

  const marked: boolean[][] = [];
  for (let row = 0; row < gridSize; row++) {
    const rowArr: boolean[] = [];
    for (let col = 0; col < gridSize; col++) {
      rowArr.push(hasFreeCell && row === centerRow && col === centerCol);
    }
    marked.push(rowArr);
  }
  return marked;
}

/**
 * Check if a number exists anywhere on the card.
 * Returns the [row, col] position or null.
 * FREE_CELL (-1) will never match any called number.
 */
export function findNumberOnCard(card: number[][], number: number): [number, number] | null {
  for (let row = 0; row < card.length; row++) {
    for (let col = 0; col < card[row].length; col++) {
      if (card[row][col] === number) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Calculate the minimum range size needed for a given grid size and mode.
 * Used by the frontend for validation.
 */
export function getMinRangeSize(gridSize: number, mode: GameMode, freeCell: boolean = true): number {
  const numbersNeeded = getNumbersNeeded(gridSize, freeCell);
  // For even/odd, we need roughly 2x the range to have enough numbers
  // since roughly half the numbers in any range are even/odd
  if (mode === 'even' || mode === 'odd') {
    // We need numbersNeeded even or odd numbers
    // In a range of size R starting from 0, there are ~R/2 even and ~R/2 odd numbers
    // So we need a range at least ~2*numbersNeeded
    return numbersNeeded * 2 - 1;
  }
  return numbersNeeded;
}
