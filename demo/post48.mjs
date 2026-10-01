/* the boring tek — post48. the delivery.

   dark, 1080x1920, no voice, 11.59s. the mascot is the hero. the rig is
   lib/aiafter.mjs with the series off, in its sound only mode: the effects
   are the whole track, mastered to -14 LUFS. the effects come from
   lib/sfx.mjs, and five that would sound fake in code come from elevenlabs
   through lib/elevensfx.mjs. when elevenlabs will not serve them, kit stand
   ins built here take their place and the run says so.

     0.00  a switch, off, ai agent under it. its knob is him, eyes shut, a plain disc
     0.30  click, he slides right as the knob, the track goes green
     0.46  his eyes open on the knob
     0.70  the knob jumps up and out as him, the track stays empty, lands on it 1.12
     1.25  new job, the house bubble
     1.90  an envelope arcs in, folds itself into a paper plane 2.30
     2.95  he hops on, lands 3.30
     3.45  takeoff, the world scrolls, wind lines
     4.30  a popup slams in front of him, he dives under it 4.55
     5.40  a wave of grey spam rolls up, he pulls up over it 5.80
     6.95  a wall of grey blocks, he jumps off 7.30, over it, the plane
           through the slot under it, back on the plane 7.95
     8.30  the inbox slides in, he hops onto its rim 8.70, the plane flies in
     9.00  the green tick, delivered
     9.40  his eyes go to the lens, a wink 9.55
    10.40  the glitch, the end card 10.49 for 1.1s

   eyes calm, happy or squint, never wide. no hands. every landing squashes.
   on screen copy has no dashes, apostrophes, quotes or colons.

     node post48.mjs --stills             one still per beat, no render
     DEMO_FPS=12 node post48.mjs          the preview, with sound
     node post48.mjs                      60fps
     node post48.mjs --kit                the five elevenlabs sounds from the kit stand ins
     node post48.mjs --bus                the loudest moments of the bus before the master
*/

import {
  runEpisode, span, lerp, smooth, bump, clamp, EASE, SPRING, IO, MARGIN, FPS,
} from './lib/aiafter.mjs';
import { VOICES, GAINS, SR, decode } from './lib/sfx.mjs';
import { elevenSfx } from './lib/elevensfx.mjs';
import { HEAD, GRID, planMascot, mascotFrame } from './lib/mascot.mjs';
import ffmpeg from 'ffmpeg-static';

/* ---------- him ---------- */
const SCALE = 0.8;
const MAS = { cx: 0, cy: 0, size: 118, scale: SCALE };
const R = MAS.size * SCALE * 30 / 64;                 /* his plate's radius as drawn, 44.3 */

/* ---------- the switch, the middle of frame 0 ----------
   sized round him, post45's: he is its knob, his plate and a 6px rim */
const SW = { cx: 270, cy: 520, pad: 6 };
SW.h = +(2 * R + 2 * SW.pad).toFixed(2); SW.w = +(SW.h * 1.66).toFixed(2);
SW.top = SW.cy - SW.h / 2;
const SW_X = [SW.cx - SW.w / 2 + SW.pad + R, SW.cx + SW.w / 2 - SW.pad - R];
/* his plate, not his card, is the knob: the plate sits a little off the card's middle */
const PLATE_OFF = { x: ((HEAD.plate.x + HEAD.plate.s / 2) / GRID - 0.5) * MAS.size * SCALE, y: ((HEAD.plate.y + HEAD.plate.s / 2) / GRID - 0.5) * MAS.size * SCALE };
MAS.cx = +(SW_X[0] - PLATE_OFF.x).toFixed(3); MAS.cy = +(SW.cy - PLATE_OFF.y).toFixed(3);
const LBL_TOP = SW.cy + SW.h / 2 + 14;
const ON_SW = { x: SW.cx, y: SW.top - R };

/* ---------- the paper: an envelope that folds into a plane ----------
   two polygons, the same point count in every key, so a fold is a morph. local
   css px round the plane's middle; the plane points right. */
const K = [
  { flap: [[-60, -40], [60, -40], [0, 6]], body: [[-60, -40], [60, -40], [60, 40], [-60, 40]] },
  { flap: [[-60, -40], [60, -40], [0, -86]], body: [[-60, -40], [60, -40], [60, 40], [-60, 40]] },
  { flap: [[-70, -30], [-70, 10], [80, -6]], body: [[80, -6], [80, -6], [-70, 26], [-70, 10]] },
  { flap: [[-85, -28], [-62, 4], [85, 0]], body: [[85, 0], [85, 0], [-80, 22], [-62, 4]] },
];
const FOLD = [[2.30, 2.48], [2.50, 2.68], [2.70, 2.90]];
const STAND = { x: -10, y: -15.6 };                   /* where he stands on the wing, local */
const PL_HALF = { l: 85, r: 85, t: 28, b: 22 };

/* ---------- the timeline ---------- */
const CLICK = 0.30;
const SLIDE = { a: 0.30, b: 0.42 };
const EYES_OPEN = { a: 0.46, b: 0.58 };
const J_POP = { t0: 0.70, t1: 1.12, h: 150, ant: 0.10 };
const BUB_AT = 1.25, BUB_OUT = 1.90;
const ENV = { a: 1.90, b: 2.25, from: { x: -90, y: 330 }, at: { x: 150, y: 640 }, h: 120 };
const J_ON = { t0: 2.95, t1: 3.30, h: 60, ant: 0.12 };
const TAKEOFF = { a: 3.45, b: 3.95 };
const CRUISE = { x: 200, y: 500, rot: -6 };
const SLAM = 4.30;
const POP = { cx: 350, cy: 288, w: 260, h: 190, go: 4.62 };
const DODGE = { a: 4.55, down: 0.22, hold: 0.45, up: 0.25, dy: 140 };
const WAVE = { a: 5.40, rise: 0.75, crestAt: 6.20, cy: 445 };
const CLIMB = { a: 5.62, up: 0.28, hold: 0.85, down: 0.30, dy: 140 };
/* per block, top to slab: the slab and the lowest block first, the top one last */
const WALL = { at: [7.13, 7.04, 6.95, 6.95], x0: 440, w: 72, pass: 7.625 };
const J_WALL = { t0: 7.30, t1: 7.95, h: 230, ant: 0.12 };
const SLOT = { a: 7.26, down: 0.12, hold: 0.47, up: 0.10, dy: 102 };
const TRAY = { a: 8.30, b: 8.55, cx: 270, w: 210, back: 500, front: 540, fh: 84 };
const J_OFF = { t0: 8.45, t1: 8.70, h: 50 };
const RIM = { x: TRAY.cx, y: TRAY.front - R };
const INTO = { a: 8.55, b: 8.80, x: TRAY.cx, y: TRAY.front + 40, s: 0.5 };
const TICK = 9.00, LENS_AT = 9.40;
const WINK = { at: 9.55, close: 0.06, hold: 0.22, open: 0.10 };
const CUT = 10.49, HOLD = 1.1;
const SPEED = 500;
const DEG = Math.PI / 180;

/* the wall: three blocks over a slot the plane fits through, a slab under it */
const WB = [
  { t: 360, h: 64 }, { t: 425, h: 64 }, { t: 490, h: 64 },
  { t: 650, h: 64 },
];
const WALL_TOP = WB[0].t, SLOT_T = WB[2].t + WB[2].h, SLOT_B = WB[3].t;

/* the spam wave, cards round a crest, relative to the group */
const CARDS = [
  { x: 0, y: 120, s: 'spam' }, { x: 120, y: 60, s: 'act now' }, { x: 230, y: 0, s: 'urgent' },
  { x: 345, y: 52, s: 'free money' }, { x: 450, y: 112, s: 'spam' },
  { x: 60, y: 190, s: 'urgent' }, { x: 185, y: 125, s: 'spam' }, { x: 300, y: 122, s: 'act now' }, { x: 410, y: 180, s: 'free money' },
];
const CARD_W = 172, CARD_H = 54;

/* ---------- the world's scroll, integrated once ---------- */
const speedAt = t => SPEED * smooth(span(t, TAKEOFF.a, TAKEOFF.a + 0.40)) * (1 - smooth(span(t, 8.25, 8.55)));
const SDT = 1 / 480, STAB = [0];
for (let i = 1; i <= Math.ceil(12 / SDT); i++) STAB.push(STAB[i - 1] + speedAt((i - 0.5) * SDT) * SDT);
const S = t => { const k = clamp(t / SDT, 0, STAB.length - 1), i = Math.floor(k); return i + 1 < STAB.length ? lerp(STAB[i], STAB[i + 1], k - i) : STAB[i]; };

/* ---------- the plane ---------- */
function planeY(t) {
  let y = CRUISE.y + 4 * Math.sin(2 * Math.PI * (t - TAKEOFF.b) / 0.9) * smooth(span(t, TAKEOFF.b, TAKEOFF.b + 0.3)) * (1 - smooth(span(t, 8.3, 8.5)));
  y += DODGE.dy * bump(t, DODGE.a, DODGE.down, DODGE.hold, DODGE.up);
  y -= CLIMB.dy * bump(t, CLIMB.a, CLIMB.up, CLIMB.hold, CLIMB.down);
  y += SLOT.dy * bump(t, SLOT.a, SLOT.down, SLOT.hold, SLOT.up);
  return y;
}
function plane(t) {
  const fold = FOLD.map(([a, b]) => EASE(span(t, a, b)));
  let x = ENV.at.x, y = ENV.at.y, rot = 0, s = 1, o = 1;
  if (t < ENV.a) o = 0;
  else if (t < ENV.b) {
    const u = span(t, ENV.a, ENV.b);
    x = lerp(ENV.from.x, ENV.at.x, EASE(u)); y = lerp(ENV.from.y, ENV.at.y, EASE(u)) - 4 * ENV.h * u * (1 - u);
    rot = 220 * (1 - EASE(u)); s = lerp(0.7, 1, EASE(u));
  } else if (t < TAKEOFF.a) {
    /* settles with a squash, a punch at each fold, a dip under his landing */
    const dt = t - ENV.b;
    s = 1 + 0.06 * Math.exp(-dt / 0.08) * Math.sin(2 * Math.PI * dt / 0.25);
    for (const [, b] of FOLD) if (t > b) s += 0.07 * Math.exp(-(t - b) / 0.07) * Math.sin(2 * Math.PI * (t - b) / 0.22);
    rot = 3 * Math.sin(2 * Math.PI * span(t, FOLD[0][0], FOLD[2][1]));
    if (t >= J_ON.t1) { const d = t - J_ON.t1; y += 9 * Math.exp(-d / 0.10) * Math.cos(2 * Math.PI * d / 0.32); }
  } else if (t < INTO.a) {
    const u = span(t, TAKEOFF.a, TAKEOFF.b);
    const k = EASE(u);
    x = lerp(ENV.at.x, CRUISE.x, k);
    y = lerp(ENV.at.y, planeY(t), k);
    /* banked by its own climb and dive */
    const vy = (planeY(t + 0.02) - planeY(t - 0.02)) / 0.04;
    rot = u < 1 ? lerp(0, CRUISE.rot, k) - 16 * Math.sin(Math.PI * u) : CRUISE.rot + clamp(vy * 0.045, -18, 18);
    if (t >= J_WALL.t1) { const d = t - J_WALL.t1; y += 10 * Math.exp(-d / 0.10) * Math.cos(2 * Math.PI * d / 0.32); }
  } else {
    const u = EASE(span(t, INTO.a, INTO.b));
    x = lerp(CRUISE.x, INTO.x, u); y = lerp(planeY(INTO.a), INTO.y, u) - 30 * Math.sin(Math.PI * u);
    rot = lerp(CRUISE.rot, 14, u); s = lerp(1, INTO.s, u); o = 1 - smooth(span(t, INTO.b - 0.06, INTO.b));
  }
  return { x, y, rot, s, o, fold };
}
/* where he stands on it, on the stage */
function standOn(p) {
  const c = Math.cos(p.rot * DEG), sn = Math.sin(p.rot * DEG);
  const lx = STAND.x * p.s, ly = STAND.y * p.s;
  return { x: p.x + lx * c - ly * sn, y: p.y + lx * sn + ly * c - R };
}

/* ---------- his jumps, post45's ball ---------- */
function air(j, t, a, b) {
  const u = span(t, j.t0, j.t1), d = j.t1 - j.t0;
  const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 4 * j.h * u * (1 - u);
  const vy = (b.y - a.y) / d - 4 * j.h * (1 - 2 * u) / d, vmax = Math.max(Math.abs((b.y - a.y) / d) + 4 * j.h / d, 1);
  const sq = -0.13 * clamp(Math.abs(vy) / vmax, 0, 1) * smooth(span(t, j.t0, j.t0 + 0.035));
  return { x, y, sq, rot: 8 * Math.sign(b.x - a.x) * Math.sin(Math.PI * u) };
}
const landSq = (t, at, k = 0.2) => (t < at ? 0 : k * Math.exp(-(t - at) / 0.11) * Math.cos(2 * Math.PI * (t - at) / 0.34));
const antSq = (t, j) => (j.ant && t >= j.t0 - j.ant && t < j.t0 ? 0.12 * Math.sin(Math.PI / 2 * EASE(span(t, j.t0 - j.ant, j.t0))) : 0);
const swDip = t => (t < J_POP.t1 ? 0 : 3 * Math.exp(-(t - J_POP.t1) / 0.10) * Math.cos(2 * Math.PI * (t - J_POP.t1) / 0.30)) + (t >= J_ON.t0 - J_ON.ant && t < J_ON.t0 ? 2 * EASE(span(t, J_ON.t0 - J_ON.ant, J_ON.t0)) : 0);

function him(t) {
  const sc = -S(t);                                   /* the switch scrolls off with the world */
  let x, y, sq = 0, rot = 0, plat = true;
  if (t < J_POP.t0) {
    /* the knob: slides across wide with the speed, settles, loads, squashing about his middle */
    const p = span(t, SLIDE.a, SLIDE.b);
    x = lerp(SW_X[0], SW_X[1], EASE(p)) - PLATE_OFF.x; y = MAS.cy; plat = false;
    sq = 0.10 * Math.sin(Math.PI * p) + antSq(t, J_POP);
    if (t > SLIDE.b) { const d = t - SLIDE.b; sq -= 0.07 * Math.exp(-d / 0.10) * Math.sin(2 * Math.PI * d / 0.30); }
  }
  else if (t < J_POP.t1) { ({ x, y, sq, rot } = air(J_POP, t, { x: SW_X[1] - PLATE_OFF.x, y: MAS.cy }, ON_SW)); plat = false; }
  else if (t < J_ON.t0) { x = ON_SW.x; y = ON_SW.y + swDip(t); sq = landSq(t, J_POP.t1) + antSq(t, J_ON); }
  else if (t < J_ON.t1) { ({ x, y, sq, rot } = air(J_ON, t, ON_SW, standOn(plane(J_ON.t1)))); plat = false; }
  else if (t < J_WALL.t0) { ({ x, y } = standOn(plane(t))); sq = landSq(t, J_ON.t1) + antSq(t, J_WALL); rot = plane(t).rot * 0.5; }
  else if (t < J_WALL.t1) { ({ x, y, sq, rot } = air(J_WALL, t, standOn(plane(J_WALL.t0)), standOn(plane(J_WALL.t1)))); plat = false; }
  else if (t < J_OFF.t0) { ({ x, y } = standOn(plane(t))); sq = landSq(t, J_WALL.t1, 0.24); rot = plane(t).rot * 0.5; }
  else if (t < J_OFF.t1) { ({ x, y, sq, rot } = air(J_OFF, t, standOn(plane(J_OFF.t0)), RIM)); plat = false; }
  else { x = RIM.x; y = RIM.y + 3 * Math.exp(-(t - J_OFF.t1) / 0.1) * Math.cos(2 * Math.PI * (t - J_OFF.t1) / 0.3); sq = landSq(t, J_OFF.t1); }
  void sc;
  /* standing, the squash keeps his bottom down */
  if (plat) y += R * sq;
  return { x, y, sq, rot };
}

/* ---------- where he looks, his eyes ---------- */
const LENS = { w: 0 };
const LOOKS = [
  { at: 0, to: LENS },
  { at: 1.18, to: { x: 340, y: 330, w: 0.6 } },
  { at: 1.75, to: { x: 520, y: 200, w: 1 } },
  { at: 2.05, to: { x: ENV.at.x, y: ENV.at.y, w: 1 } },
  { at: 3.30, to: { x: 520, y: 470, w: 1 } },
  { at: 4.32, to: { x: POP.cx, y: POP.cy, w: 1 } },
  { at: 5.00, to: { x: 520, y: 520, w: 0.8 } },
  { at: 5.55, to: { x: 420, y: 640, w: 1 } },
  { at: 6.80, to: { x: 450, y: 420, w: 1 } },
  { at: 7.55, to: { x: 330, y: 520, w: 0.8 } },
  { at: 8.05, to: { x: 480, y: 540, w: 1 } },
  { at: 8.62, to: { x: TRAY.cx, y: 700, w: 0.8 } },
  { at: TICK - 0.05, to: { x: TRAY.cx + TRAY.w / 2, y: TRAY.front, w: 1 } },
  { at: LENS_AT, to: LENS },
];
const BLINKS = [2.62, 4.95, 8.15];
const HAPPY = [1.28, 3.34, 7.98];
const HAPPY_TICK = 9.02;              /* short, clear of the wink's happy eye */
const SQUINT = [[DODGE.a, DODGE.a + 0.55], [CLIMB.a, CLIMB.a + 0.55], [J_WALL.t0 - 0.12, J_WALL.t0 + 0.30]];
/* the rig's idle drift, read off the same plan it draws him from: as the knob
   he is locked in the track, so the drift is taken back out until he jumps */
const IDLE_PLAN = planMascot({ hands: false, seconds: 30, theme: 'dark', size: MAS.size, bias: 0, seed: 44, marks: [{ t: 0.0, state: 'neutral' }] });
const LOCK = t => 1 - smooth(span(t, J_POP.t0, J_POP.t0 + 0.2));
function face(t) {
  const b = him(t);
  const lk = LOCK(t), idle = lk > 0 ? mascotFrame(IDLE_PLAN, t).card : null;
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const lens = { x: b.x, y: b.y, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.18));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  /* shut on the knob, a plain disc, until they open after the click */
  let lid = t < EYES_OPEN.a ? 1 : lerp(1, 0.04, smooth(span(t, EYES_OPEN.a, EYES_OPEN.b)));
  for (const [a, z] of SQUINT) lid = Math.max(lid, 0.04 + 0.42 * Math.min(smooth(span(t, a, a + 0.12)), 1 - smooth(span(t, z - 0.15, z))));
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.10, 0.28, 0.14));
  arc = Math.max(arc, bump(t, HAPPY_TICK, 0.08, 0.16, 0.12));
  const w = WINK, c = w.at + w.close, hd = c + w.hold;
  const wl = 0.84 * (t < w.at ? 0 : t < c ? IO(span(t, w.at, c)) : t < hd ? 1 : 1 - smooth(span(t, hd, hd + w.open)));
  const eyes = t >= w.at - 0.05 && t < hd + w.open + 0.2 ? [{ lid: +Math.max(lid, wl).toFixed(4), arc: 0 }, { lid, arc: +(0.6 * bump(t, w.at - 0.04, 0.10, 0.28, 0.14)).toFixed(4) }] : null;
  /* a soft float on the rim at the end */
  const fl = t > 9.95 ? 3 * Math.sin(2 * Math.PI * (t - 9.95) / 1.4) : 0;
  return {
    lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, ...(eyes ? { eyes } : {}),
    dx: +(b.x - MAS.cx - (idle ? lk * idle.x : 0)).toFixed(3), dy: +(b.y - MAS.cy - fl - (idle ? lk * idle.y : 0)).toFixed(3),
    rot: +(b.rot - (idle ? lk * idle.rot : 0)).toFixed(3), sq: +b.sq.toFixed(4),
    ...(idle ? { s: +(SCALE / lerp(1, idle.sx, lk)).toFixed(5) } : {}),
  };
}

/* ---------- the house bubble: two dots and a pill, off his rim ---------- */
const BUB = { angle: -58, gap: 9, d0: 9, d1: 13, size: 24, padY: 10, stroke: 2 };
BUB.h = BUB.size * 1.25 + 2 * BUB.padY + 2 * BUB.stroke;
{
  const r0 = R + BUB.gap + BUB.d0 / 2, r1 = r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2, r2 = r1 + BUB.d1 / 2 + BUB.gap;
  const ca = Math.cos(BUB.angle * DEG), sa = Math.sin(BUB.angle * DEG);
  Object.assign(BUB, { c0: { x: ON_SW.x + r0 * ca, y: ON_SW.y + r0 * sa }, c1: { x: ON_SW.x + r1 * ca, y: ON_SW.y + r1 * sa }, px: ON_SW.x + r2 * ca + 22, py: ON_SW.y + r2 * sa });
}

/* ---------- a frame ---------- */
const popIn = (t, a, d = 0.34) => ({ s: +lerp(0.4, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.08)).toFixed(3) });
const r2 = v => +v.toFixed(2);
const poly = pts => pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
function shape(fold) {
  const at = name => {
    let pts = K[0][name];
    for (let s = 0; s < 3; s++) pts = pts.map((p, i) => [lerp(p[0], K[s + 1][name][i][0], fold[s]), lerp(p[1], K[s + 1][name][i][1], fold[s])]);
    return pts;
  };
  return { flap: poly(at('flap')), body: poly(at('body')) };
}
function frame(t) {
  const sc = -S(t);
  const p = plane(t);
  const sh = shape(p.fold);
  const done = p.fold[2];
  /* the switch: he is the knob, the track goes green as he slides, it stays empty */
  const knob = EASE(span(t, SLIDE.a, SLIDE.b));
  /* once he is on the plane the switch pops away, out of the takeoff */
  const swGo = EASE(span(t, J_ON.t1 + 0.02, J_ON.t1 + 0.22));
  const sw = { x: r2(sc), on: +knob.toFixed(3), dip: r2(swDip(t)), s: +(1 - swGo).toFixed(4), o: +(1 - smooth(span(t, J_ON.t1 + 0.10, J_ON.t1 + 0.22))).toFixed(3) };
  const lbl = { x: r2(sc), o: +(1 - smooth(span(t, 0.95, 1.20))).toFixed(3) };
  /* the bubble: dot, dot, pill, out in the same order */
  const bd = k => { const a = BUB_AT + 0.07 * k, z = BUB_OUT + 0.05 * k; const i = popIn(t, a, 0.26); return { s: i.s, o: +(i.o * (1 - smooth(span(t, z, z + 0.15)))).toFixed(3) }; };
  const bub = [bd(0), bd(1), bd(2)];
  /* the popup: slams down from big, holds, scrolls off with the world */
  const ps = t < SLAM ? 1.5 : lerp(1.5, 1, EIN(span(t, SLAM, SLAM + 0.10))) * (1 + 0.04 * Math.exp(-(t - SLAM - 0.10) / 0.06) * Math.sin(2 * Math.PI * Math.max(0, t - SLAM - 0.10) / 0.16) * (t > SLAM + 0.10 ? 1 : 0));
  const pop = { o: t < SLAM ? 0 : +smooth(span(t, SLAM, SLAM + 0.05)).toFixed(3), s: r2(ps * 100) / 100, x: r2(t < POP.go ? 0 : -(S(t) - S(POP.go))) };
  /* the wave */
  const gx = -15 - (S(t) - S(WAVE.crestAt)), gy = WAVE.cy + 420 * (1 - EASE(span(t, WAVE.a, WAVE.a + WAVE.rise)));
  const wave = { o: t < WAVE.a ? 0 : 1, x: r2(gx), y: r2(gy) };
  /* the wall: block by block from below, then it comes at him */
  const wx = Math.min(WALL.x0, 190 - (S(t) - S(WALL.pass)));
  const wall = { x: r2(wx - WALL.x0), b: WALL.at.map(a => { const u = SPRING(span(t, a, a + 0.16)); return { y: r2(220 * (1 - u)), o: +smooth(span(t, a, a + 0.04)).toFixed(3) }; }) };
  /* the inbox, the tick, delivered */
  const tr = { x: r2(320 * (1 - SPRING(span(t, TRAY.a, TRAY.b)))), o: t < TRAY.a ? 0 : 1 };
  const tk = popIn(t, TICK, 0.36);
  const tick = { s: tk.s, o: tk.o, y: r2(-60 * (1 - EASE(span(t, TICK - 0.12, TICK)))) };
  const dl = { o: +smooth(span(t, TICK + 0.05, TICK + 0.25)).toFixed(3), y: r2(8 * (1 - EASE(span(t, TICK + 0.05, TICK + 0.3)))) };
  /* the wind, streaming off his back while he flies */
  const fly = speedAt(t) / SPEED;
  const tail = standOn(p);
  const wind = [0, 1, 2, 3, 4].map(i => {
    const ph = ((t * 1100 + i * 173) % 300) / 300;
    return { x: r2(tail.x - 70 - ph * 300), y: r2(tail.y - 30 + i * 22 + (i % 2 ? 6 : -4)), w: r2(40 + 30 * ((i * 37) % 3)), o: +(fly * Math.sin(Math.PI * ph) * 0.55).toFixed(3) };
  });
  return {
    sw, lbl, bub, pop, wave, wall, tr, tick, dl, wind,
    pl: { x: r2(p.x), y: r2(p.y), rot: r2(p.rot), s: +p.s.toFixed(4), o: +p.o.toFixed(3), flap: sh.flap, body: sh.body, plane: +done.toFixed(3) },
    grid: r2(((sc % 20) + 20) % 20),
  };
}
const EIN = q => q * q * q;

/* the shake on the slam */
function camera(t) {
  if (t < SLAM + 0.08 || t > SLAM + 0.30) return null;
  const d = t - SLAM - 0.08, e = Math.exp(-d / 0.07);
  /* a hair over 1 so the rig reads it as a camera move */
  return { s: 1.0002, tx: +(5 * e * Math.sin(2 * Math.PI * 23 * d)).toFixed(2), ty: +(4 * e * Math.sin(2 * Math.PI * 19 * d + 1.3)).toFixed(2) };
}

/* ---------- the page ---------- */
const ic = (d, w = 22, sw = 2) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const MAIL = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6l9 -6"/>';
const INBOX = '<path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M4 13h3l3 3h4l3 -3h3"/>';
const X = '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>';
const CHECK = '<path d="M5 12l5 5l10 -10"/>';
const css = `
:root{--paper:#e9edf1;--paper2:#c3c9d0;--grey:#8b9097;--block:#2a2e35;--line:rgba(255,255,255,.12)}
.grid{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(255,255,255,.07) 0 1px,transparent 1.4px) 0 0/20px 20px;will-change:background-position}
.lbl{position:absolute;left:${MARGIN}px;width:${540 - 2 * MARGIN}px;top:${LBL_TOP}px;text-align:center;font:400 26px/1 var(--mono);color:var(--sub);letter-spacing:.08em;will-change:transform,opacity}
.wind{position:absolute;left:0;top:0;height:2px;border-radius:1px;background:rgba(255,255,255,.9);will-change:transform,opacity}
.pl{position:absolute;left:0;top:0;width:240px;height:200px;margin:-100px 0 0 -120px;will-change:transform,opacity;overflow:visible}
.pl .fl{fill:var(--paper);stroke:#9aa3ad;stroke-width:1.5;stroke-linejoin:round}
.pl .bd{fill:var(--paper2);stroke:#9aa3ad;stroke-width:1.5;stroke-linejoin:round}
.wave{position:absolute;left:0;top:0;will-change:transform,opacity}
.sp{position:absolute;width:${CARD_W}px;height:${CARD_H}px;margin:-${CARD_H / 2}px 0 0 -${CARD_W / 2}px;border-radius:12px;background:var(--block);border:1px solid var(--line);
  display:flex;align-items:center;gap:8px;padding:0 12px;color:#a9aeb5;font:500 21px/1 var(--read);white-space:nowrap}
.wall{position:absolute;left:${WALL.x0 - WALL.w / 2}px;top:0;width:${WALL.w}px;height:960px;will-change:transform}
.wb{position:absolute;left:0;width:${WALL.w}px;border-radius:4px;background:#3a3f47;border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 -6px 0 rgba(0,0,0,.25);will-change:transform,opacity}
.tray{position:absolute;left:${TRAY.cx - TRAY.w / 2}px;width:${TRAY.w}px;will-change:transform}
.tb{top:${TRAY.back}px;height:${TRAY.front + TRAY.fh - TRAY.back}px;border-radius:16px;background:#14171c;border:1px solid var(--line)}
`;
const cssFront = `
.sw{position:absolute;left:${SW.cx - SW.w / 2}px;top:${SW.top}px;width:${SW.w}px;height:${SW.h}px;will-change:transform}
.sw-t,.sw-on{position:absolute;inset:0;border-radius:${SW.h / 2}px;background:#3a3a3e}
.sw-on{background:var(--accent);opacity:0}
.bd0,.bd1{position:absolute;border-radius:50%;background:#06070a;border:${BUB.stroke}px solid rgba(213,219,216,.5);will-change:transform,opacity}
.bp{position:absolute;height:${BUB.h}px;padding:${BUB.padY}px 22px;border-radius:999px;background:#06070a;border:${BUB.stroke}px solid rgba(213,219,216,.5);
  color:#f4f7f5;font:500 ${BUB.size}px/1.25 var(--read);white-space:nowrap;transform-origin:0% 100%;will-change:transform,opacity}
.pop{position:absolute;left:${POP.cx - POP.w / 2}px;top:${POP.cy - POP.h / 2}px;width:${POP.w}px;height:${POP.h}px;border-radius:18px;background:var(--paper);color:#0b0d10;
  box-shadow:0 18px 40px rgba(0,0,0,.55);opacity:0;will-change:transform,opacity;font-family:var(--read);z-index:9}
.pop .x{position:absolute;right:14px;top:14px;width:32px;height:32px;border-radius:50%;background:#c9ced4;color:#4b5058;display:grid;place-items:center}
.pop b{position:absolute;left:22px;top:26px;font-weight:500;font-size:22px;line-height:1;color:#4b5058}
.pop strong{position:absolute;left:22px;top:58px;font-weight:500;font-size:34px;line-height:1.1}
.pop i{position:absolute;left:22px;right:22px;bottom:20px;height:46px;border-radius:23px;background:#8b9097;color:#fff;font:500 22px/46px var(--read);font-style:normal;text-align:center}
.tf{top:${TRAY.front}px;height:${TRAY.fh}px;border-radius:8px 8px 16px 16px;background:#23272e;border:1px solid rgba(255,255,255,.16);
  display:flex;align-items:center;justify-content:center;gap:10px;color:#d5dbd8;font:500 22px/1 var(--read)}
.tk{position:absolute;left:${TRAY.cx + TRAY.w / 2 - 26}px;top:${TRAY.front - 26}px;width:52px;height:52px;border-radius:50%;background:var(--accent);color:#06070a;display:grid;place-items:center;opacity:0;will-change:transform,opacity}
.dl{position:absolute;left:${TRAY.cx - 150}px;width:300px;top:${TRAY.front + TRAY.fh + 26}px;text-align:center;font:500 28px/1 var(--read);color:var(--accent);letter-spacing:.02em;opacity:0;will-change:transform,opacity}
`;
const markup = `
<style>${cssFront}</style>
<div class="grid" id="grid"></div>
<div class="lbl" id="lbl">ai agent</div>
<div class="sw" id="sw"><div class="sw-t"></div><div class="sw-on" id="sw-on"></div></div>
${[0, 1, 2, 3, 4].map(i => `<div class="wind" id="wd${i}"></div>`).join('')}
<div class="wave" id="wave">${CARDS.map((c, i) => `<div class="sp" id="sp${i}" style="left:${c.x}px;top:${c.y}px">${ic(MAIL, 22)}<span>${c.s}</span></div>`).join('')}</div>
<div class="wall" id="wall">${WB.map((b, i) => `<div class="wb" id="wb${i}" style="top:${b.t}px;height:${b.h}px"></div>`).join('')}</div>
<div class="tray tb" id="trb"></div>
<svg class="pl" id="pl" viewBox="-120 -100 240 200"><polygon class="bd" id="pl-b"/><polygon class="fl" id="pl-f"/></svg>`;
const front = `
<div class="bd0" id="bd0" style="left:${BUB.c0.x - BUB.d0 / 2}px;top:${BUB.c0.y - BUB.d0 / 2}px;width:${BUB.d0}px;height:${BUB.d0}px;opacity:0"></div>
<div class="bd1" id="bd1" style="left:${BUB.c1.x - BUB.d1 / 2}px;top:${BUB.c1.y - BUB.d1 / 2}px;width:${BUB.d1}px;height:${BUB.d1}px;opacity:0"></div>
<div class="bp" id="bp" style="left:${BUB.px - 40}px;top:${BUB.py - BUB.h}px;opacity:0">new job</div>
<div class="tray tf" id="trf">${ic(INBOX, 24)}<span>inbox</span></div>
<div class="tk" id="tk">${ic(CHECK, 30, 3)}</div>
<div class="dl" id="dl">delivered</div>
<div class="pop" id="pop"><div class="x">${ic(X, 20, 2.5)}</div><b>you won</b><strong>a free phone</strong><i>claim</i></div>`;

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const grid = $('grid'), lbl = $('lbl'), sw = $('sw'), swOn = $('sw-on');
  const bubs = [$('bd0'), $('bd1'), $('bp')], pop = $('pop'), wave = $('wave'), wall = $('wall');
  const wb = [0, 1, 2, 3].map(i => $('wb' + i)), trb = $('trb'), trf = $('trf'), tk = $('tk'), dl = $('dl');
  const pl = $('pl'), plB = $('pl-b'), plF = $('pl-f'), wd = [0, 1, 2, 3, 4].map(i => $('wd' + i));
  let lastF = '', lastB = '';
  window.__gag = {
    apply(o) {
      grid.style.backgroundPosition = o.grid + 'px 0';
      lbl.style.opacity = o.lbl.o; lbl.style.transform = 'translateX(' + o.lbl.x + 'px)';
      sw.style.opacity = o.sw.o; sw.style.transform = 'translate(' + o.sw.x + 'px,' + o.sw.dip + 'px) scale(' + o.sw.s + ')';
      swOn.style.opacity = o.sw.on;
      o.bub.forEach((b, i) => { bubs[i].style.opacity = b.o; bubs[i].style.transform = 'scale(' + b.s + ')'; });
      pop.style.opacity = o.pop.o; pop.style.transform = 'translateX(' + o.pop.x + 'px) scale(' + o.pop.s + ')';
      wave.style.opacity = o.wave.o; wave.style.transform = 'translate(' + o.wave.x + 'px,' + o.wave.y + 'px)';
      wall.style.transform = 'translateX(' + o.wall.x + 'px)';
      o.wall.b.forEach((b, i) => { wb[i].style.opacity = b.o; wb[i].style.transform = 'translateY(' + b.y + 'px)'; });
      trb.style.opacity = o.tr.o; trf.style.opacity = o.tr.o;
      trb.style.transform = trf.style.transform = 'translateX(' + o.tr.x + 'px)';
      tk.style.opacity = o.tick.o; tk.style.transform = 'translateY(' + o.tick.y + 'px) scale(' + o.tick.s + ')';
      dl.style.opacity = o.dl.o; dl.style.transform = 'translateY(' + o.dl.y + 'px)';
      pl.style.opacity = o.pl.o; pl.style.transform = 'translate(' + o.pl.x + 'px,' + o.pl.y + 'px) rotate(' + o.pl.rot + 'deg) scale(' + o.pl.s + ')';
      if (o.pl.flap !== lastF) { lastF = o.pl.flap; plF.setAttribute('points', o.pl.flap); }
      if (o.pl.body !== lastB) { lastB = o.pl.body; plB.setAttribute('points', o.pl.body); }
      o.wind.forEach((w, i) => { wd[i].style.width = w.w + 'px'; wd[i].style.opacity = w.o; wd[i].style.transform = 'translate(' + w.x + 'px,' + w.y + 'px)'; });
    },
  };
}

/* ---------- the plan, checked in node before anything renders ----------
   he clears the popup, the wave and the wall, the plane fits the slot */
{
  const fails = [];
  const box = (x, y, hw, hh) => ({ l: x - hw, r: x + hw, t: y - hh, b: y + hh });
  const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  for (let t = TAKEOFF.b; t < INTO.a; t += 1 / 120) {
    const f = frame(t), h = him(t), p = plane(t);
    const mb = box(h.x, h.y, R, R);
    const pb = box(p.x, p.y, PL_HALF.l, Math.max(PL_HALF.t, PL_HALF.b) - 2);
    const obst = [];
    if (t >= SLAM) obst.push(['the popup', { l: POP.cx - POP.w / 2 + f.pop.x, r: POP.cx + POP.w / 2 + f.pop.x, t: POP.cy - POP.h / 2, b: POP.cy + POP.h / 2 }]);
    if (t >= WAVE.a) CARDS.forEach((c, i) => obst.push(['spam card ' + i, box(c.x + f.wave.x, c.y + f.wave.y, CARD_W / 2, CARD_H / 2)]));
    const wl = WALL.x0 + f.wall.x - WALL.w / 2;
    WB.forEach((b, i) => { if (t >= WALL.at[i] + 0.16) obst.push(['wall block ' + i, { l: wl, r: wl + WALL.w, t: b.t, b: b.t + b.h }]); });
    for (const [name, o] of obst) {
      if (hit(mb, o)) { fails.push('he hits ' + name + ' at ' + t.toFixed(3)); break; }
      if (hit(pb, o)) { fails.push('the plane hits ' + name + ' at ' + t.toFixed(3)); break; }
    }
  }
  if (fails.length) { console.error(['', 'THE PLAN FAILS', ...fails.slice(0, 12)].join('\n  ')); process.exit(1); }
}

/* ---------- the sound ----------
   five from elevenlabs when it serves them, the rest from the kit */
const EL = [
  { kind: 'elClick', prompt: 'a single strong heavy light switch flicked on, one sharp mechanical click, close mic, dry, no reverb', seconds: 0.6, mode: 'hit', keep: 0.25, gain: -13 },
  { kind: 'elFold', prompt: 'a sheet of paper folded quickly into a paper plane, three crisp paper creases and crinkles, close mic, dry', seconds: 1.0, mode: 'hit', keep: 0.75, gain: -15 },
  { kind: 'elWind', prompt: 'soft steady wind rushing past while flying, gentle airflow, smooth, no gusts, no music', seconds: 5.2, mode: 'bed', keep: 5.0, hp: 180, gain: -16 },
  { kind: 'elSlam', prompt: 'heavy cinematic impact slam, a big heavy panel slamming down, deep low thud with punch, short tail', seconds: 1.2, mode: 'hit', keep: 0.9, gain: -16 },
  { kind: 'elRumble', prompt: 'low deep rolling rumble building quickly, a heavy wave rolling in, earthy, no music', seconds: 2.0, mode: 'bed', keep: 1.45, hp: 60, fadeIn: 0.25, fadeOut: 0.4, gain: -16.5 },
];
/* the kit stand ins, the same five built from lib/sfx.mjs and seeded noise */
function standIns() {
  const N = s => new Float32Array(Math.round(s * SR));
  const rnd = seed => { let x = seed | 0; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) / 4294967296) * 2 - 1; }; };
  const lp = (b, hz) => { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0; for (let i = 0; i < b.length; i++) { y = (1 - a) * b[i] + a * y; b[i] = y; } return b; };
  const hp = (b, hz) => { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0, p = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - p); p = b[i]; b[i] = y; } return b; };
  const add = (d, s, at = 0, g = 1) => { const o = Math.round(at * SR); for (let i = 0; i < s.length && o + i < d.length; i++) d[o + i] += s[i] * g; return d; };
  const fin = (b, fi = 0.002, fo = 0.03) => { let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v)); for (let i = 0; i < b.length; i++) b[i] /= pk || 1; const a = Math.round(fi * SR), z = Math.round(fo * SR); for (let i = 0; i < a; i++) b[i] *= i / a; for (let i = 0; i < z; i++) b[b.length - 1 - i] *= i / z; return b; };
  const out = {};
  out.elClick = fin(add(add(add(N(0.25), VOICES.toggle()), VOICES.land({ f0: 320, f1: 110, tau: 0.03 }), 0, 0.8), VOICES.click(), 0, 0.5));
  {
    const b = N(0.75), r = rnd(0x5ea1);
    for (const at of [0, 0.2, 0.4]) {
      const s = N(0.18);
      for (let i = 0; i < s.length; i++) { const q = i / SR, e = Math.exp(-q / 0.06) * Math.min(1, q / 0.004); s[i] = ((Math.abs(r()) < 0.25 * e ? 0.5 * r() : 0) + 0.35 * r()) * e; }
      add(b, lp(lp(hp(s, 900), 5000), 6500), at);
    }
    out.elFold = fin(b);
  }
  {
    const b = N(5.0), r = rnd(0x77a1);
    for (let i = 0; i < b.length; i++) b[i] = r();
    lp(lp(b, 900), 1200); hp(b, 140);
    for (let i = 0; i < b.length; i++) { const q = i / SR; b[i] *= 0.6 + 0.25 * Math.sin(2 * Math.PI * 0.35 * q) + 0.15 * Math.sin(2 * Math.PI * 0.9 * q + 1); }
    out.elWind = fin(b, 0.4, 0.6);
  }
  {
    const b = add(add(N(0.9), VOICES.popDeep({ f0: 110, f1: 45, tau: 0.16, len: 0.6 })), VOICES.bass({ len: 0.9, tau: 0.2 }), 0, 0.8);
    const s = N(0.2), r = rnd(0x31a7);
    for (let i = 0; i < s.length; i++) s[i] = r() * Math.exp(-i / SR / 0.04) * Math.min(1, i / SR / 0.001);
    out.elSlam = fin(add(b, lp(s, 500), 0, 0.7));
  }
  {
    const b = N(1.45), r = rnd(0x9b33);
    for (let i = 0; i < b.length; i++) b[i] = r();
    lp(lp(b, 320), 380);
    for (let i = 0; i < b.length; i++) { const q = i / b.length; b[i] = b[i] * Math.pow(Math.sin(Math.PI * Math.min(1, q * 0.75 + 0.05)), 0.8) + 0.08 * Math.sin(2 * Math.PI * 62 * i / SR) * Math.sin(Math.PI * q); }
    out.elRumble = fin(b, 0.25, 0.4);
  }
  for (const s of EL) { const pcm = out[s.kind]; VOICES[s.kind] = () => pcm; GAINS[s.kind] = s.gain; }
}
let FROM_EL = null;
if (process.argv.includes('--kit')) { standIns(); FROM_EL = 'kit on request'; }
else {
  try { const kept = await elevenSfx(48, EL); FROM_EL = 'elevenlabs'; for (const [k, v] of Object.entries(kept)) console.log('  ' + k + ' ' + v.all.join(', ')); }
  catch (e) { standIns(); FROM_EL = 'kit stand ins, elevenlabs said no: ' + String(e && e.message || e).slice(0, 160); }
}
console.log('\n  the five elevenlabs sounds: ' + FROM_EL);

const CUES = [
  { t: CLICK, kind: 'elClick', from: 'switch click' },
  { t: J_POP.t0, kind: 'bounce', opts: { f0: 260, f1: 140 }, from: 'the knob jumps out as him' },
  { t: J_POP.t1, kind: 'land', from: 'lands on the switch' },
  { t: BUB_AT, kind: 'bubble', from: 'new job, the dots' },
  { t: BUB_AT + 0.14, kind: 'bubble', opts: { f0: 620, f1: 1700 }, from: 'new job, the pill' },
  { t: ENV.a, kind: 'whoosh', from: 'the envelope flies in' },
  { t: FOLD[0][0], kind: 'elFold', from: 'it folds into a plane' },
  { t: J_ON.t0, kind: 'bounce', from: 'he hops on' },
  { t: J_ON.t1, kind: 'land', from: 'lands on the plane' },
  { t: TAKEOFF.a, kind: 'whooshUp', from: 'takeoff' },
  { t: TAKEOFF.a, kind: 'elWind', from: 'wind while flying' },
  { t: SLAM, kind: 'elSlam', from: 'the popup slams' },
  { t: DODGE.a, kind: 'whoosh', opts: { len: 0.16, seed: 0x2d11 }, from: 'he dodges' },
  { t: WAVE.a, kind: 'elRumble', from: 'the spam wave' },
  { t: CLIMB.a, kind: 'whooshUp', opts: { seed: 0x1177 }, from: 'he pulls up' },
  ...[...new Set(WALL.at)].sort().map((t, i) => ({ t, kind: 'popDeep', opts: { f0: 96 + 12 * i, f1: 54 + 7 * i, tau: 0.05, len: 0.14 }, from: 'wall block ' + (i + 1) })),
  { t: J_WALL.t0, kind: 'boing', from: 'he jumps the wall' },
  { t: J_WALL.t1, kind: 'land', opts: { f0: 260, f1: 90, tau: 0.07, len: 0.22 }, from: 'lands back on the plane, solid' },
  { t: TRAY.a, kind: 'whoosh', opts: { len: 0.24, seed: 0x6612 }, from: 'the inbox slides in' },
  { t: J_OFF.t1, kind: 'land', from: 'lands on the inbox' },
  { t: TICK, kind: 'chime', from: 'the tick' },
  { t: WINK.at, kind: 'sparkle', from: 'the wink' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
const GAIN = { whoosh: -17, popDeep: -16, bass: -15, chime: -14 };

if (process.argv.includes('--bus')) {
  const { renderList } = await import('./lib/sfx.mjs');
  const { buf } = renderList(CUES, CUT + HOLD, { gains: GAIN });
  const B = Math.round(0.02 * SR), rows = [];
  for (let i = 0; i + B < buf.length; i += B) { let m = 0; for (let j = i; j < i + B; j++) m = Math.max(m, Math.abs(buf[j])); rows.push([i / SR, 20 * Math.log10(m + 1e-9)]); }
  rows.sort((x, y) => y[1] - x[1]);
  console.log(rows.slice(0, 12).map(r => r[0].toFixed(2) + 's ' + r[1].toFixed(1) + 'dB').join('  '));
  process.exit(0);
}
const BEATS = [CLICK, EYES_OPEN.a, J_POP.t0, J_POP.t1, BUB_AT, ENV.a, ...FOLD.map(f => f[0]), J_ON.t0, J_ON.t1, TAKEOFF.a, SLAM, DODGE.a, WAVE.a, CLIMB.a,
  ...WALL.at, J_WALL.t0, J_WALL.t1, TRAY.a, J_OFF.t1, TICK, LENS_AT, WINK.at];
const STILLS = [0, 0.36, 0.52, 0.66, 0.84, 1.14, 1.50, 2.05, 2.40, 2.60, 2.86, 3.12, 3.33, 3.75, 4.34, 4.80, 5.15, 5.60, 6.20, 6.60, 7.12, 7.33, 7.62, 7.98, 8.45, 8.72, 9.08, 9.62, 10.43, 10.90];

const inside = r => r && r.l >= MARGIN - 0.5 && r.r <= 540 - MARGIN + 0.5 && r.t >= MARGIN - 0.5 && r.b <= 960 - 150 + 0.5;
const res = await runEpisode({
  post: 48, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  sfx: { cues: CUES, gains: GAIN },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: {},
    /* the knob: his eyes shut until they open after the click */
    sleep: [[0, EYES_OPEN.b]],
    beats: BEATS,
    checks: ['#bp', '#tk', '#dl'],
    hook: ['#sw', '#lbl'],
    copy: ['ai agent', 'new job', 'you won', 'a free phone', 'claim', ...CARDS.map(c => c.s), 'inbox', 'delivered'],
    verify: [
      { at: 0, sel: '#sw', test: r => (r && Math.abs((r.l + r.r) / 2 - 270) < 1 ? null : 'the switch is not in the middle at frame 0') },
      /* he is the knob: inside the track at its left end at frame 0, at its right end after the click, never behind it */
      { at: 0, sel: '#m-card', test: r => (r && Math.abs((r.l + r.r) / 2 + PLATE_OFF.x - SW_X[0]) < 0.6 && Math.abs((r.t + r.b) / 2 + PLATE_OFF.y - SW.cy) < 0.6 ? null : 'he is not the knob at frame 0, ' + (r && [((r.l + r.r) / 2).toFixed(1), ((r.t + r.b) / 2).toFixed(1), SW_X[0].toFixed(1), SW.cy].join(' '))) },
      { at: SLIDE.b + 0.1, sel: '#m-card', test: r => (r && Math.abs((r.l + r.r) / 2 + PLATE_OFF.x - SW_X[1]) < 0.6 ? null : 'he did not slide across as the knob, ' + (r && [((r.l + r.r) / 2).toFixed(1), ((r.t + r.b) / 2).toFixed(1), SW_X[1].toFixed(1)].join(' '))) },
      { at: J_POP.t1 + 0.3, sel: '#m-card', test: r => (r && r.b <= SW.top + 5 ? null : 'he is not standing on the empty track') },
      { at: 0.2, sel: '#lbl', test: r => (r && r.o > 0.99 ? null : 'ai agent is not under the switch in the first second') },
      { at: 1.6, sel: '#lbl', test: r => (r ? 'ai agent is still up after he popped out' : null) },
      { at: SLAM + 0.2, sel: '#pop', test: r => (inside(r) ? null : 'the popup is past the margin once it has landed') },
      { at: 9.5, sel: '#trf', test: r => (inside(r) ? null : 'the inbox is past the margin') },
      { at: 9.5, sel: '#m-card', test: r => (r && Math.abs((r.l + r.r) / 2 - RIM.x) < 3 ? null : 'he is not on the inbox rim') },
    ],
    log: [[0, 'the switch, off, ai agent'], [CLICK, 'click, he slides as the knob, green'], [EYES_OPEN.a, 'his eyes open'], [J_POP.t0, 'the knob jumps out as him'], [BUB_AT, 'new job'], [ENV.a, 'the envelope'],
      [FOLD[0][0], 'it folds into a plane'], [J_ON.t1, 'on the plane'], [TAKEOFF.a, 'takeoff'], [SLAM, 'the popup slams'], [DODGE.a, 'he dives under it'],
      [WAVE.a, 'the spam wave'], [CLIMB.a, 'he pulls up'], [WALL.at[2], 'the wall'], [J_WALL.t0, 'he jumps it'], [J_WALL.t1, 'back on the plane'],
      [TRAY.a, 'the inbox'], [J_OFF.t1, 'on the rim'], [TICK, 'the tick, delivered'], [WINK.at, 'the wink']],
  },
});

/* ---------- sync and audibility ----------
   every cue is placed in the bus to the sample, so sync is the mp4's audio
   against the mastered wav: one offset, found by cross correlation. and each
   struck sound has to stand over whatever else is playing under it. */
if (res && res.file) {
  const { renderList } = await import('./lib/sfx.mjs');
  const mp4 = decode(ffmpeg, res.file), wav = decode(ffmpeg, res.fx.wav);
  const a = Math.round(0.2 * SR), n = Math.round(4 * SR);
  let best = { lag: 0, c: -Infinity };
  for (let lag = -Math.round(0.05 * SR); lag <= Math.round(0.05 * SR); lag += 12) {
    let c = 0;
    for (let i = a; i < a + n; i += 4) c += wav[i] * (mp4[i + lag] || 0);
    if (c > best.c) best = { lag, c };
  }
  for (let lag = best.lag - 12; lag <= best.lag + 12; lag++) {
    let c = 0;
    for (let i = a; i < a + n; i += 2) c += wav[i] * (mp4[i + lag] || 0);
    if (c > best.c || lag === best.lag - 12) best = { lag, c };
  }
  const off = 1000 * best.lag / SR;
  const struck = CUES.filter(c => !['elWind', 'elRumble', 'whoosh', 'whooshUp'].includes(c.kind));
  const secs = CUT + HOLD, rms = (b, t, len) => { let e = 0, k = 0; for (let i = Math.round(t * SR); i < Math.round((t + len) * SR) && i < b.length; i++) { e += b[i] * b[i]; k++; } return Math.sqrt(e / Math.max(1, k)) + 1e-9; };
  const rows = [];
  let worst = Infinity;
  for (const c of struck) {
    const own = renderList([c], secs, { gains: GAIN }).buf, rest = renderList(CUES.filter(x => x !== c), secs, { gains: GAIN }).buf;
    const d = 20 * Math.log10(rms(own, c.t, 0.08) / rms(rest, c.t, 0.08));
    worst = Math.min(worst, d);
    rows.push(c.from + ' ' + (d > 60 ? 'alone' : (d >= 0 ? '+' : '') + d.toFixed(1) + 'dB'));
  }
  console.log('\n  sync: the mp4 audio sits ' + off.toFixed(1) + 'ms off the mastered bus, every cue on its sample in the bus');
  console.log('  audibility, each struck sound over everything else in its first 80ms, worst ' + worst.toFixed(1) + 'dB\n    ' + rows.join('\n    '));
}
