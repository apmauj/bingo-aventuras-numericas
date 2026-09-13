import { describe, expect, test } from 'bun:test';
import { createLogger } from './logger';

function capture() {
  const entries: unknown[][] = [];
  return {
    entries,
    write: (...args: unknown[]) => entries.push(args),
  };
}

describe('server logger', () => {
  test('emits routine diagnostics in development', () => {
    const output = capture();
    const logger = createLogger('development', {
      debug: output.write,
      info: output.write,
      error: output.write,
    });

    logger.debug('[Room] Number called');

    expect(output.entries).toEqual([['[Room] Number called']]);
  });

  test('suppresses routine diagnostics in production', () => {
    const output = capture();
    const logger = createLogger('production', {
      debug: output.write,
      info: output.write,
      error: output.write,
    });

    logger.debug('[Room] Player joined', 'student-name');

    expect(output.entries).toEqual([]);
  });

  test('keeps startup and error messages visible in production', () => {
    const output = capture();
    const logger = createLogger('production', {
      debug: output.write,
      info: output.write,
      error: output.write,
    });

    logger.info('Bingo server running');
    logger.error('Unhandled server error');

    expect(output.entries).toEqual([
      ['Bingo server running'],
      ['Unhandled server error'],
    ]);
  });
});
