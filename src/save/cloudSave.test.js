import { describe, expect, it, vi } from 'vitest';
import { createCloudSave, createCloudSaveManager, mergeCloudSave, normalizeCloudSave } from './cloudSave.js';

const local = { highestUnlockedLevel: 8, highestUnlockedRoute: 5, routeBestRotations: { 5: 6 }, rushBestScore: 175, rushBestBoards: 4 };

describe('cloud progress merge', () => {
  it('keeps local progress when cloud is empty', () => {
    const result = mergeCloudSave(local, null, 10);
    expect(result.progress.highestUnlockedLevel).toBe(8);
    expect(result.progress.rushBestScore).toBe(175);
  });

  it('takes monotonic progress from cloud and writes it back locally', () => {
    const cloud = createCloudSave({ highestUnlockedLevel: 14, highestUnlockedRoute: 3, rushBestScore: 40 }, 5);
    const result = mergeCloudSave({ highestUnlockedLevel: 5, highestUnlockedRoute: 1, rushBestScore: 10 }, cloud, 10);
    expect(result.progress.highestUnlockedLevel).toBe(14);
    expect(result.progress.highestUnlockedRoute).toBe(3);
    expect(result.progress.rushBestScore).toBe(40);
  });

  it('uses the lower positive route rotation best', () => {
    const cloud = createCloudSave({ ...local, routeBestRotations: { 5: 4 } }, 5);
    const result = mergeCloudSave(local, cloud, 10);
    expect(result.progress.routeBestRotations['5']).toBe(4);
  });

  it('never lets cloud lower rush records', () => {
    const cloud = createCloudSave({ highestUnlockedLevel: 1, rushBestScore: 142, rushBestBoards: 1 }, 5);
    const result = mergeCloudSave(local, cloud, 10);
    expect(result.progress.rushBestScore).toBe(175);
    expect(result.progress.rushBestBoards).toBe(4);
  });

  it('rejects malformed payloads safely', () => {
    expect(normalizeCloudSave(null)).toBeNull();
    expect(normalizeCloudSave({ version: 1, puzzle: 'bad' }).puzzle.highestUnlockedLevel).toBe(1);
  });

  it('coalesces rapid dirty changes into one cloud write', async () => {
    vi.useFakeTimers();
    const setCloudData = vi.fn().mockResolvedValue({ supported: true, saved: true });
    const manager = createCloudSaveManager({
      platform: { isPlayerAvailable: () => true, setCloudData },
      getProgress: () => ({ highestUnlockedLevel: 3 }),
      debounceMs: 100,
      minWriteIntervalMs: 0,
      now: () => 10_000,
    });
    for (let index = 0; index < 10; index += 1) manager.markDirty();
    await vi.advanceTimersByTimeAsync(100);
    expect(setCloudData).toHaveBeenCalledTimes(1);
    manager.dispose();
    vi.useRealTimers();
  });
});
