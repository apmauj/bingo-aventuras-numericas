// ============================================================
// Student Game Component (Main bingo gameplay)
// ============================================================

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BingoCard } from './BingoCard';
import { NumberDisplay } from './NumberDisplay';
import { RankingBoard } from './RankingBoard';
import { PipoMascot } from './PipoMascot';
import { ConfettiEffect } from './ConfettiEffect';
import type { PlayerPublic, SelectionResultPayload, LineCompletedPayload, RankingEntry, ComparisonOperator, GameMode, SequenceType } from '@/types/bingo';
import { AVATARS } from '@/types/bingo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Volume2, VolumeX } from 'lucide-react';
import { isTtsEnabled, setTtsEnabled } from './SoundFX';

interface StudentGameProps {
  card: number[][];
  marked: boolean[][];
  score: number;
  currentNumber: number | null;
  calledNumbers: number[];
  numberIndex: number;
  ranking: RankingEntry[];
  playerName: string;
  playerAvatar: string;
  players: PlayerPublic[];
  onSelectNumber: (number: number) => void;
  onAnswerSequence?: (answer: number) => void;
  sequenceOptions?: number[];
  sequenceAnsweredCorrectly?: boolean;
  onAnswerComparison?: (answer: boolean) => void;
  comparisonAnsweredCorrectly?: boolean;
  comparisonTarget?: number;
  comparisonOperator?: ComparisonOperator;
  mode?: GameMode;
  highlightLines?: string[];
  decadeStart?: number;
  decadeEnd?: number;
  sequenceType?: SequenceType;
  sequencePrompt?: number;
  lastScoreEvent?: { row: number; col: number; points: number } | null;
  answeredCurrentQuestion?: boolean;
}

export function StudentGame({
  card,
  marked,
  score,
  currentNumber,
  calledNumbers,
  numberIndex,
  ranking,
  playerName,
  playerAvatar,
  players,
  onSelectNumber,
  onAnswerSequence = () => {},
  sequenceOptions = [],
  sequenceAnsweredCorrectly = false,
  onAnswerComparison = () => {},
  comparisonAnsweredCorrectly = false,
  comparisonTarget,
  comparisonOperator,
  mode = 'classic',
  highlightLines: externalHighlightLines = [],
  decadeStart,
  decadeEnd,
  sequenceType,
  sequencePrompt,
  lastScoreEvent = null,
  answeredCurrentQuestion = false,
}: StudentGameProps) {
  const [shakeCell, setShakeCell] = useState<{ row: number; col: number } | null>(null);
  const [sparkleCell, setSparkleCell] = useState<{ row: number; col: number } | null>(null);
  const [internalHighlightLines, setInternalHighlightLines] = useState<string[]>([]);

  // ---- Score bounce animation ----
  const [displayScore, setDisplayScore] = useState(score);
  const [scoreBouncing, setScoreBouncing] = useState(false);
  const prevScoreRef = useRef(score);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (score === prevScoreRef.current) return;
    const startScore = prevScoreRef.current;
    const endScore = score;
    const duration = 400; // ms
    const startTime = performance.now();
    setScoreBouncing(true);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + (endScore - startScore) * eased);
      setDisplayScore(current);
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayScore(endScore);
        setScoreBouncing(false);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
    prevScoreRef.current = score;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [score]);

  // Merge external highlight lines (from parent) with internal ones
  const highlightLines = [...new Set([...externalHighlightLines, ...internalHighlightLines])];
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [pipoMood, setPipoMood] = useState<'happy' | 'celebrating' | 'thinking'>('happy');
  const [ttsOn, setTtsOn] = useState(isTtsEnabled());

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCellClick = useCallback((number: number, row: number, col: number) => {
    if (marked[row]?.[col]) return;
    onSelectNumber(number);
  }, [marked, onSelectNumber]);

  // Called by parent to handle selection result
  const handleSelectionResult = useCallback((result: SelectionResultPayload) => {
    if (result.correct) {
      // Find the cell that was just marked
      for (let r = 0; r < card.length; r++) {
        for (let c = 0; c < card[r].length; c++) {
          if (card[r][c] === currentNumber) {
            setSparkleCell({ row: r, col: c });
            setTimeout(() => setSparkleCell(null), 800);
            break;
          }
        }
      }
      showToast(result.message, 'success');
      setPipoMood('celebrating');
      setTimeout(() => setPipoMood('happy'), 2000);
    } else {
      // Wrong selection - shake the tapped cell
      for (let r = 0; r < card.length; r++) {
        for (let c = 0; c < card[r].length; c++) {
          if (card[r][c] === currentNumber) {
            setShakeCell({ row: r, col: c });
            setTimeout(() => setShakeCell(null), 600);
            break;
          }
        }
      }
      showToast(result.message, 'info');
      setPipoMood('thinking');
      setTimeout(() => setPipoMood('happy'), 2000);
    }
  }, [card, currentNumber, showToast]);

  const handleLineCompleted = useCallback((line: LineCompletedPayload) => {
    // Determine the actual line key based on the type
    // For student's own card, we find which row/col/diagonal was completed
    const gridSize = card.length;
    const newLines: string[] = [];

    if (line.type === 'row') {
      for (let r = 0; r < gridSize; r++) {
        if (marked[r]?.every((m) => m)) newLines.push(`row-${r}`);
      }
    } else if (line.type === 'column') {
      for (let c = 0; c < gridSize; c++) {
        let complete = true;
        for (let r = 0; r < gridSize; r++) {
          if (!marked[r]?.[c]) { complete = false; break; }
        }
        if (complete) newLines.push(`col-${c}`);
      }
    } else if (line.type === 'diagonal') {
      // Check both diagonals
      let d0Complete = true, d1Complete = true;
      for (let i = 0; i < gridSize; i++) {
        if (!marked[i]?.[i]) d0Complete = false;
        if (!marked[i]?.[gridSize - 1 - i]) d1Complete = false;
      }
      if (d0Complete) newLines.push('diag-0');
      if (d1Complete) newLines.push('diag-1');
    }

    setInternalHighlightLines(newLines);
    const lineLabel = line.type === 'row' ? 'FILA' : line.type === 'column' ? 'COLUMNA' : 'DIAGONAL';
    showToast(`¡${lineLabel} COMPLETADA! +${line.bonus} PTS 🎉`, 'success');
    setTimeout(() => setInternalHighlightLines([]), 3000);
  }, [card, marked, showToast]);

  const handleBingo = useCallback(() => {
    setShowConfetti(true);
    showToast('🎉 ¡BINGO! ¡GANASTE! 🎉', 'success');
    setPipoMood('celebrating');
    setTimeout(() => setShowConfetti(false), 5000);
  }, [showToast]);

  // Expose handlers to parent via ref pattern would be complex,
  // so we pass them back differently. For now, we'll use the
  // parent's direct handling approach in page.tsx

  const toggleTts = useCallback(() => {
    const next = !ttsOn;
    setTtsEnabled(next);
    setTtsOn(next);
  }, [ttsOn]);

  const avatarEmoji = AVATARS.find((a) => a.id === playerAvatar)?.emoji || '🐼';

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-3 py-4">
      <ConfettiEffect active={showConfetti} />

      {/* Top bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{avatarEmoji}</span>
          <span className="font-bold text-amber-800 text-sm">{playerName}</span>
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
          <Badge className={`bg-amber-500 text-white px-3 py-1 text-sm ${scoreBouncing ? 'animate-score-bounce' : ''}`}>
            <Star className="w-3.5 h-3.5 mr-1" />
            {displayScore} PTS
          </Badge>
        </div>
      </div>

      {/* Current number (Cartelera) */}
      <div className="mb-4">
        <NumberDisplay
          number={currentNumber}
          index={numberIndex}
          label="NÚMERO EN CARTELERA"
          size="lg"
          comparisonTarget={comparisonTarget}
          comparisonOperator={comparisonOperator}
          mode={mode}
          decadeStart={decadeStart}
          decadeEnd={decadeEnd}
            sequenceType={sequenceType}
            sequencePrompt={sequencePrompt}
            hideNumber={mode === 'sequence' && !sequenceAnsweredCorrectly}
            hideComparisonAnswer={mode === 'comparison' && !comparisonAnsweredCorrectly}
        />
      </div>

        {/* Comparison mode: SI/NO buttons */}
        {mode === 'comparison' && comparisonTarget !== undefined && !comparisonAnsweredCorrectly && (
          <div className="w-full max-w-sm mb-4">
            {/* Dynamic phrasing depending on operator */}
            {comparisonOperator === '=' ? (
              <p className="text-sm font-bold text-teal-700 text-center mb-3">¿SON IGUALES {currentNumber} Y {comparisonTarget}?</p>
            ) : (
              <p className="text-sm font-bold text-teal-700 text-center mb-3">¿ES {comparisonOperator === '>' ? 'MAYOR' : 'MENOR'} QUE {comparisonTarget}?</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onAnswerComparison(true)}
                className="w-24 h-14 rounded-xl bg-emerald-500 text-white font-bold shadow-md hover:scale-105"
              >SÍ</button>
              <button
                onClick={() => onAnswerComparison(false)}
                className="w-24 h-14 rounded-xl bg-rose-400 text-white font-bold shadow-md hover:scale-105"
              >NO</button>
            </div>
          </div>
        )}

        {/* Comparison answered: invitation to find number */}
        {mode === 'comparison' && comparisonAnsweredCorrectly && currentNumber !== null && (
          <div className="w-full max-w-sm mb-4 animate-view-fade-in">
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl px-4 py-3 text-center shadow-md">
              <p className="text-lg font-bold text-emerald-700">¡RESPUESTA CORRECTA! 🎉</p>
              <p className="text-base font-semibold text-emerald-600">BUSCÁ EL <span className="text-2xl font-extrabold text-emerald-800">{currentNumber}</span> EN TU TABLERO</p>
            </div>
          </div>
        )}

        {/* Sequence mode: multiple choice options */}
        {mode === 'sequence' && sequenceOptions.length > 0 && !sequenceAnsweredCorrectly && (
          <div className="w-full max-w-sm mb-4">
            <p className="text-sm font-bold text-teal-700 text-center mb-3">
              TOCÁ LA RESPUESTA CORRECTA
            </p>
            <div className="flex items-center justify-center gap-3">
              {sequenceOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onAnswerSequence(opt)}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-lg
                    bg-white border-3 border-teal-300 text-teal-700
                    hover:bg-teal-50 hover:border-teal-500 hover:scale-110
                    active:scale-95 transition-all duration-150"
                  aria-label={`Opción ${opt}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sequence mode: answered correctly — invitation to find on card */}
        {mode === 'sequence' && sequenceAnsweredCorrectly && currentNumber !== null && (
          <div className="w-full max-w-sm mb-4 animate-view-fade-in">
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl px-4 py-3 text-center shadow-md">
              <p className="text-lg font-bold text-emerald-700">
                ¡CORRECTO! 🎉
              </p>
              <p className="text-base font-semibold text-emerald-600">
                BUSCÁ EL <span className="text-2xl font-extrabold text-emerald-800">{currentNumber}</span> EN TU TABLERO
              </p>
            </div>
          </div>
        )}

      {/* Pipo mood */}
      <div className="mb-3">
        <PipoMascot mood={pipoMood} size={60} />
      </div>

      {/* Bingo card */}
      <div className="w-full max-w-sm mb-4">
        <BingoCard
          card={card}
          marked={marked}
          onCellClick={handleCellClick}
          highlightLines={highlightLines}
          shakeCell={shakeCell}
          sparkleCell={sparkleCell}
          floatingPoints={lastScoreEvent}
        />
      </div>

      {/* Called numbers history */}
      <Card className="w-full max-w-md border-amber-200 mb-4">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">NÚMEROS LLAMADOS</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {calledNumbers.map((num, idx) => {
                const isLatest = idx === calledNumbers.length - 1;
                const shouldHide = isLatest && !answeredCurrentQuestion
                  && (mode === 'sequence' || mode === 'comparison');

                return (
                  <span
                    key={`${num}-${idx}`}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                      shouldHide
                        ? 'bg-amber-300 text-amber-600'
                        : isLatest
                          ? 'bg-amber-400 text-white'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {shouldHide ? '?' : num}
                  </span>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Mini ranking */}
      {ranking.length > 0 && (
        <div className="w-full max-w-md">
          <RankingBoard ranking={ranking} title="POSICIONES" />
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-2xl shadow-lg font-bold text-center max-w-xs animate-toast-in ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : toast.type === 'error'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Export handler types for parent
export type { SelectionResultPayload, LineCompletedPayload };
