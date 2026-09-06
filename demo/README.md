# demo/ — the recorders

All headless Chrome, all tooling. The renderers first:

- **`record.mjs`** renders a 24.1 second demo of the live site to mp4. It drives
  the real `index.html` from this repo, served on localhost. It never touches
  production and it never posts a form anywhere.
- **`post2.mjs`** renders a 9 second social clip. It does not film the page: it
  composes a scene out of the site's parts. See The social clip below.
- **`post4.mjs`** renders a 19 second social clip, vertical only. Same composer
  rig as `post2.mjs`, four bubble beats instead of two. See The fourth clip.
- **`post5.mjs`** renders a 10.5 second social clip, vertical only, **with the
  read and the mascot's beeps in the file**. `post4.mjs` is its template; the
  mascot searches the room on two axes and the bubble swaps in place instead of
  leaving. It shipped silent and got its sound in a later pass that did not move
  a pixel. See The fifth clip's sound.
- **`post6.mjs`** renders a 22.2 second social clip, vertical only, **with its
  own voice in the file**. The first one built on the new machine: the voice is
  generated first and the captions, the length and the mascot's gaze are all cut
  from its word timestamps, and there is an animated pictogram scene layer in
  the top third. See The sixth clip.
- **`post7.mjs`** renders a 10.22 second social clip, vertical only, with the
  voice and the effects in the file. post6 is the template; it is the first clip
  built on the whole stack at once rather than on one that grew under it. See
  The seventh clip.
- **`post10.mjs`** renders a 13.17 second social clip, vertical only, with the
  voice and four slices of a licensed mp3 in the file. **The first dark one and
  the first with no accent in it at all.** See The tenth clip.
- **`post11.mjs`** renders a 46.5 second explainer, vertical only, with the read
  in the file, **in two variants: light, and `--dark` on the near black page.**
  **The first clip built on `lib/mascot.mjs`**, **the first that puts the live
  site inside a card** rather than filling the frame with it, and **the first
  that renders both themes off one plan.** Big type, real footage of
  theboringtek.com cropped to the hero, the form filled and narrated field by
  field, and the corner mascot reacting the whole way through. Out to
  `demo/out/post11-light-1080x1920.mp4` and `post11-dark-1080x1920.mp4`.
  **Both 60fps finals rendered green, 47.03s each, and both have since been
  overwritten** by the 12fps previews from the brain removal, which write to the
  same two paths. **They want `--blur` run again.** See The eleventh clip.
- **`post12.mjs`** renders a 5.55 second sting, vertical, dark only, **with two
  words over the mascot's head and nothing else written on it until the
  wordmark.** The shortest clip here and the first that is a joke rather than an
  argument: the mascot alone in the middle of a black frame, on screen from frame
  zero under an `ai fart` label, says hi, holds still, farts, giggles, the signal
  comes apart under the laugh and a hard tear takes him and the label off and
  puts the wordmark on the screen for a second and a half. **The first clip whose
  sounds are the content** — there is no voice and no caption, and four new
  recipes in `lib/sfx.mjs` carry it. Out to
  `demo/out/post12-dark-1080x1920.mp4`. See The twelfth clip.
- **`post13.mjs`** renders a 4.98 second clip, vertical, dark only, **and it is
  the first one with a hand on the mascot's face.** He talks and talks and gets
  tired of his own talking: he has no mouth, so a hand stands in for one and
  yaps under a `when ai is tired of humans` label while his eyes go from alive
  to narrow to drooped to one of them rolling off to the side. Then the same
  tear post12 ends on. **The hand is `lib/mascot.mjs`'s, opt in and off by
  default**, and three new recipes in `lib/sfx.mjs` carry the sound: a formant
  synth mumble on every open of the mouth, a sigh and a beep. Out to
  `demo/out/post13-dark-1080x1920.mp4`. See The thirteenth clip.
- **`post14.mjs`** renders a 13.03 second news flash, vertical, **light only,
  and it is the first clip that puts somebody else's mark on the screen and the
  first that moves the mascot.** He is big in the middle of an empty white page
  for two and a half seconds with `fable 5.1 out` in a thought bubble over him,
  the signal tears twice and he is back in his corner at his ordinary size, the
  anthropic logo glitches in at the top and turns once over the rest of the
  clip, **a chat panel under it types itself a line character by character**,
  and three facts are read at a person's own pace over captions in the middle
  of the frame. The logo is `demo/assets/anthropic-logo.png`, placed as an image
  and not touched. Out to `demo/out/post14-light-1080x1920.mp4`. See The
  fourteenth clip.
- **`post15.mjs`** renders a 6.73 second clip, vertical, dark only, **and it is
  the first one built on `lib/camera.mjs`.** A small bug drawn in code walks in
  low from the left on an alternating tripod gait, the mascot watches it from
  his corner, it stops under him, and he eats it: a small rise, a lunge down
  over it, the head squashing on the landing and the bug gone under his ink,
  then three chewing pulses with his eyes shut. `crunchy`. The gait is driven
  by distance rather than by time so no planted foot ever slides, the depth of
  the lunge is derived from the containment rather than chosen, and two new
  recipes in `lib/sfx.mjs` carry the sound: `tick` for a foot and `crunch` for
  a bite. Out to `demo/out/post15-dark-1080x1920.mp4`. See The fifteenth clip.
- **`post16.mjs`** renders a 5.70 second clip, vertical, dark only, **and it is
  the first one whose camera pulls back instead of pushing in.** A client asks
  for one small change, then forty seven more: the mascot alone in the middle of
  a black frame with one glowing pill beside his head, he brightens and agrees,
  and then a bass hit snaps the camera out and the screen is covered in forty
  seven identical pills. He goes flat, blinks once slowly, and two faults take
  him and then them. `lib/camera.mjs` does the whole move as a `snap` with a
  multiplier **under one** and a **negative** anticipation, which is a push in
  as the wind-up for a pull back; nothing in the module was touched to allow it.
  No new sound recipes — five cues out of `chirp`, `popDeep` and `glitch`, with
  0.91s left deliberately empty for the trending sound. Out to
  `demo/out/post16-dark-1080x1920.mp4`. See The sixteenth clip.
- **`post17.mjs`** renders a 7.41 second clip, vertical, dark only, **and it is
  the first one whose whole clock is cut from one spoken line, and the first to
  use the module's thought bubble over the crown.** A chat panel fades in on a
  black frame and types itself `message for the next generation?` while the
  voice reads it; the panel slides 120px down out of the way, a hard fault hands
  the mascot the frame above it, he takes a beat and a slow blink, thinks
  `don't come` and winks. Then the second fault takes the lot and puts the
  wordmark up.
  **The typing is cut to the read word by word** — each word's characters land
  across that word's own spoken span — and everything downstream of the voice is
  derived from it. `thought: 'over-right'` is `lib/mascot.mjs`'s own placement,
  used by a clip for the first time. No new sound recipes: key ticks, one soft
  `popDeep` thud, two `glitch` faults and `mascotCues`' own `pop`. Out to
  `demo/out/post17-dark-1080x1920.mp4`. See The seventeenth clip.
- **`post18.mjs`** renders a 12.63 second clip, vertical, **light only, and it
  is the first one with a gaze layer, the first whose captions are set in a face
  the module does not own, and the first that spells a word out so the
  synthesiser reads it as letters.** Somebody else's model ships: the mark fades
  in with `ChatGPT 6` bold under it and `ASTRA IS HERE` typing itself below, the
  effort slider walks to Max, a chat panel types `not using ai for your business
  yet? your competitor already does` while the voice reads the same line, and the
  mark comes back bigger and turning with `future. here.` over a small robot's
  head before the signal tears. Captions in Manrope ExtraBold, refitted in the
  page against the face that actually renders. Out to
  `demo/out/post18-light-1080x1920.mp4`. See The eighteenth clip.
- **`post19.mjs`** renders an 11.15 second clip, vertical, **dark only, and it is
  the first one that measures somebody else's assets before it places them and
  the first that squashes the mascot with a layer of its own.** A chat panel asks
  `which ai do you use?`, then the voice reads five model names and the label, the
  mark and the caption all land on the word each one starts — Claude, Gemini,
  ChatGPT, Grok, Copilot — while the mascot's head turns to the label quicker every
  time until the room goes round. The signal breaks and he drops in from off the
  top of the frame and smashes flat with `all of them.` over his head. post17 is
  the template for the panel, the two faults and the held thought; post18 for the
  captions, the gaze and the guards. Out to
  `demo/out/post19-dark-1080x1920.mp4`. See The nineteenth clip.
- **`post20.mjs`** renders an 8.67 second clip, vertical, dark only, **and its
  whole clock is cut from one read.** A thought types itself in the middle of a
  black frame while a voice says it — `everyone says ai will replace u`, word by
  word with a key tick on each and a green caret following the last one — then
  gets knocked down to the lower third, and the mascot falls into the space it
  left with no hands at all. He hits the floor and squashes flat, takes a beat,
  and a hand comes over his mouth: he laughs, silently, with `hihi` over his
  crown. The laugh stops dead, the hand goes home and fades, and the punchline
  pops under him while the voice delivers it: `it will replace the guy who does
  not use it`. Then post12's fault takes the lot and puts the wordmark up. **It
  is the first clip to use the floating hands**, and the pose table's own
  `point-viewer` was in the first cut and taken out by the review — see The
  twentieth clip. post12 is the template for the frame, the fault and the end
  card; post19 for the fall, the smash and the read's own machinery. Out to
  `demo/out/post20-dark-1080x1920.mp4`. See The twentieth clip.
- **`og.mjs`** renders `assets/og.png`, the 1200x630 card a shared link shows.
  See The og card at the bottom.

Then the pipeline pieces, which are not clips. `post6.mjs` uses the first three:

- **`lib/captions.mjs`** turns a timestamped word list into a word by word
  animated caption, in four styles. See The library below.
- **`lib/voice.mjs`** speaks a line in a free microsoft neural voice and hands
  back the audio with the engine's own word timestamps.
- **`lib/pictograms.mjs`** draws solid svg pictogram scenes in code and animates
  them per frame against the same timestamps, on a gsap timeline stepped by hand
  one tick to a captured frame, with a soft drop shadow under every shape, a
  house overshoot under every pop and volume preserving squash on every landing.
  `node lib/pictograms.mjs test` runs the engine's own checks without a browser.
- **`lib/sfx.mjs`** synthesises the sound effects, sample by sample, and places
  every one of them from a time that is already in a caption or scene plan.
  There is no audio file in the repo.
- **`lib/camera.mjs`** is the camera: legs between targets on the house curves,
  an idle drift that never repeats, a snap zoom for a punchline, and a shake
  that is a continuous function of time rather than of the frame index. Two
  modes, `site` and `free`. **New, and nothing was retrofitted onto it** —
  `record.mjs` and `post9.mjs` keep their own copies. `node lib/camera.mjs test`
  runs its checks without a browser. See The library.
- **`lib/transitions.mjs`** is the circle grow and the exit and re-entry. He
  swells until his fill covers the frame and his fill becomes the next scene's
  paper, or the same shape backwards and the background shrinks into him. It
  drives `lib/mascot.mjs` through `#m-zone` and **does not touch that module**.
  `node lib/transitions.mjs test` runs its checks without a browser.
- **`analyze.mjs`** reads a reference video and writes down how it is built.
- **`captions-test.mjs`** renders the three caption styles as five second clips
  so they can be judged.
- **`rig-test.mjs`** renders twelve seconds that exercise the camera and the
  transitions and nothing else, in both themes, to `demo/out/rig-light.mp4` and
  `demo/out/rig-dark.mp4`. See The rig test.
- **`scenes-test.mjs`** renders `post6.mjs`'s own five scenes back to back with
  the dead air taken out, as a ten second silent strip, so the scene layer can
  be judged without scrubbing a twenty two second clip. See The scene strip.

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
encodes; neither downloads a browser. `gsap` is the third and last dev
dependency and only the pictogram layer uses it — see The library. **All three
are `demo/`'s, not the site's:** `index.html` is still one file with zero
dependencies and nothing in here is loaded by it.

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
node post2.mjs                  # both cuts, rendered separately
DEMO_FPS=12 node post2.mjs      # the fast preview pass, same 9 seconds
node post2.mjs --encode-only    # re-encode from kept frames
```

Nine seconds, 60fps, loop friendly. A statement decodes in at the top, the
mascot sits in the middle living his life, at 5.5s a bubble pops up beside his
head (**it took my job.** then **i am fine.**), and the wordmark sits dim at the
bottom for the whole clip. About two minutes for both cuts, and it reuses the
recorder's rAF shim, its seeded idle, its gaze and lid guards and its encode
settings.

**The square is rendered, not cropped.** It used to be a crop of the tall frame
and it cannot be one any more: the wordmark sits at 89% of 1920, which is
y=1710, and the statement sits at y=350, so no 1080 tall window holds both, let
alone with 96px of air at each edge. Each cut gets its own pass over the
identical performance — same seeds, same eye keys, same bubble beats — so they
are the same nine seconds framed twice. The layout table at the top of the file
is the whole of the difference.

**Phone safe framing.** `SAFE` is 48 css px, which is 96 device px that nothing
is allowed inside, and the run measures it rather than trusting it: every
element that can render, dots included, is checked against all four borders on
the busiest frame, and the render fails naming the offender. The bubble is the
piece that reaches furthest, so it clamps against the safe area rather than the
frame edge. In the tall cut the statement caps at 75% of the frame width, sits
at 18.5% from the top and the head's centre is at 50%; in the square those
verticals are adapted, because the bubble needs about 70px of air above the head
and a 540 tall frame cannot also hold a statement, a centred head and a wordmark
at the stated proportions.

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

## The fourth clip

```
cd demo
node post4.mjs                  # vertical only, out/post4-1080x1920.mp4
DEMO_FPS=12 node post4.mjs      # the fast preview pass, same 19 seconds
node post4.mjs --encode-only    # re-encode from kept frames
```

Nineteen seconds, 60fps, 1080x1920, loop friendly. About two and a half minutes.
`post2.mjs` is the template and the whole rig carries over: the rAF shim, the
seeded idle, the cell grid behind the statement, the wordmark fit, all three
guards and the encode settings. post3 is a separate queued clip and was not
built; this is post4 and it skipped it.

**`3 free ai tools for your business`** holds the top for the whole clip, then
four bubble beats name notebooklm, opal and pomelli and close on **all free.
from google. try one today.** Each beat springs in, holds 2.90s and springs out,
and then there is 1.14s of genuinely empty air before the next one. That air is
the point: it is where the editor drops a voice line and a logo, per beat. The
run prints the timings as a card at the end.

**Vertical only, and that is forced.** A statement, a three line bubble, the head
and the wordmark do not fit inside a 1080 tall frame. There is no square cut
rather than a bad one.

Three things had to change to carry multi sentence copy, and only these three:

- **The pill is anchored, not slid.** `post2.mjs` hangs the bubble off the head's
  right shoulder and, when the words run long, slides it left until its right
  edge lands on the safe line. At these widths that slide is 136px and the pill
  tears away from its own dot trail. Here the pill's right edge parks on a fixed
  line 8px inside the safe area on every beat and grows leftward instead, and
  `--porigin` moves the transform origin to wherever the dots end, so the spring
  still comes out of the trail at any width. Beat widths measured 249 / 210 /
  167 / 119px against one identical right edge.
- **The bubble is a rounded rect, not a 999px stadium.** A stadium's ends clamp
  to half the height, and at three lines that curve crosses the first characters
  of the top and bottom lines: the border would sit at x=15.7 where the text
  starts at x=10.1. Border,
  fill and tokens are the page's, untouched, and this is a clip only change —
  the one line bubble in `index.html` keeps its pill radius.
- **The safe area is sampled once per beat, not once per clip.** With four beats
  of different widths one sample proves nothing about the widest state. Four
  samples, worst of the four is what the guard runs against.

**Every beat is three lines on purpose.** The pill's height then never changes
between beats, so only its width moves and nothing above the head jumps. The
breaks in `BEATS` are the breaks that render (`white-space:pre-line`), and a
guard counts the drawn line boxes per beat and fails if `max-width` re-wrapped
one — a fourth line would eat the gap under the statement. Counting line boxes
means counting distinct rect tops, not rects: a range over pre-line text hands
back a zero width marker at each forced break, so a naive count reads 5 for 3.

**Michroma's widest glyph is 1.885em.** Measured, and it is the number that
decides the statement. One cell is nearly two ems, so the longest line's
character count sets the size and nothing else does. For this sentence: two
lines gives 12.6px, three gives 16.5px, four gives 26.9px. Four wins by 63%, and
is bigger than post2's statement at 17.9px. Shorten the longest line, spend the
height.

**The head is 136px with its top on 42% of the frame**, 63% of the 216px this
clip first shipped at, centred. The bubble rides it: every geometric number in
`.bubble`, `.dot` and `.pill` is written as its value against the 216px head put
through `bubScale`, so nothing in the trail is hand typed for a size and the next
resize is one number, not a pass. The 1px borders are held — a hairline scaled
to 0.63px lands sub pixel and renders unevenly. The 306px of white under the head
is deliberate: the head sits high so the lower third stays clear for the edit.

**The pill font is held above proportional, and that is deliberate.** Strictly
proportional is 11.3px, and MEMORY.md already records 12px on this viewport as a
caption on a phone and unreadable in a feed — which is why `post2.mjs` raised
its pill to 16 in the first place. So the chrome shrinks by .63 and the words by
.78: 18px down to 14px, still 28 device px tall. The bubble ends up slightly
larger against this head than it was against the big one. That is the price of
legibility, and this is the right place to pay it.

The seeds are post4's own, so the scramble order and the blink rhythm are not
post2's replayed under new words, and the eye keys are new: he looks up at the
bubble on each of the four beats and away between them, by a different amount
each time so it never turns into a metronome.

## The fifth clip's sound — added later, and the picture did not move

```
cd demo
node post5.mjs                  # renders and mixes, out/post5-1080x1920.mp4
node post5.mjs --encode-only    # re-mixes and re-encodes from kept frames
```

post5 was built silent on 2026-08-26 and `MEMORY.md` planned it that way: ten
servo cues, classical music under everything and **deliberately no narrator**,
because the mascot searching the room is the performance. The audio pass keeps
that clip exactly as it was and fills the silence. **The frame was signed off
and nothing in it changed** — same 10.50s, same 630 frames, same libx264 preset
slow crf 17 yuv420p. The only edit to the encode is that `-an` left and a 192k
aac arrived.

**The question is read, and not by the mascot.** `en-US-AndrewNeural` at the
house `-8%` / `-2Hz`, saying the words that are on the screen: the script is
`STATEMENT.join(' ')` rather than a second copy of the line, so the read cannot
come to disagree with the frame and the file's dash check covers it for free.
Nine words, timings from the engine.

**It is placed by one number.** The first word lands on 1.15s, which is
`DECODE_MS`, the frame the statement stops scrambling. `DECODE_MS` used to live
inside the page's own script and now lives at the top of the file and reaches
the page through `__CFG`, because the sound needs it too. The read runs 1.15 to
3.39 measured **on the waveform**, so there is 1.11s of silence before the
bubble arrives at 4.50 and the narrator can never speak over an answer. The run
fails if it does.

**The mascot answers in beeps and says no words.** One chirp phrase per bubble,
built by `chirpPhrase` out of that bubble's own copy: the note count is the
reply's word count with a floor of three, so `tell us.` gets three notes over
0.39s and `we will fix it.` gets four over 0.52s. Every note glides up inside
itself and each starts higher than the last, which is what a friendly answer
sounds like. The second is `confident` — a tone lower, wider steps, so it spans
more than an octave where the first spans a fifth — and it lands on the set's
own `ding` instead of a fifth boop, because that line is the clip's answer and
an answer stops.

**The servos sit on the start of each turn, not the end.** `EYE_KEYS` lists the
values the gaze eases *to*, so a servo on a listed number lands as the eyes stop
moving, half a second late. `TURNS` derives the ten windows from the key list
and the sound goes on the left hand number of each pair. That also fixes the
tenth cue for free: the last turn ends at 10.50, past the last frame, so a servo
on the listed time would be cut in half; on 10.20 the whole 90ms fits and what
reaches the last frame is a tail 46 dB down. The editor's card now prints the
windows rather than a list labelled "servo cues", which is where the half second
of error used to live.

**Pops on the text arrivals.** One when the statement goes solid, three on the
dots at the site's own 0/70/140ms stagger, and a `popDeep` on the swap because
that is the set's word for the same gesture carrying more weight. The first
beat's pill gets no pop of its own: the dots have just landed and the chirps
are the pill.

**No music, and that is the one line of the recipe this drops.** Ten and a half
seconds already carry a read, ten servos, six pops and two robot phrases. A
classical bed under that is a fourth thing competing rather than a floor.

Twenty three effects: 10 servo, 4 pop, 7 chirp, 1 popDeep, 1 ding. **-14.9 LUFS
at -1.0 dBTP**, 8.2 dB of limiting at its hardest, the effects 18.8 dB under the
voice at their closest in all 96 windows a word is being spoken in.

### The mix pass learned two things this clip paid for

Both are in `post5.mjs` above the loop and both apply to every clip after it.

**A sample peak limiter does not hold a true peak.** post6 and post7 hand
`limit` the delivery ceiling and iterate on loudness alone, which works until
the lift gets large. Here it does not: the read is two seconds inside ten and a
half, so the mix is -22.5 LUFS at unity and needs about thirteen decibels. At
that much limiting the sample peak is exactly on -1.0 and the **true** peak, the
one a resampler reconstructs between two samples and the one every platform
measures, came back at **-0.6** — four tenths over the ceiling this repo says it
delivers to. So the ceiling handed to the limiter is now pulled down by whatever
the measured true peak overshot by, read off the written file rather than argued
from the buffer. It is the same discipline the loudness pass already used,
applied to the axis it was missing.

**More gain stops buying loudness, and then costs it.** The search was run out
by hand and it goes:

```
  lift +13.0  ->  -14.90 LUFS,  8.2 dB of limiting
  lift +13.9  ->  -14.80 LUFS,  9.1 dB
  lift +17.7  ->  -16.00 LUFS, 13.4 dB
  lift +21.5  ->  -15.50 LUFS, 17.2 dB
```

Past about fourteen decibels the limiter flattens the syllables faster than the
gain raises them, and asking for another decibel comes back a decibel *quieter*
with four more decibels of squash on it. A loop that only ever adds gain walks
straight past its own best answer and reports whatever it was holding when the
passes ran out — which is exactly what the first version of this did: **-15.0
LUFS with 11.6 dB of limiting**, where 13.0 dB of lift had already delivered
-14.9 with 8.2. So the loop keeps the **best** pass rather than the last, stops
the moment a pass fails to improve on it, and re-renders the winner once at the
end so the wav on disk is the one that was measured. What it reports is what the
material can deliver, which here is about -14.9 LUFS, rather than what was asked
for. A clip a decibel under target is a clip; a clip with twelve decibels of
limiting on a nine word read is a pumping mess that measured well.

### The guards the sound added

The picture's guards are untouched. The new ones are all measured on a buffer or
on the finished file: an audio track exists on the mp4; the read is over before
the bubble arrives, on the waveform rather than on the word list; no sample of
the read fell outside the clip; no effect was cut by the end of the file; no
window where an effect is louder than the voice; the delivered loudness within
1 LU of target and the true peak at or under the ceiling; the chirp count in the
bus matches what the replies asked for, no reply under three notes, and one
servo per eye turn.

## The sixth clip — the first one built on the new machine

```
cd demo
node post6.mjs                  vertical only, out/post6-1080x1920.mp4
DEMO_FPS=12 node post6.mjs      the fast preview pass, same 22.2 seconds
node post6.mjs --encode-only    re-encode from kept frames
```

Twenty two seconds, 60fps, 1080x1920, **with the voice in the file**. About two
and a half minutes end to end. `3 things ai should not do in your business`, and
it is the first clip in here where the copy is advice rather than a claim.

It is built differently from post2 through post5, in six ways. The sixth was
added after the clip was first cut and posted, and it is the one that changed
what the frame is.

**The voice comes first and everything else follows it.** `lib/voice.mjs` speaks
the script in the default calm voice and hands back the words with the
synthesiser's own timestamps. Those timestamps are the timeline: the captions
are cut from them, the clip's length is the voice's length plus a tail, and the
mascot's gaze is keyed against the beats in them. Nothing in the file is a
caption time typed by hand, and changing the script changes the length.

**The captions are the copy.** Every clip before this holds a statement at the
top for the whole run and puts its beats in the bubble. There is no statement
here and there is no bubble: `lib/captions.mjs` in its `pop` style is the text.

**The numbers are beats.** `one.` `two.` `three.` are the spine of the script,
and the voice already leaves about seven tenths of a second of air around each
of them. Those three cards are marked `emphasise` in the plan, which fits them
on their own and draws them accent all the way through. They land at 44px
against the ordinary cards' 28.3 — a 1.55x jump, and 44 is the brand's hero cap,
not raised for a video. On screen they read `ONE` `TWO` `THREE`, because the
cards carry no punctuation — see Words, not sentences below.

**Words, not sentences.** The cards lost their full stops. A caption is one or
two words at a time for half a second in caps, so a full stop on the end of one
is punctuating a sentence the viewer cannot see, and at 44px in Michroma it is a
large black dot doing no work. **The punctuation stays in the script**, where
the synthesiser reads it and turns it into the pause that is the actual reason
it is there, so nothing about the timing changes — `planCaptions` strips the
marks after it has cut the cards, not before. A question mark survives, because
it changes what a word means rather than punctuating a sentence. 34 marks came
off this script and the guard checks that they did.

**The audio is in the mp4, and it is a mix.** Every other clip renders `-an`
because sound is added in the edit. This one carries its own voice, because the
voice is what the clip is cut against and a silent file cannot be checked for
sync — and since the sound layer was built it carries 46 synthesised effects
under that voice as well. See The mix.

**The mascot is smaller, lower and calmer.** 96px against post5's 136, in the
lower third rather than the middle, gaze up at the captions for most of the run.
The furthest he looks is 2.33 units of the page's 6 where post5 went to 5.04,
thirteen slow turns in twenty two seconds, and blinks 3.0 to 4.4 seconds apart
against post5's 1.45 to 2.60. He comes to the viewer once, at 17.95, for `good
ai has a human behind it`, and stays there. That one move is the performance.

**There is a pictogram scene layer in the top third.** Five solid ink SVG
scenes, one per beat of the voice, drawn in code by `lib/pictograms.mjs` and
driven per frame through the rAF shim. The empty upper half used to be the point
of the frame; it is now the picture, and the caption, the mascot and the wordmark
are unchanged underneath it. See The scene layer below, and `scenes-test.mjs`
for the ten second strip that exists to judge it.

### Two words to a card, and why

The `pop` fit sizes every ordinary card off the widest one, so a single long
card sets the size for all of them. Measured against this script and this box:

| words | widest card | size | cards | compressed |
|---|---|---|---|---|
| 1 | `customer` | 40.0px | 54 | 24 |
| 2 | `touch customer` | 28.3px | 33 | 3 |
| 3 | `work without checking.` | 19.8px | 22 | 0 |
| 4 | `touch customer data without` | 15.6px | 21 | 0 |

Three is the safest cut and it is too small: the captions are the copy here, and
19.8px reads as a subtitle under something else rather than as the thing being
said. One is the real hormozi cut and this script cannot carry it — `a` and
`human` are sixty milliseconds apart, so a card a word would be a strobe.

Two, at 28.3px, is 44% bigger type for the cost of three cards that go past
quickly. Those three are `in your`, `it can` and `has a`: function word pairs in
the gaps between the words the sentences lean on. Their entrances are compressed
to fit rather than left unfinished — see `popTiming` in the engine — and the run
prints them by name every time, so a card that should not be in that list is
visible immediately.

### Two engine fixes this clip paid for

Both live in `lib/captions.mjs` and both improve every style.

- **A card no longer arrives before the previous card's last word is said.**
  `lead` pulls an entrance forward so the spring is finished by the time the word
  is, and on sparse speech that is free. On dense speech it is not: adjacent
  cards can be twenty milliseconds apart, so a 120ms lead reached back over the
  previous card's final word and clamped it away. `decide what it` and `that is
  the` both had a last word that was never on screen at all. The word being said
  wins and whatever is left of the lead is the lead. `plan.tight.late` is the
  list that has to stay empty, and the render fails on it.
- **A short card gets a short entrance rather than an unfinished one.** Natural
  speech does not hand out even cards. An entrance that always takes 200ms never
  finishes on a 200ms card: it appears at two thirds scale, holds nothing, and
  leaves. `popTiming` scales the entrance, the emphasis and the exit to the
  card's own window, so a fast card feels fast instead of flinching.

### `fill: 'card'`, which this clip made the default

`pop` originally revealed a word at a time and held the place of the words that
had not arrived — because a card that reflowed as it filled would slide the
words already on screen sideways while somebody is reading them. At three words
that is a lean. **At two words it is a card sitting visibly off centre for half
its life**, the first word alone in a box the width of two, and it reads as
broken rather than as filling.

`fill: 'card'` springs the whole card in at once and lets the accent walk across
it as the words are said. The pop is still there twice over: the card springs,
and every word kicks as it is spoken. What is lost is the reveal; what is gained
is a card that is centred in every frame of its life. It is also what most
caption tools actually do, and being able to read one word ahead is a feature of
a caption rather than a leak.

It went in as an opt in, so that the three judged style clips would keep
describing what they rendered while both were watched side by side. **`card` won
and is now the default for every style clip and every post**, the style clips
were re-rendered against it, and `post6.mjs` no longer overrides anything — the
override came out rather than being left behind to look like an opinion this one
clip still holds on its own. `fill: 'word'` is still there for anything that
specifically wants the reveal, and an unrecognised value throws rather than
quietly falling back to the behaviour that is no longer the default.

### Sync, measured on the finished file

The captions cannot drift from the voice by construction — both come from the
same array — but the mux can, so it is checked on the mp4 rather than assumed.
Running `silencedetect` over the shipped file and comparing every sentence onset
against the timestamps the captions were cut from:

```
threshold   mean offset   spread over 12 onsets
  -30dB        57ms          20ms
  -34dB        54ms          22ms
  -40dB        50ms          24ms
  -50dB        46ms          36ms
```

**Constant, not cumulative.** The offset does not grow across twenty two
seconds, which is what a real drift would do. It also shrinks as the detector's
threshold drops, which is what a threshold artefact does: the detector reports
the moment the signal crosses a level, and a word beginning with a stop
consonant — `talk`, `two`, `touch`, `three` — is silent for its first few
milliseconds. What is left is the synthesiser marking the boundary at the start
of the phoneme rather than at the start of the sound.

Forty five milliseconds, in the direction that puts the caption fractionally
ahead of the audio, which is the correct direction for a caption and far inside
what anybody can see.

### The scene layer

Five scenes in the block above the caption, at `115,175` and `310x186` css px —
57.4% of the frame width, centred, 127px below the top safe line. One viewBox unit
is 3.1 css px and 6.2 device px, which is what makes a 1.4 unit stroke a
confident 9px line at 1080 rather than a hairline.

**The block has come down three times**, all of them on marked frames. It started
at `115,82`, came down 70 device px to `115,117`, then 46 more to `115,140` with
the solid ink pass, and is now at `115,175`, another 70 lower. Both moves take it past the caption box's top edge, which sounds like a
collision and is not — **the box is 300..550 and the caption is anchored to the
bottom of it**, so no card in this clip draws above y=495. The clearance check
used to floor at the box's top edge whenever no card was on screen, which guarded
against nothing while the block was above it and would have failed on a collision
that does not exist the moment it came down. It now floors at a measured
**caption ceiling**: the tallest card there is, grown about its own baseline by
the biggest scale the entrance spring reaches. That does not depend on which card
is up, so the layer is checked against the worst caption in the clip on every
frame, including frames with no caption at all. Measured on the render at the
lowest position: **112px** from the lowest pictogram shadow to that ceiling and
**139px** from the lowest ink, against a floor of 40. The ceiling itself did not
move when the cards lost their full stops: the beat cards were already at the
brand's 44px cap and it is the tallest card that sets it.

**The scenes are solid ink, not outlines.** They shipped as hairline strokes and
were rebuilt as filled silhouettes with the detail cut out to the page, one soft
drop shadow per shape, and a real damped spring under every pop. What that means
shape by shape is under `lib/pictograms.mjs` in The library; what it changed
about these five scenes is in the table and the notes below.

| scene | window | what it is | keyed to |
|---|---|---|---|
| `intro` | 0.10..3.06 | three solid blocks popping in one by one, the count | the rhythm of the opening line |
| `money` | 2.76..7.45 | a filled document, a signature cut across it, a coin dropping onto it, a person and a check | `money` 4.14, `alone.` 5.03, `human` 5.98, `checks` 6.34 |
| `data` | 7.15..12.73 | a folder, an accent lock that arrives and then shuts, an eye with a knocked line through it | `without` 9.38, `rules.` 9.85, `decide` 10.79, `see` 11.48 |
| `checking` | 12.43..17.80 | a page, a white glass sweeping across it, a red x, the x turning into a check | `checking.` 14.10, `mistakes.` 15.49, `must` 16.86 |
| `close` | 17.50..22.20 | the mascot and a person joined by a bar, both signed off | `good` 17.94, `human` 18.68, `behind` 19.01, `whole` 20.34, `secret.` 20.60 |

**The handoffs are the gaps the reading already leaves.** The script counts out
loud and the synthesiser puts about half a second of air around each numeral, so
a scene change lands in silence rather than under a word: 2.91, 7.30, 12.58,
17.65. Each scene leaves 0.15s after its handoff and the next arrives 0.15s
before it, which is a 0.30s crossfade in the middle of the silence — the old
scene on its way out while the new one springs in, and the zone never empty
between two beats. Scene one springs in at 0.10 and the zone is empty for the
first tenth of a second, on purpose.

Inside a scene, every part is keyed to a word rather than to a count from the
scene's own start. That is why it reads as synced: change the script and every
number moves together, because they all come from the same array.

**One accent per scene, on the one thing the scene is about.** `--red` appears
exactly once in the clip, on the x, and it is the site's own error colour meaning
the site's own thing — something is wrong — for eight tenths of a second before
it becomes a check. Everything else is `--fg`, except the two things the solid
ink pass had to move:

- **The writing inside a shape is `cut`, which is `--bg`.** A `--muted` line on
  top of a near black filled document is one grey shape on another. Cut, it is a
  hole with the page showing through, and it casts no shadow, because a hole in
  a card is not floating over it.
- **The magnifier is `page`, which is also `--bg` but does float.** An `--fg` rim
  and an `--fg` handle on a filled sheet are invisible: the first render of the
  pass had a glass that read as a plain white hole with nothing holding it. The
  two inks are the same colour and differ only in depth, which is the only thing
  that could tell them apart in a light theme.

**The composition rule was learnt off the first render rather than decided in
advance.** The money scene first drew a document at x 14 and a person at x 76,
which balances once both are there and reads as broken alignment for the two and
a half seconds while only the document is. So the subject of a scene sits on the
block's own axis and everything else hangs off it. The same render also killed a
coin drawn as a circle with a bar across it — the bar read as a minus sign — and
found the coin landing exactly on the sheet's border, which reads as a badge
stuck to a corner rather than as a thing that landed.

**The solid ink pass cost four more geometry changes, all of them found on a
frame rather than reasoned about.**

- **The intro blocks lost their bar.** As filled chips they carried a white bar
  cut across the middle, which is a minus sign — the same mistake the coin made
  in the first pass. Three plain solid blocks are the whole read and need no
  symbol inside them. The rule is now the shape's own default: `square` draws no
  bar unless it is asked for one.
- **The folder narrowed and the lock moved ten units right.** Dark green on near
  black is a smudge. They were also knocked for one render and it was one fix
  too many: with three and a half units of page already between them, a white
  halo round the lock read as a sticker laid on the frame rather than a shape in
  it. The gap does the job alone; the eye's slash is the one part still knocked,
  because an `--fg` line across an `--fg` eye is one shape without it — and the
  knock itself came down from three units to 1.6 for the same reason the lock's
  came off.
- **The eye grew and moved up.** Filled, it is a much heavier shape than the
  outline it replaced, and at 22x9 five units above the lock the right hand
  column read as one busy stack rather than as two things. 26x11 at `cy 14`, with
  the lock a unit lower, puts eight units of page between them.
- **The work page widened and centred.** The glass's handle runs down and to the
  right and finished past the old page's edge, where a white handle on a white
  page is nothing.
- **The bond reaches into both silhouettes.** A bar with air at both ends between
  two figures is a punctuation dash, which is the one mark the brand does not
  allow anywhere a viewer can read one, and a diagram is somewhere a viewer
  reads. Touching both ends makes it a join.

**It runs on the rAF shim.** Node writes the frame with `__pic.set`, the one
flush per captured frame applies it, and the run checks afterwards that exactly
one tick happened and that the frame which landed is the frame for that time.
Nothing in the layer is a css transition.

### The mix

46 effects under the voice, every one of them synthesised in `lib/sfx.mjs` and
placed from a time that already existed. **Nothing in the clip is a hand written
cue.** A caption pop is the card's own `in`; a beat is one of the three cards
`emphasise` already marked; a coin landing is its own move step plus `IMPACT` of
its duration, the same constant `sceneFrame` uses to decide the coin has touched
down, so the sound is on the frame the shadow tightens on. Change a word in the
script and the voice, the captions, the scenes and the sounds all move together.

| sound | what cues it | level |
|---|---|---|
| `pop` | every caption card entrance (30) | -30 dB |
| `popDeep` | the three beat cards (3) | -24 dB |
| `whoosh` | each scene arriving (5) | -33 dB |
| `coin` | a `coin` part landing (1) | -22 dB |
| `click` | a `shackle` seating (1) | -25 dB |
| `sweep` | a `magnifier` moving (1) | -36 dB |
| `ding` | a `check` being drawn (4) | -27 dB |
| `hum` | the closing scene holding (1) | -34 dB |

The levels are a *relationship*, not a mix: one master gain moves the voice and
the bus together afterwards, so the table above is the only place the balance
between one effect and another is decided. The coin is loudest because it is the
one physical event the clip shows landing; the sweep is quietest because a
magnifier over paper is nearly nothing.

The balance between the two **tracks** is one number, `VOICE_TRIM`, and it is
**-1.5 dB** — the voice at 84% of where it was decoded. That does not make the
clip quieter: the loudness pass scales the voice and the bus together to hit the
same target, so trimming the voice moves the effects a decibel and a half up
against it, and the eight numbers that shape the set never move. **There is no
music track.** The mix is the voice and the effects and nothing else.

Three rules, all measured rather than asserted:

- **The voice is on top.** The bus is ducked 8dB while a word is being spoken,
  off an envelope built from the word timings with a fast attack and a slow
  release. Bus peak after ducking is -25.1 dB against the voice's -4.2 in the
  mix (-2.7 as decoded, before the trim).
- **Nothing is louder than the voice while a word is being spoken.** Checked
  window by window on the two buffers about to be summed, against the trimmed
  voice that is actually in the file. In all 699 windows a word is being spoken
  in, the closest an effect gets is **13.8 dB under**.
- **It does not clip and it is not too loud.** Gained and limited to **-14.4
  LUFS at -1.0 dBTP**, measured with `ebur128` on the written file, iterating
  until it converges.

That third one needed a real limiter. The first version raised the mix and
scaled it back down whenever the peak went over, which is not limiting, it is
turning the clip down: a synthesiser's speech has about 17 dB of crest, so
hitting -14 LUFS under a -1 dBTP ceiling by gain alone is arithmetically
impossible, and the mix came out 4.5 dB under target. `limit()` is a look ahead
peak limiter — a monotonic deque for the sliding minimum of the required gain,
5ms of look ahead, a 1ms slew down and 80ms back up — and it pulls 6.1 dB on the
loudest syllables and nothing between them.

**The under-the-voice check was wrong twice before it was right**, and both
wrong versions looked correct:

1. It gated on the *ducking envelope* and reported 96 failures, none real. The
   envelope has a 220ms release and stays open through the gap after every word,
   so it was comparing an effect playing in silence against silence.
2. It compared *instant by instant* and found two windows where the coin was
   3 dB over. Those were real measurements and a wrong test. Both windows are
   inside the /l/ closure in the middle of the word `alone`: speech is not
   continuous, every stop consonant is 30 to 80ms of near silence, so an
   instantaneous rule says no audible effect may ever overlap a word **at all**.
   That is not satisfiable by getting quieter, only by getting silent.

What it does now is gate on the voice being genuinely present *in that window*
and compare the effect against the speech level *around* it — the loudest 20ms
of voice within 150ms either side, which is what a listener hears as "the voice,
right now". It still bites: it takes +24 dB on the whole bus before it fails.
The stricter instantaneous number is printed next to the result rather than
dropped.

### The guards

The clips' guards, plus the ones this format needs: an audio track actually
present and the file no shorter than the voice, no card leaving before its own
last word, one card on screen at a time, the accent painted, exactly three beat
cards fitted at least 1.2x the ordinary ones and never past 44px, the safe area
sampled **once per card** against the drawn ink — captions, pictograms, mascot
and wordmark unioned, not just the captions — and at least 60px of clear air
between the lowest caption ink and the top of the head, measured on the drawn
card because a beat card is taller than an ordinary one.

The scene layer carries the same shape of guard as the mascot, and for the same
reason: every smoothness check passes on a layer that never drew anything.

- **Before a frame is rendered**, `sceneMotion` walks all 1332 of them and fails
  on a one frame step past any limit: 4.5 viewBox units of movement, 0.14 of
  scale, 0.12 of a path drawn, 0.20 of opacity, 10 degrees of turn, 0.22 of
  shadow lift. All six are frame rate relative, so `DEMO_FPS=12` does not fail
  on being a preview. **Lift is the shadow's own channel** — 1 in the air, 0
  landed — and it is guarded next to the rest because a shadow that trebles in
  size between two frames is exactly as wrong as a shape that does. The damped
  spring made it the fastest channel in the layer: the worst is the lock's
  shackle at 0.140, on the fifth of a second where its shadow collapses and the
  lock reads as clicking shut.
- **During the render** the same comparison runs against the same numbers the
  page is handed, unconditionally — every part holds a value at every instant of
  the clip, so there is no "it was invisible, it is allowed to have jumped" case
  to make an exception for.
- **Liveness:** the layer must have ticked exactly once per captured frame, the
  frame that landed must be the frame for that time, some part must have moved,
  and the page must have written a different value between two frames.
- **The frame:** at most two scenes on screen at once and only at a handoff, at
  least 40px of clear air between the lowest pictogram **shadow** and the caption
  ceiling — plus a guard that the ceiling is a measured card and not the box top,
  because a ceiling that silently fell back to the box would make the clearance
  check pass against nothing — and the 96 device px safe area held on every frame
  a part is moving, sampled at the midpoint of every step of every part, the
  middle of every handoff and each scene once settled, because a sweeping glass
  or a falling coin is furthest from where its own box said it would be.
The sound carries the same shape of guard, for the same reason:

- **Every cue rule must still match.** One effect per card, one per scene
  arriving, one hum, three deep pops for three beat cards, and at least one each
  of `coin`, `click`, `sweep` and `ding`. A rule that stopped matching a shape it
  used to match is silent, and would otherwise only show up as a clip that went
  quiet.
- **Nothing runs off the end.** A sound the clip's end cut in half is faded as a
  backstop and reported as a fault, because the fade in `ends` cannot help with
  a fade that was never rendered.
- **Liveness and balance:** the bus must not be silent and must peak below the
  voice, and the voice trim must have measurably moved the voice — a balance
  knob that silently did nothing would leave every other number in the report
  looking right.
- **The mix:** no window over the voice, loudness within 1 dB of -14 LUFS, true
  peak at or under -1.0 dBTP, and the limiter never pulling more than 9 dB —
  past that it is squashing rather than limiting, and the level table is what
  changed, not the material.
- **The captions:** the plan must say it dropped punctuation, it must actually
  have dropped some, and no card word may end in a mark.

- **The depth is guarded twice over.** Every border and clearance number comes in
  two forms, the ink alone and the ink plus the shadow it is throwing on that
  frame, grown from the same three numbers the frame was drawn with and scaled by
  the part's own scale, because the filter sits inside the transform. The ink
  keeps the frame's 96 device px floor; the shadow gets its own lower floor of
  72, because a large blur at low opacity is allowed nearer an edge than ink is.
  A third guard fails if the two ever come back equal, since that is what a
  silently broken expansion looks like. And because the depth is markup rather
  than css, the page's count of shadow filters and knocked parts is checked
  against the plan's, 22 and 1. Measured on the render at the lowest zone
  position: **284 device px** from the ink to a border and **253** from the
  shadow.

## The seventh clip — one scene, one beat

```
node post7.mjs                  the clip
DEMO_FPS=12 node post7.mjs      the fast preview pass
```

**10.22s, 60fps, 1080x1920, 0.68 MB**, voice and 16 effects in the file, into
`demo/out/post7-1080x1920.mp4`. About a minute and a half. `post6.mjs` is the
template and every part of the stack is the same one: voice first, captions cut
from its word timestamps, a pictogram scene keyed to the same words, the mascot
on the same clock, sound derived from those plans, the zone at post6's final
position and the voice trimmed the same -1.5 dB.

> one tip for your business. start with one boring task. not five. one.
> automate it. see it work. then take the next.

Four things are genuinely different from post6.

**It is a third of the length and the opposite shape.** post6 counts out three
things. This argues against counting: the script is a case for doing one thing,
and the clip is 10.22s because that is what the case takes.

**One scene, evolving, with no handoffs to hide behind.** post6 cuts between five
scenes in the silences the reading leaves. This holds one scene for the whole
clip and changes what is in it — five squares arrive, four dim to 18%, the one
that is left gets a check cut into it, a second lights up. Every change is in
plain sight, so every change has to be one the voice is making at that moment:

| the line | at | the zone |
|---|---|---|
| `one tip for your business` | 0.12 | squares one and two arrive |
| `start with one boring task` | 1.75 | three, four and five arrive |
| `not five` | 3.90 | all five are up for it |
| `one` | 4.99 | four dim, outside in; the middle stays |
| `automate it` | 5.75 | the check is cut into it |
| `see it work` | 6.74 | it holds, which is the point |
| `then take the next` | 7.79 | a second square lights up, accent |

**The beat is a word, and it lands once.** post6 marks three numerals; this marks
the card that is the word `one` and nothing else. It lands alone at 4.87s. The
brief asked for both times it lands alone and the copy only lands it alone once:
`one` is also said at 0.12 and 2.20, inside `one tip` and `one boring task`, and
a card is cut at a sentence end or at two words, so neither ever gets a card of
its own. The guard finds the standalone `one` cards without the regexp and fails
if any of them is not a beat, so if the copy ever gains a second this file will
treat it as a beat without being edited.

**The beat sets the caption size when the copy is short.** `capSize` is 30 here
against the engine's 40. This copy never runs out of box — the widest ordinary
card is `automate it` — so every card lands on whatever the cap is, and at 40
that put the ordinary cards at 39.6px against a beat capped at the brand's 44.
An 11% jump is a wobble, not emphasis. At 30 the beat is **1.47x**, which is
post6's 1.55 within a fraction.

The composition is a centred band rather than a full block, and that is what the
brief asked for: five squares across a 100 unit board caps each at about 16 units
with a gap worth having, so the scene is 16 units of a 60 unit box and the rest
is air. Stretching it to fill the block would mean five *large* squares in a row,
which is a different picture.

### What post7 cost the engine

Two fixes in `lib/pictograms.mjs`, both of which post6 is unaffected by because
post6 has no `fade` steps at all.

- **`fade` goes to a level, not to a switch.** It read `to` as zero or not-zero
  and always ramped the whole way, which is fine for appearing and disappearing
  and cannot say "half there". Four squares at 18% needed it to.
- **A step no longer writes an opacity before its own start time** unless nothing
  else has. This was a real latent bug: a part that popped in and faded later had
  its pop's fade-in silently overwritten by the later step — at 1.1s the pop was
  a tenth of the way in and the fade three seconds away was already saying 1.
  `flip` with `dir: out` has always worked the right way and for the same reason;
  this brings the two into line. `planScenes` now also refuses a `fade` that
  starts while the step in front of it is still running, unless it says `from`
  explicitly, because otherwise the two disagree about the same number on the
  same frame.

And one in `lib/sfx.mjs`: **`humAt`**. `settle` puts the closing swell under the
whole of the last scene, which is right when that scene *is* the close — post6
hands off into a four second closing beat. A clip built out of one scene that
runs the whole length has no closing scene, and `settle` would have started the
hum in the first half second and held a drone under the entire film. `lastStep`
finds the last part to start moving, which is the close of a single scene clip.
Still derived; no clip using it types a time. post6 keeps `settle`.

### The mix

16 effects. Same derivation, same levels, same balance as post6.

| sound | n | from |
|---|---|---|
| `pop` | 12 | every ordinary caption card |
| `popDeep` | 1 | the beat |
| `whoosh` | 1 | the scene arriving |
| `ding` | 1 | the check being drawn |
| `hum` | 1 | the scene closing, 2.34s sized to the room it has |

No `coin`, `click` or `sweep` — this scene has nothing that makes one, and the
guard **fails if one shows up**, which is the useful direction for a clip whose
cue rules are shared with a clip that does have them.

Delivered at **-14.5 LUFS, -1.0 dBTP** measured on the mp4. Bus peak -25.2 dB
against the voice's -4.7. In all 259 windows a word is being spoken in, the
closest an effect gets is **22.1 dB under** — and this clip never breaks even the
strict instantaneous reading, which post6 does twice inside one consonant. The
loudness loop runs **six** passes here against post6's four: limiting is not
linear, each pass gives back a little less than it asks for, and four left this
one 0.7 dB short.

### Clearances

| | measured | floor |
|---|---|---|
| lowest shadow → caption ceiling (y=495) | 180px css | 40 |
| lowest ink → caption ceiling | 201px css | 40 |
| ink → border | 241 device px | 96 |
| shadow → border | 211 device px | 72 |
| caption → head | 104px css | 60 |

More air than post6 has, and that is the band composition rather than a fault:
the row sits at the zone's vertical centre and reaches y=38 of 60 where post6's
scenes reach 57.

## The ninth clip — the pitch reel, and the first one that films the site

`post9.mjs`. Seven beats, **four render passes, one clock, one encode**, and the
first clip in here that is a cut film rather than one composed frame.

A composed page and the live `index.html` are different documents, so they cannot
be one browser page. Each pass renders a contiguous range of the same
`f%06d.jpg` sequence over the same global clock and the whole thing is encoded
once. The seams are hard cuts and every one lands on the first word of a beat.

| pass | beats | page | shot |
|---|---|---|---|
| A | 1..2 | composed | pictograms, and the first shipped stagger |
| B | 3..5 | the live site | the hero, the form, the cards |
| C | 6 | the live site, loaded fresh | the glitch cta, pressed |
| D | 7 | composed | the end card |

**Pass C is a second load of the same page, and that is the page own behaviour
rather than a cheat.** `openForm()` puts `.gone` on `.cta-zone`, and the only route
back to the button is submitting and pressing start again. Beat four opens the
form; beat six needs the button. So beat six gets a fresh page.

**Beat four is a real interaction and it fits inside 1.9 seconds because of how
the page routes.** The cta is pressed 0.72s before the beat, so the card is open
and settled before the snap zoom measures it — and that number is index.html own:
`.card` grows a grid row from 0fr over .44s and `.cardin` springs over .52s, and
while that runs `.pad` is a full height box clipped inside a short one, so it
measures as ending below `.below` and the gap comes back negative. A first pass at
0.55s rendered it at -111.8px and a guard caught it. Then one press on the
fourth path option, "i just have a question", and the page does the rest: a
single pick chip marks itself pressed, waits 240ms and advances itself, and that
answer routes to a two step path whose second step is a textarea. One press
shows the ui answering and puts a field on screen.

**The camera is gsap in node, on the house curves.** A leg is a paused tween over
`{cx, cy, z}`, seeked per frame, built when the leg starts because where it is
going is a live element rect. `btk.pop` for a zoom stop, so it overshoots and
settles; `btk.drift` for a long move across a page; `btk.glide` for a push.
Nothing is ever a still frame: a seeded drift of under one percent of scale
rides on every frame, on the composed passes too.

**The page sets a zoom ceiling, and it is lower than anyone expects.**
`index.html` is laid out edge to edge at 540 css px: the h1 is 470 wide, the
subline 494, the info cards 508. A frame at zoom z is 540/z wide, so past **1.15
the h1 crops, 1.09 the subline, 1.06 the info cards**. The fix pass tried the
hero at 1.33 to 1.50 and rendered THE BORING TEK as SHE / 7/RING / MEK, which is
a worse defect than the shy zoom it was fixing. So every site shot now lives
between **1.06 and 1.14**, each taking the deepest zoom that leaves its own
subject whole, and the depth comes from travel instead — about 700 page px
across the film, with the two snaps covering 230 and 400 of it in eight frames
each. Which is what `record.mjs` concluded the first time anyone pointed a camera
at this page: the language here is vertical, not scale.

The other two framing rules still hold. Zoom never goes under 1.0 or the fixed
layers show their own boxes in the margin. And the subline is still the widest
line the page sets, so `clipCheck()` still measures whether it is in frame and
cut — but it **reports** now rather than failing, because the caption band has to
sit on empty page and the framings that do that crop it by about ten px a side.
It earned its keep before that: an early pass C framed the button at a base 1.09,
the drift took it to 1.103, and fourteen frames came back clipped.

**The captions are the `float` style and they are measured against the footage.**
At every card settled frame the caption goes to opacity zero for one extra
screenshot of its own band, the ink is put back, and the frame that ships is
captured afterwards. The band comes back as a png, because a jpeg would be
measuring its own ringing, and node inflates it with `zlib`, which is already in
node. No dependency was added for it. Two numbers come out and they answer
different questions: the mean says whether a card can be read, and the darkest
pixel says whether any of the page own ink is directly behind a word.

That probe had a real bug worth keeping. It hid the caption with
`visibility: hidden` on the container, and `apply()` writes `visibility` onto
every card on every frame, so a card that was up set itself back to visible and
the container hiding itself did nothing. The probe was photographing its own ink
and reporting the darkest pixel behind the caption as the caption, which came
back as a flat 1.00:1 on a blank white page. Opacity multiplies down the tree
and a descendant cannot override it. Visibility is inherited and can be.

**The rig wordmark is off for the two site passes**, and the render settled it.
`index.html` has its own wordmark in the footer with a row of social icons under
it, and a second wordmark at 89% of the frame lands on top of both. The brand is
not missing while it is off: beats three and six are filmed on the hero, whose
h1 is the wordmark at full size, and the composed passes carry the small one
where it has always been.

**Weight 700.** `index.html` asks for Michroma and Space Grotesk at 400 and 500 in
one request and that budget has not moved. The render pages ask for 700 as well,
because what leaves a render page is pixels rather than a font request. It is
the only place in the repo where that reasoning applies and it applies only
there.

### The fix pass, and the five things watching it on a phone found

The first cut passed every guard it had and was wrong in five ways that only a
phone shows. All five are fixed and four of them changed a rule rather than a
number.

**1. The safe area was the frame own, not a platform own.** 96 device px is what
a phone needs; tiktok stacks a button column down the right and a caption across
the bottom, instagram takes chrome top and bottom, youtube shorts eats the bottom
for the title and the subscribe row. The floors are per edge now — **180 top, 220
bottom, 140 left and right** — and the single `SAFE` is gone rather than kept
alongside, because two floors is one floor nobody reads. The wordmark moved up to
86.0% of the frame and **the 88 to 90% band is retired**: it sits inside the
platform bottom strip.

**2. The captions had no fixed home and landed on the site own text.** They have
one now, and it does not move for any beat in any pass: ink band **710..763 css**,
394 device px off the bottom edge. What moves instead is the camera. Every site
shot is expressed as **a gap between two elements, centred on the caption band at
a given zoom**, measured live and never typed as a page coordinate. The page has
exactly two bands with no writing in them and both were measured off the real
document: `.cta-zone` ends 576 and `.cards` begins 634 with the form shut,
`.pad` ends 807 and `.cards` begins 865 with it open. `bandClash()` checks every
frame and the run reports held frames separately from frames where the camera or
the page is moving — a clash mid move is a transient, a clash on a held frame is
a shot somebody reads.

**3. There was green that was not a money word.** The pictogram scene lit its
core with a solid accent square for two and a half seconds, which is a green card
by another name and exactly what the brief says the accent may not be. It is a
check cut into the ink now, and a guard fails the render if any part of any scene
is inked `accent`. The green touches five words in the whole film and nothing else.

**4. The moves were shy, and one of them could be fixed.** Snaps are **eight
frames** on `btk.pop`, which overshoots ten percent past the mark and settles back
through a dip, and they are **pre rolled so they land on their beat first word**
rather than leaving on it. The run prints every move with its landing error in
frames. The zooms could not go deeper — see the ceiling above.

**5. The typing was a machine.** Every gap is now its own number between 40 and
140ms, one gap is a 200ms hesitation, and one letter is got wrong, noticed,
deleted and typed again — a real keystroke and a real Backspace through the page
own `input` listener, so the site state goes wrong and comes right the way it
would for a visitor. The wrong letter is a keyboard neighbour, because a typo is
a finger landing next door. It is seeded, so the rhythm is uneven and identical
on every run. The caret is driven too: Chrome draws and blinks its own on a clock
virtual time does not reach, so the rig writes `caret-color` per frame — solid for
half a second after a keystroke, then a 530ms blink.

One more the fix pass found on its own: pass B loaded the page fresh at the cut,
so index.html own wordmark decode scrambled the brand name on camera for two
seconds. The page now gets four seconds of its own clock before frame zero. The
decode still happens; it happens off camera, which is where a page load belongs
in a film.

## The tenth clip — the rage clip, and the first dark one

```
node post10.mjs                 the clip, shutter shut
node post10.mjs --blur          the final, four subframes to a frame
DEMO_FPS=12 node post10.mjs     the fast preview pass
```

**13.17s, 60fps, 1080x1920, 790 frames, 4.11 MB at 2.50 Mbit/s**, the voice and
four slices of music in the file, into `demo/out/post10-1080x1920.mp4`. **8.1
minutes with the shutter open**, about two without. One composed page, one render pass,
no site footage and no pictogram layer — this is the only clip file that does not
import `lib/pictograms.mjs`.

> fuck you, i am gonna become every single thing // you said ai could never be
> // and you will use me every single day // and love it

Four sentences, one take each, and seventeen cards on screen. `//` is where the
voice stops for half a second and the frame comes apart.

**Group 2 said `a machine` until 2026-08-28 and now says `ai`.** One word, and
only group 2 was resynthesised — the sidecar cache keys on the copy and the
delivery, so the other three takes came back untouched and the audio under them
is the file that was already approved. `ai` is read as two letters rather than
as a word, so it costs 0.60s where `a machine` cost about the same: the clip
lost eight hundredths of a second, not six tenths. Everything behind the change
shifted by that much and nothing else moved — not the stab spacing, not the
outro choice, not the mix, not the look.

Black screen, film grain on it, the mascot in the middle in a white crt glow, the
site's own speech bubble above him with one short card in it at a time, and the
frame coming apart three times while he talks.

### The frame

`data-theme=dark`, and that is doing the work rather than a recolour: `--face` is
#f4f7f5 and `--eye` is #06070a, the page background, so the white face reads as a
hole punched in the screen exactly as it does on the site. The glow is the
page-builder spec's three layer model done in white instead of phosphor green — a
core, a `blur(13px)` duplicate and a `blur(34px)` one, plus a wide radial halo.
The radius is set once and never animated; what moves is opacity.

| | css px of 960 |
|---|---|
| the pill | 389..494, measured to the ink and capped at 368 wide |
| the three dots | 504..572, climbing up and right out of the head |
| the mascot | 592..768, 176px, centred |
| the wordmark, end card only | centred on 480, fitted to 360 wide |

The safe area is post9's, per edge: **180 top, 220 bottom, 140 left and right**.
The pill is 368 of a 400px safe width, which leaves the frame shake sixteen css
px a side to spend, and the run measures the worst case rather than trusting the
budget — **191 left, 933 top, 165 right, 936 bottom**, sampled at every card's
settled frame **and at every glitch's hottest frame**.

**There is no accent anywhere in it.** The `float` caption style paints `--fg`
and only `--fg`, `flash` is off, and a guard fails the render if the accent
colour is painted on a single frame. post9's review ended on "if in doubt, no
green at all"; this one is not in doubt.

**`float` with `fill: 'word'`, and that combination wants a short `lead`.** Under
the `card` fill the card springs in and `lead` (0.12s) buys its entrance time.
Under `word` the card does not spring at all and each *word* arrives 0.05s before
it is spoken, so the only thing `lead` decides is how long the card in front has
been gone before the next word is drawn. At the default that is seventy
milliseconds of empty pill, seventeen times over. `lead: 0.05` makes the handoff
exact. It is a clip level option: post6, post7 and post9 all use `card` and are
untouched.

**The censored word is one substitution on the caption's copy, made after the
synthesiser has answered.** The voice says the word; the screen says `fu*k`. The
star gets an element of its own in the markup so it can flicker like a dead
pixel, which is safe for one reason: `apply()` writes opacity, transform and a
data attribute onto a cell and never touches its text, and the fit measures the
plan's own strings on a canvas rather than reading the dom.

### The voice is four takes, and each one is a sentence

Each group is synthesised on its own and they are laid on one clock with
**exactly 0.50s of silence between them**. Four recordings are four known
quantities; cutting that gap out of one recording would mean finding the silence
and hoping the synthesiser put it where the full stop was.

**They used to be seventeen sentences and that was the fault.** Every line was
written as its own — `become. every. single. thing.` — because a full stop is
most of half a second of air and that is where the staccato came from. It worked
and it was wrong: a synthesiser told to stop after every word reads word by
word, which is the one thing a machine voice already sounds like. Connected, at
Andrew's `calm` register taken down to **-10% and -4Hz** — two numbers rather
than a fourth voice — it measures **2.97 to 5.68 words a second** against a flat
2.3, and the pauses are the ones the reading puts there: a 0.46s hole after
`you,` and 0.12 to 0.18s of breath before `every`, `could` and the second
`every`.

**What that cost is the free card cut.** A card breaks at a sentence end, so
with one sentence to a group there is nothing to break on and `perCard` lands
the cuts in the wrong place: `fuck you i`, `am gonna become`, `you said a` —
post9's `do it we` again. So the cut is **marked rather than inferred**.
`markCards` walks the card list against the word list and puts a comma on the
last word of each card, **on the caption's copy only, after the synthesiser has
already spoken**; `cardBreak` breaks on it and `punctuation: 'drop'` takes it
off again before a card is drawn. Nothing about the audio or the timing can
move, and the engine is untouched — it is the case `cardBreak` was added for.

Be clear about which half is which: the marks decide where a card ends, so the
guard that the cards came out as the list is weaker than it was. What the marks
cannot fake is that the voice said these words in this order, and that is checked
twice — once as the marks go on, once against the drawn sequence afterwards.

The cards are faster than the staccato cut's. Windows run **0.245s to 0.938s**,
median 0.37s; two are compressed under the engine's 0.30s entrance and **none is
late**, which is the number that would be a fault. `could` is spoken in 0.195s
and gets a 0.245s card, which is the caption following the voice rather than
drifting off it.

**The gap is measured on the waveform, not on the word list, and that is a fault
this file had and rendered a preview with.** The synthesiser's WordBoundary
carries a duration shorter than the sound: `thing.` came back ending at 4.728 and
the recording is still at speech level for another **0.12s** after that. Stabs
placed on the reported end therefore opened on top of a word that was still being
said — and the check written to catch exactly that, *no music inside a word's
window*, **passed**, because the window came from the same word list the bug came
from. The run said so out loud anyway: the voice measured -21 dB under two of the
three stabs against a median speech level of -21.

A group now ends where its own recording falls 46 dB under its own peak. The word
list still drives the captions, the head bob and the micro glitches, because for
those a word boundary is exactly the right thing; it is only the silence that has
to come off the waveform. Under the three stabs the voice now measures **-56, -51
and -49 dB**, which is 35, 30 and 28 dB below speech.

### The music

Three 0.5s stabs and one 2s outro, and nothing else.

**The stab and the hole it lives in are one number.** The music only ever plays
where the voice is not and that is guarded to the sample, so a 0.5s stab in a
0.4s gap would play under the next word and fail the render, while a 0.4s stab
in a 0.5s gap would leave silence in the middle of a glitch. Lengthening one
lengthens the other, and a guard says so rather than leaving it as a coincidence
two constants happen to share. **No background bed, and no
synthesised effects at all** — `lib/sfx.mjs` is used for its decoder, its mixer,
its limiter and its meter and for none of its nine sounds. The silence between
the words is the style.

**Which track is measured on every run, not remembered.** `punchOf` finds the
biggest rise anywhere in a file from the 60ms before a moment to the 80ms after
it, and the render fails if the track named as the main is not the harder hitting
of the two — so a swapped pair of files stops the clip rather than quietly
changing it.

| | |
|---|---|
| `track2.mp3` | 88.66s, 28.0% of the file within 12dB of peak, rises of 12 to 17 dB every 1.85s |
| `track1.mp3` | 96.08s, 8.2% within 12dB of peak, **it never hits** (+10.8 against +21.9) |

So track2 is the main and track1 is used for neither role.

| slice | from | into the clip | why |
|---|---|---|---|
| stab 1 | 4.16s + 0.50 | 3.64s | attack -8.2 dBFS, +14.2 dB over the 60ms before it |
| stab 2 | 26.30s + 0.50 | 6.10s | attack -7.7 dBFS |
| stab 3 | 20.76s + 0.50 | 8.64s | attack -6.3 dBFS, the loudest |
| outro | **16.60s + 2.00** | 10.02s | rises +2.5 dB, ends on its own loudest passage at -5.0 dBFS |

**The outro moved when it doubled, and extending the old one was the wrong
answer.** The one second slice was 49.06; over 2.00s that same region rises
**+0.5 dB and ends at -9.6**, which runs out rather than arrives. Every 2.00s
window in the track was scored on how much it rises across itself and how loud
its last quarter second is, and 16.60 wins on the thing that settles it: it
**ends on its own loudest sustained passage**, so the hard cut at the end reads
as a cut rather than as a fade. 60.90 is the same bar of the loop and scores
within a tenth; 48.12 rises too and ends in a decay at -11.5, which is the
failure the test was written to catch.

**The three stabs escalate and that is the source's doing, not three gains.**
One gain moves all four slices, exactly the way `GAINS` fixes the relationship
between the synthesised sounds and one master moves them, and a guard fails if
the three attacks stop getting louder in the order they are played. Every stab
starts a hair before its hit, on 40 to 60ms of near silence, so the attack is
whole. The outro is the one second window whose last fifth is loudest and which
rises most across itself — **a bar level rise rather than a crescendo, because
there is no riser anywhere in either file**, and saying so beats claiming a build
that is not there.

**`punchOf` had to be written twice and the first version is worth keeping.** It
scored `track1.mp3` at **+144.6 dB**, because that file opens on true digital
silence: `pre` was zero, dbfs of nothing is -180, and the first note in the piece
came back as an infinite rise off it. It would have failed the render on the
wrong track. A hit is a rise **from something audible to something worth calling
a hit**, so the level it rises from is floored 60 dB under the file's own peak
*and* a moment whose run-up is under that floor is skipped entirely — a file
beginning is not a transient.

### The mix, and the one number that changed

Voice trim **-1.5 dB** and the loudness targets are post6's and are untouched.
Delivered at **-14.2 LUFS / -1.0 dBTP**, limiter pulling 7.1 dB at its hardest.
The music sits at -6.2 dB, set by a rule rather than by ear: a stab's rms against
the median 20ms of actual speech, +7 dB, with a peak ceiling 2 dB over the voice
as a cap. The run prints which of the two bound.

**The ducker is off, and it is off because of a number.** post6 pulls the effects
bus 8 dB down while a word is being said, and 0.60 is right for a bus that plays
*under* speech. This one never does: a stab opens on the frame a group's last
sound stops. `voiceEnvelope` has a 220ms release — the same release post6 already
found could not be trusted as a check, because it stays open through the gap
after every word — so it is **0.987 open at the instant the first stab lands**,
which is **7.8 dB off the attack of every stab in the film**: the one part of a
stab that is the stab. The run prints that counterfactual next to the zero it
uses, and a guard checks the bus in the mix is the bus that was built.

The check post6 runs is *the bus is under the voice*. This clip's is stronger and
it is the one that matters here: **there is no bus while there is a voice.**
Measured on the two buffers about to be summed, it is **0.000s**.

### The glitches are quantised to the frame grid

Three hard ones in the stab gaps, one at the open, two on the outro, and a single
frame micro glitch on every word entry. Each is a shake, an rgb split, a noise
burst, up to three torn bands and a dropped frame, on an envelope that is full
for its first eighth, decays to nothing by five sixths and is **clean for the
last sixth** — the snap back, and a fact the guards check rather than a
description.

**A glitch is computed once per output frame and held across all four captures of
it.** With the shutter open every frame is captured four times inside its own
sixtieth of a second and the four are averaged, which is what a spring or a
falling coin wants and is exactly wrong for a fault: a one frame rgb split
written as a function of `t` would land at a quarter strength and a violent shake
would come out as a blur rather than as a jump. It is structural rather than
asserted — there is no path by which a subframe can compute its own. The
caption's springs, the eye drift, the head bob and the phosphor pulse are all
still continuous and all still smear.

**A tear is a band of the frame blacked out and redrawn shifted.** Three layers
sit above everything, each painting `--bg` first so it covers what is under it,
then drawing its own copy of the mascot, the bubble and the wordmark displaced
sideways. The copies read the same custom properties off the stage, so there is
nothing to keep in sync: one set of numbers, two readers. The caption is not in
the copy, so a band across the words takes them off the screen.

**17.7% of the frames carry a glitch**, 117 of them tear, and every channel is
at rest on every frame outside a window — checked, 0 faults.

**Six windows, not four.** Three in the stab gaps, one at the open, one tearing
the mascot away, and **three on the end card** — because a two second outro
cannot just be held. All three of the end card's are read off the slice rather
than typed against it: the brand **arrives on a hit at +0.57**, is hit again at
**+1.45**, and once more at **+1.91**, which is 0.09s before the music stops, so
the last thing the clip does is get hit and then go quiet. Re-slice the outro
and all three move with it.

### The film, and why this clip is crf 22

Grain, a scanline pattern, dust and an occasional scratch. All of them stepped
rather than eased, all of them driven per output frame from node: a speck that
lives two frames is a speck, and a speck averaged across four subframes is a
smudge.

**post7 says no grain and this clip has grain, and both are right.** post7's note
is that every platform recompresses a clip and grain through that is noise rather
than texture — true, and on a white frame it also costs bitrate for nothing. This
frame is near black, where a very low opacity actually reads. It is held at 0.07
and stepped at 8Hz.

**The scanline roll is stepped with it, and that is a bitrate decision.** A one
pixel line pattern sliding continuously across a 1080x1920 frame is the single
most expensive thing a codec can be handed, and the first preview spent most of
its 7.7 Mbit/s on it. Stepped, the layer is identical on four frames out of five,
and film jitters rather than gliding anyway.

**Every clip before this one is crf 17 and this one is not.** Those are ink on a
white page: large flat areas, a few hundred lit pixels, and 17 costs nothing.
This is film grain over black across the whole frame. Measured on the same 200
preview frames:

| crf | | |
|---|---|---|
| 17 | 16.00 MB | 7.68 Mbit/s |
| 20 | 7.45 MB | 3.57 Mbit/s |
| **22** | **4.20 MB** | **2.02 Mbit/s** |
| 24 | 2.51 MB | 1.20 Mbit/s |

22 was looked at rather than assumed — the grain, the glow, the bubble outline
and the star all survive it — and **2.02 Mbit/s is what post9 delivers at 17**.
So the clip ships at the same bitrate as the one before it and the crf differs
because the picture does. **The final lands at 2.61** — up from the first cut's
2.39 because that cut lost 3.6 seconds to the fix pass while its glitch windows
got longer, so the share of frames carrying a tear, a split and a noise burst
went from 9.8% to **17.7%**, and those are the expensive frames.

### What the reviews found

`skills/video-review` has run four times on this clip, twice per cut: on the
12fps preview and again on the finished 60fps file, before and after the fix
pass. Five findings, all fixed, none carried as a backlog.

**On the preview.** A seventy millisecond hole in the bubble before every one of
the seventeen cards — the `lead` fault above. And a mascot whose eyes were in the
same place in all thirty four sampled frames: ±0.55 units is about a css pixel
and a half on a 176px head, which is real, inside every guard, and invisible.
"Calm idle animation" still has to be an animation. It is 1.1 now, still under
half of what post7 spends on a mascot that is listening rather than staring.

**On the first cut's final, and the preview could not have shown it.** The exit
was hung off the voice alone, so the mascot and the bubble were torn away at
14.50s of that cut while `and love it` was still on screen until 14.72 — two
tenths of a second of white
words floating on black with no bubble round them, which reads as a mistake
rather than as a style. **The exit is now the later of "the voice has stopped"
and "the last card has left"**, everything in the tail hangs off that one number,
and a guard fails the render if the caption would outlive its own container.

**On the fix pass's preview.** The end card held twice — 1.05s and then 0.77s
unchanged, with four of the six frames sampled across it the same picture, which
is what doubling the outro bought if nothing was put in the room it made. Two
more measured pulses went in; the longest unchanged stretch is 0.60s now.

**On the fix pass's final, and this one no review could have found.** The
liveness guard reported **one identical frame pair at 11.8333s**. Not a false
positive: on the end card the mascot, the caption and the bubble are gone and
the grain and the scanline are stepped, so the phosphor was the only thing still
moving — and **a sine stands still twice a period**, so the two frames either
side of its turning point wrote exactly the same values. **It only appeared at
60fps**, because at 12 no frame pair lands symmetrically about the peak — the
same shape as post9's frame zero leg, and the second fault this pipeline has
produced that a preview cannot show.

Fixed at the cause rather than at the threshold: the phosphor is two sines on
incommensurate periods, so they never turn together. Measured over the end
card's own frames — one sine, one identical pair and a smallest change of
exactly zero; two sines, none, and 3.7e-4. It is a better phosphor as well,
because a real one does not flicker on one frequency.

Both finals are a pass on all seven checklist items. Three things are recorded
as deliberate so a later reader does not report them as new: about a tenth of a
second of near black between the mascot being destroyed and the wordmark
arriving; one frame in five of a glitch dropping to 20% brightness; and the
censored star, which is dimmed for six single frames of its card's fifty two, so
a paused frame can read `fu k you` where a playing one reads as a flicker.

### The guards

The usual shape — the thing must have happened, it must have happened everywhere
it was supposed to, and the claims in the log must be measurements — plus the
ones this clip needed:

- **no accent is painted on any frame**, and the probe still resolves to a colour
  so the check cannot pass vacuously
- **the seventeen cards come out as the seventeen lines**, and separately **the
  drawn word sequence matches the copy** — the second is the half the cut marks
  cannot fake, so a synthesiser that comes back saying something else fails the
  render rather than shipping a different clip
- every card ends on a word this file marked, so `perCard` agreeing with the
  marks by accident is not mistaken for the marks having worked
- the uncensored word never reaches a card **and** the script sent to the
  synthesiser still contains it
- each of the three gaps measures 0.50s, **the stab and the gap are the same
  number**, and the voice is at least 24 dB under speech throughout each stab
- the three stabs still escalate, and the main track is still the harder hitter
- every glitch channel is at rest on every frame outside a window
- one micro glitch frame per word, at 60fps, where a frame is short enough for
  that to be meaningful
- **the caption never outlives its bubble**
- no two consecutive frames are identical before the cut to black

## The eleventh clip — the explainer, and the site inside a card

```
node post11.mjs                 the clip, light, shutter shut
node post11.mjs --dark          the same clip on the near black page
node post11.mjs --blur          the final, four subframes to a frame
DEMO_FPS=12 node post11.mjs     the fast preview pass
node post11.mjs --plan          every plan printed, and nothing rendered
node post11.mjs --encode-only   re-encode from kept frames
```

**47.03s, 1080x1920, the read in the file**, in two variants:

```
demo/out/post11-light-1080x1920.mp4
demo/out/post11-dark-1080x1920.mp4
```

A calm friendly explainer for the service: big simple type, real captured footage
of the live site inside a card, and the corner mascot reacting throughout.
Positive, not rage, not dry.

**Both variants rendered at 60fps with the shutter open at four subframes to a
frame, and both were green.** 6.69 MB at 1.14 Mbit/s light, 8.05 MB at 1.37
Mbit/s dark, logs at `out/final-light.log` and `out/final-dark.log`.

**Neither file is still there.** The clip renders to one path per variant every
time, and the 12fps previews from the brain removal below wrote to those two
paths. What sits at them now is that preview pair, 3.96 MB light and 4.54 MB
dark, logs at `out/p11-light-noslot.log` and `out/p11-dark-noslot.log`. The
finals' own logs survive; the finals do not. **Both variants want `--blur` run
again**, and until they are, there is nothing at sixty to watch: the geometry and
type numbers below were measured off 12fps previews and are unchanged by the
frame rate, but nothing about motion blur, the torn bands or the brick landings
has been seen on a final. See the end of the section.

Three firsts. **It is the first clip built on `lib/mascot.mjs`**, so the mascot's
performance is a list of marks rather than a list of gaze keys. **It is the first
that puts the live site inside a card** rather than filling the frame with it.
And **it is the first that renders in both themes off one plan**.

### One composed page, not four passes

post9 films the site by loading `index.html` and putting a camera, a cursor and a
caption layer on top of it, and cuts to a composed page for the beats that are
not the site. That is right for a film whose site shots are full bleed. This one
is not that: the site is a **card** in the middle of a white frame with our own
type under it and the mascot in the corner, and the mascot has to be alive on
every frame including the site ones.

So the site is an **iframe, served from the same origin**, inside a clipped card,
and the camera is a transform on the iframe element. One page, one clock, one
render pass, no cuts. `index.html` is loaded exactly as it is in git and nothing
at all is injected into it for the framing.

**The crop is the framing, and it is why the nav is gone.** The site's top bar is
`position: fixed`, so it sits at the iframe's own top whatever the camera does,
and the card never shows the iframe's top sixty css px. That is arithmetic rather
than a promise, and there is a guard on it: the nav was inside the card on **0**
sampled frames.

### The frame

| | css px of 540x960 |
|---|---|
| the site card | `76,96`, `388x420`, a 1px `--line` hairline at the 16px radius |
| the caption band | ink at `572..620`, and it does not move for any of the fourteen lines |
| the mascot | bottom left, 240 device px of head, the module's own resting turn |
| the end card | the wordmark on 285 and `theboringtek.com` on 347 |

**The captions run over all fourteen lines, including the site beats.** The brief
names the caption style only for the type-on-white lines, which reads as the site
being the screen on its own beats and would leave a viewer with the sound off
getting seven lines of fourteen. Einz's call, and the cost is vertical: the card
is 420 css px tall rather than the ~520 it could have been, so the band has a
fixed home clear of both the card and the mascot's corner.

The card sits **152 / 192 / 152** device px off the left, top and right against
floors of 140 / 180 / 140 — inside the platform safe area with twelve px to
spare rather than on the line, which is what the brief asked for after an earlier
framing sat too close to the edges. There is **56.3 css px** of clear air between
the bottom of the card and the top of the tallest caption, measured against a
drawn card rather than against the caption's box.

### The camera, and the page's own ceiling

A shot is a selector, a zoom and an alignment, resolved in the browser at the
moment its leg starts. Nothing is a page coordinate. Three rules, and all three
are the page's rather than this file's:

- **The crop never shows the iframe's own top**, where the fixed bar lives.
- **A fit is on both axes.** Fitting the lockup on width alone framed it at 1.10
  and cut the mascot's crown off the top of the card and the hint line off the
  bottom.
- **No line of the page is ever cut in half.** The h1 is THE BORING TEK stacked
  in three lines at this width, and a frame whose top edge lands inside it shows
  `BORING / TEK` — the brand name arriving as a fragment. The frame is pushed
  clear instead, and the same rule covers the subline under it.

That last rule is what shapes the button shot. Fitting the button alone asks for
a zoom the subline cannot survive, and the band between the subline and the first
section below the hero is about 120 page px, so a frame that clears the subline
at the top reaches the sections at the bottom. So beat six is framed on the group
from the h1 down to the cta zone at **1.164**, and what makes the button large is
that the site's own mascot has travelled out of the top of the card.

**Everything below the hero is laid out `display: none` for the film.** The brief
is explicit that who we are and the honest part never appear; the crop already
excludes them at every framing the camera is allowed, and this is what turns that
from a thing the numbers happen to give into a thing that cannot happen.

### The form is really filled in

Six taps, all inside the card and all real `Input.dispatchMouseEvent` presses at
the drawn ring's own coordinates. The page does the rest of the work: a single
pick chip marks itself pressed, waits 240ms and advances itself, and picking
`check my business` routes to the path with the multi pick step on it, which is
the two ticks, and then to a free text box, which is the typing.

The three languages are switched through the page's own handler rather than by a
tap, because the language buttons live in the top bar and the crop excludes it.
What is on screen is the real thing: the question, the chips and the buttons
re-render, the russian page drops to the mono stack the way `index.html` says it
must, and the ticks survive the switch.

The last two steps are done off camera during the line that is type on white,
because the brief gives that line to the words rather than to the site — and they
are done **for real**, because the send has to be a send. Exactly **2 posts are
intercepted** and nothing leaves the browser.

### What the frames found

Six things, all fixed before the final. Two are worth carrying forward.

**`element.focus()` scrolls every scrollable ancestor it has, across the frame
boundary.** An `overflow: hidden` box is a scroll container, so focusing a field
inside the iframe scrolled the card in the outer document by 251px. The camera is
a transform, so nothing it reads moved: the send shot resolved correctly, was
written correctly, and rendered a quarter of a page lower. Both scrolls are
pinned next to the transform now, and **the render measures the rendered window
against the camera it wrote on every sample** and fails if they differ by more
than a pixel and a half. That check is the reason this is a paragraph rather than
a shipped clip.

**`document.fonts.check(font, text)` does not answer whether a face can set a
string.** It came back true for Space Grotesk on `привет`, and Space Grotesk
ships latin and latin-ext and no cyrillic at all — it answers whether the faces
are loaded. It is measured instead: the string is laid out in one family with no
fallback list and again in a family that does not exist, and two identical widths
are the fallback twice. A latin control runs through the same test, so a probe
that cannot tell two faces apart cannot pass. The answer here is **291.75px in
space grotesk against 291.75 in the browser default**, so the pill drops to the
mono stack, which measures 351.56 and renders **36 device px of cap** against a
32 floor.

**The face that actually sets it is `Cascadia Code`**, and that was measured per
candidate rather than assumed. Walking `--mono`'s nine families one at a time
against the browser default's 291.75: `ui-monospace`, `JetBrains Mono`,
`Roboto Mono`, `SF Mono` and `Menlo` all fall back, `Consolas` and the bare
`monospace` keyword set it at 329.88, and `Cascadia Code` and `Cascadia Mono` set
it at 351.56 — which is the whole stack's own number, so Cascadia Code is the
first present family and is what renders `привет` here. It is a windows font and
it is not ours; a machine without it falls to Consolas and the bubble still sets.

The other four: the per beat stills were captured after the loop with only the
caption re-applied, so all fourteen showed the end card; the end card's two lines
spanned the frame, so the safe area check measured the frame's own edges; the
card-against-the-caption check was against the caption's box rather than its ink;
and at the engine's own 0.28em word gap `ai for business` read as `ai
forbusiness`, because every word kicks as it is said and a long word grows into
the gap on its left.

### The delivery is nineteen takes, one per line

One `speak()` per line, each with its own `rate` and `pitch` straight into the
ssml prosody tag, so the reading has a shape instead of a speed. **2.01 to 5.57
words a second** against a flat 2.3: the light lines run near the neural default,
the two that are jokes drop and slow, and the close is the slowest thing in the
file at `-16%` / `-3Hz`.

The takes are laid on one clock with the silence between them **measured on the
waveform** rather than taken from the word list — post10's lesson, and it matters
here because the gaps that are not breaths are the ones the guard is written
about. See No dead air below for what each of the three holes holds.

There is a twentieth take that is not one of the nineteen: the comedy voice
reading the typed line, laid onto the track by hand because it is not on the
narrator's clock and must never reach the caption plan. See The comedy voice
below.

**The brief said thirty seconds and the script is marked exact.** The script has
grown since: the form is narrated to the send, the confirmation has a word on it
and the offering is two lines rather than one, and the clip is 46.47s. Every one
of those was a fault being fixed rather than a line being added for its own sake,
and each is written up below. The run prints what it came out at.

### The cut marks are on the line ends

A card breaks at a sentence end, at a clause mark, or when it is full, and this
script is fourteen short lines with almost no punctuation in them. Left alone the
cut ran straight through the seams — `dot com press`, `job send it`, `time and
some` — which is post10's `do it we` again, and worse: a card holding the end of
one screen beat and the start of the next while the picture changes underneath
it.

So a comma goes on the last word of every line, **on the caption's copy only and
after the synthesiser has spoken**, `cardBreak` breaks on it and
`punctuation: 'drop'` takes it off again before a card is drawn. Nothing about
the audio or the timing can move. What the marks cannot fake is checked
separately: the drawn word sequence has to be the spoken word sequence, and no
card may straddle two lines.

### The mascot

Twelve marks and seven bubbles. **The opening four are his alone**, because
nothing else is drawn up there: a pictogram scene layer was built for that space
and taken out again, and it is Einz's to fill. The turn is set over those four
only — out to 0.58 and back to the 0.35 resting bias before the card arrives —
and every mark after that leaves the channel alone.

| at | state | says |
|---|---|---|
| the opening | `neutral` | |
| the first line's second card | `curious` | `hmm...` |
| `some know exactly, but have no time` | `thinking` | |
| `and some just need one small thing done` | `curious` | `interesting` |
| the card arriving | `neutral`, then `curious` | |
| across `it does not cost you anything` to `in english, russian or latvian` | `neutral` | `hey`, `привет`, `labdien`, one on each language |
| the frame the typing finishes | `delighted` | `nice` |
| the frame the check mark is drawn | `curious` | |
| `we sit between you and ai` | `agreeing` | `finally` |

**There is no `unimpressed` anywhere in the clip.** It sat on `have no time`, it
was the right read of that line and the wrong read of the film: a corner
character who pulls a sour face at the viewer's problem is not somebody you then
ask to build you something. `thinking` does that work. **`agreeing` is kept for
the close and nothing else**, because it is the one state that earns a `ding` and
the ding has to keep meaning yes.

**The three greetings are a run on one mark rather than three marks**, and that
is the one thing this clip cost `lib/mascot.mjs`. Three ordinary bubbles need six
and a quarter seconds of head room between them, which is a fifth of this clip
spent on one line. See `lib/mascot.mjs` below for the profile a run uses.

### The script, as it stands

Nineteen lines. `screen` is what the frame is doing: `site` shows the card,
`white` hides it and the type is the whole picture.

```
 #   in .. out      screen  line
 1   0.30..2.35     white   ai for business is everywhere now
 2   2.63..4.80     white   some people do not know why they even need it
 3   5.01..7.33     white   some know exactly, but have no time
 4   7.75..9.60     white   and some just need one small thing done
 5   9.93..12.32    site    go to the boring tek, dot com
 6  12.64..13.32    site    press the button
 7  13.85..15.26    site    it does not cost you anything
 8  15.56..16.98    site    answer a few simple questions
 9  17.26..19.74    site    in english, russian or latvian
10  20.02..20.93    site    then type what you want
--  21.23..24.10    site    i want ai to do my job but keep my salary   (the comedy voice, uncaptioned)
11  25.40..26.59    site    how big your business is
12  26.89..28.85    site    your name and your registration number
13  29.13..31.65    site    your website, where you are, and your email
14  31.99..32.35    site    send it
15  33.24..33.52    site    done
16  34.33..36.38    white   in one or two days you get your report
17  36.75..37.83    white   and if you want it built
18  38.06..42.66    white   we do apps, websites, research, graphic design, or one small job
19  42.97..44.69    white   we sit between you and ai
```

The cut hangs off it: send tap 32.69, the tick 33.24, the reframe onto it
33.28..33.62, the card's exit 34.09..34.31, the end card from 42.67.

### The domain read, and the full stop that fixed it

Four attempts, and every one of them was decided on **measured word timings**
rather than on how the string looked, because this is a pacing problem and pacing
is measurable. What each one did, all at -18% and -1Hz:

```
theboringtek dot com      theboringtek(0.93) dot(0.27) com(0.48)
                          gaps 0.016 0.016
the boring tek dot com    the(0.15) boring(0.48) tek(0.35) dot(0.26) com(0.42)
                          gaps 0.015 0.015 0.015 0.015
the boring tek, dot com   the(0.15) boring(0.47) tek(0.50) dot(0.24) com(0.46)
                          gaps 0.015 0.015 0.244 0.015
go to. the boring tek,    the(0.12) boring(0.40) tek(0.49) dot(0.23) com(0.49)
dot com                   gap before `the` 0.503, gap to `boring` 0.015   <- kept
```

The first hands the synthesiser one word boundary for twelve letters, so there is
no pacing **inside** the run at all and a slower rate only makes the run longer.
The second gives five units an identical 0.015s apart, so the name never groups.
The third put phrasing in it — a 0.244s gap after `tek` — and shipped.

And then a viewing said the line reads **`boring tek dot com`**: the `the` was
being lost. The take's own waveform said why, and it was not what it looked like.

**The `the` was there and it was loud enough**: 153ms at -17.6 dB, two decibels
under the loudest word in the line. What was wrong is that the gap in front of it
was **15ms, exactly the same as every other gap in the run** — so `go to the`
came out as one unstressed cluster, the ear took `the` as the article of
`go to the ___`, and the name it heard started at `boring`. **A grouping fault,
not a level one**, which is why slowing the rate had never touched it.

Three candidates were synthesised and measured per word on the decoded audio:

```
go to the ...     15ms in front of `the`,  -2.0 dB under the loudest word
go to, the ...   320ms in front of it,     -4.7 dB   the comma pauses and quietens
go to. the ...   503ms in front of it,     -0.8 dB   <- both numbers win
```

After a full stop the synthesiser **restarts the phrase and gives its first word
a real onset**, so the `the` is both separated from `go to` and stressed as the
head of the name. It is spoken copy only: `bareWord` strips a trailing stop after
the cards are cut, so nothing draws `go to.` — the caption became **two cards,
`go to` and then `theboringtek.com` on its own**, which is the better cut anyway
for the one line a viewer has to be able to write down.

It cost 0.58s. The take went 2.95s to 3.53s and the clip went 46.47s to 47.03s.
**That is the only retiming any of these four rounds caused.**

### The caption guard's one named exception

The caption draws `theboringtek.com`, which is the address as it is written, so
the spoken copy and the drawn copy come apart on that one line. Every other card
in the clip is cut from the words the synthesiser said and there is a guard that
says so, and the guard was **taught the exception rather than loosened**:

- `SAY_AS` names the line, the run of spoken words and the string that replaces
  them. It matches on **bare words**, so the comma the delivery needs is
  invisible to it and it would go on matching if the mark ever changed.
- `markLines` collapses the run into one drawn word carrying the run's own start
  and end, before `cardBreak` ever sees the line.
- `guard` applies the same substitution to the **spoken** string before it
  compares, so the check still starts from what came out of the synthesiser.
- The exception has to fire **exactly once** or the render fails. An exception
  that quietly stopped matching would take the guard down with it, and that is
  the only way a check of this shape goes wrong.

### The comedy voice, and the typed line

`lib/voice.mjs` has a fourth voice for the one sentence in the clip that is not
ours: `aside` = **`en-US-JennyNeural`**, a us woman, `comedy: true`, read light
and warm at -14%. It reads `i want ai to do my job but keep my salary` over the
typing and **it is not captioned**, because the words are already on screen in
the field being typed. It never reaches the caption plan, so it is laid onto the
voice track by hand rather than through `buildVoice`; its words **are** in the
duck envelope so the keyboard goes under it.

It shipped as `en-IN-PrabhatNeural` for one build. A clip whose whole register is
plain does not want its one joke marked out by an accent, because then the accent
is the joke. Female on purpose too: the three narrators are all male, so the one
voice that is somebody else in the film is audibly somebody else on the first
syllable. **The english only rule never moved** — it is about language, and both
of those were english.

**The hand is cut to the read.** The typing window is the comedy take's measured
sound length, so the last keystroke lands on the last syllable without either
being told about the other, and the hole line ten carries is derived in `main()`
rather than typed: `gap: null` in `LINES`, and a `buildVoice` that refuses a null
gap so a derived number nobody derived stops the render.

### The form is filled field by field, on the word that names it

Five fields, all of them, through the page's own focus and its own input
listeners. Nothing is written into the site's state and nothing skips a step:

```
26.64  f-name      your business
27.69  f-reg       12345678              named and never read aloud
28.85  f-site      yourwebsite.com
30.04  f-country   usa
30.88  f-email     you@yourbusiness.com
```

They are in the order `index.html` lays them out and the lines that name them
name them in that order, so the eye tracks down the card rather than jumping
about it. `f-site` is a `type="url"` input handed plain text: the page reads
`.value` and posts it and there is no native form submit anywhere in
`index.html`, so nothing validates the shape.

**The registration number is named and never read.** A synthesiser reading eight
digits aloud is thirty seconds of nothing, and a number said out loud is a number
somebody will try to write down. The render fails if a digit ever reaches the
script.

### The ending, and the one word on the tick

The order is **send tap, the tick, the report, the offering, the end card**, and
it took four attempts to get there. The report answers the press because it is
what the press buys; the offering is the pitch and it lands last with the frame
to itself.

**`done` lands on the check mark rather than after it**, and the press is timed
**backwards** through the stub to make that true: `sendAt` is `done`'s own start
minus `STUB` minus a frame, so the tick and the word arrive together whatever
either take turns out to be. `STUB` is 0.48s and `guard` reads `injected()`'s own
source to check it still matches the 480 in the stubbed fetch, because the two
live in different worlds and a stub that quietly got slower would slide the tick
off the word with nothing to show for it.

**The offering is a second service, not a description of the report.** The list
used to follow `you get your report` with nothing between them, so a viewer heard
the report and then four nouns and drew the obvious inference: that the report
*is* the app and the website. It is not. The report is the free look at the
business; building the thing is the other half of what we sell. `and if you want
it built` is the whole fix, and it is its own line because as one sentence it is
sixteen words, nearly twice the longest line in the clip.

**The hole after `done` is 0.80s where it was 1.60**, because 1.60 sat. It was
paid for **at both ends of the tick rather than out of the tick**: the reframe
onto the check mark is 0.34s where it was 0.48, and the card's exit is a 0.22s
fade starting 0.24s before the report where it was 0.38 starting 0.40. The card
goes quicker rather than earlier, so the check mark keeps every frame it had at
full size — never cropped, never scaled — and holds legible for about three
quarters of a second on both themes.

### The end card

`THE / BORING / TEK` stacked on three lines the way the logo is actually drawn
and the way `index.html` sets it, with the address under it in the lockup
subline's treatment, and nothing else on the card.

**Stacking is what makes it big.** On one line the wordmark had to fit 300px of a
540 wide frame, which is michroma at 25px; the widest stacked line is `BORING`,
so the same width buys 59px. It is **centred as a group and the centre is
measured, not typed**: `build()` measures both blocks after the face has loaded
and places them either side of `centreY`. That centre is the middle of the room
**above the caption band** rather than the middle of the frame, because the last
line of the clip is still being captioned into that band while the card is up.

### The dark variant

`--dark` renders the same clip on the near black page. **The same clip**: the
script, the beats, the camera, the cut, the mascot's marks and the sound are one
plan and neither variant knows which one it is. Three attributes change:

- **`data-theme` on the composed page's `<html>`.** `index.html`'s own token
  blocks are already inlined into the page by `captionCss` — both of them, the
  light `:root` and the dark override — so the caption ink, the card hairline,
  the end card and the tap ring all follow the attribute without a line of theme
  code in `post11.mjs`.
- **`theme` into `planMascot`**, which is what turns the phosphor glow on.
  `lib/mascot.mjs` gates the two layer glow on the dark theme and its own self
  test asserts that only dark glows.
- **`bt-theme` into the iframe's `localStorage`** before `index.html` runs, which
  is the same key a visitor's own toggle writes. The page comes up dark on its
  own: **the film picks the mode the site already has rather than restyling it.**
  It is set through `evaluateOnNewDocument` so it lands before either page
  script, which is the only way the site can come up already dark rather than
  flipping into it on a frame somebody would see.

Every guard runs unchanged on both, plus one written for the pair. Measured off
the computed style at render, light against dark:

```
caption ink                       19.46:1   14.34:1
card hairline                      1.29:1    1.29:1
bubble outline vs its capsule     19.46:1   14.34:1
bubble capsule vs the page         1.00:1    1.00:1
end card wordmark / address    19.46/8.12  14.34/12.04
the tap ring                      19.46:1   14.34:1
```

Five of those are held to wcag's 3.0 absolutely — its large text bar and its non
text bar are the same number. **Two are measured and deliberately not floored.**
The card's hairline is `var(--line)`, `index.html`'s own separator, faint on
purpose on both themes and not a boundary anything depends on, because the card
is full of the site and the site is the boundary. And the bubble's fill **is** the
page colour by design: it is a capsule with a hole in it and the outline is what
separates it. Flooring either would mean restyling the site inside the card for
the film, which this file has never done. They are held to **parity with the
light render** instead, read off `post11-light-1080x1920.json`, so a theme swap
that quietly made anything fainter fails even where there is no absolute number
to fail against.

### The sound

**No music.** What is in the file besides the read is a second read in the comedy
voice over the typing, the mascot's own cues — a `pop` when a bubble arrives and
a `ding` on the agreement beat — a `click` on each tap but one, `key` ticks under
the hand and under each field fill, a `press` on the send and a `ding` on the
check mark. **Forty two effects**, every one derived from a plan that already
existed rather than typed against the picture.

Three of those were added because the clip did them in silence. `key` and
`press` are two new recipes in `lib/sfx.mjs`, both the `click` recipe resized:
`key` is one keystroke, three and a half milliseconds of noise banded 1.3k to
4.2k for the cap and a 124Hz pulse under it for the board, gone in 55ms, at -34dB
— under the sweep, because it is the only sound that repeats a dozen times inside
four seconds and it plays under a voice. `press` is one button with travel in it,
nine milliseconds of noise banded lower and a body falling 150 to 110Hz, 130ms,
at -21dB, four over the click and three under the coin. It exists because the
clip had six real presses in it and the last one, the one that sends, sounded
exactly like the five before it. The confirmation is `ding`, which was already
written as "a check being drawn" and had only ever been used for an agreement.

**One tick per four characters, not per keystroke.** Forty three sounds inside
three seconds is a rattle. The typo and the backspace always get their own,
because they are the two moments the rhythm breaks.

Delivered at **-14.2 LUFS / -1.0 dBTP**, the limiter pulling 4.8 dB at its
hardest. The loudness loop is post5's: it keeps its best pass rather than its
last, and the ceiling handed to the limiter comes down by whatever the measured
true peak overshot by.

### No dead air, and it is a guard rather than a claim

Every hole in the read is measured on the waveform. The check has got **narrower
twice** and it is worth writing down why, because both times the shape changed
rather than the tolerance:

```
20.96..25.43   4.47s   the hand types in it, under the comedy read
32.34..33.29   0.95s   the send is pressed in it
33.58..34.38   0.80s   the tick is held and the card leaves
```

There used to be two named holes and the second was allowed three seconds while a
check mark was drawn in it. Then there was **one** hole allowed to be long, the
one the hand types in, and everything else under 1.70s. Now the two numbers are
**separate, because they were never measuring the same thing**:

- **`HOLE_MAX` = 1.20s** — any hole that is not the typing one. The longest in
  the clip is the 0.95s the send is pressed in.
- **`TYPE_TAIL_MAX` = 1.50s** — how far the typing hole may run past the last
  keystroke with nothing in it. It runs 1.33s.

Both are tighter than the single 1.70 they replace, which was left over from when
the confirmation sat in silence and was only answering both questions by
accident.

**And three things are checked positively, which is the half a length limit
cannot express.** The check mark has to be drawn while a word is being said — it
has to fall inside some beat's own sound. The send may never resolve before
`send it` has finished. And `STUB` has to agree with the stubbed post in
`injected()`, read off that function's own source.

### The opening — four scenes in the card box

The top two thirds of the frame was empty for the first four lines and the
pictogram layer built for it had been taken out again. It carries **four type
scenes now, one per line**, drawn in the same rectangle the site card will
occupy, so the handover is one thing leaving and another arriving in the same box
rather than a composition changing shape.

```
scene   on screen        line                              fitted    device px of cap
1       BUSINESS         ai for business is everywhere      74.1px   104
2       WHY I/NEED/AI?!  some people do not know why       118.2px   166
3       BUT I AM/BUSY    some know exactly, but no time     71.2px   100
4       ONE/small/THING  and some just need one small      121.1px   170 and 58
```

Everything is drawn in code: no image, no asset, no third font. The words are the
caption face uppercased and the five small heads are the mascot's own geometry
read out of `lib/mascot.mjs`. Scene three holds an **empty reserved slot** over
its words and draws nothing in it — see below. The layer sits at **z-index 1** —
under the card, under the captions and
under the mascot — so it cannot get in front of anything however wrong a number
in it goes, and the run reads that depth back off the page rather than trusting
the stylesheet.

**The handover window is not this layer's to choose.** It is `planSite`'s own card
fade record, taken by reference, so all four crossfades and the one cut in the
clip are the same 0.52s and moving `CARD_LEAD` moves them together. What is this
layer's is where inside that window the opacity moves: a **0.16s complementary
exchange at 60% of the window**, so the sum is always one — never a blank frame —
and only one frame of the preview is mixed at all. The first cut faded over the
whole 0.52s and put `BUSINESS` and `NEED` on top of each other, both legible, for
six frames.

Scene four's exit is inside the card's own arrival, and the identity is guarded
rather than typed.

#### The empty slot in scene three, and the brain that was in it

Scene three used to draw a **brain** above its words: a silhouette from an ellipse
with two cosines on its radius, a wiggle down the middle for the fissure, and
twelve folds fanning out from that midline rather than nesting around a centre,
all of it clipped to the outline so no stroke could escape the head. Three passes
went into the shape. **It came out anyway, and nothing replaced it.** It did not
read as a brain — it read as a drawing of something, and a viewer working out
what a shape is has stopped reading the words under it.

What is left is the box it occupied, at the size it occupied, **drawing
nothing**: `.sc-slot`, 236x205 css px off `SC_SLOT`, plus the same 20px `SC_GAP`
under it. No fill, no stroke, no border, so on both themes it is the page.
**Einz is supplying his own image for that slot**, and holding the box is what
makes that a drop-in: the image lands in a layout already built around it.

`fitScene` measures the slot exactly the way it measured the drawing, which is
the whole of why the type did not move — `BUT I AM / BUSY` is still 71.2px, 100
device px of cap, fitted on height, in the same place with the same glow. The
slot is **deliberately out of both ink selectors**, `inkOf` and `sceneInk`: it
draws nothing, so a rectangle taken off it would be a rectangle the safe area
check then holds a border against with no letters anywhere near it.

**The cue word moved with it, `but` to `some`.** The words used to glitch in
1.34s into the line, on the word where it turns from what they know into what
they have not got, and that worked because the drawing carried the head of the
beat on its own. Without it the same cue leaves the card box holding nothing from
**4.99s to 6.35s**, which is the fault this whole layer exists to remove. `some`
is the first word of line three, so the words are up from the first frame it is
spoken on, and it is still keyed through `wordAt` like every other cue. Measured
on the light preview, the card box is blank for **one 12fps frame** — the one
between the crossfade finishing and the entrance firing — and its darkest pixel
is 234 of 255. At sixty that is about two frames.

Read frame by frame on both themes across 4.90..7.80: the type sits slightly low
with clean air above it and reads as a composition on white and on black, not as
something that failed to load.

#### The glow and the glitch

```
dark    8px at 28%, 22px at 15%, 48px at 7% of white, layered
light   none. a white glow on a white page is nothing and a black one is a
        drop shadow, which the brand bans outright
glitch  split 5.0px dark / 2.6px light, jitter 3.2px,
        bursts 70..140ms every 0.50..1.10s
```

A burst is **a length in seconds quantised to whatever frame grid is rendering**,
which is the only shape that survives being previewed at twelve and shipped at
sixty: written in frames it would be a quarter second on the preview and fifty
milliseconds on the master. And it is computed **once per output frame and held
across every subframe**, for post10's reason — with the shutter open a one frame
split written against `t` is averaged with three clean captures and lands at a
quarter strength.

It runs **10.7% to 18.8% of each scene's frames** against a 30% ceiling, and the
ceiling is a guard: "never continuous" is that number.

Scene two carries a tube flicker of its own, 0.86..1.0 with one frame dips to
0.54..0.74. Scene three's words glitch in on the word `some`, keyed through
`wordAt` like every cue in `planSite`. That cue was `but` while a drawing carried
the head of that beat — see the empty slot above.

#### The orange heads, and why they say AI

Five small heads scattered around `BUSINESS`, glitching hard on and off, in the
one colour this file is allowed that is neither ink nor paper: `#d1600a`, 3.90:1
on the white page and 5.17:1 on the black one, **the same orange on both** because
a character that changed colour with the theme is two characters.

They had faces — five poses off `lib/mascot.mjs`'s own state table, eyes and
brows. **They do not any more.** Two slabs 13 grid units wide on a head rendered
at about 128 device px are five px of ink each, and at that size a pair of them
does not read as a face, it reads as a rendering fault. So the eyes and the brows
came out, and the pose table with them: with nothing to pose, five named emotions
were five names for nothing.

In their place, **`AI`**. The plate is a circle of radius 30 units, so what has to
fit is the diagonal of the text box rather than its width — at this face and
weight the letters are about 0.62em across and 0.737em of cap, which puts the box
corner at 0.72F from the middle and takes F to about 36 before it touches the
edge. 30 is used, and the heads did not need to grow:

```
31.9px of type on a 127.5 device px plate, 80.0 device px of cap  (floor 32)
```

The letters are **white on the orange on both themes** rather than the page colour
the eyes were. The eyes were holes punched in the plate, which is right for a
feature; this is type, and type that inverted with the theme would be near black
inside an orange disc on the dark page, which is the one place a glow cannot help
it. They take the layer's own `--sc-ts` glow list, the same property the opening
words take, so they carry the deep glow on dark and nothing but the split on
light.

### The report beat — a fault, then a page built out of blocks

`in one or two days you get your report` had an empty box over it, then a page
that faded up, and now has two events.

**`1/2` over `DAYS` lands on the word `one`** — on `one` rather than on `days`
because landing on `days` left the type 0.56s to be read before the page had to
be sliding in, and big type nobody has time to read is a flicker. It arrives on
the hardest glitch in the clip:

```
tear 34px across 4 bands   split 8.5px   jitter 5.5px
noise 0.34 with scanlines at 0.20   one white frame at 0.68 dark / 0.80 light
140ms hard, then a 160ms stutter, and clean
```

The tearing is **four copies of the same type, each clipped to its own horizontal
band**. At rest the four insets are the four quarters and the four offsets are
zero, so the copies stack exactly and what renders is one block of type with three
invisible seams in it; during a fault node writes eight different numbers per
frame and the block comes apart. It costs nothing when it is off.

Then **the page slides in from the right**, clipped to the card box so it enters
the frame rather than appearing in it. It travels on `DRIFT` over 0.42s: the
first cut used `POP` over 0.30s, and `POP` puts most of its travel in the first
fifth, so at twelve frames a second that was one frame of movement and three of a
page sitting still.

And then it **builds**. The page is block zero and rides the slide; the heading,
three lines and the green check land one at a time, **75ms apart, each dropping
14px and squashing on arrival**. The check is last because it is the answer. The
whole thing settles at **-4 degrees**, because a thing placed by a hand is not
square to the frame and a thing placed by a machine is.

The page is **white on both themes because paper is**, and the check is the site's
own light accent — the same tick a viewer saw inside the card at 34.00s — at
4.15:1 against the paper on either theme, because the page it sits on does not
change.

The first cut of this had **the page itself on the same stagger as its own
contents**, which meant the slide had nothing to slide: three hundred milliseconds
of an empty box and then a finished page.

### The chalkboard — the offering, second cut

`we do apps, websites, research, graphic design, or one small job` had five drawn
pictograms over it — a phone, a browser, a magnifier, three shapes, a ticked box.
**They are gone.** Five line drawings in a row read as an icon set rather than as
an argument.

What replaced them is a **chalkboard mind map**: `website` boxed in yellow in the
middle of the card box, six things around it in chalk ovals, each with an arrow
into the centre, popping in one at a time with a small overshoot and a dry chalk
tick.

**Nothing in it is a clean vector and that is the whole look.** An oval is a full
turn plus a twelfth, so its ends overlap the way a hand does not stop where it
started, and its radius wobbles on two out of phase sines. A line is not straight
and it overshoots at both ends. A box is four separate strokes that cross at the
corners rather than one closed rectangle. And all of it goes through one
**fractal noise displacement filter**, which turns an even stroke into a chalky
one and roughens the letterforms at the same time — so the type reads as written
rather than as set, without a handwriting face this file is not allowed to load.

#### The per item anchoring rule

The six labels are **not** the six spoken words, and they cannot be: the line
names four things and a mind map wants six. So:

- a node that **is** named out loud lands on its own word through `wordAt`,
- a node that is not is placed at a named fraction of the gap between the two
  anchors either side of it, so it moves when the read moves.

```
website   38.69s   the head of the line
apps      38.83s   on the spoken word `apps`
seo       39.33s   in the gap, 0.32 of the way
support   40.00s   in the gap, 0.75 of the way
research  40.39s   on the spoken word `research`
design    41.18s   on the spoken word `graphic`
social    42.35s   on the spoken word `one`
```

Chalk is white on the board and ink on paper. The centre is yellow on both and
**a different yellow on each**, for the reason `index.html` carries two greens:
`#ffd34d` is 14.1:1 on the near black page and would be 2.1:1 on the white one;
`#a8780c` is 3.8:1 on white.

The labels measure **32 device px of cap** and the centre 40, against the 32 floor
every piece of copy in this file clears. They were 19px and measured 28, and the
run failed on all seven of them.

### The beat list as it stands

```
 0.00  BUSINESS, whole on frame zero, and frame zero is a glitch frame
 2.44  handover into WHY I / NEED / AI?!
 4.83  handover into BUT I AM / BUSY, an empty slot held above the words
 5.01  the words glitch in on the word `some`
 7.57  handover into ONE / SMALL / THING
 9.74  the type goes as the site card arrives  (the card's own fade record)
10.03  the site card, hero lockup
13.58  the cta shakes, one tap
14.75  the form opens
19.05  ru, lv, back to en, three greetings
21.15  the hand types the joke line under a second voice
26.10  the size step
27.64  the last step, five fields on the words that name them
32.90  send            34.15  the check mark, and `done` on it
34.87  the card leaves
35.04  1/2 / DAYS, the hard tv glitch
36.04  the page slides in       36.46  it lands on `report`
36.52  five blocks land, 75ms apart, the green check last
37.90  gone
38.69  the chalkboard, seven things over four and a half seconds
43.10  the board clears
43.24  the end card
47.03  out
```

### The guards this clip added

Every one of these is a check that fails the render, not a note:

- **The opening.** The last scene's handover window **is** the card's own fade
  record, by identity; the two ends of every exchange are the same two numbers;
  no opening scene survives the card's arrival; no frame inside the opening is
  empty; every line clears 32 device px of cap; `SMALL` is set under 55% of the
  words either side of it; and the layer's z-index is under the card, the
  captions and the mascot, **read back off the page**.
- **The letters in a head.** They are the letters they should be, they clear the
  cap floor, and the corner of their box clears the plate's radius with six
  device px to spare. A failure on the middle one is a note to make the heads
  larger rather than the letters smaller, and the message says so.
- **The chalk.** Every label clears the cap floor. This is the guard that caught
  the 19px type.
- **The report.** The days land on their word and the white frame is on the fault
  frame; the whole fault has a length ceiling; block zero is the page riding the
  slide; the page starts far enough outside to read as a slide and settles off
  square; the six blocks are in order.
- **The chalkboard.** The three spoken nodes are on their words, no two nodes
  arrive within 0.18s of each other, and the centre is there before the first
  arrow points at it.
- **The rectangle.** Nothing in this layer shares the box with the site card or
  the end card. The opening's crossfade with the card is the one designed overlap
  and it has its own check.
- **Rendered, not planned.** A torn band and a noise frame have to have actually
  been written to a frame, and the white frame's rendered peak is compared with
  the one that was planned. A channel that is planned and never rendered is the
  failure mode a plan cannot see.

#### Two bugs these guards found

**`Math.round` where the visibility test uses `>=`.** Burst frames were placed
with `round` while a block becomes visible on `ceil(on * fps)`, so a burst whose
fraction was under a half fired **on the frame before its own block appeared**.
Three of the five offering shapes came back with no glitch on any frame. Both use
`ceil` now, so they cannot disagree.

**A bounding rect is not a scale.** The `AI` cap was first measured by taking the
grid-unit-to-css scale off the svg's bounding rect — and every head is rotated a
few degrees, so the rect is the axis aligned box of a rotated square, up to eight
per cent wider. It reported the letters eight per cent bigger than they are. The
scale comes off the text element's own **`getScreenCTM`** now: `hypot(a, b)` is
the scale with the turn divided back out.

### Two sounds this file synthesises for itself

`lib/sfx.mjs` carries eleven recipes and neither of these is one of them, and the
brief for that pass was one file. So a **stuttered digital fault** and a **stick
of chalk** are built in `post11.mjs` out of the same two primitives every recipe
in that module is built out of — a seeded noise source and an exponential decay —
and handed to the bus through the same `renderSfx` report, so the run prints them
next to everything else.

The fault is not a noise burst, it is a **stutter**: four or five very short gates
cut out of band passed noise, each a different width and a different band walking
downward, with silence between them, and a falling square blip underneath to give
it a pitch to fall off. The chalk is 35ms of high passed noise with a very fast
decay and a little ring at 2.6k — chalk on a board has no body at all, it is grit
skipping.

No file is loaded, no dependency is added and nothing in the shared module moved.
The day a second clip wants a glitch is the day it moves.

### Outstanding, and undecided

- **The re-render of the finals.** Both variants rendered at sixty and green, and
  **both were then overwritten by the brain removal's 12fps previews**, which go
  to the same two paths. `--blur` wants running again on each before anything is
  watched or posted, and the re-render is the first one that carries the empty
  slot and the `some` cue.
- **The review of the finals.** Nothing has been watched at sixty, and after the
  overwrite above there is nothing at sixty to watch. Once the re-render lands it
  wants a dense pass on the four reworked
  beats — the opening scenes, the report beat, the chalkboard and the end card —
  and a coarser pass over the site stretch between them, with **one sub agent per
  frame batch returning text only**, per `skills/video-review/SKILL.md`. Two
  variants at 47.03s is more pictures than one context holds read directly. The
  things sixty can show that twelve could not: whether the four torn bands
  survived the shutter, the white frame's real peak, the page's 0.42s slide, the
  five brick landings 75ms apart, and whether a fast move smears and lands sharp.
- **Undecided: the `days` scene's duty exception.** It is committed and
  documented — 40% on that one scene against a global 30% — but it was raised in
  response to a red guard, which is exactly the move that should stay visible.
  The absolute length check on the fault is what holds the beat honest; if the
  clean tail were guarded directly the ratio would not be needed at all.
- **Undecided: the site's own wordmark crops to `BORING / TEK` at 15.00s.** It is
  a frame in the middle of the camera travelling from the lockup down to the
  form, not a resolved shot — `resolve`'s `cleared` pass holds the shot
  **endpoints** clear of the h1, `.tag` and `.m-zone`, and a travelling shot has
  to pass through whatever is between its two ends. Pre-existing, found by a
  frame by frame review, and **nobody has decided whether it is a fault or a
  camera move.** It reads as a camera move. Fixing it would mean either routing
  the travel around the h1, which the page's own layout barely allows, or cutting
  rather than travelling. Written down so the decision gets made rather than
  forgotten.
- **The mascot's placement.** The opening motion pass — the mascot big and
  centred through the opening, then glitching to the corner on the button tap —
  was specified and then overtaken: the opening is four type scenes now and the
  corner is where he stays. **The placement still wants another look either way.**
- **A posting pack and a track.** Caption, tweet and three tags per platform,
  none of them decided; and the clip ships with no music by design, so Einz picks
  one later.

## The twelfth clip — the sting, and a joke instead of an argument

```
cd demo
node post12.mjs                 # 1080x1920, 60fps, shutter closed
DEMO_FPS=12 node post12.mjs     # the fast preview pass
node post12.mjs --blur          # 60fps with the shutter open, four subframes
node post12.mjs --keep-frames   # leave the jpegs on disk
node post12.mjs --encode-only   # re-encode from kept frames
```

**5.55 seconds, dark only, one output path, overwritten every run:**
`demo/out/post12-dark-1080x1920.mp4`. Twelve beat stills land in
`demo/out/verify-post12/`, which is how the cut is read as a strip rather than
scrubbed as a video.

It shipped at 5.05s and came back with three notes: the fart read as a buzz, the
transition into the wordmark was not glitchy enough, and the end card wanted
another second. All three are below, in their own sections, along with the two
faults the second pass produced and what they cost.

**Then a third pass cut the opening and put a label on the screen.** The fade up
out of black is gone and the clip is 5.55s: he is at full on frame zero, already
idle, and every beat after moved up the same half second. And `ai fart` sits over
his head for the whole time he is on it. Both are below, and so are the two
guards the retime found were reading the wrong thing.

Every clip before this one is an argument. post9 pitches, post10 is angry,
post11 explains for forty seven seconds. None of them is *likeable*, and a feed
is not only won by being right. This is the mascot being a small robot for five
seconds with a joke in the middle, and the whole brand content is three words at
the end.

### Two words, no captions, and a constraint rather than a saving

There is no read, no caption and no bubble. What is written on the screen is a
two word label — `ai fart`, lower case — over his head from frame zero, and then
the wordmark. Nothing else. It is still a clip that has to be legible from the
picture and the sound alone, and that is why nearly every time in the file is
**derived off the rig** rather than typed against it: with nothing narrated, a
beat that lands a fifth of a second late has nothing to hide behind.

**The label is not a caption and it does not narrate.** A feed plays with the
sound off, and a viewer who never unmutes gets a small robot doing something and
then a wordmark. The label names the thing once, on the first frame, and holds
still while the joke happens under it.

The video-review skill's transcript step reports "no transcript was possible",
which is correct twice over — there are no captions and no whisper key — and
also moot, because nobody speaks.

### The mascot module is used exactly as it is

`lib/mascot.mjs` supplies the plan, the frame, the preflight, the css, the
markup and the page runtime. Nothing in `post12.mjs` reaches inside it and there
is no body — that module draws a head and this clip does not invent one.

Two things the clip does to the plan, and both are arithmetic on its output
rather than a change to it:

- **`plan.box` is rewritten to centre him.** `planMascot` places by corner, and
  this clip wants him in the middle. `headRect`, `mascotCss` and
  `mascotPagePlan` all read `plan.box` when they are called, so moving it before
  any of them run is the same as having been placed there — and every clearance
  number in the report still comes out of the module's own geometry.
- **`size` is 148 rather than 128**, which puts the plate at **277.5 device px**
  against the module's own 220 to 280 window. Larger than his 240px corner size,
  which is what the brief asked for, and still a number `planMascot` checks. 280
  is the ceiling, so 277.5 is as large as he is allowed to be.

He is centred on the middle of the **safe band** rather than of the frame:
180 device px off the top and 220 off the bottom puts the middle of what a viewer
sees ten css px above the middle of the file, and a thing centred on the frame
reads a shade low. The wordmark lands on the same line, so he is replaced rather
than followed.

### The cut, and the pause that is the whole joke

Three marks, and the room between them is not taste — `planMascot` refuses a mark
with no room for its own entrance, hold and exit, so the clip is as short as
these three states allow.

| at | state | what it is |
|---|---|---|
| 0.00s | — | he is already on, at rest, drifting and blinking, `ai fart` over him |
| 0.64s | `agreeing` | the hi. up first, then a contact squash with a warm half blink on it |
| 1.88s | `surprised` | the fart. pulls back, snaps up, eyes to 2.6x, brows high, `turn` +0.30 |
| 3.05s | `delighted` | the giggle. two hops with real lift, eyes squashed into arcs |
| 3.72 / 3.84 / 3.96s | — | three stutters under the laugh, escalating |
| 4.06s | — | the hit: he and the label are cut, and the wordmark is born on that frame |
| 5.55s | — | end, after 1.40s of the end card holding |

`agreeing` for the greeting is the call worth defending. It goes **up** first —
"a nod that starts by going down is a head falling off" — and lands on a squash
with a half blink on it, which is "a small squash and a rise" and is also,
with a rising bleep on the contact, unmistakably a nod hello. `surprised` then
gets the fart, because eyes at two and a half times their height with brows in
high is the one pose in the table that means *what was that*, and the `turn` on
it is him tilting away from the puff, which leaves to screen left.

**The pause is 0.62s and it is `agreeing`'s own hold plus its exit**, not a gap
left over between two marks. For most of it the only things moving are the idle
drift, a saccade and a blink. A five and a half second clip spending a ninth of
itself on nothing is the joke being set up, and the render guards it: under half
a second and the file fails rather than shipping a gap where a pause was meant to
be.

### The opening was cut, and a mark went with it

The clip used to fade up out of black over 0.42s from a `neutral` mark at 0.06s,
and that half second was a viewer waiting to find out whether anything was going
to happen. It is gone. He is at full on frame zero with the label already over
him, every beat after moved up the same 0.50s, and the clip runs 5.55s rather
than 6.05.

**The `neutral` mark went with it, and that is the mechanically interesting
part.** That state does exactly one thing — it arrives at rest — and it costs
1.06s of clock before anything else may start, because `planMascot` will not seat
a mark inside another mark's entrance and exit. So while it was there the
arithmetic allowed **eight hundredths** off the front, not half a second.
Dropping it is not a way round the module: a mascot with no state written over
him sits at rest on the idle layer, drifting, breathing, blinking and saccading
from frame zero, which is exactly what "already idle and alive" describes. The
entrance was the thing being cut and the mark *was* the entrance.

**Nothing else about the cut moved.** The three states that are left keep the
gaps they had, the pause is still 0.62s, the end card still holds 1.40s, and the
puff, the stutters and the hit all shifted by the same 0.50.

**The retime found two guards reading the wrong thing, and both were fixed rather
than loosened.** They are the useful part of this pass:

- **The centring guard was reading a drifting frame.** It compared the head's
  left and right clearance on `headWorst` — whichever frame came nearest a border
  — and the idle drift moves him 1.7 css px either way, so *which* frame that is
  decides the answer. Retiming moved it from a frame with no drift on it to one
  3.4 device px along, and the clip failed for being alive. It checks `plan.box`
  now, which is the arithmetic this file actually does.
- **The giggle found a false first apex.** `hopBeats` took the first upward
  turning point in the window, and the first few turns there are the handover
  from the state before and the bottom of the crouch. Whether one of those
  wobbles reads as a minimum or a maximum depends on the idle drift's phase,
  which moved when the beats moved. It flipped, the search started on a wobble
  0.99 units *below* rest, and the first two bleeps came out 0.067s apart, which
  is one sound. **An apex is a turning point above rest now**, by the same three
  grid units the prominence test already uses, and the three beats and their two
  gaps are the ones the clip had before the front was cut.

### The giggle is measured off the picture

Three bleeps, and the brief says he bounces on each one, so the three times are
turning points in the **drawn head's** own y — the card, which is three frames
behind the rig by design, not `pose`, which is the rig. They come out at 3.33,
3.72 and 3.83: the top of the first hop, the dip between, the top of the second.
The gaps are 0.39 and 0.12, which is uneven **on purpose**: the state hops big
and then small, so the laugh comes out as one and then two, which is what a
laugh that catches sounds like.

**A prominence test is what makes that function work**, and it is a fault this
clip paid for. A hop is several tweens handed to each other, and a handover
writes its own `from` value: where one tween settled a quarter of a unit past
where the next starts, the curve steps, and a step is two turning points. Those
are real numbers and about half a device pixel on screen. The first cut put a
bleep on one. A turn now only counts if it is three grid units from the last one
that did — the hops swing twelve and seven, the artefact swings one.

### The puff is drawn in code and it took two goes

Eleven soft blobs of white light, born under him thirty milliseconds apart,
expanding as they travel, screen blended so they add light to a black frame
rather than sit on it as grey discs. No asset and no sprite.

**The first cut was invisible and only a rendered frame said so.** The blobs
were born at (258, 536), inside the head's own thirty pixel glow, and the
fastest travelled a hundred css px against a sixty nine px head radius: what
came out was a smudge on the bottom left of his halo that read as the glow
leaking downward. Every guard in the file was green on it.

What fixed it: born at (244, 534), outside the halo, where a thing escaping from
under him would first be seen; brighter, bigger and less blurred; and **the
distance is the parameter rather than the velocity.** A velocity plus a life is
two numbers that multiply into the one thing that actually matters, which is
where the blob ends up — and where it ends up is what the safe area cares about.
With distance as the parameter the longest lived blob cannot quietly become the
one that leaves the frame.

The reach guard makes two judgement calls and both are written down rather than
buried: a blob is measured only while it is over a tenth opaque, because a cloud
at three per cent is not a thing crossing a line; and the extent is the disc plus
one blur radius rather than three, because a css blur is a gaussian. Worst
measured is 210 device px clear on the left against a 140 floor.

### The end: three stutters, then the frame comes apart

post11's glitch language on post10's machinery: a hard stretch where every
channel is at full and the bands move every frame, then a short stutter. It is a
function of the **output frame index**, held across every subframe, for post10's
reason — a one frame rgb split written against `t` is on for one subframe of four
and lands at a quarter strength.

**The build up is three stutters under the laugh**, at 3.72, 3.84 and 3.96, at
32%, 52% and 78% of the heat. They are not a second mechanism: `force` is a
multiplier on the same envelope driving the same channels, because a build up
written as its own thing is a second thing to get out of step with the first. The
sound escalates with them, three shorter and thinner copies of the same `glitch`
recipe at -34, -30 and -26 dB against the hit's -23.

**The build up escalates in kind, not only in amount**, and that is a fault this
pass paid for — see below. Before the hit the signal *wobbles*: shake, rgb split
and a little noise, all of it on him and on the label. At the hit the frame
*tears*.

Only the wordmark is torn, and that is a decision rather than a shortcut. The
mascot is one dom subtree driven by ids out of the mascot module's own runtime
and there is no second copy of it that could be kept in sync; the wordmark is
three words of static text and duplicating it cannot go wrong. It is also the
only thing on screen when the glitch is at full heat, because the head and the
label are both cut on the frame the hit lands.

**A burst is a length in seconds quantised to whatever frame grid is rendering**,
which is post11's rule and which this clip needs more than that one did. A fifty
millisecond stutter is three frames at sixty and **six hundredths of a frame at
twelve**: written as seconds and left alone it would simply not happen on the
preview, and a beat that is in the master and missing from the pass it was judged
on is the one fault a preview cannot show. Every window is snapped — the start to
the nearest frame, the length rounded up to at least one whole frame — and a
guard asserts each one fires on at least one frame at *both* rates.

**The duty ceiling has a named exception and it is this scene only.** post11's
ceiling is 30% of a scene's frames, and it is a per scene number there for a
reason: a scene that glitches a third of its own frames is a look, a clip that
does is a broken render. post12's whole fault lives in the last two seconds of
five and a half, so against the file it is under a tenth however you cut it and
the number
that has to be defended is the **local** one. So the guard measures the fault
against the ending it lives in, from the first stutter to the last frame, and
holds it to the same 30%. It measures **26.4%**.

It is measured **at sixty whatever rate is rendering**, which is the same
argument `mascotMotion` makes about anticipation and entry: at twelve, a fifty
millisecond stutter is rounded up to a whole 83ms frame, which is two thirds
longer than it is, and the first cut of this guard failed the clip at 31.8% for
the preview's arithmetic rather than for anything in the design.

**The white flash was a full frame rect at 0.40 and the frame it fired on came
back as an even grey card** — the whole screen at forty per cent white with a
screen blended noise layer over the top, on a frame where the head had already
been cut and the words had not yet arrived. That is not a glitch, it is a missing
frame, and again every guard was green on it. It is a 420px radial bloom at 0.30
now, and the wordmark is born on the same frame as the cut so there is never an
instant with neither of them on it.

**Everything in the glitch went up for the second cut except the flash.** The
shake, the split, the band travel, the band count and the noise all did, because
the note was that the transition should be harder and longer. The flash did not,
and there is now a guard saying there must be **exactly one white frame in the
clip**: three stutters plus a hit is four chances to put one on the screen, and
four white frames inside a third of a second is a strobe rather than a glitch —
a thing platforms flag and a thing that hurts to watch. "Much more glitchy" is
not a licence to strobe.

**And the bands are the hit's, not the build up's.** That is the fault this pass
paid for. The first cut let all three stutters throw three bands each, and the
still from stutter three came back with **the mascot entirely gone**: a tear band
paints the page colour and redraws the *wordmark* shifted, the wordmark is not on
screen yet, so before the hit a band is a black bar over a head with nothing
behind it. Three of them, each up to 114 css px, over a 139px head, at 78% heat,
left a grey haze with no subject in it — the second time on this clip that a
fault rendered as an empty frame, and the second time every numeric guard was
green on it.

**A second, smaller fault from the same pass: a still is a frame the clip
actually has.** The stutter stills were asked for at times that are not on the
grid the stutters are snapped to, so one landed a frame early, after the head is
cut and before the wordmark arrives, and rendered as an empty frame that does not
exist in the film. The stills now take their times off the windows' own starts,
round to a frame index, and draw **that frame's own instant** — so the glitch,
which is a function of the frame, and everything else, which is a function of the
time, can never disagree about which moment a still is.

### The end card holds 1.40s

It held 0.40 and the note was to hold it a second longer, which is the change on
this clip with the least argument in it and the most effect: at 0.40s the words
are read and gone, at 1.40s they are read, held and finished. It came through the
opening being cut untouched — that half second came off the front — so the clip
runs 5.55s with the same 1.40s of end card in it. `delighted`'s hold is stretched
to fill the room the plan has, which nobody sees, because he is cut at 4.06.

The guard moved with it: the floor is 1.30s rather than 0.35, and there is a
second one on the **clean** stretch — how long the three words sit still with
nothing tearing them — which must be over a second. That is what the extra second
was bought for, so it is the thing that is checked.

### The wordmark

Three lines, centred, on the line his head was on. Michroma, the site's display
face, and the only place it appears in this clip. **Fitted in the page rather
than guessed**, because Michroma is proportional and the tracking is nearly a
fifth of an em, so the width of `BORING` is a measurement: the page sets 100px,
measures the widest line and scales. Every copy is fitted, the torn ones
included, or a tear would show a wordmark at a different size to the one under
it.

330 css px is 660 device px against a safe band 800 wide, which is 70 device px
of air either side on top of the platform's own margin. The caps measure 74
device px. It reads at 400px wide, which is about a phone thumbnail.

### The label

`ai fart`, lower case, over his head from frame zero to the frame he is cut on.
Michroma with the wordmark's own three shadow glow, which is the "same look" half
of the note, and **fitted by width the same way the wordmark is** and for the
same reason: Michroma is proportional and the tracking is nearly a fifth of an
em, so the width of a string is a measurement rather than a ratio.

140 css px of box fits the type at **27.96 css px, 57% of the wordmark's**, 280
device px wide with 44 device px of ink. That ratio is the whole of "a label, not
a headline", and it is a guard rather than a taste: the ink has a floor in device
px so it stays legible at phone size, and the type has a **ceiling relative to
the wordmark's own fitted size** so it stays subordinate to the three words that
replace it. The first pass was set at 190 css px, came out at 78% of the
wordmark, and the ceiling is what said that is a second headline.

**Where it sits is arithmetic on the plan rather than a number read off a
still.** It is midway between the platform's top line and the top of his glow,
taken at the highest he ever gets over the whole clip rather than at his resting
height — `surprised` snaps him up, and a label placed against where he usually is
would be crowded by the one beat that matters. That lands it on 191 css px,
clearing the safe area by 400 left, 350 top and 400 right, and clearing the top
of his glow by 170 device px. Move him, resize him or change what he does and the
label moves with him.

**It glitches with him.** It lives inside `.stage`, so the shake is
already on it, and it carries the rgb split under the same `data-gl` attribute
the mascot and the wordmark do — so the three stutters tear at the pair of them
together, on one shake and one split. On the hit frame both are cut and the
wordmark is born in their place: the frame exchanges one thing for another and is
never empty, which is the rule the cut already had. It needs no layer of its own.

### The sound is the content

Four new voices in `lib/sfx.mjs` — `hi`, `fart`, `giggle` and `glitch` — and
five cues, every one of them a time something else had already decided:

| at | sound | where the time came from |
|---|---|---|
| 1.11s | `hi` | `agreeing`'s own declared ding offset, the bottom of the first nod |
| 1.84s | `fart` | the puff's own birth, four hundredths before the head moves |
| 3.33 / 3.72 / 3.83s | `giggle` x3 | turning points in the drawn head's y |
| 3.72 / 3.84 / 3.96s | `glitch` x3 | the three stutter windows, at -34, -30 and -26 dB |
| 4.06s | `glitch` | the cut, at -23 dB |

The three stutters are three separate `renderSfx` calls summed onto the same bus,
because that function sets **one gain per kind** and that is the right shape for
it: a per cue level is how a balance stops living in one table. Three quieter
copies of a glitch are three calls with three gains, which is the module being
used as it is rather than worked around.

**The ceiling wins the mix on this clip, by 4.4 dB, and that is a property of
what a sting is.** Hitting post10's -14 LUFS would mean lifting the bus 25.6 dB,
which puts the loudest sound two and a half decibels over full scale and asks
the limiter to take three and a half back. This clip is five sounds and nothing
else, so three and a half decibels of limiting is not glue — it is the glitch
losing its snap. So the bus is peak normalised to -1.8 dBFS instead, the limiter
does nothing, and the integrated figure comes out at **-18.4 LUFS**, which is the
honest description of a clip that is silent for three quarters of its length.
Every platform normalises on the same measure and will lift it back. The sample
ceiling is 0.8 dB under the true peak ceiling because a sample peak limiter does
not hold a true peak and aac adds its own overshoot.

**And the limiter is allowed a decibel and a half, which is a trade rather than a
reversal.** The first cut gave it nothing and landed at -18.4 LUFS. The second
cut added three stutters and a longer fart, which pushed the raw peak up and the
allowed lift down, and it landed at **-20** — every change to the picture was
quietly making the file quieter. The peak here is one thing: the eight
millisecond noise transient at the top of the `glitch` hit, two decibels over
everything else. That is exactly the case a limiter is for and exactly the case
where 1.5 dB is inaudible — the look ahead has it before it arrives and the whole
burst comes down together, so it is 1.5 dB quieter rather than a different shape,
and what it buys is the same 1.5 dB on every other sound in the file. Three and a
half was refused on this argument and one and a half is accepted on it, which is
not a contradiction: the question was never whether to limit, it was how much of
the balance in `GAINS` a limiter gets an opinion about. The file measures
**-18.7 LUFS integrated, true peak -1.7 dBFS**.

### The fart was built twice, and the first one was a buzz

The note back on the first cut was that it did not sound like a fart, it read as
a buzz. That is a fair description of what it was — a sine falling from 96 to 58
hertz with a fixed 38 hertz tremolo on it, low passed at 380 — and it is also a
**measurable** complaint, which is the whole reason the rebuild is aimed rather
than fiddled with.

**A fart is not a tone with a wobble on it.** It is a membrane chattering: a
slack aperture opening and closing under pressure, which is the same mechanism as
a lip trill, a kazoo and a duck call. The flutter *is* the fundamental, not a
modulation of one. And what makes it read as a body rather than as an oscillator
is that the chattering is **irregular** — no two cycles the same length or the
same loudness, because the pressure behind it is falling and the aperture is not
a machine. A sine with a perfectly periodic tremolo has none of that, so the ear
hears a synthesiser being modulated, which is exactly what it was.

So it is a pulse train now, and four things in it are unsteady: the pitch falls
in two stages (a third of the way over the first two thirds, then the rest
steeply, which is the pressure running out); **every cycle gets its own period**;
every cycle gets its own loudness; and a five and a half hertz wobble sits on top
so it sags rather than glides. The waveform is a raised cosine pulse of 28% duty
— a narrow smooth bump has a long harmonic series that falls off gently, which is
the buzz, where a square would have the same series with an edge on it, which is
a raspberry. There is **no noise in it at all**, and that is what keeps it comic
rather than gross: the wet broadband hiss is the whole of what makes a real one
unpleasant. The low pass went *up*, 380 to 660, because the old ceiling was
hiding the harmonics that make it a buzz at all.

**Four variants, and they are measured against what a fart actually is.** Five
numbers, one per clause of the brief:

| variant | len | pitch | drop | jitter | harmonics | tail | >1.5k |
|---|---|---|---|---|---|---|---|
| the old sine | 0.30s | 100 to 63 | 1.58x | **2.5%** | **2/12** | 28% | 0.43% |
| `parp` | 0.34s | 69 to 42 | 1.66x | 10.8% | 6/12 | 5% | 0.72% |
| `puff` | 0.22s | 88 to 62 | 1.41x | 7.7% | 4/12 | 5% | 0.69% |
| **`sputter`** | **0.46s** | **79 to 42** | **1.91x** | **14.0%** | **6/12** | **8%** | **0.86%** |
| `wobbler` | 0.38s | 79 to 47 | 1.68x | 20.3% | 6/12 | 9% | 1.08% |

The old recipe's two numbers in bold are the diagnosis: 2.5% jitter is a synth
tone and two harmonics is a sine with a partial on it.

**`sputter` shipped**, and it is what `VOICES.fart` defaults to. It is the same
recipe cut into two bursts by a gate — a short one, a fifty millisecond gap, then
a longer one that collapses — because a real one very often does not come out in
one piece, and that is the most recognisable fart *gesture* in the set. It also
wins the brief's own three clauses on the numbers: the biggest pitch drop at
1.91x, fourteen per cent jitter which is in the middle of the usable band rather
than at either edge, and a tail down to eight per cent of the body. `wobbler` is
more irregular and that is the argument against it — past about fifteen per cent
a pulse train stops reading as a body and starts reading as a motor with a
bearing going. All four are written to `demo/out/p12-fart/` on every render, so
somebody who can actually listen can overrule the table.

**A trap the preset table set for itself, and it is worth knowing about.** These
defaults are `sputter`'s, so a preset that leaves a field out inherits sputter's
value for it — and the field that matters is the gate. The first cut of the table
left `gate` out of the other three and all three silently came apart into two
bursts, which showed up as parp's measured jitter jumping from 10.8% to 13.1% and
puff's from 7.7% to 29.1%. A gate is a discontinuity and a discontinuity reads as
irregularity to any meter pointed at it. **Every preset now carries every field,
`gate: null` included**: a preset is a whole recipe, never a diff against another
one.

### The hi was built twice, and the numbers are in the file

The brief asked for a synthesised bleep and for an edge tts "hi" pitched up and
bit crushed, and for whichever is cuter to ship. Both were built — seven tts
takes, four on "hi" and three on "hi?" — and the comparison table with the pitch
contours and the top end shares is at the bottom of `post12.mjs` under `THE HI,
BOTH WAYS`, along with the one thing the numbers cannot settle.

The short version: **the synthesised bleep ships.** A neural voice saying "hi"
is one glide with a falling terminal contour, which is what a statement does in
english; the brief asks for two tones rising. A question mark buys the rise back
and the best take gets to 1.26x against the bleep's 1.53x, and it is still one
continuous glide with no gap in it, so it can never be the two notes the brief
describes. Every tts take also carries six to eight per cent of its energy above
four kilohertz, which is sibilance plus the crusher's own aliasing, against the
bleep's zero — and every sound in `lib/sfx.mjs` is low passed under 3.8k on
purpose, which is why the set sounds like one set.

**Nothing in this pipeline can hear**, and the file says so in as many words. A
pitch contour and a spectral centroid are proxies for cute, not measurements of
it. The tts takes are left in `demo/out/p12-hi/` for a person to listen to and
overrule.

### The guards this clip added

Everything `mascot-test.mjs` checks, minus the bubble items, plus:

- **He is actually in the middle**, checked on `plan.box` rather than on a
  rendered frame — see the retime above for why the frame version was wrong.
- **He is actually larger than his corner size.** The rendered plate must be over
  240 device px, which is the number the default `size` produces.
- **The puff never crosses the safe area**, measured off the plan at four times
  the master rate.
- **The wordmark is in Michroma**, fitted to within six device px of its target
  width, over a cap height floor, and inside the safe area on all four sides.
- **The label says what it is meant to say, in lower case, in Michroma**, fitted
  to within six device px of its target width, over an ink height floor, under a
  ceiling relative to the wordmark's type size, inside the safe area on all four
  sides, and over 60 device px clear of the top of his glow.
- **He and the label are both on frame zero, and both gone on the frame the
  wordmark arrives on.** Asserted on `frameAt` rather than described.
- **The pause is over half a second.**
- **The giggle is three beats**, none of them closer than 90ms — which is about
  the sound, not the rhythm — none further apart than 0.60s, and all of them
  before the cut.
- **The glitch stays under post11's 30% duty ceiling**, measured at sixty and
  against the ending it lives in rather than against the whole file — the one
  named exception on this clip, and it is this scene only. Nothing fires past the
  clean line, so the end card holds still.
- **Every glitch window fires on at least one frame at both twelve and sixty**,
  because a fifty millisecond stutter is six hundredths of a frame at twelve.
- **Exactly one white frame in the clip.** Not "at most" and not "at least": four
  chances inside a third of a second is a strobe.
- **The stutters escalate** — each one louder than the one before it — and no two
  glitch windows overlap.
- **The end card holds over 1.30s and is clean for over a second.**
- **No identical frames**, off a per frame signature built from everything this
  file writes plus everything the mascot writes. post10 shipped a pair and only
  found out at sixty.
- **No green anywhere**, asserted on the markup the render actually served. The
  hexes and `--accent` are banned outright; the *word* is checked with block
  comments stripped, because the mascot module's own css comment explains that
  the two greens exist and are not used here, and a guard that fails on a comment
  saying "there is no green" is a guard nobody keeps.

### Outstanding

- **A posting pack.** No caption, no tags, no platform decided.
- **It runs 5.55s.** The first cut was 5.05 against a four to five second brief,
  where the overshoot was the states' own entry, hold and exit floors; a second
  went on the end card and was asked for, and half a second came back off the
  front when the fade up was cut.
- **The glitch recipe now exists twice.** `post11.mjs` carries its own local
  `glitchSfx` — a dropped packet coming apart over a sixth of a second — and
  `lib/sfx.mjs` now carries `glitch`, a single hard hit. They are different
  sounds for different events, so this is not yet a duplicate; the day post11 is
  next touched is the day to look at whether its recipe belongs in the module
  beside this one.

## The thirteenth clip — the yap, and a hand where a mouth would be

```
cd demo
node post13.mjs                 # 1080x1920, 60fps, shutter closed
DEMO_FPS=12 node post13.mjs     # the fast preview pass
node post13.mjs --blur          # 60fps with the shutter open, four subframes
node post13.mjs --keep-frames   # leave the jpegs on disk
node post13.mjs --encode-only   # re-encode from kept frames
```

**4.98 seconds, dark only, one output path, overwritten every run:**
`demo/out/post13-dark-1080x1920.mp4`. Fourteen beat stills land in
`demo/out/verify-post13/`.

post12 is a joke about a robot. This is a joke about us. The mascot talks, and
talks, and gets tired of his own talking: his eyes start alive, they narrow,
they droop, and one of them rolls off to the side looking for a way out. The
label says it once on the first frame — `when ai is tired of humans` — and then
holds still while he suffers under it. Then the signal tears and three words
replace him.

It is post12's skeleton reused on purpose: the centred mascot, the deep glow
label over his head, three stutters into a hard tear, a 1.40s end card. What is
new is **the hand**, and it is new in `lib/mascot.mjs` rather than in this file.

### The hand is the module's, not the clip's

`HAND` and `YAP` live beside the eyes and the brows and post13 turns them on
with two words: `hand: true` on the plan and `yap: true` on each mark. See
The hand under `lib/mascot.mjs` for the geometry, the three things a rendered
frame corrected about it, and why the pop curve is the wrong curve for a gesture
that repeats three times a second.

It is in the module because it is anatomy. A clip that drew its own mouth would
be a clip that invented a face, and the next clip would invent a different one.

### The hand is off, and nothing moved

The part is opt in and the promise attached to that is that every clip written
before it renders exactly as it did. **"Exactly" turns out to be two claims and
they need two proofs**, which is the most interesting thing this change turned
up.

**The module is byte identical, and that is exact.** `demo/out/handoff-diff.mjs`
imports the module as it was and the module as it is and compares, for thirty
plans covering every state, both themes, the turn at both ends, a bubble, a run
of bubbles, a card radius, a caption band, post11's seed and post12's own centred
plan: the whole plan as json, **every frame at sixty as json**, the motion
report, the css, the markup, the page plan and both printed summaries. 9,063
frames, and the only differences are the three keys the change adds, each of
which is asserted to be off — `hand: false`, `yap: null`, `frame.hand === null`,
`report.hand === null`. The one surface that legitimately differs is
`mascotRuntime`, by about 1,700 characters: the page half now looks for a hand
element and writes to it if it finds one, and on a page with no hand in the
markup that lookup returns null and the block never runs.

**The render is not byte identical, and it never was.** This is the finding.
post12 rendered twice with nothing at all changed between the two runs comes back
with different bytes. Two causes and both are outside this module: headless
Chrome's thirty pixel gaussian behind the head lands a least significant bit
either way, and the load loop spins on a real network fetch for Michroma, so the
page becomes ready after a whole number of virtual steps that is not always the
*same* whole number — which slides the vignette's css animation by up to a frame
and re-dithers its gradient across the whole frame.

**Two wrong instruments came first and both are worth writing down**, because
each gave a confident answer and neither was right.

*A hash.* It said all thirteen artefacts changed. It says that when nothing has
changed at all, so it says nothing.

*The worst mse of a pair of runs.* This looked rigorous — render four times on
each module, compare every run against every other, and ask whether the worst
pair across the two groups is inside the worst pair within them. It said no, and
it was wrong twice over. With four runs a group there are six pairs inside each
group and sixteen across them, so the across side draws from the tail of the same
distribution nearly three times as often and comes out higher whether or not
anything changed. And mse is an average over two million pixels: it goes up when
*more* pixels move by a hair, which is exactly what a gradient dithering
differently does and has nothing to do with whether anything moved.

**The right instrument is the biggest single pixel difference.** A mascot off by
a hundredth of a pixel would put hundreds of counts along the edge of a white
disc on black. A gradient quantising a shade differently puts one or two counts
over a lot of the frame and never more than that anywhere. So the question is not
how much of the frame moved, it is whether *anything* moved by more than the
renderer's own noise floor. Measured over eight renders, 336 still comparisons:

| | pairs | biggest single pixel difference | pixels that moved at all |
|---|---|---|---|
| two runs of identical code | 12 | **2 of 255** | 6.5% |
| across the change | 16 | **2 of 255** | 9.8% |

Same ceiling on both sides. The extra few per cent of dithered pixels is the
longer served page biasing that load loop by a fraction of a step — the served
HTML is 1,700 characters longer whether or not a hand is drawn — and it lands on
the vignette, not on the face. Nothing moved.

Three harnesses, all in `demo/out/` and so gitignored, because the baseline half
of them is a copy of a file that only exists in git history: `handoff-diff.mjs`
is the exact module comparison, `prove-unchanged.mjs` renders post12 four times
on each module, and `analyse-runs.mjs` reads the eight renders the right way
round.

### The eye story, and where the slow blink went

The brief's five beats are: alive, a slow blink, narrow, droop half shut, one eye
rolls off. They are carried by three marks and the states' own insides, because a
state is several beats and a fourth mark would cost the clip a second it does not
have — `planMascot` will not seat a mark inside another mark's entrance and exit,
so four states is 4.7 seconds of floor before the tear or the end card get any of
it.

| at | state | what it carries |
|---|---|---|
| 0.00s | `neutral` | alive. he settles onto rest and the idle layer does the rest: drift, breathing, saccades, blinks. the hand is already going |
| 0.76s | idle | **the slow blink**, off the idle schedule. 0.363s of it |
| 1.10s | `thinking` | narrow. lids to 0.56 and 0.30, gaze off camera, a slow scan across the hold |
| 2.42s | `unimpressed` | droop. lids to 0.54, brows in low and turned out, the head sinking and leaning away |
| 2.82s | — | the droop is fully down, and the sigh is on it |
| 3.08s | — | the eye roll has arrived, and the beep is on it |
| 3.40s | — | unimpressed's own slow blink starts, and the tear catches it |
| 3.22 / 3.31 / 3.40s | — | three stutters over the rolled eye, at 32%, 52% and 78% of the heat |
| 3.49s | — | the hit: he, the hand and the label are cut, and the wordmark is born on that frame |
| 4.98s | — | end, after 1.40s of the end card holding |

**The slow blink is the one beat that could not go where the brief puts it, and
that is worth naming rather than hiding.** There is no slow blink in the state
table on its own — the idle ones are a quarter of a second and this wants half —
and the one that exists is written into `unimpressed`, at 0.86 into its own hold.
With three marks inside five seconds that lands at 3.28, which is under the
stutters and half torn off by the hit; for it to finish before the fault starts
the clip would have to run 5.3 seconds. The arithmetic is not close.

So the blink comes off the layer that already makes blinks. **The plan seed is
chosen rather than default**, out of a search over forty thousand of them for a
first blink that lands inside the neutral beat and is at the slow end of
`IDLE.blink`'s own ranges. Seed 63 puts it at 0.756s and it takes 0.3635s, which
is within two thousandths of the longest blink the rig can generate and about
half again the median. Two guards check both, so a seed changed for some other
reason cannot quietly delete a beat of the story. It is not a cheat and it is not
a new mechanism — an idle blink is the mascot's own blink — and `unimpressed`
still does its slow one at 3.40, where the tear now catches it and the last thing
he does before the frame breaks is start to shut his eyes.

**The roll is the turn channel, not new anatomy.** `unimpressed` already does
side eye, and 0.72 of a turn on top of it slides both eyes toward screen right,
foreshortens the far one and closes the gap between them from 21 grid units to
17.8 — which is a head looking away rather than two slabs sliding. It goes to
screen right because the hand is on screen left: he looks away from his own
mouth. It was 0.58 in the first cut and a frame said that is not a roll, it is
thin eyes.

### The sound is the mouth

Three new voices in `lib/sfx.mjs` — `mumble`, `sigh` and `annoyed` — and every
cue is a time something else already decided:

| at | sound | where the time came from |
|---|---|---|
| 14 times, 0.00 to 3.35s | `mumble` | one per yap cycle, at the cycle's own start, for exactly as long as that cycle's mouth is open |
| 2.82s | `sigh` | the droop arriving, read off the module's own preflight |
| 3.08s | `annoyed` | the turn arriving, read off the drawn head |
| 3.22 / 3.31 / 3.40s | `glitch` x3 | the three stutter windows, at -34, -30 and -26 dB |
| 3.49s | `glitch` | the cut, at -23 dB |

The mumble is not laid on a grid this file invented: each syllable's **start** is
a yap cycle's start and its **length** is that cycle's own `voiced`, so the sound
is exactly as long as the gesture that makes it and no two syllables are the same
length either. `shape` walks the four vowel moves so consecutive pulses are
different shapes. A guard asserts the pairing cue by cue.

**The cues stop at the cut and the hand does not.** `yap: true` on the last mark
means "until the end of the clip", so the plan yaps for 4.98s and he is cut at
3.49 — the last second and a half of yapping happens where nobody can see it.
Filtering the cues on the cut rather than trimming the plan is the honest
version: the picture decides what is heard, and a guard asserts nothing but the
glitch is heard after he is gone.

**The loudness target very nearly wins this clip, where post12's ceiling won by
four decibels.** That clip is five sounds on silence. This one has a mumble
running under the whole of it, so it is a clip with a floor rather than a clip
with events: the ceiling still wins, but by 1.9 dB rather than 3.9, and the file
measures **-16.2 LUFS integrated, true peak -1.6 dBFS**. Same rig, same argument,
a better answer because there is more in the file.

### The wordmark's birth is a frame, and the preview could not see the fault

post12's rule is that the wordmark is born on the same frame the mascot is cut,
so the frame exchanges one thing for another and is never empty. It says that by
setting `wmIn` to `END.at` and letting both round to a frame on their own — and
**that only works when the rounding happens to go up.**

post12's 4.06 at sixty rounds to frame 244, which is 4.0667, which is *after*
4.06, so its wordmark is already a sixth of the way in on the frame the head
leaves. This clip's 3.49 rounds to frame 209, which is 3.4833, which is *before*
3.49 — so the head went on frame 209 and the wordmark started on frame 210, and
there was one frame of a black screen with a bloom on it and nothing else. The
exact fault post12 fixed by hand, back again by arithmetic.

**The twelve frame preview could not see it.** At twelve, 3.49 rounds to frame 42
at 3.5, which is after, so the preview renders the wordmark already on. It was
caught on the sixty pass by the guard that says the wordmark must be born on the
cut frame — which is the whole reason that guard is written against `frameAt`
rather than against the numbers in `END`.

The fix is `onGrid`'s own principle applied to a birth rather than to a burst:
the wordmark's ramp is derived off the cut **frame** rather than off the cut
time, at whatever rate is rendering, and it starts on the frame *before* it. That
puts it at exactly nought on the last frame he is on and already on for the frame
he leaves, at twelve and at sixty, with one source of truth and no rounding to
get lucky with. Both ends are now asserted.

### Two lines about the label

Six words rather than two, so it is **two lines**, and that is the one layout
decision this clip made on its own. Fitted to a single line inside the safe band
the type comes out under 16 css px, which is about 20 device px of ink and under
the floor a line has to clear to be read on a phone. Broken into two the widest
line is `tired of humans` and it fits at 23.7 css px, 48% of the wordmark's size
— subordinate by the same ratio post12's two word label landed on, arrived at
from the other direction. The break is after `is` rather than after `tired`,
because `tired / of humans` splits a phrase across the line and the other does
not.

Everything else about it is post12's: Michroma, lower case, no full stop, the
wordmark's own three shadow glow scaled down with the type, fitted by measuring
the widest rendered line rather than by a ratio, sitting midway between the
platform's top line and the top of his glow at the highest he ever gets, on the
mascot's own shake and rgb split, and cut on the frame the wordmark arrives on.

### The guards this clip added

Everything post12 checks, minus the puff and the giggle, plus:

- **The hand rendered, and it is big enough to read.** Measured off the rendered
  rect: over 1.2 times the eye's own width long, over 16 device px thick, and
  within a pixel of what the geometry says it should be.
- **It opens all the way and shuts all the way**, off the drawn angles rather
  than off the plan, and **every planned cycle is an open on the screen** — if
  those two ever disagree the plan and the picture have come apart and the
  mumble is placed off the plan.
- **It snaps without stepping**: the faster of the two tips may not travel more
  than 8 css px between two frames at sixty, which is twice a blink's lid.
- **The gape is a mouth rather than a crack**: over an eye and a third of face
  showing between the tips at the widest.
- **It yaps for the whole time he is on screen**, starting inside two hundredths
  of frame zero, stopping within half a second of the cut, at between 2.4 and 4.2
  syllables a second.
- **The eye story is measured on the drawn face**: the lids are open on the alive
  beat, past 0.28 on the narrow one and past 0.50 on the droop, the slow blink
  lands inside the alive beat and is within a twentieth of the slowest the rig
  can generate, and at the roll the eyes have closed the gap between them and
  neither is sitting on its clamp.
- **The mumble is on the mouth**, cue by cue: every syllable starts on a cycle's
  own start and lasts that cycle's own `voiced`.
- **Nothing but the glitch is heard after he is cut.**
- **The clip runs between four and five seconds**, which is the brief's own
  number and is a guard rather than a note.
- **The label has no full stop and no punctuation dash in it**, which is the
  brand rule, checked on the string the page actually rendered.

### Outstanding

- **A posting pack.** No caption, no tags, no platform decided.
- **The hand reads as a mouth rather than as a hand**, and the review says so.
  The brief's acceptance test is "reads as a yapping mouth at phone size and not
  a random shape" and it passes that; the fiction that it is a *hand* is carried
  by the concept rather than by the silhouette. Two cuts tried harder and were
  worse. There is no room for finger detail on a head whose whole feature stroke
  is 4.4 grid units.
- **`surprised` and the hand do not fit on the same face.** Written down under
  The hand rather than guarded, because no clip pairs them and the honest fix is
  a bigger grid.
- **The review is in `demo/out/review-post13.md`**, which is gitignored like
  everything else in there.

## The fourteenth clip — the news flash, and somebody else's mark

```
cd demo
node post14.mjs                 # 1080x1920, 60fps, shutter closed
DEMO_FPS=12 node post14.mjs     # the fast preview pass
node post14.mjs --blur          # 60fps with the shutter open, four subframes
node post14.mjs --plan          # every plan printed, nothing rendered
node post14.mjs --keep-frames   # leave the jpegs on disk
node post14.mjs --encode-only   # re-encode from kept frames
```

**13.03 seconds, light only, one output path, overwritten every run:**
`demo/out/post14-light-1080x1920.mp4`. Nineteen beat stills land in
`demo/out/verify-post14/`, which is how the cut is read as a strip rather than
scrubbed as a video. The 60fps master with the shutter open rendered green at
1.37 MB, log at `out/post14-final.log`.

**It shipped at 9.95s and came back with five notes**, all of them below in
their own section: the opening thought was too fast and too close to his head
and needed three dots rather than two, the read was hurried, the mark was too
small and wanted a chat panel under it, the end card sat too high, and he was
too quiet in his corner. The second cut is 3.08s longer and every second of that
is one of those five.

Every clip before this one is about us. This one is about somebody else's
release, and the reason to make it is that a feed rewards being early about a
thing people already care about. Short, bright, and the brand content is three
words at the end, exactly where post12 and post13 put theirs.

Two firsts: **it is the first clip that puts somebody else's mark on the
screen**, and **the first that moves the mascot.**

### The logo is an asset, and it is placed rather than drawn

`demo/assets/anthropic-logo.png` is dropped in as an `<img>` at its own aspect
ratio and nothing is done to its pixels: no crop, no filter, no recolour, no
redraw. 496x496 with an alpha channel, rendered at 76 css px square, which is
152 device px, centred at (270, 156) css.

**The asset is the clay one rather than a black one.** The brief calls it the
black version; the file is `#e37d5b` at full alpha, which is anthropic's own
clay. The brief also says do not alter it and never recolour it, and those two
instructions point in opposite directions, so the one that is a constraint won
over the one that is a description: it is placed exactly as it is. One `filter`
would make it black if that is what is wanted.

**The clearance is measured on the turned box, not on the square.** A square
spinning about its centre sweeps a circle of its own diagonal, so what has to
clear the platform's top line is `size * root two / 2` above the centre and not
`size / 2`. At 76 css that is 53.7 css of reach, which puts the top of the sweep
at 204 device px against a 180 floor.

Four things are asserted about it at render, off the element rather than off the
css that sizes it: the drawn box carries the file's own aspect ratio, the
computed `filter` is `none`, `object-fit` cannot crop it, and the **sweep**
clears every border on every sample. The turn is checked on frames too: it goes
round at least 300 degrees, never more than 360, and never backwards.

The one thing that touches it is the glitch, for the three frames the glitch is
on: an rgb split and the frame's own jitter, which is what the brief asks for in
as many words. **The torn bands are drawn under it** — `z-index` 5 against the
image's 6 — so a band can never cross the mark.

**Its split is 0.42 of the ink's, and that is a rendered frame's correction.**
The mascot is a 360px solid disc and 4.5px of fringing on it is a hairline; the
mark is nine strokes about eight px wide, so the same offset put a full width red
copy beside every one of them and the thing stopped reading as clay and started
reading as pink. Same channel, same two colours, same three frames, at the scale
it is actually drawn at.

**And its birth is a frame.** post12's rule. The first cut faded it up over
0.10s and the fault frames caught it at a third of its opacity under a colour
split, which is a pale pink ghost of somebody else's logo. It is off, then it is
on, and the fault on the same frame is what makes that an arrival.

### The zone — one plan, two placements

The module places one head, once, out of `plan.box` and `plan.size`, and this
clip needs him in two places at two sizes. So **the plan is the corner one** —
post11's exact placement, size 128, bottom left inside the safe area, which is
what every guard in `lib/mascot.mjs` is written about — and the opening is that
same mascot moved and scaled by a transform on his zone.

It is one css rule at the id level and the module is not touched: `.m-zone`
carries no transform of its own, so there is nothing to fight. The origin is the
element's centre, which is also the plate's centre, so the scale changes the
extent and the translate is simply where the head goes.

| | placement | head |
|---|---|---|
| the opening | centred on (270, 500) css | 180 css, **360 device px** |
| the corner | the module's own bottom left | 120 css, 240 device px |

What it costs is that `headRect` no longer answers on its own — it works the ink
out of `plan.box` and knows nothing about a transform laid over the element — so
`zoneRect` composes the two and the clearance guard reads that. The head is still
computed rather than measured, for the module's own reason. Worst in the corner:
166 left, 241 bottom, on every one of 597 frames. Worst big and centred: 350 /
826 / 360 / 763.

**The opening is deliberately over the module's phone window** of 220 to 280
device px, and that is a different question rather than a violation: a head alone
in the middle of an empty frame is a hero shot, and the window is about a head
sharing a frame with words. The plan is checked against it, because the corner is
where he is for eight of the ten seconds.

### The thought had to move, and there is no head size that fixes it

The module hangs the thought off the head's right shoulder, which is right for a
mascot standing in a corner and impossible for one standing in the middle. The
cluster measures 233 css px, the frame is 400 css wide inside the safe area, and
a head centred at 270 leaves 130 to its right. **There is no head size that fixes
it** — at a diameter of nought the pill still does not fit, because the cluster is
wider than the half frame.

So for the opening beat only it is re-anchored **above** him, dots trailing down
toward his crown and the pill climbing up and right, which is what a thought
bubble over a centred character has always looked like. It is a translate on
`#m-bubble`, and the module writes nothing to that element except its visibility,
so nothing is overridden and nothing is forked. It is counter scaled back to
natural size as well, so the pill is the same physical size in both placements
and the caps floor is the same number in both.

**`lib/mascot.mjs` grew its own version of this after post15**, as
`thought: 'over'`. This clip's is not it: the module's derives the side from
`pos` and this one is about a mascot standing in the middle, where `pos` has
nothing to say. The day this file is next opened is the day to ask whether the
module should take a centred placement too. It renders as it always did until
then.

### The opening costs 1.62s and it is arithmetic

`delighted` takes 0.50s to arrive and a bubble may not start before the head has
settled. The quick bubble profile then lives 0.80s. So the earliest a thought can
be finished is 0.50 + 0.02 + 0.80 = 1.32, and `planMascot` insists a bubble fits
inside its own mark's hold, which puts the next mark at 1.62. Every number in the
opening is that floor rather than a choice.

**The opening bubble runs on the quick profile and the second one does not.** The
ordinary profile lives 1.68s and would put the next mark at 2.30, which is a
quarter of the clip spent before a word is said. The cost is written down rather
than hidden: **the opening pill is fully up for 0.30s**, because `BUBBLE.quick`'s
hold is floored and capped at the same 0.30 and no amount of room changes it.
Counting the fade either side it is over half opacity for about 0.6s at 52 device
px of type, and the first caption says `claude fable 5.1` fourteen hundredths of
a second later. It is the one place in the clip a viewer is asked to read fast.
`love it`, at 4.62s, has room and gets the ordinary profile: 0.90s of full pill.

### The cut

```
 0.00   he is big and centred, delighted
 0.52   the thought starts climbing
 0.82   the pill is full: "fable 5.1 out"
 1.36   fault one. split, shake, three ink bands, one ink flash, all of it on him
 1.48   he is cut
 1.62   fault two. he is back bottom left at corner size
 1.72   fault three. the mark is born at the top and starts turning
 1.71   claude fable 5.1 is out                              +12% / +3Hz
 3.63   smarter, cheaper to run, fewer false blocks          +18% / +1Hz
 5.72   the pill is full: "love it"
 6.33   and claude code sessions can now talk to each other   +8% / +3Hz
 7.20   he agrees, and the ding lands at 7.67
 8.55   the end card starts arriving
 9.95   out
```

**He does not leave on the frame the hit lands.** The fault is on him for an
eighth of a second first, and that is the whole of what makes the hit read: the
first cut took him on the hit frame itself and a rendered frame said what that is
— a page with three bars and some grain on it and no reason for any of it. The
fault has to land on him and then he is gone. It costs 0.12s.

**The two mascot windows are chained rather than adjacent.** Two windows snapped
separately to the same grid do not necessarily touch: at sixty the first one's
own length rounded to 1.633 and the second one's start rounded to 1.617, which is
an overlap, and at twelve they happened to meet. So the first window's end **is**
the second's start, at whatever rate is rendering.

**And a chained window never dies.** `heatAt` decays to nothing by nine tenths of
the way through, which is right for a fault that ends and wrong for one that
hands over. The stretch he is missing from lives inside it, and the last frames
before he came back were clean white paper with nothing on them at all. A window
running into the next has a floor of 0.62 under it now.

### The rates are positive, and that is a decision

The house default is `calm` at -8%, which is a person reading a statement to
camera and is right for an explainer. This is a news flash. The two outer lines
run bright and quick and the middle one, which is the only one that is a list,
runs quickest of the three, so its two commas are phrasing rather than two stops.
The pitch goes the other way — up, nearly flat, up — so the reading rises, levels
and rises again instead of climbing all the way through.

Measured on the takes: 2.73 to 4.67 words a second against a flat 2.3, gaps of
0.14 and 0.16s.

### The frame

| | css px of 540x960 |
|---|---|
| the mark | centred on `270,156`, 76 square, sweeping a 107 css circle |
| the caption band | `70,320`, `400x210`, bottom anchored, ink about 490..530 |
| the mascot | bottom left, the module's own placement, 240 device px of head |
| the end card | centred on 480, `BORING` 240 css wide, and nothing under it |

**The end card is smaller than post11's 330** because this frame is fuller than
that one: the mark is turning at the top and the mascot is in his corner at the
bottom. 240 puts the caps at 66 device px against post13's own 56 floor.

**And there is no address under it.** post11, post12 and post13 all put
`theboringtek.com` below the wordmark in the lockup subline's treatment, which is
the one place the brand allows michroma small. This one does not: at 190 css wide
that line is 11 css px of type, which is 18 device px of cap on a phone —
legible if you go looking for it, invisible if you are scrolling, and the only
thing on the card asking to be read that could not be. What is left is three
words at 66 device px, which reads from across a room. It also takes the two
numbers that were about the pair of them out of the file, so the group **is** the
wordmark and centring it is one measurement rather than three.

**And the fit had a bug in it that only a frame could show.** The block carries a
`max-width` so the safe area check measures ink rather than the frame, and at the
100px probe size that clamp is what the measurement returned: the fit divided 300
by 400 instead of by 557 and came back with a wordmark three sizes too big and an
address running off the side of the frame. The clamp comes off while the probe is
up and goes straight back on.

### The glitch is the light theme's, and the numbers are not post12's walked down

On black the split is 9.5 css px of red and cyan around a white head and it reads
as a look; on white it is dark fringing on dark ink and 4.5 is already loud.
Three things differ from the dark clips and each is about paper:

- **The bands are the fault rather than a displaced copy of one.** post12 and
  post13 black a band out and redraw a shifted copy of what is under it; there is
  nothing here that can be copied, because the mascot is one dom subtree driven
  out of the module's runtime and there is no second of it. So on paper the band
  is a bar of ink at 0.82, slammed across the frame and offset sideways. A few
  near black bars across a white page for three frames is a dropout.
- **The grain multiplies rather than screens.** Screen blended noise on white is
  nothing at all.
- **The flash is ink.** What a signal collapsing looks like on a white page is
  the page going dark for a frame. It is 330 css px across, centred on the head,
  and there is exactly one of it.

**There is no local duty ceiling and that is deliberate.** post11 has one because
its glitch is a scatter through a scene that is up for two and a half seconds,
where a high ratio really does mean the thing never stops faulting. This clip's
whole fault is three deliberate hits at the front, one of which is meant to be
continuous — a ratio cannot tell "a quarter, scattered" from "a quarter, all of it
in the first two seconds". What holds the beat honest is the absolute length of
each window, capped at a third of a second, plus a 12% ceiling on the clip as a
whole. Measured: 27 of 597 frames, 4.5%.

### The turn is not GLIDE, and a frame is why

The mark turns once over eight seconds and the first cut ran it on the house in
out. **Every bezier whose second control point ends at one arrives at zero
speed**, so the last second and a half of the clip had a mark that had stopped,
over an end card that is already still, which is the frozen frame the review
checklist asks about by name. `TURNING` is the same family with the second
control point at 0.82: it still eases in, it still slows toward the end, and it
is turning at three fifths of its own average when the clip runs out.

### The mix, and the ceiling winning

**-15.5 LUFS integrated, 2.5 LU range, true peak -1.5 dBFS on the mp4, the
limiter pulling 4.61 dB.** No music. Six cues: two `pop`, one on each thought
arriving, one `ding` on the agreement beat, and three `glitch`, one per fault at
the window's own start. Every one of them is a time something else already
decided.

**The ceiling won over the loudness target, and that is post12's argument.** This
read has 17 dB of crest on it, so the last three decibels of -14 are bought
entirely with limiting: the pass that reaches -15.5 costs 4.6 dB of gain
reduction and every one after it costs a whole decibel more for a fifth of a
decibel of loudness. The loop stops at the last pass inside 5 dB rather than at
the one closest to target, and the run prints which of the two decided it.

**The loop also works to a lower ceiling than the guard reads**, because the
guard reads the mp4 and the loop writes a wav: aac is a lossy round trip and it
overshoots the samples it was made from. The first render came back at -0.9 on a
file the limiter had held at -1.0. Half a decibel of headroom is what it costs.

### The guards this clip added

- The **mark**: aspect ratio against the file's own, computed `filter` is `none`,
  `object-fit` cannot crop, the sweep clears every border on every sample, it
  does not move (skipped on frames the whole stage is being shaken, because the
  jitter moves everything and a sample inside a fault says nothing), and the turn
  is between 300 and 360 degrees and never backwards.
- The **zone**: the head clears every border at both placements, on every frame,
  through the composed transform; the big placement is really centred, checked on
  the arithmetic rather than on a frame, because idle drift moves him a css px
  either way; and the big head is at least a fifth bigger than the corner one, or
  the change of size is not one a viewer would notice.
- The **cut**: he is on from frame zero at the big placement, on for the frames
  the fault is on him, off across the gap, and back at the corner placement on
  the frame the second hit lands. The gap is read on the master's grid, because
  at twelve the same 0.14s quantises to one frame.
- The **end card against the last caption**: they are allowed to coexist, which
  is post11's cut, and the check is that they never touch — measured on the end
  card's own ink against the caption's own ink.
- **No caption while he is big**, read back off frames rather than assumed.
- The usual: no card straddles two lines, drawn is spoken, one card at a time, no
  accent on a caption, no punctuation dash anywhere a viewer can read, no hole in
  the read over a second, no identical frames.

### The second cut, and the five things it changed

**The opening holds 2.52s and the thought is on the ordinary profile.** The first
cut ran the quick one, whose hold is floored and capped at the same 0.30 whatever
room the mark is given, and the cost was written down at the time: 0.30s of full
pill. With 2.52s the ordinary profile fits — 0.48 in, 0.74 of hold, 0.30 out —
and the pill is fully up for **0.74s**. What fills the rest of it is him:
`delighted` is two hops with real lift and a small turn on the way up, and the
idle layer's drift, breathing, saccades and blinks carry it to the fault with
nothing else on the screen.

**The thought has three dots and they climb a diagonal.** The module climbs two,
8 and 12 css px, in a flex row with the pill: same baseline, increasing x, fixed
gaps. That is the site's own cluster and it is right for a mascot in a corner
with the thought beside his head. It cannot do this beat — the pill is *above*
him, so the climb is a diagonal, and a flex row is not a diagonal at any set of
gaps. So for the opening the three dots are this file's, drawn in page
coordinates on the diagonal from his crown at (216,428) to the pill's own bottom
left corner at (175,372), and the module's two are switched off.

**That is one line in `apply`, not a fork.** `window.__p14.apply` always runs
after `window.__mas.apply`, so writing the module's dots to nought after it has
written them is the same ordering `#m-zone`'s own opacity channel relies on. The
pill is still the module's, at the module's size, on the module's spring. And the
timing is the module's too: each dot reads a channel out of `mascotFrame`, so all
four things arrive 70ms apart on the site's own pop curve rather than on a second
animation that could drift.

```
the 5  reads dot 0 at t + 0.07, which is a dot that started 70ms earlier
the 8  reads dot 0
the 12 reads dot 1
the pill is the pill
```

The pill sits 38 css px above his crown where the first cut had 14, and the first
dot is 8 css off the silhouette, which is attached to him rather than near him.
Both are guarded.

**The read comes back to a person's pace.** The first cut ran +12, +18 and +6 per
cent on the argument that a news flash is quick and the clip had ten seconds to
hold three facts. Watched back it is not upbeat, it is hurried. So the rate sits
around the house default and the **shape** carries the register instead — the
pitch is up on the headline and up on the payoff and nearly flat on the facts, so
the reading rises, levels and rises again rather than climbing all the way
through. Measured on the real takes, words a second on the first line: +12% was
2.82, 0% is 2.52, -4% is 2.41, -8% is 2.31. The gaps are a real breath now, 0.34
and 0.38, and the read costs 0.9s more than it did.

**The mark is 216 device px.** What sets the ceiling is not the mark, it is the
sweep: 108 css reaches 76.4 in every direction, so its centre cannot come closer
to the top than 90 + 76.4. At 178 the top of the sweep lands on 203 device px
against a 180 floor.

### The chat panel

A picture of the box a person types into, drawn out of this file's own rules: a
rounded panel in the page's ink, a line of text, a plus in a ring on the left and
the model's name on the right. **No logo inside it and nothing lifted off
anybody's product** — it is the shape of the thing, which is what a viewer
recognises, and every part of it is a css rule here.

It is `--fg` on `--bg`, which is the site's ink on the site's paper, so it needs
no colour of its own. On a white frame a dark panel is what a chat box looks
like, and it gives the middle of the picture something to be about between the
mark at the top and the caption under it.

The geometry is worked backwards from the two things it has to fit between: the
mark's sweep reaches 254 css and the tallest caption ink starts around 432, so
the panel gets **272..407** and there are 25 css px of air under it. The text
block is top anchored and the controls row is bottom anchored, so a line growing
from nothing to two lines cannot move the plus or the model name under it. That
is what a real input does and it is also what stops the frame twitching every
fourth character.

**The type is 23 css px because 22 is 31.7 device px of cap and the floor is
32.** The line wraps to exactly two at that size, which is what the panel is two
lines tall for, and the whole string is written in, measured and taken out again
at build time so a line that would spill out of its own box is caught before a
frame is drawn rather than on the last character.

**`Fable 5.1 Medium` is under that floor and it is the one exemption in the
file.** It is not the clip's copy, it is chrome inside a drawn picture of a
screen — the same footing as post11's registration number, which is on the screen
and is never read aloud. Type inside a picture of a ui is as small as it is in the
ui, or it is not a picture of a ui.

**The caret is inline rather than positioned**, so it travels with the text
through the wrap without anything having to measure where the text got to. It cost
one fix: with nothing typed it sits at x nought, which is exactly where the
placeholder starts, and the frame came back with a white bar drawn through the
`a` of `ask anything`. The placeholder is inset five px now, which clears the
caret's two and its margin, and it is what a focused empty input actually looks
like.

**The typing is cut to the read at both ends.** It starts on the second line's
first word and finishes 0.60s before the end card, both derived rather than typed,
so a slower read moves the typing with it: 41 characters over 5.77s, which is 7.1
a second. Every gap is its own number off a seeded prng — post9's rule, because a
constant rate reads as a machine filling a field — and a comma gets a beat after
it. Eleven `key` ticks, one per four characters plus the two ends, at post11's own
level.

The panel rises rather than glitching in, and it is the one thing in the clip that
arrives calmly: the fault is the opening's language and it is over by then, and a
third arrival on a tear would make the fault the clip's whole grammar rather than
its first beat. It leaves the same way over the third of a second before the end
card, so the wordmark never comes up over a picture of somebody else's product.

### The end card is on the middle of the frame

It was on 325, which is the middle of the room between the mark's sweep and the
caption band, and on a rendered frame that reads as an end card sitting high with
a hole under it. 540x960 puts the middle at **480**, and it is the frame's middle
rather than the safe band's, which is 470: the platforms take more off the bottom
than the top, and a wordmark nudged up five pixels to satisfy that is a wordmark
nobody centred.

What it costs is that the group now sits **where the captions are**, so the end
card may not arrive until the last card is out — which is the caption plan's own
number rather than the voice's, because how long a card is up is not a fact about
when the last word ended. `endIn` is derived off `max(cap.groups.out)` and the
last word, whichever is later, and both the ordering and the group's own rendered
middle are guards.

**The centre check was wrong before it was right.** It did the placement
arithmetic a second time on the guard's side and got 514.8 for a group that is
placed on 480, because both blocks are translated by half their own size to sit
on the line they were given. It measures the two rendered rects now.

### He is not quiet in the corner any more

The first cut had him arrive `curious`, sit still for three seconds, hop once and
nod once. That is a corner ornament rather than a character. He gets a state per
line now, in the order the lines earn it, and each carries a short positive
thought on the ordinary profile:

```
2.52  curious     "yes"       on the news
5.20  agreeing    "love it"   on the three facts, and it earns the ding
8.50  delighted   "nice"      on the one that is actually good
11.25 neutral                 he settles as the wordmark comes up
```

**Four thoughts is the ceiling rather than the count**, and it is a guard: a
fifth would be a mascot commenting on every clause. The three corner marks are
placed against the read rather than typed, so moving a line moves the reaction
with it — except the first, which is keyed to the fault he is born on, because
that is what makes "he arrives with the first word" true by construction instead
of by coincidence.

`agreeing` stays on the line that is a list of three facts, which is the one worth
agreeing with, and post11's rule holds: it is the one state that earns a `ding`
and the ding keeps meaning yes.

### The glitch window's length is the gap it chains across

The first window runs to the second's start rather than to a length of its own,
which is what keeps the stretch he is missing from free of clean frames. That
means its length is not a number in the file, it is `T_BACK - T_GONE` — so when
the opening grew, the fault grew with it and came out at 0.32s, over the third of
a second a tv glitch is allowed to outstay. The hit moved to 2.26 and the window
is 0.26s again, which is the length the first cut proved.

### Outstanding

- **The clip has no posting pack.** Caption, tweet and three tags per platform
  are all undecided, and this one has a timing question the others do not: it is
  about somebody else's release and it is worth less every day it sits.
- **`demo/assets/anthropic-logo.png` is not tracked, and since 2026-09-06 it is
  ignored rather than merely absent.** It is somebody else's trademark in a
  public repo, which is a call rather than an implementation detail. That call
  went the way it was leaning: `demo/assets/*` is in `.gitignore`, with the
  traced gloves the one negation under it. `post14.mjs` throws with a named
  error if the file is not there.
- **The review is in `demo/out/review-post14-light-1080x1920.md`**, which is
  gitignored like everything else in there.

## The fifteenth clip — the bug, and eating it on screen

`post15.mjs` renders 6.73 seconds, vertical, dark only, out to
`demo/out/post15-dark-1080x1920.mp4`. **The first clip built on
`lib/camera.mjs`.**

A small bug drawn in code walks in from the left, low in the frame. He watches
it. It stops under him and he looks down at it and narrows his eyes. Then he
eats it — a small rise, a lunge down over it, the head squashing on the landing
and the bug gone under his ink, then three chewing pulses with his eyes shut and
a satisfied bob. `crunchy`. One glitch, and the end card.

A computer bug and a real bug, and the joke is that nothing explains either.

### The first cut used the circle grow, and that was the wrong joke

`lib/transitions.mjs` did the middle: he grew until his fill covered the frame,
the world went white for a full second with nothing on it, the same shape ran
backwards and the bug was gone. It worked, all 45 guards were green, and it was
the wrong instrument.

**A grow is a scene change.** Using one here says "and then something else
happened": the audience is asked to infer the eating from a hole in the picture
rather than to watch it. It also cost 2.71s of a seven second clip and put the
whole thing 0.30s over the brief.

So the middle is drawn now. It costs **1.64s** against that 2.71 and the clip
comes in at **6.73s**, which is inside the brief with room, and the thing the
clip is about happens on the screen.

What the first cut found on its way past is not lost with it: `tail: 0` on a
reverse grow is a real fault in `lib/transitions.mjs` and it is written up in
that module's own section.

### The depth of the lunge is derived, not chosen

The bug has to be gone **under his ink** on the frame it is switched off, or the
switch is a disappearing trick rather than a bite. So the file walks the lunge
down in half pixel steps until the head's drawn ellipse — the plate's radius
times the card's own two scales times the bite's squash — contains every corner
of the bug's drawn ink, and adds a five pixel margin. at sixty:

```
the lunge needed 88px and it goes 93
```

That is three quarters of a head diameter, which is what a lunge at something on
the floor actually is. The derivation and the guard call the same
`containment()` on the same `headInk()`, so they cannot disagree, and the same
containment is measured a third time **on the rendered frames**: the bug's ink
box off the last frame it is drawn against the plate's own circle off the frame
it goes, worst corner at **0.81** where 1 is the edge.

Those are two different frames, and that is only a fair comparison because the
bug has been standing still since it planted its feet — which is asserted rather
than assumed.

### The frame the bug goes is a ceiling, not a rounding

post13's correction, in a new place. `Math.round(2.51 * 12)` is 30, which is
2.50 — **before** the head has landed. So the switch is `Math.ceil`, and it
comes with a guard the preview is what asked for:

> the bug goes on a frame his head is at the bottom of its lunge, at twelve
> (2.5833s) and at sixty (2.5167s), inside a contact that runs 2.5100 to 2.6100

**And that is why the contact is 0.10s rather than 0.05.** A contact shorter
than one frame of the pass that is rendering has no frame inside it at all, so
there is no frame the switch can safely happen on. One twelfth is 0.083, so 0.10
holds at both rates and the guard checks both rather than whichever one is
running.

### The bite and the chew are one transform on `#m-zone`

`lib/mascot.mjs` writes `#m-card`, the shadow, the glows, the eyes, the brows
and the three bubble parts, and it writes nothing to the zone. post14 placed the
mascot through that seam and `lib/transitions.mjs` grew him through it; this
file lunges and chews through it. **Nothing in `lib/` is touched.**

| | |
|---|---|
| the rise | 7 css px up over 0.11s, smoothstepped. he goes up before he goes down, which is every entrance in `lib/mascot.mjs` and is what makes a lunge a decision rather than a twitch |
| the lunge | 93 px down and 4 px forward over 0.10s, on `u²` — accelerating, because a head going after something has mass |
| the contact | 0.10s, and the squash lives here and nowhere else: 7.5% volume preserving, under the module's own 8% ceiling |
| back up | 0.16s, decelerating |
| the chew | three pulses of 0.30s, the squash peaking a third of the way through each and the side alternating — 3.4 px of lateral working and 1.7° of roll into the working side |
| the bob | 5 px, 0.24s, a half sine after the third pulse |

**The forward lean is negative on purpose.** He leans out over the bug into the
frame rather than toward the right hand safe line, which is the tightest number
in the clip: the worst head clearance is 21.9 device px inside the right line at
3.27s, and that is a chew working to the right.

### The eyes had to match, and one state was making them not

`curious` opens one eye to 1.80 and the other to 1.10 on purpose, and it is
right for the beat he is in — one eye wider than the other **is** curiosity. It
is wrong four hundred milliseconds later, when he has stopped being curious and
is looking down at a bug that has stopped moving. A rendered frame at 1.70s came
back reading as a broken face rather than an interested one, because the state's
exit had not finished levelling the pair.

Two things fixed it and both are in this file.

**The beat after it is a clean symmetric narrowing** rather than the module's
`unimpressed`. That state's lids are symmetric and are not the problem; what it
brings with them is — brows, a side eye and a lean away, which is a face
declining to be interested rather than a face concentrating. `thinking` turns up
and away, which is the opposite of looking at something on the floor. So the
mark is `neutral` and the lids are pushed down to 0.40 on both eyes at once.

**And the pair is levelled**, scale toward its own mean and lid toward the more
closed of the two, across the end of `curious`. That is this file writing
channels the module owns, which is the one place it happens, and it is guarded
rather than assumed:

```
the two eyes are the same shape from the frame the bug stops:
  worst difference 0.0001 of scale at 1.62s
and the same lid: worst difference 0
```

**Every write to the module's face is one directional.** The lid is pushed
toward shut and never open — `max(what the module wrote, what the clip wants)`
cannot fight a blink, because a blink during a narrowing closes further and the
max keeps it closed. The eye scale is only ever made smaller. It is the same
discipline `lib/transitions.mjs` used when it multiplied the shadow and the glow
toward zero.

### Shut is a line, not a lid, and a rendered frame is why

The module's blink is the lid arriving over the eye, and that is right for a
blink: it is sixty milliseconds and the face is blank for two frames of it. Hold
it for a second and a bit and the face is not a face with its eyes closed, it is
**a face with no eyes** — the first cut of the chew came back a blank plate.

What a drawn closed eye is, is a line. So the eye is squashed to 0.26 of its own
height instead, which leaves **4.6 device px** of the same ink an open eye is
drawn in, and the lid gives way as the squash comes in so the two are never both
taking height off the same eye. Both numbers are guards.

### The rest of it is unchanged

The bug, the gait, the walk, the lane, the camera, the reserved band, the
mirrored thought bubble, the glitch and the end card are all the first cut's and
are described below as they were built.

### The bug is a top view, and that is the decision everything follows from

Drawn in code, flat, in the mascot's own ink, from above. It was made for the
same reason the mascot is a circle: it is the read that survives being small. A
side view of an insect shows three legs, hides three, and needs a ground line to
stand on; from above there are six legs, two antennae and a body, which is what
a child draws when you say bug, and it needs no ground.

It also makes the gait honest. **An alternating tripod** — front left, middle
right, rear left down together, then the other three — is what a real insect
does and it is visible from above, because what it does is sweep three legs back
while three swing forward. From the side it would be a lift, and a lift is the
one thing a flat top view cannot draw.

So there is no bounce. What a walking insect actually does with its body is roll
and yaw over the tripod that is planted, and both of those are lateral, and
lateral is on screen in a top view. That is the bobbing: 1.5 css px of sway and
3.2 degrees of yaw, at the gait's own frequency, over feet that do not move.

| | |
|---|---|
| the body | a 29 x 16 lozenge, corners at half its own height |
| the head | a 10.6 x 12 one in front of it with a real gap, so it has a neck at a glance |
| the legs | six, two bones and a knee that bends **away** from the body, which is what an insect knee does and what a mammal knee does not |
| the antennae | two segments each, forward and out, twitching on two periods with a flick out of a seeded schedule |
| ink | **141 x 88 device px** against a 240px head |

**The three x ranges do not overlap and that is the point.** The first cut had
the rest feet at 17, 0.9 and −15.3, which with a stride of 34 puts the front
foot as far back as 7 and the middle foot as far forward as 11 — so on half the
frames two legs on the same side crossed, and a crossed pair reads as a tangle
rather than as a gait. The 4x crop of the bug alone is what showed it. Spread to
19, 0.6 and −18 the three sweeps clear each other by a fraction of a pixel, and
the middle pair reaches six px further out than the other two so it never reads
as one of them.

### The gait is driven by distance, not by time

The one thing a walk cannot do is slide. So the leg phase is `x / stride` rather
than `t / period`:

```js
const ph = x / S + off;           // off is 0 for one tripod, 0.5 for the other
const k = Math.floor(ph);
const xs = (k - off) * S;         // where the body was when this stance began
return { x: xs + rest.x + sweep, y: pathY(xs) + rest.y };
```

A foot is planted at a page position worked out from the distance the body had
covered when the stance began, and it stays at exactly that page position until
the stance ends. **Nothing about it is a function of the frame rate, the speed
profile or the deceleration into the stop**, and the guard measures the worst
movement of a planted foot across the whole walk: **0px**, by construction
rather than by tuning.

Three things fall out of that for free.

**The footstep ticks are read off the picture.** A tick is a stride boundary, so
the sound is a list of distances rather than a list of times — eleven of them —
and as he slows into the stop they spread out from 129ms apart to 152 and then
stop, on their own.

**The gait slows with him**, because the period is the stride over the speed and
the speed is the only thing that changes.

**The path is a function of x rather than of t**, so a foot's planting height is
available at plant time with nothing to invert. It is two sines on wavelengths
that do not divide each other, which is the wobbly line the brief asks for.

The walk itself is written as a **speed** and integrated rather than as an eased
position: constant, then a smoothstep down into nothing. The integral of one
minus a smoothstep over its window is exactly a half, so the profile closes in
one line — `V * (flat + dec/2)` is the distance, which is what fixes `V` at
259.3 px/s rather than a number somebody tuned. 376 page px in 1.62s, which is
3.7 body lengths a second.

When the body stops the phase stops with it, and a leg caught mid swing would
freeze in the air. So over 0.22s after the stop every foot walks to its own
resting position, which is an insect planting its feet rather than a rig being
switched off. It is the one window the no-sliding guard does not read, and it
says so.

### What the two fast things cost at twelve frames

The bug takes about eight strides a second, which at sixty is **7.8 to 9.1
frames to a cycle** and at twelve is a frame and a half. The lunge is 0.10s,
which at twelve is one frame. **Neither can be judged on the preview**, and no
amount of care in this file changes that — it is the preview's own sampling
rather than anything about the animation.

So both are judged on strips of stills a sixtieth apart, written on every run:
twenty four crops of the walk in `demo/out/verify-post15/gait/` and eighteen
full frames of the bite in `demo/out/verify-post15/bite/`. This is the first
thing in `demo/` whose preview pass genuinely cannot answer the questions the
preview exists for, and saying so is cheaper than pretending twelve frames a
second is enough.

### He sits 154px up and 85px in off his own corner, and only 84 of that is the lane

`planMascot` puts a bottom right mascot 24 css px inside the platform safe area,
which leaves 24 px between his ink and the bottom safe line. The bug has to walk
**under** him, inside the safe area, without touching him, and a bug with legs
is 44 css px tall. **That is what the first 84 px of the lift buys.**

The other 70, and the 85 across, are composition: pinned to the corner the frame
above him is dead, and the shot is about him and the thing on the floor rather
than about a corner. At the end of the push he sits about 60% across and 66%
down — off the corner and nowhere near the middle.

**And the camera's centre follows the pair rather than staying where they used
to be**, or the move would have put him dead centre, which is the one thing it
was not for. It takes 20 of the 85 and 34 of the 70. It cannot simply follow him
the whole way: the rig is the stage's own size, so at the push's zoom the centre
lives in 248..292 on x or an edge comes into shot, and 250 is as far left as it
goes. The guard walks it on every frame.

The lane is then derived rather than typed: **the lowest his ink ever gets
before the bite**, walked frame by frame with `headRect`, plus 26 px of
clearance, plus the bug's own reach above its centreline. Change the state list,
the size or the lift and the lane follows — and moving him is exactly what
happened, twice, without a second number being touched. Measured: his ink
bottoms out at 673.95 at 2.00s, the lane sits at 722.05, and **the closest the
bug ever gets to his ink before he goes for it is 28.09 page px, with 0 frames
of overlap**.

The walk follows too, because the bug's stop is the plate's own centre and the
speed is the distance over the time. It is 276 page px at **190 px/s** now
rather than 376 at 259, which is 8 strides instead of 11 and a gait period of
**10.6 to 11.3 frames a cycle at sixty** instead of 7.8 to 9.1. The walk reads
better for it, which was not the point of moving him but is a real dividend.

### The bug walks in through the left margin, and it has to

Entering from a side is what the brief asks for and every side of the frame is
outside the platform safe area, so there is no walk on that reads as a walk on
and also never crosses a safe line. What is guarded instead is the shape of it:
**the ink enters the safe rect once, at 0.417s, and never leaves it again.** Both
halves are latched off the rendered box rather than off a time typed in the
file, and anything after the latch that scores under nought is a real overrun.

### He is inside the camera, and rig-test's mascot is not

`rig-test.mjs` keeps the mascot in screen space. This clip cannot: the brief is a
push in **on the two of them**, and a camera that moved the bug and left the
mascot behind would pull apart the one thing the shot is about.

Which means every clearance here is a **screen** clearance and has to be worked
out rather than measured off the module. `headRect` answers in page space and
knows nothing about a camera or about the bite's transform, so the head's ink is
composed in the clip — the module's card, then the zone transform about the
zone's own centre, then `cameraFrame`'s own two numbers — and checked against
the safe area and the band on every frame.

The camera is one leg, `free` mode, 1.05 to 1.10 on `glide`, 0.60 to 2.30s, on a
centre that moves 12px right and 24px down. It is finished on the frame the
bite's anticipation starts: a camera still pushing under a lunge is two moves at
once and neither of them reads.

No snap, because there is no punchline to hit with one. No shake, because the
only knock in the clip is the glitch, which is a function of the frame index
rather than of time and is meant to jump rather than blur.

**The zoom starts over 1 and stays there, and that is arithmetic rather than
taste.** The rig is exactly the stage's own size, so at z under 1 a border comes
into shot; the drift takes up to 1% off the scale and moves the centre by up to
5 css px on y, and 1.05 carries both with room. `minZoomFor` does not answer this
question — it bounds a shake and there is no shake — so the edges are worked out
on every frame off `cameraFrame`'s own `tx`, `ty` and `z`, and confirmed on 26
rendered samples with `__cam.edges()`.

**The destination was 1.12 and it is 1.10, and the bubble is why.** At 1.12 the
mirrored thought bubble had 13 device px of air off the left safe line, which is
a number that passes a guard and would not survive a font falling back one glyph
wider. At 1.10 it had 83. The mirrored placement is gone — the module's own is
what ships and it clears by **118** — so 1.10 is more room than the bubble needs
now. It stays where it is: a second of push is a second of push, and the number
was never only about the bubble.

### The thought bubble was hand placed three times, and now it is not placed here at all

**This clip owned this bug and this clip stopped owning it.** The placement is
one derivation in `lib/mascot.mjs` now, and `post15.mjs` asks for it by name
and writes nothing about the cluster:

```js
const THOUGHT = 'over';
planMascot({ ..., pos: POS, thought: THOUGHT })
```

The history is worth keeping because it is what the derivation had to answer.

`lib/mascot.mjs` hangs the cluster **beside** the head, off its top right, on a
flex row whose three parts sit 6, 14 and 22 px off one baseline. That is correct
for the corner it was written in: post11's mascot stands bottom left, so a
thought climbing to its right climbs into the frame. It ships as the default and
it still does.

This clip moved it three times and none of them was right.

**Off the right**, which is the module's own, it went 116 css px past the edge
of the screen. That is what a bottom right mascot does to it.

**Mirrored to the left**, four lines of css at the id level, it fitted while he
was in the corner and stopped fitting the moment he moved toward the middle: at
the push the safe area is 364 page px wide, the head and the module's own offset
take 257 of them, and the cluster is 205. There is no side of him it goes beside
any more.

**Above him, with the lifts rewritten as a diagonal** — five lines of css and a
block of arithmetic in `sceneHtml` — put the first dot over the plate's upper
right **shoulder**, seven tenths of a radius across. The line ran sideways out
of the side of his head before it climbed. A thought comes out of the top of a
head, not out of its ear.

**What ships is the module's `thought: 'over'`, and it is one derivation off
`pos`, the way `TURN.bias` is one derivation off `pos`.** It answers three
things and `mascotCss` asks it for all three:

- **the side.** The pill is the far end of the run, so the pill is the part that
  has to land over the middle of the frame rather than over an edge. A head on
  the right thinks to its left, a head on the left thinks to its right, and
  `over-left` / `over-right` name it outright the way an explicit `bias` does.
- **the start.** The plate's own vertical centre line — not the box's, which is
  two grid units wider on every side — one `gap` above the crown. The same
  `gap` the beside placement holds off his flank, because it is the same
  question: how far the first dot sits off the ink.
- **the three lifts.** The row's own dot widths and flex gap fix the horizontal
  run between the two dot centres and on to the pill's spring corner, at 15 and
  26 css px. Put those three points on one line at `BUBBLE.over.angle` and the
  lifts fall out: **0, 15.876 and 34.986**. Nothing to tune, and the module's
  own check measures the angle back off the lifts and gets 50.00° twice.

**The crown it starts from is measured, not the one at rest, and the first
render of the fix is why.** The cluster is a sibling of the card, so it does not
move when he does — which beside him is fine, because a hop slides the head
*past* a dot at its side, and over him is not, because a hop drives the head
*into* a dot above its top. `delighted` lifts him 12.5 grid units, the arrival
curve overshoots it by a tenth and the idle drift adds another: **15 css px of
head through a dot hanging five above the resting crown**, and the small dot
came back half swallowed by white.

So `crownReach` walks the plan's own frames and takes the highest the plate's
top ever gets — **only over the frames a thought is actually up for**, because
holding room for a hop nobody is watching would push the whole cluster off the
top of the frame. It walks at 240Hz, four samples to a frame at sixty, so the
answer does not depend on where a particular pass's frames land. In this clip
the crown reaches **-6.02** in the zone against **3.36** at rest, and the check
that closes it is on the sixty frame grid: the head's closest approach to the
first dot is **5.03 css px against a floor of 5**.

**Every clip that did not ask for this renders the same bytes.** The beside
branch is written as the literal it always was rather than as a default falling
out of the over one, and a plan made before the option existed carries no
`thought` at all and lands there too. Checked rather than claimed: the css, the
markup, the page plan and sixty frames of animation, across three placements and
both themes, all hash identical to the module at the commit before this one.


### The caption band is reserved even though nothing is in it

There are no captions in this clip. The band is reserved anyway, because a band
is a promise about where words can go and a clip that quietly fills it is a clip
that cannot be captioned later. It sits at **292..364 css**, which is where a
caption for this composition would go — the empty upper half — and it is checked
every frame against the head, the bug, the bubble and the wordmark. Nothing
enters it.

### The cut

Three marks, and there is no `neutral` at the top. That is deliberate: before
the first mark every pose channel is at rest and the idle layer is running,
which is `neutral` being held — that state's own mark is `sc` 0.972 to 1, so
arriving at rest is the whole of what it does. A mark for it would cost 1.06s of
the module's own floor and buy a scale up nobody asked for.

```
0.00  up. he is at rest, alive, and the bug is coming through the left edge
0.48  curious, turn held to -0.58 — he has seen it
1.14  the blink, 286ms of it
1.62  the bug stops under him, and his eyes are level again
1.74  neutral, turn back to 0
2.20  both lids down to 0.40, symmetrically
2.30  the rise, 7px over 0.11s
2.51  the lunge lands 93px down and 4px forward, and the head squashes
2.52  the first frame at or after the landing, and the bug is gone under his ink
2.77  he is back up, eyes shut
2.91  chew one, left.  3.21 chew two, right.  3.51 chew three, left
3.76  the satisfied bob, 0.24s
4.16  delighted.  4.18 his eyes are open again
5.26  crunchy is fully up, and it holds to the cut
5.85  the hit, 0.37s of it, and he and the bubble are cut with it
6.73  end
```

**The blink is the seed.** The brief asks for one blink while he watches it, and
no state in this cut carries one there. So it comes off the layer that already
makes blinks: `planMascot`'s idle schedule is generated from the plan's seed, and
the seed is searched for one whose first blink lands inside the `curious` hold.
post13 did the same thing for its slow blink. It is not a new mechanism and it
is not a cheat — an idle blink is the mascot's own blink — and the guard checks
the blink is still where the seed was chosen for.

### Two sounds this clip added to `lib/sfx.mjs`, and it plays one of them

Twenty one now.

**`tick`** is a foot, and it is `key` with the body taken out. That sound is a
plastic cap on a board, so it has a 124 Hz pulse under the noise to stand for
the board; an insect's foot has nothing under it at all — it is a claw touching
a surface and the surface is not resonating. What is left is three milliseconds
of band passed noise and a very short pulse, over inside a thirtieth of a
second, at **-37 dB**, which is the quietest thing in the file.

Its onset is held off the front of the buffer by the length of the fade that is
about to go there. Every other sound in the file swells or has a body under it,
so two milliseconds of taper costs them nothing; this one is three milliseconds
of noise and **is** its own attack, and taking the first two off the front took
**37% of the peak** with them.

**`crunch`** is something being eaten. It is two events struck together like the
coin, for the same reason — one bite is one thing happening to one object: eight
milliseconds of band passed noise for the crunch, and a note falling from `f0`
to `f1` inside its own length, because a mouth closing is a cavity getting
smaller and a cavity getting smaller drops in pitch. That is `sigh`'s physics and
the opposite of `chirp`, which rises because it is a question. **The flutter is
what makes it chewing rather than a bleep** — the note is amplitude modulated at
29 Hz, deep enough to grain it and not deep enough to gate it into a train,
which is the `servo` rule landing in the same place for the same reason.

**And this clip does not play it.** The bite and the three chews had it, one
recipe at two levels — the bite lower, grittier, with almost no flutter and
three decibels down, in its own pass because a per cue level is how a balance
stops living in one table — and they are out. Einz is putting his own sound on
that stretch, and a synthesised placeholder under a real one is two takes of the
same beat fighting each other.

**The recipe stays in the file.** It is a sound the set wanted and the next clip
that eats something will want it, and a voice is cheaper to keep than to write
twice. What ships in this clip is the footsteps, the bubble pop and the glitch,
and the eating is silent — guarded rather than left to drift, because a tick or
a pop creeping into that stretch is exactly the thing that would spoil it.

### The mix, and a clip that is mostly silence

Ten events, no voice and no bed, and one of them — the glitch — is thirteen
decibels over everything else. Off the synth the bus is **-47.7 LUFS** with its
peak at -23.0 dBFS, so -14 LUFS wanted 33.00 dB of lift and the -1.8 dBFS
ceiling plus 1.5 dB of limiting allowed 22.70. **The ceiling won by 10.30 dB**
and the finished bus sits at **-25.5 LUFS**.

That is quiet, and it is the right answer rather than a miss. The only way to
get louder is to allow the limiter past its 1.5 dB and squash the cut, and the
stretch that would have carried the level is deliberately empty: **the eating
layer is Einz's and it goes on top of this**. Leaving it headroom is the whole
point. post12's own note applies either way — the number is reported as a fact
rather than argued with.

### The guards this clip added

Forty eight, all green at 12fps and at 60fps with the shutter open. The ones
that are this clip's rather than inherited:

- **no planted foot moves while he walks**, worst movement across every leg at
  240Hz — 0px
- **no leg is ever asked to be longer than it is**, worst demand 20.85 against a
  reach of 21.6
- **the bug never touches his ink before he goes for it**, closest 28.09 page
  px, 0 frames of overlap
- **the bug is inside the safe area by 0.417s and never leaves it again**
- **the bug is under his ink on the frame it goes**, derived at 0.93 of his own
  ellipse and measured at 0.81 of his rendered circle
- **the bug has not moved between the two frames that containment is measured
  on**, because they are not the same frame and cannot be
- **the bug goes on a frame his head is at the bottom of its lunge**, at twelve
  and at sixty
- **the lunge is a move rather than a cut**, worst one frame step against an
  eighth of the frame
- **the two eyes are the same shape and the same lid** from the frame the bug
  stops to the cut
- **his eyes are shut for the whole chew**, and shut is a line rather than a
  missing feature — 4.6 device px of ink still on the face
- **no mark begins inside the bite or the chew**, which is rig-test's rule about
  a mark inside a grow, in a new place
- **the camera never shows an edge**, worked out on every frame off `tx`, `ty`
  and `z` rather than sampled, because `minZoomFor` bounds a shake and there is
  no shake here
- **his head clears the safe area mapped through the zone and the camera**,
  every frame
- **nothing enters the reserved caption band**, head, bug, bubble and wordmark
- **the only sounds between the bug stopping and the bubble are the bite and the
  three chews**

Two of them are about the harness rather than the picture and both cost a run to
find. **A frame is only captured once per repaint**: two `Page.captureScreenshot`
calls with nothing written between them is a second capture of a frame the
compositor has no reason to produce, and under paused virtual time it does not
produce one — the call blocks forever. And **the vignette is load bearing**: the
`--bug` mode hid it along with the mascot, and with nothing at all animating the
next virtual time budget never expired.

### Outstanding

- **CLOSED: the `crunchy` thought bubble.** It is `lib/mascot.mjs`'s
  `thought: 'over'` now — one derivation off `pos`, the way `TURN.bias` is —
  and this clip writes nothing about the cluster at all. Beside the head stays
  the default, so every clip already in `demo/` renders the same bytes. See the
  section above for the three hand placements it replaces and for the crown
  clearance the first render of the fix found.
- **CLOSED: `tail` on a reverse grow.** `lib/transitions.mjs` reads the fade
  off the window in real time rather than off the shape, so a reverse no longer
  opens on one frame of the new paper. Forward grows are unchanged to the bit
  and `rig-test.mjs` has been re-rendered on the fix. See the section on it.
- **`lib/mascot.mjs` has no symmetric narrowing and no held closed eye.**
  `unimpressed` is the only lid state and it brings brows and a side eye with
  it; a blink is the only thing that closes an eye and it is sixty milliseconds
  long. This clip writes both by hand, one directionally, and it is the second
  clip in a row to want something the state table does not have.
- **No posting pack.** Caption, tweet and tags are undecided.
- **The review is in `demo/out/review-post15.md`**, which is gitignored like
  everything else in there.


## The sixteenth clip — one small change, and a camera that pulls back

`post16.mjs`. 5.70 seconds, vertical, dark only. A client asks for one small
change, then forty seven more.

The mascot alone in the middle of a black frame with one glowing pill beside his
head reading `one small change`. He brightens, agrees, holds still for a second.
Then a bass hit: the camera snaps out, the screen is covered in forty seven
identical pills, and the line at the top changes from `client said one small
change` to `47 small changes later`. His eyes go flat, he blinks once slowly, and
the signal takes him and leaves the work behind. Then it takes that too and puts
the wordmark up.

post15 is the template. What is new is the direction of the move and everything
that fell out of it.

### The punchline is a zoom out, and that inverts the rig

Every camera in `demo/` before this one pushes in, because a push is a close and
a close is what a punchline you can point at wants. This one is the opposite
shape: the joke is not a thing you get nearer to, it is the **amount of it**, and
the only way a frame says "there are forty seven of these" is to stop looking at
one.

`lib/camera.mjs` does the whole move and **nothing in it was touched.** `by` on a
snap is a multiplier, so 0.68 is a snap out for the same reason 1.22 is a snap
in, and the module already allowed it — no clip had ever asked.

**The anticipation is negative, and that is arithmetic rather than a trick.** The
module writes the wind-up as `sz = 1 - anticipate`, so a positive number pulls
back before a push in. The wind-up for a *pull back* is a push in, so the number
is negative and the same three beats land: cram in 3.5% for a tenth of a second,
rip out, let `btk.pop`'s own overshoot go a touch too wide and come back. z 1.50
to 1.02, which opens the frame up by 2.16 in area.

### `__cam.edges()` is the wrong instrument for this clip

post15's camera guard is `minZoomFor` and `__cam.edges()`, and both answer the
same question: the rig is exactly the stage's size, so at z under 1 a border
comes into shot. That is why post15's zoom never leaves 1.

This clip's zoom **does** go under one — 0.970 at the overshoot — and no border
comes into shot, because the thing filling the frame is not the rig, it is the
label field, and the field is laid out bigger than the page on purpose. So
`edges`, which measures `#cam-rig`'s own box and knows nothing about content
hanging outside it, would report a fault on every frame of the reveal and be
wrong about all of them. `minZoomFor` says 1.0333 and the plan goes under it,
correctly.

What replaces both is a measurement of the field itself. `__p16.fieldBox()` reads
the rendered envelope of every pill on the screen and the guard is that the
envelope reaches past the frame on every frame the field is up. **Three sides,
not four:** the top of this frame is the caption band's and the field
deliberately stops under it, so that side is guarded the other way round — there
has to be clear black up there.

### Forty seven does not fit at the module's own copy floor, and the file says so

The brief allowed fewer and asked for the number. The number is **forty seven, at
a 25 device px cap**, which is under `BUBBLE.minCap`'s 32 — the floor
`lib/mascot.mjs` puts on the one piece of copy in its layer. It is the only place
in the file a house floor is crossed and it is crossed with an argument.

The copy is read **once, big**: the hero pill is a 32.2px cap over his head for
two and a half seconds before the field exists. So the field is recognition
rather than reading, and a reader decoding one of forty seven identical pills has
already been given the string. The floor exists for a caption seen for the first
time; this is the same words again.

`fieldFit` is a solve rather than a guess. The core rect is the frame's own
tightest visible window minus the reserved caption band, the grid is four columns
by twelve rows, and the type size is the largest whose turned pill still tiles
that grid at the allowed overlap — bisected, because both constraints are affine
in the size. **The alternatives are printed on every run** so the trade is
visible rather than asserted: 32 labels would be a 27.6px cap and 24 would be
37px, against 47 at 25.

**The copy is two lines because of the same solve.** One line of `one small
change` is 850 units wide at font size 100 against a pill 217 tall, and a 9:1
ribbon does not tile a rectangle three times as tall as it is wide. Broken over
two lines the pill is 1.8:1 and the same forty seven fit at a third again the
type size.

### The caption swap waits for the frame to settle, and it is worth 98 page px

A strip of the frame is a different page rectangle at every zoom, so the band's
page extent is a **union walked over every frame a caption is up for**, mapped
back through `cameraFrame`. Nothing about it is typed.

The first cut swapped the two lines on the hit frame, which meant a caption was
up during the wind-up, when the camera is still pushed in at 1.55. That union
reaches down to page 273 and the field has to start under it. Held off 0.20s,
until the frame has very nearly settled, the union stops at 175 — **98 page px of
field height back, and the type went from a 22.4px cap to a 25.**

It is also the better beat. The hit knocks the words off, the frame rips out, and
the new words land as it settles. Two hundred milliseconds with no caption, under
a bass hit and a shake and forty seven labels arriving, is not a gap anybody
sees. What it is not is a cross fade in the middle of a bass hit, which is two
things politely taking turns.

`planMascot` is handed `band: null` for the same reason the band is not a page
rectangle: the module checks a bubble against page space and this clip has no
module bubble in it, so handing it a screen band would be handing it the wrong
units.

### The field is two populations and only one of them is counted

`btk.pop` carries the snap past its mark and back, and the shake moves the whole
picture nine css px on top of that, so the widest frame of the reveal is wider
than the frame it settles on. A field laid out to the resting frame would open a
strip with no labels in it for the three frames of the overshoot.

So the grid is extended outward until the pills reach past the widest frame the
plan can produce — left, right and down, **not up** — and every label is
classified rather than placed by hand. **Core** labels are the forty seven fully
inside the frame on every frame after the camera stops; those are what the count
is about and what the legibility floor is measured on. **Bleed** labels are the
ring outside them, present so the overshoot and the shake never open an empty
edge, and neither counted nor guarded for legibility. Both numbers are printed.

**Not up, and a rendered frame said so twice.** The first cut ran the grid into
the strip above the words, which is what the widest frame wants covered. That
strip is outside the platform safe area, so at rest it holds one row of pills
clipped by the top of the picture; and during the wind-up the camera is still
pushed in and the same row is off frame entirely, so it arrives out of nowhere a
tenth of a second after the hit. The top of this frame belongs to the caption
band, and black with one line of words in it is what a header is.

### The frame stops on the snap, not on the knock, and 22 css px is the difference

`SHAKE_END` and `SNAP_END` are two constants because they are two moments. The
knock is over at 3.28 and the camera is over at 3.34, and it is the second one
the field is sized against: between them the zoom is still under its resting
value and the picture is still wider than it ends up. Sized off the knock, the
"tightest frame" came out 546 css px wide against a resting frame of 524, and
**the core rect it sized was wider than the frame it is supposed to fit inside.**

The same 3.34 is what fixes `unimpressed`'s mark at 3.40. A state change under a
camera that is still pulling back is two moves at once and neither of them reads,
and both ends of that are guarded so the number cannot drift back.

### The zoom window silently clamped the start, and now it cannot

`resolveCamera` runs the start through `fitTarget`, which **clamps it to the
plan's own zoom window and says nothing** — the `clamped` list it keeps is about
legs. At a ceiling of 1.40 a start of 1.50 was quietly rendered at 1.40, which
put the resting zoom at 0.95 instead of 1.02 and sized the whole field against a
frame 42 css px wider than the one that ships. Nothing failed; the numbers were
just wrong.

The window is 0.85 to 1.60 now, and the guard re-reads `cam.start.z` off the
resolved plan and compares the leg zoom times the snap against the destination
that was asked for. That is the general lesson rather than this clip's: **a
number a library may adjust is a number to read back.**

### The snap is a move and not a cut, and the flat ceiling could not tell

post15's guard here is a flat ceiling — an eighth of the frame in one frame — and
it is right for a camera that only ever glides. This one snaps, and a snap out
across half the frame's scale in 0.30s moves the transform 87 css px on its
fastest frame, which is 16% of the frame width and is what the brief asked for. A
ceiling written for a glide fails it for being a snap.

So the test is `lib/camera.mjs`'s own, the one `shakeEnv` is proved with: sample
four times as densely and the worst one frame step must come down. Measured, 86.7
px at 60Hz against 22.9 at 240Hz, **a ratio of 0.264 where a held signal reports
1.000.** That is the difference between a snap and a jump, and it is also exactly
what decides whether `--blur` smears it correctly. The flat ceiling stays as a
backstop, at a quarter of the frame.

### Some of them are in front of him, and which ones is derived

The brief asks for labels behind him and labels over him. That is two wrappers at
two z-indexes inside the rig and one rule: **a label in front may cover his plate
and may not cover his face.** His eyes go flat and he blinks once slowly, and a
pill over either of those is the performance deleted.

There is no share and no coin flip in it. **Front and back is only a visible
difference for a label that reaches him at all**, so those are the front layer
and every other label is behind him; of the ones that reach him, any whose box
ever touches his eye or brow ink goes behind him instead. Six reach him, three
are in front, three went behind because of the face rule.

The first cut used his ink plus the whole glow reach as the window that decides
it, and the glow reaches sixty css px: twenty two of the forty seven ended up in
the front layer, a third of the field drawn in front of a head none of them
touch. It is the ink plus fourteen now, which is a quarter of a pill's height.

Both windows are composed here on the module's own numbers — the grid geometry,
then the card's rotate and scale about the zone's centre — and walked over every
frame the field is up rather than taken at rest, because `unimpressed` sinks him
and drifts him away while the idle layer never stops.

### How much of each pill you can see is a measurement, and it picks the seed

Forty seven identical pills overlapping is the brief. A pill covered so far that
it stops reading as a pill is what would break it. So the occlusion is measured:
the core rect is rasterised at two css px, every pill is painted in the order the
page paints it — back layer, then his plate, then the front layer — and each core
pill's own share of surviving cells is the number.

That number picks the seed. **The layout's seed is searched the way the blink's
is**, over five hundred layouts, keeping the one whose worst covered pill shows
the most of itself. It comes back at 65% worst and 91% mean — and five hundred
returns the same answer a hundred and forty did, which is worth knowing: that is
the grid's own ceiling at this overlap rather than a seed nobody has found yet.

The lever that moves it is `overlapY`, and it was swept on rendered frames rather
than chosen. At 18% the type solves a whole device pixel bigger and the ink
covers 100% of the core rect, and the worst placed pill had the bottom half of
its second line under the pill below it. At 14% the type is a 25px cap, the ink
covers 92%, and the mean pill shows 91% of itself. 10% was also measured — 24px,
85% — and no denser a read for it.

### The field crosses the platform safe area on purpose

The house checklist says nothing we draw may sit inside the platform margins, and
it is the right rule for copy. **The field is not copy, it is a texture**, and it
is post15's argument about the bug walking in through the left margin in a new
place: every side of the frame is outside the safe area, so there is no field
that covers the frame and also never crosses a safe line, and a field pulled
inside the margins is not a covered screen, it is a rectangle of labels floating
in a black border.

What the rule protects is the copy that has to be read, and all of that is inside
and guarded separately: the caption, the hero pill and the end card. **19 of the
47 are fully inside the safe area** and that number is in the report, so the
decision is visible rather than silent.

### The pill is the module's pill at another size, plus a glow

Drawn here rather than by `lib/mascot.mjs`, because the brief is a rounded pill
with the bubble's own outline **standing alone** — no dots climbing off his head
to it. So it is this file's element in the module's own three tokens: the page
colour as the fill, the site's `--bub` as the outline, the face colour as the
ink. The padding and the corner are in em, so one font size sets the whole thing
and `BUBBLE`'s own 22 and 12 against a 26px size are 0.846em and 0.462em.

One thing is added that the module's bubble deliberately does not have: **a
glow.** `lib/mascot.mjs` keeps its bubble outside the glow layers on purpose,
because a thought is a sibling of the head rather than a part of it. Here the
labels are the picture, and the picture is lit. It is two box shadows and two
text shadows rather than a filter: a css filter on seventy seven of these would
blur seventy seven surfaces on every frame of the clip.

**The hero pill's gap is off his ink rather than off his light, and that is what
makes the push in possible at all.** A pill held clear of the whole sixty pixel
halo needs the head's own diameter again of empty frame above it, which at any
real start zoom is not there. The module's own bubble sits five css px off the
plate — it is a sibling of the card, not a thing keeping its distance from it —
so twenty two off the ink is generous by the house's own measure, and it puts the
pill in the outer glow, which is where a lit label on a lit head belongs.

`HEAD_DROP` is what bounds the start zoom: how far he would have to sit under the
middle of the safe band for the pill to fit between the band and his crown. At
z 1.50 it comes out at **nothing**, and it stays in the file for being zero,
because push in further and it goes positive and says by how much.

### Five sounds, no new recipes, and a gap left on purpose

Nothing is placed by hand and nothing was written for this clip.

| at | sound | from |
|---|---|---|
| 2.02s | `chirp`, 640 to 940 Hz | the first nod bottoming out, off `agreeing`'s own mark |
| 2.94s | `popDeep`, 78 to 42 Hz over 0.34s | the hit, on the frame the snap begins |
| 4.33s | `chirp`, 430 to 372 Hz | the middle of the slow blink's shut, off the idle schedule |
| 4.70s | `glitch` | the first fault, and he goes |
| 5.04s | `glitch`, shorter and lower | the second fault, and the wordmark arrives |

**The two bleeps are the same voice pointed two ways**, which is the whole design
of the sad one. The brief asked for flat and sad, so it is `chirp` with the glide
taken nearly out of it and pointed down: 430 to 372 hertz, a whole tone, over a
glide that does not finish inside the note. `annoyed` was the other candidate and
it is two notes, which is two events on a beat the brief gives one to; `sigh` is
breath rather than a bleep.

`mascotCues(plan)` is called and **declined**, and the report says so rather than
leaving it unsaid. It offers a `ding` on the agreement beat, and `ding` means yes
everywhere in `demo/` and would be a second sound on a beat the brief gives one
bleep.

**There is 0.91s with nothing in it at all, from 3.36s to 4.27s, and it is
guarded.** Einz puts the trending sound on in the app, and the place a track's
own drop lands is immediately after a bass hit. It is also, not coincidentally,
the stretch where the picture is holding still.

### The two faults, and why the first one has no tear in it

post12's ending with the build up taken off, twice. The first takes him and
leaves the field, which is the joke's last line: the work outlives the person
doing it. The second takes the field and puts the wordmark up.

`.tear` copies the wordmark into its bands, and **on the first fault there is
nothing to copy**: the wordmark is not born yet, the field is seventy seven
elements out of a grid and the mascot is one dom subtree driven by two modules'
runtimes. So the first fault's bands are dropouts rather than tears — a strip of
a screen covered in copy going flat black, which is what a picture losing a line
of itself looks like, and the more honest of the two anyway. The second fault's
bands carry the wordmark, because by then the wordmark is all there is.

The wordmark is born on the **frame** the field is cut rather than at the time,
which is post13's correction: a cut time that rounds down would put an empty
frame between the two.

### What the review pass changed

`skills/video-review` found three things and one of them was a real fault.

**The hold after the camera stopped was 1.64s.** The first fault was at 4.98 and
between the camera stopping at 3.34 and anything happening there was the drift,
his sink into `unimpressed` and one blink, over a completely static field — a
quarter of a six second clip on one frame. `GLA.at` is 4.70 now and `GLB.at` and
`SECONDS` follow it, so the clip runs 5.70 instead of 5.98. The blink's own seed
search moved with the window and came back with a **slower** blink than it had,
361ms against 356, beginning at 4.19 and shut across 4.33 — so it ends about
0.18s before the fault rather than 0.64s before it. The wall still gets 2.10s to be read.

The other two are decisions rather than faults and both are written up above: the
hero pill reads as above his head rather than beside it, which is the only
placement the start zoom leaves room for, and a few pills have their second line
clipped by the pill below, which is the overlap the wall is made of, bounded and
measured.

### The guards this clip added

65 of them, and the ones worth naming:

- **the count**, and the floor it is held to. 47 core labels fully inside the
  frame on every frame after the camera stops, at a cap over this clip's own
  stated 24px floor, with `BUBBLE.minCap` named in the message so the exception
  cannot be read as an oversight.
- **the coverage and the occlusion.** The ink covers at least 85% of the core
  rect, the worst covered core label shows at least 62% of itself and the mean at
  least 85%.
- **the field covers the three open sides** on every rendered sample, and stops
  under the band on the fourth.
- **no label of the seventy seven enters the caption band** on any frame a
  caption is up for, and **no label in front of him ever covers his eyes or
  brows**, both walked frame by frame.
- **the reveal is one frame**: nothing at the frame before, all forty seven at
  the frame itself, the hero pill cut on it, the caption cut on it, and the new
  caption landing 0.20s later — checked at both rates.
- **the zoom window did not quietly clamp the start**, and the snap lands where
  it was aimed.
- **the snap is a move rather than a cut**, by the density test rather than by a
  ceiling.
- **the frame stops on the snap rather than on the knock**, which is what the
  field is sized against.
- **exactly one idle blink in the flat beat**, and it is a slow one.
- **19 of the 47 are inside the platform safe area** and the rest cross it
  deliberately — a number rather than a silence.

### Outstanding

- The count is one constant. If 25 device px reads too small on a phone,
  `FIELD.n` at 32 gives 27.6 and at 24 gives 37, and everything else follows on
  its own.
- The trending sound. The gap is measured and guarded and it is Einz's to fill.

## The seventeenth clip — one line, and everything cut from it

`post17.mjs` renders 7.41 seconds, vertical, dark only, out to
`demo/out/post17-dark-1080x1920.mp4`.

A chat panel fades in on an empty black frame and types itself
`message for the next generation?` while the voice reads it. The panel slides
120px down out of the way, a hard fault hands the mascot the frame above it, he
takes a beat and one slow blink, and thinks `don't come` — then winks. The
second fault takes the lot and puts the wordmark up.

post16 is the template for the shape of the file and post14 for the panel and
the read. Two things here are new: **the whole clock is cut from one spoken
line**, and **`lib/mascot.mjs`'s `over` thought placement is used by a clip for
the first time**.

### The read is the typing, word for word

The brief asks for the question to type itself with key ticks and for the voice
to read it as it types. Those are two ways of describing one event, so they are
built as one: `typePlan` is handed the voice's own word list and lays each word's
characters across **that word's spoken span**. The letters of `generation` appear
while `generation` is being said, and the space in front of a word lands a third
of the way into the silence before it.

That is not a flourish, it is what fixes the pace. Thirty two characters spread
evenly across a 1.49s read would be a constant 21.4 a second, which is a field
being filled by a machine. Cut to the words it is fast inside a word and still
between them, which is what typing sounds like and, more to the point, is what
the ear is already hearing. **The tokens are matched to the engine's own words
rather than assumed to line up**, and a mismatch is a throw: a typing pass that
quietly fell out of step with the read would look like a timing choice rather
than like a bug.

**The whole film hangs off it.** The read's sound lands on `VOICE_AT` and every
number after that is derived — the typing ends when the last word does, the panel
slides a beat later, the fault is a beat after the panel lands, he is born on the
fault, the thought hangs off his second mark, and the film ends a held card after
the thought is taken. Nothing downstream of the voice is typed, so a slower read
moves the entire film with it.

The rate is the voice module's own. `calm` is en-US-AndrewNeural at -8%, already
under the neural default because the neural default is faster than a person
reading a short line to camera, and the brief asks for a natural pace. There is
no per-clip override on it at all.

### 21.4 characters a second is fast, and it is the honest consequence

It is three times post14's 7.1 and twice a quick human typist. It is written down
rather than hidden because it is the one place the design costs something: it
reads as *text arriving* rather than as *a person typing*. The lever, if that
ever matters more than the sync, is the take's rate — `-25%` stretches the words
to about 1.8s and brings it to 17.5 — and it costs about 0.3s, which puts the
film over the brief's seven second ceiling. It was not taken.

### The thought is the module's, over the crown, and it is the first clip to ask

`lib/mascot.mjs` grew `thought: 'over'` after post15 hand placed a bubble three
times, and nothing had asked for it since. This clip asks outright as
`over-right` rather than letting `over` derive the side, because what `over`
derives it from is which corner he is standing in and he is standing in neither.

**The hold is 0.90s of the module's and 0.50s of this file's, and the join is
measured.** `bubbleAt` computes `holdFor = max(0.42, min(BUBBLE.hold, room))`
and `BUBBLE.hold` is 0.90, so a single bubble cannot be held longer than that
from outside the module — and `bubbles: [...]`, the other spelling, runs the
quick profile and caps at 0.30, which is worse. Lib is untouched, so 0.90 is
what the plan can be asked for.

The extra half second is taken **without touching a number the module owns.**
From `BUB.leaving` to the cut this file hands the page the module's own last
fully up bubble frame again — read once, a ten thousandth before its own hold
ends, so it is the pill at rest rather than the first frame of an exit — and
lets everything else on the face run on real time. That is not a freeze and it
is not a second animation: during its own hold the module holds `o` and `sc` at
exactly those values and nothing else, so the extra frames are the same still
pill for the same reason the first 0.90s are. `bubbleTime` is the one function
that does it, and it is proved twice — the numbers this file hands the page are
checked at full size and full opacity on all 84 frames, and the **rendered** pill
is measured either side of the join and does not move by a hundredth of a css
pixel.

The fault still lands on the frame the pill would begin to leave, so the thought
is taken at full size rather than politely shrinking first. Fully up is **1.40s**,
first dot to cut is 1.88s, and the pill itself is on the screen for 1.74 of that.

### He is alive under it, and it is two layers this file composes

A face holding one expression for a second and a half with nothing moving on it
is a still frame with a pill over it, and 0.90s of that was already the thin
part of the first cut. The module's own idle over this stretch moves the card
1.7 css px sideways, 1.5 up and down and a third of a degree, which is
technically not frozen and reads as held.

Both layers are **composed on top of `mascotFrame`'s own output** rather than
written into the plan, because there is no flat and calm state that tilts and
there is no wink in the state table. `card` is the seam: the module's own words
for it are "what the head is actually drawn with", and it is what `headRect` and
every clearance downstream read — so adding there adds to the head that is
measured as well as to the one that is painted.

**The alive layer** is a tilt to 2.0 degrees, a drift of 3.0 css px across and
2.6 down, and a breath to x0.988, on four incommensurate periods so nothing in
it is ever back where it was. It ramps in over 0.45s off the calm curve, so it
grows out of his arrival rather than switching on.

**Two of its three channels are one sided, and the cluster is why.**
`crownReach` walked the highest his crown gets over the bubble's own window and
hung the dots five px off that, before any of this existed — so a move that
raised the crown would spend a gap the module already paid for. The drift only
ever goes down and the breath only ever shrinks, both written as `(1 - cos)/2`
so they start at rest and never change sign, which makes the clearance true by
construction rather than by luck. The guard walks it anyway: the crown reaches
3.25 in the zone against the 2.37 the module measured, and the half second of
extra hold is outside the window it walked, which is exactly why that guard is
here.

**The tilt is free either way**, because the plate is a circle and `headRect`
says so: at radius 0.5 the axis aligned box of a rotated ellipse is the ellipse,
so a rotation changes nothing about the head's extent. The whole read of it is
the eye line, which is the only thing on this face that has an angle — two
degrees puts about three device px between the two eyes' heights and it is the
difference between a head and a sticker.

### The wink, which is one channel over one window

The near eye's lid, driven to shut and back on the module's own two lid curves —
`btk.shut` and `btk.open`, written here as the beziers they are in
`mascotEases`, because a lid that closes evenly reads as a shutter and inventing
a curve for this would be inventing the one thing the module already got right.

**The right eye**, which is the side the thought is on, so the closed eye and
the answer are 90 device px apart rather than 190 and the read is one glance
rather than two. It lands 0.18s after the pill does: late enough that the two
are not one event, early enough that it is still an answer.

**The hold at the bottom is what separates a wink from a blink.** The module's
own blinks hold for 30 to 60 thousandths; this holds for 150, which is long
enough to be a decision. 110ms to shut, 150 held, 190 to open — it opens slower
than it shuts, which is the module's rule and the reason `open` is the longer
curve.

**The seed carries one more constraint because of it.** A blink under a wink is
both eyes shutting and the joke is gone, so `pickSeed` refuses any schedule with
an idle blink within `WINK.clear` of the window — 0.18s either side. That is a
search constraint rather than a guard on one seed, because the schedule is the
seed's and there is no other lever on it. The seed moved from 3610 to 390 and
the beat's slow blink came back at 360ms.

**And a rendered frame corrected how it is measured.** The first cut read the
two eyes off `getBoundingClientRect` and reported the open eye as 92% open on
every frame of the wink. That is not the lid, it is the tilt: a client rect is
the axis aligned box of a turned shape, so at two degrees a 13 by 4.4 iris
reports a box a tenth taller than itself and the lid's bottom edge lands a
quarter of a unit low with it. It is `headRect`'s own lesson in a second place.
`getBBox` is the untransformed geometry and the lid's `translate` is the whole
blink, so the share is exact and the rotation cannot touch it; the device px
come off the plate's client rect, which is honest because a circle does not get
wider when you turn it.

Measured that way: at the shut the winking eye shows **0 device px of itself and
the other shows 21.1**, and the open one never dips below its full height on any
frame of the window.

### He is 26 css px left of centre, and the pill is why

The cluster hangs to one side of the crown: the module puts the first dot on the
plate's own centre line and the pill's near corner 26 css px along the row from
it, so **a pill is never centred over a head and cannot be**. `don't come`
measures 190.7 css at `BUBBLE.size` and its spring carries it to 196.4, which off
a dead centre head puts its right edge at 492.4 against a safe line at 470.

**No head size fixes it.** `crownX` scales with the head; the dots, the gaps and
the pill do not, so the pill's offset from the frame's middle is the same 26px at
any size. So it is either a mascot 53 device px off centre or a punchline 45
device px inside the platform's right button column, and this file takes the
first. `OFF_X` is derived from the pill's own measured width and its own worst
spring frame — walked at 240Hz, the rate `crownReach` is walked at, because
`btk.pop` carries the spring past its mark — and it is zero if it ever stops
being needed. It comes out at 26.42, which is 4.9% of the frame's width.

It reads as deliberate once the thought is up, because the head and the pill
balance about the middle. In the 1.2s before it arrives he reads as slightly left
of a centred panel, and that is the cost. **The number is printed on every run
and the guard re-measures the rendered cluster on every frame it is up**, so the
trade is visible rather than asserted.

### The panel is post14's, drawn dark

The same picture of the box a person types into, in this file's own css, with the
three changes the brief asks for: it is centred rather than sitting under a mark,
the model name is gone, and the right of the controls row carries a mic and a
waveform instead. No logo in it and nothing lifted off anybody's product.

post14 drew it as `--fg` on `--bg`, which is a dark box on a white page. This
page is already near black, so the panel is its own two tokens: a ground a little
above the page (`#12151b`) and a hairline outline. That is what an input looks
like on a dark app, and it is the only way a dark box reads on a dark frame. The
type is the page's ink with the file's own soft glow on it, so the panel belongs
to the same light as the head and the wordmark rather than sitting on the frame
as a cut out.

**The type is 26 css px**, which is post14's 23 grown for the middle of the
frame: it measures 38 device px of cap against the 32 floor and the question
wraps to exactly two lines in the panel's own box. Both are measured on the
rendered face on every run.

**The panel's height is worked out of its own parts** rather than typed: two
lines of type under the top padding, the controls row above the bottom padding,
and the 18 css px left between them is guarded against a floor of 12. The text
block is top anchored and the row is bottom anchored, so a line growing from
nothing to two lines cannot move the plus or the icons under it — which is what a
real input does and is also what stops the frame twitching every fourth
character.

The mic is a capsule, an open arc and a stem; the waveform is five rounded bars.
Neither is in a ring, because one framed icon beside one bare one reads as a
mistake. The caret is inline, so it travels with the text through the wrap
without anything measuring where the text got to, and the placeholder is inset
five px behind it — post14's rendered frame paid for that one.

### There is no camera

post15 and post16 are both built on `lib/camera.mjs` and this one is not, because
nothing in the brief moves the frame. The panel slides 120px on its own transform
on the calm in-out, which is an element moving inside a still frame — the
opposite of a camera move, and the right one here, because what slides is the
thing making room and the room is what he arrives into. A spring on it would be
the panel having an opinion.

It lands at 2.61 and the fault is at 2.69, so nothing is still moving when he
arrives, and both ends of that are guarded. Its worst one frame step is 8.3 css
px, well under a twelfth of the frame, so it is a move rather than a cut and the
shutter smears it.

### Two neutral marks, because the beat needs one

Both marks are `neutral`: he is alive and flat and he never smiles, which is the
brief. The second one exists because the brief asks for a beat and a slow blink
between him arriving and him thinking, and **a single `bubble` on a mark is
placed by the module at `settled + 0.12`** — so a mark carrying the thought
cannot also carry the beat in front of it. The second `neutral` is a breath
rather than a state change: the module's entrance settles the head onto rest from
2.8% under it and brings the eyes down off a hair of widening, which is what a
head does before it thinks.

`M_GAP` is 1.10 against the module's own floor of 1.06 for `neutral` — its
entrance, a hold and its exit.

**The slow blink comes off the idle layer**, post13's move and post16's: the seed
is searched over six thousand for one that puts exactly one blink inside the beat
and the slowest one wins, and now also for one that keeps the idle layer clear of
the wink. It came back at 360ms on seed 390. **The whole blink has to fit, not
just its start** — the first cut searched on the blink's own `t` and found one
whose lid was still coming back up as the first dot climbed, and a blink and a
thought on the same frames are two things happening and neither of them reads.

### The empty opening is in the signature, because the vignette is

The film opens on 0.20s of black with nothing on it but the vignette, and the
vignette is a css animation the render does not write. So the liveness signature
would have been blind to the only layer moving in it, and would have reported a
clean sweep over a run of frames it could not see.

Two things fix it. The signature is **gated by what is actually drawn** — the
mascot's twenty channels only count on frames he is on — and the vignette gets a
brightness this file writes, `phosphor` on two incommensurate periods, so node
knows a number for it. 0 repeats in 83 frames at twelve and in 415 at sixty.

### The sound, and no new recipes

| at | sound | from |
|---|---|---|
| 0.51..2.01s | 8 x `key` | the typing's own list, one per four characters plus the two ends |
| 2.17s | `popDeep`, 84 to 46 Hz over 0.24s | the frame the panel starts moving |
| 2.69s | `glitch` | the first fault, and he arrives |
| 4.51s | `pop` | `mascotCues`, and it is **taken** |
| 6.25s | `glitch`, shorter and lower | the second fault, and the wordmark arrives |

The wink has no sound on it. The brief named five and none of them is a wink,
and the gesture is 90 device px of one eye — a cue on it would be louder than
the thing it is a cue for. What that leaves is 1.7s from the pop on the pill to
the second fault with nothing in the bus at all, which is where a track's own
line would go.

The thud is deliberately not post16's impact: 84 to 46 hertz over a quarter of a
second is a box being pushed out of the way rather than a bass hit.

`mascotCues(plan)` is **accepted** here where post16 declined it. It offers one
cue, a `pop`, and the module puts it on the pill rather than on the first dot,
because the dots are the anticipation and the pill is the arrival and a sound on
the wind-up is early for the thing it is the sound of. There is no `ding` on
offer, because there is no agreement beat.

The mix is post11's and post14's rig: the read on top, the bus ducked to 0.60
while a word is being said, and a loudness loop that keeps its best pass rather
than its last. It settles at 8.40 dB of lift, -15.4 LUFS and 4.32 dB of gain
reduction against a 5 dB allowance — the ceiling winning over the target again,
which is post12's argument and post14's. The bus stays 33 dB under the read at
its worst. **No music, by design rather than by omission.**

### The guards this clip added

88 of them, and the ones worth naming:

- **every character lands inside its own word's spoken span**, re-derived on the
  guard's side rather than trusted, and the typing never goes backwards.
- **the typing is the read at both ends**, to the thousandth, and the read's own
  sound starts on `VOICE_AT` measured off the waveform rather than off the word
  list.
- **the question wraps to exactly two lines at 38 device px of cap**, and the
  panel's two blocks leave 18 css px of air with a floor of 12 — both measured on
  the rendered face.
- **the panel is inside the safe area at both its positions**, on every sampled
  frame, and his ink never touches it.
- **the slide is exactly 120 css px**, it lands before the fault, and it is a
  move rather than a cut.
- **he is born on the fault's own frame**, and that frame is a torn one.
- **the film was sized off the module's bubble profile and the plan agrees** —
  `in` and `leaving` compared against the arithmetic that decided `SECONDS`.
- **the thought is fully up for `BUBBLE.hold` plus `HOLD_EXTRA`**, the fault
  takes it on the frame it would begin to leave, the pill is at full size and
  full opacity on all 84 frames of it, and the **rendered** pill does not move
  across the join between the module's half of the hold and this file's.
- **the alive layer is a drift rather than a jitter and never stands still** —
  0.14 css px in a frame at its fastest, 0 held frames — and **his crown never
  rises into the cluster**, which is what the one sided drift and the shrink only
  breath are for.
- **the wink is a wink**: the winking eye reaches a full shut, the other eye is
  exactly what the module said on every frame of it and never dips below its own
  full height, no idle blink comes within 0.18s, and both eyes are open a frame
  either side. Measured in svg user units rather than off client rects, because
  the tilt inflates a client rect and read as 92% on the first pass.
- **the whole cluster, dots and all, clears the safe area on every frame it is
  up**, and the pill's own right edge — the thing `OFF_X` was computed from — is
  re-measured at its worst spring frame.
- **exactly one idle blink in the beat, whole**, and exactly one more under the
  thought so the hold is not a still frame.
- **the second fault takes him and the panel on one frame**, and the wordmark is
  born on that frame rather than at that time.

### What the review pass found

Three things on the first cut, and none of them a fault. The 4.9% off centre and
the 21.4 characters a second are both written up above and both are honest
consequences of the brief. The third was the hold, at 0.90s against the two
seconds asked for, and **the second cut is the answer to it**: `HOLD_EXTRA` puts
the film at 7.41s, and the alive layer and the wink are what a second and a half
of held thought needed to not be a still frame. The review is
`demo/out/review-post17.md`, which is gitignored with the rest of `demo/out/`
and describes the first cut.

### Outstanding

- **Holding the answer longer is one constant.** `HOLD_EXTRA` is 0.50 and the
  film follows it: the fault, the end card and `SECONDS` are all derived off it,
  so any number in there costs exactly itself and nothing else has to move.
- **The centring is Einz's call.** `PILL_AIR` and `OFF_X` are two constants; dead
  centre puts the punchline 45 device px inside the right margin.
- **The wink is silent, and that is a gap rather than a decision.** The brief
  named five sounds and none of them is on it. There is 1.7s between the pop on
  the pill and the second fault with nothing in the bus at all, which is where a
  trending sound would sit if this clip gets one.
- **The clip has no posting pack.** Caption, tweet and three tags per platform
  are all undecided.

## The eighteenth clip — the future is here

`post18.mjs` renders 12.63 seconds, vertical, **light only**, out to
`demo/out/post18-light-1080x1920.mp4`. Somebody else's model ships, the effort
slider walks to Max, a chat panel says the thing the clip is actually about, and
the mark comes back bigger with a two word thought over a small robot's head.

    node post18.mjs                      1080x1920, 60fps, light
    DEMO_FPS=12 node post18.mjs          the fast preview pass
    node post18.mjs --blur               60fps with the shutter open
    node post18.mjs --plan               every number printed, nothing rendered
    node post18.mjs --stills             the readable frames only, no video
    node post18.mjs --encode-only        re-encode from kept frames

**This is the third cut and the second shape.** The first one ran 23.11s
and carried three scenes this one does not have at all: the question that asked
*how*, the four windows that did the work, and the cursor that took the computer
off him. What is left is five beats — the mark arrives, the slider goes to Max,
the panel says the thing, the mark comes back and he thinks two words, and the
signal tears. post14 is still the template for the shape of the file and post17
for the typing cut to the read.

### The clock, and it is eleven rather than ten

The brief asks for nine to ten seconds. **The voice only pass ran first** — the
brief asked for it and it is worth keeping as a habit — and measured the three
lines at three deliveries each:

| line | -8% | -4% | 0% |
| --- | --- | --- | --- |
| chatgpt 6 astra is here, and it is a big one | 2.94s | 2.81s | 2.71s |
| not using ai for your business yet? your competitor already does | 4.04s | 3.88s | 3.71s |
| the future is here | 0.95s | 0.92s | 0.88s |

The shipped deliveries are 0% / -4% / 0% with the pitch up on the two outer
lines, which is post11's rule: **the shape carries the register, not the speed.**
That is 7.46s of sound. On top of it the film carries a slider scene with no
voice on it at all (1.54s), a thought the brief asks to hold about a second and a
half (1.38s, which is the module's own 0.48 in plus 0.90 hold, not a number this
file typed) and an end card (0.82s).

It lands at 11.40. The two cuts that would take it under ten are printed at the
bottom of every run and neither is free: dropping `and it is a big one` off the
first line buys 0.9s, and dropping the slider buys 1.54s and a whole beat.

### The captions are set in Manrope, and the fit had to be redone

The brief asked for a cleaner, more modern sans with a better weight than the
one the float style ships with. **Manrope ExtraBold**: a geometric grotesque with
a tall x height and a much heavier 800 than Space Grotesk has at 700, which is
what a burned in caption at 30 css px on a phone wants. It measures 44 device px
of cap.

`lib/` is untouched, so the face is one rule in this file over the module's — and
that is only half the job. **`lib/captions.mjs` fits the float style by measuring
its cards in Space Grotesk at 700**, which is the face it sets them in and is not
the face this clip asks for. A heavier face measured against a lighter one is a
card that overflows its own box.

So `capRefit` measures the cards **as they render**, at a probe size, and solves
the size again from the widest of them, dividing by the same `maxScale` the
module divides by because a word springs about its own centre. The module fitted
30.0 css px against its own face; the refit lands 30.4 against Manrope's, off
`your competitor already`. Three families now arrive in the one request —
Michroma, Manrope 800 and Space Grotesk 400 and 500 — and Space Grotesk's 700 is
gone with the module's caption face, so the body face is back inside the two
weights the brand allows it.

### The panel carries blue, and it is the only place in the brand that does

The brief asks for a blinking blue caret, a blue gauge arc and a round blue
button with a white waveform. Green is the only accent this brand owns, so the
argument is post14's about drawing somebody else's product: the panel is a
picture of a thing a viewer recognises, and what makes it recognisable is its
shape and its one colour. `--pn-blue` is declared inside the panel's own block,
nothing outside it reads the token, and it leaves when the panel does.

The caret blinks on the clip's own clock — a square wave every 1.06s computed in
node — rather than on a css animation, for the reason every moving value in
demo/ is computed in node: one captured frame carries five or six BeginFrames and
a css animation resolves about five times too fast.

### He is 40 css px left of centre and the thought is why

`future. here.` measures 204 css px at `BUBBLE.size` and the module hangs a
pill's near corner 26 css px along the row from the plate's own centre line. Off
a dead centre head that puts its right edge 36 px past the safe line before the
spring, and `btk.pop` carries it further.

So the zone is shifted and the shift is **derived from the pill's own measured
width and its own worst spring frame**, which is post17's move at a bigger cost:
40.2 css px, 7.4% of the frame. It reads as deliberate once the thought is up,
because the head and the pill balance about the middle; for the nine seconds
before that he is a robot standing a little left of a centred mark. **Whether
that is the right side of the trade is Einz's call**, and the number is printed
on every run.

**The em width was an estimate and the render corrected it.** The first pass
guessed 5.752 em for the string and the rendered pill came back 210.2 css at its
worst spring frame against a solve of 203.5 — so the shift was 7 px short and the
pill sat 5.5 device px outside the safe line. The guard compares the two on every
run and the constant is now 6.0031, measured rather than reasoned.

### The states are the brief's own five

Five marks and the brief names the state for every one: `curious` at the mark,
`curious` at the knob, `delighted` on Max, `agreeing` at the line, `delighted` at
the end with the thought on it. **There is no `neutral` and no `unimpressed`
anywhere in the film**, which the guard checks by name rather than by hope.

`planMascot` refused the second mark at 1.23s when `curious` needs 1.24 before
`delighted`, and said so in the planner rather than in a render — so he goes
curious a breath **before** the mark starts moving, which is what a head does
when something is about to happen and is also what buys the mark its room.

The blink in the opening is the idle layer's and the seed is searched for it:
exactly one whole blink inside the window, close, hold and open. The widening the
brief asks for is `curious`'s own, one eye to 1.8 and the other to 1.1.

### The gaze, and the two boxes that reported the frame back

The gaze layer is the first cut's and it stays: a list of page points with a time
and a duration each, eased on the house curve, composed onto `mascotFrame`'s own
card and eyes. Four looks — the mark above him, the knob (a function of time,
because it is moving), the panel, and then you.

Two boxes in this file were written `left:0; right:0` and both reported the
frame's own edges back to the safe area check: the title, which also made the fit
divide 340 by 540 and set the type three sizes too big, and the slider's label.
Both are `width:max-content` with a centring translate now. **That is the same
fault post14 wrote down about its end card, in a third and fourth place.**

### What the guards found

Four failures across two rendered passes and every one was a real finding:

1. **The title's block spanned the frame**, so it fitted against the box rather
   than the ink and drew 140 device px outside the safe area.
2. **The slider's label did the same thing**, and was caught by the same guard on
   the next pass.
3. **The pill's em width was an estimate** and the rendered pill was 7 css px
   wider than the solve, which put it outside the safe line.
4. **`planMascot` refused the plan** by a hundredth of a second, which is the
   module's own guard doing its job before a browser was opened.

83 guards green at 12fps and at 60 with the shutter open.


### What the fix round changed

- **The opening says the name once.** There was a small `ChatGPT` under the mark
  and a three line michroma headline under that which spelled it out again. The
  headline is gone; what is left is two lines — `ChatGPT 6` in Manrope 800 at 40
  css px, which is the face already in the page for the captions and the only one
  here allowed a weight over 500, and `ASTRA IS HERE` in michroma under it at 44
  device px of cap.
- **The name is spelled in the copy: `chat g p t 6`.** The brief asked for it to
  land as two words and `speak()` escapes its input before it builds the ssml — a
  stray ampersand in a line about r&d would otherwise end the document — so a
  `say-as` tag written into the copy arrives at the synthesiser as literal angle
  brackets. The engine hands back `chat | g | p | t | 6` as five separate word
  boundaries, which is the evidence that the letters are read as letters, and a
  guard checks exactly that on every run. Nothing on the screen carries the
  spelling.
- **The typing is a window rather than a word match now.** post17's
  `typeToWords` refuses a copy whose tokens do not match the read's, and the
  read's tokens are five where the copy's are one. `ASTRA IS HERE` is laid across
  the span from `astra` to `here` with post14's jittered window instead, and both
  ends are still the read's own words.
- **The read is warmer**: -8, -6, -4 with the pitch up, so it opens unhurried and
  lands, with a 0.40s breath after the panel line. The spelling costs about 0.9s
  and the warmth costs the rest — the film went from 11.40 to 12.63.
- **He stands 110 css px lower**, which is the brief's hundred to a hundred and
  forty. It buys 132 css px between the panel's bottom edge and his crown where
  there were 22. The caption band went down 20 with him and his chin still clears
  the highest caption ink by 66.
- **The mark turns while the thought plays.** A fifth of a turn from the moment
  it lands in the middle to the fault, on post14's curve rather than the house
  in-out: every bezier whose second control point ends at one arrives at zero
  speed, so a mark eased to a stop under a held thought is a still frame with a
  pill beside it. It is still turning when the cut lands and the guard measures
  the last frame's step against the average to prove it.

### What is open

- **It is 11.40s against a brief that asked for nine to ten**, and the arithmetic
  is above.
- **He stands 7.4% left of centre for the whole film** to keep a two word thought
  inside the safe line.
- **The loudness loop stops at -15.4 LUFS** rather than -14, because the pass
  that would reach the target costs more limiting than the 5 dB allowance. Third
  clip in a row to land a decibel under.

## The nineteenth clip — which ai do you use

`post19.mjs` renders 11.15 seconds, vertical, **dark only**, out to
`demo/out/post19-dark-1080x1920.mp4`. 110 guards, green at 12fps and at 60 with
the shutter open at six subframes. A chat panel asks the question, the voice reads
five model names and the label and the mark land on each one as it is said, the
mascot gets dizzy following the label, the signal breaks, and he lands in the
middle of the frame flat as gum with the answer over his head.

    node post19.mjs                      1080x1920, 60fps, dark
    DEMO_FPS=12 node post19.mjs          the fast preview pass
    node post19.mjs --blur               60fps with the shutter open
    node post19.mjs --plan               every number printed, nothing rendered
    node post19.mjs --stills             the readable frames only, no video
    node post19.mjs --keep-frames        leave the jpegs on disk
    node post19.mjs --encode-only        re-encode from kept frames

post17 is the template: its panel, its dark tokens, its two faults, its wordmark
and its `bubbleTime`. post18 is the template for the captions, the gaze layer and
the shape of the guards. `lib/` is untouched by all three.

### Five marks, measured before they are placed

`demo/assets/logo-*.png` are somebody else's and they are placed as backgrounds:
no filter, no recolour, no redraw, nothing in the file reaches their pixels.

**Fitting them "to the same height" is not the same as drawing them in the same
box.** All five files are square and the ink inside the square is not: Claude
fills 82% of its canvas, Grok 54%. Drawn in one 88px box the Grok mark would
render two thirds the size of the Claude one and the row would read as five logos
at five sizes.

So every file is decoded once per run with `ffmpeg` — a raw rgba dump and one
scan for the alpha bounding box — and each element's box is solved so that **the
ink** is 88 css px tall with its own centre on the one spot. The box keeps the
file's natural ratio to six decimals, so `background-size: 100% 100%` is exact
and nothing can be stretched. The guard re-checks all five inks land on the same
height and the same centre, to within half a thousandth of a pixel.

**The same measurement is what the safe area check reads.** The element is the
whole square canvas and most of it is nothing, so a box measurement reported the
Grok mark 29 device px outside a margin its ink is 40 px inside. `markInk` turns
the box into the ink rect, spring included, and that is what is walked.

**The files are not what the brief described.** The brief says white on
transparent; what is on disk is five app icons — a rounded tile each, four on
white and Grok's on sage, and the Claude and Copilot tiles carrying their own
wordmark inside them. The brief also says never redraw or recolour, so they are
placed as they are and the mismatch is written down rather than painted over. It
costs two things: the row is five bright tiles on a near black page rather than
five marks in the page's own light, and at 1.63s and 3.63s the tile says the word
the label under it is already saying. **Swapping the files for actual transparent
marks fixes both and changes no code** — the measurement reads whatever is on
disk.

### The names are spoken, and every stop is cut to its own word

**The second round gave the five names a voice, and that changed what a stop
is.** They used to be half a second apart, which is a number; now every one of
them is the start of its own spoken word, which is a fact about the read. The
label, the mark, the click and the caption card all land on the same frame,
because they are all hung off the same word.

It is one take rather than five stitched together — `claude. gemini. chat g p t.
grok. copilot.` — because a picker being flicked through is a list and a person
reading a list puts their own spacing in it. What comes back is 0.81, 0.90, 1.37
and 0.93 seconds between the stops. The long one is `chat g p t` taking four
tokens to say, and the label sitting on ChatGPT a third longer than on the others
is the read being honest rather than a beat going wrong. A full stop after each
name rather than a comma, because each one is a statement and because `cardBreak`
breaks on it: one caption card per name, for free.

**The name is spelled in the copy, and post18 is why.** `speak()` escapes its
input before it builds the ssml, so a `say-as` written into the copy arrives at
the synthesiser as literal angle brackets and is read out. The only way to make it
land as letters is to spell it, and the evidence is the word list: `chat | g | p |
t` comes back as four separate word boundaries where a word would be one, and the
guard checks exactly that.

**Nothing on the screen carries the spelling.** The label says `ChatGPT` and the
caption says `chatgpt`, folded back into one drawn word spanning the four spoken
tokens by `markLines` — see `SPELLED`. The fold is checked twice: that the drawn
words are exactly the folded list, and that the only difference between the 25
words the voice said and the 22 the band draws is those three swallowed tokens.

### The name spot is empty until the question is finished

The panel used to arrive carrying `Claude`, which made the first stop a click on a
name that was already showing. It arrives with the spot **empty** now, and
`Claude` is the first thing to appear in it.

Empty rather than a grey dash, and that is the brand rather than taste: the house
rule is no punctuation dash anywhere a visitor can read, and a standing dash in a
picture of a ui is an argument nobody should have to have. The cell keeps its own
width either way, so the first name landing moves nothing — which is the whole
reason the cell is fixed. The guard walks every frame before the first stop rather
than sampling one either side of it.

### The label is the payload, so it is on the far right and it is 24px

The brief puts the plus on the left and the mic, the waveform and the model label
on the right. The label is the **rightmost** of the three and that is this file's
call: the panel is 388 css px wide and its right hand group starts near the
middle of the frame, so a label sitting inside the icons would cycle five names
across the frame's own centre line — directly over the mascot's head, with
nothing for him to turn toward. At the far right it is 80 css px off his centre
line, which is a head turn.

It is set at 24 css px, which measures **34 device px of cap** against the house's
32 floor. That is large for a piece of chrome and it is deliberate: the five names
are what the clip is about, and a 15px model picker is a detail rather than a
beat. The name sits in a 100.6 css px cell as wide as the longest of the five,
right aligned, so `ChatGPT` arriving cannot shove `Medium` sideways — post18's
fixed cell, and the guard measures both.

**All five stops are real.** The panel arrives with the spot empty, so the first
one puts a name where there was none rather than landing on the name it was
already showing.

### One plan, two sizes, and the card is what changes

He is at post12's centre size, 148, for the landing and at his corner size, 120,
under the panel. `planMascot` takes one size, so the plan is made at 148 and the
first half of the film scales the **card** by 120/148 — the same seam post17's
alive layer and post18's gaze layer are composed on, and the seam `headRect` and
every clearance downstream already read. The plate centre is the zone centre to
the unit, so scaling the card scales the head about its own middle and moves
nothing.

The bubble is a sibling of the card rather than a child of it, so it is not
scaled — and it does not need to be: it is only ever up in the second half, at
full size. The guard says so rather than assuming it.

### The smash, and why the fall is 0.47s

**The length of the fall was set by the shutter rather than by taste.** It fell in
0.36s at first — 560 css px, 3100 a second, **52 css px on the frame it lands** —
and with the shutter open at post10's four subframes that is 25 device px between
one sample and the next, on a head whose eyes are 19 device px tall. `tmix`
blended it into four separated copies of a face rather than into a smear. It is
the fastest move any clip in `demo/` has asked for and the first where four
subframes is not enough. Eight is the direct fix and it did not finish: 4152
captures, killed for memory on this machine. Six finishes, at 3114.

So the fall is 0.47s, which is 40 css px a frame and 13.2 device px between
samples at six — they overlap, the frame at 4.50s is a graded smear with the eyes
as vertical streaks, and the compression frame at 4.633s is sharp. **The extra
0.11s came out of the fault rather than out of the clock**: the fall used to start
half way through the first glitch and now starts on its first frame, so the
landing is at 4.56s either way and nothing downstream of it moved. He falls
through the whole tear now, which is the better read of the two anyway. The peak
is a guard, checked under 42 css px a frame with the device px between samples
printed beside it.

The fall is `p²`, because that is what gravity is and no bezier says it more
clearly. He stretches a tenth on the way down, hits, compresses to 1.52 wide by
0.66 tall over 70ms, and springs out of it on a damped cosine that goes below
zero exactly once — one stretch on the way back at 12% of the compression, then a
settle under 1% of it.

**The chin stays on the ground while he is flat**, and that is arithmetic rather
than an extra channel: a card scaled about its own centre would lift its bottom
edge by the height it lost, so the same frame that writes the squash writes
`R * (1 - sy)` of downward offset against it. Without it he reads as a balloon
being squeezed in mid air instead of as a thing landing. Over 481 samples from
the landing to the `delighted` mark the bottom edge moves at most 1.4 css px.

Past that mark the state owns the card, and the guard's window stops there rather
than pretending otherwise: `delighted`'s entrance lifts the head on purpose.

### The answer is held past the module's ceiling

`bubbleAt` caps a single bubble's hold at `BUBBLE.hold`, which is 0.90s, so from
outside the module that is the longest a pill can be up. The read's second line
runs 3.35s and the pill has to still be on the frame when it finishes, so
post17's `bubbleTime` is here unchanged: real time until the module's own hold
runs out, then its own last fully up bubble frame for `HOLD_EXTRA`, then real
time again shifted by it. Nothing else on the face is held — the idle layer, the
breath and the spring out of the smash all run on the clip's own clock
underneath, and the liveness signature proves it with 0 identical frames.

`HOLD_EXTRA` is derived rather than typed: it is exactly the distance from the
module's own leaving frame to the fault, and the fault is whichever of the read's
last sound and the last caption card finishes later. It comes out at 1.09s.

### The reel, and the one blink

The gaze is post18's layer with this clip's own divisors, and the divisors are
the tuning: everything he looks at is inside a narrow band above him, so a
response written for post18's frame — where the thing to look at was 350 px
overhead — would turn a head three degrees for a target 60 px sideways and read
as nothing. He turns to the label on all five switches and quicker every time,
0.26s down to 0.10s, and settles back to the panel between them. It reaches 4.1
degrees of tilt and 2.9 css px of lean.

The reel is hung off the **last stop** rather than measured back off the fault. It
was the other way round in the first cut, when the stops were half a second apart
and the fault was the only fixed thing near them; now the last name has a voice on
it and a length of its own, so the reel starts a breath before `copilot` is said,
peaks on it, and dies before the signal breaks. The eyes describe a small circle
and the head rolls a quarter turn out of phase, both under a sine that starts at
nought and ends there.

The blink is the idle layer's, found by a seed search over six thousand seeds
with **two** constraints: exactly one whole blink inside the reel's window, and
**none at all across the punchline**. The second one was added after a frame:
the lid is a card coloured slab, so a blink under the pill is a blank face for a
fifth of a second at exactly the moment the answer arrives, and it read as a bug.

### What the frames changed after the guards were green

- **The fall got 0.11s longer and started earlier.** Above: the four subframe
  blend showed four copies of a face where a smear should be. The clock did not
  move.
- **The panel came 6 css px off the safe line on each side.** post17 takes the
  full safe width and the `--guides` pass put its border exactly on the magenta
  rectangle, 0 px in hand, on the side the platform hangs its buttons down. It is
  12 device px now and it is still the tightest thing in the film.
- **The mark swap became a hard cut.** It was a 90ms crossfade, which is right
  for a transparent mark and wrong for these: two opaque tiles at half opacity is
  one printed through the other, and the frame showed Grok through Copilot. The
  guard checks one mark on the frame at any opacity at all, walked at 240Hz.
- **The module's shadow is turned off.** `lib/mascot.mjs` says in its own words
  that the shadow is off in dark and declares `--m-shadow-o:0` to do it — and
  nothing reads that variable: the page half writes the shadow's opacity from the
  frame, and the ellipse is filled with `--face`, which on dark is near white. It
  is invisible for most of a clip because the head sits on top of it; this one
  takes the head away for a third of a second. The rule is the clip's, `lib` is
  not touched, and what it implements is the module's own comment.
- **The cards are four words wide with three breaks the read does not carry.**
  Three to a card cut this copy into `which ai do`, `is knowing which` and
  `one for what` — `which | one` split down the middle, which is the failure the
  review checklist names. Breaks after `ai`, `is` and `one`, marked on the caption
  copy only after the synthesiser has spoken, give `which ai` / `do you use?` /
  `all of them` / `the boring part is` / `knowing which one` / `for what`.

### The loudness loop learned to bisect, because post19 fell off its cliff

post17's and post18's loop walked straight at the target and stopped the moment a
pass cost more limiting than the 5 dB allowance, keeping whichever earlier pass was
closest. **That leaves a cliff and post19 went over it.** The first pass sat at
−21.2 LUFS, the jump the target asked for was 7.2 dB, and 7.2 cost more than the
allowance — so the loop stopped and kept lift nought, and the film would have
shipped seven decibels quiet. Nothing in between was ever tried.

A pass over the allowance is a **ceiling** now rather than a stop: the last lift
under it and the first one over it bracket the answer and the loop halves the gap
until it is under a fifth of a decibel. It still keeps its best pass rather than
its last and it still refuses to buy loudness with limiting; the only thing that
changed is that it looks between the two numbers it already has. Eight passes,
bracketed between 6.53 and 6.64 dB, landing at 6.53 for −15.8 LUFS with 4.98 dB of
limiting. A guard catches the seven decibel miss.

It is worth lifting into `lib/sfx.mjs` next time that file is open, since every
clip in `demo/` carries a copy of this loop.

### The sound

Five kinds and the brief names all five. Nothing is a new recipe and there is
still not one audio file in the repo.

| what | how |
|---|---|
| the key ticks | `key`, off the typing plan's own list, one per three characters plus the ends |
| the five clicks | `click` at −29 dB rather than the table's −25: five inside two seconds is a picker being flicked rather than five events |
| the splat | `crunch` taken low and wet — 190 down to 70 hertz under a 1200 ceiling — at −27 dB, because the brief says soft |
| the pill | `mascotCues`' own `pop`, taken |
| the two faults | `glitch`, on the frame each is taken |

### The clock, and the eight second brief is two rounds old

It ran 8.65s with the cycle silent. **Giving the names a voice added 2.54s on its
own**: the five of them are 4.54s of sound where there were 2.00s of nothing. Of
the 11.15s, 8.70s is speech.

The two cuts that would still shorten it are printed at the bottom of every run
and neither is free: dropping `the boring part is knowing which one for what` buys
2.4s and the whole point of the clip, and reading the names without the full stops
between them buys a few tenths and takes the beat out of the list.

### What is open

- **The five assets are app icons, not the transparent marks the brief
  described.** Above. It is the one thing that would change the look of the first
  half and it needs no code.
- **It is 8.65s against a brief that asked for eight**, and the arithmetic is
  above.
- **The thinnest beat is 4.99..5.28s**: he has landed and settled and the first
  dot has not climbed yet. About a third of a second of a small white circle on
  black, with the answer audibly mid-sentence over it.
- **The clip has no posting pack.** Caption, tweet and three tags per platform
  are all undecided.

## The twentieth clip — the read, the fall and the one pose left in it

```
cd demo
node post20.mjs                 # 1080x1920, 60fps, shutter closed
DEMO_FPS=12 node post20.mjs     # the fast preview pass
node post20.mjs --voice         # the read and the clock only, no browser
node post20.mjs --blur=6        # 60fps with the shutter open, six subframes
node post20.mjs --keep-frames   # leave the jpegs on disk
node post20.mjs --encode-only   # re-encode from kept frames
```

**8.67 seconds, dark only, one output path, overwritten every run:**
`demo/out/post20-dark-1080x1920.mp4`. Sixteen beat stills land in
`demo/out/verify-post20/`.

A thought types itself in the middle of a black frame while a voice says it, gets
knocked down to the lower third, and the mascot falls into the space it left. He
hits the floor and squashes flat, takes a beat, then a hand comes over his mouth
and he laughs with `hihi` over his crown. The laugh stops dead, the hand goes home
and fades, and the punchline pops under him while the voice delivers it. Then a
hard fault takes the lot and puts the wordmark up.

The line is `everyone says ai will replace u`. The answer is `it will replace the
guy who does not use it`.

### The first cut had a point in it, and the frames took it out

`point-viewer` was the whole reason the clip existed: the first film to use the
pose table, and the pose the traced review had opened a second drawing for. The
review of the rendered cut found the one thing no number could. **On the frame
the finger aims at the right border rather than at the lens.** It reads
unmistakably as a point — which is more than `point` manages at a 240px head, and
was the finding that opened the drawing in the first place — and it does not read
as *at me*. The honest fix is a third traced file, drawn for a finger coming
toward camera without foreshortening into the fist.

So the pose is gone rather than shipped half working, and what is left is the
beat the clip was always about: he falls in, takes a breath, and cannot keep a
straight face. **`laugh` is the only pose in this film**, which makes it a
narrower test of the pose layer than the first cut was and a more honest one.

### The read is the spine, and every number in the clock hangs off it

Two takes, one a line, edge's Andrew — this house's `calm` — at **-4% and +3Hz**
against the voice's own -8% and -2Hz. That pair is the whole of "slightly
amused" and it is the only lever there is: `speak()` escapes its input before it
builds the ssml, so an `mstts:express-as` written into the copy arrives at the
synthesiser as literal angle brackets and gets read out. A shade quicker than the
house default reads as somebody enjoying the line rather than reporting it, and
three hertz up is the smallest step that is audible at all.

Both takes are cached on the copy **and the delivery**, because a take is the
words and the way they are said.

Everything downstream is derived:

| derived from | |
|---|---|
| the typing | every word appears on the frame it is being said on |
| the knock down | 0.14s after the last word of take one ends |
| the fall | 0.18s into the knock down |
| the laugh | 0.30s after the landing |
| the punchline and take two | the frame the laugh's hold ends on |
| the fault | 0.08s after the last **sound** of take two |
| the end | 0.95s after the fault |

Five joins and an end card. Everything else is where the words landed, so a
slower reading moves the whole film and nothing in the file has to be retyped.

**The fault waits for the sound rather than for the last word boundary**, and
that is not the same instant: the synthesiser's `WordBoundary` is shorter than
the syllable it names, so a cut placed on it takes the last consonant with it.
`audioEdges` is post19's, unchanged, and it is what the number comes off.

### The typing is the read done at word level

post17 lays a word's **characters** across that word's spoken span, because it is
typing into a chat panel. This is a caption, so the unit is the word: it appears
when it starts being said, and it takes a key tick on that frame. Six events
rather than thirty one, which is the difference between typing and a machine gun.

What the spacing buys is what post17 says it buys. The words come back at 0.01,
0.50, 0.95, 1.33, 1.50 and 1.97 — `will` and `replace` are 0.17s apart and
`replace` and `you` are 0.47s apart, because that is how the line is read. An
even grid under an uneven read is two things laid on the same clock.

**The screen says `u` and the voice says `you`**, and it is the one word in the
film where they differ. A caption is read and a voice is heard, and `u` is a
thing people type. There is a guard that there is exactly one such word, so a
second one cannot slip in unnoticed.

### He falls with no hands, and that is two gates rather than one

`hands: true` draws the resting pair from frame zero, so the gloves are gated to
nought by this file: one multiplier on the opacity the module already writes per
hand, composed exactly the way the fall is.

**The second gate is the one a rendered frame asked for.** `side: 'right'` is on
the laugh's mark and it is a fact about a mark, so it applies from that mark on;
before it the module holds the resting pair, and the module then fades the idle
hand out **across the pose's entrance**, because a hand that was on screen has to
leave. In this clip it was never on screen, so it had nothing to leave from — and
0.3 of a left glove drifting off during the entrance is exactly what the guard
caught. So the hand that never acts is multiplied by nought outright, and the
acting one gets the fade.

The fade in is 0.18s from the mark, as the hand starts across; the fade out is
0.22s from the end of the hold. **The fade out is the one thing the review left
open**: the pose's own exit runs 0.32s, so for a fifth of a second there is a
glove at partial opacity between the mouth and the resting line. On the frame it
reads as the hand dropping away, and the punchline springing in on the same frame
is where the eye actually goes. The alternative trades a travelling glove for one
that vanishes on the spot.

### The smash is post19's at post19's depth

The first cut walked `k` down to 0.16 on the argument that a small robot arriving
is not a head hitting the floor after a smash cut. The brief asked for that clip's
feel outright, so the table is that clip's: he stretches a tenth on the way down,
compresses to **1.52 wide by 0.66 tall** over 70ms with his chin on the ground,
and springs out on a damped cosine that goes below zero exactly once.

1.52 by 0.66 is funny and 1.16 by 0.86 was polite. The fall itself is unchanged
and its length is still the shutter's rather than taste's: 560 css px over 0.47s
is 37.7 css px on the frame it lands, which is 12.6 device px between samples at
six subframes.

The ground compensation is the same line it was — a card scaled about its own
centre lifts its bottom edge by the height it lost, so the same frame writes
`R * (1 - 1/sq)` back against it — and it matters more at this depth than at the
old one.

### The laugh makes no sound, and the gap is silent on purpose

`mascotCues` offers three `titter`s on the first three bounces and **this clip
takes none of them**, so a laugh can be laid over the gap by hand later. They are
dropped **by name rather than by index**: a sound removed by position is a sound
that comes back the day the module adds a cue.

What is left in that second and a half is one thing, the thought's own `pop` at
3.99s, and it is kept because a pill arriving is not a laugh. There is a guard
that nothing else lands inside the giggle's window.

### The thought is the module's, over the crown

`hihi`, `thought: 'over'`, and the module derives the side from `pos` — a head on
the left thinks to its right, so the pill lands over the middle of the frame. The
module's placement is **advisory** about the safe area, because it places against
the zone and a clip is free to move the zone, which this one does. So the pill is
measured in the page over its own window rather than argued about: `bubbleSafe`
answers null while the cluster is hidden, so it is sampled every 0.04s from the
first dot to the last frame of the exit and the worst of each edge is what the
guard reads. It clears 532 left, 596 top, 300 right.

It is up from 4.33 to 5.23 — the module's own 0.90s hold, which is the longest a
single `bubble` can be held from outside the module — and its exit runs a few
hundredths past the pose's hold. That is fine and the guard says so in the right
place: what matters is that it is gone before the punchline card is up, not that
it is gone before the hold ends.

### `bias: 0`, because a centred mascot is not a corner mascot

`pos` defaults to `bottom-left` and the module derives `TURN.bias` 0.35 from it,
which is right for a head standing in a corner looking into the frame and wrong
for one centred and talking to the camera. An explicit bias is the module's own
documented way of saying it, and it is one line in the plan. **Any clip that
centres him should say it.**

### The wordmark's opacity is keyed to the frame, not to the instant

post12 fades it in over the front of the snap, and that only works because its
hit does not land on a whole frame at either rate. The moment one does, the birth
frame is nought and the frame carries the mascot already cut and the wordmark not
yet arrived, which is an empty frame — the exact fault post12's own note is
about.

Keying it to `f`, the same switch `mo` is on, makes the exchange exact at any
rate. It is also what lets the fault land wherever the read ends rather than on a
number chosen to sit on two frame grids at once, which is what the first cut's
7.00 was.

**And the captions are on that switch too, which the 60fps pass found after the
preview was green.** Their cut was still written as `t >= END.at`; with the hit
landing on no particular grid, `Math.round(END.at * 60)` rounded down past it, so
the frame the wordmark was born on still had `t < END.at` and the punchline was
drawn under it. One frame with both on it. At twelve the rounding went the other
way and the preview was clean, which is the whole reason a 60fps pass exists.
Every channel in an exchange goes on the frame, not just the two you remembered.

### The mix, and a limiter allowance that moved because the source did

The read on top, a small bus of effects under it ducked to **0.30** while a word
is being said. That is light on purpose: the only thing playing under the read is
the run of key ticks, and a tick on the word it belongs to is supposed to be heard
*with* it rather than made room for. post19 ducks to 0.60 because it has a bed
under a narration; this has six clicks.

The key went back **down**, from the first cut's -26 to -29. -34 is the table's
own and it was set for ticks under a read, which is exactly what this is now; the
first cut lifted it because there was no read to sit under.

**Five decibels of limiting, which is post19's number and not post12's.** The
first cut allowed one and a half, because a dozen transients on silence is a
source whose peaks *are* the content. A read is the opposite: speech is peaky
against its own average by ten or twelve decibels and a limiter taking a few off
the plosives is what every broadcast chain does. At 1.5 this mix stopped at -16.9
with the target 5.6 dB away; at 5.0 it reaches **-15.0 LUFS with the limiter
taking 4.48**. The number moved because the source did.

The loudness loop bisects, which is post19's lesson ported rather than
re-derived: a pass over the allowance is a ceiling rather than a stop, and the
last lift under it and the first over it bracket the answer.

### The beats

| at | what |
|---|---|
| 0.00s | `everyone` is already on the frame with the caret under it, and its key tick is on frame zero |
| 0.50 / 0.95 / 1.33 / 1.50 / 1.97s | the other five words, each on the frame it is said on |
| 2.32s | the caret has blinked for 0.14s and the block is knocked down over 0.30s |
| 2.62s | it lands with a 12px bounce and a thud |
| 2.50s | he starts falling, 560px, no hands |
| 2.97s | he lands: 1.52 wide by 0.66 tall, chin on the ground, back out of it by 3.46 |
| 3.27s | the laugh. entrance 0.67, the hand is on the mouth at 3.94, holds to 5.49 |
| 3.85 to 5.53s | `hihi` climbs, is up 4.33 to 5.23, and leaves |
| 5.49s | the laugh stops, the hand goes home and fades, the punchline pops and take two starts |
| 7.36 / 7.56s | two stutters |
| 7.74s | the hit. he and both captions are cut and the wordmark is born on that frame |
| 8.69s | end, after 0.86s of the end card |

### The guards this cut added

On top of the first cut's: **no glove on screen before the laugh**, asserted on
the composed frame at four instants rather than on the plan; **the screen left
glove never appears at all**, walked over every frame at sixty; **no titter on
the bus**, and nothing but the thought's pop inside the giggle's window; **the
module still offers exactly three titters**, so the day it offers four this fails
rather than quietly letting one through; **the thought is the module's placement,
arrives after the hand lands and is gone before the punchline card is up**, with
its rendered rect clearing all four borders; **every word after the first appears
on the frame it is said on**; **exactly one word differs between the screen and
the read, and it is `u`**; **the fault lands after the read's last sound**; and
**the bus is under the voice on every window**.

Gone with the point: the chain checks, the two pose count and the titter window
check, which is now its inverse.

### Outstanding

- **The clip is 8.67s against a brief asking for around eight.** The read is
  4.3s of it and the laugh a further 2.2s. Nothing in the clock is padding.
- **The end card holds 0.86s** against its own floor of 0.80, which makes it the
  tightest number in the file. A take that comes back half a second longer needs
  the card lengthened rather than the film trimmed.
- **The glove fades while it is still travelling home.** See the note above.
- **`point-viewer` still does not say "at you"**, and the fix is still a third
  traced drawing. Nothing in this clip depends on it any more.

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

## The library — `demo/lib/`

Five pieces that are not a clip. Nothing in `lib/` is imported by `record.mjs`,
`post2.mjs`, `post4.mjs` or `og.mjs`. `post6.mjs` imports all but the analyzer,
and `post5.mjs` imports `lib/voice.mjs` and `lib/sfx.mjs` since its audio pass —
it takes the voice and the sounds and none of the captions or pictograms, which
is the point of them being four pieces. It exists so the next clip can have a
voice, captions and pictures without inventing any of them from scratch on the
day.

Still zero dependencies beyond the two `demo/` already had. The voice module
talks a websocket protocol by hand rather than adding `ws` or `edge-tts`, and
the caption engine is plain javascript and css.

### `lib/captions.mjs` — animated captions

**Two options went in for the ninth clip and neither changes an existing
style.** `flash` is a predicate over one word, `float` only, and it is how a money
word goes green for the quarter of a second it is being said. `cardBreak` is the
regexp a card may end on: the default is a sentence end, which is what `pop` has
always cut on, and `float` passes one that includes the comma. The second is not
cosmetic. With sentence breaks only, "if ai can do it, we build it" cuts a card
reading "do it we", which is three words that were never a phrase. Read aloud it
is fine, because the voice puts the clause boundary in. Read on a card it is
nonsense, and a caption is read.

**Cards carry words and nothing else.** `punctuation: 'drop'` is the default and
it is a brand rule rather than a clip's preference: the sentence a card belongs
to is carried by the voice, so the marks stay in the script where the synthesiser
reads them as pauses. `bareWord` strips at the **edges only** and never inside a
word, which is what makes it safe to run over anything — `business.` becomes
`business`, `1,000` and `don't` and `e-pasts` are untouched, and `really?` keeps
its question mark because that changes what the word means rather than
punctuating a sentence. It runs *after* the grouping: `toCards` breaks at a
sentence end and needs the full stop to find one, so strip first and every
sentence runs into the next.

Takes `[{word, start, end}, ...]` and draws it word by word. Four styles:

| | |
|---|---|
| `pop` | big Michroma caps, one short card at a time. The card springs in whole and the accent then walks across it, landing on whichever word is being said and kicking it as it arrives. The hormozi cut in our type. `emphasise` marks a card as a beat and fits it on its own in the accent, off unless asked for; `fill: 'word'` goes back to the older reveal, where a word is invisible until it is said. See The sixth clip for why `card` is the default. |
| `type` | Space Grotesk, lines arriving from below and dimming as they are overtaken, the word being said at weight 500. Calm, closest to how the site reads, and it never touches the accent. |
| `count` | a rolling number and a label under it. The digits sit on a fixed cell grid so a 6 becoming an 8 cannot change the width of the line. |
| `float` | Space Grotesk at 700, lowercase, one short card at a time, no card behind it and no fill of any kind. Built for footage rather than for a composed frame, which is the one thing the other three are not: `pop` over a screen recording is a Michroma headline arguing with a page that already has type on it. The ink is `--fg` and only `--fg`, which is what makes the paper version free: over the dark theme the same token is the paper tone, so a clip that films a dark page gets light captions with no second code path. `flash` names the handful of words the accent may touch, and it touches them only on the frames they are being said on. Added for the ninth clip. `pop` is still the default and post6 and post7 render exactly as they did. |

The shape of it, and it is deliberately split in two:

- **`planCaptions(words, opts)` runs in node and measures nothing.** It groups
  the words into cards, lines or items and gives every group the window it is on
  screen for. A plan is plain data: printable, diffable, and readable before a
  browser is ever opened. `describe(plan)` prints it as a card.
- **`captionFrame(plan, t)` is the whole animation, as a pure function of
  time.** It returns the opacity, scale, offset and role of every group and
  every word at second `t`, and nothing else.
- **`captionPage` is serialised into the scene** with `.toString()`, the way
  `post5.mjs` serialises its own. It measures, fits, and then does as it is
  told: `apply()` writes numbers, it never computes one.

**No css transition and no css animation on anything that has to hit a mark.**
This is the rule `post2.mjs` learned the hard way and it is why the split above
exists. One captured frame carries five or six BeginFrames, so the animation
timeline advances about 5x per captured frame and a `.4s` spring resolves in
five frames. The rAF shim fixes rAF; nothing fixes transitions.

Four things the engine does on its own, so a caller cannot forget them:

- **The colours are the page's.** `brandTokens()` lifts both the `:root` block
  and the `html[data-theme=dark]` block out of `index.html` at run time, and
  throws if a token it paints with has gone missing. Light and dark come from
  the same place, which is what makes "it respects both themes" a fact rather
  than a claim.
- **Every style lays out inside a box the caller gives it**, and `safe()`
  measures the drawn ink against all four borders afterwards rather than
  trusting the box. Cells and words, never the flex row that centres them: a
  full width row reports the box back to you and proves nothing about what is
  inside it.
- **The `pop` fit divides by the largest scale a word ever reaches.** A word
  springs about its own centre and overshoots past 1, so a card fitted to
  exactly the box width puts its outer words over the safe line on the frame
  they arrive. Measured at 1.125 here, and it is solved from the easing rather
  than typed, so changing the bounce moves it.
- **A group's exit runs inside its window, not after it.** One group's `out` is
  clamped against the next group's `in`, so "never two cards on screen at once"
  is something the maths guarantees and the render then checks.

Michroma ships one weight and it is never faked here: no `font-weight: 700`, no
`-webkit-text-stroke`, no shadow. Space Grotesk is 400 and 500 and nothing else.
`pop` caps at 40px against the brand's 44px hero cap, deliberately: a caption
must not out shout the statement above it.

### `lib/voice.mjs` — free voice

Edge's read aloud voices, over the unauthenticated websocket the python
`edge-tts` package uses. No account, no key, no cost.

```
node lib/voice.mjs test              a sample line in all three voices
node lib/voice.mjs test "some copy"  the same for your own line
node lib/voice.mjs voices            the three we picked, and why
node lib/voice.mjs say "copy" --voice=dry --format=wav --name=post6
```

Audio and a json sidecar land in `demo/out/voice/`, which is inside `out/` and
therefore already gitignored.

Three voices, chosen because they can read our copy without selling it:

| | | |
|---|---|---|
| `calm` | `en-US-AndrewNeural` | the default. Warm, unhurried, reads a statement as a statement rather than as an offer. |
| `dry` | `en-US-EricNeural` | flatter and older. The closest thing in the list to deadpan. |
| `uk` | `en-GB-RyanNeural` | the same register in a different accent. We are in Riga, not California. |

All three run at a negative rate, because the neural default is a shade faster
than a person reading a short line to camera.

**The sidecar is the interesting half.** The service emits a `WordBoundary`
event per word, an offset and a duration in 100ns ticks, so what comes back is a
real timestamped transcript of a line we wrote, straight out of the synthesiser.
That is exactly what `captions.mjs` eats: no alignment pass, no whisper, no
guessing. The result says `timing: "engine"` when the timestamps are the
engine's and `"estimated"` when they had to be spread over the measured duration
by syllable count, so the caller is never left wondering which it got.

Measured on the default voice: **2.3 words a second**, which puts a three word
caption card at about 1.3 seconds. That number is what the `pop` style is cut
against and it is printed by `node lib/voice.mjs test`.

Five things that cost time, written down so they only cost it once:

- **It is hand rolled because the global `WebSocket` cannot set request
  headers**, and this endpoint wants an `Origin` and a `User-Agent` that say
  Edge. So the handshake is written against a tls socket and the frames are
  masked by hand. About a hundred lines, and the alternative was a dependency.
- **`Sec-MS-GEC` is sha256 of the windows file time rounded down to five
  minutes, in 100ns ticks, with the public trusted client token appended.** Two
  traps in that sentence: the ticks are past 2^53 so they have to be computed in
  `BigInt` or javascript quietly rounds them and every hash is wrong, and the
  clock is the *server's*, so a machine a few minutes out is refused. A 403
  therefore retries once against the `Date` header the refusal itself carries.
- **A missing `Cookie: muid=…` is refused with the same blank 403 a bad token
  gets**, so a missing cookie looks exactly like broken drm.
- **Word boundaries and sentence boundaries are one choice, not two.** Asking
  for both is how you get neither. Sentences are derived from the words and
  their punctuation afterwards, which costs nothing and cannot disagree with the
  word timings the captions are cut against.
- **The engine strips punctuation off the word it hands back, and sometimes
  sends `40 hours` as one event.** Both are put back: the punctuation from the
  copy we sent, and a multi word event split by length inside the box the engine
  already agreed with. The punctuation still has to come back even though the
  captions now drop it again — `toCards` breaks a card at a sentence end and
  needs the full stop to find one, and the `count` style parses figures out of
  these words. Losing it here would run every sentence into the next; losing it
  later is a deliberate choice made after the cards are cut.

Long scripts are split on sentence ends and the chunks' offsets are pushed along
by the audio already written, measured as exact arithmetic on the byte count
because the wire format is constant bitrate. `wav` is a transcode of the
finished mp3 rather than a second wire format, because riff chunks carry their
own headers and do not concatenate.

When it breaks, it will be the drm. `CHROMIUM_FULL` at the top of the file is a
real Edge build number and is the thing to bump; the python `edge-tts` package
carries the same constant and is the reference.

### `lib/pictograms.mjs` — animated pictogram scenes

SVG drawn in code, driven per frame, on the same rig as everything else in here.
`captions.mjs` does this for words; this does it for pictures, and the two are
built the same way on purpose so one clip can drive both from one loop.

A **scene** is a group with an entrance, a hold and an exit, and inside it a list
of **parts**. A part is one shape and a list of **steps**, and a step is one of
five kinds:

| kind | |
|---|---|
| `pop` | a scale spring about the shape's own centre, with a fade |
| `draw` | line drawing along the path, by DrawSVGPlugin |
| `move` | a translate from an offset, with or without a fade |
| `flip` | a rotate and a scale, in or out, for one thing becoming another |
| `fade` | opacity alone |

A part may also carry `stagger: 3`, which lags each of its shape's sub shapes
three sixtieths of a second behind the one before it, so corners and details
arrive after the body they belong to. Two to four frames is the range that reads
as one object settling rather than as two animations. It is opt in and no shipped
scene uses it: turning it on for an existing scene would be a scene edit rather
than an engine change.

Steps are a list rather than one animation because real objects do more than one
thing. A padlock's shackle is drawn and *then* seats, which is two steps on one
part and is the whole difference between a lock appearing and a lock closing.
Each step owns the channels it moves and leaves the rest alone, so two steps on
one part never fight over the same number.

The same split as the caption engine, and for the same reason:

- **`planScenes(scenes, opts)` runs in node and measures nothing.** It validates,
  resolves the timings and returns plain data. `describeScenes(plan)` prints it.
- **`sceneFrame(plan, t, env)` is the whole animation, as a function of time and
  of nothing else.** Opacity, scale, offset, rotation, how much of each path is
  drawn, how far off the page the part is and how hard it is deformed, for every
  scene and every part, at second `t`. It seeks a paused gsap timeline and reads
  the channels off it.
- **`pictogramRuntime()` is what goes in the page** — gsap, CustomEase,
  DrawSVGPlugin, the shared ease table, the shared timeline builder and
  `pictogramPage`, inlined as one string read off `node_modules` at render time.
  Nothing is fetched: the site's budget of exactly one external request is not
  this file's to spend, and a clip that depended on a CDN being up would be a
  clip that renders differently on a bad day.

**One motion core, two readers.** `buildTimeline` is a single function that
tweens plain javascript objects and touches no DOM. Node runs it to feed the
guards; the same function, serialised, runs in the page and its numbers are
written to elements. They are not two implementations that happen to match — they
are one function run twice, and **the page compares its own gsap output against
the frame node sent on every captured frame** and faults if they ever differ by
more than a rounding error. Measured on the money beat: `0`.

**No css transition and no css animation anywhere in it**, for the reason
`post2.mjs` found and `captions.mjs` repeats: one captured frame carries five or
six BeginFrames, so a css animation resolves about five times too fast. gsap is
subject to exactly the same rule, which is what the next section is about.

#### The clock, and why gsap does not get to keep its own

gsap's ticker rides `requestAnimationFrame`, and in here that is the recorder's
shim: a queue drained once per captured frame. Left alone it would advance the
global timeline by however many milliseconds the page thinks have elapsed, which
is not the frame being captured. Three things stop it, and the third is the one
that mattered:

1. `gsap.ticker.lagSmoothing(0)` and `gsap.ticker.sleep()`.
2. A filter installed **before gsap's script** so the shim only ever runs our own
   loop. It has to be before: gsap reads `requestAnimationFrame` into a private
   of its own when it loads, so a wrapper installed afterwards is one gsap never
   sees. That was tried first and the check failed identically.
3. **`gsap.ticker.remove(gsap.updateRoot)`.** `updateRoot` is registered as a
   ticker listener at load, and `ticker.wake()` dispatches a tick *synchronously*
   — so `ticker.sleep()` is not a brake, it is a trigger: the next tween render
   calls `_wake`, which calls `_tick`, which calls `updateRoot` with wall clock
   time. Taking the listener off means the only thing that can move the global
   timeline is the `gsap.updateRoot(t)` the rAF flush calls itself.

`__pic.sync(fps, count, sub)` proves it before a frame is written: it walks the
shim sixteen ticks and fails the render unless gsap's own time is the capture
index over the capture rate. It caught the ticker bug above on capture two of
sixteen — wanted 0.166667, got 0.073 — which nothing else in a render would have
reported. Measured worst error at 60fps: **3.3e-8s**, which is floating point on
`1/60` and not a clock.

The vocabulary is `square`, `sheet`, `rule`, `squiggle`, `coin`, `human`,
`check`, `stroke`, `folder`, `lockBody`, `shackle`, `eye`, `magnifier`,
`mascotFace`. Geometry is a 100x60 viewBox scaled into whatever box the caller
hands over, so a shape that reads at one size reads at all of them, and every
shape returns its own bounding box as well as its own centre — the box sizes the
shape's shadow filter region and is what the border guard measures.

#### Solid ink, not outlines

It shipped as hairline strokes with no fill and no depth and was rebuilt. Three
rules make the new look one look rather than a pile of choices.

**Fill, do not outline.** A shape is a filled silhouette in the part's own ink.
What used to be a second outline inside a first one is now a hole: `pic-cut`
paints `--bg`, so a coin's face, a lock's keyhole, an eye's pupil and the writing
on a document are all cut out of the ink rather than drawn next to it. The page
shows through, which is what makes these read as paper rather than as icons.

**Strokes only where a stroke is the animation.** A rule, a signature, a check, a
slash, a shackle and a bond are line drawn, so they stay strokes; nothing else
is. The ones that remain carry one of two weights and never a third — `hair` at
1.4 units for detail cut into a filled shape, `mark` at 2.2 for a mark that
stands on its own — and `planScenes` throws on any other number rather than
letting a third weight creep in. Corners run on one radius scale carried over
from the site's own: `panel` for a document or a folder, `chip` for a small
block, and nothing square left in the vocabulary except the mascot, which is a
circle.

**Everything floats.** Each part casts one soft drop shadow, large blur, low
opacity, and it grows while the part is in the air and tightens as it lands. No
gradient, no second light, no inner shadow. A `cut` inked part casts nothing,
because a white line cut into a black card is not floating over it.

*The site has no drop shadows and `skills/page-builder/SKILL.md` says so. This is
the one place they are allowed and it is demo only: nothing in this file reaches
`index.html`, and depth on a 1080x1920 clip that plays between two other people's
videos is doing a different job from depth on a page.*

The shadow is an SVG `feDropShadow` per part, in a `filterUnits="userSpaceOnUse"`
region worked out from the shape's own box rather than from the board — a region
sized to the whole block would cost every part a full block of raster on every
one of thirteen hundred frames. Three attributes are written per frame from the
`lift` channel: offset, blur and flood opacity. **The blur is one of them**,
which the site's rules forbid because it re-rasterises every frame; every frame
in here is already being re-rasterised and written to disk, an offline renderer
pays that in minutes rather than in dropped frames, and there is no other way to
make a thing look like it is further off the page. The part's own opacity is
deliberately not in the shadow's numbers: the filter sits inside the element the
fade is written to, so a part at 30% carries a shadow at 30% of its own strength
for free, and one number controls both rather than two that can disagree.

**A `knock`ed part carries a `--bg` copy of itself 1.6 units fatter
underneath.** That is what lets an `--fg` slash cross an `--fg` eye and still
read as a slash. Both copies are dashed off one measurement, so the white line
under a mark draws at exactly the speed the mark does. **It is a gap, not an
outline** — it was three units, and the scene strip showed what that is: a white
halo tracing a silhouette reads as a sticker laid on the frame, and on a shape as
thin as an eye it ate the shape.

#### The house curves

Five, registered by name in `houseEases` and referenced by name from a scene, so
a scene table never carries a bezier and two scenes can never disagree about what
a pop is. Four are `CustomEase` paths; `land` is a function, because an impact is
not a cubic and approximating it would cost the thing that makes it work.

| name | |
|---|---|
| `pop` | snappy overshoot — fast in, **10% past the mark**, one dip 1.5% under, still |
| `drift` | the soft one, for a thing sliding across a page rather than onto it |
| `glide` | the calm in-out. every opacity ramp and every line draw |
| `heavy` | weight. late to start, slow to finish, for things with mass |
| `land` | gravity then impact |

**The old names are aliases and every one of them still works**, which is why no
post file's scene table had to be edited: `io` is `glide`, `spring` and `weight`
are `pop`, `fall` is `heavy`. The one default that changed is `move`, which
drifts now where it used to glide — a glass sweeping across a page is a drift.

`land` is `x` squared to the floor, which is what falling actually is, then a
small damped sine about the landing point — up first, because a thing that lands
bounces before it settles, then a shallow squash past the mark, then nothing. The
sine is zero at both ends so the step lands on 1 with no normalising, and the
bounce's slope is a third of the fall's, which makes the moment of impact the
fastest thing in the step. The coin falls 38 units on it in 0.58s; the padlock's
shackle seats 1.8 units on it in 0.30 and the click is the shadow collapsing
under it as much as the travel.

The cost of a genuine settle is a steeper start, and it is paid in duration
rather than in a raised guard: **`pop` is 0.52s where it used to be 0.34**.

#### Squash and stretch

There is **one** channel, `sq`, and both scales are read off it: x is `1+sq` and
y is `1/(1+sq)`. A squash cannot get the volume wrong because there is no second
number for the first one to disagree with. Checked in the self test at 1.1e-16.

It peaks at **6% on a pop and 8% on a landing**, never more, and its shape is
anticipation, contact, settle: a short stretch on the way in, a snap into the
squash over two and a half frames landing exactly on contact, one frame of
contact deformation, then out over ten frames on the `pop` curve — whose own dip
under the mark is the counter stretch for free. A thing that squashes and comes
straight back to rest reads as rubber; one that overshoots a little on the way
back reads as mass.

**Contact is measured, not typed.** Where the `pop` curve first crosses 1 is a
property of that curve, so it is sampled off it at load — 0.2525 — and the squash
is anchored there. Change the curve and the squash follows it. A landing anchors
on `IMPACT` instead, the same 0.72 the shadow and the coin's sound already use.

The guards did not gain a limit for it. `sceneMotion` measures the scale channel
**effective** — the part's scale times its squash on each axis, which is the
number a viewer sees — so a squash that snapped is caught by the limit scale
already had rather than by a new one nobody set. Worst on post6's five scenes at
60fps: **0.0914 against a limit of 0.14**.

Fixed and not negotiable per clip: the colours. `--fg` for ink, `--bg` for a
cutout, `--muted` for a secondary shape on the page itself, `--accent` for the
one thing a scene is about, `--red` for an error and nothing else, `--face` and
`--eye` for the mascot. Every one is a token out of `index.html`. There is no
text in a pictogram, so there is no dash to check and no face to load.

Two things it refuses rather than warns about, because both read as the layer
glitching rather than as a wrong number:

- a part that starts before its own scene has finished arriving, or is still
  moving after the scene has started to leave
- three scenes on screen at once, or an overlap past 0.45s — a handoff is a
  handoff, not a dissolve

And one it measures rather than assumes. **`sceneMotion(plan, fps, seconds)`
walks every frame before a render** and reports the biggest one frame step in
every channel — the shadow's `lift` included, because a shadow that trebles in
size in one frame is as wrong as a shape that does — plus which part made it. It costs a fraction of a second and it is
the difference between finding a snap now and finding it in a twenty two second
render. `post6.mjs` turns those numbers into guards and prints both the limit and
the truth, so the headroom is on screen rather than in a comment.

**`mascotFace` is drawn from the ratios in `skills/page-builder/SKILL.md`**, not
by eye, and it carries `--face` and `--eye`, so it inverts with the theme exactly
as the real mascot does. Its lids are driven by the caller: `post6.mjs` passes
the same lid it passes the real mascot, because two faces on one screen must not
disagree about blinking.

### `lib/sfx.mjs` — synthesised sound

Twenty two sounds, written in JavaScript sample by sample. **There is not one
audio file in the repo**, for the same reason the pictograms are drawn in code and the
mascot is an inline SVG: a sample pack is a dependency with a licence, a
download and a folder of binaries in a public repo, and it sounds like everybody
else's clip because it *is* everybody else's clip. Eighty lines of oscillator
and envelope is smaller than one wav, it is diffable, and every number in it is
a number somebody can argue with.

It is also the only way the sounds can be *derived*. A pop generated from the
caption plan cannot drift out of sync with the caption, because there is nothing
to drift.

A voice in `VOICES` is a pure function of its own options returning one mono
`Float32Array` peak normalised to 1.0. It knows nothing about when it plays or
how loud it is: `renderSfx` places it and `GAINS` sets its level, so the design
of a sound and the balance of a mix stay two separate arguments.

The whole set is deliberately dull — short, low and quiet, standing in for paper
and ink rather than for a user interface. A caption card gets a body thump with
no top end at all, because what it is announcing is a word appearing, not a
notification. The coin is the only sound in the clip with any metal in it,
because it is the only thing in the clip made of metal: a thud and two
*inharmonic* partials struck together, because a disc is not a string. The lock's
click is 7ms of band passed noise over a 190 Hz pulse, gone inside a twentieth of
a second — solid comes from how fast it stops, not how loud it starts.

The DSP is one pole filters and nothing else. At these durations a steeper
filter has nothing to do and a resonant one would ring, which is the opposite of
what any of this is for. Two milliseconds are taken off each end of every sound,
always: a buffer that starts or stops at a non zero sample is a click, and a
click is the one artefact that survives every codec between here and a phone
speaker. The noise source is a seeded xorshift, so a render produces the same
file twice.

**The tenth sound is a character rather than a thing, and it is the exception
that proves the set.** Everything above stands in for paper, ink, metal or a
mechanism; `chirp` stands in for a small robot deciding to say something. It is a
sine gliding up inside its own 90ms with a third harmonic a quarter under it, low
passed at 3.4k, so what comes out is a rounded boop rather than the piezo beep
every other clip on the feed uses. The glide is the design: a tone that rises has
asked a question or agreed with you, and a tone that sits still is a smoke
detector. A character voice is allowed to be the brightest thing in a dull set
without actually being bright.

`chirpPhrase` builds a reply out of it, and it is the one function here that lays
out a grid of its own. That exception is bounded and worth stating: the phrase's
**start** is a bubble's own entrance, handed in by the clip from its own beat
list, and its **length** is read off the reply's copy — the note count is the word
count with a floor of three. Only the spacing between notes inside the phrase is
invented, because no plan in the repo knows it. `confident` is the second reply
from the same mascot: a tone lower and wider steps, so it spans more than an
octave where the first spans a fifth. Same voice, more of an opinion in it.

`cuesFromScenes` reads the scene plan **by shape and step kind, never by a part's
name**, so a clip that draws a coin gets a coin landing without telling this file
anything, and a clip that draws two gets two.

**Eight of the twenty two are the character rather than the furniture**, and
post12, post13 and the mascot module are what asked for them: `hi`, `fart`,
`giggle` and `glitch` for the first, `mumble`, `sigh` and `annoyed` for the
second, and `titter` for the laugh pose. They are the only sounds in
the file allowed to be funny, and the rule that keeps them inside the house is
that none of them is bright — the giggle is the highest thing here and it is
still low passed under four kilohertz, which is where everything else has its
ceiling too.

`mumble` is the interesting one and it is post13's whole floor. The brief asked
for the teacher in an old cartoon: bla bla bla, low, wobbly, syllable like
pulses, never a word. **That voice is a trombone with a plunger over the bell**,
and what makes a noise read as speech is not the pitch, it is the **formants** —
the two resonances a mouth puts on a buzz, which move while the mouth moves and
which are the whole of what a vowel is. So it is a formant synth rather than a
filtered oscillator: sixteen harmonics of a 132 Hz buzz, each weighted by two
gaussian windows sitting on `f1` and `f2`, and both windows slide across the
syllable. Slide them from one vowel toward another and the ear hears a mouth
changing shape, which is a syllable; hold them still and it is a chord.

Four things keep it a mumble rather than a word. **It is low** — the low pass is
1150 Hz, under the second formant of most vowels and well under every consonant
there is, so there is no top end to put one in and it can never accidentally say
something. **It wobbles**, on two periods that are not multiples of each other.
**Every syllable is a different shape**: `shape` indexes a small table of vowel
moves and the clip walks it, so consecutive pulses are bla, bleh, bluh rather
than one buffer repeated. **And it has no attack** — 20ms in and 40ms out, both
on a raised cosine, because a syllable of speech starts with a mouth opening,
and a click at the front would be a consonant.

**And post15's two are at the two ends of the table.** `tick` is a foot: `key`
with the body taken out, because a plastic cap on a board has a board under it
and an insect's claw has nothing. Three milliseconds of band passed noise and a
very short pulse, over inside a thirtieth of a second, at -37 dB — the quietest
thing in the file. Its onset is held off the front of the buffer by the length
of the fade that is about to go there: every other sound here swells or has a
body under it, so two milliseconds of taper costs them nothing, and this one
**is** its own attack — taking the first two off the front took 37% of the peak
with them.

`crunch` is something being eaten, and it is the only sound in the set that has
to carry a beat with nothing else on the screen. So it is two events struck
together like the coin, for the same reason — one bite is one thing happening to
one object: eight milliseconds of band passed noise, and a note falling from f0
to f1 inside its own length, because a mouth closing is a cavity getting smaller
and a cavity getting smaller drops in pitch. **The flutter is what makes it
chewing rather than a bleep** — the note is amplitude modulated at 29 Hz, deep
enough to grain it and not deep enough to gate it into a train, which is the
`servo` rule landing in the same place for the same reason.

`sigh` is `hi` saying the opposite thing: one note falling 560 to 300 Hz instead
of two rising, fast first and slow after because that is what running out of
something sounds like, with a vibrato that dies out and a tenth of breath noise
under it. `annoyed` is two **flat** notes a tone apart — flat is the point, since
every other voice in this file glides, and a thing that refuses to glide reads as
a thing that cannot be bothered.

**`titter` is `giggle` held down, and it is the first sound in this file a piece
of `lib/mascot.mjs` asks for rather than a post file.** It is the same one note
of a three note laugh, fired three times with `step` 0, 1 and 2 so the pitch
climbs a whole tone each time, and the module places the three on the first three
bounces of its own laugh pose.

Soft is four changes and **none of them is the level**. It starts lower and
climbs less far, 620 to 740 against the giggle's 780 to 980, so the ladder sits
at the bottom of a small robot's range rather than at the top of it. The third
harmonic comes down from 0.26 to 0.14 and the low pass from 3.8k to 2.2k, which
between them are most of what takes the edge off a sine — the harmonic is what
makes the greeting read as a device rather than as a tone. And the attack is
stretched from two and a half milliseconds to eight, because a fast attack is a
bleep and a slow one is a breath; that is the only number in it a listener would
call soft rather than quiet. It is 68 milliseconds against 62, because a soft
sound needs a tail or it is a click.

The level is the fifth change and it is in `GAINS`: -29, four decibels under the
giggle. post12's laugh **is** the line, with no voice over it and nothing else in
the frame carrying a beat. This one plays while a head is bouncing and a hand is
moving, so the picture is already saying it, and at the giggle's level the sound
would be saying it a second time and louder.

Output is 24 bit PCM — the plainest thing every tool in the chain reads without
an opinion, with enough headroom that the quietest sound in the set is still 60
dB above the last bit. `loudness()` reads `ebur128` off the written file, so the
number in the report is the same meter a broadcaster uses rather than an RMS
with a nice name.

### `analyze.mjs` — the reference analyzer

Point it at a video somebody else made and it writes down how that video is
built, into `demo/out/analysis/<name>.md`.

```
node analyze.mjs path/to/reference.mp4
node analyze.mjs ref.mp4 --model=small --scene=0.24
node analyze.mjs ref.mp4 --words=out/voice/line.json   a word list you already have
node analyze.mjs ref.mp4 --no-whisper                  skip the transcript
node analyze.mjs --install-whisper                     set the transcriber up, once
```

It reads. It never writes to the file you give it and it never uploads it.

Four passes, and the report says at the top which of them it managed:

1. **The file.** Duration, resolution, frame rate, whether there is sound.
2. **The cuts.** ffmpeg's own scene score, thresholded at `--scene`, 0.28 by
   default. Every shot length is printed as a bar, and the scores that nearly
   made the threshold are printed too, so the threshold can be argued with
   rather than trusted.
3. **The words.** faster-whisper with word timestamps, in a virtualenv under
   `out/`. `--install-whisper` builds it, in one command, into a folder that
   deleting `out/` undoes.
4. **The frame.** Stills at every cut and on a cadence, written next to the
   report, then read with tesseract if it happens to be on the machine.

Then two sections that are the point of the exercise: **the caption cut**, which
is the same transcript put through `lib/captions.mjs` so the reference's cadence
and ours can be read in the same units, and **what to build to**, which is the
skeleton as numbers — length, cut rate, when the first word lands, and words per
second against the 2.3 our own voices run at.

**Both passes that can be missing have a real fallback, and the report says
which one it used.**

- No transcriber, no model, or `--no-whisper`: ffmpeg's `silencedetect` splits
  the audio into speech and pause, which gives the rhythm of the delivery —
  phrase lengths, breath lengths, when the talking starts — without any of the
  words. That is most of what a skeleton needs.
- No tesseract: an edge density reading of the top, middle and bottom third of
  each still. It does not read text and does not pretend to. It says which band
  of the frame is carrying the detail, which is enough to tell a talking head
  from a full screen caption.

`--words` is the normal case for anything we scripted ourselves: hand it the
sidecar `lib/voice.mjs` wrote and it skips transcription entirely.

**The transcriber's weights are not in the package.** The first run downloads
them from huggingface into `out/whisper-models`. A machine that cannot reach it
gets a sentence saying so, and the phrase rhythm, rather than a python stack.

One ffmpeg trap worth keeping: the scene pass uses `-vf`, not `-filter_complex`.
A complex graph needs an explicit `-map`, and without one nothing reaches the
null muxer, so the pass runs, prints nothing, and reports a video with no cuts
in it. That failure looks exactly like a correct answer.

### `captions-test.mjs` — the three styles, judged

```
node captions-test.mjs                 all three, 1080x1920, 60fps, 5s each
node captions-test.mjs pop             just one of them
DEMO_FPS=12 node captions-test.mjs     the fast preview pass
```

Three five second clips into `demo/out/`, plus a still of each style in **both
themes** into `demo/out/verify-captions/`. About a minute for all three, and the
voice is cached in `out/voice/` so a second run does not go near the endpoint.

Two things it does that no other script in here does, both on purpose:

- **The voice is muxed into the file.** Every other clip renders `-an` because
  sound is added in the edit. A caption test is the one case where the sound is
  the thing being tested: the claim is that the words land on the frames they
  are said on, and a silent clip cannot show that.
- **The copy is different per style**, because the styles are not
  interchangeable. `pop` wants short declarative beats, `type` wants a sentence
  that reads, `count` wants figures. One line for all three would flatter one of
  them and libel the other two.

There is no mascot in it. He would be the thing being looked at, and the caption
is the thing being judged.

The guards are the clips' guards plus four of its own: the safe area four times
a second against the drawn ink, never more than one group on screen at once
except in `type` where stacking is the style, the accent painted in `pop` and
`count` and **never** in `type`, and something actually moving between two
frames — because a still frame passes every other check in the list.

### `scenes-test.mjs` — the scene strip

```
node scenes-test.mjs                        the strip, 1080x1920, 60fps
DEMO_FPS=12 node scenes-test.mjs            the fast preview pass
node scenes-test.mjs --scene=money          one beat, post6's own timing
node scenes-test.mjs --scene=money --blur   the same, with the shutter open
node scenes-test.mjs --blur=6               the whole strip, six subframes
```

**`--scene=<id>`** renders one of post6's scenes on its own, at post6's own
timing rather than the strip's compressed gaps — the beat the clip actually
plays, shifted to start at the top and given the same tail. It is the unit under
a microscope: five seconds instead of ten, so a change to the motion engine can
be looked at twice in the time one strip takes. The output is named after the
scene, so a solo render never overwrites the strip.

**`--blur`** is true motion blur, and it is a capture change rather than a
filter. Every output frame is captured N times at N evenly spaced instants inside
its own 1/60th of a second — the virtual clock, the rAF shim and the gsap
timeline all stepping by `1/(fps*N)` — and the N stills are averaged into one
frame before encoding. That is what a shutter does. `--blur=6` picks N; four is
the default and is where a 60fps shutter stops looking like four ghosts and
starts looking like one smear.

It costs N times the screenshots, which are the whole cost of a render, so it is
**off by default**: a preview does not need it and a final render is not worth
shipping without it. Measured on the money beat at 60fps, 5.34s, this machine:

| | captures | capture | blend | total | per frame |
|---|---|---|---|---|---|
| `--scene=money` | 320 | 37.7s | — | 37.7s | 118ms |
| `--scene=money --blur` | 1280 | 149.6s | 14.6s | 164.2s | 513ms |

**4.4x for four subframes**, of which the blend is 9%. Both are 1080x1920, 60fps
and 5.34s — the shutter does not change the resolution, the rate or the length,
and a run fails rather than encodes if it does. Both reported the same clearance
and safe area numbers, because those are sampled on the frame's own instant
rather than on every subframe.

The blend is `tmix=frames=N,trim=start_frame=N-1,setpts=PTS-STARTPTS,framestep=N`
— a rolling mean of the last N, the first N-1 thrown away because their window
reaches back before the clip, then every Nth of what is left, which is exactly
the set of means of whole output frames. It is written with `trim` and
`framestep` rather than a `select` expression because `select=eq(mod(n\,4)\,3)`
needs its commas escaped past three layers of quoting and silently parsed as a
filter called `4)` the first time. Checked numerically on sixteen flat grey
subframes at levels 0,16,…,240: four frames out at **24, 88, 152 and 216**, the
exact means of the four groups. Every run also fails rather than encodes if the
blend does not produce exactly one frame per captured frame.

`post6.mjs`'s five pictogram scenes, back to back with the dead air taken out,
into `demo/out/scenes-test.mp4`, plus one settled still per scene into
`demo/out/verify-scenes-test/`. **10.19s and about a minute and a half.** It
exists so the scene layer can be judged without scrubbing a twenty two second
clip with a voice on it.

**It carries the scene layer's own sound and nothing else** — the same
`cuesFromScenes` post6 calls, so the whoosh, coin, click, sweep, ding and closing
hum are the same sounds at the same points in the same scenes. No voice, and no
caption pops, because there are no captions in it. It is normalised to **-20
LUFS**, six under the clip, and that is deliberate: in post6 these sit 25 dB down
under a voice and there would be nothing to judge at that level on their own.
What is being judged is the relationship between them, which is fixed in `GAINS`
and survives any master gain; the absolute level an effect reaches in the
finished clip is in post6's own mix table.

**It is post6's own scenes, imported, not copied.** `SCENES` and `SCENE_BOX` come
out of `post6.mjs` rather than being duplicated here, because a second copy of a
scene table drifts from the first inside a week and then the strip is judging
something that is not what ships. That is why `post6.mjs`'s run block now sits
behind a `main()` guard: importing it must not render a clip.

**The frame is production's frame, exactly** — 1080x1920, light theme, the same
vignette, the block at the same place and size, the wordmark where it always is.
What is missing is the voice, the captions and the mascot, because those are the
three things this is not for. In their place is one line of system mono naming
the scene and the seconds it holds in the real clip, so a judgement made here can
be taken straight back to the table in `post6.mjs`. **It sits on y=495**, which
is the caption ceiling — the highest any card in post6 can ever draw — so the gap
this strip measures between the lowest scene shadow and the top of that line is
the same gap the clip has between the scenes and its captions. It is a reference
mark that happens to be readable rather than a caption that happens to be
somewhere.

**The compression is on the gaps only.** The five scenes run 23.3s end to end at
their own speed. Every step keeps its own duration — a coin still falls in 0.58s
and a lock still seats in 0.30 — and what shrinks is the silence between them
that the voice used to fill, to 33% of itself. Scaling the durations too would
give a ten second strip of a layer moving at three times the speed of the one
that ships, which is worse than useless: it would look fine and the real one
would not. **The strip is therefore whatever length the moves add up to**, and
the run prints it rather than promising a number.

The guards are the scene layer's, not the clip's — there is no voice to be in
sync with and no caption to clear. What is left is the same `sceneMotion`
preflight at the same limits `post6.mjs` uses (a strip that passed on numbers the
clip would fail on would be judging nothing), the same liveness proofs, the ink
and the shadow each against their own border floor, nothing reaching the label,
and the label itself legible on more than 60% of frames — a strip whose captions
never showed up would still pass every other check in the list.

### `lib/mascot.mjs` — the mascot reactor

**A rig, not a sprite sheet.** The face is drawn once from the geometry table in
`skills/page-builder/SKILL.md` and every part of it — the card, each eye, each
lid, each brow, the shadow, the glow, the bubble — is a channel on one gsap
timeline. A state is a named piece of that timeline with an entrance, a hold that
has its own idle, and an exit. `mascotFrame(plan, t)` is the whole animation and
it is a function of time and of nothing else.

Two things use it: our own renders import the module and drive it beside the
captions and the pictograms, and `mascot-export.mjs` renders the same states as
standalone 1080×1920 overlay clips with real alpha.

**The motion core is `lib/pictograms.mjs`'s.** Same four house curves plus
`land`, same volume-preserving `sq` channel, same `lift` driving the same shadow
model, same "no css transition, no css animation, on anything that has to hit a
mark". Two curves are added and they are not inventions: `btk.shut` and
`btk.open` are `index.html`'s own blink — `1-(1-LID)p²` in and
`LID+(1-LID)(1-(1-q)²)` out — written as beziers, because none of the four house
paths is an accelerating close and a lid that overshot would open past the top of
the eye.

**gsap does not run in the page here, and that is the one real difference.**
Pictograms serialises its timeline builder into the browser because DrawSVGPlugin
has to own the dash — the page has to hold the real animation for the one channel
node cannot compute. Nothing in the mascot is line drawn, so node computes every
number and the page writes it to an element. One engine, one reader, and the
whole clock-sync apparatus that file needed — the root-timeline pinning, the rAF
filter, the `sync()` probe, the per-frame parity check — is not here because
there is nothing to be out of sync with.

#### The rig

| | |
|---|---|
| card | the head. A rounded rect on the 64 grid that tilts, turns, squashes, stretches, translates, scales and throws its own shadow. |
| eyes | two slabs, each with its own x, y, scale x and scale y, so they look, squint, widen, close and squash independently. |
| lids | a card-coloured slab above each eye that comes down over it. A blink is the lid arriving, never the eye shrinking. |
| brows | short strokes above the eyes, opacity 0 by default. `surprised` and `unimpressed` are the only two states that use them. |
| turn | the flat three quarter turn, −1 to +1. Zero is straight on, +1 a full turn to the mascot's right. |
| hands | two floating gloves beside him, opt in and off by default. Not the hand below, which is a mouth. **Ten traced paths off the sheet**, one a pose a side — see The floating hands. |

**`radius` is the one number the site does not have.** At `0.5` the plate's `rx`
is half its side and a rounded rect *is* a circle, which is the mascot as
shipped. The rig carries the number so a card is possible without redrawing
anything; the default draws the face. Everything else in the geometry is the
skill file's table and the self-test checks all six ratios against it.

**The brows are demo-only.** The page spec's mascot is a circle and two slabs and
nothing else, and nothing in this file reaches `index.html` — same footing as the
drop shadows, which that spec also bans on the page and which `lib/pictograms.mjs`
has used since the sixth clip.

**The eyes lead and the head follows.** Every pose tween is built twice: once on
the lead channel at its own time, once on the lag channel `LAG` (three frames)
later. The card is drawn with the lag channel, so the body is three frames behind
the rig, and the eyes take `LEAD` (0.40) of the difference back as an offset. On
a snap they arrive first; on a settle the offset falls to zero on its own. It is
overlapping action written as arithmetic rather than as a second animation that
can drift. The fraction is tuned to stay under its own cap: a lead sitting on its
clamp would have a flat spot exactly where the motion is fastest.

**Anticipation runs forward from the mark, not backward into the frames before
it.** A state that started moving before its own mark would be animating during
the state before it, and it makes `entryFrames` mean what it says — the frames
from the mark to the arrival, wind-up included.

**Idle life is always on and is a separate layer.** Drift on two incommensurable
periods, breathing at 1.6% (the ceiling is 2%), micro-saccades on a seeded
schedule, and the blinks. Pose channels rest at zero between states; idle channels
never rest, so a state can be written as if it were the only thing happening and
still never freeze during its own hold. The drawn value is rest plus pose plus
idle, and the lid folds the two together — a blink during a half-lid closes the
remaining gap rather than fighting it.

#### The turn

**A flat three quarter turn, cheated the way an After Effects character rig
cheats one.** Nothing in it is 3D. `turn` runs from −1 to +1 and **every value
between them renders** — there is no pose table and no second drawing, only
arithmetic on the number, so 0.37 is as real a turn as 1. Five flat moves happen
together on that one number:

| | |
|---|---|
| the card squeezes | 7.5% of its width at a full turn. It is the one deformation in the file that is **not** volume preserving, deliberately: a turn is a projection, not a squash, and a head that got taller as it turned would read as rubber. |
| both eyes travel the way the head turns | and the **trailing** one travels further — `shift + wrap` for it, `shift` for the leading one. |
| the gap closes | 21 grid units to 16.5. This is the piece that does the work: an eye pair that merely slid across a circle reads as two stickers on a plate; one whose *gap closes as it slides* reads as a face turning, because that is what perspective does to two features on a curved form. |
| the far eye foreshortens | 42% narrower and a tenth shorter at a full turn. |
| the head tilts and the shadow slides | 3° into the turn, 4.5px across, because the mass moved. |

**Which eye is which is worth being exact about, because it was wrong once.**
Turn the head so the nose points to screen right: the cheek that comes toward
camera is on screen *left*, and the cheek that rotates away is on screen
*right*. So the eye carried nearest the right-hand silhouette is on the **far**
side of the form — it foreshortens, and it travels the *smaller* distance
because it is wrapping around the head. The eye trailing behind it is the
**near** one: full width, and the *larger* travel, crossing the centre line as
the broad side of the face swings into view.

The first build had the scale on the wrong one of that pair — the trailing eye
was being squeezed and the leading eye left full, which reads as a face whose
near cheek is collapsing. The shifts were right; only the scales were swapped. A
rendered sweep is what caught it, and the self-test now asserts the narrow eye is
the leading one **at both ends**, because a sign error is invisible if you only
check one. Measured across a sweep, in device px at 1080 wide:

| turn | screen-left eye | screen-right eye |
|---|---|---|
| −1 | **29.2** | 49.7 |
| −0.7 | **34.7** | 49.1 |
| −0.35 | **43.9** | 51.6 |
| 0 | 51.2 | 51.2 |
| +0.35 | 51.6 | **44.1** |
| +0.7 | 49.1 | **34.9** |
| +1 | 49.8 | **29.3** |

At a full turn the near eye travels **38 device px** and the far eye **56**, on a
240px head. The brows go with their own eye at 85% of its travel, or a turned
face would have its brows over the bridge of a nose it does not have.

**Every facial feature is clipped to the head's own outline**, and that is a fix
rather than a precaution. The lid is an oversized card-coloured slab — wider and
twice as tall as the eye, so it covers it completely at any scale — and
`surprised` takes the eye to 2.6× its height, which drags that slab far above the
eye line. Put a turn on top and its top corner leaves the head; being
card-coloured, it stops being invisible the moment it is off the card, and a
small block of face colour appears in the background near the crown. That
shipped. The clip path is the plate's exact geometry so the two can never
disagree about where the head ends, and the eye clamp now measures room at the
**narrowest point of the eye's vertical span** rather than at its centre, because
a widened eye reaches a height where the plate is a good deal narrower.

The geometric guard is the other half: `mascotMotion` reports the signed distance
of the worst-placed feature corner from the silhouette, and the render **fails**
if it ever goes positive. A clip quietly trimming a pose is still a pose that
does not fit. Worst measured is 3.61 units *inside* the edge in the test clip, and
2.46 units inside in a stress plan that puts every state through ±0.85.

**At turn zero the two eyes are one shape twice.** Both measure 51.2 × 17.5 px,
identically, on every frame — asserted on the rig rather than on a screenshot,
because a rendered frame legitimately carries the head's own roll and breathing,
which tilt and scale both eyes together. That is the head moving, not the eyes
differing, and a pixel test would call it a fault: 0.55° of idle roll across a
42px eye separation is 0.40px of vertical difference, which is exactly what the
render shows. A companion check asserts straight-on carries no squeeze, no shift,
no tilt and no foreshortening, so the turn maths cannot distort the neutral pose.

**The eyes read the lead channel and the card reads the lag channel**, so the
gaze arrives before the head does on every turn — with no code that is about
turning specifically. It falls out of the same three-frame lag the rest of the
rig already had.

**`turn` is the one channel an exit does not reset.** Every other channel is a
gesture and goes back to nothing; the turn is *where he is facing*. A head that
snapped back to camera at the end of every state would make `turn-away` a twitch
instead of a place he went, and it is also what lets a sweep across several marks
read as one continuous ramp rather than as marks fighting their own exits.

**The resting bias is one config value.** `TURN.bias` is `0.35` — a third of a
turn to the mascot's right, so that standing in the bottom left corner he looks
*into* the frame rather than out of it. `planMascot` flips the sign on its own
when `pos` ends in `right`, and an explicit `bias` overrides both:

```js
planMascot({ ..., pos: 'bottom-left'  })   // bias  +0.35, looks right, into frame
planMascot({ ..., pos: 'bottom-right' })   // bias  −0.35, looks left,  into frame
planMascot({ ..., bias: -0.2 })            // say it yourself and that wins
planMascot({ ..., bias: 0 })               // dead straight on
```

To move him to the other corner, change `pos` and nothing else — the bias follows.
It is one number in one place precisely so a second copy of it cannot go stale.

**Composition is guarded rather than hoped for.** A state may move the eyes on
its own — `curious` puts them 2.1 units across — and a state's offset plus a full
turn could walk an eye off the side of the face. Every eye is clamped to leave
1.2 grid units of card outside it, measured against the plate's own width *at
that eye's height*. A plain turn never reaches the clamp (0 frames across the
whole sweep); `curious` held at a full turn does, which is the case it was
written for. The preflight counts clamped frames, because an eye sitting on its
clamp is an eye that stopped moving, and a flat spot is the one thing that would
give the cheat away.

#### The states

Seven, each a different silhouette at a glance with the sound off. Every one of
them declares the single channel it should be judged on and the value it is
supposed to arrive at, which is what the preflight measures it against — a nod's
read is in y and a tilt's is in rotation, and one shared metric would flatter
both.

| | | mark |
|---|---|---|
| `neutral` | level, centred, breathing | `sc` 0.972 → 1 |
| `curious` | tilts in and leans into the tilt, eyes up, one eye wider than the other | `rot` → 9.5 |
| `surprised` | pulls back and down, snaps up with a stretch, eyes nearly round, brows high and angled | `y` → −9.5 |
| `thinking` | turns up and away, gaze off camera, one eye at half lid, a slow scan across the hold | `rot` → −8 |
| `agreeing` | two nods, weight on the way down, contact squash at the bottom of each, warm half-blink on the beat | `y` → 8.6 |
| `unimpressed` | sinks and drifts away, lids at half, side eye, brows low and turned out | `lid` → 0.54 |
| `delighted` | two hops with real lift, eyes squash into arcs, a small turn on the way up | `y` → −12.5 |
| `turn-away` | turns off to the side and holds there, still alive — the drift, saccades and blinks never stop | `turn` → ±0.85 |
| `snap-back` | whips back to camera, overshoots past centre, settles. The reaction beat. | `turn` → 0 |

`turn-away` parks at 0.85 rather than at 1 for a reason: `snap-back`'s
anticipation is a turn *further away*, and 0.17 of a 0.85 move lands the wind-up
at 0.995 with the channel's ceiling untouched. The pop curve then carries it
through zero and about a tenth past, so he turns a shade beyond camera and comes
back — which is what a head does when something catches it.

Measured at 60fps, on a plan that runs every state in turn. `anti` is the wind-up
in frames, `entry` the frames from the mark to the arrival with the wind-up
included, `over` how far past the mark it goes as a share of the move, `settle`
how long from the arrival until it stays inside a 2% band:

| state | anti | entry | over | settle | mark |
|---|---|---|---|---|---|
| `neutral` | 0f | 7f | +10.7% | 150ms | `sc` → 1 |
| `curious` | 5f | 12f | +13.1% | 167ms | `rot` → 9.5 |
| `surprised` | 6f | 11f | +14.2% | 233ms | `y` → −9.5 |
| `thinking` | 4f | 12f | +12.5% | 183ms | `rot` → −9.5 |
| `agreeing` | 5f | 10f | +15.1% | 200ms | `y` → 8.6 |
| `unimpressed` | 0f | 24f | +0.0% | 0ms | `lid` → 0.54 |
| `delighted` | 4f | 10f | +12.7% | 317ms | `y` → −12.5 |
| `turn-away` | 4f | 11f | +12.0% | 183ms | `turn` → 0.85 |
| `snap-back` | 3f | 9f | +11.4% | 150ms | `turn` → 0 |

Squash peaks at 7.0% against an 8% ceiling, breathing at 1.60% against 2%, and the
worst-placed feature corner sits 4.24 grid units *inside* the head silhouette.

`neutral` is the only one whose mark is not zero at rest, because the only thing
it does is arrive at rest — the span it is measured over is its own entrance
rather than the distance from rest, which would be nothing. `unimpressed` is the
declared exception on the overshoot: it arrives on the heavy curve, and going
past the mark would be the opposite of what it means.

#### The marks api

A mark is a second on the clip's clock and a state to be in from then, optionally
with a bubble — or with a **run** of them. Everything else is worked out from the
state table and the gap to the next mark:

```js
planMascot({
  seconds: 20,
  marks: [{ t: 0.4, state: 'neutral' },
          { t: 3.1, state: 'curious', bubble: 'go on' },
          { t: 6.0, state: 'surprised', turn: 0.6 }],
  theme: 'light',
})
```

**A mark may say several things in a row**, and post11 is what asked for it: a
greeting in three languages, one on each language as it is named. At the ordinary
timings three bubbles need six and a quarter seconds of head room between them,
which is a fifth of a thirty second clip spent on one line, so a list runs on a
shorter profile — `in` 0.30, a hold floored at 0.30, `out` 0.20, so each one
lives 0.80s against the ordinary 1.20.

```js
{ t: 13.34, state: 'neutral', bubbles: [
    { t: 16.81, text: 'hey' },
    { t: 17.68, text: 'привет' },
    { t: 18.52, text: 'labdien' } ] }
```

Each `t` is a second on the clip's own clock, so a greeting lands on the word it
is greeting in. It is **opt in and nothing reaches it unless a mark asks**: a
mark carrying a single `bubble` string plans and renders exactly what it did
before this existed, which the self test asserts on the same numbers it always
did. `planMascot` refuses a list that overlaps itself, because the pill holds one
string at a time and two thoughts on one anchor would resolve by build order.

**The pill drops to the mono stack for anything that is not plain ascii.** Space
Grotesk ships latin and latin-ext and no cyrillic, so `привет` would otherwise
fall back one glyph at a time and set half a word in one face and half in
another — `index.html`'s own all-or-nothing rule, applied per bubble. post11
measures it rather than assuming it; see The eleventh clip for why
`document.fonts.check` is the wrong instrument for that question.

A mark may carry `turn` (where to hold the channel) and `turnFor` (how long to
get there). `planMascot` refuses a `turn` on `turn-away` or `snap-back`, because
those two author the channel themselves and two things writing one channel over
the same window would resolve by build order, which is not an answer.

**And a mark may carry `yap`, which is the hand talking.** `yap: true` runs from
that mark to the next one, or to the end of the clip on the last mark; a number
is a length in seconds. It needs `hand: true` on the plan and `planMascot`
refuses a yap without one rather than quietly doing nothing.

```js
planMascot({
  seconds: 4.98, hand: true,
  marks: [{ t: 0, state: 'neutral', yap: true },
          { t: 1.1, state: 'thinking', yap: true },
          { t: 2.42, state: 'unimpressed', yap: true, turn: 0.72, turnFor: 0.7 }],
})
```

Consecutive marks that yap are **one continuous mumble**: the windows are merged
before the cycles are laid across them, so the hand does not reset its phase at
a mark boundary. `plan.yap` comes back as a list of cycles with their own times,
which is what lets a clip put one syllable of sound on the frame the mouth opens
on. See The hand below.

The plan is plain json — printable, diffable, readable before a browser is
opened. `describeMascot(plan)` prints it as a card. A state's hold is stretched
to fill whatever room there is up to the next mark rather than leaving a gap
where nothing is driving the pose.

The shape of the module, split the same way `lib/captions.mjs` and
`lib/pictograms.mjs` are:

- **`planMascot(opts)`** runs in node, measures nothing, and refuses a plan that
  cannot be drawn.
- **`mascotFrame(plan, t)`** is the whole animation as a pure function of time.
  It returns the pose (the state's own motion with no idle in it), the card (what
  the head is actually drawn with), each eye's position, scales and lid, each
  brow, the shadow's scale, blur and opacity for this frame's lift, the glow
  multiplier, and the bubble.
- **`mascotMotion(plan, fps, seconds)`** walks every frame before a render and
  reports the biggest one-frame step in every channel, plus per state the
  anticipation, the entry, the overshoot and the settle. `describeMotion` prints
  it as a table.
- **`mascotCss` / `mascotMarkup` / `mascotPagePlan` / `mascotRuntime`** are the
  page half. `mascotPage` is serialised in with `.toString()` and installs
  `window.__mas`: `apply(frame)`, `theme(t)`, `bubbleSafe(vw,vh)`, `band()`,
  `caps()`.
- **`headRect(plan, frame)`** is where the ink actually is, in device px from
  each border, and **`stillMoment(plan, t)`** is a moment clear of every idle
  blink, for a poster frame.
- **`mascotCues(plan)`** gives the two sounds: a `pop` when a bubble arrives and
  a `ding` on an agreement beat, and nothing else, so the ding keeps meaning yes.

**And a mark may carry `hands`, which is a glove pose, optionally with a
`side`.** `hands: true` on the plan draws the pair and `planMascot` refuses a
pose without one, the same way it refuses a yap without a hand. The two layers
are independent, so a mark may carry a state and a pose at once and the room for
each is measured to the next mark of its own kind:

```js
planMascot({
  seconds: 20, hands: true,
  marks: [{ t: 0.4, state: 'neutral',     hands: 'rest' },
          { t: 3.1, state: 'curious',     hands: 'wave' },
          { t: 6.0, state: 'unimpressed', hands: 'facepalm', side: 'left' }],
})
```

`side` is `left`, `right` or `both` — which hands are on screen — and it
persists across marks the way the turn does. See The floating hands below.

#### The hand — opt in, off by default

He has no mouth. The head is a plate and two slabs and the page spec says so, and
a mouth is the one piece of anatomy that would turn a face into a character. So
when a clip needs him to be *talking* rather than reacting, **a hand stands in for
one**: it sits low on the face where a mouth would be, a little off centre, and
it opens and shuts. That is the yawning emoji's gesture, and it reads as a mouth
for the same reason that one does.

`hand: true` on the plan draws it; nothing else changes. With it off there is no
hand in the markup, no rule in the css, no tween on the timeline, no key in the
frame and no line in the report — see The hand is off below for how that is
proved rather than claimed.

**Two parts and one hinge.** The fingers are the long slab and the thumb the
short one, both filled with `--eye`, rounded to half their own height: the same
ink, weight and corner as the irises above them. There is no arm and no palm.
They overlap 2.6 units behind the hinge so the wrist is one rounded lump rather
than two bars meeting at a point. At rest the pair lies flat and reads as a
closed mouth; open, the face shows between them as a wedge — **the gape is the
face showing through, not a hole cut in it**, which is what keeps the hand a
hand.

**Three things a rendered frame corrected, and they are the whole design.**

- **The fingers barely move and the thumb does the work.** Opening the two slabs
  by similar amounts makes a chevron, and a chevron on a face is an arrowhead:
  two cuts of this came back reading as `>` and then as `<`. What a yapping hand
  actually does is the opposite of symmetric — the four fingers are held flat and
  the thumb taps up and down underneath them. So the fingers swing 6 degrees and
  the thumb swings 35. It costs nothing in gape, because the gape is the sum of
  the two, and it buys the whole read.
- **The wrist is on the left and the hand points right**, the way the emoji holds
  it, so the fingertips point across the face and the opening faces the empty
  half of the chin.
- **It is centred on 29.9 of the 64 grid**, two units left of the face's own
  centre and under both eyes rather than beside one. The first placement had it
  under the left eye with the right half of the chin empty and it read as a stray
  mark.

**The gape is asymmetric because the face is.** The eyes sit at 38.5 and the
plate ends at 62, so there are nine units above the hinge before the fingertip is
in the eye and eleven below before the thumb is off the chin — and the plate is a
circle, so the room below narrows as the thumb travels. At a full gape with the
overshoot on top the fingertip clears a resting eye by 2.7 units and the thumb
clears the silhouette by 2.4, or 2.5 at a full turn either way. **The one pose it
does not clear is `surprised`**, which brings an eye's lower edge down to 43.3,
about half a unit into the fingers. No clip pairs the two and it is written down
rather than guarded: the honest fix is a smaller head or a bigger grid.

The mouth travels with the turn at 0.6 of the near eye's own travel and takes
none of its foreshortening, because a hand is held in front of a face rather than
painted on it. That number was 0.45 until a frame showed the eyes crowding one
side while the mouth stayed put, which reads as two things rather than one head.

##### The yap is a plan, not a repeat

One cycle is three tweens and a gap: **open** on `drift`, which leaves fast and
coasts in; **settle**, a short slide back from an 8% overshoot on the calm curve;
and **shut** on the calm curve. That ordering is the "quick and a bit lazy" — a
hand that shut as fast as it opened would be a mechanism. Every cycle draws its
own gape and its own length off a seeded prng, so no two are the same, and the
seed is the plan's own xored, so adding a hand cannot move a blink or a saccade.

**The overshoot is geometry rather than a curve, and that is a fault this part
paid for.** The obvious first cut opened on `btk.pop`, the house curve every
state's entrance arrives on. It is the wrong curve here and the numbers say so:
pop reaches 1.1 by 36% of its own duration, so over an 85ms open at sixty it puts
the whole move into **one frame** — measured, the gape went 0.05 to 0.89 between
two consecutive frames, which is not a hand opening, it is a hand teleporting.
Pop is written for a move that happens once. A gesture that repeats three times a
second cannot borrow it.

It is a list rather than an infinite repeat for two reasons. **The sound has to
land on the picture**: a clip puts one syllable of mumble on each cycle's own
start, so the mouth and the voice are the same event rather than two things laid
on the same grid, and an infinite repeat has no times in it to read. And **the
windows have to join**, so consecutive marks that both yap are one continuous
mumble rather than one train per mark with a stutter at every boundary. A cycle
is only kept if it can *finish* inside its window: a hand caught half open on the
last frame is a hand that stopped rather than a mouth that closed.

`mascotMotion` reports the hand: how many opens the drawn angles actually make
against how many the plan asked for, the widest and narrowest gape, the slab in
device px, the gape between the tips, and **how far the faster of the two tips
travels between two frames in css px**, which is the unit the speed argument is
had in. A blink's lid is the rig's own fastest move at about 3.5 css px a frame
at sixty; the thumb is held under 8.

#### The floating hands — opt in, off by default, and traced rather than drawn

**Two cartoon gloves with no arms.** Not the hand above: that one is a pair of
slabs standing in for a mouth and it is a piece of the head. These are a pair
beside him, and a clip may carry either, both or neither.

`hands: true` on the plan draws them; nothing else changes. With them off there
is no glove in the markup, no rule in the css, no tween on the timeline, no key
in the frame, no line in the report **and no change to where the head stands** —
see The gloves are off below for how that is proved rather than claimed.

##### The drawn version was rejected, and the finding is worth more than the fix

The first cut built a glove out of **six rounded rects** — a palm, four fingers
and a thumb — placed off ratios measured out of the reference sheet with
`demo/out/poses/measure-ref.mjs`. The ratios landed. The mitt came out 0.383 of
the head against the sheet's 0.381, the palm's width to a finger's length 1.83
against 1.86, the gap a quarter of a finger either way. Two rounds went into
those numbers and every one of them is in the table this section used to carry.

The review rejected it anyway: `thumbs-up` read as a stump and `panic` read as
two fists.

**Measuring a reference tells you how big to make the parts. It cannot tell you
that the thing is not made of parts.** A glove in that drawing is one closed
outline with a tapered wrist, knuckles that swell, a thumb that joins the palm
rather than sitting on it, and fingers that bend at a joint. Five rounded rects
stacked in exactly the right proportions are five rounded rects, and at a fist —
which is what `thumbs-up`, `point` and `panic` all are — a primitive has nowhere
to hide. No further tuning of those numbers was going to close it.

##### Ten traced paths, and nothing in the file draws a hand

`demo/assets/hands/*.svg` — `rest-left`, `rest-right`, `wave`, `thumbs-up`,
`facepalm`, `shrug-left`, `shrug-right`, `point`, `panic-left`, `panic-right`.
Each is a 400 by 400 frame holding one filled path, traced off the sheet. They
are imported into `HAND_SHAPES` in `lib/mascot.mjs` **with their coordinates
untouched**, wrapped at eighty columns and otherwise exactly as the files hold
them.

A pose is now **a shape rather than an arrangement**. Nothing in the module
draws a hand, computes a knuckle or curls a finger; the pose table says which
path, where it goes, which way it is turned and how big it is, and that is the
whole of it. `point` is the one with two subpaths and it carries its file's own
`fill-rule="evenodd"`, which is what draws the folded finger as a line inside
the fist rather than as a shape beside it.

**Three poses carry a path a side and five are mirrored.** `rest`, `shrug` and
`panic` are two handed and the sheet draws both hands, so both are imported and
each hand gets its own; `wave`, `thumbs-up`, `facepalm`, `point` and `laugh` are
one handed and the second hand is the first one flipped, which is `mir` on the
frame and a sign on the page's own scale.

Five one handed poses off **four** drawings: `laugh` is the facepalm's own file
turned onto the mouth, and it is the only pose in the table that borrows one. So
the markup carries a group per **drawing** rather than per pose — seven a glove,
not eight. Writing it per pose would put two elements in a glove with the same
id, of which a browser shows the first and holds the second forever, which is a
bug with no symptom until somebody counts the children.

The sheet's own pairs are drawn twice rather than reflected, and they agree with
each other's mirror to within **0.8 grid units** — a pixel and a half at the
corner size. Importing both instead of flipping one is worth that much: it is
the drawing rather than a derivation of half of it, and that difference is
exactly the hand-drawn wobble the primitives could not produce.

##### The wrist is the anchor, and it is each file's own

A glove is placed, turned and scaled about **its own wrist** rather than about
the middle of its box. A wave rocks at the wrist, a hand hangs from one, and a
pose turned about its centroid is a hand being spun rather than held.

Every wrist is a measured point in its own file's 400 unit frame, and
`demo/out/poses/measure-traced.mjs` is what measures it: it rasterises the path,
projects the ink onto the direction the wrist points in, takes the outermost
nine per cent of that run and reports the band's centroid, which lands in the
middle of the stem rather than on the rounded cap. The direction is the one
judgement in the instrument and it is read off the drawing; everything after it
is arithmetic.

| file | wrist | which end it is |
|---|---|---|
| `rest-left` / `rest-right` | 195.6, 76.3 / 203.3, 76.3 | the top of the hanging wrist |
| `wave` | 202.8, 342.4 | the heel of the open palm |
| `thumbs-up` | 209.0, 349.6 | the base of the fist |
| `facepalm` | 132.0, 315.7 | the heel, bottom left |
| `shrug-left` / `shrug-right` | 328.4, 250.7 / 68.4, 254.3 | the inner end, toward the body |
| `point` | 155.1, 318.8 | the base of the fist |
| `panic-left` / `panic-right` | 117.4, 312.8 / 283.3, 311.6 | the heel, below the grip |

##### How big, and it is one number

`HANDS.box` is what a file's own 400 unit frame measures on the head's 64 grid,
and every pose is scaled by it, so the ten keep the sheet's own relative sizes
rather than each being fitted to something on its own.

At **32.5** the open hand — `wave`, the one pose in the sheet drawn flat to
camera, and the one every version of this part has been sized off — lands
**27.06 by 26.08 grid units** against the sheet's own 110 by 106 px on a 244px
head, which is 27.0 by 26.1. That is the whole calibration and it is one number.

The guard moved with it. The drawn version guarded the **mitt**, because five
rects had a palm in them to measure and the whole hand's box swung by a third
between a fist and an open hand. A traced pose is one outline and has no mitt in
it, so the band is on the **larger side of each drawing's own ink**, which is
the measure that means the same thing on a fist and on an open hand:

| pose | ink, grid units | of the head |
|---|---|---|
| `rest` | 18.90 × 22.38 | 0.373 |
| `wave` | 27.06 × 26.08 | **0.451** |
| `thumbs-up` | 15.36 × 27.33 | **0.456** |
| `facepalm` | 24.67 × 23.04 | 0.411 |
| `shrug` | 24.75 × 18.86 | 0.413 |
| `point` | 23.62 × 21.73 | 0.394 |
| `panic` | 20.49 × 22.33 | **0.372** |

The band is 0.33 to 0.50. Under a third of the head a gesture stops registering
at phone size and the honest fix is a bigger hand rather than more detail in it;
over a half the pair stops reading as hands and starts reading as mittens.

##### The separation edge, and the line a traced outline buys

A white glove on a white face is one shape. **So the glove carries an outline in
the page colour, and it is painted only where the hand is over the head.** That
is two layers rather than a conditional: the ink layer is unclipped and fill
only, the edge layer is the same path clipped to the plate's own outline and
stroke only — the same clip path every facial feature already uses, so the two
can never disagree about where the head ends.

Over the background there is no edge at all, which is right twice over. The
glove is already a white shape on a dark page and needs nothing to separate it.
And a page coloured stroke out there would not be invisible anyway: the dark
theme's glow sits behind the head, so a stroke drawn in `#06070a` over it would
read as a dark ring rather than as nothing.

**The edge layer is `fill:none` now, and the drawn version could not be.** Five
overlapping shapes had to paint the face colour *under* the stroke so a later
shape could cover an earlier one's outline; without it, `facepalm` came back as
five loops sitting on the face and `panic` as a row of them on the crown. One
closed path has no loops to hide. And the lines the sheet draws inside a
silhouette — the knuckle creases, the folded finger in `point` — arrive with the
path rather than as a side effect of the stacking order.

**`edge` is 0.75 grid units, which is three device px at the corner size and
3.47 at 148**, and it is thinner than the reference on purpose: that drawing's
own finger lines measure about 4.25 device px against a head this size, and at
that weight the lines are the thing you see rather than the hand. It is one
number for the whole glove, so the thickness is even everywhere by construction.

The path sits inside a group scaled by `box / 400`, so **the stroke is written
in the file's own units — `edge` divided by that scale — and what lands on the
screen is `edge` grid units.** That is one division in the css rather than a
`vector-effect`, which would refuse the head's own scale as well as this one and
leave the stroke the same weight at every size.

An even stroke is also why the hands cancel the card's deformation rather than
riding it. The card squashes and the turn squeezes it, both on x alone, and a
stroke under a non uniform scale is thicker on one axis than the other. So each
glove carries the inverse of the card's own two scales about its own origin,
which leaves the net transform on it uniform: it **scales with the head, tilts
with the head, travels with the turn, and does not deform.** The anchor is
deliberately *not* counter scaled, and that is the half of it that keeps the
pair attached — it is a point in the card's own space, so the squash moves it
and the turn's squeeze pulls it in as the silhouette narrows. On top of that the
pair slides its own share of the near eye's travel, because a hand held beside a
face goes with the head and goes less far than the features on it.

##### The eight poses, placed off the sheet rather than judged

The table is in card space on the same 64 grid the face is drawn on, and it is
written for the **screen right** hand. The screen left one is the mirror: `x`
becomes `64 - x` and `rot` becomes `-rot`. That is why every pose is written
once and there is not a sign anywhere in the table.

**`at` is where the acting hand's wrist ends up, and every one of the first
seven is read off its own panel in the sheet rather than chosen.** The eighth,
`laugh`, is the one placement in the table with no panel behind it, and where it
came from instead is in The laugh below.
`demo/out/poses/ref-grid.mjs` draws the card's own 64 unit grid over each
reference crop and the pose's own ink box on top of it, so a placement is a
number a hand is moved onto rather than a picture somebody remembers. The crops
are centred on the panel's head with the head at exactly 244px in a 640px box,
so the mapping back into card space is exact and needs no measuring.

That instrument moved every pose. **The first pass put the whole set about
fifteen units too high**, because the resting hands were placed by eye at the
head's middle and the sheet hangs them off the bottom of it — a resting hand's
ink runs from y 46 to y 69 on a head that ends at 62. `thumbs-up` was seventeen
units out on its own, `facepalm` fifteen, `panic` fourteen across.

Each pose is an entrance, a hold with its own beat, and an exit back to the
resting pair — the state table's own shape. Measured at 60fps on a plan that
runs every pose in turn under a neutral face: `anti` is the wind-up in frames,
`entry` the frames from the mark to the arrival, `over` how far past as a share
of the move, `settle` how long until it stays inside a 2% band.

| pose | anti | entry | over | settle | mark | both hands |
|---|---|---|---|---|---|---|
| `rest` | 0f | 7f | +9.9% | 117ms | `y` → 47.5 | yes |
| `wave` | 5f | 11f | +13.3% | 183ms | `y` → 44 | no |
| `thumbs-up` | 5f | 11f | +12.8% | 167ms | `y` → 66.5 | no |
| `facepalm` | 5f | 18f | +11.2% | 317ms | `x` → 45.0 | no |
| `laugh` | 5f | 18f | +11.2% | 333ms | `x` → 40.9 | no |
| `shrug` | 5f | 10f | +12.8% | 133ms | `rot` → -14 | yes |
| `point` | 4f | 9f | +13.7% | 150ms | `y` → 58.5 | no |
| `panic` | 11f | 32f | +4.2% | 83ms | `y` → 22.5 | yes |

`rest` is the declared exception on the wind-up and it is the same one `neutral`
is: the only thing it does is arrive at rest, and pulling away from rest first
would be a release rather than a gesture. Its entrance settles down from a unit
and a half above — a unit and a half rather than three, because an explicit
`from` is a value the channel is not at yet, so the mark's own frame carries a
step of exactly that size.

Two rows carry an argument of their own.

- **`facepalm`'s move takes 0.94s and the number is the travel.** The resting
  pair sits where the sheet draws it, out past the silhouette and low, so a hand
  coming across onto the forehead crosses forty two grid units — eighty five css
  px, most of the head. On the pop curve with a wind-up on the front of it the
  fastest frame of a move is about **seven times its average**, which is the
  ratio that decides every duration in this table. Anything under nine tenths of
  a second is a hand arriving as a smear.
- **`panic`'s entrance has two gears.** It is the pose that takes a hand from
  beside the head to the top of it, and as one tween that needed most of a
  second to stay under the ceiling — and a second is not a panic. So it is a
  lift on the calm curve for two thirds of the travel and then a short grab on
  the pop one. It reads better as well, because a big move with a change of gear
  in it is a hand deciding where to go and then getting there.

**`wave` is the one pose that is not where the sheet puts it, and it is on
purpose.** In the sheet the waving hand's wrist sits within three units of the
resting hand's: the gesture is entirely in the shape, because a wave's fingers
point up where a resting hand's point down. That is fine in a drawing and it is
a pop in a film — a hand that changes shape without travelling has not moved. So
the wave sits **3.5 grid units, seven css px, above where the sheet draws it**,
which is a lift small enough to still land inside the panel and large enough to
read as a hand being raised. It is scored on that lift.

##### The laugh — a hand over the mouth, and the one pose that moves the head

Every other pose in the table is a hand and nothing else. It arrives beside a
face that is doing whatever its own state says, the two layers never touch, and
that separation is most of why a pose composes with any state rather than with a
chosen few. A laugh is not that. A hand held over a mouth with a face sitting
perfectly still under it is a hand held over a mouth; what makes it a laugh is
the head going with it.

**It is the facepalm's drawing again, and it is the only pose that borrows one.**
That is an argument rather than an apology. A laugh needs a *flat* hand over the
mouth, and of the ten traced files the facepalm is the flat one — an open hand
seen palm on with the fingers together. `wave` is the other open hand and its
fingers are splayed, which over a mouth is a hand somebody is waving at their own
face. There was no eighth panel in the sheet to trace, and a pose is a shape
**and** a placement: the same hand forty five degrees round and twenty five units
lower is a different gesture.

**Minus forty five degrees is what turns it flat.** The file is drawn with the
wrist bottom right and the fingers running up and to the left, which is what a
facepalm is; turning the whole thing back by forty five puts that run horizontal,
so the fingers lie across the face and the wrist sits out by the jaw where a
wrist goes. One number, and it is the whole difference between the two poses.

Where it lands is **the yap hand's own spot**, which is the one place in the
module that has already had the argument about where a mouth would be: 29.9
across, two units left of the face's centre and under both eyes rather than
beside one, and 48.5 down. The ink covers x 16.8 to 43.0 and y 42.0 to 67.7, so
the mouth is in the middle of it, the squeezed eyes clear the top by nearly two
units, and the heel hangs five units under the chin — which is a hand held in
front of a face rather than painted on one, and is less far down than the resting
pair already reaches. Nothing about the placement grows the reach.

###### The head is on its own channel, and that is the whole design

The state under a pose is already tweening `y` and `sq` over the same window.
Two `fromTo`s on one property is a fight whose winner is the build order, which
is not an answer — it is the same reason the shape is a lookup rather than a
channel and the same reason a mark may not set the turn on a state that turns on
its own. So the laugh writes `hbody`, a channel set of its own, and the frame
**adds** it to the drawn head the way the idle layer is added: a state writes
exactly what it always wrote and the bounce lands on top of it.

`body` on the pose is what writes it, and it is built once per mark rather than
once per acting hand, because a bounce is the head and there is one of those.
Its exit is written even when the last beat already sat at nought: a pose whose
hold was cut short by the next mark is exactly the case that is for.

Three numbers come out of it, and each is measured against something already in
the file.

- **The bounce is 4.6 css px** — the unit the head's own channel is in, which is
  worth saying outright because the eye and the hand a few lines away are in grid
  units. A little over half of `agreeing`'s nod and a third of `delighted`'s hop:
  a nod is a statement and a hop is a whole body, and four of either inside a
  second is a head being shaken by somebody else.
- **The squash is 0.030 against the 0.080 ceiling**, half of `agreeing`'s own
  contact, and it is on each bounce. It is the give in the shape rather than an
  impact: there is no floor under a head that is giggling, so it has no counter
  stretch in front of it and no hold at the peak, which is what the state
  builder's own `squash` is and why this is not that.
- **The eyes squeeze to 0.30 by 1.20**, `delighted`'s trick tighter — that state
  takes a 4.4 unit pill to 0.40 by 1.28 and calls it a smile, and a laugh has its
  eyes *shut*. 1.32 units tall is two and a half device px of ink at the corner
  size, which reads as a line rather than as a slab.

**The eyes are interpolated toward the arc rather than multiplied by it**, and
that is the one line in the fold that matters. `surprised` opens an eye to two
and a half times its height and `delighted` has already squashed one to 0.40; a
multiplier would leave those two six times apart while both were supposed to be
closed. Interpolated, a laugh over either is the same shut eye — what a state
wanted its eyes to be does not survive them being closed. It goes on the state's
own two scales rather than on the drawn product, so the turn's foreshortening
still lands on top: an eye on the far side of a turned head is narrower whether
it is open or shut.

**And it takes the brows with it**, `covers`, which makes it the second pose to
say so rather than the first. The hand is nowhere near the brow line here: what
takes them off is the eyes, which are shut and drawn as two thin arcs, and a brow
over a shut arc is a third line on a face that is meant to have two. Same gate,
`HANDS.coverFor`, and it is quick for the same reason.

###### Four bounces, and the numbers the first cut got wrong

Four rather than three, which reads as a stutter, and rather than five, which is
a fit. Each is smaller than the one before — the shape `agreeing`'s two nods and
`wave`'s five rocks both have, and the difference between a gesture and a loop.

**The split between down and back is what the yap already paid for.** The pop
curve reaches 1.1 by 36% of its own duration, so a move written on it that is
shorter than about a tenth of a second puts itself into one frame. The first cut
wrote the drop over 0.085s and did exactly that: the head stepped **3.6 css px**
between two frames, past `agreeing`'s own worst of 3.05 and past `delighted`'s
3.49, which is a head teleporting rather than bouncing. At 0.11 down and 0.13
back the worst frame is 2.76, under both, and it is still four and a half bounces
a second. The guard is written against those two states rather than against a
number invented for it.

**The eyes shut half a beat before the hand lands**, at 0.86 against an entrance
of 1.01. A face that closed its eyes when the hand arrived would be reacting to
its own hand; a person laughs and then covers it. So the eyes go first and the
hand catches up, and the arrival lands on a face that is already laughing.

**The hand does not bounce**, and that is a line that was written and taken out.
The gloves are drawn inside the card, so the head's own bounce already carries
this hand: writing it on the hand as well is writing it twice, and the second
copy is a hand sliding down a face on every beat. What is left for the hand to do
is what a hand held over a mouth does while the rest of somebody is laughing,
which is press in a little and turn with it — and that beat is on `y` and `rot`
and never on `x`, because `x` is the channel this pose is scored on and a hold
beat on it would be measured as an arrival that never settled.

`side` works exactly as it does for the other one handed poses, and the default
is the screen **right** hand: `pos` is `bottom-left` unless a clip says
otherwise, and which hand acts is derived from it — he stands in a corner and
gestures into the frame. Saying `side: 'right'` on the mark is the same choice
made visible, the way an explicit `bias` is.

###### The sound is three cues, on the bounces

`SFX` has a third entry now — `laugh: 'titter'` — and the laugh pose is the first
thing in this module to ask for a sound that is not a state's. Three cues rather
than one buffer, each with its own `step` so the pitch climbs a whole tone, and
each on **a bounce's own frame** rather than on a grid the pose table invented.
That is the same argument every sound in `demo/` is placed on and the reason
`lib/sfx.mjs` shapes a giggle as one note a caller fires three times.

The fourth bounce is deliberately silent: a laugh runs out of breath before it
runs out of shoulders.

##### The shape is swapped, not tweened

A pose is a shape rather than an arrangement, so it cannot be a channel: a
channel is a number and gsap would ease it. Two white shapes crossfading over a
face would be a double edge for the length of the fade, and a path index eased
from one to five would draw three poses nobody asked for on the way.

So it is resolved out of the plan's own marks instead — `handShapeAt(plan, t,
k)`, a lookup rather than a tween. A hand holds the pose of the last hands mark
it is **acting** on, from that mark's own frame until its exit begins, and it
holds `rest` at every other instant — including through the exit, so the shape a
hand travels home in is the shape it is going home to. A hand that is not acting
on a pose is at rest whatever the acting one is doing, which is what the sheet
draws.

In the markup every pose's path is present and hidden, and the page shows the
one the frame names. Seven paths a hand rather than one path rewritten per
frame, because writing a `d` attribute every frame asks Chrome to re-parse and
re-tessellate a two hundred point outline six times a captured frame — and
because a `d` written per frame is a `d` that can be written wrong on one. The
page compares the name before it writes, so holding a pose for three seconds
writes nothing at all.

##### The corner sweep is the outline's own hull

`gloveCorners(g)` hands back every point of a resolved glove's ink in its own
local frame, with half a stroke added on each axis. It is a list of points
rather than a box on purpose: the hand is then rotated, and the box of a rotated
box is not the box of the rotated shape.

With paths it is the traced outline's **convex hull**, computed once at module
load: each `d` is flattened at sixteen segments a curve, translated so the wrist
is the origin, scaled into grid units, grown by half a stroke and hulled. A hull
is exactly as good as the whole outline for the one question anybody asks of it
— every consumer takes an axis aligned box **after** a rotation, and the extreme
of a rotated set is always a hull point of it — and it is about a hundred points
rather than seven hundred.

The flattener takes `M`, `C` and `Z` absolute and **refuses anything else** with
a named error, because a relative `c` read as an absolute one is a hand in the
wrong place whose first symptom would be a reach that is too small and a glove
over the safe line, which is a long way from the cause.

**And it fixed something the six rects got quietly wrong.** The left hand was
reflected on the page and *not* in the corner sweep, so its reach was the reach
of a hand that was never drawn. A symmetric glove hides that; a traced one does
not. The mirror is now a second cached hull, kept beside the first rather than
computed per call — `gloveCorners` is read at a hundred and twenty a second
through the reach walk, and mirroring in there would be the one place the gloves
stopped being cheap. The whole walk costs **73ms on a thirty second clip**.

##### The marks api, and `side`

A pose is a mark like a state is, and it composes with one rather than replacing
it — the two layers are independent and a mark may carry both:

```js
planMascot({
  seconds: 20, hands: true,
  marks: [{ t: 0.4, state: 'neutral',     hands: 'rest' },
          { t: 3.1, state: 'curious',     hands: 'wave' },
          { t: 6.0, state: 'unimpressed', hands: 'facepalm', side: 'left' }],
})
```

The room is measured to the **next hands mark** rather than to the next mark,
because a clip may change the face four times while the hands hold one pose, and
a pose cut short by a mark that says nothing about the hands would be a pose that
ended for no reason.

**`side` is which hands are on screen — `left`, `right` or `both`** — which is
what "one hand or two" means. It **persists across marks the way the turn does**,
because it is a fact about the composition rather than a gesture: a mark that
names one hand keeps naming it until another mark says otherwise, and an exit
puts the shape back to rest and leaves the side where it was.

A two handed pose (`rest`, `shrug`, `panic`) is taken by every hand on screen. A
one handed one (`wave`, `thumbs-up`, `facepalm`, `point`) is taken by the acting
hand and the other one, if it is on screen at all, sits at rest — which is what
the sheet draws. **Which hand acts is derived from `pos`**, the fact `TURN.bias`
is already derived from: he stands in a corner and gestures into the frame
rather than out of it, so a head on the left waves with its screen right hand.
Naming one side says it outright, the way an explicit `bias` does.

##### The gloves move the head in

They hang outside the silhouette on every pose the sheet draws — and further
than they used to, because the resting pair now hangs off the bottom of the head
where the sheet hangs it — so the placement has to hold room for them or a
resting hand is the first thing across a platform's own chrome. **The reach is
measured off the plan's own frames** rather than derived off the pose table and
padded: the poses' hold beats move past their own `at`, a wave rocks fifteen
degrees, a point jabs two and a half units, the idle adds another half, and
every one of those would have to be re-derived by hand in a second place. It is
the same instrument `crownReach` is, and it runs after the plan object exists
for the same reason.

On the test cut the pair reaches 29.5 units left, 32.9 right, 4.6 over the crown
and **26.4 under the chin**, and the head stands exactly that much further in.
Those four move when the cut moves, which is the point of measuring them off its
own frames: adding the laugh changed three of them and nothing had to be
re-derived by hand.
The preflight then measures what the frames actually make and the render
**fails** if it ever passes what was held — a clip that re-planned its marks and
not its placement is exactly what that catches.

`headRect` grows to hold them too, so the safe area guard every clip already
runs is the hands' own safe area guard as well. There is no reading of "the
mascot clears the chrome" that leaves out the piece of ink nearest the border.

The gloves are deliberately **not** in the feature mask. Everything on the face
is clipped to the plate and measured against it; a glove is ink that is supposed
to be outside the head, and scoring it there would fail every pose in the table.

##### The gloves are off, and here is what that is worth

`demo/out/handsdiff/` imports the module as it was — a copy out of git history —
and the module as it is, over 33 plans covering every state, both themes, the
turn at both ends, a bubble, a run of bubbles, a card radius, a caption band,
the yap hand and every corner. Compared: the whole plan as json, **every frame
at sixty as json**, the motion report, the css, the markup, the page plan, the
cues, `headRect`, `stillMoment` and both printed summaries.

**12,138 frames, byte identical**, across the drawn version and this one both.
The only differences are the keys the change adds and each is asserted to be off
— `plan.hands`, `plan.handsReach`, the frame's `hands`, the report's `poses` and
`hands` and `worst.hands`, and the page plan's `hands`. No mark carries a hands
key at all when the plan has none. `mascotRuntime` legitimately differs by 5,982
characters, which is the page half learning to look for a glove; on a page with
no glove in the markup that lookup returns null.

`headRect` is the one function the change reaches into for a reason a clip can
see, and it is written to be comparable against its own past output: the four
clearances are carried as clearances rather than as edges, because rewriting
`w - cx - hw` into `w - (cx + hw)` is the same number in algebra and not always
the same double.

##### What the video review found, and the one pose that does not read

`demo/out/review-mascot-hands-dark.md`, off the 60fps cut with the shutter open.
The construction argument holds on the frame: `thumbs-up` at 6.00s is a fist
with a thumb rather than a stump and `panic` at 16.00s is two hands gripping a
head rather than two fists, which are the two poses the last review rejected.

**`point` is the one that does not say its own name.** At 14.00s and 15.00s it
reads as a fist. The traced file aims the finger **at camera**, foreshortened,
with its tip drawn as a small circle inside the fist's outline; at a 240px head
that circle is about twenty device px and it closes up into the mass.

**It is the drawing and not the placement** — the ink box sits on the sheet's own
panel to within a unit, and the file is used as supplied. Two ways out, and both
are a decision rather than a fix: use `point` only where the copy already says
who is being pointed at, or trace a side-on point off the sheet and swap the
file. Nothing in the module changes either way, which is the whole point of a
pose being a path.

One other note from that pass: **the facepalm's arrival is the one beat that
would be cleaner at six subframes.** It is the longest travel in the table and
at four the shutter leaves a soft trail. It reads as motion and it passes; a
clip that puts `facepalm` over a busy background should render it wider.

##### What is in the repo and what is not

**`demo/assets/` is ignored and `demo/assets/hands/` is not**, which is one
`git check-ignore` away from being obvious and worth writing down anyway. That
folder holds things a clip places but does not own — reference sheets, app
icons, other people's logos — and on a public repo one `git add .` publishes
them. The ten traced gloves are the exception because they are **our own
trace**, and the same paths already ship inside `lib/mascot.mjs`, so tracking
the svgs keeps the source beside what was built from it.

The rule is `demo/assets/*` rather than `demo/assets/`, with `!demo/assets/hands/`
under it. Git does not descend into an excluded directory, so a trailing slash
on the first line would make the negation unreachable and the gloves would
vanish from the repo with no error anywhere.

##### What the reference is now

**The sheet itself is gone.** `demo/assets/hands-ref.png` lived in that ignored
folder and is not on this machine any more. What survives is the seven
crops `compare.mjs` cut out of it — `demo/out/poses/cmp-ref-<pose>.png`, already
centred on the panel's head, already scaled to 244px, already mirrored for the
poses whose acting hand the table writes on the other side — and the ten traced
files, which are the sheet as far as the module is concerned.

Three instruments read them and all three are in `demo/out/poses/`, which is
ignored:

- **`measure-traced.mjs`** rasterises the ten paths and reports each one's ink
  box, area, centroid, largest inscribed circle and wrist. It is what the wrist
  table above came out of.
- **`ref-grid.mjs`** draws the card's own grid over a reference crop with the
  pose's ink box on it, which is how every placement in the table was set.
- **`traced-compare.mjs`** renders each pose beside its crop and blends the two,
  so "does it match" is a picture on top of a picture rather than two memories
  side by side.

If the sheet comes back, `compare.mjs` regenerates the crops and all three read
them again unchanged.


#### The thought bubble

**`index.html`'s own, with one dot dropped and the whole cluster pulled in.** The
site draws a rounded pill in the page colour with a hairline `--bub` outline, and
three dots climbing off the top right of the head toward it. It is a thought
rather than a caption card, and the outline is what makes it one: a filled block
beside a filled head is two blocks.

Three things differ from the page version, and all three are about phone size.

**Two dots, not three.** The smallest is 5px on the page; at 1080 wide that is
ten device px of outline and it reads as a speck of dirt rather than as a beat.

**The cluster sits closer.** The site holds it 12px off `.m-zone`, and the zone is
four px wider than the ink, so on the page the first dot is sixteen from the head.
Here the gap is five css px, which measures **10 device px** off the rendered ink —
the difference between attached to him and near him.

**The outline is 2 css px, which measures 4 device px.** It was written as 1.5 to
get three, and the render came back with two, because **Chrome floors
`border-width` to a whole CSS pixel**: 1.5 resolves to 1, and at device scale 2
that is the site's number again — the first thing h.264 eats at crf 17. The
export guard caught it, off `getComputedStyle` rather than off what was typed,
and both the guard and the self-test now insist on a whole pixel.

The colours are the mascot's own two tokens and the site's third: `--eye` is
defined to always equal the page background so it is the pill's fill and inverts
with the theme for free, `--face` is the ink and so the text, `--bub` is the
site's outline token. **Nothing on the bubble glows** — it is a sibling of the
card rather than a child, so the glow layers cannot reach it, and it does not
squash when the head does either.

**The motion is the site's, as three tweens rather than three transition
delays.** Small dot, larger dot, then the pill, each 70ms behind the one before
it — the site's own interval, which is what reads as one gesture with three beats
rather than as three things arriving. The dots spring from a fifth of their size
and the pill from seven tenths, both of the site's numbers, and all three are on
`btk.pop`, so each overshoots and settles rather than appearing. The exit is the
same list backwards and quicker: a thought does not leave in the order it
arrived.

**The `pop` cue moved to the pill.** It used to fire on the first dot; the dots
are the anticipation and the pill is the arrival, and a sound on the wind-up is
early for the thing it is the sound of.

#### Where the thought hangs — `beside` by default, `over` derived off `pos`

**`thought` is one option with four values and a default that changes nothing.**

```js
planMascot({ ..., thought: 'beside' })   // the module's own, and the default
planMascot({ ..., thought: 'over' })     // over the crown, side worked out from pos
planMascot({ ..., thought: 'over-left' })
planMascot({ ..., thought: 'over-right' })
```

Beside the head is right for the corner it was written in and wrong everywhere
else: post11's mascot stands bottom left, so a thought climbing off his right
shoulder climbs into the frame, and off a bottom right head the same cluster goes
past the edge of the screen. Mirrored, it wants the head's own width again in
clear space beside him, which a head pushed toward the middle of a 540 wide stage
does not have. post15 paid for that three times before this option existed.

**`over` derives the side, the start and the three lifts from `pos`, which is
the fact `TURN.bias` is already derived from.**

- **The side.** The pill is the far end of the run and so the part that has to
  land over the middle of the frame: a head on the right thinks to its left, a
  head on the left thinks to its right. `over-left` and `over-right` say it
  outright, the way an explicit `bias` does.
- **The start.** The plate's own vertical centre line — a thought comes out of
  the top of a head, not out of its ear — one `gap` above the crown, which is
  the same `gap` the beside placement holds off his flank.
- **The lifts.** The row's dot widths and flex gap fix the horizontal run
  between the dot centres and on to the pill's spring corner at 15 and 26 css
  px. Put those three points on one line at `BUBBLE.over.angle` — fifty degrees,
  steep enough to read as a climb and shallow enough that the pill is still over
  him — and the lifts are **0, 15.876 and 34.986**. The row direction and the
  pill's `transform-origin` follow the side, so the smallest dot is always the
  one nearest the head and the pill always springs from the corner nearest the
  dots.

**The crown is measured rather than assumed.** The cluster is a sibling of the
card, so it does not move when he does. Beside him that is fine — a hop slides
the head *past* a dot at its side. Over him it is not: `delighted` lifts him 12.5
grid units, the arrival curve overshoots by a tenth and the idle drift adds
another, so **15 css px of head goes through a dot hanging five above the resting
crown**. `crownReach` walks the plan's own frames and takes the highest the
plate's top gets, **only over the frames a thought is up for** — holding room for
a hop nobody is watching would push the cluster off the top of the frame — at
240Hz, four samples to a frame at sixty, so the answer does not depend on where a
pass's frames land.

**It is advisory about the safe area rather than fatal**, because the module
places the cluster against the zone and a clip is free to move the zone: post15
lifts him 154 css px off the corner `planMascot` put him in. A plan whose thought
would leave the safe area from the module's own placement carries a note saying
so, and the clip's own rendered-rect guard is what decides.

**Beside is untouched, and that is checked rather than claimed.** The beside
branch of `mascotCss` is written as the literal it always was rather than as a
default falling out of the over one, and a plan made before the option existed
carries no `thought` at all and lands there too. The css, the markup, the page
plan and sixty frames of animation hash identical to the module before the change
across three placements and both themes.

#### The rest of the bubble

The word ceiling, the safe area guard and the caption band guard are exactly what
they were. The container carries visibility and the three parts carry the
animation, so every guard downstream still asks one element whether the cluster
is on screen — and it counts as on screen from its first dot, which is the
conservative answer and the one a safe-area check wants.

#### Phone sizing

Everything is judged at 1080×1920 on a phone, not on a desktop preview. The head
is **240 device px across the plate** at the default `size: 128` css, inside a
220–280 window that `planMascot` checks at plan time and both scripts check again
against what actually painted. The default position is bottom left inside the
platform safe area — 180 top, 220 bottom, 140 sides — with a 16px margin off the
safe lines so the states have room to move without crossing one.

The bubble is Space Grotesk 500 at 26 css px, which renders **38 device px of
cap**, over a 32px floor, and the cap is measured off the rendered glyphs rather
than assumed from the ratio, so a font that failed to load is caught here rather
than in a review.

#### Two themes, one call

`light` is ink on the site's paper with a soft grounded shadow and no glow at all
— a glow on white is a smudge and the page spec says so. `dark` is the terminal
look: the face is the light one, the grounded shadow is switched off because a
soft black ellipse on `#06070a` is nothing, and the head carries two layers of
soft blur behind it. That is post10's crt ghost with the numbers walked down —
11px at .20 and 30px at .13, against post10's 13px at .30 and 34px at .20 —
quiet, and around the head only, because the layers are blurred copies of the
plate. `__mas.theme('dark')` switches it, and the self-test proves a theme
changes colour and nothing else: the same frame at the same second is byte-for-
byte identical between the two apart from the glow multiplier.

#### The guards

`planMascot` throws on: an unknown state; marks that overlap or leave a state no
room for its own entrance, a hold and its exit; a bubble over the four-word
ceiling (the copy rule is two or three, and a bubble at the ceiling is reported
as a note); a punctuation dash in a bubble in any language; a head outside the
phone window; caps under the floor; two identical blinks in a row.

The renders add: the head's clearance from every border on **every** frame; the
bubble's on a quarter-second sample; the bubble against a caption band if one is
passed; the head and the caps as rendered; entry, anticipation and overshoot per
state; no frozen face; the squash ceiling; the breathing ceiling.

**The head is computed, not measured, and that is a fix rather than a shortcut.**
`getBoundingClientRect` on the plate returns the axis-aligned box of the rect's
*geometry*, so a plate turned eight degrees reports a box wider than itself by
the corners it does not have — at radius 0.5 the ink is a circle and a circle
does not get wider when you turn it. Sampling that number found the head half a
pixel outside a safe line it was fifteen pixels inside, which would have moved
the mascot inward to satisfy a measurement artefact. `headRect` works it out from
the geometry instead: at radius 0.5 the ink is an ellipse and the axis-aligned box
of a rotated ellipse is exact in one line, and a card falls back to the four
transformed corners, which is conservative in the right direction. The bubble is
still measured in the page, because it is a dom box with no rotation on it and
measuring it is correct.

**The glow and the shadow are reported beside the ink rather than folded into
it.** A 30px blur at 13% and a soft ellipse at a fifth opacity are not ink
crossing a safe line, and scoring them as if they were would either fail every
dark render or excuse a real overrun.

    node lib/mascot.mjs test    the engine's own checks, no browser, about a second

### `mascot-test.mjs` — do they read as what they are

Two chapters, each its own pair of clips, over a plain background with no voice,
rendered in both themes. It exists to answer three questions at a glance, with
the sound off, at phone size: do the states read as different things, does the
turn read as a head turning, and do the eight hands poses read as eight
gestures.

    node mascot-test.mjs                    every chapter, both themes, 1080x1920, 60fps
    node mascot-test.mjs light              just one theme
    node mascot-test.mjs --chapter=states   just the states and the turn
    node mascot-test.mjs --chapter=hands    just the floating hands
    DEMO_FPS=12 node mascot-test.mjs        the fast preview pass
    node mascot-test.mjs --blur             60fps with the shutter open
    node mascot-test.mjs --encode-only      re-encode from kept frames

**Four outputs, always the same four paths**, two per chapter:
`mascot-<theme>.mp4` and `mascot-hands-<theme>.mp4`. The chapter is in the name
here for the opposite reason it was once dropped for: it names a *different cut*
rather than a different pass at the same one.

**The hands chapter renders the traced gloves**, and the stills that decided
their placement are `demo/out/poses/traced-compare.mjs`'s rather than this
clip's: every pose is laid over the panel of the sheet it came from before it is
ever animated, because a video review can tell you a gesture is wrong and only a
comparison can tell you a hand is in the wrong place. See The floating hands
above.

**The hands are their own clip and that is the point of the part being opt in.**
Turning the gloves on moves the head in, because they hang outside the
silhouette and the placement holds room for them. A states clip carrying them
would be a states clip composed differently, and then the file that answers "do
the nine read as nine" would have stopped being a control.

The hands cut runs the eight poses in the order they were designed in, each with
a face under it, and **the face is deliberately not `neutral` every time**: the
question that chapter has to answer beyond "does the pose read" is whether a
pose composes with an eye state or fights it, and a facepalm over an unimpressed
face and a thumb over a delighted one are the two that would show it. The sides
are exercised in the middle of the run rather than at the end, so the
persistence is on screen — one hand, then the other, then both again.

**The laugh goes over `surprised`, and it is the one pairing in the cut with a
third question behind it.** It is the pose that moves the head as well as a
hand, and the eyes it shuts are the eyes that state opens widest: `surprised`
takes an eye to two and a half times its height, the laugh shuts both to a tenth
of that, and if the two layers ever fought each other that is the frame it would
show on. `surprised` appears twice in the cut now, under `panic` and here, and
nothing else in the table would say the same thing.

Its own guards: every pose winds up, overshoots and settles; all eight appear and
all three sides are named; no hand moves more than twelve css px in a frame; the
drawn reach never passes what the placement held; each glove carries all seven
**drawings** — seven and not eight, because `laugh` and `facepalm` are the same
traced file and the markup carries a drawing once; and the rendered hand is
between 0.33 and 0.50 of the head on its long side with its edge between 2.8 and
4.25 device px.

The rig is `captions-test.mjs`'s, which is `post5.mjs`'s. Three things differ.

**The background is deliberately nothing.** No wordmark, no captions, no
pictograms. The mascot is the thing being judged and anything else in the frame
would be the thing being looked at. What is left is two transparent pixels off
frame with an infinite transform on them, which is load bearing rather than
decoration: with nothing animating at all chrome stops producing compositor
frames and the screenshot call blocks on frame one forever. `post2.mjs` found
that and every clip in `demo/` has carried something like it since.

**There is sound and it is not a voice.** Two cues, and only two: the `pop` when
a bubble arrives and the `ding` on the agreement beat. Both are in the file,
because whether the ding lands on the nod is one of the things the test is for.

**The caption band is passed in without being drawn.** A real clip reserves a box
for words and the bubble may not enter it. The band here is where a caption box
would sit above a bottom-corner mascot, and the guard measures the rendered
bubble against it four times a second. A clip that puts its captions over the
mascot's corner finds out here rather than in a review.

**The motion guards read sixty regardless of what the pass is sampled at.** Entry,
overshoot and settle are properties of the animation rather than of the pass: at
the twelve-frame preview an anticipation lasting four sixtieths falls inside one
frame, and judging it there would say the wind-up is missing when what is missing
is the sampling. The preview prints its own numbers and the guards read the
sixty-frame ones.

It writes a still per state per theme into `out/verify-mascot/`, and each still
is walked forward until it is clear of every idle blink. That is not cosmetic:
the first strip caught the tail of a blink on `agreeing` and the state read as a
face with one eye, which is a fact about the sampling rather than about the
state.

### `mascot-export.mjs` — overlay clips for canva

The second deliverable. The same seven states as clips on their own, 1080×1920,
with the mascot already in its corner, so one drops straight on top of a phone
video with nothing to reposition.

    node mascot-export.mjs                     every state, both themes
    node mascot-export.mjs curious delighted   just those two
    node mascot-export.mjs --theme=dark        just one theme
    node mascot-export.mjs --no-bubble         skip the bubble variants
    DEMO_FPS=12 node mascot-export.mjs         the fast preview pass

Three and a half seconds each: a beat of rest, the entrance, the hold, the exit,
ending on the frame the exit finishes. That shape matters more for an overlay
than for a clip — it starts and ends at the same pose, so two butt together and a
single one sits under a longer shot with no visible in or out.

**Three flavours per clip, from one capture:**

| | |
|---|---|
| `-alpha.webm` | vp9 with real alpha. The one to use — canva keeps the transparency and the mascot sits on the footage with nothing behind it. |
| `-onblack.mp4` | the same clip flattened onto solid black, for an editor that will not take a webm. Screen it, or key the black. |
| `-onwhite.mp4` | and onto solid white, for the same reason on light footage. |

And a bubble variant of each, `-bubble-` in the name, so a bubble can be used or
skipped without re-rendering. The full naming convention, in order:

```
mascot-<state>-<theme>[-turned][-bubble]-<flavour>.<ext>
                                          alpha.webm | onblack.mp4 | onwhite.mp4
mascot-<state>-<theme>[-turned][-bubble]-still.png     the poster frame
cues.json                                              where the two sounds land
```

so `mascot-thinking-dark-turned-bubble-alpha.webm` is `thinking`, dark theme, held
at a three-quarter turn, carrying its bubble, as vp9 with real alpha. Everything
lands in `demo/out/mascot/`, which is inside the already-ignored `out/`. Files land in `out/mascot/`, which is inside the
already-ignored `out/`, with a still per clip and a `cues.json` beside them.
**The clips are silent** — they go over someone else's footage, which has its own
sound — so the two cues the module would emit are written down in that sidecar
instead of muxed in.

**The flat two are made from the alpha one, not rendered again.** Compositing
over a colour is the only way to be sure all three are the same animation.

**The capture is small and the canvas is not.** The frame is 1080×1920 and the
mascot occupies a corner of it; capturing the whole canvas would be fourteen
times the pixels, almost all of them transparent, and png at that size is about a
gigabyte a state. So the capture is a region — the union of every head rect in
the clip and the bubble's own, grown by the glow's reach and the shadow's,
rounded out to even device px — and ffmpeg pads it back to 1080×1920 at exactly
the offset it came from. The region comes out of the same `headRect` the safe-area
guard reads, so a region that cropped the mascot would be one the guard also
thought was somewhere else, and it cannot be, because there is one of them. The
guards check that neither the head nor the bubble ever touches the region's edge.

**Alpha is proved, not assumed.** `-auto-alt-ref 0` is not optional: with alt
refs on, libvpx encodes hidden frames the alpha plane has no partner for. And a
stream tagged `yuva420p` is not proof either — the encoder reports the tag it was
asked for whether or not the plane reached the muxer. So one clip per theme is
composited over a colour nothing in the mascot uses and two corners are read
back: if they are that colour the transparency is real, and if they are not the
webm is a rectangle and would arrive in canva as one.

### `lib/camera.mjs` — the camera

The thing `record.mjs` and `post9.mjs` each grew their own copy of, lifted into
one module. **It is new and nothing was retrofitted onto it**: those two clips are rendered and shipped, and the only thing a shared module
could do for them is change them. It exists so the next clip does not write a
fourth one, and **post15 is the first that uses it** — one leg, no snap and no
shake, with the mascot and the bug both inside the rig. See The fifteenth clip
for the one thing `minZoomFor` does not answer when a plan has no shake in it,
and for what it costs to put the mascot inside a camera.

The same three pieces the caption and pictogram engines are built from, and for
the same reasons. **`planCamera(opts)` runs in node and measures nothing** — it
validates, resolves the timings and returns plain data, and
`describeCamera(plan)` prints it. **`resolveCamera(plan, rects)` turns selectors
into numbers**, because a target may be an element and an element has no rect
until a page has laid it out; the rects are an argument rather than a measurement
taken inside the module, which is the same reason `sceneFrame` takes an `env`.
And **`cameraFrame(plan, t)` is the whole camera as a pure function of time** —
centre, zoom, drift, shake and the transform to write, at second `t` and nothing
else. That is what makes it compose with the shutter: a subframe at `t + 1/240`
is a real answer rather than a repeat, so a fast move blurs the way a fast move
should.

The transform is `record.mjs`'s, unchanged, because it is the right one:
`transform-origin: 0 0` and `translate(vw/2 - cx*z, vh/2 - cy*z) scale(z)`. A
fixed child of the wrapper is fixed to the wrapper, which is exactly what a
camera wants and is why the site's top bar travels with the frame.

| | |
|---|---|
| `cx`, `cy` | the page point the frame is centred on, in css px of page space |
| `z` | the zoom. 1.0 is the page at its own size |
| drift | two sines per channel whose periods never come back into phase |
| shake | a decaying seeded knock, in screen px, on top of everything |

A target is one of three things and a plan may mix them: `{ sel, fit, dx, dy }`,
`{ rect, fit }`, or `{ cx, cy, z }`. **A fit is on both axes**, which is post11's
rule rather than a preference — fitting the lockup on width alone framed it at
1.10 and cut the mascot's crown off the top of the card and the hint line off the
bottom.

#### Two modes, and `site` carries the page's own limits

**`site`** is for footage of `index.html` and it enforces the two framing rules
that are arithmetic. Zoom never below 1.0, because the top bar, the vignette and
the grain are all `position: fixed` inside the wrapper and under 1.0 their boxes
float as visible rectangles in the margin. Zoom never above 1.09, because the
page is full bleed at 540 and the subline is its widest line — post9 rendered THE
BORING TEK as `SHE / 7/RING / MEK` doing exactly this. The third rule, that a
resting shot frames either page zero or everything below the bar, is a framing
judgement rather than a number and stays with the clip that makes it.

**`free`** is for a composed frame on a plain background, where none of those are
true because there is no bar, no grain and no subline. It takes its own
`zoom: { min, max }` or none.

**The limits are walked, not argued.** `resolveCamera` samples the resolved plan
at 60fps and throws in site mode if the zoom ever leaves the window — and that
includes the snap's overshoot, because `btk.pop` goes 10% past its mark and a
plan that fits at its marks and not at its overshoot is a plan that renders
wrong. The module's own test proves it: a 1.05 leg with a 1.06 snap on it is
refused, because it peaks past 1.09.

#### The shake is not the glitch shake, and that is the whole point

post10, post12, post13 and post14 all shake the whole stage, and every one of
them computes it **from the frame index rather than from the time**, on purpose:
a glitch is a dropped packet, it happens to a screen rather than in the room, and
with the shutter open a one frame jump written against `t` comes out as a quarter
strength blur instead of as a jump.

A camera shake is the opposite thing. It is the operator being hit, it happens in
the room, and a real camera moving fast **does** blur. So this one is a
continuous function of `t` and it is meant to smear. The two are different
channels in different files and a clip may run both at once: the glitch tears the
picture and the camera flinches.

The noise is value noise rather than a sine, because a shake is not a wobble:
seeded values on a grid at `freq` per second, smoothstepped between, two octaves,
continuous in `t` at every point.

**The attack is 0.06 by default and it is not decoration.** The envelope body is
`(1-p)e^-kp`, which is 1 at `p=0+` and 0 at `p<=0` — a step. The module's own
check caught it: the worst one frame move at 240Hz was the same **3.58px** as at
60Hz, which is the signature of a jump rather than of a move. With the attack in
it is 2.38px at 60Hz against **0.776px** at 240Hz, a ratio of **0.327** where a
held signal reports 1.000. That test — sample four times as densely and the worst
step must come down — is how this file tells a move from a cut, and
`lib/transitions.mjs` borrows it for the grow.

#### The edges, as arithmetic

"The camera never shows the edge of the picture" is not a hope.
`minZoomFor(plan)` returns the smallest zoom at which the worst shake this plan
can produce still cannot pull a border into shot: a translation of `a` px needs
`2a/w` of extra scale, because the overscan is shared between two sides, and a
rotation needs the rotated frame's own bounding box covered. It bounds on the
**nominal** amplitude rather than on the realised peak, because a bound that is
only usually true is not a bound. `cameraMotion` says whether the plan ever goes
under it, and `__cam.edges()` confirms it in the browser off the rendered rect,
because the plan can only speak for content that is exactly the size it was told.

`visibleRect(plan, t)` is the other half of the framing argument: the window of
page space in shot at second `t`, shake included. `holds(plan, rect, fps)` walks
every frame and says whether one box stayed inside it, and names the frame it
first failed on. That is post9's lesson and post11's rule — **no line of the page
is ever cut in half** — with something checking it. It caught the first cut of
`rig-test.mjs` at 3.60s.

### `lib/transitions.mjs` — the circle grow, and the exit and re-entry

The mascot is a circle. That is the one fact this file is built on, and it is the
reason we have a signature transition at all: a circle that grows about its own
centre never stops being the shape it started as, so **he can become the
background** rather than cutting to it. A square would have to rotate to fill a
9:16 frame and a rounded rect would show its corners arriving.

#### The whole trick is that his face inverts

`lib/mascot.mjs` paints the head in `--face` and the page behind it in `--eye`,
and `--eye` is defined to always be the page background. So:

| | face | paper |
|---|---|---|
| light | `#0b0d10` | `#ffffff` |
| dark | `#f4f7f5` | `#06070a` |

Read those as two pairs and the transition falls out of them. **His face in one
theme is the other theme's paper**, to within a few units of luminance: light
face against dark paper is 6 of 255 apart, dark face against light paper is 11.
So a black head growing on a white page arrives at a black page, and a white head
growing on a black page arrives at a white one. **The grow is a theme flip
performed by a shape.** It needs no dissolve, no cut and no second colour: the
handover is a flat field changing by four per cent of one channel at the one
moment the frame is a single colour.

**It is checked rather than claimed.** `mascotInk()` lifts both theme blocks out
of `mascotCss()` at run time — the same move `captions.mjs` makes on
`index.html` — and `planGrow` throws if the pair has drifted past `INK_TOL`, 12
of 255. Change the mascot's colours and this file fails loudly instead of
rendering a visible cut.

#### `lib/mascot.mjs` is not touched, and did not need to be

The brief allowed adding a scale channel to the mascot if its api had none big
enough. It does not need one. **`#m-zone` is the mascot's own box and the module
writes nothing to it** — `apply()` writes `#m-card`, `#m-shadow`, the glows, the
eyes, the brows, the hand and the three bubble parts, and never the zone. post14
already established that: its two mascot placements are a transform on `#m-zone`
added at the id level by the clip.

So the grow is a transform on the zone, which scales the real plate the real head
is drawn on. **At the first frame of the grow it is the head, to the pixel,
because it is the head.** That is what makes it one continuous shape rather than
a shape that replaces one.

Three things are written after `__mas.apply(f)` in the same frame, and every one
of them is a multiply toward zero of a number the module already wrote:

| element | what | why it is safe |
|---|---|---|
| `#m-zone` | transform, opacity | the module never writes either |
| `#m-zone` | `--eye` | the module writes no custom property |
| `#m-shadow`, `.m-glow` | opacity, visibility | multiplied down, never up |

#### The eyes melt, they do not fade

A head that grows with its eyes on turns into two enormous slabs before it turns
into a background, so the features have to go first. They are not faded out:
`--eye` is walked to `--face`, and since the irises, the brows, the hand and the
bubble are all painted in `--eye`, they stop being visible by becoming the same
ink as the skin. **He closes his eyes by having his eyes become his face.**

Fading would have meant fighting `apply()` for the brow opacity every frame. This
touches a property the module never writes at all, which is why it composes
instead of racing.

The shadow and the glow go to `visibility: hidden` rather than only to opacity
nought. At the fifteen times a corner grow reaches, the wide glow is a 450px
gaussian over a 3600px disc rastered on every frame for something nobody can see.

#### What covers, and the two things the render found

`coverScale(box, size, stage)` is the scale at which the plate covers the frame,
and it is arithmetic rather than a number somebody watched for: the distance from
the plate's own centre to the furthest corner, over the plate's radius at rest,
with three corrections that survive the scale because all three are fractions of
the head's own size.

- **the idle drift**, `hypot(1.7, 1.2)` css px against a 60px radius, so 3.5%
- **the breathing**, up to 2% off the scale
- **the squash**, up to the module's own 8% ceiling. The card's scale is volume
  preserving, so a squashed circle is an ellipse and what has to reach the corner
  is its **short** semi axis.

**The squash was missing from the first cut and `growCoverage` found it**: the
reverse grow measured **0.970** of the corner on a frame the field claimed to be
covering, which is a wedge of the old paper behind a disc that had supposedly
swallowed it.

**The second fault was worse and less obvious.** The slack was folded into the
final scale but `reachOf` still divided by the bare geometry, so `coverU` — the
moment the field comes up — fired when the *ideal* disc covered, while the real
one was still two per cent short. The slack has to be in the requirement, not
only in the destination, or it is not slack at all. `needSafe` is that
requirement now and `reachOf` divides by it.

`growCoverage(gplan, mplan, fps)` walks the real `mascotFrame` over the real
window and reports what actually happened, because a bound derived from the idle
layer says nothing about a pose the clip put on the same frames. **A mascot mark
whose entrance falls inside a covered stretch is a clip error**, and this is the
number that catches it.

#### Presence, and the pop the preview found

A grow **out** does not give him back. He became the page: that is the whole
point of it, and after the last frame of one he is still the page until something
hands him over. The first cut returned him the moment the window ended and he
snapped into his corner at full size on the new theme, which is a cut, and the
12fps preview showed it at 6.82s.

So presence is a latch rather than a product, and `composeTransitions` gives the
vote to **the latest transition that has actually started**. That is well defined
without the function knowing what time it is, because every frame carries its own
plan's `at` and whether it has begun, and a plan that has not started has no
opinion about a page it has not touched. `composeTransitions` is also what merges
two of them: translates add, rotations add, scales multiply, opacities multiply,
and the page writes `translate rotate scale` in that order so he is carried to
where he stands **and then** grows about the place he is standing.

#### The cross

Off one side and back on the other, in a new place. Anticipation against the
travel, an accelerating departure, a gap with nothing on screen, then an arrival
on `btk.pop` whose own overshoot is the settle.

**The departure is `btk.drift` read backwards.** A thing leaving frame
accelerates, and none of the four house curves does that — `pop` overshoots,
`glide` is symmetric, `heavy` and `drift` both arrive early. Reading one
backwards is an acceleration and is not a new curve: no fifth bezier, no fifth
name, nothing for two files to disagree about. Sampled, it is 0.19 at the halfway
point where drift is 0.81.

He travels far enough that the ink **and its glow** are out. The wide glow is a
blur of the plate and a gaussian is visible to about three sigma, so the reach
past the ink is three times the blur radius rather than one. Off frame he is
switched off rather than merely moved, because a plate and two blur layers parked
outside the viewport are still rastered.

The lean is a fraction of the travel rather than its own tween, so the tip and the
move can never disagree about when the move happened.

**One thing it cannot do, and it is worth knowing.** `planMascot` derives the
resting turn from `pos`, once, so that he looks into the frame rather than out of
it — from the right corner that is -0.35. Cross him to the left corner and that
same -0.35 points him off the side of the screen. `rig-test.mjs` hit it and the
fix is the mascot's own api rather than anything new: a mark may hold the turn,
so a mark before the cross holds it at `+TURN.bias`. In the right corner that
reads as looking toward the side he is about to leave through, which is the
anticipation the move wants anyway.

#### `tail` belongs to a forward grow, and it is fixed

`tail` is the fade the field leaves on at the end of a grow. Forward it is
invisible by construction: it fades off onto a background that is already the
same colour. **Read backwards it landed at the start of the reverse**, where the
background is the destination theme and is not the same colour at all — an `in`
grow flips the theme on its first frame, so frame zero of a reverse with a tail
on it was the new paper with the field at nothing on top of it, followed by a
tenth of a second of the field fading in over it. post15's first cut hit it and
worked round it with the module's own `tail: 0`; that cut is gone, and
`rig-test.mjs` carried the same frame until this pass. Its reverse is dark to
light, so what it put there was one **white** frame in the middle of a flat
hold.

**The fix is one line and it is the one the fault always asked for: the fade is
the window's business, so it reads real time rather than the shape.** The colour
walk still reads `u` — that is the shape, and it has to mirror. The fade reads
`local`:

```js
const since = local - T.coverU;              /* was u - T.coverU */
const off = T.release + T.settleFor;
washO = since <= off ? 1 : clamp(1 - (since - off) / T.tail, 0, 1);
```

**Forward, `local` and `u` are the same number, so this is the arithmetic it
always was, to the bit.** 1666 forward frames walked at 240Hz across three
placements and both directions of theme come back identical to the frames before
the change, which is the property that let it ship without re-cutting anything.

**Backwards, a reverse now has no tail at all, and that is correct rather than a
compromise.** The window's end is a long way past the frame the disc stopped
covering on, so by the time the fade would begin the field is already gone —
handed over on the frame the disc covers exactly, painted the colour the disc
already is. That handover is what the whole transition is built on, and the tail
was never doing anything a reverse needed.

Two module checks hold it: every covered frame of a reverse sits under a solid
field, and a forward grow still goes 1 to nothing over the last tenth of its
window. `rig-test.mjs` was re-rendered on the fix and the frame is gone —
sampled at sixty across 7.40 to 7.90s, the light film walks 9,6,10 to 12,9,13
at the flip and stays there, where before it put a full white frame at 7.600s.

#### It sits above `lib/pictograms.mjs` and does not weaken it

The scene engine refuses three scenes at once or an overlap past 0.45s: a handoff
is a handoff, not a dissolve. Nothing here changes that. This file never touches a
scene, a part or a step — it operates on the mascot layer and on one full frame
field, and a clip that runs a grow over a scene handoff is still bound by the
scene engine's own rule.

### `rig-test.mjs` — twelve seconds that exercise both

Two files, always the same two paths, overwritten every run:
`demo/out/rig-light.mp4` and `demo/out/rig-dark.mp4`. `mascot-test.mjs`'s rule
and `mascot-test.mjs`'s reason.

The cut, and every element the two modules carry is in it:

```
0.00   the page, camera at z 1.12, drift running
0.40   the push, 2.20s on glide, to z 1.19
3.40   the snap: anticipate 0.18, hit 0.20, hold 0.30, settle 0.50, x1.14
3.79   the shake, 0.55s, 24px nominal and 8.8 realised
4.70   back out to z 1.14
5.60   the grow OUT. light to dark. covers at 6.19, he is gone at 6.63
6.72   the second line draws on the new paper, and he is not there
7.60   the grow IN. dark to light. the field shrinks back into him
8.80   the cross: out right, back left, lands in the other corner
10.00  curious, and he is looking into the frame from the new side
12.00  end
```

**There is no fade anywhere in it, and that is the reason the two grows are in
that order.** The reverse grow is how he comes back: between them he is not
hidden, he *is* the page.

**The mascot is outside the camera**, the way `record.mjs` keeps its cursor
outside. The grow's cover arithmetic is against the frame, and a head the camera
was also scaling would make the covering scale a function of where the camera
happened to be. Which means the drift is still running on the scene, underneath a
grow that has completely covered it — deliberately, because it proves the two
layers do not need to know about each other.

It is silent. The question is whether the picture moves correctly, and a sound on
the snap would be the thing being judged. `lib/sfx.mjs` has `servo` for a snap
zoom and `glitch` for a hit whenever a real clip wants them.

#### The numbers, measured

| | |
|---|---|
| cover scale, from the bottom right corner | **16.53** |
| plate at rest | 120 css px, 240 device |
| plate at the handover, as rendered | **3999 x 4103 device px** |
| the frame's own diagonal | 2203 device px |
| camera zoom range | 1.128 to 1.380, floor 1.089, **0 frames under** |
| worst one frame camera move | 45.6px against an eighth of the frame, 67.5 |
| realised shake peak | 8.8 css px, 17.6 device |
| copy box air at the tightest crop | 25.7px, at 3.65s on z 1.380 |
| worst reach under the field | 1.014 out and 1.009 in by plan, 1.151 and 1.103 measured |
| handover colour gap | 6 of 255 both ways, against a tolerance of 12 |
| still frames | 0 |

**22 guards, all green, at 12fps and at 60fps, in both themes.** The 12fps
preview was reviewed frame by frame through `skills/video-review` first: it found
three faults — the pop after the grow out, the headline cut in half by the snap,
and the gaze pointing out of frame after the cross — and all three were fixed
before the masters.

## Why demo/ is safe to have in a public repo

Tracked: `record.mjs`, `post2.mjs`, `post4.mjs`, `post5.mjs`, `post6.mjs`,
`og.mjs`, `analyze.mjs`, `captions-test.mjs`, `lib/captions.mjs`,
`lib/voice.mjs`, `README.md` and `package.json`. Ignored: `node_modules/`,
`frames/`, `out/`, `music/` and `package-lock.json`. Every clip keeps its frames
under `out/` in its own folder, so one run cannot wipe another's mid flight.

*(That tracked list predates `post7.mjs`, `post9.mjs`, `post10.mjs`,
`scenes-test.mjs`, `mascot-test.mjs`, `mascot-export.mjs`,
`lib/pictograms.mjs`, `lib/sfx.mjs` and `lib/mascot.mjs`, all of which are
tracked too. `MEMORY.md` carries the list that is kept current.)*

**Everything the new pieces produce is inside `out/`, which is already
gitignored whole** — the overlay clips, their stills and their cue sheet in
`out/mascot/`, the mascot test's clips and its per state stills in
`out/verify-mascot/`, — the voice audio and its sidecars in `out/voice/`, the
analyzer's reports and stills in `out/analysis/`, the caption test's clips and
its both-theme stills in `out/verify-captions/`, and the transcriber's
virtualenv and model cache in `out/whisper-venv/` and `out/whisper-models/`. The
last two are about half a gigabyte, which is exactly why they live somewhere
deleting one folder undoes.

**`demo/music/` is licensed audio and it is never pushed.** `post10.mjs` slices
its stabs out of mp3s that live in `demo/music/` on the machine that renders,
and `.gitignore` carries that folder for the same reason it carries `.env`: the
licence is ours to hold, not ours to redistribute out of a public repo. Nothing
in the folder is tracked, the slices it produces land inside the mix, and the mix
lands in `out/`. If the folder is missing the run says so by name rather than
rendering a silent clip. **`lib/sfx.mjs` still ships no audio file at all** — it
synthesises every one of its nine sounds sample by sample, and post10 uses none
of them.

**Nothing in here holds a secret, and the two endpoints it does name are not
ours.** `lib/voice.mjs` carries Microsoft's public trusted client token, which is
compiled into Edge and printed in every article about that api; it is not a
credential and it is not ours to leak. The analyzer reaches huggingface for
model weights and nothing else. Neither module has an api key, an account, or a
line of ours in it.

GitHub Pages serves the whole repo root, so `theboringtek.com/demo/record.mjs`,
`/demo/lib/voice.mjs`, `/demo/analyze.mjs` and `/demo/README.md` are fetchable.
That is harmless: they are static text, nothing executes them, they hold no
secrets and no endpoint that is not already in `index.html` — the urls named
there are named in order to **block** them. `demo/` is in neither `sitemap.xml`
nor any link on the site. If you would rather it were not crawled at all, add
`Disallow: /demo/` to `robots.txt`.
