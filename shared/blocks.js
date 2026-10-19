/*
 * Shared block engine for ryn-games.
 * Draws a number as a tower of blocks in the Numberblocks style:
 *   1-10  -> one column, colored for that number (7 is a rainbow)
 *   11-19 -> a white column of ten plus a colored column for the ones
 *   20    -> two white columns of ten
 * The top block of the first column gets a face.
 *
 * Plain script, exposes window.Blocks. No dependencies.
 */
(function () {
  const COLORS = {
    1: '#e4322b', // red
    2: '#f5841f', // orange
    3: '#f9d71c', // yellow
    4: '#4aa84a', // green
    5: '#37b3e3', // light blue
    6: '#5c3ba6', // indigo
    8: '#d63d8a', // magenta
    9: '#8c8c8c', // grey
    10: '#f7f7f7' // white
  };
  const RAINBOW = ['#e4322b', '#f5841f', '#f9d71c', '#4aa84a', '#37b3e3', '#5c3ba6', '#9b4dcf'];

  const WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen', 'twenty'
  ];

  /** Main display color for a whole number (used for numerals and keypad). */
  function numberColor(n) {
    if (n <= 0) return '#bbbbbb';
    if (n <= 10) return n === 7 ? RAINBOW[3] : COLORS[n];
    return COLORS[10];
  }

  /** Color of the ones part of a teen (11-19), or null. */
  function onesColor(n) {
    if (n > 10 && n < 20) return numberColor(n - 10);
    return null;
  }

  /** Color of block `row` (0 = bottom) inside a column that represents `colN` (1-10). */
  function blockColor(colN, row) {
    if (colN === 7) return RAINBOW[row % 7];
    return COLORS[colN];
  }

  /** Columns for a number: array of column sizes, tens first. */
  function columns(n) {
    if (n <= 0) return [];
    if (n <= 10) return [n];
    const cols = [];
    let rem = n;
    while (rem > 10) { cols.push(10); rem -= 10; }
    if (rem > 0) cols.push(rem);
    return cols;
  }

  function isLight(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }

  function makeFace() {
    const face = document.createElement('div');
    face.className = 'face';
    face.innerHTML =
      '<div class="eye left"><div class="pupil"></div></div>' +
      '<div class="eye right"><div class="pupil"></div></div>' +
      '<div class="mouth"></div>';
    return face;
  }

  /**
   * Render number `n` into `container`.
   * opts.pop  -> global index (0-based from the bottom of column 0) of a block
   *              that should play its pop-in animation. -1 for none.
   */
  function render(container, n, opts) {
    opts = opts || {};
    const pop = typeof opts.pop === 'number' ? opts.pop : -1;
    container.innerHTML = '';
    container.classList.toggle('empty', n <= 0);

    const cols = columns(n);
    let globalIndex = 0;
    cols.forEach((count, c) => {
      const col = document.createElement('div');
      col.className = 'col';
      for (let row = 0; row < count; row++) {
        const block = document.createElement('div');
        block.className = 'block';
        const color = blockColor(count, row);
        block.style.setProperty('--c', color); // blocks.css derives the cube faces from --c
        if (isLight(color)) block.classList.add('light');
        if (globalIndex === pop) block.classList.add('pop');
        if (c === 0 && row === count - 1) block.appendChild(makeFace());
        col.appendChild(block);
        globalIndex++;
      }
      container.appendChild(col);
    });

    if (n <= 0) {
      const ghost = document.createElement('div');
      ghost.className = 'col';
      const g = document.createElement('div');
      g.className = 'block ghost';
      ghost.appendChild(g);
      container.appendChild(ghost);
    }
  }

  /** Phrase to say when a number is reached, with the teen "ten and x" treatment. */
  function phrase(n) {
    if (n === 20) return 'Twenty! Two tens.';
    if (n > 10) return WORDS[n] + '! Ten and ' + WORDS[n - 10] + '.';
    return WORDS[n] + '!';
  }

  window.Blocks = { COLORS, RAINBOW, WORDS, numberColor, onesColor, blockColor, columns, render, phrase, isLight };
})();
