// ============================================================
// Socket.io event handlers for Bingo Aventuras Numéricas
// ============================================================

import type { Server, Socket } from 'socket.io';
import type {
  Player,
  JoinRoomPayload,
  StartGamePayload,
  NextNumberPayload,
  SelectNumberPayload,
  LeaveRoomPayload,
  RejoinRoomPayload,
  RoomCreatedPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  GameStartedPayload,
  NewNumberPayload,
  SelectionResultPayload,
  AnswerSequencePayload,
  SequenceResultPayload,
  RankingUpdatePayload,
  GameEndedPayload,
  ReconnectedPayload,
  ErrorPayload,
  AnswerComparisonPayload,
  ComparisonResultPayload,
} from './types';
import {
  createRoom,
  findRoomByCode,
  findRoomById,
  addPlayerToRoom,
  removePlayerFromRoom,
  rejoinRoom,
  playerToPublic,
  getRanking,
  deleteRoom,
} from './rooms';
import { validateAndMarkSelection, validateSequenceAnswer, validateComparisonAnswer, generateNextNumber, detectNewLines, detectBingo, generateComparisonTarget, generateSequenceTarget, generateSequenceOptions } from './game';

function emitError(socket: Socket, message: string, code: string) {
  const payload: ErrorPayload = { message, code };
  socket.emit('server:error', payload);
}

export function registerSocketHandlers(io: Server, socket: Socket) {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Track which room this socket is in
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;
  let isMaster = false;

  // =============================================
  // client:createRoom — Master creates a room
  // =============================================
  socket.on('client:createRoom', (data: { gridSize?: number; numberRange?: [number, number]; mode?: string; freeCell?: boolean }) => {
    try {
      const room = createRoom(socket.id, data as any);
      currentRoomId = room.id;
      isMaster = true;

      // Join the socket.io room
      socket.join(room.code);

      const payload: RoomCreatedPayload = {
        code: room.code,
        qrData: room.code, // QR data is simply the room code for joining
        roomId: room.id,
        mode: room.mode,
        config: room.config,
      };

      socket.emit('server:roomCreated', payload);
      console.log(`[Room] Created room ${room.code} by master ${socket.id}`, JSON.stringify(room.config), `mode: ${room.mode}`);
    } catch (err: any) {
      emitError(socket, err.message || 'Error creating room', 'ROOM_CREATE_ERROR');
    }
  });

  // =============================================
  // client:joinRoom — Student joins a room
  // =============================================
  socket.on('client:joinRoom', (data: JoinRoomPayload) => {
    try {
      const { code, name, avatar } = data;

      if (!code || !name || !avatar) {
        emitError(socket, 'FALTAN DATOS: CÓDIGO, NOMBRE Y AVATAR SON OBLIGATORIOS', 'MISSING_DATA');
        return;
      }

      const room = findRoomByCode(code.toUpperCase());
      if (!room) {
        emitError(socket, '¡NO ENCONTRAMOS ESA SALA! VERIFICÁ EL CÓDIGO.', 'ROOM_NOT_FOUND');
        return;
      }

      const player = addPlayerToRoom(room, socket.id, name.trim(), avatar);
      currentRoomId = room.id;
      currentPlayerId = player.id;
      isMaster = false;

      // Join the socket.io room
      socket.join(room.code);

      // Broadcast to everyone in the room — include full player list
      // so that joining students can see players who joined before them
      const allPlayers = Array.from(room.players.values()).map(playerToPublic);
      const payload: PlayerJoinedPayload = {
        player: playerToPublic(player),
        roomId: room.id,
        players: allPlayers,
      };
      io.to(room.code).emit('server:playerJoined', payload);

      console.log(`[Room ${room.code}] Player ${name} joined (${player.id})`);
    } catch (err: any) {
      emitError(socket, err.message || 'Error joining room', 'ROOM_JOIN_ERROR');
    }
  });

  // =============================================
  // client:startGame — Master starts the game
  // =============================================
  socket.on('client:startGame', (data: StartGamePayload) => {
    try {
      const { roomId, mode } = data;

      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      if (room.masterSocketId !== socket.id) {
        emitError(socket, 'SOLO EL DOCENTE PUEDE INICIAR EL JUEGO', 'NOT_MASTER');
        return;
      }

      if (room.state !== 'lobby') {
        emitError(socket, 'EL JUEGO YA COMENZÓ', 'GAME_ALREADY_STARTED');
        return;
      }

      if (room.players.size === 0) {
        emitError(socket, 'NECESITÁS AL MENOS UN JUGADOR PARA EMPEZAR', 'NO_PLAYERS');
        return;
      }

      // Update room state and mode
      room.state = 'playing';
      room.mode = mode || room.mode || 'classic';

      // Send each player their card and game info
      for (const player of room.players.values()) {
        const gamePayload: GameStartedPayload = {
          card: player.card,
          mode: room.mode,
          calledNumbers: room.calledNumbers,
          numberRange: room.config.numberRange,
          gridSize: room.config.gridSize,
          freeCell: room.config.freeCell,
        };
        io.to(player.socketId).emit('server:gameStarted', gamePayload);
      }

      // Also notify the master (no card for master)
      const masterPayload: GameStartedPayload = {
        card: [],
        mode: room.mode,
        calledNumbers: room.calledNumbers,
        numberRange: room.config.numberRange,
        gridSize: room.config.gridSize,
        freeCell: room.config.freeCell,
      };
      io.to(room.masterSocketId).emit('server:gameStarted', masterPayload);

      console.log(`[Room ${room.code}] Game started with ${room.players.size} players, mode: ${room.mode}`);
    } catch (err: any) {
      emitError(socket, err.message || 'Error starting game', 'GAME_START_ERROR');
    }
  });

  // =============================================
  // client:nextNumber — Master requests next number
  // =============================================
  socket.on('client:nextNumber', (data: NextNumberPayload) => {
    try {
      const { roomId } = data;

      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      if (room.masterSocketId !== socket.id) {
        emitError(socket, 'SOLO EL DOCENTE PUEDE LLAMAR NÚMEROS', 'NOT_MASTER');
        return;
      }

      if (room.state !== 'playing') {
        emitError(socket, 'EL JUEGO NO ESTÁ EN CURSO', 'GAME_NOT_PLAYING');
        return;
      }

      const number = generateNextNumber(room);
      if (number === null) {
        emitError(socket, '¡YA SE LLAMARON TODOS LOS NÚMEROS!', 'ALL_NUMBERS_CALLED');
        return;
      }

      const payload: NewNumberPayload = {
        number,
        index: room.calledNumbers.length,
      };

      // Add comparison data if in comparison mode
      if (room.mode === 'comparison') {
        const { target, operator } = generateComparisonTarget(number, room.config.numberRange);
        payload.comparisonTarget = target;
        payload.comparisonOperator = operator;
        // Reset comparison tracking for the new round
        room.comparisonAttempts = new Map();
        room.comparisonAnswered = new Set();
        // Persist current comparison prompt for server-side validation
        room.currentComparisonTarget = target;
        room.currentComparisonOperator = operator;
      }

      // Add decade data if in tens mode
      if (room.mode === 'tens') {
        const [min, max] = room.config.numberRange;
        const decadeStart = number; // number IS the decade start (e.g., 40)
        const decadeEnd = Math.min(decadeStart + 9, max);
        payload.decadeStart = decadeStart;
        payload.decadeEnd = decadeEnd;
      }

      // Add sequence data if in sequence mode
      if (room.mode === 'sequence') {
        const seqTarget = generateSequenceTarget(number, room.config.numberRange);
        payload.sequenceType = seqTarget.type;
        payload.sequencePrompt = seqTarget.prompt;
        payload.sequenceOptions = generateSequenceOptions(number, room.config.numberRange);
        room.sequenceAttempts = new Map();
        room.sequenceAnswered = new Set();
      } else {
        // Clear any previous comparison prompt when not in comparison mode
        room.currentComparisonTarget = undefined;
        room.currentComparisonOperator = undefined;
      }

      io.to(room.code).emit('server:newNumber', payload);
      const modeInfo = payload.comparisonTarget ? ` — ¿${number} ${payload.comparisonOperator} ${payload.comparisonTarget}?`
        : payload.decadeStart !== undefined ? ` — DECENA ${payload.decadeStart}-${payload.decadeEnd}`
        : payload.sequenceType ? ` — ¿${payload.sequenceType === 'after' ? 'DESPUÉS' : 'ANTES'} DE ${payload.sequencePrompt}?`
        : '';
      console.log(`[Room ${room.code}] Number called: ${number} (#${room.calledNumbers.length})${modeInfo}`);
    } catch (err: any) {
      emitError(socket, err.message || 'Error calling number', 'NEXT_NUMBER_ERROR');
    }
  });

  // =============================================
  // client:answerSequence — Student answers sequence multiple-choice
  // =============================================
  socket.on('client:answerSequence', (data: AnswerSequencePayload) => {
    try {
      const { roomId, answer } = data;

      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      if (room.state !== 'playing') {
        emitError(socket, 'EL JUEGO NO ESTÁ EN CURSO', 'GAME_NOT_PLAYING');
        return;
      }

      if (room.mode !== 'sequence') {
        emitError(socket, 'ESTE EVENTO ES SOLO PARA EL MODO SECUENCIA', 'WRONG_MODE');
        return;
      }

      let player: Player | undefined;
      for (const p of room.players.values()) {
        if (p.socketId === socket.id) {
          player = p;
          break;
        }
      }

      if (!player) {
        emitError(socket, 'JUGADOR NO ENCONTRADO EN ESTA SALA', 'PLAYER_NOT_FOUND');
        return;
      }

      // If already answered correctly, short-circuit
      if (room.sequenceAnswered.has(player.id)) {
        socket.emit('server:sequenceResult', {
          correct: true,
          points: 0,
          attempts: room.sequenceAttempts.get(player.id) || 1,
          message: `¡YA RESPONDISTE CORRECTO! ¡BUSCÁ EL ${room.currentNumber} EN TU TABLERO!`,
          correctAnswer: room.currentNumber ?? undefined,
          totalScore: player.score,
        } as SequenceResultPayload);
        return;
      }

      const result = validateSequenceAnswer(room, player, answer);
      socket.emit('server:sequenceResult', result);

      if (result.correct) {
        const rankingPayload: RankingUpdatePayload = { ranking: getRanking(room) };
        io.to(room.code).emit('server:rankingUpdate', rankingPayload);
      }
    } catch (err: any) {
      emitError(socket, err.message || 'Error answering sequence', 'SEQUENCE_ANSWER_ERROR');
    }
  });

  // =============================================
  // client:answerComparison — Student answers the comparison SI/NO question
  // =============================================
  socket.on('client:answerComparison', (data: AnswerComparisonPayload) => {
    try {
      const { roomId, answer } = data;

      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      if (room.state !== 'playing') {
        emitError(socket, 'EL JUEGO NO ESTÁ EN CURSO', 'GAME_NOT_PLAYING');
        return;
      }

      if (room.mode !== 'comparison') {
        emitError(socket, 'ESTE EVENTO ES SOLO PARA EL MODO COMPARACIÓN', 'WRONG_MODE');
        return;
      }

      // Find the player by socket id
      let player: Player | undefined;
      for (const p of room.players.values()) {
        if (p.socketId === socket.id) {
          player = p;
          break;
        }
      }

      if (!player) {
        emitError(socket, 'JUGADOR NO ENCONTRADO EN ESTA SALA', 'PLAYER_NOT_FOUND');
        return;
      }

      // Check if already answered correctly this round
      if (room.comparisonAnswered.has(player.id)) {
        socket.emit('server:comparisonResult', {
          correct: true,
          points: 0,
          attempts: room.comparisonAttempts.get(player.id) || 1,
          message: `¡YA RESPONDISTE CORRECTO! ¡BUSCÁ EL ${room.currentNumber} EN TU TABLERO!`,
          correctAnswer: true,
          totalScore: player.score,
        } as ComparisonResultPayload);
        return;
      }

      const result = validateComparisonAnswer(room, player, answer);
      socket.emit('server:comparisonResult', result);

      // If correct, broadcast ranking update
      if (result.correct) {
        const rankingPayload: RankingUpdatePayload = { ranking: getRanking(room) };
        io.to(room.code).emit('server:rankingUpdate', rankingPayload);
      }
    } catch (err: any) {
      emitError(socket, err.message || 'Error answering comparison', 'COMPARISON_ANSWER_ERROR');
    }
  });

  // =============================================
  // client:selectNumber — Student selects a number
  // =============================================
  socket.on('client:selectNumber', (data: SelectNumberPayload) => {
    try {
      const { roomId, number } = data;

      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      if (room.state !== 'playing') {
        emitError(socket, 'EL JUEGO NO ESTÁ EN CURSO', 'GAME_NOT_PLAYING');
        return;
      }

      // Find the player by socket id within this room
      let player: Player | undefined;
      for (const p of room.players.values()) {
        if (p.socketId === socket.id) {
          player = p;
          break;
        }
      }

      if (!player) {
        emitError(socket, 'JUGADOR NO ENCONTRADO EN ESTA SALA', 'PLAYER_NOT_FOUND');
        return;
      }

      // Validate and mark the selection
      const result = validateAndMarkSelection(room, player, number);

      if (!result.correct) {
        // Send result for incorrect selection and we're done
        socket.emit('server:selectionResult', result);
        return;
      }

      // Correct selection! Now check for line completions and bingo
      const lines = detectNewLines(room, player);
      let bingoResult = detectBingo(room, player);

      // Build the final selection result with total score including all bonuses
      const finalResult: SelectionResultPayload = {
        correct: true,
        points: result.points,
        message: result.message,
        totalScore: player.score,
      };

      // Send the selection result with final score
      socket.emit('server:selectionResult', finalResult);

      // Broadcast line completions
      for (const line of lines) {
        io.to(room.code).emit('server:lineCompleted', line);
        console.log(`[Room ${room.code}] ${player.name} completed a ${line.type}! +50 bonus`);
      }

      // Check for bingo
      if (bingoResult) {
        io.to(room.code).emit('server:bingo', bingoResult);
        console.log(`[Room ${room.code}] 🎉 BINGO! ${player.name} wins! +200 bonus`);

        // End the game
        room.state = 'ended';
        const ranking = getRanking(room);
        const endPayload: GameEndedPayload = { results: ranking };
        io.to(room.code).emit('server:gameEnded', endPayload);
      }

      // Broadcast ranking update
      const rankingPayload: RankingUpdatePayload = {
        ranking: getRanking(room),
      };
      io.to(room.code).emit('server:rankingUpdate', rankingPayload);
    } catch (err: any) {
      emitError(socket, err.message || 'Error selecting number', 'SELECTION_ERROR');
    }
  });

  // =============================================
  // client:rejoinRoom — Student reconnects after disconnect
  // =============================================
  socket.on('client:rejoinRoom', (data: RejoinRoomPayload) => {
    try {
      const { code, playerId } = data;

      if (!code || !playerId) {
        emitError(socket, 'FALTAN DATOS PARA RECONECTAR', 'MISSING_DATA');
        return;
      }

      const room = findRoomByCode(code.toUpperCase());
      if (!room) {
        emitError(socket, '¡NO ENCONTRAMOS ESA SALA!', 'ROOM_NOT_FOUND');
        return;
      }

      const player = rejoinRoom(room, playerId, socket.id);
      currentRoomId = room.id;
      currentPlayerId = player.id;
      isMaster = false;

      // Join the socket.io room
      socket.join(room.code);

      // Send reconnection state to the player
      const reconnectedPayload: ReconnectedPayload = {
        score: player.score,
        marked: player.marked,
        calledNumbers: room.calledNumbers,
        hasBingo: false, // We don't track this explicitly; the card state tells
      };
      socket.emit('server:reconnected', reconnectedPayload);

      console.log(`[Room ${room.code}] Player ${player.name} reconnected`);
    } catch (err: any) {
      emitError(socket, err.message || 'Error reconnecting', 'RECONNECT_ERROR');
    }
  });

  // =============================================
  // client:leaveRoom — Player leaves
  // =============================================
  socket.on('client:leaveRoom', (data: LeaveRoomPayload) => {
    try {
      const { roomId } = data;
      const room = findRoomById(roomId);
      if (!room) {
        emitError(socket, 'SALA NO ENCONTRADA', 'ROOM_NOT_FOUND');
        return;
      }

      // Find the player by socket id
      let playerId: string | null = null;
      for (const p of room.players.values()) {
        if (p.socketId === socket.id) {
          playerId = p.id;
          break;
        }
      }

      if (playerId) {
        removePlayerFromRoom(room, playerId);
        socket.leave(room.code);

        const payload: PlayerLeftPayload = { playerId };
        io.to(room.code).emit('server:playerLeft', payload);

        // Update ranking
        const rankingPayload: RankingUpdatePayload = {
          ranking: getRanking(room),
        };
        io.to(room.code).emit('server:rankingUpdate', rankingPayload);

        console.log(`[Room ${room.code}] Player left: ${playerId}`);
      }

      // If master leaves, end the game or clean up
      if (room.masterSocketId === socket.id) {
        room.state = 'ended';
        io.to(room.code).emit('server:gameEnded', {
          results: getRanking(room),
        });
        socket.leave(room.code);
        deleteRoom(room.code);
        console.log(`[Room ${room.code}] Master left, room closed`);
      }

      currentRoomId = null;
      currentPlayerId = null;
    } catch (err: any) {
      emitError(socket, err.message || 'Error leaving room', 'LEAVE_ERROR');
    }
  });

  // =============================================
  // Disconnect handler
  // Give players 30 seconds to reconnect during a game.
  // If they don't reconnect, remove them.
  // =============================================
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);

    if (!currentRoomId) return;

    const room = findRoomById(currentRoomId);
    if (!room) return;

    // Check if it's the master disconnecting
    if (room.masterSocketId === socket.id) {
      room.state = 'ended';
      io.to(room.code).emit('server:gameEnded', {
        results: getRanking(room),
      });
      deleteRoom(room.code);
      console.log(`[Room ${room.code}] Master disconnected, room closed`);
      return;
    }

    // Check if it's a player disconnecting
    if (currentPlayerId) {
      const player = room.players.get(currentPlayerId);
      if (player) {
        if (room.state === 'playing') {
          // During a game, give the player a chance to reconnect
          console.log(`[Room ${room.code}] Player ${player.name} disconnected — waiting 30s for reconnect`);
          const disconnectedPlayerId = currentPlayerId;
          const disconnectedRoomCode = room.code;

          setTimeout(() => {
            // Re-check if the player still exists and hasn't reconnected
            const currentRoom = findRoomByCode(disconnectedRoomCode);
            if (!currentRoom) return;
            const currentPlayer = currentRoom.players.get(disconnectedPlayerId);
            if (!currentPlayer) return; // Already removed

            // If the socket ID hasn't changed from the disconnected one, they didn't reconnect
            if (currentPlayer.socketId === socket.id) {
              removePlayerFromRoom(currentRoom, disconnectedPlayerId);
              const payload: PlayerLeftPayload = { playerId: disconnectedPlayerId };
              io.to(currentRoom.code).emit('server:playerLeft', payload);

              // Update ranking
              const rankingPayload: RankingUpdatePayload = {
                ranking: getRanking(currentRoom),
              };
              io.to(currentRoom.code).emit('server:rankingUpdate', rankingPayload);

              console.log(`[Room ${currentRoom.code}] Player ${currentPlayer.name} removed after 30s no reconnect`);
            }
          }, 30000);
        } else {
          // In lobby, remove immediately
          removePlayerFromRoom(room, currentPlayerId);
          const payload: PlayerLeftPayload = { playerId: currentPlayerId };
          io.to(room.code).emit('server:playerLeft', payload);

          // Update ranking
          const rankingPayload: RankingUpdatePayload = {
            ranking: getRanking(room),
          };
          io.to(room.code).emit('server:rankingUpdate', rankingPayload);

          console.log(`[Room ${room.code}] Player ${player.name} disconnected from lobby`);
        }
      }
    }

    currentRoomId = null;
    currentPlayerId = null;
  });
}
