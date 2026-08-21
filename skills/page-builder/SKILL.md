# page-builder — SKILL.md

Build single-file HTML/CSS/JS pages in The Boring Tek terminal style. Black-ish
background, monospace, phosphor glow, no frameworks, no dependencies.

This file is the source of truth for how pages look and are built. Don't invent tokens
outside it.

The reference is a real CRT terminal in a dark room, not a retro filter. Depth,
phosphor bloom, grain, a slow vignette. Modern rendering, old hardware feel.

## Non-negotiables

- **One file.** HTML, CSS (one `<style>`) and JS (one `<script>`) in the same `.html`.
  No external files.
- **Zero dependencies.** No npm, no build step, no framework, no CSS library, no icon
  library, no CDN scripts.
- **Exactly one external request: Michroma from Google Fonts.** Nothing else leaves the
  page — no fetch, no other assets, no analytics, no trackers. Inline `data:` URIs are
  fine, they ship in the file. See Type → Display face for the exact tags.
- **No second webfont.** Michroma is the only face we load, ever. Body and UI text use
  the system monospace stack.
- **JS is optional.** If the page works without it, ship it without it. Everything JS
  adds here is decoration layered on top of a page that already reads.
- **Inline SVG** for graphics, `currentColor` for strokes and fills. No image files
  unless agreed first.
- **One `<canvas>` maximum**, and only when it earns its place (see Canvas).
- `index.html` stays in the repo root.

## Color — phosphor palette

Tuned phosphor, not screen primaries. Every green is desaturated and shifted off the
sRGB corner so it reads as emitted light rather than a CSS keyword.

```
/* surface */
--bg        #06070a   page base. near-black, faint cool cast. never #000.
--bg-lift   #0b0d12   raised blocks, cards, code boxes
--line      #1a1e26   borders, rules, dividers
--dim       #2b323d   decorative characters, ascii art, disabled

/* text */
--text      #d5dbd8   body
--muted     #6d7680   secondary text, labels, timestamps

/* phosphor green (P1) — core brand */
--p-100     #d6ffe6   hot core / highlight
--p-300     #7cf5a8   hover, emphasis
--p-500     #35ff6a   THE green. links, prompts, caret.
--p-700     #17a34f   borders, underlines, dimmed state
--p-900     #0a3d21   glow floor, tinted backgrounds

/* phosphor amber (P3) — status, warnings, secondary accent */
--a-300     #ffd79a
--a-500     #ffb340
--a-700     #a86a12

/* alarm */
--red       #ff5c5c   errors only. never decorative.

--white     #f4f7f5   wordmark and hero only
```

Rules:

- **Never a default CSS color.** No `green`, `red`, `white`, `black`, `lime`,
  `#000`, `#fff`. Tokens only.
- **Never `#00ff00`** or any pure-primary lime. If it looks like a Matrix screensaver
  it's wrong.
- Base is `--bg`, never flat `#000` — the vignette and grain need something to sit on.
- One accent per screen region. Green is default; amber marks status or warning; never
  both on the same element.
- Red only means something is wrong.
- Contrast floor 4.5:1 for body text. `--muted` on `--bg` passes. `--dim` is
  decorative only, never for text that must be read.
- Glow is built from the phosphor ramp, never from `white` or from opacity on `--text`.

## Type

Two faces, and only two. **Michroma** for the headline, system monospace for
everything else. Never mix them within one element, and never add a third.

### Display face — Michroma

Michroma is the official headline face. Squared, industrial, wide — it matches the
logo. It is the **only** external request the page is allowed to make.

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&display=swap">
```

```css
--display: "Michroma", var(--mono);
```

- Headline / wordmark only. Never for body text, labels, sublines, buttons, nav or
  status tags — those stay `--mono`.
- **Michroma ships one weight: 400.** There is no bold, no italic, no variable axis.
  Never request extra weights in the URL, never fake bold with `font-weight: 700`
  (which triggers synthetic bold and smears the squared edges), never fake it with
  `-webkit-text-stroke`. The face reads heavy on its own — let it.
- `display=swap` is mandatory. The page must be complete and readable in the mono
  fallback before Michroma arrives.
- Michroma is **proportional**, which matters for decode — see Decode → Proportional
  faces. It also has no box-drawing glyphs, so the block cursor `▊` must be given
  `font-family: var(--mono)` explicitly or it falls back unpredictably.
- Letter-spacing `0`. Michroma is already wide; tightening it fights the design.
- Two network requests result from the one `<link>` — the CSS, then the WOFF2 from
  `fonts.gstatic.com`. That pair is the whole external budget. Nothing else.

### Mono stack

Everything that isn't the headline. Variable-capable faces first, static fallbacks
after; nothing is downloaded.

```css
--mono: ui-monospace, "Cascadia Code", "JetBrains Mono", "Roboto Mono",
        "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
```

### Fluid scale

All type uses `clamp()`. No breakpoint-swapped font sizes anywhere.

```css
--t-micro: clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem);   /* 11 → 12 */
--t-body:  clamp(0.8125rem, 0.77rem + 0.22vw, 0.9375rem); /* 13 → 15 */
--t-lead:  clamp(1rem, 0.92rem + 0.42vw, 1.25rem);        /* 16 → 20 */
--t-sub:   clamp(1.25rem, 1rem + 1.25vw, 2rem);           /* 20 → 32 */
```

- **Hero caps at `2.75rem` (44px).** One elegant centred line with air around it, not
  wall to wall. Bigger stops reading as confident and starts reading as comic. Never
  raise the cap — the restraint is the brand.
- The cap is **uniform**: `2.75rem` on desktop and in the stacked mobile lockup alike.
  No separate mobile cap. Below ~400px the fit-to-width divide takes over anyway.
- Line height: `1.65` body, `1.35` sub, `1.04` hero (Michroma has tall metrics).
- Letter-spacing: `0` body, `0` hero, `0.16em` on uppercase labels.
- Max line length `68ch`. Long paragraphs are wrong here — write short lines.
- Copy is lowercase by default. Uppercase is for labels, status tags, and the
  Michroma headline.

### Fit-to-width sizing

Single-line text that must never wrap or overflow — the headline, a subline — is sized
from the space available and the number of character units it needs, not from a guessed
`vw` slope. Divide, then cap:

```css
/* headline: --units is set by JS from measured glyph metrics */
.hero{ font-size: min(2.75rem, calc(min(100vw - 44px, 90vw) / var(--units))); }

/* subline: 39 chars of mono ≈ 26 units, incl. letter-spacing and safety margin */
.tag{ white-space: nowrap; font-size: min(.75rem, calc((100vw - 44px) / 26)); }
```

- `44px` covers the `16px` side padding plus scrollbar slack. Don't shave it.
- The headline carries a second `90vw` term. The cap creates the air at desktop widths,
  but between roughly `640px` and `720px` the cap hasn't taken over yet and the raw
  divide would run the wordmark edge to edge. `90vw` holds a margin through that band.
- Any element carrying `white-space: nowrap` **must** be sized this way. Nowrap without
  fit-sizing doesn't prevent wrapping, it converts wrapping into horizontal overflow,
  which `overflow-x: hidden` then silently clips.
- Estimate mono units as `chars × 0.63` (advance plus letter-spacing, worst-case face).
  Round up. A subline that fits with 2px to spare on one machine wraps on another.
- Register `--units` with `@property { syntax: '<number>' }` so the division resolves.

### The lockup

Headline and subline are **one composed block**, not two elements that happen to sit
near each other. They go in a single wrapper, and that wrapper is what gets centred.

```css
.wrap{ min-height:100dvh; display:flex; justify-content:center; align-items:center }
.lockup{
  display:flex; flex-direction:column; align-items:center;
  gap:clamp(7px,1.3vh,13px);
  max-width:100%;
}
```

- **One child in `.wrap`.** Centring the group is the point; centring three siblings
  with a shared gap makes them read as separate floating pieces.
- Gap between headline and subline is **tight** — `7`–`13px`. It should read as a
  lockup, close enough that the eye takes both in at once.
- Never put a `gap` on `.wrap` itself. It has one child.
- Anything else that belongs to the headline — a status tag, a fallback line — goes
  inside `.lockup` too, so the reduced-motion and no-JS views stay composed.
- The hero already has `line-height: 1.04`, so there is almost no leading under the
  wordmark. Don't add more gap to compensate for leading that isn't there.

### The stacked lockup (under 640px)

Below `640px` the wordmark breaks into three centered lines — **THE / BORING / TEK** —
matching the logo lockup. Above it, one line.

- The break is a **layout mode**, not a font-size tweak. Same markup, same cells, same
  decode; only the line split and `--units` change.
- `--units` is recomputed from the longest *line* (6, for `BORING`), not the longest
  string — that's what lets the stacked lockup run much larger than the single line.
- `COMING SOON` splits to **COMING / SOON**, deliberately: `COMING` is also 6
  characters, so both words share one cell grid and one `--units`.
- **Always render three line boxes**, even when a word only fills two. Give `.ln` a
  `min-height` of one line so an empty third line still holds its space — otherwise the
  block changes height every time the words swap and everything below it jumps.
- The block cursor sits on the **last line that has content** — line 3 for the
  wordmark, line 2 for `COMING SOON`. One caret visible at a time, never three.
- The hidden sizer needs the same three-line shape, each line padded to the longest
  line's cell count, so the track width is identical in both words.
- Decode spans the whole lockup from one schedule — flatten all three lines into a
  single character list, shuffle that, then split the output back per line. Three
  independent per-line decodes read as three separate events.

### Subline typing

The subline types itself out **once**, after the headline's first decode resolves, then
stays static forever.

- One-shot only. Never on a loop, never re-triggered on the headline's later cycles.
- Driven from the same shared rAF loop as the decode. Per-character thresholds with
  jitter, ~1150ms total — jitter is what stops it reading as a metronome.
- A small caret trails the text while typing and is **removed** when it finishes. Two
  permanently blinking carets on one page is noise.
- Typing must not move anything. Pin the width with a hidden full-text sizer, then let
  the live text grow left-to-right inside that fixed box, with the caret absolutely
  positioned at `left: 100%` so it never contributes width.
- The full text lives in the DOM for the no-JS and reduced-motion cases. JS blanks it
  as its first act and restores it when typing starts — so it must run before first
  paint, or the full string flashes.

### Variable weight animation

**Not available on the headline.** Michroma is single-weight, so the headline's settle
beat and hover response ride on `--glow` alone. This section applies only to mono
elements — a status tag, a nav item, a mono wordmark.

Weight moves. It moves on **discrete events** — entrance, hover, decode settle — never
as an ambient loop.

```css
.wordmark{
  font-variation-settings: "wght" var(--wght, 380);
  font-weight: 400;                 /* static fallback */
  transition: font-variation-settings 420ms cubic-bezier(.16,1,.3,1);
  /* reflow containment — see below */
  inline-size: max-content;
  contain: layout style;
  font-variant-numeric: tabular-nums;
}
.wordmark:hover{ --wght: 680; }
```

Hard constraints, because weight animation is the one thing here that *does* touch
layout:

- Only on **short, isolated elements**: the wordmark, hero line, a nav item, a status
  tag. **Never** on body text, never on a paragraph, never on a list.
- The element must be layout-contained — `inline-size: max-content` plus
  `contain: layout style`, or absolutely positioned. Text after it must not reflow.
- Range `300`–`700`. Below 300 it disappears against the glow, above 700 monospace
  faces get muddy.
- Feature-detect before relying on it visually:

```js
const VF = CSS.supports('font-variation-settings', '"wght" 500');
document.documentElement.classList.toggle('vf', VF);
```

  `@supports` tests the *property*, not whether the resolved face is actually
  variable. So the static `font-weight` fallback must look finished on its own. Weight
  animation is decoration; it never carries information.

## Depth — the background is not flat

Three stacked layers behind everything. All fixed, all `pointer-events: none`, all
`aria-hidden="true"`.

### 1. Base

`--bg` on `body`. That's it.

### 2. Vignette — slow radial breathe

An off-center radial that keeps the corners heavy and the hero area slightly lifted.

```css
.vignette{
  position:fixed; inset:-10%; z-index:0; pointer-events:none;
  background:
    radial-gradient(120% 90% at 50% 18%, rgba(53,255,106,.055) 0%, transparent 58%),
    radial-gradient(140% 120% at 50% 45%, transparent 32%, rgba(3,4,6,.72) 100%);
  will-change: transform, opacity;
  animation: breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate;
}
@keyframes breathe{
  from{ transform: scale(1)     translate3d(0,0,0); opacity:.88 }
  to  { transform: scale(1.045) translate3d(0,-1.2%,0); opacity:1 }
}
```

- `alternate` + eased, never `linear`. It should never be consciously noticeable.
- Animate `transform` and `opacity` only. Never the gradient stops.

### 3. Grain

Barely visible. If a reviewer can point at individual noise pixels, halve the opacity.

Inline SVG turbulence as a `data:` URI, shifted in steps so it jitters like film rather
than sliding:

```css
.grain{
  position:fixed; inset:-150px; z-index:1; pointer-events:none;
  opacity:.038;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
  will-change: transform;
  animation: grainshift 7s steps(1,end) infinite;
}
@keyframes grainshift{
  0%  { transform: translate3d(0,0,0) }
  14% { transform: translate3d(-3%,-2%,0) }
  28% { transform: translate3d(2%,-4%,0) }
  42% { transform: translate3d(-1%,3%,0) }
  57% { transform: translate3d(3%,1%,0) }
  71% { transform: translate3d(-2%,2%,0) }
  85% { transform: translate3d(1%,-3%,0) }
}
```

- Opacity range `.03`–`.05`. Never above `.06`.
- `steps()` here is deliberate — grain jitters, it does not glide. This is the one
  place stepped timing is correct.
- Inset is oversized so the translate never exposes an edge.
- Canvas noise is an acceptable alternative if you're already spending the canvas
  (see Canvas) — otherwise use this, it costs nothing.

Content sits at `z-index: 2` above all three.

## Glow — layered, not one shadow

A single `text-shadow` reads as a cheap CSS trick. Real phosphor bloom is a tight core,
a mid halo, and a wide diffuse wash. Build three layers.

```html
<h1 class="glow" data-glow>
  <span class="glow__blur" aria-hidden="true">the boring tek</span>
  <span class="glow__bloom" aria-hidden="true">the boring tek</span>
  <span class="glow__core">the boring tek</span>
</h1>
```

```css
.glow{ position:relative; isolation:isolate; --glow:1; }
.glow > span{ grid-area:1/1; display:block }
.glow{ display:grid }

/* layer 1 — core text + tight shadow stack */
.glow__core{
  z-index:3; color:var(--white);
  text-shadow:
    0 0 1px  rgba(53,255,106,.55),
    0 0 6px  rgba(53,255,106,.34),
    0 0 18px rgba(53,255,106,.20),
    0 0 44px rgba(23,163,79,.14);
}
/* layer 2 — blurred duplicate, mid halo */
.glow__blur{
  z-index:2; color:var(--p-500);
  filter: blur(10px);
  opacity: calc(.42 * var(--glow));
  will-change: opacity;
}
/* layer 3 — wide diffuse bloom */
.glow__bloom{
  z-index:1; color:var(--p-700);
  filter: blur(38px);
  opacity: calc(.30 * var(--glow));
  will-change: opacity;
}
```

Rules:

- **Never animate `filter: blur()` radius.** That re-rasterizes every frame. Animate
  the layer's `opacity` (and `transform` if it needs to drift). The radius is set once.
- All three duplicates are `aria-hidden` — a screen reader must hear the string once.
- Duplicates must be laid over the core exactly. Use the `display:grid` +
  `grid-area:1/1` stack above; absolute positioning drifts between font stacks.
- `--glow` is the single knob everything else drives — proximity, entrance, focus.
  Nothing else touches those opacities.
- Glow intensity scales down as the element gets smaller. Body-size text gets the core
  shadow stack only, no blur duplicates.
- Drop `will-change` once the entrance finishes (`el.style.willChange = 'auto'`).
  Persistent `will-change` on many elements costs more than it saves.

## Decode animation

Text resolves as if the terminal is locking onto a signal. Eased, rhythmic, weighted
toward the end — never a fixed-interval tick.

Rules:

- Driven by `requestAnimationFrame`. **Never `setInterval`**, never a constant
  ms-per-character.
- **The easing lives on the reveal schedule, not on progress.** Compare linear elapsed
  time against per-character thresholds spread by a power curve. Easing progress
  instead (e.g. `easeOutExpo` against evenly-spread thresholds) front-loads so hard
  that every glyph lands in the first third and the rest of the window is dead air
  before the settle beat.
- Characters resolve in a scrambled order, not left to right.
- Per-character jitter so several land together and then a gap — that's the rhythm.
  Perfectly even resolution reads mechanical.
- Scramble glyphs come from a fixed set: `ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$*+<>/\|`
  — no emoji, no box-drawing.
- Total duration `900`–`1400ms`. Longer is self-indulgent.
- Ends on a **settle beat**: on completion `--glow` spikes and eases back over ~400ms.
  That single pulse is what sells it. (On mono elements `--wght` can spike with it;
  the Michroma headline has no weight axis, so glow carries it alone.)
- The final text must be in the DOM before JS runs, so the page reads with JS disabled.
  Decode overwrites it and restores it — never builds the copy from a JS string.

```js
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$*+<>/\\|';

// eased reveal schedule: dense at the start, gaps widening toward the end so the
// last glyph lands with the settle beat.
function schedule(target){
  const n = target.length, last = n > 1 ? n - 1 : 1;
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--){                 // Fisher-Yates, not sort(random)
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  const at = new Array(n);
  order.forEach((ci, i) => { at[ci] = Math.pow(i / last, 1.75) * .88 + Math.random() * .12; });
  return at;
}

// inside the shared rAF loop:
const p = Math.min((now - t0) / DUR, 1);           // linear time, eased thresholds
let out = '';
for (let i = 0; i < target.length; i++){
  const c = target[i];
  out += (c === ' ' || p >= at[i]) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
}
```

Expected landing pattern for a 14-glyph string over 1150ms — clusters and pauses, not
a metronome:

```
0ms:1  84:2  100:3  117:4  134:5  334:6  401:7  618:8  701:9  902:10 …
```

### Proportional faces — the fixed-cell grid

Michroma is proportional, so scrambling raw text changes the string's width every
frame and the centered headline wobbles horizontally. Monospace hid this problem;
Michroma does not. Fix it with a fixed cell per glyph:

- Measure once, after `document.fonts.load('400 1em Michroma')` resolves, using a
  canvas `measureText` pass over every glyph that can appear (scramble set + all
  words). Take the **widest**, express it in `em`, set it as `--cw`.
- Wrap each character in `<span class="c">` with
  `display:inline-block; width:var(--cw); text-align:center`. Every glyph now occupies
  an identical advance, so the string width depends only on character *count*.
- Build the cells in JS and only then add the `.grid` class. The plain-text fallback in
  the DOM stays correct with JS off.
- Repaint only cells whose glyph actually changed — track the previous string in JS and
  diff. Never read `textContent` back to compare.
- Words of different lengths still change the count, so the hidden sizer element must
  hold the **longest** word's cell count to pin the track width. Shorter words then
  centre inside a track that never resizes.
- Derive `--units` for the fit-to-width formula from the same measurement:
  `cells × cw + caretWidth + slack`.

If the element uses the three-layer glow stack, decode all layers in lockstep from one
rAF loop — never three independent loops. The widest bloom layer can hold the target
string statically through the decode; at `blur(.2em)` it's an amorphous mass, and
keeping it off the per-frame repaint path saves the most expensive re-raster.

## Micro-interactions

### Cursor proximity (desktop only)

The headline reacts to the pointer approaching — brighter, very slightly displaced. It
is felt, not watched.

- **Pointer-gated:** only under `@media (hover:hover) and (pointer:fine)`. Never on
  touch.
- `pointermove` writes to variables only. All DOM/style writes happen in one shared
  `requestAnimationFrame`. Never style inside the event handler.
- Never read layout in the loop. Cache `getBoundingClientRect()` on load, `resize`
  (debounced) and `scrollend`. Reading rects per-frame is the layout thrash this whole
  section exists to prevent.
- Effect is driven by one falloff value `--prox` (`0..1`), eased, and lerped toward its
  target so it glides instead of snapping:

```js
const el = document.querySelector('[data-glow]');
let rect = el.getBoundingClientRect();
let mx = 0, my = 0, prox = 0, target = 0;
addEventListener('resize', () => { rect = el.getBoundingClientRect(); }, {passive:true});

addEventListener('pointermove', e => {
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const d = Math.hypot(e.clientX - cx, e.clientY - cy);
  const r = Math.max(rect.width, 520);
  target = Math.max(0, 1 - d / r);              // linear falloff
  target *= target;                              // eased — tightens near the element
  mx = (e.clientX - cx) / rect.width;
  my = (e.clientY - cy) / rect.height;
}, {passive:true});

(function loop(){
  prox += (target - prox) * .09;                 // lerp, no snap
  el.style.setProperty('--prox', prox.toFixed(3));
  el.style.setProperty('--mx', mx.toFixed(3));
  el.style.setProperty('--my', my.toFixed(3));
  requestAnimationFrame(loop);
})();
```

```css
.glow{
  --glow: calc(1 + var(--prox, 0) * .85);        /* brighten */
  transform: translate3d(
    calc(var(--mx, 0) * var(--prox, 0) * 6px),
    calc(var(--my, 0) * var(--prox, 0) * 4px), 0);
}
.glow__core{ /* optional: weight lift, layout-contained element only */
  --wght: calc(380 + var(--prox, 0) * 180);
}
```

- Maximum displacement `8px`. This is a lean, not a parallax card.
- Never skew, never rotate, never scale the headline on proximity.
- One proximity-reactive element per page. Two competes for attention.

### Everything else

- Links: `--p-500`, `1px` underline in `--p-700`; on hover the underline goes
  `--p-500` and the core shadow tightens. No color change.
- Buttons: `1px solid var(--p-700)`, transparent fill, `--p-500` text, square corners.
  Hover fills `rgba(53,255,106,.07)` and lifts glow. Active `translate3d(0,1px,0)`.
- Cursor stays default. No custom cursors.
- Tap targets minimum `44px` on mobile.
- Focus: `outline: 1px solid var(--p-500); outline-offset: 3px;` — visible, never
  removed. Focus also raises `--glow`, so keyboard users get the same feedback pointer
  users get.

## Canvas

**One** `<canvas>` per page, maximum, and only when CSS genuinely can't do it — a
particle field, drifting sparks, reactive noise. If it's a gradient, a vignette or
static grain, it is not a canvas job.

Non-negotiable if you spend it:

- `position:fixed; inset:0; z-index:1; pointer-events:none;` and `aria-hidden="true"`.
- DPR capped: `Math.min(devicePixelRatio, 2)`. Never render at 3x.
- Particle cap `120` desktop, `40` under 700px wide. Scale by viewport area, not by
  device guess.
- Pre-allocate the particle array once. **Zero allocation inside the frame loop** — no
  object literals, no `map`, no closures per particle.
- Pause on `document.hidden` (`visibilitychange`) and cancel the rAF. Don't burn a
  laptop battery in a background tab.
- Skip entirely under `prefers-reduced-motion: reduce`, and skip on
  `navigator.hardwareConcurrency <= 4` — degrade to the CSS grain layer.
- Never resize the canvas inside the loop. Resize on a debounced `resize` handler.
- No `shadowBlur` in a per-frame loop — it's the single most expensive canvas
  operation. Use pre-rendered sprites or `globalCompositeOperation:'lighter'` for glow.
- If it isn't visibly better than the CSS layers, delete it.

## Motion budget

Three tiers. Each has its own rules; don't mix them.

| Tier | What | Duration | Easing |
|---|---|---|---|
| Ambient | vignette breathe, grain, canvas drift | 7–40s | eased `alternate`, or stepped for grain |
| Entrance | decode, fade-ups, settle pulse | 900–1400ms | `cubic-bezier(.16,1,.3,1)` |
| Interactive | hover, focus, proximity, press | 120–260ms | `ease-out` |

Universal:

- **`transform` and `opacity` only.** Never animate `width`, `height`, `top`, `left`,
  `margin`, `padding`, `font-size`, `filter` radius, or gradient stops.
  `font-variation-settings` is the one exception, under the containment rules above.
- Every animated element gets `translate3d(0,0,0)` or an explicit compositing hint —
  and `will-change` is removed once the animation is done.
- No `linear` on anything that loops. Stepped grain is the sole exception.
- No infinite spins, no infinite rotations, no rotating logos, no orbiting rings.
- Nothing that moves forever at a constant rate. Ambient motion breathes; it does not
  tick.
- No scroll-jacking, no parallax, no scroll-triggered reveal chains. One entrance, then
  the page is still.
- One `requestAnimationFrame` loop for the whole page. Decode, proximity and canvas
  share it. Multiple rAF loops fight for frame budget.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` must:

- Kill grain and vignette animation (layers stay, static).
- Skip decode — render final text immediately, no scramble.
- Disable proximity entirely.
- Skip canvas init.
- Keep hover/focus feedback, but instant.

This is a real branch in the JS, not just a CSS override:

```js
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
```

## Layout

- Max width `900px`, centered, `20px` side padding (`16px` under 480px). The hero sizes
  itself to fit the viewport (see Fit-to-width sizing) and caps at `2.75rem`.
- Spacing scale, nothing between: `4 8 12 16 24 32 48 64 96 128`.
- Left-aligned. Centered text only for a hero.
- Borders `1px solid var(--line)`. **Zero border radius everywhere.** No rounded
  corners, no pills.
- No box shadows. Depth comes from the glow and vignette layers, never from a drop
  shadow on a card.
- Fluid-first: `clamp()`, `min()`, `max()` and intrinsic sizing over breakpoints. One
  `@media (min-width: 720px)` for structural layout changes only. Two breakpoints
  maximum.

## Mascot — favicon only

A minimal pixel bot. **Square head outline, two green pixel eyes, nothing else.** No
mouth, no body, no antenna, no arms, no shading. It is a presence indicator, not a
character.

**It is not rendered in the page.** The mascot lives in the browser tab and nowhere
else — no hero mark, no header logo, no footer bug, no loading state. The page carries
the wordmark; the tab carries the mascot. Keep them separate.

The full 12×12 drawing below is the canonical mark. It is kept here because it is the
source the favicon is cut from, and because anything that ever needs the mascot outside
a browser tab — social avatar, printed mark — must match these numbers exactly. Adding
it back into a page needs a decision from Einz first.

```html
<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
  <defs>
    <filter id="eyeglow" x="-150%" y="-150%" width="400%" height="400%">
      <feGaussianBlur stdDeviation=".7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path class="frame" d="M1 0h10v1H1zM1 11h10v1H1zM0 1h1v10H0zM11 1h1v10h-1z"/>
  <g class="eyes" filter="url(#eyeglow)">
    <rect x="3" y="5" width="2" height="2"/>
    <rect x="7" y="5" width="2" height="2"/>
  </g>
</svg>
```

```css
.frame{fill:var(--dim)}
.eyes{fill:var(--p-500);animation:eyeblink 5.2s step-end infinite}
@keyframes eyeblink{0%{opacity:1}96.4%{opacity:.05}97.8%{opacity:1}}
```

Geometry — do not redraw it by eye, these numbers are the mascot:

- **Head:** four 1-unit bars forming a square ring, with all four **corner pixels
  omitted**. That bevel is what makes it read as pixel art instead of a CSS border.
  Never close the corners, never round them, never thicken the outline past 1 unit.
- **Eyes:** two 2×2 squares at `(3,5)` and `(7,5)`. Two units of margin either side,
  two units between them, exactly centred in the head both ways. Never one eye, never
  three, never different sizes.
- **Glow:** an SVG `feGaussianBlur` merged twice under the source — the same
  layered-glow principle as the headline, in user units so it scales with the icon.
  Never a CSS `drop-shadow()` on an SVG child; length units there resolve differently
  across browsers and the glow comes out wildly wrong.

Blink — **only applies if the mascot is ever rendered live.** A favicon does not
animate, so on the site today this is dormant. If it does get used somewhere:

- Both eyes together, going dark for **one perceptual frame** (~70–90ms) every ~5s.
  `step-end` — the eyes snap off and snap back. Never fade, never wink one eye, never
  animate a lid.
- Dark, not gone: `opacity: .05`, so they read as unlit pixels rather than a hole.
- No idle bobbing, no rotation, no scanning-eye movement, no colour cycling. The blink
  is the *only* thing the mascot ever does.

Favicon — the mascot's only home:

- Generated from the same mascot, as an inline `data:` URI in `<link rel="icon">` —
  never a separate file.
- **Eyes only** on a `--bg` square. The head outline turns to mush at 16px, so it is
  dropped; the eyes are the recognisable part.
- Eyes scale up to 3×3 on the 12×12 grid at `(2,4)` and `(7,4)` so they stay legible in
  a tab strip.
- Encode `#` as `%23` in the URI or the whole thing silently fails.

```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' shape-rendering='crispEdges'%3E%3Crect width='12' height='12' fill='%2306070a'/%3E%3Crect x='2' y='4' width='3' height='3' fill='%2335ff6a'/%3E%3Crect x='7' y='4' width='3' height='3' fill='%2335ff6a'/%3E%3C/svg%3E">
```

## Terminal texture

Use sparingly — one or two per page, not all of them.

- **Prompt lines:** `>` or `boringtek:~$` in `--p-500` before a line.
- **Blinking caret:** `▊` after the hero line, `1.05s step-end infinite`. Off under
  reduced motion.
- **Section labels:** uppercase, `--muted`, letter-spaced — `// SERVICES` or
  `[ 01 ] SERVICES`. Pick one convention per page and hold it.
- **Rules:** a `1px` `--line` divider, or a row of `─` in `--dim`.
- **Status tags:** `[ONLINE]` green, `[BOOTING]` amber. Bracketed, uppercase.
- **ASCII art:** wordmark only, `--dim` or `--p-700`, in `<pre>` with
  `aria-hidden="true"` and a real text alternative nearby.

## Copy rules

- Lowercase. Short lines. Full stops.
- Say what it does. Banned: leverage, empower, solutions, synergy, seamless,
  cutting-edge, revolutionize, unlock, transform your business, next-generation.
- No emoji. No exclamation marks. No rhetorical questions in headings.
- No invented clients, metrics, headcounts or testimonials.
- Dry and deadpan beats clever.

## Accessibility

- `<html lang="en">`, one `<h1>`, headings in order, semantic `<header>`/`<main>`/
  `<footer>`.
- Decorative layers (grain, vignette, canvas, glow duplicates, ascii) are all
  `aria-hidden="true"`. A screen reader hears the headline exactly once.
- Decode must not break the accessible name — restore original `textContent` on
  completion, and never decode inside a live region.
- Every interactive element reachable and visible on keyboard focus.
- Page must be readable with CSS disabled and with JS disabled.
- Glow must never be the only thing distinguishing a state. Contrast carries it.

## Page skeleton

`index.html` in the repo root is the reference implementation of every rule in this
file — the Michroma cell grid, the decode loop, the glow stack, the depth layers. Read
it before building a new page; copy from it rather than from memory.

Start from this. Fill in, don't restructure.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THE BORING TEK</title>
<meta name="description" content="custom ai agents, backend infrastructure, workflow automation.">
<meta name="color-scheme" content="dark">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&display=swap">
<style>
  @property --prox{syntax:'<number>';inherits:true;initial-value:0}
  @property --beat{syntax:'<number>';inherits:true;initial-value:0}
  @property --mx{syntax:'<number>';inherits:true;initial-value:0}
  @property --my{syntax:'<number>';inherits:true;initial-value:0}
  @property --units{syntax:'<number>';inherits:true;initial-value:15.5}
  :root{
    --bg:#06070a; --bg-lift:#0b0d12; --line:#1a1e26; --dim:#2b323d;
    --text:#d5dbd8; --muted:#6d7680; --white:#f4f7f5;
    --p-100:#d6ffe6; --p-300:#7cf5a8; --p-500:#35ff6a; --p-700:#17a34f; --p-900:#0a3d21;
    --a-300:#ffd79a; --a-500:#ffb340; --a-700:#a86a12;
    --red:#ff5c5c;
    --mono: ui-monospace,"Cascadia Code","JetBrains Mono","Roboto Mono","SF Mono","Cascadia Mono",Menlo,Consolas,monospace;
    --display: "Michroma", var(--mono);
    --t-micro: clamp(.6875rem,.66rem + .14vw,.75rem);
    --t-body:  clamp(.8125rem,.77rem + .22vw,.9375rem);
    --t-lead:  clamp(1rem,.92rem + .42vw,1.25rem);
    --ease: cubic-bezier(.16,1,.3,1);
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    background:var(--bg); color:var(--text);
    font:400 var(--t-body)/1.65 var(--mono);
    -webkit-font-smoothing:antialiased; overflow-x:hidden;
  }

  /* depth layers */
  .vignette,.grain{position:fixed;pointer-events:none}
  .vignette{
    inset:-10%; z-index:0;
    background:
      radial-gradient(120% 90% at 50% 18%, rgba(53,255,106,.055) 0%, transparent 58%),
      radial-gradient(140% 120% at 50% 45%, transparent 32%, rgba(3,4,6,.72) 100%);
    animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate;
  }
  @keyframes breathe{
    from{transform:scale(1) translate3d(0,0,0);opacity:.88}
    to  {transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
  }
  .grain{
    inset:-150px; z-index:1; opacity:.038;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
    animation:grainshift 7s steps(1,end) infinite;
  }
  @keyframes grainshift{
    0%{transform:translate3d(0,0,0)}      14%{transform:translate3d(-3%,-2%,0)}
    28%{transform:translate3d(2%,-4%,0)}  42%{transform:translate3d(-1%,3%,0)}
    57%{transform:translate3d(3%,1%,0)}   71%{transform:translate3d(-2%,2%,0)}
    85%{transform:translate3d(1%,-3%,0)}
  }

  /* content — one lockup, centred as a group */
  .wrap{position:relative;z-index:2;min-height:100dvh;display:flex;
    justify-content:center;align-items:center;padding:48px 16px;text-align:center}
  .lockup{display:flex;flex-direction:column;align-items:center;
    gap:clamp(7px,1.3vh,13px);max-width:100%}
  @media (min-width:720px){.wrap{padding-inline:20px}}

  /* headline — fit-to-width, capped at 2.75rem; --units set by JS from metrics */
  .hero{display:grid;justify-content:center;margin:0;max-width:100%;
    font-size:min(2.75rem, calc(min(100vw - 44px, 90vw) / var(--units)));
    line-height:1.04;letter-spacing:0;contain:layout style;
    --glow:calc(1 + var(--prox) * .85 + var(--beat) * .7);
    transform:translate3d(calc(var(--mx)*var(--prox)*6px),calc(var(--my)*var(--prox)*4px),0);
  }
  .hero>span{grid-area:1/1;display:block;white-space:pre}
  .sizer{visibility:hidden}
  .layer{font-family:var(--display);font-weight:400}
  .grid .c{display:inline-block;width:var(--cw);text-align:center}
  .l-core{z-index:3;color:var(--white);
    text-shadow:0 0 .012em rgba(53,255,106,.58),0 0 .045em rgba(53,255,106,.34),
                0 0 .11em rgba(53,255,106,.20),0 0 .28em rgba(23,163,79,.14)}
  .l-mid {z-index:2;color:var(--p-500);filter:blur(.055em);opacity:calc(.42*var(--glow))}
  .l-wide{z-index:1;color:var(--p-700);filter:blur(.2em);opacity:calc(.30*var(--glow))}

  a{color:var(--p-500);text-decoration:underline;text-decoration-color:var(--p-700)}
  a:hover{text-decoration-color:var(--p-500)}
  :focus-visible{outline:1px solid var(--p-500);outline-offset:3px}
  .label{color:var(--muted);text-transform:uppercase;letter-spacing:.16em;font-size:var(--t-micro)}
  .caret{font-family:var(--mono);color:var(--p-500);animation:blink 1.05s step-end infinite}
  @keyframes blink{50%{opacity:0}}

  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation:none!important;transition:none!important}
    .hero{transform:none!important}
  }
</style>
</head>
<body>
  <div class="vignette" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <main class="wrap">
   <div class="lockup">
    <h1 class="hero">
      <span class="sr">the boring tek — coming soon</span>
      <!-- sizer, then l-wide / l-mid / l-core. EACH carries three .ln lines:
           <span class="ln"><span class="t">THE BORING TEK</span><span class="caret">&#9610;</span></span>
           <span class="ln"><span class="t"></span><span class="caret">&#9610;</span></span>
           <span class="ln"><span class="t"></span><span class="caret">&#9610;</span></span>
           Line 1 holds the whole string; lines 2-3 fill only in the stacked lockup.
           Copy the exact markup from index.html. -->
    </h1>
    <p class="tag">
      <span class="tag-size" aria-hidden="true">building the boring part of the future.</span>
      <span class="tag-live"><span class="tag-txt">building the boring part of the future.</span><span class="tag-caret" aria-hidden="true">&#9610;</span></span>
    </p>
   </div>
  </main>

<script>
  // Guard everything with REDUCED. Measure metrics after document.fonts.load
  // resolves, build the cell grid, then run ONE shared rAF loop for decode +
  // proximity. See index.html for the full implementation.
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>
</body>
</html>
```

## Not allowed

Original list, still in force:

- Fake typing animations that delay real content.
- Matrix rain.
- CRT curve distortion.
- Scanlines heavy enough to hurt readability.
- Terminal window chrome with traffic-light dots.
- Rounded corners, pills, gradients on text, glassmorphism, drop shadows on cards.
- Scroll-jacking, parallax, scroll-triggered reveal chains.
- Emoji anywhere in the UI.

Added:

- **Default CSS color keywords or shorthand hexes.** No `green`, `white`, `black`,
  `lime`, `#000`, `#fff`. Palette tokens only.
- **Pure `#00ff00`** or any unmodified sRGB primary. Phosphor ramp only.
- **Flat `#000` page background.** It has to have grain and a vignette on it.
- **Linear infinite anything** — spins, rotations, orbits, marquees, constant-rate
  drifts. Stepped grain is the only exception.
- **Comic effects** — bounce, elastic, squash-and-stretch, wobble, shake, jelly,
  confetti, springy overshoot easing. Nothing here is playful.
- **One cheap `text-shadow`** standing in for the layered glow.
- **Animated `filter: blur()` radius**, or any animation of a non-composited property.
- **Layout reads inside a rAF loop** (`getBoundingClientRect`, `offsetWidth`,
  `getComputedStyle`).
- **Multiple rAF loops** on one page.
- **More than one canvas**, or a canvas doing work CSS already does.
- **Ambient variable-weight loops** — weight moves on events, not on a timer.
- **Weight animation on body text** or any element that reflows its neighbours.
- **Decode on a `setInterval`** or at a constant ms-per-character.
- **Easing the decode's progress instead of its reveal schedule.** It front-loads every
  glyph into the first third and leaves dead air before the settle beat.
- **Glow as the only state indicator.** Contrast has to carry it too.

Added with Michroma:

- **Any second webfont**, any extra Michroma weight or style in the Google Fonts URL,
  any other external host. One `<link>`, one family, weight 400.
- **Self-hosting or inlining Michroma** as a base64 `data:` URI. It bloats the single
  file past any sane budget — use the Google Fonts link.
- **Synthetic bold on Michroma** — `font-weight: 700`, `-webkit-text-stroke`, or a
  duplicated offset layer faking heft. It has one weight; that's the design.
- **Michroma on body text, sublines, buttons, nav or status tags.** Headline only.
- **Decoding proportional text without the fixed-cell grid.** The headline width
  changes every frame and the whole line wobbles.
- **A headline above `2.75rem`.** It stops reading as confident and starts reading as
  comic.
- **`white-space: nowrap` without fit-to-width sizing.** That converts wrapping into
  clipped overflow, which is worse.
- **Blocking first paint on the font.** `display=swap` always; the page must be
  complete in the mono fallback.

Added with the mascot and the lockup:

- **Rendering the mascot in the page.** It is the favicon and nothing else — no hero
  mark, no header logo, no footer bug, no loading state. Putting it back on a page is
  Einz's call, not a build decision.
- **Giving the mascot a mouth, body, antenna, arms, feet, or shading.** Head outline
  and two eyes. That is the whole mascot.
- **Closed or rounded mascot corners**, an outline thicker than 1 unit, or redrawing it
  off-grid. The geometry in the Mascot section is the spec.
- **Any mascot motion other than the blink** — bobbing, floating, rotating, scanning
  eyes, colour cycling, eyes tracking the cursor.
- **Fading the blink or winking one eye.** It snaps, both eyes, `step-end`.
- **CSS `drop-shadow()` on an SVG child** for the eye glow — resolves inconsistently
  across browsers. Use the SVG filter.
- **A separate favicon file.** Inline `data:` URI, generated from the mascot.
- **A separate cap for the stacked mobile lockup.** `2.75rem` is uniform everywhere.
- **A `gap` on `.wrap`**, or headline and subline as loose siblings. One `.lockup`
  child, centred as a group.
- **Letting the stacked lockup collapse to two line boxes** when a word is two lines.
  Three boxes always, or the layout jumps on every swap.
- **Decoding the stacked lines independently.** One schedule across the whole lockup.
- **Looping or re-triggering the subline typing.** Once, after the first headline
  resolve, then static forever.
- **Leaving the subline's typing caret on screen** after it finishes.

## Before shipping

Visual:

- Renders correctly at 320px, 768px, 1440px and 2560px wide.
- Headline caps at 2.75rem on wide screens and stacks to three lines under 640px —
  check both, and drag across the 640px boundary to confirm the swap is clean.
- Headline has real air around it at 1440px — roughly 40% of the viewport, not 90%.
- Headline and subline read as one block. If they look like two floating pieces, the
  gap is too big or they aren't in the same `.lockup`.
- No mascot anywhere in the rendered page.
- Nothing below the headline jumps when the words swap. Watch a full cycle in stacked
  mode: `COMING SOON` is two lines, the wordmark is three.
- Exactly one block cursor visible at a time, on the last line with content.
- Every `nowrap` line still fits at 320px. Check the narrowest case, not the widest.
- Headline does not wobble horizontally during decode. Watch one full cycle at 1440px.
- Subline types once and never again — sit through three headline cycles to confirm.
- Favicon renders as two green pixels on dark in the tab, at 16px.
- Grain is invisible until you look for it. Vignette is invisible until you screenshot
  with and without.
- Nothing looks like a default CSS color.
- Throttle to Slow 3G and reload: the mono fallback headline is laid out sensibly and
  the swap to Michroma doesn't break the layout.

Performance:

- DevTools Performance recording of a hover pass: **no layout, no style recalc** in the
  frame loop. Green frames only.
- Sustained 60fps with the pointer sweeping the headline.
- Frame loop allocates nothing — Memory timeline is flat, no sawtooth.
- Canvas (if any) drops to zero work on tab hide.
- `will-change` is cleared after entrance; layer count stays in single digits.

Correctness:

- Exactly two external requests in the network tab: the Google Fonts CSS and the
  Michroma WOFF2. Anything else is a bug.
- Block `fonts.googleapis.com` and reload: page still renders, still readable, still
  laid out — just in mono.
- Reduced-motion pass: static grain, static vignette, no decode, no proximity, no
  canvas, page still complete.
- JS disabled: headline reads correctly, page is fully usable.
- Keyboard-only pass: every link and button reachable, focus always visible.
- Screen reader reads the headline once, not four times.
- No `console.log`, no commented-out code, no TODOs left in the file.
- No secrets, no client names, no personal contact details — the repo is public.
- Copy re-read once against the banned-words list.
