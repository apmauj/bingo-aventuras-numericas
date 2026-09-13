import { describe, expect, test } from 'bun:test';
import { isOwnLineCompletion } from './line-completion';

describe('isOwnLineCompletion', () => {
  test('identifies the current student as the line owner', () => {
    expect(isOwnLineCompletion('student', 'player-1', 'player-1')).toBe(true);
  });

  test('does not treat another student line as a local completion', () => {
    expect(isOwnLineCompletion('student', 'player-2', 'player-1')).toBe(false);
  });

  test('does not enable local feedback for the teacher', () => {
    expect(isOwnLineCompletion('master', 'player-1', 'player-1')).toBe(false);
  });

  test('does not match when the current player id is unavailable', () => {
    expect(isOwnLineCompletion('student', 'player-1', '')).toBe(false);
  });
});
