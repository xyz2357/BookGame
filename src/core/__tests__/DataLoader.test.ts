import { describe, it, expect } from 'vitest';
import { getBook, getEvent, getNode, getEventsByNode, getEndings } from '../DataLoader';

describe('getBook', () => {
  it('returns correct book by id', () => {
    const book = getBook('starter_handbook');
    expect(book).toBeDefined();
    expect(book!.title).toBe('图书馆员手册');
    expect(book!.tags).toEqual(['规则', '整理', '基础', '知识']);
  });

  it('returns undefined for nonexistent id', () => {
    const book = getBook('nonexistent_book');
    expect(book).toBeUndefined();
  });
});

describe('getEvent', () => {
  it('returns correct event', () => {
    const event = getEvent('e12_collapse');
    expect(event).toBeDefined();
    expect(event!.node_id).toBe('back_corridor');
    expect(event!.solutions).toHaveLength(2);
  });
});

describe('getNode', () => {
  it('returns correct node', () => {
    const node = getNode('entrance');
    expect(node).toBeDefined();
    expect(node!.name).toBe('入口');
    expect(node!.connections).toHaveLength(1);
  });
});

describe('getEventsByNode', () => {
  it('returns events for a given node', () => {
    const events = getEventsByNode('entrance');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('e01_dust');
  });
});

describe('getEndings', () => {
  it('returns all endings', () => {
    const endings = getEndings();
    expect(endings).toHaveLength(5);
    expect(endings.map(e => e.id)).toEqual(
      expect.arrayContaining(['ending_read', 'ending_truth', 'ending_substitute', 'ending_peace', 'ending_default'])
    );
  });
});
