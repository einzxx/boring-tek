/* the boring tek — demo/lib/aiafter.mjs. the AI AFTER series.

   one rig for every episode. an episode is a title, an ep number and a gag,
   and nothing else: the page, the title lockup, the ep tag, the mascot with
   his glow, the gaze, the camera, post43's glitch, the wordmark end card, the
   render, the silent encode, the critique sheets and the guards all live here.

   the series rule: frame 0 already shows everything. the title, the tag and
   the mascot are at full opacity and full size on the first frame, no black,
   no fade, no pop in. a guard measures frame 0 and fails the run if not.

   silent by default, einz adds the sound. an episode with a read passes its
   takes from readLines() as `voice`, and its `subs`: the lib mixes the bus to
   -14 LUFS, muxes it, draws post43's subtitles and guards the gaps.

     import { runEpisode } from './lib/aiafter.mjs';
     await runEpisode({
       post: 44, ep: 1, title: ['line one', 'line two'],
       cut: 6.3,                        the glitch cut to the end card
       hold: 1.0,                       the end card, 1s at least, never less
       mascot: { cx, cy, size },        where he sits, css px of the 540x960 stage
       gag: {
         css, markup,                   inside the camera, under him
         front,                         inside the camera, over him
         overlay,                       over the camera, not zoomed
         data, page,                    page() defines window.__gag.apply(o), reads window.__GAGD
         frame(t),                      what page() is handed each frame
         face(t),                       { lid, arc, look:{x,y,w}, dx, dy, rot, sq, s }
         camera(t),                     { s, tx, ty } or null, see focus()
         sleep: [[a, b]],               the only windows the eyes may stay shut
         beats: [t...],                 something new, checked every 2 to 4s
         checks: ['#sel'],              held inside the margins while the camera is at 1
         hook: ['#sel'],                must be fully on screen at frame 0
         copy: ['text on screen'],      checked for dashes, quotes, colons
         verify: [{ at, sel, test(r) }],  gag checks on the page, test returns a fail or null
         log: [[t, 'what']],
       },
       voice: TAKES,                    optional, from readLines(), each placed with place()
       subs: [{ line, text }],          optional, post43's subtitles, matched to the read
     });

     DEMO_FPS=12 node postNN.mjs         the preview
     node postNN.mjs                     60fps
     node postNN.mjs --keep-frames       leave the jpegs on disk
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime, mascotPagePlan,
  STAGE, HEAD, GRID, EYE_CX, TURN, GLOW,
} from './mascot.mjs';
import { brandTokens } from './captions.mjs';
import { EASE as K } from './motion.mjs';
import { speak, VOICE_OUT, elevenReady } from './voice.mjs';
import { SR, decode, writeWav, applyGain, limit, loudness } from './sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(HERE, '..');
const ROOT = path.resolve(DEMO, '..');
const OUT = path.join(DEMO, 'out');

export const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
export const DSF = STAGE.dsf, VW = STAGE.w, VH = STAGE.h;
export const MARGIN = 120 / DSF;
export const APP_ZONE = 300 / DSF;
const KEEP = process.argv.slice(2).includes('--keep-frames');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the small maths, for the gags too ---------- */
export const EASE = K.ease, SPRING = K.spring, IO = K.io, EIN = K.in;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
export const bump = (t, a, up, hold, down) => (t < a ? 0 : t < a + up ? smooth(span(t, a, a + up)) : t < a + up + hold ? 1 : 1 - smooth(span(t, a + up + hold, a + up + hold + down)));
export function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps), n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}
/* the camera: at p 0 it is still, at p 1 the stage point F sits at the screen
   point S, z times bigger. hand the result back from gag.camera(t) */
export function focus(p, F, S, z) {
  const s = lerp(1, z, p);
  const x = lerp(F.x, S.x, p), y = lerp(F.y, S.y, p);
  return { s: +s.toFixed(5), tx: +(x - F.x * s).toFixed(3), ty: +(y - F.y * s).toFixed(3) };
}

/* ---------- the series look ---------- */
export const TITLE = { top: MARGIN + 30, w: VW - 2 * MARGIN, lh: 1.22, gap: 6 };
export const TAG = { top: MARGIN, size: 13 };
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };
const COPY_BAN = /[-\u2010-\u2015:'"\u2018-\u201f`]/;

/* ==========================================================================
   the read, post43's way: the narrator on eleven_v3, the whole line in one
   request, never cut, stretched or pitched, speed 1.0. TRIES takes a line,
   one kept by measurement: all its words, no hole over 0.6s, nothing
   trailing, then the length nearest the middle of the good ones.
   ========================================================================== */
const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const V = { voice: 'calm', speed: 1.0, model: 'eleven_v3', set: { stability: 0.5, style: 0.2 }, silence: -42 };
function quietRun(pcm, a, b) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, V.silence / 20), H = Math.round(0.005 * SR);
  let best = 0, run = 0;
  for (let k = Math.floor(a * SR / H); k < Math.floor(b * SR / H); k++) {
    let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    run = m > gate ? 0 : run + 1; best = Math.max(best, run);
  }
  return +(best * 0.005).toFixed(4);
}
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, V.silence / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m > gate; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}
async function oneTake(post, L, i, n) {
  const want = L.text, name = 'post' + post + '-' + L.key + '-v3t' + n;
  const cached = path.join(VOICE_OUT, name + '-' + V.voice + '.json');
  let g = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.provider === 'elevenlabs' && j.elevenId === 'narrator' && j.model === V.model && j.speed === V.speed && fs.existsSync(j.file)) g = j;
  }
  if (!g) {
    try { g = await speak(want, { voice: V.voice, name, speed: V.speed, model: V.model, ...V.set }); }
    catch (e) { console.error('\nSTOPPED. elevenlabs failed on ' + name + ': ' + (e && e.message || e)); process.exit(1); }
  }
  if (g.provider !== 'elevenlabs' || g.elevenId !== 'narrator' || g.model !== V.model) { console.error('\nSTOPPED. ' + name + ' came back from ' + g.provider + ' ' + g.model + '.'); process.exit(1); }
  if (g.timing !== 'engine') { console.error('\nSTOPPED. ' + name + ' has estimated timings and the picture is cut to the read.'); process.exit(1); }
  const pcm = decode(ffmpeg, g.file);
  const words = g.words.filter(w => letters(w.word)).map(w => ({ word: w.word, start: +w.start, end: +w.end }));
  const count = want.split(/\s+/).filter(x => letters(x)).length;
  const edge = audioEdges(pcm);
  const t = { i, n, name, pcm, words, edge, ok: true, why: [] };
  if (count !== words.length) { t.ok = false; t.why.push(words.length + ' words'); return t; }
  t.hole = quietRun(pcm, words[0].start, words[words.length - 1].end);
  t.tail = +(edge.end - words[words.length - 1].end).toFixed(3);
  t.dur = +(edge.end - edge.start).toFixed(3);
  if (t.hole > 0.6) { t.ok = false; t.why.push('a ' + t.hole + 's hole'); }
  if (t.tail > 0.5) { t.ok = false; t.why.push('sound ' + t.tail + 's after the last word'); }
  return t;
}
export async function readLines(post, LINES, tries = 3) {
  if (!elevenReady('narrator')) { console.error('\nSTOPPED. elevenlabs is not set up for the narrator in demo/.env.'); process.exit(1); }
  const out = [];
  for (let i = 0; i < LINES.length; i++) {
    const all = [];
    for (let n = 1; n <= tries; n++) all.push(await oneTake(post, LINES[i], i, n));
    const good = all.filter(x => x.ok);
    if (!good.length) { console.error('\nSTOPPED. no usable take of line ' + (i + 1) + ': ' + all.map(x => x.why.join(', ')).join(' | ')); process.exit(1); }
    const mid = good.map(x => x.dur).sort((x, y) => x - y)[Math.floor((good.length - 1) / 2)];
    const kept = good.reduce((x, y) => (Math.abs(y.dur - mid) < Math.abs(x.dur - mid) ? y : x));
    kept.all = all.map(x => 't' + x.n + (x.ok ? ' ' + x.dur + 's' : ' out, ' + x.why.join(', ')) + (x === kept ? ' KEPT' : ''));
    out.push(kept);
  }
  return out;
}
/* a take on the clip's clock, and its words with it */
export function place(T, at) {
  T.at = +at.toFixed(4);
  T.end = +(at + T.edge.end - T.edge.start).toFixed(4);
  T.W = T.words.map(w => ({ ...w, start: +(at + w.start - T.edge.start).toFixed(4), end: +(at + w.end - T.edge.start).toFixed(4) }));
}
export function wAt(T, w, after = 0) {
  for (let k = after; k < T.W.length; k++) if (letters(T.W[k].word) === letters(w)) return T.W[k].start;
  throw new Error('no word "' + w + '" in line ' + (T.i + 1) + ': ' + T.W.map(x => x.word).join(' '));
}
export const VGAP = 0.42;

/* post43's subtitles */
const ST = { size: 21, weight: 500, top: 770, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 5 };
function subCards(TAKES, SUBS) {
  const cards = [], cursor = TAKES.map(() => 0);
  for (const c of SUBS) {
    const T = TAKES[c.line], want = letters(c.text);
    let k = cursor[c.line];
    while (k < T.W.length && !want.startsWith(letters(T.W[k].word))) k++;
    const a = k;
    let got = '';
    while (k < T.W.length && got.length < want.length) got += letters(T.W[k++].word);
    if (got !== want) throw new Error('subtitle "' + c.text + '" does not match the read: ' + T.W.map(w => w.word).join(' '));
    cursor[c.line] = k;
    cards.push({ ...c, from: +(T.W[a].start - ST.lead).toFixed(4), to: +(T.W[k - 1].end + ST.tail).toFixed(4) });
  }
  for (let i = 0; i + 1 < cards.length; i++) if (cards[i].to > cards[i + 1].from - 0.02) cards[i].to = +(cards[i + 1].from - 0.02).toFixed(4);
  return cards;
}

export async function runEpisode(E) {
  const G = E.gag;
  const NAME = 'post' + E.post;
  const FRAMES = path.join(OUT, 'frames-' + NAME);
  const VERIFY = path.join(OUT, 'verify-' + NAME);
  const FILE = path.join(OUT, NAME + '-dark-1080x1920.mp4');
  /* the end card holds a second at least, every episode */
  const CUT = E.cut, END_HOLD = Math.max(1.0, E.hold ?? 1.0);
  const SECONDS = +(CUT + END_HOLD).toFixed(4);
  const TAGTEXT = 'ep ' + E.ep;

  const TAKES = E.voice || null;
  const CARDS = TAKES && E.subs ? subCards(TAKES, E.subs) : [];
  function subAt(t) {
    for (let i = 0; i < CARDS.length; i++) {
      const c = CARDS[i];
      if (t < c.from || t >= c.to) continue;
      const o = Math.min(1, span(t, c.from, c.from + ST.fadeIn), 1 - span(t, c.to - ST.fadeOut, c.to));
      return { o: +o.toFixed(4), y: +(ST.rise * (1 - EASE(span(t, c.from, c.from + ST.fadeIn)))).toFixed(3), i };
    }
    return { o: 0, y: 0, i: -1 };
  }
  for (const s of [...E.title, TAGTEXT, ...(G.copy || []), ...CARDS.map(c => c.text)]) if (COPY_BAN.test(s)) throw new Error('a dash, colon, apostrophe or quote on screen: ' + s);

  /* ---------- him ---------- */
  const M = E.mascot;
  const plan = planMascot({ hands: false, seconds: 30, theme: 'dark', size: M.size, bias: 0, seed: M.seed ?? 44, marks: [{ t: 0.0, state: 'neutral' }] });
  plan.box = { left: +(M.cx - M.size / 2).toFixed(2), top: +(M.cy - M.size / 2).toFixed(2), size: M.size };
  const GAZE = { span: 150, max: 0.8, vspan: 260, vy: 2.2, up: 0.35, down: 0.5 };
  const PL_R = HEAD.plate.s / 2, PL_CX = HEAD.plate.x + PL_R;
  function eyeRoom(ey, halfW, halfH) {
    const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
    const PL_CY = HEAD.plate.y + PL_R;
    const dy = Math.max(Math.abs(top - PL_CY), Math.abs(bot - PL_CY));
    const half = dy >= PL_R ? 0 : Math.sqrt(PL_R * PL_R - dy * dy);
    return Math.max(0, half - TURN.margin - halfW);
  }
  function applyGaze(mas, g) {
    if (!g.q && !g.v) return;
    const aq = Math.abs(g.q), sgn = g.q < 0 ? -1 : 1, far = g.q >= 0 ? 1 : 0;
    for (let k = 0; k < 2; k++) {
      const e = mas.eyes[k];
      if (k === far) { e.sx *= 1 - TURN.farX * aq; e.sy *= 1 - TURN.farY * aq; }
      const want = e.x + sgn * aq * (k === far ? TURN.shift : TURN.shift + TURN.wrap);
      const ey = e.y + GAZE.vy * g.v;
      const from = EYE_CX[k] - PL_CX + want;
      const lim = eyeRoom(ey, HEAD.eye.w / 2 * Math.abs(e.sx), HEAD.eye.h / 2 * Math.abs(e.sy));
      e.x = +(want + (clamp(from, -lim, lim) - from)).toFixed(4);
      e.y = +ey.toFixed(4);
    }
    mas.card.rot = +(mas.card.rot + TURN.tilt * g.q).toFixed(4);
  }
  const faceAt = t => ({ lid: 0.04, arc: 0, dx: 0, dy: 0, rot: 0, sq: 0, s: 1, ...G.face(t) });
  function compose(t) {
    const mas = mascotFrame(plan, t);
    const F = faceAt(t);
    if (F.look) {
      const eyeY = M.cy + F.dy + (HEAD.eye.cy / GRID - 0.5) * M.size * F.s;
      const w = F.look.w ?? 1;
      applyGaze(mas, {
        q: +(clamp((F.look.x - M.cx - F.dx) / GAZE.span, -1, 1) * GAZE.max * w).toFixed(5),
        v: +(clamp((F.look.y - eyeY) / GAZE.vspan, -GAZE.up, GAZE.down) * w).toFixed(5),
      });
    }
    for (const e of mas.eyes) {
      e.sy = +(e.sy * lerp(1, 0.40, F.arc)).toFixed(4);
      e.sx = +(e.sx * lerp(1, 1.28, F.arc)).toFixed(4);
      e.y = +(e.y + 0.9 * F.arc).toFixed(4);
      e.lid = +lerp(F.lid, 0, F.arc).toFixed(4);
    }
    mas.card = { ...mas.card, x: +(mas.card.x + F.dx).toFixed(4), y: +(mas.card.y + F.dy).toFixed(4), rot: +(mas.card.rot + F.rot).toFixed(4),
      sx: +(mas.card.sx * F.s * (1 + F.sq)).toFixed(5), sy: +(mas.card.sy * F.s * (1 - F.sq)).toFixed(5) };
    mas.shadow = { ...mas.shadow, o: 0 };
    return mas;
  }

  /* ---------- the glitch: post43's, cut short, one burst and the residue ---------- */
  const GL = {
    offsets: [{ d: 0.09, for: 3 / 60, heat: 1.0 }, { d: 0, for: 2 / 60, heat: 0.45, residue: true }],
    jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70,
  };
  const GL_WINDOWS = GL.offsets.map((o, i) => ({ ...onGrid(CUT - o.d, o.for, FPS), heat: o.heat, residue: !!o.residue, seed: 0x5c1a + i * 977 }));
  function glitchAt(f) {
    const g = { heat: 0, jx: 0, jy: 0, split: 0, slices: [] };
    const t = f / FPS;
    const w = GL_WINDOWS.find(x => t >= x.t0 - 1e-9 && t < x.t1 - 1e-9);
    if (!w) return g;
    const r = prng(w.seed ^ (f * 2654435761));
    g.heat = w.heat;
    g.jx = +((r() * 2 - 1) * GL.jumpX * w.heat).toFixed(1);
    g.jy = +((r() * 2 - 1) * GL.jumpY * w.heat).toFixed(1);
    g.split = +(w.heat * (3 + r() * (GL.split - 3))).toFixed(1);
    for (let i = 0; i < (w.residue ? 0 : GL.slices); i++) {
      const h = lerp(GL.sliceH[0], GL.sliceH[1], r());
      g.slices.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.sliceDx * w.heat).toFixed(1) });
    }
    return g;
  }
  const WM1 = { at: CUT, for: 0.09 };

  function frameAt(t, f) {
    const cam = (G.camera && G.camera(t)) || { s: 1, tx: 0, ty: 0 };
    return {
      t: +t.toFixed(4), f, main: t < CUT ? 1 : 0, cam,
      gag: G.frame(t),
      subt: subAt(t),
      g: glitchAt(f),
      wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
    };
  }

  /* ---------- the page ---------- */
  function sceneHtml() {
    const brand = brandTokens();
    const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
    return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>${NAME}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --read:"Space Grotesk",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--read)}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 38%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 50%,rgba(0,0,0,0) 74%)}
#main{position:absolute;inset:0}
#cam{position:absolute;inset:0;transform-origin:0 0;will-change:transform}

/* ---- the series: title lockup and the ep tag, on from frame 0 ---- */
.aa-title{position:absolute;left:${MARGIN}px;top:${TITLE.top}px;width:${TITLE.w}px;z-index:5;
  font-family:var(--display);font-weight:400;color:var(--fg);line-height:${TITLE.lh};white-space:nowrap;
  text-shadow:0 0 8px rgba(255,255,255,.22),0 0 22px rgba(255,255,255,.10)}
.aa-title span{display:block;width:max-content}
.aa-title span+span{margin-top:${TITLE.gap}px}
.aa-tag{position:absolute;right:${MARGIN}px;top:${TAG.top}px;z-index:5;font-family:var(--mono);font-size:${TAG.size}px;line-height:1;
  color:var(--accent);letter-spacing:.14em;padding:5px 8px 4px;border:1px solid var(--accent);border-radius:4px}

/* ---- the mascot ---- */
#mas-cut{position:absolute;inset:0;z-index:6}
${mascotCss(plan)}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- the gag ---- */
${G.css || ''}

/* ---- the subtitles, post43's ---- */
.subt{position:absolute;left:${MARGIN}px;right:${MARGIN}px;top:${ST.top}px;text-align:center;z-index:9;
  font-family:var(--read);font-weight:${ST.weight};font-size:${ST.size}px;line-height:1.3;color:var(--sub);white-space:nowrap;opacity:0;will-change:transform,opacity}

/* ---- the end card ---- */
.wm{position:absolute;left:50%;top:${VH / 2}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}

/* ---- the glitch, post43's ---- */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#aa-r)}
.gl .g{filter:url(#aa-g)}
.gl .b{filter:url(#aa-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${chan('aa-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('aa-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
  ${chan('aa-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
</defs></svg>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="main">
    <div id="cam">
      <div class="aa-tag" id="aa-tag">${TAGTEXT}</div>
      <div class="aa-title" id="aa-title">${E.title.map(l => '<span>' + l + '</span>').join('')}</div>
      ${G.markup || ''}
      <div id="mas-cut">${mascotMarkup(plan)}</div>
      ${G.front || ''}
    </div>
    ${G.overlay || ''}
    <div class="subt" id="subt"></div>
  </div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__AA = ${JSON.stringify({ VW, VH, WM, TW: TITLE.w, SLICES: GL.slices, SUBS: CARDS.map(c => c.text) })};
window.__GAGD = ${JSON.stringify(G.data || {})};
${mascotRuntime()}
(${seriesPage.toString()})();
${G.page ? '(' + G.page.toString() + ')();' : 'window.__gag = { apply() {} };'}
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('500 21px "Space Grotesk"')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__aa.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
  }

  const serve = html => new Promise(resolve => {
    const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(html); });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });

  const ff = (args, stderr = false) => (stderr ? spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr : execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString());

  console.log('\n' + NAME + ', ai after ep ' + E.ep + '. ' + SECONDS + 's, ' + FPS + 'fps.');
  if (TAKES) for (const T of TAKES) console.log('    line ' + (T.i + 1) + ' at ' + T.at.toFixed(2) + 's, ' + T.all.join(', '));
  for (const [t, what] of [...(G.log || []), [CUT, 'the glitch cut, the end card'], [SECONDS, 'the end']].sort((a, b) => a[0] - b[0])) {
    console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
  }

  /* ---------- render ---------- */
  if (!CHROME) throw new Error('no chrome found');
  fs.rmSync(FRAMES, { recursive: true, force: true }); fs.mkdirSync(FRAMES, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio', '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => { const p = new Promise(r => { expired = r; }); await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms }); await p; };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const q of ['400 40px "Michroma"', '500 21px "Space Grotesk"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  const built = await page.evaluate(() => window.__built);

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__aa.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__aa.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };
  const rect = sel => page.evaluate(s => window.__aa.rect(s), sel);

  const fails = [];
  const SB = { l: MARGIN, t: MARGIN, r: VW - MARGIN, b: VH - APP_ZONE };
  const outside = r => r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || r.b > SB.b + 0.5;
  const box = r => [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / ');

  /* the hook: everything on and whole at frame 0 */
  await put(0, 0);
  for (const sel of ['#aa-title', '#aa-tag', '#m-card', ...(G.hook || [])]) {
    const r = await rect(sel);
    if (!r || r.o < 0.99) fails.push('frame 0: ' + sel + ' is not fully on (' + (r ? r.o.toFixed(2) : 'hidden') + ')');
  }
  const m0 = await rect('#m-card');
  if (m0 && Math.abs(m0.w - M.size) > M.size * 0.06) fails.push('frame 0: he is ' + m0.w.toFixed(1) + ' wide, not ' + M.size);
  /* the title lockup and the tag stay apart, and he stays under the title */
  const t0 = await rect('#aa-title'), g0 = await rect('#aa-tag');
  if (t0 && g0 && g0.b > t0.t - 2) fails.push('the ep tag touches the title');
  /* the margins, while the camera is still */
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    const o = await put(t, Math.round(t * FPS));
    if (o.cam.s > 1.0001) continue;
    for (const sel of ['#aa-title', '#aa-tag', '#m-card', '#subt', ...(G.checks || [])]) {
      const r = await rect(sel);
      if (r && r.w && outside(r)) fails.push(sel + ' past the margin at ' + t.toFixed(1) + 's: ' + box(r));
    }
    const sb = await rect('#subt');
    for (const sel of G.checks || []) {
      const g = await rect(sel);
      if (sb && sb.w && g && g.w && g.b > sb.t - 4 && g.r > sb.l && g.l < sb.r) fails.push(sel + ' reaches the subtitles at ' + t.toFixed(1) + 's');
    }
    const m = await rect('#m-card');
    if (m && t0 && m.t < t0.b + 4) fails.push('he reaches the title at ' + t.toFixed(1) + 's');
  }
  for (const v of G.verify || []) {
    await put(v.at, Math.round(v.at * FPS));
    const why = v.test(await rect(v.sel));
    if (why) fails.push(why);
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await rect('#wm');
  if (wr && (wr.l < SB.l || wr.r > SB.r)) fails.push('the wordmark is past the margin');

  const wall = Date.now();
  let glitched = 0;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const o = await put(t, f);
    if (o.g.heat > 0) glitched++;
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
    if (f % Math.round(FPS * 5) === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));
  await browser.close();
  srv.close();

  /* silent unless there is a read: then the bus, post43's, to -14 LUFS */
  const TARGET_LUFS = -14;
  if (!TAKES) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an', '-movflags', '+faststart', FILE]);
  } else {
    const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
    const VTRACK = new Float32Array(Math.ceil((SECONDS + 0.5) * SR));
    for (const T of TAKES) {
      const a = Math.max(0, Math.round((T.edge.start - PRE) * SR)), b = Math.min(T.pcm.length, Math.round((T.edge.end + POST) * SR));
      const at = Math.round((T.at - T.edge.start) * SR), fade = Math.round(EDGE_FADE * SR);
      for (let i = a; i < b; i++) {
        const j = at + i;
        if (j < 0 || j >= VTRACK.length) continue;
        let g = 1;
        if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
        VTRACK[j] += T.pcm[i] * g;
      }
    }
    const WAV = path.join(OUT, NAME + '-mix.wav'), RAW = path.join(OUT, NAME + '-mix-raw.wav');
    const attempt = gdb => { const buf = Float32Array.from(VTRACK); applyGain(buf, gdb); const lim = limit(buf, -1.8); writeWav(RAW, buf); return { g: gdb, lim, r: loudness(ffmpeg, RAW) }; };
    let lo = -6, hi = 30, best = null;
    for (let i = 0; i < 12; i++) {
      const a = attempt((lo + hi) / 2);
      const legal = a.lim.reduction <= 12;
      if (legal && (!best || Math.abs(a.r.lufs - TARGET_LUFS) < Math.abs(best.r.lufs - TARGET_LUFS))) best = a;
      if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
    }
    if (!best) best = attempt(0);
    { const buf = Float32Array.from(VTRACK); applyGain(buf, best.g); limit(buf, -1.8); writeWav(WAV, buf); }
    fs.rmSync(RAW, { force: true });
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
    for (let i = 0; i < 2; i++) {
      const got = loudness(ffmpeg, FILE);
      if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
      const fixed = path.join(OUT, NAME + '-mix-fix.wav'), tmp = path.join(OUT, NAME + '-tmp.mp4');
      ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', WAV, '-af', 'volume=' + (TARGET_LUFS - got.lufs).toFixed(2) + 'dB', fixed]);
      fs.renameSync(fixed, WAV);
      ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp]);
      fs.renameSync(tmp, FILE);
    }
  }

  /* ---------- the critique sheets, and frame 0 alone for the hook ---------- */
  fs.mkdirSync(VERIFY, { recursive: true });
  fs.copyFileSync(path.join(FRAMES, 'f00000.jpg'), path.join(VERIFY, 'frame0.jpg'));
  if (!KEEP) fs.rmSync(FRAMES, { recursive: true, force: true });
  const rows = Math.ceil(Math.ceil(SECONDS * 2) / 6);
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=270:-2,tile=6x' + rows + ':padding=4:color=0x303030', '-frames:v', '1', path.join(VERIFY, 'contact.png')]);
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=360:-2,tile=6x' + rows, '-frames:v', '1', path.join(VERIFY, 'phone.png')]);

  /* ---------- the guards ---------- */
  const probe = ff(['-hide_banner', '-i', FILE], true) || '';
  const dur = probe.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : 0;
  if (!/1080x1920/.test(probe)) fails.push('the file is not 1080x1920');
  if (Math.abs(seconds - SECONDS) > 0.15) fails.push('the file runs ' + seconds.toFixed(2) + 's, not ' + SECONDS);
  if (!TAKES && /Audio:/.test(probe)) fails.push('the file has sound and no read was asked for');
  if (TAKES) {
    if (!/Audio:/.test(probe)) fails.push('the file has no audio track');
    for (let i = 0; i + 1 < TAKES.length; i++) {
      const gap = TAKES[i + 1].at - TAKES[i].end;
      if (gap < 0.25) fails.push('line ' + (i + 2) + ' starts on top of line ' + (i + 1));
      if (gap > 0.6) fails.push('a ' + gap.toFixed(2) + 's gap in the voice before line ' + (i + 2));
    }
    if (TAKES[TAKES.length - 1].end > CUT) fails.push('the read runs past the cut');
    const lu = loudness(ffmpeg, FILE);
    if (!lu || !lu.ok) fails.push('the loudness could not be measured');
    else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fails.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
    console.log('\n  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
  }
  /* the house max is 10s, a read the brief asks for may run past it */
  if (SECONDS > 10 && !TAKES) fails.push('over the 10s house max');
  /* the eyes: shut only inside a sleep window, happy arcs 0.6s at most */
  const inSleep = t => (G.sleep || []).some(([a, b]) => t >= a && t <= b);
  for (let f = 0, run = 0, arc = 0; f < CUT * 60; f++) {
    const t = f / 60, F = faceAt(t);
    run = F.lid >= 0.98 && !inSleep(t) ? run + 1 : 0;
    if (run / 60 > 0.3) { fails.push('the eyes are shut outside a sleep at ' + t.toFixed(2)); break; }
    arc = F.arc > 0.01 ? arc + 1 : 0;
    if (arc / 60 > 0.6) { fails.push('a happy arc past 0.6s at ' + t.toFixed(2)); break; }
  }
  /* something new every 2 to 4 seconds */
  const beats = [0, ...(G.beats || []), CUT].sort((a, b) => a - b);
  for (let i = 0; i + 1 < beats.length; i++) if (beats[i + 1] - beats[i] > 4) fails.push('nothing new from ' + beats[i].toFixed(2) + ' to ' + beats[i + 1].toFixed(2));

  console.log('\n  ' + glitched + ' glitched frames, sheets in ' + path.relative(ROOT, VERIFY));
  console.log('  title lines ' + built.title.map(s => s.toFixed(1) + 'px').join(', ') + ', title bottom ' + (t0 ? t0.b.toFixed(1) : '?') + ' css');
  console.log('  length ' + seconds.toFixed(2) + 's, ' + (TAKES ? TAKES.length + ' reads on the bus' : 'silent') + ', ' + path.relative(ROOT, FILE));
  if (fails.length) { console.error(['', 'FAILED', ...fails].join('\n  ')); process.exit(1); }
  console.log('  guards: all green');
  return { seconds, file: FILE, verify: VERIFY };
}

function injected() {
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

/* runs in the page */
function seriesPage() {
  const P = window.__AA;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), main = $('main'), cam = $('cam');
  const title = $('aa-title'), wm = $('wm'), gl = $('gl'), subt = $('subt');
  let lastSub = -2;
  const chans = ['r', 'g', 'b'].map(k => $('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push($('sl' + i)); sliceImgs.push($('sl' + i + 'i')); }
  window.__aa = {
    /* each title line set to the full width between the margins, a block lockup */
    fit() {
      const sizes = [];
      for (const sp of title.querySelectorAll('span')) {
        sp.style.fontSize = '100px';
        const w = sp.getBoundingClientRect().width;
        sp.style.fontSize = (100 * P.TW / w).toFixed(2) + 'px';
        sizes.push(100 * P.TW / w);
      }
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      return { title: sizes };
    },
    rect(sel) {
      const e = document.querySelector(sel);
      if (!e) return null;
      let o = 1;
      for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); o *= +cs.opacity; if (cs.display === 'none') o = 0; }
      if (o < 0.01) return null;
      const r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, o };
    },
    apply(o) {
      main.style.display = o.main ? 'block' : 'none';
      cam.style.transform = 'translate(' + o.cam.tx + 'px,' + o.cam.ty + 'px) scale(' + o.cam.s + ')';
      window.__gag.apply(o.gag, o.t);
      if (o.subt.i !== lastSub) { lastSub = o.subt.i; subt.textContent = o.subt.i < 0 ? '' : P.SUBS[o.subt.i]; }
      subt.style.opacity = o.subt.o; subt.style.transform = 'translateY(' + o.subt.y + 'px)';
      stage.style.setProperty('--wm-o', o.wm.o);
      stage.style.setProperty('--wm-s', o.wm.sc);
      stage.style.setProperty('--wm-glow', o.wm.glow);
      gl.style.display = 'none';
    },
    glitch(src, g) {
      const imgs = chans.concat(sliceImgs);
      for (const im of imgs) im.src = src;
      return Promise.all(imgs.map(im => im.decode())).then(function () {
        chans[0].style.transform = 'translate(' + (g.jx - g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[1].style.transform = 'translate(' + g.jx.toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[2].style.transform = 'translate(' + (g.jx + g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        for (let i = 0; i < slices.length; i++) {
          const sl = g.slices[i];
          if (!sl) { slices[i].style.display = 'none'; continue; }
          slices[i].style.display = 'block';
          slices[i].style.setProperty('--st', sl.top.toFixed(1) + 'px');
          slices[i].style.setProperty('--sb', (P.VH - sl.top - sl.h).toFixed(1) + 'px');
          sliceImgs[i].style.transform = 'translate(' + (g.jx + sl.dx).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        }
        gl.style.display = 'block';
        return true;
      });
    },
  };
}
