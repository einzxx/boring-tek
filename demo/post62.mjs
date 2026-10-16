/* the boring tek — post62. the flying tesla, a news reaction clip. the first
   clip made with the retention rules in CLAUDE.md.

   dark, 1080x1920. four lines on the elevenlabs narrator, eleven_v4, three
   takes a line checked with speech to text, every take sped up 1.16 with
   atempo, pitch kept. karaoke captions drawn by the gag, one to three words a
   page. no end card: the rig's `flash` opt in, THE BORING TEK glitches in for
   0.4s after the last word, and the clip runs on into a pre roll of frame 0, so
   the last frame matches the first and it loops. no music bed, Einz adds it.

   the footage is Tesla's own livestream of the roadster at a spacex test site,
   demo/assets/roadster.mp4, ignored by git like every asset that is not ours.
   its sound is never read. five ranges are cut to 60fps jpegs in
   demo/out/post62-src, named by source frame, and shown one real frame at a
   time through post58's prepare and ready hooks. the 16:9 picture runs full
   width across the middle, a thin green edge top and bottom, our dot grid round
   it. TESLA LIVE stays visible as the source credit: every punch in keeps the
   bottom right corner of the frame inside the box.

     frame 0  the car driving at the truck, already moving, THIS IS NOT AI slamming,
              the small wordmark on top
     l1       elon musk ...        one shot, the run up into the flip, a punch in
                                   on fly, 0.7 from the takeoff, LIVE CROWD, the
                                   mascot squints, a punch in on AI
     l2       it drove ...         whip to the loop, UPSIDE DOWN; whip to the
                                   drop, FLIP; cut to the jets, LANDED; a red
                                   flash on jets, the payoff
     l3       nobody was inside .. freeze on the landed car, NO DRIVER, 1.2s on
                                   it snaps in onto the empty car, a nod
     l4       production ...       zoom through to the car on the track; cut on
                                   2028 to it leaving the loop; MAYBE, he looks
                                   at the lens
     the glitch flash, then the pre roll back into frame 0

     node post62.mjs --takes              read the lines, print the words, stop
     node post62.mjs --stills             one still per beat, no render, no sound
     DEMO_FPS=12 node post62.mjs          the preview
     node post62.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, wordIn,
  CURVE, CURVE56, hitPulse, peakAt, FPS,
} from './lib/aiafter.mjs';
import { SR, VOICES, GAINS } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[excited] elon musk just made a car fly. and he needed a crowd to prove it is not AI.', tempo: TEMPO, take: 3 },
  { key: 'r2', text: '[amused] it drove upside down, flipped in the air, and landed on air jets.', tempo: TEMPO, take: 2 },
  { key: 'r3', text: '[playful] nobody was inside. on purpose.', tempo: TEMPO, take: 2 },
  { key: 'r4', text: '[cheerful] production starts in twenty twenty eight. maybe.', tempo: TEMPO, take: 1 },
];
/* every take of every line transcribes word for word with faster-whisper
   base at 1.16, no tag read out. the shortest of each is pinned, for length */
const TAKES = await readLines(62, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2, L3, L4] = TAKES;
const GAP = 0.25;
place(L1, 0);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + GAP);
if (process.argv.includes('--takes')) {
  for (const T of TAKES) {
    console.log('\n' + T.name + '  ' + T.all.join(' | '));
    console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
  }
  process.exit(0);
}

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const FLY = w(L1, 'fly'), CROWD = w(L1, 'crowd'), NOTAI = w(L1, 'ai');
const DROVE = f3(L2.at - 0.03), UPSIDE = w(L2, 'upside'), FLIPPED = w(L2, 'flipped'), LANDED = w(L2, 'landed'), JETS = w(L2, 'jets');
const NOBODY = f3(L3.at - 0.04), INSIDE = w(L3, 'inside'), PURPOSE = w(L3, 'purpose');
/* the freeze holds about 1.2s, then snaps in onto the empty car */
const SNAP = f3(Math.min(w(L3, 'purpose'), L3.at - 0.04 + 1.2));
const PROD = f3(L4.at - 0.04), YEAR = w(L4, 'twenty'), MAYBE = w(L4, 'maybe');
const FL = { at: f3(L4.end + 0.1), for: 0.4 };
const TAIL = 0.3;
const END = f3(FL.at + FL.for + TAIL);
const SLAM0 = -0.12;
/* the tail is the pre roll of frame 0: the story at a negative time */
const U = t => (t >= END - TAIL - 1e-9 ? f3(t - END) : t);

/* ---------- the footage ---------- */
const SRC = path.join(HERE, 'out', 'post62-src');
const RANGES = [[0, 60], [78, 216], [786, 906], [948, 1107], [1575, 1914], [2172, 2280]];
for (const [a, b] of RANGES) for (const n of [a, b]) if (!fs.existsSync(path.join(SRC, 'f' + String(n).padStart(5, '0') + '.jpg'))) {
  console.error('\nSTOPPED. demo/out/post62-src is missing source frame ' + n + '. it is cut from demo/assets/roadster.mp4 at 60fps, see the header');
  process.exit(1);
}
const inRange = n => RANGES.some(([a, b]) => n >= a && n <= b);
const URI = new Map();
const uri = n => {
  if (!inRange(n)) throw new Error('source frame ' + n + ' was not cut');
  if (!URI.has(n)) URI.set(n, 'data:image/jpeg;base64,' + fs.readFileSync(path.join(SRC, 'f' + String(n).padStart(5, '0') + '.jpg')).toString('base64'));
  return URI.get(n);
};
const fr = s => Math.round(s * 60);
/* TESLA LIVE sits at about 0.86 to 0.99 across and 0.93 to 0.97 down. a punch
   about (ox, oy) keeps it in when the origin is far enough right and down */
const keepMark = (s, ox, oy) => (s <= 1 ? { ox, oy } : { ox: Math.max(ox, (s * 0.992 - 1) / (s - 1)), oy: Math.max(oy, (s * 0.975 - 1) / (s - 1)) });

/* the run up: it lands on 30.9 at the whip, slowed to 0.7 from the takeoff */
const RUN = (() => {
  const lift = 29.3, u1 = f3(DROVE - (30.9 - lift) / 0.7), s0 = Math.round((lift - u1) * 60) / 60;
  if (s0 - TAIL < 26.3) throw new Error('the run up would start before the drone shot does, at 26.25: ' + s0);
  return { lift, u1, s0 };
})();
const TAKEOFF = f3(28.6 - RUN.s0);
/* the shots: [from, src(u), focus], the last one that has begun is on */
const FLIP_SRC = process.env.P62_FLIP === 'air' ? 30.25 : 16.0;
const SHOTS = [
  /* line 1 is one continuous real moment, Einz's call: the drone shot from the
     car driving toward the truck to the flip, at normal speed, then 0.7 from the
     takeoff at 29.3 to 30.9 on the whip, each in between frame blended with the
     next so the slow motion does not step. no shot anywhere in the clip shows
     the same source frames twice: the drop starts at 15.8 so it ends before
     the jets shot begins at 16.95 */
  { at: -TAIL - 1, name: 'runup', src: u => (u < RUN.u1 ? RUN.s0 + u : RUN.lift + 0.7 * (u - RUN.u1)), f: [0.55, 0.45], slow: true },
  { at: DROVE, name: 'loop', src: u => 13.30 + (u - DROVE), f: [0.6, 0.35] },
  { at: FLIPPED, name: 'drop', src: u => FLIP_SRC - 0.2 + (u - FLIPPED), f: [0.6, 0.45] },
  { at: LANDED, name: 'jets', src: u => Math.min(18.45, 16.95 + (Math.min(u, NOBODY) - LANDED)), f: [0.55, 0.5] },
  { at: PROD, name: 'track', src: u => Math.min(0.95, 0.05 + 0.8 * (u - PROD)), f: [0.5, 0.6] },
  { at: YEAR, name: 'exit', src: u => Math.min(38.0, 36.25 + (u - YEAR)), f: [0.4, 0.6] },
];
/* the moves between them: two whips, one zoom through, hard cuts else */
const WHIPS = [DROVE, FLIPPED], ZOOM = PROD;
function shot(u) {
  let k = 0;
  while (k + 1 < SHOTS.length && u >= SHOTS[k + 1].at) k++;
  const S = SHOTS[k];
  /* the punch in, inside the box: a hold push or a hit, never past 1.2 */
  let s = 1;
  /* the run up has no cut, so its moves are the pattern interrupts: in close on
     the small car from frame 0, a hard pull out to the whole truck on fly, a
     snap in on crowd and again on AI */
  if (S.name === 'runup') s = lerp(1.40, 1.34, CURVE.dolly(span(u, -TAIL, FLY))) * lerp(1, 1 / 1.34, CURVE.cam(span(u, FLY, FLY + 0.2)))
    * lerp(1, 1.2, CURVE.cam(span(u, CROWD, CROWD + 0.18))) * lerp(1, 1.17, CURVE.cam(span(u, NOTAI, NOTAI + 0.18)));
  if (S.name === 'loop') s = 1.06;
  if (S.name === 'drop') s = 1.04;
  /* the freeze pushes slowly, then snaps in on purpose, onto the empty car */
  if (S.name === 'jets') s = (1 + 0.05 * hitPulse(u - JETS, 0.03, 0.12)) * lerp(1, 1.05, CURVE.dolly(span(u, NOBODY, SNAP))) * lerp(1, 1.2, CURVE.cam(span(u, SNAP, SNAP + 0.18)));
  if (S.name === 'track') s = lerp(1, 1.05, CURVE.dolly(span(u, PROD + 0.5, YEAR)));
  if (S.name === 'exit') s = lerp(1.04, 1.1, CURVE.dolly(span(u, YEAR, FL.at)));
  const o = keepMark(s, S.f[0], S.f[1]);
  /* the transitions move the picture inside its box */
  /* a whip carries both shots: the next one rides in beside the old, or the
     old one rides out beside the new, so the box is never half black */
  let x = 0, z = 1, wgt = 0, op = 1, n2 = null, x2 = 0;
  for (const a of WHIPS) {
    const j = SHOTS.findIndex(q => q.at === a);
    if (u >= a - 0.2 && u < a) { const q = span(u, a - 0.2, a); x = -540 * q * q * q; wgt = Math.sin(Math.PI / 2 * q) ** 2; n2 = fr(SHOTS[j].src(a)); x2 = 540; }
    if (u >= a && u < a + 0.22) { const q = span(u, a, a + 0.22); x = 540 * (1 - q) ** 3; wgt = Math.cos(Math.PI / 2 * q) ** 2; n2 = fr(SHOTS[j - 1].src(a)); x2 = -540; }
  }
  if (u >= ZOOM - 0.2 && u < ZOOM) { const e = CURVE.exit(span(u, ZOOM - 0.2, ZOOM)); z = 1 + 0.2 * e; wgt = e; }
  if (u >= ZOOM && u < ZOOM + 0.5) { z = 0.75 + 0.25 * CURVE.out(span(u, ZOOM, ZOOM + 0.5)); op = smooth(span(u, ZOOM, ZOOM + 0.08)); wgt = 1 - CURVE.out(span(u, ZOOM, ZOOM + 0.3)); }
  const frozen = S.name === 'jets' && u >= NOBODY;
  const p = S.src(u) * 60, n = S.slow ? Math.floor(p + 1e-6) : Math.round(p), bf = S.slow ? f3(p - n) : 0;
  return { k, name: S.name, n, bf, n2, x2, s: f3(s), ox: f3(o.ox * 100), oy: f3(o.oy * 100), x: f2(x), z: f3(z), wgt: f3(wgt), op: f3(op), frozen };
}

/* ---------- the captions: one to three words a page, the read's own times ---------- */
const PAGES_TXT = [
  [0, 'elon musk'], [0, 'just made'], [0, 'a car fly'], [0, 'and he needed'], [0, 'a crowd'], [0, 'to prove it'], [0, 'is not AI'],
  [1, 'it drove'], [1, 'upside down'], [1, 'flipped'], [1, 'in the air'], [1, 'and landed'], [1, 'on air jets'],
  [2, 'nobody'], [2, 'was inside'], [2, 'on purpose'],
  [3, 'production'], [3, 'starts in'], [3, '2028'], [3, 'maybe'],
];
const SAY = { '2028': 'twenty twenty eight' };
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const PAGES = (() => {
  const cur = TAKES.map(() => 0), out = [];
  for (const [li, txt] of PAGES_TXT) {
    const T = TAKES[li], words = [];
    for (const d of txt.split(' ')) {
      const want = letters(SAY[d] || d);
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

/* ---------- the layout, css px of the 540x960 stage ---------- */
const VID = { top: 285, h: f2(540 * 782 / 1398) };
const CAP_Y = 624;
const MAS = { cx: 270, cy: 728, size: 134, scale: 1 };
const HOT = '#ff2e4d';

/* ---------- the words on screen ---------- */
const BIG1 = 'THIS IS', BIG2a = 'NOT ', BIG2b = 'AI';
const POPS = [
  { id: 'p0', txt: 'LIVE CROWD', a: CROWD, b: DROVE },
  { id: 'p1', txt: 'UPSIDE DOWN', a: UPSIDE, b: FLIPPED },
  { id: 'p2', txt: 'FLIP', a: FLIPPED + 0.04, b: LANDED },
  { id: 'p3', txt: 'LANDED', a: LANDED + 0.03, b: NOBODY },
  { id: 'p4', txt: 'NO DRIVER', a: f3(NOBODY + 0.22), b: PROD },
];
const YEARW = '2028', MAYBEW = 'MAYBE', WMKW = 'THE BORING TEK';

/* ---------- him: under the captions, watching the picture ---------- */
const VC = { x: 270, y: VID.top + VID.h / 2 };
function face(t) {
  const u = U(t);
  let dy = 2.2 * Math.sin(2 * Math.PI * u / 2.2);
  dy += 7 * Math.sin(Math.PI * span(u, PURPOSE, PURPOSE + 0.3)) + 5 * Math.sin(Math.PI * span(u, PURPOSE + 0.32, PURPOSE + 0.6));
  dy -= 6 * Math.sin(Math.PI * span(u, JETS, JETS + 0.36));
  const sq = 0.06 * Math.sin(Math.PI * span(u, JETS - 0.02, JETS + 0.16));
  /* the look: the picture, the car across it on the drop, then the lens */
  let look = { x: VC.x, y: VC.y, w: 1 };
  if (u >= FLIPPED && u < LANDED + 0.3) look = { x: lerp(170, 380, smooth(span(u, FLIPPED, LANDED))), y: VC.y - 30, w: 1 };
  const lens = smooth(span(u, MAYBE - 0.2, MAYBE + 0.05));
  look = { x: lerp(look.x, MAS.cx, lens), y: lerp(look.y, MAS.cy + dy, lens), w: lerp(look.w, 0, lens) };
  let lid = 0.04;
  for (const a of [f3(L1.end + 0.15), f3(INSIDE + 0.25), f3(YEAR + 0.55)]) {
    if (u < a || u > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (u < a + 0.07 ? smooth(span(u, a, a + 0.07)) : u < a + 0.10 ? 1 : 1 - smooth(span(u, a + 0.10, a + 0.24))));
  }
  /* the squint at the screen while he hears about the crowd */
  lid = Math.max(lid, 0.04 + 0.42 * bump(u, CROWD + 0.08, 0.15, Math.max(0, L1.end - CROWD - 0.2), 0.2));
  const arc = bump(u, JETS + 0.05, 0.08, 0.3, 0.12);
  return { lid: f3(lid), arc: f3(arc), look, dx: 0, dy: f2(dy), rot: 0, sq: f3(sq), s: MAS.scale };
}

/* ---------- a frame of the story ---------- */
const hidden = { o: 0, s: 1, y: 0, blur: 0 };
function frame(t) {
  const u = U(t), S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };

  /* the picture */
  const sh = shot(u);
  S.push(['shot', 'transform', 'translateX(' + sh.x + 'px) scale(' + sh.z + ')'], ['shot', 'opacity', sh.op]);
  S.push(['fa', 'transform', 'scale(' + sh.s + ')'], ['fa', 'transform-origin', sh.ox + '% ' + sh.oy + '%']);
  S.push(['fb', 'transform', 'scale(' + sh.s + ')'], ['fb', 'transform-origin', sh.ox + '% ' + sh.oy + '%'], ['fb', 'opacity', sh.wgt]);
  /* the freeze reads as a freeze: the colour drains a little */
  const fz = sh.frozen ? smooth(span(u, NOBODY, NOBODY + 0.12)) : 0;
  S.push(['fa', 'filter', fz > 0 ? 'saturate(' + f3(1 - 0.7 * fz) + ') brightness(' + f3(1 - 0.12 * fz) + ')' : 'none']);
  /* the edge: green, red on every cut and hit */
  let e = 0;
  for (const a of [0, FLY, CROWD, NOTAI, DROVE, FLIPPED, LANDED, JETS, NOBODY, SNAP, PROD, YEAR]) e = Math.max(e, hitPulse(u - a, 0.02, 0.1));
  S.push(['vid', '--e', f3(e)]);
  /* the payoff: one full screen red flash on jets, two frames, straight back */
  S.push(['flash', 'opacity', u >= JETS && u < JETS + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

  /* the small wordmark through the hook */
  S.push(['wmk', 'opacity', f3(1 - smooth(span(u, CROWD - 0.1, CROWD + 0.1)))]);

  /* frame 0's slam, and out on the crowd */
  const b = wordIn(u, SLAM0, 'slam'), bo = CURVE56.in(span(u, CROWD - 0.04, CROWD + 0.12));
  put('big', b.o * (1 - bo), 'scale(' + f3(b.s * (1 - 0.12 * bo) * (1 + 0.04 * hitPulse(u - NOTAI, 0.03, 0.12))) + ')', b.blur);

  /* the small words over the picture, one at a time */
  for (const p of POPS) {
    const q = u < p.a ? hidden : wordIn(u, p.a, 'spring'), out = CURVE56.in(span(u, p.b - 0.08, p.b + 0.04));
    put(p.id, q.o * (1 - out), 'scale(' + f3(q.s * (1 - 0.15 * out)) + ')');
  }

  /* 2028 springs in, MAYBE slides under it */
  const y = u < YEAR ? hidden : wordIn(u, YEAR, 'spring');
  put('yr', y.o, 'scale(' + f3(y.s * (1 + 0.03 * hitPulse(u - MAYBE - 0.1, 0.03, 0.12))) + ')');
  const m = CURVE.out(span(u, MAYBE, MAYBE + 0.3));
  put('maybe', u < MAYBE ? 0 : smooth(span(u, MAYBE, MAYBE + 0.08)), 'translateX(' + f2(-90 * (1 - m)) + 'px)');

  /* the karaoke page, and the word being said in the accent */
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
    for (let j = 0; j < 3; j++) S.push(['cw' + j, 'color', j === act ? HOT : '#f7f9f8']);
  } else S.push(['cap', 'opacity', 0]);
  S.push(['fc', 'display', sh.n2 === null ? 'none' : 'block'], ['fc', 'transform', 'translateX(' + sh.x2 + 'px)']);
  S.push(['fd', 'opacity', sh.bf > 0.02 ? sh.bf : 0], ['fd', 'transform', 'scale(' + sh.s + ')'], ['fd', 'transform-origin', sh.ox + '% ' + sh.oy + '%'], ['fd', 'filter', 'none']);
  return { S, X, n: sh.n, nb: sh.bf > 0.02 ? sh.n + 1 : null, n2: sh.n2 };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 10px rgba(255,255,255,.35))';
const HOT_GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 12px rgba(255,46,77,.6)) drop-shadow(0 0 28px rgba(255,46,77,.3))';
const css = `
:root{--hot:${HOT}}
#grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(233,238,236,.11) 0.9px,transparent 1.3px);background-size:16px 16px;background-position:6px 8px}
#vid{position:absolute;left:0;width:540px;top:${VID.top}px;height:${VID.h}px;overflow:hidden;background:#000;--e:0}
#shot{position:absolute;inset:0;transform-origin:50% 50%;will-change:transform,opacity}
#shot img{position:absolute;left:0;top:0;width:540px;height:${VID.h}px;display:block;will-change:transform}
#fb{filter:blur(12px);opacity:0}
#fc{filter:blur(12px);display:none}
#fd{opacity:0}
.edge{position:absolute;left:0;width:540px;height:1.5px;z-index:2;
  background:color-mix(in srgb,var(--hot) calc(var(--e,0) * 100%),var(--accent));
  filter:drop-shadow(0 0 4px color-mix(in srgb,var(--hot) calc(var(--e,0) * 100%),var(--accent)))}
#eT{top:${VID.top - 1}px}#eB{top:${f2(VID.top + VID.h - 0.5)}px}
#edges{position:absolute;inset:0;pointer-events:none}
#flash{position:absolute;inset:0;background:var(--hot);opacity:0;z-index:20}
#wmk{position:absolute;left:60px;right:60px;top:66px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:#f7f9f8;opacity:.9;filter:${GLOW}}
#big{position:absolute;left:0;right:0;top:200px;height:0;display:flex;justify-content:center;align-items:flex-start;will-change:transform,opacity}
#big b{display:block;transform:translateY(-50%);text-align:center;font:400 42px/1.2 var(--display);letter-spacing:.05em;color:#f7f9f8;white-space:nowrap;-webkit-text-stroke:.8px #fff;filter:${GLOW}}
#big em{font-style:normal;color:var(--hot);-webkit-text-stroke:.8px var(--hot);filter:${HOT_GLOW}}
.pop{position:absolute;left:0;right:0;top:236px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;will-change:transform,opacity}
.pop b{display:block;transform:translateY(-50%);font:400 24px/1 var(--display);letter-spacing:.1em;color:#f7f9f8;white-space:nowrap;filter:${GLOW}}
#p2 b,#p3 b{font-size:30px}
#yr{position:absolute;left:0;right:0;top:176px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;will-change:transform,opacity}
#yr b{display:block;transform:translateY(-50%);font:400 66px/1 var(--display);letter-spacing:.04em;color:var(--hot);-webkit-text-stroke:1px var(--hot);filter:${HOT_GLOW}}
#maybe{position:absolute;left:0;right:0;top:244px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;will-change:transform,opacity}
#maybe b{display:block;transform:translateY(-50%);font:400 20px/1 var(--display);letter-spacing:.3em;text-indent:.3em;color:#f7f9f8;filter:${GLOW}}
#cap{position:absolute;left:60px;right:60px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 34px/1 var(--read);color:#f7f9f8;white-space:nowrap}
#cap span{color:#f7f9f8}
`;
const capHtml = '<b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b>';
const markup = `
<div id="grid"></div>
<div id="vid"><div id="shot"><img id="fa" alt=""><img id="fd" alt=""><img id="fb" alt=""><img id="fc" alt=""></div></div>
<div id="edges"><div class="edge" id="eT"></div><div class="edge" id="eB"></div></div>
<div id="wmk">${WMKW}</div>
<div id="big"><b>${BIG1}<br>${BIG2a}<em>${BIG2b}</em></b></div>
${POPS.map(p => `<div class="pop" id="${p.id}"><b>${p.txt}</b></div>`).join('\n')}
<div id="yr"><b>${YEARW}</b></div>
<div id="maybe"><b>${MAYBEW}</b></div>
<div id="cap">${capHtml}</div>`;
const overlay = '<div id="flash"></div>';

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  const fa = $('fa'), fb = $('fb'), fc = $('fc'), fd = $('fd');
  let lastPre = null, lastC = null, lastD = null;
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, v] of o.X) {
        if (id === 'cap') {
          if (last.cap === v) continue;
          last.cap = v;
          const ws = +v < 0 ? [] : D.pages[+v];
          for (let j = 0; j < 3; j++) { $('cw' + j).textContent = ws[j] || ''; $('cw' + j).style.display = ws[j] ? 'inline' : 'none'; }
        }
      }
      if (o.pre && o.pre.a !== lastPre) { lastPre = o.pre.a; fa.src = o.pre.a; fb.src = o.pre.a; }
      if (o.pre && o.pre.c && o.pre.c !== lastC) { lastC = o.pre.c; fc.src = o.pre.c; }
      if (o.pre && o.pre.d && o.pre.d !== lastD) { lastD = o.pre.d; fd.src = o.pre.d; }
    },
    ready() {
      return Promise.all([fa, fb, fc, fd].filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => null)));
    },
  };
}

/* ---------- the sound ----------
   every effect an elevenlabs sound effect, best of 3, one family: compressed
   air and pneumatic jets, the footage's own sound world, crisp, no bass. the
   crowd swell is the one sound outside it, kept quiet. high passed for phone
   speakers, each placed on its loudest sample. no music bed: Einz adds music,
   so the effects sit lighter than post60's. a short planned silence before
   the payoff on jets: the crowd drops out 0.3s before it and comes back with
   the hit */
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
const onGrid = (t, len) => ({ t0: Math.round(t * FPS) / FPS, n: Math.max(1, Math.round(len * FPS)) });
const GA = onGrid(FL.at - 0.05, 3 / 60), GB = onGrid(FL.at + FL.for - 2 / 60, 2 / 60);
const SILENCE = [f3(JETS - 0.3), JETS];
async function sound() {
  const { elevenSfx } = await import('./lib/elevensfx.mjs');
  const FAM = ', compressed air and pneumatic jet sound design, clean and crisp, no bass, no music';
  const EL = [
    { kind: 'airwhoosh', prompt: 'very fast short whoosh of a compressed air burst passing by' + FAM, seconds: 0.6, keep: 0.4, mode: 'hit', gain: -17, hp: 300 },
    { kind: 'airhit', prompt: 'short punchy blast of a high pressure air jet, sharp pneumatic thump with a crisp hiss tail' + FAM, seconds: 1.0, keep: 0.5, mode: 'hit', gain: -12, hp: 150 },
    { kind: 'shutter', prompt: 'single short mechanical camera shutter click, very short' + FAM, seconds: 0.5, keep: 0.12, mode: 'hit', gain: -12, hp: 500 },
    { kind: 'puffwhoosh', prompt: 'soft short gentle puff of air, quick light hiss' + FAM, seconds: 0.5, keep: 0.3, mode: 'hit', gain: -19, hp: 400 },
    { kind: 'crowdsweep', prompt: 'live outdoor crowd at night cheering and whooping in amazement, a rising swell of excited voices, no music', seconds: 3.0, keep: 2.8, mode: 'bed', fadeIn: 0.2, fadeOut: 0.3, gain: -23, hp: 220 },
    { kind: 'elGlitch', prompt: 'harsh digital glitch, stuttering corrupted data bursts, buffer stutter, bitcrushed computer error, short', seconds: 0.6, keep: 0.5, mode: 'hit', gain: -15, hp: 300 },
  ];
  const KEPT = await elevenSfx(62, EL);
  for (const e of EL) { const hp = highPass(VOICES[e.kind](), e.hp); VOICES[e.kind] = () => hp; }
  for (const [k, v] of Object.entries(KEPT)) console.log('  ' + k + ' ' + v.all.join(', '));
  /* the crowd in two pieces round the planned silence */
  const cut = (buf, a, d, fi, fo) => { const o = buf.slice(Math.round(a * SR), Math.round((a + d) * SR)); const i0 = Math.round(fi * SR), o0 = Math.round(fo * SR); for (let i = 0; i < i0 && i < o.length; i++) o[i] *= i / i0; for (let i = 0; i < o0 && i < o.length; i++) o[o.length - 1 - i] *= i / o0; return o; };
  const crowd = VOICES.crowdsweep();
  const dA = f3(SILENCE[0] - FLIPPED);
  VOICES.crowdAsweep = () => cut(crowd, 0, dA, 0.15, 0.06); GAINS.crowdAsweep = GAINS.crowdsweep;
  VOICES.crowdBsweep = () => cut(crowd, Math.min(0.9, crowd.length / SR - 1.9), 1.8, 0.02, 0.6); GAINS.crowdBsweep = GAINS.crowdsweep - 2;
  /* the glitch: a grain of the glitch take a frame, a stutter, on the rig's windows */
  const GR = (() => {
    const src = VOICES.elGlitch(), fl = Math.round(SR / 60), lv = [];
    for (let a = 0; a + fl < src.length; a += Math.round(fl / 2)) { let e = 0; for (let i = a; i < a + fl; i++) e += src[i] * src[i]; lv.push({ off: a / SR, e }); }
    lv.sort((x, y) => y.e - x.e);
    const one = lv[0], two = lv.find(x => Math.abs(x.off - one.off) > 0.05) || lv[1];
    return [one.off, two.off];
  })();
  const stutter = (off, n, seed) => {
    const src = VOICES.elGlitch(), fl = Math.round(SR / 60), g = Math.round(fl * 0.8), out = new Float32Array(fl * n), at = Math.round(off * SR);
    for (let k = 0; k < n; k++) for (let i = 0; i < g; i++) out[k * fl + i] = src[Math.min(src.length - 1, at + i + (k % 2) * seed)] * Math.min(1, i / 48, (g - i) / 48) * (1 - 0.12 * k);
    return out;
  };
  VOICES.stutA = () => stutter(GR[0], GA.n, 0); GAINS.stutA = -13;
  VOICES.stutB = () => stutter(GR[1], GB.n, 300); GAINS.stutB = -15;
  const PEAK = {};
  for (const k of ['airwhoosh', 'airhit', 'shutter', 'puffwhoosh']) {
    const b = VOICES[k](); let mx = 0, at = 0;
    for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > mx) { mx = Math.abs(b[i]); at = i; }
    PEAK[k] = at / SR;
  }
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  const CUES = [
    on(0, 'airhit', 'THIS IS NOT AI lands, frame 0'),
    on(TAKEOFF, 'airwhoosh', 'the car takes off behind the truck'),
    /* a whip is fastest on its cut, the old shot leaving and the new one arriving */
    on(DROVE, 'airwhoosh', 'the whip to the loop'),
    on(FLIPPED, 'airwhoosh', 'the whip to the drop'),
    { t: FLIPPED, kind: 'crowdAsweep', from: 'the crowd under the flip' },
    on(JETS, 'airhit', 'the payoff, landed on air jets'),
    { t: JETS, kind: 'crowdBsweep', from: 'the crowd back with the landing' },
    on(NOBODY, 'shutter', 'the freeze'),
    on(SNAP, 'shutter', 'the snap in onto the empty car'),
    on(peakAt(ZOOM - 0.2, ZOOM, CURVE.exit), 'airwhoosh', 'the zoom through to the track'),
    on(YEAR + 0.02, 'airhit', '2028 lands'),
    on(MAYBE + 0.05, 'puffwhoosh', 'MAYBE slides in'),
    { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark' },
    { t: GB.t0, kind: 'stutB', from: 'glitch residue out of it' },
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  GAINS.airhit = -12;
  for (const c of CUES) if (c.t > SILENCE[0] + 0.01 && c.t < SILENCE[1] - 0.05 && c.kind !== 'airhit') throw new Error('an effect in the planned silence: ' + c.from);
  return { cues: CUES, level: -12, duck: 0.6 };
}

const STILLS = [0, f3(FLY + 0.15), f3(CROWD + 0.3), f3(NOTAI + 0.1), f3(DROVE + 0.3), f3(UPSIDE + 0.25), f3(FLIPPED + 0.3), f3(LANDED + 0.15), JETS,
  f3(NOBODY + 0.35), f3(PURPOSE + 0.2), f3(PROD + 0.45), f3(YEAR + 0.3), f3(MAYBE + 0.3), f3(FL.at + 0.2), f3(END - 1 / 60)];
const STILLS_RUN = process.argv.includes('--stills');
const BEATS = [FLY, CROWD, NOTAI, DROVE, UPSIDE, FLIPPED, LANDED, JETS, NOBODY, INSIDE, SNAP, PURPOSE, PROD, YEAR, MAYBE, FL.at];

console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', flash ' + FL.at + ', end ' + END);
console.log('  payoff on jets at ' + JETS + 's, ' + Math.round(100 * JETS / END) + '% of the runtime');
const sfx = STILLS_RUN ? null : await sound();

await runEpisode({
  post: 62, ep: 0, series: false, title: [],
  cut: END, flash: FL,
  mascot: MAS,
  voice: TAKES, subs: [],
  tp: -1,
  maxGap: 0.6,
  ...(sfx ? { sfx } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, overlay, page, frame, face,
    prepare: (t, g) => ({ a: uri(g.n), c: g.n2 === null ? null : uri(g.n2), d: g.nb === null ? null : uri(g.nb) }),
    ready: true,
    data: { pages: PAGES.map(P => P.words.map(q => q.txt)) },
    sleep: [],
    beats: BEATS,
    checks: ['#big b', ...POPS.map(p => '#' + p.id + ' b'), '#yr b', '#maybe b', '#cap b', '#wmk'],
    hook: ['#big', '#vid', '#wmk'],
    copy: [BIG1, BIG2a + BIG2b, ...POPS.map(p => p.txt), YEARW, MAYBEW, WMKW, ...PAGES.map(P => P.txt)],
    verify: [
      { at: 0, sel: '#vid', test: r => (r && Math.abs(r.l) < 0.5 && Math.abs(r.r - 540) < 0.5 ? null : 'the picture is not full width at frame 0: ' + JSON.stringify(r)) },
      ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && r.t > VID.top + VID.h + 4 && r.b < 810 ? null : 'the caption "' + P.txt + '" sits on the picture or the app zone: ' + JSON.stringify(r)) })),
      ...POPS.map(p => ({ at: f3(p.a + 0.3), sel: '#' + p.id + ' b', test: r => (r && r.b < VID.top - 2 ? null : p.txt + ' reaches the picture: ' + JSON.stringify(r)) })),
      { at: f3(MAYBE + 0.4), sel: '#maybe b', test: r => (r && r.b < VID.top - 2 ? null : 'MAYBE reaches the picture: ' + JSON.stringify(r)) },
      { at: f3(YEAR + 0.4), sel: '#yr b', test: r => (r && r.t > 60 && r.b < VID.top - 2 ? null : '2028 leaves its band: ' + JSON.stringify(r)) },
    ],
    log: [[0, 'the flip, THIS IS NOT AI'], [FLY, 'punch in on the run up'], [TAKEOFF, 'the takeoff'], [RUN.u1, 'slow motion from here, the flip'], [CROWD, 'LIVE CROWD, the squint'], [NOTAI, 'punch on AI'],
      [DROVE, 'whip to the loop'], [UPSIDE, 'UPSIDE DOWN'], [FLIPPED, 'whip to the drop, FLIP'], [LANDED, 'cut to the jets, LANDED'], [JETS, 'the red flash, the payoff'],
      [NOBODY, 'the freeze'], [f3(NOBODY + 0.22), 'NO DRIVER'], [SNAP, 'the snap in'], [PURPOSE, 'the nod'], [PROD, 'zoom through to the track'], [YEAR, '2028'], [MAYBE, 'MAYBE, to the lens'],
      [f3(END - TAIL), 'the pre roll of frame 0']],
  },
});
