/* the boring tek — the motion kit. after effects moves as small functions.

   every move here is a pure function of time that returns a **patch**: a plain
   object keyed by element id, each entry `{ style: {...}, attr: {...} }`. node
   works the numbers, the page writes them with `motionApply` and decides
   nothing, which is the same split the mascot rig uses and for the same
   reason: a captured frame carries several BeginFrames and a css animation
   would resolve at the wrong speed. no css transition, no css animation, on
   anything that has to hit a mark.

   the moves:

     kinetic     text per letter, punch scale with overshoot and a stagger
     circleWipe  a circle growing from any point until it covers the frame
     stripeWipe  bars sweeping across in a stagger, cover then uncover
     trim        trim path draw, for a line, an arrow or a circle round a target
     zoomPunch   the camera snapping in on a point and settling
     whipPan     a fast slide sideways with a horizontal blur that peaks mid move
     shake       a hit shake, seeded, decaying
     barReveal   text revealed from behind a bar that crosses it
     maskReveal  lines rising from behind their own baseline
     squash      volume preserving squash and stretch

   ---------- the curves are the site's own ----------

   `--ease` and `--spring` are lifted out of index.html at import, the same
   move captions.mjs makes, and this file throws if they are gone. change the
   site's feel and every clip built on the kit changes with it. the two are
   solved as real cubic beziers rather than approximated.

   ---------- the colours are the site's own ----------

   dark is the theme. `INK.dark` and `INK.light` are the page tokens copied
   across; light exists here only because a wipe can turn the frame to paper
   and whatever lands on that paper has to be in the paper's ink. no bloom, no
   glow, no text shadow: this kit is the clean look. */
import fs from 'node:fs';

/* ---------- tokens ---------- */
const SITE = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
function token(name) {
  const m = new RegExp('--' + name + ':cubic-bezier\\(([^)]+)\\)').exec(SITE);
  if (!m) throw new Error('motion: --' + name + ' is not a cubic-bezier in index.html any more');
  return m[1].split(',').map(Number);
}

export const INK = {
  dark: { bg: '#06070a', fg: '#d5dbd8', sub: '#c8c8c8', face: '#f4f7f5', accent: '#35ff6a', line: '#1c2026' },
  light: { bg: '#ffffff', fg: '#0b0d10', sub: '#4b5058', face: '#0b0d10', accent: '#0f8a3c', line: '#e6e8ec' },
};

/* a css cubic bezier as a function of x. newton first, bisection if newton
   stalls, which is what browsers do. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = s => ((ax * s + bx) * s + cx) * s, sy = s => ((ay * s + by) * s + cy) * s;
  const dx = s => (3 * ax * s + 2 * bx) * s + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) { const e = sx(s) - x, d = dx(s); if (Math.abs(e) < 1e-6) return sy(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
    let lo = 0, hi = 1; s = x;
    for (let i = 0; i < 40; i++) { const v = sx(s); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = s; else hi = s; s = (lo + hi) / 2; }
    return sy(s);
  };
}

export const EASE = {
  ease: bezier(...token('ease')),          /* the site's --ease, a long soft out */
  spring: bezier(...token('spring')),      /* the site's --spring, about 10% over */
  io: bezier(0.45, 0, 0.55, 1),            /* the breathe curve, for holds and whips */
  in: bezier(0.55, 0, 1, 0.45),
  linear: x => x,
};

/* a damped spring for a punch, when the token's single overshoot is not enough
   bounce: settles to 1, rings `k` times. used for per letter punch only. */
export function ring(p, k = 1, damp = 3.6) {
  if (p <= 0) return 0; if (p >= 1) return 1;
  /* the raw spring ends a little short of 1, so the shortfall is paid back
     linearly across the move rather than as a jump on the last frame. about
     16% over at the defaults, at the half way point. */
  const f = q => 1 - Math.exp(-damp * q) * Math.cos(2 * Math.PI * k * q);
  return f(p) + p * (1 - f(1));
}

export const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
export const lerp = (a, b, k) => a + (b - a) * k;
/* 0..1 through a window, eased */
export function prog(t, t0, dur, ease = EASE.ease) { return ease(clamp((t - t0) / dur)); }
const px = v => v.toFixed(2) + 'px';

/* merge any number of patches. later wins per property. */
export function merge(...ps) {
  const out = {};
  for (const p of ps) for (const [id, e] of Object.entries(p || {})) {
    const o = out[id] || (out[id] = { style: {}, attr: {} });
    Object.assign(o.style, e.style || {}); Object.assign(o.attr, e.attr || {});
  }
  return out;
}

/* ---------- squash and stretch ----------
   `s` above zero stretches along the axis, below zero squashes. the area is
   kept: sx * sy is always 1. */
export function squash(s, axis = 'y') {
  const a = 1 + s, b = 1 / a;
  return axis === 'y' ? { sx: b, sy: a } : { sx: a, sy: b };
}
/* stretch out of a velocity, clamped, for anything that travels. `per` is the
   speed that earns full stretch, in px a second. */
export function stretchFor(v, per = 1600, max = 0.22) { return clamp(Math.abs(v) / per, 0, 1) * max; }

/* ---------- kinetic text ----------
   one span per letter, ids `${id}-${i}`. each letter punches in from small and
   low, overshoots on `ring`, and settles, one `stagger` after the one before.
   `rot` alternates sign letter by letter so a word lands as a hand set line,
   not as one block. spaces are letters that never show. */
export function kineticMarkup(id, text, cls = '') {
  return `<span class="${cls}" id="${id}">` + [...text].map((c, i) =>
    `<span class="kl" id="${id}-${i}" style="display:inline-block;opacity:0">${c === ' ' ? '&nbsp;' : c}</span>`).join('') + '</span>';
}
export function kinetic(t, { id, text, t0, stagger = 0.06, dur = 0.55, from = 0.2, y = 60, rot = 9 }) {
  const out = {};
  [...text].forEach((c, i) => {
    const p = clamp((t - t0 - i * stagger) / dur);
    const sc = lerp(from, 1, ring(p));
    const o = clamp(p * 4);
    const r = (i % 2 ? 1 : -1) * rot * (1 - EASE.ease(p));
    out[id + '-' + i] = { style: { opacity: String(o), transform: `translateY(${px(y * (1 - EASE.ease(p)))}) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(4)})` } };
  });
  return out;
}

/* ---------- circle wipe ----------
   an svg circle, grown from (cx, cy) until its radius reaches the frame's
   farthest corner, so the last frame is exactly covered wherever it started. */
export function coverRadius(cx, cy, W, H) {
  return Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
}
export function circleWipe(t, { id, cx, cy, W, H, t0, dur = 0.6, ease = EASE.ease, r0 = 0 }) {
  const r = lerp(r0, coverRadius(cx, cy, W, H) + 2, prog(t, t0, dur, ease));
  return { [id]: { attr: { cx: cx.toFixed(2), cy: cy.toFixed(2), r: r.toFixed(2) } } };
}

/* ---------- stripe wipe ----------
   `n` bars at an angle, each scaling across from one edge, staggered. it covers
   by `t0 + dur / 2` and uncovers after, so the frame under it can change on
   the frame it is fully covered. odd bars run from the opposite edge: bars of
   one colour arriving from one side meet as one solid wedge and nobody reads
   stripes, interleaved they do. */
export function stripeMarkup(id, n, W, H, angle, fill) {
  const diag = Math.hypot(W, H), bh = diag / n + 1;
  return `<div id="${id}" style="position:absolute;left:50%;top:50%;width:${diag}px;height:${diag}px;margin:${-diag / 2}px 0 0 ${-diag / 2}px;transform:rotate(${angle}deg);pointer-events:none;z-index:50">`
    + Array.from({ length: n }, (_, i) => `<div id="${id}-${i}" style="position:absolute;left:0;top:${(i * diag / n).toFixed(2)}px;width:100%;height:${bh.toFixed(2)}px;background:${fill};transform:scaleX(0);transform-origin:0 50%"></div>`).join('')
    + '</div>';
}
export function stripeWipe(t, { id, n, t0, dur = 0.5, stagger = 0.03 }) {
  /* every bar is in by `full`, and each leaves in the same order it came */
  const out = {}, half = (dur - 2 * stagger * (n - 1)) / 2, full = t0 + half + stagger * (n - 1);
  for (let i = 0; i < n; i++) {
    const a = t0 + i * stagger, pin = prog(t, a, half, EASE.io), pout = prog(t, full + i * stagger, half, EASE.io);
    const covering = t < full + i * stagger, [a0, a1] = i % 2 ? ['100%', '0'] : ['0', '100%'];
    out[id + '-' + i] = { style: covering
      ? { transform: `scaleX(${pin.toFixed(4)})`, transformOrigin: a0 + ' 50%' }
      : { transform: `scaleX(${(1 - pout).toFixed(4)})`, transformOrigin: a1 + ' 50%' } };
  }
  return out;
}
export const stripeCovered = ({ n, t0, dur = 0.5, stagger = 0.03 }) => t0 + (dur - 2 * stagger * (n - 1)) / 2 + stagger * (n - 1);

/* ---------- trim path ----------
   the shapes come with their own length worked out, so nothing has to call
   getTotalLength in the page. a draw is dashoffset from len to 0; `from` and
   `to` also let a line trim from both ends, which is how a line snaps. */
export function lineShape(x1, y1, x2, y2) { return { d: `M${x1} ${y1}L${x2} ${y2}`, len: Math.hypot(x2 - x1, y2 - y1) }; }
export function circleShape(cx, cy, r, start = -90) {
  /* drawn as two arcs from `start` degrees so the draw begins where it is told */
  const a = start * Math.PI / 180, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
  const xo = cx - r * Math.cos(a), yo = cy - r * Math.sin(a);
  return { d: `M${x.toFixed(2)} ${y.toFixed(2)}A${r} ${r} 0 1 1 ${xo.toFixed(2)} ${yo.toFixed(2)}A${r} ${r} 0 1 1 ${x.toFixed(2)} ${y.toFixed(2)}`, len: 2 * Math.PI * r };
}
/* an arrow from (x1,y1) to the tip (x2,y2), shaft then both barbs in one
   stroke, so one trim draws the whole thing and the head arrives last. */
export function arrowShape(x1, y1, x2, y2, head = 18, spread = 32) {
  const a = Math.atan2(y2 - y1, x2 - x1), s = spread * Math.PI / 180;
  const b1 = [x2 - head * Math.cos(a - s), y2 - head * Math.sin(a - s)], b2 = [x2 - head * Math.cos(a + s), y2 - head * Math.sin(a + s)];
  const f = v => v.toFixed(2);
  return { d: `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(b1[0])} ${f(b1[1])}M${f(x2)} ${f(y2)}L${f(b2[0])} ${f(b2[1])}`, len: Math.hypot(x2 - x1, y2 - y1) + 2 * head };
}
export function pathMarkup(id, shape, stroke, width = 3, extra = '') {
  return `<path id="${id}" d="${shape.d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${shape.len.toFixed(2)} ${(shape.len + 10).toFixed(2)}" stroke-dashoffset="${shape.len.toFixed(2)}" ${extra}/>`;
}
/* the draw. `p` 0..1 of the visible part; with `trimFrom` the start end eats
   in as well. a line that snaps is both ends running to the middle. */
export function trim(t, { id, shape, t0, dur = 0.5, ease = EASE.ease, out = null }) {
  const L = shape.len, p = prog(t, t0, dur, ease);
  let a = 0, b = p;
  if (out) {
    const q = prog(t, out.t0, out.dur ?? 0.15, out.ease ?? EASE.in);
    if (out.mode === 'centre') { a = q * 0.5; b = 1 - q * 0.5; b = Math.min(b, p); }
    else a = q;
  }
  const vis = Math.max(0, b - a) * L;
  return { [id]: { attr: { 'stroke-dasharray': `${vis.toFixed(2)} ${(L + 10).toFixed(2)}`, 'stroke-dashoffset': (-a * L).toFixed(2), opacity: vis > 0.01 ? '1' : '0' } } };
}

/* ---------- the camera ----------
   one wrapper, one transform. zoom about a point, a pan, a shake, composed in
   that order so the shake is in screen pixels and never scales with the zoom. */
export function camera({ scale = 1, cx = 0, cy = 0, x = 0, y = 0 }) {
  return `translate(${px(x)},${px(y)}) translate(${px(cx)},${px(cy)}) scale(${scale.toFixed(4)}) translate(${px(-cx)},${px(-cy)})`;
}
/* a punch: in fast on the spring, a small give back, held. `hold` null means
   it stays in until something else takes the frame. */
export function zoomPunch(t, { t0, to = 1.5, inFor = 0.16, give = 0.06, giveFor = 0.4 }) {
  if (t < t0) return 1;
  const p = prog(t, t0, inFor, EASE.spring), g = prog(t, t0 + inFor, giveFor, EASE.ease);
  return lerp(1, to, p) - (to - 1) * give * g;
}
/* the shake: two incommensurate sines per axis, seeded, under an attack and a
   decay, so it is a hit and not a vibration, and the same every render. */
export function shake(t, { t0, amp = 10, dur = 0.35, freq = 26, seed = 1 }) {
  const u = t - t0;
  if (u < 0 || u > dur) return { x: 0, y: 0 };
  const env = Math.min(1, u / 0.02) * Math.exp(-5 * u / dur);
  const s1 = seed * 1.7, s2 = seed * 2.3;
  return {
    x: amp * env * (Math.sin(u * freq * 6.283 + s1) * 0.7 + Math.sin(u * freq * 1.618 * 6.283 + s2) * 0.3),
    y: amp * env * 0.8 * (Math.sin(u * freq * 1.31 * 6.283 + s2) * 0.7 + Math.sin(u * freq * 2.2 * 6.283 + s1) * 0.3),
  };
}
/* a whip: the offset runs on the io curve and the blur is its speed, so it
   peaks mid move and is gone at both ends. blur is an svg feGaussianBlur with
   no vertical deviation, which a css blur cannot do. */
export function whipPan(t, { t0, dur = 0.4, dist, blur = 42 }) {
  const p = prog(t, t0, dur, EASE.io), dt = 1 / 240;
  const v = (prog(t + dt, t0, dur, EASE.io) - prog(t - dt, t0, dur, EASE.io)) / (2 * dt) * dur;
  return { x: dist * p, blur: blur * clamp(v / 2) };
}
export function whipFilterMarkup(id) {
  return `<svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-20%" y="0" width="140%" height="100%" color-interpolation-filters="sRGB"><feGaussianBlur id="${id}-b" stdDeviation="0 0"/></filter></svg>`;
}
export function whipFilter(id, blur) { return { [id + '-b']: { attr: { stdDeviation: `${blur.toFixed(2)} 0` } } }; }

/* ---------- bar reveal ----------
   a solid bar grows across, and the text behind it is uncovered along the
   bar's trailing edge as it goes, then the bar retracts off the far end. the
   text sits in a wrapper that is `overflow:hidden`, moved by two opposite
   translates so nothing reflows. */
export function barMarkup(id, inner, w, h, fill) {
  return `<div id="${id}" style="position:relative;width:${w}px;height:${h}px">
  <div style="position:absolute;inset:0;overflow:hidden"><div id="${id}-m" style="position:absolute;inset:0;overflow:hidden;transform:translateX(-100%)"><div id="${id}-i" style="position:absolute;inset:0;transform:translateX(100%)">${inner}</div></div></div>
  <div id="${id}-bar" style="position:absolute;left:0;top:0;width:100%;height:100%;background:${fill};transform:scaleX(0);transform-origin:0 50%"></div></div>`;
}
export function barReveal(t, { id, w, t0, dur = 0.6 }) {
  const a = prog(t, t0, dur * 0.5, EASE.ease), b = prog(t, t0 + dur * 0.4, dur * 0.6, EASE.ease);
  return {
    [id + '-bar']: { style: t < t0 + dur * 0.4
      ? { transform: `scaleX(${a.toFixed(4)})`, transformOrigin: '0 50%' }
      : { transform: `scaleX(${(1 - b).toFixed(4)})`, transformOrigin: '100% 50%' } },
    [id + '-m']: { style: { transform: `translateX(${px((b - 1) * w)})` } },
    [id + '-i']: { style: { transform: `translateX(${px((1 - b) * w)})` } },
  };
}

/* ---------- mask reveal ----------
   each line in its own overflow hidden slot, rising from under its baseline,
   staggered. the wordmark's move. */
export function maskMarkup(id, lines, cls = '') {
  return lines.map((l, i) => `<div style="overflow:hidden;display:block"><div class="${cls}" id="${id}-${i}" style="transform:translateY(110%)">${l}</div></div>`).join('');
}
export function maskReveal(t, { id, n, t0, dur = 0.6, stagger = 0.09 }) {
  const out = {};
  for (let i = 0; i < n; i++) {
    const p = prog(t, t0 + i * stagger, dur, EASE.ease);
    out[id + '-' + i] = { style: { transform: `translateY(${((1 - p) * 110).toFixed(2)}%)` } };
  }
  return out;
}

/* ---------- the page half ----------
   serialised with .toString(). it writes and it decides nothing. */
export function motionApply(patch) {
  for (const id in patch) {
    const el = document.getElementById(id);
    if (!el) continue;
    const e = patch[id];
    if (e.style) for (const k in e.style) el.style[k] = e.style[k];
    if (e.attr) for (const k in e.attr) el.setAttribute(k, e.attr[k]);
  }
}
