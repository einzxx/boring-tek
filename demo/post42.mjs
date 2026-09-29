/* the boring tek — post42. two new claude models.

   dark only, 1080x1920, five lines on the elevenlabs narrator at speed 1.0,
   every sentence its own take with a 300ms stop between them, post40's way.
   the voice never stops: no line starts more than GAP after the one before.
   no music: einz adds it.

     s1  two cards   OPUS 5.5 and SONNET 5.5 slam in side by side on the
                     spring, dates under them. he pops in below, calm, and
                     looks from card to card. post39's thought bubble pops
                     over his right side, claude code, and is gone before s2.
     s2  opus        the opus card grows to the centre, sonnet dims. a line
                     brain draws itself on the kit's trim path, 40% counts up
                     on `40`, less cost under it.
     s3  sonnet      the sonnet card zooms in fast with speed lines, opus
                     dims. 30% counts up on `30`, faster under it.
     s4  the split   a divider draws down the middle. a heavy hard job block
                     slides left into opus, a light daily task block slides
                     right into sonnet. he nods once.
     s5  the joke    the cards fade, he comes to the centre and looks at the
                     camera, happy then a squint. written by opus 5.5 types
                     on above him, and the anthropic mark pops in over it on
                     `opus` and turns slowly, post14's way. post39's glitch,
                     the end card.

   no hands. the one picture is demo/assets/anthropic-logo1.png, placed at its
   own colour and never recoloured, local only: demo/assets is ignored and the
   png is never committed. everything else is our own drawing. the rig, the gaze,
   the glitch and the end card are post41's. the springs, the trim path and
   the shake are the kit's. the brain is tabler outline, written in from
   memory. his eyes are calm, happy or a squint: the one happy arc is 0.55s
   and a guard says so.

     DEMO_FPS=12 node post42.mjs         the preview
     node post42.mjs                     60fps
     node post42.mjs --keep-frames       leave the jpegs on disk

     demo/out/post42-dark-1080x1920.mp4
     demo/out/verify-post42/contact.png, phone.png    the critique sheets
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
  STAGE, HEAD, GRID, BUBBLE, EYE_CX, TURN, GLOW,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenReady } from './lib/voice.mjs';
import { SR, decode, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';
import { EASE as K, INK, trim, lineShape, shake, motionApply } from './lib/motion.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post42');
const VERIFY = path.join(OUT, 'verify-post42');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const MARGIN = 120 / DSF;
const APP_ZONE = 300 / DSF;
const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');

/* the mark is a file dropped in as an <img>, post14's way. local only. */
const LOGO_FILE = path.join(HERE, 'assets', 'anthropic-logo1.png');
if (!fs.existsSync(LOGO_FILE)) { console.error('\nSTOPPED. demo/assets/anthropic-logo1.png is missing.'); process.exit(1); }
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

/* ---------- the words on screen, exactly as the brief wrote them ---------- */
const MODELS = [
  { name: 'OPUS', ver: '5.5', date: 'sept 22' },
  { name: 'SONNET', ver: '5.5', date: 'sept 28' },
];
const STAT = [{ n: 40, lab: 'less cost' }, { n: 30, lab: 'faster' }];
const BLOCKS = ['hard job', 'daily task'];
const BYLINE = 'written by opus 5.5';
const THINK = 'claude code';
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };

/* ==========================================================================
   the read: five lines, the narrator, a take per sentence, 300ms stops.
   ========================================================================== */
const VOICE = 'calm';
const STOP = { lo: 0.38, hi: 0.55 };
const SPEED = 1.0;
const LINES = [
  { key: 'r1', text: 'anthropic dropped two new claude models in one week.' },
  { key: 'r2', brk: [0.18], text: 'opus 5.5 is for the hard stuff. top level work, and it costs 40 percent less to run than opus 5.' },
  { key: 'r3', brk: [0.34], text: 'sonnet 5.5 is for everyday work. 30 percent faster, and up to 30 percent cheaper.' },
  { key: 'r4', brk: [0.34], text: 'big hard job, opus. daily stuff, sonnet.' },
  { key: 'r5', brk: [0.32, 0.34], text: 'fun fact. this script was written by opus 5.5. so yes, it is a bit biased.' },
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
/* one take a line, the whole line in one request, never cut, stretched or
   pitched. the stops between its sentences are elevenlabs break tags inside
   the take, so the voice carries through them. the tags come back in the
   alignment as words and are dropped from it. */
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
async function take(i) {
  const parts = LINES[i].text.split(/(?<=[.!?])\s+/);
  /* the break is set a boundary at a time: the model adds a stop of its own
     after a full stop, and how long that is differs by sentence */
  const want = parts.map((q, k) => k ? ' <break time="' + (LINES[i].brk || [])[k - 1].toFixed(2) + 's" /> ' + q : q).join('');
  const name = 'post42-' + LINES[i].key + '-one';
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  let g = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.provider === 'elevenlabs' && j.elevenId === 'narrator' && j.speed === SPEED && fs.existsSync(j.file)) g = j;
  }
  if (!g) {
    try { g = await speak(want, { voice: VOICE, name, speed: SPEED }); }
    catch (e) { console.error('\nSTOPPED. elevenlabs failed on ' + name + ': ' + (e && e.message || e)); process.exit(1); }
  }
  if (g.provider !== 'elevenlabs' || g.elevenId !== 'narrator') { console.error('\nSTOPPED. ' + name + ' came back from ' + g.provider + '.'); process.exit(1); }
  if (g.timing !== 'engine') { console.error('\nSTOPPED. ' + name + ' has estimated timings and the picture is cut to the read.'); process.exit(1); }
  const pcm = decode(ffmpeg, g.file);
  const words = g.words.filter(w => !/[<>=]/.test(w.word) && letters(w.word)).map(w => ({ word: w.word, start: +w.start, end: +w.end }));
  const counts = parts.map(q => q.split(/\s+/).filter(x => letters(x)).length);
  const n0 = counts.reduce((a, b) => a + b, 0);
  if (n0 !== words.length) { console.error('\nSTOPPED. ' + name + ' came back with ' + words.length + ' words, not ' + n0 + ': ' + words.map(w => w.word).join(' ')); process.exit(1); }
  const gaps = [];
  for (let k = 0, n = 0; k + 1 < parts.length; k++) { n += counts[k]; gaps.push(quietRun(pcm, words[n - 1].start, words[n].end)); }
  return { i, pcm, words, edge: audioEdges(pcm), sentences: parts.length, gaps };
}
const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const [T1, T2, T3, T4, T5] = TAKES;
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
const wEnd = (T, w, after = 0) => T.W[word(T, w, after)].end;

/* ==========================================================================
   the clock. every beat starts off the read.
   ========================================================================== */
const GAP = 0.42;
const after = (T, U) => place(U, T.end + GAP);
place(T1, 0.50);
after(T1, T2); after(T2, T3); after(T3, T4); after(T4, T5);
/* s1: the slams, before the voice, then he pops in under them */
const SLAM = [0.10, 0.30];
const DATE_IN = [0.52, 0.66];
const POP = { at: 0.78, for: 0.55 };
/* the bubble on his landing, out before opus starts to grow into its space */
/* s2: the move on the line, the brain draws, goes green on `top`, the count on `40` */
const S2 = +(T2.at - 0.18).toFixed(4);
const SAY = +(POP.at + 0.26).toFixed(4);
const SAY_OUT = +(S2 - 0.30 - 2 * 0.05 - 0.15).toFixed(4);
const BUB_GONE = +(SAY_OUT + 2 * 0.05 + 0.15).toFixed(4);
const BRAIN_AT = +(S2 + 0.42).toFixed(4);
const TOP = +(wAt(T2, 'top') - 0.04).toFixed(4);
const COUNT = [
  { at: +(wAt(T2, '40') - 0.10).toFixed(4), lab: +(wAt(T2, 'less') - 0.04).toFixed(4) },
];
/* s3: the zoom on the line, the count on the first `30`, a tick on `cheaper` */
const S3 = +(T3.at - 0.14).toFixed(4);
COUNT.push({ at: +(wAt(T3, '30') - 0.10).toFixed(4), lab: +(wAt(T3, 'faster') - 0.04).toFixed(4) });
const BOLT_AT = +(S3 + 0.40).toFixed(4);
const CHEAP = +(wAt(T3, 'cheaper') - 0.03).toFixed(4);
/* s4: the split on the line. hard job enters on `big` and lands on `opus`,
   daily task enters on `daily` and lands on `sonnet`, the nod after it */
const S4 = +(T4.at - 0.16).toFixed(4);
const HEAVY = { at: +(wAt(T4, 'big') - 0.06).toFixed(4), land: +(wAt(T4, 'opus') + 0.02).toFixed(4) };
const LIGHT = { at: +(wAt(T4, 'daily') - 0.06).toFixed(4), land: +(wAt(T4, 'sonnet') + 0.02).toFixed(4) };
const NOD = +(LIGHT.land + 0.12).toFixed(4);
/* s5: the fade and his walk to the centre on the line, the arc on `fact`,
   the byline on `written`, the squint on `so`, the cut on `biased` */
const S5 = +(T5.at - 0.14).toFixed(4);
const FACT = +(wAt(T5, 'fact') - 0.02).toFixed(4);
const BY = +(wAt(T5, 'written') - 0.06).toFixed(4);
const LOGO_AT = +(wAt(T5, 'opus') - 0.04).toFixed(4);
const SQUINT = +(wAt(T5, 'so') - 0.04).toFixed(4);
const CUT = +(wAt(T5, 'biased') - 0.04).toFixed(4);
const END_HOLD = 0.60;
const SECONDS = +(T5.end + END_HOLD).toFixed(4);

/* ---------- where everything sits, in css px of the 540x960 stage ---------- */
const CW = 196;
const A = [{ x: 64, y: 150, w: CW, h: 372 }, { x: 280, y: 150, w: CW, h: 372 }];
const BIG = { x: 112, y: 104, w: 316, h: 500 };
const card = (r, o) => ({ x: r.x, y: r.y, w: r.w, h: r.h, hs: 1, hk: 0, o: 1, s: 1, bo: 0, ...o });
const ST_A = [card(A[0]), card(A[1])];
const ST_BIG = card(BIG, { hs: 1.22, hk: 1, bo: 1 });
const ST_DIM = [card(A[0], { o: 0.26, s: 0.9 }), card(A[1], { o: 0.26, s: 0.9 })];
const ST_SPLIT = [card(A[0], { hk: 1 }), card(A[1], { hk: 1 })];
const ST_GONE = [card(A[0], { hk: 1, o: 0, s: 0.92 }), card(A[1], { hk: 1, o: 0, s: 0.92 })];
const KEYS = [
  [{ at: 0, v: ST_A[0] }, { at: S2, for: 0.60, v: ST_BIG }, { at: S3, for: 0.34, v: ST_DIM[0] }, { at: S4, for: 0.50, v: ST_SPLIT[0] }, { at: S5, for: 0.45, v: ST_GONE[0] }],
  [{ at: 0, v: ST_A[1] }, { at: S2, for: 0.50, v: ST_DIM[1] }, { at: S3, for: 0.34, v: ST_BIG }, { at: S4, for: 0.50, v: ST_SPLIT[1] }, { at: S5, for: 0.45, v: ST_GONE[1] }],
];
const HD_TOP = 24;
/* he sits under the cards, planned at the rig's 118 and drawn smaller, and
   walks up to the middle for s5 */
const SIZE = 118, SMALL = 0.90, BIGM = 1.32;
const HOME = { cx: 270, cy: 676 };
const CENTRE = { cx: 270, cy: 470 };
const BOX = { left: +(HOME.cx - SIZE / 2).toFixed(2), top: +(HOME.cy - SIZE / 2).toFixed(2), size: SIZE };
/* ---------- the thought bubble, post39's, over his right side ----------
   the plate is worked out at the size he is drawn in s1, SMALL of the rig's
   118, and the whole bubble rides his bob with him */
const DEG = Math.PI / 180;
const POPB = K.spring;
const UNIT = SIZE / GRID * SMALL;
const PLATE = {
  cx: HOME.cx + (HEAD.plate.x + HEAD.plate.s / 2 - GRID / 2) * UNIT,
  cy: HOME.cy + (HEAD.plate.y + HEAD.plate.s / 2 - GRID / 2) * UNIT,
  r: HEAD.plate.s / 2 * UNIT,
};
const BUB = {
  size: 24, weight: 600, padX: 18, padY: 10, lh: 1.25, angle: -122,
  gap: 9, d0: 9, d1: 13,
  step: 0.07, pillFor: 0.34, from: 0.55, outStep: 0.05, outFor: 0.15, outFrom: 0.86,
};
BUB.h = +(BUB.size * BUB.lh + 2 * BUB.padY + 2 * BUBBLE.stroke).toFixed(2);
BUB.r0 = +(PLATE.r + BUB.gap + BUB.d0 / 2).toFixed(4);
BUB.r1 = +(BUB.r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2).toFixed(4);
BUB.r2 = +(BUB.r1 + BUB.d1 / 2 + BUB.gap).toFixed(4);
BUB.c0x = +(PLATE.cx + BUB.r0 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c0y = +(PLATE.cy + BUB.r0 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.c1x = +(PLATE.cx + BUB.r1 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c1y = +(PLATE.cy + BUB.r1 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.py = +(PLATE.cy + BUB.r2 * Math.sin(BUB.angle * DEG)).toFixed(2);
const ST = { size: 21, weight: 500, top: 770, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 5 };
/* the blocks: heavy lands in opus, light lands in sonnet, both low in the card */
const HV = { w: 132, h: 86, from: 640, to: A[0].x + CW / 2, y: A[0].y + 286 };
const LT = { w: 116, h: 50, from: -100, to: A[1].x + CW / 2, y: A[1].y + 290 };
const DIV = lineShape(270, 128, 270, 548);
const BYL = { y: 336 };
/* post14's size, 108 css. it turns about its centre, so what has to clear is
   the circle of its diagonal: 76.4 css each way. post14's pace, a turn in
   eight seconds, eased in from still so it never arrives already spinning. */
const LOGO = { size: 108, cx: 270, cy: 232, rate: 45, ease: 0.45 };
const LOGO_REACH = LOGO.size * Math.SQRT2 / 2;
function logoAt(t) {
  const u = Math.max(0, t - LOGO_AT - 0.08);
  const rot = LOGO.rate * (u - LOGO.ease * (1 - Math.exp(-u / LOGO.ease)));
  return { o: +span(t, LOGO_AT, LOGO_AT + 0.06).toFixed(3), s: +lerp(0.35, 1, SPRING(span(t, LOGO_AT, LOGO_AT + 0.5))).toFixed(4), r: +rot.toFixed(3) };
}

/* ---------- the subtitles: the whole read ---------- */
const SUBTITLES = [
  { line: 0, text: 'anthropic dropped' },
  { line: 0, text: 'two new claude models' },
  { line: 0, text: 'in one week' },
  { line: 1, text: 'opus 5.5 is for the hard stuff' },
  { line: 1, text: 'top level work' },
  { line: 1, text: 'and it costs 40 percent less' },
  { line: 1, text: 'to run than opus 5' },
  { line: 2, text: 'sonnet 5.5 is for everyday work' },
  { line: 2, text: '30 percent faster' },
  { line: 2, text: 'and up to 30 percent cheaper' },
  { line: 3, text: 'big hard job, opus' },
  { line: 3, text: 'daily stuff, sonnet' },
  { line: 4, text: 'fun fact' },
  { line: 4, text: 'this script was written by opus 5.5' },
  { line: 4, text: 'so yes, it is a bit biased' },
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
for (const s of [...MODELS.flatMap(m => [m.name, m.ver, m.date]), ...STAT.map(s => s.n + '%'), ...STAT.map(s => s.lab), ...BLOCKS, BYLINE, THINK, ...WM.lines, ...SUBTITLES.map(c => c.text)]) {
  if (/[-\u2010-\u2015:'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, colon, apostrophe or quote on screen: ' + s);
}

/* ---------- the cards ---------- */
const FIELDS = ['x', 'y', 'w', 'h', 'hs', 'hk', 'o', 's', 'bo'];
function cardAt(i, t) {
  const keys = KEYS[i];
  let v = { ...keys[0].v };
  for (let k = 1; k < keys.length; k++) {
    const K1 = keys[k];
    if (t < K1.at) break;
    const p = span(t, K1.at, K1.at + K1.for);
    const pos = SPRING(p), soft = EASE(p);
    const n = {};
    const quick = EASE(span(t, K1.at, K1.at + 0.16));
    for (const f of FIELDS) n[f] = lerp(v[f], K1.v[f], f === 'bo' && K1.v.bo < v.bo ? quick : f === 'o' || f === 'bo' || f === 'hk' ? soft : pos);
    v = n;
  }
  v.o = clamp(v.o, 0, 1); v.bo = clamp(v.bo, 0, 1); v.hk = clamp(v.hk, 0, 1);
  /* the slam: in from big and clear, on the spring */
  const sl = span(t, SLAM[i], SLAM[i] + 0.36);
  v.s *= lerp(1.42, 1, SPRING(sl));
  v.o *= span(t, SLAM[i], SLAM[i] + 0.07);
  /* the landings: the heavy block drives opus down, the light one barely moves sonnet */
  const hit = i === 0 ? HEAVY.land : LIGHT.land, depth = i === 0 ? 9 : 3.5;
  v.dip = t < hit ? 0 : depth * Math.sin(Math.PI * span(t, hit, hit + 0.34)) * (1 - span(t, hit + 0.17, hit + 0.34) * 0.4);
  return v;
}
/* which card is in front: the focused one */
const frontAt = t => (t >= S3 && t < S4 + 0.25 ? 1 : 0);
const centreOf = (i, t) => { const c = cardAt(i, t); return { x: c.x + c.w / 2, y: c.y + c.h / 2 + c.dip }; };

/* ---------- the speed lines, s3 ---------- */
const SPEED_LINES = (() => {
  const r = prng(0x5bd1);
  return Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * 2 * Math.PI + (r() * 2 - 1) * 0.22 - Math.PI / 2, d: +(r() * 0.06).toFixed(3), r0: 150 + r() * 30, w: 1.5 + r() * 1.5 }));
})();
function speedAt(t) {
  const cx = BIG.x + BIG.w / 2, cy = BIG.y + BIG.h / 2;
  return SPEED_LINES.map(L => {
    const p = span(t, S3 + L.d, S3 + L.d + 0.46);
    if (p <= 0 || p >= 1) return { o: 0, x1: cx, y1: cy, x2: cx, y2: cy };
    const k = EASE(p), r = lerp(L.r0, L.r0 + 190, k), len = lerp(120, 26, k);
    const ca = Math.cos(L.a) * 0.72, sa = Math.sin(L.a);
    return { o: +((1 - p) * span(p, 0, 0.12) * 0.9).toFixed(3), x1: +(cx + ca * r).toFixed(1), y1: +(cy + sa * r).toFixed(1), x2: +(cx + ca * (r + len)).toFixed(1), y2: +(cy + sa * (r + len)).toFixed(1) };
  });
}

/* ---------- the blocks, s4 ---------- */
function heavyAt(t) {
  /* heavy: a slow start, gathering speed, stopped dead, a squash on the landing */
  const p = span(t, HEAVY.at, HEAVY.land);
  const x = lerp(HV.from, HV.to, EIN(p));
  const sq = t < HEAVY.land ? 0 : Math.sin(Math.PI * span(t, HEAVY.land, HEAVY.land + 0.26)) * (1 - span(t, HEAVY.land, HEAVY.land + 0.26) * 0.5);
  const fade = 1 - span(t, S5, S5 + 0.4);
  return { o: +(span(t, HEAVY.at, HEAVY.at + 0.05) * fade).toFixed(3), x: +x.toFixed(2), y: HV.y + cardAt(0, t).dip, sx: +(1 + 0.14 * sq).toFixed(4), sy: +(1 - 0.12 * sq).toFixed(4) };
}
function lightAt(t) {
  /* light: quick off the mark, a little overshoot, it floats */
  const p = span(t, LIGHT.at, LIGHT.land);
  const x = lerp(LT.from, LT.to, SPRING(p));
  const bob = t < LIGHT.land ? -8 * Math.sin(Math.PI * p) : 0;
  const fade = 1 - span(t, S5, S5 + 0.4);
  return { o: +(span(t, LIGHT.at, LIGHT.at + 0.05) * fade).toFixed(3), x: +x.toFixed(2), y: +(LT.y + bob + cardAt(1, t).dip).toFixed(2), r: +(t < LIGHT.land ? -6 * (1 - p) : 0).toFixed(2) };
}

/* ---------- where he is, how he feels, where he looks ---------- */
const SEED = 11;
const plan = planMascot({ hands: false, seconds: 40, theme: 'dark', size: SIZE, bias: 0, seed: SEED, marks: [{ t: 0.0, state: 'neutral' }] });
plan.box = { ...BOX };
/* the one happy arc, on `fact`, 0.55s */
const ARCS = [{ at: FACT, up: 0.09, hold: 0.30, down: 0.14 }];
const arcAt = t => Math.max(0, ...ARCS.map(a => bump(t, a.at, a.up, a.hold, a.down)));
/* then the squint, held to the cut */
const squintAt = t => 0.42 * smooth(span(t, SQUINT, SQUINT + 0.22));
const WALK = { at: +(S5 + 0.05).toFixed(4), for: 0.62 };
function placeAt(t) {
  const pop = SPRING(span(t, POP.at, POP.at + POP.for));
  const w = SPRING(span(t, WALK.at, WALK.at + WALK.for));
  const s = lerp(SMALL, BIGM, w) * pop;
  const live = smooth(span(t, POP.at + 0.5, POP.at + 1.2));
  let dy = live * 3.2 * Math.sin(2 * Math.PI * (t - POP.at) / 2.6);
  /* he flinches with the heavy landing, and the one nod */
  dy += 3 * Math.sin(Math.PI * span(t, HEAVY.land, HEAVY.land + 0.2));
  dy += 9 * Math.sin(Math.PI * EASE(span(t, NOD, NOD + 0.40)));
  dy -= 8 * Math.sin(Math.PI * EASE(span(t, FACT, FACT + 0.42)));
  return { dx: +lerp(0, CENTRE.cx - HOME.cx, w).toFixed(3), dy: +(dy + lerp(0, CENTRE.cy - HOME.cy, w)).toFixed(3), s: +Math.max(0.001, s).toFixed(5) };
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
/* the things he looks at, in order, each eased in from the last. `w` 0 is
   straight at the camera. */
const OPUS_C = t => centreOf(0, t), SON_C = t => centreOf(1, t);
const LOOKS = [
  { at: 0, f: () => ({ x: HOME.cx, y: HOME.cy }), w: 0 },
  { at: POP.at + 0.40, f: OPUS_C },
  { at: wAt(T1, 'two') - 0.05, f: SON_C },
  { at: wAt(T1, 'models') - 0.05, f: OPUS_C },
  { at: wAt(T1, 'week') - 0.05, f: SON_C },
  { at: S2 + 0.10, f: OPUS_C },
  { at: S3, f: SON_C },
  { at: HEAVY.at + 0.15, f: t => { const h = heavyAt(t); return { x: h.x, y: h.y }; } },
  { at: LIGHT.at + 0.12, f: t => { const l = lightAt(t); return { x: l.x, y: l.y }; } },
  { at: S5 + 0.10, f: () => ({ x: CENTRE.cx, y: CENTRE.cy }), w: 0 },
];
function lookAt(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const cur = LOOKS[i], p = cur.f(t);
  const k = i > 0 ? smooth(span(t, cur.at, cur.at + 0.28)) : 1;
  const prev = i > 0 ? LOOKS[i - 1] : cur, q = prev.f(t);
  const w = lerp(prev.w ?? 1, cur.w ?? 1, k);
  return { x: lerp(q.x, p.x, k), y: lerp(q.y, p.y, k), w };
}
function gazeAt(t) {
  const P = placeAt(t), L = lookAt(t);
  const eyeY = HOME.cy + P.dy + (HEAD.eye.cy / GRID - 0.5) * SIZE * P.s;
  return {
    q: +(clamp((L.x - HOME.cx - P.dx) / GAZE.span, -1, 1) * GAZE.max * L.w).toFixed(5),
    v: +(clamp((L.y - eyeY) / GAZE.vspan, -GAZE.up, GAZE.down) * L.w).toFixed(5),
  };
}
/* the lids, all written: calm, a few blinks, none inside the arc or the squint */
const CALM = 0.04;
const BLINKS = [];
for (let at = 2.3; at < SQUINT - 0.5; at += 3.2) {
  let a = at;
  while (ARCS.some(x => a + 0.3 > x.at && a < x.at + x.up + x.hold + x.down + 0.1) || Math.abs(a - HEAVY.land) < 0.3 || Math.abs(a - NOD) < 0.4) a += 0.2;
  if (a < SQUINT - 0.4) BLINKS.push({ at: +a.toFixed(3), close: 0.07, hold: 0.03, open: 0.12 });
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
  mas.card = { ...mas.card, x: +(mas.card.x + P.dx).toFixed(4), y: +(mas.card.y + P.dy).toFixed(4), sx: +(mas.card.sx * P.s).toFixed(5), sy: +(mas.card.sy * P.s).toFixed(5) };
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

/* ---------- the bubble, post39's ---------- */
function pillPop(t, at, outAt) {
  const inP = span(t, at, at + BUB.pillFor), outP = span(t, outAt, outAt + BUB.outFor);
  if (t < at) return { o: 0, s: BUB.from };
  if (outP >= 1) return { o: 0, s: BUB.outFrom };
  return { o: +(span(t, at, at + 0.08) * (1 - outP)).toFixed(4),
    s: +(outP > 0 ? lerp(1, BUB.outFrom, smooth(outP)) : lerp(BUB.from, 1, POPB(inP))).toFixed(4) };
}
function bubbleAt(t) {
  if (t < SAY || t >= BUB_GONE) return { o: 0, dy: 0, dots: [{ o: 0, s: 0.4 }, { o: 0, s: 0.4 }], pill: { o: 0, s: BUB.from } };
  const d0 = pillPop(t, SAY, SAY_OUT + 2 * BUB.outStep), d1 = pillPop(t, SAY + BUB.step, SAY_OUT + BUB.outStep), pl = pillPop(t, SAY + 2 * BUB.step, SAY_OUT);
  return { o: Math.max(d0.o, d1.o, pl.o), dy: +placeAt(t).dy.toFixed(3), dots: [d0, d1], pill: pl };
}

/* ---------- what one frame is ---------- */
let LAY = null, BRAIN = null;
function frameAt(t, f) {
  const sh = [shake(t, { t0: SLAM[0] + 0.06, amp: 5, dur: 0.3, seed: 3 }), shake(t, { t0: SLAM[1] + 0.06, amp: 5, dur: 0.3, seed: 5 }), shake(t, { t0: HEAVY.land, amp: 7, dur: 0.34, seed: 9 })]
    .reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
  const cards = [0, 1].map(i => {
    const c = cardAt(i, t);
    const hdTop = lerp((c.h - LAY.hdH[i] * c.hs) / 2, HD_TOP, c.hk);
    const bodyTop = HD_TOP + LAY.hdH[i] * c.hs + 6;
    const C = COUNT[i];
    const n = Math.round(STAT[i].n * EASE(span(t, C.at, C.at + 0.72)));
    const tick = i === 1 ? 1 + 0.06 * Math.sin(Math.PI * span(t, CHEAP, CHEAP + 0.30)) : 1;
    const land = 1 + 0.08 * Math.sin(Math.PI * span(t, C.at + 0.62, C.at + 0.9));
    const active = i === 0 ? smooth(span(t, S2, S2 + 0.4)) * (1 - smooth(span(t, S3, S3 + 0.3))) : smooth(span(t, S3, S3 + 0.3)) * (1 - smooth(span(t, S4, S4 + 0.3)));
    const date = span(t, DATE_IN[i], DATE_IN[i] + 0.3);
    return {
      x: +c.x.toFixed(2), y: +(c.y + c.dip).toFixed(2), w: +c.w.toFixed(2), h: +c.h.toFixed(2), o: +c.o.toFixed(4), s: +c.s.toFixed(4), z: frontAt(t) === i ? 3 : 2,
      hdTop: +hdTop.toFixed(2), hs: +c.hs.toFixed(4), bodyTop: +bodyTop.toFixed(2), bodyH: +Math.max(0, c.h - bodyTop - 16).toFixed(2), bo: +c.bo.toFixed(4),
      date: { o: +date.toFixed(3), n: Math.round(MODELS[i].date.length * clamp(date * 1.6, 0, 1)) },
      num: { o: +span(t, C.at, C.at + 0.06).toFixed(3), n, s: +(tick * land).toFixed(4) },
      lab: { o: +span(t, C.lab, C.lab + 0.16).toFixed(3), y: +(8 * (1 - EASE(span(t, C.lab, C.lab + 0.3)))).toFixed(2) },
      act: +active.toFixed(4),
    };
  });
  const brain = {};
  for (const b of BRAIN) Object.assign(brain, trim(t, { id: b.id, shape: b.shape, t0: b.t0, dur: b.dur }));
  const green = EASE(span(t, TOP, TOP + 0.3));
  const hv = heavyAt(t), lt = lightAt(t);
  const by = span(t, BY, BY + 0.55);
  return {
    t: +t.toFixed(4), f, main: t < CUT ? 1 : 0,
    sh: { x: +sh.x.toFixed(2), y: +sh.y.toFixed(2) },
    cards, brain, green: +green.toFixed(4), bpop: +(1 + 0.08 * Math.sin(Math.PI * span(t, TOP, TOP + 0.34))).toFixed(4),
    bgreen: +EASE(span(t, COUNT[1].lab, COUNT[1].lab + 0.3)).toFixed(4), bolt: +(1 + 0.12 * Math.sin(Math.PI * span(t, CHEAP, CHEAP + 0.32))).toFixed(4),
    speed: speedAt(t),
    div: { ...trim(t, { id: 'div', shape: DIV, t0: S4 + 0.08, dur: 0.42 }), o: +(1 - span(t, S5, S5 + 0.35)).toFixed(3) },
    hv, lt,
    logo: logoAt(t),
    bub: bubbleAt(t),
    by: { o: +span(t, BY, BY + 0.06).toFixed(3), n: Math.round(BYLINE.length * by), caret: t >= BY && t < CUT ? (Math.floor((t - BY) / 0.26) % 2 === 0 || by < 1 ? 1 : 0) : 0 },
    subt: subAt(t),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
/* tabler's brain, outline, on its 24 grid */
const BOLT_D = ['M13 3v7h6l-8 11v-7h-6l8 -11'];
const BRAIN_D = [
  'M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8',
  'M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8',
  'M17.5 16a3.5 3.5 0 0 0 0 -7h-.5',
  'M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0',
  'M6.5 16a3.5 3.5 0 0 1 0 -7h.5',
  'M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10',
];
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  const brainSvg = '<svg class="brain" id="brain" viewBox="0 0 24 24" aria-hidden="true">' + BRAIN_D.map((d, i) => '<path id="br' + i + '" d="' + d + '" opacity="0"/>').join('') + '</svg>';
  const boltSvg = '<svg class="brain" id="bolt" viewBox="0 0 24 24" aria-hidden="true">' + BOLT_D.map((d, i) => '<path id="bo' + i + '" d="' + d + '" opacity="0"/>').join('') + '</svg>';
  const cardHtml = (m, i) => `<div class="card" id="c${i}"><div class="hd" id="hd${i}"><div class="nm">${m.name}</div><div class="vr">${m.ver}</div><div class="dt"><span id="dt${i}"></span></div></div>
      <div class="bd" id="bd${i}">${i === 0 ? brainSvg : boltSvg}<div class="num" id="num${i}">0<small>%</small></div><div class="lab" id="lab${i}">${STAT[i].lab}</div></div></div>`;
  const speed = SPEED_LINES.map((L, i) => `<line id="spd${i}" x1="0" y1="0" x2="0" y2="0" stroke-width="${L.w.toFixed(2)}" opacity="0"/>`).join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post42</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&family=Space+Grotesk:wght@400;500&display=swap">
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
  --acc:${INK.dark.accent};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--read)}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 42%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 50%,rgba(0,0,0,0) 74%)}
#main,#shk{position:absolute;inset:0}
#spd{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:1;overflow:visible}
#spd line{stroke:var(--acc);stroke-linecap:round}
#divs{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:1;overflow:visible}

/* ---- the cards ---- */
.card{position:absolute;left:0;top:0;border-radius:20px;background:#0c0f13;border:1.5px solid #232931;opacity:0;transform-origin:50% 50%;will-change:transform,opacity}
.hd{position:absolute;left:0;right:0;top:0;text-align:center;transform-origin:50% 0}
.nm{font-family:var(--display);font-size:19px;letter-spacing:.14em;text-indent:.14em;color:var(--acc)}
.vr{font-family:var(--display);font-size:62px;line-height:1.12;color:var(--fg);margin-top:4px}
.dt{font-family:var(--mono);font-size:20px;color:var(--sub);height:26px;margin-top:6px}
.bd{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
.brain{width:108px;height:108px;fill:none;stroke:var(--fg);stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round;overflow:visible;margin-bottom:6px}
.num small{font-family:var(--read);font-weight:500;font-size:.62em;margin-left:.06em}
.num{font-family:var(--display);font-size:66px;line-height:1.15;color:var(--acc);opacity:0;transform-origin:50% 60%;white-space:nowrap}
.lab{font-family:var(--read);font-size:25px;font-weight:500;color:var(--fg);opacity:0;margin-top:2px}

/* ---- the blocks ---- */
.blk{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity;z-index:5;white-space:nowrap}
#hv{width:${HV.w}px;height:${HV.h}px;margin:${-HV.h / 2}px 0 0 ${-HV.w / 2}px;border-radius:9px;background:#353b44;border:1.5px solid #59616c;border-bottom-width:6px;
  font-family:var(--read);font-weight:500;font-size:19px;color:#f1f4f2;transform-origin:50% 100%}
#lt{width:${LT.w}px;height:${LT.h}px;margin:${-LT.h / 2}px 0 0 ${-LT.w / 2}px;border-radius:9px;background:rgba(53,255,106,.10);border:1.5px solid rgba(53,255,106,.7);
  font-family:var(--read);font-weight:500;font-size:17px;color:var(--acc)}

/* ---- the byline ---- */
#logo{position:absolute;left:${LOGO.cx - LOGO.size / 2}px;top:${LOGO.cy - LOGO.size / 2}px;width:${LOGO.size}px;height:${LOGO.size}px;display:block;opacity:0;z-index:5;will-change:transform,opacity}
#by{position:absolute;left:${MARGIN}px;right:${MARGIN}px;top:${BYL.y}px;text-align:center;font-family:var(--mono);font-size:24px;color:var(--sub);white-space:pre;opacity:0;z-index:5}
#by b{font-weight:400;color:var(--acc)}
#by i{display:inline-block;width:.6em;height:1.05em;vertical-align:-.18em;background:var(--acc);margin-left:2px}

/* ---- the mascot ---- */
#mas-cut{position:absolute;inset:0;z-index:6}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- the house thought bubble, post39's ---- */
.sb{${tokens};position:absolute;inset:0;z-index:7;pointer-events:none;will-change:transform}
.sb i{position:absolute;display:block;border-radius:50%;background:var(--eye);border:${BUBBLE.stroke}px solid var(--bub);opacity:0;will-change:transform,opacity}
#sb-d0{left:${(BUB.c0x - BUB.d0 / 2).toFixed(2)}px;top:${(BUB.c0y - BUB.d0 / 2).toFixed(2)}px;width:${BUB.d0}px;height:${BUB.d0}px}
#sb-d1{left:${(BUB.c1x - BUB.d1 / 2).toFixed(2)}px;top:${(BUB.c1y - BUB.d1 / 2).toFixed(2)}px;width:${BUB.d1}px;height:${BUB.d1}px}
.sb .p{position:absolute;left:50%;top:${BUB.py}px;width:var(--pill-w,200px);height:${BUB.h}px;
  margin-left:calc(var(--pill-w,200px) / -2);margin-top:${-BUB.h}px;
  border:${BUBBLE.stroke}px solid var(--bub);border-radius:${BUBBLE.radius}px;background:var(--eye);
  transform-origin:var(--pill-ox,38%) 100%;opacity:0;will-change:transform,opacity}
.sb .p span{position:absolute;left:50%;top:${BUB.padY}px;transform:translateX(-50%);
  color:var(--face);font-family:"Nunito",var(--mono);font-weight:${BUB.weight};font-size:${BUB.size}px;
  line-height:${BUB.lh};letter-spacing:.005em;white-space:nowrap}

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
.gl .r{filter:url(#p42-r)}
.gl .g{filter:url(#p42-g)}
.gl .b{filter:url(#p42-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${chan('p42-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p42-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p42-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
</defs></svg>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="main"><div id="shk">
    <svg id="spd" viewBox="0 0 ${VW} ${VH}" aria-hidden="true">${speed}</svg>
    <svg id="divs" viewBox="0 0 ${VW} ${VH}" aria-hidden="true"><path id="div" d="${DIV.d}" fill="none" stroke="#2c333c" stroke-width="2" stroke-linecap="round" opacity="0"/></svg>
    ${MODELS.map(cardHtml).join('\n    ')}
    <div class="blk" id="hv">${BLOCKS[0]}</div>
    <div class="blk" id="lt">${BLOCKS[1]}</div>
    <img id="logo" alt="" src="/logo.png">
    <div id="by"><span id="byt"></span><i id="caret"></i></div>
  </div></div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="sb" id="sb"><i id="sb-d0"></i><i id="sb-d1"></i><span class="p" id="sb-p"><span id="sbt">${THINK}</span></span></div>
  <div class="subt" id="subt"></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P42 = ${JSON.stringify({ VW, VH, WM, SLICES: GL.slices, NSPD: SPEED_LINES.length, SUBS: CARDS.map(c => c.text), DATES: MODELS.map(m => m.date), BYLINE, PAD: BUB.padX, STROKE: BUBBLE.stroke, D1X: BUB.c1x })};
${mascotRuntime()}
${motionApply.toString()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 19px "Space Grotesk"'), document.fonts.load('500 19px "Space Grotesk"'), document.fonts.load('${BUB.weight} ${BUB.size}px Nunito'), document.getElementById('logo').decode()])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p42.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P42;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), main = $('main'), shk = $('shk');
  const cards = [0, 1].map(i => ({ el: $('c' + i), hd: $('hd' + i), bd: $('bd' + i), num: $('num' + i), lab: $('lab' + i), dt: $('dt' + i), last: -1, lastD: -1 }));
  const brain = $('brain'), bolt = $('bolt');
  const spd = []; for (let i = 0; i < P.NSPD; i++) spd.push($('spd' + i));
  const divp = $('div'), hv = $('hv'), lt = $('lt');
  const logo = $('logo');
  const sb = $('sb'), pill = $('sb-p'), dots = [$('sb-d0'), $('sb-d1')];
  let pillW = 200;
  const by = $('by'), byt = $('byt'), caret = $('caret');
  const mcut = $('mas-cut');
  const subt = $('subt');
  const wm = $('wm');
  const gl = $('gl');
  const chans = ['r', 'g', 'b'].map(k => $('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push($('sl' + i)); sliceImgs.push($('sl' + i + 'i')); }
  let lastSub = -2, lastBy = -1;
  window.__p42 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      cards.forEach((c, i) => { c.dt.textContent = P.DATES[i]; });
      const hdH = cards.map(c => c.hd.getBoundingClientRect().height);
      const nmW = cards.map(c => c.hd.querySelector('.nm').getBoundingClientRect().width);
      cards.forEach(c => { c.dt.textContent = ''; });
      const brainLen = [...brain.querySelectorAll('path')].map(p => p.getTotalLength());
      const boltLen = [...document.querySelectorAll('#bolt path')].map(p => p.getTotalLength());
      const rg = document.createRange(); rg.selectNodeContents($('sbt'));
      pillW = +(rg.getBoundingClientRect().width + 2 * P.PAD + 2 * P.STROKE).toFixed(2);
      pill.style.setProperty('--pill-w', pillW + 'px');
      const ox = Math.max(10, Math.min(pillW - 10, P.D1X - (P.VW / 2 - pillW / 2)));
      pill.style.setProperty('--pill-ox', (ox / pillW * 100).toFixed(2) + '%');
      return { hdH, nmW, brainLen, boltLen, pillW };
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
      shk.style.transform = 'translate(' + o.sh.x + 'px,' + o.sh.y + 'px)';
      mcut.style.transform = 'translate(' + (o.sh.x * 0.6).toFixed(2) + 'px,' + (o.sh.y * 0.6).toFixed(2) + 'px)';
      for (let i = 0; i < 2; i++) {
        const c = cards[i], q = o.cards[i], s = c.el.style;
        s.left = q.x + 'px'; s.top = q.y + 'px'; s.width = q.w + 'px'; s.height = q.h + 'px';
        s.opacity = q.o; s.transform = 'scale(' + q.s + ')'; s.zIndex = q.z;
        s.borderColor = 'color-mix(in srgb, #35ff6a ' + (q.act * 55).toFixed(1) + '%, #232931)';
        c.hd.style.top = q.hdTop + 'px'; c.hd.style.transform = 'scale(' + q.hs + ')';
        c.bd.style.top = q.bodyTop + 'px'; c.bd.style.height = q.bodyH + 'px'; c.bd.style.opacity = q.bo;
        if (q.date.n !== c.lastD) { c.lastD = q.date.n; c.dt.textContent = P.DATES[i].slice(0, q.date.n); }
        if (q.num.n !== c.last) { c.last = q.num.n; c.num.innerHTML = q.num.n + '<small>%</small>'; }
        c.num.style.opacity = q.num.o; c.num.style.transform = 'scale(' + q.num.s + ')';
        c.lab.style.opacity = q.lab.o; c.lab.style.transform = 'translateY(' + q.lab.y + 'px)';
      }
      motionApply(o.brain);
      brain.style.stroke = 'color-mix(in srgb, #35ff6a ' + (o.green * 100).toFixed(1) + '%, #d5dbd8)';
      brain.style.transform = 'scale(' + o.bpop + ')';
      bolt.style.stroke = 'color-mix(in srgb, #35ff6a ' + (o.bgreen * 100).toFixed(1) + '%, #d5dbd8)';
      bolt.style.transform = 'scale(' + o.bolt + ')';
      for (let i = 0; i < spd.length; i++) {
        const q = o.speed[i];
        spd[i].setAttribute('opacity', q.o);
        spd[i].setAttribute('x1', q.x1); spd[i].setAttribute('y1', q.y1); spd[i].setAttribute('x2', q.x2); spd[i].setAttribute('y2', q.y2);
      }
      const d = o.div.div.attr;
      divp.setAttribute('stroke-dasharray', d['stroke-dasharray']); divp.setAttribute('stroke-dashoffset', d['stroke-dashoffset']);
      divp.setAttribute('opacity', d.opacity === '1' ? o.div.o : 0);
      hv.style.opacity = o.hv.o; hv.style.transform = 'translate(' + o.hv.x + 'px,' + o.hv.y + 'px) scale(' + o.hv.sx + ',' + o.hv.sy + ')';
      lt.style.opacity = o.lt.o; lt.style.transform = 'translate(' + o.lt.x + 'px,' + o.lt.y + 'px) rotate(' + o.lt.r + 'deg)';
      logo.style.opacity = o.logo.o; logo.style.transform = 'rotate(' + o.logo.r + 'deg) scale(' + o.logo.s + ')';
      sb.style.display = o.main ? 'block' : 'none';
      sb.style.transform = 'translateY(' + o.bub.dy + 'px)';
      for (let i = 0; i < 2; i++) { dots[i].style.opacity = o.bub.dots[i].o; dots[i].style.transform = 'scale(' + o.bub.dots[i].s + ')'; }
      pill.style.opacity = o.bub.pill.o; pill.style.transform = 'scale(' + o.bub.pill.s + ')';
      by.style.opacity = o.by.o;
      if (o.by.n !== lastBy) { lastBy = o.by.n; byt.textContent = P.BYLINE.slice(0, o.by.n); }
      caret.style.opacity = o.by.caret;
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
      if (req.url.split('?')[0] === '/logo.png') { res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(LOGO_FILE)); }
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

console.log('\npost42, two new claude models. ' + SECONDS + 's, ' + FPS + 'fps.');
for (const T of TAKES) console.log('    line ' + (T.i + 1) + ', one take, ' + (T.edge.end - T.edge.start).toFixed(2) + 's, stops ' + (T.gaps.map(g => Math.round(g * 1000) + 'ms').join(' ') || 'none'));
for (const [t, what] of [[SLAM[0], 's1, opus slams'], [SLAM[1], 'sonnet slams'], [T1.at, 'the voice'], [POP.at, 'he pops in'], [SAY, 'the bubble, claude code'], [BUB_GONE, 'the bubble is gone'],
  [S2, 's2, opus to the centre'], [BRAIN_AT, 'the brain draws'], [TOP, 'it goes green'], [COUNT[0].at, '40% counts'],
  [S3, 's3, sonnet zooms'], [BOLT_AT, 'the bolt draws'], [COUNT[1].at, '30% counts'], [CHEAP, 'the tick on cheaper'],
  [S4, 's4, the split'], [HEAVY.land, 'hard job lands'], [LIGHT.land, 'daily task lands'], [NOD, 'the nod'],
  [S5, 's5, the fade'], [FACT, 'the happy arc'], [BY, 'the byline'], [LOGO_AT, 'the mark pops in'], [SQUINT, 'the squint'], [CUT, 'the end card'], [SECONDS, 'the end']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
/* ---------- the bus: five reads, to -14 ---------- */
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
const WAV = path.join(OUT, 'post42-mix.wav'), RAW = path.join(OUT, 'post42-mix-raw.wav');
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
  for (const q of ['400 40px "Michroma"', '400 19px "Space Grotesk"', '500 19px "Space Grotesk"', BUB.weight + ' ' + BUB.size + 'px "Nunito"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  LAY = await page.evaluate(() => window.__built);
  BRAIN = BRAIN_D.map((d, i) => ({ id: 'br' + i, shape: { d, len: LAY.brainLen[i] }, t0: +(BRAIN_AT + i * 0.10).toFixed(4), dur: 0.46 }))
    .concat(BOLT_D.map((d, i) => ({ id: 'bo' + i, shape: { d, len: LAY.boltLen[i] }, t0: BOLT_AT, dur: 0.40 })));

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__p42.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p42.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the margin and the app zone, for every piece of text, the cards and him.
     the slams are skipped: a card coming in from 1.4x crosses the margin for a
     tenth of a second on the way down, and the blocks count once they land. */
  const fails = [];
  const SB = { l: MARGIN, t: MARGIN, r: VW - MARGIN, b: VH - APP_ZONE };
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    await put(t, Math.round(t * FPS));
    const TEXT = ['#subt', '#m-card', '#by', '#sb-p', '#sb-d0', '#sb-d1', '#num0', '#num1', '#lab0', '#lab1'];
    if (t > SLAM[1] + 0.4) TEXT.push('#c0', '#c1', '#c0 .nm', '#c1 .nm');
    if (t > HEAVY.land) TEXT.push('#hv');
    if (t > LIGHT.land + 0.4) TEXT.push('#lt');
    for (const sel of TEXT) {
      const r = await page.evaluate(s => window.__p42.rect(s), sel);
      if (!r || !r.w) continue;
      if (r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || r.b > SB.b + 0.5) fails.push(sel + ' past the margin at ' + t.toFixed(1) + 's: ' + [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / '));
    }
    const m = await page.evaluate(() => window.__p42.rect('#m-card'));
    if (m && m.b > ST.top - 4) fails.push('he reaches the subtitles at ' + t.toFixed(1) + 's');
    for (const c of ['#c0', '#c1']) {
      const r = await page.evaluate(s => window.__p42.rect(s), c);
      if (r && m && t < S5 && r.b > m.t + 2 && r.r > m.l && r.l < m.r) fails.push(c + ' is on him at ' + t.toFixed(1) + 's');
    }
    /* the bubble clears the cards and his head */
    const bp = await page.evaluate(() => window.__p42.rect('#sb-p'));
    if (bp) {
      for (const c of ['#c0', '#c1']) { const r = await page.evaluate(s => window.__p42.rect(s), c); if (r && bp.t < r.b + 2 && bp.r > r.l && bp.l < r.r) fails.push('the bubble is on ' + c + ' at ' + t.toFixed(1) + 's'); }
      if (m && bp.b > m.t + 2) fails.push('the bubble is on his head at ' + t.toFixed(1) + 's');
    }
    const by = await page.evaluate(() => window.__p42.rect('#by'));
    if (by && by.w && m && by.b > m.t - 4) fails.push('the byline is on him at ' + t.toFixed(1) + 's');
  }
  /* the numbers fit their card */
  for (const [i, sel] of [[0, '#num0'], [1, '#num1']]) {
    await put(COUNT[i].at + 1.2, 0);
    const n = await page.evaluate(s => window.__p42.rect(s), sel), c = await page.evaluate(s => window.__p42.rect(s), '#c' + i);
    if (n && c && (n.l < c.l + 8 || n.r > c.r - 8 || n.b > c.b - 6)) fails.push(sel + ' runs out of its card');
    const lb = await page.evaluate(s => window.__p42.rect(s), '#lab' + i);
    if (lb && c && lb.b > c.b - 8) fails.push('the label under ' + sel + ' runs out of its card');
  }
  if (LAY.nmW.some(w => w > CW - 16)) fails.push('a model name is wider than its card');
  /* the mark: the file, square, at its size, and its sweep clear of the margin and the byline */
  {
    const L = await page.evaluate(() => { const e = document.getElementById('logo'); return { ok: e.complete, nw: e.naturalWidth, nh: e.naturalHeight, w: e.offsetWidth }; });
    if (!L.ok || !L.nw) fails.push('the mark did not load');
    if (L.nw !== L.nh) fails.push('the mark is not square, it would stretch');
    if (Math.abs(L.w - LOGO.size) > 0.5) fails.push('the mark drew ' + L.w + ' css wide, not ' + LOGO.size);
    if (LOGO.cy - LOGO_REACH < MARGIN) fails.push('the mark sweeps into the top margin');
    if (LOGO.cy + LOGO_REACH > BYL.y - 4) fails.push('the mark sweeps into the byline');
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p42.rect('#wm'));
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
const FILE = path.join(OUT, 'post42-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
for (let i = 0; i < 2; i++) {
  const got = loudness(ffmpeg, FILE);
  if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
  const fixed = path.join(OUT, 'post42-mix-fix.wav'), tmp = path.join(OUT, 'post42-tmp.mp4');
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
/* something new every 2 to 4 seconds: the beats, and the gaps between them */
{
  const beats = [SLAM[0], SLAM[1], POP.at, SAY, BUB_GONE, ...LOOKS.slice(1, 5).map(l => l.at), S2, BRAIN_AT, TOP, COUNT[0].at, COUNT[0].lab, S3, BOLT_AT, COUNT[1].at, CHEAP, S4, HEAVY.at, HEAVY.land, LIGHT.at, LIGHT.land, NOD, S5, FACT, BY, LOGO_AT, SQUINT, CUT].sort((a, b) => a - b);
  for (let i = 0; i + 1 < beats.length; i++) if (beats[i + 1] - beats[i] > 4) fail.push('nothing new from ' + beats[i].toFixed(2) + ' to ' + beats[i + 1].toFixed(2));
}
const lu = loudness(ffmpeg, FILE);
if (!lu || !lu.ok) fail.push('the loudness could not be measured');
else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fail.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
console.log('\n  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
console.log('  ' + state.glitched + ' glitched frames, sheets in ' + path.relative(ROOT, VERIFY));
console.log('  length ' + seconds.toFixed(2) + 's, five reads on the bus, ' + path.relative(ROOT, FILE));
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('  guards: all green');
