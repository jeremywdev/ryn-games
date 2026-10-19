/*
 * Shared per-numeral memory for ryn-games.
 * Remembers, for each number 1-20, how often she has got it right or wrong,
 * so quiz games can ask about weak numbers more often and widen the range
 * as numbers are mastered. Stored in localStorage on the device; no accounts.
 *
 * Plain script, exposes window.Progress.
 */
(function () {
  const KEY = 'ryn-games.progress.v1';
  const MAX = 20;

  function blank() {
    return { numbers: {}, updatedAt: 0 };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const data = JSON.parse(raw);
      return data && data.numbers ? data : blank();
    } catch (e) {
      return blank();
    }
  }

  function save(data) {
    try {
      data.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* private mode or storage blocked: play on without memory */ }
  }

  let data = load();

  /** Stats for one number: { hits, misses, streak, seen }. */
  function get(n) {
    const s = data.numbers[n] || { hits: 0, misses: 0, streak: 0 };
    return { hits: s.hits, misses: s.misses, streak: s.streak, seen: s.hits + s.misses };
  }

  /** Record one answer about number n. */
  function record(n, correct) {
    const s = data.numbers[n] || { hits: 0, misses: 0, streak: 0 };
    if (correct) { s.hits++; s.streak++; } else { s.misses++; s.streak = 0; }
    data.numbers[n] = s;
    save(data);
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

  /** Highest number quiz games should ask about right now: 10, then 20 once 1-10 are mastered. */
  function range() {
    return allMastered(1, 10) ? 20 : 10;
  }

  /**
   * How much a number wants to be asked. Unseen numbers and numbers she has
   * missed recently get more weight; well-known numbers fade but never vanish.
   */
  function weight(n) {
    const s = get(n);
    if (s.seen === 0) return 3;
    const missRate = s.misses / s.seen;
    let w = 1 + 4 * missRate;
    if (s.streak === 0 && s.misses > 0) w += 1.5; // just got it wrong
    if (s.streak >= 3) w *= 0.5;                  // solid: ask less often
    return Math.max(0.3, w);
  }

  /** Pick a target from pool (array of numbers), weighted, avoiding `avoid`. */
  function pickTarget(pool, avoid) {
    const candidates = pool.filter(n => n !== avoid);
    const list = candidates.length ? candidates : pool;
    const weights = list.map(weight);
    let total = weights.reduce((a, b) => a + b, 0);
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

  function reset() {
    data = blank();
    save(data);
  }

  window.Progress = { get, record, mastered, range, weight, pickTarget, all, reset, MAX };
})();
