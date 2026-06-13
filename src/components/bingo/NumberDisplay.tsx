// ============================================================
// Number Display Component (Cartelera)
// Supports all game modes:
// - Classic: just a number
// - Comparison: number + comparison prompt ("¿47 ES MAYOR QUE 30?")
// - Even/Odd: number with parity indicator
// - Tens: decade display ("4 DECENAS" with range 40-49)
// - Sequence: number + before/after prompt ("¿QUÉ VIENE DESPUÉS DE 46?")
// ============================================================

'use client';

import React from 'react';
import type { ComparisonOperator, SequenceType, GameMode } from '@/types/bingo';

interface NumberDisplayProps {
  number: number | null;
  index: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  comparisonTarget?: number;
  comparisonOperator?: ComparisonOperator;
  mode?: GameMode;
  decadeStart?: number;
  decadeEnd?: number;
  sequenceType?: SequenceType;
  sequencePrompt?: number;
  hideNumber?: boolean;
  hideComparisonAnswer?: boolean;
}

function getComparisonText(operator: ComparisonOperator, target: number): string {
  switch (operator) {
    case '>': return `ES MAYOR QUE ${target}`;
    case '<': return `ES MENOR QUE ${target}`;
    case '=': return `ES IGUAL A ${target}`;
    default: return '';
  }
}

function getComparisonSymbol(operator: ComparisonOperator): string {
  switch (operator) {
    case '>': return '>';
    case '<': return '<';
    case '=': return '=';
    default: return '';
  }
}

function getSequenceText(type: SequenceType, prompt: number): string {
  switch (type) {
    case 'after': return `VIENE DESPUÉS DE ${prompt}`;
    case 'before': return `VIENE ANTES DE ${prompt}`;
    default: return '';
  }
}

function getSequenceQuestion(type: SequenceType, prompt: number): string {
  switch (type) {
    case 'after': return `¿QUÉ VIENE DESPUÉS DE ${prompt}?`;
    case 'before': return `¿QUÉ VIENE ANTES DE ${prompt}?`;
    default: return '';
  }
}

export function NumberDisplay({
  number,
  index,
  label,
  size = 'md',
  comparisonTarget,
  comparisonOperator,
  mode = 'classic',
  decadeStart,
  decadeEnd,
  sequenceType,
  sequencePrompt,
  hideNumber = false,
  hideComparisonAnswer = false,
}: NumberDisplayProps) {
  const isComparison = comparisonTarget !== undefined && comparisonOperator !== undefined;
  const isEvenOdd = mode === 'even' || mode === 'odd';
  const isTens = mode === 'tens';
  const isSequence = sequenceType !== undefined && sequencePrompt !== undefined;

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-28 h-28 text-5xl',
  };

  // For tens mode, the decade label (e.g., 4 for the 40s)
  const decadeLabel = decadeStart !== undefined ? Math.floor(decadeStart / 10) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-sm font-semibold text-amber-700">{label}</span>
      )}

      {isTens && decadeStart !== undefined && number !== null ? (
        /* Tens mode: show decade display */
        <div className="flex flex-col items-center gap-3">
          {/* Decade number */}
          <div
            className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-extrabold shadow-lg bg-gradient-to-br from-violet-400 to-purple-600 text-white animate-bounce-number`}
            aria-label={`DECENA: ${decadeLabel} — NÚMEROS DEL ${decadeStart} AL ${decadeEnd}`}
          >
            {decadeLabel}
          </div>

          {/* Decena label */}
          <div className="flex flex-col items-center gap-1 bg-white/80 border-2 border-violet-300 rounded-xl px-4 py-2 shadow-md">
            <span className="text-lg font-bold text-violet-700">DECENAS</span>
            <span className="text-sm font-semibold text-violet-500">
              {decadeStart} — {decadeEnd}
            </span>
          </div>

          {/* Hint for students */}
          <p className="text-sm font-semibold text-violet-600 text-center">
            ¡MARCÁ CUALQUIER NÚMERO DEL {decadeStart} AL {decadeEnd}!
          </p>

          {/* Turn index */}
          <span className="text-xs text-amber-600 font-medium">
            #{index + 1}
          </span>
        </div>
      ) : isSequence && number !== null ? (
        /* Sequence mode: show number + before/after prompt */
        <div className="flex flex-col items-center gap-3">
          {/* Main number (the answer) */}
          <div
            className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-extrabold shadow-lg bg-gradient-to-br from-teal-400 to-cyan-600 text-white animate-bounce-number`}
            aria-label={hideNumber ? 'NÚMERO OCULTO — RESPONDÉ LA PREGUNTA' : `NÚMERO ACTUAL: ${number}`}
          >
            {hideNumber ? '?' : number}
          </div>

          {/* Sequence question */}
          <div className="flex items-center gap-2 bg-white/80 border-2 border-teal-300 rounded-xl px-4 py-2 shadow-md">
            <span className="text-lg font-bold text-teal-800">
              {getSequenceQuestion(sequenceType!, sequencePrompt!)}
            </span>
          </div>

          {/* Text description for clarity (only reveal after correct answer) */}
          {!hideNumber && (
            <p className="text-sm font-semibold text-teal-700 text-center">
              {number} {getSequenceText(sequenceType!, sequencePrompt!)}
            </p>
          )}

          {/* Turn index */}
          <span className="text-xs text-amber-600 font-medium">
            #{index + 1}
          </span>
        </div>
      ) : isComparison && number !== null ? (
        /* Comparison mode: show number + comparison prompt */
        <div className="flex flex-col items-center gap-3">
          {/* Main number */}
          <div
            className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-extrabold shadow-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-bounce-number`}
            aria-label={`NÚMERO ACTUAL: ${number}`}
          >
            {number}
          </div>

          {/* Comparison prompt */}
          <div className="flex items-center gap-2 bg-white/80 border-2 border-amber-300 rounded-xl px-4 py-2 shadow-md">
            {comparisonOperator === '=' ? (
              <span className="text-lg font-bold text-amber-800">SON IGUALES {number} Y {comparisonTarget}?</span>
            ) : (
              <>
                <span className="text-lg font-bold text-amber-800">¿{number}</span>
                <span className="text-lg font-bold text-emerald-600">
                  {getComparisonSymbol(comparisonOperator!)}
                </span>
                <span className="text-lg font-bold text-amber-800">{comparisonTarget}?</span>
              </>
            )}
          </div>

          {/* Text description for accessibility and clarity (hide for students until answered) */}
          {!hideComparisonAnswer && (
            <p className="text-sm font-semibold text-amber-700 text-center">
              {getComparisonText(comparisonOperator!, comparisonTarget!)}
            </p>
          )}

          {/* Turn index */}
          <span className="text-xs text-amber-600 font-medium">
            #{index + 1}
          </span>
        </div>
      ) : isEvenOdd && number !== null ? (
        /* Even/Odd mode: show number + parity indicator */
        <div className="flex flex-col items-center gap-2">
          <div
            className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-extrabold shadow-lg transition-all duration-300 ${
              mode === 'even'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white animate-bounce-number'
                : 'bg-gradient-to-br from-red-400 to-red-600 text-white animate-bounce-number'
            }`}
            aria-label={`NÚMERO ACTUAL: ${number} — ${mode === 'even' ? 'PAR' : 'IMPAR'}`}
          >
            {number}
          </div>
          {/* Parity indicator badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md ${
            mode === 'even'
              ? 'bg-blue-50 border-2 border-blue-300'
              : 'bg-red-50 border-2 border-red-300'
          }`}>
            <span className={`text-base ${mode === 'even' ? 'text-blue-500' : 'text-red-500'}`}>
              {mode === 'even' ? '🔵' : '🔴'}
            </span>
            <span className={`text-sm font-bold ${mode === 'even' ? 'text-blue-700' : 'text-red-700'}`}>
              {mode === 'even' ? 'ES PAR' : 'ES IMPAR'}
            </span>
          </div>
          {/* Turn index */}
          <span className="text-xs text-amber-600 font-medium">
            #{index + 1}
          </span>
        </div>
      ) : (
        /* Classic mode: just show the number */
        <>
          <div
            className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-extrabold shadow-lg transition-all duration-300 ${
              number !== null
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-bounce-number'
                : 'bg-amber-100 text-amber-300 border-2 border-dashed border-amber-300'
            }`}
            aria-label={number !== null ? `NÚMERO ACTUAL: ${number}` : 'ESPERANDO NÚMERO'}
          >
            {number !== null ? number : '?'}
          </div>
          {number !== null && (
            <span className="text-xs text-amber-600 font-medium">
              #{index + 1}
            </span>
          )}
        </>
      )}
    </div>
  );
}
