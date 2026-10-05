/* the boring tek — post51. the ai minister.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v4 for its
   audio tags, which are acted and never read, three takes a line and one kept
   by measurement, speed 1.0, about 0.42s between lines. post49's subtitles.
   the rig is lib/aiafter.mjs with the series off, and its new `coda`: a sung
   `the boring tek` on the end card. the effects are lib/sfx.mjs off the same
   word times, ducked under the read, and one paper slide from elevenlabs.

   after the true 2025 story: albania made an ai, diella, a minister, for
   public procurement. the opposition called it unconstitutional, people
   joked she would get corrupted too, and the prime minister said she is
   pregnant with 83 children, one assistant for each of his party's members
   of parliament. claims stay claims: the bubbles carry who said them.

     l1  did you know ...       frame 0: her half human half machine picture in a white outline
                                and glow, her minister sign, him looking up. the sign bounces
     l2  albania ...            a scan line turns the picture into her dot hologram face, albania
                                pops at the top, diella types, sun types and she warms
     l3  her job ...            four contracts slide in, a light line scans them, a check each
     l4  the opposition ...     two house speech bubbles from his side, one at a time, tagged
                                opposition and online, she dims
     l5  then the prime ...     she glides to the middle, pulses like a heartbeat, he squints
     l6  83 ai assistants ...   83 tiny orbs fly out into a parliament half circle, a counter to 83
     l7  so, would you ...      it all settles, he looks into the lens, a tilt on `government`
     the glitch cut, the end card with the sung line

   diella is a live hologram face: demo/assets/diella.png sampled into a grid of
   small warm dots, bright where the picture is bright, faint where it is dark,
   breathing in a slow wave down the face, a thin scan line looping over her.
   on line 1 she is demo/assets/diella-half.png, cropped right of the flag so
   no eagle shows. both pictures are local only and never committed: the
   script stops if one is missing. one warm sun colour, the one colour that is
   not green. no logos. eyes calm, happy or squint, never wide. no hands.
   on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post51.mjs          the preview
     node post51.mjs --stills             one still per beat, no render
     node post51.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO, prng,
} from './lib/aiafter.mjs';
import { elevenSfx } from './lib/elevensfx.mjs';
import { VOICES, GAINS } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ---------- the pictures, local only ---------- */
const SRC = { half: path.join(HERE, 'assets', 'diella-half.png'), face: path.join(HERE, 'assets', 'diella.png') };
for (const [k, f] of Object.entries(SRC)) if (!fs.existsSync(f)) { console.error('\nSTOPPED. the ' + k + ' picture is missing: ' + path.relative(HERE, f)); process.exit(1); }
/* her box, css px, the picture and the dots share it */
const HB = { w: 230, h: 304, pitch: 5 };
const CUTS = path.join(HERE, 'out', 'post51-assets');
fs.mkdirSync(CUTS, { recursive: true });
/* the half picture: 511 by 675 from x 440, right of the flag's eagle, at 2x */
execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', SRC.half, '-vf', 'crop=511:675:440:0,scale=' + 2 * HB.w + ':' + 2 * HB.h, '-q:v', '3', path.join(CUTS, 'half.jpg')]);
const HALF = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(CUTS, 'half.jpg')).toString('base64');
/* the face: the head and scarf, 400 by 528 from (260, 0), sampled at twice
   the dot grid and averaged 2x2. the background is transparent, so alpha is
   the mask. a dot is bright where she is bright, and never quite off inside
   her, so the dark hair still draws her outline */
const COLS = Math.round(HB.w / HB.pitch), ROWS_D = Math.round(HB.h / HB.pitch);
const raw = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', SRC.face, '-vf', 'crop=400:528:260:0,scale=' + 2 * COLS + ':' + 2 * ROWS_D + ':flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 26 });
const DOTS = [];
for (let r = 0; r < ROWS_D; r++) for (let c = 0; c < COLS; c++) {
  let a = 0, l = 0;
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const k = ((2 * r + dy) * 2 * COLS + 2 * c + dx) * 4, al = raw[k + 3] / 255;
    a += al / 4; l += al * (0.2126 * raw[k] + 0.7152 * raw[k + 1] + 0.0722 * raw[k + 2]) / 255 / 4;
  }
  if (a < 0.5) continue;
  const v = 0.12 + 0.88 * Math.min(1, Math.max(0, (l / a - 0.45) / 0.47));
  DOTS.push(+((c + 0.5) * HB.pitch).toFixed(1), +((r + 0.5) * HB.pitch).toFixed(1), +v.toFixed(3));
}

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const LINES = [
  { key: 'r1', text: '[curious] did you know one country made an ai a government minister?' },
  { key: 'r2', text: 'albania. her name is diella. it means sun.' },
  { key: 'r3', text: 'her job? [playful] stop corruption in government contracts.' },
  { key: 'r4', text: 'the opposition said it broke the constitution. people online joked, even diella will get corrupted.' },
  { key: 'r5', text: '[laughs] then the prime minister said diella is pregnant. with 83 children.' },
  { key: 'r6', text: '83 ai assistants. one for each member of parliament in his party.' },
  { key: 'r7', text: '[warmly] so, would you let ai run your government?' },
];
const TAKES = await readLines(51, LINES, 3, MODEL);
const [SUNG] = await readLines(51, [{ key: 's1', text: '[sings] the boring tek.' }], 3, MODEL);
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'did you know' },
  { line: 0, text: 'one country made an ai' },
  { line: 0, text: 'a government minister?' },
  { line: 1, text: 'albania' },
  { line: 1, text: 'her name is diella' },
  { line: 1, text: 'it means sun' },
  { line: 2, text: 'her job?' },
  { line: 2, text: 'stop corruption' },
  { line: 2, text: 'in government contracts' },
  { line: 3, text: 'the opposition said' },
  { line: 3, text: 'it broke the constitution' },
  { line: 3, text: 'people online joked' },
  { line: 3, text: 'even diella will get corrupted' },
  { line: 4, text: 'then the prime minister said' },
  { line: 4, text: 'diella is pregnant' },
  { line: 4, text: 'with 83 children' },
  { line: 5, text: '83 ai assistants' },
  { line: 5, text: 'one for each member of parliament' },
  { line: 5, text: 'in his party' },
  { line: 6, text: 'so, would you let ai' },
  { line: 6, text: 'run your government?' },
];

/* ---------- the words on screen ---------- */
const SIGN = 'minister', ALB = 'albania', NAME = 'diella', SUNW = 'sun', DOC = 'contract';
const B1 = { tag: 'opposition', text: 'it broke the constitution' };
const B2 = { tag: 'online', text: 'even diella will get corrupted' };
const KIDS = 'ai assistants', N_KIDS = 83;

/* ---------- the layout, css px of the 540x960 stage ----------
   diella at the top of the centre column, her sign under her. he sits small
   in the lower right, clear of the subtitles at 770. on `then` she glides to
   the middle and the half circle grows round her. */
const MAS = { cx: 428, cy: 700, size: 118, scale: 0.75 };
const HOME = { x: 270, y: 300 }, MID = { x: 270, y: 476, s: 0.55 };
const SIGN_DY = HB.h / 2 + 10;
const PAPER = { w: 80, h: 104, gap: 14, top: 512 };
PAPER.l = 270 - (4 * PAPER.w + 3 * PAPER.gap) / 2;
/* the bubbles come off his head, post49's thought bubble geometry: two dots
   up and a little left of him, then the pill, its right end at 470 */
const HEADR = 30 / 64 * MAS.size * MAS.scale;
const TB = { angle: -104 * Math.PI / 180, gap: 9, d0: 9, d1: 13, right: 470, h: 18 * 1.25 + 20 + 4 };
TB.r0 = HEADR + TB.gap + TB.d0 / 2; TB.r1 = TB.r0 + TB.d0 / 2 + TB.gap + TB.d1 / 2; TB.r2 = TB.r1 + TB.d1 / 2 + TB.gap;
TB.c0 = { x: MAS.cx + TB.r0 * Math.cos(TB.angle), y: MAS.cy + TB.r0 * Math.sin(TB.angle) };
TB.c1 = { x: MAS.cx + TB.r1 * Math.cos(TB.angle), y: MAS.cy + TB.r1 * Math.sin(TB.angle) };
TB.bottom = MAS.cy + TB.r2 * Math.sin(TB.angle);
/* the parliament: four rows of seats over her, 17 + 19 + 22 + 25 = 83 */
const ROWS = [{ r: 130, n: 17 }, { r: 152, n: 19 }, { r: 174, n: 22 }, { r: 196, n: 25 }];
const SEATS = [];
for (const row of ROWS) for (let k = 0; k < row.n; k++) {
  const a = Math.PI + Math.PI * (0.035 + 0.93 * k / (row.n - 1));
  SEATS.push({ x: +(MID.x + row.r * Math.cos(a)).toFixed(2), y: +(MID.y + row.r * Math.sin(a)).toFixed(2) });
}
if (SEATS.length !== N_KIDS) throw new Error('the seats are ' + SEATS.length);
/* the order they fill in, shuffled so it reads as a burst and not a sweep */
const ORDER = (() => { const r = prng(0x51d1e1), o = SEATS.map((_, i) => i); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; })();
const COUNT_Y = 158;

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const MIN = w(L1, 'minister');
const FLARE = w(L1, 'ai');
const ALB_AT = w(L2, 'albania');
/* the picture turns into the dots under a scan line, on line 2 */
const TURN = { a: +(L2.at - 0.12).toFixed(3), b: +(L2.at + 0.68).toFixed(3) };
const B1_OUT = +(w(L4, 'joked') - 0.32).toFixed(3);
const NAME_T = { a: w(L2, 'diella'), b: +(w(L2, 'diella') + 0.45).toFixed(3) };
const SUN_T = { a: w(L2, 'sun'), b: +(w(L2, 'sun') + 0.2).toFixed(3) };
const OUT_A = +(L3.at - 0.05).toFixed(3);
const JOB = w(L3, 'job');
const SCAN = { a: w(L3, 'corruption'), b: +(w(L3, 'corruption') + 0.75).toFixed(3) };
const CHECKS = [0, 1, 2, 3].map(i => +(w(L3, 'contracts') + i * 0.13).toFixed(3));
const OUT_B = +(L4.at - 0.05).toFixed(3);
const BROKE = w(L4, 'broke');
const JOKED = w(L4, 'joked');
const DIM = w(L4, 'corrupted');
const GLIDE = { a: w(L5, 'then'), b: +(w(L5, 'then') + 0.7).toFixed(3) };
const PREG = w(L5, 'pregnant');
const FAST = w(L5, '83');
const BURST = w(L6, '83');
const FLY = 0.42, STAG = 0.011;
const LAUNCH = SEATS.map((_, i) => +(BURST + 0.04 + ORDER.indexOf(i) * STAG).toFixed(4));
const FULL = +(BURST + 0.04 + (N_KIDS - 1) * STAG + FLY).toFixed(3);
const PARTY = w(L6, 'party');
const SETTLE = +(L7.at + 0.05).toFixed(3);
const GOV = w(L7, 'government');
const CUT = +(L7.end + 0.45).toFixed(3);
place(SUNG, CUT + 0.2);
const HOLD = +(SUNG.end - CUT + 0.5).toFixed(3);

const typed = (t, ww, s) => (t < ww.a ? '' : s.slice(0, Math.round(s.length * span(t, ww.a, ww.b))));
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);

/* ---------- diella ---------- */
/* a heartbeat: a sharp swell that dies, on every beat from `a` */
function beat(t, a, b, period) {
  if (t < a || t >= b) return 0;
  const k = (t - a) % period;
  return Math.min(1, k / 0.04) * Math.exp(-Math.max(0, k - 0.04) / 0.13);
}
function holo(t) {
  const g = EASE(span(t, GLIDE.a, GLIDE.b));
  const x = lerp(HOME.x, MID.x, g), y = lerp(HOME.y, MID.y, g);
  const pulse = Math.max(beat(t, PREG, FAST, 0.62), beat(t, FAST, BURST + 0.1, 0.34));
  /* the hook swell and the flare on `ai` light the picture's glow */
  const swell = 0.25 * bump(t, 0.3, 0.3, 0.1, 0.5) + 0.35 * bump(t, FLARE, 0.08, 0.1, 0.45);
  const warm = smooth(span(t, SUN_T.a, SUN_T.a + 0.5)) * (1 - smooth(span(t, OUT_A, OUT_A + 0.6)) * 0.6);
  const dim = 0.6 * smooth(span(t, DIM, DIM + 0.4)) * (1 - smooth(span(t, GLIDE.a, GLIDE.a + 0.4)));
  const scan = bump(t, SCAN.a, 0.12, SCAN.b - SCAN.a - 0.12, 0.25);
  const party = bump(t, PARTY, 0.1, 0.25, 0.4);
  const settle = smooth(span(t, SETTLE, SETTLE + 0.6));
  const s = lerp(1, MID.s, g) * (1 + 0.06 * pulse);
  const reveal = IO(span(t, TURN.a, TURN.b));
  /* the scan line: it is the edge of the turn, then it loops down her every 2.6s */
  const loop = t < TURN.b ? reveal : ((t - TURN.b) / 2.6) % 1;
  return {
    x: +x.toFixed(2), y: +y.toFixed(2), s: +s.toFixed(4), t: +t.toFixed(4),
    reveal: +reveal.toFixed(4), half: +(1 + swell).toFixed(4),
    sy: +(loop * HB.h).toFixed(2), so: +(t < TURN.a ? 0 : t < TURN.b ? 1 : 0.5 * (1 - 0.6 * dim)).toFixed(3),
    bright: +Math.max(0, (1 - dim) * (1 + 0.35 * pulse + 0.15 * scan + 0.15 * party) * (1 - 0.12 * settle)).toFixed(4),
    warm: +warm.toFixed(4),
  };
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: AT(HOME.x, HOME.y - 40) },
  { at: ALB_AT, to: AT(270, 120) },
  { at: NAME_T.a, to: AT(270, 526) },
  { at: SUN_T.a + 0.3, to: AT(HOME.x, HOME.y - 40) },
  { at: JOB, to: AT(270, 552) },
  { at: BROKE, to: AT(330, 590) },
  { at: JOKED, to: AT(320, 590) },
  { at: DIM + 0.2, to: AT(HOME.x, HOME.y - 40) },
  { at: GLIDE.a + 0.2, to: AT(MID.x, MID.y) },
  { at: BURST + 0.2, to: AT(270, 330) },
  { at: BURST + 1.0, to: AT(270, COUNT_Y) },
  { at: PARTY, to: AT(MID.x, MID.y - 100) },
  { at: SETTLE, to: LENS },
];
const BLINKS = [1.9, +(L2.at + 0.15).toFixed(3), +(L3.at + 0.2).toFixed(3), +(w(L4, 'opposition')).toFixed(3), +(w(L6, 'member')).toFixed(3), +(L7.at - 0.2).toFixed(3)];
const SQUINTS = [[PREG, PREG + 1.4], [DIM + 0.05, DIM + 0.85]];
const HAPPY = [SUN_T.a + 0.15, CHECKS[3] + 0.05, PARTY];
const HOPS = [MIN + 0.02, CHECKS[3] + 0.05];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const lens = { x: MAS.cx, y: MAS.cy, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.22));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const [a, b] of SQUINTS) lid = Math.max(lid, 0.04 + 0.46 * bump(t, a, 0.15, Math.max(0, b - a - 0.3), 0.15));
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  let dy = 0, rot = 0;
  for (const h of HOPS) dy -= 10 * Math.sin(Math.PI * span(t, h, h + 0.3));
  /* the heartbeat reaches him too, a small nod on each */
  dy += 2 * Math.max(beat(t, PREG, FAST, 0.62), beat(t, FAST, BURST + 0.1, 0.34));
  /* the question: a head tilt, held */
  rot -= 9 * bump(t, GOV, 0.25, CUT - GOV, 0);
  dy += 2.5 * Math.sin(2 * Math.PI * t / 2.2);
  return { lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, dy: +dy.toFixed(3), rot: +rot.toFixed(3) };
}

/* ---------- a frame of the story ---------- */
function frame(t) {
  const o = holo(t);
  const sign = { x: o.x, y: +(o.y + SIGN_DY * o.s).toFixed(2), b: +(-8 * Math.sin(Math.PI * span(t, MIN, MIN + 0.32))).toFixed(2), s: +(1 + 0.1 * Math.sin(Math.PI * span(t, MIN, MIN + 0.32))).toFixed(4) };
  /* scene a: albania, her name, sun */
  const aOut = out(t, OUT_A, 0.3);
  const alb = pop(t, ALB_AT); alb.o = +(alb.o * (1 - aOut)).toFixed(3);
  const name = { txt: typed(t, NAME_T, NAME), o: +(1 - aOut).toFixed(3) };
  const sun = { txt: typed(t, SUN_T, SUNW), o: +(1 - aOut).toFixed(3), s: +lerp(1.3, 1, SPRING(span(t, SUN_T.a, SUN_T.a + 0.4))).toFixed(4) };
  /* scene b: the contracts */
  const bOut = out(t, OUT_B, 0.3);
  const papers = [0, 1, 2, 3].map(i => {
    const a = JOB + i * 0.06, k = EASE(span(t, a, a + 0.42));
    return { x: +(lerp(56, 0, k)).toFixed(2), r: +lerp(7, 0, k).toFixed(3), o: +(smooth(span(t, a, a + 0.18)) * (1 - bOut)).toFixed(3), y: +(30 * bOut).toFixed(2) };
  });
  const scan = { y: +lerp(PAPER.top - 8, PAPER.top + PAPER.h + 8, IO(span(t, SCAN.a, SCAN.b))).toFixed(2), o: +bump(t, SCAN.a, 0.1, SCAN.b - SCAN.a - 0.2, 0.1).toFixed(3) };
  const checks = CHECKS.map(a => { const p = pop(t, a, 0.35, 0.3); return { s: p.s, o: +(p.o * (1 - bOut)).toFixed(3) }; });
  /* scene c: the two bubbles, one at a time, off his head: the near dot, the
     far dot, the pill. the first goes before the second comes */
  const bub = [[BROKE, B1_OUT], [JOKED, GLIDE.a]].map(([a, z]) => {
    const gone = 1 - out(t, z, 0.2);
    const d = (x, k) => (t < x ? { o: 0, s: 0.55 } : { o: +(smooth(span(t, x, x + 0.08)) * gone).toFixed(3), s: +lerp(0.55, 1, SPRING(span(t, x, x + k))).toFixed(4) });
    return { d0: d(a, 0.3), d1: d(a + 0.07, 0.3), p: d(a + 0.14, 0.34) };
  });
  /* scene d: the burst and the count */
  const kids = SEATS.map((st, i) => {
    const a = LAUNCH[i];
    if (t < a) return null;
    const u = span(t, a, a + FLY), e = EASE(u);
    /* a curve out and round: the control point past the seat, off to the side */
    const sx = o.x, sy = o.y;
    const cx = st.x + (st.x - MID.x) * 0.35 + (st.y - MID.y) * 0.2, cy = st.y + (st.y - MID.y) * 0.35 - (st.x - MID.x) * 0.2;
    const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * st.x;
    const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * st.y;
    const land = SPRING(span(t, a + FLY - 0.05, a + FLY + 0.3));
    const s = u < 1 ? lerp(0.45, 0.8, e) : lerp(0.8, 1, land);
    return [+x.toFixed(1), +y.toFixed(1), +s.toFixed(3)];
  });
  let landed = 0; for (const a of LAUNCH) if (t >= a + FLY) landed++;
  const sOut = smooth(span(t, SETTLE, SETTLE + 0.6));
  const seats = { o: +(1 - 0.62 * sOut).toFixed(3), glow: +bump(t, PARTY, 0.1, 0.25, 0.4).toFixed(3) };
  const count = { n: t < BURST ? '' : String(landed), o: +(smooth(span(t, BURST, BURST + 0.12)) * (1 - 0.7 * sOut)).toFixed(3),
    s: +(1 + 0.12 * Math.sin(Math.PI * span(t, FULL, FULL + 0.3)) + 0.08 * bump(t, PARTY, 0.1, 0.2, 0.3)).toFixed(4),
    lbl: +smooth(span(t, BURST + 0.3, BURST + 0.5)).toFixed(3) };
  return { o, sign, alb, name, sun, papers, scan, checks, bub, kids, seats, count };
}

/* ---------- the page ---------- */
const SUNC = '#ffbe4a';
const PIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>';
const TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06070a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const GLOW = 'k => "drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 0 14px rgba(255,255,255," + (0.8 * k).toFixed(3) + ")) drop-shadow(0 0 40px rgba(255,255,255," + (0.5 * k).toFixed(3) + ")) drop-shadow(0 0 90px rgba(255,255,255," + (0.3 * k).toFixed(3) + "))"';
const css = `
#holo{position:absolute;left:0;top:0;width:${HB.w}px;height:${HB.h}px;transform-origin:50% 50%;will-change:transform}
#halfw{position:absolute;inset:0;will-change:filter,opacity}
#half{display:block;width:${HB.w}px;height:${HB.h}px;border-radius:14px}
#dots{position:absolute;left:0;top:0;width:${HB.w}px;height:${HB.h}px;filter:drop-shadow(0 0 3px rgba(255,200,90,.7)) drop-shadow(0 0 16px rgba(255,190,74,.3))}
#hscan{position:absolute;left:-12px;right:-12px;top:0;height:2px;border-radius:1px;background:#ffe9bd;opacity:0;
  box-shadow:0 0 8px rgba(255,190,74,.85),0 0 22px rgba(255,190,74,.35);will-change:transform,opacity}
#sign{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;will-change:transform}
#sign b{font:400 19px/1 var(--mono);font-weight:400;color:var(--fg);letter-spacing:.24em;text-indent:.24em;padding:9px 16px 8px;border:1px solid rgba(255,255,255,.26);border-radius:5px;background:#14171c;white-space:nowrap}
#sign i{display:block;width:180px;height:2px;margin-top:6px;border-radius:1px;background:rgba(255,255,255,.14)}
#alb{position:absolute;left:50%;top:94px;transform-origin:50% 100%;display:flex;align-items:center;gap:8px;padding:9px 14px 9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.22);
  font:400 21px/1 var(--mono);color:var(--fg);letter-spacing:.06em;white-space:nowrap;opacity:0;will-change:transform,opacity}
#alb i{display:flex;color:${SUNC}}
#name{position:absolute;left:60px;right:60px;top:516px;text-align:center;font:400 40px/1 var(--display);color:var(--fg);letter-spacing:.04em;white-space:nowrap;min-height:40px}
#sun{position:absolute;left:190px;right:190px;top:572px;text-align:center;font:400 30px/1 var(--mono);color:${SUNC};letter-spacing:.2em;text-indent:.2em;white-space:nowrap;min-height:30px;
  text-shadow:0 0 14px rgba(255,190,74,.35);will-change:transform}
.paper{position:absolute;top:${PAPER.top}px;width:${PAPER.w}px;height:${PAPER.h}px;border-radius:6px;background:#14171c;border:1px solid rgba(255,255,255,.18);opacity:0;padding:11px 9px;will-change:transform,opacity}
.paper b{display:block;font:400 10.5px/1 var(--mono);font-weight:400;color:var(--sub);letter-spacing:.06em;margin-bottom:11px}
.paper i{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.13);margin-bottom:8px}
.paper .ck{position:absolute;right:-10px;top:-10px;width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity}
#scan{position:absolute;left:${PAPER.l - 14}px;width:${4 * PAPER.w + 3 * PAPER.gap + 28}px;height:2px;border-radius:1px;background:#ffe3a6;opacity:0;
  box-shadow:0 0 8px rgba(255,190,74,.8),0 0 20px rgba(255,190,74,.35);will-change:transform,opacity}
/* the house speech bubble: the pill and two dots, equal gaps, off his head */
.bub{position:absolute;inset:0}
.bub .tg{position:absolute;left:20px;top:-22px;font:400 13px/1 var(--mono);color:var(--sub);letter-spacing:.14em;white-space:nowrap}
.bub .p{position:absolute;right:${540 - TB.right}px;top:${(TB.bottom - TB.h).toFixed(2)}px;height:${TB.h}px;padding:10px 18px;border:2px solid rgba(213,219,216,.5);border-radius:999px;background:#06070a;color:#f4f7f5;
  font:500 18px/1.25 var(--read);white-space:nowrap;opacity:0;transform-origin:calc(100% - ${(TB.right - TB.c1.x).toFixed(1)}px) 100%;will-change:transform,opacity}
.bub .d{position:absolute;display:block;border-radius:50%;background:#06070a;border:2px solid rgba(213,219,216,.5);opacity:0;will-change:transform,opacity}
#kids{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
#count{position:absolute;left:170px;right:170px;top:${COUNT_Y - 30}px;text-align:center;font:400 54px/1 var(--display);color:var(--fg);white-space:nowrap;opacity:0;will-change:transform,opacity;
  text-shadow:0 0 10px rgba(255,255,255,.25)}
#clbl{position:absolute;left:60px;right:60px;top:${COUNT_Y + 38}px;text-align:center;font:400 18px/1 var(--mono);color:var(--sub);letter-spacing:.1em;white-space:nowrap;opacity:0}
`;
const papers = [0, 1, 2, 3].map(i => `<div class="paper" id="pp${i}" style="left:${PAPER.l + i * (PAPER.w + PAPER.gap)}px"><b>${DOC}</b><i></i><i style="width:80%"></i><i></i><i style="width:55%"></i><span class="ck" id="ck${i}">${TICK}</span></div>`).join('');
const dot = (id, c, d) => `<i class="d" id="${id}" style="left:${(c.x - d / 2).toFixed(2)}px;top:${(c.y - d / 2).toFixed(2)}px;width:${d}px;height:${d}px"></i>`;
const bubble = (k, B) => `<div class="bub" id="bub${k}">
    ${dot('b' + k + 'd0', TB.c0, TB.d0)}${dot('b' + k + 'd1', TB.c1, TB.d1)}
    <div class="p" id="b${k}p"><span class="tg">${B.tag}</span>${B.text}</div></div>`;
const markup = `
<div id="alb"><i>${PIN}</i>${ALB}</div>
<div id="name"></div><div id="sun"></div>
${papers}
<div id="scan"></div>
${bubble(0, B1)}${bubble(1, B2)}
<svg id="kids" viewBox="0 0 540 960">
  <defs><radialGradient id="kid"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="#ffe0a0"/><stop offset="1" stop-color="${SUNC}"/></radialGradient>
  <radialGradient id="kidh"><stop offset="0" stop-color="${SUNC}" stop-opacity=".45"/><stop offset="1" stop-color="${SUNC}" stop-opacity="0"/></radialGradient></defs>
  <g id="kidg"></g>
</svg>
<div id="count"></div><div id="clbl">${KIDS}</div>
<div id="holo"><canvas id="dots" width="${2 * HB.w}" height="${2 * HB.h}"></canvas><div id="halfw"><img id="half" src="${HALF}" alt=""></div><div id="hscan"></div></div>
<div id="sign"><b>${SIGN}</b><i></i></div>`;

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const E = {};
  for (const id of ['holo', 'dots', 'halfw', 'half', 'hscan', 'sign', 'alb', 'name', 'sun', 'scan', 'count', 'clbl', 'kidg']) E[id] = $(id);
  const ctx = E.dots.getContext('2d');
  const DT = D.dots, P = D.pitch, H = D.h;
  const glow = new Function('return ' + D.glow)();
  /* one hologram frame: every dot sized by its brightness, a slow breath
     running down the face, the dots by the scan line lit up, a few flicker */
  function holoDraw(b) {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, D.w, H);
    if (b.reveal <= 0) return;
    const edge = b.reveal * H, fr = Math.floor(b.t * 30);
    const cg = Math.round(200 - 18 * b.warm), cb = Math.round(110 - 40 * b.warm);
    for (let i = 0; i < DT.length; i += 3) {
      const x = DT[i], y = DT[i + 1], v = DT[i + 2];
      if (y > edge) continue;
      const near = b.so > 0 ? Math.max(0, 1 - Math.abs(y - b.sy) / 12) : 0;
      const breath = 1 + 0.12 * Math.sin(2 * Math.PI * (b.t / 2.8) - y * 0.035);
      const h = (Math.imul(i + 1, 2654435761) ^ Math.imul(fr + 7, 40503)) >>> 0;
      const flick = h % 89 === 0 ? 0.35 : 1;
      /* an oval falloff, so she fades out at her edges and never ends in the crop's rectangle */
      const ex = (x - D.w / 2) / (D.w / 2), ey = (y - H * 0.46) / (H * 0.56), ed = Math.sqrt(ex * ex + ey * ey);
      const fade = ed < 0.72 ? 1 : ed > 1 ? 0 : 1 - (ed - 0.72) / 0.28;
      if (fade <= 0) continue;
      const r = P * 0.5 * (0.3 + 0.5 * v) * breath * (1 + 0.3 * near);
      const a = Math.min(1, (0.45 + 0.75 * v) * b.bright * flick * fade + 0.5 * near * fade);
      const k = Math.min(1, 0.25 + v * 0.75 + near);
      ctx.fillStyle = 'rgba(255,' + Math.round(cg + (238 - cg) * k) + ',' + Math.round(cb + (200 - cb) * k) + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  }
  const pp = [0, 1, 2, 3].map(i => $('pp' + i)), ck = [0, 1, 2, 3].map(i => $('ck' + i));
  const bub = [0, 1].map(k => ({ w: $('bub' + k), d0: $('b' + k + 'd0'), d1: $('b' + k + 'd1'), p: $('b' + k + 'p') }));
  const kids = [];
  for (let i = 0; i < D.n; i++) {
    const g = document.createElementNS(NS, 'g');
    const h = document.createElementNS(NS, 'circle'); h.setAttribute('r', '13'); h.setAttribute('fill', 'url(#kidh)');
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '5.5'); c.setAttribute('fill', 'url(#kid)');
    g.appendChild(h); g.appendChild(c); g.style.display = 'none';
    E.kidg.appendChild(g); kids.push({ g, h });
  }
  const last = {};
  const txt = (k, el, v) => { if (last[k] !== v) { last[k] = v; el.textContent = v; } };
  window.__gag = {
    apply(o) {
      const b = o.o;
      E.holo.style.transform = 'translate(' + (b.x - D.w / 2) + 'px,' + (b.y - H / 2) + 'px) scale(' + b.s + ')';
      holoDraw(b);
      /* the picture under the turn: cut away above the scan line, its glow going with it */
      E.halfw.style.display = b.reveal >= 1 ? 'none' : '';
      E.half.style.clipPath = 'inset(' + (b.reveal * H).toFixed(1) + 'px 0 0 0 round 14px)';
      E.halfw.style.filter = glow(b.half * (1 - b.reveal));
      E.hscan.style.opacity = b.so; E.hscan.style.transform = 'translateY(' + b.sy + 'px)';
      E.sign.style.transform = 'translate(-50%,0) translate(' + o.sign.x + 'px,' + (o.sign.y + o.sign.b) + 'px) scale(' + o.sign.s + ')';
      E.alb.style.opacity = o.alb.o; E.alb.style.transform = 'translate(-50%,0) scale(' + o.alb.s + ')';
      txt('name', E.name, o.name.txt); E.name.style.opacity = o.name.o;
      txt('sun', E.sun, o.sun.txt); E.sun.style.opacity = o.sun.o; E.sun.style.transform = 'scale(' + o.sun.s + ')';
      o.papers.forEach((p, i) => { pp[i].style.opacity = p.o; pp[i].style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg)'; });
      o.checks.forEach((c, i) => { ck[i].style.opacity = c.o; ck[i].style.transform = 'scale(' + c.s + ')'; });
      E.scan.style.opacity = o.scan.o; E.scan.style.transform = 'translateY(' + o.scan.y + 'px)';
      o.bub.forEach((x, k) => {
        const B = bub[k];
        B.w.style.transform = 'translateY(' + x.y + 'px)';
        [['d0', x.d0], ['d1', x.d1], ['p', x.p]].forEach(([id, v]) => { B[id].style.opacity = v.o; B[id].style.transform = 'scale(' + v.s + ')'; });
      });
      E.kidg.setAttribute('opacity', o.seats.o);
      o.kids.forEach((k, i) => {
        const K = kids[i];
        if (!k) { K.g.style.display = 'none'; return; }
        K.g.style.display = '';
        K.g.setAttribute('transform', 'translate(' + k[0] + ' ' + k[1] + ') scale(' + k[2] + ')');
        K.h.setAttribute('r', (12 + 3 * o.seats.glow).toFixed(1));
      });
      txt('count', E.count, o.count.n); E.count.style.opacity = o.count.o; E.count.style.transform = 'scale(' + o.count.s + ')';
      E.clbl.style.opacity = Math.min(o.count.o, o.count.lbl);
    },
  };
}

/* ---------- the effects, off the word times, under the read ---------- */
const EL = [
  { kind: 'elPaper', prompt: 'a small stack of paper sheets sliding quickly across a wooden desk, one short dry paper swish, close mic, no music', seconds: 1.0, mode: 'hit', keep: 0.5, gain: -12 },
];
let FROM_EL;
try { const kept = await elevenSfx(51, EL); FROM_EL = 'elevenlabs'; for (const [k, v] of Object.entries(kept)) console.log('  ' + k + ' ' + v.all.join(', ')); }
catch (e) { VOICES.elPaper = VOICES.whoosh; GAINS.elPaper = -20; FROM_EL = 'the kit whoosh, elevenlabs said no: ' + String(e && e.message || e).slice(0, 160); }
console.log('  the paper slide: ' + FROM_EL);

const taps = (ww, len, every, seed) => {
  const r = [];
  for (let k = every; k <= len; k += every) r.push({ t: +lerp(ww.a, ww.b, k / len).toFixed(4), kind: 'tap', opts: { seed: seed + k * 977 }, from: 'typing' });
  return r;
};
const beatsAt = (a, b, p) => { const r = []; for (let x = a; x < b; x += p) r.push(+x.toFixed(4)); return r; };
const CUES = [
  { t: 0.02, kind: 'bwop', from: 'the hook settles' },
  { t: 0.3, kind: 'riser', opts: { len: 0.5 }, from: 'the glow swells' },
  { t: FLARE, kind: 'whooshUp', opts: { len: 0.4 }, from: 'the glow flares on ai' },
  { t: MIN, kind: 'tock', opts: { f: 1500 }, from: 'the sign' },
  { t: MIN + 0.03, kind: 'bounce', opts: { f0: 260, f1: 150 }, from: 'the sign bounces, his hop' },
  { t: TURN.a, kind: 'sweep', opts: { len: 0.8 }, from: 'the picture turns into dots' },
  { t: TURN.b - 0.05, kind: 'sparkle', from: 'the hologram is on' },
  { t: ALB_AT, kind: 'bubble', from: 'albania pops' },
  ...taps(NAME_T, NAME.length, 1, 0x2d11a3),
  ...taps(SUN_T, SUNW.length, 1, 0x7c21e9),
  { t: SUN_T.a + 0.2, kind: 'chime', from: 'she warms' },
  { t: OUT_A, kind: 'whoosh', from: 'scene a goes' },
  { t: JOB, kind: 'elPaper', from: 'the contracts slide in' },
  { t: SCAN.a, kind: 'sweep', opts: { len: 0.7 }, from: 'the scan line' },
  ...CHECKS.map((t, i) => ({ t, kind: 'toggle', from: 'a check' })),
  ...CHECKS.map((t, i) => ({ t: t + 0.01, kind: 'bubble', opts: { f0: 500 + i * 90, f1: 1300 + i * 160 }, from: 'a check pops' })),
  { t: OUT_B, kind: 'whoosh', from: 'the contracts go' },
  ...[BROKE, JOKED].flatMap((a, k) => [
    { t: a, kind: 'tock', opts: { f: 1500 }, from: 'bubble dot' }, { t: a + 0.07, kind: 'tock', opts: { f: 1700 }, from: 'bubble dot' },
    { t: a + 0.14, kind: 'bubble', opts: { f0: 420 + 100 * k, f1: 1100 + 250 * k }, from: k ? 'online bubble' : 'opposition bubble' }]),
  { t: DIM, kind: 'whoosh', opts: { len: 0.3 }, from: 'she dims' },
  { t: GLIDE.a, kind: 'whoosh', from: 'the bubbles go, she glides' },
  ...beatsAt(PREG, FAST, 0.62).map(t => ({ t, kind: 'popDeep', from: 'heartbeat' })),
  ...beatsAt(FAST, BURST + 0.1, 0.34).map(t => ({ t, kind: 'popDeep', from: 'heartbeat, faster' })),
  { t: +(BURST - 0.45).toFixed(3), kind: 'riser', opts: { len: 0.45 }, from: 'into the burst' },
  { t: BURST + 0.02, kind: 'whooshUp', from: 'the burst' },
  ...SEATS.map((_, i) => i).filter(k => k % 4 === 3).map((k, j) => ({ t: +(BURST + 0.04 + k * STAG + FLY).toFixed(4), kind: 'bubble', opts: { f0: 480 + j * 22, f1: 1250 + j * 40 }, from: 'seats fill' })),
  { t: FULL, kind: 'land', from: 'all 83' },
  { t: PARTY, kind: 'chime', from: 'the half circle glows' },
  { t: SETTLE, kind: 'whoosh', opts: { len: 0.3 }, from: 'it settles' },
  { t: GOV, kind: 'tock', opts: { f: 1300 }, from: 'his tilt' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const BEATS = [0.3, FLARE, MIN, TURN.a, ALB_AT, B1_OUT, NAME_T.a, SUN_T.a, JOB, SCAN.a, CHECKS[0], BROKE, JOKED, DIM, GLIDE.a, PREG, FAST, BURST, FULL, PARTY, SETTLE, GOV];
const STILLS = [0, 0.6, FLARE + 0.2, MIN + 0.3, TURN.a + 0.4, TURN.b + 0.3, B1_OUT + 0.25, NAME_T.b + 0.2, SUN_T.b + 0.4, JOB + 0.6, SCAN.a + 0.4, CHECKS[3] + 0.4, BROKE + 0.5, JOKED + 0.6, DIM + 0.5,
  GLIDE.b + 0.1, PREG + 0.05, FAST + 0.2, BURST + 0.3, FULL + 0.1, PARTY + 0.2, SETTLE + 0.7, GOV + 0.4, CUT - 0.15, CUT + 0.6];

const res = await runEpisode({
  post: 51, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true, coda: SUNG,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { sweep: -26, whoosh: -21, popDeep: -15, riser: -19, bass: -20 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, page, frame, face,
    data: { n: N_KIDS, dots: DOTS, pitch: HB.pitch, w: HB.w, h: HB.h, glow: GLOW },
    sleep: [],
    beats: BEATS,
    checks: ['#holo', '#sign', '#alb', '#name', '#sun', '#pp0', '#pp3', '#ck0', '#ck3', '#b0p', '#b1p', '#b0d0', '#b1d0', '#count', '#clbl'],
    hook: ['#half', '#sign'],
    copy: [SIGN, ALB, NAME, SUNW, DOC, B1.tag, B1.text, B2.tag, B2.text, KIDS, String(N_KIDS)],
    verify: [
      /* the seats stay inside the margins and clear of him */
      { at: FULL + 0.4, sel: '#kidg', test: r => (r && r.l > 60 && r.r < 480 && r.t > 200 ? null : 'the half circle is off its box: ' + JSON.stringify(r)) },
      { at: FULL + 0.4, sel: '#kidg', test: r => (r && r.b < MAS.cy - 50 ? null : 'the half circle reaches him') },
      /* the second bubble stays clear of him */
      /* one bubble at a time, never both */
      ...[BROKE + 0.4, B1_OUT + 0.25, JOKED + 0.3, JOKED + 1].map(at => ({ at, sel: at < JOKED ? '#b1p' : '#b0p', test: r => (r ? 'both bubbles on screen at ' + at.toFixed(2) : null) })),
      { at: JOKED + 0.8, sel: '#b1p', test: r => (r && r.b < MAS.cy - 45 && r.r <= 471 ? null : 'the online bubble is off its spot: ' + JSON.stringify(r)) },
      /* the sign under her, clear of him when she sits in the middle */
      { at: PARTY, sel: '#sign', test: r => (r && r.b < MAS.cy - 20 ? null : 'the sign reaches him') },
      /* the count is clear of the top seats */
      { at: FULL + 0.4, sel: '#clbl', test: r => (r && r.b < MID.y - 196 - 10 ? null : 'the count label reaches the seats') },
    ],
    log: [[L1.at, 'line 1'], [MIN, 'the sign'], [ALB_AT, 'albania'], [SUN_T.a, 'sun'], [JOB, 'the contracts'], [SCAN.a, 'the scan'], [CHECKS[0], 'the checks'],
      [BROKE, 'opposition'], [JOKED, 'online'], [DIM, 'she dims'], [GLIDE.a, 'she glides'], [PREG, 'pregnant'], [BURST, 'the burst'], [FULL, 'all 83'], [PARTY, 'party'],
      [SETTLE, 'it settles'], [GOV, 'the tilt'], [SUNG.at, 'the sung line']],
  },
});
void res;
