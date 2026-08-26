export const VECTORS = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1],
};

export const DIRECTIONS = ['up', 'right', 'down', 'left'];

export function rotateDirection(direction) {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % DIRECTIONS.length];
}

function sameCell(a, b) { return a.row === b.row && a.col === b.col; }
function arrowAt(state, row, col) { return state.arrows.find((arrow) => arrow.row === row && arrow.col === col); }
function barrierAt(state, row, col) { return state.barriers.some((barrier) => barrier.row === row && barrier.col === col); }

export function createRouteState(level) {
  return {
    rows: level.rows,
    cols: level.cols,
    start: { ...level.start },
    target: { ...level.target },
    rotationLimit: level.rotationLimit,
    rotationsUsed: 0,
    arrows: level.arrows.map((arrow) => ({ ...arrow, pinned: Boolean(arrow.pinned) })),
    barriers: (level.barriers ?? []).map((barrier, index) => ({ ...barrier, id: barrier.id ?? `barrier-${index + 1}` })),
  };
}

export function cloneRouteState(state) {
  return {
    ...state,
    start: { ...state.start },
    target: { ...state.target },
    arrows: state.arrows.map((arrow) => ({ ...arrow })),
    barriers: state.barriers.map((barrier) => ({ ...barrier })),
  };
}

export function rotateRouteArrow(state, arrowId) {
  const arrow = state.arrows.find((item) => item.id === arrowId);
  if (!arrow || arrow.pinned || state.rotationsUsed >= state.rotationLimit) return null;
  const next = cloneRouteState(state);
  const target = next.arrows.find((item) => item.id === arrowId);
  target.direction = rotateDirection(target.direction);
  next.rotationsUsed += 1;
  return next;
}

function result(status, reason, path, visitedStates, steps) {
  return { status, success: status === 'success', reason, path, visitedStates, steps };
}

/** Pure signal simulation shared by UI, solver, reports and tests. */
export function simulateRoute(state) {
  let position = { row: state.start.row, col: state.start.col };
  let direction = state.start.direction;
  const path = [{ ...position }];
  const visitedStates = [];
  const seen = new Set();
  const safetyLimit = state.rows * state.cols * 8;

  for (let steps = 0; steps < safetyLimit; steps += 1) {
    const stateKey = `${position.row},${position.col},${direction}`;
    if (seen.has(stateKey)) return result('loop', 'loop', path, visitedStates, steps);
    seen.add(stateKey);
    visitedStates.push({ row: position.row, col: position.col, direction });
    const vector = VECTORS[direction];
    const next = { row: position.row + vector[0], col: position.col + vector[1] };
    if (next.row < 0 || next.row >= state.rows || next.col < 0 || next.col >= state.cols) return result('out', 'out', path, visitedStates, steps);
    path.push({ ...next });
    if (sameCell(next, state.target)) return result('success', 'target', path, visitedStates, steps + 1);
    if (barrierAt(state, next.row, next.col)) return result('barrier', 'barrier', path, visitedStates, steps + 1);
    const arrow = arrowAt(state, next.row, next.col);
    if (!arrow) return result('empty', 'empty', path, visitedStates, steps + 1);
    position = next;
    direction = arrow.direction;
  }
  return result('limit', 'loop', path, visitedStates, safetyLimit);
}

export function routeStateKey(state) {
  return state.arrows.map((arrow) => `${arrow.id}:${arrow.direction}`).sort().join('|');
}

export function solveRoute(levelOrState) {
  const initial = levelOrState.arrows && 'rotationsUsed' in levelOrState ? cloneRouteState(levelOrState) : createRouteState(levelOrState);
  const queue = [{ state: initial, moves: [] }];
  const seen = new Set([routeStateKey(initial)]);
  while (queue.length) {
    const current = queue.shift();
    if (simulateRoute(current.state).success) return current.moves;
    if (current.state.rotationsUsed >= current.state.rotationLimit) continue;
    for (const arrow of current.state.arrows) {
      if (arrow.pinned) continue;
      const next = rotateRouteArrow(current.state, arrow.id);
      const key = routeStateKey(next);
      if (!seen.has(key)) { seen.add(key); queue.push({ state: next, moves: [...current.moves, arrow.id] }); }
    }
  }
  return null;
}
