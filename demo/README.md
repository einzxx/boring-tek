# demo/ — the recorders

All headless Chrome, all tooling. The renderers first:

- **`record.mjs`** renders a 24.1 second demo of the live site to mp4. It drives
  the real `index.html` from this repo, served on localhost. It never touches
  production and it never posts a form anywhere.
- **`post2.mjs`** renders a 9 second social clip. It does not film the page: it
  composes a scene out of the site's parts. See The social clip below.
- **`post4.mjs`** renders a 19 second social clip, vertical only. Same composer
  rig as `post2.mjs`, four bubble beats instead of two. See The fourth clip.
- **`post5.mjs`** renders a 10.5 second social clip, vertical only. `post4.mjs`
  is its template; the mascot searches the room on two axes and the bubble
  swaps in place instead of leaving.
- **`post6.mjs`** renders a 22.2 second social clip, vertical only, **with its
  own voice in the file**. The first one built on the new machine: the voice is
  generated first and the captions, the length and the mascot's gaze are all cut
  from its word timestamps, and there is an animated pictogram scene layer in
  the top third. See The sixth clip.
- **`post7.mjs`** renders a 10.22 second social clip, vertical only, with the
  voice and the effects in the file. post6 is the template; it is the first clip
  built on the whole stack at once rather than on one that grew under it. See
  The seventh clip.
- **`og.mjs`** renders `assets/og.png`, the 1200x630 card a shared link shows.
  See The og card at the bottom.

Then the pipeline pieces, which are not clips. `post6.mjs` uses the first three:

- **`lib/captions.mjs`** turns a timestamped word list into a word by word
  animated caption, in three styles. See The library below.
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
- **`analyze.mjs`** reads a reference video and writes down how it is built.
- **`captions-test.mjs`** renders the three caption styles as five second clips
  so they can be judged.
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

Four pieces that are not a clip. Nothing in `lib/` is imported by `record.mjs`,
`post2.mjs`, `post4.mjs`, `post5.mjs` or `og.mjs`. `post6.mjs` imports all but
the analyzer. It exists so the next clip can have a voice, captions and pictures
without inventing any of them from scratch on the day.

Still zero dependencies beyond the two `demo/` already had. The voice module
talks a websocket protocol by hand rather than adding `ws` or `edge-tts`, and
the caption engine is plain javascript and css.

### `lib/captions.mjs` — animated captions

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

Takes `[{word, start, end}, ...]` and draws it word by word. Three styles:

| | |
|---|---|
| `pop` | big Michroma caps, one short card at a time. The card springs in whole and the accent then walks across it, landing on whichever word is being said and kicking it as it arrives. The hormozi cut in our type. `emphasise` marks a card as a beat and fits it on its own in the accent, off unless asked for; `fill: 'word'` goes back to the older reveal, where a word is invisible until it is said. See The sixth clip for why `card` is the default. |
| `type` | Space Grotesk, lines arriving from below and dimming as they are overtaken, the word being said at weight 500. Calm, closest to how the site reads, and it never touches the accent. |
| `count` | a rolling number and a label under it. The digits sit on a fixed cell grid so a 6 becoming an 8 cannot change the width of the line. |

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

Eight sounds, written in JavaScript sample by sample. **There is not one audio
file in the repo**, for the same reason the pictograms are drawn in code and the
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

`cuesFromScenes` reads the scene plan **by shape and step kind, never by a part's
name**, so a clip that draws a coin gets a coin landing without telling this file
anything, and a clip that draws two gets two.

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

## Why demo/ is safe to have in a public repo

Tracked: `record.mjs`, `post2.mjs`, `post4.mjs`, `post5.mjs`, `post6.mjs`,
`og.mjs`, `analyze.mjs`, `captions-test.mjs`, `lib/captions.mjs`,
`lib/voice.mjs`, `README.md` and `package.json`. Ignored: `node_modules/`, `frames/`, `out/` and
`package-lock.json`. Every clip keeps its frames under `out/` in its own folder,
so one run cannot wipe another's mid flight.

**Everything the new pieces produce is inside `out/`, which is already
gitignored whole** — the voice audio and its sidecars in `out/voice/`, the
analyzer's reports and stills in `out/analysis/`, the caption test's clips and
its both-theme stills in `out/verify-captions/`, and the transcriber's
virtualenv and model cache in `out/whisper-venv/` and `out/whisper-models/`. The
last two are about half a gigabyte, which is exactly why they live somewhere
deleting one folder undoes.

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
