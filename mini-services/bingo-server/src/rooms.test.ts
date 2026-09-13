import { describe, expect, test } from 'bun:test';
import { createRoom, deleteRoom } from './rooms';

function masterId(label: string): string {
  return `test-${label}-${Date.now()}-${Math.random()}`;
}

describe('room number range validation', () => {
  test('accepts 10000 as the inclusive maximum', () => {
    const room = createRoom(masterId('max'), { numberRange: [0, 10000] });

    try {
      expect(room.config.numberRange).toEqual([0, 10000]);
    } finally {
      deleteRoom(room.code);
    }
  });

  test('rejects ranges whose maximum exceeds 10000', () => {
    expect(() => createRoom(masterId('too-large'), { numberRange: [0, 10001] }))
      .toThrow('10.000');
  });

  test('rejects negative values at either end of the range', () => {
    expect(() => createRoom(masterId('negative-min'), { numberRange: [-1, 10] }))
      .toThrow('NEGATIVO');
    expect(() => createRoom(masterId('negative-max'), { numberRange: [0, -1] }))
      .toThrow('NEGATIVO');
  });

  test('rejects non-integer range boundaries', () => {
    expect(() => createRoom(masterId('decimal'), { numberRange: [0.5, 10] }))
      .toThrow('ENTEROS');
  });
});
