/* lab 3. bright pop showreel. yellow stage with turning sun rays and halftone
   corners, two tilted marquee bands scrolling against each other, a huge 01
   that rolls like an odometer from 00 through 99 and clicks home on 01, and
   the mascot, in a comic outline with a hard pink shadow, jumps in from the
   bottom with a full flip, lands on the counter, squashes it, and hops. */
import { mascot, FPS } from './kit.mjs';

const C = { bg: '#ffd60a', ray: '#ffc300', ink: '#111111', pink: '#ff3d8b', white: '#ffffff', blue: '#2e5bff' };
const F = { pop: 0, roll: [10, 72], jump: 86, land: 128, hop1: [140, 156], hop2: [160, 170], sticker: 180, star: 206, hop3: [242, 262], blink: 272 };
const S = 300, CY = 900;

/* the counter value: 0 to 101 (shown mod 100), easing into the last digit */
const rollV = f => { const p = Math.min(1, Math.max(0, (f - F.roll[0]) / (F.roll[1] - F.roll[0]))); return 101 * (1 - Math.pow(1 - p, 3)); };
const tensTicks = [];
for (let f = F.roll[0]; f < F.roll[1]; f++) if (Math.floor(rollV(f + 1) / 10) !== Math.floor(rollV(f) / 10)) tensTicks.push(f + 1);

const star = (n, r1, r2) => Array.from({ length: n * 2 }, (_, i) => { const a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1; return (r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1); }).join(' ');
const BAND1 = 'THE BORING TEK  ●  MOTION LAB 03  ●  '.repeat(4);
const BAND2 = 'POP  ●  SHOWREEL  ●  BOUNCE  ●  '.repeat(5);

export default {
  fonts: [['Bricolage Grotesque', 'bricolage-800.woff2', 800], ['JetBrains Mono', 'jbmono.woff2', 500]],
  css: `
#stage{background:${C.bg}}
#rays{position:absolute;left:${540 - 1600}px;top:${CY - 40 - 1600}px;width:3200px;height:3200px;border-radius:50%;
  background:repeating-conic-gradient(from 0deg,${C.ray} 0deg 7.5deg,${C.bg} 7.5deg 15deg)}
.half{position:absolute;inset:0;background-image:radial-gradient(circle,COL 0 34%,transparent 37%);background-size:30px 30px}
#h1{-webkit-mask-image:radial-gradient(70% 45% at 0% 0%,#000 0%,transparent 100%);mask-image:radial-gradient(70% 45% at 0% 0%,#000 0%,transparent 100%)}
#h2{-webkit-mask-image:radial-gradient(70% 45% at 100% 100%,#000 0%,transparent 100%);mask-image:radial-gradient(70% 45% at 100% 100%,#000 0%,transparent 100%)}
#world{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px ${CY}px}
.band{position:absolute;left:-200px;width:1500px;height:118px;overflow:hidden;display:flex;align-items:center}
.band .run{white-space:nowrap;font:800 64px "Bricolage Grotesque";letter-spacing:.01em;line-height:1}
#b1{top:230px;background:${C.ink};transform:rotate(-7deg)}
#b1 .run{color:${C.bg}}
#b2{top:1480px;background:${C.pink};transform:rotate(5deg);border-top:6px solid ${C.ink};border-bottom:6px solid ${C.ink}}
#b2 .run{color:${C.ink}}
#counter{position:absolute;left:0;top:0;width:1080px;height:1920px}
#cnt{position:absolute;left:0;top:0;display:flex;font:800 640px "Bricolage Grotesque";line-height:1;color:${C.ink};letter-spacing:-.04em}
.col{position:relative;overflow:hidden;height:1em;width:.62em}
.strip{position:absolute;left:0;top:0;width:100%;text-align:center}
.strip div{height:1em}
#cshadow{position:absolute;left:0;top:0;display:flex;font:800 640px "Bricolage Grotesque";line-height:1;color:${C.pink};letter-spacing:-.04em}
#no{position:absolute;left:0;top:0;width:150px;height:150px;border-radius:50%;background:${C.blue};color:${C.white};font:800 54px "Bricolage Grotesque";display:flex;align-items:center;justify-content:center;border:6px solid ${C.ink};box-sizing:border-box}
#sticker{position:absolute;left:0;top:0;padding:18px 38px;background:${C.white};border:6px solid ${C.ink};border-radius:60px;font:800 58px "Bricolage Grotesque";color:${C.ink};white-space:nowrap;box-shadow:12px 12px 0 ${C.ink}}
#starw{position:absolute;left:0;top:0}
#mshadow{position:absolute;left:0;top:0;border-radius:50%;background:${C.pink}}
.hud{position:absolute;font:500 22px "JetBrains Mono";letter-spacing:.14em;white-space:nowrap;color:${C.ink}}
`.replace('COL', C.ink),
  html: `
<div id="rays"></div>
<div class="half" id="h1" style="background-image:radial-gradient(circle,${C.pink} 0 34%,transparent 37%)"></div>
<div class="half" id="h2" style="background-image:radial-gradient(circle,${C.ink} 0 34%,transparent 37%)"></div>
<div id="world">
  <svg id="starw" width="1080" height="1920" style="overflow:visible"><g id="star"><polygon points="${star(16, 470, 380)}" fill="${C.pink}" stroke="${C.ink}" stroke-width="8"/></g></svg>
  <div id="counter">
    <div id="cshadow"><div class="col"><div class="strip" id="ss0"></div></div><div class="col"><div class="strip" id="ss1"></div></div></div>
    <div id="cnt"><div class="col"><div class="strip" id="s0"></div></div><div class="col"><div class="strip" id="s1"></div></div></div>
  </div>
  <div id="no">NO.</div>
  <div id="sticker">THE BORING TEK</div>
  <div id="mshadow"></div>
  ${mascot('hero', S, { face: C.white, eye: C.ink, side: C.ink, layers: 8, depth: 2.4, stroke: `border:8px solid ${C.ink}` })}
</div>
<div class="band" id="b1"><div class="run" id="r1">${BAND1}</div></div>
<div class="band" id="b2"><div class="run" id="r2">${BAND2}</div></div>
<div class="hud" style="left:60px;top:60px">LAB 03</div>
<div class="hud" style="left:640px;top:60px;width:380px;text-align:right">POP SHOWREEL</div>
<div class="hud" style="left:60px;top:1840px" id="tcx">00:00:00:00</div>
`,
  js: `
const C = ${JSON.stringify(C)}, F = ${JSON.stringify(F)}, S = ${S}, CY = ${CY};
const rollV = ${rollV.toString()};
/* odometer strips: 0 to 9 then 0 again, so the wrap is seamless */
for (const id of ['s0', 's1', 'ss0', 'ss1']) $(id).innerHTML = [0,1,2,3,4,5,6,7,8,9,0].map(d => '<div>' + d + '</div>').join('');
const cnt = $('cnt'), cw = cnt.offsetWidth, ch = cnt.offsetHeight;
const cx = 540 - cw / 2, cy = CY - ch / 2;
/* where the ink of the digits actually starts: Bricolage sits low in its box */
const capTop = cy + ch * 0.17;
$('no').style.left = (cx - 40) + 'px'; $('no').style.top = (cy + 10) + 'px';
const stk = $('sticker'), sw = stk.offsetWidth;
const plate = S * 60 / 64;
function paint(f) {
  /* ---- stage: rays turn, the bands run against each other ---- */
  const spin = 0.12 * f + 18 * prog(f, F.roll[1], F.roll[1] + 30, E.out) + 14 * prog(f, F.hop3[0], F.hop3[0] + 30, E.out);
  T('rays', 'rotate(' + spin.toFixed(3) + 'deg)');
  T('r1', 'translateX(' + (-(f * 4.2) % 1000 - 200).toFixed(1) + 'px)');
  T('r2', 'translateX(' + ((f * 3.6) % 1000 - 1100).toFixed(1) + 'px)');
  $('tcx').textContent = tc(Math.round(f));
  /* ---- camera: punches on the two landings, a slow push ---- */
  const k = lmix(1, 1.05, prog(f, 0, 300, E.dolly)) * (1 + 0.035 * hitPulse(f - F.roll[1], 2, 6)) * (1 + 0.025 * hitPulse(f - F.land, 2, 6));
  const jy = 10 * hitPulse(f - F.land, 1, 4);
  T('world', 'translate(0px,' + jy.toFixed(2) + 'px) scale(' + k.toFixed(5) + ')');

  /* ---- the counter: pops in, rolls 00 to 99 and clicks home on 01 ---- */
  const pop = springAt(SPR.pop, f, F.pop - 3);
  const v = rollV(f) + (f > F.roll[1] ? 0.18 * Math.exp(-(f - F.roll[1]) / 6) * Math.sin((f - F.roll[1]) / 2.2) : 0);
  const ones = ((v % 10) + 10) % 10;
  /* the tens wheel only turns while the ones wheel goes 9 to 0 */
  const tens = Math.floor(v / 10) % 10 + Math.max(0, ones - 9);
  const vel = Math.abs(rollV(f + 0.5) - rollV(f - 0.5));
  const pos = d => (-(d % 10) / 11 * 100).toFixed(3) + '%';
  T('s1', 'translateY(' + (-(ones) * (100 / 11)).toFixed(3) + '%)'); T('ss1', 'translateY(' + (-(ones) * (100 / 11)).toFixed(3) + '%)');
  T('s0', 'translateY(' + (-((tens % 10)) * (100 / 11)).toFixed(3) + '%)'); T('ss0', 'translateY(' + (-((tens % 10)) * (100 / 11)).toFixed(3) + '%)');
  const bl = Math.min(10, vel * 2.4);
  $('s1').style.filter = bl > 0.75 ? 'blur(' + bl.toFixed(1) + 'px)' : 'none';
  /* the mascot lands on it: the digits squash from the base */
  const csq = hitPulse(f - F.land, 1, 5);
  const cs = pop * (1 + 0.04 * hitPulse(f - F.roll[1], 1, 5));
  for (const id of ['cnt', 'cshadow']) { $(id).style.transformOrigin = '50% 100%'; }
  T('cnt', 'translate(' + cx + 'px,' + cy + 'px) scale(' + (cs * (1 + 0.06 * csq)).toFixed(4) + ',' + (cs * (1 - 0.09 * csq)).toFixed(4) + ')');
  T('cshadow', 'translate(' + (cx + 22) + 'px,' + (cy + 22) + 'px) scale(' + (cs * (1 + 0.06 * csq)).toFixed(4) + ',' + (cs * (1 - 0.09 * csq)).toFixed(4) + ')');
  const np = springAt(SPR.pop, f, F.roll[1] - 2);
  T('no', 'rotate(' + (-14 + 14 * (1 - np)).toFixed(2) + 'deg) scale(' + np.toFixed(4) + ')');

  /* ---- the mascot: jump with a full flip, land on the 01, hop twice ---- */
  const LX = 540 - S / 2, LY = capTop - S * 62 / 64 + 4;
  let x = LX, y = LY, rz = 0, sx = 1, sy = 1, eye = 1, ry = 0, on = f >= F.jump;
  if (f < F.land) {
    const q = clamp((f - F.jump) / (F.land - F.jump));
    x = mix(-140, LX, q); y = mix(1900, LY, q) - 1150 * 4 * q * (1 - q) * 0.62;
    rz = -360 * E.inOut(q);
    const vy = (mix(1900, LY, q + 0.01) - 713 * 4 * (q + 0.01) * (0.99 - q)) - y;
    sy = 1 + 0.12 * Math.min(1, Math.abs(vy) / 30); sx = 2 - sy;
  } else {
    const hop = (a, b, h) => { const s = (f - a) / (b - a); return s > 0 && s < 1 ? h * 4 * s * (1 - s) : 0; };
    y = LY - hop(F.hop1[0], F.hop1[1], 90) - hop(F.hop2[0], F.hop2[1], 34) - hop(F.hop3[0], F.hop3[1], 160);
    const q = 0.5 * hitPulse(f - F.land, 1, 5) + 0.3 * hitPulse(f - F.hop1[1], 1, 5) + 0.18 * hitPulse(f - F.hop2[1], 1, 5) + 0.4 * hitPulse(f - F.hop3[1], 1, 5);
    sx = 1 + 0.3 * q; sy = 1 - 0.34 * q;
    eye = f < F.land + 30 ? 0.35 : 1;
    ry = 28 * Math.sin(Math.PI * clamp((f - F.hop3[0]) / (F.hop3[1] - F.hop3[0])));
    rz = -360 * prog(f, F.hop3[0], F.hop3[1], E.inOut) * 0;
    if (f >= F.blink && f < F.blink + 12) eye = f < F.blink + 4 ? 1 - (f - F.blink) / 4 : (f - F.blink - 4) / 8;
  }
  rig('hero', { x, y, sx, sy, rz, ry, eye, origin: '50% 97%' });
  O('hero', on ? 1 : 0);
  /* the hard shadow follows, offset down and right, flattened by the squash */
  const ms = $('mshadow'); ms.style.width = ms.style.height = plate + 'px';
  T(ms, 'translate(' + (x + (S - plate) / 2 + 18).toFixed(1) + 'px,' + (y + (S - plate) / 2 + 18).toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')');
  ms.style.transformOrigin = '50% 100%'; O(ms, on ? 1 : 0);

  /* ---- the sticker and the star burst ---- */
  const sp = springAt(SPR.pop, f, F.sticker);
  T('sticker', 'translate(' + (540 - sw / 2) + 'px,' + (cy + ch * 0.98) + 'px) rotate(' + (-6 - 20 * (1 - sp)).toFixed(2) + 'deg) scale(' + sp.toFixed(4) + ')');
  const st = springAt(SPR.snap, f, F.star);
  T('star', 'translate(540px,' + (CY + 30) + 'px) rotate(' + (f * 0.4 + 30 * (1 - st)).toFixed(2) + 'deg) scale(' + st.toFixed(4) + ')');
}
`,
  cues: [
    { t: 0.02, kind: 'bwop' },
    ...tensTicks.map(f => ({ t: f / FPS, kind: 'tock' })),
    { t: F.roll[1] / FPS, kind: 'coin' },
    { t: F.roll[1] / FPS, kind: 'chime' },
    { t: (F.jump + 4) / FPS, kind: 'whooshUp' },
    { t: (F.jump + 18) / FPS, kind: 'spin' },
    { t: F.land / FPS, kind: 'land' },
    { t: F.land / FPS, kind: 'bass', opts: { len: 0.6 } },
    { t: (F.land + 4) / FPS, kind: 'sparkle' },
    { t: F.hop1[1] / FPS, kind: 'bounce' },
    { t: F.hop2[1] / FPS, kind: 'bounce', opts: { f0: 230, f1: 130 } },
    { t: F.sticker / FPS, kind: 'bwop', opts: { step: 2 } },
    { t: F.star / FPS, kind: 'boing' },
    { t: F.hop3[0] / FPS, kind: 'whooshUp', opts: { len: 0.24 } },
    { t: F.hop3[1] / FPS, kind: 'land' },
    { t: F.blink / FPS, kind: 'tock' },
  ],
  gains: { tock: -24, spin: -20 },
};
