# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- **Fix round 2026-09-06: the facepalm, four ways.** All in
  `demo/lib/mascot.mjs`. 12,138 frames across 33 plans still byte identical with
  the hands off, the module's checks pass, and the hands chapter renders green at
  12fps and at 60, both themes.
  - **The brows were grey rather than hidden, and the gate was racing.**
    `hcover` was written on the pose's own `entry`, which for a facepalm is
    1.02s because that is how long a hand takes to cross a head — but the state
    under it raises its brows in 0.30s. So the brows went **up to 0.725** and
    then dimmed slowly for a second, which is exactly what a review sees as
    grey. The gate is on `HANDS.coverFor` now, 0.18s, which is quicker than the
    fastest brow entrance on the face: the worst drawn brow anywhere under the
    pose is 0.0035 under `unimpressed` and 0.035 under `surprised`, for two
    frames. There is room to be that quick because a `surprised` brow already
    steps 0.429 of its own opacity in one frame. **The guard now measures the
    worst frame between the mark and the exit, not the settled one** — the
    settled frame was clean the whole time the bug was shipping.
  - **The one frame flash was a promotion hint fighting the glow.** Nine
    one-frame blanks in the 60fps dark cut, all inside the facepalm, none in
    light and none in the states clip; a blank frame was the plate and the glow
    and nothing else. `will-change:transform` on `.m-glove` asks Chrome to
    promote each glove to its own layer, and the css filter on the group above
    has to pull that layer back down and re-raster it into the filter every
    frame. Under the recorder a raster that misses is a frame in the file rather
    than a dropped frame on a screen. **The hint is gone and the dark clip is at
    zero spikes over 1257 frames.** The css assertion is in the module because
    adding it back looks like an optimisation.
    - Related and *not* ours: a single light-theme blank turned up at 17.2s on
      one render and did **not** reproduce on a re-render. One frame in 1257,
      non-deterministic, in a pose with no filter on it — the recorder's own
      raster hazard, the same family as the compositor stall post2 found.
  - **The facepalm moved to x 45.0, and the tool was why it took three tries.**
    `demo/out/poses/ref-grid.mjs` draws the card's grid over the reference crop
    with our ink box on it, and it was **measuring the unmirrored drawing** —
    `handShape` gives the screen right hand the reflection, so the ink runs the
    other way from the wrist and the box was for a hand that is not on screen.
    28.5 and then 35.5 were both placed against that. The tool takes the sign
    now (it lives under the gitignored `demo/out/`, so this note is the record),
    and the sheet's hand covers x 25 to 52 where ours lands 25.3 to 51.5. On the
    screen that is the far eye and the forehead with the near eye clear.
  - **The separation edge is halved, 0.75 to 0.375 grid units** — three device
    px to one and a half at size 128. It is a separation rather than a drawn
    line, and at three px it was a black border round a sticker. **What it costs
    is h.264**: at crf 17 and 1080 wide three px survives cleanly and one and a
    half softens. Deliberate; both guards moved to the thin band so it cannot
    drift back without a decision.

- **Fix round 2026-09-06: the one handed poses were the wrong hand, and now the
  gloves glow.** Four things off the first traced review, in
  `demo/lib/mascot.mjs`. 12,138 frames across 33 plans still hash byte identical
  with the hands off, the module's own checks pass, and the hands chapter
  renders green at 12fps and at 60, both themes.
  - **Every one handed drawing is the screen *left* hand and `handShape` had the
    sign backwards.** The sheet waves, thumbs, facepalms and points with the
    hand on the left of its own panels — which is why `compare.mjs` flips every
    reference crop but `rest` — so a traced file goes into the left hand
    unflipped and is reflected for the right one. It shipped the other way and
    every one handed pose was the wrong hand: a wave with its thumb pointing
    away from the face, a thumb with its knuckles turned out. One character,
    four poses. The rule to check a new drawing against is **a hand on the right
    of the head is a right hand, and the thumb is the side nearer the face**.
  - **The facepalm lands on the other half of the face**, `at.x` 28.5 to 35.5
    with the drag's four degrees changing sign with it. This is the one row
    written against the reference rather than off it: the sheet drops the hand
    on the side the acting hand comes from, which reads as a hand resting beside
    the face; mirrored, the wrist enters near the middle and the fingers fan
    across the crown, which is the gesture.
  - **And it takes the brows with it.** `hcover` is a channel, nought normally
    and one while a pose that declares `covers` is up, and the brows' opacity is
    multiplied by its inverse. It fades over the pose's own entrance and back
    over its exit, so nothing pops — the worst one frame step is 0.126, which is
    exactly the entrance those brows already make under `surprised`. A hard
    lookup would have been a brow vanishing on one frame. `facepalm` is the only
    pose that declares it.
  - **The pointing hand moved to the other side of the head, and it is a `side`
    on the mark rather than a number in the table.** Mirroring the pose's own
    row is the obvious fix and it is wrong: the pose sits just outside the
    acting hand's resting place, so reflecting `x` sends that hand sixty eight
    grid units — more than the width of the head — in the four tenths of a
    second a jab has, and the step guard says so at 52 css px a frame against a
    ceiling of 12. **A hand points from where it is.** So `demo/mascot-test.mjs`
    asks for `side: 'left'` and the module's comment says why. `thumbs-up` moved
    to `'right'` in the same cut to keep both sides exercised.
  - **The gloves carry the head's own glow, scaled to a hand, dark only.** Two
    chained `drop-shadow`s on the ink layer at the face's own two blurs and
    opacities, multiplied by 32.5/60 — the hand's box against the head's — so
    the halo is the same at the same proportion. It is a drop-shadow rather than
    two blurred copies because a plate is one rect and a glove is seven hidden
    outlines a hand: copying the layer twice would be four more groups for the
    runtime to place every frame, and a drop-shadow is the same picture for one
    declaration. **The radii are doubled and then divided by `plan.unit`** —
    doubled because a drop-shadow's radius is twice the deviation a css blur
    takes, divided because a css length inside an svg is in the element's own
    user units, which are grid units here. Getting that unit wrong is a halo
    either the size of the head or invisible, so the check asserts the number:
    5.958 grid units of radius at size 128, which is 5.96 css px of blur.
  - **`point` still reads as a fist** and that is unchanged and still a file
    swap: the traced drawing aims the finger at camera and it closes into the
    mass. Nothing in the module can fix it.

- **Closed 2026-09-06: the mascot's floating hands are traced vector paths off
  the sheet, and the rejected drawn version is gone.** Ten svgs in
  `demo/assets/hands/` — `rest-left`, `rest-right`, `wave`, `thumbs-up`,
  `facepalm`, `shrug-left`, `shrug-right`, `point`, `panic-left`, `panic-right`
  — imported into `HAND_SHAPES` in `demo/lib/mascot.mjs` with their coordinates
  untouched. **Nothing in the module draws a hand any more.** A pose is a shape
  rather than an arrangement: the table says which path, where its wrist goes,
  which way it is turned and how big it is, and that is the whole of it.
  - **The six rounded rects are deleted and so are seven channels.** The four
    finger curls, the thumb curl, the splay and the thumb angle were the
    arithmetic that bent a rect into a knuckle; a traced path has no rect to
    bend. `HANDS_REST` is five numbers where it was twelve — `x`, `y`, `rot`,
    `sc`, `o`.
  - **The wrist is the anchor and it is each file's own**, measured by
    `demo/out/poses/measure-traced.mjs`: it rasterises the path, projects the
    ink onto the direction the wrist points in, takes the outermost nine per
    cent of the run and reports that band's centroid. A wave rocks at the wrist
    and a hand hangs from one; a pose turned about its centroid is a hand being
    spun rather than held.
  - **Every placement was read off the sheet rather than judged, and that moved
    all seven.** `demo/out/poses/ref-grid.mjs` draws the card's own 64 unit grid
    over each surviving reference crop with the pose's ink box on top of it. The
    first pass sat the whole set about **fifteen units too high** because the
    resting hands were placed at the head's middle and the sheet hangs them off
    the bottom of it — a resting hand's ink runs y 46 to 69 on a head that ends
    at 62. `thumbs-up` was seventeen units out on its own, `facepalm` fifteen,
    `panic` fourteen across.
  - **One scale, and it is calibrated on the open hand.** `HANDS.box` is 32.5
    grid units for a file's own 400 unit frame, which lands `wave` at 27.06 by
    26.08 against the sheet's 27.0 by 26.1. The size guard moved with it: the
    band is on the **larger side of each drawing's own ink**, 0.33 to 0.50 of
    the head, and the ten land between 0.372 and 0.456. There is no mitt in a
    traced pose to guard instead.
  - **The shape is swapped, not tweened.** A shape cannot be a channel, because
    a channel is a number and gsap would ease it: two white shapes crossfading
    over a face is a double edge for the length of the fade, and a path index
    eased from one to five draws three poses nobody asked for. So it is resolved
    out of the plan's marks — `handShapeAt`, a lookup — and the markup carries
    every pose's path hidden, with the page showing the one the frame names.
  - **`gloveCorners` is the outline's own convex hull**, flattened at sixteen
    segments a curve and cached at load with its mirror beside it. A hull is
    exactly as good as the whole outline, because every consumer takes an axis
    aligned box **after** a rotation. The reach walk costs 73ms on a thirty
    second clip. The flattener refuses anything but `M`, `C` and `Z` absolute.
  - **And it fixed something the rects got quietly wrong**: the left hand was
    reflected on the page and not in the corner sweep, so its reach was the
    reach of a hand that was never drawn. A symmetric glove hides that.
  - **The edge layer is `fill:none` now.** Five overlapping shapes needed the
    face colour painted under the stroke so a later shape could cover an earlier
    one's outline; one closed path has no loops to hide, and the lines the sheet
    draws inside a silhouette arrive with the path.
  - **Everything else stands untouched**: the opt in, the marks api, `side`, the
    separation edge as two clipped layers, the inverse card scale, the measured
    reach moving the head in, `headRect` growing to cover the pair, and the two
    chapter test. **12,138 frames across 33 plans still hash byte identical**
    with the hands off.
  - **Video review: six of the seven read, and `point` does not.**
    `demo/out/review-mascot-hands-dark.md`, off the 60fps cut with the shutter
    open. `thumbs-up` is a fist with a thumb rather than a stump and `panic` is
    two hands gripping a head rather than two fists, which are the two the last
    review named. **`point` reads as a fist**: the traced file aims the finger
    at camera, foreshortened, with its tip as a circle about twenty device px
    across on a 240px head, and it closes into the mass. That is the drawing
    rather than the placement — the ink box sits on the sheet's own panel to
    within a unit — so the two ways out are to use `point` only where the copy
    already says who is being pointed at, or to trace a side-on point and swap
    the file. **Neither changes a line of the module.** Also noted: the
    facepalm's arrival is the one beat that would be cleaner at six subframes.
  - **`demo/assets/` is gitignored now and `demo/assets/hands/` is not.** That
    folder holds artwork a clip places but does not own — reference sheets, app
    icons, other people's logos — and on a public repo one `git add .` publishes
    it. The ten gloves are the exception because they are our own trace, and the
    same paths already ship inside `demo/lib/mascot.mjs`. The rule is
    `demo/assets/*` with `!demo/assets/hands/` under it: git does not descend
    into an excluded directory, so a trailing slash on the first line would make
    the negation unreachable and the svgs would vanish with no error anywhere.
  - **`demo/assets/hands-ref.png` is gone** — it was a local file in that folder
    and it is not on this machine any more. The seven crops
    `compare.mjs` cut out of it survive at `demo/out/poses/cmp-ref-<pose>.png`
    and are what everything was compared against. The ten traced files are the
    sheet now as far as the module is concerned.

- **Fix round 2026-09-06: `demo/post19.mjs`, the names get a voice and the label
  starts empty. 11.15s, 110 guards green at 12fps and at 60 with the shutter open
  at six subframes.** The panel's name spot is empty until the question is fully
  typed and `Claude` is the first thing in it. The voice reads all five names, and
  **every stop is the start of its own spoken word** rather than half a second
  after the last one, so the label, the mark, the click and the caption card all
  land on the same frame. `chat g p t` is spelled in the copy and folded back into
  `chatgpt` for the caption. Giving the names a voice added 2.54s.
  - **The loudness loop learned to bisect, and post19 is why**: it would have
    shipped at -21.2 LUFS with every guard green. See the Decisions entry, and
    lift it into `lib/sfx.mjs` next time that file is open — every post file
    carries a copy of the loop with the same cliff in it.

- **New 2026-09-05: `demo/post19.mjs`, which ai do you use.** A chat panel asks
  the question, five model names land as they are spoken with each one's mark
  popping in above, the mascot's head turns to the label quicker every time until
  the room goes round, the signal breaks, and he drops in from off the top of the
  frame and smashes flat with `all of them.` over his head. post17 is the template
  for the panel, the two faults and the held thought; post18 for the captions, the
  gaze and the guards. `lib/` untouched.
  - **Two firsts.** It measures somebody else's assets before it places them —
    five square pngs decoded with ffmpeg for their alpha bounding box, so the
    *ink* is fitted to one height rather than the canvas — and it squashes the
    mascot with a layer of its own, chin held on the ground line by arithmetic.
  - **The five files are not what the brief described.** The brief says white on
    transparent; what is in `demo/assets` is five app icons, tiles and all, two
    of them carrying their own wordmark. Never redraw or recolour beats it, so
    they ship as they are and the mismatch is written down in three places.
    Swapping the files fixes the look and changes no code.
  - **The fall's length is a shutter number.** It fell in 0.36s at first, which
    is 52 css px on the frame it lands, and four subframes blended that into four
    stacked copies of a face. Eight would have fixed it and the render was killed
    for memory at 4152 captures. It is 0.47s now and it starts on the fault's own
    first frame instead of half way through it, so the extra 0.11s comes out of
    the fault and **the landing does not move** — 13.2 device px between samples
    at six subframes, and the samples overlap.
  - **Four faults the guards were green on and only a frame could show**: the
    panel's border sitting exactly on the safe line, a crossfade printing one
    opaque tile through another, the module's dark shadow painting a pale
    ellipse the fall exposed, and three caption cards that were fragments rather
    than phrases. See the Decisions entry.
  - **It is 8.65s against a brief that asked for eight**, and 6.7s of that is
    three lengths the brief itself fixed. The two cuts that would close the gap
    are printed on every run.
  - Review at `demo/out/review-post19-dark-1080x1920.md`, full write up under
    The nineteenth clip in `demo/README.md`.

- **Fix round 2026-09-05: `demo/post18.mjs`, five changes and one of them is a
  pronunciation. 12.63s, 88 guards green at 12fps and at 60 with the shutter
  open.** The opening said the name twice and now says it once; the read is warm
  and spells the name; he stands 110 css px lower; and the mark comes back higher
  and turns while the thought plays.
  - **`speak()` escapes its input, so ssml never reaches the engine.** A
    `say-as` written into the copy arrives at the synthesiser as literal angle
    brackets and is read out. The way to make `chat gpt` land as letters is to
    **spell it in the copy** — `chat g p t 6` — and the evidence it worked is the
    word list: five separate word boundaries where a word would be one. That is
    now a guard rather than a hope, and nothing on the screen carries the
    spelling.
  - **Spelling a word costs about 0.9s of read**, and a warm delivery costs the
    rest: the film went 11.40 → 12.63 against a brief that had asked for nine to
    ten. Both halves of that were asked for in the same round.
  - **`typeToWords` refuses a copy whose tokens do not match the read's**, which
    is exactly what it is for, and spelling the name broke that match. The second
    line is laid across the span from `astra` to `here` with post14's jittered
    window instead. **Its last character lands a jitter short of the window's own
    end** — typeAcross normalises the weights, not the last instant — so a guard
    written as an equality against the word's end fails on a film that is
    correct. It checks the character is inside the word now.
  - **A rotation under a held frame needs post14's curve, not the house in-out.**
    Every bezier whose second control point ends at one arrives at zero speed, so
    a mark eased to a stop under a held thought is a still frame with a pill
    beside it. The guard measures the last frame's own step against the average
    rather than trusting the curve's name.
  - **Manrope is in the page for the captions, so the name above the title can be
    bold.** The brand holds Space Grotesk to 400 and 500; the caption face is
    allowed a weight, and reusing it for one line of chrome is cheaper than a
    fourth family.

- **Second cut 2026-09-05, superseded by the fix round above: `demo/post18.mjs` is a different film. 11.40s, light,
  five beats, and three whole scenes gone.** The question that asked *how*, the
  four windows that did the work and the cursor that took the computer off him
  are all cut. What is left: the mark arrives with `CHATGPT 6 ASTRA IS HERE`
  typing under it, the effort slider walks to Max, a chat panel types `not using
  ai for your business yet? your competitor already does` while the voice reads
  the same line, the mark comes back bigger and he thinks `future. here.`, and
  the signal tears. **83 guards green at 12fps and at 60 with the shutter open.**
  Out to `demo/out/post18-light-1080x1920.mp4`. The long version is The
  eighteenth clip in `demo/README.md`; what is worth carrying forward:
  - **The voice only pass ran before a browser was opened, and it is worth
    keeping as a habit.** Three lines at three deliveries each, measured, then
    the picks laid on one clock with the silences in — 7.46s of sound, and the
    film's own length known before a frame existed. The shipped deliveries are
    0% / -4% / 0% with the pitch up on the two outer lines, which is post11's
    rule: the shape carries the register, not the speed.
  - **A face this file asks for is only half the job: the module fits its own.**
    `lib/captions.mjs` measures the float style's cards in Space Grotesk 700 and
    solves a size from that. Manrope 800 is a different width for the same
    string, so the module's size was the wrong one and the widest card would have
    crossed the box. `capRefit` measures the cards **as they render**, at a probe
    size, and solves again, dividing by the same `maxScale` the module divides by.
    lib untouched: a rule and a measurement in the clip.
  - **`over` measures the pill from the plate's centre line, `beside` from the
    zone's right edge**, and on a 204 css px pill that is 95 px of difference.
    Even so `future. here.` costs 40.2 css px of head shift, 7.4% of the frame,
    derived off the pill's own measured width and its worst spring frame. **The
    em width was an estimate and the render corrected it**: the guard compares
    the rendered pill against the solve on every run, and it caught 7 px.
  - **A box written `left:0; right:0` reports the frame's own edges back to the
    safe area check**, and it also makes a fit divide by the box rather than by
    the ink. It happened twice more in this file — the title and the slider's
    label — after post14 wrote it down about its end card. `width:max-content`
    with a centring translate is the fix, every time.
  - **`planMascot` refused a mark by a hundredth of a second and said so.** The
    module's own guard, in the planner, before a browser opened: `curious` needs
    1.24s before `delighted` and the slider gave it 1.23. He goes curious a
    breath before the mark starts moving now, which is what a head does when
    something is about to happen and is also what buys the room.
  - **The brand's only accent is green and this clip has blue in it**, by the
    brief: a caret, a gauge arc and a send button inside the picture of somebody
    else's input box. The token is declared inside the panel's own block, nothing
    outside reads it, and it leaves when the panel does. The slider's fill stayed
    green for the same reason the blue is confined — the brief named colours for
    the panel and not for the control.
  - **Open:** 11.40s against a brief that asked for nine to ten, with the two
    cuts that would fix it named in the run log; he stands 7.4% left of centre for
    the whole film; and the loudness loop stops at -15.4 LUFS for the third clip
    in a row, because the pass that would reach -14 costs more limiting than the
    allowance.

- **First cut 2026-09-05, superseded by the one above: `demo/post18.mjs`, less asking and
  more giving it a job. 23.11s, 1080x1920, light only, out to
  `demo/out/post18-light-1080x1920.mp4`. The first one with four windows doing
  the work around him, the first with a gaze layer, and the second that puts
  somebody else's mark on the screen.** Somebody else's model ships, the effort
  slider walks to max, a question that asks *how* becomes an instruction that
  says *what*, four windows open one per noun around him, a cursor takes the
  computer off him, and he gives up and looks at you. **79 guards green at 12fps
  and at 60.** The long version is The eighteenth clip in `demo/README.md`; what
  is worth carrying forward:
  - **The brief's clock did not survive the read and the copy was cut rather
    than the delivery.** Seven scenes and "about sixteen seconds" against five
    lines that measure **20.29s of speech on their own** at the house narrator's
    own pace. The copy came down by a third to 13.79s and the film still runs
    23.11, because the brief's clock did not count the silent slider beat, the
    retype that finishes 1.6s after its line, the cursor that keeps working, or
    the thought and its hold. **A read pushed to fit is a hurried read** —
    post14's lesson — so the copy is what moved. Every second of the difference
    is named in the run log and the one cut that buys a whole beat rather than a
    fraction of one is dropping the slider scene.
  - **The silence after a line is a function of what the picture has to do in
    it.** post14 typed its gaps because both were breaths; three of these four
    are a picture finishing. `buildVoice` takes a `gapFor` and is handed the
    beats laid down so far, so each silence is derived off the same numbers the
    picture is drawn from and floored at the line's own written gap. The scene
    boundaries are written once as functions of the beats and both `gapFor` and
    the constants read the same expressions. `word(beat, 'work')` asks a beat
    for a word **by name**, so a rewrite that moves a word throws rather than
    quietly moving a beat.
  - **The gaze is one layer and it is the performance.** Six things to watch and
    none of them is in the state table, because a state is a pose rather than a
    direction. A list of page points with a time and a duration each, eased on
    the house curve, composed onto `mascotFrame`'s own card and eyes the way
    post17's wink is composed onto its lid: an eye offset in grid units, a tilt
    in degrees and a lean in css px, all three off one vector and all three
    capped. **Two targets are functions of time** — the knob and the cursor are
    moving while he watches them — and a target being looked away from is frozen
    at the instant the look began, so a blend is between two points rather than
    between a point and a chase. **The durations are the acting**: 0.34, 0.28,
    0.22 and 0.18 across the four windows is the brief's "getting quicker each
    time" and it is those four numbers and nothing else.
  - **A block that spans the frame reports the frame back to you.** The title
    was `left:0;right:0`, so its spans measured 540 css px, the fit divided 300
    by 540 instead of by the ink, and it rendered three sizes too big and 140
    device px outside the safe area. `width:max-content` with a centring
    translate is the whole fix and the max-width comes off while the probe is
    up. post14 wrote this down about its end card; this is the same fault in a
    second place and it will be a third one day.
  - **`over` measures from the plate's centre line and `beside` from the zone's
    right edge, and that is the difference between fitting and not.** A one word
    pill hung `beside` a centred head crossed the right safe line by 24 device
    px; the same pill asked for as `over-right` lands with 106 to spare and
    nothing moved. The brief's three word thought would need 70 css px of head
    shift at `BUBBLE.size` and 70 px left of centre is under a window, so the
    thought is one word and the trade is printed on every run.
  - **A window arrives on the pop curve and the pop curve overshoots.** Half a
    per cent past one puts a box whose edge is exactly on the safe line 0.3
    device px outside it for three frames. They sit one css px inside it now.
    The panel does not need it because nothing springs its scale.
  - **Two guards are walked on every frame rather than sampled**, and that is
    what caught `surprised` putting his ink into the two top windows for eight
    frames: the frames that fail are the ones a state is at its peak on, and a
    sampler at eight a second walks straight past them. The windows moved up
    twelve css and he moved down ten; the walked worst gap is now 12.75 css px.
  - **The end card is the one held run in the film and it is a named
    exception.** Every other clip ends on a dark page with a phosphor breathing
    under the wordmark, which is what carries the last second past the liveness
    guard. On white there is nothing to breathe, and the brief says "hold, end".
    So the run after the card has arrived is exempt by name and by frame, and
    every frame before it is checked exactly as it was: 0 repeats in 265 frames.
    Inventing a drift under a card that is meant to be still would be worse.
  - **Somebody else's mark, cropped rather than altered.** The file is 3840x2160
    with the knot centred on white and no alpha; the page is `#ffffff` exactly,
    so the white it is drawn on is the white it came with. It is a background at
    `cover` on a square box, which crops the canvas the file ships with and
    cannot distort it. The header is read in node, because a background has no
    natural size to report.
  - **No new sound recipes and no music.** 64 cues, nine kinds. `agreeing`'s own
    ding is **declined** so the one ding in the film is the completion chime,
    where a yes is what it means.
  - **Open, and worth watching on a phone before it is called deliberate:** the
    top third of the frame is empty for the last six seconds, from the moment
    the question shrinks away on `less asking` to the end. And the loudness loop
    stops at -15.2 LUFS rather than -14, because the pass that would reach the
    target costs more limiting than the 5 dB allowance.

- **Second cut 2026-09-04: `demo/post17.mjs` holds the answer half a second
  longer and he is alive under it. 7.41s, 88 guards green at 12fps and at 60
  with the shutter open.** Three things changed and all three are in
  `demo/post17.mjs` only; lib is still untouched.
  - **`BUBBLE.hold`'s 0.90s ceiling is worked around without touching a number
    the module owns.** From `BUB.leaving` to the cut the file hands the page the
    module's **own last fully up bubble frame** again — read once, a ten
    thousandth before its own hold ends, so it is the pill at rest rather than
    the first frame of an exit — and lets the rest of the face run on real time.
    That is not a freeze: during its own hold the module holds `o` and `sc` at
    exactly those values and nothing else, so the extra frames are the same
    still pill for the same reason the first 0.90s are. `bubbleTime` is the one
    function that does it. **Proved twice**: the numbers are checked at full size
    and full opacity on all 84 frames, and the *rendered* pill is measured either
    side of the join and does not move by a hundredth of a css pixel. Fully up is
    1.40s now, first dot to cut 1.88s.
  - **`HOLD_EXTRA` is one constant and the film follows it.** The fault, the end
    card and `SECONDS` are all derived off it, so 6.91s became 7.41s and nothing
    else had to be retimed by hand. The `RUN` window moved by the same half
    second rather than being widened to hide the change.
  - **The alive layer, and two of its three channels are one sided on purpose.**
    A tilt to 2.0 degrees, a drift of 3.0 css px across and 2.6 down and a breath
    to x0.988, on four incommensurate periods, ramped in over 0.45s — composed
    onto `mascotFrame`'s own `card`, which is the seam the module documents and
    is what `headRect` reads, so the head that is measured is the head that is
    painted. **The drift only goes down and the breath only shrinks because
    `crownReach` hung the dots five px off a crown it walked before any of this
    existed**, and a move that raised the crown would spend a gap the module
    already paid for. Both are written as `(1 - cos)/2` so they start at rest and
    never change sign. **The tilt is free**, because the plate is a circle and
    `headRect` says the axis aligned box of a rotated ellipse is the ellipse — it
    reads entirely through the eye line.
  - **The wink is one channel over one window**: the right eye's lid, on the
    module's own `btk.shut` and `btk.open` written as the beziers they are. The
    right eye because that is the side the thought is on, 0.18s after the pill
    lands, and **the 150ms hold at the bottom is what makes it a wink** — the
    module's own blinks hold 30 to 60.
  - **The seed now carries a second constraint**, and it is a search constraint
    rather than a guard: no idle blink within 0.18s of the wink, because a blink
    under a wink is both eyes shutting and the joke is gone. Seed moved 3610 →
    390, and the beat's slow blink came back at 360ms.
  - **`getBoundingClientRect` cannot measure an eye once the card is turned, and
    that is `headRect`'s own lesson in a second place.** The first cut read the
    two eyes off client rects and reported the open eye as 92% open on every
    frame of the wink — which is not the lid, it is the tilt: a client rect is
    the axis aligned box of a turned shape, so at two degrees a 13 by 4.4 iris
    reports a box a tenth taller than itself. `getBBox` plus the lid's own
    `translate` is exact and rotation cannot touch it; the device px come off the
    plate's client rect, because a circle does not get wider when you turn it.
    Measured that way the winking eye shows **0 device px of itself and the other
    21.1**.
  - **A guard about a composed frame has to say whose move it is measuring.** The
    first version capped the composed card's one frame step at 1.2 css px and
    failed at 1.52 — which is mark two's own entrance, the module's move, not the
    alive layer's. It reports both now and guards the layer's own, at 0.14.
  - **The wink is silent and that is a gap rather than a decision.** 1.7s from
    the pop on the pill to the second fault with nothing in the bus.

- **Built 2026-09-04: `demo/post17.mjs`, the seventeenth clip, message for the
  next generation. First cut 6.91s, vertical, dark only, and the first one whose
  whole clock is cut from one spoken line.** A chat panel fades in on a black frame
  and types itself `message for the next generation?` while the voice reads it,
  the panel slides 120px down out of the way, a hard fault hands the mascot the
  frame above it, he takes a beat and one slow blink, and thinks `don't come`.
  The second fault takes the lot and puts the wordmark up. Out to
  `demo/out/post17-dark-1080x1920.mp4`. **71 guards green at 12fps and at 60
  with the shutter open**, and the second cut above is what ships. The long version is The seventeenth clip in
  `demo/README.md`; what is worth carrying forward:
  - **The typing is cut to the read word by word, and that is the whole file.**
    `typePlan` is handed the voice's own word list and lays each word's
    characters across **that word's spoken span**, so the letters of
    `generation` appear while `generation` is being said and the space in front
    of a word lands a third of the way into the silence before it. post14 spread
    a line evenly across a read window; this is the same idea done properly, and
    it is what makes the picture and the sound one event rather than two laid on
    the same grid. The tokens are matched against the engine's own words and a
    mismatch throws.
  - **Everything downstream of the voice is derived.** The read's sound lands on
    `VOICE_AT` and the typing, the slide, the fault, both marks, the thought,
    the end card and `SECONDS` all follow it. A slower read moves the whole film.
  - **21.4 characters a second is the honest cost of that**, three times post14's
    7.1. It does not read as a machine, because it is fast inside a word and
    still between them, but it reads as text arriving rather than as a person
    typing. The lever is the take's rate and it costs 0.3s, which is over the
    brief's ceiling, so it was not taken and the number is printed on every run.
  - **`lib/mascot.mjs`'s `thought: 'over'` is used by a clip for the first time**,
    asked for as `over-right` because the derived side is a fact about which
    corner he is standing in and he is standing in neither.
  - **`BUBBLE.hold` is 0.90 and that is a ceiling on a single bubble, not a
    choice.** `bubbleAt` writes `min(BUBBLE.hold, room)`, and the other spelling
    — `bubbles: [...]` — runs the quick profile and caps at 0.30. The first cut
    stopped there and said so; **the second cut re-serves the module's own last
    fully up frame for another half second**, which is how a clip gets past that
    ceiling without changing a number every clip with a bubble in it shares. See
    the second cut above.
  - **A pill is never centred over a head and cannot be.** The module puts the
    first dot on the plate's own centre line and the pill's near corner 26 css
    px along the row from it, and **no head size fixes it**: `crownX` scales with
    the head and the dots, the gaps and the pill do not. `don't come` is 190.7
    css wide, 196.4 at its spring, so off a dead centre head it reaches 22 css px
    past the right safe line. The clip moves him 26.42 css px (53 device, 4.9% of
    the width) left rather than putting the punchline in the platform's button
    column. `OFF_X` is derived off the measured pill and its worst spring frame,
    printed on every run, and the guard re-measures the rendered cluster.
    **Whether that is the right side of the trade is Einz's call.**
  - **A single `bubble` is placed by the module at `settled + 0.12`**, so a mark
    carrying a thought cannot also carry a beat in front of it. Two `neutral`
    marks is what buys the beat and the slow blink, and the second entrance
    reads as a breath rather than as a state change.
  - **The whole blink has to fit the window, not just its start.** The first cut
    searched on the blink's own `t` and found one whose lid was still coming back
    up as the first dot climbed. He blinks once more under the thought and that
    one is deliberate — a face holding one expression for 0.9s with nothing
    moving on it is a still frame with a pill over it.
  - **A liveness signature has to be gated by what is drawn, and it has to know
    about the layers node does not write.** The film opens on 0.20s of black with
    only the vignette on it, which is a css animation, so the signature would
    have swept a run of frames it could not see. The mascot's channels now only
    count on frames he is on, and the vignette carries a `phosphor` brightness
    this file writes.
  - **The panel is post14's, redrawn dark**: its own ground and a hairline rather
    than page ink on page paper, because `--fg` on a near black page is a light
    slab. Type at 26 css px, 38 device of cap, wrapping to exactly two lines, and
    the height worked out of its own parts rather than typed. The model name is
    gone and a mic and a waveform are drawn in css in its place.
  - **No camera, and that is a decision.** Nothing in the brief moves the frame.
    The panel slides on its own transform, which is an element moving inside a
    still frame — the opposite of a camera move, and the right shape, because
    what slides is the thing making room.
  - **No new sound recipes.** Eight `key` ticks off the typing's own list, one
    soft `popDeep` thud on the slide, two `glitch` faults, and `mascotCues`' own
    `pop` — **taken** here where post16 declined its `ding`. No music, which is
    the brief.
  - **The video-review pass found three things and none of them a fault**: the
    0.90s hold, the 4.9% off centre and the typing speed, all three of them the
    brief's own two halves pulling against each other. The review is
    `demo/out/review-post17.md`, gitignored with the rest of `demo/out/`.

- **Built 2026-09-03: `demo/post16.mjs`, the sixteenth clip, one small change.
  5.70s, vertical, dark only, and the first one whose camera pulls back instead
  of pushing in.** A client asks for one small change, then forty seven more:
  he is alone in the middle of a black frame with one glowing pill beside his
  head, he brightens and agrees, a bass hit snaps the camera out and the screen
  is covered in forty seven identical pills, he goes flat, blinks once slowly,
  and two faults take him and then them. Out to
  `demo/out/post16-dark-1080x1920.mp4`. **65 guards green at 12fps and at 60
  with the shutter open.** The long version is The sixteenth clip in
  `demo/README.md`; what is worth carrying forward:
  - **`lib/camera.mjs` snaps out with no change to the module.** `by` is a
    multiplier, so 0.68 is a snap out for the same reason 1.22 is a snap in, and
    **the anticipation is negative**, because the wind-up for a pull back is a
    push in and the module writes the wind-up as `1 - anticipate`. z 1.50 to
    1.02, which opens the frame by 2.16 in area. Nothing in lib was touched by
    this clip at all.
  - **`resolveCamera` clamps `start.z` to the plan's own zoom window and says
    nothing about it.** The `clamped` list it keeps is about legs. A ceiling of
    1.40 quietly rendered a start of 1.50 at 1.40, which put the resting zoom at
    0.95 instead of 1.02 and sized the whole label field against a frame 42 css
    px wider than the one that ships — nothing failed, the numbers were just
    wrong. **A number a library may adjust is a number to read back**, and the
    guard now does. This is a lib behaviour worth knowing rather than a lib
    fault: clamping a target into a stated window is the right thing for it to
    do.
  - **`__cam.edges()` and `minZoomFor` are the wrong instruments for a
    composed frame whose content is bigger than the rig.** Both answer "the rig
    is the stage's size, so z under 1 shows a border", and this clip's zoom goes
    to 0.970 with no border in shot because the label field is laid out past the
    page on purpose. `__p16.fieldBox()` measures the field's own rendered
    envelope instead, on three sides — the fourth is the caption band's and has
    to be clear black.
  - **`SHAKE_END` and `SNAP_END` are two moments and the second one is the one a
    layout is sized against.** `btk.pop` carries a snap past its mark and back,
    so between the knock ending and the camera stopping the picture is still
    wider than it ends up. Sized off the knock, the "tightest frame" came out 22
    css px wider than the resting frame and the core rect it produced was wider
    than the frame it is meant to fit inside.
  - **A screen band is not a page band once there is a camera.** The reserved
    caption band is in screen css px and its page extent is a union walked over
    every frame a caption is up for. `planMascot` is handed `band: null` for the
    same reason — the module checks a bubble against page space.
  - **Holding the caption swap 0.20s past the hit is worth 98 page px of field
    height.** A caption up during the snap's wind-up, when the camera is still
    pushed in, drags the band's page union 98px down the page. Held until the
    frame has nearly settled, the type goes from a 22.4 device px cap to a 25 —
    and the hit knocking the words off and the new ones landing as it settles is
    the better beat anyway.
  - **Forty seven labels fit at a 25 device px cap, which is under
    `BUBBLE.minCap`'s 32, and that is the one house floor this clip crosses.**
    The argument is that the copy is read once at a 32.2px cap for two and a half
    seconds before the field exists, so the field is recognition rather than
    reading. The trade is printed on every run: 32 labels would be 27.6 and 24
    would be 37. **`FIELD.n` is one constant and everything follows from it** —
    if 25 reads too small on a phone, change that number and nothing else.
  - **The field is two populations and only one is counted.** 47 core labels
    fully inside the frame on every frame after the camera stops, plus a bleed
    ring outside them so the snap's overshoot and the shake never open an empty
    edge. The ring goes left, right and down and **not up**: a row of pills in
    the strip above the words is clipped by the top of the picture at rest and
    off frame entirely during the wind-up, so it arrives out of nowhere.
  - **The field crosses the platform safe area on purpose**, which is post15's
    argument about the bug walking in through the left margin in a new place: the
    field is a texture rather than copy, every side of the frame is outside the
    safe area, and a field pulled inside the margins is a rectangle of labels in
    a black border. 19 of the 47 are fully inside it and that number is in the
    report. Every piece of copy that has to be read — the caption, the hero pill,
    the end card — is inside and guarded separately.
  - **Front or back is derived from whether it would show.** A label is drawn in
    front of him only if it reaches his ink, and never if it reaches his eye or
    brow ink. No share, no coin flip. The first cut used his ink plus the whole
    sixty pixel glow reach and put a third of the field in the front layer.
  - **A third seed search, on the same discipline as the blink's.** How much of
    each pill you can see is rasterised and measured, and the layout's seed is
    the best of five hundred. Five hundred returns the same 65% a hundred and
    forty did, so that is the grid's own ceiling at this overlap rather than a
    seed nobody has found — the levers are `overlapY` and `FIELD.n`, and the
    `overlapY` sweep is in the file.
  - **A flat one-frame-move ceiling cannot tell a snap from a cut.** post15's
    eighth-of-a-frame guard fails a snap out for being a snap. The test is
    `lib/camera.mjs`'s own, the one `shakeEnv` is proved with: sample four times
    as densely and the worst step must come down. 86.7px at 60Hz against 22.9 at
    240Hz, a ratio of 0.264 where a held signal reports 1.000.
  - **No new sound recipes.** Five cues out of `chirp`, `popDeep` and `glitch`,
    and the two bleeps are the same voice pointed two ways — rising for the yes,
    nearly flat and falling for the blink. `mascotCues`' `ding` is **declined**
    and the report says so. **0.91s of the mix is left empty on purpose**, right
    after the bass hit, which is where a trending sound's own drop lands and
    where the picture is holding still. Einz adds it in the app.
  - **The video-review pass found one real fault and it is fixed.** The hold
    between the camera stopping and the first fault was 1.64s over a completely
    static field, a quarter of the clip on one frame. The first fault moved from
    4.98 to 4.70, the clip went from 5.98s to 5.70, and the blink's seed search
    moved with its window and came back with a slower blink than it had. The
    review is `demo/out/review-post16.md`, which is gitignored with the rest of
    `demo/out/`.

- **Closed 2026-09-02: the two open lib faults post15 wrote down, both fixed in
  `demo/lib/` and neither in a clip.**
  - **`lib/mascot.mjs` takes `thought`, one option with four values.**
    `beside` is the module's own placement and the **default**, so nothing that
    did not ask changes. `over` derives the side, the start point on the crown
    and the three lifts **from `pos`**, the way `TURN.bias` is derived, and
    `over-left` / `over-right` name the side outright. The dots start on the
    plate's own centre line one gap above the crown and climb at fifty degrees
    to the pill, smallest nearest the head, pill at the top and toward the
    middle of the frame from any corner. The clearance over the crown is walked
    off the plan's own frames rather than picked, because a hop drives the head
    into a dot above it where it only slides past one beside it.
  - **`lib/transitions.mjs` reads the tail off the window in real time.** A
    reverse grow no longer opens on one frame of the new paper with the field at
    nothing over it. Forward grows are identical to the bit.
  - **Both are proved rather than claimed.** The mascot's beside branch hashes
    identical — css, markup, page plan and sixty frames — across three
    placements and both themes; 1666 forward grow frames at 240Hz are identical;
    `lib/mascot.mjs test` and `lib/transitions.mjs test` are green with eight
    and three new checks in them.
  - **Re-rendered on the fixes:** `post15.mjs` at 12fps and at 60 with the
    shutter open, 48 guards green both ways, and `rig-test.mjs` at 60, 22
    guards green. Nothing else in `demo/` was touched or needed to be.

- **Built 2026-09-02: `demo/post15.mjs`, the fifteenth clip, the bug. Second
  cut, 6.73s, 1080x1920, dark only, out to
  `demo/out/post15-dark-1080x1920.mp4`.** The first clip built on
  `lib/camera.mjs`. A bug drawn in code walks in low from the left, he watches
  it, it stops under him, **he eats it** — a small rise, a lunge down over it,
  the head squashing on the landing and the bug gone under his ink, then three
  chewing pulses with his eyes shut and a satisfied bob. `crunchy`. One glitch
  and the end card. **48 guards, all green at 12fps and at 60fps with the
  shutter open.**
  - **The first cut did the middle with the circle grow and that was the wrong
    joke.** He grew until his fill covered the frame, the world went white for a
    second, the same shape ran backwards and the bug was gone. It worked and all
    45 guards were green. But **a grow is a scene change** — using one here says
    "and then something else happened", and asks the audience to infer the
    eating from a hole in the picture rather than watch it. It also cost 2.71s
    of a seven second clip. The eating costs 1.64s and the clip is now 6.73s,
    inside the brief with room.
  - **The depth of the lunge is derived rather than chosen.** The bug has to be
    gone under his ink on the frame it is switched off or the switch is a
    disappearing trick, so the file walks the lunge down in half pixel steps
    until the head's drawn ellipse contains every corner of the bug's drawn ink,
    then adds a margin: **needed 88px, goes 93**. The same containment is
    measured a third time on the rendered frames and comes out at **0.81 of his
    plate's own circle**, where 1 is the edge.
  - **The frame the bug goes is a ceiling, not a rounding, and the contact is
    0.10s because of it.** post13's correction in a new place: `round(2.51*12)`
    is 2.50, which is before the head lands. And a contact shorter than one
    frame of the pass being rendered has no frame inside it at all, so there is
    no frame the switch can safely happen on. The guard checks both rates rather
    than whichever one is running.
  - **The eyes were the note and the fix is in two places.** `curious` opens one
    eye to 1.80 and the other to 1.10 on purpose and it is right for that beat;
    it is wrong four hundred milliseconds later and a frame at 1.70s read as a
    broken face. So the beat after it is a **clean symmetric narrowing** written
    in the clip rather than `unimpressed` — whose lids are symmetric but which
    brings brows, a side eye and a lean away — and the pair is **levelled**
    toward its own mean in scale and toward the more closed of the two in lid.
    Measured: from the frame the bug stops to the cut, **0.0001 of scale and 0
    of lid** between them.
  - **Shut is a line, not a lid, and a rendered frame is why.** The module's
    blink is the lid arriving over the eye, which is right for sixty
    milliseconds; hold it for a second and the face is not a face with its eyes
    closed, it is a face with no eyes — the first chew came back a blank plate.
    So the eye is squashed to 0.26 of its own height instead, leaving **4.6
    device px** of the same ink an open eye is drawn in, and the lid gives way
    as the squash comes in.
  - **Every write to the module's face is one directional**, which is
    `lib/transitions.mjs`'s discipline in a new place: the lid is pushed toward
    shut and never open, and the eye scale is only ever made smaller. A push
    toward shut cannot fight a blink, because a blink closes further and the max
    keeps it closed.
  - **The bite and the chew are one transform on `#m-zone`**, which the module
    writes nothing to. post14 placed the mascot through that seam, transitions
    grew him through it, this file lunges and chews through it. **Nothing in
    `lib/` is touched**, which was the brief.
  - **Two things `lib/mascot.mjs` does not have and two clips in a row have
    wanted**: a symmetric narrowing that is not `unimpressed`, and a closed eye
    that can be held. Both are written by hand here.
  - **He was moved off the corner in a third pass: 154px up and 85px in against
    the module's own placement, of which only the first 84 up is the bug's
    lane.** The rest is composition — pinned to the corner the frame above him
    is dead — and **the camera's centre follows the pair** rather than staying
    where they used to be, or the move would have put him dead centre. It takes
    20 of the 85 and 34 of the 70; it cannot take more, because the rig is the
    stage's own size and at the push's zoom the centre lives in 248..292 on x
    or an edge comes into shot. He ends up about 60% across and 66% down.
  - **Everything downstream followed on its own**, which is what the derivations
    were for: the lane is the lowest his ink gets plus the clearance, the bug's
    stop is the plate's own centre, and the walk's speed is the distance over
    the time. The walk is 276 page px at 190 px/s now, 8 strides instead of 11,
    and the gait period went from 7.8 frames a cycle at sixty to **10.6**, which
    reads better and was not the point of the move.
  - **The thought bubble is fixed, in the module, and this clip no longer places
    it at all.** It had been hand placed three times here — off the right, 116
    css px past the edge of the screen; mirrored to the left, which stopped
    fitting the moment he moved toward the middle; and above him with the lifts
    rewritten as a diagonal, which still started the run off his right
    **shoulder** so the line went sideways out of the side of his head before it
    climbed. `lib/mascot.mjs` now takes `thought: 'over'` and derives **the
    side, the start point on the crown and the three lifts from `pos`**, the way
    it already derives `TURN.bias`. The clip says `THOUGHT = 'over'` and writes
    nothing else about the cluster. **Beside the head is still the default**, so
    every clip already in `demo/` renders the same bytes, and that is hashed
    rather than asserted.
  - **The crown the run starts from is measured, and the first render of the fix
    is why.** The cluster is a sibling of the card and does not move when he
    does, which beside him is fine and over him is not: `delighted` lifts him
    12.5 grid units, the arrival curve overshoots by a tenth and the drift adds
    another, so **15 css px of head went through a dot hanging five above the
    resting crown** and the small dot came back half swallowed. `crownReach`
    walks the plan's own frames, over the frames a thought is up for only, and
    the head's closest approach is now **5.03 css px against a floor of 5**.
  - **The bite and the chews are silent now.** Their four `crunch` cues are out
    because Einz is putting his own sound on that stretch, and a synthesised
    placeholder under a real one is two takes of the same beat fighting each
    other. **The recipe stays in `lib/sfx.mjs`** — the next clip that eats
    something will want it. What ships is the footsteps, the bubble pop and the
    glitch, and a guard asserts nothing at all is heard between the bug stopping
    and the bubble.
  - **The mix is -25.5 LUFS and that is deliberate.** Ten events, one of which
    is thirteen decibels over the rest; the ceiling won by 10.30 dB and the only
    way to go louder is to squash the cut. The stretch that would carry the
    level is empty on purpose and Einz's layer goes on top of it.
  - The bug, the gait, the reserved band, the glitch and the end card are the
    first cut's and are unchanged. **The gait is driven by distance rather than by time** — worst
    planted foot movement 0px — and the footstep ticks fall out of it, so they
    spread out and stop on their own as he decelerates.
  - **At twelve frames neither the gait nor the lunge can be judged**, and that
    is the preview's sampling rather than the animation. Both are judged on
    strips of stills a sixtieth apart, written on every run to
    `demo/out/verify-post15/gait/` and `demo/out/verify-post15/bite/`.
  - **`lib/transitions.mjs` applies `tail` to the end of the window in real
    time now, and the reverse grow's wrong frame is gone.** The tail is the fade
    the field leaves on at the end of a forward grow, where it is invisible
    because the background is already that colour; read off the shape it landed
    on the frame the theme flips, so frame zero of a reverse was the new paper
    with the field at nothing over it. **The fade reads `local` and the colour
    walk still reads `u`** — the colour is the shape's business and has to
    mirror, the fade is the window's. Forward, the two are the same number and
    the arithmetic is unchanged to the bit: **1666 forward frames at 240Hz across
    three placements and both directions are identical to before**. Backwards a
    reverse now has no tail at all, which is correct — the field is already gone
    by then, handed over on the frame the disc covers exactly.
    **`rig-test.mjs` was re-rendered on the fix**, 22 guards green, and the
    white frame at 7.600s is gone.
  - **Two new voices in `lib/sfx.mjs`, now twenty one sounds**: `tick`, a foot,
    at -37 dB, the quietest thing in the file; and `crunch`, a bite. Nothing
    existing in the module moved. The clip plays the tick and not the crunch —
    see above.
  - **Two harness lessons, both of which cost a run.** A frame is only captured
    once per repaint — two `Page.captureScreenshot` calls with nothing written
    between them block forever under paused virtual time. And the vignette is
    load bearing: hiding it in the `--bug` mode stopped the compositor and the
    next virtual time budget never expired.

- **Built 2026-09-02: `demo/lib/camera.mjs` and `demo/lib/transitions.mjs`, two rig
  upgrades, plus `demo/rig-test.mjs` that proves them.** Both modules are new, both
  are self tested without a browser, and **nothing shipped was retrofitted onto
  either of them.** `lib/mascot.mjs`, `lib/pictograms.mjs`, `record.mjs` and
  `post9.mjs` are byte identical, which was the brief and is checked with a diff
  rather than claimed.
  - **`lib/camera.mjs` is the camera every clip has been writing its own copy of.**
    `cx`, `cy`, `z` on legs between targets with house easing; an idle drift on two
    incommensurable periods per channel, refused at plan time if the ratio is close
    to a simple fraction; a snap zoom with anticipation, a hit and `btk.pop`'s own
    overshoot as the settle; and a shake channel that is **separate from the glitch
    shake and deliberately the opposite kind of thing** — the glitch is a function
    of the frame index so the shutter cannot smear it, this is a function of `t`
    because a camera being hit is real motion and should blur. A target is a
    selector, a rect or a point. Two modes: `site` carries the page's own zoom
    floor of 1.0 and ceiling of 1.09 and throws if a plan leaves them, `free` is
    for composed frames where neither reason applies.
  - **`lib/transitions.mjs` is the circle grow, and the whole trick is that his
    face inverts.** He swells until his fill covers the frame, the field takes over
    at the exact frame he covers, the theme flips while the frame is one flat
    colour, and he is gone. Or the same shape backwards and the background shrinks
    into him. It works both ways because **his face in one theme is the other
    theme's paper** — 6 of 255 apart one way, 11 the other — and `mascotInk()`
    lifts both blocks out of `mascotCss()` at run time so the module fails loudly
    if that ever stops being true. Plus the cross: off one side, back on the other,
    in a new place.
  - **`lib/mascot.mjs` did not need a scale channel and did not get one.** `#m-zone`
    is the mascot's own box and the module writes nothing to it, which post14
    already established. The grow is a transform on that zone, so at its first
    frame it **is** the head, to the pixel. The three things written after
    `__mas.apply()` are all multiplies toward zero of numbers the module already
    put there.
  - **`demo/rig-test.mjs` renders 12.00s in both themes**, to
    `demo/out/rig-light.mp4` and `demo/out/rig-dark.mp4`, with a push, drift, a
    snap, a shake, the grow both ways and the cross. **22 guards, all green, at
    12fps and at 60fps.** The measured number the brief asked for: **he fills
    1080x1920 at a zone scale of 16.53 from the bottom right corner**, which puts
    the rendered plate at **3999 x 4103 device px** against the frame's own 2203px
    diagonal. Log at `demo/out/rig-final.log`.
  - **The 12fps preview was reviewed frame by frame and found three faults the
    guards were green on**, which is the fourth time that has happened here. All
    three are fixed and all three now have a number watching them. See the
    decisions.
  - **Not wired into any post.** The two modules exist so the next clip has a
    camera and a signature transition without inventing either on the day.

- **Built 2026-09-02: `demo/post14.mjs`, the fourteenth clip, the fable 5.1 news
  flash. Second cut, 13.03s, 1080x1920, light only, out to
  `demo/out/post14-light-1080x1920.mp4`.** The first clip that is about somebody
  else's release rather than about us, **the first that puts somebody else's mark
  on the screen**, and **the first that moves the mascot.** He is big in the
  middle of an empty white page with `fable 5.1 out` in a thought bubble, the
  signal tears twice and he is back in his corner at his ordinary size, the
  anthropic logo glitches in at the top and turns once over the rest of the clip,
  and three facts are read warm and quick over captions in the middle of the
  frame. Then the wordmark, stacked on three lines, centred on the middle of the
    frame, **with no address under it** — the one thing this clip drops that
    post11, post12 and post13 all carry, and the note under Decisions says why.
  - **The end card is the wordmark and nothing else.** No `theboringtek.com`
    under it: at 18 device px of cap it was the only thing on the card asking to
    be read that could not be. See the decision.
  - **It shipped at 9.95s and a fix round took it to 13.03s.** Five notes, and
    every one of the 3.08 seconds is one of them: the opening holds 2.52s with
    the thought on the ordinary bubble profile and **three** dots climbing a
    diagonal to it, the read comes back to a person's pace with a real breath
    between lines, the mark is 216 device px, **a chat panel under it types
    itself a line**, the end card is centred on the middle of the frame, and he
    has five marks and four thoughts instead of four and two. See the decisions.
  - **The 60fps master with the shutter open is rendered and green**, 1.37 MB,
    log at `demo/out/post14-final.log`. Both cuts were reviewed frame by frame
    on the 12fps preview first: the first found four faults, the second one, and
    all five were fixed before their masters. The review is at
    `demo/out/review-post14-light-1080x1920.md`, which is gitignored.
  - **The logo is `demo/assets/anthropic-logo.png`, placed as an image and never
    touched** — no crop, no filter, no recolour, no redraw. **It is the clay
    version, not a black one**, and that is a call the brief's own two
    instructions forced. See the decision.
  - **`demo/assets/anthropic-logo.png` is NOT committed.** It is somebody else's
    trademark in a public repo and that is Einz's call rather than an
    implementation detail. `.gitignore` is untouched, per the rule, so the file
    shows as untracked until it is decided either way. `post14.mjs` throws with a
    named error if it is missing.
  - **`lib/mascot.mjs` is untouched.** The two placements are a transform on
    `#m-zone` that this clip adds at the id level, and the thought is re-anchored
    for the opening beat with a translate on `#m-bubble` — the module writes
    nothing to that element except its visibility.
  - **It ships at -15.5 LUFS rather than -14, and the run says why**: the limiter
    ceiling won over the loudness target. post10 and post12 both shipped under
    target for the same reason.
  - **Not posted, and it has no posting pack.** This one has a timing question the
    others do not: it is about somebody else's release and it is worth less every
    day it sits.

- **Built 2026-09-01: `demo/post13.mjs`, the thirteenth clip, the yap. 4.98s,
  1080x1920, dark only, out to `demo/out/post13-dark-1080x1920.mp4`.**
  post12 is a joke about a robot; this is a joke about us. The mascot talks and
  talks and gets tired of his own talking. **He has no mouth, so a hand stands in
  for one** — it sits low on the face where a mouth would be and yaps under a
  `when ai is tired of humans` label while his eyes go from alive to a slow blink
  to narrow to drooped to one of them rolling off to the side looking for an
  exit. Then post12's tear takes him and the label off and puts the wordmark up
  for 1.40s.
  - **The hand is `lib/mascot.mjs`'s, not the clip's, and it is opt in and off by
    default.** `hand: true` on the plan and `yap: true` on a mark. It is anatomy,
    and a clip that drew its own mouth would be a clip that invented a face.
  - **Every clip written before it renders unchanged, and proving that turned out
    to be two claims needing two proofs.** The module is byte identical — 9,063
    frames of `mascotFrame` at sixty across thirty plans, plus every plan, css,
    markup, page plan and report. The *render* is not byte identical and never
    was: this renderer varies run to run. See the decision.
  - **Three new voices in `lib/sfx.mjs`, now nineteen sounds**: `mumble`, `sigh`
    and `annoyed`. The mumble is a formant synth rather than a filtered tone, and
    one syllable fires per yap cycle, for exactly as long as that cycle's mouth
    is open. Nothing existing in the module moved.
  - **The brief's five eye beats went onto three marks**, because a fourth mark
    is 1.06s of floor the clip does not have. The slow blink is the one beat that
    could not go where the brief puts it and it comes off the idle layer with a
    chosen seed instead. See the decision.
  - **4.98s against a four to five second brief**, which is the first clip in a
    while to land inside its own length brief. `-16.2 LUFS integrated, true peak
    -1.6 dBFS`. **The 60fps final rendered green with the shutter open at four
    subframes to a frame.**
  - Outstanding: a posting pack, and the fact that **the hand reads as a mouth
    rather than as a hand** — it passes the brief's own acceptance test and the
    review says the rest plainly.

- **Built 2026-09-01, then reworked twice the same day: `demo/post12.mjs`, the
  twelfth clip, the sting. 5.55s, 1080x1920, dark only, out to
  `demo/out/post12-dark-1080x1920.mp4`.**
  The shortest clip here and the first that is a joke rather than an argument:
  the mascot alone in the middle of a black frame, **on screen from frame zero**,
  says hi, holds still for six tenths of a second, farts, giggles, the signal
  comes apart under the laugh and a hard tear takes him and the label off and
  puts the wordmark on the screen for a second and a half. **The only writing on
  it before the wordmark is a two word label, `ai fart`, over his head** — no
  read, no captions, no bubble. **The 60fps final rendered green with the shutter
  open at four subframes to a frame.**
  - **The third pass, 2026-09-01, two notes from Einz: cut the opening, put the
    label on.** Only `demo/post12.mjs` was touched, which is what was asked for.
    - **The fade up out of black is gone and `neutral` went with it.** He is at
      full on frame zero, at rest on the idle layer, and every beat after moved
      up the same 0.50s. **5.55s rather than 6.05.** The mark had to go because
      `planMascot` costs it 1.06s of clock before anything else may start, so
      half a second could not come off the front while it was there — the
      arithmetic allowed eight hundredths. See the decision.
    - **`ai fart` sits over his head from frame zero to the frame he is cut on.**
      Michroma with the wordmark's glow, lower case, 27.96 css px which is **57%
      of the wordmark's type size**, on a line derived off the plan. It takes the
      same shake and rgb split he does, and it is cut on his frame.
    - **Two guards were reading the wrong thing and were fixed rather than
      loosened**: the centring check read a drifting frame, and the giggle took
      any upward turning point as its first apex. See the decision.
  - **The second pass, 2026-09-01, three notes from Einz and what each cost.**
    The fart read as a buzz, the transition into the wordmark was not glitchy
    enough, and the end card wanted another second. All three are done. Only
    `demo/post12.mjs` and `demo/lib/sfx.mjs` were touched, which is what was
    asked for.
    - **The fart is a pulse train now, not a tone with a tremolo on it**, and it
      ships as `sputter`, the two burst variant. Four variants exist and all four
      are written to `demo/out/p12-fart/` on every render. See the decision.
    - **The glitch builds: three stutters at 32%, 52% and 78% heat, then a hit
      that is 0.37s rather than 0.23.** They ran at 4.22, 4.34 and 4.46 and the
      third pass moved them to 3.72, 3.84 and 3.96. The duty ceiling
      got a named exception, this scene only. The white flash did **not** go up
      and there is now a guard saying there is exactly one white frame in the
      clip.
    - **The end card holds 1.40s rather than 0.40.**
  - **`lib/sfx.mjs` grew four voices and was sixteen sounds after this clip**: `hi`, `fart`,
    `giggle` and `glitch`. They are the first four in that file that stand in for
    a character rather than for paper, ink, metal or a mechanism — `chirp` opened
    that door in post11 and these walk through it. Nothing existing in the module
    moved and no existing clip changed.
  - **`lib/mascot.mjs` was used exactly as it is and was not edited.** The clip
    rewrites `plan.box` to centre him and asks for `size: 148`, which puts the
    plate at 277.5 device px against the module's own 220 to 280 window — larger
    than his 240px corner size, and 280 is the ceiling, so that is as large as
    he is allowed to be.
  - **The hi was built twice**, as a synthesised two tone bleep and as an edge
    tts "hi" pitched up and bit crushed, seven takes of the latter. **The bleep
    ships.** See the decision below; the numbers are at the bottom of
    `post12.mjs`.
  - **The mix now allows the limiter 1.5 dB** and lands at -18.7 LUFS, true peak
    -1.7 dBFS. It allowed nothing on the first cut and landed at -18.4; the
    second cut's extra sounds pushed it to -20 and the trend was the wrong way.
    See the decision.
  - **The live site did not change**; **no existing post file was edited**;
    **no dependency was added** — the list stays `puppeteer-core`,
    `ffmpeg-static` and `gsap`. **Not posted anywhere and there is no posting
    pack yet.**

- **Built 2026-08-30, rebuilt across five more rounds to 2026-08-31:
  `demo/post11.mjs`, the eleventh clip, the explainer. 47.03s, 1080x1920, the
  read in the file.** It renders in two variants, light and `--dark`, out to
  `demo/out/post11-light-1080x1920.mp4` and `post11-dark-1080x1920.mp4`.
  **The 60fps finals landed green on 2026-08-31 and are no longer on disk** — the
  fifth round overwrote them with its 12fps previews and they want a re-render.
  See the two state bullets directly below. **The empty top
  of the frame is no longer empty** — it carries the four opening scenes, the
  report beat and the chalkboard now, all in the same card box the site is filmed
  in. **The live site did not change**; **no existing post file was edited**;
  **no dependency was added** — the list stays `puppeteer-core`, `ffmpeg-static`
  and `gsap`. **Not posted anywhere and there is no posting pack yet** — caption,
  hashtags and a track are still owed.
  - **The 60fps finals, 2026-08-31, both green with the shutter open at four
    subframes to a frame — and both are gone.** 47.03s each. They were what sat
    in `demo/out` until the brain removal below, whose 12fps previews wrote to the
    same two paths and overwrote them. **The clip renders to one path per variant
    every time**, which is the pipeline working as designed, and it has now
    happened in both directions on the same day: the previews these finals
    replaced went the same way.

    What is on those paths now is the **12fps preview pair from the brain
    removal**, 3.96 MB light and 4.54 MB dark, logs at
    `demo/out/p11-light-noslot.log` and `p11-dark-noslot.log`, both ending
    `all checks passed.` What was on them, for the re-render to be compared
    against:

    ```
    demo/out/post11-light-1080x1920.mp4   6,686,538 bytes   6.69 MB   1.14 Mbit/s
    demo/out/post11-dark-1080x1920.mp4    8,048,476 bytes   8.05 MB   1.37 Mbit/s
    ```

    Their logs survive, at **`demo/out/final-light.log`** and
    **`demo/out/final-dark.log`**, both ending `all checks passed.`;
    **`demo/out/final-status.txt`** carries the four exit codes,
    `LIGHT=1 DARK=1 LIGHT2=0 DARK2=0` — the first pair is the run that hit the
    duty ceiling and the second is the re-run after the exception below.
    **Neither final was ever reviewed**, and the finals a review would now be of
    do not exist: **both variants want `--blur` run again** before anything is
    watched or posted. The docs pass before them was `f953e58`.
  - **The drawn brain came out of scene three on 2026-08-31 and an empty slot is
    holding its place.** Committed as `b00dd32`. It did not read as a brain: a
    generated silhouette with a fissure and twelve folds fanning off it is a
    drawing of *something*, and a viewer working out what a shape is has stopped
    reading the words under it. `brainSvg` and its styles are gone and **nothing
    replaced them** — **einz is supplying his own image for that slot**.

    So the box it stood in stays, at the size it stood in, drawing nothing:
    `.sc-slot`, **236x205 css px** off the new `SC_SLOT`, plus the same 20px
    `SC_GAP`. `fitScene` measures the slot exactly the way it measured the
    drawing, which is the whole of why `BUT I AM / BUSY` did not move: still
    **71.2px, 100 device px of cap, fitted on height**, same place, same glow,
    same 0.18s glitch entrance. Dropping a picture in moves nothing else on the
    frame. The slot is **deliberately out of both ink selectors** — an empty box
    that reported a rectangle would leave the safe area check guarding a border
    with no letters anywhere near it.

    **The one retime is the cue word, `but` to `some`, and it is not a taste.**
    The words landed on `but`, 1.34s into line three, because that is where the
    line turns from what they know into what they have not got — and it worked
    only because the drawing carried the head of the beat on its own. Without it
    the same cue leaves the card box holding **nothing from 4.99s to 6.35s**,
    which is the exact fault this layer exists to remove. `some` is the first
    word of the line, so the words are up from the first frame it is spoken on,
    and it is still keyed to a word through `wordAt` rather than to a number.
    Measured on the light preview: the card box is blank for **one 12fps frame**,
    the one between the crossfade finishing and the entrance firing, darkest
    pixel 234 of 255 — about two frames at sixty.

    Read frame by frame on both themes across 4.90..7.80. The type sits slightly
    low with clean air above it and reads as a composition on white and on black,
    not as something that failed to load. **Both 12fps previews green.**
  - **The `days` scene carries a named exception to the glitch duty ceiling, and
    it only showed up at sixty.** `SC_GLITCH.dutyMax` is 30% and stays 30% for
    everything else; `SC_DAYS.dutyMax` is **40%**, declared on that one scene,
    threaded through the block into the state and out to the guard, which falls
    back to the global for every block that does not name its own. Committed as
    **`59a0ee4`**.

    The fault on `1/2 / DAYS` is 140ms hard plus a 160ms stutter, **0.30s inside
    a 0.90s appearance, which is 33% by construction**. At twelve frames a second
    that quantised under the ceiling and every preview passed; at sixty it did
    not. **A ratio guard on a short window is a different guard at a different
    frame rate**, and that is the part worth keeping.

    It is an exception rather than a new global because the ratio measures the
    wrong thing here. The ceiling enforces "never continuous" on the four opening
    scenes, where the glitch is a scatter of 70 to 140ms bursts through two and a
    half seconds — there a high ratio really does mean the thing never stops
    faulting. The days are **one deliberate fault at the head of the beat and
    then 0.60s of clean type**, and a ratio cannot tell "a third, scattered
    throughout" from "a third, all of it at the front, then clean". What actually
    holds the beat honest is the absolute length check on the fault, `tvLen`
    against 0.34s; this number only has to be loose enough not to fight it. The
    measured duties at sixty: business 19.9%, why 15.2%, busy 16.3%, small 8.7%,
    report 3.7%, **days 32.7%**.
  - **The opening is four type scenes in the card box, one per line.** `BUSINESS`
    at 74.1px, `WHY I / NEED / AI?!` at 118.2px, an empty reserved slot over
    `BUT I AM / BUSY` at 71.2px on the word `some`, and `ONE / small / THING` at
    121.1 and 41.2px — the size joke, guarded to stay under 55% of the words
    either side of it. **104 to 170 device px of cap** against a 32 floor.
    Everything drawn in code: no asset, no third font.
  - **The handover window is `planSite`'s own card fade record, taken by
    reference**, so all four crossfades and the one cut in the clip are the same
    0.52s and moving `CARD_LEAD` moves them together. Inside it the opacity moves
    over a **0.16s complementary exchange at 60%**, so the sum is always one:
    never a blank frame, and only one frame of the preview mixed. The first cut
    faded over the whole window and put `BUSINESS` and `NEED` on top of each
    other, both legible, for six frames.
  - **The glow is 8/22/48px of white at 28/15/7% on dark and nothing at all on
    light**, because a white glow on a white page is nothing and a black one is a
    drop shadow the brand bans. **The glitch is a length in seconds quantised to
    whatever frame grid is rendering**, computed once per output frame and held
    across every subframe, so a burst is the same duration at twelve and at sixty
    and the shutter cannot smear it. It runs **10.7% to 18.8% of each scene's
    frames** against a 30% ceiling, and the ceiling is a guard.
  - **The five orange heads say `AI` and have no faces.** They had five poses off
    `lib/mascot.mjs`'s own state table; two eye slabs on a head rendered at 128
    device px are five px of ink each and read as a rendering fault rather than
    as a face, so the eyes, the brows and the pose table all came out. `AI`
    measures **80.0 device px of cap on a 127.5 device px plate**, two and a half
    times the floor, so the heads did not need to grow. The orange is `#d1600a`,
    **the same on both themes**, 3.90:1 on white and 5.17:1 on black.
  - **The domain read was wrong three times and the fourth is a full stop.** The
    complaint was that line five reads `boring tek dot com`. The waveform said
    why and it was not what it looked like: the `the` **was** there and loud
    enough — 153ms at -17.6 dB, two under the loudest word — but the gap in front
    of it was **15ms, the same as every other gap in the run**, so `go to the`
    came out as one unstressed cluster and the name the ear heard started at
    `boring`. A grouping fault, not a level one. `go to. the boring tek, dot com`
    puts **503ms in front of it and brings it up to 0.8 under the loudest word**,
    because after a full stop the synthesiser restarts the phrase. Spoken copy
    only: nothing draws the stop, and the caption became two cards, `go to` and
    then `theboringtek.com` on its own. **It cost 0.58s and that is the only
    retiming any of the four rounds caused.**
  - **The report beat is a fault and then a page built out of blocks.** `1/2` over
    `DAYS` lands on the word `one` — on `one` rather than `days` because `days`
    left the type 0.56s to be read — under the hardest glitch in the clip: **four
    torn bands, 8.5px of split, a noise burst with scanlines and one white
    frame**, 140ms hard then a 160ms stutter. The tearing is four copies of the
    type each clipped to its own band, stacking exactly at rest. Then the page
    **slides in from the right on `DRIFT` over 0.42s**, clipped to the card box so
    it enters the frame, and **builds**: heading, three lines and a green check,
    75ms apart, each dropping 14px with its own squash, settling at **-4
    degrees**. White paper on both themes; the check is the site's own light
    accent at 4.15:1 against it.
  - **The offering is a chalkboard mind map.** Five drawn pictograms were dropped
    — five line drawings in a row read as an icon set rather than an argument.
    `website` is boxed in yellow in the middle and six things pop in around it
    with arrows into the centre. Nothing in it is a clean vector: ovals overshoot
    their own ends, lines bow and overshoot, the box is four crossing strokes, and
    one fractal noise displacement filter makes the strokes chalky and roughens
    the letterforms so the type reads as written **without a handwriting face**.
    **Three of the six land on their own spoken word through `wordAt`; the other
    three sit at a named fraction of the gap between the anchors either side**,
    so they move when the read moves. Chalk is white on the board and ink on
    paper; the centre yellow is `#ffd34d` on dark and `#a8780c` on light, for the
    reason index.html carries two greens.
  - **Two sounds are synthesised in `post11.mjs` itself**: a stuttered digital
    fault and a stick of chalk, built out of the same seeded noise and
    exponential decay every recipe in `lib/sfx.mjs` is built out of, and handed
    to the bus through the same `renderSfx` report. **Nothing in the shared
    module moved and no file was loaded.** The day a second clip wants a glitch
    is the day it moves.
  - **Nineteen takes, one per line**, 2.01 to 5.57 words a second against a flat
    2.3, gaps measured on the waveform. Delivered at **-14.2 LUFS / -1.1 dBTP**
    with **no music** in this pass, which is Einz's call and gets a track later.
  - **No dead air, and it is a guard rather than a claim.** `HOLE_MAX` is 1.20s
    for any hole that is not the typing one, against a longest of 0.95s;
    `TYPE_TAIL_MAX` is 1.50s for how far the typing hole may run past the last
    keystroke, against 1.33s. The check mark has to be drawn while a word is
    being said. Both numbers are tighter than the single 1.70 they replaced.
  - **It is one composed page rather than post9's four passes.** The site is an
    **iframe served from the same origin** inside a clipped card and the camera is
    a transform on the iframe element, so the mascot, the captions and the footage
    are on one clock with no cuts. The nav is excluded by the crop rather than by
    a promise. **0 sampled frames with the nav in the card, 0 with the subline in
    it and cut.**
  - **A camera that is a transform can be lied to by a scroll, and it was.**
    `element.focus()` scrolls **every scrollable ancestor**, across the frame
    boundary, so focusing a form field scrolled the clipped card by 251px. Pinned,
    and the render now compares the rendered window against the camera it wrote on
    every sample.
  - **The form is really filled in and the send is really a send**: six real taps,
    the page doing its own routing, the copy re-rendering in russian and latvian
    with the ticks surviving, and **exactly 2 posts intercepted**.
  - **`document.fonts.check(font, text)` said Space Grotesk can set `привет`, and
    it cannot.** Measured rather than asked for now, with a latin control. The
    pill drops to the mono stack at **36 device px of cap** against a 32 floor.
    **No fourth font family was added.**
  - **The guards added across the four rounds**, and every one fails the render:
    the handover window is the card's own record by identity and the two ends of
    every exchange are the same numbers; no opening scene survives the card's
    arrival and no frame inside the opening is empty; the layer's z-index is under
    the card, the captions and the mascot, **read back off the page**; `AI` clears
    the cap floor and its box corner clears the plate's radius, with the failure
    message saying to grow the heads rather than shrink the letters; every chalk
    label clears the cap floor; the days land on their word and the white frame is
    on the fault frame; block zero is the page riding the slide; the six blocks
    are in order; the three spoken chalk nodes are on their words and no two nodes
    arrive within 0.18s; nothing in this layer shares the box with the site card
    or the end card; and **a torn band and a noise frame have to have actually
    been rendered**, not merely planned.
  - **Two bugs those guards found.** **`Math.round` where the visibility test uses
    `>=`**: burst frames were placed with `round` while a block becomes visible on
    `ceil(on * fps)`, so a burst whose fraction was under a half fired on the
    frame **before** its own block appeared, and three of five shapes rendered
    with no glitch at all. Both use `ceil` now. And **a bounding rect is not a
    scale**: the `AI` cap was first measured through the svg's bounding rect, and
    every head is rotated a few degrees, so the rect is the axis aligned box of a
    rotated square — up to eight per cent wider. It reported the letters eight per
    cent bigger than they are. The scale comes off the text element's own
    **`getScreenCTM`** now, where `hypot(a, b)` is the scale with the turn divided
    back out.
  - **Open and undecided: the site's own wordmark crops to `BORING / TEK` at
    15.00s.** It is a frame in the middle of the camera travelling from the lockup
    down to the form, not a resolved shot — the `cleared` logic holds the shot
    **endpoints** clear of the h1 and a travelling shot has to pass through it.
    Pre-existing, found by a frame by frame review, and **nobody has decided
    whether it is a fault or a camera move.** It reads as a camera move; it is
    written down here so the decision is made rather than forgotten.

- **The mascot render has not been reviewed at 60fps yet, 2026-08-30.** What has
  been looked at is the **light theme at the twelve frame preview**, plus still
  frames from a turn sweep and from every state. **The dark theme has not been
  reviewed at all**, and neither theme has been watched at sixty. The 60fps pass
  was running when this was written. Every guard in `demo/mascot-test.mjs` and
  every check in `node lib/mascot.mjs test` is green, but green guards are not a
  review — post9 shipped a first cut with every check passing and a phone showed
  captions inside tiktok's chrome. **Do not treat the mascot as signed off.**
  When the pass lands, watch both clips end to end and run
  `skills/video-review` on each before anything goes near a post.
- **The mascot is a rig now, 2026-08-30, and he exports himself.**
  `demo/lib/mascot.mjs` turns a still face with a blink on it into a character:
  a card, two eyes with independent position and both scales, two lids, two
  brows, a shadow and a glow, every one of them a channel on one gsap timeline,
  and **seven named states** with an entrance, a hold that has its own idle, and
  an exit. The api is marks: a second on the clock, a state to be in from then,
  and optionally a bubble or a turn. **He turns**, a flat three quarter turn on one
  number from -1 to +1 with every value between them real, resting at 0.35 into the
  frame from a single config value that flips with the corner he stands in. **The
  bubble is the site's thought bubble**, an outlined pill with two trailing dots.
  **Two themes pass the same guards** and one call switches them. The
  second half is `demo/mascot-export.mjs`, which renders each state as a
  standalone 1080x1920 overlay clip with **real alpha**, plus flat mp4s on black
  and on white, with the mascot already in its corner so it drops onto a phone
  video in canva with nothing to reposition. `demo/mascot-test.mjs` is the
  twenty second strip that judges the seven against each other, rendered light
  and dark. **The motion core is `lib/pictograms.mjs`'s** and **no dependency
  was added** — the list stays `puppeteer-core`, `ffmpeg-static` and `gsap`.
  **Nothing on the site changed**: `index.html`, `CNAME`, the language stubs,
  `assets/`, `robots.txt`, `sitemap.xml` and `.gitignore` were all untouched,
  and no existing post file was edited. **Two things want Einz's word before
  they go anywhere near the page: the brows, which are anatomy the mascot spec
  does not have, and the head being a rounded rect whose default radius draws
  the circle the site ships.** See Decisions.
- **`skills/video-review` takes a url as well as a path, 2026-08-29.** It used to
  refuse anything that was not a file on this disk. It now fetches an
  `http`/`https` link with **yt-dlp** into `demo/out/downloads/dl-<hash of the
  url>/`, runs the same extraction and the same seven item checklist on the
  downloaded file, and **deletes the media once the review is written** via
  `--cleanup`. **Local file mode is byte for byte what it was**: nothing is
  fetched, nothing is deleted, and it works with no yt-dlp installed at all.
  **No npm dependency was added** — yt-dlp is a binary on PATH, `demo/`'s list
  stays at `puppeteer-core`, `ffmpeg-static` and `gsap`, and **`.gitignore` was
  not touched** because `demo/out/` is already ignored whole, which is why the
  downloads live under it. **Only `skills/` changed**: `index.html`, `CNAME`,
  `robots.txt`, `sitemap.xml`, the language stubs, `assets/` and `demo/` were
  all untouched. **It has since run on a real link**, which found and fixed one
  bug and added one folder. See Decisions.
- **`skills/video-review` can hear, 2026-08-29, and the no transcription rule is
  gone.** It was a hard non-negotiable and it was written for our own clips,
  where the script is typed into the post file before the voice is synthesised.
  That reasoning does not hold for a clip we did not make, so Einz lifted it.
  **`skills/video-review/transcribe.mjs`** is the second script in the skill: it
  extracts the audio with the same `ffmpeg-static` binary, mono 16k, and takes
  the words from **the clip's own captions first**, then **a whisper api and only
  if a key is already in the environment**, then **nothing at all**, which it
  writes down as no transcript was possible and why. **It never guesses.** Output
  is `transcript.md` and `transcript.json` beside the frames, and the md carries
  an **aligned table, one row per sampled frame**, with an empty `on screen`
  column the reading half fills in, so the spoken words and the card words end up
  on one clock. The extracted audio is deleted at the end of the run. **No npm
  dependency was added.** See Decisions.
- **`demo/refs/` added 2026-08-29, and it is gitignored.** Format breakdowns of
  other people's short video, written with `skills/video-review` so we can steal
  a structure without recreating a clip. **The folder is ignored whole**: the
  notes are ours, the thing they are about is not, and the media they were read
  from is deleted after every review. First entry is a 43.72s youtube short on
  ai tooling, read from 88 frames. **`.gitignore` was edited for this, on Einz's
  direct instruction**, which is the one thing that lifts the do not touch rule.
- **Sound added 2026-08-29 to `demo/post5.mjs`, and the picture did not move.**
  post5 shipped silent on 2026-08-26 and was planned that way. It now carries
  **the read, ten servos, six pops, seven chirps and a ding inside the mp4** —
  **10.50s, 60fps, 1080x1920, 630 frames, 0.57 MB**, delivered at **-14.9 LUFS /
  -1.0 dBTP** with no music. **The live site did not change**; nothing outside
  `demo/` was touched.
  - **The frame is byte for byte the frame that was signed off, and that is
    measured rather than asserted.** The run's state json — every box, every
    fit, both safe area samples, `gazeJump` 0.582 at 2.38s, `blinkJump` 0.296 at
    3.05s, 7 blinks, 10 turns, 10 holds, `eyeMax` 5.63 — is **identical** to the
    silent cut's. The video encode is unchanged and provably bit deterministic.
    Chrome's jpeg capture is *not* reproducible run to run, so decoded pixels
    differ between any two renders: the 26 Aug silent cut against a control
    rendered today off the **unmodified** code is 58.34 dB PSNR, and the original
    code against the sound cut is **59.17 dB**, which is closer. The change sits
    inside the capture noise. See Decisions.
  - **The mascot answers in beeps and says no words**, which is the design and
    also the only version of it that is funny. The house voice reads the
    question on screen; the mascot replies in chirps built from the bubble's own
    copy. The tenth sound in `lib/sfx.mjs` is `chirp` and it is the first one in
    the set that stands in for a character rather than for a thing.
  - **Two mix lessons came out of it and they apply to every clip after it**: a
    sample peak limiter does not hold a true peak, and past a point more gain
    buys *less* loudness. Both are in Decisions and both are now in the file.
  - **`demo/README.md` carries it** as The fifth clip's sound. **Not posted
    anywhere, on any platform.**
- **Built, fix passed and then word changed 2026-08-28: `demo/post10.mjs`, the
  tenth clip, "the rage clip", the first one that is dark and the first with no
  accent in it anywhere.** **13.17s, 60fps, 1080x1920, 790 frames, 4.11 MB
  (2.50 Mbit/s)**, the voice and four slices of music in the file, rendered with
  the shutter open at four subframes in **8.1 minutes**. **The live site did not
  change** — `index.html`, `CNAME`, `robots.txt`, `sitemap.xml`, the language
  stubs and `assets/` were all untouched. **The source is on `main` and public:
  the first cut in `576f947`, the fix pass in `d5c4ae6`, the ai cut in
  `f38553b`.** No push changed a file a visitor sees. **Not posted anywhere,
  on any platform.** An earlier version of this file said it went out on
  2026-08-28 and that was wrong; corrected 2026-08-28 on Einz's word. **The
  release version is the ai cut, `f38553b`**, and the posting pack under
  Socials is waiting for an actual posting rather than describing one.
  - **The line changed before it ever went out: group 2 says `ai`, not `a
    machine`.** `you said ai could never be`. Group 2's take was resynthesised
    at the same `-10%` / `-4Hz` and the other three came back cached, so three
    quarters of the voice is the audio that was signed off. See Decisions.
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
    attack**. Delivered at **-14.2 LUFS / -1.0 dBTP**, limiter pulling 3.6 dB
    over three passes. Safe margins **191 left, 933 top, 165 right, 936 bottom**
    against floors of 140, 180, 140, 220, sampled at every card's settled frame
    and at every one of the six glitches' hottest frames. **17.7% of frames
    carry a glitch** and every channel is at rest outside a window: 0 faults.
  - **`skills/video-review` has now run six times on this clip, twice per cut.**
    The fix pass's preview found the end card holding; its final found nothing
    the guards had not; the ai cut's two found nothing at all. Reviews at
    `demo/out/review-post10-preview.md` and `demo/out/review-post10.md`, both
    gitignored and both rewritten for the newest cut, so the findings are under
    Decisions as well.

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

#### post12 — built 2026-09-01, reworked the same day, not posted yet

`demo/post12.mjs`. 5.55s, 1080x1920, dark only, one output path overwritten
every run. The full write-up is in `demo/README.md` under The twelfth clip; this
is what a later session needs and cannot re-derive.

- **The beats.** He is on at full from frame zero, at rest, with `ai fart` over
  his head. `agreeing` at 0.64 (the hi), `surprised` with `turn` +0.30 at 1.88
  (the fart), `delighted` at 3.05 (the giggle). Three glitch stutters at 3.72,
  3.84 and 3.96 under the laugh. The hit, the cut of both him and the label, and
  the wordmark all land on 4.06. The end card holds 1.40s. End at 5.55.
- **The label.** `ai fart`, lower case, Michroma with the wordmark's glow, 27.96
  css px which is 57% of the wordmark's, 280 device px wide, sitting on 191 css
  px. On from frame zero, one position the whole clip, cut on his frame, and it
  carries the same shake and rgb split.
- **The sounds, and every time came from somewhere else.** `hi` at 1.11, which
  is `agreeing`'s own declared ding offset. `fart` at 1.84, which is the puff's
  birth, four hundredths before the head moves. `giggle` at 3.33, 3.72 and 3.83,
  which are turning points in the drawn head's own y. `glitch` at 4.06, the cut.
- **The mix is peak normalised, not loudness targeted, and that was a decision.**
  -18.7 LUFS integrated, true peak -1.7 dBFS, with 1.5 dB of limiting on the one
  transient that sets the peak. Hitting -14 would have asked the limiter for 3.5
  dB on a bus that is nine transients and nothing else. See the decision below.
- **The fart ships as `sputter`**, the two burst variant. `parp`, `puff` and
  `wobbler` are the alternatives and all four land in `demo/out/p12-fart/` on
  every render, regenerable and gitignored, so a person who can listen can
  overrule the measurements they were chosen on.
- **It runs 5.55s.** The first cut was 5.05 against a four to five second brief,
  where the overshoot was the states' own entry, hold and exit floors in
  `planMascot`; a second went on the end card and was asked for, and half a
  second came back off the front when the fade up was cut.
- **Owed:** caption, hashtags, platform. Nothing decided.

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

#### post5 — built 2026-08-26, plan locked 2026-08-27, sound added 2026-08-29

The clip is rendered and, since 2026-08-29, **it has its sound inside the mp4**.
Everything below is the plan Einz set, not something measured here, except the
cue timings, which were checked against the render and carry a correction, and
the sound, which was built and measured on 2026-08-29 and is marked where it
departs from the plan.

**It has not been posted.** An earlier version of this heading said it posts
2026-08-28; nothing went out.

- **Caption:** `what is the most boring part of your business? tell us in comments. we
  will tell you if ai can fix it.`

  One caption, not one per platform. It is the first of these clips that asks the
  viewer a question, so the comments are the point rather than the watch time, and the
  caption is written to earn a reply rather than a view. No dashes, no exclamation
  marks, lowercase throughout.
- **Hashtags: not written yet, on any platform.** The house rule below still stands —
  exactly three lowercase per platform — so this is three tags times three platforms
  still owed, not a decision to skip them.
- **Music: none, and that reverses the plan.** The plan said classical, low, under
  everything, unnamed. The 2026-08-29 pass dropped it: ten and a half seconds now
  carry a read, ten servos, six pops and two chirp phrases, and a bed under that
  is a fourth thing competing rather than a floor. **This is a subtraction from
  the recipe in this clip only** — the recipe itself is unchanged for the clips
  that have not been built.
- **A voice line, and it reverses the other half of the plan.** The plan said no
  narrator at all, because the mascot searching the room is the performance and a
  voice over it would explain a joke that works by being silent. That reasoning
  survives and the design honours it: **the mascot still says no words.** What
  reads the line is the house narrator reading the **question that is already on
  the screen**, which explains nothing the viewer cannot see, and it stops
  1.11 seconds before the bubble arrives so it never speaks over an answer.
  - `en-US-AndrewNeural`, the `calm` default in `lib/voice.mjs`, rate `-8%`,
    pitch `-2Hz`. Nine words, timings from the engine.
  - The script is `STATEMENT.join(' ')` rather than a second copy of the line, so
    the read cannot come to disagree with the frame.
  - **Placed by one number**: the first word lands on 1.15s, the frame the
    statement stops scrambling. The read runs 1.15 to 3.39 **measured on the
    waveform**, not on the word list.
- **The mascot answers in beeps.** One chirp phrase per bubble, built from that
  bubble's own copy: the note count is the reply's word count with a floor of
  three. `tell us.` gets three notes over 0.39s from 4.60; `we will fix it.` gets
  four over 0.52s from 7.00, a tone lower and in wider steps so it spans more
  than an octave where the first spans a fifth, and it lands on the set's `ding`
  because that line is the clip's answer and an answer stops.
- **Twenty three effects, and the mix**: 10 servo, 4 pop, 7 chirp, 1 popDeep,
  1 ding. **-14.9 LUFS / -1.0 dBTP**, 8.2 dB of limiting at its hardest, effects
  18.8 dB under the voice at their closest in all 96 windows a word is being
  spoken in. No music track.
- **Servo cues, and this is now settled in code rather than in prose.** The list
  this section used to carry — `1.00 1.85 2.60 3.40 4.05 4.85 6.45 7.25 9.75
  10.50` — is the times each turn **finishes**. The servos in the file sit on the
  **starts**: `0.55 1.35 2.15 2.95 3.60 4.35 6.10 6.75 9.30 10.20`. `post5.mjs`
  derives both from `EYE_KEYS` and prints the windows as pairs, so the label that
  used to say "servo cues" over a list of end times is gone. The warning below is
  kept because it is the reasoning, and because any other clip cutting to an eye
  track has the same trap waiting for it.

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

  **Both consequences are handled in the file as of 2026-08-29.** The servos are
  placed on the window starts, and the tenth one at 10.20 fits its whole 90ms
  before the last frame — what reaches 10.50 is a tail 46 dB down rather than a
  chopped sound. The misleading label is gone: the run prints the windows as
  pairs. The render itself never changed for any of this.
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

#### post10 — built, fix passed and word changed 2026-08-28, not posted

`the rage clip`, 13.17s, vertical, dark, the voice and four slices of licensed
music inside the mp4. Everything about the render was measured here; **the pack
below is Einz's plan and nothing here is a report that any of it went out.**

**Not posted, on any platform.** This entry said "posted" for part of
2026-08-28 and it was wrong; Einz corrected it the same day. **The release
version is the ai cut, `f38553b`** — 13.17s, with `you said ai could never be`
in group 2. Nothing carrying `a machine` was ever published, so there is no
older caption live anywhere and nothing to reconcile.

- **Voice: `en-US-AndrewNeural`**, the `calm` default taken to rate `-10%`,
  pitch `-4Hz` — a shade slower and lower than post6 and post7's `-8%`/`-2Hz`,
  for the delivery this clip wanted. 26 words in four takes.
- **The pack.**

  ```
  caption (all four platforms)
    the ai heard everything you said about it

  tiktok      #ai #boringtek #fyp
  youtube     #ai #shorts #boringtek
  instagram   #ai #boringtek #reels
  x           the caption as tweet text, no tags
  ```

  - **One caption everywhere, and it is the first time.** post6 and post7 both
    wrote X a different sentence from the other three. This one line carries on
    all four, which works because it is not a call to action: it is the clip's
    premise said once, from the outside. `the ai heard everything you said about
    it` is not in the script, and that is the point — the voice is the thing
    talking and the caption is somebody else noticing. It moved from `the
    machines ... about them` to the singular when the script did, so the caption
    and the line name the same thing.
  - **`#boringtek` is new and it is on all three tagged platforms.** post6 and
    post7 ran `#ai #aitips` as the constant pair with the third doing the
    platform's register. This pack keeps `#ai` and swaps the second slot for the
    brand, leaving the third to the platform: `#fyp`, `#shorts`, `#reels`. That
    is a different spine from the one two clips in a row established, so it is
    worth watching rather than assuming it is the new default — **it is one
    clip, not a rule yet.**
  - **X carries no tags**, which is the rule post6 set and post7 kept.
  - Three lowercase tags per platform, no dashes, no exclamation marks,
    lowercase throughout. The house rule holds.
- **No music was added in any app.** The sound is burned into the mp4 — the
  voice, three 0.5s stabs and a 2s outro, mixed to -14.2 LUFS / -1.0 dBTP, which
  is what every one of these platforms normalises to. **Adding a platform track
  over it would duck our own mix and put a second piece of music under a clip
  whose silences are the style.** Worth writing down as a rule for any clip that
  ships its own sound: post6, post7, post9 and post10 are all in that class now.
- **The script, verbatim**, because the captions are cut from it and the cards
  are marked against it — regenerating the voice from a reworded copy would move
  every card:

  ```
  fuck you, i am gonna become every single thing
  you said ai could never be
  and you will use me every single day
  and love it
  ```

  The screen censors the first word to `fu*k` and the voice does not. Four
  groups, four takes, 0.50s of measured silence between them with a music stab
  and a hard glitch in each gap.

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

The clip's audio signature. Same recipe on post1 and post2, and it carries to post3
and post4 unless something in the scene changes. post4 names the music — Vivaldi,
Spring — where the line below only said "classical"; that is a choice inside the
recipe, not a change to it.

**post5 was built on this recipe and then departed from it on 2026-08-29, in its
own scope only.** It dropped the music and added a read of the question, and it
added a sound the recipe never had: **the mascot answering in chirps**. The rest
of the recipe held — servo on the eye turns, pop on the bubbles, ding on the
close. The recipe below is unchanged for the clips that have not been built; see
post5 under Socials for what that clip actually carries.

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

- **`demo/post19.mjs` is the nineteenth clip and the second dark one built on
  post17's panel.** 8.65s, 1080x1920, 60fps, out to
  `demo/out/post19-dark-1080x1920.mp4`. It needs five untracked files in
  `demo/assets/`: `logo-claude.png`, `logo-gemini.png`, `logo-chatgpt.png`,
  `logo-grok.png`, `logo-copilot.png`. Each one is decoded once per run for its
  alpha bounding box, so the row is fitted by ink rather than by canvas, and the
  safe area check reads the ink too. Full write up under The nineteenth clip in
  `demo/README.md`.

- **`demo/post14.mjs` is the fourteenth clip and the light one.** 13.03s,
  1080x1920, 60fps, out to `demo/out/post14-light-1080x1920.mp4`. Four firsts
  between them: somebody else's mark on the screen, the mascot moved rather than
  planned in one place, **a picture of a ui drawn in code that types itself**,
  and a clip about somebody else's release. It needs
  `demo/assets/anthropic-logo.png`, which is untracked. Full write up under The
  fourteenth clip in `demo/README.md`.

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
- **`demo/post5.mjs`**, added 2026-08-26, **sound added 2026-08-29**: the fifth
  clip, `what is the most boring part of your business?`. Ten and a half seconds
  at 60fps, **vertical only and with the read and the mascot's beeps inside the
  mp4**, out to `demo/out/post5-1080x1920.mp4`. `DEMO_FPS=12` previews it,
  `--encode-only` re-mixes and re-encodes. Frames under `out/frames-post5`, state
  under `out/post5-1080x1920.json`, verify stills under `out/verify-post5`, the
  mix at `out/post5-mix.wav`. About ninety seconds end to end, the fastest of the
  clips because it is the shortest. It imports `lib/voice.mjs` and `lib/sfx.mjs`
  and neither `lib/captions.mjs` nor `lib/pictograms.mjs`: it has no captions and
  no scene layer, which is the point of the library being four pieces.
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
  **13.17s at 60fps, vertical only, voice and music inside the mp4**, out to
  `demo/out/post10-1080x1920.mp4`. `--blur` opens the shutter for the final and
  is off for the timing pass, `DEMO_FPS=12` previews it, `--encode-only`
  re-encodes from kept frames. Frames under `out/frames-post10`, subframes under
  `out/subframes-post10`, state under `out/post10-1080x1920.json`, verify stills
  under `out/verify-post10`. **8.1 minutes with the shutter open at four
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
- **`demo/post11.mjs` renders two variants since 2026-08-31: `--dark` gives the
  same clip on the near black page.** Same script, same beats, same camera, same
  marks, same sound: **three attributes change and nothing else.** `data-theme`
  on the composed page's `<html>` (index.html's own light and dark token blocks
  are already inlined by `captionCss`, so the caption ink, the card hairline, the
  end card and the tap ring all follow it); `theme` into `planMascot`, which is
  what turns the phosphor glow on; and `bt-theme` written into the iframe's
  localStorage before index.html runs, which is the same key a visitor's toggle
  writes — **the film picks the mode the site already has rather than restyling
  it.** Outputs are `post11-light-*` and `post11-dark-*` in `demo/out/`.
  **Every guard runs unchanged on both**, plus one written for the pair: the
  caption ink, the bubble's outline, the end card and the tap ring are held to
  wcag 3.0 absolutely; the card hairline and the bubble's capsule fill have no
  absolute bar to clear — the hairline is index.html's own faint separator and
  the capsule fill *is* the page colour by design — so those two are held to the
  **light render's own numbers** instead. Measured: caption 19.46:1 light,
  14.34:1 dark; hairline 1.29:1 on both; capsule 1.00:1 on both; end card
  wordmark 19.46 / 14.34, address 8.12 / 12.04; tap ring 19.46 / 14.34.
- **`demo/post11.mjs`**, added 2026-08-30: the eleventh clip, the explainer.
  **36.93s at 60fps as first built; 46.47s after six rounds of fixes across
  2026-08-30 and 2026-08-31, which are rendered and checked at 12fps only**, vertical only, the read
  inside the mp4, out to
  `demo/out/post11-1080x1920.mp4`. `--blur` opens the shutter for the final,
  `DEMO_FPS=12` previews it, `--plan` prints every plan and renders nothing, and
  `--encode-only` re-encodes from kept frames. Frames under `out/frames-post11`,
  subframes under `out/subframes-post11`, state under
  `out/post11-1080x1920.json`, a still per beat under `out/verify-post11`, the
  mix at `out/post11-mix.wav`.
  **It is one composed page and the live site is an iframe inside a card on it.**
  The card is `388x420` css at `76,96`, with a 1px `--line` hairline at the 16px
  radius; the caption band's ink is fixed at `572..620` and does not move for any
  of the fourteen lines; the mascot stands bottom left on the module's own
  resting turn. The camera is a transform on the iframe element and every shot is
  a selector, a zoom and an alignment resolved against a live rect. **The site is
  filmed at 360x1200 css px** and the crop never shows its top sixty, which is
  what excludes the nav.
  **The mascot's twelve marks and seven bubbles, as the third round left them.**
  The opening four are his alone, because nothing else is drawn up there. The
  turn is set over those only: out to 0.58 and back to the 0.35 resting bias
  before the card arrives, and every mark after that leaves the channel alone.
  There is no `unimpressed` in the clip and `agreeing` is kept for the close,
  because it is the one state that earns a `ding`:

  ```
   0.30  neutral       turn 0.18
   1.55  curious       turn 0.58, bubble `hmm...`
   4.30  thinking      turn 0.42, on `some know exactly, but have no time`
   7.20  curious       turn 0.50, bubble `interesting`
   9.57  neutral       turn 0.35, level and on the bias as the card arrives
  11.97  curious       into `press the button`
  13.51  neutral       and it holds three lines, carrying the three greetings:
                         `hey` 16.98, `привет` 17.85, `labdien` 18.70
  23.73  delighted     `nice`, on the frame the salary line finishes typing
  26.07  neutral       through the size step and the last step being filled
  32.29  curious       up at the check mark, on the frame the page draws it
  33.68  neutral       through the report and the offering
  44.45  agreeing      `finally`
  ```

  **The last step is filled field by field, on the word that names it**, through
  the page's own focus and its own input listeners:

  ```
  26.64  f-name      your business
  27.69  f-reg       12345678             named and never read aloud
  28.85  f-site      yourwebsite.com
  30.04  f-country   usa
  30.88  f-email     you@yourbusiness.com
  ```

  All five, in the order index.html lays them out, and the two lines that name
  them name them in that order too, so the eye tracks down the card rather than
  jumping about it. `f-site` is a `type="url"` input handed plain text: the page
  reads `.value` and posts it, there is no native form submit anywhere in
  index.html, so nothing validates the shape.

  **It imports `lib/voice.mjs`, `lib/captions.mjs`, `lib/mascot.mjs` and
  `lib/sfx.mjs` and not `lib/pictograms.mjs`.** A scene layer was built for the
  opening on 2026-08-30 and taken out again the same day: the top of the frame is
  empty for the first nine and a half seconds on purpose and the space is Einz's
  to fill. What carries those four lines is the corner mascot.
  **No music.** The sound is the read, a second read in the comedy voice over the
  typing, the mascot's own cues, a click on each tap but one, `key` ticks under
  the hand and under each field fill, a `press` on the send and a `ding` on the
  check mark: **forty two effects**, at -14.2 LUFS / -1.0 dBTP.
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
  `demo/post7.mjs`, `demo/post9.mjs`, `demo/post10.mjs`, `demo/post11.mjs`,
  `demo/scenes-test.mjs`, `demo/mascot-test.mjs`, `demo/mascot-export.mjs`,
  `demo/lib/captions.mjs`, `demo/lib/voice.mjs`, `demo/lib/pictograms.mjs`,
  `demo/lib/sfx.mjs`, `demo/lib/mascot.mjs`, `demo/README.md`,
  `demo/package.json`.
  **`demo/README.md` carries post10** — a section of its own, an index line, and
  a paragraph under Why demo/ is safe about `demo/music/` being licensed audio
  that is never pushed. **It also carries post5's audio pass** as The fifth
  clip's sound, with the two mix lessons it paid for. **Its own tracked list in that section is stale** and has
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
- **`lib/sfx.mjs` has twenty one sounds since 2026-09-02**, and had nineteen from
  2026-09-01. Fourteen furniture, seven
  character: post12 added `hi`, `fart`, `giggle` and `glitch`, post13 added
  `mumble`, `sigh` and `annoyed`. The seven are the only ones allowed to be funny
  and the rule that keeps them in the house is that none of them is bright — the
  giggle is the highest and it is still low passed under four kilohertz. `mumble`
  is the only formant synth in the file and it is the only one that had to be:
  what makes a noise read as speech is two resonances moving, not a pitch.
- **It had twelve since 2026-08-30, and nine before that.** `key` and `press`
  are both the `click` recipe resized. `key` is one keystroke: three and a half
  milliseconds of noise banded 1.3k to 4.2k for the cap and a 124Hz pulse under it for
  the board, gone in 55ms, at -34dB, which is under the sweep because it is the only
  sound that repeats a dozen times inside four seconds and it plays under a voice.
  `press` is one button with travel in it: nine milliseconds of noise banded lower and
  a body falling 150 to 110Hz, 130ms, at -21dB, four over the click and three under the
  coin. It exists because post11 had six real presses in it and the last one, the one
  that sends, sounded exactly like the five before it.
- **`demo/lib/voice.mjs` — free voice, no key, no account, no dependency.** Edge's read
  aloud neural voices over the unauthenticated websocket the python `edge-tts` package
  uses, with the handshake and the frame masking written out against a tls socket
  because node's global `WebSocket` cannot set the headers the endpoint wants. **Four
  voices since 2026-08-30**: three narrators, `calm` = `en-US-AndrewNeural` (the
  default), `dry` = `en-US-EricNeural`, `uk` = `en-GB-RyanNeural`, all at a negative
  rate; and one comedy voice, **`aside` = `en-US-JennyNeural`**, female us english,
  marked `comedy: true` so nothing can pick it to narrate. **That slot shipped as
  `wry` = `en-IN-PrabhatNeural` for one build and was replaced the same day**: a
  clip whose register is plain does not want its one joke marked out by an
  accent, because then the accent is the joke. It is female on purpose, because
  the three narrators are all male and the one voice that is somebody else in the
  film should be audible as somebody else on the first syllable. `NARRATORS` is the list of
  the ones that are not comedy. `node lib/voice.mjs test` speaks a line in all four and
  reports the durations, and `voices` prints `[comedy]` against the fourth. Audio and a json sidecar land in
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

- **`demo/lib/mascot.mjs` — the mascot reactor, added 2026-08-30.** A rig, not a sprite
  sheet: a card, two eyes with independent x, y and both scales, two lids, two brows, a
  shadow and a glow, all of them channels on one gsap timeline. **And, since
  2026-09-01, a hand — opt in, off unless a plan says `hand: true`.** He has no
  mouth and the page spec says he never will, so when a clip needs him talking a
  hand stands in for one: two flat slabs in the iris's own ink, hinged at a wrist
  on the left of the face, the fingers held flat and the thumb tapping up and
  down under them. `yap: true` on a mark runs the loop from that mark to the next
  one and `plan.yap` comes back as a list of cycles with their own times, which
  is what lets a clip put a syllable of sound on the frame the mouth opens on.
  **With it off nothing about this module changes** and that is asserted rather
  than claimed — see the decision.

  **And, since 2026-09-06, two floating hands — also opt in, off unless a plan
  says `hands: true`, a different part from the one above, and since the fix
  round the same day they are **ten traced vector paths off the sheet** rather
  than shapes drawn in code. The rounded rect version was committed as `43af6e7`
  and rejected on review; see the decision for why, because the lesson is not
  about hands.** Two cartoon gloves with no arms, and **nothing in the module
  draws one**: `demo/assets/hands/*.svg` holds `rest-left`, `rest-right`,
  `wave`, `thumbs-up`, `facepalm`, `shrug-left`, `shrug-right`, `point`,
  `panic-left` and `panic-right`, each a 400 unit frame with one filled path in
  it, imported into `HAND_SHAPES` with their coordinates untouched and filled
  with the plate's own token so they are white on the dark page and ink on the
  light one. **Seven poses** — `rest`, `wave`, `thumbs-up`, `facepalm`, `shrug`,
  `point`, `panic` — each an entrance, a hold with its own beat and an exit back
  to the resting pair, triggered from a mark the way a state is and composing
  with one rather than replacing it. Three carry a path a side because the sheet
  draws both hands; four are one handed and the second hand is the first one
  flipped. `side` is `left`, `right` or `both`, which hands are on screen, and it
  persists across marks the way the turn does. **A pose is a shape rather than an
  arrangement**, so it is not a channel and is not tweened: it is looked up out
  of the plan's own marks and swapped, with every pose's path sitting hidden in
  the markup and the page showing the one the frame names. **A glove is anchored
  at its own wrist**, measured per file, because a wave rocks at the wrist and a
  hand hangs from one. The **separation edge** is the part that makes them read:
  the glove is drawn twice, once unclipped and fill only and once clipped to the
  plate's own outline and stroke only in the page colour, so the outline exists
  exactly where a hand is over the face and nowhere else — and it is `fill:none`
  now, which five overlapping rects could never be. Each glove carries the
  inverse of the card's two scales, so it goes with the head through squash, tilt
  and turn **and does not deform**, which is what keeps that stroke the same
  weight on every edge. They hang outside the silhouette — 26.6 grid units under
  the chin at rest, where the sheet hangs them — so the placement holds room for
  their measured reach and `headRect` grows to cover the pair. Measured at 60fps:
  `rest` 0f / 7f / +9.9% / 117ms, `wave` 5f / 11f / +13.3% / 183ms, `thumbs-up`
  5f / 11f / +12.8% / 167ms, `facepalm` 5f / 18f / +11.2% / 317ms, `shrug` 5f /
  10f / +12.8% / 133ms, `point` 4f / 9f / +13.7% / 150ms, `panic` 11f / 32f /
  +4.2% / 83ms — that last row is its two gear entrance rather than a fault, and
  `facepalm` is eighteen frames because it crosses forty two grid units.
  **Every placement is read off the sheet rather than judged**, with
  `demo/out/poses/ref-grid.mjs` drawing the card's own grid over each reference
  crop, and **the size is one number**: `HANDS.box` is 32.5 grid units for a
  file's 400 unit frame, which lands the open hand at 27.06 by 26.08 against the
  sheet's 27.0 by 26.1. The band is on the larger side of each drawing's ink,
  0.33 to 0.50 of the head, and the ten land between 0.372 and 0.456. The
  separation edge measures **2.99 and 3.47 device px** at the two head sizes a
  clip uses. **With them off nothing about this
  module changes**, including where the head stands, and that is asserted over
  12,138 frames rather than claimed.   **The seven emotion states, measured at 60fps** — anticipation in frames, then
  frames from the mark to the arrival, then how far past the mark it goes, then
  the settle: `neutral` 0f / 7f / +10.7% / 150ms, `curious` 5f / 12f / +13.1% /
  167ms, `surprised` 6f / 11f / +14.2% / 233ms, `thinking` 4f / 12f / +12.5% /
  183ms, `agreeing` 5f / 10f / +15.1% / 200ms, `unimpressed` 0f / 24f / +0.0% /
  0ms (the declared exception: it arrives on the heavy curve because the read is
  that it cannot be bothered), `delighted` 4f / 10f / +12.7% / 317ms. The two
  turn states measure `turn-away` 4f / 11f / +12.0% / 183ms and `snap-back` 3f /
  9f / +11.4% / 150ms. Squash peaks at 7.0% against an 8% ceiling and breathing
  at 1.60% against 2%.

**Nine states** —
  `neutral`, `curious`, `surprised`, `thinking`, `agreeing`, `unimpressed`, `delighted`,
  and the two the turn brought with it, `turn-away` and `snap-back` — each a named piece
  of that timeline with an entrance, a hold that has its own idle, and an exit. The **marks api** is the whole surface: `planMascot({ seconds, marks:
  [{ t, state, bubble }], theme })`, where a mark is a second on the clip's clock and a
  state to be in from then, optionally with a bubble and optionally holding the **turn**
  somewhere, and everything else is worked out from the state table and the gap to the
  next mark. Same split as the other two: `planMascot` measures nothing
  and makes a plan that is plain json, `mascotFrame(plan, t)` is the whole animation as
  a pure function of time, `mascotPage` is serialised into the scene and only ever
  writes what it is handed. The motion core is `lib/pictograms.mjs`'s — the same four
  house curves plus `land`, the same volume preserving `sq` channel, the same `lift`
  shadow model — plus two curves that are `index.html`'s own blink written as beziers.
  **gsap does not run in the page here**, because nothing in the mascot is line drawn
  and there is therefore nothing the page has to own: node holds the animation and the
  page writes numbers to elements. **The turn is a flat three quarter turn on one number**, -1 to +1, every value in
  between real: the card squeezes, both eyes travel to the near edge with the far one
  going further so the gap closes, the far eye foreshortens, the head tilts and the
  shadow slides. The resting bias is **one config value**, 0.35 into the frame, flipped
  automatically when he stands in the other corner. **The bubble is index.html's thought
  bubble**, an outlined pill with two trailing dots, popping in dot, dot, pill and
  leaving in reverse. **Two themes, one call.** Light is ink on paper with a grounded
  shadow and no glow; dark is the face on black with two quiet layers of blur and no
  shadow, which is post10's crt ghost walked down. The guards are the
  brief's: the head at **240 device px** inside a 220 to 280 window, the bubble's caps
  at **38px** over a 32 floor, the head's clearance from every platform border on every
  frame, the bubble's on a sample, the bubble against a caption band if one is passed,
  a two or three word ceiling on bubble copy, no dash in any language, no two identical
  blinks in a row, no frozen frame, the squash under 8% and the breathing under 2%.
- **`demo/lib/camera.mjs` — the camera, added 2026-09-02.** `cx`, `cy` and `z` on legs
  between targets with house easing, an idle drift on two incommensurable periods per
  channel, a snap zoom with anticipation and `btk.pop`'s own overshoot as the settle, and
  a shake that is a continuous function of `t` rather than of the frame index — the
  opposite of the glitch layer's, on purpose. A target is a selector, a rect or a point,
  and a selector is resolved in its own step so the animation stays a pure function of
  time. Two modes: `site` enforces the page's own zoom floor of 1.0 and ceiling of 1.09
  by walking the resolved plan at 60fps, `free` is for composed frames. `minZoomFor`,
  `visibleRect` and `holds` turn "the camera never shows an edge" and "no line of the
  page is ever cut in half" into numbers. **`record.mjs` and `post9.mjs` keep their own
  copies and are byte identical.** `node lib/camera.mjs test` runs 22 checks with no
  browser.
- **`demo/lib/transitions.mjs` — the circle grow and the cross, added 2026-09-02.** He
  swells until his fill covers the frame and becomes the next scene's paper, or the same
  shape backwards. It works both ways because his face in one theme *is* the other
  theme's paper, and `mascotInk()` checks that against `mascotCss()` at run time rather
  than trusting it. Plus the exit and re-entry, with the departure on `btk.drift` read
  backwards. **It drives `lib/mascot.mjs` through `#m-zone` and does not touch that
  module**; the three things it writes after `__mas.apply()` are all multiplies toward
  zero of numbers the module already put there. `node lib/transitions.mjs test` runs 32
  checks with no browser.
- **`demo/rig-test.mjs`** renders 12.00s in both themes to `demo/out/rig-light.mp4` and
  `demo/out/rig-dark.mp4`: a push, a drift, a snap, a shake, the grow both ways and the
  cross. 22 guards. He fills 1080x1920 at a zone scale of **16.53** from the bottom right
  corner, measured on the rendered plate at **3999 x 4103 device px**.
- **`demo/mascot-test.mjs`** — **two chapters since 2026-09-06**, each its own clip
  per theme, at four fixed paths that are overwritten every run:
  `demo/out/mascot-<theme>.mp4` and `demo/out/mascot-hands-<theme>.mp4`. Nothing else
  is written, so a stale clip cannot survive a render. Rendered light and dark,
  no voice. `--chapter=states|hands` renders one of them.
  **states** is forty two seconds: all nine states with three bubbles, then a sweep of
  the turn end to end and back, then three of the ordinary states held at 0.6 to prove
  the turn composes with them rather than replacing them. It answers whether they read
  as different things at a glance with the sound off at phone size.
  **hands** is twenty one seconds of the seven glove poses, each with a different face
  under it and the `side` option exercised in the middle of the run. It is a separate
  clip rather than a section because turning the gloves on moves the head in, and a
  states clip carrying them would have stopped being the control the first question
  needs. Its own guards: every pose winds up, overshoots and settles; all seven poses
  and all three sides appear; each glove carries all seven drawings; no hand moves more
  than twelve css px in a frame; the drawn reach never passes what the placement held;
  and the rendered glove is between 0.33 and 0.50 of the head on its long side with its
  edge between 2.8 and 4.25 device px.
  **The caption band is one a chapter since the traced hands landed.** The resting pair
  now hangs 26.6 grid units under the chin where the sheet hangs it, against the drawn
  version's 10.8, so the placement stands the head fifty three css px higher and the
  thought cluster climbs with it — six hits on a band that ends at 630. The hands band
  ends at 600; the states band is untouched, because it is the control and moving it to
  suit a clip that composes differently would be moving the ruler. Those thirty pixels
  are what a pair of gloves costs a clip that also carries captions.
- **`demo/mascot-export.mjs`** — the same seven states as standalone 1080x1920 overlay
  clips for canva, three and a half seconds each, **three flavours from one capture**:
  vp9 webm with real alpha, mp4 on solid black, mp4 on solid white, plus a bubble
  variant of each and, for the seven states that do not turn on their own, a **turned**
  variant held at 0.6. That is 64 clips and about ninety minutes; `--no-turned` and
  `--no-bubble` each halve it. The mascot is already in its corner so a clip drops onto a phone
  video with nothing to reposition. Files land in `demo/out/mascot/`, which is inside
  the already ignored `out/`. The clips are **silent** — they go over somebody else's
  footage — and the two cues the module would emit are written to `cues.json` beside
  them instead.

**Factory v1 as of 2026-08-27, complete and pushed in `b30bee8`.** The pipeline and the
first clip built on it are both on `main`. What a new clip now costs, measured: the
voice and its word timestamps in under a second for a line, the caption cut for free
because it is a pure function of those timestamps, the length following the voice rather
than being typed, and about two and a half minutes of render for twenty two seconds at
60fps with every guard. **What is still by hand: the layout, and the mascot's performance
in the clips built before 2026-08-30.** post6's thirteen gaze keys were placed against
the beats in that script, and a new script has its beats somewhere else. `lib/mascot.mjs`
is the answer to that half of it for anything built after: a performance is now a list
of marks rather than a list of keys, and nothing shipped was retrofitted onto it. post6's layout numbers are a template for the
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
  - **Two ways in since 2026-08-29: a path on this disk, or a url.** A url is
    fetched with **yt-dlp** into `demo/out/downloads/dl-<hash of the url>/` and
    everything after the fetch is the local path unchanged; the frames still
    land in `demo/out/`, never beside the download, because that folder is about
    to go. The folder is keyed by a hash of the url, so the same link twice
    reuses what is already down and a second pass needs no yt-dlp. `index.json`
    records the url and the media's path, and that record is what the delete
    reads. **A local path is never fetched and never deleted** and works with no
    yt-dlp installed at all.
  - **Step 4 is deleting the media**, and it is not optional on a url:
    `node skills/video-review/frames.mjs --cleanup demo/out/frames-review-<name>`
    once the review is written. It deletes only the download folder that
    `index.json` names, refuses anything outside `demo/out/downloads/`, keeps
    the frames and the review, and on a local review removes nothing and says
    so. Two more flags came with it: `--refetch` and `--ytdlp=<path>`, the
    latter also readable as `YTDLP` in the environment.
  - **It transcribes, since 2026-08-29**, with `transcribe.mjs`: captions
    first, a whisper api second and only on a key already in the environment,
    and an explicit no transcript was possible third. **On our own clips the
    post file's script still wins** — they are made here and the words are
    written down before the voice is synthesised, so the transcript is a check
    that what shipped is what was written, not the source of truth for what was
    meant. **It adds no npm dependency** — frame extraction uses
    `demo/node_modules`' `ffmpeg-static`, which the render pipeline already
    carries, and that binary ships no ffprobe so the metadata is parsed off
    ffmpeg's own stderr exactly as `post9.mjs` parses it. yt-dlp is a binary on
    PATH, not a package, so `demo/package.json` stays at three.
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

### 2026-09-06 — the gloves become traced paths, and the pose table is measured off the sheet rather than judged

**This closes the entry below it.** The rounded rect gloves were rejected on
review; they are gone. Ten traced svgs in `demo/assets/hands/` — `rest-left`,
`rest-right`, `wave`, `thumbs-up`, `facepalm`, `shrug-left`, `shrug-right`,
`point`, `panic-left`, `panic-right` — are imported into `HAND_SHAPES` in
`demo/lib/mascot.mjs` with their coordinates untouched. **Nothing in the module
draws a hand any more.** A pose is a shape rather than an arrangement: the table
says which path, where its wrist goes, which way it is turned and how big it is.

**The seam was as small as it was written down to be.** `gloveCorners` and the
one resolver above it were the whole interface, and the reach walk, the
placement, `headRect`, the capture region and every guard read only those two.
Six shapes came out and one `d` string went in, and none of those callers
changed.

**Seven channels died with the primitives.** The four finger curls, the thumb
curl, the splay and the thumb angle were the arithmetic that bent a rect into a
knuckle. `HANDS_REST` is five numbers where it was twelve. Everything the poses
used to say with curls, the drawing now says by being a drawing.

#### A shape cannot be a channel, so it is a lookup

A channel is a number and gsap eases it. Two white shapes crossfading over a
face is a double edge for the length of the fade; a path index eased from one to
five draws three poses nobody asked for on the way. So the shape is resolved out
of the plan's own marks — `handShapeAt(plan, t, k)` — and swapped: a hand holds
the pose of the last hands mark it is **acting** on, from that mark's frame
until its exit begins, and holds `rest` at every other instant, including
through the exit, so the shape a hand travels home in is the shape it is going
home to.

Every pose's path sits in the markup already, hidden, and the page shows the one
the frame names. Seven paths a hand rather than one path rewritten per frame:
writing a `d` every frame asks Chrome to re-parse and re-tessellate a two
hundred point outline six times a captured frame, and a `d` written per frame is
a `d` that can be written wrong on one. The name is compared before it is
written, so holding a pose for three seconds writes nothing at all.

#### The wrist is the anchor and it is each file's own

A wave rocks at the wrist, a hand hangs from one, and a pose turned about its
centroid is a hand being spun rather than held. `demo/out/poses/measure-traced.mjs`
rasterises each path, projects the ink onto the direction the wrist points in,
takes the outermost nine per cent of that run and reports the band's centroid,
which lands in the middle of the stem rather than on the rounded cap. The
direction is the one judgement in the instrument and it is read off the drawing;
everything after it is arithmetic.

#### Placing them off the sheet moved all seven, and the first pass was fifteen units high

The lesson of the rejected version was that a comparison, not a guard, is what
tells you a hand is wrong. So the placements were never judged this time:
`demo/out/poses/ref-grid.mjs` draws the card's own 64 unit grid over each
surviving reference crop with the pose's ink box on top of it, and the crops are
centred on the panel's head at exactly 244px in a 640px box, so the mapping back
into card space is exact and needs no measuring.

**And the first pass, placed by eye, was fifteen grid units too high across the
board.** The resting hands had been put at the head's middle; the sheet hangs
them off the bottom of it — a resting hand's ink runs y 46 to 69 on a head that
ends at 62. `thumbs-up` was seventeen units out on its own, `facepalm` fifteen,
`panic` fourteen across, `point` twelve. Every one of those was invisible in a
still of ours alone and obvious the moment the sheet's own grid was over it.

**The one deliberate departure is `wave`.** In the sheet the waving hand's wrist
sits within three units of the resting hand's: the gesture is entirely in the
shape, because a wave's fingers point up where a resting hand's point down. That
is fine in a drawing and it is a pop in a film — a hand that changes shape
without travelling has not moved. So the wave sits 3.5 grid units above where
the sheet draws it, which is seven css px, and it is scored on that lift.

#### One scale, calibrated on the open hand, and a guard that had to be rewritten

`HANDS.box` is 32.5 grid units for a file's own 400 unit frame, and every pose
is scaled by it, so the ten keep the sheet's relative sizes rather than each
being fitted to something. That lands `wave` — the one pose in the sheet drawn
flat to camera, and the pose every version of this part has been sized off — at
27.06 by 26.08 against the sheet's own 27.0 by 26.1.

The old guard was on the **mitt**, because five rects had a palm in them to
measure and a hand's whole box swings by a third between a fist and an open
hand. A traced pose is one outline and there is no mitt in it. So the band is on
the **larger side of each drawing's own ink** — the measure that means the same
thing on a fist and on an open hand — at 0.33 to 0.50 of the head. The ten land
between 0.372 and 0.456.

#### The hull, and the bug a symmetric glove was hiding

`gloveCorners` hands back the traced outline's **convex hull**, computed once at
load: flattened at sixteen segments a curve, translated onto the wrist, scaled,
grown by half a stroke, hulled. A hull is exactly as good as the whole outline
for the only question anybody asks of it, because every consumer takes an axis
aligned box **after** a rotation and the extreme of a rotated set is always a
hull point of it. The reach walk costs 73ms on a thirty second clip, under the
100ms the rect version cost.

**And it exposed something the rects got quietly wrong.** The left hand was
reflected on the page and *not* in the corner sweep, so its reach was the reach
of a hand that was never drawn. A near-symmetric glove hides that; a traced one
does not. The mirror is now a second cached hull kept beside the first.

The flattener takes `M`, `C` and `Z` absolute and **refuses anything else** by
name. A relative `c` read as an absolute one is a hand in the wrong place whose
first symptom would be a reach that is too small and a glove over the safe line,
which is a long way from the cause.

#### `fill:none`, and a css line that could finally be deleted

The rejected version's edge layer painted the ink layer's own fill **under** the
stroke, so a shape drawn later could cover an earlier one's outline; without it
a folded hand came back as a knot of loops and `facepalm` was five rings sitting
on the face. That line was the cleverest thing in the part and it existed only
because a glove was five overlapping shapes.

One closed path has no loops to hide, so the edge layer is `fill:none` and the
outline it draws is the hand's own. The lines the sheet draws *inside* a
silhouette — the knuckle creases, the folded finger in `point` — arrive with the
path, in `point` as a second subpath under `fill-rule="evenodd"`, rather than as
a side effect of the stacking order.

The stroke is written in the file's own units and divided by the path group's
scale, so what lands on the screen is `edge` grid units: 2.99 device px at size
128 and 3.47 at 148. That is a division rather than a `vector-effect`, which
would have refused the head's own scale as well as this one.

#### What it cost a clip, and it is thirty pixels

The resting pair hangs 26.6 grid units under the chin now, against the drawn
version's 10.8, because that is where the sheet hangs it. The placement stands
the head fifty three css px higher to hold room for it, the thought cluster
climbs with the head, and `mascot-test.mjs`'s caption band guard failed six
times on a band that ends at 630 with a pill whose top reached 619.

**The band moved and the states band did not.** It is one band a chapter now:
the states cut is the control and moving its ruler to suit a clip that composes
differently would be moving the ruler. So the hands band ends at 600, and those
thirty pixels are the honest price of a pair of gloves in a clip that also
carries captions — written down here because it is a constraint the next clip
inherits.

#### Everything else stands, and it is still proven rather than claimed

The opt in, the marks api, `side`, the separation edge as two clipped layers,
the inverse card scale that keeps a glove undeformed through squash, tilt and
turn, the measured reach moving the head in, `headRect` growing to cover the
pair, and the two chapter test. `demo/out/handsdiff/` still reports **12,138
frames across 33 plans byte identical** with the hands off, with every added key
asserted off on every plan, every mark and every frame.

#### The sheet is gone and the trace is what is left

`demo/assets/hands-ref.png` lived in an untracked local folder and is not on
this machine any more. What survives is the seven crops `compare.mjs` cut out of
it — `demo/out/poses/cmp-ref-<pose>.png`, already centred, scaled and mirrored —
and they are what every placement above was measured against. The ten traced
files are the sheet now as far as the module is concerned, which is the
practical argument for tracing that the review's argument was only half of: a
reference you have measured is a reference you can lose.

### 2026-09-06 — the mascot gets floating hands, and they are rejected: primitives cannot draw that glove

**Superseded the same day by the entry above it: the drawing was redone as
traced paths and the six shapes are gone.** This is kept whole because the
machinery in it is still what is running, and because the fault is worth having
written down — it is the only reason the traced version exists.

Two cartoon gloves with no arms, drawn in code in `demo/lib/mascot.mjs` off the
measured proportions of `demo/assets/hands-ref.png` — somebody else's drawing,
in a local folder that is not in the repo, so the ratios taken from it are
written down in the README and nothing is traced or embedded, **which is
precisely the decision that turned out to be wrong.** **Opt in and off by
default**, for
the reason the yap hand is: twelve scripts were written against this module
before them — nine posts, the rig test, the state test and the export — and none
of them should move. Same proof as that change — the module out of git
history against the module as it is, 33 plans, **12,138 frames at sixty compared
as json**, plus the css, the markup, the page plan, the cues, `headRect`,
`stillMoment`, the motion report and both printed summaries. Byte identical.

**They are not the hand that was already there, and the near-collision of the
names is worth being explicit about.** `HAND` is one pair of slabs standing in
for a mouth, low on the face, and it is a piece of the head. `HANDS` is a pair
of gloves beside him. A plan may carry `hand`, `hands`, both or neither, and the
self test asserts exactly that, because the two are one letter apart.

**The separation edge is the whole design and it is two layers rather than a
conditional.** A white glove on a white face is one shape, so the glove carries
an outline in the page colour — and it is painted only where the hand is over
the head. The ink layer is unclipped and fill only; the edge layer is the same
shapes, clipped to the plate's own outline, stroke only. Three things fall out
of that and all three are the point:

- **Over the background there is no edge at all**, which is what the brief asked
  for and is right anyway: the glove is already a white shape on a dark page.
- **Inside the hand, the same stroke is the finger lines**, free. The fingers
  overlap the palm and the stroke follows every shape's own outline, so over the
  face the row reads as five parts of one hand; over the background the gaps
  between the fingers do that job and the palm and fingers merge into one
  silhouette, which is exactly what the reference does.
- **The thickness is even everywhere by construction**, because it is one number
  for the whole glove. The reference's is not, and a stroke that thickens round a
  knuckle is the difference between a drawing and a rig.

**Clipping rather than relying on the colour is a real decision.** A page
coloured stroke over the page is invisible for free, so the first cut had no
clip at all. It would have shipped a dark ring round every hand in the dark
theme: the glow is two blurred copies of the plate sitting behind the head, so
the background near a resting hand is not the page colour, and `#06070a` over it
is ink.

**The gloves cancel the card's deformation rather than riding it**, and that is
the other half of an even edge. The card's transform is `sc(1+sq)(1-squeeze)`
across and `sc/(1+sq)` down; a glove riding it would stretch on one axis and,
worse, carry a stroke thicker on one axis than the other. So each glove carries
the exact inverse of those two about its own origin, leaving the net transform
uniform. **The anchor is deliberately not counter scaled** — it is a point in the
card's own space, so the squash moves it and the turn's squeeze pulls it in as
the silhouette narrows, which is what keeps the pair attached to a head that is
deforming.

**One table, written once, for the screen right hand.** The left one is the
mirror: `x` becomes `64 - x`, `rot` changes sign, and the glove itself is
flipped with a `scale(-1 1)` folded into the transform. The splay and the thumb
angle are **not** mirrored, because they live inside the glove's own frame and
mirroring them as well would flip it twice. There is not a sign anywhere in the
pose table and the self test asserts the reflection on the drawn glove rather
than on the numbers, because the mirror is applied in three places — the seed,
the builder and the exit — and any one of them could reflect something it should
not.

**`side` is which hands are on screen, and it persists.** Left, right or both,
which is what "one hand or two" means. It carries across marks the way the turn
does, because it is a fact about the composition rather than a gesture. A two
handed pose is taken by every hand on screen; a one handed one is taken by the
acting hand and the other rests, which is what the reference draws — and **which
hand acts is derived from `pos`**, the fact `TURN.bias` is already derived from.

**They move the head in, and that number is measured off the plan's own frames.**
They hang outside the silhouette on every pose in the reference, so a resting
hand would be the first thing across a platform's chrome. The reach could have
been derived off the pose table and padded, and that would have been a second
copy of numbers the hold beats already move — a wave rocks fifteen degrees, a
point jabs two and a half units, the idle adds another half. So it is walked, the
way `crownReach` is, and the preflight then measures what the frames actually
make and **fails** if it ever passes what the placement held. `headRect` grows to
hold them too, so every clip's existing safe area guard became the hands' guard
with no new code in any clip.

#### Rejected on review, and the reason is the construction rather than the numbers

**This is recorded as it ended, not as it was going.** The hands are committed
as `43af6e7` and they were **rejected**: the drawn gloves still do not match
`demo/assets/hands-ref.png`, `thumbs-up` reads as a stump and `panic` reads as
two fists. The root of it, in one line: **geometric rounded rects cannot
reproduce that sheet.**

The first cut read as a starfish — thin fanned fingers on a small palm, because
every proportion had been taken off the drawing by eye and every one was wrong
in the same direction: the palm 17 grid units against 23, the fingers 3.3 wide
against 5.4, the splay seven and a half degrees a step.

**So the sheet was decoded rather than looked at.**
`demo/out/poses/measure-ref.mjs` runs it through the ffmpeg the repo already
carries, thresholds it, labels the connected components and prints each blob's
box and its **per row run profile** — a finger's width is how long a run is, the
gap is the distance between two runs, the palm starts where the runs merge into
one. Measured off the wave, the only pose in the sheet with the hand open and
flat to camera, against a 244px head:

    the whole hand   110 x 106      0.45 x 0.43 of the head
    the palm          93 wide       0.38
    one finger        23 x 50       a quarter of the palm's width
    the gap            6            a quarter of a finger
    the thumb         22 wide       within a pixel of a finger

And every pose was then placed against its own panel rather than from memory:
`demo/out/poses/compare.mjs` crops the panel a pose was written from, mirrors it
where the sheet's acting hand is on the other side, scales both so the heads are
244px, and stacks them.

**All of that landed, and it was not enough.** The mitt is 0.383 of the head
against the sheet's 0.381. The palm's width to a finger's length is 1.83 against
1.86. The gap is a quarter of a finger either way. The seven poses were each
corrected against their own panel — `thumbs-up` turned on its side, `facepalm`
made a cupped hand rather than a spread one, `shrug` reduced to two lobes,
`panic` given two gears. **The proportions being right did not make the hand
right.**

**The lesson is the one worth keeping, and it is not about hands.** A glove in
that drawing is one closed outline: a tapered wrist, knuckles that swell, a
thumb that joins the palm rather than sitting on it, fingers that bend. Five
rounded rects stacked in exactly the right proportions are five rounded rects.
Measuring a reference tells you **how big** to make the parts; it cannot tell
you that the thing is not made of parts. The first round was wrong about the
numbers; the second was right about the numbers and wrong about the primitive,
and only a render put side by side with the reference could say so — which is
the same thing `demo/`'s guards have never been able to see and the video review
skill exists for.

**What has to change**, and it is a small seam: the six shapes in `HANDS` are
replaced by **traced vector paths off the reference** rather than composed from
primitives. Everything around them is written against a *resolved* glove
already — `gloveAt` hands out points, angles and lengths and `gloveCorners`
hands out an outline, and the reach walk, the placement, `headRect` and every
guard read only those two. Two things a path breaks and both are known: a traced
finger cannot be shortened by changing a rect's height, so the curl becomes path
variants or a real bend; and `gloveCorners` needs the path's own points rather
than four corners a shape.

**What stands and does not need doing again:** the part is opt in and off unless
a plan says `hands: true`, and **12,138 frames across 33 plans hash byte
identical** to the module as it was. The marks api and the `side` option. The
separation edge as two layers. The digits behind the mitt with the edge layer
painting the ink layer's own fill. The inverse card scale that keeps a glove
undeformed through squash, tilt and turn. The measured reach moving the head in,
and `headRect` growing to cover the pair. And `mascot-test.mjs` split into two
chapters.

#### One line of css was the difference between a stack of shapes and a hand

The digits are drawn **behind** the mitt — fingers, thumb, then palm — and the
**edge layer paints the ink layer's own fill rather than `none`.** Painting the
face colour over the face is invisible, and it is what lets a shape drawn later
cover the outline of one drawn earlier.

Without it every digit tucked under the palm still drew its complete outline on
the edge layer, because a stroke-only shape has nothing to hide behind.
`facepalm` came back as five loops sitting on the face and `panic` as a row of
them on the crown. It is how the reference is constructed and it is one
declaration.

#### Three numbers, and where they come from

**`panic`'s entrance has two gears, and that is arithmetic.** It is the only
pose that takes a hand the whole height of the head: rest to the crown is 42
grid units, 85 css px, and on the pop curve the fastest frame carries about a
fifth of a move. As **one** tween that needed a full second to stay under the
ceiling, and a second is not a panic. So it is a lift on the calm curve for two
thirds of the travel and then a short grab on the pop one — 11.2 css px at its
fastest — and it reads better as well, because a big move with a change of gear
in it is a hand deciding where to go and then getting there.

**The size guard is on the mitt rather than on the whole hand.** A hand's own
box is an axis aligned rect around a rotated shape with a splayed thumb in it,
so it swings by a third between a fist and an open hand and says as much about
the pose as about the drawing. The mitt is the same size in every pose and it is
the number the sheet was measured on: **0.381 of the head there, 0.383 here**,
92 device px at the corner size and 106.4 at the centred one.

**The speed ceiling is twelve css px a frame, and it is the glove's own size.**
The mitt is 92 device px across, so twelve css px is 24 of them, about a quarter
of it in a frame. The yap hand's ceiling is eight for the opposite reason: that
one measures a twelve pixel fingertip, for which eight css px is more than its
own width and smears.




#### And one bug the self test now cannot let back in

`shrug` was written for one build with `at.rot` 76 and a `mark.to` of 78. The
mark is the value the preflight looks for, so every number in that pose's row of
the report was measured against a target the pose was never going to reach — and
it was caught by looking at the table rather than by a guard, which is exactly
the wrong way round. The check is one line, every pose's `mark.to` must equal its
own `at` on that channel, and it is the kind of fault that is invisible in a
green report.

### 2026-09-06 — a straight walk at a loudness target has a cliff in it, so the loop bisects

post17's and post18's loudness loop walks at the target and stops the moment a pass
costs more limiting than `MAX_REDUCTION`, keeping whichever earlier pass was
closest. Every clip in `demo/` carries a copy of it and none had found the hole.

post19's second cut sat at **-21.2 LUFS** on the first pass. The jump the target
asked for was 7.2 dB. 7.2 cost more than the 5 dB allowance, so the loop stopped
and kept lift nought — and the film would have gone out seven decibels quiet with
every guard green, because the guards only checked the limiter and the true peak.
**Nothing between 0 and 7.2 was ever tried**, and 6.53 was sitting there.

A pass over the allowance is a ceiling now rather than a stop: the last lift under
it and the first over it bracket the answer, and the loop halves the gap until it
is under a fifth of a decibel. Eight passes, bracketed between 6.53 and 6.64,
landing at 6.53 for -15.8 LUFS with 4.98 dB of limiting. There is a guard on the
answer as well as on the limiter now — under two decibels off the target, which is
where this house's dark clips land, and it is the seven decibel miss it catches
rather than the two.

**It lives in `demo/post19.mjs` and it belongs in `lib/sfx.mjs`.** Until it is
lifted, every other post file still has the cliff in it.

### 2026-09-06 — when the picture is cut to the read, a beat is a word rather than a number

post19's first cut spaced the five model stops half a second apart because the
brief said so and there was no voice on them. The second cut gave them a voice, and
half a second stopped being a number anybody could choose: a stop is where its name
starts being said.

So `clickAt` reads the beat by name — `word(b[1], MARKS_FILES[i].say)` — and the
label, the mark, the click and the caption card all land on the same frame because
they are hung off the same word. What the read gives back is 0.81, 0.90, 1.37 and
0.93 seconds, and the uneven one is `chat g p t` taking four tokens to say. **That
unevenness is the point**: a picker that sits on a longer name longer is a picker,
and one that moves on a metronome is a slideshow.

Two things followed. The reel is hung off the last stop instead of being measured
back off the fault, because the last name now has a length of its own. And the
caption folds the four spoken tokens of the spelled name back into one drawn word,
because post18's rule stands: nothing on the screen carries the spelling.

### 2026-09-05 — five squares are not five marks, and the alpha box is the difference

`demo/assets/logo-*.png` are all square and all the same shape, and drawing them
in one box is still wrong: the ink inside the square is a different fraction of
it in every file. Claude fills 82% of its canvas, Copilot 83%, Gemini and ChatGPT
61%, Grok 54%. Fitted to one 88px box the Grok mark renders two thirds the size
of the Claude one and a row that is supposed to read as five equals reads as five
sizes.

So each file is decoded once per run — `ffmpeg -f rawvideo -pix_fmt rgba` and one
scan for the alpha bounding box — and each element's geometry is solved from that:
the box keeps the file's natural ratio to six decimals and is placed so the ink is
88 css px tall with its own centre on the spot. Nothing is hardcoded; the
measurement reads whatever is on disk.

**The same number is what the safe area check has to read.** Measuring the element
reported the Grok mark 29 device px *outside* a margin its ink is 40 px inside,
because most of its element is nothing. A clip that trusted that would have moved
a centred row off centre to satisfy an artefact.

### 2026-09-05 — post19's four faults that only a frame could show

Every one of these was found after the guards were green, by looking at rendered
frames. It is the fourth clip in a row where that is where the real defects were.

- **The panel's border sat exactly on the safe line.** post17 takes the full safe
  width and that argument still holds, but 0 px in hand on the side the platform
  hangs its button column down is not clearance. Six css px in on each side, and
  it is still the tightest thing in the film at 12 device px.
- **A crossfade printed one opaque tile through another.** 90ms of overlap on the
  mark swap, which is right for a transparent mark and wrong for an app icon: at
  3.69s Grok was visible through Copilot. It is a hard cut on one frame now, and
  the guard checks one mark at *any* opacity rather than over a half.
- **The module's shadow paints a pale ellipse on dark.** `lib/mascot.mjs` says in
  its own words that the shadow is off in dark and declares `--m-shadow-o:0` to do
  it, and nothing reads that variable: the page half writes the shadow's opacity
  from the frame, and the ellipse is filled with `--face`, which on dark is near
  white. It is invisible in every clip so far because the head sits on top of it.
  post19 takes the head away for a third of a second and it showed. **`lib` is
  untouched** — the clip carries `#m-shadow{visibility:hidden}` and a guard on the
  computed style. Worth fixing in the module the next time it is opened.
- **Three caption cards were fragments.** Three words to a card cut this read into
  `which ai do`, `is knowing which` and `one for what`, splitting `which one` down
  the middle. Four to a card plus three break points marked on the caption copy
  only — the same mechanism `markLines` already used for the seam between two
  lines — gives six cards that are all phrases.

### 2026-09-05 — how fast a thing may fall is a property of the shutter, not of the animation

post19 drops the mascot 560 css px in 0.36s, which is 3100 a second and 52 css px
on the frame it lands. With the shutter open at post10's four subframes that is 25
device px between one sample and the next, on a head whose eyes are 19 device px
tall, and `tmix` blended it into four separated copies of a face rather than into a
smear. It is the fastest move any clip in `demo/` has asked for and it is the
first one where four is not enough.

Eight subframes is the direct fix and **it did not finish**: 4152 captures, and
the render was killed for memory on this machine. Six finishes, at 3114.

So the length of the fall was set by the blend rather than by taste: 0.47s, which
is 40 css px a frame and 13.2 device px between samples at six — they overlap, and
the rendered frame at 4.50s is a graded smear with the eyes as vertical streaks
while the compression frame at 4.633s is sharp.

**The 0.11s came out of the fault rather than out of the clock.** The fall used to
start half way through the first glitch and now starts on its first frame, so the
landing is at 4.56s either way and nothing downstream of it moved. It also falls
through the whole tear now, which is the better read of the two.

The number is a guard: the peak is computed from `DROP.from` and `DROP.for` and
checked under 42 css px a frame, with the device px between samples printed beside
it.

### 2026-09-05 — a bubble under a blink is a blank face, so the seed search gets a second constraint

The lid is a card coloured slab, so a blink is the face colour covering the eyes.
Under a thought bubble that is a blank white disc at exactly the moment the
punchline lands, and post19's first cut shipped one: the still at the pill's own
arrival had no eyes in it.

The seed search already looked for exactly one whole idle blink inside a named
window. It now also refuses any seed that puts a blink across the punchline — the
window from a fifth of a second before the pill is full to a third after, scored
on the *shut* part of the blink rather than the whole of it, because the open is a
lid travelling back up a face that is already readable. Six thousand seeds is
still enough to satisfy both.

### 2026-09-02 — the camera comes out of the clips, and the shake is the opposite of the glitch

`record.mjs` and `post9.mjs` each grew their own camera, post11 grew a third as a
transform on an iframe, and post14 has none at all. `lib/camera.mjs` is the fourth
one, written once.

**Nothing was retrofitted.** The two clips that have a camera are rendered and
shipped, and the only thing a shared module could do for them is change them. This
is the same call `lib/mascot.mjs` got: a module for what comes next, not a
migration of what already works. Both files are byte identical and that is checked
with a diff.

**The shake was the design question and the answer is that it is not the glitch
shake.** Four clips shake the whole stage and every one computes it from the frame
index, on purpose: a glitch happens to a screen, and with the shutter open a one
frame jump written against `t` renders as a quarter strength blur instead of as a
jump. A camera shake happens in the room, and a real camera moving fast **does**
blur. So the camera's is a continuous function of `t` and is meant to smear. Two
channels, two files, and a clip may run both — the glitch tears the picture and
the camera flinches.

**Which turned up a real bug in the first cut, and the test that found it is worth
keeping.** The envelope body is `(1-p)e^-kp`, which is 1 at `p=0+` and 0 at
`p<=0` — a step. Sampling the same window at 60Hz and at 240Hz reported the same
worst one frame move, **3.58px both times**, and that is the signature of a jump:
a continuous function's worst step comes down when you look more finely, a held
one does not. The fix is a 0.06 attack, two frames at 60fps on the default half
second shake, and the numbers are now 2.38px at 60Hz against 0.776 at 240, a ratio
of **0.327**. **A held signal reports 1.000, and that is the whole test.**
`lib/transitions.mjs` borrows it for the grow.

**The site mode's limits are walked rather than argued, and the snap is why.**
`btk.pop` goes ten per cent past its mark, so a plan whose legs all sit inside
[1.0, 1.09] can still render outside it. `resolveCamera` samples the resolved plan
at 60fps and throws. A 1.05 leg with a 1.06 snap on it is refused, and that case is
in the module's own test.

**`holds()` is post9's lesson with something checking it.** post9 rendered THE
BORING TEK as `SHE / 7/RING / MEK`; post11's answer was the rule that no line of
the page is ever cut in half. `visibleRect(plan, t)` gives the window of page space
in shot and `holds(plan, rect)` walks every frame and says whether one box stayed
inside it. It caught `rig-test.mjs`'s own headline at 3.60s on the first preview.

### 2026-09-02 — the circle grow, and why it needs his face to invert

The mascot is a circle, so the signature transition is that he becomes the
background. A circle grown about its own centre never stops being the shape it
started as, which is what makes it one continuous shape rather than a cut. A
square would have to rotate to fill 9:16 and a rounded rect would show its corners
arriving.

**The trick is arithmetic, not craft.** The module paints the head in `--face` and
the page in `--eye`, and `--eye` is defined to always be the page background. Read
as pairs: light face `#0b0d10` against dark paper `#06070a` is **6 of 255** apart,
dark face `#f4f7f5` against light paper `#ffffff` is **11**. So a black head
growing on a white page arrives at a black page and a white head growing on a black
page arrives at a white one. **The grow is a theme flip performed by a shape**, and
the handover is a flat field changing by four per cent of one channel at the one
moment the frame is a single colour. `mascotInk()` lifts both blocks out of
`mascotCss()` at run time and `planGrow` throws past 12 of 255, so changing the
mascot's colours fails loudly instead of rendering a visible cut.

**`lib/mascot.mjs` was not touched and did not need to be.** The brief allowed a
scale channel if the api lacked one. It does not: `#m-zone` is the mascot's own box
and `apply()` writes every other element and never the zone, which post14 already
relied on. The grow is a transform on the zone, so at its first frame it **is** the
head, to the pixel.

**The eyes melt rather than fade, and that is what makes it compose.** A head that
grows with its eyes on becomes two enormous slabs before it becomes a background.
Fading them would mean fighting `apply()` for the brow opacity every frame. Instead
`--eye` is walked to `--face`: the irises, the brows, the hand and the bubble are
all painted in `--eye`, so they stop being visible by becoming the same ink as the
skin. **He closes his eyes by having his eyes become his face**, and it works
because the module writes no custom property.

### 2026-09-02 — three faults the rig test's guards were green on, and the numbers that catch them now

The fourth time a frame has found something every check passed. All three came off
the 12fps preview.

**He popped back after the grow out.** A grow out means he became the page, and the
first cut handed him back the instant the window ended — full size, in his corner,
on the new theme. At 6.82s. The fix is that presence is a **latch rather than a
product**: `composeTransitions` gives the vote to the latest transition that has
actually started, which is well defined without the function knowing the time
because every frame carries its own plan's `at`. A grow out leaves him gone; a grow
in takes the decision back. Multiplying opacities would have left `false * true` on
every frame after the second grow.

**The snap cut the headline in half.** The snap peaks at z 1.380, which shows 391
page px of a 540 wide page, and the h1 was 428 wide at left 56. This is post9's
fault exactly. `holds()` is the guard and the copy now lives in one box that keeps
25.7px of air at the tightest crop.

**He landed looking out of frame.** `planMascot` derives the resting turn from
`pos`, once, so he looks into the frame — from the right corner that is -0.35.
Cross him to the left corner and the same -0.35 points him off the screen. The fix
is the mascot's own api rather than anything new: a mark may hold the turn, so a
mark before the cross holds it at `+TURN.bias`. In the right corner that reads as
looking toward the side he is about to leave through, which is the anticipation the
move wanted anyway. **It is a real limitation of composing `planCross` with a
corner derived bias and it is written down rather than fixed**, because fixing it
would mean a per frame bias in `lib/mascot.mjs`.

**And two the guards did find, both in `coverScale`.** The first: the slack allowed
for the idle drift and the breathing but not the **squash**, and the card's scale is
volume preserving, so a squashed circle is an ellipse whose *short* axis has to
reach the corner. `growCoverage` measured **0.970** of the corner on a frame the
field claimed to be covering. The second was worse and less obvious: the slack was
folded into the final scale but `reachOf` still divided by the bare geometry, so the
field came up when the *ideal* disc covered while the real one was two per cent
short. **The slack has to be in the requirement, not only in the destination, or it
is not slack at all.**

**A mascot mark whose entrance falls inside a covered stretch is a clip error.**
`coverScale` bounds the idle layer, which is always on and is a fixed fraction of
the head's own size; it cannot bound a pose, because a pose is the clip's and a
`delighted` hop moves the head a long way. `growCoverage` is the number that catches
it, and `rig-test.mjs` schedules nothing between 4.80 and 8.75 for that reason.

### 2026-09-02 — post14's end card drops the address, and the reason is a cap height

post11, post12 and post13 all end on the wordmark stacked three lines with
`theboringtek.com` under it in the lockup subline's treatment, which is the one
place the brand allows michroma small. post14 does not.

**At 190 css wide the address is 11 css px of type, which is 18 device px of cap
on a phone.** The floor every piece of copy in this repo is held to is 32, and
the address has never been held to it — post11's is 12 css px and passes because
the guard only ever read the wordmark. It is legible if you go looking for it and
invisible if you are scrolling, which makes it the only thing on the last frame
asking to be read that cannot be. Three words at 66 device px can be read from
across a room, and the brand name is what the last frame is for.

**It is not a general rule and the other three clips keep theirs.** They are
darker, slower and longer, and post11 in particular spends a whole line of its
read on saying the address out loud, so the card is a reminder of something the
viewer already heard. This one never says it. A line nobody can read, of an
address nobody was told, is decoration.

What it buys back is arithmetic: there is no gap to keep between two blocks and
no second width to fit, so the group **is** the wordmark, its centre is the
centre it was given, and the check that it lands on the middle of the frame is
one measured rect rather than three numbers added up twice.

### 2026-09-02 — post14's second cut: five notes, 3.08 seconds, and what each one bought

The clip shipped at 9.95s and came back with five. Every second of the 3.08 it
grew by is one of them, and none of them was a preference.

**The opening thought was 0.30s of full pill and it is 0.74s now.** That number
was written down when it shipped, because it is not a taste: `BUBBLE.quick`'s
hold is floored and capped at the same 0.30, so no amount of room changes it, and
the quick profile was chosen because the ordinary one puts the next mark at 2.30
and the clip had a ten second ceiling. Holding the opening for 2.52s lifts the
ceiling and the ordinary profile fits: 0.48 in, 0.74 hold, 0.30 out. **The lesson
is that the first cut's constraint was the length rather than the profile**, and
naming the cost at the time is what made the fix a one line change.

**The read was hurried rather than upbeat.** It ran +12, +18 and +6 per cent on
the argument that a news flash is quick. A person telling somebody good news does
not talk faster than they normally do, they talk with more shape — so the rate
comes back to around the house default and the **pitch** carries the register:
up on the headline, flat on the facts, up on the payoff, so the reading rises,
levels and rises again rather than climbing all the way through. Measured on the
real takes, words a second on line one: +12% was 2.82, 0% is 2.52, -4% is 2.41
and -8% is 2.31. The gaps are a real breath now rather than a join. It costs
0.9s.

**The end card was on 325 and it is on 480.** 325 is the middle of the room
between the mark's sweep and the caption band, which is a real number and the
wrong one: on a rendered frame it reads as an end card sitting high with a hole
under it. 480 is the middle of the frame. It is the **frame's** middle rather
than the safe band's 470, because the platforms take more off the bottom than the
top and a wordmark nudged up five pixels to satisfy that is a wordmark nobody
centred.

**The mark went from 152 to 216 device px**, and what sets that ceiling is the
sweep rather than the mark: a square turning about its centre covers a circle of
its own diagonal, so 108 css reaches 76.4 in every direction.

**And he was too quiet in the corner** — one state for three seconds, one hop,
one nod. He gets a state per line now with a short positive thought on each, plus
a `neutral` that settles him as the wordmark comes up. Four thoughts is the
**ceiling** rather than the count and it is a guard: a fifth would be a mascot
commenting on every clause.

### 2026-09-02 — the module's thought bubble climbs two dots in a row, and a centred character needs three on a diagonal

The mascot module hangs the thought off the head's right shoulder: two dots, 8
and 12 css px, laid out as a flex row with the pill — same baseline, increasing
x, fixed gaps. That is the site's own cluster and it is right for a mascot
standing in a corner with the thought beside his head.

post14's opening puts the pill **above** him, so the climb is a diagonal, and a
flex row is not a diagonal at any set of gaps. So for that one beat the three
dots are the clip's, drawn in page coordinates, and the module's two are switched
off.

**Switching them off is one line in the clip's own `apply`, not a fork.**
`window.__p14.apply` always runs after `window.__mas.apply`, so writing the dots'
opacity to nought after the module has written it is the same ordering the zone's
own opacity channel already relies on. The pill is still the module's, at the
module's size, on the module's spring — nothing about what a thought *is* has
been redrawn.

**And the timing is the module's too**, which is the part worth keeping. Each dot
reads a channel out of `mascotFrame` at its own offset, so all four things arrive
70ms apart on the site's own pop curve rather than on a second animation that
could drift: the 5 reads dot 0 at `t + 0.07`, which is a dot that started 70ms
earlier; the 8 reads dot 0; the 12 reads dot 1; the pill is the pill.

`lib/mascot.mjs` is untouched. The alternative was a third dot in the module's
flex row, which would have changed the cluster for every clip that has ever used
it, to serve one beat in one clip that does not want a row at all.

### 2026-09-02 — a picture of a ui is drawn in code, and its chrome is exempt from the copy floor

post14 needed a chat input under the mark: the box a person types into, with the
line typing itself. It is drawn out of the clip's own css rules — a rounded panel
in `--fg`, a line in `--bg`, a plus in a ring, the model's name bottom right — and
**there is no logo in it and nothing lifted off anybody's product.** It is the
*shape* of the thing, which is what a viewer recognises.

Two things are worth writing down.

**The panel is the site's ink on the site's paper, so it needs no colour of its
own** and it would invert with the theme for free if this clip ever got a dark
variant. That is the same discipline post11's report page and chalkboard were
built on, one step tighter: those two invented `#d1600a` and a chalk yellow
because they had to; this one did not have to.

**`Fable 5.1 Medium` is 28 device px of cap against a 32 floor, and it is the one
exemption in the file.** The floor exists because a viewer reads our copy on a
phone. That label is not our copy, it is chrome inside a drawn picture of a
screen — the same footing as post11's registration number, which is on the screen
and is never read aloud. **Type inside a picture of a ui is as small as it is in
the ui, or it is not a picture of a ui.** The line being typed is held to the
floor and clears it at 33.

The typed line is cut to the read at both ends — it starts on the second line's
first word and finishes 0.60s before the end card, both derived — so a slower
read moves the typing with it. Every character gap is its own number off a seeded
prng, which is post9's rule: a constant rate reads as a machine filling a field,
which is what it is.

### 2026-09-02 — a chained glitch window has no length of its own, so it grows when the cut does

post14's first fault runs to the second one's start rather than to a length of
its own, which is what keeps the stretch the mascot is missing from free of clean
frames. The consequence only showed up in the fix round: **its length is not a
number in the file, it is the gap** — so when the opening grew from 1.62s to
2.52s the fault grew with it, came out at 0.32s, and tripped the guard that says
a tv glitch may not outstay a third of a second.

That is the guard working, and it is worth writing down because the failure mode
is invisible in the source: nothing in `GL_CUT` changed, and the thing that
changed is two constants nowhere near it. The hit moved to 2.26 so the window is
0.26s again, which is the length the first cut proved.

### 2026-09-02 — a guard that redoes the arithmetic is not a guard

post14's end card is centred by measuring both blocks after the face loads and
placing them either side of a centre. The check that it is really on the frame's
middle did that arithmetic **a second time**, on the guard's side, from the two
`top` values that had been written — and got 514.8 for a group placed on 480,
because both blocks are translated by half their own size to sit on the line they
were given and the check forgot the translate.

A guard that re-derives what the code derived is testing the derivation against
itself and will agree with a bug as readily as with a fix. It measures the two
rendered rects now, which is the only thing on the page that knows where the ink
actually is. Same shape as the module's own note about `getBoundingClientRect` on
a rotated plate: measure the thing that answers the question, not a proxy for it.

### 2026-09-02 — the anthropic mark is placed as it is, clay and all, because "never recolour" beats "the black version"

post14's brief names the asset twice and the two namings disagree. It calls it
"transparent, black version" and it says "do not redraw or alter the logo, place
it as an image only" and "the logo must never be cropped, distorted or
recoloured". The file is `#e37d5b` at full alpha, which is anthropic's own clay
and is not black.

**One of those is a description of the file and the other is a constraint on what
may be done to it, and the constraint wins.** A description can be wrong about a
file; a constraint is an instruction about behaviour. Turning it black would mean
adding a `filter` to it, which is the one thing three separate lines of the brief
forbid. So it is placed exactly as it is, the clip reports the discrepancy in its
own header, and one `filter: brightness(0)` would change it if that is what was
meant.

**The promise that nothing was done to it is measured rather than asserted.** Four
things are read off the element at render: the drawn box carries the file's own
aspect ratio, the computed `filter` is `none`, `object-fit` cannot crop it, and
the sweep the turning square covers clears every platform border on every sample.

**The one thing that touches it is the glitch, and the brief asks for that in as
many words**: an rgb split and the frame's own jitter, for the three frames the
glitch is on. That is a fault laid over the picture rather than a treatment of the
mark. It is also given **0.42 of the split the ink gets**, which came off a
rendered frame: the mascot is a 360px solid disc and 4.5px of fringing on it is a
hairline, but the mark is nine strokes about eight px wide, so the same offset put
a full width red copy beside every one of them and the thing stopped reading as
clay and started reading as pink. And the torn bands are drawn **under** it, so a
band can never cross it.

### 2026-09-02 — the mascot moves, and it is a transform on his zone rather than a second plan

post11's backlog has wanted this since it was written: the mascot big and centred
for an opening, then in his corner for the rest. `lib/mascot.mjs` places one head
once, out of `plan.box` and `plan.size`, and both are baked into the css it
emits.

**The plan is the corner one and the opening is that same plan under a
transform.** post11's exact placement, size 128, bottom left inside the safe area,
which is what every guard in the module is written about. The opening is one css
rule the clip adds at the id level: `.m-zone` carries no transform of its own, so
there is nothing to fight, and the origin is the element's centre, which is also
the plate's centre, so the scale changes the extent and the translate is where the
head goes. **The module is untouched.**

What it costs is that `headRect` no longer answers on its own, because it works
the ink out of `plan.box` and knows nothing about a transform laid over the
element. `zoneRect` composes the two and the clearance guard reads that. The head
is still computed rather than measured, for the module's own reason: a browser's
rect for a rotated shape is the box of its geometry rather than of its ink.

**The opening head is 360 device px, over the module's 220 to 280 window, and that
is a different question rather than a violation.** The window is about a head
sharing a frame with words. A head alone in the middle of an empty frame is a hero
shot. The plan is checked against the window because the corner is where he is for
eight of the ten seconds, and the opening is checked against the platform borders
instead.

### 2026-09-02 — a centred mascot cannot wear the module's thought bubble, and the arithmetic is why

The module hangs the thought off the head's right shoulder, which is right for a
mascot in a corner. Centred it is impossible, and not marginally: the cluster
measures **233 css px**, the frame is **400 css px** wide inside the safe area,
and a head centred at 270 leaves 130 to its right. **There is no head size that
fixes it** — at a diameter of nought the pill still does not fit, because the
cluster is wider than the half frame.

So for that one beat the cluster is re-anchored **above** him, dots trailing down
toward his crown and the pill climbing up and right. It is a translate on
`#m-bubble`, which the module writes nothing to except its visibility, plus a
counter scale back to natural size so the pill is the same physical size in both
placements and the caps floor is the same number in both. Two different bubble
sizes in one clip would read as two different bubbles.

### 2026-09-02 — the opening beat costs 1.62s and every number in it is a floor

`delighted` takes 0.50s to arrive; a bubble may not start before the head has
settled, because a bubble arriving while the head is still moving is two events on
one frame and neither reads; the quick bubble profile lives 0.80s. So the earliest
a thought can be finished is 1.32, and `planMascot` insists a bubble fits inside
its own mark's hold, which puts the next mark at 1.62.

**The cost is that the opening pill is fully up for 0.30s**, because
`BUBBLE.quick`'s hold is floored and capped at the same 0.30 and no amount of room
changes it. The ordinary profile buys 0.42s of full pill and costs 0.50s of clip,
which does not fit inside the brief's ten seconds with this script. It is written
down rather than hidden: counting the fade either side the pill is over half
opacity for about 0.6s at 52 device px of type, and the first caption says
`claude fable 5.1` fourteen hundredths of a second later. It is the one place in
the clip a viewer is asked to read fast.

### 2026-09-02 — four faults in post14 that only a frame could show

Every guard in the file was green on all four.

**The end card was three sizes too big and the address ran off the frame.** The
block carries a `max-width` so the safe area check measures ink rather than the
frame, and at the 100px probe size that clamp is what the measurement returned:
the fit divided 300 by 400 instead of by 557. The clamp comes off while the probe
is up and goes straight back on.

**The last frames of the stretch he is missing from were clean white paper.** The
fault's envelope decays to nothing by nine tenths of the way through, which is
right for a fault that ends and wrong for one that hands over to the next hit. A
window that runs into the next now has a floor under it. The liveness guard did
not catch it because the signature reads the mascot's channels, which go on moving
while he is invisible.

**The mark read as pink.** It was fading in over 0.10s so the fault frames caught
it at a third of its opacity, and it was getting the ink's full split. Its birth
is a frame now and its split is 0.42.

**The mark had stopped turning for the last second and a half.** `GLIDE`'s second
control point sits at one, and **every bezier that ends there arrives at zero
speed** — which is worth knowing on its own, because it is true of every eased
move in this repo that runs to the end of a clip. The turn runs on a bezier whose
second control point is 0.82 instead, so it is still moving when the clip runs
out.

### 2026-09-02 — a chained glitch window, because two windows snapped to a grid do not necessarily touch

post14 needs the stretch the mascot is missing from to have no clean frame in it,
so the first fault has to end exactly where the second begins. Written as two
lengths and snapped separately to the frame grid, they do not: at sixty the
first's own length rounded to 1.633 and the second's start rounded to 1.617, which
is an overlap, and at twelve they happened to meet. So a window may be declared
`chain`, and its end **is** the next one's start, at whatever rate is rendering.

### 2026-09-02 — post14's limiter ceiling wins over the loudness target, and the wav ceiling is lower than the guard

Two mix decisions and both are post12's argument in a new shape.

**The ceiling won.** This read has 17 dB of crest on it, so the last three
decibels of -14 LUFS are bought entirely with limiting: the pass that reaches
-15.5 costs 4.6 dB of gain reduction and every one after it costs a whole decibel
more for a fifth of a decibel of loudness. That is not louder, it is denser, and
on ten seconds of one voice it is audible as pumping. The loop stops at the last
pass inside 5 dB rather than at the one closest to target, and the run prints
which of the two decided the gain.

**And the loop works to a lower ceiling than the guard reads.** The guard reads
the mp4 and the loop writes a wav, and aac is a lossy round trip that overshoots
the samples it was made from: the first render came back at -0.9 dBTP on a file
the limiter had held at -1.0. The loop targets -1.5 on the wav now. Half a decibel
of headroom is what it costs, and it is worth writing down because every clip in
here measures loudness on the mp4 and limits on a wav.

### 2026-09-01 — the mascot gets a hand, and it is opt in because the face is finished

post13 needs him to be *talking*, and the head is a plate and two slabs and the
page spec says so. A mouth is the one piece of anatomy that would turn a face
into a character, so a **hand stands in for one**: two flat slabs hinged at a
wrist, low on the face where a mouth would be, a little off centre, opening and
shutting. That is the yawning emoji's gesture and it reads as a mouth for the
same reason that one does.

**It went into `lib/mascot.mjs` rather than into the clip, and it is off unless a
plan says `hand: true`.** In the module because it is anatomy: a clip that drew
its own mouth would be a clip that invented a face, and the next clip would
invent a different one. Off by default because eleven clips were written against
this module before it existed and none of them should move.

**Three things a rendered frame corrected, and they are the whole design.**

- **The fingers barely move and the thumb does the work.** Opening the two slabs
  by similar amounts makes a chevron, and a chevron on a face is an arrowhead:
  two cuts came back reading as `>` and then as `<`. What a yapping hand actually
  does is asymmetric — the four fingers are held flat and the thumb taps up and
  down underneath, which is why the gesture reads as a jaw at all. Fingers 6
  degrees, thumb 35. It costs nothing in gape, because the gape is the sum.
- **The wrist is on the left and the hand points right**, the way the emoji holds
  it, so the fingertips point across the face and the opening faces the empty
  half of the chin.
- **It is centred two units left of the face's own centre and under both eyes.**
  The first placement was under the left eye with the right half of the chin
  empty and it read as a stray mark.

**The pop curve is the wrong curve for a gesture that repeats**, and that is the
mechanically interesting fault. The first cut opened on `btk.pop`, which is what
every state's entrance arrives on and which the brief's "house easing, small
overshoot" points straight at. Pop reaches 1.1 by 36% of its own duration, so
over an 85ms open at sixty it puts the whole move into **one frame** — measured,
the gape went 0.05 to 0.89 between two consecutive frames. Pop is written for a
move that happens once and is allowed to snap. The open is on `drift` to 8% past
the gape with a second tween bringing it back: same read, same house easing, and
the speed is now a number in a table rather than a property of a curve tuned for
something else.

**The yap is a plan, not a repeat.** Every cycle is written down with its own
times before a browser opens, because a clip puts one syllable of mumble on each
cycle's own start and an infinite gsap repeat has no times in it to read — and
because consecutive marks that both yap have to be one continuous mumble, so the
windows are merged before the cycles are laid across them.

**One thing it does not clear: `surprised`.** That state takes an eye to two and
a half times its height and brings its lower edge to 43.3 grid units, about half
a unit into the fingers at a full gape. Written down beside `HAND` rather than
guarded — no clip pairs a startled face with a talking one, and the honest fix is
a bigger grid.

### 2026-09-01 — "renders unchanged" is two claims, and a hash answers neither

The hand is opt in and the promise attached to that is that every clip written
before it renders exactly as it did. **Proving it turned out to be the most
interesting part of the change**, because "exactly" is two different claims.

**The module half is exact and it is easy.** `demo/out/handoff-diff.mjs` imports
the module as it was — a copy out of git history — and the module as it is, and
compares thirty plans covering every state, both themes, the turn at both ends, a
bubble, a run of bubbles, a card radius, a caption band, post11's seed and
post12's own centred plan. The whole plan as json, **every frame at sixty as
json**, the motion report, the css, the markup, the page plan and both printed
summaries. 9,063 frames, byte identical. The only differences are the three keys
the change adds and each is asserted to be off. `mascotRuntime` legitimately
differs by about 1,700 characters — the page half now looks for a hand element —
and on a page with no hand in the markup that lookup returns null.

**The render half is not exact, because this renderer is not deterministic.**
post12 rendered twice with nothing changed at all comes back with different
bytes. Two causes, both outside the module: headless Chrome's thirty pixel
gaussian behind the head lands a least significant bit either way, and the load
loop spins on a real network fetch for Michroma, so the page becomes ready after
a whole number of virtual steps that is not always the *same* whole number —
which slides the vignette's css animation and re-dithers its gradient.

**Two wrong instruments came first and both gave confident answers.**

*A hash.* It said all thirteen artefacts changed. It says that when nothing has
changed, so it says nothing. Two of the thirteen then looked like a real
regression until the same two changed again between two runs of identical code.

*The worst mse of a pair of runs.* Render four times on each module, compare
every run against every other, ask whether the worst pair across the two groups
is inside the worst pair within them. It said no, and it was wrong twice over.
With four runs a group there are six pairs inside each group and sixteen across
them, so the across side draws from the tail of the same distribution nearly
three times as often. And mse is an average over two million pixels: it goes up
when *more* pixels move by a hair, which is exactly what a re-dithered gradient
does and is not the question.

**The right instrument is the biggest single pixel difference.** A mascot off by
a hundredth of a pixel puts hundreds of counts along the edge of a white disc on
black. A gradient quantising differently puts one or two counts over a lot of the
frame and never more. Over eight renders and 336 still comparisons: two runs of
identical code differ by at most **2 counts of 255**, and runs across the change
differ by at most **2 counts of 255**. Same ceiling both sides. A few per cent
more of the frame dithers across the change — the longer served page biasing that
load loop — and it lands on the vignette rather than on the face.

The lesson is general and it is the one to keep: **before comparing two renders,
find out what the renderer does to itself.** Every instrument here was measuring
a real difference; only the last one was measuring the difference in question.

### 2026-09-01 — a birth is a frame, and the preview could not see the fault

post12's rule is that the wordmark is born on the same frame the mascot is cut,
so the frame exchanges one thing for another and is never empty. It says that by
setting `wmIn` to `END.at` and letting both round to a frame on their own — and
**that only works when the rounding happens to go up.** post12's 4.06 at sixty
rounds to frame 244 at 4.0667, which is after 4.06. post13's 3.49 rounds to frame
209 at 3.4833, which is before — so the head went on 209, the wordmark started on
210, and there was one frame of black with a bloom on it and nothing else. The
exact fault post12 fixed by hand, back again by arithmetic on a different number.

**The twelve frame preview could not see it**: at twelve, 3.49 rounds to 3.5,
which is after, so the preview renders it correctly. It was caught on the sixty
pass by the guard that says the wordmark must be born on the cut frame, which is
written against `frameAt` rather than against the numbers in `END` — and that is
the whole reason it is.

The fix is `onGrid`'s own principle applied to a birth rather than to a burst:
derive the ramp off the cut **frame** rather than off the cut time, at whatever
rate is rendering, starting on the frame before it. Nought on the last frame he
is on, already on for the frame he leaves, at twelve and at sixty, one source of
truth, no rounding to get lucky with. **The general rule, and post12 should get
it the next time it is touched: anything that has to land on the same frame as
something else is a frame index, not a second.**

### 2026-09-01 — post13's slow blink comes off the idle layer, and the arithmetic is why

The brief's eye story is five beats: alive, a slow blink, narrow, droop half
shut, one eye rolls off. Four of them are states or the turn channel. **The slow
blink is not.**

There is no slow blink in the state table on its own — the idle ones are a
quarter of a second and this wants half — and the only one that exists is written
into `unimpressed`, at 0.86 into its own hold. With three marks inside five
seconds that lands at 3.28, which is under the stutters and half torn off by the
hit. For it to finish before the fault starts, the clip would have to run 5.3
seconds against a four to five second brief. A fourth mark costs 1.06s of floor,
which is worse. The arithmetic is not close and it is not a judgement call.

So the blink comes off the layer that already makes blinks. **The plan seed is
chosen rather than default**, out of a search over forty thousand for a first
idle blink that lands inside the neutral beat and sits at the slow end of
`IDLE.blink`'s own ranges. Seed 63 puts it at 0.756s and it takes 0.3635s, within
two thousandths of the longest blink the rig can generate and about half again
the median. Two guards check the time and the length, so a seed changed for some
other reason cannot quietly delete a beat.

It is not a cheat — an idle blink is the mascot's own blink — and `unimpressed`
still does its slow one at 3.40, where the tear catches it, so the last thing he
does before the frame breaks is start to shut his eyes. That is a better ending
than the one that was planned and it is an accident.

### 2026-09-01 — post13's mumble is a formant synth, because a vowel is two resonances

The brief asked for the teacher in an old cartoon: bla bla bla, low, wobbly,
syllable like pulses, never a word. **That voice is a trombone with a plunger
over the bell**, and the thing that makes a noise read as speech is not the
pitch, it is the **formants** — the two resonances a mouth puts on a buzz, which
move while the mouth moves and which are the whole of what a vowel is.

So `mumble` is sixteen harmonics of a 132 Hz buzz, each weighted by two gaussian
windows sitting on `f1` and `f2`, and both windows slide across the syllable.
Slide them from one vowel toward another and the ear hears a mouth changing
shape; hold them still and it is a chord. A filtered oscillator cannot do that,
which is why every other sound in the file is one and this is not.

Four things keep it a mumble rather than a word. It is **low** — the low pass is
1150 Hz, under the second formant of most vowels and well under every consonant
there is, so there is no top end to put one in. It **wobbles**, on two periods
that are not multiples of each other. **Every syllable is a different shape** —
`shape` indexes four vowel moves and the clip walks them. And it has **no
attack**: 20ms in on a raised cosine, because a click at the front would be a
consonant and the moment there is a consonant there is a word.

**And it is on the mouth rather than on a grid.** Each syllable's start is a yap
cycle's start and its length is that cycle's own `voiced`, so the sound lasts
exactly as long as the gesture that makes it, no two syllables are the same
length, and a guard asserts the pairing cue by cue. Same argument as
`cuesFromCaptions`: derived, so there is nothing to keep in sync.

### 2026-09-01 — cutting post12's opening cost a mark, and found two guards reading the wrong thing

The note was to remove the first half second, the fade up out of black: he
should be on screen from frame zero, already idle and alive, with every beat
after retimed. That is what shipped. **5.55s rather than 6.05**, and nothing
came off the back.

**The `neutral` mark had to go with the fade, and that is the part worth
keeping.** `planMascot` will not seat a mark inside another mark's entrance and
exit, and `neutral` costs 1.06s of clock before anything else may start. So
while it was there the arithmetic allowed **eight hundredths** off the front,
not half a second: the note was not implementable with the mark in the plan.

Dropping it is not a way round the module. `neutral` does exactly one thing — it
arrives at rest — and a mascot with no state written over him **sits at rest on
the idle layer already**, drifting, breathing, blinking and saccading from frame
zero. That is what "already idle and alive" describes, and the module gives it
for nothing. The entrance was the thing being cut and the mark *was* the
entrance.

**The general rule: a mark that only arrives at rest is an entrance, and an
entrance is deletable.** If a clip wants a state's *pose* it needs the mark. If
it wants the resting face, the idle layer is the resting face and the mark is
1.06s of clock buying an animation nobody asked for.

**Two guards were reading the wrong thing, and both are fixed rather than
loosened.** Neither is about this clip; both are the kind of guard that passes
until something moves underneath it.

- **A placement guard must not read a frame the idle layer moved.** post12's
  "he is actually in the middle" check compared the head's left and right
  clearance on `headWorst` — whichever frame came nearest a border. The idle
  drift moves him 1.7 css px either way, so *which* frame that is decides the
  answer, and retiming moved it from a frame with no drift on it to one 3.4
  device px along. The clip failed for being alive. It reads `plan.box` now,
  which is the arithmetic the clip actually performs. **Check the placement,
  not a frame of the performance.**
- **A beat derived off a curve needs a test with a floor in it, not just a
  direction.** `hopBeats` took the first *upward* turning point in the window as
  the giggle's first apex. The turns at the head of that window are the handover
  from the state before and the bottom of the crouch, and whether one of those
  wobbles reads as a minimum or a maximum depends on the idle drift's phase —
  which moved when the beats moved. It flipped, the search started on a wobble
  0.99 grid units *below* rest, and the first two bleeps came out 0.067s apart,
  which is one sound with a wobble in it. **An apex is a turning point above
  rest**, by the same three grid units the prominence test already used, and
  with that the three beats and their 0.39 and 0.12 gaps are the ones the clip
  had before the front was cut.

### 2026-09-01 — post12 gets two words on the screen, and a label is a ratio rather than a size

`ai fart`, lower case, over the mascot's head from frame zero to the frame he is
cut on. The first clip here with running on screen text that is not a caption:
it names the thing once and then holds still, because **a feed plays with the
sound off** and this clip's whole joke is in sounds.

**A label is defined against the wordmark, not in points.** "Small enough to be
a label, not a headline, but legible at phone size" is two bounds and both are
guards:

- **A floor on the ink**, in device px, measured off the rendered glyphs of the
  actual string rather than off a cap ratio. A line box is taller than the
  letters in it and what has to be legible is the letters.
- **A ceiling on the type as a fraction of the wordmark's own fitted size**,
  because the two are never on screen together and the only place a viewer
  compares them is across the cut. The first pass was set at 190 css px of box,
  came out at **78% of the wordmark**, and the ceiling is what said that is a
  second headline. It ships at 140, which is **57%** — 27.96 css px, 280 device
  px wide, 44 device px of ink.

**Where it sits is arithmetic on the plan.** Midway between the platform's top
line and the top of his glow, with the head's top taken at the **highest he ever
gets over the whole clip** rather than at his resting height: `surprised` snaps
him up, and a label placed against where he usually is would be crowded by the
one beat that matters. That is 191 css px, clearing the safe area by 400 left,
350 top and 400 right and clearing his glow by 170 device px. Move him or resize
him and the label moves with him.

**It needs no layer of its own.** It lives inside `.stage`, so the shake is
already on it, and it carries the rgb split under the same `data-gl` attribute
the mascot and the wordmark use — so the three stutters tear at the pair of them
together, on one shake and one split. On the hit frame both are cut and the
wordmark is born in their place: the frame exchanges one thing for another and
is never empty, which is the rule the cut already had.

### 2026-09-01 — post12's fart is a pulse train, and "it reads as a buzz" was a measurement

The first fart in post12 was a sine falling from 96 to 58 hertz with a fixed 38
hertz tremolo on it, low passed at 380. The note back was that it does not sound
like a fart, it reads as a buzz. That is a fair description of what it was, and
it is also **measurable**, which is the whole reason the rebuild could be aimed
rather than fiddled with.

**A fart is not a tone with a wobble on it.** It is a membrane chattering: a
slack aperture opening and closing under falling pressure, the same mechanism as
a lip trill, a kazoo or a duck call. The flutter *is* the fundamental rather than
a modulation of one, and the thing that makes it read as a body rather than as an
oscillator is that the chattering is **irregular** — no two cycles the same
length or the same loudness. A sine with a perfectly periodic tremolo has none of
that, so the ear hears a synthesiser being modulated, which is what it is.

So it is a pulse train, and four things in it are unsteady: the pitch falls in two
stages (a third of the way, then steeply, which is the pressure running out);
every cycle gets its own period; every cycle gets its own loudness; and a slow
wobble sits on top. The waveform is a raised cosine pulse of 28% duty, because a
narrow smooth bump has a long gentle harmonic series (a buzz) where a square has
the same series with an edge on it (a raspberry). **No noise at all**, which is
what keeps it comic rather than gross — the wet broadband hiss is the whole of
what makes a real one unpleasant. The low pass went **up**, 380 to 660: the old
ceiling was hiding the harmonics that make it a buzz in the first place.

The five numbers this is judged on, one per clause of the brief, measured off the
rendered buffers:

| variant | len | pitch | drop | jitter | harmonics | tail | >1.5k |
|---|---|---|---|---|---|---|---|
| the old sine | 0.30s | 100 to 63 | 1.58x | **2.5%** | **2/12** | 28% | 0.43% |
| `parp` | 0.34s | 69 to 42 | 1.66x | 10.8% | 6/12 | 5% | 0.72% |
| `puff` | 0.22s | 88 to 62 | 1.41x | 7.7% | 4/12 | 5% | 0.69% |
| **`sputter`** | **0.46s** | **79 to 42** | **1.91x** | **14.0%** | **6/12** | **8%** | **0.86%** |
| `wobbler` | 0.38s | 79 to 47 | 1.68x | 20.3% | 6/12 | 9% | 1.08% |

The old recipe's two bold numbers are the diagnosis: 2.5% jitter is a synth tone
and two harmonics is a sine with a partial on it.

**`sputter` ships** and is what `VOICES.fart` defaults to: the same recipe cut
into two bursts by a gate — a short one, a fifty millisecond gap, then a longer
one that collapses — because a real one very often does not come out in one
piece, and that is the most recognisable fart *gesture* in the set. It also wins
the brief's own three clauses on the numbers. `wobbler` is more irregular and
that is the argument against it: past about fifteen per cent a pulse train stops
reading as a body and starts reading as a motor with a bearing going.

All four are written to `demo/out/p12-fart/` on every render, regenerable and
gitignored. **Nothing in this pipeline can hear**, same as with the hi: these are
proxies for funny, not measurements of it, and a person who listens and prefers
`wobbler` is right.

**One trap in the preset table, worth remembering because it will recur.** The
function's defaults are `sputter`'s, so a preset that leaves a field out inherits
sputter's value for it — and the field that matters is the gate. The first cut
left `gate` out of the other three and all three silently came apart into two
bursts, which showed up as parp's measured jitter jumping from 10.8% to 13.1% and
puff's from 7.7% to 29.1%. A gate is a discontinuity and a discontinuity reads as
irregularity to any meter pointed at it. **Every preset now carries every field,
`gate: null` included: a preset is a whole recipe, never a diff against another
one.**

### 2026-09-01 — post12's glitch builds, and the duty ceiling gets a scene level exception

The note was that the transition into the wordmark needed to be much harder and
longer. Three stutters now run under the laugh at 4.22, 4.34 and 4.46, at 32%,
52% and 78% of the heat, and the hit is 0.37s rather than 0.23. (**Every time in
this entry is this pass's.** The opening was cut afterwards and all of them moved
up 0.50s: the stutters are at 3.72, 3.84 and 3.96 and the hit is at 4.06. Nothing
else in here changed.) `force` is a
multiplier on the same envelope driving the same channels — a build up written as
its own mechanism is a second thing to get out of step with the first.

**The build up escalates in kind, not only in amount, and that is a fault this
pass paid for.** The first cut let all three stutters throw three tear bands
each. A tear band paints the page colour and redraws **the wordmark** shifted,
and the wordmark is the only thing in that frame with a second copy — the mascot
is one dom subtree driven by ids out of its own module and cannot be duplicated.
So before the hit a band is not a tear, it is a black bar over a head with
nothing behind it, and three of them at 78% heat over a 139px head left **a grey
haze with no subject in it.** Second time on this clip a fault rendered as an
empty frame and every numeric guard was green on it. Bands are the hit's now:
before it the signal wobbles, at it the frame tears.

**The duty ceiling has a named exception and it is this scene only.** post11's
ceiling is 30% of a scene's frames. post12's whole fault lives in the last two
seconds of it, so against the file it is under a tenth however you cut it, and
the number worth defending is the **local** one. The guard measures the fault
against the ending it lives in — first stutter to last frame — and holds it to
the same 30%. It measures 26.4%.

It is measured **at sixty whatever rate is rendering**, which is the same
argument `mascotMotion` makes about anticipation and entry: at twelve a fifty
millisecond stutter is rounded up to a whole 83ms frame, two thirds longer than
it is, and the first cut of this guard failed the clip at 31.8% for the preview's
arithmetic rather than for anything in the design.

**Everything went up except the flash, and that is now a guard.** The shake, the
split, the band travel, the band count and the noise all rose. The white flash
did not, and there is a check saying there must be **exactly one white frame in
the clip** — not "at most", not "at least". Three stutters plus a hit is four
chances to put one on the screen and four white frames inside a third of a second
is a strobe: a thing platforms flag and a thing that hurts to watch. **"Much more
glitchy" is not a licence to strobe**, and that sentence is the rule, not this
clip's numbers.

**And a burst is a length in seconds quantised to whatever frame grid is
rendering**, which is post11's rule and which this clip needs more. A fifty
millisecond stutter is three frames at sixty and six hundredths of a frame at
twelve: written as seconds and left alone it would not happen on the preview at
all, and a beat that is in the master and missing from the pass it was judged on
is the one fault a preview cannot show. Every window is snapped and a guard
asserts each fires on at least one frame at **both** rates.

### 2026-09-01 — a still has to be a frame the clip actually has

Small, and it cost twenty minutes twice. post12's verification stills were asked
for at times taken from the config — `END.at`, and so on — but the glitch windows
are snapped to the frame grid, so `END.at` — 4.56 then, 4.06 since the opening
was cut — is 4.5833 at twelve. A still asked for at 4.56 therefore landed a frame
early: after the head is cut and before the wordmark arrives, which rendered as
an **empty frame that does not exist in the film**. It looked like a fault in the clip and was a fault in the
still.

The rule that came out of it: a still rounds the time it was asked for to a frame
index and then draws **that frame's own instant**. Anything computed from `f` and
anything computed from `t` then agree about which moment it is, which they cannot
if the two are allowed to differ — and on this clip they differ by design,
because the glitch is a function of the frame and everything else is a function
of the time.

### 2026-09-01 — post12's limiter gets 1.5 dB after all, and why that is not a reversal

The first cut of post12 gave the limiter nothing and the bus landed at -18.4
LUFS. The second cut added three stutter sounds and a longer fart, which pushed
the raw peak up and the allowed lift down, and it landed at **-20** — every
change to the picture was quietly making the file quieter.

The peak in this clip is one thing: the eight millisecond noise transient at the
top of the `glitch` hit, two decibels over everything else. That is exactly what
a limiter is for and exactly where 1.5 dB is inaudible — the look ahead has it
before it arrives and the whole burst comes down together, so it is 1.5 dB
quieter rather than a different shape, and what it buys is the same 1.5 dB on
every other sound in the file. It lands at -18.7 LUFS, true peak -1.7 dBFS.

Three and a half decibels was refused on this argument and one and a half is
accepted on it, which is not a contradiction. **The question was never whether to
limit, it was how much of the balance in `GAINS` a limiter is allowed to have an
opinion about.**

### 2026-09-01 — post12: the hi is synthesised, not spoken, and the numbers say why

The brief asked for the greeting to be built twice — as a synthesised bleep and
as an edge tts "hi" pitched up and bit crushed — and for whichever is cuter to
ship. Both were built: the bleep, four tts takes on "hi" at 1.45x to 1.95x, and
three on "hi?" at 1.55x to 1.8x with the pitch pushed, because a question mark is
the only handle a neural voice gives you on a terminal contour.

**The bleep ships**, on three arguments and none of them is taste.

**It is the shape that was asked for.** The brief says *two tone* rising. A
neural voice saying "hi" is one glide, and it falls: 0.65x across all four takes,
which is what a statement does in english and is why they read as resigned rather
than as a greeting. The question mark buys the rise back — the best take reaches
1.26x against the bleep's 1.53x — and it is still one continuous glide with no
gap in it, so there is no way to make it two notes without pitch bending it into
them, at which point it is not the tts take any more.

**It stays inside the house ceiling.** Every tts take carries six to eight per
cent of its energy above four kilohertz, which is sibilance plus the crusher's
own aliasing. Every sound in `lib/sfx.mjs` is low passed under 3.8k on purpose
and it is the reason the set sounds like one set. The bleep measures 0.0%.

**It costs nothing to render.** The tts path is a network call to an
unauthenticated microsoft endpoint plus a cached wav on disk, for a two hundred
millisecond sound, in a clip that is otherwise reproducible from source with no
network at all. Third argument, same direction.

**And the thing the numbers cannot settle, said plainly: nothing in this pipeline
can hear.** The video-review skill says so about itself and it is true here too.
A pitch contour, a spectral centroid and a top end share are proxies for cute,
not measurements of it. The above is the case for the bleep on the evidence
available. **A person who listens to both and prefers the tts take is right and
this is wrong** — the takes are left in `demo/out/p12-hi/`, which is
regenerable and gitignored, for exactly that.

### 2026-09-01 — post12's mix: the peak ceiling wins, and the loudness target is not a target here

Every clip before this one mixes a bus under a voice and scales the pair to -14
LUFS. post12 has no voice, and `mixdown` is the wrong tool because it exists to
put a bus under a read.

The bus came off the synthesiser at -39.6 LUFS with its peak at -23 dBFS, so
-14 wanted **25.6 dB of lift**, which puts the loudest sound two and a half
decibels over full scale and asks the limiter to take three and a half back. On
a clip that is five transients and nothing else, three and a half decibels of
limiting is not glue — it is the glitch losing its snap and the fart losing its
edge, and the whole point of the balance in `GAINS` is the relationship between
those five sounds. A limiter working that hard is a second opinion about it.

So the bus is **peak normalised** to -1.8 dBFS, the limiter does nothing, and the
integrated figure lands at **-18.4 LUFS**. That is the honest description of a
clip that is silent for three quarters of its length: every platform normalises
on the same measure and will lift it back, and the loudest single event is still
sitting where it belongs. The file reports "the ceiling won by 4.40 dB" rather
than hiding it, and guards a floor of -20 so "the ceiling won" can never quietly
become "the clip is inaudible".

The sample ceiling is 0.8 dB under the true peak ceiling on purpose, and it is
post5's lesson restated: a sample peak limiter does not hold a true peak, and aac
adds its own overshoot. Measured on the finished mp4, the true peak is -1.8 dBFS.

### 2026-09-01 — three faults in post12 that every guard was green on

Worth keeping as a set, because they have one shape: **a number that is correct
about geometry and wrong about what a frame looks like.** All three were found by
opening the 12fps preview's own stills, which is exactly the case
`skills/video-review/SKILL.md` exists for.

1. **The fart was invisible.** The puff blobs were born inside the head's own
   thirty pixel glow and the fastest travelled a hundred css px against a sixty
   nine px head radius. Every clearance number was fine. What rendered was a
   smudge that read as the glow leaking downward. Fixed by moving the origin
   outside the halo and by making **distance the parameter rather than
   velocity** — a velocity plus a life multiply into where the blob ends up,
   which is the only thing the safe area cares about, and with distance as the
   parameter the longest lived blob cannot quietly become the one that leaves the
   frame.
2. **The glitch frame was an even grey card.** A full frame white rect at 0.40
   with a screen blended noise layer over it, on a frame where the head had
   already been cut and the wordmark had not yet arrived. It is a 420px radial
   bloom at 0.30 now, the noise ceiling came down, and the wordmark is born on
   the same frame as the cut so there is never an instant with neither of them on
   screen.
3. **One giggle bleep was on nothing.** Hop beats were read off turning points in
   the head's y with no prominence test, and a tween handover writes its own
   `from` value: where one tween settles past where the next starts, the curve
   steps by about half a device pixel, and a step is two turning points. A turn
   now only counts if it is three grid units from the last one that did — the
   hops swing twelve and seven, the artefact swings one.

### 2026-08-31 — the final review is run by sub agents, and the frames never reach the caller

`skills/video-review/SKILL.md` has always said it: read the frames in batches of
eight to ten, and **if the caller has asked for sub agents, hand each batch to
one and have it return text only**, so the images never enter the main context.
Until now every review in this repo has been read directly, because every clip
was short enough or the pass was narrow enough to fit.

post11's final review is not. Two variants, 47.03s each, a dense pass on the four
reworked beats — the opening scenes, the report beat, the chalkboard and the end
card — and a coarser pass over the site stretch between them. Read directly that
is more pictures than one context holds, and the failure mode is the bad one:
running out half way through and leaving a verdict that covers the beats that
happened to be read first.

So the finals are reviewed with **one sub agent per batch, text back only**. Each
returns the second, what is on screen, any caption text it can read, and anything
that looks wrong. The caller synthesises the timeline, the checklist and the
findings from those reports. **The frames are never in the caller's context at
all**, which is the trick the upstream skill was built around and is worth about
ninety per cent of it.

Two things this does not change. The review is still **judged on the frame rather
than on the run's own numbers** — a sub agent reporting what it sees is still an
eye, and the skill's rule that the frame wins over the log stands. And it is
still **the finals that get reviewed**, not the previews: the shutter is shut in
a preview, so motion blur, the torn bands and the brick landings cannot be judged
from one.

### 2026-08-31 — post11's four rounds: an opening that is type, a full stop, a page built out of blocks, and a chalkboard

Four briefs in a row, all of them `demo/post11.mjs` only, no new files.

**The opening.** The card box was empty for the first four lines and it now
carries four type scenes. The thing worth writing down is the handover: the
window is `planSite`'s own card fade record **taken by reference**, so the four
crossfades and the one cut in the clip cannot come apart, and the guard checks
identity rather than two hand written numbers agreeing. Inside it the exchange is
0.16s at 60% of the window and complementary, so the sum is one at every instant.
The first cut faded over the whole 0.52s and a rendered frame showed `BUSINESS`
and `NEED` both legible on top of each other for six frames. **A dissolve long
enough to read is a double exposure, not a handover.**

**The heads lost their faces.** Five poses off the mascot's own state table read
as five identical dots at 128 device px, then as a rendering fault once they were
pushed. The answer was not better poses, it was **fewer things**: eyes, brows and
the pose table out, `AI` in, at 80.0 device px of cap. The rule the brief set —
grow the head before you shrink the letters — is now the failure message on the
guard.

**The domain, fourth attempt.** Three rounds had assumed the `the` was being
swallowed. The waveform said it was there and loud enough and that the **gap in
front of it was 15ms, the same as every other gap in the run**. It was a grouping
fault, not a level fault, which is why three rounds of slowing the rate had never
touched it. A full stop puts 503ms in front of it and **raises** it to 0.8 under
the loudest word, because the synthesiser restarts the phrase after one. The
lesson is the older one this repo keeps relearning: **measure the take, do not
read the string.**

**The report beat.** Two events instead of one picture: type taking a hard fault,
then a page sliding in and building itself out of six blocks. Two first cuts
failed on the same shape of mistake — **the page was on the same stagger as its
own contents**, so the slide had nothing to slide, and the slide used `POP` over
0.30s, which puts most of its travel in one frame at twelve. Both are the same
lesson: an entrance is only an entrance if there are frames in it.

**The chalkboard.** Five drawn pictograms were dropped because five line drawings
in a row read as an icon set rather than as an argument. What replaced them is a
mind map where **nothing is a clean vector** — ovals overshoot their ends, lines
bow, the box is four crossing strokes, and one fractal noise displacement filter
does the chalk texture and roughens the letterforms so the type reads as written
without a handwriting face this repo is not allowed to load. Six labels against
four spoken things: the three that are named land on their word, the three that
are not sit at a named fraction of the gap between the anchors either side.

**Two bugs the guards found, and both were invisible to the eye.** Burst frames
placed with `Math.round` against a visibility test of `>=` fired **before** their
own block existed, and three of five shapes rendered with no glitch at all.
And the `AI` cap was measured through a bounding rect on a rotated element,
which is the axis aligned box of a rotated square and eight per cent too wide;
`getScreenCTM` divides the turn back out. **A number nobody checks against a
second method is a number nobody has checked.**

**Two sounds now live in a post file.** `lib/sfx.mjs` carries the recipes more
than one clip uses; a stuttered fault and a stick of chalk are built in
`post11.mjs` from the same primitives and handed to the bus through the same
report. The day a second clip wants a glitch is the day it moves. That is a rule
about where a thing lives, not a workaround.


### 2026-08-30 — post11, the explainer: the site in a card, and a camera that lied

The eleventh clip, the first built on `lib/mascot.mjs`, and the first that puts
the live site **inside a card** rather than filling the frame with it.

**One composed page, not four passes, and that is the whole architecture.**
post9 loads `index.html`, puts a camera and a caption layer on top of it, and
cuts to a composed page for the beats that are not the site. That is right for a
film whose site shots are full bleed. This clip is not that: the site is a card
in the middle of a white frame with our own type under it and the mascot in the
corner, and **the mascot has to be alive on every frame including the site
ones** — which a cut to a different document cannot do. So the site is an
**iframe served from the same origin** inside a clipped card, and the camera is
a transform on the iframe element. One page, one clock, one render pass, no
cuts. `index.html` is loaded byte for byte as it is in git and nothing is
injected into it for the framing.

**The crop is the framing, and it is why the nav is gone.** The site's top bar
is `position: fixed`, so it sits at the iframe's own top whatever the camera
does, and the card never shows the iframe's top sixty css px. That is arithmetic
rather than a promise and it is guarded: the nav was inside the card on **0**
sampled frames. Everything below the hero is laid out `display: none` for the
film, which turns "who we are never appears" from a thing the numbers happen to
give into a thing that cannot happen.

**The camera and the picture disagreed by 251 px and every number said they
agreed.** This is the one to carry forward. `element.focus()` scrolls the focused
element into view in **every scrollable ancestor it has**, and an
`overflow: hidden` box is a scroll container — so focusing a form field inside
the iframe scrolled the card in the *outer* document, across the frame boundary.
A camera that is a transform reads nothing that moved, so the send shot resolved
correctly, was written correctly, and rendered a quarter of a page lower: the
last thing the clip showed was an empty card with a button at the top of it.
Both scrolls are pinned next to the transform now, and **the render measures the
rendered window against the camera it wrote on every sample and fails if they
differ by more than a pixel and a half.** That check is the reason this is an
entry rather than a shipped clip, and it is the same shape as the parity check
`lib/pictograms.mjs` runs between its two gsap clocks.

**`document.fonts.check(font, text)` does not answer whether a face can set a
string.** It came back **true** for Space Grotesk on `привет`, and Space Grotesk
ships latin and latin-ext and no cyrillic at all: it answers whether the faces
needed are *loaded*, and a browser that is going to fall back still says yes. It
is measured instead — the string laid out in one family with no fallback list
and again in a family that does not exist, and two identical widths are the
fallback twice, with a latin control so a probe that cannot tell two faces apart
cannot pass. Measured: **291.75px in Space Grotesk against 291.75 in the browser
default**, so the pill drops to the mono stack, which measures 351.56 and renders
**36 device px of cap** against a 32 floor. The fallback is `index.html`'s own
all-or-nothing rule applied per bubble, not a new font: **no fourth family was
added and the font budget did not move.**

**The face that actually sets it is `Cascadia Code`, and that was measured per
candidate rather than assumed.** `--mono` lists nine families and the stack as a
whole comes back at 351.56; walked one at a time against the 291.75 the browser
default gives, `ui-monospace`, `JetBrains Mono`, `Roboto Mono`, `SF Mono` and
`Menlo` all fall back, `Consolas` and the bare `monospace` keyword set it at
329.88, and `Cascadia Code` and `Cascadia Mono` set it at 351.56 — which is the
stack's own number, so **Cascadia Code is the first present family and is what
renders `привет` on this machine.** It is a windows font and it is not ours, so
the honest way to say it is that the mono stack sets cyrillic wherever the stack
has a face that can, and here that face is Cascadia Code. A machine without it
falls to Consolas and the bubble still sets.

**The captions run over all fourteen lines, including the site beats, and that is
Einz's call rather than the brief's default.** The brief names the caption style
only for the type-on-white lines, which reads as the site being the screen on its
own beats — and would have left a viewer with the sound off getting seven of the
fourteen lines. The cost is vertical: the site card is 420 css px tall rather
than the ~520 it could have been, so that the band has a fixed home clear of both
the card and the mascot's corner. **One band, ink at 572..620, and it does not
move for any beat in the clip.**

**The page's own zoom ceiling is what shapes the button beat.** `index.html` is
laid out edge to edge and the subline is the widest line it sets, so a frame
narrower than it with it in shot cuts its first and last letter — post9 rendered
THE BORING TEK as SHE / 7/RING / MEK doing exactly this. post9's answer was to
frame *around* the subline, and that answer is not available here: the band
between the subline and the first section below the hero is about 120 page px,
so a frame that clears it at the top reaches the sections at the bottom. So the
button shot frames the group from the h1 down to the cta zone at **1.164**, and
what makes the button large is that the site's own mascot travels out of the top
of the card. Two more framing rules came off rendered frames: a fit is on
**both axes** (on width alone the lockup framed at 1.10 and cut the mascot's
crown and the hint line), and **no line of the page may be cut in half** — the
frame is pushed clear of the h1 and the subline instead.

**The form is really filled in and the send is really a send.** Six taps, all
real presses inside the card, and the page does the routing: a single pick chip
advances itself after 240ms, `check my business` routes to the multi pick step
that gives the two ticks and then to the free text box that gives the typing. The
three languages are switched through the page's own handler rather than by a tap,
because the language buttons live in the top bar and the crop excludes it — the
form's copy re-renders, the russian page drops to the mono stack the way the
spec says it must, and the ticks survive the switch. The last two steps are done
off camera during the line that is type on white, and they are done for real.
**Exactly 2 posts intercepted; nothing left the browser.**

**The delivery is fourteen takes, one per line, and the brief's thirty seconds
lost to the brief's exact script.** One `speak()` per line with its own `rate`
and `pitch` in the ssml prosody tag: **2.01 to 5.57 words a second** against a
flat 2.3, light lines near the neural default, the two jokes slower and lower,
the close slowest at `-16%`/`-3Hz`. The takes are laid on one clock with the gaps
**measured on the waveform**, and two of them are not breaths — 3.90s where the
typing happens and 2.20s where the confirmation lands. The script is eighty six
words and marked exact; read at a pace a person would use that is about thirty
five seconds. Nothing was cut and nothing was rushed to hit a number.

**The line ends are marked so no card straddles a screen beat.** Fourteen short
lines with almost no punctuation cut `dot com press`, `job send it` and `time and
some` — post10's `do it we` again, and worse, because the picture changes
underneath a card that is holding two beats. A comma goes on each line's last
word, on the caption's copy only and after the synthesiser has spoken, and
`punctuation: 'drop'` takes it off before a card is drawn. What the marks cannot
fake is checked separately: the drawn word sequence against the spoken one, and
no card allowed to straddle two lines.

**And it cost `lib/mascot.mjs` one addition, which is opt in.** A mark may carry
a **list** of bubbles instead of one, on a shorter profile — see the entry below.

### 2026-08-30 to 08-31 — post11, six rounds of fixes, and what each one settled

Six things came out of watching the first cut and the list turned into three
rounds, and two more the next morning for the copy and the last of the silence. Everything below is in
`demo/post11.mjs`, `demo/lib/voice.mjs` and `demo/lib/sfx.mjs`. **The clip is
46.47s and it is rendered and checked at 12fps only; the 60fps master has not
been run.**

**The script as it stands, nineteen lines**, because every round moved it and a
list is easier to check than a paragraph:

```
 1   0.30..2.35    white   ai for business is everywhere now
 2   2.63..4.80    white   some people do not know why they even need it
 3   5.01..7.33    white   some know exactly, but have no time
 4   7.75..9.60    white   and some just need one small thing done
 5   9.93..12.32   site    go to the boring tek, dot com
 6  12.64..13.32   site    press the button
 7  13.85..15.26   site    it does not cost you anything
 8  15.56..16.98   site    answer a few simple questions
 9  17.26..19.74   site    in english, russian or latvian
10  20.02..20.93   site    then type what you want
--  21.23..24.10   site    i want ai to do my job but keep my salary  (comedy voice, uncaptioned)
11  25.40..26.59   site    how big your business is
12  26.89..28.85   site    your name and your registration number
13  29.13..31.65   site    your website, where you are, and your email
14  31.99..32.35   site    send it
15  33.24..33.52   site    done
16  34.33..36.38   white   in one or two days you get your report
17  36.75..37.83   white   and if you want it built
18  38.06..42.66   white   we do apps, websites, research, graphic design, or one small job
19  42.97..44.69   white   we sit between you and ai
```

The cut hangs off it: send tap 32.69, the tick 33.24, the reframe onto it
33.28..33.62, the card's exit 34.09..34.31, the end card from 42.67. Outputs are
**`demo/out/post11-light-1080x1920.mp4`** and **`post11-dark-1080x1920.mp4`**,
both **46.47s**.

**1. The domain read, and it took three attempts.** The script says **`go to the
boring tek, dot com`** at -18%, and the caption draws `theboringtek.com`. The
comma is the whole of it, and the three forms were compared on measured word
timings rather than argued about:

  `theboringtek dot com`     one 0.93s run for twelve letters, no word boundary
                             inside it and therefore no pacing inside it. this is
                             the original fault and a slower rate only lengthens
                             the run.
  `the boring tek dot com`   five units at an identical 0.015s apart, so the name
                             does not group and nothing separates it from the
                             suffix. it reads as five items on a list.
  `the boring tek, dot com`  a **0.244s gap** after `tek` against 0.015 elsewhere,
                             and `tek` held at 0.50s rather than clipped at 0.35.
                             two units, a name then a suffix, which is how a
                             person says an address. **kept.**

`SAY_AS` matches on **bare words**, so the collapse works with or without the
punctuation the delivery needs and would go on working if the mark ever changed;
the comma never reaches a caption because the collapse happens before
`cardBreak` sees the line.
The guard was **taught the exception rather than loosened**: `SAY_AS` names the
line, the run of spoken words and the string that replaces them; `markLines`
collapses the run into one drawn word carrying the run's own start and end;
`guard` applies the same substitution to the **spoken** string before comparing,
so the check still starts from what came out of the synthesiser. And the
exception has to fire **exactly once** or the render fails, because an exception
that quietly stopped matching would take the guard with it. That last clause is
the part to carry to the next check of this shape.

**2. The comedy voice, and it changed twice.** `lib/voice.mjs` gained a fourth
slot for the one line in the clip that is not ours: the sentence somebody in
front of the form is typing. It shipped as `wry` = `en-IN-PrabhatNeural`, indian
english, read deadpan, and **that was the wrong call and was replaced the same
day**. The reasoning is worth keeping: a clip whose whole register is plain does
not want its one joke marked out by an accent, because then the accent is the
joke rather than the line. It is `aside` = **`en-US-JennyNeural`**, a us woman,
`comedy: true`, read light and warm at -14%. It is female on purpose and that is
the second half of the same argument: the three narrators are all male, so the
one voice that is somebody else in the film is audibly somebody else on the
first syllable with nothing to do but be one. `NARRATORS` is every voice not
marked comedy. **The english only rule settled 2026-08-27 never moved**: it is
about language, and both of these were english.

**The hand is cut to the read rather than to a number.** The typing window is
the comedy take's measured sound length, so the last keystroke lands on the last
syllable without either being told about the other, and the hole line ten
carries is derived in `main()` rather than typed: `gap: null` in `LINES`, and a
`buildVoice` that refuses a null gap so a derived number nobody derived stops
the render instead of looking like a timing choice.

**3. The missing sounds.** `key` and `press` are two new recipes in
`lib/sfx.mjs` (see the entry above) and the confirmation is `ding`, which was
already written as "a check being drawn". **One tick per four characters, not
per keystroke**: forty three sounds inside three seconds is a rattle. The typo
and the backspace always get their own, because they are the two moments the
rhythm breaks. Each of the four field fills carries three ticks of its own.

**4. The ending, ordered three times before it was right.** It is now **send
tap, the tick, the report, the offering, the end card** — the report answers the
press because it is what the press buys, and the pitch lands last with the frame
to itself. The first cut had the offering before the send; the second had it
between the tick and the report.

**And the offering is a second service rather than a description of the
report, which is a copy fix and it is the one worth remembering.** The list used
to follow `in one or two days you get your report` with nothing between them, so
a viewer heard the report and then four nouns and drew the obvious inference:
that the report *is* the app and the website and the research. It is not. The
report is the free look at your business; building the thing is the other half
of what we sell and the half somebody pays for. So a line was put in front of
the list to say a second thing has started: `and if you want it built`, then
`we do apps, websites, research, graphic design, or one small job`.

**Two lines rather than one, and that is the file's own rule rather than a
preference.** Written as one sentence it is sixteen words, nearly twice the
longest line in the clip and about seven seconds of unbroken speech, against a
script whose whole shape is short lines with full stops. The setup line runs at
**-20%**, the slowest in the file after the close, because six short words
synthesise fast whatever the rate says and at the ordinary pace it went by in
under a second and landed as filler.

**Moving the send in front of the offering took away the white beat the form
used to be finished behind**, so the last two steps are on camera. And the
confirmation reframe **leaves on the tick rather than after the card has
finished growing**: the sent state is a much shorter card than the last step, so
waiting rendered `start again` alone at the top of the frame for four frames.
Leaving early measures a card that is still shrinking, which is a small error
the drift closes, against a framing that is entirely wrong.

**5. The corner mascot, and it ended up carrying the opening.** No
`unimpressed` anywhere in the clip: it sat on `have no time`, it was the right
read of that line and the wrong read of the film, and a corner character who
pulls a sour face at the viewer's problem is not somebody you then ask to build
you something. `thinking` does that work now. `agreeing` is kept for the close
alone, because it is the one state that earns a `ding` and the ding has to keep
meaning yes.

Twelve marks and **seven bubbles**: `hmm...` while the problem is still being
described and `interesting` on the line that turns it into something we can do,
plus the three greetings, `nice` and `finally`. The turn is set over the opening
only, out to 0.58 and back to the 0.35 resting bias before the card arrives.

**6. The empty top of the frame, and it is empty on purpose now.** It was the
one dead region: 0.00 to 9.51s with nothing above the caption band. Einz picked
the pictogram scene layer over bringing the card in early, it was built, and
then **it was taken out again in the next round and the space is his to fill.**
`lib/pictograms.mjs` is not imported. What carries those four lines is the
mascot, which is why the opening is his.

**And the silent stretch, which was the fault the third round existed for.** The
form used to finish itself with no words over it — first behind a fade, then in
plain sight, and both were the same thing dressed differently. **The voice stays
with the form now**: three lines cover the size step, the name and registration
number, and the country and email, and every field is filled **on the word that
names it** through `wordAt`. The registration number is named and never read,
because a synthesiser reading eight digits is thirty seconds of nothing and a
number said aloud is a number somebody will try to write down.

**It is a guard rather than a claim, and it has got narrower twice.** There
used to be two named holes and the second of them was allowed to run three
seconds while a check mark was drawn in it. Then there was **one** hole allowed
to be long, the one the hand types in, and everything else under 1.70s. Now the
two numbers are **separate, because they were never measuring the same thing**,
and both are tighter than the one they replace: `HOLE_MAX` is **1.20s** for any
hole that is not the typing one (the longest is the 0.95s the send is pressed
in), and `TYPE_TAIL_MAX` is **1.50s** for how far the typing hole may run past
the last keystroke (it runs 1.33s). 1.70 was a number left over from when the
confirmation sat in silence, and it was only ever answering both questions by
accident.

**And the hole after `done` is 0.80s where it was 1.60.** It felt dead sitting.
It was paid for **at both ends of the tick rather than out of the tick**: the
reframe onto the check mark is 0.34s where it was 0.48, and the card's exit is a
0.22s fade starting 0.24s before the report where it was 0.38 starting 0.40. The
check mark is never cropped, never scaled and never cut short — it holds at full
size for about three quarters of a second on both themes. The mascot's `curious`
at the tick now runs **through** the card leaving rather than levelling off
before it, because the room it had was halved and a state cut off half way
through its own exit is something `lib/mascot.mjs` refuses outright. The render also fails if a digit ever reaches the script.

**And the confirmation is checked positively rather than by length.** `done` is
one word from the narrator and it lands **on** the check mark, not after it, and
the press is timed **backwards** through the stub to make that true: `sendAt` is
`done`'s own start minus `STUB` minus a frame, so the tick and the word arrive
together whatever either take turns out to be. Three things are asserted around
it: the tick falls inside some beat's own sound, the press never resolves before
`send it` has finished, and **`STUB` agrees with the 480 in `injected()`** —
read off that function's own source, because the two live in different worlds
and a stub that quietly got slower would slide the tick off the word with
nothing to show for it.

**The end card is the logo as it is actually drawn.** THE / BORING / TEK stacked
on three lines with the address under it and nothing else. Stacking is what
makes it big: on one line the wordmark had to fit 300px of a 540 wide frame,
which is michroma at 25px; the widest stacked line is `BORING`, so the same
width buys 59px. It is **centred as a group and the centre is measured**, not
typed: `build()` measures both blocks after the face has loaded and places them
either side of `centreY`. `centreY` is the middle of the room **above the
caption band** rather than the middle of the frame, because the last line of the
clip is still being captioned into that band while the card is up.

**What is outstanding, and none of it is started.**

- **The opening motion pass.** The mascot should play **big and centred above the
  caption band through the opening**, up to and including the domain line, then
  **glitch out of the centre and glitch back in at the bottom left corner on the
  button tap** — hard cut, a short burst, rgb split and jitter, post10's glitch
  language — and work from the corner unchanged after that. **Not begun**, and it
  is not a retime: it needs a per frame transform on `.m-zone` driven from node,
  the head, bubble and band guards re-pointed at DOM measured rects instead of
  `headRect`'s plan geometry so they still describe what is on screen at the
  larger size, and post10's glitch read across. **The mascot's placement wants
  another look either way.**
- **The 60fps pass.** Both variants are rendered at sixty and green as of
  2026-08-31 — see the Status bullet for the numbers — and **neither has been
  reviewed at sixty.** Every number in this entry was measured off a 12fps
  preview and the geometry and type numbers are unchanged by the frame rate.
- **A posting pack and a track**, both still owed.

**What the reviews found and did not fix.** In
`demo/out/review-post11-1080x1920.md`. **One frame at 31.67s** where the camera
is still bottom aligned on the last step and the page has already swapped to the
sent card — the lesser of the two options above, and worth a look at 60fps.
**1.33s at 23.90..24.97** with no caption and no voice, which is the tail of the
typing hole and holds the mascot's `nice` bubble and the press that opens the
size step. And **the tap ring outlives the step it belongs to**: a single pick
chip advances itself after 240ms and the ring lives 420ms. That is every chip
tap in the clip, it predates all of this, and it was left alone rather than
changed without being asked.

### 2026-08-30 — a mascot mark may say several things in a row

The brief asked for a greeting in three languages, one on each language as it is
named, inside a two and a half second line. At the module's own bubble timings
that is not possible: a bubble lives 1.20s minimum and needs its state's
entrance and exit around it, so three of them need **six and a quarter seconds**
of head room, which is a fifth of a thirty second clip spent on one line.

So a mark may carry `bubbles: [{ t, text }]` instead of `bubble: '...'`, each `t`
a second on the clip's own clock. A list runs on `BUBBLE.quick` — `in` 0.30, a
hold floored at 0.30, `out` 0.20 — so each one lives **0.80s** against the
ordinary 1.20, which is a glance and is what a one word greeting is.

**It is opt in and the single case is untouched.** A mark carrying one string
plans and renders exactly what it did before this existed, and the self test
asserts it on the same numbers it always had: dot0 at 0.98, the pill overshooting
to 1.030, the pop landing at 1.120. Seven new assertions cover the list — three
in a row, the quick profile, one string on the pill at a time, nothing said
between them, one pop per bubble, a refused overlap, and the dash rule reaching
inside a run. `node lib/mascot.mjs test` is green.

`planMascot` refuses a list that overlaps itself rather than resolving it,
because the pill holds one string at a time and two thoughts on one anchor would
resolve by build order, which is not an answer. Everything downstream — the
builder, the frame, the cues, the report — reads one list and knows nothing about
which spelling asked for it.

### 2026-08-30 — three bugs in the turn, and the one that shipped

The turn went in and then a look at rendered frames found three things wrong with
it. All three are fixed, none of the guards were loosened, and two of the three
are now asserted in the engine's own self test.

**The foreshortening was inverted, and the geometry is worth writing down so it
cannot be got wrong again.** Turn the head so the nose points to screen right.
The cheek that comes toward camera is on screen *left*; the cheek that rotates
away is on screen *right*. So the eye carried nearest the right hand silhouette
is on the **far** side of the form: it foreshortens, and it travels the *smaller*
distance, because it is wrapping around the head rather than sliding across the
front of it. The eye trailing behind is the **near** one: full width, larger
travel, crossing the centre line as the broad side swings in.

The first build had the scale on the wrong one of that pair. The shifts were
right; only the scales were swapped, which reads as a face whose near cheek is
collapsing. Measured across a sweep, in device px at 1080 wide, after the fix:
29.2 against 49.7 at minus one, 34.7 against 49.1 at minus 0.7, 51.2 against 51.2
at zero, 34.9 against 49.1 at plus 0.7, 29.3 against 49.8 at plus one. **The self
test now checks both ends**, because a sign error is invisible if you only look
at one of them.

**A card coloured block was appearing in the background near the crown, and it
was the lid.** The lid is deliberately oversized — wider and twice as tall as the
eye — so that it covers the eye completely at any scale. `surprised` takes the
eye to 2.6 times its height, which drags that slab far above the eye line, and a
turn on top of that walks its top corner off the head. Being card coloured, it is
invisible on the card and visible the instant it is not.

Fixed twice over. **Every facial feature is now clipped to the head's own
outline**, with a clip path built from the plate's exact geometry so the two
cannot disagree about where the head ends. And **the eye clamp measures room at
the narrowest point of the eye's vertical span** rather than at its centre, which
is the actual arithmetic error underneath: a widened eye reaches a height where
the plate is a good deal narrower than it is at the eye line. A geometric guard
reports the signed distance of the worst placed feature corner from the
silhouette and **the render fails if it ever goes positive**, because a clip
quietly trimming a pose is still a pose that does not fit. Worst measured is 3.61
units inside the edge in the clip and 2.46 inside in a plan that puts every state
through plus and minus 0.85.

**The eyes at dead centre were already exact, and the check written for them was
not.** At turn zero both eyes measure 51.2 by 17.5 px, identically, on every
frame. The 0.4px of vertical difference a rendered frame shows is the head's own
idle roll — 0.55 degrees across a 42px eye separation is 0.40px, which is what
the render measures — so it is the head moving rather than the eyes differing,
and it is asserted on the rig rather than on a screenshot for exactly that
reason. The first version of the assertion demanded the pair sit dead on the
centre line and failed at 1.388 units; **that check was wrong, not the code** — it
was asserting the mascot never glances sideways, and the saccades are the whole
idle layer. It now asserts the pair moves as one, which is the real contract, and
a companion check asserts straight on carries no squeeze, no shift, no tilt and
no foreshortening, so the turn maths cannot reach the neutral pose.

**And the test writes two files now, always the same two.** `demo/out/mascot-light.mp4`
and `demo/out/mascot-dark.mp4`, overwritten every run. The resolution used to be
in the name and for one afternoon the chapter was too, so every change to the cut
minted a fresh pair while the old pair sat on disk looking current — which is how
a review ended up watching a clip rendered ninety minutes earlier. The name says
what it is; the file's own timestamp says when it was made.

### 2026-08-30 — the mascot turns, and the bubble is the site's

Two additions on top of the rig, both the same day and both measured on rendered
frames rather than argued about.

**The measured eye width across a turn sweep**, in device px at 1080 wide, after
the foreshortening fix. The narrow one is always the eye the turn carried toward
the silhouette:

| turn | screen-left eye | screen-right eye | far eye |
|---|---|---|---|
| -1 | **29.2** | 49.7 | left |
| -0.7 | **34.7** | 49.1 | left |
| -0.35 | **43.9** | 51.6 | left |
| 0 | 51.2 | 51.2 | neither |
| +0.35 | 51.6 | **44.1** | right |
| +0.7 | 49.1 | **34.9** | right |
| +1 | 49.8 | **29.3** | right |

**The turn is one number and five flat moves.** `turn` runs from -1 to +1 and
every value between them renders, because there is no pose table and no second
drawing, only arithmetic: the card squeezes 7.5% of its width, both eyes travel
toward the near edge with the far one going further so the **gap closes from 21
grid units to 16.5**, the far eye foreshortens 42% across, the head tilts three
degrees into it and the shadow slides 4.5px with the mass. At a full turn the
near eye travels **38 device px** and the far one **56**, on a 240px head.

**The gap closing is the whole cheat.** An eye pair that merely slid across a
circle reads as two stickers on a plate. One whose gap closes as it slides reads
as a face turning, because that is what perspective does to two features on a
curved form. Everything else in the list is support.

**The eyes lead the head on a turn, and no code in the file is about that.** The
eyes read the lead channel and the card reads the lag channel, so the gaze
arrives first out of the same three frame lag the rig already had.

**`turn` is the one channel an exit does not reset.** Every other channel is a
gesture and goes back to nothing; the turn is where he is facing. A head that
snapped back to camera at the end of every state would make `turn-away` a twitch
rather than a place he went, and it is also what lets a sweep across four marks
read as one continuous ramp instead of four marks fighting their own exits.

**The resting bias is one config value and it follows the corner.** `TURN.bias`
is 0.35, a third of a turn to his right, so from the bottom left corner he looks
*into* the frame rather than out of it. `planMascot` flips the sign on its own
when `pos` ends in `right`; an explicit `bias` option overrides both, and
`bias: 0` is dead straight on. **To put him in the other corner, change `pos` and
nothing else** — the bias follows it. One number in one place, so a second copy
of it cannot go stale.

**The overlay clips land in `demo/out/mascot/`**, inside the already ignored
`out/`, and the name carries every axis in a fixed order:
`mascot-<state>-<theme>[-turned][-bubble]-<flavour>` where the flavour is one of
`alpha.webm`, `onblack.mp4` or `onwhite.mp4`, plus a `-still.png` poster per clip
and one `cues.json` for the whole set. So
`mascot-thinking-dark-turned-bubble-alpha.webm` is thinking, dark, held at a
three quarter turn, carrying its bubble, with real alpha.

**Two new states, `turn-away` and `snap-back`**, and `turn-away` parks at 0.85
rather than at 1 for a reason worth keeping: `snap-back`'s anticipation is a turn
*further away*, and 0.17 of a 0.85 move lands the wind up at 0.995 with the
channel's ceiling untouched. The pop curve then carries it through zero and about
a tenth past, which is what a head does when something catches it.

**The composition guard is real and it fires.** A state may move the eyes on its
own, and a state's offset plus a full turn could walk an eye off the side of the
face. Every eye is clamped to leave 1.2 grid units of card outside it, measured
against the plate's width at that eye's own height. A plain sweep never reaches
the clamp across any frame; `curious` held at a full turn does, which is exactly
the case it was written for, and the preflight counts clamped frames because an
eye sitting on its clamp is an eye that stopped moving.

**The bubble is now index.html's thought bubble** rather than a filled caption
card: a rounded pill in the page colour with an outline, and dots climbing off
the head toward it. Two dots rather than the site's three — the smallest is 5px
on the page and at 1080 wide that is ten device px of outline, which reads as a
speck of dirt. The cluster sits **10 device px off the ink** where the site's
sits sixteen, which at phone size is the difference between attached to him and
near him. The three numbers a render measures rather than assumes, and which the
export guards on: **outline 2 css px, which computes to 4 device px**, **gap to
the head 10 device px**, **cap height 38 device px** against a 32 floor. The motion is the site's own 0, 70, 140ms, as three tweens on one
timeline rather than three transition delays, and the exit is that list
backwards. The `pop` cue moved from the first dot to the pill: the dots are the
anticipation and the pill is the arrival.

**The outline is 2 css px because chrome floors `border-width` to a whole css
pixel.** It was written as 1.5 to get three device px and the render came back
with two — 1.5 resolves to 1, and at device scale 2 that is the site's own
number again, which is the first thing h.264 eats at crf 17. The export guard
caught it off `getComputedStyle` rather than off what was typed, and it now
measures **4 device px**. Both the guard and the self test insist on a whole
pixel, so it cannot be written back.

**And one self inflicted incident worth writing down.** A python replace meant
for one css comment matched an identically named section header a thousand lines
earlier and stripped every backtick between the two, which broke every template
literal in the middle of the file. Nothing was lost — the file is not tracked
yet, but every patch that built it was on disk and the module was rebuilt and
re-verified against the same numbers it had before. **The lesson is the anchor,
not the tooling**: a section header in this house style is not unique, because
the header block and the code both use it, and a replace anchored on one is a
replace anchored on either.

The seven original states carry their numbers through both changes unchanged:
entry 7 to 24 frames, overshoot 10.7 to 15.4 per cent, settle 150 to 317ms,
squash peak 7.0%, breathing 1.60%, no repeated blinks, no frozen frames.

### 2026-08-30 — the mascot is a rig, and it exports itself

The mascot has been a still picture with a blink on it since v1: two pose files on
the site, a lid and a gaze in `record.mjs`'s end card, and a face in
`lib/pictograms.mjs`'s shape vocabulary that is drawn and does not act.
**`demo/lib/mascot.mjs` makes him a character.** Seven named states, a real rig
under them, and a second script that renders the same states as standalone overlay
clips Einz can drop over his own footage in canva.

**Nothing on the site changed.** `index.html`, `CNAME`, `robots.txt`,
`sitemap.xml`, the language stubs and `assets/` were not touched, no existing post
file was edited, `.gitignore` was not edited because `demo/out/` is already ignored
whole, and no dependency was added — the list stays `puppeteer-core`,
`ffmpeg-static` and `gsap`.

**The rig.** A card, two eyes with independent x, y and both scales, two lids, two
brows, a shadow and a glow, every one of them a channel on one gsap timeline. The
geometry is `skills/page-builder/SKILL.md`'s table and the self-test checks all six
of its ratios rather than trusting them. The motion core is `lib/pictograms.mjs`'s,
unchanged: the same four house curves plus `land`, the same volume preserving `sq`
channel with its 8% ceiling, the same `lift` driving the same shadow model, the
same ban on a css transition anywhere near a mark.

**gsap does not run in the page this time, and that is the one architectural
call.** Pictograms serialises its timeline builder into the browser because
DrawSVGPlugin has to own the dash, and everything that file carries around the
clock — the root timeline pinning, the rAF filter, the `sync()` probe, the per
frame parity check — exists to keep node and the page agreeing about a channel
node cannot compute. Nothing in the mascot is line drawn. So node holds the whole
animation and the page writes what it is handed. One engine, one reader, and a
class of bug that is not there rather than guarded.

**Four things were found by looking at rendered frames rather than at code, and
all four are the reason the brief said to judge it at phone size.**

1. **A lid is not the eye's own shape.** The first lid was a copy of the eye pill
   translated down over it, which looked obviously right and rendered as a hollow
   ring: two rounded pills overlapping leave a crescent at the bottom *and* two
   slivers at the ends where their round ends curve away from each other. A lid has
   a straight edge. It is now a flat bottomed slab wider and taller than the eye,
   painted in the card's own colour, so what it covers is the eye and nothing else.
2. **`curious` at 1.55 against 1.22 is not asymmetry, it is a rounding error.** Two
   slabs at 6.8 and 5.4 units read at phone size as two slabs. 1.80 against 1.10 is
   one eye open and one not.
3. **`delighted` at eye scale 0.52 was still a slab.** 0.40 by 1.28 turns a 4.4 unit
   pill into a 1.8 unit line, which is a different shape rather than a smaller one,
   and it is the only thing that makes the state announce itself in a still.
4. **`unimpressed`'s brows, dropped and level, were a fourth slab on the face.**
   Turned out eight degrees they read as bored. `surprised`'s go the other way.

**And one that was found by measuring.** The head's clearance was being read off
`getBoundingClientRect`, which returns the axis aligned box of the rect's
*geometry* — so a plate turned eight degrees reported a box wider than itself by
the corners it does not have. At radius 0.5 the ink is a circle and a circle does
not get wider when you turn it. That number said the head was half a pixel outside
a safe line it was fifteen pixels inside, and the fix on offer was to move the
mascot inward to satisfy an artefact. `headRect` computes it instead: the axis
aligned box of a rotated ellipse is exact in one line, and a card falls back to the
four transformed corners, which is conservative in the right direction. The bubble
is still measured in the page, because it is a dom box with no rotation on it.

**Three engine bugs, all of the same family, all worth keeping.** A `fromTo` with
`immediateRender:false` writes nothing until its own time, so at build time the
channel objects still hold the seed — an exit built by reading them eased back to
rest *from* rest and snapped on the frame it started, which is what made scrubbing
backwards produce a different animation from scrubbing forwards. The builder now
tracks the last `to` written to each channel and the exits are built from that.
Anticipation was also running *backwards* from the mark, so a state was animating
during the state before it; it runs forward now, which also makes `entryFrames`
mean the frames from the mark to the arrival rather than the frames from an
invisible head start.

**The measurements are per state and they are declared per state.** Each state
names the one channel it should be judged on and the value it arrives at, because
a nod's read is in y and a tilt's is in rotation and one shared metric would
flatter both. The entrance window is the entrance — from the mark to `settled` —
rather than a fixed tail, or `thinking`'s scan and `agreeing`'s second nod get
scored as the entrance failing to settle, which is the opposite of what they are.

**Two curves were added and they are not inventions.** `btk.shut` and `btk.open`
are `index.html`'s own blink written as beziers. None of the four house paths is an
accelerating close, and a lid on `btk.pop` would open past the top of the eye.

**The overlay export is the second deliverable and it has its own two problems.**
Alpha needs `-auto-alt-ref 0`, because libvpx with alt refs on encodes hidden
frames the alpha plane has no partner for; and a stream tagged `yuva420p` is not
proof of anything, because the encoder reports the tag it was asked for whether or
not the plane reached the muxer. So the run composites one clip per theme over a
colour nothing in the mascot uses and reads two corners back. And the capture is a
region rather than the canvas — a 1080x1920 png of a corner overlay is almost
entirely transparent and about a gigabyte a state — padded back to full size at the
offset it came from, out of the same `headRect` the guards read, so a region that
cropped the mascot would be one the guard also thought was somewhere else.

**The brows are the one thing that needs Einz's word.** The page spec's mascot is a
circle and two flat slabs and explicitly nothing else. Brows are new anatomy. They
are demo only, hidden by default, used by two states out of seven, and nothing in
this file reaches `index.html` — the same footing the drop shadows have had since
the sixth clip, which that spec also bans on the page. If the answer is no, the two
states lose a cue and still read; if the answer is yes, it should be written into
the skill file rather than left as a thing `demo/` does.

**The head is a rounded rect and not a circle, and that also wants a word.** The
brief asked for a card. `radius` is a ratio and at its default of 0.5 a rounded
rect's `rx` is half its side, which *is* the circle the site ships — so the rig
carries the card and the default draws the mascot. Nothing renders as a square
today.

### 2026-08-29 — video-review takes a url, and gives the file back

`skills/video-review` was local files only and said so three times: in the skill,
in the index and in `frames.mjs`'s own header. The rule was written when the only
clips worth reviewing were ours, sitting in `demo/out/` two minutes after a
render. It is now also worth pointing the eyes at somebody else's clip, and
asking for a download by hand before every one of those is friction with no
payoff.

**What changed.** An argument matching `http`/`https` is fetched with yt-dlp into
`demo/out/downloads/dl-<hash of the url>/`, and from the moment the file is on
disk the code is the path it always took: same probe off ffmpeg's stderr, same
sampling ladder, same `--guides`, same seven item checklist read in batches of
eight to ten. **Local mode is untouched.** No fetch, no delete, and no yt-dlp
required to run it.

**The media is temporary and the review is what survives.** A fetched clip is
deleted by
`node skills/video-review/frames.mjs --cleanup demo/out/frames-review-<name>`
once the review is written, and the skill calls that step not optional. The
delete reads the frames dir's own `index.json`, removes only the download folder
recorded there, and **refuses any path outside `demo/out/downloads/`** whatever
an edited index claims. On a local review it removes nothing and says so. The
frames survive the delete deliberately: they are 540px jpegs, they are
gitignored, and a second look at a beat should not need a second download.

**Four calls worth writing down.**

1. **The temp folder is inside `demo/out/`, and `.gitignore` was not edited.**
   `demo/out/` is already ignored whole, so a download cannot be committed by
   accident, and the rule that says do not touch `.gitignore` unless asked stays
   kept. A new top level `tmp/` would have needed both a new rule and a new
   directory to buy nothing.
2. **The download folder is keyed by a hash of the url, not by the title.** Two
   runs on one link share a folder, so a re-run costs no bandwidth, and the
   cache is checked **before** yt-dlp is looked for, which means a second pass
   over an already fetched clip works on a machine with no yt-dlp on it.
3. **The frames never land beside a fetched file.** They go to `demo/out/` like
   every other review's, because the folder they would otherwise share is the
   one about to be deleted.
4. **yt-dlp is a binary on PATH, not an npm package.** `demo/package.json` stays
   at three dependencies, which keeps the fourth-dependency conversation
   unopened. Missing yt-dlp is a clear message and an exit, and it names
   `--ytdlp=<path>` and `YTDLP` for a binary somewhere unusual.

**What was tested.** Local mode still writes the same frames and the same index,
with `url` and `download` sitting null beside the old keys. The url path was
exercised with a seeded download folder, covering detection, the cache hit, the
frames landing in `demo/out/`, the index's download block, the delete, a second
delete on an already deleted folder, and the delete on a local review. The fetch
itself could not run, because yt-dlp was not installed. It was installed the same
day and the first real link found the bug below.

### 2026-08-29 — the skill gets ears, and the rule that has to come with them

`video-review` shipped with **no transcription** as a non-negotiable, stated three
times over. The reason was sound and it was narrow: our clips are made here, the
script is written into the post file before the voice is synthesised, so there is
nothing to transcribe and inferring words from audio could only introduce error.
**That reasoning stops at the edge of our own footage.** The moment the skill
started reading other people's clips the rule was costing us the whole audio
track, so Einz lifted it.

**Three sources, in order, never mixed.**

1. **The clip's own captions.** yt-dlp pulls them beside the media in the same
   call that fetches it, `--write-subs --write-auto-subs --sub-langs 'en.*'
   --sub-format json3/vtt`. This is first because it is **free, exact and already
   published**: they are the publisher's own words, they cost no key and no
   request of ours, and youtube's `json3` carries **a timing per word**, which is
   better than any api hands back. `en-orig` sorts ahead of `en` so the original
   wins over a machine translation of it.
2. **A whisper api, and only if a key is already in the environment.**
   `WHISPER_API_KEY` or `OPENAI_API_KEY`, with `WHISPER_API_BASE` and
   `WHISPER_MODEL` for anything of that shape. **No key, no request.** It does not
   prompt, does not go looking in a file, and does not quietly bill somebody for
   a service they had not already set up.
3. **Nothing, said out loud.** No captions and no key writes a `transcript.md`
   that says **no transcript was possible** and lists why, and `transcript.json`
   carries `possible: false`. The review then says the words are unknown. **A
   review with invented dialogue in it is worth less than one that admits it could
   not hear**, and that is the whole reason the old rule existed. The rule is gone;
   the instinct behind it is now enforced by the fallback.

**The alignment is the point, not the transcript.** `transcript.md` carries a
table with **one row per sampled frame**, the words spoken inside that window,
and an **empty `on screen` column** for the reading half to fill in. The empty
column is deliberate: the script cannot see, and the review is where the two
tracks meet. On the reference clip that table immediately showed something no
amount of frame reading would have: **the on screen text is not what is being
said.** 122 words spoken, 49 on screen, and the cards are rewrites rather than
quotes, landing about half a second after the voice.

**Audio handling.** Extracted with the `ffmpeg-static` we already carry, `-vn -ac
1 -ar 16000 -c:a aac -b:a 64k`, into a hidden file in the frames dir, and
**deleted at the end of the run** unless `--keep-audio`. It is extracted even on
the captions path, because "there is audio, it is this long" belongs in an honest
no-transcript report. Same ethic as the media: somebody else's audio is a thing
to read, not a thing to keep.

**What was tested.** The captions path on a real short, 19 cues and 122 words with
per word timing. `--engine=whisper` with no key set, which reports the missing key
and writes the no-transcript file. A local clip with no captions and no key, same.
`transcript.json` carrying `possible: false` and the reasons. The temp audio gone
afterwards in every case. **The whisper request itself has never run**, because no
key exists on this machine, so that path is code and not yet evidence.

### 2026-08-29 — the first real fetch, and the merge that was not happening

yt-dlp was installed with `pip install --user yt-dlp` (2026.08.19) and the first
real link went through. Two things came out of it.

**yt-dlp needs to be handed our ffmpeg, and without it the review is silent for
the wrong reason.** yt-dlp pulls video and audio as separate streams and merges
them with ffmpeg off PATH. There is no ffmpeg on PATH here, so it left two files,
`.f616.mp4` and `.f251-20.webm`, and our own picker took the larger, which was the
**video only** track. The probe then reported `SILENT` on a clip that has sound.
**The fix is `--ffmpeg-location`, pointed at the `ffmpeg-static` binary we already
carry**, and it is in `fetchUrl` with a comment saying why. After it: one merged
mp4, `audio opus`, 43.72s. A clip called silent because of how it was fetched
rather than how it was made is exactly the class of thing this skill exists not
to do.

**The sampling ladder wants overriding on a clip that is not ours.** The default
put a frame a second on a 43.72s file, which cannot resolve a cut. `--every=0.5
--max=100` gave 88 frames, and the cut list came from **ffmpeg scene detection**
rather than from the frames: `select='gt(scene,0.20)'`, then the same at 0.12,
0.08 and 0.05 to tell one transition reported several times from several
transitions. That is a measurement the frames cannot give and it belongs in the
toolkit for any clip we did not render. One ambiguity, whether 4.75 to 6.25s was
a cut or a push, was settled with a 0.25s pass over that stretch alone.

**`demo/refs/` is where the notes go, and `.gitignore` was edited to ignore it.**
Einz asked for both directly, which is what lifts the rule about not touching that
file. The folder is ignored whole rather than tracking the notes and ignoring the
media: the notes are about somebody else's work, and a public repo is not where
our reading of it needs to live.

### 2026-08-29 — post5 gets a voice it was designed not to have, and the mascot beeps

**The brief was sound only: fill post5's silence and do not move a pixel.** That
held. The frame is the frame that was signed off on 2026-08-26 and the proof is
below. What follows is what the sound is, and the three things building it
taught the pipeline.

**The mascot does not speak, and that is the whole design.** post5's plan said no
narrator at all, because a mascot searching a room for an answer is the
performance and a voice over it explains a joke that works by being quiet. That
reasoning is right and it is preserved by *inverting* who talks. The house voice
reads **the question that is already on the screen** — it adds no information, it
is the caption said out loud — and the mascot answers in **beeps**, which is the
one register that can reply without explaining. He never says a word.

**The read is placed by one number and the number was already in the file.**
`DECODE_MS`, 1150, is how long the statement takes to stop scrambling. It used to
live inside the page's own serialised script; it now lives at the top of
`post5.mjs` and reaches the page through `__CFG`, because the sound needs it too.
The first word lands on it. One constant, two consumers, and "the read starts
when the text is readable" is a fact about the file rather than a caption on a
hand typed offset. The read ends at 3.39 and the bubble arrives at 4.50, so there
is 1.11s of silence before the answer and **the run fails if that ever inverts**.

**The chirp is the tenth sound in `lib/sfx.mjs` and the first character in it.**
Everything else in the set stands in for paper, ink, metal or a mechanism. This
stands in for a small robot deciding to say something: a sine gliding up inside
its own 90ms with a third harmonic a quarter under it, low passed at 3.4k so it
is a rounded boop rather than the piezo beep every other clip on the feed uses.
The glide is what makes it friendly — a tone that rises has asked a question or
agreed with you, a tone that sits still is a smoke detector.

**`chirpPhrase` is derived from the copy, not written.** The note count is the
reply's word count with a floor of three. `tell us.` is two words and gets three
notes; `we will fix it.` is four and gets four. Change the bubble's copy and the
mascot says more or less of it. The second phrase is `confident` — starts a tone
lower, climbs in wider steps, spans more than an octave where the first spans a
fifth — and it lands on the set's existing `ding` rather than a fifth boop,
because that line is the clip's answer and an answer stops. Two bubbles, two
distinct phrases, and the difference between them is one boolean.

**The servos are on the starts of the turns, and that closes an open note.** This
file has been carrying a warning in prose since 2026-08-27 that post5's locked
cue list is the times each eye turn *finishes*, so a servo on those numbers lands
half a second late as the eyes stop moving. `post5.mjs` now derives the ten
windows from `EYE_KEYS` itself and places the sound on the left hand number, and
the editor's card prints the windows as pairs instead of a list under a label
that said "cue". The prose warning could be got wrong twice; the code cannot.
**It also fixed the tenth cue for free**: the last turn ends at 10.50, past the
last frame, so a servo there would be cut in half — on 10.20 the whole 90ms fits
and what reaches the final frame is a tail 46 dB down. The loop point has no
click in it: frame zero is digital silence.

**No music, in this clip only.** The recipe's classical bed is the one line this
pass drops. Ten and a half seconds already carry a read, ten servos, six pops and
two robot phrases, and a bed under that is a fourth thing competing rather than a
floor. The recipe under Socials is unchanged for the clips that have not been
built.

### 2026-08-29 — a sample peak limiter does not hold a true peak

**The first mix passed every check and delivered -0.6 dBTP against a ceiling this
repo says is -1.0.** `limit()` in `lib/sfx.mjs` is a sample peak limiter, which is
what it should be — the alternative is an oversampler — and it held the sample
peak on -1.00 exactly. The **true** peak, the one a resampler reconstructs
*between* two samples and the one every platform measures, was four tenths of a
decibel over, because a heavily limited waveform is flat topped and flat tops
have big intersample peaks.

post6 and post7 never met this: they iterate on loudness alone and hand `limit`
the delivery ceiling directly, and it works until the lift gets large. post5's
lift is large — see the next entry.

**The fix is the discipline this file already had, applied to the axis it was
missing.** The ceiling handed to the limiter is pulled down by whatever the
measured true peak overshot by, read off the written wav with `ebur128` rather
than argued from the buffer, one axis adjusted per pass so the two do not chase
each other. It converged on this clip with the ceiling still at -1.00, because
the second fix below reduced the lift enough that the overshoot went away.

**`lib/sfx.mjs` was not changed for it.** The loop lives in `post5.mjs` and post6
and post7 still have their own. Whether it belongs in the library is a decision
for whoever writes the next clip, not something to retrofit into two signed off
mixes while working on a third.

### 2026-08-29 — more gain stops buying loudness, and then costs it

**The second version of the mix pass was worse than the first and measured
better.** Both hit the target within tolerance. The one that got kept is 0.1 LU
quieter and has **3.4 dB less limiting on it**.

post6's and post7's loudness pass assumes more gain buys more loudness and stops
when it lands on target. That assumption has a limit and this clip reaches it,
because the read is two seconds inside ten and a half so the mix is **-22.5 LUFS
at unity** and needs about thirteen decibels. Run out by hand, the search goes:

```
  lift +13.0  ->  -14.90 LUFS,  8.2 dB of limiting
  lift +13.9  ->  -14.80 LUFS,  9.1 dB
  lift +17.7  ->  -16.00 LUFS, 13.4 dB
  lift +21.5  ->  -15.50 LUFS, 17.2 dB
```

Past about fourteen decibels the limiter flattens the syllables faster than the
gain raises them. Asking for another decibel comes back **a decibel quieter with
four more decibels of squash on it**, and a loop that only ever adds gain walks
straight past its own best answer and reports whatever it happened to be holding
when the passes ran out. That is exactly what happened: -15.0 LUFS with 11.6 dB
of gain reduction, when +13.0 had already delivered -14.9 with 8.2.

**So the loop keeps the best pass rather than the last one**, stops the moment a
pass fails to improve on it, and re-renders the winner once at the end so the wav
on disk is the one that was measured. "Best" means closest to target **among the
passes that held the true peak**, because loudness bought by going over the
ceiling is not loudness we get to keep.

**What it reports is what the material can deliver**, which here is about -14.9
LUFS, rather than what was asked for. That is the point. A clip a decibel under
target is a clip; a clip with twelve decibels of limiting on a nine word read is
a pumping mess that measured well.

### 2026-08-29 — proving a picture did not move, when the renderer is not reproducible

**Chrome's `Page.captureScreenshot` does not produce the same jpeg twice.** This
was found trying to prove the audio pass changed nothing: the decoded pixel
hashes of the new cut differ from the 26 August silent cut on **all 630 frames**,
which looks alarming and means nothing.

The control settles it. Rendering the **unmodified** code today, off `git stash`,
and comparing it to the 26 August cut gives **58.34 dB PSNR**. Comparing that same
unmodified render to the sound cut gives **59.17 dB** — the sound cut is *closer*
to the original code's output than two runs of the original code are to each
other. The delta is sub quantiser capture noise and it is there whether anything
changed or not.

**So a frame hash is the wrong instrument and there are two right ones.**

1. **The run's own state json.** It carries every measured box to a tenth of a
   pixel, both safe area samples, the fits, and the animation extrema as full
   precision floats: `gazeJump` 0.582 units at 2.38s, `blinkJump` 0.296 at 3.05s,
   7 blinks, 10 turns, 10 holds, `eyeMax` 5.63. It is **byte identical** between
   the silent cut and the sound cut. If any layout or any eased value had moved by
   a float, those numbers would not survive it.
2. **A re-encode of the same frames.** Feeding the kept jpegs back through the
   same arguments produced an md5 identical to the shipped mp4, which proves the
   video settings did not move and that the encode itself is deterministic. Only
   `-an` left and 192k aac arrived.

**The lesson for the next audio only pass**: diff the state json and re-encode the
frames. Do not diff the pixels, and do not panic when they differ.


### 2026-08-28 — post10 says `ai`: one word, one take, and what a cache is for

**Group 2 was `you said a machine could never be` and it is `you said ai could
never be`.** Einz's call, on a clip that had been rendered and signed off but
never posted. One word on the screen and in the voice, and nothing else in the
file was allowed to move. **This cut, `f38553b`, is the release version.**

- **Only group 2 was resynthesised, and that is the cache doing its job rather
  than a shortcut taken.** `voiceGroup` keys its sidecar json on the copy **and**
  on the rate and pitch, so changing one group's text invalidates exactly that
  group. Groups 1, 3 and 4 came back `(cached)` and their audio is byte for byte
  the file that was signed off. Three quarters of the voice track was never
  regenerated, so three quarters of the clip cannot have drifted.
- **The card list is the cut and the check, and it needed one edit.** `CARDS`
  went from `'you said', 'a machine', 'could', 'never', 'be'` to `'you said',
  'ai', 'could', 'never', 'be'`. **Still seventeen cards**, because two words
  became one word but two cards did not become one card. `markCards` walks the
  list against what the synthesiser actually said and throws before a browser
  opens; it matched all 26 words first time, so the engine returned `ai` as one
  lowercase token and nothing had to be taught how to spell it.
- **The screen shows it lowercase for free, and that is the `float` style.**
  The `pop` card style sets `text-transform:uppercase`; `float` does not. post10
  has been `float` since it was built, so `ai` reaches the pill exactly as it is
  written in `CARDS`. No new rule, no substitution — `CENSOR` is still the one
  and it is still only `fuck` → `fu*k`.
- **`ai` is spoken as two letters, so the clip barely got shorter.** This is the
  number worth having written down, because the obvious guess is wrong: dropping
  a two word phrase for a two letter one looks like it should save half a
  second. Andrew reads `ai` as `ay eye` and it holds the card from **4.59 to
  5.19, a full 0.60s** — very nearly what `a machine` took. **13.17s against
  13.25s: eight hundredths.** Group 2 measures 3.18 words a second, inside the
  2.97 to 5.68 band the other three takes already set, so the delivery did not
  change either.
- **Everything behind the change shifted by that eight hundredths and nothing
  else moved.** Stabs **3.64 / 6.10 / 8.64** against 3.64 / 6.18 / 8.71 — stab
  one did not move at all, because it is in front of the change. Outro
  **10.02** against 10.10, wordmark in **10.59** against 10.67, black from
  **12.87**, 790 frames against 795. The four music slices are the same four
  regions of the same track at the same one gain of -6.79 dB, the mix is still
  **-14.2 LUFS / -0.9 dBTP** with **0.000s of music inside a word**, and the
  safe area came back **191 / 933 / 165 / 936**. The look, the glitch windows,
  the margins, the crf and the seventeen cards are untouched.
- **Both reviews are clean.** `skills/video-review` ran on the shutter-shut pass
  and again on the final. Neither found anything — no green on any of the 27
  frames either time, one caption zone throughout, the wordmark legible, and the
  blur visibly running on the final's stab frames where the preview's were
  crisp. **4.11 MB at 2.50 Mbit/s, 8.1 minutes with the shutter open.**
- **The caption in the posting pack moved with the line.** `the machines heard
  everything you said about them` became `the ai heard everything you said about
  it`. The tags did not move. Nothing had been posted, so this is a plan being
  edited rather than a live caption being corrected. The pack is under Socials.

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
margins **192 / 941 / 164 / 929** against 140 / 180 / 140 / 220. **Every number
in this paragraph is the fix pass's and the ai cut moved all of them by about
eight hundredths of a second — see the entry above for the current ones.** The
reasoning below is what still stands; the timings are history. **17.7% of
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

**Amended 2026-08-30, and it is not a change: the rule is about language.**
`lib/voice.mjs` gained a fourth voice, marked `comedy: true` and used for exactly one
line in post11: the sentence a person in the film is typing into the form, which is not
the agency talking. What got written down is that a comedy voice is a named kind rather
than a fourth narrator: `NARRATORS` is the three that are not comedy, and a clip picking
a read voice picks from that list.

That slot was `en-IN-PrabhatNeural` for one build and is `en-US-JennyNeural` now, and
the swap was a taste call rather than a rule change: indian english is english and the
rule never had anything to say about it. What the rule does not cover, and what the
change is actually about, is that a clip this plain does not want its one joke marked
out by an accent. **Do not read the swap as the english only rule growing teeth about
accents.**

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
- **post5, "what is the most boring part of your business?", is built, its plan
  is locked and it now has its sound in the file** — built 2026-08-26
  (`demo/post5.mjs`, `990b206`), plan locked 2026-08-27, sound added 2026-08-29.
  **Not posted.** Caption and a posting rule are under Socials. It jumped post3
  too, so **post3, "missed calls", is now two clips behind and still unbuilt.**
  - **The mix is no longer owed and neither is the cue timing note.** Both are in
    the mp4: -14.9 LUFS / -1.0 dBTP, no music, and the servos sit on the turn
    starts because `post5.mjs` derives them rather than being told.
  - **Still owed before it goes out: the three hashtags per platform.** That is
    the only thing on this clip's list now.
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
- **post10, "the rage clip", is built, fix passed, word changed and pushed** —
  2026-08-28, `demo/post10.mjs`. **The release version is the ai cut,
  `f38553b`**: 13.17s, 60fps, dark, no accent, voice and four slices of licensed
  music in the file, every check passing and both video-review passes clean.
  **Not posted.** Unlike post9 it owes nothing before it can go out — the
  posting pack is complete under Socials, caption, three tags on each of the
  three tagged platforms, X untagged, and no app music because the sound is
  burned in. The only open part is whether and when Einz posts it. It jumped
  post3 as well, so **post3, "missed calls", is now six clips behind and still
  unbuilt.**
- **post11, "the explainer", is built in two variants and not posted** —
  2026-08-30 to 08-31, `demo/post11.mjs`. **46.47s**, light and `--dark`, out to
  `demo/out/post11-light-1080x1920.mp4` and `post11-dark-1080x1920.mp4`. **Only
  12fps previews exist: neither variant has been rendered or reviewed at 60fps.**
  It owes **the opening motion pass** (the mascot big and centred through the
  opening, then glitching to the bottom left corner on the button tap), which is
  not begun and is the next thing to do; the **60fps master**; and a **posting
  pack** and a **track**. The mascot's placement wants another look either way.
  The entry below predates the last three rounds and is kept for the history.
- **post11, "the explainer", is built and not posted** — 2026-08-30,
  `demo/post11.mjs`. **Six rounds of fixes are in and it is 46.47s now**, every
  check passing and every video-review pass clean, **but only at 12fps: the
  60fps master has not been run.** It owes a **posting pack**: caption, tweet and
  three tags per platform, none of them decided. And it owes **a track** — the
  clip ships with no music by design and Einz picks one later. It jumped post3 as well, so **post3, "missed calls", is
  now seven clips behind and still unbuilt.**
- **post14, "the fable 5.1 news flash", is built at 60fps and not posted** —
  2026-09-02, `demo/post14.mjs`, **second cut, 13.03s**, light, out to
  `demo/out/post14-light-1080x1920.mp4`, every check passing and both
  video-review passes clean after five fixes between them. It owes **a posting pack** — caption, tweet and
  three tags per platform, none decided. **The call on whether
  `demo/assets/anthropic-logo.png` gets committed is settled and the answer is
  no**: `demo/assets/*` went into `.gitignore` on 2026-09-06 with the traced
  gloves as the one negation under it, so somebody else's trademark is ignored
  rather than merely absent. **It is the one clip on the shelf with a
  clock on it**: it is about somebody else's release and it is worth less every
  day it sits. It jumped post3 as well, so **post3, "missed calls", is now eight
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
- **post10 has a pack and has not been posted either.** Same shape as post7, and
  worth naming separately because this file claimed for part of 2026-08-28 that
  post10 was live. It is not. The pack is complete, the release version is
  `f38553b`, and the open part is whether and when it goes out. **Two finished
  clips are now sitting on complete packs**, which is a cadence question rather
  than a build one.
- **post11 has no pack and no track.** Written down 2026-08-30. Unlike post7 and
  post10 this is a missing decision rather than a missing posting: caption,
  tweet and three tags per platform are all undecided, and the clip deliberately
  ships with **no music** in this pass because Einz picks the track. **Three
  finished clips are now sitting on the shelf** — two on complete packs and this
  one on an empty one.
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
