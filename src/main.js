import './styles.css';
import { LEVELS } from './game/levels.js';
import { applyMove, arrowCanExit, createFreshGameState, getGameStatus } from './game/model.js';
import { getText } from './i18n.js';
import { getInitialLevelIndex, loadSave, saveProgress } from './storage.js';

const app = document.querySelector('#app');
const initialSave = loadSave();
const game = {
  levelIndex: getInitialLevelIndex(initialSave.level, import.meta.env.DEV, LEVELS.length),
  language: initialSave.language,
  state: null,
  status: 'playing',
  animating: false,
  exitingId: null,
  blockedId: null,
  rotatedIds: [],
  pendingExitTimer: null,
  pendingBlockedTimer: null,
  pendingPulseTimer: null,
  restartCount: 0,
};

app.addEventListener('click', (event) => {
  const restartButton = event.composedPath().find((node) => (
    node instanceof HTMLButtonElement && node.dataset.action === 'restart'
  ));
  if (restartButton && app.contains(restartButton)) {
    event.preventDefault();
    if (restartButton.dataset.testid === 'restart-button') game.restartCount += 1;
    resetLevel();
  }
}, true);

function currentLevel() {
  return LEVELS[game.levelIndex];
}

function resetLevel() {
  window.clearTimeout(game.pendingExitTimer);
  window.clearTimeout(game.pendingBlockedTimer);
  window.clearTimeout(game.pendingPulseTimer);
  game.pendingExitTimer = null;
  game.pendingBlockedTimer = null;
  game.pendingPulseTimer = null;
  game.state = createFreshGameState(currentLevel());
  game.status = 'playing';
  game.animating = false;
  game.exitingId = null;
  game.blockedId = null;
  game.rotatedIds = [];
  saveProgress(game.levelIndex + 1, game.language);
  render();
}

function makeArrowIcon(direction) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'arrow-icon');
  icon.dataset.direction = direction;
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('viewBox', '0 0 48 48');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M24 39V11M12 23l12-12 12 12');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '6');
  icon.append(path);
  return icon;
}

function exitVector(direction) {
  return ({ up: '0,-150%', right: '150%,0', down: '0,150%', left: '-150%,0' })[direction];
}

function onArrowClick(arrow) {
  if (game.animating || game.status !== 'playing') return;
  if (!arrowCanExit(game.state, arrow)) {
    game.blockedId = arrow.id;
    render();
    game.pendingBlockedTimer = window.setTimeout(() => {
      game.pendingBlockedTimer = null;
      game.blockedId = null;
      render();
    }, 280);
    return;
  }

  game.animating = true;
  game.exitingId = arrow.id;
  render();
  game.pendingExitTimer = window.setTimeout(() => {
    game.pendingExitTimer = null;
    const result = applyMove(game.state, arrow.id);
    game.state = result.state;
    game.rotatedIds = result.shift.rotatedIds;
    game.exitingId = null;
    game.status = getGameStatus(game.state);
    game.animating = false;
    render();
    game.pendingPulseTimer = window.setTimeout(() => {
      game.pendingPulseTimer = null;
      game.rotatedIds = [];
      render();
    }, 300);
  }, 230);
}

function createArrowButton(arrow) {
  const t = getText(game.language);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'arrow-tile';
  button.style.gridRow = String(arrow.row + 1);
  button.style.gridColumn = String(arrow.col + 1);
  button.style.setProperty('--exit-vector', exitVector(arrow.direction));
  button.setAttribute('aria-label', `${t.arrow}: ${t.direction[arrow.direction]}`);
  if (game.exitingId === arrow.id) button.classList.add('is-exiting');
  if (game.blockedId === arrow.id) button.classList.add('is-blocked');
  if (game.rotatedIds.includes(arrow.id)) button.classList.add('is-rotating');
  button.append(makeArrowIcon(arrow.direction));
  button.addEventListener('click', () => onArrowClick(arrow));
  return button;
}

function createButton(label, className, handler, { action, testId } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  if (action) button.dataset.action = action;
  if (testId) button.dataset.testid = testId;
  if (handler) button.addEventListener('click', handler);
  return button;
}

function render() {
  const t = getText(game.language);
  const shell = document.createElement('section');
  shell.className = 'game-shell';

  const header = document.createElement('header');
  header.className = 'topbar';
  const titleGroup = document.createElement('div');
  titleGroup.className = 'title-group';
  const title = document.createElement('h1');
  title.textContent = t.gameTitle;
  const level = document.createElement('p');
  level.className = 'level-label';
  level.dataset.testid = 'level-number';
  level.textContent = `${t.level} ${game.levelIndex + 1}`;
  titleGroup.append(title, level);
  const controls = document.createElement('div');
  controls.className = 'topbar-controls';
  controls.append(
    createButton(t.language, 'text-button language-button', () => {
      game.language = game.language === 'ru' ? 'en' : 'ru';
      saveProgress(game.levelIndex + 1, game.language);
      render();
    }),
    createButton(t.restart, 'text-button', null, { action: 'restart', testId: 'restart-button' }),
  );
  header.append(titleGroup, controls);

  const board = document.createElement('div');
  board.className = `board ${game.rotatedIds.length > 0 ? 'is-shifting' : ''}`;
  const boardCells = Math.max(currentLevel().rows, currentLevel().cols);
  board.style.setProperty('--board-size', boardCells <= 3 ? '360px' : boardCells === 4 ? '430px' : '490px');
  board.style.setProperty('--columns', currentLevel().cols);
  board.style.setProperty('--rows', currentLevel().rows);
  board.dataset.testid = 'game-board';
  board.setAttribute('aria-label', `${t.gameTitle}, ${t.level} ${game.levelIndex + 1}`);
  game.state.arrows.forEach((arrow) => board.append(createArrowButton(arrow)));

  if (game.status !== 'playing') {
    const overlay = document.createElement('div');
    overlay.className = 'result-card';
    const message = document.createElement('strong');
    message.textContent = game.status === 'won' ? t.done : t.noMoves;
    overlay.append(message);
    if (game.status === 'won' && game.levelIndex < LEVELS.length - 1) {
      overlay.append(createButton(t.next, 'primary-button', () => { game.levelIndex += 1; resetLevel(); }));
    } else if (game.status === 'dead-end') {
      overlay.append(createButton(t.tryAgain, 'primary-button', null, { action: 'restart', testId: 'dead-end-restart-button' }));
    }
    board.append(overlay);
  }

  const hint = document.createElement('p');
  hint.className = 'hint';
  if (game.levelIndex === 2 && game.status === 'playing') hint.textContent = t.shiftHint;

  shell.append(header, board, hint);
  if (import.meta.env.DEV) {
    const devInfo = document.createElement('div');
    devInfo.className = 'dev-info';
    const devBuild = document.createElement('small');
    devBuild.className = 'dev-build';
    devBuild.textContent = 'DEV 4474005';
    const devRestartCount = document.createElement('small');
    devRestartCount.className = 'dev-restart-count';
    devRestartCount.dataset.testid = 'dev-restart-count';
    devRestartCount.textContent = `Restart: ${game.restartCount}`;
    devInfo.append(devBuild, devRestartCount);
    shell.append(devInfo);
  }
  app.replaceChildren(shell);
}

resetLevel();
