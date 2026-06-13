// ============================================================
// Student Lobby Component (Waiting for game to start)
// ============================================================

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PipoMascot } from './PipoMascot';
import type { PlayerPublic } from '@/types/bingo';
import { AVATARS } from '@/types/bingo';
import { Users, Clock } from 'lucide-react';

interface StudentLobbyProps {
  playerName: string;
  playerAvatar: string;
  players: PlayerPublic[];
  roomCode: string;
}

export function StudentLobby({ playerName, playerAvatar, players, roomCode }: StudentLobbyProps) {
  const playerAvatarEmoji = AVATARS.find((a) => a.id === playerAvatar)?.emoji || '🐼';

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 px-4 py-6">
      {/* Pipo encouraging */}
      <div className="mb-4 animate-pipo-breathe">
        <PipoMascot mood="encouraging" size={120} />
      </div>

      <h2 className="text-xl font-bold text-emerald-800 mb-1">
        ¡YA ESTÁS EN LA SALA!
      </h2>

      {/* Player's own card */}
      <Card className="mb-4 border-2 border-emerald-300 bg-white shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="text-4xl">{playerAvatarEmoji}</span>
          <div>
            <p className="font-bold text-emerald-800 text-lg">{playerName}</p>
            <p className="text-sm text-emerald-600">SALA: {roomCode}</p>
          </div>
        </CardContent>
      </Card>

      {/* Waiting message */}
      <div className="flex items-center gap-2 text-amber-600 mb-6">
        <Clock className="w-5 h-5 animate-pulse" />
        <p className="font-medium text-center">
          ESPERANDO QUE EL DOCENTE INICIE LA PARTIDA...
        </p>
      </div>

      {/* Connected players */}
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-emerald-700">
            JUGADORES CONECTADOS ({players.length})
          </h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {players.map((player) => {
            const avatarEmoji = AVATARS.find((a) => a.id === player.avatar)?.emoji || '🐼';
            return (
              <Card key={player.id} className="border border-emerald-200 bg-white/80">
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl">{avatarEmoji}</span>
                  <span className="font-medium text-emerald-800">{player.name}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Fun waiting animation */}
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
