/* the boring tek — post40. trust me.

   dark only, 1080x1920, about forty five seconds. eleven lines on the
   elevenlabs narrator, every sentence its own take with a 300ms stop between
   them, post31's way, and two 1 khz bleeps, post39's tone. the voice never
   stops: no line starts more than GAP after the one before, and the one air
   in the clip is the second's hold after the last bleep. no music: einz adds it.

     s1  2004        black. a big white 2004 springs in, letter by letter, in
                     michroma, a small mono label types under it, and two
                     picture slots pop in on the kit's spring, the photo on
                     `mark`, the logo on `facebook`, then float, both with a
                     bold white outline and a deep soft glow. he pops in
                     whole at the bottom right, eyes calm, and stays whole.
     s1b idiots      big white text on black, and idiots goes to the accent
                     on the read's own word.
     c1  the rival   the first chat, labelled just above it. FRIEND asks,
                     ZUCK answers in three lines on the read, the swear
                     bleeped in the voice. the window slides away on `then
                     came a second chat`.
     s2  the chat    the second chat opens, labelled on top. the messages type
                     in with the read. the source sits in the title bar.
     s3  4000        a counter over the window runs 0 to 4000 and small tiles,
                     mail, photo, home, id, pile up behind the window.
     s4  the ask     FRIEND types.
     s5  trust me    three lines from ZUCK, a slow zoom into the last one, and
                     his eyes narrow to a squint while it happens.
     s6  two words   the narrator, then the message lands with the bleep and
                     the whole frame holds a second. nothing moves.
     s7  the ask     cut to black. the round head, whole, pops in centred
                     under the line, his own eyes open and calm, one small
                     happy hop, a look up at the line, one blink, a soft float. the line lands word by word,
                     post39's glitch, the end card.

   every chat line is the brief's, exactly as written, including the quote
   marks and the apostrophes: the brief overrides the house rule for these,
   because they are a real quote. every other string on screen keeps the rule
   and is checked. the swear words are only ever stars.

   **the pictures are files, never drawn.** demo/assets/zuck.png and
   demo/assets/facebook-logo.png sit in their slots at their own ratio; a
   missing file leaves its slot empty.

   no hands on the rig. the rig, the gaze, the glitch and the end card are
   post39's. the read and the subtitles are post31's, on elevenlabs. the
   springs are the kit's. the tile glyphs are tabler outline, the set
   skills/page-builder names.

     DEMO_FPS=12 node post40.mjs         the preview
     node post40.mjs                     60fps
     node post40.mjs --keep-frames       leave the jpegs on disk

     demo/out/post40-dark-1080x1920.mp4
     demo/out/verify-post40/contact.png, phone.png    the critique sheets
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
import { EASE as K, INK, ring, kinetic, kineticMarkup, motionApply } from './lib/motion.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post40');
const VERIFY = path.join(OUT, 'verify-post40');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const MARGIN = 120 / DSF;
const APP_ZONE = 300 / DSF;
const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the pictures: files or nothing ---------- */
const PICS = {
  zuck: path.join(HERE, 'assets', 'zuck.png'),
  fb: path.join(HERE, 'assets', 'facebook-logo.png'),
};
const HAS = Object.fromEntries(Object.entries(PICS).map(([k, f]) => [k, fs.existsSync(f)]));
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (!(b.length > 24 && b.readUInt32BE(0) === 0x89504e47)) throw new Error(path.relative(ROOT, file) + ' is not a png');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const SZ = Object.fromEntries(Object.entries(PICS).filter(([k]) => HAS[k]).map(([k, f]) => [k, pngSize(f)]));

/* ---------- the small maths ---------- */
const EASE = K.ease, SPRING = K.spring, IO = K.io, EIN = K.in;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
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

/* ---------- the words ---------- */
const YEAR = '2004';
const LABEL = 'thefacebook just launched';
const IDIOT = ['he called', 'facebook users', 'idiots'];
const TITLE = 'ZUCK and FRIEND';
const SOURCE = 'source the new yorker 2010';
const TOPS = ['about a rival website', 'about his users'];
/* the two chats, exactly as the brief wrote them. in the second, `from` and
   `to` are the words in the read the typing runs across; the last one lands
   on the bleep. the first types at its own pace after its short read. */
const MSGS = [
  { chat: 0, who: 'FRIEND', text: 'so have you decided what you are going to do about the websites?', line: 2, from: 'friend', to: 'website' },
  { chat: 0, who: 'ZUCK', text: 'yea i\'m going to f**k them', line: 3, from: 'he', to: 'them' },
  { chat: 0, who: 'ZUCK', text: 'probably in the year', line: 3, from: 'probably', to: 'year' },
  { chat: 0, who: 'ZUCK', text: '*ear', line: 3, from: 'typo', to: 'typo' },
  { chat: 1, who: 'ZUCK', text: 'yea so if you ever need info about anyone at harvard', line: 5, from: 'he', to: 'harvard' },
  { chat: 1, who: 'ZUCK', text: 'just ask', line: 5, from: 'just', to: 'ask' },
  { chat: 1, who: 'ZUCK', text: 'i have over 4000 emails, pictures, addresses, sns', line: 6, from: 'over', to: 'addresses' },
  { chat: 1, who: 'FRIEND', text: 'what!? how\'d you manage that one?', line: 7, from: 'how', to: 'that' },
  { chat: 1, who: 'ZUCK', text: 'people just submitted it', line: 8, from: 'people', to: 'it' },
  { chat: 1, who: 'ZUCK', text: 'i don\'t know why', line: 8, from: 'i', to: 'why' },
  { chat: 1, who: 'ZUCK', text: 'they "trust me"', line: 8, from: 'they', to: 'me' },
  { chat: 1, who: 'ZUCK', text: 'dumb f**ks', bleep: true },
];
if (MSGS.some(m => /u[c]k/i.test(m.text))) throw new Error('a swear word is on screen without its stars');
const TRUST = MSGS.length - 2;
const COUNTMSG = MSGS.findIndex(m => /4000/.test(m.text));
const BIG = ['what did you', 'tell your ai', 'today'];
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };

/* ==========================================================================
   the read: eleven lines, the narrator, a take per sentence, 300ms stops.
   the keys are the cache names, so a line keeps its take when lines move.
   ========================================================================== */
const VOICE = 'calm';
const BREAK_MS = 300;
const LINES = [
  { key: 'l1', text: '2004. a 19 year old mark zuckerberg just launched facebook.' },
  { key: 'x1', text: 'and later he called his first users idiots. these are his real messages.' },
  { key: 'x2', text: 'first, a friend asks about a rival website.' },
  { key: 'x3', text: 'his answer, he is going to fuck them. probably in the year. then he fixes his own typo.' },
  { key: 'x4', text: 'then came a second chat. this one about his users.' },
  { key: 'l2', text: 'he tells a friend, if you ever need info about anyone at harvard, just ask.' },
  { key: 'l3', text: 'over 4000 emails, pictures, addresses.' },
  { key: 'l4', text: 'the friend asks, how did you get all that?' },
  { key: 'l5', text: 'people just submitted it. i dont know why. they trust me.' },
  { key: 'l6', text: 'then two more words.' },
  { key: 'l7', text: 'he later said he regrets it. anyway. what did you tell your ai today? the boring tek.' },
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
/* post31's take(), on elevenlabs: one take a sentence, laid end to end with
   exactly BREAK_MS between one's last sound and the next one's first */
async function take(i) {
  const parts = LINES[i].text.split(/(?<=[.!?])\s+/);
  const got = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post40-' + LINES[i].key + (parts.length > 1 ? 's' + (k + 1) : '');
    const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
    const want = parts[k].replace(/\s+/g, ' ').trim();
    let g = null;
    if (fs.existsSync(cached)) {
      const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
      if (j.text === want && j.provider === 'elevenlabs' && j.elevenId === 'narrator' && fs.existsSync(j.file)) g = j;
    }
    if (!g) {
      try { g = await speak(want, { voice: VOICE, name }); }
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
const [T_YEAR, T_IDIOT, T_RIVAL, T_ANSWER, T_SECOND, T_ASK, T_COUNT, T_HOW, T_TRUST, T_TWO, T_END] = TAKES;
/* on the clip's clock: the first sound of a line at `at`, every word with it */
function place(T, at) {
  T.at = +at.toFixed(4);
  T.end = +(at + T.edge.end - T.edge.start).toFixed(4);
  T.W = T.words.map(w => ({ ...w, start: +(at + w.start - T.edge.start).toFixed(4), end: +(at + w.end - T.edge.start).toFixed(4) }));
}
/* the n-th word in a line whose letters are `w`, from word `after` on */
function word(T, w, after = 0) {
  for (let k = after; k < T.W.length; k++) if (letters(T.W[k].word) === letters(w)) return k;
  throw new Error('no word "' + w + '" in line ' + (T.i + 1) + ': ' + T.W.map(x => x.word).join(' '));
}

/* ==========================================================================
   the clock: slow first, then faster. every scene starts off the read.
   ========================================================================== */
/* the voice never stops: every line starts GAP after the one before, and the
   scenes start on the lines. the only air is the hold after the last bleep. */
const GAP = 0.42;
const S = {};
const after = (T, U) => place(U, T.end + GAP);
place(T_YEAR, 0.30);
S.idiot = +(T_YEAR.end + 0.12).toFixed(4);
after(T_YEAR, T_IDIOT);
const IDIOT_AT = T_IDIOT.W[word(T_IDIOT, 'idiots')].start - 0.03;
/* c1, the rival chat, straight on */
S.c1 = +(T_IDIOT.end + 0.04).toFixed(4);
after(T_IDIOT, T_RIVAL);
after(T_RIVAL, T_ANSWER);
after(T_ANSWER, T_SECOND);
/* the first window slides off on `then came`, the second opens on `second` */
const SLIDE = { at: +(T_SECOND.at + 0.05).toFixed(4), for: 0.45 };
S.c2 = +Math.max(SLIDE.at + 0.30, T_SECOND.W[word(T_SECOND, 'second')].start - 0.08).toFixed(4);
after(T_SECOND, T_ASK);
after(T_ASK, T_COUNT); S.count = +(T_COUNT.at - 0.05).toFixed(4);
after(T_COUNT, T_HOW); S.how = +(T_HOW.at - 0.05).toFixed(4);
after(T_HOW, T_TRUST); S.trust = +(T_TRUST.at - 0.05).toFixed(4);
after(T_TRUST, T_TWO); S.two = +(T_TWO.at - 0.05).toFixed(4);
/* the rival bleep: the swear word's own box, from its start to the next
   word's start, the word out and the tone in */
const RB = (() => {
  const k = word(T_ANSWER, 'fuck'), n = T_ANSWER.W[k + 1];
  return { at: +(T_ANSWER.W[k].start - 0.015).toFixed(4), to: +(n.start - 0.01).toFixed(4) };
})();
/* the bleep: two words' worth of tone, and the message lands with it. then
   one second where nothing moves at all. */
const BLEEP = { at: +(T_TWO.end + 0.28).toFixed(4), for: 0.62 };
const FREEZE = { from: BLEEP.at, to: +(BLEEP.at + 1.00).toFixed(4) };
S.end = FREEZE.to;
place(T_END, S.end + 0.30);
const W_ANYWAY = word(T_END, 'anyway');
const W_WHAT = word(T_END, 'what', W_ANYWAY);
const W_THE = word(T_END, 'the', W_WHAT);
/* the big line, word by word on the read */
const BIGW = BIG.join(' ').split(' ').map((w, k) => ({ w, at: T_END.W[W_WHAT + k].start - 0.03 }));
BIGW.forEach((b, k) => { if (letters(T_END.W[W_WHAT + k].word) !== letters(b.w)) throw new Error('the big line and the read disagree at ' + b.w); });
const CUT = +(T_END.W[W_THE].start - 0.04).toFixed(4);
const END_HOLD = 1.10;
const SECONDS = +(T_END.end + END_HOLD).toFixed(4);
/* s1's label types on the read's own `just launched facebook`; the pictures
   pop on `mark` and on `facebook` */
const LABT = { at: +(T_YEAR.W[word(T_YEAR, 'just')].start - 0.04).toFixed(4), dur: 0.62 };
const POPS = { zuck: +(T_YEAR.W[word(T_YEAR, 'mark')].start - 0.04).toFixed(4), fb: +(T_YEAR.W[word(T_YEAR, 'facebook')].start - 0.04).toFixed(4), for: 0.55 };

/* both chats type off the words: a message types across its words and no
   slower than a reader, so the typing fits the voice */
for (const m of MSGS) {
  if (m.bleep) { m.at = BLEEP.at; m.dur = 0; continue; }
  const T = TAKES[m.line];
  const a = word(T, m.from), b = word(T, m.to, a);
  m.at = +(T.W[a].start - 0.06).toFixed(4);
  m.dur = +clamp(T.W[b].end - m.at, m.text.length / 60, m.text.length / 16).toFixed(4);
}

/* ---------- where everything sits, in css px of the 540x960 stage ---------- */
const WIN = { l: 63, t: 250, w: 414, h: 380, bar: 32, pad: 12, font: 19, openFor: 0.42 };
const TOP = { y: 226, size: 14 };
const CNT = { size: 46, top: 96, to: 4000 };
const YR = { top: 150, label: 290 };
/* the two slots: the photo big on the left, the logo small over his head */
const SLOT = { zuck: { l: 66, t: 390, w: 270, h: 203 }, fb: { l: 356, t: 470, w: 112, h: 112 } };
const IDL = { l: 70, top: 250, w: 400, lh: 1.5 };
/* the tiles: a pile behind the window's top edge, bottom row first */
const TILE = { s: 34, icon: 22, rows: [250, 227, 205, 184], per: [11, 10, 10, 9], x0: WIN.l + 12, x1: WIN.l + WIN.w - 12 };
/* he peeks: a clip line he rises from behind, the same in s1 to s6 */
/* the rig plans no head under 118 css px, so he is planned there and drawn
   a little smaller */
const SIZE = 118, SMALL = 0.95;
const HOME = { cx: 414, cy: 700 };
const BOX = { left: +(HOME.cx - SIZE / 2).toFixed(2), top: +(HOME.cy - SIZE / 2).toFixed(2), size: SIZE };
const PEEK1 = { at: 0.95, for: 0.55 };
/* s7: the whole head, centred under the line, bigger */
const S7 = { at: 0, for: 0.60, cx: VW / 2, cy: 548, scale: 1.45 };
const ST = { size: 19, weight: 600, top: 772, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 5 };
const BIGL = { l: 72, top: 150, w: 396, lh: 1.55, pop: 0.42 };

/* ---------- the subtitles: what is read and not already on screen ---------- */
const SUBTITLES = [
  { line: 0, text: 'a 19 year old mark zuckerberg' },
  { line: 0, text: 'just launched facebook' },
  { line: 1, text: 'these are his real messages', skip: 'and later he called his first users idiots' },
  { line: 2, text: 'first, a friend asks' },
  { line: 2, text: 'about a rival website' },
  { line: 3, text: 'his answer' },
  { line: 3, text: 'he is going to f**k them', say: 'he is going to fuck them' },
  { line: 3, text: 'probably in the year' },
  { line: 3, text: 'then he fixes his own typo' },
  { line: 4, text: 'then came a second chat' },
  { line: 4, text: 'this one about his users' },
  { line: 5, text: 'he tells a friend' },
  { line: 5, text: 'if you ever need info' },
  { line: 5, text: 'about anyone at harvard' },
  { line: 5, text: 'just ask' },
  { line: 6, text: 'over 4000 emails' },
  { line: 6, text: 'pictures, addresses' },
  { line: 7, text: 'the friend asks' },
  { line: 7, text: 'how did you get all that' },
  { line: 8, text: 'people just submitted it' },
  { line: 8, text: 'i dont know why' },
  { line: 8, text: 'they trust me' },
  { line: 9, text: 'then two more words' },
  { line: 10, text: 'he later said he regrets it' },
  { line: 10, text: 'anyway' },
];
const CARDS = [];
{
  const cursor = LINES.map(() => 0);
  for (const c of SUBTITLES) {
    const T = TAKES[c.line];
    if (c.skip) {
      let k = 0, got = '';
      while (k < T.W.length && got.length < letters(c.skip).length) got += letters(T.W[k++].word);
      if (got !== letters(c.skip)) throw new Error('the unsubtitled part of line ' + (c.line + 1) + ' does not match the read');
      cursor[c.line] = k;
    }
    const want = letters(c.say || c.text);
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
  /* nothing fades during the hold, and nothing is up after the cut but the line */
  for (const c of CARDS) { if (c.from < FREEZE.from && c.to > FREEZE.from - 0.02) c.to = +(FREEZE.from - 0.02).toFixed(4); if (c.to > BIGW[0].at - 0.02 && c.from < BIGW[0].at) c.to = +(BIGW[0].at - 0.02).toFixed(4); }
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

/* the copy rule for everything that is not the quoted chat */
for (const s of [YEAR, LABEL, ...IDIOT, TITLE, SOURCE, ...TOPS, ...BIG, ...WM.lines, ...SUBTITLES.map(c => c.text)]) {
  if (/[-\u2010-\u2015'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, apostrophe or quote on screen: ' + s);
}

/* ---------- the tiles ---------- */
const GLYPHS = ['mail', 'photo', 'home', 'id'];
const W3 = { emails: word(T_COUNT, 'emails'), pictures: word(T_COUNT, 'pictures'), addresses: word(T_COUNT, 'addresses') };
const COUNT = { from: T_COUNT.W[word(T_COUNT, 'over')].start, to: +Math.max(MSGS[COUNTMSG].at + MSGS[COUNTMSG].dur + 0.15, T_COUNT.W[W3.addresses].end + 0.6).toFixed(4) };
const PHASES = [
  [T_COUNT.W[W3.emails].start - 0.10, T_COUNT.W[W3.pictures].start - 0.05],
  [T_COUNT.W[W3.pictures].start - 0.05, T_COUNT.W[W3.addresses].start - 0.05],
  [T_COUNT.W[W3.addresses].start - 0.05, T_COUNT.W[W3.addresses].end + 0.05],
  [T_COUNT.W[W3.addresses].end + 0.05, COUNT.to],
];
const TILES = (() => {
  const r = prng(0x4000), slots = [];
  TILE.rows.forEach((y, ri) => {
    const n = TILE.per[ri], w = (TILE.x1 - TILE.x0 - TILE.s) / (n - 1);
    const xs = Array.from({ length: n }, (_, k) => TILE.x0 + TILE.s / 2 + k * w + (ri % 2 ? w / 2 : 0) * 0.6 + (r() * 2 - 1) * 4);
    for (let k = xs.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [xs[k], xs[j]] = [xs[j], xs[k]]; }
    for (const x of xs) slots.push({ x: +x.toFixed(2), y: +(y + (r() * 2 - 1) * 3).toFixed(2), rot: +((r() * 2 - 1) * 14).toFixed(2) });
  });
  const N = slots.length, per = [12, 10, 10, N - 32];
  return slots.map((s, i) => {
    let g = 0, c = i;
    while (c >= per[g]) { c -= per[g]; g++; }
    const [a, b] = PHASES[g];
    return { ...s, g: GLYPHS[g], at: +(a + (b - a) * (c / per[g])).toFixed(4) };
  });
})();

/* ---------- the chats: typing, the scroll, the zoom ---------- */
let LAY = null;   /* measured in the page: each log's box, every message's top and height in its own log */
function typedAt(m, t) {
  if (t < m.at) return -1;
  if (!m.dur) return m.text.length;
  return Math.floor(m.text.length * span(t, m.at, m.at + m.dur));
}
/* a log scrolls so its newest message sits on its bottom edge; the quote's
   scroll already leaves room for the last message, so the bleep lands with
   nothing moving */
function scrollAt(c, t) {
  let s = 0;
  for (let k = 0; k < MSGS.length; k++) {
    const m = MSGS[k];
    if (m.chat !== c) continue;
    if (t < m.at) break;
    const last = k === TRUST ? k + 1 : k;
    const want = Math.max(0, LAY.top[last] + LAY.h[last] - LAY.log[c].h);
    s = m.bleep ? s : lerp(s, want, EASE(span(t, m.at, m.at + 0.26)));
  }
  return s;
}
const ZOOM = { from: +(T_TRUST.at - 0.10).toFixed(4), to: 0, scale: 1.62, y: 440 };
ZOOM.to = +(MSGS[TRUST].at + MSGS[TRUST].dur + 0.35).toFixed(4);
function camAt(t) {
  const k = IO(span(t, ZOOM.from, ZOOM.to));
  if (k <= 0) return { s: 1, x: 0, y: 0 };
  /* the quote's line keeps its left edge and its centre moves to ZOOM.y */
  const L = LAY.log[1];
  const px = L.l, py = L.t + LAY.top[TRUST] + LAY.h[TRUST] / 2 - scrollAt(1, ZOOM.to);
  const s = lerp(1, ZOOM.scale, k), ty = lerp(py, ZOOM.y, k);
  return { s: +s.toFixed(5), x: +(px - px * s).toFixed(3), y: +(ty - py * s).toFixed(3) };
}

/* ---------- where he is, and where he looks ---------- */
S7.at = +(S.end + 0.25).toFixed(4);
const SEED = 3;
const plan = planMascot({ hands: false, seconds: 50, theme: 'dark', size: SIZE, bias: 0, seed: SEED, marks: [{ t: 0.0, state: 'neutral' }] });
plan.box = { ...BOX };
/* he pops in whole where he sits, and in s7 pops in again, centred and bigger */
function placeAt(t) {
  if (t < S.end) return { dx: 0, dy: 0, s: +Math.max(0.001, SMALL * SPRING(span(t, PEEK1.at, PEEK1.at + PEEK1.for))).toFixed(5) };
  /* he lands on the spring, gives one small happy hop, then floats softly */
  const land = S7.at + S7.for;
  const hop = 15 * Math.sin(Math.PI * EASE(span(t, land, land + 0.40)));
  const drift = 3.5 * smooth(span(t, land + 0.35, land + 0.95)) * Math.sin(2 * Math.PI * (t - land - 0.35) / 2.4);
  return { dx: +(S7.cx - HOME.cx).toFixed(3), dy: +(S7.cy - HOME.cy - hop + drift).toFixed(3), s: +Math.max(0.001, S7.scale * SPRING(span(t, S7.at, S7.at + S7.for))).toFixed(5) };
}
const GAZE = { span: 150, max: 0.75, vspan: 200, vy: 3.4 };
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
/* the thing he looks at: the year and the photo, the idiots line, the newest
   message in whichever chat is up, the counter while it runs, the quote */
function lookAt(t) {
  if (t < S.idiot) {
    const w = smooth(span(t, PEEK1.at + 0.35, PEEK1.at + 0.75));
    const toPic = HAS.zuck ? smooth(span(t, POPS.zuck, POPS.zuck + 0.3)) : 0;
    return { x: lerp(VW / 2, SLOT.zuck.l + SLOT.zuck.w / 2, toPic), y: lerp(YR.top + 60, SLOT.zuck.t + 70, toPic), w };
  }
  if (t < S.c1 + 0.2) return { x: IDL.l + 150, y: IDL.top + 100, w: 1 };
  if (t >= S.end) {
    const last = BIGW[BIGW.length - 1].at;
    return { x: VW / 2, y: BIGL.top + 80, w: smooth(span(t, BIGW[0].at, BIGW[0].at + 0.3)) * (1 - smooth(span(t, last + 0.4, last + 0.8))) };
  }
  const c = t < S.c2 ? 0 : 1;
  const cam = c ? camAt(t) : { s: 1, x: 0, y: 0 };
  const L = LAY.log[c];
  let k = -1;
  for (let i = 0; i < MSGS.length; i++) if (MSGS[i].chat === c && t >= MSGS[i].at) k = i;
  let p = { x: VW / 2 - 60, y: WIN.t + WIN.h / 2 };
  if (k >= 0) p = { x: L.l + 120, y: L.t + LAY.top[k] + LAY.h[k] / 2 - scrollAt(c, t) };
  const wc = smooth(span(t, COUNT.from + 0.2, COUNT.from + 0.5)) * (1 - smooth(span(t, COUNT.to + 0.1, COUNT.to + 0.45)));
  if (wc > 0) p = { x: lerp(p.x, VW / 2, wc), y: lerp(p.y, CNT.top + 20, wc) };
  return { x: p.x * cam.s + cam.x, y: p.y * cam.s + cam.y, w: 1 };
}
function gazeAt(t) {
  const P = placeAt(t), L = lookAt(t);
  const eyeY = HOME.cy + P.dy + (HEAD.eye.cy / GRID - 0.5) * SIZE * P.s;
  return {
    q: +(clamp((L.x - HOME.cx - P.dx) / GAZE.span, -1, 1) * GAZE.max * L.w).toFixed(5),
    v: +(clamp((L.y - eyeY) / GAZE.vspan, -1, 1) * L.w).toFixed(5),
  };
}
/* the lids, all written: calm is a little down; the squint comes on across
   s5 and stays to the cut, s7 opens them again; a few blinks, none in the hold */
const CALM = 0.14, SQUINT = 0.52;
const SQ = { from: T_TRUST.at + 0.2, to: T_TRUST.end + 0.1 };
const BLINKS = [
  { at: PEEK1.at + 1.3, close: 0.07, hold: 0.03, open: 0.12 },
  { at: S.c1 + 0.9, close: 0.07, hold: 0.03, open: 0.12 },
  { at: S.c2 + 1.8, close: 0.07, hold: 0.03, open: 0.12 },
  { at: S.count + 0.35, close: 0.07, hold: 0.03, open: 0.12 },
  { at: S.how + 0.45, close: 0.07, hold: 0.03, open: 0.12 },
  /* s7: the one natural blink, after he lands and before the line */
  { at: S.end + 1.75, close: 0.07, hold: 0.03, open: 0.12 },
];
/* s7 gives him his own eyes back: open, calm, no squint */
const OPEN = 0.05;
function lidAt(t) {
  let v = t >= S.end ? OPEN : lerp(CALM, SQUINT, smooth(span(t, SQ.from, SQ.to)));
  for (const B of BLINKS) {
    const c = B.at + B.close, h = c + B.hold;
    if (t < B.at || t >= h + B.open) continue;
    v = Math.max(v, t < c ? IO(span(t, B.at, c)) : t < h ? 1 : 1 - smooth(span(t, h, h + B.open)));
  }
  return +v.toFixed(4);
}
/* the hold: every clock in the frame reads the bleep's first frame */
const held = t => (t >= FREEZE.from && t < FREEZE.to ? FREEZE.from : t);
function compose(t0) {
  const t = held(t0);
  const mas = mascotFrame(plan, t);
  applyGaze(mas, gazeAt(t));
  const lid = lidAt(t);
  for (const e of mas.eyes) e.lid = lid;
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
/* a picture: the kit's spring in, then a slow small float */
function picAt(t, at, ph) {
  const p = span(t, at, at + POPS.for);
  const fl = smooth(span(t, at + POPS.for * 0.6, at + POPS.for + 0.6));
  return { o: +span(t, at, at + 0.07).toFixed(3), s: +lerp(0.55, 1, SPRING(p)).toFixed(4),
    y: +(fl * 3.2 * Math.sin(2 * Math.PI * (t - at) / 3.4 + ph)).toFixed(3), r: +(fl * 0.9 * Math.sin(2 * Math.PI * (t - at) / 4.6 + ph * 1.7)).toFixed(3) };
}
function frameAt(t0, f) {
  const t = held(t0);
  const s1Out = span(t, S.idiot, S.idiot + 0.26);
  const idIn = span(t, S.idiot + 0.08, S.idiot + 0.08 + 0.5);
  const idOut = span(t, S.c1, S.c1 + 0.26);
  const w0In = span(t, S.c1 + 0.12, S.c1 + 0.12 + WIN.openFor);
  const w0Out = EIN(span(t, SLIDE.at, SLIDE.at + SLIDE.for));
  const w1In = span(t, S.c2, S.c2 + WIN.openFor);
  const cam = camAt(t);
  const cp = span(t, COUNT.from, COUNT.to);
  const zk = picAt(t, POPS.zuck, 0), fb = picAt(t, POPS.fb, 1.3);
  return {
    t: +t.toFixed(4), f,
    s16: t < S.end ? 1 : 0, s7: t >= S.end && t < CUT ? 1 : 0,
    s1: { o: +(1 - s1Out).toFixed(4), s: +lerp(1, 0.94, EASE(s1Out)).toFixed(4) },
    yr: kinetic(t, { id: 'yr', text: YEAR, t0: 0.10, stagger: 0.07, dur: 0.62, from: 0.25, y: 40, rot: 7 }),
    lab: { o: +span(t, LABT.at, LABT.at + 0.05).toFixed(4), n: Math.floor(LABEL.length * span(t, LABT.at, LABT.at + LABT.dur)) },
    zk, fb,
    idl: { o: +(span(t, S.idiot + 0.08, S.idiot + 0.2) * (1 - idOut)).toFixed(4), lines: [0, 1, 2].map(k => { const p = span(t, S.idiot + 0.08 + k * 0.12, S.idiot + 0.58 + k * 0.12); return { o: +span(t, S.idiot + 0.08 + k * 0.12, S.idiot + 0.16 + k * 0.12).toFixed(3), s: +lerp(0.7, 1, SPRING(p)).toFixed(4), y: +(18 * (1 - EASE(p))).toFixed(2) }; }),
      hot: +span(t, IDIOT_AT, IDIOT_AT + 0.12).toFixed(3), punch: +(1 + 0.10 * Math.sin(Math.PI * span(t, IDIOT_AT, IDIOT_AT + 0.30))).toFixed(4), s: +lerp(1, 0.94, EASE(idOut)).toFixed(4) },
    win: [
      { o: +(span(t, S.c1 + 0.12, S.c1 + 0.2) * (1 - span(w0Out, 0.8, 1))).toFixed(4), s: +lerp(0.82, 1, SPRING(w0In)).toFixed(5), x: +(-(WIN.l + WIN.w + 40) * w0Out).toFixed(2) },
      { o: +span(t, S.c2, S.c2 + 0.08).toFixed(4), s: +lerp(0.82, 1, SPRING(w1In)).toFixed(5), x: 0 },
    ],
    msgs: MSGS.map(m => typedAt(m, t)),
    scroll: [+scrollAt(0, t).toFixed(3), +scrollAt(1, t).toFixed(3)],
    cam, dim: +lerp(1, 0.26, IO(span(t, ZOOM.from + 0.3, ZOOM.to))).toFixed(4),
    cnt: { o: +span(t, COUNT.from - 0.1, COUNT.from + 0.05).toFixed(4), v: Math.round(CNT.to * EASE(cp)), s: +lerp(0.7, 1, SPRING(span(t, COUNT.from - 0.1, COUNT.from + 0.35))).toFixed(4) },
    tiles: TILES.map(q => { const p = span(t, q.at, q.at + 0.34); return { o: +span(t, q.at, q.at + 0.06).toFixed(3), y: +(-46 * (1 - SPRING(p))).toFixed(2), s: +lerp(0.6, 1, SPRING(p)).toFixed(4) }; }),
    subt: subAt(t),
    big: BIGW.map(b => { const p = span(t, b.at, b.at + BIGL.pop); return { o: +span(t, b.at, b.at + 0.06).toFixed(3), s: +lerp(0.55, 1, ring(p, 1, 4.2)).toFixed(4), y: +(14 * (1 - EASE(p))).toFixed(2) }; }),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
/* tabler outline, the `d` attributes only, the set skills/page-builder names */
const TABLER = {
  mail: ['M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z', 'M3 7l9 6l9 -6'],
  photo: ['M15 8h.01', 'M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z', 'M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5', 'M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3'],
  home: ['M5 12l-2 0l9 -9l9 9l-2 0', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7', 'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6'],
  id: ['M3 7a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z', 'M7 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M15 8l2 0', 'M15 12l2 0', 'M7 16l10 0'],
};
const BLUE = '#5aa9ff';
/* a picture in its slot at its own ratio, centred, or nothing at all */
function slotImg(id, key, slot) {
  if (!HAS[key]) return '';
  const r = Math.min(slot.w / SZ[key].w, slot.h / SZ[key].h), w = SZ[key].w * r, h = SZ[key].h * r;
  return '<img id="' + id + '" class="pic" alt="" src="/' + key + '.png" style="left:' + (slot.l + (slot.w - w) / 2).toFixed(2) + 'px;top:' + (slot.t + (slot.h - h) / 2).toFixed(2) + 'px;width:' + w.toFixed(2) + 'px;height:' + h.toFixed(2) + 'px">';
}
function windowHtml(c) {
  return '<div class="win" id="win' + c + '">'
    + '<div class="bar"><span class="ttl">' + TITLE + '</span><span class="src">' + SOURCE + '</span></div>'
    + '<div class="log" id="log' + c + '"><div class="logc" id="logc' + c + '">'
    + MSGS.map((m, i) => (m.chat === c ? '<div class="msg" id="m' + i + '"><b class="' + (m.who === 'FRIEND' ? 'fr' : 'zk') + '">' + m.who + ':</b> <span class="ty"></span><span class="rest"></span></div>' : '')).join('')
    + '</div></div></div>';
}
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  let wi = 0;
  const bigLines = BIG.map(l => '<span class="bl">' + l.split(' ').map(w => '<span class="bw" id="bw' + (wi++) + '">' + w + '</span>').join(' ') + '</span>').join('');
  const idLines = IDIOT.map((l, k) => '<span class="il" id="il' + k + '">' + (k === 2 ? '<span id="hot">' + l + '</span>' : l) + '</span>').join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post40</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&display=swap">
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
  --cap:"Nunito",var(--mono);
  --im:Tahoma,Verdana,Arial,sans-serif;
  --acc:${INK.dark.accent};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(255,255,255,.028) 0%,rgba(255,255,255,.009) 50%,rgba(0,0,0,0) 74%)}
#s16,#s7{position:absolute;inset:0}

/* ---- s1: the year, the label, the two slots ---- */
#s1{position:absolute;inset:0;transform-origin:50% 40%;z-index:2}
#yr-w{position:absolute;left:0;right:0;top:${YR.top}px;text-align:center}
#yr{font-family:var(--display);font-size:100px;line-height:1.2;color:var(--fg);letter-spacing:.02em;
  text-shadow:0 0 10px rgba(255,255,255,.26),0 0 30px rgba(255,255,255,.10)}
#yr .kl{transform-origin:50% 80%}
#lab{position:absolute;left:50%;top:${YR.label}px;transform:translateX(-50%);font-family:var(--mono);font-weight:500;font-size:18px;letter-spacing:.08em;color:var(--fg);white-space:nowrap}
.pic{position:absolute;display:block;opacity:0;transform-origin:50% 60%;will-change:transform,opacity;
  filter:drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff)
    drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))}

/* ---- s1b: the idiots line ---- */
#idl{position:absolute;left:${IDL.l}px;top:${IDL.top}px;font-family:var(--display);color:#f4f7f5;line-height:${IDL.lh};white-space:nowrap;z-index:2;
  text-shadow:0 0 10px rgba(255,255,255,.20);transform-origin:0 50%}
#idl .il{display:block;opacity:0;transform-origin:0 70%;will-change:transform,opacity}
#hot{display:inline-block;transform-origin:0 70%}

/* ---- the camera: the counter, the pile and the windows ride it ---- */
#cam{position:absolute;inset:0;transform-origin:0 0;z-index:3}
.top{position:absolute;left:${WIN.l}px;top:${TOP.y}px;z-index:3;padding:1px 6px 1px 0;background:var(--bg);font-family:var(--mono);font-weight:500;font-size:${TOP.size}px;letter-spacing:.08em;color:var(--sub);white-space:nowrap;opacity:0}
#cnt{position:absolute;left:50%;top:${CNT.top}px;white-space:nowrap;font-family:var(--display);font-size:${CNT.size}px;line-height:1.2;color:var(--fg);
  text-shadow:0 0 10px rgba(255,255,255,.24),0 0 26px rgba(255,255,255,.10);transform-origin:50% 60%;font-variant-numeric:tabular-nums}
.tl{position:absolute;width:${TILE.s}px;height:${TILE.s}px;margin:${-TILE.s / 2}px 0 0 ${-TILE.s / 2}px;border-radius:7px;background:#14181e;border:1.5px solid #3a414b;
  display:flex;align-items:center;justify-content:center;color:#c9cfd4;opacity:0;will-change:transform,opacity}
.tl svg{width:${TILE.icon}px;height:${TILE.icon}px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

/* ---- the chat windows, 2004 chrome, a dark log ---- */
.win{position:absolute;left:${WIN.l}px;top:${WIN.t}px;width:${WIN.w}px;height:${WIN.h}px;background:#c9ccd0;border:1px solid #6d7278;border-radius:4px 4px 2px 2px;
  transform-origin:50% 40%;opacity:0;will-change:transform,opacity;z-index:2}
.bar{position:absolute;left:0;right:0;top:0;height:${WIN.bar}px;background:#a3a8ae;border-bottom:1px solid #7d8288;border-radius:3px 3px 0 0;
  display:flex;align-items:center;justify-content:space-between;padding:0 10px}
.ttl{font-family:var(--im);font-weight:700;font-size:14px;color:#1d2024;white-space:nowrap}
.src{font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:#2d3136;white-space:nowrap}
.log{position:absolute;left:6px;right:6px;top:${WIN.bar + 6}px;bottom:6px;background:#0d1014;border:1px solid #5d636a;overflow:hidden}
.logc{position:absolute;left:0;right:0;top:0;padding:${WIN.pad}px ${WIN.pad}px 0}
.msg{font-family:var(--im);font-size:${WIN.font}px;line-height:1.32;color:#f4f7f5;margin:0 0 9px;word-wrap:break-word}
.msg b{font-weight:700}
.msg b.zk{color:var(--acc)}
.msg b.fr{color:${BLUE}}
.msg .rest{visibility:hidden}

/* ---- the mascot, behind his clip line ---- */
#mas-cut{position:absolute;inset:0;z-index:6}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- s7: the line ---- */
#big{position:absolute;left:${BIGL.l}px;top:${BIGL.top}px;font-family:var(--display);color:#f4f7f5;line-height:${BIGL.lh};white-space:nowrap;z-index:5;
  text-shadow:0 0 10px rgba(255,255,255,.22)}
#big .bl{display:block}
#big .bw{display:inline-block;opacity:0;transform-origin:50% 80%;will-change:transform,opacity}

/* ---- the subtitles, one slot under everything ---- */
.subt{position:absolute;left:${MARGIN}px;right:${MARGIN}px;top:${ST.top}px;text-align:center;z-index:9;
  font-family:var(--cap);font-weight:${ST.weight};font-size:${ST.size}px;line-height:1.3;color:var(--sub);white-space:nowrap;opacity:0;will-change:transform,opacity}

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
.gl .r{filter:url(#p40-r)}
.gl .g{filter:url(#p40-g)}
.gl .b{filter:url(#p40-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${Object.entries(TABLER).map(([k, ds]) => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ds.map(d => '<path d="' + d + '"/>').join('') + '</symbol>').join('\n  ')}
  ${chan('p40-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p40-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('p40-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
</defs></svg>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="s16">
    <div id="s1">
      <div id="yr-w">${kineticMarkup('yr', YEAR)}</div>
      <div id="lab"></div>
      ${slotImg('zk', 'zuck', SLOT.zuck)}
      ${slotImg('fbk', 'fb', SLOT.fb)}
    </div>
    <div id="idl">${idLines}</div>
    <div id="cam">
      <div class="top" id="top0">${TOPS[0]}</div>
      <div class="top" id="top1">${TOPS[1]}</div>
      <div id="cnt">0</div>
      ${TILES.map((q, i) => '<div class="tl" id="tl' + i + '" style="left:' + q.x + 'px;top:' + q.y + 'px"><svg aria-hidden="true"><use href="#i-' + q.g + '"/></svg></div>').join('\n      ')}
      ${windowHtml(0)}
      ${windowHtml(1)}
    </div>
  </div>
  <div id="s7"><div id="big">${bigLines}</div>
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
window.__P40 = ${JSON.stringify({ LABEL, VW, VH, WM, SLICES: GL.slices, MSGS: MSGS.map(m => m.text), CHAT: MSGS.map(m => m.chat), TRUST, SUBS: CARDS.map(c => c.text), NT: TILES.length, NB: BIGW.length, BIGW: BIGL.w, IDW: IDL.w })};
${mascotRuntime()}
${motionApply.toString()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('${ST.weight} ${ST.size}px Nunito')].concat([].slice.call(document.images).map(function (im) { return im.decode().catch(function () {}); })))
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p40.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P40;
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const s16 = $('s16'), s7 = $('s7'), s1 = $('s1'), lab = $('lab');
  const zk = $('zk'), fbk = $('fbk');
  const idl = $('idl'), ils = [0, 1, 2].map(k => $('il' + k)), hot = $('hot');
  const cam = $('cam'), cnt = $('cnt');
  const wins = [$('win0'), $('win1')], logs = [$('log0'), $('log1')], logcs = [$('logc0'), $('logc1')], tops = [$('top0'), $('top1')];
  const msgs = P.MSGS.map((_, i) => $('m' + i));
  const ty = msgs.map(m => m.querySelector('.ty')), rest = msgs.map(m => m.querySelector('.rest'));
  const tiles = []; for (let i = 0; i < P.NT; i++) tiles.push($('tl' + i));
  const bws = []; for (let i = 0; i < P.NB; i++) bws.push($('bw' + i));
  const big = $('big');
  const mcut = $('mas-cut');
  const subt = $('subt');
  const wm = $('wm');
  const gl = $('gl');
  const chans = ['r', 'g', 'b'].map(k => $('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push($('sl' + i)); sliceImgs.push($('sl' + i + 'i')); }
  const shown = msgs.map(() => -2);
  let lastSub = -2;
  const fitTo = (el, sel, w) => {
    el.style.fontSize = '100px';
    let m = 0;
    for (const l of el.querySelectorAll(sel)) m = Math.max(m, l.getBoundingClientRect().width);
    el.style.fontSize = (100 * w / m).toFixed(2) + 'px';
  };
  const pic = (el, q) => { if (!el) return; el.style.opacity = q.o; el.style.transform = 'translateY(' + q.y + 'px) rotate(' + q.r + 'deg) scale(' + q.s + ')'; };
  window.__p40 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      fitTo(big, '.bl', P.BIGW);
      fitTo(idl, '.il', P.IDW);
      /* every message laid out whole, so typing never reflows a log */
      for (let i = 0; i < msgs.length; i++) { ty[i].textContent = P.MSGS[i]; rest[i].textContent = ''; }
      const log = [0, 1].map(c => { const lr = logs[c].getBoundingClientRect(), cr = logcs[c].getBoundingClientRect(); return { l: cr.left + parseFloat(getComputedStyle(logcs[c]).paddingLeft), t: cr.top, h: lr.height - 2 }; });
      const top = msgs.map((m, i) => m.getBoundingClientRect().top - logcs[P.CHAT[i]].getBoundingClientRect().top), h = msgs.map(m => m.getBoundingClientRect().height);
      const lines = msgs.map(m => Math.round(m.getBoundingClientRect().height / parseFloat(getComputedStyle(m).lineHeight)));
      for (let i = 0; i < msgs.length; i++) ty[i].textContent = '';
      return { log, top, h, lines, bigFont: +parseFloat(big.style.fontSize).toFixed(2), idFont: +parseFloat(idl.style.fontSize).toFixed(2) };
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
      s16.style.display = o.s16 ? 'block' : 'none';
      s7.style.display = o.s7 ? 'block' : 'none';
      s1.style.opacity = o.s1.o; s1.style.transform = 'scale(' + o.s1.s + ')';
      motionApply(o.yr);
      lab.style.opacity = o.lab.o;
      if (lab.dataset.n !== String(o.lab.n)) { lab.dataset.n = o.lab.n; lab.textContent = P.LABEL.slice(0, o.lab.n); }
      pic(zk, o.zk); pic(fbk, o.fb);
      idl.style.opacity = o.idl.o; idl.style.transform = 'scale(' + o.idl.s + ')';
      for (let k = 0; k < 3; k++) { ils[k].style.opacity = o.idl.lines[k].o; ils[k].style.transform = 'translateY(' + o.idl.lines[k].y + 'px) scale(' + o.idl.lines[k].s + ')'; }
      hot.style.color = o.idl.hot > 0 ? 'color-mix(in srgb, var(--acc) ' + (o.idl.hot * 100).toFixed(1) + '%, #f4f7f5)' : '';
      hot.style.textShadow = o.idl.hot > 0 ? '0 0 12px rgba(53,255,106,' + (0.30 * o.idl.hot).toFixed(3) + ')' : '';
      hot.style.transform = 'scale(' + o.idl.punch + ')';
      cam.style.transform = 'translate(' + o.cam.x + 'px,' + o.cam.y + 'px) scale(' + o.cam.s + ')';
      for (let c = 0; c < 2; c++) {
        wins[c].style.opacity = o.win[c].o; wins[c].style.transform = 'translateX(' + o.win[c].x + 'px) scale(' + o.win[c].s + ')';
        tops[c].style.opacity = o.win[c].o; tops[c].style.transform = 'translateX(' + o.win[c].x + 'px)';
        logcs[c].style.transform = 'translateY(' + (-o.scroll[c]) + 'px)';
      }
      for (let i = 0; i < msgs.length; i++) {
        const n = o.msgs[i];
        msgs[i].style.visibility = n < 0 ? 'hidden' : 'visible';
        msgs[i].style.opacity = P.CHAT[i] === 0 || i >= P.TRUST ? 1 : o.dim;
        if (n !== shown[i] && n >= 0) { ty[i].textContent = P.MSGS[i].slice(0, n); rest[i].textContent = P.MSGS[i].slice(n); }
        shown[i] = n;
      }
      cnt.style.opacity = o.cnt.o; cnt.style.transform = 'translateX(-50%) scale(' + o.cnt.s + ')';
      cnt.textContent = String(o.cnt.v);
      for (let i = 0; i < tiles.length; i++) {
        const q = o.tiles[i];
        tiles[i].style.opacity = q.o;
        tiles[i].style.transform = 'translateY(' + q.y + 'px) rotate(' + tiles[i].dataset.r + 'deg) scale(' + q.s + ')';
      }
      for (let i = 0; i < bws.length; i++) { const b = o.big[i]; bws[i].style.opacity = b.o; bws[i].style.transform = 'translateY(' + b.y + 'px) scale(' + b.s + ')'; }
      mcut.style.display = o.s16 || o.s7 ? 'block' : 'none';
      if (o.subt.i !== lastSub) { lastSub = o.subt.i; subt.textContent = o.subt.i < 0 ? '' : P.SUBS[o.subt.i]; }
      subt.style.opacity = o.subt.o; subt.style.transform = 'translateY(' + o.subt.y + 'px)';
      stage.style.setProperty('--wm-o', o.wm.o);
      stage.style.setProperty('--wm-s', o.wm.sc);
      stage.style.setProperty('--wm-glow', o.wm.glow);
      gl.style.display = 'none';
    },
    rot(rs) { for (let i = 0; i < tiles.length; i++) tiles[i].dataset.r = rs[i]; },
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
  const files = { '/zuck.png': 'zuck', '/fb.png': 'fb' };
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = req.url.split('?')[0];
      if (files[p] && HAS[files[p]]) { res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(PICS[files[p]])); }
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

console.log('\npost40, trust me. ' + SECONDS + 's, ' + FPS + 'fps. pictures: ' + Object.entries(HAS).map(([k, v]) => k + (v ? '' : ' missing, slot empty')).join(', '));
for (const [t, what] of [[0, 's1, 2004'], [PEEK1.at, 'he peeks'], [POPS.zuck, 'the photo'], [LABT.at, 'the label'], [POPS.fb, 'the logo'], [S.idiot, 's1b, idiots'], [IDIOT_AT, 'idiots goes green'],
  [S.c1, 'c1, the rival chat'], [RB.at, 'the rival bleep'], [SLIDE.at, 'it slides off'], [S.c2, 's2, the second chat'], [S.count, 's3, 4000'], [S.how, 's4, the ask'], [S.trust, 's5, trust me, the zoom and the squint'],
  [S.two, 's6, then two more words'], [BLEEP.at, 'the bleep and the message, the hold'], [S.end, 's7, black'], [S7.at, 'the head, centred'], [BIGW[0].at, 'the line'], [CUT, 'the end card'], [SECONDS, 'the end']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
/* ---------- the bus: eleven reads and two bleeps, to -14 ---------- */
const VTRACK = new Float32Array(Math.ceil((SECONDS + 0.5) * SR));
let speechRms = 0, speechN = 0;
for (const T of TAKES) {
  const a = Math.max(0, Math.round((T.edge.start - PRE) * SR)), b = Math.min(T.pcm.length, Math.round((T.edge.end + POST) * SR));
  const at = Math.round((T.at - T.edge.start) * SR), fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + i;
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += T.pcm[i] * g;
    if (Math.abs(T.pcm[i]) > 0.02) { speechRms += T.pcm[i] * T.pcm[i]; speechN++; }
  }
}
/* post39's tone: a clean 1 khz at the read's own level, 5ms ramps both ends */
{
  const amp = Math.sqrt(speechRms / Math.max(1, speechN)) * Math.SQRT2 * 0.9;
  const rmp = Math.round(0.005 * SR);
  for (const [a, b, over] of [[RB.at, RB.to, true], [BLEEP.at, BLEEP.at + BLEEP.for, false]]) {
    const b0 = Math.round(a * SR), n = Math.round((b - a) * SR);
    for (let i = 0; i < n; i++) {
      const e = Math.min(1, i / rmp, (n - i) / rmp);
      if (over) VTRACK[b0 + i] *= 1 - e;
      VTRACK[b0 + i] += amp * e * Math.sin(2 * Math.PI * 1000 * i / SR);
    }
  }
}
const WAV = path.join(OUT, 'post40-mix.wav'), RAW = path.join(OUT, 'post40-mix-raw.wav');
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
  for (const q of ['400 40px "Michroma"', ST.weight + ' ' + ST.size + 'px "Nunito"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  const built = await page.evaluate(() => window.__built);
  LAY = built;
  await page.evaluate(rs => window.__p40.rot(rs), TILES.map(q => q.rot));

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__p40.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p40.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the margin, the app zone, and the subtitles never on a window */
  const fails = [];
  const SB = { l: MARGIN, t: MARGIN, r: VW - MARGIN, b: VH - APP_ZONE };
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    await put(t, Math.round(t * FPS));
    const zoomed = t > ZOOM.from + 0.05 && t < S.end;
    const sliding = t > SLIDE.at && t < SLIDE.at + SLIDE.for + 0.05;
    for (const sel of ['#yr', '#lab', '#zk', '#fbk', '#idl', ...(zoomed ? [] : ['#top1', '#win1', '#cnt']), ...(sliding ? [] : ['#top0', '#win0']), '#subt', '#big', '#m-card']) {
      const r = await page.evaluate(s => window.__p40.rect(s), sel);
      if (!r || !r.w) continue;
      const bottom = r.b;
      if (r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || bottom > SB.b + 0.5) fails.push(sel + ' past the margin at ' + t.toFixed(1) + 's: ' + [r.l, r.t, r.r, bottom].map(v => v.toFixed(1)).join(' / '));
    }
    const s = await page.evaluate(() => window.__p40.rect('#subt'));
    for (const w of ['#win0', '#win1', '#zk']) {
      const b = await page.evaluate(x => window.__p40.rect(x), w);
      if (s && b && s.w && s.t < b.b && b.t < s.b && s.l < b.r && b.l < s.r) fails.push('the subtitle is on ' + w + ' at ' + t.toFixed(1) + 's');
    }
    if (zoomed && t >= FREEZE.from) {
      for (const k of [TRUST, TRUST + 1]) {
        const r = await page.evaluate(i => { const e = document.getElementById('m' + i); const b = e.getBoundingClientRect(); return { l: b.left, r: b.left + e.querySelector('.ty').getBoundingClientRect().width + e.querySelector('b').getBoundingClientRect().width + 8, t: b.top, b: b.bottom }; }, k);
        if (r.l < SB.l - 0.5 || r.r > SB.r + 0.5 || r.t < SB.t || r.b > SB.b) fails.push('message ' + (k + 1) + ' is past the margin in the zoom: ' + [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / '));
      }
    }
  }
  /* the head: whole in frame, and never on the subtitle slot or a window */
  for (let t = PEEK1.at + PEEK1.for + 0.2; t < CUT - 0.05; t += 0.25) {
    await put(t, Math.round(t * FPS));
    const m = await page.evaluate(() => { const r = document.getElementById('m-card').getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
    if (m.b > ST.top - 4) fails.push('the head reaches ' + m.b.toFixed(1) + ' at ' + t.toFixed(2) + 's, onto the subtitles at ' + ST.top);
    for (const w of ['#win0', '#win1', '#big', '#zk', '#fbk']) {
      if (t > ZOOM.from && t < S.end && w === '#win1') continue;
      const b = await page.evaluate(x => window.__p40.rect(x), w);
      if (b && b.w && m.t < b.b && b.t < m.b && m.l < b.r && b.l < m.r) { fails.push('the head is on ' + w + ' at ' + t.toFixed(2) + 's'); break; }
    }
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p40.rect('#wm'));
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
  return { frames: N, glitched, fails, lines: built.lines };
}

const state = await render();
const FILE = path.join(OUT, 'post40-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
/* post39's correction: the mp4 is measured and the audio re-aimed if it is off */
for (let i = 0; i < 2; i++) {
  const got = loudness(ffmpeg, FILE);
  if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
  const fixed = path.join(OUT, 'post40-mix-fix.wav'), tmp = path.join(OUT, 'post40-tmp.mp4');
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
  if (gap > 0.6 && TAKES[i] !== T_TWO) fail.push('a ' + gap.toFixed(2) + 's gap in the voice before line ' + (i + 2));
}
if (T_YEAR.at > 0.6) fail.push('the voice starts at ' + T_YEAR.at);
if (RB.to - RB.at < 0.12) fail.push('the rival bleep is too short to cover the word');
if (BLEEP.at < T_TWO.end + 0.1) fail.push('the bleep is on the narrator');
/* most chat lines are one line; a long one may wrap */
const oneLine = state.lines.filter(n => n === 1).length;
if (oneLine * 2 <= MSGS.length) fail.push('only ' + oneLine + ' of ' + MSGS.length + ' chat messages fit on one line');
/* the hold: nothing that moves is allowed a different frame in it */
{
  const a = JSON.stringify([frameAt(FREEZE.from, 0), compose(FREEZE.from)]);
  for (let t = FREEZE.from; t < FREEZE.to; t += 1 / 60) if (JSON.stringify([frameAt(t, 0), compose(t)]) !== a) { fail.push('something moves in the hold at ' + t.toFixed(2)); break; }
}
for (let f = 0, run = 0; f < CUT * 60; f++) { run = lidAt(f / 60) >= 0.98 ? run + 1 : 0; if (run / 60 > 0.3) { fail.push('the eyes are shut too long at ' + (f / 60).toFixed(2)); break; } }
const lu = loudness(ffmpeg, FILE);
if (!lu || !lu.ok) fail.push('the loudness could not be measured');
else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fail.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
console.log('\n  chat lines on one line: ' + oneLine + ' of ' + MSGS.length);
console.log('  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
console.log('  ' + state.glitched + ' glitched frames, sheets in ' + path.relative(ROOT, VERIFY));
console.log('  length ' + seconds.toFixed(2) + 's, eleven reads and two bleeps on the bus, ' + path.relative(ROOT, FILE));
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('  guards: all green');
