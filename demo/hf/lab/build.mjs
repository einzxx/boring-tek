/* style lab. builds lab-N/ hyperframes projects from lab/labN.mjs scenes,
   renders each with one worker and muxes its sound from lib/sfx.mjs into
   demo/out/lab-N.mp4. research only: nothing here is loaded by the site.

   every scene is a pure function of the frame: one paused gsap timeline with
   one driver tween whose onUpdate calls paint(f). cinetic's motion.js gives
   the eases, springs, pulses and sync helpers.

   usage: node lab/build.mjs 1 2 3 4 [--no-render] [--at 0.5,1,2] */
import { readdirSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { renderList, master } from '../../lib/sfx.mjs';

const here = new URL('.', import.meta.url);
const require = createRequire(new URL('../../package.json', here));
const FFMPEG = require('ffmpeg-static');
const HF = fileURLToPath(new URL('../node_modules/.bin/hyperframes' + (process.platform === 'win32' ? '.cmd' : ''), here));
const KIT = readFileSync(join(homedir(), '.claude/skills/cinetic/assets/hyperframes-starter/motion.js'), 'utf8')
  .replace('const W = 1920;', 'const W = 1080;').replace('const H = 1080;', 'const H = 1920;');
import { FPS, TOTAL } from './kit.mjs';

const BASE_CSS = `
html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
#root{position:relative;width:100%;height:100%;overflow:hidden}
.clip{position:absolute;inset:0;overflow:hidden}
.m{position:absolute;left:0;top:0}
.m-sq{position:absolute;inset:0;perspective:1300px}
.m-r{position:absolute;transform-style:preserve-3d}
.m-slab,.m-face{position:absolute;inset:0;border-radius:50%}
.m-face{overflow:hidden;transform:translateZ(0);box-sizing:border-box}
.m-eye{position:absolute}
.abs{position:absolute;left:0;top:0}
`;

/* page helpers every scene can use */
const PRELUDE = `
const M = window.MOTION, { E, prog, tw, mix, lmix, hitPulse, clamp, rand, SPR } = M;
const $ = id => document.getElementById(id);
const T = (el, s) => { (typeof el === 'string' ? $(el) : el).style.transform = s; };
const O = (el, v) => { (typeof el === 'string' ? $(el) : el).style.opacity = (+v).toFixed(3); };
const blurIn = (p, max) => { const b = max * (1 - clamp(p / 0.6)); return b < 0.75 ? 0 : b; };
const springAt = (cfg, f, start) => { const x = M.springFn(cfg); return f <= start ? 0 : x((f - start) / 60); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb = (a, b, t) => { const x = hex(a), y = hex(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')'; };
const tc = f => { const s = Math.floor(f / 60), fr = Math.floor(f % 60); return '00:00:' + String(s).padStart(2, '0') + ':' + String(fr).padStart(2, '0'); };
/* the mascot rig: position, squash (sx, sy about an origin), 3d turn, eyes */
function rig(id, o) {
  T(id, 'translate(' + o.x.toFixed(2) + 'px,' + o.y.toFixed(2) + 'px) rotate(' + (o.rot || 0).toFixed(2) + 'deg) scale(' + (o.s == null ? 1 : o.s).toFixed(4) + ')');
  const sq = $(id + '-sq'); sq.style.transformOrigin = o.origin || '50% 50%';
  sq.style.transform = 'scale(' + (o.sx || 1).toFixed(4) + ',' + (o.sy || 1).toFixed(4) + ')';
  T(id + '-r', 'rotateZ(' + (o.rz || 0).toFixed(2) + 'deg) rotateX(' + (o.rx || 0).toFixed(2) + 'deg) rotateY(' + (o.ry || 0).toFixed(2) + 'deg)');
  const ey = Math.max(0.08, o.eye == null ? 1 : o.eye);
  for (const i of [0, 1]) T(id + '-e' + i, 'translate(' + (o.ex || 0).toFixed(2) + 'px,' + (o.ey || 0).toFixed(2) + 'px) scaleY(' + ey.toFixed(3) + ')');
}
`;

const fontFace = (fam, file, w = 400, extra = '') =>
  `@font-face{font-family:"${fam}";src:url("fonts/${file}") format("woff2");font-weight:${w};font-display:block;${extra}}`;

export async function build(n, { render = true, at = null } = {}) {
  const scene = (await import('./lab' + n + '.mjs?' + Date.now())).default;
  const P = new URL('lab-' + n + '/', here);
  mkdirSync(new URL('fonts/', P), { recursive: true });
  copyFileSync(new URL('../../node_modules/gsap/dist/gsap.min.js', here), new URL('gsap.min.js', P));
  writeFileSync(new URL('motion.js', P), KIT);
  for (const [, file] of scene.fonts) copyFileSync(new URL('fonts/' + file, here), new URL('fonts/' + file, P));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080, height=1920">
<title>lab ${n}</title>
<script src="gsap.min.js"></script>
<script src="motion.js"></script>
<style>
${scene.fonts.map(([fam, file, w, extra]) => fontFace(fam, file, w, extra)).join('\n')}
${BASE_CSS}
${scene.css}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL / FPS}" data-fps="${FPS}" data-width="1080" data-height="1920">
  <div id="stage" class="clip" data-start="0" data-duration="${TOTAL / FPS}" data-track-index="0" data-layout-allow-overflow data-layout-allow-occlusion data-layout-allow-overlap>
${scene.html}
  </div>
</div>
<script>
(function () {
${PRELUDE}
  function build() {
${scene.js}
    const clock = { f: 0 };
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(clock, { f: 0 }, { f: ${TOTAL}, duration: ${TOTAL / FPS}, ease: 'none', onUpdate: () => paint(clock.f) }, 0);
    paint(0);
    window.__timelines['main'] = tl;
  }
  Promise.all([${scene.fonts.map(([fam, , w]) => `document.fonts.load('${w || 400} 100px "${fam}"')`).join(',')}]).then(build);
})();
</script>
</body>
</html>
`;
  writeFileSync(new URL('index.html', P), html);

  const V = new URL('../../out/verify-lab-' + n + '/', here);
  mkdirSync(V, { recursive: true });
  const { buf, report } = renderList(scene.cues, TOTAL / FPS, { gains: scene.gains || {} });
  const wav = fileURLToPath(new URL('sfx.wav', V));
  const m = master(buf, FFMPEG, wav, { lufs: -14, tp: -1, maxReduction: 14 });
  console.log('lab ' + n + ': ' + report.length + ' sounds, ' + m.lufs + ' LUFS');

  const cwd = fileURLToPath(P);
  if (at) {
    rmSync(new URL('snapshots/', P), { recursive: true, force: true });
    execFileSync(HF, ['snapshot', '.', '--at', at], { cwd, stdio: 'ignore', shell: true });
    for (const f of readdirSync(new URL('snapshots/', P)).filter(f => f.startsWith('contact-sheet'))) {
      copyFileSync(new URL('snapshots/' + f, P), new URL(f.replace('contact-sheet', 'stills'), V));
      console.log('stills', fileURLToPath(new URL(f.replace('contact-sheet', 'stills'), V)));
    }
  }
  if (render) {
    const silent = join(cwd, 'silent.mp4');
    execFileSync(HF, ['render', '.', '--workers', '1', '--fps', '60', '-q', 'high', '-o', 'silent.mp4', '--quiet'], { cwd, stdio: 'inherit', shell: true });
    const out = fileURLToPath(new URL('../../out/lab-' + n + '.mp4', here));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
    rmSync(silent);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', out, '-vf', 'fps=2,scale=270:-1,tile=5x2', '-frames:v', '1', fileURLToPath(new URL('contact.png', V))]);
    console.log('wrote', out);
  }
}

const args = process.argv.slice(2);
const atI = args.indexOf('--at');
const at = atI >= 0 ? args[atI + 1] : null;
for (const n of args.filter(a => /^\d$/.test(a))) await build(+n, { render: !args.includes('--no-render'), at });
