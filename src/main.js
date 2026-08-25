import './styles.css';
import { LEVELS } from './game/levels.js';
import { applyMove, arrowCanExit, createFreshGameState, getGameStatus } from './game/model.js';
import { getText } from './i18n.js';
import { getLayoutMetrics } from './layout.js';
import { getInitialLevelIndex, isLevelUnlocked, loadSave, saveSave } from './storage.js';
import { createAudioController, haptic } from './audio.js';

const app = document.querySelector('#app');
const initialSave = loadSave();
const audio = createAudioController();
const game = {
  screen: 'home',
  levelIndex: getInitialLevelIndex(initialSave.lastPlayedLevel, import.meta.env.DEV, LEVELS.length),
  language: initialSave.language,
  soundOn: initialSave.soundOn,
  highestUnlockedLevel: Math.min(Math.max(initialSave.highestUnlockedLevel, 1), LEVELS.length),
  state: null,
  status: 'playing',
  animating: false,
  exitingId: null,
  blockedId: null,
  rotatedIds: [],
  heldIds: [],
  shift: null,
  pendingExitTimer: null,
  pendingBlockedTimer: null,
  pendingPulseTimer: null,
};
audio.setEnabled(game.soundOn);

function currentLevel() { return LEVELS[game.levelIndex]; }

function persist() {
  saveSave({
    saveVersion: 2,
    language: game.language,
    soundOn: game.soundOn,
    highestUnlockedLevel: game.highestUnlockedLevel,
    lastPlayedLevel: game.levelIndex + 1,
  });
}

function clearTimers() {
  window.clearTimeout(game.pendingExitTimer);
  window.clearTimeout(game.pendingBlockedTimer);
  window.clearTimeout(game.pendingPulseTimer);
  game.pendingExitTimer = null;
  game.pendingBlockedTimer = null;
  game.pendingPulseTimer = null;
}

function resetLevel() {
  clearTimers();
  game.state = createFreshGameState(currentLevel());
  game.status = 'playing';
  game.animating = false;
  game.exitingId = null;
  game.blockedId = null;
  game.rotatedIds = [];
  game.heldIds = [];
  game.shift = null;
  persist();
  render();
}

function startLevel(index) {
  if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) return;
  if (!isLevelUnlocked(index + 1, game.highestUnlockedLevel, import.meta.env.DEV)) return;
  game.levelIndex = index;
  game.screen = 'game';
  resetLevel();
}

function goHome() {
  clearTimers();
  game.animating = false;
  game.screen = 'home';
  persist();
  render();
}

function goLevels() {
  clearTimers();
  game.animating = false;
  game.screen = 'levels';
  render();
}

function makeArrowIcon(direction) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'arrow-icon'); icon.dataset.direction = direction; icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('viewBox', '0 0 48 48');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M24 6 40 23H31v19H17V23H8Z'); path.setAttribute('fill', 'currentColor'); icon.append(path); return icon;
}

function makeRestartIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('class', 'restart-icon'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M19 8a8 8 0 1 0 1 5M19 8V3m0 5h-5'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-width', '1.9'); icon.append(path); return icon;
}

function makeHomeIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('class', 'home-icon'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'm4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1Z'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-width', '1.9'); icon.append(path); return icon;
}

function makeSoundIcon(isOn = true) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('class', 'sound-icon'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M4 10v4h4l5 4V6l-5 4Zm12 0a4 4 0 0 1 0 4m2-6a7 7 0 0 1 0 8'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-width', '1.9'); icon.append(path);
  if (!isOn) { const mute = document.createElementNS('http://www.w3.org/2000/svg', 'path'); mute.setAttribute('d', 'm16 8 5 5m0-5-5 5'); mute.setAttribute('fill', 'none'); mute.setAttribute('stroke', 'currentColor'); mute.setAttribute('stroke-linecap', 'round'); mute.setAttribute('stroke-linejoin', 'round'); mute.setAttribute('stroke-width', '1.9'); icon.append(mute); }
  return icon;
}

function makeDirectionMotif() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'home-motif'); icon.setAttribute('viewBox', '0 0 96 20'); icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M4 10h12m-4-4 4 4-4 4M28 16V4m-4 4 4-4 4 4M52 10H40m4-4-4 4 4 4M76 4v12m-4-4 4 4 4-4');
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-width', '1.4'); icon.append(path); return icon;
}

function exitVector(direction) { return ({ up: '0,-150%', right: '150%,0', down: '0,150%', left: '-150%,0' })[direction]; }

function blockerType(arrow) {
  const vector = ({ up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] })[arrow.direction];
  const before = (row, col) => vector[0] < 0 ? row < arrow.row : vector[0] > 0 ? row > arrow.row : vector[1] < 0 ? col < arrow.col : col > arrow.col;
  if (game.state.arrows.some((other) => other.id !== arrow.id && (vector[0] === 0 ? other.row === arrow.row : other.col === arrow.col) && before(other.row, other.col))) return 'blocked';
  if ((game.state.barriers ?? []).some((barrier) => (vector[0] === 0 ? barrier.row === arrow.row : barrier.col === arrow.col) && before(barrier.row, barrier.col))) return 'barrierBlocked';
  return null;
}

function onArrowClick(arrow) {
  if (game.animating || game.status !== 'playing') return;
  const blocker = blockerType(arrow);
  if (blocker) {
    game.blockedId = arrow.id; audio.play(blocker); haptic(blocker === 'blocked' ? 20 : 18); render();
    game.pendingBlockedTimer = window.setTimeout(() => { game.pendingBlockedTimer = null; game.blockedId = null; render(); }, 220);
    return;
  }
  audio.play('tilePress');
  game.animating = true; game.exitingId = arrow.id; render();
  game.pendingExitTimer = window.setTimeout(() => {
    game.pendingExitTimer = null;
    const result = applyMove(game.state, arrow.id);
    game.state = result.state; game.rotatedIds = result.shift.rotatedIds; game.heldIds = result.shift.heldIds; game.shift = result.shift; game.exitingId = null; game.status = getGameStatus(game.state); game.animating = false;
    audio.play('exit'); if (result.shift.rotatedIds.length || result.shift.heldIds.length) audio.play('shift'); if (result.shift.heldIds.length) { audio.play('pinnedHold'); haptic(18); } if (game.status === 'won') { audio.play('victory'); game.highestUnlockedLevel = Math.max(game.highestUnlockedLevel, Math.min(game.levelIndex + 2, LEVELS.length)); persist(); }
    render();
    game.pendingPulseTimer = window.setTimeout(() => { game.pendingPulseTimer = null; game.rotatedIds = []; game.heldIds = []; game.shift = null; render(); }, 260);
  }, 220);
}

function createArrowButton(arrow) {
  const t = getText(game.language); const button = document.createElement('button'); button.type = 'button'; button.className = 'arrow-tile'; button.dataset.arrowId = arrow.id; button.style.gridRow = String(arrow.row + 1); button.style.gridColumn = String(arrow.col + 1); button.style.setProperty('--exit-vector', exitVector(arrow.direction)); button.setAttribute('aria-label', `${t.arrow}: ${t.direction[arrow.direction]}${arrow.pinned ? `, ${t.pinned}` : ''}`);
  if (arrow.pinned) button.classList.add('is-pinned'); if (game.exitingId === arrow.id) button.classList.add('is-exiting'); if (game.blockedId === arrow.id) button.classList.add('is-blocked'); if (game.rotatedIds.includes(arrow.id)) button.classList.add('is-rotating'); if (game.heldIds.includes(arrow.id)) button.classList.add('is-held'); button.append(makeArrowIcon(arrow.direction)); button.addEventListener('click', () => onArrowClick(arrow)); return button;
}

function createBarrierTile(barrier) { const tile = document.createElement('div'); tile.className = 'barrier-tile'; tile.dataset.barrierId = barrier.id; tile.style.gridRow = String(barrier.row + 1); tile.style.gridColumn = String(barrier.col + 1); tile.setAttribute('role', 'img'); tile.setAttribute('aria-label', getText(game.language).barrier); return tile; }

function createButton(label, className, handler, { action, testId, playClick = true } = {}) { const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label; if (action) button.dataset.action = action; if (testId) button.dataset.testid = testId; if (handler) button.addEventListener('click', () => { if (playClick) audio.play('uiClick'); handler(); }); return button; }

function createIconButton(label, icon, className, handler, testId, playClick = true) { const button = createButton('', `${className} icon-button`, handler, { testId, playClick }); button.append(icon); button.setAttribute('aria-label', label); button.title = label; return button; }

function toggleLanguage() { game.language = game.language === 'ru' ? 'en' : 'ru'; persist(); render(); }
function toggleSound() { const nextValue = !game.soundOn; if (nextValue) { game.soundOn = true; audio.setEnabled(true); audio.play('uiClick'); } else { audio.play('uiClick'); game.soundOn = false; audio.setEnabled(false); } persist(); render(); }

function renderHomeScreen() {
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'menu-shell home-screen';
  const wordmark = document.createElement('h1'); wordmark.className = 'home-wordmark'; wordmark.textContent = t.gameTitle;
  const motif = makeDirectionMotif();
  const hasProgress = game.highestUnlockedLevel > 1 || game.levelIndex > 0;
  const progress = document.createElement('p'); progress.className = 'home-progress'; progress.textContent = hasProgress ? `${t.level} ${game.levelIndex + 1}` : '';
  const actions = document.createElement('div'); actions.className = 'menu-actions';
  actions.append(createButton(hasProgress ? t.continue : t.play, 'primary-button menu-primary', () => startLevel(game.levelIndex), { testId: 'home-primary-button' }), createButton(t.levels, 'secondary-button', goLevels, { testId: 'home-levels-button' }));
  const controls = document.createElement('div'); controls.className = 'menu-controls'; controls.append(createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.soundOn ? t.soundOn : t.soundOff, makeSoundIcon(game.soundOn), `sound-button ${game.soundOn ? 'is-on' : 'is-off'}`, toggleSound, 'sound-toggle', false));
  shell.append(wordmark, motif, progress, actions, controls); app.replaceChildren(shell);
}

function renderLevelsScreen() {
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'menu-shell levels-screen';
  const header = document.createElement('div'); header.className = 'menu-header'; header.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'levels-home-button'));
  const title = document.createElement('h1'); title.textContent = t.levels; header.append(title);
  const controls = document.createElement('div'); controls.className = 'menu-header-controls'; controls.append(createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.soundOn ? t.soundOn : t.soundOff, makeSoundIcon(game.soundOn), `sound-button ${game.soundOn ? 'is-on' : 'is-off'}`, toggleSound, 'sound-toggle', false)); header.append(controls);
  const grid = document.createElement('div'); grid.className = 'level-grid';
  for (let index = 0; index < LEVELS.length; index += 1) {
    const levelNumber = index + 1; const unlocked = isLevelUnlocked(levelNumber, game.highestUnlockedLevel, import.meta.env.DEV); const button = createButton(String(levelNumber).padStart(2, '0'), 'level-token', () => startLevel(index), { testId: `level-button-${levelNumber}` }); button.dataset.level = String(levelNumber); button.setAttribute('aria-label', unlocked ? `${t.level} ${levelNumber}` : `${t.level} ${levelNumber}, ${t.locked}`); if (!unlocked) { button.disabled = true; button.classList.add('is-locked'); } else if (levelNumber < game.highestUnlockedLevel) button.classList.add('is-completed'); else if (levelNumber === game.levelIndex + 1) button.classList.add('is-current'); grid.append(button);
  }
  shell.append(header, grid); app.replaceChildren(shell);
}

function createResultCard() {
  const t = getText(game.language);
  const card = document.createElement('div');
  card.className = 'result-card';
  card.dataset.testid = 'result-card';
  const finalVictory = game.status === 'won' && game.levelIndex === LEVELS.length - 1;
  const message = document.createElement('strong');
  message.textContent = finalVictory ? t.allLevelsCompleted : game.status === 'won' ? t.done : t.noMoves;
  card.append(message);
  if (game.status === 'won' && !finalVictory) {
    card.append(createButton(t.next, 'primary-button', () => startLevel(game.levelIndex + 1)));
    card.append(createButton(t.levels, 'secondary-button result-secondary', goLevels));
  } else if (finalVictory) {
    card.append(createButton(t.levels, 'primary-button', goLevels));
    card.append(createButton(t.startOver, 'secondary-button result-secondary', () => startLevel(0), { testId: 'start-over-button' }));
  } else if (game.status === 'dead-end') {
    card.append(createButton(t.tryAgain, 'primary-button', resetLevel, { testId: 'dead-end-restart-button' }));
  }
  return card;
}

function renderGameScreen() {
  const t = getText(game.language); const layout = getLayoutMetrics(currentLevel(), { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }); const shell = document.createElement('section'); shell.className = 'game-shell'; shell.style.setProperty('--board-size', `${layout.boardSize}px`); shell.style.setProperty('--tile-size', `${layout.tileSize}px`);
  const header = document.createElement('header'); header.className = 'topbar'; const brand = document.createElement('div'); brand.className = 'desktop-brand'; brand.textContent = t.gameTitle; const titleGroup = document.createElement('div'); titleGroup.className = 'title-group'; const level = document.createElement('p'); level.className = 'level-label'; level.dataset.testid = 'level-number'; level.textContent = `${t.level} ${game.levelIndex + 1}`; const progress = document.createElement('span'); progress.className = 'progress-label'; progress.textContent = `${game.levelIndex + 1} / ${LEVELS.length}`; titleGroup.append(level, progress); const controls = document.createElement('div'); controls.className = 'topbar-controls'; controls.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'game-home-button'), createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(t.restart, makeRestartIcon(), 'restart-button', resetLevel, 'restart-button')); header.append(brand, titleGroup, controls);
  const board = document.createElement('div'); board.className = `board ${game.rotatedIds.length > 0 ? 'is-shifting' : ''} ${game.status !== 'playing' ? 'has-result' : ''}`; board.style.setProperty('--columns', currentLevel().cols); board.style.setProperty('--rows', currentLevel().rows); board.style.setProperty('--cell-size', `${layout.cellSize}px`); board.style.setProperty('--grid-pixel-size', `${layout.gridPixelSize}px`); board.style.setProperty('--board-padding', `${layout.boardPadding}px`); if (game.shift) { board.classList.add('has-shift-line'); board.dataset.shiftAxis = game.shift.axis; board.style.setProperty('--shift-line-position', `${((game.shift.index + 0.5) / (game.shift.axis === 'row' ? currentLevel().rows : currentLevel().cols)) * 100}%`); } board.dataset.testid = 'game-board'; const gridLines = document.createElement('div'); gridLines.className = 'grid-lines'; gridLines.setAttribute('aria-hidden', 'true'); for (let index = 1; index < layout.gridSize; index += 1) { const vertical = document.createElement('span'); vertical.className = 'grid-line grid-line-vertical'; vertical.style.left = `${index * layout.cellSize}px`; gridLines.append(vertical); const horizontal = document.createElement('span'); horizontal.className = 'grid-line grid-line-horizontal'; horizontal.style.top = `${index * layout.cellSize}px`; gridLines.append(horizontal); } board.append(gridLines); board.setAttribute('aria-label', `${t.gameTitle}, ${t.level} ${game.levelIndex + 1}`); game.state.barriers.forEach((barrier) => board.append(createBarrierTile(barrier))); game.state.arrows.forEach((arrow) => board.append(createArrowButton(arrow)));
  if (game.status !== 'playing') { board.dataset.resultStatus = game.status; board.append(createResultCard()); }
  const hint = document.createElement('p'); hint.className = 'hint'; if (game.status === 'playing' && game.levelIndex === 0) hint.textContent = t.firstHint; if (game.status === 'playing' && game.levelIndex === 2) hint.textContent = t.shiftHint; if (game.status === 'playing' && (game.levelIndex === 9 || game.levelIndex === 10)) hint.textContent = t.pinnedHint; if (game.status === 'playing' && game.levelIndex === 19) hint.textContent = t.barrierHint; shell.append(header, board, hint); app.replaceChildren(shell);
}

function render() { if (game.screen === 'home') renderHomeScreen(); else if (game.screen === 'levels') renderLevelsScreen(); else renderGameScreen(); }

window.addEventListener('resize', () => { if (!game.animating && game.screen === 'game') render(); });
render();
