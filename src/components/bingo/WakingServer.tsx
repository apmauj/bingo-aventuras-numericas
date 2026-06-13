// ============================================================
// Waking Server Screen Component
// ============================================================

'use client';

import React from 'react';
import { PipoMascot } from './PipoMascot';

interface WakingServerProps {
  onConnected: () => void;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

export function WakingServer({ onConnected, connectionState }: WakingServerProps) {
  const [dots, setDots] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (connectionState === 'connected') {
      setProgress(100);
      const timer = setTimeout(onConnected, 800);
      return () => clearTimeout(timer);
    }
  }, [connectionState, onConnected]);

  React.useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  React.useEffect(() => {
    if (connectionState !== 'connected') {
      const progTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 85));
      }, 300);
      return () => clearInterval(progTimer);
    }
  }, [connectionState]);

  const pipoMood = connectionState === 'connected' ? 'waking' : 'sleeping';
  const message = connectionState === 'connected'
    ? '¡SERVIDOR DESPIERTO! 🌟'
    : `DESPERTANDO SERVIDOR${'.'.repeat(dots)}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4">
      <div className="animate-pipo-breathe">
        <PipoMascot mood={pipoMood} size={160} />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-amber-800 text-center">
        {message}
      </h2>

      <p className="mt-2 text-sm text-amber-600 text-center">
        {connectionState === 'connected'
          ? '¡TODO LISTO PARA JUGAR!'
          : 'PIPO ESTÁ PREPARANDO TODO...'}
      </p>

      {/* Progress bar */}
      <div className="mt-6 w-64 h-3 bg-amber-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pulsing dots animation */}
      {connectionState === 'connecting' && (
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-amber-400 animate-pulse-dot"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
