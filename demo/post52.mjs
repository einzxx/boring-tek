/* the boring tek — post52. what is an api.

   dark, 1080x1920. six lines on the elevenlabs narrator, eleven_v4 for its
   audio tags, which are acted and never read, three takes a line, speed 1.0,
   about 0.42s between lines. post51's subtitles, post51's sung coda. the rig
   is lib/aiafter.mjs with the series off. the effects are lib/sfx.mjs off the
   same word times, ducked under the read.

   `api` is spelled for the voice. line 1 reads `A. P. I.`: as `a p i` the
   transcript heard `a PI` in all three takes, the article and a word. line 5
   reads `a p i`, which came back `API` in all three, and take 3 is pinned
   because its letters are the longest and the transcript ends it `API.`.

     l1  do you know ...      frame 0: a big glowing API, him under it looking up. each letter
                              pulses as it is said, a hop on `means`
     l2  imagine a ...        API floats up and dims, he hops to the left, a building with a
                              window draws itself, then a little car round him, the sign ticks on
     l3  you order ...        he rolls up to the window, a house bubble, burger please. on
                              `never` the kitchen shows behind the window and he shakes his head
     l4  the kitchen ...      two gears turn, steam, a tray with a burger slides out to him
     l5  that is an ...       he hops out, the car becomes an app box, the building the other,
                              the window stays in the middle. API drops onto the window. an
                              order arrow out, ORDER. an answer arrow back, ANSWER
     l6  so when your ...     a phone and a weather kitchen draw. the order goes out first, then
                              the tray comes back with a rain cloud, it rains on the phone, he
                              squints, then laughs on the second `weather`
     the glitch cut, the end card with the sung line

   simple line drawings, no scenes, no logos, no hands, no sparkles. green is
   the one accent, a small cool blue on the rain only. eyes calm, happy or
   squint. on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post52.mjs          the preview
     node post52.mjs --stills             one still per beat, no render
     node post52.mjs                      60fps
*/

import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const LINES = [
  { key: 'r1c', text: '[curious] do you know what A. P. I. means?', take: 1 },
  { key: 'r2', text: 'imagine a drive through.' },
  { key: 'r3', text: 'you order at the little window. you never go into the kitchen.' },
  { key: 'r4', text: 'the kitchen does the work, and your food comes back out the window.' },
  { key: 'r5', text: '[warmly] that is an a p i. one app orders, another app does the work, and sends the answer back.', take: 3 },
  { key: 'r6', text: '[playful] so when your weather app shows rain, it just ordered from a weather kitchen.' },
];
const TAKES = await readLines(52, LINES, 3, MODEL);
const [SUNG] = await readLines(52, [{ key: 's1', text: '[sings] the boring tek.' }], 3, MODEL);
const [L1, L2, L3, L4, L5, L6] = TAKES;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'do you know' },
  { line: 0, text: 'what api means?' },
  { line: 1, text: 'imagine a drive through' },
  { line: 2, text: 'you order at the little window' },
  { line: 2, text: 'you never go into the kitchen' },
  { line: 3, text: 'the kitchen does the work' },
  { line: 3, text: 'and your food comes back' },
  { line: 3, text: 'out the window' },
  { line: 4, text: 'that is an api' },
  { line: 4, text: 'one app orders' },
  { line: 4, text: 'another app does the work' },
  { line: 4, text: 'and sends the answer back' },
  { line: 5, text: 'so when your weather app' },
  { line: 5, text: 'shows rain' },
  { line: 5, text: 'it just ordered' },
  { line: 5, text: 'from a weather kitchen' },
];

/* ---------- the words on screen ---------- */
const BIG = 'API', SIGN = 'drive through', ORDER_B = 'burger please', KIT = 'kitchen', APP = 'app';
const W_ORD = 'order', W_ANS = 'answer', BIG_ORD = 'ORDER', BIG_ANS = 'ANSWER', BIG_RAIN = 'RAIN', WX = 'weather', RAINW = 'rain', WK = 'weather kitchen';

/* ---------- the layout, css px of the 540x960 stage ----------
   he is drawn at 0.9. his home in the rig is where he ends, low in the middle
   under the app boxes; everything before is an offset from it */
const MAS = { cx: 270, cy: 680, size: 118, scale: 0.9 };
const P0 = { x: 270, y: 560 };               /* line 1, under the big word */
const PL = { x: 120, y: 540 };               /* line 2, the car draws round him here */
const PW = { x: 205, y: 540 };               /* line 3, at the window */
const BLD = { x: 310, y: 380, w: 170, h: 256 };   /* the building, its floor is the road */
const ROAD = BLD.y + BLD.h;
const WIN = { x: 322, y: 470, w: 70, h: 70 };
const KZ = { x: 402, y: 398, w: 70, h: 230 };     /* the kitchen, behind the window */
const GEAR = { x: 436, y: 482, s: 1 };            /* gear one, gear two meshes below right */
const CAR = { l: -75, r: 75, top: 22, bot: 78, wy: 82, wx: 45, wr: 14 };
/* line 5: the car is the left app, the building the right, the window between */
const BOXL = { x: 60, y: 420, w: 140, h: 140 }, BOXR = { x: 340, y: 420, w: 140, h: 140 };
const WIN5 = { x: 236, y: 440, w: 68, h: 100 };
const GEAR5 = { x: 398, y: 500, s: 0.7 };
const AR_O = { y: 458, a: 200, b: 340 }, AR_A = { y: 522, a: 340, b: 200 };
const BIGY = 300, BIG_TOP = 170, WORDY = 290;
/* line 6: the phone and the weather kitchen */
const PH = { x: 85, y: 400, w: 110, h: 200 }, SCR = { x: 95, y: 422, w: 90, h: 160 };
const K6 = { x: 345, y: 440, w: 130, h: 160 }, W6 = { x: 355, y: 490, w: 50, h: 55 };
const GEAR6 = { x: 442, y: 500, s: 0.6 };
const AR6 = { y: 505, a: 195, b: 355 };
const CLOUD_ON = { x: 140, y: 468 };

/* the house bubble off his head at the window: two dots up and right, then the pill */
const HEADR = 30 / 64 * MAS.size * MAS.scale;
const TB = { angle: -70 * Math.PI / 180, gap: 9, d0: 9, d1: 13, right: 300, h: 18 * 1.25 + 20 + 4 };
TB.r0 = HEADR + TB.gap + TB.d0 / 2; TB.r1 = TB.r0 + TB.d0 / 2 + TB.gap + TB.d1 / 2; TB.r2 = TB.r1 + TB.d1 / 2 + TB.gap;
TB.c0 = { x: PW.x + TB.r0 * Math.cos(TB.angle), y: PW.y + TB.r0 * Math.sin(TB.angle) };
TB.c1 = { x: PW.x + TB.r1 * Math.cos(TB.angle), y: PW.y + TB.r1 * Math.sin(TB.angle) };
TB.bottom = PW.y + TB.r2 * Math.sin(TB.angle);

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const idx = (T, x) => T.W.findIndex(v => v.word.toLowerCase().replace(/[^a-z]/g, '') === x);
const LET = [w(L1, 'A'), w(L1, 'P'), w(L1, 'I')];
const MEANS = w(L1, 'means');
const IMAG = w(L2, 'imagine'), DRIVE = w(L2, 'drive'), THRU = w(L2, 'through');
const ROLL = { a: w(L3, 'you'), b: +(w(L3, 'you') + 0.8).toFixed(3) };
const WIN3 = w(L3, 'window'), NEVER = w(L3, 'never'), KIT3 = w(L3, 'kitchen');
const KIT4 = w(L4, 'kitchen'), WORK4 = w(L4, 'work'), FOOD = w(L4, 'food'), WIN4 = w(L4, 'window');
const THAT = w(L5, 'that'), APIW = w(L5, 'a'), ORDERS = w(L5, 'orders'), WORK5 = w(L5, 'work'), ANSW = w(L5, 'answer');
const SO = w(L6, 'so'), WEA1 = w(L6, 'weather'), RAIN = w(L6, 'rain'), WEA2 = w(L6, 'weather', idx(L6, 'from'));
const HOP_L = { a: IMAG, b: +(IMAG + 0.5).toFixed(3) };
const BLD_T = { a: +(IMAG + 0.15).toFixed(3), b: +(IMAG + 0.95).toFixed(3) };
const CAR_T = { a: DRIVE, b: +(DRIVE + 0.6).toFixed(3) };
const HOP_O = { a: THAT, b: +(THAT + 0.55).toFixed(3) };
const MORPH = { a: +(THAT + 0.12).toFixed(3), b: +(THAT + 0.82).toFixed(3) };
const DROP = { a: +(APIW - 0.1).toFixed(3), b: +(APIW + 0.32).toFixed(3) };
const CLEAR = { a: SO, b: +(SO + 0.35).toFixed(3) };
const DRAW6 = { a: +(SO + 0.15).toFixed(3), b: +(SO + 0.85).toFixed(3) };
const TRAY6 = { a: RAIN, b: +(RAIN + 0.45).toFixed(3) };
const CHOP = { a: +(RAIN + 0.5).toFixed(3), b: +(RAIN + 0.85).toFixed(3) };
const LAUGH = [WEA2, +(WEA2 + 0.5).toFixed(3)];
const CUT = +(L6.end + 0.45).toFixed(3);
place(SUNG, CUT + 0.2);
const HOLD = +(SUNG.end - CUT + 0.5).toFixed(3);

const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);
const typed = (t, a, b, s) => (t < a ? '' : s.slice(0, Math.round(s.length * span(t, a, b))));
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
/* how far a gear has turned, in degrees: it only turns inside its windows */
const turned = (t, wins, rate = 300) => wins.reduce((s, [a, b]) => s + rate * Math.max(0, Math.min(t, b) - a), 0);

/* ---------- where he is ---------- */
function where(t) {
  let x = P0.x, y = P0.y, lift = 0;
  if (t >= HOP_L.a) { const k = EASE(span(t, HOP_L.a, HOP_L.b)); x = lerp(P0.x, PL.x, k); y = lerp(P0.y, PL.y, k); lift = 46 * Math.sin(Math.PI * span(t, HOP_L.a, HOP_L.b)); }
  if (t >= ROLL.a) { const k = EASE(span(t, ROLL.a, ROLL.b)); x = lerp(PL.x, PW.x, k); y = PW.y; lift = 0; }
  if (t >= HOP_O.a) { const k = EASE(span(t, HOP_O.a, HOP_O.b)); x = lerp(PW.x, MAS.cx, k); y = lerp(PW.y, MAS.cy, k); lift = 60 * Math.sin(Math.PI * span(t, HOP_O.a, HOP_O.b)); }
  return { x, y: y - lift };
}
/* the car rides with him until he hops out, then it stays to become a box */
const carX = t => (t < HOP_O.a ? where(t).x : PW.x);

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: AT(270, BIGY) },
  { at: MEANS, to: LENS },
  { at: IMAG + 0.3, to: AT(WIN.x + 30, WIN.y + 20) },
  { at: CAR_T.a, to: AT(PL.x + 40, PL.y + 70) },
  { at: ROLL.a, to: AT(WIN.x + 35, WIN.y + 35) },
  { at: NEVER, to: AT(KZ.x + 34, KZ.y + 100) },
  { at: FOOD, to: AT(WIN.x - 10, WIN.y + 60) },
  { at: THAT, to: LENS },
  { at: DROP.a, to: AT(270, WIN5.y + 50) },
  { at: ORDERS, to: AT(AR_O.b, AR_O.y) },
  { at: ANSW, to: AT(AR_A.b, AR_A.y) },
  { at: SO + 0.2, to: AT(PH.x + 55, PH.y + 80) },
  { at: WEA1 + 0.1, to: AT(K6.x + 40, AR6.y) },
  { at: TRAY6.a, to: AT(300, 540) },
  { at: CHOP.a, to: AT(CLOUD_ON.x, CLOUD_ON.y) },
  { at: LAUGH[0], to: LENS },
];
const BLINKS = [1.75, +(L2.at + 0.9).toFixed(3), +(KIT3 + 0.25).toFixed(3), +(L4.at + 0.1).toFixed(3), +(L5.at - 0.25).toFixed(3), +(w(L5, 'another')).toFixed(3), +(L6.at - 0.2).toFixed(3)];
const SQUINTS = [[RAIN + 0.55, RAIN + 1.45]];
const HAPPY = [+(FOOD + 0.55).toFixed(3), +(ANSW + 0.45).toFixed(3), ...LAUGH];
const HOPS = [[MEANS + 0.02, 10], [WIN4, 9], [LAUGH[0] + 0.04, 9], [LAUGH[1] + 0.04, 7]];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const p = where(t);
  const lens = { x: p.x, y: p.y, w: 0 };
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
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.24, 0.12));
  let dy = 0, rot = 0, sq = 0;
  for (const [h, up] of HOPS) dy -= up * Math.sin(Math.PI * span(t, h, h + 0.3));
  /* the curious tilt on line 1, the head shake on `never`, the laugh's wobble */
  rot += 7 * bump(t, MEANS, 0.2, 0.5, 0.3);
  rot += 7 * Math.sin(2 * Math.PI * 3.2 * Math.max(0, t - NEVER)) * bump(t, NEVER, 0.06, 0.4, 0.12);
  rot += 5 * Math.sin(2 * Math.PI * 4 * Math.max(0, t - LAUGH[0])) * bump(t, LAUGH[0], 0.08, 0.75, 0.2);
  /* the car stops with a squash, the landings too */
  sq += 0.07 * Math.sin(Math.PI * span(t, ROLL.b - 0.05, ROLL.b + 0.22));
  sq += 0.08 * Math.sin(Math.PI * span(t, HOP_O.b - 0.04, HOP_O.b + 0.2));
  sq += 0.06 * Math.sin(Math.PI * span(t, HOP_L.b - 0.04, HOP_L.b + 0.2));
  /* the car's engine, a little idle shiver while it rolls */
  if (t >= CAR_T.b && t < HOP_O.a) dy += 1.2 * Math.sin(2 * Math.PI * 9 * t);
  dy += t < CAR_T.b || t > HOP_O.b ? 2.5 * Math.sin(2 * Math.PI * t / 2.2) : 0;
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy + dy), rot: f3(rot), sq: f3(sq) };
}

/* ---------- a frame of the story ---------- */
const R = (r, id) => [[id, 'x', f2(r.x)], [id, 'y', f2(r.y)], [id, 'width', f2(r.w)], [id, 'height', f2(r.h)]];
const LR = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
const draw = (t, a, b) => f3(1 - IO(span(t, a, b)));
function frame(t) {
  const A = [], S = [], X = [];
  const mo = IO(span(t, MORPH.a, MORPH.b));
  const gone = 1 - out(t, CLEAR.a, 0.3);
  const shed = 1 - out(t, MORPH.a, 0.25);
  /* the big word: on at frame 0, a pulse per letter, then it floats up and dims,
     then drops onto the window */
  const up = EASE(span(t, IMAG, IMAG + 0.6)), dr = span(t, DROP.a, DROP.b);
  let by = lerp(BIGY, BIG_TOP, up), bs = lerp(1, 0.55, up), bo = lerp(1, 0.32, up);
  if (t >= DROP.a) { const k = dr * dr; by = lerp(BIG_TOP, WIN5.y + WIN5.h / 2, k); bs = lerp(0.55, 0.2, k) * (1 + 0.25 * Math.sin(Math.PI * span(t, DROP.b, DROP.b + 0.25))); bo = lerp(0.32, 1, smooth(dr)); }
  const swell = 0.06 * bump(t, 0.3, 0.25, 0.1, 0.4);
  S.push(['api', 'transform', 'translate(270px,' + f2(by) + 'px) scale(' + f3(bs * (1 + swell)) + ')'], ['api', 'opacity', f3(bo * gone)]);
  LET.forEach((a, i) => S.push(['l' + i, 'transform', 'translateY(' + f2(-14 * Math.sin(Math.PI * span(t, a, a + 0.28))) + 'px) scale(' + f3(1 + 0.16 * Math.sin(Math.PI * span(t, a, a + 0.28))) + ')']));
  /* the building, the road, the window, the sign */
  const bd = draw(t, BLD_T.a, BLD_T.b);
  A.push(...R(LR(BLD, BOXR, mo), 'bld'), ['bld', 'stroke-dashoffset', bd]);
  A.push(['road', 'stroke-dashoffset', bd]);
  S.push(['road', 'opacity', f3(shed)]);
  A.push(...R(LR(WIN, WIN5, mo), 'win'), ['win', 'stroke-dashoffset', draw(t, BLD_T.a + 0.3, BLD_T.b + 0.15)]);
  S.push(['bld', 'opacity', f3(gone)], ['win', 'opacity', f3(gone)]);
  const sg = pop(t, THRU, 0.4, 0.5);
  S.push(['sign', 'opacity', f3(sg.o * shed)], ['sign', 'transform', 'translate(-50%,-50%) scale(' + sg.s + ')']);
  /* the kitchen behind the window: shown on `never`, lit on line 4 */
  const kz = 0.4 * smooth(span(t, NEVER + 0.1, NEVER + 0.4)) + 0.5 * smooth(span(t, KIT4, KIT4 + 0.25));
  S.push(['kz', 'opacity', f3(kz * shed)]);
  /* the gears: in the kitchen, then the right app, then the weather kitchen */
  const g = { x: lerp(GEAR.x, GEAR5.x, mo), y: lerp(GEAR.y, GEAR5.y, mo), s: lerp(GEAR.s, GEAR5.s, mo) };
  const go = smooth(span(t, NEVER + 0.1, NEVER + 0.45)) * 0.55 + 0.45 * smooth(span(t, KIT4, KIT4 + 0.25));
  const ang = turned(t, [[WORK4, THAT + 0.2], [WORK5, WORK5 + 1.1]]);
  A.push(['gears', 'transform', 'translate(' + f2(g.x) + ' ' + f2(g.y) + ') scale(' + f3(g.s) + ')'], ['g1', 'transform', 'rotate(' + f2(ang) + ')'], ['g2', 'transform', 'translate(16 35) rotate(' + f2(-ang * 22 / 15 + 14) + ')']);
  S.push(['gears', 'opacity', f3(go * gone)], ['kzl', 'opacity', f3(shed)]);
  /* steam while it cooks */
  const st = bump(t, WORK4 + 0.15, 0.25, FOOD + 0.6 - WORK4, 0.3) * shed;
  [0, 1, 2].forEach(i => { const u = ((t * 0.9 + i / 3) % 1); A.push(['st' + i, 'transform', 'translate(' + (418 + i * 16) + ' ' + f2(454 - 12 * u) + ')']); S.push(['st' + i, 'opacity', f3(st * Math.sin(Math.PI * u))]); });
  /* the car: draws round him on line 2, rides with him, becomes the left app */
  const cx = carX(t), cy = PW.y;
  const cd = draw(t, CAR_T.a, CAR_T.b);
  const body = LR({ x: cx + CAR.l, y: cy + CAR.top, w: CAR.r - CAR.l, h: CAR.bot - CAR.top }, BOXL, mo);
  A.push(...R(body, 'body'), ['body', 'stroke-dashoffset', cd], ['body', 'rx', f2(lerp(12, 14, mo))]);
  S.push(['body', 'opacity', f3(gone)]);
  A.push(['shield', 'd', 'M' + f2(cx + 58) + ' ' + (cy + CAR.top) + ' L' + f2(cx + 46) + ' ' + (cy - 8)], ['shield', 'stroke-dashoffset', cd]);
  S.push(['shield', 'opacity', 0]);
  const spin = (cx - PL.x) / CAR.wr * 57.3;
  [0, 1].forEach(i => {
    A.push(['wh' + i, 'transform', 'translate(' + f2(cx + (i ? CAR.wx : -CAR.wx)) + ' ' + (cy + CAR.wy) + ') rotate(' + f2(spin) + ')']);
    A.push(['whc' + i, 'stroke-dashoffset', cd]);
    S.push(['wh' + i, 'opacity', f3(shed * smooth(span(t, CAR_T.a + 0.1, CAR_T.a + 0.4)))]);
  });
  /* speed lines behind the car while it rolls */
  const sp = bump(t, ROLL.a + 0.05, 0.1, 0.4, 0.2);
  S.push(['speed', 'opacity', f3(sp)], ['speed', 'transform', 'translate(' + f2(cx + CAR.l - 12) + 'px,' + (cy + 40) + 'px)']);
  /* the bubble: burger please */
  const bOut = 1 - out(t, NEVER + 0.1, 0.2);
  const dot = (x, k) => (t < x ? { o: 0, s: 0.55 } : { o: f3(smooth(span(t, x, x + 0.08)) * bOut), s: f3(lerp(0.55, 1, SPRING(span(t, x, x + k)))) });
  [['bd0', dot(WIN3, 0.3)], ['bd1', dot(WIN3 + 0.07, 0.3)], ['bp', dot(WIN3 + 0.14, 0.34)]].forEach(([id, v]) => S.push([id, 'opacity', v.o], [id, 'transform', 'scale(' + v.s + ')']));
  /* the tray with the burger, out of the window to him */
  const tk = EASE(span(t, FOOD, FOOD + 0.5));
  A.push(['tray', 'transform', 'translate(' + f2(lerp(WIN.x + 38, WIN.x - 20, tk)) + ' ' + (WIN.y + WIN.h - 9) + ') scale(1.5)']);
  S.push(['tray', 'opacity', f3(smooth(span(t, FOOD, FOOD + 0.1)) * (1 - out(t, THAT, 0.2)))]);
  /* line 5: the labels, the arrows, the big words */
  const lab = 1 - out(t, CLEAR.a, 0.25);
  X.push(['appl', typed(t, MORPH.b - 0.1, MORPH.b + 0.15, APP)], ['appr', typed(t, MORPH.b, MORPH.b + 0.25, APP)]);
  S.push(['appl', 'opacity', f3(lab)], ['appr', 'opacity', f3(lab)]);
  const ao = draw(t, ORDERS, ORDERS + 0.35), aa = draw(t, ANSW, ANSW + 0.35);
  A.push(['ao', 'stroke-dashoffset', ao], ['aa', 'stroke-dashoffset', aa]);
  S.push(['ao', 'opacity', f3(lab)], ['aa', 'opacity', f3(lab)]);
  S.push(['aoh', 'opacity', f3(smooth(span(t, ORDERS + 0.3, ORDERS + 0.38)) * lab)], ['aah', 'opacity', f3(smooth(span(t, ANSW + 0.3, ANSW + 0.38)) * lab)]);
  const lo = pop(t, ORDERS + 0.2, 0.35, 0.5), la = pop(t, ANSW + 0.2, 0.35, 0.5);
  S.push(['lo', 'opacity', f3(lo.o * lab)], ['lo', 'transform', 'translate(-50%,-50%) scale(' + lo.s + ')'], ['la', 'opacity', f3(la.o * lab)], ['la', 'transform', 'translate(-50%,-50%) scale(' + la.s + ')']);
  /* a pulse runs each arrow once it is drawn */
  const pu = (a, ar) => { const u = span(t, a + 0.35, a + 0.75); return { x: lerp(ar.a, ar.b, EASE(u)), o: bump(t, a + 0.35, 0.05, 0.3, 0.08) }; };
  const po = pu(ORDERS, AR_O), pa = pu(ANSW, AR_A);
  A.push(['po', 'cx', f2(po.x)], ['pa', 'cx', f2(pa.x)]);
  S.push(['po', 'opacity', f3(po.o)], ['pa', 'opacity', f3(pa.o)]);
  const wo = pop(t, ORDERS, 0.42, 0.5), wa = pop(t, ANSW, 0.42, 0.5);
  const woOut = out(t, ANSW - 0.1, 0.15);
  S.push(['word0', 'opacity', f3(wo.o * (1 - woOut) * gone)], ['word0', 'transform', 'scale(' + f3(wo.s * (1 - 0.3 * woOut)) + ')']);
  S.push(['word1', 'opacity', f3(wa.o * gone)], ['word1', 'transform', 'scale(' + wa.s + ')']);
  /* line 6: the phone and the weather kitchen draw, the order goes out, the rain comes back */
  const d6 = draw(t, DRAW6.a, DRAW6.b);
  A.push(['phone', 'stroke-dashoffset', d6], ['scr', 'stroke-dashoffset', draw(t, DRAW6.a + 0.15, DRAW6.b + 0.1)], ['k6', 'stroke-dashoffset', d6], ['w6', 'stroke-dashoffset', draw(t, DRAW6.a + 0.2, DRAW6.b + 0.15)]);
  const on6 = smooth(span(t, DRAW6.a, DRAW6.a + 0.05));
  S.push(['l6', 'opacity', f3(on6)]);
  X.push(['wx', typed(t, DRAW6.a + 0.4, DRAW6.b + 0.1, WX)], ['wk', typed(t, DRAW6.a + 0.3, DRAW6.b + 0.25, WK)]);
  const ang6 = turned(t, [[WEA1 + 0.45, RAIN + 0.1]], 420);
  A.push(['g6', 'transform', 'rotate(' + f2(ang6) + ')']);
  S.push(['g6w', 'opacity', f3(smooth(span(t, DRAW6.a + 0.3, DRAW6.b)))]);
  A.push(['a6', 'stroke-dashoffset', draw(t, WEA1, WEA1 + 0.3)]);
  S.push(['a6h', 'opacity', f3(smooth(span(t, WEA1 + 0.26, WEA1 + 0.32)))]);
  const p6 = pu(WEA1 - 0.06, AR6);
  A.push(['p6', 'cx', f2(p6.x)]);
  S.push(['p6', 'opacity', f3(p6.o)]);
  const t6 = EASE(span(t, TRAY6.a, TRAY6.b));
  A.push(['tray6', 'transform', 'translate(' + f2(lerp(W6.x + 25, 232, t6)) + ' ' + (W6.y + W6.h - 9) + ') scale(1.5)']);
  S.push(['tray6', 'opacity', f3(smooth(span(t, TRAY6.a, TRAY6.a + 0.1)) * (1 - out(t, CHOP.b, 0.25)))]);
  /* the cloud rides the tray, then hops onto the phone */
  const ck = span(t, CHOP.a, CHOP.b), ce = EASE(ck);
  const c0 = { x: lerp(W6.x + 25, 232, t6), y: W6.y + W6.h - 30 };
  const cxx = lerp(c0.x, CLOUD_ON.x, ce), cyy = lerp(c0.y, CLOUD_ON.y, ce) - 50 * Math.sin(Math.PI * ck);
  A.push(['cloud', 'transform', 'translate(' + f2(cxx) + ' ' + f2(cyy) + ') scale(' + f3(lerp(1, 1.3, ce) * (1 + 0.12 * Math.sin(Math.PI * span(t, CHOP.b, CHOP.b + 0.25)))) + ')']);
  S.push(['cloud', 'opacity', f3(smooth(span(t, TRAY6.a, TRAY6.a + 0.1)))]);
  const rn = smooth(span(t, CHOP.b, CHOP.b + 0.15));
  [0, 1, 2, 3, 4].forEach(i => {
    const u = ((Math.max(0, t - CHOP.b) * 1.7 + i * 0.37) % 1);
    A.push(['dr' + i, 'transform', 'translate(' + (118 + i * 11) + ' ' + f2(490 + 62 * u) + ')']);
    S.push(['dr' + i, 'opacity', f3(rn * (u < 0.15 ? u / 0.15 : 1 - Math.max(0, u - 0.7) / 0.3))]);
  });
  const rw = pop(t, CHOP.b + 0.05, 0.35, 0.5);
  const wr = pop(t, RAIN, 0.42, 0.5);
  S.push(['word2', 'opacity', f3(wr.o)], ['word2', 'transform', 'scale(' + wr.s + ')']);
  S.push(['rainw', 'opacity', rw.o], ['rainw', 'transform', 'translate(-50%,-50%) scale(' + rw.s + ')']);
  return { A, S, X };
}

/* ---------- the drawing ---------- */
function gearPath(r, n, depth) {
  const p = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * 2 * Math.PI, rr = i % 4 < 2 ? r : r - depth;
    p.push((i ? 'L' : 'M') + (rr * Math.cos(a)).toFixed(2) + ' ' + (rr * Math.sin(a)).toFixed(2));
  }
  return p.join(' ') + ' Z';
}
const GP1 = gearPath(22, 9, 5), GP2 = gearPath(15, 7, 4.5);
const BURGER = '<path d="M-13 -7 Q-13 -20 0 -20 Q13 -20 13 -7 Z"/><path d="M-14 -3.5 H14"/><path d="M-13 0 H13 Q13 4 9 4 H-9 Q-13 4 -13 0 Z"/>';
const CLOUD = '<path d="M-17 9 H15 A9 9 0 0 0 13 -8 A12 12 0 0 0 -9 -9 A10 10 0 0 0 -17 9 Z"/>';
const RAINC = '#7cc4ff';
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const css = `
#art,#front{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
#art .ln,#front .ln{fill:none;stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 1}
#front #body{fill:#06070a}
#bld,#win{fill:#06070a}
#art .dim{fill:none;stroke:rgba(233,238,236,.45);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#kz{fill:none;stroke:rgba(233,238,236,.3);stroke-width:1.5;stroke-dasharray:5 6;opacity:0}
#kzl{font:400 15px var(--mono);fill:rgba(233,238,236,.6);letter-spacing:.04em}
.big{position:absolute;left:0;top:0;width:0;height:0;display:flex;justify-content:center;align-items:center;will-change:transform,opacity}
.big b{display:block;font:400 110px/1 var(--display);color:#f7f9f8;letter-spacing:.06em;white-space:nowrap;-webkit-text-stroke:1.2px #fff;filter:${GLOW};transform:translateY(-50%)}
.big b span{display:inline-block;will-change:transform}
.word{position:absolute;left:0;right:0;top:${WORDY}px;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity}
.word b{display:block;font:400 56px/1 var(--display);color:#f7f9f8;letter-spacing:.06em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
.word .ac{color:var(--accent);-webkit-text-stroke:1px var(--accent)}
.tag{position:absolute;font:400 16px/1 var(--mono);color:var(--sub);letter-spacing:.14em;white-space:nowrap;opacity:0;will-change:transform,opacity}
#sign{letter-spacing:.06em;left:${BLD.x + BLD.w / 2}px;top:${BLD.y - 26}px;padding:7px 11px 6px;border:1px solid rgba(255,255,255,.3);border-radius:5px;background:#14171c;color:var(--fg)}
#lo{left:270px;top:${AR_O.y - 26}px;color:var(--accent)}
#la{left:270px;top:${AR_A.y + 26}px;color:var(--fg)}
.lbl{position:absolute;font:400 22px/1 var(--mono);color:var(--fg);letter-spacing:.1em;white-space:nowrap;min-height:22px;text-align:center;width:120px;margin-left:-60px}
#wx{position:absolute;left:${SCR.x + SCR.w / 2 - 45}px;top:${SCR.y + 10}px;width:90px;text-align:center;font:400 13px/1 var(--mono);color:var(--sub);letter-spacing:.06em;min-height:13px}
#wk{position:absolute;left:${K6.x + K6.w / 2 - 70}px;top:${K6.y - 26}px;width:140px;text-align:center;font:400 14px/1 var(--mono);color:var(--sub);letter-spacing:.03em;min-height:14px}
#rainw{left:${CLOUD_ON.x}px;top:${SCR.y + SCR.h - 14}px;color:${RAINC};font-size:15px;letter-spacing:.16em}
#l6{position:absolute;inset:0;opacity:0}
/* the house speech bubble: the pill and two dots, equal gaps, off his head */
.bp{position:absolute;right:${540 - TB.right}px;top:${(TB.bottom - TB.h).toFixed(2)}px;height:${TB.h}px;padding:10px 18px;border:2px solid rgba(213,219,216,.5);border-radius:999px;background:#06070a;color:#f4f7f5;
  font:500 18px/1.25 var(--read);white-space:nowrap;opacity:0;transform-origin:calc(100% - ${(TB.right - TB.c1.x).toFixed(1)}px) 100%;will-change:transform,opacity}
.bd{position:absolute;display:block;border-radius:50%;background:#06070a;border:2px solid rgba(213,219,216,.5);opacity:0;will-change:transform,opacity}
`;
const ln = (tag, id, attrs, extra = '') => `<${tag} id="${id}" class="ln" pathLength="1" stroke-dashoffset="1" ${attrs}${extra}/>`;
const bdot = (id, c, d) => `<i class="bd" id="${id}" style="left:${(c.x - d / 2).toFixed(2)}px;top:${(c.y - d / 2).toFixed(2)}px;width:${d}px;height:${d}px"></i>`;
const arrow = (id, ar, col) => {
  const dir = ar.b > ar.a ? 1 : -1;
  return `<path id="${id}" class="ln" pathLength="1" stroke-dashoffset="1" d="M${ar.a} ${ar.y} H${ar.b}" style="stroke:${col}"/>
    <path id="${id}h" d="M${ar.b - dir * 11} ${ar.y - 8} L${ar.b} ${ar.y} L${ar.b - dir * 11} ${ar.y + 8}" style="fill:none;stroke:${col};stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;opacity:0"/>`;
};
const markup = `
<svg id="art" viewBox="0 0 540 960">
  ${ln('rect', 'bld', `x="${BLD.x}" y="${BLD.y}" width="${BLD.w}" height="${BLD.h}" rx="4"`)}
  ${ln('path', 'road', `d="M60 ${ROAD} H480"`)}
  <rect id="kz" x="${KZ.x}" y="${KZ.y}" width="${KZ.w}" height="${KZ.h}" rx="4"/>
  <g id="gears" style="opacity:0">
    <text id="kzl" x="0" y="-70" text-anchor="middle">${KIT}</text>
    <g id="g1"><path class="dim" d="${GP1}" style="stroke:#e9eeec"/><circle class="dim" r="6" style="stroke:#e9eeec"/></g>
    <g id="g2"><path class="dim" d="${GP2}" style="stroke:#e9eeec"/><circle class="dim" r="4"/></g>
  </g>
  ${[0, 1, 2].map(i => `<path id="st${i}" class="dim" d="M0 0 q-3 -4 0 -8 q3 -4 0 -8" style="opacity:0"/>`).join('')}
  ${ln('rect', 'win', `x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" rx="3"`)}
  <g id="tray" style="opacity:0"><g class="dim" style="stroke:#e9eeec;stroke-width:2.2">${BURGER}</g><path d="M-26 7 H26" style="stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round"/></g>
  ${arrow('ao', AR_O, 'var(--accent)')}
  ${arrow('aa', AR_A, '#e9eeec')}
  <circle id="po" cx="${AR_O.a}" cy="${AR_O.y}" r="5" style="fill:var(--accent);opacity:0"/>
  <circle id="pa" cx="${AR_A.a}" cy="${AR_A.y}" r="5" style="fill:#fff;opacity:0"/>
  <g id="l6">
    ${ln('rect', 'phone', `x="${PH.x}" y="${PH.y}" width="${PH.w}" height="${PH.h}" rx="18"`)}
    ${ln('rect', 'scr', `x="${SCR.x}" y="${SCR.y}" width="${SCR.w}" height="${SCR.h}" rx="8"`, ' style="stroke:rgba(233,238,236,.5);stroke-width:1.6"')}
    ${ln('rect', 'k6', `x="${K6.x}" y="${K6.y}" width="${K6.w}" height="${K6.h}" rx="4"`)}
    ${ln('rect', 'w6', `x="${W6.x}" y="${W6.y}" width="${W6.w}" height="${W6.h}" rx="3"`)}
    <g id="g6w" style="opacity:0" transform="translate(${GEAR6.x} ${GEAR6.y}) scale(${GEAR6.s})"><g id="g6"><path class="dim" d="${GP1}" style="stroke:#e9eeec"/><circle class="dim" r="6" style="stroke:#e9eeec"/></g></g>
    ${arrow('a6', AR6, 'var(--accent)')}
    <circle id="p6" cx="${AR6.a}" cy="${AR6.y}" r="5" style="fill:var(--accent);opacity:0"/>
    <g id="tray6" style="opacity:0"><path d="M-26 7 H26" style="stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round"/></g>
    ${[0, 1, 2, 3, 4].map(i => `<path id="dr${i}" d="M0 0 v9" style="stroke:${RAINC};stroke-width:2.4;stroke-linecap:round;opacity:0"/>`).join('')}
    <g id="cloud" style="opacity:0"><g style="fill:rgba(124,196,255,.12);stroke:${RAINC};stroke-width:2.2;stroke-linejoin:round">${CLOUD}</g></g>
  </g>
</svg>
<div class="big" id="api"><b>${BIG.split('').map((c, i) => `<span id="l${i}">${c}</span>`).join('')}</b></div>
<div class="tag" id="sign">${SIGN}</div>
<div class="lbl" id="appr" style="left:${BOXR.x + BOXR.w / 2}px;top:${BOXR.y + 18}px"></div>
<div class="tag" id="lo">${W_ORD}</div><div class="tag" id="la">${W_ANS}</div>
<div class="word" id="word0"><b class="ac">${BIG_ORD}</b></div>
<div class="word" id="word1"><b>${BIG_ANS}</b></div>
<div class="word" id="word2"><b>${BIG_RAIN}</b></div>
<div id="wx"></div><div id="wk"></div>
<div class="tag" id="rainw">${RAINW}</div>`;
/* over him: the car, so he sits in it, and the bubble */
const front = `
<svg id="front" viewBox="0 0 540 960">
  ${ln('rect', 'body', `x="0" y="0" width="${CAR.r - CAR.l}" height="${CAR.bot - CAR.top}" rx="12"`)}
  ${ln('path', 'shield', 'd="M0 0"')}
  ${[0, 1].map(i => `<g id="wh${i}" style="opacity:0"><circle id="whc${i}" class="ln" pathLength="1" stroke-dashoffset="1" r="${CAR.wr}" style="fill:#06070a"/><path d="M0 -${CAR.wr - 4} V${CAR.wr - 4}" style="stroke:#e9eeec;stroke-width:2;stroke-linecap:round"/></g>`).join('')}
  <g id="speed" style="opacity:0"><path d="M0 0 H-22 M-4 -14 H-18 M-4 14 H-26" style="stroke:rgba(233,238,236,.5);stroke-width:2;stroke-linecap:round"/></g>
</svg>
<div class="lbl" id="appl" style="left:${BOXL.x + BOXL.w / 2}px;top:${BOXL.y + BOXL.h / 2 - 11}px"></div>
${bdot('bd0', TB.c0, TB.d0)}${bdot('bd1', TB.c1, TB.d1)}
<div class="bp" id="bp">${ORDER_B}</div>`;

function page() {
  const els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.A) { const key = id + '|' + k; if (last[key] !== v) { last[key] = v; $(id).setAttribute(k, v); if (k === 'stroke-dashoffset') $(id).style.visibility = v >= 0.999 ? 'hidden' : ''; } }
      for (const [id, k, v] of o.S) { const key = id + '#' + k; if (last[key] !== v) { last[key] = v; $(id).style[k] = v; } }
      for (const [id, v] of o.X) { const key = id + '$'; if (last[key] !== v) { last[key] = v; $(id).textContent = v; } }
    },
  };
}

/* ---------- the effects, off the word times, under the read ---------- */
const taps = (a, b, n, seed) => Array.from({ length: n }, (_, k) => ({ t: +lerp(a, b, (k + 1) / n).toFixed(4), kind: 'tap', opts: { seed: seed + k * 977 }, from: 'typing' }));
const CUES = [
  { t: 0.02, kind: 'bwop', from: 'the hook settles' },
  { t: 0.3, kind: 'riser', opts: { len: 0.5 }, from: 'API swells' },
  ...LET.map((t, i) => ({ t, kind: 'tock', opts: { f: 1300 + 250 * i }, from: 'a letter pulses' })),
  { t: MEANS + 0.02, kind: 'bounce', from: 'his hop' },
  { t: IMAG, kind: 'whooshUp', opts: { len: 0.4 }, from: 'he hops left, API floats up' },
  { t: HOP_L.b - 0.04, kind: 'land', from: 'he lands' },
  { t: BLD_T.a, kind: 'sweep', opts: { len: 0.8 }, from: 'the building draws' },
  { t: CAR_T.a, kind: 'sweep', opts: { len: 0.6, seed: 0x3c11a7 }, from: 'the car draws' },
  { t: THRU, kind: 'tock', opts: { f: 1500 }, from: 'the sign' },
  { t: THRU + 0.03, kind: 'bubble', from: 'the sign pops' },
  ...[0, 0.13, 0.26].map(d => ({ t: +(ROLL.a + d).toFixed(3), kind: 'popDeep', opts: { f0: 120, f1: 70, len: 0.12 }, from: 'putt putt' })),
  { t: ROLL.a + 0.05, kind: 'whoosh', opts: { len: 0.5 }, from: 'the car rolls' },
  { t: ROLL.b - 0.05, kind: 'bounce', opts: { f0: 240, f1: 130 }, from: 'the car stops' },
  { t: WIN3, kind: 'tock', opts: { f: 1500 }, from: 'bubble dot' }, { t: WIN3 + 0.07, kind: 'tock', opts: { f: 1700 }, from: 'bubble dot' },
  { t: WIN3 + 0.14, kind: 'bubble', from: 'burger please' },
  { t: NEVER, kind: 'toggle', from: 'the kitchen shows, he shakes his head' },
  { t: KIT4, kind: 'popDeep', from: 'the kitchen lights' },
  ...[0, 0.2, 0.4].map(d => ({ t: +(WORK4 + d).toFixed(3), kind: 'servo', from: 'the gears turn' })),
  { t: FOOD, kind: 'whoosh', opts: { len: 0.35 }, from: 'the tray slides' },
  { t: FOOD + 0.48, kind: 'land', from: 'the tray stops' },
  { t: WIN4, kind: 'chime', from: 'happy' },
  { t: THAT, kind: 'whooshUp', opts: { len: 0.4 }, from: 'he hops out' },
  { t: MORPH.a, kind: 'sweep', opts: { len: 0.7, seed: 0x5a2e19 }, from: 'the morph' },
  { t: HOP_O.b - 0.04, kind: 'land', from: 'he lands' },
  ...taps(MORPH.b - 0.1, MORPH.b + 0.25, 3, 0x2d11a3),
  { t: DROP.a, kind: 'whoosh', opts: { len: 0.3 }, from: 'API drops' },
  { t: DROP.b, kind: 'popDeep', from: 'API lands on the window' },
  { t: ORDERS, kind: 'whooshUp', opts: { len: 0.35 }, from: 'the order arrow' },
  { t: ORDERS + 0.02, kind: 'bwop', from: 'ORDER' },
  ...[0, 0.25].map(d => ({ t: +(WORK5 + d).toFixed(3), kind: 'servo', from: 'the gears' })),
  { t: ANSW, kind: 'whoosh', opts: { len: 0.35 }, from: 'the answer arrow' },
  { t: ANSW + 0.4, kind: 'chime', from: 'ANSWER' },
  { t: CLEAR.a, kind: 'whoosh', from: 'it clears' },
  { t: DRAW6.a, kind: 'sweep', opts: { len: 0.7, seed: 0x6b4d21 }, from: 'phone and kitchen draw' },
  ...taps(DRAW6.a + 0.3, DRAW6.b + 0.25, 4, 0x7c21e9),
  { t: WEA1, kind: 'whooshUp', opts: { len: 0.3 }, from: 'the order goes out' },
  { t: WEA1 + 0.45, kind: 'servo', from: 'the weather gear' },
  { t: TRAY6.a, kind: 'whoosh', opts: { len: 0.35 }, from: 'the tray with the cloud' },
  { t: RAIN + 0.02, kind: 'bwop', opts: { step: 1 }, from: 'RAIN' },
  { t: CHOP.a, kind: 'boing', from: 'the cloud hops' },
  { t: CHOP.b, kind: 'bubble', opts: { f0: 420, f1: 900 }, from: 'it lands on the phone' },
  ...[0.1, 0.32, 0.55, 0.8].map((d, k) => ({ t: +(CHOP.b + d).toFixed(3), kind: 'tap', opts: { seed: 0x4141 + k * 131 }, from: 'drips' })),
  { t: LAUGH[0], kind: 'titter', from: 'he laughs' },
  { t: LAUGH[1], kind: 'titter', opts: { step: 1 }, from: 'he laughs' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const BEATS = [0.3, ...LET, MEANS, IMAG, BLD_T.a, CAR_T.a, THRU, ROLL.a, WIN3, NEVER, KIT4, WORK4, FOOD, WIN4, THAT, MORPH.b, DROP.b, ORDERS, WORK5, ANSW, SO, DRAW6.b, WEA1, RAIN, CHOP.b, LAUGH[0]];
const STILLS = [0, LET[1] + 0.1, MEANS + 0.3, BLD_T.b, CAR_T.b + 0.1, THRU + 0.3, ROLL.b + 0.2, WIN3 + 0.5, NEVER + 0.3, WORK4 + 0.4, FOOD + 0.6,
  THAT + 0.4, MORPH.b + 0.3, DROP.b + 0.2, ORDERS + 0.6, ANSW + 0.6, DRAW6.b + 0.3, WEA1 + 0.5, RAIN + 0.4, CHOP.b + 0.4, LAUGH[0] + 0.2, CUT - 0.15, CUT + 0.6];

const res = await runEpisode({
  post: 52, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true, coda: SUNG,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { sweep: -26, whoosh: -21, popDeep: -15, riser: -19, bass: -20, servo: -24, titter: -22 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face,
    data: {},
    sleep: [],
    beats: BEATS,
    checks: ['#api', '#bld', '#win', '#sign', '#bp', '#word0 b', '#word1 b', '#word2 b', '#appl', '#appr', '#phone', '#k6', '#wk', '#lo', '#la'],
    hook: ['#api'],
    copy: [BIG, SIGN, ORDER_B, KIT, APP, W_ORD, W_ANS, BIG_ORD, BIG_ANS, BIG_RAIN, WX, RAINW, WK],
    verify: [
      /* the bubble stays clear of the building */
      { at: WIN3 + 0.6, sel: '#bp', test: r => (r && r.r < BLD.x - 4 ? null : 'the bubble reaches the building: ' + JSON.stringify(r)) },
      /* API sits on the window */
      { at: DROP.b + 0.4, sel: '#api', test: r => (r && Math.abs((r.l + r.r) / 2 - 270) < 4 && r.t > WIN5.y && r.b < WIN5.y + WIN5.h ? null : 'API is not on the window: ' + JSON.stringify(r)) },
      /* he is clear of the boxes and of the phone */
      { at: ANSW + 0.5, sel: '#m-card', test: r => (r && r.t > BOXL.y + BOXL.h + 8 ? null : 'he reaches the boxes: ' + JSON.stringify(r)) },
      { at: CHOP.b + 0.5, sel: '#m-card', test: r => (r && r.l > PH.x + PH.w + 4 && r.r < K6.x - 4 ? null : 'he reaches the phone or the kitchen: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [MEANS, 'means'], [IMAG, 'imagine'], [THRU, 'the sign'], [ROLL.a, 'the car rolls'], [WIN3, 'burger please'], [NEVER, 'never'], [WORK4, 'the gears'],
      [FOOD, 'the tray'], [THAT, 'the morph'], [DROP.b, 'API lands'], [ORDERS, 'order'], [ANSW, 'answer'], [SO, 'line 6'], [WEA1, 'the order goes out'], [RAIN, 'the rain tray'],
      [CHOP.b, 'rain on the phone'], [LAUGH[0], 'he laughs'], [SUNG.at, 'the sung line']],
  },
});
void res;
