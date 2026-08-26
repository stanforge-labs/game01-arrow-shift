const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

let state = {
  initialized: false,
  kind: 'local',
  ysdk: null,
  readySent: false,
  gameplayActive: false,
  callbacks: {},
  pauseHandler: null,
  resumeHandler: null,
};

function isLocalHost() {
  return typeof window === 'undefined' || LOCAL_HOSTS.has(window.location.hostname);
}

function installDevMock() {
  if (typeof window === 'undefined' || window.YaGames) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('platform') !== 'mock') return;
  const listeners = new Map();
  const gameplay = { start() { window.__arrowShiftMockGameplay = [...(window.__arrowShiftMockGameplay || []), 'start']; document.documentElement.dataset.arrowShiftMockGameplay = window.__arrowShiftMockGameplay.join(','); }, stop() { window.__arrowShiftMockGameplay = [...(window.__arrowShiftMockGameplay || []), 'stop']; document.documentElement.dataset.arrowShiftMockGameplay = window.__arrowShiftMockGameplay.join(','); } };
  const sdk = {
    environment: { i18n: { lang: params.get('lang') === 'ru' ? 'ru' : 'en' } },
    features: { LoadingAPI: { ready() { window.__arrowShiftMockReady = (window.__arrowShiftMockReady || 0) + 1; document.documentElement.dataset.arrowShiftMockReady = String(window.__arrowShiftMockReady); } }, GameplayAPI: gameplay },
    on(name, callback) { listeners.set(name, callback); },
    off(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
    __emit(name) { listeners.get(name)?.(); },
  };
  // A DOM event keeps the mock controllable from Playwright's isolated page world
  // without exposing a development panel in the shipped UI.
  document.addEventListener('arrow-shift-mock-event', (event) => sdk.__emit(event.detail), { passive: true });
  document.documentElement.dataset.arrowShiftMock = 'ready';
  window.YaGames = { init: async () => sdk };
}

function loadSdkScript() {
  if (typeof document === 'undefined' || window.YaGames) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script'); script.src = '/sdk.js'; script.async = true;
    const fallback = window.setTimeout(resolve, 1800);
    script.addEventListener('load', () => { window.clearTimeout(fallback); resolve(); }, { once: true });
    script.addEventListener('error', () => { window.clearTimeout(fallback); resolve(); }, { once: true });
    document.head.append(script);
  });
}

function bindEvents() {
  if (!state.ysdk?.on) return;
  state.pauseHandler = () => state.callbacks.onPause?.();
  state.resumeHandler = () => state.callbacks.onResume?.();
  state.ysdk.on('game_api_pause', state.pauseHandler);
  state.ysdk.on('game_api_resume', state.resumeHandler);
}

export async function initPlatform(callbacks = {}) {
  if (state.initialized) return state;
  state.callbacks = callbacks;
  installDevMock();
  if (!window.YaGames && !isLocalHost()) await loadSdkScript();
  try {
    if (window.YaGames?.init) { state.ysdk = await window.YaGames.init(); state.kind = 'yandex'; bindEvents(); }
  } catch {
    state.ysdk = null; state.kind = 'local';
  }
  state.initialized = true;
  return state;
}

export function getPlatform() { return state; }
export function isYandexAvailable() { return state.kind === 'yandex'; }
export function getPlatformLanguage() { return state.ysdk?.environment?.i18n?.lang || null; }
// Reserved for the cloud-save stage; no player data is read or written yet.
export function getPlayer() { return state.ysdk?.getPlayer?.() ?? null; }

export function gameReady() {
  if (state.readySent) return false;
  state.readySent = true;
  state.ysdk?.features?.LoadingAPI?.ready?.();
  return true;
}

export function gameplayStart() {
  if (state.gameplayActive) return false;
  state.gameplayActive = true;
  state.ysdk?.features?.GameplayAPI?.start?.();
  return true;
}

export function gameplayStop() {
  if (!state.gameplayActive) return false;
  state.gameplayActive = false;
  state.ysdk?.features?.GameplayAPI?.stop?.();
  return true;
}

export function pausePlatform(reason = 'platform') {
  state.callbacks.onPause?.(reason);
}

export function resumePlatform(reason = 'platform') {
  state.callbacks.onResume?.(reason);
}

export function disposePlatform() {
  if (state.ysdk?.off) {
    if (state.pauseHandler) state.ysdk.off('game_api_pause', state.pauseHandler);
    if (state.resumeHandler) state.ysdk.off('game_api_resume', state.resumeHandler);
  }
  state.pauseHandler = null; state.resumeHandler = null;
}
