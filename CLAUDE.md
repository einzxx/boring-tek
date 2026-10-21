# THE BORING TEK — CLAUDE.md

Agency building custom AI agents, backend infrastructure and workflow automation.
Domain: theboringtek.com. Repo: github.com/einzxx/boring-tek (PUBLIC).

## What this is

- **Now:** site v1, live. One file, no build step, no dependencies. Two themes (light
  default, dark), three languages (EN/RU/LV), the mascot, and a multi-step contact form
  that posts to two endpoints. The coming soon page is gone.
- **Later:** services, work, process. Same repo, same constraints until explicitly
  lifted.

### What we sell

1. **Custom AI agents** — agents built for one business, one workflow, one job. Not
   chatbot wrappers.
2. **Backend infrastructure** — APIs, databases, queues, integrations, the plumbing
   that has to not break.
3. **Workflow automation** — the manual work a company does every day, deleted.

Positioning: boring on purpose. Infrastructure people don't think about because it
works. The name is the pitch.

## Brand voice

Raw, anti-corporate, terminal-native.

- Lowercase by default. Short lines. Full stops.
- Say what the thing does. No "leverage", "empower", "solutions", "synergy",
  "cutting-edge", "seamless", "revolutionize", "unlock the power of".
- No emoji. No stock photos. No smiling-team-around-a-laptop imagery.
- No exclamation marks. No hype. Confidence comes from specificity, not volume.
- **No punctuation dashes anywhere a visitor can read, in any language** — no em dash,
  no en dash, no hyphen used as one. Use a comma or a full stop. **Hyphens inside words
  stay** (`e-pasts`, `что-то`): that is spelling, not punctuation. Watch this hardest in
  RU and LV, which reach for the em dash where English uses a comma.
- Never claim work, clients, metrics or partnerships we can't name.
- Humour is dry and deadpan, never memey.

Read like a terminal, not a brochure.

## Visual identity

- **Two themes, light is the default.** White page with an inverted (dark) mascot;
  dark is the near-black terminal look with the phosphor glow. Monospace throughout,
  green as the single accent — light and dark each have their own green, because the
  dark one is unreadable on white.
- The amber ramp is retired. Green is the only accent.
- Full spec lives in `skills/page-builder/SKILL.md` — that is the source of truth for
  colors, type and layout. Never invent tokens outside it.

## Structure

```
boring-tek/
├── index.html          # the live site — single file, root, never moves
├── ru/index.html       # GENERATED. the russian page, built from index.html
├── lv/index.html       # GENERATED. the latvian page, built from index.html
├── tools/index.html    # the tools hub, /tools/. one file, same rules, english source
├── tools/clean/index.html  # the cleaner, /tools/clean/. one file, same rules, english source
├── ru/tools/           # GENERATED. ru/tools/index.html and ru/tools/clean/index.html
├── lv/tools/           # GENERATED. the same in latvian
├── clean/index.html    # GENERATED. a stub forwarding /clean/ to /tools/clean/
├── ru/clean/, lv/clean/  # GENERATED. the same stubs for /ru/ and /lv/
├── README.md           # one short section per public tool
├── CNAME               # theboringtek.com — never edit, never move
├── robots.txt          # root by convention
├── sitemap.xml         # root by convention
├── CLAUDE.md           # this file
├── MEMORY.md           # decisions + current state, updated every session
├── assets/             # the mascot: source svg, png reference, pose variants
├── tools/
│   └── build-langs.mjs # writes ru/, lv/, ru/tools/, lv/tools/, the three stubs and sitemap.xml
└── skills/
    ├── SKILL.md        # index of available skills
    └── page-builder/
        └── SKILL.md    # design system + build rules for pages
```

Read `MEMORY.md` before starting any work. Update it after every session that changes
state or makes a decision.

## Hard rules

### Public repo — treat every tracked file as published

- **This repo is public and GitHub Pages serves every tracked file on the site**,
  MEMORY.md included. Never write client names, people names, prices, private plans
  or personal info in any tracked file.
- Never commit secrets: API keys, tokens, `.env` contents, credentials, private URLs,
  webhook endpoints, server IPs, mnemonics.
- Never commit client names, client logos, contract terms, pricing quotes, invoices,
  NDAs, or anything a client shared in confidence — not in code, not in comments, not
  in MEMORY.md, not in commit messages.
- Case studies are anonymised ("a logistics company", "a 40-person agency") until the
  client has explicitly approved being named in writing.
- Personal contact details beyond the public business email stay out.
- Assume anything committed is permanent. Deleting it later does not remove it from
  git history.

### Build constraints (in force until Einz says otherwise)

- **Single file.** All HTML, CSS and JS live in one `.html`. No separate stylesheets,
  no separate scripts.
  **`ru/index.html` and `lv/index.html` are output, not source.** They are written by
  `node tools/build-langs.mjs` out of `index.html` and its `T` dictionary: same markup,
  same script, the text already painted and `lang`, `canonical`, `title`, `description`
  and og set per language. Editing either by hand is editing a build artifact. Change
  `index.html`, re-run the script, commit all three. `--check` fails if they are stale.
  Nothing is bundled, compiled or fetched, so the zero-dependency rule below is intact.
  **The same holds for the tools hub and the cleaner.** `ru/tools/` and `lv/tools/`
  are generated from `tools/index.html` and `tools/clean/index.html`, never edited by
  hand, and so are the three stubs under `clean/`. Their strings live in the `TOOLS`
  and `CLEAN` en/ru/lv dictionaries in `tools/build-langs.mjs`; each page carries only
  its English `T`, and the build asserts the two agree. A new string goes into all
  three languages there, then the page, then a rebuild.
  **`node tools/build-langs.mjs --check` must pass before every push.**
- **Zero dependencies.** No npm, no package.json, no build step, no bundler, no
  framework, no CSS library, no icon library, no CDN scripts.
  **One named exception, the cleaner:** `tools/clean/index.html` fetches pdf-lib and jszip
  from a pinned, SRI hashed CDN url, and only when a pdf or a docx is actually
  dropped, never on load. Nothing else on the site may do this without a decision.
  **This rule is about what ships. `demo/` is tooling and is allowed its own
  `package.json` and local npm dependencies**, provided anything a rendered page
  needs is inlined from `node_modules` at render time rather than fetched, and
  nothing in `demo/` is loaded by, linked from or referenced by `index.html`.
  Currently `puppeteer-core`, `ffmpeg-static`, `gsap` and `three` (pinned exact,
  0.186.1, added for post58 and inlined by `demo/lib/three-inline.mjs`). Adding a
  fifth is a conversation, not a decision to make while working.
- **Exactly one external request at load, carrying exactly two families: Michroma
  and Space Grotesk, from Google Fonts.** One `<link>`,
  `css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap`. That is the
  whole budget and it is a deliberate, approved exception to the "no external fonts"
  rule this line used to carry. Michroma sets the wordmark, the subline and the cta;
  Space Grotesk sets reading text, at weights 400 and 500 only. Everything else the
  page needs ships in the file, and anything deliberately mono uses the system
  monospace stack.
- **Space Grotesk has no Cyrillic**, so the whole Russian page falls back to mono with
  one rule — `html[lang=ru]{--body:var(--mono)}`. All or nothing, never per glyph:
  a line that mixes two faces mid-sentence is the failure this prevents. There is no
  Cyrillic subset to request, so do not try to "fix" it.
- **Two requests at runtime, and only when someone presses send:** the contact form
  posts to Web3Forms (email) and to our Cloudflare Worker (Telegram). Nothing fetches
  on load, on scroll, on hover or on idle. Another endpoint is a decision, not an
  implementation detail.
- **No analytics, no trackers, no cookie banners, no popups, no newsletter capture.**
- Vanilla JS only, and only when it earns its place. A page that needs no JS ships
  with no JS.
- Inline SVG for any graphic. No image files unless discussed first.
- `index.html` and `CNAME` stay in the repo root. GitHub Pages depends on both.

### Working rules

- Diff-first: propose the change, wait for approval, then write.
- Match the stated scope. No bonus sections, no "while I was in there" refactors, no
  loose files outside the structure above.
- Don't touch `index.html`, `CNAME` or `.gitignore` unless asked directly.
- Ask before adding any new top-level file or directory.

## Motion

House rules for every clip in `demo/`. They apply before Einz sees anything.

### Banned looks

- Centered title on a gradient, everything just fading in, corner labels, frame
  borders, generic particle bursts, heavy glow, bloom or grain.
- Dead time. Something new must happen every 1.5 to 3 seconds.
- Code drawn hands. Hands come only from pngs or `demo/assets/hands/`.
- Pacman shapes for eating. Eating is the post25 bite and chews.

### Mascot rules

- Eyes calm, happy, neutral or squint only. Never wide, never angry. Open and alive
  most of the time. Happy arcs last 0.6s at most.
- Speech bubbles in the house style, with the two dots, equal gaps.
- The mascot speaks with its own voice, `MASCOT_VOICE_ID` in `demo/.env`, on
  `eleven_v4` with the emotion tags acted. Cheeky and fun, talking straight to the
  camera. The id lives only in `demo/.env`, never in a tracked file or in chat.
  The narrator voice is only for news stories.
- 9 to 15 seconds is the normal length. Longer only when Einz says so for that
  clip.
- **The TikTok safe zone, every clip, Einz's call 2026-10-22.** In 1080x1920 px:
  140px from the left, 200px from the right for the like and share buttons,
  220px from the top, and the bottom 420px clear for the caption and username.
  Footage and full screen backgrounds may fill the whole frame. Every word,
  caption, big word, card, graphic and the mascot stays inside the zone, and so
  does any text inside the footage that has to be read. Check every frame
  against it before Einz sees a preview.
- On screen text has no dashes, apostrophes or quotes.

### Beat sheet, stills, loop

- Before any code, show Einz the beat sheet, each beat with its second and its
  sound, and wait for the ok.
- Render one still per beat before the full render.
- Clips end on THE BORING TEK card, see rules 10 and 11 below.
- The hook reads in the first 1 second, not 2.

### Retention rules, from the post51 to post61 audit

Every clip from post51 to post61 opened on a static title card, used captions too
small for a phone, stayed dark and sparse, and ended on a logo card. Views stopped
near 850 on almost all of them. These rules replace that template.

Hook
1. Frame 0 is the payoff image or the strangest frame of the clip, already moving.
   No title card, no topic label as the opener.
2. The first line is a claim or a conflict, never "did you know", "do you know" or
   "we are testing". Voice and the first caption land by 0.3s.
3. Something big moves in the first 0.5s: a punch in, a drop or a slam. A blink
   does not count.

Pacing
4. 9 to 15 seconds, as above.
5. A pattern interrupt every 1.5 to 3s, at uneven intervals: a cut, a punch in, a
   colour flip or a hit. Gate: no 3s stretch where every half second scores under
   0.02 on the ffmpeg scene score.
6. One idea, one payoff. The payoff lands by 70% of the runtime.

Karaoke captions
7. One to three words per page. Space Grotesk 500, lowercase, 64 to 72px, white,
   the active word in the clip's accent. Each page pops in over 0.15s with a small
   overshoot.
8. Captions sit at 60 to 65% of the height, and at 66% on the full screen
   template, `demo/lib/fullscreen.mjs`. Always inside the safe zone, never in the
   bottom 420px. Word timing comes from the real voice timestamps, never an even
   split.

Colour
9. One bright second colour per clip, as post60 used magenta, alongside green, plus
   one full screen colour flash at the payoff that flips straight back. Clips only:
   the site keeps green as its single accent. **Exception, the real or AI series
   from post66:** white and green only, no second colour, the flash is green.

Ending
10. **The default ending, from post65, Einz's call 2026-10-20:** after the last
    word, one glitch into THE BORING TEK card, the glitch sound exactly on the
    glitch frames. The card holds 1.5s and the clip ends on it.
11. No run back into frame 0 and no glitch out of the card. The clip does not
    loop.
12. The brand lives inside the clip: the mascot, plus a small wordmark during the
    hook.

Check
13. The critique loop below carries four retention scores: hook reads in the first
    second, longest dead stretch, captions readable on the 360px phone sheet, the
    glitch sound on exactly the glitch frames into the card.

### Camera, transitions, type and sound

Opt in helpers in `demo/lib/aiafter.mjs`. Earlier clips render the same without them.

- Camera: `livingCamera`. A slow 2 to 5% push on every hold where nothing else
  moves, a small punch in on the payoff word, heavy smooth easing. Push and
  punch together never pass 6%, and the margin guard still checks under it.
- Transitions: `planTransitions`, zoom through (old scene to 1.2 and blurred,
  new one in from 0.75) and whip pan (with a small dip). Blur is the pre
  blurred copy, never an animated blur. No crossfade by default. Each type at
  most twice a clip.
- Big words: `wordIn` with `spring`, `rise` (blur in from 12px while rising)
  or `slam` (1.2 to 1, blur 20 to 0).
- Sound: about 5 effects per 10 seconds. Whooshes on the fastest frame of a
  move (`peakAt`), hits on contact. One short planned silence before the payoff.
- From post60, new clips use elevenlabs sound effects (`lib/elevensfx.mjs`,
  best of 3) in one sound family for the whole clip, high passed for phone
  speakers, each placed on its loudest sample, plus a quiet music bed from
  `lib/elevenmusic.mjs` ducked under the voice and out for the planned
  silence. Not the old synthesised `lib/sfx.mjs` voices: on a phone they are
  dull thuds. `sfx.mjs` stays for the mix, the ducking and the guards.
- **From post65, real recorded Mixkit sound effects are the default for
  clips.** ElevenLabs sound effects only when Mixkit has nothing that fits.
  The method is the dropchad promos': Mixkit's own preview mp3s, each file
  trimmed to its first sound, its hit measured as its loudest 10ms and placed
  on the moment, layered where a move needs it (a whoosh into an impact). The
  files live in `demo/assets/sfx-mixkit/`, ignored, never pushed: the Mixkit
  Sound Effects Free License allows social video and commercial use but not
  redistributing the files. Each file is listed with its id, title and source
  page in that folder's `LICENSES.md`. The ElevenLabs music bed stays.

### Critique loop, before Einz sees any preview

1. Render a contact sheet, one frame per half second, 6 across, to
   `demo/out/verify-postNN/contact.png`, and a phone test sheet at 360px wide.
2. Look at both properly, as a harsh motion director, and score 1 to 10:
   hook in the first 1 second, readable at phone size, motion quality, something new
   every 1.5 to 3 seconds, composition, mascot rules followed, sound sync if there is
   sound. Plus the four retention scores: hook reads in the first second, longest
   dead stretch, captions readable on the 360px phone sheet, the glitch sound on
   exactly the glitch frames into the card.
3. Write the scores and the 3 worst problems with timestamps to
   `demo/out/verify-postNN/review.md`. Fix them, re render, repeat until every score
   is 8 or more. Max 3 rounds.
4. Then report to Einz the final scores in one line, with the last five lines.

## Deployment

- GitHub Pages, serving `main` branch from root.
- DNS at Hostinger, A records pointed at GitHub Pages, `CNAME` file holds the apex
  domain.
- Deploy = push to `main`. There is no staging.
- Because push is publish: check the diff for secrets and client names before every
  push, and run `node tools/build-langs.mjs --check` so no generated page ships stale.

## What Claude Code should NOT do

- Add a build step, a package manager, or a framework "to make it maintainable".
- Split the file into components, partials, or a `src/` directory.
- Pull in Tailwind, Bootstrap, Font Awesome, or any CDN script or CSS library.
  (Google Fonts is the one exception, for Michroma and Space Grotesk only, in one
  request — see Build constraints. Never a third family, never a Michroma weight
  beyond 400 or a Space Grotesk weight beyond 400 and 500.)
- Add a roadmap, a team section with fake headshots, testimonials, or logo walls.
- Write corporate filler copy, taglines with "solutions", or AI-generated blurb.
- Add emoji, glassmorphism, drop shadows, or gradients on text.
  (Rounded pills and background gradients were both allowed at v1, in named scopes
  only — see Layout and Depth in `skills/page-builder/SKILL.md`. Don't widen them.)
- Invent client names, case studies, headcounts, or metrics.
- Add analytics or a chat widget.
- Move `index.html` or `CNAME` out of root.
