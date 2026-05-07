import { describe, it, expect, vi } from 'vitest';
import { testBooks, testEvents } from './fixtures';

vi.mock('../DataLoader', () => ({
  getBook: (id: string) => testBooks.find(b => b.id === id),
}));

import { resolveEvent } from '../EventResolver';
import type { GameEvent } from '../types';

describe('resolveEvent', () => {
  it('super match (book_match) returns correct outcome and matchType', () => {
    const event = testEvents[0];
    const result = resolveEvent(event, 'book_a');
    expect(result.matchType).toBe('super_match');
    expect(result.outcome.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'set_flag', key: 'door_open', value: true }),
      ])
    );
    expect(result.outcome.next_node).toBe('node_end');
  });

  it('tag match returns correct outcome and matchType', () => {
    const event = testEvents[0];
    const result = resolveEvent(event, 'book_c');
    expect(result.matchType).toBe('tag_match');
    expect(result.outcome.text).toBe('Tag match.');
  });

  it('no match returns default_outcome and matchType default', () => {
    const event = testEvents[0];
    const result = resolveEvent(event, 'book_b');
    expect(result.matchType).toBe('default');
    expect(result.outcome).toEqual(event.default_outcome);
  });

  it('super match takes priority over tag match', () => {
    const event = testEvents[0];
    const result = resolveEvent(event, 'book_a');
    expect(result.matchType).toBe('super_match');
  });

  it('match_mode all requires all tags', () => {
    const event = testEvents[1];

    const matchResult = resolveEvent(event, 'book_c');
    expect(matchResult.matchType).toBe('tag_match');
    expect(matchResult.outcome.text).toBe('Both matched!');

    const noMatch = resolveEvent(event, 'book_b');
    expect(noMatch.matchType).toBe('default');
  });

  it('tag match with match_mode any (default) matches on single tag', () => {
    const event: GameEvent = {
      id: 'test_any',
      node_id: 'node_start',
      description: 'test',
      prompt: 'test',
      solutions: [
        {
          type: 'tag_match',
          required_tags: ['fire', 'earth'],
          outcome: { text: 'any matched', effects: [], next_node: null },
        },
      ],
      default_outcome: { text: 'default', effects: [], next_node: null },
    };
    const result = resolveEvent(event, 'book_a');
    expect(result.matchType).toBe('tag_match');
    expect(result.outcome.text).toBe('any matched');
  });
});
