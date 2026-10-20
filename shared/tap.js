/*
 * Tap handling for small fingers. A four-year-old often drags after touching,
 * which makes a normal click never fire. Tap.on() runs the handler on first
 * contact (pointerdown) instead of on release.
 *
 * Caveat handled elsewhere: browsers only grant "user activation" (needed for
 * speech and audio) when the finger lifts, so audio.js retries a refused
 * utterance on the following pointerup. Only the very first tap on a page is
 * affected.
 *
 * Plain script, exposes window.Tap.
 */
(function () {
  function on(el, handler) {
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return; // right/middle click
      if (el.disabled) return;
      e.preventDefault(); // no focus ring, no synthetic mouse events
      handler(e);
    });
    // The click that follows must not run anything a second time or follow a link early.
    el.addEventListener('click', function (e) { e.preventDefault(); });
  }

  window.Tap = { on };
})();
