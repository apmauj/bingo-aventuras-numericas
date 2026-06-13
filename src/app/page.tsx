// ============================================================
// Main Page — Bingo Aventuras Numéricas
// ============================================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket, getActiveSocket } from '@/hooks/useSocket';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/lib/socket-events';
import type {
  GameView,
  Role,
  RoomState,
  SelectionResultPayload,
  SequenceResultPayload,
  ComparisonResultPayload,
  LineCompletedPayload,
  BingoPayload,
  RankingUpdatePayload,
  GameEndedPayload,
  ErrorPayload,
  RoomCreatedPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  GameStartedPayload,
  NewNumberPayload,
  ReconnectedPayload,
  GameMode,
} from '@/types/bingo';

// Components
import { WakingServer } from '@/components/bingo/WakingServer';
import { RoleSelection } from '@/components/bingo/RoleSelection';
import { StudentJoin } from '@/components/bingo/StudentJoin';
import { StudentLobby } from '@/components/bingo/StudentLobby';
import { StudentGame } from '@/components/bingo/StudentGame';
import { MasterCreate } from '@/components/bingo/MasterCreate';
import { MasterLobby } from '@/components/bingo/MasterLobby';
import { MasterGame } from '@/components/bingo/MasterGame';
import { ResultsScreen } from '@/components/bingo/ResultsScreen';
import { ConfettiEffect } from '@/components/bingo/ConfettiEffect';
import { BingoOverlay } from '@/components/bingo/BingoOverlay';
import { playNumberCalled, playCorrect, playIncorrect, playLineCompleted, playBingo, playJoined, resumeAudio, speakNumber } from '@/components/bingo/SoundFX';

export default function Home() {
  const { connectionState, emit } = useSocket();

  // View state
  const [currentView, setCurrentView] = useState<GameView>('waking');
  const [role, setRole] = useState<Role>('student');
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('panda');
  const [playerId, setPlayerId] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [playerCard, setPlayerCard] = useState<number[][]>([]);
  const [playerMarked, setPlayerMarked] = useState<boolean[][]>([]);
  const [answeredCurrentQuestion, setAnsweredCurrentQuestion] = useState(false);
  
  const [room, setRoom] = useState<RoomState>({
    id: '', code: '', players: [], calledNumbers: [],
    currentNumber: null, ranking: [], gridSize: 3, numberRange: [0, 100],
    mode: 'classic', freeCell: true,
  });

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Bingo overlay state — full-screen celebration when someone wins
  const [bingoOverlay, setBingoOverlay] = useState<{ playerName: string; points: number; isSelf: boolean } | null>(null);

  // Comparison state — latest comparison data from the last called number
  const [comparisonTarget, setComparisonTarget] = useState<number | undefined>(undefined);
  const [comparisonOperator, setComparisonOperator] = useState<'>' | '<' | '=' | undefined>(undefined);

  // Tens mode state — decade data
  const [decadeStart, setDecadeStart] = useState<number | undefined>(undefined);
  const [decadeEnd, setDecadeEnd] = useState<number | undefined>(undefined);

  // Sequence mode state — before/after prompt data
  const [sequenceType, setSequenceType] = useState<'before' | 'after' | undefined>(undefined);
  const [sequencePrompt, setSequencePrompt] = useState<number | undefined>(undefined);

  // Line highlight state — tracks which lines were recently completed
  const [completedLines, setCompletedLines] = useState<string[]>([]);

  // Floating points state — shows +10/+50 near the marked cell
  const [lastScoreEvent, setLastScoreEvent] = useState<{ row: number; col: number; points: number } | null>(null);

  // Sequence mode UI state
  const [sequenceOptions, setSequenceOptions] = useState<number[]>([]);
  const [sequenceAnsweredCorrectly, setSequenceAnsweredCorrectly] = useState(false);
  const [comparisonAnsweredCorrectly, setComparisonAnsweredCorrectly] = useState(false);

  // Refs for stable access in event handlers
  const currentRoleRef = useRef<Role>(role);
  const playerNameRef = useRef<string>(playerName);
  const playerIdRef = useRef<string>(playerId);
  const playerCardRef = useRef<number[][]>(playerCard);
  const roomCurrentNumberRef = useRef<number | null>(room.currentNumber);
  const lastSelectedNumberRef = useRef<number | null>(null);
  const playerMarkedRef = useRef<boolean[][]>(playerMarked);
  const roomCodeRef = useRef<string>(room.code);
  const roomModeRef = useRef<GameMode>(room.mode);

  useEffect(() => { roomModeRef.current = room.mode; }, [room.mode]);
  useEffect(() => { currentRoleRef.current = role; }, [role]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { playerCardRef.current = playerCard; }, [playerCard]);
  useEffect(() => { roomCurrentNumberRef.current = room.currentNumber; }, [room.currentNumber]);
  useEffect(() => { playerMarkedRef.current = playerMarked; }, [playerMarked]);
  useEffect(() => { roomCodeRef.current = room.code; }, [room.code]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ---- Handlers ----
  const handleSelectRole = useCallback((selectedRole: Role) => {
    resumeAudio(); // Enable audio on first user gesture
    setRole(selectedRole);
    setCurrentView(selectedRole === 'master' ? 'masterCreate' : 'studentJoin');
  }, []);

  const handleCreateRoom = useCallback((gridSize: number, numberRange: [number, number], mode: GameMode, freeCell: boolean) => {
    setIsCreatingRoom(true);
    emit(CLIENT_EVENTS.CREATE_ROOM, { gridSize, numberRange, mode, freeCell });
  }, [emit]);

  const handleStartGame = useCallback((roomId: string) => {
    console.log('[UI] Starting game, roomId:', roomId, 'mode:', room.mode);
    emit(CLIENT_EVENTS.START_GAME, { roomId, mode: room.mode });
  }, [emit, room.mode]);

  const handleNextNumber = useCallback((roomId: string) => {
    emit(CLIENT_EVENTS.NEXT_NUMBER, { roomId });
  }, [emit]);

  const handleEndGame = useCallback((roomId: string) => {
    emit(CLIENT_EVENTS.LEAVE_ROOM, { roomId });
  }, [emit]);

  const handleJoinRoom = useCallback((code: string, name: string, avatar: string) => {
    console.log('[UI] Joining room:', code, 'as', name);
    setPlayerName(name);
    setPlayerAvatar(avatar);
    setRoom((prev) => ({ ...prev, code }));
    emit(CLIENT_EVENTS.JOIN_ROOM, { code, name, avatar });
  }, [emit]);

  const handleSelectNumber = useCallback((number: number) => {
    lastSelectedNumberRef.current = number;
    if (room.id) {
      emit(CLIENT_EVENTS.SELECT_NUMBER, { roomId: room.id, number });
    }
  }, [emit, room.id]);

  const handleAnswerSequence = useCallback((answer: number) => {
    if (room.id) {
      emit(CLIENT_EVENTS.ANSWER_SEQUENCE, { roomId: room.id, answer });
    }
  }, [emit, room.id]);

  const handleAnswerComparison = useCallback((answer: boolean) => {
    if (room.id) {
      emit(CLIENT_EVENTS.ANSWER_COMPARISON, { roomId: room.id, answer });
    }
  }, [emit, room.id]);

  const handlePlayAgain = useCallback(() => {
    setRole('student'); setPlayerName(''); setPlayerAvatar('panda'); setPlayerId('');
    setPlayerScore(0); setPlayerCard([]); setPlayerMarked([]);
    setRoom({ id: '', code: '', players: [], calledNumbers: [], currentNumber: null, ranking: [], gridSize: 3, numberRange: [0, 100], mode: 'classic', freeCell: true });
    setComparisonTarget(undefined); setComparisonOperator(undefined);
    setDecadeStart(undefined); setDecadeEnd(undefined);
    setSequenceType(undefined); setSequencePrompt(undefined);
    setSequenceOptions([]); setSequenceAnsweredCorrectly(false);
    setShowConfetti(false); setCurrentView('roleSelection');
  }, []);

  const handleBackToRoles = useCallback(() => { setCurrentView('roleSelection'); }, []);

  const [initialRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && roomParam.length === 4) return roomParam;
    }
    return '';
  });

  const handleConnected = useCallback(() => {
    if (initialRoomCode) { setRole('student'); setCurrentView('studentJoin'); }
    else { setCurrentView('roleSelection'); }
  }, [initialRoomCode]);

  // ---- Socket event listeners ----
  function registerAllListeners(socket: any) {
    console.log('[Events] Registering all Socket.io listeners on socket:', socket.id);

    socket.on(SERVER_EVENTS.ROOM_CREATED, (payload: RoomCreatedPayload) => {
      console.log('[Event] roomCreated:', payload);
      setRoom((prev) => ({
        ...prev,
        id: payload.roomId,
        code: payload.code,
        gridSize: payload.config?.gridSize || prev.gridSize,
        numberRange: payload.config?.numberRange || prev.numberRange,
        mode: payload.mode || prev.mode,
        freeCell: payload.config?.freeCell ?? prev.freeCell,
      }));
      setIsCreatingRoom(false);
      setCurrentView('masterLobby');
    });

    socket.on(SERVER_EVENTS.PLAYER_JOINED, (payload: PlayerJoinedPayload) => {
      console.log('[Event] playerJoined:', payload.player.name, 'roomId:', payload.roomId, 'totalPlayers:', payload.players?.length);
      setRoom((prev) => ({
        ...prev,
        id: payload.roomId || prev.id, // Set room.id for students so they can emit events
        // Use the full player list from the server when available,
        // so that joining students see players who joined before them
        players: payload.players
          ? payload.players
          : [...prev.players.filter((p) => p.id !== payload.player.id), payload.player],
      }));
      if (currentRoleRef.current === 'student' && payload.player.name === playerNameRef.current) {
        playJoined();
        setPlayerId(payload.player.id); // Save playerId for reconnection
        setCurrentView('studentLobby');
      }
    });

    socket.on(SERVER_EVENTS.PLAYER_LEFT, (payload: PlayerLeftPayload) => {
      setRoom((prev) => ({ ...prev, players: prev.players.filter((p) => p.id !== payload.playerId) }));
    });

    socket.on(SERVER_EVENTS.GAME_STARTED, (payload: GameStartedPayload) => {
      console.log('[Event] gameStarted, role:', currentRoleRef.current, 'card:', payload.card, 'numberRange:', payload.numberRange, 'mode:', payload.mode);
      if (currentRoleRef.current === 'student') {
        setPlayerCard(payload.card);
        // Initialize marked grid: FREE cells (value -1) are pre-marked as true
        setPlayerMarked(payload.card.map((row: number[]) => row.map((n: number) => n === -1)));
        setPlayerScore(0);
        setRoom((prev) => ({
          ...prev, calledNumbers: payload.calledNumbers,
          currentNumber: null,
          gridSize: payload.gridSize || payload.card.length,
          numberRange: payload.numberRange || prev.numberRange,
          mode: payload.mode || 'classic',
          freeCell: payload.freeCell ?? prev.freeCell,
        }));
        setCurrentView('studentGame');
      } else {
        setRoom((prev) => ({
          ...prev, calledNumbers: payload.calledNumbers,
          currentNumber: null,
          gridSize: payload.gridSize || prev.gridSize,
          numberRange: payload.numberRange || prev.numberRange,
          mode: payload.mode || 'classic',
          freeCell: payload.freeCell ?? prev.freeCell,
        }));
        setCurrentView('masterGame');
      }
      // Reset comparison state for new game
      setComparisonTarget(undefined);
      setComparisonOperator(undefined);
    });

    socket.on(SERVER_EVENTS.NEW_NUMBER, (payload: NewNumberPayload) => {
      console.log('[Event] newNumber:', payload.number, 'mode data:', { comparison: payload.comparisonOperator, decade: payload.decadeStart, sequence: payload.sequenceType });
      playNumberCalled();
      // In sequence/comparison mode, students must answer before knowing the number — don't spoil it via TTS.
      // The teacher (master) always hears the number; students hear it after answering correctly.
      const currentMode = roomModeRef.current;  // ← siempre tiene el valor actual
      if ((currentMode === 'sequence' || currentMode === 'comparison') && currentRoleRef.current === 'master') {
        speakNumber(payload.number);  // solo el docente escucha
      } else if (currentMode !== 'sequence' && currentMode !== 'comparison') {
        speakNumber(payload.number);  // otros modos: todos escuchan
      }
      // Estudiantes en sequence/comparison: no escuchan nada (deben responder primero)
      setRoom((prev) => ({
        ...prev, currentNumber: payload.number,
        calledNumbers: [...prev.calledNumbers, payload.number],
      }));
      // Update comparison data if present
      if (payload.comparisonTarget !== undefined && payload.comparisonOperator !== undefined) {
        setComparisonTarget(payload.comparisonTarget);
        setComparisonOperator(payload.comparisonOperator);
      } else {
        setComparisonTarget(undefined);
        setComparisonOperator(undefined);
      }
      // Update decade data if present (tens mode)
      if (payload.decadeStart !== undefined) {
        setDecadeStart(payload.decadeStart);
        setDecadeEnd(payload.decadeEnd);
      } else {
        setDecadeStart(undefined);
        setDecadeEnd(undefined);
      }
      // Update sequence data if present (sequence mode)
      if (payload.sequenceType !== undefined && payload.sequencePrompt !== undefined) {
        setSequenceType(payload.sequenceType);
        setSequencePrompt(payload.sequencePrompt);
      } else {
        setSequenceType(undefined);
        setSequencePrompt(undefined);
      }
      if (payload.sequenceOptions && payload.sequenceOptions.length > 0) {
        setSequenceOptions(payload.sequenceOptions);
      } else {
        setSequenceOptions([]);
      }
      setSequenceAnsweredCorrectly(false);
      setComparisonAnsweredCorrectly(false);
      setAnsweredCurrentQuestion(false);
    });

    socket.on(SERVER_EVENTS.SELECTION_RESULT, (payload: SelectionResultPayload) => {
      if (payload.correct) {
        // Use the number the student actually selected (not currentNumber),
        // because the student can now mark ANY previously called number
        const numberToMark = lastSelectedNumberRef.current;
        const card = playerCardRef.current;
        if (numberToMark !== null && card.length > 0) {
          let markedRow = -1, markedCol = -1;
          setPlayerMarked((prev) => {
            const newMarked = prev.map((row) => [...row]);
            for (let r = 0; r < card.length; r++) {
              for (let c = 0; c < card[r].length; c++) {
                if (card[r][c] === numberToMark) {
                  newMarked[r][c] = true;
                  markedRow = r;
                  markedCol = c;
                }
              }
            }
            return newMarked;
          });
          // Show floating points near the marked cell
          if (markedRow >= 0 && markedCol >= 0 && payload.points > 0) {
            setLastScoreEvent({ row: markedRow, col: markedCol, points: payload.points });
            setTimeout(() => setLastScoreEvent(null), 1200);
          }
        }
        setPlayerScore(payload.totalScore);
        showToast(payload.message, 'success');
        playCorrect();
        lastSelectedNumberRef.current = null;
      } else {
        showToast(payload.message, 'info');
        playIncorrect();
      }
    });

    socket.on(SERVER_EVENTS.SEQUENCE_RESULT, (payload: SequenceResultPayload) => {
      console.log('[Event] sequenceResult:', payload);
      if (payload.correct) {
        setSequenceAnsweredCorrectly(true);
        setPlayerScore(payload.totalScore);
        showToast(payload.message, 'success');
        setAnsweredCurrentQuestion(true);
        playCorrect();
        // Now that the student answered correctly, speak the number aloud
        if (payload.correctAnswer !== undefined) {
          speakNumber(payload.correctAnswer);
        }
      } else {
        showToast(payload.message, 'info');
        playIncorrect();
      }
    });

    socket.on(SERVER_EVENTS.COMPARISON_RESULT, (payload: ComparisonResultPayload) => {
      console.log('[Event] comparisonResult:', payload);
      if (payload.correct) {
        setComparisonAnsweredCorrectly(true);
        setPlayerScore(payload.totalScore);
        showToast(payload.message, 'success');
        setAnsweredCurrentQuestion(true);
        playCorrect();
        // Now that the student answered correctly, speak the number aloud
        if (room.currentNumber !== null) {
          speakNumber(room.currentNumber);
        }
      } else {
        showToast(payload.message, 'info');
        playIncorrect();
      }
    });

    socket.on(SERVER_EVENTS.LINE_COMPLETED, (payload: LineCompletedPayload) => {
      playLineCompleted();
      showToast(`¡${payload.playerName} — ${payload.message} +${payload.bonus} PTS`, 'success');

      // Highlight the completed line on the student's card
      // We need to figure out which specific line was completed from the student's marked grid
      if (currentRoleRef.current === 'student' && playerCardRef.current.length > 0) {
        const card = playerCardRef.current;
        const gridSize = card.length;
        const marked = playerMarkedRef.current;
        const newLines: string[] = [];

        if (payload.type === 'row') {
          for (let r = 0; r < gridSize; r++) {
            if (marked[r]?.every((m: boolean) => m)) newLines.push(`row-${r}`);
          }
        } else if (payload.type === 'column') {
          for (let c = 0; c < gridSize; c++) {
            let complete = true;
            for (let r = 0; r < gridSize; r++) {
              if (!marked[r]?.[c]) { complete = false; break; }
            }
            if (complete) newLines.push(`col-${c}`);
          }
        } else if (payload.type === 'diagonal') {
          let d0Complete = true, d1Complete = true;
          for (let i = 0; i < gridSize; i++) {
            if (!marked[i]?.[i]) d0Complete = false;
            if (!marked[i]?.[gridSize - 1 - i]) d1Complete = false;
          }
          if (d0Complete) newLines.push('diag-0');
          if (d1Complete) newLines.push('diag-1');
        }

        if (newLines.length > 0) {
          setCompletedLines(newLines);
          setTimeout(() => setCompletedLines([]), 3000);
        }
      }
    });

    socket.on(SERVER_EVENTS.BINGO, (payload: BingoPayload) => {
      playBingo();
      setShowConfetti(true);
      const isSelf = currentRoleRef.current === 'student' && payload.playerName === playerNameRef.current;
      setBingoOverlay({ playerName: payload.playerName, points: payload.points, isSelf });
      showToast(`¡BINGO! ¡${payload.playerName} GANÓ! +${payload.points} PTS`, 'success');
      setTimeout(() => setShowConfetti(false), 6000);
    });

    socket.on(SERVER_EVENTS.RANKING_UPDATE, (payload: RankingUpdatePayload) => {
      setRoom((prev) => ({ ...prev, ranking: payload.ranking }));
    });

    socket.on(SERVER_EVENTS.GAME_ENDED, (payload: GameEndedPayload) => {
      setRoom((prev) => ({ ...prev, ranking: payload.results }));
      setCurrentView('results');
    });

    socket.on(SERVER_EVENTS.ERROR, (payload: ErrorPayload) => {
      console.log('[Event] error:', payload);
      showToast(payload.message, 'error');
    });

    socket.on(SERVER_EVENTS.RECONNECTED, (payload: ReconnectedPayload) => {
      console.log('[Event] reconnected — score:', payload.score, 'calledNumbers:', payload.calledNumbers.length);
      // Restore game state after reconnection
      setPlayerScore(payload.score);
      setPlayerMarked(payload.marked);
      setRoom((prev) => ({
        ...prev,
        calledNumbers: payload.calledNumbers,
        currentNumber: payload.calledNumbers.length > 0 ? payload.calledNumbers[payload.calledNumbers.length - 1] : null,
      }));
      showToast('¡RECONECTADO! SEGUÍ JUGANDO.', 'success');
    });

    // ---- Socket disconnect/reconnect handling ----
    socket.on('disconnect', (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
      if (currentRoleRef.current === 'student' && roomCodeRef.current && currentView === 'studentGame') {
        showToast('SE PERDIÓ LA CONEXIÓN. INTENTANDO RECONECTAR...', 'error');
      }
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      // If we were a student in a game, try to rejoin with our playerId
      if (currentRoleRef.current === 'student' && roomCodeRef.current && playerIdRef.current) {
        socket.emit(CLIENT_EVENTS.REJOIN_ROOM, {
          code: roomCodeRef.current,
          playerId: playerIdRef.current,
        });
      }
    });
  }

  // Register once when the socket connects
  useEffect(() => {
    let registered = false;

    const tryRegister = () => {
      if (registered) return;
      const socket = getActiveSocket();
      if (socket && socket.connected) {
        registerAllListeners(socket);
        registered = true;
      }
    };

    tryRegister();
    const interval = setInterval(tryRegister, 300);
    const timeout = setTimeout(() => { clearInterval(interval); }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      const socket = getActiveSocket();
      if (socket) {
        Object.values(SERVER_EVENTS).forEach(event => {
          socket.removeAllListeners(event);
        });
      }
    };
  }, [connectionState, showToast]);

  // ---- Render current view ----
  const renderView = () => {
    switch (currentView) {
      case 'waking':
        return <WakingServer onConnected={handleConnected} connectionState={connectionState} />;
      case 'roleSelection':
        return <RoleSelection onSelectRole={handleSelectRole} />;
      case 'studentJoin':
        return <StudentJoin onJoin={handleJoinRoom} onBack={handleBackToRoles} initialCode={initialRoomCode} />;
      case 'studentLobby':
        return <StudentLobby playerName={playerName} playerAvatar={playerAvatar} players={room.players} roomCode={room.code} />;
      case 'studentGame':
        return <StudentGame
          card={playerCard}
          marked={playerMarked}
          score={playerScore}
          currentNumber={room.currentNumber}
          calledNumbers={room.calledNumbers}
          numberIndex={room.calledNumbers.length - 1}
          ranking={room.ranking}
          playerName={playerName}
          playerAvatar={playerAvatar}
          players={room.players}
          onSelectNumber={handleSelectNumber}
          onAnswerSequence={handleAnswerSequence}
          onAnswerComparison={handleAnswerComparison}
          sequenceOptions={sequenceOptions}
          sequenceAnsweredCorrectly={sequenceAnsweredCorrectly}
          comparisonAnsweredCorrectly={comparisonAnsweredCorrectly}
          comparisonTarget={comparisonTarget}
          comparisonOperator={comparisonOperator}
          mode={room.mode}
          highlightLines={completedLines}
          decadeStart={decadeStart}
          decadeEnd={decadeEnd}
          sequenceType={sequenceType}
          sequencePrompt={sequencePrompt}
          lastScoreEvent={lastScoreEvent}
          answeredCurrentQuestion={answeredCurrentQuestion}
        />;
      case 'masterCreate':
        return <MasterCreate onCreateRoom={handleCreateRoom} onBack={handleBackToRoles} isLoading={isCreatingRoom} />;
      case 'masterLobby':
        return <MasterLobby roomCode={room.code} roomId={room.id} players={room.players} onStartGame={handleStartGame} gridSize={room.gridSize} numberRange={room.numberRange} mode={room.mode} freeCell={room.freeCell} />;
      case 'masterGame':
        return <MasterGame
          roomId={room.id}
          currentNumber={room.currentNumber}
          numberIndex={room.calledNumbers.length - 1}
          calledNumbers={room.calledNumbers}
          ranking={room.ranking}
          onNextNumber={handleNextNumber}
          onEndGame={handleEndGame}
          playerCount={room.players.length}
          comparisonTarget={comparisonTarget}
          comparisonOperator={comparisonOperator}
          mode={room.mode}
          decadeStart={decadeStart}
          decadeEnd={decadeEnd}
          sequenceType={sequenceType}
          sequencePrompt={sequencePrompt}
        />;
      case 'results':
        return <ResultsScreen results={room.ranking} onPlayAgain={handlePlayAgain} playerName={playerName} />;
      default:
        return <RoleSelection onSelectRole={handleSelectRole} />;
    }
  };

  return (
    <main className="min-h-screen">
      <ConfettiEffect active={showConfetti} />
      {bingoOverlay && (
        <BingoOverlay
          playerName={bingoOverlay.playerName}
          points={bingoOverlay.points}
          isSelf={bingoOverlay.isSelf}
          onDismiss={() => setBingoOverlay(null)}
        />
      )}
      <div key={currentView} className="animate-view-fade-in">
        {renderView()}
      </div>
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-lg font-bold text-center max-w-xs animate-toast-in ${
          toast.type === 'success' ? 'bg-emerald-500 text-white'
            : toast.type === 'error' ? 'bg-red-400 text-white'
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
