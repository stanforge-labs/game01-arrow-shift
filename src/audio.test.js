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
});
