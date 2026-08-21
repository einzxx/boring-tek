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
- **Live page:** the coming soon page. Michroma wordmark decoding between
  THE BORING TEK and COMING SOON, subline that types itself once, phosphor glow on
  both, CRT grain + vignette, cursor proximity on desktop. Stacks to three lines under
  640px. Single file, ~17KB, one external request (Michroma).
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
- 2026-08-21 — Mascot adopted, scoped to **favicon only**, then replaced with the
  final white-face character and locked. See below. Favicon is inline, no file.

## Mascot — FINAL

A **white soft circle face with two dark vertical dash eyes.** Nothing else — no mouth,
no nose, no body, no outline, no shading. Calm, blank, unbothered. It's a presence, not
a character with a personality.

Locked 2026-08-21. Rebuilt as clean vector from the original art. Do not redesign.

**Favicon only.** It lives in the browser tab and nowhere else — no hero mark, no
header logo, no footer bug. The page carries the wordmark; the tab carries the mascot.
Putting it into a page is a decision, not a build detail.

- `assets/mascot.png` — original art, the reference.
- `assets/mascot.svg` — the rebuilt vector on a 64×64 grid. Source of truth for every
  other use; transparent background, no plate.
- Favicon is that same SVG inlined as a data URI in `<link rel="icon">` — identical
  element for element, transparent background, no plate, no separate file.
- White face `#f4f7f5` on dark, eyes `#06070a` (the page background, so the eyes read
  as punched through). White-on-dark is the primary version.
- **Static.** No blink, no bob, no cursor tracking. The dash eyes already read as
  half-closed; animating them turns a calm mark into a cartoon. The earlier pixel-bot
  mascot and its blink are superseded and gone.

Exact geometry, the proportion table and the do-not-do list live in
`skills/page-builder/SKILL.md` → Mascot. That file is the source of truth; keep the
mascot identical everywhere it appears.

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
