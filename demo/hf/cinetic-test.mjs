/* cinetic test 1. writes cinetic-test/, a 4s 1080x1920 dark card built with
   the cinetic skill's techniques on hyperframes, renders it with one worker
   and puts the mp4 in demo/out/cinetic-test-1080x1920.mp4.

   one story device: a key light. it hits the mascot first (he turns in 3d
   through it, an extruded disc, le-mark-glint-turn), then crosses the name
   (ty-front-restyle-sweep). between them BORING slams in (ty-kinetic-word-slams)
   with scaled depth echoes (ty-scaled-echo-extrusion) and a camera kick
   (cam-impact-kick), the name assembles round it, and the frame keeps a living
   push (cam-living-hold, le-living-hold) over a dot grid at 0.3x parallax.

   everything is a pure function of the frame: one paused gsap timeline with
   one driver tween whose onUpdate paints frame f. cinetic's motion.js supplies
   the grid, eases, springs and pulses.

   research only. nothing here is loaded by the site or by any post file.
   usage: node hf/cinetic-test.mjs [--stills] [--no-render] */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { HEAD, EYE_CX, GRID } from '../lib/mascot.mjs';
import { renderList, master } from '../lib/sfx.mjs';

const here = new URL('.', import.meta.url);
const P = new URL('cinetic-test/', here);
const OUT = fileURLToPath(new URL('../out/cinetic-test-1080x1920.mp4', here));
const require = createRequire(new URL('../package.json', here));
const FFMPEG = require('ffmpeg-static');
mkdirSync(new URL('fonts/', P), { recursive: true });
copyFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', here), new URL('gsap.min.js', P));
copyFileSync(new URL('project/fonts/Michroma.woff2', here), new URL('fonts/Michroma.woff2', P));
/* cinetic's hyperframes motion kit, MIT, with the frame size set to ours */
const kit = readFileSync(join(homedir(), '.claude/skills/cinetic/assets/hyperframes-starter/motion.js'), 'utf8')
  .replace('const W = 1920;', 'const W = 1080;').replace('const H = 1080;', 'const H = 1920;');
writeFileSync(new URL('motion.js', P), kit);

/* dark tokens, copied from index.html, not invented */
const C = { bg: '#06070a', fg: '#d5dbd8', sub: '#c8c8c8', muted: '#6d7680', face: '#f4f7f5', eye: '#06070a', accent: '#35ff6a' };

/* ---------- the grid: 120 bpm at 60fps, a beat is 30 frames ---------- */
const FPS = 60, TOTAL = 240;
const CUE = {
  turn: [0, 54],      /* mascot turns face on, E.outSoft */
  light: [10, 40],    /* the key light front crosses his face, E.smooth */
  look: [40, 54],     /* eyes drop to where the word will land */
  slam: 59,           /* BORING, one frame before beat 2 */
  shrink: [96, 114], /* BORING into the lockup, E.inOut */
  lock: 120,          /* THE and TEK lock in, beat 4 */
  sweep: [134, 170],  /* the light crosses the name, E.dolly */
  url: 150,
  glance: [168, 184],
  blink: 204,
};

/* the mascot, from lib/mascot.mjs geometry: a 300px box on the 64 unit grid */
const MS = 300, u = MS / GRID, pl = HEAD.plate, E_ = HEAD.eye;
const plate = { x: pl.x * u, y: pl.y * u, s: pl.s * u };
const eyes = EYE_CX.map((cx, i) =>
  `<div class="eye" id="eye${i}" style="left:${((cx - E_.w / 2) * u - plate.x).toFixed(2)}px;top:${((E_.cy - E_.h / 2) * u - plate.y).toFixed(2)}px;width:${(E_.w * u).toFixed(2)}px;height:${(E_.h * u).toFixed(2)}px"></div>`).join('');
const LAYERS = 14, DEPTH = 2.4;
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
/* the extrusion: the face colour walked toward the stage, a step per layer */
const disc = Array.from({ length: LAYERS }, (_, i) =>
  `<div class="slab" style="transform:translateZ(${(-(i + 1) * DEPTH).toFixed(1)}px);background:${mix(C.face, C.bg, 0.48 + 0.3 * (i / LAYERS))}"></div>`).reverse().join('');

const WORD = ['THE', 'BORING', 'TEK'];
const glyphs = (w, cls = 'g') => [...w].map(ch => `<span class="${cls}">${ch}</span>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080, height=1920">
<title>cinetic test 1</title>
<script src="gsap.min.js"></script>
<script src="motion.js"></script>
<style>
@font-face{font-family:"Michroma";src:url("fonts/Michroma.woff2") format("woff2");font-weight:400;font-display:block}
html,body{margin:0;background:${C.bg};width:1080px;height:1920px;overflow:hidden}
#root{position:relative;width:100%;height:100%;overflow:hidden}
.clip{position:absolute;inset:0}
#stage{background:${C.bg}}
#grid{position:absolute;left:-10%;top:-10%;width:120%;height:120%;transform-origin:50% 46.9%;
  background-image:radial-gradient(circle,rgba(213,219,216,.085) 1.5px,transparent 1.9px);background-size:40px 40px}
#world{position:absolute;inset:0;transform-origin:540px 900px}
#mwrap{position:absolute;left:${540 - MS / 2}px;top:${730 - MS / 2}px;width:${MS}px;height:${MS}px;perspective:1100px}
#mlift{position:absolute;inset:0}
#head{position:absolute;left:${plate.x}px;top:${plate.y}px;width:${plate.s}px;height:${plate.s}px;transform-style:preserve-3d}
.slab,#face{position:absolute;inset:0;border-radius:50%}
#face{background:${C.face};overflow:hidden;transform:translateZ(0)}
.eye{position:absolute;background:${C.eye};border-radius:${(E_.h * u / 2).toFixed(2)}px}
#shade{position:absolute;inset:-2px;background:${C.bg}}
#lock{position:absolute;left:0;top:1086px;width:1080px;display:flex;justify-content:center;align-items:baseline;gap:0;
  font-family:"Michroma";white-space:nowrap;line-height:1.2}
.w{display:inline-block;position:relative}
#wTHE{margin-right:.42em}#wTEK{margin-left:.42em}
.g{display:inline-block;color:${C.muted}}
.echo{position:absolute;left:0;top:0;white-space:nowrap;color:${mix(C.fg, C.bg, 0.5)}}
#url{position:absolute;left:0;top:1206px;width:1080px;text-align:center;overflow:hidden;height:48px}
#urlIn{display:inline-block;font-family:ui-monospace,Consolas,monospace;font-size:30px;letter-spacing:.08em;color:${C.sub}}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL / FPS}" data-fps="${FPS}" data-width="1080" data-height="1920">
  <div id="stage" class="clip" data-start="0" data-duration="${TOTAL / FPS}" data-track-index="0">
    <div id="grid"></div>
    <div id="world">
      <div id="mwrap"><div id="mlift"><div id="head">${disc}<div id="face">${eyes}<div id="shade" data-layout-allow-overflow></div></div></div></div></div>
      <div id="lock" data-layout-allow-overflow data-layout-allow-occlusion>
        <div class="w" id="wTHE">${glyphs('THE')}</div>
        <div class="w" id="wBOR"><div class="echo" id="e3" data-layout-allow-overlap>BORING</div><div class="echo" id="e2" data-layout-allow-overlap>BORING</div><div class="echo" id="e1" data-layout-allow-overlap>BORING</div><span id="bor">${glyphs('BORING')}</span></div>
        <div class="w" id="wTEK">${glyphs('TEK')}</div>
      </div>
      <div id="url" data-layout-allow-overflow><span id="urlIn">theboringtek.com</span></div>
    </div>
  </div>
</div>
<script>
(function () {
  const M = window.MOTION, { E, prog, tw, mix, lmix, hitPulse, clamp } = M;
  const C = ${JSON.stringify(C)}, CUE = ${JSON.stringify(CUE)}, u = ${u};
  const $ = id => document.getElementById(id);
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb = (a, b, t) => { const x = hex(a), y = hex(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')'; };
  /* blur only on entry, clear by 60% of the move, nothing under 0.75px */
  const blurIn = (p, max) => { const b = max * (1 - clamp(p / 0.6)); return b < 0.75 ? 0 : b; };

  function build() {
    const lock = $('lock');
    /* size the name to 740px, so a 6% push still leaves it inside the 120px margin */
    lock.style.fontSize = '100px';
    const k = 740 / lock.scrollWidth;
    lock.style.fontSize = (100 * k).toFixed(2) + 'px';
    for (const e of document.querySelectorAll('.echo')) e.style.fontSize = 'inherit';
    /* measured once, after the face loaded: BORING's centre, and every glyph's x for the light front */
    const wb = $('wBOR'), bx = wb.offsetLeft + wb.offsetWidth / 2;
    const DX = 540 - bx;                                   /* slam centred on the frame */
    const BIG = Math.min(2.0, 800 / wb.offsetWidth);        /* the slam size: 800px wide */
    const G = [...document.querySelectorAll('#lock .g')].map(g => {
      let x = g.offsetLeft + g.offsetWidth / 2, p = g.offsetParent;
      while (p && p !== lock) { x += p.offsetLeft; p = p.offsetParent; }
      return { g, x };
    });
    const x0 = G[0].x, x1 = G[G.length - 1].x, band = 2.2 * parseFloat(lock.style.fontSize);
const BW = wb.offsetWidth;
    const borG = G.filter(o => o.g.parentNode.id === 'bor');

    /* the impact frame: BORING at 90% of its fall to size */
    const SL = 22, impact = M.settleOf(CUE.slam, CUE.slam + SL, E.outSoft, 0.9);
    window.__cue = { impact, peakWhoosh: CUE.slam, lock: CUE.lock, BIG, DX };

    function paint(f) {
      /* ---- camera: a living push on E.dolly, a kick on the impact ---- */
      const camPush = lmix(1, 1.04, prog(f, 0, 240, E.dolly));
      const kick = 1 + 0.015 * hitPulse(f - impact, 2, 5);
      const jolt = 8 * hitPulse(f - impact, 1, 4);
      const k = camPush * kick;
      $('world').style.transform = 'translate(0px,' + jolt.toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
      /* the dot grid is far away: 0.3x of the camera */
      $('grid').style.transform = 'translate(0px,' + (jolt * 0.3).toFixed(2) + 'px) scale(' + Math.pow(k, 0.3).toFixed(5) + ')';

      /* ---- the mascot turns through the key light ---- */
      const t = prog(f, CUE.turn[0], CUE.turn[1], E.outSoft);
      const hold = prog(f, CUE.turn[1], 240, E.linear);
      const ry = mix(-34, -9, t) + 4 * hold, rx = mix(16, 5, t) - 2 * hold;
      const float = 4 * Math.sin(2 * Math.PI * f / 150);
      const flinch = -14 * hitPulse(f - impact, 2, 6);
      $('mlift').style.transform = 'translate(0px,' + (float + flinch).toFixed(2) + 'px)';
      $('head').style.transform = 'rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)';
      /* the light front: shade on the face is wiped left to right with a soft edge */
      const lp = prog(f, CUE.light[0], CUE.light[1], E.smooth);
      const fx = mix(-30, 130, lp);
      const sh = $('shade');
      sh.style.opacity = (0.62 * (1 - prog(f, CUE.light[1] - 6, CUE.light[1] + 10, E.smooth))).toFixed(3);
      const m = 'linear-gradient(100deg, transparent ' + (fx - 22).toFixed(1) + '%, #000 ' + (fx + 8).toFixed(1) + '%)';
      sh.style.webkitMaskImage = m; sh.style.maskImage = m;
      /* eyes: look down at the word, squint on the hit, glance, one blink */
      const down = 1.6 * u * (prog(f, CUE.look[0], CUE.look[1], E.smooth) - prog(f, 80, 96, E.smooth));
      const side = 2.2 * u * (prog(f, CUE.glance[0], CUE.glance[1], E.smooth) - prog(f, 214, 230, E.smooth));
      const squint = 0.55 * hitPulse(f - impact, 2, 7);
      const bl = f >= CUE.blink && f < CUE.blink + 12 ? (f < CUE.blink + 4 ? (f - CUE.blink) / 4 : 1 - (f - CUE.blink - 4) / 8) : 0;
      const sy = Math.max(0.1, 1 - squint - 0.9 * bl);
      for (const e of [$('eye0'), $('eye1')]) e.style.transform = 'translate(' + side.toFixed(2) + 'px,' + down.toFixed(2) + 'px) scaleY(' + sy.toFixed(3) + ')';

      /* ---- BORING slams: 1.35x down to BIG, blurred in, echoes collapsing ---- */
      const sp = prog(f, CUE.slam, CUE.slam + SL, E.outSoft);
      const on = f >= CUE.slam ? 1 : 0;
      const shr = prog(f, CUE.shrink[0], CUE.shrink[1], E.inOut);
      const drift = 1 + 0.012 * prog(f, CUE.slam + SL, CUE.shrink[0], E.linear);
      const sc = lmix(BIG * lmix(1.35, 1, sp) * drift, 1, shr);
      const lockPunch = 1 + 0.015 * hitPulse(f - CUE.lock, 1, 4);
      wb.style.transform = 'translate(' + (DX * (1 - shr)).toFixed(2) + 'px,0px) scale(' + (sc * lockPunch).toFixed(5) + ')';
      wb.style.opacity = (on * prog(f, CUE.slam, CUE.slam + 3, E.linear)).toFixed(3);
      const b = blurIn(sp, 12);
      wb.style.filter = b ? 'blur(' + b.toFixed(2) + 'px)' : 'none';
      const step = mix(0.03, 0.012, prog(f, CUE.slam - 2, CUE.slam + 20, E.out));
      const eo = 1 - prog(f, CUE.shrink[0], CUE.shrink[0] + 12, E.smooth);
      [0.55, 0.35, 0.2].forEach((o, i) => {
        const e = $('e' + (i + 1));
        e.style.transform = 'scale(' + (1 + step * (i + 1)).toFixed(4) + ')';
        e.style.opacity = (o * eo * on * (1 - prog(f, CUE.slam + 10, CUE.slam + 30, E.smooth))).toFixed(3);
      });
      /* the slam is bright, the lockup lands muted, and the light lights it */
      const dim = prog(f, CUE.shrink[0], CUE.shrink[1], E.smooth);
      /* THE and TEK lock in from the sides, the tracking closing */
      const sideP = prog(f, CUE.lock - 10, CUE.lock, E.out);
      const push = (sc - 1) * BW / 2;
      const so = prog(f, CUE.lock - 10, CUE.lock - 5, E.linear);
      $('wTHE').style.transform = 'translate(' + (-push - 70 * (1 - sideP)).toFixed(2) + 'px,0px) scale(' + lockPunch.toFixed(5) + ')';
      $('wTEK').style.transform = 'translate(' + (push + 70 * (1 - sideP)).toFixed(2) + 'px,0px) scale(' + lockPunch.toFixed(5) + ')';
      $('wTHE').style.opacity = $('wTEK').style.opacity = so.toFixed(3);
      /* the light front crosses the name: muted, accent at the front, fg behind it */
      const xf = mix(x0 - band, x1 + band, prog(f, CUE.sweep[0], CUE.sweep[1], E.dolly));
      for (const o of G) {
        const uu = clamp((xf - o.x) / band);
        let c = uu < 0.5 ? rgb(C.muted, C.accent, uu * 2) : rgb(C.accent, C.fg, (uu - 0.5) * 2);
        if (borG.includes(o) && f < CUE.sweep[0]) c = rgb(C.fg, C.muted, dim);
        o.g.style.color = c;
      }
      /* the url rises out of its own line */
      const up = M.arrive(prog(f, CUE.url, CUE.url + 14, E.out));
      $('urlIn').style.transform = 'translate(0px,' + (48 * (1 - up)).toFixed(2) + 'px)';
      $('urlIn').style.opacity = prog(f, CUE.url, CUE.url + 4, E.linear).toFixed(3);
    }

    const clock = { f: 0 };
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(clock, { f: 0 }, { f: ${TOTAL}, duration: ${TOTAL / FPS}, ease: 'none', onUpdate: () => paint(clock.f) }, 0);
    paint(0);
    window.__paint = paint;
    window.__timelines['main'] = tl;
  }
  document.fonts.load('400 100px "Michroma"').then(build);
})();
</script>
</body>
</html>
`;
writeFileSync(new URL('index.html', P), html);
console.log('wrote cinetic-test/index.html');

/* ---------- sound, from lib/sfx.mjs, cues from the same frame numbers ----------
   four events in four seconds: the light (sweep, from frame 0, so the clip
   opens with intent), the whoosh with its apex on the slam's fastest frame,
   the bass on the impact, the click on the lock. a short silence sits before
   the whoosh. */
const impactF = 59 + 6; /* settleOf(59, 81, outSoft, 0.9), checked against window.__cue below */
const cues = [
  { t: 0.0, kind: 'sweep', opts: { len: 0.8 } },
  { t: 59 / FPS - 0.11, kind: 'whoosh', opts: { len: 0.22 } },
  { t: impactF / FPS, kind: 'bass', opts: { len: 1.4 } },
  { t: CUE.lock / FPS, kind: 'click' },
];
const { buf } = renderList(cues, TOTAL / FPS, { gains: { sweep: -20, whoosh: -19, click: -16 } });
const V = new URL('../out/verify-cinetic-test/', here);
mkdirSync(V, { recursive: true });
const wav = fileURLToPath(new URL('sfx.wav', V));
const m = master(buf, FFMPEG, wav, { lufs: -14, tp: -1, maxReduction: 10 });
console.log('sfx', JSON.stringify(m));
export { CUE, impactF, OUT, P };

if (!process.argv.includes('--no-render')) {
  const hf = fileURLToPath(new URL('node_modules/.bin/hyperframes' + (process.platform === 'win32' ? '.cmd' : ''), here));
  const silent = fileURLToPath(new URL('cinetic-test/silent.mp4', here));
  execFileSync(hf, ['render', '.', '--workers', '1', '--fps', '60', '-q', 'high', '-o', silent], { cwd: fileURLToPath(P), stdio: 'inherit', shell: true });
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('wrote', OUT);
}
