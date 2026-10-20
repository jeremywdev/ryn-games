/*
 * Shared audio for ryn-games: spoken words via the Web Speech API and
 * tiny synthesized sound effects via WebAudio. No audio files needed.
 * Plain script, exposes window.GameAudio.
 *
 * Speech notes (Chrome / Chrome OS):
 *  - speak() is refused before the first user gesture ('not-allowed').
 *  - cancel() immediately followed by speak() sometimes drops the new
 *    utterance, so a cancel is followed by a short gap before speaking.
 *  - onend is not guaranteed, so every utterance has a fallback timer that
 *    scales with its length, armed from when speech actually starts.
 *  - An interrupted utterance is reported separately from a finished one so
 *    callers can tell "she heard it" from "we cut it off".
 */
(function () {
  const hasSpeech = 'speechSynthesis' in window;
  let ctx = null;
  let voice = null;
  let voicePicked = false;
  let enabled = true;
  let gen = 0;               // bumps on every non-queued say(); older unstarted utterances are dropped
  let chain = Promise.resolve();

  function audioCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Call from a user gesture so browsers let us make sound. */
  function unlock() {
    audioCtx();
    pickVoice();
  }

  // Prefer a voice that lives on the device: no network latency, works offline,
  // and it will not change under us when network voices arrive later.
  function pickVoice() {
    if (!hasSpeech || voicePicked) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const en = voices.filter(v => /^en([-_]|$)/i.test(v.lang));
    const pools = [en.filter(v => v.localService), en, voices];
    const prefer = [/Chrome OS US English/i, /Google US English/i, /Samantha/i, /Zira/i, /female/i, /en[-_]US/i, /en[-_]GB/i];
    for (const pool of pools) {
      if (!pool.length) continue;
      for (const re of prefer) {
        const hit = pool.find(v => re.test(v.name) || re.test(v.lang));
        if (hit) { voice = hit; voicePicked = true; return; }
      }
      voice = pool[0]; voicePicked = true; return;
    }
  }

  const readyCallbacks = [];
  function voicesLoaded() {
    return !hasSpeech || speechSynthesis.getVoices().length > 0;
  }
  if (hasSpeech) {
    speechSynthesis.onvoiceschanged = function () {
      pickVoice();
      while (readyCallbacks.length) readyCallbacks.shift()();
    };
    pickVoice();
    // Do not keep talking on a page the child has left.
    window.addEventListener('pagehide', () => speechSynthesis.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) speechSynthesis.cancel(); });
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
   * Speak text. By default it replaces whatever is being said; opts.queue
   * lines it up behind the current utterance instead.
   *   opts.onEnd        finished naturally (or could not be spoken at all)
   *   opts.onInterrupt  cut off by a later say() or a cancel
   *   opts.onDone       either of the above, always exactly once
   *   opts.onError(code) the engine reported an error, e.g. 'not-allowed'
   */
  function say(text, opts) {
    opts = opts || {};
    let finished = false;
    let timer = null;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const arm = ms => { clear(); timer = setTimeout(() => done('end'), ms); };
    function done(how) {
      if (finished) return;
      finished = true;
      clear();
      if (how === 'interrupted') { if (opts.onInterrupt) opts.onInterrupt(); }
      else if (opts.onEnd) opts.onEnd();
      if (opts.onDone) opts.onDone(how);
    }

    if (!enabled || !hasSpeech) {
      // No voice: still let sequences advance at a readable pace.
      timer = setTimeout(() => done('end'), 450);
      return;
    }

    if (!opts.queue) gen++;
    const myGen = gen;
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-US';
    u.rate = opts.rate || 0.95;
    u.pitch = opts.pitch || 1.15;
    u.volume = 1;
    u.onstart = () => arm(1500 + 90 * text.length);
    u.onend = () => done('end');
    u.onerror = e => {
      const code = e && e.error;
      if (opts.onError) opts.onError(code);
      done(code === 'interrupted' || code === 'canceled' ? 'interrupted' : 'end');
    };

    const needCancel = !opts.queue && (speechSynthesis.speaking || speechSynthesis.pending);
    if (needCancel) speechSynthesis.cancel();

    // All starts go through one chain so order is preserved; a cancel adds a
    // short gap so Chrome does not drop the next utterance.
    chain = chain
      .then(() => new Promise(res => setTimeout(res, needCancel ? 40 : 0)))
      .then(() => {
        if (finished) return;
        if (myGen !== gen) { done('interrupted'); return; } // superseded before it started
        arm(opts.queue ? 8000 : 3000); // never started: give up eventually
        speechSynthesis.speak(u);
      });
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

  /** Gentle "nope" for a wrong tap. */
  function nope() {
    if (!enabled) return;
    tone(220, 0.15, 'triangle', 0, 0.12);
    tone(196, 0.2, 'triangle', 0.12, 0.12);
  }

  function setEnabled(v) {
    enabled = !!v;
    if (!enabled && hasSpeech) speechSynthesis.cancel();
  }

  window.GameAudio = { unlock, ready, say, pop, unpop, chime, nope, setEnabled, get enabled() { return enabled; } };
})();
