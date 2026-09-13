// ============================================================
// Master Game Control Component
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NumberDisplay } from './NumberDisplay';
import { RankingBoard } from './RankingBoard';
import type { RankingEntry, ComparisonOperator, GameMode, SequenceType } from '@/types/bingo';
import { AUTO_ADVANCE_MAX_SECONDS, AUTO_ADVANCE_MIN_SECONDS, DEFAULT_AUTO_ADVANCE_SECONDS, clampAutoAdvanceSeconds, getExpectedCallCount } from '@/lib/bingo-config';
import { scrollToLatest } from '@/lib/number-history';
import { ArrowRight, Square, History, Users, Volume2, VolumeX } from 'lucide-react';
import { isTtsEnabled, setTtsEnabled } from './SoundFX';

interface MasterGameProps {
  roomId: string;
  currentNumber: number | null;
  numberIndex: number;
  calledNumbers: number[];
  numberAssistanceEnabled: boolean;
  ranking: RankingEntry[];
  onNextNumber: (roomId: string) => void;
  onNumberAssistanceChange: (roomId: string, enabled: boolean) => void;
  onEndGame: (roomId: string) => void;
  playerCount: number;
  numberRange: [number, number];
  comparisonTarget?: number;
  comparisonOperator?: ComparisonOperator;
  mode?: GameMode;
  decadeStart?: number;
  decadeEnd?: number;
  sequenceType?: SequenceType;
  sequencePrompt?: number;
}

export function MasterGame({
  roomId,
  currentNumber,
  numberIndex,
  calledNumbers,
  numberAssistanceEnabled,
  ranking,
  onNextNumber,
  onNumberAssistanceChange,
  onEndGame,
  playerCount,
  numberRange,
  comparisonTarget,
  comparisonOperator,
  mode = 'classic',
  decadeStart,
  decadeEnd,
  sequenceType,
  sequencePrompt,
}: MasterGameProps) {
  const [ttsOn, setTtsOn] = React.useState(isTtsEnabled());
  const [autoAdvance, setAutoAdvance] = React.useState(false);
  const [autoIntervalSeconds, setAutoIntervalSeconds] = React.useState(DEFAULT_AUTO_ADVANCE_SECONDS);
  const [secondsUntilNext, setSecondsUntilNext] = React.useState(DEFAULT_AUTO_ADVANCE_SECONDS);
  const autoElapsedSecondsRef = React.useRef(0);

  const expectedCallCount = React.useMemo(
    () => getExpectedCallCount(mode, numberRange),
    [mode, numberRange],
  );
  const hasNumbersRemaining = calledNumbers.length < expectedCallCount;

  React.useEffect(() => {
    if (!autoAdvance || !hasNumbersRemaining) return;

    autoElapsedSecondsRef.current = 0;
    const timer = window.setInterval(() => {
      autoElapsedSecondsRef.current += 1;
      if (autoElapsedSecondsRef.current >= autoIntervalSeconds) {
        autoElapsedSecondsRef.current = 0;
        setSecondsUntilNext(autoIntervalSeconds);
        onNextNumber(roomId);
      } else {
        setSecondsUntilNext(autoIntervalSeconds - autoElapsedSecondsRef.current);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autoAdvance, autoIntervalSeconds, hasNumbersRemaining, onNextNumber, roomId]);

  const calledNumbersHistoryRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollToLatest(calledNumbersHistoryRef.current);
  }, [calledNumbers.length]);

  const handleAutoAdvanceChange = (checked: boolean) => {
    setAutoAdvance(checked && hasNumbersRemaining);
    autoElapsedSecondsRef.current = 0;
    setSecondsUntilNext(autoIntervalSeconds);
  };

  const handleAutoIntervalChange = (value: number) => {
    const nextInterval = clampAutoAdvanceSeconds(value);
    setAutoIntervalSeconds(nextInterval);
    autoElapsedSecondsRef.current = 0;
    setSecondsUntilNext(nextInterval);
  };

  const handleNextNumber = () => {
    if (!hasNumbersRemaining) return;
    onNextNumber(roomId);
    autoElapsedSecondsRef.current = 0;
    setSecondsUntilNext(autoIntervalSeconds);
  };

  const toggleTts = () => {
    const next = !ttsOn;
    setTtsEnabled(next);
    setTtsOn(next);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-4">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{playerCount} JUGADORES</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTts}
            className={`p-1.5 rounded-lg transition-colors ${ttsOn ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            aria-label={ttsOn ? 'SILENCIAR VOZ' : 'ACTIVAR VOZ'}
            title={ttsOn ? 'SILENCIAR VOZ' : 'ACTIVAR VOZ'}
          >
            {ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onEndGame(roomId)}
            className="bg-red-400 hover:bg-red-500 text-white text-xs"
            aria-label="Terminar partida"
          >
            <Square className="w-3 h-3 mr-1" />
            TERMINAR
          </Button>
        </div>
      </div>

      {/* Current number - big display */}
      <div className="mb-6">
        <NumberDisplay
          number={currentNumber}
          index={numberIndex}
          label="NÚMERO ACTUAL"
          size="lg"
          comparisonTarget={comparisonTarget}
          comparisonOperator={comparisonOperator}
          mode={mode}
          decadeStart={decadeStart}
          decadeEnd={decadeEnd}
          sequenceType={sequenceType}
          sequencePrompt={sequencePrompt}
        />
      </div>

      {/* Unattended number selection */}
      <Card className="w-full max-w-md border-orange-200 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-orange-700">ELECCIÓN DESATENDIDA</p>
              <p className="text-[11px] text-orange-500" aria-live="polite">
                {!hasNumbersRemaining
                  ? 'NO QUEDAN NÚMEROS EN EL RANGO'
                  : autoAdvance
                    ? `PRÓXIMO NÚMERO EN ${secondsUntilNext} S`
                    : 'ACTIVÁ EL REVELADO AUTOMÁTICO'}
              </p>
            </div>
            <Switch
              checked={autoAdvance && hasNumbersRemaining}
              onCheckedChange={handleAutoAdvanceChange}
              disabled={!hasNumbersRemaining}
              aria-label="Activar elección desatendida"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={AUTO_ADVANCE_MIN_SECONDS}
              max={AUTO_ADVANCE_MAX_SECONDS}
              step={1}
              value={autoIntervalSeconds}
              onChange={(event) => handleAutoIntervalChange(Number(event.target.value))}
              className="flex-1 accent-orange-500"
              aria-label="Intervalo de elección desatendida en segundos"
            />
            <label className="flex items-center gap-1 text-xs font-semibold text-orange-700">
              <input
                type="number"
                min={AUTO_ADVANCE_MIN_SECONDS}
                max={AUTO_ADVANCE_MAX_SECONDS}
                step={1}
                value={autoIntervalSeconds}
                onChange={(event) => handleAutoIntervalChange(Number(event.target.value))}
                className="w-14 rounded-md border border-orange-200 px-1 py-1 text-center text-orange-800 focus:border-orange-500 focus:outline-none"
                aria-label="Segundos entre números"
              />
              S
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Number assistance toggle */}
      <Card className="w-full max-w-md border-emerald-200 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-700">ASISTENCIA DE NÚMEROS</p>
              <p className="text-[11px] text-emerald-600">
                {numberAssistanceEnabled
                  ? 'LOS ESTUDIANTES VEN SUS NÚMEROS PENDIENTES'
                  : 'AVISAR A LOS ESTUDIANTES SI TIENEN NÚMEROS SIN MARCAR'}
              </p>
            </div>
            <Switch
              checked={numberAssistanceEnabled}
              onCheckedChange={(checked) => onNumberAssistanceChange(roomId, checked)}
              aria-label="Activar asistencia de números"
            />
          </div>
        </CardContent>
      </Card>

      {/* Next number button */}
      <Button
        onClick={handleNextNumber}
        disabled={!hasNumbersRemaining}
        className="w-full max-w-md h-16 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl mb-6 transition-all duration-200 active:scale-95"
        aria-label="Llamar siguiente número"
      >
        <ArrowRight className="w-6 h-6 mr-2" />
        SIGUIENTE NÚMERO
      </Button>

      {/* Called numbers history */}
      <Card className="w-full max-w-md border-amber-200 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">
              NÚMEROS LLAMADOS ({calledNumbers.length})
            </span>
          </div>
          <div ref={calledNumbersHistoryRef} className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {calledNumbers.length === 0 ? (
              <span className="text-xs text-amber-400">PRESIONÁ &quot;SIGUIENTE NÚMERO&quot; PARA EMPEZAR</span>
            ) : (
              calledNumbers.map((num, idx) => (
                <span
                  key={`${num}-${idx}`}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${
                    idx === calledNumbers.length - 1
                      ? 'bg-amber-400 text-white animate-bounce-number'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {num}
                </span>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live ranking */}
      {ranking.length > 0 && (
        <div className="w-full max-w-md">
          <RankingBoard ranking={ranking} title="RANKING EN VIVO" />
        </div>
      )}
    </div>
  );
}
