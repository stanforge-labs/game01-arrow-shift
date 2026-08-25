const STORAGE_KEY = 'arrow-shift-save';
const SAVE_VERSION = 1;

export function getInitialLevelIndex(savedLevel, isDev, levelCount) {
  if (isDev) return 0;
  return Math.min(Math.max(savedLevel - 1, 0), levelCount - 1);
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { saveVersion: SAVE_VERSION, level: 1, language: 'ru' };
    const parsed = JSON.parse(raw);
    if (parsed?.saveVersion !== SAVE_VERSION) throw new Error('Unsupported save format');
    return {
      saveVersion: SAVE_VERSION,
      level: Number.isInteger(parsed.level) && parsed.level > 0 ? parsed.level : 1,
      language: parsed.language === 'en' ? 'en' : 'ru',
    };
  } catch {
    return { saveVersion: SAVE_VERSION, level: 1, language: 'ru' };
  }
}

export function saveProgress(level, language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ saveVersion: SAVE_VERSION, level, language }));
  } catch {
    // The game remains playable when storage is unavailable.
  }
}
