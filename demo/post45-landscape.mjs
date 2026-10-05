/* the boring tek — post45, landscape. the bouncing ai agent, for the website.

   1920x1080. the tiktok layout, untouched: the switch, the slider, the cards
   and the keyboard in the same order with the same moves, the whole 540x960
   column put through the rig's camera at 0.76 and centred, so everything fits
   the height with the house 60 css px over and under it. the sides are the dark stage
   and its faint dot grid, nothing else. same timing, the same cue list from
   lib/sfx.mjs mastered by the rig as an effects only track, the glitch and
   the wordmark end card. the rig is lib/aiafter.mjs with `stage` set to
   960x540 css.

     DEMO_FPS=12 node post45-landscape.mjs     the preview
     node post45-landscape.mjs                 60fps
*/

import {
  runEpisode, span, lerp, smooth, bump, clamp, EASE, SPRING, IO, MARGIN,
} from './lib/aiafter.mjs';

/* ---------- where things sit, css px of the 540x960 stage ---------- */
const SCALE = 0.8;
const MAS = { cx: 0, cy: 0, size: 118, scale: SCALE };
const R = MAS.size * SCALE * 30 / 64;               /* the plate's radius as drawn, 44.3 */
const D = 2 * R;
/* the switch and the slider are sized round him: he is exactly their knob */
const SW = { cx: 270, cy: 440, pad: 5 };
SW.h = +(D + SW.pad * 2).toFixed(2); SW.w = +(SW.h * 1.66).toFixed(2);
const SW_X = [SW.cx - SW.w / 2 + SW.pad + R, SW.cx + SW.w / 2 - SW.pad - R];
const SL = { y: 530, h: 4, x0: 120, x1: 420, ticks: 11 };
SL.l = SL.x0 - R; SL.r = SL.x1 + R;
const TICK_X = Array.from({ length: SL.ticks }, (_, i) => SL.x0 + (SL.x1 - SL.x0) * i / (SL.ticks - 1));
const HDR = { top: 220, size: 44 };
const CARD = { cx: 270, top: 648, w: 370, h: 84, x: 330, peek: 10 };
const KEY = { w: 34, h: 34, gap: 6, row: 8, pad: 10 };
const KB = { l: 66, w: 408, top: 620 };
KB.h = KEY.pad * 2 + 3 * KEY.h + 2 * KEY.row;
const FIELD = { l: 70, w: 400, top: 452, h: 46 };
MAS.cx = +SW_X[0].toFixed(3);
MAS.cy = SW.cy;
const BLUE = '#0a84ff';
/* the column into the wide frame: its content runs from the words at 210, as
   they rise to fade, to the keyboard's foot at 762 as it dips, scaled to fit
   420 of the 540 and centred */
const WIDE = { w: 960, h: 540, k: 0.76, top: 210, bottom: 762 };
WIDE.tx = +(WIDE.w / 2 - 270 * WIDE.k).toFixed(3);
WIDE.ty = +(WIDE.h / 2 - (WIDE.top + WIDE.bottom) / 2 * WIDE.k).toFixed(3);
const camera = () => ({ s: WIDE.k, tx: WIDE.tx, ty: WIDE.ty });

/* the keys, and where each one's middle sits on the stage */
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const KEYAT = {};
ROWS.forEach((r, ri) => {
  const w = r.length * KEY.w + (r.length - 1) * KEY.gap, l0 = (KB.w - w) / 2;
  [...r].forEach((c, ci) => { KEYAT[c] = { l: l0 + ci * (KEY.w + KEY.gap), t: KEY.pad + ri * (KEY.h + KEY.row) }; });
});
const keyMid = c => ({ x: KB.l + KEYAT[c].l + KEY.w / 2, y: KB.top + KEYAT[c].t + KEY.h / 2 });
const WORD = 'done';

/* ---------- the beats, tight, nothing waits ---------- */
const HOP0 = 0.55;                                   /* a small hop in the track */
const CLICK = 1.00;
const SLIDE = { a: CLICK, b: CLICK + 0.26 };
const HDR_OUT = 1.50;
const INTO_SL = 2.15;                                /* lands in the slider */
const ROLL = { a: INTO_SL + 0.10, b: INTO_SL + 1.00 };
const CARDS_IN = ROLL.b - 0.25;
const UP = 0.07, AIR = 0.74;
const HITS = [3.80];
HITS.push(+(HITS[0] + UP + AIR).toFixed(4), +(HITS[0] + 2 * (UP + AIR)).toFixed(4));
const TXT = HITS.map(h => +(h + 0.10).toFixed(4));
const POPS = HITS.map(h => +(h + 0.26).toFixed(4));
const KB_IN = POPS[2] - 0.05;
const KEY_AT = [+(HITS[2] + UP + AIR).toFixed(4)];
const KEY_STEP = 0.36, KEY_HOP = 0.24;
for (let i = 1; i < WORD.length; i++) KEY_AT.push(+(KEY_AT[0] + KEY_STEP * i).toFixed(4));
/* the end: off the e, up to the middle above the field with one fast spin, a landing on nothing, a wink */
const UPJ = { t0: +(KEY_AT[3] + 0.12).toFixed(4), dur: 0.55 };
UPJ.t1 = +(UPJ.t0 + UPJ.dur).toFixed(4);
const WINK = { at: +(UPJ.t1 + 0.22).toFixed(4), close: 0.06, hold: 0.22, open: 0.10 };
const LENS_AT = UPJ.t0 + 0.12;
const HAPPY = [{ at: SLIDE.b - 0.02 }, { at: ROLL.b - 0.04 }];
const CUT = +(WINK.at + WINK.close + WINK.hold + WINK.open + 0.16).toFixed(4);
const HOLD = 1.1;

/* ---------- the ball ----------
   a place is { x, y, plat, mid }: y is his centre. in the switch and the slider
   he is the knob, so he squashes about his middle (`mid`); on a card or a key
   he stands on it, so the squash keeps his bottom on the surface. a jump is
   { t0 liftoff, t1 landing, a, b, h apex over the chord, ant the squash that
   loads it, hit the squash that lands it } */
const P_SW = i => ({ x: SW_X[i], y: SW.cy, plat: 'sw', mid: true });
const P_SL = x => ({ x, y: SL.y, plat: 'sl', mid: true });
const P_CARD = { x: CARD.x, y: CARD.top - R, plat: 'card' };
/* on a key his bottom sits a little into it, so he reads as pressing it */
const P_KEY = c => ({ x: keyMid(c).x, y: KB.top + KEYAT[c].t + 8 - R, plat: 'kb', key: c });
/* the middle of the screen, above the done field: he lands there on nothing */
const P_AIR = { x: 270, y: FIELD.top - 38 - R, plat: 'air' };
const JUMPS = [];
const jump = (t1, dur, a, b, h, ant = 0.12, hit = 0.16, antFor = 0.12) => JUMPS.push({ t0: +(t1 - dur).toFixed(4), t1: +t1.toFixed(4), a, b, h, ant, hit, antFor });
jump(HOP0 + 0.26, 0.26, P_SW(0), P_SW(0), 12, 0.06, 0.08, 0.08);
jump(INTO_SL, 0.52, P_SW(1), P_SL(SL.x0), 64, 0.10, 0.14, 0.10);
jump(HITS[0], 0.52, P_SL(SL.x1), P_CARD, 56, 0.10, 0.2, 0.10);
jump(HITS[1], AIR, P_CARD, P_CARD, 104, 0.05, 0.2, UP);
jump(HITS[2], AIR, P_CARD, P_CARD, 104, 0.05, 0.2, UP);
jump(KEY_AT[0], AIR, P_CARD, P_KEY(WORD[0]), 96, 0.05, 0.18, UP);
for (let i = 1; i < WORD.length; i++) jump(KEY_AT[i], KEY_HOP, P_KEY(WORD[i - 1]), P_KEY(WORD[i]), 36, 0.05, 0.14, 0.06);
/* the apex is the landing: h a quarter of the rise, so he arrives with no speed left */
jump(UPJ.t1, UPJ.dur, P_KEY(WORD[3]), P_AIR, (P_KEY(WORD[3]).y - P_AIR.y) / 4, 0.10, 0.12, 0.10);
JUMPS[JUMPS.length - 1].spin = true;
JUMPS.sort((x, y) => x.t0 - y.t0);
const J = f => JUMPS.find(f);
const SW_OUT = J(j => j.a.plat === 'sw' && j.b.plat === 'sl').t0 + 0.06;
const SL_IN = SW_OUT - 0.10;
const SL_OUT = J(j => j.a.plat === 'sl').t0 + 0.08;

/* his centre, unsquashed, his squash, his turn and what he is on, at t */
function ball(t) {
  let pos = P_SW(0), sq = 0, rot = 0, air = null, last = null;
  for (const j of JUMPS) {
    if (t >= j.t1) { pos = j.b; last = j; continue; }
    if (t >= j.t0) { air = j; break; }
    if (t >= j.t0 - j.antFor) sq += j.ant * Math.sin(Math.PI / 2 * EASE(span(t, j.t0 - j.antFor, j.t0)));
    break;
  }
  let x = pos.x, y = pos.y, plat = pos.plat, mid = !!pos.mid;
  if (air) {
    const u = span(t, air.t0, air.t1), d = air.t1 - air.t0;
    x = lerp(air.a.x, air.b.x, u);
    y = lerp(air.a.y, air.b.y, u) - 4 * air.h * u * (1 - u);
    /* stretched along the speed: most at liftoff and landing, round at the apex */
    const vy = (air.b.y - air.a.y) / d - 4 * air.h * (1 - 2 * u) / d;
    const vmax = Math.max(Math.abs((air.b.y - air.a.y) / d) + 4 * air.h / d, 1);
    sq = -0.13 * clamp(Math.abs(vy) / vmax, 0, 1) * smooth(span(t, air.t0, air.t0 + 0.035));
    rot = air.spin ? 360 * IO(span(u, 0.12, 0.78)) : 7 * Math.sign(air.b.x - air.a.x) * Math.sin(Math.PI * u);
    plat = null; mid = !!air.b.mid;
  } else if (last) {
    const dt = t - last.t1;
    sq += last.hit * Math.exp(-dt / 0.11) * Math.cos(2 * Math.PI * dt / 0.34);
  }
  /* the click: he slides across as the knob, wide with the speed, and settles */
  if (!air && plat === 'sw' && t >= SLIDE.a) {
    const p = span(t, SLIDE.a, SLIDE.b);
    x = lerp(SW_X[0], SW_X[1], EASE(p));
    sq += 0.10 * Math.sin(Math.PI * p);
    if (t > SLIDE.b) { const dt = t - SLIDE.b; sq -= 0.07 * Math.exp(-dt / 0.10) * Math.sin(2 * Math.PI * dt / 0.30); }
  }
  /* the roll along the slider, a full turn */
  if (!air && plat === 'sl' && t >= ROLL.a) {
    const p = IO(span(t, ROLL.a, ROLL.b));
    x = lerp(SL.x0, SL.x1, p);
    rot = 360 * p;
  }
  return { x, y, sq, rot, plat, mid };
}
/* what he lands on gives a little under him, in px */
function dip(t, plat, amount) {
  let d = 0;
  for (const j of JUMPS) {
    if (j.b.plat !== plat || t < j.t1) continue;
    const dt = t - j.t1;
    if (dt > 0.6) continue;
    d += amount * (j.hit / 0.2) * Math.exp(-dt / 0.10) * Math.cos(2 * Math.PI * dt / 0.30);
  }
  for (const j of JUMPS) {
    if (j.a.plat !== plat || t < j.t0 - j.antFor || t > j.t0) continue;
    d += amount * 0.5 * (j.ant / 0.12) * Math.sin(Math.PI / 2 * EASE(span(t, j.t0 - j.antFor, j.t0)));
  }
  return d;
}
const DIP = { sw: 3, sl: 3, card: 11, kb: 3, air: 7 };
const cardFront = t => { for (let k = 0; k < 3; k++) if (t < POPS[k] + 0.12) return k; return 3; };

/* ---------- where he looks ---------- */
const LENS = () => ({ x: 0, y: 0, w: 0 });
const at = c => () => ({ ...keyMid(c), w: 1 });
const LOOKS = [
  { at: 0, f: LENS },
  { at: CLICK - 0.25, f: () => ({ x: SW_X[1] + 50, y: SW.cy, w: 1 }) },
  { at: SLIDE.b + 0.04, f: LENS },
  { at: SW_OUT - 0.40, f: () => ({ x: SL.x0 - 30, y: SL.y + 20, w: 1 }) },
  { at: ROLL.a + 0.04, f: () => ({ x: SL.x1 + 60, y: SL.y - 10, w: 1 }) },
  { at: ROLL.b - 0.05, f: () => ({ x: CARD.cx - 90, y: CARD.top + 40, w: 1 }) },
  { at: HITS[0] - 0.05, f: LENS },
  { at: HITS[2] + 0.30, f: at(WORD[0]) },
  ...[1, 2, 3].map(i => ({ at: KEY_AT[i - 1] + 0.02, f: at(WORD[i]) })),
  { at: LENS_AT, f: LENS },
];
const BLINKS = [0.20, HITS[1] + 0.45];
function face(t) {
  const b = ball(t);
  const lens = { x: b.x, y: b.y, w: 0 };
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].f(t)), prev = i ? f(LOOKS[i - 1].f(t)) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.18));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    /* a blink stops at a slit too: at 1 both eyes vanish and a still reads as a blank disc */
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h.at, 0.10, 0.28, 0.14));
  /* the wink: his left eye shuts and opens, the right one goes happy, 0.52s */
  const w = WINK, c = w.at + w.close, hd = c + w.hold;
  /* shut is a slit, 0.84: at 1 the lid swallows the eye and he reads one eyed, not winking */
  const wl = 0.84 * (t < w.at ? 0 : t < c ? IO(span(t, w.at, c)) : t < hd ? 1 : 1 - smooth(span(t, hd, hd + w.open)));
  const eyes = t >= w.at - 0.05 ? [{ lid: +Math.max(lid, wl).toFixed(4), arc: 0 }, { lid, arc: +(0.6 * bump(t, w.at - 0.04, 0.10, 0.28, 0.14)).toFixed(4) }] : null;
  /* standing, the squash keeps his bottom down; as a knob he squashes about his middle */
  const d = b.plat ? dip(t, b.plat, DIP[b.plat]) : 0;
  return {
    lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, ...(eyes ? { eyes } : {}),
    dx: +(b.x - MAS.cx).toFixed(3), dy: +(b.y + (b.mid ? 0 : R * b.sq) + d - MAS.cy).toFixed(3),
    rot: +b.rot.toFixed(3), sq: +b.sq.toFixed(4),
  };
}

/* ---------- a frame of the ui ---------- */
const pop = (t, a, d = 0.42) => ({ s: +lerp(0.72, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.12)).toFixed(3) });
const out = (t, a, d = 0.22) => ({ s: +lerp(1, 0.6, EASE(span(t, a, a + d))).toFixed(4), o: +(1 - smooth(span(t, a, a + d))).toFixed(3) });
function frame(t) {
  const b = ball(t);
  /* the words, on from frame 0, gone once the switch is on */
  const hdr = { o: +(1 - smooth(span(t, HDR_OUT, HDR_OUT + 0.30))).toFixed(3), y: +(-10 * EASE(span(t, HDR_OUT, HDR_OUT + 0.30))).toFixed(2) };
  /* the switch: blue as he slides across, out once he has jumped */
  const swOut = out(t, SW_OUT);
  const sw = { s: swOut.s, o: swOut.o, dip: +dip(t, 'sw', DIP.sw).toFixed(3), on: +smooth(span(t, SLIDE.a, SLIDE.b)).toFixed(3) };
  /* the slider: a thin track, the fill behind him, the ticks blue as he passes, the value over him */
  const slIn = pop(t, SL_IN), slOut = out(t, SL_OUT);
  const kx = lerp(SL.x0, SL.x1, IO(span(t, ROLL.a, ROLL.b)));
  const val = Math.round(100 * IO(span(t, ROLL.a, ROLL.b)));
  const ticks = TICK_X.map(x => +smooth(span(kx, x - 6, x + 2)).toFixed(3));
  const sl = { s: +(slIn.s * slOut.s).toFixed(4), o: +Math.min(slIn.o, slOut.o).toFixed(3), fill: +(kx - SL.l).toFixed(2), dip: +dip(t, 'sl', DIP.sl).toFixed(3), ticks };
  const bIn = pop(t, INTO_SL, 0.34), bOut = out(t, SL_OUT - 0.08, 0.16);
  const bub = { x: +b.x.toFixed(2), y: +(b.y - R - 12 + (b.plat === 'sl' ? dip(t, 'sl', DIP.sl) : 0)).toFixed(2), s: +(bIn.s * bOut.s * (1 + 0.12 * bump(t, ROLL.b - 0.02, 0.08, 0.02, 0.2))).toFixed(4), o: +Math.min(bIn.o, bOut.o).toFixed(3), v: val };
  /* the stack: the front card takes his landing, loses its text, and pops */
  const front = cardFront(t);
  const cards = [0, 1, 2].map(k => {
    let pos = k;
    for (let m = 0; m < k; m++) pos -= SPRING(span(t, POPS[m] + 0.14, POPS[m] + 0.46));
    pos = Math.max(0, pos);
    const inK = pop(t, CARDS_IN + 0.06 * k, 0.46);
    const pp = span(t, POPS[k], POPS[k] + 0.22);
    const gone = pp >= 1 ? 0 : 1 - smooth(span(pp, 0.05, 0.7));
    const d = k === front ? dip(t, 'card', DIP.card) : 0;
    return {
      y: +(pos * CARD.peek).toFixed(3), s: +((1 - 0.05 * pos) * inK.s * lerp(1, 1.10, EASE(pp))).toFixed(4),
      o: +(inK.o * gone).toFixed(3), dim: +(Math.min(1, pos) * 0.5).toFixed(3),
      dip: +d.toFixed(3), txt: +(1 - smooth(span(t, TXT[k], TXT[k] + 0.14))).toFixed(3), z: 5 - k,
    };
  });
  /* the keyboard and the field: each key he lands on lights and goes down, a letter each */
  const kIn = pop(t, KB_IN, 0.40);
  const lit = [], press = [];
  let n = 0;
  KEY_AT.forEach((a, i) => {
    const dt = t - a;
    const off = (i + 1 < KEY_AT.length ? KEY_AT[i + 1] - KEY_HOP : UPJ.t0) - a;
    lit.push(+(dt < 0 ? 0 : dt < 0.03 ? dt / 0.03 : 1 - smooth(span(dt, off, off + 0.05))).toFixed(3));
    press.push(+(dt < 0 ? 0 : Math.max(0, 1 - smooth(span(dt, 0.02, 0.18)))).toFixed(3));
    if (dt >= 0) n = i + 1;
  });
  const kb = { s: kIn.s, o: kIn.o, dip: +dip(t, 'kb', DIP.kb).toFixed(3), lit, press };
  const field = { s: kIn.s, o: kIn.o, n };
  return { hdr, sw, sl, bub, cards, kb, field };
}

/* ---------- the icons, tabler outline, drawn here ---------- */
const ic = (d, w = 22) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  receipt: '<path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6l9 -6"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M8 15h2v2h-2z"/>',
};
const NOTES = [
  { icon: 'receipt', n: '3', title: '3 unpaid invoices', sub: 'waiting on payment' },
  { icon: 'mail', n: '12', title: '12 unread emails', sub: 'in your inbox' },
  { icon: 'calendar', n: '1', title: 'missed booking', sub: 'tuesday, 3pm' },
];

const css = `
:root{--blue:${BLUE};--card:#1c1c1e;--card2:#2c2c2e;--line:rgba(255,255,255,.10);--grey:#8e8e93}
.stage{background:radial-gradient(circle,rgba(255,255,255,.075) 0 1px,transparent 1.4px) 0 0/20px 20px,var(--bg)}
/* the words at the top, the series title's look */
.hdr{position:absolute;left:${MARGIN}px;width:${540 - 2 * MARGIN}px;top:${HDR.top}px;z-index:5;text-align:center;white-space:nowrap;
  font:400 ${HDR.size}px/1.2 var(--display);color:var(--fg);letter-spacing:.02em;will-change:transform,opacity;
  text-shadow:0 0 8px rgba(255,255,255,.22),0 0 22px rgba(255,255,255,.10)}
.hdr span{display:inline-block}
/* the switch, his own size plus a 5px rim: he is its knob */
.sw{position:absolute;left:${SW.cx - SW.w / 2}px;top:${SW.cy - SW.h / 2}px;width:${SW.w}px;height:${SW.h}px;z-index:2;transform-origin:50% 50%;will-change:transform,opacity}
.sw-t,.sw-on{position:absolute;inset:0;border-radius:${SW.h / 2}px;background:#39393d}
.sw-on{background:var(--blue);opacity:0}
/* the slider, ios: a thin grey track, the blue fill under him, a row of ticks */
.sl{position:absolute;left:${SL.l}px;top:${SL.y - SL.h / 2}px;width:${SL.r - SL.l}px;height:${SL.h}px;z-index:2;transform-origin:50% 50%;opacity:0;will-change:transform,opacity}
.sl-t{position:absolute;inset:0;border-radius:${SL.h / 2}px;background:#48484a}
.sl-f{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:${SL.h / 2}px;background:var(--blue)}
.tk{position:absolute;top:${R + 10}px;width:3px;height:11px;margin-left:-1.5px;border-radius:1.5px;background:#636366;overflow:hidden}
.tk i{position:absolute;inset:0;background:var(--blue);opacity:0}
.bub{position:absolute;left:0;top:0;z-index:8;opacity:0;will-change:transform,opacity;transform-origin:50% 100%}
.bub b{display:block;transform:translate(-50%,-100%);min-width:44px;padding:6px 9px 5px;border-radius:10px;background:var(--blue);color:#fff;
  font:500 15px/1 var(--read);text-align:center;letter-spacing:.02em}
.bub i{position:absolute;left:-5px;top:-1px;width:10px;height:6px;background:var(--blue);clip-path:polygon(0 0,100% 0,50% 100%)}
/* the notifications */
.nt{position:absolute;left:${CARD.cx - CARD.w / 2}px;top:${CARD.top}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0;will-change:transform,opacity;transform-origin:50% 100%}
.nt-c{position:absolute;inset:0;border-radius:22px;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;gap:14px;padding:0 18px 0 16px}
.nt-dim{position:absolute;inset:0;border-radius:22px;background:#000;opacity:0;pointer-events:none}
.nt-i{flex:none;width:46px;height:46px;border-radius:13px;background:var(--card2);color:#f4f7f5;display:grid;place-items:center}
.nt-x{flex:1;min-width:0;font-family:var(--read)}
.nt-x b{display:block;font-weight:500;font-size:18px;line-height:1.2;color:#f4f7f5}
.nt-x span{display:block;margin-top:4px;font-size:15px;line-height:19px;color:var(--grey);white-space:nowrap}
.nt-n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;font:500 15px/34px var(--read);text-align:center}
/* the keyboard */
.kb{position:absolute;left:${KB.l}px;top:${KB.top}px;width:${KB.w}px;height:${KB.h}px;z-index:2;border-radius:22px;background:#161618;border:1px solid var(--line);
  opacity:0;transform-origin:50% 100%;will-change:transform,opacity}
.ky{position:absolute;width:${KEY.w}px;height:${KEY.h}px;border-radius:8px;background:#3a3a3c;color:#f4f7f5;font:400 16px/${KEY.h}px var(--read);text-align:center;overflow:hidden;will-change:transform}
.ky i{position:absolute;inset:0;background:var(--blue);opacity:0}
.ky span{position:relative}
.fd{position:absolute;left:${FIELD.l}px;top:${FIELD.top}px;width:${FIELD.w}px;height:${FIELD.h}px;z-index:2;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}
.fd-p{position:absolute;inset:0;border-radius:${FIELD.h / 2}px;border:1px solid rgba(255,255,255,.22);background:#101012}
.fd-t{position:absolute;left:20px;top:0;font:400 18px/${FIELD.h}px var(--read);color:#f4f7f5;white-space:nowrap}
.fd-t.ph{color:var(--grey)}
`;
const keysHtml = Object.entries(KEYAT).map(([c, k]) => `<div class="ky" id="ky-${c}" style="left:${k.l.toFixed(1)}px;top:${k.t}px"><i></i><span>${c}</span></div>`).join('');
const markup = `
<div class="hdr" id="hdr"><span id="hdr-t">your ai agent</span></div>
<div class="sw" id="sw"><div class="sw-t"></div><div class="sw-on" id="sw-on"></div></div>
<div class="sl" id="sl"><div class="sl-t"></div><div class="sl-f" id="sl-f"></div>
  ${TICK_X.map((x, i) => `<div class="tk" id="tk${i}" style="left:${(x - SL.l).toFixed(2)}px"><i></i></div>`).join('')}</div>
${[2, 1, 0].map(k => `<div class="nt" id="nt${k}"><div class="nt-c">
  <div class="nt-i" id="nti${k}">${ic(ICON[NOTES[k].icon], 24)}</div>
  <div class="nt-x" id="ntx${k}"><b>${NOTES[k].title}</b><span>${NOTES[k].sub}</span></div>
  <div class="nt-n" id="ntn${k}">${NOTES[k].n}</div>
  </div><div class="nt-dim" id="ntm${k}"></div></div>`).join('\n')}
<div class="kb" id="kb">${keysHtml}</div>
<div class="fd" id="fd"><div class="fd-p"></div><div class="fd-t ph" id="fd-t">message</div></div>`;
const front = '<div class="bub" id="bub"><i></i><b id="bub-v">0</b></div>';

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const hdr = $('hdr'), sw = $('sw'), swOn = $('sw-on');
  const sl = $('sl'), slF = $('sl-f'), bub = $('bub'), bubV = $('bub-v');
  const ticks = D.ticks.map((_, i) => $('tk' + i).firstChild);
  const nt = [0, 1, 2].map(k => ({ el: $('nt' + k), txt: [$('nti' + k), $('ntx' + k), $('ntn' + k)], m: $('ntm' + k) }));
  const kb = $('kb'), keys = D.word.split('').map(c => $('ky-' + c)), fd = $('fd'), fdT = $('fd-t');
  const squish = (s, dip, h) => { const sy = 1 - dip / h; return 'scale(' + (s * (1 + 0.5 * (1 - sy))).toFixed(4) + ',' + (s * sy).toFixed(4) + ')'; };
  let lastN = -1;
  window.__gag = {
    apply(o) {
      hdr.style.opacity = o.hdr.o; hdr.style.transform = 'translateY(' + o.hdr.y + 'px)';
      sw.style.opacity = o.sw.o; sw.style.transform = 'translateY(' + o.sw.dip + 'px) scale(' + o.sw.s + ')';
      swOn.style.opacity = o.sw.on;
      sl.style.opacity = o.sl.o; sl.style.transform = 'translateY(' + o.sl.dip + 'px) scale(' + o.sl.s + ')';
      slF.style.width = o.sl.fill + 'px';
      o.sl.ticks.forEach((v, i) => { ticks[i].style.opacity = v; });
      bub.style.opacity = o.bub.o; bub.style.transform = 'translate(' + o.bub.x + 'px,' + o.bub.y + 'px) scale(' + o.bub.s + ')';
      bubV.textContent = o.bub.v;
      o.cards.forEach((c, k) => {
        const e = nt[k];
        e.el.style.opacity = c.o; e.el.style.zIndex = c.z;
        e.el.style.transform = 'translateY(' + c.y + 'px) ' + squish(c.s, c.dip, D.cardH);
        e.m.style.opacity = c.dim;
        for (const x of e.txt) x.style.opacity = c.txt;
      });
      kb.style.opacity = o.kb.o; kb.style.transform = 'translateY(' + o.kb.dip + 'px) scale(' + o.kb.s + ')';
      keys.forEach((k, i) => { k.firstChild.style.opacity = o.kb.lit[i]; k.style.transform = 'translateY(' + (2.5 * o.kb.press[i]).toFixed(2) + 'px)'; });
      fd.style.opacity = o.field.o; fd.style.transform = 'scale(' + o.field.s + ')';
      if (o.field.n !== lastN) { lastN = o.field.n; fdT.textContent = lastN ? D.word.slice(0, lastN) : 'message'; fdT.className = 'fd-t' + (lastN ? '' : ' ph'); }
    },
  };
}

const BEATS = [...JUMPS.map(j => j.t0), ...JUMPS.map(j => j.t1), ...LOOKS.map(l => l.at), ...BLINKS, ...HAPPY.map(h => h.at),
  UPJ.t0, WINK.at, SLIDE.a, HDR_OUT, ROLL.a, ROLL.b, SW_OUT, SL_IN, SL_OUT, CARDS_IN, KB_IN, ...TXT, ...POPS];
/* the margins are the wide frame's, read off the scaled rects */
const inside = r => r && r.l >= MARGIN - 0.5 && r.r <= WIDE.w - MARGIN + 0.5;
/* ---------- the sound: post45's cue list, off the same timeline ---------- */
const kxAt = t => lerp(SL.x0, SL.x1, IO(span(t, ROLL.a, ROLL.b)));
const TICK_T = TICK_X.map(x => { let a = ROLL.a, b = ROLL.b; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (kxAt(m) >= x - 2) b = m; else a = m; } return +b.toFixed(4); });
const CUES = [
  { t: HOP0 + 0.26, kind: 'bounce', from: 'small hop in the switch' },
  { t: SLIDE.a, kind: 'toggle', from: 'switch click' },
  { t: INTO_SL, kind: 'land', from: 'lands in the slider' },
  { t: ROLL.a, kind: 'riser', opts: { len: +(ROLL.b - ROLL.a).toFixed(3) }, from: 'slider rolls' },
  ...TICK_T.map((t, i) => ({ t, kind: 'tock', opts: { f: +(1600 * Math.pow(2, i / 12)).toFixed(1) }, from: 'tick ' + (i + 1) })),
  { t: ROLL.b, kind: 'chime', from: 'slider ends, 100' },
  ...HITS.map((t, k) => ({ t, kind: 'bwop', opts: { step: k }, from: 'lands on card ' + (k + 1) })),
  ...POPS.map((t, k) => ({ t, kind: 'bubble', from: 'card ' + (k + 1) + ' pops' })),
  ...KEY_AT.map((t, i) => ({ t, kind: 'tap', opts: { seed: 0x19d4b7 + i * 977 }, from: 'key ' + WORD[i] })),
  { t: UPJ.t0, kind: 'whooshUp', from: 'jumps up off the e' },
  { t: UPJ.t0 + UPJ.dur * 0.12, kind: 'spin', opts: { len: +(UPJ.dur * 0.66).toFixed(3) }, from: 'the spin' },
  { t: UPJ.t1, kind: 'boing', from: 'lands in the air' },
  { t: WINK.at, kind: 'sparkle', from: 'wink' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.01).toFixed(3) }, from: 'the end card, gone by the end' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const res = await runEpisode({
  post: '45-landscape', ep: 0, series: false, title: [],
  stage: { w: WIDE.w, h: WIDE.h, appZone: MARGIN, file: 'post45-landscape-1920x1080.mp4' },
  sfx: { cues: CUES },
  cut: CUT, hold: HOLD,
  mascot: MAS,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: { ticks: TICK_X, word: WORD, cardH: CARD.h },
    sleep: [],
    beats: BEATS,
    checks: ['#hdr-t', '#sw', '#sl', '#nt0', '#nt1', '#nt2', '#kb', '#fd', '#bub-v'],
    hook: ['#hdr-t', '#sw'],
    verify: [
      /* he is exactly the knob: the switch is his plate plus the rim, to the px */
      { at: 0, sel: '#sw', test: r => (r && Math.abs(r.b - r.t - SW.h * WIDE.k) < 1 ? null : 'the switch is not his size plus the rim') },
      { at: 0, sel: '#m-card', test: r => (r && Math.abs(r.w - MAS.size * SCALE * WIDE.k) < 1.5 ? null : 'he is not drawn at ' + SCALE) },
      { at: HDR_OUT + 0.4, sel: '#hdr-t', test: r => (r ? 'the words are still up after the switch' : null) },
      { at: ROLL.b + 0.1, sel: '#bub-v', test: r => (inside(r) ? null : 'the value bubble is past the margin at 100') },
    ],
    copy: ['your ai agent', ...NOTES.flatMap(n => [n.title, n.sub, n.n]), ...ROWS, 'message', WORD],
    log: [[0, 'your ai agent, he is the switch knob, off'], [SLIDE.a, 'click, he slides across, blue'], [HDR_OUT, 'the words fade'],
      [INTO_SL, 'into the slider'], [ROLL.a, 'rolls it 0 to 100'], [CARDS_IN, 'the stack of three pops in'],
      ...HITS.map((h, k) => [h, 'lands on card ' + (k + 1) + ', bounces up, text gone, pop']),
      ...KEY_AT.map((a, i) => [a, 'key ' + WORD[i]]), [UPJ.t0, 'up to the middle, one spin'], [UPJ.t1, 'lands on nothing'], [WINK.at, 'wink, the other eye happy']],
  },
});
void res;
