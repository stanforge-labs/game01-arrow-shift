const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const CLOUD_KEY = 'arrowShiftSave';
const PLAYER_TIMEOUT = 2200;
const SDK_INIT_TIMEOUT = 2500;
const AD_TIMEOUT = 15000;

let state = {
  initialized: false,
  kind: 'local',
  ysdk: null,
  player: null,
  playerPromise: null,
  cloudAvailable: false,
  readySent: false,
  gameplayActive: false,
  callbacks: {},
  pauseHandler: null,
  resumeHandler: null,
  adPromise: null,
};

function isLocalHost() {
  return typeof window === 'undefined' || LOCAL_HOSTS.has(window.location.hostname);
}

function withTimeout(promise, timeoutMs, fallback = null) {
  let timer = null;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => { timer = window.setTimeout(() => resolve(fallback), timeoutMs); }),
  ]).finally(() => { if (timer) window.clearTimeout(timer); });
}

function installDevMock() {
  if (typeof window === 'undefined' || window.YaGames) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('platform') !== 'mock') return;
  const listeners = new Map();
  let cloud = null;
  try { cloud = params.get('cloud') ? JSON.parse(params.get('cloud')) : null; } catch { cloud = null; }
  const mockAdMode = params.get('mockAd') || 'close';
  const mark = (name, value) => { document.documentElement.dataset[`arrowShiftMock${name}`] = String(value); };
  const gameplay = {
    start() { const count = Number(document.documentElement.dataset.arrowShiftMockGameplayStarts || 0) + 1; mark('GameplayStarts', count); mark('Gameplay', 'start'); },
    stop() { const count = Number(document.documentElement.dataset.arrowShiftMockGameplayStops || 0) + 1; mark('GameplayStops', count); mark('Gameplay', 'stop'); },
  };
  const player = {
    isAuthorized() { return params.get('authorized') === 'true'; },
    getData() { mark('CloudGetCalls', Number(document.documentElement.dataset.arrowShiftMockCloudGetCalls || 0) + 1); return Promise.resolve(cloud ? { [CLOUD_KEY]: cloud } : {}); },
    setData(payload) { cloud = payload?.[CLOUD_KEY] ?? cloud; mark('CloudSetCalls', Number(document.documentElement.dataset.arrowShiftMockCloudSetCalls || 0) + 1); document.documentElement.dataset.arrowShiftMockCloud = JSON.stringify(cloud); return Promise.resolve(); },
  };
  const sdk = {
    environment: { i18n: { lang: params.get('lang') === 'ru' ? 'ru' : 'en' } },
    features: {
      LoadingAPI: { ready() { mark('Ready', Number(document.documentElement.dataset.arrowShiftMockReady || 0) + 1); } },
      GameplayAPI: gameplay,
    },
    getPlayer() { mark('GetPlayerCalls', Number(document.documentElement.dataset.arrowShiftMockGetPlayerCalls || 0) + 1); return Promise.resolve(player); },
    adv: {
      showFullscreenAdv({ callbacks = {} } = {}) {
        mark('AdRequests', Number(document.documentElement.dataset.arrowShiftMockAdRequests || 0) + 1);
        callbacks.onOpen?.();
        if (mockAdMode === 'error') { window.setTimeout(() => callbacks.onError?.(new Error('mock ad error')), 20); return; }
        if (mockAdMode === 'noshow') { window.setTimeout(() => callbacks.onClose?.(false), 20); return; }
        window.setTimeout(() => callbacks.onClose?.(true), 20);
      },
    },
    on(name, callback) { listeners.set(name, callback); },
    off(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
    __emit(name) { listeners.get(name)?.(); },
  };
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

async function initializePlayer() {
  if (!state.ysdk?.getPlayer) return null;
  if (!state.playerPromise) {
    state.playerPromise = withTimeout(state.ysdk.getPlayer(), PLAYER_TIMEOUT, null).then((player) => {
      state.player = player;
      state.cloudAvailable = Boolean(player?.getData && player?.setData);
      return player;
    });
  }
  return state.playerPromise;
}

export async function initPlatform(callbacks = {}) {
  if (state.initialized) return state;
  state.callbacks = callbacks;
  installDevMock();
  if (!window.YaGames && !isLocalHost()) await loadSdkScript();
  try {
    if (window.YaGames?.init) {
      state.ysdk = await withTimeout(window.YaGames.init(), SDK_INIT_TIMEOUT, null);
      if (!state.ysdk) throw new Error('Yandex SDK unavailable');
      state.kind = 'yandex';
      bindEvents();
      await initializePlayer();
    }
  } catch {
    state.ysdk = null; state.player = null; state.kind = 'local'; state.cloudAvailable = false;
  }
  state.initialized = true;
  return state;
}

export function getPlatform() { return state; }
export function isYandexAvailable() { return state.kind === 'yandex'; }
export function getPlatformLanguage() { return state.ysdk?.environment?.i18n?.lang || null; }
export function getPlayer() { return state.playerPromise || Promise.resolve(state.player); }
export function isPlayerAvailable() { return Boolean(state.player); }
export function isPlayerAuthorized() {
  try { return Boolean(state.player?.isAuthorized?.()); } catch { return false; }
}

export async function getCloudData() {
  if (!state.cloudAvailable) return null;
  const data = await withTimeout(state.player.getData([CLOUD_KEY]), PLAYER_TIMEOUT, null);
  return data?.[CLOUD_KEY] ?? null;
}

export async function setCloudData(cloudObject, flush = false) {
  if (!state.cloudAvailable) return { supported: false, saved: false };
  const result = await withTimeout(state.player.setData({ [CLOUD_KEY]: cloudObject }, flush), PLAYER_TIMEOUT, null);
  return { supported: true, saved: result !== null };
}

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

export function pausePlatform(reason = 'platform') { state.callbacks.onPause?.(reason); }
export function resumePlatform(reason = 'platform') { state.callbacks.onResume?.(reason); }

export function showFullscreenAd({ onOpen, onClose, onError, timeoutMs = AD_TIMEOUT } = {}) {
  if (!state.ysdk?.adv?.showFullscreenAdv) return Promise.resolve({ supported: false, shown: false, reason: 'unavailable' });
  if (state.adPromise) return Promise.resolve({ supported: true, shown: false, reason: 'busy' });
  state.adPromise = new Promise((resolve) => {
    let settled = false;
    let shown = false;
    const timer = window.setTimeout(() => { onError?.(new Error('fullscreen ad timeout')); finish({ supported: true, shown, reason: 'timeout' }); }, timeoutMs);
    const finish = (result) => {
      if (settled) return;
      settled = true; window.clearTimeout(timer); state.adPromise = null; resolve(result);
    };
    try {
      state.ysdk.adv.showFullscreenAdv({ callbacks: {
        onOpen: () => { shown = true; onOpen?.(); },
        onClose: (wasShown = shown) => { onClose?.(Boolean(wasShown)); finish({ supported: true, shown: Boolean(wasShown), reason: 'close' }); },
        onError: (error) => { onError?.(error); finish({ supported: true, shown, reason: 'error' }); },
      } });
    } catch (error) { onError?.(error); finish({ supported: true, shown, reason: 'error' }); }
  });
  return state.adPromise;
}

export function disposePlatform() {
  if (state.ysdk?.off) {
    if (state.pauseHandler) state.ysdk.off('game_api_pause', state.pauseHandler);
    if (state.resumeHandler) state.ysdk.off('game_api_resume', state.resumeHandler);
  }
  state.pauseHandler = null; state.resumeHandler = null;
}
