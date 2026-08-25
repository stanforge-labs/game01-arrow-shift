import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels.js';
import { applyMove, arrowCanExit, cloneState, createFreshGameState, getAvailableMoves, getGameStatus, resetState, rotateClockwise, solveLevel } from './model.js';
import { getInitialLevelIndex } from '../storage.js';

const state = (arrows) => ({ rows: 3, cols: 3, arrows });

describe('Arrow Shift model', () => {
  it('finds an unobstructed path and rejects a blocked arrow', () => {
    const board = state([
      { id: 'a', row: 1, col: 0, direction: 'right' },
      { id: 'b', row: 1, col: 1, direction: 'up' },
    ]);
    expect(arrowCanExit(board, board.arrows[0])).toBe(false);
    expect(arrowCanExit(board, board.arrows[1])).toBe(true);
    expect(getAvailableMoves(board).map((arrow) => arrow.id)).toEqual(['b']);
  });

  it('removes a moved arrow and rotates its remaining row clockwise', () => {
    const board = state([
      { id: 'a', row: 1, col: 0, direction: 'left' },
      { id: 'b', row: 1, col: 1, direction: 'up' },
      { id: 'c', row: 2, col: 1, direction: 'right' },
    ]);
    const result = applyMove(board, 'a');
    expect(result.state.arrows).toEqual([
      { id: 'b', row: 1, col: 1, direction: 'right' },
      { id: 'c', row: 2, col: 1, direction: 'right' },
    ]);
    expect(result.shift).toEqual({ axis: 'row', index: 1, rotatedIds: ['b'], heldIds: [] });
  });

  it('rotates only the remaining arrows in a vertical shift column', () => {
    const board = state([
      { id: 'a', row: 0, col: 1, direction: 'up' },
      { id: 'b', row: 1, col: 1, direction: 'left' },
      { id: 'c', row: 1, col: 2, direction: 'up' },
    ]);
    const result = applyMove(board, 'a');
    expect(result.state.arrows.find((arrow) => arrow.id === 'b').direction).toBe('up');
    expect(result.state.arrows.find((arrow) => arrow.id === 'c').direction).toBe('up');
    expect(result.shift.rotatedIds).toEqual(['b']);
  });

  it('uses a four-step clockwise direction cycle', () => {
    expect(['up', 'right', 'down', 'left'].map(rotateClockwise)).toEqual(['right', 'down', 'left', 'up']);
  });

  it('recognizes a win and a dead end', () => {
    expect(getGameStatus(state([]))).toBe('won');
    const locked = state([
      { id: 'a', row: 0, col: 0, direction: 'right' },
      { id: 'b', row: 0, col: 1, direction: 'down' },
      { id: 'c', row: 1, col: 1, direction: 'left' },
      { id: 'd', row: 1, col: 0, direction: 'up' },
    ]);
    expect(getGameStatus(locked)).toBe('dead-end');
  });

  it('returns no move result for an invalid or blocked move', () => {
    const board = state([{ id: 'a', row: 1, col: 1, direction: 'left' }, { id: 'b', row: 1, col: 0, direction: 'up' }]);
    expect(applyMove(board, 'a')).toBeNull();
    expect(applyMove(board, 'missing')).toBeNull();
  });

  it('restores a level as a deep copy of its original state', () => {
    const original = state([
      { id: 'a', row: 1, col: 0, direction: 'left' },
      { id: 'b', row: 1, col: 1, direction: 'up' },
    ]);
    const changed = applyMove(original, 'a').state;
    changed.arrows[0].direction = 'down';
    const reset = resetState(original);
    expect(reset).toEqual(original);
    expect(reset).not.toBe(original);
    expect(reset.arrows[0]).not.toBe(original.arrows[0]);
    expect(changed).not.toEqual(reset);
    expect(cloneState(reset)).toEqual(reset);
  });

  it('creates a fresh state from the level definition and resets DEV start to level 1', () => {
    const definition = { rows: 2, cols: 2, arrows: [{ id: 'a', row: 0, col: 0, direction: 'up' }] };
    const fresh = createFreshGameState(definition);
    fresh.arrows[0].direction = 'down';
    expect(definition.arrows[0].direction).toBe('up');
    expect(fresh).toEqual({ rows: 2, cols: 2, arrows: [{ id: 'a', row: 0, col: 0, direction: 'down', pinned: false }] });
    expect(getInitialLevelIndex(8, true, 10)).toBe(0);
    expect(getInitialLevelIndex(8, false, 10)).toBe(7);
  });

  it('rotates regular arrows but holds pinned arrows during SHIFT', () => {
    const board = state([
      { id: 'exit', row: 1, col: 0, direction: 'left' },
      { id: 'pinned', row: 1, col: 1, direction: 'up', pinned: true },
      { id: 'regular', row: 1, col: 2, direction: 'down' },
    ]);
    const result = applyMove(board, 'exit');
    expect(result.state.arrows).toEqual([
      { id: 'pinned', row: 1, col: 1, direction: 'up', pinned: true },
      { id: 'regular', row: 1, col: 2, direction: 'left' },
    ]);
    expect(result.shift.rotatedIds).toEqual(['regular']);
    expect(result.shift.heldIds).toEqual(['pinned']);
  });

  it('allows a pinned arrow with a clear path to exit and removes it', () => {
    const board = state([{ id: 'pinned', row: 0, col: 1, direction: 'up', pinned: true }]);
    expect(getAvailableMoves(board).map((arrow) => arrow.id)).toEqual(['pinned']);
    const result = applyMove(board, 'pinned');
    expect(result.state.arrows).toEqual([]);
    expect(result.exited.pinned).toBe(true);
  });

  it('treats a pinned arrow as a path blocker', () => {
    const board = state([
      { id: 'regular', row: 1, col: 0, direction: 'right' },
      { id: 'pinned', row: 1, col: 1, direction: 'up', pinned: true },
    ]);
    expect(arrowCanExit(board, board.arrows[0])).toBe(false);
    expect(arrowCanExit(board, board.arrows[1])).toBe(true);
  });

  it('solves a compact level that depends on a pinned direction', () => {
    const initial = createFreshGameState({
      rows: 3,
      cols: 3,
      arrows: [
        { id: 'exit', row: 1, col: 0, direction: 'left' },
        { id: 'pinned', row: 1, col: 1, direction: 'up', pinned: true },
        { id: 'regular', row: 1, col: 2, direction: 'right' },
      ],
    });
    expect(solveLevel(initial)).toEqual(['exit', 'pinned', 'regular']);
  });

  it('solves all shipped levels', () => {
    expect(LEVELS).toHaveLength(30);
    for (const level of LEVELS) {
      const initial = createFreshGameState(level);
      const solution = solveLevel(initial);
      expect(getGameStatus(initial)).toBe('playing');
      expect(getAvailableMoves(initial).length).toBeGreaterThan(0);
      expect(new Set(level.arrows.map((arrow) => `${arrow.row},${arrow.col}`)).size).toBe(level.arrows.length);
      expect(solution, `Level ${level.id} should be solvable`).not.toBeNull();
      expect(solution).toHaveLength(level.arrows.length);
      if (level.id < 10) expect(level.arrows.some((arrow) => arrow.pinned)).toBe(false);
      if (level.id >= 10) expect(level.arrows.some((arrow) => arrow.pinned)).toBe(true);
    }
  });
});
