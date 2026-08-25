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
    expect(result.shift).toEqual({ axis: 'row', index: 1, rotatedIds: ['b'] });
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
    expect(fresh).toEqual({ rows: 2, cols: 2, arrows: [{ id: 'a', row: 0, col: 0, direction: 'down' }] });
    expect(getInitialLevelIndex(8, true, 10)).toBe(0);
    expect(getInitialLevelIndex(8, false, 10)).toBe(7);
  });

  it('solves all shipped levels', () => {
    for (const level of LEVELS) {
      const solution = solveLevel(level);
      expect(solution, `Level ${level.id} should be solvable`).not.toBeNull();
      expect(solution).toHaveLength(level.arrows.length);
    }
  });
});
