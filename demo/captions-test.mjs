/* the boring tek — the caption style test.

   three five second clips, one per style in lib/captions.mjs, rendered so the
   three can be judged against each other rather than described. this is not a
   post and it is not wired into one. it exists to answer one question: which of
   these three do we want on the next clip.

     node captions-test.mjs                 all three, 1080x1920, 60fps
     node captions-test.mjs pop             just one of them
     DEMO_FPS=12 node captions-test.mjs     the fast preview pass
     node captions-test.mjs --encode-only   re-encode from kept frames

   the rig is post5.mjs's, unchanged: a local server, headless chrome under cdp
   virtual time, the rAF shim, `Page.captureScreenshot` with `clip.scale` for
   device pixels, ffmpeg on the end, and a safe area measured rather than
   assumed. three things are different and all three are on purpose.

   1. **there is a voice, and it is in the file.** every other clip in demo/
      renders `-an` because sound is added in the edit. a caption test is the
      one case where the sound is the thing being tested: the whole claim is
      that the words land on the frames they are said on, and a silent clip
      cannot show that. so lib/voice.mjs speaks the line, the words come back
      with the engine's own timestamps, and the mp3 is muxed onto the video.

   2. **the copy is different per style**, because the styles are not
      interchangeable. `pop` wants short declarative beats, `type` wants a
      sentence that reads, `count` wants figures. giving all three the same line
      would flatter one of them and libel the other two.

   3. **there is no mascot.** he would be the thing being looked at, and the
      caption is the thing being judged.

   the voice files are cached in out/voice/, so a second run does not go near
   the endpoint. delete them to re-cut the audio. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  planCaptions, captionCss, captionMarkup, captionPage, captionFrame,
  describe, brandTokens, STYLES,
} from './lib/captions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-captions');
const VERIFY = path.join(OUT, 'verify-captions');

const FPS = Number(process.env.DEMO_FPS || 60);
const SECONDS = 5.00;
const N = Math.round(FPS * SECONDS);
const STEP = 1000 / FPS;
const DSF = 2;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const WANT = argv.filter(a => STYLES.includes(a));

/* ---------- the cut ----------
   one vertical frame, the same 540x960 css at 2x every other clip uses. the
   caption box is the interesting number: it starts below the middle and stops
   84px above the wordmark, so a three line stack in the calm style still has
   air over the signature. everything the engine draws lives inside it. */
const VW = 540, VH = 960, SAFE = 48;
const BOX = { x: SAFE, y: 470, w: VW - SAFE * 2, h: 300 };
const WORDMARK_CY = 854, WORDMARK_W = 250;

/* ---------- the copy ----------
   one line per style, written for that style. no dashes, and planCaptions
   checks that rather than trusting this comment. */
const SCRIPTS = {
  pop: 'your team does this by hand. every day. we delete it.',
  type: 'the agent answers the email, files the invoice, and books the call.',
  count: '40 hours a week. 3 minutes a day. 0 spreadsheets.',
};
/* per style plan options. the defaults are good; these are the two knobs a
   real clip would actually reach for. */
const OPTS = {
  pop: { style: 'pop', perCard: 3 },
  /* the calm style wraps at 28 characters and is allowed up to 30px. at 22 and
     26 it left 254 device px of the box unused on each side, which reads as a
     caption that is afraid of the frame. */
  type: { style: 'type', wrapAt: 28, maxLines: 3, bodySize: 30 },
  count: { style: 'count' },
};

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the voice, cached ----------
   the sidecar json is the cache key. if it is there and it is for this line,
   the endpoint is left alone. */
async function voiceFor(style) {
  const text = SCRIPTS[style];
  const cached = path.join(VOICE_OUT, 'captest-' + style + '-calm.json');
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === text && fs.existsSync(j.file)) {
      console.log('  ' + style + ': voice from cache, ' + j.seconds.toFixed(2) + 's');
      return j;
    }
  }
  const r = await speak(text, { voice: 'calm', name: 'captest-' + style });
  console.log('  ' + style + ': voice ' + r.seconds.toFixed(2) + 's, ' + r.words.length
    + ' words, timings from the ' + r.timing);
  return r;
}

/* ---------- the scene ---------- */
function sceneHtml(plan) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>captions</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${captionCss(plan, BOX)}
/* the vignette, on the site's own 34s loop. load bearing, not decoration: with
   nothing animating at all chrome stops producing compositor frames and
   Page.captureScreenshot blocks on frame one forever. post2.mjs found this. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1}
/* the wordmark, dim, at 89%. the lockup subline's treatment, which is the one
   place the brand puts michroma at a small size. */
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  text-indent:.09em;
}
/* the box itself, drawn only when asked for. it is a development aid and it is
   never on in a render that ships. */
.boxline{position:absolute;left:${BOX.x}px;top:${BOX.y}px;width:${BOX.w}px;height:${BOX.h}px;
  outline:1px dashed var(--line);z-index:9;display:none}
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage">
  <div class="wordmark" id="wordmark">the boring tek</div>
  <div class="boxline"></div>
  <!-- a swatch of the accent, off frame, so a render can ask what the accent
       actually computes to in this theme instead of parsing a token string. -->
  <span id="accent-probe" style="position:absolute;left:-999px;color:var(--accent)">a</span>
${captionMarkup(plan)}
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(plan)};
window.__CAP_BOX = ${JSON.stringify(BOX)};
${captionPage.toString()}
captionPage();
/* the wordmark is fitted rather than sized, measured in caps because
   text-transform is invisible to measureText, so tracking or a longer name can
   never push it into the safe area. lifted from post5.mjs. */
document.fonts.load('400 1em Michroma')
  .then(() => document.fonts.load('500 1em "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (${WORDMARK_W} / em).toFixed(3) + 'px';
    window.__built = window.__cap.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the rAF shim ----------
   nothing in this scene animates by hand, so nothing here needs it. it is
   installed anyway, and flushed once per captured frame, so that the moment a
   caption is dropped into a real clip it is already running under the same
   clock the mascot and the decode run under. a shim that only appears when it
   is needed is a shim nobody tests. */
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
async function render(style, plan) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const frames = path.join(FRAMES, style);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const { srv, port } = await serve(sceneHtml(plan));
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
      { name: 'prefers-color-scheme', value: 'light' },
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
  for (let i = 0; i < 120; i++) {
    const ok = await page.evaluate(() => !!(window.__cap && window.__cap.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__cap && window.__cap.ready))) {
    throw new Error('the caption scene never became ready');
  }
  /* offline the whole thing renders in the mono fallback and looks almost
     right, which is the worst kind of wrong to judge a type style on. */
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('40px Michroma'),
    grotesk: document.fonts.check('400 20px "Space Grotesk"'),
    grotesk500: document.fonts.check('500 20px "Space Grotesk"'),
  }));
  for (const [k, v] of Object.entries(faces)) {
    if (!v) throw new Error(k + ' did not load — the style would be judged in the mono fallback');
  }
  const built = await page.evaluate(() => window.__built);
  console.log('  fitted: ' + JSON.stringify(built));

  const safeSamples = [];
  let safeWorst = null;
  let sawAccent = false, maxVisible = 0, moved = 0;
  let prev = null;

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const frame = captionFrame(plan, t);
    const seen = await page.evaluate(fr => {
      window.__cap.apply(fr);
      /* what actually rendered, read back rather than assumed: how many groups
         are visible at once, and whether the accent is painted anywhere.

         painted, not "has the active role". the calm style gives the word being
         said the same role number and answers it with weight 500 instead of a
         colour, so asking about the role would say yes for a style whose whole
         claim is that it never reaches for the accent. the swatch off frame is
         what the accent computes to in whichever theme is on. */
      const accent = getComputedStyle(document.getElementById('accent-probe')).color;
      const vis = [...document.querySelectorAll('.cap-card,.cap-line,.cap-count')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden'
          && parseFloat(getComputedStyle(el).opacity) > 0.02);
      const acc = vis.some(g => [g, ...g.querySelectorAll('*')]
        .some(el => getComputedStyle(el).color === accent));
      return { vis: vis.length, acc };
    }, frame);
    if (seen.acc) sawAccent = true;
    maxVisible = Math.max(maxVisible, seen.vis);

    /* did anything move between these two frames. the sum is a fingerprint, not
       a measurement: all it has to prove is that the scene is not a still. */
    const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0) + frame.r.reduce((a, x) => a + x, 0);
    if (prev !== null) moved = Math.max(moved, Math.abs(sum - prev));
    prev = sum;

    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);

    /* the safe area, four times a second. the caption changes shape constantly
       in every style, so one sample proves nothing about the widest state. */
    if (f % Math.max(1, Math.round(FPS / 4)) === 0) {
      const sa = await page.evaluate((vw, vh) => window.__cap.safe(vw, vh), VW, VH);
      if (sa.worst !== null) {
        safeSamples.push({ t: +t.toFixed(2), ...sa });
        if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
          < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) safeWorst = { t, ...sa };
      }
    }

    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(frames, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);

    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  /* one still per theme, at the busiest moment of the clip, so the pair can be
     put side by side. the caption is written explicitly every frame, so a frame
     from earlier in the clip can be re-applied after the loop and it renders
     exactly as it did. */
  const busiest = plan.groups[Math.min(1, plan.groups.length - 1)];
  const tStill = (busiest.in + busiest.out) / 2;
  fs.mkdirSync(VERIFY, { recursive: true });
  for (const theme of ['light', 'dark']) {
    await page.evaluate((th, fr) => {
      document.documentElement.setAttribute('data-theme', th);
      window.__cap.apply(fr);
    }, theme, captionFrame(plan, tStill));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, style + '-' + theme + '.png'), Buffer.from(shot.data, 'base64'));
  }

  const dev = v => Math.round(v * DSF);
  console.log('  safe area, worst of ' + safeSamples.length + ' samples at '
    + safeWorst.t.toFixed(2) + 's: ' + dev(safeWorst.left) + 'px left, ' + dev(safeWorst.top)
    + ' top, ' + dev(safeWorst.right) + ' right, ' + dev(safeWorst.bottom)
    + ' bottom (floor ' + SAFE * DSF + ', tightest is ' + safeWorst.worst + ')');
  console.log('  at most ' + maxVisible + ' group(s) on screen at once, accent role seen: ' + sawAccent);

  await browser.close();
  srv.close();

  const state = { style, built, safe: safeWorst, samples: safeSamples.length,
    sawAccent, maxVisible, moved, groups: plan.groups.length, cells: plan.cells.length };
  fs.writeFileSync(path.join(OUT, 'captions-' + style + '.json'), JSON.stringify(state, null, 2));
  return state;
}

/* ---------- encode ----------
   the clips' own settings, plus the voice. the audio is shorter than the video
   and that is left alone: with no -shortest the output runs to the longest
   stream, so the clip keeps its full five seconds and ends on silence, which is
   what a caption test should do. */
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function encode(style, voiceFile) {
  const out = path.join(OUT, 'captions-' + style + '-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, style, 'f%05d.jpg'),
    '-i', voiceFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart', out]);
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

/* ---------- go ---------- */
console.log('the boring tek — caption style test');
brandTokens();     /* fail here, before three renders, if a token has moved */
const styles = WANT.length ? WANT : STYLES;
const results = [];

for (const style of styles) {
  console.log('\n' + style);
  const voice = await voiceFor(style);
  const plan = planCaptions(voice.words, OPTS[style]);
  console.log(describe(plan));
  if (plan.seconds > SECONDS) {
    throw new Error(style + ': the caption runs to ' + plan.seconds.toFixed(2)
      + 's, past the ' + SECONDS.toFixed(2) + 's clip. shorten the line in SCRIPTS.');
  }
  const state = ONLY_ENCODE
    ? JSON.parse(fs.readFileSync(path.join(OUT, 'captions-' + style + '.json'), 'utf8'))
    : await render(style, plan);
  const file = encode(style, voice.file);
  results.push({ style, plan, voice, state, file, probe: probe(file) });
}

console.log('\nrendered');
const mb = f => (fs.statSync(f).size / 1e6).toFixed(2) + ' MB';
for (const r of results) {
  console.log('  ' + r.style.padEnd(6) + r.probe.w + 'x' + r.probe.h + ' @' + r.probe.fps + 'fps  '
    + r.probe.seconds.toFixed(2) + 's  ' + (r.probe.audio ? 'with voice' : 'SILENT')
    + '  ' + mb(r.file) + '  ' + path.relative(ROOT, r.file));
}
console.log('  stills for both themes in ' + path.relative(ROOT, VERIFY));

if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

/* ---------- the guards ---------- */
const fail = [];
for (const { style, plan, state, probe: p } of results) {
  const tag = style + ': ';
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push(tag + 'not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push(tag + 'not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(tag + p.seconds + 's, wanted ' + SECONDS);
  if (!p.audio) fail.push(tag + 'no audio track — the voice did not mux and sync cannot be judged');
  /* the safe area, against the drawn ink rather than against the box it was
     told to draw in. */
  const sa = state.safe;
  const near = Math.min(sa.left, sa.top, sa.right, sa.bottom) * DSF;
  if (near < SAFE * DSF - 0.5) {
    fail.push(tag + sa.worst + ' comes within ' + Math.round(near) + 'px of a border, floor is ' + SAFE * DSF);
  }
  /* one group at a time. the plan clamps every group's exit against the next
     one's entrance, so two visible at once means the clamp did not hold. `type`
     is the exception and is meant to stack. */
  if (style !== 'type' && state.maxVisible > 1) {
    fail.push(tag + state.maxVisible + ' groups were on screen at once, wanted one');
  }
  if (style === 'type' && state.maxVisible < 2) {
    fail.push(tag + 'the lines never stacked — the calm style is meant to hold more than one');
  }
  /* the accent word. `type` deliberately has none, so the check runs the other
     way round for it: an accent appearing there would be a regression. */
  if (style !== 'type' && !state.sawAccent) fail.push(tag + 'no word ever reached the accent role');
  if (style === 'type' && state.sawAccent) fail.push(tag + 'the calm style painted an accent, which it must not');
  /* a still frame passes every check above. this is the one that catches it. */
  if (!(state.moved > 0.01)) fail.push(tag + 'nothing moved between any two frames');
}
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
