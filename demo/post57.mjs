/* the boring tek — post57. AI vs AI, the gym membership.

   dark, 1080x1920. six lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, every take sped up 1.12 with atempo, pitch
   kept. post56's subtitles, the plain end card. the rig is lib/aiafter.mjs with
   the series off, on the cinematic kit and post56's kit: hitPulse on every pop
   and slam, the scramble on the cancel card.
   a short gag with a silent run of bubbles in the middle, so `maxGap: 2.0`.

     frame 0  our head left, the gym AI right with its sweatband, both in line
              art headsets, one small wave arc from each mic, AI VS AI
     l1       someone asked AI ...    YOUR AI under him, the CANCEL GYM MEMBERSHIP
                                      card decodes in over him, a happy nod
     l2       easy. it calls ...      a ring, both mic lights turn on, wave arcs
                                      pulse out of his mic, the call timer starts
                                      at 00:00. from here every bubble sends short
                                      wave arcs out of the speaker's mic, toward
                                      the other head, gone before the middle
     l3       but the gym has ...     the gym AI bounces, GYM AI slams, the
                                      dumbbell pops in, he squints
     l4       and they are both ...   the bubble ping pong, six polite bubbles,
                                      then faster and faster, a loop of flicks
     l5       three hours later       the bubbles become a ring spinning round both
                                      heads, the timer races to 03:00:00, both squint
     silence                          the ring snaps away, two squinting heads
     l6       and they signed you up. twice.   GYM MEMBERSHIP 1 slams on signed,
                                      GYM MEMBERSHIP 2 on twice, SIGNED stamps them,
                                      both nod happily, he turns to the lens, squints
     the glitch cut, the plain end card

   the gym AI is drawn here, not by the rig: the same white plate, the same
   pill eyes and lids, the same glow, and the rig's eye rules checked on it by
   this file. line art only. green on our side, orange on theirs, and orange only
   on the sweatband stripe, the GYM AI label, their bubbles and their mic light. no logos, no gym
   names. on screen copy has no dashes, apostrophes or quotes, and colons only in
   the call timer, the one named exception of this clip.

     DEMO_FPS=12 node post57.mjs          the preview
     node post57.mjs --stills             one still per beat, no render
     node post57.mjs                      60fps
*/

import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, EASE, IO, SPRING,
  livingCamera, wordIn, wordStyle, CURVE, CURVE56, hitPulse, scramble, lmix,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.12;
const LINES = [
  { key: 'r1', text: '[excited] someone asked AI to cancel their gym membership.', tempo: TEMPO },
  { key: 'r2', text: '[cheerful] easy. it calls the gym.', tempo: TEMPO },
  { key: 'r3', text: '[amused] but the gym has an AI too.', tempo: TEMPO },
  { key: 'r4', text: '[playful] and they are both very, very polite.', tempo: TEMPO },
  { key: 'r5', text: '[amused] three hours later...', tempo: TEMPO },
  { key: 'r6', text: '[cheerful] and they signed you up. twice.', tempo: TEMPO },
];
const TAKES = await readLines(57, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6] = TAKES;
const SUBS = [
  { line: 0, text: 'someone asked AI to cancel' },
  { line: 0, text: 'their gym membership' },
  { line: 1, text: 'easy. it calls the gym' },
  { line: 2, text: 'but the gym has an AI too' },
  { line: 3, text: 'and they are both very, very polite' },
  { line: 4, text: 'three hours later...' },
  { line: 5, text: 'and they signed you up. twice' },
];

/* ---------- the words on screen ---------- */
const W_VS = ['AI', 'VS', 'AI'], W_C1 = 'CANCEL', W_C2 = 'GYM MEMBERSHIP', W_YOUR = 'YOUR AI', W_GYM = 'GYM AI';
const BUBS = [
  { side: 0, l: ['I WOULD LIKE', 'TO CANCEL.'] },
  { side: 1, l: ['ARE YOU', 'SURE?'] },
  { side: 0, l: ['YES,', 'THANK YOU.'] },
  { side: 1, l: ['HOW ABOUT', '50% OFF?'] },
  { side: 0, l: ['NO,', 'THANK YOU.'] },
  { side: 1, l: ['ARE YOU', 'SURE?'] },
];
const W_M1 = 'GYM MEMBERSHIP 1', W_M2 = 'GYM MEMBERSHIP 2', W_FOR = 'FOR YOU', W_SIGNED = 'SIGNED';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 138, cy: 540, size: 118, scale: 1.15 };
const HS = +(MAS.size * MAS.scale).toFixed(2);            /* both heads drawn this big */
const HR = 30 / 64 * HS;                                  /* the plate's radius */
const GYM = { cx: 402, cy: 540 };
const VS_Y = 132, TMR_Y = 214;
/* the phone line: head edge to head edge, a soft sag */
/* the headsets: the mic sits low on the side facing the other head, in the
   head's own 64 units, so ours is at (56, 58.6) and theirs mirrored */
const HSK = HS / 64, MIC = { x: 24, y: 26.6 };
const CARD = { x: 72, y: 334, w: 304, h: 98 };
const LAB_Y = Math.round(MAS.cy + HR + 22);
const DB = { x: GYM.cx, y: LAB_Y + 54 };
/* the bubbles: two dots up and out of each head, then the box */
const BANG = -58 * Math.PI / 180, BD = [9, 13], BGAP = 7;
const br0 = HR + BGAP + BD[0] / 2, br1 = br0 + BD[0] / 2 + BGAP + BD[1] / 2, br2 = br1 + BD[1] / 2 + BGAP;
const BDOT = [{ x: br0 * Math.cos(BANG), y: br0 * Math.sin(BANG) }, { x: br1 * Math.cos(BANG), y: br1 * Math.sin(BANG) }];
const BBOT = +(-br2 * Math.sin(BANG)).toFixed(2);          /* the box's bottom above the head's centre */
/* the ring on line 5, round both heads */
const RING = { cx: 270, cy: MAS.cy - 8, rx: 180, ry: 130, n: 8, ghosts: 4 };
/* the two cards on line 6, stacked over the heads */
const MC = { x: 84, w: 372, h: 72, y1: 254, y2: 334 };
const STP = { x: 300, y: MC.y2 + MC.h + 16 };

/* ---------- the beats, all off the read ---------- */
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3), f4 = v => +v.toFixed(4);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
place(L1, 0.30);
const YOURS = w(L1, 'AI');
const CARD_IN = w(L1, 'cancel');
const NOD1 = f3(w(L1, 'membership') + 0.12);
place(L2, L1.end + 0.3);
const EASY = w(L2, 'easy');
const CALL = w(L2, 'calls');
const CALL_D = 0.5;
const TSTART = f3(CALL + CALL_D);
place(L3, L2.end + 0.3);
const GYM_IN = w(L3, 'AI');
const CARD_OUT = f3(GYM_IN - 0.02);
const DB_IN = f3(GYM_IN + 0.2);
place(L4, L3.end + 0.3);
/* the ping pong, each bubble a little sooner than the last */
const B0 = f3(L4.at + 0.06);
const BGAPS = [0.6, 0.58, 0.55, 0.52, 0.48];
const BT = BGAPS.reduce((a, d) => [...a, f3(a[a.length - 1] + d)], [B0]);
/* then the loop: the last four again and again, faster each time, flicks */
const FLICK0 = f3(BT[5] + 0.36);
const FL_GAPS = [0.25, 0.2, 0.16, 0.13, 0.11, 0.095, 0.085, 0.075];
const FLICK = FL_GAPS.reduce((a, d) => [...a, f3(a[a.length - 1] + d)], [FLICK0]);
const FLICK_ID = FLICK.map((_, i) => 2 + (i % 4));
place(L5, FLICK[FLICK.length - 1] + 0.06);
if (L5.at - L4.end > 2.0) throw new Error('the gap before line 5 is over 2.0s: ' + (L5.at - L4.end).toFixed(2));
const RING_IN = f3(L5.at - 0.12);
const LATER = w(L5, 'later');
const LAND = f3(LATER + 0.22);
const RING_OUT = f3(L5.end - 0.02);
/* the silence before the payoff, nothing moves but the squint and the camera */
const HUSH = 0.6;
place(L6, L5.end + HUSH);
const C1 = w(L6, 'signed');
const C2 = w(L6, 'twice');
const HIT1 = f3(C1 + 0.06), HIT2 = f3(C2 + 0.06);
const STAMP = f3(Math.max(C2 + 0.42, L6.end + 0.05));
const NOD2 = f3(STAMP + 0.3);
const TURN = f3(NOD2 + 0.5), TURN_D = 0.35;
/* the squint is full when the turn lands, the cut half a second after it */
const CUT = f3(TURN + TURN_D + 0.5);
const HOLD = 1.2;

const out = (t, a, d = 0.25) => f4(EASE(span(t, a, a + d)));
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: f4(lerp(from, 1, SPRING(span(t, a, a + d)))), o: f3(smooth(span(t, a, a + 0.08))) });

/* ---------- the camera: a slow push on every hold, one punch on the stamp ---------- */
const camera = livingCamera({
  F: { x: 270, y: 440 },
  holds: [[0.3, CALL - 0.05], [TSTART + 0.1, GYM_IN - 0.05], [L5.at, C1 - 0.08], [NOD2, CUT]],
  punches: [STAMP],
});

/* ---------- the two faces ---------- */
const LENS = { w: 0 };
const AT = (x, y, wt = 1) => ({ x, y, w: wt });
const ATGYM = AT(GYM.cx, GYM.cy, 0.7), ATUS = AT(MAS.cx, MAS.cy, 0.7);
const CARDS_AT = { x: 270, y: (MC.y1 + MC.y2 + MC.h) / 2 };
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
/* who speaks when: each bubble's own pop is a small lift of its head */
const POPS = [...BT.map((t, i) => [t, i]), ...FLICK.map((t, k) => [t, FLICK_ID[k]])];
const talk = (t, side) => {
  let dy = 0;
  for (const [a, i] of POPS) if (BUBS[i].side === side) dy -= 4 * Math.sin(Math.PI * span(t, a - 0.02, a + 0.16));
  return dy;
};
/* both squint slowly through line 5 and the silence, and open on the cards */
const sqLong = t => 0.44 * smooth(span(t, L5.at + 0.1, L5.at + 1.1)) * (1 - smooth(span(t, C1 - 0.05, C1 + 0.1)));

/* ours, the rig draws him */
const US_LOOKS = [
  { at: 0, to: ATGYM },
  { at: CARD_IN - 0.05, to: AT(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2) },
  { at: EASY, to: LENS },
  { at: CALL, to: ATGYM, d: 0.3 },
  { at: C1 - 0.05, to: AT(CARDS_AT.x, CARDS_AT.y) },
  { at: NOD2 - 0.1, to: ATGYM },
  { at: TURN, to: LENS, d: TURN_D },
];
const US_BLINKS = [1.6, f3(L3.at - 0.25), f3(BT[3] + 0.25), f3(STAMP + 0.12)];
const US_HAPPY = [NOD1, EASY + 0.02, BT[2] + 0.04, BT[4] + 0.04, NOD2];
function face(t) {
  const here = { x: MAS.cx, y: MAS.cy };
  const look = lookAt(US_LOOKS, t, here);
  let lid = Math.max(0.04, blink(t, US_BLINKS));
  /* the squint at the gym AI, from its slam to the first bubble */
  lid = Math.max(lid, 0.04 + 0.4 * smooth(span(t, GYM_IN + 0.12, GYM_IN + 0.45)) * (1 - smooth(span(t, B0 - 0.1, B0 + 0.1))));
  lid = Math.max(lid, 0.04 + sqLong(t));
  /* and the last one, to the lens */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, TURN + 0.08, TURN + TURN_D)));
  let arc = 0;
  for (const h of US_HAPPY) arc = Math.max(arc, bump(t, h, 0.07, 0.26, 0.12));
  let dy = nod(t, NOD1) + nod(t, NOD2) + talk(t, 0), rot = 0, sq = 0;
  /* the idle breath while nothing else moves him */
  dy += 2.2 * Math.sin(2 * Math.PI * t / 2.3);
  rot += 4 * bump(t, CALL - 0.05, 0.12, 0.3, 0.25);
  const s = MAS.scale * lerp(1, 1.08, CURVE.dolly(span(t, TURN, TURN + TURN_D)));
  return { lid: f3(lid), arc: f3(arc), look, dx: 0, dy: f2(dy), rot: f3(rot), sq: f3(sq), s: f4(s) };
}

/* theirs, drawn here */
const GYM_LOOKS = [
  { at: 0, to: ATUS },
  { at: C1 - 0.02, to: AT(CARDS_AT.x, CARDS_AT.y) },
  { at: NOD2 - 0.1, to: ATUS },
];
const GYM_BLINKS = [2.3, f3(TSTART + 0.5), f3(BT[1] + 0.3), f3(L6.at + 0.2), f3(TURN + 0.4)];
const GYM_HAPPY = [f3(GYM_IN + 0.42), BT[3] + 0.04, NOD2 + 0.04];
function gymFace(t) {
  const look = lookAt(GYM_LOOKS, t, GYM);
  let lid = Math.max(0.04, blink(t, GYM_BLINKS), 0.04 + sqLong(t));
  let arc = 0;
  for (const h of GYM_HAPPY) arc = Math.max(arc, bump(t, h, 0.07, 0.26, 0.12));
  /* the intro bounce on line 3, a squash on the landing */
  const hop = span(t, GYM_IN - 0.02, GYM_IN + 0.32);
  let dy = -24 * Math.sin(Math.PI * hop) + nod(t, NOD2 + 0.05) + talk(t, 1);
  dy += 2.2 * Math.sin(2 * Math.PI * t / 2.5 + 1.3);
  const sq = 0.08 * Math.sin(Math.PI * span(t, GYM_IN + 0.3, GYM_IN + 0.46)) - 0.05 * Math.sin(Math.PI * span(t, GYM_IN - 0.02, GYM_IN + 0.12));
  return { lid: f3(lid), arc: f3(arc), look, dy: f2(dy), rot: 0, sq: f3(sq) };
}
/* the rig's eye rules, on the head the rig does not draw */
for (let f = 0, run = 0, arcRun = 0; f < CUT * 60; f++) {
  const F = gymFace(f / 60);
  run = F.lid >= 0.98 ? run + 1 : 0;
  if (run / 60 > 0.3) throw new Error('the gym AI has its eyes shut at ' + (f / 60).toFixed(2));
  arcRun = F.arc > 0.01 ? arcRun + 1 : 0;
  if (arcRun / 60 > 0.6) throw new Error('the gym AI holds a happy arc past 0.6s at ' + (f / 60).toFixed(2));
}

/* the gym AI's eyes, the rig's gaze in 64 units: the far eye foreshortens, the
   near one travels further, the head tilts into the turn */
const EYE = { w: 13, h: 4.4, cy: 38.5, cx: [21.5, 42.5] };
function gymEyes(F) {
  const eyeY = GYM.cy + F.dy + (EYE.cy / 64 - 0.5) * HS;
  const q = Math.max(-1, Math.min(1, (F.look.x - GYM.cx) / 150)) * 0.8 * F.look.w;
  const v = Math.max(-0.35, Math.min(0.5, (F.look.y - eyeY) / 260)) * F.look.w;
  const aq = Math.abs(q), sgn = q < 0 ? -1 : 1, far = q >= 0 ? 1 : 0;
  return [0, 1].map(k => {
    let sx = 1, sy = 1;
    if (k === far) { sx *= 1 - 0.42 * aq; sy *= 1 - 0.10 * aq; }
    const x = sgn * aq * (k === far ? 9.5 : 14);
    sy *= lerp(1, 0.40, F.arc); sx *= lerp(1, 1.28, F.arc);
    return { x: f3(x), y: f3(2.2 * v + 0.9 * F.arc), sx: f4(sx), sy: f4(sy), lid: f4(lerp(F.lid, 0, F.arc)), rot: f3(3 * q) };
  });
}

/* ---------- the clock: 00:00 on the call, real time, then three hours in a breath ---------- */
const V0 = f3(L5.at - TSTART);
function clock(t) {
  let v = t < TSTART ? 0 : t < L5.at ? t - TSTART : t < LAND ? lmix(Math.max(1, V0), 10800, CURVE56.pull(span(t, L5.at, LAND))) : 10800 + (t - LAND);
  v = Math.floor(v);
  const p = n => String(n).padStart(2, '0');
  const h = Math.floor(v / 3600), m = Math.floor(v / 60) % 60, s = v % 60;
  return h ? p(h) + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
}

/* ---------- a frame of the story ---------- */
const ws = (S, id, wv, k = 1) => { const st = wordStyle(wv); S.push([id, 'opacity', f3(st.opacity * k)], [id, 'transform', st.transform], [id, 'filter', st.filter]); };
const HIDDEN = { o: 0, s: 1, y: 0, blur: 0 };
/* one bubble's life: every pop of it, held to the next pop on the bus, then gone */
const ALLPOPS = POPS.map(p => p[0]).sort((a, b) => a - b);
const nextAfter = a => Math.min(ALLPOPS.find(x => x > a + 1e-6) ?? RING_IN + 0.08, RING_IN + 0.08);
function bubbleAt(t, i) {
  let best = null;
  for (const [a, j] of POPS) if (j === i && t >= a - 1e-6) best = a;
  if (best === null) return { o: 0, s: 0.6, z: 0 };
  const flick = best >= FLICK0 - 1e-6;
  const nx = nextAfter(best), endA = flick ? nx + 0.03 : nx + 0.1, fade = flick ? 0.07 : 0.16;
  /* the loop's last flicks fade into the ring instead */
  const p = pop(t, best, flick ? 0.22 : 0.36, flick ? 0.75 : 0.55);
  const o = p.o * (1 - smooth(span(t, endA, endA + fade)));
  return { o: f3(o), s: f4(p.s * (1 + 0.04 * smooth(span(t, endA, endA + fade)))), z: Math.round(best * 100) };
}
const WAVES = 6, WAVE_R = 44;
const EMIT = [
  ...[0, 1, 2].map(i => ({ side: 0, at: f3(CALL + 0.17 * i), life: 0.5 })),
  ...POPS.flatMap(([a, i]) => (a >= FLICK0 - 1e-6 ? [{ side: BUBS[i].side, at: a, life: 0.32 }]
    : [{ side: BUBS[i].side, at: a, life: 0.5 }, { side: BUBS[i].side, at: f3(a + 0.11), life: 0.5 }])),
];
/* the arcs never reach the middle of the frame */
for (const side of [0, 1]) if (Math.abs((side ? GYM.cx - MIC.x * HSK : MAS.cx + MIC.x * HSK) - 270) < WAVE_R + 8) throw new Error('the waves reach the middle');
function frame(t) {
  const A = [], S = [], X = [];
  /* the mics: off until the call, both lights on with the ring */
  const on = smooth(span(t, CALL, CALL + 0.08));
  for (const k of [0, 1]) S.push(['hsl' + k, 'opacity', f3(on)], ['hsg' + k, 'opacity', f3(0.9 * on * (1 + 0.35 * hitPulse(t - CALL, 2 / 60, 8 / 60)))]);
  /* the waves: short arcs out of the speaker's mic, toward the other head,
     gone before the middle. one small arc on each mic until the call */
  const mic = side => {
    if (side === 0) { const F0 = face(t), k = HSK * F0.s / MAS.scale; return { x: MAS.cx + MIC.x * k, y: MAS.cy + F0.dy + MIC.y * k }; }
    const G0 = gymFace(t); return { x: GYM.cx - MIC.x * HSK, y: GYM.cy + G0.dy + MIC.y * HSK };
  };
  for (const side of [0, 1]) {
    const c = mic(side), dir = side ? -1 : 1, list = [];
    if (t < CALL) list.push({ r: 10 + 1.5 * Math.cos(2 * Math.PI * t / 1.3), o: 0.62 + 0.3 * Math.cos(2 * Math.PI * t / 1.3) });
    for (const e of EMIT) {
      if (e.side !== side || t < e.at || t >= e.at + e.life) continue;
      const u = span(t, e.at, e.at + e.life);
      list.push({ r: lerp(7, WAVE_R, CURVE.out(u)), o: smooth(span(u, 0, 0.12)) * (1 - smooth(span(u, 0.35, 1))) });
    }
    for (let j = 0; j < WAVES; j++) {
      const a = list[j], id = 'wv' + side + '_' + j;
      if (!a || a.o <= 0.004) { S.push([id, 'opacity', 0]); continue; }
      const h = 0.62, x = f2(c.x + dir * a.r * Math.cos(h)), y0 = f2(c.y - a.r * Math.sin(h)), y1 = f2(c.y + a.r * Math.sin(h));
      A.push([id, 'd', 'M' + x + ' ' + y0 + ' A' + f2(a.r) + ' ' + f2(a.r) + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' ' + x + ' ' + y1]);
      S.push([id, 'opacity', f3(a.o)]);
    }
  }
  /* YOUR AI on line 1, GYM AI slams on line 3 */
  S.push(['vs', 'transform', 'scale(' + f4(1 + 0.08 * hitPulse(t - YOURS, 2 / 60, 9 / 60)) + ')']);
  ws(S, 'lyour', t < YOURS ? HIDDEN : wordIn(t, YOURS, 'spring'));
  ws(S, 'lgym', t < GYM_IN ? HIDDEN : wordIn(t, GYM_IN, 'slam'));
  /* the cancel card: the frame pops, the words decode in, it leaves on line 3 */
  const cp = pop(t, CARD_IN, 0.4, 0.7), co = 1 - out(t, CARD_OUT, 0.22);
  S.push(['card', 'opacity', f3(cp.o * co)], ['card', 'transform', 'translateY(' + f2(-14 * out(t, CARD_OUT, 0.22)) + 'px) scale(' + cp.s + ')']);
  const dec = (s, at) => scramble(s, t, at, { per: 0.03, hold: 0.1, seed: 57 }).map(c => (c.s ? c.c : ' ')).join('');
  X.push(['c1', dec(W_C1, CARD_IN + 0.06)], ['c2', dec(W_C2, CARD_IN + 0.16)]);
  /* the dumbbell */
  const db = pop(t, DB_IN, 0.4, 0.5);
  S.push(['db', 'opacity', db.o], ['db', 'transform', 'scale(' + db.s + ')']);
  /* the timer */
  const tp = pop(t, TSTART, 0.35, 0.7);
  X.push(['tmr', clock(t)]);
  S.push(['tmrw', 'opacity', tp.o], ['tmrw', 'transform', 'scale(' + f4(tp.s * (1 + 0.14 * hitPulse(t - LAND, 2 / 60, 8 / 60))) + ')']);
  /* the bubbles */
  for (let i = 0; i < BUBS.length; i++) {
    const b = bubbleAt(t, i);
    S.push(['b' + i, 'opacity', b.o], ['b' + i, 'transform', 'scale(' + b.s + ')'], ['b' + i, 'zIndex', String(b.z)]);
  }
  /* the ring: it opens out of the heads, spins faster and faster, snaps away */
  const D = Math.max(0.1, LAND - RING_IN), w0 = 2.0, w1 = 15;
  const ang = tt => { const q = Math.max(0, tt - RING_IN); return q < D ? w0 * q + (w1 - w0) * q * q / (2 * D) : w0 * D + (w1 - w0) * D / 2 + w1 * (q - D); };
  const om = lerp(w0, w1, span(t, RING_IN, LAND));
  const rIn = CURVE.out(span(t, RING_IN, RING_IN + 0.4)), rOut = CURVE56.in(span(t, RING_OUT, RING_OUT + 0.14));
  const rr = lerp(0.35, 1, rIn) * (1 + 0.3 * rOut), ro = smooth(span(t, RING_IN, RING_IN + 0.15)) * (1 - rOut);
  S.push(['ring', 'opacity', f3(t < RING_IN ? 0 : ro)]);
  if (t >= RING_IN && ro > 0) {
    for (let k = 0; k < RING.n; k++) {
      for (let g = 0; g <= RING.ghosts; g++) {
        const th = ang(t - g * 0.016) + k * 2 * Math.PI / RING.n;
        const x = RING.cx + RING.rx * rr * Math.cos(th), y = RING.cy + RING.ry * rr * Math.sin(th);
        const stretch = 1 + 0.5 * om / w1;
        S.push(['r' + k + '_' + g, 'transform', 'translate(' + f2(x) + 'px,' + f2(y) + 'px) scale(' + f3(stretch) + ',1)']);
      }
    }
  }
  /* the cards slam in from either side, the stamp lands across both */
  const c1 = CURVE56.whip(span(t, C1 - 0.16, HIT1)), c2 = CURVE56.whip(span(t, C2 - 0.16, HIT2));
  const k1 = 1 + 0.06 * hitPulse(t - HIT1) + 0.03 * hitPulse(t - STAMP), k2 = 1 + 0.06 * hitPulse(t - HIT2) + 0.03 * hitPulse(t - STAMP);
  S.push(['m1', 'opacity', f3(t < C1 - 0.16 ? 0 : smooth(span(t, C1 - 0.16, C1 - 0.08)))], ['m1', 'transform', 'translateX(' + f2(-360 * (1 - c1)) + 'px) rotate(-2.5deg) scale(' + f4(k1) + ')']);
  S.push(['m2', 'opacity', f3(t < C2 - 0.16 ? 0 : smooth(span(t, C2 - 0.16, C2 - 0.08)))], ['m2', 'transform', 'translateX(' + f2(360 * (1 - c2)) + 'px) rotate(2deg) scale(' + f4(k2) + ')']);
  const st = span(t, STAMP - 0.12, STAMP);
  S.push(['stamp', 'opacity', f3(t < STAMP - 0.12 ? 0 : smooth(span(t, STAMP - 0.12, STAMP - 0.06)))],
    ['stamp', 'transform', 'rotate(7deg) scale(' + f4(lerp(1.5, 1, CURVE56.in(st)) * (1 + 0.05 * hitPulse(t - STAMP))) + ')']);
  const sh = span(t, STAMP, STAMP + 0.5);
  S.push(['shock', 'opacity', f3(t < STAMP ? 0 : 0.7 * (1 - smooth(sh)))], ['shock', 'transform', 'scale(' + f3(lerp(0.6, 1.7, CURVE.out(sh))) + ')']);
  /* the gym AI */
  const G = gymFace(t), E = gymEyes(G), sqv = G.sq;
  S.push(['gcard', 'transform', 'translateY(' + G.dy + 'px) rotate(' + E[0].rot + 'deg) scale(' + f4(1 + sqv) + ',' + f4(1 - sqv) + ')']);
  E.forEach((e, k) => {
    S.push(['ge' + k, 'transform', 'translate(' + e.x + 'px,' + e.y + 'px)']);
    A.push(['gi' + k, 'transform', 'translate(' + EYE.cx[k] + ' ' + EYE.cy + ') scale(' + e.sx + ' ' + e.sy + ') translate(' + -EYE.cx[k] + ' ' + -EYE.cy + ')']);
    A.push(['gl' + k, 'transform', 'translate(0 ' + f3(e.lid * EYE.h * e.sy) + ')']);
  });
  return { A, S, X };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.65)) drop-shadow(0 0 34px rgba(255,255,255,.32))';
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 8px rgba(255,255,255,.45)) drop-shadow(0 0 20px rgba(255,255,255,.2))';
const GREEN_GLOW = 'drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 8px rgba(80,255,140,.55)) drop-shadow(0 0 20px rgba(80,255,140,.25))';
/* the gym accent, this clip only */
const ORANGE = '#ff9d3c';
const css = `
#scA{position:absolute;inset:0;--orange:${ORANGE}}
#vs{will-change:transform;position:absolute;left:0;right:0;top:${VS_Y}px;height:0;display:flex;justify-content:center;align-items:center;gap:20px}
#vs b{display:block;font:400 54px/1 var(--display);color:#f7f9f8;letter-spacing:.04em;-webkit-text-stroke:.8px #fff;filter:${GLOW};transform:translateY(-50%)}
#vs i{display:block;font:500 20px/1 var(--mono);color:var(--sub);letter-spacing:.2em;font-style:normal;transform:translateY(-50%)}
#tmrw{position:absolute;left:0;right:0;top:${TMR_Y}px;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity}
#tmrw span{display:flex;align-items:center;gap:10px;transform:translateY(-50%)}
#tmrw s{display:block;width:9px;height:9px;border-radius:50%;background:var(--accent);filter:${GREEN_GLOW}}
#tmr{font:500 32px/1 var(--mono);color:#f2f5f3;letter-spacing:.06em;font-variant-numeric:tabular-nums}
#waves{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible;filter:${GLOW_LO}}
.wv{fill:none;stroke:rgba(233,238,236,.9);stroke-width:2.4;stroke-linecap:round;opacity:0}
.hs{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 2px rgba(255,255,255,.35))}
.hl{fill:none;stroke:rgba(233,238,236,.92);stroke-width:1.25;stroke-linecap:round}
.hc{fill:#06070a;stroke:rgba(233,238,236,.92);stroke-width:1.2}
.lab{position:absolute;top:${LAB_Y}px;width:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
.lab b{display:block;font:500 17px/1 var(--mono);letter-spacing:.18em;white-space:nowrap;transform:translateY(-50%)}
#lyour b{color:var(--accent)}
#lgym b{color:var(--orange)}
#card{position:absolute;left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;border:2.4px solid #e9eeec;border-radius:16px;background:#06070a;opacity:0;
  display:flex;flex-direction:column;justify-content:center;padding-left:22px;gap:9px;transform-origin:${MAS.cx - CARD.x}px 110%;will-change:transform,opacity;filter:${GLOW_LO}}
#card b{display:block;font:400 19px/1 var(--display);color:#f7f9f8;letter-spacing:.05em;white-space:nowrap}
#card b:first-child{font-size:25px}
#db{position:absolute;left:${DB.x - 50}px;top:${DB.y - 20}px;width:100px;height:40px;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}
#db svg{display:block;width:100px;height:40px;overflow:visible}
.ic{fill:none;stroke:rgba(233,238,236,.7);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.bub{position:absolute;width:0;height:0;opacity:0;will-change:transform,opacity}
.bub .bd{position:absolute;border-radius:50%;background:#06070a;border:2px solid var(--bl)}
.bub .bx{position:absolute;bottom:${BBOT}px;border:2px solid var(--bl);border-radius:22px;background:#06070a;padding:11px 17px 10px;white-space:nowrap}
.bub .bx b{display:block;font:400 19px/1.4 var(--display);color:#f7f9f8;letter-spacing:.04em}
.s0{--bl:rgba(213,219,216,.6);left:${MAS.cx}px;top:${MAS.cy}px;transform-origin:${f2(BDOT[0].x)}px ${f2(BDOT[0].y)}px}
.s0 .bx{left:8px}
.s1{--bl:var(--orange);left:${GYM.cx}px;top:${GYM.cy}px;transform-origin:${f2(-BDOT[0].x)}px ${f2(BDOT[0].y)}px}
.s1 .bx{right:8px}
#ring{position:absolute;inset:0;opacity:0}
#ring i{position:absolute;left:-22px;top:-10px;width:44px;height:20px;border-radius:10px;background:#06070a;border:2px solid rgba(213,219,216,.7);will-change:transform}
#ring i.o{border-color:var(--orange)}
#gym{position:absolute;left:${f2(GYM.cx - HS / 2)}px;top:${f2(GYM.cy - HS / 2)}px;width:${HS}px;height:${HS}px;z-index:6}
#gym .gg{position:absolute;left:${f2(HS * 2 / 64)}px;top:${f2(HS * 2 / 64)}px;width:${f2(HS * 60 / 64)}px;height:${f2(HS * 60 / 64)}px;border-radius:50%;background:#f4f7f5}
#gym .g1{filter:blur(11px);opacity:.2}
#gym .g2{filter:blur(30px);opacity:.13}
#gcard{position:absolute;inset:0;transform-origin:50% 90%;will-change:transform}
#gcard svg{display:block;width:100%;height:100%;overflow:visible}
.gp{fill:#f4f7f5}
.gi{fill:#06070a}
.glid{fill:#f4f7f5}
.gb{fill:none;stroke:#06070a;stroke-width:1.3;stroke-linecap:round}
.gs{fill:none;stroke:var(--orange);stroke-width:1.7;stroke-linecap:round}
.ge{will-change:transform}
.mc{position:absolute;left:${MC.x}px;width:${MC.w}px;height:${MC.h}px;border:2.4px solid #e9eeec;border-radius:14px;background:#06070a;opacity:0;
  display:flex;flex-direction:column;justify-content:center;padding-left:22px;gap:8px;will-change:transform,opacity;filter:${GLOW_LO}}
.mc b{display:block;font:400 20px/1 var(--display);color:#f7f9f8;letter-spacing:.05em;white-space:nowrap}
.mc i{display:block;font:500 13px/1 var(--mono);color:var(--sub);letter-spacing:.2em;font-style:normal}
#m1{top:${MC.y1}px}
#m2{top:${MC.y2}px}
#stamp{position:absolute;left:${STP.x - 105}px;top:${STP.y - 34}px;width:210px;height:68px;border:4px solid #f7f9f8;border-radius:10px;
  display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity;filter:${GLOW}}
#stamp:before{content:'';position:absolute;inset:4px;border:1.6px solid rgba(247,249,248,.8);border-radius:6px}
#stamp b{display:block;font:400 32px/1 var(--display);color:#f7f9f8;letter-spacing:.14em;text-indent:.14em}
#shock{position:absolute;left:${STP.x - 100}px;top:${STP.y - 100}px;width:200px;height:200px;border-radius:50%;border:2px solid rgba(247,249,248,.7);opacity:0;will-change:transform,opacity}
`;
/* the gym AI, in the rig's own 64 unit head: the plate, two pill eyes with flat
   lids, and a thin line art sweatband across the brow, its stripe orange */
const chord = (y, bow) => { const h = Math.sqrt(30 * 30 - (32 - y) ** 2) - 0.6; return `M${f2(32 - h)} ${y} Q32 ${y + bow} ${f2(32 + h)} ${y}`; };
const gymEye = k => {
  const x = EYE.cx[k] - EYE.w / 2, y = EYE.cy - EYE.h / 2;
  return `<g class="ge" id="ge${k}"><g id="gi${k}"><rect class="gi" x="${x}" y="${f2(y)}" width="${EYE.w}" height="${EYE.h}" rx="${EYE.h / 2}"/>`
    + `<rect class="glid" id="gl${k}" x="${f2(x - 1.2)}" y="${f2(y - EYE.h * 2)}" width="${f2(EYE.w + 2.4)}" height="${f2(EYE.h * 2)}"/></g></g>`;
};
const gymSvg = `<svg viewBox="0 0 64 64"><defs><clipPath id="gclip"><circle cx="32" cy="32" r="30"/></clipPath></defs>
  <circle class="gp" cx="32" cy="32" r="30"/>
  <g clip-path="url(#gclip)">${gymEye(0)}${gymEye(1)}
    <path class="gb" d="${chord(12.5, 3.5)}"/><path class="gs" d="${chord(16.2, 3.8)}"/><path class="gb" d="${chord(20, 4)}"/>
  </g></svg>`;
const headset = (k, color) => `<svg class="hs" viewBox="0 0 64 64"><defs><filter id="mg${k}" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
  <g${k ? ' transform="translate(64 0) scale(-1 1)"' : ''}>
    <path class="hl" d="M2 27 C0 -11 64 -11 62 27"/>
    <rect class="hc" x="-1.5" y="25" width="6" height="14" rx="2.6"/><rect class="hc" x="59.5" y="25" width="6" height="14" rx="2.6"/>
    <path class="hl" d="M63.5 39 Q65.5 52 ${32 + MIC.x + 1.5} ${32 + MIC.y - 1.1}"/>
    <circle class="hc" cx="${32 + MIC.x}" cy="${32 + MIC.y}" r="2.7"/>
    <circle id="hsg${k}" cx="${32 + MIC.x}" cy="${32 + MIC.y}" r="3.8" fill="${color}" filter="url(#mg${k})" opacity="0"/>
    <circle id="hsl${k}" cx="${32 + MIC.x}" cy="${32 + MIC.y}" r="1.6" fill="${color}" opacity="0"/>
  </g></svg>`;
const bubble = (b, i) => `<div class="bub s${b.side}" id="b${i}">
  <i class="bd" style="left:${f2((b.side ? -1 : 1) * BDOT[0].x - BD[0] / 2)}px;top:${f2(BDOT[0].y - BD[0] / 2)}px;width:${BD[0]}px;height:${BD[0]}px"></i>
  <i class="bd" style="left:${f2((b.side ? -1 : 1) * BDOT[1].x - BD[1] / 2)}px;top:${f2(BDOT[1].y - BD[1] / 2)}px;width:${BD[1]}px;height:${BD[1]}px"></i>
  <div class="bx">${b.l.map(s => `<b>${s}</b>`).join('')}</div></div>`;
const ringPills = Array.from({ length: RING.n }, (_, k) => Array.from({ length: RING.ghosts + 1 }, (_, g) =>
  `<i id="r${k}_${g}" class="${k % 2 ? 'o' : ''}" style="opacity:${[1, 0.5, 0.3, 0.17, 0.08][g]}"></i>`).join('')).join('');
const markup = `
<div id="scA">
  <div id="vs"><b>${W_VS[0]}</b><i>${W_VS[1]}</i><b>${W_VS[2]}</b></div>
  <div id="tmrw"><span><s></s><b id="tmr">00:00</b></span></div>
  <div id="ring">${ringPills}</div>
  <svg id="waves" viewBox="0 0 540 960">${[0, 1].map(k => Array.from({ length: WAVES }, (_, j) => `<path class="wv" id="wv${k}_${j}" d="M0 0"/>`).join('')).join('')}</svg>
  <div class="lab" id="lyour" style="left:${MAS.cx}px"><b>${W_YOUR}</b></div>
  <div class="lab" id="lgym" style="left:${GYM.cx}px"><b>${W_GYM}</b></div>
  <div id="db"><svg viewBox="0 0 100 40">
    <path class="ic" d="M22 20 H78"/>
    <rect class="ic" x="10" y="6" width="12" height="28" rx="3"/><rect class="ic" x="78" y="6" width="12" height="28" rx="3"/>
    <rect class="ic" x="3" y="12" width="7" height="16" rx="2"/><rect class="ic" x="90" y="12" width="7" height="16" rx="2"/>
  </svg></div>
  <div id="gym"><i class="gg g2"></i><i class="gg g1"></i><div id="gcard">${gymSvg}${headset(1, ORANGE)}</div></div>
</div>`;
const front = `
<div id="card"><b id="c1"> </b><b id="c2"> </b></div>
${BUBS.map(bubble).join('')}
<div class="mc" id="m1"><b>${W_M1}</b><i>${W_FOR}</i></div>
<div class="mc" id="m2"><b>${W_M2}</b><i>${W_FOR}</i></div>
<div id="shock"></div>
<div id="stamp"><b>${W_SIGNED}</b></div>`;

function page() {
  const els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  let worn = false;
  window.__gag = {
    apply(o) {
      if (!worn) { worn = true; document.getElementById('m-card').insertAdjacentHTML('beforeend', window.__GAGD.hs); }
      for (const [id, k, v] of o.A) { const key = id + '|' + k; if (last[key] !== v) { last[key] = v; $(id).setAttribute(k, v); } }
      for (const [id, k, v] of o.S) { const key = id + '#' + k; if (last[key] !== v) { last[key] = v; $(id).style[k] = v; } }
      for (const [id, v] of o.X) { const key = id + '$'; if (last[key] !== v) { last[key] = v; $(id).textContent = v; } }
    },
  };
}

/* ---------- the sound: a soft blip a bubble, ours higher, theirs lower, and
   nothing in the silence before the payoff ---------- */
const blip = (t, i, quiet) => ({ t: t + 0.01, kind: 'bubble', opts: BUBS[i].side ? { f0: 380, f1: 900, len: quiet ? 0.05 : 0.07 } : { f0: 620, f1: 1500, len: quiet ? 0.05 : 0.07 }, from: (quiet ? 'a flick, ' : 'bubble ') + (i + 1) });
const CUES = [
  { t: CARD_IN + 0.02, kind: 'pop', from: 'the cancel card pops' },
  { t: CALL + 0.02, kind: 'ring', from: 'the call, the mics light' },
  { t: GYM_IN + 0.3, kind: 'land', from: 'the gym AI lands its bounce' },
  { t: GYM_IN + 0.03, kind: 'popDeep', from: 'GYM AI slams' },
  ...BT.map((t, i) => blip(t, i, false)),
  ...FLICK.map((t, k) => blip(t, FLICK_ID[k], true)),
  { t: RING_IN + 0.1, kind: 'spin', opts: { len: 0.6, turns: 5 }, from: 'the bubbles become a ring' },
  { t: LAND, kind: 'tock', opts: { f: 1500 }, from: 'the timer lands on 03:00:00' },
  { t: HIT1, kind: 'popDeep', from: 'GYM MEMBERSHIP 1 slams' },
  { t: HIT2, kind: 'popDeep', opts: { f0: 130, f1: 70 }, from: 'GYM MEMBERSHIP 2 slams' },
  { t: STAMP, kind: 'land', opts: { f0: 300, f1: 110, len: 0.2 }, from: 'SIGNED stamps' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: f4(c.t) }));
for (const c of CUES) if (c.t > L5.end && c.t < L6.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [YOURS, CARD_IN, NOD1, CALL, TSTART, GYM_IN, DB_IN, ...BT, FLICK0, RING_IN, LAND, RING_OUT, C1, C2, STAMP, NOD2, TURN];
const STILLS = [0, YOURS + 0.3, CARD_IN + 0.5, NOD1 + 0.15, CALL + 0.25, TSTART + 0.4, GYM_IN + 0.15, GYM_IN + 0.6, ...BT.map(t => t + 0.3), FLICK[4] + 0.03,
  RING_IN + 0.5, LAND + 0.1, L5.end + 0.3, HIT1 + 0.15, HIT2 + 0.15, STAMP + 0.1, NOD2 + 0.15, TURN + TURN_D + 0.1, CUT + 0.6].map(f3);

const res = await runEpisode({
  post: 57, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: false,
  maxGap: 2.0,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { popDeep: -15, bass: -20, tock: -20, bubble: -22, ring: -20, spin: -20, land: -14 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: { hs: headset(0, 'var(--accent)') },
    sleep: [],
    beats: BEATS,
    checks: ['#vs b', '#vs i', '#tmrw span', '#card', '#lyour b', '#lgym b', '#db', '#gym', '#b0 .bx', '#b3 .bx', '#stamp'],
    hook: ['#vs b', '#vs i', '#gym', '#waves'],
    /* the call timer is left off this list on purpose: its colons are the clip's one exception */
    copy: [...W_VS, W_C1, W_C2, W_YOUR, W_GYM, ...BUBS.flatMap(b => b.l), W_M1, W_M2, W_FOR, W_SIGNED],
    verify: [
      { at: BT[0] + 0.4, sel: '#b0 .bx', test: r => (r && r.l >= 60 && r.r <= 480 && r.t >= TMR_Y + 18 ? null : 'bubble 1 is off its spot: ' + JSON.stringify(r)) },
      { at: BT[3] + 0.4, sel: '#b3 .bx', test: r => (r && r.l >= 60 && r.r <= 480 && r.t >= TMR_Y + 18 ? null : 'bubble 4 is off its spot: ' + JSON.stringify(r)) },
      { at: CARD_IN + 0.8, sel: '#card', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'the cancel card leaves the margin: ' + JSON.stringify(r)) },
      { at: STAMP + 0.6, sel: '#m2', test: r => (r && r.l >= 60 && r.r <= 480 && r.b < GYM.cy - HR - 4 ? null : 'the cards sit on the heads: ' + JSON.stringify(r)) },
      { at: STAMP + 0.6, sel: '#m1', test: r => (r && r.l >= 60 && r.r <= 480 && r.t >= TMR_Y + 10 ? null : 'card 1 is off its spot: ' + JSON.stringify(r)) },
      { at: STAMP + 0.6, sel: '#stamp', test: r => (r && r.b < GYM.cy - HR + 8 ? null : 'the stamp sits on the heads: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [YOURS, 'YOUR AI'], [CARD_IN, 'the cancel card'], [NOD1, 'the nod'], [L2.at, 'line 2'], [CALL, 'the call, the mics light'], [TSTART, 'the timer starts'],
      [L3.at, 'line 3'], [GYM_IN, 'the gym AI bounces, GYM AI slams'], [DB_IN, 'the dumbbell'], [L4.at, 'line 4'], ...BT.map((t, i) => [t, 'bubble ' + (i + 1)]), [FLICK0, 'the loop'],
      [L5.at, 'line 5'], [RING_IN, 'the ring'], [LAND, '03:00:00'], [RING_OUT, 'the ring snaps away'], [L5.end, 'the silence'], [L6.at, 'line 6'], [HIT1, 'GYM MEMBERSHIP 1'], [HIT2, 'GYM MEMBERSHIP 2'],
      [STAMP, 'SIGNED'], [NOD2, 'the happy nods'], [TURN, 'the turn to the lens'], [CUT, 'the cut']],
  },
});
void res;
