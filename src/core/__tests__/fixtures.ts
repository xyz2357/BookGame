import type { Book, GameEvent, GameNode, Ending } from '../types';

export const testBooks: Book[] = [
  { id: "book_a", title: "Book A", author: "Author A", quote: "Quote A", tags: ["fire", "courage"], description: "Test book A" },
  { id: "book_b", title: "Book B", author: "Author B", quote: "Quote B", tags: ["water", "calm"], description: "Test book B" },
  { id: "book_c", title: "Book C", author: "Author C", quote: "Quote C", tags: ["fire", "water", "earth"], description: "Test book C" },
];

export const testEvents: GameEvent[] = [
  {
    id: "evt_1",
    node_id: "node_start",
    description: "A door blocks the way.",
    prompt: "Choose a book",
    solutions: [
      { type: "book_match" as const, required_book_id: "book_a", outcome: { text: "Super match!", effects: [{ type: "set_flag" as const, key: "door_open", value: true }], next_node: "node_end" } },
      { type: "tag_match" as const, required_tags: ["fire"], outcome: { text: "Tag match.", effects: [{ type: "set_flag" as const, key: "door_open", value: true }], next_node: "node_end" } },
    ],
    default_outcome: { text: "Nothing happens.", effects: [], next_node: null },
  },
  {
    id: "evt_2",
    node_id: "node_start",
    description: "A puzzle.",
    prompt: "Choose a book",
    solutions: [
      { type: "tag_match" as const, required_tags: ["water", "earth"], match_mode: "all" as const, outcome: { text: "Both matched!", effects: [], next_node: null } },
    ],
    default_outcome: { text: "Doesn't work.", effects: [], next_node: null },
  },
];

export const testNodes: GameNode[] = [
  { id: "node_start", name: "Start", description: "The beginning.", events: ["evt_1", "evt_2"], connections: [{ target: "node_end", label: "Go forward", requirement: "flag" as const, requirement_value: "door_open" }] },
  { id: "node_end", name: "End", description: "The end.", events: [], connections: [] },
];

export const testEndings: Ending[] = [
  { id: "ending_good", name: "Good End", conditions: [{ type: "flag" as const, key: "door_open", value: true }], text: "You won!", priority: 50 },
  { id: "ending_bad", name: "Bad End", conditions: [{ type: "key_choice" as const, choice_id: "choice_1", value: "wrong" }], text: "You lost.", priority: 30 },
  { id: "ending_fallback", name: "Fallback", conditions: [], text: "Nothing happened.", priority: 0 },
];
