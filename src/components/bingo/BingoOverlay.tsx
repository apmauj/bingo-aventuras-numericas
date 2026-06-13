// ============================================================
// Bingo Overlay — Full-screen celebration when someone wins
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';

interface BingoOverlayProps {
  playerName: string;
  points: number;
  isSelf: boolean; // true if the current user is the winner
  onDismiss: () => void;
}

export function BingoOverlay({ playerName, points, isSelf, onDismiss }: BingoOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation after mount
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400); // Wait for exit animation
    }, 6000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-400 ${
        visible ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'
      }`}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
      role="dialog"
      aria-label="Celebración de BINGO"
    >
      <div
        className={`text-center transform transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'
        }`}
      >
        {/* Big BINGO text */}
        <div className="relative mb-4">
          <h1
            className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 drop-shadow-2xl animate-pulse"
            style={{ WebkitTextStroke: '2px rgba(0,0,0,0.1)' }}
          >
            ¡BINGO!
          </h1>
        </div>

        {/* Winner info card */}
        <div className="bg-white/95 rounded-3xl px-8 py-6 shadow-2xl mx-4 max-w-sm">
          {isSelf ? (
            <>
              <p className="text-2xl font-bold text-emerald-600 mb-2">
                ¡GANASTE!
              </p>
              <p className="text-lg text-amber-700 font-semibold">
                +{points} PUNTOS
              </p>
            </>
          ) : (
            <>
              <p className="text-lg text-amber-700 mb-1 font-semibold">
                {playerName} GANÓ
              </p>
              <p className="text-3xl font-black text-emerald-600 mb-2">
                ¡BINGO!
              </p>
              <p className="text-sm text-amber-600">
                +{points} PUNTOS
              </p>
            </>
          )}

          <p className="text-xs text-amber-400 mt-4">
            TOCÁ PARA CONTINUAR
          </p>
        </div>

        {/* Decorative stars */}
        <div className="mt-6 flex justify-center gap-3 text-3xl">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>🌟</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🏆</span>
          <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🎉</span>
          <span className="animate-bounce" style={{ animationDelay: '0.8s' }}>🌟</span>
        </div>
      </div>
    </div>
  );
}
