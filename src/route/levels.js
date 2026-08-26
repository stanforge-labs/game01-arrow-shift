const VECTORS = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };
const DIRECTIONS = ['up', 'right', 'down', 'left'];
function directionBetween(from, to) { const dr = to.row - from.row; const dc = to.col - from.col; return Object.keys(VECTORS).find((direction) => VECTORS[direction][0] === dr && VECTORS[direction][1] === dc); }
function rotateBack(direction, amount) { return DIRECTIONS[(DIRECTIONS.indexOf(direction) - amount + DIRECTIONS.length * 4) % DIRECTIONS.length]; }
function makeRoute(id, path, offset, { rotationLimit, pinned = [], barriers = [], distractors = [], designGoal }) {
  const arrows = path.slice(0, -1).map((position, index) => ({ id: `r${id}-${index + 1}`, row: position.row, col: position.col, direction: rotateBack(directionBetween(position, path[index + 1]), pinned.includes(index) ? 0 : offset), pinned: pinned.includes(index) }));
  distractors.forEach((arrow, index) => arrows.push({ id: `r${id}-d${index + 1}`, ...arrow }));
  return { id, rows: Math.max(3, Math.max(...path.map((p) => p.row), ...barriers.map((p) => p.row), ...arrows.map((p) => p.row)) + 1), cols: Math.max(3, Math.max(...path.map((p) => p.col), ...barriers.map((p) => p.col), ...arrows.map((p) => p.col)) + 1), start: { ...path[0] }, target: { ...path[path.length - 1] }, arrows, barriers, rotationLimit, designGoal };
}

export const ROUTE_LEVELS = [
  makeRoute(1, [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }], 0, { rotationLimit: 2, designGoal: 'Read a straight route' }),
  makeRoute(2, [{ row: 1, col: 0 }, { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], 1, { rotationLimit: 3, designGoal: 'Turn before the first run' }),
  makeRoute(3, [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 1, col: 1 }, { row: 0, col: 1 }], 1, { rotationLimit: 4, designGoal: 'Build a compact corner' }),
  makeRoute(4, [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 1, col: 2 }, { row: 0, col: 2 }], 1, { rotationLimit: 5, distractors: [{ row: 0, col: 0, direction: 'left' }], designGoal: 'Choose the useful branch' }),
  makeRoute(5, [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }], 2, { rotationLimit: 8, distractors: [{ row: 0, col: 2, direction: 'up' }], designGoal: 'Plan a zig-zag route' }),
  makeRoute(6, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }], 1, { rotationLimit: 7, distractors: [{ row: 0, col: 3, direction: 'down' }], designGoal: 'Keep the long route aligned' }),
  makeRoute(7, [{ row: 2, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 0, col: 2 }], 1, { rotationLimit: 6, pinned: [2], designGoal: 'Read a pinned turn' }),
  makeRoute(8, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }], 2, { rotationLimit: 10, pinned: [1, 4], designGoal: 'Rotate around fixed arrows' }),
  makeRoute(9, [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 2, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 0, col: 2 }], 1, { rotationLimit: 8, barriers: [{ row: 0, col: 0 }], designGoal: 'Keep the route off a Barrier' }),
  makeRoute(10, [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 2 }], 2, { rotationLimit: 11, barriers: [{ row: 0, col: 2 }, { row: 3, col: 0 }], designGoal: 'Route through a busy board' }),
  makeRoute(11, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 3 }], 1, { rotationLimit: 10, pinned: [1, 4], barriers: [{ row: 0, col: 3 }, { row: 3, col: 0 }], designGoal: 'Combine fixed turns and space' }),
  makeRoute(12, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 }], 2, { rotationLimit: 16, pinned: [1, 5], barriers: [{ row: 0, col: 3 }, { row: 4, col: 0 }], designGoal: 'Final route exam' }),
];
