export const DIRECTIONS = ['up', 'right', 'down', 'left'];

const VECTORS = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

export function rotateClockwise(direction) {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % DIRECTIONS.length];
}

export function cloneState(state) {
  return {
    rows: state.rows,
    cols: state.cols,
    arrows: state.arrows.map((arrow) => ({ ...arrow })),
  };
}

export function arrowCanExit(state, arrow) {
  const vector = VECTORS[arrow.direction];
  return !state.arrows.some((other) => {
    if (other.id === arrow.id) return false;
    if (vector.row !== 0 && other.col !== arrow.col) return false;
    if (vector.col !== 0 && other.row !== arrow.row) return false;
    return vector.row < 0 ? other.row < arrow.row
      : vector.row > 0 ? other.row > arrow.row
        : vector.col < 0 ? other.col < arrow.col
          : other.col > arrow.col;
  });
}

export function getAvailableMoves(state) {
  return state.arrows.filter((arrow) => arrowCanExit(state, arrow));
}

export function applyMove(state, arrowId) {
  const arrow = state.arrows.find((item) => item.id === arrowId);
  if (!arrow || !arrowCanExit(state, arrow)) return null;

  const next = cloneState(state);
  next.arrows = next.arrows.filter((item) => item.id !== arrowId);
  const horizontal = arrow.direction === 'left' || arrow.direction === 'right';
  const rotatedIds = [];

  next.arrows.forEach((item) => {
    const isOnShiftLine = horizontal ? item.row === arrow.row : item.col === arrow.col;
    if (isOnShiftLine) {
      item.direction = rotateClockwise(item.direction);
      rotatedIds.push(item.id);
    }
  });

  return {
    state: next,
    exited: { ...arrow },
    shift: { axis: horizontal ? 'row' : 'column', index: horizontal ? arrow.row : arrow.col, rotatedIds },
  };
}

export function getGameStatus(state) {
  if (state.arrows.length === 0) return 'won';
  return getAvailableMoves(state).length === 0 ? 'dead-end' : 'playing';
}

export function stateKey(state) {
  return state.arrows
    .map((arrow) => `${arrow.id}:${arrow.row},${arrow.col},${arrow.direction}`)
    .sort()
    .join('|');
}

export function solveLevel(initialState) {
  const queue = [{ state: cloneState(initialState), moves: [] }];
  const seen = new Set([stateKey(initialState)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (getGameStatus(current.state) === 'won') return current.moves;

    for (const move of getAvailableMoves(current.state)) {
      const result = applyMove(current.state, move.id);
      const key = stateKey(result.state);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: result.state, moves: [...current.moves, move.id] });
      }
    }
  }
  return null;
}
