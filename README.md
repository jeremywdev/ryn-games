# ryn-games

Small educational web games for Ryn to play on a touch-screen Chromebook.
Plain HTML, CSS and JavaScript. No build step, no dependencies, no accounts.

## Playing

Open `index.html` in Chrome, or serve the folder and bookmark it on the Chromebook:

```
python -m http.server 8000
```

then visit `http://<this-machine>:8000/`. GitHub Pages works too: enable it on the
`main` branch and the home screen is the repo root.

Tap the corner button on any game to go fullscreen. The house button goes home.

## Games

| Game | Teaches | Status |
| --- | --- | --- |
| Block Buddy | numeral to quantity, counting up and down, teens as "ten and some" | playable |
| Find Me | hear a number, tap the numeral; adapts to the numbers she misses | playable |
| Flash Count | see blocks, tap the numeral | planned |
| Make Me | build a target from smaller numbers (number bonds) | planned |
| Who's Taller | comparing | planned |
| Number Hop | number line, skip counting | planned |
| Blast Off | arcade sums (Math Blaster homage) | planned |

## Layout

- `index.html` — home screen with one picture tile per game.
- `shared/blocks.js` — draws any number 0 to 20 as a tower of blocks (Numberblocks style). Every game reuses this.
- `shared/audio.js` — speech via the Web Speech API plus synthesized pops and chimes. No audio files.
- `shared/base.css` — touch-first reset: no zoom, no text selection, big corner buttons.
- `shared/blocks.css` — the polished block look and the face, shared by every page.
- `shared/progress.js` — per-numeral memory in localStorage: first-try hits and misses per round, streaks, mix-ups, and which numbers get confused with which. Drives which numbers quiz games ask, which distractors appear, and when the range widens (1-5, then 1-10, then 1-20; it never narrows).
- `block-buddy/` — the sandbox: plus, minus, and a 1 to 20 keypad that builds the number while counting aloud.
- `find-me/` — a play button starts a set; the voice asks for a number and she taps it among three or four. A wrong tile fades out; after a second miss the target's blocks appear as a hint and the right tile bobs. Six rounds per set, then a celebration, with a bigger one when the range widens.

## Grown-up corner

Long-press the title on the home screen (or open `index.html?parent=1`) to see how she is doing on each number. Reset is a hold-to-confirm button and keeps one backup, so an accidental wipe can be undone. Progress lives only in that browser on that device.

## Dev shortcuts

- `block-buddy/?n=14` starts on a given number.
- `find-me/?demo=right` shows a solved round, `find-me/?demo=hint` a stuck round with the hint, `find-me/?demo=party` the end-of-set screen.

## Design rules

- Big tap targets, tap only in quiz games. Drag is reserved for sandboxes where nothing can go wrong.
- No reading required. Every prompt is spoken.
- Wrong answers get a gentle retry, never a penalty. No timers until the arcade game.
- Celebrate the number, not a score.
- Teens are always shown as a ten plus some ones.
