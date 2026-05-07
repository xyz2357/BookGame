import { describe, it, expect, vi } from 'vitest';
import { testEndings } from './fixtures';

vi.mock('../DataLoader', () => ({
  getEndings: () => testEndings,
}));

import { judgeEnding } from '../EndingJudge';
import type { GameState } from '../types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    currentNodeId: "node_start",
    inventory: [
      { bookId: "book_a", state: "normal" },
      { bookId: "book_b", state: "normal" },
    ],
    flags: {},
    visitedNodes: [],
    triggeredSuperMatches: [],
    keyChoices: {},
    completedEvents: [],
    hp: 3,
    maxHp: 3,
    ...overrides,
  };
}

describe('judgeEnding', () => {
  it('returns ending_good when door_open flag is true', () => {
    const state = makeState({ flags: { door_open: true } });
    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_good');
  });

  it('returns ending_bad when key_choice choice_1 = wrong', () => {
    const state = makeState({ keyChoices: { choice_1: 'wrong' } });
    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_bad');
  });

  it('returns ending_fallback when no other conditions met', () => {
    const state = makeState();
    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_fallback');
  });

  it('higher priority ending wins when multiple match', () => {
    const state = makeState({
      flags: { door_open: true },
      keyChoices: { choice_1: 'wrong' },
    });
    const ending = judgeEnding(state);
    expect(ending!.id).toBe('ending_good');
    expect(ending!.priority).toBe(50);
  });

  it('returns ending_fallback as fallback since it has empty conditions', () => {
    const state = makeState();
    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.conditions).toHaveLength(0);
  });
});
