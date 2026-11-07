"use strict";

// Recorded foley with quiet cabin ambience. Embedded files also work over file://.
const storySound = (() => {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const listeners = new Set();
  const beds = new Set();
  const effects = new Set();
  const shots = new WeakMap();
  let enabled = false;
  let available = Boolean(AudioEngine);
  let volume = 45;
  let context, master, ambienceBus, effectBus, noiseBuffer, owner, currentBed;
  let recordingsReady;
  const recordings = new Map();
  let toggleVersion = 0;
  const notify = () => listeners.forEach(listener => listener(enabled, available, volume));

  function hold(parameter) {
    const now = context.currentTime;
    if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
    else { const value = parameter.value; parameter.cancelScheduledValues(now); parameter.setValueAtTime(value, now); }
  }
  function dispose(group) {
    if (group.disposed) return;
    group.disposed = true;
    group.sources.forEach(source => { try { source.stop(); } catch {} });
    group.nodes.forEach(node => { try { node.disconnect(); } catch {} });
    effects.delete(group);
    beds.delete(group);
    if (currentBed === group) currentBed = null;
    if (group.recorded) refreshAmbientLevel();
  }
  function retire(group, seconds = 0) {
    if (group.disposed) return;
    if (!seconds) { dispose(group); return; }
    hold(group.gain.gain);
    group.gain.gain.linearRampToValueAtTime(0, context.currentTime + seconds);
    group.sources.forEach(source => { try { source.stop(context.currentTime + seconds + 0.01); } catch {} });
  }
  function stopEffects(dialog, keepChoice = false, seconds = 0, keepRecordings = false) {
    effects.forEach(group => {
      if (group.dialog === dialog && (!keepChoice || group.tag !== "choice") && (!keepRecordings || !group.recorded)) {
        retire(group, group.recorded && seconds ? Math.max(0.18, seconds) : seconds);
      }
    });
  }
  function refreshAmbientLevel() {
    if (!ambienceBus) return;
    const foreground = [...effects].some(group => group.recorded && !group.disposed);
    hold(ambienceBus.gain);
    ambienceBus.gain.linearRampToValueAtTime(foreground ? 0.035 : 0.18, context.currentTime + (foreground ? 0.06 : 0.4));
  }
  function silence() {
    [...beds, ...effects].forEach(group => dispose(group));
    currentBed = null;
  }
  async function ensureContext() {
    if (!available) return false;
    try {
      if (!context) {
        context = new AudioEngine();
        master = context.createGain();
        master.gain.value = volume / 100 * 0.6;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.knee.value = 16;
        limiter.ratio.value = 6;
        limiter.attack.value = 0.008;
        limiter.release.value = 0.18;
        master.connect(limiter).connect(context.destination);
        ambienceBus = context.createGain();
        ambienceBus.gain.value = 0.18;
        effectBus = context.createGain();
        ambienceBus.connect(master);
        effectBus.connect(master);
        noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
      }
      if (context.state === "suspended" || context.state === "interrupted") await context.resume();
      if (!recordingsReady) recordingsReady = Promise.all(Object.entries(storyRecordings).map(async ([name, clip]) => {
        const bytes = Uint8Array.from(atob(clip.data), value => value.charCodeAt(0));
        recordings.set(name, await context.decodeAudioData(bytes.buffer));
      }));
      await recordingsReady;
      return context.state === "running";
    } catch {
      available = false;
      enabled = false;
      silence();
      notify();
      return false;
    }
  }
  function playable(dialog) {
    return enabled && context && context.state === "running" && !document.hidden && dialog.open;
  }
  function source(group, type, { frequency = 100, finish = frequency, filter = "lowpass", cutoff = 900, endCutoff = cutoff, q = 0.6, level = 1, delay = 0, duration = 1 } = {}) {
    const start = context.currentTime + delay;
    const node = type === "noise" ? context.createBufferSource() : context.createOscillator();
    if (type === "noise") { node.buffer = noiseBuffer; node.loop = true; }
    else {
      node.type = type;
      node.frequency.setValueAtTime(frequency, start);
      node.frequency.exponentialRampToValueAtTime(Math.max(1, finish), start + duration);
    }
    const shape = context.createBiquadFilter();
    shape.type = filter;
    shape.Q.value = q;
    shape.frequency.setValueAtTime(cutoff, start);
    shape.frequency.exponentialRampToValueAtTime(Math.max(1, endCutoff), start + duration);
    const gain = context.createGain();
    gain.gain.value = level;
    node.connect(shape).connect(gain).connect(group.gain);
    group.sources.push(node);
    group.nodes.push(node, shape, gain);
    node.start(start);
    return node;
  }
  function voice(dialog, tag, type, options = {}) {
    const { duration = 0.1, delay = 0, level = 0.2, attack = 0.006, release = 0.04 } = options;
    const gain = context.createGain();
    const start = context.currentTime + delay;
    const end = start + duration;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + Math.min(attack, duration / 3));
    gain.gain.setValueAtTime(level, Math.max(start + Math.min(attack, duration / 3), end - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(effectBus);
    const group = { dialog, tag, gain, sources: [], nodes: [gain], disposed: false };
    const node = source(group, type, { ...options, level: 1, duration, delay });
    effects.add(group);
    node.addEventListener("ended", () => dispose(group), { once: true });
    node.stop(end + 0.02);
  }
  function recordedVoice(dialog, name) {
    const buffer = recordings.get(name);
    if (!buffer) return;
    const gain = context.createGain();
    const level = ({ buckle: 1, stow: 1.1, data: 0.85, compare: 0.85, cloth: 0.35, write: 0.4 })[name] || 1;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(level, context.currentTime + 0.02);
    gain.gain.setValueAtTime(level, context.currentTime + buffer.duration - 0.08);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + buffer.duration);
    gain.connect(effectBus);
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.playbackRate.value = 1;
    node.connect(gain);
    const group = { dialog, tag: name, recorded: true, gain, sources: [node], nodes: [node, gain], disposed: false };
    effects.add(group);
    refreshAmbientLevel();
    node.addEventListener("ended", () => dispose(group), { once: true });
    node.start();
  }
  function start(dialog, descriptor = shots.get(dialog) || {}) {
    if (!playable(dialog) || !["prologue", "entering", "playing"].includes(dialog.dataset.mode)) return;
    const profile = dialog.dataset.mode === "prologue" ? "briefing" : descriptor.profile || (dialog.dataset.film === "sleep" ? "station" : "cruise");
    if (owner === dialog && currentBed && currentBed.profile === profile) return;
    if (owner && owner !== dialog) silence();
    owner = dialog;
    if (currentBed) retire(currentBed, 0.65);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(profile === "sleep" || profile === "briefing" ? 0.07 : 0.13, context.currentTime + 0.65);
    gain.connect(ambienceBus);
    const group = { dialog, profile, gain, sources: [], nodes: [gain], disposed: false };
    beds.add(group);
    currentBed = group;
    source(group, "noise", { cutoff: profile === "sleep" ? 240 : 480, level: 0.06 });
    source(group, "sine", { frequency: profile === "station" || profile === "sleep" ? 58 : profile === "equipment" ? 92 : 69, cutoff: 200, level: 0.6 });
    if (profile === "equipment") source(group, "triangle", { frequency: 138, cutoff: 900, level: 0.08 });
    if (profile === "launch") source(group, "noise", { cutoff: 140, level: 1.3 });
    group.sources[0].addEventListener("ended", () => dispose(group), { once: true });
  }
  function cue(name, dialog) {
    if (!playable(dialog) || !name) return;
    owner = dialog;
    if (recordings.has(name)) { recordedVoice(dialog, name); return; }
    if (["choice", "cut", "transition"].includes(name)) return;
    const noise = options => voice(dialog, name, "noise", options);
    const tone = options => voice(dialog, name, "sine", options);
    if (name === "comms") {
      if ([...effects].some(group => group.dialog === dialog && group.recorded)) return;
      tone({ frequency: 780, cutoff: 3000, duration: 0.055, delay: 0.04, level: 0.1 });
      tone({ frequency: 1040, cutoff: 3000, duration: 0.06, delay: 0.12, level: 0.08 });
    }
    if (name === "switch") {
      tone({ frequency: 310, finish: 150, cutoff: 1400, duration: 0.07, delay: 0.14, level: 0.12 });
    }
    if (name === "launch") {
      noise({ cutoff: 110, endCutoff: 680, duration: 3.2, level: 0.55, attack: 0.8, release: 0.7 });
      noise({ filter: "bandpass", cutoff: 95, endCutoff: 210, duration: 2.9, delay: 0.15, level: 0.35, attack: 0.9, release: 0.6 });
      tone({ frequency: 34, finish: 63, cutoff: 200, duration: 3, level: 0.2, attack: 0.8, release: 0.7 });
    }
    if (name === "ending") [440, 554, 659].forEach((frequency, index) => tone({ frequency, cutoff: 2400, duration: 0.65, delay: index * 0.18, level: 0.12, attack: 0.04, release: 0.45 }));
  }
  function shot(dialog, descriptor) {
    const prior = shots.get(dialog);
    shots.set(dialog, descriptor);
    if (!playable(dialog) || dialog.dataset.mode !== "playing") return;
    start(dialog, descriptor);
    if (prior && prior.key === descriptor.key) return;
    stopEffects(dialog, true, 0.15, Boolean(prior && prior.sceneKey === descriptor.sceneKey));
    cue(descriptor.cue || "cut", dialog);
  }
  async function toggle(dialog) {
    const change = ++toggleVersion;
    enabled = !enabled;
    if (!enabled) { silence(); notify(); return; }
    notify();
    if (!await ensureContext() || change !== toggleVersion || !enabled || !dialog.open) return;
    start(dialog);
    cue("comms", dialog);
  }
  function stop(dialog) {
    stopEffects(dialog);
    beds.forEach(group => { if (group.dialog === dialog) dispose(group); });
    if (owner === dialog) owner = null;
  }
  function fadeOut(dialog, seconds = 0.7) {
    stopEffects(dialog, false, 0.04);
    beds.forEach(group => { if (group.dialog === dialog) retire(group, seconds); });
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(100, Number(value) || 0));
    if (master) { hold(master.gain); master.gain.linearRampToValueAtTime(volume / 100 * 0.6, context.currentTime + 0.06); }
    notify();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) silence();
    else if (owner) start(owner);
  });
  return {
    toggle, start, shot, cue, stop, fadeOut, setVolume,
    async prepare() { if (enabled) await ensureContext(); },
    ending(dialog) { stop(dialog); owner = dialog; cue("ending", dialog); },
    subscribe(listener) { listeners.add(listener); listener(enabled, available, volume); },
    get enabled() { return enabled; },
    get volume() { return volume; }
  };
})();
