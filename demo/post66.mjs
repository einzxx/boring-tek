/* the boring tek — post66. real or AI, the first clip of the series. a real
   NASA Juno photo of jupiter in a big card, the question, a one second
   countdown, the answer. about 11 seconds.

   **the look, the series':** post65's deep black with the very soft vignette
   and no dot grid. the photo fills most of the frame in a big rounded card
   with a thin white glow edge. huge white Michroma words with the house deep
   glow. **white and green only, no second colour, Einz's call for the
   series:** green is the active caption word, the REAL button when it lights,
   the ring at the reveal and the one full screen flash. the mascot is the
   host, small in the lower right with the dark clips' white glow.

   **the photo is real, ignored in demo/assets/, never pushed.** its source
   page, credit and licence are in demo/assets/LICENSES.md. the clip stops if
   it is missing rather than drawing a stand in.

   1080x1920. three lines in **his own voice**, the host slot, MASCOT_VOICE_ID
   in demo/.env, eleven_v4, three takes a line, every take heard back with
   speech to text and kept only if it says the line as written. sped up 1.16
   with atempo, pitch kept, post65's tempo. karaoke captions at 73.5%,
   post65's band. the end is the house default from post65: one glitch into
   THE BORING TEK, its sound on exactly its frames, the card held 1.5s, the
   clip ends on it.

     frame 0  the photo in its card, REAL OR AI? mid slam, him at the lens
     l1       real or AI ...       REAL and AI pop in under the card on their words
     the countdown, no voice       a ring drains round the card in 1.0s, ticking
     the reveal                    REAL lights green with a stamp, a green flash,
                                   the title whips out, the slow zoom starts
     l2       real. a NASA ...     NASA JUNO MISSION rises into the card on NASA
     l3       space is wilder ...  WILDER slams over the photo, he nods, happy
     THE BORING TEK, one glitch in, a 1.5s card, the end

     node post66.mjs --takes              read the lines, print the words, stop
     node post66.mjs --stills             one still per beat, no render, no sound
     DEMO_FPS=12 node post66.mjs          the preview
     node post66.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, wordIn,
  CURVE, CURVE56, hitPulse, peakAt, FPS,
} from './lib/aiafter.mjs';
import { SR, VOICES, GAINS, decode } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);

/* ---------- the read: him, in his own voice ---------- */
const MODEL = { model: 'eleven_v4', voice: 'host', hear: true };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[playful] real or AI? you have one second.', tempo: TEMPO },
  { key: 'r2', text: '[amused] real. a NASA probe took this photo of jupiter.', tempo: TEMPO },
  { key: 'r3', text: '[cheerful] space is wilder than any AI.', tempo: TEMPO },
];
const TAKES = await readLines(66, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2, L3] = TAKES;

if (process.argv.includes('--takes')) {
  for (const T of TAKES) {
    place(T, 0);
    console.log('\n' + T.name + '  ' + T.all.join(' | '));
    console.log('  heard: ' + T.heard);
    console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
  }
  process.exit(0);
}

/* ---------- the photo, or nothing ---------- */
const ASSET = f => path.join(HERE, 'assets', f);
const PHOTO_FILE = fs.readdirSync(path.join(HERE, 'assets')).find(f => /^jupiter-juno\.(jpe?g|png)$/i.test(f));
if (!PHOTO_FILE) { console.error('\nSTOPPED. demo/assets/jupiter-juno.jpg is missing, see demo/assets/LICENSES.md for where it comes from.'); process.exit(1); }
const PHOTO = 'data:image/' + (/png$/i.test(PHOTO_FILE) ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(ASSET(PHOTO_FILE)).toString('base64');
/* PIA21978, 4207x1576, Kevin M. Gill's enhanced JunoCam frame, CC BY. the
   card crops it round the white storm swirl, the limb in the top right, and
   the slow zoom closes in on the swirl */
const PHOTO_POS = '57% 50%', PHOTO_ZOOM = '42% 40%';
/* the credit the license asks for, the processor named, the change said */
const CREDIT = ['image NASA JPL Caltech SwRI MSSS', 'processing Kevin M. Gill, CC BY, cropped'];

/* ---------- the clock: all off the read ---------- */
place(L1, 0);
place(L1, 0.2 - L1.W[0].start);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const REAL1 = w(L1, 'real'), AI1 = w(L1, 'ai'), ONE = w(L1, 'one');
/* the countdown: the planned silence, exactly one second, no voice */
const TICK = f3(L1.end + 0.08), REV = f3(TICK + 1.0);
place(L2, REV + 0.04);
const NASA = w(L2, 'nasa'), PHOTOW = w(L2, 'photo'), JUP = w(L2, 'jupiter');
place(L3, L2.end + 0.26);
const WILD = w(L3, 'wilder'), AI3 = w(L3, 'ai');
const SLAM0 = -0.12;
/* the house ending from post65: one glitch into THE BORING TEK, held 1.5s,
   the clip ends on it, no run back into frame 0, no glitch out */
const FL = { at: f3(L3.end + 0.05), for: 1.5, card: true, out: false };
const END = f3(FL.at + FL.for);
const U = t => t;

/* ---------- the layout, css px of the 540x960 stage ---------- */
const BLACK = '#050506', GREEN = '#3dff6e', WHITE = '#ffffff', INK = '#0d0d12';
const GLOW_TXT = '0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10)';
const CAP_Y = 706;
/* the photo card: most of the frame, inside the 60px margin */
const CARD = { x0: 70, y0: 96, w: 400, h: 470, r: 30 };
CARD.x1 = CARD.x0 + CARD.w; CARD.y1 = CARD.y0 + CARD.h; CARD.cx = CARD.x0 + CARD.w / 2; CARD.cy = CARD.y0 + CARD.h / 2;
/* the ring timer, on the card's own edge */
const RING = { x0: CARD.x0 - 1, y0: CARD.y0 - 1, x1: CARD.x1 + 1, y1: CARD.y1 + 1, r: CARD.r + 1 };
/* the two buttons under the card */
const BTN = { y: 590, h: 60, w: 180, gap: 20 };
/* him, small in the lower right, clear of the caption and the bottom 150 */
const MAS = { cx: 424, cy: 762, size: 134, scale: 0.6 };
const TTL_W = 360, WILD_W = 370, WMKW = 'THE BORING TEK';
const TTL = { lines: ['REAL OR', 'AI?'], top: 124 };

/* the ring, a rounded rect from the top middle, clockwise */
const ringPath = (() => {
  const { x0, y0, x1, y1, r } = RING, cx = (x0 + x1) / 2;
  return `M${cx} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
})();

/* ---------- the captions: one to three words a page, the read's own times ---------- */
const PAGES_TXT = [
  [0, 'real or AI'], [0, 'you have'], [0, 'one second'],
  [1, 'real'], [1, 'a NASA probe'], [1, 'took this photo'], [1, 'of jupiter'],
  [2, 'space is'], [2, 'wilder than'], [2, 'any AI'],
];
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const PAGES = (() => {
  const cur = TAKES.map(() => 0), out = [];
  for (const [li, txt] of PAGES_TXT) {
    const T = TAKES[li], words = [];
    for (const d of txt.split(' ')) {
      const want = letters(d);
      let got = '', a = cur[li];
      while (cur[li] < T.W.length && got.length < want.length) got += letters(T.W[cur[li]++].word);
      if (got !== want) throw new Error('caption "' + txt + '" does not match the read of line ' + (li + 1) + ': ' + T.W.map(q => q.word).join(' '));
      words.push({ txt: d, start: T.W[a].start, end: T.W[cur[li] - 1].end });
    }
    out.push({ li, txt, words, from: f3(words[0].start - 0.05), to: f3(words[words.length - 1].end + 0.3) });
  }
  for (let i = 0; i + 1 < out.length; i++) out[i].to = Math.min(out[i].to, out[i + 1].from);
  /* no caption over the countdown */
  const p = out.findIndex(P => P.li === 0 && P.txt === 'one second');
  out[p].to = Math.min(out[p].to, TICK + 0.12);
  return out;
})();
const backOut = q => 1 + 2.70158 * (q - 1) ** 3 + 1.70158 * (q - 1) ** 2;

/* ---------- the camera: scale about a focus, keyframed, the whole frame ----------
   push and punch stay inside 6%, the house cap */
const CAMK = [
  { at: SLAM0, d: 0.45, s: 1.0, fx: 270, fy: 330, c: CURVE.out },
  { at: AI1, d: 0.14, s: 1.035, fx: 270, fy: 260, c: CURVE.cam },
  { at: AI1 + 0.3, d: 0.4, s: 1.0, fx: 270, fy: 330, c: CURVE.out },
  { at: ONE, d: TICK - ONE, s: 1.025, fx: 270, fy: 360, c: CURVE.dolly },
  { at: TICK, d: 1.0, s: 1.055, fx: 270, fy: 360, c: CURVE.dolly },
  { at: REV, d: 0.16, s: 1.0, fx: 270, fy: 520, c: CURVE.cam },
  { at: NASA, d: 0.14, s: 1.04, fx: 270, fy: 520, c: CURVE.cam },
  { at: NASA + 0.35, d: PHOTOW - NASA - 0.35, s: 1.01, fx: 270, fy: 330, c: CURVE.dolly },
  { at: PHOTOW, d: 0.14, s: 1.035, fx: 270, fy: 300, c: CURVE.cam },
  { at: PHOTOW + 0.3, d: JUP - PHOTOW - 0.3, s: 1.015, fx: 270, fy: 330, c: CURVE.dolly },
  { at: JUP, d: 0.16, s: 1.045, fx: 270, fy: 330, c: CURVE.cam },
  { at: L3.at - 0.05, d: 0.35, s: 1.0, fx: 270, fy: 330, c: CURVE.out },
  { at: WILD, d: 0.14, s: 1.05, fx: 270, fy: 300, c: CURVE.cam },
  { at: AI3, d: FL.at - AI3, s: 1.03, fx: 270, fy: 300, c: CURVE.dolly },
];
function camera(t) {
  const u = U(t);
  let s = 1.06, tx = 270 * (1 - 1.06), ty = 330 * (1 - 1.06);
  for (const k of CAMK) {
    if (u < k.at) break;
    const q = k.c(span(u, k.at, k.at + k.d));
    s = lerp(s, k.s, q); tx = lerp(tx, k.fx * (1 - k.s), q); ty = lerp(ty, k.fy * (1 - k.s), q);
  }
  /* the stamp kicks the frame */
  const k = u >= REV && u < REV + 0.35 ? Math.exp(-(u - REV) / 0.08) : 0;
  tx += 7 * k * Math.sin((u - REV) * 90); ty += 5 * k * Math.cos((u - REV) * 70);
  return { s: f3(s), tx: f2(tx), ty: f2(ty), live: true };
}

/* the frames that are a move, not a layout: the margin guard skips them */
const MOVES = [[-0.4, 0.3], [REAL1 - 0.02, REAL1 + 0.4], [AI1 - 0.02, AI1 + 0.4], [REV - 0.02, REV + 0.5],
  [NASA - 0.02, NASA + 0.45], [PHOTOW - 0.02, PHOTOW + 0.3], [WILD - 0.02, WILD + 0.45]];
const moving = u => MOVES.some(([a, b]) => u >= a && u < b);

/* ---------- him: small in the corner, talking to the lens ---------- */
function face(t) {
  const u = U(t);
  let dy = 1.6 * Math.sin(2 * Math.PI * u / 2.2), rot = 0, lid = 0.04, arc = 0, look = null, esy = 1;
  /* a hop as each button pops */
  for (const a of [REAL1, AI1]) dy -= 6 * Math.sin(Math.PI * span(u, a, a + 0.26));
  /* the squint at the lens on one second, then his eyes up to the ring */
  const sq = smooth(span(u, ONE, ONE + 0.12)) * (1 - smooth(span(u, TICK + 0.05, TICK + 0.2)));
  lid = Math.max(lid, 0.45 * sq); rot += 7 * sq; esy = 1 - 0.45 * sq;
  const up = smooth(span(u, TICK + 0.05, TICK + 0.22)) * (1 - smooth(span(u, REV, REV + 0.15)));
  if (up > 0) look = { x: CARD.cx, y: CARD.y0 + 60, w: up };
  /* happy on the reveal, under 0.6s, and a hop */
  arc = Math.max(arc, bump(u, REV + 0.02, 0.06, 0.38, 0.08));
  dy -= 9 * Math.sin(Math.PI * span(u, REV, REV + 0.3));
  /* a glance up at the photo on jupiter */
  const gl = bump(u, JUP + 0.05, 0.12, 0.5, 0.15);
  if (gl > 0) look = { x: CARD.cx, y: CARD.cy, w: gl };
  /* the nod on wilder: two dips, happy, 0.55s */
  arc = Math.max(arc, bump(u, WILD + 0.02, 0.06, 0.4, 0.09));
  const nod = span(u, WILD, WILD + 0.6);
  dy += 7 * Math.sin(2 * Math.PI * nod) * (nod > 0 && nod < 1 ? 1 : 0);
  rot += -3 * Math.sin(2 * Math.PI * nod) * (nod > 0 && nod < 1 ? 1 : 0);
  return { lid: f3(lid), arc: f3(arc), ...(look ? { look } : {}), dx: 0, dy: f2(dy), rot: f2(rot), sq: 0, esy: f3(esy) };
}

/* ---------- a frame of the story ---------- */
function frame(t) {
  const u = U(t), S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };

  S.push(['wmk', 'opacity', f3(1 - smooth(span(u, ONE - 0.1, ONE + 0.1)))]);

  /* the photo: a breath of drift through the question, then the slow zoom
     from the reveal to the card */
  {
    const z = 1.0 + 0.025 * CURVE.dolly(span(u, 0, REV)) + 0.13 * CURVE.dolly(span(u, REV, FL.at));
    S.push(['pimg', 'transform', 'scale(' + f3(z) + ')']);
    /* the photo dims a touch under the big words, so they read */
    const dim = Math.max(1 - smooth(span(u, REV, REV + 0.2)), smooth(span(u, WILD - 0.02, WILD + 0.1)));
    S.push(['scrim', 'opacity', f3(dim)]);
  }

  /* REAL OR AI?: slams in, AI? kicks on AI, stretches on one second, whips up and out on the reveal */
  {
    const a = wordIn(u, SLAM0, 'slam'), o = CURVE56.in(span(u, REV - 0.02, REV + 0.16));
    const st = Math.sin(Math.PI * span(u, ONE, ONE + 0.34));
    put('ttl', a.o * (1 - o), 'translateY(' + f2(-200 * o) + 'px) scale(' + f3(a.s * (1 + 0.03 * st)) + ',' + f3(a.s * (1 + 0.12 * st)) + ')', Math.max(a.blur, 14 * o));
    S.push(['ttla', 'transform', 'scale(' + f3(1 + 0.16 * hitPulse(u - AI1, 0.03, 0.16)) + ')']);
  }

  /* the buttons: pop in on their words, pulse on the ticks, then REAL is stamped green and AI drops */
  {
    const r = u < REAL1 ? { o: 0, s: 0.6 } : wordIn(u, REAL1, 'spring'), a = u < AI1 ? { o: 0, s: 0.6 } : wordIn(u, AI1, 'spring');
    const tk = u >= TICK && u < REV ? 0.035 * Math.exp(-(((u - TICK) % 0.29)) / 0.06) : 0;
    const lit = u >= REV;
    const stamp = lit ? lerp(1.32, 1, CURVE.out(span(u, REV, REV + 0.16))) : 1;
    const srot = lit ? -5 * (1 - CURVE.out(span(u, REV, REV + 0.2))) : 0;
    put('breal', r.o, 'scale(' + f3(r.s * (1 + tk) * stamp) + ') rotate(' + f2(srot) + 'deg)');
    S.push(['breal', 'background', lit ? GREEN : 'rgba(255,255,255,0.06)'], ['breal', 'color', lit ? INK : WHITE], ['breal', 'border-color', lit ? GREEN : WHITE]);
    const drop = smooth(span(u, REV + 0.04, REV + 0.3));
    put('bai', a.o * (1 - 0.68 * drop), 'translateY(' + f2(10 * drop) + 'px) scale(' + f3(a.s * (1 + tk) * (1 - 0.08 * drop)) + ')');
  }

  /* the ring: drains round the card in exactly the second, then flashes green and goes */
  {
    const k = span(u, TICK, REV);
    const on = u >= TICK - 0.06 ? smooth(span(u, TICK - 0.06, TICK)) * (1 - smooth(span(u, REV + 0.12, REV + 0.4))) : 0;
    S.push(['ring', 'opacity', f3(on)], ['ringp', 'stroke-dasharray', f3(u >= REV ? 1 : 1 - k) + ' 2'], ['ringp', 'stroke', u >= REV ? GREEN : WHITE]);
  }

  /* NASA JUNO MISSION rises into the bottom of the card on NASA */
  {
    const a = u < NASA ? { o: 0, y: 24, blur: 12 } : wordIn(u, NASA, 'rise');
    S.push(['lbl', 'opacity', f3(a.o)], ['lbl', 'transform', 'translateY(' + f2(a.y) + 'px)'], ['lbl', 'filter', a.blur > 0 ? 'blur(' + f2(a.blur) + 'px)' : 'none']);
  }

  /* WILDER slams over the photo on wilder */
  {
    const a = u < WILD ? { o: 0, s: 1.2, blur: 20 } : wordIn(u, WILD, 'slam');
    put('wild', a.o, 'scale(' + f3(a.s) + ')', a.blur);
  }

  /* the payoff flash: two green frames on the stamp, straight back */
  S.push(['flash', 'opacity', u >= REV && u < REV + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

  /* the karaoke page, and the word being said in green */
  let pi = -1;
  for (let i = 0; i < PAGES.length; i++) if (u >= PAGES[i].from && u < PAGES[i].to) pi = i;
  X.push(['cap', String(pi)]);
  if (pi >= 0) {
    const P = PAGES[pi], q = span(u, P.from, P.from + 0.15);
    const fade = 1 - smooth(span(u, P.to - 0.08, P.to));
    const last = pi + 1 >= PAGES.length || PAGES[pi + 1].from > P.to + 0.01;
    put('cap', smooth(span(u, P.from, P.from + 0.06)) * (last ? fade : 1), 'scale(' + f3(0.82 + 0.18 * backOut(q)) + ')');
    let act = 0;
    P.words.forEach((q2, j) => { if (u >= q2.start - 0.03) act = j; });
    for (let j = 0; j < 3; j++) S.push(['cw' + j, 'color', j === act ? GREEN : WHITE]);
  } else S.push(['cap', 'opacity', 0]);
  return { S, X, tx: [{ busy: moving(u) }] };
}

/* ---------- the drawing ---------- */
const css = `
:root,html[data-theme=dark]{--bg:${BLACK}}
html,body,.stage{background:${BLACK} !important}
/* only a very soft dark vignette, no dot grid */
.vignette{display:block;position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 85% 70% at 50% 46%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%)}
/* his white glow, the dark clips' own radii in css px at his scale */
.m-glow-mid{filter:blur(${f2(11 / MAS.scale)}px)}
.m-glow-wide{filter:blur(${f2(30 / MAS.scale)}px)}
#wmk{position:absolute;left:60px;right:60px;top:66px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:${WHITE};text-shadow:${GLOW_TXT};z-index:5}
#card{position:absolute;left:${CARD.x0}px;top:${CARD.y0}px;width:${CARD.w}px;height:${CARD.h}px;border-radius:${CARD.r}px;overflow:hidden;background:#000;z-index:2;
  border:2px solid rgba(255,255,255,.92);box-sizing:border-box;box-shadow:0 0 8px rgba(255,255,255,.45),0 0 26px rgba(255,255,255,.18)}
#pimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${PHOTO_POS};transform-origin:${PHOTO_ZOOM};will-change:transform}
/* the credit the CC BY license asks for, small and clean, the whole time */
#cred{position:absolute;left:0;right:0;bottom:10px;text-align:center;font:400 9.5px/1.35 var(--read);letter-spacing:.02em;color:rgba(255,255,255,.82);text-shadow:0 0 4px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.8)}
#cardfoot{position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.55))}
#scrim{position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 50% 40%,rgba(0,0,0,.5),rgba(0,0,0,.18) 80%)}
#lbl{position:absolute;left:0;right:0;bottom:48px;text-align:center;font:400 13px/1 var(--display);letter-spacing:.3em;text-indent:.3em;color:${WHITE};text-shadow:0 0 6px rgba(0,0,0,.9),0 0 14px rgba(0,0,0,.7),${GLOW_TXT};opacity:0}
#ring{position:absolute;left:0;top:0;width:540px;height:960px;z-index:3;opacity:0;overflow:visible;pointer-events:none}
#ringp{fill:none;stroke-width:7;stroke-linecap:round;filter:drop-shadow(0 0 5px rgba(255,255,255,.55)) drop-shadow(0 0 14px rgba(255,255,255,.25))}
.big{position:absolute;display:flex;flex-direction:column;align-items:center;opacity:0;z-index:5;will-change:transform,opacity,filter}
.big span{display:block;width:max-content;font-family:var(--display);font-weight:400;line-height:1;letter-spacing:.02em;color:${WHITE};white-space:nowrap;-webkit-text-stroke:2px ${WHITE};text-shadow:${GLOW_TXT}}
.big span+span{margin-top:12px}
#ttl{left:${f2(270 - TTL_W / 2)}px;width:${TTL_W}px;top:${TTL.top}px;transform-origin:50% 40%}
#ttla{display:inline-block;transform-origin:50% 60%}
#wild{left:${f2(270 - WILD_W / 2)}px;width:${WILD_W}px;top:${CARD.cy - 40}px;transform-origin:50% 50%}
.btn{position:absolute;top:${BTN.y}px;width:${BTN.w}px;height:${BTN.h}px;border-radius:${BTN.h / 2}px;border:2px solid ${WHITE};box-sizing:border-box;display:flex;align-items:center;justify-content:center;
  font:400 26px/1 var(--display);letter-spacing:.06em;color:${WHITE};background:rgba(255,255,255,.06);box-shadow:0 0 8px rgba(255,255,255,.35),0 0 22px rgba(255,255,255,.14);opacity:0;z-index:4;will-change:transform,opacity}
#breal{left:${270 - BTN.gap / 2 - BTN.w}px}
#bai{left:${270 + BTN.gap / 2}px}
#flash{position:absolute;inset:0;background:${GREEN};opacity:0;z-index:20}
#cap{position:absolute;left:60px;right:60px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;z-index:9;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 34px/1 var(--read);color:${WHITE};white-space:nowrap}
`;
const capHtml = '<b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b>';
const markup = `
<div id="wmk">${WMKW}</div>
<div id="card"><img id="pimg" src="${PHOTO}" alt=""><div id="scrim"></div><div id="cardfoot"></div><div id="lbl">NASA JUNO MISSION</div><div id="cred">${CREDIT[0]}<br>${CREDIT[1]}</div></div>
<svg id="ring" viewBox="0 0 540 960"><path id="ringp" d="${ringPath}" pathLength="1"/></svg>
<div class="btn" id="breal">REAL</div><div class="btn" id="bai">AI</div>
<div class="big" id="ttl"><span>${TTL.lines[0]}</span><span><em id="ttla" style="font-style:normal">${TTL.lines[1]}</em></span></div>
<div class="big" id="wild"><span>WILDER</span></div>`;
const overlay = `<div id="flash"></div><div id="cap">${capHtml}</div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  /* every big line its own size, fitted to its width, measured on the first frame */
  let fitted = false;
  const size = (el, w) => {
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * w / el.getBoundingClientRect().width).toFixed(2) + 'px';
  };
  const fit = () => {
    const [a, b] = $('ttl').querySelectorAll('span');
    size(a, D.tw); size(b, D.tw * 0.62);
    size($('wild').querySelector('span'), D.ww);
  };
  window.__gag = {
    apply(o) {
      if (!fitted) { fit(); fitted = true; }
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k === 'stroke-dasharray' || k === 'stroke') $(id).setAttribute(k, v);
        else if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, v] of o.X) {
        if (last[id + '$'] === v) continue;
        last[id + '$'] = v;
        const ws = +v < 0 ? [] : D.pages[+v];
        for (let j = 0; j < 3; j++) { $('cw' + j).textContent = ws[j] || ''; $('cw' + j).style.display = ws[j] ? 'inline' : 'none'; }
      }
    },
  };
}

/* ---------- the sound ----------
   every effect a real recorded mixkit sound. mixkit has no stamp, so the
   stamp is the correct answer ding over the impact of a blow. a light
   playful bed from elevenmusic, ducked under the words, out for the countdown */
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
const onGrid = (t, len) => { const n = Math.max(1, Math.round(len * FPS)); return { t0: Math.round(t * FPS) / FPS, n, secs: n / FPS }; };
const GA = onGrid(FL.at - 0.05, 3 / 60);
const SILENCE = [f3(L1.end), f3(REV)];
async function sound() {
  const { elevenMusic } = await import('./lib/elevenmusic.mjs');
  const ffmpeg = (await import('ffmpeg-static')).default;
  const MK = path.join(HERE, 'assets', 'sfx-mixkit');
  /* [file, peak dB, run up, longest]: trimmed to its first sound and at most
     its run up before the hit, and the clock to exactly the countdown */
  const FX = {
    swooshwhoosh: ['mixkit-3115-fast-transitions-swoosh.mp3', -17, 0.1],
    thud: ['mixkit-2150-impact-of-a-blow.mp3', -11, 0.02],
    fastwhoosh: ['mixkit-1490-fast-whoosh-transition.mp3', -18, 0.3],
    arrowwhoosh: ['mixkit-1491-arrow-whoosh.mp3', -19, 0.08],
    popHard: ['mixkit-2364-hard-pop-click.mp3', -7, 0.01],
    popLight: ['mixkit-3005-explainer-video-pops-whoosh-light-pop.mp3', -13, 0.01],
    clock: ['mixkit-1063-fast-wall-clock-ticking.mp3', -12, 0, 1.0],
    ding: ['mixkit-953-correct-answer-fast-notification.mp3', -13, 0.01],
    mkGlitch: ['mixkit-2951-digital-glitch-break.mp3', -15, 9],
  };
  const PEAK = {};
  for (const [k, [file, gain, runUp, most]] of Object.entries(FX)) {
    if (!fs.existsSync(path.join(MK, file))) { console.error('\nSTOPPED. demo/assets/sfx-mixkit/' + file + ' is missing, see its LICENSES.md for the source.'); process.exit(1); }
    const raw = Float32Array.from(decode(ffmpeg, path.join(MK, file)));
    let pk = 0; for (const v of raw) pk = Math.max(pk, Math.abs(v));
    if (pk > 0) for (let i = 0; i < raw.length; i++) raw[i] /= pk;
    let onset = 0; while (onset < raw.length && Math.abs(raw[onset]) < 0.03) onset++;
    /* the clock is a run of ticks: it starts on its first and is cut to the second */
    const W = Math.round(0.01 * SR); let best = 0, at = onset;
    if (most == null) for (let i = 0; i + W < raw.length; i += W) { let e = 0; for (let j = i; j < i + W; j++) e += raw[j] * raw[j]; if (e > best) { best = e; at = i; } }
    const a = Math.max(onset, Math.min(at, at - Math.round(runUp * SR)));
    const b = Float32Array.from(raw.subarray(a, most ? a + Math.round(most * SR) : undefined));
    const fi = Math.round(0.004 * SR); for (let i = 0; i < fi && i < b.length; i++) b[i] *= i / fi;
    if (most) { const fo = Math.round(0.03 * SR); for (let i = 0; i < fo; i++) b[b.length - 1 - i] *= i / fo; }
    PEAK[k] = Math.max(0, at - a) / SR;
    VOICES[k] = () => b; GAINS[k] = gain;
    console.log('  ' + k + ' ' + file + ', hit at ' + PEAK[k].toFixed(3) + 's');
  }
  VOICES.elGlitch = VOICES.mkGlitch;
  const GR = (() => {
    const src = VOICES.elGlitch(), fl = Math.round(SR / 60), lv = [];
    for (let a = 0; a + fl < src.length; a += Math.round(fl / 2)) { let e = 0; for (let i = a; i < a + fl; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
    lv.sort((x, y) => y.e - x.e);
    return [lv[0].off];
  })();
  const stutter = (off, secs, seed) => {
    const fl = Math.round(SR / 60), n = Math.max(1, Math.round(secs * 60)), src = VOICES.elGlitch(), g = Math.round(fl * 0.8), out = new Float32Array(Math.round(secs * SR)), at = Math.round(off * SR);
    for (let k = 0; k < n; k++) for (let i = 0; i < g && k * fl + i < out.length; i++) out[k * fl + i] = src[Math.min(src.length - 1, at + i + (k % 2) * seed)] * Math.min(1, i / 48, (g - i) / 48) * (1 - 0.12 * k);
    return out;
  };
  VOICES.stutA = () => stutter(GR[0], GA.secs, 0); GAINS.stutA = -9;
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  const CUES = [
    on(peakAt(SLAM0, SLAM0 + 0.25, CURVE.out), 'swooshwhoosh', 'frame 0, REAL OR AI? slams'),
    on(0.06, 'thud', 'frame 0, the title lands'),
    on(REAL1 + 0.02, 'popLight', 'the REAL button'),
    on(AI1 + 0.02, 'popHard', 'the AI button'),
    { t: TICK, kind: 'clock', from: 'the one second countdown, the clock' },
    on(REV, 'thud', 'the stamp lands on REAL'),
    on(REV + 0.01, 'ding', 'REAL, the right answer'),
    on(peakAt(REV - 0.02, REV + 0.16, CURVE56.in), 'fastwhoosh', 'REAL OR AI? whips out'),
    on(peakAt(NASA, NASA + 0.45, CURVE.out), 'arrowwhoosh', 'NASA JUNO MISSION rises'),
    on(WILD - 0.03, 'swooshwhoosh', 'WILDER slams in'),
    on(WILD + 0.03, 'thud', 'WILDER lands'),
    { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark, on its frames' },
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  const BED = await elevenMusic('post66', { prompt: 'light playful bouncy background bed, plucky synth, pizzicato and soft claps, curious and cheeky, sparse, steady, 118 bpm, no vocals, no heavy bass, no drops', seconds: f3(FL.at + 1.7), tries: 3 });
  console.log('  music ' + BED.all.join(' | '));
  const b = highPass(BED.pcm, 110);
  const g = t => 1 - smooth(span(t, SILENCE[0] - 0.05, SILENCE[0] + 0.08)) * (1 - smooth(span(t, SILENCE[1] - 0.02, SILENCE[1] + 0.2)));
  for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
  return { sfx: { cues: CUES, level: -9, duck: 0.6 }, music: { pcm: b, level: -27, duck: 0.6, under: -14, fx: 6 } };
}

const STILLS = [0, 0.3, f3(REAL1 + 0.3), f3(AI1 + 0.3), f3(ONE + 0.2), f3(TICK + 0.5), f3(REV + 0.01), f3(REV + 0.3), f3(NASA + 0.5), f3(JUP + 0.3),
  f3(L3.at + 0.2), f3(WILD + 0.3), f3(AI3 + 0.2), f3(FL.at + 0.3), f3(END - 1 / 60)];
const STILLS_RUN = process.argv.includes('--stills');
const BEATS = [REAL1, AI1, ONE, TICK, REV, NASA, PHOTOW, JUP, L3.at, WILD, FL.at];

console.log('  lines ' + [L1, L2, L3].map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', countdown ' + TICK + '..' + REV + ', flash ' + FL.at + ', end ' + END);
console.log('  reveal at ' + REV + 's, ' + Math.round(100 * REV / END) + '% of the runtime');
const sfx = STILLS_RUN ? null : await sound();

await runEpisode({
  post: 66, ep: 0, series: false, title: [],
  cut: END, flash: FL,
  mascot: MAS,
  voice: [L1, L2, L3], subs: [],
  tp: -1,
  maxGap: 1.3,
  ...(sfx ? { sfx: sfx.sfx, music: sfx.music } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, overlay, page, frame, face, camera,
    data: { pages: PAGES.map(P => P.words.map(q => q.txt)), tw: TTL_W, ww: WILD_W },
    sleep: [],
    beats: BEATS,
    checks: ['#card', '#ttl', '#wild', '#breal', '#bai', '#cap b', '#wmk'],
    hook: ['#card', '#ttl', '#wmk'],
    copy: [...TTL.lines, 'REAL', 'AI', 'WILDER', 'NASA JUNO MISSION', ...CREDIT, WMKW, ...PAGES.map(P => P.txt)],
    verify: [
      ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && r.t > 680 && r.b < 735 ? null : 'the caption "' + P.txt + '" leaves its band: ' + JSON.stringify(r)) })),
      { at: 0.4, sel: '#ttl', test: r => (r && r.t >= CARD.y0 && r.b < CARD.y1 - 60 ? null : 'REAL OR AI? leaves the card: ' + JSON.stringify(r)) },
      { at: f3(WILD + 0.5), sel: '#wild', test: r => (r && r.l >= CARD.x0 && r.r <= CARD.x1 ? null : 'WILDER leaves the card: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'REAL OR AI? slams over the photo, him at the lens'], [REAL1, 'the REAL button'], [AI1, 'the AI button, AI? kicks'], [ONE, 'one second, the squint'],
      [TICK, 'the countdown, the ring drains'], [REV, 'REAL stamped green, the flash, the zoom starts'], [NASA, 'NASA JUNO MISSION'], [JUP, 'jupiter, a punch, he glances'],
      [L3.at, 'line 3'], [WILD, 'WILDER slams, the nod'], [FL.at, 'THE BORING TEK']],
  },
});
