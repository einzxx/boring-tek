/* the boring tek — post24, how many people use ai.

     cd demo
     DEMO_FPS=12 node post24.mjs      the preview pass
     node post24.mjs                  60fps final
     node post24.mjs --voice          the read and the clock only, no browser
     node post24.mjs --no-pings       the globe with the ping layer off
     node post24.mjs --encode-only    re-encode from kept frames
     node post24.mjs --keep-frames    leave the jpegs on disk

   **one output path, overwritten every run:**
   `demo/out/post24-dark-1080x1920.mp4`. Beat stills land in
   `demo/out/verify-post24/`, and the ping schedule in `out/post24-pings.json`.

   ---------- what it is ----------
   the globe turns with the mascot standing on top of it waving, and a question
   over them both. he jumps off and falls out of the bottom of the frame; the
   camera goes after him and the earth leaves through the top. three numbers draw
   themselves onto black, one at a time, each cut to the line being said. he
   comes back up into the middle, lands, and gives it a thumbs up. then the house
   fault takes the lot and puts the wordmark up.

   ---------- what it reuses ----------
   `lib/globe.mjs` is the globe out of `globe-test.mjs` — the same sphere, the
   same graticule, the same pings on black. `lib/mascot.mjs` draws him,
   `lib/voice.mjs` fetches the read from elevenlabs, `lib/sfx.mjs` builds the
   sounds and does the mix, and `lib/captions.mjs` hands over the site's own
   colour tokens.

   ---------- the captions are drawn here, and that is the second attempt ------
   the first cut set the three numbers with `captions.mjs`'s `type` style. that
   style **stacks** up to `maxLines` and keeps them, and it draws **the words
   that were spoken** — so all three lines sat on the frame together and the
   middle one read `that is sixteen percent` rather than `16%`. neither is a bug
   in the module; both are what the style is for.

   what this clip wants is the opposite of a transcript: **one card at a time,
   each replacing the last completely, and the numerals rather than the words.**
   so the cards are drawn in this file, in the module's own tokens at the
   module's own face, which is post20's arrangement. `brandTokens()` is still the
   module's, so a caption here still cannot hold a colour the site has not got.

   ---------- and the middle beat is three drawings, not three cards ----------
   a counter racing to a billion, a ring filling to sixteen percent, and two
   lines on a chart. all three are drawn in code on one canvas, in the caption
   tokens and in Manrope, one per line and each replacing the last. there are no
   pictogram assets and no images: the globe is the only picture in the film and
   it is real geodata.

   ---------- the clock is the read ----------
   every join is derived from where the words actually landed. `--voice` prints
   the derived time against the one the brief asked for, so the drift is a number
   somebody can look at rather than a surprise in a render.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, STAGE, SAFE, HEAD_PX,
} from './lib/mascot.mjs';
import { globeCss, globeMarkup, globeScript, readLand } from './lib/globe.mjs';
import { brandTokens } from './lib/captions.mjs';
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
const NO_PINGS = argv.includes('--no-pings');

/* ---------- the read ----------
   five lines, one a beat, elevenlabs' default narrator. shorter than the first
   cut on every line: that read was 10.61s of sound against a brief that asked
   for a ten second film, and no arrangement of joins closes a gap that size. */
const VOICE = 'calm';
const LINES = [
  { text: 'how many people use ai.' },
  { text: 'over one billion. every month.' },
  { text: 'sixteen percent of everyone on earth.' },
  { text: 'growing faster than the internet did.' },
  { text: 'the future is already here.' },
];

/* what the brief asked for, so the report can print the drift. */
const ASKED = { jump: 2, dark: 3, numbers: [3, 7], back: 7, end: 11 };

/* ---------- the joins ----------
   the only times typed in this file. every other number below is derived. */
const VOICE_AT = 0.28;
const GAP = { afterQ: 0.62, betweenNumbers: 0.20 };
const JUMP_AFTER = 0.12;
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.12;

/* ---------- the globe ---------- */
const G = { d: 340, cx: VW / 2, cy: 548, tilt: 14, spin0: 20, rate: 24 };
const ZOOM = { from: 1.06, to: 0.90 };

/* ---------- him ---------- */
const SIZE = 120;
const FOOT = 4;
const GLOVE_IN = 0.18;

/* ---------- the fall, the rise and the landing ----------
   post20's table, which is post19's: he stretches a tenth on the way, compresses
   to 1.52 wide by 0.66 tall over 70ms with his chin on the ground and springs
   out on a damped cosine that crosses zero exactly once. */
const HOP = { up: 62, for: 0.20 };
const FALL = { for: 0.42, to: 1450 };
const RISE = { from: 1450, for: 0.48 };
const SMASH = { air: 0.10, flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };

/* 760 css px is the globe's own bottom edge, and 0.36s over it is 35 css px
   between frames at sixty, under the 42 the shutter can still smear. */
const SNAP = { for: 0.34, by: 760 };

/* ---------- the cards ----------
   five of them and **never two at once**. each one is the spoken line with its
   numerals put back: the voice says `over one billion` and the card says
   `1 billion`, which is post20's `u` / `you` and is guarded below by counting
   the substitutions rather than trusting them. */
const CARDS = [
  { key: 'q', draw: 'how many<br>people use ai', line: 0, at: 'top' },
  { key: 'billion', draw: '1 billion every month', line: 1, at: 'under', anim: 'counter' },
  { key: 'percent', draw: '16% of everyone on earth', line: 2, at: 'under', anim: 'ring' },
  { key: 'chart', draw: 'growing faster than the internet did', line: 3, at: 'under', anim: 'chart' },
  { key: 'close', draw: 'the future is<br>already here', line: 4, at: 'below' },
];
const CARD_IN = 0.22;          /* how long a card takes to arrive */
const CARD_GAP = 0.10;         /* clear black between one card leaving and the next */

/* where the three drawings live, and where the card under them sits. */
const ANIM = { x: 70, y: 268, w: VW - 140, h: 300 };
const CAPY = { top: 98, under: ANIM.y + ANIM.h + 46, below: VH / 2 + SIZE / 2 + 52 };
const CAP = { size: 34, lh: 1.28 };

/* ---------- the counter ----------
   0 to a billion while the line is said. the ticks are laid on a curve rather
   than on a grid so they start sparse and finish dense, which is what "speeding
   up" is, and the last one is a thud rather than a tick. */
const COUNT = { to: 1e9, ticks: 26, curve: 1.75, thud: 'popDeep' };

/* ---------- the end ---------- */
const END = { hard: 0.12, tail: 0.18, wmFor: 0.09, hold: 0.88 };
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = { shakeX: 15, shakeY: 8, split: 9.5, flash: 0.30, flashSize: 420, calmFrom: 0.86 };

/* ---------- the mix ---------- */
const CRF = 17;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8;
const MAX_REDUCTION = 5.0, MIN_LUFS = -16;
const STEP_CEIL = 42;

/* ---------- small maths ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const EASE = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const OUTC = p => 1 - Math.pow(1 - p, 3);

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
    /* the cache is keyed on the copy, so changing a line refetches that line and
       only that line. this round changed four of the five. */
    if (j.text === want && fs.existsSync(j.file)) return { ...j, i, cached: true };
  }
  return { ...(await speak(LINES[i].text, { voice: VOICE, name })), i, cached: false };
}

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

/* the five takes on one clock. `gapFor` is handed the beats laid down so far and
   works the next silence out of the same numbers the picture is drawn from,
   which is how the closing line lands after he does rather than near him. */
function buildVoice(takes, gapFor) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const beats = [], offs = [];
  let soundEnd = 0;
  for (let i = 0; i < takes.length; i++) {
    const e = edges[i];
    const at = i === 0 ? VOICE_AT : soundEnd + gapFor(i, beats);
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
    });
    soundEnd = beats[i].sound.end;
  }
  const track = new Float32Array(Math.ceil((beats[beats.length - 1].sound.end + 3.0) * SR));
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

/* the closing line's silence is not a constant: it is however long it takes him
   to come back and land, measured off the line before it. everything the sum
   needs is known by the time it is asked for, which is why it is a callback. */
function cardThreeOut(beats) { return beats[3].sound.end + 0.12; }
function riseFrom(beats) { return cardThreeOut(beats) + CARD_GAP; }
function landFrom(beats) { return riseFrom(beats) + RISE.for; }
const V = buildVoice(TAKES, (i, beats) => {
  if (i === 4) {
    /* he has to have landed **and** the chart has to be gone. */
    const want = landFrom(beats) + 0.12 - beats[3].sound.end;
    return +Math.max(0.30, want).toFixed(4);
  }
  return i === 1 ? GAP.afterQ : GAP.betweenNumbers;
});
const B = V.beats;

/* ---------- the clock ---------- */
const JUMP_AT = +(B[0].sound.end + JUMP_AFTER).toFixed(4);
const HOP_TOP = +(JUMP_AT + HOP.for).toFixed(4);
const FALL_END = +(HOP_TOP + FALL.for).toFixed(4);
const SNAP_AT = +(HOP_TOP + 0.05).toFixed(4);
const SNAP_END = +(SNAP_AT + SNAP.for).toFixed(4);
const DARK_AT = +Math.max(SNAP_END, FALL_END).toFixed(4);

/* ---------- the five cards, in order, never overlapping ----------
   **the first number arrives on the frame the globe leaves it.** the last cut
   had a quarter second of black between the two, because the card was cut to
   the voice and the voice was cut to the fall; this one gives card one the
   earlier of the two and lets the voice arrive under it. */
const WINDOWS = [];
{
  let prevOut = 0;
  for (let k = 0; k < CARDS.length; k++) {
    const b = B[CARDS[k].line];
    let inAt = k === 0 ? +(b.start - 0.10).toFixed(4)
      : k === 1 ? DARK_AT
        : +Math.max(prevOut + CARD_GAP, b.start - 0.16).toFixed(4);
    let outAt = k === 0 ? JUMP_AT
      : k === 3 ? cardThreeOut(B)
        : +(b.sound.end + 0.12).toFixed(4);
    if (k === 4) { inAt = +Math.max(prevOut + CARD_GAP, landFrom(B)).toFixed(4); outAt = null; }
    WINDOWS.push({ ...CARDS[k], in: +inAt.toFixed(4), out: outAt });
    prevOut = outAt == null ? inAt : outAt;
  }
}
const RISE_AT = +riseFrom(B).toFixed(4);
const LAND = +landFrom(B).toFixed(4);
const THUMBS_AT = +(LAND + 0.08).toFixed(4);
const FAULT_AT = +(B[4].sound.end + 0.32).toFixed(4);
const WM_AT = +(FAULT_AT + END.wmFor).toFixed(4);
const SECONDS = +(FAULT_AT + END.hold).toFixed(4);

/* ---------- the moves ---------- */
const globeScale = t => +lerp(ZOOM.from, ZOOM.to, EASE(span(t, 0, JUMP_AT))).toFixed(5);
function sceneY(t) {
  if (t <= SNAP_AT) return 0;
  /* it comes back to nought the moment there is nothing left to hold, and the
     cut happens while he is five hundred px below the bottom edge. */
  if (t >= DARK_AT) return 0;
  return +(-SNAP.by * OUTC(span(t, SNAP_AT, SNAP_END))).toFixed(3);
}
function jumpY(t) {
  if (t < JUMP_AT) return 0;
  if (t < HOP_TOP) return +(-HOP.up * Math.sin(Math.PI * span(t, JUMP_AT, HOP_TOP))).toFixed(3);
  if (t < FALL_END) { const p = span(t, HOP_TOP, FALL_END); return +(FALL.to * p * p).toFixed(3); }
  if (t < RISE_AT) return FALL.to;
  if (t < LAND) return +(RISE.from * (1 - OUTC(span(t, RISE_AT, LAND)))).toFixed(3);
  return 0;
}
function squashAt(t) {
  if (t < RISE_AT) return 0;
  if (t < LAND) return +(-SMASH.air * EASE(span(t, RISE_AT, LAND))).toFixed(5);
  const flat = span(t, LAND, LAND + SMASH.flat);
  if (flat < 1) return +lerp(-SMASH.air, SMASH.k, EASE(flat)).toFixed(5);
  const p = span(t, LAND + SMASH.flat, LAND + SMASH.flat + SMASH.back);
  if (p >= 1) return 0;
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p) * (1 - p)).toFixed(5);
}

/* ---------- the marks ---------- */
const WAVE_AT = 0.16;
const MARKS = [
  { t: WAVE_AT, state: 'curious', side: 'right', hands: { pose: 'wave', entry: 0.34, hold: +Math.max(0.5, JUMP_AT - WAVE_AT - 0.95).toFixed(3) } },
  { t: THUMBS_AT, state: 'delighted', side: 'right', hands: { pose: 'thumbs-up', entry: 0.40, hold: +Math.max(0.45, SECONDS - THUMBS_AT - 1.05).toFixed(3) } },
];

const plan = planMascot({
  seconds: SECONDS, hands: true, size: SIZE, theme: THEME, bias: 0, marks: MARKS,
});

const HOME = { x: VW / 2 - SIZE / 2, y: VH / 2 - SIZE / 2 };
function masXY(t) {
  const s = globeScale(t);
  const onGlobe = G.cy - (G.d / 2) * s - SIZE - FOOT;
  /* he holds the globe until he is off the frame, then he belongs to it. */
  const base = t < DARK_AT ? onGlobe : HOME.y;
  return {
    x: +(HOME.x - plan.box.left).toFixed(3),
    y: +(base - plan.box.top + jumpY(t)).toFixed(3),
  };
}

/* ---------- one frame of everything ---------- */
function cardAt(t) {
  for (let k = 0; k < WINDOWS.length; k++) {
    const w = WINDOWS[k];
    if (t < w.in) continue;
    if (w.out != null && t >= w.out) continue;
    /* **one card, and the loop returns on the first that is live.** the windows
       are built so they cannot overlap, and the guard below re-proves it rather
       than trusting this. */
    const up = OUTC(span(t, w.in, w.in + CARD_IN));
    const down = w.out == null ? 0 : span(t, w.out - 0.14, w.out);
    return { k, key: w.key, at: w.at, o: +(up * (1 - down)).toFixed(4), p: w.out == null ? 0 : span(t, w.in, w.out) };
  }
  return { k: -1, key: null, at: null, o: 0, p: 0 };
}

/* the three drawings, as one number each plus the phase of the card they belong
   to. the page draws; nothing here knows about a canvas. */
function animAt(t, card) {
  if (card.k < 1 || card.k > 3) return { kind: null, p: 0, o: 0 };
  const w = WINDOWS[card.k];
  const b = B[w.line];
  /* the drawing runs across the line being said rather than across the card, and
     it **finishes a tenth before the words do**, so the counter is seen sitting
     on 1 000 000 000 and the ring is seen full rather than both arriving on the
     frame the card starts fading out of. */
  const p = clamp(span(t, w.in, b.sound.end - 0.10), 0, 1);
  return { kind: w.anim, p: +p.toFixed(5), o: card.o };
}

function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}

function frameAt(t) {
  const f = mascotFrame(plan, t);
  /* ---------- the gloves, off until the wave ----------
     `hands: true` draws the resting pair from frame zero, so one multiplier goes
     on every glove's own opacity: up as the wave starts, and the hand that never
     acts is multiplied by nought outright. post20's two gates, and its reason —
     `side` is a fact about a mark and applies from that mark on, so there is
     nothing before the first mark for it to speak for. */
  if (f.hands) {
    const g = span(t, WAVE_AT, WAVE_AT + GLOVE_IN);
    f.hands = {
      ...f.hands,
      list: f.hands.list.map((h, k) => ({ ...h, o: +(h.o * (k === 1 ? g : 0)).toFixed(4) })),
    };
  }
  const k = squashAt(t);
  if (k) {
    const sq = 1 + k;
    const ground = t >= LAND ? (SIZE / 2) * (1 - 1 / sq) : 0;
    f.card = {
      ...f.card, y: +(f.card.y + ground).toFixed(4),
      sx: +(f.card.sx * sq).toFixed(5), sy: +(f.card.sy / sq).toFixed(5),
    };
    if (f.hands) f.hands = { ...f.hands, fit: { cx: +(f.hands.fit.cx / sq).toFixed(5), cy: +(f.hands.fit.cy * sq).toFixed(5) } };
  }
  const card = cardAt(t);
  const hit = span(t, FAULT_AT, FAULT_AT + END.hard + END.tail);
  return {
    t,
    mas: f,
    move: masXY(t),
    globe: { on: t < DARK_AT, scale: globeScale(t), spin: G.spin0 + G.rate * t },
    scene: sceneY(t),
    card, anim: animAt(t, card),
    gone: t >= FAULT_AT,
    wm: { o: t >= WM_AT ? 1 : 0 },
    gl: (t < FAULT_AT || hit >= 1) ? { heat: 0, seed: 0 }
      : { heat: +heatAt(hit).toFixed(4), seed: Math.floor(t * 1000) % 9973 },
  };
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@500;700;800&display=swap">
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

/* the cards. one at a time, the page's own --fg on nothing: no card, no fill,
   no green. Manrope because that is the face the captions in this house are
   set in, and the colours are index.html's own via brandTokens(). */
.card{position:absolute;left:70px;width:${VW - 140}px;text-align:center;
  font-family:"Manrope",var(--body);font-weight:800;letter-spacing:-.015em;
  font-size:${CAP.size}px;line-height:${CAP.lh};color:var(--fg);
  opacity:0;will-change:transform,opacity}
#anim{position:absolute;left:${ANIM.x}px;top:${ANIM.y}px;width:${ANIM.w}px;height:${ANIM.h}px;
  opacity:0;will-change:opacity}

#wm{position:absolute;left:0;right:0;top:${Math.round(VH * 0.40)}px;text-align:center;
  font-family:"Michroma",var(--mono);font-weight:400;color:var(--fg);
  line-height:${WM.lh};letter-spacing:.02em;opacity:0}
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
  <canvas id="anim"></canvas>
  ${WINDOWS.map(w => '<div class="card" id="card-' + w.key + '">' + w.draw + '</div>').join('\n  ')}
  <div id="wm">${WM.lines.map(l => '<b>' + l + '</b>').join('')}</div>
  <div id="flash"></div>
</div>
<script>
${globeScript({
    d: G.d, cx: G.cx, cy: G.cy, tilt: G.tilt, spin0: G.spin0, rate: G.rate,
    seconds: SECONDS, ping: { on: !NO_PINGS },
  })}
<\/script>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
(function(){
  const P = ${JSON.stringify({
    VW, VH, DSF, ANIM, CAPY, COUNT, GL, WM,
    keys: WINDOWS.map(w => w.key),
  })};
  const scene = document.getElementById('scene');
  const gmove = document.getElementById('globe-move');
  const gzone = document.querySelector('.g-zone');
  const mmove = document.getElementById('mas-move');
  const mzone = document.querySelector('.m-zone');
  const wm = document.getElementById('wm');
  const flash = document.getElementById('flash');
  const stage = document.querySelector('.stage');
  const cards = {};
  for (const k of P.keys) cards[k] = document.getElementById('card-' + k);

  /* the cards are placed by which of the three bands they belong to, and the
     bands are numbers this page was handed rather than numbers it knows. */
  for (const k of P.keys) cards[k].style.top = '0px';

  const cv = document.getElementById('anim');
  cv.width = P.ANIM.w * P.DSF; cv.height = P.ANIM.h * P.DSF;
  const g = cv.getContext('2d');
  g.scale(P.DSF, P.DSF);

  /* the ink, read off the page rather than typed here, so a drawing cannot hold
     a colour index.html has not got. */
  const cs = getComputedStyle(document.documentElement);
  const FG = cs.getPropertyValue('--fg').trim() || '#d5dbd8';
  const MUTED = cs.getPropertyValue('--muted').trim() || 'rgba(213,219,216,.42)';

  function rnd(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const groupDigits = n => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');

  /* fit a string to a width by measuring it once at a known size. the wordmark
     needed this and so does a thirteen character number. */
  function fitText(text, font, weight, maxW, maxSize){
    g.font = weight + ' 100px ' + font;
    const w = g.measureText(text).width;
    return Math.min(maxSize, Math.floor(100 * maxW / w));
  }

  /* ---------- the three drawings ---------- */
  function drawCounter(p){
    const v = Math.round(P.COUNT.to * Math.pow(p, 1.15));
    const text = groupDigits(v);
    /* the landing: the last tenth compresses the number a little and lets it
       back out, so the count arrives rather than stopping. */
    const land = p > 0.92 ? Math.sin((p - 0.92) / 0.08 * Math.PI) * 0.06 : 0;
    const size = fitText(groupDigits(P.COUNT.to), 'Manrope', '800', P.ANIM.w - 20, 64);
    g.save();
    g.translate(P.ANIM.w / 2, P.ANIM.h / 2);
    g.scale(1 + land, 1 - land);
    g.font = '800 ' + size + 'px Manrope';
    g.fillStyle = FG;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, 0);
    g.restore();
  }

  function drawRing(p){
    const cx = P.ANIM.w / 2, cy = P.ANIM.h / 2, r = 96;
    const pct = 16 * p;
    g.save();
    g.lineWidth = 5;
    g.strokeStyle = MUTED;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    /* clockwise from the top, which is what a loading circle does. */
    g.strokeStyle = FG;
    g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100)); g.stroke();
    g.fillStyle = FG;
    g.font = '800 54px Manrope';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(Math.round(pct) + '%', cx, cy);
    g.restore();
  }

  function drawChart(p){
    const x0 = 24, x1 = P.ANIM.w - 24, y0 = P.ANIM.h - 40, top = 18;
    const W = x1 - x0, H = y0 - top;
    /* the internet climbs; ai leaves the top of the box. both are drawn left to
       right to the same fraction, so the second one overtaking is a thing that
       happens rather than a thing that is stated. */
    const slow = q => Math.pow(q, 1.05) * 0.52;
    const fast = q => Math.pow(q, 2.6) * 1.55;
    const plot = (fn, colour, wide) => {
      g.strokeStyle = colour; g.lineWidth = wide; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath();
      const N = 64;
      for (let i = 0; i <= N * p; i++) {
        const q = i / N;
        const x = x0 + W * q;
        const y = y0 - H * Math.min(1.35, fn(q));
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    };
    g.save();
    g.beginPath(); g.rect(0, 0, P.ANIM.w, P.ANIM.h); g.clip();
    g.strokeStyle = MUTED; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
    plot(slow, MUTED, 3);
    plot(fast, FG, 4);
    /* the labels sit **beside** their own line rather than on it. the first cut
       put ai at the fraction the curve was steepest through, so the word was
       drawn underneath its own stroke and read as a smudge. internet is labelled
       below its line and ai to the left of its line, which is the only clear
       air either of them has. */
    g.font = '500 17px Manrope'; g.textBaseline = 'middle';
    if (p > 0.34) {
      g.fillStyle = MUTED; g.textAlign = 'left';
      g.fillText('internet', x0 + W * 0.70, y0 - H * slow(0.70) + 17);
    }
    if (p > 0.62) {
      g.fillStyle = FG; g.textAlign = 'right';
      g.fillText('ai', x0 + W * 0.72 - 14, y0 - H * Math.min(1.3, fast(0.72)));
    }
    g.restore();
  }

  window.__post24 = {
    ready: true,
    apply(f){
      scene.style.transform = 'translate3d(0,' + f.scene + 'px,0)';
      gmove.style.transform = 'scale(' + f.globe.scale + ')';
      gzone.style.visibility = f.globe.on ? 'visible' : 'hidden';
      mmove.style.transform = 'translate3d(' + f.move.x + 'px,' + f.move.y + 'px,0)';
      mzone.style.visibility = f.gone ? 'hidden' : 'visible';

      /* **one card, and every other one is set to nought every frame.** it is
         written as a sweep rather than as a change so there is no state in this
         page that could leave a card up. */
      for (const k of P.keys) {
        const on = !f.gone && f.card.key === k;
        cards[k].style.opacity = on ? f.card.o : 0;
        if (on) cards[k].style.top = P.CAPY[f.card.at] + 'px';
      }

      g.clearRect(0, 0, P.ANIM.w, P.ANIM.h);
      if (!f.gone && f.anim.kind) {
        cv.style.opacity = f.anim.o;
        if (f.anim.kind === 'counter') drawCounter(f.anim.p);
        else if (f.anim.kind === 'ring') drawRing(f.anim.p);
        else drawChart(f.anim.p);
      } else {
        cv.style.opacity = 0;
      }

      wm.style.opacity = f.wm.o;
      const h = f.gl.heat;
      if (!h){
        stage.style.transform = 'none';
        wm.style.textShadow = 'none';
        flash.style.opacity = 0;
      } else {
        const r = rnd(f.gl.seed || 1);
        const dx = (r() * 2 - 1) * P.GL.shakeX * h;
        const dy = (r() * 2 - 1) * P.GL.shakeY * h;
        stage.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
        const s = (P.GL.split * h).toFixed(2);
        wm.style.textShadow = '-' + s + 'px 0 rgba(255,0,64,.75), ' + s + 'px 0 rgba(0,255,208,.75)';
        flash.style.opacity = (P.GL.flash * h).toFixed(3);
      }
    },
    /* the wordmark is fitted, not sized: michroma is wide and BORING is the
       longest line, and a size picked by dividing a width by a guess put it off
       both edges of the frame once already. */
    fitWordmark(){
      const lines = [].slice.call(wm.querySelectorAll('b'));
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const l of lines) widest = Math.max(widest, l.getBoundingClientRect().width);
      const size = Math.floor(100 * P.WM.w / widest);
      wm.style.fontSize = size + 'px';
      const r = lines[0].getBoundingClientRect();
      return { size, widestCss: +(widest * size / 100).toFixed(1), capPx: +(r.height * P.DSF * 0.72).toFixed(1) };
    },
    /* every card measured where it will really be drawn, so the safe area is a
       measurement rather than a sum. */
    /* **measured where it will really be drawn**, which means the band has to
       be put on it first: apply only writes a top to the card that is live, so
       a sweep taken at build time would measure five cards all sitting at zero
       and report every one of them as breaking the top margin. (no backticks in
       this comment on purpose: it lives inside a template literal.) */
    cardBoxes(bands){
      const out = {};
      for (const k of P.keys) {
        const el = cards[k];
        const keepO = el.style.opacity, keepT = el.style.top;
        el.style.opacity = 1;
        el.style.top = bands[k] + 'px';
        const r = el.getBoundingClientRect();
        out[k] = { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), h: +r.height.toFixed(1) };
        el.style.opacity = keepO; el.style.top = keepT;
      }
      return out;
    },
  };
})();

Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('800 40px Manrope'),
  document.fonts.load('500 17px Manrope'),
  document.fonts.load('700 12px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__mas.build(), {
      wm: window.__post24.fitWordmark(),
      cards: window.__post24.cardBoxes(${JSON.stringify(Object.fromEntries(WINDOWS.map(w => [w.key, CAPY[w.at]])))}),
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
    /* everything else is answered rather than 404'd, so a favicon request does
       not put an error in the console of every run. */
    res.writeHead(204); res.end();
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  return {
    seconds: dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
  };
}

/* ---------- the sound ---------- */
function cues() {
  const out = [{ t: HOP_TOP, kind: 'whoosh' }];
  /* a pop as each card arrives. */
  for (const w of WINDOWS) out.push({ t: w.in, kind: 'pop' });
  /* the counter's ticks, laid on a curve so they start sparse and finish dense,
     which is what speeding up is. the last one is a thud rather than a tick. */
  const c = WINDOWS[1], cb = B[c.line];
  const dur = cb.sound.end - c.in;
  for (let k = 0; k < COUNT.ticks; k++) {
    out.push({ t: +(c.in + dur * Math.pow(k / COUNT.ticks, COUNT.curve)).toFixed(4), kind: 'tick' });
  }
  out.push({ t: +cb.sound.end.toFixed(4), kind: COUNT.thud });
  return out.filter(x => x.t >= 0 && x.t < SECONDS).sort((a, b) => a.t - b.t);
}

/* ---------- report ---------- */
function printClock() {
  const row = (n, a, b) => console.log('  ' + n.padEnd(24) + a.toFixed(2).padStart(6)
    + (b == null ? '' : '   brief said ' + b));
  console.log('\nthe boring tek — post24, how many people use ai\n');
  let peak = 0;
  for (let i = 0; i < V.track.length; i++) peak = Math.max(peak, Math.abs(V.track[i]));
  console.log('  the read, five takes on ' + VOICE + ' via elevenlabs:');
  for (const b of B) {
    console.log('    ' + (b.i + 1) + '  ' + b.sound.start.toFixed(2) + '..' + b.sound.end.toFixed(2)
      + '  ' + (b.cached ? 'cached ' : 'fetched') + '  "' + b.text + '"');
  }
  const sound = B.reduce((a, b) => a + (b.sound.end - b.sound.start), 0);
  console.log('  ' + sound.toFixed(2) + 's of sound in ' + SECONDS.toFixed(2) + 's of film, peak '
    + dbfs(peak).toFixed(1) + ' dBFS');
  console.log('\n  the cards, one at a time:');
  for (const w of WINDOWS) {
    console.log('    ' + w.key.padEnd(9) + w.in.toFixed(2) + '..'
      + (w.out == null ? 'the fault' : w.out.toFixed(2)) + '   "' + w.draw.replace(/<br>/g, ' ') + '"');
  }
  console.log('\n  the joins:');
  row('he jumps', JUMP_AT, ASKED.jump);
  row('the globe is gone', DARK_AT, ASKED.dark);
  row('the first number', WINDOWS[1].in, ASKED.numbers[0]);
  row('the last number ends', WINDOWS[3].out, ASKED.numbers[1]);
  row('he comes back', RISE_AT, ASKED.back);
  row('he lands', LAND);
  row('the closing card', WINDOWS[4].in);
  row('the fault', FAULT_AT);
  row('the end', SECONDS, ASKED.end);
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
  for (let i = 0; i < 700; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__globe && window.__globe.ready))
      .catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  const built = await page.evaluate(() => window.__built);
  if (!built) throw new Error('the page never finished building');
  console.log('\n  built: head ' + built.headPx + 'px, ' + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  wordmark: ' + built.wm.size + 'px michroma, widest line ' + built.wm.widestCss
    + ' css of ' + WM.w + ' allowed, cap about ' + built.wm.capPx + ' device px (floor ' + WM.minCapPx + ')');

  const schedule = await page.evaluate(() => window.__globe.schedule);
  fs.writeFileSync(path.join(OUT, 'post24-pings.json'), JSON.stringify({
    tilt: G.tilt, spin0: G.spin0, rate: G.rate, cx: G.cx, cy: G.cy, d: G.d,
    dsf: DSF, darkAt: DARK_AT, zoom: ZOOM, jumpAt: JUMP_AT, snap: { at: SNAP_AT, end: SNAP_END, by: SNAP.by },
    life: 0.8, pings: schedule,
  }, null, 2));

  const N = Math.round(FPS * SECONDS);
  const wall = Date.now();
  const STILLS = new Map([
    [0.05, 'a-open'], [Math.max(0, JUMP_AT - 0.06), 'b-wave'], [HOP_TOP + 0.08, 'c-falling'],
    [WINDOWS[1].in + 0.05, 'd-counter-in'], [B[1].sound.end - 0.12, 'e-counter-done'],
    [B[2].sound.end, 'f-ring'], [B[3].sound.end - 0.20, 'g-chart'],
    [LAND + 0.03, 'h-landing'], [Math.min(SECONDS - 0.02, FAULT_AT - 0.08), 'i-thumbs'],
    [Math.min(SECONDS - 0.01, WM_AT + 0.06), 'j-wordmark'],
  ].map(([t, n]) => [Math.round(t * FPS), n]));

  let worstStep = 0, worstAt = 0;
  let prev = null;   /* {y, on} of the frame before */
  for (let f = 0; f < N; f++) {
    const t = f * STEP;
    const fr = frameAt(t);
    /* how fast anything in this file moves, in css px between two frames at
       sixty. it is the shutter's ceiling rather than the animation's, and it is
       **measured only while he is inside the frame**: the last third of the fall
       is four hundred px below the bottom edge and how fast a thing moves where
       nobody can see it is not a picture question. */
    const here = fr.move.y + fr.scene;
    const screenY = plan.box.top + here;
    const onScreen = screenY > -SIZE * 2 && screenY < VH + SIZE;
    if (prev != null && onScreen && prev.on) {
      const d = Math.abs(here - prev.y) * (FPS / 60);
      if (d > worstStep) { worstStep = d; worstAt = t; }
    }
    prev = { y: here, on: onScreen };
    await page.evaluate(x => window.__post24.apply(x), fr);
    if (fr.globe.on) await page.evaluate((tt, s) => window.__globe.apply(tt, s), t, fr.globe.spin);
    await page.evaluate(x => window.__mas.apply(x), fr.mas);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 92, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    if (STILLS.has(f)) fs.writeFileSync(path.join(VERIFY, STILLS.get(f) + '.jpg'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  ' + N + ' frames in ' + ((Date.now() - wall) / 1000).toFixed(1) + 's');
  console.log('  fastest move: ' + worstStep.toFixed(1) + ' css px between frames at 60 at '
    + worstAt.toFixed(2) + 's (ceiling ' + STEP_CEIL + ')');
  await browser.close(); srv.close();
  return { N, built };
}

/* ---------- the mix ---------- */
function mix() {
  const list = cues();
  const rendered = renderSfx(list, SECONDS);
  const env = voiceEnvelope(V.words, SECONDS);
  const need = Math.ceil(SECONDS * SR);
  const voice = V.track.length >= need ? V.track.subarray(0, need)
    : (() => { const b = new Float32Array(need); b.set(V.track); return b; })();
  const m = mixdown(voice, rendered.buf, env, {});
  const wav = path.join(OUT, 'post24-mix.wav');
  const attempt = gdb => {
    const buf = Float32Array.from(m.out);
    applyGain(buf, gdb);
    const lim = limit(buf, SAMPLE_CEILING);
    writeWav(wav, buf);
    return { g: gdb, lim, r: loudness(ffmpeg, wav) };
  };
  /* the limiter is the constraint, not the target: the search is for the loudest
     gain whose reduction is still legal, and the target is where it stops. */
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
  return wav;
}

/* ---------- the guards ---------- */
function guards(built) {
  const fail = [];
  const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);
  if (built.headPx < HEAD_PX.min || built.headPx > HEAD_PX.max) {
    fail.push('the head rendered at ' + built.headPx + 'px, window is ' + HEAD_PX.min + '..' + HEAD_PX.max);
  }
  if (built.wm.widestCss > WM.w + 0.5) fail.push('the wordmark is ' + built.wm.widestCss + ' css wide, over ' + WM.w);
  if (built.wm.capPx < WM.minCapPx) fail.push('the wordmark cap is ' + built.wm.capPx + ' device px, floor ' + WM.minCapPx);
  /* every card inside the safe band, measured where it really drew. */
  for (const [k, b] of Object.entries(built.cards)) {
    if (b.top * DSF < SAFE.top - 0.5) fail.push('card "' + k + '" starts ' + Math.round(b.top * DSF) + 'px down, floor ' + SAFE.top);
    if ((VH - b.bottom) * DSF < SAFE.bottom - 0.5) {
      fail.push('card "' + k + '" ends ' + Math.round((VH - b.bottom) * DSF) + 'px off the bottom, floor ' + SAFE.bottom);
    }
  }
  /* **one card at a time, proved rather than arranged.** the windows are built
     not to overlap and this walks the film at the render's own step and counts
     what is actually up. */
  let twoUp = null, blackFrom = null, worstBlack = 0;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f * STEP;
    const live = WINDOWS.filter(w => t >= w.in && (w.out == null || t < w.out));
    if (live.length > 1 && !twoUp) twoUp = { t: +t.toFixed(2), keys: live.map(w => w.key) };
    /* and no black hole in the middle beat: between the globe leaving and him
       coming back there should always be a card or a drawing on the frame. */
    if (t > DARK_AT && t < RISE_AT) {
      if (!live.length) { if (blackFrom == null) blackFrom = t; }
      else if (blackFrom != null) { worstBlack = Math.max(worstBlack, t - blackFrom); blackFrom = null; }
    }
  }
  if (twoUp) fail.push('two cards are up at ' + twoUp.t + 's: ' + twoUp.keys.join(' and '));
  if (worstBlack > 1 / FPS + 1e-6) {
    fail.push('the middle beat has ' + worstBlack.toFixed(2) + 's with nothing on the frame');
  }
  /* the closing card cannot arrive before the chart has gone or before he lands. */
  if (WINDOWS[4].in < WINDOWS[3].out - 1e-6) fail.push('the closing card arrives before the chart leaves');
  if (WINDOWS[4].in < LAND - 1e-6) fail.push('the closing card arrives at ' + WINDOWS[4].in + ', before he lands at ' + LAND);
  /* the numerals really were substituted, counted rather than trusted. */
  const subs = [['1 billion', 'one billion'], ['16%', 'sixteen percent']];
  for (const [drawn, spoken] of subs) {
    const onCard = WINDOWS.some(w => w.draw.includes(drawn));
    const inRead = LINES.some(l => l.text.includes(spoken));
    if (!onCard) fail.push('no card draws "' + drawn + '"');
    if (!inRead) fail.push('no line says "' + spoken + '"');
  }
  /* the gloves are off before the wave, asserted on the composed frame. */
  const gloveAt = t => frameAt(t).mas.hands.list.reduce((m, h) => Math.max(m, h.o), 0);
  if (gloveAt(0) > 0.004) fail.push('a glove is on screen at 0.00s, before the wave');
  if (gloveAt(WAVE_AT - 0.01) > 0.004) fail.push('a glove is on screen just before the wave mark');
  let idle = 0;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) idle = Math.max(idle, frameAt(f * STEP).mas.hands.list[0].o);
  if (idle > 0.004) fail.push('the screen left glove appears at ' + idle.toFixed(3));
  return fail;
}

const done = ONLY_ENCODE
  ? { N: fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length, built: null }
  : await render();
const wav = mix();
const out = path.join(OUT, 'post24-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest',
  '-r', String(FPS), '-movflags', '+faststart', out]);
if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

const p = probe(out);
console.log('\n  ' + path.relative(HERE, out));
console.log('  ' + p.w + 'x' + p.h + ', ' + p.seconds + 's, ' + FPS + 'fps, '
  + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
if (done.built) {
  const fail = guards(done.built);
  console.log('\n  guards: ' + (fail.length ? fail.length + ' FAILED' : 'all green'));
  for (const f of fail) console.log('    - ' + f);
  if (fail.length) process.exitCode = 1;
}
console.log('  stills in ' + path.relative(HERE, VERIFY));
