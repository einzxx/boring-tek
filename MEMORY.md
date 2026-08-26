# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- Phase: **site v1 is LIVE.** The coming soon page is gone. `index.html` is the real
  site: two themes, three languages, a mascot with a speech bubble, and a multi-step
  contact form. Pushed and serving from `main` at theboringtek.com.
- **Shipped 2026-08-23, all pushed and live** (`e66132d`, `79fae78`, `15cc787`,
  `5f2241e`, `3adfeaa`):
  1. The subline no longer flashes before it types. Hidden by the stylesheet from first
     paint, unhidden by the typing.
  2. A socials row: six Tabler brand glyphs, centred in the top bar on desktop, in a
     new footer on a phone.
  3. More sky between that row and the mascot on desktop, at no cost to page height.
  4. Language urls, `/ru` and `/lv`, with browser autodetect and `hreflang`.
- **Shipped 2026-08-24** (`2bcfb62`, pushed): **a demo video pipeline in `demo/`.** One
  command films the real `index.html` over localhost and renders a 24.1s reel at
  1080x1920/60fps plus a 1080x1080 square cut. It never touches production and never
  posts a form. **The live site did not change** — `index.html`, `CNAME`, `robots.txt`,
  `sitemap.xml` and the language stubs were untouched, so this deploy changed nothing a
  visitor sees. Full detail under Current state and in `demo/README.md`.
- **Posted 2026-08-25: the second clip is out.** Caption `scared of ai?`, per platform
  hashtags carrying an **ai taking jobs** angle, and a sound pass that puts a **servo
  on the eye turns**. Einz's report, not something done or measured from here.
- **Recorded 2026-08-25: both posts are now written down exactly.** Captions, the tags
  per platform and the full sound recipe are under Socials. The two post gap is closed.
- **Shipped 2026-08-25 (`c62a2d4`): phone safe framing, and the clip is signed.** 96
  device px of guaranteed air at every border, measured and guarded rather than
  assumed; the statement lower and capped at 75% of the frame width; the wordmark
  added, dim, at 89%; and **the square is now its own render rather than a crop**,
  because no 1080 tall window holds a statement at y=350 and a wordmark at y=1710.
- **Built 2026-08-26: `demo/post4.mjs`, a fourth social clip, `3 free ai tools for
  your business`.** Nineteen seconds, 60fps, vertical only, out to
  `demo/out/post4-1080x1920.mp4`. Four bubble beats with real air between them for
  a voice line and a logo per beat. **post3 was skipped, not renamed** — "missed
  calls" is still queued and unbuilt, and post2 was the template. **The live site
  did not change.** See Decisions.
- **Shipped 2026-08-25: `demo/post2.mjs`, a second social clip.** Nine seconds,
  60fps, loop friendly, in both the vertical and the square cut. It does not film
  the page, it composes a scene out of the site's parts. **The live site did not
  change** — `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language
  stubs and `assets/` were all untouched, so this deploy changed nothing a visitor
  sees. See Decisions.
- **Shipped 2026-08-24: the og card.** `assets/og.png` (1200x630, the light theme) is the
  first binary the site itself ships, and the head now carries `og:image` with width,
  height, type and alt, plus `twitter:card` raised from `summary` to
  `summary_large_image`. The meta description was rewritten with it, on all three pages.
  `demo/og.mjs` builds the card and is tracked. See Decisions.
- **Both cuts are with the editor for sound, and the first video is posted** across the
  platforms. Einz's report, not measured here. The caption and the exact tags are now
  recorded under Socials — tiktok carried **five** tags, not the three this line used to
  claim. See the Demo reel section for a duration mismatch to resolve.
- **Both submit destinations are live and confirmed by Einz.** The Cloudflare Worker at
  `boring-tek-forms.theboringtek.workers.dev` was fixed and deployed and Telegram is
  arriving; web3forms email delivery is confirmed too. **This is Einz's report, not a
  measurement made here** — the runs in this repo's history were all against a stubbed
  network. A full walk of all four form paths against the live endpoints is still open.
- **v1 has been rendered and measured in headless Chrome** at 320px and 1440px, in both
  themes and all three languages. Verified: no horizontal scroll anywhere; all 33 bubble
  lines across EN/RU/LV fit with no clipping left, right or top; the card unfold
  animates and the inner spring overshoots and settles; the theme cross-fade moves
  background, mascot face, mascot eyes and the phosphor glow together over ~500ms; the
  CTA glitches ~5 times in 22s and goes silent when the form opens; the mascot blinks
  with an eased human lid 6-9 times in 30s and keeps blinking while wide-eyed and under
  reduced motion; idle chatter is correctly gated
  while the form is open; the whole form works end to end under `prefers-reduced-motion`
  including validation; restart fully resets. No JS errors in any pass.
- **Both submit destinations were tested against all four outcomes** with a stubbed
  network: both up, web3forms only, worker only, and both down. One surviving delivers
  the form and shows the check mark; only both failing shows the red line, with the send
  button re-enabled and every answer still in place. The send button is genuinely
  `disabled` and carries the `.busy` breathe while in flight, the worker payload carries
  no `access_key`, and the console stays silent in all four cases.
- **Still unchecked:** real devices, real fonts on non-Chrome engines, Safari and
  Firefox, screen readers, and keyboard-only navigation. The rest of the "Before
  shipping" checklist in `skills/page-builder/SKILL.md` still applies.
- Site is a single static file served by GitHub Pages from `main` root. Push to `main`
  is the deploy — there is no staging, so check the diff before every push.
- **v1 is committed and pushed** (`ae0b373`), and so is the about section that followed
  it (`f6fdf52`). The about section has since been removed again — see Decisions. The
  live site is v1, plus the four page-wide fixes that outlived it, plus Space Grotesk
  and the section below the hero, plus everything shipped on 2026-08-23 above.

## Current state

### Site

- **Domain:** theboringtek.com — live on GitHub Pages.
- **DNS:** done at Hostinger, pointed at GitHub Pages. `CNAME` in repo root holds the
  apex domain.
- **Repo:** github.com/einzxx/boring-tek, public.
- **Live page** — site v1, one file, one external request at load, now carrying
  two families (Michroma + Space Grotesk):
  - **Two themes.** Light is the default: white page, near-black mascot face with white
    eyes, no phosphor glow. Dark is the old look: near-black page, white face, dark
    eyes, green bloom on the headline. Toggle top right, saved in `localStorage` under
    `bt-theme`, every colour cross-fading over 0.5s.
  - **A socials row** — telegram, x, youtube, tiktok, instagram, facebook, in that
    order. Tabler Icons (MIT) inlined as stroked SVG, 22px glyph in a 40px box, 6px
    gaps, `--muted` at .5 like an inactive language button, no brand colour anywhere.
    Hover darkens to `--fg`, lifts 2px and flicks the CTA's rgb split once. **Above
    560px it is absolutely centred in the top bar; below, it moves to a footer** with
    a `theboringtek 2026` line under it, and the bar goes back to two controls.
  - **Language urls.** `/` english, `/ru` russian, `/lv` latvian, served by two stub
    documents that redirect to `/#ru` and `/#lv`; the bootstrap reads the hash before
    first paint and `replaceState`s the clean path back. The address bar always names
    the language on screen. First visit with no url and no saved choice reads
    `navigator.language` and saves nothing.
  - **Three languages.** EN / RU / LV as plain text buttons top left, saved under
    `bt-lang`. Every visible string lives in one `T` object; switching re-renders the
    current view in place without losing form progress.
  - Mascot at ~110px, eyes tracking the cursor, blinking on its own, soft halo behind
    him. He is also a button — pressing him opens the form.
  - **Speech bubble** off his top right: three dots climbing diagonally, then a pill.
    Bored lines every 8–14s while idle; dry comments between form steps; a permanent
    line after send.
  - Michroma wordmark, one-shot decode on load, three-line stacked lockup under 640px.
  - Subline types itself once, then static. **Hidden from first paint by the
    stylesheet, so it can never be read before the typing writes it.** Michroma for EN,
    drops to mono for RU and LV because Michroma has no Cyrillic and no Latvian
    diacritics.
  - **CTA button** — bordered pill, "tell us what you need", shaking with an rgb split
    on the text every 3–5s to ask for attention. Fills solid on hover.
  - **Contact form** — unfolds under the lockup, one question per step, four paths,
    inline validation, and on send `POST`s the same readable JSON to two places at
    once — web3forms for email and our own Cloudflare Worker for Telegram. **Both
    channels are deployed and delivering** as of 2026-08-23.
  - CRT grain and radial vignette in both themes, at different weights.
  - The fixed top bar carries a scrim, which the section below the hero now needs:
    without it the headline scrolls up into the language and theme controls.
  - **The section below the hero** — a 1px thread down from the hint, then three
    cards: two side by side above 720px, one full width under them, all stacked below
    it. Mono // label, body copy in Space Grotesk, EN/RU/LV like everything else.
    Fades up once on scroll and never again.
- **Favicon:** the mascot, transparent background, no plate, inline data URI. Still the
  dark-mode colourway (white face, dark eyes) — a favicon can't know the page theme.
- **SEO:** `<title>`, meta description, canonical, `hreflang`, og:title / og:description
  / og:url / og:type, and since 2026-08-24 a real card: `og:image` at
  `https://theboringtek.com/assets/og.png` with `og:image:width` 1200,
  `og:image:height` 630, `og:image:type` and `og:image:alt`, `twitter:card` now
  `summary_large_image`, and `twitter:image` pointing at the same file. The description
  is keyword-carrying and shared by all three pages. `color-scheme` is `light dark` and
  `theme-color` is updated by JS on every theme switch — those two are part of the theme
  system, not the SEO block.
- **`assets/og.png`** — the share card. 1200x630, light theme, 61KB. Built by
  `demo/og.mjs`, which is tracked.
- **`robots.txt`** (root) — allows everything, points at the sitemap.
- **`sitemap.xml`** (root) — three urls now, `/`, `/ru` and `/lv`. No `lastmod`.
- **`ru/index.html`, `lv/index.html`** — the two language stubs. They hold no content and
  no copy of the site; see Decisions before touching them.
- **Project files:** CLAUDE.md, MEMORY.md, skills/, assets/ — all tracked.

### Socials

- **Handles, all six the same word:** `t.me/boringtek`, `x.com/boringtek`,
  `youtube.com/@boringtek`, `tiktok.com/@boringtek`, `instagram.com/boringtek`,
  `facebook.com/boringtek`. Linked from the top bar of the site since 2026-08-23.
- Dressed and consistent: mascot as the avatar and **THE BORING TEK** as the name
  everywhere. Same face, same wordmark, no per-platform variation.
- Banners delivered for **X, Facebook and YouTube**.
- **Bio line, locked:** `the future is cool. building it is boring.`
  Use it verbatim everywhere a bio is asked for. Do not reword, do not "improve" it.

#### post1 — posted 2026-08-24, recorded 2026-08-25

Einz's report, transcribed exactly. Nothing here was measured from this repo.

- **Caption, the same on both platforms:** `cool. now build something`
- **Hashtags, tiktok:** `#ai #tech #fyp #aihype #techtok`

That is **five tags, not three**. The "three lowercase hashtags, no more" house rule
this file wrote down after post1 describes post2, not post1 — post1 never carried it.
Lowercase is the part that held across both. The count is unsettled and is now an open
question rather than a rule.

#### post2 — posted 2026-08-25, recorded 2026-08-25

- **Caption, X:** `scared of ai?`
- **Hashtags, tiktok:** `#ai #aitakingjobs #techtok`
- **Hashtags, instagram:** `#ai #aitakingjobs #automation`
- **Hashtags, youtube:** `#ai #artificialintelligence #future`

Three each, lowercase, and the **ai taking jobs** angle is carried by every platform
except youtube, which trades it for the broader `#artificialintelligence #future`.

#### Sound recipe — both posts

The clip's audio signature. Same recipe on post1 and post2, and it carries to post3
unless something in the scene changes.

- **classical restaurant music, low volume, under everything** — the brand sound, and
  the only thing that runs for the whole clip
- **servo `zzt` on the eye turns** — cut to the eye keys, not to the music, so the
  audio follows the head
- **pop** on the bubbles
- **soft click** on presses
- **ding** on the check
- **glitch stutter plus a lock click** on the wordmark decode

Still no posting cadence or content pillars. See Next steps.

### Demo reel and the og card — `demo/`

- **The demo video pipeline is done and shipped** (`2bcfb62`, pushed 2026-08-24).
  `demo/record.mjs` renders a 24.1 second reel of the live site to mp4. It drives the
  real `index.html` from this repo over localhost.
  **It never hits production and it never posts a form anywhere** — `fetch` is stubbed
  for web3forms, `workers.dev` and theboringtek, and the run prints how many posts it
  intercepted (must be 2).
- **Run it:** `cd demo && npm install && node record.mjs`. About four minutes.
  Outputs `demo/out/reel-demo-1080x1920.mp4` and `demo/out/demo-1080x1080.mp4`, both
  60fps, both exactly 24.10s. `DEMO_FPS=12 node record.mjs` is the fast preview pass
  to use while changing the timeline. Full detail in `demo/README.md`.
- **`demo/post2.mjs`**, added 2026-08-25: the second clip, `it took my job`. Nine
  seconds at 60fps, out to `demo/out/post2-1080x1920.mp4` and
  `post2-1080x1080.mp4`. `DEMO_FPS=12` previews it, `--encode-only` re-encodes.
  It keeps its frames under `out/` so a `record.mjs` run cannot wipe them mid
  flight. Roughly a minute end to end.
- **`demo/post4.mjs`**, added 2026-08-26: the fourth clip, `3 free ai tools for
  your business`. Nineteen seconds at 60fps, **vertical only**, out to
  `demo/out/post4-1080x1920.mp4`. `DEMO_FPS=12` previews it, `--encode-only`
  re-encodes. Frames under `out/frames-post4`, state under
  `out/post4-1080x1920.json`, verify stills under `out/verify-post4`. About two
  and a half minutes end to end.
- **`demo/og.mjs` is the third script in here**, added 2026-08-24. It renders
  `assets/og.png`, the share card, in the same headless Chrome with the same flags.
  `cd demo && node og.mjs`, or `--preview` to write to the gitignored `demo/out/`
  instead of the tracked asset. It is the one thing in `demo/` that puts a file in the
  repo, and that file is a png, not code. See Decisions for how the card is composed.
- **This is tooling, not the site.** `demo/` has its own `package.json` and
  `node_modules`. `index.html` is untouched, still one file, still zero dependencies,
  and nothing in `demo/` is loaded by or linked from it. The build constraints in
  CLAUDE.md are not relaxed.
- **Both cuts are rendered and have gone to the editor for sound.** That handoff is
  Einz's report, not something done here. **Note a mismatch worth resolving:** the
  handoff was described as 23.5s, but the files this pipeline currently produces are
  **24.10s**, measured on disk. 23.50s was the duration of the cut *before* the last
  round of changes — the reg value, the story-order fill, and hiding the start again
  button. So the editor may be holding the older cut. Check before the sound mix is
  locked; re-rendering is one command and takes four minutes.
- **The mp4s are not in the repo** and never will be — `demo/out/` is ignored. Whoever
  needs them either gets the files directly or regenerates them.
- **Tracked:** `demo/record.mjs`, `demo/README.md`, `demo/package.json`.
  **Ignored:** `demo/frames/`, `demo/out/`, `demo/package-lock.json`, `node_modules/`.
  Pages serves the repo root, so `/demo/record.mjs` is fetchable — harmless static
  text, no secrets, no endpoint that is not already in `index.html`. Not in
  `sitemap.xml`, not linked from anywhere. Add `Disallow: /demo/` to `robots.txt` if
  we ever want it out of crawlers.
- **The recording method is CDP virtual time, not screencast.** `Page.captureScreenshot`
  frame by frame with `Emulation.setVirtualTimePolicy` advancing the page clock exactly
  16.667ms per frame, then ffmpeg. Screencast only emits a frame when the compositor
  makes one, which at 1080x1920 in headless is well under 60 and irregular. Virtual
  time makes the output deterministic and exactly 24.10s.
- **Virtual time does not drive `requestAnimationFrame`, and that was a real bug.**
  Virtual time governs css transitions and timers correctly, but rAF rides BeginFrames
  from the compositor, and `captureScreenshot` forces five or six per capture, each
  carrying a timestamp 83 to 100ms further on. Measured: **the page's rAF clock ran
  5.5x faster than the capture clock.** Everything `index.html` animates by hand rode
  that — the wordmark decode, the subline typing, the bubble timers and the blink. A
  whole 280ms blink finished inside one captured frame and sampled as 0.97, 0.06, 0.74:
  a flash, not a blink, thirteen of them in seven seconds. The recorder now shims rAF
  into a queue before any page script runs and flushes it exactly once per captured
  frame. **If the site's hand-animated pieces ever look fast in a render, this is
  why.**
- **Other traps worth remembering:** `Page.captureScreenshot` returns css pixels
  (540x960) regardless of `deviceScaleFactor` — you need `clip` with `scale: 2` to get
  device pixels. And the crop filter in the bundled ffmpeg has no `eval` option; its
  x/y expressions are re-evaluated per frame anyway.
- **Three framing rules the page imposes on any camera over it**, all found by
  rendering and looking: zoom below 1.0 exposes the boxes of the fixed bar, vignette
  and grain; zoom above 1.09 clips the first and last letter of the subline, which is
  the widest line on the page; and a resting shot must frame either page zero or
  everything below the bar, never halfway through it, because the bar paints an opaque
  scrim over its own top 42% that shows as a hard edge against the grain. The camera
  language is therefore vertical, not scale.
- **The reel is deliberately calm, but the mascot is not dead.** The cta's glitch shake
  is frozen for the whole video, so the push lands on a still button. Eye *tracking* is
  off — two causes had to go: pointer tracking, which aims at a stale head rect for a
  frame whenever the camera moves the head without a remeasure, and `eyesWide()`, which
  snaps `--wide` 1 to 2.2 with no transition when the form opens. What replaces it is
  **idle life, not reaction**: the recorder drives `--ex` and `--blink` itself, written
  after the page's rAF tick so its values win. Gaze turns take .8 to 1.3s eased, hold a
  second or two, and every third look returns through the middle; blinks land every 2
  to 3s on the page's own lid curve, occasionally twice. Both patterns are generated
  from a fixed seed — `HERO_EYES` and `HERO_BLINKS` — so the rhythm is uneven and
  reproducible.
- **The end card is ours, runs three and a half seconds, and the mascot is alive on it
  to the last frame** — looks left, blinks, looks right, then `your move` pops in on
  the site's own `--spring`, and he keeps looking around and blinking; the final eye
  move is still running at 24.05s. **The line is exactly `your move`, no full stop**,
  which is a deliberate departure from the site's own bubble copy, where every line
  ends in one. The dot trail has to start
  clear of the head: white
  circle on black, so on the 45 degree diagonal anything inside box (109,19) is white
  on white and invisible.
- **The last step fills in the order a person would, and the card arrives empty.**
  `Your Business name` types character by character, then `registration number`,
  `yourweb.com` and `Europe` land one after another a fifth of a second apart, then
  `your@business.com` types. Nothing is pre filled.
- **The start again button is hidden once the check mark lands**, so the sent state
  stays clean to the end card. Scoped by `.pad:has(.tick)` so the form's own back
  button, which is the same `.btn.ghost`, survives on every step before it. The cursor
  also leaves after the send — otherwise the real pointer stays parked where the send
  button was and the card shrinking under it leaves a card below the hero highlighted
  for the rest of the shot.
- **Verified on the finished mp4s:** resolution, 60fps, 24.10s duration, all nine
  presses landing inside their target rect, the gaze moving only as fast as a real turn
  can, `--wide` never budging off 1, and the blink arriving gradually. The press check
  records the cursor's real position and the target's real rect, asserts containment,
  then extracts those exact frames from the mp4 into `demo/out/verify/` — all nine dead
  centre. The eye checks read back computed style every frame; both limits are derived
  from the frame rate so they stay meaningful at 60 and clamp out of the way under
  `DEMO_FPS=12`, where one frame genuinely is 83ms of eyelid.

## Decisions

### The fourth clip anchors the bubble instead of sliding it — 2026-08-26

`demo/post4.mjs`, `3 free ai tools for your business`. Four beats naming
notebooklm, opal and pomelli, then the close. Nineteen seconds, vertical only,
written to loop. post2 is the template; post3 was not built and was not renamed.

- **Vertical only, and that is forced.** A statement, a three line bubble, the
  head and the wordmark do not fit in a 1080 tall frame. The square cut is not
  attempted rather than attempted badly.
- **The pill is anchored, not slid.** post2's bubble hangs off the head's right
  shoulder and, when it runs long, slides left until its right edge lands on the
  safe line. At these widths that slide is 136px and the pill tears away from its
  own dot trail. So the pill's right edge now parks on a fixed line 8px inside
  the safe area on every beat and it grows leftward; `--porigin` moves the
  transform origin to where the dots end, so the spring still comes out of the
  trail at any width. Right edge measured identical on all four beats, widths
  249 / 210 / 167 / 119px.
- **The bubble is a rounded rect, not a stadium.** A stadium's ends clamp to
  half the height, and at three lines that curve crosses the first characters of
  the top and bottom lines: measured, the border would sit at x=15.7 where the
  text starts at x=10.1. The border, the fill and the tokens are the page's,
  untouched. **This is a clip
  only change** — `index.html`'s one line bubble keeps its pill radius.
- **Every beat is three lines on purpose.** The pill's height then never changes
  between beats, so only its width moves and nothing above the head jumps. A
  guard counts the drawn line boxes per beat and fails if `max-width` re-wrapped
  one, because a fourth line would eat the gap under the statement.
- **Michroma's widest glyph is 1.885em**, measured. One cell is nearly two ems,
  so the longest line's character count decides the statement's size and nothing
  else does. For this sentence: two lines gives 12.6px, three gives 16.5px, four
  gives 26.9px. **Four won by 63%**, which is also larger than post2's statement
  at 17.9px. The rule MEMORY.md already carried is confirmed with a number:
  shorten the longest line, spend the height.
- **The safe area is now sampled once per beat, not once per clip.** post2
  measured one frame; with four beats of different widths that proves nothing
  about the widest state. Four samples, and the worst of the four is what the
  guard runs against. Measured: 135px left, 224 top, 111 right, 195 bottom,
  device px, against a floor of 96.
- **Resized 2026-08-26, same session.** The head went to **136px, 63% of the
  216px it first shipped at, with its top on 42% of the frame** (403 of 960),
  still centred. The bubble rides it: every geometric number in the trail, the
  offsets, the padding and the radius is now written as its value against the
  216px head times `bubScale`, so the next resize is one number and not a pass.
  **The font is the one thing held above proportional.** Strictly proportional
  is 11.3px, and this file already records 12px on this viewport as a caption on
  a phone and unreadable in a feed, which is why post2 raised its pill to 16. So
  the chrome shrank by .63 and the words by .78: 18px to 14px, still 28 device
  px tall. The bubble is now slightly larger against this head than it was
  against the big one, and that is the price of legibility paid in the right
  place. The 1px borders are held too: a hairline scaled to 0.63px lands sub
  pixel. Statement, wordmark, timeline and all guards unchanged, and the 306px
  of white under the head is deliberate, so the lower third stays clear for the
  edit.
- Everything else carries over untouched: the rAF shim, the seeded prng, the
  virtual time frame loop, the cell grid, the wordmark fit, all three guards and
  the encode settings. New seeds for post4 so the scramble and the blink rhythm
  are its own, and new eye keys.
- **The gaps are the feature.** Each beat springs in, holds 2.90s, springs out,
  and then 1.14s of empty air before the next. That air is where the editor puts
  a voice line and a logo. It is why the bubble fully exits rather than swapping
  in place the way post2's two beats do.

### The second clip composes a scene rather than filming the page — 2026-08-25

`demo/post2.mjs`. A statement decodes in at the top, the mascot sits large in the
middle living his life, and at 5.5s a bubble pops beside his head: **it took my
job.** then **i am fine.** Nine seconds, written to loop.

- **It is not a camera move over `index.html`, and it could not be.** The
  statement is not on the site, the mascot is drawn 224px where the page caps him
  at 130, and the bubble says something the page never says. So the scene is
  composed from the site's parts the way `og.mjs` composes the card: the light
  `:root` block is lifted out of `index.html` and the mascot out of
  `assets/mascot.svg` at run time. Change a token on the site and the clip
  follows. **This is the pattern for clips from here on** — film the page when
  the page is the subject, compose when it is not.
- Reused from the recorder unchanged: the rAF shim, the seeded prng behind the
  idle, the virtual time frame loop, the gaze and lid guards, and the encode
  settings (libx264, preset slow, crf 17, yuv420p, faststart).
- The statement sits on the **fixed cell grid** the site uses for the wordmark,
  so a scrambling glyph cannot change a line's width. Line breaks are a design
  decision, not a wrap: four short lines run far larger than three long ones,
  because the fit divides by the longest line's cell count. The hero cap of 44px
  is not raised for a video.
- **The square is a second render, not a crop** (changed 2026-08-25 when the
  wordmark went in). A crop cannot hold a statement at y=350 and a wordmark at
  y=1710 inside 1080, so each cut has its own geometry in one layout table at the
  top of the file, over the identical performance: same seeds, same eye keys,
  same bubble beats, the same nine seconds framed twice.
- **Phone safe framing, measured rather than assumed.** `SAFE` is 48 css px, 96
  device px that nothing may sit inside. Every element that renders, dots
  included, is checked against all four borders on the busiest frame and the run
  fails naming the offender. The bubble clamps against the safe area rather than
  the frame edge, because the pill is always the piece that reaches furthest.
- The tall cut carries the stated proportions: statement at 18.5% capped at 75%
  of the frame width, head centred at 50%, wordmark at 89%. **The square's
  verticals are adapted, not copied**, and that is forced: the bubble needs about
  70px of air above the head, so a 540 tall frame cannot also hold a statement, a
  centred head at a useful size and a wordmark at the same percentages. It keeps
  the rules, at proportions a square can hold.
- The wordmark is Michroma caps, tracked `.18em`, in `--muted`: the lockup
  subline's treatment, which is the one place the brand allows Michroma small. It
  is fitted to a target width so tracking can never push it into the safe area,
  and shifted by **half** the tracking, not all of it, because letter-spacing is
  added after the last glyph too and the ink otherwise sits half a space left of
  the box centre.

Three things that cost real time, all worth knowing before the next clip:

- **A scene where nothing animates hangs the render.** With no running
  animation Chrome stops producing compositor frames, and `Page.captureScreenshot`
  waits for one that never comes: frame zero lands, frame one blocks until the
  protocol times out. The vignette breathing on the site's own 34s loop is both
  the fix and the more faithful scene. `record.mjs` never meets this because
  `index.html` always has it running.
- **CSS transitions cannot be trusted in this pipeline.** One captured frame
  carries five or six BeginFrames, so the animation timeline advances about 5x
  per frame: the bubble's `.4s` spring resolved in five frames. The rAF shim
  fixes rAF and nothing fixes transitions, so every moving value on the bubble is
  eased in JS and written per frame. The reel already does this for its end card;
  now it is the rule, not a detail of that one shot.
- **`assets/mascot.svg` is one circle and two loose rects.** The page wraps the
  rects in a `<g class="m-eyes">` and travels the group, leaving the blink on each
  rect. Rebuild that structure or the gaze has nothing to move — and the
  smoothness guards pass perfectly on a mascot that never moves at all. So the
  clip also checks **liveness**: the eyes must have moved, he must have blinked,
  and `--wide` must read back as 1. A guard that only catches a snap says nothing
  about a corpse.

### The og card, and a description that carries keywords — 2026-08-24

**A binary ships.** `assets/og.png`, 1200x630, ~61KB. Both open questions that were
blocking it are answered: yes to a binary in the repo, and the card wears **light** —
white page, black face, white eyes. Light is what most people see, and a white card is
the one that does not fight a timeline. The dark card was not made; if it ever is, it is
a second file, not a replacement.

- **Composed from the site's own tokens, not redrawn.** `--bg`, `--fg`, `--sub`,
  `--face`, `--eye`, `--halo` and `--vig` are copied verbatim out of `index.html`'s light
  `:root`. The mascot is `assets/mascot.svg` geometry with the two fills swapped to the
  light colourway, the way the in-page mascot inverts.
- **Layout:** mascot 190px centred in the upper half, wordmark under it in Michroma,
  subline under that in Michroma caps at `.18em` tracking in `--sub`, and the CTA as a
  small bordered pill at the bottom, `999px` radius and the site's own `14px 26px`
  padding. 78px of clear space top and bottom.
- **Fit-to-width, not guessed sizes.** The wordmark is measured at 100px and divided down
  to exactly 760px wide; the subline is fitted to 660px so it stays *narrower* than the
  wordmark. Michroma's subline is naturally wider than the wordmark at the site's own
  44:16 ratio (939px against 760px), which on a card inverts the hierarchy and eats the
  margins. On the page that is right. On a card it is not.
- **`demo/og.mjs` builds it.** `cd demo && node og.mjs`, or `--preview` to write to the
  gitignored `demo/out/` instead of the tracked asset. One throwaway html, headless
  Chrome, one screenshot: the same chrome discovery and the same flags as
  `demo/record.mjs`, with `document.fonts.ready` awaited before the shot. **Deterministic**
  — the same commit renders the same bytes, so a no-op run leaves `git status` clean.
- **It reads the site rather than copying it.** The light `:root` block is lifted out of
  `index.html` at run time and the mascot out of `assets/mascot.svg`, with the two fills
  swapped to `--face` and `--eye`. Change a token on the site, re-run, the card follows.
  It exits non-zero on wrong dimensions, a subline wider than the wordmark, margins under
  60px, a png over 300KB, and **Michroma not having loaded** — offline the card renders
  in the mono fallback and looks almost right, which is the worst kind of wrong to ship.
- No grain layer. The vignette and the halo are in, both at their light values; grain on
  a card that gets recompressed by every platform is noise, not texture.
- The green never appears. There is no accent on the card — light mode's confidence is
  contrast and space, and that holds here.

**The meta description was rewritten in the same pass**, because the card is what a
shared link looks like and the description is the line under it.

```
we build custom ai solutions, websites, apps and bots for businesses, plus the backend
automation behind them. tell us what you need.
```

- 133 characters, under the 160 cap. Lowercase, no dashes, one clause then the ask.
- It says what we sell in words people search: ai solutions, websites, apps, bots,
  businesses, backend, automation. The old line — `honest content about ai and tech` —
  described a blog we do not run.
- **It replaces the bio line in this one slot.** `the future is cool. building it is
  boring.` is still locked and still verbatim everywhere else. It is a bio, not a
  description, and it carried no keyword at all.
- **All three pages carry the english string for now**, including `/ru` and `/lv`, which
  gave up their translated descriptions to get it. That is a deliberate holding position,
  not an oversight: translating it is ten minutes and the dash rule makes RU and LV the
  careful ones. Open question below.

### Language urls and auto detect — 2026-08-23

- **`/ru` and `/lv` are stubs, not copies of the site.** Each sets the background from
  the saved theme and then `location.replace('/#ru')`, both in a head script that runs
  before the body is parsed, so the stub never paints. `index.html` reads the hash in
  the bootstrap, applies the language before first paint, and `replaceState`s `/ru`
  back into the address bar. **Three real documents would mean three copies of the
  form, the mascot and the dictionaries** — that was the alternative and it is worse.
- **Priority is url, then saved choice, then browser, then english.** The url wins for
  that visit only and never overwrites `bt-lang`: someone who chose latvian and opens a
  shared `/ru` link reads russian, and their next visit to `/` is latvian again.
- **Autodetect saves nothing.** `navigator.languages[0]` before the first `-`, `ru` or
  `lv` or english. A guess must not outlive the visit or shout down a later choice.
  Only pressing a language button writes storage.
- **Every switch `replaceState`s the path**, never `pushState`. `history.length` is
  unchanged after a dozen switches, and back still leaves the site.
- **No relative urls may ever enter `index.html`.** `replaceState` moves the document
  base to `/ru`, so a relative `assets/x.svg` would resolve to `/ru/assets/x.svg`.
  Everything is a data URI or absolute today; keep it that way.
- `hreflang` en / ru / lv / x-default in all three documents, canonical unchanged on the
  main page, each stub canonical to itself, and both new urls in `sitemap.xml`.
- **The honest limit:** the stubs redirect, so a crawler still sees one english page.
  This is routing for people, not for search engines.
- **Verified over a local http server** in headless Chrome, nine cases: english browser
  on `/`; russian and latvian browsers on `/` landing on `/ru` and `/lv` with nothing
  saved; a shared `/ru` link on an english browser with the frame-by-frame sampler
  showing no english frame at any point; saved latvian beating a russian browser; a
  shared `/ru` link not overwriting saved latvian; manual switches updating path and
  storage with `history.length` flat; the form question and chips following into
  latvian; and a reload on `/lv` staying latvian. No console errors.

### The socials row moved, twice — 2026-08-23

- **In the bar the row is absolutely positioned and centred on the page**, not centred
  in the space the language block and the theme toggle leave. Those are 100px and 44px,
  so a flex centre lands 28px right of true centre. Measured centre error at 560, 600,
  768, 1024, 1440 and 2560: 0px.
- **Under 560px the row leaves the bar entirely and becomes a footer** after the cards,
  with `theboringtek 2026` under it in mono, micro, muted. **The two-row bar is gone.**
  It was the first answer and it was never good: 2.9px between the icons and the
  mascot's crown at 320px, and the theme toggle shuffling around to stay out of the way.
- **560px is geometry, not taste.** Page-centred, the row's left edge is `W/2 - 135` and
  it has to clear the language block at 112px with air. That needs about 518px; 560
  leaves a 32px gap at the narrowest desktop. The old wrap point, 464px, is too early
  for a centred row.
- **Two rows of markup, one set of paths.** The glyphs are declared once in an inline
  `<symbol>` sprite at the top of `<body>` and both rows `<use>` them. This is the one
  sprite the site allows, and it is inline — the rule was always about not fetching one.
  `stroke`, `fill` and `stroke-width` inherit into the cloned content, so `currentColor`
  still follows the theme.
- **No JS in the swap.** Moving one node with a `matchMedia` listener buys nothing: the
  footer has to be hidden on desktop either way, so the breakpoint exists regardless,
  and the hidden row costs six `<use>` elements. `display:none` also keeps it out of the
  tab order and the accessibility tree.
- **This is the third width breakpoint and the last one.** 720px for the cards, 640px
  for the stacked lockup, 560px for the socials.
- **The hero starts 32px lower above 560px**, because the row in the bar sits directly
  over the mascot. `.wrap{padding-top:clamp(116px,11vh + 32px,132px)}`, inside the same
  media query. Gap from the icons to the face was 35px on a 720-768px tall laptop and 50
  on a 900; it is 67-83 now. Below 560px the padding is untouched: the bar is two
  controls again and the socials are in the footer.
- **The same 32px comes off `.below`'s bottom padding on desktop**, so the document is
  exactly as tall as it was before the socials existed and 1440x900 still fits one
  screen with no scroll. Measured identical at 1024x768, 1280x720, 1366x768, 1440x900,
  1920x1080 and 2560x1200.
- `barBottom()` is down to the theme toggle. The bar is one row again, and the socials
  are absolute and end above the toggle when they are in it at all.
- **Measured in headless Chrome over CDP** at 320, 360, 375, 390, 430, 480, 540, 559,
  560, 600, 768, 1024, 1440 and 2560, both themes, closed and with the form open: one
  row on screen at every width and never two, all six glyphs drawing, 40px boxes, no
  horizontal overflow anywhere, no console errors. Footer hover behaves exactly like the
  bar's.

### The socials row, and the subline no-flash fix — 2026-08-23

- **The subline is hidden by the stylesheet, not by the script.** `.tag-live` ships
  `visibility: hidden`; reduced motion and a `<noscript><style>` put it back, and the
  typing unhides it by setting `visible` on an empty span. The script used to blank the
  text at `DOMContentLoaded`, which is one paint too late — on a throttled CPU the full
  line was laid out and painted before the script ever ran. Measured at 6x CPU throttle:
  first frame `hidden` with 38 characters in the DOM at 519ms, first `visible` frame
  carrying 0 characters at 1862ms, then 0 to 38 as it types. Reduced motion: one sample,
  visible and whole at 113ms.
- **`start()`'s pre-decode `setTag` had to stop revealing too.** It runs before the
  headline decode, with `animate` false, and it used to clear the inline hide — which
  parked the whole subline on screen for the entire decode. The static path now only
  unhides when the typing is not owed: `if(!RUN||typed)`.
- **The trade, accepted:** if the script dies before the typing runs, the subline stays
  hidden. `<noscript>` covers a page with JS off, not a page whose JS threw. The line is
  in the DOM either way, so nothing is lost but the sight of it.
- **Six socials in the top bar, monochrome and stroked.** The glyphs are **Tabler
  Icons, MIT** (tabler.io/icons, © Paweł Kuna), outline set, `d` attributes copied
  verbatim and everything else dropped, including their empty bounding-box path. Same
  24 grid as the theme toggle, at Tabler's own `stroke-width: 2`, 22px in a 40px hit
  box with 6px gaps. Hand-drawn approximations were the first attempt and were replaced:
  a brand mark is either the real one or it is wrong. Brand colours were never on the
  table — six of them would out-shout the mascot, the headline and the CTA at once.
  Instagram's shutter dot is a zero-length path that exists only because of
  `stroke-linecap: round`.
- **Hover borrows the CTA's glitch dna at half strength**: `translateY(-2px)` plus one
  `.2s` `steps(1,end)` rgb split, `--gr` / `--gc`, via `drop-shadow` because these are
  strokes and not glyphs. On hover only — the CTA is still the page's one
  attention-seeker, and an ambient twitch in the top bar would be a second.
- **The narrow layout is a container query on the bar, not a third breakpoint.**
  `.bar` is `container-type: inline-size`, and `@container (max-width:385px)` gives the
  toggle `order:1` and the row `order:2; flex-basis:100%`. **The order swap is the whole
  point:** with plain `flex-wrap` the item that wraps is whichever does not fit, which
  at 375px was the theme toggle — it landed bottom left, under the language buttons.
  The page's two width breakpoints are untouched.
- **`BAR = 60` was a bug the moment the bar could be two rows tall.** The pill's clamp
  now measures: `barBottom()` takes the lower of the socials row and the toggle, plus
  8px. Verified at 320px with the form open: pill top 98, socials row bottom 90.
- The wrapped row is 34px tall rather than 40px, which is what clears its icons off the
  mascot's crown at 320px — icon bottom 82, mascot top 84.
- **Measured in headless Chrome over CDP** at 320 / 360 / 375 / 390 / 414 / 430 / 768 /
  1440, both themes, all three languages: six links everywhere, none off screen, none
  under 40px, no horizontal overflow closed or with the form open, no console errors.
  Tab order is EN, RU, LV, the six links, the toggle, the CTA. Reduced motion: no lift,
  no flick, colour only.
- **Still unverified:** real devices and non-Chrome engines, same as everything else.

### Three layout fixes on the new section — 2026-08-23

- **The hero no longer holds `min-height: 100dvh`.** It centred the lockup in a full
  viewport, and that centring slack — not the thread — was 200–300px of the ~340px gap
  between the hint and the cards. The wrap sizes to its content now, its bottom padding
  is `clamp(12px,2vh,18px)`, and the thread came down from 56px to 22px. Measured gap:
  54–58px at 320 / 768 / 1440. On a 1440×900 desktop the whole page now fits one screen.
  **The trade, accepted:** opening the form pushes the section down the document by the
  card's height, because there is no slack left to absorb it. It happens off screen and
  does not touch the unfold.
- **The section is 860px wide, wider than the 560px lockup.** Deliberate, and it
  overrides the old "never wider than the thing it sits under" line. Top two cards land
  at 408px on desktop, about 52ch.
- **The speech bubble's bar clamp was a scroll bug.** `fitPill` clamped the pill below
  the fixed top bar unconditionally. Scrolled down to the cards, `br.top` goes deeply
  negative and the clamp pushed the pill **482px** below the head — measured against the
  previous commit — leaving it floating mid-page, and 576px with the form open. It is
  now guarded on `br.bottom > BAR`: off screen there is no bar to avoid. Verified glued
  (`translate: 0px` / `-26px`) at 375×700 and 1440×700, scrolled and with the form open.
- Re-verified: no horizontal overflow at 320/360/375/768/1440 closed or during the card
  unfold, both themes, no console errors, reduced motion still shows the cards.

### Space Grotesk, and the first section below the hero — 2026-08-23

- **The one Google Fonts request now carries two families**, not one:
  `css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap`. Still one
  `<link>`, still one request. The "no second webfont" rule is lifted to exactly this;
  a third family is still out.
- **Space Grotesk is the body face** — hint, bubble, form questions, chips, fields,
  validation lines, form buttons. Weight 500 is used on the form question and the form's
  nav buttons and nowhere else.
- **Michroma keeps the wordmark, the subline and the cta.** The cta was mono before and
  is Michroma now, which is the one visual change in this batch that is not just a
  swapped face.
- **Space Grotesk has no Cyrillic.** It ships latin and latin-ext, so Latvian is covered
  and Russian is not — and the Russian copy contains latin words like `ai`, which would
  have split a line across two faces. The whole Russian page therefore drops to the mono
  stack: `html[lang=ru]{--body:var(--mono)}`. Same all-or-nothing rule the subline has
  always followed. **Do not "fix" this by requesting a Cyrillic subset; there isn't one.**
- **The cta is measured and fitted like the subline.** It runs the same plain-ASCII test
  and drops to `--body` when it fails (Space Grotesk for LV, mono for RU), and its size
  divides by a measured `--cu`. The divide uses `100cqi` off the lockup, **not `100vw`**
  — `vw` counts the scrollbar, and the page scrolls now, which was enough to wrap the
  button at 375px. At 320px the Michroma cta renders around 10.5px; that is the cost of
  putting the display face on the button and it is smaller than the mono one it replaced.
- **The section below the hero is a sibling of `main`, never a child of `.lockup`.** The
  lockup is vertically centred and grows when the form unfolds; anything inside it moves
  with the card. Outside it, the section holds still — verified: its document offset is
  identical before and after the form opens.
- **The scroll reveal is a deliberate, named exception.** Reveal chains are still banned.
  One group of cards, fading up once on `IntersectionObserver`, `unobserve`d on first
  intersection. The start state is added by JS so a page with no script still shows the
  cards, and under reduced motion it is never added at all.
- **`fitPill` was measuring against `innerWidth`.** That was fine while the page never
  scrolled. It does now, and `innerWidth` counts the scrollbar the pill cannot use — it
  put 4px of horizontal overflow on screen at 320px while the card unfolded. It reads
  `documentElement.clientWidth` now.
- **Radius gained a fourth tier, 16px**, for these cards only.
- **Measured in headless Chrome over CDP** at 320 / 360 / 375 / 414 / 768 / 1440, both
  themes, all three languages: no horizontal overflow at any width, closed or with the
  form open; the cta is one line everywhere; the cards reveal once and are already
  visible under reduced motion; no console errors across a full pass of language
  switches, theme toggle, scroll and form open.
- **Still unverified:** real devices and non-Chrome engines, same as v1.

### About section built, then removed — 2026-08-23

- **An about section was built and shipped, then taken out again the same day.** It put
  the mascot a second time below the hero at 92px, reusing the hero's speech bubble, with
  a small sound button that read a four-line pitch aloud via `SpeechSynthesis` in all
  three languages. It worked and it was pushed (`f6fdf52`). It is gone now. **Do not
  rebuild it from this entry** — it is recorded so nobody assumes it was never tried.
- **Four fixes that came out of building it were kept**, because none of them are about
  a second section:
  1. **The human blink**, on the hero mascot. Eases shut over ~95ms, holds ~45ms, eases
     open over ~140ms, roughly one in five goes twice. Driven per frame from the shared
     rAF loop, which is why `.m-eye` now carries no transform transition at all.
  2. **The top bar scrim.** Invisible while the page does not scroll, and exactly what
     the first section below the hero will need — without it the headline scrolls up
     into the language and theme controls.
  3. **The subline font measure fix.** `start()` used to run before Michroma loaded on
     the reduced-motion path, so `--tu` was measured against the mono fallback, came out
     short, and the line overflowed below ~360px. Every mode now waits for
     `document.fonts.load` and checks `document.fonts.check` before trusting metrics.
  4. `fitPill` went back to its single-purpose form — a revert rather than an addition,
     so it contributes no lines. The generalised `fitPill(bubble, pill, clampTop)`
     signature only existed for the mid-page bubble and had no second caller left.
- **The site is now exactly v1 plus those fixes**, verified by diffing `index.html`
  against `ae0b373`: **73 insertions, 18 deletions**, containing only the first three
  (the fourth is a revert to v1 and shows no diff at all).

### Site v1 — 2026-08-22

- **Light mode is the default theme, dark is the identity.** Both ship, neither is a
  degraded version of the other. First-time visitors get light; we deliberately do not
  read `prefers-color-scheme`, because a chosen default beats a guess and the toggle is
  one press away. Dark is where the phosphor look lives and it is what the socials and
  the favicon still use.
- **The mascot inverts with the theme** — face `--face`, eyes `--eye`, and `--eye` is
  always the page background. That invariant is why he can invert at all: he reads as a
  hole punched in the page, so he never needs an outline. Adding one would be a
  different mascot.
- **Light mode gets its own green.** `#35ff6a` measures under 2:1 on white. Light uses
  `#0f8a3c`, the same hue walked down until it passes. One green for both themes is not
  a shortcut, it is an unreadable page.
- **Glow is a dark-mode effect.** In light the headline is flat with no bloom. There is
  no such thing as a light-mode phosphor glow; on white it is a smudge.
- **Three rules from the old spec were deliberately lifted**, in named scopes only:
  rounded corners (three radii, for things you press or things that speak), spring
  overshoot easing (`cubic-bezier(.34,1.4,.64,1)`, never on colour), and shake (the CTA
  glitch only). They were banned for a page whose job was to sit still. A form has to
  feel like it answers back. They are not widened beyond those scopes.
- **The headline lost its blinking caret.** The CTA glitch is now the page's one
  attention-getter and two blinking things fight each other. If a caret is ever wanted
  back, the glitch comes off first.
- **The subline drops to mono for RU and LV.** Michroma is Latin-only, so a per-glyph
  fallback would split a word across two faces. All or nothing, tested on the string.
- **The form payload is always English**, built from the `en` dictionary, plus a
  `language` field recording what the visitor actually used. An inbox you can't read is
  worse than no inbox.
- **The contact route is two destinations, fired in parallel.** This answers the open
  question from the coming soon phase, and **Formspree is gone — do not reintroduce it.**
  1. **web3forms** — `https://api.web3forms.com/submit`, email. Takes `access_key` and
     a `subject` of `new form — the boring tek`, then the readable fields.
  2. **our own Cloudflare Worker** — `https://boring-tek-forms.theboringtek.workers.dev`,
     Telegram. The same readable fields, **no access key**, never send it one.

  Both go out together under `Promise.allSettled`, and **one arriving counts as sent**.
  The red `could not send. try again.` line only appears when both fail. Nobody should
  have to retype a form because one mail relay was down.
- **The web3forms access key is public by design and belongs in the page.** It is a
  write-only submission token, not a credential — it can only push a form into our
  inbox. It is not covered by the no-secrets rule, and it does not need hiding, proxying
  or an env var. The Worker holds the actual Telegram bot token, server side, where it
  belongs.
- **A fetch that resolves with a 4xx still fulfils**, so each POST checks `r.ok` and
  throws. Without that, `allSettled` reads a rejected submission as a delivery and the
  visitor gets a check mark for a form nobody received.
- **The payload is never logged**, not even in a `catch`. It carries a name, a business
  and an email address.
- Nothing fetches on load, so the "one external request at load" rule still holds.
- **The mascot is a second way into the form.** He is the most clickable thing on the
  page; only wiring the button was the bug.
- **The one `<script>` moved into `<head>` and is not deferred.** It applies the saved
  theme and language synchronously as its first act. Deferring it puts a white flash in
  front of every dark-mode visitor.
- **The theme cross-fade survives `prefers-reduced-motion`.** The reduced override is no
  longer a blanket `transition: none` — it narrows `transition-property` to the four
  colour properties. A colour fade is not vestibular motion, and snapping the whole page
  between white and near-black is the harsher of the two options.
- **The subline's blur duplicate was removed.** It had to be written in the same frame
  as the core all through the typing or it trailed a white ghost, and on a white page it
  was pure cost. `--sub` carries the line on its own.
- **The amber ramp is retired.** Nothing was using it. Green is the only accent.
- **Six non-obvious fixes came out of actually rendering the page**, all now written up
  in `skills/page-builder/SKILL.md`. Worth knowing they exist before touching the bubble
  or the card: the bubble needs `width: max-content` or the pill wraps at any width; the
  pill's horizontal shift must be a negative margin, not a transform, or the page
  scrolls sideways and `overflow-x: clip` will not save it; the pill's position and its
  entrance scale must be separate CSS properties or the correction inherits the spring
  and lags; the pill clamps below the top bar, not to the viewport edge, so it never
  covers the theme toggle; the fit has to re-run when the card resizes, because the
  unfold lifts the head after the line was placed; and a transition class added in the
  same frame `display: none` came off does not animate — it needs two rAFs.

### Earlier — 2026-08-21

- Static coming soon page first, full agency site later in the same repo. **Closed —
  v1 replaced it.**
- Single file, zero dependencies, no build step. In force until explicitly lifted.
- `index.html` and `CNAME` live in the repo root permanently. Pages depends on both.
- Repo stays public, so no secrets and no client names in any tracked file, ever.
  Anonymised case studies only.
- Brand voice: raw, anti-corporate, terminal-native. Lowercase, no emoji, no corporate
  filler.
- Services scoped to three: custom AI agents, backend infrastructure, workflow
  automation.
- Headline face is Michroma (Google Fonts), the single external request the site makes
  at load. Single weight 400 — no bold exists, never fake one. Mono for everything else.
- Headline caps at 2.75rem, uniform on desktop and in the stacked mobile lockup. It
  should sit as one elegant centred line with air around it, not wall to wall.
- Mascot, headline and subline are one `.lockup` block, centred as a group. Never loose
  siblings sharing a wrapper gap. (v1 added the CTA and the card to that block.)
- Mascot: **variant 5, tired eyes, FINAL.** Do not redesign. See below.
- **Only the mascot reacts to the pointer.** The headline and subline are fully static —
  no lean, no translate, no brightening on mouse move. An earlier build had the whole
  lockup leaning and brightening; that was removed on purpose. One thing reacting reads
  as a character noticing you; everything reacting reads as a gimmick.
- Subline is uppercase, tracked `.18em`, dim neutral **with no green in it**. Two glowing
  green lines stacked read as one block of glow and cost the headline its hierarchy.
- Caps are set with `text-transform`, not typed into the markup. **The catch:** canvas
  `measureText` ignores CSS, so any width measurement has to uppercase the string itself
  or it comes out ~15% short.
- `--tu` is measured on a canvas, not guessed. Michroma is proportional and `.18em`
  tracking is heavy. v1 re-measures it on every language switch.
- **Bio line locked:** `the future is cool. building it is boring.` Verbatim everywhere.
- Socials carry the mascot as avatar and THE BORING TEK as the name on every platform.
- Basic SEO added: head meta, `robots.txt` and `sitemap.xml` in root. Two top-level
  files, both required to sit in root by convention.
- `twitter:card` is `summary`, not `summary_large_image`. There is no card image.
  **Superseded 2026-08-24:** there is one now, and the card is `summary_large_image`.

## Mascot — variant 5, tired eyes, FINAL

A **soft circle face with two flat rounded-rectangle eyes sitting low on the face**,
wider than tall. Heavy, bored, unbothered. Nothing else — no mouth, no nose, no body,
no outline, no shading.

Locked 2026-08-21. Variant 5 is the official face. Earlier variants (the pixel bot, then
the tall vertical-dash face) are superseded and gone. Do not redesign.

### Files

- `assets/mascot.png` — original art, the reference.
- `assets/mascot.svg` — the vector on a 64×64 grid. Source of truth; everything else is
  cut from it. Transparent, neutral pose, white face and dark eyes.
- `assets/mascot-left.svg`, `-right.svg`, `-up-left.svg`, `-up-right.svg` — pose
  variants, eyes slid toward that side. The up poses add a 4° tilt. Only the eye group
  moves; the face never does. Saved for future use, not referenced by the site.
- The standalone files and the favicon stay **white face on dark eyes** — the dark-mode
  colourway. They are used as avatars on dark surfaces, and a favicon can't know the
  page theme. Only the in-page mascot inverts.

### On the site

- The mascot is at the top of the lockup, ~110px, centred, with a soft halo behind him
  and clear space beneath. He is a character, not an icon.
- **He is also the second entry point to the contact form** — `role="button"`,
  keyboard-reachable, and pressing him does exactly what the CTA does.
- **Eyes follow the cursor** on desktop, from anywhere on screen. Capped at ±6 and ±3.8
  user units by construction, which is what keeps them on the face. Tracking stops while
  the form is open.
- **Blinks every 4–6s** with randomness, eyes squash flat for ~120ms. Both eyes, snap
  not fade.
- **Eyes go wide when the form opens** (`--wide: 2.2`), back to normal on restart. It
  multiplies the same `scaleY` the blink uses, so he can still blink while surprised.
  **The shared transition must stay under 120ms** or the blink silently stops working.
- **Touch and reduced motion: eyes centred, blink only.** The blink is the one
  deliberate reduced-motion exception on this site.
- Colours are token-driven: face `--face`, eyes `--eye`, and `--eye` always equals the
  page background.

Exact geometry, the proportion table, the variant transforms and the do-not-do list live
in `skills/page-builder/SKILL.md` → Mascot. That file is the source of truth.

## Next steps

In this order, agreed 2026-08-24. **Rechecked 2026-08-25: still six items, same order,
nothing done and nothing dropped.**

1. **Re-scrape the card.** It is pushed and live. Run the url through the X and Facebook
   card validators once: both cache hard, and any link that was fetched before the image
   existed keeps showing the old small card until it is re-scraped. **Not run yet,
   confirmed 2026-08-25.**
2. **Translate the description into RU and LV.** Both stubs are carrying the english
   string as a holding position. Watch the dash rule: RU and LV both reach for the em
   dash where english uses a comma.
3. **Recheck the sitemap in Search Console.** `sitemap.xml` carries `/`, `/ru` and
   `/lv`. Confirm the property exists, the sitemap is submitted, and all three urls are
   actually indexed rather than merely accepted. **`/demo/` is now live and fetchable**
   since `2bcfb62` — check whether it turns up in coverage, and if it does, add
   `Disallow: /demo/` to `robots.txt`.
4. **Upload the yellow profile picture on Telegram.** The other platforms already carry
   the mascot.
5. **Walk the whole form against the live endpoints**, all four paths, and confirm each
   one lands in both the inbox and Telegram. Delivery is confirmed; the full flow is
   not, and every run in this repo's history was against a stubbed network.
6. **The about section, as a concept.** It is not a rebuild: an about section was built
   and removed on 2026-08-22 and the entry in Decisions says why. Start from what the
   page needs now, not from that code.

### Content queue

- **post3, "missed calls".** Queued 2026-08-25, not built. Same composer rig:
  `demo/post2.mjs` is the template, so this is a copy with new copy and new eye keys,
  not a new pipeline.

  ```
  statement    every missed call is missed money
  bubble beat 1  ai answers in 3 seconds.
  bubble beat 2  every time.
  ```

  - The statement is written lowercase here because the scene sets caps with
    `text-transform` and uppercases the cells in js. Six words against post2's five,
    so **the line breaks are a fresh decision, not a copy of post2's** — the fit
    divides by the longest line's cell count, and a bad break costs real size. Four
    short lines beat three long ones.
  - Two beats again, and the second is the punchline, so it wants the same deadpan
    look back at the viewer post2 uses for `i am fine.`
  - Everything else carries over untouched: the phone safe framing, the safe area
    guard, the wordmark, the two cuts, the seeded idle, the servo on the turns.
- **post4, "3 free ai tools", is built** — 2026-08-26, `demo/post4.mjs`, rendered
  and ready for the editor. It jumped post3 in the queue; post3 above is still
  unbuilt and still wants building. Caption and hashtags not decided, and the
  hashtag count is still the open question below.
- Beyond post3, still no cadence and no pillars. Two clips is a format, three is a
  habit; what is missing is a reason to post, not another asset.

Not scheduled, parked:

- **Analytics, as an idea only.** CLAUDE.md and the skill both ban analytics, trackers
  and cookie banners outright. Nothing goes in the page until Einz lifts that rule in
  writing, and the first question is what number would actually change a decision.
- **Content cadence and pillars.** The first video is posted and the reel pipeline can
  produce more on demand. What is missing is a rhythm and a reason, not another asset.

## Open questions

- Business email to publish — still not decided. The form is now the contact route, so
  this is no longer blocking, but a real address is still worth having.
- Whether the full site stays single-file as it grows past v1. Default: stays
  single-file until it genuinely can't.
- ~~Whether to ship an `og:image`, and which theme it wears.~~ Decided 2026-08-24: yes,
  and light. `assets/og.png` exists. See Decisions.
- Whether the RU and LV stubs keep the english description or get translated ones. They
  share the english string today. **Confirmed still open 2026-08-25 — the stubs still
  carry the english string.** Next steps item 2.
- **How many hashtags a post carries.** post1 went out with five on tiktok, post2 with
  three everywhere. Lowercase is settled; the count is not. Pick one before post3.
- ~~Whether to register the site in Google Search Console and submit the sitemap.~~
  Decided: yes. It is Next steps item 3, as a recheck rather than a first setup.
- Whether the light or the dark screenshot is the one that goes on the socials.

## Not committed / lives elsewhere

- **Social banners** for X, Facebook and YouTube — delivered, not in this repo.
- Brand image assets (`BT.png`, headers, earlier mascot renders) sit in
  `~/Downloads/Boring TEK files/`. Not committed — decide format and whether inline SVG
  can replace them before adding any binary.
- `assets/` in the repo holds the mascot — `mascot.png` (reference), `mascot.svg` (source
  of truth) and the four pose variants — and, since 2026-08-24, `og.png`, the share card.
  That card is the first binary the live site actually requests.
