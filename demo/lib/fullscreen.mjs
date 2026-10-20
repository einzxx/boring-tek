/* the boring tek — the full screen footage template, post67 on.

   one call makes a 10 to 15 second 1080x1920 clip out of a real footage file,
   the mascot's lines and a few big words. it is a front end to the rig in
   lib/aiafter.mjs, which still does the read, the render, the glitch into the
   card, the mix and every guard. nothing here changes an earlier clip.

   - the footage fills the whole phone screen. each shot is cropped to vertical
     round where its picture is busiest, found by ffmpeg at low resolution:
     edges plus movement, smoothed so the crop drifts rather than jitters.
     every move is clamped to keep the frame covered, so there are never bars.
     a slow push on every shot, punch ins on the words asked for, a kick on
     every cut, the first shot dropping in from 1.2 on frame 0.
   - huge karaoke captions over the footage, Space Grotesk 500 at 92px, white
     with a soft dark shadow so they read on any picture, the word being said
     green #3dff6e. one to three words a page off the real voice timestamps.
   - a few big Michroma words slam in on their spoken word.
   - the mascot, optional, small in a corner, the plain white head with his
     white deep glow floating on the footage, no disc or ring, popping in
     for each reaction and out again.
   - his own voice, MASCOT_VOICE_ID, eleven_v4, tempo 1.16, every take heard
     back with speech to text.
   - real Mixkit effects where they help, one sound a moment, and **no music
     bed by default**: the clip gets its music on the platforms. a bed ducked
     under the voice and out for a short silence before the payoff, -14 LUFS.
   - a small source credit at the bottom, above the app zone, only for
     footage whose license asks for one. Pexels and Mixkit need none.
   - the post65 ending: one glitch into THE BORING TEK, its sound on exactly
     its frames, the card 1.5s, the end.

   a time is seconds, or a spoken word: 'caught' is its first time in the read,
   'caught#2' the second. see The full screen template in demo/README.md.

     node postNN.mjs --takes     read the lines, print the words, stop
     node postNN.mjs --stills    one still per beat, no render, no sound
     DEMO_FPS=12 node postNN.mjs the preview
     node postNN.mjs             60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {
  runEpisode, readLines, place, span, lerp, smooth, bump, wordIn,
  CURVE, CURVE56, hitPulse, peakAt, FPS,
} from './aiafter.mjs';
import { SR, VOICES, GAINS, decode } from './sfx.mjs';

const DEMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const stop = why => { console.error('\nSTOPPED. ' + why); process.exit(1); };

/* the stage is 540x960 css, drawn at 2x */
const W = 540, H = 960;
const BLACK = '#050506', GREEN = '#3dff6e', WHITE = '#ffffff';
const TEMPO = 1.16, GAP = 0.25, SLAM0 = -0.12;
/* captions at 62% of the height, rule 8, a page at most this wide */
/* 92px, 46 css: **this template breaks rule 7's 72px cap, Einz's call
   2026-10-20,** so the words read over moving footage. a wide page comes
   down to 72px, never under */
const CAP_Y = 595, CAP_W = 420, CAP_PX = 46, CAP_MIN = 36;
/* the corners for him, inside the 60px margin and over the app zone */
const BUB_R = 44;
const CORNERS = {
  tl: { x: 60 + BUB_R + 6, y: 100 + BUB_R }, tr: { x: W - 60 - BUB_R - 6, y: 100 + BUB_R },
  bl: { x: 60 + BUB_R + 6, y: 810 - 40 - BUB_R }, br: { x: W - 60 - BUB_R - 6, y: 810 - 40 - BUB_R },
};
const SHADOW = '0 2px 3px rgba(0,0,0,.55),0 0 14px rgba(0,0,0,.55),0 0 34px rgba(0,0,0,.38)';

/* ---------- the footage ---------- */
function probe(file) {
  const err = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr || '';
  const d = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/), v = err.match(/Video:.*?\s(\d{2,5})x(\d{2,5})/);
  if (!d || !v) stop('ffmpeg cannot read ' + file);
  const rot = /rotate\s*:\s*(-?90|270)/.test(err) || /rotation of -?90/.test(err);
  const w = +v[1], h = +v[2];
  return { secs: +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]), w: rot ? h : w, h: rot ? w : h };
}

/* each shot's frames cut once to jpegs at the clip's fps, named from 0 at its
   first source second, and cut again only when the footage or the range moves.
   no bigger than a 1.25 punch in at 1080x1920 needs */
function cutFrames(dir, file, src, A, D) {
  const s = Math.min(1, 1 / (Math.max(1080 / src.w, 1920 / src.h) * 1.25));
  const ew = Math.round(src.w * s / 2) * 2, eh = Math.round(src.h * s / 2) * 2;
  const stamp = { file: path.basename(file), mtime: fs.statSync(file).mtimeMs, A, D, fps: FPS, ew, eh };
  const sf = path.join(dir, 'stamp.json');
  if (fs.existsSync(sf) && JSON.stringify(JSON.parse(fs.readFileSync(sf, 'utf8'))) === JSON.stringify(stamp)) return stamp;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(A), '-i', file, '-t', String(D), '-an',
    '-vf', 'fps=' + FPS + ',scale=' + ew + ':' + eh + ':flags=lanczos', '-q:v', '2', '-start_number', '0', path.join(dir, 'f%05d.jpg')]);
  fs.writeFileSync(sf, JSON.stringify(stamp));
  return stamp;
}

/* the smart crop: where in the picture to look, over the shot's source time.
   the footage at 128px wide, grey, 10 frames a second: every pixel scores its
   edges plus three times its change since the last frame. the crop window that
   holds the most of it wins, with a small pull to the middle, and its centre
   is smoothed both ways in time and held to a slow drift */
function autoFocus(file, src, A, D) {
  const lw = 128, lh = Math.max(16, Math.round(128 * src.h / src.w / 2) * 2), n = lw * lh, RATE = 10;
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-ss', String(A), '-i', file, '-t', String(D), '-an',
    '-vf', 'fps=' + RATE + ',scale=' + lw + ':' + lh + ',format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
  const frames = Math.floor(raw.length / n);
  if (!frames) stop('no picture in ' + path.basename(file) + ' from ' + A + 's');
  /* the window at no zoom, as a share of the frame */
  const k = Math.max(W / src.w, H / src.h), ww = W / k / src.w, wh = H / k / src.h;
  const cw = Math.max(1, Math.round(ww * lw)), chh = Math.max(1, Math.round(wh * lh));
  const pts = [];
  for (let f = 0; f < frames; f++) {
    const I = raw.subarray(f * n, (f + 1) * n), P = f ? raw.subarray((f - 1) * n, f * n) : null;
    const col = new Float64Array(lw), row = new Float64Array(lh);
    for (let y = 0; y < lh - 1; y++) for (let x = 0; x < lw - 1; x++) {
      const i = y * lw + x;
      const e = Math.abs(I[i + 1] - I[i]) + Math.abs(I[i + lw] - I[i]) + (P ? 3 * Math.abs(I[i] - P[i]) : 0);
      col[x] += e; row[y] += e;
    }
    const best = (arr, len, size) => {
      let s = 0; for (let i = 0; i < size; i++) s += arr[i];
      let top = -1, at = 0;
      for (let a = 0; a + size <= len; a++) {
        if (a) s += arr[a + size - 1] - arr[a - 1];
        const c = (a + size / 2) / len, v = s * (1 - 0.3 * Math.abs(c - 0.5));
        if (v > top) { top = v; at = c; }
      }
      return at;
    };
    pts.push({ s: A + f / RATE, x: cw >= lw ? 0.5 : best(col, lw, cw), y: chh >= lh ? best(row, lh, Math.round(lh * 0.6)) : best(row, lh, chh) });
  }
  /* zero phase smoothing, about 0.7s, then at most a fifth of the frame a second */
  const a = 1 - Math.exp(-1 / (RATE * 0.7));
  for (const key of ['x', 'y']) {
    for (let i = 1; i < pts.length; i++) pts[i][key] += (pts[i - 1][key] - pts[i][key]) * (1 - a);
    for (let i = pts.length - 2; i >= 0; i--) pts[i][key] += (pts[i + 1][key] - pts[i][key]) * (1 - a);
    for (let i = 1; i < pts.length; i++) pts[i][key] = pts[i - 1][key] + Math.max(-0.02, Math.min(0.02, pts[i][key] - pts[i - 1][key]));
  }
  return pts.map(p => ({ s: f3(p.s), x: f3(p.x), y: f3(p.y) }));
}
const focusAt = (pts, s) => {
  if (s <= pts[0].s) return pts[0];
  for (let i = 1; i < pts.length; i++) if (s < pts[i].s) { const q = (s - pts[i - 1].s) / (pts[i].s - pts[i - 1].s); return { x: lerp(pts[i - 1].x, pts[i].x, q), y: lerp(pts[i - 1].y, pts[i].y, q) }; }
  return pts[pts.length - 1];
};

/* ---------- the captions: the read, one to three words a page ---------- */
const show = w => { const c = w.replace(/[^A-Za-z0-9]/g, ''); return /^[A-Z0-9]{2,}$/.test(c) && /[A-Z]/.test(c) ? c : c.toLowerCase(); };
function autoPages(TAKES) {
  const out = [];
  TAKES.forEach((T, li) => {
    let cur = [];
    const close = () => { if (cur.length) out.push([li, cur.join(' ')]); cur = []; };
    for (const w of T.W) {
      const d = show(w.word);
      if (!d) continue;
      if (cur.length && (cur.length >= 3 || (cur.join(' ') + ' ' + d).length > 14)) close();
      cur.push(d);
      if (/[.,?!;]$/.test(w.word.trim())) close();
    }
    close();
  });
  return out;
}
function timePages(TAKES, txt, say = {}) {
  const cur = TAKES.map(() => 0), out = [];
  for (const [li, line] of txt) {
    const T = TAKES[li], words = [];
    for (const d of line.split(' ')) {
      const want = letters(say[d] || d);
      let got = '', a = cur[li];
      while (cur[li] < T.W.length && got.length < want.length) got += letters(T.W[cur[li]++].word);
      if (got !== want) throw new Error('caption "' + line + '" does not match the read of line ' + (li + 1) + ': ' + T.W.map(q => q.word).join(' '));
      words.push({ txt: d, start: T.W[a].start, end: T.W[cur[li] - 1].end });
    }
    out.push({ li, txt: line, words, from: f3(words[0].start - 0.05), to: f3(words[words.length - 1].end + 0.3) });
  }
  for (let i = 0; i + 1 < out.length; i++) out[i].to = Math.min(out[i].to, out[i + 1].from);
  return out;
}
/* the pauses inside a line, tightened: eleven_v4 holds about 0.7s on every
   full stop, which on a short clip is dead air. the longest quiet run between
   two word starts, quiet meaning under -40dB of the take's peak in every 5ms, is cut
   down to `max` seconds, its middle taken out with a 5ms crossfade, half of
   `max` kept on each side. after a
   full stop the breath goes too, see below. words are never touched, and
   their times move with the cut */
export function tighten(T, max) {
  const pcm = T.pcm, H = Math.round(0.005 * SR);
  let peak = 0; for (const v of pcm) peak = Math.max(peak, Math.abs(v));
  const lvl = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m; };
  const cuts = [];
  for (let i = 0; i + 1 < T.words.length; i++) {
    /* from the word's start, since the aligner's word ends run on into the
       pause, to a little past the next word's start, since it can come late */
    const a = Math.ceil(T.words[i].start * SR / H), b = Math.floor(Math.min(T.words[i + 1].start + 0.15, T.words[i + 1].end) * SR / H);
    /* the longest run under the gate between them is the pause. after a full
       stop or a question mark the gate is -18dB, so the breath goes with the
       silence, as an editor would; a word's own sound, its onset and a
       fricative tail, is louder and bounds the run. else it is -40dB, true
       silence. a stop inside a word is far shorter than any pause */
    const gate = peak * Math.pow(10, (/[.?!]$/.test(T.words[i].word.trim()) ? -18 : -40) / 20);
    let best = [0, 0], run = null;
    for (let k = a; k <= b; k++) {
      if (lvl(k) <= gate) { if (!run) run = [k, k]; run[1] = k + 1; if (run[1] - run[0] > best[1] - best[0]) best = [...run]; } else run = null;
    }
    const len = (best[1] - best[0]) * H / SR;
    if (len > max + 0.02) cuts.push({ a: best[0] * H / SR + max / 2, b: best[1] * H / SR - max / 2 });
  }
  if (!cuts.length) return 0;
  const X = Math.round(0.005 * SR), parts = [];
  let from = 0;
  for (const c of cuts) { parts.push([from, Math.round(c.a * SR)]); from = Math.round(c.b * SR); }
  parts.push([from, pcm.length]);
  const out = new Float32Array(parts.reduce((n, [a, b]) => n + b - a, 0));
  let o = 0;
  parts.forEach(([a, b], pi) => {
    for (let i = a; i < b; i++, o++) {
      let g = 1;
      if (pi > 0 && i - a < X) g = (i - a) / X;
      if (pi + 1 < parts.length && b - i < X) g = Math.min(g, (b - i) / X);
      out[o] = pcm[i] * g;
    }
  });
  const shift = t => { let d = 0; for (const c of cuts) if (t >= c.b) d += c.b - c.a; return t - d; };
  T.words = T.words.map(w => ({ ...w, start: +shift(w.start).toFixed(4), end: +shift(w.end).toFixed(4) }));
  T.edge = { start: +shift(T.edge.start).toFixed(4), end: +shift(T.edge.end).toFixed(4) };
  T.pcm = out;
  return cuts.reduce((n, c) => n + c.b - c.a, 0);
}

const backOut = q => 1 + 2.70158 * (q - 1) ** 3 + 1.70158 * (q - 1) ** 2;

/* ---------- the sound kit, real Mixkit files in demo/assets/sfx-mixkit ----------
   [file, peak dB, run up before the hit] */
const KIT = {
  swooshwhoosh: ['mixkit-3115-fast-transitions-swoosh.mp3', -17, 0.1],
  fastwhoosh: ['mixkit-1490-fast-whoosh-transition.mp3', -18, 0.3],
  arrowwhoosh: ['mixkit-1491-arrow-whoosh.mp3', -19, 0.08],
  thud: ['mixkit-2150-impact-of-a-blow.mp3', -11, 0.02],
  basshit: ['mixkit-2299-short-bass-hit.mp3', -12, 0.02],
  popLight: ['mixkit-3005-explainer-video-pops-whoosh-light-pop.mp3', -13, 0.01],
  mkGlitch: ['mixkit-2951-digital-glitch-break.mp3', -15, 9],
};
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
/* each file trimmed to its first sound, at most its run up before its loudest
   10ms, and that hit is what lands on the moment */
function loadKit() {
  const MK = path.join(DEMO, 'assets', 'sfx-mixkit'), PEAK = {};
  for (const [k, [file, gain, runUp]] of Object.entries(KIT)) {
    if (!fs.existsSync(path.join(MK, file))) stop('demo/assets/sfx-mixkit/' + file + ' is missing, see its LICENSES.md for the source.');
    const raw = Float32Array.from(decode(ffmpeg, path.join(MK, file)));
    let pk = 0; for (const v of raw) pk = Math.max(pk, Math.abs(v));
    if (pk > 0) for (let i = 0; i < raw.length; i++) raw[i] /= pk;
    let onset = 0; while (onset < raw.length && Math.abs(raw[onset]) < 0.03) onset++;
    const Wn = Math.round(0.01 * SR); let best = 0, at = onset;
    for (let i = 0; i + Wn < raw.length; i += Wn) { let e = 0; for (let j = i; j < i + Wn; j++) e += raw[j] * raw[j]; if (e > best) { best = e; at = i; } }
    const a = Math.max(onset, at - Math.round(runUp * SR));
    const b = Float32Array.from(raw.subarray(a));
    const fi = Math.round(0.004 * SR); for (let i = 0; i < fi && i < b.length; i++) b[i] *= i / fi;
    PEAK[k] = Math.max(0, at - a) / SR;
    VOICES[k] = () => b; GAINS[k] = gain;
  }
  return PEAK;
}

/* ==========================================================================
   fullscreen(C)

   post        the post number, out to demo/out/postNN-dark-1080x1920.mp4
   name        optional, another name for the outputs, a test
   footage     the file, relative to demo/, ignored by git, never pushed, or
               a named set { hood: 'assets/a.mp4', rack: 'assets/b.mp4' }
   credit      optional, one or two short lines at the bottom, only for
               footage whose license asks for a credit. Pexels does not
   lines       the read: '[tag] text' or { text, take, pause }. `pause` is a
               planned silence before the line, the payoff's
   shots       [{ at, clip, src, speed, focus, push }]: from `at` the footage `clip` plays
               from `src` seconds. the first is at 0. `focus` [x, y] in 0..1
               pins the crop, else it is found. `speed` under 1 is slow motion,
               blended frame to frame. no two shots may share source frames
   punches     [{ at, by, focus }]: a punch in, `by` 0.12 by default
   big         [{ at, text, hold, green }]: a big word slams in. at 0 it is
               mid slam on frame 0
   payoff      a time: the green flash, a hit, a bed if there is one out just before it
   mascot      null, or { corner: 'tl' | 'tr' | 'bl' | 'br', react: [{ at, mood, for }] },
               mood happy, squint, look or neutral
   pages       optional [[line, 'one to three words']], else split from the read
   say         optional { '2028': 'twenty twenty eight' } for pages
   music       none by default. { prompt, level } only if a clip wants a bed
   tighten     the longest pause kept inside a line, 0.3s, or false
   ========================================================================== */
export async function fullscreen(C) {
  const NAME = C.name || 'post' + C.post;
  const STILLS_RUN = process.argv.includes('--stills');

  /* ---------- the read: him, in his own voice ---------- */
  const LINES = C.lines.map((l, i) => {
    const o = typeof l === 'string' ? { text: l } : l;
    return { key: 'r' + (i + 1), text: o.text, tempo: TEMPO, ...(o.take ? { take: o.take } : {}), pause: o.pause };
  });
  const TAKES = await readLines(C.post, LINES.map(({ pause, ...l }) => l), 3, { model: 'eleven_v4', voice: 'host', hear: true });
  TAKES.forEach((T, i) => { T.i = i; });
  /* `tighten`, the longest pause kept inside a line, 0.3s by default, false for none */
  if (C.tighten !== false) for (const T of TAKES) {
    const cut = tighten(T, C.tighten ?? 0.3);
    if (cut) console.log('  line ' + (T.i + 1) + ' tightened by ' + cut.toFixed(2) + 's');
  }
  place(TAKES[0], 0);
  place(TAKES[0], 0.2 - TAKES[0].W[0].start);
  for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (LINES[i].pause ?? GAP));
  if (process.argv.includes('--takes')) {
    for (const T of TAKES) {
      console.log('\n' + T.name + '  ' + T.all.join(' | '));
      console.log('  heard: ' + T.heard);
      console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
    }
    process.exit(0);
  }
  const LAST = TAKES[TAKES.length - 1];
  /* a time: seconds, or a spoken word, 'word#n' for its nth time in the read */
  const ALLW = TAKES.flatMap(T => T.W);
  const when = ref => {
    if (typeof ref === 'number') return ref;
    const [w, nth] = String(ref).split('#'), want = letters(w);
    let n = +(nth || 1);
    for (const q of ALLW) if (letters(q.word) === want && --n === 0) return f3(q.start - 0.04);
    throw new Error('no word "' + ref + '" in the read: ' + ALLW.map(q => q.word).join(' '));
  };
  /* the house ending: one glitch into THE BORING TEK, held 1.5s, the end */
  const FL = { at: f3(LAST.end + 0.05), for: 1.5, card: true, out: false };
  const END = f3(FL.at + FL.for);
  const PAY = C.payoff != null ? when(C.payoff) : null;

  /* ---------- the shots ---------- */
  /* one file, or a named set of them that each shot picks from with `clip` */
  const FILES = typeof C.footage === 'string' ? { main: C.footage } : C.footage;
  const MEDIA = {};
  for (const [key, rel] of Object.entries(FILES)) {
    const file = path.resolve(DEMO, rel);
    if (!fs.existsSync(file)) stop(rel + ' is missing. it is ignored by git, see demo/assets/LICENSES.md for where it comes from.');
    MEDIA[key] = { file, ...probe(file) };
  }
  const SHOTS = C.shots.map(s => {
    const clip = s.clip ?? Object.keys(FILES)[0];
    if (!MEDIA[clip]) throw new Error('no footage named ' + clip + ', only ' + Object.keys(FILES).join(', '));
    return { ...s, clip, at: when(s.at), speed: s.speed ?? 1, push: s.push ?? 0.04 };
  }).sort((a, b) => a.at - b.at);
  if (SHOTS[0].at !== 0) throw new Error('the first shot starts at 0');
  SHOTS.forEach((S, k) => {
    S.k = k; S.end = k + 1 < SHOTS.length ? SHOTS[k + 1].at : FL.at;
    S.A = Math.max(0, S.src - 2 / FPS); S.D = f3(S.speed * (S.end - S.at) + 4 / FPS);
    const M = MEDIA[S.clip];
    if (S.src + S.speed * (S.end - S.at) > M.secs + 1e-3) throw new Error('shot ' + (k + 1) + ' runs past the end of ' + S.clip + ', ' + M.secs.toFixed(2) + 's');
  });
  /* Einz's rule from post62: no shot repeats, no replays of the same moment */
  for (const a of SHOTS) for (const b of SHOTS) if (a.k < b.k && a.clip === b.clip && a.src < b.src + b.speed * (b.end - b.at) && b.src < a.src + a.speed * (a.end - a.at)) {
    throw new Error('shots ' + (a.k + 1) + ' and ' + (b.k + 1) + ' show the same source frames');
  }
  const DIR = path.join(DEMO, 'out', NAME + '-src');
  for (const S of SHOTS) {
    const { file, ...SRC } = MEDIA[S.clip];
    const st = cutFrames(path.join(DIR, 's' + S.k + '-' + FPS), file, SRC, S.A, S.D);
    S.ew = st.ew; S.eh = st.eh; S.dir = path.join(DIR, 's' + S.k + '-' + FPS);
    S.count = fs.readdirSync(S.dir).filter(f => f.endsWith('.jpg')).length;
    S.track = S.focus ? [{ s: S.src, x: S.focus[0], y: S.focus[1] }] : autoFocus(file, SRC, S.src, Math.max(0.2, S.speed * (S.end - S.at)));
    const mid = focusAt(S.track, S.src + S.speed * (S.end - S.at) / 2);
    console.log('  shot ' + (S.k + 1) + ' at ' + S.at.toFixed(2) + 's, ' + S.clip + ' from ' + S.src + 's' + (S.speed !== 1 ? ' at ' + S.speed : '') + ', ' + (S.focus ? 'pinned' : 'found') + ' focus ' + mid.x.toFixed(2) + ', ' + mid.y.toFixed(2));
  }
  const PUNCH = (C.punches || []).map(p => ({ ...p, at: when(p.at), by: p.by ?? 0.12 }));
  const BIG = (C.big || []).map((b, i) => ({ ...b, id: 'bw' + i, at: b.at === 0 ? SLAM0 : when(b.at) })).sort((a, b) => a.at - b.at);
  BIG.forEach((b, i) => { b.out = f3(Math.min(b.at + (b.hold ?? 1.2), i + 1 < BIG.length ? BIG[i + 1].at : FL.at)); });

  /* ---------- him, optional, small in a corner, popping in for each reaction ---------- */
  const MC = C.mascot || null;
  const BUB = MC ? CORNERS[MC.corner || 'tr'] : CORNERS.tr;
  if (MC && !BUB) throw new Error('he goes in tl, tr, bl or br');
  const MAS = { cx: BUB.x, cy: BUB.y + 4, size: 134, scale: 0.5, away: true };
  const REACT = MC ? (MC.react || []).map(r => ({ ...r, at: when(r.at), mood: r.mood || 'happy', for: r.for ?? 1.4 })) : [];
  const BUBW = REACT.map(r => [r.at - 0.08, r.at + r.for]).reduce((acc, [a, b]) => {
    const p = acc[acc.length - 1];
    if (p && a <= p[1] + 0.3) p[1] = Math.max(p[1], b); else acc.push([a, b]);
    return acc;
  }, []);
  /* each window pops in with a small overshoot over 0.3s and shrinks out over 0.2s */
  const bubOn = u => BUBW.reduce((m, [a, b]) => Math.max(m, u < a || u > b + 0.2 ? 0 : u < a + 0.3 ? backOut(span(u, a, a + 0.3)) : u < b ? 1 : 1 - smooth(span(u, b, b + 0.2))), 0);
  function face(u) {
    let dy = 1.6 * Math.sin(2 * Math.PI * u / 2.2), rot = 0, lid = 0.04, arc = 0, look = null, esy = 1;
    for (const r of REACT) {
      dy -= 6 * Math.sin(Math.PI * span(u, r.at, r.at + 0.26));
      if (r.mood === 'happy') arc = Math.max(arc, bump(u, r.at + 0.02, 0.06, 0.38, 0.08));
      if (r.mood === 'squint') { const q = bump(u, r.at, 0.12, r.for - 0.4, 0.2); lid = Math.max(lid, 0.45 * q); esy = Math.min(esy, 1 - 0.45 * q); rot += 7 * q; }
      if (r.mood === 'look') { const q = bump(u, r.at + 0.05, 0.12, r.for - 0.4, 0.15); if (q > 0) look = { x: W / 2, y: H / 2, w: q }; }
    }
    return { lid: f3(lid), arc: f3(arc), ...(look ? { look } : {}), dx: 0, dy: f2(dy), rot: f2(rot), sq: 0, esy: f3(esy) };
  }

  /* ---------- the captions ---------- */
  const PAGES = timePages(TAKES, C.pages || autoPages(TAKES), C.say);

  /* ---------- the picture, a frame of it ---------- */
  function shotAt(u) {
    let k = 0;
    while (k + 1 < SHOTS.length && u >= SHOTS[k + 1].at) k++;
    const S = SHOTS[k];
    const s = S.src + S.speed * (Math.min(Math.max(u, S.at), S.end) - S.at);
    let z = 1 + S.push * CURVE.dolly(span(u, S.at, S.end));
    z *= k === 0 ? lerp(1.2, 1, CURVE.out(span(u, SLAM0, SLAM0 + 0.45))) : lerp(1.08, 1, CURVE.out(span(u, S.at, S.at + 0.22)));
    let fo = focusAt(S.track, s);
    for (const p of PUNCH) {
      if (p.at < S.at || p.at >= S.end) continue;
      const q = CURVE.cam(span(u, p.at, p.at + 0.16));
      z *= lerp(1, 1 + p.by, q);
      if (p.focus) fo = { x: lerp(fo.x, p.focus[0], q), y: lerp(fo.y, p.focus[1], q) };
    }
    if (PAY != null) z *= 1 + 0.05 * hitPulse(u - PAY, 0.02, 0.12);
    z = Math.min(z, 1.45);
    /* cover, then the focus to the middle, then clamped so it stays covered */
    const k0 = Math.max(W / S.ew, H / S.eh) * z, dw = S.ew * k0, dh = S.eh * k0;
    let tx = W / 2 - fo.x * dw, ty = H / 2 - fo.y * dh;
    tx = Math.min(0, Math.max(W - dw, tx)); ty = Math.min(0, Math.max(H - dh, ty));
    /* the payoff kicks the frame, inside the cover */
    if (PAY != null && u >= PAY && u < PAY + 0.3) { const e = Math.exp(-(u - PAY) / 0.07); tx = Math.min(0, Math.max(W - dw, tx + 6 * e * Math.sin((u - PAY) * 90))); }
    const p = (s - S.A) * FPS, n = S.speed === 1 ? Math.round(p) : Math.floor(p + 1e-6), bf = S.speed === 1 ? 0 : f3(p - n);
    return { k, n, bf, tr: 'translate(' + f2(tx) + 'px,' + f2(ty) + 'px) scale(' + (k0).toFixed(5) + ')' };
  }
  const jpg = (k, n) => {
    const S = SHOTS[k], fn = path.join(S.dir, 'f' + String(Math.min(n, S.count - 1)).padStart(5, '0') + '.jpg');
    if (!fs.existsSync(fn)) throw new Error('shot ' + (k + 1) + ' has no source frame ' + n);
    return 'data:image/jpeg;base64,' + fs.readFileSync(fn).toString('base64');
  };

  function frame(t) {
    const u = t, S = [], X = [];
    const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };
    const sh = shotAt(u);
    S.push(['fa', 'transform', sh.tr], ['fb', 'transform', sh.tr], ['fb', 'opacity', sh.bf > 0.02 ? sh.bf : 0]);
    X.push(['shot', sh.k]);

    /* the small wordmark through the hook */
    S.push(['wmk', 'opacity', f3(1 - smooth(span(u, 1.5, 1.7)))]);

    /* the big words */
    for (const b of BIG) {
      const a = u < b.at ? { o: 0, s: 1.2, blur: 20 } : wordIn(u, b.at, 'slam'), o = CURVE56.in(span(u, b.out - 0.1, b.out + 0.04));
      put(b.id, a.o * (1 - o), 'scale(' + f3(a.s * (1 - 0.1 * o)) + ')', a.blur);
    }

    /* him, popping in and out, no disc */
    if (MC) {
      const p = bubOn(u);
      S.push(['mas-cut', 'opacity', f3(Math.min(1, p * 1.4))], ['mas-cut', 'transform', 'scale(' + f3(p) + ')']);
    }

    /* the payoff flash: two green frames, straight back */
    S.push(['flash', 'opacity', PAY != null && u >= PAY && u < PAY + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

    /* the karaoke page, and the word being said in green */
    let pi = -1;
    for (let i = 0; i < PAGES.length; i++) if (u >= PAGES[i].from && u < PAGES[i].to) pi = i;
    X.push(['cap', pi]);
    if (pi >= 0) {
      const P = PAGES[pi], q = span(u, P.from, P.from + 0.15);
      const fade = 1 - smooth(span(u, P.to - 0.08, P.to));
      const last = pi + 1 >= PAGES.length || PAGES[pi + 1].from > P.to + 0.01;
      put('cap', smooth(span(u, P.from, P.from + 0.06)) * (last ? fade : 1), 'scale(' + f3(0.82 + 0.18 * backOut(q)) + ')');
      let act = 0;
      P.words.forEach((q2, j) => { if (u >= q2.start - 0.03) act = j; });
      for (let j = 0; j < 3; j++) S.push(['cw' + j, 'color', j === act ? GREEN : WHITE]);
    } else S.push(['cap', 'opacity', 0]);
    /* a slam or a pop is a move, not a layout: the margin guard skips it */
    const busy = BIG.some(b => u >= b.at - 0.02 && u < b.at + 0.3) || BUBW.some(([a]) => u >= a - 0.02 && u < a + 0.32);
    return { S, X, k: sh.k, n: sh.n, nb: sh.bf > 0.02 ? sh.n + 1 : null, tx: [{ busy }] };
  }

  /* ---------- the drawing ---------- */
  const CREDIT = C.credit ? [].concat(C.credit) : [];
  const WMKW = 'THE BORING TEK';
  const css = `
:root,html[data-theme=dark]{--bg:${BLACK}}
html,body,.stage{background:${BLACK} !important}
.vignette{display:none}
#ft{position:absolute;inset:0;overflow:hidden;background:#000}
#ft img{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
#fb{opacity:0}
/* a soft dark band behind the captions, no bars */
#shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 48%,rgba(0,0,0,.26) 62%,rgba(0,0,0,.1) 80%,rgba(0,0,0,.3))}
#wmk{position:absolute;left:60px;right:60px;top:66px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:${WHITE};text-shadow:${SHADOW};z-index:5}
.bw{position:absolute;left:60px;right:60px;top:${f2(H * 0.3)}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;z-index:5;will-change:transform,opacity,filter}
.bw b{display:block;transform:translateY(-50%);width:max-content;font:400 60px/1 var(--display);letter-spacing:.02em;color:${WHITE};white-space:nowrap;-webkit-text-stroke:2px ${WHITE};text-shadow:${SHADOW}}
.bw.g b{color:${GREEN};-webkit-text-stroke:2px ${GREEN}}
#mas-cut{transform-origin:${BUB.x}px ${BUB.y}px;${MC ? 'opacity:0' : 'display:none'}}
.m-glow-mid{filter:blur(${f2(11 / MAS.scale)}px)}
.m-glow-wide{filter:blur(${f2(30 / MAS.scale)}px)}
#cap{position:absolute;left:60px;right:60px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;z-index:9;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 ${CAP_PX}px/1 var(--read);color:${WHITE};white-space:nowrap;text-shadow:${SHADOW}}
#cred{position:absolute;left:60px;right:60px;bottom:${150 + 8}px;text-align:center;font:400 9.5px/1.35 var(--read);letter-spacing:.02em;color:rgba(255,255,255,.86);text-shadow:0 0 4px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.8);z-index:9}
#flash{position:absolute;inset:0;background:${GREEN};opacity:0;z-index:20}
`;
  const markup = `
<div id="ft"><img id="fa" alt=""><img id="fb" alt=""></div>
<div id="shade"></div>
<div id="wmk">${WMKW}</div>
${BIG.map(b => `<div class="bw${b.green ? ' g' : ''}" id="${b.id}"><b>${b.text}</b></div>`).join('\n')}
`;
  const front = `<div id="cap"><b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b></div>
${CREDIT.length ? '<div id="cred">' + CREDIT.join('<br>') + '</div>' : ''}`;
  const overlay = '<div id="flash"></div>';

  function page() {
    const D = window.__GAGD, els = {}, last = {};
    const $ = id => els[id] || (els[id] = document.getElementById(id));
    const fa = $('fa'), fb = $('fb');
    let fitted = false;
    const fit = () => {
      /* each big word as wide as it can be between the margins, 96px tall at most */
      for (const b of document.querySelectorAll('.bw b')) {
        b.style.fontSize = '100px';
        b.style.fontSize = Math.min(96, 100 * D.bigW / b.getBoundingClientRect().width).toFixed(2) + 'px';
      }
    };
    window.__gag = {
      apply(o) {
        if (!fitted) { fit(); fitted = true; }
        for (const [id, k, v] of o.S) {
          const key = id + '#' + k;
          if (last[key] === v) continue;
          last[key] = v;
          $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
        }
        for (const [id, v] of o.X) {
          if (last[id + '$'] === v) continue;
          last[id + '$'] = v;
          if (id === 'shot') { const [w, h] = D.sizes[v]; for (const im of [fa, fb]) { im.style.width = w + 'px'; im.style.height = h + 'px'; } continue; }
          const ws = v < 0 ? [] : D.pages[v];
          for (let j = 0; j < 3; j++) { $('cw' + j).textContent = ws[j] || ''; $('cw' + j).style.display = ws[j] ? 'inline' : 'none'; }
          /* a wide page comes down to 64px at the least, never under */
          const b = $('cap').firstElementChild;
          b.style.fontSize = D.capPx + 'px';
          const w = b.getBoundingClientRect().width / (parseFloat(getComputedStyle($('cap')).transform.split(',')[0].replace('matrix(', '')) || 1);
          if (w > D.capW) b.style.fontSize = Math.max(D.capMin, D.capPx * D.capW / w).toFixed(2) + 'px';
        }
        if (o.pre) {
          if (o.pre.a !== last.pa) { last.pa = o.pre.a; fa.src = o.pre.a; }
          if (o.pre.b && o.pre.b !== last.pb) { last.pb = o.pre.b; fb.src = o.pre.b; }
        }
      },
      ready() {
        return Promise.all([fa, fb].filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => null)));
      },
    };
  }

  /* ---------- the sound ---------- */
  const onGrid = (t, len) => { const n = Math.max(1, Math.round(len * FPS)); return { t0: Math.round(t * FPS) / FPS, n, secs: n / FPS }; };
  const GA = onGrid(FL.at - 0.05, 3 / 60);
  async function sound() {
    const PEAK = loadKit();
    const GR = (() => {
      const src = VOICES.mkGlitch(), fl = Math.round(SR / 60), lv = [];
      for (let a = 0; a + fl < src.length; a += Math.round(fl / 2)) { let e = 0; for (let i = a; i < a + fl; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
      lv.sort((x, y) => y.e - x.e);
      return lv[0].off;
    })();
    /* the glitch sound cut to exactly the glitch frames */
    VOICES.stutA = () => {
      const fl = Math.round(SR / 60), n = Math.max(1, Math.round(GA.secs * 60)), src = VOICES.mkGlitch(), g = Math.round(fl * 0.8), out = new Float32Array(Math.round(GA.secs * SR)), at = Math.round(GR * SR);
      for (let k = 0; k < n; k++) for (let i = 0; i < g && k * fl + i < out.length; i++) out[k * fl + i] = src[Math.min(src.length - 1, at + i)] * Math.min(1, i / 48, (g - i) / 48) * (1 - 0.12 * k);
      return out;
    };
    GAINS.stutA = -9;
    const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
    const near = (t, list) => list.some(x => Math.abs(x - t) < 0.35);
    const CUES = [
      on(peakAt(SLAM0, SLAM0 + 0.45, CURVE.out), 'swooshwhoosh', 'frame 0, the footage drops in'),
      on(0.06, 'thud', 'frame 0 lands'),
      ...SHOTS.slice(1).map(S => on(S.at, 'fastwhoosh', 'the cut to shot ' + (S.k + 1))),
      /* one sound a moment, the house's five or so a ten seconds: a big word
         on a cut lets the cut's whoosh carry it, a punch on a cut, a big word
         or his pop stays quiet */
      ...PUNCH.filter(p => !near(p.at, [...SHOTS.slice(1).map(S => S.at), ...BIG.map(b => b.at), ...BUBW.map(([a]) => a)])).map(p => on(peakAt(p.at, p.at + 0.16, CURVE.cam), 'arrowwhoosh', 'the punch in at ' + p.at)),
      ...BIG.filter(b => b.at > 0.3 && !near(b.at, SHOTS.slice(1).map(S => S.at))).map(b => on(b.at + 0.03, 'thud', b.text + ' lands')),
      ...(PAY != null ? [on(PAY, 'basshit', 'the payoff')] : []),
      ...BUBW.map(([a]) => on(a + 0.02, 'popLight', 'he pops in')),
      { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark, on its frames' },
    ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
    if (!C.music) return { sfx: { cues: CUES, level: -9, duck: 0.6 } };
    const { elevenMusic } = await import('./elevenmusic.mjs');
    const BED = await elevenMusic(NAME, { prompt: C.music.prompt, seconds: f3(FL.at + 1.7), tries: 3 });
    console.log('  music ' + BED.all.join(' | '));
    const b = highPass(BED.pcm, 110);
    /* the planned silence: the bed out for the 0.4s before the payoff */
    if (PAY != null) {
      const g = t => 1 - smooth(span(t, PAY - 0.45, PAY - 0.35)) * (1 - smooth(span(t, PAY, PAY + 0.2)));
      for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
    }
    return { sfx: { cues: CUES, level: -9, duck: 0.6 }, music: { pcm: b, level: C.music.level ?? -27, duck: 0.6, under: -14, fx: 6 } };
  }

  /* ---------- the beats, the stills, the run ---------- */
  const BEATS = [...SHOTS.slice(1).map(S => S.at), ...PUNCH.map(p => p.at), ...BIG.map(b => Math.max(0, b.at)), ...REACT.map(r => r.at), ...(PAY != null ? [PAY] : []), FL.at];
  const STILLS = [...new Set([0, 0.3, ...SHOTS.map(S => f3(S.at + 0.15)), ...PUNCH.map(p => f3(p.at + 0.2)), ...BIG.map(b => f3(Math.max(0.3, b.at + 0.3))),
    ...REACT.map(r => f3(r.at + 0.3)), ...(PAY != null ? [f3(PAY + 0.01)] : []), f3(FL.at + 0.3), f3(END - 1 / 60)])].sort((a, b) => a - b);
  console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', flash ' + FL.at + ', end ' + END);
  if (PAY != null) console.log('  payoff at ' + PAY + 's, ' + Math.round(100 * PAY / END) + '% of the runtime');
  if (END < 10 || END > 15) console.log('  NOTE the clip runs ' + END + 's, the format is 10 to 15');
  const sfx = STILLS_RUN ? null : await sound();
  const maxGap = Math.max(0.6, ...LINES.map(l => (l.pause ?? 0) + 0.05));

  return runEpisode({
    post: C.post, ...(C.name ? { name: C.name } : {}), ep: 0, series: false, title: [],
    cut: END, flash: FL,
    mascot: MAS,
    voice: TAKES, subs: [],
    tp: -1,
    maxGap,
    ...(sfx ? { sfx: sfx.sfx, ...(sfx.music ? { music: sfx.music } : {}) } : {}),
    stills: STILLS_RUN ? STILLS : null,
    gag: {
      css, markup, front, overlay, page, frame, face,
      prepare: (t, g) => ({ a: jpg(g.k, g.n), b: g.nb === null ? null : jpg(g.k, g.nb) }),
      ready: true,
      data: { pages: PAGES.map(P => P.words.map(q => q.txt)), sizes: SHOTS.map(S => [S.ew, S.eh]), bigW: 380, capW: CAP_W, capPx: CAP_PX, capMin: CAP_MIN },
      sleep: [],
      beats: BEATS,
      checks: ['#cap b', '#wmk', ...BIG.map(b => '#' + b.id + ' b'), ...(CREDIT.length ? ['#cred'] : [])],
      hook: ['#ft', '#wmk', ...BIG.filter(b => b.at <= 0).map(b => '#' + b.id)],
      copy: [WMKW, ...BIG.map(b => b.text), ...CREDIT, ...PAGES.map(P => P.txt)],
      verify: [
        { at: 0, sel: '#fa', test: r => (r && r.l <= 0.5 && r.t <= 0.5 && r.r >= W - 0.5 && r.b >= H - 0.5 ? null : 'the footage does not cover the frame at 0: ' + JSON.stringify(r)) },
        ...SHOTS.map(S => ({ at: f3(Math.min(S.end - 0.02, S.at + 0.5)), sel: '#fa', test: r => (r && r.l <= 0.5 && r.t <= 0.5 && r.r >= W - 0.5 && r.b >= H - 0.5 ? null : 'shot ' + (S.k + 1) + ' leaves a bar: ' + JSON.stringify(r)) })),
        ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && (r.t + r.b) / 2 > H * 0.6 - 4 && (r.t + r.b) / 2 < H * 0.65 + 4 ? null : 'the caption "' + P.txt + '" leaves 60 to 65% of the height: ' + JSON.stringify(r)) })),
      ],
      log: [[0, 'frame 0, the footage drops in'], ...SHOTS.slice(1).map(S => [S.at, 'cut to shot ' + (S.k + 1)]), ...PUNCH.map(p => [p.at, 'punch in']),
        ...BIG.map(b => [Math.max(0, b.at), b.text]), ...REACT.map(r => [r.at, 'he pops in, ' + r.mood]), ...(PAY != null ? [[PAY, 'the payoff, the green flash']] : [])],
    },
  });
}
