/* the boring tek — post54. captcha fail.

   dark, 1080x1920. three lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, speed 1.0. post53's subtitles, the plain
   end card. the rig is lib/aiafter.mjs with the series off, on the cinematic
   kit: the living camera on every hold, one punch in on the reject, slam for
   the big words, an effect on every move. a short gag, not an explainer, so
   the read has a silent run of action in the middle: `maxGap: 2.0`.

     frame 0   the captcha card, sharp and glowing, I AM NOT A ROBOT, him under it
     l1        can AI pass this test? a curious tilt. on `this` he hops onto the box
     tick      a green tick lands, the card turns into SELECT ALL TRAFFIC LIGHTS,
               a 3x3 grid unfolds under it
     l2        easy. then three hops over the three traffic lights, each tile goes
               green with a click, a timer counts up live and stops at 0.4s
     silence   proud, happy, no voice and no effect
     reject    the punch in. red. TOO PERFECT. slams, YOU ARE A ROBOT. under it. he
               freezes, then turns slowly to the lens and squints
     l3        [sighs] too easy, apparently. the tick comes off the box
     the glitch cut, the plain end card

   line art only, green the one accent, red only on the reject. eyes calm,
   happy, neutral or squint. no hands, no logos, no real brand. on screen copy
   has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post54.mjs          the preview
     node post54.mjs --stills             one still per beat, no render
     node post54.mjs                      60fps
*/

import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO,
  livingCamera, wordIn, wordStyle, CURVE,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const LINES = [
  { key: 'r1', text: '[curious] can AI pass this test?' },
  { key: 'r2', text: '[proud] easy.' },
  { key: 'r3', text: '[sighs] ...too easy, apparently.' },
];
const TAKES = await readLines(54, LINES, 3, MODEL);
const [L1, L2, L3] = TAKES;
const SUBS = [
  { line: 0, text: 'can ai pass this test?' },
  { line: 1, text: 'easy' },
  { line: 2, text: 'too easy, apparently' },
];

/* ---------- the words on screen ---------- */
const W_NOT = 'I AM NOT', W_ROBOT = 'A ROBOT', W_SEL = 'select all', W_TRAF = 'TRAFFIC', W_LIGHTS = 'LIGHTS';
const W_TOO = 'TOO PERFECT.', W_YOU = 'YOU ARE A ROBOT.';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 610, size: 118, scale: 1.0 };
const CARD = { x: 60, y: 180, w: 420, h: 140 };
const BOX = { x: 86, y: 212, s: 76 };
const LAB = { x: 186 };
const GRID = { x: 86, y: 340, t: 116, gap: 10 };
const tileAt = i => ({ x: GRID.x + (i % 3) * (GRID.t + GRID.gap), y: GRID.y + Math.floor(i / 3) * (GRID.t + GRID.gap) });
const TILES = ['car', 'light', 'tree', 'light', 'house', 'bus', 'tree', 'car', 'light'];
const RUN_TILES = [1, 3, 8];
const SMALL = 0.55, TINY = 0.5;
const headS = s => 118 * s / 2;
const P0 = { x: 270, y: 610, s: 1.0 };
/* on frame 0 the card sits lower, in the middle with him, and rises as the grid opens */
const CDROP = 130;
const ON_BOX = { x: BOX.x + BOX.s / 2, y: BOX.y - headS(SMALL) + 3, s: SMALL };
const ON_TILE = RUN_TILES.map(i => { const p = tileAt(i); return { x: p.x + GRID.t / 2, y: p.y + GRID.t / 2 + 4, s: TINY }; });
const TMR = { r: GRID.x + 3 * GRID.t + 2 * GRID.gap, y: GRID.y + 3 * GRID.t + 2 * GRID.gap + 16 };
const WY = { too: 458, you: 514 };
const PLATE = { x: 66, w: 408, t: 422, h: 124 };

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
place(L1, 0.30);
const CURIOUS = w(L1, 'AI');
const HOP_A = w(L1, 'this');
const LAND_A = +(HOP_A + 0.42).toFixed(3);
const TICK_AT = +(LAND_A + 0.1).toFixed(3);
const OPEN = +(TICK_AT + 0.22).toFixed(3);
const cardDy = t => +(CDROP * (1 - CURVE.out(span(t, OPEN - 0.04, OPEN + 0.36)))).toFixed(3);
const SEL_AT = +(OPEN + 0.1).toFixed(3);
place(L2, Math.max(L1.end + VGAP, SEL_AT + 0.35));
/* the run: three hops, tight enough to read as one move */
const RUN = +(L2.end + 0.06).toFixed(3);
const HOPD = [0.18, 0.15, 0.17];
const LANDS = HOPD.reduce((a, d, i) => [...a, +((i ? a[i - 1] : RUN) + d).toFixed(3)], []);
const DONE = LANDS[2];
/* the silence: nothing between the last click and the reject */
const HUSH = 0.55;
const REJ = +(DONE + HUSH).toFixed(3);
const YOU_AT = +(REJ + 0.28).toFixed(3);
const TURN = +(REJ + 0.45).toFixed(3), TURN_D = 0.7;
place(L3, Math.min(REJ + 0.5, L2.end + 1.98));
const UNCHECK = w(L3, 'apparently');
const CUT = +(L3.end + 0.45).toFixed(3);
const HOLD = 1.2;
if (L3.at - L2.end > 2.0) throw new Error('the gap before line 3 is over 2.0s');
if (L3.at < YOU_AT + 0.2) throw new Error('line 3 starts on top of the reject');

const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });

/* ---------- the camera ---------- */
const camera = livingCamera({
  F: { x: 270, y: 440 },
  holds: [[0.3, HOP_A - 0.05], [SEL_AT + 0.4, RUN - 0.02], [DONE + 0.02, REJ - 0.02], [YOU_AT + 0.4, CUT]],
  punches: [REJ],
});

/* ---------- where he is, and how big ---------- */
const hopArc = (t, a, b, A, B, h) => {
  const k = EASE(span(t, a, b));
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * span(t, a, b)), s: lerp(A.s, B.s, k) };
};
const lin = (t, a, b, A, B, h) => {
  const k = span(t, a, b);
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * k), s: lerp(A.s, B.s, k) };
};
function where(t) {
  if (t < HOP_A) return P0;
  if (t < LAND_A) return hopArc(t, HOP_A, LAND_A, P0, { ...ON_BOX, y: ON_BOX.y + CDROP }, 26);
  if (t < RUN) return { ...ON_BOX, y: ON_BOX.y + cardDy(t) };
  if (t < LANDS[0]) return lin(t, RUN, LANDS[0], ON_BOX, ON_TILE[0], 34);
  if (t < LANDS[1]) return lin(t, LANDS[0], LANDS[1], ON_TILE[0], ON_TILE[1], 26);
  if (t < TURN) return lin(t, LANDS[1], LANDS[2], ON_TILE[1], ON_TILE[2], 34);
  /* the turn to the lens: he comes a touch closer, slowly */
  return { ...ON_TILE[2], s: lerp(TINY, 0.6, CURVE.dolly(span(t, TURN, TURN + TURN_D))) };
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const tc = i => { const p = tileAt(i); return AT(p.x + GRID.t / 2, p.y + GRID.t / 2); };
const LOOKS = [
  { at: 0, to: AT(BOX.x + BOX.s / 2, BOX.y + CDROP + BOX.s / 2) },
  { at: LAND_A, to: AT(BOX.x + BOX.s / 2, BOX.y + CDROP + 60) },
  { at: SEL_AT, to: AT(330, 400) },
  { at: L2.at, to: LENS },
  { at: RUN, to: tc(3) },
  { at: LANDS[0] + 0.02, to: tc(8) },
  { at: DONE + 0.05, to: LENS },
  { at: REJ + 0.04, to: AT(270, WY.too) },
  { at: TURN, to: LENS, d: TURN_D },
];
const BLINKS = [1.1, +(L3.end - 0.35).toFixed(3)];
const HAPPY = [+(L2.at + 0.02).toFixed(3), DONE + 0.06];
const HOPS = [[DONE + 0.08, 9]];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const p = where(t);
  const lens = { x: p.x, y: p.y, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + (LOOKS[i].d ?? 0.18)));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  /* the squint comes in with the turn and stays */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, TURN + 0.2, TURN + TURN_D)));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  let dy = 0, rot = 0, sq = 0;
  for (const [h, up] of HOPS) dy -= up * Math.sin(Math.PI * span(t, h, h + 0.3));
  /* the curious tilt on `AI` */
  rot += 7 * bump(t, CURIOUS, 0.2, 0.6, 0.3);
  /* a squash on every landing */
  sq += 0.07 * Math.sin(Math.PI * span(t, LAND_A - 0.02, LAND_A + 0.18));
  for (const a of LANDS) sq += 0.07 * Math.sin(Math.PI * span(t, a - 0.01, a + 0.12));
  /* the freeze: a hard little stop on the reject, then nothing */
  sq -= 0.05 * Math.sin(Math.PI * span(t, REJ, REJ + 0.12));
  /* the idle breath, only while he stands still and before the freeze */
  const still = t < HOP_A || (t > LAND_A + 0.2 && t < RUN) || (t > DONE + 0.4 && t < REJ);
  if (still) dy += 2.5 * Math.sin(2 * Math.PI * t / 2.2);
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy + dy), rot: f3(rot), sq: f3(sq), s: f3(p.s) };
}

/* ---------- a frame of the story ---------- */
const ws = (S, id, wv, k = 1) => { const st = wordStyle(wv); S.push([id, 'opacity', f3(st.opacity * k)], [id, 'transform', st.transform], [id, 'filter', st.filter]); };
function frame(t) {
  const A = [], S = [], X = [];
  /* the card glows on frame 0 and breathes until he lands */
  S.push(['halo', 'opacity', f3(t < LAND_A ? 0.75 + 0.25 * Math.cos(2 * Math.PI * t / 1.4) : 0.75 * (1 - out(t, LAND_A, 0.4)))]);
  /* the tick in the box */
  const tk = pop(t, TICK_AT, 0.35, 0.3);
  /* on `apparently` the tick in the box comes off: not verified after all */
  const un = CURVE.out(span(t, UNCHECK, UNCHECK + 0.22));
  S.push(['btick', 'opacity', f3(tk.o * (1 - un))], ['btick', 'transform', 'scale(' + f3(tk.s * (1 - 0.5 * un)) + ')']);
  S.push(['cardw', 'transform', 'translateY(' + cardDy(t) + 'px)']);
  /* the label swaps: I AM NOT A ROBOT goes, SELECT ALL TRAFFIC LIGHTS slams */
  S.push(['lab1', 'opacity', f3(1 - out(t, OPEN, 0.12))]);
  ws(S, 'lab2', t < SEL_AT ? { o: 0, s: 1, y: 0, blur: 0 } : wordIn(t, SEL_AT, 'slam'));
  /* the grid unfolds from the card, tile by tile */
  for (let i = 0; i < 9; i++) {
    const a = OPEN + 0.035 * (Math.floor(i / 3) + (i % 3)), p = pop(t, a, 0.36, 0.7);
    S.push(['t' + i, 'opacity', p.o], ['t' + i, 'transform', 'scale(' + p.s + ')']);
  }
  /* each traffic light goes green as he lands on it */
  RUN_TILES.forEach((i, k) => {
    const a = LANDS[k], on = f3(smooth(span(t, a, a + 0.06)));
    S.push(['on' + i, 'opacity', on]);
    const g = pop(t, a, 0.25, 0.4);
    S.push(['ok' + i, 'opacity', g.o], ['ok' + i, 'transform', 'scale(' + g.s + ')']);
  });
  /* the timer counts up live while he hops, and stops at 0.4s */
  const tm = t < RUN ? 0 : t >= DONE ? 0.4 : Math.min(0.39, 0.4 * span(t, RUN, DONE));
  X.push(['tmr', tm.toFixed(1) + 's']);
  S.push(['tmr', 'opacity', f3(smooth(span(t, RUN - 0.12, RUN)))]);
  /* the reject: red over the card and the grid, the tiles go dim, the words slam */
  const red = f3(smooth(span(t, REJ, REJ + 0.06)));
  S.push(['redw', 'opacity', red], ['gin', 'opacity', f3(1 - 0.72 * red)], ['tmr', 'color', red > 0.5 ? 'var(--red)' : 'var(--accent)']);
  const tz = wordIn(t, REJ, 'slam');
  S.push(['plate', 'opacity', f3(smooth(span(t, REJ, REJ + 0.05)))]);
  ws(S, 'wtoo', t < REJ ? { o: 0, s: 1, y: 0, blur: 0 } : tz);
  ws(S, 'wyou', t < YOU_AT ? { o: 0, s: 1, y: 0, blur: 0 } : wordIn(t, YOU_AT, 'slam'));
  return { A, S, X };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 10px rgba(255,255,255,.55)) drop-shadow(0 0 26px rgba(255,255,255,.30))';
/* the reject red, this clip only, the one exception to the single accent */
const RED = '#ff5b5b';
const css = `
#scA{position:absolute;inset:0;--red:${RED}}
#cardw{position:absolute;inset:0;will-change:transform}
#cardw>svg,#redw>svg{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
.ln{fill:none;stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.ic{fill:none;stroke:rgba(233,238,236,.62);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.lt{fill:none;stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
#halo{filter:${GLOW};will-change:opacity}
.lab{position:absolute;left:${LAB.x}px;top:${CARD.y}px;height:${CARD.h}px;display:flex;flex-direction:column;justify-content:center;will-change:transform,opacity,filter}
.lab b{display:block;font:400 30px/1.25 var(--display);color:#f7f9f8;letter-spacing:.05em;white-space:nowrap;-webkit-text-stroke:.6px #fff;filter:${GLOW_LO}}
#lab2{opacity:0;transform-origin:0 50%}
#lab2 i{display:block;font:400 15px/1 var(--mono);color:var(--sub);letter-spacing:.16em;font-style:normal;margin-bottom:10px}
#lab2 b{font-size:28px;line-height:1.22}
#btick{position:absolute;left:${BOX.x}px;top:${BOX.y}px;width:${BOX.s}px;height:${BOX.s}px;display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity}
.tile{position:absolute;width:${GRID.t}px;height:${GRID.t}px;opacity:0;will-change:transform,opacity}
.tile>svg{position:absolute;left:0;top:0;width:${GRID.t}px;height:${GRID.t}px}
.tile .on{position:absolute;inset:0;border:2.6px solid var(--accent);border-radius:12px;background:rgba(80,255,140,.08);opacity:0}
.tile .ok{position:absolute;right:-9px;top:-9px;width:26px;height:26px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity}
#gin{position:absolute;inset:0;will-change:opacity}
#redw{position:absolute;inset:0;opacity:0;filter:drop-shadow(0 0 10px rgba(255,91,91,.45));will-change:opacity}
#tmr{position:absolute;left:${TMR.r - 140}px;width:140px;top:${TMR.y}px;text-align:right;font:500 30px/1 var(--mono);color:var(--accent);letter-spacing:.06em;opacity:0}
.big{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
.big b{display:block;font:400 34px/1 var(--display);color:#f7f9f8;letter-spacing:.04em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
#wyou b{font-size:21px;letter-spacing:.06em}
#plate{position:absolute;left:${PLATE.x}px;top:${PLATE.t}px;width:${PLATE.w}px;height:${PLATE.h}px;border-radius:16px;background:rgba(6,7,10,.9);opacity:0;will-change:opacity}
`;
const TICKSVG = (sz, sw) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="#06070a" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
/* the tile art, line art in a 116 box */
const ART = {
  light: `<rect class="lt" x="42" y="16" width="32" height="66" rx="10"/><circle class="lt" cx="58" cy="32" r="7"/><circle class="lt" cx="58" cy="49" r="7"/><circle class="lt" cx="58" cy="66" r="7"/><path class="lt" d="M58 82 V102"/>`,
  car: `<path class="ic" d="M20 78 V64 L32 60 L42 46 H72 L84 60 L96 64 V78 Z"/><circle class="ic" cx="38" cy="80" r="8" style="fill:#06070a"/><circle class="ic" cx="78" cy="80" r="8" style="fill:#06070a"/>`,
  tree: `<circle class="ic" cx="58" cy="46" r="24"/><path class="ic" d="M58 70 V98"/>`,
  house: `<path class="ic" d="M30 96 V58 L58 34 L86 58 V96 Z"/><path class="ic" d="M51 96 V76 H65 V96"/>`,
  bus: `<rect class="ic" x="22" y="36" width="72" height="48" rx="8"/><path class="ic" d="M22 58 H94"/><circle class="ic" cx="38" cy="86" r="7" style="fill:#06070a"/><circle class="ic" cx="78" cy="86" r="7" style="fill:#06070a"/>`,
};
const tiles = TILES.map((k, i) => {
  const p = tileAt(i), run = RUN_TILES.includes(i);
  return `<div class="tile" id="t${i}" style="left:${p.x}px;top:${p.y}px;transform-origin:50% 50%">
    <svg viewBox="0 0 ${GRID.t} ${GRID.t}"><rect class="ic" x="1.3" y="1.3" width="${GRID.t - 2.6}" height="${GRID.t - 2.6}" rx="12" style="stroke:rgba(233,238,236,.42)"/>${ART[k]}</svg>
    ${run ? `<span class="on" id="on${i}"></span><span class="ok" id="ok${i}">${TICKSVG(16, 3.6)}</span>` : ''}
  </div>`;
}).join('');
const redTiles = TILES.map((k, i) => { const p = tileAt(i); return `<rect x="${p.x + 1.3}" y="${p.y + 1.3}" width="${GRID.t - 2.6}" height="${GRID.t - 2.6}" rx="12"/>`; }).join('');
const markup = `
<div id="scA">
  <div id="cardw">
  <svg viewBox="0 0 540 960">
    <g id="halo"><rect class="ln" x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="18"/><rect class="ln" x="${BOX.x}" y="${BOX.y}" width="${BOX.s}" height="${BOX.s}" rx="12" style="stroke-width:3.4"/></g>
    <rect class="ln" x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="18" style="fill:#06070a"/>
    <rect class="ln" x="${BOX.x}" y="${BOX.y}" width="${BOX.s}" height="${BOX.s}" rx="12" style="stroke-width:3.4"/>
  </svg>
  <div class="lab" id="lab1"><b>${W_NOT}</b><b>${W_ROBOT}</b></div>
  <div class="lab" id="lab2"><i>${W_SEL}</i><b>${W_TRAF}</b><b>${W_LIGHTS}</b></div>
  <div id="btick"><svg width="${BOX.s - 14}" height="${BOX.s - 14}" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
  </div>
  <div id="gin">${tiles}</div>
  <div id="redw"><svg viewBox="0 0 540 960" style="fill:none;stroke:${RED};stroke-width:2.8">
    <rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="18"/>${redTiles}
  </svg></div>
  <div id="tmr">0.0s</div>
</div>`;
const front = `
<div id="plate"></div>
<div class="big" id="wtoo" style="top:${WY.too}px"><b>${W_TOO}</b></div>
<div class="big" id="wyou" style="top:${WY.you}px"><b>${W_YOU}</b></div>`;

function page() {
  const els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.A) { const key = id + '|' + k; if (last[key] !== v) { last[key] = v; $(id).setAttribute(k, v); } }
      for (const [id, k, v] of o.S) { const key = id + '#' + k; if (last[key] !== v) { last[key] = v; $(id).style[k] = v; } }
      for (const [id, v] of o.X) { const key = id + '$'; if (last[key] !== v) { last[key] = v; $(id).textContent = v; } }
    },
  };
}

/* ---------- the sound: an effect on every move, the three clicks tight, and
   nothing at all in the silence before the reject ---------- */
const CUES = [
  { t: HOP_A + 0.17, kind: 'whoosh', opts: { len: 0.28 }, from: 'the hop onto the box, fastest mid air' },
  { t: LAND_A, kind: 'land', from: 'he lands on the box' },
  { t: TICK_AT + 0.02, kind: 'chime', from: 'the tick lands' },
  { t: OPEN - 0.04, kind: 'whooshUp', opts: { len: 0.3 }, from: 'the grid unfolds' },
  { t: SEL_AT + 0.04, kind: 'popDeep', from: 'SELECT ALL TRAFFIC LIGHTS slams, contact' },
  { t: LANDS[0], kind: 'tock', opts: { f: 1500 }, from: 'tile one' },
  { t: LANDS[1], kind: 'tock', opts: { f: 1750 }, from: 'tile two' },
  { t: LANDS[2], kind: 'tock', opts: { f: 2050 }, from: 'tile three, the timer stops' },
  { t: REJ + 0.03, kind: 'popDeep', opts: { f0: 80, f1: 44, len: 0.32 }, from: 'TOO PERFECT slams, contact' },
  { t: REJ + 0.03, kind: 'hum', opts: { len: 0.55, f: 62, rise: 0.02, fall: 0.3 }, from: 'the reject, the error tone' },
  { t: UNCHECK + 0.03, kind: 'tock', opts: { f: 700 }, from: 'the tick comes off the box' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
for (const c of CUES) if (c.t > DONE + 0.05 && c.t < REJ) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [0.3, CURIOUS, HOP_A, TICK_AT, OPEN, SEL_AT, L2.at, ...LANDS, REJ, YOU_AT, TURN, L3.at, UNCHECK];
const STILLS = [0, CURIOUS + 0.25, HOP_A + 0.2, TICK_AT + 0.2, SEL_AT + 0.3, L2.at + 0.15, LANDS[0] + 0.03, LANDS[1] + 0.03, DONE + 0.15, DONE + 0.4,
  REJ + 0.12, YOU_AT + 0.3, TURN + 0.4, L3.at + 0.5, UNCHECK + 0.3, CUT - 0.15, CUT + 0.6];

const res = await runEpisode({
  post: 54, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: false,
  maxGap: 2.0,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { whoosh: -21, popDeep: -15, bass: -20, tock: -8, hum: -14 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: {},
    sleep: [],
    beats: BEATS,
    checks: ['#lab1', '#lab2', '#scA svg rect', '#t0', '#t2', '#t8', '#tmr', '#wtoo b', '#wyou b'],
    hook: ['#lab1', '#halo'],
    copy: [W_NOT, W_ROBOT, W_SEL, W_TRAF, W_LIGHTS, W_TOO, W_YOU, '0.4s'],
    verify: [
      /* he sits on the box, not inside it */
      { at: LAND_A + 0.25, sel: '#m-card', test: r => (r && r.b <= BOX.y + CDROP + 8 ? null : 'he sinks into the box: ' + JSON.stringify(r)) },
      /* the slammed words stay inside the margins and clear of him */
      { at: YOU_AT + 0.6, sel: '#wtoo b', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'TOO PERFECT. is off its spot: ' + JSON.stringify(r)) },
      { at: YOU_AT + 0.6, sel: '#wyou b', test: r => (r && r.l >= 60 && r.r <= 480 && r.b < ON_TILE[2].y - headS(0.6) - 4 ? null : 'YOU ARE A ROBOT. is off its spot: ' + JSON.stringify(r)) },
      { at: SEL_AT + 0.6, sel: '#lab2', test: r => (r && r.r <= CARD.x + CARD.w - 10 ? null : 'TRAFFIC LIGHTS leaves the card: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [CURIOUS, 'the tilt'], [HOP_A, 'the hop'], [TICK_AT, 'the tick'], [OPEN, 'the grid'], [SEL_AT, 'SELECT ALL slams'], [L2.at, 'line 2'],
      [LANDS[0], 'tile one'], [LANDS[1], 'tile two'], [DONE, 'tile three'], [REJ, 'the reject'], [YOU_AT, 'YOU ARE A ROBOT'], [TURN, 'the turn'], [L3.at, 'line 3'], [UNCHECK, 'the tick comes off'], [CUT, 'the cut']],
  },
});
void res;
