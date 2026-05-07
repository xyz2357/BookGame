import { describe, it, expect } from 'vitest';
import { getEvent, getNode, getBook } from '../DataLoader';
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
  it('Golden path: super match → truth ending', () => {
    let state = createInitialState();
    expect(state.currentNodeId).toBe('entrance');
    expect(state.hp).toBe(3);

    const eIntro = getEvent('e_intro')!;
    const introResult = resolveEvent(eIntro, 'starter_handbook');
    expect(introResult.matchType).toBe('tag_match');
    expect(introResult.outcome.text).toContain('保持冷静');
    state = applyEffects(state, introResult.outcome.effects);
    state = completeEvent(state, 'e_intro');

    state = moveTo(state, 'front_room');

    const eLinDesk = getEvent('e_lin_desk')!;
    const linDeskResult = resolveEvent(eLinDesk, 'starter_handbook');
    expect(linDeskResult.matchType).toBe('default');
    state = applyEffects(state, linDeskResult.outcome.effects);
    state = completeEvent(state, 'e_lin_desk');
    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(true);
    expect(state.flags['got_lin_letter']).toBe(true);

    state = moveTo(state, 'main_corridor');

    const eRustyDoor = getEvent('e_rusty_door')!;
    const doorResult = resolveEvent(eRustyDoor, 'metamorphosis');
    expect(doorResult.matchType).toBe('super_match');
    state = applyEffects(state, doorResult.outcome.effects);
    state = completeEvent(state, 'e_rusty_door');
    expect(state.flags['passed_rusty_door']).toBe(true);
    expect(state.inventory.find(b => b.bookId === 'metamorphosis')?.state).toBe('glowing');
    expect(state.triggeredSuperMatches).toContain('sm_metamorphosis_door');
    expect(doorResult.outcome.next_node).toBe('deepest');

    state = moveTo(state, 'deepest');

    const eFinal = getEvent('e_final')!;
    const finalResult = resolveEvent(eFinal, 'lin_letter');
    expect(finalResult.matchType).toBe('super_match');
    state = applyEffects(state, finalResult.outcome.effects);
    state = completeEvent(state, 'e_final');
    expect(state.flags['found_lin']).toBe(true);
    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(false);

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_truth');
  });

  it('Alternate path: tag match → silence ending', () => {
    let state = createInitialState();

    const eIntro = getEvent('e_intro')!;
    const introResult = resolveEvent(eIntro, 'metamorphosis');
    expect(introResult.matchType).toBe('default');
    state = applyEffects(state, introResult.outcome.effects);
    state = completeEvent(state, 'e_intro');

    state = moveTo(state, 'front_room');

    const eLinDesk = getEvent('e_lin_desk')!;
    const linDeskResult = resolveEvent(eLinDesk, 'starter_handbook');
    state = applyEffects(state, linDeskResult.outcome.effects);
    state = completeEvent(state, 'e_lin_desk');

    state = moveTo(state, 'main_corridor');

    const eRustyDoor = getEvent('e_rusty_door')!;
    const doorResult = resolveEvent(eRustyDoor, 'painted_skin');
    expect(doorResult.matchType).toBe('tag_match');
    state = applyEffects(state, doorResult.outcome.effects);
    state = completeEvent(state, 'e_rusty_door');
    expect(state.flags['passed_rusty_door']).toBe(true);

    state = moveTo(state, 'deepest');

    const eFinal = getEvent('e_final')!;
    const finalResult = resolveEvent(eFinal, 'starter_handbook');
    expect(finalResult.matchType).toBe('tag_match');
    state = applyEffects(state, finalResult.outcome.effects);
    state = completeEvent(state, 'e_final');
    expect(state.keyChoices['final_choice']).toBe('give_handbook');

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_silence');
  });

  it('Default ending: no matching choice recorded', () => {
    let state = createInitialState();
    state = addBook(state, 'dorian_gray');
    state = setFlag(state, 'passed_rusty_door', true);
    state = moveTo(state, 'deepest');

    const eFinal = getEvent('e_final')!;
    const finalResult = resolveEvent(eFinal, 'dorian_gray');
    expect(finalResult.matchType).toBe('default');
    expect(finalResult.outcome.text).toContain('不是这本');

    state = loseHp(state);
    expect(state.hp).toBe(2);
    expect(state.completedEvents).not.toContain('e_final');

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_default');
  });

  it('Failure costs HP, can retry', () => {
    let state = createInitialState();
    state = moveTo(state, 'main_corridor');

    const eRustyDoor = getEvent('e_rusty_door')!;

    const failResult = resolveEvent(eRustyDoor, 'starter_handbook');
    expect(failResult.matchType).toBe('default');
    state = applyEffects(state, failResult.outcome.effects);
    state = loseHp(state);
    expect(state.hp).toBe(2);
    expect(state.completedEvents).not.toContain('e_rusty_door');

    const successResult = resolveEvent(eRustyDoor, 'painted_skin');
    expect(successResult.matchType).toBe('tag_match');
    state = applyEffects(state, successResult.outcome.effects);
    state = completeEvent(state, 'e_rusty_door');
    expect(state.completedEvents).toContain('e_rusty_door');
    expect(state.flags['passed_rusty_door']).toBe(true);
  });

  it('HP depletion = game over', () => {
    let state = createInitialState();
    state = moveTo(state, 'main_corridor');
    expect(state.hp).toBe(3);

    const eRustyDoor = getEvent('e_rusty_door')!;

    const fail1 = resolveEvent(eRustyDoor, 'starter_handbook');
    expect(fail1.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(2);

    const fail2 = resolveEvent(eRustyDoor, 'dorian_gray');
    expect(fail2.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(1);

    const fail3 = resolveEvent(eRustyDoor, 'dorian_gray');
    expect(fail3.matchType).toBe('default');
    state = loseHp(state);
    expect(state.hp).toBe(0);

    expect(state.completedEvents).not.toContain('e_rusty_door');
  });

  it('Cannot traverse gated connection without flag', () => {
    let state = createInitialState();
    state = moveTo(state, 'main_corridor');

    const mainCorridor = getNode('main_corridor')!;
    const connectionToDeepest = mainCorridor.connections.find(c => c.target === 'deepest')!;

    expect(canTraverse(state, connectionToDeepest)).toBe(false);

    state = setFlag(state, 'passed_rusty_door', true);
    expect(canTraverse(state, connectionToDeepest)).toBe(true);
  });

  it('Auto-trigger event (e_lin_desk) works correctly', () => {
    let state = createInitialState();
    state = moveTo(state, 'front_room');

    const eLinDesk = getEvent('e_lin_desk')!;
    expect(eLinDesk.solutions).toHaveLength(0);

    const result = resolveEvent(eLinDesk, 'starter_handbook');
    expect(result.matchType).toBe('default');
    state = applyEffects(state, result.outcome.effects);

    expect(state.inventory.some(b => b.bookId === 'lin_letter')).toBe(true);
    expect(state.flags['got_lin_letter']).toBe(true);

    state = completeEvent(state, 'e_lin_desk');
    expect(state.completedEvents).toContain('e_lin_desk');
  });

  it('Ending priority: truth beats silence when both could match', () => {
    let state = createInitialState();

    state = setFlag(state, 'found_lin', true);

    const eFinal = getEvent('e_final')!;
    const tagResult = resolveEvent(eFinal, 'starter_handbook');
    state = applyEffects(state, tagResult.outcome.effects);
    expect(state.keyChoices['final_choice']).toBe('give_handbook');
    expect(state.flags['found_lin']).toBe(true);

    const ending = judgeEnding(state);
    expect(ending).not.toBeNull();
    expect(ending!.id).toBe('ending_truth');
    expect(ending!.priority).toBeGreaterThan(30);
  });
});
