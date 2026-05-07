import { describe, it, expect } from 'vitest';
import { gameData, getBook, getEvent, getNode, getEndings } from '../DataLoader';

const { books, events, nodes, endings } = gameData;
const bookIds = new Set(books.map(b => b.id));
const eventIds = new Set(events.map(e => e.id));
const nodeIds = new Set(nodes.map(n => n.id));

describe('data integrity: references', () => {
  it('all event.node_id references exist in nodes', () => {
    for (const event of events) {
      expect(nodeIds.has(event.node_id), `event ${event.id} references non-existent node ${event.node_id}`).toBe(true);
    }
  });

  it('all node.events references exist in events', () => {
    for (const node of nodes) {
      for (const eventId of node.events) {
        expect(eventIds.has(eventId), `node ${node.id} references non-existent event ${eventId}`).toBe(true);
      }
    }
  });

  it('all connection.target references exist in nodes', () => {
    for (const node of nodes) {
      for (const conn of node.connections) {
        expect(nodeIds.has(conn.target), `node ${node.id} has connection to non-existent node ${conn.target}`).toBe(true);
      }
    }
  });

  it('all book_match solution.required_book_id references exist in books', () => {
    for (const event of events) {
      for (const solution of event.solutions) {
        if (solution.type === 'book_match' && solution.required_book_id) {
          expect(bookIds.has(solution.required_book_id), `event ${event.id} references non-existent book ${solution.required_book_id}`).toBe(true);
        }
      }
    }
  });

  it('all effect book_id references exist in books', () => {
    for (const event of events) {
      const allOutcomes = [
        event.default_outcome,
        ...event.solutions.map(s => s.outcome),
      ];
      for (const outcome of allOutcomes) {
        for (const effect of outcome.effects) {
          if (effect.type === 'gain_book' || effect.type === 'lose_book' || effect.type === 'mark_book') {
            expect(bookIds.has(effect.book_id), `event ${event.id} has effect referencing non-existent book ${effect.book_id}`).toBe(true);
          }
          if (effect.type === 'transform_book') {
            expect(bookIds.has(effect.from_id), `event ${event.id} has transform_book with non-existent from_id ${effect.from_id}`).toBe(true);
            expect(bookIds.has(effect.to_id), `event ${event.id} has transform_book with non-existent to_id ${effect.to_id}`).toBe(true);
          }
        }
      }
    }
  });

  it('all effect node_id references exist in nodes', () => {
    for (const event of events) {
      const allOutcomes = [
        event.default_outcome,
        ...event.solutions.map(s => s.outcome),
      ];
      for (const outcome of allOutcomes) {
        for (const effect of outcome.effects) {
          if (effect.type === 'unlock_node' || effect.type === 'lock_node') {
            expect(nodeIds.has(effect.node_id), `event ${event.id} has effect referencing non-existent node ${effect.node_id}`).toBe(true);
          }
        }
      }
    }
  });

  it('all ending conditions reference things that are set somewhere in events', () => {
    const allFlags = new Set<string>();
    const allChoiceIds = new Set<string>();
    const allSuperMatches = new Set<string>();
    const allGainedBooks = new Set<string>();
    const allLostBooks = new Set<string>();

    for (const event of events) {
      const allOutcomes = [
        event.default_outcome,
        ...event.solutions.map(s => s.outcome),
      ];
      for (const outcome of allOutcomes) {
        for (const effect of outcome.effects) {
          if (effect.type === 'set_flag') allFlags.add(effect.key);
          if (effect.type === 'record_choice') allChoiceIds.add(effect.choice_id);
          if (effect.type === 'trigger_super_match') allSuperMatches.add(effect.match_id);
          if (effect.type === 'gain_book') allGainedBooks.add(effect.book_id);
          if (effect.type === 'lose_book') allLostBooks.add(effect.book_id);
        }
      }
    }

    for (const ending of endings) {
      for (const condition of ending.conditions) {
        if (condition.type === 'flag') {
          expect(allFlags.has(condition.key), `ending ${ending.id} requires flag '${condition.key}' which is never set`).toBe(true);
        }
        if (condition.type === 'key_choice') {
          expect(allChoiceIds.has(condition.choice_id), `ending ${ending.id} requires choice '${condition.choice_id}' which is never recorded`).toBe(true);
        }
        if (condition.type === 'super_match_triggered') {
          expect(allSuperMatches.has(condition.match_id), `ending ${ending.id} requires super_match '${condition.match_id}' which is never triggered`).toBe(true);
        }
      }
    }
  });

  it('every blocking event has at least 2 different books that can solve it', () => {
    const requiredFlags = new Set<string>();
    for (const node of nodes) {
      for (const conn of node.connections) {
        if (conn.requirement === 'flag' && conn.requirement_value) {
          requiredFlags.add(conn.requirement_value as string);
        }
      }
    }

    for (const event of events) {
      if (event.solutions.length === 0) continue;
      const setsRequiredFlag = event.solutions.some(s =>
        s.outcome.effects.some(e =>
          e.type === 'set_flag' && requiredFlags.has(e.key)
        )
      );
      if (!setsRequiredFlag) continue;

      const solvingBooks = new Set<string>();

      for (const solution of event.solutions) {
        if (solution.type === 'book_match' && solution.required_book_id) {
          solvingBooks.add(solution.required_book_id);
        }
        if (solution.type === 'tag_match' && solution.required_tags) {
          for (const book of books) {
            const matchMode = solution.match_mode || 'any';
            if (matchMode === 'all') {
              if (solution.required_tags.every(tag => book.tags.includes(tag))) {
                solvingBooks.add(book.id);
              }
            } else {
              if (solution.required_tags.some(tag => book.tags.includes(tag))) {
                solvingBooks.add(book.id);
              }
            }
          }
        }
      }

      expect(solvingBooks.size, `event ${event.id} can only be solved by ${solvingBooks.size} book(s): ${[...solvingBooks].join(', ')}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('data integrity: reachability', () => {
  it('every node is reachable from entrance', () => {
    const reachable = new Set<string>();
    const queue: string[] = ['entrance'];
    reachable.add('entrance');

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = getNode(current);
      if (!node) continue;

      for (const conn of node.connections) {
        if (!reachable.has(conn.target)) {
          reachable.add(conn.target);
          queue.push(conn.target);
        }
      }

      for (const eventId of node.events) {
        const event = getEvent(eventId);
        if (!event) continue;
        const allOutcomes = [
          event.default_outcome,
          ...event.solutions.map(s => s.outcome),
        ];
        for (const outcome of allOutcomes) {
          if (outcome.next_node && !reachable.has(outcome.next_node)) {
            reachable.add(outcome.next_node);
            queue.push(outcome.next_node);
          }
        }
      }
    }

    for (const node of nodes) {
      expect(reachable.has(node.id), `node ${node.id} is not reachable from entrance`).toBe(true);
    }
  });

  it('every ending is achievable', () => {
    const allFlags = new Map<string, any>();
    const allChoices = new Map<string, string>();
    const allSuperMatches = new Set<string>();
    const allGainedBooks = new Set<string>();
    const allLostBooks = new Set<string>();
    const allVisitableNodes = new Set<string>();

    const queue: string[] = ['entrance'];
    allVisitableNodes.add('entrance');

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = getNode(current);
      if (!node) continue;

      for (const eventId of node.events) {
        const event = getEvent(eventId);
        if (!event) continue;
        const allOutcomes = [
          event.default_outcome,
          ...event.solutions.map(s => s.outcome),
        ];
        for (const outcome of allOutcomes) {
          for (const effect of outcome.effects) {
            if (effect.type === 'set_flag') allFlags.set(effect.key, effect.value);
            if (effect.type === 'record_choice') allChoices.set(effect.choice_id, effect.option_id);
            if (effect.type === 'trigger_super_match') allSuperMatches.add(effect.match_id);
            if (effect.type === 'gain_book') allGainedBooks.add(effect.book_id);
            if (effect.type === 'lose_book') allLostBooks.add(effect.book_id);
          }
          if (outcome.next_node && !allVisitableNodes.has(outcome.next_node)) {
            allVisitableNodes.add(outcome.next_node);
            queue.push(outcome.next_node);
          }
        }
      }

      for (const conn of node.connections) {
        if (!allVisitableNodes.has(conn.target)) {
          allVisitableNodes.add(conn.target);
          queue.push(conn.target);
        }
      }
    }

    const starterBooks = new Set(books.map(b => b.id));

    for (const ending of endings) {
      let achievable = true;
      const reasons: string[] = [];

      for (const condition of ending.conditions) {
        switch (condition.type) {
          case 'flag':
            if (!allFlags.has(condition.key) || allFlags.get(condition.key) !== condition.value) {
              achievable = false;
              reasons.push(`flag '${condition.key}' = ${condition.value} never achievable`);
            }
            break;
          case 'key_choice':
            if (!allChoices.has(condition.choice_id)) {
              achievable = false;
              reasons.push(`choice '${condition.choice_id}' never recorded`);
            }
            break;
          case 'super_match_triggered':
            if (!allSuperMatches.has(condition.match_id)) {
              achievable = false;
              reasons.push(`super_match '${condition.match_id}' never triggered`);
            }
            break;
          case 'has_book':
            if (!starterBooks.has(condition.book_id) && !allGainedBooks.has(condition.book_id)) {
              achievable = false;
              reasons.push(`book '${condition.book_id}' never obtainable`);
            }
            break;
          case 'lost_book':
            if (!allLostBooks.has(condition.book_id)) {
              achievable = false;
              reasons.push(`book '${condition.book_id}' never lost`);
            }
            break;
          case 'visited_node':
            if (!allVisitableNodes.has(condition.node_id)) {
              achievable = false;
              reasons.push(`node '${condition.node_id}' never visitable`);
            }
            break;
        }
      }

      expect(achievable, `ending ${ending.id} is not achievable: ${reasons.join(', ')}`).toBe(true);
    }
  });

  it('every node has outgoing paths or is a terminal node where endings can trigger', () => {
    for (const node of nodes) {
      const hasConnections = node.connections.length > 0;

      let hasEventNextNode = false;
      for (const eventId of node.events) {
        const event = getEvent(eventId);
        if (!event) continue;
        const allOutcomes = [
          event.default_outcome,
          ...event.solutions.map(s => s.outcome),
        ];
        for (const outcome of allOutcomes) {
          if (outcome.next_node) {
            hasEventNextNode = true;
            break;
          }
        }
        if (hasEventNextNode) break;
      }

      const isTerminal = !hasConnections && !hasEventNextNode;

      if (isTerminal) {
        const canTriggerEnding = endings.some(e => e.conditions.length === 0) || endings.length > 0;
        expect(canTriggerEnding, `node ${node.id} is a dead-end with no possible ending`).toBe(true);
      } else {
        expect(hasConnections || hasEventNextNode, `node ${node.id} has no way out`).toBe(true);
      }
    }
  });

  it('for each non-none connection requirement, there exists at least one event effect that could satisfy it', () => {
    const allSetFlags = new Set<string>();
    const allGainedBooks = new Set<string>();
    const allBookTags = new Map<string, string[]>();

    for (const book of books) {
      allBookTags.set(book.id, book.tags);
    }

    for (const event of events) {
      const allOutcomes = [
        event.default_outcome,
        ...event.solutions.map(s => s.outcome),
      ];
      for (const outcome of allOutcomes) {
        for (const effect of outcome.effects) {
          if (effect.type === 'set_flag') allSetFlags.add(effect.key);
          if (effect.type === 'unlock_node') allSetFlags.add(`unlocked_${effect.node_id}`);
          if (effect.type === 'gain_book') allGainedBooks.add(effect.book_id);
        }
      }
    }

    for (const node of nodes) {
      for (const conn of node.connections) {
        if (conn.requirement === 'none') continue;

        if (conn.requirement === 'flag') {
          const flagKey = conn.requirement_value as string;
          expect(allSetFlags.has(flagKey), `connection from ${node.id} to ${conn.target} requires flag '${flagKey}' which is never set by any event`).toBe(true);
        }

        if (conn.requirement === 'book') {
          const bookId = conn.requirement_value as string;
          const isStarterOrGainable = bookIds.has(bookId);
          expect(isStarterOrGainable, `connection from ${node.id} to ${conn.target} requires book '${bookId}' which doesn't exist`).toBe(true);
        }

        if (conn.requirement === 'tag') {
          const tags = Array.isArray(conn.requirement_value) ? conn.requirement_value : [conn.requirement_value as string];
          const someBookHasTag = books.some(book => tags.some(tag => book.tags.includes(tag)));
          expect(someBookHasTag, `connection from ${node.id} to ${conn.target} requires tag(s) '${tags.join(',')}' which no book has`).toBe(true);
        }
      }
    }
  });
});
