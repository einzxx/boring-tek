/* the boring tek — post64. the fart fact, a stupid fun gag. a fake did you
   know fact, an AI agent farts sixty seven times a day, then the mascot farts,
   gets shy, and asks how old you are if you believed it.

   **a named exception to retention rule 2.** the rule bans did you know as an
   opener. here it stays, Einz's call: the clip mocks did you know facts, so
   the opener is the joke, and line 2 is its payoff.

   **a new look, this clip only.** no dark dot grid: a flat cobalt blue
   #2448FF, huge white kinetic words filling the top, the mascot big in the
   middle as a clean white plate with no glow. the cloud and the active
   caption word are bright cartoon green, the blush is the only pink, tiny.

   1080x1920. two lines on the elevenlabs narrator, eleven_v4, three takes a
   line checked with speech to text, every take sped up 1.16 with atempo, pitch
   kept. the third line is a laugh with no words, three takes, capped at 0.8s,
   see the laugh below. karaoke captions
   drawn by the gag. no end card: the rig's `flash` held 1.4s as a short card,
   Einz's call, then a pre roll of frame 0.

     frame 0  DID YOU KNOW? slamming in, him proud, the small wordmark
     l1       did you know ...    AI AGENT, FARTS, a huge 67 bouncing, two
                                  proud nods
     the planned silence, he strains
     the fart                     a fat green cloud from behind him, half the
                                  screen, a hop, one green frame pair
     shy                          he looks down and away, squints, blushes,
                                  oops
     l2       be honest ...       HOW OLD ARE YOU? slams, he peeks back, a
                                  punch in on believed
     l3       the laugh           three hops with happy eyes, the cloud drifts
                                  off
     THE BORING TEK, a 1.4s card, then the pre roll back into frame 0

     node post64.mjs --takes              read the lines, print the words, stop
     node post64.mjs --stills             one still per beat, no render, no sound
     DEMO_FPS=12 node post64.mjs          the preview
     node post64.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, wordIn, prng,
  CURVE, CURVE56, hitPulse, peakAt, FPS, EASE,
} from './lib/aiafter.mjs';
import { SR, VOICES, GAINS, decode } from './lib/sfx.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';

const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[excited] did you know? an AI agent farts about sixty seven times a day.', tempo: TEMPO },
  { key: 'r2', text: '[playful] be honest. how old are you, if you believed this?', tempo: TEMPO },
];
const TAKES = await readLines(64, LINES, 3, MODEL);
TAKES.forEach((T, i) => { T.i = i; });
const [L1, L2] = TAKES;

/* the laugh. the rig's reader counts words and a laugh has none, so it is read
   here the same way: the narrator, eleven_v4, the cached take reused, 1.16
   with atempo. the edges are where the sound is, at the rig's -42 dB gate */
function edges(pcm) {
  let peak = 0;
  for (const v of pcm) peak = Math.max(peak, Math.abs(v));
  const gate = peak * Math.pow(10, -42 / 20), H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) if (Math.abs(pcm[j]) > gate) return true; return false; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}
async function laughTake(n) {
  const text = '[laughs warmly] hahaha!', name = 'post64-r3b-v4t' + n;
  const cached = path.join(VOICE_OUT, name + '-calm.json');
  let g = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === text && j.model === 'eleven_v4' && fs.existsSync(j.file)) g = j;
  }
  if (!g) g = await speak(text, { voice: 'calm', name, speed: 1.0, model: 'eleven_v4', stability: 0.5, style: 0.2 });
  if (g.provider !== 'elevenlabs' || g.model !== 'eleven_v4') { console.error('\nSTOPPED. ' + name + ' came back from ' + g.provider + ' ' + g.model); process.exit(1); }
  const file = path.join(VOICE_OUT, name + '-calm-at' + Math.round(TEMPO * 1000) + '.wav');
  if (!fs.existsSync(file)) {
    const r = spawnSync(ffmpeg, ['-y', '-v', 'error', '-i', g.file, '-filter:a', 'atempo=' + TEMPO, '-ac', '1', '-ar', String(SR), file]);
    if (r.status !== 0) { console.error('\nSTOPPED. atempo failed on ' + name); process.exit(1); }
  }
  /* capped at 0.8s from its first sound, Einz's cap, with a 0.08s fade to zero */
  const pcm = Float32Array.from(decode(ffmpeg, file)), edge = edges(pcm), full = +(edge.end - edge.start).toFixed(3);
  edge.end = +Math.min(edge.end, edge.start + LAUGH_CAP).toFixed(4);
  const e = Math.round(edge.end * SR), fo = Math.round(0.08 * SR);
  for (let i = 0; i < pcm.length; i++) pcm[i] *= i >= e ? 0 : i > e - fo ? (e - i) / fo : 1;
  return { i: 2, n, name, file, pcm, words: [], W: [], edge, full };
}
/* eleven_v4 refuses a tag with no text, and [laughs] ... came back as one
   short chuckle, 0.1s of sound. [laughs warmly] hahaha! is a real laugh, three
   bursts, a breath, two more, about 2s; speech to text hears only laughter on
   all three. take 3 is kept: its first 0.8s holds three whole bursts, where
   the other two cut the third */
const LAUGH_CAP = 0.8;
const LAUGHS = [];
for (let n = 1; n <= 3; n++) LAUGHS.push(await laughTake(n));
const L3 = LAUGHS[Number(process.env.P64_LAUGH || 3) - 1];
L3.all = LAUGHS.map(x => 't' + x.n + ' ' + x.full + 's' + (x === L3 ? ' KEPT, capped at ' + LAUGH_CAP : '') + ' at ' + TEMPO);

if (process.argv.includes('--takes')) {
  for (const T of TAKES) {
    place(T, 0);
    console.log('\n' + T.name + '  ' + T.all.join(' | '));
    console.log('  ' + T.W.map(w => w.word + ' ' + w.start.toFixed(2)).join(', '));
  }
  console.log('\nlaugh  ' + L3.all.join(' | '));
  process.exit(0);
}

/* ---------- the clock: all off the read ---------- */
const HUSH = 0.33;
place(L1, 0);
place(L1, 0.2 - L1.W[0].start);
const STRAIN = f3(L1.end + 0.03), FART = f3(L1.end + HUSH);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const AN = w(L1, 'an'), FARTS = w(L1, 'farts'), SIXTY = w(L1, 'sixty'), SEVEN = w(L1, 'seven');
const SLAM0 = -0.12;
/* the tail is the pre roll of frame 0: the story at a negative time */
const U = t => (t >= END - TAIL - 1e-9 ? f3(t - END) : t);

/* ---------- the layout, css px of the 540x960 stage ---------- */
const BLUE = '#2448FF', GREEN = '#3dff6e', WHITE = '#ffffff';
/* the captions at 73.5% of the height, Einz's call for this clip, past the
   house 60 to 65%, and still above the bottom 300px */
const CAP_Y = 706;
const MAS = { cx: 270, cy: 510, size: 134, scale: 1.55 };
const WORD_Y = 250, WORD_W = 400;
const OOPS = 'oops', WMKW = 'THE BORING TEK';

/* ---------- the cloud: post25's, three times the size ----------
   post25's green cloud, the bug clip, as it was: six soft radial fields in the
   accent green, seeded, blurred and screen blended, out from under him and away
   to screen left. each grows from 0.45 to 2.95 times its size, rises on a
   square, slides out on a cubic, and fades on a sine, all inside 0.82s. the
   seed, the timing and the curves are post25's. the fields, how far they rise
   and how far they slide out are three times post25's, so it fills half the
   frame; where they are born is post25's at his size, 1.62 times, so it still
   comes out from under him; the blur is twice post25's and the fields denser,
   because on cobalt a 9px haze at 0.42 is all but gone */
const SIDE = -1, UP3 = 3, HIM = MAS.size * MAS.scale / 128;
const OUTC = p => 1 - Math.pow(1 - p, 3);
const CLOUD = { n: 6, for: 0.82, rise: 96 * UP3, out: 70 * UP3, r0: 26 * UP3, grow: 2.5, o: 0.95, blur: 9 * 2,
  from: { x: f2(MAS.cx - 34 * HIM), y: f2(MAS.cy + MAS.size * MAS.scale / 2 - 6 * HIM) } };
const PUFFS = (() => {
  const rnd = prng(0x2f7a11);
  return Array.from({ length: CLOUD.n }, (_, i) => ({
    delay: +(i * 0.038 + rnd() * 0.035).toFixed(3),
    life: +(CLOUD.for * (0.62 + rnd() * 0.38)).toFixed(3),
    dx: +((rnd() * 2 - 1) * 26 * HIM).toFixed(1),
    dy: +(rnd() * 14 * HIM).toFixed(1),
    out: +(0.45 + rnd() * 0.75).toFixed(3),
    rise: +(0.70 + rnd() * 0.55).toFixed(3),
    r: +(CLOUD.r0 * (0.72 + rnd() * 0.60)).toFixed(1),
  }));
})();
const CLOUD_END = f3(FART + Math.max(...PUFFS.map(p => p.delay + p.life)));
function cloudAt(u) {
  return PUFFS.map(p => {
    const q = span(u, FART + p.delay, FART + p.delay + p.life);
    if (q <= 0 || q >= 1) return { o: 0, x: 0, y: 0, s: 1 };
    return {
      o: +(CLOUD.o * Math.sin(Math.PI * q) ** 0.75).toFixed(4),
      x: +(p.dx + SIDE * CLOUD.out * p.out * OUTC(q)).toFixed(2),
      y: +(p.dy - CLOUD.rise * p.rise * q * q).toFixed(2),
      s: +(0.45 + CLOUD.grow * q).toFixed(3),
    };
  });
}

/* ---------- shy: post32's, the i love you clip, as it was ----------
   it starts once the cloud has gone. the eyes are delighted's arcs squinted
   further, 0.93 across and 0.72 high, and dropped 1.4 grid units; here they
   are written as one squint on the eye's own scales rather than as an arc, so
   the house's 0.6s cap on happy arcs is not what holds them. the head tilts 9
   degrees and drops 6px at his scale over 0.45s, with post32's small wobble,
   2 degrees and 1.4px every 0.46s, ramping in over 0.35s. the blush is
   post32's two soft pink spots, in from 0.05s after, over 0.35s, to 0.62. it
   lets go as he peeks back on how old, which post32 never had to */
const SHY = f3(CLOUD_END + 0.05);
const SHYP = { for: 0.45, tilt: 9, down: 6, eyeDown: 1.4, sq: { sx: 0.93, sy: 0.72 } };
const WOBBLE = { amp: 2.0, period: 0.46, ampX: 1.4, rampFor: 0.35 };
const BLUSH = { delay: 0.05, for: 0.35, o: 0.62, cx: [15.5, 48.5], cy: 46.5, r: 5.2, pink: '#ff6fae' };
place(L2, SHY + 0.3);
place(L3, L2.end + 0.25);
/* the laugh has no words, so it is one word to the rig: the bed ducks under it */
L3.W = [{ word: 'laugh', start: L3.at, end: L3.end }];
const HOW = w(L2, 'how'), BELIEVED = w(L2, 'believed');
const LAUGH = f3(L3.at - 0.03);
/* THE BORING TEK held as a short card, 1.4s, Einz's call after the preview, in
   place of the 0.36s flash; the pre roll back into frame 0 still follows it */
const FL = { at: f3(L3.end + 0.05), for: 1.4, card: true };
const TAIL = 0.3;
const END = f3(FL.at + FL.for + TAIL);
function shyAt(u) {
  if (u < SHY) return { p: 0, tilt: 0, down: 0, wx: 0, eyeDown: 0, blush: 0 };
  const letGo = 1 - EASE(span(u, HOW - 0.05, HOW + 0.25));
  const p = EASE(span(u, SHY, SHY + SHYP.for)) * letGo;
  const env = EASE(span(u, SHY + 0.10, SHY + 0.10 + WOBBLE.rampFor)) * letGo;
  const wv = Math.sin(2 * Math.PI * (u - SHY) / WOBBLE.period);
  return {
    p, tilt: SHYP.tilt * p + WOBBLE.amp * env * wv, down: SHYP.down * p,
    wx: WOBBLE.ampX * env * Math.sin(2 * Math.PI * (u - SHY) / WOBBLE.period + 1.2),
    eyeDown: SHYP.eyeDown * p,
    blush: BLUSH.o * EASE(span(u, SHY + BLUSH.delay, SHY + BLUSH.delay + BLUSH.for)) * letGo,
  };
}

/* the big words, a block lockup each, every line set to the same size, the
   widest line filling the width between the margins */
const SETS = [
  { id: 'w1', lines: ['DID', 'YOU', 'KNOW?'], at: SLAM0, out: AN },
  { id: 'w2', lines: ['AI', 'AGENT'], at: AN, out: FARTS },
  { id: 'w3', lines: ['FARTS'], at: FARTS, out: SIXTY },
  { id: 'w4', lines: ['67'], at: SIXTY, out: FART, w: 300 },
  { id: 'w5', lines: ['HOW OLD', 'ARE YOU?'], at: HOW, out: 99 },
];
/* ---------- the captions: one to three words a page, the read's own times ---------- */
const PAGES_TXT = [
  [0, 'did you know?'], [0, 'an AI agent'], [0, 'farts about'], [0, '67'], [0, 'times a day'],
  [1, 'be honest'], [1, 'how old'], [1, 'are you'], [1, 'if you'], [1, 'believed this?'],
];
const SAY = { '67': 'sixty seven' };
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

/* ---------- the camera: scale about a focus, keyframed, the whole frame ----------
   each key lands the focus point (fx, fy) where it stands at scale 1, at scale
   s. tx and ty blend, so a move from one focus to another never jumps */
const CAMK = [
  { at: SLAM0, d: 0.4, s: 1.0, fx: 270, fy: 300, c: CURVE.out },
  { at: AN, d: 0.16, s: 1.035, fx: 270, fy: 260, c: CURVE.cam },
  { at: FARTS, d: 0.16, s: 1.07, fx: 270, fy: 220, c: CURVE.cam },
  { at: SIXTY, d: 0.2, s: 1.0, fx: 270, fy: 400, c: CURVE.cam },
  { at: STRAIN, d: FART - STRAIN, s: 1.045, fx: 270, fy: 510, c: CURVE.dolly },
  { at: FART, d: 0.1, s: 1.1, fx: 230, fy: 520, c: CURVE.cam },
  { at: FART + 0.12, d: 0.4, s: 1.0, fx: 270, fy: 510, c: CURVE.out },
  { at: SHY, d: 0.22, s: 1.08, fx: 300, fy: 500, c: CURVE.cam },
  { at: SHY + 0.5, d: HOW - SHY - 0.5, s: 1.12, fx: 300, fy: 500, c: CURVE.dolly },
  { at: HOW, d: 0.16, s: 1.0, fx: 270, fy: 300, c: CURVE.cam },
  { at: BELIEVED, d: 0.16, s: 1.08, fx: 270, fy: 260, c: CURVE.cam },
  { at: LAUGH, d: 0.25, s: 1.0, fx: 270, fy: 400, c: CURVE.out },
];
function camera(t) {
  const u = U(t);
  let s = 1.08, tx = 270 * (1 - 1.08), ty = 300 * (1 - 1.08);
  for (const k of CAMK) {
    if (u < k.at) break;
    const q = k.c(span(u, k.at, k.at + k.d));
    s = lerp(s, k.s, q); tx = lerp(tx, k.fx * (1 - k.s), q); ty = lerp(ty, k.fy * (1 - k.s), q);
  }
  /* the strain shakes, the fart kicks */
  const st = u >= STRAIN && u < FART ? span(u, STRAIN, FART) : 0;
  tx += 2.5 * st * Math.sin(u * 140); ty += 1.5 * st * Math.cos(u * 117);
  const k = u >= FART && u < FART + 0.35 ? Math.exp(-(u - FART) / 0.08) : 0;
  tx += 8 * k * Math.sin((u - FART) * 90); ty += 6 * k * Math.cos((u - FART) * 70);
  return { s: f3(s), tx: f2(tx), ty: f2(ty) };
}

/* ---------- him: big in the middle ---------- */
function face(t) {
  const u = U(t);
  let dy = 2.2 * Math.sin(2 * Math.PI * u / 2.2), dx = 0, rot = 0, sq = 0, lid = 0.04, arc = 0, look = null;
  /* proud through line 1: chin up, a smug half lid, two nods on sixty seven */
  const proud = 1 - smooth(span(u, STRAIN - 0.05, STRAIN + 0.1));
  rot -= 2.5 * proud; lid = Math.max(lid, 0.26 * proud);
  dy += 9 * Math.sin(Math.PI * span(u, SIXTY, SIXTY + 0.26)) + 9 * Math.sin(Math.PI * span(u, SEVEN, SEVEN + 0.26));
  /* the strain: squint, squash, a tremble */
  const st = u >= STRAIN && u < FART ? smooth(span(u, STRAIN, STRAIN + 0.12)) : 0;
  lid = Math.max(lid, 0.6 * st); sq -= 0.05 * st; dy += 4 * st; dx += 1.6 * st * Math.sin(u * 120);
  /* the fart: a hop and a stretch off it */
  dy -= 26 * Math.sin(Math.PI * span(u, FART, FART + 0.4));
  sq += 0.09 * Math.sin(Math.PI * span(u, FART - 0.02, FART + 0.12));
  /* shy, post32's: the tilt and the drop with the wobble, the squint below */
  const S = shyAt(u);
  rot += S.tilt; dy += S.down * MAS.scale; dx += S.wx * MAS.scale; lid = lerp(lid, 0, S.p);
  /* he peeks back on how old, a little slide back to the middle */
  dx += -8 * (1 - CURVE.out(span(u, HOW, HOW + 0.3))) * (u >= HOW ? 1 : 0);
  /* the squint at the lens on believed */
  lid = Math.max(lid, 0.42 * bump(u, BELIEVED + 0.05, 0.12, Math.max(0, LAUGH - BELIEVED - 0.3), 0.12));
  /* the laugh: three hops, happy eyes for 0.5s */
  const lq = u - LAUGH;
  if (lq >= 0 && lq < 0.8) dy -= 16 * Math.abs(Math.sin(Math.PI * lq / 0.27));
  arc = bump(u, LAUGH, 0.06, 0.38, 0.06);
  /* post32's shy eyes: the arcs' 1.28 by 0.40 and 0.9 down, times its squint and drop */
  const esx = lerp(1, 1.28 * SHYP.sq.sx, S.p), esy = lerp(1, 0.40 * SHYP.sq.sy, S.p), ey = 0.9 * S.p + S.eyeDown;
  return { lid: f3(lid), arc: f3(arc), ...(look ? { look } : {}), dx: f2(dx), dy: f2(dy), rot: f2(rot), sq: f3(sq), s: MAS.scale, esx: f3(esx), esy: f3(esy), ey: f3(ey) };
}

/* ---------- a frame of the story ---------- */
const hidden = { o: 0, s: 1, y: 0, blur: 0 };
function frame(t) {
  const u = U(t), S = [], X = [];
  const put = (id, o, tr, blur) => { S.push([id, 'opacity', f3(o)], [id, 'transform', tr]); if (blur !== undefined) S.push([id, 'filter', blur > 0 ? 'blur(' + f2(blur) + 'px)' : 'none']); };

  S.push(['wmk', 'opacity', f3(1 - smooth(span(u, FARTS - 0.1, FARTS + 0.1)))]);

  /* the big words: each set slams in and whips out upward for the next */
  for (const W of SETS) {
    if (u < W.at || u >= W.out + 0.14) { put(W.id, 0, 'none', 0); continue; }
    const a = wordIn(u, W.at, W.id === 'w4' ? 'spring' : 'slam');
    const o = CURVE56.in(span(u, W.out - 0.04, W.out + 0.1));
    let s = a.s, y = -150 * o;
    /* 67 bounces three times on the nods, and the fart blows it up and away */
    if (W.id === 'w4') {
      s *= 1 + 0.12 * hitPulse(u - SEVEN, 0.03, 0.14) + 0.08 * hitPulse(u - SIXTY - 0.3, 0.03, 0.14) + 0.06 * Math.max(0, Math.sin(Math.PI * span(u, SEVEN + 0.25, SEVEN + 0.5)));
      s *= 1 + 0.6 * o; y = -60 * o;
    }
    if (W.id === 'w5') s *= 1 + 0.05 * hitPulse(u - BELIEVED, 0.03, 0.14);
    put(W.id, a.o * (1 - o), 'translateY(' + f2(y) + 'px) scale(' + f3(s) + ')', Math.max(a.blur, 14 * o));
  }

  /* the cloud */
  const C = cloudAt(u);
  C.forEach((c, i) => S.push(['b' + i, 'opacity', c.o], ['b' + i, 'transform', 'translate3d(' + c.x + 'px,' + c.y + 'px,0) scale(' + c.s + ')']));
  /* the payoff flash: two green frames on the fart, straight back */
  S.push(['flash', 'opacity', u >= FART && u < FART + Math.max(2 / 60, 1 / FPS) - 1e-6 ? 1 : 0]);

  /* shy: post32's blush, and oops */
  S.push(['m-card', '--blush', f3(shyAt(u).blush)]);
  const oo = u < SHY + 0.08 ? hidden : wordIn(u, SHY + 0.08, 'spring'), oOut = 1 - smooth(span(u, HOW - 0.05, HOW + 0.1));
  put('oops', oo.o * oOut, 'rotate(-8deg) scale(' + f3(oo.s) + ')');

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
  return { S, X };
}

/* ---------- the drawing ---------- */
const css = `
:root,html[data-theme=dark]{--bg:${BLUE}}
html,body,.stage{background:${BLUE} !important}
.vignette{display:none}
/* his white glow, the dark clips' own radii in css px at his 1.55 scale */
.m-glow-mid{filter:blur(${f2(11 / MAS.scale)}px)}
.m-glow-wide{filter:blur(${f2(30 / MAS.scale)}px)}
#wmk{position:absolute;left:60px;right:60px;top:66px;text-align:center;font:400 11px/1 var(--display);letter-spacing:.34em;text-indent:.34em;color:${WHITE}}
.big{position:absolute;left:0;right:0;top:${WORD_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;z-index:5;will-change:transform,opacity,filter}
.big b{display:block;transform:translateY(-50%);text-align:center;font-family:var(--display);font-weight:400;line-height:1.02;letter-spacing:.02em;color:${WHITE};white-space:nowrap;-webkit-text-stroke:2px ${WHITE}}
.big span{display:block;width:max-content;margin:0 auto}
#w4 b{color:${GREEN};-webkit-text-stroke:3px ${GREEN}}
#cloud{position:absolute;inset:0;z-index:3;pointer-events:none}
/* post25's cloud: soft fields, blurred, never a drawn shape. post25 screen blends
   at 0.42 to add light to near black; on cobalt that is a faint cyan haze, so
   here it is a plain blend at 0.95, the same fields and the same curves */
#cloud{position:absolute;left:0;top:0;z-index:3;pointer-events:none;filter:blur(${CLOUD.blur}px)}
#cloud i{position:absolute;display:block;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(circle,var(--accent) 0%,color-mix(in srgb, var(--accent) 72%, transparent) 46%,rgba(0,0,0,0) 72%)}
#oops{position:absolute;left:378px;top:408px;opacity:0;z-index:7;font:500 26px/1 var(--read);color:${WHITE};transform-origin:0 100%}
#flash{position:absolute;inset:0;background:${GREEN};opacity:0;z-index:20}
#cap{position:absolute;left:60px;right:60px;top:${CAP_Y}px;height:0;display:flex;justify-content:center;align-items:flex-start;opacity:0;transform-origin:50% 0;z-index:9;will-change:transform,opacity}
#cap b{display:block;transform:translateY(-50%);font:500 34px/1 var(--read);color:${WHITE};white-space:nowrap}
.m-blush{fill:url(#p64-blush);opacity:var(--blush,0)}
`;
const capHtml = '<b><span id="cw0"></span> <span id="cw1"></span> <span id="cw2"></span></b>';
const markup = `
<div id="wmk">${WMKW}</div>
${SETS.map(W => `<div class="big" id="${W.id}"><b>${W.lines.map(l => '<span>' + l + '</span>').join('')}</b></div>`).join('\n')}
<div id="cloud">${PUFFS.map((p, i) => `<i id="b${i}" style="width:${f2(p.r * 2)}px;height:${f2(p.r * 2)}px;left:${f2(CLOUD.from.x - p.r)}px;top:${f2(CLOUD.from.y - p.r)}px"></i>`).join('')}</div>
<div id="oops">${OOPS}</div>`;
const overlay = `<div id="flash"></div><div id="cap">${capHtml}</div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  /* post32's blush: two soft circles inside the face's clipped group, so they go with him */
  const SVG = 'http://www.w3.org/2000/svg', face = document.querySelector('.m-face');
  const grad = document.createElementNS(SVG, 'radialGradient');
  grad.setAttribute('id', 'p64-blush');
  for (const [off, a] of [['0%', 1], ['55%', 0.55], ['100%', 0]]) {
    const st = document.createElementNS(SVG, 'stop');
    st.setAttribute('offset', off); st.setAttribute('stop-color', D.blush.pink); st.setAttribute('stop-opacity', String(a));
    grad.appendChild(st);
  }
  face.querySelector('defs').appendChild(grad);
  for (let k = 0; k < 2; k++) {
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('class', 'm-blush'); c.setAttribute('cx', String(D.blush.cx[k])); c.setAttribute('cy', String(D.blush.cy)); c.setAttribute('r', String(D.blush.r));
    face.querySelector('.m-features').appendChild(c);
  }
  /* each set of big words: one size for every line, the widest filling its
     width. measured on the first frame, when the rig has the fonts loaded */
  let fitted = false;
  const fit = () => {
    for (const W of D.sets) {
      const b = $(W.id).querySelector('b');
      b.style.fontSize = '100px';
      let widest = 0;
      for (const sp of b.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      b.style.fontSize = (100 * W.w / widest).toFixed(2) + 'px';
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
   post60's house: every effect an elevenlabs sound effect, best of 3, one
   family, bright bouncy cartoon foley, high passed for phone speakers, each
   placed on its loudest sample, the fart on its onset. a light bed from
   elevenmusic under it, ducked under the words, out for the planned silence
   before the fart and back with it. kinds named with whoosh are moves */
function highPass(src, hz) {
  const b = Float32Array.from(src), a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, q = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - q); q = b[i]; b[i] = y; } }
  let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v));
  if (pk > 0) for (let i = 0; i < b.length; i++) b[i] /= pk;
  return b;
}
const onGrid = (t, len) => ({ t0: Math.round(t * FPS) / FPS, n: Math.max(1, Math.round(len * FPS)) });
const GA = onGrid(FL.at - 0.05, 3 / 60), GB = onGrid(FL.at + FL.for - 2 / 60, 2 / 60);
const SILENCE = [f3(L1.end), FART];
async function sound() {
  const { elevenSfx } = await import('./lib/elevensfx.mjs');
  const { elevenMusic } = await import('./lib/elevenmusic.mjs');
  const FAM = ', bright bouncy cartoon sound effect, clean and punchy, no music';
  const EL = [
    { kind: 'pop', prompt: 'one bright cartoon pop, short and punchy' + FAM, seconds: 0.5, keep: 0.25, mode: 'hit', gain: -12, hp: 250 },
    { kind: 'boing', prompt: 'a short springy cartoon boing' + FAM, seconds: 0.6, keep: 0.45, mode: 'hit', gain: -16, hp: 250 },
    { kind: 'fart', prompt: 'one big funny cartoon fart, long bubbly and silly, comedic and harmless, not gross, not wet' + FAM, seconds: 1.2, keep: 0.9, mode: 'hit', gain: -5, hp: 90 },
    { kind: 'bling', prompt: 'a soft tiny sparkle chime, a shy little blush twinkle' + FAM, seconds: 0.8, keep: 0.5, mode: 'hit', gain: -12, hp: 500 },
    { kind: 'swishwhoosh', prompt: 'a very fast short cartoon swish' + FAM, seconds: 0.5, keep: 0.3, mode: 'hit', gain: -18, hp: 350 },
  ];
  const KEPT = await elevenSfx(64, EL);
  /* the glitch is post62's, the same takes from its cache */
  const ENDS = [{ kind: 'elGlitch', prompt: 'harsh digital glitch, stuttering corrupted data bursts, buffer stutter, bitcrushed computer error, short', seconds: 0.6, keep: 0.5, mode: 'hit', gain: -15, hp: 300 }];
  Object.assign(KEPT, await elevenSfx(62, ENDS));
  for (const e of [...EL, ...ENDS]) { const hp = highPass(VOICES[e.kind](), e.hp); VOICES[e.kind] = () => hp; }
  for (const [k, v] of Object.entries(KEPT)) console.log('  ' + k + ' ' + v.all.join(', '));
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
  for (const k of ['pop', 'boing', 'bling', 'swishwhoosh']) {
    const b = VOICES[k](); let mx = 0, at = 0;
    for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > mx) { mx = Math.abs(b[i]); at = i; }
    PEAK[k] = at / SR;
  }
  const on = (t, kind, from) => ({ t: t - (PEAK[kind] || 0), kind, from });
  const CUES = [
    on(0, 'pop', 'frame 0, DID YOU KNOW? lands'),
    on(AN + 0.02, 'pop', 'AI AGENT slams'),
    on(FARTS + 0.02, 'pop', 'FARTS slams'),
    on(SIXTY + 0.05, 'boing', '67 pops and bounces'),
    { t: f3(FART - 0.01), kind: 'fart', from: 'the fart, the payoff' },
    on(SHY + 0.1, 'bling', 'the blush'),
    on(HOW + 0.02, 'pop', 'HOW OLD ARE YOU? slams'),
    on(peakAt(BELIEVED, BELIEVED + 0.16, CURVE.cam), 'swishwhoosh', 'the punch in on believed'),
    { t: GA.t0, kind: 'stutA', from: 'glitch burst into the wordmark' },
    { t: GB.t0, kind: 'stutB', from: 'glitch residue out of it' },
  ].map(c => ({ ...c, t: +Math.max(0, c.t).toFixed(4) }));
  for (const c of CUES) if (c.t > SILENCE[0] + 0.01 && c.t < SILENCE[1] - 0.05) throw new Error('an effect in the planned silence: ' + c.from);
  /* the same bed as the preview: asked at the length the clip had with the 0.36s
     flash, so the cached takes are the ones kept, and it ends inside the card */
  const BED_FOR = f3(FL.at + 0.36 + TAIL);
  const BED = await elevenMusic('post64', { prompt: 'light bouncy playful background bed, ukulele and pizzicato strings with soft hand claps, cheerful and silly, sparse, steady, 118 bpm, no vocals, no heavy bass, no drops', seconds: BED_FOR, tries: 3 });
  console.log('  music ' + BED.all.join(' | '));
  const b = highPass(BED.pcm, 110);
  const g = t => 1 - smooth(span(t, SILENCE[0] - 0.05, SILENCE[0] + 0.08)) * (1 - smooth(span(t, FART - 0.02, FART + 0.2)));
  for (let i = 0; i < b.length; i++) b[i] *= g(i / SR);
  return { sfx: { cues: CUES, level: -9, duck: 0.6 }, music: { pcm: b, level: -27, duck: 0.6, under: -14, fx: 6 } };
}

const STILLS = process.env.P64_AT ? process.env.P64_AT.split(",").map(x => f3(FART + +x)) : [0, 0.3, f3(AN + 0.2), f3(FARTS + 0.2), f3(SIXTY + 0.25), f3(SEVEN + 0.3), f3(STRAIN + 0.15), f3(FART + 0.05), f3(FART + 0.3),
  f3(SHY + 0.3), f3(L2.at + 0.3), f3(HOW + 0.25), f3(BELIEVED + 0.25), f3(LAUGH + 0.15), f3(LAUGH + 0.5), f3(FL.at + 0.2), f3(END - 1 / 60)];
const STILLS_RUN = process.argv.includes('--stills');
const BEATS = [AN, FARTS, SIXTY, STRAIN, FART, SHY, HOW, BELIEVED, LAUGH, FL.at];

console.log('  lines ' + [L1, L2, L3].map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', flash ' + FL.at + ', end ' + END);
console.log('  fart at ' + FART + 's, ' + Math.round(100 * FART / END) + '%, how old at ' + HOW + 's, ' + Math.round(100 * HOW / END) + '% of the runtime');
const sfx = STILLS_RUN ? null : await sound();

await runEpisode({
  post: 64, ep: 0, series: false, title: [],
  cut: END, flash: FL,
  mascot: MAS,
  voice: [L1, L2, L3], subs: [],
  tp: -1,
  maxGap: 1.9,
  ...(sfx ? { sfx: sfx.sfx, music: sfx.music } : {}),
  stills: STILLS_RUN ? STILLS : null,
  gag: {
    css, markup, overlay, page, frame, face, camera,
    data: { pages: PAGES.map(P => P.words.map(q => q.txt)), blush: BLUSH, sets: SETS.map(W => ({ id: W.id, w: W.w || WORD_W })) },
    sleep: [],
    beats: BEATS,
    checks: SETS.map(W => '#' + W.id + ' b').concat(['#cap b', '#wmk', '#oops']),
    hook: ['#w1', '#wmk'],
    copy: [...SETS.flatMap(W => W.lines), OOPS, WMKW, ...PAGES.map(P => P.txt)],
    verify: [
      ...PAGES.map(P => ({ at: f3(P.from + 0.2), sel: '#cap b', test: r => (r && r.t > 680 && r.b < 735 ? null : 'the caption "' + P.txt + '" leaves its band: ' + JSON.stringify(r)) })),
      ...SETS.filter(W => W.at >= 0).map(W => ({ at: f3(W.at + 0.3), sel: '#' + W.id + ' b', test: r => (r && r.t >= 60 && r.b < 405 ? null : W.lines.join(' ') + ' reaches him or the margin: ' + JSON.stringify(r)) })),
    ],
    log: [[0, 'DID YOU KNOW?, him proud'], [AN, 'AI AGENT'], [FARTS, 'FARTS'], [SIXTY, '67 pops, the nods'], [STRAIN, 'the planned silence, the strain'], [FART, 'the fart, the green flash'],
      [SHY, 'shy, the blush, oops'], [L2.at, 'be honest'], [HOW, 'HOW OLD ARE YOU?, he peeks back'], [BELIEVED, 'punch in on believed'], [LAUGH, 'the laugh, the hops'], [f3(END - TAIL), 'the pre roll of frame 0']],
  },
});
