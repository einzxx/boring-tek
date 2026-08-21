# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- Phase: **coming soon page is built and live** at theboringtek.com. Full agency site
  is the next milestone, not started.
- Site is a single static file served by GitHub Pages from `main` root. Push to `main`
  is the deploy — there is no staging, so check the diff before every push.

## Current state

- **Domain:** theboringtek.com — live on GitHub Pages.
- **DNS:** done at Hostinger, pointed at GitHub Pages. `CNAME` in repo root holds the
  apex domain.
- **Repo:** github.com/einzxx/boring-tek, public.
- **Live page:** the coming soon page. Mascot with cursor-following eyes, Michroma
  wordmark decoding between THE BORING TEK and COMING SOON, subline that types itself
  once, phosphor glow on both, CRT grain + vignette, cursor proximity on desktop.
  Stacks to three lines under 640px. Single file, ~20KB, one external request
  (Michroma).
- **Project files:** CLAUDE.md, MEMORY.md, skills/, assets/ — all tracked.

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
- 2026-08-21 — Headline and subline are one `.lockup` block, tight gap, centred as a
  group. Never loose siblings sharing a wrapper gap.
- 2026-08-21 — Mascot: adopted, scoped to favicon-only, then replaced with the
  white-face character; now **variant 5 (tired eyes) and final**, and back on the page
  with cursor-following eyes and a blink. See below.

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

- The mascot **is on the page** now: small, centred, top of the lockup above the
  headline. This reverses the earlier favicon-only decision.
- **Eyes follow the cursor** on desktop — a few units toward the pointer, capped so
  they can never slide off the face. Runs on the existing shared rAF loop and pointer
  handler, no second loop.
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

1. Decide what the coming soon page captures: nothing, or one contact route (email
   link, no form backend since there's no backend).
2. Later: full site — services, process, work, contact.

## Open questions

- Social handles for The Boring Tek — not secured yet, not linked anywhere.
- Business email to publish on the site — not decided.
- Whether the full site stays single-file or gets multiple pages. Default: stays
  single-file until it genuinely can't.

## Not committed / lives elsewhere

- Brand image assets (`BT.png`, headers, mascot renders) sit in
  `~/Downloads/Boring TEK files/`. Nothing committed to the repo yet — decide format
  and whether inline SVG can replace them before adding any binary.
