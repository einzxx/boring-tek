/* lab 1. bounce and zoom, after reference A's language.
   the mascot is the ball: onion skin ghosts, squash on contact anchored at the
   ground, stretch with vertical speed, a full roll across four bounces, a
   dotted trail of its own path, contact labels on leader lines, a hud frame.
   then anticipation, a crash zoom into his face on E.in, and a match cut on
   the frame where his eyes land in the title card: they slide into the
   underline under BOUNCE, and the underline blinks. */
import { mascot, mascotGeo, FPS } from './kit.mjs';

const C = { bg: '#0c0c0e', ball: '#ff4a1c', side: '#a8300f', eye: '#111111', line: '#e9e6df', blue: '#3a4bff', ink: '#111111' };
const S = 270, G = mascotGeo(S);
const GROUND = 1180, PB = 62 / 64 * S;      /* plate bottom inside the box */
const YC = GROUND - PB;                      /* box y at contact */
const CON = [34, 70, 100, 124, 142];         /* contact frames */
const H = [560, 330, 170, 70];               /* arc heights between contacts */
const ZOOM = [168, 198], CUT = 199, K = 8;
const LABELS = ['CONTACT', 'SQUASH', 'STRETCH', 'DECAY', 'REST'];
const WORD = 'BOUNCE';

export default {
  fonts: [['Archivo Black', 'archivo-black.woff2', 400], ['JetBrains Mono', 'jbmono.woff2', 500]],
  css: `
#stage{background:${C.bg}}
#bgv{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 55%,#17171b 0%,${C.bg} 70%)}
#world{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0}
#ground{position:absolute;left:90px;top:${GROUND}px;width:900px;height:2px;background:${C.line};transform-origin:50% 50%}
#trail{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible}
.ghost{position:absolute;left:0;top:0;width:${G.plate}px;height:${G.plate}px;border-radius:50%;border:3px solid ${C.ball};box-sizing:border-box}
#shadow{position:absolute;left:0;top:${GROUND - 14}px;width:200px;height:28px;border-radius:50%;background:rgba(255,74,28,.22)}
.mark{position:absolute;left:0;top:${GROUND}px}
.mark i{position:absolute;left:-6px;top:-6px;width:12px;height:12px;border-radius:50%;background:${C.line}}
.mark b{position:absolute;left:0;top:6px;width:2px;height:100px;background:${C.line};opacity:.6;transform-origin:0 0}
.mark span{position:absolute;left:10px;top:0;font:500 20px "JetBrains Mono";letter-spacing:.12em;color:${C.line};white-space:pre}
#card{position:absolute;inset:0;background:${C.ball};opacity:0}
.bar{position:absolute;left:0;top:0;background:${C.eye};transform-origin:0 0}
#word{position:absolute;left:0;top:600px;width:1080px;text-align:center;font-family:"Archivo Black";color:${C.ink};white-space:nowrap;line-height:1}
#word .lw{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .01em .08em}
#word .l{display:inline-block}
#sel{position:absolute;left:0;top:0;border:3px solid ${C.blue};box-sizing:border-box}
#sel i{position:absolute;width:16px;height:16px;background:#fff;border:3px solid ${C.blue};box-sizing:border-box}
#selTag{position:absolute;left:50%;bottom:-54px;transform:translateX(-50%);background:${C.blue};color:#fff;font:500 20px "JetBrains Mono";letter-spacing:.1em;padding:6px 14px;white-space:nowrap}
.hud{position:absolute;font:500 22px "JetBrains Mono";letter-spacing:.14em;white-space:nowrap}
.br{position:absolute;width:64px;height:64px;border-color:currentColor;border-style:solid;border-width:0}
#rec{display:inline-block;width:14px;height:14px;border-radius:50%;background:${C.ball};margin-right:12px;vertical-align:1px}
#prog{position:absolute;left:96px;top:1796px;width:888px;height:3px}
#progIn{position:absolute;inset:0;transform-origin:0 50%}
`,
  html: `
<div id="bgv"></div>
<div id="card"></div>
<div id="world">
  <svg id="trail"></svg>
  <div id="ground"></div>
  ${CON.map((c, i) => `<div class="mark" id="mk${i}"><i></i><b></b><span id="mkt${i}"></span></div>`).join('')}
  <div id="shadow"></div>
  ${[1, 2, 3, 4].map(k => `<div class="ghost" id="gh${k}"></div>`).join('')}
  ${mascot('hero', S, { face: C.ball, eye: C.eye, side: C.side, layers: 10, depth: 2.2 })}
</div>
<div id="cardW" class="abs" style="width:1080px;height:1920px;transform-origin:540px 900px"><div class="bar" id="bar0"></div><div class="bar" id="bar1"></div>
<div id="word"><span id="wordIn" style="display:inline-block">${[...WORD].map((ch, i) => `<span class="lw"><span class="l" id="l${i}">${ch}</span></span>`).join('')}</span></div>
<svg id="graph" class="abs" width="1080" height="1920" style="overflow:visible;top:-230px"><g stroke="#111" stroke-opacity=".25" stroke-width="2"><line x1="130" y1="1600" x2="950" y2="1600"/><line x1="130" y1="1260" x2="130" y2="1600"/></g>${CON.map(c => `<line x1="${(130 + 820 * c / CON[4]).toFixed(1)}" y1="1590" x2="${(130 + 820 * c / CON[4]).toFixed(1)}" y2="1612" stroke="#111" stroke-width="3"/>`).join('')}<polyline id="gpath" fill="none" stroke="#111" stroke-width="5" stroke-linejoin="round" points="0,0"/><circle id="gdot" r="12" fill="#3a4bff" stroke="#fff" stroke-width="4"/><text x="130" y="1240" font-family="JetBrains Mono" font-size="22" letter-spacing="3" fill="#111">HEIGHT OVER TIME</text><text x="950" y="1650" text-anchor="end" font-family="JetBrains Mono" font-size="22" letter-spacing="3" fill="#111">5 CONTACTS   DECAY 0.59</text></svg>
<div id="sel"><i style="left:-10px;top:-10px"></i><i style="right:-10px;top:-10px"></i><i style="left:-10px;bottom:-10px"></i><i style="right:-10px;bottom:-10px"></i><i style="left:calc(50% - 8px);top:-10px"></i><i style="left:calc(50% - 8px);bottom:-10px"></i><div id="selTag">TYPE  01  ARCHIVO BLACK</div></div></div>
<div id="hudL" class="hud">
  <div class="br" style="left:36px;top:36px;border-left-width:3px;border-top-width:3px"></div>
  <div class="br" style="left:980px;top:36px;border-right-width:3px;border-top-width:3px"></div>
  <div class="br" style="left:36px;top:1820px;border-left-width:3px;border-bottom-width:3px"></div>
  <div class="br" style="left:980px;top:1820px;border-right-width:3px;border-bottom-width:3px"></div>
  <div class="hud" style="left:120px;top:58px">THE BORING TEK  /  MOTION LAB</div>
  <div class="hud" style="left:640px;top:58px;width:320px;text-align:right">60 FPS  1080x1920</div>
  <div class="hud" style="left:120px;top:1836px"><span id="rec"></span><span id="tc">00:00:00:00</span></div>
  <div class="hud" style="left:560px;top:1836px;width:400px;text-align:right" id="phase">01  BOUNCE</div>
  <div id="prog"><div id="progIn"></div></div>
</div>
`,
  js: `
const C = ${JSON.stringify(C)}, CON = ${JSON.stringify(CON)}, H = ${JSON.stringify(H)}, LABELS = ${JSON.stringify(LABELS)};
const S = ${S}, G = ${JSON.stringify(G)}, YC = ${YC}, GROUND = ${GROUND}, ZOOM = ${JSON.stringify(ZOOM)}, CUT = ${CUT}, K = ${K};
const PC = S / 2;                      /* plate centre inside the box */
/* the path: a fall with its apex before frame 0, then four arcs */
function ballY(f) {
  if (f < CON[0]) { const a = -10, q = (f - a) / (CON[0] - a); return YC - 1300 * (1 - q * q); }
  for (let i = 0; i < 4; i++) if (f < CON[i + 1]) { const s = (f - CON[i]) / (CON[i + 1] - CON[i]); return YC - H[i] * 4 * s * (1 - s); }
  return YC;
}
const ballX = f => mix(10, 405, clamp(f / CON[4]));
/* the dotted trail, every third frame of the path */
const svg = $('trail'); const dots = [];
for (let f = 0; f <= CON[4]; f += 3) {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', (ballX(f) + PC).toFixed(1)); c.setAttribute('cy', (ballY(f) + PC).toFixed(1));
  c.setAttribute('r', 3.2); c.setAttribute('fill', C.line); svg.appendChild(c); dots.push({ c, f });
}
/* the title card's word, fitted to 820px */
const word = $('word'); word.style.fontSize = '200px';
const wi = $('wordIn');
const fs = 200 * 820 / wi.offsetWidth; word.style.fontSize = fs.toFixed(1) + 'px';
const wr = { x: (1080 - wi.offsetWidth) / 2, y: 600, w: wi.offsetWidth, h: wi.offsetHeight };
/* the graph: his real height over time, the same function that moved him */
const gp = []; for (let g = 0; g <= CON[4]; g += 1) gp.push((130 + 820 * g / CON[4]).toFixed(1) + ',' + (1600 - Math.min(1300, YC - ballY(g)) * 0.24).toFixed(1));
$('gpath').setAttribute('points', gp.join(' '));
const glen = $('gpath').getTotalLength();
$('gpath').style.strokeDasharray = glen; 
const UL = { y: wr.y + wr.h + 6, h: 22 };
/* the eye bars at the cut: the zoomed eyes, face centre on (540, 760) */
const EB = [-1, 1].map(s => ({ x: 540 + s * G.eyeDX * K - G.eyeW * K / 2, y: 600 + G.eyeDY * K - G.eyeH * K / 2, w: G.eyeW * K, h: G.eyeH * K }));
const ULB = [{ x: wr.x, y: UL.y, w: wr.w / 2 - 12, h: UL.h }, { x: wr.x + wr.w / 2 + 12, y: UL.y, w: wr.w / 2 - 12, h: UL.h }];

function paint(f) {
  const pre = f < CUT;
  /* ---- hud: brackets, timecode, rec dot, progress ---- */
  const ink = pre ? C.line : C.ink;
  $('hudL').style.color = ink; $('progIn').style.background = ink;
  T('progIn', 'scaleX(' + (f / 300).toFixed(4) + ')');
  $('tc').textContent = tc(Math.round(f));
  O('rec', Math.floor(f / 30) % 2 ? 0.25 : 1);
  $('phase').textContent = f < 150 ? '01  BOUNCE' : f < CUT ? '02  ZOOM' : '03  TYPE';
  O('hudL', prog(f, 0, 10, E.linear));
  T('ground', 'scaleX(' + prog(f, 0, 22, E.out).toFixed(4) + ')');

  /* ---- the ball ---- */
  const bx = ballX(f), by = ballY(f);
  const vy = ballY(f + 0.5) - ballY(f - 0.5);
  const air = f < CON[4] ? clamp(Math.abs(vy) / 34) : 0;
  let sq = 0;
  CON.forEach((c, i) => { sq += [1, .8, .62, .42, .26][i] * hitPulse(f - c, 1, 5); });
  /* anticipation before the zoom: a slow squash, released by the zoom */
  const ant = prog(f, 146, 166, E.smooth) * (1 - prog(f, ZOOM[0], ZOOM[0] + 6, E.out));
  const sy = (1 + 0.24 * air) * (1 - 0.42 * sq) * (1 - 0.16 * ant);
  const sx = (1 - 0.14 * air) * (1 + 0.32 * sq) * (1 + 0.12 * ant);
  const roll = 360 * M.bez(.25, .5, .3, 1)(clamp(f / CON[4]));
  const squint = clamp(sq * 1.4) * 0.6 + 0.35 * ant;
  rig('hero', { x: bx, y: by, sx, sy, origin: '50% ' + (62 / 64 * 100).toFixed(2) + '%', rz: roll, eye: 1 - squint,
    ex: 4 * G.u * (1 - prog(f, CON[3], CON[4] + 10, E.smooth)) });
  /* onion skins: where the ball was 3, 6, 9 and 12 frames ago, only while fast */
  for (let k = 1; k <= 4; k++) {
    const g = f - 3 * k, sp = clamp(Math.abs(ballY(g + 1) - ballY(g)) / 26) * (f < CON[4] + 4 ? 1 : 0);
    T('gh' + k, 'translate(' + (ballX(g) + (S - G.plate) / 2).toFixed(1) + 'px,' + (ballY(g) + (S - G.plate) / 2).toFixed(1) + 'px)');
    O('gh' + k, [.55, .38, .24, .12][k - 1] * sp * (g > 0 ? 1 : 0));
  }
  for (const d of dots) d.c.setAttribute('opacity', f >= d.f ? 0.5 : 0);
  /* contact shadow tightens as he lands */
  const hgt = clamp((YC - by) / 600);
  T('shadow', 'translate(' + (bx + PC - 100).toFixed(1) + 'px,0px) scale(' + (1.15 - 0.7 * hgt).toFixed(3) + ',1)');
  O('shadow', 1 - 0.75 * hgt);
  /* contact marks: a dot, a leader line drawing down, a typed label */
  CON.forEach((c, i) => {
    const on = f >= c; const p = prog(f, c, c + 10, E.out);
    T('mk' + i, 'translate(' + (ballX(c) + PC).toFixed(1) + 'px,0px)');
    O('mk' + i, on ? 1 : 0);
    const L = 60 + 70 * i;
    $('mk' + i).querySelector('b').style.transform = 'scaleY(' + (p * L / 100).toFixed(3) + ')';
    $('mkt' + i).style.top = (L - 6) + 'px';
    const n = Math.round(clamp((f - c - 6) / 14) * LABELS[i].length);
    $('mkt' + i).textContent = LABELS[i].slice(0, n);
  });

  /* ---- camera: still, then a crash zoom into his face on E.in ---- */
  const zp = prog(f, ZOOM[0], ZOOM[1], E.in);
  const k = lmix(1, K, zp);
  const ax = 430 + PC, ay = YC + PC;                   /* his resting face centre */
  const sxs = mix(ax, 540, zp), sys = mix(ay, 600, zp);
  T('world', 'translate(' + sxs.toFixed(2) + 'px,' + sys.toFixed(2) + 'px) scale(' + k.toFixed(4) + ') translate(' + (-ax) + 'px,' + (-ay) + 'px)');
  O('world', pre ? 1 : 0); O('bgv', pre ? 1 : 0);
  const fade = 1 - prog(f, ZOOM[0], ZOOM[0] + 10, E.smooth);
  for (const id of ['ground', 'shadow', 'trail', 'mk0', 'mk1', 'mk2', 'mk3', 'mk4']) if (f >= ZOOM[0]) O(id, fade);

  /* ---- after the cut: the face is the card, the eyes become the underline ---- */
  O('card', pre ? 0 : 1);
  const mp = prog(f, CUT + 6, CUT + 26, E.inOut);
  const blink = f >= 270 && f < 282 ? (f < 274 ? (f - 270) / 4 : 1 - (f - 274) / 8) : 0;
  EB.forEach((e, i) => {
    const t = ULB[i];
    const x = mix(e.x, t.x, mp), y = mix(e.y, t.y, mp), w = mix(e.w, t.w, mp), h = mix(e.h, t.h, mp) * (1 - 0.88 * blink);
    const b = $('bar' + i);
    b.style.width = w.toFixed(2) + 'px'; b.style.height = h.toFixed(2) + 'px'; b.style.borderRadius = (Math.min(w, h) / 2).toFixed(1) + 'px';
    T(b, 'translate(' + x.toFixed(2) + 'px,' + (y + (mix(e.h, t.h, mp) - h) / 2).toFixed(2) + 'px)');
    O(b, pre ? 0 : 1);
  });
  /* the letters rise out of their own line, 4 frames apart */
  for (let i = 0; i < 6; i++) {
    const s = CUT + 22 + 4 * i, p = prog(f, s, s + 14, E.out);
    T('l' + i, 'translate(0px,' + (110 * (1 - M.arrive(p))).toFixed(2) + '%) rotate(' + (8 * (1 - p)).toFixed(2) + 'deg)');
    O('l' + i, f >= s ? 1 : 0);
  }
  /* the selection box snaps on */
  const sp2 = prog(f, 246, 256, E.out), sel = $('sel');
  sel.style.left = (wr.x - 26) + 'px'; sel.style.top = (wr.y - 18) + 'px';
  sel.style.width = (wr.w + 52) + 'px'; sel.style.height = (UL.y + UL.h - wr.y + 40) + 'px';
  T(sel, 'scale(' + mix(1.08, 1, sp2).toFixed(4) + ')'); O(sel, f >= 246 ? 1 : 0);
  /* a slow push on the card so the hold is alive */
  const cardK = lmix(1, 1.05, prog(f, CUT, 300, E.dolly)) * (1 + 0.02 * hitPulse(f - (CUT + 46), 2, 5));
  T('cardW', 'scale(' + cardK.toFixed(5) + ')');
  const gq = prog(f, CUT + 40, CUT + 84, E.smooth);
  $('gpath').style.strokeDashoffset = (glen * (1 - gq)).toFixed(1);
  O('graph', prog(f, CUT + 34, CUT + 42, E.linear));
  const gf = Math.min(CON[4], gq * CON[4]);
  const gpt = $('gpath').getPointAtLength(glen * gq);
  T('gdot', 'translate(' + gpt.x.toFixed(1) + 'px,' + gpt.y.toFixed(1) + 'px)');
}
`,
  cues: [
    { t: 0, kind: 'tick' },
    ...CON.slice(0, 4).map((c, i) => ({ t: c / FPS, kind: 'bounce', opts: { f0: 210 - 18 * i, f1: 110 - 8 * i } })),
    { t: CON[4] / FPS, kind: 'land' },
    { t: (ZOOM[1] - 14) / FPS - 0.12, kind: 'whooshUp' },
    { t: CUT / FPS, kind: 'bass', opts: { len: 1.0 } },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ t: (CUT + 22 + 4 * i + 6) / FPS, kind: 'tap' })),
    { t: 246 / FPS, kind: 'click' },
    { t: 270 / FPS, kind: 'tock' },
  ],
  gains: { tick: -24, tock: -18 },
};
