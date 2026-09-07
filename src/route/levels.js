const VECTORS = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };
const DIRECTIONS = ['up', 'right', 'down', 'left'];

function directionBetween(from, to) {
  const dr = to.row - from.row; const dc = to.col - from.col;
  return Object.keys(VECTORS).find((direction) => VECTORS[direction][0] === dr && VECTORS[direction][1] === dc);
}

function rotateBack(direction, amount) {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) - amount + DIRECTIONS.length * 4) % DIRECTIONS.length];
}

function makeRoute(id, path, { offset = 1, offsets = [], pinned = [], barriers = [], redHerrings = [], rotationLimit, designGoal }) {
  const pathArrows = path.slice(1, -1).map((position, index) => {
    const ideal = directionBetween(position, path[index + 2]);
    const held = pinned.includes(index);
    const amount = held ? 0 : (offsets[index] ?? offset);
    return { id: `r${id}-${index + 1}`, ...position, direction: rotateBack(ideal, amount), pinned: held };
  });
  const arrows = [...pathArrows, ...redHerrings.map((arrow, index) => ({ id: `r${id}-h${index + 1}`, ...arrow, pinned: Boolean(arrow.pinned) }))];
  const occupied = [path[0], path.at(-1), ...arrows, ...barriers];
  const rows = Math.max(3, ...occupied.map((position) => position.row + 1));
  const cols = Math.max(3, ...occupied.map((position) => position.col + 1));
  return { id, rows, cols, start: { ...path[0], direction: directionBetween(path[0], path[1]) }, target: { ...path.at(-1) }, arrows, barriers: barriers.map((barrier) => ({ ...barrier })), rotationLimit, designGoal };
}

export const ROUTE_LEVELS = [
  makeRoute(1, [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }], { rotationLimit: 2, designGoal: 'Learn that Start supplies the first direction.' }),
  makeRoute(2, [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 0, col: 2 }], { rotationLimit: 2, designGoal: 'Turn at an arrow after entering from the side.' }),
  makeRoute(3, [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }], { rotationLimit: 3, designGoal: 'Build a short route with two turns.' }),
  makeRoute(4, [{ row: 3, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 0, col: 2 }], { rotationLimit: 4, redHerrings: [{ row: 0, col: 0, direction: 'left' }, { row: 3, col: 3, direction: 'up' }], designGoal: 'Separate the useful chain from two deliberate decoys.' }),
  makeRoute(5, [{ row: 0, col: 3 }, { row: 1, col: 3 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 1 }, { row: 3, col: 1 }], { offset: 2, rotationLimit: 8, redHerrings: [{ row: 0, col: 0, direction: 'right' }, { row: 3, col: 3, direction: 'left' }], designGoal: 'Spend a full turn budget on a compact zig-zag.' }),
  makeRoute(6, [{ row: 3, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }], { pinned: [1], rotationLimit: 3, designGoal: 'Meet the first Pinned Arrow and keep its direction.' }),
  makeRoute(7, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 1, col: 3 }], { offsets: [1, 0, 2], pinned: [1], rotationLimit: 4, designGoal: 'Use a fixed corner between two regular rotations.' }),
  makeRoute(8, [{ row: 3, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }], { offsets: [0, 1, 2, 0, 1, 1], pinned: [0, 3], rotationLimit: 5, redHerrings: [{ row: 0, col: 3, direction: 'up' }], designGoal: 'Rotate around two fixed directional anchors.' }),
  makeRoute(9, [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }], { rotationLimit: 2, barriers: [{ row: 1, col: 2 }], designGoal: 'Learn that a Barrier stops entry while the route stays clear.' }),
  makeRoute(10, [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 1 }], { rotationLimit: 4, barriers: [{ row: 0, col: 2 }, { row: 1, col: 0 }], redHerrings: [{ row: 2, col: 0, direction: 'left' }], designGoal: 'Take the open bend around two fixed cells.' }),
  makeRoute(11, [{ row: 2, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 0, col: 1 }, { row: 0, col: 2 }], { pinned: [1], rotationLimit: 3, barriers: [{ row: 2, col: 1 }, { row: 1, col: 2 }], designGoal: 'Combine a held turn with a Barrier-aware approach.' }),
  makeRoute(12, [{ row: 4, col: 0 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 2, col: 3 }, { row: 2, col: 4 }], { offsets: [1, 0, 1, 2, 0, 1, 2], pinned: [1, 4], rotationLimit: 7, barriers: [{ row: 4, col: 1 }, { row: 3, col: 2 }, { row: 0, col: 3 }], redHerrings: [{ row: 4, col: 4, direction: 'up' }, { row: 0, col: 0, direction: 'right' }], designGoal: 'Final Route exam: fixed arrows, barriers and several deliberate turns.' }),
];
