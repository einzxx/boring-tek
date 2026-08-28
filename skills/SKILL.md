# THE BORING TEK — SKILL.md

Index of skills available in this project. Each skill is a folder under `skills/` with
its own `SKILL.md` holding the full spec. Read the relevant skill before doing that
kind of work — the skill file is the source of truth, this page is just the map.

## Available skills

### `page-builder`

**File:** `skills/page-builder/SKILL.md`

Builds single-file HTML/CSS/JS pages in The Boring Tek style — monospace, two themes
(light default, dark), no frameworks. Holds the design tokens (colors, type, spacing),
the layout rules, the copy rules, the mascot spec, the speech bubble, the contact form,
and the shipping checklist.

**Use it when:** creating or editing any page in this repo — the live site or any
one-off page.

**Do not:** invent colors, fonts or spacing outside this spec, or reach for a
framework because the spec doesn't cover something. Ask instead.

### `video-review`

**File:** `skills/video-review/SKILL.md`  ·  **Script:** `skills/video-review/frames.mjs`

Watches a finished clip and writes down what is actually on the screen, second
by second, then judges it against the house checklist: platform safe margins,
caption readability and placement, no green where the float style bans it,
camera moves landing on their beats, nothing colliding with the site own text,
the wordmark, and pacing.

**Use it when:** a clip has finished rendering and before it is posted. The
guards in `demo/` measure geometry and sound; they pass on clips that look
wrong, which is what this is for.

**Run it:** `node skills/video-review/frames.mjs demo/out/<clip>.mp4`, then read
the frames in batches of eight to ten and write the review. Full instructions in
the skill file.

**Do not:** point it at a url, transcribe the audio, or add a dependency for it.
Local files only, and the script is already written.

It is the first skill here that ships code as well as instructions. The script
is the extraction half only; the reading and the judging happen in the
conversation, which is the half that cannot be automated.

## Adding a skill

One folder per skill, `skills/<name>/SKILL.md`, and a section added here. Keep skills
about *how we build things*, not about project status — status lives in `MEMORY.md`.
Public repo: no client names or secrets in skill files either.
