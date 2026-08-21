# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- Phase: **coming soon phase is DONE.** The page is finished and live at
  theboringtek.com, the mascot is final, and the socials are dressed. Nothing on the
  site is outstanding.
- Next milestone: **social content rhythm** — posting cadence and what actually goes
  out. The full agency site comes after that, not before.
- Site is a single static file served by GitHub Pages from `main` root. Push to `main`
  is the deploy — there is no staging, so check the diff before every push.
- Everything through 2026-08-21 is committed and pushed. Working tree clean.

## Current state

### Site

- **Domain:** theboringtek.com — live on GitHub Pages.
- **DNS:** done at Hostinger, pointed at GitHub Pages. `CNAME` in repo root holds the
  apex domain.
- **Repo:** github.com/einzxx/boring-tek, public.
- **Live page** — the finished coming soon page:
  - Mascot (final tired-eyes variant) at the top of the lockup, eyes tracking the
    cursor, blinking on its own, soft phosphor halo behind it.
  - Michroma wordmark decoding between THE BORING TEK and COMING SOON, three-line
    lockup under 640px.
  - Subline types itself once, `1rem` cap, `--p-100` pale white-green with a subtle
    glow — same tone family as the headline letters.
  - **All text is static.** No lean, no translate, no brightening on mouse move. The
    mascot's eyes are the only thing on the page that reacts to the pointer.
  - CRT grain, radial vignette, phosphor glow throughout.
  - Single file, ~19KB, one external request (Michroma from Google Fonts).
- **Favicon:** the mascot, transparent background, no plate, inline data URI.
- **Project files:** CLAUDE.md, MEMORY.md, skills/, assets/ — all tracked and pushed.

### Socials

- Dressed and consistent: mascot as the avatar and **THE BORING TEK** as the name
  everywhere. Same face, same wordmark, no per-platform variation.
- Banners delivered for **X, Facebook and YouTube**.
- **Bio line, locked:** `the future is cool. building it is boring.`
  Use it verbatim everywhere a bio is asked for. Do not reword, do not "improve" it.

## Decisions

- 2026-08-21 — Static coming soon page first, full agency site later in the same repo.
- 2026-08-21 — Single file, zero dependencies, no build step. In force until
  explicitly lifted.
- 2026-08-21 — `index.html` and `CNAME` live in the repo root permanently. Pages
  depends on both.
- 2026-08-21 — Repo stays public, so no secrets and no client names in any tracked
  file, ever. Anonymised case studies only.
- 2026-08-21 — Brand voice: raw, anti-corporate, terminal-native. Lowercase, no
  emoji, no corporate filler.
- 2026-08-21 — Visual direction: black background, monospace, terminal styling. Spec
  lives in `skills/page-builder/SKILL.md`.
- 2026-08-21 — Services scoped to three: custom AI agents, backend infrastructure,
  workflow automation.
- 2026-08-21 — Headline face is Michroma (Google Fonts), the single external request
  the site is allowed. Single weight 400 — no bold exists, never fake one. Mono stays
  for everything else.
- 2026-08-21 — Headline caps at 2.75rem, uniform on desktop and in the stacked mobile
  lockup. No separate mobile cap. It should sit as one elegant centred line with air
  around it, not wall to wall.
- 2026-08-21 — Mascot, headline and subline are one `.lockup` block, centred as a
  group. Never loose siblings sharing a wrapper gap.
- 2026-08-21 — Mascot: adopted, scoped to favicon-only, then replaced with the
  white-face character; now **variant 5 (tired eyes) and final**, and on the page with
  cursor-following eyes, a blink and a halo. See below.
- 2026-08-21 — **Only the mascot reacts to the pointer.** The headline and subline are
  fully static — no lean, no translate, no brightening on mouse move. An earlier build
  had the whole lockup leaning and brightening; that was removed on purpose. One thing
  reacting reads as a character noticing you; everything reacting reads as a gimmick.
- 2026-08-21 — Subline is `--p-100` pale white-green at a `1rem` cap, the same tone
  family as the headline letters, glow kept subtle. It was briefly a dim gray-green
  (`--p-mute`); that token is retired.
- 2026-08-21 — **Bio line locked:** `the future is cool. building it is boring.`
  Verbatim everywhere. It is the whole positioning in one line — don't reword it.
- 2026-08-21 — Socials carry the mascot as avatar and THE BORING TEK as the name on
  every platform. No per-platform variation, no alternate marks.
- 2026-08-21 — **Coming soon phase closed.** Next milestone is social content rhythm;
  the full agency site waits until after that.

## Mascot — variant 5, tired eyes, FINAL

A **white soft circle face with two dark flat rounded-rectangle eyes sitting low on the
face**, wider than tall. Heavy, bored, unbothered. Nothing else — no mouth, no nose, no
body, no outline, no shading.

Locked 2026-08-21. Variant 5 is the official face. Earlier variants (the pixel bot,
then the tall vertical-dash face) are superseded and gone. Do not redesign.

### Files

- `assets/mascot.png` — original art, the reference.
- `assets/mascot.svg` — the vector on a 64×64 grid. Source of truth; everything else is
  cut from it. Transparent, neutral pose.
- `assets/mascot-left.svg`, `-right.svg`, `-up-left.svg`, `-up-right.svg` — pose
  variants, eyes slid toward that side. The up poses add a 4° tilt. Only the eye group
  moves; the face never does. Saved for future use, not referenced by the site yet.
- Favicon is `mascot.svg` inlined as a data URI in `<link rel="icon">` — identical
  element for element, transparent, no plate, neutral pose, no separate file.

### On the site

- The mascot **is on the page**: large (up to 130px), centred, at the top of the lockup
  with clear space beneath him, and a soft phosphor halo behind him. He is a character,
  not an icon. This reverses the earlier favicon-only decision.
- **Eyes follow the cursor** on desktop, from anywhere on screen — real travel, quick
  arrival, capped so they can never slide off the face. Runs on the existing shared rAF
  loop and pointer handler, no second loop. He is the only element that reacts to the
  pointer.
- **Blinks every 4–6s** with randomness, eyes squash flat for ~120ms. Both eyes, snap
  not fade.
- **Touch and reduced motion: eyes centred, blink only.** The blink is the one
  deliberate reduced-motion exception on this site — small, local, non-vestibular, and
  it's what keeps the mascot from reading as a dead sticker.
- White face `#f4f7f5`, eyes `#06070a` (the page background, so the eyes read as
  punched through). White-on-dark is the primary version.

Exact geometry, the proportion table, the variant transforms and the do-not-do list
live in `skills/page-builder/SKILL.md` → Mascot. That file is the source of truth; keep
the mascot identical everywhere it appears.

## Next steps

Coming soon phase is closed. Nothing on the site or the brand marks is outstanding.

**Milestone: social content rhythm** (current)

1. Decide the cadence — how often, on which platforms, who it's for.
2. Decide the content pillars. The brand is "boring on purpose": the obvious angles are
   showing infrastructure work plainly, killing manual processes, and dry takes on AI
   hype. Confirm before producing anything.
3. Build a reusable post format that carries the mascot and the terminal look, the way
   the banners do.
4. Decide whether posts point anywhere yet — the site is a coming soon page with no
   contact route, so there may be nothing to send people to.

**Milestone: full agency site** (after the above)

5. Services, process, work, contact. Same repo, same single-file constraint until
   explicitly lifted.
6. Decide the contact route: an email link, or a real backend. There is no backend
   today, so a form needs a decision first.

## Open questions

- Social accounts exist and are dressed, but the **handles aren't recorded here** and
  aren't linked from the site. Write them down next session.
- Business email to publish on the site — not decided. Blocks the contact route.
- Whether the full site stays single-file or gets multiple pages. Default: stays
  single-file until it genuinely can't.
- Whether the site should link out to the socials now that they're live.

## Not committed / lives elsewhere

- **Social banners** for X, Facebook and YouTube — delivered, not in this repo. They
  live with the rest of the brand art, not under `assets/`.
- Brand image assets (`BT.png`, headers, earlier mascot renders) sit in
  `~/Downloads/Boring TEK files/`. Not committed — decide format and whether inline SVG
  can replace them before adding any binary.
- `assets/` in the repo holds only the mascot: `mascot.png` (reference), `mascot.svg`
  (source of truth) and the four pose variants.
