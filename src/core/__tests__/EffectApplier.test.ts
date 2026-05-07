import { describe, it, expect } from 'vitest';
import { applyEffects } from '../EffectApplier';
import type { Effect, GameState } from '../types';

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

describe('applyEffects', () => {
  it('gain_book adds a book', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'gain_book', book_id: 'book_c' }];
    const next = applyEffects(state, effects);
    expect(next.inventory.find(b => b.bookId === 'book_c')).toBeDefined();
  });

  it('lose_book removes a book', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'lose_book', book_id: 'book_b' }];
    const next = applyEffects(state, effects);
    expect(next.inventory.find(b => b.bookId === 'book_b')).toBeUndefined();
  });

  it('mark_book changes state', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'mark_book', book_id: 'book_a', state: 'worn' }];
    const next = applyEffects(state, effects);
    expect(next.inventory.find(b => b.bookId === 'book_a')?.state).toBe('worn');
  });

  it('transform_book replaces book', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'transform_book', from_id: 'book_a', to_id: 'book_c' }];
    const next = applyEffects(state, effects);
    expect(next.inventory.find(b => b.bookId === 'book_a')).toBeUndefined();
    expect(next.inventory.find(b => b.bookId === 'book_c')).toBeDefined();
  });

  it('set_flag sets flag', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'set_flag', key: 'door_open', value: true }];
    const next = applyEffects(state, effects);
    expect(next.flags['door_open']).toBe(true);
  });

  it('record_choice records choice', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'record_choice', choice_id: 'choice_1', option_id: 'option_x' }];
    const next = applyEffects(state, effects);
    expect(next.keyChoices['choice_1']).toBe('option_x');
  });

  it('trigger_super_match adds to list', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'trigger_super_match', match_id: 'sm_test' }];
    const next = applyEffects(state, effects);
    expect(next.triggeredSuperMatches).toContain('sm_test');
  });

  it('unlock_node sets unlocked flag', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'unlock_node', node_id: 'node_end' }];
    const next = applyEffects(state, effects);
    expect(next.flags['unlocked_node_end']).toBe(true);
  });

  it('lock_node sets locked flag', () => {
    const state = makeState();
    const effects: Effect[] = [{ type: 'lock_node', node_id: 'node_start' }];
    const next = applyEffects(state, effects);
    expect(next.flags['locked_node_start']).toBe(true);
  });

  it('multiple effects applied sequentially', () => {
    const state = makeState();
    const effects: Effect[] = [
      { type: 'gain_book', book_id: 'book_c' },
      { type: 'set_flag', key: 'puzzle_solved', value: true },
      { type: 'mark_book', book_id: 'book_a', state: 'glowing' },
    ];
    const next = applyEffects(state, effects);
    expect(next.inventory.find(b => b.bookId === 'book_c')).toBeDefined();
    expect(next.flags['puzzle_solved']).toBe(true);
    expect(next.inventory.find(b => b.bookId === 'book_a')?.state).toBe('glowing');
  });
});
