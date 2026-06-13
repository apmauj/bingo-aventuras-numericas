// ============================================================
// Room management for Bingo Aventuras Numéricas
// ============================================================

import { nanoid } from 'nanoid';
import type { Room, Player, GameConfig, GameMode, PlayerPublic } from './types';
import { generateCard, createMarkedGrid } from './cards';

// Re-export getNumbersNeeded from cards for validation
import { getMinRangeSize } from './cards';

// In-memory store of all active rooms
const rooms = new Map<string, Room>();

/**
 * Generate a unique 4-character alphanumeric room code.
 * Ensures no collision with existing rooms.
 */
function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit confusing chars: I, O, 0, 1
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  } while (rooms.has(code));
  return code;
}

/**
 * Calculate how many unique numbers are needed for a card.
 * Uses the freeCell flag to determine if a ⭐ cell is present.
 */
function getNumbersNeeded(gridSize: number, freeCell: boolean = gridSize % 2 === 1): number {
  const hasFreeCell = freeCell && gridSize % 2 === 1;
  return hasFreeCell ? gridSize * gridSize - 1 : gridSize * gridSize;
}

/**
 * Create a new room. Returns the room object.
 * Accepts optional config from the master client; missing fields use defaults.
 * Throws errors for invalid configuration instead of silently defaulting.
 */
export function createRoom(masterSocketId: string, config?: Partial<GameConfig> & { mode?: GameMode }): Room {
  const code = generateRoomCode();
  const id = nanoid(12);

  const defaultConfig: GameConfig = {
    gridSize: 3,
    numberRange: [0, 100],
    freeCell: true,
  };

  // Merge client config with defaults, validating each field
  const mergedConfig: GameConfig = { ...defaultConfig };

  // Validate gridSize
  if (config?.gridSize) {
    const validSizes = [3, 4, 5, 6];
    if (!validSizes.includes(config.gridSize)) {
      throw new Error('TAMAÑO DE CARTÓN INVÁLIDO. USÁ 3×3, 4×4, 5×5 O 6×6.');
    }
    mergedConfig.gridSize = config.gridSize;
  }

  // Validate freeCell — only meaningful for odd-sized grids (center cell exists)
  const freeCell = config?.freeCell !== undefined
    ? config.freeCell
    : mergedConfig.gridSize % 2 === 1; // default ON for odd, OFF for even

  // For even grids, force freeCell to false (no center cell for ⭐)
  const effectiveFreeCell = mergedConfig.gridSize % 2 === 1 ? freeCell : false;

  // Validate numberRange — throw errors instead of silently defaulting
  if (config?.numberRange && Array.isArray(config.numberRange) && config.numberRange.length === 2) {
    const [min, max] = config.numberRange;

    if (typeof min !== 'number' || typeof max !== 'number' || isNaN(min) || isNaN(max)) {
      throw new Error('EL RANGO DEBE CONTENER NÚMEROS VÁLIDOS.');
    }

    if (min < 0) {
      throw new Error('EL NÚMERO MÍNIMO NO PUEDE SER NEGATIVO.');
    }

    if (min >= max) {
      throw new Error('EL NÚMERO MÍNIMO DEBE SER MENOR QUE EL MÁXIMO.');
    }

    const minCells = getNumbersNeeded(mergedConfig.gridSize, effectiveFreeCell);
    if (max - min + 1 < minCells) {
      throw new Error(
        `EL RANGO [${min}, ${max}] ES MUY CHICO PARA UN CARTÓN DE ${mergedConfig.gridSize}×${mergedConfig.gridSize} (NECESITA AL MENOS ${minCells} NÚMEROS ÚNICOS).`
      );
    }

    mergedConfig.numberRange = [min, max];
  }

  // Validate mode
  const validModes: GameMode[] = ['classic', 'comparison', 'even', 'odd', 'tens', 'sequence'];
  const mode: GameMode = config?.mode && validModes.includes(config.mode) ? config.mode : 'classic';

  // For even/odd modes, validate that the range has enough even/odd numbers
  if (mode === 'even' || mode === 'odd') {
    const [min, max] = mergedConfig.numberRange;
    const minCells = getNumbersNeeded(mergedConfig.gridSize, effectiveFreeCell);
    let count = 0;
    for (let n = min; n <= max; n++) {
      if (mode === 'even' && n % 2 === 0) count++;
      if (mode === 'odd' && n % 2 === 1) count++;
    }
    if (count < minCells) {
      const modeLabel = mode === 'even' ? 'PARES' : 'IMPARES';
      throw new Error(
        `NO HAY SUFICIENTES NÚMEROS ${modeLabel} EN [${min}, ${max}] PARA UN CARTÓN DE ${mergedConfig.gridSize}×${mergedConfig.gridSize} (NECESITA ${minCells}, HAY ${count}). PROBÁ UN RANGO MÁS AMPLIO.`
      );
    }
  }

  // For tens mode, validate that the range covers enough decades
  if (mode === 'tens') {
    const [min, max] = mergedConfig.numberRange;
    const decades = new Set<number>();
    for (let n = min; n <= max; n++) {
      decades.add(Math.floor(n / 10) * 10);
    }
    if (decades.size < 2) {
      throw new Error(
        `EL RANGO [${min}, ${max}] CUBRE MUY POCAS DECENAS (${decades.size}) PARA EL MODO DECENAS. PROBÁ UN RANGO MÁS AMPLIO (AL MENOS 2 DECENAS).`
      );
    }
  }

  // For sequence mode, validate that the range has at least 2 numbers
  // (need at least N and N+1 or N-1 for before/after prompts)
  if (mode === 'sequence') {
    const [min, max] = mergedConfig.numberRange;
    if (max - min < 1) {
      throw new Error(
        `EL RANGO [${min}, ${max}] ES MUY CHICO PARA EL MODO SECUENCIA. NECESITÁ AL MENOS 2 NÚMEROS CONSECUTIVOS.`
      );
    }
  }

  const room: Room = {
    id,
    code,
    masterSocketId,
    players: new Map(),
    state: 'lobby',
    mode,
    config: { ...mergedConfig, freeCell: effectiveFreeCell },
    calledNumbers: [],
    currentNumber: null,
    createdAt: Date.now(),
    sequenceAttempts: new Map(),
    sequenceAnswered: new Set(),
    comparisonAttempts: new Map(),
    comparisonAnswered: new Set(),
    currentComparisonTarget: undefined,
    currentComparisonOperator: undefined,
  };

  rooms.set(code, room);
  return room;
}

/**
 * Find a room by its code.
 */
export function findRoomByCode(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

/**
 * Find a room by its id.
 */
export function findRoomById(id: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.id === id) return room;
  }
  return undefined;
}

/**
 * Add a player to a room. Generates a unique card for the player.
 * Returns the player object or throws an error.
 */
export function addPlayerToRoom(room: Room, socketId: string, name: string, avatar: string): Player {
  if (room.state !== 'lobby') {
    throw new Error('Game already in progress — cannot join now');
  }

  const playerId = nanoid(10);

  const card = generateCard(room.config, room.mode);
  const marked = createMarkedGrid(room.config.gridSize, room.config.freeCell);

  const player: Player = {
    id: playerId,
    socketId,
    name,
    avatar,
    card,
    marked,
    score: 0,
    roomId: room.id,
    completedLines: new Set<string>(),
  };

  room.players.set(playerId, player);
  return player;
}

/**
 * Remove a player from a room.
 */
export function removePlayerFromRoom(room: Room, playerId: string): Player | undefined {
  const player = room.players.get(playerId);
  if (player) {
    room.players.delete(playerId);
  }
  return player;
}

/**
 * Rejoin a room after disconnection.
 * Finds the player by their playerId and updates their socketId
 * so they can continue playing with their existing card and score.
 * Only works if the game is in 'playing' state (lobby players should just re-join normally).
 * Returns the updated player, or throws an error.
 */
export function rejoinRoom(room: Room, playerId: string, newSocketId: string): Player {
  if (room.state !== 'playing') {
    throw new Error('EL JUEGO NO ESTÁ EN CURSO. VOLVÉ A INGRESAR A LA SALA.');
  }

  const player = room.players.get(playerId);
  if (!player) {
    throw new Error('NO ENCONTRAMOS TU JUGADOR. VOLVÉ A INGRESAR A LA SALA.');
  }

  // Update the player's socket ID to the new connection
  player.socketId = newSocketId;

  return player;
}

/**
 * Get the public info for a player (safe to broadcast).
 */
export function playerToPublic(player: Player): PlayerPublic {
  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    score: player.score,
  };
}

/**
 * Get the ranking for a room, sorted by score descending.
 */
export function getRanking(room: Room): PlayerPublic[] {
  const players = Array.from(room.players.values());
  return players
    .map(playerToPublic)
    .sort((a, b) => b.score - a.score);
}

/**
 * Delete a room (cleanup).
 */
export function deleteRoom(code: string): boolean {
  return rooms.delete(code);
}

/**
 * Get the count of active rooms.
 */
export function getRoomCount(): number {
  return rooms.size;
}

/**
 * Find a player across all rooms by socket id.
 * Returns { room, player } or undefined.
 */
export function findPlayerBySocketId(socketId: string): { room: Room; player: Player } | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) {
        return { room, player };
      }
    }
    // Also check if the socket is the master
    if (room.masterSocketId === socketId) {
      return { room, player: undefined as any };
    }
  }
  return undefined;
}

/**
 * Find room where the socket is the master.
 */
export function findRoomByMasterSocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.masterSocketId === socketId) return room;
  }
  return undefined;
}
