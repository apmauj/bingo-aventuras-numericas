import { describe, expect, test } from 'bun:test';
import { registerSocketHandlers } from './socket';
import { addPlayerToRoom, createRoom, deleteRoom, findRoomById } from './rooms';

type Handler = (payload: { roomId: string }) => void;

interface EmittedEvent {
  target: string;
  event: string;
  payload: unknown;
}

function createSocketHarness(socketId: string) {
  const handlers = new Map<string, Handler>();
  const emitted: EmittedEvent[] = [];

  const socket = {
    id: socketId,
    on(event: string, handler: Handler) {
      handlers.set(event, handler);
    },
    emit(event: string, payload: unknown) {
      emitted.push({ target: 'socket', event, payload });
    },
    to(target: string) {
      return {
        emit(event: string, payload: unknown) {
          emitted.push({ target, event, payload });
        },
      };
    },
    join() {},
    leave() {},
  };

  const io = {
    to(target: string) {
      return {
        emit(event: string, payload: unknown) {
          emitted.push({ target, event, payload });
        },
      };
    },
  };

  registerSocketHandlers(io as never, socket as never);

  return { emitted, handlers };
}

function uniqueSocketId(label: string): string {
  return `socket-${label}-${Date.now()}-${Math.random()}`;
}

describe('lobby exit events', () => {
  test('teacher closing a lobby notifies students and removes the room', () => {
    const masterSocketId = uniqueSocketId('master');
    const room = createRoom(masterSocketId);
    addPlayerToRoom(room, uniqueSocketId('student'), 'ANA', 'panda');
    const harness = createSocketHarness(masterSocketId);

    try {
      harness.handlers.get('client:leaveRoom')?.({ roomId: room.id });

      expect(findRoomById(room.id)).toBe(undefined);
      expect(harness.emitted.some((event) => event.event === 'server:roomClosed')).toBe(true);
      expect(harness.emitted.some((event) => event.event === 'server:gameEnded')).toBe(false);
    } finally {
      deleteRoom(room.code);
    }
  });
});
