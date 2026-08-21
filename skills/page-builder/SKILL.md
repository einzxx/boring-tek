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
  library, no CDN, no webfonts.
- **No network at runtime.** No fetch, no external assets, no analytics, no trackers.
  Inline `data:` URIs are fine — they ship in the file.
- **System font stack only.** Never load a font.
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

### Stack

Variable-capable faces first, static fallbacks after. Nothing is downloaded — if the
user doesn't have a variable mono, they get a clean static weight and lose only the
weight animation.

```css
--mono: ui-monospace, "Cascadia Code", "JetBrains Mono", "Roboto Mono",
        "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
```

### Fluid scale

All type uses `clamp()`. No breakpoint-swapped font sizes anywhere.

```css
--t-micro: clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem);   /* 11 → 12 */
--t-body:  clamp(0.875rem, 0.83rem + 0.22vw, 1rem);       /* 14 → 16 */
--t-lead:  clamp(1rem, 0.92rem + 0.42vw, 1.25rem);        /* 16 → 20 */
--t-sub:   clamp(1.25rem, 1rem + 1.25vw, 2rem);           /* 20 → 32 */
--t-hero:  clamp(2.75rem, 1.1rem + 11vw, 13rem);          /* 44 → 208 */
```

- Hero is meant to be enormous on desktop — 200px+, filling the viewport width. Don't
  time it down "for balance".
- Line height: `1.65` body, `1.35` sub, `0.92` hero.
- Letter-spacing: `0` body, `-0.03em` hero (big monospace needs tightening),
  `0.16em` on uppercase labels.
- Max line length `68ch`. Long paragraphs are wrong here — write short lines.
- Copy is lowercase by default. Uppercase is for labels and status tags only.

### Variable weight animation

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

- Driven by `requestAnimationFrame` on a normalized `0..1` progress, eased with
  `easeOutExpo`. **Never `setInterval`**, never a constant ms-per-character.
- Characters resolve in a scrambled order, not left to right.
- Per-character jitter so several land together and then a gap — that's the rhythm.
  Perfectly even resolution reads mechanical.
- Scramble glyphs come from a fixed set: `ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$*+<>/\|`
  — no punctuation that changes advance width, no emoji, no box-drawing.
- Monospace means width never changes mid-decode. Never decode a proportional font.
- Total duration `900`–`1400ms`. Longer is self-indulgent.
- Ends on a **settle beat**: on completion, `--glow` spikes to `1.6` and `--wght` to
  `640`, then both ease back over ~400ms. That single pulse is what sells it.
- The final text must be in the DOM before JS runs. Decode replaces `textContent`
  temporarily and restores the original — never builds the copy from a JS string.

```js
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$*+<>/\\|';
const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

function decode(el, ms = 1150){
  const final = el.textContent;
  const n = final.length;
  // scrambled resolve order + per-char jitter → rhythm, not a tick
  const order = [...Array(n).keys()].sort(() => Math.random() - .5);
  const at = new Array(n);
  order.forEach((ci, i) => { at[ci] = (i / n) * .82 + Math.random() * .18; });

  let t0;
  const frame = now => {
    t0 ??= now;
    const p = easeOutExpo(Math.min((now - t0) / ms, 1));
    let out = '';
    for (let i = 0; i < n; i++){
      const c = final[i];
      out += (c === ' ' || p >= at[i]) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else { el.textContent = final; settle(el); }
  };
  requestAnimationFrame(frame);
}
```

Where `settle` fires the glow/weight pulse and then clears `will-change`.

If the element uses the three-layer glow stack, decode all three duplicates in lockstep
from one rAF loop — never three independent loops.

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

- Max width `900px`, centered, `20px` side padding (`16px` under 480px). Hero may break
  out to full viewport width.
- Spacing scale, nothing between: `4 8 12 16 24 32 48 64 96 128`.
- Left-aligned. Centered text only for a hero.
- Borders `1px solid var(--line)`. **Zero border radius everywhere.** No rounded
  corners, no pills.
- No box shadows. Depth comes from the glow and vignette layers, never from a drop
  shadow on a card.
- Fluid-first: `clamp()`, `min()`, `max()` and intrinsic sizing over breakpoints. One
  `@media (min-width: 720px)` for structural layout changes only. Two breakpoints
  maximum.

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
<style>
  :root{
    --bg:#06070a; --bg-lift:#0b0d12; --line:#1a1e26; --dim:#2b323d;
    --text:#d5dbd8; --muted:#6d7680; --white:#f4f7f5;
    --p-100:#d6ffe6; --p-300:#7cf5a8; --p-500:#35ff6a; --p-700:#17a34f; --p-900:#0a3d21;
    --a-300:#ffd79a; --a-500:#ffb340; --a-700:#a86a12;
    --red:#ff5c5c;
    --mono: ui-monospace,"Cascadia Code","JetBrains Mono","Roboto Mono","SF Mono","Cascadia Mono",Menlo,Consolas,monospace;
    --t-micro: clamp(.6875rem,.66rem + .14vw,.75rem);
    --t-body:  clamp(.875rem,.83rem + .22vw,1rem);
    --t-lead:  clamp(1rem,.92rem + .42vw,1.25rem);
    --t-hero:  clamp(2.75rem,1.1rem + 11vw,13rem);
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

  /* content */
  .wrap{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:clamp(32px,9vh,96px) 16px}
  @media (min-width:720px){.wrap{padding-inline:20px}}

  /* layered glow */
  .glow{display:grid;position:relative;isolation:isolate;margin:0;
    font-size:var(--t-hero);line-height:.92;letter-spacing:-.03em;
    --glow:calc(1 + var(--prox,0) * .85);
    transform:translate3d(calc(var(--mx,0)*var(--prox,0)*6px),calc(var(--my,0)*var(--prox,0)*4px),0);
  }
  .glow>span{grid-area:1/1;display:block}
  .glow__core{z-index:3;color:var(--white);
    text-shadow:0 0 1px rgba(53,255,106,.55),0 0 6px rgba(53,255,106,.34),
                0 0 18px rgba(53,255,106,.20),0 0 44px rgba(23,163,79,.14)}
  .glow__blur {z-index:2;color:var(--p-500);filter:blur(10px);opacity:calc(.42*var(--glow))}
  .glow__bloom{z-index:1;color:var(--p-700);filter:blur(38px);opacity:calc(.30*var(--glow))}
  .vf .glow__core{font-variation-settings:"wght" var(--wght,420);
    transition:font-variation-settings 420ms var(--ease)}

  a{color:var(--p-500);text-decoration:underline;text-decoration-color:var(--p-700)}
  a:hover{text-decoration-color:var(--p-500)}
  :focus-visible{outline:1px solid var(--p-500);outline-offset:3px}
  .label{color:var(--muted);text-transform:uppercase;letter-spacing:.16em;font-size:var(--t-micro)}
  .caret{color:var(--p-500);animation:blink 1.05s step-end infinite}
  @keyframes blink{50%{opacity:0}}

  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation:none!important;transition:none!important}
    .glow{transform:none!important}
  }
</style>
</head>
<body>
  <div class="vignette" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <main class="wrap">
    <h1 class="glow" data-glow>
      <span class="glow__blur"  aria-hidden="true">the boring tek</span>
      <span class="glow__bloom" aria-hidden="true">the boring tek</span>
      <span class="glow__core">the boring tek</span>
    </h1>
    <!-- content -->
  </main>

<script>
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('vf',
    CSS.supports('font-variation-settings','"wght" 500'));
  // decode() + single shared rAF loop (proximity, canvas) go here.
  // guard everything with REDUCED.
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
- **Glow as the only state indicator.** Contrast has to carry it too.

## Before shipping

Visual:

- Renders correctly at 320px, 768px, 1440px and 2560px wide.
- Hero actually gets huge on a wide screen — check at 1920px, not just a laptop.
- Grain is invisible until you look for it. Vignette is invisible until you screenshot
  with and without.
- Nothing looks like a default CSS color.

Performance:

- DevTools Performance recording of a hover pass: **no layout, no style recalc** in the
  frame loop. Green frames only.
- Sustained 60fps with the pointer sweeping the headline.
- Frame loop allocates nothing — Memory timeline is flat, no sawtooth.
- Canvas (if any) drops to zero work on tab hide.
- `will-change` is cleared after entrance; layer count stays in single digits.

Correctness:

- Zero external requests in the network tab.
- Reduced-motion pass: static grain, static vignette, no decode, no proximity, no
  canvas, page still complete.
- JS disabled: headline reads correctly, page is fully usable.
- Keyboard-only pass: every link and button reachable, focus always visible.
- Screen reader reads the headline once, not four times.
- No `console.log`, no commented-out code, no TODOs left in the file.
- No secrets, no client names, no personal contact details — the repo is public.
- Copy re-read once against the banned-words list.
