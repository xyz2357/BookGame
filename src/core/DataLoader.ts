import type { Book, GameEvent, GameNode, Ending, GameData } from './types';
import booksData from '../data/books.json';
import eventsData from '../data/events.json';
import nodesData from '../data/nodes.json';
import endingsData from '../data/endings.json';

export const gameData: GameData = {
  books: (booksData as unknown as { books: Book[] }).books,
  events: (eventsData as unknown as { events: GameEvent[] }).events,
  nodes: (nodesData as unknown as { nodes: GameNode[] }).nodes,
  endings: (endingsData as unknown as { endings: Ending[] }).endings,
};

export function getBook(id: string): Book | undefined {
  return gameData.books.find(b => b.id === id);
}

export function getEvent(id: string): GameEvent | undefined {
  return gameData.events.find(e => e.id === id);
}

export function getNode(id: string): GameNode | undefined {
  return gameData.nodes.find(n => n.id === id);
}

export function getEventsByNode(nodeId: string): GameEvent[] {
  return gameData.events.filter(e => e.node_id === nodeId);
}

export function getEndings(): Ending[] {
  return gameData.endings;
}
