function tone(context, frequency, duration, gainValue, type = 'sine', slideTo = null) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function createAudioController() {
  let context = null;
  let enabled = true;

  function ensureContext() {
    if (typeof window === 'undefined' || !enabled) return null;
    if (!context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      try { context = new AudioContextCtor(); } catch { return null; }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function play(name) {
    const audio = ensureContext();
    if (!audio) return;
    if (name === 'tap') tone(audio, 260, 0.045, 0.035, 'sine', 220);
    if (name === 'exit') tone(audio, 320, 0.14, 0.045, 'sine', 520);
    if (name === 'blocked') tone(audio, 150, 0.065, 0.03, 'triangle', 120);
    if (name === 'barrierBlocked') tone(audio, 115, 0.08, 0.038, 'triangle', 95);
    if (name === 'pinnedHold') tone(audio, 185, 0.08, 0.032, 'triangle', 205);
    if (name === 'shift') tone(audio, 240, 0.18, 0.028, 'sine', 420);
    if (name === 'victory') {
      tone(audio, 360, 0.12, 0.035, 'sine', 450);
      window.setTimeout(() => tone(audio, 540, 0.16, 0.032, 'sine', 640), 90);
    }
  }

  return {
    play,
    setEnabled(value) { enabled = Boolean(value); },
    isEnabled() { return enabled; },
  };
}

export function haptic(duration) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(duration);
}
