/* lab 2. bold kinetic type on hot orange, after reference B.
   CUT slams in already moving on frame 0, gets slashed and splits along the
   cut. the mascot pops between words with a 3d spin. ZOOM flies in from
   depth letter by letter; its two O's flip over and swap into two small
   mascots who look at each other and blink, then the word zooms through the
   lens. black bands flip the frame dark, and GLOW lights up letter by letter
   like a tube warming, glitches once into slices, and the mascot lands on top. */
import { mascot, FPS } from './kit.mjs';

const C = { bg: '#ff4d00', edge: '#d63600', ink: '#000000', cream: '#fff1e2', side: '#3a3a3a', dark: '#0b0b0b' };
const F = { cut: 4, slash: 24, split: 32, out: 46, pop1: 50, pop1out: 78, zoom: 84, flip: 112, through: 156, pop2: 166, bands: 188, glow: 204, lit: 238, glitch: 250, perch: 262, blink: 284 };

export default {
  fonts: [['Archivo Wide', 'archivo-wide.woff2', 900], ['JetBrains Mono', 'jbmono.woff2', 500]],
  css: `
#stage{background:${C.bg}}
#vig{position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 46%,rgba(255,120,40,.35) 0%,rgba(0,0,0,0) 45%,rgba(120,20,0,.35) 100%)}
#dark{position:absolute;inset:0}
.band{position:absolute;left:0;width:1080px;background:${C.dark};transform-origin:100% 50%}
#world{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 900px}
.word{position:absolute;left:0;width:1080px;text-align:center;font-family:"Archivo Wide";font-weight:900;line-height:1;white-space:nowrap;color:${C.ink};letter-spacing:-.02em}
.word .in{display:inline-block;position:relative}
.ch{display:inline-block;position:relative}
#slash{position:absolute;left:-60px;width:1200px;height:10px;background:${C.cream};transform-origin:0 50%}
.oflip{display:inline-block;position:relative;transform-style:preserve-3d}
.oflip .mini{position:absolute;left:50%;top:50%}
.glowc{color:${C.bg};text-shadow:0 0 .06em rgba(255,140,60,.95),0 0 .2em rgba(255,77,0,.75),0 0 .5em rgba(255,77,0,.45)}
.slice{position:absolute;left:0;top:0;width:1080px;text-align:center}
.outb{position:absolute;left:0;font-family:"Archivo Wide";font-weight:900;font-size:230px;line-height:1;white-space:nowrap;color:transparent;-webkit-text-stroke:3px ${C.bg};opacity:0}
.hud{position:absolute;font:500 22px "JetBrains Mono";letter-spacing:.14em;white-space:nowrap}
.idx span{margin-left:22px;padding-bottom:6px;border-bottom:3px solid transparent}
.speed{position:absolute;left:0;height:4px;background:${C.ink}}
`,
  html: `
<div id="vig"></div>
<div id="dark">${[0, 1, 2, 3, 4, 5].map(i => `<div class="band" id="bd${i}" style="top:${i * 320}px;height:321px"></div>`).join('')}</div>
${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<div class="speed" id="sp${i}"></div>`).join('')}
<div class="outb" id="ob0" style="top:330px">GLOW GLOW GLOW GLOW GLOW</div><div class="outb" id="ob1" style="top:1330px">GLOW GLOW GLOW GLOW GLOW</div>
<div id="world">
  <div class="word" id="cutA"><span class="in">CUT</span></div>
  <div class="word" id="cutB"><span class="in">CUT</span></div>
  <div id="slash"></div>
  <div class="word" id="zoom"><span class="in" id="zoomIn"><span class="ch" id="z0">Z</span><span class="oflip" id="z1"><span class="ch" id="z1t">O</span><span class="mini" id="z1m"></span></span><span class="oflip" id="z2"><span class="ch" id="z2t">O</span><span class="mini" id="z2m"></span></span><span class="ch" id="z3">M</span></span></div>
  <div class="word" id="glow"><span class="in" id="glowIn">${[...'GLOW'].map((c, i) => `<span class="ch glowc" id="g${i}">${c}</span>`).join('')}</span></div>
  ${[0, 1, 2, 3].map(i => `<div class="word slice" id="sl${i}"><span class="in glowc">GLOW</span></div>`).join('')}
  ${mascot('hero', 420, { face: C.cream, eye: C.ink, side: C.side, layers: 14, depth: 2.6 })}
</div>
<div id="hudW">
  <div class="hud" style="left:60px;top:60px">THE BORING TEK</div>
  <div class="hud" style="left:640px;top:60px;width:380px;text-align:right">LAB 02  KINETIC</div>
  <div class="hud" style="left:60px;top:1830px" id="fc">F 000</div>
  <div class="hud idx" style="left:420px;top:1830px;width:600px;text-align:right"><span id="i0">CUT</span><span id="i1">ZOOM</span><span id="i2">GLOW</span></div>
</div>
`,
  js: `
const C = ${JSON.stringify(C)}, F = ${JSON.stringify(F)};
/* fit each word to the frame and centre it on the eye line */
function fit(id, w, top) { const el = $(id), inn = el.querySelector('.in'); el.style.fontSize = '200px'; const fs = 200 * w / inn.offsetWidth; el.style.fontSize = fs.toFixed(1) + 'px'; el.style.top = (top - inn.offsetHeight / 2).toFixed(1) + 'px'; return { fs, w: inn.offsetWidth, h: inn.offsetHeight, top: top - inn.offsetHeight / 2 }; }
const cw = fit('cutA', 900, 900); fit('cutB', 900, 900);
const zw = fit('zoom', 920, 900);
const gw = fit('glow', 900, 940);
for (let i = 0; i < 4; i++) fit('sl' + i, 900, 940);
/* the cut runs on a diagonal through the word */
const yL = cw.top + cw.h * 0.64, yR = cw.top + cw.h * 0.38;
const ang = Math.atan2(yR - yL, 1200) * 180 / Math.PI;
$('cutA').style.clipPath = 'polygon(0 0,100% 0,100% ' + (38) + '%,0 ' + (64) + '%)';
$('cutB').style.clipPath = 'polygon(0 ' + 64 + '%,100% ' + 38 + '%,100% 100%,0 100%)';
$('slash').style.top = (yL - 5) + 'px';
/* two small mascots inside the O's, sized to the cap height */
const oEl = $('z1t'); const mini = Math.round(oEl.offsetHeight * 0.86);
const miniHTML = id => ${JSON.stringify(mascot('MINI', 100, { face: C.cream, eye: C.ink, side: C.side, layers: 6, depth: 1.6 }))}.split('MINI').join(id);
$('z1m').innerHTML = miniHTML('ma'); $('z2m').innerHTML = miniHTML('mb');
for (const id of ['ma', 'mb']) { $(id).style.left = '-50px'; $(id).style.top = '-50px'; }
const MS = mini / 100;
/* seeded slice offsets for the glitch */
const slH = gw.h / 4;
for (let i = 0; i < 4; i++) $('sl' + i).style.clipPath = 'inset(' + (i * 25) + '% 0 ' + (75 - i * 25) + '% 0)';

function paint(f) {
  /* ---- the frame: orange, then black bands sweep in from the right ---- */
  for (let i = 0; i < 6; i++) T('bd' + i, 'scaleX(' + prog(f, F.bands + i * 2, F.bands + i * 2 + 10, E.out).toFixed(4) + ')');
  const darkOn = f >= F.bands + 10;
  const ink = f >= F.bands + 8 ? C.cream : C.ink;
  $('hudW').style.color = ink;
  $('fc').textContent = 'F ' + String(Math.round(f)).padStart(3, '0');
  const wi = f < F.pop1 ? 0 : f < F.bands ? 1 : 2;
  for (let i = 0; i < 3; i++) { $('i' + i).style.borderBottomColor = i === wi ? ink : 'transparent'; O('i' + i, i === wi ? 1 : 0.45); }
  /* speed lines on the two big whooshes */
  [[F.out, 12], [F.through, 14]].forEach(([s, d], w) => {});
  for (let i = 0; i < 8; i++) {
    const s = (i < 4 ? F.out : F.through) + (i % 4) * 1.5, p = prog(f, s, s + 12, E.linear);
    const y = 300 + rand('y' + i) * 1300, len = 300 + rand('l' + i) * 500;
    T('sp' + i, 'translate(' + mix(1100, -len - 100, p).toFixed(1) + 'px,' + y.toFixed(1) + 'px)');
    $('sp' + i).style.width = len.toFixed(0) + 'px'; O('sp' + i, p > 0 && p < 1 ? 1 : 0);
    $('sp' + i).style.background = ink;
  }

  /* ---- camera: hits jolt the world, a slow push under GLOW ---- */
  let jx = 0, jy = 0, kk = 1;
  [[F.cut + 6, 16, 0.03], [F.split, 10, 0.015], [F.zoom + 16, 12, 0.025], [F.lit, 14, 0.03], [F.glitch, 8, 0]].forEach(([c, a, z], i) => {
    const h = hitPulse(f - c, 1, 4); jx += a * h * (rand('jx' + i) - 0.5) * 2; jy += a * h; kk *= 1 + z * hitPulse(f - c, 2, 5);
  });
  kk *= lmix(1, 1.06, prog(f, F.glow, 300, E.dolly));
  T('world', 'translate(' + jx.toFixed(2) + 'px,' + jy.toFixed(2) + 'px) scale(' + kk.toFixed(5) + ')');

  /* ---- CUT: slams on frame 0 already moving, slashed, split, thrown out ---- */
  const cp = prog(f, F.cut - 6, F.cut + 12, E.outSoft);
  const cs = lmix(1.4, 1, cp), cb = blurIn(cp, 14);
  const sp = prog(f, F.split, F.split + 12, E.out), ot = prog(f, F.out, F.out + 10, E.in);
  const cutOn = f < F.out + 10;
  T('cutA', 'translate(' + (-50 * sp - 1300 * ot).toFixed(1) + 'px,' + (-34 * sp).toFixed(1) + 'px) rotate(' + (-3 * sp).toFixed(2) + 'deg) scale(' + cs.toFixed(4) + ')');
  T('cutB', 'translate(' + (50 * sp + 1300 * ot).toFixed(1) + 'px,' + (34 * sp).toFixed(1) + 'px) rotate(' + (3 * sp).toFixed(2) + 'deg) scale(' + cs.toFixed(4) + ')');
  for (const id of ['cutA', 'cutB']) { $(id).style.filter = cb ? 'blur(' + cb.toFixed(1) + 'px)' : 'none'; O(id, cutOn ? 1 : 0); }
  const sl = prog(f, F.slash, F.slash + 8, E.out), slo = 1 - prog(f, F.split + 2, F.split + 12, E.smooth);
  T('slash', 'rotate(' + ang.toFixed(2) + 'deg) scaleX(' + sl.toFixed(4) + ')'); O('slash', f >= F.slash ? slo : 0);

  /* ---- the mascot: pop with a 3d spin, then land, then perch on GLOW ---- */
  let mo = { x: 330, y: 750, s: 0, ry: 0, eye: 1, sx: 1, sy: 1 };
  if (f >= F.pop1 && f < F.pop1out + 10) {
    const s = springAt(SPR.pop, f, F.pop1) * (1 - prog(f, F.pop1out, F.pop1out + 8, E.in));
    mo = { x: 330, y: 750, s, ry: 360 * prog(f, F.pop1 + 6, F.pop1 + 28, E.inOut), eye: 1 - 0.6 * hitPulse(f - F.pop1 - 30, 2, 8) };
  } else if (f >= F.pop2 && f < F.bands + 16) {
    const p = springAt(SPR.land, f, F.pop2);
    const land = F.pop2 + M.delayTo(SPR.land, 1);
    const q = hitPulse(f - land, 1, 5);
    mo = { x: 330, y: mix(1700, 760, p), s: 1 - prog(f, F.bands + 6, F.bands + 14, E.in), sx: 1 + 0.25 * q, sy: 1 - 0.3 * q, eye: 1 - 0.6 * q, ry: 0 };
  } else if (f >= F.perch) {
    const p = springAt(SPR.snap, f, F.perch);
    const top = gw.top + 0.1 * gw.h - 418;
    mo = { x: 330, y: mix(top + 160, top, p), s: p, ry: mix(-40, -10, p) + 6 * Math.sin((f - F.perch) / 18), eye: 1, ex: 0 };
    if (f >= F.blink && f < F.blink + 12) mo.eye = f < F.blink + 4 ? 1 - (f - F.blink) / 4 : (f - F.blink - 4) / 8;
  }
  rig('hero', { ...mo, origin: '50% 96%' });
  $('hero-face').style.boxShadow = f >= F.perch ? 'inset 0 -40px 60px rgba(255,77,0,' + (0.5 * prog(f, F.perch, F.perch + 20, E.smooth)).toFixed(3) + ')' : 'none';
  for (let i = 0; i < 2; i++) { T('ob' + i, 'translateX(' + ((i ? -1 : 1) * (f - 200) * 2.2 - 600).toFixed(1) + 'px)'); O('ob' + i, 0.32 * prog(f, F.glow, F.glow + 20, E.smooth)); }
  O('hero', mo.s > 0.001 ? 1 : 0);

  /* ---- ZOOM: letters fly in from deep, the O's flip into mascots, then zoom through ---- */
  const zOn = f >= F.zoom && f < F.through + 12;
  O('zoom', zOn ? 1 : 0);
  const thr = prog(f, F.through, F.through + 12, E.in);
  T('zoomIn', 'scale(' + lmix(1, 9, thr).toFixed(4) + ')');
  $('zoomIn').style.transformOrigin = '50% 50%';
  ['z0', 'z1', 'z2', 'z3'].forEach((id, i) => {
    const s = F.zoom + 3 * i, p = prog(f, s, s + 16, E.out);
    const flip = id === 'z1' || id === 'z2';
    const fp = flip ? prog(f, F.flip + (i - 1) * 3, F.flip + (i - 1) * 3 + 14, E.inOut) : 0;
    T(id, 'translateY(' + (-260 * (1 - p) * (i % 2 ? 1 : -1)).toFixed(1) + 'px) scale(' + lmix(5, 1, p).toFixed(4) + ') rotateY(' + (180 * fp).toFixed(2) + 'deg)');
    $(id).style.filter = blurIn(p, 18) ? 'blur(' + blurIn(p, 18).toFixed(1) + 'px)' : 'none';
    O(id, f >= s ? prog(f, s, s + 4, E.linear) : 0);
    if (flip) {
      const back = fp >= 0.5;
      O(id + 't', back ? 0 : 1); O(id + 'm', back ? 1 : 0);
      const m = id === 'z1' ? 'ma' : 'mb';
      /* the mini is drawn mirrored on the back of the flip, so unmirror it */
      const look = 2.2 * (prog(f, 130, 140, E.smooth) - prog(f, 146, 152, E.smooth)) * (id === 'z1' ? 1 : -1);
      const bl = f >= 140 && f < 150 ? (f < 143 ? 1 - (f - 140) / 3 : (f - 143) / 7) : 1;
      T(id + 'm', 'scaleX(-1)');
      rig(m, { x: 0, y: 0, s: MS, ry: 0, ex: -look * MS * 1.56, eye: bl });
    }
  });

  /* ---- GLOW: each letter warms up like a tube, then one glitch into slices ---- */
  const pat = [[0, 1, 0, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 0, 1, 1], [1, 0, 0, 1, 0, 1, 1, 1], [0, 1, 1, 0, 0, 1, 0, 1]];
  const gOn = f >= F.glow;
  O('glow', gOn ? 1 : 0);
  for (let i = 0; i < 4; i++) {
    const s = F.glow + i * 7, k = Math.floor((f - s) / 3);
    let v = f < s ? 0 : k >= 8 ? 1 : pat[i][k] ? 0.95 : 0.12;
    if (f >= F.lit) v = 1;
    O('g' + i, v);
  }
  const gl = f >= F.glitch && f < F.glitch + 9;
  O('glowIn', gl ? 0.15 : 1);
  for (let i = 0; i < 4; i++) {
    const fr = Math.floor(f);
    const dx = gl ? (rand('gx' + i + '_' + Math.floor(fr / 2)) - 0.5) * 140 : 0;
    T('sl' + i, 'translateX(' + dx.toFixed(1) + 'px)'); O('sl' + i, gl ? 1 : 0);
  }
  /* the glow breathes once lit */
  const br = f >= F.lit ? 1 + 0.08 * Math.sin((f - F.lit) / 9) + 0.6 * hitPulse(f - F.lit, 2, 10) : 1;
  $('glowIn').style.filter = 'brightness(' + br.toFixed(3) + ')';
}
`,
  cues: [
    { t: (F.cut + 6) / FPS, kind: 'bass', opts: { len: 0.7 } },
    { t: (F.cut + 6) / FPS, kind: 'land' },
    { t: F.slash / FPS, kind: 'whooshUp', opts: { len: 0.2 } },
    { t: F.split / FPS, kind: 'crunch' },
    { t: (F.out - 4) / FPS, kind: 'whoosh' },
    { t: F.pop1 / FPS, kind: 'boing' },
    { t: (F.pop1 + 12) / FPS, kind: 'spin' },
    { t: F.pop1out / FPS, kind: 'bubble' },
    ...[0, 1, 2, 3].map(i => ({ t: (F.zoom + 3 * i + 8) / FPS, kind: 'tap' })),
    { t: (F.zoom + 16) / FPS, kind: 'bass', opts: { len: 0.6 } },
    { t: (F.flip + 7) / FPS, kind: 'toggle' },
    { t: (F.flip + 10) / FPS, kind: 'toggle' },
    { t: 140 / FPS, kind: 'tick' },
    { t: (F.through - 6) / FPS, kind: 'whooshUp' },
    { t: F.pop2 / FPS, kind: 'whooshUp', opts: { len: 0.2 } },
    { t: (F.pop2 + 14) / FPS, kind: 'land' },
    { t: F.bands / FPS, kind: 'sweep', opts: { len: 0.4 } },
    ...[0, 1, 2, 3].map(i => ({ t: (F.glow + i * 7 + 3) / FPS, kind: 'tick' })),
    { t: F.lit / FPS, kind: 'zap' },
    { t: F.lit / FPS, kind: 'bass', opts: { len: 0.9 } },
    { t: F.glitch / FPS, kind: 'glitch' },
    { t: F.perch / FPS, kind: 'bubble' },
    { t: F.blink / FPS, kind: 'tock' },
  ],
  gains: { tick: -22, tock: -18, crunch: -18, spin: -18, sweep: -22 },
};
