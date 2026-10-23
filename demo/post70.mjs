/* the boring tek — post70. how much water does one AI answer drink? clip 1
   of the 14 day plan: the mascot answers one crazy question about AI or tech,
   15 to 25 seconds, our own animation, real facts.

   the facts, read at the sources 2026-10-23:
   - UC Riverside, Li, Yang, Islam, Ren, "Making AI Less Thirsty", arXiv
     2304.03271. v5, 26 Mar 2025: GPT-3 needs a 500ml bottle of water for
     roughly 10 to 50 medium length responses, depending on when and where
     it is deployed, on site cooling plus the water behind the electricity. v1,
     6 Apr 2023, said 20 to 50 questions and answers for ChatGPT.
   - Google Cloud blog, 21 Aug 2025: the median Gemini Apps text prompt
     "consumes 0.26 milliliters (or about five drops) of water".
   - Sam Altman, The Gentle Singularity, June 2025: the average ChatGPT query
     "uses about 0.000085 gallons of water; roughly one fifteenth of a
     teaspoon".

   **the look:** post65's deep black with the very soft vignette, white line
   drawing and Michroma numbers with the house deep glow, him with the dark
   clips' white glow, leaning on the glass. **the second colour is water
   blue,** the water, the drops and the gulps, nothing else. green is the
   active caption word and the one full screen flash on five drops.

   **the energy, huashu-motion's rhythm rules:** a hook inside the first
   second, a climb in steps, the burst at about a third (six cuts on the
   words of line 3, the glass filling a gulp a cut, hard 0.25s eases), the
   planned stop, then the payoff as a slow 1.6s glide down to five drops,
   the slow move set against the hard ones. no music, Einz's default for
   these: the clip gets its music on the platforms.

   1080x1920, the TikTok safe zone held by the rig's guard on every frame.
   eight lines in **his own voice**, the host slot, MASCOT_VOICE_ID, eleven_v4,
   three takes a line heard back, sped up 1.28, the pauses inside a line
   tightened to 0.3s by the full screen template's `tighten`. karaoke
   captions at 64%. the planned stop is 0.5s. the house ending: one glitch into THE BORING TEK, its
   sound on exactly its frames, the card 1.5s, the end.

     frame 0  the glass half full mid punch in, a drop falling, him leaning on it
     l1       every answer ...     the drop lands, a second one on drinks
     l2       scientists at ...    the glass empties, 500 ML, the count 10 to 50
     l3       ask a few ...        the burst: six cuts, a bubble and a gulp each
     l4       then Google ...      the full glass, a slow push, his squint
     the planned stop, 0.5s
     l5       five drops ...       0.26 ML slams, the green flash, the slow
                                   drain to five drops counted at the bottom
     l6       OpenAI boss ...      a whip to the teaspoon, 1/15 TSP
     l7       different ...        three tags slam on the three differents
     l8       so how many ...      the glass whips back, a ? drop, punch on him
     THE BORING TEK, one glitch in, a 1.5s card, the end

     node post70.mjs --takes              read the lines, print the words, stop
     node post70.mjs --stills             one still per beat, no render, no sound
     DEMO_FPS=12 node post70.mjs          the preview
     node post70.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, wordIn,
  CURVE, CURVE56, hitPulse, peakAt, FPS,
} from './lib/aiafter.mjs';
import { tighten } from './lib/fullscreen.mjs';
import { SR, VOICES, GAINS, decode } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/* ---------- the read: him, in his own voice ---------- */
const MODEL = { model: 'eleven_v4', voice: 'host', hear: true };
/* 1.28 over the house 1.16, so the eight approved lines fit the plan's 25s with the house 0.25s gap between lines */
const TEMPO = 1.28;
const LINES = [
  { key: 'r1', text: '[cheeky] every answer AI gives you, it drinks.', tempo: TEMPO },
  { key: 'r2', text: 'scientists at UC Riverside said one bottle of water for every ten to fifty answers.', tempo: TEMPO },
  { key: 'r3', text: 'ask a few questions, and your glass is gone.', tempo: TEMPO },
  { key: 'r4', text: '[smug] then Google measured its own.', tempo: TEMPO },
  { key: 'r5', text: '[smug] five drops. per prompt.', tempo: TEMPO },
  { key: 'r6', text: 'OpenAI boss Sam Altman says one fifteenth of a teaspoon.', tempo: TEMPO },
  { key: 'r7', text: '[deadpan] different models, different years, different math.', tempo: TEMPO },
  { key: 'r8', text: '[cheeky] so how many questions did you ask AI today?', tempo: TEMPO },
];
const TAKES = await readLines(70, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });

if (process.argv.includes('--takes')) {
  for (const T of TAKES) {
    place(T, 0);
    console.log('\n' + T.name + '  ' + T.all.join(' | '));
    console.log('  heard: ' + T.heard);
    console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
  }
  process.exit(0);
}
/* eleven_v4 holds about 0.7s on every comma and stop: 0.25s kept, the
   breath after a comma cut too */
for (const T of TAKES) {
  const cut = tighten(T, 0.25, { comma: -18 });
  if (cut) console.log('  line ' + (T.i + 1) + ' tightened by ' + cut.toFixed(2) + 's');
}
const [L1, L2, L3, L4, L5, L6, L7, L8] = TAKES;

/* ---------- the clock: all off the read ---------- */
const GAP = 0.25, STOP = 0.5;
place(L1, 0);
place(L1, 0.2 - L1.W[0].start);
place(L2, L1.end + GAP);
place(L3, L2.end + GAP);
place(L4, L3.end + GAP);
place(L5, L4.end + STOP);
place(L6, L5.end + GAP);
place(L7, L6.end + GAP);
place(L8, L7.end + GAP);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const nth = (T, x, n) => { let k = -1; for (let i = 0; i <= n; i++) k = T.W.findIndex((q, j) => j > k && letters(q.word) === x); return f3(T.W[k].start - 0.04); };
const DRINKS = w(L1, 'drinks'), ANSW1 = w(L1, 'answer'), GIVES = w(L1, 'gives');
const MEAS = w(L4, 'measured');
const BOTTLE = w(L2, 'bottle'), TEN = w(L2, 'ten'), FIFTY = w(L2, 'fifty'), ANSWERS = w(L2, 'answers');
/* the burst: a cut on each of six words of line 3 */
const CUTS = ['ask', 'few', 'questions', 'and', 'glass', 'gone'].map(x => w(L3, x));
const FIVE = w(L5, 'five'), PROMPT = w(L5, 'prompt');
const SAM = w(L6, 'sam'), FIFT = w(L6, 'fifteenth'), BOSS = w(L6, 'boss');
const DIFF = [0, 1, 2].map(n => nth(L7, 'different', n));
const ASK8 = w(L8, 'ask'), TODAY = w(L8, 'today'), QUEST8 = w(L8, 'questions');
const SLAM0 = -0.12;
/* the glass leaves on the whip to the spoon and comes back for line 8 */
const WHIP1 = f3(L6.at - 0.02), SPOON_OUT = f3(L7.at - 0.02), WHIP2 = f3(L8.at - 0.02);
/* THE BORING TEK held 1.5s, and the clip ends on it, the house ending */
const FL = { at: f3(L8.end + 0.05), for: 1.5, card: true, out: false };
const END = f3(FL.at + FL.for);
const U = t => t;

/* ---------- the layout, css px of the 540x960 stage ---------- */
const BLACK = '#050506', GREEN = '#3dff6e', WHITE = '#ffffff', WATER = '#36c8ff', INK = '#0d0d12';
const GLOW_TXT = '0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10)';
const GLOW_ICON = 'drop-shadow(0 0 5px rgba(255,255,255,.45)) drop-shadow(0 0 16px rgba(255,255,255,.22))';
const GLOW_WATER = 'drop-shadow(0 0 6px rgba(54,200,255,.45))';
/* the TikTok safe zone in css px: 140 / 200 / 220 / 420 of 1080x1920, halved */
const SAFE = { l: 70, t: 110, r: 440, b: 750 };
/* captions at 64%, inside rule 8's 60 to 65 */
const CAP_Y = 614;
/* him, leaning on the glass's right side */
const MAS = { cx: 364, cy: 508, size: 134, scale: 1.0 };
/* the big word band at the top of the safe zone, a small tag under it */
const BIG_Y = 134, BIG_W = 300, TAG_Y = 226, ROW_W = 330, WMKW = 'THE BORING TEK';
/* the glass: a tapered tumbler, open at the top */
const G = { cx: 194, top: 268, h: 312, wt: 236, wb: 176 };
const GI = { top: G.top + 14, bot: G.top + G.h - 9, ht: G.wt / 2 - 7, hb: G.wb / 2 - 7 };
const halfAt = y => lerp(GI.ht, GI.hb, (y - GI.top) / (GI.bot - GI.top));
/* where the burst's bubbles pop, inside the safe zone under every cut's framing */
const BUB = [[132, 172], [330, 192], [168, 218], [316, 150], [222, 180], [352, 226]];
/* each cut's framing of the glass world: an offset, a scale and a tilt */
const FRAMING = [[0, 1.0, -1], [0, 0.96, 1], [0, 0.99, -1], [0, 0.97, 1], [0, 1.0, -1], [0, 1, 0]];
const SPOON = { cx: 210, bowl: 330, rx: 58, ry: 80, tip: 566 };
const ROWS = ['2023 GPT 3', '2025 GEMINI', '2025 CHATGPT'], ROW_TOP = 262, ROW_STEP = 62;

/* ---------- the water ---------- */
/* the drops: [from x, from y, land time, size]. the frame 0 drop is mid fall,
   the second lands on drinks, the ? drop on line 8 */
const FALL = 0.36;
const SLAND = f3(FIFT + 0.02), SDROP = { y0: 150, y1: SPOON.bowl + SPOON.ry - 18, r: 10 };
const DROP_A = { x: G.cx - 8, y0: 168, land: 0.3, r: 13 };
const HB = { x: G.cx + 4, y: 176 };
const DROP_B = { x: HB.x, y0: HB.y + 26, land: f3(DRINKS + 0.02), r: 10, fall: f3(DRINKS + 0.02 - GIVES) };
const QLAND = f3(TODAY + 0.05);
const DROP_Q = { x: G.cx, y0: 168, land: QLAND, r: 15, fall: QLAND - QUEST8 };
/* each gulp flies from its bubble to the glass in 0.14s, landing 0.13 after its cut */
const GULP = CUTS.map((c, i) => ({ x0: BUB[i][0], y0: BUB[i][1] + 18, at: c + 0.0, land: f3(c + 0.13) }));
/* the five drops left at the bottom, popping in one by one at the end of the drain */
const DRAIN = [f3(FIVE + 0.05), f3(FIVE + 1.65)];
const FIVE_AT = [0, 1, 2, 3, 4].map(i => f3(DRAIN[1] - 0.7 + i * 0.16));
function level(u) {
  if (u < L2.at - 0.02) {
    let v = 0.5;
    for (const d of [DROP_A, DROP_B]) v += 0.05 * CURVE.out(span(u, d.land, d.land + 0.25));
    return v;
  }
  /* the bottle: full on bottle, held through the count, empty on the burst's first cut */
  if (u < CUTS[0]) return lerp(0.5 * CURVE.dolly(span(u, L2.at + 0.05, BOTTLE)), 0.96, CURVE.out(span(u, BOTTLE, BOTTLE + 0.3)));
  if (u < FIVE) {
    let v = 0;
    for (const g of GULP) v += (0.96 / 6) * CURVE.out(span(u, g.land, g.land + 0.25));
    return v;
  }
  return 0.96 * (1 - CURVE.dolly(span(u, DRAIN[0], DRAIN[1])));
}
const surfaceY = L => GI.bot - L * (GI.bot - GI.top - 10);
/* the ripple: every landing kicks the surface, and it settles */
const HITS = [DROP_A.land, DROP_B.land, BOTTLE + 0.3, ...GULP.map(g => g.land), QLAND];
/* the landings that throw droplets: [time, x] */
const SPLASH = [[DROP_A.land, DROP_A.x], [DROP_B.land, DROP_B.x], ...GULP.map(g => [g.land, G.cx]), [QLAND, DROP_Q.x]];
const SPRAY = [[-150, 330], [-70, 420], [80, 400], [160, 310]];
function ripple(u) {
  let a = 0;
  for (const h of HITS) if (u >= h) a += 7 * Math.exp(-(u - h) / 0.32);
  a += 2.5 * Math.sin(Math.PI * span(u, DRAIN[0], DRAIN[1]));
  return Math.min(a, 9);
}
function waterPath(u) {
  const L = level(u);
  if (L < 0.004) return '';
  const ys = surfaceY(L), A = ripple(u), ph = u * 11;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const k = i / 16, hw = halfAt(ys), x = G.cx - hw + 2 * hw * k;
    pts.push(f2(x) + ',' + f2(ys + A * Math.sin(k * Math.PI * 3 + ph) * Math.sin(Math.PI * k)));
  }
  return 'M' + pts.join(' L') + ' L' + f2(G.cx + GI.hb) + ',' + GI.bot + ' L' + f2(G.cx - GI.hb) + ',' + GI.bot + ' Z';
}
const dropAt = (d, u) => {
  const fall = d.fall || FALL, q = span(u, d.land - fall, d.land), ys = surfaceY(level(d.land - 0.01));
  return { on: u >= d.land - fall && u < d.land, x: d.x, y: lerp(d.y0, ys - d.r, q * q) };
};
const TEAR = 'M0,-1.7 C0.55,-0.75 1,-0.2 1,0.35 A1,1 0 0 1 -1,0.35 C-1,-0.2 -0.55,-0.75 0,-1.7 Z';

/* ---------- the captions: one to three words a page, the read's own times ---------- */
const PAGES_TXT = [
  [0, 'every answer'], [0, 'AI gives you'], [0, 'it drinks'],
  [1, 'scientists at'], [1, 'uc riverside'], [1, 'said one bottle'], [1, 'of water'], [1, 'for every'], [1, 'ten to fifty'], [1, 'answers'],
  [2, 'ask a few'], [2, 'questions'], [2, 'and your glass'], [2, 'is gone'],
  [3, 'then google'], [3, 'measured its own'],
  [4, 'five drops'], [4, 'per prompt'],
  [5, 'openai boss'], [5, 'sam altman says'], [5, 'one fifteenth'], [5, 'of a teaspoon'],
  [6, 'different models'], [6, 'different years'], [6, 'different math'],
  [7, 'so how many'], [7, 'questions did you'], [7, 'ask AI today'],
];
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

/* ---------- the camera: scale about a focus, keyframed, inside the house 6% ---------- */
const GF = { x: G.cx, y: 420 };
const CAMK = [
  { at: L1.at, d: L1.end - L1.at, s: 1.03, fx: GF.x, fy: GF.y, c: CURVE.dolly },
  { at: L2.at - 0.02, d: 0.12, s: 1.0, fx: GF.x, fy: GF.y, c: CURVE.cam },
  { at: BOTTLE, d: 0.14, s: 1.05, fx: 255, fy: 400, c: CURVE.cam },
  { at: TEN, d: 0.2, s: 1.0, fx: 255, fy: 400, c: CURVE.cam },
  { at: ANSWERS, d: CUTS[0] - ANSWERS, s: 1.02, fx: 255, fy: 300, c: CURVE.dolly },
  { at: CUTS[0], d: 0.1, s: 1.0, fx: GF.x, fy: GF.y, c: CURVE.cam },
  /* the slow push on the full glass, through line 4 and the stop */
  { at: L4.at, d: FIVE - L4.at, s: 1.045, fx: GF.x, fy: GF.y, c: CURVE.dolly },
  { at: FIVE, d: 0.12, s: 1.06, fx: 255, fy: 410, c: CURVE.cam },
  { at: FIVE + 0.4, d: 1.2, s: 1.0, fx: GF.x, fy: GF.y, c: CURVE56.pull },
  { at: FIFT, d: 0.14, s: 1.04, fx: 255, fy: 400, c: CURVE.cam },
  { at: L7.at, d: 0.14, s: 1.0, fx: 255, fy: 360, c: CURVE.cam },
  ...DIFF.map((d, i) => ({ at: d, d: 0.12, s: [1.03, 1.01, 1.045][i], fx: 255, fy: ROW_TOP + 20 + i * ROW_STEP, c: CURVE.cam })),
  { at: L8.at, d: 0.2, s: 1.0, fx: 300, fy: 420, c: CURVE.cam },
  { at: ASK8, d: 0.14, s: 1.06, fx: MAS.cx, fy: MAS.cy, c: CURVE.cam },
];
function camera(t) {
  const u = U(t);
  let s = 1.0, tx = 0, ty = 0;
  for (const k of CAMK) {
    if (u < k.at) break;
    const q = k.c(span(u, k.at, k.at + k.d));
    s = lerp(s, k.s, q); tx = lerp(tx, k.fx * (1 - k.s), q); ty = lerp(ty, k.fy * (1 - k.s), q);
  }
  /* the payoff kick */
  const k = u >= FIVE && u < FIVE + 0.35 ? Math.exp(-(u - FIVE) / 0.08) : 0;
  tx += 7 * k * Math.sin((u - FIVE) * 90); ty += 5 * k * Math.cos((u - FIVE) * 70);
  return { s: f3(s), tx: f2(tx), ty: f2(ty), live: true };
}

/* the frames that are a move, not a layout: the margin guard skips them */
const MOVES = [[-0.4, 0.4], [L2.at - 0.05, L2.at + 0.3], ...CUTS.map(c => [c - 0.02, c + 0.32]),
  [FIVE - 0.02, FIVE + 0.4], [WHIP1 - 0.02, WHIP1 + 0.42], [SPOON_OUT - 0.02, SPOON_OUT + 0.35],
  ...DIFF.map(d => [d, d + 0.3]), [WHIP2 - 0.02, WHIP2 + 0.45]];
const moving = u => MOVES.some(([a, b]) => u >= a && u < b);

/* ---------- him: leaning on the glass ---------- */
function face(t) {
  const u = U(t);
  let dy = 1.6 * Math.sin(2 * Math.PI * u / 2.2), rot = 0, lid = 0.04, arc = 0, look = null, esy = 1;
  /* eyes on the drops in the hook, then on the lens */
  const lk = 1 - smooth(span(u, DRINKS + 0.1, DRINKS + 0.3));
  if (lk > 0) look = { x: G.cx, y: surfaceY(level(u)), w: lk };
  /* eyes up to the bubbles through the burst */
  const lb = bump(u, CUTS[0], 0.08, CUTS[5] - CUTS[0] + 0.1, 0.12);
  if (lb > 0) look = { x: 230, y: 180, w: lb };
  /* a hop on every slam */
  for (const a of [BOTTLE, FIVE, FIFT, ...DIFF]) dy -= 7 * Math.sin(Math.PI * span(u, a, a + 0.26));
  /* the squint at the lens, smug, from line 4 through the stop and the payoff */
  const sq = smooth(span(u, L4.at + 0.1, L4.at + 0.24)) * (1 - smooth(span(u, FIVE + 0.5, FIVE + 0.7)));
  lid = Math.max(lid, 0.45 * sq); rot += 7 * sq; esy = 1 - 0.45 * sq;
  /* a glance down at the five drops as they pop */
  const gd = bump(u, FIVE_AT[0], 0.1, FIVE_AT[4] - FIVE_AT[0] + 0.2, 0.15);
  if (gd > 0) look = { x: G.cx, y: GI.bot - 6, w: gd };
  /* happy at the lens on today, under 0.6s */
  arc = Math.max(arc, bump(u, TODAY + 0.05, 0.06, 0.4, 0.08));
  dy -= 8 * Math.sin(Math.PI * span(u, TODAY, TODAY + 0.3));
  const s = MAS.scale * (1 + 0.08 * CURVE.out(span(u, ASK8, ASK8 + 0.3)));
  return { lid: f3(lid), arc: f3(arc), ...(look ? { look } : {}), dx: 0, dy: f2(dy), rot: f2(rot), sq: 0, s: f3(s), esy: f3(esy) };
}

/* ---------- a frame of the story ---------- */
const hidden = { o: 0, s: 1, y: 0, blur: 0 };
function frame(t) {
  const u = U(t), S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };

  S.push(['wmk', 'opacity', f3(1 - smooth(span(u, DRINKS - 0.1, DRINKS + 0.1)))]);

  /* the glass world: the hook punch, the burst's framings, the whips */
  {
    const p = 1 + 0.25 * (1 - CURVE.out(span(u, SLAM0, SLAM0 + 0.45)));
    let ox = 0, s = p, r = 0;
    for (let i = 0; i < CUTS.length; i++) if (u >= CUTS[i] && u < FIVE) [ox, s, r] = FRAMING[i];
    /* a jolt on each cut, so a cut reads as a cut */
    for (const c of CUTS) s *= 1 + 0.035 * hitPulse(u - c, 0.02, 0.09);
    /* out left on the whip to the spoon, back in from the left for line 8 */
    ox += -470 * CURVE56.whip(span(u, WHIP1, WHIP1 + 0.32)) + 470 * CURVE56.whip(span(u, WHIP2, WHIP2 + 0.34));
    /* back for line 8 a little smaller, so the gap holds while he grows on ask */
    if (u >= WHIP2) s *= 0.95;
    /* off while parked left, between the two whips */
    put('world', u >= WHIP1 + 0.32 && u < WHIP2 ? 0 : 1, 'translateX(' + f2(ox) + 'px) rotate(' + f2(r) + 'deg) scale(' + f3(s) + ')');
  }
  S.push(['water', '@d', waterPath(u)]);
  /* the falling drops */
  [['da', DROP_A], ['db', DROP_B], ['dq', DROP_Q]].forEach(([id, d]) => {
    const p = dropAt(d, u);
    S.push([id, 'opacity', p.on ? 1 : 0], [id, '@transform', 'translate(' + f2(p.x) + ' ' + f2(p.y) + ') scale(' + d.r + ')']);
  });
  S.push(['qm', 'opacity', dropAt(DROP_Q, u).on ? 1 : 0], ['qm', '@transform', 'translate(' + f2(DROP_Q.x) + ' ' + f2(dropAt(DROP_Q, u).y + 5) + ')']);
  /* the gulps, from each bubble to the glass */
  GULP.forEach((g, i) => {
    const q = span(u, g.at, g.land), on = u >= g.at && u < g.land;
    const ys = surfaceY(level(g.land - 0.01));
    const x = lerp(g.x0, G.cx, q), y = lerp(g.y0, ys - 12, q) - 40 * Math.sin(Math.PI * q);
    S.push(['gu' + i, 'opacity', on ? 1 : 0], ['gu' + i, '@transform', 'translate(' + f2(x) + ' ' + f2(y) + ') scale(13)']);
  });
  /* the droplets thrown by each landing, up and out and gone in 0.4s */
  SPLASH.forEach(([at, x], i) => {
    const ys = surfaceY(level(at + 0.05)), q = u - at;
    SPRAY.forEach(([vx, vy], k) => {
      const on = q >= 0 && q < 0.4;
      S.push(['sp' + i + '_' + k, 'opacity', on ? f3(1 - smooth(span(q, 0.2, 0.4))) : 0],
        ['sp' + i + '_' + k, '@transform', 'translate(' + f2(x + vx * Math.max(0, q)) + ' ' + f2(ys - vy * Math.max(0, q) + 1100 * Math.max(0, q) ** 2) + ') scale(3.4)']);
    });
  });
  /* the five drops left */
  FIVE_AT.forEach((a, i) => {
    const p = u < a ? hidden : wordIn(u, a, 'spring');
    S.push(['fv' + i, 'opacity', f3(u < FIVE ? 0 : p.o)], ['fv' + i, '@transform', 'translate(' + f2(G.cx - 64 + 32 * i) + ' ' + (GI.bot - 10) + ') scale(' + f3(9 * p.s) + ')']);
  });
  /* the answer bubble in the hook: pops on answer, out as the drop lands */
  {
    const p = u < ANSW1 ? hidden : wordIn(u, ANSW1, 'spring'), o = CURVE56.in(span(u, DRINKS, DRINKS + 0.12));
    put('hb', u < ANSW1 ? 0 : p.o * (1 - o), 'scale(' + f3(p.s * (1 - 0.4 * o)) + ')');
  }
  /* the measure on measured: ticks up the glass's left wall, bottom to top in 0.3s */
  for (let i = 0; i < 6; i++) {
    const a = MEAS + i * 0.05, k = CURVE.out(span(u, a, a + 0.12)), o = 1 - smooth(span(u, L4.end + 0.05, L4.end + 0.3));
    S.push(['mk' + i, 'opacity', f3(u < a ? 0 : k * o)], ['mk' + i, '@transform', 'translate(' + f2(G.cx - halfAt(GI.bot - 8 - i * 46) + 6) + ' ' + f2(GI.bot - 8 - i * 46) + ') scale(' + f3(k) + ' 1)']);
  }
  /* the bubbles pop on their cuts and snap out */
  BUB.forEach((b, i) => {
    const c = CUTS[i], p = u < c ? hidden : wordIn(u, c, 'spring'), o = CURVE56.in(span(u, c + 0.24, c + 0.34));
    put('cb' + i, u < c ? 0 : p.o * (1 - o), 'scale(' + f3(p.s * (1 - 0.4 * o)) + ')');
  });

  /* the big words and their tags */
  const slamOut = (id, at, out, mode = 'slam') => {
    const a = u < at ? hidden : wordIn(u, at, mode), o = CURVE56.in(span(u, out - 0.08, out + 0.06));
    put(id, u < at || u >= out + 0.06 ? 0 : a.o * (1 - o), 'translateY(' + f2(a.y - 30 * o) + 'px) scale(' + f3(a.s) + ')', Math.max(a.blur, 10 * o));
  };
  slamOut('b500', BOTTLE, TEN);
  slamOut('bcnt', TEN, CUTS[0]);
  slamOut('t23', L2.at + 0.05, TEN, 'rise');
  slamOut('tcnt', ANSWERS, CUTS[0], 'rise');
  slamOut('b026', FIVE, WHIP1);
  slamOut('tgem', f3(FIVE + 0.35), WHIP1, 'rise');
  slamOut('tsam', SAM, SPOON_OUT, 'rise');
  slamOut('b115', FIFT, SPOON_OUT, 'rise');
  /* the count, 10 to 50 between the two spoken numbers, a kick on fifty */
  X.push(['cnt', String(Math.round(lerp(10, 50, span(u, TEN + 0.05, FIFTY + 0.05))))]);
  S.push(['bcnt', 'color', u >= FIFTY + 0.04 && u < FIFTY + 0.5 ? GREEN : WHITE]);
  S.push(['b026', 'color', u >= FIVE && u < FIVE + 0.55 ? GREEN : WHITE]);
  /* the spoon whips in from the right, then up and out for the tags */
  {
    const k = CURVE56.whip(span(u, WHIP1, WHIP1 + 0.32)), o = CURVE56.in(span(u, SPOON_OUT, SPOON_OUT + 0.2));
    put('spoon', u < WHIP1 || u >= SPOON_OUT + 0.2 ? 0 : 1 - o, 'translate(' + f2(470 * (1 - k)) + 'px,' + f2(-90 * o) + 'px) rotate(' + f2(-8 * (1 - k) + 4 * Math.sin(Math.PI * span(u, WHIP1 + 0.3, WHIP1 + 1.2)) - 6 * Math.sin(Math.PI * span(u, BOSS, BOSS + 0.4)) + 5 * hitPulse(u - SLAND, 0.02, 0.12)) + 'deg)');
  }
  /* the drop into the spoon, from sam to fifteenth, and the 1/15 it leaves */
  {
    const q = span(u, SAM, SLAND), on = u >= SAM && u < SLAND;
    S.push(['sd', 'opacity', on ? 1 : 0], ['sd', '@transform', 'translate(' + SPOON.cx + ' ' + f2(lerp(SDROP.y0, SDROP.y1, q * q)) + ') scale(' + SDROP.r + ')']);
    const b = u < SLAND ? hidden : wordIn(u, SLAND, 'spring');
    S.push(['sbit', 'opacity', f3(b.o)], ['sbit', 'transform', 'scale(' + f3(b.s) + ')']);
  }
  /* the three tags slam on the three differents, and snap out on line 8 */
  ROWS.forEach((_, i) => {
    const a = u < DIFF[i] ? hidden : wordIn(u, DIFF[i], 'slam'), o = CURVE56.in(span(u, WHIP2, WHIP2 + 0.16));
    let jolt = 0;
    for (let j = i + 1; j < ROWS.length; j++) jolt += 5 * hitPulse(u - DIFF[j], 0.02, 0.1);
    put('rw' + i, u < DIFF[i] || u >= WHIP2 + 0.16 ? 0 : a.o * (1 - o), 'translate(' + f2(-300 * o) + 'px,' + f2(-jolt) + 'px) scale(' + f3(a.s) + ')', a.blur);
  });

  /* the payoff flash: two green frames on five, straight back */
  S.push(['flash', 'opacity', u >= FIVE && u < FIVE + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

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
const gx = [G.cx - G.wt / 2, G.cx - G.wb / 2, G.cx + G.wb / 2, G.cx + G.wt / 2];
const GLASS = `M${gx[0]},${G.top} L${gx[1]},${G.top + G.h} L${gx[2]},${G.top + G.h} L${gx[3]},${G.top}`;
const css = `
:root,html[data-theme=dark]{--bg:${BLACK}}
html,body,.stage{background:${BLACK} !important}
.vignette{display:block;position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 85% 70% at 50% 46%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%)}
.m-glow-mid{filter:blur(${f2(11 / MAS.scale)}px)}
.m-glow-wide{filter:blur(${f2(30 / MAS.scale)}px)}
#wmk{position:absolute;left:${SAFE.l}px;right:${540 - SAFE.r}px;top:${SAFE.t + 12}px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:${WHITE};text-shadow:${GLOW_TXT};z-index:5}
#world{position:absolute;inset:0;transform-origin:${GF.x}px ${GF.y}px;z-index:3;will-change:transform}
#world svg,#spoon svg{position:absolute;left:0;top:0;width:540px;height:960px;overflow:visible}
#glw{fill:none;stroke:${WHITE};stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round;filter:${GLOW_ICON}}
#glb{stroke:${WHITE};stroke-width:7;stroke-linecap:round;filter:${GLOW_ICON}}
#water{fill:rgba(54,200,255,.8);stroke:#c9f3ff;stroke-width:2;filter:${GLOW_WATER}}
.drop{fill:${WATER};filter:${GLOW_WATER}}
#qm{font:400 15px/1 var(--display);fill:${INK};text-anchor:middle}
.bub{position:absolute;width:92px;height:58px;margin:-29px 0 0 -46px;border:2.5px solid ${WHITE};border-radius:16px;box-sizing:border-box;box-shadow:0 0 10px rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;gap:7px;opacity:0;will-change:transform,opacity}
.bub i{display:block;width:9px;height:9px;border-radius:50%;background:${WHITE}}
.bub:after{content:'';position:absolute;left:14px;bottom:-9px;width:12px;height:12px;border-left:2.5px solid ${WHITE};border-bottom:2.5px solid ${WHITE};transform:skewY(-30deg);background:${BLACK}}
#spoon{position:absolute;inset:0;z-index:3;opacity:0;transform-origin:${SPOON.cx}px ${SPOON.bowl}px;will-change:transform,opacity}
#spoon .ln{fill:none;stroke:${WHITE};stroke-width:3.5;stroke-linecap:round;filter:${GLOW_ICON}}
.big{position:absolute;left:${255 - BIG_W / 2}px;width:${BIG_W}px;top:${BIG_Y}px;display:flex;justify-content:center;opacity:0;z-index:6;transform-origin:50% 50%;will-change:transform,opacity,filter}
.big span,.row b{display:block;width:max-content;font-family:var(--display);font-weight:400;line-height:1;letter-spacing:.02em;color:inherit;white-space:nowrap;-webkit-text-stroke:2px currentColor;text-shadow:${GLOW_TXT}}
.big,.row{color:${WHITE}}
.tag{position:absolute;left:${SAFE.l}px;right:${540 - SAFE.r}px;top:${TAG_Y}px;text-align:center;font:500 18px/1 var(--read);letter-spacing:.08em;color:#c9c9d3;opacity:0;z-index:6;will-change:transform,opacity,filter}
.row{position:absolute;left:${255 - ROW_W / 2}px;width:${ROW_W}px;display:flex;justify-content:center;opacity:0;z-index:6;transform-origin:50% 50%;will-change:transform,opacity,filter}
#flash{position:absolute;inset:0;background:${GREEN};opacity:0;z-index:20}
#cap{position:absolute;left:${SAFE.l}px;right:${540 - SAFE.r}px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;z-index:9;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 34px/1 var(--read);color:${WHITE};white-space:nowrap}
`;
const capHtml = '<b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b>';
const drop = id => `<path id="${id}" class="drop" d="${TEAR}" opacity="0"/>`;
const markup = `
<div id="wmk">${WMKW}</div>
<div id="world">
  <svg viewBox="0 0 540 960">
    <path id="water" d=""/>
    <path id="glw" d="${GLASS}"/>
    <path id="glb" d="M${gx[1] + 6},${G.top + G.h} L${gx[2] - 6},${G.top + G.h}"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path id="mk${i}" d="M0,0 L${i % 2 ? 18 : 30},0" style="stroke:#fff;stroke-width:3;stroke-linecap:round" opacity="0"/>`).join('')}
    ${drop('da')}${drop('db')}${drop('dq')}<text id="qm" opacity="0">?</text>
    ${GULP.map((_, i) => drop('gu' + i)).join('')}
    ${FIVE_AT.map((_, i) => `<circle id="fv${i}" class="drop" r="1" opacity="0"/>`).join('')}
    ${SPLASH.map((_, i) => SPRAY.map((__, k) => `<circle id="sp${i}_${k}" class="drop" r="1" opacity="0"/>`).join('')).join('')}
  </svg>
  <div class="bub" id="hb" style="left:${HB.x}px;top:${HB.y}px"><i></i><i></i><i></i></div>
  ${BUB.map(([x, y], i) => `<div class="bub" id="cb${i}" style="left:${x}px;top:${y}px"><i></i><i></i><i></i></div>`).join('')}
</div>
<div id="spoon"><svg viewBox="0 0 540 960">
  <ellipse class="ln" cx="${SPOON.cx}" cy="${SPOON.bowl}" rx="${SPOON.rx}" ry="${SPOON.ry}"/>
  <path class="ln" d="M${SPOON.cx},${SPOON.bowl + SPOON.ry} L${SPOON.cx},${SPOON.tip}" style="stroke-width:7"/>
  <ellipse id="sbit" class="drop" cx="${SPOON.cx}" cy="${SPOON.bowl + SPOON.ry - 14}" rx="16" ry="6" style="opacity:0;transform-box:fill-box;transform-origin:50% 50%"/>
  <path id="sd" class="drop" d="${TEAR}" opacity="0"/>
</svg></div>
<div class="big" id="b500"><span>500 ML</span></div>
<div class="big" id="bcnt"><span id="cnt">10</span></div>
<div class="big" id="b026"><span>0.26 ML</span></div>
<div class="big" id="b115"><span>1/15 TSP</span></div>
<div class="tag" id="t23">STUDY 2023, UC RIVERSIDE</div>
<div class="tag" id="tcnt">ANSWERS PER BOTTLE</div>
<div class="tag" id="tgem">MEDIAN GEMINI PROMPT</div>
<div class="tag" id="tsam">SAM ALTMAN, 2025</div>
${ROWS.map((r, i) => `<div class="row" id="rw${i}" style="top:${ROW_TOP + i * ROW_STEP}px"><b>${r}</b></div>`).join('')}`;
const overlay = `<div id="flash"></div><div id="cap">${capHtml}</div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  /* the big words fitted to the band, the rows to their width, measured on
     the first frame, when the rig has the fonts loaded. the count is fitted
     on its widest value so it never resizes while it ticks */
  let fitted = false;
  const size = (el, w) => {
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * w / el.getBoundingClientRect().width).toFixed(2) + 'px';
  };
  const fit = () => {
    for (const id of ['b500', 'b026', 'b115']) size($(id).querySelector('span'), D.bw);
    $('cnt').textContent = '50'; size($('cnt'), D.bw * 0.5); $('cnt').textContent = '10';
    /* the rows share one size, the widest one's fit */
    const rb = [...Array(D.rows)].map((_, i) => $('rw' + i).querySelector('b'));
    rb.forEach(b => size(b, D.rw));
    const fs = Math.min(...rb.map(b => parseFloat(b.style.fontSize))).toFixed(2) + 'px';
    rb.forEach(b => { b.style.fontSize = fs; });
  };
  window.__gag = {
    apply(o) {
      if (!fitted) { fit(); fitted = true; }
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k[0] === '@') $(id).setAttribute(k.slice(1), v);
        else if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, v] of o.X) {
        if (last[id + '$'] === v) continue;
        last[id + '$'] = v;
        if (id === 'cnt') { $('cnt').textContent = v; continue; }
        const ws = +v < 0 ? [] : D.pages[+v];
        for (let j = 0; j < 3; j++) { $('cw' + j).textContent = ws[j] || ''; $('cw' + j).style.display = ws[j] ? 'inline' : 'none'; }
      }
    },
  };
}

/* ---------- the sound ----------
   real recorded mixkit effects only, the water ones downloaded for this clip,
   no music. ignored in demo/assets/sfx-mixkit/, sources in its LICENSES.md */
const onGrid = (t, len) => { const n = Math.max(1, Math.round(len * FPS)); return { t0: Math.round(t * FPS) / FPS, n, secs: n / FPS }; };
const GA = onGrid(FL.at - 0.05, 3 / 60);
const SILENCE = [f3(L4.end), f3(L5.at)];
const POUR = [f3(CUTS[0]), f3(CUTS[5] + 0.45)];
const TICKS = [f3(TEN + 0.05), f3(FIFTY + 0.1)];
const POUR2 = [f3(L2.at + 0.05), f3(BOTTLE + 0.1)];
async function sound() {
  const ffmpeg = (await import('ffmpeg-static')).default;
  const MK = path.join(HERE, 'assets', 'sfx-mixkit');
  /* { file, gain, run, len, from }: each file trimmed to its first sound and to
     at most `run` before its loudest 10ms, so a cue lands on its hit. `from`
     instead starts at that second of the file, a bed of a sound rather than a
     hit; `len` cuts it to a length with a 60ms fade */
  const FX = {
    drip: { file: 'mixkit-1879-bathroom-sink-water-drip.mp3', gain: -13, run: 0.02, len: 0.35 },
    plop: { file: 'mixkit-1317-water-bubble.mp3', gain: -12, run: 0.02 },
    plop2: { file: 'mixkit-3000-liquid-bubble.mp3', gain: -13, run: 0.02, len: 0.45 },
    splash: { file: 'mixkit-3179-water-drop-splashes-in-cave.mp3', gain: -14, run: 0.02, len: 0.55 },
    pour: { file: 'mixkit-2826-pouring-water-in-a-glass.mp3', gain: -19, from: 1.0, len: POUR[1] - POUR[0] },
    pour2: { file: 'mixkit-2826-pouring-water-in-a-glass.mp3', gain: -25, from: 1.0, len: POUR2[1] - POUR2[0] },
    tick: { file: 'mixkit-1063-fast-wall-clock-ticking.mp3', gain: -19, from: 0, len: TICKS[1] - TICKS[0] },
    swooshwhoosh: { file: 'mixkit-3115-fast-transitions-swoosh.mp3', gain: -17, run: 0.1 },
    thud: { file: 'mixkit-2150-impact-of-a-blow.mp3', gain: -11, run: 0.02 },
    arrowwhoosh: { file: 'mixkit-1491-arrow-whoosh.mp3', gain: -18, run: 0.08 },
    fastwhoosh: { file: 'mixkit-1490-fast-whoosh-transition.mp3', gain: -18, run: 0.3 },
    lowwhoosh: { file: 'mixkit-1490-fast-whoosh-transition.mp3', gain: -23, run: 0.3 },
    popHard: { file: 'mixkit-2364-hard-pop-click.mp3', gain: -13, run: 0.01 },
    basshit: { file: 'mixkit-2299-short-bass-hit.mp3', gain: -10, run: 0.02 },
    mkGlitch: { file: 'mixkit-2951-digital-glitch-break.mp3', gain: -15, run: 9 },
  };
  const PEAK = {};
  for (const [k, x] of Object.entries(FX)) {
    if (!fs.existsSync(path.join(MK, x.file))) { console.error('\nSTOPPED. demo/assets/sfx-mixkit/' + x.file + ' is missing, see its LICENSES.md for the source.'); process.exit(1); }
    const raw = Float32Array.from(decode(ffmpeg, path.join(MK, x.file)));
    let pk = 0; for (const v of raw) pk = Math.max(pk, Math.abs(v));
    if (pk > 0) for (let i = 0; i < raw.length; i++) raw[i] /= pk;
    let a, hit = 0;
    if (x.from !== undefined) a = Math.round(x.from * SR);
    else {
      const W = Math.round(0.01 * SR); let best = 0, at = 0;
      for (let i = 0; i + W < raw.length; i += W) { let e = 0; for (let j = i; j < i + W; j++) e += raw[j] * raw[j]; if (e > best) { best = e; at = i; } }
      let onset = 0; while (onset < raw.length && Math.abs(raw[onset]) < 0.03) onset++;
      a = Math.max(onset, Math.min(at, at - Math.round(x.run * SR)));
      hit = Math.max(0, at - a) / SR;
    }
    const b = Float32Array.from(raw.subarray(a, x.len ? Math.min(raw.length, a + Math.round(x.len * SR)) : raw.length));
    const fi = Math.round(0.004 * SR); for (let i = 0; i < fi && i < b.length; i++) b[i] *= i / fi;
    if (x.len) { const fo = Math.round(0.06 * SR); for (let i = 0; i < fo && i < b.length; i++) b[b.length - 1 - i] *= i / fo; }
    PEAK[k] = hit;
    VOICES[k] = () => b; GAINS[k] = x.gain;
    console.log('  ' + k + ' ' + x.file + ', hit at ' + PEAK[k].toFixed(3) + 's');
  }
  VOICES.elGlitch = VOICES.mkGlitch;
  const GR = (() => {
    const src = VOICES.elGlitch(), fl = Math.round(SR / 60), lv = [];
    for (let a = 0; a + fl < src.length; a += Math.round(fl / 2)) { let e = 0; for (let i = a; i < a + fl; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
    lv.sort((x, y) => y.e - x.e);
    return [lv[0].off];
  })();
  const stutter = (off, secs) => {
    const fl = Math.round(SR / 60), n = Math.max(1, Math.round(secs * 60)), src = VOICES.elGlitch(), g = Math.round(fl * 0.8), out = new Float32Array(Math.round(secs * SR)), at = Math.round(off * SR);
    for (let k = 0; k < n; k++) for (let i = 0; i < g && k * fl + i < out.length; i++) out[k * fl + i] = src[Math.min(src.length - 1, at + i)] * Math.min(1, i / 48, (g - i) / 48) * (1 - 0.12 * k);
    return out;
  };
  VOICES.stutA = () => stutter(GR[0], GA.secs); GAINS.stutA = -13;
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  const CUES = [
    on(peakAt(SLAM0, SLAM0 + 0.45, CURVE.out), 'fastwhoosh', 'frame 0, the punch in'),
    on(DROP_A.land, 'drip', 'the frame 0 drop lands'),
    on(DROP_B.land, 'plop', 'the drop on drinks'),
    on(L2.at, 'swooshwhoosh', 'the cut, the glass empties'),
    { t: POUR2[0], kind: 'pour2', from: 'line 2, the slow fill' },
    on(BOTTLE + 0.02, 'thud', '500 ML slams'),
    { t: TICKS[0], kind: 'tick', from: 'the count 10 to 50' },
    on(ANSWERS + 0.02, 'popHard', 'ANSWERS PER BOTTLE'),
    on(ANSW1 + 0.02, 'popHard', 'the answer bubble'),
    { t: POUR[0], kind: 'pour', from: 'the burst, the glass filling' },
    ...GULP.map((g, i) => on(g.land, ['plop2', 'splash', 'plop', 'splash', 'plop2', 'splash'][i], 'the burst, gulp ' + (i + 1))),
    on(L4.at + 0.05, 'lowwhoosh', 'the slow push on the full glass'),
    on(MEAS, 'tick', 'the measure up the glass'),
    on(FIVE, 'thud', '0.26 ML slams'),
    on(FIVE, 'basshit', 'the green flash on five'),
    ...FIVE_AT.map((a, i) => on(a + 0.02, 'drip', 'the five drops, ' + (i + 1))),
    on(peakAt(WHIP1, WHIP1 + 0.32, CURVE56.whip), 'arrowwhoosh', 'the whip to the spoon'),
    on(SLAND, 'plop', 'the drop into the spoon, 1/15 TSP'),
    ...DIFF.map((d, i) => on(d + 0.02, 'thud', ROWS[i])),
    on(peakAt(WHIP2, WHIP2 + 0.34, CURVE56.whip), 'fastwhoosh', 'the glass whips back'),
    on(QLAND, 'plop', 'the ? drop lands'),
    { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark, on its frames' },
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  for (const c of CUES) if (c.t > SILENCE[0] + 0.01 && c.t < SILENCE[1] - 0.05) throw new Error('an effect in the planned silence: ' + c.from);
  return { sfx: { cues: CUES, level: -9, duck: 0.6 } };
}

const STILLS = [0, 0.3, f3(DRINKS + 0.1), f3(L2.at + 0.2), f3(BOTTLE + 0.3), f3(TEN + 0.3), f3(FIFTY + 0.3), f3(ANSWERS + 0.3),
  ...CUTS.map(c => f3(c + 0.16)), f3(L4.at + 0.6), f3(L5.at - 0.2), f3(FIVE + 0.01), f3(FIVE + 0.3), f3(FIVE + 1.1), f3(DRAIN[1] + 0.1),
  f3(WHIP1 + 0.2), f3(SAM + 0.2), f3(FIFT + 0.4), ...DIFF.map(d => f3(d + 0.25)), f3(WHIP2 + 0.2), f3(ASK8 + 0.25), f3(QLAND + 0.1), f3(TODAY + 0.25),
  f3(FL.at + 0.3), f3(END - 1 / 60)];
const STILLS_RUN = process.argv.includes('--stills');
const BEATS = [DRINKS, L2.at, BOTTLE, TEN, FIFTY, ANSWERS, ...CUTS, L4.at, FIVE, WHIP1, FIFT, ...DIFF, WHIP2, ASK8, TODAY, FL.at];

console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', flash ' + FL.at + ', end ' + END);
console.log('  burst ' + CUTS[0] + '..' + CUTS[5] + 's, ' + Math.round(100 * (CUTS[0] + CUTS[5]) / 2 / END) + '%, stop ' + SILENCE.join('..') + ', five at ' + FIVE + 's, ' + Math.round(100 * FIVE / END) + '% of the runtime');
if (END > 25) console.log('  OVER: ' + END + 's, the plan is 15 to 25');
const sfx = STILLS_RUN ? null : await sound();

await runEpisode({
  post: 70, ep: 0, series: false, title: [],
  cut: END, flash: FL,
  mascot: MAS,
  voice: TAKES, subs: [],
  safe: 'tiktok',
  tp: -1,
  maxGap: STOP + 0.1,
  ...(sfx ? { sfx: sfx.sfx } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, overlay, page, frame, face, camera,
    data: { pages: PAGES.map(P => P.words.map(q => q.txt)), bw: BIG_W, rw: ROW_W, rows: ROWS.length },
    sleep: [],
    beats: BEATS,
    checks: ['#glw', '#hb', '#spoon svg .ln', '#b500', '#bcnt', '#b026', '#b115', '#t23', '#tcnt', '#tgem', '#tsam', '#rw0', '#rw1', '#rw2', ...BUB.map((_, i) => '#cb' + i), '#cap b', '#wmk'],
    hook: ['#world', '#wmk'],
    copy: ['500 ML', '50', '0.26 ML', '1/15 TSP', 'STUDY 2023, UC RIVERSIDE', 'ANSWERS PER BOTTLE', 'MEDIAN GEMINI PROMPT', 'SAM ALTMAN, 2025', ...ROWS, '?', WMKW, ...PAGES.map(P => P.txt)],
    verify: [
      ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && Math.abs((r.t + r.b) / 2 - CAP_Y) < 6 ? null : 'the caption "' + P.txt + '" leaves 64% of the height: ' + JSON.stringify(r)) })),
      { at: f3(FIVE + 0.6), sel: '#b026', test: r => (r && r.b < TAG_Y - 2 ? null : '0.26 ML reaches its tag: ' + JSON.stringify(r)) },
      { at: f3(DIFF[2] + 0.5), sel: '#rw2', test: r => (r && r.b < MAS.cy - 64 ? null : 'the last tag reaches him: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'the glass mid punch in, a drop falling, him leaning'], [DRINKS, 'the drop on drinks'], [L2.at, 'the cut, the glass empties'], [BOTTLE, '500 ML'],
      [TEN, 'the count'], [ANSWERS, 'ANSWERS PER BOTTLE'], ...CUTS.map((c, i) => [c, 'burst cut ' + (i + 1)]), [L4.at, 'the slow push, the squint'], [SILENCE[0], 'the planned stop'],
      [FIVE, '0.26 ML, the flash, the drain'], [FIVE_AT[0], 'the five drops'], [WHIP1, 'the whip to the spoon'], [FIFT, '1/15 TSP'], ...DIFF.map((d, i) => [d, ROWS[i]]),
      [WHIP2, 'the glass back'], [ASK8, 'the punch on him'], [QLAND, 'the ? drop lands'], [FL.at, 'THE BORING TEK']],
  },
});
