/* the boring tek — post65. AI got a phone. manus 2.0 shipped cue on
   2026-09-28, an app where each agent gets its own email, phone number,
   wallet and computer (manus.im/blog/introducing-manus-2-0). a very short
   explainer, about 10 seconds.

   **the look, after two colour rounds** (hot magenta, then off white paper,
   both Einz's no): deep black with a very soft vignette and no dot grid, huge
   white kinetic words that slam, stretch and stack, white line icons, all
   with the house deep glow, the mascot big in the middle with the dark clips'
   white glow. green is the active caption word, the answer button, the AI and
   PHONE kicks and the one full screen flash.

   **real graphics, ignored in demo/assets/, never pushed:** the manus logo
   from the official brand kit (manus.im/brand), the white logo straight on
   the black exactly as it ships, and the cue launch image from the official launch post. the
   clip stops if either is missing rather than drawing a stand in.

   1080x1920. three lines on the elevenlabs narrator, eleven_v4, three takes a
   line checked with speech to text, every take sped up 1.16 with atempo, pitch
   kept. karaoke captions drawn by the gag at 73.5%, post64's band. the end:
   the rig's `flash` held 1.5s as THE BORING TEK card, and the clip ends on
   it. **an exception to the loop rule, Einz's call:** no run back into
   frame 0, no glitch out of the card.

     frame 0  a huge ringing phone beside him, AI GOT A PHONE mid slam
     l1       manus now gives ...   the logo card whips in on manus, the phone
                                    docks beside him on phone number
     l2       their own email ...   envelope, wallet, laptop pop around him,
                                    EMAIL, WALLET, COMPUTER slam and stack, the
                                    cue image slides in behind him
     the planned silence, everything clears
     l3       so the next call ...  an incoming call screen slides up, caller
                                    AI, it rings, he squints at the lens, a
                                    green flash on AI
     THE BORING TEK, one glitch in, a 1.5s card, the end

     node post65.mjs --takes              read the lines, print the words, stop
     node post65.mjs --stills             one still per beat, no render, no sound
     DEMO_FPS=12 node post65.mjs          the preview
     node post65.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, wordIn,
  CURVE, CURVE56, hitPulse, peakAt, FPS, EASE,
} from './lib/aiafter.mjs';
import { SR, VOICES, GAINS, decode } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[excited] Manus now gives AI agents their own phone number.', tempo: TEMPO, take: 3 },
  { key: 'r2', text: '[cheerful] their own email, wallet and computer.', tempo: TEMPO },
  { key: 'r3', text: '[amused] so the next call you get... might be an AI.', tempo: TEMPO, take: 2 },
];
const TAKES = await readLines(65, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2, L3] = TAKES;

if (process.argv.includes('--takes')) {
  for (const T of TAKES) {
    place(T, 0);
    console.log('\n' + T.name + '  ' + T.all.join(' | '));
    console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
  }
  process.exit(0);
}

/* ---------- the real graphics, or nothing ----------
   both from manus's own pages, see the header. a clip that cannot find them
   stops: a drawn stand in for somebody's logo is the thing not to ship */
const ASSET = f => path.join(HERE, 'assets', f);
for (const f of ['manus-logo-white.svg', 'cue-launch.webp']) if (!fs.existsSync(ASSET(f))) { console.error('\nSTOPPED. demo/assets/' + f + ' is missing, see the header for where it comes from.'); process.exit(1); }
const LOGO = 'data:image/svg+xml;base64,' + fs.readFileSync(ASSET('manus-logo-white.svg')).toString('base64');
const CUE = 'data:image/webp;base64,' + fs.readFileSync(ASSET('cue-launch.webp')).toString('base64');

/* ---------- the clock: all off the read ---------- */
const GAP1 = 0.25, HUSH = 0.25;
place(L1, 0);
place(L1, 0.2 - L1.W[0].start);
place(L2, L1.end + GAP1);
place(L3, L2.end + HUSH);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const MANUS = w(L1, 'manus'), AIW = w(L1, 'ai'), PHONE = w(L1, 'phone');
const EMAIL = w(L2, 'email'), WALLET = w(L2, 'wallet'), COMP = w(L2, 'computer');
const CALL = w(L3, 'call'), MIGHT = w(L3, 'might'), AI3 = w(L3, 'ai');
const SLAM0 = -0.12;
/* the planned silence: everything clears, and the call slides up with the laugh */
const CLEAR = f3(L2.end + 0.02), CALLUP = f3(L3.at + 0.02);
/* THE BORING TEK held 1.5s, and the clip ends on it.
   **a named exception to the loop rule (retention rule 11), Einz's call:**
   no run back into frame 0 after the card, and no glitch out of it. the
   burst into the card is the one glitch, its sound on exactly its frames */
const FL = { at: f3(L3.end + 0.05), for: 1.5, card: true, out: false };
const END = f3(FL.at + FL.for);
const U = t => t;

/* ---------- the layout, css px of the 540x960 stage ---------- */
/* the dark look, Einz's second colour round: deep black, white type and icons
   with the house deep glow, him with the dark clips' white glow. green is the
   active caption word, the answer button, the flash and the AI and PHONE kicks */
const BLACK = '#050506', GREEN = '#3dff6e', WHITE = '#ffffff', INK = '#0d0d12';
/* the deep glow: the end card's own, on words and as a drop shadow on line icons */
const GLOW_TXT = '0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10)';
const GLOW_ICON = 'drop-shadow(0 0 5px rgba(255,255,255,.45)) drop-shadow(0 0 16px rgba(255,255,255,.22))';
/* captions at 73.5%, post64's band */
const CAP_Y = 706;
/* 70% of the 1.55 he had, Einz's call, same place */
const MAS = { cx: 270, cy: 510, size: 134, scale: 1.085 };
const WORD_W = 400, ROW_W = 300, WMKW = 'THE BORING TEK';
/* the hook phone, huge beside him through line 1. its box never turns, the
   drawing inside it does, so the margin guard measures the box it sits in */
const HOOKP = { x: 158, y: 500, size: 168 }, HOOKDX = 84;
/* where row 0's handset lands, roughly, for the phone to fly into */
const ROW0 = { x: 100, y: 128 };
const LOGOC = { x: 270, y: 350, w: 220, h: 72 };
const CUEC = { x: 270, y: 505, w: 400, h: 225 };
const CALLC = { x: 270, top: 200, w: 320, h: 560 }, ANS_Y = 606;
/* his size and drop in each part: big, smaller over the cue card, the caller photo */
const SIZE = { l2: 0.875, l2dy: 46, call: 0.91, calldy: -40 };

/* ---------- the icons, white line, 24 grid ---------- */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const HANDSET = 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';
const ART = {
  phone: `<path d="${HANDSET}"/>`,
  email: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  wallet: '<path d="M5 6.5l10.5-3.5 1.4 3.5"/><rect x="2.5" y="6.5" width="19" height="13" rx="2.5"/><path d="M21.5 10.5h-4.5a2 2 0 0 0 0 4h4.5"/><path d="M17 12.5h.01"/>',
  computer: '<rect x="4.5" y="4.5" width="15" height="10.5" rx="1.5"/><path d="M2 18.5h20"/>',
};
const svgOf = (k, extra = '', id = '') => `<svg ${id ? 'id="' + id + '" ' : ''}viewBox="-2 -2 28 28" ${STROKE}>${ART[k]}${extra}</svg>`;
const RINGARCS = '<g id="phr"><path d="M15.05 5A5 5 0 0 1 19 8.95"/><path d="M15.05 1A9 9 0 0 1 23 8.94"/></g>';

/* ---------- the big words ----------
   AI GOT A PHONE, every line fitted to the width. then the list: an icon and
   a word a row, the phone flying into row 0 on their own, then email, wallet,
   computer, every word fitted to the same width so the rows step down */
const W1 = { lines: ['AI GOT', 'A PHONE'], top: 98 };
const LIST = [['phone', 'PHONE'], ['email', 'EMAIL'], ['wallet', 'WALLET'], ['computer', 'COMPUTER']];
const LIST_TOP = 90;
const ROWS = [f3(L2.at + 0.06), EMAIL, WALLET, COMP];

/* ---------- the captions: one to three words a page, the read's own times ---------- */
const PAGES_TXT = [
  [0, 'manus now gives'], [0, 'AI agents'], [0, 'their own'], [0, 'phone number'],
  [1, 'their own email'], [1, 'wallet and'], [1, 'computer'],
  [2, 'so the next'], [2, 'call you get'], [2, 'might be'], [2, 'an AI'],
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
  return out;
})();
const backOut = q => 1 + 2.70158 * (q - 1) ** 3 + 1.70158 * (q - 1) ** 2;

/* ---------- the camera: scale about a focus, keyframed, the whole frame ----------
   push and punch stay inside 6%, the house cap */
const CAMK = [
  { at: SLAM0, d: 0.4, s: 1.0, fx: 270, fy: 360, c: CURVE.out },
  { at: MANUS, d: 0.9, s: 1.025, fx: 270, fy: 360, c: CURVE.dolly },
  { at: AIW, d: 0.16, s: 1.05, fx: 270, fy: 220, c: CURVE.cam },
  { at: PHONE - 0.06, d: 0.3, s: 1.0, fx: 270, fy: 480, c: CURVE.cam },
  { at: L2.at, d: EMAIL - L2.at, s: 1.02, fx: 270, fy: 420, c: CURVE.dolly },
  { at: EMAIL, d: 0.14, s: 1.04, fx: 270, fy: 300, c: CURVE.cam },
  { at: WALLET, d: 0.14, s: 1.0, fx: 270, fy: 480, c: CURVE.cam },
  { at: COMP, d: 0.14, s: 1.055, fx: 270, fy: 330, c: CURVE.cam },
  { at: CLEAR, d: CALLUP - CLEAR, s: 1.0, fx: 270, fy: 480, c: CURVE.out },
  { at: CALL, d: 0.14, s: 1.05, fx: 270, fy: ANS_Y, c: CURVE.cam },
  { at: MIGHT, d: 0.2, s: 1.0, fx: 270, fy: 470, c: CURVE.cam },
  { at: AI3, d: 0.12, s: 1.06, fx: 270, fy: 300, c: CURVE.cam },
];
function camera(t) {
  const u = U(t);
  let s = 1.06, tx = 270 * (1 - 1.06), ty = 360 * (1 - 1.06);
  for (const k of CAMK) {
    if (u < k.at) break;
    const q = k.c(span(u, k.at, k.at + k.d));
    s = lerp(s, k.s, q); tx = lerp(tx, k.fx * (1 - k.s), q); ty = lerp(ty, k.fy * (1 - k.s), q);
  }
  /* the flash kicks */
  const k = u >= AI3 && u < AI3 + 0.35 ? Math.exp(-(u - AI3) / 0.08) : 0;
  tx += 7 * k * Math.sin((u - AI3) * 90); ty += 5 * k * Math.cos((u - AI3) * 70);
  /* live: the margin guard measures the layout with the camera off, and holds it to 6% */
  return { s: f3(s), tx: f2(tx), ty: f2(ty), live: true };
}

/* the frames that are a move, not a layout: the margin guard skips them */
const MOVES = [[-0.4, 0.2], [MANUS - 0.06, MANUS + 0.35], [PHONE - 0.05, PHONE + 0.4], [L2.at - 0.1, L2.at + 0.45],
  ...ROWS.map(a => [a, a + 0.3]), [CLEAR, CALLUP + 0.5], [AI3 - 0.02, AI3 + 0.35]];
const moving = u => MOVES.some(([a, b]) => u >= a && u < b);

/* the ring: bursts of shake, the hook's from the pre roll to line 2, the
   call's from the slide to the flash */
const RINGS = [[-0.3, L2.at - 0.05], [CALLUP + 0.12, AI3]];
function ringAt(u) {
  for (const [a, b] of RINGS) if (u >= a && u < b) {
    const env = smooth(span(u, a, a + 0.08)) * (1 - smooth(span(u, b - 0.1, b)));
    /* two short bursts a second, a breath between */
    const ph = ((u - a) % 0.5) / 0.5, burst = ph < 0.62 ? Math.sin(Math.PI * ph / 0.62) : 0;
    return { on: env * burst, wob: Math.sin((u - a) * 2 * Math.PI * 14) };
  }
  return { on: 0, wob: 0 };
}

/* ---------- him: big in the middle ---------- */
function face(t) {
  const u = U(t);
  let dy = 2.2 * Math.sin(2 * Math.PI * u / 2.2), dx = 0, rot = 0, lid = 0.04, arc = 0, look = null;
  /* the hook: stood to the right of the ringing phone, eyes on it, then over
     to the middle as it flies into the list */
  const mid = CURVE.out(span(u, L2.at - 0.05, L2.at + 0.3));
  dx += HOOKDX * (1 - mid);
  if (u < MANUS + 0.15) look = { x: HOOKP.x, y: HOOKP.y, w: 1 - smooth(span(u, MANUS - 0.05, MANUS + 0.15)) };
  /* a little hop on every pop, happy for 0.45s on AI agents */
  for (const a of [PHONE, ...ROWS]) dy -= 10 * Math.sin(Math.PI * span(u, a, a + 0.28));
  arc = bump(u, AIW + 0.05, 0.06, 0.33, 0.06);
  /* smaller over the cue card in line 2, then sat up in the call as its caller photo */
  const k2 = mid * (1 - CURVE.out(span(u, CLEAR, CLEAR + 0.25)));
  const kc = CURVE.out(span(u, CALLUP, CALLUP + 0.45));
  const s = MAS.scale + (SIZE.l2 - MAS.scale) * k2 + (SIZE.call - MAS.scale) * kc;
  dy += SIZE.l2dy * k2 + SIZE.calldy * kc;
  /* the squint at the lens, from might to the card */
  const sq = smooth(span(u, MIGHT, MIGHT + 0.12)) * (u < FL.at ? 1 : 0);
  /* dash eyes hide a lid, so the squint is the eyes squashed, post64's way */
  lid = Math.max(lid, 0.45 * sq); rot += 8 * sq;
  const esy = 1 - 0.45 * sq;
  dy -= 10 * Math.sin(Math.PI * span(u, AI3, AI3 + 0.26));
  return { lid: f3(lid), arc: f3(arc), ...(look ? { look } : {}), dx: f2(dx), dy: f2(dy), rot: f2(rot), sq: 0, s: f3(s), esy: f3(esy) };
}

/* ---------- a frame of the story ---------- */
const hidden = { o: 0, s: 1, y: 0, blur: 0 };
function frame(t) {
  const u = U(t), S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };
  const clear = CURVE56.in(span(u, CLEAR, CLEAR + 0.2));
  const R = ringAt(u);

  S.push(['wmk', 'opacity', f3(1 - smooth(span(u, AIW - 0.1, AIW + 0.1)))]);

  /* the colour hits in the hook words: AI goes green and kicks on AI agents,
     PHONE on phone number and stays green into line 2 */
  S.push(['w1a', 'color', u >= AIW && u < AIW + 0.5 ? GREEN : WHITE],
    ['w1a', 'transform', 'scale(' + f3(1 + 0.22 * hitPulse(u - AIW, 0.03, 0.16)) + ')'],
    ['w1p', 'color', u >= PHONE ? GREEN : WHITE],
    ['w1p', 'transform', 'scale(' + f3(1 + 0.1 * hitPulse(u - PHONE, 0.03, 0.16)) + ')']);

  /* AI GOT A PHONE: slams in, stretches tall on phone, whips up and out for line 2 */
  {
    const a = wordIn(u, SLAM0, 'slam'), o = CURVE56.in(span(u, L2.at - 0.04, L2.at + 0.12));
    const st = Math.sin(Math.PI * span(u, PHONE, PHONE + 0.32));
    const sx = a.s * (1 + 0.03 * st), sy = a.s * (1 + 0.16 * st);
    put('w1', a.o * (1 - o), 'translateY(' + f2(-160 * o) + 'px) scale(' + f3(sx) + ',' + f3(sy) + ')', Math.max(a.blur, 14 * o));
  }
  /* the list: on each word its icon pops and its word slams, the rows above
     jolt, the whole list stretches tall on computer, then zooms through */
  ROWS.forEach((at, i) => {
    const a = u < at ? hidden : wordIn(u, at, 'slam'), p = u < at ? hidden : wordIn(u, at, 'spring');
    let jolt = 0;
    for (let j = i + 1; j < ROWS.length; j++) jolt += 5 * hitPulse(u - ROWS[j], 0.02, 0.1);
    put('rw' + i, a.o, 'translateY(' + f2(-jolt) + 'px) scale(' + f3(a.s) + ')', a.blur);
    const rot = (i % 2 ? -1 : 1) * 16 * (1 - CURVE.out(span(u, at, at + 0.35)));
    put('ri' + i, p.o, 'translateY(' + f2(-jolt) + 'px) rotate(' + f2(rot) + 'deg) scale(' + f3(p.s) + ')');
  });
  {
    const st = Math.sin(Math.PI * span(u, COMP + 0.08, COMP + 0.4));
    put('lst', 1 - clear, 'scale(' + f3((1 + 0.25 * clear) * (1 + 0.03 * st)) + ',' + f3((1 + 0.25 * clear) * (1 + 0.14 * st)) + ')', 12 * clear);
  }

  /* the phone: huge and ringing from frame 0, a punch on phone number, then it
     flies up into row 0 as the list starts and hands over to row 0's icon */
  {
    const pin = u < -0.3 ? hidden : wordIn(u, -0.3, 'spring');
    const fly = CURVE56.whip(span(u, L2.at - 0.08, ROWS[0] + 0.04));
    const x = lerp(HOOKP.x, ROW0.x, fly) - HOOKP.x, y = lerp(HOOKP.y, ROW0.y, fly) - HOOKP.y;
    const s = pin.s * lerp(1, 0.32, fly) * (1 + 0.16 * hitPulse(u - PHONE, 0.03, 0.14));
    put('ph', pin.o * (1 - smooth(span(u, ROWS[0], ROWS[0] + 0.06))), 'translate(' + f2(x) + 'px,' + f2(y) + 'px) scale(' + f3(s) + ')');
    S.push(['phs', 'transform', 'rotate(' + f2(-10 + 10 * fly + 11 * R.on * R.wob) + 'deg)']);
    S.push(['phr', 'opacity', f3(0.25 + 0.75 * R.on)]);
  }

  /* the manus card whips in on manus, settles over him, whips out right for line 2 */
  {
    const k = CURVE.out(span(u, MANUS - 0.06, MANUS + 0.3)), o = CURVE56.in(span(u, L2.at - 0.08, L2.at + 0.14));
    const x = 420 * (1 - backOut(k)) + 460 * o;
    put('logo', u < MANUS - 0.06 ? 0 : 1 - o, 'translateX(' + f2(x) + 'px) rotate(' + f2(-3 - 6 * (1 - k) + 4 * o) + 'deg)');
  }
  /* the cue image slides in behind him at the top of line 2 */
  {
    const k = CURVE.out(span(u, L2.at, L2.at + 0.38));
    const x = -520 * (1 - backOut(k));
    put('cue', u < L2.at ? 0 : 1 - clear, 'translateX(' + f2(x) + 'px) rotate(' + f2(-4 + 3 * (1 - k)) + 'deg) scale(' + f3(1 + 0.25 * clear) + ')');
  }

  /* the incoming call slides up, rings, and AI punches on the flash */
  {
    const k = span(u, CALLUP, CALLUP + 0.42);
    const y = 820 * (1 - backOut(CURVE.out(k)));
    const shake = 2.2 * R.on * R.wob * (u > CALLUP ? 1 : 0);
    put('call', u < CALLUP || u >= FL.at ? 0 : 1, 'translateY(' + f2(y) + 'px) rotate(' + f2(shake) + 'deg)');
    S.push(['cname', 'transform', 'scale(' + f3(1 + 0.18 * hitPulse(u - AI3, 0.03, 0.18)) + ')']);
    const pp = (((u - CALLUP) % 0.9) + 0.9) % 0.9 / 0.9;
    S.push(['pulse', 'transform', 'scale(' + f3(1 + 0.9 * pp) + ')'], ['pulse', 'opacity', f3(u > CALLUP + 0.3 ? 0.7 * (1 - pp) : 0)]);
    S.push(['ans', 'transform', 'scale(' + f3(1 + 0.06 * R.on) + ')']);
  }

  /* the payoff flash: two green frames on AI, straight back */
  S.push(['flash', 'opacity', u >= AI3 && u < AI3 + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

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
const box = (c, w, h, z) => `position:absolute;left:${f2(c.x - w / 2)}px;top:${f2(c.y - h / 2)}px;width:${w}px;height:${h}px;z-index:${z}`;
const css = `
:root,html[data-theme=dark]{--bg:${BLACK}}
html,body,.stage{background:${BLACK} !important}
/* only a very soft dark vignette, no dot grid */
.vignette{display:block;position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 85% 70% at 50% 46%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%)}
/* his white glow, the dark clips' own radii in css px at his 1.55 scale */
.m-glow-mid{filter:blur(${f2(11 / MAS.scale)}px)}
.m-glow-wide{filter:blur(${f2(30 / MAS.scale)}px)}
#wmk{position:absolute;left:60px;right:60px;top:66px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:${WHITE};text-shadow:${GLOW_TXT};z-index:5}
.big{position:absolute;left:${f2(270 - WORD_W / 2)}px;width:${WORD_W}px;display:flex;flex-direction:column;align-items:center;opacity:0;z-index:5;transform-origin:50% 40%;will-change:transform,opacity,filter}
.big span,.row b{display:block;width:max-content;font-family:var(--display);font-weight:400;line-height:1;letter-spacing:.02em;color:${WHITE};white-space:nowrap;-webkit-text-stroke:2px ${WHITE};text-shadow:${GLOW_TXT};will-change:transform,opacity,filter}
.big span+span{margin-top:10px}
#w1 em{display:inline-block;font-style:normal;-webkit-text-stroke-color:currentColor;transform-origin:50% 60%}
#w1p{transform-origin:12% 60%}
#lst{opacity:1}
.row{display:flex;align-items:center;gap:14px;width:max-content}
.row+.row{margin-top:12px}
.row b,.row i{opacity:0}
.row i{display:block;color:${WHITE};will-change:transform,opacity}
.row i svg{width:100%;height:100%;display:block;overflow:visible;filter:${GLOW_ICON};stroke-width:2.6}
#ph{color:${WHITE};will-change:transform,opacity;opacity:0}
#ph svg{width:100%;height:100%;display:block;overflow:visible;filter:${GLOW_ICON}}
#logo{${box(LOGOC, LOGOC.w, LOGOC.h, 7)};display:flex;align-items:center;justify-content:center;opacity:0;will-change:transform,opacity}
#logo img{height:52px;width:auto;display:block}
#cue{${box(CUEC, CUEC.w, CUEC.h, 2)};border:5px solid ${WHITE};border-radius:18px;overflow:hidden;background:#000;opacity:0;will-change:transform,opacity}
#cue img{width:100%;height:100%;object-fit:cover;display:block}
#call{position:absolute;left:${CALLC.x - CALLC.w / 2}px;top:${CALLC.top}px;width:${CALLC.w}px;height:${CALLC.h}px;z-index:2;background:${INK};border-radius:48px;border:2px solid ${WHITE};box-shadow:0 0 12px rgba(255,255,255,.4),0 0 34px rgba(255,255,255,.16);box-sizing:border-box;opacity:0;will-change:transform,opacity}
#call .lbl{position:absolute;left:0;right:0;top:34px;text-align:center;font:500 17px/1 var(--read);letter-spacing:.08em;color:#c9c9d3}
#cname{position:absolute;left:0;right:0;top:62px;text-align:center;font:400 66px/1 var(--display);color:${WHITE};-webkit-text-stroke:2px ${WHITE}}
#ans{position:absolute;left:50%;top:${ANS_Y - CALLC.top - 38}px;width:76px;height:76px;margin-left:-38px;border-radius:50%;background:${GREEN};color:${INK};display:flex;align-items:center;justify-content:center}
#ans svg{width:40px;height:40px}
#pulse{position:absolute;left:50%;top:${ANS_Y - CALLC.top - 38}px;width:76px;height:76px;margin-left:-38px;border-radius:50%;border:4px solid ${GREEN};box-sizing:border-box;opacity:0}
#flash{position:absolute;inset:0;background:${GREEN};opacity:0;z-index:20}
#cap{position:absolute;left:60px;right:60px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;z-index:9;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 34px/1 var(--read);color:${WHITE};white-space:nowrap}
`;
const capHtml = '<b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b>';
const markup = `
<div id="wmk">${WMKW}</div>
<div class="big" id="w1" style="top:${W1.top}px"><span><em id="w1a">AI</em> GOT</span><span>A <em id="w1p">PHONE</em></span></div>
<div class="big" id="lst" style="top:${LIST_TOP}px">${LIST.map(([k, l], i) => '<div class="row"><i id="ri' + i + '">' + svgOf(k) + '</i><b id="rw' + i + '">' + l + '</b></div>').join('')}</div>
<div id="cue"><img src="${CUE}" alt=""></div>
<div id="call"><div class="lbl">incoming call</div><div id="cname">AI</div><div id="pulse"></div><div id="ans"><svg viewBox="-2 -2 28 28" ${STROKE.replace('stroke-width="2"', 'stroke-width="2.4"')}><path d="${HANDSET}"/></svg></div></div>
<div id="logo"><img src="${LOGO}" alt=""></div>
<div id="ph" style="${box(HOOKP, HOOKP.size, HOOKP.size, 7)}">${svgOf('phone', RINGARCS, 'phs')}</div>`;
const overlay = `<div id="flash"></div><div id="cap">${capHtml}</div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  /* every line its own size, fitted to the width, and each list icon as tall
     as its word. measured on the first frame, when the rig has the fonts loaded */
  let fitted = false;
  const size = (el, w) => {
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * w / el.getBoundingClientRect().width).toFixed(2) + 'px';
  };
  const fit = () => {
    for (const sp of $('w1').querySelectorAll('span')) size(sp, D.w);
    for (const row of $('lst').querySelectorAll('.row')) {
      const b = row.querySelector('b'), i = row.querySelector('i');
      size(b, D.rw);
      const h = (parseFloat(b.style.fontSize) * 1.18).toFixed(2) + 'px';
      i.style.width = h; i.style.height = h;
    }
  };
  window.__gag = {
    apply(o) {
      if (!fitted) { fit(); fitted = true; }
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
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
   every effect a real recorded mixkit sound, Einz's call, no elevenlabs
   effects in this clip. mixkit has no real phone vibration, so the ring
   carries the phone alone. a light upbeat bed from elevenmusic, ducked under
   the words, out for the planned silence and back with the call */
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
const onGrid = (t, len) => { const n = Math.max(1, Math.round(len * FPS)); return { t0: Math.round(t * FPS) / FPS, n, secs: n / FPS }; };
/* the rig's own grid for the burst into the card: the sound starts on its
   first glitch frame and lasts exactly its frames, at any frame rate */
const GA = onGrid(FL.at - 0.05, 3 / 60);
const SILENCE = [f3(L2.end), f3(L3.at)];
async function sound() {
  const { elevenMusic } = await import('./lib/elevenmusic.mjs');
  const ffmpeg = (await import('ffmpeg-static')).default;
  /* the dropchad method: real recorded mixkit effects, mixkit's own preview
     mp3s, each one's hit measured as its loudest 10ms and placed on the
     moment. ignored in demo/assets/sfx-mixkit/, sources in its LICENSES.md */
  const MK = path.join(HERE, 'assets', 'sfx-mixkit');
  /* [file, peak dB, run up]: each file is trimmed to its first sound, and to
     at most its run up before the hit, so a cue lands on its sound rather
     than on the silence mixkit leaves at the head of a file */
  const FX = {
    ring: ['mixkit-1350-office-telephone-ring.mp3', -15, 9],
    swooshwhoosh: ['mixkit-3115-fast-transitions-swoosh.mp3', -17, 0.1],
    thud: ['mixkit-2150-impact-of-a-blow.mp3', -11, 0.02],
    arrowwhoosh: ['mixkit-1491-arrow-whoosh.mp3', -18, 0.08],
    fastwhoosh: ['mixkit-1490-fast-whoosh-transition.mp3', -18, 0.3],
    popHard: ['mixkit-2364-hard-pop-click.mp3', -13, 0.01],
    popDry: ['mixkit-2356-dry-pop-up-notification-alert.mp3', -13, 0.01],
    popLight: ['mixkit-3005-explainer-video-pops-whoosh-light-pop.mp3', -13, 0.01],
    basshit: ['mixkit-2299-short-bass-hit.mp3', -10, 0.02],
    mkGlitch: ['mixkit-2951-digital-glitch-break.mp3', -15, 9],
  };
  const PEAK = {};
  for (const [k, [file, gain, runUp]] of Object.entries(FX)) {
    if (!fs.existsSync(path.join(MK, file))) { console.error('\nSTOPPED. demo/assets/sfx-mixkit/' + file + ' is missing, see its LICENSES.md for the source.'); process.exit(1); }
    const raw = Float32Array.from(decode(ffmpeg, path.join(MK, file)));
    let pk = 0; for (const v of raw) pk = Math.max(pk, Math.abs(v));
    if (pk > 0) for (let i = 0; i < raw.length; i++) raw[i] /= pk;
    const W = Math.round(0.01 * SR); let best = 0, at = 0;
    for (let i = 0; i + W < raw.length; i += W) { let e = 0; for (let j = i; j < i + W; j++) e += raw[j] * raw[j]; if (e > best) { best = e; at = i; } }
    let onset = 0; while (onset < raw.length && Math.abs(raw[onset]) < 0.03) onset++;
    const a = Math.max(onset, Math.min(at, at - Math.round(runUp * SR)));
    const b = Float32Array.from(raw.subarray(a));
    const fi = Math.round(0.004 * SR); for (let i = 0; i < fi && i < b.length; i++) b[i] *= i / fi;
    PEAK[k] = Math.max(0, at - a) / SR;
    VOICES[k] = () => b; GAINS[k] = gain;
    console.log('  ' + k + ' ' + file + ', hit at ' + PEAK[k].toFixed(3) + 's');
  }
  VOICES.elGlitch = VOICES.mkGlitch;
  const GR = (() => {
    const src = VOICES.elGlitch(), fl = Math.round(SR / 60), lv = [];
    for (let a = 0; a + fl < src.length; a += Math.round(fl / 2)) { let e = 0; for (let i = a; i < a + fl; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
    lv.sort((x, y) => y.e - x.e);
    const one = lv[0], two = lv.find(x => Math.abs(x.off - one.off) > 0.05) || lv[1];
    return [one.off, two.off];
  })();
  const stutter = (off, secs, seed) => {
    const fl = Math.round(SR / 60), n = Math.max(1, Math.round(secs * 60)), src = VOICES.elGlitch(), g = Math.round(fl * 0.8), out = new Float32Array(Math.round(secs * SR)), at = Math.round(off * SR);
    for (let k = 0; k < n; k++) for (let i = 0; i < g && k * fl + i < out.length; i++) out[k * fl + i] = src[Math.min(src.length - 1, at + i + (k % 2) * seed)] * Math.min(1, i / 48, (g - i) / 48) * (1 - 0.12 * k);
    return out;
  };
  VOICES.stutA = () => stutter(GR[0], GA.secs, 0); GAINS.stutA = -13;
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  /* the rings start on their first sample, everything else lands its hit */
  const CUES = [
    { t: 0, kind: 'ring', from: 'frame 0, the phone rings' },
    on(0.02, 'thud', 'frame 0, AI GOT A PHONE lands'),
    on(peakAt(MANUS - 0.06, MANUS + 0.3, CURVE.out), 'arrowwhoosh', 'the manus logo whips in'),
    on(peakAt(L2.at, L2.at + 0.38, CURVE.out), 'fastwhoosh', 'the phone flies into the list, the cue card slides in'),
    on(ROWS[0] + 0.02, 'popHard', 'PHONE, row 0'),
    on(EMAIL + 0.02, 'popDry', 'EMAIL and the envelope'),
    on(WALLET + 0.02, 'popLight', 'WALLET and the wallet'),
    on(COMP - 0.02, 'swooshwhoosh', 'COMPUTER slams in'),
    on(COMP + 0.02, 'thud', 'COMPUTER lands'),
    { t: f3(CALLUP + 0.12), kind: 'ring', from: 'the call slides up and rings' },
    on(AI3, 'basshit', 'the flash on AI'),
    { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark, on its frames' },
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  for (const c of CUES) if (c.t > SILENCE[0] + 0.01 && c.t < SILENCE[1] - 0.05) throw new Error('an effect in the planned silence: ' + c.from);
  const BED = await elevenMusic('post65', { prompt: 'light upbeat bouncy pop background bed, plucky synth and soft claps, bright and happy, sparse, steady, 122 bpm, no vocals, no heavy bass, no drops', seconds: f3(FL.at + 1.7), tries: 3 });
  console.log('  music ' + BED.all.join(' | '));
  const b = highPass(BED.pcm, 110);
  const g = t => 1 - smooth(span(t, SILENCE[0] - 0.05, SILENCE[0] + 0.08)) * (1 - smooth(span(t, SILENCE[1] - 0.02, SILENCE[1] + 0.2)));
  for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
  return { sfx: { cues: CUES, level: -9, duck: 0.6 }, music: { pcm: b, level: -27, duck: 0.6, under: -14, fx: 6 } };
}

const STILLS = [0, 0.3, f3(MANUS + 0.35), f3(AIW + 0.2), f3(PHONE + 0.3), f3(L2.at + 0.3), f3(EMAIL + 0.25), f3(WALLET + 0.25), f3(COMP + 0.3),
  f3(CLEAR + 0.12), f3(CALLUP + 0.3), f3(CALL + 0.2), f3(MIGHT + 0.2), f3(AI3 + 0.01), f3(AI3 + 0.3), f3(FL.at + 0.3), f3(END - 1 / 60)];
const STILLS_RUN = process.argv.includes('--stills');
const BEATS = [MANUS, AIW, PHONE, L2.at, EMAIL, WALLET, COMP, CLEAR, CALLUP, MIGHT, AI3, FL.at];

console.log('  lines ' + [L1, L2, L3].map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', flash ' + FL.at + ', end ' + END);
console.log('  call up at ' + CALLUP + 's, ' + Math.round(100 * CALLUP / END) + '%, AI at ' + AI3 + 's, ' + Math.round(100 * AI3 / END) + '% of the runtime');
const sfx = STILLS_RUN ? null : await sound();

await runEpisode({
  post: 65, ep: 0, series: false, title: [],
  cut: END, flash: FL,
  mascot: MAS,
  voice: [L1, L2, L3], subs: [],
  tp: -1,
  maxGap: 0.8,
  ...(sfx ? { sfx: sfx.sfx, music: sfx.music } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, overlay, page, frame, face, camera,
    data: { pages: PAGES.map(P => P.words.map(q => q.txt)), w: WORD_W, rw: ROW_W },
    sleep: [],
    beats: BEATS,
    checks: ['#w1', '#lst', '#cap b', '#wmk', '#logo', '#cue', '#call', '#ph'],
    hook: ['#w1', '#ph', '#wmk'],
    copy: [...W1.lines, ...LIST.map(r => r[1]), 'incoming call', 'AI', WMKW, ...PAGES.map(P => P.txt)],
    verify: [
      ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && r.t > 680 && r.b < 735 ? null : 'the caption "' + P.txt + '" leaves its band: ' + JSON.stringify(r)) })),
      { at: 0.3, sel: '#w1', test: r => (r && r.t >= 60 && r.b < 310 ? null : 'AI GOT A PHONE reaches the card or the margin: ' + JSON.stringify(r)) },
      { at: f3(COMP + 0.5), sel: '#lst', test: r => (r && r.t >= 60 && r.b < 384 ? null : 'the list reaches the cue card or the margin: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'AI GOT A PHONE, the phone rings, him looking at it'], [MANUS, 'the manus card'], [AIW, 'AI agents, happy'], [PHONE, 'PHONE stretches, the phone punches'],
      [L2.at, 'the phone flies into the list, the cue card slides in'], [EMAIL, 'EMAIL, envelope'], [WALLET, 'WALLET, wallet'], [COMP, 'COMPUTER, laptop, the stretch'], [CLEAR, 'the planned silence, everything clears'],
      [CALLUP, 'the incoming call slides up'], [MIGHT, 'the squint at the lens'], [AI3, 'AI, the green flash']],
  },
});
