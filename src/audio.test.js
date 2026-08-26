import { describe, expect, it } from 'vitest';
import { createAudioController } from './audio.js';

describe('audio dispatch', () => {
  it('does not create or dispatch sound while disabled', () => {
    const audio = createAudioController();
    audio.setEnabled(false);
    expect(audio.play('uiClick')).toBe(false);
    expect(audio.isEnabled()).toBe(false);
  });

  it('ignores unknown sound names', () => {
    const audio = createAudioController();
    expect(audio.play('not-a-sound')).toBe(false);
  });

  it('keeps SFX and music channels independently configurable', () => {
    const audio = createAudioController();
    audio.setSfxEnabled(false);
    expect(audio.isSfxEnabled()).toBe(false);
    expect(audio.isMusicEnabled()).toBe(true);
    audio.setMusicEnabled(false);
    expect(audio.isMusicEnabled()).toBe(false);
    expect(audio.play('uiClick')).toBe(false);
  });
});
