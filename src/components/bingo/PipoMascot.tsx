// ============================================================
// Pipo the Panda Mascot SVG Component
// ============================================================

'use client';

import React from 'react';

interface PipoMascotProps {
  mood?: 'happy' | 'sleeping' | 'waking' | 'encouraging' | 'celebrating' | 'thinking';
  size?: number;
  className?: string;
}

export function PipoMascot({ mood = 'happy', size = 120, className = '' }: PipoMascotProps) {
  const eyeState = mood === 'sleeping' ? 'closed' : mood === 'waking' ? 'half' : 'open';
  const mouthState = mood === 'happy' || mood === 'celebrating' ? 'big-smile' : mood === 'sleeping' ? 'sleep' : 'smile';
  const showZzz = mood === 'sleeping';
  const showStars = mood === 'celebrating';
  const showQuestion = mood === 'thinking';

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <circle cx="55" cy="50" r="30" fill="#1a1a2e" />
        <circle cx="55" cy="50" r="18" fill="#ffb4a2" />
        <circle cx="145" cy="50" r="30" fill="#1a1a2e" />
        <circle cx="145" cy="50" r="18" fill="#ffb4a2" />

        {/* Head */}
        <ellipse cx="100" cy="110" rx="70" ry="65" fill="#f0f0f0" />

        {/* Eye patches */}
        <ellipse cx="72" cy="100" rx="24" ry="20" fill="#1a1a2e" />
        <ellipse cx="128" cy="100" rx="24" ry="20" fill="#1a1a2e" />

        {/* Eyes */}
        {eyeState === 'open' && (
          <>
            <circle cx="72" cy="100" r="8" fill="white" />
            <circle cx="128" cy="100" r="8" fill="white" />
            <circle cx="74" cy="98" r="4" fill="#1a1a2e" />
            <circle cx="130" cy="98" r="4" fill="#1a1a2e" />
            <circle cx="76" cy="96" r="1.5" fill="white" />
            <circle cx="132" cy="96" r="1.5" fill="white" />
          </>
        )}
        {eyeState === 'closed' && (
          <>
            <path d="M62 100 Q72 108 82 100" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M118 100 Q128 108 138 100" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyeState === 'half' && (
          <>
            <ellipse cx="72" cy="100" rx="7" ry="3" fill="white" />
            <circle cx="72" cy="100" r="2" fill="#1a1a2e" />
            <ellipse cx="128" cy="100" rx="7" ry="3" fill="white" />
            <circle cx="128" cy="100" r="2" fill="#1a1a2e" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="100" cy="118" rx="6" ry="4" fill="#1a1a2e" />

        {/* Mouth */}
        {mouthState === 'big-smile' && (
          <path d="M85 124 Q100 140 115 124" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {mouthState === 'smile' && (
          <path d="M88 125 Q100 133 112 125" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {mouthState === 'sleep' && (
          <ellipse cx="100" cy="128" rx="4" ry="3" fill="#1a1a2e" opacity="0.5" />
        )}

        {/* Cheeks */}
        <circle cx="55" cy="118" r="10" fill="#ffb4a2" opacity="0.4" />
        <circle cx="145" cy="118" r="10" fill="#ffb4a2" opacity="0.4" />
      </svg>

      {/* Zzz for sleeping */}
      {showZzz && (
        <div className="absolute -top-2 -right-2 animate-float">
          <span className="text-lg font-bold text-purple-400">z</span>
          <span className="text-sm font-bold text-purple-300 ml-0.5">z</span>
          <span className="text-xs font-bold text-purple-200 ml-0.5">z</span>
        </div>
      )}

      {/* Stars for celebrating */}
      {showStars && (
        <>
          <div className="absolute -top-1 left-2 animate-sparkle text-yellow-400 text-lg">✦</div>
          <div className="absolute -top-3 right-4 animate-sparkle-delay text-yellow-400 text-sm">✦</div>
          <div className="absolute top-2 -right-1 animate-sparkle text-amber-400 text-xs">✦</div>
        </>
      )}

      {/* Question mark for thinking */}
      {showQuestion && (
        <div className="absolute -top-3 -right-1 animate-bounce text-purple-500 text-xl font-bold">?</div>
      )}
    </div>
  );
}
