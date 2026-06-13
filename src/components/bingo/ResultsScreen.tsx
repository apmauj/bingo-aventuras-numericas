// ============================================================
// Results Screen Component
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PipoMascot } from './PipoMascot';
import { ConfettiEffect } from './ConfettiEffect';
import type { RankingEntry } from '@/types/bingo';
import { AVATARS } from '@/types/bingo';
import { Trophy, RotateCcw } from 'lucide-react';

interface ResultsScreenProps {
  results: RankingEntry[];
  onPlayAgain: () => void;
  playerName?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function ResultsScreen({ results, onPlayAgain, playerName }: ResultsScreenProps) {
  const [showConfetti, setShowConfetti] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const playerRank = playerName
    ? results.findIndex((r) => r.name === playerName) + 1
    : 0;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 px-4 py-6">
      <ConfettiEffect active={showConfetti} />

      {/* Pipo celebrating */}
      <div className="mb-4 animate-pipo-breathe">
        <PipoMascot mood="celebrating" size={120} />
      </div>

      <h1 className="text-3xl font-extrabold text-amber-800 mb-2">¡FIN DEL JUEGO!</h1>

      {playerRank > 0 && playerRank <= 3 && (
        <p className="text-lg font-bold text-amber-600 mb-1">
          {MEDALS[playerRank - 1]} ¡QUEDASTE EN POSICIÓN {playerRank}!
        </p>
      )}

      <p className="text-sm text-amber-600 mb-6 text-center">
        ¡TODOS ESTÁN MUY CERCA DEL TESORO! 🏴‍☠️✨
      </p>

      {/* Podium for top 3 */}
      {results.length >= 1 && (
        <div className="flex items-end justify-center gap-3 mb-6 w-full max-w-md">
          {/* 2nd place */}
          {results.length >= 2 && (
            <div className="flex flex-col items-center flex-1">
              <span className="text-3xl mb-1">
                {AVATARS.find((a) => a.id === results[1].avatar)?.emoji || '🐼'}
              </span>
              <span className="text-xs font-bold text-amber-700 truncate max-w-16">
                {results[1].name}
              </span>
              <div className="w-full bg-gray-200 rounded-t-lg mt-1 h-16 flex flex-col items-center justify-center">
                <span className="text-2xl">🥈</span>
                <span className="text-xs font-bold text-gray-600">{results[1].score} pts</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-1">
              {AVATARS.find((a) => a.id === results[0].avatar)?.emoji || '🐼'}
            </span>
            <span className="text-xs font-bold text-amber-700 truncate max-w-16">
              {results[0].name}
            </span>
            <div className="w-full bg-amber-200 rounded-t-lg mt-1 h-24 flex flex-col items-center justify-center">
              <span className="text-3xl">🥇</span>
              <span className="text-xs font-bold text-amber-700">{results[0].score} pts</span>
            </div>
          </div>
          {/* 3rd place */}
          {results.length >= 3 && (
            <div className="flex flex-col items-center flex-1">
              <span className="text-3xl mb-1">
                {AVATARS.find((a) => a.id === results[2].avatar)?.emoji || '🐼'}
              </span>
              <span className="text-xs font-bold text-amber-700 truncate max-w-16">
                {results[2].name}
              </span>
              <div className="w-full bg-orange-200 rounded-t-lg mt-1 h-12 flex flex-col items-center justify-center">
                <span className="text-2xl">🥉</span>
                <span className="text-xs font-bold text-orange-700">{results[2].score} pts</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full ranking */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-amber-800">RANKING FINAL</h3>
        </div>
        <div className="space-y-2">
          {results.map((entry, idx) => {
            const avatarEmoji = AVATARS.find((a) => a.id === entry.avatar)?.emoji || '🐼';
            const medal = idx < 3 ? MEDALS[idx] : null;
            const isPlayer = entry.name === playerName;

            return (
              <Card
                key={`${entry.name}-${idx}`}
                className={`border transition-all ${
                  isPlayer
                    ? 'border-amber-400 bg-amber-50 shadow-md'
                    : 'border-gray-200 bg-white/80'
                }`}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-lg w-7 text-center">
                    {medal || <span className="text-sm text-gray-400">{idx + 1}</span>}
                  </span>
                  <span className="text-2xl">{avatarEmoji}</span>
                  <span className="flex-1 font-medium text-amber-900 truncate">
                    {entry.name}
                    {isPlayer && <span className="text-xs text-amber-500 ml-1">(VOS)</span>}
                  </span>
                  <span className="font-bold text-amber-700 text-sm">
                    {entry.score} pts
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <Card className="w-full max-w-md border-2 border-emerald-200 bg-emerald-50/50 mb-6">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-emerald-700 font-medium">
            🌟 ¡INCREÍBLE PARTICIPACIÓN DE TODOS! CADA NÚMERO ENCONTRADO ES UN PASO MÁS EN LA AVENTURA.
          </p>
        </CardContent>
      </Card>

      {/* Play again */}
      <Button
        onClick={onPlayAgain}
        className="w-full max-w-md h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all duration-200"
        aria-label="Jugar de nuevo"
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        JUGAR DE NUEVO
      </Button>
    </div>
  );
}
