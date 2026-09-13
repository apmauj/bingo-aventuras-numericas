import { describe, expect, test } from 'bun:test';
import { registerSocketHandlers } from './socket';
import { addPlayerToRoom, createRoom, deleteRoom } from './rooms';

type Handler = (payload: Record<string, unknown>) => void;

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

describe('number assistance events', () => {
  test('teacher can enable number assistance for the room', () => {
    const masterSocketId = uniqueSocketId('master-assistance');
    const room = createRoom(masterSocketId);
    addPlayerToRoom(room, uniqueSocketId('player-assistance'), 'ANA', 'panda');
    const harness = createSocketHarness(masterSocketId);

    try {
      expect((room as { numberAssistanceEnabled?: boolean }).numberAssistanceEnabled).toBe(false);

      harness.handlers.get('client:startGame')?.({
        roomId: room.id,
        mode: room.mode,
      });

      harness.handlers.get('client:setNumberAssistance')?.({
        roomId: room.id,
        enabled: true,
      });

      expect((room as { numberAssistanceEnabled?: boolean }).numberAssistanceEnabled).toBe(true);
      const assistanceEvent = harness.emitted.find((event) => event.event === 'server:numberAssistanceChanged');
      expect(assistanceEvent?.target).toBe(room.code);
      expect(assistanceEvent?.payload).toEqual({ enabled: true });
    } finally {
      deleteRoom(room.code);
    }
  });

  test('students cannot change number assistance', () => {
    const masterSocketId = uniqueSocketId('master-assistance-auth');
    const studentSocketId = uniqueSocketId('student-assistance-auth');
    const room = createRoom(masterSocketId);
    const harness = createSocketHarness(studentSocketId);

    try {
      harness.handlers.get('client:setNumberAssistance')?.({
        roomId: room.id,
        enabled: true,
      });

      expect((room as { numberAssistanceEnabled?: boolean }).numberAssistanceEnabled).toBe(false);
      const errorEvent = harness.emitted.find((event) => event.event === 'server:error');
      expect(errorEvent?.target).toBe('socket');
      expect((errorEvent?.payload as { code?: string })?.code).toBe('NOT_MASTER');
    } finally {
      deleteRoom(room.code);
    }
  });
});
