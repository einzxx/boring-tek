/* the boring tek — the rig test. twelve seconds that exercise `lib/camera.mjs`
   and `lib/transitions.mjs` and nothing else.

     node rig-test.mjs                    both themes, 1080x1920, 60fps
     node rig-test.mjs light              just one of them
     DEMO_FPS=12 node rig-test.mjs        the fast preview pass
     node rig-test.mjs --blur             60fps with the shutter open
     node rig-test.mjs --encode-only      re-encode from kept frames

   **there are exactly two outputs and they are always the same two paths**,
   overwritten every run:

     demo/out/rig-light.mp4
     demo/out/rig-dark.mp4

   mascot-test.mjs's rule and mascot-test.mjs's reason: the name says what it is,
   the file's own timestamp says when it was made, and a stale clip cannot
   survive a render because the render lands on top of it.

   this is not a post and it is not wired into one. it answers five questions in
   one clip, in this order.

   **the push** — does a leg read as a camera moving toward something rather
   than as a picture being scaled.

   **the drift** — is any frame in here a still frame. it never stops, including
   underneath everything else.

   **the snap** — does a punchline zoom land, and does the anticipation before
   it do the work it is there for.

   **the shake** — does a knock read as the camera being hit rather than as the
   picture glitching, and does it blur rather than jump under the shutter.

   **the grow, both ways** — does he read as one continuous shape becoming the
   background, or as a cut. and does it work light to dark **and** dark to
   light, which is the half that needs his face to invert.

   **the cross** — off one side and back on the other, in a new place.

   ---------- the layers, and why they are in that order ----------

     #cam-shake > #cam-rig > .page     the scene. the camera moves this
     .m-zone                           the mascot, in screen space
     #tr-wash                          the field, z-index 6

   the mascot is **outside** the camera on purpose, the way record.mjs keeps its
   cursor outside: the grow's cover arithmetic is against the frame, and a head
   the camera is also scaling would make the covering scale a function of where
   the camera happened to be. record.mjs's own note says the same thing about
   the pointer — it lives in screen space so it can stay glued to something the
   camera is moving underneath it.

   which means the drift is still running under the grow, on the scene, while
   the scene is completely covered. that is deliberate: it proves the two layers
   do not need to know about each other.

   ---------- it is silent ----------

   there is no voice and there are no effects. the question is whether the
   picture moves correctly, and a sound on the snap would be the thing being
   judged. `lib/sfx.mjs` has `servo` for a snap zoom and `glitch` for a hit
   whenever a real clip wants them.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CustomEase } from 'gsap/CustomEase';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, headRect, STAGE, SAFE, SIZE, THEMES, TURN,
} from './lib/mascot.mjs';
import {
  planCamera, cameraFrame, cameraMotion, cameraCss, cameraMarkup, cameraRuntime,
  minZoomFor, describeCamera, holds, visibleRect,
} from './lib/camera.mjs';
import {
  planGrow, planCross, growFrame, crossFrame, composeTransitions, transitionMotion,
  transitionCss, transitionMarkup, transitionRuntime, growCoverage, coverScale,
  mascotInk, describeTransition,
} from './lib/transitions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-rig');
const SUBS = path.join(OUT, 'subframes-rig');
const VERIFY = path.join(OUT, 'verify-rig');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const WANT = argv.filter(a => THEMES.includes(a));
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

const SECONDS = 12.0;
const POP = CustomEase.get('btk.pop');
const GLIDE = CustomEase.get('btk.glide');
const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));

/* ---------- where he stands ----------
   the module places him: `pos` and `margin` go in and `plan.box` comes back, so
   the safe area arithmetic stays in the one file that owns it. the transitions
   are then handed that box rather than a second copy of the same sum, which is
   the whole reason `coverScale` takes a box instead of a corner name. */
const POS = 'bottom-right';
const mirror = box => ({ left: +(VW - box.left - SIZE).toFixed(2), top: box.top });

/* ---------- the cut ---------- */
/* the zooms are all well over 1 and that is the shake's doing rather than a
   framing choice. `minZoomFor` puts the floor at 1.089 for a 24px knock — the
   overscan a translation of 24 needs is 2x24/540 — so the whole clip sits above
   it with room, and the guard measures the gap rather than trusting this note.

   24 is the nominal amplitude and the realised peak is 8.8 css px, 18 device.
   the two differ because the noise is noise: two octaves of it reach their own
   ends rarely, which is exactly what makes a knock read as a knock rather than
   as a sine. `minZoomFor` bounds on the nominal anyway, because a bound that is
   only usually true is not a bound. */
const CAM = {
  start: { cx: 270, cy: 520, z: 1.12 },
  push: { at: 0.40, for: 2.20, to: { cx: 270, cy: 440, z: 1.19 } },
  snap: { at: 3.40, by: 1.14, for: 0.20, hold: 0.30, settle: 0.50 },
  hit: { at: 3.79, for: 0.55, amp: 24, freq: 22 },
  back: { at: 4.70, for: 0.80, to: { cx: 270, cy: 480, z: 1.14 } },
};
/* the box every line of the page sits inside, centred on the frame so the crop
   takes the same air off both sides. the width is what the tightest crop can
   hold, and the guard measures it rather than trusting this comment. */
const COPY = { x: 100, y: 288, w: 340, h: 330 };
const GROW_OUT_AT = 5.60;
const GROW_IN_AT = 7.60;
const CROSS_AT = 8.80;
/* the second line lives only in the dark stretch between the two grows, and it
   is off the screen again before the second one covers — otherwise the field
   would lift on a line that had silently changed theme underneath it. */
const LINE2 = { in: 6.72, out: 7.40, gone: 7.56 };

function cameraPlan() {
  return planCamera({
    mode: 'free', stage: STAGE, seconds: SECONDS,
    /* free mode, because this is a composed frame on a plain background: there
       is no fixed bar to float in the margin and no full bleed subline to lose
       its outer letters, which are the two reasons site mode has its limits.
       the floor here is the shake's, and it is the module's own arithmetic. */
    zoom: { min: 1.0, max: 1.5 },
    start: CAM.start,
    legs: [
      { ...CAM.push, ease: 'glide', why: 'the push. the line comes up the frame' },
      { ...CAM.back, ease: 'glide', why: 'back out off the punchline' },
    ],
    snaps: [{ ...CAM.snap, why: 'the punchline' }],
    shakes: [{ ...CAM.hit, why: 'the hit, a quarter second after the snap lands' }],
  });
}

function transitionPlans(theme, ink, home) {
  const other = theme === 'light' ? 'dark' : 'light';
  return {
    growOut: planGrow({
      at: GROW_OUT_AT, dir: 'out', from: theme, to: other,
      box: home, size: SIZE, stage: STAGE, ink,
    }),
    /* the same corner, because the reverse is how he comes back and he comes
       back where he left. this is also the reason there is no fade anywhere in
       this clip: between the two grows he is not hidden, he is the page. */
    growIn: planGrow({
      at: GROW_IN_AT, dir: 'in', from: other, to: theme,
      box: home, size: SIZE, stage: STAGE, ink,
    }),
    cross: planCross({
      at: CROSS_AT, exit: 'right', enter: 'left',
      box: home, to: mirror(home), size: SIZE, stage: STAGE,
    }),
  };
}

/* the mascot's own performance, which is a separate thing from what the
   transitions do to him. he reacts to the camera and then he is a shape.

   nothing is scheduled between the grow's release and the reverse grow's
   arrival, because he is not on the screen there — he **is** the screen. */
function marks() {
  return [
    { t: 0.30, state: 'neutral' },
    { t: 1.90, state: 'curious' },
    { t: 3.42, state: 'surprised' },
    /* this one holds from before the first grow to after the second, and that
       is deliberate rather than lazy. `coverScale` allows for the idle layer,
       which is always on and is a fixed fraction of the head's own size; it
       cannot allow for a pose, because a pose is the clip's and a `delighted`
       hop moves the head a long way. put a state's entrance inside a covered
       stretch and the ellipse it squashes into stops reaching the corner.

       `growCoverage` found exactly that on the first render of this file: a
       `curious` at 8.20 had its anticipation running at 8.00, and the measured
       reach came back 0.977 — a wedge of the old paper behind a disc the plan
       said had swallowed the frame. so nothing is scheduled between 4.80 and
       8.70, which is the whole of both grows. a mark inside a grow is a clip
       error and the number that catches it is in the run. */
    /* the second grow ends at 8.625, so nothing may start before that. */
    { t: 4.80, state: 'neutral' },
    /* he has a face again. the spacing after this is the module's own floor
       rather than a preference: `curious` wants 1.24s to itself and `neutral`
       1.06s, and planMascot refuses less.

       **the turn is here because the cross moves him and his bias does not.**
       `planMascot` derives the resting turn from `pos`, once, so that he looks
       into the frame rather than out of it — from the right corner that is
       -0.35. cross him to the left corner and that same -0.35 is now pointing
       him off the side of the screen, which is exactly what the first preview
       showed at 10.15s. the fix is the module's own api rather than anything
       new: a mark may hold the turn, so this one holds it at +bias from before
       he leaves. in the right corner that reads as looking toward the side he
       is about to go out of, which is the anticipation the move wants anyway,
       and in the left corner it is him looking back into the frame. */
    { t: 8.75, state: 'neutral', turn: TURN.bias },
    { t: 10.00, state: 'curious' },
  ];
}

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the scene ----------
   the site's own two themes as tokens and four lines of type, all of it in
   --fg on --bg so the whole page inverts when the grow flips the theme. that
   is the point being demonstrated as much as the circle is: his fill becomes
   the paper, and everything already on the paper turns over with it. */
function sceneHtml(plan, theme) {
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<title>rig</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#ffffff; --fg:#0b0d10; --muted:rgba(11,13,16,.42);
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
}
[data-theme=dark]{ --bg:#06070a; --fg:#d5dbd8; --muted:rgba(213,219,216,.42); }
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
.stage{position:relative;width:${VW}px;height:${VH}px;overflow:hidden;background:var(--bg)}
/* load bearing, not decoration: with nothing animating at all chrome stops
   producing compositor frames and the screenshot call blocks on frame one
   forever. post2.mjs found this and every clip in demo/ has carried something
   like it since. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

/* the page the camera moves on.

   **every line of it lives inside COPY, and COPY is not a taste decision.** the
   snap peaks at z 1.379, which shows 391 page px of a 540 wide page, and a
   headline wider than that gets its first letter cut off — which is post9's
   SHE / 7/RING / MEK and post11's "no line of the page is ever cut in half".
   the first cut of this file set the h1 at 56 and 428 wide and the 12fps
   preview showed exactly that at 3.60s. camera.mjs's holds() is the check now,
   and it runs on every frame before a render rather than on a still somebody
   happened to look at. (no backticks in this comment on purpose: it lives
   inside a template literal.) */
.page{position:absolute;inset:0;background:var(--bg)}
.page .h1{position:absolute;left:${COPY.x}px;top:300px;width:${COPY.w}px;
  font-family:"Michroma",var(--mono);font-size:38px;line-height:1.32;letter-spacing:.01em}
.page .rule{position:absolute;left:${COPY.x}px;top:452px;width:170px;height:2px;background:var(--fg);
  transform-origin:0 50%}
.page .hint{position:absolute;left:${COPY.x}px;top:482px;width:${COPY.w}px;
  font-size:18px;line-height:1.5;color:var(--muted)}
#rig-line2{position:absolute;left:${COPY.x}px;top:562px;width:${COPY.w}px;
  font-size:24px;font-weight:500;line-height:1.4;opacity:0;will-change:transform,opacity}
${cameraCss()}
${mascotCss(plan)}
${transitionCss()}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
${cameraMarkup(`<div class="page">
    <div class="h1">THE<br>BORING<br>TEK</div>
    <div class="rule"></div>
    <div class="hint">infrastructure nobody thinks about, because it works.</div>
    <div id="rig-line2">it turns over with him.</div>
  </div>`)}
${mascotMarkup(plan)}
${transitionMarkup()}
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${cameraRuntime()}
${mascotRuntime()}
${transitionRuntime()}
window.__rig = {
  line2: document.getElementById('rig-line2'),
  apply: function (f) {
    this.line2.style.opacity = f.line2.o.toFixed(4);
    this.line2.style.transform = 'translateY(' + f.line2.y.toFixed(2) + 'px)';
  },
};
document.fonts.load('500 1em "Space Grotesk"')
  .then(() => document.fonts.load('1em "Michroma"'))
  .then(() => document.fonts.ready)
  .then(() => { window.__built = window.__mas.build(); });
</script>
</body>
</html>`;
}

/* the rAF shim. nothing in this scene animates by hand — node holds every
   animation and the page writes what it is handed — but it is installed and
   flushed once per capture anyway, so the two new layers run under the same
   clock everything else in demo/ runs under from the day they are dropped into
   a real clip. a shim that only appears when it is needed is a shim nobody
   tests. */
function injected() {
  let seed = 0x51d0c3a7;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) {
    const k = rafQ.findIndex(function (e) { return e.id === id; });
    if (k > -1) rafQ.splice(k, 1);
  };
  window.__dmRaf = function (now) {
    const batch = rafQ.splice(0, rafQ.length);
    for (const e of batch) { try { e.cb(now); } catch (err) { } }
    return rafQ.length;
  };
}

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

/* ---------- one frame of everything ----------
   the whole clip as a function of time, in node, so a frame can be printed and
   argued about before a browser is opened. */
function rigFrame(P, t) {
  const cam = cameraFrame(P.cam, t);
  const mas = mascotFrame(P.mascot, t);
  const tr = composeTransitions([
    crossFrame(P.cross, t), growFrame(P.growOut, t), growFrame(P.growIn, t),
  ]);
  /* the theme is read off the two grows' own `flipAt`, on one clock, rather
     than off whichever of them last had an opinion. see the note in
     composeTransitions. */
  let theme = P.theme;
  if (t >= P.growOut.flipAt) theme = P.growOut.to;
  if (t >= P.growIn.flipAt) theme = P.growIn.to;

  const up = span(t, LINE2.in, LINE2.in + 0.42);
  const down = span(t, LINE2.out, LINE2.gone);
  const line2 = { o: POP(up) * (1 - GLIDE(down)), y: (1 - POP(up)) * 14 };
  return { t, cam, mas, tr, theme, line2 };
}

/* ---------- render ---------- */
async function render(theme, P) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const frames = path.join(FRAMES, theme);
  const subs = path.join(SUBS, theme);
  for (const d of [frames, subs]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(P.mascot, theme));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: theme },
    ],
  });

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 200; i++) {
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready && window.__cam
      && window.__cam.ready && window.__tr && window.__tr.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    cam: !!(window.__cam && window.__cam.ready),
    tr: !!(window.__tr && window.__tr.ready),
  }));
  for (const k of ['mas', 'cam', 'tr']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  const built = await page.evaluate(() => window.__built);
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, theme ' + built.theme);

  /* the head's clearance, computed off every frame rather than sampled. it is
     the **mascot's** own guard and it speaks for the mascot's own animation:
     the grow is a transform on the zone that the module knows nothing about, so
     the transition windows are excluded and measured separately. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t >= P.growOut.at - 0.05 && t <= P.growIn.end + 0.05) continue;
    if (t >= P.cross.at - 0.05 && t <= P.cross.end + 0.05) continue;
    const r = headRect(P.mascot, mascotFrame(P.mascot, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +t.toFixed(2), near, ...r };
  }

  let edgeWorst = null, edgeSamples = 0;
  let plateAtCover = null, washAtHandover = null;
  let themeNow = theme;
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const fr = rigFrame(P, t);

      if (fr.theme !== themeNow) {
        themeNow = fr.theme;
        await page.evaluate(th => window.__mas.theme(th), themeNow);
      }
      await page.evaluate(c => window.__cam.apply(c), fr.cam);
      /* the order is the whole contract: the mascot writes its own numbers, and
         the transition then multiplies the three it is allowed to touch. the
         other way round and every frame of a grow would be undone by the module
         a millisecond later. */
      await page.evaluate(m => window.__mas.apply(m), fr.mas);
      await page.evaluate(x => window.__tr.apply(x), fr.tr);
      await page.evaluate(r => window.__rig.apply(r), { line2: fr.line2 });
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      /* four times a second, on the whole frame rather than on a subframe. */
      if (k === 0 && f % Math.max(1, Math.round(FPS / 4)) === 0) {
        const e = await page.evaluate((vw, vh, d) => window.__cam.edges(vw, vh, d), VW, VH, DSF);
        edgeSamples++;
        const near = Math.min(e.left, e.top, e.right, e.bottom);
        if (!edgeWorst || near < edgeWorst.near) edgeWorst = { t: +t.toFixed(2), near, ...e };
      }

      /* the one frame the whole trick lives on: the first frame the field is up
         over the growing disc. what is measured is the plate as it actually
         rendered, in device px, which is what turns "he fills 1080x1920" from a
         plan number into a measurement. */
      if (k === 0 && !plateAtCover && fr.tr.wash.on && fr.tr.phase === 'cover') {
        plateAtCover = { t: +t.toFixed(3), ...(await page.evaluate(d => window.__tr.plate(d), DSF)) };
        washAtHandover = await page.evaluate(() => window.__tr.washInk());
      }

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const file = SUB > 1
        ? path.join(subs, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(frames, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  /* the stills a review looks at first: the two frames either side of each
     handover, which is where a cut would be if there were one. */
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    ['00-open', 0.60], ['01-pushed', 2.70], ['02-snap', 3.62], ['03-shaken', 3.95],
    ['04-grow-half', P.growOut.at + P.growOut.times.coverU * 0.55],
    ['05-grow-just-before', P.growOut.at + P.growOut.times.coverU - 1 / 60],
    ['06-grow-just-after', P.growOut.at + P.growOut.times.coverU + 1 / 60],
    ['07-dark-line', 7.10],
    ['08-back-just-before', P.growIn.end - P.growIn.times.coverU - 1 / 60],
    ['09-back-half', P.growIn.end - P.growIn.times.coverU * 0.55],
    ['10-cross-gone', P.cross.at + P.cross.times.anticipate + P.cross.times.travel + 0.08],
    ['11-cross-landed', P.cross.end + 0.20],
    ['12-end', 11.70],
  ];
  for (const [name, t] of stills) {
    const fr = rigFrame(P, t);
    await page.evaluate(th => window.__mas.theme(th), fr.theme);
    await page.evaluate(c => window.__cam.apply(c), fr.cam);
    await page.evaluate(m => window.__mas.apply(m), fr.mas);
    await page.evaluate(x => window.__tr.apply(x), fr.tr);
    await page.evaluate(r => window.__rig.apply(r), { line2: fr.line2 });
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, theme + '-' + name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  camera edges, worst of ' + edgeSamples + ' samples at ' + edgeWorst.t + 's: '
    + edgeWorst.left + ' left, ' + edgeWorst.top + ' top, ' + edgeWorst.right + ' right, '
    + edgeWorst.bottom + ' bottom (device px outside the frame, and none of them may be negative)');
  console.log('  head, worst of the frames outside the transitions, at ' + headWorst.t + 's: '
    + headWorst.left + ' left, ' + headWorst.top + ' top, ' + headWorst.right + ' right, '
    + headWorst.bottom + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  if (plateAtCover) {
    console.log('  at the handover (' + plateAtCover.t + 's) the plate measures '
      + plateAtCover.w + ' x ' + plateAtCover.h + ' device px, centred on '
      + plateAtCover.cx + ', ' + plateAtCover.cy);
    console.log('  the field is ' + washAtHandover.background + ' at opacity ' + washAtHandover.opacity);
  }

  await browser.close();
  srv.close();
  if (SUB > 1) blend(subs, frames, N);

  const state = { theme, built, head: headWorst, edges: edgeWorst, edgeSamples, plateAtCover, washAtHandover };
  fs.writeFileSync(path.join(OUT, 'rig-' + theme + '.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* the shutter: the subframes are averaged into frames, because a frame is the
   light that arrived over its own duration rather than a sample of one instant.
   post10's chain, unchanged. */
function blend(subs, frames, N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(subs, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(frames, 'f%05d.jpg')]);
}

function encode(tag) {
  const out = path.join(OUT, 'rig-' + tag + '.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, tag, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-movflags', '+faststart', out]);
  return out;
}

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null, fps: fps ? parseFloat(fps[1]) : null,
  };
}

/* ---------- go ---------- */
console.log('the boring tek — rig test: the camera and the transitions');
const themes = WANT.length ? WANT : THEMES;
const ink = mascotInk();
const M = marks();

const PLANS = Object.fromEntries(themes.map(theme => {
  const mascot = planMascot({ marks: M, seconds: SECONDS, theme, pos: POS, size: SIZE });
  const cam = cameraPlan();
  const tr = transitionPlans(theme, ink, mascot.box);
  return [theme, { theme, mascot, cam, ...tr }];
}));
const P0 = PLANS[themes[0]];
const HOME = P0.mascot.box;

console.log('');
console.log(describeCamera(P0.cam));
console.log('');
console.log(describeTransition(P0.growOut));
console.log('');
console.log(describeTransition(P0.growIn));
console.log('');
console.log(describeTransition(P0.cross));
console.log('');

/* ---------- the numbers, before a frame is written ---------- */
const camMo = cameraMotion(P0.cam, FPS);
const camMo60 = FPS === 60 ? camMo : cameraMotion(P0.cam, 60);
const floor = minZoomFor(P0.cam);
const goMo = transitionMotion(P0.growOut, 60);
const giMo = transitionMotion(P0.growIn, 60);
const crMo = transitionMotion(P0.cross, 60);
const cov = coverScale(HOME, SIZE, STAGE);
const covOut = growCoverage(P0.growOut, P0.mascot, 60);
const covIn = growCoverage(P0.growIn, P0.mascot, 60);
const masMo = mascotMotion(P0.mascot, 60, SECONDS);

console.log('camera   zoom ' + camMo60.z.min + ' to ' + camMo60.z.max
  + ', floor ' + floor.z + ' (' + camMo60.z.underCount + ' frames under it)');
console.log('         worst one frame move ' + camMo60.worst.move.d + 'px at ' + camMo60.worst.move.t
  + 's, zoom step ' + camMo60.worst.zoom.d + ', shake step ' + camMo60.worst.shake.d + 'px');
console.log('         peak shake ' + camMo60.shakeMax + 'px, still frames ' + camMo60.still);
console.log('cover    scale ' + cov.scale + ' from the corner, plate '
  + cov.plateCssAtRest + ' css at rest and ' + cov.plateDeviceAtCover + ' device px at cover');
console.log('         the frame diagonal is ' + (Math.hypot(VW, VH) * DSF).toFixed(1) + ' device px');
console.log('grow     out: worst reach under the field ' + goMo.minReachOnWash
  + ', early frames ' + goMo.early + ', measured worst ' + (covOut.worst ? covOut.worst.reach : 'n/a'));
console.log('         in:  worst reach under the field ' + giMo.minReachOnWash
  + ', early frames ' + giMo.early + ', measured worst ' + (covIn.worst ? covIn.worst.reach : 'n/a'));
console.log('cross    off frame for ' + crMo.offSeconds + 's, worst one frame move '
  + crMo.worst.move.d + 'px at ' + crMo.worst.move.t + 's, lean step ' + crMo.worst.rot.d + 'deg');
console.log('mascot   head ' + masMo.headPx + 'px, squash ' + (masMo.maxSquash * 100).toFixed(1)
  + '%, breathing ' + (masMo.maxBreathe * 100).toFixed(2) + '%, frozen frames ' + masMo.frozenFrames);
console.log('');

if (!ONLY_ENCODE) {
  for (const th of themes) {
    console.log('rendering ' + th + ' ...');
    PLANS[th].state = await render(th, PLANS[th]);
  }
}

const results = themes.map(th => {
  const file = encode(th);
  const p = probe(file);
  return { theme: th, file, ...p, mb: (fs.statSync(file).size / 1e6).toFixed(2) };
});
if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
}

console.log('');
for (const r of results) {
  console.log('  ' + path.relative(HERE, r.file) + '  ' + r.w + 'x' + r.h + '  '
    + r.fps + 'fps  ' + (r.seconds || 0).toFixed(2) + 's  ' + r.mb + ' MB');
}

/* ---------- the guards ---------- */
const fail = [];
const note = [];
const check = (cond, msg) => { (cond ? note : fail).push(msg); };

check(camMo60.z.underCount === 0,
  'the camera never zooms under the shake\'s own edge floor: min ' + camMo60.z.min
  + ' against ' + floor.z + ', ' + camMo60.z.underCount + ' frames under');
check(camMo60.still === 0, 'no frame in the film repeats the one before it: ' + camMo60.still + ' still frames');
/* an eighth of the frame's own width in one frame is where a move stops being a
   move. it is the snap that sets this number, and the snap is meant to be the
   fastest thing in the clip. */
check(camMo60.worst.move.d < VW / 8,
  'the camera never steps: worst one frame move ' + camMo60.worst.move.d
  + 'px against an eighth of the frame, ' + (VW / 8).toFixed(1) + 'px');
/* post9's lesson and post11's rule, as a number. every line of the page lives
   inside COPY, and this walks all 720 frames to say whether the crop ever took
   a bite out of it. the first cut of this file failed it at 3.60s. */
{
  const h = holds(P0.cam, COPY, 60);
  check(h.ok,
    'the crop never cuts a line of the page in half: the copy box keeps '
    + h.worst.near + 'px of air at its tightest, at ' + h.worst.t + 's on z ' + h.worst.z
    + ' (left ' + h.worst.left + ', top ' + h.worst.top + ', right ' + h.worst.right
    + ', bottom ' + h.worst.bottom + ')');
}
check(camMo60.shakeMax * DSF > 12,
  'the shake is big enough to read at phone size: peak ' + camMo60.shakeMax
  + ' css px, ' + (camMo60.shakeMax * DSF).toFixed(1) + ' device');

check(goMo.early === 0 && giMo.early === 0,
  'the field never appears over a disc that has not covered: ' + goMo.early + ' and ' + giMo.early + ' frames');
check(goMo.minReachOnWash >= 1 && giMo.minReachOnWash >= 1,
  'the plan\'s own reach under the field is never under 1: ' + goMo.minReachOnWash
  + ' out, ' + giMo.minReachOnWash + ' in');
check(covOut.ok && covIn.ok,
  'the reach measured against the real mascot frame is never under 1: '
  + (covOut.worst ? covOut.worst.reach : 'n/a') + ' out, '
  + (covIn.worst ? covIn.worst.reach : 'n/a') + ' in');
check(P0.growOut.handover.gap <= 12 && P0.growIn.handover.gap <= 12,
  'the handover colours are within tolerance: ' + P0.growOut.handover.gap
  + ' out, ' + P0.growIn.handover.gap + ' in, of 255');
check(crMo.offFrames > 0, 'he really leaves the frame: ' + crMo.offSeconds + 's off');

/* the pop the first 12fps preview showed at 6.82s: a grow out gave him back the
   moment its window ended and he snapped into his corner at full size on the new
   theme. presence is what fixed it, and this is the number that would catch it
   coming back. */
{
  const between = [];
  for (let f = 0; f < Math.round(60 * SECONDS); f++) {
    const t = f / 60;
    if (t <= P0.growOut.end || t >= P0.growIn.at) continue;
    if (rigFrame(P0, t).tr.zone.o > 0) between.push(+t.toFixed(3));
  }
  check(between.length === 0,
    'he stays gone between the two grows — he became the page, and nothing hands him'
    + ' back until the reverse does: ' + between.length + ' frames of him showing between '
    + P0.growOut.end.toFixed(2) + 's and ' + P0.growIn.at.toFixed(2) + 's');
}
check(masMo.frozenFrames === 0, 'the face is never frozen: ' + masMo.frozenFrames + ' frames');

for (const th of themes) {
  const st = PLANS[th].state;
  if (!st) continue;
  const nearEdge = Math.min(st.edges.left, st.edges.top, st.edges.right, st.edges.bottom);
  check(nearEdge >= 0,
    th + ': the camera never showed an edge, measured on ' + st.edgeSamples
    + ' rendered samples. worst ' + nearEdge + ' device px outside the frame at ' + st.edges.t + 's');
  const nearHead = Math.min(st.head.left, st.head.top, st.head.right, st.head.bottom);
  check(nearHead >= Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom),
    th + ': the head clears the platform safe area outside the transitions: ' + nearHead.toFixed(1) + 'px');
  if (st.plateAtCover) {
    const diag = Math.hypot(VW, VH) * DSF;
    /* the short axis, because the squash makes it an ellipse and the short axis
       is the one that has to reach the corner. the same reason coverScale
       divides by (1 + SQ_MAX). */
    const short = Math.min(st.plateAtCover.w, st.plateAtCover.h);
    check(short >= diag,
      th + ': the plate as rendered covers 1080x1920 at the handover. '
      + st.plateAtCover.w + ' x ' + st.plateAtCover.h + ' device px, short axis '
      + short + ' against a ' + diag.toFixed(1) + 'px frame diagonal');
  }
}
for (const r of results) {
  check(r.w === VW * DSF && r.h === VH * DSF, r.theme + ': the file is ' + r.w + 'x' + r.h);
  check(Math.abs((r.seconds || 0) - SECONDS) < 0.12,
    r.theme + ': the file runs ' + (r.seconds || 0).toFixed(2) + 's against ' + SECONDS.toFixed(2));
}

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
console.log('  stills in ' + path.relative(HERE, VERIFY));
process.exit(fail.length ? 1 : 0);
