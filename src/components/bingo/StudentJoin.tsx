// ============================================================
// Student Join Room Component
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PipoMascot } from './PipoMascot';
import { AVATARS, type AvatarType } from '@/types/bingo';
import { ArrowLeft, Rocket } from 'lucide-react';

interface StudentJoinProps {
  onJoin: (code: string, name: string, avatar: string) => void;
  onBack: () => void;
  initialCode?: string;
}

export function StudentJoin({ onJoin, onBack, initialCode = '' }: StudentJoinProps) {
  const initialCodeUpper = useMemo(() => initialCode.toUpperCase(), [initialCode]);
  const [code, setCode] = useState(initialCodeUpper);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>('panda');
  const [error, setError] = useState('');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setCode(val);
    setError('');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.slice(0, 12));
    setError('');
  };

  const handleJoin = () => {
    if (code.length !== 4) {
      setError('EL CÓDIGO DEBE TENER 4 CARACTERES');
      return;
    }
    if (name.trim().length === 0) {
      setError('¡DECINOS TU NOMBRE!');
      return;
    }
    onJoin(code, name.trim(), selectedAvatar);
  };

  const canJoin = code.length === 4 && name.trim().length > 0;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-emerald-100 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-emerald-700" />
        </button>
        <h1 className="text-2xl font-bold text-emerald-800">UNIRSE AL JUEGO</h1>
      </div>

      {/* Pipo */}
      <div className="mb-4 animate-pipo-breathe">
        <PipoMascot mood="encouraging" size={100} />
      </div>
      <p className="text-sm text-emerald-600 mb-6 text-center">
        ¡INGRESÁ EL CÓDIGO Y ELEGÍ TU PERSONAJE!
      </p>

      <div className="w-full max-w-md space-y-5">
        {/* Room code */}
        <div>
          <label className="block text-sm font-semibold text-emerald-800 mb-1.5">
            CÓDIGO DE LA SALA
          </label>
          <Input
            value={code}
            onChange={handleCodeChange}
            placeholder="EJ: ABCD"
            className="text-center text-2xl font-bold tracking-widest uppercase h-14 border-2 border-emerald-300 focus:border-emerald-500 placeholder-shown:uppercase"
            maxLength={4}
            aria-label="Código de sala de 4 caracteres"
          />
        </div>

        {/* Player name */}
        <div>
          <label className="block text-sm font-semibold text-emerald-800 mb-1.5">
            TU NOMBRE
          </label>
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder="EJ: MARTÍN"
            className="text-center text-lg h-12 border-2 border-emerald-300 focus:border-emerald-500 placeholder-shown:uppercase"
            maxLength={12}
            aria-label="Tu nombre de jugador"
          />
        </div>

        {/* Avatar selection */}
        <div>
          <label className="block text-sm font-semibold text-emerald-800 mb-2">
            ELEGÍ TU PERSONAJE
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
            {AVATARS.map((avatar) => (
              <Card
                key={avatar.id}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 border-2 ${
                  selectedAvatar === avatar.id
                    ? 'border-emerald-500 ring-2 ring-emerald-300 shadow-md'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedAvatar(avatar.id)}
                role="button"
                aria-label={`Seleccionar avatar ${avatar.label}`}
                aria-pressed={selectedAvatar === avatar.id}
              >
                <CardContent className="flex flex-col items-center p-2">
                  <span className="text-2xl mb-0.5">{avatar.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-600 leading-tight text-center">{avatar.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center text-amber-600 font-medium text-sm bg-amber-50 rounded-lg p-2">
            {error}
          </div>
        )}

        {/* Join button */}
        <Button
          onClick={handleJoin}
          disabled={!canJoin}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Entrar al juego"
        >
          <Rocket className="w-5 h-5 mr-2" />
          ENTRAR AL JUEGO
        </Button>
      </div>
    </div>
  );
}
