// ============================================================
// Confetti Effect Component
// ============================================================

'use client';

import React, { useMemo } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

function generatePieces(): ConfettiPiece[] {
  const colors = [
    '#F59E0B', '#D97706', '#10B981', '#059669',
    '#8B5CF6', '#EC4899', '#EF4444', '#3B82F6',
    '#F97316', '#14B8A6',
  ];
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 3,
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));
}

export function ConfettiEffect({ active }: { active: boolean }) {
  const pieces = useMemo(() => active ? generatePieces() : [], [active]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size * 0.6}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
