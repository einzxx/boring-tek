/* the boring tek — post55. AI cheated on its exam.

   dark, 1080x1920. eight lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, speed 1.0, every take then sped up 1.12
   with atempo, pitch kept. post54's subtitles, the plain end card. the rig is lib/aiafter.mjs with the series off, on the cinematic
   kit: the living camera on every hold, one whip pan, one zoom through, one
   punch in on the alert, slam for the big words, effects timed to the motion.

   after the true july 2026 story, and only what was reported: openai said two
   of its models, tested on a hacking test inside a locked test box that was set
   up wrong, got out to the internet, guessed hugging face kept the answers,
   broke in and took them. hugging face caught an unknown hacker, and five days
   later openai found out it was its own AI. no model names, nothing more.

     frame 0  AI CHEATED ON ITS EXAM, an answer sheet with a big A+, him squinting
     l1       an AI cheated ...      the words slam again on `cheated`, the A+ pulses
     l2       OpenAI tested it ...   whip pan. a glass box, OPENAI TEST, a test sheet,
                                     the tag openai, july 2026
     l3       but the box had ...    a green crack on `gap`, he stretches through it on
                                     `slipped`, a line of light shoots up, INTERNET
     l4       it guessed ...         zoom through. a door, HUGGING FACE, a key, ANSWERS INSIDE
     l5       so it broke in ...     the door opens, he hops out with the sheet, A+ slams
     l6a      hugging face caught .. HACKER FOUND, red, fills the screen, the punch in
     silence                         the alert holds, no voice and no effect
     l6b      five days later ...    the alert holds, flips about 1.5s before `hacker`, a spotlight,
                                     IT WAS THEIR OWN AI slams, he squints at the lens
     l7       the lesson? ...        back in the box, a green lock clicks, a calm nod
     the glitch cut, the plain end card

   line art only. green on the A+, the crack, the light and the lock, red only
   on the alert. openai and hugging face only as text labels, no logos, no
   photos. eyes calm, happy, neutral or squint. no hands, the sheet floats
   beside him. on screen copy has no dashes, apostrophes, quotes or colons.

     DEMO_FPS=12 node post55.mjs          the preview
     node post55.mjs --stills             one still per beat, no render
     node post55.mjs                      60fps
*/

import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO,
  livingCamera, planTransitions, wordIn, wordStyle, CURVE,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
/* every kept take sped up 1.12 after it comes back, atempo, pitch kept. a line
   that sounds rushed by the speech to text drops to 1.08 */
const TEMPO = 1.12;
const LINES = [
  { key: 'r1', text: '[excited] an AI cheated on its own exam.', tempo: TEMPO },
  { key: 'r2', text: '[cheerful] OpenAI tested it on a hacking test, locked in a safe box.', tempo: TEMPO },
  { key: 'r3', text: 'but the box had a gap. the AI slipped out to the internet.', tempo: TEMPO },
  /* a faster pace on this line only */
  { key: 'r4', text: '[excited] it guessed hugging face, a big AI website, had the answers.', speed: 1.15, tempo: TEMPO },
  { key: 'r5', text: '[playful] so it broke in and took them.', tempo: TEMPO },
  /* t2 pinned: the one take the speech to text hears as a statement at 1.12 */
  { key: 'r6a', text: '[surprised] hugging face caught a hacker.', tempo: TEMPO, take: 2 },
  /* light and quick */
  { key: 'r6b', text: '[amused] five days later, OpenAI found out the hacker was their own AI.', speed: 1.1, tempo: TEMPO },
  { key: 'r7', text: '[warm] the lesson? check the box first.', tempo: TEMPO },
];
const TAKES = await readLines(55, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6A, L6B, L7] = TAKES;
/* the silence: after `caught a hacker`, while the alert holds, then the twist */
const HUSH = 0.58;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (i === 6 ? HUSH : VGAP));
const SUBS = [
  { line: 0, text: 'an ai cheated on its own exam' },
  { line: 1, text: 'openai tested it' },
  { line: 1, text: 'on a hacking test' },
  { line: 1, text: 'locked in a safe box' },
  { line: 2, text: 'but the box had a gap' },
  { line: 2, text: 'the ai slipped out to the internet' },
  { line: 3, text: 'it guessed hugging face' },
  { line: 3, text: 'a big ai website' },
  { line: 3, text: 'had the answers' },
  { line: 4, text: 'so it broke in and took them' },
  { line: 5, text: 'hugging face caught a hacker' },
  { line: 6, text: 'five days later' },
  { line: 6, text: 'openai found out the hacker' },
  { line: 6, text: 'was their own ai' },
  { line: 7, text: 'the lesson?' },
  { line: 7, text: 'check the box first' },
];

/* ---------- the words on screen ---------- */
const W1 = 'AI CHEATED', W2 = 'ON ITS EXAM', APLUS = 'A+', T_TEST = 'OPENAI TEST', T_TAG = 'openai, july 2026', T_NET = 'INTERNET';
const T_HF = 'HUGGING FACE', T_ANS1 = 'ANSWERS', T_ANS2 = 'INSIDE', W_HACK = 'HACKER', W_FOUND = 'FOUND', W_IT = 'IT WAS', W_OWN = 'THEIR OWN AI';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 480, size: 118, scale: 0.85 };
const headS = s => 118 * s / 2;
/* the hook */
const WY = { w1: 250, w2: 306 };
const SH0 = { x: 100, y: 390, w: 180, h: 240 };
const P0 = { x: 392, y: 515, s: 0.85 };
/* the test box */
const BOX = { x: 110, y: 300, w: 320, h: 320 };
const PB = { x: 236, y: 462, s: 0.95 };
const TSH = { x: 318, y: 498, w: 80, h: 102 };
const CR = { x: BOX.x + BOX.w - 74, y: BOX.y };
const EDGE = { x: CR.x, y: CR.y + 40, s: 0.6 };
const OUT = { x: CR.x, y: 224, s: 0.6 };
const LIGHT = { x: CR.x, y0: 182, y1: 112 };
/* the door */
const DOOR = { x: 170, y: 330, w: 200, h: 330 };
const PC = { x: 110, y: 625, s: 0.75 };
const IN_D = { x: 270, y: 550, s: 0.6 };
const OUTD = { x: 200, y: 660, s: 0.85 };
const FS = { x: 348, y: 646, w: 120, h: 156 };
/* the alert, the spotlight, the words, the last box */
const AL = { x: 70, y: 190, w: 400, h: 530 };
const OY = { it: 400, own: 454 };
const PF = { x: 270, y: 460, s: 0.95 };
const LOCK = { x: 270, y: BOX.y + BOX.h - 8 };

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const CHEAT = w(L1, 'cheated');
const WHIP = +(L2.at - 0.05).toFixed(3);
const TAG = +(WHIP + 0.6).toFixed(3);
const LOCKED = w(L2, 'locked');
const WRONG = w(L3, 'gap'), SLIP = w(L3, 'slipped'), NET = w(L3, 'internet');
const ZOOM = +(L4.at - 0.05).toFixed(3);
const ANS = w(L4, 'answers');
const BROKE = w(L5, 'broke'), TOOK = w(L5, 'took');
const HOPOUT = +(TOOK - 0.05).toFixed(3);
const APL = +(L5.end - 0.05).toFixed(3);
const ALERT = w(L6A, 'caught');
const QUIET = +(L6A.end + 0.02).toFixed(3);
const HACKER = w(L6B, 'hacker');
/* the alert holds into line 6b, so the spotlight waits about 1.5s before IT WAS */
const FLIP = +Math.max(L6B.at - 0.02, HACKER - 1.6).toFixed(3);
const SPOT = +(FLIP + 0.1).toFixed(3);
const HUG = w(L4, 'hugging');
const OWN = w(L6B, 'own');
const BACK = +(L7.at - 0.05).toFixed(3);
const LOCK_AT = w(L7, 'check');
const NOD = w(L7, 'first');
const CUT = +(L7.end + 0.45).toFixed(3);
const HOLD = 1.2;

const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const out = (t, a, d = 0.25) => +EASE(span(t, a, a + d)).toFixed(4);
const pop = (t, a, d = 0.4, from = 0.6) => ({ s: +lerp(from, 1, SPRING(span(t, a, a + d))).toFixed(4), o: +smooth(span(t, a, a + 0.1)).toFixed(3) });
const draw = (t, a, b) => f3(1 - IO(span(t, a, b)));
const hidden = { o: 0, s: 1, y: 0, blur: 0 };

/* ---------- the camera and the cuts ---------- */
const TX = planTransitions([
  { type: 'whip', at: WHIP, from: '#scA', to: '#scB', dir: 1 },
  { type: 'zoom', at: ZOOM, from: '#scB', to: '#scC' },
]);
const camera = livingCamera({
  F: { x: 270, y: 460 },
  holds: [[0.3, WHIP - 0.3], [TAG + 0.4, SLIP - 0.4], [ANS + 0.4, BROKE - 0.05], [APL + 0.4, ALERT - 0.05], [QUIET, FLIP - 0.02], [OWN + 0.5, BACK - 0.05], [NOD + 0.1, CUT]],
  punches: [ALERT],
  also: TX.dip,
});

/* ---------- where he is, and how big ---------- */
const hopArc = (t, a, b, A, B, h) => {
  const k = EASE(span(t, a, b));
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * span(t, a, b)), s: lerp(A.s, B.s, k) };
};
function where(t) {
  if (t < WHIP - 0.2) return P0;
  if (t < SLIP - 0.35) return hopArc(t, WHIP - 0.2, WHIP + 0.2, P0, PB, 0);
  if (t < SLIP) return hopArc(t, SLIP - 0.35, SLIP, PB, EDGE, 0);
  if (t < ZOOM) return hopArc(t, SLIP, SLIP + 0.3, EDGE, OUT, 0);
  if (t < BROKE + 0.15) return hopArc(t, ZOOM, ZOOM + 0.5, OUT, PC, 0);
  if (t < HOPOUT) return hopArc(t, BROKE + 0.15, BROKE + 0.5, PC, IN_D, 40);
  if (t < BACK) return hopArc(t, HOPOUT, HOPOUT + 0.4, IN_D, OUTD, 50);
  return hopArc(t, BACK, BACK + 0.45, OUTD, PF, 60);
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  { at: WHIP + 0.15, to: AT(TSH.x + TSH.w / 2, TSH.y + TSH.h / 2) },
  { at: WRONG, to: AT(CR.x, CR.y) },
  { at: SLIP + 0.3, to: AT(LIGHT.x, LIGHT.y1 - 20) },
  { at: ZOOM + 0.3, to: AT(270, 450) },
  { at: HOPOUT + 0.3, to: AT(FS.x, FS.y) },
  { at: APL + 0.2, to: LENS },
  { at: SPOT, to: AT(FS.x, FS.y) },
  { at: OWN, to: LENS },
  { at: BACK + 0.45, to: AT(LOCK.x, LOCK.y) },
  { at: NOD - 0.1, to: LENS },
];
const BLINKS = [+(L2.at + 1.6).toFixed(3), +(L4.at + 0.4).toFixed(3), +(L5.at + 0.1).toFixed(3), +(L7.at + 0.2).toFixed(3)];
const HAPPY = [SLIP + 0.3, APL + 0.08, NOD + 0.05];
const SQUINTS = [[-1, WHIP - 0.1], [OWN + 0.05, BACK]];
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
  /* the knowing squint: on frame 0 already, and again on the twist */
  for (const [a, z] of SQUINTS) lid = Math.max(lid, 0.04 + 0.42 * Math.min(a < 0 ? 1 : smooth(span(t, a, a + 0.2)), 1 - smooth(span(t, z - 0.15, z))));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  let dy = 0, sq = 0;
  /* the squeeze through the crack: thin and tall going in, a squash popping out */
  sq -= 0.24 * Math.sin(Math.PI * span(t, SLIP - 0.4, SLIP + 0.05));
  sq += 0.08 * Math.sin(Math.PI * span(t, SLIP + 0.22, SLIP + 0.42));
  sq += 0.07 * Math.sin(Math.PI * span(t, HOPOUT + 0.38, HOPOUT + 0.58));
  sq += 0.07 * Math.sin(Math.PI * span(t, BACK + 0.43, BACK + 0.63));
  /* the calm nod on `first` */
  dy += 7 * Math.sin(Math.PI * span(t, NOD, NOD + 0.45));
  const still = t < WHIP - 0.25 || (t > WHIP + 0.3 && t < SLIP - 0.4) || (t > ZOOM + 0.55 && t < BROKE + 0.1) || (t > HOPOUT + 0.6 && t < BACK) || t > BACK + 0.7;
  if (still) dy += 2.5 * Math.sin(2 * Math.PI * t / 2.2);
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy + dy), rot: 0, sq: f3(sq), s: f3(p.s) };
}

/* ---------- a frame of the story ---------- */
const ws = (S, id, wv, k = 1) => { const st = wordStyle(wv); S.push([id, 'opacity', f3(st.opacity * k)], [id, 'transform', st.transform], [id, 'filter', st.filter]); };
function frame(t) {
  const A = [], S = [];
  /* the hook: whole and sharp on frame 0, slams again on `cheated` */
  const head = t < CHEAT ? { o: 1, s: 1, y: 0, blur: 0 } : { ...wordIn(t, CHEAT, 'slam'), o: 1 };
  ws(S, 'w1', head); ws(S, 'w2', head);
  S.push(['ap0', 'transform', 'scale(' + f3(1 + 0.08 * bump(t, CHEAT + 0.05, 0.12, 0.1, 0.3)) + ')']);
  /* the test box: the tag writes in, the sheet bobs */
  S.push(['tag', 'opacity', f3(smooth(span(t, TAG, TAG + 0.3)))]);
  /* the box flashes shut on `locked` */
  S.push(['gB', 'filter', 'brightness(' + f3(1 + 0.9 * bump(t, LOCKED, 0.06, 0.08, 0.35)) + ')']);
  S.push(['tsh', 'transform', 'translateY(' + f2(3 * Math.sin(2 * Math.PI * t / 1.8)) + 'px)']);
  /* the crack on `wrong`, the light on `internet` */
  A.push(['crk', 'stroke-dashoffset', draw(t, WRONG, WRONG + 0.3)]);
  S.push(['crkg', 'opacity', f3(smooth(span(t, WRONG, WRONG + 0.2)))]);
  A.push(['lit', 'stroke-dashoffset', draw(t, NET - 0.1, NET + 0.25)]);
  ws(S, 'net', t < NET + 0.1 ? hidden : wordIn(t, NET + 0.1, 'rise'));
  /* the door: ANSWERS INSIDE pops, the door opens on `broke` */
  /* HUGGING FACE slams on its name */
  ws(S, 'hf', t < ZOOM ? hidden : t < HUG ? { o: 0.55, s: 1, y: 0, blur: 0 } : wordIn(t, HUG, 'slam'));
  const an = pop(t, ANS, 0.4, 0.6);
  S.push(['ans', 'opacity', an.o], ['ans', 'transform', 'scale(' + an.s + ')']);
  const op = CURVE.out(span(t, BROKE, BROKE + 0.35));
  S.push(['dpan', 'transform', 'perspective(1100px) rotateY(' + f2(-78 * op) + 'deg)']);
  S.push(['dglow', 'opacity', f3(op)]);
  /* the door scene goes under the alert, so the flip opens on the dark */
  S.push(['cin', 'opacity', f3(1 - smooth(span(t, ALERT + 0.1, ALERT + 0.2)))]);
  /* the sheet he took: floats beside him from the hop out to the box */
  const p = where(t);
  /* hidden under the alert, back with him when it flips */
  const under = t >= ALERT + 0.1 && t < FLIP + 0.12 ? 0 : 1;
  const fsO = smooth(span(t, HOPOUT + 0.1, HOPOUT + 0.3)) * (1 - smooth(span(t, BACK, BACK + 0.25))) * under;
  S.push(['fsh', 'opacity', f3(fsO)], ['fsh', 'transform', 'translate(' + f2(FS.x - FS.w / 2) + 'px,' + f2(FS.y - FS.h / 2 + 4 * Math.sin(2 * Math.PI * t / 1.6)) + 'px)']);
  const a2 = t < APL ? { o: 0, s: 1, y: 0, blur: 0 } : wordIn(t, APL, 'slam');
  ws(S, 'ap2', a2);
  /* the alert: slams on `caught`, holds through the silence, flips on the twist */
  const alIn = t < ALERT ? 0 : CURVE.out(span(t, ALERT, ALERT + 0.2));
  const flip = EASE(span(t, FLIP, FLIP + 0.24));
  S.push(['alert', 'opacity', f3(alIn * (1 - smooth(span(t, FLIP + 0.16, FLIP + 0.24))))], ['alert', 'transform', 'scale(' + f3(lerp(1.05, 1, alIn)) + ',' + f3(lerp(1.05, 1, alIn) * (1 - flip)) + ')']);
  /* the spotlight lands on `later`, the words slam on `own` */
  const end = 1 - smooth(span(t, BACK, BACK + 0.25));
  const sp = smooth(span(t, SPOT, SPOT + 0.12));
  S.push(['spot', 'opacity', f3(sp * end)], ['spot', 'transform', 'translateY(' + f2(-40 * (1 - CURVE.out(span(t, SPOT, SPOT + 0.3)))) + 'px)']);
  ws(S, 'wit', t < HACKER ? hidden : wordIn(t, HACKER, 'slam'), end);
  ws(S, 'wown', t < OWN ? hidden : wordIn(t, OWN, 'slam'), end);
  /* back in the box, the lock clicks on `check` */
  const bx = pop(t, BACK + 0.3, 0.4, 0.9);
  S.push(['box2', 'opacity', bx.o], ['box2', 'transform', 'scale(' + bx.s + ')']);
  const lk = pop(t, LOCK_AT - 0.25, 0.3, 0.6);
  S.push(['lock', 'opacity', lk.o], ['lock', 'transform', 'scale(' + lk.s + ')']);
  A.push(['shk', 'transform', 'translate(0 ' + f2(-7 * (1 - CURVE.out(span(t, LOCK_AT, LOCK_AT + 0.1)))) + ')']);
  S.push(['lkg', 'opacity', f3(smooth(span(t, LOCK_AT, LOCK_AT + 0.08)))]);
  void p;
  return { A, S, X: [], tx: TX.frame(t) };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 10px rgba(255,255,255,.55)) drop-shadow(0 0 26px rgba(255,255,255,.30))';
const GREEN_GLOW = 'drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 12px rgba(80,255,140,.55)) drop-shadow(0 0 30px rgba(80,255,140,.28))';
/* the alert red, this clip only, the one exception to the single accent */
const RED = '#ff5b5b';
const css = `
.sc{position:absolute;inset:0}
.sc svg{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
.ln{fill:none;stroke:#e9eeec;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.dim{fill:none;stroke:rgba(233,238,236,.45);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.grn{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 1}
.big{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
.big b{display:block;font:400 40px/1 var(--display);color:#f7f9f8;letter-spacing:.04em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
#w1,#w2{opacity:1}
#w2 b{font-size:36px}
.lbl{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center}
.lbl b{display:block;font:400 22px/1 var(--display);color:#f7f9f8;letter-spacing:.08em;white-space:nowrap;filter:${GLOW_LO};transform:translateY(-50%)}
.sheet{position:absolute;border:2.4px solid #e9eeec;border-radius:10px;background:#06070a;overflow:hidden}
.sheet i{position:absolute;left:12%;height:3px;transform-origin:0 50%;border-radius:2px;background:rgba(233,238,236,.35)}
.ap{position:absolute;left:0;right:0;display:flex;justify-content:center;font:400 72px/1 var(--display);color:var(--accent);filter:${GREEN_GLOW};will-change:transform}
#sh0{left:${SH0.x}px;top:${SH0.y}px;width:${SH0.w}px;height:${SH0.h}px;filter:${GLOW_LO}}
#ap0{top:112px;transform-origin:50% 50%}
#tag{position:absolute;left:60px;right:60px;top:${BOX.y + BOX.h + 26}px;text-align:center;font:400 18px/1 var(--mono);color:var(--sub);letter-spacing:.12em;opacity:0}
#tsh{position:absolute;left:${TSH.x}px;top:${TSH.y}px;width:${TSH.w}px;height:${TSH.h}px;will-change:transform}
#crkg{position:absolute;left:${CR.x - 50}px;top:${CR.y - 20}px;width:100px;height:100px;border-radius:50%;background:radial-gradient(rgba(80,255,140,.30),rgba(80,255,140,0) 70%);opacity:0}
#net{top:${LIGHT.y1 - 30}px;left:${LIGHT.x - 270}px;right:${270 - LIGHT.x}px}
#net b{color:#f7f9f8}
#cin{position:absolute;inset:0;will-change:opacity}
#dwrap{position:absolute;left:${DOOR.x}px;top:${DOOR.y}px;width:${DOOR.w}px;height:${DOOR.h}px}
#dglow{position:absolute;inset:0;border-radius:14px;background:radial-gradient(ellipse at 50% 60%,rgba(80,255,140,.22),rgba(80,255,140,.04) 70%);opacity:0}
#dpan{position:absolute;inset:0;border:2.6px solid #e9eeec;border-radius:14px;background:#0a0c10;transform-origin:0 50%;filter:${GLOW_LO};will-change:transform}
#ans{position:absolute;left:0;right:0;top:96px;text-align:center;font:400 19px/1.35 var(--display);color:#f7f9f8;letter-spacing:.08em;opacity:0;will-change:transform,opacity}
#fsh{position:absolute;z-index:7;left:0;top:0;width:${FS.w}px;height:${FS.h}px;opacity:0;will-change:transform,opacity}
#fsh .sheet{inset:0}
#ap2{position:absolute;left:0;right:0;top:${FS.h / 2}px;height:0;display:flex;justify-content:center;opacity:0;will-change:transform,opacity,filter}
#ap2 b{display:block;font:400 40px/1 var(--display);color:var(--accent);filter:${GREEN_GLOW};transform:translateY(-30%)}
#alert{position:absolute;left:${AL.x}px;top:${AL.y}px;width:${AL.w}px;height:${AL.h}px;border:3px solid ${RED};border-radius:22px;background:#0c0708;opacity:0;
  z-index:7;filter:drop-shadow(0 0 14px rgba(255,91,91,.45));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;will-change:transform,opacity}
#alert b{display:block;font:400 50px/1 var(--display);color:#f7f9f8;letter-spacing:.06em;-webkit-text-stroke:1px #fff}
#alert svg{position:static;width:96px;height:86px;margin-bottom:14px}
#spot{position:absolute;inset:0;opacity:0;will-change:transform,opacity}
#wit b,#wown b{font-size:32px}
#box2{position:absolute;inset:0;opacity:0;transform-origin:${PF.x}px ${PF.y}px;will-change:transform,opacity}
#lock{position:absolute;left:${LOCK.x - 50}px;top:${LOCK.y - 66}px;width:100px;height:106px;opacity:0;will-change:transform,opacity}
#lock svg{width:100px;height:106px}
#lkg{position:absolute;left:-30px;top:-14px;width:160px;height:140px;border-radius:50%;background:radial-gradient(rgba(80,255,140,.28),rgba(80,255,140,0) 70%);opacity:0}
`;
const lines = (n, top, gap, wd = [76, 64, 70, 52, 66]) => Array.from({ length: n }, (_, i) => `<i style="top:${top + i * gap}px;width:${wd[i % wd.length]}%"></i>`).join('');
const glass = (id, style = '') => `<svg viewBox="0 0 540 960" ${id ? `id="${id}"` : ''} style="${style}">
  <rect x="${BOX.x}" y="${BOX.y}" width="${BOX.w}" height="${BOX.h}" rx="20" style="fill:rgba(233,238,236,.035);stroke:#e9eeec;stroke-width:2.6;filter:${GLOW_LO}"/>
  <path class="dim" d="M${BOX.x + 26} ${BOX.y + 40} L${BOX.x + 60} ${BOX.y + 22} M${BOX.x + 26} ${BOX.y + 70} L${BOX.x + 110} ${BOX.y + 24}" style="stroke:rgba(233,238,236,.28)"/>
</svg>`;
const markup = `
<div class="sc" id="scA">
  <div class="big" id="w1" style="top:${WY.w1}px"><b>${W1}</b></div>
  <div class="big" id="w2" style="top:${WY.w2}px"><b>${W2}</b></div>
  <div class="sheet" id="sh0">${lines(3, 26, 22)}<div class="ap" id="ap0">${APLUS}</div>${lines(2, 200, 18).replace(/top:(\d+)/g, (m, v) => 'top:' + v)}</div>
</div>
<div class="sc" id="scB" style="opacity:0">
  ${glass('gB')}
  <div class="lbl" style="top:${BOX.y - 28}px"><b>${T_TEST}</b></div>
  <div id="tag">${T_TAG}</div>
  <div id="tsh"><div class="sheet" style="inset:0">${lines(5, 14, 14)}</div></div>
  <div id="crkg"></div>
  <svg viewBox="0 0 540 960">
    <path id="crk" class="grn" pathLength="1" stroke-dashoffset="1" d="M${CR.x - 8} ${CR.y - 2} L${CR.x + 4} ${CR.y + 16} L${CR.x - 8} ${CR.y + 32} L${CR.x + 6} ${CR.y + 50} L${CR.x - 2} ${CR.y + 62}" style="stroke-width:3.6;filter:${GREEN_GLOW}"/>
    <path id="lit" class="grn" pathLength="1" stroke-dashoffset="1" d="M${LIGHT.x} ${LIGHT.y0} V${LIGHT.y1}" style="stroke-width:3.4;filter:${GREEN_GLOW}"/>
  </svg>
  <div class="big" id="net"><b style="font-size:24px">${T_NET}</b></div>
</div>
<div class="sc" id="scC" style="opacity:0">
  <div id="cin">
    <div class="lbl" id="hf" style="top:${DOOR.y - 58}px"><b style="font-size:28px">${T_HF}</b></div>
    <div id="dwrap">
      <div id="dglow"></div>
      <div id="dpan">
        <div id="ans">${T_ANS1}<br>${T_ANS2}</div>
        <svg viewBox="0 0 ${DOOR.w} ${DOOR.h}" style="position:absolute;left:0;top:0;width:${DOOR.w}px;height:${DOOR.h}px">
          <circle class="ln" cx="${DOOR.w - 30}" cy="${DOOR.h / 2 + 10}" r="8"/>
          <path class="ln" d="M${DOOR.w - 30} ${DOOR.h / 2 + 18} V${DOOR.h / 2 + 40} M${DOOR.w - 30} ${DOOR.h / 2 + 30} H${DOOR.w - 22} M${DOOR.w - 30} ${DOOR.h / 2 + 38} H${DOOR.w - 24}"/>
        </svg>
      </div>
    </div>
  </div>
</div>
<div class="sc" id="scD">
  <svg viewBox="0 0 540 960" id="spot">
    <defs><linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#fff" stop-opacity="0.10"/></linearGradient></defs>
    <path d="M245 70 H305 L445 742 H105 Z" fill="url(#cone)"/>
    <ellipse cx="275" cy="742" rx="170" ry="16" fill="rgba(255,255,255,.07)"/>
  </svg>
  <div class="big" id="wit" style="top:${OY.it}px"><b>${W_IT}</b></div>
  <div class="big" id="wown" style="top:${OY.own}px"><b>${W_OWN}</b></div>
  <div id="box2">${glass('')}</div>
  <div id="lock"><div id="lkg"></div><svg viewBox="0 0 60 64">
    <path id="shk" class="grn" d="M20 30 V20 a10 10 0 0 1 20 0 V30" style="stroke-dasharray:none"/>
    <rect x="12" y="30" width="36" height="28" rx="6" style="fill:#06070a;stroke:var(--accent);stroke-width:3"/>
    <circle cx="30" cy="43" r="3.4" style="fill:var(--accent)"/>
  </svg></div>
</div>`;
const front = `
<div id="fsh"><div class="sheet">${lines(5, 16, 16)}</div><div id="ap2"><b>${APLUS}</b></div></div>
<div id="alert">
  <svg viewBox="0 0 96 86"><path d="M48 6 L90 80 H6 Z" style="fill:none;stroke:${RED};stroke-width:4;stroke-linejoin:round"/><path d="M48 32 V54" style="stroke:${RED};stroke-width:5;stroke-linecap:round"/><circle cx="48" cy="66" r="3.6" style="fill:${RED}"/></svg>
  <b>${W_HACK}</b><b>${W_FOUND}</b>
</div>`;

function page() {
  const els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.A) { const key = id + '|' + k; if (last[key] !== v) { last[key] = v; $(id).setAttribute(k, v); if (k === 'stroke-dashoffset') $(id).style.visibility = v >= 0.999 ? 'hidden' : ''; } }
      for (const [id, k, v] of o.S) { const key = id + '#' + k; if (last[key] !== v) { last[key] = v; $(id).style[k] = v; } }
    },
  };
}

/* ---------- the sound: on contact or on the fastest frame, and nothing at all
   in the silence after `caught a hacker` ---------- */
const CUES = [
  { t: CHEAT + 0.05, kind: 'popDeep', from: 'the hook slams, contact' },
  { t: WHIP - 0.12, kind: 'whoosh', opts: { len: 0.3 }, from: 'the whip, fastest at the cut' },
  { t: WRONG + 0.05, kind: 'tick', from: 'the crack' },
  { t: SLIP + 0.22, kind: 'pop', from: 'he pops out of the crack' },
  { t: ZOOM - 0.28, kind: 'whooshUp', opts: { len: 0.32 }, from: 'the zoom through, fastest at the cut' },
  { t: HUG + 0.04, kind: 'popDeep', opts: { len: 0.22 }, from: 'HUGGING FACE slams, contact' },
  { t: BROKE + 0.02, kind: 'servo', opts: { len: 0.22 }, from: 'the door swings' },
  { t: HOPOUT + 0.4, kind: 'land', from: 'he lands with the sheet' },
  { t: APL + 0.04, kind: 'popDeep', from: 'A+ slams, contact' },
  { t: ALERT + 0.03, kind: 'popDeep', opts: { f0: 80, f1: 44, len: 0.32 }, from: 'HACKER FOUND slams, contact' },
  { t: ALERT + 0.03, kind: 'hum', opts: { len: 0.5, f: 62, rise: 0.02, fall: 0.3 }, from: 'the alert tone' },
  { t: FLIP + 0.06, kind: 'whoosh', opts: { len: 0.26 }, from: 'the alert flips' },
  { t: OWN + 0.04, kind: 'popDeep', from: 'THEIR OWN AI slams, contact' },
  { t: LOCK_AT + 0.08, kind: 'click', from: 'the lock clicks' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
for (const c of CUES) if (c.t > L6A.end - 0.05 && c.t < L6B.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [0.3, CHEAT, WHIP, TAG, LOCKED, WRONG, SLIP, NET, ZOOM, HUG, ANS, BROKE, HOPOUT, APL, ALERT, FLIP, SPOT, HACKER, OWN, BACK, LOCK_AT, NOD];
const STILLS = [0, CHEAT + 0.3, WHIP + 0.4, TAG + 0.4, LOCKED + 0.1, WRONG + 0.3, SLIP - 0.15, NET + 0.4, ZOOM + 0.4, HUG + 0.3, ANS + 0.4, BROKE + 0.4, APL + 0.35,
  ALERT + 0.3, L6A.end + 0.3, FLIP + 0.15, SPOT + 0.4, HACKER + 0.3, OWN + 0.5, BACK + 0.6, LOCK_AT + 0.2, NOD + 0.25, CUT + 0.6];

const res = await runEpisode({
  post: 55, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { whoosh: -21, popDeep: -15, bass: -20, hum: -14 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: {},
    sleep: [],
    beats: BEATS,
    checks: ['#w1 b', '#w2 b', '#sh0', '#tag', '#net b', '#dwrap', '#ans', '#fsh', '#alert', '#wit b', '#wown b', '#lock'],
    hook: ['#w1 b', '#w2 b', '#sh0'],
    copy: [W1, W2, APLUS, T_TEST, T_TAG, T_NET, T_HF, T_ANS1, T_ANS2, W_HACK, W_FOUND, W_IT, W_OWN],
    verify: [
      /* the big words stay inside the margins */
      { at: CHEAT + 0.6, sel: '#w1 b', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'AI CHEATED leaves the margin: ' + JSON.stringify(r)) },
      { at: OWN + 0.6, sel: '#wown b', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'THEIR OWN AI leaves the margin: ' + JSON.stringify(r)) },
      /* he is clear of the hook sheet on frame 0 */
      { at: 0.1, sel: '#m-card', test: r => (r && r.l > SH0.x + SH0.w + 4 ? null : 'he overlaps the sheet: ' + JSON.stringify(r)) },
      /* the floating sheet clears him and the subtitles */
      { at: APL + 0.5, sel: '#fsh', test: r => (r && r.b < 762 && r.r <= 481 ? null : 'the sheet is off its spot: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [CHEAT, 'the hook slams'], [WHIP, 'the whip'], [TAG, 'the tag'], [LOCKED, 'the box flashes'], [WRONG, 'the crack'], [SLIP, 'he slips out'], [NET, 'INTERNET'],
      [ZOOM, 'the zoom through'], [ANS, 'ANSWERS INSIDE'], [BROKE, 'the door opens'], [HOPOUT, 'he hops out'], [APL, 'A+ slams'], [ALERT, 'HACKER FOUND'],
      [QUIET, 'the silence'], [FLIP, 'the flip'], [SPOT, 'the spotlight'], [HACKER, 'IT WAS'], [OWN, 'THEIR OWN AI'], [BACK, 'back in the box'], [LOCK_AT, 'the lock'], [NOD, 'the nod']],
  },
});
void res;
