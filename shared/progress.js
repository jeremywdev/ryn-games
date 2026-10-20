/*
 * Shared per-numeral memory for ryn-games.
 * Remembers, for each number 1-20:
 *   hits / misses  - rounds where that number was asked for, scored once per
 *                    round: a hit if her first tap was right, else a miss.
 *   streak         - consecutive first-try hits.
 *   confused       - rounds in which she tapped this number when a different
 *                    one was asked for. Not a miss, but a sign it is not solid.
 * It also remembers which numbers get mixed up with which (pairs), so quiz
 * games can put the confusable pair on the board together.
 *
 * The question range (band) only ever widens: 1-5, then 1-10 once those are
 * mastered, then 1-20. A later wobble re-drills the number through weighting
 * but never shrinks the band.
 *
 * Stored in localStorage on the device; no accounts.
 * Plain script, exposes window.Progress.
 */
(function () {
  const KEY = 'ryn-games.progress.v2';
  const BACKUP = KEY + '.backup';
  const MAX = 20;

  function blank() {
    return { numbers: {}, pairs: {}, band: 5, pendingUnlock: 0, updatedAt: 0 };
  }

  function normalize(d) {
    if (!d || typeof d !== 'object' || !d.numbers) return blank();
    if (!d.pairs) d.pairs = {};
    if (!d.band) d.band = 5;
    if (!d.pendingUnlock) d.pendingUnlock = 0;
    return d;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return blank();
    }
  }

  function save() {
    try {
      data.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* private mode or storage blocked: play on without memory */ }
  }

  let data = load();

  function entry(n) {
    return data.numbers[n] || (data.numbers[n] = { hits: 0, misses: 0, streak: 0, confused: 0 });
  }

  /** Stats for one number: { hits, misses, streak, confused, seen }. seen = rounds asked. */
  function get(n) {
    const s = data.numbers[n] || { hits: 0, misses: 0, streak: 0, confused: 0 };
    return { hits: s.hits, misses: s.misses, streak: s.streak, confused: s.confused || 0, seen: s.hits + s.misses };
  }

  /** Score one round where n was asked for. Call once per round, when it ends. */
  function record(n, firstTryCorrect) {
    const s = entry(n);
    if (firstTryCorrect) { s.hits++; s.streak++; } else { s.misses++; s.streak = 0; }
    save();
  }

  /**
   * She tapped `tapped` when `asked` was wanted. Counts against the tapped
   * number and remembers the pair. Callers should report each tapped number
   * at most once per round.
   */
  function recordConfusion(tapped, asked) {
    if (tapped === asked) return;
    const s = entry(tapped);
    s.confused = (s.confused || 0) + 1;
    s.streak = 0; // a mix-up breaks the streak: she is not sure what this one is
    const row = data.pairs[asked] || (data.pairs[asked] = {});
    row[tapped] = (row[tapped] || 0) + 1;
    save();
  }

  /**
   * Numbers that get mixed up with n, in either direction, most frequent
   * first: [{ n, count }]. Used to choose distractors that actually test her.
   */
  function confusedWith(n) {
    const counts = {};
    const row = data.pairs[n] || {};
    Object.keys(row).forEach(k => { counts[k] = (counts[k] || 0) + row[k]; });
    Object.keys(data.pairs).forEach(asked => {
      const c = data.pairs[asked][n];
      if (c) counts[asked] = (counts[asked] || 0) + c;
    });
    return Object.keys(counts)
      .map(k => ({ n: Number(k), count: counts[k] }))
      .sort((a, b) => b.count - a.count);
  }

  /** A number counts as mastered after a few right answers and a short clean streak. */
  function mastered(n) {
    const s = get(n);
    return s.hits >= 3 && s.streak >= 2;
  }

  function allMastered(from, to) {
    for (let i = from; i <= to; i++) if (!mastered(i)) return false;
    return true;
  }

  /**
   * Highest number quiz games should ask about right now. Widens 5 -> 10 -> 20
   * as each band is mastered and never narrows again.
   */
  function range() {
    let want = 5;
    if (allMastered(1, 5)) want = 10;
    if (allMastered(1, 10)) want = 20;
    if (want > data.band) {
      data.band = want;
      data.pendingUnlock = want;
      save();
    }
    return data.band;
  }

  /** The band unlocked since the last call, or 0. Lets a game celebrate the level-up once. */
  function takeUnlock() {
    const u = data.pendingUnlock || 0;
    if (u) { data.pendingUnlock = 0; save(); }
    return u;
  }

  /**
   * How much a number wants to be asked. Unseen numbers and numbers she has
   * missed recently get more weight; well-known numbers fade but never vanish.
   */
  function weight(n) {
    const s = get(n);
    let w;
    if (s.seen === 0) {
      w = 3;
    } else {
      const missRate = s.misses / s.seen;
      w = 1 + 4 * missRate;
      if (s.streak === 0 && s.misses > 0) w += 1.5; // just got it wrong
      if (s.streak >= 3) w *= 0.5;                  // solid: ask less often
    }
    w += Math.min(3, s.confused * 0.75);            // mixed up with others: ask about it directly
    return Math.max(0.3, w);
  }

  /** Pick a target from pool (array of numbers), weighted, avoiding `avoid`. */
  function pickTarget(pool, avoid) {
    const candidates = pool.filter(n => n !== avoid);
    const list = candidates.length ? candidates : pool;
    const weights = list.map(weight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  /** Everything, for the parent view. */
  function all() {
    const out = [];
    for (let i = 1; i <= MAX; i++) out.push(Object.assign({ n: i, mastered: mastered(i) }, get(i)));
    return out;
  }

  /** Wipe progress, keeping one backup so a slip can be undone. */
  function reset() {
    try { localStorage.setItem(BACKUP, JSON.stringify(data)); } catch (e) { /* ignore */ }
    data = blank();
    save();
  }

  function canUndoReset() {
    try { return !!localStorage.getItem(BACKUP); } catch (e) { return false; }
  }

  function undoReset() {
    try {
      const raw = localStorage.getItem(BACKUP);
      if (!raw) return false;
      data = normalize(JSON.parse(raw));
      localStorage.removeItem(BACKUP);
      save();
      return true;
    } catch (e) { return false; }
  }

  window.Progress = {
    get, record, recordConfusion, confusedWith, mastered, range, takeUnlock,
    weight, pickTarget, all, reset, canUndoReset, undoReset, MAX
  };
})();
