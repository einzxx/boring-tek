# THE BORING TEK — CLAUDE.md

Agency building custom AI agents, backend infrastructure and workflow automation.
Domain: theboringtek.com. Repo: github.com/einzxx/boring-tek (PUBLIC).

## What this is

- **Now:** a static coming soon page. One file, no build step, no dependencies.
- **Later:** the full agency site — services, work, process, contact. Same repo, same
  constraints until explicitly lifted.

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
- Never claim work, clients, metrics or partnerships we can't name.
- Humour is dry and deadpan, never memey.

Read like a terminal, not a brochure.

## Visual identity

- Black background. Monospace. Green/amber terminal accents.
- Full spec lives in `skills/page-builder/SKILL.md` — that is the source of truth for
  colors, type and layout. Never invent tokens outside it.

## Structure

```
boring-tek/
├── index.html          # the live site — single file, root, never moves
├── CNAME               # theboringtek.com — never edit, never move
├── CLAUDE.md           # this file
├── MEMORY.md           # decisions + current state, updated every session
└── skills/
    ├── SKILL.md        # index of available skills
    └── page-builder/
        └── SKILL.md    # design system + build rules for pages
```

Read `MEMORY.md` before starting any work. Update it after every session that changes
state or makes a decision.

## Hard rules

### Public repo — treat every tracked file as published

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
- **Zero dependencies.** No npm, no package.json, no build step, no bundler, no
  framework, no CSS library, no icon library, no CDN links, no external fonts.
- **No external requests at runtime.** Everything the page needs ships in the file.
  System monospace stack only.
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

## Deployment

- GitHub Pages, serving `main` branch from root.
- DNS at Hostinger, A records pointed at GitHub Pages, `CNAME` file holds the apex
  domain.
- Deploy = push to `main`. There is no staging.
- Because push is publish: check the diff for secrets and client names before every
  push.

## What Claude Code should NOT do

- Add a build step, a package manager, or a framework "to make it maintainable".
- Split the file into components, partials, or a `src/` directory.
- Pull in Tailwind, Bootstrap, Google Fonts, Font Awesome, or any CDN.
- Add a roadmap, a team section with fake headshots, testimonials, or logo walls.
- Write corporate filler copy, taglines with "solutions", or AI-generated blurb.
- Add emoji, gradients, glassmorphism, drop shadows, or rounded pill buttons.
- Invent client names, case studies, headcounts, or metrics.
- Add analytics or a chat widget.
- Move `index.html` or `CNAME` out of root.
