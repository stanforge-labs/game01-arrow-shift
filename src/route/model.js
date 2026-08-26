const VECTORS = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };
const DIRECTIONS = ['up', 'right', 'down', 'left'];

export function rotateDirection(direction) { return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % DIRECTIONS.length]; }

export function createRouteState(level) {
  return {
    rows: level.rows,
    cols: level.cols,
    start: { ...level.start },
    target: { ...level.target },
    rotationLimit: level.rotationLimit,
    rotations: 0,
    arrows: level.arrows.map((arrow) => ({ ...arrow, pinned: Boolean(arrow.pinned) })),
    barriers: (level.barriers ?? []).map((barrier, index) => ({ ...barrier, id: barrier.id ?? `barrier-${index + 1}` })),
  };
}

export function cloneRouteState(state) {
  return { ...state, start: { ...state.start }, target: { ...state.target }, arrows: state.arrows.map((arrow) => ({ ...arrow })), barriers: state.barriers.map((barrier) => ({ ...barrier })) };
}

export function rotateRouteArrow(state, arrowId) {
  const arrow = state.arrows.find((item) => item.id === arrowId);
  if (!arrow || arrow.pinned || state.rotations >= state.rotationLimit) return null;
  const next = cloneRouteState(state);
  const target = next.arrows.find((item) => item.id === arrowId);
  target.direction = rotateDirection(target.direction);
  next.rotations += 1;
  return next;
}

function sameCell(a, b) { return a.row === b.row && a.col === b.col; }
function arrowAt(state, row, col) { return state.arrows.find((arrow) => arrow.row === row && arrow.col === col); }
function barrierAt(state, row, col) { return state.barriers.find((barrier) => barrier.row === row && barrier.col === col); }

export function simulateRoute(state) {
  let position = { ...state.start };
  const path = [{ ...position }];
  const visited = new Set();
  const stepLimit = state.rows * state.cols * 4;
  for (let step = 0; step < stepLimit; step += 1) {
    if (sameCell(position, state.target)) return { status: 'success', path };
    const key = `${position.row},${position.col}`;
    if (visited.has(key)) return { status: 'loop', path };
    visited.add(key);
    const arrow = arrowAt(state, position.row, position.col);
    if (!arrow) return { status: 'empty', path };
    const vector = VECTORS[arrow.direction];
    const next = { row: position.row + vector[0], col: position.col + vector[1] };
    if (next.row < 0 || next.row >= state.rows || next.col < 0 || next.col >= state.cols) return { status: 'out', path };
    if (barrierAt(state, next.row, next.col)) return { status: 'barrier', path };
    position = next;
    path.push({ ...position });
  }
  return { status: 'limit', path };
}

export function routeStateKey(state) {
  return state.arrows.map((arrow) => `${arrow.id}:${arrow.direction}`).sort().join('|');
}

export function solveRoute(levelOrState) {
  const initial = levelOrState.arrows && 'rotations' in levelOrState ? cloneRouteState(levelOrState) : createRouteState(levelOrState);
  const queue = [{ state: initial, moves: [] }];
  const seen = new Set([routeStateKey(initial)]);
  while (queue.length) {
    const current = queue.shift();
    if (simulateRoute(current.state).status === 'success') return current.moves;
    if (current.state.rotations >= current.state.rotationLimit) continue;
    for (const arrow of current.state.arrows) {
      if (arrow.pinned) continue;
      const next = rotateRouteArrow(current.state, arrow.id);
      const key = routeStateKey(next);
      if (!seen.has(key)) { seen.add(key); queue.push({ state: next, moves: [...current.moves, arrow.id] }); }
    }
  }
  return null;
}
