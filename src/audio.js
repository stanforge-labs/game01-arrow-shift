const SOUND_NAMES = ['uiClick', 'tilePress', 'exit', 'blocked', 'shift', 'pinnedHold', 'barrierBlocked', 'victory', 'routeRotate', 'routeRun', 'routeSuccess', 'routeFail', 'rushStart', 'rushEnd'];

function envelope(context, destination, frequency, duration, peak, type = 'sine', slideTo = null) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.008, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function noise(context, destination, duration, peak, highpass = 900) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(highpass, now);
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(destination);
  source.start(now);
  source.stop(now + duration + 0.01);
}

export function createAudioController() {
  let context = null;
  let masterGain = null;
  let compressor = null;
  let enabled = true;

  function ensureContext() {
    if (typeof window === 'undefined' || !enabled) return null;
    if (!context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      try {
        context = new AudioContextCtor();
        masterGain = context.createGain();
        masterGain.gain.value = 0.72;
        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 16;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.18;
        masterGain.connect(compressor).connect(context.destination);
      } catch {
        context = null;
        masterGain = null;
        compressor = null;
        return null;
      }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function play(name) {
    if (!SOUND_NAMES.includes(name)) return false;
    const audio = ensureContext();
    if (!audio || !masterGain) return false;
    const pitch = 1 + ((Math.random() * 2 - 1) * 0.025);
    if (name === 'uiClick') {
      noise(audio, masterGain, 0.014, 0.035, 1500);
      envelope(audio, masterGain, 245 * pitch, 0.055, 0.07, 'triangle', 205 * pitch);
    } else if (name === 'tilePress') {
      noise(audio, masterGain, 0.012, 0.027, 1200);
      envelope(audio, masterGain, 190 * pitch, 0.065, 0.085, 'triangle', 155 * pitch);
    } else if (name === 'exit') {
      envelope(audio, masterGain, 300, 0.12, 0.075, 'sine', 510);
    } else if (name === 'blocked') {
      envelope(audio, masterGain, 135, 0.075, 0.065, 'triangle', 105);
    } else if (name === 'barrierBlocked') {
      envelope(audio, masterGain, 105, 0.09, 0.072, 'triangle', 78);
    } else if (name === 'pinnedHold') {
      envelope(audio, masterGain, 175, 0.085, 0.06, 'triangle', 195);
    } else if (name === 'shift') {
      envelope(audio, masterGain, 220, 0.19, 0.052, 'sine', 410);
    } else if (name === 'victory') {
      envelope(audio, masterGain, 350, 0.13, 0.06, 'sine', 440);
      window.setTimeout(() => {
        if (enabled) envelope(audio, masterGain, 470, 0.14, 0.055, 'sine', 590);
      }, 90);
      window.setTimeout(() => {
        if (enabled) envelope(audio, masterGain, 620, 0.16, 0.045, 'sine', 700);
      }, 190);
    } else if (name === 'routeRotate') {
      envelope(audio, masterGain, 250 * pitch, 0.06, 0.055, 'triangle', 320 * pitch);
    } else if (name === 'routeRun') {
      envelope(audio, masterGain, 220, 0.16, 0.045, 'sine', 360);
    } else if (name === 'routeSuccess') {
      envelope(audio, masterGain, 340, 0.11, 0.055, 'sine', 450);
      window.setTimeout(() => { if (enabled) envelope(audio, masterGain, 500, 0.14, 0.05, 'sine', 620); }, 90);
    } else if (name === 'routeFail') {
      envelope(audio, masterGain, 180, 0.13, 0.045, 'triangle', 110);
    } else if (name === 'rushStart') {
      envelope(audio, masterGain, 260, 0.08, 0.045, 'triangle', 380);
    } else if (name === 'rushEnd') {
      envelope(audio, masterGain, 300, 0.12, 0.05, 'triangle', 190);
    }
    return true;
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
