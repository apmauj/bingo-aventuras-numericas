// ============================================================
// TypeScript interfaces for Bingo Aventuras Numéricas
// ============================================================

export type GameView =
  | 'waking'
  | 'roleSelection'
  | 'studentJoin'
  | 'studentLobby'
  | 'studentGame'
  | 'masterCreate'
  | 'masterLobby'
  | 'masterGame'
  | 'results';

export type Role = 'master' | 'student';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export type GameMode = 'classic' | 'comparison' | 'even' | 'odd' | 'tens' | 'sequence';

export type ComparisonOperator = '>' | '<' | '=';

export type SequenceType = 'before' | 'after';

/** Sentinel value for the FREE center cell */
export const FREE_CELL = -1;

export type AvatarType = 'panda' | 'zorro' | 'rana' | 'leon' | 'delfin' | 'buho' | 'mariposa' | 'tortuga' | 'loro' | 'caballo' | 'oveja' | 'pulpo' | 'abeja' | 'gato' | 'perro' | 'conejo' | 'cerdo' | 'vaca' | 'pollito' | 'pinguino' | 'jirafa' | 'elefante' | 'mono' | 'tigre' | 'unicornio' | 'pez' | 'serpiente' | 'cocodrilo' | 'camaleon' | 'murcielago';

export interface AvatarOption {
  id: AvatarType;
  emoji: string;
  label: string;
  color: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'panda', emoji: '🐼', label: 'PANDA', color: 'bg-gray-100' },
  { id: 'zorro', emoji: '🦊', label: 'ZORRO', color: 'bg-orange-100' },
  { id: 'rana', emoji: '🐸', label: 'RANA', color: 'bg-green-100' },
  { id: 'leon', emoji: '🦁', label: 'LEÓN', color: 'bg-amber-100' },
  { id: 'delfin', emoji: '🐬', label: 'DELFIN', color: 'bg-blue-100' },
  { id: 'buho', emoji: '🦉', label: 'BÚHO', color: 'bg-stone-100' },
  { id: 'mariposa', emoji: '🦋', label: 'MARIPOSA', color: 'bg-purple-100' },
  { id: 'tortuga', emoji: '🐢', label: 'TORTUGA', color: 'bg-emerald-100' },
  { id: 'loro', emoji: '🦜', label: 'LORO', color: 'bg-lime-100' },
  { id: 'caballo', emoji: '🐴', label: 'CABALLO', color: 'bg-yellow-100' },
  { id: 'oveja', emoji: '🐑', label: 'OVEJA', color: 'bg-slate-100' },
  { id: 'pulpo', emoji: '🐙', label: 'PULPO', color: 'bg-violet-100' },
  { id: 'abeja', emoji: '🐝', label: 'ABEJA', color: 'bg-yellow-100' },
  { id: 'gato', emoji: '🐱', label: 'GATO', color: 'bg-orange-100' },
  { id: 'perro', emoji: '🐶', label: 'PERRO', color: 'bg-amber-100' },
  { id: 'conejo', emoji: '🐰', label: 'CONEJO', color: 'bg-pink-100' },
  { id: 'cerdo', emoji: '🐷', label: 'CERDO', color: 'bg-rose-100' },
  { id: 'vaca', emoji: '🐮', label: 'VACA', color: 'bg-neutral-100' },
  { id: 'pollito', emoji: '🐥', label: 'POLLITO', color: 'bg-yellow-100' },
  { id: 'pinguino', emoji: '🐧', label: 'PINGÜINO', color: 'bg-sky-100' },
  { id: 'jirafa', emoji: '🦒', label: 'JIRAFA', color: 'bg-amber-100' },
  { id: 'elefante', emoji: '🐘', label: 'ELEFANTE', color: 'bg-gray-100' },
  { id: 'mono', emoji: '🐵', label: 'MONO', color: 'bg-orange-100' },
  { id: 'tigre', emoji: '🐯', label: 'TIGRE', color: 'bg-amber-100' },
  { id: 'unicornio', emoji: '🦄', label: 'UNICORNIO', color: 'bg-fuchsia-100' },
  { id: 'pez', emoji: '🐟', label: 'PEZ', color: 'bg-cyan-100' },
  { id: 'serpiente', emoji: '🐍', label: 'SERPIENTE', color: 'bg-green-100' },
  { id: 'cocodrilo', emoji: '🐊', label: 'COCODRILO', color: 'bg-emerald-100' },
  { id: 'camaleon', emoji: '🦎', label: 'CAMALEÓN', color: 'bg-lime-100' },
  { id: 'murcielago', emoji: '🦇', label: 'MURCIÉLAGO', color: 'bg-indigo-100' },
];

// ---- Game mode options ----

export interface GameModeOption {
  id: GameMode;
  emoji: string;
  label: string;
  desc: string;
}

export const GAME_MODES: GameModeOption[] = [
  { id: 'classic', emoji: '🎯', label: 'CLÁSICO', desc: '¡BUSCÁ EL NÚMERO!' },
  { id: 'comparison', emoji: '📐', label: 'COMPARACIÓN', desc: '¿MAYOR O MENOR?' },
  { id: 'even', emoji: '🔵', label: 'PARES', desc: '¡SOLO PARES!' },
  { id: 'odd', emoji: '🔴', label: 'IMPARES', desc: '¡SOLO IMPARES!' },
  { id: 'tens', emoji: '🔟', label: 'DECENAS', desc: '¡MARCÁ LA DECENA!' },
  { id: 'sequence', emoji: '➡️', label: 'SECUENCIA', desc: '¿ANTES O DESPUÉS?' },
];

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

// ---- Server → Client payloads ----

export interface RoomCreatedPayload {
  code: string;
  qrData: string;
  roomId: string;
  mode: GameMode;
  config: { gridSize: number; numberRange: [number, number]; freeCell: boolean };
}

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  score: number;
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
  /** The correct answer: true = SÍ, false = NO */
  correctAnswer?: boolean;
  totalScore: number;
}

export interface LineCompletedPayload {
  playerId: string;
  playerName: string;
  type: 'row' | 'column' | 'diagonal';
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

export interface ErrorPayload {
  message: string;
  code: string;
}

export interface ReconnectedPayload {
  score: number;
  marked: boolean[][];
  calledNumbers: number[];
  hasBingo: boolean;
}

// ---- App State ----

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  score: number;
  card: number[][];
  marked: boolean[][];
}

export interface RoomState {
  id: string;
  code: string;
  players: PlayerPublic[];
  calledNumbers: number[];
  currentNumber: number | null;
  ranking: RankingEntry[];
  gridSize: number;
  numberRange: [number, number];
  mode: GameMode;
  freeCell: boolean;
  comparisonTarget?: number;
  comparisonOperator?: ComparisonOperator;
  decadeStart?: number;
  decadeEnd?: number;
  sequenceType?: SequenceType;
  sequencePrompt?: number;
}
