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
| Find Me | hear a number, or count a tower, and tap the numeral; adapts to the numbers she misses | playable |
| Make Me | build a target from smaller numbers (number bonds), counting on aloud; four levels up to teens | playable |
| Add Up | first addition and take-away: two towers merge into one, then numbers only, then take away | playable |
| Who's Taller | comparing | planned |
| Number Hop | number line, skip counting | planned |
| Blast Off | arcade sums (Math Blaster homage) | planned |

## Layout

- `index.html` — home screen with one picture tile per game.
- `shared/blocks.js` — draws any number 0 to 20 as a tower of blocks (Numberblocks style). Every game reuses this.
- `shared/audio.js` — speech via the Web Speech API plus synthesized pops and chimes. No audio files.
- `shared/base.css` — touch-first reset: no zoom, no text selection, big corner buttons.
- `shared/blocks.css` — the polished block look and the face, shared by every page.
- `shared/tap.js` — buttons fire on first contact, not on release, because small fingers drag after touching.
- `shared/fx.js` — confetti and stars for right answers.
- `shared/count.js` — lights blocks one at a time while saying their numbers; the "let's count" hint.
- `shared/progress.js` — per-numeral memory in localStorage: first-try hits and misses per round, streaks, mix-ups, and which numbers get confused with which. Drives which numbers quiz games ask, which distractors appear, and when the range widens (1-5, then 1-10, then 1-20; it never narrows on its own). A number is mastered after two first-try hits in a row.
- `block-buddy/` — the sandbox: plus, minus, and a 1 to 20 keypad that builds the number while counting aloud.
- `make-me/` — a target outline and a row of small towers; she taps parts into the outline while the voice counts on, and the parts become the whole number. Levels: make 2-5, make 6-10, make ten from a start, make a teen from ten. Five clean rounds advance a level.
- `add-up/` — "three and four make how many?" She taps the answer and the second tower hops onto the first, becoming one number. Levels: totals to 10 with blocks, totals 11-20, numbers only (blocks appear after a miss), and take away (blocks pop off, how many are left). A second miss counts the blocks aloud. Five clean rounds advance a level.
- `find-me/` — levels: hear it (the voice says a number), see blocks (a tower is shown and no number is spoken), or both mixed. Eight clean rounds advance a level. A play button starts a set; she taps the answer among three or four. A wrong tile fades out; after a second miss the target's blocks appear as a hint and the right tile bobs. Six rounds per set, then a celebration, with a bigger one when the range widens.

## Grown-up corner

Long-press the title on the home screen (or open `index.html?parent=1`) to see how she is doing on each number and to set each game's range or level. Reset is a hold-to-confirm button and keeps one backup, so an accidental wipe can be undone. Progress lives only in that browser on that device.

The same screen has a voice picker. The games default to the most natural voice Chrome offers (Google's online voices when available, falling back to the on-device voice if the network one fails). Pick a voice, tap "Try it", and the choice is saved on that device.

## Dev shortcuts

- `block-buddy/?n=14` starts on a given number.
- `find-me/?demo=right` shows a solved round, `find-me/?demo=hint` a stuck round with the hint, `find-me/?demo=party` the end-of-set screen.
- `make-me/?level=3` forces a level; `make-me/?demo=mid|done|party` freezes a state.
- `find-me/?level=2` forces the see-blocks level.
- `add-up/?level=4` forces a level; `add-up/?demo=fresh|hint|done|party` freezes a state.

## Design rules

- Big tap targets, tap only in quiz games. Drag is reserved for sandboxes where nothing can go wrong.
- No reading required. Every prompt is spoken.
- Wrong answers get a gentle retry, never a penalty. No timers until the arcade game.
- Celebrate the number, not a score.
- Teens are always shown as a ten plus some ones.
