import { describe, expect, it } from 'vitest';
import { isLevelUnlocked, normalizeSave } from './storage.js';

describe('progress storage', () => {
  it('migrates the legacy level field without losing progress', () => {
    expect(normalizeSave({ saveVersion: 1, level: 8, language: 'en' })).toEqual({
      saveVersion: 4,
      language: 'en',
      soundOn: true,
      sfxOn: true,
      musicOn: true,
      highestUnlockedLevel: 8,
      lastPlayedLevel: 8,
      highestUnlockedRoute: 1,
      routeBestRotations: {},
      rushBestScore: 0,
      rushBestBoards: 0,
    });
  });

  it('keeps malformed settings safe', () => {
    expect(normalizeSave({ highestUnlockedLevel: -4, lastPlayedLevel: 'bad', soundOn: false }).highestUnlockedLevel).toBe(1);
    expect(normalizeSave({ soundOn: false }).soundOn).toBe(false);
  });

  it('migrates legacy sound setting to both audio channels', () => {
    const save = normalizeSave({ soundOn: false });
    expect(save.sfxOn).toBe(false);
    expect(save.musicOn).toBe(false);
  });

  it('allows every level only in development', () => {
    expect(isLevelUnlocked(4, 2, false)).toBe(false);
    expect(isLevelUnlocked(30, 2, true)).toBe(true);
  });
});
