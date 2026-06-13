// ============================================================
// Game logic for Bingo Aventuras Numéricas
// ============================================================

import type { Room, Player, LineType, LineCompletedPayload, BingoPayload, SelectionResultPayload, SequenceResultPayload, ComparisonResultPayload, ComparisonOperator, SequenceType } from './types';
import { findNumberOnCard } from './cards';

// ---- Pedagogical error messages (constructive, never negative) ----

const ENCOURAGING_MESSAGES = [
  '¡SIGAMOS BUSCANDO! TODAVÍA NO APARECIÓ ESE NÚMERO.',
  '¡BUENA OBSERVACIÓN! ESE NÚMERO AÚN ESTÁ ESPERANDO SU TURNO.',
  'PIPO DICE: OBSERVEMOS JUNTOS LA CARTELERA.',
  '¡CASI! ESE NÚMERO TODAVÍA NO FUE LLAMADO. ¡SEGUÍ PARTICIPANDO!',
  '¡NO TE PREOCUPES! SEGUÍ ATENTO A LOS NÚMEROS QUE VAN SALIENDO.',
  'PIPO DICE: ¡VAMOS A BUSCAR JUNTOS EL NÚMERO CORRECTO!',
  '¡BUEN INTENTO! ESPEREMOS A QUE APAREZCA ESE NUMERITO.',
  '¡ESTÁS MUY ATENTO! PERO ESE NÚMERO AÚN NO SALIÓ. ¡SEGUÍ JUGANDO!',
];

// ---- Success messages (celebratory, motivating) ----

const SUCCESS_MESSAGES = [
  '¡MUY BIEN! ¡ENCONTRASTE EL NÚMERO!',
  '¡EXCELENTE! ¡ASÍ SE HACE!',
  '¡GENIAL! ¡SEGUÍ ASÍ!',
  '¡BRAVO! ¡OJO DE LYNX!',
  '¡FANTÁSTICO! ¡CADA VEZ MEJOR!',
  '¡MUY BIEN! ¡PIPO ESTÁ ORGULLOSO!',
  '¡INCREÍBLE! ¡VAS SOBRE RUEDAS!',
  '¡SÚPER! ¡NO SE TE ESCAPA NINGUNO!',
];

// ---- Line completion messages ----

const LINE_MESSAGES = [
  '¡LÍNEA COMPLETADA! ¡SOS UN CAMPEÓN!',
  '¡INCREÍBLE! ¡TODA UNA LÍNEA!',
  '¡ESPECTACULAR! ¡UNA LÍNEA ENTERA!',
  '¡FENÓMENO! ¡LÍNEA LOGRADA!',
  '¡LO LOGRASTE! ¡PIPO SALTA DE ALEGRÍA!',
];

/**
 * Get a random encouraging message (constructive, never negative).
 */
export function getEncouragingMessage(): string {
  const idx = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
  return ENCOURAGING_MESSAGES[idx];
}

/**
 * Get a random success message (celebratory, motivating).
 */
export function getSuccessMessage(): string {
  const idx = Math.floor(Math.random() * SUCCESS_MESSAGES.length);
  return SUCCESS_MESSAGES[idx];
}

/**
 * Get a random line completion message (triumphant).
 */
export function getLineMessage(): string {
  const idx = Math.floor(Math.random() * LINE_MESSAGES.length);
  return LINE_MESSAGES[idx];
}

/**
 * Check if a number is valid for the given game mode.
 * Classic, comparison, tens, sequence: all numbers valid
 * Even: only even numbers
 * Odd: only odd numbers
 */
function isNumberValidForMode(number: number, mode: string): boolean {
  if (mode === 'even') return number % 2 === 0;
  if (mode === 'odd') return number % 2 === 1;
  return true; // classic, comparison, tens, sequence — all numbers valid
}

// ---- Number generation ----

/**
 * Generate the next random number for a room.
 * Respects game mode:
 * - Classic/comparison/even/odd/sequence: pick a random uncalled number
 * - Tens: pick a random uncalled decade (stores decade start in calledNumbers)
 * Returns the number (or decade start for tens) or null if all valid numbers have been called.
 */
export function generateNextNumber(room: Room): number | null {
  const [min, max] = room.config.numberRange;

  // Build set of already-called numbers for fast lookup
  const calledSet = new Set(room.calledNumbers);

  // TENS MODE: pick a random decade instead of a specific number
  if (room.mode === 'tens') {
    // Collect all decades in the range that haven't been called yet
    const decades = new Set<number>();
    for (let n = min; n <= max; n++) {
      const decade = Math.floor(n / 10) * 10;
      if (!calledSet.has(decade)) {
        decades.add(decade);
      }
    }
    const availableDecades = Array.from(decades);
    if (availableDecades.length === 0) return null;

    const chosenDecade = availableDecades[Math.floor(Math.random() * availableDecades.length)];
    room.calledNumbers.push(chosenDecade);
    room.currentNumber = chosenDecade;
    return chosenDecade;
  }

  // All other modes: collect available numbers that are valid for this mode
  const available: number[] = [];
  for (let n = min; n <= max; n++) {
    if (!calledSet.has(n) && isNumberValidForMode(n, room.mode)) {
      available.push(n);
    }
  }

  // All valid numbers have been called
  if (available.length === 0) {
    return null;
  }

  // Pick a random one
  const chosen = available[Math.floor(Math.random() * available.length)];
  room.calledNumbers.push(chosen);
  room.currentNumber = chosen;

  return chosen;
}

// ---- Comparison mode ----

/**
 * Generate a comparison target and operator for the called number.
 * The comparison is always TRUE — the student verifies the relationship
 * before marking the number on their card.
 */
export function generateComparisonTarget(
  calledNumber: number,
  numberRange: [number, number]
): { target: number; operator: ComparisonOperator } {
  const [min, max] = numberRange;

  // ~20% chance of '=' operator (same number)
  const roll = Math.random();
  if (roll < 0.2) {
    return { target: calledNumber, operator: '=' };
  }

  // For '>', we need a target smaller than calledNumber
  // For '<', we need a target larger than calledNumber
  const canGoGreater = calledNumber > min;
  const canGoLess = calledNumber < max;

  let operator: ComparisonOperator;
  if (canGoGreater && canGoLess) {
    operator = Math.random() < 0.5 ? '>' : '<';
  } else if (canGoGreater) {
    operator = '>';
  } else if (canGoLess) {
    operator = '<';
  } else {
    return { target: calledNumber, operator: '=' };
  }

  let target: number;
  if (operator === '>') {
    const possibleTargets: number[] = [];
    for (let n = min; n < calledNumber; n++) {
      possibleTargets.push(n);
    }
    target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
  } else {
    const possibleTargets: number[] = [];
    for (let n = calledNumber + 1; n <= max; n++) {
      possibleTargets.push(n);
    }
    target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
  }

  return { target, operator };
}

// ---- Sequence mode ----

/**
 * Generate a sequence prompt for the called number.
 * Variant A: "¿What comes AFTER X?" or "¿What comes BEFORE X?"
 * The answer is always the called number N.
 * - After: prompt = N - 1, display "¿QUÉ VIENE DESPUÉS DE {N-1}?"
 * - Before: prompt = N + 1, display "¿QUÉ VIENE ANTES DE {N+1}?"
 * The answer is always correct by construction.
 */
export function generateSequenceTarget(
  calledNumber: number,
  numberRange: [number, number]
): { type: SequenceType; prompt: number } {
  const [min, max] = numberRange;

  // Can we ask "after" (need N-1 to exist in range)?
  const canAskAfter = calledNumber > min;
  // Can we ask "before" (need N+1 to exist in range)?
  const canAskBefore = calledNumber < max;

  let type: SequenceType;
  if (canAskAfter && canAskBefore) {
    type = Math.random() < 0.5 ? 'after' : 'before';
  } else if (canAskAfter) {
    type = 'after';
  } else if (canAskBefore) {
    type = 'before';
  } else {
    // Only one number in range — shouldn't happen with proper validation
    type = 'after';
  }

  const prompt = type === 'after' ? calledNumber - 1 : calledNumber + 1;
  return { type, prompt };
}

export function generateSequenceOptions(
  correctAnswer: number,
  numberRange: [number, number]
): number[] {
  const [min, max] = numberRange;
  const options = new Set<number>([correctAnswer]);

  for (let offset = 1; offset <= 10 && options.size < 3; offset++) {
    const lower = correctAnswer - offset;
    const upper = correctAnswer + offset;
    const tryLowerFirst = Math.random() < 0.5;
    const candidates = tryLowerFirst ? [lower, upper] : [upper, lower];

    for (const candidate of candidates) {
      if (options.size >= 3) break;
      if (candidate >= min && candidate <= max && !options.has(candidate)) {
        options.add(candidate);
      }
    }
  }

  if (options.size < 3) {
    for (let n = min; n <= max && options.size < 3; n++) {
      if (!options.has(n)) options.add(n);
    }
  }

  const arr = Array.from(options);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

const SEQUENCE_POINTS = [10, 8, 5];

// ---- Comparison mode point tiers ----
const COMPARISON_POINTS = [10, 5]; // 1st try: 10, 2nd+ try: 5

/**
 * Validate a student's SI/NO answer to the comparison question.
 * The comparison is always TRUE by construction, so the correct answer is always SÍ (true).
 * Tracks attempts per player per round and awards variable points.
 * 1st correct: 10 pts, 2nd+: 5 pts
 */
export function validateComparisonAnswer(
  room: Room,
  player: Player,
  answer: boolean
): ComparisonResultPayload {
  // Determine correct answer from the stored comparison prompt
  const number = room.currentNumber;
  const target = room.currentComparisonTarget;
  const operator = room.currentComparisonOperator;

  let correctAnswer: boolean = true; // fallback
  if (number === null || target === undefined || operator === undefined) {
    // If prompt missing, assume true to avoid penalizing — but log would be helpful
    correctAnswer = true;
  } else {
    if (operator === '>') correctAnswer = number > target;
    else if (operator === '<') correctAnswer = number < target;
    else correctAnswer = number === target;
  }

  // Track attempts
  const currentAttempts = (room.comparisonAttempts.get(player.id) || 0) + 1;
  room.comparisonAttempts.set(player.id, currentAttempts);

  if (answer !== correctAnswer) {
    // Wrong answer — encourage to try again
    return {
      correct: false,
      points: 0,
      attempts: currentAttempts,
      message: '¡NO ES ESO! ¡PENSÁ DE NUEVO! 🤔',
      totalScore: player.score,
    };
  }

  // Correct answer! Award variable points based on attempts
  const points = currentAttempts <= COMPARISON_POINTS.length
    ? COMPARISON_POINTS[currentAttempts - 1]
    : COMPARISON_POINTS[COMPARISON_POINTS.length - 1]; // 5 pts for 2nd+ attempt

  player.score += points;
  room.comparisonAnswered.add(player.id);

  const calledNumber = room.currentNumber;
  return {
    correct: true,
    points,
    attempts: currentAttempts,
    message: `¡CORRECTO! +${points} PTS 🎉 ¡BUSCÁ EL ${calledNumber} EN TU TABLERO!`,
    correctAnswer: correctAnswer,
    totalScore: player.score,
  };
}

export function validateSequenceAnswer(
  room: Room,
  player: Player,
  answer: number
): SequenceResultPayload {
  const correctAnswer = room.currentNumber;

  if (correctAnswer === null) {
    return {
      correct: false,
      points: 0,
      attempts: 0,
      message: 'NO HAY NÚMERO ACTUAL. ¡ESPERÁ QUE EL DOCENTE LLAME UN NÚMERO!',
      totalScore: player.score,
    };
  }

  const currentAttempts = (room.sequenceAttempts.get(player.id) || 0) + 1;
  room.sequenceAttempts.set(player.id, currentAttempts);

  if (answer !== correctAnswer) {
    return {
      correct: false,
      points: 0,
      attempts: currentAttempts,
      message: '¡NO ES ESE! ¡INTENTÁ DE NUEVO! 🤔',
      totalScore: player.score,
    };
  }

  const points = currentAttempts <= SEQUENCE_POINTS.length
    ? SEQUENCE_POINTS[currentAttempts - 1]
    : SEQUENCE_POINTS[SEQUENCE_POINTS.length - 1];

  player.score += points;
  room.sequenceAnswered.add(player.id);

  return {
    correct: true,
    points,
    attempts: currentAttempts,
    message: `¡CORRECTO! +${points} PTS 🎉 ¡BUSCÁ EL ${correctAnswer} EN TU TABLERO!`,
    correctAnswer,
    totalScore: player.score,
  };
}

// ---- Validation ----

/**
 * Validate a player's number selection against called numbers.
 * Mode-specific behavior:
 * - Classic/comparison/even/odd/sequence: check if the exact number was called
 * - Tens: check if the number's decade was called (student can mark ANY number in a called decade)
 * Children may be slow or miss a number, so they should be able to
 * select any number that has already been called, not just the latest.
 * If correct, marks the cell on the player's card and awards points.
 * Returns a SelectionResultPayload (without line/bingo bonuses yet).
 */
export function validateAndMarkSelection(room: Room, player: Player, selectedNumber: number): SelectionResultPayload {
  // Check if any numbers have been called yet
  if (room.calledNumbers.length === 0) {
    return {
      correct: false,
      points: 0,
      message: 'NO SE HA LLAMADO NINGÚN NÚMERO TODAVÍA. ¡ESPERÁ EL PRIMER NÚMERO!',
      totalScore: player.score,
    };
  }

  // Check if the selected number was called (mode-specific)
  if (room.mode === 'tens') {
    // In tens mode, check if the number's decade was called
    const selectedDecade = Math.floor(selectedNumber / 10) * 10;
    if (!room.calledNumbers.includes(selectedDecade)) {
      return {
        correct: false,
        points: 0,
        message: getEncouragingMessage(),
        totalScore: player.score,
      };
    }
  } else {
    // All other modes: check if the exact number was called
    if (!room.calledNumbers.includes(selectedNumber)) {
      return {
        correct: false,
        points: 0,
        message: getEncouragingMessage(),
        totalScore: player.score,
      };
    }
  }

  // Check if the number is on the player's card
  const position = findNumberOnCard(player.card, selectedNumber);
  if (!position) {
    return {
      correct: false,
      points: 0,
      message: '¡EL NÚMERO ES CORRECTO, PERO NO ESTÁ EN TU CARTÓN! NO TE PREOCUPES, SEGUÍ JUGANDO.',
      totalScore: player.score,
    };
  }

  // Check if the cell is already marked
  const [row, col] = position;
  if (player.marked[row][col]) {
    return {
      correct: false,
      points: 0,
      message: '¡YA MARCASTE ESE NÚMERO ANTES! BUSQUEMOS OTRO.',
      totalScore: player.score,
    };
  }

  // Correct selection! Mark the cell and award points
  const points = (room.mode === 'sequence' || room.mode === 'comparison') ? 0 : 10;
  player.marked[row][col] = true;
  player.score += points;

  return {
    correct: true,
    points,
    message: points > 0 ? `${getSuccessMessage()} +${points} PTS` : '¡ENCONTRASTE EL NÚMERO EN TU TABLERO! 🔍',
    totalScore: player.score,
  };
}

// ---- Line detection (rows, columns, AND diagonals) ----

/**
 * Detect NEW line completions (rows, columns, diagonals) that haven't been awarded yet.
 * Only returns lines that are fully marked AND not already in player.completedLines.
 * Diagonals are only checked on odd-sized grids (where they pass through the FREE center).
 * Adds new lines to player.completedLines and awards bonus points.
 */
export function detectNewLines(room: Room, player: Player): LineCompletedPayload[] {
  const lines: LineCompletedPayload[] = [];
  const { gridSize } = room.config;
  const { marked, completedLines } = player;

  // Check rows
  for (let row = 0; row < gridSize; row++) {
    const lineKey = `row-${row}`;
    if (completedLines.has(lineKey)) continue;

    let complete = true;
    for (let col = 0; col < gridSize; col++) {
      if (!marked[row][col]) { complete = false; break; }
    }
    if (complete) {
      completedLines.add(lineKey);
      player.score += 50;
      lines.push({ playerId: player.id, playerName: player.name, type: 'row', bonus: 50, message: getLineMessage() });
    }
  }

  // Check columns
  for (let col = 0; col < gridSize; col++) {
    const lineKey = `col-${col}`;
    if (completedLines.has(lineKey)) continue;

    let complete = true;
    for (let row = 0; row < gridSize; row++) {
      if (!marked[row][col]) { complete = false; break; }
    }
    if (complete) {
      completedLines.add(lineKey);
      player.score += 50;
      lines.push({ playerId: player.id, playerName: player.name, type: 'column', bonus: 50, message: getLineMessage() });
    }
  }

  // Check diagonals (only on odd-sized grids where center is FREE)
  // Diagonal 0: top-left → bottom-right (row === col)
  // Diagonal 1: top-right → bottom-left (row + col === gridSize - 1)
  if (gridSize >= 3) {
    // Diagonal 0: top-left → bottom-right
    const diag0Key = 'diag-0';
    if (!completedLines.has(diag0Key)) {
      let complete = true;
      for (let i = 0; i < gridSize; i++) {
        if (!marked[i][i]) { complete = false; break; }
      }
      if (complete) {
        completedLines.add(diag0Key);
        player.score += 50;
        lines.push({ playerId: player.id, playerName: player.name, type: 'diagonal', bonus: 50, message: getLineMessage() });
      }
    }

    // Diagonal 1: top-right → bottom-left
    const diag1Key = 'diag-1';
    if (!completedLines.has(diag1Key)) {
      let complete = true;
      for (let i = 0; i < gridSize; i++) {
        if (!marked[i][gridSize - 1 - i]) { complete = false; break; }
      }
      if (complete) {
        completedLines.add(diag1Key);
        player.score += 50;
        lines.push({ playerId: player.id, playerName: player.name, type: 'diagonal', bonus: 50, message: getLineMessage() });
      }
    }
  }

  return lines;
}

// ---- Bingo detection ----

/**
 * Check if the player has a full bingo (all cells marked).
 * Awards +200 bonus and returns the payload, or null if not yet.
 */
export function detectBingo(room: Room, player: Player): BingoPayload | null {
  const { gridSize } = room.config;
  const { marked } = player;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!marked[row][col]) {
        return null;
      }
    }
  }

  // Bingo!
  const bonus = 200;
  player.score += bonus;

  return {
    playerId: player.id,
    playerName: player.name,
    points: bonus,
  };
}
