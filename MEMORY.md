# THE BORING TEK — MEMORY.md

Running log of decisions and current state. Read before any work. Update after every
session that changes state or makes a decision. Public repo — no secrets, no client
names in here either.

## Status

- Phase: coming soon. Placeholder page is live, real coming soon page is next.
- Site is a single static file served by GitHub Pages from `main` root.

## Current state

- **Domain:** theboringtek.com — live on GitHub Pages.
- **DNS:** done at Hostinger, pointed at GitHub Pages. `CNAME` in repo root holds the
  apex domain.
- **Repo:** github.com/einzxx/boring-tek, public.
- **Live page:** placeholder only — `index.html` reads "BORING TEK is booting".
- **Project files:** CLAUDE.md, MEMORY.md, skills/ added 2026-08-21.

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
- 2026-08-21 — Headline caps at 4.5rem on desktop, and stacks to three lines
  (THE / BORING / TEK) under 640px, matching the logo lockup.
- 2026-08-21 — Mascot adopted (see below). Favicon generated from it inline, no file.

## Mascot

Minimal pixel bot: **square head outline, two glowing green pixel eyes, nothing else.**
No mouth, no body, no antenna, no arms. It's a presence indicator, not a character —
the visual equivalent of a machine that's on and not asking for attention.

- Inline SVG on a 12×12 pixel grid, `crispEdges`, decorative (`aria-hidden`).
- Head: four 1-unit bars forming a square ring with the four corner pixels omitted.
  That bevel is what makes it read as pixel art rather than a CSS border.
- Eyes: two 2×2 squares at (3,5) and (7,5), phosphor green, glow from an SVG
  `feGaussianBlur` merged twice.
- Blink is the only thing it ever does: both eyes snap dark for ~75ms every ~5.2s,
  `step-end`, no fade, no wink.
- Placed small (24–34px) and centered above the headline.
- Favicon is the same mascot reduced to eyes-only on a dark square, embedded as an SVG
  data URI in `<link rel="icon">`. The head outline turns to mush at 16px so it's
  dropped.

Full geometry and the do-not-do list live in `skills/page-builder/SKILL.md` → Mascot.
That file is the source of truth; keep the mascot identical everywhere it appears.

## Next steps

1. Build the real coming soon page — replace the placeholder `index.html`.
2. Decide what the coming soon page captures: nothing, or one contact route (email
   link, no form backend since there's no backend).
3. Check the mascot against the logo art in `Boring TEK files/` — it was drawn to the
   spec above, not traced from the source files.
4. Later: full site — services, process, work, contact.

## Open questions

- Social handles for The Boring Tek — not secured yet, not linked anywhere.
- Business email to publish on the site — not decided.
- Whether the full site stays single-file or gets multiple pages. Default: stays
  single-file until it genuinely can't.

## Not committed / lives elsewhere

- Brand image assets (`BT.png`, headers, mascot renders) sit in
  `~/Downloads/Boring TEK files/`. Nothing committed to the repo yet — decide format
  and whether inline SVG can replace them before adding any binary.
