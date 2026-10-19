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
| Find Me | hear a number, tap the numeral | planned |
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
- `block-buddy/` — the sandbox: plus, minus, and a 1 to 20 keypad that builds the number while counting aloud.

## Design rules

- Big tap targets, tap only in quiz games. Drag is reserved for sandboxes where nothing can go wrong.
- No reading required. Every prompt is spoken.
- Wrong answers get a gentle retry, never a penalty. No timers until the arcade game.
- Celebrate the number, not a score.
- Teens are always shown as a ten plus some ones.
