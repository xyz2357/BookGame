import type { GameEvent, ResolveResult } from './types';
import { getBook } from './DataLoader';

export function resolveEvent(event: GameEvent, bookId: string): ResolveResult {
  for (const solution of event.solutions) {
    if (solution.type === "book_match" && solution.required_book_id === bookId) {
      return { outcome: solution.outcome, matchType: "super_match" };
    }
  }

  const book = getBook(bookId);
  const bookTags = book ? book.tags : [];

  for (const solution of event.solutions) {
    if (solution.type === "tag_match" && solution.required_tags) {
      if (solution.match_mode === "all") {
        if (solution.required_tags.every(tag => bookTags.includes(tag))) {
          return { outcome: solution.outcome, matchType: "tag_match" };
        }
      } else {
        if (solution.required_tags.some(tag => bookTags.includes(tag))) {
          return { outcome: solution.outcome, matchType: "tag_match" };
        }
      }
    }
  }

  return { outcome: event.default_outcome, matchType: "default" };
}
