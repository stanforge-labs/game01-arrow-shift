import { LEVELS } from '../src/game/levels.js';
import {
  applyMove,
  createFreshGameState,
  getAvailableMoves,
  getGameStatus,
  solveLevel,
} from '../src/game/model.js';

const failures = [];
const stats = [];

for (const [index, level] of LEVELS.entries()) {
  const state = createFreshGameState(level);
  const firstMoves = getAvailableMoves(state);
  const solution = solveLevel(state);
  const solvableFirstMoves = firstMoves.filter((arrow) => {
    const result = applyMove(state, arrow.id);
    return result && solveLevel(result.state) !== null;
  }).length;
  const occupied = new Set();

  for (const arrow of level.arrows) {
    const key = `${arrow.row},${arrow.col}`;
    if (occupied.has(key)) failures.push(`Level ${level.id}: duplicate cell ${key}`);
    occupied.add(key);
  }

  if (level.id !== index + 1) failures.push(`Expected level id ${index + 1}, got ${level.id}`);
  if (level.arrows.length === 0) failures.push(`Level ${level.id}: empty level`);
  if (getGameStatus(state) !== 'playing') failures.push(`Level ${level.id}: does not start as playing`);
  if (firstMoves.length === 0) failures.push(`Level ${level.id}: no available first move`);
  if (solution === null) failures.push(`Level ${level.id}: no solution`);

  stats.push({
    id: level.id,
    rows: level.rows,
    cols: level.cols,
    arrows: level.arrows.length,
    solution: solution?.length ?? '—',
    firstMoves: firstMoves.length,
    solvableFirstMoves,
  });
}

for (const item of stats) {
  console.log(`Level ${item.id} | ${item.rows}x${item.cols} | ${item.arrows} arrows | solution ${item.solution} | first moves ${item.firstMoves} | viable first ${item.solvableFirstMoves}`);
}

if (failures.length > 0) {
  console.error('\nValidation failures:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`\nValidated ${stats.length} levels.`);
}
