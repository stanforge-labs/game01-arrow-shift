import { LEVELS } from '../src/game/levels.js';
import { createFreshGameState, solveLevel } from '../src/game/model.js';
import { ROUTE_LEVELS } from '../src/route/levels.js';
import { createRouteState, rotateRouteArrow, simulateRoute, solveRoute } from '../src/route/model.js';
import { RUSH_TEMPLATES } from '../src/rush/levels.js';

const puzzleValid = LEVELS.every((level) => solveLevel(createFreshGameState(level)));
const routeSolutions = ROUTE_LEVELS.map((level) => solveRoute(level));
const routeResults = ROUTE_LEVELS.map((level, index) => ({ level, solution: routeSolutions[index] }));
const rushValid = RUSH_TEMPLATES.every((level) => solveLevel(createFreshGameState(level)));
if (!puzzleValid || routeSolutions.some((solution, index) => !solution || solution.length > ROUTE_LEVELS[index].rotationLimit) || !rushValid) process.exitCode = 1;
console.log(`Puzzle:\n${LEVELS.length} levels validated`);
console.log(`Route:`);
routeResults.forEach(({ level, solution }) => console.log(`Level ${level.id} | ${level.rows}x${level.cols} | arrows ${level.arrows.length} | pinned ${level.arrows.filter((arrow) => arrow.pinned).length} | barriers ${level.barriers.length} | rotationLimit ${level.rotationLimit} | optimalRotations ${solution.length} | routeSteps ${simulateRouteForReport(level, solution)}`));
console.log(`${ROUTE_LEVELS.length} levels validated`);
console.log(`Rush:\n${RUSH_TEMPLATES.length} templates validated\ntiers 1–4`);

function simulateRouteForReport(level, solution) {
  let state = createRouteState(level);
  solution.forEach((arrowId) => { state = rotateRouteArrow(state, arrowId); });
  return simulateRoute(state).steps;
}
