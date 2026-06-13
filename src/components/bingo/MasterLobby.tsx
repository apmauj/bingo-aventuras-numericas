// ============================================================
// Master Lobby Component
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PipoMascot } from './PipoMascot';
import type { PlayerPublic, GameMode } from '@/types/bingo';
import { AVATARS, GAME_MODES } from '@/types/bingo';
import { Users, QrCode, Dice5, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MasterLobbyProps {
  roomCode: string;
  roomId: string;
  players: PlayerPublic[];
  onStartGame: (roomId: string) => void;
  gridSize?: number;
  numberRange?: [number, number];
  mode?: GameMode;
  freeCell?: boolean;
}

export function MasterLobby({ roomCode, roomId, players, onStartGame, gridSize = 3, numberRange = [0, 100], mode = 'classic', freeCell = true }: MasterLobbyProps) {
  const [copied, setCopied] = useState(false);
  const canStart = players.length >= 1;

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-6">
      {/* Pipo */}
      <div className="mb-4 animate-pipo-breathe">
        <PipoMascot mood="happy" size={100} />
      </div>

      <h2 className="text-xl font-bold text-amber-800 mb-2">SALA CREADA</h2>

      {/* Room code - big and bold */}
      <Card className="mb-4 border-2 border-amber-400 bg-white shadow-lg w-full max-w-md">
        <CardContent className="p-5">
          <div className="text-center">
            <p className="text-sm font-medium text-amber-600 mb-1">CÓDIGO DE LA SALA</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-extrabold tracking-widest text-amber-800">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg hover:bg-amber-100 transition-colors"
                aria-label="Copiar código"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5 text-amber-500" />
                )}
              </button>
            </div>
          </div>

          {/* QR Code */}
          {qrUrl && (
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 text-amber-600">
                <QrCode className="w-4 h-4" />
                <span className="text-xs font-medium">ESCANEÁ PARA UNIRSE</span>
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code para unirse a la sala"
                className="w-40 h-40 rounded-lg border-2 border-amber-200"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room config summary */}
      <Card className="mb-4 border border-amber-200 bg-amber-50/50 w-full max-w-md">
        <CardContent className="p-3">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-xs text-amber-500 font-medium">MODO</p>
              <p className="text-lg font-bold text-amber-800">{GAME_MODES.find(m => m.id === mode)?.emoji} {GAME_MODES.find(m => m.id === mode)?.label}</p>
            </div>
            <div className="w-px h-8 bg-amber-200" />
            <div>
              <p className="text-xs text-amber-500 font-medium">CARTÓN</p>
              <p className="text-lg font-bold text-amber-800">{gridSize}×{gridSize}{freeCell ? ' ⭐' : ''}</p>
            </div>
            <div className="w-px h-8 bg-amber-200" />
            <div>
              <p className="text-xs text-amber-500 font-medium">NÚMEROS</p>
              <p className="text-lg font-bold text-amber-800">{numberRange[0]} A {numberRange[1]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected players */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-700">
            JUGADORES CONECTADOS ({players.length})
          </h3>
        </div>

        {players.length === 0 ? (
          <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
            <CardContent className="flex flex-col items-center p-6">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm text-amber-600 text-center">
                ESPERANDO QUE LOS ESTUDIANTES SE UNAN...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((player) => {
              const avatarEmoji = AVATARS.find((a) => a.id === player.avatar)?.emoji || '🐼';
              return (
                <Card key={player.id} className="border border-amber-200 bg-white/80">
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="text-2xl">{avatarEmoji}</span>
                    <span className="font-medium text-amber-800">{player.name}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Start game button */}
      <div className="w-full max-w-md">
        <Button
          onClick={() => onStartGame(roomId)}
          disabled={!canStart}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={canStart ? 'Iniciar bingo' : 'Se necesitan al menos 2 jugadores'}
        >
          <Dice5 className="w-5 h-5 mr-2" />
          INICIAR BINGO
        </Button>
        {!canStart && (
          <p className="text-center text-xs text-amber-500 mt-2">
            SE NECESITA AL MENOS 1 JUGADOR PARA INICIAR
          </p>
        )}
      </div>

      {/* Waiting animation */}
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
