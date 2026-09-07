export const CLOUD_SAVE_KEY = 'arrowShiftSave';
export const CLOUD_SAVE_VERSION = 1;

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function uniqueLevels(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(positiveInteger).filter(Boolean))].sort((a, b) => a - b);
}

function completedThrough(highestUnlocked) {
  const highest = positiveInteger(highestUnlocked) || 1;
  return Array.from({ length: Math.max(0, highest - 1) }, (_, index) => index + 1);
}

function normalizeBestMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce((result, [key, raw]) => {
    const best = positiveInteger(raw);
    if (best) result[key] = best;
    return result;
  }, {});
}

export function normalizeCloudSave(value) {
  if (!value || typeof value !== 'object' || value.version !== CLOUD_SAVE_VERSION) return null;
  const puzzle = value.puzzle && typeof value.puzzle === 'object' ? value.puzzle : {};
  const route = value.route && typeof value.route === 'object' ? value.route : {};
  const rush = value.rush && typeof value.rush === 'object' ? value.rush : {};
  const puzzleCompleted = uniqueLevels(puzzle.completedLevels);
  const routeCompleted = uniqueLevels(route.completedRoutes);
  const puzzleHighest = Math.max(positiveInteger(puzzle.highestUnlockedLevel) || 1, puzzleCompleted.length ? Math.max(...puzzleCompleted) + 1 : 1);
  const routeHighest = Math.max(positiveInteger(route.highestUnlockedRoute) || 1, routeCompleted.length ? Math.max(...routeCompleted) + 1 : 1);
  return {
    version: CLOUD_SAVE_VERSION,
    puzzle: { highestUnlockedLevel: puzzleHighest, completedLevels: puzzleCompleted },
    route: { highestUnlockedRoute: routeHighest, completedRoutes: routeCompleted, bestRotations: normalizeBestMap(route.bestRotations) },
    rush: { bestScore: Math.max(0, Number.isFinite(rush.bestScore) ? Math.floor(rush.bestScore) : 0), bestBoards: Math.max(0, Number.isFinite(rush.bestBoards) ? Math.floor(rush.bestBoards) : 0) },
    updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0,
  };
}

export function createCloudSave(progress, now = Date.now()) {
  const puzzleCompleted = uniqueLevels(progress?.completedPuzzleLevels ?? completedThrough(progress?.highestUnlockedLevel));
  const routeCompleted = uniqueLevels(progress?.completedRouteLevels ?? completedThrough(progress?.highestUnlockedRoute));
  return normalizeCloudSave({
    version: CLOUD_SAVE_VERSION,
    puzzle: { highestUnlockedLevel: progress?.highestUnlockedLevel, completedLevels: puzzleCompleted },
    route: { highestUnlockedRoute: progress?.highestUnlockedRoute, completedRoutes: routeCompleted, bestRotations: progress?.routeBestRotations },
    rush: { bestScore: progress?.rushBestScore, bestBoards: progress?.rushBestBoards },
    updatedAt: now,
  });
}

function mergeBestMaps(local, cloud) {
  const result = { ...normalizeBestMap(local) };
  Object.entries(normalizeBestMap(cloud)).forEach(([key, value]) => {
    if (!result[key] || value < result[key]) result[key] = value;
  });
  return result;
}

export function mergeCloudSave(localProgress, cloudValue, now = Date.now()) {
  const cloud = normalizeCloudSave(cloudValue);
  const local = createCloudSave(localProgress, now);
  const puzzleCompleted = uniqueLevels([...local.puzzle.completedLevels, ...(cloud?.puzzle.completedLevels || [])]);
  const routeCompleted = uniqueLevels([...local.route.completedRoutes, ...(cloud?.route.completedRoutes || [])]);
  const merged = {
    version: CLOUD_SAVE_VERSION,
    puzzle: {
      highestUnlockedLevel: Math.max(local.puzzle.highestUnlockedLevel, cloud?.puzzle.highestUnlockedLevel || 1, puzzleCompleted.length ? Math.max(...puzzleCompleted) + 1 : 1),
      completedLevels: puzzleCompleted,
    },
    route: {
      highestUnlockedRoute: Math.max(local.route.highestUnlockedRoute, cloud?.route.highestUnlockedRoute || 1, routeCompleted.length ? Math.max(...routeCompleted) + 1 : 1),
      completedRoutes: routeCompleted,
      bestRotations: mergeBestMaps(local.route.bestRotations, cloud?.route.bestRotations),
    },
    rush: {
      bestScore: Math.max(local.rush.bestScore, cloud?.rush.bestScore || 0),
      bestBoards: Math.max(local.rush.bestBoards, cloud?.rush.bestBoards || 0),
    },
    updatedAt: Math.max(local.updatedAt || 0, cloud?.updatedAt || 0, now),
  };
  return { cloud: merged, progress: cloudToProgress(merged) };
}

export function cloudToProgress(cloudValue) {
  const cloud = normalizeCloudSave(cloudValue) || createCloudSave({});
  return {
    highestUnlockedLevel: cloud.puzzle.highestUnlockedLevel,
    completedPuzzleLevels: cloud.puzzle.completedLevels,
    highestUnlockedRoute: cloud.route.highestUnlockedRoute,
    completedRouteLevels: cloud.route.completedRoutes,
    routeBestRotations: { ...cloud.route.bestRotations },
    rushBestScore: cloud.rush.bestScore,
    rushBestBoards: cloud.rush.bestBoards,
  };
}

export function cloudProgressEqual(a, b) {
  const left = normalizeCloudSave(a); const right = normalizeCloudSave(b);
  if (!left || !right) return false;
  return JSON.stringify({ ...left, updatedAt: 0 }) === JSON.stringify({ ...right, updatedAt: 0 });
}

export function createCloudSaveManager({ platform, getProgress, applyProgress, onStatus, debounceMs = 1500, minWriteIntervalMs = 3000, now = () => Date.now() }) {
  let cloud = null;
  let dirty = false;
  let timer = null;
  let lastWriteAt = 0;
  let writePromise = null;

  function status(value) { onStatus?.(value); }

  async function write() {
    if (!dirty || !platform?.setCloudData || !platform?.isPlayerAvailable?.()) return { saved: false };
    if (writePromise) { schedule(); return { saved: false, deferred: true }; }
    const wait = Math.max(0, minWriteIntervalMs - (now() - lastWriteAt));
    if (wait > 0) { timer = globalThis.setTimeout(() => { timer = null; write(); }, wait); return { saved: false, deferred: true }; }
    dirty = false;
    cloud = createCloudSave(getProgress(), now());
    status('syncing');
    writePromise = platform.setCloudData(cloud, false).catch(() => ({ saved: false }));
    const result = await writePromise;
    writePromise = null;
    lastWriteAt = now();
    status(result?.saved === false ? 'local' : 'cloud');
    if (dirty) schedule();
    return result;
  }

  function schedule() {
    if (timer) globalThis.clearTimeout(timer);
    timer = globalThis.setTimeout(() => { timer = null; write(); }, debounceMs);
  }

  function markDirty() {
    if (!platform?.isPlayerAvailable?.()) return;
    dirty = true;
    schedule();
  }

  async function load() {
    if (!platform?.isPlayerAvailable?.() || !platform.getCloudData) { status('local'); return { cloud: null, merged: false }; }
    status('syncing');
    const remote = await platform.getCloudData().catch(() => null);
    const result = mergeCloudSave(getProgress(), remote, now());
    cloud = result.cloud;
    applyProgress(result.progress);
    const needsWrite = !remote || !cloudProgressEqual(remote, cloud);
    if (needsWrite) { dirty = true; schedule(); }
    status(needsWrite ? 'syncing' : 'cloud');
    return { cloud, merged: true, needsWrite };
  }

  function dispose() { if (timer) globalThis.clearTimeout(timer); timer = null; }

  return { load, markDirty, flush: write, dispose, getCloud: () => cloud, isDirty: () => dirty, isWriting: () => Boolean(writePromise) };
}
