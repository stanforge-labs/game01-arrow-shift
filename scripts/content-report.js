import { LEVELS } from '../src/game/levels.js';
import { createFreshGameState, solveLevel } from '../src/game/model.js';
import { ROUTE_LEVELS } from '../src/route/levels.js';
import { solveRoute } from '../src/route/model.js';
import { RUSH_TEMPLATES } from '../src/rush/levels.js';

const puzzleValid = LEVELS.every((level) => solveLevel(createFreshGameState(level)));
const routeSolutions = ROUTE_LEVELS.map((level) => solveRoute(level));
const rushValid = RUSH_TEMPLATES.every((level) => solveLevel(createFreshGameState(level)));
if (!puzzleValid || routeSolutions.some((solution, index) => !solution || solution.length > ROUTE_LEVELS[index].rotationLimit) || !rushValid) process.exitCode = 1;
console.log(`Puzzle:\n${LEVELS.length} levels validated`);
console.log(`Route:\n${ROUTE_LEVELS.length} levels validated`);
console.log(`min/max route length: ${Math.min(...routeSolutions.map((solution) => solution.length))}/${Math.max(...routeSolutions.map((solution) => solution.length))}`);
console.log(`min/max rotations: ${Math.min(...ROUTE_LEVELS.map((level) => level.rotationLimit))}/${Math.max(...ROUTE_LEVELS.map((level) => level.rotationLimit))}`);
console.log(`Rush:\n${RUSH_TEMPLATES.length} templates validated\ntiers 1–4`);
