const SOUND_NAMES = ['uiClick', 'tilePress', 'exit', 'blocked', 'shift', 'pinnedHold', 'barrierBlocked', 'victory', 'routeRotate', 'routeRun', 'routeMove', 'routeSuccess', 'routeFail', 'rushStart', 'rushEnd'];

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
  filter.type = 'highpass'; filter.frequency.setValueAtTime(highpass, now);
  gain.gain.setValueAtTime(peak, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.buffer = buffer; source.connect(filter).connect(gain).connect(destination); source.start(now); source.stop(now + duration + 0.01);
}

export function createAudioController() {
  let context = null;
  let masterGain = null;
  let compressor = null;
  let sfxGain = null;
  let musicGain = null;
  let sfxOn = true;
  let musicOn = true;
  let musicNodes = [];
  let musicTimer = null;
  let musicStep = 0;

  function ensureContext() {
    if (typeof window === 'undefined' || (!sfxOn && !musicOn)) return null;
    if (!context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      try {
        context = new AudioContextCtor();
        masterGain = context.createGain(); masterGain.gain.value = 0.72;
        sfxGain = context.createGain(); sfxGain.gain.value = 1;
        musicGain = context.createGain(); musicGain.gain.value = 0.045;
        compressor = context.createDynamicsCompressor(); compressor.threshold.value = -18; compressor.knee.value = 16; compressor.ratio.value = 4; compressor.attack.value = 0.003; compressor.release.value = 0.18;
        sfxGain.connect(masterGain); musicGain.connect(masterGain); masterGain.connect(compressor).connect(context.destination);
      } catch { context = null; masterGain = null; compressor = null; sfxGain = null; musicGain = null; return null; }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function stopMusic() {
    if (musicTimer) { window.clearInterval(musicTimer); musicTimer = null; }
    musicNodes.forEach((node) => { try { node.stop(); } catch {} try { node.disconnect(); } catch {} });
    musicNodes = [];
  }

  function playChord() {
    if (!context || !musicGain || !musicOn) return;
    const roots = [146.83, 164.81, 130.81, 174.61];
    const root = roots[musicStep % roots.length]; musicStep += 1;
    const now = context.currentTime;
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.35;
    const gain = context.createGain(); gain.gain.setValueAtTime(0.0001, now); gain.gain.linearRampToValueAtTime(0.7, now + 1.8); gain.gain.linearRampToValueAtTime(0.0001, now + 10.5); filter.connect(gain).connect(musicGain);
    const oscillators = [0, 1, 2].map((index) => { const oscillator = context.createOscillator(); oscillator.type = index === 0 ? 'sine' : 'triangle'; oscillator.frequency.value = root * [1, 1.25, 1.5][index]; oscillator.detune.value = (index - 1) * 3; oscillator.connect(filter); oscillator.start(now); oscillator.stop(now + 11); return oscillator; });
    const nodes = [filter, gain, ...oscillators]; musicNodes.push(...nodes); window.setTimeout(() => { nodes.forEach((node) => { try { node.disconnect(); } catch {} }); musicNodes = musicNodes.filter((node) => !nodes.includes(node)); }, 11200);
  }

  function startMusic() {
    if (!musicOn || !ensureContext() || musicTimer) return;
    musicGain.gain.cancelScheduledValues(context.currentTime); musicGain.gain.setValueAtTime(0.0001, context.currentTime); musicGain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.8);
    playChord(); musicTimer = window.setInterval(playChord, 10500);
  }

  function play(name) {
    if (!SOUND_NAMES.includes(name) || !sfxOn) return false;
    const audio = ensureContext(); if (!audio || !sfxGain) return false;
    const pitch = 1 + ((Math.random() * 2 - 1) * 0.025);
    if (name === 'uiClick') { noise(audio, sfxGain, 0.014, 0.035, 1500); envelope(audio, sfxGain, 245 * pitch, 0.055, 0.07, 'triangle', 205 * pitch); }
    else if (name === 'tilePress') { noise(audio, sfxGain, 0.012, 0.027, 1200); envelope(audio, sfxGain, 190 * pitch, 0.065, 0.085, 'triangle', 155 * pitch); }
    else if (name === 'exit') envelope(audio, sfxGain, 300, 0.12, 0.075, 'sine', 510);
    else if (name === 'blocked') envelope(audio, sfxGain, 135, 0.075, 0.065, 'triangle', 105);
    else if (name === 'barrierBlocked') envelope(audio, sfxGain, 105, 0.09, 0.072, 'triangle', 78);
    else if (name === 'pinnedHold') envelope(audio, sfxGain, 175, 0.085, 0.06, 'triangle', 195);
    else if (name === 'shift') envelope(audio, sfxGain, 220, 0.19, 0.052, 'sine', 410);
    else if (name === 'victory') { envelope(audio, sfxGain, 350, 0.13, 0.06, 'sine', 440); window.setTimeout(() => { if (sfxOn && context) envelope(audio, sfxGain, 470, 0.14, 0.055, 'sine', 590); }, 90); window.setTimeout(() => { if (sfxOn && context) envelope(audio, sfxGain, 620, 0.16, 0.045, 'sine', 700); }, 190); }
    else if (name === 'routeRotate') envelope(audio, sfxGain, 250 * pitch, 0.06, 0.055, 'triangle', 320 * pitch);
    else if (name === 'routeRun') envelope(audio, sfxGain, 220, 0.16, 0.045, 'sine', 360);
    else if (name === 'routeMove') envelope(audio, sfxGain, 285 * pitch, 0.035, 0.022, 'sine', 300 * pitch);
    else if (name === 'routeSuccess') { envelope(audio, sfxGain, 340, 0.11, 0.055, 'sine', 450); window.setTimeout(() => { if (sfxOn && context) envelope(audio, sfxGain, 500, 0.14, 0.05, 'sine', 620); }, 90); }
    else if (name === 'routeFail') envelope(audio, sfxGain, 180, 0.13, 0.045, 'triangle', 110);
    else if (name === 'rushStart') envelope(audio, sfxGain, 260, 0.08, 0.045, 'triangle', 380);
    else if (name === 'rushEnd') envelope(audio, sfxGain, 300, 0.12, 0.05, 'triangle', 190);
    return true;
  }

  return {
    play,
    startMusic,
    setEnabled(value) { sfxOn = Boolean(value); },
    setSfxEnabled(value) { sfxOn = Boolean(value); },
    setMusicEnabled(value) { musicOn = Boolean(value); if (!musicOn && musicGain && context) { musicGain.gain.cancelScheduledValues(context.currentTime); musicGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.3); window.setTimeout(stopMusic, 340); } },
    isEnabled() { return sfxOn; },
    isSfxEnabled() { return sfxOn; },
    isMusicEnabled() { return musicOn; },
    pauseAll() { if (context && context.state === 'running') context.suspend().catch(() => {}); },
    resumeAll() { if (context && (sfxOn || musicOn)) context.resume().catch(() => {}); if (musicOn) startMusic(); },
  };
}

export function haptic(duration) { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(duration); }
