import { describe, expect, it } from 'vitest';
import { ROUTE_LEVELS } from './levels.js';
import { createRouteState, rotateRouteArrow, simulateRoute, solveRoute } from './model.js';

const baseLevel = { rows: 3, cols: 3, start: { row: 1, col: 0, direction: 'right' }, target: { row: 1, col: 2 }, rotationLimit: 3, arrows: [{ id: 'a', row: 1, col: 1, direction: 'up' }], barriers: [] };

describe('route model', () => {
  it('moves from Start into an arrow and uses the arrow exit direction', () => {
    const state = createRouteState({ ...baseLevel, arrows: [{ id: 'a', row: 1, col: 1, direction: 'down' }, { id: 'b', row: 2, col: 1, direction: 'right' },], target: { row: 2, col: 2 } });
    const result = simulateRoute(state);
    expect(result.success).toBe(true);
    expect(result.reason).toBe('target');
    expect(result.path).toEqual([{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }]);
  });

  it('rotates regular arrows, but pinned arrows cannot rotate', () => {
    const state = createRouteState({ ...baseLevel, arrows: [{ id: 'a', row: 1, col: 1, direction: 'up' }, { id: 'p', row: 2, col: 1, direction: 'right', pinned: true }] });
    const rotated = rotateRouteArrow(state, 'a');
    expect(rotated.arrows.find((arrow) => arrow.id === 'a').direction).toBe('right');
    expect(rotated.rotationsUsed).toBe(1);
    expect(rotateRouteArrow(rotated, 'p')).toBeNull();
  });

  it('reports empty, barrier, out and loop outcomes', () => {
    expect(simulateRoute(createRouteState(baseLevel)).reason).toBe('empty');
    expect(simulateRoute(createRouteState({ ...baseLevel, barriers: [{ row: 1, col: 1 }] })).reason).toBe('barrier');
    expect(simulateRoute(createRouteState({ ...baseLevel, target: { row: 2, col: 2 }, arrows: [{ id: 'a', row: 1, col: 1, direction: 'up' }, { id: 'b', row: 0, col: 1, direction: 'up' }] })).reason).toBe('out');
    expect(simulateRoute(createRouteState({ ...baseLevel, target: { row: 2, col: 2 }, arrows: [{ id: 'a', row: 1, col: 1, direction: 'down' }, { id: 'b', row: 2, col: 1, direction: 'up' }] })).reason).toBe('loop');
  });

  it('keeps rotation limit and reset state deterministic', () => {
    const state = createRouteState({ ...baseLevel, rotationLimit: 1 });
    const rotated = rotateRouteArrow(state, 'a');
    expect(rotateRouteArrow(rotated, 'a')).toBeNull();
    expect(createRouteState(baseLevel).rotationsUsed).toBe(0);
    expect(createRouteState(baseLevel).arrows[0].direction).toBe('up');
  });

  it('solves every authored route level within its rotation limit', () => {
    ROUTE_LEVELS.forEach((level) => {
      const solution = solveRoute(level);
      expect(solution).not.toBeNull();
      expect(solution.length).toBeLessThanOrEqual(level.rotationLimit);
    });
  });
});
