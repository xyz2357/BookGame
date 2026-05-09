import { describe, it, expect, vi } from 'vitest';
import { testBooks } from './fixtures';
import type { Connection, GameState } from '../types';

vi.mock('../DataLoader', () => ({
  getBook: (id: string) => testBooks.find(b => b.id === id),
}));

import {
  createInitialState,
  moveTo,
  addBook,
  removeBook,
  markBook,
  transformBook,
  setFlag,
  recordChoice,
  triggerSuperMatch,
  completeEvent,
  loseHp,
  canTraverse,
} from '../GameState';

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

describe('createInitialState', () => {
  it('returns correct initial values', () => {
    const state = createInitialState();
    expect(state.currentNodeId).toBe('entrance');
    expect(state.inventory).toHaveLength(3);
    expect(state.hp).toBe(3);
    expect(state.maxHp).toBe(3);
  });
});

describe('moveTo', () => {
  it('updates currentNodeId and adds to visitedNodes', () => {
    const state = makeState();
    const next = moveTo(state, 'node_end');
    expect(next.currentNodeId).toBe('node_end');
    expect(next.visitedNodes).toContain('node_end');
  });

  it('does not duplicate visitedNodes', () => {
    const state = makeState();
    const once = moveTo(state, 'node_end');
    const twice = moveTo(once, 'node_end');
    expect(twice.visitedNodes.filter(n => n === 'node_end')).toHaveLength(1);
  });
});

describe('addBook', () => {
  it('adds a new BookInstance with state normal', () => {
    const state = makeState();
    const next = addBook(state, 'book_c');
    expect(next.inventory).toHaveLength(3);
    expect(next.inventory.find(b => b.bookId === 'book_c')).toEqual({
      bookId: 'book_c',
      state: 'normal',
    });
  });
});

describe('removeBook', () => {
  it('removes the correct book', () => {
    const state = makeState();
    const next = removeBook(state, 'book_b');
    expect(next.inventory.find(b => b.bookId === 'book_b')).toBeUndefined();
    expect(next.inventory).toHaveLength(1);
  });
});

describe('markBook', () => {
  it('changes a book state', () => {
    const state = makeState();
    const next = markBook(state, 'book_a', 'glowing');
    expect(next.inventory.find(b => b.bookId === 'book_a')?.state).toBe('glowing');
  });
});

describe('transformBook', () => {
  it('replaces one book with another', () => {
    const state = makeState();
    const next = transformBook(state, 'book_a', 'book_c');
    expect(next.inventory.find(b => b.bookId === 'book_a')).toBeUndefined();
    expect(next.inventory.find(b => b.bookId === 'book_c')).toEqual({
      bookId: 'book_c',
      state: 'normal',
    });
  });
});

describe('setFlag', () => {
  it('sets a flag value', () => {
    const state = makeState();
    const next = setFlag(state, 'door_open', true);
    expect(next.flags['door_open']).toBe(true);
  });
});

describe('recordChoice', () => {
  it('records a key choice', () => {
    const state = makeState();
    const next = recordChoice(state, 'choice_1', 'option_x');
    expect(next.keyChoices['choice_1']).toBe('option_x');
  });
});

describe('triggerSuperMatch', () => {
  it('adds to list', () => {
    const state = makeState();
    const next = triggerSuperMatch(state, 'sm_test');
    expect(next.triggeredSuperMatches).toContain('sm_test');
  });

  it('does not duplicate', () => {
    const state = makeState();
    const once = triggerSuperMatch(state, 'sm_test');
    const twice = triggerSuperMatch(once, 'sm_test');
    expect(twice.triggeredSuperMatches.filter(m => m === 'sm_test')).toHaveLength(1);
  });
});

describe('completeEvent', () => {
  it('adds to list', () => {
    const state = makeState();
    const next = completeEvent(state, 'evt_1');
    expect(next.completedEvents).toContain('evt_1');
  });

  it('does not duplicate', () => {
    const state = makeState();
    const once = completeEvent(state, 'evt_1');
    const twice = completeEvent(once, 'evt_1');
    expect(twice.completedEvents.filter(e => e === 'evt_1')).toHaveLength(1);
  });
});

describe('loseHp', () => {
  it('reduces hp by 1', () => {
    const state = makeState();
    const next = loseHp(state);
    expect(next.hp).toBe(2);
  });

  it('does not go below 0', () => {
    let state = makeState();
    state = loseHp(state);
    state = loseHp(state);
    state = loseHp(state);
    state = loseHp(state);
    expect(state.hp).toBe(0);
  });
});

describe('canTraverse', () => {
  it('none requirement always returns true', () => {
    const state = makeState();
    const conn: Connection = { target: 'node_end', label: 'go', requirement: 'none' };
    expect(canTraverse(state, conn)).toBe(true);
  });

  it('flag requirement checks flags', () => {
    const state = makeState();
    const conn: Connection = { target: 'node_end', label: 'go', requirement: 'flag', requirement_value: 'door_open' };
    expect(canTraverse(state, conn)).toBe(false);
    const next = setFlag(state, 'door_open', true);
    expect(canTraverse(next, conn)).toBe(true);
  });

  it('book requirement checks inventory', () => {
    const state = makeState();
    const conn: Connection = { target: 'x', label: 'go', requirement: 'book', requirement_value: 'book_a' };
    expect(canTraverse(state, conn)).toBe(true);
    const next = removeBook(state, 'book_a');
    expect(canTraverse(next, conn)).toBe(false);
  });

  it('tag requirement checks book tags in inventory', () => {
    const state = makeState();
    const conn: Connection = { target: 'x', label: 'go', requirement: 'tag', requirement_value: 'fire' };
    expect(canTraverse(state, conn)).toBe(true);
    const conn2: Connection = { target: 'x', label: 'go', requirement: 'tag', requirement_value: 'nonexistent' };
    expect(canTraverse(state, conn2)).toBe(false);
  });
});
