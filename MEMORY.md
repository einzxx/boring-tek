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

## Next steps

1. Build the real coming soon page — replace the placeholder `index.html`.
2. Decide what the coming soon page captures: nothing, or one contact route (email
   link, no form backend since there's no backend).
3. Lock the logo / wordmark treatment (assets exist outside the repo in
   `Boring TEK files/`, nothing committed yet).
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
