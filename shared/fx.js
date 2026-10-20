/*
 * Little celebrations: a confetti burst from a point or an element.
 * Uses the Web Animations API, no library. Plain script, exposes window.FX.
 */
(function () {
  const COLORS = ['#e4322b', '#f5841f', '#f9d71c', '#4aa84a', '#37b3e3', '#5c3ba6', '#d63d8a'];
  let layer = null;

  function getLayer() {
    if (layer) return layer;
    layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:40';
    document.body.appendChild(layer);
    return layer;
  }

  /**
   * Burst confetti from viewport point (x, y).
   * opts.count   pieces (default 28)
   * opts.spread  distance in px (default 220)
   * opts.stars   add a few big stars too (default true)
   */
  function burst(x, y, opts) {
    opts = opts || {};
    const count = opts.count || 28;
    const spread = opts.spread || 220;
    const root = getLayer();
    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = (0.9 + Math.random() * 0.9) * vmin;
      const round = Math.random() < 0.4;
      p.style.cssText =
        'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + (round ? size : size * 0.6) + 'px;' +
        'background:' + COLORS[i % COLORS.length] + ';border-radius:' + (round ? '50%' : '20%') + ';' +
        'transform:translate(-50%,-50%);will-change:transform,opacity';
      root.appendChild(p);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const dist = spread * (0.5 + Math.random() * 0.6);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - spread * 0.35; // bias upward
      const fall = spread * (0.5 + Math.random() * 0.5);
      const spin = (Math.random() - 0.5) * 900;
      const dur = 900 + Math.random() * 500;

      p.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg) scale(0.6)', opacity: 1, offset: 0 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) rotate(' + spin / 2 + 'deg) scale(1)', opacity: 1, offset: 0.45 },
        { transform: 'translate(calc(-50% + ' + dx * 1.15 + 'px), calc(-50% + ' + (dy + fall) + 'px)) rotate(' + spin + 'deg) scale(0.9)', opacity: 0, offset: 1 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).onfinish = () => p.remove();
    }

    if (opts.stars !== false) {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('div');
        s.textContent = '★';
        s.style.cssText =
          'position:absolute;left:' + x + 'px;top:' + y + 'px;color:#f9d71c;font-size:' + (4 + Math.random() * 3) * vmin + 'px;' +
          'text-shadow:0 0 ' + vmin + 'px rgba(0,0,0,0.15);transform:translate(-50%,-50%);line-height:1;will-change:transform,opacity';
        root.appendChild(s);
        const angle = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
        const dist = spread * 0.9;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        s.animate([
          { transform: 'translate(-50%,-50%) scale(0.2) rotate(0deg)', opacity: 0, offset: 0 },
          { transform: 'translate(calc(-50% + ' + dx * 0.7 + 'px), calc(-50% + ' + dy * 0.7 + 'px)) scale(1.2) rotate(90deg)', opacity: 1, offset: 0.4 },
          { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + (dy + spread * 0.3) + 'px)) scale(0.8) rotate(200deg)', opacity: 0, offset: 1 }
        ], { duration: 1300 + i * 80, easing: 'ease-out', fill: 'forwards' }).onfinish = () => s.remove();
      }
    }
  }

  /** Burst from the centre of an element. */
  function burstFrom(el, opts) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  window.FX = { burst, burstFrom };
})();
