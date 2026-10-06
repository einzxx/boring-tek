/* the boring tek — post53. what is an ai agent.

   dark, 1080x1920. six lines on the elevenlabs narrator, eleven_v4, three takes
   a line kept by measurement, speed 1.0, 0.42s gaps and one 0.58s gap of true
   silence before the last line. post52's subtitles, the plain end card. the rig
   is lib/aiafter.mjs with the series off, and the first clip on its cinematic
   kit: the living camera on every hold with a punch in on DOES, one whip pan
   and one zoom through, slam and rise for the big words, about 5 effects per
   10 seconds timed to the motion. `AI` is written in capitals for the voice:
   the transcript heard `AI` in all three takes of lines 1 to 3.

     l1  do you know ...      frame 0: AI over AGENT, sharp, him looking up. it slams again on `AI`
     l2  a normal ai chat ... a house bubble tagged chat, three tip lines write in, TELLS slams
     l3  an ai agent ...      whip pan. a lanyard and an intern badge draw on him, a happy hop
     l4  you say book ...     zoom through into a browser. he hops onto fri, onto 19 00, onto
                              book, it presses and a green tick lands
     l5  chat tells you ...   the browser drops, TELLS rises on the left, DOES slams bigger on the
                              right, the camera punches in
     silence                  a pay 200 euro pop up arrives with no sound
     l6  and a good one ...   he looks into the lens, a question mark, a calm happy nod
     the glitch cut, the plain end card

   line art only, green the one accent. eyes calm, happy or squint. no hands, no
   logos. on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post53.mjs          the preview
     node post53.mjs --stills             one still per beat, no render
     node post53.mjs                      60fps
*/

import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO,
  livingCamera, planTransitions, wordIn, wordStyle,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const LINES = [
  { key: 'r1', text: '[curious] do you know what an AI agent is?' },
  { key: 'r2', text: 'a normal AI chat is like a friend who gives advice. you ask how to book a table, and it tells you how.' },
  { key: 'r3', text: 'an AI agent is like an intern who does it for you.' },
  { key: 'r4', text: 'you say book a table for friday, and it opens the website, picks the time and books it.' },
  { key: 'r5', text: '[warmly] chat tells you. agent does it.' },
  { key: 'r6', text: '[playful] and a good one still asks before it spends your money.' },
];
const TAKES = await readLines(53, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6] = TAKES;
/* the silence before the last line: as long as the gap guard allows */
const HUSH = 0.58;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (i === 5 ? HUSH : VGAP));
const SUBS = [
  { line: 0, text: 'do you know' },
  { line: 0, text: 'what an ai agent is?' },
  { line: 1, text: 'a normal ai chat is like' },
  { line: 1, text: 'a friend who gives advice' },
  { line: 1, text: 'you ask how to book a table' },
  { line: 1, text: 'and it tells you how' },
  { line: 2, text: 'an ai agent is like an intern' },
  { line: 2, text: 'who does it for you' },
  { line: 3, text: 'you say book a table for friday' },
  { line: 3, text: 'and it opens the website' },
  { line: 3, text: 'picks the time and books it' },
  { line: 4, text: 'chat tells you' },
  { line: 4, text: 'agent does it' },
  { line: 5, text: 'and a good one still asks' },
  { line: 5, text: 'before it spends your money' },
];

/* ---------- the words on screen ---------- */
const W_AI = 'AI', W_AGENT = 'AGENT', W_TELLS = 'TELLS', W_DOES = 'DOES';
const T_CHAT = 'chat', T_AGENT = 'agent', BADGE = 'intern', FRI = 'fri', TIME = '19 00', BOOK = 'book', PAY = 'pay 200 euro', QM = '?';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 640, size: 118, scale: 0.9 };
const P0 = { x: 270, y: 560, s: 0.9 };        /* line 1, under AI AGENT */
const P2 = { x: 170, y: 640, s: 0.9 };        /* line 2, the bubble off his head */
const P3 = { x: 270, y: 540, s: 0.9 };        /* line 3, the badge */
const SMALL = 0.55;
/* the browser, line 4 */
const BR = { x: 70, y: 250, w: 400, h: 390 };
const DAY = { y: 350, h: 36, w: 58, gap: 12 }; DAY.l = 270 - (5 * DAY.w + 4 * DAY.gap) / 2;
const HR = { y: 450, h: 36, w: 84, gap: 16 }; HR.l = 270 - (3 * HR.w + 2 * HR.gap) / 2;
const BK = { x: 180, y: 545, w: 180, h: 48 };
const HEAD_S = 118 * SMALL / 2;
const P4 = { x: 140, y: 590, s: SMALL };
const ON_FRI = { x: DAY.l + 4 * (DAY.w + DAY.gap) + DAY.w / 2, y: DAY.y - HEAD_S + 3, s: SMALL };
const ON_HR = { x: 270, y: HR.y - HEAD_S + 3, s: SMALL };
const ON_BK = { x: 270, y: BK.y - HEAD_S + 3, s: SMALL };
const TICK = { x: BK.x + BK.w - 6, y: BK.y - 4 };
const P5 = { x: 270, y: 640, s: 0.9 };
const WY = 300, WX = { tells: 160, does: 370 };
const POP = { x: 150, y: 380, w: 240, h: 100 };
/* the house bubble on line 2: two dots up and right of him, then a rounded box */
const HEADR = 30 / 64 * MAS.size * 0.9;
const TB = { angle: -55 * Math.PI / 180, gap: 9, d0: 9, d1: 13 };
TB.r0 = HEADR + TB.gap + TB.d0 / 2; TB.r1 = TB.r0 + TB.d0 / 2 + TB.gap + TB.d1 / 2; TB.r2 = TB.r1 + TB.d1 / 2 + TB.gap;
TB.c0 = { x: P2.x + TB.r0 * Math.cos(TB.angle), y: P2.y + TB.r0 * Math.sin(TB.angle) };
TB.c1 = { x: P2.x + TB.r1 * Math.cos(TB.angle), y: P2.y + TB.r1 * Math.sin(TB.angle) };
const BUB = { x: 200, w: 270, h: 100 }; BUB.b = +(P2.y + TB.r2 * Math.sin(TB.angle)).toFixed(2); BUB.y = BUB.b - BUB.h;

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const idx = (T, x) => T.W.findIndex(v => v.word.toLowerCase().replace(/[^a-z0-9]/g, '') === x);
const R1 = w(L1, 'AI');
const OUT1 = +(L2.at - 0.05).toFixed(3);
const BUB_IN = w(L2, 'chat');
const LINES_T = { a: w(L2, 'friend'), b: w(L2, 'table') };
const TELLS = w(L2, 'tells');
const WHIP = +(L3.at - 0.05).toFixed(3);
const INTERN = w(L3, 'intern'), HOP3 = w(L3, 'does'), LANY = +(WHIP + 0.3).toFixed(3);
const OPENS = w(L4, 'opens');
const ZOOM = +(L4.at - 0.05).toFixed(3);
const HOP = [w(L4, 'friday'), w(L4, 'time'), w(L4, 'books')];
const PRESS = +(HOP[2] + 0.1).toFixed(3), TICK_AT = +(HOP[2] + 0.28).toFixed(3);
const DROP = +(L5.at - 0.05).toFixed(3);
const TELLS2 = w(L5, 'tells'), DOES = w(L5, 'does');
const QUIET = +(L5.end + 0.02).toFixed(3);
const POP_AT = +(L5.end + 0.12).toFixed(3);
const ASKS = w(L6, 'asks'), MONEY = w(L6, 'money');
const CUT = +(L6.end + 0.45).toFixed(3);
const HOLD = 1.2;

const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });
const draw = (t, a, b) => f3(1 - IO(span(t, a, b)));

/* ---------- the camera and the cuts ---------- */
const TX = planTransitions([
  { type: 'whip', at: WHIP, from: '#scA', to: '#scB', dir: 1 },
  { type: 'zoom', at: ZOOM, from: '#scB', to: '#scC' },
]);
const camera = livingCamera({
  F: { x: 270, y: 420 },
  holds: [[0.3, R1 - 0.05], [LINES_T.b + 0.3, WHIP - 0.3], [LANY + 0.8, HOP3 - 0.05], [HOP3 + 0.5, ZOOM - 0.25], [TELLS2 + 0.4, DOES], [POP_AT + 0.3, CUT]],
  punches: [DOES],
  also: TX.dip,
});

/* ---------- where he is, and how big ---------- */
const hopArc = (t, a, b, A, B, h) => {
  const k = EASE(span(t, a, b));
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * span(t, a, b)), s: lerp(A.s, B.s, k) };
};
function where(t) {
  if (t < OUT1) return P0;
  if (t < WHIP - 0.2) return hopArc(t, OUT1, OUT1 + 0.5, P0, P2, 30);
  if (t < ZOOM - 0.2) return hopArc(t, WHIP - 0.2, WHIP + 0.2, P2, P3, 0);
  if (t < ZOOM) return P3;
  if (t < HOP[0] - 0.35) return hopArc(t, ZOOM, ZOOM + 0.5, P3, P4, 0);
  if (t < HOP[1] - 0.35) return hopArc(t, HOP[0] - 0.35, HOP[0] + 0.1, P4, ON_FRI, 70);
  if (t < HOP[2] - 0.35) return hopArc(t, HOP[1] - 0.35, HOP[1] + 0.1, ON_FRI, ON_HR, 60);
  if (t < DROP) return hopArc(t, HOP[2] - 0.35, HOP[2] + 0.1, ON_HR, ON_BK, 50);
  return hopArc(t, DROP, DROP + 0.5, ON_BK, P5, 40);
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: AT(270, 260) },
  { at: OUT1 + 0.2, to: AT(BUB.x + 60, BUB.y + 50) },
  { at: TELLS, to: AT(270, WY) },
  { at: WHIP + 0.1, to: LENS },
  { at: INTERN, to: AT(270, P3.y + 110) },
  { at: HOP3, to: LENS },
  { at: ZOOM + 0.3, to: AT(ON_FRI.x, ON_FRI.y) },
  { at: HOP[0] + 0.15, to: AT(ON_HR.x, ON_HR.y + 30) },
  { at: HOP[1] + 0.15, to: AT(ON_BK.x, ON_BK.y + 40) },
  { at: HOP[2] + 0.2, to: AT(TICK.x, TICK.y) },
  { at: TELLS2, to: AT(WX.tells, WY) },
  { at: DOES, to: AT(WX.does, WY) },
  { at: POP_AT, to: AT(270, POP.y + 40) },
  { at: ASKS, to: LENS },
];
const BLINKS = [1.0, +(L2.at + 1.3).toFixed(3), +(L3.at + 0.9).toFixed(3), +(L4.at + 0.8).toFixed(3), +(L5.at + 0.6).toFixed(3), +(L6.at + 0.15).toFixed(3)];
const HAPPY = [HOP3 + 0.05, TICK_AT + 0.05, MONEY + 0.05];
const HOPS = [[R1 + 0.02, 8], [HOP3, 12]];
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
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  let dy = 0, rot = 0, sq = 0;
  for (const [h, up] of HOPS) dy -= up * Math.sin(Math.PI * span(t, h, h + 0.3));
  /* the curious tilt on line 1, the nod on `money` */
  rot += 7 * bump(t, R1, 0.2, 0.6, 0.3);
  dy += 7 * Math.sin(Math.PI * span(t, MONEY, MONEY + 0.45));
  /* a squash on every landing in the browser */
  for (const a of HOP) sq += 0.08 * Math.sin(Math.PI * span(t, a + 0.08, a + 0.28));
  sq += 0.06 * Math.sin(Math.PI * span(t, DROP + 0.46, DROP + 0.66));
  /* the idle breath, only while he stands still */
  const still = t < OUT1 || (t > WHIP + 0.2 && t < ZOOM - 0.2) || t > DROP + 0.6;
  if (still) dy += 2.5 * Math.sin(2 * Math.PI * t / 2.2);
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy + dy), rot: f3(rot), sq: f3(sq), s: f3(p.s) };
}

/* ---------- a frame of the story ---------- */
const ws = (S, id, wv, k = 1) => { const st = wordStyle(wv); S.push([id, 'opacity', f3(st.opacity * k)], [id, 'transform', st.transform], [id, 'filter', st.filter]); };
function frame(t) {
  const A = [], S = [], X = [];
  /* AI AGENT: whole and sharp on frame 0, slams again on `AI`, goes on line 2 */
  const head = t < R1 ? { o: 1, s: 1, y: 0, blur: 0 } : { ...wordIn(t, R1, 'slam'), o: 1 };
  const g1 = 1 - out(t, OUT1, 0.3);
  ws(S, 'wai', { ...head, s: f3(head.s * lerp(0.85, 1, g1)) }, g1);
  /* the chat bubble: dots, the box, the tag, the tip lines writing in */
  const bOut = 1 - out(t, WHIP - 0.15, 0.15);
  const dot = (x, k) => (t < x ? { o: 0, s: 0.55 } : { o: f3(smooth(span(t, x, x + 0.08)) * bOut), s: f3(lerp(0.55, 1, SPRING(span(t, x, x + k)))) });
  [['bd0', dot(BUB_IN, 0.3)], ['bd1', dot(BUB_IN + 0.07, 0.3)], ['bb', dot(BUB_IN + 0.14, 0.36)]].forEach(([id, v]) => S.push([id, 'opacity', v.o], [id, 'transform', 'scale(' + v.s + ')']));
  const n = 3, seg = (LINES_T.b - LINES_T.a) / n;
  for (let i = 0; i < n; i++) A.push(['tl' + i, 'stroke-dashoffset', draw(t, LINES_T.a + i * seg, LINES_T.a + (i + 0.85) * seg)]);
  ws(S, 'wtells', wordIn(t, TELLS, 'slam'), bOut);
  /* the badge: the lanyard draws, the card pops */
  A.push(['ly0', 'stroke-dashoffset', draw(t, LANY, LANY + 0.7)], ['ly1', 'stroke-dashoffset', draw(t, LANY + 0.08, LANY + 0.78)]);
  const bg = pop(t, INTERN + 0.3, 0.4, 0.5);
  S.push(['badge', 'opacity', bg.o], ['badge', 'transform', 'translate(-50%,0) scale(' + bg.s + ')']);
  /* the browser: chips light as he lands, the button presses, the tick */
  const dropK = EASE(span(t, DROP, DROP + 0.35));
  S.push(['brw', 'opacity', f3(1 - dropK)], ['brw', 'transform', 'translateY(' + f2(70 * dropK) + 'px)']);
  /* the page loading on `opens`: a green line runs along the address bar */
  A.push(['load', 'stroke-dashoffset', draw(t, OPENS, OPENS + 0.7)]);
  const lit = a => f3(smooth(span(t, a + 0.08, a + 0.2)));
  S.push(['cfri', 'opacity', lit(HOP[0])], ['chr', 'opacity', lit(HOP[1])], ['cbk', 'opacity', lit(PRESS)]);
  S.push(['bkw', 'transform', 'scale(' + f3(1 - 0.06 * Math.sin(Math.PI * span(t, PRESS, PRESS + 0.2))) + ')']);
  const tk = pop(t, TICK_AT, 0.35, 0.3);
  S.push(['tick', 'opacity', tk.o], ['tick', 'transform', 'scale(' + tk.s + ')']);
  /* line 5: TELLS rises back on the left, DOES slams bigger on the right */
  const quiet = 1 - out(t, QUIET, 0.25);
  ws(S, 'wt2', wordIn(t, TELLS2, 'rise'), quiet);
  const dz = wordIn(t, DOES, 'slam');
  ws(S, 'wd2', { ...dz, s: f3(dz.s * 1.3) }, quiet);
  S.push(['tg1', 'opacity', f3(smooth(span(t, TELLS2 + 0.2, TELLS2 + 0.4)) * quiet)], ['tg2', 'opacity', f3(smooth(span(t, DOES + 0.25, DOES + 0.45)) * quiet)]);
  /* the silence: the pop up arrives with no sound, the question mark on `asks` */
  const pp = pop(t, POP_AT, 0.45, 0.7);
  S.push(['pop', 'opacity', pp.o], ['pop', 'transform', 'scale(' + pp.s + ')']);
  const p = where(t), qm = pop(t, ASKS, 0.4, 0.4);
  S.push(['qm', 'opacity', f3(qm.o * (1 - out(t, MONEY + 0.3, 0.3)))], ['qm', 'transform', 'translate(' + f2(p.x + 34) + 'px,' + f2(p.y - 78) + 'px) scale(' + qm.s + ')']);
  return { A, S, X, tx: TX.frame(t) };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const css = `
.sc{position:absolute;inset:0}
.sc svg{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
.ln{fill:none;stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 1}
.dim{fill:none;stroke:rgba(233,238,236,.4);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.big{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
.big b{display:block;font:400 56px/1 var(--display);color:#f7f9f8;letter-spacing:.06em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
#wai{top:0;opacity:1}
#wai b{display:flex;flex-direction:column;align-items:center;gap:22px;transform:translateY(${260 - 48}px)}
#wai b span:first-child{font-size:104px}
#wai b span:last-child{font-size:70px}
.side{position:absolute;top:${WY}px;width:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
.side b{display:block;font:400 34px/1 var(--display);color:#f7f9f8;letter-spacing:.05em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
.tg{position:absolute;top:${WY + 46}px;width:120px;margin-left:-60px;text-align:center;font:400 16px/1 var(--mono);color:var(--sub);letter-spacing:.12em;opacity:0}
.bd{position:absolute;display:block;border-radius:50%;background:#06070a;border:2px solid rgba(213,219,216,.5);opacity:0;will-change:transform,opacity}
#bb{position:absolute;left:${BUB.x}px;top:${BUB.y.toFixed(2)}px;width:${BUB.w}px;height:${BUB.h}px;border:2px solid rgba(213,219,216,.5);border-radius:28px;background:#06070a;opacity:0;
  transform-origin:${(TB.c1.x - BUB.x).toFixed(1)}px 100%;will-change:transform,opacity}
#bb i{position:absolute;left:20px;top:-24px;font:400 16px/1 var(--mono);color:var(--sub);letter-spacing:.14em;font-style:normal}
#bb svg{position:absolute;left:0;top:0;width:${BUB.w}px;height:${BUB.h}px;overflow:visible}
#badge{position:absolute;left:${P3.x}px;top:${P3.y + 76}px;width:96px;height:52px;border:2px solid #e9eeec;border-radius:7px;background:#06070a;display:flex;align-items:center;justify-content:center;gap:6px;
  font:400 17px/1 var(--mono);color:var(--fg);letter-spacing:.06em;opacity:0;transform-origin:50% 0;will-change:transform,opacity}
#badge s{display:block;width:7px;height:7px;border-radius:50%;background:var(--accent)}
#brw{position:absolute;inset:0;will-change:transform,opacity}
.chip{position:absolute;border:2px solid rgba(233,238,236,.45);border-radius:9px;display:flex;align-items:center;justify-content:center;font:400 18px/1 var(--mono);color:var(--fg);letter-spacing:.04em}
.chip u{display:block;width:40%;height:3px;border-radius:2px;background:rgba(233,238,236,.22)}
.chip .on{position:absolute;inset:-2px;border:2px solid var(--accent);border-radius:9px;color:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0}
#bkw{position:absolute;left:${BK.x}px;top:${BK.y}px;width:${BK.w}px;height:${BK.h}px;will-change:transform}
#bkw .chip{inset:0;border-radius:24px;border-color:#e9eeec;font-size:18px}
#bkw .on{border-radius:24px;background:rgba(80,255,140,.08)}
#tick{position:absolute;left:${TICK.x - 17}px;top:${TICK.y - 17}px;width:34px;height:34px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity}
#pop{position:absolute;left:${POP.x}px;top:${POP.y}px;width:${POP.w}px;height:${POP.h}px;border:1px solid rgba(255,255,255,.3);border-radius:14px;background:#14171c;opacity:0;will-change:transform,opacity;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
#pop b{font:500 22px/1 var(--read);color:var(--fg);white-space:nowrap}
#pop i{display:block;width:110px;height:24px;border:2px solid rgba(233,238,236,.45);border-radius:12px}
#qm{position:absolute;left:0;top:0;width:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity}
#qm b{display:block;font:400 34px/1 var(--display);color:#f7f9f8;transform:translateY(-50%);filter:drop-shadow(0 0 10px rgba(255,255,255,.35))}
`;
const TICKSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06070a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const bdot = (id, c, d) => `<i class="bd" id="${id}" style="left:${(c.x - d / 2).toFixed(2)}px;top:${(c.y - d / 2).toFixed(2)}px;width:${d}px;height:${d}px"></i>`;
const chip = (l, top, wd, h, label, on) => `<div class="chip" style="left:${l}px;top:${top}px;width:${wd}px;height:${h}px">${label || '<u></u>'}${on ? `<span class="on" id="${on}">${label}</span>` : ''}</div>`;
const days = [0, 1, 2, 3, 4].map(i => chip(DAY.l + i * (DAY.w + DAY.gap), DAY.y, DAY.w, DAY.h, i === 4 ? FRI : '', i === 4 ? 'cfri' : '')).join('');
const hours = [0, 1, 2].map(i => chip(HR.l + i * (HR.w + HR.gap), HR.y, HR.w, HR.h, i === 1 ? TIME : '', i === 1 ? 'chr' : '')).join('');
const markup = `
<div class="sc" id="scA">
  <div class="big" id="wai"><b><span>${W_AI}</span><span>${W_AGENT}</span></b></div>
  ${bdot('bd0', TB.c0, TB.d0)}${bdot('bd1', TB.c1, TB.d1)}
  <div id="bb"><i>${T_CHAT}</i><svg viewBox="0 0 ${BUB.w} ${BUB.h}">
    ${[0, 1, 2].map(i => `<circle cx="26" cy="${28 + i * 22}" r="3" style="fill:rgba(233,238,236,.5)"/><path id="tl${i}" class="ln" pathLength="1" stroke-dashoffset="1" d="M40 ${28 + i * 22} H${[240, 210, 170][i]}" style="stroke:rgba(233,238,236,.7);stroke-width:3"/>`).join('')}
  </svg></div>
  <div class="big" id="wtells" style="top:${WY}px"><b>${W_TELLS}</b></div>
</div>
<div class="sc" id="scB" style="opacity:0">
  <svg viewBox="0 0 540 960">
    <path id="ly0" class="ln" pathLength="1" stroke-dashoffset="1" d="M${P3.x - 32} ${P3.y + 28} L${P3.x - 16} ${P3.y + 78}"/>
    <path id="ly1" class="ln" pathLength="1" stroke-dashoffset="1" d="M${P3.x + 32} ${P3.y + 28} L${P3.x + 16} ${P3.y + 78}"/>
  </svg>
  <div id="badge"><s></s>${BADGE}</div>
</div>
<div class="sc" id="scC" style="opacity:0">
  <div id="brw">
    <svg viewBox="0 0 540 960">
      <rect class="ln" x="${BR.x}" y="${BR.y}" width="${BR.w}" height="${BR.h}" rx="14" style="stroke-dasharray:none;fill:#06070a"/>
      <path class="dim" d="M${BR.x} ${BR.y + 42} H${BR.x + BR.w}"/>
      ${[0, 1, 2].map(i => `<circle class="dim" cx="${BR.x + 22 + i * 16}" cy="${BR.y + 21}" r="4.5"/>`).join('')}
      <rect class="dim" x="${BR.x + 80}" y="${BR.y + 11}" width="${BR.w - 104}" height="20" rx="10"/>
      <path id="load" class="ln" pathLength="1" stroke-dashoffset="1" d="M${BR.x + 92} ${BR.y + 21} H${BR.x + BR.w - 36}" style="stroke:var(--accent);stroke-width:3"/>
    </svg>
    ${days}${hours}
    <div id="bkw">${chip(0, 0, BK.w, BK.h, BOOK, 'cbk').replace('style="left:0px;top:0px;width:' + BK.w + 'px;height:' + BK.h + 'px"', '')}</div>
    <div id="tick">${TICKSVG}</div>
  </div>
</div>
<div class="sc" id="scD">
  <div class="side" id="wt2" style="left:${WX.tells}px"><b>${W_TELLS}</b></div>
  <div class="side" id="wd2" style="left:${WX.does}px"><b>${W_DOES}</b></div>
  <div class="tg" id="tg1" style="left:${WX.tells}px">${T_CHAT}</div>
  <div class="tg" id="tg2" style="left:${WX.does}px">${T_AGENT}</div>
  <div id="pop"><b>${PAY}</b><i></i></div>
</div>`;
const front = `<div id="qm"><b>${QM}</b></div>`;

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

/* ---------- the sound: about 5 effects per 10 seconds, on contact or on the
   fastest frame, and nothing at all in the silence before the last line ---------- */
const CUES = [
  { t: R1 + 0.05, kind: 'popDeep', from: 'AI AGENT slams, contact' },
  { t: BUB_IN + 0.14, kind: 'bubble', from: 'the chat bubble' },
  { t: TELLS + 0.05, kind: 'popDeep', from: 'TELLS slams, contact' },
  { t: WHIP - 0.12, kind: 'whoosh', opts: { len: 0.3 }, from: 'the whip, fastest at the cut' },
  { t: HOP3 + 0.28, kind: 'land', from: 'the happy hop lands' },
  { t: ZOOM - 0.28, kind: 'whooshUp', opts: { len: 0.32 }, from: 'the zoom through, fastest at the cut' },
  { t: HOP[0] + 0.08, kind: 'tock', opts: { f: 1500 }, from: 'he lands on fri' },
  { t: HOP[1] + 0.08, kind: 'tock', opts: { f: 1700 }, from: 'he lands on 19 00' },
  { t: TICK_AT + 0.02, kind: 'chime', from: 'the tick lands' },
  { t: DOES + 0.05, kind: 'popDeep', from: 'DOES slams, contact' },
  { t: ASKS + 0.03, kind: 'bubble', opts: { f0: 420, f1: 980 }, from: 'the question mark' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
for (const c of CUES) if (c.t > L5.end - 0.05 && c.t < L6.at) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [0.3, R1, OUT1, BUB_IN, LINES_T.a, TELLS, WHIP, LANY, INTERN, OPENS, HOP3, ZOOM, ...HOP, TICK_AT, DROP, TELLS2, DOES, POP_AT, ASKS, MONEY];
const STILLS = [0, R1 + 0.15, BUB_IN + 0.5, LINES_T.b, TELLS + 0.3, WHIP, INTERN + 0.6, HOP3 + 0.2, ZOOM - 0.05, ZOOM + 0.35, HOP[0] + 0.2, HOP[1] + 0.2, TICK_AT + 0.3,
  TELLS2 + 0.4, DOES + 0.3, POP_AT + 0.4, ASKS + 0.3, MONEY + 0.2, CUT - 0.15, CUT + 0.6];

const res = await runEpisode({
  post: 53, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { whoosh: -21, popDeep: -15, bass: -20 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: {},
    sleep: [],
    beats: BEATS,
    checks: ['#wai b', '#bb', '#wtells b', '#badge', '#brw rect', '#bkw', '#tick', '#wt2 b', '#wd2 b', '#tg1', '#tg2', '#pop', '#qm b'],
    hook: ['#wai b'],
    copy: [W_AI, W_AGENT, W_TELLS, W_DOES, T_CHAT, T_AGENT, BADGE, FRI, TIME, BOOK, PAY, QM],
    verify: [
      /* the bubble stays off his head and inside the margin */
      { at: LINES_T.b, sel: '#bb', test: r => (r && r.b < P2.y - HEADR - 10 && r.r <= 481 ? null : 'the chat bubble is off its spot: ' + JSON.stringify(r)) },
      /* he stands on each chip, not inside it */
      { at: HOP[0] + 0.3, sel: '#m-card', test: r => (r && r.b <= DAY.y + 6 ? null : 'he sinks into fri: ' + JSON.stringify(r)) },
      { at: HOP[2] + 0.3, sel: '#m-card', test: r => (r && r.b <= BK.y + 6 ? null : 'he sinks into book: ' + JSON.stringify(r)) },
      /* DOES, slammed bigger, stays inside the margin */
      { at: DOES + 0.6, sel: '#wd2 b', test: r => (r && r.r <= 481 && r.l > WX.tells + 60 ? null : 'DOES is off its spot: ' + JSON.stringify(r)) },
      /* the pop up clears his question mark */
      { at: ASKS + 0.4, sel: '#qm b', test: r => (r && r.t > POP.y + POP.h + 4 ? null : 'the question mark reaches the pop up: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [R1, 'AI AGENT slams'], [BUB_IN, 'the chat bubble'], [TELLS, 'TELLS'], [WHIP, 'the whip'], [INTERN, 'the badge'], [ZOOM, 'the zoom through'],
      [HOP[0], 'fri'], [HOP[1], '19 00'], [HOP[2], 'book'], [TICK_AT, 'the tick'], [DROP, 'line 5'], [DOES, 'DOES'], [QUIET, 'the silence'], [POP_AT, 'the pop up'], [ASKS, 'asks'], [MONEY, 'the nod']],
  },
});
void res;
