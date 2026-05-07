import { describe, it, expect } from 'vitest';
import { getEvent, getNode } from '../DataLoader';
import {
  createInitialState,
  moveTo,
  addBook,
  completeEvent,
  canTraverse,
  loseHp,
  setFlag,
} from '../GameState';
import { resolveEvent } from '../EventResolver';
import { applyEffects } from '../EffectApplier';
import { judgeEnding } from '../EndingJudge';

describe('e2e game flow', () => {
  it('Golden path: super match chain → read ending', () => {
    let state = createInitialState();
    expect(state.currentNodeId).toBe('entrance');
    expect(state.hp).toBe(3);

    // Auto event at entrance
    const e01 = getEvent('e01_dust')!;
    const dustResult = resolveEvent(e01, 'starter_handbook');
    expect(dustResult.matchType).toBe('default');
    state = applyEffects(state, dustResult.outcome.effects);
    state = completeEvent(state, 'e01_dust');

    // front_room: auto event gives lin_letter
    state = moveTo(state, 'front_room');
    const e02 = getEvent('e02_lin_desk')!;
    const linResult = resolveEvent(e02, 'starter_handbook');
    expect(linResult.matchType).toBe('default');
    state = applyEffects(state, linResult.outcome.effects);
    state = completeEvent(state, 'e02_lin_desk');
    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(true);
    expect(state.flags['got_lin_letter']).toBe(true);

    // main_corridor → shelf_a: auto gain dorian_gray
    state = moveTo(state, 'main_corridor');
    state = completeEvent(state, 'e05_whispering');
    state = moveTo(state, 'shelf_a');
    const e07 = getEvent('e07_find_book_a')!;
    state = applyEffects(state, resolveEvent(e07, 'starter_handbook').outcome.effects);
    state = completeEvent(state, 'e07_find_book_a');
    expect(state.inventory.some(b => b.bookId === 'dorian_gray')).toBe(true);

    // Solve misplaced with starter_handbook (tags: 规则,整理,基础,知识 match required: 整理,规则,知识,谜题)
    const e06 = getEvent('e06_misplaced')!;
    const misplacedResult = resolveEvent(e06, 'starter_handbook');
    expect(misplacedResult.matchType).toBe('tag_match');
    state = applyEffects(state, misplacedResult.outcome.effects);
    state = completeEvent(state, 'e06_misplaced');
    expect(state.inventory.some(b => b.bookId === 'madman_diary')).toBe(true);

    // Go back to main_corridor → mirror_hall, solve with dorian_gray (tags include 镜子,画像)
    state = moveTo(state, 'back_corridor');
    state = moveTo(state, 'main_corridor');
    state = moveTo(state, 'mirror_hall');
    const e10 = getEvent('e10_mirror')!;
    const mirrorResult = resolveEvent(e10, 'dorian_gray');
    expect(mirrorResult.matchType).toBe('tag_match');
    state = applyEffects(state, mirrorResult.outcome.effects);
    state = completeEvent(state, 'e10_mirror');
    expect(state.flags['mirror_reached_in']).toBe(true);

    // Enter mirror_world: super match dorian_gray → gain usher
    state = moveTo(state, 'mirror_world');
    const e11 = getEvent('e11_mirror_lin')!;
    const mirrorLinResult = resolveEvent(e11, 'dorian_gray');
    expect(mirrorLinResult.matchType).toBe('super_match');
    state = applyEffects(state, mirrorLinResult.outcome.effects);
    state = completeEvent(state, 'e11_mirror_lin');
    expect(state.inventory.some(b => b.bookId === 'usher')).toBe(true);
    expect(state.triggeredSuperMatches).toContain('sm_dorian_mirror');

    // shelf_b → back_corridor: super match usher on collapse
    state = moveTo(state, 'shelf_b');
    state = completeEvent(state, 'e09_find_book_b');
    state = completeEvent(state, 'e08_crying_child');
    state = moveTo(state, 'back_corridor');
    const e12 = getEvent('e12_collapse')!;
    const collapseResult = resolveEvent(e12, 'usher');
    expect(collapseResult.matchType).toBe('super_match');
    state = applyEffects(state, collapseResult.outcome.effects);
    state = completeEvent(state, 'e12_collapse');
    expect(state.flags['cleared_collapse']).toBe(true);
    expect(state.triggeredSuperMatches).toContain('sm_usher_collapse');

    // forbidden_entry: solve with lin_letter (tags: 警告,谜题 match required: 揭露,觉醒,警告,谜题)
    state = completeEvent(state, 'e13_darkness');
    state = moveTo(state, 'forbidden_entry');
    const e14 = getEvent('e14_reading_book')!;
    const readingResult = resolveEvent(e14, 'lin_letter');
    expect(readingResult.matchType).toBe('tag_match');
    state = applyEffects(state, readingResult.outcome.effects);
    state = completeEvent(state, 'e14_reading_book');
    expect(state.inventory.some(b => b.bookId === 'the_book_that_reads_you')).toBe(true);
    expect(state.flags['dealt_with_book']).toBe(true);

    // deepest: super match the_book_that_reads_you → read ending
    state = moveTo(state, 'deepest');
    const e15 = getEvent('e15_final')!;
    const finalResult = resolveEvent(e15, 'the_book_that_reads_you');
    expect(finalResult.matchType).toBe('super_match');
    state = applyEffects(state, finalResult.outcome.effects);
    state = completeEvent(state, 'e15_final');
    expect(state.flags['found_lin']).toBe(true);
    expect(state.triggeredSuperMatches).toContain('sm_read_the_book');

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_read');
  });

  it('Alternate path: lin_letter at final → truth ending', () => {
    let state = createInitialState();

    // Shortcut to deepest with necessary items
    state = addBook(state, 'lin_letter');
    state = setFlag(state, 'cleared_collapse', true);
    state = setFlag(state, 'dealt_with_book', true);
    state = moveTo(state, 'deepest');

    const e15 = getEvent('e15_final')!;
    const finalResult = resolveEvent(e15, 'lin_letter');
    expect(finalResult.matchType).toBe('super_match');
    state = applyEffects(state, finalResult.outcome.effects);
    state = completeEvent(state, 'e15_final');
    expect(state.flags['found_lin']).toBe(true);
    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(false);

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_truth');
  });

  it('Substitute ending: give handbook at final', () => {
    let state = createInitialState();
    state = moveTo(state, 'deepest');

    const e15 = getEvent('e15_final')!;
    const finalResult = resolveEvent(e15, 'starter_handbook');
    expect(finalResult.matchType).toBe('tag_match');
    state = applyEffects(state, finalResult.outcome.effects);
    state = completeEvent(state, 'e15_final');
    expect(state.keyChoices['final_choice']).toBe('give_handbook');

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_substitute');
  });

  it('Default ending: no matching choice recorded', () => {
    let state = createInitialState();
    state = moveTo(state, 'deepest');

    const e15 = getEvent('e15_final')!;
    const finalResult = resolveEvent(e15, 'painted_skin');
    expect(finalResult.matchType).toBe('default');
    expect(finalResult.outcome.text).toContain('不是这本');

    state = loseHp(state);
    expect(state.hp).toBe(2);
    expect(state.completedEvents).not.toContain('e15_final');

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_default');
  });

  it('Failure costs HP, can retry', () => {
    let state = createInitialState();
    state = addBook(state, 'usher');
    state = moveTo(state, 'back_corridor');

    const e12 = getEvent('e12_collapse')!;

    // Fail with starter_handbook (tags: 规则,整理,基础,知识 — no match on 恐惧,身体,化身,共鸣)
    const failResult = resolveEvent(e12, 'starter_handbook');
    expect(failResult.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(2);
    expect(state.completedEvents).not.toContain('e12_collapse');

    // Succeed with usher (super match)
    const successResult = resolveEvent(e12, 'usher');
    expect(successResult.matchType).toBe('super_match');
    state = applyEffects(state, successResult.outcome.effects);
    state = completeEvent(state, 'e12_collapse');
    expect(state.completedEvents).toContain('e12_collapse');
    expect(state.flags['cleared_collapse']).toBe(true);
  });

  it('HP depletion = game over', () => {
    let state = createInitialState();
    state = moveTo(state, 'back_corridor');
    expect(state.hp).toBe(3);

    const e12 = getEvent('e12_collapse')!;

    const fail1 = resolveEvent(e12, 'starter_handbook');
    expect(fail1.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(2);

    const fail2 = resolveEvent(e12, 'starter_handbook');
    expect(fail2.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(1);

    const fail3 = resolveEvent(e12, 'starter_handbook');
    expect(fail3.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(0);

    expect(state.completedEvents).not.toContain('e12_collapse');
  });

  it('Cannot traverse gated connection without flag', () => {
    let state = createInitialState();
    state = moveTo(state, 'back_corridor');

    const backCorridor = getNode('back_corridor')!;
    const connectionToForbidden = backCorridor.connections.find(c => c.target === 'forbidden_entry')!;

    expect(canTraverse(state, connectionToForbidden)).toBe(false);

    state = setFlag(state, 'cleared_collapse', true);
    expect(canTraverse(state, connectionToForbidden)).toBe(true);
  });

  it('Auto-trigger event (e02_lin_desk) works correctly', () => {
    let state = createInitialState();
    state = moveTo(state, 'front_room');

    const e02 = getEvent('e02_lin_desk')!;
    expect(e02.solutions).toHaveLength(0);

    const result = resolveEvent(e02, 'starter_handbook');
    expect(result.matchType).toBe('default');
    state = applyEffects(state, result.outcome.effects);

    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(true);
    expect(state.flags['got_lin_letter']).toBe(true);

    state = completeEvent(state, 'e02_lin_desk');
    expect(state.completedEvents).toContain('e02_lin_desk');
  });

  it('Ending priority: read beats truth when both could match', () => {
    let state = createInitialState();

    state = setFlag(state, 'found_lin', true);
    state = triggerAndRecord(state);

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_read');
    expect(ending!.priority).toBe(100);
  });
});

function triggerAndRecord(state: GameState) {
  return {
    ...state,
    triggeredSuperMatches: [...state.triggeredSuperMatches, 'sm_read_the_book'],
    keyChoices: { ...state.keyChoices, final_choice: 'give_handbook' },
  };
}

type GameState = ReturnType<typeof createInitialState>;
