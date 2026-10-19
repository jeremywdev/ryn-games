/*
 * Shared audio for ryn-games: spoken words via the Web Speech API and
 * tiny synthesized sound effects via WebAudio. No audio files needed.
 * Plain script, exposes window.GameAudio.
 */
(function () {
  let ctx = null;
  let voice = null;
  let enabled = true;

  function audioCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Call from the first user gesture so browsers let us make sound. */
  function unlock() {
    audioCtx();
    pickVoice();
  }

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const en = voices.filter(v => /^en/i.test(v.lang));
    const prefer = [
      /Google US English/i, /Samantha/i, /Zira/i, /Chrome OS US English/i,
      /female/i, /en-US/i, /en-GB/i
    ];
    for (const re of prefer) {
      const hit = en.find(v => re.test(v.name) || re.test(v.lang));
      if (hit) { voice = hit; return; }
    }
    voice = en[0] || voices[0];
  }

  const readyCallbacks = [];
  function voicesLoaded() {
    return !('speechSynthesis' in window) || speechSynthesis.getVoices().length > 0;
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = function () {
      pickVoice();
      while (readyCallbacks.length) readyCallbacks.shift()();
    };
    pickVoice();
  }

  /** Run cb as soon as a voice can be used: right now if voices are loaded, else when they arrive. */
  function ready(cb) {
    if (voicesLoaded()) { cb(); return; }
    let done = false;
    const once = () => { if (!done) { done = true; cb(); } };
    readyCallbacks.push(once);
    setTimeout(once, 250); // some engines never fire voiceschanged; don't wait forever
  }

  /**
   * Speak text, cancelling anything already being said.
   * opts.onEnd fires once when the word has finished (or could not be spoken),
   * so callers can pace a sequence off the real speech length instead of a timer.
   */
  function say(text, opts) {
    opts = opts || {};
    let finished = false;
    let fallback = null;
    function finish() {
      if (finished) return;
      finished = true;
      if (fallback) clearTimeout(fallback);
      if (opts.onEnd) opts.onEnd();
    }

    if (!enabled || !('speechSynthesis' in window)) {
      // No voice: still let sequences advance at a readable pace.
      if (opts.onEnd) fallback = setTimeout(finish, 450);
      return;
    }
    if (!opts.queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = opts.rate || 0.95;
    u.pitch = opts.pitch || 1.15;
    u.volume = 1;
    u.onend = finish;
    u.onerror = function (e) {
      // e.error is 'not-allowed' when the browser wants a user gesture first.
      if (opts.onError) opts.onError(e && e.error);
      finish();
    };
    // Some engines never fire onend; never let a sequence stall on that.
    if (opts.onEnd) fallback = setTimeout(finish, 2500);
    speechSynthesis.speak(u);
  }

  function tone(freq, duration, type, when, gain) {
    const c = audioCtx();
    if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.25, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** A short rising "pop" that gets higher with bigger numbers. */
  function pop(n) {
    if (!enabled) return;
    const base = 330 + Math.min(n, 20) * 28;
    tone(base, 0.12, 'triangle', 0, 0.2);
    tone(base * 1.5, 0.08, 'sine', 0.03, 0.08);
  }

  /** A softer falling "plink" for removing a block. */
  function unpop(n) {
    if (!enabled) return;
    const base = 330 + Math.min(n, 20) * 28;
    tone(base, 0.1, 'sine', 0, 0.12);
    tone(base * 0.75, 0.12, 'sine', 0.05, 0.1);
  }

  /** Little ta-da when a target is reached. */
  function chime() {
    if (!enabled) return;
    tone(523, 0.18, 'sine', 0.00, 0.18);
    tone(659, 0.18, 'sine', 0.12, 0.18);
    tone(784, 0.30, 'sine', 0.24, 0.20);
  }

  /** Gentle "nope" for a wrong tap (used by later games). */
  function nope() {
    if (!enabled) return;
    tone(220, 0.15, 'triangle', 0, 0.12);
    tone(196, 0.2, 'triangle', 0.12, 0.12);
  }

  function setEnabled(v) {
    enabled = !!v;
    if (!enabled && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  window.GameAudio = { unlock, ready, say, pop, unpop, chime, nope, setEnabled, get enabled() { return enabled; } };
})();
