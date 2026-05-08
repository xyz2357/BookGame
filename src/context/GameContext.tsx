import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, Screen, GameEvent, Outcome, Ending, MatchType } from '../core/types';
import { createInitialState, moveTo, completeEvent, canTraverse, loseHp } from '../core/GameState';
import { getEvent, getNode } from '../core/DataLoader';
import { resolveEvent } from '../core/EventResolver';
import { applyEffects } from '../core/EffectApplier';
import { judgeEnding } from '../core/EndingJudge';
import { saveGame, loadGame, deleteSave, hasSave } from '../core/SaveLoad';

interface State {
  gameState: GameState;
  screen: Screen;
  previousScreen: Screen | null;
  currentEvent: GameEvent | null;
  lastOutcome: Outcome | null;
  lastMatchType: MatchType | null;
  ending: Ending | null;
}

type Action =
  | { type: 'START_GAME' }
  | { type: 'CONTINUE_GAME' }
  | { type: 'MOVE_TO_NODE'; nodeId: string }
  | { type: 'ENTER_EVENT'; eventId: string }
  | { type: 'USE_BOOK'; bookId: string }
  | { type: 'CONFIRM_OUTCOME' }
  | { type: 'OPEN_INVENTORY' }
  | { type: 'CLOSE_INVENTORY' }
  | { type: 'RETURN_TO_MENU' }
  | { type: 'AUTO_EVENT_APPLIED'; gameState: GameState; outcome: Outcome }
  | { type: 'CLEAR_OUTCOME' };

const GAME_OVER_ENDING: Ending = {
  id: 'ending_game_over',
  name: '结局：迷失',
  conditions: [],
  text: '你的意识越来越模糊。书库的灯光在眼前摇晃，最终熄灭。\n\n你倒在书架之间。不知过了多久，有人发现了你——你还活着，但什么都不记得了。',
  priority: 999,
};

const initialState: State = {
  gameState: createInitialState(),
  screen: 'main_menu',
  previousScreen: null,
  currentEvent: null,
  lastOutcome: null,
  lastMatchType: null,
  ending: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_GAME': {
      const freshState = createInitialState();
      saveGame(freshState);
      return {
        ...state,
        gameState: freshState,
        screen: 'node_view',
        currentEvent: null,
        lastOutcome: null,
        lastMatchType: null,
        ending: null,
      };
    }

    case 'CONTINUE_GAME': {
      const saved = loadGame();
      if (!saved) return state;
      return {
        ...state,
        gameState: saved,
        screen: 'node_view',
        currentEvent: null,
        lastOutcome: null,
        lastMatchType: null,
        ending: null,
      };
    }

    case 'MOVE_TO_NODE': {
      const movedState = moveTo(state.gameState, action.nodeId);
      saveGame(movedState);
      return {
        ...state,
        gameState: movedState,
        screen: 'node_view',
        currentEvent: null,
        lastOutcome: null,
        lastMatchType: null,
      };
    }

    case 'ENTER_EVENT': {
      const event = getEvent(action.eventId);
      return {
        ...state,
        currentEvent: event || null,
        screen: 'event_view',
        lastOutcome: null,
        lastMatchType: null,
      };
    }

    case 'USE_BOOK': {
      if (!state.currentEvent) return state;
      const { outcome, matchType } = resolveEvent(state.currentEvent, action.bookId);
      let newGameState = applyEffects(state.gameState, outcome.effects);
      if (matchType === 'default') {
        if (state.currentEvent.harsh) {
          newGameState = loseHp(newGameState);
          if (newGameState.hp <= 0) {
            deleteSave();
            return {
              ...state,
              gameState: newGameState,
              ending: GAME_OVER_ENDING,
              screen: 'ending_view',
              currentEvent: null,
              lastOutcome: null,
              lastMatchType: null,
            };
          }
        }
      } else {
        newGameState = completeEvent(newGameState, state.currentEvent.id);
      }
      return {
        ...state,
        gameState: newGameState,
        lastOutcome: outcome,
        lastMatchType: matchType,
        screen: 'event_view',
        previousScreen: null,
      };
    }

    case 'CONFIRM_OUTCOME': {
      if (!state.lastOutcome) return state;
      let newGameState = state.gameState;
      if (state.lastOutcome.next_node) {
        newGameState = moveTo(newGameState, state.lastOutcome.next_node);
      }
      const node = getNode(newGameState.currentNodeId);
      const hasUnfinishedEvents = node?.events.some(
        eId => !newGameState.completedEvents.includes(eId)
      );
      const hasTraversableConnections = node?.connections.some(
        c => canTraverse(newGameState, c)
      );
      if (!hasUnfinishedEvents && !hasTraversableConnections) {
        const ending = judgeEnding(newGameState);
        if (ending) {
          deleteSave();
          return {
            ...state,
            gameState: newGameState,
            ending,
            screen: 'ending_view',
            currentEvent: null,
            lastOutcome: null,
            lastMatchType: null,
          };
        }
      }
      saveGame(newGameState);
      return {
        ...state,
        gameState: newGameState,
        screen: 'node_view',
        currentEvent: null,
        lastOutcome: null,
        lastMatchType: null,
      };
    }

    case 'OPEN_INVENTORY':
      return { ...state, screen: 'inventory_view', previousScreen: state.screen };

    case 'CLOSE_INVENTORY':
      return { ...state, screen: state.previousScreen || 'node_view', previousScreen: null };

    case 'RETURN_TO_MENU':
      return { ...initialState };

    case 'AUTO_EVENT_APPLIED':
      return {
        ...state,
        gameState: action.gameState,
        lastOutcome: action.outcome,
        lastMatchType: null,
      };

    case 'CLEAR_OUTCOME':
      return {
        ...state,
        lastOutcome: null,
        lastMatchType: null,
      };

    default:
      return state;
  }
}

interface GameContextValue {
  state: State;
  startGame: () => void;
  continueGame: () => void;
  hasSavedGame: () => boolean;
  moveToNode: (nodeId: string) => void;
  enterEvent: (eventId: string) => void;
  useBook: (bookId: string) => void;
  confirmOutcome: () => void;
  openInventory: () => void;
  closeInventory: () => void;
  returnToMenu: () => void;
  autoEventApplied: (gameState: GameState, outcome: Outcome) => void;
  clearOutcome: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: GameContextValue = {
    state,
    startGame: () => dispatch({ type: 'START_GAME' }),
    continueGame: () => dispatch({ type: 'CONTINUE_GAME' }),
    hasSavedGame: hasSave,
    moveToNode: (nodeId) => dispatch({ type: 'MOVE_TO_NODE', nodeId }),
    enterEvent: (eventId) => dispatch({ type: 'ENTER_EVENT', eventId }),
    useBook: (bookId) => dispatch({ type: 'USE_BOOK', bookId }),
    confirmOutcome: () => dispatch({ type: 'CONFIRM_OUTCOME' }),
    openInventory: () => dispatch({ type: 'OPEN_INVENTORY' }),
    closeInventory: () => dispatch({ type: 'CLOSE_INVENTORY' }),
    returnToMenu: () => dispatch({ type: 'RETURN_TO_MENU' }),
    autoEventApplied: (gameState, outcome) => dispatch({ type: 'AUTO_EVENT_APPLIED', gameState, outcome }),
    clearOutcome: () => dispatch({ type: 'CLEAR_OUTCOME' }),
  };

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export { canTraverse };
