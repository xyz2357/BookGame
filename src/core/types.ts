export interface Book {
  id: string;
  title: string;
  author: string;
  quote: string;
  tags: string[];
  description: string;
  image?: string;
}

export type BookState = "normal" | "worn" | "glowing" | "consumed";

export interface BookInstance {
  bookId: string;
  state: BookState;
}

export type Effect =
  | { type: "gain_book"; book_id: string }
  | { type: "lose_book"; book_id: string }
  | { type: "mark_book"; book_id: string; state: BookState }
  | { type: "transform_book"; from_id: string; to_id: string }
  | { type: "set_flag"; key: string; value: any }
  | { type: "unlock_node"; node_id: string }
  | { type: "lock_node"; node_id: string }
  | { type: "record_choice"; choice_id: string; option_id: string }
  | { type: "trigger_super_match"; match_id: string };

export interface Outcome {
  text: string;
  book_text?: Record<string, string>;
  effects: Effect[];
  next_node: string | null;
}

export interface Solution {
  type: "book_match" | "tag_match";
  required_book_id?: string;
  required_tags?: string[];
  match_mode?: "any" | "all";
  outcome: Outcome;
}

export interface GameEvent {
  id: string;
  node_id: string;
  description: string;
  prompt: string;
  solutions: Solution[];
  default_outcome: Outcome;
  harsh?: boolean;
  character?: string;
  image?: string;
}

export interface Connection {
  target: string;
  label: string;
  requirement: "none" | "tag" | "flag" | "book";
  requirement_value?: string | string[];
}

export interface GameNode {
  id: string;
  name: string;
  description: string;
  image?: string;
  character?: string;
  events: string[];
  connections: Connection[];
}

export type EndingCondition =
  | { type: "key_choice"; choice_id: string; value: string }
  | { type: "flag"; key: string; value: any }
  | { type: "has_book"; book_id: string }
  | { type: "lost_book"; book_id: string }
  | { type: "super_match_triggered"; match_id: string }
  | { type: "visited_node"; node_id: string };

export interface Ending {
  id: string;
  name: string;
  conditions: EndingCondition[];
  text: string;
  priority: number;
  image?: string;
}

export interface GameState {
  currentNodeId: string;
  inventory: BookInstance[];
  flags: Record<string, any>;
  visitedNodes: string[];
  triggeredSuperMatches: string[];
  keyChoices: Record<string, string>;
  completedEvents: string[];
  hp: number;
  maxHp: number;
}

export type MatchType = "super_match" | "tag_match" | "default";

export interface ResolveResult {
  outcome: Outcome;
  matchType: MatchType;
}

export type Screen = "main_menu" | "node_view" | "event_view" | "inventory_view" | "ending_view";

export interface GameData {
  books: Book[];
  events: GameEvent[];
  nodes: GameNode[];
  endings: Ending[];
}
