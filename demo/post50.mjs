/* the boring tek — post50. good morning.

   dark, 1080x1920, no voice, 8.36s. post45 and post48's look: the dark stage,
   the faint dot grid, him alive in the middle. the only real color is the
   coffee brown and one warm accent on the cup, the battery fills in the house
   green. the rig is lib/aiafter.mjs with the series off, in its sound only
   mode. the splash and the slurp come from elevenlabs through
   lib/elevensfx.mjs, the rest from lib/sfx.mjs. when elevenlabs will not serve
   them, kit stand ins built here take their place and the run says so.

     0.00  he jumps up from below into the middle, sleepy squint, lands 0.38
     0.55  the house bubble, good morning, a small yawn bob 0.78
     1.95  he jumps up, a coffee cup slides in under him 2.00
     2.72  he drops into the cup, a small brown splash
     2.82  the coffee drains, he drinks it all, a slurp
     3.55  he shoots up out of it, happy eyes, the cup slides out 3.85
     4.35  he lands in the middle
     4.55  the bubble, fully charged, the battery fills green, a chime 5.30
     5.62  the same bubble turns into have a nice day, the battery goes with it
     7.20  read, the glitch, the end card for 1.16s. he stays calm under the bubble till then

   eyes calm, happy or squint, sleepy is a squint, never wide. no hands. every
   landing squashes. on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post50.mjs          the preview, with sound
     node post50.mjs                      60fps
     node post50.mjs --stills             one still per beat, no render
     node post50.mjs --kit                the two elevenlabs sounds from the kit stand ins
     node post50.mjs --bus                the loudest moments of the bus before the master
*/

import {
  runEpisode, span, lerp, smooth, bump, clamp, EASE, SPRING, IO, MARGIN, prng,
} from './lib/aiafter.mjs';
import { VOICES, GAINS, SR, decode } from './lib/sfx.mjs';
import { elevenSfx } from './lib/elevensfx.mjs';
import { planMascot, mascotFrame } from './lib/mascot.mjs';
import ffmpeg from 'ffmpeg-static';

/* ---------- him: positions are his plate's middle, which is his card's ---------- */
const SCALE = 1.1;
const R = 118 * SCALE * 30 / 64;                       /* his plate's radius as drawn, 60.8 */
const REST = { x: 270, y: 440 };
const MAS = { cx: REST.x, cy: REST.y, size: 118, scale: SCALE };
const DEG = Math.PI / 180;

/* ---------- the cup: a white outline, one warm accent, brown coffee ---------- */
const CUP = { cx: 270, top: 520, bot: 730, rt: 96, rb: 76, ry: 15, full: 540, empty: 724 };
const hw = y => CUP.rt - (CUP.rt - CUP.rb) * (y - CUP.top) / (CUP.bot - CUP.top);
const WARM = '#ff9a4d';
const BROWN = '#6b4226', FOAM = '#e8cfa6';
const IN_CUP = { x: CUP.cx, y: CUP.bot - 4 - R };

/* ---------- the timeline ---------- */
const START = { x: REST.x, y: 715 };
const J0 = { t0: 0, t1: 0.38, h: 70 };
const BUB1 = { at: 0.55, out: 1.75 };
const YAWN = { a: 0.78, b: 1.32 };
const J_UP = { t0: 1.95, t1: 2.35, ant: 0.12 };
const PEAK = { x: REST.x, y: 215 };
const CUP_IN = { a: 2.00, b: 2.38 };
const DROP = { a: 2.35, b: 2.72 };
const SPLASH = DROP.b;
const SINK = { a: DROP.b, b: 2.86 };
const DRAIN = { a: 2.82, b: 3.40 };
const SLURP = 2.92;                     /* the kept take has 0.1s of soft lead in, its body lands on the drain */
const J_OUT = { t0: 3.55, t1: 4.35, h: 330, ant: 0.10 };
const CUP_OUT = { a: 3.85, b: 4.20 };
const BUB2 = { at: 4.55, out: 9 };             /* up through the cut */
const CELLS = [4.74, 4.88, 5.02, 5.16];
const FULL = 5.30;
const SWAP = 5.62;                      /* fully charged becomes have a nice day, held 1.5s */
const CUT = 7.20, HOLD = 1.16;          /* have a nice day is up 1.5s, then the cut */

/* ---------- his jumps, post48's ball ---------- */
function air(j, t, a, b) {
  const u = span(t, j.t0, j.t1), d = j.t1 - j.t0;
  const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - 4 * j.h * u * (1 - u);
  const vy = (b.y - a.y) / d - 4 * j.h * (1 - 2 * u) / d, vmax = Math.max(Math.abs((b.y - a.y) / d) + 4 * j.h / d, 1);
  const sq = -0.13 * clamp(Math.abs(vy) / vmax, 0, 1) * smooth(span(t, j.t0 + 0.001, j.t0 + 0.035));
  return { x, y, sq, rot: 8 * Math.sign(b.x - a.x) * Math.sin(Math.PI * u) };
}
const landSq = (t, at, k = 0.2) => (t < at ? 0 : k * Math.exp(-(t - at) / 0.11) * Math.cos(2 * Math.PI * (t - at) / 0.34));
const antSq = (t, j, k = 0.12) => (j.ant && t >= j.t0 - j.ant && t < j.t0 ? k * Math.sin(Math.PI / 2 * EASE(span(t, j.t0 - j.ant, j.t0))) : 0);
const EOUT = q => 1 - Math.pow(1 - q, 3), EIN = q => q * q * q;

function him(t) {
  let x = REST.x, y = REST.y, sq = 0, rot = 0, g = 1, plat = true;
  if (t < J0.t1) { ({ x, y, sq, rot } = air(J0, t, START, REST)); plat = false; }
  else if (t < J_UP.t0) {
    /* the yawn: up tall and over a little, then back down */
    const u = span(t, YAWN.a, YAWN.b), yb = Math.sin(Math.PI * u);
    sq = landSq(t, J0.t1) - 0.07 * yb + antSq(t, J_UP);
    rot = -5 * Math.sin(2 * Math.PI * u) * (u > 0 && u < 1 ? 1 : 0);
    y += -6 * yb + 5 * Math.sin(Math.PI * span(t, YAWN.b - 0.1, YAWN.b + 0.12));
  } else if (t < DROP.a) {
    const u = span(t, J_UP.t0, J_UP.t1);
    y = lerp(REST.y, PEAK.y, EOUT(u)); sq = -0.14 * (1 - u); plat = false;
  } else if (t < SINK.a) {
    const u = span(t, DROP.a, DROP.b);
    y = lerp(PEAK.y, CUP.full, EIN(u)); sq = -0.13 * u; plat = false;
  } else if (t < J_OUT.t0) {
    const u = EASE(span(t, SINK.a, SINK.b));
    y = lerp(CUP.full, IN_CUP.y, u);
    sq = t > SINK.b ? landSq(t, SINK.b, 0.12) + antSq(t, J_OUT, 0.16) : -0.08 * (1 - u);
  } else if (t < J_OUT.t1) { ({ x, y, sq, rot } = air(J_OUT, t, IN_CUP, REST)); sq *= 1.5; plat = false; }
  else {
    /* calm and alive under the bubble: a slow small float till the cut */
    sq = landSq(t, J_OUT.t1, 0.22) + 0.05 * bump(t, FULL, 0.05, 0.05, 0.2);
    y += 3 * Math.sin(2 * Math.PI * Math.max(0, t - 4.9) / 1.6) * smooth(span(t, 4.9, 5.3));
  }
  if (plat) y += R * g * sq;
  return { x, y, sq, rot, g };
}

/* ---------- where he looks, his eyes ---------- */
const LENS = { w: 0 };
const LOOKS = [
  { at: 0, to: LENS },
  { at: 2.02, to: { x: 520, y: 640, w: 0.8 } },
  { at: 2.30, to: { x: CUP.cx, y: 660, w: 1 } },
  { at: 2.95, to: LENS },
  { at: 3.55, to: { x: 270, y: 120, w: 1 } },
  { at: 4.05, to: LENS },
  { at: 4.62, to: { x: 420, y: 330, w: 0.9 } },
  { at: FULL + 0.1, to: LENS },
];
const BLINKS = [1.70, 6.80];
const SQUINT = [[1.80, 2.06], [2.98, 3.52]];
const HAPPY = [[3.62, 0.08, 0.30, 0.12], [FULL, 0.06, 0.16, 0.10]];
/* the rig's idle drift is taken back out: every place he stands is planned */
const IDLE_PLAN = planMascot({ hands: false, seconds: 30, theme: 'dark', size: MAS.size, bias: 0, seed: 44, marks: [{ t: 0.0, state: 'neutral' }] });
function lidAt(t) {
  /* sleepy, a heavy squint, deepest in the yawn, then awake */
  let lid = t < 1.40 ? 0.70 + 0.10 * Math.sin(Math.PI * span(t, YAWN.a, YAWN.b)) : lerp(0.70, 0.04, smooth(span(t, 1.40, 1.62)));
  for (const [a, z] of SQUINT) lid = Math.max(lid, 0.04 + 0.42 * Math.min(smooth(span(t, a, a + 0.10)), 1 - smooth(span(t, z - 0.12, z))));
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  return lid;
}
function face(t) {
  const b = him(t);
  const idle = mascotFrame(IDLE_PLAN, t).card;
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const lens = { x: b.x, y: b.y, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.18));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let arc = 0;
  for (const [a, u, h, d] of HAPPY) arc = Math.max(arc, bump(t, a, u, h, d));
  return {
    lid: +lidAt(t).toFixed(4), arc: +arc.toFixed(4), look,
    dx: +(b.x - MAS.cx - idle.x).toFixed(3), dy: +(b.y - MAS.cy - idle.y).toFixed(3),
    rot: +(b.rot - idle.rot).toFixed(3), sq: +b.sq.toFixed(4),
    s: +(SCALE * b.g / idle.sx).toFixed(5),
  };
}

/* ---------- the house bubbles: two dots and a pill, off his rim ---------- */
const BUB = { angle: -70, gap: 10, d0: 12, d1: 17, size: 32, padY: 12, stroke: 2 };
BUB.h = BUB.size * 1.25 + 2 * BUB.padY + 2 * BUB.stroke;
{
  const r0 = R + BUB.gap + BUB.d0 / 2, r1 = r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2, r2 = r1 + BUB.d1 / 2 + BUB.gap;
  const ca = Math.cos(BUB.angle * DEG), sa = Math.sin(BUB.angle * DEG);
  Object.assign(BUB, { c0: { x: REST.x + r0 * ca, y: REST.y + r0 * sa }, c1: { x: REST.x + r1 * ca, y: REST.y + r1 * sa }, bottom: REST.y + r2 * sa });
}
const PILLS = [
  { id: 'p1', text: 'good morning', cx: 300, w: 262, at: BUB1.at, out: BUB1.out },
  { id: 'p2', text: 'fully charged', swap: 'have a nice day', cx: 280, w: 340, at: BUB2.at, out: BUB2.out, battery: true },
];

/* ---------- the splash, seeded once ---------- */
const GRAV = 2000;
const rnd = prng(0x50c0ffe);
const DROPS = Array.from({ length: 12 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  return { x0: CUP.cx + side * rnd() * 40, y0: CUP.full - 2, vx: side * (50 + rnd() * 200), vy: -(260 + rnd() * 280), r: 4 + rnd() * 4.5, at: SPLASH + rnd() * 0.04 };
});
const JET = { at: SPLASH + 0.02, h: 84, up: 0.10, down: 0.20 };

/* ---------- a frame ---------- */
const r2 = v => +v.toFixed(2);
const popIn = (t, a, d = 0.34) => ({ s: +lerp(0.4, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.08)).toFixed(3) });
const level = t => lerp(CUP.full, CUP.empty, IO(span(t, DRAIN.a, DRAIN.b)));
const cupX = t => 400 * (1 - SPRING(span(t, CUP_IN.a, CUP_IN.b))) - 440 * EIN(span(t, CUP_OUT.a, CUP_OUT.b));
function steam(t, k) {
  const x0 = CUP.cx + (k ? 20 : -18), pts = [];
  for (let y = CUP.full - 10; y >= CUP.full - 130; y -= 8) {
    const q = (CUP.full - 10 - y) / 120;
    pts.push([x0 + (4 + 10 * q) * Math.sin(q * 5 - t * 2.6 + k * 2.4), y]);
  }
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L');
}
function frame(t) {
  const L = level(t), w = hw(L) - 3, ry = CUP.ry - 2;
  const body = `M${r2(CUP.cx - w)},${r2(L)} L${r2(CUP.cx + w)},${r2(L)} L${CUP.cx + CUP.rb - 3},${CUP.bot} A${CUP.rb - 3},${ry} 0 0 1 ${CUP.cx - CUP.rb + 3},${CUP.bot} Z`;
  const near = `M${r2(CUP.cx - w)},${r2(L)} A${r2(w)},${ry} 0 0 0 ${r2(CUP.cx + w)},${r2(L)} Z`;
  const coffeeO = +(1 - smooth(span(L, CUP.empty - 22, CUP.empty - 2))).toFixed(3);
  const drops = DROPS.map(d => {
    const q = t - d.at;
    if (q < 0) return { o: 0, x: 0, y: 0 };
    return { x: r2(d.x0 + d.vx * q), y: r2(d.y0 + d.vy * q + 0.5 * GRAV * q * q), o: +(1 - smooth(span(q, 0.32, 0.45))).toFixed(3) };
  });
  const jq = t - JET.at;
  const jet = jq < 0 || jq > JET.up + JET.down ? 0 : r2(JET.h * (jq < JET.up ? EASE(jq / JET.up) : 1 - smooth((jq - JET.up) / JET.down)));
  /* the bubbles: dot, dot, pill, out in the same order */
  const bubs = PILLS.map(p => [0, 1, 2].map(k => { const a = p.at + 0.07 * k, z = p.out + 0.05 * k; const i = popIn(t, a, 0.26); return { s: i.s, o: +(i.o * (1 - smooth(span(t, z, z + 0.15)))).toFixed(3) }; }));
  const cells = CELLS.map(a => +smooth(span(t, a, a + 0.06)).toFixed(3));
  return {
    cup: { x: r2(cupX(t)), o: t < CUP_IN.a ? 0 : 1 },
    L: r2(L), fw: r2(w), body, near, coffeeO,
    steam: [steam(t, 0), steam(t, 1)], steamO: +(0.45 * smooth(span(t, CUP_IN.b - 0.15, CUP_IN.b + 0.1)) * (1 - smooth(span(t, DROP.b - 0.25, DROP.b)))).toFixed(3),
    drops, jet, bubs, cells,
    /* the swap: the old words and the battery out, the new words in on the spring, the pill a small kick */
    sw: { a: +(1 - smooth(span(t, SWAP, SWAP + 0.08))).toFixed(3), b: +smooth(span(t, SWAP + 0.04, SWAP + 0.12)).toFixed(3), bs: +lerp(0.5, 1, SPRING(span(t, SWAP + 0.04, SWAP + 0.38))).toFixed(4),
      k: +(1 + 0.06 * Math.exp(-Math.max(0, t - SWAP) / 0.08) * Math.sin(2 * Math.PI * Math.max(0, t - SWAP) / 0.2) * (t > SWAP ? 1 : 0)).toFixed(4) },
  };
}

/* a small nudge on the splash */
function camera(t) {
  if (t < SPLASH || t > SPLASH + 0.18) return null;
  const d = t - SPLASH, e = Math.exp(-d / 0.05);
  return { s: 1.0002, tx: +(2.5 * e * Math.sin(2 * Math.PI * 21 * d)).toFixed(2), ty: +(3.5 * e * Math.sin(2 * Math.PI * 17 * d + 1.1)).toFixed(2) };
}

/* ---------- the page ---------- */
const css = `
.grid{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(255,255,255,.07) 0 1px,transparent 1.4px) 0 0/20px 20px}
.full{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible;pointer-events:none;will-change:transform}
#cupF{z-index:7}
#fx{z-index:7}
`;
const cssFront = `
.bd0,.bd1{position:absolute;z-index:8;border-radius:50%;background:#06070a;border:${BUB.stroke}px solid rgba(213,219,216,.5);will-change:transform,opacity}
.bp{position:absolute;z-index:8;height:${BUB.h}px;padding:${BUB.padY}px 0;border-radius:999px;background:#06070a;border:${BUB.stroke}px solid rgba(213,219,216,.5);
  color:#f4f7f5;font:500 ${BUB.size}px/1.25 var(--read);white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:12px;will-change:transform,opacity}
.bp svg{display:block}
.bp .sw{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;will-change:transform,opacity}
`;
const OUTLINE = 'rgba(240,244,242,.92)';
const cupPath = `M${CUP.cx - CUP.rt},${CUP.top} L${CUP.cx - CUP.rb},${CUP.bot} A${CUP.rb},${CUP.ry} 0 0 0 ${CUP.cx + CUP.rb},${CUP.bot} L${CUP.cx + CUP.rt},${CUP.top}`;
const markup = `
<style>${cssFront}</style>
<div class="grid"></div>
<svg class="full" id="cupB" viewBox="0 0 540 960" style="opacity:0">
  <g id="steam" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" style="filter:blur(1px)"><path id="st0"/><path id="st1"/></g>
  <path d="M${CUP.cx - CUP.rt},${CUP.top} A${CUP.rt},${CUP.ry} 0 0 1 ${CUP.cx + CUP.rt},${CUP.top}" fill="none" stroke="rgba(240,244,242,.45)" stroke-width="3"/>
  <ellipse id="foamB" cx="${CUP.cx}" cy="${CUP.full}" rx="80" ry="${CUP.ry - 2}" fill="${FOAM}"/>
</svg>`;
const battery = `<svg width="54" height="28" viewBox="0 0 46 24"><rect x="1.5" y="1.5" width="38" height="21" rx="5" fill="none" stroke="#e8ecea" stroke-width="2.5"/><rect x="41" y="8" width="4" height="8" rx="1.5" fill="#e8ecea"/>${[0, 1, 2, 3].map(k => `<rect id="cell${k}" x="${5 + k * 8.5}" y="5" width="6.5" height="14" rx="1.5" fill="var(--accent)" opacity="0"/>`).join('')}</svg>`;
const front = `
<svg class="full" id="cupF" viewBox="0 0 540 960" style="opacity:0">
  <path id="cbody" fill="${BROWN}"/>
  <path id="cnear" fill="${FOAM}"/>
  <path d="M${CUP.cx + CUP.rt - 3},${CUP.top + 44} C${CUP.cx + CUP.rt + 56},${CUP.top + 44} ${CUP.cx + CUP.rt + 52},${CUP.top + 150} ${CUP.cx + CUP.rt - 18},${CUP.top + 150}" fill="none" stroke="${WARM}" stroke-width="14" stroke-linecap="round"/>
  <path id="cupO" d="${cupPath}" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M${CUP.cx - CUP.rt},${CUP.top} A${CUP.rt},${CUP.ry} 0 0 0 ${CUP.cx + CUP.rt},${CUP.top}" fill="none" stroke="${OUTLINE}" stroke-width="4"/>
</svg>
<svg class="full" id="fx" viewBox="0 0 540 960">
  <path id="jet" fill="${BROWN}"/>
  ${DROPS.map((d, i) => `<circle id="dr${i}" r="${d.r.toFixed(1)}" fill="${BROWN}" opacity="0"/>`).join('')}
</svg>
${PILLS.map(p => `
<div class="bd0" id="${p.id}d0" style="left:${BUB.c0.x - BUB.d0 / 2}px;top:${BUB.c0.y - BUB.d0 / 2}px;width:${BUB.d0}px;height:${BUB.d0}px;opacity:0"></div>
<div class="bd1" id="${p.id}d1" style="left:${BUB.c1.x - BUB.d1 / 2}px;top:${BUB.c1.y - BUB.d1 / 2}px;width:${BUB.d1}px;height:${BUB.d1}px;opacity:0"></div>
<div class="bp" id="${p.id}" style="left:${p.cx - p.w / 2}px;width:${p.w}px;top:${BUB.bottom - BUB.h}px;transform-origin:${(BUB.c1.x - p.cx + p.w / 2).toFixed(1)}px 100%;opacity:0">${p.swap ? `<span class="sw" id="${p.id}a"><span>${p.text}</span>${battery}</span><span class="sw" id="${p.id}b" style="opacity:0">${p.swap}</span>` : `<span>${p.text}</span>`}</div>`).join('')}`;

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const cupB = $('cupB'), cupF = $('cupF'), foamB = $('foamB'), cbody = $('cbody'), cnear = $('cnear');
  const st = [$('st0'), $('st1')], steamG = $('steam'), jet = $('jet');
  const drops = [];
  for (let i = 0; i < D.nd; i++) drops.push($('dr' + i));
  const swA = $('p2a'), swB = $('p2b');
  const bubs = D.pills.map(id => [$(id + 'd0'), $(id + 'd1'), $(id)]);
  const cells = [0, 1, 2, 3].map(k => $('cell' + k));
  window.__gag = {
    apply(o) {
      for (const el of [cupB, cupF]) { el.style.opacity = o.cup.o; el.style.transform = 'translateX(' + o.cup.x + 'px)'; }
      foamB.setAttribute('cy', o.L); foamB.setAttribute('rx', o.fw); foamB.style.opacity = o.coffeeO;
      cbody.setAttribute('d', o.body); cbody.style.opacity = o.coffeeO;
      cnear.setAttribute('d', o.near); cnear.style.opacity = o.coffeeO;
      st[0].setAttribute('d', o.steam[0]); st[1].setAttribute('d', o.steam[1]); steamG.style.opacity = o.steamO;
      const x = D.cx, y = D.full, h = o.jet;
      jet.setAttribute('d', h ? 'M' + (x - 11) + ',' + y + ' C' + (x - 9) + ',' + (y - h * 0.6) + ' ' + (x - 6) + ',' + (y - h) + ' ' + x + ',' + (y - h) + ' C' + (x + 6) + ',' + (y - h) + ' ' + (x + 9) + ',' + (y - h * 0.6) + ' ' + (x + 11) + ',' + y + 'Z' : '');
      o.drops.forEach((d, i) => { drops[i].setAttribute('cx', d.x); drops[i].setAttribute('cy', d.y); drops[i].setAttribute('opacity', d.o); });
      o.bubs.forEach((b, j) => b.forEach((e, k) => { bubs[j][k].style.opacity = e.o; bubs[j][k].style.transform = 'scale(' + (j === 1 && k === 2 ? e.s * o.sw.k : e.s) + ')'; }));
      swA.style.opacity = o.sw.a; swB.style.opacity = o.sw.b; swB.style.transform = 'scale(' + o.sw.bs + ')';
      o.cells.forEach((c, k) => cells[k].setAttribute('opacity', c));
    },
  };
}
const DATA = { nd: DROPS.length, pills: PILLS.map(p => p.id), cx: CUP.cx, full: CUP.full };

/* ---------- the sound ----------
   the splash and the slurp from elevenlabs when it serves them, the rest from the kit */
const EL = [
  { kind: 'elSplash', prompt: 'a small object dropping into a full mug of coffee, one big wet liquid splash with droplets, close mic, no music', seconds: 1.2, mode: 'hit', keep: 0.45, gain: -10 },
  { kind: 'elSlurp', prompt: 'a loud comedic slurp, drinking the last of a cup of coffee in one long gulping slurp, close mic, dry', seconds: 1.0, mode: 'hit', keep: 0.55, gain: -9 },
];
function standIns() {
  const N = s => new Float32Array(Math.round(s * SR));
  const rn = seed => { let x = seed | 0; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) / 4294967296) * 2 - 1; }; };
  const lp = (b, hz) => { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0; for (let i = 0; i < b.length; i++) { y = (1 - a) * b[i] + a * y; b[i] = y; } return b; };
  const hp = (b, hz) => { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0, p = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - p); p = b[i]; b[i] = y; } return b; };
  const fin = (b, fi = 0.002, fo = 0.03) => { let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v)); for (let i = 0; i < b.length; i++) b[i] /= pk || 1; const a = Math.round(fi * SR), z = Math.round(fo * SR); for (let i = 0; i < a; i++) b[i] *= i / a; for (let i = 0; i < z; i++) b[b.length - 1 - i] *= i / z; return b; };
  const chirp = (b, at, f0, f1, len, g) => { let ph = 0; const o = Math.round(at * SR); for (let i = 0; i < len * SR && o + i < b.length; i++) { const q = i / (len * SR); ph += 2 * Math.PI * (f0 + (f1 - f0) * q) / SR; b[o + i] += g * Math.sin(ph) * Math.sin(Math.PI * q); } };
  const out = {};
  { const b = N(0.45), r = rn(0x5b1c); for (let i = 0; i < b.length; i++) { const q = i / SR; b[i] = r() * Math.exp(-q / 0.09) * Math.min(1, q / 0.002); } lp(b, 2200); for (const at of [0.08, 0.15, 0.24]) chirp(b, at, 500, 1400, 0.04, 0.4); out.elSplash = fin(b); }
  { const b = N(0.55), r = rn(0x77d1); let ph = 0; for (let i = 0; i < b.length; i++) { const q = i / b.length; ph += 2 * Math.PI * (300 + 500 * q) / SR; b[i] = r() * (0.5 + 0.5 * Math.sin(ph)) * Math.sin(Math.PI * Math.min(1, q * 1.2)); } hp(lp(b, 3000), 400); out.elSlurp = fin(b, 0.01, 0.08); }
  for (const s of EL) { const pcm = out[s.kind]; VOICES[s.kind] = () => pcm; GAINS[s.kind] = s.gain; }
}
let FROM_EL = null;
if (process.argv.includes('--kit')) { standIns(); FROM_EL = 'kit on request'; }
else {
  try { const kept = await elevenSfx(50, EL); FROM_EL = 'elevenlabs'; for (const [k, v] of Object.entries(kept)) console.log('  ' + k + ' ' + v.all.join(', ')); }
  catch (e) { standIns(); FROM_EL = 'kit stand ins, elevenlabs said no: ' + String(e && e.message || e).slice(0, 160); }
}
console.log('\n  the two elevenlabs sounds: ' + FROM_EL);

const CUES = [
  { t: 0, kind: 'whooshUp', opts: { len: 0.30 }, from: 'he jumps up from below' },
  { t: J0.t1, kind: 'land', from: 'lands in the middle' },
  { t: BUB1.at, kind: 'bubble', from: 'good morning, the dots' },
  { t: BUB1.at + 0.14, kind: 'bubble', opts: { f0: 620, f1: 1700 }, from: 'good morning, the pill' },
  { t: YAWN.a + 0.04, kind: 'sigh', opts: { f0: 430, f1: 230, len: 0.48 }, from: 'the yawn' },
  { t: J_UP.t0, kind: 'boing', from: 'he jumps up' },
  { t: CUP_IN.a, kind: 'whoosh', opts: { len: 0.24, seed: 0x6612 }, from: 'the cup slides in' },
  { t: SPLASH, kind: 'elSplash', from: 'the splash' },
  { t: SLURP, kind: 'elSlurp', from: 'the slurp, on its body' },
  { t: J_OUT.t0, kind: 'whooshUp', opts: { len: 0.26, seed: 0x1177 }, from: 'he shoots out' },
  { t: CUP_OUT.a, kind: 'whoosh', opts: { len: 0.22, seed: 0x2d11 }, from: 'the cup slides out' },
  { t: J_OUT.t1, kind: 'land', opts: { f0: 300, f1: 120, tau: 0.06, len: 0.2 }, from: 'lands in the middle, solid' },
  { t: BUB2.at, kind: 'bubble', from: 'fully charged, the dots' },
  { t: BUB2.at + 0.14, kind: 'bubble', opts: { f0: 620, f1: 1700 }, from: 'fully charged, the pill' },
  ...CELLS.map((t, i) => ({ t, kind: 'tock', opts: { f: 1046.5 * Math.pow(2, [0, 4, 7, 12][i] / 12) }, from: 'battery cell ' + (i + 1) })),
  { t: FULL, kind: 'chime', from: 'fully charged' },
  { t: SWAP + 0.04, kind: 'bwop', opts: { step: 2 }, from: 'have a nice day pops' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
const GAIN = { whoosh: -16, whooshUp: -14, bwop: -10, bubble: -11, sigh: -16, tock: -15, chime: -11, land: -11, bounce: -11, boing: -12 };

if (process.argv.includes('--bus')) {
  const { renderList } = await import('./lib/sfx.mjs');
  const { buf } = renderList(CUES, CUT + HOLD, { gains: GAIN });
  const B = Math.round(0.02 * SR), rows = [];
  for (let i = 0; i + B < buf.length; i += B) { let m = 0; for (let j = i; j < i + B; j++) m = Math.max(m, Math.abs(buf[j])); rows.push([i / SR, 20 * Math.log10(m + 1e-9)]); }
  rows.sort((x, y) => y[1] - x[1]);
  console.log(rows.slice(0, 16).map(r => r[0].toFixed(2) + 's ' + r[1].toFixed(1) + 'dB').join('  '));
  process.exit(0);
}

const BEATS = [J0.t1, BUB1.at, YAWN.a, BUB1.out, J_UP.t0, CUP_IN.a, SPLASH, DRAIN.a, J_OUT.t0, CUP_OUT.a, J_OUT.t1, BUB2.at, FULL, SWAP];
const STILLS = [0, 0.20, 0.42, 0.70, 1.05, 1.50, 1.90, 2.15, 2.40, 2.65, 2.76, 2.95, 3.15, 3.35, 3.60, 3.80, 4.00, 4.40, 4.70, 5.00, 5.35, 5.66, 5.80, 6.40, 6.90, 7.10, 7.80];

const inside = r => r && r.l >= MARGIN - 0.5 && r.r <= 540 - MARGIN + 0.5 && r.t >= MARGIN - 0.5 && r.b <= 960 - 150 + 0.5;
const res = await runEpisode({
  post: 50, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  sfx: { cues: CUES, gains: GAIN },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: DATA,
    sleep: [],
    beats: BEATS,
    checks: ['#p1', '#p2'],
    hook: [],
    copy: [...PILLS.map(p => p.text), ...PILLS.filter(p => p.swap).map(p => p.swap)],
    verify: [
      { at: 0, sel: '#m-card', test: r => (r && r.b <= 960 - 150 + 0.5 && Math.abs((r.l + r.r) / 2 - REST.x) < 6 ? null : 'he is not rising up the middle at frame 0') },
      { at: 0.9, sel: '#m-card', test: r => (r && Math.abs((r.t + r.b) / 2 - REST.y) < 14 ? null : 'he is not in the middle after the landing') },
      { at: 3.30, sel: '#m-card', test: r => (r && r.b <= CUP.bot + 8 && r.t >= CUP.top - 4 ? null : 'he is not sat in the empty cup') },
      { at: 2.6, sel: "#cupO", test: r => (inside(r) ? null : 'the cup is past the margin') },
      { at: 5.4, sel: '#p2', test: r => (inside(r) ? null : 'fully charged is past the margin') },
      { at: 6.4, sel: '#p2b', test: r => (inside(r) && r.o > 0.99 ? null : 'have a nice day is not fully on inside the margin') },
      { at: 6.4, sel: '#p2a', test: r => (r ? 'fully charged and the battery are still up after the swap' : null) },
    ],
    log: [[0, 'he jumps up from below'], [J0.t1, 'lands, sleepy'], [BUB1.at, 'good morning'], [YAWN.a, 'the yawn'], [J_UP.t0, 'he jumps up'], [CUP_IN.a, 'the cup slides in'],
      [SPLASH, 'into the cup, the splash'], [DRAIN.a, 'the coffee drains'], [SLURP, 'the slurp'], [J_OUT.t0, 'he shoots out'], [CUP_OUT.a, 'the cup slides out'],
      [J_OUT.t1, 'lands in the middle'], [BUB2.at, 'fully charged'], [FULL, 'the battery is full'], [SWAP, 'have a nice day']],
  },
});

/* ---------- sync and audibility, post48's ---------- */
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
  const struck = CUES.filter(c => !['whoosh', 'whooshUp', 'sigh'].includes(c.kind));
  const secs = CUT + HOLD, rms = (b, t, len) => { let e = 0, k = 0; for (let i = Math.round(t * SR); i < Math.round((t + len) * SR) && i < b.length; i++) { e += b[i] * b[i]; k++; } return Math.sqrt(e / Math.max(1, k)) + 1e-9; };
  const rows = [];
  let worst = Infinity;
  for (const c of struck) {
    const own = renderList([c], secs, { gains: GAIN }).buf, rest = renderList(CUES.filter(x => x !== c), secs, { gains: GAIN }).buf;
    const at = c.t + (c.kind === 'elSlurp' ? 0.12 : 0);
    const d = 20 * Math.log10(rms(own, at, 0.08) / rms(rest, at, 0.08));
    worst = Math.min(worst, d);
    rows.push(c.from + ' ' + (d > 60 ? 'alone' : (d >= 0 ? '+' : '') + d.toFixed(1) + 'dB'));
  }
  console.log('\n  sync: the mp4 audio sits ' + off.toFixed(1) + 'ms off the mastered bus, every cue on its sample in the bus');
  console.log('  audibility, each struck sound over everything else in its first 80ms, worst ' + worst.toFixed(1) + 'dB\n    ' + rows.join('\n    '));
}
