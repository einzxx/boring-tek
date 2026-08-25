# demo/ — the recorders

Three scripts, all headless Chrome, all tooling.

- **`record.mjs`** renders a 24.1 second demo of the live site to mp4. It drives
  the real `index.html` from this repo, served on localhost. It never touches
  production and it never posts a form anywhere.
- **`post2.mjs`** renders a 9 second social clip. It does not film the page: it
  composes a scene out of the site's parts. See The social clip below.
- **`og.mjs`** renders `assets/og.png`, the 1200x630 card a shared link shows.
  See The og card at the bottom.

Everything below is about `record.mjs` unless it says otherwise.

**This is tooling, not the site.** The site is still one file with zero
dependencies. `demo/` has its own `package.json` and its own `node_modules`,
and nothing in it is loaded by, linked from or referenced by `index.html`.

## Run it

```
cd demo
npm install
node record.mjs
```

Two files land in `demo/out/`:

| file | |
|---|---|
| `reel-demo-1080x1920.mp4` | 1080x1920, 60fps, 24.10s — the vertical reel |
| `demo-1080x1080.mp4` | 1080x1080, 60fps, 24.10s — the square cut |

Roughly four minutes end to end on a laptop: about 3:15 of rendering, the rest
encoding. Frames are deleted afterwards.

Flags:

- `--keep-frames` — leave `demo/frames/` in place
- `--encode-only` — re-encode from kept frames without re-rendering
- `DEMO_FPS=12 node record.mjs` — a fast preview pass, same 24.1 seconds, a fifth
  of the frames. Use this while changing the timeline.

Requires Chrome installed (the script looks in the usual places, see `CHROME`
at the top of `record.mjs`). `puppeteer-core` drives it and `ffmpeg-static`
encodes; neither downloads a browser.

## How it records

**Frame by frame `Page.captureScreenshot` under CDP virtual time, assembled by
ffmpeg.** Not `Page.startScreencast`.

Screencast only hands you a frame when the compositor produces one. On a page
this heavy at 1080x1920 in headless, that is well under 60 per second and
irregular, so you get judder and duplicated frames and no way to hit an exact
duration. `Emulation.setVirtualTimePolicy` decouples the page's clock from the
wall clock: the recorder advances virtual time by exactly 16.667ms, takes as
long as it likes to capture the frame, then advances again. Every CSS
transition, every `requestAnimationFrame` and every `setTimeout` in the page
lands on an exact 60fps grid no matter how slow the screenshot was. The output
is 24.10s to the millisecond and identical on every run.

Three details that cost an afternoon each:

- `Page.captureScreenshot` returns **css** pixels — 540x960 — however high the
  viewport's `deviceScaleFactor` is. Passing `clip` with `scale: 2` is what
  actually gets device pixels out. Without it the reel is a soft upscale.
- The page load happens under `pauseIfNetworkFetchesPending`, so the Google
  Fonts request costs real seconds but no virtual milliseconds. The reel opens
  on a genuinely fresh page: the wordmark is mid-decode in frame 0.
- **Virtual time does not drive `requestAnimationFrame`.** This one is worth
  reading twice. Virtual time governs css transitions and timers correctly, but
  rAF is driven by BeginFrames from the compositor, and `captureScreenshot`
  forces five or six of them per capture, each carrying a timestamp 83 to 100ms
  further on. Measured: **the page's rAF clock ran 5.5x faster than the capture
  clock.** Everything `index.html` animates by hand rode that — the wordmark
  decode, the subline typing, the bubble timers and the blink. The blink is a
  280ms cycle, so an entire one finished inside a single captured frame;
  sampled, it read `0.97` then `0.06` then `0.74` across three frames, which is
  a flash rather than a blink, and thirteen of them landed in seven seconds.

  The fix is to take rAF off the compositor. `record.mjs` shims
  `requestAnimationFrame` into a queue before any page script runs, and flushes
  it exactly once per captured frame with a timestamp that advances exactly one
  frame. The page's loop then runs at a true 60fps in page time. The blink
  spreads over the seventeen frames it is meant to take, and the decode takes
  its full 1150ms instead of a fifth of a second.

  If you ever see the site's hand-animated pieces running fast in a render,
  this is why.

## How the camera works

A wrapper `#dm-cam` is injected around the page's body children and carries a
css transform. The recorder sets it explicitly every frame rather than handing
it to a css transition, evaluating `cubic-bezier(.5,.05,.2,1)` — the site's own
`--ease` — in javascript. Same curve, exact frame timing.

The wrapping happens on a `DOMContentLoaded` listener registered before the
page's own script is parsed, so it runs before `boot()` and `boot()` still
finds every node it queries, one level deeper. `index.html` is not modified.

Three framing rules the page itself imposes, all in the code as comments:

- **Zoom never goes below 1.0.** The top bar, the vignette and the grain are
  all `position:fixed` inside the camera wrapper, so under 1.0 their boxes
  float as visible rectangles in the margin.
- **Zoom never goes above 1.09.** The page is full bleed at 540 and the subline
  is its widest line, so past that it loses its first and last letter.
- **A resting shot frames either page zero or everything below the bar**, never
  halfway through it. The bar paints an opaque scrim over its own top 42%,
  which reads as a hard horizontal edge against the grain if the camera leaves
  sky above it.

So the camera language is vertical — reframing, not scale.

## The cursor

An svg pointer in an overlay outside the camera wrapper, so it lives in screen
space. Every target is a **selector**, never a coordinate. Each frame the
recorder asks the browser for that element's live `getBoundingClientRect()` —
which already carries whatever the camera is doing to it — and eases the cursor
toward it, so it stays glued to an element the camera is still moving under it.

A real CDP mouse follows the drawn one. That means the cta fills on hover and
the chips light exactly as they would for a visitor, and it means a press is a
genuine `Input.dispatchMouseEvent` at the cursor's own coordinates. If the
cursor were beside the target, the click would miss and the form would not
advance. The mascot does **not** watch it — see below.

## The square cut

A fixed 1080 band cannot hold both halves of the reel: the wide shots put the
mascot near the top of the tall frame and the card shots put the card in its
middle, and they are more than 1080 apart. So the cut pans once, from y=200 to
y=420, smoothstepped over 1.8s starting at 5.8s — while the camera is already
moving to the card, which is the one moment the reframe is invisible.

## What is faked, and what is not

Faked, deliberately:

- **`fetch` is stubbed** for anything matching web3forms, `workers.dev` or
  theboringtek. The send at the end is real as far as the page is concerned and
  goes nowhere. The recorder prints how many posts it intercepted and it must
  be 2. **Nothing leaves the browser.**
- **`Math.random` is seeded**, so blink gaps and idle lines are the same on
  every run.
- **The cta never glitches.** The page shakes it with an rgb split every 3 to 5
  seconds to ask for attention, which is right on the site and wrong in a reel
  — the push at 3.5s should land on a calm button. The `shake` class still
  lands; injected css freezes both its animations for the whole video, so
  nothing moves.
- **The mascot's eyes never track the cursor and never widen, but they are not
  dead either.** Three things going on here.

  Two jumps had to go. The page follows the pointer, and under a moving camera
  the head shifts without a remeasure, so the aim is computed against a stale
  rect for a frame and the eyes twitch — visible on every press. And
  `eyesWide()` snaps `--wide` from 1 to 2.2 with no transition the instant the
  form opens. The recorder answers false to the one media query the page gates
  tracking on, so the pointermove listener is never registered at all, and pins
  `--wide` to 1 in css.

  What replaces it is **idle life, not reaction**: he is not following
  anything, he just looks around. The recorder drives `--ex` and `--blink`
  itself, written after the page's rAF tick so its values are the ones that
  render — the page's own blink engine still runs its bookkeeping, it simply
  never gets the last word. Gaze turns take .8 to 1.3s on an ease-in-out, hold
  for a second or two, and every third look comes back through the middle so it
  does not read as a metronome. Blinks land every 2 to 3s with the page's own
  lid curve, occasionally twice. Both patterns are generated once from a fixed
  seed, so the rhythm is uneven the way a real one is and identical on every
  run. `HERO_EYES` and `HERO_BLINKS` in `record.mjs`.

  All of it is verified rather than assumed — see below.
- **The idle line is placed at 1.35s and held to 3.45s.** The page's own idle
  chatter does not fire until 8 to 14 seconds in, which is past the end of the
  shot. `say()` and `fitPill()` live in the page's closure, so the two clamps
  `fitPill` applies are reproduced in `record.mjs`; the text and the class are
  the page's own, only the placement maths is ours.
- **The bubble's exit is slowed** from the site's .2s to .55s, in css, on the
  `:not(.on)` state only. Right for a page, abrupt in a reel. The spring
  entrance is untouched and is the page's own.
- **The last step fills in the order a person would.** The card arrives empty —
  nothing is pre filled. `Your Business name` types character by character,
  then `registration number`, `yourweb.com` and `Europe` land one after another
  a fifth of a second apart so it reads as the form completing rather than as a
  paste, then `your@business.com` types.
- **The start again button is hidden once the check mark lands**, so the sent
  state stays clean through to the end card. Scoped by `.pad:has(.tick)`, so
  the form's own back button — the same `.btn.ghost` — is untouched on every
  step before it.
- **The cursor leaves after the send.** Without it the real pointer stays parked
  where the send button was, and the card shrinking under it leaves one of the
  cards below the hero highlighted for the rest of the shot. It eases off frame
  and the real pointer parks in the top left, inside the bar, which is
  `pointer-events:none`. The exit is the one place a coordinate is used instead
  of a selector, because the destination is off frame rather than on anything.
- **The stubbed post resolves after 480ms**, so the send button's busy state is
  on camera the way it would be for a real visitor.
- **The end card is entirely ours** — it is an injected overlay, not a page
  state, and it runs three and a half seconds. Its mascot is alive: he looks
  left, blinks, looks right, `your move` pops in beside him, and then he keeps
  looking around and blinking until the last frame. Nothing freezes on the
  hold: the final eye move is still running at 22.80s and the last blink is at
  22.65s. Eye positions are keyframes in `EYE_KEYS`, blinks are timestamps in
  `BLINKS`. The lid is the page's own curve (ease shut over 95ms, hold 45ms,
  ease open over 140ms, `LID` .06), copied because it lives in `index.html`'s
  closure, and the pop is the site's own `--spring`,
  `cubic-bezier(.34,1.4,.64,1)`. The dot trail starts clear of the head: the
  face is a white circle on black, and on the 45 degree diagonal its edge is at
  box (109,19), so a dot placed any closer is white on white and invisible.

Not faked: the page. Every animation, transition, validation, state change and
hover in the reel is `index.html` doing its own job.

## Verification

After encoding, `record.mjs` checks:

- resolution is 1080x1920 and 1080x1080
- frame rate is 60
- duration is 24.10s, within 0.35s
- **every press landed inside its target.** At each press the recorder records
  the cursor's real position and the target's real rect and asserts the point
  is inside the rect. It then pulls the exact frame of every press back out of
  the finished mp4 into `demo/out/verify/`, so the frames on disk are what
  shipped rather than what was meant to ship.
- **the hero's eyes moved smoothly and never widened.** Now that the eyes do
  move, the guard is on smoothness rather than stillness. Every frame it reads
  back the computed transform on `.m-eyes` and the used `--wide` on `.m-eye` —
  computed style, so a css override counts and an inline write that loses to it
  does not — and flags any frame where the gaze steps further than a real turn
  could or `--wide` budges off 1. The widest idle turn is 7.4 units over .8s,
  whose fastest frame moves about .31 at 60fps; a snap, such as the form
  opening and slamming `--ex` back to zero, moves 3.7 in one frame. The limit
  sits between.
- **the blink arrived gradually.** It also reads `--blink` every frame and
  measures the biggest one-frame step. This is the guard on the rAF problem
  above: a healthy close steps at most .302 between two frames at 60fps, and a
  collapsed one steps about .94.

  Both limits are derived from the frame rate, so they stay meaningful at 60
  and clamp out of the way under `DEMO_FPS=12`, where one frame genuinely is
  83ms of eyelid and a preview would otherwise fail for no reason.

A failing check exits non-zero and names what failed. `demo/out/presses.json`
keeps the raw numbers for both.

## Changing the reel

The whole script is `buildTimeline()` in `record.mjs`, about 60 lines. `cam()`
is a camera move, `mv()` a cursor move, `press()` a press, `at()` anything
else. Times are seconds. Iterate with `DEMO_FPS=12`, then do a full pass.

## The social clip

```
cd demo
node post2.mjs                  # out/post2-1080x1920.mp4 + the square cut
DEMO_FPS=12 node post2.mjs      # the fast preview pass, same 9 seconds
node post2.mjs --encode-only    # re-encode from kept frames
```

Nine seconds, 60fps, loop friendly. A statement decodes in at the top, the
mascot sits large in the middle living his life, and at 5.5s a bubble pops up
beside his head: **it took my job.** then **i am fine.** About a minute to
render, and it reuses the recorder's rAF shim, its seeded idle, its gaze and lid
guards and its encode settings.

**It composes a scene rather than filming the page.** The statement is not on
the site, the mascot is drawn far larger than the page ever draws him, and the
bubble says something the page never says, so there is no camera move that could
produce this shot. Instead the light `:root` block is lifted out of
`index.html` and the mascot out of `assets/mascot.svg` at run time, the way
`og.mjs` does it, so the clip cannot drift from the brand. The bubble is the
site's own shape, radius and dot trail, at a font size a feed can actually read.

Three things cost an afternoon each:

- **A scene where nothing animates hangs the render.** With no running
  animation, Chrome stops producing compositor frames and
  `Page.captureScreenshot` waits for one that never comes: frame zero lands,
  frame one blocks until the protocol times out. The vignette breathes on the
  site's own 34s loop, which is both the fix and the more faithful scene.
  `record.mjs` never meets this because `index.html` always has it running.
- **CSS transitions cannot be trusted here.** One captured frame carries five or
  six BeginFrames, so the animation timeline advances about 5x per frame and the
  bubble's `.4s` spring resolved in five frames. The rAF shim fixes rAF and
  nothing fixes transitions, so every moving value on the bubble is eased in JS
  and written per frame, on the site's own curves and durations. This is what
  the reel already does for its end card.
- **`mascot.svg` is one circle and two loose rects.** The page wraps the rects in
  a `<g class="m-eyes">` and travels the group, leaving the blink on each rect.
  Rebuild that or the gaze has nothing to move, and the smoothness guards pass
  perfectly on a mascot that never moves at all. That is why there are now
  liveness checks too: the eyes must have moved, and he must have blinked.

## The og card

```
cd demo
node og.mjs              # writes assets/og.png, the tracked asset
node og.mjs --preview    # writes demo/out/og.png instead, which is gitignored
```

Deterministic: the same commit renders the same bytes, so a run that changes
nothing leaves `assets/og.png` untouched in `git status`.

**The card is not a separate design.** `og.mjs` lifts the light `:root` block
out of `index.html` and the mascot out of `assets/mascot.svg` at run time, so
the card cannot drift from the page it is a picture of. Change a token on the
site, re-run this, the card follows. The mascot's two fills become `--face` and
`--eye` so he inverts the way the in-page one does; the geometry is never
touched.

Sizes are fitted rather than set: the wordmark and the subline are each measured
at 100px and divided down to the width they should occupy. The subline is fitted
on its own rather than at the site's 44:16 ratio, which would put it at 939px
against a 760px wordmark — wider than the thing it sits under. Correct on the
page, wrong on a card.

It checks itself and exits non-zero on: wrong dimensions, a subline wider than
the wordmark, margins under 60px, a png over 300KB, and **Michroma not having
loaded** — offline, the card renders in the mono fallback and looks almost
right, which is the worst kind of wrong to ship.

## Why demo/ is safe to have in a public repo

`record.mjs`, `post2.mjs`, `og.mjs`, `README.md` and `package.json` are tracked.
`node_modules/`, `frames/`, `out/` and `package-lock.json` are in `.gitignore`,
and `post2.mjs` keeps its frames under `out/` so a `record.mjs` run cannot wipe
them mid flight.

GitHub Pages serves the whole repo root, so `theboringtek.com/demo/record.mjs`,
`/demo/post2.mjs`, `/demo/og.mjs` and `/demo/README.md` are fetchable. That is
harmless: they are static text, nothing executes them, they hold no secrets and
no endpoint that is not already in `index.html` — the urls named here are named
in order to **block** them. `demo/` is in neither `sitemap.xml` nor any link on
the site. If you would
rather it were not crawled at all, add `Disallow: /demo/` to `robots.txt`.
