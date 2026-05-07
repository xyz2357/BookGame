import type { GameState, BookState, Connection } from './types';
import { getBook } from './DataLoader';

export function createInitialState(): GameState {
  return {
    currentNodeId: "entrance",
    inventory: [
      { bookId: "starter_handbook", state: "normal" },
      { bookId: "metamorphosis", state: "normal" },
      { bookId: "painted_skin", state: "normal" },
    ],
    flags: {},
    visitedNodes: [],
    triggeredSuperMatches: [],
    keyChoices: {},
    completedEvents: [],
    hp: 3,
    maxHp: 3,
  };
}

export function loseHp(state: GameState, amount: number = 1): GameState {
  return { ...state, hp: Math.max(0, state.hp - amount) };
}

export function moveTo(state: GameState, nodeId: string): GameState {
  return {
    ...state,
    currentNodeId: nodeId,
    visitedNodes: state.visitedNodes.includes(nodeId)
      ? state.visitedNodes
      : [...state.visitedNodes, nodeId],
  };
}

export function addBook(state: GameState, bookId: string): GameState {
  return {
    ...state,
    inventory: [...state.inventory, { bookId, state: "normal" }],
  };
}

export function removeBook(state: GameState, bookId: string): GameState {
  return {
    ...state,
    inventory: state.inventory.filter(b => b.bookId !== bookId),
  };
}

export function markBook(state: GameState, bookId: string, newState: BookState): GameState {
  return {
    ...state,
    inventory: state.inventory.map(b =>
      b.bookId === bookId ? { ...b, state: newState } : b
    ),
  };
}

export function transformBook(state: GameState, fromId: string, toId: string): GameState {
  return {
    ...state,
    inventory: state.inventory.map(b =>
      b.bookId === fromId ? { bookId: toId, state: "normal" } : b
    ),
  };
}

export function setFlag(state: GameState, key: string, value: any): GameState {
  return {
    ...state,
    flags: { ...state.flags, [key]: value },
  };
}

export function recordChoice(state: GameState, choiceId: string, optionId: string): GameState {
  return {
    ...state,
    keyChoices: { ...state.keyChoices, [choiceId]: optionId },
  };
}

export function triggerSuperMatch(state: GameState, matchId: string): GameState {
  return {
    ...state,
    triggeredSuperMatches: state.triggeredSuperMatches.includes(matchId)
      ? state.triggeredSuperMatches
      : [...state.triggeredSuperMatches, matchId],
  };
}

export function completeEvent(state: GameState, eventId: string): GameState {
  return {
    ...state,
    completedEvents: state.completedEvents.includes(eventId)
      ? state.completedEvents
      : [...state.completedEvents, eventId],
  };
}

export function canTraverse(state: GameState, connection: Connection): boolean {
  switch (connection.requirement) {
    case "none":
      return true;
    case "flag":
      return !!state.flags[connection.requirement_value as string];
    case "book":
      return state.inventory.some(b => b.bookId === connection.requirement_value);
    case "tag":
      return state.inventory.some(b => {
        const book = getBook(b.bookId);
        const tags = book ? book.tags : [];
        if (Array.isArray(connection.requirement_value)) {
          return connection.requirement_value.some(v => tags.includes(v));
        }
        return tags.includes(connection.requirement_value as string);
      });
  }
}
