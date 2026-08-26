import './styles.css';
import { LEVELS } from './game/levels.js';
import { applyMove, arrowCanExit, createFreshGameState, getGameStatus } from './game/model.js';
import { getText } from './i18n.js';
import { getLayoutMetrics } from './layout.js';
import { getInitialLevelIndex, isLevelUnlocked, loadSave, saveSave } from './storage.js';
import { createAudioController, haptic } from './audio.js';
import { ROUTE_LEVELS } from './route/levels.js';
import { createRouteState, rotateRouteArrow, simulateRoute } from './route/model.js';
import { RUSH_TEMPLATES, nextRushTemplateIndex } from './rush/levels.js';
import { RUSH_DURATION, createRushSession, finishRush, recordRushBlocked, recordRushBoardClear, recordRushExit, tickRush } from './rush/model.js';

const app = document.querySelector('#app');
const initialSave = loadSave();
const audio = createAudioController();
const bootPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('screen') === 'boot';
app.addEventListener('contextmenu', (event) => {
  if (event.target.closest('.game-shell')) event.preventDefault();
});
const game = {
  screen: 'boot',
  mode: 'puzzle',
  levelIndex: getInitialLevelIndex(initialSave.lastPlayedLevel, import.meta.env.DEV, LEVELS.length),
  lastPlayedPuzzleLevel: initialSave.lastPlayedLevel,
  language: initialSave.language,
  sfxOn: initialSave.sfxOn,
  musicOn: initialSave.musicOn,
  audioPopoverOpen: false,
  highestUnlockedLevel: Math.min(Math.max(initialSave.highestUnlockedLevel, 1), LEVELS.length),
  highestUnlockedRoute: Math.min(Math.max(initialSave.highestUnlockedRoute, 1), ROUTE_LEVELS.length),
  routeBestRotations: { ...initialSave.routeBestRotations },
  rushBestScore: initialSave.rushBestScore,
  rushBestBoards: initialSave.rushBestBoards,
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
  routeIndex: 0,
  routeState: null,
  routeStatus: 'planning',
  routePath: [],
  routeStep: 0,
  routeRunResult: null,
  routeReason: null,
  routeRunTimer: null,
  routeFailTimer: null,
  rushSession: null,
  rushTimer: null,
  rushStatus: 'playing',
  rushBonusVisible: false,
  rushBonusTimer: null,
  rushHelpVisible: false,
  rushHelpTimer: null,
  rushComboPulse: false,
  rushComboPulseTimer: null,
  rushBoardEntering: false,
  rushEntranceTimer: null,
  rushNewBest: false,
  rushHistory: [],
};
audio.setSfxEnabled(game.sfxOn);
audio.setMusicEnabled(game.musicOn);

function currentLevel() { return LEVELS[game.levelIndex]; }

function persist() {
  saveSave({
    saveVersion: 4,
    language: game.language,
    soundOn: game.sfxOn || game.musicOn,
    sfxOn: game.sfxOn,
    musicOn: game.musicOn,
    highestUnlockedLevel: game.highestUnlockedLevel,
    lastPlayedLevel: game.lastPlayedPuzzleLevel,
    highestUnlockedRoute: game.highestUnlockedRoute ?? initialSave.highestUnlockedRoute,
    routeBestRotations: game.routeBestRotations ?? initialSave.routeBestRotations,
    rushBestScore: game.rushBestScore ?? initialSave.rushBestScore,
    rushBestBoards: game.rushBestBoards ?? initialSave.rushBestBoards,
  });
}

function clearTimers() {
  window.clearTimeout(game.pendingExitTimer);
  window.clearTimeout(game.pendingBlockedTimer);
  window.clearTimeout(game.pendingPulseTimer);
  game.pendingExitTimer = null;
  game.pendingBlockedTimer = null;
  game.pendingPulseTimer = null;
  window.clearTimeout(game.routeRunTimer);
  game.routeRunTimer = null;
  window.clearTimeout(game.routeFailTimer);
  game.routeFailTimer = null;
  window.clearInterval(game.rushTimer);
  game.rushTimer = null;
  window.clearTimeout(game.rushBonusTimer);
  game.rushBonusTimer = null;
  window.clearTimeout(game.rushHelpTimer);
  game.rushHelpTimer = null;
  window.clearTimeout(game.rushComboPulseTimer);
  game.rushComboPulseTimer = null;
  window.clearTimeout(game.rushEntranceTimer);
  game.rushEntranceTimer = null;
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
  game.mode = 'puzzle';
  game.lastPlayedPuzzleLevel = index + 1;
  game.screen = 'game';
  resetLevel();
}

function startRoute(index) {
  if (!Number.isInteger(index) || index < 0 || index >= ROUTE_LEVELS.length) return;
  if (!isLevelUnlocked(index + 1, game.highestUnlockedRoute, import.meta.env.DEV)) return;
  clearTimers();
  game.mode = 'route'; game.routeIndex = index; game.routeState = createRouteState(ROUTE_LEVELS[index]); game.routeStatus = 'planning'; game.routePath = []; game.routeStep = 0; game.routeRunResult = null; game.routeReason = null; game.screen = 'game'; render();
}

function startRush() {
  clearTimers();
  game.mode = 'rush'; game.rushSession = createRushSession(); game.rushStatus = 'playing'; game.status = 'playing'; game.animating = false; game.exitingId = null; game.rushBonusVisible = false; game.rushHelpVisible = true; game.rushNewBest = false; game.rushHistory = []; game.screen = 'game'; game.levelIndex = nextRushTemplateIndex(-1, 0, game.rushHistory); game.rushHistory.push(game.levelIndex); game.rushSession.templateIndex = game.levelIndex; game.state = createFreshGameState(RUSH_TEMPLATES[game.levelIndex]); game.rushBoardEntering = false; game.rushHelpTimer = window.setTimeout(() => { game.rushHelpVisible = false; game.rushHelpTimer = null; render(); }, 3000); audio.startMusic(); audio.play('rushStart');
  game.rushTimer = window.setInterval(() => {
    game.rushSession = tickRush(game.rushSession);
    if (game.rushSession.ended) endRush(); else render();
  }, 1000);
  render();
}

function goHome() {
  clearTimers();
  game.animating = false;
  game.screen = 'home';
  persist();
  render();
}

function goLevels(mode = game.mode === 'route' ? 'route' : 'puzzle') {
  clearTimers();
  game.animating = false;
  game.mode = mode;
  game.screen = 'levels';
  render();
}

function resetRoute() {
  clearTimers();
  game.routeState = createRouteState(ROUTE_LEVELS[game.routeIndex]); game.routeStatus = 'planning'; game.routePath = []; game.routeStep = 0; game.routeRunResult = null; game.routeReason = null; render();
}

function finishRoute(status, reason) {
  game.routeStatus = status;
  game.routeReason = reason ?? null;
  if (status === 'success') {
    const levelNumber = game.routeIndex + 1;
    game.highestUnlockedRoute = Math.max(game.highestUnlockedRoute, Math.min(levelNumber + 1, ROUTE_LEVELS.length));
    const oldBest = game.routeBestRotations[levelNumber];
    if (oldBest === undefined || oldBest === 0 || game.routeState.rotationsUsed < oldBest) game.routeBestRotations[levelNumber] = game.routeState.rotationsUsed;
    persist();
    audio.play('routeSuccess');
  } else {
    audio.play('routeFail');
    game.routeFailTimer = window.setTimeout(() => {
      game.routeStatus = 'planning';
      game.routeFailTimer = null;
      render();
      window.setTimeout(() => { if (game.routeStatus === 'planning') { game.routePath = []; game.routeStep = 0; game.routeReason = null; render(); } }, 120);
    }, 760);
  }
  render();
}

function runRoute() {
  if (game.routeStatus !== 'planning' || game.routeState.rotationsUsed > game.routeState.rotationLimit) return;
  clearTimers(); const result = simulateRoute(game.routeState); game.routeStatus = 'running'; game.routeStep = 0; game.routePath = result.path; game.routeRunResult = result; game.routeReason = null; audio.play('routeRun'); render();
  const advance = () => {
    if (game.routeStep >= result.path.length - 1) { finishRoute(result.success ? 'success' : 'fail', result.reason); return; }
    game.routeStep += 1; if (game.routeStep > 0) audio.play('routeMove'); render();
    game.routeRunTimer = window.setTimeout(advance, 150);
  };
  game.routeRunTimer = window.setTimeout(advance, 150);
}

function onRouteArrowClick(arrow) {
  if (game.routeStatus !== 'planning') return;
  if (arrow.pinned) { audio.play('pinnedHold'); haptic(18); return; }
  if (game.routeState.rotationsUsed >= game.routeState.rotationLimit) return;
  const next = rotateRouteArrow(game.routeState, arrow.id);
  if (next) { audio.play('routeRotate'); game.routeState = next; render(); }
}

function loadNextRushBoard() {
  window.clearTimeout(game.pendingPulseTimer); game.pendingPulseTimer = null;
  window.clearTimeout(game.rushBonusTimer); game.rushBonusTimer = null;
  window.clearTimeout(game.rushComboPulseTimer); game.rushComboPulseTimer = null;
  window.clearTimeout(game.rushEntranceTimer); game.rushEntranceTimer = null;
  game.rushBonusVisible = false; game.rushComboPulse = false;
  game.animating = false; game.exitingId = null; game.blockedId = null;
  const nextIndex = nextRushTemplateIndex(game.rushSession.templateIndex, game.rushSession.boards, game.rushHistory);
  game.rushHistory = [...game.rushHistory, nextIndex].slice(-3);
  game.rushSession = { ...game.rushSession, templateIndex: nextIndex };
  game.state = createFreshGameState(RUSH_TEMPLATES[nextIndex]); game.status = 'playing'; game.rotatedIds = []; game.heldIds = []; game.shift = null; game.rushBoardEntering = false; render();
}

function endRush() {
  const previousBest = game.rushBestScore;
  clearTimers(); game.rushSession = finishRush(game.rushSession); game.rushStatus = 'ended'; game.rushNewBest = game.rushSession.score > previousBest;
  game.rushBestScore = Math.max(game.rushBestScore, game.rushSession.score); game.rushBestBoards = Math.max(game.rushBestBoards, game.rushSession.boards); persist(); audio.play('rushEnd'); render();
}

function onRushArrowClick(arrow) {
  if (game.rushStatus !== 'playing' || game.animating) return;
  const blocker = blockerType(arrow);
  if (blocker) { game.rushSession = recordRushBlocked(game.rushSession); game.blockedId = arrow.id; audio.play(blocker); haptic(18); render(); game.pendingBlockedTimer = window.setTimeout(() => { game.blockedId = null; render(); }, 180); return; }
  audio.play('tilePress'); game.animating = true; game.exitingId = arrow.id; render();
  game.pendingExitTimer = window.setTimeout(() => {
    const result = applyMove(game.state, arrow.id); game.state = result.state; game.animating = false; game.exitingId = null; game.status = getGameStatus(game.state); game.rushSession = recordRushExit(game.rushSession); game.rushHelpVisible = false; window.clearTimeout(game.rushHelpTimer); game.rushHelpTimer = null; game.rushComboPulse = true; window.clearTimeout(game.rushComboPulseTimer); game.rushComboPulseTimer = window.setTimeout(() => { game.rushComboPulse = false; game.rushComboPulseTimer = null; render(); }, 140); audio.play('exit'); if (result.shift.rotatedIds.length || result.shift.heldIds.length) audio.play('shift'); render();
    if (game.status === 'won') { game.rushSession = recordRushBoardClear(game.rushSession); game.rushBonusVisible = true; window.clearTimeout(game.rushBonusTimer); game.rushBonusTimer = window.setTimeout(() => { game.rushBonusVisible = false; game.rushBonusTimer = null; render(); }, 650); audio.play('victory'); render(); game.pendingPulseTimer = window.setTimeout(loadNextRushBoard, 220); }
  }, 180);
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
  const motif = document.createElement('div'); motif.className = 'home-motif'; motif.setAttribute('aria-hidden', 'true');
  ['right', 'up', 'left', 'down'].forEach((direction) => { const icon = makeArrowIcon(direction); icon.classList.add('motif-arrow'); motif.append(icon); });
  return motif;
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
  if (game.mode === 'rush') return onRushArrowClick(arrow);
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
  if (arrow.pinned) button.classList.add('is-pinned'); if (game.exitingId === arrow.id) button.classList.add('is-exiting'); if (game.blockedId === arrow.id) button.classList.add('is-blocked'); if (game.rotatedIds.includes(arrow.id)) button.classList.add('is-rotating'); if (game.heldIds.includes(arrow.id)) button.classList.add('is-held'); button.append(makeArrowIcon(arrow.direction)); button.addEventListener('click', () => game.mode === 'route' ? onRouteArrowClick(arrow) : onArrowClick(arrow)); return button;
}

function createBarrierTile(barrier) { const tile = document.createElement('div'); tile.className = 'barrier-tile'; tile.dataset.barrierId = barrier.id; tile.style.gridRow = String(barrier.row + 1); tile.style.gridColumn = String(barrier.col + 1); tile.setAttribute('role', 'img'); tile.setAttribute('aria-label', getText(game.language).barrier); return tile; }

function createButton(label, className, handler, { action, testId, playClick = true } = {}) { const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label; if (action) button.dataset.action = action; if (testId) button.dataset.testid = testId; if (handler) button.addEventListener('click', () => { if (playClick) { audio.startMusic(); audio.play('uiClick'); } handler(); }); return button; }

function createIconButton(label, icon, className, handler, testId, playClick = true) { const button = createButton('', `${className} icon-button`, handler, { testId, playClick }); button.append(icon); button.setAttribute('aria-label', label); button.title = label; return button; }

function toggleLanguage() { audio.startMusic(); game.language = game.language === 'ru' ? 'en' : 'ru'; persist(); render(); }
function toggleMusic() { game.musicOn = !game.musicOn; audio.setMusicEnabled(game.musicOn); if (game.musicOn) audio.startMusic(); persist(); render(); }
function toggleSfx() { const next = !game.sfxOn; if (next) { game.sfxOn = true; audio.setSfxEnabled(true); audio.startMusic(); audio.play('uiClick'); } else { audio.play('uiClick'); game.sfxOn = false; audio.setSfxEnabled(false); } persist(); render(); }
function toggleAudioPopover() { audio.startMusic(); audio.play('uiClick'); game.audioPopoverOpen = !game.audioPopoverOpen; render(); }
function createAudioPopover() { const t = getText(game.language); const pop = document.createElement('div'); pop.className = 'audio-popover'; pop.dataset.testid = 'audio-popover'; const row = (label, enabled, handler, testId) => { const r = document.createElement('div'); r.className = 'audio-row'; const text = document.createElement('span'); text.textContent = label; const button = createButton(enabled ? t.on : t.off, `audio-toggle ${enabled ? 'is-on' : 'is-off'}`, handler, { testId }); r.append(text, button); return r; }; pop.append(row(t.music, game.musicOn, toggleMusic, 'music-toggle'), row(t.sounds, game.sfxOn, toggleSfx, 'sfx-toggle')); return pop; }
function appendAudioPopover(container) { if (game.audioPopoverOpen) container.append(createAudioPopover()); }

function renderBootScreen() {
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'boot-screen';
  const title = document.createElement('h1'); title.textContent = t.gameTitle;
  const motif = makeDirectionMotif(); motif.classList.add('boot-motif');
  const descriptor = document.createElement('p'); descriptor.textContent = t.bootDescriptor;
  const hint = document.createElement('span'); hint.textContent = t.bootHint;
  shell.append(title, motif, descriptor, hint); app.replaceChildren(shell);
}

function renderHomeScreen() {
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'menu-shell home-screen';
  const heading = document.createElement('div'); heading.className = 'hub-heading'; const wordmark = document.createElement('h1'); wordmark.className = 'home-wordmark'; wordmark.textContent = t.gameTitle; heading.append(wordmark, makeDirectionMotif());
  const hasProgress = game.highestUnlockedLevel > 1 || game.lastPlayedPuzzleLevel > 1;
  const progress = document.createElement('p'); progress.className = 'home-progress'; progress.textContent = hasProgress ? `${t.level} ${game.lastPlayedPuzzleLevel}` : '';
  const actions = document.createElement('div'); actions.className = 'menu-actions'; actions.append(createButton(hasProgress ? t.continue : t.play, 'primary-button menu-primary', () => startLevel(game.levelIndex), { testId: 'home-primary-button' }));
  const modes = document.createElement('div'); modes.className = 'mode-list';
  const puzzleEntry = createModeEntry(t.puzzles, `30 ${t.levelsCount}`, true, () => goLevels('puzzle'), 'puzzle-mode-button');
  const routeUnlocked = import.meta.env.DEV || game.highestUnlockedLevel >= 5; const routeEntry = createModeEntry(t.route, `12 ${t.levelsCount}`, routeUnlocked, () => goLevels('route'), 'route-mode-button', routeUnlocked ? '' : `${t.unlockAfter} 5`);
  const rushUnlocked = import.meta.env.DEV || game.highestUnlockedLevel >= 10; const rushMeta = game.rushBestScore > 0 ? `${t.best}: ${game.rushBestScore}` : `${RUSH_DURATION} ${t.seconds}`; const rushEntry = createModeEntry(t.rush, rushMeta, rushUnlocked, startRush, 'rush-mode-button', rushUnlocked ? '' : `${t.unlockAfter} 10`);
  modes.append(puzzleEntry, routeEntry, rushEntry);
  const controls = document.createElement('div'); controls.className = 'menu-controls'; controls.append(createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.sfxOn || game.musicOn ? t.soundOn : t.soundOff, makeSoundIcon(game.sfxOn || game.musicOn), `sound-button ${game.sfxOn || game.musicOn ? 'is-on' : 'is-off'}`, toggleAudioPopover, 'sound-toggle', false)); appendAudioPopover(controls);
  shell.append(heading, progress, actions, modes, controls); app.replaceChildren(shell);
}

function createModeEntry(label, meta, unlocked, handler, testId, lockText = '') {
  const entry = document.createElement('button'); entry.type = 'button'; entry.className = `mode-entry${unlocked ? '' : ' is-locked'}`; entry.dataset.testid = testId; entry.disabled = !unlocked; entry.setAttribute('aria-label', unlocked ? label : `${label}, ${lockText}`); entry.addEventListener('click', () => { audio.play('uiClick'); if (unlocked) handler(); });
  const title = document.createElement('strong'); title.textContent = label; const detail = document.createElement('span'); detail.textContent = unlocked ? meta : lockText; entry.append(title, detail); return entry;
}

function renderLevelsScreen() {
  if (game.mode === 'route') return renderRouteLevelsScreen();
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'menu-shell levels-screen';
  const header = document.createElement('div'); header.className = 'menu-header'; header.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'levels-home-button'));
  const title = document.createElement('h1'); title.textContent = t.levels; header.append(title);
  const controls = document.createElement('div'); controls.className = 'menu-header-controls'; controls.append(createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.sfxOn || game.musicOn ? t.soundOn : t.soundOff, makeSoundIcon(game.sfxOn || game.musicOn), `sound-button ${game.sfxOn || game.musicOn ? 'is-on' : 'is-off'}`, toggleAudioPopover, 'sound-toggle', false)); appendAudioPopover(controls); header.append(controls);
  const grid = document.createElement('div'); grid.className = 'level-grid';
  for (let index = 0; index < LEVELS.length; index += 1) {
    const levelNumber = index + 1; const unlocked = isLevelUnlocked(levelNumber, game.highestUnlockedLevel, import.meta.env.DEV); const button = createButton(String(levelNumber).padStart(2, '0'), 'level-token', () => startLevel(index), { testId: `level-button-${levelNumber}` }); button.dataset.level = String(levelNumber); button.setAttribute('aria-label', unlocked ? `${t.level} ${levelNumber}` : `${t.level} ${levelNumber}, ${t.locked}`); if (!unlocked) { button.disabled = true; button.classList.add('is-locked'); } else if (levelNumber < game.highestUnlockedLevel) button.classList.add('is-completed'); else if (levelNumber === game.levelIndex + 1) button.classList.add('is-current'); grid.append(button);
  }
  shell.append(header, grid); app.replaceChildren(shell);
}

function renderRouteLevelsScreen() {
  const t = getText(game.language); const shell = document.createElement('section'); shell.className = 'menu-shell levels-screen';
  const header = document.createElement('div'); header.className = 'menu-header'; header.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'levels-home-button')); const title = document.createElement('h1'); title.textContent = t.route; header.append(title); const controls = document.createElement('div'); controls.className = 'menu-header-controls'; controls.append(createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.sfxOn || game.musicOn ? t.soundOn : t.soundOff, makeSoundIcon(game.sfxOn || game.musicOn), 'sound-button', toggleAudioPopover, 'sound-toggle', false)); appendAudioPopover(controls); header.append(controls);
  const grid = document.createElement('div'); grid.className = 'level-grid route-level-grid'; for (let index = 0; index < ROUTE_LEVELS.length; index += 1) { const n = index + 1; const unlocked = isLevelUnlocked(n, game.highestUnlockedRoute, import.meta.env.DEV); const button = createButton(String(n).padStart(2, '0'), 'level-token', () => startRoute(index), { testId: `route-level-button-${n}` }); button.disabled = !unlocked; button.setAttribute('aria-label', unlocked ? `${t.level} ${n}` : `${t.level} ${n}, ${t.locked}`); if (!unlocked) button.classList.add('is-locked'); else if (n < game.highestUnlockedRoute) button.classList.add('is-completed'); grid.append(button); }
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

function renderPuzzleGameScreen() {
  const t = getText(game.language); const layout = getLayoutMetrics(currentLevel(), { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }); const shell = document.createElement('section'); shell.className = 'game-shell'; shell.style.setProperty('--board-size', `${layout.boardSize}px`); shell.style.setProperty('--tile-size', `${layout.tileSize}px`);
  const header = document.createElement('header'); header.className = 'topbar'; const brand = document.createElement('div'); brand.className = 'desktop-brand'; brand.textContent = t.gameTitle; const titleGroup = document.createElement('div'); titleGroup.className = 'title-group'; const level = document.createElement('p'); level.className = 'level-label'; level.dataset.testid = 'level-number'; level.textContent = `${t.level} ${game.levelIndex + 1}`; const progress = document.createElement('span'); progress.className = 'progress-label'; progress.textContent = `${game.levelIndex + 1} / ${LEVELS.length}`; titleGroup.append(level, progress); const controls = document.createElement('div'); controls.className = 'topbar-controls'; controls.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'game-home-button'), createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(t.restart, makeRestartIcon(), 'restart-button', resetLevel, 'restart-button')); header.append(brand, titleGroup, controls);
  const board = document.createElement('div'); board.className = `board ${game.rotatedIds.length > 0 ? 'is-shifting' : ''} ${game.status !== 'playing' ? 'has-result' : ''}`; board.style.setProperty('--columns', currentLevel().cols); board.style.setProperty('--rows', currentLevel().rows); board.style.setProperty('--cell-size', `${layout.cellSize}px`); board.style.setProperty('--grid-pixel-size', `${layout.gridPixelSize}px`); board.style.setProperty('--board-padding', `${layout.boardPadding}px`); if (game.shift) { board.classList.add('has-shift-line'); board.dataset.shiftAxis = game.shift.axis; board.style.setProperty('--shift-line-position', `${((game.shift.index + 0.5) / (game.shift.axis === 'row' ? currentLevel().rows : currentLevel().cols)) * 100}%`); } board.dataset.testid = 'game-board'; const gridLines = document.createElement('div'); gridLines.className = 'grid-lines'; gridLines.setAttribute('aria-hidden', 'true'); for (let index = 1; index < layout.gridSize; index += 1) { const vertical = document.createElement('span'); vertical.className = 'grid-line grid-line-vertical'; vertical.style.left = `${index * layout.cellSize}px`; gridLines.append(vertical); const horizontal = document.createElement('span'); horizontal.className = 'grid-line grid-line-horizontal'; horizontal.style.top = `${index * layout.cellSize}px`; gridLines.append(horizontal); } board.append(gridLines); board.setAttribute('aria-label', `${t.gameTitle}, ${t.level} ${game.levelIndex + 1}`); game.state.barriers.forEach((barrier) => board.append(createBarrierTile(barrier))); game.state.arrows.forEach((arrow) => board.append(createArrowButton(arrow)));
  if (game.status !== 'playing') { board.dataset.resultStatus = game.status; board.append(createResultCard()); }
  const hint = document.createElement('p'); hint.className = 'hint'; if (game.status === 'playing' && game.levelIndex === 0) hint.textContent = t.firstHint; if (game.status === 'playing' && game.levelIndex === 2) hint.textContent = t.shiftHint; if (game.status === 'playing' && (game.levelIndex === 9 || game.levelIndex === 10)) hint.textContent = t.pinnedHint; if (game.status === 'playing' && game.levelIndex === 19) hint.textContent = t.barrierHint; shell.append(header, board, hint); app.replaceChildren(shell);
}

function createRouteMarker(kind, position, direction = null) {
  const t = getText(game.language); const marker = document.createElement('span'); marker.className = `route-marker ${kind}`; marker.style.gridRow = String(position.row + 1); marker.style.gridColumn = String(position.col + 1); marker.setAttribute('role', 'img'); marker.setAttribute('aria-label', kind === 'is-start' ? t.start : kind === 'is-target' ? t.target : t.route);
  if (kind === 'is-start') { const arrow = makeArrowIcon(direction); arrow.classList.add('route-marker-arrow'); marker.append(arrow); }
  else if (kind === 'is-target') { const ring = document.createElement('span'); ring.className = 'target-ring'; marker.append(ring); }
  if ((kind === 'is-start' || kind === 'is-target') && game.routeIndex < 2) { marker.classList.add('show-label'); const label = document.createElement('span'); label.className = 'route-marker-label'; label.textContent = kind === 'is-start' ? t.start : t.target; marker.append(label); }
  return marker;
}

function createRouteResultCard() {
  const t = getText(game.language); const card = document.createElement('div'); card.className = 'result-card route-result-card'; card.dataset.testid = 'route-result-card';
  const title = document.createElement('strong'); title.textContent = game.routeStatus === 'success' ? t.routeComplete : t.routeFailed; card.append(title);
  const rotations = document.createElement('span'); rotations.className = 'result-detail'; rotations.textContent = `${t.rotations}: ${game.routeState.rotationsUsed}`; card.append(rotations);
  if (game.routeStatus === 'success') { const best = document.createElement('span'); best.className = 'result-detail'; best.textContent = `${t.best}: ${game.routeBestRotations[game.routeIndex + 1]}`; card.append(best); }
  if (game.routeStatus === 'success') { card.append(createButton(t.next, 'primary-button', () => startRoute(Math.min(game.routeIndex + 1, ROUTE_LEVELS.length - 1)), { testId: 'route-next-button' })); card.append(createButton(t.levels, 'secondary-button result-secondary', () => goLevels('route'))); }
  else { card.append(createButton(t.reset, 'primary-button', resetRoute, { testId: 'route-reset-button' })); card.append(createButton(t.levels, 'secondary-button result-secondary', () => goLevels('route'))); }
  return card;
}

function gridLinesFor(board, layout) {
  const lines = document.createElement('div'); lines.className = 'grid-lines'; lines.setAttribute('aria-hidden', 'true');
  for (let index = 1; index < layout.gridSize; index += 1) { const vertical = document.createElement('span'); vertical.className = 'grid-line grid-line-vertical'; vertical.style.left = `${index * layout.cellSize}px`; lines.append(vertical); const horizontal = document.createElement('span'); horizontal.className = 'grid-line grid-line-horizontal'; horizontal.style.top = `${index * layout.cellSize}px`; lines.append(horizontal); }
  board.append(lines);
}

function createRouteTrace(path, layout) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('route-trace'); svg.setAttribute('viewBox', `0 0 ${layout.boardSize} ${layout.boardSize}`); svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); const offset = layout.boardPadding + 1; line.setAttribute('points', path.map((position) => `${offset + (position.col + 0.5) * layout.cellSize},${offset + (position.row + 0.5) * layout.cellSize}`).join(' ')); line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'currentColor'); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round'); line.setAttribute('stroke-width', '2'); svg.append(line); return svg;
}

function routeHeader(titleText, progressText) {
  const t = getText(game.language); const header = document.createElement('header'); header.className = 'topbar'; const brand = document.createElement('div'); brand.className = 'desktop-brand'; brand.textContent = t.gameTitle; const group = document.createElement('div'); group.className = 'title-group'; const title = document.createElement('p'); title.className = 'level-label'; title.dataset.testid = 'level-number'; title.textContent = titleText; const progress = document.createElement('span'); progress.className = 'progress-label'; progress.textContent = progressText; group.append(title, progress); const controls = document.createElement('div'); controls.className = 'topbar-controls'; controls.append(createIconButton(t.home, makeHomeIcon(), 'home-button', goHome, 'game-home-button'), createButton(t.language, 'text-button language-button', toggleLanguage), createIconButton(game.sfxOn || game.musicOn ? t.soundOn : t.soundOff, makeSoundIcon(game.sfxOn || game.musicOn), 'sound-button', toggleAudioPopover, 'sound-toggle', false)); appendAudioPopover(controls); header.append(brand, group, controls); return header;
}

function renderRouteGameScreen() {
  const t = getText(game.language); const level = ROUTE_LEVELS[game.routeIndex]; const layout = getLayoutMetrics(level, { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }); const shell = document.createElement('section'); shell.className = 'game-shell route-shell'; shell.style.setProperty('--board-size', `${layout.boardSize}px`); shell.style.setProperty('--tile-size', `${layout.tileSize}px`); shell.append(routeHeader(`${t.route} ${game.routeIndex + 1}`, `${game.routeIndex + 1} / ${ROUTE_LEVELS.length}`));
  const board = document.createElement('div'); board.className = `board route-board ${game.routeStatus === 'success' ? 'has-result' : ''}`; board.dataset.resultStatus = game.routeStatus === 'success' ? 'won' : ''; board.style.setProperty('--columns', level.cols); board.style.setProperty('--rows', level.rows); board.style.setProperty('--cell-size', `${layout.cellSize}px`); board.style.setProperty('--grid-pixel-size', `${layout.gridPixelSize}px`); board.style.setProperty('--board-padding', `${layout.boardPadding}px`); board.dataset.testid = 'game-board'; gridLinesFor(board, layout);
  const tracePath = game.routeStatus === 'running' ? game.routePath.slice(0, game.routeStep + 1) : game.routePath; if (tracePath.length > 1) board.append(createRouteTrace(tracePath, layout)); level.barriers.forEach((barrier) => board.append(createBarrierTile(barrier))); board.append(createRouteMarker('is-start', game.routeState.start, game.routeState.start.direction)); board.append(createRouteMarker('is-target', game.routeState.target)); game.routeState.arrows.forEach((arrow) => board.append(createArrowButton(arrow))); if (game.routeStatus === 'running' && game.routePath[game.routeStep]) board.append(createRouteMarker('route-signal', game.routePath[game.routeStep], game.routeRunResult?.visitedStates[Math.min(game.routeStep, game.routeRunResult.visitedStates.length - 1)]?.direction)); if (game.routeStatus === 'success') board.append(createRouteResultCard());
  const hud = document.createElement('div'); hud.className = 'route-hud'; const rotation = document.createElement('span'); rotation.textContent = `${t.rotations}: ${game.routeState.rotationsUsed} / ${game.routeState.rotationLimit}`; const run = createButton(t.run, 'primary-button route-run-button', runRoute, { testId: 'route-run-button' }); run.disabled = game.routeStatus !== 'planning'; const reset = createButton(t.reset, 'secondary-button route-reset-button', resetRoute, { testId: 'route-reset-button-bottom' }); reset.disabled = game.routeStatus === 'running'; hud.append(rotation, run, reset); const feedback = document.createElement('p'); feedback.className = 'route-feedback'; if (game.routeStatus === 'fail') feedback.textContent = game.routeReason === 'loop' ? t.routeLooped : t.pathBroken; shell.append(board, hud, feedback); app.replaceChildren(shell);
}

function createRushResultCard() {
  const t = getText(game.language); const card = document.createElement('div'); card.className = 'result-card rush-result-card'; card.dataset.testid = 'rush-result-card'; const title = document.createElement('strong'); title.textContent = t.rush; const stat = (label, value) => { const row = document.createElement('span'); row.className = 'rush-result-stat'; row.innerHTML = `<small>${label}</small><b>${value}</b>`; return row; }; card.append(title, stat(t.score, game.rushSession.score), stat(t.best, game.rushBestScore), stat(t.fields, game.rushSession.boards)); if (game.rushNewBest) { const bestLine = document.createElement('span'); bestLine.className = 'rush-new-best'; bestLine.textContent = t.rushNewBest; card.append(bestLine); } card.append(createButton(t.again, 'primary-button', startRush, { testId: 'rush-again-button' }), createButton(t.home, 'secondary-button result-secondary', goHome)); return card;
}

function renderRushGameScreen() {
  const t = getText(game.language); const level = RUSH_TEMPLATES[game.rushSession.templateIndex]; const layout = getLayoutMetrics(level, { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }); const shell = document.createElement('section'); shell.className = 'game-shell rush-shell'; shell.style.setProperty('--board-size', `${layout.boardSize}px`); shell.style.setProperty('--tile-size', `${layout.tileSize}px`); const header = routeHeader(t.rush, ''); const titleGroup = header.querySelector('.title-group'); const progress = header.querySelector('.progress-label'); progress.classList.add('rush-progress-placeholder'); const hud = document.createElement('div'); hud.className = 'rush-hud'; const makeStat = (label, value, className) => { const stat = document.createElement('div'); stat.className = `rush-stat ${className}`; const statLabel = document.createElement('span'); statLabel.textContent = label; const statValue = document.createElement('strong'); statValue.textContent = value; stat.append(statLabel, statValue); return stat; }; const timerStat = makeStat(t.time, String(game.rushSession.timeLeft), 'rush-timer'); const isLowTime = game.rushSession.timeLeft <= 10; if (isLowTime) timerStat.classList.add('rush-time-low'); if (game.rushBonusVisible) { const bonus = document.createElement('em'); bonus.className = 'rush-bonus'; bonus.textContent = t.rushBonus; timerStat.append(bonus); } const scoreStat = makeStat(t.score, String(game.rushSession.score), 'rush-score'); const comboStat = makeStat(t.combo, `×${Math.max(game.rushSession.combo, 1)}`, `rush-combo${game.rushComboPulse ? ' is-pulsing' : ''}`); hud.append(timerStat, scoreStat, comboStat); const timeBar = document.createElement('div'); timeBar.className = `rush-time-bar${isLowTime ? ' is-low' : ''}`; timeBar.dataset.testid = 'rush-time-bar'; timeBar.style.setProperty('--rush-time-progress', `${Math.min(game.rushSession.timeLeft / RUSH_DURATION, 1) * 100}%`); titleGroup.append(hud, timeBar); shell.append(header);
  const board = document.createElement('div'); board.className = `board rush-board${game.rushBoardEntering ? ' is-entering' : ''}${game.status === 'won' ? ' is-clearing' : ''}${game.rushStatus === 'ended' ? ' has-result' : ''}`; board.dataset.resultStatus = game.rushStatus === 'ended' ? 'won' : ''; board.style.setProperty('--columns', level.cols); board.style.setProperty('--rows', level.rows); board.style.setProperty('--cell-size', `${layout.cellSize}px`); board.style.setProperty('--grid-pixel-size', `${layout.gridPixelSize}px`); board.style.setProperty('--board-padding', `${layout.boardPadding}px`); board.dataset.testid = 'game-board'; gridLinesFor(board, layout); level.barriers.forEach((barrier) => board.append(createBarrierTile(barrier))); game.state.arrows.forEach((arrow) => board.append(createArrowButton(arrow))); if (game.rushStatus === 'ended') board.append(createRushResultCard()); shell.append(board); if (game.rushHelpVisible && game.rushStatus === 'playing') { const hint = document.createElement('p'); hint.className = 'hint rush-hint'; hint.textContent = t.rushHint; shell.append(hint); } app.replaceChildren(shell);
}

function renderGameScreen() { if (game.mode === 'route') return renderRouteGameScreen(); if (game.mode === 'rush') return renderRushGameScreen(); return renderPuzzleGameScreen(); }

function render() { document.body.dataset.mode = game.mode; if (game.screen === 'boot') renderBootScreen(); else if (game.screen === 'home') renderHomeScreen(); else if (game.screen === 'levels') renderLevelsScreen(); else renderGameScreen(); }

window.addEventListener('resize', () => { if (!game.animating && game.screen === 'game') render(); });
document.addEventListener('pointerdown', (event) => { if (game.audioPopoverOpen && !event.target.closest('.audio-popover, .sound-button')) { game.audioPopoverOpen = false; render(); } });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && game.audioPopoverOpen) { game.audioPopoverOpen = false; render(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pauseAll('visibility'); else audio.resumeAll('visibility'); });
window.addEventListener('blur', () => audio.pauseAll('blur'));
window.addEventListener('focus', () => audio.resumeAll('focus'));
window.addEventListener('pagehide', () => audio.pauseAll('pagehide'));
const onAppReady = () => { if (game.screen === 'boot' && !bootPreview) { game.screen = 'home'; render(); } };
render();
if (!bootPreview) queueMicrotask(onAppReady);
