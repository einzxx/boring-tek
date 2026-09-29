/* the boring tek — post43. the dot.com troll.

   dark only, 1080x1920, six lines on the elevenlabs narrator on eleven_v3,
   the most natural model the account has: one take a line, the whole line in
   one request, never cut, stretched or pitched, speed 1.0. three takes of
   every line are made and one is kept by measurement, see pick(). the voice
   never stops: no line starts more than GAP after the one before. no music:
   einz adds it.

     l1  the tweet     dot-tweet.png springs in, he pops in bottom right.
     l2  dots          dots.png pops in over the tweet.
     l3  dot.com       dots.png slides away, the whole tweet pushes in
                       slowly towards dot.com, never past the margins.
     l4  grok          a happy arc and a hop on `grok`. elon-laugh.gif pops
                       in bottom right on `elons`, he moves to the left.
     l5  come on       a slow squint and he laughs along with the gif.
     l6  best troll    a big laughing bounce to the camera, post39's glitch,
                       the end card.

   on screen, only the three pictures and him. no hands. the pictures are
   files, placed with post40's white outline and soft white glow, the gif
   with a bolder one, and local only: demo/assets is ignored and they are
   never committed. the gif is resampled to the render's own frame rate and
   drawn a frame per frame, so it plays in step with the render. the rig, the
   gaze, the glitch and the end card are post42's. his eyes are calm, happy
   or a squint, never wide: every happy arc is 0.55s and a guard says so, so
   the laugh is a squint with one arc in it.

     DEMO_FPS=12 node post43.mjs         the preview
     node post43.mjs                     60fps
     node post43.mjs --keep-frames       leave the jpegs on disk

     demo/out/post43-dark-1080x1920.mp4
     demo/out/verify-post43/contact.png, phone.png    the critique sheets
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime, mascotPagePlan,
  STAGE, HEAD, GRID, EYE_CX, TURN, GLOW,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenReady } from './lib/voice.mjs';
import { SR, decode, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';
import { EASE as K } from './lib/motion.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post43');
const VERIFY = path.join(OUT, 'verify-post43');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const MARGIN = 120 / DSF;
const APP_ZONE = 300 / DSF;
const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');

/* the two pictures, local only. the script stops if either is missing. */
const PICS = {
  tweet: { file: path.join(HERE, 'assets', 'dot-tweet.png') },
  dots: { file: path.join(HERE, 'assets', 'dots.png') },
  gif: { file: path.join(HERE, 'assets', 'elon-laugh.gif'), gif: true },
};
for (const [k, p] of Object.entries(PICS)) {
  if (!fs.existsSync(p.file)) { console.error('\nSTOPPED. demo/assets/' + path.basename(p.file) + ' is missing.'); process.exit(1); }
  const b = fs.readFileSync(p.file);
  if (p.gif) { p.w = b.readUInt16LE(6); p.h = b.readUInt16LE(8); } else { p.w = b.readUInt32BE(16); p.h = b.readUInt32BE(20); }
}
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the small maths ---------- */
const EASE = K.ease, SPRING = K.spring, IO = K.io, EIN = K.in;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const bump = (t, a, up, hold, down) => (t < a ? 0 : t < a + up ? smooth(span(t, a, a + up)) : t < a + up + hold ? 1 : 1 - smooth(span(t, a + up + hold, a + up + hold + down)));
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps), n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };

/* ==========================================================================
   the read: six lines, the narrator, one take a line, post42's way.
   ========================================================================== */
const VOICE = 'calm';
const SPEED = 1.0;
const STOP = { lo: 0.20, hi: 0.60 };
const LINES = [
  { key: 'r1', text: 'you cannot make this up.' },
  { key: 'r2', text: 'openai just launched its new ai agent, called dots.' },
  { key: 'r3', text: 'and guess where dot.com takes you?' },
  { key: 'r4', text: 'straight to grok. elon\'s ai.' },
  { key: 'r5', text: 'nobody knows who did it, but come on.' },
  { key: 'r6', text: 'best troll of the year.' },
];
const SILENCE_DB = -42, PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, MAX_REDUCTION = 12;
if (!elevenReady('narrator')) {
  console.error('\nSTOPPED. elevenlabs is not set up for the narrator in demo/.env.');
  process.exit(1);
}
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m > gate; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}
/* the whole line in one request on eleven_v3, three takes a line, and one is
   kept. v3 takes stability as 0, 0.5 or 1 only, so the narrator's own 0.5 is
   v3's `natural`, the lowest setting short of `creative`, and a little style
   goes on top. v3 has no break tag: line 4's stop is the model's own. */
const MODEL = 'eleven_v3', VSET = { stability: 0.5, style: 0.2 }, TRIES = 3;
function quietRun(pcm, a, b) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20), H = Math.round(0.005 * SR);
  let best = 0, run = 0;
  for (let k = Math.floor(a * SR / H); k < Math.floor(b * SR / H); k++) {
    let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    run = m > gate ? 0 : run + 1; best = Math.max(best, run);
  }
  return +(best * 0.005).toFixed(4);
}
async function oneTake(i, n) {
  const parts = LINES[i].text.split(/(?<=[.!?])\s+/);
  const want = LINES[i].text;
  const name = 'post43-' + LINES[i].key + '-v3t' + n;
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  let g = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.provider === 'elevenlabs' && j.elevenId === 'narrator' && j.model === MODEL && j.speed === SPEED && fs.existsSync(j.file)) g = j;
  }
  if (!g) {
    try { g = await speak(want, { voice: VOICE, name, speed: SPEED, model: MODEL, ...VSET }); }
    catch (e) { console.error('\nSTOPPED. elevenlabs failed on ' + name + ': ' + (e && e.message || e)); process.exit(1); }
  }
  if (g.provider !== 'elevenlabs' || g.elevenId !== 'narrator' || g.model !== MODEL) { console.error('\nSTOPPED. ' + name + ' came back from ' + g.provider + ' ' + g.model + '.'); process.exit(1); }
  if (g.timing !== 'engine') { console.error('\nSTOPPED. ' + name + ' has estimated timings and the picture is cut to the read.'); process.exit(1); }
  const pcm = decode(ffmpeg, g.file);
  const words = g.words.filter(w => letters(w.word)).map(w => ({ word: w.word, start: +w.start, end: +w.end }));
  const counts = parts.map(q => q.split(/\s+/).filter(x => letters(x)).length);
  const edge = audioEdges(pcm);
  const t = { i, n, name, pcm, words, edge, sentences: parts.length, gaps: [], ok: true, why: [] };
  if (counts.reduce((x, y) => x + y, 0) !== words.length) { t.ok = false; t.why.push(words.length + ' words'); return t; }
  for (let k = 0, m = 0; k + 1 < parts.length; k++) { m += counts[k]; t.gaps.push(quietRun(pcm, words[m - 1].start, words[m].end)); }
  /* the longest hole inside the read, and anything after the last word */
  t.hole = quietRun(pcm, words[0].start, words[words.length - 1].end);
  t.tail = +(edge.end - words[words.length - 1].end).toFixed(3);
  t.dur = +(edge.end - edge.start).toFixed(3);
  if (t.hole > 0.6) { t.ok = false; t.why.push('a ' + t.hole + 's hole'); }
  if (t.tail > 0.5) { t.ok = false; t.why.push('sound ' + t.tail + 's after the last word'); }
  return t;
}
/* keep one of three by measurement: every take with all its words, no hole
   over 0.6s and nothing trailing, then the one whose length is nearest the
   middle of them, so neither the rushed nor the dragged read wins. every
   take stays on disk under its own name. */
async function take(i) {
  const all = [];
  for (let n = 1; n <= TRIES; n++) all.push(await oneTake(i, n));
  const good = all.filter(x => x.ok);
  if (!good.length) { console.error('\nSTOPPED. no usable take of line ' + (i + 1) + ': ' + all.map(x => x.why.join(', ')).join(' | ')); process.exit(1); }
  const mid = good.map(x => x.dur).sort((x, y) => x - y)[Math.floor((good.length - 1) / 2)];
  const kept = good.reduce((x, y) => (Math.abs(y.dur - mid) < Math.abs(x.dur - mid) ? y : x));
  kept.all = all.map(x => 't' + x.n + (x.ok ? ' ' + x.dur + 's' : ' out, ' + x.why.join(', ')) + (x === kept ? ' KEPT' : ''));
  return kept;
}
const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const [T1, T2, T3, T4, T5, T6] = TAKES;
function place(T, at) {
  T.at = +at.toFixed(4);
  T.end = +(at + T.edge.end - T.edge.start).toFixed(4);
  T.W = T.words.map(w => ({ ...w, start: +(at + w.start - T.edge.start).toFixed(4), end: +(at + w.end - T.edge.start).toFixed(4) }));
}
function word(T, w, after = 0) {
  for (let k = after; k < T.W.length; k++) if (letters(T.W[k].word) === letters(w)) return k;
  throw new Error('no word "' + w + '" in line ' + (T.i + 1) + ': ' + T.W.map(x => x.word).join(' '));
}
const wAt = (T, w, after = 0) => T.W[word(T, w, after)].start;

/* ==========================================================================
   the clock. every beat starts off the read.
   ========================================================================== */
const GAP = 0.42;
const after = (T, U) => place(U, T.end + GAP);
place(T1, 0.40);
after(T1, T2); after(T2, T3); after(T3, T4); after(T4, T5); after(T5, T6);
/* l1: the tweet is there from the first frame, springing in; he pops in */
const TW_IN = { at: 0.0, for: 0.55 };
const POP = { at: 0.30, for: 0.55 };
const UP = +(wAt(T1, 'up') - 0.02).toFixed(4);
/* l2: dots pops in over the tweet as the line starts */
const DOTS_IN = +(T2.at - 0.06).toFixed(4);
/* a hop on `dots`, the name landing */
const DOTS_W = +(wAt(T2, 'dots') - 0.02).toFixed(4);
/* l3: dots slides away, the push starts, slow, and runs to the end of l4 */
const DOTS_OUT = { at: +(T3.at - 0.08).toFixed(4), for: 0.42 };
const ZOOM = { at: +(T3.at + 0.10).toFixed(4), to: +(T4.end + 0.30).toFixed(4) };
/* the gif pops on `elons` and he makes room, moving left as it lands */
const GIF_IN = +(wAt(T4, 'elons') - 0.04).toFixed(4);
const MOVE = { at: +(GIF_IN - 0.12).toFixed(4), for: 0.55 };
/* l4: the arc and the hop on `grok` */
const GROK = +(wAt(T4, 'grok') - 0.03).toFixed(4);
/* l5: a slow squint, and he laughs along with the gif */
const SQUINT = { at: +(T5.at - 0.06).toFixed(4), for: 0.60 };
/* l6: to the camera, the big laughing bounce on `best`, played out before the cut */
const CAM = +(T6.at - 0.12).toFixed(4);
const LAUGH = +(T6.at - 0.04).toFixed(4);
const CUT = +(T6.end + 0.28).toFixed(4);
const END_HOLD = 0.70;
const SECONDS = +(CUT + END_HOLD).toFixed(4);

/* ---------- where everything sits, in css px of the 540x960 stage ---------- */
const TW = (() => { const w = 380, h = +(w * PICS.tweet.h / PICS.tweet.w).toFixed(2); return { l: (VW - w) / 2, t: 150, w, h, rad: 16 }; })();
const DT = { size: 296, cx: VW / 2, cy: TW.t + TW.h / 2 + 6, rad: 18 };
/* the push: the whole tweet grows from 380 to 418 css, the widest the margins
   allow, about the middle of the Dot.com line's height so it grows mostly
   down, and nothing is ever cut. a guard checks every edge each tenth of a
   second */
const FOCUS = { x: 0.5, y: 208 / PICS.tweet.h, z: 1.10 };
/* he sits bottom right, planned at the rig's 118 */
const SIZE = 118, SMALL = 1.0;
const HOME = { cx: 412, cy: 664 };
/* the gif, bottom right under the tweet, and where he goes to make room */
const GIF = (() => { const w = 250, h = +(w * PICS.gif.h / PICS.gif.w).toFixed(2); return { l: VW - MARGIN - w - 8, t: 524, w, h, rad: 16 }; })();
const LEFT = { cx: 142, cy: 640 };
const BOX = { left: +(HOME.cx - SIZE / 2).toFixed(2), top: +(HOME.cy - SIZE / 2).toFixed(2), size: SIZE };
const ST = { size: 21, weight: 500, top: 770, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 5 };

/* ---------- the subtitles: the whole read ---------- */
const SUBTITLES = [
  { line: 0, text: 'you cannot make this up' },
  { line: 1, text: 'openai just launched' },
  { line: 1, text: 'its new ai agent, called dots' },
  { line: 2, text: 'and guess where dot.com takes you?' },
  { line: 3, text: 'straight to grok' },
  { line: 3, text: 'elons ai' },
  { line: 4, text: 'nobody knows who did it' },
  { line: 4, text: 'but come on' },
  { line: 5, text: 'best troll of the year' },
];
const CARDS = [];
{
  const cursor = LINES.map(() => 0);
  for (const c of SUBTITLES) {
    const T = TAKES[c.line];
    const want = letters(c.text);
    let k = cursor[c.line];
    while (k < T.W.length && !want.startsWith(letters(T.W[k].word))) k++;
    const a = k;
    let got = '';
    while (k < T.W.length && got.length < want.length) got += letters(T.W[k++].word);
    if (got !== want) throw new Error('subtitle "' + c.text + '" does not match the read: ' + T.W.map(w => w.word).join(' '));
    cursor[c.line] = k;
    CARDS.push({ ...c, from: +(T.W[a].start - ST.lead).toFixed(4), to: +(T.W[k - 1].end + ST.tail).toFixed(4) });
  }
  for (let i = 0; i + 1 < CARDS.length; i++) if (CARDS[i].to > CARDS[i + 1].from - 0.02) CARDS[i].to = +(CARDS[i + 1].from - 0.02).toFixed(4);
}
function subAt(t) {
  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i];
    if (t < c.from || t >= c.to) continue;
    const o = Math.min(1, span(t, c.from, c.from + ST.fadeIn), 1 - span(t, c.to - ST.fadeOut, c.to));
    return { o: +o.toFixed(4), y: +(ST.rise * (1 - EASE(span(t, c.from, c.from + ST.fadeIn)))).toFixed(3), i };
  }
  return { o: 0, y: 0, i: -1 };
}
/* the copy rule, for every string on screen: no dash, colon, apostrophe or quote */
for (const s of [...WM.lines, ...SUBTITLES.map(c => c.text)]) {
  if (/[-\u2010-\u2015:'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, colon, apostrophe or quote on screen: ' + s);
}

/* ---------- the pictures ---------- */
function tweetAt(t) {
  const p = span(t, TW_IN.at, TW_IN.at + TW_IN.for);
  const fl = smooth(span(t, 0.6, 1.4));
  return { o: +span(t, TW_IN.at, TW_IN.at + 0.06).toFixed(3), s: +(lerp(0.82, 1, SPRING(p)) * lerp(1, FOCUS.z, IO(span(t, ZOOM.at, ZOOM.to)))).toFixed(4),
    y: +(fl * 2.6 * Math.sin(2 * Math.PI * t / 3.6)).toFixed(3) };
}
let GIFN = 0;
function gifAt(t) {
  const p = span(t, GIF_IN, GIF_IN + 0.55);
  const k = t < GIF_IN ? 0 : Math.floor((t - GIF_IN) * FPS + 1e-6) % Math.max(1, GIFN);
  return { o: +span(t, GIF_IN, GIF_IN + 0.06).toFixed(3), s: +lerp(0.45, 1, SPRING(p)).toFixed(4), r: +lerp(4, 0, SPRING(p)).toFixed(3), k };
}
function dotsAt(t) {
  const p = span(t, DOTS_IN, DOTS_IN + 0.55), q = EIN(span(t, DOTS_OUT.at, DOTS_OUT.at + DOTS_OUT.for));
  return { o: +(span(t, DOTS_IN, DOTS_IN + 0.06) * (1 - span(q, 0.7, 1))).toFixed(3), s: +lerp(0.5, 1, SPRING(p)).toFixed(4),
    x: +(-460 * q).toFixed(2), r: +(lerp(-3, 1, SPRING(p)) - 14 * q).toFixed(3) };
}

/* ---------- where he is, how he feels, where he looks ---------- */
const SEED = 23;
const plan = planMascot({ hands: false, seconds: 30, theme: 'dark', size: SIZE, bias: 0, seed: SEED, marks: [{ t: 0.0, state: 'neutral' }] });
plan.box = { ...BOX };
/* the happy arcs, each 0.55s. the laugh is the squint with one arc in it */
const ARCS = [
  { at: POP.at + 0.30, up: 0.09, hold: 0.30, down: 0.14 },
  { at: UP, up: 0.09, hold: 0.30, down: 0.14 },
  { at: DOTS_W, up: 0.09, hold: 0.30, down: 0.14 },
  { at: GROK, up: 0.09, hold: 0.30, down: 0.14 },
  { at: T5.at + 0.02, up: 0.09, hold: 0.30, down: 0.14 },
  { at: wAt(T5, 'but') - 0.02, up: 0.09, hold: 0.30, down: 0.14 },
  { at: LAUGH + 0.02, up: 0.09, hold: 0.30, down: 0.14 },
];
const arcAt = t => Math.max(0, ...ARCS.map(a => bump(t, a.at, a.up, a.hold, a.down)));
const squintAt = t => 0.48 * smooth(span(t, SQUINT.at, SQUINT.at + SQUINT.for));
/* the hops: small on the funny beats, and four for the laugh, each lower */
const HOPS = [
  { at: UP + 0.04, h: 7, for: 0.36 },
  { at: DOTS_W + 0.04, h: 9, for: 0.38 },
  { at: GROK + 0.04, h: 12, for: 0.40 },
  { at: LAUGH, h: 30, for: 0.44 },
  { at: LAUGH + 0.46, h: 20, for: 0.38 },
  { at: LAUGH + 0.86, h: 12, for: 0.32 },
  { at: LAUGH + 1.20, h: 6, for: 0.28 },
];
/* l5: he laughs along with the gif, small quick hops the length of the line */
for (let a = T5.at + 0.02, k = 0; a < LAUGH - 0.36; a += 0.40, k++) HOPS.push({ at: +a.toFixed(4), h: k % 2 ? 6 : 10, for: 0.34 });
function placeAt(t) {
  const s = SMALL * SPRING(span(t, POP.at, POP.at + POP.for));
  const live = smooth(span(t, POP.at + 0.5, POP.at + 1.2));
  let dy = live * 3.0 * Math.sin(2 * Math.PI * (t - POP.at) / 2.6);
  let sq = 0, rot = 0;
  for (const h of HOPS) {
    const p = span(t, h.at, h.at + h.for);
    dy -= h.h * Math.sin(Math.PI * EASE(p));
    /* a squash as each hop lands, and the head rocks with the laugh */
    sq += (h.h / 30) * 0.09 * Math.sin(Math.PI * span(t, h.at + h.for, h.at + h.for + 0.14));
  }
  rot = 3 * Math.sin(2 * Math.PI * (t - T5.at) / 0.8) * bump(t, T5.at, 0.2, LAUGH - T5.at - 0.2, 0.1)
    + 5 * Math.sin(2 * Math.PI * (t - LAUGH) / 0.8) * bump(t, LAUGH, 0.1, 1.1, 0.4);
  const mv = SPRING(span(t, MOVE.at, MOVE.at + MOVE.for));
  dy += lerp(0, LEFT.cy - HOME.cy, mv);
  return { dx: +lerp(0, LEFT.cx - HOME.cx, mv).toFixed(3), dy: +dy.toFixed(3), s: +Math.max(0.001, s).toFixed(5), sq: +sq.toFixed(4), rot: +rot.toFixed(3) };
}
const GAZE = { span: 150, max: 0.8, vspan: 260, vy: 2.2, up: 0.35, down: 0.5 };
const PL_R = HEAD.plate.s / 2, PL_CX = HEAD.plate.x + PL_R;
function eyeRoom(ey, halfW, halfH) {
  const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
  const PL_CY = HEAD.plate.y + PL_R;
  const dy = Math.max(Math.abs(top - PL_CY), Math.abs(bot - PL_CY));
  const half = dy >= PL_R ? 0 : Math.sqrt(PL_R * PL_R - dy * dy);
  return Math.max(0, half - TURN.margin - halfW);
}
function applyGaze(mas, g) {
  if (!g.q && !g.v) return;
  const aq = Math.abs(g.q), sgn = g.q < 0 ? -1 : 1, far = g.q >= 0 ? 1 : 0;
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k];
    if (k === far) { e.sx *= 1 - TURN.farX * aq; e.sy *= 1 - TURN.farY * aq; }
    const want = e.x + sgn * aq * (k === far ? TURN.shift : TURN.shift + TURN.wrap);
    const ey = e.y + GAZE.vy * g.v;
    const from = EYE_CX[k] - PL_CX + want;
    const lim = eyeRoom(ey, HEAD.eye.w / 2 * Math.abs(e.sx), HEAD.eye.h / 2 * Math.abs(e.sy));
    e.x = +(want + (clamp(from, -lim, lim) - from)).toFixed(4);
    e.y = +ey.toFixed(4);
  }
  mas.card.rot = +(mas.card.rot + TURN.tilt * g.q).toFixed(4);
}
/* what he looks at: the tweet, dots, dot.com, then the camera. `w` 0 is the lens */
const LOOKS = [
  { at: 0, f: () => ({ x: HOME.cx, y: HOME.cy }), w: 0 },
  { at: POP.at + 0.35, f: () => ({ x: TW.l + TW.w * 0.4, y: TW.t + TW.h * 0.3 }) },
  { at: DOTS_IN + 0.10, f: () => ({ x: DT.cx, y: DT.cy }) },
  { at: ZOOM.at, f: () => ({ x: TW.l + TW.w * (444 / PICS.tweet.w), y: TW.t + TW.h * FOCUS.y }) },
  { at: GIF_IN + 0.08, f: () => ({ x: GIF.l + GIF.w / 2, y: GIF.t + GIF.h * 0.4 }) },
  { at: CAM, f: () => ({ x: LEFT.cx, y: LEFT.cy }), w: 0 },
];
function lookAt(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const cur = LOOKS[i], p = cur.f(t);
  const k = i > 0 ? smooth(span(t, cur.at, cur.at + 0.30)) : 1;
  const prev = i > 0 ? LOOKS[i - 1] : cur, q = prev.f(t);
  return { x: lerp(q.x, p.x, k), y: lerp(q.y, p.y, k), w: lerp(prev.w ?? 1, cur.w ?? 1, k) };
}
function gazeAt(t) {
  const P = placeAt(t), L = lookAt(t);
  const eyeY = HOME.cy + P.dy + (HEAD.eye.cy / GRID - 0.5) * SIZE * P.s;
  return {
    q: +(clamp((L.x - HOME.cx - P.dx) / GAZE.span, -1, 1) * GAZE.max * L.w).toFixed(5),
    v: +(clamp((L.y - eyeY) / GAZE.vspan, -GAZE.up, GAZE.down) * L.w).toFixed(5),
  };
}
/* the lids, all written: calm, two blinks, none inside an arc or the squint */
const CALM = 0.04;
const BLINKS = [];
for (let at = 2.2; at < SQUINT.at - 0.4; at += 3.0) {
  let a = at;
  while (ARCS.some(x => a + 0.3 > x.at && a < x.at + x.up + x.hold + x.down + 0.1) || Math.abs(a - DOTS_OUT.at) < 0.3 || Math.abs(a - MOVE.at) < 0.4) a += 0.2;
  if (a < SQUINT.at - 0.3) BLINKS.push({ at: +a.toFixed(3), close: 0.07, hold: 0.03, open: 0.12 });
}
function lidAt(t) {
  let v = Math.max(CALM, squintAt(t));
  for (const B of BLINKS) {
    const c = B.at + B.close, h = c + B.hold;
    if (t < B.at || t >= h + B.open) continue;
    v = Math.max(v, t < c ? IO(span(t, B.at, c)) : t < h ? 1 : 1 - smooth(span(t, h, h + B.open)));
  }
  return +v.toFixed(4);
}
function compose(t) {
  const mas = mascotFrame(plan, t);
  applyGaze(mas, gazeAt(t));
  const lid = lidAt(t), arc = arcAt(t);
  for (const e of mas.eyes) {
    e.sy = +(e.sy * lerp(1, 0.40, arc)).toFixed(4);
    e.sx = +(e.sx * lerp(1, 1.28, arc)).toFixed(4);
    e.y = +(e.y + 0.9 * arc).toFixed(4);
    e.lid = +lerp(lid, 0, arc).toFixed(4);
  }
  const P = placeAt(t);
  mas.card = { ...mas.card, x: +(mas.card.x + P.dx).toFixed(4), y: +(mas.card.y + P.dy).toFixed(4), rot: +(mas.card.rot + P.rot).toFixed(4),
    sx: +(mas.card.sx * P.s * (1 + P.sq)).toFixed(5), sy: +(mas.card.sy * P.s * (1 - P.sq)).toFixed(5) };
  mas.shadow = { ...mas.shadow, o: 0 };
  return mas;
}

/* ---------- the glitch and the end card, post39's ---------- */
const GL = {
  offsets: [{ d: 0.40, for: 2 / 60, heat: 0.75 }, { d: 0.25, for: 3 / 60, heat: 1.0 }, { d: 0.12, for: 3 / 60, heat: 1.0 }, { d: 0, for: 2 / 60, heat: 0.45, residue: true }],
  jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70,
};
GL.bursts = GL.offsets.map(o => ({ t: +(CUT - o.d).toFixed(4), for: o.for, heat: o.heat, residue: !!o.residue }));
const GL_WINDOWS = GL.bursts.map((b, i) => ({ ...onGrid(b.t, b.for, FPS), heat: b.heat, residue: !!b.residue, seed: 0x5c1a + i * 977 }));
function glitchAt(f) {
  const g = { heat: 0, jx: 0, jy: 0, split: 0, slices: [] };
  const t = f / FPS;
  const w = GL_WINDOWS.find(x => t >= x.t0 - 1e-9 && t < x.t1 - 1e-9);
  if (!w) return g;
  const r = prng(w.seed ^ (f * 2654435761));
  g.heat = w.heat;
  g.jx = +((r() * 2 - 1) * GL.jumpX * w.heat).toFixed(1);
  g.jy = +((r() * 2 - 1) * GL.jumpY * w.heat).toFixed(1);
  g.split = +(w.heat * (3 + r() * (GL.split - 3))).toFixed(1);
  for (let i = 0; i < (w.residue ? 0 : GL.slices); i++) {
    const h = lerp(GL.sliceH[0], GL.sliceH[1], r());
    g.slices.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.sliceDx * w.heat).toFixed(1) });
  }
  return g;
}
const WM1 = { at: CUT, for: 0.09 };
const CRF = 17;

/* ---------- what one frame is ---------- */
function frameAt(t, f) {
  return {
    t: +t.toFixed(4), f, main: t < CUT ? 1 : 0,
    tw: tweetAt(t), dt: dotsAt(t), gif: gifAt(t),
    subt: subAt(t),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const GIFW = GIF.w * DSF, GIFH = Math.round(GIF.h * DSF);
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post43</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --read:"Space Grotesk",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--read)}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 38%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 50%,rgba(0,0,0,0) 74%)}
#main{position:absolute;inset:0}

/* ---- the pictures: post40's white outline and soft white glow, round a
   rounded clip because these two are screenshots and not cut outs ---- */
.pic{position:absolute;opacity:0;will-change:transform,opacity;
  filter:drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff)
    drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))}
.clip{position:absolute;inset:0;overflow:hidden;background:#000}
.clip img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;transform-origin:0 0;will-change:transform}
#tw{left:${TW.l}px;top:${TW.t}px;width:${TW.w}px;height:${TW.h}px;transform-origin:${(FOCUS.x * 100).toFixed(2)}% ${(FOCUS.y * 100).toFixed(2)}%;z-index:2}
#tw .clip{border-radius:${TW.rad}px}
#dt{left:${DT.cx - DT.size / 2}px;top:${DT.cy - DT.size / 2}px;width:${DT.size}px;height:${DT.size}px;transform-origin:50% 60%;z-index:3}
#dt .clip{border-radius:${DT.rad}px}
/* the gif: a bolder outline and a deeper, stronger glow than the stills */
.pic.big{filter:drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)
    drop-shadow(0 0 18px rgba(255,255,255,.90)) drop-shadow(0 0 46px rgba(255,255,255,.60)) drop-shadow(0 0 92px rgba(255,255,255,.36))}
#gf{left:${GIF.l}px;top:${GIF.t}px;width:${GIF.w}px;height:${GIF.h}px;transform-origin:50% 60%;z-index:4}
#gf .clip{border-radius:${GIF.rad}px}
#gfc{position:absolute;left:0;top:0;width:100%;height:100%;display:block}

/* ---- the mascot ---- */
#mas-cut{position:absolute;inset:0;z-index:6}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- the subtitles ---- */
.subt{position:absolute;left:${MARGIN}px;right:${MARGIN}px;top:${ST.top}px;text-align:center;z-index:9;
  font-family:var(--read);font-weight:${ST.weight};font-size:${ST.size}px;line-height:1.3;color:var(--sub);white-space:nowrap;opacity:0;will-change:transform,opacity}

/* ---- the end card ---- */
.wm{position:absolute;left:50%;top:${VH / 2}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}

/* ---- the glitch, post39's ---- */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#p43-r)}
.gl .g{filter:url(#p43-g)}
.gl .b{filter:url(#p43-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${chan('p43-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p43-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p43-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
</defs></svg>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="main">
    <div class="pic" id="tw"><div class="clip"><img id="twi" alt="" src="/tweet.png"></div></div>
    <div class="pic" id="dt"><div class="clip"><img id="dti" alt="" src="/dots.png"></div></div>
    <div class="pic big" id="gf"><div class="clip"><canvas id="gfc" width="${GIFW}" height="${GIFH}"></canvas></div></div>
  </div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="subt" id="subt"></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P43 = ${JSON.stringify({ VW, VH, WM, SLICES: GL.slices, SUBS: CARDS.map(c => c.text), GIFN })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('500 21px "Space Grotesk"'), document.getElementById('twi').decode(), document.getElementById('dti').decode(), window.__p43.loadGif()])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p43.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P43;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), main = $('main');
  const tw = $('tw'), twi = $('twi'), dt = $('dt');
  const gf = $('gf'), gfc = $('gfc'), gctx = gfc.getContext('2d');
  const gifs = [];
  let lastGif = -1;
  const mcut = $('mas-cut');
  const subt = $('subt');
  const wm = $('wm');
  const gl = $('gl');
  const chans = ['r', 'g', 'b'].map(k => $('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push($('sl' + i)); sliceImgs.push($('sl' + i + 'i')); }
  let lastSub = -2;
  window.__p43 = {
    /* every frame of the gif, decoded up front, so a frame is a draw and never a wait */
    loadGif() {
      const jobs = [];
      for (let i = 0; i < P.GIFN; i++) jobs.push(fetch('/gif/' + i + '.png').then(r => r.blob()).then(b => createImageBitmap(b)).then(bm => { gifs[i] = bm; }));
      return Promise.all(jobs);
    },
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      return { pics: [twi, $('dti')].map(i => ({ ok: i.complete, w: i.naturalWidth, h: i.naturalHeight })), gifs: gifs.filter(Boolean).length };
    },
    rect(sel) {
      const e = document.querySelector(sel);
      if (!e) return null;
      let o = 1;
      for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); o *= +cs.opacity; if (cs.display === 'none') o = 0; }
      if (o < 0.01) return null;
      const r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width };
    },
    apply(o) {
      main.style.display = o.main ? 'block' : 'none';
      mcut.style.display = o.main ? 'block' : 'none';
      tw.style.opacity = o.tw.o; tw.style.transform = 'translateY(' + o.tw.y + 'px) scale(' + o.tw.s + ')';
      gf.style.opacity = o.gif.o; gf.style.transform = 'rotate(' + o.gif.r + 'deg) scale(' + o.gif.s + ')';
      if (o.gif.k !== lastGif && gifs[o.gif.k]) { lastGif = o.gif.k; gctx.drawImage(gifs[o.gif.k], 0, 0, gfc.width, gfc.height); }
      dt.style.opacity = o.dt.o; dt.style.transform = 'translateX(' + o.dt.x + 'px) rotate(' + o.dt.r + 'deg) scale(' + o.dt.s + ')';
      if (o.subt.i !== lastSub) { lastSub = o.subt.i; subt.textContent = o.subt.i < 0 ? '' : P.SUBS[o.subt.i]; }
      subt.style.opacity = o.subt.o; subt.style.transform = 'translateY(' + o.subt.y + 'px)';
      stage.style.setProperty('--wm-o', o.wm.o);
      stage.style.setProperty('--wm-s', o.wm.sc);
      stage.style.setProperty('--wm-glow', o.wm.glow);
      gl.style.display = 'none';
    },
    glitch(src, g) {
      const imgs = chans.concat(sliceImgs);
      for (const im of imgs) im.src = src;
      return Promise.all(imgs.map(im => im.decode())).then(function () {
        chans[0].style.transform = 'translate(' + (g.jx - g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[1].style.transform = 'translate(' + g.jx.toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[2].style.transform = 'translate(' + (g.jx + g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        for (let i = 0; i < slices.length; i++) {
          const sl = g.slices[i];
          if (!sl) { slices[i].style.display = 'none'; continue; }
          slices[i].style.display = 'block';
          slices[i].style.setProperty('--st', sl.top.toFixed(1) + 'px');
          slices[i].style.setProperty('--sb', (P.VH - sl.top - sl.h).toFixed(1) + 'px');
          sliceImgs[i].style.transform = 'translate(' + (g.jx + sl.dx).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        }
        gl.style.display = 'block';
        return true;
      });
    },
  };
}

function serve(html) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = req.url.split('?')[0];
      const gm = /^\/gif\/(\d+)\.png$/.exec(u);
      if (gm) { res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(path.join(GIF_DIR, 'g' + String(+gm[1] + 1).padStart(4, '0') + '.png'))); }
      if (u === '/tweet.png' || u === '/dots.png') { res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(PICS[u === '/tweet.png' ? 'tweet' : 'dots'].file)); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(html);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}
function injected() {
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

console.log('\npost43, the dot.com troll. ' + SECONDS + 's, ' + FPS + 'fps.');
for (const T of TAKES) console.log('    line ' + (T.i + 1) + ', ' + T.all.join(', ') + (T.gaps.length ? ', stop ' + T.gaps.map(g => Math.round(g * 1000) + 'ms').join(' ') : ''));
for (const [t, what] of [[TW_IN.at, 'l1, the tweet'], [POP.at, 'he pops in'], [T1.at, 'the voice'], [UP, 'a hop on up'],
  [DOTS_IN, 'l2, dots pops in'], [DOTS_W, 'a hop on dots'], [DOTS_OUT.at, 'l3, dots slides away'], [ZOOM.at, 'the zoom on dot.com'], [GROK, 'l4, the arc on grok'], [GIF_IN, 'the gif pops, he moves left'],
  [SQUINT.at, 'l5, the squint and the laugh along'], [CAM, 'l6, to the camera'], [LAUGH, 'the big laugh'], [CUT, 'the end card'], [SECONDS, 'the end']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

/* the gif, resampled by ffmpeg to the render's own rate and drawn at twice
   its css size, which is its device size */
const GIF_DIR = path.join(OUT, 'gif-post43-' + FPS);
function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
fs.rmSync(GIF_DIR, { recursive: true, force: true }); fs.mkdirSync(GIF_DIR, { recursive: true });
ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', PICS.gif.file, '-vf', 'fps=' + FPS + ',scale=' + GIF.w * DSF + ':-2:flags=lanczos', path.join(GIF_DIR, 'g%04d.png')]);
GIFN = fs.readdirSync(GIF_DIR).filter(f => f.endsWith('.png')).length;
if (!GIFN) { console.error('\nSTOPPED. the gif gave no frames.'); process.exit(1); }
console.log('    the gif, ' + GIFN + ' frames at ' + FPS + 'fps, a loop of ' + (GIFN / FPS).toFixed(2) + 's');

/* ---------- the bus: six reads, to -14 ---------- */
const VTRACK = new Float32Array(Math.ceil((SECONDS + 0.5) * SR));
for (const T of TAKES) {
  const a = Math.max(0, Math.round((T.edge.start - PRE) * SR)), b = Math.min(T.pcm.length, Math.round((T.edge.end + POST) * SR));
  const at = Math.round((T.at - T.edge.start) * SR), fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + i;
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += T.pcm[i] * g;
  }
}
const WAV = path.join(OUT, 'post43-mix.wav'), RAW = path.join(OUT, 'post43-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
const attempt = gdb => { const buf = Float32Array.from(VTRACK); applyGain(buf, gdb); const lim = limit(buf, SAMPLE_CEILING); writeWav(RAW, buf); return { g: gdb, lim, r: loudness(ffmpeg, RAW) }; };
let lo = -6, hi = 30, best = null;
for (let i = 0; i < 12; i++) {
  const a = attempt((lo + hi) / 2);
  const legal = a.lim.reduction <= MAX_REDUCTION;
  if (legal && (!best || Math.abs(a.r.lufs - TARGET_LUFS) < Math.abs(best.r.lufs - TARGET_LUFS))) best = a;
  if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
}
if (!best) best = attempt(0);
{ const buf = Float32Array.from(VTRACK); applyGain(buf, best.g); limit(buf, SAMPLE_CEILING); writeWav(WAV, buf); }
fs.rmSync(RAW, { force: true });

/* ========================================================================== */
/* render                                                                     */
/* ========================================================================== */
async function render() {
  if (!CHROME) throw new Error('no chrome found');
  fs.rmSync(FRAMES, { recursive: true, force: true }); fs.mkdirSync(FRAMES, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio', '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => { const p = new Promise(r => { expired = r; }); await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms }); await p; };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const q of ['400 40px "Michroma"', '500 21px "Space Grotesk"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  const built = await page.evaluate(() => window.__built);

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__p43.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p43.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the pictures are the files, at their own shape */
  const fails = [];
  built.pics.forEach((p, i) => {
    const want = i ? PICS.dots : PICS.tweet;
    if (!p.ok || p.w !== want.w || p.h !== want.h) fails.push(path.basename(want.file) + ' did not load at its size');
  });
  if (built.gifs !== GIFN) fails.push('the gif loaded ' + built.gifs + ' of ' + GIFN + ' frames');
  /* the margin and the app zone for the pictures, him and the subtitles. dots
     is counted until it starts to slide away, which is it leaving the frame */
  const SB = { l: MARGIN, t: MARGIN, r: VW - MARGIN, b: VH - APP_ZONE };
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    await put(t, Math.round(t * FPS));
    const sels = ['#tw', '#m-card', '#subt', '#gf'];
    if (t < DOTS_OUT.at) sels.push('#dt');
    for (const sel of sels) {
      const r = await page.evaluate(s => window.__p43.rect(s), sel);
      if (!r || !r.w) continue;
      if (r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || r.b > SB.b + 0.5) fails.push(sel + ' past the margin at ' + t.toFixed(1) + 's: ' + [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / '));
    }
    const m = await page.evaluate(() => window.__p43.rect('#m-card'));
    const p = await page.evaluate(() => window.__p43.rect('#tw'));
    if (m && p && m.t < p.b + 4 && m.l < p.r && m.r > p.l) fails.push('he is on the tweet at ' + t.toFixed(1) + 's');
    const g = await page.evaluate(() => window.__p43.rect('#gf'));
    if (m && g && t > MOVE.at + MOVE.for && m.r > g.l - 4 && m.b > g.t) fails.push('he is on the gif at ' + t.toFixed(1) + 's');
    if (g && p && g.t < p.b + 6) fails.push('the gif is on the tweet at ' + t.toFixed(1) + 's');
    if (m && m.b > ST.top - 4) fails.push('he reaches the subtitles at ' + t.toFixed(1) + 's');
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p43.rect('#wm'));
  if (wr && (wr.l < SB.l || wr.r > SB.r)) fails.push('the wordmark is past the margin');

  const wall = Date.now();
  let glitched = 0;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const o = await put(t, f);
    if (o.g.heat > 0) glitched++;
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
    if (f % Math.round(FPS * 5) === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));
  await browser.close();
  srv.close();
  return { frames: N, glitched, fails };
}

const state = await render();
const FILE = path.join(OUT, 'post43-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
for (let i = 0; i < 2; i++) {
  const got = loudness(ffmpeg, FILE);
  if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
  const fixed = path.join(OUT, 'post43-mix-fix.wav'), tmp = path.join(OUT, 'post43-tmp.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', WAV, '-af', 'volume=' + (TARGET_LUFS - got.lufs).toFixed(2) + 'dB', fixed]);
  fs.renameSync(fixed, WAV);
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, FILE);
}
if (!KEEP) fs.rmSync(FRAMES, { recursive: true, force: true });

/* ---------- the critique sheets: a frame every half second, six across ---------- */
fs.mkdirSync(VERIFY, { recursive: true });
const rows = Math.ceil(Math.floor(SECONDS * 2) / 6);
ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=270:-2,tile=6x' + rows + ':padding=4:color=0x303030', '-frames:v', '1', path.join(VERIFY, 'contact.png')]);
ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=360:-2,tile=6x' + rows, '-frames:v', '1', path.join(VERIFY, 'phone.png')]);

/* ---------- the guards ---------- */
let probe = '';
try { execFileSync(ffmpeg, ['-hide_banner', '-i', FILE], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { probe = (e.stderr || '').toString(); }
const dur = probe.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : 0;
const fail = [...state.fails];
if (!/1080x1920/.test(probe)) fail.push('the file is not 1080x1920');
if (Math.abs(seconds - SECONDS) > 0.15) fail.push('the file runs ' + seconds.toFixed(2) + 's, not ' + SECONDS);
if (!/Audio:/.test(probe)) fail.push('the file has no audio track');
for (const T of TAKES) for (const g of T.gaps) if (g < STOP.lo || g > STOP.hi) fail.push('line ' + (T.i + 1) + ' has a ' + (g * 1000).toFixed(0) + 'ms stop between sentences');
for (let i = 0; i + 1 < TAKES.length; i++) {
  const gap = TAKES[i + 1].at - TAKES[i].end;
  if (gap < 0.25) fail.push('line ' + (i + 2) + ' starts on top of line ' + (i + 1));
  if (gap > 0.6) fail.push('a ' + gap.toFixed(2) + 's gap in the voice before line ' + (i + 2));
}
if (T1.at > 0.8) fail.push('the voice starts at ' + T1.at);
for (const a of ARCS) if (a.up + a.hold + a.down > 0.6) fail.push('a happy arc lasts ' + (a.up + a.hold + a.down).toFixed(2) + 's');
for (let f = 0, run = 0; f < CUT * 60; f++) { run = lidAt(f / 60) >= 0.98 ? run + 1 : 0; if (run / 60 > 0.3) { fail.push('the eyes are shut too long at ' + (f / 60).toFixed(2)); break; } }
for (let f = 0; f < CUT * 60; f++) if (lidAt(f / 60) > 0.5 && !BLINKS.some(B => f / 60 >= B.at && f / 60 < B.at + 0.25)) { fail.push('a lid past a squint at ' + (f / 60).toFixed(2)); break; }
for (const B of BLINKS) if (ARCS.some(a => B.at + 0.25 > a.at && B.at < a.at + a.up + a.hold + a.down)) fail.push('a blink inside a happy arc at ' + B.at);
/* something new every 2 to 4 seconds */
{
  const beats = [TW_IN.at, POP.at, UP, DOTS_IN, DOTS_W, GIF_IN, ...ARCS.map(a => a.at), DOTS_OUT.at, ZOOM.at, GROK, CAM, SQUINT.at, LAUGH, CUT].sort((a, b) => a - b);
  for (let i = 0; i + 1 < beats.length; i++) if (beats[i + 1] - beats[i] > 4) fail.push('nothing new from ' + beats[i].toFixed(2) + ' to ' + beats[i + 1].toFixed(2));
}
const lu = loudness(ffmpeg, FILE);
if (!lu || !lu.ok) fail.push('the loudness could not be measured');
else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fail.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
console.log('\n  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
console.log('  ' + state.glitched + ' glitched frames, sheets in ' + path.relative(ROOT, VERIFY));
console.log('  length ' + seconds.toFixed(2) + 's, six reads on the bus, ' + path.relative(ROOT, FILE));
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('  guards: all green');
