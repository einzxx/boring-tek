# video-review — SKILL.md

Watch a finished clip and write down what is actually on the screen, second by
second, then judge it against the house checklist.

This is the eyes. `demo/`'s guards measure geometry and sound and they pass on
clips that look wrong: post9 shipped a first cut with every check green, and a
phone showed captions inside tiktok's chrome, a green card the brief bans, and a
wordmark decoding into `SHE / 7/RING / MEK`. Numbers cannot see that. This can.

Adapted from `fabriqaai/ffmpeg-analyse-video-skill`, which is instructions only
and ships no code. What was taken is the shape — sample, batch, read, synthesise
— and the sampling ladder. What was dropped is everything that reaches the
network.

## Non-negotiables

- **Local files only.** A path on this disk, nothing else. No yt-dlp, no
  downloads, no urls. If someone hands you a link, ask for the file.
- **No transcription.** No whisper, no speech to text. Our clips are made here
  and the script is written down in the post file before the voice is
  synthesised, so the words are already known. Read them out of the script and
  the run's own output; do not infer them from the audio.
- **No new dependency.** Frame extraction uses `demo/node_modules`'
  `ffmpeg-static`, which the render pipeline already carries. That binary ships
  no ffprobe, so metadata is parsed off ffmpeg's own stderr.
- **The frames are disposable.** They land under `demo/out/`, which is
  gitignored whole. Nothing this skill produces is committed except the review,
  and only if somebody asks for it to be.
- **Judge the clip, not the plan.** Read what is on the frame. If the run's log
  says the caption cleared a border by 191px and the frame shows it touching
  one, the frame is right and something upstream is measuring the wrong thing.

## How to run it

### 1. Pull the frames

```
node skills/video-review/frames.mjs demo/out/post9-1080x1920.mp4
```

Writes `demo/out/frames-review-<name>/` with one jpeg per sample, each named
with the second it came from, plus `index.json` and `index.txt`.

| flag | what it does |
|---|---|
| `--every=0.5` | sample twice as densely. Default is a frame a second under 45s, then 2s, 5s, and a cap of 60 frames past ten minutes |
| `--from=8 --to=18` | one stretch, when a beat needs a closer look |
| `--width=720` | bigger jpegs. 540 is the default and it is enough to read a caption |
| `--guides` | draw the platform safe area on every frame as a magenta rectangle. Use it for the margin pass and nothing else, then re-extract clean |
| `--max=40` | cap the frame count |

### 2. Read them in batches

Read **8 to 10 frames at a time**, in order, and write a line per frame as you
go: the second, what is on screen, and any caption text you can read. Do not
read the whole set in one go and do not skip about — the review is a timeline
and it is only useful if it was built like one.

Every filename carries its own timestamp, so a batch never has to be matched
back to the clock by guessing.

**If the caller has asked for sub-agents**, hand each batch to one and have it
return text only; images then never enter the main context, which is the
upstream skill's whole trick and it saves roughly 90% of it. **Do not spawn
agents unless asked** — reading the batches directly is the default here.

### 3. Write the review

To `demo/out/review-<name>.md`. Structure:

```
# <name> — review
<duration>, <resolution>, <fps>, <audio yes/no>, reviewed from <frames dir>

## timeline
0.00s   <what is on screen>   caption: "<text>"
1.00s   ...

## the checklist
<one line per item below, with a verdict and the seconds that prove it>

## what is wrong
<ordered worst first, each with a timestamp and what to change>

## what is right
<short. the point of this file is the list above it>
```

Every claim gets a second attached to it. "The captions are too low" is not a
review; "the caption at 14.00s sits on the info card's second line" is.

## The checklist

Run every clip against all of it. An item that does not apply is marked `n/a`
with the reason, never left out.

### 1. Platform safe margins

For anything going to tiktok, instagram or youtube: **180 device px clear at the
top, 220 at the bottom, 140 left and right**, of a 1080x1920 master. Nothing we
draw may sit inside them — captions, wordmark, end card, pictograms. The
platforms put a button column down the right, a caption across the bottom and
their own chrome top and bottom, and 96px is not enough for any of it.

Run `--guides` and look at whether anything crosses the rectangle. The numbers
are in `MEMORY.md`; the frame is what settles it.

### 2. Caption readability and placement

- Can every card be read at a glance, at phone size, over whatever is behind it.
- **One fixed zone for the whole clip.** A caption that sits in a different
  place per beat reads as clutter drifting about. If it moves, say where and
  when.
- Nothing the caption sits on should be competing with it: check the darkest
  thing behind each card, not the average.
- No card straddles a clause it does not belong to. `do it we` is three words
  that were never a phrase and it shipped once.

### 3. No green cards when the float style is specified

The float style is ink or paper on nothing: **no card, no fill, no green
background, anywhere.** The single accent may touch only the money words the
post file names, and only on the frames they are being said on.

Green in the pictogram zone counts. A solid accent shape held for seconds is a
green card by another name, and that is what post9's first cut shipped.

**If in doubt, no green at all.**

### 4. Camera moves landing on beats

A move should arrive as its line does, not after it. Check the frame at each
beat's first word against the run's own timestamps: a snap should be **finished**
there, not starting. Snaps are six to ten frames; anything slower is a pan
wearing a snap's name, anything faster is a cut.

Look for the smear too. With the shutter open a fast move blurs and lands sharp;
if a snap is crisp all the way through, the blur did not run.

### 5. Nothing colliding with site text

On clips that film the live site: no caption, cursor or wordmark may sit on top
of anything the page has written. The page has very few bands with no writing in
them, so this is the item most likely to fail. Name the element and the second.

### 6. Wordmark present and legible

It should be on screen where the clip's own layout says, and it should read.
Watch for the site's own h1 decode being caught mid scramble on a cut — the
brand name arriving as nonsense is worse than it being absent.

### 7. Pacing, and dead spots

- Is anything frozen. Nothing should ever be a still frame: there should always
  be a drift, a blink, a caption arriving.
- Is any beat holding longer than it earns.
- Does the end card hold long enough to be read, and not so long it stalls.
- Where would a viewer's thumb move. Say the second.

## When this is the wrong tool

Past about ten minutes the sampling gets too sparse to say anything useful. It
is built for our clips, which are twenty odd seconds. It also cannot hear: the
mix is measured by `demo/lib/sfx.mjs` and reported by the post file's own run,
and this skill should quote those numbers rather than pretend to have listened.
