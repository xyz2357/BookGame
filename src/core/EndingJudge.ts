import type { GameState, Ending } from './types';
import { getEndings } from './DataLoader';

export function judgeEnding(state: GameState): Ending | null {
  const endings = getEndings().sort((a, b) => b.priority - a.priority);

  for (const ending of endings) {
    if (ending.conditions.every(condition => checkCondition(state, condition))) {
      return ending;
    }
  }

  return null;
}

function checkCondition(state: GameState, condition: Ending["conditions"][number]): boolean {
  switch (condition.type) {
    case "key_choice":
      return state.keyChoices[condition.choice_id] === condition.value;
    case "flag":
      return state.flags[condition.key] === condition.value;
    case "has_book":
      return state.inventory.some(b => b.bookId === condition.book_id);
    case "lost_book":
      return !state.inventory.some(b => b.bookId === condition.book_id);
    case "super_match_triggered":
      return state.triggeredSuperMatches.includes(condition.match_id);
    case "visited_node":
      return state.visitedNodes.includes(condition.node_id);
  }
}
