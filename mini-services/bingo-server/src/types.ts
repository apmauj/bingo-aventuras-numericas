// ============================================================
// Type definitions for Bingo Aventuras Numéricas
// ============================================================

export type GameState = 'lobby' | 'playing' | 'ended';
export type GameMode = 'classic' | 'comparison' | 'even' | 'odd' | 'tens' | 'sequence';
export type ComparisonOperator = '>' | '<' | '=';
export type SequenceType = 'before' | 'after';
export type LineType = 'row' | 'column' | 'diagonal';

/** Sentinel value for the FREE center cell */
export const FREE_CELL = -1;

export interface GameConfig {
  gridSize: number;
  numberRange: [number, number];
  freeCell: boolean;
}

export interface Room {
  id: string;
  code: string;
  masterSocketId: string;
  players: Map<string, Player>;
  state: GameState;
  mode: GameMode;
  config: GameConfig;
  calledNumbers: number[];
  currentNumber: number | null;
  createdAt: number;
  sequenceAttempts: Map<string, number>;   // playerId → attempt count
  sequenceAnswered: Set<string>;           // playerIds who answered correctly this round
  // Comparison mode tracking: attempts per player for the current number
  comparisonAttempts: Map<string, number>; // playerId → attempt count
  comparisonAnswered: Set<string>;         // playerIds who answered correctly this round
  // Current comparison prompt (when mode === 'comparison')
  currentComparisonTarget?: number;
  currentComparisonOperator?: ComparisonOperator;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  card: number[][];
  marked: boolean[][];
  score: number;
  roomId: string;
  completedLines: Set<string>; // tracks already-awarded lines, e.g. "row-0", "col-2", "diag-0", "diag-1"
}

// ---- Client → Server payloads ----

export interface CreateRoomPayload {
  gridSize?: number;
  numberRange?: [number, number];
  mode?: GameMode;
}

export interface JoinRoomPayload {
  code: string;
  name: string;
  avatar: string;
}

export interface StartGamePayload {
  roomId: string;
  mode: GameMode;
}

export interface NextNumberPayload {
  roomId: string;
}

export interface SelectNumberPayload {
  roomId: string;
  number: number;
}

export interface AnswerSequencePayload {
  roomId: string;
  answer: number;
}

export interface AnswerComparisonPayload {
  roomId: string;
  answer: boolean; // true = SÍ, false = NO
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface RejoinRoomPayload {
  code: string;
  playerId: string;
}

// ---- Server → Client payloads ----

export interface RoomCreatedPayload {
  code: string;
  qrData: string;
  roomId: string;
  mode: GameMode;
  config: GameConfig;
}

export interface PlayerJoinedPayload {
  player: PlayerPublic;
  roomId: string;
  players: PlayerPublic[]; // Full player list so all clients stay in sync
}

export interface PlayerLeftPayload {
  playerId: string;
}

export interface GameStartedPayload {
  card: number[][];
  mode: GameMode;
  calledNumbers: number[];
  numberRange: [number, number];
  gridSize: number;
  freeCell: boolean;
}

export interface NewNumberPayload {
  number: number;
  index: number;
  comparisonTarget?: number;
  comparisonOperator?: ComparisonOperator;
  decadeStart?: number;
  decadeEnd?: number;
  sequenceType?: SequenceType;
  sequencePrompt?: number;
  sequenceOptions?: number[];
}

export interface SelectionResultPayload {
  correct: boolean;
  points: number;
  message: string;
  totalScore: number;
}

export interface SequenceResultPayload {
  correct: boolean;
  points: number;
  attempts: number;
  message: string;
  correctAnswer?: number;
  totalScore: number;
}

export interface ComparisonResultPayload {
  correct: boolean;
  points: number;
  attempts: number;
  message: string;
  /** The correct answer: true means SÍ, false means NO */
  correctAnswer?: boolean;
  totalScore: number;
}

export interface LineCompletedPayload {
  playerId: string;
  playerName: string;
  type: LineType;
  bonus: number;
  message: string;
}

export interface BingoPayload {
  playerId: string;
  playerName: string;
  points: number;
}

export interface RankingEntry {
  name: string;
  avatar: string;
  score: number;
}

export interface RankingUpdatePayload {
  ranking: RankingEntry[];
}

export interface GameEndedPayload {
  results: RankingEntry[];
}

export interface ReconnectedPayload {
  score: number;
  marked: boolean[][];
  calledNumbers: number[];
  hasBingo: boolean;
}

export interface ErrorPayload {
  message: string;
  code: string;
}

// ---- Public player info (safe to broadcast) ----

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  score: number;
}
