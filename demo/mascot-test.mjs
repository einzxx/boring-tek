/* the boring tek — the mascot state test.

   every state and every hands pose, over a plain background with no voice,
   rendered in both themes so the two can be put side by side rather than
   described.

     node mascot-test.mjs                    every chapter, both themes, 1080x1920, 60fps
     node mascot-test.mjs light              just one theme
     node mascot-test.mjs --chapter=states   just the states and the turn
     node mascot-test.mjs --chapter=hands    just the floating hands
     DEMO_FPS=12 node mascot-test.mjs        the fast preview pass
     node mascot-test.mjs --blur             60fps with the shutter open
     node mascot-test.mjs --blur=6           a wider shutter
     node mascot-test.mjs --encode-only      re-encode from kept frames

   **there are exactly four outputs and they are always the same four paths**,
   overwritten every run — two per chapter:

     demo/out/mascot-light.mp4        demo/out/mascot-hands-light.mp4
     demo/out/mascot-dark.mp4         demo/out/mascot-hands-dark.mp4

   nothing else is written. the resolution used to be in the name and for one
   afternoon the chapter was too, and every time the cut changed that minted a
   fresh set while the old one sat on disk looking current — which is exactly
   how a review ends up watching a clip from an hour ago. the name says what it
   is; the file's own timestamp says when it was made. a stale clip cannot
   survive a render now, because the render lands on top of it. the chapter is
   in the name here for the opposite reason to the one it was dropped for: it
   names a **different cut**, not a different pass at the same one.

   this is not a post and it is not wired into one. it exists to answer three
   questions, in two clips, in this order.

   **the states** — do the nine read as nine different things at a glance, with
   the sound off, at phone size.

   **the turn** — does the flat three quarter turn read as a head turning rather
   than as eyes sliding across a plate. the channel is swept from one end to the
   other and back, so every value in between is on screen and not just the ends,
   then three of the ordinary states are held at 0.6 to prove the turn composes
   with them rather than replacing them. `turn-away` and `snap-back` are not
   repeated in that half: they are already in the states run above, because they
   are states.

   **the hands** — do the seven poses read as seven gestures at a glance, at
   phone size, and does each one compose with an eye state rather than fight it.
   that is its own clip and the reason is in the hands cut below: turning the
   gloves on moves the head in, so a states clip carrying them would no longer
   be the control the first question needs.

   the rig is captions-test.mjs's, which is post5.mjs's: a local server, headless
   chrome under cdp virtual time, the rAF shim, `Page.captureScreenshot` with
   `clip.scale` for device pixels, ffmpeg on the end, and a safe area measured
   rather than assumed. three things are different.

   1. **the background is deliberately nothing.** no wordmark, no captions, no
      pictograms. the mascot is the thing being judged and anything else in the
      frame would be the thing being looked at.

   2. **there is sound, and it is not a voice.** the module emits two cues and
      only two: a `pop` when a bubble arrives and a `ding` on the agreement
      beat. both are in the file, because whether the ding lands on the nod is
      one of the things this test is for.

   3. **the caption band is passed in without being drawn.** a real clip
      reserves a box for words; the bubble may not enter it. the band here is
      where a caption box would sit above a bottom corner mascot, and the guard
      measures the rendered bubble against it every quarter second. a clip that
      puts its captions over the mascot's corner finds out here rather than in
      a review. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, describeMascot, describeMotion, headRect, stillMoment,
  STATE_NAMES, THEMES, STAGE, SAFE, HEAD_PX, BUBBLE, TURN,
  HAND_POSE_NAMES, HAND_SIDES,
} from './lib/mascot.mjs';
import { renderSfx, writeWav, limit } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-mascot');
const SUBS = path.join(OUT, 'subframes-mascot');
const VERIFY = path.join(OUT, 'verify-mascot');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const WANT = argv.filter(a => THEMES.includes(a));
const CHAPTER_ARG = (argv.find(a => a.startsWith('--chapter=')) || '').split('=')[1];
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const BLUR = argv.some(a => a.startsWith('--blur'));
/* four is where a 60fps shutter stops reading as four ghosts and starts reading
   as one moving thing. post10's number, and the reason is the same one. */
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the cut ----------
   seven states in the order they were designed in, each given the room its own
   entrance, hold and exit need plus a quarter second of air, and three bubbles
   spread across them rather than bunched, then the turn put through its paces.
   it is one plan rather than two because it is one output, and a mark is a mark
   wherever it sits on the clock.

   the copy is two words each. that is the rule; the guard's ceiling is four. */
const BUBBLES = { curious: 'go on', agreeing: 'yes', delighted: 'shipped it', 'snap-back': 'what' };
const HELD = 0.6;

function cut() {
  const marks = [];
  /* every state, evenly spaced. two and three quarter seconds is the room the
     longest of them needs plus a quarter second of air. */
  let t = 0.55;
  for (const state of STATE_NAMES) {
    marks.push({ t: +t.toFixed(3), state, bubble: BUBBLES[state] || undefined });
    t += 2.75;
  }
  /* the sweep, and it is the part of the second half that matters most: minus
     one to plus one and back, each leg one tween whose window is nearly the
     whole mark, so what is on screen is a continuous ramp through every value
     rather than a walk between poses. the turn is the one channel no exit
     resets, which is what lets four marks read as one move instead of four
     fighting each other. */
  for (const [turn, turnFor, room] of
    [[-1, 1.50, 1.90], [1, 2.20, 2.60], [-1, 2.20, 2.60], [0.35, 1.20, 1.70]]) {
    marks.push({ t: +t.toFixed(3), state: 'neutral', turn, turnFor });
    t += room;
  }
  /* and three ordinary states held at a three quarter turn. none of them
     mentions the turn — that is the point. if the composition works they are
     recognisably themselves, at an angle. `thinking` carries a bubble there on
     purpose: a bubble beside a turned head is the case where the safe area
     guard has something to say. */
  for (const [state, room, bubble] of
    [['surprised', 2.50, null], ['thinking', 2.70, 'one sec'], ['delighted', 2.60, null]]) {
    marks.push({ t: +t.toFixed(3), state, turn: HELD, bubble: bubble || undefined });
    t += room;
  }
  return { marks, seconds: +t.toFixed(3) };
}

/* ---------- the hands cut ----------
   the second chapter, and it is its own clip rather than a section of the one
   above. two reasons, and the first is the whole point of the part being opt
   in: turning the gloves on moves the head in, because they hang outside the
   silhouette and the placement holds room for them. a states clip with hands on
   would be a states clip composed differently, and then the file that answers
   "do the nine read as nine" would have stopped being a control. the second is
   that they are separately useful — a review of the hands wants the hands.

   seven poses in the order they were designed in, each with a face under it,
   and **the face is deliberately not `neutral` every time**: the question this
   chapter has to answer beyond "does the pose read" is whether a pose composes
   with an eye state or fights it. a facepalm over an unimpressed face and a
   thumb over a delighted one are the two that would show it.

   the sides are exercised in the middle of the run rather than at the end: one
   hand, then the other, then both again, so the persistence is on screen — the
   `side` outlives the pose that named it and the next mark that says nothing
   about it keeps one hand. */
const HANDS_CUT = [
  ['rest', 'neutral', undefined, 2.30],
  ['wave', 'curious', undefined, 2.60],
  ['thumbs-up', 'delighted', 'left', 2.40],
  ['facepalm', 'unimpressed', 'left', 2.80],
  ['shrug', 'thinking', 'both', 2.60],
  ['point', 'agreeing', 'right', 2.50],
  ['panic', 'surprised', 'both', 2.90],
  /* and back to rest, both hands, so the clip ends where it started and two
     copies of it butt together the way the export's clips do. */
  ['rest', 'neutral', 'both', 2.30],
];

function handsCut() {
  const marks = [];
  let t = 0.55;
  for (const [hands, state, side, room] of HANDS_CUT) {
    marks.push({ t: +t.toFixed(3), state, hands, side });
    t += room;
  }
  /* one bubble, on the shrug, because a thought beside a head with its hands
     out is the composition case this chapter can find and the states one
     cannot. it is put on the mark rather than given its own, so the hands and
     the words are on screen together. */
  marks[4].bubble = 'no idea';
  return { marks, seconds: +t.toFixed(3) };
}

/* where a caption box would sit in a clip that also carries this mascot: above
   the bottom corner, clear of it. the bubble may not enter it and the render
   measures that rather than trusting this comment.

   it moved up sixty px when the thought bubble replaced the filled one, and the
   guard is what said so — thirty three hits on the first render. the old bubble
   sat beside the head; this one climbs above it the way the site's does, so the
   cluster now reaches to about y 672 and a band starting at 392 ran straight
   through the pill. the band moved rather than the bubble, because climbing is
   what the site does and what the brief asked for. what this really records is
   the constraint a clip inherits: a mascot in the bottom corner owns the frame
   up to about 670, and captions live above that. */
const BAND = { x: 48, y: 330, w: VW - 96, h: 300 };

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the scene ----------
   the page's own two themes as tokens, and nothing else in the frame. `--body`
   is the caption face, because the bubble is a caption. */
function sceneHtml(plan, theme) {
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<title>mascot</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#ffffff; --fg:#0b0d10;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
}
[data-theme=dark]{ --bg:#06070a; --fg:#d5dbd8; }
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
.stage{position:relative;width:${VW}px;height:${VH}px}
/* load bearing, not decoration. with nothing animating at all chrome stops
   producing compositor frames and the screenshot call blocks on frame one
   forever — post2.mjs found this and every clip in demo/ has carried something
   like it since. the background here is meant to be nothing, so this is two
   pixels off frame rather than the vignette the posts use. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}
${mascotCss(plan)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
${mascotMarkup(plan)}
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
document.fonts.load('500 1em "Space Grotesk"')
  .then(() => document.fonts.ready)
  .then(() => { window.__built = window.__mas.build(); });
</script>
</body>
</html>`;
}

/* ---------- the rAF shim ----------
   nothing in this scene animates by hand — node holds the whole animation and
   the page writes what it is handed. the shim is installed and flushed once per
   capture anyway, so the layer runs under the same clock everything else in
   demo/ runs under from the day it is dropped into a real clip. a shim that
   only appears when it is needed is a shim nobody tests. */
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

/* ---------- render ---------- */
async function render(tag, theme, plan) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const frames = path.join(FRAMES, tag);
  const subs = path.join(SUBS, tag);
  for (const d of [frames, subs]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * plan.seconds);
  const { srv, port } = await serve(sceneHtml(plan, theme));
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
  for (let i = 0; i < 160; i++) {
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__mas && window.__mas.ready))) {
    throw new Error('the mascot scene never became ready');
  }
  /* offline the bubble renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to judge a caption on. */
  if (!await page.evaluate(() => document.fonts.check('500 20px "Space Grotesk"'))) {
    throw new Error('Space Grotesk did not load — the bubble would be judged in the mono fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const caps = await page.evaluate(() => window.__mas.caps());
  /* the glove's rendered size, and it has to be measured **after** a frame is
     on the element: the markup draws every finger stacked on its own base and
     `apply` is what fans them out, so `build` would report the palm and call it
     a hand. the frame chosen is the first hands mark at its own settled moment,
     which is the pose at rest and so the honest resting size. */
  if (plan.hands) {
    const hm = plan.marks.find(m => m.hands);
    await page.evaluate(fr => window.__mas.apply(fr),
      mascotFrame(plan, hm ? hm.hands.settled + 0.25 : 0.5));
    Object.assign(built.hands, await page.evaluate(() => window.__mas.gloveRect()));
  }
  console.log('  built: head ' + built.headPx + 'px, caps ' + caps.capPx + 'px, '
    + built.eyes + ' eyes, ' + built.brows + ' brows, ' + built.glows + ' glow layers');

  /* the head's clearance is computed off every frame rather than sampled off
     four a second, because it costs nothing to do it properly when the geometry
     is known. the page is left with the bubble, which is a dom box and is
     measured correctly by measuring it. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }

  let safeWorst = null, samples = 0, bandHits = 0, bandWorst = null;
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const frame = mascotFrame(plan, t);
      await page.evaluate(fr => window.__mas.apply(fr), frame);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      /* the safe area and the band, four times a second, on the whole frame
         rather than on the subframe: the mascot moves constantly and one sample
         proves nothing about the widest state. */
      if (k === 0 && f % Math.max(1, Math.round(FPS / 4)) === 0) {
        const sa = await page.evaluate((vw, vh) => window.__mas.bubbleSafe(vw, vh), VW, VH);
        if (sa) {
          samples++;
          if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
            < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
            safeWorst = { t: +t.toFixed(2), ...sa };
          }
        }
        const bd = await page.evaluate(() => window.__mas.band());
        if (bd && bd.hit) { bandHits++; if (!bandWorst) bandWorst = { t: +t.toFixed(2), ...bd }; }
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

  /* one still per state, at its settled moment, so the seven can be laid out
     side by side and judged as a strip rather than as a video. the frame is
     written explicitly every time, so re-applying an earlier one after the loop
     renders exactly as it did. */
  fs.mkdirSync(VERIFY, { recursive: true });
  for (const m of plan.marks) {
    /* the moment is the later of the two things the mark is holding: a pose
       settles after the face does, and a still of a hands mark taken on the
       face's own settled frame would photograph a hand still on its way. */
    const at = m.hands ? Math.max(m.hands.settled + 0.30, m.settled + 0.08)
      : (m.bubble ? m.bubble.full + 0.06 : m.settled + 0.08);
    const t = stillMoment(plan, at);
    await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(plan, t));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    /* the index is in the name because a state can appear twice in one cut now:
       `surprised` runs once straight on and once held at a turn, and two files
       called the same thing would be one file. */
    fs.writeFileSync(path.join(VERIFY, tag + '-' + String(m.i).padStart(2, '0') + '-' + m.state
      + (m.hands ? '+' + m.hands.pose + '.' + m.hands.side : '')
      + (m.turn != null ? '@' + m.turn : '') + '.png'), Buffer.from(shot.data, 'base64'));
  }

  const bubbleNear = safeWorst
    ? Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom) : null;
  console.log('  head, worst of ' + N + ' frames at ' + headWorst.t + 's: '
    + headWorst.left + ' left, ' + headWorst.top + ' top, ' + headWorst.right + ' right, '
    + headWorst.bottom + ' bottom (floor '
    + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  bubble, worst of ' + samples + ' samples' + (safeWorst
    ? ' at ' + safeWorst.t.toFixed(2) + 's: ' + safeWorst.left + ' left, ' + safeWorst.top
      + ' top, ' + safeWorst.right + ' right, ' + safeWorst.bottom + ' bottom'
    : ': never on screen at a sample'));
  console.log('  the shadow reaches to ' + headWorst.shadowBottom
    + 'px of the bottom and the glow another ' + headWorst.glowReach + 'px past the ink');
  console.log('  caption band: ' + (bandHits ? bandHits + ' HITS' : 'never entered'));

  await browser.close();
  srv.close();

  if (SUB > 1) blend(subs, frames, N);

  const state = { tag, theme, built, caps, head: headWorst, bubble: safeWorst,
    samples, bandHits, bandWorst, bubbleNear };
  fs.writeFileSync(path.join(OUT, 'mascot-' + tag + '.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the shutter ----------
   the subframes are averaged into frames, which is what a shutter is: a frame
   is the light that arrived over its own duration, not a sample of one instant.
   `tmix` averages a sliding window and `framestep` throws away the ones that
   straddle two output frames. post10's chain, unchanged. */
function blend(subs, frames, N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(subs, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(frames, 'f%05d.jpg')]);
}

/* ---------- the two files ----------
   always these two paths, always overwritten, and the render lands on top of
   whatever was there. see the note at the top for why the name carries nothing
   that can change. */
function encode(tag, wav) {
  const out = path.join(OUT, 'mascot-' + tag + '.mp4');
  const args = ['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, tag, 'f%05d.jpg')];
  if (wav) args.push('-i', wav);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS));
  if (wav) args.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
  args.push('-movflags', '+faststart', out);
  ff(args);
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
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
    audio: /Audio:\s*aac/.test(out),
  };
}

/* ---------- go ----------
   two chapters, and each is its own pair of files. `--chapter=states` is the
   clip this script has always rendered and it is untouched; `--chapter=hands`
   is the gloves; nothing named is both. they are not one clip because turning
   the gloves on moves the head in — see the hands cut above — and a control
   that changed when the thing being tested was added would have stopped being
   one. */
console.log('the boring tek — mascot state test');
const CHAPTERS = ['states', 'hands'];
if (CHAPTER_ARG && !CHAPTERS.includes(CHAPTER_ARG)) {
  console.error('no chapter called "' + CHAPTER_ARG + '" — the two are ' + CHAPTERS.join(', '));
  process.exit(1);
}
const want = CHAPTER_ARG ? [CHAPTER_ARG] : CHAPTERS;
const themes = WANT.length ? WANT : THEMES;

const CUTS = {
  states: { ...cut(), opts: {} },
  hands: { ...handsCut(), opts: { hands: true } },
};

const mb = f => (fs.statSync(f).size / 1e6).toFixed(2) + ' MB';
const results = [];
const reports = {};

for (const chapter of want) {
  const { marks, seconds, opts } = CUTS[chapter];
  console.log('\n════ ' + chapter + ' ════');
  const plans = Object.fromEntries(themes.map(th =>
    [th, planMascot({ marks, seconds, theme: th, band: BAND, ...opts })]));
  const plan0 = plans[themes[0]];
  console.log(describeMascot(plan0));
  /* the render's own rate, for the log, and sixty for the guards. the entry,
     overshoot and settle numbers are properties of the animation rather than of
     the pass it is being sampled at: at the twelve frame preview an
     anticipation that lasts four sixtieths falls inside one frame, and judging
     it there would say the wind up is missing when what is missing is the
     sampling. */
  const rep = mascotMotion(plan0, FPS, seconds);
  console.log(describeMotion(rep));
  const rep60 = FPS === 60 ? rep : mascotMotion(plan0, 60, seconds);
  if (FPS !== 60) {
    console.log('  and at sixty, which is what the motion guards read:');
    console.log(describeMotion(rep60));
  }
  reports[chapter] = { rep60, marks, seconds, plan0 };

  /* the sound. two kinds of cue, and it is rendered once per chapter because
     the picture is the same in both themes — a theme is colour and nothing
     else. */
  const cues = mascotCues(plan0);
  const { buf: sfx } = renderSfx(cues, seconds);
  const peak = limit(sfx, -1.0);
  const wav = path.join(OUT, 'mascot-' + chapter + '-sfx.wav');
  writeWav(wav, sfx);
  console.log('  sound: ' + cues.length + ' cues, peak ' + peak.peak + ' dBFS, '
    + cues.map(c => c.kind + '@' + c.t.toFixed(2)).join(' '));

  for (const theme of themes) {
    const tag = chapter === 'states' ? theme : 'hands-' + theme;
    console.log('\n' + tag);
    const state = ONLY_ENCODE
      ? JSON.parse(fs.readFileSync(path.join(OUT, 'mascot-' + tag + '.json'), 'utf8'))
      : await render(tag, theme, plans[theme]);
    const file = encode(tag, wav);
    results.push({ chapter, tag, theme, state, file, probe: probe(file), seconds });
  }
}

console.log('\nrendered');
for (const r of results) {
  console.log('  ' + r.tag.padEnd(12) + r.probe.w + 'x' + r.probe.h + ' @' + r.probe.fps + 'fps  '
    + r.probe.seconds.toFixed(2) + 's  ' + (r.probe.audio ? 'with sfx' : 'SILENT')
    + '  ' + mb(r.file) + '  ' + path.relative(ROOT, r.file));
}
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
console.log('  a still per mark, every theme, in ' + path.relative(ROOT, VERIFY));

if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
}

/* ---------- the guards ----------
   per chapter, because the two ask different questions of the same rig: the
   states clip has a turn sweep in it and the hands clip does not, and a guard
   that ran on both would either be loose enough to pass the wrong one or would
   fail the right one. what they share is the file, the safe area and the
   engine's own per state report, and those are checked on both. */
const fail = [];
const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);
for (const { tag, chapter, state, probe: p, seconds } of results) {
  const t = tag + ': ';
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push(t + 'not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push(t + 'not ' + FPS + 'fps');
  if (Math.abs(p.seconds - seconds) > 0.25) fail.push(t + p.seconds + 's, wanted ' + seconds);
  if (!p.audio) fail.push(t + 'no audio track — the pop and the ding did not mux');
  /* the head and the type, measured off what painted rather than off the plan's
     arithmetic. */
  if (state.built.headPx < HEAD_PX.min || state.built.headPx > HEAD_PX.max) {
    fail.push(t + 'the head rendered at ' + state.built.headPx + 'px, window is '
      + HEAD_PX.min + ' to ' + HEAD_PX.max);
  }
  if (state.caps.capPx < BUBBLE.minCap) {
    fail.push(t + 'the bubble caps rendered at ' + state.caps.capPx + 'px, floor is ' + BUBBLE.minCap);
  }
  /* chrome floors border-width to a whole css pixel, so a fractional stroke
     silently halves. this is the check that catches that, off the computed
     style rather than off what was typed. */
  if (state.built.strokePx < 3.5) {
    fail.push(t + 'the bubble outline rendered at ' + state.built.strokePx + 'px, wanted four');
  }
  if (state.built.bubbleGapPx > 20) {
    fail.push(t + 'the bubble sits ' + state.built.bubbleGapPx + 'px off the head, wanted about ten');
  }
  /* the safe area, against the drawn ink rather than against the box anything
     was told to draw in, and the head and the bubble are checked separately
     because they are measured differently and for good reason. the glow is in
     neither: a thirty pixel blur crossing a safe line is not ink crossing it.

     `headRect` grows to hold the gloves when a plan has them, so on the hands
     chapter this one line is the hands' own safe area check as well — which is
     what it should be, because a resting hand is the piece of ink nearest the
     border and there is no reading of "the mascot clears the chrome" that
     leaves it out. */
  if (state.head.near < floor - 0.5) {
    fail.push(t + 'the ink comes within ' + Math.round(state.head.near)
      + 'px of a border at ' + state.head.t + 's, floor is ' + floor);
  }
  if (state.bubbleNear != null && state.bubbleNear < floor - 0.5) {
    fail.push(t + 'the bubble comes within ' + Math.round(state.bubbleNear)
      + 'px of a border at ' + state.bubble.t + 's, floor is ' + floor);
  }
  if (!state.samples) fail.push(t + 'the bubble was never sampled on screen');
  if (state.bandHits) {
    fail.push(t + 'the bubble entered the caption band ' + state.bandHits + ' times, first at '
      + state.bandWorst.t + 's');
  }
  /* the gloves as they actually painted, and the two numbers the brief asks a
     render to report: how big a hand is at this head size, and how thick the
     separation edge is. both in device px at 1080 wide, which is the only unit
     "does it read on a phone" can be argued in. */
  if (chapter === 'hands') {
    const H = state.built.hands;
    if (!H) fail.push(t + 'the hands chapter rendered no gloves');
    else {
      if (H.gloves !== 4) fail.push(t + H.gloves + ' glove groups, wanted four: two hands, two layers');
      /* the band is a share of the head rather than a number, and it is on the
         **palm** rather than on the whole hand: the mitt is the same size in
         every pose, where the hand's own box swings by a third between a fist
         and an open hand and would say as much about the pose as about the
         drawing. the reference's palm is 93px of a 244px head, which is 0.381,
         and the drawn one is 0.383. under a third the gesture stops reading at
         phone size and the honest fix is a bigger hand rather than more detail
         in it; over 0.45 the pair stops reading as hands and starts reading as
         mittens. */
      const share = H.palmPx / state.built.headPx;
      if (share < 0.33 || share > 0.45) {
        fail.push(t + 'the mitt rendered ' + H.palmPx + 'px wide against a ' + state.built.headPx
          + 'px head, which is ' + share.toFixed(3) + ' of it — the band is 0.33 to 0.45'
          + ' and the reference is 0.381');
      }
      if (H.edgePx < 2.8 || H.edgePx >= 4.25) {
        fail.push(t + 'the separation edge rendered at ' + H.edgePx + 'px — under 2.8 the encoder '
          + 'eats it, and 4.25 is the weight of the reference’s own finger lines, which it is '
          + 'meant to be under');
      }
      console.log('  ' + t + 'a glove is ' + H.wPx + 'x' + H.hPx + 'px and its mitt '
        + H.palmPx + 'px, against a ' + state.built.headPx + 'px head — mitt '
        + share.toFixed(3) + ' of it, reference 0.381 — edge ' + H.edgePx + 'px ('
        + H.edgeUnits + ' grid units)');
    }
  }
}

for (const chapter of want) {
  const { rep60, marks } = reports[chapter];
  const c = chapter + ': ';
  /* the engine's own report, checked rather than printed. these are the numbers
     the brief asks for per state and they are guards, not notes. */
  for (const st of rep60.states) {
    if (st.entryFrames == null) fail.push(c + st.state + ' never reached its own mark');
    else if (st.entryFrames < 3) fail.push(c + st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
    /* the ones that deliberately do not wind up, and they are named rather than
       excused by a loose threshold: `neutral` is a breath, `unimpressed` is a
       sink, and a mark that merely holds the turn somewhere is a hold rather
       than a gesture. */
    const held = marks.find(m => m.state === st.state && m.t === st.at);
    const noAnti = ['neutral', 'unimpressed'].includes(st.state) || (held && held.turn != null);
    if (!noAnti && st.antiFrames < 2) {
      fail.push(c + st.state + ' has no anticipation, only ' + st.antiFrames + ' frames back');
    }
    if (st.state !== 'unimpressed' && !(st.overshoot > 1)) {
      fail.push(c + st.state + ' arrives with no overshoot, which is a hard stop');
    }
  }
  /* nothing may paint outside the head. the features are clipped in the markup
     so it cannot happen on screen; this is the check that the clip never had to
     do it, because a clip quietly trimming a pose is still a pose that does not
     fit. it is measured on the geometry, in grid units, positive when a feature
     corner is past the silhouette. the gloves are deliberately not in it: they
     are ink that is supposed to be outside the head. */
  if (rep60.outside.units > 0) {
    fail.push(c + 'feature ink lands ' + rep60.outside.units.toFixed(2)
      + ' units outside the head silhouette at ' + rep60.outside.at.toFixed(2)
      + 's — the clip is hiding it, but the pose does not fit');
  }
  if (rep60.blinks.repeatsInARow) fail.push(c + rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
  if (rep60.frozenFrames) fail.push(c + rep60.frozenFrames + ' frames where the face is not moving at all');
  if (rep60.maxSquash > 0.08 + 1e-6) fail.push(c + 'the squash reached ' + (rep60.maxSquash * 100).toFixed(1) + '%');
  if (rep60.maxBreathe >= 0.02) fail.push(c + 'breathing reached ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

  if (chapter === 'states') {
    /* the turn's own claims, and they are the reason that chapter's second half
       exists. */
    const T = rep60.turn;
    if (T.lo > -0.99 || T.hi < 0.99) {
      fail.push(c + 'the sweep only reached ' + T.lo.toFixed(2) + '..' + T.hi.toFixed(2)
        + ', so the ends were never on screen');
    }
    /* a flat turn has no depth to hide a jump behind, so the ceiling is set on
       what the step moves the far eye by rather than on the channel's own
       number, which is a unit nobody looks at.

       five units is deliberately loose and the reason is `snap-back`: it whips
       0.99 of the range in 0.44s and peaks at 2.9 units in a frame, which is
       the fastest turn in the file **on purpose**. the numbers either side of
       it decay smoothly — 1.50, 2.84, 2.87, 2.48, 2.00, 1.51 — so it is a fast
       move rather than a step. a real discontinuity is not near this line:
       teleporting from 0.85 to zero in one frame is 11.9 units. the tight
       ceiling still exists where it belongs, on a pure sweep with no whip in
       it, in the engine's own self test at 1.2 units. sustained turns may not
       step; a snap is allowed to snap. */
    const eyeStep = rep60.worst.turn.d * (TURN.shift + TURN.wrap);
    if (eyeStep > 5) {
      fail.push(c + 'the turn teleports: one frame moves the far eye ' + eyeStep.toFixed(2)
        + ' units at ' + rep60.worst.turn.t.toFixed(2) + 's');
    }
    if (T.squeeze < 0.05) fail.push(c + 'the card only squeezed ' + (T.squeeze * 100).toFixed(1) + '%');
    if (T.offsetPx < 30) fail.push(c + 'the eyes only travelled ' + T.offsetPx.toFixed(0) + 'px');
    if (T.gap > T.gapWas - 3) fail.push(c + 'the gap between the eyes barely closed, ' + T.gap.toFixed(1));
    /* an eye sitting on its clamp is an eye that stopped moving, and a flat spot
       is the one thing that would give the cheat away. a handful of frames in
       the held section is the clamp doing its job; a lot of them means a state
       is asking for more than the face has room for. */
    if (T.clampedFrames > rep60.frames * 0.06) {
      fail.push(c + 'an eye was on the composition clamp for ' + T.clampedFrames
        + ' of ' + rep60.frames + ' frames');
    }
  }

  if (chapter === 'hands') {
    /* ---------- the gloves ----------
       the same three questions the states are asked — does it wind up, does it
       go past its own mark, does it settle — plus the two this part brought
       with it: does a hand ever move faster than a viewer can follow, and did
       the placement hold room for the reach the frames actually make. */
    const seenPose = new Set(), seenSide = new Set();
    for (const p of rep60.poses) {
      seenPose.add(p.pose); seenSide.add(p.side);
      if (p.entryFrames == null) fail.push(c + p.pose + ' never reached its own mark');
      else if (p.entryFrames < 3) fail.push(c + p.pose + ' arrives in ' + p.entryFrames + ' frames, which is a cut');
      /* `rest` is the declared exception on the wind up and it is the same one
         `neutral` is: the only thing it does is arrive at rest, and pulling
         away from rest first would be a gesture rather than a release. */
      if (p.pose !== 'rest' && p.antiFrames < 2) {
        fail.push(c + p.pose + ' has no anticipation, only ' + p.antiFrames + ' frames back');
      }
      if (!(p.overshoot > 1)) fail.push(c + p.pose + ' arrives with no overshoot, which is a hard stop');
    }
    if (seenPose.size !== HAND_POSE_NAMES.length) {
      fail.push(c + 'the cut only exercises ' + [...seenPose].join(', ')
        + ' — the seven are ' + HAND_POSE_NAMES.join(', '));
    }
    /* one hand, the other one, and two. a cut that never named a side would
       leave half of what this part is untested. */
    for (const sd of HAND_SIDES) {
      if (!seenSide.has(sd)) fail.push(c + 'no pose in the cut is on side "' + sd + '"');
    }
    const H = rep60.hands;
    /* twelve css px, and the number is the glove's own size rather than a
       feeling: it is 66 device px across, so twelve css px is twenty four of
       them, under a third of its own width in a frame. the yap hand's ceiling
       is eight because that one is measuring a twelve pixel fingertip, for
       which eight css px is more than its own width and smears. */
    if (H.stepCss > 12) {
      fail.push(c + 'a hand moves ' + H.stepCss.toFixed(2) + ' css px in one frame at '
        + H.stepAt.toFixed(2) + 's, which is a jump rather than a move');
    }
    /* the placement held room for the gloves off this same plan's frames. if
       the drawn ink ever goes past what was held, the head is standing in the
       wrong place and the safe area check above is measuring a promise rather
       than the picture. */
    if (H.overrun > 0.001) {
      fail.push(c + 'the hands reach ' + H.overrun.toFixed(2)
        + ' grid units past what the placement held room for');
    }
    if (!H.onFrames[0] || !H.onFrames[1]) {
      fail.push(c + 'one of the two hands was never on screen: ' + H.onFrames.join('/')
        + ' of ' + rep60.frames + ' frames');
    }
    console.log('  ' + c + 'the gloves reach '
      + [H.reach.l, H.reach.r, H.reach.t, H.reach.b].map(v => v.toFixed(1)).join('/')
      + ' units past the plate, fastest frame moves one ' + H.stepCss.toFixed(2) + ' css px');
  }
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
