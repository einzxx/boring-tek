/* song1, the ai ai ai music clip. 34.0s, 1080x1920, 60fps.
   the song (hf/song1.mp3) is the whole soundtrack, untouched. the mascot acts out
   every line, every cut and move on the beat grid (128.03 bpm, a beat 0.4686s, bar
   lines from 0.278s), the camera punches on the kicks measured off the song, and
   the karaoke lights each word on the frame it is sung (song1/words.json:
   elevenlabs speech to text on the mix and on the isolated vocal, the lyric mapped
   onto its slots, starts snapped to a vocal onset within 60ms).

   main part, 0 to 32.15s, one hyperframes composition, frame driven. its look is its own:
   seven worlds (riso print, phosphene, chrome studio, bauhaus, warp, pixel night, the void)
   after four clips studied in the prompt-motion gallery, none of our lab styles.
   the end card is promo1's (cinetic-test without the url), 1.85s of it from its BORING slam, and joined
   after the glitch cut on the 32.15 bar line. effects from hf/sfx and lib/sfx.mjs
   sit under the song, set against the vocal where she sings, and a soft limiter on
   the effects bus alone keeps the peak under -1 dBTP. the song is never touched.

   usage: node hf/song1.mjs [--no-render] */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mascot } from './lab/kit.mjs';
import { decode, loudness, SR, VOICES } from '../lib/sfx.mjs';
import { HAND_SHAPES } from '../lib/mascot.mjs';

const here = new URL('.', import.meta.url);
const P = new URL('song1/', here);
const require = createRequire(new URL('../package.json', here));
const FFMPEG = require('ffmpeg-static');
const HF = fileURLToPath(new URL('node_modules/.bin/hyperframes' + (process.platform === 'win32' ? '.cmd' : ''), here));
const OUT = fileURLToPath(new URL('../out/song1-1080x1920.mp4', here));
const V = new URL('../out/verify-song1/', here);
mkdirSync(V, { recursive: true });
mkdirSync(new URL('fonts/', P), { recursive: true });
mkdirSync(new URL('assets/', P), { recursive: true });
const FPS = 60, fr = t => Math.round(t * FPS);
const SONG = fileURLToPath(new URL('song1.mp3', here));

/* ---------- the vocal, word by word ---------- */
const W = JSON.parse(readFileSync(new URL('words.json', P), 'utf8')).map(([text, s, e]) => ({ text, s, e: Math.max(e, s + 0.05) }));
const ws = i => W[i].s, wf = i => fr(W[i].s);

/* ---------- the beat grid and the kicks, measured off the song ---------- */
const BEAT = 60 / 128.03, PH = 0.278;
const beatAt = n => PH + n * BEAT;
const mono = decode(FFMPEG, SONG);
const KICKS = (() => {
  /* low band (under 120 hertz) energy rise around each beat, 5ms hops */
  const H = Math.round(0.005 * SR), a = 1 - Math.exp(-2 * Math.PI * 120 / SR), n = Math.floor(mono.length / H), e = new Float32Array(n);
  let l = 0; for (let k = 0; k < n; k++) { let s = 0; for (let i = k * H; i < (k + 1) * H; i++) { l += a * (mono[i] - l); s += l * l; } e[k] = Math.log(s / H + 1e-10); }
  const out = [];
  for (let b = 0; beatAt(b) < 32.1; b++) {
    const k = Math.round(beatAt(b) / 0.005); let m = 0;
    for (let j = -3; j <= 3; j++) m = Math.max(m, (e[k + j] || 0) - (e[k + j - 2] || 0));
    if (m > 3.3) out.push([fr(beatAt(b)), +Math.min(1, (m - 3.3) / 3 + 0.5).toFixed(2)]);
  }
  return out;
})();
console.log('kicks the camera punches on:', KICKS.length, KICKS.map(([f]) => (f / FPS).toFixed(2)).join(' '));

/* ---------- the girl: girl-4, cleaned, white outline (promo1's sticker) ---------- */
const OUTLINE = 26;
function girlSticker(n) {
  const src = fileURLToPath(new URL('girl/girl-' + n + '.png', here));
  const dst = fileURLToPath(new URL('assets/girl-' + n + '.png', P));
  const probe = spawnSync(FFMPEG, ['-i', src], { encoding: 'utf8' }).stderr.match(/(\d{3,5})x(\d{3,5})/);
  const w = +probe[1], h = +probe[2];
  const raw = spawnSync(FFMPEG, ['-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 }).stdout;
  const N = w * h, A = new Uint8Array(N);
  for (let i = 0; i < N; i++) A[i] = raw[i * 4 + 3];
  const lab = new Int32Array(N).fill(-1), sizes = [], st = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (A[i] < 48 || lab[i] >= 0) continue;
    const id = sizes.length; let sp = 0, cnt = 0; st[sp++] = i; lab[i] = id;
    while (sp) {
      const p = st[--sp]; cnt++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1])
        if (q >= 0 && lab[q] < 0 && A[q] >= 48) { lab[q] = id; st[sp++] = q; }
    }
    sizes.push(cnt);
  }
  const big = Math.max(...sizes), keep = sizes.map(s => s >= Math.max(1500, big * 0.002));
  const M = new Uint8Array(N);
  for (let i = 0; i < N; i++) M[i] = lab[i] >= 0 && keep[lab[i]] ? 1 : 0;
  const M2 = new Uint8Array(N);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; M2[i] = M[i] && M[i - 1] && M[i + 1] && M[i - w] && M[i + w] ? 1 : 0; }
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < N; i++) if (M2[i]) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = OUTLINE + 6, cw = x1 - x0 + 1 + 2 * pad, ch = y1 - y0 + 1 + 2 * pad, CN = cw * ch;
  const D = new Float32Array(CN).fill(1e9);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const sx = x + x0 - pad, sy = y + y0 - pad; if (sx >= 0 && sy >= 0 && sx < w && sy < h && M2[sy * w + sx]) D[y * cw + x] = 0; }
  const relax = (i, j, c) => { if (D[j] + c < D[i]) D[i] = D[j] + c; };
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (x) relax(i, i - 1, 3); if (y) { relax(i, i - cw, 3); if (x) relax(i, i - cw - 1, 4); if (x < cw - 1) relax(i, i - cw + 1, 4); } }
  for (let y = ch - 1; y >= 0; y--) for (let x = cw - 1; x >= 0; x--) { const i = y * cw + x; if (x < cw - 1) relax(i, i + 1, 3); if (y < ch - 1) { relax(i, i + cw, 3); if (x < cw - 1) relax(i, i + cw + 1, 4); if (x) relax(i, i + cw - 1, 4); } }
  const out = Buffer.alloc(CN * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x, d = D[i] / 3;
    const ow = Math.max(0, Math.min(1, OUTLINE - d + 0.5));
    const sx = x + x0 - pad, sy = y + y0 - pad, inside = sx >= 0 && sy >= 0 && sx < w && sy < h && M2[sy * w + sx];
    const k = inside ? (sy * w + sx) * 4 : -1, ga = inside ? raw[k + 3] / 255 : 0, a = ga + ow * (1 - ga);
    for (let c = 0; c < 3; c++) out[i * 4 + c] = a ? Math.round(((inside ? raw[k + c] : 0) * ga + 255 * ow * (1 - ga)) / a) : 0;
    out[i * 4 + 3] = Math.round(a * 255);
  }
  spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', cw + 'x' + ch, '-i', '-', dst], { input: out });
  return { w: cw, h: ch };
}
const GIRL = girlSticker(4);

/* ---------- fonts, kit ---------- */
for (const f of readdirSync(new URL('lab/fonts/', here))) copyFileSync(new URL('lab/fonts/' + f, here), new URL('fonts/' + f, P));
copyFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', here), new URL('gsap.min.js', P));
writeFileSync(new URL('motion.js', P), readFileSync(join(homedir(), '.claude/skills/cinetic/assets/hyperframes-starter/motion.js'), 'utf8')
  .replace('const W = 1920;', 'const W = 1080;').replace('const H = 1080;', 'const H = 1920;'));
for (const h of ['panic-left', 'panic-right', 'wave', 'dance-fist-left', 'dance-fist-right']) copyFileSync(new URL('../assets/hands/' + h + '.svg', here), new URL('assets/' + h + '.svg', P));
const WR = Object.fromEntries(['panic-left', 'panic-right', 'wave', 'dance-fist-left', 'dance-fist-right'].map(k => [k, HAND_SHAPES[k].wrist]));

/* ---------- the timeline, in frames, every number from the song ---------- */
const MAIN = fr(beatAt(68));                         /* the 32.15 bar line: the glitch cut */
const END = fr(34.0) - MAIN;                          /* the end card, to 34.0s */
const EC0 = 58;                                       /* from the end card's BORING slam, so the whole name forms and holds */
const F = {
  land0: fr(beatAt(0)), hop0: fr(beatAt(1)), type0: wf(0), enter: wf(5), plate: fr(beatAt(5)), bite: fr(beatAt(6)),
  B: fr(3.32), think: wf(11), slash: fr(4.02), copy: wf(13), paste: wf(14),
  whip: fr(5.02), C: fr(5.14), girl: wf(16), sound: wf(19), diff: wf(20), lately: wf(21),
  D: fr(7.06), thank: wf(24), upd: wf(27), stamp: fr(beatAt(17)),
  ai1: [wf(28), wf(29), wf(30)], E: wf(28) - 4, help: wf(31), F: wf(31) - 4,
  called: wf(34), G: wf(34) - 3, bot: wf(40), too: wf(41),
  ai2: [wf(42), wf(43), wf(44)], H: wf(42) - 4, I: fr(14.10), need: wf(46), brk: wf(48),
  asked: wf(49), J: wf(49) - 3, ai: wf(51), me: wf(54), too2: wf(55), flop: fr(16.90),
  K1: fr(beatAt(36)), K2: fr(beatAt(40)), roll: fr(beatAt(40)) + 6, K3: fr(beatAt(44)), K4: fr(beatAt(48)), patch: fr(beatAt(52)),
  L: fr(25.60), pill: fr(beatAt(60)), flick: fr(beatAt(62)), droop: fr(beatAt(64)), toot: fr(31.75), look: fr(31.88), glitch: fr(32.03), end: MAIN,
};
F.land2 = fr(beatAt(43));                             /* he lands on the counter on the 20.43 beat */
F.rim = F.flick + 22; F.inBin = F.flick + 36;
const BEATS = Array.from({ length: 70 }, (_, n) => fr(beatAt(n)));
const SECS = [['A', 0], ['B', F.B], ['C', F.C], ['D', F.D], ['E', F.E], ['F', F.F], ['G', F.G], ['H', F.H], ['I', F.I], ['J', F.J], ['K1', F.K1], ['K2', F.K2], ['K3', F.K3], ['K4', F.K4], ['L', F.L]];

/* ---------- karaoke: one group per lyric line, up to two rows, lit on the sung frame ----------
   the six AI words are not here: the giant slams are their karaoke, landing on the sung frame */
const GROUPS = [[[0, 3], [4, 7]], [[8, 11], [12, 14]], [[15, 17]], [[18, 19], [20, 21]], [[22, 25], [26, 27]],
  [[31, 33]], [[34, 36], [37, 41]], [[45, 48]], [[49, 51], [52, 55]]];
const CAPS = GROUPS.map((rows, g) => {
  const a = rows[0][0], z = rows[rows.length - 1][1];
  return { rows: rows.map(([p, q]) => W.slice(p, q + 1).map((w, k) => ({ t: w.text, i: p + k, f: fr(w.s) }))), a, z };
});
CAPS.forEach((c, g) => {
  const prev = CAPS[g - 1];
  c.in = Math.max(fr(W[c.a].s - 0.35), prev ? fr(W[prev.z].s) + 8 : 0);
  if (g === 5) c.in = Math.max(c.in, F.ai1[2] + 6);
  if (g === 7) c.in = Math.max(c.in, F.ai2[2] + 6);
});
CAPS.forEach((c, g) => { const nx = CAPS[g + 1]; c.out = g === 4 ? F.ai1[0] - 2 : g === 6 ? F.ai2[0] - 2 : nx ? nx.in : F.K1; });

/* ---------- picture: seven worlds, none of them ours before ----------
   after four clips in the prompt-motion gallery, studied frame by frame:
     riso print (rneayan): pink and blue inks on cream paper, overprint, out of register plates
     phosphene (monokern): violet dark, iridescent rings, rainbow rays, the opening eye
     chrome studio, bauhaus, warp, slit stripes (lukasersil): chrome on a graphite floor with
       reflections, blue circle red square yellow triangle, streaks to a vanishing point
     pixel night (hoyoyoda): a violet 8 bit city, moon, string lights, side scroll
   for song1 only the house rules are relaxed: glow, bloom, grain and particles are allowed */
const C = {
  paper: '#f2e9d8', pink: '#ff4fa3', blue: '#2c4fff', navy: '#1a1f6b', ink: '#141414', white: '#ffffff',
  vio: '#140726', holoA: '#ff6ad5', holoB: '#7af7ff', holoC: '#b58cff', lime: '#c6ff6b',
  bauCream: '#efe6d2', bauBlue: '#1f48d6', bauRed: '#e2342b', bauYellow: '#f4c21b',
  px0: '#0d0624', px1: '#160a3a', px2: '#22104f', px3: '#2e1566', pxMoon: '#ffe9a8', pxGold: '#ffd84a', pxPink: '#ff6fae', pxCyan: '#62e6ff',
};
const SKIN = {
  riso: { face: C.pink, eye: C.navy, side: C.blue, stroke: 0, filter: 'drop-shadow(9px 7px 0 rgba(44,79,255,.85))', crack: C.navy },
  risoB: { face: C.blue, eye: C.paper, side: C.navy, stroke: 0, filter: 'drop-shadow(-8px 6px 0 rgba(255,79,163,.85))', crack: C.paper },
  holo: { face: '#ffffff', eye: '#1b0d3a', side: '#b58cff', stroke: 0, filter: 'drop-shadow(0 0 22px rgba(255,106,213,.75)) drop-shadow(0 0 54px rgba(122,247,255,.4))', crack: '#1b0d3a' },
  chrome: { face: 'linear-gradient(160deg,#ffffff 0%,#dfe4ea 30%,#8a94a3 48%,#f4f6f9 60%,#aab3c0 82%,#e8ecf1 100%)', eye: '#0b0d12', side: '#3c434d', stroke: 0, filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.55))', crack: '#1a1d23' },
  bau: { face: '#ffffff', eye: C.ink, side: C.ink, stroke: 7, filter: 'drop-shadow(12px 12px 0 rgba(20,20,20,.9))', crack: C.ink },
  warp: { face: '#ffffff', eye: '#0a0b1a', side: '#7c8cff', stroke: 0, filter: 'drop-shadow(0 0 26px rgba(160,200,255,.85))', crack: '#0a0b1a' },
  pixel: { face: '#ffffff', eye: C.px0, side: '#7a5cc4', stroke: 0, filter: 'drop-shadow(10px 10px 0 rgba(6,2,20,.9))', crack: C.px0 },
  void: { face: '#f4f4f4', eye: '#111111', side: '#555555', stroke: 0, filter: 'drop-shadow(0 0 34px rgba(255,255,255,.3))', crack: '#111111' },
};
const HERO_SKIN = { A: 'riso', B: 'riso', C: 'holo', D: 'chrome', E: 'bau', F: 'warp', G: 'pixel', H: 'holo', I: 'void', J: 'riso', K1: 'bau', K2: 'pixel', K3: 'holo', K4: 'chrome', L: 'pixel' };
const CAPSTYLE = { A: 'riso', B: 'riso', C: 'holo', D: 'chrome', F: 'warp', G: 'pixel', I: 'void', J: 'riso', E: 'warp', H: 'holo' };
const secAt = f => { let s = 'A'; for (const [k, a] of SECS) if (f >= a) s = k; return s; };
CAPS.forEach(c => { c.style = CAPSTYLE[secAt(c.rows[0][0].f)]; });

/* the crack, in plate units 0..1, from a hit high on the right */
const CRACK = [
  [[0.64, 0], [0.70, 0.12], [0.66, 0.30], [0.55, 0.42], [0.58, 0.55], [0.47, 0.70], [0.50, 0.86], [0.42, 1.0]],
  [[0.66, 0.30], [0.80, 0.24], [0.92, 0.31], [1.0, 0.27]],
  [[0.58, 0.55], [0.72, 0.63], [0.80, 0.79], [0.90, 0.86]],
  [[0.55, 0.42], [0.38, 0.37], [0.25, 0.46], [0.08, 0.42]],
  [[0.47, 0.70], [0.32, 0.76], [0.22, 0.92]],
];
const HS = 300, PLATE = HS * 60 / 64, POFF = HS * 2 / 64;
const crackSvg = `<svg class="crk" width="${PLATE}" height="${PLATE}" style="position:absolute;left:0;top:0;overflow:visible">${CRACK.map(p => `<polyline class="crl" points="${p.map(q => (q[0] * PLATE).toFixed(1) + ',' + (q[1] * PLATE).toFixed(1)).join(' ')}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" fill="none" stroke="#141414" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}</svg>`;
const cpts = CRACK[0].map(([x, y]) => [((POFF + x * PLATE) / HS * 100).toFixed(2), ((POFF + y * PLATE) / HS * 100).toFixed(2)]);
const halfL = `polygon(0% 0%,${cpts[0][0]}% 0%,${cpts.map(p => p[0] + '% ' + p[1] + '%').join(',')},${cpts[cpts.length - 1][0]}% 100%,0% 100%)`;
const halfR = `polygon(${cpts[0][0]}% 0%,100% 0%,100% 100%,${cpts[cpts.length - 1][0]}% 100%,${[...cpts].reverse().map(p => p[0] + '% ' + p[1] + '%').join(',')})`;

/* ---------- textures made here: paper grain ---------- */
{
  const N = 256, raw = Buffer.alloc(N * N * 4); let s = 0x5eed1;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000) / 1000; };
  for (let i = 0; i < N * N; i++) { const v = Math.round(110 + 145 * rnd()); raw[i * 4] = raw[i * 4 + 1] = raw[i * 4 + 2] = v; raw[i * 4 + 3] = 255; }
  spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', N + 'x' + N, '-i', '-', fileURLToPath(new URL('assets/grain.png', P))], { input: raw });
}

/* ---------- pixel art, drawn in node on a 12px grid ---------- */
const PX = 12;
function prng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const rect = (x, y, w, h, c, cls = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${cls ? ` class="${cls}"` : ''}/>`;
function pxSky(seed, moon) {
  const r = prng(seed); let s = '';
  [[0, 44, C.px0], [44, 36, C.px1], [80, 34, C.px2], [114, 46, C.px3]].forEach(([y, h, c]) => { s += rect(0, y, 90, h, c); });
  for (let y = 40; y < 118; y += 6) for (let x = (y / 6) % 2 ? 0 : 3; x < 90; x += 6) s += rect(x, y, 1, 1, 'rgba(255,255,255,.04)');
  for (let i = 0; i < 80; i++) { const x = Math.floor(r() * 90), y = Math.floor(r() * 100); s += rect(x, y, 1, 1, ['#ffffff', '#ffd84a', '#9fe9ff'][i % 3], 'tw tw' + (i % 4)); }
  for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 86) + 2, y = Math.floor(r() * 80) + 4; s += rect(x - 1, y, 3, 1, '#ffffff', 'tw tw' + (i % 4)) + rect(x, y - 1, 1, 3, '#ffffff', 'tw tw' + (i % 4)); }
  if (moon) {
    const [mx, my, mr] = moon;
    for (let y = -mr - 3; y <= mr + 3; y++) for (let x = -mr - 3; x <= mr + 3; x++) { const d = Math.hypot(x, y); if (d > mr && d <= mr + 2.5) s += rect(mx + x, my + y, 1, 1, 'rgba(255,233,168,' + (d <= mr + 1.2 ? .28 : .12) + ')'); }
    for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) if (x * x + y * y <= mr * mr) s += rect(mx + x, my + y, 1, 1, (x + y > mr * 0.9) ? '#f3cf7a' : C.pxMoon);
    [[-3, -2, 2], [2, 3, 1], [4, -4, 1], [-1, 4, 1]].forEach(([x, y, k]) => { s += rect(mx + x, my + y, k + 1, k, '#eac06a'); });
  }
  return s;
}
function pxCity(seed, { y0, hMin, hMax, wMin, wMax, col, win = 0, cross = -1 }) {
  const r = prng(seed); let s = '', x = 0, n = 0;
  while (x < 180) {
    const w = wMin + Math.floor(r() * (wMax - wMin)), h = hMin + Math.floor(r() * (hMax - hMin));
    s += rect(x, y0 - h, w, h + 60, col);
    if (r() < 0.5) s += rect(x + 1, y0 - h - 2, Math.max(1, Math.floor(w / 3)), 2, col);
    if (win) for (let yy = y0 - h + 2; yy < y0 - 1; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) { const q = r(); if (q < win) s += rect(xx, yy, 1, 1, q < win * 0.3 ? C.pxPink : C.pxGold, 'win w' + (n++ % 3)); }
    if (n === 0 && cross >= 0) {}
    x += w + (r() < 0.3 ? 1 : 0);
  }
  return s;
}
function pxLights(seed, y, sag, cols) {
  const r = prng(seed); let s = '', k = 0;
  for (let seg = 0; seg < 180; seg += 30) {
    for (let x = 0; x <= 30; x++) {
      const yy = Math.round(y + sag * Math.sin(Math.PI * x / 30));
      s += rect(seg + x, yy, 1, 1, 'rgba(20,10,40,.9)');
      if (x % 3 === 1) s += rect(seg + x, yy + 1, 1, 1, cols[k % cols.length], 'bulb b' + (k++ % 4));
    }
  }
  return s;
}
const svgPx = (w, h, inner, id = '', style = '') => `<svg${id ? ` id="${id}"` : ''} class="pxsvg" width="${w * PX}" height="${h * PX}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" style="${style}">${inner}</svg>`;
const PXG = {
  sky: svgPx(90, 160, pxSky(0x51, [68, 22, 8])),
  far: svgPx(180, 160, pxCity(0x77, { y0: 100, hMin: 14, hMax: 34, wMin: 6, wMax: 12, col: '#2a1659', win: 0.12 }), 'gFar'),
  near: svgPx(180, 160, pxCity(0x91, { y0: 100, hMin: 6, hMax: 22, wMin: 8, wMax: 16, col: '#170b37', win: 0.32 }) + pxLights(0x3, 64, 5, [C.pxGold, C.pxPink, C.pxCyan, '#a6ff6b']), 'gNear'),
};
/* the clinic: a pixel building with a cross sign, on the near layer's left */
const clinic = svgPx(30, 40, rect(2, 10, 26, 40, '#21104a') + [0, 1, 2, 3, 4].map(i => [0, 1, 2, 3].map(j => rect(5 + j * 6, 18 + i * 4, 3, 2, (i + j) % 3 ? C.pxGold : '#3b2a7a', 'win w' + ((i + j) % 3))).join('')).join('') +
  rect(9, 1, 12, 8, '#ffffff', 'crossBox') + rect(13, 2, 4, 6, '#ff3b5c', 'cross') + rect(11, 4, 8, 2, '#ff3b5c', 'cross'), 'clinic', 'position:absolute;left:30px;top:640px');
const PXL = {
  sky: svgPx(90, 160, pxSky(0x2b, [62, 18, 12])),
  far: svgPx(180, 160, pxCity(0x35, { y0: 112, hMin: 12, hMax: 30, wMin: 6, wMax: 12, col: '#2a1659', win: 0.1 }), 'lFar'),
  roof: svgPx(90, 160, rect(0, 110, 90, 50, '#1a0c3a') + (() => { let s = ''; for (let x = 0; x < 90; x += 4) s += rect(x, 110, 3, 1, '#3a2276') + rect(x + 2, 113, 2, 1, '#26134f'); for (let x = 0; x < 90; x += 7) s += rect(x, 116, 1, 44, '#140a2e'); return s; })() + pxLights(0x9, 96, 4, [C.pxGold, C.pxPink, C.pxCyan, '#a6ff6b'])),
  shoot: svgPx(14, 6, rect(13, 0, 1, 1, '#ffffff') + rect(10, 1, 3, 1, 'rgba(255,255,255,.8)') + rect(6, 2, 4, 1, 'rgba(160,220,255,.6)') + rect(1, 3, 5, 1, 'rgba(160,220,255,.3)'), 'shoot', 'position:absolute;left:0;top:0'),
};
const pxBin = svgPx(14, 16, rect(1, 2, 12, 1, '#ffffff') + rect(5, 0, 4, 2, '#ffffff') + rect(2, 3, 10, 13, '#ffffff') + rect(3, 4, 8, 11, '#3a1d74') + [4, 7, 10].map(x => rect(x, 5, 1, 9, '#5b3aa8')).join(''), 'bin', 'position:absolute;left:0;top:0');
const pxCoin = svgPx(6, 6, rect(1, 0, 4, 6, '#ffd84a') + rect(0, 1, 6, 4, '#ffd84a') + rect(2, 1, 1, 4, '#fff3b0') + rect(4, 1, 1, 4, '#d9a21c'));

/* the riso burger, two inks */
const burger = `<svg width="280" height="210" viewBox="-140 -120 280 210" style="overflow:visible">
  <defs><pattern id="hatchB" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="${C.blue}"/></pattern>
  <pattern id="dotP" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3" fill="${C.pink}"/></pattern></defs>
  <g style="mix-blend-mode:multiply">
  <ellipse cx="6" cy="72" rx="132" ry="24" fill="none" stroke="${C.blue}" stroke-width="8"/>
  <path d="M-84 44 H84 Q84 62 66 62 H-66 Q-84 62 -84 44Z" fill="${C.pink}"/>
  <rect x="-92" y="20" width="184" height="26" rx="13" fill="${C.navy}"/>
  <path d="M-94 16 q16 -14 31 0 q16 -14 31 0 q16 -14 31 0 q16 -14 31 0 q16 -14 31 0 q16 -14 31 0" stroke="${C.blue}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M-88 4 a88 70 0 0 1 176 0 Z" fill="${C.pink}"/>
  <path d="M-80 4 a80 62 0 0 1 160 0 Z" fill="url(#hatchB)" opacity=".55" transform="translate(6 4)"/>
  ${[[-40, -30], [-8, -44], [26, -32], [52, -14], [-60, -10], [10, -16]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.5" fill="${C.paper}"/>`).join('')}
  </g></svg>`;
const keyCap = (id, k) => `<div class="key" id="${id}"><span class="kc">CTRL</span><span class="kk">${k}</span></div>`;
const handImg = (id, name) => `<img class="hand" id="${id}" src="assets/${name}.svg">`;
const tri = (id, s, c) => `<svg class="abs" id="${id}" width="${s}" height="${s}" viewBox="0 0 100 100" style="overflow:visible"><polygon points="50,4 98,92 2,92" fill="${c}"/></svg>`;
/* the eye: an almond, the iris a rainbow ring */
const EYE = { cx: 540, cy: 780, w: 900, h: 470 };
const almond = `M0 ${EYE.h / 2} C ${EYE.w * 0.25} ${-EYE.h * 0.15} ${EYE.w * 0.75} ${-EYE.h * 0.15} ${EYE.w} ${EYE.h / 2} C ${EYE.w * 0.75} ${EYE.h * 1.15} ${EYE.w * 0.25} ${EYE.h * 1.15} 0 ${EYE.h / 2} Z`;

const css = `
@font-face{font-family:"Archivo Black";src:url("fonts/archivo-black.woff2") format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"Archivo Wide";src:url("fonts/archivo-wide.woff2") format("woff2");font-weight:900;font-display:block}
@font-face{font-family:"JetBrains Mono";src:url("fonts/jbmono.woff2") format("woff2");font-weight:500;font-display:block}
@font-face{font-family:"Silkscreen";src:url("fonts/silkscreen-400.woff2") format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"Silkscreen";src:url("fonts/silkscreen-700.woff2") format("woff2");font-weight:700;font-display:block}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
.clip{position:absolute;inset:0;overflow:hidden;background:#000}
.layer{position:absolute;left:0;top:0;width:1080px;height:1920px}
#cam{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 860px}
.world{position:absolute;left:0;top:0;width:1080px;height:1920px;display:none}
.bg{position:absolute;left:-120px;top:-160px;width:1320px;height:2240px;overflow:hidden}
.abs{position:absolute;left:0;top:0}
.m{position:absolute;left:0;top:0}.m-sq{position:absolute;inset:0;perspective:1300px}.m-r{position:absolute;transform-style:preserve-3d}
.m-slab,.m-face{position:absolute;inset:0;border-radius:50%}.m-face{overflow:hidden;transform:translateZ(0);box-sizing:border-box}.m-eye{position:absolute}
.hand{position:absolute;left:0;top:0;width:400px;height:400px;filter:drop-shadow(0 10px 0 rgba(0,0,0,.28))}
.grainL{position:absolute;inset:-260px;background:url("assets/grain.png");pointer-events:none}
.pxsvg{position:absolute;left:0;top:0;image-rendering:pixelated}
/* riso */
.paper{background:${C.paper}}
.dots{position:absolute;background-size:22px 22px;mix-blend-mode:multiply}
.hatch{position:absolute;mix-blend-mode:multiply}
#pbox{position:absolute;left:150px;top:1120px;width:780px;height:150px;border-radius:22px;background:${C.paper};border:7px solid ${C.blue};box-sizing:border-box;box-shadow:12px 10px 0 ${C.pink};font:500 54px "JetBrains Mono";color:${C.blue};display:flex;align-items:center;padding:0 40px;white-space:pre}
#pcur{display:inline-block;width:28px;height:58px;background:${C.pink};margin-left:4px}
.key{position:absolute;left:0;top:0;width:620px;height:250px;border-radius:40px;background:${C.pink};border:9px solid ${C.blue};box-sizing:border-box;box-shadow:16px 14px 0 rgba(44,79,255,.85);display:flex;align-items:center;justify-content:center;gap:34px;mix-blend-mode:multiply}
.key .kc{font:500 54px "JetBrains Mono";color:${C.navy};letter-spacing:.06em}
.key .kk{font:900 190px "Archivo Wide";color:${C.navy};line-height:1}
#slashB{position:absolute;left:0;top:0;width:560px;height:18px;background:${C.pink};border-radius:9px;mix-blend-mode:multiply}
/* phosphene */
.ring{position:absolute;left:0;top:0;border-radius:50%;box-sizing:border-box}
.rays{position:absolute;left:-1060px;top:-760px;width:3200px;height:3200px;border-radius:50%}
#gdisc{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.0) 40%,rgba(122,247,255,.25) 58%,rgba(255,106,213,.45) 66%,rgba(181,140,255,.0) 72%);filter:blur(1px)}
#gfloor{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(122,247,255,.75),rgba(255,106,213,.35) 55%,transparent);filter:blur(4px)}
/* chrome */
.floor{position:absolute;left:-400px;top:1180px;width:1880px;height:1400px;transform-origin:50% 0;transform:perspective(700px) rotateX(70deg);background-color:#0e1014;background-image:linear-gradient(rgba(255,255,255,.10) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.10) 2px,transparent 2px);background-size:120px 120px}
.horizon{position:absolute;left:0;top:1170px;width:1320px;height:24px;background:radial-gradient(closest-side,rgba(180,210,255,.55),transparent);filter:blur(6px)}
.sph{position:absolute;border-radius:50%;background:radial-gradient(circle at 34% 28%,#ffffff 0,#eef2f6 10%,#9aa4b2 34%,#2b3038 62%,#5d6672 78%,#d9dfe7 94%);-webkit-box-reflect:below 2px linear-gradient(transparent 55%,rgba(255,255,255,.3))}
.cube{position:absolute;background:linear-gradient(135deg,#ffffff 0%,#c9d0d9 25%,#5b6470 50%,#eef1f5 70%,#8d97a4 100%);border-radius:18px;-webkit-box-reflect:below 2px linear-gradient(transparent 55%,rgba(255,255,255,.3))}
#tube{position:absolute;left:160px;top:1000px;width:760px;height:74px;border-radius:37px;border:3px solid rgba(255,255,255,.6);box-sizing:border-box;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.02) 50%,rgba(255,255,255,.1));overflow:hidden;box-shadow:0 0 30px rgba(140,180,255,.2)}
#tubeF{position:absolute;left:4px;top:4px;bottom:4px;width:calc(100% - 8px);border-radius:30px;transform-origin:0 50%;background:linear-gradient(180deg,#ffffff 0%,#cfd6df 30%,#6c7684 55%,#e9edf2 75%,#9aa4b2 100%)}
#tubeS{position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.9) 50%,transparent 65%);background-size:300% 100%;mix-blend-mode:screen}
.mono{position:absolute;font:500 44px "JetBrains Mono";color:#e8ecf3;letter-spacing:.08em;white-space:nowrap}
.med{position:absolute;left:0;top:0;border-radius:50%;background:linear-gradient(150deg,#ffffff 0%,#d6dce4 28%,#6f7987 50%,#f0f3f7 66%,#9aa4b2 100%);box-shadow:inset 0 0 0 8px rgba(255,255,255,.55),inset 0 -14px 20px rgba(0,0,0,.35),0 20px 40px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:400 96px "Archivo Black";color:#2a2f38;text-shadow:0 2px 0 rgba(255,255,255,.7),0 -2px 0 rgba(0,0,0,.35);overflow:hidden;white-space:nowrap}
.medSh{position:absolute;top:-60px;left:0;width:70px;height:400px;background:rgba(255,255,255,.85);filter:blur(6px)}
.flare{position:absolute;left:0;top:0;width:1600px;height:14px;border-radius:7px;background:radial-gradient(closest-side,rgba(255,255,255,1),rgba(140,190,255,.7) 30%,rgba(140,190,255,0));filter:blur(2px)}
.flareDot{position:absolute;left:0;top:0;width:220px;height:220px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,1),rgba(170,210,255,.45) 35%,transparent)}
/* bauhaus */
.big{position:absolute;left:0;width:1080px;text-align:center;font:900 300px "Archivo Wide";line-height:1;white-space:nowrap;letter-spacing:-.02em}
/* warp */
.streak{position:absolute;left:0;top:0;height:4px;border-radius:2px;transform-origin:0 50%}
.siren{position:absolute;top:-200px;width:900px;height:2400px;border-radius:50%}
/* the eye */
#eyeW{position:absolute;left:${EYE.cx - EYE.w / 2}px;top:${EYE.cy - EYE.h / 2}px;width:${EYE.w}px;height:${EYE.h}px;transform-origin:50% 50%}
#eyeClip{position:absolute;inset:0;clip-path:path("${almond}");background:radial-gradient(closest-side,#ffffff 0%,#f4eaff 60%,#d3c1ff 100%)}
#iris{position:absolute;border-radius:50%;background:conic-gradient(from 0deg,#ff6ad5,#ffd36a,#c6ff6b,#7af7ff,#8a7bff,#ff6ad5);box-shadow:0 0 40px rgba(255,106,213,.8)}
#irisIn{position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(rgba(20,6,40,.35) 0 3deg,transparent 3deg 9deg),radial-gradient(circle,rgba(20,6,40,.0) 30%,rgba(20,6,40,.55) 100%)}
#pupil{position:absolute;border-radius:50%;background:#05010d}
#eyeRim{position:absolute;inset:-14px;overflow:visible}
.kal{position:absolute;left:-1060px;top:-700px;width:3200px;height:3200px;border-radius:50%}
/* void */
.dust{position:absolute;left:0;top:0;border-radius:50%;background:#fff}
.slit{position:absolute;left:0;width:1080px}
/* pixel */
.scan{position:absolute;inset:0;background:repeating-linear-gradient(rgba(0,0,0,.16) 0 3px,transparent 3px 6px);pointer-events:none}
.pxwin{position:absolute;left:0;top:0;background:#ffffff;box-shadow:0 0 0 6px #120a2e,12px 12px 0 6px #000;font:700 44px "Silkscreen";color:#120a2e;white-space:nowrap}
.pxwin .bar{background:#ff6fae;color:#fff;font:700 28px "Silkscreen";padding:4px 14px;display:flex;justify-content:space-between}
.pxwin .body{padding:18px 26px}
#score{position:absolute;left:0;width:1080px;text-align:center;font:700 330px "Silkscreen";line-height:1;color:#ffd84a;text-shadow:16px 16px 0 #ff2f87,0 0 40px rgba(255,216,74,.55)}
#hiLbl{position:absolute;left:0;width:1080px;text-align:center;font:700 60px "Silkscreen";color:#62e6ff;text-shadow:6px 6px 0 #3a1d74}
.coin{position:absolute;left:0;top:0;width:72px;height:72px}
.puff{position:absolute;left:0;top:0;background:#f4f0ff;box-shadow:0 0 0 6px #2e1566}
/* bauhaus equalizer */
.bs{position:absolute;left:0;top:0;transform-origin:50% 100%}
/* the bubble */
#aib{position:absolute;left:0;top:0;width:0;height:0}
#aibB{position:absolute;background:#fff;border:7px solid ${C.ink};border-radius:56px;box-sizing:border-box;overflow:hidden}
#aibB i{position:absolute;width:44px;height:16px;border-radius:8px;background:${C.ink}}
#aiT{position:absolute;left:0;width:100%;text-align:center;font:400 62px "Archivo Black";color:${C.ink};white-space:nowrap}
.dot{position:absolute;border-radius:50%;background:#fff;border:6px solid ${C.ink};box-sizing:border-box}
/* transitions */
#fx{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none}
#roll{position:absolute;left:-40px;width:1160px;height:46px;border-radius:23px;background:linear-gradient(180deg,#8fa3ff,${C.blue} 40%,${C.navy});box-shadow:0 8px 24px rgba(0,0,0,.35)}
.lid{position:absolute;left:-200px;width:1480px;height:1100px;background:#05010d}
.sbar{position:absolute;left:0;width:1080px;height:120px}
#tcirc{position:absolute;left:540px;top:900px;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;background:${C.bauBlue}}
.mz{position:absolute;width:90px;height:90px}
#tear{position:absolute;left:0;top:0;width:1080px;height:2000px}
#flood{position:absolute;left:0;top:0;width:1080px;height:2400px;background:linear-gradient(180deg,#ffffff 0%,#cfd6df 8%,#6c7684 20%,#e9edf2 32%,#9aa4b2 50%,#3c434d 100%)}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
/* karaoke */
#caps{position:absolute;left:0;top:0;width:1080px;height:1920px}
.cap{position:absolute;left:70px;width:940px;bottom:320px;text-align:center;display:none}
.capb{display:inline-block;padding:16px 32px 20px;border-radius:26px;font-family:"Archivo Black";line-height:1.12}
.row{white-space:nowrap}
.w{display:inline-block;margin:0 .13em;transform-origin:50% 70%}
.cap.riso .capb{background:rgba(242,233,216,.95);border:5px solid ${C.blue};box-shadow:10px 8px 0 ${C.pink}}
.cap.riso .w{color:rgba(44,79,255,.42)}
.cap.riso .w.lit{color:${C.pink}}
.cap.holo .capb{background:rgba(14,4,32,.84);box-shadow:0 0 50px rgba(255,106,213,.35),inset 0 0 0 3px rgba(122,247,255,.4)}
.cap.holo .w{color:rgba(255,255,255,.34)}
.cap.holo .w.lit{background-image:linear-gradient(100deg,#ff6ad5 0%,#ffffff 20%,#7af7ff 40%,#b58cff 60%,#ffffff 80%,#ff6ad5 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 12px rgba(255,106,213,.75))}
.cap.chrome .capb{background:rgba(8,9,12,.86);border:2px solid rgba(255,255,255,.28);box-shadow:0 20px 50px rgba(0,0,0,.6)}
.cap.chrome .w{color:rgba(255,255,255,.3)}
.cap.chrome .w.lit{background-image:linear-gradient(100deg,transparent 40%,rgba(255,255,255,1) 50%,transparent 60%),linear-gradient(180deg,#ffffff 0%,#e4e8ee 38%,#7d8796 52%,#f4f6f9 66%,#c3cad4 100%);background-size:300% 100%,100% 100%;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 8px rgba(200,220,255,.45))}
.cap.pixel .capb{font-family:"Silkscreen";font-weight:700;background:#120a2e;border-radius:0;box-shadow:0 0 0 6px #ffffff,0 0 0 12px #3a1d74,16px 16px 0 12px rgba(0,0,0,.7)}
.cap.pixel .w{color:rgba(255,255,255,.35)}
.cap.pixel .w.lit{color:#ffe66d;text-shadow:6px 6px 0 #ff2f87}
.cap.warp .capb{background:rgba(2,3,14,.82);box-shadow:0 0 40px rgba(120,160,255,.35)}
.cap.warp .w{color:rgba(255,255,255,.32)}
.cap.warp .w.lit{color:#ffffff}
.cap.void .capb{background:rgba(0,0,0,.55)}
.cap.void .w{color:rgba(255,255,255,.28)}
.cap.void .w.lit{color:#ffffff;text-shadow:0 0 20px rgba(255,255,255,.85)}
#glitchL{position:absolute;inset:0;pointer-events:none}
.gs{position:absolute;left:0;width:1080px;overflow:hidden}
`;

const W_ = (id, inner, cls = '') => `<div class="world ${cls}" id="w${id}">${inner}</div>`;
const grainL = (id, op, mode) => `<div class="grainL" id="${id}" style="opacity:${op};mix-blend-mode:${mode}"></div>`;
const halftone = (x, y, r, col, size = 22) => `<div class="dots" style="left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background-image:radial-gradient(circle,${col} 0 36%,transparent 40%);background-size:${size}px ${size}px"></div>`;
const hatch = (style, col, ang = 45, gap = 18, th = 5) => `<div class="hatch" style="${style};background:repeating-linear-gradient(${ang}deg,${col} 0 ${th}px,transparent ${th}px ${gap}px)"></div>`;
const clones = Array.from({ length: 16 }, (_, i) => mascot('c' + i, HS, { face: C.pink, eye: C.navy, side: C.blue, layers: 8, depth: 2.2 })).join('');
const ringDivs = (p, n) => Array.from({ length: n }, (_, i) => `<div class="ring" id="${p}${i}"></div>`).join('');
const html = `
<div id="cam">
  ${W_('A', `<div class="bg paper"><div style="position:absolute;left:470px;top:300px;width:720px;height:720px;border-radius:50%;background:${C.pink};mix-blend-mode:multiply;opacity:.9" id="aSun"></div>
    ${halftone(330, 520, 300, C.blue, 24)}${hatch('left:120px;top:1540px;width:1320px;height:140px', 'rgba(44,79,255,.55)', -45, 20, 6)}
    <div style="position:absolute;left:220px;top:250px;width:700px;height:700px;border-radius:50%;border:8px solid ${C.blue};mix-blend-mode:multiply" id="aRing"></div>${grainL('grA', .22, 'multiply')}</div>
    <div class="abs" id="scA"><div id="pbox"><span id="ptxt"></span><span id="pcur"></span></div><div class="abs" id="plate">${burger}</div></div>`)}
  ${W_('B', `<div class="bg paper">${halftone(260, 420, 420, C.blue, 26)}${hatch('left:0;top:0;width:1320px;height:2240px', 'rgba(255,79,163,.18)', 30, 34, 10)}
    <div style="position:absolute;left:820px;top:1260px;width:520px;height:520px;background:${C.pink};mix-blend-mode:multiply;transform:rotate(18deg)" id="bSq"></div>${grainL('grB', .22, 'multiply')}</div>
    <div class="abs" id="scB"><svg class="abs" id="spin" width="300" height="300" viewBox="-150 -150 300 300">${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 2 * Math.PI; return `<line id="sp${i}" x1="${(96 * Math.sin(a)).toFixed(1)}" y1="${(-96 * Math.cos(a)).toFixed(1)}" x2="${(130 * Math.sin(a)).toFixed(1)}" y2="${(-130 * Math.cos(a)).toFixed(1)}" stroke="${C.blue}" stroke-width="18" stroke-linecap="round"/>`; }).join('')}</svg><div id="slashB"></div>${keyCap('keyC', 'C')}${keyCap('keyV', 'V')}</div>`)}
  ${W_('C', `<div class="bg" style="background:radial-gradient(80% 60% at 50% 45%,#3a1170 0%,${C.vio} 58%,#06020f 100%)"><div class="rays" id="raysC" style="background:repeating-conic-gradient(from 0deg,rgba(255,106,213,.16) 0 5deg,rgba(122,247,255,.13) 5deg 10deg,rgba(181,140,255,.15) 10deg 15deg,transparent 15deg 30deg)"></div>${ringDivs('rC', 12)}${grainL('grC', .10, 'overlay')}</div>
    <div class="abs" id="scC"><div id="gfloor"></div><div id="gdisc"></div><svg class="abs" width="1080" height="1920" style="overflow:visible;filter:drop-shadow(0 0 12px rgba(255,106,213,.9))"><defs><linearGradient id="holoG" x1="0" x2="1"><stop offset="0" stop-color="#ff6ad5"/><stop offset=".35" stop-color="#7af7ff"/><stop offset=".7" stop-color="#c6ff6b"/><stop offset="1" stop-color="#b58cff"/></linearGradient></defs><path id="wav" fill="none" stroke="url(#holoG)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="abs" id="g4"><div class="abs" id="g4sq"><img src="assets/girl-4.png" style="display:block;width:${GIRL.w}px;height:${GIRL.h}px;filter:drop-shadow(0 0 30px rgba(255,106,213,.45))"></div></div></div>`)}
  ${W_('D', `<div class="bg" style="background:linear-gradient(180deg,#262a32 0%,#14161a 52%,#07080a 100%)"><div class="floor" id="floorD"></div><div class="horizon"></div>${grainL('grD', .08, 'overlay')}</div>
    <div class="abs" id="scD"><div class="sph" id="sphD" style="left:70px;top:1190px;width:170px;height:170px"></div><div class="cube" id="cubeD" style="left:850px;top:1220px;width:120px;height:120px"></div>
    <div class="mono" id="prgL" style="left:160px;top:930px">UPDATING</div><div class="mono" id="prgP" style="left:620px;top:930px;width:300px;text-align:right">0%</div>
    <div id="tube"><div id="tubeF"><div id="tubeS"></div></div></div><div class="med" id="med" style="width:200px;height:200px">V2<div class="medSh" id="medSh"></div></div><div class="flare" id="flareD"></div><div class="flareDot" id="flareDotD"></div></div>`)}
  ${W_('E', `<div class="bg" style="background:${C.bauCream}">${grainL('grE', .14, 'multiply')}</div>
    <div class="abs" id="scE"><div class="abs" id="bC" style="width:760px;height:760px;border-radius:50%;background:${C.bauBlue}"></div><div class="abs" id="bS" style="width:600px;height:600px;background:${C.bauRed}"></div>${tri('bT', 700, C.bauYellow)}
    <div class="abs" id="bBar" style="width:1300px;height:60px;background:${C.ink}"></div><div class="big" id="aw0" style="color:${C.ink}">AI</div><div class="big" id="aw1" style="color:${C.ink}">AI</div><div class="big" id="aw2" style="color:${C.ink}">AI</div></div>`)}
  ${W_('F', `<div class="bg" style="background:radial-gradient(60% 40% at 50% 46%,#16204a 0%,#05060f 60%,#000 100%)"><div class="siren" id="sirL" style="left:-560px;background:radial-gradient(closest-side,rgba(255,40,70,.75),transparent)"></div><div class="siren" id="sirR" style="left:980px;background:radial-gradient(closest-side,rgba(40,90,255,.8),transparent)"></div></div>
    <div class="abs" id="scF">${Array.from({ length: 110 }, (_, i) => `<div class="streak" id="st${i}"></div>`).join('')}</div>${handImg('hpL', 'panic-left')}${handImg('hpR', 'panic-right')}`)}
  ${W_('G', `<div class="bg" style="background:${C.px0}"><div class="abs" style="left:120px;top:160px">${PXG.sky}</div><div class="abs" style="left:120px;top:160px" id="gFarW">${PXG.far}</div><div class="abs" style="left:120px;top:160px" id="gNearW">${PXG.near}</div><div class="abs" style="left:120px;top:160px">${clinic}</div><div class="scan"></div></div>
    <div class="abs" id="scG"><svg class="abs" id="steth" width="400" height="420" viewBox="-200 -120 400 420" style="overflow:visible"><path d="M-128 60 C-118 176 -46 214 0 218 C46 214 118 176 128 60" fill="none" stroke="#9fb4dc" stroke-width="14" stroke-linecap="round"/><path d="M0 218 L32 252" stroke="#9fb4dc" stroke-width="14" stroke-linecap="round"/><circle cx="44" cy="266" r="28" fill="#c9d6ee" stroke="#0b1430" stroke-width="6"/></svg>
    <svg class="abs" id="ant" width="120" height="160" viewBox="-60 -150 120 160" style="overflow:visible"><line x1="0" y1="0" x2="0" y2="-104" stroke="#c9d6ee" stroke-width="12" stroke-linecap="round"/><circle cx="0" cy="-118" r="24" fill="#ff3b5c"/></svg>
    ${mascot('doc', 340, { face: '#f4f7ff', eye: '#0b1430', side: '#8fa3d6', layers: 12, depth: 2.6, extra: '<div style="position:absolute;left:0;top:13%;width:100%;height:12px;background:#8fa3d6"></div><div style="position:absolute;left:26%;top:4%;width:24%;height:24%;border-radius:50%;background:#dfe7f5;border:7px solid #8fa3d6;box-sizing:border-box"></div>' })}${handImg('hw', 'wave')}
    ${Array.from({ length: 8 }, (_, i) => `<div class="abs" id="pk${i}" style="width:24px;height:24px;background:${['#ffd84a', '#62e6ff', '#ff6fae', '#ffffff'][i % 4]}"></div>`).join('')}</div>`)}
  ${W_('H', `<div class="bg" style="background:radial-gradient(70% 50% at 50% 42%,#3b0f6e 0%,#16052e 55%,#05010d 100%)"><div class="kal" id="kalH" style="background:repeating-conic-gradient(from 0deg,rgba(255,106,213,.22) 0 7deg,transparent 7deg 15deg,rgba(122,247,255,.2) 15deg 22deg,transparent 22deg 30deg)"></div><div class="kal" id="kalH2" style="background:repeating-radial-gradient(circle at 50% 50%,rgba(181,140,255,.0) 0 60px,rgba(181,140,255,.22) 60px 68px,rgba(181,140,255,0) 68px 120px)"></div>${grainL('grH', .1, 'overlay')}</div>
    <div class="abs" id="scH"><div id="eyeW"><svg id="eyeRim" width="${EYE.w + 28}" height="${EYE.h + 28}" viewBox="-14 -14 ${EYE.w + 28} ${EYE.h + 28}" style="position:absolute;left:-14px;top:-14px;overflow:visible;filter:drop-shadow(0 0 18px rgba(255,106,213,.95)) drop-shadow(0 0 40px rgba(122,247,255,.6))"><defs><linearGradient id="rimG" x1="0" x2="1"><stop offset="0" stop-color="#7af7ff"/><stop offset=".5" stop-color="#ff6ad5"/><stop offset="1" stop-color="#c6ff6b"/></linearGradient></defs><path d="${almond}" fill="none" stroke="url(#rimG)" stroke-width="12"/></svg>
      <div id="eyeClip"><div id="iris"><div id="irisIn"></div></div><div id="pupil"></div></div></div>
      <div class="big" id="bw" style="color:#fff;background-image:linear-gradient(100deg,#ff6ad5,#ffffff,#7af7ff,#b58cff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(255,106,213,.85))">AI</div></div>`)}
  ${W_('I', `<div class="bg" style="background:#000"><div class="abs" id="spot" style="left:120px;top:160px;width:1080px;height:1920px;background:radial-gradient(38% 55% at 50% 44%,rgba(255,255,255,.22),rgba(255,255,255,.05) 60%,transparent 75%)"></div><div class="abs" style="left:420px;top:1130px;width:600px;height:90px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.35),transparent)"></div>${grainL('grI', .12, 'screen')}</div>
    <div class="abs" id="scI">${Array.from({ length: 40 }, (_, i) => `<div class="dust" id="du${i}"></div>`).join('')}</div>`)}
  ${W_('J', `<div class="bg paper">${hatch('left:0;top:0;width:1320px;height:2240px', 'rgba(44,79,255,.32)', 45, 22, 5)}<div style="position:absolute;left:640px;top:250px;width:560px;height:560px;border-radius:50%;background:${C.pink};mix-blend-mode:multiply"></div>${halftone(860, 530, 280, C.blue, 24)}${grainL('grJ', .22, 'multiply')}</div>`)}
  ${W_('K1', `<div class="bg" style="background:${C.bauBlue}"><div class="abs" id="kQ" style="left:-80px;top:40px;width:640px;height:640px;border-radius:0 0 100% 0;background:${C.bauRed};transform-origin:0 0"></div><div class="abs" id="kSemi" style="left:780px;top:220px;width:520px;height:260px;border-radius:260px 260px 0 0;background:${C.bauYellow};transform-origin:50% 100%"></div>${grainL('grK1', .14, 'overlay')}</div>
    <div class="abs" id="scK1">${Array.from({ length: 24 }, (_, i) => { const t = i % 3, c = [C.bauCream, C.bauRed, C.bauYellow, C.ink][(i + Math.floor(i / 6)) % 4]; return t === 2 ? `<svg class="bs" id="bs${i}" width="120" height="120" viewBox="0 0 100 100"><polygon points="50,4 98,96 2,96" fill="${c}"/></svg>` : `<div class="bs" id="bs${i}" style="width:120px;height:120px;background:${c};border-radius:${t === 0 ? '50%' : '0'}"></div>`; }).join('')}
    ${[1, 2, 3, 4].map(k => `<div class="abs" id="kg${k}" style="border-radius:50%;border:5px solid ${C.bauCream};box-sizing:border-box"></div>`).join('')}</div>`)}
  ${W_('K2', `<div class="bg" style="background:${C.px0}"><div class="abs" style="left:120px;top:160px">${PXG.sky}</div><div class="scan"></div></div>
    <div class="abs" id="scK2"><div id="hiLbl">TIMES I SAID AI</div><div id="score">00</div>${Array.from({ length: 10 }, (_, i) => `<div class="coin" id="cn${i}">${pxCoin}</div>`).join('')}</div>`)}
  ${W_('K3', `<div class="bg" style="background:radial-gradient(70% 50% at 50% 42%,#3b0f6e 0%,#16052e 55%,#05010d 100%)"><div class="kal" id="kal3" style="background:repeating-conic-gradient(from 0deg,rgba(255,106,213,.26) 0 6deg,rgba(122,247,255,.2) 6deg 12deg,transparent 12deg 20deg,rgba(198,255,107,.16) 20deg 26deg,transparent 26deg 36deg)"></div>${ringDivs('rK', 6)}${grainL('grK3', .1, 'overlay')}</div>`)}
  ${W_('K4', `<div class="bg" style="background:linear-gradient(180deg,#262a32 0%,#14161a 52%,#07080a 100%)"><div class="floor" id="floorK4"></div><div class="horizon"></div>${grainL('grK4', .08, 'overlay')}</div>
    <div class="abs" id="scK4"><div class="sph" style="left:120px;top:1010px;width:150px;height:150px"></div><div class="cube" id="cubeK4" style="left:820px;top:1020px;width:120px;height:120px;transform:rotate(45deg)"></div>
    <div class="mono" id="pt4" style="left:0;top:1140px;width:1080px;text-align:center">PATCHING</div><div class="med" id="stP" style="width:560px;height:150px;border-radius:75px;font-size:84px">PATCHED<div class="medSh" id="shP"></div></div><div class="flare" id="flareK4"></div></div>`)}
  ${W_('L', `<div class="bg" style="background:${C.px0}"><div class="abs" style="left:120px;top:160px">${PXL.sky}</div><div class="abs" style="left:120px;top:160px" id="lFarW">${PXL.far}</div><div class="abs" style="left:120px;top:160px">${PXL.roof}</div><div class="abs" style="left:120px;top:160px" id="shootW">${PXL.shoot}</div><div class="scan"></div></div>
    <div class="abs" id="scL"><div class="abs" id="binW" style="width:168px;height:192px">${pxBin.replace('width="168"', 'width="168"')}</div><div class="pxwin" id="upd"><div class="bar"><span>SYSTEM</span><span>X</span></div><div class="body">UPDATE AVAILABLE</div></div>${Array.from({ length: 7 }, (_, i) => `<div class="puff" id="pf${i}"></div>`).join('')}</div>`)}

  <div class="layer" id="crowd">${clones}</div>
  <div class="layer" id="cast">
    ${mascot('hA', HS, { face: '#f4f4f4', eye: '#111111', side: '#555555', layers: 10, depth: 2.2, extra: crackSvg })}${mascot('hB', HS, { face: '#f4f4f4', eye: '#111111', side: '#555555', layers: 10, depth: 2.2, extra: crackSvg })}
    ${mascot('h', HS, { face: C.pink, eye: C.navy, side: C.blue, layers: 10, depth: 2.2, extra: crackSvg })}
    <div id="aib"><div class="dot" id="aid0"></div><div class="dot" id="aid1"></div><div id="aibB"><i id="aie0"></i><i id="aie1"></i><span id="aiT"><span id="aiT0">ME</span> <span id="aiT1">TOO</span></span></div></div>
    ${handImg('fL', 'dance-fist-left')}${handImg('fR', 'dance-fist-right')}
  </div>
</div>
<div id="fx">
  <div id="roll"></div><div class="lid" id="lidT"></div><div class="lid" id="lidB"></div>
  ${Array.from({ length: 16 }, (_, i) => `<div class="sbar" id="sb${i}" style="top:${i * 120}px;background:${i % 2 ? '#f4f4f4' : '#0a0a0a'}"></div>`).join('')}
  <div id="tcirc"></div>
  ${Array.from({ length: 12 * 22 }, (_, i) => `<div class="mz" id="mz${i}" style="left:${(i % 12) * 90}px;top:${Math.floor(i / 12) * 90}px"></div>`).join('')}
  <svg id="tear" width="1080" height="2000" viewBox="0 0 1080 2000"><defs><pattern id="tHatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="22" fill="rgba(44,79,255,.32)"/></pattern></defs><path d="M0 0 H1080 V1920 ${Array.from({ length: 28 }, (_, i) => `L${(1080 - (i + 1) * 40).toFixed(0)} ${(1920 + (i % 2 ? -26 : 22) + (i % 5) * 6).toFixed(0)}`).join(' ')} L0 1920 Z" fill="${C.paper}"/><path d="M0 0 H1080 V1920 L0 1920 Z" fill="url(#tHatch)"/></svg>
  <div id="flood"></div>
  <div id="flash"></div>
</div>
<div id="caps">${CAPS.map((c, g) => `<div class="cap ${c.style}" id="cap${g}"><div class="capb" id="capb${g}">${c.rows.map(r => `<div class="row">${r.map(w => `<span class="w" id="w${w.i}">${w.t}</span>`).join(' ')}</div>`).join('')}</div></div>`).join('')}</div>
<div id="glitchL"></div>
`;

const js = `
const BARS = null, BARS0 = 0;
const C = ${JSON.stringify(C)}, F = ${JSON.stringify(F)}, CAPS = ${JSON.stringify(CAPS)}, SKIN = ${JSON.stringify(SKIN)}, GIRL = ${JSON.stringify(GIRL)}, HERO_SKIN = ${JSON.stringify(HERO_SKIN)};
const KICKS = ${JSON.stringify(KICKS)}, BEATS = ${JSON.stringify(BEATS)}, SECS = ${JSON.stringify(SECS)}, WR = ${JSON.stringify(WR)}, EYE = ${JSON.stringify(EYE)};
const HS = ${HS}, PLATE = ${PLATE};
const vis = (id, on) => { $(id).style.display = on ? 'block' : 'none'; };
const shown = (id, on) => { $(id).style.visibility = on ? 'visible' : 'hidden'; };
const blink = (f, s) => f >= s && f < s + 12 ? (f < s + 4 ? 1 - (f - s) / 4 : (f - s - 4) / 8) : 1;
const secOf = f => { let s = 'A'; for (const [k, a] of SECS) if (f >= a) s = k; return s; };
const lastBeat = f => { let b = 0; for (const x of BEATS) if (x <= f) b = x; return b; };
const beatPhase = f => { let i = 0; while (i < BEATS.length - 1 && BEATS[i + 1] <= f) i++; return (f - BEATS[i]) / (BEATS[i + 1] - BEATS[i]); };
const step = (f, n) => Math.floor(f / n) * n;

/* ---------- skins: one rig, recoloured per world ---------- */
const skinCur = {};
function skin(id, k) {
  if (skinCur[id] === k) return; skinCur[id] = k; const s = SKIN[k];
  $(id + '-face').style.background = s.face; $(id + '-face').style.border = s.stroke ? s.stroke + 'px solid ' + s.eye : 'none';
  for (const i of [0, 1]) $(id + '-e' + i).style.background = s.eye;
  document.querySelectorAll('#' + id + ' .m-slab').forEach(el => { el.style.background = s.side; });
  $(id).style.filter = s.filter;
  $(id).style.webkitBoxReflect = k === 'chrome' || k === 'void' ? 'below -10px linear-gradient(transparent 62%,rgba(255,255,255,.26))' : '';
  document.querySelectorAll('#' + id + ' .crl').forEach(el => { el.setAttribute('stroke', s.crack); });
}
function put(id, o) {
  rig(id, { x: o.cx - HS / 2, y: o.cy - HS / 2, s: (o.size || HS) / HS, sx: o.sx, sy: o.sy, rz: o.rz, ry: o.ry, rx: o.rx, eye: o.eye, ex: o.ex, ey: o.ey, origin: o.origin || '50% 96.9%' });
}
function crack(id, p) { document.querySelectorAll('#' + id + ' .crl').forEach((el, i) => { el.setAttribute('stroke-dashoffset', (1 - clamp(p * 1.6 - i * 0.15)).toFixed(4)); }); }
function hand(id, name, x, y, size, rot, on) {
  const el = $(id); el.style.display = on ? 'block' : 'none'; if (!on) return;
  const k = size / 400, w = WR[name];
  el.style.transformOrigin = w[0] + 'px ' + w[1] + 'px';
  T(el, 'translate(' + (x - w[0]).toFixed(1) + 'px,' + (y - w[1]).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + k.toFixed(4) + ')');
}
const BUB = { riso: ['#ffffff', C.blue, C.navy, 'drop-shadow(10px 8px 0 rgba(255,79,163,.9))'], bau: ['#ffffff', C.ink, C.ink, 'drop-shadow(10px 10px 0 rgba(20,20,20,.9))'], holo: ['#ffffff', '#b58cff', '#1b0d3a', 'drop-shadow(0 0 22px rgba(255,106,213,.8))'], pixel: ['#ffffff', C.px0, C.px0, 'drop-shadow(10px 10px 0 rgba(6,2,20,.9))'] };
let bubCur = '';
function aiBub(o) {
  const el = $('aib'); el.style.display = o.on ? 'block' : 'none'; if (!o.on) return;
  if (o.look && o.look !== bubCur) { bubCur = o.look; const [bg, bd, ink, fl] = BUB[o.look]; $('aibB').style.background = bg; $('aibB').style.borderColor = bd; for (const i of [0, 1]) { $('aie' + i).style.background = ink; $('aid' + i).style.borderColor = bd; } $('aiT').style.color = ink; el.style.filter = fl; }
  T(el, 'translate(' + o.cx.toFixed(1) + 'px,' + o.cy.toFixed(1) + 'px) rotate(' + (o.rz || 0).toFixed(2) + 'deg) scale(' + (o.s * (o.sx || 1)).toFixed(4) + ',' + (o.s * (o.sy || 1)).toFixed(4) + ')');
  const w = o.w || 230, h = o.h || 160, B = $('aibB');
  B.style.left = (-w / 2) + 'px'; B.style.top = (-h / 2) + 'px'; B.style.width = w + 'px'; B.style.height = h + 'px';
  const eyH = 16 * (o.eye == null ? 1 : Math.max(0.12, o.eye)), ec = o.text ? 38 : h / 2 - 7;
  for (const i of [0, 1]) { const e = $('aie' + i); e.style.left = (w / 2 - 7 + (i ? 14 : -58) + (o.ex || 0)).toFixed(1) + 'px'; e.style.top = (ec - eyH / 2).toFixed(1) + 'px'; e.style.height = eyH.toFixed(1) + 'px'; }
  $('aiT').style.top = '64px'; O('aiT0', o.t0 || 0); O('aiT1', o.t1 || 0);
  const side = o.dotSide || -1;
  [[0, 34, 30], [1, 22, 30]].forEach(([i, d, gap]) => { const dd = $('aid' + i); dd.style.width = dd.style.height = d + 'px'; dd.style.left = (side * (w / 2 - 34 + (i + 1) * gap) - d / 2).toFixed(1) + 'px'; dd.style.top = (h / 2 + 6 + i * (gap - 4) + (i ? 6 : 0)).toFixed(1) + 'px'; });
}

/* ---------- layout measured once, with the worlds shown ---------- */
function measure(el) { const s = document.createElement('span'); s.textContent = el.textContent; s.style.font = getComputedStyle(el).font; s.style.letterSpacing = getComputedStyle(el).letterSpacing; s.style.position = 'absolute'; s.style.visibility = 'hidden'; s.style.whiteSpace = 'nowrap'; document.body.appendChild(s); const w = s.offsetWidth; s.remove(); return w; }
function fitBig(id, w, cy) { const el = $(id); el.style.fontSize = '200px'; const fs = 200 * w / measure(el); el.style.fontSize = fs.toFixed(1) + 'px'; el.style.top = (cy - el.offsetHeight / 2).toFixed(1) + 'px'; return fs; }
for (const id of ['wE', 'wH', 'wK2', 'wL']) $(id).style.display = 'block';
fitBig('aw0', 440, 300); fitBig('aw1', 440, 580); fitBig('aw2', 440, 860); fitBig('bw', 560, 300);
$('score').style.top = (780 - $('score').offsetHeight / 2) + 'px'; $('hiLbl').style.top = '340px';
const scoreTop = 780 - 0.36 * 330;
const updW = $('upd').offsetWidth, updH = $('upd').offsetHeight;
for (const id of ['wE', 'wH', 'wK2', 'wL']) $(id).style.display = 'none';
CAPS.forEach((c, g) => { const b = $('capb' + g); $('cap' + g).style.display = 'block'; const mx = c.style === 'pixel' ? 74 : 86; b.style.fontSize = mx + 'px'; let w = 0; b.querySelectorAll('.row').forEach(r => { w = Math.max(w, r.scrollWidth); }); b.style.fontSize = Math.min(mx, mx * 860 / w).toFixed(1) + 'px'; $('cap' + g).style.display = 'none'; });
const keyW = 620;
const glitchL = $('glitchL'); for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'gs'; d.id = 'gs' + i; glitchL.appendChild(d); }
const TYPED = 'make me dinner';
const GRID = [[1, 1], [2, 1], [2, 2], [4, 2], [4, 4]];
function slot(level, i, box) { const [c, r] = GRID[level], cw = box.w / c, ch = box.h / r, sz = Math.min(cw, ch) * 0.86; return { cx: box.x + cw * (i % c + 0.5), cy: box.y + ch * (Math.floor(i / c) + 0.5), size: sz }; }
const BOXB = { x: 140, y: 620, w: 800, h: 760 };
const rollV = f => { const p = clamp((f - F.roll) / (F.land2 - F.roll)); return 99 * (1 - Math.pow(1 - p, 3)); };
/* the streaks, the dust, the mosaic order: seeded once */
const ST = Array.from({ length: 110 }, (_, i) => ({ a: rand('sa' + i) * Math.PI * 2, z: rand('sz' + i), v: 0.6 + 0.8 * rand('sv' + i), c: ['#ffffff', '#9fe9ff', '#ff7ad9', '#ffffff', '#b9c4ff'][i % 5] }));
const DU = Array.from({ length: 40 }, (_, i) => ({ x: 300 + 480 * rand('dx' + i), y: 300 + 900 * rand('dy' + i), r: 2 + 4 * rand('dr' + i), v: 0.2 + 0.5 * rand('dv' + i), ph: rand('dp' + i) * 6.28 }));
const MZ = Array.from({ length: 12 * 22 }, (_, i) => ({ a: rand('ma' + i), b: rand('mb' + i), c: ['#0d0624', '#22104f', '#3a1d74', '#ff6fae', '#62e6ff', '#ffd84a', '#160a3a'][Math.floor(rand('mc' + i) * 7)] }));
for (let i = 0; i < 110; i++) { $('st' + i).style.background = 'linear-gradient(90deg,rgba(255,255,255,0),' + ST[i].c + ')'; $('st' + i).style.boxShadow = '0 0 10px ' + ST[i].c; }

/* ---------- the camera: a punch on every measured kick, a slow push on holds ---------- */
function camAt(f, sec) {
  let punch = 0; for (const [k, s] of KICKS) punch = Math.max(punch, s * hitPulse(f - k, 2, 7));
  const soft = sec === 'L' ? 0.4 : sec === 'K4' ? 0.6 : 1;
  const i = SECS.findIndex(s => s[0] === sec), a = SECS[i][1], b = (SECS[i + 1] || [0, F.end])[1];
  return Math.min(1.06, (1 + 0.03 * prog(f, a, b, E.dolly)) * (1 + 0.03 * soft * punch));
}
const pxT = (el, x) => T(el, 'translateX(' + (Math.round(x / 12) * 12) + 'px)');

function paint(f) {
  const sec = secOf(f);
  /* worlds on screen: the current one, and the next or last one inside a transition */
  const on = { [sec]: true };
  if (f >= F.B - 6 && f < F.B) on.B = true; if (f >= F.B && f < F.B + 6) on.A = true;
  for (const k of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K1', 'K2', 'K3', 'K4', 'L']) vis('w' + k, !!on[k]);
  for (const id of ['hpL', 'hpR', 'hw']) $(id).style.display = 'none';
  O('flash', 0); $('flash').style.background = '#fff';
  let shx = 0, shy = 0, zoom = 1, rot = 0, camY = 0;
  const hero = { on: true, cx: 540, cy: 860, size: 300, sx: 1, sy: 1, rz: 0, ry: 0, rx: 0, eye: 1, ex: 0, ey: 0, crack: 0, dx: 0, dy: 0 };
  const aib = { on: false };
  let crowdOn = false, fistsOn = false, halves = false;

  /* ================= A: riso kitchen ================= */
  if (sec === 'A') {
    const top = 1120, base = top - HS * 62 / 64 + HS / 2;
    let y = base, sq = 0;
    if (f < F.land0) { const q = (f + 10) / (F.land0 + 10); y = mix(base - 640, base, q * q); }
    else if (f < F.hop0) { const s = (f - F.land0) / (F.hop0 - F.land0); y = base - 220 * 4 * s * (1 - s); }
    sq = hitPulse(f - F.land0, 1, 6) + 0.7 * hitPulse(f - F.hop0, 1, 5);
    let nod = 0; for (let k = 0; k < 12; k++) { const t0 = F.type0 + k * 14; if (t0 < F.enter) nod += hitPulse(f - t0, 2, 4); }
    nod += 2.2 * hitPulse(f - F.enter, 2, 6);
    const b0 = F.bite - 12, bx = 215, by = 70;
    let lx = 0, ly = 0, bsq = 0;
    if (f >= b0 && f < b0 + 6) ly = -26 * E.smooth((f - b0) / 6);
    else if (f >= b0 + 6 && f < F.bite) { const u = (f - b0 - 6) / 6; ly = mix(-26, by, u * u); lx = bx * u * u; }
    else if (f >= F.bite && f < F.bite + 6) { ly = by; lx = bx; bsq = Math.pow(Math.sin(Math.PI * (f - F.bite) / 6), 0.6); }
    else if (f >= F.bite + 6 && f < F.bite + 15) { const e = 1 - Math.pow(1 - (f - F.bite - 6) / 9, 2); ly = mix(by, 0, e); lx = mix(bx, 0, e); }
    const chew = chewAt(f);
    hero.cx = 540 + lx + chew.x; hero.cy = y + 10 * nod + ly;
    hero.sx = (1 + 0.3 * Math.min(1, sq)) * (1 + 0.1 * bsq) * (1 + chew.k); hero.sy = (1 - 0.36 * Math.min(1, sq)) / (1 + 0.1 * bsq) / (1 + chew.k) * (1 - 0.05 * nod) * (f < F.land0 ? 1.12 : 1);
    hero.rz = chew.rot + 6 * clamp(lx / bx); hero.ey = 10 * clamp(nod); hero.eye = f >= F.bite - 6 ? 0.26 : 1 - 0.3 * clamp(sq);
    if (f > F.hop0 && f < F.type0 - 20) hero.eye = Math.min(hero.eye, blink(f, F.hop0 + 14));
    const n = f < F.type0 ? 0 : Math.min(TYPED.length, Math.floor((f - F.type0) / ((F.enter - F.type0) / TYPED.length)) + 1);
    $('ptxt').textContent = '> ' + TYPED.slice(0, n);
    O('pcur', Math.floor(f / 20) % 2 ? 0.15 : 1);
    const ent = hitPulse(f - F.enter, 1, 6);
    T('pbox', 'translateY(' + (12 * ent + 6 * hitPulse(f - F.land0, 1, 5)).toFixed(1) + 'px) scaleY(' + (1 - 0.05 * ent).toFixed(4) + ')');
    $('pbox').style.boxShadow = (12 + 10 * ent).toFixed(1) + 'px ' + (10 + 8 * ent).toFixed(1) + 'px 0 ' + C.pink;
    const pp = springAt(SPR.pop, f, F.plate);
    T('plate', 'translate(' + (820 - 140).toFixed(1) + 'px,' + (mix(1180, 1120 - 175, pp) - 120).toFixed(1) + 'px) scale(' + (0.3 + 0.7 * clamp(pp * 1.4)).toFixed(4) + ') rotate(' + (8 * (1 - pp)).toFixed(2) + 'deg)');
    shown('plate', f >= F.plate && f < F.bite + 1);
    /* the plates breathe out of register, a pixel or two every few frames */
    T('aSun', 'translate(' + (3 * Math.sin(step(f, 4) / 5)).toFixed(1) + 'px,' + (2 * Math.cos(step(f, 4) / 7)).toFixed(1) + 'px) scale(' + (1 + 0.04 * hitPulse(f - F.land0, 2, 10) + 0.03 * hitPulse(f - F.plate, 2, 8)).toFixed(4) + ')');
    T('aRing', 'rotate(' + (f * 0.3).toFixed(1) + 'deg) translate(' + (-4 * Math.sin(step(f, 4) / 6)).toFixed(1) + 'px,0)');
  }
  /* ================= B: riso photocopier ================= */
  if (sec === 'B') {
    const chew = chewAt(f);
    hero.cx = 540 + chew.x; hero.cy = 940; hero.size = 340; hero.sx = 1 + chew.k; hero.sy = 1 / (1 + chew.k); hero.rz = chew.rot;
    hero.eye = f < F.bite + 46 ? 0.26 : f < F.think ? 1 : 0.5;
    hero.ey = f >= F.think ? -14 : 0;
    const spIn = springAt(SPR.snap, f, F.think), cut = prog(f, F.slash, F.slash + 4, E.out), fall = prog(f, F.slash + 2, F.slash + 22, E.in);
    T('spin', 'translate(390px,' + (520 - 150 + 700 * fall).toFixed(1) + 'px) rotate(' + (f * 9 + 160 * fall).toFixed(1) + 'deg) scale(' + (spIn * (1 - 0.3 * fall)).toFixed(4) + ')');
    for (let i = 0; i < 12; i++) O('sp' + i, 0.2 + 0.8 * (((Math.floor(f / 3) - i) % 12 + 12) % 12 < 4 ? 1 : 0.3));
    shown('spin', f >= F.think && fall < 1);
    T('slashB', 'translate(260px,' + (520 - 9) + 'px) rotate(-24deg) scaleX(' + cut.toFixed(4) + ')'); $('slashB').style.transformOrigin = '0 50%';
    O('slashB', f >= F.slash ? 1 - prog(f, F.slash + 6, F.slash + 14, E.smooth) : 0);
    /* the keys stamp down: big and blurred, then on the paper with the plate shadow catching up */
    const kc = prog(f, F.copy - 4, F.copy + 2, E.contact), kcOut = prog(f, F.paste - 6, F.paste, E.in), sc1 = 1 - hitPulse(f - F.copy - 1, 1, 6);
    T('keyC', 'translate(' + (540 - keyW / 2) + 'px,' + (300 - 600 * kcOut).toFixed(1) + 'px) scale(' + (lmix(1.7, 1, kc) * (1 - 0.06 * hitPulse(f - F.copy - 1, 1, 5))).toFixed(4) + ') rotate(-4deg)');
    $('keyC').style.filter = blurIn(kc, 16) ? 'blur(' + blurIn(kc, 16).toFixed(1) + 'px)' : 'none'; shown('keyC', f >= F.copy - 4 && kcOut < 1);
    $('keyC').style.boxShadow = (16 + 30 * (1 - sc1)).toFixed(1) + 'px ' + (14 + 24 * (1 - sc1)).toFixed(1) + 'px 0 rgba(44,79,255,.85)';
    const kv = prog(f, F.paste - 4, F.paste + 2, E.contact), sc2 = 1 - hitPulse(f - F.paste - 1, 1, 6);
    T('keyV', 'translate(' + (540 - keyW / 2) + 'px,300px) scale(' + (lmix(1.7, 1, kv) * (1 - 0.06 * hitPulse(f - F.paste - 1, 1, 5))).toFixed(4) + ') rotate(4deg)');
    $('keyV').style.filter = blurIn(kv, 16) ? 'blur(' + blurIn(kv, 16).toFixed(1) + 'px)' : 'none'; shown('keyV', f >= F.paste - 4);
    $('keyV').style.boxShadow = (16 + 30 * (1 - sc2)).toFixed(1) + 'px ' + (14 + 24 * (1 - sc2)).toFixed(1) + 'px 0 rgba(44,79,255,.85)';
    if (f >= F.paste) {
      hero.on = false; crowdOn = true;
      const lv = Math.min(4, Math.floor((f - F.paste) / 6) + 1), lf = F.paste + (lv - 1) * 6, p = springAt(SPR.snap, f, lf);
      for (let i = 0; i < 16; i++) {
        const N = [1, 2, 4, 8, 16][lv], cOn = i < N;
        shown('c' + i, cOn); if (!cOn) continue;
        skin('c' + i, (i + Math.floor(i / 4)) % 2 ? 'risoB' : 'riso');
        const prevN = [1, 1, 2, 4, 8][lv], from = i < prevN ? slot(lv - 1, i, BOXB) : slot(lv - 1, i % prevN, BOXB), to = slot(lv, i, BOXB);
        if (lv === 1 && i === 0) { from.cx = 540; from.cy = 940; from.size = 340; }
        const bob = 8 * Math.sin((f - F.paste) / 5 + i);
        put('c' + i, { cx: mix(from.cx, to.cx, p), cy: mix(from.cy, to.cy, p) + bob, size: mix(from.size, to.size, clamp(p)), rz: 6 * Math.sin(i * 1.7), eye: i % 5 === 3 ? blink(f, F.paste + 20 + i) : 1, ex: 4 * Math.sin(i), origin: '50% 50%' });
      }
    }
    T('bSq', 'rotate(' + (18 + 4 * hitPulse(f - F.copy, 2, 10) - 4 * hitPulse(f - F.paste, 2, 10)).toFixed(2) + 'deg)');
  }
  /* ================= C: phosphene ================= */
  if (sec === 'C') {
    hero.cx = 290; hero.cy = 880; hero.size = 290;
    const look = prog(f, F.girl + 6, F.girl + 18, E.smooth);
    hero.ex = 14 * look; hero.ry = -14 * look; hero.cy += 10 * Math.sin((f - F.C) / 22);
    hero.eye = f >= F.diff ? 0.42 : 1; if (f >= F.diff && f < F.diff + 6) hero.sy = 1 - 0.05 * hitPulse(f - F.diff, 1, 4);
    hero.size = 290 * (1 - 0.06 * prog(f, F.lately, F.lately + 20, E.smooth));
    const gp = springAt(SPR.snap, f, F.girl), lean = prog(f, F.girl + 14, F.lately + 26, E.smooth), tilt = prog(f, F.diff, F.lately + 20, E.smooth);
    const gh = 880, k = gh / GIRL.h, gx = mix(1500, 840 - 28 * lean, gp), gy = 1380 - 14 * Math.sin((f - F.C) / 26);
    $('g4').style.transformOrigin = (GIRL.w * k / 2) + 'px ' + (GIRL.h * k) + 'px';
    T('g4', 'translate(' + (gx - GIRL.w * k / 2).toFixed(1) + 'px,' + (gy - GIRL.h * k).toFixed(1) + 'px) rotate(' + (-5 * lean - 5 * tilt + 1.2 * Math.sin(f / 18)).toFixed(2) + 'deg) scale(' + (-k * (1 + 0.04 * tilt)).toFixed(5) + ',' + (k * (1 + 0.04 * tilt)).toFixed(5) + ')');
    shown('g4', f >= F.girl);
    /* her hologram disc and its floor glow */
    const dq = springAt(SPR.snap, f, F.girl + 4), ds = 560 * dq;
    $('gdisc').style.width = $('gdisc').style.height = ds + 'px'; T('gdisc', 'translate(' + (gx - ds / 2).toFixed(1) + 'px,' + (gy - 520 - ds / 2).toFixed(1) + 'px) rotate(' + (f * 2) + 'deg)');
    $('gfloor').style.width = (420 * dq) + 'px'; $('gfloor').style.height = (90 * dq) + 'px'; T('gfloor', 'translate(' + (gx - 210 * dq).toFixed(1) + 'px,' + (gy - 45 * dq).toFixed(1) + 'px)');
    O('gfloor', 0.7 + 0.3 * Math.sin(f / 6));
    /* the voice: a rainbow wave that goes square on DIFFERENT, and rings ripple from him */
    const wp = prog(f, F.sound, F.sound + 10, E.out), sqr = prog(f, F.diff, F.diff + 8, E.out);
    let d = ''; const x0 = 420, x1 = 660, yc = 860;
    for (let i = 0; i <= 90; i++) { const u = i / 90; if (u > wp) break; const ph = u * 4 * Math.PI * 2 - f / 4; const s = Math.sin(ph); const v = mix(s, Math.sign(s) * Math.pow(Math.abs(s), 0.12), sqr); d += (i ? 'L' : 'M') + (x0 + (x1 - x0) * u).toFixed(1) + ' ' + (yc - 46 * v * Math.sin(Math.PI * u)).toFixed(1); }
    $('wav').setAttribute('d', d || 'M0 0'); O('wav', f >= F.sound ? 1 - prog(f, F.lately + 30, F.lately + 40, E.smooth) : 0);
    T('raysC', 'rotate(' + (0.25 * f).toFixed(2) + 'deg)');
    const cols = ['#ff6ad5', '#7af7ff', '#b58cff', '#c6ff6b'];
    for (let i = 0; i < 12; i++) { const r = ((i / 12 + (f - F.C) / 150) % 1), rad = 60 + 1500 * r * r, el = $('rC' + i), c = cols[i % 4]; el.style.width = el.style.height = (2 * rad) + 'px'; el.style.border = (3 + 10 * r).toFixed(1) + 'px solid ' + c; el.style.boxShadow = '0 0 ' + (20 + 30 * r).toFixed(0) + 'px ' + c + ', inset 0 0 ' + (20 + 30 * r).toFixed(0) + 'px ' + c; T(el, 'translate(' + (660 - rad) + 'px,' + (1020 - rad) + 'px)'); O(el, (0.15 + 0.6 * Math.sin(Math.PI * r)) * (1 + 0.6 * hitPulse(f - F.diff, 2, 10))); }
  }
  /* ================= D: chrome studio ================= */
  if (sec === 'D') {
    hero.cx = 540; hero.cy = 620; hero.size = 320;
    const pr = springAt(SPR.pop, f, F.stamp), happy = f >= F.stamp + 2 && f < F.stamp + 36;
    hero.size = 320 * (1 + 0.06 * clamp(pr)); hero.ry = 16 * prog(f, F.stamp, F.stamp + 20, E.smooth) + 8 * Math.sin((f - F.D) / 30); hero.rz = -4 * prog(f, F.stamp, F.stamp + 20, E.smooth);
    hero.eye = happy ? 0.4 : blink(f, F.D + 40); hero.ey = happy ? -8 : 0;
    /* the orbit: the floor and the props slide against him */
    const orb = (f - F.D) * 1.6;
    $('floorD').style.backgroundPosition = (-orb * 2) + 'px 0px';
    T('sphD', 'translateX(' + (orb * 0.6).toFixed(1) + 'px)'); T('cubeD', 'translateX(' + (-orb * 0.5).toFixed(1) + 'px) rotate(' + (45 + orb * 0.2).toFixed(1) + 'deg)');
    const pg = prog(f, F.thank, F.upd, E.inOut); T('tubeF', 'scaleX(' + Math.max(0.001, pg).toFixed(4) + ')');
    $('tubeS').style.backgroundPosition = (100 - ((f * 3) % 300)) + '% 0';
    $('prgP').textContent = Math.round(100 * pg) + '%'; $('prgL').textContent = f >= F.stamp ? 'UPDATED' : 'UPDATING';
    const st = prog(f, F.stamp - 6, F.stamp, E.contact), md = $('med');
    T(md, 'translate(700px,300px) rotate(-12deg) scale(' + (lmix(2.6, 1, st) * (1 + 0.06 * hitPulse(f - F.stamp, 1, 4))).toFixed(4) + ')');
    O(md, f >= F.stamp - 6 ? 0.2 + 0.8 * st : 0);
    T('medSh', 'translateX(' + mix(-120, 320, prog(f, F.stamp + 4, F.stamp + 22, E.inOut)).toFixed(1) + 'px) rotate(20deg)');
    /* the flare: an anamorphic streak across the medallion on the stamp */
    const fl = hitPulse(f - F.stamp, 2, 14);
    T('flareD', 'translate(' + (800 - 800) + 'px,' + (400 - 7) + 'px) scaleX(' + (0.4 + 0.8 * fl).toFixed(3) + ')'); O('flareD', fl);
    T('flareDotD', 'translate(' + (800 - 110) + 'px,' + (400 - 110) + 'px) scale(' + (0.6 + 0.8 * fl).toFixed(3) + ')'); O('flareDotD', fl);
  }
  /* ================= E: bauhaus slams ================= */
  if (sec === 'E') {
    const n = F.ai1.filter(a => f >= a).length;
    F.ai1.forEach((a, i) => {
      const p = prog(f, a - 4, a, E.contact), id = 'aw' + i;
      shown(id, f >= a - 4); $(id).style.color = n >= 2 && i < 2 ? C.ink : C.ink;
      T(id, 'scale(' + (lmix(1.35, 1, p) * (1 + 0.05 * hitPulse(f - a, 1, 4))).toFixed(4) + ')');
      const b = blurIn(p, 20); $(id).style.filter = b ? 'blur(' + b.toFixed(1) + 'px)' : 'none';
      const h = hitPulse(f - a, 1, 5); shx += 26 * h * (rand('ex' + i + f) - 0.5) * 2; shy += 18 * h * (rand('ey' + i + f) - 0.5) * 2;
    });
    /* each slam brings a shape that eats the frame: circle, square, triangle */
    const cIn = prog(f, F.E, F.E + 10, E.out);
    T('bC', 'translate(' + (540 - 380 + 120 * cIn).toFixed(1) + 'px,' + (520 - 380).toFixed(1) + 'px) scale(' + lmix(4, 1, cIn).toFixed(4) + ')');
    const sIn = prog(f, F.ai1[1] - 4, F.ai1[1] + 6, E.out);
    T('bS', 'translate(' + (40).toFixed(1) + 'px,' + (560).toFixed(1) + 'px) rotate(' + (45 * (1 - sIn) + 12).toFixed(2) + 'deg) scale(' + lmix(5, 1, sIn).toFixed(4) + ')'); shown('bS', f >= F.ai1[1] - 4);
    const tIn = prog(f, F.ai1[2] - 4, F.ai1[2] + 6, E.out);
    T('bT', 'translate(' + (520).toFixed(1) + 'px,' + (780).toFixed(1) + 'px) rotate(' + (-90 * (1 - tIn) - 8).toFixed(2) + 'deg) scale(' + lmix(5, 1, tIn).toFixed(4) + ')'); shown('bT', f >= F.ai1[2] - 4);
    T('bBar', 'translate(-110px,1160px) rotate(-8deg) scaleX(' + prog(f, F.ai1[0], F.ai1[0] + 10, E.out).toFixed(4) + ')'); $('bBar').style.transformOrigin = '0 50%';
    rot = [0, -4, 4, 0][n] * (1 - 0.0);
    const L = [...F.ai1, F.ai1[2] + 22];
    let hop = 0; for (let i = 0; i < 3; i++) if (f >= L[i] && f < L[i + 1]) { const s = (f - L[i]) / (L[i + 1] - L[i]); hop = (i === 2 ? 180 : 130) * 4 * s * (1 - s); }
    let sq = 0; F.ai1.forEach(a => { sq += hitPulse(f - a, 1, 5); });
    hero.cx = 540; hero.cy = 1270 - hop; hero.size = 220;
    hero.sx = 1 + 0.3 * Math.min(1, sq); hero.sy = 1 - 0.32 * Math.min(1, sq); hero.rz = f >= F.ai1[2] ? -360 * prog(f, F.ai1[2], F.ai1[2] + 22, E.inOut) : 0;
    hero.eye = 0.45 + 0.55 * (1 - Math.min(1, sq));
  }
  /* ================= F: warp ================= */
  if (sec === 'F') {
    const t = f - F.F, run = Math.abs(Math.sin(Math.PI * t / 7)), boost = 1 + 3 * (1 - prog(f, F.F, F.F + 14, E.out));
    hero.cx = 540 + 8 * Math.sin(t / 7 * Math.PI / 2); hero.cy = 920 - 30 * run; hero.size = 300 * springAt(SPR.snap, f, F.F); hero.rz = 9; hero.sy = 1 - 0.06 * (1 - run); hero.sx = 1 + 0.05 * (1 - run);
    hero.ex = 10 * Math.sin(t / 3);
    for (let i = 0; i < 110; i++) {
      const s = ST[i], z = (s.z + t * 0.012 * s.v * boost) % 1, r = 30 + 1300 * z * z, len = 30 + 520 * z * z * boost * 0.6, el = $('st' + i);
      el.style.width = len.toFixed(0) + 'px'; T(el, 'translate(540px,880px) rotate(' + (s.a * 180 / Math.PI).toFixed(2) + 'deg) translateX(' + r.toFixed(1) + 'px)'); O(el, Math.min(1, z * 1.6));
    }
    const sir = Math.floor(f / 7) % 2;
    O('sirL', sir ? 0.95 : 0.2); O('sirR', sir ? 0.2 : 0.95);
    const fl = Math.sin(t / 2.2);
    hand('hpL', 'panic-left', hero.cx - 205, hero.cy + 30, 190, -10 + 18 * fl, true);
    hand('hpR', 'panic-right', hero.cx + 205, hero.cy + 30, 190, 10 - 18 * fl, true);
    zoom = lmix(1, 1.08, prog(f, F.F, F.G, E.dolly));
    O('flash', 0.8 * (1 - prog(f, F.F, F.F + 6, E.out)));
  }
  /* ================= G: pixel night clinic ================= */
  if (sec === 'G') {
    hero.cx = 290; hero.cy = 940; hero.size = 250;
    const dp = springAt(SPR.snap, f, F.called), dx = mix(1400, 740, dp), dy = 820 + 6 * Math.sin(f / 14);
    const look = prog(f, F.called + 4, F.called + 14, E.smooth);
    hero.ex = 12 * look; hero.ry = -12 * look; hero.eye = f >= F.bot ? 0.45 : blink(f, F.called + 40);
    const pix = f >= F.too && f < F.too + 34;
    put('doc', { cx: dx, cy: dy, size: 340, eye: 1, ex: -10 * look, ry: 10 * look, sy: 1 - 0.04 * hitPulse(f - F.bot, 1, 5), origin: '50% 96.9%' });
    for (const i of [0, 1]) { const e = $('doc-e' + i); e.style.borderRadius = pix ? '2px' : ''; if (pix) T(e, 'translate(' + (-10 * look).toFixed(1) + 'px,-6px) scale(0.36,2.4)'); }
    T('steth', 'translate(' + (dx - 200).toFixed(1) + 'px,' + (dy - 120).toFixed(1) + 'px)'); $('steth').style.transformOrigin = '200px 120px';
    const ap = f >= F.bot ? M.springFn(SPR.land)((f - F.bot) / 60) : 0;
    T('ant', 'translate(' + (dx - 60).toFixed(1) + 'px,' + (dy - 140 - 150).toFixed(1) + 'px) scaleY(' + ap.toFixed(4) + ') rotate(' + (8 * Math.sin((f - F.bot) / 3) * Math.exp(-(f - F.bot) / 20) * (f >= F.bot ? 1 : 0)).toFixed(2) + 'deg)');
    $('ant').style.transformOrigin = '60px 150px'; shown('ant', f >= F.bot);
    hand('hw', 'wave', dx + 205, dy + 40, 200, 16 * Math.sin((f - F.called) / 5) * prog(f, F.called + 6, F.called + 14, E.smooth), f >= F.called + 6);
    /* pixel sparks fly off the antenna on BOT */
    for (let i = 0; i < 8; i++) { const q = clamp((f - F.bot) / 26), a = i / 8 * Math.PI * 2, r = 30 + 140 * E.out(q); T('pk' + i, 'translate(' + (Math.round((dx + r * Math.cos(a)) / 12) * 12) + 'px,' + (Math.round((dy - 290 + r * Math.sin(a)) / 12) * 12) + 'px)'); O('pk' + i, f >= F.bot && q < 1 ? 1 : 0); }
    const t = f - F.G; pxT('gFarW', -t * 1.2); pxT('gNearW', -t * 3.2);
    document.querySelectorAll('#wG .tw').forEach((el, i) => { el.style.opacity = (Math.floor(f / 10) + i) % 5 ? 1 : 0.2; });
    document.querySelectorAll('#wG .cross').forEach(el => { el.style.opacity = Math.floor(f / 15) % 2 ? 1 : 0.55; });
  }
  /* ================= H: the eye ================= */
  if (sec === 'H') {
    const n = F.ai2.filter(a => f >= a).length, a = F.ai2[Math.max(0, n - 1)];
    const open = prog(f, F.H, F.H + 8, E.out);
    T('eyeW', 'scaleY(' + Math.max(0.02, open).toFixed(4) + ')');
    const dil = 1 + 0.35 * n + 0.25 * hitPulse(f - a, 1, 6), iris = 300, pup = 90 * dil;
    $('iris').style.width = $('iris').style.height = iris + 'px'; T('iris', 'translate(' + (EYE.w / 2 - iris / 2) + 'px,' + (EYE.h / 2 - iris / 2) + 'px) rotate(' + (f * 2 + 40 * n) + 'deg)');
    $('pupil').style.width = $('pupil').style.height = pup + 'px'; T('pupil', 'translate(' + (EYE.w / 2 - pup / 2) + 'px,' + (EYE.h / 2 - pup / 2) + 'px)');
    T('kalH', 'rotate(' + (30 * n + f * 0.4).toFixed(2) + 'deg)'); T('kalH2', 'scale(' + (1 + 0.15 * hitPulse(f - a, 2, 10)).toFixed(4) + ')');
    const p = prog(f, a - 4, a, E.contact);
    T('bw', 'scale(' + (lmix(1.4, 1, p) * (1 + 0.05 * hitPulse(f - a, 1, 4))).toFixed(4) + ')'); shown('bw', f >= F.ai2[0] - 4);
    $('bw').style.backgroundPosition = (n * 33) + '% 0';
    F.ai2.forEach((x, i) => { const h = hitPulse(f - x, 1, 5); shx += 20 * h * (rand('hx' + i + f) - 0.5) * 2; shy += 14 * h * (rand('hy' + i + f) - 0.5) * 2; });
    /* the spiral: a turn and a step closer on each AI, then into the pupil */
    rot = [0, 8, 16, 24][n] + 30 * prog(f, F.I - 10, F.I, E.in);
    zoom = [1, 1.08, 1.16, 1.24][n] * lmix(1, 9, prog(f, F.I - 10, F.I, E.in));
    const L = [...F.ai2, F.ai2[2] + 20];
    let hop = 0; for (let i = 0; i < 3; i++) if (f >= L[i] && f < L[i + 1]) { const s = (f - L[i]) / (L[i + 1] - L[i]); hop = 140 * 4 * s * (1 - s); }
    let sq = 0; F.ai2.forEach(x => { sq += hitPulse(f - x, 1, 5); });
    hero.cx = 540; hero.cy = 1250 - hop; hero.size = 200; hero.sx = 1 + 0.3 * Math.min(1, sq); hero.sy = 1 - 0.32 * Math.min(1, sq); hero.on = f < F.I - 10;
  }
  /* ================= I: the void, one light, he cracks ================= */
  if (sec === 'I') {
    hero.cx = 540; hero.cy = 820; hero.size = 380;
    const tr = f >= F.need && f < F.brk ? 3 * Math.sin(f * 2.3) : 0; hero.cx += tr;
    hero.eye = f >= F.need ? 0.5 : 1; hero.crack = prog(f, F.brk, F.brk + 5, E.out);
    halves = f >= F.brk + 2 && f < F.brk + 24;
    O('flash', 0.45 * hitPulse(f - F.brk, 1, 3));
    const h = hitPulse(f - F.brk, 1, 6); shx += 20 * h * (rand('bx' + f) - 0.5) * 2; shy += 12 * h * (rand('by' + f) - 0.5) * 2;
    for (let i = 0; i < 40; i++) { const d = DU[i], el = $('du' + i), y = d.y - ((f - F.I) * d.v) % 900, x = d.x + 20 * Math.sin((f - F.I) / 40 + d.ph); el.style.width = el.style.height = d.r + 'px'; T(el, 'translate(' + (x + 2 * (rand('j' + i + Math.floor(f / 2)) - .5) * h * 40).toFixed(1) + 'px,' + y.toFixed(1) + 'px)'); O(el, 0.25 + 0.5 * Math.abs(Math.sin((f - F.I) / 30 + d.ph))); }
    O('spot', 0.85 + 0.15 * Math.sin(f / 9) + 0.5 * h);
  }
  /* ================= J: riso, blue heavy ================= */
  if (sec === 'J') {
    hero.crack = 1; hero.cx = 360; hero.cy = 880; hero.size = 300;
    const ask = prog(f, F.asked, F.asked + 12, E.smooth); hero.ry = -16 * ask; hero.ex = 12 * ask;
    const fp = prog(f, F.flop - 14, F.flop, E.contact), sag = prog(f, F.flop - 30, F.flop - 14, E.smooth), land = hitPulse(f - F.flop, 1, 6);
    hero.eye = 1 - 0.7 * sag; hero.sy = 1 - 0.08 * sag; hero.rx = 56 * fp; hero.rz = -6 * fp; hero.cy = mix(880, 1180, fp); hero.cx = mix(360, 330, fp);
    hero.sx = 1 + 0.12 * land; hero.sy *= 1 - 0.12 * land;
    const ap = springAt(SPR.pop, f, F.ai), grow = prog(f, F.me - 2, F.me + 8, E.out);
    aib.on = f >= F.ai; aib.look = 'riso'; aib.cx = 760; aib.cy = mix(680, 1150, fp); aib.s = ap; aib.rz = 10 * fp; aib.sy = 1 - 0.1 * sag - 0.12 * fp;
    aib.w = mix(230, 380, grow); aib.h = mix(160, 230, grow); aib.text = grow > 0.01; aib.t0 = f >= F.me ? 1 : 0; aib.t1 = f >= F.too2 ? 1 : 0;
    aib.eye = 1 - 0.7 * sag; aib.ex = -10 * prog(f, F.ai + 10, F.ai + 20, E.smooth);
    const h = hitPulse(f - F.flop, 1, 6); shy += 22 * h;
    if (f < F.J + 4) { O('flash', 0.6 * (1 - (f - F.J) / 4)); $('flash').style.background = C.pink; }
  }
  /* ================= K1: the drop, a bauhaus equalizer ================= */
  if (sec === 'K1') {
    hero.crack = 1; hero.size = 240;
    const ph = beatPhase(f), b = lastBeat(f), bi = BEATS.indexOf(b);
    const xs = [380, 700], x0 = xs[bi % 2], x1 = xs[(bi + 1) % 2];
    const base = 860 - 240 * 62 / 64 + 120;
    hero.cx = mix(x0, x1, E.smooth(ph)); hero.cy = base - 260 * 4 * ph * (1 - ph);
    const sq = hitPulse(f - b, 1, 5); hero.sx = 1 + 0.28 * sq; hero.sy = 1 - 0.3 * sq; hero.rz = 18 * Math.sin(Math.PI * ph) * (bi % 2 ? -1 : 1);
    hero.eye = f < F.K1 + 30 ? blink(f, F.K1 + 8) : 1;
    for (let k = 1; k <= 4; k++) { const g = f - 3 * k, gp = beatPhase(g), gb = BEATS.indexOf(lastBeat(g)); const gx = mix(xs[gb % 2], xs[(gb + 1) % 2], E.smooth(gp)), gy = base - 260 * 4 * gp * (1 - gp); const el = $('kg' + k), sz = 240 * 60 / 64; el.style.width = el.style.height = sz + 'px'; T(el, 'translate(' + (gx - sz / 2).toFixed(1) + 'px,' + (gy - sz / 2 + 4).toFixed(1) + 'px)'); O(el, [0.5, 0.34, 0.2, 0.1][k - 1] * clamp((base - gy) / 80)); }
    const row = BARS && BARS[f - BARS0] ? BARS[f - BARS0] : null, bp = springAt(SPR.snap, f, F.K1);
    for (let i = 0; i < 24; i++) { const c = i % 6, r = Math.floor(i / 6), v = row ? row[i] / 100 : 0.5, el = $('bs' + i); T(el, 'translate(' + (130 + c * 140).toFixed(0) + 'px,' + (880 + r * 140 + 600 * (1 - bp)).toFixed(0) + 'px) scale(' + (0.25 + 0.85 * v).toFixed(3) + ') rotate(' + (r % 2 ? 1 : -1) * 90 * prog(f, b, b + 10, E.out) * (i % 3 === 1 ? 1 : 0) + 'deg)'); }
    T('kQ', 'rotate(' + (-20 + 20 * E.smooth(ph)).toFixed(2) + 'deg) scale(' + (1 + 0.06 * sq).toFixed(3) + ')'); T('kSemi', 'rotate(' + (bi % 2 ? 180 : 0) + 'deg) scale(' + (1 + 0.08 * sq).toFixed(3) + ')');
    const ap = (ph + 0.5) % 1; aib.on = true; aib.look = 'bau'; aib.cx = 830; aib.cy = 560 - 110 * 4 * ap * (1 - ap); aib.s = 0.7; aib.w = 230; aib.h = 160; aib.eye = 1; aib.rz = 8 * Math.sin(Math.PI * 2 * ap);
    if (f < F.K1 + 6) { O('flash', 0.7 * (1 - (f - F.K1) / 6)); $('flash').style.background = C.bauCream; }
  }
  /* ================= K2: pixel arcade ================= */
  if (sec === 'K2') {
    hero.crack = 1;
    const v = Math.min(99, Math.round(rollV(f)));
    $('score').textContent = String(v).padStart(2, '0');
    const pop = springAt(SPR.snap, f, F.K2), csq = hitPulse(f - F.land2, 1, 5);
    T('score', 'translateY(' + (Math.round(30 * (1 - pop) / 6) * 6) + 'px) scale(' + (1 + 0.05 * csq).toFixed(3) + ',' + (1 - 0.08 * csq).toFixed(3) + ')'); $('score').style.transformOrigin = '50% 70%';
    O('hiLbl', Math.floor((f - F.K2) / 8) % 2 || f > F.K2 + 40 ? 1 : 0.3);
    const J0 = F.land2 - 28, LX = 540, LY = scoreTop - 240 * 62 / 64 + 120;
    hero.size = 240; hero.on = f >= J0;
    if (f < F.land2) { const q = clamp((f - J0) / (F.land2 - J0)); hero.cx = mix(270, LX, q); hero.cy = mix(1250, LY, q) - 400 * 4 * q * (1 - q); hero.rz = -360 * E.inOut(q); }
    else { const q = hitPulse(f - F.land2, 1, 5); hero.cx = LX; hero.cy = LY; hero.sx = 1 + 0.3 * q; hero.sy = 1 - 0.34 * q; hero.eye = f < F.land2 + 26 ? 0.4 : 1; }
    for (let i = 0; i < 10; i++) { const q = clamp((f - F.land2) / 40), a = -Math.PI * (0.1 + 0.8 * i / 9), vx = 9 * Math.cos(a) * 60, vy = 16 * Math.sin(a) * 60; const x = 540 + vx * q - 36, y = scoreTop + vy * q + 900 * q * q - 36; T('cn' + i, 'translate(' + (Math.round(x / 12) * 12) + 'px,' + (Math.round(y / 12) * 12) + 'px)'); O('cn' + i, f >= F.land2 && q < 1 ? 1 : 0); }
    document.querySelectorAll('#wK2 .tw').forEach((el, i) => { el.style.opacity = (Math.floor(f / 8) + i) % 4 ? 1 : 0.2; });
  }
  /* ================= K3: kaleidoscope dance ================= */
  if (sec === 'K3') {
    hero.crack = 1; crowdOn = true; fistsOn = true;
    const ph = beatPhase(f), b = lastBeat(f), bi = BEATS.indexOf(b), pump = hitPulse(f - b, 2, 6);
    const spin = 1 - prog(f, F.K3, F.K3 + 16, E.out);
    rot = -120 * spin + 6 * Math.sin((f - F.K3) / 50); zoom = lmix(1, 1.7, spin);
    T('kal3', 'rotate(' + (f * 0.8).toFixed(1) + 'deg)');
    const cols = ['#ff6ad5', '#7af7ff', '#b58cff', '#c6ff6b', '#ffd36a', '#ff6ad5'];
    for (let i = 0; i < 6; i++) { const el = $('rK' + i), rad = 200 + i * 95 + 40 * pump, c = cols[i]; el.style.width = el.style.height = (2 * rad) + 'px'; el.style.border = '6px solid ' + c; el.style.boxShadow = '0 0 30px ' + c + ', inset 0 0 30px ' + c; T(el, 'translate(' + (660 - rad) + 'px,' + (960 - rad) + 'px)'); O(el, 0.35 + 0.5 * hitPulse(f - b, 1, 8)); }
    for (let i = 0; i < 16; i++) {
      shown('c' + i, true); skin('c' + i, 'holo');
      const a = (i / 16) * Math.PI * 2 + (f - F.K3) / 70, hop = 26 * Math.abs(Math.sin(Math.PI * (ph + (i % 2) * 0.5)));
      put('c' + i, { cx: 540 + 360 * Math.cos(a), cy: 800 + 360 * Math.sin(a) - hop, size: 120, rz: a * 180 / Math.PI + 90, eye: 1, origin: '50% 50%' });
    }
    hero.cx = 540; hero.cy = 820 - 24 * Math.abs(Math.sin(Math.PI * ph)); hero.size = 230; hero.rz = 7 * Math.sin(Math.PI * 2 * ph) * (bi % 2 ? 1 : -1);
    hero.sx = 1 + 0.12 * pump; hero.sy = 1 - 0.12 * pump; hero.eye = 0.45; hero.ey = -4;
    hand('fL', 'dance-fist-left', hero.cx - 150, hero.cy + 30 - 60 * pump * (bi % 2 ? 1 : 0.4), 130, -14 - 10 * pump, true);
    hand('fR', 'dance-fist-right', hero.cx + 150, hero.cy + 30 - 60 * pump * (bi % 2 ? 0.4 : 1), 130, 14 + 10 * pump, true);
    aib.on = true; aib.look = 'holo'; aib.cx = 790; aib.cy = 1330 - 34 * Math.abs(Math.sin(Math.PI * (ph + 0.5))); aib.s = 0.66; aib.w = 230; aib.h = 160; aib.eye = 0.45; aib.rz = -8 * Math.sin(Math.PI * 2 * ph);
    { const dq = Math.abs(Math.sin(Math.PI * (ph + 0.5))), dcx = 290, dcy = 1330 - 34 * dq; put('doc', { cx: dcx, cy: dcy, size: 190, eye: 0.45, rz: -8 * Math.sin(Math.PI * 2 * ph), origin: '50% 50%' }); for (const i of [0, 1]) $('doc-e' + i).style.borderRadius = ''; T('steth', 'translate(' + (dcx - 200).toFixed(1) + 'px,' + (dcy - 120).toFixed(1) + 'px) scale(' + (190 / 340).toFixed(3) + ')'); $('steth').style.transformOrigin = '200px 120px'; T('ant', 'translate(' + (dcx - 60).toFixed(1) + 'px,' + (dcy - 78 - 150).toFixed(1) + 'px) scale(' + (190 / 340).toFixed(3) + ') rotate(' + (10 * Math.sin(Math.PI * 2 * ph)).toFixed(1) + 'deg)'); shown('ant', true); }
  }
  /* ================= K4: chrome repair ================= */
  if (sec === 'K4') {
    hero.cx = 540; hero.cy = 760; hero.size = 400; hero.crack = 1;
    /* liquid chrome runs into the cracks, then a light sweep and they are gone */
    const fill = prog(f, F.K4 + 20, F.K4 + 80, E.inOut), seal = prog(f, F.patch - 30, F.patch - 4, E.inOut);
    hero.crackCol = 'rgb(' + Math.round(mix(26, 240, fill)) + ',' + Math.round(mix(29, 246, fill)) + ',' + Math.round(mix(35, 255, fill)) + ')';
    hero.crackGlow = fill * (1 - seal); hero.crackFade = seal;
    $('floorK4').style.backgroundPosition = (-(f - F.K4) * 3) + 'px 0px';
    const pt = $('pt4'); pt.textContent = f >= F.patch ? 'PATCHED' : 'PATCHING'; O(pt, prog(f, F.K4 + 10, F.K4 + 20, E.out) * (f >= F.patch - 4 ? 0 : 1));
    const st = prog(f, F.patch - 6, F.patch, E.contact), el = $('stP');
    T(el, 'translate(260px,1090px) rotate(-6deg) scale(' + (lmix(2.6, 1, st) * (1 + 0.05 * hitPulse(f - F.patch, 1, 4))).toFixed(4) + ')');
    O(el, f >= F.patch - 6 ? 0.2 + 0.8 * st : 0);
    T('shP', 'translateX(' + mix(-120, 700, prog(f, F.patch + 6, F.patch + 26, E.inOut)).toFixed(1) + 'px) rotate(20deg)');
    const fl = hitPulse(f - F.patch, 2, 14); T('flareK4', 'translate(-260px,1158px) scaleX(' + (0.4 + 0.8 * fl).toFixed(3) + ')'); O('flareK4', fl);
    const pr = springAt(SPR.snap, f, F.patch); hero.size = 400 * (1 + 0.05 * clamp(pr)); hero.eye = f >= F.patch + 2 && f < F.patch + 34 ? 0.4 : blink(f, F.K4 + 70); hero.ey = f >= F.patch + 2 && f < F.patch + 34 ? -8 : 0;
    hero.ry = 12 * Math.sin((f - F.K4) / 40);
  }
  /* ================= L: pixel rooftop ================= */
  if (sec === 'L') {
    hero.cx = 340; hero.cy = 1240; hero.size = 320; hero.rx = 56; hero.rz = -6;
    const br = Math.sin((f - F.L) / 60 * Math.PI * 2 * 0.3);
    hero.sx = 1 + 0.02 * br; hero.sy = 1 - 0.02 * br;
    const sq = prog(f, F.pill + 12, F.pill + 20, E.smooth) * (1 - prog(f, F.inBin, F.inBin + 10, E.smooth));
    const droop = prog(f, F.droop, F.droop + 70, E.smooth), wake = prog(f, F.toot + 2, F.toot + 10, E.out);
    hero.eye = ((0.6 - 0.25 * sq) * (1 - 0.8 * droop) + 0.4 * wake) * blink(f, BEATS[56] + 4) * blink(f, BEATS[58] + 10); hero.ex = -8 * sq;
    hero.sy *= 1 - 0.07 * hitPulse(f - BEATS[56], 3, 10); hero.sx *= 1 + 0.05 * hitPulse(f - BEATS[56], 3, 10);
    const fk = hitPulse(f - F.flick, 1, 5); hero.rz += 22 * fk;
    hero.sy *= 1 - 0.12 * hitPulse(f - F.toot, 1, 4); hero.sx *= 1 + 0.08 * hitPulse(f - F.toot, 1, 4);
    aib.on = true; aib.look = 'pixel'; aib.cx = 655; aib.cy = 1290; aib.s = 0.86; aib.w = 230; aib.h = 160; aib.rz = 10; aib.sy = 0.86 - 0.02 * br;
    const side = prog(f, F.look, F.look + 12, E.smooth);
    aib.eye = (0.55 * (1 - 0.8 * droop) + 0.15 * side + 0.25 * wake) * blink(f, BEATS[57] + 6); aib.ex = -26 * side - 14 * prog(f, BEATS[57], BEATS[57] + 14, E.smooth) * (1 - prog(f, BEATS[59], BEATS[59] + 14, E.smooth));
    /* the camera starts on the sky and tilts down to them */
    camY = 760 * (1 - prog(f, F.L, F.L + 80, E.cam));
    pxT('lFarW', -(f - F.L) * 0.8);
    document.querySelectorAll('#wL .tw').forEach((el, i) => { el.style.opacity = (Math.floor(f / 12) + i) % 5 ? 1 : 0.15; });
    document.querySelectorAll('#wL .bulb').forEach((el, i) => { el.style.opacity = (Math.floor(f / 16) + i) % 4 === 0 ? 0.35 : 1; });
    /* a shooting star on the 27.93 beat */
    const ss = clamp((f - BEATS[59]) / 30); T('shootW', 'translate(' + (Math.round((960 - 900 * ss) / 12) * 12) + 'px,' + (Math.round((300 + 260 * ss) / 12) * 12) + 'px)'); O('shootW', f >= BEATS[59] && ss < 1 ? 1 - ss * ss : 0);
    /* the popup: pops in steps, he flicks it, one rebound on the rim, gone */
    const pp = f >= F.pill ? Math.min(1, Math.floor((f - F.pill) / 3 + 1) / 3) : 0, u = $('upd');
    let px = 540, py = 720, ps = pp, pr = -3;
    if (f >= F.flick) {
      if (f < F.rim) { const q = (f - F.flick) / (F.rim - F.flick); px = mix(540, 830, q); py = mix(720, 1110, q) - 260 * 4 * q * (1 - q); ps = mix(1, 0.32, q); pr = -3 + 300 * q; }
      else if (f < F.inBin) { const q = (f - F.rim) / (F.inBin - F.rim); px = mix(830, 870, q); py = 1110 - 90 * 4 * q * (1 - q) + 60 * q * q; ps = 0.32; pr = 297 + 160 * q; }
      else { ps = 0; }
    }
    T(u, 'translate(' + (px - updW / 2).toFixed(1) + 'px,' + (py - updH / 2).toFixed(1) + 'px) rotate(' + pr.toFixed(1) + 'deg) scale(' + ps.toFixed(4) + ')'); shown(u, f >= F.pill && f < F.inBin);
    T('binW', 'translate(' + (870 - 84) + 'px,' + (1258 - 96 + 6 * hitPulse(f - F.rim, 1, 4) + 6 * hitPulse(f - F.inBin, 1, 4)).toFixed(1) + 'px) rotate(' + (3 * hitPulse(f - F.rim, 1, 5)).toFixed(2) + 'deg)');
    /* the toot: a pixel cloud */
    for (let i = 0; i < 7; i++) {
      const el = $('pf' + i), d = F.toot + i * 2 + Math.round(rand('pd' + i) * 2), life = 46 + Math.round(rand('pl' + i) * 18), q = clamp((f - d) / life);
      const r = Math.round(30 * (1 + 2.2 * E.out(q)) / 12) * 12, x = 340 - 170 - 90 * E.out(q) * (0.5 + rand('px' + i)), y = 1240 + 70 - 110 * E.out(q) * (0.6 + rand('py' + i)) + (rand('pz' + i) - 0.5) * 30;
      el.style.width = el.style.height = r + 'px'; T(el, 'translate(' + (Math.round((x - r / 2) / 12) * 12) + 'px,' + (Math.round((y - r / 2) / 12) * 12) + 'px)'); O(el, f >= d && q < 1 ? (q < 0.7 ? 1 : 0.5) : 0);
    }
  }

  /* ---------- the cast ---------- */
  skin('h', HERO_SKIN[sec]);
  if (hero.on) put('h', { cx: hero.cx + hero.dx, cy: hero.cy + hero.dy, size: hero.size, sx: hero.sx, sy: hero.sy, rz: hero.rz, ry: hero.ry, rx: hero.rx, eye: hero.eye, ex: hero.ex, ey: hero.ey });
  shown('h', hero.on && !halves);
  crack('h', hero.crack);
  const crl = document.querySelectorAll('#h .crl');
  crl.forEach(el => { el.style.opacity = hero.crackFade != null ? (1 - hero.crackFade).toFixed(3) : '1'; if (hero.crackCol) el.setAttribute('stroke', hero.crackCol); else el.setAttribute('stroke', SKIN[HERO_SKIN[sec]].crack); el.style.filter = hero.crackGlow ? 'drop-shadow(0 0 ' + (8 * hero.crackGlow).toFixed(1) + 'px rgba(220,235,255,.95))' : 'none'; });
  for (const [id, sgn, clip] of [['hA', -1, ${JSON.stringify(halfL)}], ['hB', 1, ${JSON.stringify(halfR)}]]) {
    shown(id, halves); if (!halves) continue;
    const q = prog(f, F.brk + 2, F.brk + 8, E.out) * (1 - prog(f, F.brk + 16, F.brk + 24, E.inOut));
    $(id).style.clipPath = clip; crack(id, 1); skin(id, 'void');
    put(id, { cx: hero.cx + sgn * 18 * q, cy: hero.cy + 6 * q, size: hero.size, rz: sgn * 6 * q, eye: hero.eye });
  }
  $('crowd').style.display = crowdOn ? 'block' : 'none';
  if (!fistsOn) { $('fL').style.display = 'none'; $('fR').style.display = 'none'; }
  aiBub(aib);

  /* ---------- transitions ---------- */
  /* A to B: a new sheet through the printer, the roller wiping down */
  { const p = prog(f, F.B - 6, F.B + 6, E.inOut), on = f >= F.B - 6 && f < F.B + 6, y = p * 1920;
    shown('roll', on); T('roll', 'translateY(' + (y - 23).toFixed(1) + 'px)');
    $('wB').style.clipPath = on ? 'inset(0 0 ' + (100 - p * 100).toFixed(2) + '% 0)' : 'none';
    $('cast').style.clipPath = on ? (f < F.B ? 'inset(' + y.toFixed(1) + 'px 0 0 0)' : 'inset(0 0 ' + (1920 - y).toFixed(1) + 'px 0)') : 'none';
    $('crowd').style.clipPath = $('cast').style.clipPath; }
  /* B to C: the eye closes on the copies and opens on her world */
  { const close = prog(f, F.whip, F.C, E.in), open = prog(f, F.C, F.C + 14, E.out), on = f >= F.whip && f < F.C + 14;
    const k = f < F.C ? close : 1 - open;
    shown('lidT', on); shown('lidB', on);
    $('lidT').style.borderRadius = '0 0 50% 50% / 0 0 ' + (40 * (1 - k) + 2).toFixed(0) + '% ' + (40 * (1 - k) + 2).toFixed(0) + '%'; $('lidB').style.borderRadius = '50% 50% 0 0 / ' + (40 * (1 - k) + 2).toFixed(0) + '% ' + (40 * (1 - k) + 2).toFixed(0) + '% 0 0';
    T('lidT', 'translateY(' + (-1100 + 1100 * k * (960 / 1100)).toFixed(1) + 'px)'); T('lidB', 'translateY(' + (1920 - 960 * k).toFixed(1) + 'px)'); }
  /* C to D: black and white stripes slice across */
  { const c = F.D, on = f >= c - 8 && f < c + 8;
    for (let i = 0; i < 16; i++) { const el = $('sb' + i); shown(el, on); if (!on) continue; const d = i % 2 ? 1 : -1, ii = prog(f, c - 8 + (i % 4), c, E.in), oo = prog(f, c, c + 8 - (i % 4), E.out); T(el, 'translateX(' + (f < c ? d * 1080 * (1 - ii) : -d * 1080 * oo).toFixed(1) + 'px)'); } }
  /* D to E: the blue circle grows to fill, then lands as the first shape */
  { const p = prog(f, F.E - 8, F.E, E.in); shown('tcirc', f >= F.E - 8 && f < F.E); T('tcirc', 'scale(' + (0.1 + 22 * p).toFixed(3) + ')'); }
  /* F to G and K1 to K2: a pixel mosaic, in and out in random order */
  { let c = 0; if (f >= F.G - 9 && f < F.G + 9) c = F.G; if (f >= F.K2 - 9 && f < F.K2 + 9) c = F.K2;
    for (let i = 0; i < MZ.length; i++) { const el = $('mz' + i), m = MZ[i]; const vis1 = c && (f < c ? f >= c - 9 + Math.floor(m.a * 8) : f < c + 1 + Math.floor(m.b * 8)); el.style.display = vis1 ? 'block' : 'none'; if (vis1) el.style.background = m.c; } }
  /* J to K1: the page tears away upward */
  { const p = prog(f, F.K1, F.K1 + 14, E.in); shown('tear', f >= F.K1 && f < F.K1 + 14); T('tear', 'translateY(' + (-2000 * p).toFixed(1) + 'px) rotate(' + (-3 * p).toFixed(2) + 'deg)'); }
  /* K3 to K4: a wave of liquid chrome rises through */
  { const c = F.K4, on = f >= c - 10 && f < c + 12, p = f < c ? prog(f, c - 10, c, E.in) : 1 + prog(f, c, c + 12, E.out);
    shown('flood', on); T('flood', 'translateY(' + (1920 - 2160 * p).toFixed(1) + 'px)');
    const wv = Array.from({ length: 13 }, (_, i) => (i * 90) + 'px ' + (40 + 30 * Math.sin(i * 0.9 + f / 3)).toFixed(0) + 'px').join(',');
    $('flood').style.clipPath = 'polygon(' + wv + ',1080px 2400px,0 2400px)'; }

  /* ---------- the camera ---------- */
  const k = camAt(f, sec) * zoom;
  const org = sec === 'H' ? '540px 780px' : sec === 'K3' ? '540px 820px' : '540px 860px';
  $('cam').style.transformOrigin = org;
  T('cam', 'translate(' + shx.toFixed(1) + 'px,' + (shy + camY).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + k.toFixed(5) + ')');
  /* the grain moves every two frames */
  const gx = Math.floor(rand('gx' + Math.floor(f / 2)) * 200), gy = Math.floor(rand('gy' + Math.floor(f / 2)) * 200);
  document.querySelectorAll('.grainL').forEach(el => { el.style.transform = 'translate(' + (gx - 100) + 'px,' + (gy - 100) + 'px)'; });

  /* ---------- karaoke: each world lights its words its own way, on the sung frame ---------- */
  CAPS.forEach((c, g) => {
    const on = f >= c.in && f < c.out; vis('cap' + g, on); if (!on) return;
    const io = prog(f, c.in, c.in + 6, E.out), oo = prog(f, c.out - 5, c.out, E.in);
    T('capb' + g, 'translateY(' + (24 * (1 - io) + 16 * oo).toFixed(1) + 'px) scale(' + (mix(0.92, 1, io) * (1 - 0.05 * oo)).toFixed(4) + ')'); O('capb' + g, io * (1 - oo));
    c.rows.forEach(r => r.forEach(w => {
      const el = $('w' + w.i), lit = f >= w.f, a = f - w.f;
      el.className = 'w' + (lit ? ' lit' : '');
      let sc = 1;
      if (c.style === 'riso') { const p = lit ? prog(f, w.f, w.f + 6, E.out) : 0; sc = lit ? lmix(1.28, 1, p) : 1; el.style.textShadow = lit ? (16 - 11 * p).toFixed(1) + 'px ' + (12 - 8 * p).toFixed(1) + 'px 0 rgba(44,79,255,.9)' : 'none'; }
      if (c.style === 'holo') { sc = lit ? 1 + 0.14 * hitPulse(a, 1, 6) : 1; el.style.backgroundPosition = lit ? (100 - 100 * prog(f, w.f, w.f + 16, E.out) + 20 * Math.sin(f / 20)).toFixed(1) + '% 0' : ''; }
      if (c.style === 'chrome') { sc = lit ? 1 + 0.1 * hitPulse(a, 1, 6) : 1; el.style.backgroundPosition = lit ? (100 - 100 * prog(f, w.f, w.f + 14, E.inOut)).toFixed(1) + '% 0, 0 0' : ''; }
      if (c.style === 'pixel') { sc = !lit ? 1 : a < 3 ? 1.36 : a < 6 ? 1.18 : 1; }
      if (c.style === 'warp') { const q = lit ? Math.max(0.12, 1 - a / 10) : 0; sc = lit ? 1 + 0.12 * hitPulse(a, 1, 6) : 1; el.style.textShadow = lit ? (-14 * q).toFixed(1) + 'px 0 0 rgba(255,47,208,.9),' + (14 * q).toFixed(1) + 'px 0 0 rgba(47,243,255,.9),0 0 22px rgba(160,200,255,.8)' : 'none'; }
      if (c.style === 'void') { sc = lit ? 1 + 0.12 * hitPulse(a, 1, 8) : 1; }
      T(el, 'scale(' + sc.toFixed(4) + ')');
    }));
  });

  /* ---------- the glitch cut ---------- */
  const gon = f >= F.glitch;
  for (let i = 0; i < 9; i++) {
    const d = $('gs' + i); d.style.visibility = gon ? 'visible' : 'hidden'; if (!gon) continue;
    const r = rand('gc' + i + '_' + Math.floor(f / 2)), h = 40 + r * 180, y = rand('gy' + i + '_' + Math.floor(f / 2)) * 1920;
    d.style.top = y.toFixed(0) + 'px'; d.style.height = h.toFixed(0) + 'px';
    d.style.background = ['rgba(255,0,60,.85)', 'rgba(0,255,230,.8)', '#000', '#fff', 'rgba(255,214,10,.8)'][i % 5];
    T(d, 'translateX(' + ((r - .5) * 300).toFixed(0) + 'px)'); d.style.mixBlendMode = i % 5 < 2 ? 'screen' : 'normal';
  }
  if (gon) T('cam', 'translate(' + ((rand('gx' + Math.floor(f / 2)) - .5) * 80).toFixed(0) + 'px,0px) scale(' + k.toFixed(5) + ')');
}
function chewAt(f) {
  const z = { x: 0, k: 0, rot: 0 }, a = F.bite + 15, per = 12;
  if (f >= a && f < a + 3 * per) { const i = Math.floor((f - a) / per), u = (f - a - i * per) / per, q = u < 0.34 ? E.smooth(u / 0.34) : 1 - E.smooth((u - 0.34) / 0.66), s = i % 2 ? 1 : -1; z.k = 0.06 * q; z.x = s * 8 * q; z.rot = s * 3 * q; }
  return z;
}
window.__probe = f => {
  const lit = [...document.querySelectorAll('.w.lit')].filter(el => el.offsetParent).map(el => +el.id.slice(1));
  let overlap = null; const cap = [...document.querySelectorAll('.cap')].find(el => el.style.display === 'block');
  const face = $('h-face').getBoundingClientRect(), hv = $('h').style.visibility !== 'hidden';
  if (cap && hv) { const b = cap.querySelector('.capb').getBoundingClientRect(); if (b.width && !(face.bottom < b.top || face.top > b.bottom || face.right < b.left || face.left > b.right)) overlap = [Math.round(face.bottom), Math.round(b.top)]; }
  const m = hv ? { l: Math.round(face.left), r: Math.round(face.right), t: Math.round(face.top), b: Math.round(face.bottom) } : null;
  return { lit, overlap, m, sec: secOf(f) };
};
`;

const page = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920"><title>song1</title>
<script src="gsap.min.js"></script><script src="motion.js"></script>
<style>${css}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="${MAIN / FPS}" data-fps="${FPS}" data-width="1080" data-height="1920">
<div id="stage" class="clip" data-start="0" data-duration="${MAIN / FPS}" data-track-index="0" data-layout-allow-overflow data-layout-allow-occlusion data-layout-allow-overlap>
${html}
</div></div>
<script>
(function () {
const M = window.MOTION, { E, prog, mix, lmix, hitPulse, clamp, rand, SPR } = M;
const $ = id => typeof id === 'string' ? document.getElementById(id) : id;
const T = (el, s) => { $(el).style.transform = s; };
const O = (el, v) => { $(el).style.opacity = (+v).toFixed(3); };
const blurIn = (p, max) => { const b = max * (1 - clamp(p / 0.6)); return b < 0.75 ? 0 : b; };
const springAt = (cfg, f, start) => { const x = M.springFn(cfg); return f <= start ? 0 : x((f - start) / 60); };
function rig(id, o) {
  T(id, 'translate(' + o.x.toFixed(2) + 'px,' + o.y.toFixed(2) + 'px) scale(' + (o.s == null ? 1 : o.s).toFixed(4) + ')');
  const sq = $(id + '-sq'); sq.style.transformOrigin = o.origin || '50% 50%'; sq.style.transform = 'scale(' + (o.sx || 1).toFixed(4) + ',' + (o.sy || 1).toFixed(4) + ')';
  T(id + '-r', 'rotateZ(' + (o.rz || 0).toFixed(2) + 'deg) rotateX(' + (o.rx || 0).toFixed(2) + 'deg) rotateY(' + (o.ry || 0).toFixed(2) + 'deg)');
  const ey = Math.max(0.08, o.eye == null ? 1 : o.eye);
  for (const i of [0, 1]) T(id + '-e' + i, 'translate(' + (o.ex || 0).toFixed(2) + 'px,' + (o.ey || 0).toFixed(2) + 'px) scaleY(' + ey.toFixed(3) + ')');
}
function build() {
${js}
  const clock = { f: 0 };
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(clock, { f: 0 }, { f: ${MAIN}, duration: ${MAIN / FPS}, ease: 'none', onUpdate: () => paint(clock.f) }, 0);
  paint(0);
  window.__paint = paint; window.__ready = true;
  window.__timelines['main'] = tl;
}
window.__timelines = window.__timelines || {};
Promise.all(['400 100px "Archivo Black"', '900 100px "Archivo Wide"', '500 100px "JetBrains Mono"', '400 100px "Silkscreen"', '700 100px "Silkscreen"'].map(s => document.fonts.load(s))).then(build);
})();
</script></body></html>`;
writeFileSync(new URL('index.html', P), page);
console.log('wrote song1/index.html, main', (MAIN / FPS).toFixed(2) + 's, end card', (END / FPS).toFixed(2) + 's');

/* ---------- the equalizer: the song itself, 24 log bands, 45 hertz to 12k, per frame ---------- */
{
  const LEN0 = mono.length, N = 2048, f0 = F.K1 - 2, f1 = F.K2 + 1, hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  const edges = Array.from({ length: 25 }, (_, i) => 45 * Math.pow(12000 / 45, i / 24));
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
    }
  };
  const dbs = [];
  for (let fq = f0; fq < f1; fq++) {
    const c = Math.round(fq / FPS * SR), re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { const j = c - N / 2 + i; re[i] = j >= 0 && j < LEN0 ? mono[j] * hann[i] : 0; }
    fft(re, im);
    dbs.push(edges.slice(0, 24).map((lo, b) => { const k0 = Math.max(1, Math.floor(lo * N / SR)), k1 = Math.max(k0, Math.ceil(edges[b + 1] * N / SR)); let e = 0; for (let k = k0; k <= k1; k++) e += re[k] * re[k] + im[k] * im[k]; return 10 * Math.log10(e / (k1 - k0 + 1) + 1e-12); }));
  }
  const lo = [], hi = []; for (let b = 0; b < 24; b++) { const v = dbs.map(r => r[b]).sort((p, q) => p - q); lo.push(v[Math.floor(v.length * 0.1)]); hi.push(v[v.length - 1]); }
  const rel8 = Math.exp(-1 / (0.08 * FPS)), held = new Float64Array(24);
  const BARS = dbs.map(r => r.map((d, b) => { const v = Math.max(0, Math.min(1, (d - lo[b]) / Math.max(3, hi[b] - lo[b]))); held[b] = v > held[b] ? v : v + rel8 * (held[b] - v); return Math.round(100 * (0.12 + 0.88 * held[b])); }));
  const pf = new URL('index.html', P);
  writeFileSync(pf, readFileSync(pf, 'utf8').replace('const BARS = null, BARS0 = 0;', 'const BARS = ' + JSON.stringify(BARS) + ', BARS0 = ' + f0 + ';'));
}

/* ---------- sound: the song untouched, effects under it ---------- */
const TOTAL_S = (MAIN + END) / FPS, LEN = Math.round(TOTAL_S * SR);
const stereo = (() => {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', SONG, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  const a = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4), L = new Float32Array(LEN), R = new Float32Array(LEN);
  for (let i = 0; i < Math.min(LEN, a.length / 2); i++) { L[i] = a[2 * i]; R[i] = a[2 * i + 1]; }
  return { L, R, n: a.length / 2 };
})();
const VOC = (() => { const p = fileURLToPath(new URL('song1/vocal.mp3', here)); return existsSync(p) ? decode(FFMPEG, p) : null; })();
if (!VOC) throw new Error('song1/vocal.mp3 missing: the isolated vocal the effects are set against');
const wavOf = k => decode(FFMPEG, fileURLToPath(new URL('sfx/' + k + '.wav', here)));
const SFX = Object.fromEntries(['boom', 'pop', 'zipUp', 'zipDown', 'stutter'].map(k => [k, wavOf(k)]));
const buf = c => SFX[c.kind] ? SFX[c.kind] : VOICES[c.kind](c.opts || {});
const at = f => f / FPS;
const cues = [
  { t: at(F.land0), kind: 'boom', big: 1 }, { t: at(F.hop0), kind: 'pop' },
  ...[0, 2, 4].map(k => ({ t: at(F.type0 + k * 14 + 2), kind: 'key' })), { t: at(F.enter + 2), kind: 'press' }, { t: at(F.plate), kind: 'pop' }, { t: at(F.bite), kind: 'crunch' },
  { t: at(F.copy), kind: 'boom', big: 1 }, { t: at(F.paste), kind: 'boom', big: 1 }, { t: at(F.paste + 6), kind: 'stutter' }, { t: at(F.whip + 4), kind: 'zipUp' },
  { t: at(F.girl), kind: 'pop' }, { t: at(F.diff), kind: 'servo' },
  { t: at(F.D - 4), kind: 'zipDown' }, { t: at(F.stamp), kind: 'boom', big: 1 }, { t: at(F.stamp + 6), kind: 'ding' },
  ...F.ai1.map(a => ({ t: at(a), kind: 'boom', big: 1 })),
  { t: at(F.help), kind: 'ring', opts: { len: 0.5 } },
  { t: at(F.called), kind: 'zipDown' }, { t: at(F.bot), kind: 'boing' }, { t: at(F.too), kind: 'chirp' },
  ...F.ai2.map(a => ({ t: at(a), kind: 'boom', big: 1 })),
  { t: at(F.brk), kind: 'crunch', big: 1 }, { t: at(F.brk), kind: 'ring', opts: { len: 0.35 } },
  { t: at(F.ai), kind: 'pop' }, { t: at(F.me), kind: 'pop' }, { t: at(F.flop), kind: 'boom', big: 1 },
  { t: at(F.K1), kind: 'zipUp' }, { t: at(F.K2), kind: 'zipUp' }, { t: at(F.land2), kind: 'boom', big: 1 }, { t: at(F.K3), kind: 'pop' },
  { t: at(F.K4), kind: 'zipDown' }, { t: at(F.patch), kind: 'boom', big: 1 }, { t: at(F.patch + 6), kind: 'ding' },
  { t: at(F.pill), kind: 'pop' }, { t: at(F.flick), kind: 'tock', opts: { f: 2600 } }, { t: at(F.rim), kind: 'tock' }, { t: at(F.inBin), kind: 'pop' },
  { t: at(F.toot), kind: 'fart', alone: 1 }, { t: at(F.glitch), kind: 'stutter' },
  /* the end card's own: the build in, the mark landing */
  { t: at(MAIN + 65 - EC0), kind: 'boom', big: 1 },
];
const rmsOf = (b, a, z) => { let s = 0; a = Math.max(0, a); z = Math.min(b.length, z); for (let i = a; i < z; i++) s += b[i] * b[i]; return Math.sqrt(s / Math.max(1, z - a)); };
const songM = new Float32Array(LEN); for (let i = 0; i < LEN; i++) songM[i] = 0.5 * (stereo.L[i] + stereo.R[i]);
const songRms = rmsOf(songM, Math.round(1.5 * SR), Math.round(31 * SR));
const w20 = Math.round(0.02 * SR), loud20 = (b, a, z) => { let m = 0; for (let i = a; i + w20 <= z; i += 240) m = Math.max(m, rmsOf(b, i, i + w20)); return m; };
const bus = new Float32Array(LEN), FX = [];
for (const c of cues) {
  const b = buf(c), a = Math.round(c.t * SR), z = Math.min(LEN, a + b.length);
  const own = loud20(b, 0, b.length);
  const sLoc = Math.max(rmsOf(songM, a - Math.round(0.15 * SR), a + Math.round(0.35 * SR)), songRms * Math.pow(10, -14 / 20));
  const vLoc = rmsOf(VOC, a, a + Math.round(0.25 * SR));
  let target = c.alone ? songRms * Math.pow(10, -7 / 20) : sLoc * Math.pow(10, (c.big ? -4 : -9) / 20);
  const sung = vLoc > sLoc * Math.pow(10, -14 / 20);
  if (sung && !c.alone) target = Math.min(target, vLoc * Math.pow(10, -6 / 20));
  const g = target / own;
  for (let i = a; i < z; i++) bus[i] += b[i - a] * g;
  FX.push({ c, a, z, b, g, sung, vLoc });
}
/* a soft limiter on the effects bus alone, solved against the song sample by sample */
const gl = new Float32Array(LEN).fill(1), la = Math.round(0.003 * SR), rel = Math.exp(-1 / (0.06 * SR));
let ceil = Math.pow(10, -1.3 / 20), m;
const mixL = new Float32Array(LEN), mixR = new Float32Array(LEN);
const wav = fileURLToPath(new URL('mix.wav', V));
function writeStereo(file, L, R) {
  const n = L.length, bytes = n * 6, head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + bytes, 4); head.write('WAVE', 8); head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
  head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 6, 28); head.writeUInt16LE(6, 32); head.writeUInt16LE(24, 34); head.write('data', 36); head.writeUInt32LE(bytes, 40);
  const body = Buffer.alloc(bytes);
  for (let i = 0; i < n; i++) for (const [c, x] of [[0, L[i]], [1, R[i]]]) { const v = Math.round(Math.max(-1, Math.min(1, x)) * 8388607); body.writeIntLE(v, i * 6 + c * 3, 3); }
  writeFileSync(file, Buffer.concat([head, body]));
}
for (let n = 0; n < 10; n++) {
  const need = new Float32Array(LEN).fill(1);
  for (let i = 0; i < LEN; i++) { const h = bus[i]; if (!h) continue; for (const s of [stereo.L[i], stereo.R[i]]) { const x = s + h; if (Math.abs(x) > ceil) need[i] = Math.min(need[i], Math.max(0, Math.min(1, (ceil * Math.sign(x) - s) / h))); } }
  const mn = new Float32Array(LEN); for (let i = 0; i < LEN; i++) { let q = 1; for (let j = Math.max(0, i - la); j <= Math.min(LEN - 1, i + la); j++) if (need[j] < q) q = need[j]; mn[i] = q; }
  let g = 1; for (let i = 0; i < LEN; i++) { let q = 0; for (let j = i; j < Math.min(LEN, i + la); j++) q += mn[j]; q /= Math.min(la, LEN - i); g = q < g ? q : q + rel * (g - q); gl[i] = Math.min(g, mn[i]); }
  for (let i = 0; i < LEN; i++) { mixL[i] = stereo.L[i] + bus[i] * gl[i]; mixR[i] = stereo.R[i] + bus[i] * gl[i]; }
  writeStereo(wav, mixL, mixR);
  m = loudness(FFMPEG, wav);
  if (m.truePeak <= -1.0) break;
  ceil *= Math.pow(10, -0.3 / 20);
}
let lim = 1; for (let i = 0; i < LEN; i++) lim = Math.min(lim, gl[i]);
const songOnly = (() => { writeStereo(fileURLToPath(new URL('song-only.wav', V)), stereo.L, stereo.R); return loudness(FFMPEG, fileURLToPath(new URL('song-only.wav', V))); })();
console.log('mix:', JSON.stringify({ lufs: m.lufs, truePeak: m.truePeak, songLufs: songOnly.lufs, songPeak: songOnly.truePeak, effects: FX.length, limiterMaxDb: +(20 * Math.log10(lim)).toFixed(1) }));
/* every effect against the vocal where she sings, and against the song */
for (const o of FX) {
  let best = 0, bi = o.a; for (let i = o.a; i + w20 <= o.z; i += 240) { let e = 0; for (let j = i; j < i + w20; j++) { const v = o.b[j - o.a] * o.g * gl[j]; e += v * v; } e = Math.sqrt(e / w20); if (e > best) { best = e; bi = i; } }
  const vAt = rmsOf(VOC, bi, bi + w20), sAt = rmsOf(songM, bi, bi + w20);
  console.log('fx', o.c.t.toFixed(2).padStart(6), o.c.kind.padEnd(8), 'vs song', (20 * Math.log10(best / Math.max(1e-6, sAt))).toFixed(1).padStart(6), 'dB', o.sung ? ', vs vocal ' + (20 * Math.log10(best / Math.max(1e-6, vAt))).toFixed(1) + ' dB' : '');
}

/* ---------- render, join ---------- */
if (!process.argv.includes('--no-render')) {
  execFileSync(HF, ['render', '.', '--workers', '1', '--fps', '60', '-q', 'high', '-o', 'main.mp4', '--quiet'], { cwd: fileURLToPath(P), stdio: 'inherit', shell: true });
  /* the end card: promo1's render (cinetic-test without the url), its first END frames */
  const EC = fileURLToPath(new URL('promo1-end/end.mp4', here));
  if (!existsSync(EC)) throw new Error('render promo1 first: its end card hf/promo1-end/end.mp4 is reused here');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', fileURLToPath(new URL('main.mp4', P)), '-i', EC, '-i', wav,
    '-filter_complex', '[1:v]trim=start_frame=' + EC0 + ':end_frame=' + (EC0 + END) + ',setpts=PTS-STARTPTS[e];[0:v][e]concat=n=2:v=1:a=0,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', TOTAL_S.toFixed(3), '-movflags', '+faststart', OUT]);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', OUT, '-vf', 'fps=2,scale=180:-1,tile=12x6', '-frames:v', '1', fileURLToPath(new URL('contact.png', V))]);
  console.log('wrote', OUT);
}
