/* the boring tek — post60. how AI motion videos are really made.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by speech to text, every take sped up 1.16 with atempo,
   pitch kept. post59's subtitles, the plain end card. the rig is
   lib/aiafter.mjs with the series off, no lib change. post58's prepare and
   ready hooks carry the super cut, one real frame at a time.

   the media layer: real things from this repo, as cards that fly in, tilt,
   zoom slowly and glow, never a raw screen recording.
     the super cut   frames of post58, post59 and post57's final mp4s, cropped
                     past their burned in subtitles, out/post60-src
     the code card   post59.mjs, the living camera block, verbatim
     the flipbook    post59's beat stills
     the sheet       post59's contact sheet
     the waveform    this clip's own line 4 take
     the review      post59's review.md, round 1 and round 3, word for word
   one accent for this clip, hot magenta. green stays inside our own footage.

     frame 0  AI MADE THIS, the super cut under it, him below
     hook     four hard cuts of 0.375s, a whoosh on each
     l1       everyone says ...      hard cut to the grid, the prompt box springs
                                     in, ONE PROMPT = VIDEO? types, he squints
     l2       the truth? ...         the box flips into the code card, the lines
                                     decode, CODE, NOT VIDEO slams
     l3       the code draws ...     frames peel off the card into a flipbook,
                                     60 FPS counts up, the contact sheet flies in
                                     and pans
     l4       then a voice ...       the waveform of this very line draws with
                                     the playhead, a tick per word
     l5       then the AI watches .. a small clip plays, the review card types,
                                     the 7s glow, then scramble to 8, NONE UNDER 8
     l6       all made with ...      everything flies into one window, VS CODE,
                                     CLAUDE CODE lights on its word
     silence                         the window holds
     l7       and the hardest part?  he looks at the lens, make it pop types into
                                     the prompt, everything pops, he squints
     the glitch cut, the plain end card

     DEMO_FPS=12 node post60.mjs          the preview
     node post60.mjs --stills             one still per beat, no render
     node post60.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, EASE, SPRING,
  livingCamera, wordIn, CURVE, CURVE56, peakAt, hitPulse, scramble, FPS,
} from './lib/aiafter.mjs';
import { SR, VOICES, GAINS, decode } from './lib/sfx.mjs';
import { elevenSfx } from './lib/elevensfx.mjs';
import { elevenMusic } from './lib/elevenmusic.mjs';
import ffmpegPath from 'ffmpeg-static';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[excited] everyone says AI makes motion videos with one prompt.', tempo: TEMPO, take: 6 },
  { key: 'r2', text: '[amused] the truth? the AI writes code, not video.', tempo: TEMPO, take: 1 },
  { key: 'r3', text: '[cheerful] the code draws every frame. sixty a second, like a flipbook.', tempo: TEMPO, take: 3 },
  { key: 'r4', text: '[warm] then a voice is made, every word timed to the motion.', tempo: TEMPO, take: 1 },
  { key: 'r5', text: '[playful] then the AI watches itself, scores itself, and fixes it.', tempo: TEMPO, take: 3 },
  { key: 'r6', text: '[cheerful] all made with Claude Code, inside VS Code.', tempo: TEMPO, take: 2 },
  { key: 'r7', text: '[amused] and the hardest part? the human saying... make it pop.', tempo: TEMPO, take: 1 },
];
/* pinned by speech to text at 1.16. line one's t1 to t3 come back as you
   won't say, t4 to t6 as everyone, so it asked for six. claude is cloud to the
   base model on every take, and on six control takes that say cloud on purpose
   too, at 0.67 to 0.73; ours score 0.35 to 0.44, t2 the lowest. line four's t3
   is time to, line seven's t2 make it pot and t3 drops the and */
const TAKES = [...await readLines(60, LINES.slice(0, 1), 6, MODEL), ...await readLines(60, LINES.slice(1), 3, MODEL)];
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
const HOOK = 1.5, GAP = 0.25, HUSH = 0.5;
place(L1, HOOK);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (i === 6 ? HUSH : GAP));
const SUBS = [
  { line: 0, text: 'everyone says AI makes motion videos' },
  { line: 0, text: 'with one prompt' },
  { line: 1, text: 'the truth?' },
  { line: 1, text: 'the AI writes code, not video' },
  { line: 2, text: 'the code draws every frame' },
  { line: 2, text: 'sixty a second, like a flipbook' },
  { line: 3, text: 'then a voice is made' },
  { line: 3, text: 'every word timed to the motion' },
  { line: 4, text: 'then the AI watches itself' },
  { line: 4, text: 'scores itself, and fixes it' },
  { line: 5, text: 'all made with Claude Code' },
  { line: 5, text: 'inside VS Code' },
  { line: 6, text: 'and the hardest part?' },
  { line: 6, text: 'the human saying...' },
  { line: 6, text: 'make it pop' },
];

/* ---------- the real things ---------- */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'out', 'post60-src');
if (!fs.existsSync(path.join(SRC, 'd', '023.jpg'))) {
  console.error('\nSTOPPED. demo/out/post60-src is missing. it is cut out of the final mp4s of post57, post58 and post59, and post59\'s verify folder');
  process.exit(1);
}
const uri = f => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
/* the super cut: four shots, each cropped past its own subtitles */
const SHOTS = ['a', 'b', 'c', 'd'], SHOT = 0.375;
const SCF = new Map();
const scFrame = t => {
  const k = Math.min(3, Math.floor(t / SHOT)), n = Math.min(26, 1 + Math.floor((t - k * SHOT) * 60 + 1e-6));
  const f = path.join(SRC, SHOTS[k], String(n).padStart(3, '0') + '.jpg');
  if (!SCF.has(f)) SCF.set(f, uri(f));
  return SCF.get(f);
};
const STILLS_IMG = ['00', '03', '05', '07', '09', '12', '15', '17', '20', '22', '24', '26'].map(s => uri(path.join(SRC, 'st' + s + '.jpg')));
const SHEET_IMG = uri(path.join(SRC, 'contact.jpg'));
/* the code card: post59.mjs, lines 242 to 248, word for word */
const CODE = [
  '/* the camera on the whole stage, the living push */',
  'const camera = livingCamera({',
  '  F: { x: 270, y: 470 },',
  '  holds: [[0, M1.at - 0.15], [L6.end, CUT]],',
  '  push: 0.03,',
  '  punches: [MORPH_BB + 0.35, WAIT, BAR99],',
  '});',
];
{
  const src = fs.readFileSync(path.join(HERE, 'post59.mjs'), 'utf8').split(/\r?\n/);
  const at = src.findIndex(l => l.includes(CODE[0].slice(3, 30)));
  if (at < 0 || CODE.slice(1).some((l, i) => src[at + 1 + i] !== l)) throw new Error('the code card no longer matches post59.mjs');
}
/* the review: post59's review.md, round 1, one score a row */
const REV = fs.readFileSync(path.join(HERE, 'out', 'verify-post59', 'review.md'), 'utf8');
const R1 = 'hook 7, readable 8, motion 8, something new every 2 to 4s 7, composition 8, mascot rules 9, sound sync 8';
const R3 = 'hook 8, readable 8, motion 8, something new every 2 to 4s 8, composition 8, mascot rules 9, sound sync 8';
if (!REV.includes(R1) || !REV.includes(R3) || !REV.includes('none under 8')) throw new Error('the review card no longer matches review.md');
const ROWS = R1.split(', ').map(s => { const m = s.match(/^(.*) (\d)$/); return { name: m[1], a: m[2] }; });
R3.split(', ').forEach((s, i) => { ROWS[i].b = s.slice(-1); });
/* the waveform: line 4's own take, 80 bars of rms */
const NB = 80;
const BARS = (() => {
  const a = Math.round(L4.edge.start * SR), b = Math.round(L4.edge.end * SR), r = [];
  for (let i = 0; i < NB; i++) {
    let s = 0; const p = a + Math.floor((b - a) * i / NB), q = a + Math.floor((b - a) * (i + 1) / NB);
    for (let j = p; j < q; j++) s += L4.pcm[j] * L4.pcm[j];
    r.push(Math.sqrt(s / Math.max(1, q - p)));
  }
  const m = Math.max(...r);
  return r.map(v => +(4 + 92 * Math.sqrt(v / m)).toFixed(1));
})();
/* the editor scroll in the window: more of post59.mjs, the lines after the card */
const SCROLL = (() => {
  const src = fs.readFileSync(path.join(HERE, 'post59.mjs'), 'utf8').split(/\r?\n/);
  const at = src.findIndex(l => l.startsWith('const camera = livingCamera'));
  return src.slice(at - 1, at + 40).map(l => l.slice(0, 62));
})();

/* ---------- the words on screen ---------- */
const TT1 = 'AI MADE', TT2 = 'THIS';
const PR1 = 'ONE PROMPT', PR2 = '= VIDEO?', PRL = 'prompt';
const SLAMW = 'CODE, NOT VIDEO', FPSW = 'FPS', VOICEW = 'VOICE';
const REVF = 'review.md', RD1 = 'round 1', RD3 = 'round 3', STAMPW = 'NONE UNDER 8';
const VSW = 'VS CODE', CCW = 'CLAUDE CODE', ASK = 'make it pop', FILEW = 'post59.mjs';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 650, size: 118, scale: 0.85 };
const HOME = { x: 270, y: 650, s: 0.85 };
const BOX = { cx: 270, cy: 330, w: 380, h: 150 };
const CARD = { cx: 270, cy: 330, w: 400 };
const BOOK = { cx: 195, cy: 430, w: 150, h: 267 };
const FPSB = { cx: 392, cy: 430 };
const SHEET = { cx: 270, cy: 385, w: 340, h: 390 };
const WAVE = { cx: 270, cy: 380, w: 400, h: 190 };
const MINI = { cx: 122, cy: 300, w: 100, h: 178 };
const REVB = { l: 188, t: 196, w: 280 };
const WIN = { cx: 270, cy: 385, w: 400, h: 400 };

/* ---------- the beats, all off the read ---------- */
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const wi = (T, x) => T.W.findIndex(q => q.word.toLowerCase().replace(/[^a-z0-9]/g, '') === x);
const CUTS = [0, SHOT, 2 * SHOT, 3 * SHOT];
const BOX_IN = f3(HOOK + 0.02), TYPE1 = f3(L1.at + 0.5), PER1 = 0.07, ONE = w(L1, 'one');
const FLIP = w(L2, 'truth'), FLIP_B = f3(FLIP + 0.16), DEC = f3(FLIP + 0.24), SLAM = w(L2, 'not');
const SHRINK = f3(L3.at - 0.05), PEEL = w(L3, 'draws'), FLIPS = w(L3, 'every'), SIXTY = w(L3, 'sixty'), SHEET_IN = w(L3, 'like');
const WAVE_IN = w(L4, 'voice') - 0.1, MOTION = w(L4, 'motion');
const WAVE_OUT = f3(L5.at - 0.06), MINI_IN = f3(L5.at + 0.1), REV_IN = f3(w(L5, 'scores') - 0.12), GLOW7 = f3(REV_IN + 0.5);
const FIX = w(L5, 'fixes'), STAMP = f3(FIX + 0.32);
const WIN_IN = f3(L6.at - 0.04), CLAUDE = w(L6, 'claude'), VS = w(L6, 'vs');
const LENS7 = w(L7, 'hardest'), POPW = w(L7, 'pop'), TYPE7 = f3(w(L7, 'make') - 0.32), PER7 = f3((POPW - TYPE7) / ASK.length);
const POP = f3(POPW + 0.02), SQUINT = f3(POP + 0.3);
const CUT = f3(Math.max(L7.end + 0.3, SQUINT + 0.7));
const HOLD = 1.0;
const hidden = { o: 0, s: 1, y: 0, blur: 0 };

/* ---------- the camera, the living push ---------- */
const camera = livingCamera({
  F: { x: 270, y: 420 },
  holds: [[WAVE_IN + 0.4, L4.end], [L6.at + 0.6, L7.at + 0.6]],
  push: 0.03,
  punches: [SLAM, STAMP, POP],
});

/* ---------- him: home under everything, a nod here and there ---------- */
function body(t) {
  let dy = 2.2 * Math.sin(2 * Math.PI * t / 2.2);
  dy += 5 * Math.sin(Math.PI * span(t, STAMP, STAMP + 0.42));
  dy += 6 * Math.sin(Math.PI * span(t, POP, POP + 0.36));
  const sq = 0.07 * Math.sin(Math.PI * span(t, POP - 0.02, POP + 0.16));
  const lean = SPRING(span(t, LENS7, LENS7 + 0.45)) * (1 - CURVE.out(span(t, TYPE7 - 0.15, TYPE7 + 0.3)));
  return { x: HOME.x, y: HOME.y + dy - 40 * lean, s: HOME.s * (1 + 0.28 * lean), sq };
}
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  { at: BOX_IN + 0.1, to: AT(BOX.cx, BOX.cy) },
  { at: PEEL, to: AT(BOOK.cx, BOOK.cy) },
  { at: SIXTY, to: AT(FPSB.cx, FPSB.cy) },
  { at: SHEET_IN + 0.1, to: AT(SHEET.cx, SHEET.cy) },
  { at: WAVE_IN + 0.1, to: AT(WAVE.cx, WAVE.cy) },
  { at: MINI_IN + 0.05, to: AT(270, 370) },
  { at: REV_IN + 0.1, to: AT(REVB.l + 140, REVB.t + 110) },
  { at: WIN_IN + 0.15, to: AT(WIN.cx, WIN.cy) },
  { at: LENS7, to: LENS },
  { at: TYPE7, to: AT(WIN.cx, WIN.cy + 140) },
  { at: POP + 0.12, to: LENS },
];
const BLINKS = [0.9, L2.at + 0.1, L3.end + 0.05, L5.at + 0.1, L6.end + 0.15].map(f3);
const HAPPY = [SLAM + 0.15, STAMP + 0.1];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const p = body(t);
  const lens = { x: p.x, y: p.y, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.22));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? smooth(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  /* the squint on one prompt, and the last one at the lens */
  lid = Math.max(lid, 0.04 + 0.42 * bump(t, ONE, 0.15, 0.4, 0.2));
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, SQUINT, SQUINT + 0.2)));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy), rot: 0, sq: f3(p.sq), s: f3(p.s) };
}

/* ---------- the code card's tokens ---------- */
const TOK = /(\/\*.*\*\/)|(\bconst\b)|(livingCamera)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*(?=:))|([A-Za-z_][\w.]*)|(\s+)|(.)/g;
const KIND = ['com', 'kw', 'fn', 'num', 'key', 'id', 'ws', 'pun'];
const CTOK = CODE.map(line => {
  const out = [];
  for (const m of line.matchAll(TOK)) {
    const k = KIND[m.slice(1).findIndex(x => x !== undefined)];
    const last = out[out.length - 1];
    if (last && (last.k === k || k === 'ws' || last.k === 'ws')) { last.n += m[0].length; if (last.k === 'ws') last.k = k; }
    else out.push({ k, a: m.index, n: m[0].length });
  }
  return out;
});
const DEC_AT = CODE.map((_, i) => f3(DEC + i * 0.09));

/* ---------- a frame of the story ---------- */
function frame(t) {
  const S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };
  const inHook = t < HOOK;

  /* the hook: the cut under the title, a punch on every cut */
  const k = Math.min(3, Math.floor(t / SHOT)), c0 = CUTS[k];
  S.push(['sc', 'opacity', inHook ? 1 : 0], ['scrim', 'opacity', inHook ? 1 : 0]);
  S.push(['sc', 'transform', 'scale(' + f3(lerp(1.07, 1, CURVE.out(span(t, c0, c0 + 0.3)))) + ')']);
  let tp = 0;
  for (const c of CUTS) tp += hitPulse(t - c, 0.02, 0.07);
  const tOut = CURVE56.in(span(t, HOOK - 0.02, HOOK + 0.12));
  put('title', 1 - tOut, 'translateY(' + f2(-30 * tOut) + 'px) scale(' + f3(1 + 0.035 * tp) + ')');
  S.push(['hot', 'opacity', f3(0.5 * hitPulse(t - HOOK, 0.02, 0.12) + 0.9 * hitPulse(t - POP, 0.02, 0.14))]);

  /* l1: the prompt box springs in, the words type, the cursor blinks */
  const bIn = t < BOX_IN ? hidden : wordIn(t, BOX_IN, 'spring'), flipA = span(t, FLIP, FLIP_B);
  put('box', t < FLIP_B ? bIn.o : 0, 'perspective(900px) rotateY(' + f2(90 * CURVE56.in(flipA)) + 'deg) scale(' + f3(bIn.s) + ')');
  const typed = Math.floor(Math.max(0, t - TYPE1) / PER1 + 1e-6), all = PR1 + ' ' + PR2;
  const shown = all.slice(0, typed);
  X.push(['pr1', shown.slice(0, PR1.length)], ['pr2', shown.length > PR1.length + 1 ? shown.slice(PR1.length + 1) : '']);
  const blink = typed >= all.length ? (Math.floor((t - TYPE1) * 3.2) % 2 ? 0.15 : 1) : 1, two = shown.length > PR1.length;
  S.push(['pcur1', 'opacity', two ? 0 : 1], ['pcur2', 'opacity', two ? blink : 0]);

  /* l2: the card turns in, the code decodes line by line, the slam */
  const cIn = CURVE.out(span(t, FLIP_B, FLIP_B + 0.3));
  const shr = CURVE56.glide(span(t, SHRINK, SHRINK + 0.45));
  const cOut = CURVE56.in(span(t, SHEET_IN, SHEET_IN + 0.18));
  const cardS = lerp(1, 0.62, shr) * (1 + 0.03 * hitPulse(t - SLAM));
  put('card', t < FLIP_B ? 0 : 1 - cOut, 'translateY(' + f2(lerp(0, 160 - CARD.cy, shr)) + 'px) perspective(900px) rotateY(' + f2(-90 * (1 - cIn)) + 'deg) rotateZ(' + f2(-2 * shr) + 'deg) scale(' + f3(cardS) + ')');
  for (let i = 0; i < CODE.length; i++) {
    const sc = scramble(CODE[i], t, DEC_AT[i], { per: 0.011, hold: 0.12, seed: 11 + i });
    for (let j = 0; j < CTOK[i].length; j++) {
      const q = CTOK[i][j];
      X.push(['c' + i + '_' + j, sc.slice(q.a, q.a + q.n).map(x => (x.s === 0 ? ' ' : x.c)).join('')]);
    }
  }
  const sl = t < SLAM ? hidden : wordIn(t, SLAM, 'slam');
  put('slam', sl.o * (1 - CURVE56.in(span(t, SHRINK, SHRINK + 0.2))), 'scale(' + f3(sl.s) + ')', sl.blur);

  /* l3: pages peel off the card into the book, the book flips, the counter */
  const CARD_TOP = { x: CARD.cx, y: 160 };
  for (let i = 0; i < 5; i++) {
    const a = PEEL + i * 0.07, u = CURVE.out(span(t, a, a + 0.38));
    const x = lerp(CARD_TOP.x, BOOK.cx, u), y = lerp(CARD_TOP.y, BOOK.cy, u) - 50 * Math.sin(Math.PI * u);
    const o = t < a || u >= 1 ? 0 : 1;
    put('fly' + i, o, 'translate(' + f2(x - BOOK.w / 2) + 'px,' + f2(y - BOOK.h / 2) + 'px) rotate(' + f2((1 - u) * (i % 2 ? 14 : -12)) + 'deg) scale(' + f3(lerp(0.3, 1, u)) + ')');
  }
  const bookIn = PEEL + 0.38;
  const bookOut = CURVE56.in(span(t, SHEET_IN + 0.1, SHEET_IN + 0.3));
  const uu = Math.max(0, t - FLIPS), ph = 5 * uu + 6 * uu * uu;
  const pi = Math.floor(ph) % STILLS_IMG.length, fr = ph - Math.floor(ph);
  put('book', t < bookIn ? 0 : 1 - bookOut, 'scale(' + f3(1 + 0.03 * hitPulse(t - bookIn)) + ')');
  S.push(['pgT', 'transform', 'perspective(700px) rotateX(' + f2(t < FLIPS ? 0 : 105 * smooth(fr)) + 'deg)'], ['pgT', 'opacity', t < FLIPS ? 1 : fr > 0.92 ? 0 : 1]);
  X.push(['pgTi', String(pi)], ['pgUi', String((pi + 1) % STILLS_IMG.length)]);
  const fpsIn = t < SIXTY ? hidden : wordIn(t, SIXTY, 'spring');
  put('fps', fpsIn.o * (1 - bookOut), 'scale(' + f3(fpsIn.s * (1 + 0.05 * hitPulse(t - SIXTY - 0.55))) + ')');
  X.push(['fpsn', String(Math.round(60 * CURVE.out(span(t, SIXTY, SIXTY + 0.55))))]);

  /* the contact sheet flies in, tilts, pans and zooms slowly, and leaves through itself */
  const shI = CURVE.out(span(t, SHEET_IN, SHEET_IN + 0.5)), shO = CURVE56.in(span(t, WAVE_IN - 0.02, WAVE_IN + 0.18));
  put('sheet', t < SHEET_IN ? 0 : 1 - shO, 'translateY(' + f2(70 * (1 - shI)) + 'px) rotate(' + f2(lerp(-12, -3, shI)) + 'deg) scale(' + f3(lerp(0.6, 1, shI) * lerp(1, 1.18, shO)) + ')');
  const pan = CURVE.dolly(span(t, SHEET_IN + 0.2, WAVE_IN + 0.2));
  S.push(['sheetImg', 'transform', 'translateY(' + f2(-300 * pan) + 'px) scale(' + f3(1 + 0.1 * pan) + ')']);

  /* l4: the waveform of this line, drawn with the playhead, a tick per word */
  const wI = CURVE.out(span(t, WAVE_IN, WAVE_IN + 0.45)), wO = CURVE56.in(span(t, WAVE_OUT, WAVE_OUT + 0.2));
  put('wave', t < WAVE_IN ? 0 : smooth(span(t, WAVE_IN, WAVE_IN + 0.12)) * (1 - wO), 'scale(' + f3(lerp(0.75, 1, wI) * lerp(1, 1.18, wO)) + ')');
  const play = span(t, L4.at, L4.end);
  S.push(['wclip', 'width', f2(100 * play) + '%'], ['whead', 'transform', 'translateX(' + f2(WAVE.w * 0 + (WAVE.w - 40) * play) + 'px)']);
  let cw = '';
  L4.W.forEach((q, i) => {
    const u = (q.start - L4.at) / (L4.end - L4.at), on = t >= q.start;
    if (on) cw = q.word.replace(/[^A-Za-z]/g, '');
    S.push(['wt' + i, 'opacity', on ? 1 : 0], ['wt' + i, 'transform', 'scaleY(' + f3(1 + 0.8 * hitPulse(t - q.start, 0.02, 0.1) + 1.2 * hitPulse(t - MOTION - 0.1, 0.03, 0.14)) + ')']);
    S.push(['wt' + i, 'left', f2(20 + (WAVE.w - 40) * u) + 'px']);
  });
  X.push(['wword', cw]);

  /* l5: a small clip plays, the review types, the 7s glow, scramble to 8, the stamp */
  const out5 = CURVE56.in(span(t, WIN_IN, WIN_IN + 0.28));
  const toWin = (cx, cy) => 'translate(' + f2((WIN.cx - cx) * out5) + 'px,' + f2((WIN.cy - cy) * out5) + 'px)';
  const mI = t < MINI_IN ? hidden : wordIn(t, MINI_IN, 'spring');
  /* big in the middle while it plays, then aside for the review */
  const mv = CURVE56.glide(span(t, REV_IN - 0.12, REV_IN + 0.33));
  put('mini', mI.o * (1 - out5), toWin(MINI.cx, MINI.cy) + ' translate(' + f2((270 - MINI.cx) * (1 - mv)) + 'px,' + f2((370 - MINI.cy) * (1 - mv)) + 'px) rotate(' + f2(-4 * mv) + 'deg) scale(' + f3(mI.s * lerp(1.6, 1, mv) * lerp(1, 0.4, out5)) + ')');
  X.push(['miniI', String(Math.floor(Math.max(0, t - MINI_IN) * 9) % STILLS_IMG.length)]);
  S.push(['miniP', 'width', f2(100 * span(t, MINI_IN, WIN_IN)) + '%']);
  const rI = t < REV_IN ? hidden : wordIn(t, REV_IN, 'rise');
  put('rev', rI.o * (1 - out5), toWin(REVB.l + REVB.w / 2, REVB.t + 120) + ' translateY(' + f2(rI.y) + 'px) rotate(2deg) scale(' + f3(lerp(1, 0.4, out5)) + ')', rI.blur);
  ROWS.forEach((r, i) => {
    S.push(['rr' + i, 'opacity', t >= REV_IN + 0.1 + i * 0.05 ? 1 : 0]);
    const s7 = r.a !== r.b;
    let ch = t < FIX ? r.a : r.b;
    if (s7) {
      const sc = scramble(r.b, t, FIX + i * 0.03, { per: 0, hold: 0.22, seed: 40 + i })[0];
      if (t >= FIX && sc.s === 1) ch = '0123456789'[Math.floor(Math.abs(Math.sin((Math.floor(t * 30) + i) * 12.9898)) * 10) % 10];
      const g = t < FIX ? smooth(span(t, GLOW7, GLOW7 + 0.2)) : 1 - smooth(span(t, FIX + 0.3, FIX + 0.6));
      S.push(['rs' + i, '--g', f3(g)], ['rs' + i, 'transform', 'scale(' + f3(1 + 0.25 * hitPulse(t - GLOW7) + 0.3 * hitPulse(t - FIX - 0.22)) + ')']);
    }
    X.push(['rs' + i, ch]);
  });
  const rd = scramble(RD3, t, FIX, { per: 0.02, hold: 0.18, seed: 5 });
  X.push(['rdn', t < FIX ? RD1 : rd.map(x => x.c).join('')]);
  const st = t < STAMP ? hidden : wordIn(t, STAMP, 'slam');
  put('stamp', st.o * (1 - out5), toWin(300, 420) + ' rotate(-6deg) scale(' + f3(st.s * lerp(1, 0.4, out5)) + ')', st.blur);

  /* l6: the window, the labels light on their words. l7: make it pop types, everything pops */
  const wn = t < WIN_IN ? hidden : wordIn(t, WIN_IN + 0.08, 'spring');
  const back = CURVE.out(span(t, LENS7, LENS7 + 0.4)) * (1 - CURVE.out(span(t, TYPE7 - 0.15, TYPE7 + 0.25)));
  put('win', t < WIN_IN + 0.08 ? 0 : wn.o * (1 - 0.5 * back), 'translateY(' + f2(-18 * back) + 'px) scale(' + f3(Math.min(1.035, wn.s) * (1 - 0.07 * back) * (1 + 0.035 * hitPulse(t - POP, 0.03, 0.12))) + ')');
  S.push(['edit', 'transform', 'translateY(' + f2(-14 * Math.max(0, t - WIN_IN)) + 'px)']);
  for (const [id, a] of [['lcc', CLAUDE], ['lvs', VS]]) {
    S.push([id, '--g', f3(smooth(span(t, a, a + 0.12)))], [id, 'transform', 'scale(' + f3(1 + 0.22 * hitPulse(t - a, 0.03, 0.12)) + ')']);
  }
  const n7 = Math.max(0, Math.min(ASK.length, Math.floor((t - TYPE7) / PER7 + 1e-6)));
  X.push(['ask', t < TYPE7 ? '' : ASK.slice(0, n7)]);
  S.push(['ask', '--g', f3(smooth(span(t, POP, POP + 0.1)))]);
  S.push(['acur', 'opacity', t > POP + 0.2 ? 0 : t < TYPE7 ? (Math.floor(t * 3.2) % 2 ? 0.15 : 1) : 1]);
  return { S, X };
}

/* ---------- the drawing ---------- */
const HOT = '#ff3ea5';
const GLOW = `drop-shadow(0 0 1px #fff) drop-shadow(0 0 12px rgba(255,62,165,.7)) drop-shadow(0 0 32px rgba(255,62,165,.38))`;
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 9px rgba(255,255,255,.4)) drop-shadow(0 0 22px rgba(255,255,255,.18))';
const HOT_GLOW = 'drop-shadow(0 0 1px var(--hot)) drop-shadow(0 0 10px rgba(255,62,165,.55)) drop-shadow(0 0 26px rgba(255,62,165,.28))';
const CARD_CSS = 'background:#0a0b0f;border:1.5px solid rgba(255,62,165,.85);border-radius:12px;box-sizing:border-box';
const abs = (id, b) => `#${id}{position:absolute;left:${b.cx - b.w / 2}px;top:${b.cy - b.h / 2}px;width:${b.w}px;height:${b.h}px;opacity:0;will-change:transform,opacity}`;
const css = `
:root{--hot:${HOT}}
#grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(233,238,236,.11) 0.9px,transparent 1.3px);background-size:16px 16px;background-position:6px 8px}
#hot{position:absolute;inset:0;opacity:0;background-image:radial-gradient(circle,rgba(255,62,165,.9) 1px,transparent 1.6px);background-size:16px 16px;background-position:6px 8px;
  -webkit-mask-image:radial-gradient(ellipse 70% 55% at 50% 42%,#000 20%,transparent 75%)}
#sc{position:absolute;left:0;top:0;width:540px;height:960px;object-fit:cover;transform-origin:50% 45%}
#scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,7,10,.88) 0,rgba(6,7,10,.55) 22%,rgba(6,7,10,0) 36%,rgba(6,7,10,0) 58%,rgba(6,7,10,.7) 76%,rgba(6,7,10,.9) 100%)}
#title{position:absolute;left:60px;right:60px;top:118px;text-align:center;transform-origin:50% 60px;will-change:transform,opacity}
#title div{width:max-content;margin:0 auto;font:400 54px/1.18 var(--display);letter-spacing:.04em;color:#f7f9f8;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW}}
#title em{font-style:normal;color:var(--hot);-webkit-text-stroke:1px var(--hot)}
${abs('box', BOX)}
#box{${CARD_CSS};padding:16px 20px;filter:${HOT_GLOW};transform-origin:50% 50%}
#box .lab{font:500 11px/1 var(--mono);letter-spacing:.16em;color:rgba(255,62,165,.9);text-transform:uppercase}
#box .pl{position:relative;margin-top:12px;font:400 28px/38px var(--display);letter-spacing:.04em;color:#f7f9f8;white-space:nowrap;height:76px}
.pcur{display:inline-block;width:3px;height:28px;margin-left:5px;vertical-align:-3px;background:var(--hot)}
#card{position:absolute;left:${CARD.cx - CARD.w / 2}px;width:${CARD.w}px;top:${CARD.cy - 102}px;height:204px;opacity:0;${CARD_CSS};padding:0 0 12px;filter:${HOT_GLOW};transform-origin:50% 50%;will-change:transform,opacity}
#card .hd{height:28px;border-bottom:1px solid rgba(255,62,165,.35);display:flex;align-items:center;gap:6px;padding:0 12px;font:500 11px/1 var(--mono);color:#8f9a96;letter-spacing:.06em}
#card .hd i{display:block;width:7px;height:7px;border-radius:50%;border:1px solid rgba(233,238,236,.35)}
#card .hd span{margin-left:6px}
#card pre{margin:10px 0 0;padding:0 14px;font:500 14px/22px var(--mono);white-space:pre;color:#b9c2bf}
#card pre .l0{font-size:11px;line-height:18px}
.com{color:#5d6a65}.kw{color:var(--hot)}.fn{color:#ffffff}.num{color:#ffd3ea}.key{color:#8fa09a}.id{color:#d6dcda}.pun{color:#6c7873}.ws{}
#slam{position:absolute;left:0;right:0;top:492px;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity}
#slam b{display:block;transform:translateY(-50%);text-align:center;font:400 34px/1.2 var(--display);letter-spacing:.06em;color:#f7f9f8;white-space:nowrap;filter:${GLOW}}
#slam em{font-style:normal;color:var(--hot)}
.page{position:absolute;inset:0;border-radius:6px;overflow:hidden;border:1.5px solid rgba(233,238,236,.85);background:#06070a;box-sizing:border-box}
.page img{display:block;width:100%;height:100%;object-fit:cover}
.fly{position:absolute;left:0;top:0;width:${BOOK.w}px;height:${BOOK.h}px;opacity:0;will-change:transform,opacity;filter:${GLOW_LO}}
${abs('book', BOOK)}
#book{filter:${HOT_GLOW}}
#pgT{transform-origin:50% 0;backface-visibility:hidden}
#fps{position:absolute;left:${FPSB.cx - 70}px;width:140px;top:${FPSB.cy - 46}px;height:92px;text-align:center;opacity:0;will-change:transform,opacity}
#fpsn{display:block;font:400 54px/1 var(--display);color:var(--hot);filter:${HOT_GLOW}}
#fps span{display:block;margin-top:10px;font:400 16px/1 var(--display);letter-spacing:.2em;color:#f7f9f8;filter:${GLOW_LO}}
${abs('sheet', SHEET)}
#sheet{${CARD_CSS};overflow:hidden;filter:${HOT_GLOW};transform-origin:50% 50%}
#sheetImg{display:block;width:${SHEET.w}px;transform-origin:50% 0;will-change:transform}
${abs('wave', WAVE)}
#wave{${CARD_CSS};filter:${HOT_GLOW}}
#wave .hd{position:absolute;left:20px;right:20px;top:16px;display:flex;justify-content:space-between;font:500 11px/1 var(--mono);letter-spacing:.16em;color:rgba(255,62,165,.9)}
#wword{font:500 15px/1 var(--mono);letter-spacing:.04em;color:#f7f9f8;text-transform:none;margin-top:-3px}
#wbars{position:absolute;left:20px;top:44px;width:${WAVE.w - 40}px;height:100px}
#wbars svg{position:absolute;left:0;top:0;width:${WAVE.w - 40}px;height:100px;overflow:visible}
#wclip{position:absolute;left:0;top:0;height:100px;width:0;overflow:hidden}
#wclip svg{width:${WAVE.w - 40}px}
#whead{position:absolute;left:20px;top:36px;width:2px;height:118px;background:#fff;filter:${GLOW_LO}}
.wt{position:absolute;top:158px;width:2px;height:12px;margin-left:-1px;background:#f7f9f8;opacity:0;transform-origin:50% 100%}
${abs('mini', MINI)}
#mini{filter:${HOT_GLOW}}
#mini .page{border-color:rgba(255,62,165,.85)}
#miniB{position:absolute;left:0;right:0;bottom:-10px;height:3px;background:rgba(233,238,236,.15);border-radius:2px}
#miniP{height:100%;width:0;background:var(--hot);border-radius:2px}
#rev{position:absolute;left:${REVB.l}px;top:${REVB.t}px;width:${REVB.w}px;opacity:0;${CARD_CSS};padding:0 16px 14px;filter:${HOT_GLOW};transform-origin:50% 50%;will-change:transform,opacity}
#rev .hd{height:34px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,62,165,.35);margin:0 -16px 8px;padding:0 16px;font:500 12px/1 var(--mono);color:#8f9a96;letter-spacing:.06em}
#rdn{color:var(--hot);letter-spacing:.1em}
.rr{display:flex;justify-content:space-between;align-items:center;height:25px;font:500 14.5px/1 var(--mono);color:#cfd6d3;opacity:0}
.rs{display:inline-block;font:400 18px/1 var(--display);color:color-mix(in srgb,var(--hot) calc(var(--g,0) * 100%),#f7f9f8);
  filter:drop-shadow(0 0 calc(10px * var(--g,0)) rgba(255,62,165,calc(.8 * var(--g,0))))}
#stamp{position:absolute;left:150px;width:300px;top:396px;height:48px;opacity:0;border:2.5px solid var(--hot);border-radius:6px;box-sizing:border-box;background:rgba(10,11,15,.92);
  display:flex;align-items:center;justify-content:center;font:400 22px/1 var(--display);letter-spacing:.08em;color:var(--hot);filter:${HOT_GLOW};will-change:transform,opacity}
${abs('win', WIN)}
#win{${CARD_CSS};overflow:hidden;filter:${HOT_GLOW};transform-origin:50% 50%}
#win .tb{height:46px;display:flex;align-items:center;gap:7px;padding:0 14px;border-bottom:1px solid rgba(255,62,165,.35)}
#win .tb i{display:block;width:8px;height:8px;border-radius:50%;border:1px solid rgba(233,238,236,.35)}
.lb{display:inline-block;margin-left:8px;font:400 20px/1 var(--display);letter-spacing:.08em;color:color-mix(in srgb,var(--hot) calc(var(--g,0) * 100%),#f7f9f8);transform-origin:0 50%;
  filter:drop-shadow(0 0 calc(10px * var(--g,0)) rgba(255,62,165,calc(.8 * var(--g,0))))}
#ed{position:absolute;left:0;right:0;top:47px;height:193px;overflow:hidden}
#edit{padding:8px 14px;font:500 10px/15px var(--mono);white-space:pre;color:#7d8985}
#edit .kw{color:rgba(255,62,165,.85)}
#cc{position:absolute;left:0;right:0;top:240px;bottom:0;border-top:1px solid rgba(255,62,165,.55);background:#07080b;padding:16px 16px 0}
#cc .lb{margin-left:0}
#cc .pl{margin-top:22px;font:500 22px/1 var(--mono);color:#f7f9f8;white-space:nowrap}
#cc .pl b{font-weight:500;color:var(--hot);margin-right:10px}
#ask{color:color-mix(in srgb,var(--hot) calc(var(--g,0) * 100%),#f7f9f8);filter:drop-shadow(0 0 calc(10px * var(--g,0)) rgba(255,62,165,calc(.8 * var(--g,0))))}
#acur{display:inline-block;width:11px;height:22px;margin-left:3px;vertical-align:-4px;background:var(--hot)}
`;
const codeHtml = CODE.map((line, i) => '<div class="l' + i + '">' + (CTOK[i].map((q, j) => '<span class="' + q.k + '" id="c' + i + '_' + j + '"></span>').join('') || ' ') + '</div>').join('');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const editHtml = SCROLL.map(l => esc(l).replace(/\b(const|function|return|let|for|if|else)\b/g, '<span class="kw">$1</span>')).join('\n');
const bar = (h, i) => `<rect x="${f2(i * (WAVE.w - 40) / NB + 0.6)}" y="${f2(50 - h / 2)}" width="${f2((WAVE.w - 40) / NB - 1.8)}" height="${h}" rx="1.2"/>`;
const barsSvg = fill => `<svg viewBox="0 0 ${WAVE.w - 40} 100" style="fill:${fill}">${BARS.map(bar).join('')}</svg>`;
const markup = `
<div id="grid"></div>
<div id="hot"></div>
<img id="sc" alt="">
<div id="scrim"></div>
<div id="title"><div><em>AI</em> MADE</div><div>${TT2}</div></div>
<div id="box"><div class="lab">${PRL}</div><div class="pl"><span id="pr1"></span><span class="pcur" id="pcur1"></span><br><span id="pr2"></span><span class="pcur" id="pcur2"></span></div></div>
<div id="card"><div class="hd"><i></i><i></i><i></i><span>${FILEW}</span></div><pre>${codeHtml}</pre></div>
<div id="slam"><b>CODE,<br><em>NOT VIDEO</em></b></div>
<div id="book"><div class="page" id="pgU"><img data-set="u"></div><div class="page" id="pgT"><img data-set="t"></div></div>
${[0, 1, 2, 3, 4].map(i => `<div class="fly" id="fly${i}"><div class="page"><img src="${STILLS_IMG[(i * 2 + 1) % STILLS_IMG.length]}"></div></div>`).join('')}
<div id="fps"><b id="fpsn">0</b><span>${FPSW}</span></div>
<div id="sheet"><img id="sheetImg" src="${SHEET_IMG}"></div>
<div id="wave"><div class="hd"><span>${VOICEW}</span><span id="wword"></span></div>
  <div id="wbars">${barsSvg('rgba(233,238,236,.07)')}<div id="wclip">${barsSvg(HOT)}</div></div>
  <div id="whead"></div>
  ${L4.W.map((_, i) => `<div class="wt" id="wt${i}"></div>`).join('')}
</div>
<div id="mini"><div class="page"><img id="miniImg"></div><div id="miniB"><div id="miniP"></div></div></div>
<div id="rev"><div class="hd"><span>${REVF}</span><span id="rdn">${RD1}</span></div>
  ${ROWS.map((r, i) => `<div class="rr" id="rr${i}"><span>${r.name}</span><b class="rs" id="rs${i}">${r.a}</b></div>`).join('')}
</div>
<div id="stamp">${STAMPW}</div>
<div id="win"><div class="tb"><i></i><i></i><i></i><span class="lb" id="lvs">${VSW}</span></div>
  <div id="ed"><div id="edit">${editHtml}</div></div>
  <div id="cc"><span class="lb" id="lcc">${CCW}</span><div class="pl"><b>&gt;</b><span id="ask"></span><span id="acur"></span></div></div>
</div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  const sc = $('sc');
  const pgT = $('pgT').firstElementChild, pgU = $('pgU').firstElementChild, mini = $('miniImg');
  let lastPre = null;
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, v] of o.X) {
        if (id === 'pgTi' || id === 'pgUi' || id === 'miniI') {
          const img = id === 'pgTi' ? pgT : id === 'pgUi' ? pgU : mini;
          if (last[id] !== v) { last[id] = v; img.src = D.st[+v]; }
          continue;
        }
        if ($(id).textContent !== v) $(id).textContent = v;
      }
      if (o.pre !== lastPre) { lastPre = o.pre; if (o.pre) sc.src = o.pre; sc.style.display = o.pre ? 'block' : 'none'; }
    },
    ready() {
      const imgs = [sc, pgT, pgU, mini].filter(i => i.style.display !== 'none' && i.getAttribute('src'));
      return Promise.all(imgs.map(i => i.decode().catch(() => null)));
    },
  };
}

/* ---------- the sound ----------
   Einz's sound pass. every sound is an elevenlabs sound effect, best of 3, one
   family: clean, crisp, bright modern ui sound, no bass. the kit's synthesised
   voices are gone from this clip. every take is high passed so a phone speaker
   plays all of it, and its loudest point is put on its frame: a swish peaks on
   the fastest frame of its move, a hit on contact. a quiet bed from
   elevenmusic runs under it, ducked under the words, out for the hush before
   line 7, back for the end. kinds named with whoosh, riser or sweep are moves,
   the rig does not hold them over the bed; everything else is struck */
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
/* the rig's glitch windows, onGrid's maths: 3 frames from 0.09s before the
   cut, 2 frames of residue on it, at whatever rate this render runs. the card
   lands clean when the residue ends */
const GA = { t0: Math.round((CUT - 0.09) * FPS) / FPS, n: 3 }, GB = { t0: Math.round(CUT * FPS) / FPS, n: 2 };
const LAND = f3(GB.t0 + Math.max(1, Math.round(GB.n / 60 * FPS)) / FPS);
const FAM = ', clean modern minimal interface sound design, crisp and bright, no bass, no music';
const EL = [
  { kind: 'swishwhoosh', prompt: 'very fast short air swish' + FAM, seconds: 0.5, keep: 0.3, mode: 'hit', gain: -17, hp: 350 },
  { kind: 'bigwhoosh', prompt: 'smooth fast whoosh pass by, airy' + FAM, seconds: 0.8, keep: 0.55, mode: 'hit', gain: -18, hp: 300 },
  { kind: 'hit', prompt: 'punchy impact hit with a crisp transient snap and a short airy tail' + FAM, seconds: 1.0, keep: 0.5, mode: 'hit', gain: -12, hp: 140 },
  { kind: 'tick', prompt: 'single soft keyboard key tick, very short' + FAM, seconds: 0.5, keep: 0.08, mode: 'hit', gain: -7, hp: 500 },
  { kind: 'uiclick', prompt: 'single soft subtle interface click, short' + FAM, seconds: 0.5, keep: 0.12, mode: 'hit', gain: -13, hp: 400 },
  { kind: 'fluttersweep', prompt: 'paper flipbook pages riffling fast, quick paper flutter', seconds: 1.2, keep: 0.9, mode: 'bed', fadeIn: 0.03, fadeOut: 0.12, gain: -19, hp: 300 },
  { kind: 'chime', prompt: 'short soft bright confirmation chime, one clean note' + FAM, seconds: 1.0, keep: 0.6, mode: 'hit', gain: -20, hp: 400 },
  { kind: 'stamp', prompt: 'satisfying rubber stamp pressed firmly onto paper, crisp thump with a paper snap', seconds: 0.8, keep: 0.45, mode: 'hit', gain: -7, hp: 150 },
  { kind: 'blip', prompt: 'quick digital data scramble blip, short computer chirp' + FAM, seconds: 0.5, keep: 0.22, mode: 'hit', gain: -12, hp: 400 },
  { kind: 'pop', prompt: 'bright clean bubble pop, playful' + FAM, seconds: 0.5, keep: 0.25, mode: 'hit', gain: -14, hp: 250 },
  /* the hook's riser and the glitch end, kept from the fix round, cached */
  { kind: 'elRiser', prompt: 'short bright rising riser, airy white noise sweep climbing in pitch and getting louder, builds tension, crisp, no bass, no drums', seconds: 1.5, mode: 'bed', fadeIn: 0.05, fadeOut: 0.04, gain: -22, hp: 350 },
  { kind: 'elGlitch', prompt: 'harsh digital glitch, stuttering corrupted data bursts, buffer stutter, bitcrushed computer error, short', seconds: 0.6, keep: 0.5, mode: 'hit', gain: -15, hp: 300 },
  { kind: 'elCrackle', prompt: 'short burst of electrical static crackle, digital noise interference, crisp crackling', seconds: 0.6, keep: f3(LAND - (GA.t0 - 0.03)), mode: 'bed', fadeIn: 0.01, fadeOut: 0.012, gain: -22, hp: 1200 },
];
const KEPT_EL = await elevenSfx(60, EL);
/* a riser is kept for how much it climbs, not for how steady it is */
{
  const rms = (b, a, z) => { let e = 0; for (let i = a; i < z; i++) e += b[i] * b[i]; return Math.sqrt(e / Math.max(1, z - a)); };
  const tk = [1, 2, 3].map(n => { const b = decode(ffmpegPath, path.join(HERE, 'out', 'sfx-post60', 'elRiser-t' + n + '.mp3')).subarray(0, Math.round(1.5 * SR)); const L = b.length; return { n, b, climb: +(20 * Math.log10((rms(b, Math.round(L * 0.66), L) + 1e-6) / (rms(b, 0, Math.round(L * 0.33)) + 1e-6))).toFixed(1) }; });
  const best = tk.reduce((x, y) => (y.climb > x.climb ? y : x));
  const b = Float32Array.from(best.b), fi = Math.round(0.05 * SR), fo = Math.round(0.03 * SR);
  for (let i = 0; i < fi; i++) b[i] *= i / fi;
  for (let i = 0; i < fo; i++) b[b.length - 1 - i] *= i / fo;
  VOICES.elRiser = () => b;
  KEPT_EL.elRiser.all = tk.map(x => 't' + x.n + ' climbs ' + x.climb + 'dB' + (x === best ? ' KEPT' : ''));
}
for (const e of EL) { const hp = highPass(VOICES[e.kind](), e.hp); VOICES[e.kind] = () => hp; }
/* the riser is a move: renamed so the rig treats it as one */
VOICES.hookriser = VOICES.elRiser; GAINS.hookriser = GAINS.elRiser;
for (const [k, v] of Object.entries(KEPT_EL)) console.log('  ' + k + ' ' + v.all.join(', '));
/* the glitch: each burst one grain of the glitch take, from its two loudest
   frames, repeated once a frame, a stutter */
const GRAINS = (() => {
  const src = VOICES.elGlitch(), fr = Math.round(SR / 60), lv = [];
  for (let a = 0; a + fr < src.length; a += Math.round(fr / 2)) { let e = 0; for (let i = a; i < a + fr; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
  lv.sort((x, y) => y.e - x.e);
  const one = lv[0], two = lv.find(x => Math.abs(x.off - one.off) > 0.05) || lv[1];
  return [one.off, two.off];
})();
function stutter(off, n, seed) {
  const src = VOICES.elGlitch(), fr = Math.round(SR / 60), g = Math.round(fr * 0.8), out = new Float32Array(fr * n), at = Math.round(off * SR);
  for (let k = 0; k < n; k++) for (let i = 0; i < g; i++) {
    const env = Math.min(1, i / 48, (g - i) / 48);
    out[k * fr + i] = src[Math.min(src.length - 1, at + i + (k % 2) * seed)] * env * (1 - 0.12 * k);
  }
  return out;
}
VOICES.stutA = () => stutter(GRAINS[0], GA.n, 0); GAINS.stutA = -12;
VOICES.stutB = () => stutter(GRAINS[1], GB.n, 300); GAINS.stutB = -14;
/* where each sound is loudest, so its peak goes on the frame */
const PEAK = {};
for (const k of ['swishwhoosh', 'bigwhoosh', 'hit', 'tick', 'uiclick', 'chime', 'stamp', 'blip', 'pop']) {
  const b = VOICES[k](); let m = 0, at = 0;
  for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > m) { m = Math.abs(b[i]); at = i; }
  PEAK[k] = at / SR;
}
console.log('  peaks ' + Object.entries(PEAK).map(([k, v]) => k + ' ' + v.toFixed(3)).join(', '));
const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });

const CUES = [
  /* the hook: a hit as AI MADE THIS lands, the riser under all of it, a swish on every hard cut */
  on(0.0, 'hit', 'AI MADE THIS lands, frame 0'),
  { t: 0.0, kind: 'hookriser', from: 'the riser under the super cut' },
  on(CUTS[1], 'swishwhoosh', 'hard cut 1'),
  on(CUTS[2], 'swishwhoosh', 'hard cut 2'),
  on(CUTS[3], 'swishwhoosh', 'hard cut 3'),
  on(HOOK, 'swishwhoosh', 'the hard cut to the grid'),
  /* l1 */
  on(BOX_IN + 0.06, 'uiclick', 'the prompt box springs in'),
  ...[0, 10].map(n => on(TYPE1 + n * PER1, 'tick', 'the prompt types')),
  /* l2: the flip, a whoosh into a hit on the slam */
  on(FLIP + 0.1, 'swishwhoosh', 'the box flips, fastest frame'),
  on(SLAM - 0.02, 'bigwhoosh', 'into the slam'),
  on(SLAM + 0.02, 'hit', 'CODE, NOT VIDEO lands'),
  /* l3: paper as the pages peel and the book riffles, a chime on 60 */
  { t: PEEL, kind: 'fluttersweep', from: 'the pages peel off the card' },
  { t: FLIPS + 0.1, kind: 'fluttersweep', from: 'the flipbook riffles' },
  on(SIXTY + 0.55, 'chime', 'the counter lands on 60'),
  on(peakAt(SHEET_IN, SHEET_IN + 0.5, CURVE.out), 'bigwhoosh', 'the contact sheet flies in'),
  /* l4 */
  on(WAVE_IN + 0.05, 'swishwhoosh', 'the sheet zooms through to the waveform'),
  /* l5 */
  on(MINI_IN + 0.05, 'uiclick', 'the clip card springs in'),
  on(REV_IN + 0.1, 'tick', 'the review rows type'),
  on(REV_IN + 0.3, 'tick', 'the review rows type'),
  on(FIX + 0.05, 'blip', 'the 7s scramble to 8'),
  on(STAMP + 0.03, 'stamp', 'NONE UNDER 8 stamps'),
  /* l6 */
  on(WIN_IN + 0.2, 'bigwhoosh', 'into the window'),
  on(CLAUDE + 0.03, 'uiclick', 'CLAUDE CODE lights'),
  /* l7: make it pop types, then pop, layered with the hit */
  ...[0, 4, 8].map(n => on(TYPE7 + n * PER7, 'tick', 'make it pop types')),
  on(POP, 'pop', 'everything pops'),
  on(POP + 0.01, 'hit', 'everything pops, the hit under it'),
  /* the end: crackle under both glitch windows, a stutter on each, a click as the card lands clean */
  { t: GA.t0 - 0.03, kind: 'elCrackle', from: 'static crackle under the glitch' },
  { t: GA.t0, kind: 'stutA', from: 'glitch burst 1, a grain a frame' },
  { t: GB.t0, kind: 'stutB', from: 'glitch burst 2, the residue' },
  on(LAND, 'uiclick', 'the data click, the card lands clean'),
].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
for (const c of CUES) if (c.t > L6.end - 0.05 && c.t < L7.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

/* the bed: quiet, light, upbeat, high passed for phones, out for the hush and back for line 7 */
const SECS = f3(CUT + HOLD);
const BED = await elevenMusic('post60', { prompt: 'quiet modern minimal electronic background bed, light and upbeat, soft plucked synth and a gentle muted beat, airy and bright, sparse, steady, 112 bpm, no vocals, no heavy bass, no drops', seconds: SECS, tries: 3 });
console.log('  music ' + BED.all.join(' | '));
{
  const b = highPass(BED.pcm, 110);
  const g = t => 1 - smooth(span(t, L6.end - 0.05, L6.end + 0.12)) * (1 - smooth(span(t, L7.at - 0.1, L7.at + 0.25)));
  for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
  const fo = Math.round(0.5 * SR);
  for (let i = 0; i < fo; i++) b[b.length - 1 - i] *= i / fo;
  BED.pcm = b;
}

const BEATS = [L6.end, SHOT, 2 * SHOT, 3 * SHOT, HOOK, TYPE1, ONE, FLIP, DEC, SLAM, SHRINK, PEEL, FLIPS, SIXTY, SHEET_IN, WAVE_IN, MOTION, WAVE_OUT, MINI_IN, REV_IN, GLOW7, FIX, STAMP, WIN_IN, CLAUDE, VS, LENS7, TYPE7, POP, SQUINT];
const STILLS = [0, 0.5, 0.9, 1.3, BOX_IN + 0.5, ONE + 0.3, FLIP + 0.12, DEC + 0.5, SLAM + 0.4, PEEL + 0.2, SIXTY + 0.3, SHEET_IN + 0.3, WAVE_IN + 0.5, MOTION + 0.12,
  MINI_IN + 0.3, GLOW7 + 0.1, FIX + 0.12, STAMP + 0.3, WIN_IN + 0.5, CLAUDE + 0.2, L6.end + 0.3, LENS7 + 0.2, TYPE7 + 0.4, POP + 0.08, SQUINT + 0.3, CUT + 0.6].map(f3);

console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', cut ' + CUT + ', total ' + f3(CUT + HOLD));
for (const T of TAKES) console.log('  ' + T.name + ': ' + T.all.join(' | '));

await runEpisode({
  post: 60, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: false,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6 },
  music: { pcm: BED.pcm, level: -24, duck: 0.6, under: -14, fx: 6 },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, page, frame, face, camera,
    prepare: t => (t < HOOK ? scFrame(t) : ''),
    ready: true,
    data: { st: STILLS_IMG },
    sleep: [],
    beats: BEATS,
    checks: ['#title div', '#box', '#card', '#slam b', '#book', '#fps', '#sheet', '#wave', '#mini', '#rev', '#stamp', '#win'],
    hook: ['#title', '#sc'],
    /* the code card is a picture of post59.mjs, word for word, and code has
       colons and a minus. it is left off the guard on purpose, like the sheet */
    copy: [TT1, TT2, PR1, PR2, PRL, SLAMW, '60', FPSW, FILEW, VOICEW, REVF, RD1, RD3, ...ROWS.map(r => r.name), STAMPW, VSW, CCW, ASK, '>'],
    verify: [
      { at: f3(SLAM + 0.05), sel: '#slam b', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'the slam leaves the margin: ' + JSON.stringify(r)) },
      { at: f3(STAMP + 0.05), sel: '#stamp', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'the stamp leaves the margin: ' + JSON.stringify(r)) },
      { at: 0.1, sel: '#title div', test: r => (r && r.t >= 60 ? null : 'the title is off its spot: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'AI MADE THIS'], ...CUTS.slice(1).map(c => [c, 'hard cut']), [HOOK, 'the grid, line 1'], [TYPE1, 'the prompt types'], [ONE, 'the squint'], [FLIP, 'the flip'], [DEC, 'the decode'], [SLAM, 'CODE, NOT VIDEO'],
      [SHRINK, 'the card shrinks'], [PEEL, 'pages peel'], [FLIPS, 'the flipbook'], [SIXTY, '60 FPS'], [SHEET_IN, 'the contact sheet'], [WAVE_IN, 'the waveform'], [MOTION, 'the ticks pulse'],
      [MINI_IN, 'the clip plays'], [REV_IN, 'the review'], [GLOW7, 'the 7s glow'], [FIX, '7 to 8'], [STAMP, 'NONE UNDER 8'], [WIN_IN, 'the window'], [CLAUDE, 'CLAUDE CODE'], [VS, 'VS CODE'],
      [L6.end, 'the hush'], [LENS7, 'to the lens'], [TYPE7, 'make it pop types'], [POP, 'pop'], [SQUINT, 'the squint'], [CUT, 'the cut']],
  },
});
