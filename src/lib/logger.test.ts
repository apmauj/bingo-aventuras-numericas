import { describe, expect, test } from 'bun:test';
import { createLogger } from './logger';

function capture() {
  const entries: unknown[][] = [];
  return {
    entries,
    write: (...args: unknown[]) => entries.push(args),
  };
}

describe('client logger', () => {
  test('emits debug messages in development', () => {
    const output = capture();
    const logger = createLogger('development', {
      debug: output.write,
      error: output.write,
    });

    logger.debug('[Socket] Connected');

    expect(output.entries).toEqual([['[Socket] Connected']]);
  });

  test('suppresses debug messages in production', () => {
    const output = capture();
    const logger = createLogger('production', {
      debug: output.write,
      error: output.write,
    });

    logger.debug('[Event] gameStarted', { card: [[1, 2, 3]] });

    expect(output.entries).toEqual([]);
  });

  test('keeps actionable errors visible in production', () => {
    const output = capture();
    const logger = createLogger('production', {
      debug: output.write,
      error: output.write,
    });

    logger.error('[Socket] Connection error');

    expect(output.entries).toEqual([['[Socket] Connection error']]);
  });
});
