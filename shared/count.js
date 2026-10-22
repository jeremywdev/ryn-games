/*
 * Count blocks aloud: light each block in turn and say its number, so a stuck
 * child can count along. Needs blocks.css (.block.lit) and audio.js.
 *
 *   Count.along(blockElements, opts)
 *     opts.from    number said for the first block (default 1)
 *     opts.alive   () => bool; return false to stop early (e.g. round changed)
 *     opts.onDone  called after the last number, unless stopped
 *
 * Plain script, exposes window.Count.
 */
(function () {
  function along(blocks, opts) {
    opts = opts || {};
    const from = opts.from || 1;
    const alive = opts.alive || (() => true);
    const list = Array.from(blocks);
    let i = 0;

    function clear() { list.forEach(b => b.classList.remove('lit')); }

    function step() {
      if (!alive()) { clear(); return; }
      if (i >= list.length) {
        setTimeout(() => { clear(); if (alive() && opts.onDone) opts.onDone(); }, 350);
        return;
      }
      const b = list[i];
      b.classList.add('lit');
      GameAudio.pop(from + i);
      GameAudio.say(Blocks.WORDS[from + i] || String(from + i), {
        onDone: () => { i++; setTimeout(step, 110); }
      });
    }
    step();
  }

  window.Count = { along };
})();
