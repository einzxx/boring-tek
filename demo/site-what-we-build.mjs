/* the boring tek — the site video, what we build. for the intro player.

   1920x1080 on the 960x540 wide stage of lib/aiafter.mjs, the style, layout
   and rig of site-who-we-are.mjs: everything on the centre line, one big
   glowing word a line with the white outline and post49's three layer glow,
   post51's subtitles low on the stage. five lines on eleven_v4, warmer and
   happier, the emotion tags acted and never read, three takes a line kept by
   measurement, speed 1.0, 0.42s gaps. the effects are lib/sfx.mjs off the
   same word times. the music is einz's own track, demo/assets/music-what-we-
   build.mp3, local only and never committed, cut and faded to the clip.

     frame 0   he touches down in the middle, round, the first subtitle on, the
               squash lands and rings out
     l1  ai is not ...       a small hop on `anymore`, ALREADY HERE on `already`, a happy hop
     l2  we build with ...   EVERY DAY on `every`, two nods, a hop on `lives`
     l3  tools that save ... SAVE HOURS on `save`, a fast busy bounce to the
                             end of the line
     l4  systems that run .. RUNS ON ITS OWN on `run`, he relaxes and floats,
                             a calm half squint
     l5  the boring tek ...  BUILDING THE BORING PART OF THE FUTURE on two
                             lines on `building`, he looks into the lens, happy
                             on `future`
     the glitch cut, the end card 1.2s

   colour is the green accent only: a live dot before ALREADY HERE and a line
   under BORING. eyes calm, happy or squint, never wide. no hands, no
   sparkles. on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node site-what-we-build.mjs          the preview
     node site-what-we-build.mjs --stills             one still per beat, no render
     node site-what-we-build.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO, MARGIN,
} from './lib/aiafter.mjs';
import { SR, decode } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ---------- the music, einz's own, local only ---------- */
const TRACK = path.join(HERE, 'assets', 'music-what-we-build.mp3');
if (!fs.existsSync(TRACK)) { console.error('\nSTOPPED. the music is missing: ' + path.relative(HERE, TRACK)); process.exit(1); }

/* ---------- the read ---------- */
const LINES = [
  /* line 1 at 0.9, so `ai is not the future anymore` is easy to follow. v4
     barely slows for it, so the slowest of the three takes is pinned, t3 */
  { key: 'r1s90', text: '[excited] ai is not the future anymore. it is already here.', speed: 0.9, take: 3 },
  { key: 'r2', text: '[warmly] we build with it every day. for businesses, and in our own lives.' },
  { key: 'r3', text: '[upbeat] tools that save you hours. agents that never sleep.' },
  { key: 'r4', text: '[playful] systems that run on their own, while you do what you love.' },
  { key: 'r5', text: '[proudly] the boring tek. building the boring part of the future.' },
];
const TAKES = await readLines('site-what', LINES, 3, { model: 'eleven_v4' });
const [L1, L2, L3, L4, L5] = TAKES;
/* the voice starts 0.6s after he lands */
place(L1, 0.60);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'ai is not the future anymore' },
  { line: 0, text: 'it is already here' },
  { line: 1, text: 'we build with it every day' },
  { line: 1, text: 'for businesses, and in our own lives' },
  { line: 2, text: 'tools that save you hours' },
  { line: 2, text: 'agents that never sleep' },
  { line: 3, text: 'systems that run on their own' },
  { line: 3, text: 'while you do what you love' },
  { line: 4, text: 'the boring tek' },
  { line: 4, text: 'building the boring part of the future' },
];

/* ---------- the layout, css px of the 960x540 stage ---------- */
const W = 960, H = 540;
const MAS = { cx: 480, cy: 322, size: 118, scale: 1 };
const R = MAS.size * MAS.scale * 30 / 64;
const WORD = { y: 160, size: 50 };
const SUB_TOP = 446;

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const W1 = w(L1, 'already');
const W2 = w(L2, 'every');
const NODS = [+(W2 + 0.25).toFixed(3), +(W2 + 0.55).toFixed(3)];
const LIVES = w(L2, 'lives');
const W3 = w(L3, 'save');
/* the busy bounce: fast small hops from `save` to the end of line 3 */
const BUSY = { a: +(W3 + 0.1).toFixed(3), b: +(L3.end - 0.1).toFixed(3), d: 0.2 };
const W4 = w(L4, 'run');
const FLOAT = { a: +(W4 + 0.1).toFixed(3), b: +(L5.at - 0.05).toFixed(3) };
const W5 = w(L5, 'building');
const FUTURE = w(L5, 'future');
const CUT = +(L5.end + 0.45).toFixed(3), HOLD = 1.2;
const WORDS = [
  { at: W1, text: 'ALREADY HERE', acc: 'status' },
  { at: W2, text: 'EVERY DAY' },
  { at: W3, text: 'SAVE HOURS' },
  { at: W4, text: 'RUNS ON ITS OWN' },
  { at: W5, text: 'BUILDING THE BORING<br>PART OF THE FUTURE', acc: 'line', size: 40, dy: 64 },
];
/* each word leaves as the next comes. RUNS ON ITS OWN leaves as line 5 starts,
   so `the boring tek` is said over nothing but him. the last stays to the cut */
WORDS.forEach((x, i) => { x.out = i === 3 ? +(L5.at - 0.05).toFixed(3) : i + 1 < WORDS.length ? +(WORDS[i + 1].at - 0.12).toFixed(3) : CUT + 1; x.plain = x.text.replace('<br>', ' '); });
const BUSY_AT = [];
for (let a = BUSY.a; a + BUSY.d <= BUSY.b; a += BUSY.d) BUSY_AT.push(+a.toFixed(3));
/* in place: the rebound after frame 0, a happy hop on the first word, the
   busy bounce, a happy one on `future` */
const TEK = w(L5, 'tek');
const HOPS = [{ at: 0.14, h: 9, d: 0.26 }, { at: W1 + 0.1, h: 14 }, { at: TEK, h: 12 }, ...BUSY_AT.map(a => ({ at: a, h: 8, d: BUSY.d - 0.02 })), { at: FUTURE + 0.12, h: 12 }];

/* ---------- he wanders: hops to the sides between the big words ----------
   a travel hop is { t0, t1, x0, x1, h }, x as an offset from the middle. in
   each window between two words he hops to one side, stands, looks round,
   hops to the other, and is back in the middle before the next word lands */
const SIDE = 150, TD = 0.38, STAY = 0.75;
const TRAVEL = [];
let xNow = 0, sideNow = -1;
const travel = (t0, x1) => { TRAVEL.push({ t0: +t0.toFixed(3), t1: +(t0 + TD).toFixed(3), x0: xNow, x1, h: 26 + 0.06 * Math.abs(x1 - xNow) }); xNow = x1; };
function wander(a, b) {
  let t = a;
  while (b - t >= TD + 0.45 + TD) { travel(t, sideNow * SIDE); sideNow = -sideNow; t += TD + Math.min(STAY, b - t - 2 * TD); }
  if (xNow !== 0) travel(Math.max(t, b - TD), 0);
}
wander(0.55, W1 - 0.5);
wander(W1 + 0.75, W2 - 0.5);
wander(NODS[1] + 0.4, LIVES - 0.25);
wander(L5.at + 0.05, W5 - 0.5);
const xAt = t => {
  let x = 0;
  for (const j of TRAVEL) { if (t >= j.t1) x = j.x1; else if (t >= j.t0) return lerp(j.x0, j.x1, span(t, j.t0, j.t1)); else break; }
  return x;
};
/* the float drifts side to side, back in the middle as it ends */
const fl = t => bump(t, FLOAT.a, 0.4, Math.max(0, FLOAT.b - FLOAT.a - 0.8), 0.4);
const drift = t => fl(t) * 70 * Math.sin(2 * Math.PI * (t - FLOAT.a) / 3.2);
const lift = t => fl(t) * (18 + 5 * Math.sin(2 * Math.PI * (t - FLOAT.a) / 1.6));
const baseX = t => xAt(t) + drift(t);

/* ---------- the bubbles, the house style, off his head ----------
   up and to the right of him, two dots then the pill, one at a time, held
   long enough to read. they follow where he stands, not his bounces */
const TB = { angle: -50 * Math.PI / 180, gap: 9, d0: 9, d1: 13, h: 22 * 1.25 + 20 + 4, step: 0.07 };
TB.r0 = R + TB.gap + TB.d0 / 2; TB.r1 = TB.r0 + TB.d0 / 2 + TB.gap + TB.d1 / 2; TB.r2 = TB.r1 + TB.d1 / 2 + TB.gap;
TB.c0 = { x: TB.r0 * Math.cos(TB.angle), y: TB.r0 * Math.sin(TB.angle) };
TB.c1 = { x: TB.r1 * Math.cos(TB.angle), y: TB.r1 * Math.sin(TB.angle) };
TB.bottom = TB.r2 * Math.sin(TB.angle);
TB.left = TB.c1.x - 16;
/* `me too` right after `lives`, `ai ai ai` over the busy bounce, `life is good` while he floats */
const BUBS = [
  { text: 'me too', at: +(L2.end + 0.05).toFixed(3), hold: 1.0 },
  { text: 'ai ai ai', at: +(BUSY.a + 0.25).toFixed(3), hold: Math.max(1.3, +(BUSY.b - BUSY.a - 0.6).toFixed(3)) },
  { text: 'life is good', at: +(FLOAT.a + 0.6).toFixed(3), hold: 1.6 },
];
BUBS.forEach(b => { b.out = +(b.at + 2 * TB.step + b.hold).toFixed(3); });

/* ---------- him ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  ...WORDS.flatMap((x, i) => [{ at: x.at, to: AT(480, WORD.y) }, { at: x.at + (i === 4 ? 0.9 : 0.7), to: LENS }]),
  /* where he is going, then a look round when he lands */
  ...TRAVEL.flatMap(j => [{ at: j.t0 - 0.15, to: AT(MAS.cx + j.x1 + Math.sign(j.x1 - j.x0) * 200, MAS.cy) },
    ...(j.x1 !== 0 ? [{ at: j.t1 + 0.2, to: LENS }, { at: j.t1 + 0.55, to: AT(MAS.cx - Math.sign(j.x1) * 260, MAS.cy - 30) }] : [{ at: j.t1 + 0.15, to: LENS }])]),
  ...BUBS.map(b => ({ at: b.at - 0.1, to: LENS })),
].sort((a, b) => a.at - b.at);
const BLINKS = [1.6, +(L2.at + 1.4).toFixed(3), +(L3.at + 0.1).toFixed(3), +(L5.at + 0.1).toFixed(3)];
const HAPPY = [W1 + 0.1, W2 + 0.1, W3 + 0.05, FUTURE, ...BUBS.filter(b => b.text !== 'ai ai ai').map(b => b.at + 0.1)];
function hopAt(t, a, h, d) {
  let dy = 0, sq = 0;
  if (t >= a - 0.06 && t < a) sq += 0.06 * Math.sin(Math.PI / 2 * EASE(span(t, a - 0.06, a)));
  if (t >= a && t < a + d) { const u = (t - a) / d; dy -= 4 * h * u * (1 - u); sq -= 0.05 * Math.sin(Math.PI * u); }
  if (t >= a + d) { const dt = t - a - d; sq += 0.09 * Math.exp(-dt / 0.08) * Math.cos(2 * Math.PI * dt / 0.26); }
  return { dy, sq };
}
/* a travel hop: a squash to load, stretched along the speed in the air, a
   squash on the landing that rings out, a lean into the move */
function travelAt(t) {
  let dy = 0, sq = 0, rot = 0;
  for (const j of TRAVEL) {
    const d = j.t1 - j.t0;
    if (t >= j.t0 - 0.09 && t < j.t0) sq += 0.09 * Math.sin(Math.PI / 2 * EASE(span(t, j.t0 - 0.09, j.t0)));
    if (t >= j.t0 && t < j.t1) {
      const u = (t - j.t0) / d;
      dy -= 4 * j.h * u * (1 - u);
      sq -= 0.12 * Math.abs(1 - 2 * u) * smooth(span(t, j.t0, j.t0 + 0.04));
      rot += 9 * Math.sign(j.x1 - j.x0) * Math.sin(Math.PI * u);
    }
    if (t >= j.t1) { const dt = t - j.t1; if (dt < 0.6) sq += 0.13 * Math.exp(-dt / 0.09) * Math.cos(2 * Math.PI * dt / 0.30); }
  }
  return { dy, sq, rot };
}
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const bx = MAS.cx + baseX(t);
  const lens = { x: bx, y: MAS.cy, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.2));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  /* line 4: relaxed, a calm half squint while he floats */
  const F = fl(t);
  let lid = 0.04 + 0.3 * F;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.3, 0.12));
  let sq = t < 0.05 ? 0.2 * Math.sin(Math.PI / 2 * t / 0.05) : 0.2 * Math.exp(-(t - 0.05) / 0.11) * Math.cos(2 * Math.PI * (t - 0.05) / 0.34);
  let dy = 0, rot = 0;
  for (const hp of HOPS) { const o = hopAt(t, hp.at, hp.h, hp.d ?? 0.32); dy += o.dy; sq += o.sq; }
  { const o = travelAt(t); dy += o.dy; sq += o.sq; rot += o.rot; }
  for (const a of NODS) dy += 5 * Math.sin(Math.PI * span(t, a, a + 0.2));
  dy -= lift(t);
  rot += F * 6 * Math.sin(2 * Math.PI * (t - FLOAT.a) / 2.2);
  rot += 4 * Math.sin(Math.PI * (t - BUSY.a) / BUSY.d) * bump(t, BUSY.a, 0.05, BUSY.b - BUSY.a - 0.1, 0.05);
  rot += 3 * Math.sin(2 * Math.PI * t / 3.4) * (1 - F);
  dy += 2 * Math.sin(2 * Math.PI * t / 2.2);
  dy += R * sq;
  return { lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, dx: +baseX(t).toFixed(3), dy: +dy.toFixed(3), rot: +rot.toFixed(3), sq: +sq.toFixed(4) };
}

/* ---------- a frame ---------- */
function frame(t) {
  const words = WORDS.map(x => {
    const u = span(t, x.at, x.at + 0.45);
    const o = smooth(span(t, x.at, x.at + 0.1)) * (1 - smooth(span(t, x.out, x.out + 0.2)));
    return {
      o: +o.toFixed(3), s: +(t < x.at ? 0.6 : lerp(0.6, 1, SPRING(u))).toFixed(4),
      y: +(-16 * EASE(span(t, x.out, x.out + 0.2))).toFixed(2),
      acc: +smooth(span(t, x.at + 0.2, x.at + 0.5)).toFixed(3),
    };
  });
  /* the bubbles, where he stands and floats, not where he bounces */
  const bx = MAS.cx + baseX(t), by = MAS.cy - Math.min(lift(t), 4);
  const bubs = BUBS.map(b => {
    const gone = 1 - smooth(span(t, b.out, b.out + 0.2));
    const d = (x, k) => (t < x ? { o: 0, s: 0.55 } : { o: +(smooth(span(t, x, x + 0.08)) * gone).toFixed(3), s: +lerp(0.55, 1, SPRING(span(t, x, x + k))).toFixed(4) });
    return { x: +bx.toFixed(2), y: +by.toFixed(2), d0: d(b.at, 0.3), d1: d(b.at + TB.step, 0.3), p: d(b.at + 2 * TB.step, 0.34) };
  });
  return { words, bubs };
}

/* ---------- the page ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const css = `
.stage{background:radial-gradient(circle,rgba(255,255,255,.075) 0 1px,transparent 1.4px) 0 0/20px 20px,var(--bg)}
.wd{position:absolute;left:0;top:${WORD.y}px;width:${W}px;height:0;display:flex;justify-content:center;align-items:center;opacity:0;will-change:transform,opacity}
.wd b{position:relative;display:block;font:400 ${WORD.size}px/1.2 var(--display);color:#f7f9f8;letter-spacing:.06em;white-space:nowrap;text-align:center;
  -webkit-text-stroke:1.2px #fff;filter:${GLOW};transform:translateY(-50%)}
.wd .ln{display:inline-block;position:relative}
.wd .ln i{position:absolute;left:0;right:.06em;bottom:-.16em;height:4px;border-radius:2px;background:var(--accent);transform-origin:0 50%;
  box-shadow:0 0 10px rgba(80,255,140,.35)}
.bb{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}
.bb .d{position:absolute;display:block;border-radius:50%;background:#06070a;border:2px solid rgba(213,219,216,.5);opacity:0;will-change:transform,opacity}
.bb .p{position:absolute;left:${TB.left.toFixed(2)}px;top:${(TB.bottom - TB.h).toFixed(2)}px;height:${TB.h}px;padding:10px 18px;border:2px solid rgba(213,219,216,.5);border-radius:999px;
  background:#06070a;color:#f4f7f5;font:500 22px/1.25 var(--read);white-space:nowrap;opacity:0;transform-origin:16px 100%;will-change:transform,opacity}
.wd .st{display:inline-block;width:.24em;height:.24em;margin-right:.36em;border-radius:50%;background:var(--accent);vertical-align:.18em;box-shadow:0 0 0 .1em rgba(80,255,140,.18),0 0 12px rgba(80,255,140,.5)}
`;
const wordHtml = (x, i) => {
  let t = x.text;
  if (x.acc === 'status') t = '<span class="st"></span>' + t;
  if (x.acc === 'line') t = t.replace('BORING', '<span class="ln">BORING<i></i></span>');
  return `<div class="wd" id="wd${i}"${x.dy ? ` style="top:${WORD.y + x.dy}px"` : ''}><b${x.size ? ` style="font-size:${x.size}px;line-height:1.6"` : ''}>${t}</b></div>`;
};
const dot = (id, c, d) => `<i class="d" id="${id}" style="left:${(c.x - d / 2).toFixed(2)}px;top:${(c.y - d / 2).toFixed(2)}px;width:${d}px;height:${d}px"></i>`;
const bubHtml = (b, k) => `<div class="bb" id="bb${k}">${dot('bb' + k + 'd0', TB.c0, TB.d0)}${dot('bb' + k + 'd1', TB.c1, TB.d1)}<div class="p" id="bb${k}p">${b.text}</div></div>`;
const markup = WORDS.map(wordHtml).join('');
/* the bubbles over him, inside the camera */
const front = BUBS.map(bubHtml).join('');

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const wd = D.words.map((_, i) => ({ el: $('wd' + i), acc: $('wd' + i).querySelector('.ln i,.st') }));
  const bb = D.bubs.map((_, k) => ({ el: $('bb' + k), d0: $('bb' + k + 'd0'), d1: $('bb' + k + 'd1'), p: $('bb' + k + 'p') }));
  window.__gag = {
    apply(o) {
      o.words.forEach((x, i) => {
        wd[i].el.style.opacity = x.o; wd[i].el.style.transform = 'translateY(' + x.y + 'px) scale(' + x.s + ')';
        if (wd[i].acc) { if (wd[i].acc.tagName === 'I') wd[i].acc.style.transform = 'scaleX(' + x.acc + ')'; else wd[i].acc.style.opacity = x.acc; }
      });
      o.bubs.forEach((x, k) => {
        const B = bb[k];
        B.el.style.transform = 'translate(' + x.x + 'px,' + x.y + 'px)';
        [['d0', x.d0], ['d1', x.d1], ['p', x.p]].forEach(([id, v]) => { B[id].style.opacity = v.o; B[id].style.transform = 'scale(' + v.s + ')'; });
      });
    },
  };
}

/* ---------- the music: einz's track, from its start, to the clip's length ----------
   a gentle 0.6s start and a clean ending: it fades over the end card and is
   at zero on the last frame */
const SECONDS = +(CUT + HOLD).toFixed(3);
const BED = (() => {
  const src = decode(ffmpeg, TRACK), N = Math.round(SECONDS * SR), out = new Float32Array(N);
  out.set(src.subarray(0, Math.min(N, src.length)));
  const fi = Math.round(0.6 * SR), fo = Math.round(Math.min(1.1, HOLD) * SR);
  for (let i = 0; i < fi; i++) out[i] *= Math.sin(Math.PI / 2 * i / fi) ** 2;
  for (let i = 0; i < fo; i++) out[N - 1 - i] *= Math.sin(Math.PI / 2 * i / fo) ** 2;
  return out;
})();

/* ---------- the effects, off the word times, under the read ---------- */
const CUES = [
  { t: 0.0, kind: 'land', from: 'frame 0, the landing squash' },
  { t: 0.14, kind: 'bounce', opts: { f0: 240, f1: 150 }, from: 'the rebound hop' },
  { t: 0.40, kind: 'bounce', opts: { f0: 200, f1: 120 }, from: 'it lands' },
  ...WORDS.flatMap((x, i) => [
    ...(i && i !== 4 ? [{ t: x.at - 0.06, kind: 'whoosh', opts: { len: 0.2 }, from: 'the old word goes' }] : []),
    { t: x.at, kind: 'popDeep', from: x.plain + ' pops in' },
  ]),
  { t: W1 + 0.2, kind: 'bwop', from: 'the live dot' },
  { t: +(L5.at - 0.05).toFixed(3), kind: 'whoosh', opts: { len: 0.2 }, from: 'RUNS ON ITS OWN goes' },
  { t: W5 + 0.2, kind: 'sweep', opts: { len: 0.32 }, from: 'the line under BORING' },
  ...NODS.map(t => ({ t, kind: 'tock', opts: { f: 1400 }, from: 'a nod' })),
  ...HOPS.slice(1).filter(h => !BUSY_AT.includes(h.at)).map(h => ({ t: h.at + (h.d ?? 0.32), kind: h.at === FUTURE + 0.12 ? 'land' : 'bounce', from: 'a hop lands' })),
  ...TRAVEL.map(j => ({ t: j.t1, kind: 'bounce', opts: { f0: 230, f1: 130 }, from: 'he lands at the ' + (j.x1 < 0 ? 'left' : j.x1 > 0 ? 'right' : 'middle') })),
  ...BUBS.flatMap(b => [
    { t: b.at, kind: 'toggle', from: 'bubble dot' }, { t: b.at + TB.step, kind: 'toggle', from: 'bubble dot' },
    { t: b.at + 2 * TB.step, kind: 'bubble', opts: { f0: 420, f1: 1150 }, from: b.text }]),
  ...BUSY_AT.map(a => ({ t: +(a + BUSY.d - 0.02).toFixed(3), kind: 'toggle', from: 'busy bounce' })),
  { t: FLOAT.a, kind: 'whooshUp', opts: { len: 0.45 }, from: 'he floats up' },
  { t: FLOAT.b - 0.3, kind: 'bounce', opts: { f0: 180, f1: 110 }, from: 'he settles' },
  { t: FUTURE, kind: 'chime', from: 'happy into the lens' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const BEATS = [0.14, TEK, ...BUSY_AT, +(L5.at - 0.05).toFixed(3), ...TRAVEL.map(j => j.t0), ...BUBS.map(b => b.at), ...WORDS.map(x => x.at), ...NODS, LIVES, BUSY.a, FLOAT.a, FLOAT.b, FUTURE];
const STILLS = [0, 0.06, 0.45, ...TRAVEL.map(j => j.t1 + 0.3), ...BUBS.map(b => b.at + 0.6), W1 + 0.5, W2 + 0.5, LIVES + 0.2, W3 + 0.5, BUSY.a + 0.5, W4 + 0.5, FLOAT.a + 1.0, W5 + 0.5, FUTURE + 0.2, CUT - 0.1, CUT + 0.5];

const res = await runEpisode({
  name: 'site-what-we-build', post: 0, ep: 0, series: false, title: [],
  stage: { w: W, h: H, appZone: MARGIN, subTop: SUB_TOP, file: 'site-what-we-build-1920x1080.mp4' },
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  tp: -1,
  lufs: -16,
  music: { pcm: BED, level: -17, duck: 0.75, under: -10 },
  sfx: { cues: CUES, level: -7.5, duck: 0.6, gains: { sweep: -26, whoosh: -21, popDeep: -15, chime: -20, bounce: -15, tock: -8, toggle: -3, land: -11, bubble: -10, zap: -10 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, page, frame, face,
    front,
    data: { words: WORDS.map(x => x.plain), bubs: BUBS.map(b => b.text) },
    sleep: [],
    beats: BEATS,
    checks: [...WORDS.map((_, i) => '#wd' + i + ' b'), ...BUBS.flatMap((_, k) => ['#bb' + k + 'p', '#bb' + k + 'd0'])],
    hook: [],
    copy: WORDS.map(x => x.plain),
    verify: [
      ...WORDS.map((x, i) => ({ at: x.at + 0.6, sel: '#wd' + i + ' b', test: r => (r && r.l >= MARGIN && r.r <= W - MARGIN && r.t >= MARGIN ? null : x.plain + ' is past the margin: ' + JSON.stringify(r)) })),
      { at: W5 + 0.6, sel: '#wd4 b', test: r => (r && r.b < MAS.cy - R - 12 ? null : 'the last word reaches him') },
      { at: FLOAT.a + 1.0, sel: '#m-card', test: r => (r && r.b < SUB_TOP - 6 ? null : 'he floats into the subtitles') },
      /* the bubbles: one at a time, never over the big words or the subtitles */
      ...BUBS.flatMap((b, k) => [0.3, b.hold / 2, b.hold].map(dt => b.at + 2 * TB.step + dt).flatMap(at => [
        { at, sel: '#bb' + k + 'p', test: r => (r ? null : b.text + ' is not up at ' + at.toFixed(2)) },
        { at, sel: '#bb' + k + 'p', test: r => (r && r.b < SUB_TOP - 6 ? null : b.text + ' reaches the subtitles at ' + at.toFixed(2)) },
        { at, sel: '#bb' + k + 'p', test: r => (r && r.t > 172 ? null : b.text + ' reaches the big word at ' + at.toFixed(2) + ': ' + JSON.stringify(r)) },
        ...BUBS.map((_, m) => m).filter(m => m !== k).map(m => ({ at, sel: '#bb' + m + 'p', test: r => (r ? 'two bubbles at ' + at.toFixed(2) : null) })),
      ])),
      /* he is in the middle for every big word */
      ...WORDS.map(x => ({ at: x.at + 0.2, sel: '#m-card', test: r => (r && Math.abs((r.l + r.r) / 2 - MAS.cx) < 6 ? null : 'he is not in the middle for ' + x.plain) })),
    ],
    log: [...TRAVEL.map(j => [j.t0, 'hop to the ' + (j.x1 < 0 ? 'left' : j.x1 > 0 ? 'right' : 'middle')]), ...BUBS.map(b => [b.at, 'bubble ' + b.text]), [L1.at, 'line 1'], [W1, 'ALREADY HERE'], [W2, 'EVERY DAY'], [W3, 'SAVE HOURS'], [BUSY.a, 'the busy bounce'], [W4, 'RUNS ON ITS OWN'],
      [FLOAT.a, 'he floats'], [W5, 'BUILDING THE BORING PART OF THE FUTURE'], [FUTURE, 'happy into the lens']],
  },
});
void res;
