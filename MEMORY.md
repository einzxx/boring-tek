# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- **Built and then fix passed 2026-08-28: `demo/post10.mjs`, the tenth clip,
  "the rage clip", the first one that is dark and the first with no accent in it
  anywhere.** **13.25s, 60fps, 1080x1920, 795 frames, 4.33 MB (2.61 Mbit/s)**,
  the voice and four slices of music in the file, rendered with the shutter open
  at four subframes in **7.3 minutes**. **The live site did not change** —
  `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language stubs and
  `assets/` were all untouched. **The source is on `main` and public: the first
  cut in `576f947`, the fix pass in `d5c4ae6`.** Neither push changed a file a
  visitor sees. **Not posted, either cut.**
  - **The first cut was 16.87s and it read word by word.** Einz asked for three
    changes and they are the shape of the clip now: the script is four
    continuous sentences instead of seventeen, the stabs are half a second
    instead of four tenths, and the outro is two seconds instead of one. What
    did not move: the look, the glitches, the margins, the mix targets, the
    voice trim, the crf, the seventeen cards on screen.
  - **The delivery is a reading rather than a list.** One take per group, Andrew
    at **-10% and -4Hz** — two numbers rather than a fourth voice, and the list
    stays closed at three. **2.97 to 5.68 words a second** against a flat 2.3,
    with the phrasing arriving as a 0.46s hole after `you,` and 0.12 to 0.18s of
    breath before `every`, `could` and the second `every`: pauses the reading
    puts there rather than ones the punctuation forces.
  - **What that cost, and how it was paid.** A card breaks at a sentence end,
    so with one sentence to a group there was nothing to break on and `perCard`
    cut `fuck you i`, `am gonna become`, `you said a` — post9's `do it we`
    again. **The cut is marked rather than inferred now**: `markCards` puts a
    comma on the last word of each card, **on the caption's copy only, after the
    synthesiser has spoken**, and `punctuation: 'drop'` takes it off before a
    card is drawn. Nothing about the audio or the timing moves by a millisecond,
    and the engine is untouched — it is the option `cardBreak` was added for.
  - **The stab and the gap it lives in are one number, and that is now
    guarded.** The music only ever plays where the voice is not, so a 0.5s stab
    in a 0.4s hole would play under the next word and fail the render. The gap
    went to 0.50 with the stab. **Stabs at 3.64s, 6.18s and 8.71s**, same three
    sources, same escalation (-8.2, -7.7, -6.3 dBFS attacks, still checked).
  - **The outro moved when it doubled, and a measurement moved it.** Extending
    the old 49.06 region to two seconds is the obvious answer and the wrong one:
    over 2.00s it rises +0.5 dB and ends at -9.6, a slice that runs out rather
    than arrives. Every 2.00s window in the track was scored on how much it
    rises and how loud its last quarter second is. **16.60 + 2.00 wins** — +2.5
    dB across itself, and it **ends on its own loudest sustained passage**, so
    the hard cut reads as a cut. It lands at **10.10s**.
  - **The end card earns its two seconds and the preview's review is why.** With
    one beat in it the wordmark sat unchanged for 1.05s and again for 0.77s. It
    has three now, all read off the slice: the brand arrives on a hit at
    **+0.57**, is hit again at **+1.45**, and once more at **+1.91** — 0.09s
    before the music stops, so the last thing the clip does is get hit and then
    go quiet. Longest unchanged stretch 0.60s.
  - **The liveness guard caught a fault the eye could not, and it was 60fps
    only.** The first final came back with one identical frame pair at 11.8333s.
    Real: on the end card the mascot, caption and bubble are gone and the grain
    and scanline are stepped, so the phosphor was the only thing moving — and **a
    sine stands still twice a period**, so the two frames either side of its
    turning point wrote exactly the same values. At 12fps no pair lands
    symmetrically about the peak, so the preview was green. Fixed at the cause:
    the phosphor is two sines on incommensurate periods. Measured — one sine,
    one pair and a change of exactly zero; two, none and 3.7e-4. **That is the
    second fault this pipeline has produced that a preview cannot show**, after
    post9's frame zero leg.
  - **The rest still holds, re-measured on this cut.** No accent on any frame
    and the guard did not fire. **0.000s of music inside a word**; the voice
    under the three stabs peaks at -58.9, -50.8 and -52.3 dB, which is 38, 30
    and 31 dB under speech. The ducker is off, and at post6's 0.60 the envelope
    is 0.986 open when a stab lands and would take **7.8 dB off every stab's
    attack**. Delivered at **-14.2 LUFS / -1.0 dBTP**, limiter pulling 4.0 dB
    over three passes. Safe margins **192 left, 941 top, 164 right, 929 bottom**
    against floors of 140, 180, 140, 220, sampled at every card's settled frame
    and at every one of the six glitches' hottest frames. **17.7% of frames
    carry a glitch** and every channel is at rest outside a window: 0 faults.
  - **`skills/video-review` has now run four times on this clip, twice per cut.**
    The fix pass's preview found the end card holding; its final found nothing
    the guards had not. Reviews at `demo/out/review-post10-preview.md` and
    `demo/out/review-post10.md`, both gitignored and both rewritten for this cut,
    so the findings are under Decisions as well.

- **Built 2026-08-28 and fixed the same day: `demo/post9.mjs`, the ninth clip,
  "the pitch reel", and the first one that films the live site.**
  **23.89s, 60fps, 1080x1920, 1433 frames, 5.97 MB**, voice and 54 effects in the
  file, rendered with the shutter open at four subframes in 11.4 minutes.
  **The live site did not change** — `index.html`, `CNAME`, `robots.txt`,
  `sitemap.xml`, the language stubs and `assets/` were all untouched, and the page
  was filmed exactly as it is in git. **Committed, not pushed, not posted.**
  **post9 is parked.** No more work on it until Einz says so. The three things
  the review found are a backlog under Decisions and none of them is done.
  - **The three pending numbers landed and they are the three above, confirmed
    2026-08-28.** The clip had passed everything except a single frame of
    bookkeeping: pass C's frame zero landed a hair before its own camera leg
    started, so the cut frame was counted as a held shot with site text behind
    the caption. **It appeared only at 60fps** — at 12 the rounding went the
    other way — and it was fixed by activating a leg within half a frame of its
    own start. The corrected re-render is the one the figures above come off:
    **held clash count 0 rather than 1, 5.97 MB, 11.4 minutes.** Nothing visible
    changed, which is what the fix was supposed to do: duration, resolution,
    frame count, margins, camera landing errors and the mix are all identical to
    the run before it. **No number in this entry is pending any more.**
  - **It is a cut film, not a composed frame.** Four render passes into one
    `f%06d.jpg` sequence over one clock, encoded once: pictograms for beats one
    and two, the live site for three to five, the live site loaded fresh for beat
    six, the end card for beat seven. 505, 523, 158 and 247 frames. Three hard
    cuts, at **8.41s, 17.13s and 19.77s**.
  - **The first cut passed every guard it had and was wrong in five ways a phone
    showed.** That is the thing worth carrying forward, not the clip. The fix
    pass is written up under Decisions; the short version is that the safe area
    was the frame's rather than a platform's, the captions had no fixed home,
    there was green that was not a money word, the moves were shy, and the typing
    was a machine.
  - **The numbers it ships on.** Platform safe margins clear on every edge:
    **779 top, 244 bottom, 191 left and right** against floors of 180, 220, 140
    and 140. Caption zone fixed at **710..763 css** for all four passes, 394
    device px off the bottom edge. Every camera move lands on its beat's first
    word to the frame, **0 frames of error on all five**. Delivered at **-14.2
    LUFS / -1.0 dBTP**.
  - **It cost two engine additions and both are reusable**: the `float` caption
    style with `flash` and `cardBreak` in `lib/captions.mjs`, and `servo` in
    `lib/sfx.mjs`. The green card default is untouched and post6 and post7 re-plan
    identically, which was checked rather than assumed.

- **Studied 2026-08-27,- **Studied 2026-08-27, not built, and not to be built without a conversation
  first: a new format direction, off `unterberg.ai`'s reels.** Three separate
  ideas, and only two of them are ours to start. Written down under Socials with
  what each one would actually cost.
  1. **Animated fake ui mockups in the paper style** — a chat ui, a dashboard, a
     command palette, drawn the way the pictograms are drawn. The scene engine
     already does most of this; what it does not have is a type vocabulary, and
     a ui without text is not a ui.
  2. **Big type end cards.** The smallest of the three and the one with no
     dependency.
  3. **The comment magnet loop** — a viewer comments a word, we dm them a useful
     file. **It is blocked on a thing that does not exist: the file.** There is
     no lead magnet, and there is no point building the loop that delivers one.
     It is also the first idea in this file that would collect a stranger's
     handle, which is a decision rather than a feature.
  **None of it is queued and none of it is approved.** Einz asked for it to be
  studied and said discuss before building. This entry is the study.

- **Built 2026-08-27: `demo/post7.mjs`, the seventh clip, `one tip for your
  business`.** **10.22s, 60fps, 1080x1920, 0.68 MB**, voice and 16 effects in the
  file. post6 is the template and this is the first clip built on the whole stack
  at once rather than on one that grew under it. **Pushed in `3874b6c`.** **The
  live site did not change** — `index.html`, `CNAME`, `robots.txt`,
  `sitemap.xml`, the language stubs and `assets/` were all untouched.
  **The posting pack is written down and the clip is not posted.** Caption,
  tweet and three tags per platform are all decided and under Socials; there is
  no report that any of it went out. Whoever reads this next: the gap is
  posting, not deciding.
  - **One scene, evolving, no handoffs.** Five squares arrive, four dim to 18%,
    the one left gets a check cut into it, a second lights up in accent. Every
    change is keyed to the word being said, and `not five` lands with exactly
    five squares up.
  - **The beat lands once, not twice.** The brief asked for both times `one`
    lands alone; the copy only lands it alone once, at 4.87s. `one` is also said
    inside `one tip` and `one boring task` and neither gets a card of its own.
    Written up in Decisions — it is a copy fact, not an engine limit.
  - **`capSize` is 30 here against the engine's 40**, because on short copy the
    beat is what sets the caption size. At 40 the ordinary cards fitted at 39.6px
    against a 44px beat, an 11% jump that reads as a wobble. At 30 the beat is
    1.47x, post6's 1.55 within a fraction.
  - **It cost the engine three fixes**, one of them a real latent bug: `fade`
    could not go to a level rather than a switch, a step was overwriting the
    opacity of the step in front of it, and the closing hum had nowhere sensible
    to sit in a one scene clip. All three are in Decisions. **post6 is
    unaffected and was re-checked frame by frame to prove it.**
  - Delivered at **-14.5 LUFS / -1.0 dBTP**, effects 22.1dB under the voice at
    their closest. Zone at post6's position, all clearances green.
  - **post3, "missed calls", is still unbuilt.** post7 jumped it as post4, post5
    and post6 all did. It is still queued.

- **Built 2026-08-27, third pass on the clip: the captions lost their full stops,
  the zone came down another 70 device px, and the clip has sound.**
  `demo/lib/sfx.mjs` is new; `demo/lib/captions.mjs`, `demo/lib/pictograms.mjs`,
  `demo/post6.mjs` and `demo/scenes-test.mjs` changed. **The live site did not
  change** — `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language
  stubs and `assets/` were all untouched. **Not re-posted:** what is live on the
  platforms is still the outline clip from `dd5a79f`.
  - **Captions carry words and nothing else.** `punctuation: 'drop'` is now the
    engine default and a brand rule, not a clip's preference. 34 marks came off
    this script. **The punctuation stays in the script**, where the synthesiser
    reads it as the pause it is there for, so no timing moved. A question mark
    survives. It strips at the edges only, and it runs *after* the cards are cut
    — see Decisions.
  - **The scene zone is at `y 175`**, 70 device px lower and the third move for
    that block. Clearances all green: **112px from the lowest shadow to the
    caption ceiling and 139px from the ink** (floor 40), **284 and 253 device px
    to a border** (floors 96 and 72), caption to head 104px (floor 60).
  - **`demo/lib/sfx.mjs`: eight sounds, synthesised in javascript, no audio file
    in the repo.** 46 effects in post6, every cue derived from a plan that
    already existed rather than typed. **The mix is measured, not claimed:**
    voice on top, bus ducked 8dB under speech, closest an effect gets to the
    voice is 13.8dB under, delivered at **-14.4 LUFS / -1.0 dBTP** on the
    finished mp4. The strip carries the scene effects only at -20 LUFS.
  - **The balance between the two tracks is one number, and it is -1.5dB on the
    voice** (84% of decoded), set 2026-08-27 after listening. It does not make
    the clip quieter: the loudness pass scales both tracks together to the same
    target, so trimming the voice moves the effects up against it and the eight
    numbers in `GAINS` never move. **There is no music track** — voice and
    effects only, and the guards count both.
  - **Two of the three sound decisions were made by a measurement failing**, and
    both are worth keeping: the under-the-voice check was wrong twice before it
    was right, and gain alone cannot reach a loudness target. See Decisions.

- **Built 2026-08-27, after the scene layer shipped: the pictograms are solid ink
  with real depth, the zone came down another 46 device px, and there is a
  standalone strip for judging them.** `demo/lib/pictograms.mjs` and
  `demo/post6.mjs` changed; `demo/scenes-test.mjs` is new. **The live site did
  not change** — `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language
  stubs and `assets/` were all untouched, so the push changed nothing a visitor
  sees. **Pushed, but not re-posted:** post6 is re-rendered at 22.20s, 60fps,
  1080x1920, 1.60 MB, voice still in the file, all checks passing, and it is the
  version in the repo now. **The clip that is live on the platforms is still the
  outline one from `dd5a79f`** — the solid ink render has not gone out and
  replacing it there is Einz's call, not something done from here.
  - **Outline clipart became solid ink.** Filled silhouettes, detail cut out to
    the page rather than drawn on top, one soft drop shadow per shape that grows
    while a shape is in the air and tightens as it lands, and a real damped
    spring under every pop. Three design calls and four geometry fixes came off
    rendered frames rather than out of a plan and all of them are written down
    under Decisions.
  - **The scene zone moved 117 to 140 css px**, 46 device px lower, second move
    for that block. Re-verified against the fixed caption ceiling at y=495:
    **147px of clear air from the lowest shadow and 174px from the lowest ink**,
    floor 40. Border clearance 250px on the ink and 232px on the shadow, floors
    96 and 72.
  - **`demo/scenes-test.mjs` renders `demo/out/scenes-test.mp4`**, the five scenes
    back to back with the dead air cut to a third, 10.18s, silent, in
    production's own frame. It **imports** post6's scene table rather than
    copying it, which is why post6's run block now sits behind a `main()` guard.
  - **The one deliberate deviation from the design system is the drop shadow.**
    `skills/page-builder/SKILL.md` bans them and this is demo only. See
    Decisions.
- **Session close 2026-08-27: the pictogram scene layer is shipped and pushed, post6
  is out in its full production form, and factory v1 is complete.** `dd5a79f` put
  `demo/lib/pictograms.mjs` and the re-rendered clip on `main`. **The clip that is
  public is the full stack**: the Andrew voice inside the mp4, the `pop` captions cut
  from its word timestamps, the five pictogram scenes in the top third, and the mascot
  under them, all on one clock. 22.20s, 60fps, 1080x1920, 1.56 MB, every guard passing.
  **The live site did not change** — `index.html`, `CNAME`, `robots.txt`,
  `sitemap.xml`, the language stubs and `assets/` were all untouched by this session,
  so the push changed nothing a visitor sees.
  - **Posted**, and the caption and the per platform hashtags are now written down.
    `3 things ai should not do in your business. save this.`, three lowercase tags each
    on tiktok, instagram and youtube, and no tags at all on X, which gets the line as
    tweet text instead. Einz's report, not something measured here. **The one open item
    the last session created is closed with it** — no post in this file is unrecorded
    any more. See Socials.
  - **Factory v1 is complete.** A script goes in and a finished clip comes out: voice,
    captions, scenes, mascot, guards and the mp4, in one command. What is still by hand
    is named under Current state and has not changed.
  - **The open list is unchanged, rechecked at this close.** Still the same six items in
    the same order, nothing done and nothing dropped. This session built a scene engine
    and did not touch one of them, which is worth noticing rather than explaining away.
- **Built 2026-08-27, after the factory checkpoint: `demo/lib/pictograms.mjs`, an
  animated pictogram scene layer, and post6 re-rendered with it.** Five flat svg
  scenes in the top third of the frame, one per beat of the voice, drawn in code and
  driven per frame through the rAF shim. **The empty upper half of post6 is gone and
  that is the one thing that changed about the frame** — the caption, the mascot and
  the wordmark are all where they were. **22.20s, 60fps, 1080x1920, voice still inside
  the mp4, 1.56 MB, all checks passing**, including six new guards written for the
  layer. **The live site did not change**: `index.html`, `CNAME`, `robots.txt`,
  `sitemap.xml`, the language stubs and `assets/` are all untouched. Two design calls
  were made off the first render rather than in advance and both are written down
  under Decisions. **Pushed in `dd5a79f`, and the clip with the scenes is the one that
  went out** — see the session close bullet above. See Current state.
- **Checkpoint 2026-08-27: the factory is v1 and it is pushed.** `b30bee8` put the whole
  content pipeline and the sixth clip on `main`: `demo/lib/captions.mjs`,
  `demo/lib/voice.mjs`, `demo/analyze.mjs`, `demo/captions-test.mjs` and
  `demo/post6.mjs`. **The live site did not change** — no visitor sees anything new, and
  `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language stubs and `assets/`
  were all untouched. Four things were settled with it:
  1. **The `pop` caption style defaults to `fill: 'card'`.** The card springs in whole
     and the accent walks across it. `fill: 'word'` is still there for anything that
     wants the older reveal, and an unrecognised value throws.
  2. **post6 is rendered and posted**, with the **Andrew voice embedded in the mp4** —
     the first clip in the series that ships its own sound rather than handing the
     editor a plan. Posted with a caption and hashtags. **Neither is written down here
     yet**, and that is the one gap this checkpoint leaves; see Socials.
  3. **English is the only voice language, permanently.** No Russian and no Latvian
     voice, on any clip, ever. Einz's decision, locked. See Decisions.
  4. **The next clip is a script away.** Feed a script in, get a video out, in minutes
     rather than in a session. The measured part of that is real; the part that is still
     by hand is named under Current state.
- **The open list is unchanged, rechecked 2026-08-27.** Still six items in Next steps,
  same order, nothing done and nothing dropped. The factory did not touch any of them.
- **Built 2026-08-27: `demo/post6.mjs`, the sixth clip, and the first one built on the
  new machine.** `3 things ai should not do in your business`, the honest advice angle.
  **22.20s, 60fps, vertical only, and the voice is inside the mp4** at
  `demo/out/post6-1080x1920.mp4`. The voice is generated first and everything follows
  it: the captions are cut from the synthesiser's own word timestamps, the clip's length
  is the voice's length plus a tail, and the mascot's gaze is keyed to the beats in it.
  No statement, no bubble, no dashes, light theme, all guards passing. **Sync was
  measured on the finished file, not assumed:** a constant 46 to 57ms offset with no
  cumulative drift over twenty two seconds, and it shrinks as the detector's threshold
  drops, which makes it a threshold artefact rather than lag. **The live site did not
  change.** Building it found and fixed two real bugs in `lib/captions.mjs` and added two
  options; the three style test clips were re-rendered because the engine moved under
  them. **Then the `pop` style's card fill was approved as the default for everything**,
  and the style clips and post6 were re-rendered once more against it. See Current state
  and Decisions.
- **Built 2026-08-28: the pictogram motion engine runs on gsap, and renders can carry
  true motion blur.** `demo/lib/pictograms.mjs` had its motion core replaced — one
  `buildTimeline` shared between node and the page, five house curves named in one
  place, DrawSVGPlugin instead of hand written dashoffsets, volume preserving squash
  and stretch on every pop and landing, per part stagger, and a clock check that
  fails a render unless gsap's own time is the frame index over the frame rate.
  `demo/scenes-test.mjs` gained `--scene=<id>` and `--blur`. **No scene content
  changed and no scene table was edited**, the site did not change, and the one new
  dependency is `gsap` in `demo/` only. Measured on post6's money beat, 5.34s at
  1080x1920/60fps: gsap clock error 3.3e-8s, page against node 0, and the shutter
  costs about four times the render. See Current state and Decisions.
- **Built 2026-08-27: a content pipeline in `demo/lib/`, three capabilities, none of
  them wired into a post.** An animated caption engine in three styles, a free voice
  from edge tts with real per word timestamps, and a reference analyzer that reads a
  video somebody else made and writes down its skeleton. Plus `demo/captions-test.mjs`,
  which renders the three styles as five second clips with the voice muxed in so they
  can be judged rather than described. **No new dependency** — `package.json` is
  untouched and the websocket protocol is written out by hand. **The live site did not
  change**, and neither did `record.mjs`, `post2.mjs`, `post4.mjs`, `post5.mjs` or
  `og.mjs`. Two things needed fallbacks and both are honest about it: whisper is
  installed but its model weights could not be downloaded on this machine, and tesseract
  is not on it at all. See Current state and Decisions.
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
- **Built and pushed 2026-08-26: `demo/post5.mjs`, a fifth social clip, `what is the
  most boring part of your business?`.** Ten and a half seconds, 60fps, vertical only,
  out to `demo/out/post5-1080x1920.mp4`. post4 is the template. The statement is six
  lines and holds the whole clip; the bubble comes up once at 4.50 and **swaps in
  place** rather than exiting, `tell us.` then `we will fix it.`; and **the mascot
  searches the room on two axes**, the first clip to drive `--ey` at all. All three
  guards pass and the gaze guard was widened to measure both axes. Built and pushed
  in `990b206`. **The live site did not change.** See Decisions.
- **Plan locked 2026-08-27 for post5, and it posts 2026-08-28.** Caption, music, the
  servo cue list and a posting rule for the format are all set and written down under
  Socials. **No voice line, which is a first** — the eye turns carry the clip. Einz's
  decisions, not something measured here, except the cue timings, which were checked
  against the render and **do not mean what the number list looks like it means.** See
  the timing note under Socials before the mix. **Hashtags are still unwritten.**
- **Built, resized and pushed 2026-08-26: `demo/post4.mjs`, a fourth social clip,
  `3 free ai tools for your business`.** `f01e0a7` built it, `6817c4b` resized it.
  Nineteen seconds, 60fps, vertical only, out to `demo/out/post4-1080x1920.mp4`.
  Four bubble beats with real air between them for a voice line and a logo per
  beat. The head is 136px with its top on 42% of the frame and the bubble rides
  it. **The render is with the editor and the clip is not posted yet** — caption,
  tweet, tags, music and the voice plan are all decided and written down under
  Socials. **post3 was skipped, not renamed** — "missed calls" is still queued and
  unbuilt, and post2 was the template. **The live site did not change.**
  See Decisions.
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
Lowercase is the part that held across both. **The count is settled as of 2026-08-26:
exactly three lowercase hashtags per platform** — see the house rule under post4.
post1 is the outlier and stays one.

#### post2 — posted 2026-08-25, recorded 2026-08-25

- **Caption, X:** `scared of ai?`
- **Hashtags, tiktok:** `#ai #aitakingjobs #techtok`
- **Hashtags, instagram:** `#ai #aitakingjobs #automation`
- **Hashtags, youtube:** `#ai #artificialintelligence #future`

Three each, lowercase, and the **ai taking jobs** angle is carried by every platform
except youtube, which trades it for the broader `#artificialintelligence #future`.

#### post4 — built 2026-08-26, not posted yet

The clip is rendered and with the editor. Everything below is the plan Einz set, not
something measured here, except the timings noted against the render.

- **Caption:** `3 free ai tools your business can use today. all from google. which one
  you trying first?`
- **Tweet, X:** `3 free ai tools for your business. all from google. most people never
  heard of them.`
- **Hashtags, tiktok:** `#ai #aitools #techtok`
- **Hashtags, instagram:** `#ai #aitools #automation`
- **Hashtags, youtube:** `#ai #aitools #business`

Three each, lowercase, and **`#ai #aitools` is the spine on all three** with the third
tag doing the platform: `#techtok` for reach, `#automation` for the feed we want,
`#business` for the search. No dashes in any of it, and no exclamation marks.

- **Music: Vivaldi, Spring.** Named rather than left as "classical", which is a first
  — the recipe below still governs everything else.
- **Voice lines at 4.4, 9.4 and 14.4**, with a logo after each. Three voice marks
  against four beats: the close carries itself.
- **One timing to check before the mix.** The render's gaps run 4.86 to 6.00, 9.26 to
  10.40 and 13.66 to 14.80. **9.4 and 14.4 land inside their gaps; 4.4 does not** —
  beat 1's pill is still up until 4.50 and not clear until 4.86, so a voice line at 4.4
  starts over the bubble by about half a second. Either it is deliberate overlap or 4.4
  wants to be 4.9. Not changed here; the render was not touched for it.

#### post5 — built 2026-08-26, plan locked 2026-08-27, posts 2026-08-28

The clip is rendered. Everything below is the plan Einz set, not something measured
here, except the cue timings, which were checked against the render and carry a
correction.

- **Caption:** `what is the most boring part of your business? tell us in comments. we
  will tell you if ai can fix it.`

  One caption, not one per platform. It is the first of these clips that asks the
  viewer a question, so the comments are the point rather than the watch time, and the
  caption is written to earn a reply rather than a view. No dashes, no exclamation
  marks, lowercase throughout.
- **Hashtags: not written yet, on any platform.** The house rule below still stands —
  exactly three lowercase per platform — so this is three tags times three platforms
  still owed, not a decision to skip them.
- **Music: classical, low, under everything.** Not named the way post4 named Vivaldi's
  Spring. That is the base recipe unchanged, so anything classical and quiet fits.
- **No voice line, and that is deliberate.** post4 planned three voice marks and a
  logo per beat. This clip has none: the mascot searching the room is the performance,
  and a narrator over it would explain a joke that works by being silent. It also
  makes post4's "one timing to check" moot here, and it means the TTS shortlist below
  is not needed for this post.
- **Servo cues, locked:** `1.00 1.85 2.60 3.40 4.05 4.85 6.45 7.25 9.75 10.50`

  Ten cues for ten eye turns, and they match the render exactly — this is the list
  `node post5.mjs` prints, not a hand transcription.

- **Read the cue list before you cut to it.** Those ten numbers are the times each
  turn **finishes**, not the times it starts. The eyes ease from the previous key to
  the listed one, so the movement runs for 0.30 to 0.50s *before* each number. A servo
  `zzt` placed on the timestamp lands as the eyes stop moving, about half a second
  late. The windows, start to end:

  ```
  0.55→1.00   1.35→1.85   2.15→2.60   2.95→3.40   3.60→4.05
  4.35→4.85   6.10→6.45   6.75→7.25   9.30→9.75   10.20→10.50
  ```

  Two consequences. The sound wants to sit at the **start** of each window, or ride
  it. And **the tenth turn never completes**: the last frame is 10.4833 and the turn
  ends at 10.50, so the clip cuts mid movement, by design, for the loop. A servo there
  gets cut off by the end of the file, which is either fine or a reason to drop that
  cue to nine.

  `post5.mjs` prints this list under the label "servo cues", which is what would
  mislead. The label is wrong, the numbers are right, and nothing about the render
  changes either way.
- **Posting rule for this format, new and house wide:** a clip that asks the viewer a
  question gets **a reply to every comment, same day**, and the replies are **dry
  mascot one liners** — the bubble's voice, not a brand account's. This is the first
  posting rule this file has carried that is about what happens after the post rather
  than about the post. It applies to the question format, not to every clip.

#### post6 — built and posted 2026-08-27

The first clip that shipped with its own sound. `3 things ai should not do in your
business`, 22.20s, vertical, and the voice is **inside the mp4** rather than added in
the edit. Everything about the render was measured here; the posting is Einz's report.

- **Voice: `en-US-AndrewNeural`**, the `calm` default in `lib/voice.mjs`, rate `-8%`,
  pitch `-2Hz`. 54 words, timings from the engine rather than estimated, 21.55s of
  speech in a 22.20s clip.
- **Caption and hashtags, recorded 2026-08-27 at the session close.** The gap this
  clip opened is closed.

  ```
  caption (tiktok, instagram, youtube)
    3 things ai should not do in your business. save this.

  tiktok      #ai #aitips #techtok
  instagram   #ai #aitips #automation
  youtube     #ai #aitips #business
  x           no tags
              tweet text: 3 things ai should not do in your business
  ```

  - **Three lowercase tags on the three platforms that carry them**, which is the house
    rule holding for the first time without having to be corrected from memory. `#ai`
    and `#aitips` are the constant pair and the third is the platform's own register:
    `#techtok` on tiktok, `#automation` on instagram, `#business` on youtube.
  - **X carries no tags at all, and that is deliberate rather than an omission.** It
    gets the line as tweet text instead, and the tweet drops `save this` — a save
    prompt is a tiktok and instagram habit and reads as begging on X.
  - **`save this` is the only call to action in the caption.** No link, no "dm me", no
    "follow for more". It is also the first caption in the series to ask for anything.
  - **Two full stops, and they were corrected once.** The caption first went into this
    file as `... in your business save this`, unpunctuated, because it was dictated
    rather than pasted. It is two sentences and the brand writes in short lines with
    full stops, so it is `business. save this.` **The lesson is the same one this
    section exists for:** a caption reconstructed from speech loses exactly the part
    nobody notices is missing. Paste captions, do not retype them.
- **No separate sound plan, and that is the change.** post4 planned three voice marks
  and a logo per beat; post5 planned ten servo cues and no voice. This clip needs
  neither, because the narration is already in the file and cut against the captions to
  within about 45ms. The rest of the sound recipe below still applies if the editor
  wants music under it, but the clip stands up with nothing added.
- **The script, verbatim**, because it is the thing the captions are cut from and
  regenerating the voice from a reworded copy would move every caption:

  ```
  3 things ai should not do in your business.
  one. talk money with clients alone. a human checks the deal.
  two. touch customer data without rules. decide what it can see first.
  three. work without checking. ai makes mistakes. someone must look.
  good ai has a human behind it. that is the whole secret.
  ```

  Honest advice rather than a claim, which is the angle: the only kind of ai post worth
  anything from a shop that sells ai. No dashes, no exclamation marks, lowercase apart
  from the opening numeral.
- **The beats land at 3.14, 7.53 and 12.81s** and are drawn at 44px against the
  ordinary cards' 28.3. **The mascot comes to the viewer once, at 17.95**, and stays
  there to the end.

#### post7 — built and pushed 2026-08-27, not posted

`one tip for your business`, 10.22s, vertical, voice and 16 sound effects inside the
mp4. Everything about the render was measured here; everything below is the pack Einz
set, and **nothing here is a report that it went out.**

- **Voice: `en-US-AndrewNeural`**, the `calm` default, rate `-8%`, pitch `-2Hz` — the
  same voice and the same two overrides post6 uses. 22 words, 9.12s of speech in a
  10.22s clip.
- **The pack.**

  ```
  caption (tiktok, instagram, youtube)
    start with one boring task. not five. save this tip.

  x           tweet text: automate one boring task first. not five. one.

  tiktok      #ai #aitips #techtok
  instagram   #ai #aitips #automation
  youtube     #ai #aitips #business
  ```

  - **The tags are post6's, unchanged on all three platforms.** `#ai #aitips` is the
    constant pair and the third does the platform's own register. Two clips in a row on
    the same spine is the first sign of a set rather than a series of one offs, and it
    is worth keeping deliberately rather than by habit.
  - **The caption is the script, cut down.** `start with one boring task. not five.` is
    lifted from the middle of the narration, which means the caption and the voice
    agree without anybody having to keep them in step. `save this tip.` is the call to
    action and it is post6's `save this.` with a word on it.
  - **The tweet is a different sentence, not the caption with the tags removed.**
    `automate one boring task first. not five. one.` It ends on the beat the clip ends
    on. X carries no tags, which is the rule post6 set and is deliberate rather than an
    omission.
  - Three lowercase tags per platform, no dashes, no exclamation marks, lowercase
    throughout. All of it holds.
- **The script, verbatim**, because the captions are cut from it and regenerating the
  voice from a reworded copy would move every caption:

  ```
  one tip for your business.
  start with one boring task. not five. one.
  automate it. see it work. then take the next.
  ```

- **The beat lands once, at 4.99s**, on the `one` that is a sentence of its own, drawn
  at 44px against the ordinary cards' 30. The brief asked for both times it lands
  alone; the copy only lands it alone once, and the copy was not changed to make the
  number come out right. See Decisions.
- **No separate sound plan**, for post6's reason: the voice and the effects are already
  in the file, mixed and measured. Nothing is owed to an editor.

#### A direction studied 2026-08-27, off `unterberg.ai`'s reels — not built

Einz watched a reference account and asked for the direction to be studied and written
down rather than started. **Nothing below is queued, approved or begun, and the
instruction is to discuss before building.** It is three ideas that arrived together
and they are not one job.

- **1. Animated fake ui mockups, in our paper style.** Chat interfaces, dashboards,
  command palettes, built the way the pictograms are: solid ink, cut details, one soft
  shadow, springs with weight. The scene engine already does most of it — a dashboard
  is rectangles and a command palette is a rectangle with a bar in it.

  **What it does not have is type.** `lib/pictograms.mjs` says out loud that there is no
  text in a pictogram, and it says it because the vocabulary was built without one. A
  chat ui with no words is a diagram of a chat ui. So this is not "draw some mockups",
  it is "decide whether the scene layer gets a type vocabulary", and that is a real
  design decision with a real cost: text needs a font, a fit, a safe area of its own and
  a dash check, all of which `lib/captions.mjs` already solved once for captions and
  none of which is reusable as it stands.

- **2. Big type end cards.** The smallest of the three by a distance and the only one
  with no dependency. `lib/captions.mjs` already fits and springs caps type inside a
  box, and the brand already has a 44px hero cap and a wordmark treatment. An end card
  is a caption that does not move and holds for a second and a half.

- **3. The comment magnet loop.** A viewer comments a word, we dm them a useful file.
  **It is blocked on the file.** There is no lead magnet and there never has been, and
  a loop that delivers nothing is worse than no loop: it is a promise made to everybody
  who comments.

  Two things to settle before any of it, and neither is a build task:
  - **What the file actually is.** It has to be worth a stranger's attention and it has
    to be something we can stand behind, which for a shop that sells ai probably means
    a checklist or a short honest guide rather than a template pack. It is also the
    first thing this business would publish that is not a website or a clip.
  - **Whether we want to collect handles at all.** The loop means a dm to a stranger who
    replied to a video. That is not a feature, it is a decision, and it is the first one
    in this file that touches somebody else's inbox rather than ours. CLAUDE.md's rules
    on personal contact details are about the repo; this is about conduct.

**How they rank if they are ever started**, and this is a suggestion rather than a
plan: 2, then 1, then 3. The end card is a day and improves every clip already built.
The mockups are a genuine engine decision. The comment loop cannot start until a file
exists, so it is not third because it is least valuable, it is third because it is not
startable.

#### House rule — the voice is english, and only english. Settled 2026-08-27

**No Russian voice and no Latvian voice, on any clip, ever.** Einz's decision and it is
locked, not a shortlist.

- It is a choice rather than a limitation. The endpoint `lib/voice.mjs` talks to offers
  Russian and Latvian neural voices, and the module could add them in an afternoon. It
  will not.
- **The site stays trilingual and the clips do not.** `index.html` serves EN, RU and LV
  and that is untouched by this. What is settled is the voice on a video.
- The type already pointed the same way, which is worth knowing but is not the reason:
  Michroma is latin only and Space Grotesk ships no Cyrillic, so a Russian caption in
  the `pop` or `count` style would have to fall back to the mono stack and stop looking
  like our clips at all. A Latvian one would set, being latin-ext.
- Practical consequence for `lib/voice.mjs`: the three voices it ships — `calm`, `dry`,
  `uk` — are the whole list, and the list is closed by decision rather than by taste.

#### Free text to speech, researched 2026-08-26

**Superseded 2026-08-27, and the answer was neither of them.** Kept because the
reasoning is still the reasoning, and because a shortlist that was overtaken is worth
being able to see.

Two options were checked as commercial safe, in preference order.

1. **CapCut's built in TTS.** First choice. In the editor already, so no extra step and
   no extra account.
2. **Gemini in AI Studio, TTS.** Second choice.

The line under them read "neither is committed to yet". What shipped is `demo/lib/
voice.mjs`: Edge's read aloud voices over the unauthenticated websocket, free, no
account, no key, in our own pipeline. It won on the one thing neither of the two above
can do — **it hands back a timestamp per word**, so the captions are cut from the
synthesiser's own timings rather than aligned to the audio afterwards. Both of the
shortlisted options would have meant exporting audio from somebody else's editor and
then guessing where the words were.

#### House rule — hashtags, settled 2026-08-26

**Exactly three lowercase hashtags per platform. No more, no fewer.** post2 and post4
both carry it; post1's five on tiktok predate it and stay as the one exception on
record. This closes the open question the file has carried since post1.

#### Sound recipe — both posts

The clip's audio signature. Same recipe on post1 and post2, and it carries to post3,
post4 and post5 unless something in the scene changes. post4 names the music — Vivaldi,
Spring — where the line below only said "classical"; that is a choice inside the
recipe, not a change to it. post5 stays unnamed and adds one subtraction: **no voice
line at all**, so the servo on the eye turns is the loudest thing in the mix. Nothing
else in the recipe moves.

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
- **`demo/post5.mjs`**, added 2026-08-26: the fifth clip, `what is the most
  boring part of your business?`. Ten and a half seconds at 60fps, **vertical
  only**, out to `demo/out/post5-1080x1920.mp4`. `DEMO_FPS=12` previews it,
  `--encode-only` re-encodes. Frames under `out/frames-post5`, state under
  `out/post5-1080x1920.json`, verify stills under `out/verify-post5`. About
  ninety seconds end to end, the fastest of the clips because it is the shortest.
- **`demo/post6.mjs`**, added 2026-08-27: the sixth clip, `3 things ai should not
  do in your business`. Twenty two seconds at 60fps, **vertical only and with the
  voice inside the mp4**, out to `demo/out/post6-1080x1920.mp4`. `DEMO_FPS=12`
  previews it, `--encode-only` re-encodes. Frames under `out/frames-post6`, state
  under `out/post6-1080x1920.json`, verify stills under `out/verify-post6`. About
  two and a half minutes end to end. It is the first clip built on `demo/lib/`:
  the voice is generated first and the captions, the length and the mascot's gaze
  are all cut from its word timestamps. No statement and no bubble — the captions
  are the copy. **Since 2026-08-27 it also carries an animated pictogram scene
  layer in the top third** — five scenes from `demo/lib/pictograms.mjs`, keyed to
  the voice's word timestamps, at `115,175` and `310x186` css px. Nothing else in
  the frame moved to make room. **The block has come down three times, all on
  2026-08-27**: 70 device px from `y 82` to `y 117`, which put it past the caption
  box's top edge and found a real bug in the clearance guard, another 46 to
  `y 140` with the solid ink pass, and 70 more to `y 175`. At the lowest position
  it clears the measured caption ceiling by **112px on the shadow and 139px on the
  ink**, floor 40, and a border by 284 and 253 device px, floors 96 and 72. See
  Decisions. 
- **`demo/post9.mjs`**, added 2026-08-28: the ninth clip, `the pitch reel`.
  **23.89s at 60fps, vertical only, voice and effects inside the mp4**, out to
  `demo/out/post9-1080x1920.mp4`. `--blur` opens the shutter for the final and is
  off for the timing pass, `DEMO_FPS=12` previews it, `--encode-only` re-encodes
  from kept frames. Frames under `out/frames-post9`, subframes under
  `out/subframes-post9`, state under `out/post9-1080x1920.json`, verify stills
  under `out/verify-post9`. **11.4 minutes with the shutter open at four
  subframes, about three without.**
  **It is the first clip that is not one composed frame.** Four render passes
  write contiguous ranges of one frame sequence over one clock and the whole
  thing is encoded once: **A** beats 1..2, composed pictograms; **B** beats 3..5,
  the live `index.html` under a camera; **C** beat 6, the same page loaded fresh;
  **D** beat 7, the end card. 505, 523, 158 and 247 frames, cutting at 8.41s,
  17.13s and 19.77s.
  **It films the real page and does not edit it.** The rig adds a camera, a
  cursor and a caption layer on top of the file as it is in git, exactly as
  `record.mjs` has since it was written, and the two runtime endpoints are
  stubbed so nothing leaves the browser. The camera is **gsap in node on the
  house curves** — a leg is a paused tween over `{cx, cy, z}` seeked per frame and
  built when the leg starts, because where it is going is a live element rect.
  **Every site shot is a gap between two elements, centred on the caption band**,
  measured live and never typed as a page coordinate. Nothing is ever a still
  frame: a seeded drift of under one percent of scale rides on every frame,
  composed passes included. See Decisions.
- **`demo/post10.mjs`**, added 2026-08-28: the tenth clip, `the rage clip`.
  **13.25s at 60fps, vertical only, voice and music inside the mp4**, out to
  `demo/out/post10-1080x1920.mp4`. `--blur` opens the shutter for the final and
  is off for the timing pass, `DEMO_FPS=12` previews it, `--encode-only`
  re-encodes from kept frames. Frames under `out/frames-post10`, subframes under
  `out/subframes-post10`, state under `out/post10-1080x1920.json`, verify stills
  under `out/verify-post10`. **7.3 minutes with the shutter open at four
  subframes, about two without.**
  **It is the first dark clip and the first with no accent in it at all.** One
  composed page at `data-theme=dark`: black, film grain, the mascot centred in a
  white crt glow, the site's own speech bubble above him, and the `float`
  captions inside the pill in `--fg` only. No pictogram scene layer — this file
  does not import `lib/pictograms.mjs`.
  **The voice is four takes, not one, and each one is a continuous sentence.**
  Each group is synthesised on its own at -10%/-4Hz and they are laid on one
  clock with **exactly 0.50s of silence between them**, measured on the waveform
  rather than on the word list. The stabs and the hard glitches live in those
  gaps, and the gap is the stab's own length by design rather than by accident.
  **The seventeen cards are marked rather than inferred**: with one sentence to
  a group there is no sentence end to cut on, so `markCards` puts a comma on
  each card's last word, on the caption's copy only, and `punctuation: 'drop'`
  takes it off again before anything is drawn.
  **The sound is the voice plus four slices of `demo/music/track2.mp3`** and
  nothing else. `demo/music/` is gitignored — see the note below.
- **`demo/music/` is licensed audio and it is never pushed.** Two pixabay mp3s
  live there on this machine; `.gitignore` carries `demo/music/` for the same
  reason it carries `.env`. The licence is ours to hold, not ours to
  redistribute out of a public repo. `post10.mjs` reads both files, measures
  both on every run, and **fails the render** if the one it names as the main
  track is not the harder hitting of the two — so a swapped pair of files stops
  the clip rather than quietly changing it. If the folder is missing the run
  says so by name.
- **`demo/lib/pictograms.mjs`**, added 2026-08-27:- **`demo/lib/pictograms.mjs`**, added 2026-08-27: solid ink svg pictogram scenes
  drawn in code and animated per frame, built the same way `lib/captions.mjs` is
  so one clip drives both from one loop. **Rebuilt the same day from outline
  clipart into solid ink**: filled silhouettes, `--bg` cutouts instead of second
  outlines, two stroke weights and never a third, one soft drop shadow per shape
  driven by a `lift` channel that is 1 in the air and 0 landed, and a damped
  oscillator under every pop instead of a bezier. A scene has an entrance, a hold and an exit;
  inside it are parts, and a part is one shape plus a list of steps — `pop`,
  `draw`, `move`, `flip`, `fade`. Steps are a list because real objects do more
  than one thing: a padlock's shackle is drawn and *then* seats. `planScenes` is
  plain data and validates, `sceneFrame(plan, t)` is the whole animation as a pure
  function of time, `pictogramPage` is serialised into the page and only writes
  numbers. No css transition anywhere in it, for the reason `post2.mjs` found.
  **`sceneMotion(plan, fps, seconds)` walks every frame before a render** and
  reports the biggest one frame step in every channel, the shadow's `lift`
  included, so a snap costs a second instead of two and a half minutes of jpegs.
  See Decisions.
  **Its motion core was rebuilt on gsap on 2026-08-28** and that is the only
  dependency `demo/` has gained since it was created. The hand rolled damped
  oscillator, the bezier solver and the dashoffset writing are gone; what
  replaced them is one `buildTimeline` run twice, five house curves named in
  `houseEases`, DrawSVGPlugin, volume preserving squash and stretch, per part
  stagger, and a clock check that fails a render if gsap's time is not the frame
  index over the frame rate. **Every scene table in `post6.mjs` and `post7.mjs`
  drives it unedited.** `node lib/pictograms.mjs test` runs the engine's checks
  without a browser. See Decisions.
- **`demo/scenes-test.mjs`**, added 2026-08-27: `post6.mjs`'s own five scenes back
  to back with the dead air cut to a third, into `demo/out/scenes-test.mp4`.
  **10.18s, 60fps, 1080x1920, silent**, in production's exact frame with one line
  of system mono under the block naming the scene and the seconds it holds in the
  real clip. It exists so the scene layer can be judged in ten seconds instead of
  by scrubbing a twenty two second clip with a voice on it. It **imports**
  `SCENES` and `SCENE_BOX` from `post6.mjs` rather than copying them, which is why
  post6's run block now sits behind a `main()` guard — importing it must not
  render a clip. The compression is on the gaps only and never on a step's own
  duration. `cd demo && node scenes-test.mjs`, about a minute and a half. Since
  2026-08-27 it also carries the scene layer's own sound effects, at -20 LUFS.
  **Two flags since 2026-08-28**, both for judging motion rather than the cut:
  `--scene=<id>` renders one of post6's scenes on its own at post6's own timing
  rather than the strip's compressed gaps, and `--blur` (or `--blur=N`) turns on
  true subframe motion blur. Output is named after what was asked for, so a solo
  or blurred render never overwrites the strip, and every run drops a
  `*-cost.json` next to it with the capture and blend seconds in it.
  See Decisions.
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
- **Tracked:** `demo/record.mjs`, `demo/post2.mjs`, `demo/post4.mjs`, `demo/post5.mjs`,
  `demo/post6.mjs`, `demo/og.mjs`, `demo/analyze.mjs`, `demo/captions-test.mjs`,
  `demo/post7.mjs`, `demo/post9.mjs`, `demo/post10.mjs`, `demo/scenes-test.mjs`,
  `demo/lib/captions.mjs`, `demo/lib/voice.mjs`, `demo/lib/pictograms.mjs`,
  `demo/lib/sfx.mjs`, `demo/README.md`, `demo/package.json`.
  **`demo/README.md` carries post10** — a section of its own, an index line, and
  a paragraph under Why demo/ is safe about `demo/music/` being licensed audio
  that is never pushed. **Its own tracked list in that section is stale** and has
  been since post7: it names twelve of the eighteen tracked files. It is now
  labelled as stale and points here, because this list is the one that is kept
  current; rewriting it was not this session's work.
  **Ignored:** `demo/frames/`, `demo/out/`, `demo/music/`,
  `demo/package-lock.json`, `node_modules/`.
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

### The content pipeline — `demo/lib/`, `demo/analyze.mjs`

Added 2026-08-27. Three capabilities that are not a clip. **Nothing here is imported by
`record.mjs`, `post2.mjs`, `post4.mjs`, `post5.mjs` or `og.mjs`, and nothing has been
wired into a post.** `package.json` carried `puppeteer-core` and `ffmpeg-static` and
nothing else when this was written; **`gsap` was added on 2026-08-28** for the pictogram
motion engine and is the only dependency any of this has gained since. Full detail in
`demo/README.md` under The library.

- **`demo/lib/captions.mjs` — animated captions, word by word.** Takes
  `[{word, start, end}]` and draws it in one of three styles: **`pop`** (michroma caps,
  one short card at a time, each word springing in, the word being said in the accent —
  the hormozi cut in our type), **`type`** (space grotesk, lines arriving from below and
  dimming as they are overtaken, the live word at weight 500, and no accent anywhere),
  and **`count`** (a rolling number on a fixed cell grid with a label under it).
  Split in two on purpose: `planCaptions()` runs in node and measures nothing, so a plan
  is printable data; `captionFrame(plan, t)` is the whole animation as a pure function
  of time; `captionPage` is serialised into the scene and only ever writes what it is
  handed. **No css transition or animation on anything that has to hit a mark** — the
  same rule post2 learned, because one captured frame carries five or six BeginFrames.
  Colours come from `index.html` at run time, **both** the `:root` block and the
  `html[data-theme=dark]` block, and it throws if a token it paints with has gone.
- **`lib/captions.mjs` grew a fourth style on 2026-08-28, and the first three did
  not change.** **`float`**: Space Grotesk at **700**, lowercase, one short card at
  a time, no card behind it and no fill of any kind, built for footage rather
  than for a composed frame. The ink is `--fg` and only `--fg`, which is what
  makes the paper version free — over the dark theme the same token *is* the
  paper tone, so a clip that films a dark page gets light captions with no
  second code path. Two options came with it: **`flash`**, a predicate over one
  word that lets the accent land only on the frames that word is being said, and
  **`cardBreak`**, the regexp a card may end on. The second is not cosmetic — with
  sentence breaks only, "if ai can do it, we build it" cut a card reading
  `do it we`, three words that were never a phrase. **`pop` is still the default
  and post6 and post7 re-plan identically**, which was checked rather than
  assumed. See Decisions.
- **`lib/sfx.mjs` has nine sounds since 2026-08-28, not eight.** `servo` is a small
  geared motor: a pitch that slides up while it accelerates, amplitude modulated
  at the tooth rate so it buzzes rather than tones, and a body of band passed
  noise underneath. 90ms, which is five frames at 60fps, because a snap zoom is
  over in eight and a sound that outlasts its own move is a sound the viewer
  starts listening to. It sits at -26dB, with the click rather than with the
  coin: it is a mechanism acknowledging an instruction, not an object landing.
- **`demo/lib/voice.mjs` — free voice, no key, no account, no dependency.** Edge's read
  aloud neural voices over the unauthenticated websocket the python `edge-tts` package
  uses, with the handshake and the frame masking written out against a tls socket
  because node's global `WebSocket` cannot set the headers the endpoint wants. Three
  voices: `calm` = `en-US-AndrewNeural` (the default), `dry` = `en-US-EricNeural`,
  `uk` = `en-GB-RyanNeural`, all at a negative rate. `node lib/voice.mjs test` speaks a
  line in all three and reports the durations. Audio and a json sidecar land in
  `demo/out/voice/`, already gitignored.
- **`demo/analyze.mjs` — the reference analyzer.** `node analyze.mjs ref.mp4` writes
  `demo/out/analysis/<name>.md`: the file, the scene cuts as shot lengths with bars, the
  hook, the voice, **the same transcript put through our own caption engine** so the
  reference's cadence and ours read in the same units, stills at every cut, and a
  "what to build to" card. `--words=<sidecar.json>` skips transcription when the line is
  one we wrote. `--install-whisper` builds the transcriber.
- **`demo/captions-test.mjs` — the three styles as five second clips**, with the voice
  muxed in, plus a still of each style in both themes into `demo/out/verify-captions/`.
  About a minute for all three; the voice is cached so a second run does not go near the
  endpoint.

**What works, measured on this machine.**

- The voice is real and so are its timestamps. Three voices, `timing: "engine"` on every
  run, and **2.3 words a second** on the default voice — which is the number the caption
  cards are cut against and the number the analyzer compares a reference to. Chunking
  over sentence ends was checked on a 96 second script: 220 words, offsets monotonic
  across the chunk boundary, and the last word inside the file. `wav` works and is a
  transcode of the finished mp3, because riff chunks carry their own headers and do not
  concatenate.
- All three caption styles render at 1080x1920/60fps with every guard passing: the safe
  area sampled four times a second **against the drawn ink**, one group on screen at a
  time except in `type` where stacking is the style, the accent painted in `pop` and
  `count` and never in `type`, and something actually moving between two frames.
- The analyzer's file, cut, still and report passes all work, and the scene detection was
  checked against a video with real hard cuts: both scored 1.00 and both landed on the
  frame. The `--words` path was run end to end.

**What needed a fallback, and it is in the report every time.**

- **Whisper is installed and could not fetch a model here.** `faster-whisper 1.2.1` is in
  a virtualenv at `demo/out/whisper-venv`, it imports, and the analyzer's script reaches
  the point of constructing the model — then the weights download from huggingface is
  refused by this machine's network. **So the transcript pass is verified up to the model
  fetch and no further.** On a machine that can reach huggingface it should complete;
  that is untested and should not be reported as tested. The fallback is real: ffmpeg's
  `silencedetect` splits the audio into speech and pause, which gives phrase lengths,
  breath lengths and when the talking starts, and the report says which of the two it
  used at the top.
- **Tesseract is not on this machine**, so the on screen pass is not ocr and says so. It
  reads the edge density of the top, middle and bottom third of each still, which is
  enough to tell a talking head from a full screen caption. It correctly put the detail
  in the bottom third of a clip whose captions are in the bottom third.

**Changed 2026-08-27 while building post6, and all of it improves every style.** Two
bugs: a card could be clamped away before its own last word was said (dense speech plus a
120ms entrance lead), and a card shorter than its own entrance appeared at two thirds
scale and left without arriving. Both fixed, and `plan.tight.late` is now a list that has
to stay empty with a render that fails on it. Two new options on `pop`: `emphasise`
marks a card as a beat and fits it on its own in the accent, off unless asked for; and
`fill`, which chooses between springing the whole card in and revealing it word by word.
`fill: 'card'` fixes a real flaw in the original behaviour at two words to a card, where
the first word sits visibly off centre for half the card's life. It went in as an opt in
so the judged style clips would keep describing what they rendered, both were watched,
and **`card` is the default as of the same day** — Einz's call. The style clips and post6
were re-rendered against it, post6's override was removed rather than left behind, and an
unrecognised `fill` throws rather than quietly falling back. `fill: 'word'` is still
there for anything that wants the reveal. Plus two tidyings: the
word gap is one number in the plan rather than typed in the css and again in the fit (and
it went from 0.30em to 0.42em, because michroma's side bearings made 0.30 read as no gap
at all), and `maxLines` on the calm style is a real option now instead of one nothing
read. **The three style test clips were re-rendered** against the changed engine.

**Factory v1 as of 2026-08-27, complete and pushed in `b30bee8`.** The pipeline and the
first clip built on it are both on `main`. What a new clip now costs, measured: the
voice and its word timestamps in under a second for a line, the caption cut for free
because it is a pure function of those timestamps, the length following the voice rather
than being typed, and about two and a half minutes of render for twenty two seconds at
60fps with every guard. **What is still by hand: the mascot's performance and the
layout.** post6's thirteen gaze keys were placed against the beats in that script, and a
new script has its beats somewhere else. post6's layout numbers are a template for the
next clip rather than something derived automatically. So a script is a rough clip in
minutes and a finished one in a session, and the session goes on the performance instead
of on the plumbing.

**Everything these produce lives under `demo/out/`, which is gitignored whole** — the
audio in `out/voice/`, reports and stills in `out/analysis/`, test clips and both theme
stills in `out/verify-captions/`, and the transcriber's virtualenv and model cache in
`out/whisper-venv/` and `out/whisper-models/`. Those last two are about half a gigabyte
and are there so deleting one folder undoes them.

**No secret is in any of it.** The trusted client token in `lib/voice.mjs` is
Microsoft's, compiled into Edge and printed in every article about that api; it is not a
credential and not ours. The only hosts named are Microsoft's speech endpoint and
huggingface, neither of them ours, and neither module has a key or an account.

### Skills — `skills/`

- **Two skills, and one of them ships code.** `skills/SKILL.md` is the index and
  each skill is `skills/<name>/SKILL.md`.
- **`page-builder`** — the design system and the build rules for pages. The source
  of truth for colours, type and layout. Instructions only.
- **`video-review`**, added 2026-08-28 — watches a finished clip and writes down
  what is on the screen second by second, then judges it against the house
  checklist. **It is the eyes, and it exists because the guards are not.**
  `demo/`'s checks measure geometry and sound and they passed post9's first cut,
  which a phone then showed had captions inside tiktok's chrome, a green card
  the brief bans, and a wordmark decoding into `SHE / 7/RING / MEK`.
  - **Invoke it in two steps.** First
    `node skills/video-review/frames.mjs demo/out/<clip>.mp4`, which writes one
    jpeg per sample into `demo/out/frames-review-<name>/` with the second it came
    from in its own filename, plus `index.json` and `index.txt`. Then read the
    frames **in batches of eight to ten, in order**, and write the review to
    `demo/out/review-<name>.md`. The reading and the judging happen in the
    conversation; the script is the extraction half only.
  - Flags: `--every=0.5` for density, `--from` and `--to` for one stretch,
    `--width`, `--max`, and **`--guides`**, which draws the platform safe area on
    every frame as a magenta rectangle for the margin pass.
  - **The checklist is seven items** and an item that does not apply is marked
    n/a rather than left out: platform safe margins, caption readability and
    placement, no green where the float style bans it, camera moves landing on
    their beats, nothing colliding with the site's own text, the wordmark, and
    pacing. Every claim in a review carries the second that proves it.
  - **Local files only.** No urls, no yt-dlp, no downloads, and **no
    transcription**: our clips are made here and the script is written down in
    the post file before the voice is synthesised, so the words are already
    known. It adds no dependency — frame extraction uses `demo/node_modules`'
    `ffmpeg-static`, which the render pipeline already carries, and that binary
    ships no ffprobe so the metadata is parsed off ffmpeg's own stderr exactly
    as `post9.mjs` parses it.
  - **Adapted from `fabriqaai/ffmpeg-analyse-video-skill`**, which is two markdown
    files and no code. What was taken is the shape — sample, batch, read,
    synthesise — and the sampling ladder, with the short end made denser because
    our clips are twenty odd seconds and a frame every two would miss whole
    shots. What was dropped is everything that reaches the network. Its trick of
    handing batches to disposable sub agents to keep images out of the main
    context is written down as an option, **off by default**, because nothing
    here spawns agents unless asked.
  - **Frames and reviews land under `demo/out/`, which is gitignored whole.**
    Nothing it produces is committed unless somebody asks for it to be.

## Decisions

### 2026-08-28 — post10's fix pass: a reading instead of a list, and a guard the eye could not be

**Three changes, and the clip went from 16.87s to 13.25s.** Einz's, after
watching the first cut: the voice read word by word, the stabs were short, the
outro was short. Nothing else moved — the look, the glitches, the margins, the
mix targets, the voice trim, the crf and the seventeen cards on screen are all
the ones written up below.

**1. The staccato script was the fault and it was our own.** Every line had been
written as its own sentence, because a full stop is most of half a second of air
and that is where the delivery's punch came from. It worked and it was wrong: a
synthesiser told to stop after every word reads word by word, which is the one
thing a machine voice already sounds like. The copy is punctuated the way a
person would say it now — four sentences, one take each, Andrew at **-10% and
-4Hz**, which is two numbers rather than a fourth voice and leaves the list
closed at three. **2.97 to 5.68 words a second against a flat 2.3.**

**What that cost is the free card cut, and paying for it did not touch the
engine.** A card breaks at a sentence end, so with one sentence to a group there
was nothing to break on and `perCard` cut `fuck you i`, `am gonna become`,
`you said a` — post9's `do it we` again. The cut is **marked rather than
inferred**: `markCards` walks the card list against the word list and puts a
comma on each card's last word, **on the caption's copy only, after the
synthesiser has already spoken**, `cardBreak` breaks on it and
`punctuation: 'drop'` takes it off again before a card is drawn. Nothing about
the audio or the timing can move, and it is exactly what that option is for —
the mark carries the structure and never reaches the screen. It is worth being
honest about which half is which: the marks decide where a card ends, so "the
cards came out as the list" is a weaker check than it was, and what the marks
cannot fake — that the voice said these words in this order — is checked twice,
once as the marks go on and once against the drawn sequence.

**2. The stab and the hole it lives in are one number.** The music only ever
plays where the voice is not, and that is guarded to the sample, so a 0.5s stab
in a 0.4s gap would play under the next word and fail the render while a 0.4s
stab in a 0.5s gap would leave silence in the middle of a glitch. **The gap went
to 0.50 with the stab**, and a guard now says so out loud rather than leaving it
as a coincidence two constants happened to share.

**3. Extending the outro was the obvious answer and the wrong one.** The one
second slice was 49.06; over 2.00s that same region rises **+0.5 dB and ends at
-9.6**, which is a slice that runs out rather than one that arrives. Every 2.00s
window in the track was scored on how much it rises across itself and how loud
its last quarter second is, and **16.60 + 2.00 wins**: +2.5 dB, and — the thing
that settles it — it **ends on its own loudest sustained passage**, -5.0 dBFS
over the last 120ms, so the hard cut reads as a cut rather than as a fade. 60.90
is the same bar of the loop and scores within a tenth; 48.12 rises too and ends
in a decay at -11.5, which is the failure the test was written to catch.

**A two second outro cannot just be held, and the preview's review said so.**
With one beat in it the wordmark sat unchanged for 1.05s and then 0.77s, and
four of the six frames sampled across the end card were the same picture. It has
three beats now and all three are read off the slice rather than typed against
it: the brand **arrives on a hit at +0.57**, is hit again at **+1.45**, and once
more at **+1.91**, which is 0.09s before the music stops — so the last thing the
clip does is get hit and then go quiet. Re-slice and all three move.

**The liveness guard then caught something no review could, and it was 60fps
only.** The first final of the fix pass came back with **one identical frame
pair at 11.8333s**. Not a false positive: on the end card the mascot, the
caption and the bubble are gone and the grain and the scanline are stepped, so
the phosphor was the only thing still moving — and **a sine stands still twice a
period**, so the two frames either side of its turning point wrote exactly the
same values. At 12fps no frame pair lands symmetrically about the peak, so the
preview was green and the final was not, **exactly as post9's frame zero leg
was**. Two faults now that a preview cannot show, which is worth knowing before
the next one. It is fixed at the cause rather than at the threshold: the
phosphor is two sines on incommensurate periods, so they never turn together.
Measured over the end card's own frames — one sine, one identical pair and a
smallest change of exactly zero; two sines, none, and 3.7e-4. It is a better
phosphor as well, because a real one does not flicker on one frequency.

**What the fix pass ships on.** 13.25s, 795 frames, 4.33 MB, **2.61 Mbit/s**,
7.3 minutes with the shutter open. Stabs at **3.64s, 6.18s and 8.71s**, outro at
**10.10s**, wordmark in at **10.67s** and held to 12.95s, black to 13.25s. Safe
margins **192 / 941 / 164 / 929** against 140 / 180 / 140 / 220. **17.7% of
frames carry a glitch**, up from 9.8%, because the clip lost 3.6 seconds while
the glitch windows got longer — and it still costs less per second than its own
preview did, because at 60fps the stepped grain and scanline are carried across
five frames instead of one.

### 2026-08-28 — post10, the rage clip: a dark frame, no accent, and four slices of one track

**The numbers in this entry are the first cut's, 16.87s, and the fix pass above
supersedes the three it changed.** Everything else in it still describes the
clip, which is why it is kept rather than rewritten.

The tenth clip, and the first that is not the light theme. One composed page,
one render pass, no site footage and no pictogram layer: black, grain, the
mascot in a white crt glow, and the site's own speech bubble over him with one
short card in it at a time.

**Four things it settled.**

1. **`float` is the style for a caption inside a container, and it is what a
   clip with no accent uses.** `pop` paints the word being said in `--accent`,
   and on cards this short that is a green word on almost every frame. `float`'s
   ink is `--fg` and only `--fg` and its accent budget is zero unless a clip
   names a word in `flash`. No word is named, and a guard fails the render if
   the accent colour is painted on a single frame. **On the dark theme the same
   token is the paper tone, so white captions on black cost no second code
   path** — which is the property the style was built for and this is the first
   clip to spend it.
2. **`fill: 'word'` wants a short `lead`, and the engine's default fights it.**
   Under the `card` fill the card springs in and `lead` (0.12s) is how long its
   entrance gets before the first word is said. Under `word` the card does not
   spring at all and each **word** arrives 0.05s before it is spoken, so the
   only thing `lead` decides is how long the previous card has been gone before
   the next word is drawn: seventy milliseconds of empty bubble, seventeen times
   over. `lead: 0.05` makes the handoff exact. **This is a clip level option, not
   an engine change** — post6, post7 and post9 all use `card` and are untouched.
3. **A glitch is quantised to the output frame grid; everything else rides the
   shutter.** With four subframes to a frame, anything that is a function of `t`
   is averaged across a quarter of a sixtieth of a second — which is what a
   spring or a falling coin wants and is exactly wrong for a fault. A one frame
   rgb split written against `t` would land at a quarter strength and a violent
   shake would come out as a blur rather than as a jump. So the glitch state is
   computed once per **output** frame and held across all four captures of it.
   It is structural rather than asserted: there is no path by which a subframe
   can compute its own. The caption's springs, the mascot's eyes, the head bob
   and the phosphor pulse are all still continuous and all still smear.
4. **crf is a property of the frame, not a house setting.** Every clip before
   this one is crf 17 and every one of them is ink on a white page: large flat
   areas, a few hundred lit pixels, and 17 costs nothing. This frame is film
   grain over black across the whole of it, which is the most expensive thing
   this pipeline has encoded. Measured on the same 200 preview frames: **crf 17
   = 7.68 Mbit/s, 20 = 3.57, 22 = 2.02, 24 = 1.20.** 22 was looked at rather
   than assumed — the grain, the glow, the bubble outline and the star all
   survive it — and **2.02 Mbit/s is what post9 delivers at 17**, so the clip
   ships at the same bitrate as the one before it and the crf differs because
   the picture does.

**post7 says no grain and this clip has grain, and both are right.** post7's
note is that every platform recompresses a clip and grain through that is noise
rather than texture — which is true, and on a white frame it also costs bitrate
for nothing. This frame is near black, where a very low opacity actually reads.
It is held at 0.07, stepped at 8Hz rather than written per frame, and the
scanline roll is stepped with it: **a one pixel line pattern sliding
continuously across a 1080x1920 frame is the single most expensive thing a codec
can be handed**, and the first preview spent most of its 7.7 Mbit/s on it.

**Three things a measurement decided and no plan would have.**

- **The ducker is off, and it is off because of a number.** post6 pulls the
  effects bus 8dB down while a word is being said, and 0.60 is right for a bus
  that plays *under* speech. This one never does: a stab opens on the frame a
  group's last word has stopped. `voiceEnvelope` has a 220ms release — the same
  release post6 already found could not be trusted as a check, because it stays
  open through the gap after every word — so it is **0.987 open at the
  instant the first stab lands**, which is **7.8 dB off the attack of every
  stab in the film**: the one part of a stab that is the stab. The run prints
  the counterfactual next to the zero it uses.
- **The gap has to be measured on the waveform, and the guard that missed it
  took its window from the same wrong place.** The synthesiser's WordBoundary
  carries a duration shorter than the sound: `thing.` came back ending at 4.728
  and the recording is still at speech level for **0.12s** after that. Stabs
  placed on the reported end therefore opened on top of a word still being said
  — and "no music inside a word's window" passed, because the window was the
  word list's. A group now ends where its own recording falls 46 dB under its
  own peak. The word list still drives the captions, the head bob and the micro
  glitches, because for those a word boundary is exactly the right thing; it is
  only the silence that has to come off the waveform.
- **"The biggest transient rise in the file" is not a measurement until it says
  what it rises from.** The check that picks the main track scored `track1.mp3`
  at **+144.6 dB**, because that file opens on true digital silence: `pre` was
  zero, dbfs of nothing is -180, and the first note in the piece came back as an
  infinite rise off it. It would have failed the render on the wrong track. A
  hit is a rise **from something audible to something worth calling a hit**, and
  with both floors in place the same two files score +21.9 and +10.8, which is a
  track with transients against a wash.

**Which slices, and why those.** Both tracks are decoded and measured on every
run and the choice is the measurement's. `track2.mp3` is 88.66s, -12.5 LUFS,
28.0% of the file within 12dB of peak, with transient rises of 12 to 17 dB every
1.85s; `track1.mp3` is 96.08s, -12.4 LUFS, 8.2% within 12dB of peak, and it
never hits. **So track2 is the main and track1 is used for neither role.** The
three stabs are at **4.16s, 26.30s and 20.76s** — the sources the fix pass kept
— each 0.40s at this cut and 0.50 after it, each with 40 to
60ms of near silence in front of it so the attack is whole, and they are played
in that order because their first 80ms measure **-8.2, -7.7 and -6.3 dBFS**:
**the escalation is the source's and not three gains.** The outro is **49.06s +
1.00s**, the one second window whose last fifth is loudest and which rises most
across itself — **a bar level rise rather than a crescendo, because there is no
riser anywhere in either file** and saying so is better than claiming a build
that is not there. One gain moves all four.

**What `skills/video-review` found, twice.** The preview's review found the
seventy millisecond bubble hole above, and a mascot whose eyes were in the same
place in all thirty four sampled frames — ±0.55 units is about a css pixel and a
half on a 176px head, which is real, inside every guard, and invisible. It is
1.1 now. **The final's review found a third thing the preview could not have
shown**: the exit was hung off the voice alone, so the mascot and the bubble were
torn away while `and love it` was still on screen, leaving two tenths of a second
of white words floating on black with no bubble round them. The exit is now the
**later** of "the voice has stopped" and "the last card has left", and a guard
fails the render if the caption would outlive its own container.

### 2026-08-28 — post9, the pitch reel: four passes, one clock, and what the render decided

The ninth clip, and the first that puts the live site on screen. `index.html` did
not change and was not read from anywhere but disk: the rig adds a camera, a
cursor and a caption layer in the browser on top of the file as it is in git.

**A composed page and the live site cannot be one browser page, so the film is
four passes into one frame sequence.** Each pass renders a contiguous range of
`f%06d.jpg` over the same global clock and the whole thing is encoded once. The
seams are hard cuts and each one lands on the first word of a beat, at 8.41s,
17.27s and 19.77s. **Motion blur is blended per pass**, deliberately: a rolling
mean that reached across a cut would average the end of one shot into the start
of the next, which is a dissolve, and a dissolve is not a cut.

**Beat six is a second load of the same page, and that is the page's behaviour
rather than a shortcut.** `openForm()` puts `.gone` on `.cta-zone` and the only
route back to the button is submitting and pressing start again. Beat four opens
the form; beat six needs the button. The alternative was filming a send button
instead of the glitch cta, and a cut is the cheaper lie.

**Beat four is 1.93 seconds and the interaction fits inside it because of how
the page routes, not because it was rushed.** The cta is pressed on the word
`that` in beat three, so the card is open and settled before the snap zoom lands
— timing it to the pause after the sentence would have framed a card that was
still unfolding. Then one press on the fourth path option, `i just have a
question`: a single pick chip marks itself pressed, waits 240ms and advances
itself, and that answer routes to a two step path whose second step is a
textarea. One press shows the ui answering and puts a field on screen.

**Four things the render decided and no plan would have.**

1. **The subline clip guard fired, on its first outing.** The page's widest line
   is the subline, and a zoom that puts it in frame and cuts its first and last
   letter reads as a bug. `record.mjs` answered that with a flat cap of 1.09;
   this file answers it by measuring, and the measurement failed the render:
   pass C framed the button at a base 1.09, the drift took it to **1.103**, and
   fourteen frames came back clipped. The base zoom now leaves the drift its
   room. **The ceiling the rule is about is still 1.09.**
2. **The rig's wordmark came off the two site passes.** `index.html` has its own
   wordmark in the footer with a row of social icons under it, and a second one
   at 89% of the frame lands on top of both — and on the info cards' copy during
   beat five. The brand is not missing while it is off: beats three and six are
   filmed on the hero, whose h1 *is* the wordmark at full size, and the composed
   passes carry the small one where it has always been.
3. **The contrast probe had a bug and it is the useful kind.** It hid the
   caption with `visibility: hidden` on the container — and `apply()` writes
   `visibility` onto every card on every frame, so a card that was up set itself
   back to visible and the container hiding itself did nothing. The probe was
   photographing its own ink and reporting the darkest pixel behind the caption
   as the caption, which came back as a flat **1.00:1 on a blank white page**.
   Opacity multiplies down the tree and a descendant cannot override it;
   visibility is inherited and can be.
4. **`.card` is a full bleed section, so fitting it framed the whole page.** The
   first render of beat four was the hero, the form and the info cards all at
   once, at zoom 1.05. `.cardin` is the rounded box a visitor actually sees.

**A guard was wrong once and it is worth writing down which way.** The scene
layer's tick check read `ticks === frames`, which is only right with the shutter
shut. The 60fps final came back with **2017 ticks for 505 frames** and failed a
picture that was correct: the count is read on each frame's *first* subframe, so
504 x 4 + 1 is exactly the invariant holding. The guard now states the arithmetic
and still fails on a layer that missed a capture.

**Weight 700 is a demo render page exception and it is narrow.** `index.html`
asks for Michroma and Space Grotesk at 400 and 500 in one request and **that
budget has not moved.** The render pages ask for 700 as well, because what leaves
a render page is pixels rather than a font request, so the weight the float
captions are set in costs a visitor nothing and costs the site's one request
nothing. **It applies to `demo/` render pages only.** Nothing in `demo/` is loaded
by, linked from or referenced by `index.html`, which is still one file with one
external request.

**The stagger is used for the first time.** It has been in the engine since the
gsap rebuild, opt in, unit tested and applied to no shipped scene, because
turning it on for post6 would have been a scene edit. post9's four system nodes
are folders and each lags its own tab by three frames. A folder's tab is the
first element of its shape, so the tab leads rather than trails; at 50ms that
reads as the folder arriving with a flick rather than as two objects.

**What the finished file measures.** 23.89s, 60fps, 1080x1920, 1433 frames,
7.13 MB, rendered in 10.6 minutes with four subframes to a frame. **Those two
figures are the fix pass's own render and the shipping ones are 5.97 MB in 11.4
minutes** — see Status, where the corrected re-render's numbers are recorded.
Passes of 505,
531, 150 and 247 frames. Safe margins, device px against a floor of 96: worst
**184** anywhere, on a caption word at 9.42s. The caption box is **404 of 540
css px, 74.8%**, against the brief's 75% content cap — the first render measured
82.2% because it had been sized to the safe area rather than to the cap, and the
guard caught it. The wordmark sits at **89.0%**, inside the 88 to 90 band. The
pictogram zone is 57.4% and never gets closer than **166px** to the caption
ceiling on the shadow or **188px** on the ink, floor 40, and **286px** to a
border on the ink and 256 on the shadow, floors 96 and 72. gsap's clock error
was **3.3e-8s**, and node and the page agreed on every frame. Zoom stayed inside
1.007 to 1.085 with no clip faults. The mascot's biggest one frame gaze move was
0.097 against a limit of 1.20.

**Captions over footage, measured rather than claimed.** Every card clears
**3.0:1 on the mean** and the worst mean is 17.37:1, because the site is a white
page. **Six of the 24 cards have some of the page's own ink directly behind
them**, worst 1.35:1 at 13.20s on `does` and 1.52:1 at 12.85s on
`what your business`, both over the form. That is the caption zone meeting the
footage and it is reported per card with its second rather than smoothed away.
It is not a failure and it was not designed out: a bold glyph crossing a form
label is what a captioned screen recording looks like, and the alternative is a
fill behind the caption, which is the thing this style exists not to have. **If
it ever needs solving, solve it in the framing, not with a scrim.**

### 2026-08-28 — post9's fix pass, and the backlog it did not clear

**The first cut passed every guard it had.** Then it was watched on a phone and
it was wrong in five ways, four of which changed a rule rather than a number.
That is the lesson worth keeping: **the guards measure, they do not see.** It is
why `skills/video-review` now exists.

1. **The safe area was the frame's, not a platform's.** 96 device px is what a
   phone needs; tiktok stacks a button column down the right and a caption across
   the bottom, instagram takes chrome top and bottom, youtube shorts eats the
   bottom for the title and the subscribe row. **The floors are per edge now —
   180 top, 220 bottom, 140 left and right** — and the single `SAFE` is gone
   rather than kept alongside, because two floors is one floor nobody reads.
   **The wordmark moved to 86.0% of the frame and the 88 to 90% band is
   retired**: that band sits inside the platform's bottom strip. A format rule we
   wrote lost to a platform rule we did not.
2. **The captions had no fixed home and landed on the site's own text.** They
   have one now and it does not move for any beat in any pass. What moves is the
   camera: **every site shot is a gap between two elements, centred on the
   caption band at a given zoom**, measured live. The page has exactly two bands
   with no writing in them and both were measured off the real document —
   `.cta-zone` ends 576 and `.cards` begins 634 with the form shut, `.pad` ends 807
   and `.cards` begins 865 with it open.
3. **There was green that was not a money word.** The pictogram scene lit its
   core with a solid accent square for two and a half seconds, which is a green
   card by another name. It is a check cut into the ink now, and a guard fails
   the render if any part of any scene is inked `accent`.
4. **The moves were shy, and only one half of that could be fixed.** Snaps are
   **eight frames** on `btk.pop` and are **pre rolled so they land on their beat's
   first word** rather than leaving on it. The zooms could not go deeper.
   `index.html` is laid out edge to edge at 540 css px, so a frame at zoom z is
   540/z wide and past **1.15 the h1 crops, 1.09 the subline, 1.06 the info
   cards**. The fix pass tried the hero at 1.33 to 1.50 and **rendered THE BORING
   TEK as SHE / 7/RING / MEK**, which is a worse defect than the shy zoom it was
   fixing. Every site shot now lives between **1.06 and 1.14** and the depth comes
   from travel: about 700 page px across the film, with the two snaps covering
   230 and 400 of it in eight frames each. Which is what `record.mjs` concluded
   the first time anyone pointed a camera at this page.
5. **The typing was a machine.** Every gap is its own number between 40 and
   140ms, one is a 200ms hesitation, and one letter is got wrong, deleted and
   typed again through the page's own `input` listener. Measured on the final:
   **41 to 134ms, mean 94ms**. The caret is driven too, because Chrome blinks its
   own on a clock virtual time does not reach.

**Three things the fix pass found on its own**, all of the kind nothing would
have caught by reading the file:

- **A card that is still springing measures wrong.** `.card` grows a grid row from
  0fr over .44s and `.cardin` springs over .52s, and while that runs `.pad` is a
  full height box clipped inside a short one, so it measures as ending below
  `.below` and the gap comes back **negative, -111.8px**. Every press is now timed
  against the page's own transition length rather than against a guess.
- **Pass B was loading the page fresh at the cut**, so index.html's own wordmark
  decode scrambled the brand name on camera for two seconds. The page gets four
  seconds of its own clock before frame zero now. The decode still happens; it
  happens off camera, which is where a page load belongs in a film.
- **A leg could start a hair after its own pass did.** A pass begins on the frame
  nearest its start, which can round to just before the leg that opens it, so
  frame zero of pass C found no active leg, sat on the shot it was cutting from,
  and was counted as a held frame with site text behind the caption. **It only
  appeared at 60fps** — at 12 the rounding went the other way, so the preview was
  green and the final was not. Legs now activate within half a frame of their own
  start.

**The backlog, and post9 is parked with it open.** `skills/video-review` was run
on the finished file and found three things. **None is fixed and none should be
started until Einz says so.** The full review is at `demo/out/review-post9.md`,
which is gitignored, so the findings are written out here as well.

1. **The end card is 4.12s and reads as a still frame.** 21.00s and 22.50s are
   the same picture to the eye. The mascot is blinking and drifting underneath,
   but at that scale nothing is happening, and it is the longest hold in the film
   and the last thing before the loop. **Cut it to about 3s, or give it one small
   arrival.**
2. **The first 0.26s is a dead frame.** The core pops at 0.26 and the caption is
   still arriving at 0.00, so the film opens on blank white with a wordmark — the
   frame doing the least work in the clip, and the one that has to stop a scroll.
   **It needs a hook frame.**
3. **The top bar crops at zoom 1.14 and reads as a fault.** At 9.00s and 10.50s
   the `EN` of the language row loses its first letter at the left edge. It is
   the site's own chrome and the same crop the run already reports on the
   subline, but `EN` is two letters, so losing one of them reads as a rendering
   fault rather than as a crop.

### 2026-08-28 — the pictogram motion engine is gsap### 2026-08-28 — motion blur is a shutter, not a filter

`demo/scenes-test.mjs` grew two flags, `--scene=<id>` and `--blur[=N]`.

**Blur is a capture change.** Every output frame is captured N times at N evenly
spaced instants inside its own 1/60th of a second — the virtual clock, the rAF shim
and the gsap timeline all stepping by `1/(fps*N)` — and the N stills are averaged
into one frame before encoding. That is what a shutter does, and it is the reason it
is worth N times the screenshots rather than being approximated by smearing pixels
after the fact. N is 4 by default, which is where a 60fps shutter stops reading as
four ghosts and starts reading as one smear.

**It is off by default and that is a cost decision, not a taste one.** Screenshots
are the whole cost of a render, so blur multiplies it by N. A preview does not need
it; a final render is not worth shipping without it.

**The blend is `tmix` then `trim` then `framestep`, and it is written that way to
avoid punctuation.** `select=eq(mod(n\,4)\,3)` says the same thing and needs its
commas escaped past three layers of quoting; it silently parsed as a filter called
`4)` the first time. Checked numerically on sixteen flat grey subframes at levels
0,16,…,240: four frames out at **24, 88, 152 and 216**, the exact means of the four
groups. Every run also fails rather than encodes if the blend does not return
exactly one frame per captured frame.

**The guards and the samples run on the frame's own instant**, the first subframe,
so a blurred render prints the same clearance and safe area numbers an unblurred one
does rather than four times as many at a quarter the spacing. They did, exactly.

**What it costs, measured on post6's money beat, 5.34s at 1080x1920/60fps, this
machine.** Without: 320 captures, **37.7s**, 118ms a frame. With, at four
subframes: 1280 captures, **149.6s capturing plus 14.6s blending, 164.2s**, 513ms a
frame. **4.4x, of which the blend is 9%** — the cost is the screenshots and nothing
else. Both files are 1080x1920, 60fps and 5.34s: the shutter changes no resolution,
no rate and no duration, and the run fails rather than encodes if it does. Both
passed every guard, gsap's clock error was 3.3e-8s in each, and the page and node
agreed to 0.

**Looked at, not just measured.** A frame pulled from mid fall out of both files:
the coin is smeared along its travel and the sheet, the two rules and the signature
under it are perfectly sharp. That is the difference between a shutter and a filter,
and it is the reason this was worth four times the render.

### 2026-08-27 — post7, and what a one scene clip costs

**The beat lands once because the copy lands it once.** The brief asked for the
word `one` to get the beat treatment both times it lands alone. It lands alone
once, at 4.87s, on `not five. one.` — `one` is also said at 0.12 and 2.20, but
inside `one tip` and `one boring task`, and a card is cut at a sentence end or
at two words, so neither ever gets a card of its own. That is the copy, not the
emphasis rule being narrow: a second beat needs the script to say `one.` alone a
second time. **The copy was not changed to make the number come out right.** The
guard finds the standalone `one` cards without using the regexp that marks them,
so if the copy ever gains a second the file will treat it as a beat with no edit.

**On short copy, the beat is what sets the caption size.** post7's widest
ordinary card is `automate it`, so the fit never runs out of box and every card
lands on `capSize`. At the engine's 40 that put the ordinary cards at 39.6px
against a beat capped at the brand's 44 — an 11% jump, which reads as a wobble
rather than as emphasis. `capSize: 30` makes it 1.47x, which is post6's 1.55
within a fraction. Worth knowing before the next script is written.

**Three engine fixes, one of them a latent bug that had never fired.**

1. **`fade` now goes to a level rather than to a switch.** It read `to` as zero
   or not-zero and always ramped the whole way. Four squares dimming to 18%
   needed somewhere in between.
2. **A step no longer writes an opacity before its own start time** unless
   nothing else has. A part that popped in and faded later had its pop's fade-in
   silently overwritten by the later step. `flip` with `dir: out` has always done
   this correctly and for the same reason; the two are now in line. `planScenes`
   also refuses a `fade` that starts while the step in front of it is still
   running unless it names its own `from`.
3. **`humAt`.** `settle` puts the closing swell under the whole of the last
   scene, which is right when that scene is the close. A clip made of one scene
   that runs the whole length has no closing scene, and `settle` would have held
   a drone under the entire film. `lastStep` finds the last part to start moving.
   post6 keeps `settle` and its mix is unchanged.

**post6 was re-checked rather than assumed.** Its scene layer's worst one frame
step in every channel is identical to six decimal places after all three fixes,
which is what makes it safe to say the engine moved and the clip did not.

**A liveness guard that says "did it move" is wrong for a scene that does not
move.** Nothing in post7's scene translates: squares spring, four dim, a check
draws, one lights up, and every one of those is a channel other than dx and dy.
The guard now asks whether any channel changed, and prints the translation
number next to it as a statistic.

### 2026-08-27 — words on the card, punctuation in the script

**A caption card carries words and nothing else, and that is the engine's
default rather than a clip's option.** A caption is one or two words at a time,
on screen for half a second, in caps. A full stop on the end of one is
punctuating a sentence the viewer cannot see, and at 44px in Michroma it is a
large black dot doing no work. The marks stay in the script, where the
synthesiser reads them and turns them into the pauses that are the actual reason
they are there — **so nothing about the timing changed**, and the voice is the
same file it was.

A question mark survives, because it is not punctuating a sentence, it is
changing what the word means. `sure` and `sure?` are two different cards.

**It strips at the edges only and never inside a word**, which is what makes it
safe to run over anything: `1,000`, `don't` and `e-pasts` are untouched, because
an apostrophe and a hyphen are spelling and a figure keeps its own separators.

**And it runs after the grouping, not before.** `toCards` and `toLines` break a
card at a sentence end and they need the full stop to find one. Strip first and
every sentence in a script runs into the next. This is the sort of ordering that
is invisible until it is wrong, so it is written into the file next to the code.

### 2026-08-27 — the clip has sound, and it is synthesised

**No audio files in the repo, ever.** Eight sounds written in javascript sample
by sample, for the same reason the pictograms are drawn in code and the mascot is
an inline svg: a sample pack is a dependency with a licence, a download and a
folder of binaries in a public repo, and it sounds like everybody else's clip
because it is everybody else's clip. It is also the only way the sounds can be
*derived* — a pop generated from the caption plan cannot drift out of sync with
the caption, because there is nothing to drift.

**No cue is a hand written time.** A caption pop is the card's own entrance, a
beat is one of the three cards `emphasise` already marked, a coin landing is its
own move step plus the same `IMPACT` constant the animation uses to decide the
coin has touched down. Change a word in the script and the voice, the captions,
the scenes and the sounds all move together.

**Three sound decisions came out of a measurement failing rather than out of a
plan**, and all three are the useful kind:

1. **Gain alone cannot hit a loudness target.** The first loudness pass raised
   the mix and scaled it back down whenever the peak went over, which is not
   limiting, it is turning the clip down. A synthesiser's speech has about 17dB
   of crest, so -14 LUFS under a -1 dBTP ceiling is arithmetically impossible
   that way, and the mix came out 4.5dB under target. It needed a real look
   ahead peak limiter, which is now in the file and pulls 6.1dB on the loudest
   syllables and nothing between them.
2. **A check that trusts the thing it is checking is not a check.** The first
   version of "nothing louder than the voice" gated on the ducking envelope and
   reported 96 failures, none real: the envelope has a 220ms release and stays
   open through the gap after every word, so it was comparing an effect playing
   in silence against silence.
3. **Speech is not continuous, so an instantaneous rule is unsatisfiable.** The
   second version compared instant by instant and found two windows where the
   coin was 3dB over. Both were inside the /l/ closure in the middle of the word
   `alone`. Every stop consonant is 30 to 80ms of near silence, so that rule says
   no audible effect may ever overlap a word **at all** — not that it must be
   quieter than the speech, but that it must not exist, and no amount of turning
   the effects down satisfies it. The check now gates on the voice being present
   in that window and compares against the speech level around it, and it still
   bites: it takes +24dB on the whole bus before it fails. The stricter number is
   printed next to the result rather than dropped.

**The strip is louder than the clip on purpose.** Played at their real levels
with no voice over them there would be nothing to judge, so it is normalised to
-20 LUFS. What is being judged is the relationship between the effects, which is
fixed in `GAINS` and survives any master gain, and the log says so rather than
letting the strip be mistaken for the mix.

### 2026-08-27 — the pictograms are solid ink, and they cast shadows

**Drop shadows are allowed in `demo/lib/pictograms.mjs` and nowhere else.**
`skills/page-builder/SKILL.md` says depth on the site comes from the glow and the
vignette and never from a drop shadow, and that still holds for `index.html`.
The scene layer is demo only: nothing in it is loaded by, linked from or
referenced by the site, and depth on a 1080x1920 clip that plays between two
other people's videos is doing a different job from depth on a page. Einz asked
for it directly. It is one shadow per shape, large blur, low opacity, and it is
the whole depth model — no gradient, no second light, no inner shadow.

**Filled shapes, holes instead of second outlines.** A shape is a filled
silhouette in its own ink and the detail inside it is `--bg`, so a coin's face, a
lock's keyhole, an eye's pupil and the writing on a document are all the page
showing through. Strokes survive only where a stroke is the animation, at one of
two weights and never a third — `planScenes` throws on any other number.

**Springs have a settle, and it is paid for in duration.** A cubic bezier can
overshoot once, which is why everything eased on one reads light. `pop` and every
scene entrance now run on a damped oscillator: about 9% past the mark, then under
a percent back under it, then still. The cost is a steeper start, and it is paid
by making `pop` 0.52s where it was 0.34 rather than by raising a guard. Anything
that falls runs on a `land` curve with a real impact in it.

**Six things were decided off a rendered frame rather than in advance**, and they
are worth keeping because each one is a rule now:

1. **A horizontal bar through the middle of anything is a minus sign.** The intro
   blocks shipped as filled chips with a white bar cut across them and read as
   three minus signs. The coin was caught by the same thing in the first pass.
   The shape's own default now draws no bar unless asked.
2. **`--fg` on `--fg` is one shape.** The magnifier's rim and handle vanished
   into the document under it and the glass read as a plain white hole. It is
   inked `page` now, which is `--bg` and still floats — a second white ink that
   differs from `cut` only in depth, because in a light theme nothing else could
   tell them apart.
3. **`--accent` on `--fg` is a smudge.** Dark green on near black. The folder
   narrowed and the lock moved ten units right so there is page between them.
4. **A knock is a gap, not an outline.** The lock and its shackle were knocked
   as well and a white halo round a green lock reads as a sticker laid on the
   frame; the scene strip then showed the same halo eating the eye it was meant
   to separate. The lock's came off, the knock itself came down from three units
   to 1.6, and the eye's slash is the one part still knocked, because an `--fg`
   line across an `--fg` eye is one shape without it.
5. **A bar with air at both ends between two figures is a punctuation dash.** The
   brand bans those anywhere a viewer can read one, and a diagram is somewhere a
   viewer reads. The bond reaches into both silhouettes now, which makes it a
   join.
6. **The judgement tool imports, it does not copy.** `scenes-test.mjs` pulls
   `SCENES` and `SCENE_BOX` out of `post6.mjs`; a second copy of a scene table
   drifts inside a week and then the strip is judging something that is not what
   ships. It also compresses the gaps only and never the step durations, because
   a strip of a layer moving three times too fast would look fine while the real
   one did not.

### The caption box's top edge was never the caption — 2026-08-27

The scene block came down 70 device px on a marked frame, from `y 82..268` to
`y 117..303` css. Small move, and it exposed something that had been wrong since the
layer was written.

**The clearance guard floored at the caption box's own top edge whenever no card was on
screen.** The box is `300..550` and the caption is anchored to the *bottom* of it, so the
top edge is about 200px above anything that is ever drawn. While the block sat above 300
that fallback was harmless and meaningless — it guarded against nothing. The moment the
block came down past 300 it would have failed on a collision that does not exist.

**It now floors at a measured caption ceiling:** the tallest card in the clip, grown
about its own baseline by the biggest scale the entrance spring reaches. Measured once,
after the caption is fitted, because it is the fitted size that decides how tall the
tallest card is. It does not depend on which card happens to be up, which makes it the
stricter test *and* the one that still means something on a frame with no caption at all.
There is a guard on the guard: if the ceiling ever comes back equal to the box top, the
measurement has silently stopped working and the run fails rather than passing against
nothing.

**The lesson generalises past this file.** A guard that floors at a container rather than
at its contents reads as a real check and is not one, and it passes for exactly as long
as nothing goes near it. The clearance number it printed before the move — 241px — was
never wrong, it was just never tested.

### post6 spends its empty half, and two design calls came off the render — 2026-08-27

`demo/lib/pictograms.mjs` and a re-rendered post6. Demo only: the site did not change,
and the clip that is public is still the one without scenes.

**The empty top half was a decision and it has been reversed on purpose.** post6's own
notes defended it — "the page is mostly air and the clip should be too, and it is where
a platform puts nothing" — and that note is kept in the file rather than deleted,
because the reasoning was sound and it is still the reason the block does not touch a
margin. What changed is the brief: the frame now carries a picture. The zone is 57.4% of
the frame width, centred on the same axis as everything else, 34px below the top safe
line and 32px above the caption's own box. The caption, the mascot and the wordmark did
not move a pixel to make room.

**Two things were decided by looking at the first render rather than in advance, and
both are worth writing down because neither was visible in the numbers.**

1. **The subject of a scene is centred and everything else is a satellite.** The money
   scene first drew a document on the left and a person on the right, which balances
   beautifully once both are there — and reads as broken alignment for the two and a
   half seconds while only the document is. Every scene builds up over time, so what
   matters is that it is centred at every moment, not that it is centred when finished.
2. **A coin is two concentric circles, not a circle with a bar across it.** The bar read
   as a minus sign. The same pass found the coin landing exactly on the sheet's border,
   which reads as a badge stuck to a corner rather than as a thing that landed, and a
   padlock whose bottom edge lined up with the folder's, which reads as a tangent.

**The scene changes land in silence, because the reading already leaves it.** The script
counts out loud and the synthesiser puts about half a second of air around each numeral,
so the handoffs are at 2.91, 7.30, 12.58 and 17.65 — inside those gaps, never under a
word. A scene leaves 0.15s after its handoff and the next arrives 0.15s before it, which
is a 0.30s crossfade in the middle of the silence. `planScenes` refuses an overlap past
0.45s and refuses three scenes at once: a handoff is a handoff, not a dissolve.

**The layer runs on the rAF shim rather than beside it.** Node writes the frame with
`__pic.set`, the one flush per captured frame applies it, and the run checks that exactly
one tick happened and that the frame which landed is the frame for that time. That shim
was previously installed in post6 with nothing to flush, "so a hand animated piece
dropped in later is already on the right clock". This is that piece.

**The small mascot blinks on the same lid as the big one.** `skills/page-builder/SKILL.md`
says two faces on one screen must not disagree about blinking, so the closing scene's face
is driven by the same value, passed in rather than recomputed. Its geometry comes from the
ratios in the skill file rather than being drawn by eye, and it carries `--face` and
`--eye`, so it inverts with the theme and reads as a hole punched in the page exactly as
the real one does.

**`--red` is used, once, and it means what the site means by it.** The checking scene's x
is `--red` for eight tenths of a second before it turns into a green check. That is the
site's own error token doing the site's own job — something is wrong — and it is the only
non `--fg`, non `--accent`, non `--muted` ink in the whole layer. Everything else is a
token out of `index.html` and there is no text in a pictogram at all, so there is no dash
to check and no face to load.

**The guards were written before the scenes were watched, and they are two passes.**
`sceneMotion` walks all 1332 frames before a jpeg is written and fails on a one frame step
past any limit; the render then runs the same comparison unconditionally against the same
numbers the page is handed. Measured on the shipped file, against the limits: the coin
moves 3.165 units in its worst frame against a limit of 4.5, the biggest scale step is
0.080 against 0.14, the biggest draw step 0.089 against 0.12, the biggest fade 0.137
against 0.20, the biggest turn 5.88 degrees against 10. The layer never gets closer than
241px to the caption or 152px to a border, both floors comfortably clear. Every limit is
frame rate relative, so `DEMO_FPS=12` does not fail on being a preview.

### The factory is v1, and the voice speaks english only — 2026-08-27

End of the session that built the pipeline and the first clip on it. Two things are
settled and one is a capability claim worth writing down precisely so it can be checked
against later.

**Factory v1 is complete and on `main`** (`b30bee8`). A caption engine, a free voice, a
reference reader, a style test and post6, five files and about four and a half thousand
lines, all of it tooling and none of it loaded by the site. `package.json` did not gain
a dependency: the websocket protocol the voice needs is written out by hand rather than
pulled in. **The `pop` style's card fill is the default** as of the same day, decided by
watching both against each other rather than by argument, and the style clips and post6
were re-rendered against it.

**English is the only voice language, and that is permanent.** No Russian and no Latvian
voice on any clip, ever. Einz's decision.

Worth being exact about what it is and is not. It is **not** a limitation: the endpoint
`lib/voice.mjs` talks to offers Russian and Latvian neural voices and adding them would
be a morning's work. It is **not** a change to the site either — `index.html` still
serves EN, RU and LV and nothing about the language urls, the dictionaries or the
detection moves. What is closed is the voice on a video, and with it the shortlist under
Socials: the file used to carry CapCut's TTS and Gemini as two options with "neither is
committed to yet" against them, and the answer turned out to be neither of them and our
own module instead.

The type had already been pointing the same way, which is worth knowing and is not the
reason. Michroma is latin only and Space Grotesk ships no Cyrillic, so a Russian caption
in the `pop` or `count` style falls back to the mono stack and stops looking like one of
our clips. Latvian would set, being latin-ext. So the decision costs a Latvian voice that
would have worked, which is the honest way to describe it.

**"Any script to video in minutes" is the claim, and here is the measured version of
it.** The parts that are genuinely a script away:

- the voice, including its word timestamps, in **under a second** for a line and about
  three for a paragraph
- the caption cut, which is a pure function of those timestamps and takes no time at all
- the clip's length, which follows the voice rather than being typed
- the render, at about **two and a half minutes for twenty two seconds** at 60fps, plus
  every guard

The part that is **not** automatic, and should not be claimed as such: **the mascot's
performance is still hand authored per clip.** post6's thirteen gaze keys and their
holds were placed against the beats in that particular script, by hand, and a new script
gets new beats in new places. The layout — where the caption box sits, how big the head
is, what clears what — is also per clip, though post6's numbers are a template that the
next one can start from rather than rederive.

So: a script becomes a rough clip in minutes and a finished one in a session, and the
session is now spent on the performance rather than on the plumbing. That is the real
change and it is a large one, because the plumbing was where the last five clips spent
their afternoons.

**One gap this checkpoint left, closed the same day.** post6 went out with a caption and
hashtags that were not written down. Every other post in this file has its exact wording
recorded, because the wording is what nobody remembers a month later, and the count of
tags had already had to be corrected once from memory (post1 carried five, not three).
Both are now in the post6 block under Socials, recorded at the session close rather than
reconstructed a month later, which is the whole point of the section.

### The sixth clip is driven by its own voice, and the captions are the copy — 2026-08-27

The first clip built on the pipeline rather than beside it, and the first one whose
shape was decided by something measured rather than by something typed.

**The voice is the timeline.** `lib/voice.mjs` speaks the script in the default calm
voice and hands back fifty four words with the synthesiser's own timestamps. Everything
downstream is a function of that array: `planCaptions` cuts the cards from it, the
clip's length is the voice's length plus a 0.65s tail, and the mascot's gaze keys are
placed against the beats in it. There is no caption time typed into `post6.mjs` and no
duration constant either. Change the script and the length follows.

That is the difference between this and post2 through post5, all of which are a written
timeline that a voice was expected to fit into later. post4 literally holds 1.14 seconds
of empty air between each of its four beats so an editor can drop a line in. Here the
line came first and the air is wherever the reading left it.

**The captions are the copy, so there is no statement and no bubble.** Every clip before
this holds a statement at the top for its whole run and puts its beats in the speech
bubble. This one has neither. `lib/captions.mjs` in its `pop` style is the text: michroma
caps, two words to a card, the word being said in the accent, thirty three cards over
twenty two seconds.

**`one.` `two.` `three.` are beats, and the voice already knew it.** Those three words
sit in about seven tenths of a second of air each, unprompted — the synthesiser reads a
counted list the way a person does. So they are marked `emphasise` in the plan, which
fits them on their own and draws them accent all the way through. They land at 44px
against the ordinary cards' 28.3. **44 is the brand's hero cap and it is not raised for a
video**, which is the whole reason the beat is a 1.55x jump rather than the 3x it would
be if the cap were treated as a suggestion.

**Two words to a card, and the number that decided it is the type size.** The `pop` fit
sizes every ordinary card off the widest one, so one long card sets the size for all of
them. Measured: one word a card gives 40px but twenty four cards too short to read and
one of sixty milliseconds; two gives 28.3px and three short cards; three gives 19.8px and
none; four gives 15.6px. Three is the safest cut and it is too small — the captions are
the copy in this clip, and 19.8px reads as a subtitle under something else. **One is the
real hormozi cut and this script cannot carry it**: `a` and `human` are sixty
milliseconds apart, so a card a word would be a strobe. Two is the answer and the three
cards it rushes are `in your`, `it can` and `has a`, which are function word pairs in the
gaps between the words the sentences lean on.

**The mascot is listening, not delivering, and that is a numbers decision as much as a
tone one.** 96px against post5's 136, in the lower third rather than the middle, gaze up
at the captions for most of the clip. Furthest look 2.33 units of the page's 6 where
post5 went to 5.04; thirteen turns in twenty two seconds where post5 had eleven in ten
and a half; blinks 3.0 to 4.4 seconds apart where post5 had 1.45 to 2.60. Biggest one
frame gaze move measured at 0.110 against a limit of 1.20. **He comes to the viewer once,
at 17.95, on `good ai has a human behind it`, and stays there to the end.** One move in
twenty two seconds is what makes it land; post5's mascot moves like that constantly and
it is right for a clip that is a question and wrong for a clip that is advice.

**The audio is in the mp4, and that is a deliberate exception.** Every other clip renders
`-an` because sound is added in the edit. This one carries its own voice, because the
voice is what the clip is cut against and a silent file cannot be checked for sync. The
editor gets a finished thing rather than a thing plus a plan.

**Sync was measured on the finished file rather than assumed.** The captions cannot drift
from the voice by construction — both come from the same array — but a mux can, so
`silencedetect` was run over the shipped mp4 and every sentence onset compared against
the timestamps the captions were cut from. A constant offset of 46 to 57ms with a spread
of about 20, and **it does not grow across twenty two seconds**, which is what a real
drift would do. It also shrinks monotonically as the detector's threshold drops, which is
what a threshold artefact does: the detector reports where the signal crosses a level,
and a word starting with a stop consonant is silent for its first few milliseconds. What
is left is the engine marking a boundary at the start of the phoneme rather than at the
start of the sound. Forty five milliseconds, in the direction that puts the caption
fractionally ahead of the audio, which is the correct direction for a caption.

**Building it found two real bugs in the caption engine.** Both are fixed and both
improve every style.

- **A card could be clamped away before its own last word was said.** `lead` pulls a
  card's entrance forward so its spring is finished by the time the word is, and on
  sparse speech that costs nothing. On dense speech adjacent cards are twenty
  milliseconds apart, so a 120ms lead reached back over the previous card's final word
  and the clamp that stops two cards overlapping then cut it off. `decide what it` and
  `that is the` each had a last word that was **never on screen at all**. A card now
  never arrives before the previous card's last word has finished; the lead is a courtesy
  and the word being said is not. `plan.tight.late` is the list that has to stay empty
  and the render fails on it.
- **A short card had an entrance it could not finish.** An entrance that always takes
  200ms never completes on a 200ms card: it appears at two thirds scale, holds nothing,
  and leaves — a flinch, and the same three cards flinching every time the clip loops.
  `popTiming` now scales the entrance, the emphasis and the exit to the card's own
  window, so a fast card feels fast rather than broken.

**And it found a flaw in the approved style, which is now an option rather than a
silent change.** The default `pop` reveals a word at a time and holds the place of the
words that have not arrived, because a card that reflowed as it filled would slide the
words already on screen sideways while somebody is reading them. At three words that is a
lean. **At two words it is a card sitting visibly off centre for half its life** — the
first word alone in a box the width of two — and it reads as broken rather than as
filling. `fill: 'card'` springs the whole card in at once and lets the accent walk across
it as the words are said; the pop is still there twice over, once on the card and once
per word.

It went in as an opt in so the three judged style clips would keep describing what they
rendered while both were watched side by side. **`card` won and Einz made it the default
the same day, for every style clip and every post.** The style clips and post6 were
re-rendered against it and post6's override was taken out rather than left behind to look
like an opinion one clip still holds on its own. `fill: 'word'` stays for anything that
specifically wants the reveal, and an unrecognised value now throws instead of quietly
falling back to the behaviour that is no longer the default — a silent fallback there
would answer a typo with the old style, which is the one bug in that file nobody would
think to look for.

Two smaller things went the same way. The word gap on a pop card was typed in the css and
again in the fit, which is a caption that overflows its box the day somebody changes one
of them; it is one number in the plan now, and it went from 0.30em to 0.42em because
michroma's side bearings are wide enough that 0.30 measured like a space and read like
none — `DATA WITHOUT` came out as one word. And `maxLines` on the calm style was an option
nothing read, with the ramp typed out as a list beside it; the ramp is generated from it
now, so the option is real.

**The three style test clips were re-rendered**, because the engine moved under them and
a file on disk that no longer matches the code is worse than no file.

### The pipeline grows a voice, captions and a reader — 2026-08-27

Five clips in, the bottleneck stopped being the renderer. Every clip so far has left
**empty air for the editor to drop a voice line into** — post4 says so in as many words,
it holds 1.14 seconds between each of its four beats for exactly that — and every clip
has been posted with captions written somewhere else. So `demo/` gained three things it
did not have, and none of them touch a clip that already works.

**Free voice, and it had to be free.** Edge's read aloud voices answer an
unauthenticated websocket. That is what moneyprinterturbo and every other free pipeline
uses, normally through the python `edge-tts` package. We wrote the protocol out instead,
because it is four messages long and because **the alternative was a dependency**, and
`demo/` has had exactly two since it was built. Node 24 ships a global `WebSocket`, which
sounds like the answer and is not: it cannot set request headers, and this endpoint wants
an `Origin` and a `User-Agent` that say Edge. So the handshake goes over a tls socket and
the frames are masked by hand, about a hundred lines.

**Three voices, and the choice is a brand decision rather than an audio one.** Twenty two
english voices answer that endpoint and most of them are wrong for us however good they
sound: the line `we delete the manual work` has to land flat, so anything cheerful,
breathy or filed under "expressive" is out. `en-US-AndrewNeural` is the default because
it reads a statement as a statement rather than as an offer, `en-US-EricNeural` is there
for when a line is a fact, and `en-GB-RyanNeural` is there because we are in Riga, not in
California. All three run at a negative rate: the neural default is a shade faster than a
person reading a short line to camera.

**The word timestamps are the point, and they are why there is no whisper in the loop
for our own copy.** The service emits a `WordBoundary` per word, an offset and a duration
in 100ns ticks. That is a real timestamped transcript of a line we wrote, out of the
synthesiser, with no alignment pass and nothing guessed. It is exactly the array the
caption engine eats. Every open source pipeline that does word by word captions —
captacity, moneyprinterturbo — transcribes its own audio to get this; for a line we wrote
ourselves that step is redundant, and the result is exact rather than close.

Four traps, all of which cost real time and all of which are in the file as comments:

- **The drm ticks are past 2^53.** `Sec-MS-GEC` is sha256 of the windows file time
  rounded to five minutes, in 100ns ticks, with the public token appended. Compute those
  ticks in plain javascript numbers and they round silently, every hash is wrong, and the
  endpoint answers a blank 403 with no explanation. `BigInt`, or nothing works.
- **A missing muid cookie is refused the same blank 403**, so a missing cookie looks
  exactly like broken drm.
- **Word boundaries and sentence boundaries are one choice.** Asking for both is how you
  get neither. Sentences are derived from the words and their punctuation afterwards,
  which cannot disagree with the timings the captions are cut against.
- **The engine hands back the spoken token and nothing else**: `parts.` comes back as
  `parts`, and `40 hours` comes back as one event. Both are put back — punctuation from
  the copy we sent, multi word events split by length inside the box the engine already
  agreed. Without the first every caption loses its full stops, and the brand's rhythm is
  mostly full stops. Without the second the counter style has nothing to count.

**Three caption styles, because one is a preference and three is a decision.** `pop` is
the hormozi cut done in michroma: big caps, one short card, each word springing in, the
word being said in the accent. No yellow, no stroke, no drop shadow, no four words in
four colours — the restraint is what makes it ours, and it is still the loudest thing we
make. `type` is space grotesk, lines arriving from below and dimming as they are
overtaken, the live word at weight 500, **and no accent anywhere**, deliberately: it is
the one that has to run under something else without competing with it. `count` rolls a
number on a fixed cell grid, which is `index.html`'s own trick for stopping a scrambling
wordmark wobbling, and the figure carries the accent because in that style the figure is
the message.

**The engine is split so that nothing measures and animates in the same place.**
`planCaptions()` is node and measures nothing, so a cut can be printed and argued with
before a browser opens. `captionFrame(plan, t)` is the entire animation as a pure
function of time. The page half only writes what it is handed. That split is not tidiness:
**one captured frame carries five or six BeginFrames**, so a `.4s` css spring resolves in
five frames, and post2 already paid for that lesson. The rAF shim fixes rAF and nothing
fixes transitions, so there are none.

Two numbers worth keeping. **The `pop` fit divides by 1.125**, which is the largest scale
a word reaches with its entrance overshoot and its emphasis kick multiplied together: a
word springs about its own centre, so a card fitted to exactly the box width puts its
outer words over the safe line on the frame they arrive. Solved from the easing rather
than typed, so changing the bounce moves it. And **a group's exit runs inside its window
rather than after it**, which is what makes "never two cards at once" arithmetic instead
of a hope.

**The analyzer exists because a skeleton is not a copy.** A reel that works has a shape:
a hook inside the first second, a cut rate, a caption cadence, and a place on the frame
where the ink sits. `analyze.mjs` reads that off a reference and writes it down as
markdown you read rather than json you parse — shot lengths as bars, the frame the first
word lands on, the pauses the delivery leaves, and **the same transcript put through our
own caption engine**, so the reference's cadence and ours can be compared in the same
units. It ends on a card of numbers to build to. It reads; it never writes to the file it
is given and never uploads it.

**Both passes that can be missing have a real fallback, and the report names which one it
used at the top.** No transcriber or no model gets ffmpeg's `silencedetect`, which is the
rhythm of the delivery without the words and is most of what a skeleton needs. No
tesseract gets an edge density reading of each third of the frame, which does not read
text and does not pretend to — it says which band is carrying detail, which is enough to
tell a talking head from a full screen caption. Both fallbacks ran here, because on this
machine the huggingface weights download is refused and tesseract is not installed. **So
the transcript pass is verified up to the model fetch and no further**, and that is
written into MEMORY rather than rounded up.

One ffmpeg trap, because it fails silently and looks like an answer: the scene pass uses
`-vf`, not `-filter_complex`. A complex graph needs an explicit `-map`, and without one
nothing reaches the null muxer, so the pass runs, prints nothing, and reports a video
with no cuts in it.

**The test clips have sound in them and every other clip in `demo/` does not.** That is a
deliberate exception, not a drift. Clips render `-an` because the sound is added in the
edit; a caption test is the one case where the sound is the thing being tested, because
the whole claim is that the words land on the frames they are said on and a silent clip
cannot show that.

Nothing here is wired into a post. The next clip is where that decision gets made, and
the three styles now exist as five second files so it can be made by looking.

### The fifth clip asks a question, and the mascot searches for the answer — 2026-08-26

`demo/post5.mjs`, `what is the most boring part of your business?`. One question
on screen the whole clip, two beats of answer, ten and a half seconds, vertical
only, written to loop. post4 is the template and its rigs are untouched.

- **Six lines, and the floor is a number.** `business?` is nine characters, so
  no split at any line count goes below nine. No split into five or fewer gets
  below eleven, because every pair of adjacent words in this sentence that would
  fit a ten cell line is already merged at six. Measured against the 405px this
  cut allows: four lines gives 17.9px, five gives 19.5px, **six gives 23.9px**.
  So six is both the largest type available and the fewest lines that reaches
  it. It costs 191px of height where post4 spent 140, and this layout has it
  because the bubble under it is one line rather than three. `boring` lands
  alone on the middle line, which is the reason to prefer this break over the
  other six way splits.
- **The beats swap in place, they do not exit and return.** post4's four beats
  fully exit so the editor gets empty air for a voice line per beat. This clip
  is one question and one answer: a bubble that left and came back would read as
  two separate thoughts. So the dots come up once at 4.50, hold through the
  swap, and leave once at 9.80, and only the pill knows the swap happened. The
  swap itself is **post2's, numbers untouched** — the pill dips to .86 and
  re-springs rather than fading the words over. The text is cued on the frame
  the dip bottoms out on, so the reflow from the 73px pill to the 117px one
  lands under the smallest scale of the bounce rather than at rest.
- **The mascot moves on two axes, and that is new.** post2 and post4 both drive
  `--ex` only and hand `--ey` a flat zero, because they only ever had one thing
  to look at. This clip is a mascot waiting for an answer, so the vertical is a
  real track. The site's own clamps are `EX=6` and `EY=3.8`; the furthest look
  here is 5.63 combined and 2.0 vertical, inside both, and a check at the top of
  the file fails if a key ever passes 6.
- **What makes it read as searching rather than twitching: holds.** Ten turns
  and ten holds. Every turn lands on a value and sits a quarter to a half second
  before the next starts, no turn is faster than 0.30s or slower than 0.55s, and
  the two tracks share their key times so a turn is one movement in a direction
  rather than two on different clocks. Seven blinks at 1.5s apart, a shorter gap
  than post2's and post4's 1.7 to 2.9s, because a mascot searching the room
  blinks more than one reading a list.
- **The gaze guard now measures a vector, not an x.** post4 read `matrix()[4]`
  and compared it frame to frame, which was complete when the vertical was
  always zero. It is not any more, so the guard reads `[4]` and `[5]` and
  compares the length of the step. A snap on the new axis would otherwise have
  passed a check that was only ever looking sideways. Biggest one-frame move
  0.582 against a 1.20 limit.
- **The pill font went back to 16px.** post4 held it at 14 because three lines
  had to fit between the statement and the head, and it says so in its own
  comments. One line has no such pressure, and 16px is 32 device px of caption,
  which survives a platform recompress. The bubble stays a rounded rect rather
  than a stadium even though one line would survive a stadium: the series should
  not change shape between clips for a reason a viewer cannot see.
- **The anchor barely engaged, and that is worth recording.** `we will fix it.`
  clamped by only 2px, `tell us.` by none. The rig is present and measured, not
  assumed, but at these widths post2's slide would have done the same job. The
  anchor stays because it is the template's and because it costs nothing.
- **A new guard: the pill must clear the statement by 24px.** Six lines is the
  tallest block any of these clips has carried and the statement and the pill
  are the two things that move if the copy changes. Nothing else would have
  caught them touching. Measured clearance 57px, and the pill clears the head by
  6px.
- Everything else carries over untouched: the rAF shim, the seeded prng, the
  virtual time frame loop, the cell grid, the wordmark fit, the anchored pill,
  the encode settings, and the line count, pill width, no-dash, blink and safe
  area guards. New seeds for post5 so the scramble and the blink rhythm are its
  own, and new eye keys. Safe area measured 135px left, 224 top, 113 right, 195
  bottom, device px, against a floor of 96.
- **The question mark stays.** The brand bans dashes, not question marks, and it
  is the whole point of the line. The no-dash check runs over every string in
  the file including the statement and both beats.

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

In this order, agreed 2026-08-24. **Rechecked twice on 2026-08-27, once at the factory
checkpoint and again at the session close: still six items, same order, nothing done and
nothing dropped.** The factory session built a pipeline and two clips, the session after
it built a scene engine and shipped the clip, and between them they touched none of
these, which is worth noticing rather than explaining away. **Note for the next
recheck:** four of the six get named from memory — sitemap, telegram pfp, the form test
and the about section — and the two that get forgotten are the card re-scrape and the
RU/LV descriptions. They are still open. Read the list, do not recite it. Previously rechecked 2026-08-26 with the same result. Confirmed by Einz at the end of the post4 session:
sitemap check, telegram pfp, the real form test, the about section, the RU and LV
descriptions and the card validators are all still open, and post4 did not touch any
of them.

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
- **post4, "3 free ai tools", is built and resized** — 2026-08-26,
  `demo/post4.mjs`, rendered and with the editor. It jumped post3 in the queue;
  **post3, "missed calls", is still unbuilt** and still wants building. Caption,
  tweet, tags, music and the voice plan are all decided and written down under
  Socials. Not posted yet.
- **post5, "what is the most boring part of your business?", is built and its plan
  is locked** — built 2026-08-26 (`demo/post5.mjs`, `990b206`), plan locked
  2026-08-27, **posts 2026-08-28.** Caption, music, the servo cues and a posting
  rule are all under Socials. It jumped post3 too, so **post3, "missed calls", is
  now two clips behind and still unbuilt.** Two things still owed before it goes
  out: **the three hashtags per platform**, and **the mix, which must read the cue
  timing note** — the locked numbers are turn ends, not turn starts.
- **post7, "one tip for your business", is built and pushed** — 2026-08-27,
  `demo/post7.mjs`, `3874b6c`. 10.22s, voice and effects in the file. Caption, tweet
  and three tags per platform are written down under Socials. **Not posted.** It
  jumped post3 as well, so **post3, "missed calls", is now four clips behind and
  still unbuilt.**
- **post9, "the pitch reel", is built, committed and parked** — 2026-08-28,
  `demo/post9.mjs`. 23.89s, 60fps, voice and effects in the file, every check
  passing. **Not pushed and not posted.** Two things it owes before it can go
  out: **the posting pack** — caption, tweet and three tags per platform, none of
  them decided — and **a call on the three review findings** under Decisions,
  which are written down and deliberately not done. **No more post9 work until
  Einz asks.** It jumped post3 as well, so **post3, "missed calls", is now five
  clips behind and still unbuilt.**
- **Parked and not queued: the `unterberg.ai` direction**- **Parked and not queued: the `unterberg.ai` direction** — fake ui mockups in the
  paper style, big type end cards, and the comment magnet loop. Studied 2026-08-27,
  written up under Socials, **discuss before building.** The third one cannot start
  at all until a lead magnet file exists.
- Beyond post3, still no cadence and no pillars. Two clips is a format, three is a
  habit; what is missing is a reason to post, not another asset.

Not scheduled, parked:

- **Analytics, as an idea only.** CLAUDE.md and the skill both ban analytics, trackers
  and cookie banners outright. Nothing goes in the page until Einz lifts that rule in
  writing, and the first question is what number would actually change a decision.
- **Content cadence and pillars.** The first video is posted and the reel pipeline can
  produce more on demand. What is missing is a rhythm and a reason, not another asset.

## Open questions

- **Does the scene layer get a type vocabulary?** Raised 2026-08-27 by the
  `unterberg.ai` direction. `lib/pictograms.mjs` has no text in it on purpose, and a
  fake chat ui or a command palette is not a fake chat ui without words. It is the one
  real engine decision in that direction and nothing about the mockups can be estimated
  before it is answered. See Socials.
- **Is there a lead magnet, and do we want to dm strangers?** Raised 2026-08-27, same
  direction. The comment magnet loop is blocked on a file that does not exist, and the
  loop itself means dming somebody who replied to a video. Both are decisions rather
  than build tasks. See Socials.
- **post7 has a pack and has not been posted.** Written down 2026-08-27. Unlike post6's
  gap this is not a missing decision — caption, tweet and tags are all recorded. The
  open part is whether and when it goes out.
- Business email to publish — still not decided. The form is now the contact route, so
  this is no longer blocking, but a real address is still worth having.
- Whether the full site stays single-file as it grows past v1. Default: stays
  single-file until it genuinely can't.
- ~~Whether to ship an `og:image`, and which theme it wears.~~ Decided 2026-08-24: yes,
  and light. `assets/og.png` exists. See Decisions.
- Whether the RU and LV stubs keep the english description or get translated ones. They
  share the english string today. **Confirmed still open 2026-08-25 — the stubs still
  carry the english string.** Next steps item 2.
- ~~**How many hashtags a post carries.**~~ Settled 2026-08-26: **exactly three
  lowercase hashtags per platform.** post2 and post4 both carry it, post1's five on
  tiktok is the one exception on record. See the house rule under Socials.
- ~~Whether to register the site in Google Search Console and submit the sitemap.~~
  Decided: yes. It is Next steps item 3, as a recheck rather than a first setup.
- Whether the light or the dark screenshot is the one that goes on the socials.
- ~~**Which free TTS to use, and whether a clip gets a voice at all.**~~ Settled
  2026-08-27: `demo/lib/voice.mjs`, Edge's read aloud voices, `en-US-AndrewNeural` as
  the default. Neither of the two shortlisted options. See Decisions and Socials.
- ~~**Whether clips get Russian and Latvian voices, the way the site has RU and LV
  copy.**~~ Settled 2026-08-27: **no, and never.** English only, permanently. The site
  stays trilingual; the voice does not. See Decisions.
- ~~**post6's caption and hashtags are not written down.**~~ Closed 2026-08-27 at the
  session close: caption, the three tags on each of tiktok, instagram and youtube, and
  X's tagless tweet text are all in the post6 block under Socials. It was open for one
  session and it was the only open item that session created.

## Not committed / lives elsewhere

- **Social banners** for X, Facebook and YouTube — delivered, not in this repo.
- Brand image assets (`BT.png`, headers, earlier mascot renders) sit in
  `~/Downloads/Boring TEK files/`. Not committed — decide format and whether inline SVG
  can replace them before adding any binary.
- `assets/` in the repo holds the mascot — `mascot.png` (reference), `mascot.svg` (source
  of truth) and the four pose variants — and, since 2026-08-24, `og.png`, the share card.
  That card is the first binary the live site actually requests.
