/* the boring tek — post49. the super intelligence domains.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v3 on
   post47's settings, three takes a line and one kept by measurement, speed
   1.0, about 0.42s between lines. post47's subtitles. the rig is
   lib/aiafter.mjs with the series off. the effects are lib/sfx.mjs off the
   same word times, ducked under the read.

   after the true september 2026 story: at the un, trump said artificial
   intelligence sounds fake, so the us government calls it super intelligence,
   si. .si is slovenia's internet ending, and .si registrations jumped.

     l1  trump said ...            frame 0: the speech photo, a big AI, its label. a strike on `fake`
     l2  so now the us ...         SI slams in where AI was on `super`, S and I flash on `s i`
     l3  small detail ...          the photo goes, SI becomes .si in the same place and the same
                                   green on `dot`, an address bar draws round it, the flag waves in
     l4  the country where ...     a label card over the flag, the pin bounces on `born`
     l5  after the speech ...      the chart: 3930 in one day, then 3515 in the whole month before
     l6  and one analyst says ...  for sale domains pop in, a tag, a big question mark on `nobody`
     l7  slovenia, the new ...     trump-si.png pops in, he laughs in his corner
     the glitch cut, the end card 1.15s

   he sits small in the lower right the whole clip. eyes calm, happy or
   squint, never wide. no hands, no logos: the speech photo is cropped above
   the lectern so the emblem is gone. no on screen text says anyone did a
   crime. on screen copy has no dashes, apostrophes, quotes or colons.

   the pictures are local only and never committed: demo/assets/trump.png and
   demo/assets/trump-si.png. they are cut to jpegs in demo/out/post49-assets
   and inlined, because the rig serves one page and nothing else.

     DEMO_FPS=12 node post49.mjs          the preview
     node post49.mjs --stills             one still per beat, no render
     node post49.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO,
} from './lib/aiafter.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ---------- the pictures, cut and inlined ---------- */
const SRC = { photo: path.join(HERE, 'assets', 'trump.png'), punch: path.join(HERE, 'assets', 'trump-si.png') };
for (const [k, f] of Object.entries(SRC)) if (!fs.existsSync(f)) { console.error('\nSTOPPED. ' + k + ' picture missing: ' + path.relative(HERE, f)); process.exit(1); }
const CUTS = path.join(HERE, 'out', 'post49-assets');
fs.mkdirSync(CUTS, { recursive: true });
/* the speech photo stops above the lectern bar at 660 of 1206, the emblem is under it */
const JOBS = [
  { key: 'photo', vf: 'crop=900:655:150:0,scale=720:-2' },
  { key: 'punch', vf: 'scale=840:-2' },
];
const PIC = {};
for (const j of JOBS) {
  const out = path.join(CUTS, j.key + '.jpg');
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', SRC[j.key], '-vf', j.vf, '-q:v', '3', out]);
  PIC[j.key] = 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
}

/* ---------- the read ---------- */
const LINES = [
  { key: 'r1', text: 'trump said artificial intelligence sounds fake.' },
  { key: 'r2', text: 'so now the us government has to call it super intelligence. s i.' },
  { key: 'r3', text: 'small detail. dot s i is the internet ending of slovenia.' },
  { key: 'r4', text: 'the country where melania was born.' },
  { key: 'r5', text: 'after the speech, slovenia got more new domains in one day than it used to get in a month.' },
  { key: 'r6', text: 'and one analyst says thousands were bought months before the speech. nobody has proven who.' },
  { key: 'r7', text: 'slovenia, the new silicon valley.' },
];
const TAKES = await readLines(49, LINES);
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'trump said' },
  { line: 0, text: 'artificial intelligence sounds fake' },
  { line: 1, text: 'so now the us government' },
  { line: 1, text: 'has to call it super intelligence' },
  { line: 1, text: 'SI' },
  { line: 2, text: 'small detail' },
  { line: 2, text: 'dot .si is the internet ending' },
  { line: 2, text: 'of slovenia' },
  { line: 3, text: 'the country where melania was born' },
  { line: 4, text: 'after the speech' },
  { line: 4, text: 'slovenia got more new domains' },
  { line: 4, text: 'in one day' },
  { line: 4, text: 'than it used to get in a month' },
  { line: 5, text: 'and one analyst says' },
  { line: 5, text: 'thousands were bought' },
  { line: 5, text: 'months before the speech' },
  { line: 5, text: 'nobody has proven who' },
  { line: 6, text: 'slovenia' },
  { line: 6, text: 'the new silicon valley' },
];

/* ---------- the words on screen ---------- */
const AI_LBL = 'artificial intelligence', SI_LBL = 'super intelligence';
const SITE = 'site', FLAG_LBL = 'slovenia', BORN = 'melania was born here';
const C_TITLE = 'new .si domains', N_DAY = 3930, N_MONTH = 3515, DAY = 'one day', MONTH = 'a whole month before';
const DOMAINS = ['build', 'super', 'think', 'future'], SALE = 'for sale', TAG = 'months before the speech';
const THINK = 'i need boring.si';

/* ---------- the layout, css px of the 540x960 stage ----------
   one centre column at x 270. AI, SI and .si share one spot, BIG. he sits at
   (430, 700), 80px drawn, clear of the subtitles at 770. */
const MAS = { cx: 430, cy: 712, size: 118, scale: 0.68 };
const PHOTO = { l: 70, t: 106, w: 400, h: 291 };
const BIG = { x: 270, y: 512, size: 120 };
const LBL_Y = 594;
const BAR = { l: 70, w: 400, h: 120 };
const FLAG = { l: 120, t: 172, w: 300, h: 200 };
const CHART = { base: 610, top: 216, l: 80, r: 440, b1: { l: 105, w: 130 }, b2: { l: 265, w: 130 } };
const H1 = CHART.base - CHART.top, H2 = H1 * N_MONTH / N_DAY;
const CARD = { w: 196, h: 96, cols: [68, 276], rows: [236, 352] };
const PUNCH = { l: 75, w: 390, h: 260, t: 196 };
/* the house thought bubble, post39's: two dots off his head up and to the
   left at -122 degrees, then the pill. it sits in the gap between the picture
   (bottom 456) and him, clear of the subtitles at 770 */
const HEADR = 30 / 64 * MAS.size * MAS.scale;
const TB = { size: 24, padX: 18, padY: 10, lh: 1.25, stroke: 2, angle: -122 * Math.PI / 180, gap: 9, d0: 9, d1: 13, right: 470,
  step: 0.07, pillFor: 0.34, from: 0.55 };
TB.h = TB.size * TB.lh + 2 * TB.padY + 2 * TB.stroke;
TB.r0 = HEADR + TB.gap + TB.d0 / 2; TB.r1 = TB.r0 + TB.d0 / 2 + TB.gap + TB.d1 / 2; TB.r2 = TB.r1 + TB.d1 / 2 + TB.gap;
TB.c0 = { x: MAS.cx + TB.r0 * Math.cos(TB.angle), y: MAS.cy + TB.r0 * Math.sin(TB.angle) };
TB.c1 = { x: MAS.cx + TB.r1 * Math.cos(TB.angle), y: MAS.cy + TB.r1 * Math.sin(TB.angle) };
TB.bottom = MAS.cy + TB.r2 * Math.sin(TB.angle);

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const STRIKE = { a: w(L1, 'fake'), b: +(w(L1, 'fake') + 0.22).toFixed(3) };
const SLAM = w(L2, 'super');
const FL_S = w(L2, 's'), FL_I = w(L2, 'i');
const OUT_A = w(L3, 'small');
const MORPH = w(L3, 'dot');
const BAR_IN = w(L3, 'internet');
const TYPE_SITE = { a: +(BAR_IN + 0.12).toFixed(3), b: +(BAR_IN + 0.42).toFixed(3) };
const FLAG_IN = w(L3, 'slovenia');
const BORN_LBL = w(L4, 'melania');
const PIN = w(L4, 'born');
const OUT_B = w(L5, 'after');
/* the chart is all there by `slovenia`, empty, so the bars are the only news */
const C_TYPE = { a: +(OUT_B + 0.25).toFixed(3), b: +(OUT_B + 0.85).toFixed(3) };
const BASE = w(L5, 'slovenia');
const GROW1 = { a: w(L5, 'one'), b: +(w(L5, 'one') + 0.6).toFixed(3) };
const GROW2 = { a: w(L5, 'month'), b: +(w(L5, 'month') + 0.55).toFixed(3) };
const OUT_C = w(L6, 'analyst');
const CARDS_AT = DOMAINS.map((_, i) => +(w(L6, 'thousands') + i * 0.22).toFixed(3));
const TAG_T = { a: w(L6, 'months'), b: +(w(L6, 'months') + 0.5).toFixed(3) };
const QM = w(L6, 'nobody');
const WOB = w(L6, 'who');
const OUT_D = +(L7.at - 0.08).toFixed(3);
const PUNCH_IN = +(L7.at + 0.02).toFixed(3);
/* the bubble pops on the spring once the picture has landed */
const THINK_AT = +(PUNCH_IN + 0.40).toFixed(3);
const LAUGH = [w(L7, 'silicon'), +(w(L7, 'silicon') + 0.62).toFixed(3)];
const CUT = +(L7.end + 0.45).toFixed(3), HOLD = 1.15;

const typed = (t, ww, s) => (t < ww.a ? '' : s.slice(0, Math.round(s.length * span(t, ww.a, ww.b))));
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);

/* ---------- the flag, slovenia's, a wave drawn per frame ----------
   three stripes and the simplified arms on the hoist side, the shield
   straddling white and blue. the hoist is still, the fly waves. */
const FW = 300, FH = 200;
const wave = (x, t) => 7 * (x / FW) * Math.sin(2 * Math.PI * (x / 190 - t / 1.3));
function flagPaths(t) {
  const N = 30, ys = [0, FH / 3, 2 * FH / 3, FH];
  const row = k => Array.from({ length: N + 1 }, (_, i) => { const x = FW * i / N; return [x, ys[k] + wave(x, t)]; });
  const d = [0, 1, 2].map(k => {
    const top = row(k), bot = row(k + 1).reverse();
    return 'M' + top.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(2)).join('L') + 'L' + bot.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
  });
  const sx = 75, slope = (wave(sx + 1, t) - wave(sx - 1, t)) / 2;
  return { d, sh: 'translate(0 ' + wave(sx, t).toFixed(2) + ') rotate(' + (Math.atan(slope) * 180 / Math.PI).toFixed(2) + ' 75 75)' };
}
const star = (cx, cy, r) => {
  const p = [];
  for (let i = 0; i < 12; i++) { const a = Math.PI / 6 * i - Math.PI / 2, rr = i % 2 ? r * 0.5 : r; p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2)); }
  return '<polygon points="' + p.join(' ') + '" fill="#ffd200"/>';
};
const SHIELD = `<g id="fsh">
  <path d="M45 34H105V84Q105 107 75 118Q45 107 45 84Z" fill="#005da4" stroke="#ed1c24" stroke-width="3.5"/>
  <polygon points="50,98 61,79 67,87 75,64 83,87 89,79 100,98" fill="#fff"/>
  <path d="M51 92Q57 89 63 92T75 92T87 92T99 92" fill="none" stroke="#005da4" stroke-width="2.4"/>
  <path d="M53 97Q58.5 94 64 97T75 97T86 97T97 97" fill="none" stroke="#005da4" stroke-width="2.4"/>
  ${star(66, 44, 4.2)}${star(84, 44, 4.2)}${star(75, 53, 4.2)}
</g>`;

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: AT(PHOTO.l + PHOTO.w / 2, PHOTO.t + 110) },
  { at: STRIKE.a - 0.3, to: AT(BIG.x, BIG.y) },
  { at: FL_I + 0.3, to: LENS },
  { at: MORPH, to: AT(BIG.x, BIG.y) },
  { at: FLAG_IN, to: AT(FLAG.l + FLAG.w / 2, FLAG.t + 100) },
  { at: BORN_LBL, to: AT(270, 110) },
  { at: OUT_B, to: LENS },
  { at: BASE, to: AT(270, 500) },
  { at: GROW1.a, to: AT(CHART.b1.l + 65, CHART.base - H1) },
  { at: GROW2.a, to: AT(CHART.b2.l + 65, CHART.base - H2) },
  { at: OUT_C, to: LENS },
  { at: CARDS_AT[0], to: AT(270, 260) },
  { at: QM, to: AT(270, 350) },
  { at: PUNCH_IN, to: AT(270, PUNCH.t + 120) },
  { at: THINK_AT, to: AT(TB.right - 110, TB.bottom - 27) },
  { at: LAUGH[0], to: LENS },
];
const BLINKS = [+(L2.at + 0.6).toFixed(3), +(L4.at + 0.2).toFixed(3), +(w(L5, 'got')).toFixed(3), +(w(L6, 'analyst')).toFixed(3)];
const SQUINTS = [[STRIKE.a, STRIKE.a + 0.9], [GROW1.a + 0.1, GROW2.a - 0.3], [QM + 0.15, WOB + 0.3]];
const HAPPY = [FL_S, +(GROW2.b - 0.1).toFixed(3), PUNCH_IN + 0.1, ...LAUGH];
const HOPS = [FL_S, PUNCH_IN + 0.08];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const lens = { x: MAS.cx, y: MAS.cy, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.2));
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
  for (const h of HOPS) dy -= 11 * Math.sin(Math.PI * span(t, h, h + 0.3));
  /* the laugh, small bounces and a rock */
  for (const a of LAUGH) for (let j = 0; j < 3; j++) { const s = a + j * 0.16; if (t >= s && t <= s + 0.15) dy -= 6 * Math.sin(Math.PI * (t - s) / 0.15); }
  rot += 5 * Math.sin(2 * Math.PI * (t - LAUGH[0]) / 0.5) * bump(t, LAUGH[0], 0.1, 0.9, 0.2);
  /* nobody has proven who: a head tilt, the shrug he can do */
  rot -= 10 * bump(t, QM + 0.2, 0.2, WOB - QM - 0.1, 0.25);
  /* the slam: a small flinch */
  dy += 4 * Math.sin(Math.PI * span(t, SLAM + 0.12, SLAM + 0.32));
  /* a slow breath between the beats */
  dy += 2.5 * Math.sin(2 * Math.PI * t / 2.2);
  return { lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, dy: +dy.toFixed(3), rot: +rot.toFixed(3) };
}

/* ---------- a frame of the story ---------- */
function slamShake(t) {
  if (t < SLAM + 0.10 || t > SLAM + 0.30) return { x: 0, y: 0 };
  const u = (t - SLAM - 0.10) / 0.2, e = 1 - u;
  return { x: +(7 * e * Math.sin(2 * Math.PI * 3 * u)).toFixed(2), y: +(5 * e * Math.cos(2 * Math.PI * 3 * u + 0.6)).toFixed(2) };
}
const flash = (t, a) => +(1 + 0.16 * Math.sin(Math.PI * span(t, a, a + 0.28))).toFixed(4);
function frame(t) {
  /* scene a: the photo and the big word */
  const intro = SPRING(span(t, 0, 0.35));
  const pOut = out(t, OUT_A, 0.3);
  /* a slow push on the photo while the first line reads */
  const push = 1 + 0.035 * EASE(span(t, 0.35, STRIKE.a));
  const photo = { o: +(1 - pOut).toFixed(3), s: +(lerp(0.96, 1, intro) * push * (1 - 0.08 * pOut)).toFixed(4), y: 0 };
  const slamIn = span(t, SLAM, SLAM + 0.13);
  const ai = { o: +(1 - 0.5 * smooth(span(t, STRIKE.b, STRIKE.b + 0.3)) - 0.5 * smooth(slamIn)).toFixed(3), s: +lerp(0.97, 1, intro).toFixed(4) };
  const strike = { x: +EASE(span(t, STRIKE.a, STRIKE.b)).toFixed(4), o: +(1 - smooth(slamIn)).toFixed(3) };
  const morph = smooth(span(t, MORPH, MORPH + 0.22));
  const si = { o: +(smooth(slamIn) * (1 - morph)).toFixed(3), s: +(t < SLAM ? 1.7 : lerp(1.7, 1, EIN2(slamIn))).toFixed(4), fs: flash(t, FL_S), fi: flash(t, FL_I) };
  const dsi = { o: +morph.toFixed(3), s: +lerp(1.25, 1, SPRING(span(t, MORPH, MORPH + 0.4))).toFixed(4) };
  const lbl = t < SLAM ? AI_LBL : t < SLAM + 0.15 ? AI_LBL.slice(0, Math.round(AI_LBL.length * (1 - span(t, SLAM, SLAM + 0.15)))) : SI_LBL.slice(0, Math.round(SI_LBL.length * span(t, SLAM + 0.15, SLAM + 0.55)));
  const lblO = +(1 - out(t, OUT_A, 0.25)).toFixed(3);
  /* scene b: the bar, the flag, the label card. all leave on `after` */
  const bOut = out(t, OUT_B, 0.3);
  const bar = { sx: +EASE(span(t, BAR_IN, BAR_IN + 0.3)).toFixed(4), o: +(smooth(span(t, BAR_IN, BAR_IN + 0.12)) * (1 - bOut)).toFixed(3) };
  const site = typed(t, TYPE_SITE, SITE);
  const big = { o: +(1 - bOut).toFixed(3), y: +(80 * bOut).toFixed(2) };
  const fIn = SPRING(span(t, FLAG_IN, FLAG_IN + 0.55));
  const flag = { o: +(smooth(span(t, FLAG_IN, FLAG_IN + 0.12)) * (1 - bOut)).toFixed(3), sx: +Math.max(0.001, fIn).toFixed(4), y: +(-20 * bOut).toFixed(2), ...flagPaths(t) };
  const flbl = +(smooth(span(t, FLAG_IN + 0.3, FLAG_IN + 0.5)) * (1 - bOut)).toFixed(3);
  const born = { ...pop(t, BORN_LBL), y: +(-20 * bOut).toFixed(2) };
  born.o = +(born.o * (1 - bOut)).toFixed(3);
  const pin = +(-10 * Math.sin(Math.PI * span(t, PIN, PIN + 0.3))).toFixed(2);
  /* scene c: the chart */
  const cOut = out(t, OUT_C, 0.3);
  const cIn = +(smooth(span(t, OUT_B + 0.2, OUT_B + 0.4)) * (1 - cOut)).toFixed(3);
  const g1 = EASE(span(t, GROW1.a, GROW1.b)), g2 = EASE(span(t, GROW2.a, GROW2.b));
  const chart = {
    o: cIn, title: typed(t, C_TYPE, C_TITLE), base: +EASE(span(t, BASE, BASE + 0.35)).toFixed(4),
    h1: +(H1 * g1).toFixed(2), h2: +(H2 * g2).toFixed(2),
    n1: t < GROW1.a ? '' : String(Math.round(N_DAY * g1)), n2: t < GROW2.a ? '' : String(Math.round(N_MONTH * g2)),
    l1: +smooth(span(t, BASE + 0.15, BASE + 0.35)).toFixed(3), l2: +smooth(span(t, BASE + 0.3, BASE + 0.5)).toFixed(3),
    gh: +smooth(span(t, BASE + 0.2, BASE + 0.5)).toFixed(3),
  };
  /* scene d: the domains and the question */
  const dOut = out(t, OUT_D, 0.2);
  const qIn = span(t, QM, QM + 0.14);
  const cards = CARDS_AT.map(a => { const p = pop(t, a, 0.38, 0.5); return { s: p.s, o: +(p.o * (1 - 0.62 * smooth(qIn)) * (1 - dOut)).toFixed(3) }; });
  const tag = { txt: typed(t, TAG_T, TAG), o: +(1 - dOut).toFixed(3) };
  const wob = 8 * Math.sin(2 * Math.PI * span(t, WOB, WOB + 0.45)) * (1 - span(t, WOB, WOB + 0.45));
  const qm = { o: +(smooth(qIn) * (1 - dOut)).toFixed(3), s: +(t < QM ? 1.8 : lerp(1.8, 1, EIN2(qIn))).toFixed(4), r: +wob.toFixed(3) };
  /* scene e: the punchline */
  const punch = pop(t, PUNCH_IN, 0.45, 0.4);
  const tpop = a => (t < a ? { o: 0, s: TB.from } : { o: +smooth(span(t, a, a + 0.08)).toFixed(4), s: +lerp(TB.from, 1, SPRING(span(t, a, a + TB.pillFor))).toFixed(4) });
  const think = { d0: tpop(THINK_AT), d1: tpop(THINK_AT + TB.step), p: tpop(THINK_AT + 2 * TB.step) };
  return { think, photo, ai, strike, si, dsi, lbl, lblO, bar, site, big, flag, flbl, born, pin, chart, cards, tag, qm, punch, shake: slamShake(t) };
}
function EIN2(u) { return u * u; }

/* ---------- the page ---------- */
const GLOW = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const PINI = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>';
const css = `
#scn{position:absolute;inset:0;will-change:transform}
.pic{position:absolute;display:block;object-fit:cover;filter:${GLOW};will-change:transform,opacity}
#photo{left:${PHOTO.l}px;top:${PHOTO.t}px;width:${PHOTO.w}px;height:${PHOTO.h}px}
#punch{left:${PUNCH.l}px;top:${PUNCH.t}px;width:${PUNCH.w}px;height:${PUNCH.h}px;opacity:0}
.big{position:absolute;left:${BIG.x}px;top:${BIG.y}px;transform:translate(-50%,-50%);font:400 ${BIG.size}px/1 var(--display);white-space:nowrap;will-change:transform,opacity}
#ai{color:var(--fg)}
#si,#dsi{color:var(--accent);text-shadow:0 0 18px rgba(80,255,140,.25);opacity:0}
#si b{font-weight:400;display:inline-block;will-change:transform}
#dsi .pre{position:absolute;right:100%;top:50%;transform:translateY(-38%);margin-right:10px;font:400 30px/1 var(--mono);color:var(--fg);letter-spacing:.02em}
#dsi .lk{position:absolute;right:100%;top:50%;transform:translateY(-50%);margin-right:82px;color:var(--sub);display:flex}
#strike{position:absolute;left:${BIG.x - 122}px;top:${BIG.y + 19}px;width:240px;height:10px;background:var(--fg);border-radius:5px;transform-origin:0 50%;will-change:transform,opacity}
#lbl{position:absolute;left:60px;right:60px;top:${LBL_Y}px;text-align:center;font:400 22px/1.2 var(--mono);color:var(--sub);letter-spacing:.04em;white-space:nowrap;min-height:27px}
#bar{position:absolute;left:${BAR.l}px;top:${BIG.y - BAR.h / 2}px;width:${BAR.w}px;height:${BAR.h}px;border-radius:30px;background:#14171c;border:1px solid rgba(255,255,255,.16);opacity:0;transform-origin:50% 50%;will-change:transform,opacity}
#flag{position:absolute;left:${FLAG.l}px;top:${FLAG.t - 12}px;width:${FLAG.w}px;height:${FLAG.h + 24}px;transform-origin:0 50%;opacity:0;overflow:visible;will-change:transform,opacity}
#flbl{position:absolute;left:60px;right:60px;top:${FLAG.t + FLAG.h + 18}px;text-align:center;font:400 22px/1 var(--mono);color:var(--fg);letter-spacing:.14em;opacity:0}
#born{position:absolute;left:50%;top:108px;transform-origin:50% 100%;display:flex;align-items:center;gap:8px;padding:9px 14px 9px 11px;border-radius:8px;border:1px solid var(--accent);
  font:400 19px/1 var(--mono);color:var(--fg);white-space:nowrap;opacity:0;will-change:transform,opacity}
#born i{display:flex;color:var(--accent);will-change:transform}
#chart{position:absolute;inset:0;opacity:0}
#ctitle{position:absolute;left:60px;right:60px;top:128px;text-align:center;font:400 26px/1.2 var(--mono);color:var(--fg);letter-spacing:.04em;white-space:nowrap;min-height:29px}
#ctitle em{font-style:normal;color:var(--accent)}
#base{position:absolute;left:${CHART.l}px;top:${CHART.base}px;width:${CHART.r - CHART.l}px;height:2px;background:var(--sub);transform-origin:0 50%}
.cb{position:absolute;bottom:${960 - CHART.base}px;height:0;border-radius:6px 6px 0 0}
.gh{position:absolute;bottom:${960 - CHART.base}px;height:${H1}px;border:2px dashed rgba(255,255,255,.16);border-bottom:0;border-radius:6px 6px 0 0;opacity:0}
#bar1{left:${CHART.b1.l}px;width:${CHART.b1.w}px;background:var(--accent)}
#bar2{left:${CHART.b2.l}px;width:${CHART.b2.w}px;background:#5d636c}
.cn{position:absolute;width:160px;text-align:center;font:400 30px/1 var(--display);color:var(--fg);white-space:nowrap}
.cl{position:absolute;top:${CHART.base + 12}px;width:150px;text-align:center;font:400 18px/1.25 var(--mono);color:var(--fg);letter-spacing:.03em;opacity:0}
#cards{position:absolute;inset:0}
.card{position:absolute;width:${CARD.w}px;height:${CARD.h}px;border-radius:14px;background:#14171c;border:1px solid rgba(255,255,255,.14);opacity:0;
  display:flex;flex-direction:column;justify-content:center;gap:9px;padding:0 18px;will-change:transform,opacity}
.card b{font:500 29px/1 var(--read);color:var(--fg)}
.card b em{font-style:normal;color:var(--accent)}
.card span{align-self:flex-start;font:400 14px/1 var(--mono);color:var(--accent);letter-spacing:.12em;padding:4px 7px 3px;border:1px solid var(--accent);border-radius:4px}
#tag{position:absolute;left:60px;right:60px;top:160px;text-align:center;font:400 22px/1.2 var(--mono);color:var(--sub);letter-spacing:.04em;white-space:nowrap;min-height:27px}
/* the house thought bubble, post39's, in the mascot's dark tokens */
.tb{position:absolute;display:block;border-radius:50%;background:#06070a;border:${TB.stroke}px solid rgba(213,219,216,.5);opacity:0;will-change:transform,opacity}
#tb0{left:${(TB.c0.x - TB.d0 / 2).toFixed(2)}px;top:${(TB.c0.y - TB.d0 / 2).toFixed(2)}px;width:${TB.d0}px;height:${TB.d0}px}
#tb1{left:${(TB.c1.x - TB.d1 / 2).toFixed(2)}px;top:${(TB.c1.y - TB.d1 / 2).toFixed(2)}px;width:${TB.d1}px;height:${TB.d1}px}
#tbp{position:absolute;right:${540 - TB.right}px;top:${(TB.bottom - TB.h).toFixed(2)}px;height:${TB.h}px;padding:${TB.padY}px ${TB.padX}px;
  border:${TB.stroke}px solid rgba(213,219,216,.5);border-radius:999px;background:#06070a;color:#f4f7f5;
  font:500 ${TB.size}px/${TB.lh} var(--read);white-space:nowrap;opacity:0;transform-origin:calc(100% - ${(TB.right - TB.c1.x).toFixed(1)}px) 100%;will-change:transform,opacity}
#tbp em{font-style:normal;color:var(--accent)}
#qm{position:absolute;left:270px;top:${CARD.rows[0] + CARD.h + 10}px;transform:translate(-50%,-50%);font:400 230px/1 var(--display);color:var(--fg);opacity:0;
  text-shadow:0 0 12px rgba(255,255,255,.35),0 0 34px rgba(255,255,255,.16);will-change:transform,opacity}
`;
const markup = `
<div id="scn">
  <img class="pic" id="photo" src="${PIC.photo}" alt="">
  <div id="bar"></div>
  <div id="bigw">
    <div class="big" id="ai">AI</div>
    <div id="strike"></div>
    <div class="big" id="si"><b>S</b><b>I</b></div>
    <div class="big" id="dsi"><span class="lk">${LOCK}</span><span class="pre"></span>.si</div>
  </div>
  <div id="lbl">${AI_LBL}</div>
  <svg id="flag" viewBox="0 -12 ${FW} ${FH + 24}">
    <path id="fs0" fill="#ffffff"/><path id="fs1" fill="#005da4"/><path id="fs2" fill="#ed1c24"/>
    ${SHIELD}
  </svg>
  <div id="flbl">${FLAG_LBL}</div>
  <div id="born"><i>${PINI}</i>${BORN}</div>
  <div id="chart">
    <div id="ctitle"></div>
    <div id="base"></div>
    <div class="gh" id="gh1" style="left:${CHART.b1.l}px;width:${CHART.b1.w}px"></div><div class="gh" id="gh2" style="left:${CHART.b2.l}px;width:${CHART.b2.w}px"></div>
    <div class="cb" id="bar1"></div><div class="cb" id="bar2"></div>
    <div class="cn" id="n1" style="left:${CHART.b1.l + CHART.b1.w / 2 - 80}px"></div>
    <div class="cn" id="n2" style="left:${CHART.b2.l + CHART.b2.w / 2 - 80}px"></div>
    <div class="cl" id="cl1" style="left:${CHART.b1.l + CHART.b1.w / 2 - 75}px">${DAY}</div>
    <div class="cl" id="cl2" style="left:${CHART.b2.l + CHART.b2.w / 2 - 75}px">a whole month<br>before</div>
  </div>
  <div id="cards">
    ${DOMAINS.map((d, i) => `<div class="card" id="cd${i}" style="left:${CARD.cols[i % 2]}px;top:${CARD.rows[i >> 1]}px"><b>${d}<em>.si</em></b><span>${SALE}</span></div>`).join('\n    ')}
  </div>
  <div id="tag"></div>
  <div id="qm">?</div>
  <img class="pic" id="punch" src="${PIC.punch}" alt="">
</div>`;

const front = `<div id="think" style="position:absolute;inset:0;z-index:8;pointer-events:none"><i class="tb" id="tb0"></i><i class="tb" id="tb1"></i><div id="tbp">i need boring<em>.si</em></div></div>`;

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const E = {};
  for (const id of ['scn', 'photo', 'ai', 'strike', 'si', 'dsi', 'lbl', 'bar', 'flag', 'fsh', 'flbl', 'born', 'chart', 'ctitle', 'base', 'bar1', 'bar2', 'n1', 'n2', 'cl1', 'cl2', 'tag', 'qm', 'punch', 'bigw']) E[id] = $(id);
  const fs = [0, 1, 2].map(i => $('fs' + i));
  const letters = E.si.querySelectorAll('b');
  const pre = E.dsi.querySelector('.pre');
  const cards = D.n.map((_, i) => $('cd' + i));
  const born = E.born.querySelector('i');
  const last = {};
  const txt = (k, el, v, html) => { if (last[k] !== v) { last[k] = v; if (html) el.innerHTML = v; else el.textContent = v; } };
  window.__gag = {
    apply(o) {
      E.scn.style.transform = 'translate(' + o.shake.x + 'px,' + o.shake.y + 'px)';
      E.photo.style.opacity = o.photo.o; E.photo.style.transform = 'translateY(' + o.photo.y + 'px) scale(' + o.photo.s + ')';
      E.bigw.style.opacity = o.big.o; E.bigw.style.transform = 'translateY(' + o.big.y + 'px)';
      E.ai.style.opacity = o.ai.o; E.ai.style.transform = 'translate(-50%,-50%) scale(' + o.ai.s + ')';
      E.strike.style.opacity = o.strike.x > 0 ? o.strike.o : 0; E.strike.style.transform = 'rotate(-9deg) scaleX(' + o.strike.x + ')';
      E.si.style.opacity = o.si.o; E.si.style.transform = 'translate(-50%,-50%) scale(' + o.si.s + ')';
      letters[0].style.transform = 'scale(' + o.si.fs + ')'; letters[1].style.transform = 'scale(' + o.si.fi + ')';
      E.dsi.style.opacity = o.dsi.o; E.dsi.style.transform = 'translate(-50%,-50%) scale(' + o.dsi.s + ')';
      txt('pre', pre, o.site);
      E.dsi.querySelector('.lk').style.opacity = o.bar.sx;
      txt('lbl', E.lbl, o.lbl); E.lbl.style.opacity = o.lblO;
      E.bar.style.opacity = o.bar.o; E.bar.style.transform = 'translateY(' + o.big.y + 'px) scaleX(' + o.bar.sx + ')';
      E.flag.style.opacity = o.flag.o; E.flag.style.transform = 'translateY(' + o.flag.y + 'px) scaleX(' + o.flag.sx + ')';
      if (o.flag.o > 0) { fs.forEach((p, i) => p.setAttribute('d', o.flag.d[i])); E.fsh.setAttribute('transform', o.flag.sh); }
      E.flbl.style.opacity = o.flbl; E.flbl.style.transform = 'translateY(' + o.flag.y + 'px)';
      E.born.style.opacity = o.born.o; E.born.style.transform = 'translate(-50%,' + o.born.y + 'px) scale(' + o.born.s + ')';
      born.style.transform = 'translateY(' + o.pin + 'px)';
      const c = o.chart;
      E.chart.style.opacity = c.o;
      txt('ct', E.ctitle, c.title.replace('.si', '<em>.si</em>'), true);
      E.base.style.transform = 'scaleX(' + c.base + ')';
      E.bar1.style.height = c.h1 + 'px'; E.bar2.style.height = c.h2 + 'px';
      txt('n1', E.n1, c.n1); txt('n2', E.n2, c.n2);
      E.n1.style.top = (D.base - c.h1 - 44) + 'px'; E.n2.style.top = (D.base - c.h2 - 44) + 'px';
      $('gh1').style.opacity = c.gh; $('gh2').style.opacity = c.gh;
      E.cl1.style.opacity = c.l1; E.cl2.style.opacity = c.l2;
      o.cards.forEach((x, i) => { cards[i].style.opacity = x.o; cards[i].style.transform = 'scale(' + x.s + ')'; });
      txt('tag', E.tag, o.tag.txt); E.tag.style.opacity = o.tag.o;
      E.qm.style.opacity = o.qm.o; E.qm.style.transform = 'translate(-50%,-50%) scale(' + o.qm.s + ') rotate(' + o.qm.r + 'deg)';
      [['tb0', o.think.d0], ['tb1', o.think.d1], ['tbp', o.think.p]].forEach(([id, x]) => { const e = $(id); e.style.opacity = x.o; e.style.transform = 'scale(' + x.s + ')'; });
      E.punch.style.opacity = o.punch.o; E.punch.style.transform = 'scale(' + o.punch.s + ')';
    },
  };
}

/* ---------- the effects, off the word times, under the read ---------- */
const taps = (ww, len, every, seed) => {
  const r = [];
  for (let k = every; k <= len; k += every) r.push({ t: +lerp(ww.a, ww.b, k / len).toFixed(4), kind: 'tap', opts: { seed: seed + k * 977 }, from: 'typing' });
  return r;
};
const CUES = [
  { t: 0.02, kind: 'bwop', from: 'the hook settles' },
  { t: STRIKE.a, kind: 'sweep', opts: { len: 0.22 }, from: 'the strike draws' },
  { t: STRIKE.b, kind: 'tock', opts: { f: 1300 }, from: 'the strike lands' },
  { t: SLAM + 0.10, kind: 'land', from: 'SI slams in' },
  { t: SLAM + 0.10, kind: 'popDeep', from: 'SI weight' },
  { t: FL_S, kind: 'tock', opts: { f: 1500 }, from: 'S flashes' },
  { t: FL_S + 0.04, kind: 'bounce', opts: { f0: 240, f1: 140 }, from: 'his happy hop' },
  { t: FL_I, kind: 'tock', opts: { f: 1700 }, from: 'I flashes' },
  { t: OUT_A, kind: 'whoosh', from: 'the photo goes' },
  { t: MORPH + 0.02, kind: 'bubble', from: 'SI becomes .si' },
  { t: BAR_IN, kind: 'whooshUp', opts: { len: 0.26 }, from: 'the address bar draws' },
  ...taps(TYPE_SITE, SITE.length, 1, 0x3b17c5),
  { t: FLAG_IN, kind: 'whooshUp', from: 'the flag waves in' },
  { t: BORN_LBL + 0.02, kind: 'bubble', opts: { f0: 420, f1: 1100 }, from: 'the label card' },
  { t: PIN, kind: 'bounce', opts: { f0: 300, f1: 180 }, from: 'the pin bounces' },
  { t: OUT_B, kind: 'whoosh', from: 'scene b goes' },
  ...taps(C_TYPE, C_TITLE.length, 3, 0x51a2c9),
  { t: BASE, kind: 'sweep', opts: { len: 0.35 }, from: 'the baseline draws' },
  { t: GROW1.a, kind: 'riser', opts: { len: 0.55 }, from: 'one day grows' },
  { t: GROW1.b, kind: 'land', from: 'one day tops out' },
  { t: GROW2.a, kind: 'bubble', from: 'the month bar' },
  { t: GROW2.b - 0.1, kind: 'chime', from: 'one day wins, he is happy' },
  { t: OUT_C, kind: 'whoosh', from: 'the chart goes' },
  ...CARDS_AT.map((t, i) => ({ t, kind: 'bubble', opts: { f0: 420 + i * 60, f1: 1100 + i * 120 }, from: 'a domain pops' })),
  ...taps(TAG_T, TAG.length, 4, 0x6a2b11),
  { t: QM + 0.12, kind: 'boing', from: 'the question mark' },
  { t: WOB, kind: 'tock', opts: { f: 1200 }, from: 'it wobbles' },
  { t: PUNCH_IN, kind: 'popDeep', from: 'the punchline picture' },
  { t: PUNCH_IN + 0.06, kind: 'sparkle', from: 'the punchline' },
  { t: THINK_AT, kind: 'tock', opts: { f: 1500 }, from: 'thought dot' }, { t: THINK_AT + TB.step, kind: 'tock', opts: { f: 1700 }, from: 'thought dot' },
  { t: THINK_AT + 2 * TB.step, kind: 'bubble', opts: { f0: 380, f1: 1000 }, from: 'i need boring.si' },
  ...LAUGH.flatMap(a => [0, 1, 2].map(j => ({ t: +(a + j * 0.16).toFixed(3), kind: 'titter', from: 'he laughs' }))),
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const BEATS = [STRIKE.a, SLAM, FL_S, FL_I, OUT_A, MORPH, BAR_IN, FLAG_IN, BORN_LBL, PIN, OUT_B, C_TYPE.a, BASE, GROW1.a, GROW2.a, OUT_C, ...CARDS_AT, TAG_T.a, QM, WOB, PUNCH_IN, THINK_AT, ...LAUGH];
const STILLS = [0, STRIKE.b + 0.2, SLAM + 0.4, FL_I + 0.2, MORPH + 0.4, TYPE_SITE.b + 0.2, FLAG_IN + 0.7, PIN + 0.2, C_TYPE.b + 0.3, GROW1.b + 0.2, GROW2.b + 0.2,
  CARDS_AT[3] + 0.4, TAG_T.b + 0.2, QM + 0.4, PUNCH_IN + 0.6, THINK_AT + 0.5, LAUGH[0] + 0.2, CUT - 0.2, CUT + 0.4];

const res = await runEpisode({
  post: 49, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { sweep: -24, whoosh: -20, popDeep: -14, titter: -17 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face,
    data: { n: DOMAINS, base: CHART.base },
    sleep: [],
    beats: BEATS,
    checks: ['#photo', '#ai', '#si', '#dsi', '#lbl', '#bar', '#flag', '#flbl', '#born', '#ctitle', '#base', '#bar1', '#bar2', '#n1', '#n2', '#cl1', '#cl2', '#cd0', '#cd1', '#cd2', '#cd3', '#tag', '#qm', '#punch', '#tbp', '#tb0', '#tb1'],
    hook: ['#photo', '#ai', '#lbl'],
    copy: [AI_LBL, SI_LBL, SITE, FLAG_LBL, BORN, C_TITLE, String(N_DAY), String(N_MONTH), DAY, MONTH, ...DOMAINS.map(d => d + '.si'), SALE, TAG, THINK, 'AI', 'SI', '.si', '?'],
    verify: [
      /* SI and .si sit in the same place */
      { at: SLAM + 0.5, sel: '#si', test: r => (r && Math.abs((r.l + r.r) / 2 - BIG.x) < 3 ? null : 'SI is not centred on the big spot') },
      { at: MORPH + 0.5, sel: '#dsi', test: r => (r && Math.abs((r.t + r.b) / 2 - BIG.y) < 3 ? null : '.si is not level with where SI was') },
      /* the photo crop shows no lectern: it is the planned box */
      { at: 1.0, sel: '#photo', test: r => (r && Math.abs(r.w / PHOTO.w - 1) < 0.04 ? null : 'the photo is not its planned size') },
      /* the bubble never covers the picture or the subtitles, while it is up and while the picture still springs */
      ...[THINK_AT + 0.2, THINK_AT + 0.5, LAUGH[0], LAUGH[1] + 0.3, CUT - 0.05].flatMap(at => [
        { at, sel: '#tbp', test: r => (r ? null : 'the bubble is not up at ' + at.toFixed(2)) },
        { at, sel: '#tbp', test: r => (r && r.t > PUNCH.t + PUNCH.h + 12 ? null : 'the bubble reaches the picture at ' + at.toFixed(2)) },
        { at, sel: '#tbp', test: r => (r && r.b < 766 ? null : 'the bubble reaches the subtitles at ' + at.toFixed(2)) },
      ]),
      /* the domain cards stay clear of him */
      { at: TAG_T.b, sel: '#cd3', test: r => (r && r.b < MAS.cy - 50 ? null : 'a card reaches him') },
      { at: GROW2.b + 0.1, sel: '#cl2', test: r => (r && r.b < MAS.cy - 41 ? null : 'the month label reaches him') },
    ],
    log: [[L1.at, 'line 1'], [STRIKE.a, 'the strike'], [SLAM, 'SI slams in'], [MORPH, '.si'], [FLAG_IN, 'the flag'], [PIN, 'born here'],
      [GROW1.a, 'one day grows'], [GROW2.a, 'the month bar'], [CARDS_AT[0], 'the domains'], [QM, 'the question mark'], [PUNCH_IN, 'the punchline'], [LAUGH[0], 'he laughs']],
  },
});
void res;
