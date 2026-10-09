/* lab 4, a free pick: the blueprint. a style none of the others has: line
   work on drafting paper, numbers that are true. the mascot is constructed
   from his own spec in lib/mascot.mjs: a compass swings the plate, dimension
   lines measure it (the 60 unit plate, the 13 by 4.4 eyes, 21 apart), then
   ink floods it. the paper tilts away into 3d, and he stands up off his own
   drawing, an extruded disc on a hinge, and looks at you. a red stamp slams. */
import { mascot, FPS } from './kit.mjs';
import { HEAD } from '../../lib/mascot.mjs';

const C = { paper: '#0e3c8f', paper2: '#0a2f72', line: '#eaf2ff', cyan: '#7fd8ff', face: '#f4f7ff', eye: '#0e3c8f', side: '#9fb4dc', red: '#ff4b3e' };
const S = 560, u = S / 64, CX = 540, CY = 820;
const R = HEAD.plate.s / 2 * u;
const EW = HEAD.eye.w * u, EH = HEAD.eye.h * u, EDX = HEAD.eye.sep / 2 * u, EY = CY + (HEAD.eye.cy - 32) * u;
const F = { center: [0, 22], compass: [14, 62], dia: [56, 84], eyes: [72, 104], fill: [106, 130], tilt: [140, 196], stand: [158, 204], scan: [188, 214], stamp: 234, glance: [238, 250], blink: 268 };
const rr = (x, y, w, h, r) => `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const eyeRect = s => rr(CX + s * EDX - EW / 2, EY - EH / 2, EW, EH, EH / 2);
const arrow = (x, y, dir) => `M${x},${y} l${-18 * dir},-9 l0,18 Z`;

export default {
  fonts: [['IBM Plex Mono', 'plexmono.woff2', 500], ['Archivo Black', 'archivo-black.woff2', 400]],
  css: `
#stage{background:${C.paper2}}
#cam{position:absolute;inset:0;perspective:2200px;perspective-origin:540px 760px}
#paper{position:absolute;left:-200px;top:-200px;width:1480px;height:2320px;transform-style:preserve-3d;transform-origin:740px ${CY + 200 + R}px;
  background-color:${C.paper};
  background-image:linear-gradient(rgba(255,255,255,.16) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.16) 2px,transparent 2px),
  linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
  background-size:140px 140px,140px 140px,28px 28px,28px 28px;background-position:${(200 + CX) % 140}px ${(200 + CY) % 140}px}
#draw{position:absolute;left:200px;top:200px;width:1080px;height:1920px;overflow:visible}
#hinge{position:absolute;left:${200 + CX - S / 2}px;top:${200 + CY - S / 2}px;width:${S}px;height:${S}px;transform-style:preserve-3d;transform-origin:50% ${(62 / 64 * 100).toFixed(2)}%}
.lbl{font-family:"IBM Plex Mono";font-weight:500;letter-spacing:2px}
#tblock{position:absolute;left:600px;top:1500px;width:400px;border:3px solid ${C.line};font:500 22px "IBM Plex Mono";color:${C.line};letter-spacing:2px}
#tblock div{display:flex;justify-content:space-between;padding:10px 16px;border-top:2px solid rgba(234,242,255,.5)}
#tblock div:first-child{border-top:0;font-size:26px}
#stamp{position:absolute;left:0;top:0;padding:16px 30px;border:8px solid ${C.red};border-radius:10px;color:${C.red};font:400 76px "Archivo Black";letter-spacing:2px;white-space:nowrap;mix-blend-mode:screen}
#scan{position:absolute;left:0;top:0;width:1080px;height:4px;background:${C.cyan};box-shadow:0 0 24px 6px rgba(127,216,255,.55)}
.hud{position:absolute;font:500 22px "IBM Plex Mono";letter-spacing:.14em;white-space:nowrap;color:${C.line}}
`,
  html: `
<div id="cam"><div id="paper">
  <svg id="draw" width="1080" height="1920">
    <g fill="none" stroke="${C.line}" stroke-width="3">
      <line id="clh" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY}" stroke-dasharray="26 12 6 12" stroke-opacity=".6"/>
      <line id="clv" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY}" stroke-dasharray="26 12 6 12" stroke-opacity=".6"/>
      <circle id="fillC" cx="${CX}" cy="${CY}" r="${R}" fill="${C.face}" stroke="none"/>
      <path id="eyeF0" d="${eyeRect(-1)}" fill="${C.eye}" stroke="none"/><path id="eyeF1" d="${eyeRect(1)}" fill="${C.eye}" stroke="none"/>
      <path id="circ" d="M${CX},${CY - R} A${R},${R} 0 1 1 ${CX - 0.01},${CY - R}" pathLength="1" stroke-dasharray="1 1" stroke-width="5"/>
      <line id="arm" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R}" stroke="${C.cyan}" stroke-width="4"/>
      <circle id="pen" cx="${CX}" cy="${CY - R}" r="9" fill="${C.cyan}" stroke="none"/>
      <path id="eye0" d="${eyeRect(-1)}" pathLength="1" stroke-dasharray="1 1" stroke-width="4"/>
      <path id="eye1" d="${eyeRect(1)}" pathLength="1" stroke-dasharray="1 1" stroke-width="4"/>
      <g id="dimD" stroke="${C.cyan}">
        <line x1="${CX - R}" y1="${CY + 20}" x2="${CX - R}" y2="${CY + R + 120}" stroke-opacity=".7"/>
        <line x1="${CX + R}" y1="${CY + 20}" x2="${CX + R}" y2="${CY + R + 120}" stroke-opacity=".7"/>
        <line id="dimL" x1="${CX - R}" y1="${CY + R + 96}" x2="${CX + R}" y2="${CY + R + 96}"/>
        <path d="${arrow(CX - R, CY + R + 96, -1)}" fill="${C.cyan}"/><path d="${arrow(CX + R, CY + R + 96, 1)}" fill="${C.cyan}"/>
      </g>
      <g id="dimE" stroke="${C.cyan}">
        <line x1="${CX - EDX}" y1="${EY - EH / 2 - 16}" x2="${CX - EDX}" y2="${EY - EH / 2 - 92}" stroke-opacity=".7"/>
        <line x1="${CX + EDX}" y1="${EY - EH / 2 - 16}" x2="${CX + EDX}" y2="${EY - EH / 2 - 92}" stroke-opacity=".7"/>
        <line x1="${CX - EDX}" y1="${EY - EH / 2 - 76}" x2="${CX + EDX}" y2="${EY - EH / 2 - 76}"/>
        <path d="${arrow(CX - EDX, EY - EH / 2 - 76, -1)}" fill="${C.cyan}"/><path d="${arrow(CX + EDX, EY - EH / 2 - 76, 1)}" fill="${C.cyan}"/>
        <line x1="${CX - EDX - EW / 2}" y1="${EY + EH / 2 + 14}" x2="${CX - R - 70}" y2="${EY + 150}" stroke-opacity=".8"/>
        <line x1="${CX - R - 70}" y1="${EY + 150}" x2="${CX - R - 230}" y2="${EY + 150}" stroke-opacity=".8"/>
      </g>
    </g>
    <text id="tR" class="lbl" x="${CX + 24}" y="${CY - R / 2}" font-size="30" fill="${C.cyan}">R 30.0</text>
    <text id="tD" class="lbl" x="${CX}" y="${CY + R + 80}" font-size="34" fill="${C.line}" text-anchor="middle">PLATE 60.0</text>
    <text id="tS" class="lbl" x="${CX}" y="${EY - EH / 2 - 92}" font-size="26" fill="${C.line}" text-anchor="middle">SEP 21.0</text>
    <text id="tE" class="lbl" x="${CX - R - 230}" y="${EY + 140}" font-size="26" fill="${C.line}">EYE 13.0 x 4.4</text>
    <text id="tC" class="lbl" x="${CX + R + 20}" y="${CY + 10}" font-size="24" fill="${C.line}" fill-opacity=".8">CL</text>
  </svg>
  <div id="hinge">${mascot('hero', S, { face: C.face, eye: C.eye, side: C.side, layers: 16, depth: 3 })}</div>
</div></div>
<div id="scan"></div><div id="scanT" class="hud" style="color:#7fd8ff"></div>
<div id="stamp">BUILT TO SPEC</div>
<div id="tblock"><div><span>THE BORING TEK</span></div><div><span>DWG</span><span>TBT 04</span></div><div><span>PART</span><span>MASCOT</span></div><div><span>UNIT</span><span>GRID 64</span></div><div><span>SCALE</span><span>1 : 1</span></div></div>
<div class="hud" style="left:60px;top:60px">LAB 04  BLUEPRINT</div>
<div class="hud" style="left:640px;top:60px;width:380px;text-align:right" id="tcx">00:00:00:00</div>
`,
  js: `
const C = ${JSON.stringify(C)}, F = ${JSON.stringify(F)};
const CX = ${CX}, CY = ${CY}, R = ${R}, S = ${S};
const st = $('stamp'), stw = st.offsetWidth, sth = st.offsetHeight;
const rows = [...document.querySelectorAll('#tblock div')];
function paint(f) {
  $('tcx').textContent = tc(Math.round(f));
  /* ---- construction: centre lines, the compass, the measures ---- */
  const cl = prog(f, F.center[0], F.center[1], E.out);
  const lh = 400 * cl, lv = 470 * cl;
  for (const [id, a, b] of [['clh', 'x', lh], ['clv', 'y', lv]]) {
    const el = $(id); el.setAttribute(a + '1', (a === 'x' ? CX : CY) - b); el.setAttribute(a + '2', (a === 'x' ? CX : CY) + b);
  }
  const cp = prog(f, F.compass[0], F.compass[1], E.inOut);
  $('circ').style.strokeDashoffset = (1 - cp).toFixed(4);
  const ang = -Math.PI / 2 + 2 * Math.PI * cp;
  const px = CX + R * Math.cos(ang), py = CY + R * Math.sin(ang);
  for (const [k, v] of [['x2', px], ['y2', py]]) $('arm').setAttribute(k, v.toFixed(1));
  $('pen').setAttribute('cx', px.toFixed(1)); $('pen').setAttribute('cy', py.toFixed(1));
  const armO = f >= F.compass[0] ? 1 - prog(f, F.compass[1], F.compass[1] + 10, E.smooth) : 0;
  O('arm', armO); O('pen', armO);
  O('tR', prog(f, F.compass[1] - 6, F.compass[1] + 4, E.linear) * (1 - prog(f, F.tilt[0], F.tilt[0] + 20, E.smooth)));
  const dp = prog(f, F.dia[0], F.dia[1], E.out);
  O('dimD', dp); T('dimD', 'translateY(' + (30 * (1 - dp)).toFixed(1) + 'px)');
  $('tD').textContent = 'PLATE ' + (60 * prog(f, F.dia[0], F.dia[1] - 4, E.out)).toFixed(1);
  O('tD', dp); O('tC', cl);
  for (let i = 0; i < 2; i++) $('eye' + i).style.strokeDashoffset = (1 - prog(f, F.eyes[0] + 8 * i, F.eyes[0] + 8 * i + 18, E.inOut)).toFixed(4);
  const ep = prog(f, F.eyes[0] + 14, F.eyes[1], E.out);
  O('dimE', ep); O('tS', ep); O('tE', prog(f, F.eyes[0] + 22, F.eyes[1] + 6, E.linear));
  /* ---- ink floods the plate from the bottom, then the eyes ---- */
  const fp = prog(f, F.fill[0], F.fill[1], E.inOut);
  $('fillC').style.clipPath = 'inset(' + (100 * (1 - fp)).toFixed(2) + '% 0 0 0)';
  const ef = prog(f, F.fill[1] - 6, F.fill[1] + 4, E.out);
  O('eyeF0', ef); O('eyeF1', ef);
  /* ---- the camera: the paper tilts away and rolls, a slow push ---- */
  const tp = prog(f, F.tilt[0], F.tilt[1], E.cam);
  const tilt = 54 * tp;
  const roll = -9 * tp + 4 * prog(f, F.tilt[1], 300, E.smooth);
  const k = lmix(1, 0.86, tp) * lmix(1, 1.05, prog(f, F.tilt[1], 300, E.dolly)) * (1 + 0.02 * hitPulse(f - F.stamp, 2, 6));
  T('paper', 'translateY(' + (-120 * tp).toFixed(1) + 'px) rotateZ(' + roll.toFixed(3) + 'deg) rotateX(' + tilt.toFixed(3) + 'deg) scale(' + k.toFixed(4) + ')');
  /* the drawing stays as his blueprint once he stands: the fill thins to a ghost */
  O('fillC', 1 - 0.82 * prog(f, F.stand[0], F.stand[0] + 20, E.smooth));
  for (const id of ['eyeF0', 'eyeF1']) if (f > F.stand[0]) O(id, ef * (1 - 0.82 * prog(f, F.stand[0], F.stand[0] + 20, E.smooth)));
  /* ---- he stands up off the paper on a hinge at his base ---- */
  const sp = M.springFn(SPR.land)(Math.max(0, f - F.stand[0]) / 60);
  const up = f >= F.stand[0] ? sp : 0;
  T('hinge', 'rotateX(' + (-(tilt) * up - 0 * (1 - up)).toFixed(3) + 'deg) translateZ(' + (2 * up).toFixed(1) + 'px)');
  const land = F.stand[0] + M.delayTo(SPR.land, 1);
  const q = hitPulse(f - land, 1, 5);
  let eye = 1 - 0.5 * q;
  if (f >= F.blink && f < F.blink + 12) eye = f < F.blink + 4 ? 1 - (f - F.blink) / 4 : (f - F.blink - 4) / 8;
  const glance = 2.4 * S / 64 * (prog(f, F.glance[0], F.glance[1], E.smooth) - prog(f, F.blink + 12, F.blink + 26, E.smooth));
  rig('hero', { x: 0, y: 0, sx: 1 + 0.08 * q, sy: 1 - 0.1 * q, origin: '50% 97%', ry: -32 * up + 30 * prog(f, F.stand[0] + 30, 300, E.smooth), eye, ex: glance });
  O('hero', f >= F.stand[0] ? 1 : 0);
  /* ---- a scan line passes down him, and reports ---- */
  const scp = prog(f, F.scan[0], F.scan[1], E.smooth);
  T('scan', 'translateY(' + mix(380, 1060, scp).toFixed(1) + 'px)');
  O('scan', f >= F.scan[0] && f <= F.scan[1] ? Math.sin(Math.PI * scp) : 0);
  const msg = 'SCAN OK  0.0 MM OFF SPEC';
  $('scanT').textContent = msg.slice(0, Math.round(clamp((f - F.scan[1] + 4) / 16) * msg.length));
  T('scanT', 'translate(250px,1190px)'); O('scanT', f < F.stamp + 30 ? 1 : 1 - prog(f, F.stamp + 30, F.stamp + 40, E.smooth));
  /* ---- title block types on, the stamp slams ---- */
  rows.forEach((r, i) => O(r, prog(f, 4 + 6 * i, 12 + 6 * i, E.linear)));
  O('tblock', 1);
  const sp2 = prog(f, F.stamp - 1, F.stamp + 9, E.in);
  const ss = lmix(2.4, 1, sp2) * (1 + 0.05 * hitPulse(f - F.stamp - 9, 1, 4));
  T('stamp', 'translate(' + (540 - stw / 2) + 'px,' + 1290 + 'px) rotate(-8deg) scale(' + ss.toFixed(4) + ')');
  O('stamp', f >= F.stamp - 1 ? 0.15 + 0.85 * sp2 : 0);
}
`,
  cues: [
    { t: 0.0, kind: 'tick' },
    { t: F.compass[0] / FPS, kind: 'sweep', opts: { len: 0.8 } },
    { t: F.compass[1] / FPS, kind: 'click' },
    ...[0, 1, 2].map(i => ({ t: (F.dia[0] + 6 * i) / FPS, kind: 'tock' })),
    { t: (F.eyes[0] + 18) / FPS, kind: 'tap' },
    { t: (F.eyes[0] + 26) / FPS, kind: 'tap' },
    { t: (F.fill[0] + 4) / FPS, kind: 'riser', opts: { len: 0.4 } },
    { t: (F.fill[1] - 2) / FPS, kind: 'toggle' },
    { t: (F.tilt[0] + 6) / FPS, kind: 'whoosh', opts: { len: 0.4 } },
    { t: (F.stand[0] + 4) / FPS, kind: 'whooshUp' },
    { t: (F.stand[0] + 12) / FPS, kind: 'land' },
    { t: F.glance[0] / FPS, kind: 'tock' },
    { t: F.scan[0] / FPS, kind: 'sweep', opts: { len: 0.55 } },
    { t: F.scan[1] / FPS, kind: 'ding' },
    { t: (F.stamp + 9) / FPS, kind: 'crunch' },
    { t: (F.stamp + 9) / FPS, kind: 'bass', opts: { len: 0.8 } },
    { t: F.blink / FPS, kind: 'tock' },
  ],
  gains: { tick: -24, tock: -22, sweep: -20, whoosh: -24 },
};
