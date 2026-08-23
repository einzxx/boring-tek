# page-builder — SKILL.md

Build single-file HTML/CSS/JS pages in The Boring Tek style. Monospace, two themes,
no frameworks, no dependencies.

This file is the source of truth for how pages look and are built. Don't invent tokens
outside it.

The reference is a real CRT terminal in a dark room, not a retro filter — depth,
phosphor bloom, grain, a slow vignette. **Since site v1 that terminal has a daylight
half**: the same page in white, with the mascot inverted and the phosphor glow turned
off. Dark is where the identity lives. Light is where the customers are. Both ship.

## Non-negotiables

- **One file.** HTML, CSS (one `<style>`) and JS (one `<script>`) in the same `.html`.
  No external files.
- **Zero dependencies.** No npm, no build step, no framework, no CSS library, no icon
  library, no CDN scripts.
- **Exactly one external request at load, and it now carries two families.** One
  Google Fonts `<link>`, `family=Michroma&family=Space+Grotesk:wght@400;500`. That is
  still one request and it is the whole budget. No other assets, no analytics, no
  trackers. Inline `data:` URIs are fine, they ship in the file. See Type for the
  exact tag.
- **Two runtime requests, and only on a press:** the contact form posts to Web3Forms and
  to our own Cloudflare Worker at the same time. Nothing fetches on load, on scroll, on
  hover or on idle. If a page grows another endpoint, that's a decision, not an
  implementation detail.
- **The one `<script>` lives in `<head>`, not at the end of `<body>`.** It applies the
  saved theme and language to `<html>` synchronously as its first act, then defers
  everything else to `DOMContentLoaded`. Deferring the whole script, or moving it to the
  body, puts a white flash in front of every dark-mode visitor.
- **No third webfont.** Michroma and Space Grotesk are the whole list, in one request.
  Anything that is neither — and every russian string, which Space Grotesk cannot set —
  uses the system monospace stack.
- **JS is optional.** If the page works without it, ship it without it. Everything JS
  adds here is decoration layered on top of a page that already reads.
- **Inline SVG** for graphics, `currentColor` for strokes and fills. No image files
  unless agreed first.
- **One `<canvas>` maximum**, and only when it earns its place (see Canvas).
- `index.html` stays in the repo root.

## Color — two themes, one token set

**Light is the default. Dark is the identity.** Every colour on the page is a semantic
token that both themes define. Nothing reads a raw hex outside the two `:root` blocks,
which is what makes the 0.5s cross-fade a single transition rule rather than one per
element.

```
                     light (default)          dark
--bg                 #ffffff                  #06070a   page base. never flat #000.
--fg                 #0b0d10                  #d5dbd8   body and headline
--sub                #4b5058                  #c8c8c8   subline copy
--muted              #767d86                  #6d7680   labels, hints, timestamps
--line               #dfe3e7                  #1e242d   borders, rules, field edges
--field              #fbfbfc                  #0b0d12   raised blocks, the form card
--bub                rgba(11,13,16,.55)       rgba(213,219,216,.5)   bubble outlines
--face               #0b0d10                  #f4f7f5   mascot face
--eye                #ffffff                  #06070a   mascot eyes — always == --bg
--accent             #0f8a3c                  #35ff6a   THE green
--accent-soft        rgba(15,138,60,.10)      rgba(53,255,106,.09)   selected chip fill
--red                #c62828                  #ff5c5c   errors only. never decorative.
```

Plus three tokens that carry whole values rather than colours, so the theme swap can
turn an effect off instead of recolouring it:

```
--glowon        0 in light, 1 in dark   multiplies the headline's blur-layer opacity
--hero-shadow   the four-layer phosphor text-shadow, alpha 0 in light
--halo          the mascot's radial gradient
--vig           the vignette gradient
--grain-o       .026 light, .038 dark
```

Rules:

- **Never a default CSS color.** No `green`, `red`, `white`, `black`, `lime`, `#000`,
  `#fff`. Tokens only. `--bg` is `#ffffff` in light, and that is the token's job, not
  licence to type `#fff` somewhere.
- **Never `#00ff00`** or any pure-primary lime. If it looks like a Matrix screensaver
  it's wrong.
- **The dark green is not the light green.** `#35ff6a` on white is unreadable — it
  measures under 2:1. Light mode's `#0f8a3c` is the same hue walked down until it
  passes on white. Never ship one green for both themes.
- **`--eye` always equals `--bg`.** The face reads as a hole punched in the page, not
  an illustration sitting on it. That is the whole reason the mascot inverts with the
  theme instead of staying white on both.
- Red only means something is wrong.
- Contrast floor 4.5:1 for body text, checked in **both** themes. `--muted` passes on
  both. Check any new token against both backgrounds before adding it.
- **Phosphor glow is a dark-mode effect.** In light mode the headline is flat `--fg`
  with no bloom — `--glowon: 0` and a zero-alpha `--hero-shadow`. Glow on white is a
  smudge. Do not try to invent a "light glow"; the light theme's confidence comes from
  contrast and space.
- One accent per screen region. Green is the only accent v1 uses. The amber ramp
  (`--a-300/500/700`) is retired — nothing on the site was using it.

### Making the swap actually fade

- Every paired gradient (`--halo`, `--vig`) must keep **the same stop count at the same
  positions** in both themes. Gradients only interpolate when their shapes match; a
  three-stop light halo against a four-stop dark one snaps instead of fading.
- `--hero-shadow` in light mode is the dark stack with every alpha set to `0`, not
  `none`. `none` ↔ a shadow list does not interpolate.
- A custom property is not itself animatable (they're unregistered strings), but the
  **property that reads it is**. `opacity: calc(... * var(--glowon))` transitions fine
  because the computed opacity changes. So declare the transition on the real property —
  `opacity`, `text-shadow`, `background-image` — not on the variable.
- The universal `*` transition covers `background-color`, `border-color`, `color` and
  `fill` only. Anything else that changes with the theme declares its own.

## Theme switching

- **Light is the default**, including for a first-time visitor with no stored choice.
  We do not read `prefers-color-scheme`. A deliberate default beats a guess, and the
  toggle is one press away in the top right.
- Choice persists in `localStorage` under **`bt-theme`** (`'light'` | `'dark'`). Wrap
  every read and write in `try/catch` — private windows and blocked site data throw on
  access, and a thrown storage read must not take the page down with it.
- The head script applies `data-theme` to `<html>` **before first paint**. Everything
  else waits for `DOMContentLoaded`.
- Three things move together on every switch and none may be forgotten:
  `data-theme` on `<html>`, `html.style.colorScheme` (so native form controls and
  scrollbars follow), and the `<meta name="theme-color">` content (so mobile browser
  chrome follows). `<meta name="color-scheme">` stays `light dark`.
- The toggle icon shows **the mode you would switch to** — a moon in light, a sun in
  dark. Both SVGs ship inline and CSS picks one off `html[data-theme=dark]`; never
  swap icon markup from JS.
- Its `aria-label` is real text and re-renders with the language.

## Languages

EN, RU and LV, switched by three plain text buttons top left. Active is `--fg` at full
opacity; the others are `--muted` at `.5`.

- Choice persists in `localStorage` under **`bt-lang`**. Same `try/catch` rule.
- The head script sets `<html lang>` before paint, alongside the theme.
- **Which language, in strict priority order:** the url, then a saved choice, then the
  browser, then English. See below.
- **Every visible string lives in one `T` object**, keyed by language then by string
  key, and nothing is typed into the markup that JS won't overwrite on boot. The markup
  ships the English strings so the no-JS page still reads; boot rewrites them from `T`
  as its first act, so a Russian visitor never sees an English flash.
- A language switch **re-renders the current view in place**: static copy, the subline,
  the form step being answered, and any bubble line currently held. It never resets
  progress and never closes the card.
- All three dictionaries carry **identical key sets**, including array lengths for
  `idle` and `notes`. A missing key falls back to English rather than rendering
  `undefined`, but the fallback is a safety net, not a translation strategy.
- Copy rules apply in every language: lowercase, short, no exclamation marks, dry.
- **The wordmark is never translated.** `THE BORING TEK` is the same fourteen
  characters everywhere.
- **The payload is not translated either.** Whatever language the visitor answered in,
  the form posts English labels, plus a `language` field recording what they used. An
  inbox you can't read is worse than no inbox.

### Language urls

`/` is English, `/ru` is Russian, `/lv` is Latvian, and the address bar always names
the language on screen — so any url a visitor copies opens the way they were reading it.

**The mechanism, because GitHub Pages has no rewrites and the site is one file.**

- `ru/index.html` and `lv/index.html` are stubs, and each is one line of real work:
  set `documentElement.style.background` from the saved theme, then
  `location.replace('/#ru')`. Both run in a `<script>` in `<head>`, before the body is
  parsed, so the stub never paints — and the background guard means that even a slow
  replace shows the theme the visitor is about to land in rather than a white card.
- **`index.html` reads the hash in the bootstrap, before first paint**, applies the
  language, and then `history.replaceState`s the clean path back into the address bar.
  The `#ru` is gone before anything renders. Measured frame by frame from
  document-start on a shared `/ru` link: the first sampled frame already says
  `lang="ru"`, Russian copy, path `/ru`. There is no English frame at any point.
- **A copy of the site per language is the thing this avoids.** Three documents mean
  three copies of the form, the mascot and the dictionaries, kept in sync by hand.
  The stubs are 30 lines that never need touching again.
- `location.replace`, never `href =`: the stub must not become a back-button stop.
  Same reason the switch uses `replaceState` and never `pushState` — `history.length`
  is unchanged after a dozen switches, and back still leaves the site.
- **The stub degrades to English with JS off**, via `<noscript><meta http-equiv=
  "refresh" content="0;url=/">` and a plain link. The hash cannot be read without a
  script, so there is nothing better to degrade to.
- **No relative urls anywhere in `index.html`.** `replaceState` moves the document's
  base path to `/ru`, so `assets/x.svg` would start resolving to `/ru/assets/x.svg`.
  Everything in the page is a data URI or an absolute url, and it has to stay that way.
- GitHub Pages 301s `/ru` to `/ru/` before serving the stub. It is one invisible hop on
  a reload and it is why the sitemap and the `hreflang` tags can use either form; they
  use `/ru`, matching what the address bar shows and what people share.

**Detection, for a first visit with no url and no saved choice.**

- `navigator.languages[0]` (falling back to `navigator.language`), everything before the
  first `-`: `ru` gets Russian, `lv` gets Latvian, anything else gets English.
- **Nothing is written to storage.** A detected language is a guess; it must not outlive
  the visit or shout down a choice made later. Only pressing a language button writes
  `bt-lang`.
- **A saved choice beats the browser. The url beats both** — for that visit only, and it
  does not overwrite what is saved. Someone who chose Latvian and opens a shared `/ru`
  link reads Russian, and their next visit to `/` is still Latvian.

**SEO.**

- `hreflang` for `en`, `ru`, `lv` and `x-default` in all three documents; the main page's
  canonical stays `https://theboringtek.com/`, and each stub is canonical to itself.
- `sitemap.xml` carries all three urls.
- **The honest limitation:** the stubs redirect, so a crawler sees one page of content in
  English. This is real multilingual routing for people, not for search engines. Getting
  the second half needs three real documents, which is the copy problem above.

## Type

Three faces. **Michroma** for the headline, **Space Grotesk** for reading text, system
monospace for everything that is deliberately mono. Never mix them within one element,
and never add a fourth.

### Display face — Michroma

Michroma is the official headline face. Squared, industrial, wide — it matches the
logo. It is the **only** external request the page is allowed to make.

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
```

```css
--display: "Michroma", var(--mono);
```

- **Headline / wordmark, the lockup subline, and the cta.** Nothing else — never body
  text, labels, form buttons, nav or status tags. Those stay `--body`, or `--mono`
  where mono is deliberate.
- The subline is the one small-text exception, and it is deliberate: it belongs to the
  lockup, so it carries the lockup's face. It earns the exception by being **one short
  line, uppercase, tracked wide** — see Letter-spacing below. Michroma at small sizes,
  lowercase and default-tracked, is a smudge. Caps have simpler shapes and the tracking
  gives them air, and that combination is what makes it legible at `1rem`. All three
  ship together or none of them do. This is not licence to put Michroma on the next
  paragraph.
- **Michroma is Latin-only.** It has no Cyrillic and no Latvian diacritics, so the
  Russian subline and half the Latvian one would fall back per glyph — two faces inside
  one word, which looks broken rather than multilingual. The subline therefore tests its
  own string (`/^[\x20-\x7E]*$/`) and drops the whole line to `--mono` at `.14em`
  tracking when it isn't plain ASCII. All or nothing, never per glyph. **The cta runs
  the same test** and drops to `--body` when it fails — Space Grotesk for latvian, mono
  for russian. The headline is never translated, so it is always Michroma.
- **Michroma ships one weight: 400.** There is no bold, no italic, no variable axis.
  Never request extra weights in the URL, never fake bold with `font-weight: 700`
  (which triggers synthetic bold and smears the squared edges), never fake it with
  `-webkit-text-stroke`. The face reads heavy on its own — let it.
- `display=swap` is mandatory. The page must be complete and readable in the mono
  fallback before Michroma arrives.
- Michroma is **proportional**, which matters for decode — see Decode → Proportional
  faces. It also has no box-drawing glyphs, so the block cursor `▊` must be given
  `font-family: var(--mono)` explicitly or it falls back unpredictably. That cursor
  lives on the headline and is the only one on the page.
- Letter-spacing: `0` on the headline, `0.18em` on the subline. Never negative.
  Michroma is already wide, and tightening it fights the design; opening it up at
  small sizes is the only direction that helps.
- **`text-transform` on Michroma changes its measured width by roughly 15%.** Caps are
  wider than lowercase. Anything that measures the face on a canvas has to measure the
  *rendered* string, not the DOM string — see Fit-to-width sizing.
- The one `<link>` fetches the CSS, then the WOFF2 files the page actually uses. That
  is the whole external budget. Nothing else.

### Body face — Space Grotesk

Space Grotesk sets everything a visitor actually reads: the hint, the speech bubble,
the form's questions, chips, fields, validation lines and its buttons. It arrives in
the same `<link>` as Michroma, in weights 400 and 500 and no others.

```css
--body: "Space Grotesk", var(--mono);
```

- **Two weights, 400 and 500.** 500 is for the form question and the form's nav
  buttons. Nothing else. Never request a third, never fake one.
- **Space Grotesk ships latin and latin-ext only.** Latvian is covered. Cyrillic is
  not, so a russian line would fall back per glyph — and the russian copy contains
  latin words like `ai`, which is exactly the two-faces-in-one-line failure the
  subline rule exists to prevent. The whole russian page therefore drops to the mono
  stack with one rule:

```css
html[lang=ru]{ --body: var(--mono) }
```

- **Mono is not gone, it is deliberate.** The language buttons, the `// label` on the
  cards below the hero, and anything that should read as terminal output stay
  `var(--mono)`. Reading text does not.
- The measure gate waits for **both** faces before anything is measured — Michroma at
  400, Space Grotesk at 400 and 500. Measuring against a fallback is what makes a
  fitted line overflow.

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
- Letter-spacing: `0` body, `0` hero, `0.18em` subline, `0.16em` on uppercase labels.
- Max line length `68ch`. Long paragraphs are wrong here — write short lines.
- Copy is lowercase by default. Uppercase is for labels, status tags, the Michroma
  headline and the lockup subline.
- **Uppercase is set with `text-transform`, never typed into the markup.** The DOM keeps
  the real lowercase sentence, so screen readers don't spell it out letter by letter and
  a copy-paste gives back readable text. `.status` and `.label` already work this way;
  the subline follows them.

### Fit-to-width sizing

Single-line text that must never wrap or overflow — the headline, a subline — is sized
from the space available and the number of character units it needs, not from a guessed
`vw` slope. Divide, then cap:

```css
/* headline: --units is set by JS from measured glyph metrics */
.hero{ font-size: min(2.75rem, calc(min(100vw - 44px, 90vw) / var(--units))); }

/* subline: --tu is set by JS from the measured Michroma line plus tracking */
.tag{ white-space: nowrap; font-size: min(1rem, calc((100vw - 44px) / var(--tu))); }

/* cta: --cu is the measured button line. it divides by the LOCKUP, not by the
   viewport — 100vw counts the scrollbar, and the page scrolls now. */
.lockup{ container-type: inline-size; }
.cta{ font-size: min(var(--t-body), calc((100cqi - 60px) / var(--cu))); }
```

```js
// measured once, after document.fonts.load resolves
cx.font = '400 200px Michroma, ui-monospace, monospace';
tu = cx.measureText(TAG.toUpperCase()).width / 200  // the line as it RENDERS, in em
   + TAG.length * 0.18                              // tracking, one gap per character
   + 0.2;                                           // same slack the headline carries
```

- `44px` covers the `16px` side padding plus scrollbar slack. Don't shave it.
- The headline carries a second `90vw` term. The cap creates the air at desktop widths,
  but between roughly `640px` and `720px` the cap hasn't taken over yet and the raw
  divide would run the wordmark edge to edge. `90vw` holds a margin through that band.
- Any element carrying `white-space: nowrap` **must** be sized this way. Nowrap without
  fit-sizing doesn't prevent wrapping, it converts wrapping into horizontal overflow,
  which `overflow-x: hidden` then silently clips.
- **Measure, don't estimate, anything set in Michroma.** A hand-guessed divisor was
  fine while the subline was mono (`chars × 0.63` covers advance plus letter-spacing on
  a worst-case mono face). Michroma is proportional and the tracking is large, so the
  same guess is off by enough to either clip the line or shrink it for no reason.
  Measure it on a canvas at 200px and divide, exactly like the headline.
- **Measure the string as it renders, not as it's written.** `text-transform:
  uppercase` on Michroma adds roughly 15% to the width, and canvas `measureText` knows
  nothing about CSS. Uppercase the string yourself before measuring, or the line
  overflows on every narrow screen by exactly the amount you forgot.
- **Tracking is one gap per character, including the last one.** `letter-spacing` adds
  its value after every glyph, so the trailing gap is real width — count `chars × em`,
  not `(chars - 1) × em`. It also means the rendered line carries `0.18em` of dead space
  on its right end, which is why the centred block sits a hair left of true centre.
  Leave it; correcting it costs a negative margin and buys nothing visible.
- Estimate mono units as `chars × 0.63` for anything still in mono. Round up. A line
  that fits with 2px to spare on one machine wraps on another.
- **`--tu` is re-measured on every language switch, in the face that line will actually
  render in.** Three strings of different lengths in two different faces cannot share
  one divisor. Measure with the mono font string and `.14em` tracking when the line has
  fallen back, with Michroma and `.18em` when it hasn't.
- **Never measure Michroma before it has loaded.** Wait for `document.fonts.load` in
  *every* mode — reduced motion included — and check `document.fonts.check` before
  trusting the result. Measuring while the mono fallback is still rendering gives a
  short `--tu`, which sizes the line *up* and overflows every narrow screen. This one
  hid for a while because it only shows below ~360px, and only on the path that skipped
  the font wait.
- If Michroma genuinely never arrives, treat the line as mono — mono face, mono
  tracking, mono measurement. The three have to agree.
- Register `--units` and `--tu` with `@property { syntax: '<number>' }` so the division
  resolves.
- **Give `--tu` an `initial-value` that is deliberately too large** (`46` against a real
  ~40 for the uppercase line). The reduced-motion path never measures, so the initial
  value *is* the value there. Erring large means the line is a little small on a narrow
  reduced-motion screen; erring small means it overflows and gets clipped. Only one of
  those is recoverable by the reader. Re-check the number whenever the copy, the
  tracking or the casing changes — all three move it.
- `--units` is now `cells × cw + .4`. It used to carry a caret width; **the headline has
  no caret since v1** (see The lockup), so the budget is cells plus plain slack. If a
  caret ever comes back, the budget has to come back with it.

### The lockup

Everything down the middle of the page is **one composed block**, not elements that
happen to sit near each other. One wrapper, and that wrapper is what gets centred.
Order, top to bottom:

```
.m-zone   mascot + speech bubble
.hero     THE BORING TEK
.tag      the subline
.cta-zone the button + the grey hint line
.card     the form, folded shut until asked for
```

```css
.wrap{ display:flex; justify-content:center; align-items:center;
       padding:clamp(84px,11vh,100px) 16px clamp(12px,2vh,18px) }
/* above 560px, where the socials sit in the bar: */
.wrap{ padding-top:clamp(116px,11vh + 32px,132px) }
.lockup{
  display:flex; flex-direction:column; align-items:center;
  gap:clamp(12px,2.2vh,22px);
  width:100%; max-width:560px;
}
```

- **One child in `.wrap`.** Centring the group is the point; centring five siblings with
  a shared gap makes them read as separate floating pieces.
- Never put a `gap` on `.wrap` itself. It has one child.
- The top padding clears the fixed bar. The bar is `position: fixed`, so it adds no
  height — without that padding the mascot slides under the language buttons on short
  screens.
- **Above `560px` that padding carries another `32px`**, because the socials row is in
  the bar on that side of the line and lands right above the mascot's head. Clearing the
  controls is not the same as looking clear of them: at the old value the gap from the
  icons to the face was `35px` on a 720–768px tall laptop, which read as the row
  balancing on him. It is `67–83px` now. The phone keeps the original padding — its bar
  is two controls and the socials are down in the footer.
- **The landing state must not scroll on desktop.** Mascot, wordmark, subline, button
  and hint come to roughly 330px; that is the budget. Anything new competes for it.
  The hero fills `100dvh` and the landing page does not scroll; any section added later
  goes below the fold.
- **The fixed bar carries a scrim, ready for that.** The moment anything sits below the
  hero, the headline scrolls up under the language and theme controls and collides with
  them. The bar has `linear-gradient(to bottom, var(--bg) 42%, transparent)` and
  `pointer-events: none`, with the buttons set back to `auto`. It is invisible on a page
  that does not scroll — `--bg` fading into `--bg` — so it costs nothing to keep.
  **Not a solid band**: that would occlude the vignette and leave a visible seam in
  dark mode.
- The mascot gets extra breathing room below it — a `margin-bottom` on top of the gap,
  so the character isn't crowding the wordmark. It is a character, not a bullet point.
- `.lockup` caps at `560px` because the form card lives in it. The headline sizes itself
  against the viewport, not against this cap, so the cap costs the wordmark nothing.
- **`.m-zone` is `width: max-content`.** The speech bubble is absolutely positioned
  against it at `left: calc(100% + 12px)`, so that `100%` has to be the head, not the
  560px lockup. Give the zone a full-width box and the bubble flies off to the right of
  the whole column.
- Nothing in the lockup reacts to the pointer except the mascot's eyes. See
  Micro-interactions.

**The headline carries no caret.** A block cursor lived after the wordmark through the
coming-soon phase and was removed at v1: the CTA button now glitches every few seconds
to ask for attention, and two blinking things on one screen fight each other. The button
is the page's one attention-getter. If a caret is ever wanted back, the button's glitch
comes off first.

### The stacked lockup (under 640px)

Below `640px` the wordmark breaks into three centered lines — **THE / BORING / TEK** —
matching the logo lockup. Above it, one line.

- The break is a **layout mode**, not a font-size tweak. Same markup, same cells, same
  decode; only the line split and `--units` change.
- `--units` is recomputed from the longest *line* (6, for `BORING`), not the longest
  string — that's what lets the stacked lockup run much larger than the single line.
- **Always render three line boxes.** Give `.ln` a `min-height` of one line so an empty
  line still holds its space, and the block can't change height under whatever sits
  below it.
- **Rows breathe: `0.35em` between lines.** Set it as a `gap` on the flex column, not
  as margins, and apply it to every layer *and* the sizer so all four stacks stay in
  register. Without it the three rows read as one crushed block, not a lockup.
- Each line centres on its own text. With the caret gone (see The lockup) that is just
  the inherited `text-align: center` — the `.lw` wrapper that used to hold the caret out
  of flow went with it. **If a caret ever returns, `.lw` returns with it**, because an
  inline caret shifts every line off centre by half a cursor.
- The hidden sizer needs the same three-line shape, each line padded to the longest
  line's cell count, so the track width can't move.
- Decode spans the whole lockup from one schedule — flatten all three lines into a
  single character list, shuffle that, then split the output back per line. Three
  independent per-line decodes read as three separate events.

### Subline typing

The subline types itself out **once**, after the headline's first decode resolves, then
stays static forever.

- **A language switch swaps the text statically — it never re-types.** The typing is an
  entrance for the page, not a transition for the string. Re-running it every time
  someone tries RU and comes back to EN turns a one-shot flourish into a tic. Once
  `typed` is true it stays true.
- Switching language re-measures `--tu` and re-tests the Latin check, because the new
  string may be a different length in a different face. See Fit-to-width sizing.

- **Nothing follows the text.** No cursor, no period, no bracket, no rule. The line
  ends on its last letter and the `0.18em` of trailing tracking, and that is the whole
  ending. An earlier build parked a blinking underscore there; it pulled the eye to the
  end of the line and away from the wordmark, which is the wrong place for the only
  moving thing below the headline.
- **The subline carries no full stop**, even though house style ends lines with one.
  Set in caps and tracked wide it is a lockup element, not a sentence — the same reason
  the nav labels and the status tags take no punctuation. Adding one back makes it
  read as a stray glyph floating a third of a space off the last letter.
- One-shot only. Never on a loop, never re-triggered on the headline's later cycles.
- Driven from the same shared rAF loop as the decode. Per-character thresholds with
  jitter, ~1150ms total — jitter is what stops it reading as a metronome.
- **No caret at any point** — not during the typing, not after it. The text simply
  grows. Losing the caret costs the typing very little, because the reveal is already
  legible as typing from its own rhythm, and it keeps the page down to **one blinking
  thing**: the headline's block cursor. That cursor is the terminal signal for the
  whole page and it doesn't want competition eight lines down at a third the size.
- The subline is therefore the only element on the site that animates without a caret.
  If a future line needs one, it takes the headline's `▊`, not a second style.
- Typing must not move anything. Pin the width with a hidden full-text sizer, then let
  the live text grow left-to-right inside that fixed box. Keep the sizer even with no
  caret: without it the centred line slides rightward one character at a time as it
  types, which is far more distracting than the typing itself.
- The sizer holds the same lowercase string as the live text and inherits the same
  `text-transform`, so the two can never disagree about width. Two copies of the string
  live in the markup — sizer and live text — and **both must match exactly**, or the
  typing drifts against its own box. (There used to be a third, the blur duplicate; see
  Glow tiers for why it's gone.)
- **The line must never be readable before it types itself, and the stylesheet is what
  guarantees that.** `.tag-live` ships `visibility: hidden` in the CSS. Two overrides
  put it back: `@media (prefers-reduced-motion: reduce)`, which never types, and a
  `<noscript><style>` in the head, for a page whose script never runs. Nothing else
  unhides it — the typing does, by setting `visibility: visible` on an empty span and
  growing the text inside it.
- **Hiding it from JS is the bug this replaces.** The script blanked the text at
  `DOMContentLoaded`, which is one paint too late: on a slow CPU the parser hands over
  a fully laid-out subline first, and the whole string flashes for a frame before the
  typing wipes it. A stylesheet rule applies at first paint, before any script has run,
  which is the only place this can be fixed.
- **The static path is not a reveal path.** `setTag(str, false)` only unhides when the
  typing is not owed — reduced motion, or a language switch after it has already run.
  `start()` calls it before the decode begins, and that call must leave the line hidden
  or the full string sits on screen for the whole decode, which is the same flash with
  a longer fuse.
- The full text still lives in the DOM for the no-JS and reduced-motion cases, and for
  the sizer to measure. It is hidden, not absent.

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

**Both survive the theme swap, both change value with it.** The dark vignette is the
heavy near-black wash; the light one is a barely-there grey that keeps the white page
from reading as a blank canvas. Grain drops from `.038` to `.026` — the same texture is
more visible on white, so it needs less of it.

### 1. Base

`--bg` on `body`. That's it.

### 2. Vignette — slow radial breathe

A radial that keeps the corners heavy and the centre slightly lifted. The gradient
itself is the `--vig` token, so both themes must declare **the same stop count at the
same positions** or the swap snaps instead of fading.

```css
.vignette{
  position:fixed; inset:-10%; z-index:0; pointer-events:none;
  background-image: var(--vig);
  will-change: transform, opacity;
  animation: breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate;
  transition: background-image .5s ease;
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
  z-index:3; color:var(--fg);
  text-shadow: var(--hero-shadow);      /* zero-alpha in light, phosphor in dark */
  transition: color .5s ease, text-shadow .5s ease;
}
/* layer 2 — blurred duplicate, mid halo */
.glow__blur{
  z-index:2; color:var(--accent);
  filter: blur(.055em);
  opacity: calc(.42 * var(--glow) * var(--glowon));
  transition: opacity .5s ease;
  will-change: opacity;
}
/* layer 3 — wide diffuse bloom */
.glow__bloom{
  z-index:1; color:var(--accent);
  filter: blur(.2em);
  opacity: calc(.24 * var(--glow) * var(--glowon));
  transition: opacity .5s ease;
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

**Glow is dark-mode only.** In light mode `--glowon` is `0`, `--hero-shadow` is the same
stack at zero alpha, and the page carries no bloom at all. Everything below describes
the dark theme; in light it all resolves to flat `--fg` on white, which is correct and
not a degradation.

| Tier | Used on | Layers |
|---|---|---|
| Full | headline | core shadow stack + `blur(.055em)` duplicate + `blur(.2em)` bloom |
| Flat | subline, labels, links, buttons | fill only |

- **The subline carries no glow layers at all since v1.** It used to have a white core
  shadow stack plus a `blur(.14em)` duplicate. Both went, for two reasons: the duplicate
  had to be written in the same frame as the core all through the typing or it trailed a
  white ghost, and in light mode a white blur on white is nothing but cost. `--sub` at
  full contrast carries the line on its own in both themes.
- **The subline is `--sub` and there is no green in it** — not in the fill, not in a
  shadow. Below the headline the page has no phosphor at all, which is what keeps the
  green reading as the headline's own light.
- This still reverses the older rule that the subline was `--p-100` pale white-green.
  Two glowing green lines stacked read as one undifferentiated block of glow and cost
  the headline its hierarchy. Don't restore it.
- `--sub` is not `--muted`. `--sub` is a confident dim tone that reads as a deliberate
  second line; `--muted` reads as an unstyled leftover. `--muted` is for the hint line,
  field labels and timestamps.
- Nothing in the lockup brightens on pointer move. The headline's `--glow` is driven by
  the decode settle beat alone. See Micro-interactions.
- The headline's blur duplicates still have to be written in the **same frame** as the
  core all through the decode. A layer lagging one frame behind shows as a green ghost.
- The `.l-mid` and `.l-wide` opacities now multiply by `var(--glowon)`, so they need
  their own `transition: opacity .5s` — the universal `*` rule doesn't cover opacity.
  Without it the phosphor snaps off mid-fade while the page is still cross-fading.

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

### The CTA glitch

The main button asks for attention on its own: **every 3–5 seconds, a `.34s` shake with
an rgb split on the label.** Random interval, never a fixed beat.

- Scheduled from the shared rAF clock like everything else. Never `setInterval`.
- The class comes off on `animationend`, not by forcing a reflow with
  `void el.offsetWidth`. A layout read every four seconds to restart an animation is a
  layout read you didn't need.
- Split colours are `--gr` / `--gc`, a red and a cyan at `.85` alpha, applied as
  `text-shadow` offsets of 1–2px on the label span only. The border and fill never
  glitch — only the text.
- Travel is 1–3px horizontal. It's a twitch, not a jump; nothing around it moves.
- **It stops the moment the form opens.** Once someone is answering questions the button
  is gone and the page has nothing left to advertise.
- This is the **one** deliberately attention-seeking element on the site, and it is why
  the headline lost its caret. Adding a second is how a terminal turns into a carnival.

### Everything else

- Links: `--accent`, `1px` underline in `--accent`; hover tightens, no colour change.
- Buttons: `1px solid var(--fg)`, transparent fill, `--fg` text, fully rounded.
  **Hover fills solid** — background `--fg`, text `--bg`. Active `scale(.97)`.
- Chips: `1px solid var(--line)`, `--bg` fill, fully rounded. Hover borders `--fg`.
  Selected fills `--accent-soft` with an `--accent` border. Selection is carried by
  `aria-pressed`, never by a class alone.
- Cursor stays default. No custom cursors.
- Tap targets minimum `44px` on mobile — `40px` on chips, which sit in a wrapped grid
  with `8px` gaps and are never the only way forward.
- Focus: `outline: 1px solid var(--accent); outline-offset: 3px;` — visible, never
  removed, checked in both themes.

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
| Ambient | vignette breathe, grain, idle bubble, CTA glitch | 7–40s between events | eased `alternate`, or stepped for grain |
| Entrance | decode, subline typing, settle pulse | 900–1400ms | `--ease` `cubic-bezier(.16,1,.3,1)` |
| Spring | bubble, chips, card unfold, press | 280–520ms | `--spring` `cubic-bezier(.34,1.4,.64,1)` |
| Theme | every colour on the page | 500ms | `ease` |
| Interactive | hover, focus, eye tracking | 90–260ms | `ease-out` |

**The spring tier is new at v1 and it is a deliberate reversal.** This file used to ban
overshoot easing outright, on the grounds that nothing here is playful. That held for a
page whose only job was to sit still and say COMING SOON. A form has to feel like it
responds to being touched, and the way you say "that landed" without a sound or a colour
is a little overshoot. So: `cubic-bezier(.34,1.4,.64,1)`, one curve, used everywhere a
UI element arrives or is pressed. It is **not** licence for bounce, elastic, jelly or
wobble — those are still out. One curve, small overshoot, and nothing overshoots twice.

Where the spring is *not* allowed:

- **Not on the theme cross-fade.** Colour overshooting means colour going wrong on the
  way, and 0.5s is long enough to see it.
- **Not on the card's `grid-template-rows`.** Overshooting `1fr` is undefined-looking
  and clips content. The rows use `--ease`; the inner block carries the spring on a
  `transform`, which can overshoot safely because it isn't the thing doing the clipping.
- **Not on the blink**, which needs to be shorter than its own 120ms hold.

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

### The one scroll reveal

This file used to ban scroll-triggered reveals outright, alongside scroll-jacking and
parallax. That stays true for **chains** — section after section each waiting its turn,
which turns reading into a queue. One exception is now allowed and it is the whole
scope: **the cards in the section below the hero fade and slide up once, when they
first enter view, and never again.**

- `IntersectionObserver`, `unobserve` on the first intersection. No scroll handler.
- Opacity and a 14px `translate3d` only, `.38s` on `--ease`. Nothing else moves.
- The `.reveal` start state is added **by JS**, never written in the stylesheet. A
  stylesheet that hides the cards hides them for good on a page with no script.
- Under reduced motion the class is never added at all — the cards are simply already
  there. Do not "reduce" it to a faster fade.
- The pair staggers by 70ms through `transition-delay` declared against the card's own
  transition list, so the hover lift and the border stay instant.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` must:

- Kill grain and vignette animation (layers stay, static).
- Skip decode — render final text immediately, no scramble.
- Skip the subline typing — the full line, at once.
- Disable mascot eye tracking (text never tracks anything anyway).
- Kill the CTA glitch and the idle bubble entirely. Both are ambient attention-seeking;
  that is exactly what the setting is asking us to stop.
- Skip canvas init.
- Keep hover/focus feedback, but instant.
- **Keep the mascot blink — on every mascot on the page.** It is the one deliberate
  exception: small, local, non-vestibular, and it is what stops a face reading as a
  sticker. Which means the rAF loop still starts under reduced motion, gated so it does
  nothing else. Eye movement stops; the lids do not. If a second mascot is ever added,
  it follows the same rule — two faces on one screen must not disagree about this.
- **Keep the theme cross-fade.** A colour fade is not vestibular motion, and snapping
  the whole page between white and near-black is the harsher of the two. So the reduced
  override is not a blanket `transition: none` — it narrows `transition-property` to
  the four colour properties and holds them at `.5s`:

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation:none!important;
    transition-property:background-color,border-color,color,fill!important;
    transition-duration:.5s!important;
  }
}
```

- **The form still works under reduced motion.** It is event-driven, not rAF-driven, so
  every step, validation and submit runs; only the chip stagger and the card's unfold
  are gone. Check it — a contact form that only works for people who like animation is
  a broken contact form.

This is a real branch in the JS, not just a CSS override:

```js
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
```

## Layout

- Max width `900px`, centered, `20px` side padding (`16px` under 480px). The hero sizes
  itself to fit the viewport (see Fit-to-width sizing) and caps at `2.75rem`.
- Spacing scale, nothing between: `4 8 12 16 24 32 48 64 96 128`.
- Left-aligned. Centered text only for a hero, the lockup and the form's questions and
  chips. Input fields inside the form stay left-aligned — centred field text reads as a
  mistake.
- Borders `1px solid var(--line)`.
- **Radius, revised at v1.** This file used to ban rounded corners outright. That held
  while the page was a wordmark on a black field. The contact flow is made of buttons,
  chips, fields and a comic speech bubble, and square corners on a speech bubble is not
  a style choice, it's a different object. So there are now exactly four radii and
  nothing between them:
  - `999px` — anything that reads as a pill: buttons, chips, the bubble, the dots.
  - `18px` — the form card.
  - `16px` — the cards in the section below the hero, and nothing else.
  - `12px` — input and textarea fields.

  Everything else is still square: rules, dividers, the depth layers, any future table
  or code block. **Radius is for things you press or things that speak.** It is not a
  general softening pass, and there is no `4px`/`6px`/`8px` tier to reach for.
- No box shadows. Depth comes from the glow and vignette layers, never from a drop
  shadow on a card.
- Fluid-first: `clamp()`, `min()`, `max()` and intrinsic sizing over breakpoints.
  **Three width breakpoints exist and that is the ceiling:** `720px` for the card grid,
  `640px` for the stacked lockup (in JS, `mqS`), and `560px` for the socials, which is
  the only one that moves a block from one end of the page to the other. A fourth is a
  decision, not a convenience.

### The socials row

Six links: telegram, x, youtube, tiktok, instagram, facebook, in that order. **One row,
in one of two places.** Above `560px` it sits in the fixed top bar. Below, it moves to a
footer at the bottom of the page and the bar goes back to the two controls it shipped
with. Never both at once, and never a second bar row.

- **The glyphs are Tabler Icons, MIT licensed** (tabler.io/icons, © Paweł Kuna) — the
  `outline` set, `brand-telegram`, `brand-x`, `brand-youtube`, `brand-tiktok`,
  `brand-instagram`, `brand-facebook`, taken verbatim from
  `@tabler/icons/icons/outline/`. Copy the `d` attributes and nothing else: the wrapper
  attributes live in the stylesheet, and Tabler's leading `<path stroke="none"
  d="M0 0h24v24H0z" fill="none"/>` bounding box is dropped — it exists for their export
  pipeline and does nothing inline. MIT needs the licence kept with the source, not
  reproduced in the page; the attribution is this line.
- **Inline SVG, stroked not filled.** `viewBox="0 0 24 24"`, `22px` on screen in a
  `40px` box, `fill: none`, `stroke: currentColor`, `stroke-width: 2`, round caps and
  joins. Tabler is drawn on the same 24 grid as the theme toggle and at its own
  stroke-width 2, which is what keeps the six consistent with each other; the toggle
  stays at 1.6 because it is smaller. No icon font, no image file, no CDN — the paths
  ship in the page.
- **The paths are declared once, in an inline `<symbol>` sprite,** first thing in the
  `<body>`, `.sprite { display: none }`, and both rows reference them with
  `<use href="#i-telegram">`. This is the one sprite the site allows and it is inline:
  the ban is on fetching a sprite sheet, not on writing a path once. `stroke`, `fill`
  and `stroke-width` are inherited properties, so the CSS on the outer `<svg>` reaches
  the cloned content and `currentColor` still follows the theme.
- **Two rows of markup, one glyph set, no JS.** CSS cannot move a node from a fixed
  header to the end of the document, and moving it with a `matchMedia` listener buys
  nothing: the footer has to be hidden on desktop either way, so the breakpoint exists
  regardless. The hidden row is `display: none`, so it is out of the accessibility tree
  and out of the tab order — there is never a duplicate landmark or a phantom stop.
- **`stroke-linecap: round` is load-bearing, not decoration.** Instagram's shutter dot
  is `M16.5 7.5v.01`, a zero-length line that only renders as a dot because of the cap.
  Drop the cap and the dot disappears.
- **No brand colour, ever.** They are `--muted` at `.5` opacity — the exact rest state
  of an inactive language button — and they darken to `--fg` at opacity 1 on hover.
  Six logos in six brand colours in the top bar would out-shout the mascot, the
  headline and the CTA at once.
- **Sized so the row is quiet, not small.** `22px` glyph, `40px` square hit box, `6px`
  gap — `270px` for the six, which is the row's flex basis. They sit at `--muted` and
  `.5` opacity, the same rest state as an inactive language button, so the row reads as
  one dim strip until someone points at it.
- **Hover is a lift plus one flick.** `translateY(-2px)`, and a single `.2s`
  `steps(1, end)` rgb split on the icon, running once per hover. Same `--gr` / `--gc`
  as the CTA glitch at half the travel, so it reads as the same page. `drop-shadow()`,
  not `text-shadow`: these are strokes, not glyphs. Hover only — nothing in this row
  ever animates on its own. The CTA is still the page's one attention-seeker.
- **`target="_blank"` and `rel="noopener"`** on all six, in both rows.
- **The 32px the hero gains above 560px comes back off the bottom of the page.**
  `.below` drops to `padding-bottom: clamp(32px, 10vh - 32px, 64px)` in the same media
  query, so the document is exactly as tall as it was before the row existed and the
  landing state still fits one screen at 1440×900. Verified identical at 1024×768,
  1280×720, 1366×768, 1440×900, 1920×1080 and 2560×1200. The air below the cards is the
  cheapest 32px on the page; the air above the mascot is not.
- **The footer is the phone's version of the row, and nothing else.** `<footer class=
  "foot">`, a sibling after `section.below`, holding the row and one line:
  `theboringtek 2026`, mono, `--t-micro`, `--muted` at `.75`, tracked `.14em`,
  lowercase, no full stop, no dash between name and year. It is column-flex, centred,
  `16px` between the two, and `clamp(32px, 6vh, 48px)` of bottom air — the gap above it
  is `.below`'s own bottom padding, not a margin of its own. It does not exist on
  desktop: `display: none`, not a stretched-out variant.
- **In the bar the row is absolutely positioned, not a flex item:**
  `position: absolute; top: 12px; left: 50%; transform: translateX(-50%)`. It is centred
  on the page, not in the gap between the language block and the toggle — those two are
  `100px` and `44px`, so a flex centre sits `28px` right of true centre, and on a wide
  screen that reads as a mistake. Measured at 560 through 2560: centre error `0px`.
  Out of flow also means the bar cannot wrap, whatever is in it.
- **`560px` is where it moves, and the number comes from the geometry.** Page-centred,
  the row's left edge is `W/2 - 135`; it has to clear the language block's `112px` with
  air to spare. That needs about `518px`, and `560` leaves a `32px` gap at the
  narrowest desktop. The old wrap point (`464px`) is too early for a centred row: the
  icons would sit on the language buttons.
- **Below that the row is in the footer, and the bar keeps nothing new.** A second bar
  row was the first attempt and it is gone: at `320px` it left `2.9px` between the icons
  and the mascot's crown, and it pushed the theme toggle around. The footer has room,
  which is the whole argument.
- The icons never shrink: `flex: 0 0 auto`. `270px` of row fits inside `320px` of
  viewport with the page's `16px` padding on both sides and `18px` to spare.
- **The pill's clamp is measured, not a constant.** `barBottom()` reads the theme
  toggle, plus `8px`. The bar is one row again, and the socials — when they are up there
  at all — are absolute and end above it, so the toggle is the lowest thing in the bar.

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

**The mascot inverts with the theme.** Face `--face`, eyes `--eye`, and `--eye` is
always the page background.

| | face | eyes |
|---|---|---|
| dark | `#f4f7f5` | `#06070a` |
| light | `#0b0d10` | `#ffffff` |

- The eyes are the page background colour in **both** themes, so the face always reads
  as a hole punched in the page rather than an illustration sitting on top of it. That
  invariant is the reason he inverts at all — keeping him white on white would have
  meant giving him an outline, and he has never had one.
- Both fills cross-fade over the same 0.5s as everything else. The `.m-eye` rule
  re-declares `transition` for its transform, so it must carry `fill .5s ease` too or
  the eyes snap while the face fades.
- The standalone `assets/*.svg` files and the favicon stay **white face, dark eyes** —
  literal hex, the dark-mode version. They are used as avatars on dark surfaces, and a
  favicon can't know the page theme.
- Any variant keeps the geometry byte-identical and only swaps the two fills. Never
  recolour the face green, never tint the eyes, never add a third colour.

### Wide eyes

When the contact form opens, **the eyes go wide** — `--wide: 2.2`, a scaleY on each eye
rect about its own centre — and return to `1` on restart.

- It rides the same `scaleY` as the blink: `scaleY(calc(var(--blink) * var(--wide)))`.
  Multiplying rather than adding a second transform means he can still blink while
  surprised, which is the point.
- **`.m-eye` carries no transform transition at all**, because `--blink` is written per
  frame and a transition would smear the lid. So the wide-eye change snaps — which is
  correct, surprise is instantaneous. Adding a transition back to get a softer wide-eye
  would quietly wreck the blink instead.
- The mascot is also a **click target** for the form, alongside the button:
  `role="button"`, `tabindex="0"`, a real `aria-label`, and Enter/Space handled. He is
  the most clickable thing on the page; not wiring him up was the bug.

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
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex) * 1px),calc(var(--ey) * 1px))}
.m-eye{
  fill:var(--eye);
  transform-box:fill-box; transform-origin:center;
  transform:scaleY(calc(var(--blink) * var(--wide)));
  transition:transform 90ms ease-out, fill .5s ease;
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
- Register `--ex`, `--ey`, `--blink` and `--wide` with
  `@property { syntax: '<number>' }`.

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

A **human lid**, not a squash: eases shut, holds shut a beat, eases back open, and now
and then goes twice. Every mascot on the page uses the same engine.

```
1.00  0.97  0.88  0.74  0.54  0.28  0.06 . 0.06 . 0.27  0.46  0.61  0.74  0.85  1.00
      |--------- 95ms ease in --------|  45ms  |-------- 140ms ease out --------|
```

- Every **3–5 seconds**, randomised each time — never a fixed interval. Roughly a 1 in 5
  chance the blink repeats after ~`120ms`, which is what a real double blink looks like.
- Lid floor is `.06`, not `0`. A hard zero makes the eye vanish for a frame.
- **Driven per frame from the shared rAF loop, not by a CSS transition.** The shape of
  the close is the whole point; a `transition` gives a linear squash that reads
  mechanical, and it also fights any other transform on the same element.
- Because it is per-frame, `.m-eye` carries **no transform transition at all** — only
  `fill`. The wide-eye reaction then snaps, which is correct.
- `--blink` is written **only while a blink is actually running**, and only when the
  value changes. Between blinks the cost is one comparison per frame.
- This replaces the old instant `scaleY(.16)` squash with a `55ms` CSS transition. Do
  not go back to it: it could not double-blink, and it could not ease.

### Touch and reduced motion

- **Eyes stay centred, blink continues.** No tracking on touch (`pointer: coarse`) and
  none under `prefers-reduced-motion`.
- The blink is the **one deliberate exception** to reduced motion on this site: it is
  small, local, non-vestibular, and it is what keeps the mascot from reading as a dead
  sticker. Everything else still shuts off.
- That means the rAF loop **starts even under reduced motion** — gated so that decode,
  typing and eye tracking never run, and the loop does nothing but blink. One loop.
- The blink is **unaffected** by the reduced-motion CSS override. It is written per
  frame in JS, not run off a transition or a keyframe, so narrowing
  `transition-property` and killing `animation` leaves it exactly as it is. That is
  deliberate: the lid should look the same in both modes.

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

## Speech bubble

Comic style, anchored to the **top right of the head**: three round dots climbing
diagonally up and right — small, bigger, biggest — then a pill with the line in it.

```
                                    ( ok. noted. )
                              ●
                          ●
     ( ◕ ◕ )         ·
```

- Structure is a flex row, `align-items: flex-end`, `5px` gap: `.d1` `5px`, `.d2` `7px`
  with `8px` bottom margin, `.d3` `10px` with `18px`, then `.pill` with `27px`. The
  climb is the increasing bottom margin, not a rotation.
- **The gap from the head to the first dot is bigger than the gaps between the dots.**
  `left: calc(100% + 12px)` against the `5px` flex gap. That first gap is what makes the
  dots read as coming *from* him rather than stuck *to* him.
- Dots and pill are `--bg` fill with a `--bub` border. `--bub` is a real outline weight,
  not `--line`; a comic bubble needs an edge you can see, and `--line` disappears on
  white.
- Entrance staggers outward — dot, dot, dot, pill at `0 / 70 / 140 / 210ms`, each on
  `--spring`. The delays live **only** in the `.on` rules, so dismissal has no stagger
  and the whole thing leaves at once. Speech arrives in order; silence is instant.
- `pointer-events: none` and `aria-hidden="true"`. It is a character doing a bit, not
  content. Every line it says is either decorative or duplicated in real UI text.

### Keeping it on screen

At 320px there is about 60px to the right of the head. That is not enough for a pill,
and no media query fixes it cleanly. Six things make this work; all six were found by
measuring the rendered page, and every one of them looks optional until it isn't.

- **`.bubble` needs `width: max-content`.** An absolutely positioned box shrink-to-fits
  against its containing block, and `.m-zone` is only as wide as the head. Without this
  the pill is squeezed to its minimum width and wraps a three-word line onto two rows
  **even on a 1440px screen**, which reads as a layout bug rather than a bubble.
- On show, and whenever the layout under it moves, the pill measures itself once. If its
  right edge would pass `innerWidth - 12`, it takes `--pshift` (negative, exactly the
  overflow) and `--pshiftY: -26px` — sliding left over the head and lifting clear of the
  dots. The dots never move.
- **`--pshift` is a negative `margin-left`, not a translate.** A transform leaves the
  flex container's box out at the pill's untransformed right edge, so document
  `scrollWidth` passes the viewport and the page scrolls sideways. A negative margin
  shrinks the container, so the overflow never exists at all.
  **`overflow-x: clip` on the root does not save you here — it was tried and the page
  still scrolled the full 60px.** Fix the box, don't hide it.
- **`--pshiftY` stays a transform, and `translate`/`scale` are set as independent
  properties rather than one `transform`.** The transition then springs `scale` on
  entrance without also animating the vertical correction. If the correction rides the
  spring, the pill visibly lags behind the head all the way through the card's unfold.
- **Measure with `offsetLeft` / `offsetTop` / `offsetWidth`, never
  `getBoundingClientRect()` on the pill.** It is mid-entrance at `scale(.7)` when this
  runs and a client rect is transformed — it reports the pill narrower than it will be
  and under-shifts every time. Take the *bubble's* client rect for the origin, then add
  the pill's untransformed offsets.
- **Clamp the top to below the fixed bar, not to `0`.** With the card open the lockup is
  tall enough that the head rides up and the bubble runs out of sky before it runs out
  of room to the right — at which point the pill lands on the theme toggle. A live
  control beats bubble placement: the pill comes down to meet the dots instead.
- **Guard that clamp on the head still being at the bar** (`br.bottom > BAR`). It is the
  one part of the fit that reads the viewport rather than the mascot, and unguarded it
  is a bug: scrolled down to the section, `br.top` goes deeply negative and the clamp
  pushed the pill **480px** below the head, floating in the middle of the page. Off
  screen there is no bar to avoid. A speech bubble may drift for nothing else — the
  horizontal page-edge shift is the only other correction allowed, and it is
  scroll-invariant.
- **Re-fit whenever the card resizes.** `say()` runs before the card unfolds, so a fit
  computed then is stale by the time the head has risen. A `ResizeObserver` on the card,
  gated on the bubble actually being visible, is what keeps it glued during the unfold.
- The pill's own `max-width: min(250px, calc(100vw - 28px))` guarantees it can always
  fit once shifted, and lets long lines wrap to two or three rows.
- One layout read per line shown. **Never in the frame loop.**

### What it says

| Trigger | Line |
|---|---|
| idle, every 8–14s, form shut | one of: `boring...` / `still boring...` / `waiting...` / `so quiet...` |
| form opens | `oh. a customer.` |
| between steps | `mhm.` / `classic.` / `ok. noted.`, in order |
| arriving at the last step | `almost done.` |
| after send | `ok. we will look. go do business.` |
| after send, question path | `got it. we will answer soon.` |

- Timed lines hold **2.8s** then fade. The post-send line is the only permanent one — it
  is the receipt, so it stays until the visitor starts again.
- Idle chatter runs **only while the form is shut**. Once someone is answering questions
  he stops being bored at them.
- Every line is translated. Dry, lowercase, three words where two won't do. He is
  unbothered, not chatty — if a line sounds like it's trying to be funny, cut it.

## The contact form

One question per step, in a card that unfolds under the lockup. It opens from the CTA
button **or from pressing the mascot**.

### Opening

1. Eyes go wide, bubble says `oh. a customer.`
2. Button and hint fade out over `260ms`, then go `display: none`.
3. Card unfolds: `grid-template-rows: 0fr → 1fr` on `--ease`, with the inner block
   springing in from `translateY(-10px) scale(.97)`. Progress dots at the top.

**A class added in the same frame that `display: none` came off does not transition.**
There is no "before" style to animate from, so the card snaps open with the inner
transform never leaving `none` — and it looks exactly like a working animation you
forgot to write. One `requestAnimationFrame` is not enough of a gap; **use two.** The
same applies to the CTA fading back in on restart.

### The paths

```
step 1  what brings you here          (single pick)
        ├─ check my business ────┐
        ├─ a problem to solve ───┴──▶ A
        ├─ not sure what i need ────▶ B
        └─ just a question ─────────▶ C

A   what do you want (multi) → [explain in your words, if picked] → how big → fields
B   what eats your time → how customers reach you → how big → fields
C   your question + email → send
```

- **Steps are computed, never stored.** `steps()` derives the list from the answers each
  time it is called, so picking "i will explain myself" grows the list by one and the
  progress dots follow automatically. A hardcoded step count goes stale the moment a
  branch changes.
- **On step one the progress row renders empty and keeps its height.** How many steps
  there are genuinely depends on the answer that hasn't been given yet, and a single
  lone dot both claims "one step total" and reads as a stray bullet on the card. Empty
  is the honest state; inventing a plausible count is not.
- The final fields step: business or your name (**required**), registration number
  (optional), website (optional), country, your email (**required**).
- **Single-pick steps advance themselves** after `240ms` and carry no forward button.
  Multi-pick and text steps need one. Back is available from step 2 on, always.
- Chips stagger in at `55ms` intervals on `--spring`; the question block fades and
  slides `8px` on `--ease`. Re-rendering a whole step to show one chip as selected
  replays the whole stagger — set `aria-pressed` in place instead.

### Validation

Inline, small, `--red`, directly under whatever is wrong. One message at a time.

| | |
|---|---|
| no name | `we need a name` |
| bad or missing email | `we need your email to reply` |
| nothing picked | `pick at least one` |
| empty textarea | `write your question first` |
| submit failed | `could not send. try again.` |

- Never a modal, never a toast, never a red border with no words.
- Clear the message on the next interaction, not on a timer.

### Submit

**Two destinations, fired together, and one arriving is a delivered form.**

| | |
|---|---|
| `https://api.web3forms.com/submit` | email. takes `access_key` + `subject`, then the fields |
| `https://boring-tek-forms.theboringtek.workers.dev` | telegram, our own worker. fields only, no key |

```js
Promise.allSettled([post(W3_URL, mail), post(TG_URL, fields)])
```

- **Success is at least one fulfilled.** The red line only appears when *both* fail.
  A visitor should never retype a form because one mail relay was down.
- **A fetch that resolves with a 4xx still counts as fulfilled**, so the wrapper has to
  check `r.ok` and throw. Skip that and `allSettled` reads a rejection as a delivery and
  the page cheerfully shows a check mark for a form nobody received.
- **The web3forms key is public by design.** It is a write-only submission token, it is
  meant to ship in the page, and it is not a secret under the Public repo rules. The
  worker takes no key at all — never send it one.
- **Only web3forms gets `access_key` and `subject`.** The worker gets the bare fields.
- **The payload is English regardless of the visitor's language**, built from the `en`
  dictionary, plus a `language` field recording what they actually used. Keys are
  readable words (`business_size`, `time_sink`, `customers_reach`), not chip ids.
- **Key order is the field order in the email**, so it reads top to bottom the way the
  visitor answered: path, choices, free text, name, registration number, website,
  country, email, then language as a footnote.
- Only the fields that path collected are sent. A question-path submission carries a
  question and an email, not five blank business fields.
- **Never log the payload.** Not to `console`, not on failure, not "just while
  debugging". It is someone's name, business and email address.
- While sending, the button is genuinely `disabled` and carries a `.busy` class — an
  eased `alternate` opacity breathe that ends when the request does. The disabled
  attribute is the real state; the animation only says so out loud.
- On success: a drawn check mark, `sent`, the permanent bubble line, and a
  **start again** button that fully resets state.
- On failure: the red line, the send button re-enabled, nothing else lost. Never clear
  someone's answers because the network failed.
- `W3_KEY` holds the real web3forms token. It is committed on purpose — see above.

## The section below the hero

The first thing under the hero, and the shape every later section copies.

- **It is a sibling of `main.wrap`, never a child of `.lockup`.** The lockup grows when
  the form unfolds; anything inside it rides the unfold and the card's row animation.
  Outside it, the section is untouched by both.
- **The hero sizes to its content — it no longer holds `min-height: 100dvh`.** It did,
  and centring the lockup inside a full viewport put 200–300px of slack between the
  hint and this section. The thread was never why that gap read long. With the slack
  gone the cards start 50–60px under the hint at every width, and on a 1440×900 desktop
  the whole page — hero and cards — fits one screen with no scroll.
- **The trade:** with no slack to absorb it, opening the form now pushes this section
  down the document by the card's height. That is ordinary flow, it happens off screen
  while the visitor is looking at the form, and it does not touch the unfold itself.
- **The thread.** A 1px rule, 22px tall, centred, `linear-gradient(to bottom,
  var(--line), transparent)`. It leads the eye down out of the hint. It is
  `aria-hidden`, it never animates, and it is the only decoration the section gets.
- **Wider than the lockup, deliberately:** `max-width: 860px`, `16px` side padding. The
  lockup is a centred block of display type and stays at 560px; the cards are reading
  text in columns and need the room. 860px puts each of the top two at 408px on a
  desktop, which is about 52ch — inside the line-length rule with air to spare.
- **Three cards.** Two side by side above `720px` — the one structural breakpoint the
  page already uses — one full width under them, all three stacked below it.
- Card: `1px solid var(--line)`, `16px` radius, `var(--field)` background. Hover
  darkens the border to `--muted` and lifts it 3px on a transform. No shadow.
- Each card is a mono `// label` in caps at `.16em`, then body copy in `--body`.
  The `//` is a `::before`, not typed into the markup.
- Every string is keyed off the same `T` dictionary as the rest of the page, through
  `data-k` attributes, and re-painted on every language switch.
- The reveal is the one scroll animation on the site — see Motion budget → The one
  scroll reveal.

## Terminal texture

Use sparingly — one or two per page, not all of them.

- **Prompt lines:** `>` or `boringtek:~$` in `--accent` before a line.
- **Blinking caret:** not on the landing page — see The lockup for why the headline's
  was removed. If a future page has no glitching CTA competing for the eye, one `▊` at
  `1.05s step-end infinite` may come back. One per page, ever, and off under reduced
  motion.
- **Section labels:** uppercase, `--muted`, letter-spaced — `// SERVICES` or
  `[ 01 ] SERVICES`. Pick one convention per page and hold it.
- **Rules:** a `1px` `--line` divider.
- **Status tags:** `[ONLINE]` in `--accent`. Bracketed, uppercase.
- **ASCII art:** wordmark only, `--muted` or `--accent`, in `<pre>` with
  `aria-hidden="true"` and a real text alternative nearby.

## Copy rules

- Lowercase. Short lines. Full stops.
- Say what it does. Banned: leverage, empower, solutions, synergy, seamless,
  cutting-edge, revolutionize, unlock, transform your business, next-generation.
- No emoji. No exclamation marks. No rhetorical questions in headings.
- **No punctuation dashes in user-facing copy, in any language.** No em dash, no en
  dash, no hyphen standing in for one. A comma or a full stop does the same work and
  reads plainer, which is the voice. Applies to every visible string: cards, hints,
  form questions, chip options, placeholders, validation lines, bubble lines, and the
  subject line the form mails us.
  **Hyphens inside words stay** — `e-pasts`, `что-то`, `cutting-edge` when quoting it. Those are
  spelling, not punctuation, and removing them misspells the word.
  The trap is translation: RU and LV reach for the em dash where English uses a comma,
  so this has to be re-checked every time copy is added in either language. Code
  comments and this file are not user-facing and are unaffected.
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
file - the two-theme token set, the head bootstrap, the Michroma cell grid, the decode
loop, the glow stack, the depth layers, the bubble, and the whole form flow. **Read it
before building a new page, and copy from it rather than from memory.** Reproducing it
here only guarantees the copy goes stale, which is what happened to the version this
section used to hold.

The shape a new page starts from:

```
<head>
  meta, canonical, og, twitter, favicon data URI     <- keep as they are
  hreflang en / ru / lv / x-default                  <- all three documents
  <link> michroma + space grotesk                    <- the one load-time request
  <style>
    @property --ex --ey --blink --wide --beat --units --tu
    :root{ light tokens }   html[data-theme=dark]{ dark tokens }
    *,*::before,*::after{ transition: the four colour properties, .5s }
    depth layers, bar, lockup, hero, tag, cta, bubble, card
    @media (prefers-reduced-motion: reduce){ narrow transition-property, kill animation }
  </style>
  <script>
    apply data-theme, and lang from url > saved > navigator   <- before paint
    replaceState the clean path for that language
    var T = { en:{}, ru:{}, lv:{} }                  <- every visible string
    boot() on DOMContentLoaded:
      rewrite static copy from T
      measure michroma -> --cw, --units, --tu
      build the cell grid, then ONE rAF loop:
        blink | eyes | bubble | glitch | typing | decode
  </script>
</head>
<body>
  .vignette  .grain                                  <- aria-hidden
  svg.sprite                                         <- the six socials, once
  header.bar     -> .langs (EN RU LV)  |  .socials (absolute, 560px+)  |  .theme
  main.wrap > .lockup
    .m-zone   -> .m-wrap > svg.mascot  +  .bubble
    h1.hero   -> .sr + .sizer + .l-wide + .l-mid + .l-core
    p.tag     -> .tag-size + .tag-live
    .cta-zone -> button.cta + p.hint
    section.card > .cardin > .pad                    <- rendered by JS
  section.below                                      <- sibling of main, not lockup
    .thread  +  .cards > article.cd > p.cl + p.ct
  footer.foot    -> .socials  +  p.foot-t            <- under 560px only
</body>
```

- **The `<script>` is in `<head>` and is not deferred.** See Non-negotiables.
- The markup ships English copy so the page still reads with JS off; boot rewrites it
  from `T` before paint work matters.
- Four `.hero` layers, each holding three `.ln > .t` lines. Cells are built into `.t`.
- `.pad` is empty in the markup. The form is rendered a step at a time, never
  pre-built and never hidden with CSS.

## Not allowed

Original list, still in force:

- Fake typing animations that delay real content.
- Matrix rain.
- CRT curve distortion.
- Scanlines heavy enough to hurt readability.
- Terminal window chrome with traffic-light dots.
- Gradients on text, glassmorphism, drop shadows on cards.
- Scroll-jacking, parallax, and reveal *chains* — a sequence of sections each waiting
  its turn as you scroll. One card group fading up once is not a chain; see Motion
  budget → The one scroll reveal.
- Emoji anywhere in the UI.

**Lifted at v1** — these were on the list and are now allowed, in exactly the scopes
named and nowhere else. Do not re-ban them, and do not widen them:

- **Rounded corners**, on the three radii in Layout only. Everything else is square.
- **Springy overshoot easing**, on `--spring` only, and never on colour or on the card's
  row animation. See Motion budget.
- **Shake**, on the CTA glitch only, 1–3px, every 3–5s, dead while the form is open.
- **A white background**, as the default theme. See Color.

Added:

- **Default CSS color keywords or shorthand hexes.** No `green`, `white`, `black`,
  `lime`, `#000`, `#fff`. Tokens only — including in light mode, where `--bg` happens
  to be white.
- **Pure `#00ff00`** or any unmodified sRGB primary. Phosphor ramp only.
- **One green for both themes.** `#35ff6a` is unreadable on white. Light gets its own.
- **Glow in light mode.** `--glowon` is `0` and stays `0`.
- **Mismatched gradient stops between themes.** They stop interpolating and the swap
  snaps mid-fade.
- **A blanket `transition: none` under reduced motion.** It kills the theme cross-fade,
  which is the harsher option. Narrow `transition-property` instead.
- **Reading `prefers-color-scheme` to pick the default theme.** Light, always, until the
  visitor says otherwise.
- **Deferring the theme bootstrap**, or putting the script at the end of `<body>`. Both
  put a white flash in front of every dark-mode visitor.
- **Untrapped `localStorage` access.** Private windows throw on it.
- **Linear infinite anything** — spins, rotations, orbits, marquees, constant-rate
  drifts. Stepped grain is the only exception.
- **Comic effects beyond the lifted list** — bounce, elastic, jelly, wobble, confetti,
  anything that overshoots twice.
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

- **Any third webfont**, any extra Michroma weight or style, any Space Grotesk weight
  beyond 400 and 500, any other external host. One `<link>`, two families.
- **Self-hosting or inlining Michroma** as a base64 `data:` URI. It bloats the single
  file past any sane budget — use the Google Fonts link.
- **Synthetic bold on Michroma** — `font-weight: 700`, `-webkit-text-stroke`, or a
  duplicated offset layer faking heft. It has one weight; that's the design.
- **Michroma on body text, form buttons, chips, fields, nav or status tags.** The
  headline, the lockup subline and the cta are the whole list.
- **Michroma on a non-Latin string.** It has no Cyrillic and no Latvian diacritics, so
  the line falls back per glyph and breaks a word across two faces. Test the string and
  drop the whole line to `--mono`.
- **One `--tu` for all three languages.** Different lengths in different faces cannot
  share a divisor. Re-measure on every switch.
- **Michroma at small sizes without caps and the `0.18em` tracking.** Lowercase,
  default-tracked Michroma under 1rem is a smudge. All three ship together.
- **Measuring Michroma without applying the same `text-transform` the CSS will.** Caps
  are ~15% wider; the line overflows by exactly what you skipped.
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
- **Mascot motion beyond eye tracking, the blink and the wide-eye reaction** — bobbing,
  floating, rotating, scanning, colour cycling, idle drift.
- **Any transform transition on `.m-eye`.** The lid is written per frame; a transition
  smears it, and a long one stops the blink landing at all.
- **Springing the wide-eye reaction.** Surprise snaps.
- **A winking or fading blink.** Both eyes, together, on the same lid curve.
- **A second rAF loop or a `setInterval`** for the eyes or the blink. Both ride the
  shared loop and the existing pointer handler.
- **Reading the mascot's rect inside the frame loop.** Measure it in `remeasure()`
  alongside the headline's.
- **Raising the eye-travel caps** without redoing the containment arithmetic. `±6` and
  `±3.8` units is what keeps the eyes on the face; at full deflection the worst eye
  corner sits 26.2 units from centre, inside `r=30` with 3.8 to spare.
- **Eye tracking on touch, under reduced motion, or while the form is open.** Centred
  eyes, blink only. Once he's wide-eyed at a customer he stops following the cursor.
- **Recolouring the mascot** beyond swapping the two fills. No green face, no tinted
  eyes, no third colour, no gradient. The theme swap is a fill swap, nothing more.
- **`--eye` set to anything but `--bg`.** The eyes are a hole in the page in both
  themes; that invariant is why he can invert without gaining an outline.
- **Leaving `fill` off the `.m-eye` transition.** That rule re-declares `transition`, so
  it drops the universal colour fade and the eyes snap while the face fades.
- **A separate favicon file**, or a favicon using a pose variant. Inline `data:` URI,
  neutral pose, transparent, and always the dark-mode colourway.
- **A separate cap for the stacked mobile lockup.** `2.75rem` is uniform everywhere.
- **A `gap` on `.wrap`**, or the lockup's children as loose siblings. One `.lockup`
  child, centred as a group.
- **A full-width `.m-zone`.** The bubble is anchored to `100%` of it, so it has to be
  `width: max-content` or the bubble flies off the right of the whole column.
- **A `--muted` subline.** The subline is `--sub`. `--muted` reads as an unstyled
  leftover under a headline; it is for the hint line, field labels and timestamps.
- **Green anywhere in the subline** — fill or shadow. There is no phosphor below the
  headline.
- **A full stop on the subline**, or anything else after the text.
- **Typing the subline's caps into the markup.** `text-transform` does it; the DOM keeps
  the readable lowercase sentence.
- **Any pointer reaction on text** — leaning, translating or brightening the headline
  or subline on mouse move. The mascot's eyes are the only thing that reacts.
- **Shrinking the headline's glow radii verbatim for smaller text.** Layer count comes
  down, relative radii go up. See Glow tiers.
- **Writing a text layer without its glow duplicates in the same frame.** The blurred
  copy lagging behind shows as a green ghost.
- **Letting the stacked lockup collapse to two line boxes.** Three boxes always, or the
  block changes height under whatever sits below it.
- **Row gap as margins on `.ln`.** Use the flex `gap`, and put it on the sizer too or
  the four stacked layers drift out of register.
- **Decoding the stacked lines independently.** One schedule across the whole lockup.
- **Looping or re-triggering the subline typing.** Once, on load, then static forever —
  a language switch swaps the text, it does not re-type it.
- **Bringing back a caret** while the CTA glitch is on the page. One attention-getter.
  If a caret returns it takes the `.lw` wrapper and the `--units` caret budget with it,
  and `font-family: var(--mono)` on the caret, always.
- **Dropping the subline's hidden sizer.** It is what stops the centred line sliding
  right one character at a time as it types.

Added with the theme, the bubble and the form:

- **A `.5s` transition on hover or press.** The universal colour rule is `.5s`;
  interactive elements re-declare their own faster transition and win on specificity.
  Check that every button, chip, field and dot does.
- **Layout reads in the frame loop for the bubble.** Measure the pill on show, on
  resize, and when the card resizes. Never per frame from the rAF loop.
- **Measuring the pill with `getBoundingClientRect()`.** It is mid-entrance at
  `scale(.7)` and a client rect is transformed — it under-shifts every time.
- **A media query to fix the mobile bubble.** The shift is computed; there is no width
  at which the pill both fits beside the head and stays readable.
- **Moving the dots when the pill shifts.** They stay put; the pill lifts over them.
- **An absolutely positioned bubble without `width: max-content`.** It shrink-to-fits
  against the head and wraps short lines at any viewport width.
- **Shifting the pill with a transform instead of a negative margin.** The container's
  box stays out past the viewport and the page scrolls sideways. `overflow-x: clip` on
  the root does not stop it — this was measured, not assumed.
- **Rolling the pill's position correction into the same `transform` as its entrance
  scale.** The correction inherits the spring and lags behind the head.
- **Clamping the bubble to the viewport top instead of below the bar.** It parks the
  pill on top of the theme toggle.
- **A constant for the bar's height.** It is two rows tall under 385px of bar. Measure
  it.
- **Adding a transition class in the same frame `display: none` came off.** Two rAFs,
  or it snaps and looks like an animation you forgot to write.

- **A CSS-transition blink.** It cannot ease and it cannot double-blink.
- **A transform transition on `.m-eye`.** The blink is written per frame; a transition
  smears it.
- **Measuring Michroma before `document.fonts` says it is there** — in any mode.
- **A solid background on the fixed bar.** Scrim to transparent, or the vignette gets a
  visible seam.
- **Bubble text that isn't `aria-hidden`,** or that carries information nothing else on
  the page says. He comments; he does not instruct.
- **Idle chatter while the form is open.** He stops being bored once someone answers.
- **A stored step count, or a hardcoded number of progress dots.** Steps are derived
  from the answers every time.
- **Re-rendering a whole step to show one chip as selected.** It replays the stagger.
  Set `aria-pressed` in place.
- **Selection carried by a class instead of `aria-pressed`.** The state has to be real.
- **A modal, a toast, or a bare red border** for validation. Small red words, under the
  thing that's wrong, one at a time.
- **Clearing someone's answers because the network failed.**
- **Posting the visitor's language in the payload body.** English labels, plus a
  `language` field. An inbox you can't read is worse than no inbox.
- **Treating `allSettled` fulfilment as delivery** without checking `r.ok`. A 4xx
  fulfils, and the page shows a check mark for a form nobody got.
- **Failing the submit because one destination failed.** One arriving is enough.
- **Sending `access_key` to the worker**, or any key to anything that didn't ask for it.
- **Logging the payload anywhere**, including in a `catch`. It is someone's name,
  business and email address.
- **Another runtime endpoint** without it being a decision. Two `POST`s, on a press.
- **`void el.offsetWidth`** to restart an animation. Remove the class on `animationend`.

Added with the socials row:

- **Hiding the subline from JS.** The stylesheet hides it, `prefers-reduced-motion` and
  `<noscript>` put it back, the typing unhides it. Anything else flashes the line.
- **Brand colours, an icon font or a CDN icon set** for the socials. Monochrome inline
  SVG, stroked, or it does not ship. The inline `<symbol>` sprite is the one exception
  and it is not a fetch.
- **A fourth width breakpoint.** Three, named in Layout, and the socials own the third.
- **A second row in the top bar.** It lands on the mascot at 320px. The row is either
  centred in the bar or it is in the footer.
- **Centring the bar row with flex** instead of absolute positioning. The two controls
  it sits between are different widths, so a flex centre is not the page's centre.
- **A copy of the six paths per row.** One `<symbol>` sprite, two `<use>` rows.
- **Hand-drawn approximations of a brand mark.** Tabler's outline set, verbatim. If a
  seventh platform is ever added and Tabler does not have it, that is a decision, not a
  drawing exercise.
- **An ambient animation in the top bar.** The flick is on hover and nowhere else.

## Before shipping

**Run every visual check in both themes.** Half of them only fail in one.

Theme and language:

- Toggle the theme ten times in a row. Every colour on the page fades over the same
  0.5s - background, text, mascot face, mascot eyes, borders, the card, the bubble, the
  vignette, the halo, the phosphor glow. Nothing snaps a beat early or late.
- Watch the mascot specifically through a swap: face and eyes cross-fade together. If
  the eyes snap, `fill` is missing from the `.m-eye` transition.
- Pick the light-mode green with a colour picker against white: it must clear 4.5:1.
  So must `--muted`, `--sub` and the red, in both themes.
- Set dark, reload. **No white flash.** If there is one, the bootstrap is deferred.
- Open `/ru` in a clean profile with an English browser: Russian, no English frame, and
  the address bar reads `/ru` with no `#`. Same for `/lv`.
- Set the browser to Russian, clear site data, open `/`: Russian, url `/ru`, and
  `localStorage` still empty — a guess is not a choice.
- Choose Latvian, then open a shared `/ru` link: Russian for that visit, and `bt-lang`
  is still `lv` afterwards.
- Switch language three times and check `history.length`: unchanged. Back leaves the
  site rather than walking the switches.
- Reload in a private window with site data blocked: the page still loads, still
  defaults to light, and nothing throws.
- Mobile browser chrome matches the theme - `theme-color` is being updated.
- Switch language mid-form: the question, chips and buttons all change, progress is
  kept, the card stays open, and nothing resets.
- Switch language on the landing page: the subline swaps **without re-typing**, and
  re-fits - check RU and LV at 320px, where they are longest.
- The RU and LV sublines render in one face, not two. If a word is half Michroma and
  half mono, the Latin test is broken.
- `<html lang>` follows the language. Copy the subline out: it pastes back lowercase.

Lockup:

- Renders correctly at 320px, 768px, 1440px and 2560px wide.
- Headline caps at 2.75rem on wide screens and stacks to three lines under 640px -
  check both, and drag across the 640px boundary to confirm the swap is clean.
- Headline has real air around it at 1440px - roughly 40% of the viewport, not 90%.
- Headline, subline and button read as one block, not floating pieces.
- The landing state does not scroll on a 1440x900 desktop.
- Sweep the pointer across the lockup: no text moves, shifts or brightens by a pixel.
  Only the eyes react.
- Headline does not wobble horizontally during decode. Watch it at 1440px.
- In stacked mode, a vertical guide down the centre bisects THE, BORING and TEK
  equally, and the rows have visible air between them.
- Subline reads as one tracked line, no green cast in the letters, nothing after the
  last letter, and it lands with no sideways drift.
- Nothing blinks except the CTA glitch. No caret anywhere.
- **Hard reload with the CPU throttled 6x and watch the subline: it is never readable
  before it types.** Not a frame of it, not at 20% opacity, not while the headline
  decodes. Then turn reduced motion on and reload: it is there immediately, whole, with
  no typing. Then disable JS and reload: there again, whole.
- Favicon at 16px: white circle, two dark dash eyes still reading as two marks.
- Grain is invisible until you look for it. Vignette is invisible until you screenshot
  with and without - in both themes.
- Throttle to Slow 3G and reload: the mono fallback headline is laid out sensibly and
  the swap to Michroma does not break the layout.

Mascot and bubble:

- Sweep the pointer a full circle around the mascot, out to all four screen corners:
  the eyes follow from anywhere, travel a visible distance, arrive quickly, stay inside
  the face at every angle, and recentre when the pointer leaves the window.
- Sit and watch for 30s: it blinks 6-9 times at irregular intervals, both eyes, with an
  eased lid rather than a squash, and roughly one in five goes twice. **Then open the
  form and watch again** - it still blinks while wide-eyed.
- Turn reduced motion on and watch again: the blink is unchanged. Only the eye tracking
  stops.
- Sit for a minute on the landing page: a bored line appears every 8-14s and fades.
- At 320px, trigger every bubble line including the longest done line: the pill always
  stays fully on screen, wraps rather than clips, and the dots never move.
- At 1440px the pill sits beside the head and is not shifted at all.
- Press the mascot: the form opens, same as the button. Tab to him and press Enter:
  same again, with a visible focus ring.

The socials row:

- Drag the window across `560px`: the row leaves the bar and appears in the footer, and
  the footer line comes with it. Never two rows on screen at once, never zero.
- Above `560px`, the gap from the bottom of the icons to the top of the mascot's face
  is never under `60px` — check it on a short laptop (1280×720, 1366×768), not just on
  a 900px-tall screen, because the hero's top padding is partly `vh`.
- Above `560px`, measure it: the row's centre is the page's centre, to the pixel, at
  560, 768, 1440 and 2560 — not the centre of the gap between the language block and the
  toggle. At 560 it still clears the language buttons.
- Below `560px`, the top bar is exactly what it was before the socials existed: three
  language buttons and the toggle, one row.
- Scroll to the bottom at 320px in both themes: six icons centred, `theboringtek 2026`
  under them, comfortable air, no horizontal scroll.
- Hover each of the six in both themes and in both places: it darkens to `--fg`, lifts,
  flicks once, and settles. Leave the pointer on one for ten seconds — nothing repeats.
- Reduced motion: no lift, no flick, colour only.
- Tab order: the bar's links sit between LV and the toggle on desktop; on a phone the
  footer's six are the last stops on the page. The hidden row is never a stop.
- Every link opens the right account in a new tab, and all six carry `rel="noopener"`.
- All six glyphs actually draw. A broken `<use href>` renders nothing and reads as an
  empty gap, not as an error.

Form:

- Walk all four paths end to end: business check, problem, not sure, just a question.
- Pick "i will explain myself": a step appears and the progress dots grow by one.
  Deselect it: the step and the dot go away again.
- Back out of every step. Answers are still there. Go forward again: still there.
- Trigger all five validation messages. Each is small, red, under the right thing, and
  only one shows at a time.
- Submit with the network offline: the red line appears, the button comes back, and no
  answer is lost. Reconnect and send: it goes.
- Check the received payload is readable English with a `language` field, after
  submitting in Russian.
- Start again fully resets - state, card, button, hint, eyes, bubble.
- Every step fits on a 320px screen without the card scrolling inside itself.

Performance:

- DevTools Performance recording of a hover pass: **no layout, no style recalc** in the
  frame loop. Green frames only.
- Sustained 60fps with the pointer sweeping across the mascot.
- The mascot halo is a gradient layer, not a filter - confirm no filter re-raster shows
  up while the eyes are moving.
- Frame loop allocates nothing - Memory timeline is flat, no sawtooth.
- `will-change` is cleared after the decode; layer count stays in single digits.

Correctness:

- **One Google Fonts `<link>` on load**: the CSS, then the WOFF2 files for Michroma and
  Space Grotesk. Anything from another host is a bug. The two form `POST`s appear only
  when send is pressed.
- Send with one destination blocked and then the other: both deliver on their own. Block
  both: the red line appears and no check mark does.
- The network tab shows no form payload in any console message, on success or failure.
- Block `fonts.googleapis.com` and reload: page still renders, still readable, still
  laid out - just in mono.
- Reduced-motion pass: static grain and vignette, no decode, no typing, no eye
  tracking, no glitch, no idle bubble - **but the blink still runs, the theme still
  cross-fades, and the whole form still works end to end.**
- JS disabled: headline reads correctly and the page is legible, **and the cards below
  the hero are visible** — if they are blank, the reveal start state leaked into the
  stylesheet. The form cannot open; that is expected, and nothing else may be broken or
  misleading.
- Keyboard-only pass: language buttons, theme toggle, mascot, CTA, every chip, field
  and nav button reachable, focus always visible in both themes.
- Screen reader reads the headline once, not four times, and never reads the bubble.
- No `console.log`, no commented-out code, no TODOs left in the file.
- One real form sent end to end and confirmed to arrive. A stubbed network proves the
  branching, not the delivery.
- No secrets, no client names, no personal contact details - the repo is public.
- Copy re-read once against the banned-words list, in all three languages.

The section below the hero:

- Scroll down at 320px, 375px, 768px and 1440px in both themes: no horizontal scroll at
  any width, and `document.scrollWidth === clientWidth` throughout. The scrollbar now
  exists on desktop, and anything that measures `innerWidth` instead of
  `documentElement.clientWidth` is off by its width.
- The cards fade up once. Scroll back up and down again: they do not replay.
- Reduced motion: the cards are already there on arrival, at full opacity.
- Hover each card: the border darkens and it lifts 3px, immediately, with no reveal
  delay attached.
- Switch language over the section: labels and copy all change, in one face per card.
  Russian reads entirely in mono, `ai` included.
- Open the form and watch the section: it does not move, flicker or re-reveal.
- The cta reads as one line in all three languages at 320px. If it wraps, `--cu` was
  measured in the wrong face or against the wrong width.
