/* the boring tek — post24, how many people use ai.

     cd demo
     DEMO_FPS=12 node post24.mjs      the preview pass
     node post24.mjs                  60fps final
     node post24.mjs --voice          the read and the clock only, no browser
     node post24.mjs --encode-only    re-encode from kept frames
     node post24.mjs --keep-frames    leave the jpegs on disk

   **one output path, overwritten every run:**
   `demo/out/post24-dark-1080x1920.mp4`. Beat stills land in
   `demo/out/verify-post24/`.

   ---------- what it is ----------
   the globe turns with the mascot standing on top of it waving, and a question
   over them both. he jumps off and falls out of the bottom of the frame; the
   camera goes after him and the earth leaves through the top. three numbers type
   themselves onto black, each cut to the line being said. he comes back up into
   the middle, lands, and gives it a thumbs up. then the house fault takes the
   lot and puts the wordmark up.

   ---------- what it reuses, which is nearly all of it ----------
   `lib/globe.mjs` is the globe out of `globe-test.mjs` — the same sphere, the
   same graticule, the same pings on black. it moved into lib/ the day this file
   wanted it, because two copies of a sphere is two spheres.

   `lib/mascot.mjs` draws him, `lib/captions.mjs` sets the three numbers,
   `lib/voice.mjs` fetches the read from elevenlabs and `lib/sfx.mjs` builds the
   whoosh and the key ticks and does the mix. what is left in this file is the
   clock, the two moves and the end card.

   ---------- the clock is the read, not the brief ----------
   the brief gives beat times to the tenth. **they are the shape rather than the
   numbers**, because this house cuts the picture to the read and a synthesiser
   does not return the length you hoped for. every join below is derived from
   where the words actually landed, and `--voice` prints the two side by side so
   the drift is a number somebody can look at rather than a surprise in a render.

   ---------- two captions are drawn here and three are the module's ----------
   `captions.mjs` plans **one** style into **one** box per page: the css and the
   markup carry fixed class names, so two plans in one page would paint over each
   other. the three numbers are the plan — they are the cards with numbers in
   them and they are what the brief pointed at the module for — and the question
   and the closing line are drawn in this file, in the module's own tokens and at
   the module's own face. that is post20's arrangement and it is here for
   post20's reason.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  headRect, mascotPagePlan, STAGE, SAFE, THEMES, HEAD_PX,
} from './lib/mascot.mjs';
import { globeCss, globeMarkup, globeScript, GLOBE_FONT, readLand } from './lib/globe.mjs';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, brandTokens,
} from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  SR, GAINS, renderSfx, decode, mixdown, applyGain, limit,
  writeWav, loudness, voiceEnvelope, dbfs,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post24');
const VERIFY = path.join(OUT, 'verify-post24');

const VW = STAGE.w, VH = STAGE.h, DSF = STAGE.dsf;
const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1 / FPS;
const THEME = 'dark';

const argv = process.argv.slice(2);
const VOICE_ONLY = argv.includes('--voice');
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');

/* ---------- the read ----------
   five lines, one a beat, elevenlabs' default narrator. no per line rate or
   pitch: on the elevenlabs path rate becomes `speed` and pitch is dropped
   entirely, and this film wants the house voice reading plainly. */
const VOICE = 'calm';
const LINES = [
  { text: 'how many people on earth use ai.' },
  { text: 'over one billion. every month.' },
  { text: 'that is sixteen percent of the whole population on earth.' },
  { text: 'growing faster than the internet did.' },
  { text: 'the future is already here.' },
];

/* what the brief asked for, kept so the report can print the drift rather than
   quietly rendering something else. */
const ASKED = { wave: [0, 2], jump: [2, 3], type: [3, 7], back: [7, 9], hold: [9, 10] };

/* ---------- the joins, which are the only times typed in this file ---------- */
const VOICE_AT = 0.30;        /* the first word */
const GAP = { afterQ: 0.85, betweenNumbers: 0.30, beforeClose: 0.42 };
const JUMP_AFTER = 0.16;      /* he goes when the question has landed */
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.12;

/* ---------- the globe ----------
   globe-test's own numbers. it starts a shade tighter than the harness so the
   zoom out has somewhere to come from, and `rate` is the harness's 24 a second.

   the pings are the harness's too, seeded the same, so the film gets the same
   schedule the review already looked at. */
const G = { d: 340, cx: VW / 2, cy: 548, tilt: 14, spin0: 20, rate: 24 };
const ZOOM = { from: 1.06, to: 0.90 };   /* the slow pull back over beat one */

/* ---------- him ----------
   a third of the globe across. 120 css of box puts the head at about 225 device
   px, which is inside the module's own 220..280 window and is 33% of the disc.
   he is small on purpose: a mascot standing on a planet is a small thing on a
   big thing or it is a mascot wearing a hat. */
const SIZE = 120;
const FOOT = 4;               /* css px his box sits above the disc's top edge */

/* ---------- the fall, the rise and the landing ----------
   post20's table outright, which is post19's: he stretches a tenth on the way,
   compresses to 1.52 wide by 0.66 tall over 70ms with his chin on the ground and
   springs out on a damped cosine that crosses zero exactly once.

   the fall off the globe is not a landing and takes no squash — he leaves the
   frame — so only the rise ends in one. */
const HOP = { up: 62, for: 0.20 };       /* the lift that clears the crown */
/* **how far down is measured against the camera, not against the frame.** he
   falls inside the scene and the scene is travelling up under him, so the drop
   has to cover the frame *plus* whatever the snap has taken off it, or he stops
   a hundred px short of the bottom edge and hangs there. */
const FALL = { for: 0.45, to: 1450 };
const RISE = { from: 1450, for: 0.52 };
const SMASH = { air: 0.10, flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };

/* ---------- the camera ----------
   one translate on the scene, and it is not `lib/camera.mjs`: that module moves
   a page under a zoom and reports what it can still hold, and this is a whip
   down after a falling object with nothing to keep in frame. a snap is six to
   ten frames at sixty; 0.14s is eight. */
/* 760 css px is the globe's own bottom edge: past that there is nothing left in
   the scene to push off the top and the extra travel is only speed. it matters
   because speed is capped — 760 over 0.36s is 35 css px between frames at
   sixty, under the 42 the shutter can still smear rather than tear. the first
   cut asked for 1150 over 0.30s, which is 64. */
const SNAP = { for: 0.36, by: 760 };

/* ---------- the three numbers ----------
   the module's `type` style, which is the one that lays a line down word by word
   rather than cutting cards. one plan, one box, three lines. */
/* **the box is {x, y, w, h}**, which is what every other clip in this folder
   hands the module and what `captionCss` lays out against. the first cut of this
   file wrote {top, left, width, height} and the caption laid itself out against
   four undefined values, which renders as nothing at all on a black frame — the
   one fault that looks exactly like a layer that never got applied.

   `bodySize` is the module's own knob for how big the type style sets, and 44
   is the brand's hero cap. these three lines are the whole clip, and they are
   the only thing on the frame while they are up, so they get it. */
const CAP = {
  style: 'type', maxLines: 3, bodySize: 44, lead: 0.05, hold: 0.34,
  box: { x: 70, y: 360, w: VW - 140, h: 240 },
};

/* the two this file draws. the module's face and the module's tokens, at a size
   the module would have picked, but placed against things the module cannot see
   — the top of a sphere and the crown of a mascot. */
/* **the question sits above his head, not above the globe.** the first render
   put it at 190 against a globe centred at 470, and he stands on top of the
   globe — so the two lines went straight through his face. the globe went down
   and the card went up, and the number that matters is the gap between the
   bottom of the second line and the top of his box, which the guards measure on
   the frame rather than trusting this arithmetic. */
const Q = { top: 98, size: 34, lh: 1.28, in: 0.26 };
const CLOSE = { size: 34, lh: 1.28, in: 0.24, below: 52 };

/* ---------- the end ----------
   post20's table. two stutters and a short hit, because the fault lands over a
   line somebody has just heard rather than under a laugh. he and the caption are
   cut on the hit frame and the wordmark is born on it, so the frame exchanges
   one thing for another and is never empty. */
const END = { hard: 0.12, tail: 0.18, wmFor: 0.09, clean: 0.06, hold: 0.95 };
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* ---------- the mix ---------- */
const CRF = 17;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0, MIN_LUFS = -16;
const STEP_CEIL = 42;

/* ---------- small maths ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const EASE = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const OUTC = p => 1 - Math.pow(1 - p, 3);
const INC = p => p * p * p;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the read, cached on the copy ---------- */
async function take(i) {
  const name = 'post24-l' + String(i + 1).padStart(2, '0');
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = LINES[i].text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && fs.existsSync(j.file)) return { ...j, i, cached: true };
  }
  return { ...(await speak(LINES[i].text, { voice: VOICE, name })), i, cached: false };
}

/* where a take's sound really starts and stops, off the waveform. the
   synthesiser's word boundary is shorter than the syllable it names, so a join
   trusted to the word list is not the join in the file. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => {
    let m = 0;
    for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +dbfs(peak).toFixed(1) };
}

/* the five takes on one clock. the gap in front of each is this film's own join
   and every one of them is named in GAP above. */
function buildVoice(takes) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const gapBefore = i => (i === 1 ? GAP.afterQ : i === 4 ? GAP.beforeClose : GAP.betweenNumbers);
  const beats = [], offs = [];
  let soundEnd = 0;
  for (let i = 0; i < takes.length; i++) {
    const e = edges[i];
    const at = i === 0 ? VOICE_AT : soundEnd + gapBefore(i);
    const off = +(at - e.start).toFixed(4);
    offs.push(off);
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    beats.push({
      i, text: LINES[i].text, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      peak: e.peak, timing: takes[i].timing, cached: takes[i].cached,
      seconds: takes[i].seconds,
    });
    soundEnd = beats[i].sound.end;
  }
  const lastWord = beats[beats.length - 1].end;
  const track = new Float32Array(Math.ceil((lastWord + 4.0) * SR));
  for (let i = 0; i < takes.length; i++) {
    const pcm = pcms[i], e = edges[i], off = offs[i];
    const a = Math.max(0, Math.round((e.start - PRE) * SR));
    const b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
    const at = Math.round((off + e.start - PRE) * SR);
    for (let j = a; j < b; j++) {
      const k = at + (j - a);
      if (k >= 0 && k < track.length) track[k] += pcm[j];
    }
  }
  return { beats, track, words: beats.flatMap(b => b.words) };
}

/* ---------- go ---------- */
fs.mkdirSync(OUT, { recursive: true });
const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const V = buildVoice(TAKES);
const B = V.beats;

/* ---------- the captions ---------- */
const cap = planCaptions(B.slice(1, 4).flatMap(b => b.words), {
  style: CAP.style, maxLines: CAP.maxLines, bodySize: CAP.bodySize,
  lead: CAP.lead, hold: CAP.hold,
  /* a line ends where the read ends a sentence, so the three cards are the
     three lines and each one is cut to its own take. */
  cardBreak: /[.!?]["')\]]?$/,
});

/* the cards are planned before the clock rather than after it, because two
   joins are cut against them: he comes back up after the last card has left,
   and the fault waits for the line under it. */

/* ---------- and now the clock, every number of it derived ---------- */
/* he goes a beat after the question has finished sounding. */
const JUMP_AT = +(B[0].sound.end + JUMP_AFTER).toFixed(4);
const HOP_TOP = +(JUMP_AT + HOP.for).toFixed(4);
const FALL_END = +(HOP_TOP + FALL.for).toFixed(4);
/* the camera goes after him, a little late, which is what makes it read as a
   camera reacting rather than as the frame being animated. */
const SNAP_AT = +(HOP_TOP + 0.06).toFixed(4);
const SNAP_END = +(SNAP_AT + SNAP.for).toFixed(4);
/* the globe is off the frame once the scene has travelled its own height past
   it; past that instant nothing in the globe layer is drawn at all. */
const DARK_AT = +Math.max(SNAP_END, FALL_END).toFixed(4);

/* he comes back a beat after the last number has stopped sounding **and after
   the last card has left**. the two are not the same instant: the module holds a
   line for CAP.hold past its last word, so a rise cut to the sound alone brings
   him up underneath a caption that is still on the frame. */
const CAP_OUT = +Math.max(...cap.groups.map(g => g.out)).toFixed(4);
const RISE_AT = +Math.max(B[3].sound.end + 0.30, CAP_OUT + 0.10).toFixed(4);
const LAND = +(RISE_AT + RISE.for).toFixed(4);
const THUMBS_AT = +(LAND + 0.10).toFixed(4);
/* the fault waits for the last **sound** rather than the last word boundary. */
const FAULT_AT = +(B[4].sound.end + 0.36).toFixed(4);
const WM_AT = +(FAULT_AT + END.wmFor).toFixed(4);
const SECONDS = +(FAULT_AT + END.hold).toFixed(4);

/* the two this file draws, each one on its own line's clock. */
const Q_IN = +(B[0].start - 0.12).toFixed(4);
const Q_OUT = JUMP_AT;
const C_IN = +(B[4].start - 0.14).toFixed(4);

/* ---------- the moves, as functions of one number ---------- */
/* the globe pulls back over the whole of beat one and then holds. */
function globeScale(t) {
  return +lerp(ZOOM.from, ZOOM.to, EASE(span(t, 0, JUMP_AT))).toFixed(5);
}
/* how far the scene has been whipped down after him. content goes up, so the
   earth leaves through the top. */
function sceneY(t) {
  if (t <= SNAP_AT) return 0;
  /* **and it comes back to nought the moment there is nothing left to hold.**
     a translate that stays on carries the whole second half of the film 760px
     up with it, which put him off the top of the frame instead of in the middle
     of it. the reset is a cut at the same instant his base cuts, and both
     happen while he is five hundred px below the bottom edge. */
  if (t >= DARK_AT) return 0;
  return +(-SNAP.by * OUTC(span(t, SNAP_AT, SNAP_END))).toFixed(3);
}
/* where he is against his own mark, in css px, positive downward.

   three moves on one channel: a lift off the globe, a fall out of the bottom of
   the frame, and a rise back into the middle. `p²` on the fall because that is
   what gravity is; the rise decelerates into its landing because a jump does. */
function jumpY(t) {
  if (t < JUMP_AT) return 0;
  if (t < HOP_TOP) return +(-HOP.up * Math.sin(Math.PI * span(t, JUMP_AT, HOP_TOP))).toFixed(3);
  if (t < FALL_END) {
    const p = span(t, HOP_TOP, FALL_END);
    return +(FALL.to * p * p).toFixed(3);
  }
  if (t < RISE_AT) return FALL.to;
  if (t < LAND) return +(RISE.from * (1 - OUTC(span(t, RISE_AT, LAND)))).toFixed(3);
  return 0;
}
/* the compression, and it belongs to the landing only. */
function squashAt(t) {
  if (t < RISE_AT) return 0;
  if (t < LAND) return +(-SMASH.air * EASE(span(t, RISE_AT, LAND))).toFixed(5);
  const flat = span(t, LAND, LAND + SMASH.flat);
  if (flat < 1) return +lerp(-SMASH.air, SMASH.k, EASE(flat)).toFixed(5);
  const p = span(t, LAND + SMASH.flat, LAND + SMASH.flat + SMASH.back);
  if (p >= 1) return 0;
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p)
    * (1 - p)).toFixed(5);
}

/* ---------- the marks ----------
   two, and they are the two hands the brief allows. `wave` while he is on the
   planet, `thumbs-up` when he has landed. the face states are the module's own
   and neither of them authors the turn. */
const MARKS = [
  { t: 0.18, state: 'curious', side: 'right', hands: { pose: 'wave', entry: 0.34, hold: Math.max(0.5, JUMP_AT - 0.9) } },
  /* the hold runs to the fault and no further. the module wants entrance, hold
     and exit to fit inside the film, so the hold is what is left of it rather
     than a number typed here — and the hand is still up when the fault takes
     him, which is the brief's "hand stays". */
  { t: THUMBS_AT, state: 'delighted', side: 'right', hands: { pose: 'thumbs-up', entry: 0.40, hold: +Math.max(0.45, SECONDS - THUMBS_AT - 1.05).toFixed(3) } },
];

const plan = planMascot({
  seconds: SECONDS,
  hands: true,
  size: SIZE,
  theme: THEME,
  /* dead straight on. `pos` derives a corner bias and he is centred and talking
     to camera, which is post20's correction and the module's documented way of
     saying it. */
  bias: 0,
  marks: MARKS,
});

/* where his box has to sit for his feet to be on the globe, and where it sits
   in the second half. both are deltas against the plan's own box, applied as a
   transform on his zone — the module places him once and a clip that moves him
   moves the zone rather than writing a second plan. */
const HOME = { x: VW / 2 - SIZE / 2, y: VH / 2 - SIZE / 2 };
function masXY(t) {
  const s = globeScale(t);
  const onGlobe = G.cy - (G.d / 2) * s - SIZE - FOOT;
  /* he rides the globe until he leaves it, then he belongs to the frame. */
  /* **he holds the globe until he is off the frame, then he belongs to it.**
     the first cut eased his base from the globe's crown toward the middle of
     the frame across the whole of his absence, and the middle of the frame is
     *below* the crown — so for the first tenth of a second of the jump he sank
     into the planet instead of leaving it. the swap is a cut rather than an
     ease, and it happens while he is a thousand px below the bottom edge, so
     there is no frame it can be seen on. */
  const base = t < DARK_AT ? onGlobe : HOME.y;
  return {
    x: +(HOME.x - plan.box.left).toFixed(3),
    y: +(base - plan.box.top + jumpY(t)).toFixed(3),
  };
}

/* ---------- one frame of everything ---------- */
function frameAt(t) {
  const f = mascotFrame(plan, t);
  const k = squashAt(t);
  if (k) {
    const sq = 1 + k;
    /* a card scaled about its own centre lifts its bottom edge by the height it
       lost, so the same frame that writes the squash writes the ground back
       against it. that is the whole difference between a thing landing and a
       thing being squeezed in mid air. */
    const ground = t >= LAND ? (SIZE / 2) * (1 - 1 / sq) : 0;
    f.card = {
      ...f.card, y: +(f.card.y + ground).toFixed(4),
      sx: +(f.card.sx * sq).toFixed(5), sy: +(f.card.sy / sq).toFixed(5),
    };
    if (f.hands) f.hands = { ...f.hands, fit: { cx: +(f.hands.fit.cx / sq).toFixed(5), cy: +(f.hands.fit.cy * sq).toFixed(5) } };
  }
  const gone = t >= FAULT_AT;
  return {
    t,
    mas: f,
    move: masXY(t),
    globe: { on: t < DARK_AT, scale: globeScale(t), spin: G.spin0 + G.rate * t },
    scene: sceneY(t),
    cap: captionFrame(cap, t),
    /* **the type style stacks its lines and keeps them**, which is the whole
       point of it and is not what a group's `out` says: `out` is when that line
       stops being written, not when it leaves. so the layer is taken off the
       frame outright the moment the numbers beat is over, or all three of them
       are still sitting behind him when he lands. */
    capOn: t < RISE_AT,
    q: { o: +(OUTC(span(t, Q_IN, Q_IN + Q.in)) * (1 - span(t, Q_OUT, Q_OUT + 0.20))).toFixed(4) },
    close: { o: +OUTC(span(t, C_IN, C_IN + CLOSE.in)).toFixed(4) },
    gone,
    wm: { o: t >= WM_AT ? 1 : 0 },
    gl: glitchAt(t),
  };
}

/* ---------- the fault ----------
   a function of the output frame index rather than of t, which is post10's rule:
   a one frame rgb split written against t would be on for one subframe of four
   and land at a quarter strength. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function glitchAt(t) {
  const hit = span(t, FAULT_AT, FAULT_AT + END.hard + END.tail);
  if (t < FAULT_AT || hit >= 1) return { heat: 0, seed: 0 };
  const heat = heatAt(hit);
  return { heat: +heat.toFixed(4), seed: Math.floor(t * 1000) % 9973 };
}

/* ---------- the page ---------- */
function pageHtml(geojson) {
  const { light, dark } = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="${THEME}">
<head>
<meta charset="utf-8">
<title>post24</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@700;800&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg)}
.stage{position:relative;width:${VW}px;height:${VH}px;overflow:hidden;background:var(--bg)}
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

#scene{position:absolute;inset:0;will-change:transform}
#globe-move{position:absolute;inset:0;transform-origin:${G.cx}px ${G.cy}px;will-change:transform}
#mas-move{position:absolute;inset:0;will-change:transform}
${globeCss({ d: G.d, cx: G.cx, cy: G.cy })}
${mascotCss(plan)}
${captionCss(cap, CAP.box, { tokens: false })}

/* the two cards this file draws. Manrope, which is the face the captions in this
   house are set in, and the page's own --fg on nothing: no card, no fill. */
.mine{position:absolute;left:70px;width:${VW - 140}px;text-align:center;
  font-family:"Manrope",var(--body);font-weight:800;letter-spacing:-.015em;
  color:var(--fg);will-change:transform,opacity}
#q{top:${Q.top}px;font-size:${Q.size}px;line-height:${Q.lh}}
#close{top:${Math.round(VH / 2 + SIZE / 2 + CLOSE.below)}px;font-size:${CLOSE.size}px;line-height:${CLOSE.lh}}

#wm{position:absolute;left:0;right:0;top:${Math.round(VH * 0.40)}px;text-align:center;
  font-family:"Michroma",var(--mono);font-weight:400;color:var(--fg);
  font-size:${Math.round(WM.w / 3.1)}px;line-height:${WM.lh};letter-spacing:.02em;opacity:0}
#wm b{display:block;font-weight:400}
#flash{position:absolute;left:50%;top:50%;width:${GL.flashSize}px;height:${GL.flashSize}px;
  transform:translate(-50%,-50%);border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(255,255,255,0) 70%)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
  <div id="scene">
    <div id="globe-move">
      ${globeMarkup(geojson)}
    </div>
    <div id="mas-move">
      ${mascotMarkup(plan)}
    </div>
  </div>
  <div class="mine" id="q">how many people<br>on earth use ai</div>
  <div id="cap-hold">${captionMarkup(cap)}</div>
  <div class="mine" id="close">the future is<br>already here</div>
  <div id="wm">${WM.lines.map(l => '<b>' + l + '</b>').join('')}</div>
  <div id="flash"></div>
</div>
<script>
${globeScript({ d: G.d, cx: G.cx, cy: G.cy, tilt: G.tilt, spin0: G.spin0, rate: G.rate, seconds: SECONDS })}
<\/script>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(CAP.box)};
</script>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
(${captionPage.toString()})();
(function(){
  const scene = document.getElementById('scene');
  const gmove = document.getElementById('globe-move');
  const gzone = document.querySelector('.g-zone');
  const mmove = document.getElementById('mas-move');
  const mzone = document.querySelector('.m-zone');
  const q = document.getElementById('q');
  const close = document.getElementById('close');
  const wm = document.getElementById('wm');
  const flash = document.getElementById('flash');
  const cap = document.getElementById('cap-hold');
  const stage = document.querySelector('.stage');

  /* a seeded shake, so a frame rendered twice is the same frame. */
  function rnd(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  window.__post24 = {
    ready: true,
    apply(f){
      scene.style.transform = 'translate3d(0,' + f.scene + 'px,0)';
      gmove.style.transform = 'scale(' + f.globe.scale + ')';
      gzone.style.visibility = f.globe.on ? 'visible' : 'hidden';
      mmove.style.transform = 'translate3d(' + f.move.x + 'px,' + f.move.y + 'px,0)';
      mzone.style.visibility = f.gone ? 'hidden' : 'visible';
      q.style.opacity = f.q.o;
      close.style.opacity = f.gone ? 0 : f.close.o;
      /* display, not visibility: the module's own css sets visibility on the
         card elements, and a child that says visible overrides a parent that
         says hidden. display:none on a wrapper cannot be argued with. */
      if (cap) cap.style.display = (f.capOn && !f.gone) ? 'block' : 'none';
      wm.style.opacity = f.wm.o;

      /* the fault. a shake on the stage, an rgb split on the wordmark and a
         bloom at the centre — a wash over a frame whose subject is already cut
         renders as an even grey card, which is post12's note. */
      const h = f.gl.heat;
      if (!h){
        stage.style.transform = 'none';
        wm.style.textShadow = 'none';
        flash.style.opacity = 0;
      } else {
        const r = rnd(f.gl.seed || 1);
        const dx = (r() * 2 - 1) * ${GL.shakeX} * h;
        const dy = (r() * 2 - 1) * ${GL.shakeY} * h;
        stage.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
        const s = (${GL.split} * h).toFixed(2);
        wm.style.textShadow = '-' + s + 'px 0 rgba(255,0,64,.75), ' + s + 'px 0 rgba(0,255,208,.75)';
        flash.style.opacity = (${GL.flash} * h).toFixed(3);
      }
    },
  };
})();

/* the module's page half reports itself only once it has been asked to, and it
   has to be asked after the faces are loaded or every measurement it takes is a
   measurement of a fallback. post20's two lines, unchanged. */
/* **the wordmark is fitted, not sized.** michroma is very wide and BORING is
   its longest line; a font size picked by dividing the target width by a guess
   at the character count put the middle line off both edges of the frame, which
   is post9's SHE / 7/RING / MEK arriving a second time. so the page measures the
   widest of the three lines at a known size and scales to the target, then the
   run checks the cap height it ended up with against the floor. */
function fitWordmark(){
  const wm = document.getElementById('wm');
  const lines = [].slice.call(wm.querySelectorAll('b'));
  wm.style.fontSize = '100px';
  var widest = 0;
  for (var i = 0; i < lines.length; i++) widest = Math.max(widest, lines[i].getBoundingClientRect().width);
  var size = Math.floor(100 * ${WM.w} / widest);
  wm.style.fontSize = size + 'px';
  var r = lines[0].getBoundingClientRect();
  return { size: size, widestCss: +(widest * size / 100).toFixed(1), capPx: +(r.height * ${DSF} * 0.72).toFixed(1) };
}

Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('800 40px Manrope'),
  document.fonts.load('700 12px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__mas.build(), {
      cap: window.__cap.build(), wm: fitWordmark(),
    });
  });
</script>
</body>
</html>`;
}

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the sound ----------
   the whoosh on the fall, a key tick on every character the module types, and
   nothing else. no music, as asked. */
function cues() {
  /* the fall. it is on the top of the hop rather than on the jump, because the
     sound of something dropping starts when it starts dropping. */
  const out = [{ t: HOP_TOP, kind: 'whoosh' }];
  for (const c of cap.cells) {
    /* one tick a character, laid across that word's own spoken span, so the
       typing is cut to the read rather than to a grid. a cell carries `start`
       and `end` — the seconds the word is said between — and nothing else this
       needs. every level comes out of GAINS by kind, which is why no cue in
       this file carries a gain of its own. */
    const n = Math.max(1, (c.word || '').length);
    const per = (c.end - c.start) / n;
    for (let k = 0; k < n; k++) out.push({ t: +(c.start + per * k).toFixed(4), kind: 'key' });
  }
  return out.filter(c => c.t >= 0 && c.t < SECONDS).sort((a, b) => a.t - b.t);
}

/* ---------- report the clock ---------- */
function printClock() {
  const row = (name, a, b) => console.log('  ' + name.padEnd(22) + a.toFixed(2).padStart(6)
    + (b == null ? '' : '   brief said ' + b));
  console.log('\nthe boring tek — post24, how many people use ai\n');
  console.log('  the read, five takes on ' + VOICE + ' via elevenlabs:');
  for (const b of B) {
    console.log('    ' + (b.i + 1) + '  ' + b.start.toFixed(2) + '..' + b.end.toFixed(2)
      + '  sound ' + b.sound.start.toFixed(2) + '..' + b.sound.end.toFixed(2)
      + '  ' + (b.cached ? 'cached' : 'fetched') + ', timings from the ' + b.timing);
    console.log('       "' + b.text + '"');
  }
  /* the assembled read, as a level rather than as a promise. five takes that
     each decode fine can still sum to silence if the join arithmetic is wrong,
     and a mix at -70 LUFS is the only symptom until somebody plays it. */
  let peak = 0;
  for (let i = 0; i < V.track.length; i++) peak = Math.max(peak, Math.abs(V.track[i]));
  console.log('\n  the read as one track: ' + (V.track.length / SR).toFixed(2) + 's, '
    + V.words.length + ' words, peak ' + dbfs(peak).toFixed(1) + ' dBFS');
  console.log('\n  the joins, all derived from the read:');
  row('he jumps', JUMP_AT, ASKED.jump[0]);
  row('the camera snaps', SNAP_AT);
  row('he is off frame', FALL_END);
  row('the globe is gone', DARK_AT, ASKED.type[0]);
  row('the numbers start', cap.groups[0].in, ASKED.type[0]);
  row('the numbers end', Math.max(...cap.groups.map(g => g.out)), ASKED.type[1]);
  row('he comes back', RISE_AT, ASKED.back[0]);
  row('he lands', LAND);
  row('the fault', FAULT_AT);
  row('the end', SECONDS, ASKED.hold[1]);
}

printClock();
if (VOICE_ONLY) process.exit(0);

/* ---------- render ---------- */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, VERIFY]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  const { srv, port } = await serve(pageHtml(readLand()));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  /* the page's own faults, out where they can be read. a layer that never
     becomes ready is almost always a throw inside one of these scripts, and
     without this the only symptom is a timeout with nothing attached to it. */
  page.on('pageerror', e => console.error('  page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('  console: ' + m.text()); });
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: THEME }],
  });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 600; i++) {
    const ok = await page.evaluate(() => !!(window.__post24 && window.__post24.ready
      && window.__globe && window.__globe.ready && window.__mas && window.__mas.ready
      && window.__cap && window.__cap.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  const ready = await page.evaluate(() => ({
    post: !!(window.__post24 && window.__post24.ready),
    globe: !!(window.__globe && window.__globe.ready),
    mas: !!(window.__mas && window.__mas.ready),
    cap: !!(window.__cap && window.__cap.ready),
  }));
  for (const k of Object.keys(ready)) if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  const built = await page.evaluate(() => window.__built);
  console.log('\n  built: head ' + built.headPx + 'px, ' + built.glows + ' glow layers, theme ' + built.theme);

  const N = Math.round(FPS * SECONDS);
  const wall = Date.now();
  const STILLS = new Map([
    [0.20, 'a-globe'], [Math.max(0, JUMP_AT - 0.05), 'b-wave'], [HOP_TOP + 0.10, 'c-falling'],
    [DARK_AT + 0.15, 'd-dark'], [cap.groups[0].out - 0.05, 'e-number1'],
    [LAND + 0.03, 'f-landing'], [Math.min(SECONDS - 0.02, FAULT_AT - 0.10), 'g-thumbs'],
    [Math.min(SECONDS - 0.01, WM_AT + 0.06), 'h-wordmark'],
  ].map(([t, n]) => [Math.round(t * FPS), n]));

  for (let f = 0; f < N; f++) {
    const t = f * STEP;
    const fr = frameAt(t);
    await page.evaluate(x => window.__post24.apply(x), fr);
    /* the globe is a per pixel pass over 1.45 million subsamples and it is the
       most expensive thing in the frame. once it is off the top of the screen
       there is nothing to redraw, so it is not redrawn: the layer is hidden and
       the last frame it drew stays in its canvas, unseen. */
    if (fr.globe.on) await page.evaluate((tt, s) => window.__globe.apply(tt, s), t, fr.globe.spin);
    await page.evaluate(x => window.__mas.apply(x), fr.mas);
    await page.evaluate(x => window.__cap.apply(x), fr.cap);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 92, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    if (STILLS.has(f)) fs.writeFileSync(path.join(VERIFY, STILLS.get(f) + '.jpg'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  ' + N + ' frames in ' + ((Date.now() - wall) / 1000).toFixed(1) + 's');
  await browser.close(); srv.close();
  return N;
}

/* ---------- the mix ---------- */
function mix() {
  const list = cues();
  /* three of this library's four mix functions hand back a report rather than a
     buffer, and `renderSfx` is one of them. taking the object for the buffer
     makes `len` NaN inside mixdown, which allocates a zero length bus and
     produces a file at -70 LUFS — silence with no error anywhere. */
  const rendered = renderSfx(list, SECONDS);
  const sfx = rendered.buf;
  const env = voiceEnvelope(V.words, SECONDS);
  const voice = V.track.length >= Math.ceil(SECONDS * SR)
    ? V.track.subarray(0, Math.ceil(SECONDS * SR))
    : (() => { const b = new Float32Array(Math.ceil(SECONDS * SR)); b.set(V.track); return b; })();
  /* mixdown hands back a report, not a buffer: the bus, the voice as it really
     sits in the file and the peaks of each. `out` is the two summed, and it is
     the only one of them that gets a level put on it. */
  const m = mixdown(voice, sfx, env, {});
  const bus = m.out;
  const wav = path.join(OUT, 'post24-mix.wav');
  /* **`applyGain` and `limit` work in place and hand back a report**, so every
     pass gets its own copy of the bus. bisecting against a buffer that the last
     pass already scaled is how a loudness loop ends up eighteen decibels up.

     it bisects rather than walking, because a straight walk at a target has a
     cliff in it: past a point the limiter is squashing rather than limiting and
     more gain stops buying loudness and starts costing it. */
  const attempt = g => {
    const buf = Float32Array.from(bus);
    applyGain(buf, g);
    const lim = limit(buf, SAMPLE_CEILING);
    writeWav(wav, buf);
    return { g, lim, r: loudness(ffmpeg, wav) };
  };
  /* **the limiter is the constraint, not the target.** a bisect that only
     chases -14 LUFS finds it by squashing: the first version of this reached
     the number with 12.5 dB of gain reduction, which is not limiting, it is
     turning the read into a wall. so the search is for the loudest gain whose
     reduction is still inside MAX_REDUCTION, and the target is where it stops
     rather than what it insists on. if that lands short of MIN_LUFS the file
     says so, which is post12's outcome and an honest one. */
  let lo = -6, hi = 18, best = null;
  for (let i = 0; i < 10; i++) {
    const a = attempt((lo + hi) / 2);
    const legal = a.lim.reduction <= MAX_REDUCTION;
    if (legal && (!best || a.r.lufs > best.r.lufs)) best = a;
    if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
  }
  if (!best) best = attempt(0);
  const final = attempt(best.g);
  console.log('  mix: ' + list.length + ' cues, ' + final.r.lufs.toFixed(1) + ' LUFS, peak '
    + final.r.truePeak.toFixed(1) + ' dBTP, ' + final.lim.reduction.toFixed(1)
    + ' dB of limiting, gain ' + best.g.toFixed(1) + ' dB');
  if (final.r.lufs < MIN_LUFS) {
    console.log('  quieter than ' + MIN_LUFS + ' LUFS: the peak ceiling won, which is what it is for');
  }
  if (final.lim.reduction > MAX_REDUCTION) {
    console.log('  the limiter took ' + final.lim.reduction.toFixed(1) + ' dB, past the '
      + MAX_REDUCTION + ' this clip allows');
  }
  return wav;
}

const N = ONLY_ENCODE ? fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length : await render();
const wav = mix();
const out = path.join(OUT, 'post24-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest',
  '-r', String(FPS), '-movflags', '+faststart', out]);
if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });
console.log('\n  ' + path.relative(HERE, out));
console.log('  ' + N + ' frames, ' + SECONDS.toFixed(2) + 's at ' + FPS + 'fps');
console.log('  stills in ' + path.relative(HERE, VERIFY));
