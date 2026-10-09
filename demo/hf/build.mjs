/* hyperframes test 1. writes project/index.html, a 5s 1080x1920 dark card:
   the mascot from lib/mascot.mjs, the michroma wordmark with a per letter
   reveal and the phosphor settle, and seeded dust rising behind the lockup.
   research only. nothing here is loaded by the site or by any post file. */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { HEAD, EYE_CX, GRID } from '../lib/mascot.mjs';

const here = new URL('.', import.meta.url);
copyFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', here), new URL('project/gsap.min.js', here));

/* dark tokens, copied from index.html, not invented */
const C = { bg: '#06070a', fg: '#d5dbd8', sub: '#c8c8c8', face: '#f4f7f5', eye: '#06070a', accent: '#35ff6a' };

const P = HEAD.plate, E = HEAD.eye;
const eyes = EYE_CX.map((cx, i) =>
  `<rect class="eye" id="eye${i}" x="${cx - E.w / 2}" y="${E.cy - E.h / 2}" width="${E.w}" height="${E.h}" rx="${E.h / 2}" fill="${C.eye}"/>`).join('');
const mascot = `<svg id="mascot" viewBox="0 0 ${GRID} ${GRID}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${P.x + P.s / 2}" cy="${P.y + P.s / 2}" r="${P.s / 2}" fill="${C.face}"/>${eyes}</svg>`;

const WORD = 'the boring tek';
const letters = layer => [...WORD].map(ch =>
  `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080, height=1920">
<title>hf test 1</title>
<script src="gsap.min.js"></script>
<style>
@font-face{font-family:"Michroma";src:url("fonts/Michroma.woff2") format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"sysmono";src:local("Consolas")}
html,body{margin:0;background:${C.bg}}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:${C.bg}}
.vig{position:absolute;inset:0;background:radial-gradient(140% 120% at 50% 45%,transparent 30%,rgba(3,4,6,.74) 100%);z-index:1;pointer-events:none}
.halo{position:absolute;left:50%;top:720px;width:900px;height:900px;margin:-450px 0 0 -450px;border-radius:50%;
  background:radial-gradient(circle,rgba(53,255,106,.20) 0%,rgba(53,255,106,.11) 30%,rgba(23,163,79,.055) 52%,rgba(23,163,79,0) 72%);opacity:0}
#dust{position:absolute;inset:0;z-index:1}
.dot{position:absolute;left:0;top:0;border-radius:50%;background:${C.accent};opacity:0}
.stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:120px;z-index:2;padding-bottom:80px;box-sizing:border-box}
.mwrap{width:300px;height:300px;display:block}
#mascot{width:100%;height:100%;display:block;overflow:visible}
.eye{transform-box:fill-box;transform-origin:50% 50%}
.wm{display:grid;font-family:"Michroma";font-size:66px;letter-spacing:.02em;white-space:nowrap;line-height:1.2}
.wm>div{grid-area:1/1}
.core{color:${C.fg};text-shadow:0 0 .012em rgba(53,255,106,.58),0 0 .045em rgba(53,255,106,.34),0 0 .11em rgba(53,255,106,.20),0 0 .28em rgba(23,163,79,.14);z-index:3}
.mid{color:${C.accent};filter:blur(.055em);opacity:0;z-index:2}
.wide{color:${C.accent};filter:blur(.2em);opacity:0;z-index:1}
.ch{display:inline-block}
.url{font-family:"sysmono",monospace;font-size:30px;color:${C.sub};letter-spacing:.08em;opacity:0;display:block}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="5">
  <div class="halo" id="halo"></div>
  <div class="vig"></div>
  <div id="dust"></div>
  <div class="stage">
    <div class="mwrap" id="mwrap">${mascot}</div>
    <div class="wm" id="wm" data-layout-allow-occlusion>
      <div class="wide" id="wide">${WORD}</div>
      <div class="mid" id="mid">${WORD}</div>
      <div class="core" id="core">${letters()}</div>
    </div>
    <div class="url" id="url" data-layout-allow-occlusion>theboringtek.com</div>
  </div>
</div>
<script>
(function(){
  /* seeded, so every frame is the same every render */
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const dust = document.getElementById('dust');
  const dots = [];
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('div'); d.className = 'dot';
    const r = 2 + rnd() * 5; d.style.width = d.style.height = r + 'px';
    dust.appendChild(d);
    dots.push({ d, x: 540 + (rnd() - .5) * 760, y: 1120 + (rnd() - .5) * 120, rise: 260 + rnd() * 520,
                drift: (rnd() - .5) * 140, t0: 1.15 + rnd() * 1.6, life: 1.6 + rnd() * 1.4, peak: .25 + rnd() * .6 });
  }

  const tl = gsap.timeline({ paused: true });
  /* mascot: anticipation dip, then a pop with overshoot */
  tl.fromTo('#mwrap', { scale: 0, y: 40 }, { scale: 1, y: 0, duration: .7, ease: 'back.out(1.8)' }, .15);
  tl.fromTo('#halo', { opacity: 0, scale: .6 }, { opacity: .9, scale: 1, duration: 1.2, ease: 'power2.out' }, .2);
  /* eyes look left, back, and one blink */
  tl.to('.eye', { x: -3, duration: .25, ease: 'power2.inOut' }, .95)
    .to('.eye', { x: 0, duration: .3, ease: 'power2.inOut' }, 1.5)
    .to('.eye', { scaleY: .1, duration: .07, ease: 'power2.in' }, 3.4)
    .to('.eye', { scaleY: 1, duration: .14, ease: 'power2.out' }, 3.47);
  /* wordmark: letters rise out of a blur, staggered from the centre */
  /* tracking in done as transforms: each glyph starts pushed out from the centre */
  const chs = [...document.querySelectorAll('#core .ch')], mid = (chs.length - 1) / 2;
  tl.fromTo(chs, { y: 46, x: i => (i - mid) * 7, opacity: 0, filter: 'blur(14px)' },
    { y: 0, x: 0, opacity: 1, filter: 'blur(0px)', duration: .75, ease: 'power3.out', stagger: { each: .045, from: 'center' } }, 1.05);
  /* phosphor settle: the glow overshoots once, then rests */
  tl.fromTo('#mid', { opacity: 0 }, { opacity: .7, duration: .25, ease: 'power2.out' }, 1.95)
    .to('#mid', { opacity: .42, duration: .6, ease: 'power2.inOut' }, 2.2);
  tl.fromTo('#wide', { opacity: 0 }, { opacity: .45, duration: .3, ease: 'power2.out' }, 1.95)
    .to('#wide', { opacity: .24, duration: .7, ease: 'power2.inOut' }, 2.25);
  tl.fromTo('#url', { opacity: 0, y: 14 }, { opacity: .8, y: 0, duration: .5, ease: 'power2.out' }, 2.5);
  /* dust: each mote rises, drifts and fades on its own clock */
  for (const p of dots) {
    tl.fromTo(p.d, { x: p.x, y: p.y, opacity: 0 }, { x: p.x + p.drift, y: p.y - p.rise, duration: p.life, ease: 'sine.out' }, p.t0);
    tl.to(p.d, { opacity: p.peak, duration: p.life * .25, ease: 'sine.out' }, p.t0);
    tl.to(p.d, { opacity: 0, duration: p.life * .6, ease: 'sine.in' }, p.t0 + p.life * .4);
  }
  /* a slow push in over the whole card */
  tl.fromTo('.stage', { scale: 1 }, { scale: 1.035, duration: 5, ease: 'none' }, 0);
  window.__timelines["main"] = tl;
})();
</script>
</body>
</html>
`;
writeFileSync(new URL('project/index.html', here), html);
console.log('wrote project/index.html');
