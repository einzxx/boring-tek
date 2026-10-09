/* promo1-lv, the latvian promo1. same girl, same visuals, same beat order, same
   sounds as the final english and russian cuts, every beat moved to the latvian
   take's words (promo1-lv/words.json, elevenlabs speech to text plus silence
   detection on promo-voice-lv.mp3), every word on screen in latvian except the end
   card wordmark.

   fonts: the same five as english. their files in lab/fonts/ are latin only cuts
   with none of the latvian letters, so each also loads its latin-ext cut from
   fonts-lv/ (the same font build, split by unicode range).

   no music by default: the voice exactly as the file, the effects at the final
   levels. --music adds the three tracks under that, as promo1.mjs --music does.
   the english and russian generators and their folders are not touched.

   usage: node hf/promo1-lv.mjs [--music] [--stills 1,2.5] [--no-render] */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mascot } from './lab/kit.mjs';
import { renderList, master, decode, voiceEnvelope, mixdown, writeWav, loudness, SR, GAINS, VOICES } from '../lib/sfx.mjs';

const here = new URL('.', import.meta.url);
const P = new URL('promo1-lv/', here);
const require = createRequire(new URL('../package.json', here));
const FFMPEG = require('ffmpeg-static');
const HF = fileURLToPath(new URL('node_modules/.bin/hyperframes' + (process.platform === 'win32' ? '.cmd' : ''), here));
/* --no-music: the voice exactly as the source file, the effects at the first render's
   level under her, no bed, no master, only a peak check that lowers the effects */
const NOMUSIC = !process.argv.includes('--music');
/* --music: the nomusic mix exactly (voice untouched, effects at its levels) with the
   three tracks under it, about level with her in the gaps and 3 dB down while she
   talks, the part 3 equalizer driven by the music itself */
const MUSICMIX = process.argv.includes('--music'), EFX = NOMUSIC || MUSICMIX;
const OUT = fileURLToPath(new URL(MUSICMIX ? '../out/promo1-lv-music-1080x1920.mp4' : '../out/promo1-lv-nomusic-1080x1920.mp4', here));
const V = new URL('../out/verify-promo1-lv/', here);
mkdirSync(V, { recursive: true });
mkdirSync(new URL('fonts/', P), { recursive: true });
mkdirSync(new URL('assets/', P), { recursive: true });
const FPS = 60, END = 240;
const fr = t => Math.round(t * FPS);

/* ---------- the voice, word by word ---------- */
const W = JSON.parse(readFileSync(new URL('words.json', P), 'utf8')).map(([text, s, e]) => ({ text, s, e }));
const ws = i => W[i].s, wf = i => fr(W[i].s);
const MAIN = fr(39.05);                            /* the glitch after garlaicīgs, the take is 39.08s */

/* ---------- the girl: clean the alpha, add the outline ---------- */
const OUTLINE = 26;
function girlSticker(n) {
  const src = fileURLToPath(new URL('girl/girl-' + n + '.png', here));
  const dst = fileURLToPath(new URL('assets/girl-' + n + '.png', P));
  const probe = spawnSync(FFMPEG, ['-i', src], { encoding: 'utf8' }).stderr.match(/(\d{3,5})x(\d{3,5})/);
  const w = +probe[1], h = +probe[2];
  const raw = spawnSync(FFMPEG, ['-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 }).stdout;
  const N = w * h, A = new Uint8Array(N);
  for (let i = 0; i < N; i++) A[i] = raw[i * 4 + 3];
  /* islands: 4 connected, keep the big ones */
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
  /* trim the fringe: erode one pixel */
  const M2 = new Uint8Array(N);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; M2[i] = M[i] && M[i - 1] && M[i + 1] && M[i - w] && M[i + w] ? 1 : 0;
  }
  /* crop to the kept pixels plus room for the outline */
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < N; i++) if (M2[i]) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = OUTLINE + 6, cw = x1 - x0 + 1 + 2 * pad, ch = y1 - y0 + 1 + 2 * pad, CN = cw * ch;
  /* distance to the silhouette, chamfer 3-4, for a round thick outline */
  const D = new Float32Array(CN).fill(1e9);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const sx = x + x0 - pad, sy = y + y0 - pad;
    if (sx >= 0 && sy >= 0 && sx < w && sy < h && M2[sy * w + sx]) D[y * cw + x] = 0;
  }
  const relax = (i, j, c) => { if (D[j] + c < D[i]) D[i] = D[j] + c; };
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (x) relax(i, i - 1, 3); if (y) { relax(i, i - cw, 3); if (x) relax(i, i - cw - 1, 4); if (x < cw - 1) relax(i, i - cw + 1, 4); } }
  for (let y = ch - 1; y >= 0; y--) for (let x = cw - 1; x >= 0; x--) { const i = y * cw + x; if (x < cw - 1) relax(i, i + 1, 3); if (y < ch - 1) { relax(i, i + cw, 3); if (x < cw - 1) relax(i, i + cw + 1, 4); if (x) relax(i, i + cw - 1, 4); } }
  const out = Buffer.alloc(CN * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x, d = D[i] / 3;
    const ow = Math.max(0, Math.min(1, OUTLINE - d + 0.5));         /* white outline alpha */
    const sx = x + x0 - pad, sy = y + y0 - pad, inside = sx >= 0 && sy >= 0 && sx < w && sy < h && M2[sy * w + sx];
    const k = inside ? (sy * w + sx) * 4 : -1;
    const ga = inside ? raw[k + 3] / 255 : 0;
    const a = ga + ow * (1 - ga);
    for (let c = 0; c < 3; c++) out[i * 4 + c] = a ? Math.round(((inside ? raw[k + c] : 0) * ga + 255 * ow * (1 - ga)) / a) : 0;
    out[i * 4 + 3] = Math.round(a * 255);
  }
  spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', cw + 'x' + ch, '-i', '-', dst], { input: out });
  return { w: cw, h: ch, dropped: sizes.filter((s, i) => !keep[i]).length };
}
const GIRL = [1, 2, 3, 4].map(girlSticker);
console.log('girl stickers', GIRL.map(g => g.w + 'x' + g.h + ' dropped ' + g.dropped).join(', '));

/* ---------- fonts, kit ---------- */
for (const d of ['lab/fonts/', 'fonts-lv/']) for (const f of readdirSync(new URL(d, here))) copyFileSync(new URL(d + f, here), new URL('fonts/' + f, P));
copyFileSync(new URL('project/fonts/Michroma.woff2', here), new URL('fonts/Michroma.woff2', P));
copyFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', here), new URL('gsap.min.js', P));
writeFileSync(new URL('motion.js', P), readFileSync(join(homedir(), '.claude/skills/cinetic/assets/hyperframes-starter/motion.js'), 'utf8')
  .replace('const W = 1920;', 'const W = 1080;').replace('const H = 1080;', 'const H = 1920;'));

/* ---------- the timeline, every number from the voice ---------- */
const T = {
  s1: 0, s2: fr(5.10), s3: fr(11.15), s4: fr(20.56), s5: fr(27.40), s6: fr(32.40), s7: fr(35.10), end: MAIN,
  /* 1 */ c0: wf(1), c1: wf(3), c2: wf(4), laugh: fr(2.34), yeah: wf(5), zoom: fr(3.88), snap: wf(8), fill: fr(4.76),
  /* 2 */ send: wf(9), stream: wf(12), shop: wf(14), clip: wf(18), orbit: fr(9.3), whip: fr(10.75),
  /* 3 */ cut: wf(25), slash: wf(27), split: fr(12.88), cutOut: fr(13.10), drop: wf(28), hit: wf(32), pops: [wf(33), wf(34), wf(35)],
  zoomW: wf(36), flip: fr(17.76), through: fr(18.06), glow: wf(37), lit: fr(18.82), glitchG: fr(19.15), smooth: wf(38), dive: fr(19.76),
  /* 4 */ not: wf(40), hmm: wf(45), give: wf(46), reel: wf(49), lock: wf(53), expand: fr(26.90),
  /* 5 */ streamers: wf(54), creators: wf(55), business: wf(58), we: wf(59), you: wf(62),
  /* 6 */ built: wf(63), code: wf(64), checked: wf(65), stand: wf(66), people: wf(67),
  /* 7 */ same: wf(68), video: wf(70), way: wf(71), less: wf(73), boring: wf(74), glitch: fr(38.92),
};
/* the reel: four cards turn about the orb and the yellow one stops in front */
const REEL_END = 900;
const reelEase = p => { const q = Math.min(1, Math.max(0, p)); return q < 0.35 ? 0.35 * Math.pow(q / 0.35, 2) * 0.5 : 0.175 + 0.825 * (1 - Math.pow(1 - (q - 0.35) / 0.65, 3)); };
const reelAng = f => REEL_END * reelEase((f - T.reel) / (T.lock - T.reel));
const reelTicks = [];
for (let f = T.reel; f < T.lock; f++) if (Math.floor(reelAng(f + 1) / 90) !== Math.floor(reelAng(f) / 90)) reelTicks.push(f + 1);

/* ---------- captions: word groups, styled per part ---------- */
const GROUPS = [[0, 1], [2, 3], [4, 4], [5, 5], [6, 8], [9, 12], [13, 15], [16, 19], [20, 23], [24, 27], [28, 30], [31, 32], [33, 35], [36, 36], [37, 37], [38, 39],
  [40, 42], [43, 44], [45, 45], [46, 48], [49, 51], [52, 53], [54, 54], [55, 56], [57, 58], [59, 62], [63, 64], [65, 67], [68, 70], [71, 74]];
const clean = s => s.toUpperCase().replace(/[.,]/g, '');
const KEY = new Set([12, 14, 15, 18, 19, 25, 32, 35, 36, 37, 42, 53, 54, 56, 58, 64, 66, 74]);
const capStyle = i => { const s = W[GROUPS[i][0]].s; return s < 2.8 ? 'c1' : s < 5.10 ? 'c1b' : s < 11.15 ? 'c2' : s < 20.56 ? 'c3' : s < 27.40 ? 'c4' : s < 32.40 ? 'c5' : s < 35.10 ? 'c6' : 'c7'; };
const CAPS = GROUPS.map(([a, b], i) => {
  const next = GROUPS[i + 1] ? W[GROUPS[i + 1][0]].s : 38.9;
  return { a, b, style: capStyle(i), in: fr(W[a].s - 0.04), out: Math.min(fr(next - 0.04), fr(W[b].e + 0.9)), words: W.slice(a, b + 1).map((w, k) => ({ t: clean(w.text), f: fr(w.s), key: KEY.has(a + k) })) };
});

/* ---------- picture ---------- */
const C = {
  grey: '#8d8f93', greyD: '#6f7175', dark: '#0c0c0e', orange: '#ff4d00', ink: '#0b0b0b', cream: '#fff1e2', line: '#e9e6df', blue: '#3a4bff',
  navy: '#0b1430', cyan: '#7fe3ff', yellow: '#ffd60a', ray: '#ffc300', pink: '#ff3d8b', white: '#ffffff', paper: '#0e3c8f', paper2: '#0a2f72', red: '#ff4b3e',
};
const star = (n, r1, r2) => Array.from({ length: n * 2 }, (_, i) => { const a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1; return (r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1); }).join(' ');
const girlImgs = [1, 2, 3, 4].map(n => `<div class="gl" id="girl${n}"><div class="gsq" id="girl${n}-sq"><img src="assets/girl-${n}.png" id="girl${n}-img" style="width:${GIRL[n - 1].w}px;height:${GIRL[n - 1].h}px"></div></div>`).join('');
const card = (id, inner, cls = '') => `<div class="card ${cls}" id="${id}">${inner}</div>`;
const miniFace = (bg, eye, size, extra = '') => `<div style="position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${bg};${extra}"><i style="position:absolute;left:${size * .27}px;top:${size * .56}px;width:${size * .2}px;height:${size * .07}px;border-radius:9px;background:${eye}"></i><i style="position:absolute;left:${size * .53}px;top:${size * .56}px;width:${size * .2}px;height:${size * .07}px;border-radius:9px;background:${eye}"></i></div>`;

const css = `
@font-face{font-family:"Archivo Black";src:url("fonts/archivo-black.woff2") format("woff2");font-weight:400;font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Archivo Black";src:url("fonts/archivo-black-latin-ext.woff2") format("woff2");font-weight:400;font-display:block;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Archivo Wide";src:url("fonts/archivo-wide.woff2") format("woff2");font-weight:900;font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Archivo Wide";src:url("fonts/archivo-wide-latin-ext.woff2") format("woff2");font-weight:900;font-display:block;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";src:url("fonts/jbmono.woff2") format("woff2");font-weight:500;font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";src:url("fonts/jbmono-latin-ext.woff2") format("woff2");font-weight:500;font-display:block;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Bricolage Grotesque";src:url("fonts/bricolage-800.woff2") format("woff2");font-weight:800;font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage Grotesque";src:url("fonts/bricolage-800-latin-ext.woff2") format("woff2");font-weight:800;font-display:block;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"IBM Plex Mono";src:url("fonts/plexmono.woff2") format("woff2");font-weight:500;font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"IBM Plex Mono";src:url("fonts/plexmono-latin-ext.woff2") format("woff2");font-weight:500;font-display:block;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
#root{position:relative;width:100%;height:100%;overflow:hidden}
.clip{position:absolute;inset:0;overflow:hidden;background:#000}
.sec{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
.cam{position:absolute;left:0;top:0;width:1080px;height:1920px}
.abs{position:absolute;left:0;top:0}
.m{position:absolute;left:0;top:0}.m-sq{position:absolute;inset:0;perspective:1300px}.m-r{position:absolute;transform-style:preserve-3d}
.m-slab,.m-face{position:absolute;inset:0;border-radius:50%}.m-face{overflow:hidden;transform:translateZ(0);box-sizing:border-box}.m-eye{position:absolute}
.gl{position:absolute;left:0;top:0}.gsq{position:absolute;left:0;top:0}
.gl img{display:block;filter:drop-shadow(0 22px 26px rgba(0,0,0,.32))}
.hud{position:absolute;font:500 22px "JetBrains Mono";letter-spacing:.14em;white-space:nowrap}
.br{position:absolute;width:64px;height:64px;border-color:currentColor;border-style:solid;border-width:0}
/* 1 */
#s1bg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 55%,#17171b 0%,${C.dark} 70%)}
#ground{position:absolute;left:90px;top:1180px;width:900px;height:3px;background:${C.line}}
.ghost{position:absolute;left:0;top:0;width:253px;height:253px;border-radius:50%;border:3px solid ${C.orange};box-sizing:border-box}
#shadow1{position:absolute;left:0;top:1166px;width:220px;height:28px;border-radius:50%;background:rgba(255,77,0,.25)}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
/* 2 */
#s2bg{position:absolute;inset:0;background:${C.orange}}
.card{position:absolute;left:0;top:0;border-radius:28px;overflow:hidden;box-shadow:0 26px 50px rgba(0,0,0,.35)}
.tag{position:absolute;font:400 26px "Archivo Black";letter-spacing:.02em;padding:6px 16px;border-radius:30px}
/* 3 */
#s3bg{position:absolute;inset:0;background:${C.orange}}
#s3dark{position:absolute;inset:0}
.band{position:absolute;left:0;width:1080px;background:${C.ink};transform-origin:100% 50%}
.word{position:absolute;left:0;width:1080px;text-align:center;font-family:"Archivo Wide";font-weight:900;line-height:1;white-space:nowrap;color:${C.ink};letter-spacing:-.02em}
.word .in{display:inline-block;position:relative}
.ch{display:inline-block;position:relative}
.oflip{display:inline-block;position:relative}
.glowc{color:${C.orange};text-shadow:0 0 .06em rgba(255,140,60,.95),0 0 .2em rgba(255,77,0,.75),0 0 .5em rgba(255,77,0,.45)}
#slash{position:absolute;left:-60px;width:1200px;height:10px;background:${C.cream};transform-origin:0 50%}
.bar{position:absolute;bottom:0;width:22px;border-radius:11px;background:${C.ink};transform-origin:50% 100%}
.pill{position:absolute;left:0;top:0;padding:18px 34px;background:${C.white};color:${C.ink};font:400 54px "Archivo Black";border-radius:60px;white-space:nowrap;box-shadow:10px 10px 0 ${C.ink}}
/* 4 */
#s4bg{position:absolute;inset:0;background:radial-gradient(90% 60% at 50% 40%,#16244f 0%,${C.navy} 60%,#050a1a 100%)}
#orb{position:absolute;left:0;top:0;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#ffffff 0%,#c8f6ff 22%,${C.cyan} 48%,rgba(127,227,255,.0) 72%);filter:blur(1px)}
#orbGlow{position:absolute;left:0;top:0;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(127,227,255,.32) 0%,rgba(127,227,255,.10) 40%,rgba(127,227,255,0) 70%)}
.rc{position:absolute;left:0;top:0;width:300px;height:400px;border-radius:30px;overflow:hidden;border:6px solid #fff;box-sizing:border-box}
/* 5 */
#s5bg{position:absolute;inset:0;background:${C.yellow}}
#rays{position:absolute;left:-1060px;top:-960px;width:3200px;height:3200px;border-radius:50%;background:repeating-conic-gradient(from 0deg,${C.ray} 0deg 7.5deg,${C.yellow} 7.5deg 15deg)}
.half{position:absolute;inset:0;background-size:30px 30px}
.mband{position:absolute;left:-200px;width:1500px;height:118px;overflow:hidden;display:flex;align-items:center}
.mband .run{white-space:nowrap;font:800 64px "Bricolage Grotesque";line-height:1}
#cnt,#cshadow{position:absolute;left:0;top:0;display:flex;font:800 460px "Bricolage Grotesque";line-height:1;letter-spacing:-.04em}
#cnt{color:${C.ink}}#cshadow{color:${C.pink}}
.col{position:relative;overflow:hidden;height:1em;width:.62em}
.strip{position:absolute;left:0;top:0;width:100%;text-align:center}.strip div{height:1em}
#mshadow5{position:absolute;left:0;top:0;border-radius:50%;background:${C.pink}}
/* 6 */
#s6bg{position:absolute;inset:0;background:${C.paper2}}
#bpcam{position:absolute;inset:0;perspective:2200px;perspective-origin:540px 760px}
#paper{position:absolute;left:-200px;top:-200px;width:1480px;height:2320px;transform-style:preserve-3d;background-color:${C.paper};
  background-image:linear-gradient(rgba(255,255,255,.16) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.16) 2px,transparent 2px),linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
  background-size:140px 140px,140px 140px,28px 28px,28px 28px}
#stamp{position:absolute;left:0;top:0;padding:16px 30px;border:8px solid ${C.red};border-radius:10px;color:${C.red};font:400 76px "Archivo Black";letter-spacing:2px;white-space:nowrap;mix-blend-mode:screen}
#scan{position:absolute;left:0;top:0;width:1080px;height:4px;background:${C.cyan};box-shadow:0 0 24px 6px rgba(127,227,255,.55)}
/* 7 */
.rb{position:absolute;inset:0}
/* captions */
.cap{position:absolute;left:120px;width:840px;text-align:center;line-height:1.08}
.cap .w{display:inline-block;margin:0 .14em;transform-origin:50% 80%}
.c1{font:500 54px "JetBrains Mono";letter-spacing:.06em;color:#d9dadc;top:1420px}
.c1b{font:400 84px "Archivo Black";color:${C.orange};top:1400px;-webkit-text-stroke:0}
.c2{font:400 70px "Archivo Black";color:${C.white};top:200px;paint-order:stroke fill;-webkit-text-stroke:14px ${C.ink}}
.c2 .k{color:${C.yellow}}
.c3{font:400 58px "Archivo Black";color:${C.ink};top:210px}
.c3 .k{color:${C.cream};paint-order:stroke fill;-webkit-text-stroke:10px ${C.ink}}
.c4{font:500 50px "JetBrains Mono";letter-spacing:.05em;color:${C.cyan};top:1500px;text-shadow:0 0 18px rgba(127,227,255,.65)}
.c4 .k{color:#fff}
.c5{top:930px;font:800 76px "Bricolage Grotesque";color:${C.ink}}
.c5 .w{background:${C.white};border:6px solid ${C.ink};border-radius:60px;padding:6px 28px;box-shadow:10px 10px 0 ${C.ink};margin:6px .1em}
.c6{font:500 52px "IBM Plex Mono";letter-spacing:.04em;color:#eaf2ff;top:250px}
.c6 .k{color:${C.cyan}}
.c7{font:400 96px "Archivo Black";line-height:1;top:260px;color:${C.white}}
#glitchL{position:absolute;inset:0;pointer-events:none}
.gs{position:absolute;left:0;width:1080px;overflow:hidden}
`;

const html = `
<div class="sec" id="S1"><div id="s1bg"></div><div class="cam" id="cam1">
  <div id="ground"></div>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].map(i => `<i class="abs dot1" id="d1_${i}" style="width:7px;height:7px;border-radius:50%;background:${C.line}"></i>`).join('')}
  <div id="shadow1"></div>${[1, 2, 3, 4].map(k => `<div class="ghost" id="gh${k}"></div>`).join('')}
  ${mascot('m1', 270, { face: C.orange, eye: C.ink, side: '#a8300f', layers: 10, depth: 2.2 })}
</div><div class="hud" id="hud1" style="color:${C.line}">
  <div class="br" style="left:36px;top:36px;border-left-width:3px;border-top-width:3px"></div><div class="br" style="left:980px;top:36px;border-right-width:3px;border-top-width:3px"></div>
  <div class="br" style="left:36px;top:1820px;border-left-width:3px;border-bottom-width:3px"></div><div class="br" style="left:980px;top:1820px;border-right-width:3px;border-bottom-width:3px"></div>
  <div class="hud" style="left:120px;top:58px" id="h1a">IEEJA  JĒLS KLIPS</div><div class="hud" style="left:640px;top:58px;width:320px;text-align:right" id="h1b">BEZ MONTĀŽAS</div>
  <div class="hud" style="left:120px;top:1836px" id="tc1">00:00:00:00</div></div>
</div>
<div class="sec" id="S2"><div id="s2bg"></div><div class="cam" id="cam2">
  <div class="hud" style="color:${C.ink}"><div class="br" style="left:36px;top:36px;border-left-width:3px;border-top-width:3px"></div><div class="br" style="left:980px;top:36px;border-right-width:3px;border-top-width:3px"></div>
  <div class="br" style="left:36px;top:1820px;border-left-width:3px;border-bottom-width:3px"></div><div class="br" style="left:980px;top:1820px;border-right-width:3px;border-bottom-width:3px"></div>
  <div class="hud" style="left:120px;top:1836px">IENĀKOŠIE  3 FAILI</div><div class="hud" style="left:640px;top:1836px;width:320px;text-align:right" id="tc2"></div></div>
  ${card('cStream', `<div style="position:absolute;inset:0;background:#15151a"></div><div style="position:absolute;left:18px;top:18px;right:18px;height:228px;border-radius:16px;background:linear-gradient(180deg,#1d6f8f,#0e3550)"><svg width="100%" height="100%" viewBox="0 0 400 228" preserveAspectRatio="none"><path d="M0 228 L0 150 L70 90 L130 140 L210 60 L290 130 L340 100 L400 140 L400 228Z" fill="#0a2233"/><circle cx="320" cy="50" r="22" fill="#ffd60a"/></svg></div><div class="tag" style="left:30px;top:30px;background:#ff2a2a;color:#fff;font-size:22px">● TIEŠRAIDE</div>${[0, 1, 2].map(i => `<div style="position:absolute;left:24px;top:${266 + i * 30}px;width:${[260, 320, 200][i]}px;height:14px;border-radius:7px;background:#2c2c36"></div><div style="position:absolute;left:24px;top:${266 + i * 30}px;width:60px;height:14px;border-radius:7px;background:${['#35ff6a', '#ff3d8b', '#7fe3ff'][i]}"></div>`).join('')}`)}
  ${card('cShop', `<div style="position:absolute;inset:0;background:${C.cream}"></div><svg style="position:absolute;left:120px;top:50px" width="200" height="220" viewBox="0 0 200 220"><path d="M30 70 H170 L160 210 H40 Z" fill="${C.ink}"/><path d="M65 75 V50 a35 35 0 0 1 70 0 V75" fill="none" stroke="${C.ink}" stroke-width="12"/><circle cx="100" cy="140" r="26" fill="${C.orange}"/></svg><div class="tag" style="left:24px;top:24px;background:${C.ink};color:${C.cream}">JAUNUMI</div><div class="tag" style="right:24px;bottom:24px;background:${C.orange};color:${C.ink}">VEIKALS</div>`)}
  ${card('cClip', `<div style="position:absolute;inset:0;background:radial-gradient(60% 40% at 30% 30%,#ff3d8b 0%,rgba(255,61,139,0) 70%),radial-gradient(60% 40% at 70% 60%,#ffd60a 0%,rgba(255,214,10,0) 70%),radial-gradient(70% 50% at 40% 85%,#2e5bff 0%,rgba(46,91,255,0) 70%),#140d1f"></div><div style="position:absolute;left:94px;top:170px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.92)"><svg width="100" height="100"><path d="M40 30 L72 50 L40 70Z" fill="#140d1f"/></svg></div><div class="tag" style="left:20px;bottom:20px;background:rgba(0,0,0,.55);color:#fff;font-size:22px">0:12</div>`)}
</div></div>
<div class="sec" id="S3"><div id="s3bg"></div><div id="s3dark">${[0, 1, 2, 3, 4, 5].map(i => `<div class="band" id="bd${i}" style="top:${i * 320}px;height:321px"></div>`).join('')}</div><div class="cam" id="cam3">
  <div class="abs" id="bars" style="left:120px;top:1060px;width:840px;height:240px">${Array.from({ length: 24 }, (_, i) => `<div class="bar" id="bar${i}" style="left:${i * 35}px;height:240px"></div>`).join('')}</div>
  <div class="word" id="cutA"><span class="in">GRIEŽAM</span></div><div class="word" id="cutB"><span class="in">GRIEŽAM</span></div><div id="slash"></div>
  <div class="word" id="hitW"><span class="in">SIT</span></div>
  <div class="pill" id="p0">FORŠI</div><div class="pill" id="p1">VAU</div><div class="pill" id="p2">AIDĀ</div>
  <div class="word" id="zoom"><span class="in" id="zoomIn"><span class="ch" id="z0">Z</span><span class="oflip" id="z1"><span class="ch" id="z1t">O</span><span class="abs" id="z1m"></span></span><span class="oflip" id="z2"><span class="ch" id="z2t">O</span><span class="abs" id="z2m"></span></span><span class="ch" id="z3">M</span></span></div>
  <div class="word" id="glow"><span class="in glowc" id="glowIn">${[...'SPĪDUMS'].map((c, i) => `<span class="ch" id="g${i}">${c}</span>`).join('')}</span></div>
</div></div>
<div class="sec" id="S4"><div id="s4bg"></div><div class="cam" id="cam4">
  <div id="orbGlow"></div>
  ${mascot('m4', 420, { face: '#f4f7ff', eye: C.navy, side: '#8fa3d6', layers: 12, depth: 2.6 })}
  <div id="orb"></div>
  <svg class="abs" id="ring" width="1080" height="1920">${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 2 * Math.PI - Math.PI / 2; return `<line id="tk${i}" x1="${(540 + 150 * Math.cos(a)).toFixed(1)}" y1="${(600 + 150 * Math.sin(a)).toFixed(1)}" x2="${(540 + 176 * Math.cos(a)).toFixed(1)}" y2="${(600 + 176 * Math.sin(a)).toFixed(1)}" stroke="${C.cyan}" stroke-width="8" stroke-linecap="round"/>`; }).join('')}</svg>
  <div class="rc" id="rc0" style="background:${C.dark}">${miniFace(C.orange, C.ink, 150, 'left:69px;top:110px')}<div class="br" style="left:16px;top:16px;width:40px;height:40px;border-left:4px solid ${C.line};border-top:4px solid ${C.line}"></div><div class="br" style="right:16px;bottom:16px;width:40px;height:40px;border-right:4px solid ${C.line};border-bottom:4px solid ${C.line}"></div><div class="hud" style="left:20px;top:330px;color:${C.line};font-size:18px">00:00:01:24</div></div>
  <div class="rc" id="rc1" style="background:${C.orange}"><div style="position:absolute;left:0;top:160px;width:288px;text-align:center;font:900 40px 'Archivo Wide';color:${C.ink}">GRIEŽAM</div></div>
  <div class="rc" id="rc2" style="background:repeating-conic-gradient(from 0deg at 50% 60%,${C.ray} 0deg 10deg,${C.yellow} 10deg 20deg)"><div style="position:absolute;left:0;top:150px;width:288px;text-align:center;font:800 190px 'Bricolage Grotesque';color:${C.ink};text-shadow:10px 10px 0 ${C.pink};line-height:1">01</div>${miniFace('#fff', C.ink, 100, 'left:94px;top:40px;border:5px solid #111')}</div>
  <div class="rc" id="rc3" style="background-color:${C.paper};background-image:linear-gradient(rgba(255,255,255,.14) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.14) 2px,transparent 2px);background-size:36px 36px"><div style="position:absolute;left:54px;top:90px;width:170px;height:170px;border-radius:50%;border:5px solid #eaf2ff"></div><div style="position:absolute;left:30px;top:300px;font:500 22px 'IBM Plex Mono';color:#7fe3ff">PLĀTNE 60.0</div></div>
</div></div>
<div class="sec" id="S5"><div id="s5bg"></div><div id="rays"></div>
  <div class="half" id="h5a" style="background-image:radial-gradient(circle,${C.pink} 0 34%,transparent 37%);-webkit-mask-image:radial-gradient(70% 45% at 0% 0%,#000 0%,transparent 100%)"></div>
  <div class="half" id="h5b" style="background-image:radial-gradient(circle,${C.ink} 0 34%,transparent 37%);-webkit-mask-image:radial-gradient(70% 45% at 100% 100%,#000 0%,transparent 100%)"></div>
  <div class="cam" id="cam5">
    <svg class="abs" width="1080" height="1920" style="overflow:visible"><g id="star5"><polygon points="${star(16, 420, 340)}" fill="${C.pink}" stroke="${C.ink}" stroke-width="8"/></g></svg>
    <div id="cshadow"><div class="col"><div class="strip" id="ss0"></div></div><div class="col"><div class="strip" id="ss1"></div></div></div>
    <div id="cnt"><div class="col"><div class="strip" id="s0"></div></div><div class="col"><div class="strip" id="s1"></div></div></div>
    <div id="mshadow5"></div>
    ${mascot('m5', 240, { face: C.white, eye: C.ink, side: C.ink, layers: 8, depth: 2.2, stroke: `border:7px solid ${C.ink}` })}
  </div>
  <div class="mband" id="mb1" style="top:120px;background:${C.ink};transform:rotate(-7deg)"><div class="run" id="r1" style="color:${C.yellow}">${'STRĪMERI  ●  SATURA VEIDOTĀJI  ●  MAZAIS BIZNESS  ●  '.repeat(3)}</div></div>
  <div class="mband" id="mb2" style="top:1500px;background:${C.pink};transform:rotate(5deg);border-top:6px solid ${C.ink};border-bottom:6px solid ${C.ink}"><div class="run" id="r2" style="color:${C.ink}">${'MĒS ESAM AR JUMS  ●  SPILGTI  ●  MONTĀŽA  ●  '.repeat(4)}</div></div>
</div>
<div class="sec" id="S6"><div id="s6bg"></div><div id="bpcam"><div id="paper">
  <svg class="abs" id="draw" width="1080" height="1920" style="left:200px;top:200px;overflow:visible"></svg>
  <div class="abs" id="hinge" style="transform-style:preserve-3d"></div>
</div></div><div id="scan"></div><div id="stamp">PĀRBAUDĪTS</div>
  <div class="hud" style="left:60px;top:1840px;color:#eaf2ff">RASĒJUMS 01  DETAĻA TĒLS  REŽĢIS 64</div>
</div>
<div class="sec" id="S7">${['rb0', 'rb1', 'rb2', 'rb3', 'rb4'].map(id => `<div class="rb" id="${id}"></div>`).join('')}</div>
<div class="sec" id="girls">${girlImgs}</div>
<div class="sec" id="caps">${CAPS.map((c, i) => `<div class="cap ${c.style}" id="cap${i}">${c.words.map((w, k) => `<span class="w${w.key ? ' k' : ''}" id="cw${i}_${k}">${w.t}</span>`).join(' ')}</div>`).join('')}</div>
<div class="sec" id="glitchL"></div>
<div id="flash"></div>
`;

/* the blueprint drawing for part 6, from the mascot spec, built in node */
import { HEAD } from '../lib/mascot.mjs';
const BS = 480, bu = BS / 64, BCX = 540, BCY = 860, BR = HEAD.plate.s / 2 * bu;
const BEW = HEAD.eye.w * bu, BEH = HEAD.eye.h * bu, BEDX = HEAD.eye.sep / 2 * bu, BEY = BCY + (HEAD.eye.cy - 32) * bu;
const rr = (x, y, w, h, r) => `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const eyeR = s => rr(BCX + s * BEDX - BEW / 2, BEY - BEH / 2, BEW, BEH, BEH / 2);
const draw6 = `<g fill="none" stroke="#eaf2ff" stroke-width="3">
  <line x1="${BCX - 380}" y1="${BCY}" x2="${BCX + 380}" y2="${BCY}" stroke-dasharray="26 12 6 12" stroke-opacity=".6" id="cl6"/>
  <circle id="fill6" cx="${BCX}" cy="${BCY}" r="${BR}" fill="#f4f7ff" stroke="none"/>
  <path id="circ6" d="M${BCX},${BCY - BR} A${BR},${BR} 0 1 1 ${BCX - 0.01},${BCY - BR}" pathLength="1" stroke-dasharray="1 1" stroke-width="5"/>
  <line id="arm6" x1="${BCX}" y1="${BCY}" x2="${BCX}" y2="${BCY - BR}" stroke="${C.cyan}" stroke-width="4"/>
  <path id="e6a" d="${eyeR(-1)}" pathLength="1" stroke-dasharray="1 1" stroke-width="4"/><path id="e6b" d="${eyeR(1)}" pathLength="1" stroke-dasharray="1 1" stroke-width="4"/>
  <g id="dim6" stroke="${C.cyan}"><line x1="${BCX - BR}" y1="${BCY + 20}" x2="${BCX - BR}" y2="${BCY + BR + 110}" stroke-opacity=".7"/><line x1="${BCX + BR}" y1="${BCY + 20}" x2="${BCX + BR}" y2="${BCY + BR + 110}" stroke-opacity=".7"/><line x1="${BCX - BR}" y1="${BCY + BR + 90}" x2="${BCX + BR}" y2="${BCY + BR + 90}"/></g>
  </g><text id="t6" x="${BCX}" y="${BCY + BR + 74}" font-family="IBM Plex Mono" font-size="34" fill="#eaf2ff" text-anchor="middle" letter-spacing="2">PLĀTNE 60.0</text>
  <text id="t6e" x="${BCX - BR - 20}" y="${BEY + 120}" font-family="IBM Plex Mono" font-size="26" fill="#eaf2ff" text-anchor="end" letter-spacing="2">ACS 13.0 × 4.4</text>`;

const js = `
const BARS = null, BARS0 = 0;
const C = ${JSON.stringify(C)}, Tm = ${JSON.stringify(T)}, CAPS = ${JSON.stringify(CAPS)}, GIRL = ${JSON.stringify(GIRL)};
const REEL_END = ${REEL_END}; const reelEase = ${reelEase.toString()}; const reelAng = f => REEL_END * reelEase((f - Tm.reel) / (Tm.lock - Tm.reel));
const BCX = ${BCX}, BCY = ${BCY}, BR = ${BR}, BS = ${BS};
$('draw').innerHTML = ${JSON.stringify(draw6)};
$('hinge').innerHTML = ${JSON.stringify(mascot('m6', BS, { face: '#f4f7ff', eye: C.paper, side: '#9fb4dc', layers: 14, depth: 3 }))};
$('hinge').style.left = (200 + BCX - BS / 2) + 'px'; $('hinge').style.top = (200 + BCY - BS / 2) + 'px';
$('hinge').style.width = $('hinge').style.height = BS + 'px'; $('hinge').style.transformOrigin = '50% 96.9%';
$('paper').style.transformOrigin = (200 + BCX) + 'px ' + (200 + BCY + BR) + 'px';
const vis = (id, on) => { $(id).style.display = on ? 'block' : 'none'; };
const win = (f, a, b) => f >= a && f < b;
const blink = (f, s) => f >= s && f < s + 12 ? (f < s + 4 ? 1 - (f - s) / 4 : (f - s - 4) / 8) : 1;

/* ---------- the girl rig: feet planted, bounce, sway, breathe ---------- */
const GH = { 1: 960, 2: 760, 3: 620, 4: 1080 };
function girl(n, f, o) {
  const id = 'girl' + n, g = GIRL[n - 1], k = o.h / g.h;
  const per = o.per || 0.8, t = f / 60, ph = ((t + (o.ph || 0)) / per) % 1;
  const hop = Math.sin(Math.PI * ph);
  const contact = Math.exp(-ph * 14) + Math.exp(-(1 - ph) * 14);
  const pop = o.pop == null ? 1 : o.pop, pq = o.popq || 0;
  const y = -(o.amp || 10) * hop - (o.lift || 0);
  const rot = (o.sway || 2.5) * Math.sin(2 * Math.PI * t / (o.swayP || 1.7)) + (o.rot || 0);
  const sy = (1 - 0.035 * contact) * (1 - 0.16 * pq), sx = (1 + 0.025 * contact) * (1 + 0.12 * pq);
  /* placed by the feet: x is the centre, y the ground line */
  const el = $(id); el.style.visibility = o.on ? 'visible' : 'hidden';
  if (!o.on) return;
  T(id, 'translate(' + (o.x - g.w * k / 2).toFixed(1) + 'px,' + (o.y - g.h * k + y).toFixed(1) + 'px) rotate(' + rot.toFixed(3) + 'deg) scale(' + (k * pop).toFixed(5) + ')');
  $(id).style.transformOrigin = (g.w * k / 2).toFixed(1) + 'px ' + (g.h * k).toFixed(1) + 'px';
  $(id + '-sq').style.transformOrigin = '50% 100%'; $(id + '-sq').style.width = g.w + 'px'; $(id + '-sq').style.height = g.h + 'px';
  T(id + '-sq', 'scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')');
}

/* ---------- part 1 path ---------- */
const S1 = 270, PC = S1 / 2, YC = 1180 - 62 / 64 * S1;
function ballY(f) {
  if (f < Tm.c0) { const a = -12, q = (f - a) / (Tm.c0 - a); return YC - 1200 * (1 - q * q); }
  if (f < Tm.c1) { const s = (f - Tm.c0) / (Tm.c1 - Tm.c0); return YC - 430 * 4 * s * (1 - s); }
  if (f < Tm.c2) { const s = (f - Tm.c1) / (Tm.c2 - Tm.c1); return YC - 170 * 4 * s * (1 - s); }
  for (let i = 0; i < 3; i++) { const a = Tm.laugh + 14 * i; if (f >= a && f < a + 14) { const s = (f - a) / 14; return YC - 34 * 4 * s * (1 - s); } }
  return YC;
}
const ballX = f => mix(40, 405, clamp(f / Tm.c2));
const dots1 = []; for (let i = 0; i < 36; i++) dots1.push(Math.round(i * Tm.c2 / 35));

/* ---------- part 3 layout ---------- */
function fit(id, w, top) { const el = $(id), inn = el.querySelector('.in'); el.style.fontSize = '200px'; const fs = 200 * w / inn.offsetWidth; el.style.fontSize = fs.toFixed(1) + 'px'; el.style.top = (top - inn.offsetHeight / 2).toFixed(1) + 'px'; return { fs, w: inn.offsetWidth, h: inn.offsetHeight, top: top - inn.offsetHeight / 2 }; }
const cw3 = fit('cutA', 860, 640); fit('cutB', 860, 640); fit('hitW', 760, 640); const zw = fit('zoom', 900, 640); const gw = fit('glow', 880, 660);
$('cutA').style.clipPath = 'polygon(0 0,100% 0,100% 38%,0 64%)'; $('cutB').style.clipPath = 'polygon(0 64%,100% 38%,100% 100%,0 100%)';
const yL = cw3.top + cw3.h * 0.64, yR = cw3.top + cw3.h * 0.38, ang3 = Math.atan2(yR - yL, 1200) * 180 / Math.PI; $('slash').style.top = (yL - 5) + 'px';
const mini = Math.round($('z1t').offsetHeight * 0.86), MS = mini / 100;
$('z1m').innerHTML = ${JSON.stringify(mascot('MINI', 100, { face: C.cream, eye: C.ink, side: '#3a3a3a', layers: 6, depth: 1.6 }))}.split('MINI').join('ma');
$('z2m').innerHTML = ${JSON.stringify(mascot('MINI', 100, { face: C.cream, eye: C.ink, side: '#3a3a3a', layers: 6, depth: 1.6 }))}.split('MINI').join('mb');
for (const id of ['z1m', 'z2m']) { $(id).style.left = '50%'; $(id).style.top = '50%'; }
for (const id of ['ma', 'mb']) { $(id).style.left = '-50px'; $(id).style.top = '-50px'; }
/* the D of SPĪDUMS: the smooth transition dives through its bowl */
const BX = 0.52, BY = 0.52;
const gO = $('g3').getBoundingClientRect(), gR = $('root').getBoundingClientRect();
const gOx = gO.left - gR.left + gO.width * BX, gOy = gO.top - gR.top + gO.height * BY;   /* the bowl of D, the counter the dive goes through */
$('cam3').style.transformOrigin = '0 0';   /* the dive scales about that point, so the camera's origin is the corner */
const pills = [[120, 860, -6], [560, 990, 5], [260, 1150, -3]];
const pw = [0, 1, 2].map(i => $('p' + i).offsetWidth);

/* ---------- part 5 counter ---------- */
for (const id of ['s0', 's1', 'ss0', 'ss1']) $(id).innerHTML = [0,1,2,3,4,5,6,7,8,9,0].map(d => '<div>' + d + '</div>').join('');
const cnt = $('cnt'), c5w = cnt.offsetWidth, c5h = cnt.offsetHeight, c5x = 540 - c5w / 2, c5y = 640 - c5h / 2, cap5 = c5y + c5h * 0.17;
const cval = f => 1 + prog(f, Tm.creators, Tm.creators + 9, E.out) + prog(f, Tm.business, Tm.business + 9, E.out);

/* ---------- captions ---------- */
const capEls = CAPS.map((c, i) => ({ c, el: $('cap' + i), ws: c.words.map((w, k) => $('cw' + i + '_' + k)) }));

/* ---------- the glitch cut ---------- */
const gl = $('glitchL');
for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'gs'; d.id = 'gs' + i; gl.appendChild(d); }

function paint(f) {
  const sec = f < Tm.s2 ? 1 : f < Tm.s3 ? 2 : f < Tm.s4 ? 3 : f < Tm.s5 ? 4 : f < Tm.s5 + 0 ? 4 : f < Tm.s6 ? 5 : f < Tm.s7 ? 6 : 7;
  /* whip 2 to 3 and the blueprint over 7's laugh keep two parts on screen */
  const whip = prog(f, Tm.whip, Tm.whip + 22, E.inOut);
  vis('S1', f < Tm.s2); vis('S2', f >= Tm.s2 - 1 && f < Tm.s3 + 2); vis('S3', f >= Tm.whip && f < Tm.s4);
  vis('S4', f >= Tm.s4 - 2 && f < Tm.s5); vis('S5', f >= Tm.s5 && f < Tm.s6 + 2); vis('S6', f >= Tm.s6 - 12 && f < Tm.same); vis('S7', f >= Tm.same);

  /* ================= 1: grey, bounce, crash zoom, snap to colour ================= */
  if (f < Tm.s2) {
    $('tc1').textContent = tc(Math.round(f));
    const bx = ballX(f), by = ballY(f), vy = ballY(f + 0.5) - ballY(f - 0.5);
    const air = f < Tm.c2 ? clamp(Math.abs(vy) / 34) : 0;
    let sq = 0; [Tm.c0, Tm.c1, Tm.c2].forEach((c, i) => { sq += [1, .8, 1.15][i] * hitPulse(f - c, 1, 6); });
    for (let i = 0; i < 3; i++) sq += 0.35 * hitPulse(f - (Tm.laugh + 14 * (i + 1)), 1, 4);
    const ant = prog(f, Tm.yeah, Tm.zoom, E.smooth) * (1 - prog(f, Tm.zoom, Tm.zoom + 6, E.out));
    const sy = (1 + 0.24 * air) * (1 - 0.42 * Math.min(1, sq)) * (1 - 0.16 * ant), sx = (1 - 0.14 * air) * (1 + 0.32 * Math.min(1, sq)) * (1 + 0.12 * ant);
    const bored = f >= Tm.c2 ? 0.45 : 0;
    rig('m1', { x: bx, y: by, sx, sy, origin: '50% 96.9%', rz: 360 * clamp(f / Tm.c2), eye: 1 - bored - 0.4 * clamp(sq) });
    for (let k = 1; k <= 4; k++) { const g = f - 3 * k, sp = clamp(Math.abs(ballY(g + 1) - ballY(g)) / 26) * (f < Tm.c2 + 4 ? 1 : 0); T('gh' + k, 'translate(' + (ballX(g) + 8.5).toFixed(1) + 'px,' + (ballY(g) + 8.5).toFixed(1) + 'px)'); O('gh' + k, [.55, .38, .24, .12][k - 1] * sp * (g > 0 ? 1 : 0)); }
    dots1.forEach((df, i) => { T('d1_' + i, 'translate(' + (ballX(df) + PC - 3.5).toFixed(1) + 'px,' + (ballY(df) + PC - 3.5).toFixed(1) + 'px)'); O('d1_' + i, f >= df ? 0.5 : 0); });
    const hg = clamp((YC - by) / 600); T('shadow1', 'translate(' + (bx + PC - 110).toFixed(1) + 'px,0px) scale(' + (1.15 - 0.7 * hg).toFixed(3) + ',1)'); O('shadow1', 1 - 0.75 * hg);
    /* the crash zoom: aim above his eyes so they leave frame, his orange fills it */
    const zp = prog(f, Tm.zoom, Tm.fill, E.in), k = lmix(1, 13, zp);
    const ax = 405 + PC, ay = YC + PC - 70;
    T('cam1', 'translate(' + mix(ax, 540, zp).toFixed(2) + 'px,' + mix(ay, 960, zp).toFixed(2) + 'px) scale(' + k.toFixed(4) + ') translate(' + (-ax) + 'px,' + (-ay) + 'px)');
    const grey = f < Tm.snap;
    $('S1').style.filter = grey ? 'grayscale(1) contrast(.82) brightness(.92)' : 'none';
    $('h1a').textContent = grey ? 'IEEJA  JĒLS KLIPS' : 'IZEJA  SALABOTS'; $('h1b').textContent = grey ? 'BEZ MONTĀŽAS' : 'KRĀSĀS';
    $('hud1').style.color = grey ? C.line : C.orange;
    O('hud1', 1 - prog(f, Tm.fill - 10, Tm.fill, E.smooth));
  }
  O('flash', 0.7 * hitPulse(f - Tm.snap, 1, 4));
  if (f >= Tm.fill - 2 && f < Tm.s2) $('s1bg').style.background = C.orange;

  /* ================= 2: orange hud, the girl waves, three cards orbit her ================= */
  if (f >= Tm.s2 - 1 && f < Tm.s3 + 2) {
    $('tc2').textContent = tc(Math.round(f));
    const wx = -1300 * prog(f, Tm.whip, Tm.whip + 16, E.in);
    T('cam2', 'translateX(' + wx.toFixed(1) + 'px)');
    const theta = 0.9 * Math.max(0, f - Tm.orbit) * prog(f, Tm.orbit, Tm.orbit + 30, E.smooth);
    [['cStream', Tm.stream, -1, 0, 420, 300, 0], ['cShop', Tm.shop, 1, 0, 340, 340, 120], ['cClip', Tm.clip, 0, -1, 290, 440, 240]].forEach(([id, t0, dx, dy, w, h, a0]) => {
      const el = $(id); el.style.width = w + 'px'; el.style.height = h + 'px';
      const a = (a0 + theta - 90) * Math.PI / 180;
      const ox = 540 + 330 * Math.cos(a), oz = Math.sin(a), oy = 760 + 90 * Math.sin(a) + (id === 'cClip' ? -40 : 0);
      const p = springAt(SPR.snap, f, t0);
      const x = mix(540 + dx * 1100, ox, p), y = mix(oy + dy * 1300, oy, p);
      const s = (0.86 + 0.18 * oz) * (0.6 + 0.4 * p);
      T(el, 'translate(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px) rotate(' + (dx * 8 * (1 - p) + 4 * Math.sin(a)).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')');
      el.style.zIndex = oz > 0 ? 3 : 1; el.style.visibility = f >= t0 ? 'visible' : 'hidden';
      el.style.filter = oz < -0.35 && f > Tm.orbit ? 'blur(' + (3 * (-oz - 0.35) / 0.65).toFixed(1) + 'px) brightness(.85)' : 'none';
    });
  }

  /* ================= 3: orange type: GRIEŽAM, SIT, the pills, ZOOM, SPĪDUMS, a dive ================= */
  if (f >= Tm.whip && f < Tm.s4) {
    const enter = 1300 * (1 - prog(f, Tm.whip + 8, Tm.whip + 24, E.out));
    for (let i = 0; i < 6; i++) T('bd' + i, 'scaleX(' + prog(f, Tm.glow - 4 + i * 2, Tm.glow + 6 + i * 2, E.out).toFixed(4) + ')');
    let jx = 0, jy = 0, kk = 1;
    [[Tm.cut + 6, 16, .03], [Tm.split, 10, .015], [Tm.hit + 4, 18, .035], [Tm.zoomW + 16, 12, .025], [Tm.lit, 12, .03]].forEach(([c, a, z], i) => { const h = hitPulse(f - c, 1, 4); jx += a * h * (rand('j' + i) - .5) * 2; jy += a * h; kk *= 1 + z * hitPulse(f - c, 2, 5); });
    /* the dive through the bowl of D */
    const dv = prog(f, Tm.dive, Tm.s4, E.in), dk = lmix(1, 60, dv);
    T('cam3', 'translate(' + (enter + jx).toFixed(1) + 'px,' + jy.toFixed(1) + 'px) translate(' + gOx + 'px,' + gOy + 'px) scale(' + (kk * dk).toFixed(4) + ') translate(' + (-gOx) + 'px,' + (-gOy) + 'px)');
    T('s3bg', 'translateX(' + enter.toFixed(1) + 'px)'); T('s3dark', 'translateX(' + enter.toFixed(1) + 'px)');
    /* GRIEŽAM */
    const cp = prog(f, Tm.cut - 6, Tm.cut + 12, E.outSoft), cs = lmix(1.4, 1, cp), cb = blurIn(cp, 14);
    const sp = prog(f, Tm.split, Tm.split + 12, E.out), ot = prog(f, Tm.cutOut, Tm.cutOut + 10, E.in);
    T('cutA', 'translate(' + (-50 * sp - 1300 * ot).toFixed(1) + 'px,' + (-34 * sp).toFixed(1) + 'px) rotate(' + (-3 * sp).toFixed(2) + 'deg) scale(' + cs.toFixed(4) + ')');
    T('cutB', 'translate(' + (50 * sp + 1300 * ot).toFixed(1) + 'px,' + (34 * sp).toFixed(1) + 'px) rotate(' + (3 * sp).toFixed(2) + 'deg) scale(' + cs.toFixed(4) + ')');
    for (const id of ['cutA', 'cutB']) { $(id).style.filter = cb ? 'blur(' + cb.toFixed(1) + 'px)' : 'none'; vis(id, f >= Tm.cut - 6 && f < Tm.cutOut + 10); }
    T('slash', 'rotate(' + ang3.toFixed(2) + 'deg) scaleX(' + prog(f, Tm.slash, Tm.slash + 8, E.out).toFixed(4) + ')'); O('slash', f >= Tm.slash ? 1 - prog(f, Tm.split + 2, Tm.split + 12, E.smooth) : 0);
    /* the waveform: drops in on drop, spikes on hit */
    const bp = springAt(SPR.snap, f, Tm.drop);
    T('bars', 'translateY(' + (-900 * (1 - bp)).toFixed(1) + 'px)'); vis('bars', f >= Tm.drop && f < Tm.zoomW);
    O('bars', 1 - prog(f, Tm.zoomW - 10, Tm.zoomW, E.smooth));
    if (BARS && BARS[f - BARS0]) { const row = BARS[f - BARS0]; for (let i = 0; i < 24; i++) T('bar' + i, 'scaleY(' + (row[i] / 100).toFixed(3) + ')'); }
    else for (let i = 0; i < 24; i++) { const base = 0.25 + 0.3 * Math.abs(Math.sin(f / 7 + i * 0.9)) + 0.2 * Math.abs(Math.sin(f / 4.3 + i * 2.1)); T('bar' + i, 'scaleY(' + Math.min(1, base + 0.6 * hitPulse(f - Tm.hit - 4 + Math.abs(i - 12) * 0.6, 1, 6)).toFixed(3) + ')'); }
    /* SIT */
    const hp = prog(f, Tm.hit - 4, Tm.hit + 10, E.outSoft), ho = prog(f, Tm.pops[0] - 8, Tm.pops[0], E.in);
    T('hitW', 'translateY(' + (-200 * (1 - hp)).toFixed(1) + 'px) scale(' + (lmix(1.5, 1, hp) * lmix(1, 0.4, ho)).toFixed(4) + ')');
    vis('hitW', f >= Tm.hit - 4 && f < Tm.pops[0]); $('hitW').style.filter = blurIn(hp, 12) ? 'blur(' + blurIn(hp, 12).toFixed(1) + 'px)' : 'none';
    /* three caption pills pop */
    pills.forEach(([x, y, r], i) => { const p = springAt(SPR.pop, f, Tm.pops[i]), out = prog(f, Tm.zoomW - 8, Tm.zoomW, E.in); T('p' + i, 'translate(' + x + 'px,' + (y - 260) + 'px) rotate(' + r + 'deg) scale(' + (p * (1 - out)).toFixed(4) + ')'); vis('p' + i, f >= Tm.pops[i] && f < Tm.zoomW); });
    /* ZOOM: from depth, the O's flip into him, zoom through */
    const thr = prog(f, Tm.through, Tm.through + 12, E.in);
    vis('zoom', f >= Tm.zoomW && f < Tm.through + 12); T('zoomIn', 'scale(' + lmix(1, 9, thr).toFixed(4) + ')');
    ['z0', 'z1', 'z2', 'z3'].forEach((id, i) => {
      const s = Tm.zoomW + 3 * i, p = prog(f, s, s + 14, E.out), flip = i === 1 || i === 2;
      const fp = flip ? prog(f, Tm.flip + (i - 1) * 3, Tm.flip + (i - 1) * 3 + 12, E.inOut) : 0;
      T(id, 'translateY(' + (-240 * (1 - p) * (i % 2 ? 1 : -1)).toFixed(1) + 'px) scale(' + lmix(5, 1, p).toFixed(4) + ') rotateY(' + (180 * fp).toFixed(2) + 'deg)');
      const bb = blurIn(p, 16); $(id).style.filter = bb ? 'blur(' + bb.toFixed(1) + 'px)' : 'none'; O(id, f >= s ? prog(f, s, s + 4, E.linear) : 0);
      if (flip) { const back = fp >= 0.5; O(id + 't', back ? 0 : 1); O(id + 'm', back ? 1 : 0); T(id + 'm', 'scaleX(-1)'); rig(i === 1 ? 'ma' : 'mb', { x: 0, y: 0, s: MS, ex: (i === 1 ? -1 : 1) * 2.4 * MS * 1.56 * prog(f, Tm.flip + 12, Tm.flip + 18, E.smooth), eye: blink(f, Tm.flip + 22) }); }
    });
    /* SPĪDUMS lights up, in pairs, like a tube, one glitch, then holds */
    vis('glow', f >= Tm.glow); const pat = [[0,1,0,0,1,1,0,1],[0,0,1,0,1,0,1,1],[1,0,0,1,0,1,1,1],[0,1,1,0,0,1,0,1]];
    for (let i = 0; i < 7; i++) { const j = i >> 1, s = Tm.glow + 4 + j * 6, kq = Math.floor((f - s) / 3); O('g' + i, f >= Tm.lit ? 1 : f < s ? 0 : kq >= 8 ? 1 : pat[(j + i) % 4][kq] ? .95 : .12); }
    const gg = f >= Tm.glitchG && f < Tm.glitchG + 8;
    T('glowIn', 'translateX(' + (gg ? (rand('gg' + Math.floor(f / 2)) - .5) * 60 : 0).toFixed(1) + 'px) skewX(' + (gg ? (rand('gs' + Math.floor(f / 2)) - .5) * 16 : 0).toFixed(1) + 'deg)');
    $('glowIn').style.filter = 'brightness(' + (f >= Tm.lit ? 1 + 0.08 * Math.sin((f - Tm.lit) / 9) + 0.6 * hitPulse(f - Tm.lit, 2, 10) : 1).toFixed(3) + ')';
  }

  /* ================= 4: the thinking orb and the style reel ================= */
  if (f >= Tm.s4 - 2 && f < Tm.s5) {
    const fade = prog(f, Tm.s4, Tm.s4 + 14, E.smooth);
    O('s4bg', fade);
    const exp = prog(f, Tm.lock + 4, Tm.s5, E.in);
    const mp = springAt(SPR.snap, f, Tm.s4 + 2);
    const look = (prog(f, Tm.not + 4, Tm.not + 14, E.smooth) - 2 * prog(f, Tm.not + 34, Tm.not + 46, E.smooth) + prog(f, Tm.not + 70, Tm.not + 80, E.smooth)) * 2.6 * 420 / 64;
    const think = f >= Tm.hmm ? 0.4 * prog(f, Tm.hmm, Tm.hmm + 8, E.smooth) * (1 - prog(f, Tm.lock, Tm.lock + 6, E.out)) : 0;
    let eye = 1 - think; if (f >= Tm.give + 70 && f < Tm.give + 82) eye = Math.min(eye, blink(f, Tm.give + 70));
    const hap = hitPulse(f - Tm.lock, 2, 10);
    rig('m4', { x: 540 - 210, y: 1080 - 210 + 60 * (1 - mp) + 6 * Math.sin(f / 22), s: mp * (1 - 0.6 * exp), ry: 10 * Math.sin(f / 40), ex: look, ey: think ? -1.2 * 420 / 64 : 0, eye: Math.max(.3, eye - 0.5 * hap) });
    O('m4', 1 - exp);
    /* the orb: rises on hmm, pulses, spins up while the reel runs */
    const op = springAt(SPR.snap, f, Tm.hmm), pulse = 1 + 0.06 * Math.sin(f / 7) + 0.25 * hitPulse(f - Tm.lock, 2, 8);
    T('orb', 'translate(' + (540 - 110) + 'px,' + (600 - 110 + 80 * (1 - op)).toFixed(1) + 'px) scale(' + (op * pulse * (1 - exp)).toFixed(4) + ')');
    T('orbGlow', 'translate(' + (540 - 260) + 'px,' + (600 - 260) + 'px) scale(' + (op * (1 + 0.1 * Math.sin(f / 9)) * (1 - exp)).toFixed(4) + ')');
    vis('orb', f >= Tm.hmm); vis('orbGlow', f >= Tm.hmm);
    /* the loading ring ticks round on give us a second */
    const lr = prog(f, Tm.give, Tm.reel, E.linear);
    for (let i = 0; i < 12; i++) O('tk' + i, f < Tm.give || f >= Tm.reel + 10 ? 0 : (i / 12 <= lr ? 1 : 0.18) * (1 - prog(f, Tm.reel, Tm.reel + 10, E.smooth)));
    /* the reel */
    const ra = reelAng(f), rin = prog(f, Tm.reel - 6, Tm.reel + 8, E.out);
    for (let i = 0; i < 4; i++) {
      const a = (ra + i * 90) * Math.PI / 180, z = Math.cos(a);
      const x = 540 + 360 * Math.sin(a), y = 600 + 40 * z;
      let s = (0.62 + 0.38 * (z + 1) / 2) * rin, tx = x - 150, ty = y - 200;
      const isY = i === 2;
      if (isY) { const e2 = exp; s = lmix(Math.max(0.01, s), 5.2, e2); tx = mix(tx, 540 - 150, e2); ty = mix(ty, 960 - 200, e2); }
      T('rc' + i, 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotateY(' + (-Math.sin(a) * 40 * (isY ? 1 - exp : 1)).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')');
      $('rc' + i).style.zIndex = isY && f >= Tm.lock ? 9 : z > 0 ? 5 : 2; vis('rc' + i, f >= Tm.reel - 6);
      O('rc' + i, isY ? 1 : (z > 0 ? 1 : 0.55) * (1 - exp));
      $('rc' + i).style.filter = z < -0.2 && !(isY && f >= Tm.lock) ? 'brightness(.6)' : 'none';
    }
  }

  /* ================= 5: yellow pop, counter 01 02 03, the girl, he lands ================= */
  if (f >= Tm.s5 - 30 && f < Tm.s6 + 2) {
    T('rays', 'rotate(' + (0.12 * f + 10 * prog(f, Tm.creators, Tm.creators + 30, E.out) + 10 * prog(f, Tm.business, Tm.business + 30, E.out)).toFixed(2) + 'deg)');
    T('r1', 'translateX(' + (-(f * 4.2) % 1000 - 200).toFixed(1) + 'px)'); T('r2', 'translateX(' + ((f * 3.6) % 1000 - 1100).toFixed(1) + 'px)');
    const kk = lmix(1, 1.04, prog(f, Tm.s5, Tm.s6, E.dolly)) * (1 + .035 * hitPulse(f - Tm.streamers, 2, 6)) * (1 + .03 * hitPulse(f - Tm.creators - 9, 2, 6)) * (1 + .03 * hitPulse(f - Tm.business - 9, 2, 6)) * (1 + .025 * hitPulse(f - Tm.you, 2, 6));
    T('cam5', 'translate(0px,' + (10 * hitPulse(f - Tm.you, 1, 4)).toFixed(1) + 'px) scale(' + kk.toFixed(5) + ')'); $('cam5').style.transformOrigin = '540px 700px';
    const pop = springAt(SPR.pop, f, Tm.streamers - 3), v = cval(f);
    const ones = v % 10, tens = Math.floor(v / 10);
    for (const [a, b] of [['s1', 'ss1'], ['s0', 'ss0']]) { const d = a === 's1' ? ones : tens; T(a, 'translateY(' + (-d * 100 / 11).toFixed(3) + '%)'); T(b, 'translateY(' + (-d * 100 / 11).toFixed(3) + '%)'); }
    const csq = hitPulse(f - Tm.you, 1, 5), cs = pop * (1 + 0.05 * hitPulse(f - Tm.creators - 9, 1, 5) + 0.05 * hitPulse(f - Tm.business - 9, 1, 5));
    for (const id of ['cnt', 'cshadow']) $(id).style.transformOrigin = '50% 100%';
    T('cnt', 'translate(' + c5x + 'px,' + c5y + 'px) scale(' + (cs * (1 + .06 * csq)).toFixed(4) + ',' + (cs * (1 - .09 * csq)).toFixed(4) + ')');
    T('cshadow', 'translate(' + (c5x + 18) + 'px,' + (c5y + 18) + 'px) scale(' + (cs * (1 + .06 * csq)).toFixed(4) + ',' + (cs * (1 - .09 * csq)).toFixed(4) + ')');
    const st = springAt(SPR.snap, f, Tm.creators); T('star5', 'translate(540px,660px) rotate(' + (f * .4).toFixed(2) + 'deg) scale(' + (st * 0.95).toFixed(4) + ')');
    /* he jumps in with a flip and lands on the counter on you */
    const LX = 540 - 120, LY = cap5 - 240 * 62 / 64 + 4;
    let x = LX, y = LY, rz = 0, sx = 1, sy = 1, eye = 1, on = f >= Tm.we;
    if (f < Tm.you) { const q = clamp((f - Tm.we) / (Tm.you - Tm.we)); x = mix(-160, LX, q); y = mix(1500, LY, q) - 700 * 4 * q * (1 - q); rz = -360 * E.inOut(q); }
    else { const q = hitPulse(f - Tm.you, 1, 5); sx = 1 + .3 * q; sy = 1 - .34 * q; eye = f < Tm.you + 30 ? .35 : 1; }
    rig('m5', { x, y, sx, sy, rz, eye, origin: '50% 97%' }); vis('m5', on);
    const ms = $('mshadow5'), pl = 240 * 60 / 64; ms.style.width = ms.style.height = pl + 'px'; ms.style.transformOrigin = '50% 100%';
    T(ms, 'translate(' + (x + 7.5 + 14).toFixed(1) + 'px,' + (y + 7.5 + 14).toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')'); vis(ms, on);
    /* the blueprint wipes up over it at the end */
    T('S5', 'translateY(' + (-1920 * prog(f, Tm.s6 - 12, Tm.s6 + 2, E.in)).toFixed(1) + 'px)');
  }

  /* ================= 6: blueprint, built in code, checked by real people ================= */
  if (f >= Tm.s6 - 12 && f < Tm.same) {
    T('S6', 'translateY(' + (1920 * (1 - prog(f, Tm.s6 - 12, Tm.s6 + 2, E.in))).toFixed(1) + 'px)');
    const cp = prog(f, Tm.built - 6, Tm.built + 22, E.inOut);
    $('circ6').style.strokeDashoffset = (1 - cp).toFixed(4);
    const an = -Math.PI / 2 + 2 * Math.PI * cp; $('arm6').setAttribute('x2', (BCX + BR * Math.cos(an)).toFixed(1)); $('arm6').setAttribute('y2', (BCY + BR * Math.sin(an)).toFixed(1));
    O('arm6', f >= Tm.built - 6 ? 1 - prog(f, Tm.built + 22, Tm.built + 30, E.smooth) : 0);
    $('e6a').style.strokeDashoffset = (1 - prog(f, Tm.code - 4, Tm.code + 10, E.inOut)).toFixed(4);
    $('e6b').style.strokeDashoffset = (1 - prog(f, Tm.code, Tm.code + 14, E.inOut)).toFixed(4);
    const dp = prog(f, Tm.code, Tm.code + 14, E.out); O('dim6', dp); O('t6', dp); O('t6e', prog(f, Tm.code + 8, Tm.code + 18, E.linear));
    $('t6').textContent = 'PLĀTNE ' + (60 * prog(f, Tm.code, Tm.code + 12, E.out)).toFixed(1);
    const fp = prog(f, Tm.code + 10, Tm.checked, E.inOut); $('fill6').style.clipPath = 'inset(' + (100 * (1 - fp)).toFixed(2) + '% 0 0 0)';
    const tp = prog(f, Tm.stand - 6, Tm.people, E.cam), tilt = 52 * tp;
    T('paper', 'translateY(' + (-120 * tp).toFixed(1) + 'px) rotateZ(' + (-8 * tp).toFixed(2) + 'deg) rotateX(' + tilt.toFixed(2) + 'deg) scale(' + (lmix(1, .86, tp) * (1 + .02 * hitPulse(f - Tm.people - 6, 2, 6))).toFixed(4) + ')');
    O('fill6', 1 - .82 * prog(f, Tm.stand, Tm.stand + 16, E.smooth));
    const up = f >= Tm.stand ? M.springFn(SPR.land)((f - Tm.stand) / 60) : 0;
    T('hinge', 'rotateX(' + (-tilt * up).toFixed(2) + 'deg)');
    rig('m6', { x: 0, y: 0, origin: '50% 97%', ry: -30 * up + 20 * prog(f, Tm.stand + 20, Tm.same, E.smooth), eye: blink(f, Tm.people + 30) });
    vis('m6', f >= Tm.stand);
    const scp = prog(f, Tm.checked, Tm.checked + 22, E.smooth); T('scan', 'translateY(' + mix(500, 1150, scp).toFixed(1) + 'px)'); O('scan', f >= Tm.checked && f <= Tm.checked + 22 ? Math.sin(Math.PI * scp) : 0);
    const st = $('stamp'), sp2 = prog(f, Tm.people - 3, Tm.people + 7, E.in);
    T(st, 'translate(' + (540 - st.offsetWidth / 2) + 'px,1300px) rotate(-8deg) scale(' + (lmix(2.4, 1, sp2) * (1 + .05 * hitPulse(f - Tm.people - 7, 1, 4))).toFixed(4) + ')');
    O(st, f >= Tm.people - 3 ? .15 + .85 * sp2 : 0);
    /* under the laugh the camera leans in toward the girl */
    T('bpcam', 'scale(' + lmix(1, 1.08, prog(f, Tm.s7, Tm.same, E.dolly)).toFixed(4) + ')');
  }

  /* ================= 7: the recap, one style per word ================= */
  if (f >= Tm.same) {
    const bgs = [[Tm.same, 'rb0'], [Tm.video, 'rb1'], [Tm.way, 'rb2'], [Tm.less, 'rb3'], [Tm.boring, 'rb4']];
    let cur = 0; bgs.forEach(([t0], i) => { if (f >= t0) cur = i; });
    bgs.forEach(([, id], i) => vis(id, i === cur));
  }

  /* ================= the girl, one pose per part ================= */
  const pIn = (n, t0) => springAt(SPR.pop, f, t0);
  girl(1, f, { on: f >= Tm.send && f < Tm.whip + 16, x: 540 + -1300 * prog(f, Tm.whip, Tm.whip + 16, E.in), y: 1560, h: 960, pop: pIn(1, Tm.send), popq: hitPulse(f - Tm.send - 8, 1, 5), per: .85, amp: 12, sway: 3 });
  const g2out = prog(f, Tm.dive - 10, Tm.dive + 6, E.in);
  const g2hop = hitPulse(f - Tm.cut - 6, 1, 6) + hitPulse(f - Tm.hit - 4, 1, 6) + hitPulse(f - Tm.pops[2], 1, 6) + hitPulse(f - Tm.lit, 1, 6);
  girl(2, f, { on: f >= Tm.drop && f < Tm.dive + 6, x: 540, y: 1600, h: 760, pop: pIn(2, Tm.drop) * (1 - g2out), popq: g2hop * .6, per: .5, amp: 26, sway: 6, swayP: 1, lift: 30 * g2hop });
  const g3hop = hitPulse(f - Tm.creators - 9, 1, 6) + hitPulse(f - Tm.business - 9, 1, 6) + hitPulse(f - Tm.you, 1, 6);
  girl(3, f, { on: f >= Tm.streamers && f < Tm.s6 + 2, x: 760, y: 1600 - 1920 * prog(f, Tm.s6 - 12, Tm.s6 + 2, E.in), h: 620, pop: pIn(3, Tm.streamers), popq: g3hop * .6, per: .7, amp: 10, sway: 3, lift: 24 * g3hop });
  const pt = prog(f, Tm.s7, Tm.same, E.dolly);
  girl(4, f, { on: f >= Tm.s7, x: 540 + 120 * prog(f, Tm.same, Tm.same + 20, E.inOut), y: 1640, h: lmix(1000, 1120, pt) * (1 - 0.18 * prog(f, Tm.same, Tm.same + 20, E.inOut)), pop: pIn(4, Tm.s7), popq: hitPulse(f - Tm.s7 - 8, 1, 5), per: .32, amp: f < Tm.same ? 18 : 8, sway: 2.5 });

  /* ================= captions ================= */
  for (const { c, el, ws } of capEls) {
    const on = f >= c.in && f < c.out && !(c.style === 'c1' && f >= Tm.snap); el.style.display = on ? 'block' : 'none';
    if (!on) continue;
    c.words.forEach((w, k) => {
      const p = M.springFn(SPR.snap)(Math.max(0, f - w.f + 2) / 60), seen = f >= w.f - 2;
      const out = prog(f, c.out - 6, c.out, E.in);
      ws[k].style.visibility = seen ? 'visible' : 'hidden';
      ws[k].style.transform = 'translateY(' + (30 * (1 - p)).toFixed(1) + 'px) scale(' + (mix(.55, 1, p) * (1 - .3 * out)).toFixed(4) + ')';
      ws[k].style.opacity = (1 - out).toFixed(3);
    });
    if (c.style === 'c1b') el.style.color = f >= Tm.fill - 6 ? C.ink : C.orange;
    if (c.style === 'c3') el.style.color = f >= Tm.glow + 2 ? C.cream : C.ink;
    /* the last part changes ink with the background under each word */
    if (c.style === 'c7') c.words.forEach((w, k) => {
      const i = [Tm.same, Tm.video, Tm.way, Tm.less, Tm.boring].filter(t => f >= t).length - 1;
      const ink = ['#ff4a1c', '#0b0b0b', '#0b0b0b', '#eaf2ff', '#ff4d00'][i];
      ws[k].style.color = ink;
      ws[k].className = 'w' + (i === 4 ? ' glowc' : '');
      ws[k].style.fontFamily = ['Archivo Black', 'Archivo Wide', 'Bricolage Grotesque', 'IBM Plex Mono', 'Archivo Wide'][i];
    });
  }

  /* ================= the glitch cut into the end card ================= */
  const gon = f >= Tm.glitch;
  for (let i = 0; i < 9; i++) {
    const d = $('gs' + i); d.style.visibility = gon ? 'visible' : 'hidden'; if (!gon) continue;
    const r = rand('gc' + i + '_' + Math.floor(f / 2)), h = 40 + r * 180, y = rand('gy' + i + '_' + Math.floor(f / 2)) * 1920;
    d.style.top = y.toFixed(0) + 'px'; d.style.height = h.toFixed(0) + 'px';
    d.style.background = ['rgba(255,0,60,.85)', 'rgba(0,255,230,.8)', '#000', '#fff', 'rgba(255,214,10,.8)'][i % 5];
    T(d, 'translateX(' + ((r - .5) * 300).toFixed(0) + 'px)'); d.style.mixBlendMode = i % 5 < 2 ? 'screen' : 'normal';
  }
  T('caps', gon ? 'translateX(' + ((rand('gx' + Math.floor(f / 2)) - .5) * 80).toFixed(0) + 'px)' : 'none');
}
`;

/* the recap backgrounds in part 7, static per word */
const rbCss = `
#rb0{background:${C.dark}}#rb0::before{content:"";position:absolute;inset:36px;border:3px solid ${C.orange};clip-path:polygon(0 0,64px 0,64px 3px,3px 3px,3px 64px,0 64px,0 100%,64px 100%,64px calc(100% - 3px),3px calc(100% - 3px),3px calc(100% - 64px),0 calc(100% - 64px))}
#rb1{background:${C.orange}}
#rb2{background:repeating-conic-gradient(from 0deg at 50% 40%,${C.ray} 0deg 7.5deg,${C.yellow} 7.5deg 15deg)}
#rb3{background-color:${C.paper};background-image:linear-gradient(rgba(255,255,255,.16) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.16) 2px,transparent 2px);background-size:140px 140px}
#rb4{background:#050505}
`;

const page = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1080, height=1920"><title>promo1</title>
<script src="gsap.min.js"></script><script src="motion.js"></script>
<style>${css}${rbCss}</style></head>
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
const tc = f => { const s = Math.floor(f / 60), fr = Math.floor(f % 60); return '00:00:' + String(s).padStart(2, '0') + ':' + String(fr).padStart(2, '0'); };
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
  window.__timelines['main'] = tl;
}
Promise.all(['400 100px "Archivo Black"', '900 100px "Archivo Wide"', '500 100px "JetBrains Mono"', '800 100px "Bricolage Grotesque"', '500 100px "IBM Plex Mono"'].map(s => document.fonts.load(s))).then(build);
})();
</script></body></html>`;
writeFileSync(new URL('index.html', P), page);
console.log('wrote promo1-lv/index.html');

/* ---------- the end card: cinetic-test without the url ---------- */
const EC = new URL('promo1-lv-end/', here);
mkdirSync(new URL('fonts/', EC), { recursive: true });
for (const f of ['gsap.min.js', 'motion.js']) copyFileSync(new URL('cinetic-test/' + f, here), new URL(f, EC));
copyFileSync(new URL('cinetic-test/fonts/Michroma.woff2', here), new URL('fonts/Michroma.woff2', EC));
const ecHtml = readFileSync(new URL('cinetic-test/index.html', here), 'utf8')
  .replace(/<div id="url"[^>]*><span id="urlIn">theboringtek\.com<\/span><\/div>/, '<div id="url" style="display:none"><span id="urlIn"></span></div>');
if (ecHtml.includes('theboringtek.com')) throw new Error('the end card still carries the url');
writeFileSync(new URL('index.html', EC), ecHtml);

/* ---------- sound: cues from the same frames, under the voice ---------- */
const at = f => f / FPS;
const cues = [
  { t: 0, kind: 'tick' }, { t: at(T.c0), kind: 'bounce' }, { t: at(T.c1), kind: 'bounce', opts: { f0: 190 } }, { t: at(T.c2), kind: 'land' },
  { t: at(T.snap - 14), kind: 'whooshUp' }, { t: at(T.snap), kind: 'zap' }, { t: at(T.snap), kind: 'bass', opts: { len: 0.8 } }, { t: at(T.fill - 6), kind: 'whoosh' },
  { t: at(T.send), kind: 'bwop' }, ...[T.stream, T.shop, T.clip].flatMap(c => [{ t: at(c - 8), kind: 'whoosh' }, { t: at(c + 8), kind: 'click' }]),
  { t: at(T.orbit), kind: 'spin' }, { t: at(T.whip + 4), kind: 'whooshUp' },
  { t: at(T.cut + 6), kind: 'land' }, { t: at(T.cut + 6), kind: 'bass', opts: { len: 0.6 } }, { t: at(T.split), kind: 'crunch' }, { t: at(T.drop), kind: 'whoosh' },
  { t: at(T.hit + 4), kind: 'bass', opts: { len: 0.7 } }, ...T.pops.map(p => ({ t: at(p), kind: 'bubble' })),
  ...[0, 1, 2, 3].map(i => ({ t: at(T.zoomW + 3 * i + 8), kind: 'tap' })), { t: at(T.flip + 7), kind: 'toggle' }, { t: at(T.through - 6), kind: 'whooshUp' },
  { t: at(T.glow - 2), kind: 'sweep', opts: { len: 0.35 } }, ...[0, 1, 2, 3].map(i => ({ t: at(T.glow + 4 + i * 6 + 2), kind: 'tick' })), { t: at(T.lit), kind: 'zap' },
  { t: at(T.glitchG), kind: 'glitch' }, { t: at(T.dive + 10), kind: 'whooshUp' },
  { t: at(T.not + 4), kind: 'tock' }, { t: at(T.not + 34), kind: 'tock' }, { t: at(T.hmm), kind: 'hum', opts: { len: 2.0 } }, { t: at(T.hmm), kind: 'chime', opts: { f: 784 } },
  ...[0, 1, 2, 3].map(i => ({ t: at(T.give + i * 16), kind: 'tock' })), ...reelTicks.map(f => ({ t: at(f), kind: 'tap' })),
  { t: at(T.lock), kind: 'click' }, { t: at(T.lock), kind: 'chime' }, { t: at(T.expand), kind: 'whooshUp' },
  { t: at(T.streamers), kind: 'bwop' }, { t: at(T.streamers), kind: 'coin' }, { t: at(T.creators + 9), kind: 'coin' }, { t: at(T.business + 9), kind: 'coin' },
  /* the counter rolls (beat sheet: tocks), and his landing off the paper, the land spring's first contact 10 frames in */
  { t: at(T.creators), kind: 'tock' }, { t: at(T.business), kind: 'tock' },
  { t: at(T.we), kind: 'whooshUp' }, { t: at(T.you), kind: 'land' }, { t: at(T.s6 - 12), kind: 'sweep', opts: { len: 0.4 } },
  { t: at(T.built - 6), kind: 'sweep', opts: { len: 0.5 } }, { t: at(T.code), kind: 'tock' }, { t: at(T.code + 8), kind: 'tock' }, { t: at(T.checked), kind: 'sweep', opts: { len: 0.4 } },
  { t: at(T.stand), kind: 'whooshUp' }, { t: at(T.stand + 10), kind: 'land' }, { t: at(T.people + 7), kind: 'crunch' }, { t: at(T.people + 7), kind: 'bass', opts: { len: 0.6 } },
  { t: at(T.s7), kind: 'bwop' }, ...[T.same, T.video, T.way, T.less].map(f => ({ t: at(f), kind: 'tap' })), { t: at(T.boring), kind: 'bass', opts: { len: 0.5 } },
  { t: at(T.glitch), kind: 'glitch' },
  /* the end card's own four, offset to its start */
  { t: at(MAIN), kind: 'sweep', opts: { len: 0.8 } }, { t: at(MAIN + 59) - 0.11, kind: 'whoosh', opts: { len: 0.22 } }, { t: at(MAIN + 65), kind: 'bass', opts: { len: 1.4 } }, { t: at(MAIN + 120), kind: 'click' },
];
const TOTAL_S = (MAIN + END) / FPS, LEN = Math.round(TOTAL_S * SR);
/* the effects: every level 6 dB up from the first cut, so the hits punch through the music */
const BASE_GAINS = { tick: -24, tock: -22, tap: -22, sweep: -22, spin: -22, hum: -26, chime: -20, whoosh: -24, coin: -20 };
const SFX_UP = EFX ? 1 : 6;   /* the first render: these gains against a voice 1 dB down */
const gains = Object.fromEntries([...new Set(cues.map(c => c.kind))].map(k => [k, (BASE_GAINS[k] ?? GAINS[k]) + SFX_UP]));
/* the transitions, tonal only: every noise based whoosh, sweep, spin, glitch and tap
   swapped for a sound with a pitch or a punch, made here in code (no noise anywhere in
   them) and written to hf/sfx/. a card fly gets the pop, a part cut the boom, a fast
   move the zip, the snap the build that ends on the 3.88s drop, a glitch the stutter */
const synth = (len, f) => { const b = new Float32Array(Math.round(len * SR)); for (let i = 0; i < b.length; i++) b[i] = f(i / SR, i / b.length); return b; };
const finishSfx = b => { let m = 0; for (const v of b) m = Math.max(m, Math.abs(v)); const fo = Math.round(0.006 * SR); for (let i = 0; i < b.length; i++) b[i] /= m; for (let i = 0; i < fo; i++) b[b.length - 1 - i] *= i / fo; for (let i = 0; i < 24; i++) b[i] *= i / 24; return b; };
const osc = () => { let ph = 0; return hz => (ph += 2 * Math.PI * hz / SR); };
const MADE = {
  /* a clean pop: 1100 falling to 380 in 25ms, an octave over it, gone in a tenth */
  pop: (() => { const o = osc(); return synth(0.10, t => { const p = o(380 + 720 * Math.exp(-t / 0.008)); return Math.tanh(1.6 * (Math.sin(p) + 0.3 * Math.sin(2 * p) * Math.exp(-t / 0.01))) * Math.exp(-t / 0.028); }); })(),
  /* the boom: 150 hertz falling to 42, saturated so a phone hears its harmonics, a 1.2k tick on the front for the punch */
  boom: (() => { const o = osc(), k = osc(); return synth(0.70, t => { const p = o(42 + 108 * Math.exp(-t / 0.06)); return Math.tanh(2.2 * Math.sin(p)) / Math.tanh(2.2) * Math.exp(-t / 0.20) + 0.25 * Math.sin(k(1200)) * Math.exp(-t / 0.004); }); })(),
  /* the zip: a pitched digital swipe, sine with its second and third, gliding two octaves */
  zipUp: (() => { const o = osc(); return synth(0.16, (t, q) => { const p = o(500 * Math.pow(4, q)); return (Math.sin(p) + 0.2 * Math.sin(2 * p) + 0.3 * Math.sin(3 * p)) * Math.pow(Math.sin(Math.PI * q), 0.8); }); })(),
  zipDown: (() => { const o = osc(); return synth(0.16, (t, q) => { const p = o(1800 * Math.pow(0.25, q)); return (Math.sin(p) + 0.2 * Math.sin(2 * p) + 0.3 * Math.sin(3 * p)) * Math.pow(Math.sin(Math.PI * q), 0.8); }); })(),
  /* the build: a saw voice and its fifth climbing 110 to 440, brightening, swelling, the tremolo speeding up, cut dead on the drop */
  build: (() => { const o = osc(), tr = osc(); return synth(1.0, (t, q) => { const p = o(110 * Math.pow(4, Math.pow(q, 1.4))); let v = 0; for (let h = 1; h <= 8; h++) { const w = Math.exp(-(h - 1) * (1.3 - q)) / h; v += w * (Math.sin(h * p) + 0.5 * Math.sin(1.5 * h * p)); } return v * Math.pow(q, 2.2) * (1 - 0.45 * (0.5 + 0.5 * Math.sin(tr(6 + 22 * q * q)))); }); })(),
  /* the stutter: eight 17ms slices of a square ish tone jumping between pitches, decaying */
  stutter: (() => { const P = [880, 220, 660, 165, 1320, 110, 990, 147]; return synth(0.14, (t, q) => { const s = Math.min(7, Math.floor(t / 0.0175)), u = t - s * 0.0175, p = 2 * Math.PI * P[s] * u; return (Math.sin(p) + Math.sin(3 * p) / 3 + Math.sin(5 * p) / 5) * Math.exp(-3.5 * q) * Math.min(1, u / 0.001, (0.0175 - u) / 0.001); }); })(),
};
for (const [k, b] of Object.entries(MADE)) { finishSfx(b); writeWav(fileURLToPath(new URL('sfx/' + k + '.wav', here)), b); VOICES['t_' + k] = (o = {}) => { const g = Math.pow(10, (o.gain ?? 0) / 20); return b.map(v => v * g); }; }
const loudest = b => { const B = 480; let best = 0, at = 0; for (let i = 0; i + B <= b.length; i += B) { let e = 0; for (let j = i; j < i + B; j++) e += b[j] * b[j]; if (e > best) { best = e; at = i; } } return { at: (at + B / 2) / SR, rms: Math.sqrt(best / B) }; };
const CUTS = [T.s2, T.s3, T.s4, T.s5, T.s6, T.s7].map(at);
const CARDS = [T.stream, T.shop, T.clip].map(c => at(c - 8));
const swaps = {}, note = (k, t) => (swaps[k] ??= []).push(+t.toFixed(2));
/* the new sound at the old one's level, its loudest 10ms where the old one's was */
const swap = (c, to, opts) => { const o = loudest(VOICES[c.kind](c.opts || {})), m = loudest(VOICES['t_' + to]()); const db = gains[c.kind] + 20 * Math.log10(o.rms / m.rms); note(c.kind + ' to ' + to, c.t = Math.max(0, c.t + o.at - m.at)); c.kind = 't_' + to; c.opts = { gain: +db.toFixed(2), ...opts }; };
const bassDb = gains.bass + 20 * Math.log10(loudest(VOICES.bass({ len: 0.6 })).rms / loudest(VOICES.t_boom()).rms) - 2;
for (const c of [...cues]) {
  const k = c.kind;
  if (k === 'whoosh' || k === 'whooshUp') {
    if (CUTS.some(x => x > c.t && x - c.t < 0.7)) { c.kind = 'drop'; continue; }         /* the cut gets its boom below */
    if (Math.abs(c.t - at(T.snap - 14)) < 1e-6) { c.t = at(T.snap) - MADE.build.length / SR; c.kind = 't_build'; c.opts = { gain: gains.whooshUp + 20 * Math.log10(loudest(VOICES.whooshUp()).rms / loudest(MADE.build).rms) }; note('whooshUp to build', c.t); continue; }
    if (CARDS.some(x => Math.abs(x - c.t) < 1e-6)) swap(c, 'pop'); else swap(c, k === 'whooshUp' ? 'zipUp' : 'zipDown');
  } else if (k === 'sweep' || k === 'spin') swap(c, 'zipUp');
  else if (k === 'glitch') swap(c, 'stutter');
  else if (k === 'tap') { c.kind = 'tock'; c.opts = { f: 2600 }; note('tap to tock', c.t); }
}
for (let i = cues.length - 1; i >= 0; i--) if (cues[i].kind === 'drop') cues.splice(i, 1);
for (const x of CUTS) if (!cues.some(c => c.kind === 'bass' && Math.abs(c.t - x) < 0.35)) { cues.push({ t: x, kind: 't_boom', opts: { gain: +bassDb.toFixed(2) } }); note('boom on cut', x); }
gains.tock ??= BASE_GAINS.tock + SFX_UP;
for (const k of Object.keys(MADE)) gains['t_' + k] = 0;
console.log('transitions:', JSON.stringify(swaps));
const { buf: sfxBuf, report } = renderList(cues, TOTAL_S, { gains });
const voice = decode(FFMPEG, fileURLToPath(new URL('promo-voice-lv.mp3', here)));
const vfull = new Float32Array(LEN); vfull.set(voice.subarray(0, Math.min(voice.length, Math.round(MAIN / FPS * SR))));
const fadeN = Math.round(0.04 * SR), vend = Math.round(MAIN / FPS * SR);
if (EFX) vfull.set(voice.subarray(0, Math.min(voice.length, LEN)));   /* the whole file, untouched, its silent tail runs under the end card */
else for (let i = 0; i < fadeN; i++) vfull[vend - 1 - i] *= i / fadeN;
const env = voiceEnvelope(W.map(w => ({ start: w.s, end: w.e })), TOTAL_S);

/* ---------- the music bed: one track per part, switched on the part cuts ----------
   source points are measured (scratch analysis: onset tempo and low band jumps):
   music-2's drop at 27.79 lands on the colour snap, music-1 enters on its own
   kick in at 4.38 and on its re-entry after the breakdown at 80.75, music-3 on
   its section starts at 10.95 and 33.93, and its natural ending from 99.0 is the
   soft tail under the end card. every switch sits on a part cut under a whoosh. */
const TR = Object.fromEntries([1, 2, 3].map(n => [n, decode(FFMPEG, fileURLToPath(new URL('music/music-' + n + '.mp3', here)))]));
const MUSIC = MUSICMIX ? [
  /* --music: three runs, no switch inside a run. music-2 from its build, the drop on the
     colour snap, straight through parts 1 to 3; music-3 from its section start at 10.98
     on the part 4 cut, straight through 4 to 6; music-1 from the downbeat of its full
     phrase at 98.69 (the grid from its 68.38 re-entry, twelve bars on) on the part 7
     cut, under the glitch and the end card, faded to zero on the last frame */
  { part: '1 to 3', track: 2, src: 107.745 - T.snap / FPS, t0: 0, t1: T.s4 / FPS, trim: -2.5, fin: 0.01, ref: T.snap / FPS },
  { part: '4 to 6', track: 3, src: 10.982, t0: T.s4 / FPS, t1: T.s7 / FPS, trim: -1.5 },
  { part: '7 and end card', track: 1, src: 98.692, t0: T.s7 / FPS, t1: TOTAL_S, trim: -3, fout: 0.9 },
] : [
  { part: '1', track: 2, src: 107.745 - T.snap / FPS, t0: 0, t1: T.s2 / FPS, trim: -2.5, fin: 0.01, boost: { from: T.snap / FPS, db: 3 }, ref: T.snap / FPS },
  { part: '2 and 3', track: 1, src: 7.745, t0: T.s2 / FPS, t1: T.s4 / FPS, trim: -2.5 },
  { part: '4', track: 3, src: 10.982, t0: T.s4 / FPS, t1: T.s5 / FPS, trim: -1.5 },
  { part: '5', track: 1, src: 68.375, t0: T.s5 / FPS, t1: T.s6 / FPS, trim: -4.5 },
  { part: '6', track: 3, src: 33.918, t0: T.s6 / FPS, t1: T.s7 / FPS, trim: -1.5 },
  { part: '7', track: 2, src: 187.875, t0: T.s7 / FPS, t1: MAIN / FPS, trim: -2.5, fout: 0.015 },
  { part: 'end card tail', track: 3, src: 99.0, t0: MAIN / FPS, t1: TOTAL_S, trim: -9, fin: 0.25, fout: 0.6 },
];
const rmsOf = (b, a, z) => { let s = 0; for (let i = a; i < z; i++) s += b[i] * b[i]; return Math.sqrt(s / Math.max(1, z - a)); };
/* the voice level while she talks: the reference the bed and the hits sit under */
let vs = 0, vc = 0; for (let i = 0; i < vend; i++) if (env[i] > 0.6) { vs += vfull[i] * vfull[i]; vc++; }
const Vrms = Math.sqrt(vs / vc);
/* the voice: dry, nothing on her but this gain. 3 dB down against the bed and the hits */
const VOICE_DB = EFX ? 0 : -3, Vtalk = Vrms * Math.pow(10, VOICE_DB / 20);
for (let i = 0; i < LEN; i++) vfull[i] *= Math.pow(10, VOICE_DB / 20);
const BED_UNDER = MUSICMIX ? -3.3 : 2.5;   /* dB under the voice in the gaps: --music sits about level with her */
const DUCK = 1 - Math.pow(10, -(MUSICMIX ? 4.5 : 3) / 20);     /* down while she talks: 3 dB, 4.5 in --music so the long runs land 3 dB under her */
const music = new Float32Array(LEN);
for (const m of NOMUSIC ? [] : MUSIC) {
  const src = TR[m.track], a = Math.round(m.t0 * SR), z = Math.round(m.t1 * SR), s0 = Math.round(m.src * SR);
  const r0 = m.ref ? Math.round((m.ref - m.t0) * SR) : 0;
  const segRms = rmsOf(src, s0 + r0, s0 + (z - a));
  const g = Vrms * Math.pow(10, (-BED_UNDER + m.trim) / 20) / segRms;
  const fi = Math.round((m.fin ?? 0.025) * SR), fo = Math.round((m.fout ?? 0.025) * SR);
  for (let i = a; i < z; i++) {
    const k = i - a; let w = 1;
    if (k < fi) w = Math.sin(Math.PI / 2 * k / fi);
    if (z - i < fo) w *= Math.sin(Math.PI / 2 * (z - i) / fo);
    const bo = m.boost && i >= Math.round(m.boost.from * SR) ? Math.pow(10, m.boost.db / 20) : 1;
    music[i] += (src[s0 + k] || 0) * g * w * bo;
  }
  m.gainDb = +(20 * Math.log10(g)).toFixed(1);
}
/* duck the bed under the voice; the hits duck less so they still land */
const bed = new Float32Array(LEN), hits = new Float32Array(LEN);
/* the soft duck everywhere, then a floor for soft words only: a word whose own
   level is not WORD_GAP dB over the ducked bed under it gets just enough extra
   duck for that word, ramped in and out over 40ms. loud words keep the soft duck. */
const WORD_GAP = MUSICMIX ? 0 : 4, ramp = Math.round(0.04 * SR);
const extra = new Float32Array(LEN).fill(1);
for (const w of W) {
  const a = Math.round(w.s * SR), z = Math.round(w.e * SR);
  let bs = 0; for (let i = a; i < z; i++) { const b = music[i] * (1 - DUCK * env[i]); bs += b * b; }
  const need = rmsOf(vfull, a, z) * Math.pow(10, -WORD_GAP / 20) / Math.max(1e-9, Math.sqrt(bs / (z - a)));
  if (need >= 1) continue;
  for (let i = a - ramp; i < z + ramp; i++) {
    const k = i < a ? (i - (a - ramp)) / ramp : i >= z ? (z + ramp - i) / ramp : 1;
    extra[i] = Math.min(extra[i], 1 - (1 - need) * Math.sin(Math.PI / 2 * Math.max(0, Math.min(1, k))));
  }
}
for (let i = 0; i < LEN; i++) {
  bed[i] = music[i] * (1 - DUCK * env[i]) * extra[i];
  hits[i] = sfxBuf[i] * (1 - 0.4 * env[i]);
}
/* --no-music effects: no ducking. each sound rendered on its own and set by its loudest
   20ms against her talking level, 3 dB under it, the big ones (the build, the booms,
   every bass hit: the snap, the slams, the stamp) level with her. its peak never passes
   her own peak. sounds that start together are one event and share the level */
const FX = [];
if (EFX) {
  hits.fill(0);
  const w20 = Math.round(0.02 * SR);
  const loud20 = (b, a, z) => { let m = 0; for (let i = a; i + w20 <= z; i += 240) m = Math.max(m, rmsOf(b, i, i + w20)); return m; };
  let vpk = 0; for (let i = 0; i < vend; i++) vpk = Math.max(vpk, Math.abs(vfull[i]));
  const BIG = new Set(['t_build', 't_boom', 'bass']);
  const one = cues.map(c => { const b = renderList([c], TOTAL_S, { gains }).buf, a = Math.max(0, Math.round(c.t * SR)); let z = a; for (let i = a; i < LEN; i++) if (b[i]) z = i; return { c, b, a, z: z + 1 }; });
  const groups = [];
  for (const o of one.sort((p, q) => p.c.t - q.c.t)) { const g = groups.find(g => Math.abs(g[0].c.t - o.c.t) < 0.02); g ? g.push(o) : groups.push([o]); }
  for (const g of groups) {
    const big = g.some(o => BIG.has(o.c.kind)), target = Vrms * Math.pow(10, (big ? 0 : -3) / 20);
    for (const o of g) { const l = loud20(o.b, o.a, o.z); let pk = 0; for (let i = o.a; i < o.z; i++) pk = Math.max(pk, Math.abs(o.b[i])); o.g = Math.min(target / l, vpk / pk); }
    const a = Math.min(...g.map(o => o.a)), z = Math.max(...g.map(o => o.z)), sum = new Float32Array(LEN);
    for (const o of g) for (let i = o.a; i < o.z; i++) sum[i] += o.b[i] * o.g;
    let pk = 0; for (let i = a; i < z; i++) pk = Math.max(pk, Math.abs(sum[i]));
    const k = Math.min(1, target / loud20(sum, a, z), vpk / pk);
    for (const o of g) { o.g *= k; for (let i = o.a; i < o.z; i++) hits[i] += o.b[i] * o.g; FX.push({ ...o, big }); }
  }
  /* a sound her words still cover (its loudest 20ms more than 5 dB under her there)
     comes up until it clears that, never past her talking level or her peak */
  for (const o of FX) {
    let best = -1, vAt = 0; for (let i = o.a; i + w20 <= o.z; i += 240) { const r = rmsOf(o.b, i, i + w20) * o.g; if (r > best) { best = r; vAt = rmsOf(vfull, i, i + w20); } }
    if (vAt < 3e-3 || best >= vAt * Math.pow(10, -5 / 20)) continue;
    let pk = 0; for (let i = o.a; i < o.z; i++) pk = Math.max(pk, Math.abs(o.b[i] * o.g));
    const up = Math.min(vAt * Math.pow(10, -5 / 20) / best, Vrms / best, vpk / pk);
    if (up <= 1) continue;
    for (let i = o.a; i < o.z; i++) hits[i] += o.b[i] * o.g * (up - 1);
    o.g *= up;
  }
}
/* guard: no hit is ever louder than the talking voice. a peak limiter on the hit
   bus alone, threshold at the voice's talking level in 50ms rms, so only
   the hits that would cross it come down and every other hit keeps its 6 dB */
const win = Math.round(0.05 * SR), hR = new Float32Array(LEN);
{ let s = 0; for (let i = 0; i < LEN; i++) { s += hits[i] * hits[i]; if (i >= win) s -= hits[i - win] * hits[i - win]; hR[i] = Math.sqrt(Math.max(0, s) / win); } }
const thr = Vtalk;
let hg = 1, hmax = 0, hAt = 0;
const la = Math.round(0.05 * SR);
for (let i = 0; i < (EFX ? 0 : LEN); i++) {
  const r = hR[Math.min(LEN - 1, i + la)];
  const want = r > thr ? thr / r : 1;
  hg = want < hg ? want : want + Math.exp(-1 / (0.12 * SR)) * (hg - want);
  if (1 - hg > hmax) { hmax = 1 - hg; hAt = i / SR; }
  hits[i] *= hg;
}
const hitTrim = 1 - hmax;
const out = new Float32Array(LEN);
for (let i = 0; i < LEN; i++) out[i] = vfull[i] + hits[i] + bed[i];
const wav = fileURLToPath(new URL(NOMUSIC ? 'mix-nomusic.wav' : MUSICMIX ? 'mix-music.wav' : 'mix.wav', V));
let mm;
if (EFX) {
  /* the voice stays at the file's level: the effects already sit at hers, so the mix
     needs no raise. where her peak and an effect's add up past the ceiling, that
     effect alone comes down, just enough, and the true peak is read back off the file */
  let ceil = Math.pow(10, -2.2 / 20), m, trimmed = new Set();
  const w20 = Math.round(0.02 * SR);
  for (const o of FX) { o.g0 = o.g; o.ds = 0; }
  const hp = b => { const r = Float32Array.from(b), c = Math.exp(-2 * Math.PI * 1500 / SR); for (let p = 0; p < 2; p++) { let y = 0, x1 = 0; for (let i = 0; i < r.length; i++) { y = c * (y + r[i] - x1); x1 = r[i]; r[i] = y; } } return r; };
  const vHi = hp(vfull);
  const lp = b => { const r = Float32Array.from(b), c = 1 - Math.exp(-2 * Math.PI * 200 / SR); for (let p = 0; p < 2; p++) { let y = 0; for (let i = 0; i < r.length; i++) { y += c * (r[i] - y); r[i] = y; } } return r; };
  const vLo = lp(vfull);
  /* the band a sound lives in: under 200 for a bass hit, over 1.5k for the rest */
  const bandOf = (b, a, z, g, low) => { const f = low ? lp : hp, vv = low ? vLo : vHi, bh = f(b.subarray(a, Math.min(LEN, z + w20))); let bb = -1, vb = 0; for (let i = 0; i + w20 <= z - a; i += 240) { const r = rmsOf(bh, i, i + w20) * g; if (r > bb) { bb = r; vb = rmsOf(vv, a + i, a + i + w20); } } return 20 * Math.log10(bb / Math.max(1e-6, vb)); };
  /* how a sound sits against her: broadband and over 1.5k, its loudest 20ms vs hers there */
  const sits = (b, a, z, g) => { let best = -1, vAt = 0, at = a; for (let i = a; i + w20 <= z; i += 240) { const r = rmsOf(b, i, i + w20) * g; if (r > best) { best = r; vAt = rmsOf(vfull, i, i + w20); at = i; } }
    const over = 20 * Math.log10(best / Math.max(1e-6, vAt)); if (vAt < 3e-3 || over > -6) return { ok: true, over, gap: vAt < 3e-3 };
    const band = Math.max(bandOf(b, a, z, g, false), bandOf(b, a, z, g, true)); return { ok: band > 0, over, band }; };
  const shifted = (o, ds) => { const b = new Float32Array(LEN); for (let i = o.a; i < o.z; i++) if (i + ds >= 0 && i + ds < LEN) b[i + ds] = o.b[i]; return b; };
  for (let n = 0; n < 6; n++) {
    for (let pass = 0; pass < 12; pass++) {
      let hit = false;
      for (const o of FX) {
        let need = 1;
        for (let i = o.a; i < o.z; i++) { const v = vfull[i] + hits[i]; if (Math.abs(v) > ceil && Math.sign(o.b[i]) === Math.sign(v)) { const own = o.b[i] * o.g, x = Math.abs(v) - ceil; if (Math.abs(own) > 2 * x) need = Math.min(need, 1 - x / Math.abs(own)); } }
        if (need < 1) { for (let i = o.a; i < o.z; i++) hits[i] -= o.b[i] * o.g * (1 - need); o.g *= need; trimmed.add(o); hit = true; }
      }
      if (!hit) break;
    }
    /* a sound her peak still covers slides up to 3 frames either way, to where it fits */
    for (const o of FX) {
      if (o.nudged || sits(o.b, o.a, o.z, o.g).ok) continue;
      o.nudged = true;
      for (let i = o.a; i < o.z; i++) hits[i] -= o.b[i] * o.g;
      let pick = null;
      for (const df of [1, -1, 2, -2, 3, -3]) {
        const ds = Math.round(df * SR / FPS), b = shifted(o, ds), a = Math.max(0, o.a + ds), z = Math.min(LEN, o.z + ds);
        let need = 1; for (let i = a; i < z; i++) { const own = b[i] * o.g0, v = vfull[i] + hits[i] + own; if (Math.abs(v) > ceil && Math.sign(own) === Math.sign(v)) { const x = Math.abs(v) - ceil; need = Math.abs(own) > x ? Math.min(need, 1 - x / Math.abs(own)) : 0; } }
        const r = sits(b, a, z, o.g0 * need);
        if (r.ok) { pick = { b, a, z, g: o.g0 * need, df }; break; }
      }
      if (pick) { o.b = pick.b; o.a = pick.a; o.z = pick.z; o.g = pick.g; o.c.t += pick.df / FPS; o.df = pick.df; }
      for (let i = o.a; i < o.z; i++) hits[i] += o.b[i] * o.g;
    }
    for (let i = 0; i < LEN; i++) out[i] = vfull[i] + hits[i];
    writeWav(wav, out);
    m = loudness(FFMPEG, wav);
    if (m.truePeak <= -1.3) break;
    ceil *= Math.pow(10, -0.3 / 20);
  }
  /* every effect 4 dB up, then a soft limiter on the effects bus alone: per sample the
     bus gain that keeps her plus it under the ceiling, a 3ms lookahead minimum, eased
     over 3ms on the way down and 60ms back up. the voice never passes through it */
  const FX_UP = 4, up = Math.pow(10, FX_UP / 20);
  for (const o of FX) o.pre = o.g, o.g *= up;
  const bus = new Float32Array(LEN); for (const o of FX) for (let i = o.a; i < o.z; i++) bus[i] += o.b[i] * o.g;
  const la = Math.round(0.003 * SR), rel = Math.exp(-1 / (0.06 * SR)), gl = new Float32Array(LEN);
  let lc = Math.pow(10, -1.9 / 20);
  for (let n = 0; n < 8; n++) {
    const need = new Float32Array(LEN).fill(1);
    for (let i = 0; i < LEN; i++) { const v = vfull[i], h = bus[i], x = v + h; if (Math.abs(x) > lc && h) need[i] = Math.max(0, Math.min(1, (lc * Math.sign(x) - v) / h)); }
    const mn = new Float32Array(LEN); for (let i = 0; i < LEN; i++) { let q = 1; for (let j = Math.max(0, i - la); j <= Math.min(LEN - 1, i + la); j++) if (need[j] < q) q = need[j]; mn[i] = q; }
    let g = 1; for (let i = 0; i < LEN; i++) { let q = 0; for (let j = i; j < Math.min(LEN, i + la); j++) q += mn[j]; q /= Math.min(la, LEN - i); g = q < g ? q : q + rel * (g - q); gl[i] = Math.min(g, mn[i]); }
    for (let i = 0; i < LEN; i++) { hits[i] = bus[i] * gl[i]; out[i] = vfull[i] + hits[i]; }
    writeWav(wav, out);
    m = loudness(FFMPEG, wav);
    if (m.truePeak <= -1.3) break;
    lc *= Math.pow(10, -0.3 / 20);
  }
  /* what each sound gained in the end: its loudest 20ms through the limiter against last round's */
  for (const o of FX) { let a0 = 0, a1 = 0; for (let i = o.a; i + w20 <= o.z; i += 240) { let e0 = 0, e1 = 0; for (let j = i; j < i + w20; j++) { const v = o.b[j]; e0 += v * v; e1 += v * v * gl[j] * gl[j]; } a0 = Math.max(a0, e0); a1 = Math.max(a1, e1); } o.gain = 10 * Math.log10(a1 / Math.max(1e-12, a0)) + 20 * Math.log10(o.g / o.pre); o.g = o.g * Math.sqrt(a1 / Math.max(1e-12, a0)); }
  let lim = 1; for (let i = 0; i < LEN; i++) lim = Math.min(lim, gl[i]);
  mm = { wholeMix: 0, effectsUp: FX_UP, effectsLimiterMax: +(20 * Math.log10(lim)).toFixed(1), lufs: m.lufs, truePeak: m.truePeak };
  if (MUSICMIX) {
    /* the bed as it is, the music at its normal level under the bars too */
    const lift = new Float32Array(LEN).fill(1);
    const bedM = new Float32Array(LEN);
    for (let i = 0; i < LEN; i++) bedM[i] = music[i] * (1 - DUCK * env[i]) * extra[i];
    /* music and effects on one bus, the voice beside it: a soft limiter on that bus only,
       solved against her sample by sample, 3ms lookahead, 60ms back up */
    const bus2 = new Float32Array(LEN); for (let i = 0; i < LEN; i++) bus2[i] = hits[i] + bedM[i];
    const gl2 = new Float32Array(LEN);
    let lc2 = Math.pow(10, -1.6 / 20);
    for (let n = 0; n < 10; n++) {
      const need = new Float32Array(LEN).fill(1);
      /* the peak between samples too: a cubic through the mix at quarter steps */
      const X = i => (i < 0 || i >= LEN ? 0 : vfull[i] + bus2[i]);
      for (let i = 0; i < LEN; i++) {
        const v = vfull[i], h = bus2[i]; if (!h) continue;
        let p = Math.abs(v + h); const y0 = X(i - 1), y1 = v + h, y2 = X(i + 1), y3 = X(i + 2);
        for (const t of [0.25, 0.5, 0.75]) p = Math.max(p, Math.abs(y1 + 0.5 * t * (y2 - y0 + t * (2 * y0 - 5 * y1 + 4 * y2 - y3 + t * (3 * (y1 - y2) + y3 - y0)))));
        if (p > lc2) need[i] = Math.max(0.1, Math.min(1, (lc2 - Math.abs(v)) / Math.abs(h)));
      }
      const mn = new Float32Array(LEN); for (let i = 0; i < LEN; i++) { let q = 1; for (let j = Math.max(0, i - la); j <= Math.min(LEN - 1, i + la); j++) if (need[j] < q) q = need[j]; mn[i] = q; }
      let g = 1; for (let i = 0; i < LEN; i++) { let q = 0; for (let j = i; j < Math.min(LEN, i + la); j++) q += mn[j]; q /= Math.min(la, LEN - i); g = q < g ? q : q + rel * (g - q); gl2[i] = Math.min(g, mn[i]); }
      for (let i = 0; i < LEN; i++) out[i] = vfull[i] + bus2[i] * gl2[i];
      writeWav(wav, out);
      m = loudness(FFMPEG, wav);
      if (m.truePeak <= -1.2) break;
      lc2 *= Math.pow(10, -0.2 / 20);
    }
    let l2 = 1, sum = 0; for (let i = 0; i < LEN; i++) { l2 = Math.min(l2, gl2[i]); sum += 20 * Math.log10(gl2[i]); }
    mm = { ...mm, musicBusLimiterMax: +(20 * Math.log10(l2)).toFixed(1), musicBusLimiterMean: +(sum / LEN).toFixed(2), lufs: m.lufs, truePeak: m.truePeak };
    for (let i = 0; i < LEN; i++) bed[i] = bedM[i] * gl2[i];
    { let gp = 0, gc = 0, sp = 0, sc = 0; for (let i = Math.round(T.snap / FPS * SR); i < vend; i++) { if (env[i] < 0.2) { gp += bed[i] * bed[i]; gc++; } else if (env[i] > 0.6) { sp += bed[i] * bed[i]; sc++; } }
      console.log('music vs her talking level, from the colour snap on: gaps', (20 * Math.log10(Math.sqrt(gp / gc) / Vtalk)).toFixed(1), 'dB, while she talks', (20 * Math.log10(Math.sqrt(sp / sc) / Vtalk)).toFixed(1), 'dB'); }
    /* the bars: the music under them (music-2), cut into 24 log bands from
       45 hertz to 12k per frame (2048 point fft, hann), each band scaled between its own
       quiet and loud over the bars' time, straight up and 80ms down: the kick moves the
       low bars, the hats the high ones */
    const N = 2048, f0 = T.drop - 2, f1 = T.zoomW + 1, hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
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
      for (let i = 0; i < N; i++) { const j = c - N / 2 + i; re[i] = j >= 0 && j < LEN ? music[j] * lift[j] * hann[i] : 0; }
      fft(re, im);
      dbs.push(edges.slice(0, 24).map((lo, b) => { const k0 = Math.max(1, Math.floor(lo * N / SR)), k1 = Math.max(k0, Math.ceil(edges[b + 1] * N / SR)); let e = 0; for (let k = k0; k <= k1; k++) e += re[k] * re[k] + im[k] * im[k]; return 10 * Math.log10(e / (k1 - k0 + 1) + 1e-12); }));
    }
    const lo = [], hi = []; for (let b = 0; b < 24; b++) { const v = dbs.map(r => r[b]).sort((p, q) => p - q); lo.push(v[Math.floor(v.length * 0.1)]); hi.push(v[v.length - 1]); }
    const rel8 = Math.exp(-1 / (0.08 * FPS)), held = new Float64Array(24);
    const BARS = dbs.map(r => r.map((d, b) => { const v = Math.max(0, Math.min(1, (d - lo[b]) / Math.max(3, hi[b] - lo[b]))); held[b] = v > held[b] ? v : v + rel8 * (held[b] - v); return Math.round(100 * (0.12 + 0.88 * held[b])); }));
    const pageFile = new URL('index.html', P);
    writeFileSync(pageFile, readFileSync(pageFile, 'utf8').replace('const BARS = null, BARS0 = 0;', 'const BARS = ' + JSON.stringify(BARS) + ', BARS0 = ' + f0 + ';'));
    console.log('equalizer: bars', (T.drop / FPS).toFixed(2), 'to', (T.zoomW / FPS).toFixed(2), 's, driven by', MUSIC.find(m => m.t0 <= T.drop / FPS && m.t1 > T.drop / FPS).track === 2 ? 'music-2' : 'another track');
  }
  const GROUP = o => (o.big ? 'big' : 'normal');
  for (const k of ['normal', 'big']) { const v = FX.filter(o => GROUP(o) === k).map(o => o.gain).sort((p, q) => p - q); console.log('group', k, v.length, 'sounds, up', 'min', v[0].toFixed(1), 'median', v[v.length >> 1].toFixed(1), 'max', v[v.length - 1].toFixed(1), 'dB'); }
  for (const o of FX) if (o.gain < 3) console.log('held by the limiter', o.c.kind.replace('t_', ''), o.c.t.toFixed(2), 'up', o.gain.toFixed(1), 'dB');
  console.log('voice', (voice.length / SR).toFixed(2) + 's, all of it in the mix:', voice.length <= LEN, ', main part', (MAIN / FPS).toFixed(2) + 's');

  /* audible: in the final mix, each sound's loudest 20ms against her in the same 20ms */
  for (const o of FX.sort((p, q) => p.c.t - q.c.t)) {
    let best = -1e9, vAt = 0; for (let i = o.a; i + w20 <= o.z; i += 240) { const r = rmsOf(o.b, i, i + w20) * o.g; if (r > best) { best = r; vAt = rmsOf(vfull, i, i + w20); } }
    const over = 20 * Math.log10(best / Math.max(1e-6, vAt));
    let band = '';
    if (over <= -6 && vAt >= 3e-3) band = Math.max(bandOf(o.b, o.a, o.z, o.g, false), bandOf(o.b, o.a, o.z, o.g, true));
    console.log('fx', o.c.t.toFixed(2).padStart(6), o.c.kind.replace('t_', '').padEnd(9), 'vs talking', (20 * Math.log10(best / Vrms)).toFixed(1).padStart(5), 'dB, vs her there', vAt < 3e-3 ? '  gap' : over.toFixed(1).padStart(5), band === '' ? (over > -6 || vAt < 3e-3 ? 'AUDIBLE' : 'MASKED') : 'in its band ' + band.toFixed(1) + ' dB ' + (band > 0 ? 'AUDIBLE' : 'MASKED'), o.df ? 'moved ' + o.df + ' frames' : '');
  }
} else mm = master(out, FFMPEG, wav, { lufs: -14, tp: -1.3, maxReduction: 7 });
console.log('mix', report.length, 'sounds', JSON.stringify(mm), 'hit trim', (20 * Math.log10(hitTrim)).toFixed(1), 'dB, loudest hit window at', hAt.toFixed(2));
for (const m of MUSIC) console.log('music', m.part.padEnd(14), 'music-' + m.track, 'src', m.src.toFixed(2) + 's', 'at', m.t0.toFixed(2) + 's to', m.t1.toFixed(2) + 's', 'gain', m.gainDb, 'dB');
/* the checks, by measurement: the bed either side of every switch, and the voice over the bed word by word */
const db = v => (20 * Math.log10(v + 1e-9)).toFixed(1);
for (const m of MUSIC.slice(1)) { const c = Math.round(m.t0 * SR), q = Math.round(0.4 * SR); console.log('switch', m.t0.toFixed(2), 'bed before', db(rmsOf(music, c - q, c)), 'after', db(rmsOf(music, c, c + q)), 'dB'); }
let worst = 1e9, worstW = '';
for (const w of W) { const a = Math.round(w.s * SR), z = Math.round(w.e * SR); const r = 20 * Math.log10(rmsOf(vfull, a, z) / Math.max(1e-9, rmsOf(bed, a, z))); if (r < worst) { worst = r; worstW = w.text + ' at ' + w.s; } }
{ let sp = 0, sc = 0, gp = 0, gc = 0, ms = 0, mc = 0; for (let i = 0; i < vend; i++) { if (env[i] > 0.6) { sp += bed[i] * bed[i]; sc++; } else if (env[i] < 0.02) { gp += bed[i] * bed[i]; gc++; } ms += out[i] * out[i]; mc++; }
  console.log('bed vs talking voice: in gaps', db(Math.sqrt(gp / gc) / Vtalk), 'dB, while she talks', db(Math.sqrt(sp / sc) / Vtalk), 'dB; pre master mix rms', db(Math.sqrt(ms / mc))); }
const wr = W.map(w => { const a = Math.round(w.s * SR), z = Math.round(w.e * SR); return 20 * Math.log10(rmsOf(vfull, a, z) / Math.max(1e-9, rmsOf(bed, a, z))); }).sort((p, q) => p - q);
console.log('voice over bed per word: median', wr[wr.length >> 1].toFixed(1), 'dB, under 6 dB:', wr.filter(v => v < 6).length, 'of', wr.length);
console.log('voice over bed, worst word:', worst.toFixed(1), 'dB (' + worstW + ')');
console.log('limited hits:', MUSIC.length ? cues.filter(c => { const a = Math.round(c.t * SR); return a < LEN && rmsOf(hits, a, a + win) > 0 && rmsOf(sfxBuf, a, a + win) * (1 - 0.4 * env[a]) > thr; }).map(c => c.kind + '@' + c.t.toFixed(2)).join(' ') : '');
let hv = -1e9, hvAt = 0; for (let i = 0; i + win < LEN; i += win) { const r = 20 * Math.log10(rmsOf(hits, i, i + win) / Vtalk); if (r > hv) { hv = r; hvAt = i / SR; } }
console.log('loudest hit window vs talking voice:', hv.toFixed(1), 'dB at', hvAt.toFixed(2) + 's');

/* ---------- stills, render, join ---------- */
const args = process.argv.slice(2), si = args.indexOf('--stills');
if (si >= 0) {
  rmSync(new URL('snapshots/', P), { recursive: true, force: true });
  execFileSync(HF, ['snapshot', '.', '--at', args[si + 1]], { cwd: fileURLToPath(P), stdio: 'ignore', shell: true });
  for (const f of readdirSync(new URL('snapshots/', P)).filter(f => f.startsWith('contact-sheet'))) copyFileSync(new URL('snapshots/' + f, P), new URL(f.replace('contact-sheet', 'stills'), V));
  console.log('stills in', fileURLToPath(V));
}
if (!args.includes('--no-render') && si < 0) {
  execFileSync(HF, ['render', '.', '--workers', '1', '--fps', '60', '-q', 'high', '-o', 'main.mp4', '--quiet'], { cwd: fileURLToPath(P), stdio: 'inherit', shell: true });
  execFileSync(HF, ['render', '.', '--workers', '1', '--fps', '60', '-q', 'high', '-o', 'end.mp4', '--quiet'], { cwd: fileURLToPath(EC), stdio: 'inherit', shell: true });
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', fileURLToPath(new URL('main.mp4', P)), '-i', fileURLToPath(new URL('end.mp4', EC)), '-i', wav,
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT]);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', OUT, '-vf', 'fps=2,scale=216:-1,tile=10x8', '-frames:v', '1', fileURLToPath(new URL('contact.png', V))]);
  console.log('wrote', OUT);
}
