import type { GameState, Effect } from './types';
import {
  addBook,
  removeBook,
  markBook,
  transformBook,
  setFlag,
  recordChoice,
  triggerSuperMatch,
} from './GameState';

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  let current = state;

  for (const effect of effects) {
    switch (effect.type) {
      case "gain_book":
        current = addBook(current, effect.book_id);
        break;
      case "lose_book":
        current = removeBook(current, effect.book_id);
        break;
      case "mark_book":
        current = markBook(current, effect.book_id, effect.state);
        break;
      case "transform_book":
        current = transformBook(current, effect.from_id, effect.to_id);
        break;
      case "set_flag":
        current = setFlag(current, effect.key, effect.value);
        break;
      case "unlock_node":
        current = setFlag(current, `unlocked_${effect.node_id}`, true);
        break;
      case "lock_node":
        current = setFlag(current, `locked_${effect.node_id}`, true);
        break;
      case "record_choice":
        current = recordChoice(current, effect.choice_id, effect.option_id);
        break;
      case "trigger_super_match":
        current = triggerSuperMatch(current, effect.match_id);
        break;
    }
  }

  return current;
}
