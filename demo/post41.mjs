/* the boring tek — post41. the boring tek news.

   dark only, 1080x1920, about twenty seconds, for the telegram channel. five
   lines on the elevenlabs narrator, every sentence its own take with a 300ms
   stop between them, post40's way. the voice never stops: no line starts more
   than GAP after the one before. no music: einz adds it.

     s1  the channel   the phone springs in, the screen slides onto the
                       channel, he pops in happy beside it, the beta badge
                       pops on the read.
     s2  four posts    SHOP, CAFE, SALON, OFFICE arrive one by one on their
                       own words, each with a soft bounce, a label, one line,
                       a time and a views count. he looks at each new one.
     s3  no spam       a wave of grey spam flies at the phone and bounces off
                       its edge, he smiles. then a big counter card, max 3 a
                       day, counts to 3 on `three`.
     s4  better        the card goes, the badge pulses on `testing` and flips
                       into better every week on `better`, one happy bounce.
     s5  join          a big join button rises out of the bottom bar with
                       @boringtek under it, pressed with a soft pulse on
                       `telegram`, post39's glitch, the end card.

   no hands, no telegram logo. the rig, the gaze, the glitch and the end card
   are post40's. the springs are the kit's. the eye glyph is tabler outline.
   his eyes are calm or happy, never anything else: the happy arcs are written
   here and each lasts 0.55s at most, and a guard says so.

     DEMO_FPS=12 node post41.mjs         the preview
     node post41.mjs                     60fps
     node post41.mjs --keep-frames       leave the jpegs on disk

     demo/out/post41-dark-1080x1920.mp4
     demo/out/verify-post41/contact.png, phone.png    the critique sheets
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
import { EASE as K, INK } from './lib/motion.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post41');
const VERIFY = path.join(OUT, 'verify-post41');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const MARGIN = 120 / DSF;
const APP_ZONE = 300 / DSF;
const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');

/* the channel avatar is the site's own mark: assets/mascot.svg, the same
   drawing as index.html's favicon, served as a file and never redrawn */
const LOGO = path.join(ROOT, 'assets', 'mascot.svg');
if (!fs.existsSync(LOGO)) { console.error('\nSTOPPED. assets/mascot.svg is missing.'); process.exit(1); }
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
const CHANNEL = 'THE BORING TEK NEWS';
const SUBS_LINE = 'early subscribers';
const BADGE = ['beta', 'better every week'];
/* the channel's own post types. `on` is the word in the read it lands on */
const POSTS = [
  { label: 'NEW', text: 'an ai model now reads photos of receipts', sub: 'for your business, less typing for your bookkeeping', on: [1, 'couple'], time: '9am', views: '318' },
  { label: 'NEW IN AI', text: 'one new tool worth a look this week', on: [1, 'important'], time: '1pm', views: '296' },
  { label: 'PROMPT OF THE WEEK', text: 'copy it, paste it, save an hour', on: [2, 'every'], time: '6pm', views: '274' },
  { label: 'AI SCAM ALERT', text: 'fake voice calls pretending to be your bank', on: [2, 'useful'], time: '9am', views: '41' },
];
const CAP = 'max 3 a day';
const JOIN = 'join', HANDLE = '@boringtek';
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };

/* ==========================================================================
   the read: five lines, the narrator, a take per sentence, 300ms stops.
   ========================================================================== */
const VOICE = 'calm';
const BREAK_MS = 300;
/* the voice at its plain speed, no rushing */
const SPEED = 1.0;
const LINES = [
  { key: 'r1', text: 'ai news moves fast. we made a telegram channel that keeps it simple.' },
  { key: 'r2', text: 'a couple of posts a day, only the most important ai news, in plain words.' },
  { key: 'r3', text: 'every post says what it means for your business. maybe you find something useful, at least you stay informed.' },
  { key: 'r4', text: 'no spam, we promise. max three posts a day.' },
  { key: 'r5', text: 'we are testing, and it gets better every week.' },
  { key: 'r6', text: 'join the boring tek news on telegram. all our socials are on our website.' },
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
/* post40's take(): one take a sentence, laid end to end with exactly BREAK_MS
   between one's last sound and the next one's first */
async function take(i) {
  const parts = LINES[i].text.split(/(?<=[.!?])\s+/);
  const got = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post41-' + LINES[i].key + (parts.length > 1 ? 's' + (k + 1) : '');
    const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
    const want = parts[k].replace(/\s+/g, ' ').trim();
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
    got.push(g);
  }
  const pcms = got.map(g => decode(ffmpeg, g.file));
  const edges = pcms.map(audioEdges);
  const off = [];
  let total = 0;
  for (let k = 0; k < got.length; k++) {
    off.push(k === 0 ? 0 : +(off[k - 1] + edges[k - 1].end + BREAK_MS / 1000 - edges[k].start).toFixed(4));
    total = Math.max(total, off[k] + pcms[k].length / SR);
  }
  const pcm = new Float32Array(Math.ceil(total * SR));
  for (let k = 0; k < got.length; k++) {
    const at = Math.round(off[k] * SR);
    const a = Math.max(0, Math.round((edges[k].start - PRE) * SR)), b = Math.min(pcms[k].length, Math.round((edges[k].end + POST) * SR));
    for (let j = a; j < b; j++) { const q = at + j; if (q < pcm.length) pcm[q] += pcms[k][j]; }
  }
  const words = [];
  for (let k = 0; k < got.length; k++) for (const w of got[k].words) words.push({ word: w.word, start: +(w.start + off[k]).toFixed(4), end: +(w.end + off[k]).toFixed(4), s: k });
  return { i, pcm, words, edge: { start: edges[0].start, end: +(off[got.length - 1] + edges[got.length - 1].end).toFixed(4) }, sentences: got.length,
    gaps: got.slice(1).map((_, k) => +(off[k + 1] + edges[k + 1].start - off[k] - edges[k].end).toFixed(4)) };
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
place(T1, 0.50);
after(T1, T2); after(T2, T3); after(T3, T4); after(T4, T5); after(T5, T6);
const PHONE_IN = { at: 0.08, for: 0.55 };
const SCREEN_IN = { at: 0.34, for: 0.45 };
const POP = { at: 0.36, for: 0.55 };
const BADGE_POP = +(wAt(T1, 'simple') - 0.04).toFixed(4);
/* `ai moves fast`: grey news races up the feed, and stops dead on `we` */
const RUSH = { at: +(T1.at - 0.05).toFixed(4), stop: +(wAt(T1, 'we') - 0.06).toFixed(4), n: 14, speed: 820 };
/* the posts land on their own `your` */
for (const p of POSTS) p.at = +(wAt(TAKES[p.on[0]], p.on[1]) - 0.08).toFixed(4);
/* s3's `for your business` lights the first post's own business line */
const BIZ = +(wAt(T3, 'business', word(T3, 'means')) - 0.30).toFixed(4);
/* s3: the spam lands on `spam`, the card pops on `max`, counts to 3 on `three` */
const SPAM_HIT = +(wAt(T4, 'spam') + 0.02).toFixed(4);
const CARD = { at: +(wAt(T4, 'max') - 0.06).toFixed(4), three: +(wAt(T4, 'three') - 0.02).toFixed(4), out: +(T5.at - 0.12).toFixed(4) };
/* s4: a pulse on `testing`, the flip on `better` */
const PULSE = +(wAt(T5, 'testing') - 0.02).toFixed(4);
const FLIP = { at: +(wAt(T5, 'better') - 0.10).toFixed(4), half: 0.13, back: 0.34 };
/* s5: the bar grows on `join`, the press on `telegram`, the cut on `all` */
const BAR = { at: +(T6.at - 0.10).toFixed(4), for: 0.55 };
const PRESS = +(wAt(T6, 'telegram') - 0.02).toFixed(4);
const CUT = +(wAt(T6, 'all') - 0.04).toFixed(4);
const END_HOLD = 0.60;
const SECONDS = +(T6.end + END_HOLD).toFixed(4);

/* ---------- where everything sits, in css px of the 540x960 stage ---------- */
const PH = { l: 63, t: 92, w: 296, h: 652, rad: 38, bez: 7 };
const SCR = { l: PH.l + PH.bez, t: PH.t + PH.bez, w: PH.w - 2 * PH.bez, h: PH.h - 2 * PH.bez, rad: PH.rad - PH.bez };
const HDR = { h: 80, av: 40, back: 28 };
const BARH = { from: 58, to: 116 };
const FEED = { t: HDR.h, pad: 12 };
const POSTW = 238, POSTF = 19;
/* he sits beside the phone, planned at the rig's 118 and drawn smaller */
const SIZE = 118, SMALL = 0.86;
const HOME = { cx: 421, cy: 452 };
const BOX = { left: +(HOME.cx - SIZE / 2).toFixed(2), top: +(HOME.cy - SIZE / 2).toFixed(2), size: SIZE };
const ST = { size: 21, weight: 500, top: 770, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 5 };

/* ---------- the subtitles: the whole read ---------- */
const SUBTITLES = [
  { line: 0, text: 'ai news moves fast' },
  { line: 0, text: 'we made a telegram channel' },
  { line: 0, text: 'that keeps it simple' },
  { line: 1, text: 'a couple of posts a day' },
  { line: 1, text: 'only the most important ai news' },
  { line: 1, text: 'in plain words' },
  { line: 2, text: 'every post says what it means' },
  { line: 2, text: 'for your business' },
  { line: 2, text: 'maybe you find something useful' },
  { line: 2, text: 'at least you stay informed' },
  { line: 3, text: 'no spam, we promise' },
  { line: 3, text: 'max three posts a day' },
  { line: 4, text: 'we are testing' },
  { line: 4, text: 'and it gets better every week' },
  { line: 5, text: 'join the boring tek news' },
  { line: 5, text: 'on telegram' },
  { line: 5, text: 'all our socials' },
  { line: 5, text: 'are on our website' },
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
for (const s of [CHANNEL, SUBS_LINE, ...BADGE, ...POSTS.flatMap(p => [p.label, p.text, p.sub || '', p.time, p.views]), CAP, JOIN, HANDLE, ...WM.lines, ...SUBTITLES.map(c => c.text)]) {
  if (/[-\u2010-\u2015:'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, colon, apostrophe or quote on screen: ' + s);
}

/* ---------- the spam wave ---------- */
/* each flies from off frame at a point on the phone's edge, lands on `spam`,
   and bounces back out spinning and fading. none flies at him. */
const SPAM = (() => {
  const r = prng(0x5a4d);
  const out = [];
  const edges = [
    { side: 'l', y: 190 }, { side: 'l', y: 290 }, { side: 'l', y: 390 }, { side: 'l', y: 490 }, { side: 'l', y: 590 }, { side: 'l', y: 690 },
    { side: 't', x: 130 }, { side: 't', x: 230 }, { side: 't', x: 320 },
    { side: 'r', y: 190 }, { side: 'r', y: 300 }, { side: 'r', y: 620 }, { side: 'r', y: 710 },
  ];
  edges.forEach((e, i) => {
    const w = 124 + Math.round(r() * 50), h = 46 + Math.round(r() * 10);
    let c, from, dir;
    if (e.side === 'l') { c = { x: PH.l - w / 2, y: e.y }; from = { x: -w / 2 - 10, y: e.y + (r() * 2 - 1) * 90 }; }
    else if (e.side === 'r') { c = { x: PH.l + PH.w + w / 2, y: e.y }; from = { x: VW + w / 2 + 10, y: e.y + (r() * 2 - 1) * 80 }; }
    else { c = { x: e.x, y: PH.t - h / 2 }; from = { x: e.x + (r() * 2 - 1) * 120, y: -h / 2 - 10 }; }
    /* out is the way in, reflected off the edge's normal, and slower */
    const vx = c.x - from.x, vy = c.y - from.y, L = Math.hypot(vx, vy);
    dir = e.side === 't' ? { x: vx / L, y: -vy / L } : { x: -vx / L, y: vy / L };
    out.push({ i, side: e.side, w, h, from, c, out: { x: dir.x * 300, y: dir.y * 300 }, hit: +(SPAM_HIT + (i % 6) * 0.07 + (r() * 0.06)).toFixed(4), fly: 0.42, spin: (r() * 2 - 1) * 70, rot0: (r() * 2 - 1) * 10 });
  });
  return out;
})();
function spamAt(q, t) {
  const a = q.hit - q.fly;
  if (t < a) return { o: 0, x: q.from.x, y: q.from.y, r: 0, sx: 1 };
  if (t < q.hit) {
    const k = EIN(span(t, a, q.hit));
    return { o: 1, x: lerp(q.from.x, q.c.x, k), y: lerp(q.from.y, q.c.y, k), r: q.rot0, sx: 1 };
  }
  const p = span(t, q.hit, q.hit + 0.85), k = EASE(p);
  const sq = 1 - 0.18 * (1 - smooth(span(t, q.hit, q.hit + 0.08)));
  return { o: +(1 - smooth(span(p, 0.35, 1))).toFixed(3), x: q.c.x + q.out.x * k, y: q.c.y + q.out.y * k + 70 * p * p, r: q.rot0 + q.spin * k, sx: +sq.toFixed(4) };
}
const flashAt = t => Math.max(0, ...SPAM.map(q => bump(t, q.hit - 0.02, 0.04, 0.10, 0.36)));

/* ---------- the feed: layout is measured in the page ---------- */
let LAY = null;
function barAt(t) { return lerp(BARH.from, BARH.to, SPRING(span(t, BAR.at, BAR.at + BAR.for))); }
function scrollAt(t) {
  let s = 0;
  const feedH = h => SCR.h - HDR.h - h;
  for (let k = 0; k < POSTS.length; k++) {
    if (t < POSTS[k].at) break;
    const want = Math.max(0, LAY.top[k] + LAY.h[k] + FEED.pad - feedH(BARH.from));
    s = lerp(s, want, EASE(span(t, POSTS[k].at, POSTS[k].at + 0.40)));
  }
  const last = POSTS.length - 1;
  const wantBar = Math.max(0, LAY.top[last] + LAY.h[last] + FEED.pad - feedH(BARH.to));
  return lerp(s, Math.max(s, wantBar), EASE(span(t, BAR.at, BAR.at + BAR.for * 0.8)));
}

/* ---------- where he is, how he feels, where he looks ---------- */
const SEED = 7;
const plan = planMascot({ hands: false, seconds: 30, theme: 'dark', size: SIZE, bias: 0, seed: SEED, marks: [{ t: 0.0, state: 'neutral' }] });
plan.box = { ...BOX };
/* the happy moments: a hop and the arcs, each arc 0.55s at most */
const HOPS = [
  { at: POP.at + 0.30, h: 10 },
  { at: SPAM_HIT + 0.30, h: 8 },
  { at: FLIP.at + 0.05, h: 17 },
  { at: PRESS + 0.02, h: 9 },
];
const ARCS = [
  { at: POP.at + 0.22, up: 0.09, hold: 0.28, down: 0.14 },
  { at: SPAM_HIT + 0.26, up: 0.09, hold: 0.30, down: 0.14 },
  { at: FLIP.at + 0.03, up: 0.09, hold: 0.30, down: 0.14 },
  { at: PRESS + 0.00, up: 0.09, hold: 0.30, down: 0.14 },
];
const arcAt = t => Math.max(0, ...ARCS.map(a => bump(t, a.at, a.up, a.hold, a.down)));
/* the small nod as each post lands, his eyes going to it */
const NODS = POSTS.map(p => p.at + 0.10);
function placeAt(t) {
  const s = SMALL * SPRING(span(t, POP.at, POP.at + POP.for));
  const live = smooth(span(t, POP.at + 0.5, POP.at + 1.2));
  let dy = live * 3.4 * Math.sin(2 * Math.PI * (t - POP.at) / 2.6);
  for (const h of HOPS) dy -= h.h * Math.sin(Math.PI * EASE(span(t, h.at, h.at + 0.42)));
  for (const n of NODS) dy += 4 * Math.sin(Math.PI * span(t, n, n + 0.30));
  return { dx: 0, dy: +dy.toFixed(3), s: +Math.max(0.001, s).toFixed(5) };
}
/* the vertical look is held small: looking up slides the eye under its own
   lid, and the phone is mostly above his eyes */
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
/* the things he looks at, in order, each eased in from the last */
const feedY = y => SCR.t + FEED.t + y;
const postPt = k => t => ({ x: SCR.l + 12 + POSTW * 0.55, y: feedY(LAY.top[k] + LAY.h[k] / 2 - scrollAt(t)) });
function looks() {
  const L = [
    { at: 0, f: () => ({ x: HOME.cx, y: HOME.cy }), w: 0 },
    { at: POP.at + 0.55, f: () => ({ x: SCR.l + 150, y: SCR.t + 300 }) },
    { at: RUSH.stop, f: () => ({ x: SCR.l + 150, y: SCR.t + 40 }) },
    { at: BADGE_POP, f: () => ({ x: LAY.badge.x, y: LAY.badge.y }) },
  ];
  POSTS.forEach((p, k) => L.push({ at: p.at, f: postPt(k) }));
  L.push({ at: BIZ, f: t => ({ x: SCR.l + 12 + POSTW * 0.5, y: feedY(LAY.top[0] + LAY.h[0] * 0.62 - scrollAt(t)) }) });
  L.sort((a, b) => a.at - b.at);
  L.push({ at: SPAM_HIT - 0.1, f: () => ({ x: PH.l + 40, y: 420 }) });
  L.push({ at: CARD.at, f: () => ({ x: SCR.l + SCR.w / 2, y: LAY.card.y }) });
  L.push({ at: PULSE, f: () => ({ x: LAY.badge.x, y: LAY.badge.y }) });
  L.push({ at: BAR.at + 0.1, f: () => ({ x: SCR.l + SCR.w / 2, y: SCR.t + SCR.h - BARH.to / 2 }) });
  return L;
}
let LOOKS = null;
function lookAt(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const cur = LOOKS[i], p = cur.f(t);
  const k = i > 0 ? smooth(span(t, cur.at, cur.at + 0.28)) : 1;
  const q = i > 0 ? LOOKS[i - 1].f(t) : p;
  const w = i === 0 ? 0 : i === 1 ? smooth(span(t, cur.at, cur.at + 0.3)) : 1;
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
/* the lids, all written: calm, a few blinks, none inside an arc */
const CALM = 0.04;
const BLINKS = [];
for (let at = 2.1; at < CUT - 0.5; at += 3.1) { let a = at; while (ARCS.some(x => a + 0.3 > x.at && a < x.at + x.up + x.hold + x.down + 0.1)) a += 0.2; BLINKS.push({ at: +a.toFixed(3), close: 0.07, hold: 0.03, open: 0.12 }); }
function lidAt(t) {
  let v = CALM;
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
    /* delighted's arcs: shorter, wider, a hair lower, lids up */
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

/* ---------- what one frame is ---------- */
function frameAt(t, f) {
  const ph = span(t, PHONE_IN.at, PHONE_IN.at + PHONE_IN.for);
  const sc = span(t, SCREEN_IN.at, SCREEN_IN.at + SCREEN_IN.for);
  const bp = span(t, BADGE_POP, BADGE_POP + 0.45);
  const fl = t < FLIP.at ? 0 : t < FLIP.at + FLIP.half ? 90 * EIN(span(t, FLIP.at, FLIP.at + FLIP.half)) : 90 * (1 - SPRING(span(t, FLIP.at + FLIP.half, FLIP.at + FLIP.half + FLIP.back)));
  const flipped = t >= FLIP.at + FLIP.half;
  const cardIn = span(t, CARD.at, CARD.at + 0.45), cardOut = span(t, CARD.out, CARD.out + 0.28);
  const n = t < CARD.at + 0.05 ? 0 : t < CARD.three - 0.26 ? 1 : t < CARD.three ? 2 : 3;
  const tick = Math.max(...[CARD.at + 0.05, CARD.three - 0.26, CARD.three].map(a => (t >= a ? 1 - EASE(span(t, a, a + 0.28)) : 0)));
  const bIn = span(t, BAR.at + 0.12, BAR.at + 0.12 + 0.5);
  const press = t < PRESS ? 0 : t < PRESS + 0.09 ? EASE(span(t, PRESS, PRESS + 0.09)) : 1 - SPRING(span(t, PRESS + 0.09, PRESS + 0.45));
  const pulse = span(t, PRESS + 0.03, PRESS + 0.75);
  return {
    t: +t.toFixed(4), f, main: t < CUT ? 1 : 0,
    phone: { o: +span(t, PHONE_IN.at, PHONE_IN.at + 0.10).toFixed(3), s: +lerp(0.86, 1, SPRING(ph)).toFixed(5), y: +(30 * (1 - EASE(ph))).toFixed(2), flash: +flashAt(t).toFixed(3) },
    screen: { o: +span(t, SCREEN_IN.at, SCREEN_IN.at + 0.14).toFixed(3), x: +(46 * (1 - EASE(sc))).toFixed(2) },
    badge: { o: +span(t, BADGE_POP, BADGE_POP + 0.06).toFixed(3), s: +(lerp(0.4, 1, SPRING(bp)) * (1 + 0.16 * Math.sin(Math.PI * span(t, FLIP.at, FLIP.at + FLIP.half + FLIP.back)))).toFixed(4),
      rx: +fl.toFixed(2), face: flipped ? 1 : 0, col: +EASE(span(t, FLIP.at - 0.05, FLIP.at + 0.32)).toFixed(4), ring: +span(t, PULSE, PULSE + 0.7).toFixed(4) },
    posts: POSTS.map(p => { const q = span(t, p.at, p.at + 0.50); return { o: +span(t, p.at, p.at + 0.08).toFixed(3), y: +(26 * (1 - SPRING(q))).toFixed(2), s: +lerp(0.90, 1, SPRING(q)).toFixed(4) }; }),
    scroll: +scrollAt(t).toFixed(3),
    biz: +bump(t, BIZ, 0.18, 1.1, 0.5).toFixed(3),
    /* it stops dead on `we`, sits dimmed, and clears on `simple` */
    rush: { y: +(-RUSH.speed * Math.max(0, Math.min(t, RUSH.stop) - RUSH.at) + 30 * EIN(span(t, BADGE_POP - 0.05, BADGE_POP + 0.25))).toFixed(2),
      o: +(span(t, RUSH.at, RUSH.at + 0.1) * lerp(1, 0.45, EASE(span(t, RUSH.stop, RUSH.stop + 0.3))) * (1 - span(t, BADGE_POP - 0.05, BADGE_POP + 0.25))).toFixed(3) },
    dim: +(1 - 0.72 * EASE(cardIn) * (1 - EASE(cardOut))).toFixed(4),
    card: { o: +(span(t, CARD.at, CARD.at + 0.08) * (1 - cardOut)).toFixed(3), s: +(lerp(0.7, 1, SPRING(cardIn)) * lerp(1, 0.9, EASE(cardOut))).toFixed(4), n, tick: +(1 + 0.14 * tick).toFixed(4) },
    spam: SPAM.map(q => { const s = spamAt(q, t); return { o: s.o, x: +s.x.toFixed(2), y: +s.y.toFixed(2), r: +s.r.toFixed(2), sx: s.sx }; }),
    bar: +barAt(t).toFixed(3),
    btn: { o: +span(t, BAR.at + 0.12, BAR.at + 0.2).toFixed(3), y: +(40 * (1 - SPRING(bIn))).toFixed(2), s: +(1 - 0.06 * press).toFixed(4), glow: +press.toFixed(3),
      ring: pulse > 0 && pulse < 1 ? { o: +(0.7 * (1 - pulse)).toFixed(3), s: +(1 + 0.22 * EASE(pulse)).toFixed(4) } : { o: 0, s: 1 } },
    handle: { o: +span(t, BAR.at + 0.30, BAR.at + 0.45).toFixed(3) },
    subt: subAt(t),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
const EYE_ICON = ['M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0', 'M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6'];
/* telegram's dark palette, pulled toward our near black */
const TG = { bg: '#0c131b', head: '#141e28', bubble: '#17232f', line: '#223140', meta: '#6f8394', text: '#eef2f0' };
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  const eye = '<svg class="eye" viewBox="0 0 24 24" aria-hidden="true">' + EYE_ICON.map(d => '<path d="' + d + '"/>').join('') + '</svg>';
  const fwd = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14l4 -4l-4 -4"/><path d="M19 10h-11a4 4 0 1 0 0 8h1"/></svg>';
  const posts = POSTS.map((p, i) => '<div class="row" id="p' + i + '"><div class="post"><div class="lb">' + p.label + '</div><div class="tx">' + p.text + '</div>'
    + (p.sub ? '<div class="tx sub" id="biz' + i + '">' + p.sub + '</div>' : '')
    + '<div class="meta">' + eye + '<span>' + p.views + '</span><span class="tm">' + p.time + '</span></div></div><div class="fw">' + fwd + '</div></div>').join('');
  /* the avatar is the mascot's own face, small: a dark plate and two eyes */
  const avatar = '<svg class="bk" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6l6 6"/></svg><img class="av" id="av" alt="" src="/logo.svg">';
  const rr = prng(0x7a11);
  const rush = Array.from({ length: RUSH.n }, () => { const w = 150 + Math.round(rr() * (POSTW - 150)), h = 56 + Math.round(rr() * 40); return '<div class="ru" style="width:' + w + 'px;height:' + h + 'px"><i style="width:28%"></i><i style="width:' + (60 + Math.round(rr() * 30)) + '%"></i><i style="width:' + (30 + Math.round(rr() * 40)) + '%"></i></div>'; }).join('');
  const spam = SPAM.map(q => '<div class="sp" id="sp' + q.i + '" style="width:' + q.w + 'px;height:' + q.h + 'px;margin:' + (-q.h / 2) + 'px 0 0 ' + (-q.w / 2) + 'px"><i style="width:' + Math.round(q.w * 0.62) + 'px"></i><i style="width:' + Math.round(q.w * 0.38) + 'px"></i></div>').join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post41</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">
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
  background:radial-gradient(ellipse 80% 60% at 40% 42%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 50%,rgba(0,0,0,0) 74%)}
#main{position:absolute;inset:0}

/* ---- the phone ---- */
#phone{position:absolute;left:${PH.l}px;top:${PH.t}px;width:${PH.w}px;height:${PH.h}px;border-radius:${PH.rad}px;background:#15181d;
  border:1.5px solid #2c3139;transform-origin:50% 55%;opacity:0;will-change:transform,opacity;z-index:2;
  box-shadow:0 0 0 1px rgba(0,0,0,.6) inset}
#flash{position:absolute;inset:-2px;border-radius:${PH.rad + 2}px;border:2px solid var(--acc);opacity:0;pointer-events:none}
#scr{position:absolute;left:${PH.bez}px;top:${PH.bez}px;width:${SCR.w}px;height:${SCR.h}px;border-radius:${SCR.rad}px;overflow:hidden;
  background:radial-gradient(circle at 1px 1px,rgba(120,150,170,.10) 1px,rgba(0,0,0,0) 1.6px) 0 0/18px 18px,${TG.bg}}
#scrc{position:absolute;inset:0;opacity:0;will-change:transform,opacity}
.hdr{position:absolute;left:0;right:0;top:0;height:${HDR.h}px;background:${TG.head};border-bottom:1px solid ${TG.line};z-index:3}
.bk{position:absolute;left:6px;top:${HDR.h - HDR.av / 2 - 10 - 12}px;width:24px;height:24px;fill:none;stroke:${TG.text};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.av{position:absolute;left:${HDR.back}px;top:${HDR.h - HDR.av - 10}px;width:${HDR.av}px;height:${HDR.av}px;display:block}
#ttl{position:absolute;left:${HDR.back + HDR.av + 10}px;top:${HDR.h - 50}px;font-family:var(--display);font-size:11px;letter-spacing:.01em;color:${TG.text};white-space:nowrap}
#row2{position:absolute;left:${HDR.back + HDR.av + 10}px;top:${HDR.h - 27}px;display:flex;align-items:center;white-space:nowrap}
#subs{display:inline-block;overflow:hidden;font-size:13.5px;font-weight:400;color:${TG.meta};padding-right:8px}
#badge{position:relative;display:inline-block;opacity:0;transform-origin:0 50%;will-change:transform,opacity;perspective:200px}
#bface{display:inline-block;transform-origin:50% 50%;padding:2px 8px 3px;border-radius:999px;background:rgba(53,255,106,.14);border:1px solid rgba(53,255,106,.55);
  color:var(--acc);font-size:13px;font-weight:700;letter-spacing:.03em}
#bring{position:absolute;inset:-1px;border-radius:999px;border:1.5px solid var(--acc);opacity:0}
#feed{position:absolute;left:0;right:0;top:${FEED.t}px;overflow:hidden}
#rush{position:absolute;left:12px;top:0;padding-top:${SCR.h}px;opacity:0;will-change:transform,opacity}
.ru{margin:0 0 10px;padding:12px 13px;border-radius:15px 15px 15px 5px;background:#1a242e;display:flex;flex-direction:column;justify-content:center;gap:7px}
.ru i{display:block;height:7px;border-radius:4px;background:#34424f}
.ru i:first-child{background:#2c5a3a}
#feedc{position:absolute;left:0;right:0;top:0;padding:${FEED.pad}px 0 0 12px;will-change:transform}
.row{display:flex;align-items:flex-end;gap:7px;margin:0 0 10px;opacity:0;transform-origin:0 100%;will-change:transform,opacity}
.post{width:${POSTW}px;padding:10px 13px 8px;background:${TG.bubble};border-radius:15px 15px 15px 5px}
.fw{flex:none;width:28px;height:28px;border-radius:50%;background:rgba(23,35,47,.9);display:flex;align-items:center;justify-content:center}
.fw svg{width:16px;height:16px;fill:none;stroke:${TG.meta};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tx.sub{margin-top:6px}
.lb{font-size:12.5px;font-weight:700;letter-spacing:.14em;color:var(--acc);margin:0 0 4px}
.tx{font-size:${POSTF}px;font-weight:400;line-height:1.28;color:${TG.text}}
.meta{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:5px;font-size:12px;color:${TG.meta}}
.meta .eye{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.meta .tm{margin-left:8px}
#card{position:absolute;left:24px;right:24px;top:0;padding:22px 0 26px;border-radius:22px;background:rgba(10,16,22,.94);border:1px solid #28402f;text-align:center;
  opacity:0;transform-origin:50% 50%;will-change:transform,opacity;z-index:4}
#num{display:inline-block;font-family:var(--display);font-size:104px;line-height:1.1;color:var(--acc);text-shadow:0 0 14px rgba(53,255,106,.30);transform-origin:50% 60%}
#cap{font-size:25px;font-weight:500;color:${TG.text};margin-top:4px}
#bar{position:absolute;left:0;right:0;bottom:0;background:${TG.head};border-top:1px solid ${TG.line};z-index:3}
#btnw{position:absolute;left:16px;right:16px;top:12px;opacity:0;will-change:transform,opacity}
#btn{position:relative;height:52px;border-radius:14px;background:var(--acc);display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-size:21px;letter-spacing:.10em;color:#06070a;transform-origin:50% 50%}
#bring2{position:absolute;inset:0;border-radius:14px;border:2px solid var(--acc);opacity:0;pointer-events:none}
#handle{margin-top:9px;text-align:center;font-size:17px;font-weight:500;color:${TG.text};opacity:0}
.sp{position:absolute;left:0;top:0;border-radius:13px 13px 13px 4px;background:#424851;border:1px solid #58606b;z-index:5;opacity:0;
  display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 12px;will-change:transform,opacity}
.sp i{display:block;height:7px;border-radius:4px;background:#6c737d}

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
.gl .r{filter:url(#p41-r)}
.gl .g{filter:url(#p41-g)}
.gl .b{filter:url(#p41-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${chan('p41-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p41-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p41-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
</defs></svg>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="main">
    <div id="phone"><div id="flash"></div>
      <div id="scr"><div id="scrc">
        <div class="hdr">${avatar}<div id="ttl">${CHANNEL}</div>
          <div id="row2"><span id="subs">${SUBS_LINE}</span><span id="badge"><span id="bface">${BADGE[0]}</span><span id="bring"></span></span></div>
        </div>
        <div id="feed"><div id="rush">${rush}</div><div id="feedc">${posts}</div>
          <div id="card"><div id="num">0</div><div id="cap">${CAP}</div></div>
        </div>
        <div id="bar"><div id="btnw"><div id="btn">${JOIN}<div id="bring2"></div></div><div id="handle">${HANDLE}</div></div></div>
      </div></div>
    </div>
    ${spam}
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
window.__P41 = ${JSON.stringify({ VW, VH, WM, SLICES: GL.slices, NP: POSTS.length, NS: SPAM.length, BADGE, SUBS: CARDS.map(c => c.text), SCR, HDR, BARH })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 19px "Space Grotesk"'), document.fonts.load('500 19px "Space Grotesk"'), document.fonts.load('700 12px "Space Grotesk"'), document.getElementById('av').decode()])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p41.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P41;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), main = $('main');
  const phone = $('phone'), flash = $('flash'), scrc = $('scrc');
  const subs = $('subs'), badge = $('badge'), bface = $('bface'), bring = $('bring');
  const feed = $('feed'), feedc = $('feedc'), rush = $('rush'), biz = $('biz0');
  const posts = []; for (let i = 0; i < P.NP; i++) posts.push($('p' + i));
  const spam = []; for (let i = 0; i < P.NS; i++) spam.push($('sp' + i));
  const card = $('card'), num = $('num');
  const bar = $('bar'), btnw = $('btnw'), btn = $('btn'), bring2 = $('bring2'), handle = $('handle');
  const mcut = $('mas-cut');
  const subt = $('subt');
  const wm = $('wm');
  const gl = $('gl');
  const chans = ['r', 'g', 'b'].map(k => $('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push($('sl' + i)); sliceImgs.push($('sl' + i + 'i')); }
  let lastSub = -2, lastFace = -1, lastN = -1;
  const setBar = h => { bar.style.height = h + 'px'; feed.style.height = (P.SCR.h - P.HDR.h - h) + 'px'; };
  window.__p41 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      /* laid out untransformed: the phone at rest, every post in place */
      const keep = [phone.style.transform, scrc.style.transform];
      phone.style.transform = 'none'; scrc.style.transform = 'none';
      setBar(P.BARH.from);
      const base = feedc.getBoundingClientRect().top;
      const top = posts.map(p => p.getBoundingClientRect().top - base), h = posts.map(p => p.getBoundingClientRect().height);
      const b = badge.getBoundingClientRect();
      const subsW = subs.getBoundingClientRect().width;
      /* the card sits in the middle of the feed */
      const fh = P.SCR.h - P.HDR.h - P.BARH.from;
      card.style.top = ((fh - card.getBoundingClientRect().height) / 2).toFixed(1) + 'px';
      const c = card.getBoundingClientRect();
      bface.textContent = P.BADGE[1]; subs.style.width = '0px';
      const wide = badge.getBoundingClientRect();
      bface.textContent = P.BADGE[0]; subs.style.width = '';
      window.__subsW = subsW;
      phone.style.transform = keep[0]; scrc.style.transform = keep[1];
      return { top, h, badge: { x: b.left + b.width / 2, y: b.top + b.height / 2, r: wide.right }, card: { y: c.top + c.height / 2 } };
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
      phone.style.opacity = o.phone.o; phone.style.transform = 'translateY(' + o.phone.y + 'px) scale(' + o.phone.s + ')';
      flash.style.opacity = o.phone.flash;
      scrc.style.opacity = o.screen.o; scrc.style.transform = 'translateX(' + o.screen.x + 'px)';
      badge.style.opacity = o.badge.o; badge.style.transform = 'scale(' + o.badge.s + ')';
      bface.style.transform = 'rotateX(' + o.badge.rx + 'deg)';
      subs.style.width = o.badge.col > 0 ? (window.__subsW * (1 - o.badge.col)).toFixed(2) + 'px' : '';
      subs.style.opacity = (1 - o.badge.col).toFixed(3);
      if (o.badge.face !== lastFace) { lastFace = o.badge.face; bface.textContent = P.BADGE[o.badge.face]; }
      const rp = o.badge.ring;
      bring.style.opacity = rp > 0 && rp < 1 ? (0.8 * (1 - rp)).toFixed(3) : 0;
      bring.style.transform = 'scale(' + (1 + 0.5 * rp).toFixed(3) + ',' + (1 + 0.9 * rp).toFixed(3) + ')';
      setBar(o.bar);
      feedc.style.transform = 'translateY(' + (-o.scroll) + 'px)';
      biz.style.color = o.biz > 0 ? 'color-mix(in srgb, var(--acc) ' + (o.biz * 100).toFixed(1) + '%, #eef2f0)' : '';
      rush.style.opacity = o.rush.o; rush.style.transform = 'translateY(' + o.rush.y + 'px)';
      for (let i = 0; i < posts.length; i++) {
        const q = o.posts[i];
        posts[i].style.opacity = (q.o * o.dim).toFixed(4);
        posts[i].style.transform = 'translateY(' + q.y + 'px) scale(' + q.s + ')';
      }
      card.style.opacity = o.card.o; card.style.transform = 'scale(' + o.card.s + ')';
      if (o.card.n !== lastN) { lastN = o.card.n; num.textContent = String(o.card.n); }
      num.style.transform = 'scale(' + o.card.tick + ')';
      for (let i = 0; i < spam.length; i++) {
        const q = o.spam[i];
        spam[i].style.opacity = q.o;
        spam[i].style.transform = 'translate(' + q.x + 'px,' + q.y + 'px) rotate(' + q.r + 'deg) scale(' + q.sx + ',' + (2 - q.sx).toFixed(4) + ')';
      }
      btnw.style.opacity = o.btn.o; btnw.style.transform = 'translateY(' + o.btn.y + 'px)';
      btn.style.transform = 'scale(' + o.btn.s + ')';
      btn.style.boxShadow = o.btn.glow > 0 ? '0 0 ' + (18 * o.btn.glow).toFixed(1) + 'px rgba(53,255,106,' + (0.45 * o.btn.glow).toFixed(3) + ')' : 'none';
      bring2.style.opacity = o.btn.ring.o; bring2.style.transform = 'scale(' + o.btn.ring.s + ',' + (1 + (o.btn.ring.s - 1) * 2.4).toFixed(4) + ')';
      handle.style.opacity = o.handle.o;
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
      if (req.url.split('?')[0] === '/logo.svg') { res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(LOGO)); }
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

console.log('\npost41, the boring tek news. ' + SECONDS + 's, ' + FPS + 'fps.');
for (const [t, what] of [[PHONE_IN.at, 's1, the phone'], [POP.at, 'he pops in'], [T1.at, 'the voice'], [BADGE_POP, 'the beta badge'],
  ...POSTS.map(p => [p.at, 's2, ' + p.label]), [SPAM_HIT, 's3, the spam hits'], [CARD.at, 'the card'], [CARD.three, 'it reads 3'],
  [PULSE, 's4, the badge pulses'], [FLIP.at, 'the flip and the bounce'], [BAR.at, 's5, the join button'], [PRESS, 'the press'], [CUT, 'the end card'], [SECONDS, 'the end']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
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
const WAV = path.join(OUT, 'post41-mix.wav'), RAW = path.join(OUT, 'post41-mix-raw.wav');
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
  for (const q of ['400 40px "Michroma"', '400 19px "Space Grotesk"', '700 12px "Space Grotesk"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  LAY = await page.evaluate(() => window.__built);
  LOOKS = looks();

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__p41.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p41.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the margin and the app zone, for every piece of text, the phone and him */
  const fails = [];
  const SB = { l: MARGIN, t: MARGIN, r: VW - MARGIN, b: VH - APP_ZONE };
  const TEXT = ['#phone', '#ttl', '#row2', '#bface', '#av', ...POSTS.map((_, i) => '#p' + i), '#card', '#btnw', '#subt', '#m-card'];
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    await put(t, Math.round(t * FPS));
    for (const sel of TEXT) {
      const r = await page.evaluate(s => window.__p41.rect(s), sel);
      if (!r || !r.w) continue;
      /* a post scrolled up under the header is clipped by the screen */
      if (/^#p\d/.test(sel)) { const top = PH.t + PH.bez + HDR.h; if (r.b < top) continue; r.t = Math.max(r.t, top); }
      if (r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || r.b > SB.b + 0.5) fails.push(sel + ' past the margin at ' + t.toFixed(1) + 's: ' + [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / '));
    }
    const m = await page.evaluate(() => window.__p41.rect('#m-card'));
    const p = await page.evaluate(() => window.__p41.rect('#phone'));
    if (m && p && m.l < p.r - 1 && m.b > p.t && m.t < p.b) fails.push('he is on the phone at ' + t.toFixed(1) + 's');
    if (m && m.b > ST.top - 4) fails.push('he reaches the subtitles at ' + t.toFixed(1) + 's');
    const s = await page.evaluate(() => window.__p41.rect('#subt'));
    if (s && s.w && p && s.t < p.b) fails.push('the subtitle is on the phone at ' + t.toFixed(1) + 's');
  }
  /* the avatar is the file, loaded, at its size */
  if (!await page.evaluate(() => { const a = document.getElementById('av'); return a.complete && a.naturalWidth > 0; })) fails.push('the logo did not load');
  /* the title stays inside the screen */
  { const r = await page.evaluate(() => { const e = document.getElementById('ttl'); return e.getBoundingClientRect().width; }); if (PH.bez + HDR.back + HDR.av + 10 + r > PH.bez + SCR.w - 6) fails.push('the channel title runs past the screen'); }
  /* every post line fits its bubble on at most five lines */
  const lines = await page.evaluate(() => [...document.querySelectorAll('.tx')].map(e => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))));
  lines.forEach((n, i) => { if (n > 5) fails.push('post ' + POSTS[i].label + ' runs to ' + n + ' lines'); });
  /* the flipped badge stays inside the screen */
  if (LAY.badge.r > SCR.l + SCR.w - 8) fails.push('better every week runs past the screen: ' + LAY.badge.r.toFixed(1));
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p41.rect('#wm'));
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
const FILE = path.join(OUT, 'post41-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
for (let i = 0; i < 2; i++) {
  const got = loudness(ffmpeg, FILE);
  if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
  const fixed = path.join(OUT, 'post41-mix-fix.wav'), tmp = path.join(OUT, 'post41-tmp.mp4');
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
for (const T of TAKES) for (const g of T.gaps) if (Math.abs(g - BREAK_MS / 1000) > 0.006) fail.push('line ' + (T.i + 1) + ' has a ' + (g * 1000).toFixed(0) + 'ms stop, not ' + BREAK_MS);
for (let i = 0; i + 1 < TAKES.length; i++) {
  const gap = TAKES[i + 1].at - TAKES[i].end;
  if (gap < 0.25) fail.push('line ' + (i + 2) + ' starts on top of line ' + (i + 1));
  if (gap > 0.6) fail.push('a ' + gap.toFixed(2) + 's gap in the voice before line ' + (i + 2));
}
if (T1.at > 0.8) fail.push('the voice starts at ' + T1.at);
for (const a of ARCS) if (a.up + a.hold + a.down > 0.6) fail.push('a happy arc lasts ' + (a.up + a.hold + a.down).toFixed(2) + 's');
for (let f = 0, run = 0; f < CUT * 60; f++) { run = lidAt(f / 60) >= 0.98 ? run + 1 : 0; if (run / 60 > 0.3) { fail.push('the eyes are shut too long at ' + (f / 60).toFixed(2)); break; } }
for (const B of BLINKS) if (ARCS.some(a => B.at + 0.25 > a.at && B.at < a.at + a.up + a.hold + a.down)) fail.push('a blink inside a happy arc at ' + B.at);
/* something new every 2 to 4 seconds: the beats, and the gaps between them */
{
  const beats = [PHONE_IN.at, POP.at, RUSH.stop, BIZ, BADGE_POP, ...POSTS.map(p => p.at), SPAM_HIT, CARD.at, CARD.three, PULSE, FLIP.at, BAR.at, PRESS, CUT].sort((a, b) => a - b);
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
