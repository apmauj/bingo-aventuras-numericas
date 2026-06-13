// ============================================================
// Bingo Card Component (3x3 / 4x4 / 5x5 / 6x6 grid)
// ============================================================

'use client';

import React from 'react';
import { FREE_CELL } from '@/types/bingo';

interface BingoCardProps {
  card: number[][];
  marked: boolean[][];
  onCellClick: (number: number, row: number, col: number) => void;
  disabled?: boolean;
  highlightLines?: string[]; // e.g. ["row-0", "col-2"]
  shakeCell?: { row: number; col: number } | null;
  sparkleCell?: { row: number; col: number } | null;
  floatingPoints?: { row: number; col: number; points: number } | null;
}

export function BingoCard({
  card,
  marked,
  onCellClick,
  disabled = false,
  highlightLines = [],
  shakeCell = null,
  sparkleCell = null,
  floatingPoints = null,
}: BingoCardProps) {
  const gridSize = card.length;

  // Dynamic sizing based on grid size — smaller cells for larger grids
  const cellMinSize = gridSize <= 4 ? 'min-h-[60px] min-w-[60px]' : gridSize === 5 ? 'min-h-[50px] min-w-[50px]' : 'min-h-[44px] min-w-[44px]';
  const cellFontSize = gridSize <= 4 ? 'text-xl' : gridSize === 5 ? 'text-lg' : 'text-base';
  const starSize = gridSize <= 4 ? 'text-3xl' : gridSize === 5 ? 'text-2xl' : 'text-xl';
  const gapClass = gridSize <= 4 ? 'gap-2' : 'gap-1.5';
  const maxWClass = gridSize <= 4 ? 'max-w-sm' : gridSize === 5 ? 'max-w-md' : 'max-w-md';

  const isHighlighted = (row: number, col: number): boolean => {
    return highlightLines.some((line) => {
      if (line.startsWith('row-')) {
        const rowNum = parseInt(line.split('-')[1]);
        return rowNum === row;
      }
      if (line.startsWith('col-')) {
        const colNum = parseInt(line.split('-')[1]);
        return colNum === col;
      }
      if (line.startsWith('diag-')) {
        const diagNum = parseInt(line.split('-')[1]);
        if (diagNum === 0) return row === col; // top-left → bottom-right
        if (diagNum === 1) return row + col === gridSize - 1; // top-right → bottom-left
      }
      return false;
    });
  };

  const isShaking = (row: number, col: number) =>
    shakeCell?.row === row && shakeCell?.col === col;

  const isSparkling = (row: number, col: number) =>
    sparkleCell?.row === row && sparkleCell?.col === col;

  return (
    <div
      className={`grid ${gapClass} w-full ${maxWClass} mx-auto`}
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      role="grid"
      aria-label={`Cartón de bingo ${gridSize}x${gridSize}`}
    >
      {card.map((row, rowIdx) =>
        row.map((number, colIdx) => {
          const isFreeCell = number === FREE_CELL;
          const isMarked = marked[rowIdx]?.[colIdx] ?? false;
          const highlighted = isHighlighted(rowIdx, colIdx);
          const shaking = isShaking(rowIdx, colIdx);
          const sparkling = isSparkling(rowIdx, colIdx);

          // FREE cell — always marked, special styling (⭐ star for kids)
          if (isFreeCell) {
            return (
              <button
                key={`${rowIdx}-${colIdx}`}
                disabled
                className={`
                  relative aspect-square ${cellMinSize} rounded-xl font-bold
                  flex items-center justify-center transition-all duration-200
                  select-none cursor-default
                  bg-gradient-to-br from-emerald-300 to-teal-400 text-white shadow-md
                  ${highlighted ? 'ring-2 ring-emerald-300 scale-105' : ''}
                `}
                role="button"
                aria-label="Celda estrella - marcada automáticamente"
                aria-pressed={true}
              >
                <span className={`${starSize}`}>⭐</span>
              </button>
            );
          }

          return (
            <button
              key={`${rowIdx}-${colIdx}`}
              onClick={() => !isMarked && !disabled && onCellClick(number, rowIdx, colIdx)}
              disabled={isMarked || disabled}
              className={`
                relative aspect-square ${cellMinSize} rounded-xl font-bold ${cellFontSize}
                flex items-center justify-center transition-all duration-200
                cursor-pointer select-none
                ${isMarked
                  ? highlighted
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg ring-2 ring-emerald-300 scale-105'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md scale-105'
                  : 'bg-white border-2 border-amber-200 text-amber-900 hover:border-amber-400 hover:shadow-md active:scale-95'
                }
                ${shaking ? 'animate-shake' : ''}
                ${sparkling ? 'animate-sparkle-cell' : ''}
                ${disabled && !isMarked ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              role="button"
              aria-label={
                isMarked
                  ? `Número ${number} - marcado`
                  : `Número ${number} - no marcado`
              }
              aria-pressed={isMarked}
            >
              <span className={isMarked ? 'relative z-10' : ''}>{number}</span>

              {/* Marked indicator */}
              {isMarked && (
                <span className="absolute inset-0 flex items-center justify-center text-white/30 text-3xl pointer-events-none">
                  ★
                </span>
              )}

              {/* Sparkle effect */}
              {sparkling && (
                <span className="absolute -top-1 -right-1 text-yellow-400 animate-sparkle text-lg">✦</span>
              )}

              {/* Floating points text (+10, +50, +200) */}
              {floatingPoints && floatingPoints.row === rowIdx && floatingPoints.col === colIdx && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 font-black text-emerald-500 text-lg whitespace-nowrap animate-float-points z-20"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                  aria-hidden="true"
                >
                  +{floatingPoints.points}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
