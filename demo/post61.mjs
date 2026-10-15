/* the boring tek — post61. how AI answers you, explained like to a kid, as a
   real machine.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v4, three
   takes a line checked with speech to text, every take sped up 1.16 with
   atempo, pitch kept. post60's subtitles, the plain end card held 0.5s. the
   rig is lib/aiafter.mjs with the series off, and one opt in: shortHold.

   the machine is drawn with the anatomy kit, demo/lib/anatomy/, vendored at
   bc943e4: a wall mounted board facing the lens, every part a kit solid in
   the kit's isometric camera, painted back to front, restyled to our dark
   dot grid with white lines and one accent, the dark green. node builds it
   from t every frame, the page only sets innerHTML, so a still is the same
   every time. no webgl, no second browser.

     the board   a funnel on top, the chopper with its guillotine blade, a
                 belt, a hopper, four small gears in a train driven by the big
                 GUESS gear, a window over each small gear, a tray and a chute,
                 a lever panel standing on the right, a plinth on four feet
     the words   cards and chips are html on top of the drawing, inside the
                 same zoom, placed with the kit's own projection

     frame 0  the whole machine glowing, THE MACHINE INSIDE AI, him beside it,
              the GUESS gear already turning, the camera already orbiting
     l1       ever wondered ...     on machine, a light runs funnel to chute
     l2       your question ...     WHY IS THE SKY BLUE? drops into the funnel
     l3       it gets chopped ...   the blade drops six times, six word blocks
     l4       then the gears ...    each gear lights, its window flicks three
                                    guesses, the third flies to the answer card
     l5       and out comes ...     the card slides out of the chute, a tick
     silence                        the machine zooms to the lever panel
     l6       but look ...          three levers click, the empty slot's ghost
                                    I DO NOT KNOW lights word by word, he squints
     l7       the guess gear ...    pull back, GUESS spins harder, he looks at
                                    the lens and nods on up
     the glitch cut, the plain end card, 0.5s

     DEMO_FPS=12 node post61.mjs          the preview
     node post61.mjs --stills             one still per beat, no render, no sound
     node post61.mjs --machine            the machine alone as an anatomy page, for its line check
     node post61.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, SPRING,
  livingCamera, CURVE, CURVE56, hitPulse, peakAt, wordIn, shotChain, FPS,
} from './lib/aiafter.mjs';
import * as K from './lib/anatomy/iso-kit.mjs';
import * as G from './lib/anatomy/lathe.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STILLS_RUN = process.argv.includes('--stills');
const MACHINE_RUN = process.argv.includes('--machine');

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
/* line 5 as written, and out comes, lost its and in six takes of six, 30ms
   in the alignment, heard as out comes. the dots after and make it acted,
   and all three takes then say it. the same words, so the subtitle matches.
   line 7's guess gear came back from speech to text as guest gear on all
   three takes, the s running into the g, while line 4's guess was clean. the
   dots after guess give it a beat, and all three new takes read guess */
const LINES = [
  { key: 'r1', text: '[excited] ever wondered how AI answers you? here is the machine inside.', tempo: TEMPO },
  { key: 'r2', text: '[cheerful] your question drops in at the top.', tempo: TEMPO },
  { key: 'r3', text: '[playful] it gets chopped into tiny word pieces.', tempo: TEMPO },
  { key: 'r4', text: '[warm] then the gears guess the next word. one by one. super fast.', tempo: TEMPO },
  { key: 'r5b', text: '[cheerful] and... out comes your answer.', tempo: TEMPO },
  { key: 'r6', text: '[amused] but look. there is no i do not know lever.', tempo: TEMPO, take: 3 },
  { key: 'r7b', text: '[warm] the guess... gear never stops. that is why AI sometimes makes things up.', tempo: TEMPO },
];
const TAKES = await readLines(61, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
const GAP = 0.25, HUSH = 0.6;
place(L1, 0.15);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + GAP + (i === 5 ? HUSH : 0));
const SUBS = [
  { line: 0, text: 'ever wondered how AI answers you?' },
  { line: 0, text: 'here is the machine inside' },
  { line: 1, text: 'your question drops in at the top' },
  { line: 2, text: 'it gets chopped into tiny word pieces' },
  { line: 3, text: 'then the gears guess the next word' },
  { line: 3, text: 'one by one, super fast' },
  { line: 4, text: 'and out comes your answer' },
  { line: 5, text: 'but look' },
  { line: 5, text: 'there is no I DO NOT KNOW lever' },
  { line: 6, text: 'the guess gear never stops' },
  { line: 6, text: 'that is why AI' },
  { line: 6, text: 'sometimes makes things up' },
];

/* ---------- the beats, all off the read ---------- */
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const wi = (T, x, from = 0) => T.W.findIndex((q, k) => k >= from && q.word.toLowerCase().replace(/[^a-z0-9]/g, '') === x);
const PULSE = w(L1, 'machine') - 0.1;
const TITLE_OUT = f3(L1.end - 0.15);
const QIN = f3(L2.at - 0.05), QDROP = w(L2, 'drops'), QLAND = f3(QDROP + 0.34);
const CHOP0 = w(L3, 'chopped'), CHOP_PER = 0.15;
const CHOPS = Array.from({ length: 6 }, (_, i) => f3(CHOP0 + i * CHOP_PER));
const ONE1 = wi(L4, 'one');
const GEAR_AT = [w(L4, 'guess'), f3(L4.W[ONE1].start - 0.04), f3(L4.W[wi(L4, 'one', ONE1 + 1)].start - 0.04), w(L4, 'super')];
const FAST = w(L4, 'fast');
const OUT = w(L5, 'out'), ANSWER = w(L5, 'answer');
const ZOOM = f3(L5.end + 0.08), ZOOM_D = 0.75;
const LOOK = w(L6, 'look');
const LEVERS = [f3(LOOK - 0.05), f3(LOOK + 0.1), f3(LOOK + 0.25)];
const GHOST = ['i', 'do', 'not', 'know'].map((x, k) => w(L6, x, wi(L6, 'no') + 1));
const KNOW = GHOST[3], EMPTY = w(L6, 'lever');
const PULL = f3(L7.at - 0.05), PULL_D = 1.0;
const GUESSW = w(L7, 'guess'), LENS = w(L7, 'that'), MAKES = w(L7, 'makes'), NOD = w(L7, 'up');
const CUT = f3(L7.end + 0.45);
const HOLD = 0.5;
const hidden = { o: 0, s: 1, y: 0, blur: 0 };

/* ---------- the camera of the drawing ---------- */
const EL = 30, AZ0 = 58, AZM = 54.5, AZ7 = 58;
const azAt = t => f3(t < PULL ? lerp(AZ0, AZM, CURVE.dolly(span(t, 0, 3.6))) : lerp(AZM, AZ7, CURVE56.pull(span(t, PULL, PULL + 1.6))));
/* the box the machine fits at frame 0, css px of the 540x960 stage */
const MB = { l: 66, t: 186, r: 404, b: 748 };
const FUN = { c: [44, 22], z0: 268, z1: 306, r0: 5.5, r1: 23, lip: 25 };
const EXT = [
  ...K.boxCorners({ x: -12, y: -22, w: 238, d: 94 }, -16, 0),
  ...K.boxCorners({ x: 0, y: -8, w: 170, d: 8 }, 0, 266),
  ...Array.from({ length: 24 }, (_, i) => [FUN.c[0] + FUN.lip * Math.cos(i * Math.PI / 12), FUN.c[1] + FUN.lip * Math.sin(i * Math.PI / 12), FUN.z1 + 2.5]),
  ...K.boxCorners({ x: 180, y: 0, w: 44, d: 30 }, 0, 150),
];
const FIT = K.fitProjection(EXT, MB.r - MB.l, MB.b - MB.t, { pad: 0, azimuth: AZ0, elevation: EL });
const KS = FIT.scale;
const PIVOT = [104, 30, 140];
const PIV_S = (() => { const p = K.iso(PIVOT, FIT); return [p[0] + MB.l, p[1] + MB.t]; })();
function projAt(az) {
  const p = K.iso(PIVOT, { origin: [0, 0], scale: KS, azimuth: az, elevation: EL });
  return { origin: [PIV_S[0] - p[0], PIV_S[1] - p[1]], scale: KS, azimuth: az, elevation: EL };
}
const PM = projAt(AZM);
const at = (p, P = PM) => { const q = K.iso(p, P); return { x: f2(q[0]), y: f2(q[1]) }; };

/* ---------- the parts ---------- */
const S = (paths, o) => K.solidSvg(paths, o);
const Ln = (d, o) => K.lineSvg(d, o);
const slab = (x0, x1, y0, y1, z0, z1, P, r = 0.6, bevel = 0) => K.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z0, z1 - z0, P, r > 1.5 ? 6 : 3, bevel);
const FY = (x, z, y = 0) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const FZ = (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const FX = (x, y, z) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const poly = (pts, P) => K.pathOf(K.pointsAt(pts, P), true);
const faceText = (x, y, z, P, text, size, tone = 'hi', anchor = 'middle') => K.faceTextSvg(K.sideMatrix([x, y], z, P, 'left'), text, { size, tone, anchor });
const ACC = '#35ff6a', INK = '#f4f7f6';
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * Math.max(0, Math.min(1, k))).toString(16).padStart(2, '0')).join('');
/* a group whose lines turn from white to the accent by k, and glow with it */
function accent(inner, k, glow = 1) {
  if (k <= 0.004) return inner;
  const hi = mixHex(INK, ACC, k), [r, g, b] = hx(mixHex(INK, ACC, k));
  const st = `--anatomy-hi:${hi};--anatomy-lit:${hi};--anatomy-mid:rgba(${r},${g},${b},.75);--anatomy-lo:rgba(${r},${g},${b},.45);--anatomy-faint:rgba(${r},${g},${b},.25)` +
    (glow > 0 ? `;filter:drop-shadow(0 0 ${f2(2 + 6 * k * glow)}px rgba(53,255,106,${f3(0.55 * k * glow)}))` : '');
  return `<g style="${st}">${inner}</g>`;
}

/* the gear train: GUESS drives g1, g1 drives g2, and so on, along +x */
const MOD = 2.6, GN = 22, SN = 10;
const GZ = 136;
const GUESS = { x: 34, z: GZ, n: GN };
const SMALL = [0, 1, 2, 3].map(i => ({ x: f3(GUESS.x + MOD * GN / 2 + MOD * SN / 2 + i * MOD * SN), z: GZ, n: SN }));
/* a gear is one concave outline pushed out along y toward the lens: the sides
   that face the lens in the kit's four tones, the face on top of them. the
   kit's own prisms are convex only, so this is extrude's rule by hand */
function gearBody(g, theta, P, y0, y1) {
  const r = MOD * g.n / 2, ro = r + MOD * 0.82, rr = r - MOD * 1.0;
  const p = 2 * Math.PI / g.n, hb = p * 0.3, ht = p * 0.17;
  const ring = [];
  for (let j = 0; j < g.n; j++) {
    const a = theta + j * p;
    for (const [da, R] of [[-0.5 * p, rr], [-hb, rr], [-ht, ro], [ht, ro], [hb, rr]]) ring.push([g.x + R * Math.cos(a + da), g.z + R * Math.sin(a + da)]);
  }
  const V = G.viewOf(P), n = ring.length, sides = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % n];
    const nx = bz - az, nz = -(bx - ax);
    if (nx * V[0] + nz * V[2] <= 1e-9) continue;
    const d = poly([[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], P);
    sides.push(`<path class="iso-shade" data-shade="${G.toneOf([nx, 0, nz], P)}" d="${d}"/>`);
  }
  const front = poly(ring.map(([x, z]) => [x, y1, z]), P);
  return `<g class="iso-solid"><path class="iso-fill" d="${poly(ring.map(([x, z]) => [x, y0, z]), P)}"/>${sides.join('')}<path class="iso-top" d="${front}"/><path class="iso-line" data-tone="faint" d="${sides.length ? sides.map(s => s.match(/d="([^"]+)"/)[1]).join('') : ''}"/><path class="iso-line iso-edge" data-tone="hi" d="${front}"/></g>`;
}
function gearSvg(g, theta, P, { y0 = 2, y1 = 8, k = 0, hub = true } = {}) {
  const rr = MOD * g.n / 2 - MOD * 1.0;
  const F = FY(g.x, g.z);
  const out = [gearBody(g, theta, P, y0, y1)];
  /* lightening holes turn with it, so a slow turn still reads */
  const holes = [];
  for (let j = 0; j < (g.n > 12 ? 6 : 4); j++) {
    const a = theta + 2 * Math.PI * j / (g.n > 12 ? 6 : 4) + 0.4, rho = rr * 0.6;
    const Fh = FY(g.x + rho * Math.cos(a), g.z + rho * Math.sin(a));
    holes.push(G.circleOf(Fh, y1 + 0.02, rr * (g.n > 12 ? 0.16 : 0.2), P, 20));
  }
  out.push(`<path class="hole" d="${holes.join('')}"/>`);
  /* a seam ring and spokes on the face */
  out.push(Ln(G.circleOf(F, y1 + 0.02, rr - 1.4, P, 48), { tone: 'faint' }));
  if (hub) {
    out.push(S(G.disc(y1, y1 + 2.2, rr * 0.34, F, P), { tone: 'hi' }));
    out.push(K.dotsSvg([K.iso([g.x, y1 + 2.25, g.z], P)], { size: 1.1, tone: 'hi' }));
  }
  return accent(out.join(''), k);
}
/* angles that mesh: a tooth of the driver on the line of centres, a gap of the driven one there */
function trainAngles(thG) {
  const out = [];
  let prev = thG, np = GN;
  for (let i = 0; i < 4; i++) {
    const th = -(np / SN) * prev + Math.PI + Math.PI / SN;
    out.push(th);
    prev = th; np = SN;
  }
  return out;
}

/* the static board: everything that only moves when the camera does */
const STATIC = new Map();
function staticSvg(P) {
  const key = P.azimuth.toFixed(3);
  if (STATIC.has(key)) return STATIC.get(key);
  const o = [];
  const stg = (id, inner) => `<g class="stg" id="${id}">${inner}</g>`;
  /* the plinth on its feet, a groove round the top, a halo under it */
  const PL = { x: -12, y: -22, w: 238, d: 94, r: 3 };
  o.push(`<path class="iso-halo" d="${K.haloOf(K.insetPlan(PL, -4), -16, 2, P)}"/>`);
  for (const [x, y] of K.corners(PL, 9)) o.push(S(K.cylinder(x, y, 5, -16, 6, P, 20), { tone: 'mid' }));
  const plinth = K.slabOf(PL, -10, 10, P, 6, 1.2);
  o.push(S(plinth, { tone: 'hi', inner: Ln(K.planOutline(K.insetPlan(PL, 4.5), 0.01, P), { tone: 'faint' }) + Ln(K.sideSeam(PL, -4, P, 6), { tone: 'faint' }) }));
  o.push(K.dotsSvg(K.pointsAt(K.corners(PL, 2.6).map(([x, y]) => [x, y, 0.02]), P), { size: 0.7, tone: 'mid' }));
  /* the board */
  const BD = { x: 0, y: -8, w: 170, d: 8, r: 1.2 };
  o.push(S(K.slabOf(BD, 0, 266, P, 3, 1), { tone: 'hi', inner: Ln(K.sideSeam(BD, 96, P, 3), { tone: 'faint' }) + Ln(K.sideSeam(BD, 194, P, 3), { tone: 'faint' }) }));
  o.push(K.dotsSvg(K.pointsAt([[6, 0.05, 6], [164, 0.05, 6], [6, 0.05, 260], [164, 0.05, 260], [6, 0.05, 194 + 5], [164, 0.05, 194 + 5], [6, 0.05, 96 - 5], [164, 0.05, 96 - 5]], P), { size: 0.75, tone: 'mid' }));
  /* vents, closed slots, top right */
  const vents = [];
  for (let i = 0; i < 6; i++) {
    const x = 104 + i * 9.5;
    vents.push(poly([[x, 0.05, 236], [x + 4, 0.05, 236], [x + 4, 0.05, 256], [x, 0.05, 256]], P));
  }
  o.push(Ln(vents.join(''), { tone: 'lo' }));
  /* the label plate, three rule lines for its print */
  o.push(S(slab(10, 56, 0, 1.2, 18, 40, P, 0.4), { tone: 'mid' }));
  for (let i = 0; i < 3; i++) o.push(Ln(K.segment([14, 1.25, 34 - i * 5.5], [i === 2 ? 38 : 52, 1.25, 34 - i * 5.5], P), { tone: 'lo', free: true }));
  /* the GUESS gear's boss on the board */
  o.push(Ln(G.circleOf(FY(GUESS.x, GUESS.z), 0.05, 8, P, 40), { tone: 'lo' }));
  /* the windows over the small gears */
  for (const g of SMALL) {
    o.push(S(slab(g.x - 9.5, g.x + 9.5, 0, 4, 154, 165, P, 0.8, 0.5), { tone: 'hi' }));
    o.push(`<path class="glass" d="${poly([[g.x - 7.5, 4.03, 156.5], [g.x + 7.5, 4.03, 156.5], [g.x + 7.5, 4.03, 162.5], [g.x - 7.5, 4.03, 162.5]], P)}"/>`);
  }
  /* the tray under the gears and the chute out of it */
  const trayIn = Ln(K.planOutline({ x: 70, y: 6, w: 94, d: 16, r: 2 }, 110.02, P), { tone: 'lo' });
  o.push(stg('stg4', S(slab(64, 170, 2, 26, 100, 110, P, 1.2, 0.6), { tone: 'hi', inner: trayIn }) +
    S(G.prismOf(FX(100, 0, 0), [[26, 110], [26, 98], [68, 60], [68, 70]], 0, 2.2, P), { tone: 'hi' }) +
    S(G.prismOf(FX(100, 0, 0), [[26, 98], [26, 95.6], [68, 57.6], [68, 60]], 2.2, 33.8, P), { tone: 'hi' }) +
    S(G.prismOf(FX(100, 0, 0), [[26, 110], [26, 98], [68, 60], [68, 70]], 33.8, 36, P), { tone: 'hi' })));
  /* the hopper over the gears, its mouth a dark slot */
  o.push(S(slab(68, 170, 2, 16, 172, 188, P, 1, 0.6), { tone: 'hi' }));
  o.push(`<path class="mouth" d="${K.planOutline({ x: 74, y: 5, w: 90, d: 8, r: 2 }, 188.02, P)}"/>`);
  /* the belt: legs, rollers, the band */
  o.push(S(slab(92, 98, 0, 6, 196, 200, P, 0.4), { tone: 'mid' }), S(slab(140, 146, 0, 6, 196, 200, P, 0.4), { tone: 'mid' }));
  const belt = [];
  belt.push(S(G.disc(5, 39, 4, FY(77, 202), P), { tone: 'hi' }));
  belt.push(S(slab(77, 158, 5.5, 38.5, 202, 206, P, 0.2), { tone: 'hi' }));
  belt.push(S(G.disc(5, 39, 4, FY(158, 202), P), { tone: 'hi' }));
  belt.push(K.dotsSvg([K.iso([158, 39.05, 202], P)], { size: 0.9, tone: 'mid' }));
  o.push(stg('stg2', belt.join('')));
  /* the chopper: its box, a lamp, the throat and the funnel on top */
  const chop = [];
  chop.push(S(slab(16, 72, 2, 42, 210, 246, P, 2, 1), { tone: 'hi', inner: Ln(K.sideSeam({ x: 16, y: 2, w: 56, d: 40, r: 2 }, 216, P, 6), { tone: 'faint' }) }));
  chop.push(`<path class="slot" d="${poly([[30, 42.04, 239], [58, 42.04, 239], [58, 42.04, 241.4], [30, 42.04, 241.4]], P)}"/>`);
  chop.push(S(G.disc(42, 44, 2.6, FY(66, 240), P), { tone: 'mid' }));
  chop.push(S(G.disc(0, 22, FUN.r0, FZ(FUN.c[0], FUN.c[1], 246), P), { tone: 'hi' }));
  chop.push(S(G.ringBand(9, 12, FUN.r0, FUN.r0 + 1.6, FZ(FUN.c[0], FUN.c[1], 246), P), { tone: 'hi' }));
  o.push(stg('stg1', chop.join('')));
  const fun = [];
  fun.push(S(slab(36, 52, 0, 10, 270, 276, P, 0.6), { tone: 'mid' }));
  const Fz = FZ(FUN.c[0], FUN.c[1], FUN.z0);
  fun.push(S(G.lathe([[0, FUN.r0], [FUN.z1 - FUN.z0 - 2.5, FUN.r1]], Fz, P, { rims: 'first' }), { tone: 'hi' }));
  fun.push(S(G.disc(FUN.z1 - FUN.z0 - 2.5, FUN.z1 - FUN.z0, FUN.lip, Fz, P), { tone: 'hi', crease: 'lo' }));
  fun.push(`<path class="mouth" d="${G.circleOf(Fz, FUN.z1 - FUN.z0 + 0.02, FUN.r1 - 1.5, P, 64)}"/>`);
  o.push(stg('stg0', fun.join('')));
  /* the lever panel on its pedestal, four rows, plates and slots */
  const pan = [];
  /* two cables from the panel's far side to the board, behind it */
  pan.push(K.wireSvg(K.iso([180, 12, 128], P), K.iso([170, 0, 150], P), { via: [K.iso([174, 10, 136], P)], tone: 'lo' }));
  pan.push(K.wireSvg(K.iso([180, 18, 66], P), K.iso([170, 0, 80], P), { via: [K.iso([175, 14, 70], P)], tone: 'lo' }));
  pan.push(S(slab(186, 218, 6, 24, 0, 40, P, 1, 0.5), { tone: 'mid' }));
  const PNL = { x: 180, y: 0, w: 44, d: 30, r: 2.4 };
  pan.push(S(K.slabOf(PNL, 40, 110, P, 6, 1.2), { tone: 'hi', inner: Ln(K.sideSeam(PNL, 46, P, 6), { tone: 'faint' }) }));
  pan.push(K.dotsSvg(K.pointsAt([[183.5, 30.05, 146.5], [220.5, 30.05, 146.5], [183.5, 30.05, 43.5], [220.5, 30.05, 43.5]], P), { size: 0.75, tone: 'mid' }));
  for (let i = 0; i < 4; i++) {
    const c = ROW_Z[i];
    pan.push(S(slab(183.5, 207.5, 30, 31.2, c - 7, c + 7, P, 0.5), { tone: i === 3 ? 'mid' : 'hi' }));
    pan.push(`<path class="slot" d="${poly([[211.5, 30.04, c - 9], [217.5, 30.04, c - 9], [217.5, 30.04, c + 9], [211.5, 30.04, c + 9]], P)}"/>`);
    if (i < 3) pan.push(faceText(195.5, 31.25, c - 1.6, P, ROWS[i], 4.2));
  }
  const svg = { back: o.join(''), front: stg('stg5', pan.join('')) };
  STATIC.set(key, svg);
  return svg;
}
const ROWS = ['FASTER', 'LONGER', 'FRIENDLY'];
const ROW_Z = [136, 110, 84, 58];

/* the guillotine posts and top bar, in front of the blade */
function frontSvg(P) {
  return S(slab(22, 26, 42, 46, 206, 256, P, 0.5), { tone: 'hi' }) + S(slab(62, 66, 42, 46, 206, 256, P, 0.5), { tone: 'hi' }) +
    S(slab(20, 68, 42, 46, 256, 260, P, 0.6, 0.4), { tone: 'hi' });
}

/* how fast the GUESS gear turns, and how far it has turned: a table, so any t
   has one answer whatever order the frames come in */
const omega = t => 0.9 + 1.4 * bump(t, FAST - 0.1, 0.25, 0.4, 0.5) + 4.6 * CURVE.cam(span(t, GUESSW - 0.1, GUESSW + 1.4));
const DT = 1 / 600, TH = [0];
for (let i = 1; i <= Math.ceil(40 / DT); i++) TH.push(TH[i - 1] + omega((i - 0.5) * DT) * DT);
const thetaAt = t => { const x = Math.max(0, t) / DT, i = Math.floor(x); return TH[i] + (TH[i + 1] - TH[i]) * (x - i); };
/* the belt runs while the pieces ride it */
const beltAt = t => 34 * Math.max(0, Math.min(t, L4.at + 1.2) - CHOP0) + 8 * t;

/* the blade: down fast on each chop, up a little slower */
function bladeZ(t) {
  let d = 0;
  for (const c of CHOPS) d = Math.max(d, t < c ? 0 : t < c + 0.05 ? smooth(span(t, c, c + 0.05)) : 1 - smooth(span(t, c + 0.05, c + 0.14)));
  return 238 - 24 * d;
}
/* a lever: up until its click, then down with a little overshoot */
const leverZ = (i, t) => ROW_Z[i] + 6 - 12 * (t < LEVERS[i] ? 0 : Math.min(1.08, SPRING(span(t, LEVERS[i], LEVERS[i] + 0.22))));

/* the light that runs through it on machine: a route through every stage */
const ROUTE = [[44, 22, 306], [44, 22, 246], [44, 42, 224], [78, 22, 206], [158, 22, 206], [150, 9, 188], [150, 9, 150], [75, 9, 150], [90, 14, 110], [118, 26, 104], [118, 68, 64]];
const ROUTE_LEN = G.pathLength(ROUTE);
const PULSE_D = 1.25;
const STG_AT = [0, 0.13, 0.32, 0.55, 0.85].map(u => f3(PULSE + u * PULSE_D));

function dynSvg(P, t) {
  const o = [];
  /* the gears */
  const thG = thetaAt(t), th = trainAngles(thG);
  const g7 = smooth(span(t, GUESSW - 0.1, GUESSW + 0.8));
  const guessK = 0.55 + 0.45 * g7 + 0.3 * hitPulse(t - STG_AT[3], 0.03, 0.2);
  o.push(gearSvg(GUESS, thG, P, { y0: 2, y1: 9, k: Math.min(1, guessK), hub: false }));
  o.push(accent(S(G.disc(9, 11.2, 11, FY(GUESS.x, GUESS.z), P), { tone: 'hi' }) + faceText(GUESS.x, 11.25, GUESS.z - 1.9, P, 'GUESS', 5.6), Math.min(1, guessK), 0.6));
  SMALL.forEach((g, i) => o.push(gearSvg(g, th[i], P, { k: gearOn(i, t) + 0.6 * hitPulse(t - STG_AT[3], 0.03, 0.2) })));
  /* the window over each gear lights with it */
  SMALL.forEach((g, i) => {
    const k = gearOn(i, t);
    if (k > 0.01) o.push(`<path class="win" style="opacity:${f3(k)}" d="${poly([[g.x - 7.5, 4.05, 156.5], [g.x + 7.5, 4.05, 156.5], [g.x + 7.5, 4.05, 162.5], [g.x - 7.5, 4.05, 162.5]], P)}"/>`);
  });
  /* the belt's cleats move with it */
  const off = beltAt(t), cl = [];
  for (let i = 0; i < 9; i++) {
    const x = 79 + ((i * 9 + off) % 77);
    cl.push(K.lineOnTop([x, 5.6], [x, 38.4], 206.03, P));
  }
  o.push(Ln(cl.join(''), { tone: 'lo' }));
  /* the blade, its edge lit */
  const bz = bladeZ(t);
  o.push(S(slab(26.5, 61.5, 42.6, 45.4, bz, bz + 9, P, 0.3, 0.3), { tone: 'hi', inner: Ln(K.segment([27, 45.45, bz + 2.2], [61, 45.45, bz + 2.2], P), { tone: 'faint' }) }));
  o.push(Ln(K.segment([26.8, 45.45, bz + 0.15], [61.2, 45.45, bz + 0.15], P), { tone: 'lit' }));
  o.push(frontSvg(P));
  const mid = o.splice(0).join('');
  /* the levers, and the empty slot's ghost */
  for (let i = 0; i < 3; i++) {
    const z = leverZ(i, t);
    o.push(S(G.disc(30, 37, 1.5, FY(214.5, z), P), { tone: 'hi' }));
    o.push(S(G.sphereOf([214.5, 38.6, z], 2.9, P), { tone: 'hi' }));
  }
  const gw = ['I', 'DO', 'NOT', 'KNOW'], gx = [0, 2, 5, 0], gl = [0, 0, 0, 1];
  const c3 = ROW_Z[3], sz = 4.0;
  gw.forEach((word, k) => {
    const lit = smooth(span(t, GHOST[k], GHOST[k] + 0.12));
    const op = f3(0.16 + 0.84 * lit);
    const x0 = 185.6 + gx[k] * 0.6 * sz * 1.08, z = c3 + (gl[k] ? -5.0 : 1.0);
    o.push(`<g class="ghost" style="opacity:${op}">${faceText(x0, 31.25, z, P, word, sz, 'hi', 'start')}</g>`);
  });
  const slotK = smooth(span(t, EMPTY - 0.05, EMPTY + 0.2)) * (1 - smooth(span(t, PULL, PULL + 0.6)));
  if (slotK > 0.01) o.push(`<path class="slotlit" style="opacity:${f3(slotK)}" d="${poly([[211.5, 30.06, c3 - 9], [217.5, 30.06, c3 - 9], [217.5, 30.06, c3 + 9], [211.5, 30.06, c3 + 9]], P)}"/>`);
  /* the light running through it */
  if (t >= PULSE && t < PULSE + PULSE_D + 0.25) {
    const u = CURVE.dolly(span(t, PULSE, PULSE + PULSE_D)), head = u * ROUTE_LEN;
    const a = Math.max(0, head - 70), fade = 1 - smooth(span(t, PULSE + PULSE_D, PULSE + PULSE_D + 0.25));
    if (head > a + 0.5) o.push(`<path class="pulse" style="opacity:${f3(fade)}" d="${K.pathOf(G.cut(ROUTE, a, head).map(p => K.iso(p, P)))}"/>`);
  }
  return { mid, front: o.join('') };
}
/* a small gear is on from its beat until the next one, and fades after */
function gearOn(i, t) {
  const a = GEAR_AT[i], b = i < 3 ? GEAR_AT[i + 1] : a + 0.6;
  return f3(smooth(span(t, a, a + 0.08)) * (1 - 0.75 * smooth(span(t, b, b + 0.3))) * (1 - smooth(span(t, OUT, OUT + 0.4))) + 0.25 * smooth(span(t, FAST, FAST + 0.15)) * (1 - smooth(span(t, OUT, OUT + 0.4))));
}

/* ---------- the machine alone, as an anatomy page, for its line check ---------- */
if (MACHINE_RUN) {
  const P = projAt(AZM);
  const s = staticSvg(P), d = dynSvg(P, LOOK + 0.6);
  const body = s.back + d.mid + s.front + d.front;
  const page = K.pageHtml({ title: 'post61 machine', theme: 'dark', width: 540, body: K.figureSvg({ width: 540, height: 960, label: 'the machine', body }) });
  const out = path.join(HERE, 'out', 'verify-post61');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'machine.html'), page);
  console.log('wrote ' + path.join(out, 'machine.html'));
  process.exit(0);
}

/* ---------- the words on screen ---------- */
const TT1 = 'THE MACHINE', TT2 = 'INSIDE AI';
const QW = ['WHY IS THE', 'SKY BLUE?'];
const PIECES = ['WHY', 'IS', 'THE', 'SKY', 'BLUE', '?'];
const CANDS = [['MAYBE', 'SINCE', 'BECAUSE'], ['IN', 'FROM', 'OF'], ['SUN', 'AIR', 'LIGHT'], ['MAGIC', 'BOUNCING', 'SCATTERING']];
const ANS = CANDS.map(c => c[2]);

/* ---------- where the words sit, off the kit's projection ---------- */
const FUN_TOP = at([FUN.c[0], FUN.c[1], FUN.z1]);
const QC = { cx: FUN_TOP.x + 40, cy: 140, w: 262, h: 96 };
/* the pieces stand on the belt's front edge, along its slope */
const B0 = at([80, 38.5, 206]), B1 = at([156, 38.5, 206]);
const BSL = (B1.y - B0.y) / (B1.x - B0.x), BANG = Math.atan(BSL);
const CH = { fs: 13, pad: 5, gap: 3 };
const chipW = s => s.length * 0.6 * CH.fs + 2 * CH.pad;
/* two lanes on the belt, three pieces in each: six pieces are longer than the belt */
const LANE = [at([79, 15, 206]), at([79, 35, 206])];
const PX = (() => { const x = [0, 0]; return PIECES.map((s, i) => { const l = i < 3 ? 0 : 1, v = x[l]; x[l] += chipW(s) + CH.gap; return v; }); })();
const STRIP = { x: at([72, 38.5, 214]).x, y: at([72, 38.5, 214]).y };
const WIN_TOP = SMALL.map(g => at([g.x, 4, 165]));
const MOUTH = at([118, 68, 64]);
const PANEL_C = at([202, 30, 95]);
/* the answer card: on the chute's lip while it fills, then out and down */
const AC = { w: 268, h: 92 };
const AC_LIP = { x: MOUTH.x + 6, y: MOUTH.y + 26, s: 0.66 };
const AC_OUT = { x: 214, y: 690, s: 1 };
/* the camera on the drawing: a stage point held at a screen point, k big.
   in to the chopper for line 3, along to the gears for line 4, out for line 5,
   in on the panel for the silence, out on line 7. each move leaves in the gap
   before its line */
const shot = (p, sx, sy, k) => ({ ax: p.x, ay: p.y, sx, sy, k });
const FULL = shot({ x: 270, y: 480 }, 270, 480, 1);
const CHOPZ = shot(at([112, 26, 208]), 262, 400, 1.75);
const GEARZ = shot(at([112, 8, 146]), 262, 430, 1.45);
const PANELZ = shot(at([200, 30, 80]), 262, 420, 3.2);
const GUESSZ = shot(at([GUESS.x + 10, 9, GUESS.z - 6], projAt(AZ7)), 250, 420, 1.85);
const ZCHAIN = shotChain(FULL, [
  { at: f3(L3.at - 0.2), to: CHOPZ, d: 0.55, curve: CURVE.cam },
  { at: f3(L4.at - 0.22), to: GEARZ, d: 0.55, curve: CURVE.cam },
  { at: f3(L5.at - 0.2), to: FULL, d: 0.6, curve: CURVE.cam },
  { at: ZOOM, to: PANELZ, d: ZOOM_D, curve: CURVE.cam },
  { at: PULL, to: GUESSZ, d: PULL_D, curve: CURVE56.pull },
  { at: f3(MAKES - 0.1), to: FULL, d: 0.8, curve: CURVE.cam },
]);

/* ---------- the camera, the living push ---------- */
const camera = livingCamera({
  F: { x: 270, y: 440 },
  holds: [[0.15, PULSE], [LOOK + 0.6, L6.end]],
  push: 0.03,
  punches: [CHOP0, ANSWER, KNOW],
});

/* ---------- him: beside the machine, a nod at the end ---------- */
const MAS = { cx: 426, cy: 668, size: 118, scale: 0.85 };
const HOME = { x: 426, y: 668, s: 0.85 };
function body(t) {
  let dy = 2.2 * Math.sin(2 * Math.PI * t / 2.4);
  dy += 5 * Math.sin(Math.PI * span(t, ANSWER + 0.05, ANSWER + 0.45));
  dy += 7 * Math.sin(Math.PI * span(t, NOD, NOD + 0.5));
  const sq = 0.06 * Math.sin(Math.PI * span(t, ANSWER, ANSWER + 0.16));
  return { x: HOME.x, y: HOME.y + dy, s: HOME.s, sq };
}
const LENS_T = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1, inside: true });
const zoomed = (p, t) => { const z = zoomAt(t); return { x: z.tx + p.x * z.s, y: z.ty + p.y * z.s }; };
const LOOKS = [
  { at: 0, to: AT(230, 420) },
  { at: PULSE, to: AT(FUN_TOP.x, FUN_TOP.y) },
  { at: PULSE + 0.6, to: AT(MOUTH.x, MOUTH.y) },
  { at: QIN + 0.05, to: AT(QC.cx, QC.cy) },
  { at: QDROP + 0.2, to: AT(FUN_TOP.x, FUN_TOP.y + 40) },
  { at: CHOP0 - 0.05, to: AT(B0.x + 60, B0.y) },
  { at: GEAR_AT[0], to: AT(WIN_TOP[0].x, WIN_TOP[0].y) },
  { at: GEAR_AT[2], to: AT(WIN_TOP[2].x, WIN_TOP[2].y) },
  { at: OUT, to: AT(AC_OUT.x, AC_OUT.y - 10) },
  { at: ZOOM + 0.3, to: 'panel' },
  { at: PULL + 0.2, to: AT(GUESS_S().x, GUESS_S().y) },
  { at: LENS, to: LENS_T },
];
function GUESS_S() { return at([GUESS.x, 11, GUESS.z], projAt(AZ7)); }
const BLINKS = [1.9, L2.end + 0.1, L3.end + 0.1, L5.at - 0.15, PULL + 0.9].map(f3);
const HAPPY = [0.95, ANSWER + 0.12];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const p = body(t);
  const lens = { x: p.x, y: p.y, w: 0 };
  const resolve = (o, tt) => (o === 'panel' ? { ...zoomed(PANEL_C, tt), w: 1 } : o.w === 0 ? lens : o.inside ? { ...zoomed(o, tt), w: 1 } : o);
  const cur = resolve(LOOKS[i].to, t), prev = i ? resolve(LOOKS[i - 1].to, t) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.22));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? smooth(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  /* the squint at the empty slot, let go on the pull back */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, KNOW, KNOW + 0.2)) * (1 - smooth(span(t, PULL, PULL + 0.3))));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.3, 0.12));
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy), rot: 0, sq: f3(p.sq), s: f3(p.s) };
}

/* the camera on the drawing at t, as a translate and a scale */
function zoomAt(t) {
  const c = ZCHAIN(t);
  return { s: f3(c.k), tx: f2(c.sx - c.ax * c.k), ty: f2(c.sy - c.ay * c.k) };
}

/* ---------- a frame of the story ---------- */
function frame(t) {
  const S2 = [], X = [];
  const put = (id, o, tr, blur) => { S2.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S2.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };
  const P = projAt(azAt(t));
  const z = zoomAt(t);
  S2.push(['mz', 'transform', 'translate(' + z.tx + 'px,' + z.ty + 'px) scale(' + z.s + ')']);
  /* the stages flash as the light passes */
  STG_AT.forEach((a, i) => {
    const id = ['stg0', 'stg1', 'stg2', null, 'stg4'][i];
    if (!id) return;
    const h = hitPulse(t - a, 0.04, 0.22);
    S2.push([id, 'filter', h > 0.01 ? 'brightness(' + f3(1 + 0.8 * h) + ') drop-shadow(0 0 ' + f2(4 + 10 * h) + 'px rgba(255,255,255,' + f3(0.85 * h) + '))' : 'none']);
  });

  /* the title, there at frame 0, up and out at the end of line 1 */
  const tOut = CURVE56.in(span(t, TITLE_OUT, TITLE_OUT + 0.28));
  put('title', 1 - tOut, 'translateY(' + f2(-36 * tOut) + 'px) scale(' + f3(1 + 0.03 * hitPulse(t - PULSE - 0.2)) + ')');

  /* l2: the question card springs in over the funnel and drops into it */
  const qIn = t < QIN ? hidden : wordIn(t, QIN, 'spring');
  const qd = CURVE.exit(span(t, QDROP, QLAND));
  const qx = lerp(QC.cx, FUN_TOP.x, qd), qy = lerp(QC.cy, FUN_TOP.y + 4, qd);
  const qs = qIn.s * lerp(1, 0.18, qd), qsy = 1 + 0.12 * Math.sin(Math.PI * span(t, QDROP - 0.12, QDROP));
  put('qcard', t < QLAND ? qIn.o * (1 - smooth(span(t, QLAND - 0.08, QLAND))) : 0, 'translate(' + f2(qx - QC.cx) + 'px,' + f2(qy - QC.cy) + 'px) scale(' + f3(qs / qsy) + ',' + f3(qs * qsy) + ')');

  /* l3: each chop sends a piece out of the chopper onto its spot on the belt,
     then the belt carries them all into the hopper at the start of line 4 */
  PIECES.forEach((_, i) => {
    const a = CHOPS[i], u = CURVE.out(span(t, a, a + 0.34));
    const ride = Math.max(0, beltAt(t) - beltAt(L4.at - 0.1)) * KS * 1.12;
    const L = LANE[i < 3 ? 0 : 1], sx = PX[i] + chipW(PIECES[i]) / 2;
    const d = sx + ride, end = (B1.x - B0.x) / Math.cos(BANG) + 6;
    const gone = smooth(span(d, end - 14, end));
    const o = t < a ? 0 : (1 - gone) * smooth(span(t, a, a + 0.06));
    /* out of the chopper's side in a hop, onto its spot in its lane */
    const tx = L.x + d * Math.cos(BANG), ty = L.y + d * Math.sin(BANG);
    const x = lerp(STRIP.x, tx, u), y = lerp(STRIP.y, ty, u) - 16 * Math.sin(Math.PI * u) + 10 * gone;
    put('pc' + i, o, 'translate(' + f2(x) + 'px,' + f2(y) + 'px) rotate(' + f2(BANG * 180 / Math.PI) + 'deg) translate(-50%,-100%) scale(' + f3(1 + 0.12 * hitPulse(t - a - 0.3)) + ')');
  });

  /* l4: the active gear's window shows its three guesses, the third locks green
     and flies to the answer card */
  let ci = -1;
  for (let i = 0; i < 4; i++) if (t >= GEAR_AT[i] - 0.02) ci = i;
  const cAt = ci < 0 ? 0 : GEAR_AT[ci], cEnd = ci < 0 ? 0 : ci < 3 ? GEAR_AT[ci + 1] : Math.min(OUT, GEAR_AT[3] + 0.75);
  const slot = Math.max(0.28, cEnd - cAt);
  const per = Math.min(0.11, slot * 0.22);
  const step = ci < 0 ? 0 : Math.max(0, Math.min(2, Math.floor((t - cAt) / per)));
  const lockAt = cAt + 2 * per, flyAt = Math.min(cEnd - 0.12, lockAt + 0.2);
  const cIn = ci < 0 ? hidden : wordIn(t, cAt, 'spring');
  const fly = CURVE56.glide(span(t, flyAt, flyAt + 0.26));
  const cOut = ci === 3 ? smooth(span(t, flyAt + 0.15, flyAt + 0.3)) : 0;
  /* over its window, kept inside the margins through the drawing's camera */
  const wt = ci < 0 ? { x: 0, y: 0 } : (() => { const W = WIN_TOP[ci], half = (CANDS[ci][step].length * 1.2 * 17 + 28) / 2 * 1.16, Z = zoomAt(t); return { x: Math.min(W.x, (468 - half * Z.s - Z.tx) / Z.s), y: W.y, ax: W.x }; })();
  put('cand', ci < 0 || t > OUT ? 0 : cIn.o * (1 - cOut), 'translate(' + f2(wt.x) + 'px,' + f2(wt.y - 8) + 'px) translate(-50%,-100%) scale(' + f3(Math.min(1.04, cIn.s) * (1 + 0.14 * hitPulse(t - lockAt))) + ')');
  X.push(['candw', ci < 0 ? '' : CANDS[ci][step]]);
  S2.push(['cand', '--g', f3(ci < 0 ? 0 : smooth(span(t, lockAt, lockAt + 0.06)))]);
  /* the word in flight, from the window to its place on the card */
  const acP = acardAt(t);
  const tgt = ci < 0 ? { x: 0, y: 0 } : { x: acP.x + (WSLOT[ci].x - AC.w / 2) * acP.s, y: acP.y + (WSLOT[ci].y - AC.h / 2) * acP.s };
  const fo = t >= flyAt && t < flyAt + 0.26 ? 1 : 0;
  put('fly', fo, 'translate(' + f2(lerp(wt.x, tgt.x, fly)) + 'px,' + f2(lerp(wt.y - 20, tgt.y, fly) - 40 * Math.sin(Math.PI * fly)) + 'px) translate(-50%,-50%) scale(' + f3(lerp(1, acP.s * 0.9, fly)) + ')');
  X.push(['flyw', ci < 0 ? '' : ANS[ci]]);

  /* the answer card: peeks on the chute's lip from line 4, slides out on out */
  const acIn = smooth(span(t, GEAR_AT[0] - 0.2, GEAR_AT[0] + 0.1));
  const acGone = CURVE56.in(span(t, L5.end - 0.05, ZOOM - 0.02));
  put('acard', acIn * (1 - acGone), 'translate(' + f2(acP.x - AC.w / 2) + 'px,' + f2(acP.y - AC.h / 2) + 'px) scale(' + f3(acP.s * (1 + 0.04 * hitPulse(t - ANSWER - 0.1))) + ')');
  for (let i = 0; i < 4; i++) {
    const land = Math.min(GEAR_AT[i] + 0.55, (i < 3 ? GEAR_AT[i + 1] : OUT) + 0.1);
    const arrive = flyArrive(i);
    S2.push(['aw' + i, 'opacity', t >= arrive ? 1 : 0], ['aw' + i, 'transform', 'scale(' + f3(1 + 0.25 * hitPulse(t - arrive, 0.02, 0.1)) + ')']);
    void land;
  }
  const tk = span(t, ANSWER + 0.05, ANSWER + 0.3);
  S2.push(['tick', 'stroke-dashoffset', f2(40 * (1 - CURVE.out(tk)))], ['tick', 'opacity', t >= ANSWER + 0.05 ? 1 : 0]);
  const st = staticSvg(P), dy = dynSvg(P, t);
  return { S: S2, X, svgS: st.back, svgD: dy.mid, svgF: st.front, svgE: dy.front };
}
/* the answer card's centre and size at t */
function acardAt(t) {
  const u = CURVE.out(span(t, OUT, OUT + 0.5));
  return { x: lerp(AC_LIP.x, AC_OUT.x, u), y: lerp(AC_LIP.y, AC_OUT.y, u), s: lerp(AC_LIP.s, AC_OUT.s, u) };
}
/* where each word lands on the card, css px inside it */
const AFS = 16, ACH = AFS * 0.97;
const WSLOT = (() => {
  const l1 = ANS[0] + ' ' + ANS[1], l2 = ANS[2] + ' ' + ANS[3];
  const x1 = (AC.w - l1.length * ACH) / 2, x2 = (AC.w - l2.length * ACH) / 2;
  return [
    { x: x1 + ANS[0].length * ACH / 2, y: 30 },
    { x: x1 + (ANS[0].length + 1 + ANS[1].length / 2) * ACH, y: 30 },
    { x: x2 + ANS[2].length * ACH / 2, y: 60 },
    { x: x2 + (ANS[2].length + 1 + ANS[3].length / 2) * ACH, y: 60 },
  ];
})();
function flyArrive(i) {
  const a = GEAR_AT[i], b = i < 3 ? GEAR_AT[i + 1] : Math.min(OUT, GEAR_AT[3] + 0.75);
  const per = Math.min(0.11, Math.max(0.28, b - a) * 0.22);
  return f3(Math.min(b - 0.12, a + 2 * per + 0.2) + 0.26);
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 10px rgba(255,255,255,.42)) drop-shadow(0 0 26px rgba(255,255,255,.18))';
const GLOW_LO = 'drop-shadow(0 0 1px rgba(255,255,255,.7)) drop-shadow(0 0 7px rgba(255,255,255,.22))';
const ACC_GLOW = 'drop-shadow(0 0 1px #35ff6a) drop-shadow(0 0 9px rgba(53,255,106,.55)) drop-shadow(0 0 22px rgba(53,255,106,.25))';
const CARD_CSS = 'background:#0a0b0f;border:1.5px solid rgba(244,247,246,.9);border-radius:10px;box-sizing:border-box';
const css = K.ISO_CSS + `
:root{--acc:${ACC}}
#grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(233,238,236,.11) 0.9px,transparent 1.3px);background-size:16px 16px;background-position:6px 8px}
#mzw{position:absolute;inset:0;-webkit-mask-image:linear-gradient(180deg,#000 0,#000 728px,transparent 768px);mask-image:linear-gradient(180deg,#000 0,#000 728px,transparent 768px)}
#mz{position:absolute;inset:0;transform-origin:0 0;will-change:transform}
#mach{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible;filter:drop-shadow(0 0 1px rgba(255,255,255,.55)) drop-shadow(0 0 6px rgba(255,255,255,.28)) drop-shadow(0 0 16px rgba(255,255,255,.12))}
#mach.iso{--anatomy-paper:#07090a;--anatomy-face:#0c0f10;--anatomy-top:#111415;
  --anatomy-shade-0:#040506;--anatomy-shade-1:#060708;--anatomy-shade-2:#08090a;--anatomy-shade-3:#0b0d0e;
  --anatomy-lit-top:#151a19;--anatomy-lit-shade:#0d1110;
  --anatomy-hi:#f4f7f6;--anatomy-mid:rgba(233,238,236,.62);--anatomy-lo:rgba(233,238,236,.36);--anatomy-faint:rgba(233,238,236,.2);--anatomy-lit:#ffffff;
  --anatomy-halo:#000;--anatomy-halo-opacity:.9;--anatomy-dot:#f4f7f6;--anatomy-weight:1.05px;--anatomy-mono:var(--mono)}
#mach .iso-edge{stroke-width:1.7px}
#mach .iso-crease,#mach .iso-bevel{stroke-width:.9px}
#mach .iso-face-text{font-weight:600;letter-spacing:.06em}
#mach .hole{fill:#030404;stroke:var(--anatomy-mid);stroke-width:.7px}
#mach .mouth{fill:#020303;stroke:var(--anatomy-lo);stroke-width:.7px}
#mach .glass{fill:#050707;stroke:var(--anatomy-lo);stroke-width:.7px}
#mach .win{fill:rgba(53,255,106,.55);stroke:${ACC};stroke-width:1px;filter:drop-shadow(0 0 6px rgba(53,255,106,.8))}
#mach .slot{fill:#020303;stroke:var(--anatomy-lo);stroke-width:.7px}
#mach .slotlit{fill:none;stroke:#fff;stroke-width:1.4px;filter:drop-shadow(0 0 6px rgba(255,255,255,.9))}
#mach .pulse{fill:none;stroke:#fff;stroke-width:4.5px;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 12px rgba(255,255,255,.7))}
#title{position:absolute;left:60px;right:60px;top:84px;text-align:center;transform-origin:50% 50px;will-change:transform,opacity}
#title div{width:max-content;margin:0 auto;font:400 36px/1.2 var(--display);letter-spacing:.05em;color:#f7f9f8;white-space:nowrap;-webkit-text-stroke:.6px #fff;filter:${GLOW}}
#title em{font-style:normal;color:var(--acc);-webkit-text-stroke:.6px var(--acc);filter:${ACC_GLOW}}
#qcard{position:absolute;left:${QC.cx - QC.w / 2}px;top:${QC.cy - QC.h / 2}px;width:${QC.w}px;height:${QC.h}px;opacity:0;${CARD_CSS};
  display:flex;flex-direction:column;align-items:center;justify-content:center;filter:${GLOW_LO};transform-origin:50% 50%;will-change:transform,opacity}
#qcard div{font:400 23px/1.4 var(--display);letter-spacing:.04em;color:#f7f9f8;white-space:nowrap}
.pc{position:absolute;left:0;top:0;opacity:0;transform-origin:0 0;padding:4px ${CH.pad}px 3px;border:1.2px solid rgba(244,247,246,.9);border-radius:4px;background:#0a0b0f;
  font:600 ${CH.fs}px/1.1 var(--mono);color:#f7f9f8;white-space:nowrap;filter:${GLOW_LO};will-change:transform,opacity}
#cand{position:absolute;left:0;top:0;opacity:0;transform-origin:0 0;padding:7px 12px 6px;border-radius:7px;background:#0a0b0f;
  border:1.5px solid color-mix(in srgb,var(--acc) calc(var(--g,0) * 100%),rgba(244,247,246,.9));
  font:400 17px/1 var(--display);letter-spacing:.04em;white-space:nowrap;color:color-mix(in srgb,var(--acc) calc(var(--g,0) * 100%),#f7f9f8);
  filter:drop-shadow(0 0 1px rgba(255,255,255,.6)) drop-shadow(0 0 calc(4px + 8px * var(--g,0)) rgba(53,255,106,calc(.6 * var(--g,0))));will-change:transform,opacity}
#fly{position:absolute;left:0;top:0;opacity:0;transform-origin:0 0;font:400 17px/1 var(--display);letter-spacing:.04em;color:var(--acc);white-space:nowrap;filter:${ACC_GLOW}}
#acard{position:absolute;left:0;top:0;width:${AC.w}px;height:${AC.h}px;opacity:0;${CARD_CSS};transform-origin:50% 50%;filter:${GLOW_LO};will-change:transform,opacity}
.al{position:absolute;left:0;right:0;height:24px;display:flex;justify-content:center;gap:${f2(ACH)}px}
.aw{display:inline-block;font:400 ${AFS}px/24px var(--display);letter-spacing:.02em;color:#f7f9f8;white-space:nowrap;opacity:0;transform-origin:50% 60%}
#tickw{position:absolute;right:-16px;top:-16px;width:36px;height:36px;border-radius:50%;background:#0a0b0f;border:1.5px solid var(--acc);filter:${ACC_GLOW}}
#tick{fill:none;stroke:var(--acc);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40;opacity:0}
`;
const pcHtml = PIECES.map((s, i) => `<div class="pc" id="pc${i}">${s === '?' ? '?' : s}</div>`).join('');
const awHtml = '<div class="al" style="top:18px"><span class="aw" id="aw0">' + ANS[0] + '</span><span class="aw" id="aw1">' + ANS[1] + '</span></div><div class="al" style="top:48px"><span class="aw" id="aw2">' + ANS[2] + '</span><span class="aw" id="aw3">' + ANS[3] + '</span></div>';
const markup = `
<div id="grid"></div>
<div id="mzw"><div id="mz">
  <svg id="mach" class="iso" viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg"><g id="ms"></g><g id="md"></g><g id="mf"></g><g id="me"></g></svg>
  <div id="qcard"><div>${QW[0]}</div><div>${QW[1]}</div></div>
  ${pcHtml}
  <div id="cand"><span id="candw"></span></div>
  <div id="fly"><span id="flyw"></span></div>
  <div id="acard">${awHtml}<div id="tickw"><svg viewBox="0 0 36 36" width="36" height="36" style="position:absolute;left:-1.5px;top:-1.5px"><path id="tick" d="M10 18.5 L15.5 24 L26 12.5"/></svg></div></div>
</div>
</div><div id="title"><div>${TT1}</div><div>INSIDE <em>AI</em></div></div>`;

function page() {
  const els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  let lastS = null, lastD = null, lastF = null, lastE = null;
  window.__gag = {
    apply(o) {
      if (o.svgS !== lastS) { lastS = o.svgS; $('ms').innerHTML = o.svgS; for (const k of Object.keys(last)) if (k.startsWith('stg')) delete last[k]; for (const k of Object.keys(els)) if (k.startsWith('stg')) delete els[k]; }
      if (o.svgD !== lastD) { lastD = o.svgD; $('md').innerHTML = o.svgD; }
      if (o.svgF !== lastF) { lastF = o.svgF; $('mf').innerHTML = o.svgF; for (const k of Object.keys(last)) if (k.startsWith('stg')) delete last[k]; for (const k of Object.keys(els)) if (k.startsWith('stg')) delete els[k]; }
      if (o.svgE !== lastE) { lastE = o.svgE; $('me').innerHTML = o.svgE; }
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        const el = $(id);
        if (!el) continue;
        last[key] = v;
        if (k.startsWith('--')) el.style.setProperty(k, v); else el.style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, v] of o.X) if ($(id).textContent !== v) $(id).textContent = v;
    },
  };
}

/* ---------- the stills, and the sound when it is a render ---------- */
const BEATS = [MAKES, PULSE, TITLE_OUT, QIN, QDROP, QLAND, CHOP0, CHOPS[5], L4.at, ...GEAR_AT, FAST, OUT, ANSWER, ZOOM, LOOK, ...GHOST, EMPTY, PULL, GUESSW, LENS, NOD];
const STILLS = [0, 0.8, PULSE + 0.5, TITLE_OUT + 0.2, QIN + 0.35, QDROP + 0.22, CHOP0 + 0.1, CHOPS[5] + 0.4, GEAR_AT[0] + 0.15, GEAR_AT[1] + 0.3, GEAR_AT[2] + 0.25, GEAR_AT[3] + 0.3,
  OUT + 0.25, ANSWER + 0.35, ZOOM + 0.45, LOOK + 0.35, KNOW + 0.3, PULL + 0.45, GUESSW + 0.9, NOD + 0.25, CUT + 0.3].map(f3);

console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', cut ' + CUT + ', total ' + f3(CUT + HOLD));
for (const T of TAKES) console.log('  ' + T.name + ': ' + T.all.join(' | '));
console.log('  kit scale ' + KS.toFixed(3) + ', funnel top ' + JSON.stringify(FUN_TOP) + ', mouth ' + JSON.stringify(MOUTH) + ', panel ' + JSON.stringify(PANEL_C));

/* a still is the same every time: the machine's svg for each still, hashed */
if (process.env.HASH) {
  for (const t of STILLS) { const f = frame(t); console.log('  ' + t.toFixed(3) + ' ' + crypto.createHash('sha256').update(f.svgS + f.svgD + f.svgF + f.svgE + JSON.stringify(f.S) + JSON.stringify(f.X)).digest('hex').slice(0, 16)); }
  process.exit(0);
}

/* ---------- the sound ----------
   post60's house: every sound an elevenlabs effect, best of 3, one family,
   here a small clean mechanical toy, high passed for phones, each placed on
   its loudest sample. a quiet bed from elevenmusic under it, ducked under the
   words, out for the silence before line 6. kinds named with whoosh or sweep
   are moves, the rig does not hold them over the bed */
const sound = STILLS_RUN ? null : await (async () => {
  const { SR, VOICES, GAINS } = await import('./lib/sfx.mjs');
  const { elevenSfx } = await import('./lib/elevensfx.mjs');
  const { elevenMusic } = await import('./lib/elevenmusic.mjs');
  function highPass(src, hz) {
    const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
    for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
    let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
    if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
    return b;
  }
  const GA = { t0: Math.round((CUT - 0.09) * FPS) / FPS, n: 3 }, GB = { t0: Math.round(CUT * FPS) / FPS, n: 2 };
  const LAND = f3(GB.t0 + Math.max(1, Math.round(GB.n / 60 * FPS)) / FPS);
  const FAM = ', small clean mechanical toy machine sound, crisp and bright, no bass, no music';
  const EL = [
    { kind: 'powerhit', prompt: 'soft mechanical power on clunk with a bright metallic click' + FAM, seconds: 0.8, keep: 0.45, mode: 'hit', gain: -12, hp: 160 },
    { kind: 'whirsweep', prompt: 'short rising whir of small gears spinning up, a light mechanical hum climbing' + FAM, seconds: 1.4, keep: 1.3, mode: 'bed', fadeIn: 0.05, fadeOut: 0.15, gain: -21, hp: 250 },
    { kind: 'swishwhoosh', prompt: 'very fast short air swish' + FAM, seconds: 0.5, keep: 0.3, mode: 'hit', gain: -18, hp: 350 },
    { kind: 'pop', prompt: 'bright clean small pop' + FAM, seconds: 0.5, keep: 0.25, mode: 'hit', gain: -9, hp: 250 },
    { kind: 'clunk', prompt: 'a small card dropping into a metal funnel, light hollow clunk' + FAM, seconds: 0.8, keep: 0.4, mode: 'hit', gain: -5, hp: 180 },
    { kind: 'chop', prompt: 'crisp small guillotine blade chop, sharp metal snick' + FAM, seconds: 0.6, keep: 0.25, mode: 'hit', gain: -3, hp: 300 },
    { kind: 'ratchet', prompt: 'single crisp gear ratchet click' + FAM, seconds: 0.5, keep: 0.12, mode: 'hit', gain: -9, hp: 400 },
    { kind: 'spinsweep', prompt: 'quick whir of small gears spinning faster and faster, rising' + FAM, seconds: 1.0, keep: 0.9, mode: 'bed', fadeIn: 0.04, fadeOut: 0.12, gain: -21, hp: 300 },
    { kind: 'slidewhoosh', prompt: 'a stiff paper card sliding out of a metal chute, one quick slide' + FAM, seconds: 0.8, keep: 0.55, mode: 'bed', fadeIn: 0.02, fadeOut: 0.1, gain: -18, hp: 300 },
    { kind: 'chime', prompt: 'short soft bright confirmation ding, one clean note' + FAM, seconds: 1.0, keep: 0.6, mode: 'hit', gain: -18, hp: 400 },
    { kind: 'lever', prompt: 'small metal toggle lever click, firm and clean' + FAM, seconds: 0.5, keep: 0.15, mode: 'hit', gain: -6, hp: 300 },
    { kind: 'clack', prompt: 'hollow muted empty click, a switch with nothing behind it' + FAM, seconds: 0.6, keep: 0.25, mode: 'hit', gain: -11, hp: 250 },
    { kind: 'tick', prompt: 'single soft keyboard key tick, very short' + FAM, seconds: 0.5, keep: 0.08, mode: 'hit', gain: -8, hp: 500 },
  ];
  const KEPT = await elevenSfx(61, EL);
  /* the glitch end is post60's, the same takes from its cache */
  const ENDS = [
    { kind: 'elGlitch', prompt: 'harsh digital glitch, stuttering corrupted data bursts, buffer stutter, bitcrushed computer error, short', seconds: 0.6, keep: 0.5, mode: 'hit', gain: -15, hp: 300 },
    { kind: 'elCrackle', prompt: 'short burst of electrical static crackle, digital noise interference, crisp crackling', seconds: 0.6, keep: f3(LAND - (GA.t0 - 0.03)), mode: 'bed', fadeIn: 0.01, fadeOut: 0.012, gain: -22, hp: 1200 },
  ];
  Object.assign(KEPT, await elevenSfx(60, ENDS));
  for (const e of [...EL, ...ENDS]) { const hp = highPass(VOICES[e.kind](), e.hp); VOICES[e.kind] = () => hp; }
  for (const [k, v] of Object.entries(KEPT)) console.log('  ' + k + ' ' + v.all.join(', '));
  const GRAINS = (() => {
    const src = VOICES.elGlitch(), fr = Math.round(SR / 60), lv = [];
    for (let a = 0; a + fr < src.length; a += Math.round(fr / 2)) { let e = 0; for (let i = a; i < a + fr; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
    lv.sort((x, y) => y.e - x.e);
    const one = lv[0], two = lv.find(x => Math.abs(x.off - one.off) > 0.05) || lv[1];
    return [one.off, two.off];
  })();
  function stutter(off, n, seed) {
    const src = VOICES.elGlitch(), fr = Math.round(SR / 60), g = Math.round(fr * 0.8), out = new Float32Array(fr * n), at0 = Math.round(off * SR);
    for (let k = 0; k < n; k++) for (let i = 0; i < g; i++) {
      const env = Math.min(1, i / 48, (g - i) / 48);
      out[k * fr + i] = src[Math.min(src.length - 1, at0 + i + (k % 2) * seed)] * env * (1 - 0.12 * k);
    }
    return out;
  }
  VOICES.stutA = () => stutter(GRAINS[0], GA.n, 0); GAINS.stutA = -12;
  VOICES.stutB = () => stutter(GRAINS[1], GB.n, 300); GAINS.stutB = -14;
  const PEAK = {};
  for (const k of ['powerhit', 'swishwhoosh', 'pop', 'clunk', 'chop', 'ratchet', 'chime', 'lever', 'clack', 'tick']) {
    const b = VOICES[k](); let m = 0, p = 0;
    for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > m) { m = Math.abs(b[i]); p = i; }
    PEAK[k] = p / SR;
  }
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  const lockAt = i => { const a = GEAR_AT[i], b = i < 3 ? GEAR_AT[i + 1] : Math.min(OUT, GEAR_AT[3] + 0.75); return a + 2 * Math.min(0.11, Math.max(0.28, b - a) * 0.22); };
  const CUES = [
    on(0.0, 'powerhit', 'frame 0, the machine is on'),
    { t: PULSE - 0.1, kind: 'whirsweep', from: 'the light runs through it' },
    on(STG_AT[4] + 0.05, 'tick', 'the light reaches the chute'),
    on(QIN + 0.03, 'pop', 'the question springs in'),
    on(peakAt(QDROP, QLAND, CURVE.exit), 'swishwhoosh', 'the card falls, fastest frame'),
    on(QLAND, 'clunk', 'into the funnel'),
    on(peakAt(L3.at - 0.2, L3.at + 0.35, CURVE.cam), 'swishwhoosh', 'in to the chopper'),
    on(CHOPS[0] + 0.03, 'chop', 'chop 1'),
    on(CHOPS[2] + 0.03, 'chop', 'chop 3'),
    on(CHOPS[5] + 0.03, 'chop', 'chop 6'),
    ...[0, 1, 2, 3].map(i => on(lockAt(i), 'ratchet', 'gear ' + (i + 1) + ' locks its word')),
    { t: FAST - 0.1, kind: 'spinsweep', from: 'super fast' },
    { t: OUT - 0.05, kind: 'slidewhoosh', from: 'the card slides out' },
    on(ANSWER + 0.06, 'chime', 'the tick'),
    ...LEVERS.map((a, i) => on(a + 0.08, 'lever', 'lever ' + (i + 1) + ' clicks')),
    on(EMPTY + 0.03, 'clack', 'the empty slot'),
    { t: GUESSW - 0.1, kind: 'spinsweep', from: 'GUESS spins harder' },
    on(NOD + 0.2, 'tick', 'the nod'),
    { t: GA.t0 - 0.03, kind: 'elCrackle', from: 'static crackle under the glitch' },
    { t: GA.t0, kind: 'stutA', from: 'glitch burst 1, a grain a frame' },
    { t: GB.t0, kind: 'stutB', from: 'glitch burst 2, the residue' },
    on(LAND, 'tick', 'the card lands clean'),
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  for (const c of CUES) if (c.t > L5.end - 0.05 && c.t < L6.at - 0.03) throw new Error('an effect in the silence: ' + c.from);
  const SECS = f3(CUT + HOLD);
  const BED = await elevenMusic('post61', { prompt: 'quiet playful minimal background bed, soft plucked marimba and light clicky toy percussion, curious and warm, sparse, steady, 104 bpm, no vocals, no heavy bass, no drops', seconds: SECS, tries: 3 });
  console.log('  music ' + BED.all.join(' | '));
  const b = highPass(BED.pcm, 110);
  const g = t => 1 - smooth(span(t, L5.end - 0.05, L5.end + 0.12)) * (1 - smooth(span(t, L6.at - 0.1, L6.at + 0.25)));
  for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
  const fo = Math.round(0.4 * SR);
  for (let i = 0; i < fo; i++) b[b.length - 1 - i] *= i / fo;
  return { sfx: { cues: CUES, level: -9, duck: 0.6 }, music: { pcm: b, level: -24, duck: 0.6, under: -14, fx: 6 } };
})();

await runEpisode({
  post: 61, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD, shortHold: true,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  maxGap: 0.95,
  tp: -1,
  ...(sound ? { sfx: sound.sfx, music: sound.music } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, page, frame, face, camera,
    sleep: [],
    beats: BEATS,
    checks: ['#title div', '#qcard', '#cand', '#acard'],
    hook: ['#title', '#mach'],
    copy: [TT1, TT2, ...QW, ...PIECES, ...CANDS.flat(), ...ROWS, 'I', 'DO', 'NOT', 'KNOW', 'GUESS'],
    verify: [
      { at: 0.05, sel: '#ms', test: r => (r && r.l >= 60 && r.r <= 480 && r.t >= 60 && r.b <= 766 ? null : 'the machine leaves the margin at frame 0: ' + JSON.stringify(r)) },
      { at: f3(CUT - 0.1), sel: '#ms', test: r => (r && r.l >= 60 && r.r <= 480 && r.t >= 60 && r.b <= 766 ? null : 'the machine leaves the margin at the end: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'THE MACHINE INSIDE AI'], [PULSE, 'the light runs'], [TITLE_OUT, 'the title leaves'], [QIN, 'the question'], [QDROP, 'it drops'], [CHOP0, 'the chops'], ...GEAR_AT.map((g, i) => [g, 'gear ' + (i + 1)]),
      [FAST, 'super fast'], [OUT, 'the card slides out'], [ANSWER, 'the tick'], [ZOOM, 'zoom to the panel, the hush'], [LOOK, 'the levers'], [GHOST[0], 'the ghost lights'], [KNOW, 'the squint'], [PULL, 'pull back'], [GUESSW, 'GUESS spins up'], [LENS, 'to the lens'], [NOD, 'the nod'], [CUT, 'the cut']],
  },
});
