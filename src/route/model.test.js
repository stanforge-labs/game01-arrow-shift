import { describe, expect, it } from 'vitest';
import { ROUTE_LEVELS } from './levels.js';
import { createRouteState, rotateRouteArrow, simulateRoute, solveRoute } from './model.js';

describe('route model', () => {
  it('rotates regular arrows clockwise and keeps pinned arrows fixed', () => {
    const state = createRouteState({ rows: 3, cols: 3, start: { row: 1, col: 0 }, target: { row: 1, col: 2 }, rotationLimit: 3, arrows: [{ id: 'a', row: 1, col: 0, direction: 'up' }, { id: 'p', row: 1, col: 1, direction: 'right', pinned: true }], barriers: [] });
    const rotated = rotateRouteArrow(state, 'a');
    expect(rotated.arrows.find((arrow) => arrow.id === 'a').direction).toBe('right');
    expect(rotateRouteArrow(rotated, 'p')).toBeNull();
  });

  it('reports barrier, empty and out outcomes', () => {
    const base = { rows: 3, cols: 3, start: { row: 1, col: 0 }, target: { row: 1, col: 2 }, rotationLimit: 1, arrows: [{ id: 'a', row: 1, col: 0, direction: 'right' }], barriers: [{ row: 1, col: 1 }] };
    expect(simulateRoute(createRouteState(base)).status).toBe('barrier');
    expect(simulateRoute(createRouteState({ ...base, barriers: [], arrows: [] })).status).toBe('empty');
    expect(simulateRoute(createRouteState({ ...base, barriers: [], target: { row: 2, col: 2 }, arrows: [{ id: 'a', row: 1, col: 0, direction: 'left' }] })).status).toBe('out');
  });

  it('solves every authored route level within its rotation limit', () => {
    ROUTE_LEVELS.forEach((level) => expect(solveRoute(level)?.length).toBeLessThanOrEqual(level.rotationLimit));
  });
});
