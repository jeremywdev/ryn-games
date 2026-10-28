/*
 * Starting a game. Games open straight onto the first round; there is no
 * start screen, so the only screen with the hopping lineup is the
 * end-of-set celebration.
 *
 *  - If the browser refuses to speak before a tap (opening a game from a
 *    bookmark, a reload), a plain play button covers the game. One tap
 *    removes it, and audio.js says the refused line as the finger lifts.
 *    Her first tap can therefore never land on an answer she hasn't heard.
 *  - If the browser restores a game from its back/forward cache (a back
 *    swipe), the page reloads, so a finished celebration never reappears.
 *
 * Needs audio.js and tap.js. Plain script; it sets itself up.
 */
(function () {
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

  const style = document.createElement('style');
  style.textContent =
    '.gate{position:fixed;inset:0;z-index:25;display:none;align-items:center;justify-content:center;' +
    'background:rgba(253,246,227,0.72);backdrop-filter:blur(2px)}' +
    '.gate.show{display:flex}' +
    '.gate .go{width:22vmin;height:22vmin;border-radius:50%;background:#4aa84a;position:relative;' +
    'box-shadow:0 6px 0 rgba(0,0,0,0.18),0 8px 18px rgba(0,0,0,0.15);animation:gate-pulse 1.4s ease-in-out infinite}' +
    '.gate .go::after{content:"";position:absolute;left:56%;top:50%;transform:translate(-50%,-50%);' +
    'border-left:9vmin solid #fff;border-top:6vmin solid transparent;border-bottom:6vmin solid transparent}' +
    '@keyframes gate-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}';
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.className = 'gate';
  gate.innerHTML = '<div class="go" aria-label="Start"></div>';
  document.body.appendChild(gate);

  // Anywhere on the cover counts, so a small finger can't miss.
  Tap.on(gate, () => gate.classList.remove('show'));
  GameAudio.onBlocked(() => gate.classList.add('show'));
})();
