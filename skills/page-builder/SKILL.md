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
--p-100     #d6ffe6   pale white-green. hot core, highlight, subline copy.
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
.tag{ white-space: nowrap; font-size: min(1rem, calc((100vw - 44px) / 26)); }
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
- `--units` budgets a caret width even where the caret is absolutely positioned and
  therefore outside the track. That is deliberate: it reserves room for the overhang so
  the cursor can't push past the viewport edge.

### The lockup

Mascot, headline and subline are **one composed block**, not elements that happen to
sit near each other. They go in a single wrapper, and that wrapper is what gets centred.
Order: mascot, then headline, then subline.

```css
.wrap{ min-height:100dvh; display:flex; justify-content:center; align-items:center }
.lockup{
  display:flex; flex-direction:column; align-items:center;
  gap:clamp(14px,2.6vh,26px);
  max-width:100%;
}
```

- **One child in `.wrap`.** Centring the group is the point; centring three siblings
  with a shared gap makes them read as separate floating pieces.
- Gap between headline and subline is `14`–`26px`. Close enough that the eye takes both
  in as one block, open enough that the subline isn't crowding the wordmark. The hero's
  `line-height: 1.04` leaves almost no leading beneath it, so the gap is doing all the
  work — that's why it needs real value and not a token 8px.
- Never put a `gap` on `.wrap` itself. It has one child.
- Anything else that belongs to the headline — a status tag, a fallback line — goes
  inside `.lockup` too, so the reduced-motion and no-JS views stay composed.
- The mascot gets extra breathing room below it — a `margin-bottom` on top of the gap,
  so the character isn't crowding the wordmark. It is a character, not a bullet point.
- Nothing in the lockup reacts to the pointer. See Micro-interactions.

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
- **Rows breathe: `0.35em` between lines.** Set it as a `gap` on the flex column, not
  as margins, and apply it to every layer *and* the sizer so all four stacks stay in
  register. Without it the three rows read as one crushed block, not a lockup.
- The block cursor sits on the **last line that has content** — line 3 for the
  wordmark, line 2 for `COMING SOON`. One caret visible at a time, never three.
- **Every line is centred on its own text, ignoring the cursor.** `THE`, `BORING` and
  `TEK` each centre independently, and the caret must not drag that centring off. Take
  the caret out of flow — `position: absolute; left: 100%` — so the line centres as if
  it weren't there. The caret then hangs to the right of its own line's text.
- That needs a wrapper: `.ln > .lw > (.t + .caret)`, with `.lw` block-level,
  `width: max-content`, `margin: 0 auto`, `position: relative`. The caret cannot live
  inside `.t` because the cell builder clears `.t` wholesale, and it cannot be
  positioned against `.ln` because that would pin it to the track edge instead of the
  end of the text.
- Scope all of this to `.stack`. The desktop single line keeps its caret inline and
  centres text-plus-caret as one run — leave it alone.
- The hidden sizer needs the same three-line shape, each line padded to the longest
  line's cell count, so the track width is identical in both words. In stacked mode the
  caret is out of flow, so the track is the **text width only** — the caret overhangs
  it on the right. `--units` still budgets a caret width, which is what keeps that
  overhang inside the viewport.
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
- `--glow` is the single knob everything else drives — the settle beat, focus.
  Nothing else touches those opacities. Each glowing element declares its own `--glow`
  on itself; they are not shared between elements.
- Drop `will-change` once the entrance finishes (`el.style.willChange = 'auto'`).
  Persistent `will-change` on many elements costs more than it saves. Elements whose
  opacity is driven continuously keep it.

### Glow tiers

Layer count comes down as the element gets smaller — but the **radii go up relative to
the font size**, because small text needs a proportionally wider halo to read as lit at
all. Never just shrink the headline's numbers and call it done.

| Tier | Used on | Layers |
|---|---|---|
| Full | headline | core shadow stack + `blur(.055em)` duplicate + `blur(.2em)` bloom |
| Reduced | subline | core shadow stack + one `blur(.16em)` duplicate |
| Flat | labels, status tags, links | core shadow stack only |

The subline's reduced tier, for reference:

```css
.tag{ color: var(--p-100) }
.tag-blur{ color: var(--p-500); filter: blur(.16em); opacity: .32 }
.tag-txt{
  text-shadow:
    0 0 .06em rgba(53,255,106,.28),
    0 0 .35em rgba(53,255,106,.20),
    0 0 .9em  rgba(23,163,79,.16),
    0 0 1.7em rgba(23,163,79,.10);
}
```

- **The subline is `--p-100`, the pale white-green** — the same tone family as the
  glowing headline letters, at subline scale. The headline gets there with a `--white`
  fill plus heavy bloom; at 16px the bloom alone can't tint the glyphs, so the pale
  green sits in the fill instead. The result reads as the same material.
- Never `--muted` or a neutral gray here. Gray under a glowing headline reads as an
  unstyled leftover, not as quiet.
- Its glow stays **subtle** — roughly half the headline's alpha, and no third bloom
  layer. Because the fill is bright, the shadow alphas have to run slightly *higher*
  than they would under a dim fill just to stay visible; that is not a licence to make
  it loud.
- Nothing in the lockup brightens on pointer move; these opacities are constants, not
  `--glow` expressions. See Micro-interactions.
- Note the radii: `1.7em` on the subline against `.28em` on the headline. At 16px that
  wide stop is ~27px of soft halo. The same `.28em` would be 4px and invisible.
- The widest bloom layer is dropped at subline size. A `blur(.2em)` duplicate there is
  a formless smudge that adds cost and no glow.
- If the text animates (typing, decode), **every** layer has to be written in the same
  frame. A blur duplicate lagging one frame behind its core shows up as a green ghost.

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

### Pointer reaction — the mascot only

**Text never reacts to the pointer.** The headline and the subline do not lean, do not
translate, do not brighten on mouse move. They are fully static. The mascot's eyes are
the only thing on the page that follows the cursor.

This replaces an earlier build where the whole lockup leaned and brightened on
proximity. Do not reintroduce it. One thing reacting reads as a character noticing you;
everything reacting reads as a gimmick, and it fights the stillness the rest of the
page is built on.

So there is no `--prox`, no `--mx`, no `--my`, and no proximity host. What survives:

- `--glow` on the headline is driven by the **decode settle beat alone**:
  `calc(1 + var(--beat) * .7)`. That is an entrance pulse, not a pointer response.
- The subline's glow layers are plain constants.
- The mascot's eye offsets `--ex` / `--ey` are the only pointer-driven values on the
  page. See Mascot → Eye tracking for the maths and the containment clamp.

If a future element needs to react to the pointer, it reacts the way the mascot does —
by looking at it — not by leaning or lighting up.

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
| Interactive | hover, focus, eye tracking, press | 120–260ms | `ease-out` |

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
- One `requestAnimationFrame` loop for the whole page. Decode, eye tracking and canvas
  share it. Multiple rAF loops fight for frame budget.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` must:

- Kill grain and vignette animation (layers stay, static).
- Skip decode — render final text immediately, no scramble.
- Disable mascot eye tracking (text never tracks anything anyway).
- Skip canvas init.
- Keep hover/focus feedback, but instant.
- **Keep the mascot blink.** It is the one deliberate exception — small, local,
  non-vestibular. Which means the rAF loop still starts under reduced motion, gated so
  it does nothing else. See Mascot → Touch and reduced motion.

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

## Mascot

**Variant 5, tired eyes — FINAL.** A white soft circle face with two dark, flat,
rounded-rectangle eyes sitting low on the face, wider than tall. Heavy, bored,
unbothered. Nothing else: no mouth, no nose, no body, no outline, no shading, no
highlight.

Earlier variants — including the pixel bot and the tall vertical-dash face — are
superseded. Do not reintroduce them.

Source of truth: `assets/mascot.png` is the original art. `assets/mascot.svg` is the
vector, and the page mascot, the favicon and every pose variant are cut from it.

### Geometry

Drawn on a **64×64 grid**. Do not redraw it by eye — these numbers are the mascot.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="The Boring Tek mascot">
  <circle cx="32" cy="32" r="30" fill="#f4f7f5"/>
  <rect x="15" y="36.3" width="13" height="4.4" rx="2.2" fill="#06070a"/>
  <rect x="36" y="36.3" width="13" height="4.4" rx="2.2" fill="#06070a"/>
</svg>
```

Ratios of the face diameter — hold these if it is ever redrawn at another size:

| Measure | Ratio |
|---|---|
| Face diameter to frame | 94% — it fills almost the whole frame |
| Eye width to diameter | 21.7% |
| Eye height to diameter | 7.3% |
| Eye width to height | 2.95 : 1 — always wider than tall |
| Eye separation, centre to centre | 35% |
| Eye centres **below** face centre | 10.8% |

- **Face:** one circle, flat fill, no stroke, no gradient, no inner shadow. The soft
  edge in the source art is antialiasing, not a border — never add one.
- **Eyes:** flat horizontal slabs. `rx` is exactly half the height, so the ends are
  fully round. Never taller than wide, never circles, never ellipses, never tilted in
  the neutral pose.
- Eyes sit **low** — 10.8% of the diameter below centre. That drop is the whole
  expression. Raise them and the face stops reading as tired.
- Perfectly symmetric about `cx`. Never one eye, never three, never mismatched sizes.

### Pose variants

Same face, eyes moved as a group. Each is its own file, all four cut from the neutral
SVG with a single transform:

| File | Transform |
|---|---|
| `assets/mascot-left.svg` | `translate(-3 0)` |
| `assets/mascot-right.svg` | `translate(3 0)` |
| `assets/mascot-up-left.svg` | `translate(-2.6 -2.2) rotate(-4 32 38.5)` |
| `assets/mascot-up-right.svg` | `translate(2.6 -2.2) rotate(4 32 38.5)` |

- Only the eye group moves. The face circle never moves, never rotates, never scales.
- The up poses carry a **4° tilt** about the eye-pair centre `(32, 38.5)` — the raised
  side is the side being looked toward. Slight is the point; past ~5° it reads drunk.
- Rotation belongs to the up poses only. Left and right are pure horizontal slides.

### Colour

- **White face on dark is primary**: face `--white` `#f4f7f5`, eyes `--bg` `#06070a`.
  In the page they are token-driven, in the standalone files they are literal hex.
- The eyes are the page background colour, so the face reads as a hole punched in the
  dark rather than an illustration sitting on top of it.
- Any variant keeps the geometry byte-identical and only swaps the two fills. Never
  recolour the face green, never tint the eyes, never add a third colour.

### On the page

The mascot **is** rendered in the page now: small, centred, at the top of `.lockup`,
above the headline. One per page.

```css
/* halo lives on a wrapper, not as a filter on the svg — see below */
.m-wrap{position:relative;display:block;margin-bottom:clamp(32px,5.6vh,56px)}
.m-wrap::before{
  content:"";position:absolute;left:50%;top:50%;
  width:210%;height:210%;transform:translate(-50%,-50%);
  border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,
    rgba(53,255,106,.20) 0%,
    rgba(53,255,106,.11) 30%,
    rgba(23,163,79,.055) 52%,
    rgba(23,163,79,0) 72%);
}
.mascot{position:relative;display:block;width:clamp(78px,17vw,130px);height:auto}
.m-face{fill:var(--white)}
.m-eyes{transform:translate(calc(var(--ex) * 1px),calc(var(--ey) * 1px))}
.m-eye{
  fill:var(--bg);
  transform-box:fill-box; transform-origin:center;
  transform:scaleY(var(--blink));
  transition:transform 55ms ease-out;
}
```

- **Size `clamp(78px, 17vw, 130px)`.** He is a character, not a bullet point — big
  enough to carry the top of the page on his own. Cap at `130px`.
- Extra `margin-bottom` under the wrapper on top of the lockup gap, so he sits high
  with clear space before the wordmark starts.
- **The halo is a static radial-gradient layer on a wrapper `::before`, not a
  `filter` on the SVG.** The eyes repaint constantly; a filter on the root would
  re-rasterise the whole glow with them every frame. A gradient behind a circular mark
  is radially identical anyway, and costs nothing. Pseudo-elements don't apply to
  `<svg>`, which is the other reason the wrapper exists.
- `.mascot` needs `position:relative` so it paints above the positioned halo.
- It sits **inside** `.lockup`, so it moves and centres with the wordmark rather than
  floating above it as a separate piece.
- `aria-hidden="true"` on the wrapper and `focusable="false"` on the SVG. It is
  decorative; the `<h1>`'s screen-reader text already carries the brand.
- Two nested transforms, deliberately: the `<g>` carries eye travel, each `<rect>`
  carries the blink squash. Putting both on one element would make the blink
  transition lag the eye tracking.
- `px` inside an SVG resolves to **user units**, so `--ex`/`--ey` are 64-grid units,
  not screen pixels. At the rendered size one unit is roughly half a screen pixel.
- Register `--ex`, `--ey` and `--blink` with `@property { syntax: '<number>' }`.

### Eye tracking

Eyes slide toward the pointer, and they are **the only thing on the page that reacts to
it**. Driven by the **shared rAF loop and the one pointer handler** — never a second
loop, never its own listener.

It should read as *active*. The mascot is a character noticing you, not a subtle
flourish — the eyes travel a real distance, arrive quickly, and respond to the pointer
anywhere on screen, not just when it comes close.

```js
var EX = 6, EY = 3.8, REACH = 90, EASE = .22;   // units, units, screen px, lerp
// in the pointer handler:
var ecx = mrect.left + mrect.width / 2, ecy = mrect.top + mrect.height / 2;
var edx = e.clientX - ecx, edy = e.clientY - ecy;
var ed  = Math.hypot(edx, edy) || 1;
var g   = Math.min(1, ed / REACH);        // ramps in, so it doesn't jitter up close
aimX = (edx / ed) * g * EX;
aimY = (edy / ed) * g * EY;
// in frame():
ex += (aimX - ex) * EASE;                 // lerp, no snap
ey += (aimY - ey) * EASE;
```

- **Travel is capped at `±6` and `±3.8` units by construction** — a unit vector times a
  factor that never exceeds 1. That is the clamp; the eyes cannot slide off the face.
  At full deflection the worst eye corner sits **26.18 units from the face centre**,
  inside the `r=30` face with 3.8 units to spare. **Never raise the caps without
  redoing that arithmetic** — it is the only thing keeping the eyes on the face.
- `REACH` is deliberately small — about the width of the mascot. The ramp exists only
  to stop jitter when the pointer is right on the face; past that the eyes are at full
  deflection and simply track direction, so a pointer in a far screen corner still
  moves them.
- The mascot needs **its own rect** for direction — a vector from any other element's
  centre would aim the eyes at the wrong thing. Measure it in `remeasure()`, never in
  the frame loop.
- Recentre on `pointerleave`. Eyes left staring at the last known position look broken.
- Write `--ex`/`--ey` only when they move more than `.02`.

### Blink

- Every **4–6 seconds**, randomised each time — never a fixed interval.
- Eyes **squash flat** for ~`120ms`: `scaleY(.16)` about each eye's own centre, with a
  `55ms` transition either side. Both eyes together. Never a wink, never a lid, never
  a fade-out.
- Scheduled from the same shared rAF loop, from the frame clock. No `setInterval`,
  no `setTimeout` chain.
- Write `--blink` only on the two state changes, not every frame.

### Touch and reduced motion

- **Eyes stay centred, blink continues.** No tracking on touch (`pointer: coarse`) and
  none under `prefers-reduced-motion`.
- The blink is the **one deliberate exception** to reduced motion on this site: it is
  small, local, non-vestibular, and it is what keeps the mascot from reading as a dead
  sticker. Everything else still shuts off.
- That means the rAF loop **starts even under reduced motion** — gated so that decode,
  typing and eye tracking never run, and the loop does nothing but blink. One loop.
- The global `transition: none` under reduced motion turns the blink into a snap rather
  than a squash. That is fine and arguably better.

### Favicon

- `assets/mascot.svg` inlined as a `data:` URI in `<link rel="icon">`. Never a separate
  `.ico` or `.png` file.
- **Fully transparent background — no plate.** No dark square, no light square, no
  rounded tile. Just the face; the browser supplies whatever sits behind it.
- **Identical to the standalone asset**, element for element. If the two ever diverge,
  the asset is right and the favicon is wrong.
- Neutral pose only — the favicon never uses a variant.
- Encode `#` as `%23` in the URI or the whole thing silently fails.

```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23f4f7f5'/%3E%3Crect x='15' y='36.3' width='13' height='4.4' rx='2.2' fill='%2306070a'/%3E%3Crect x='36' y='36.3' width='13' height='4.4' rx='2.2' fill='%2306070a'/%3E%3C/svg%3E">
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
  @property --beat{syntax:'<number>';inherits:true;initial-value:0}
  @property --units{syntax:'<number>';inherits:true;initial-value:15.5}
  @property --ex{syntax:'<number>';inherits:true;initial-value:0}
  @property --ey{syntax:'<number>';inherits:true;initial-value:0}
  @property --blink{syntax:'<number>';inherits:true;initial-value:1}
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
    gap:clamp(14px,2.6vh,26px);max-width:100%}
  @media (min-width:720px){.wrap{padding-inline:20px}}

  /* headline — fit-to-width, capped at 2.75rem; --units set by JS from metrics */
  .hero{display:grid;justify-content:center;margin:0;max-width:100%;
    font-size:min(2.75rem, calc(min(100vw - 44px, 90vw) / var(--units)));
    line-height:1.04;letter-spacing:0;contain:layout style;
    --glow:calc(1 + var(--beat) * .7);
  }
  .hero>span{grid-area:1/1;display:block;white-space:pre}
  .ln{display:block;min-height:1.04em}
  .hero:not(.stack) .ln:nth-child(n+2){display:none}
  /* stacked: rows breathe, each line centres on its own text */
  .stack .layer,.stack .sizer{display:flex;flex-direction:column;gap:.35em}
  .stack .lw{display:block;position:relative;width:max-content;margin:0 auto}
  .stack .caret{position:absolute;left:100%;top:0}
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
      <!-- sizer, then l-wide / l-mid / l-core. EACH carries three .ln lines,
           and every line wraps its text + caret in .lw so the stacked lockup can
           centre on the text alone:
           <span class="ln"><span class="lw"><span class="t">THE BORING TEK</span><span class="caret">&#9610;</span></span></span>
           <span class="ln"><span class="lw"><span class="t"></span><span class="caret">&#9610;</span></span></span>
           <span class="ln"><span class="lw"><span class="t"></span><span class="caret">&#9610;</span></span></span>
           Line 1 holds the whole string; lines 2-3 fill only in the stacked lockup.
           Copy the exact markup from index.html. -->
    </h1>
    <p class="tag">
      <span class="tag-size" aria-hidden="true">building the boring part of the future.</span>
      <span class="tag-live"><span class="tag-blur" aria-hidden="true">building the boring part of the future.</span><span class="tag-txt">building the boring part of the future.</span><span class="tag-caret" aria-hidden="true">&#9610;</span></span>
    </p>
   </div>
  </main>

<script>
  // Guard everything with REDUCED. Measure metrics after document.fonts.load
  // resolves, build the cell grid, then run ONE shared rAF loop for decode +
  // mascot eye tracking. See index.html for the full implementation.
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

- **More than one mascot per page**, or placing it anywhere but the top of `.lockup`.
  No header logo, no footer bug, no loading state.
- **Giving the mascot a mouth, nose, body, outline, shading, or a highlight.** A white
  circle and two flat dark slabs. That is the whole mascot.
- **Redrawing the mascot by eye.** The geometry table in the Mascot section is the
  spec; hold the ratios at any size.
- **Eyes taller than wide**, round or elliptical eyes, or eyes raised toward the middle
  of the face. The low, flat, wider-than-tall slab is the tired expression — any of
  those changes throw it away.
- **Tilting the eyes in the neutral pose.** Rotation belongs to the up-left and
  up-right variants only, at 4°.
- **Moving, rotating or scaling the face circle.** Only the eye group ever moves.
- **Mascot motion beyond eye tracking and the blink** — bobbing, floating, rotating,
  scanning, colour cycling, idle drift.
- **A winking, fading or lidded blink.** Both eyes, squash, snap back.
- **A second rAF loop or a `setInterval`** for the eyes or the blink. Both ride the
  shared loop and the existing pointer handler.
- **Reading the mascot's rect inside the frame loop.** Measure it in `remeasure()`
  alongside the headline's.
- **Raising the eye-travel caps** without redoing the containment arithmetic. `±3` and
  `±2` units is what keeps the eyes on the face.
- **Eye tracking on touch or under reduced motion.** Centred eyes, blink only.
- **Recolouring the mascot** beyond swapping the two fills. No green face, no tinted
  eyes, no third colour, no gradient.
- **A separate favicon file**, or a favicon using a pose variant. Inline `data:` URI,
  neutral pose, transparent.
- **A separate cap for the stacked mobile lockup.** `2.75rem` is uniform everywhere.
- **A `gap` on `.wrap`**, or headline and subline as loose siblings. One `.lockup`
  child, centred as a group.
- **A gray subline.** Lockup copy is green and glows. `--muted` is for labels and
  timestamps.
- **Any pointer reaction on text** — leaning, translating or brightening the headline
  or subline on mouse move. The mascot's eyes are the only thing that reacts.
- **Shrinking the headline's glow radii verbatim for smaller text.** Layer count comes
  down, relative radii go up. See Glow tiers.
- **Writing a text layer without its glow duplicates in the same frame.** The blurred
  copy lagging behind shows as a green ghost.
- **Letting the stacked lockup collapse to two line boxes** when a word is two lines.
  Three boxes always, or the layout jumps on every swap.
- **An inline caret in the stacked lockup.** It shifts every line off centre by half a
  cursor. Out of flow, `left: 100%`, always.
- **Positioning the stacked caret against `.ln`** instead of the `.lw` text wrapper.
  That pins it to the track edge, so short lines get a cursor floating away from their
  text.
- **Applying the stacked caret or row-gap rules to the desktop single line.** Scope
  everything to `.stack`.
- **Row gap as margins on `.ln`.** Use the flex `gap`, and put it on the sizer too or
  the four stacked layers drift out of register.
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
  gap is wrong or they aren't in the same `.lockup`.
- Sweep the pointer across the lockup: the headline and subline do not move, shift or
  brighten by a single pixel. Only the eyes react.
- Subline reads as the same pale white-green material as the headline, easily legible
  at a glance, and never flashes on the headline's settle beat.
- No green ghost trailing the subline while it types — the blur layer is written in the
  same frame as the core.
- Mascot reads as a character at the top of the lockup, with clear space beneath him and
  a soft halo around him — not a small icon bolted above the text.
- Sweep the pointer a full circle around the mascot, out to all four screen corners: the
  eyes follow from anywhere, move a visible distance, arrive quickly, stay inside the
  face at every angle, and recentre when the pointer leaves the window.
- Sit and watch for 30s: it blinks 5–7 times at irregular intervals, both eyes, squash
  not fade.
- Touch and reduced motion: eyes dead centre, still blinking, nothing else moving.
- Nothing below the headline jumps when the words swap. Watch a full cycle in stacked
  mode: `COMING SOON` is two lines, the wordmark is three.
- Exactly one block cursor visible at a time, on the last line with content.
- In stacked mode, drop a vertical guide down the centre of the viewport: it should
  bisect `THE`, `BORING` and `TEK` equally. If the text sits left of centre, the caret
  is still in flow.
- Stacked rows have visible air between them, and the block doesn't change height when
  the words swap.
- Desktop single line is untouched — caret still inline, still centred with the text.
- Every `nowrap` line still fits at 320px. Check the narrowest case, not the widest.
- Headline does not wobble horizontally during decode. Watch one full cycle at 1440px.
- Subline types once and never again — sit through three headline cycles to confirm.
- Favicon renders as a white circle with two dark dash eyes in the tab, at 16px — the
  eyes still read as two separate marks and haven't merged into a blur.
- Grain is invisible until you look for it. Vignette is invisible until you screenshot
  with and without.
- Nothing looks like a default CSS color.
- Throttle to Slow 3G and reload: the mono fallback headline is laid out sensibly and
  the swap to Michroma doesn't break the layout.

Performance:

- DevTools Performance recording of a hover pass: **no layout, no style recalc** in the
  frame loop. Green frames only.
- Sustained 60fps with the pointer sweeping across the mascot.
- The mascot halo is a gradient layer, not a filter — confirm no filter re-raster shows
  up while the eyes are moving.
- Frame loop allocates nothing — Memory timeline is flat, no sawtooth.
- Canvas (if any) drops to zero work on tab hide.
- `will-change` is cleared after entrance; layer count stays in single digits.

Correctness:

- Exactly two external requests in the network tab: the Google Fonts CSS and the
  Michroma WOFF2. Anything else is a bug.
- Block `fonts.googleapis.com` and reload: page still renders, still readable, still
  laid out — just in mono.
- Reduced-motion pass: static grain, static vignette, no decode, no eye tracking, no
  canvas, page still complete.
- JS disabled: headline reads correctly, page is fully usable.
- Keyboard-only pass: every link and button reachable, focus always visible.
- Screen reader reads the headline once, not four times.
- No `console.log`, no commented-out code, no TODOs left in the file.
- No secrets, no client names, no personal contact details — the repo is public.
- Copy re-read once against the banned-words list.
