// ============================================================
// Role Selection (Home Screen) Component
// ============================================================

'use client';

import React from 'react';
import { PipoMascot } from './PipoMascot';
import { GraduationCap, Gamepad2 } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'master' | 'student') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
      {/* Title */}
      <div className="text-center mb-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 drop-shadow-sm">
          🎲 Bingo Aventuras
        </h1>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 mt-1">
          Numéricas
        </h2>
      </div>

      {/* Pipo welcoming */}
      <div className="my-6 animate-pipo-breathe">
        <PipoMascot mood="happy" size={140} />
      </div>
      <p className="text-lg text-amber-700 font-medium mb-8 text-center">
        ¡HOLA! SOY PIPO 🐼 ¿CÓMO QUERÉS JUGAR HOY?
      </p>

      {/* Role cards */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-lg">
        {/* Teacher card */}
        <button
          onClick={() => onSelectRole('master')}
          className="flex-1 group bg-white rounded-2xl shadow-lg hover:shadow-xl border-2 border-amber-200 hover:border-amber-400 p-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Soy Docente - Crear una sala de bingo"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <GraduationCap className="w-8 h-8 text-amber-700" />
            </div>
            <span className="text-2xl">🎓</span>
            <h3 className="text-xl font-bold text-amber-800">SOY DOCENTE</h3>
            <p className="text-sm text-amber-600 text-center">CREÁ UNA SALA Y DIRIGÍ LA PARTIDA</p>
          </div>
        </button>

        {/* Student card */}
        <button
          onClick={() => onSelectRole('student')}
          className="flex-1 group bg-white rounded-2xl shadow-lg hover:shadow-xl border-2 border-emerald-200 hover:border-emerald-400 p-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Soy Estudiante - Unirme a una sala de bingo"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Gamepad2 className="w-8 h-8 text-emerald-700" />
            </div>
            <span className="text-2xl">🎮</span>
            <h3 className="text-xl font-bold text-emerald-800">SOY ESTUDIANTE</h3>
            <p className="text-sm text-emerald-600 text-center">UNITE A UNA SALA Y JUGÁ AL BINGO</p>
          </div>
        </button>
      </div>

      {/* Footer decoration */}
      <div className="mt-8 text-4xl opacity-60 select-none">
        🌴🏝️🌴
      </div>
    </div>
  );
}
