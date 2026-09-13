import { describe, expect, test } from 'bun:test';
import { scrollToLatest } from './number-history';

describe('number history viewport', () => {
  test('scrolls the history container to its latest entry', () => {
    const container = { scrollTop: 0, scrollHeight: 320 };

    scrollToLatest(container);

    expect(container.scrollTop).toBe(320);
  });
});
