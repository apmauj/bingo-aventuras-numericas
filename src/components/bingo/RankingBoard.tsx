// ============================================================
// Ranking Board Component
// ============================================================

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { RankingEntry } from '@/types/bingo';
import { AVATARS } from '@/types/bingo';
import { Trophy } from 'lucide-react';

interface RankingBoardProps {
  ranking: RankingEntry[];
  title?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankingBoard({ ranking, title = 'Ranking' }: RankingBoardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-bold text-amber-800">{title}</h3>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {ranking.map((entry, idx) => {
          const avatarEmoji = AVATARS.find((a) => a.id === entry.avatar)?.emoji || '🐼';
          const medal = idx < 3 ? MEDALS[idx] : null;

          return (
            <Card
              key={`${entry.name}-${idx}`}
              className={`border transition-all ${
                idx === 0
                  ? 'border-amber-300 bg-amber-50 shadow-sm'
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
  );
}
