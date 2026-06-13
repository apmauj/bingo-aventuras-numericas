// ============================================================
// Socket.io event name constants for Bingo Aventuras Numéricas
// ============================================================

// Client → Server events
export const CLIENT_EVENTS = {
  CREATE_ROOM: 'client:createRoom',
  JOIN_ROOM: 'client:joinRoom',
  START_GAME: 'client:startGame',
  NEXT_NUMBER: 'client:nextNumber',
  SELECT_NUMBER: 'client:selectNumber',
  ANSWER_SEQUENCE: 'client:answerSequence',
  ANSWER_COMPARISON: 'client:answerComparison',
  LEAVE_ROOM: 'client:leaveRoom',
  REJOIN_ROOM: 'client:rejoinRoom',
} as const;

// Server → Client events
export const SERVER_EVENTS = {
  ROOM_CREATED: 'server:roomCreated',
  PLAYER_JOINED: 'server:playerJoined',
  PLAYER_LEFT: 'server:playerLeft',
  GAME_STARTED: 'server:gameStarted',
  NEW_NUMBER: 'server:newNumber',
  SELECTION_RESULT: 'server:selectionResult',
  SEQUENCE_RESULT: 'server:sequenceResult',
  COMPARISON_RESULT: 'server:comparisonResult',
  LINE_COMPLETED: 'server:lineCompleted',
  BINGO: 'server:bingo',
  RANKING_UPDATE: 'server:rankingUpdate',
  GAME_ENDED: 'server:gameEnded',
  ERROR: 'server:error',
  RECONNECTED: 'server:reconnected',
} as const;
