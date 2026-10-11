/* the boring tek — post58. floor plan to home, a test of property promo videos
   made with AI.

   dark, 1080x1920. six lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, every take sped up 1.12 with atempo, pitch
   kept. post57's subtitles, the plain end card. the rig is lib/aiafter.mjs with
   the series off, on the cinematic kit and post56's kit: the comet trace, the
   ripple, hitPulse, lmix for the dolly.

     frame 0  the whole glowing plan from straight above, FLOOR PLAN TO PROMO,
              him small in the bottom left looking at it, a comet already
              running round the outside walls
     l1       we are testing ...      a happy arc on new, the plan flashes out
                                      from the door on AI
     l2       this is just ...        the plan drops to a ghost and a comet
                                      redraws it wall by wall, the room names
                                      pop in one after another, each area
                                      counting up in green
     l3       now watch it ...        the camera tilts into 3D in one move, the
                                      title leaves with it, the labels fade, and
                                      on home the walls rise in a ripple from
                                      the front door outward
     l4       walls, windows ...      the edges pulse, the door and window gaps
                                      cut in, the furniture drops in with a
                                      squash, a slow orbit starts
     silence                          the orbit alone
     l5       lights on ...           warm windows room by room, the dot grid
                                      dims, the 2D plan flashes on the ground on
                                      built
     l6       we love testing ...     the camera pulls up to the hero view,
                                      PLAN TO PROMO VIDEO rises in, he hops to
                                      the house, nods, squints at the lens
     the glitch cut, the plain end card

   the house is made up: one floor, three bedrooms, no address, no logos. it is
   three.js, pinned in demo/package.json, inlined from node_modules by
   lib/three-inline.mjs and drawn by lib/gl-layer.mjs in a second browser on
   swiftshader, chrome's cpu webgl, so no gpu driver touches a frame. three never runs a clock: node works out the whole
   scene from t, the page sets it and calls render() once, and the rig's
   screenshot takes the canvas. white line art with hidden lines, near black
   faces, the glow is two wide additive passes of the same lines, no bloom.
   green only on the area counters, warm yellow only in the windows.

     DEMO_FPS=12 node post58.mjs          the preview
     node post58.mjs --stills             one still per beat, no render
     node post58.mjs                      60fps
     BBOX=1 node post58.mjs               the house's screen box per shot, no render
     GLTEST=1 node post58.mjs             a hash of the gl layer per still, to prove it repeats
*/

import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, EASE, IO, SPRING, DSF, VW, VH,
  livingCamera, wordIn, wordStyle, CURVE, CURVE56, peakAt, hitPulse, rippleAt, lmix,
} from './lib/aiafter.mjs';
import { threeScript, linesScript } from './lib/three-inline.mjs';
import { glLayer } from './lib/gl-layer.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.12;
const LINES = [
  { key: 'r1', text: '[excited] we are testing something new. property videos made with AI.', tempo: TEMPO },
  { key: 'r2', text: '[cheerful] this is just a simple floor plan.', tempo: TEMPO },
  { key: 'r3', text: '[amused] now watch it become a home.', tempo: TEMPO },
  { key: 'r4', text: '[warm] walls, windows, every room in its place.', tempo: TEMPO },
  { key: 'r5', text: '[cheerful] lights on. ready to show, before it is even built.', tempo: TEMPO },
  { key: 'r6', text: '[warm] we love testing new things. need one for your property? let us know.', tempo: TEMPO },
];
const TAKES = await readLines(58, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6] = TAKES;
const SUBS = [
  { line: 0, text: 'we are testing something new' },
  { line: 0, text: 'property videos made with AI' },
  { line: 1, text: 'this is just a simple floor plan' },
  { line: 2, text: 'now watch it become a home' },
  { line: 3, text: 'walls, windows, every room in its place' },
  { line: 4, text: 'lights on' },
  { line: 4, text: 'ready to show, before it is even built' },
  { line: 5, text: 'we love testing new things' },
  { line: 5, text: 'need one for your property? let us know' },
];

/* ---------- the words on screen ---------- */
const W_T1 = 'FLOOR PLAN', W_T2 = 'TO PROMO', W_END = 'PLAN TO PROMO VIDEO';

/* ---------- the house, metres. x right, z toward the front, y up ---------- */
const H = 2.4, SILL = 0.85, HEAD = 1.95;
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3), f4 = v => +v.toFixed(4);
/* a wall: along x at z = k, or along z at x = k, from c0 to c1, thickness th.
   openings by their centre on the wall's axis */
const WALLS = [
  { ax: 'x', k: 4, c0: -6.12, c1: 6.12, th: 0.24, o: [{ c: -3.3, w: 2.0, k: 'win', room: 0 }, { c: 1.75, w: 1.0, k: 'door' }, { c: 4.7, w: 1.3, k: 'win', room: 1 }] },
  { ax: 'z', k: 6, c0: 3.88, c1: -3.88, th: 0.24, o: [{ c: 1.8, w: 1.2, k: 'win', room: 1 }, { c: -2.3, w: 0.8, k: 'win', room: 5 }] },
  { ax: 'x', k: -4, c0: 6.12, c1: -6.12, th: 0.24, o: [{ c: 2.55, w: 1.2, k: 'win', room: 4 }, { c: -0.45, w: 1.3, k: 'win', room: 3 }, { c: -4.0, w: 1.4, k: 'win', room: 2 }] },
  { ax: 'z', k: -6, c0: -3.88, c1: 3.88, th: 0.24, o: [{ c: -2.2, w: 1.2, k: 'win', room: 2 }, { c: 1.8, w: 1.4, k: 'win', room: 0 }] },
  { ax: 'x', k: -0.5, c0: -5.88, c1: 5.88, th: 0.14, o: [{ c: -2.6, w: 0.8, k: 'door' }, { c: 0.6, w: 0.8, k: 'door' }, { c: 2.4, w: 0.8, k: 'door' }, { c: 4.6, w: 0.7, k: 'door' }] },
  { ax: 'z', k: 0.2, c0: -0.43, c1: 3.88, th: 0.14, o: [{ c: 1.6, w: 1.4, k: 'arch' }] },
  { ax: 'z', k: 3.33, c0: -0.43, c1: 3.88, th: 0.14, o: [{ c: 2.0, w: 1.2, k: 'arch' }] },
  { ax: 'z', k: -2, c0: -3.88, c1: -0.57, th: 0.14, o: [] },
  { ax: 'z', k: 1.1, c0: -3.88, c1: -0.57, th: 0.14, o: [] },
  { ax: 'z', k: 4.0, c0: -3.88, c1: -0.57, th: 0.14, o: [] },
];
const DOOR = { x: 1.75, z: 4 };
/* a box on the wall's axis from a to b, at heights y0 to y1 */
function wallBox(W, a, b, y0, y1) {
  const lo = Math.min(a, b), hi = Math.max(a, b), t = W.th / 2;
  return W.ax === 'x' ? { x0: lo, x1: hi, z0: W.k - t, z1: W.k + t, y0, y1 } : { x0: W.k - t, x1: W.k + t, z0: lo, z1: hi, y0, y1 };
}
const P = [], OPEN = [];
WALLS.forEach((W, wi) => {
  const s = Math.sign(W.c1 - W.c0);
  const ops = [...W.o].sort((p, q) => s * (p.c - q.c));
  let at = W.c0;
  const solid = (a, b) => { if (Math.abs(b - a) > 1e-6) P.push({ ...wallBox(W, a, b, 0, H), kind: 'wall', wi, dir: s, ax: W.ax, a, b, outer: wi < 4 }); };
  for (const o of ops) {
    const a = o.c - s * o.w / 2, b = o.c + s * o.w / 2;
    solid(at, a);
    const oi = OPEN.length;
    OPEN.push({ ...o, wi, ax: W.ax, kk: W.k, a, b, th: W.th });
    if (o.k === 'win') P.push({ ...wallBox(W, a, b, 0, SILL), kind: 'sill', wi, oi, dir: s, ax: W.ax, a, b, outer: wi < 4 });
    P.push({ ...wallBox(W, a, b, o.k === 'win' ? SILL : 0, HEAD), kind: 'panel', wi, oi, dir: s, ax: W.ax, a, b });
    P.push({ ...wallBox(W, a, b, HEAD, H), kind: 'head', wi, oi, dir: s, ax: W.ax, a, b });
    at = b;
  }
  solid(at, W.c1);
});
const mid = p => ({ x: (p.x0 + p.x1) / 2, z: (p.z0 + p.z1) / 2 });
/* the pen's path for the redraw: every piece drawn on the plan, in wall order */
const PEN = P.map((p, i) => i).filter(i => P[i].kind === 'wall' || P[i].kind === 'sill');
const plen = i => Math.abs(P[i].b - P[i].a);
const PEN_LEN = PEN.reduce((s, i) => s + plen(i), 0);
const OUTER = PEN.filter(i => P[i].outer);
const OUTER_LEN = OUTER.reduce((s, i) => s + plen(i), 0);
const ROOMS = [
  { name: 'LIVING', x0: -6, x1: 0.2, z0: -0.5, z1: 4, at: { x: -2.9, z: 2.6 } },
  { name: 'KITCHEN', x0: 3.33, x1: 6, z0: -0.5, z1: 4, at: { x: 4.66, z: 0.6 } },
  { name: 'BEDROOM 1', x0: -6, x1: -2, z0: -4, z1: -0.5, at: { x: -4, z: -2.25 } },
  { name: 'BEDROOM 2', x0: -2, x1: 1.1, z0: -4, z1: -0.5, at: { x: -0.45, z: -2.25 } },
  { name: 'BEDROOM 3', x0: 1.1, x1: 4, z0: -4, z1: -0.5, at: { x: 2.55, z: -2.25 } },
  { name: 'BATH', x0: 4, x1: 6, z0: -4, z1: -0.5, at: { x: 5, z: -2.25 } },
].map(r => ({ ...r, m2: Math.round((r.x1 - r.x0) * (r.z1 - r.z0)) }));

/* the furniture, groups of boxes and loose lines, dropped in one group at a
   time. the beds and the sofa are drawn bold */
const bx = (x0, x1, z0, z1, y0, y1) => ({ x0, x1, z0, z1, y0, y1 });
const rectY = (x0, x1, z0, z1, y) => [[x0, y, z0, x1, y, z0], [x1, y, z0, x1, y, z1], [x1, y, z1, x0, y, z1], [x0, y, z1, x0, y, z0]];
const bed = (x0, x1, pillows) => ({
  bold: true,
  boxes: [bx(x0, x1, -3.86, -1.86, 0, 0.45), bx(x0, x1, -3.86, -3.74, 0, 0.95)],
  lines: [...pillows.flatMap(([a, b]) => rectY(a, b, -3.62, -3.24, 0.455)), [x0, 0.455, -2.95, x1, 0.455, -2.95]],
});
const FURN = [
  { room: 0, bold: true, boxes: [bx(-4.5, -2.3, -0.22, 0.7, 0, 0.42), bx(-4.5, -2.3, -0.4, -0.22, 0, 0.85), bx(-4.7, -4.5, -0.4, 0.7, 0, 0.6), bx(-2.3, -2.1, -0.4, 0.7, 0, 0.6)], lines: [] },
  { room: 0, boxes: [bx(-3.9, -2.9, 1.5, 2.1, 0, 0.42)], lines: [] },
  { room: 1, boxes: [bx(5.3, 5.86, -0.3, 3.2, 0, 0.85)], lines: [...rectY(5.42, 5.76, 1.5, 2.1, 0.855)] },
  { room: 1, boxes: [bx(3.9, 4.8, 1.8, 2.7, 0, 0.75)], lines: [] },
  { room: 2, ...bed(-4.8, -3.2, [[-4.65, -4.08], [-3.92, -3.35]]) },
  { room: 3, ...bed(-1.55, -0.55, [[-1.4, -0.7]]) },
  { room: 3, boxes: [bx(-0.4, 0.0, -3.86, -3.46, 0, 0.5)], lines: [] },
  { room: 4, ...bed(1.3, 2.3, [[1.45, 2.15]]) },
  { room: 5, boxes: [bx(5.05, 5.84, -3.86, -2.2, 0, 0.55)], lines: [...rectY(5.15, 5.74, -3.76, -2.3, 0.555)] },
  { room: 5, boxes: [bx(4.15, 4.6, -3.86, -3.45, 0, 0.85)], lines: [] },
].map(g => {
  const all = g.boxes;
  const c = { x: (Math.min(...all.map(b => b.x0)) + Math.max(...all.map(b => b.x1))) / 2, z: (Math.min(...all.map(b => b.z0)) + Math.max(...all.map(b => b.z1))) / 2 };
  return { ...g, c };
});
/* the plan's own marks: a door swing on each door, a glass line in each window */
const MARKS = [];
for (const [oi, o] of OPEN.entries()) {
  const y = 0.004;
  if (o.k === 'win') {
    MARKS.push({ oi, seg: o.ax === 'x' ? [o.a, y, o.kk, o.b, y, o.kk] : [o.kk, y, o.a, o.kk, y, o.b] });
  } else if (o.k === 'door') {
    /* the leaf open 90 degrees into the room on the far side, and its arc */
    const side = o.wi === 0 ? -1 : 1, r = Math.abs(o.b - o.a), n = 10;
    const hinge = o.a, pt = (u, v) => (o.ax === 'x' ? [u, y, v] : [v, y, u]);
    const k = o.kk + side * o.th / 2, sg = Math.sign(o.b - o.a);
    MARKS.push({ oi, seg: [...pt(hinge, k), ...pt(hinge, k + side * r)] });
    for (let j = 0; j < n; j++) {
      const q0 = (j / n) * Math.PI / 2, q1 = ((j + 1) / n) * Math.PI / 2;
      MARKS.push({ oi, seg: [...pt(hinge + sg * r * Math.cos(q0), k + side * r * Math.sin(q0)), ...pt(hinge + sg * r * Math.cos(q1), k + side * r * Math.sin(q1))] });
    }
  }
}

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
place(L1, 0.30);
const NEW = w(L1, 'new');
const FLASH = w(L1, 'AI');
place(L2, L1.end + 0.35);
const REDRAW = f3(L2.at - 0.02), REDRAW_D = 1.7;
const LAB0 = f3(L2.at + 0.28), LAB_GAP = 0.3, COUNT_D = 0.42;
const LAB = ROOMS.map((_, i) => f3(LAB0 + i * LAB_GAP));
const LAB_LAST = f3(LAB[LAB.length - 1] + COUNT_D);
place(L3, LAB_LAST + 0.25);
const TILT = w(L3, 'watch'), TILT_D = 1.25;
const RISE = w(L3, 'home'), RISE_SPEED = 11, RISE_D = 0.46;
place(L4, L3.end + 0.4);
const PULSE = w(L4, 'walls');
const CUTS = w(L4, 'windows'), CUT_GAP = 0.035, CUT_D = 0.16;
const DROP = w(L4, 'every'), DROP_GAP = 0.1, DROP_D = 0.42;
const ORBIT0 = f3(L4.at + 0.1);
const HUSH = 0.6;
place(L5, L4.end + HUSH);
const LIGHTS = w(L5, 'lights'), LIGHT_GAP = 0.15;
const BUILT = w(L5, 'built');
place(L6, L5.end + 0.4);
const HERO = f3(L6.at + 0.02), HERO_D = 1.4;
const ORBIT1 = HERO;
const PV = w(L6, 'property');
const HOP = w(L6, 'let'), HOP_D = 0.46;
const NOD = f3(Math.max(HOP + HOP_D + 0.12, L6.end + 0.02));
const TURN = f3(NOD + 0.45), TURN_D = 0.35;
const CUT = f3(TURN + TURN_D + 0.5);
const HOLD = 1.2;

/* the walls' rise: a ripple out of the front door, each piece up on the spring */
const PIECE_AT = P.map(p => f4(rippleAt(RISE, { x: DOOR.x, y: DOOR.z }, { x: mid(p).x, y: mid(p).z }, RISE_SPEED)));
const RISE_END = f3(Math.max(...PIECE_AT) + RISE_D);
/* the cuts: the openings in ripple order from the door */
const openMid = o => { const c = (o.a + o.b) / 2; return o.ax === 'x' ? { x: c, z: o.kk } : { x: o.kk, z: c }; };
const OPEN_ORDER = OPEN.map((o, i) => i).sort((p, q) => Math.hypot(openMid(OPEN[p]).x - DOOR.x, openMid(OPEN[p]).z - DOOR.z) - Math.hypot(openMid(OPEN[q]).x - DOOR.x, openMid(OPEN[q]).z - DOOR.z));
const OPEN_AT = []; OPEN_ORDER.forEach((oi, n) => { OPEN_AT[oi] = f3(CUTS + n * CUT_GAP); });
const FURN_AT = FURN.map((_, i) => f3(DROP + i * DROP_GAP));
const ROOM_LIT = ROOMS.map((_, i) => f3(LIGHTS + i * LIGHT_GAP));

/* ---------- the 3D camera ---------- */
const D2R = Math.PI / 180;
const SHOT = {
  plan: { th: 0, ph: 0, d: 140, fov: 12, tx: 0, ty: 0, tz: 0.55 },
  tilt: { th: 20, ph: 44, d: 63, fov: 30, tx: 0, ty: 0.4, tz: 0.6 },
  orbit: { th: 68, ph: 44, d: 58, fov: 30, tx: 0.46, ty: 0.4, tz: -0.18 },
  hero: { th: 68, ph: 38, d: 76, fov: 30, tx: 3.34, ty: 0.4, tz: -0.63 },
};
const mixShot = (A, B, u) => ({ th: lerp(A.th, B.th, u), ph: lerp(A.ph, B.ph, u), d: lmix(A.d, B.d, u), fov: lmix(A.fov, B.fov, u), tx: lerp(A.tx, B.tx, u), ty: lerp(A.ty, B.ty, u), tz: lerp(A.tz, B.tz, u) });
function shotAt(t) {
  let s = SHOT.plan;
  if (t >= TILT) s = mixShot(s, SHOT.tilt, CURVE.cam(span(t, TILT, TILT + TILT_D)));
  if (t >= ORBIT0) s = mixShot(s, SHOT.orbit, CURVE.dolly(span(t, ORBIT0, ORBIT0 + (ORBIT1 + HERO_D - ORBIT0))));
  if (t >= HERO) s = mixShot(s, SHOT.hero, CURVE56.pull(span(t, HERO, HERO + HERO_D)));
  return s;
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
function cam3(t) {
  const s = shotAt(t), th = s.th * D2R, ph = s.ph * D2R;
  const T = [s.tx, s.ty, s.tz];
  const dir = [Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th)];
  const pos = T.map((v, i) => v + dir[i] * s.d);
  const up = norm(cross([Math.cos(th), 0, -Math.sin(th)], dir.map(v => -v)));
  return { pos: pos.map(f4), tgt: T.map(f4), up: up.map(f4), fov: f4(s.fov), near: f3(Math.max(1, s.d - 14)), far: f3(s.d + 30) };
}
/* where a world point lands on the 540x960 stage, the same maths as three */
function project(c, p) {
  const z = norm(sub(c.pos, c.tgt)), x = norm(cross(c.up, z)), y = cross(z, x);
  const q = sub(p, c.pos), cx = dot(q, x), cy = dot(q, y), cz = dot(q, z);
  const f = 1 / Math.tan(c.fov * D2R / 2);
  return { x: (1 + (cx / -cz) * f / (VW / VH)) / 2 * VW, y: (1 - (cy / -cz) * f) / 2 * VH };
}
const houseBox = (t, top = H) => {
  const c = cam3(t), pts = [];
  for (const x of [-6.12, 6.12]) for (const z of [-4.12, 4.12]) for (const y of [0, top]) pts.push(project(c, [x, y, z]));
  return { l: Math.min(...pts.map(p => p.x)), r: Math.max(...pts.map(p => p.x)), t: Math.min(...pts.map(p => p.y)), b: Math.max(...pts.map(p => p.y)) };
};

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 118, cy: 686, size: 118, scale: 0.8 };
const TTL_Y = 150;
const HB = houseBox(CUT);
const PV_Y = Math.round(HB.b + 46);
/* he lands beside the house, on its ground line, right of it */
const LANDAT = { x: Math.min(422, Math.round(HB.r + 36)), y: Math.round(Math.min(HB.b - 20, 700)) };

if (process.env.BBOX) {
  for (const [n, t] of [['plan', 0], ['tilt', TILT + TILT_D], ['orbit mid', (ORBIT0 + HERO) / 2], ['orbit end', HERO - 0.01], ['hero', CUT]]) {
    const r = houseBox(t); console.log(n.padEnd(10), ['l', 'r', 't', 'b'].map(k => k + ' ' + r[k].toFixed(0)).join('  '));
  }
  console.log('land', LANDAT, 'pv', PV_Y); process.exit(0);
}
/* ---------- the scene, a frame ---------- */
const comet = (t, list, total, head, len) => {
  /* the dash from head - len to head along the pen's path, a run of segments */
  const segs = [];
  let at = 0;
  const a = (head - len) * total, b = head * total;
  for (const i of list) {
    const L = plen(i), p = P[i];
    const u0 = Math.max(a, at), u1 = Math.min(b, at + L);
    if (u1 > u0) {
      const c0 = p.a + p.dir * (u0 - at), c1 = p.a + p.dir * (u1 - at), y = 0.02;
      const W = WALLS[p.wi];
      segs.push(...(p.ax === 'x' ? [c0, y, W.k, c1, y, W.k] : [W.k, y, c0, W.k, y, c1]));
    }
    at += L;
  }
  return segs.map(f3);
};
function scene(t) {
  /* the redraw: the plan drops to a ghost on line 2 and the pen draws it back */
  const pen = t < REDRAW ? 1 : span(t, REDRAW, REDRAW + REDRAW_D);
  const penAt = pen * PEN_LEN;
  const rv = new Array(P.length).fill(1);
  if (pen < 1) {
    let at = 0;
    for (const i of PEN) { rv[i] = f4(Math.max(0, Math.min(1, (penAt - at) / plen(i)))); at += plen(i); }
  }
  /* the pieces: visible from y0 to y1, rising with the ripple */
  const pc = P.map((p, i) => {
    const u = span(t, PIECE_AT[i], PIECE_AT[i] + RISE_D);
    const h = t < PIECE_AT[i] ? 0 : H * SPRING(u);
    let y0 = p.y0, y1 = p.y1 >= H - 1e-6 ? h : Math.min(p.y1, h);
    if (p.kind === 'panel') {
      if (t < PIECE_AT[i]) return [0, 0, 0, 0];
      /* the cut: the top of the panel runs down to its foot and it is gone */
      const k = span(t, OPEN_AT[p.oi], OPEN_AT[p.oi] + CUT_D);
      y1 = Math.min(y1, lerp(p.y1, p.y0, EASE(k)));
      if (k >= 1) return [0, 0, 0, 0];
    }
    if (p.kind !== 'wall' && p.kind !== 'sill' && y1 <= y0 + 1e-4) return [0, 0, 0, 0];
    /* on the plan a wall is a thin slab, so its top reads as a band */
    if (p.kind === 'wall' || p.kind === 'sill') y1 = Math.max(y1, 0.02);
    return [1, f4(y0), f4(Math.max(y0, y1)), rv[i]];
  });
  /* the furniture: falls from 1.8m, lands with a squash, settles */
  const fu = FURN.map((g, i) => {
    const a = FURN_AT[i];
    if (t < a) return [0, 0, 0];
    const u = span(t, a, a + DROP_D * 0.55);
    const dy = 1.8 * (1 - u * u);
    const sq = 0.16 * Math.sin(Math.PI * span(t, a + DROP_D * 0.55, a + DROP_D)) * (1 - 0.4 * span(t, a + DROP_D * 0.55, a + DROP_D));
    return [1, f4(dy), f4(sq)];
  });
  /* the windows: dark glass once cut, warm when the room's light is on */
  const win = OPEN.map((o, oi) => {
    if (o.k !== 'win') return [0, 0];
    const cutDone = t >= OPEN_AT[oi] + CUT_D;
    const lit = t < ROOM_LIT[o.room] ? 0 : smooth(span(t, ROOM_LIT[o.room], ROOM_LIT[o.room] + 0.12));
    return [cutDone ? 1 : 0, f4(lit * (1 + 0.5 * hitPulse(t - ROOM_LIT[o.room], 2 / 60, 6 / 60)))];
  });
  /* the hook's comet round the outside, and the pen's comet on the redraw */
  let cm = [], cmo = 0;
  if (t < REDRAW) {
    const head = (t + 0.45) / 3.4;
    if (head < 1.12) { cm = comet(t, OUTER, OUTER_LEN, head, 0.07); cmo = 1 - smooth(span(head, 0.98, 1.12)); }
  } else if (pen < 1 || t < REDRAW + REDRAW_D + 0.15) {
    cm = comet(t, PEN, PEN_LEN, Math.min(1, pen), 0.045);
    cmo = 1 - smooth(span(t, REDRAW + REDRAW_D, REDRAW + REDRAW_D + 0.15));
  }
  /* the flash on AI: the edges pulse out from the door */
  const flash = t < FLASH ? 0 : 1 - smooth(span(t, FLASH + 0.1, FLASH + 0.6));
  const flashR = f3(CURVE.out(span(t, FLASH, FLASH + 0.6)) * 13);
  /* the ghost: 15% under the redraw, and the plan's echo on the ground on built */
  let gho = 0, ghs = 1;
  if (t >= REDRAW && pen < 1) gho = 0.16;
  else if (t >= REDRAW && t < REDRAW + REDRAW_D + 0.2) gho = 0.16 * (1 - span(t, REDRAW + REDRAW_D, REDRAW + REDRAW_D + 0.2));
  if (t >= BUILT && t < BUILT + 0.4) { const u = span(t, BUILT, BUILT + 0.4); gho = 0.6 * (1 - smooth(u)) * smooth(span(u, 0, 0.12) * 1); ghs = lerp(1.04, 1.32, CURVE.out(u)); }
  const pulse = hitPulse(t - PULSE, 2 / 60, 7 / 60);
  /* the dot grid dims to 15% as the lights come on, evening */
  const dim = 1 - 0.85 * smooth(span(t, LIGHTS, LIGHTS + 0.9));
  return { c: cam3(t), pen: f4(pen), pc, fu, win, cm, cmo: f3(cmo), fl: [f3(flash), flashR], gh: [f3(gho), f4(ghs)], pu: f3(pulse), dim: f3(dim) };
}

/* ---------- the camera on the stage: a slow push on every hold, one punch on built ---------- */
const camera = livingCamera({
  F: { x: 270, y: 460 },
  holds: [[0.3, REDRAW - 0.05], [f3(HERO + HERO_D), CUT]],
  punches: [BUILT],
});

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y, wt = 1) => ({ x, y, w: wt });
const lookAt = (L, t, here) => {
  let i = 0;
  while (i + 1 < L.length && t >= L[i + 1].at) i++;
  const f = o => (o.w === 0 ? { x: here.x, y: here.y, w: 0 } : o);
  const cur = f(L[i].to), prev = i ? f(L[i - 1].to) : cur;
  const k = smooth(span(t, L[i].at, L[i].at + (L[i].d ?? 0.18)));
  return { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
};
const blink = (t, list) => {
  let lid = 0;
  for (const a of list) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  return lid;
};
const nod = (t, a) => 5 * Math.sin(Math.PI * span(t, a, a + 0.22)) + 4 * Math.sin(Math.PI * span(t, a + 0.24, a + 0.46));
const HOUSE_AT = AT(270, 450, 0.8);
const LOOKS = [
  { at: 0, to: HOUSE_AT },
  { at: f3(L1.at + 0.9), to: LENS, d: 0.25 },
  { at: f3(FLASH - 0.1), to: HOUSE_AT },
  { at: HOP, to: AT(LANDAT.x - 80, LANDAT.y - 40, 0.6), d: 0.2 },
  { at: TURN, to: LENS, d: TURN_D },
];
const BLINKS = [2.6, f3(L2.at + 1.4), f3(RISE_END + 0.3), f3(L5.at - 0.3), f3(BUILT + 0.5), f3(HERO + 0.9)];
const HAPPY = [NEW, f3(RISE + 0.25), f3(LIGHTS + 0.5), NOD];
function face(t) {
  const here = { x: MAS.cx, y: MAS.cy };
  const look = lookAt(LOOKS, t, here);
  let lid = Math.max(0.04, blink(t, BLINKS));
  /* the squint to the lens at the very end */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, TURN + 0.08, TURN + TURN_D)));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.07, 0.26, 0.12));
  /* the hop to the house, a squash going up and on the landing */
  const u = span(t, HOP, HOP + HOP_D), k = CURVE56.glide(u);
  let dx = lerp(0, LANDAT.x - MAS.cx, k), dy = lerp(0, LANDAT.y - MAS.cy, k) - 70 * Math.sin(Math.PI * u);
  const sq = -0.07 * Math.sin(Math.PI * span(t, HOP - 0.06, HOP + 0.08)) + 0.1 * Math.sin(Math.PI * span(t, HOP + HOP_D - 0.02, HOP + HOP_D + 0.16));
  dy += nod(t, NOD) + 2.2 * Math.sin(2 * Math.PI * t / 2.3) * (1 - bump(t, HOP - 0.1, 0.1, HOP_D, 0.2));
  const rot = 6 * Math.sin(Math.PI * u);
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(dx), dy: f2(dy), rot: f3(rot), sq: f3(sq), s: MAS.scale };
}

/* ---------- a frame of the story ---------- */
const ws = (S, id, wv, k = 1) => { const st = wordStyle(wv); S.push([id, 'opacity', f3(st.opacity * k)], [id, 'transform', st.transform], [id, 'filter', st.filter]); };
const HIDDEN = { o: 0, s: 1, y: 0, blur: 0 };
function frame(t) {
  const S = [], X = [];
  /* the title, on at frame 0, a punch on new, and it leaves up with the tilt */
  const tu = CURVE.exit(span(t, TILT - 0.05, TILT + 0.3));
  S.push(['ttl', 'opacity', f3(1 - tu)], ['ttl', 'transform', 'translateY(' + f2(-46 * tu) + 'px) scale(' + f4(1 + 0.05 * hitPulse(t - NEW, 2 / 60, 8 / 60)) + ')'],
    ['ttl', 'filter', tu > 0.05 ? 'blur(' + f2(10 * tu) + 'px)' : 'none']);
  /* the labels: pop in one after another, count up, fade out in the tilt */
  const lo = 1 - smooth(span(t, TILT, TILT + 0.45));
  ROOMS.forEach((r, i) => {
    const a = LAB[i];
    const p = t < a ? 0 : SPRING(span(t, a, a + 0.36));
    const o = (t < a ? 0 : smooth(span(t, a, a + 0.08))) * lo;
    S.push(['lab' + i, 'opacity', f3(o)], ['lab' + i, '--s', String(f4(lerp(0.6, 1, p) * lerp(0.82, 1, lo)))]);
    if (o > 0) { const q = project(cam3(t), [r.at.x, 0, r.at.z]); S.push(['lab' + i, 'transform', 'translate(' + f2(q.x) + 'px,' + f2(q.y) + 'px)']); }
    const n = Math.round(r.m2 * EASE(span(t, a + 0.06, a + 0.06 + COUNT_D)));
    X.push(['labn' + i, n + ' m²']);
  });
  /* the end line, small, under the house */
  ws(S, 'pv', t < PV ? HIDDEN : wordIn(t, PV, 'rise'));
  return { S, X, g: scene(t) };
}

/* ---------- the drawing ---------- */
const GREEN_GLOW = 'drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 6px rgba(53,255,106,.45))';
const css = `
#g3{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block}
#ttl{position:absolute;left:0;right:0;top:${TTL_Y}px;height:0;will-change:transform,opacity,filter;transform-origin:50% 40px}
#ttl b{display:table;margin:0 auto;font:400 40px/1.25 var(--display);color:#f7f9f8;letter-spacing:.04em;white-space:nowrap;
  text-shadow:0 0 8px rgba(255,255,255,.35),0 0 24px rgba(255,255,255,.14)}
.lab{position:absolute;left:0;top:0;width:0;height:0;opacity:0;will-change:transform,opacity}
.lab div{position:absolute;left:0;top:0;transform:translate(-50%,-50%) scale(var(--s,1));display:flex;flex-direction:column;align-items:center;gap:5px}
.lab b{display:block;font:500 14.5px/1 var(--mono);color:#eef2f0;letter-spacing:.04em;white-space:nowrap}
.lab i{display:block;font:500 21px/1 var(--mono);color:var(--accent);font-style:normal;letter-spacing:.04em;white-space:nowrap;font-variant-numeric:tabular-nums;filter:${GREEN_GLOW}}
#pv{position:absolute;left:0;right:0;top:${PV_Y}px;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
#pv b{display:block;font:400 17px/1 var(--display);color:#f7f9f8;letter-spacing:.12em;white-space:nowrap;transform:translateY(-50%);
  text-shadow:0 0 8px rgba(255,255,255,.3)}
`;
const markup = `
<img id="g3" alt="">
<div id="ttl"><b>${W_T1}</b><b>${W_T2}</b></div>
${ROOMS.map((r, i) => `<div class="lab" id="lab${i}"><div><b>${r.name}</b><i id="labn${i}">0 m²</i></div></div>`).join('')}
<div id="pv"><b>${W_END}</b></div>`;

/* everything the page needs to build the house once */
const DATA = {
  vw: VW, vh: VH, dsf: DSF, H, SILL, HEAD,
  P: P.map(p => ({ x0: f3(p.x0), x1: f3(p.x1), z0: f3(p.z0), z1: f3(p.z1), kind: p.kind, ax: p.ax, dir: p.dir, a: f3(p.a), b: f3(p.b) })),
  OPEN: OPEN.map(o => ({ k: o.k, ax: o.ax, kk: o.kk, a: f3(o.a), b: f3(o.b), th: o.th, wi: o.wi })),
  FURN: FURN.map(g => ({ bold: !!g.bold, boxes: g.boxes, lines: g.lines, c: g.c })),
  MARKS,
  ROOMS: ROOMS.map(r => r.at),
};

/* the house, built once in the gl layer's own browser, lib/gl-layer.mjs */
function glBuild() {
  const D = window.__GLD, T = window.THREE, TL = window.THREE_LINES;
  const cv = document.getElementById('gl');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, stencil: true });
  R.setPixelRatio(D.dsf); R.setSize(D.vw, D.vh, false); R.setClearColor(0x000000, 0);
  R.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(12, D.vw / D.vh, 1, 200);
  const RES = new T.Vector2(D.vw * D.dsf, D.vh * D.dsf);

  /* the faces: a unit box from 0 to 1, near black sides, a lighter top so a
     wall reads as a band from above. pushed back so the lines on them win */
  const unit = new T.BoxGeometry(1, 1, 1); unit.translate(0.5, 0.5, 0.5);
  const cols = [], nrm = unit.attributes.normal;
  for (let i = 0; i < nrm.count; i++) { const top = nrm.getY(i) > 0.5; const c = new T.Color(top ? 0x1b2028 : 0x0a0c10); cols.push(c.r, c.g, c.b); }
  unit.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  const faceMat = new T.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 });
  const boxMesh = () => { const m = new T.Mesh(unit, faceMat); m.matrixAutoUpdate = true; scene.add(m); return m; };
  const wallMesh = D.P.map(boxMesh);
  const furnMesh = D.FURN.map(g => g.boxes.map(boxMesh));

  /* the windows' glass, a quad in the wall's middle plane, and a soft halo */
  const halo = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx;
  })();
  const DARK = new T.Color(0x0d1015), WARM = new T.Color(0xffb444);
  const panes = D.OPEN.map(o => {
    if (o.k !== 'win') return null;
    const w = Math.abs(o.b - o.a), h = D.HEAD - D.SILL, c = (o.a + o.b) / 2, my = (D.HEAD + D.SILL) / 2;
    const glass = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: DARK.clone(), side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 }));
    const glow = new T.Mesh(new T.PlaneGeometry(w * 3.4, h * 3.4), new T.MeshBasicMaterial({ map: halo, color: WARM, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
    for (const m of [glass, glow]) {
      if (o.ax === 'x') m.position.set(c, my, o.kk); else { m.position.set(o.kk, my, c); m.rotation.y = Math.PI / 2; }
      m.visible = false; scene.add(m);
    }
    glow.renderOrder = 5;
    /* the spill: a soft warm patch on the ground outside, out from the wall */
    const n = [[0, 1], [1, 0], [0, -1], [-1, 0]][o.wi];
    const spill = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: halo, color: WARM, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    spill.rotation.x = -Math.PI / 2;
    const along = w * 2.4, out = 2.6, mid = o.ax === 'x' ? [c, o.kk + n[1] * (o.th / 2 + out * 0.42)] : [o.kk + n[0] * (o.th / 2 + out * 0.42), c];
    spill.scale.set(o.ax === 'x' ? along : out, o.ax === 'x' ? out : along, 1);
    spill.position.set(mid[0], 0.004, mid[1]); spill.visible = false; spill.renderOrder = 4; scene.add(spill);
    return { glass, glow, spill };
  });

  /* the dot grid, on the ground, round dots that thin out away from the house */
  const pts = [], alp = [];
  for (let i = -40; i <= 40; i++) for (let j = -40; j <= 40; j++) {
    const x = i * 0.5, z = j * 0.5, r = Math.hypot(x, z * 1.15);
    const a = 1 - Math.min(1, Math.max(0, (r - 8) / 11));
    if (a <= 0) continue;
    pts.push(x, -0.01, z); alp.push(a);
  }
  const dg = new T.BufferGeometry();
  dg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  dg.setAttribute('a', new T.Float32BufferAttribute(alp, 1));
  const dotMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { dim: { value: 1 }, size: { value: 0.055 }, hpx: { value: D.vh * D.dsf / 2 } },
    vertexShader: 'attribute float a; uniform float size; uniform float hpx; varying float vA;'
      + 'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;'
      + ' gl_PointSize = max(2.0, size * projectionMatrix[1][1] * hpx / -mv.z); vA = a; }',
    fragmentShader: 'uniform float dim; varying float vA;'
      + 'void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;'
      + ' float k = vA * dim * 0.5 * (1.0 - smoothstep(0.3, 0.5, d)); gl_FragColor = vec4(vec3(0.86, 0.9, 0.88) * k, k); }',
  });
  dotMat.premultipliedAlpha = true;
  const dots = new T.Points(dg, dotMat); dots.renderOrder = -1; scene.add(dots);

  /* the lines: a layer is one LineSegments2 rebuilt each frame. the glow is the
     same lines twice more, wide and faint, added on */
  let ref = 0;
  const layer = (width, color, opacity, add, order) => {
    const mat = new TL.LineMaterial({ color, linewidth: width * D.dsf, transparent: true, opacity, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending });
    mat.resolution.copy(RES);
    /* a see through layer lights each pixel once: where two of its segments
       meet, the second is stencilled out, so a joint never beads */
    if (opacity < 1 || add) {
      mat.stencilWrite = true; mat.stencilRef = ++ref; mat.stencilFunc = T.NotEqualStencilFunc;
      mat.stencilZPass = T.ReplaceStencilOp; mat.stencilFail = T.KeepStencilOp; mat.stencilZFail = T.KeepStencilOp;
    }
    return { mat, obj: null, order, base: opacity };
  };
  const put = (L, arr) => {
    if (L.obj) { scene.remove(L.obj); L.obj.geometry.dispose(); L.obj = null; }
    if (!arr.length) return;
    const g = new TL.LineSegmentsGeometry(); g.setPositions(arr);
    L.obj = new TL.LineSegments2(g, L.mat); L.obj.renderOrder = L.order; scene.add(L.obj);
  };
  const LY = {
    core: layer(2.1, 0xf2f6f4, 1, false, 3), coreG1: layer(5, 0xffffff, 0.16, true, 2), coreG2: layer(12, 0xffffff, 0.05, true, 1),
    bold: layer(3.2, 0xffffff, 1, false, 3), boldG1: layer(7, 0xffffff, 0.18, true, 2),
    faint: layer(1.3, 0xd5dbd8, 0.55, false, 3),
    ghost: layer(1.6, 0xd5dbd8, 0.16, false, 3),
    comet: layer(3.2, 0xffffff, 1, false, 4), cometG: layer(10, 0xffffff, 0.3, true, 4),
    flash: layer(4, 0xffffff, 0.5, true, 4),
  };

  /* a box's twelve edges, or on the plan, the long sides drawn to `rv` along
     the piece and the end caps once the pen reaches them */
  const edges = (b, out, rv = 1, piece = null) => {
    const { x0, x1, z0, z1, y0, y1 } = b;
    if (rv < 1 && piece) {
      if (rv <= 0) return;
      const s = piece.dir, A = piece.a, B = A + s * rv * Math.abs(piece.b - piece.a);
      const lo = Math.min(A, B), hi = Math.max(A, B);
      if (piece.ax === 'x') { out.push(lo, y1, z0, hi, y1, z0, lo, y1, z1, hi, y1, z1, A, y1, z0, A, y1, z1); }
      else { out.push(x0, y1, lo, x0, y1, hi, x1, y1, lo, x1, y1, hi, x0, y1, A, x1, y1, A); }
      return;
    }
    const ys = y1 - y0 > 0.05 ? [y0, y1] : [y1];
    for (const y of ys) out.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
    if (ys.length > 1) for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) out.push(x, y0, z, x, y1, z);
  };
  const setBox = (m, b) => {
    const h = b.y1 - b.y0;
    if (h < 1e-4) { m.visible = false; return; }
    m.visible = true; m.position.set(b.x0, b.y0, b.z0); m.scale.set(b.x1 - b.x0, h, b.z1 - b.z0);
  };

  window.__gl = {
    render(G) {
      cam.position.set(...G.c.pos); cam.up.set(...G.c.up); cam.lookAt(...G.c.tgt);
      cam.fov = G.c.fov; cam.near = G.c.near; cam.far = G.c.far; cam.updateProjectionMatrix();
      const core = [], bold = [], faint = [], ghost = [], flash = [];
      /* the walls */
      D.P.forEach((p, i) => {
        const [on, y0, y1, rv] = G.pc[i];
        if (!on) { wallMesh[i].visible = false; return; }
        const b = { x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, y0, y1 };
        setBox(wallMesh[i], rv < 1 ? { ...b, y1: y0 } : b);
        edges(b, core, rv, p);
        if (p.kind === 'wall' || p.kind === 'sill') edges({ ...b, y0: 0, y1: 0 }, ghost);
        if (G.fl[0] > 0 && (p.kind === 'wall' || p.kind === 'sill')) {
          const cx = (p.x0 + p.x1) / 2 - 1.75, cz = (p.z0 + p.z1) / 2 - 4, d = Math.hypot(cx, cz);
          if (Math.abs(d - G.fl[1]) < 1.6) edges(b, flash);
        }
      });
      /* the plan's marks, on with their wall once the pen has passed */
      const penDone = G.pen >= 1;
      if (penDone) for (const m of D.MARKS) faint.push(...m.seg);
      /* the furniture */
      D.FURN.forEach((g, i) => {
        const [on, dy, sq] = G.fu[i];
        const out = g.bold ? bold : core;
        const tf = (x, y, z) => [g.c.x + (x - g.c.x) * (1 + sq * 0.5), y * (1 - sq) + dy, g.c.z + (z - g.c.z) * (1 + sq * 0.5)];
        g.boxes.forEach((b, k) => {
          if (!on) { furnMesh[i][k].visible = false; return; }
          const [x0, y0, z0] = tf(b.x0, b.y0, b.z0), [x1, y1, z1] = tf(b.x1, b.y1, b.z1);
          const bb = { x0, x1, y0, y1, z0, z1 };
          setBox(furnMesh[i][k], bb); edges(bb, out);
        });
        if (on) for (const s of g.lines) { const a = tf(s[0], s[1], s[2]), b = tf(s[3], s[4], s[5]); out.push(...a, ...b); }
      });
      /* the windows */
      D.OPEN.forEach((o, i) => {
        const p = panes[i]; if (!p) return;
        const [cut, lit] = G.win[i];
        p.glass.visible = !!cut; p.glow.visible = !!cut && lit > 0.001;
        p.glass.material.color.copy(DARK).lerp(WARM, Math.min(1, lit));
        p.glow.material.opacity = 0.7 * lit;
        p.spill.visible = p.glow.visible; p.spill.material.opacity = 0.55 * lit;
        if (cut) {
          /* the frame and one mullion */
          const c = (o.a + o.b) / 2, f = o.ax === 'x' ? (u, y) => [u, y, o.kk] : (u, y) => [o.kk, y, u];
          core.push(...f(c, D.SILL), ...f(c, D.HEAD));
        }
      });
      put(LY.core, core); put(LY.coreG1, core); put(LY.coreG2, core);
      put(LY.bold, bold); put(LY.boldG1, bold);
      put(LY.faint, faint);
      LY.coreG1.mat.opacity = LY.coreG1.base * (1 + 2.2 * G.pu); LY.boldG1.mat.opacity = LY.boldG1.base * (1 + 2.2 * G.pu);
      LY.coreG2.mat.opacity = LY.coreG2.base * (1 + 3 * G.pu);
      /* the ghost plan, scaled about the house's middle */
      if (G.gh[0] > 0) {
        const s = G.gh[1];
        put(LY.ghost, ghost.map((v, k) => (k % 3 === 1 ? 0.01 : v * s)));
        LY.ghost.mat.opacity = G.gh[0];
      } else put(LY.ghost, []);
      put(LY.comet, G.cm); put(LY.cometG, G.cm);
      LY.comet.mat.opacity = G.cmo; LY.cometG.mat.opacity = 0.35 * G.cmo;
      put(LY.flash, flash); LY.flash.mat.opacity = 0.5 * G.fl[0];
      dotMat.uniforms.dim.value = G.dim;
      R.render(scene, cam);
    },
  };
}

/* the stage: the gl layer is an image under everything else */
function page() {
  const $ = id => document.getElementById(id);
  const img = $('g3');
  let last = null;
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.S) { const el = $(id); if (k.startsWith('--')) el.style.setProperty(k, v); else el.style[k] = v; }
      for (const [id, v] of o.X) $(id).textContent = v;
      if (o.pre !== last) { last = o.pre; img.src = o.pre; }
    },
    ready() { return img.decode(); },
  };
}

/* ---------- the sound ---------- */
const TILT_PEAK = peakAt(TILT, TILT + TILT_D, CURVE.cam);
const HERO_PEAK = peakAt(HERO, HERO + HERO_D, CURVE56.pull);
const CUES = [
  { t: NEW + 0.02, kind: 'pop', from: 'a happy arc on new' },
  { t: FLASH + 0.02, kind: 'tick', from: 'the plan flashes on AI' },
  { t: REDRAW + 0.02, kind: 'sweep', opts: { len: REDRAW_D }, from: 'the pen redraws the plan' },
  ...LAB.map((t, i) => ({ t: t + 0.01, kind: 'tick', from: 'label ' + ROOMS[i].name })),
  { t: LAB_LAST, kind: 'tock', opts: { f: 1500 }, from: 'the last area lands' },
  { t: TILT_PEAK, kind: 'whoosh', opts: { len: 0.5 }, from: 'the tilt into 3D' },
  { t: RISE + 0.02, kind: 'whooshUp', from: 'the walls rise' },
  { t: RISE_END - 0.1, kind: 'land', from: 'the last wall settles' },
  { t: PULSE + 0.02, kind: 'click', from: 'the walls pulse' },
  ...OPEN_ORDER.filter((_, n) => n % 3 === 0).map(oi => ({ t: OPEN_AT[oi] + 0.03, kind: 'tap', from: 'a gap cuts' })),
  ...FURN.map((g, i) => (g.bold ? { t: FURN_AT[i] + DROP_D * 0.55, kind: 'land', opts: { len: 0.12 }, from: 'furniture lands' } : null)).filter(Boolean),
  ...ROOM_LIT.map((t, i) => ({ t: t + 0.01, kind: 'toggle', from: 'light on, ' + ROOMS[i].name })),
  { t: ROOM_LIT[ROOM_LIT.length - 1] + 0.12, kind: 'chime', from: 'the house is lit' },
  { t: BUILT + 0.02, kind: 'tock', opts: { f: 1200 }, from: 'the ghost plan on built' },
  { t: HERO_PEAK, kind: 'whoosh', opts: { len: 0.5 }, from: 'the pull up to the hero view' },
  { t: PV + 0.02, kind: 'pop', from: 'PLAN TO PROMO VIDEO' },
  { t: HOP + 0.02, kind: 'boing', from: 'he hops' },
  { t: HOP + HOP_D, kind: 'land', from: 'he lands' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: f4(c.t) }));
for (const c of CUES) if (c.t > L4.end && c.t < L5.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [NEW, FLASH, REDRAW, ...LAB, TILT, RISE, PULSE, CUTS, DROP, LIGHTS, BUILT, HERO, PV, HOP, NOD, TURN];
const STILLS = [0, 0.5, NEW + 0.15, FLASH + 0.25, REDRAW + 0.5, REDRAW + 1.2, LAB_LAST + 0.1, TILT + 0.5, TILT + TILT_D, RISE + 0.35, RISE_END + 0.05,
  CUTS + 0.5, DROP + 0.5, L4.end + 0.3, LIGHTS + 0.45, LIGHTS + 1.2, BUILT + 0.15, HERO + 0.7, PV + 0.4, HOP + 0.25, NOD + 0.1, TURN + TURN_D + 0.1, CUT + 0.6].map(f3);

const GL = await glLayer({ w: VW, h: VH, dsf: DSF, script: threeScript() + linesScript(), data: DATA, build: glBuild });
console.log('  gl layer on ' + GL.renderer);
/* `GLTEST=1`: the gl layer alone, a hash per still, to prove it repeats */
if (process.env.GLTEST) {
  const { createHash } = await import('node:crypto');
  for (const t of STILLS) console.log('gl ' + t.toFixed(3) + ' ' + createHash('sha1').update(await GL.render(scene(t))).digest('hex').slice(0, 16));
  await GL.close(); process.exit(0);
}
const res = await runEpisode({
  post: 58, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: false,
  maxGap: 1.0,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { popDeep: -15, bass: -20, tock: -20, land: -16, toggle: -18, tap: -20, chime: -20, whoosh: -26, whooshUp: -20, boing: -16, sweep: -32, tick: -30, click: -24, pop: -26 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, page, frame, face, camera,
    prepare: (t, g) => GL.render(g.g),
    ready: true,
    data: DATA,
    sleep: [],
    beats: BEATS,
    checks: ['#ttl b', '#pv b'],
    hook: ['#ttl', '#g3'],
    copy: [W_T1, W_T2, W_END, ...ROOMS.map(r => r.name), ...ROOMS.map(r => r.m2 + ' m²')],
    verify: [
      { at: f3(LAB_LAST + 0.1), sel: '#lab3', test: r => (r && r.o > 0.9 ? null : 'bedroom 2 label is not on: ' + JSON.stringify(r)) },
      /* the end line clears him, in his corner before the hop and beside the house after */
      { at: f3(HOP - 0.05), sel: '#pv b', test: r => (r && r.b < MAS.cy - 0.4 * MAS.size * MAS.scale ? null : 'the end line runs into him in his corner: ' + JSON.stringify(r)) },
      { at: f3(NOD + 0.1), sel: '#pv b', test: r => (r && r.t > LANDAT.y + 0.4 * MAS.size * MAS.scale ? null : 'the end line runs into him by the house: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [NEW, 'happy on new'], [FLASH, 'the flash on AI'], [L2.at, 'line 2'], [REDRAW, 'the redraw'], ...LAB.map((t, i) => [t, ROOMS[i].name]),
      [L3.at, 'line 3'], [TILT, 'the tilt'], [RISE, 'the walls rise'], [RISE_END, 'the walls are up'], [L4.at, 'line 4'], [PULSE, 'walls pulse'], [CUTS, 'the gaps cut'], [DROP, 'the furniture'],
      [L4.end, 'the silence'], [L5.at, 'line 5'], [LIGHTS, 'lights'], [BUILT, 'the ghost plan'], [L6.at, 'line 6'], [HERO, 'the hero pull'], [PV, 'PLAN TO PROMO VIDEO'], [HOP, 'he hops'], [NOD, 'the nod'], [TURN, 'the turn to the lens'], [CUT, 'the cut']],
  },
});
await GL.close();
void res;
