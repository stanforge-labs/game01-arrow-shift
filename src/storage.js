const STORAGE_KEY = 'arrow-shift-save';
const SAVE_VERSION = 3;

export const DEFAULT_SAVE = Object.freeze({
  saveVersion: SAVE_VERSION,
  language: 'ru',
  soundOn: true,
  highestUnlockedLevel: 1,
  lastPlayedLevel: 1,
  highestUnlockedRoute: 1,
  routeBestRotations: {},
  rushBestScore: 0,
  rushBestBoards: 0,
});

function clampLevel(value, levelCount = Number.MAX_SAFE_INTEGER) {
  const number = Number.isInteger(value) ? value : 1;
  return Math.min(Math.max(number, 1), Math.max(levelCount, 1));
}

export function normalizeSave(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SAVE };
  const legacyLevel = clampLevel(value.level);
  const highest = clampLevel(value.highestUnlockedLevel ?? legacyLevel);
  const last = clampLevel(value.lastPlayedLevel ?? legacyLevel);
  return {
    saveVersion: SAVE_VERSION,
    language: value.language === 'en' ? 'en' : 'ru',
    soundOn: value.soundOn !== false,
    highestUnlockedLevel: highest,
    lastPlayedLevel: last,
    highestUnlockedRoute: clampLevel(value.highestUnlockedRoute ?? 1, 12),
    routeBestRotations: value.routeBestRotations && typeof value.routeBestRotations === 'object' ? { ...value.routeBestRotations } : {},
    rushBestScore: Number.isFinite(value.rushBestScore) && value.rushBestScore >= 0 ? Math.floor(value.rushBestScore) : 0,
    rushBestBoards: Number.isFinite(value.rushBestBoards) && value.rushBestBoards >= 0 ? Math.floor(value.rushBestBoards) : 0,
  };
}

export function getInitialLevelIndex(savedLevel, isDev, levelCount) {
  if (isDev) return 0;
  return Math.min(Math.max(Number(savedLevel || 1) - 1, 0), levelCount - 1);
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return normalizeSave(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveSave(save) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSave(save)));
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

export function saveProgress(level, language, previousSave = DEFAULT_SAVE) {
  const nextLevel = clampLevel(level);
  const prior = normalizeSave(previousSave);
  saveSave({
    ...prior,
    language: language === 'en' ? 'en' : 'ru',
    lastPlayedLevel: nextLevel,
    highestUnlockedLevel: Math.max(prior.highestUnlockedLevel, nextLevel),
  });
}

export function isLevelUnlocked(level, highestUnlockedLevel, isDev = false) {
  return isDev || level <= highestUnlockedLevel;
}

export { SAVE_VERSION, STORAGE_KEY };
