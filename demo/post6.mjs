/* the boring tek — social clip #6, "3 things ai should not do in your business".
   renders out/post6-1080x1920.mp4, with the voice in the file. tooling, not the
   site: nothing here ships, nothing here edits index.html.

   this is the first clip built on the new machine, and it is a different kind of
   clip from the five before it.

   ---------- what is new ----------

   1. **the voice comes first and everything else follows it.** `lib/voice.mjs`
      speaks the script in the default calm voice and hands back the words with
      the synthesiser's own timestamps. those timestamps are the timeline: the
      captions are cut from them, the clip's length is the voice's length plus a
      tail, and the mascot's gaze is keyed against the beats in them. nothing in
      this file types a caption time by hand.

   2. **the captions are the copy.** post2 through post5 all hold a statement at
      the top for the whole clip and use the bubble for the beats. there is no
      statement here and there is no bubble. `lib/captions.mjs` in its `pop`
      style is the text, word by word, in michroma caps, with the word being
      said in the accent.

   3. **the numbers are beats.** `one.` `two.` `three.` are the spine of the
      script and the voice already leaves about seven tenths of a second of air
      around each of them. those three cards are marked `emphasise` in the plan,
      which fits them on their own and draws them accent all the way through, so
      a beat in the writing is a beat on screen. they land at 44px against the
      ordinary cards' 30, which is the brand's hero cap and is not raised for a
      video.

   4. **the audio is in the mp4.** every other clip in demo/ renders `-an`
      because sound is added in the edit. this one carries its own voice,
      because the voice is what the clip is cut against and a silent file cannot
      be checked for sync.

   5. **the mascot is smaller, lower and calmer.** 96px against post5's 136, in
      the lower third rather than the middle, and the gaze is up at the captions
      for most of the clip: he is listening to the advice, not delivering it. the
      furthest he looks is 2.33 units of the page's 6, where post5 went to 5.04.
      thirteen turns in twenty two seconds, all of them slow, and the blinks are
      3.0 to 4.4 seconds apart against post5's 1.45 to 2.60. he comes to the
      viewer once, at 17.95, for `good ai has a human behind it`, and stays there
      for the rest of the clip. that one move is the whole performance.

   vertical only. there is no square cut: a caption, a head and a wordmark do not
   fit inside a 1080 tall frame with the air each of them needs.

     node post6.mjs                  the clip
     DEMO_FPS=12 node post6.mjs      the fast preview pass
     node post6.mjs --encode-only    re-encode from kept frames
*/

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
  describe, brandTokens,
} from './lib/captions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* under out/, which is gitignored whole, and in its own folder so a record.mjs
   run cannot wipe it mid flight. */
const FRAMES = path.join(OUT, 'frames-post6');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = 2;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');

/* ---------- the script ----------
   honest advice, which is the whole angle: it is the only kind of ai post that
   is worth anything from a shop that sells ai. no dashes, and planCaptions
   checks that rather than trusting this comment.

   the numerals are written as words except the `3` in the opening line, which
   is a headline number and reads as one. the three counted items are `one.`
   `two.` `three.` rather than digits, because they are said out loud and a
   digit on screen against a word in the ear is the sort of small wrongness
   nobody can name but everybody feels. */
const SCRIPT = '3 things ai should not do in your business. '
  + 'one. talk money with clients alone. a human checks the deal. '
  + 'two. touch customer data without rules. decide what it can see first. '
  + 'three. work without checking. ai makes mistakes. someone must look. '
  + 'good ai has a human behind it. that is the whole secret.';

/* the cards that get the bigger moment. tested against the card's words as one
   string, so it is the whole card that has to be the beat rather than a word
   inside a longer one. */
const BEAT = /^(one|two|three)\.$/i;
const BEATS_EXPECTED = 3;

/* ---------- the cut ----------
   css px in a 540x960 viewport; device px are double. SAFE is 48, which is the
   96 device px nothing is allowed inside.

   the vertical budget, top to bottom:
     ~510..550   the caption, one card at a time, bottom anchored on 550
      654..750   the mascot, 96px, centred
     ~846..862   the wordmark

   the caption is bottom anchored inside its box rather than centred in it, so
   an emphasised card at 44px and an ordinary one at 30px sit on the same
   baseline and grow upward. a card that changed its vertical centre between
   beats would read as the frame jumping.

   the empty top half is deliberate and it is the site's own habit: the page is
   mostly air and the clip should be too. it is also where a platform puts
   nothing, which makes it the safest place to have nothing. */
const VW = 540, VH = 960, SAFE = 48;
const BOX = { x: SAFE, y: 300, w: VW - SAFE * 2, h: 250 };
const MASCOT = 96, MASCOT_TOP = 654;
const WORDMARK_CY = 854, WORDMARK_W = 250;
/* how much clear air the caption owes the head. the caption is the thing that
   moves, so this is checked against the drawn card on every sample rather than
   assumed from the box. */
const HEAD_CLEARANCE = 60;
/* the clip runs on past the last word, so it does not cut on a full stop. the
   mascot is still moving and still blinking through all of it. */
const TAIL = 0.65;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- easing ----------
   post5's solver, so the clip moves on the curves the site moves on. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dfx = t => (3 * ax * t + 2 * bx) * t + cx;
  const fy = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = fx(t) - x, d = dfx(t);
      if (Math.abs(e) < 1e-6) return fy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e > 0) hi = t; else lo = t;
      t = (lo + hi) / 2;
    }
    return fy(t);
  };
}
const EASE_OUT = bezier(.22, 1, .36, 1);
const EASE_IO = bezier(.45, 0, .55, 1);      /* gaze turns, calm at both ends */
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

/* ---------- the eye choreography ----------
   the brief is an advisor listening to advice, so the gaze is steady and the
   one move that matters is the last one.

   he is *below* the captions in this frame, so up is negative --ey and he
   spends most of the clip there, reading. the three number beats each get a
   small lift to the highest point he uses, arriving a tenth of a second before
   the word lands. between them he comes down a little, which reads as
   considering rather than as looking away.

   at 17.95, on `good ai has a human behind it`, he leaves the captions and
   comes to the viewer, and he stays there to the end. that is the only time in
   twenty two seconds he looks at the person watching, which is what makes it
   land. deadpan, no reaction, no widening: the line is the reaction.

   every key is [second, units], eased with EASE_IO, and a repeated value is a
   deliberate hold. the two tracks share their key times so a turn is one
   movement rather than two on different clocks.

   the site's own clamps are EX=6 and EY=3.8. the furthest this clip goes is
   2.33 combined, against post5's 5.04, and no turn is faster than 2.22 units in
   0.65s. that is the calm the brief asked for, in numbers. */
const EYE_KEYS = [
  [0.00, 0.0], [0.95, 0.0],       /* up at the words from frame zero */
  [1.60, -1.2], [2.40, -1.2],     /* a small drift, reading across */
  [3.05, 0.4], [4.15, 0.4],       /* up to "one." at 3.14, and holds the beat */
  [4.85, 1.3], [5.85, 1.3],
  [6.50, -0.9], [6.90, -0.9],
  [7.45, 0.4], [8.65, 0.4],       /* up to "two." at 7.53 */
  [9.35, -1.4], [10.55, -1.4],
  [11.25, 1.1], [12.10, 1.1],
  [12.72, 0.4], [13.95, 0.4],     /* up to "three." at 12.81 */
  [14.65, -1.1], [16.00, -1.1],
  [16.70, 0.9], [17.35, 0.9],
  [17.95, 0.0], [20.05, 0.0],     /* comes to the viewer, and stays */
  [20.65, 0.0], [21.70, 0.0],
  [22.20, -0.6],                  /* still moving when the file ends */
];
const EYE_Y_KEYS = [
  [0.00, -1.6], [0.95, -1.6],
  [1.60, -1.9], [2.40, -1.9],
  [3.05, -2.3], [4.15, -2.3],     /* the highest he looks, and only on a beat */
  [4.85, -1.5], [5.85, -1.5],
  [6.50, -1.8], [6.90, -1.8],
  [7.45, -2.3], [8.65, -2.3],
  [9.35, -1.4], [10.55, -1.4],    /* down a little: considering */
  [11.25, -1.9], [12.10, -1.9],
  [12.72, -2.3], [13.95, -2.3],
  [14.65, -1.6], [16.00, -1.6],
  [16.70, -1.8], [17.35, -1.8],
  [17.95, -0.5], [20.05, -0.5],   /* level with the viewer */
  [20.65, -0.15], [21.70, -0.15],
  [22.20, -0.6],
];
if (EYE_KEYS.length !== EYE_Y_KEYS.length
  || EYE_KEYS.some((k, i) => k[0] !== EYE_Y_KEYS[i][0])) {
  throw new Error('the two eye tracks do not share their key times');
}
const EYE_MAX = Math.max(...EYE_KEYS.map((k, i) => Math.hypot(k[1], EYE_Y_KEYS[i][1])));
if (EYE_MAX > 6) throw new Error('an eye key travels ' + EYE_MAX.toFixed(2)
  + ' units, past the page\'s own cap of 6');
/* the vertical is checked on its own too, because the combined cap can be
   satisfied by a value that is still past what the page allows on one axis. */
const EYE_Y_MAX = Math.max(...EYE_Y_KEYS.map(k => Math.abs(k[1])));
if (EYE_Y_MAX > 3.8) throw new Error('an eye key travels ' + EYE_Y_MAX.toFixed(2)
  + ' units vertically, past the page\'s own cap of 3.8');

/* ---------- the blinks ----------
   seeded, so the rhythm is uneven the way a real one is and identical on every
   run. this is post6's own seed and a much slower cadence than post5's: 3.0 to
   4.4 seconds apart against 1.45 to 2.60, because a mascot listening to advice
   blinks like someone concentrating rather than someone searching a room.
   doubles are rare rather than common, for the same reason. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function blinkList(seconds) {
  const rnd = prng(0x6b1f30d);
  const out = [];
  let t = 1.10;
  while (t < seconds - 0.35) {
    out.push(t);
    /* a double now and then, so the rhythm is not a metronome. the second lid
       lands 120ms later, which is what a real double blink measures. */
    if (rnd() < 0.12) { const d = t + 0.12; if (d < seconds - 0.35) out.push(d); }
    t += 3.0 + rnd() * 1.4;
  }
  return out;
}

/* the page's own lid: eases shut, holds a beat, eases back open. copied rather
   than reached for, because it lives in index.html's closure. */
function lidAt(ms) {
  const LID = .06, CLOSE = 95, HOLD = 45, OPEN = 140;
  if (ms < 0) return 1;
  if (ms < CLOSE) { const p = ms / CLOSE; return 1 - (1 - LID) * p * p; }
  if (ms < CLOSE + HOLD) return LID;
  const q = (ms - CLOSE - HOLD) / OPEN;
  if (q >= 1) return 1;
  return LID + (1 - LID) * (1 - (1 - q) * (1 - q));
}
function blinkFrom(list, t) {
  let v = 1;
  for (const b of list) v = Math.min(v, lidAt((t - b) * 1000));
  return v;
}
function keyAt(keys, t, ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (ease || EASE_OUT)(span(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}

/* the reel's guards, frame rate relative so they stay meaningful at 60 and
   clamp out of the way under DEMO_FPS=12. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
const GAZE_LIMIT = 1.2 * STEP / 16.6667;

/* ---------- the scene ----------
   the site's own mascot, read from source, exactly as post5 reads it. */
function mascotBody() {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', 'mascot.svg'), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.includes('fill="#f4f7f5"') || !inner.includes('fill="#06070a"'))
    throw new Error('mascot.svg is not the dark colourway any more');
  if ((inner.match(/<circle/g) || []).length !== 1 || (inner.match(/<rect/g) || []).length !== 2)
    throw new Error('mascot.svg is not one circle and two eyes any more');
  /* the standalone file is one circle and two loose rects. the page wraps the
     rects in a <g class="m-eyes"> and travels the group, leaving the blink on
     each rect: two nested transforms, deliberately, so the blink cannot lag the
     gaze. rebuild that here or nothing can move the eyes at all. */
  const face = inner.match(/<circle[\s\S]*?\/>/)[0]
    .replace('<circle', '<circle class="m-face"')
    .replace(/fill="#f4f7f5"/, 'fill="var(--face)"');
  const eyes = inner.match(/<rect[\s\S]*?\/>/g).map(r => r
    .replace('<rect', '<rect class="m-eye"')
    .replace(/fill="#06070a"/, 'fill="var(--eye)"'));
  return [face, '<g class="m-eyes">', ...eyes, '</g>'].join('\n      ');
}

function sceneHtml(plan) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post6</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${captionCss(plan, BOX)}
/* the vignette, at its light value, breathing on the site's own 34s loop. no
   grain: every platform recompresses a clip and grain through that is noise
   rather than texture.

   the breathe is load bearing, not decoration. with nothing animating at all
   chrome stops producing compositor frames and Page.captureScreenshot blocks on
   a frame that never comes. post2.mjs found this and every clip since has
   carried the fix. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1}

/* the mascot, in the lower third. --ex/--ey/--blink are written per frame by
   the recorder, exactly as the reel writes the hero's. */
.m-zone{position:absolute;left:50%;top:${MASCOT_TOP}px;transform:translateX(-50%);
  display:block;width:max-content}
.mascot{position:relative;display:block;width:${MASCOT}px;height:auto}
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex,0) * 1px),calc(var(--ey,0) * 1px))}
.m-eye{fill:var(--eye);transform-box:fill-box;transform-origin:center;
  transform:scaleY(calc(var(--blink,1) * var(--wide,1)))}

/* the wordmark, present for the whole clip. michroma caps, tracked wide and
   dim: the lockup subline's treatment, which is the one place the brand allows
   michroma at a small size. */
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
  text-indent:.09em;
}
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage">
  <div class="wordmark" id="wordmark">the boring tek</div>
  <span id="accent-probe" style="position:absolute;left:-999px;color:var(--accent)">a</span>
  <div class="m-zone">
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${mascotBody()}
    </svg>
  </div>
${captionMarkup(plan)}
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(plan)};
window.__CAP_BOX = ${JSON.stringify(BOX)};
${captionPage.toString()}
captionPage();
window.__P6 = ${JSON.stringify({ VW, VH, WORDMARK_W })};
${scenePage.toString()}
scenePage();
</script>
</body>
</html>`;
}

/* ---------- the scene's own script ----------
   serialised into the page. the caption half is captions.mjs's; this is the
   mascot, the wordmark fit, and the measurements that are about the whole frame
   rather than about the captions alone. */
function scenePage() {
  function fitWordmark() {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    /* measured rendered, in caps, because text-transform is invisible to
       measureText and costs michroma about 15% of its width. */
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (window.__P6.WORDMARK_W / em).toFixed(3) + 'px';
  }

  window.__p6 = {
    ready: false,
    /* the mascot's idle, and the proof of it in one call. written after the
       caption is applied so these are the values that render, and read back
       from computed style so what is asserted is what was drawn. */
    life(ex, ey, blink) {
      const m = document.querySelector('.mascot');
      const g = document.querySelector('.m-eyes'), e = document.querySelector('.m-eye');
      if (!m || !g || !e) return ['gone', '', 1];
      m.style.setProperty('--ex', ex.toFixed(3));
      m.style.setProperty('--ey', ey.toFixed(3));
      m.style.setProperty('--blink', blink.toFixed(4));
      const cs = getComputedStyle(e);
      return [getComputedStyle(g).transform,
        cs.getPropertyValue('--wide').trim() || '1',
        parseFloat(cs.getPropertyValue('--blink')) || 1];
    },
    /* the whole frame's safe area, not just the caption's. captions.mjs measures
       its own ink and knows nothing about a mascot or a wordmark, so the two are
       unioned here and the worse of them is what the guard runs against. */
    safe() {
      const cap = window.__cap.safe(window.__P6.VW, window.__P6.VH);
      let out = { ...cap };
      for (const sel of ['.mascot', '#wordmark']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = {
          left: b.left, top: b.top,
          right: window.__P6.VW - b.right, bottom: window.__P6.VH - b.bottom,
        };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = sel;
        out.left = Math.min(out.left, d.left);
        out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right);
        out.bottom = Math.min(out.bottom, d.bottom);
      }
      return out;
    },
    /* how much clear air there is between the lowest visible caption ink and the
       top of the head. the caption is the thing that changes size between an
       ordinary card and a beat, so this is measured on the drawn card rather
       than worked out from the box it was told to live in. */
    clearance() {
      const head = document.querySelector('.mascot').getBoundingClientRect();
      let lowest = -1e9, which = null;
      for (const el of document.querySelectorAll('.cap-w')) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = el;
        while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (b.bottom > lowest) { lowest = b.bottom; which = el.textContent; }
      }
      return lowest === -1e9 ? null : { gap: +(head.top - lowest).toFixed(1), which };
    },
    /* what the frame drew, for the run to print. */
    boxes() {
      const r = s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1),
          left: +b.left.toFixed(1), right: +b.right.toFixed(1) };
      };
      return { mascot: r('.mascot'), wordmark: r('#wordmark') };
    },
    /* the accent, as it actually computes in this theme, so a guard can ask
       whether it was painted rather than whether a role was set. */
    accent() { return getComputedStyle(document.getElementById('accent-probe')).color; },
  };

  document.fonts.load('400 1em Michroma')
    .then(() => document.fonts.load('500 1em "Space Grotesk"'))
    .then(() => document.fonts.ready)
    .then(() => {
      fitWordmark();
      window.__built = window.__cap.build();
      window.__p6.ready = true;
    });
}

/* ---------- what gets injected before the scene's own script ----------
   nothing in this scene animates by hand, so the rAF shim has nothing to flush.
   it is installed anyway and flushed once per captured frame, so the rig is the
   same one every other clip runs under and a hand animated piece dropped in
   later is already on the right clock. */
function injected() {
  let seed = 0x3f9a20c5;
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

/* ---------- a local static server, so the load sequence is the reel's ------- */
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

/* ---------- the voice, cached ----------
   the sidecar json is the cache key. if it is there and it is for this script,
   the endpoint is left alone, which also means a re-render cannot quietly
   change the timeline under a clip that was already approved. */
async function voice() {
  const cached = path.join(VOICE_OUT, 'post6-calm.json');
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === SCRIPT.replace(/\s+/g, ' ').trim() && fs.existsSync(j.file)) {
      console.log('  voice from cache: ' + j.voiceId + ', ' + j.seconds.toFixed(2)
        + 's, ' + j.words.length + ' words, timings from the ' + j.timing);
      return j;
    }
  }
  const r = await speak(SCRIPT, { voice: 'calm', name: 'post6' });
  console.log('  voice: ' + r.voiceId + ', ' + r.seconds.toFixed(2) + 's, '
    + r.words.length + ' words, timings from the ' + r.timing);
  return r;
}

/* ---------- render ---------- */
async function render(plan, seconds, blinks) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const N = Math.round(FPS * seconds);
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  console.log('  post6-1080x1920: ' + VW * DSF + 'x' + VH * DSF + ', ' + N + ' frames');

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

  /* load under a paused clock, so the google fonts request costs real seconds
     but no virtual milliseconds and frame zero is a genuinely settled page. */
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  let burned = 0;
  for (let i = 0; i < 150; i++) {
    const ok = await page.evaluate(() => !!(window.__p6 && window.__p6.ready
      && window.__cap && window.__cap.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__p6 && window.__p6.ready))) {
    throw new Error('the scene never became ready');
  }
  /* offline the whole clip renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to ship. */
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('40px Michroma'),
    grotesk: document.fonts.check('400 20px "Space Grotesk"'),
  }));
  for (const [k, v] of Object.entries(faces)) {
    if (!v) throw new Error(k + ' did not load — the clip would be set in the mono fallback');
  }
  console.log('  scene ready after ' + burned.toFixed(0) + 'ms of virtual time');

  const built = await page.evaluate(() => window.__built);
  const boxes = await page.evaluate(() => window.__p6.boxes());
  console.log('  cards fitted at ' + built.size.toFixed(1) + 'px, the three beats at '
    + built.bigSize.toFixed(1) + 'px (' + (built.bigSize / built.size).toFixed(2) + 'x)');
  console.log('  head ' + boxes.mascot.top.toFixed(0) + '..' + boxes.mascot.bottom.toFixed(0)
    + ', wordmark ' + boxes.wordmark.top.toFixed(0) + '..' + boxes.wordmark.bottom.toFixed(0)
    + '  (css px of ' + VH + ')');

  /* one sample per card, on the frame it is fully sprung. every card is a
     different width and the three beats are a different size, so one sample
     would prove nothing about the widest or the tallest state. */
  const SETTLE = 0.30;
  const samples = plan.groups.map(g => ({
    t: Math.min(g.out - 0.02, g.words[g.words.length - 1].start + SETTLE), i: g.i,
  }));
  const sampled = new Set();
  const safeSamples = [];
  let safeWorst = null, clearWorst = null;

  let wideSeen = null, lastTx = null, lastTy = null, gazeJump = { d: 0, t: 0 };
  const eyeFaults = [];
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const blinkSteps = [];
  let sawAccent = false, maxVisible = 0, capMoved = 0, prevSum = null;

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS;

    /* the captions, from the plan, eased in node. */
    const frame = captionFrame(plan, t);
    const seen = await page.evaluate(fr => {
      window.__cap.apply(fr);
      const accent = window.__p6.accent();
      const vis = [...document.querySelectorAll('.cap-card')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden'
          && parseFloat(getComputedStyle(el).opacity) > 0.02);
      /* painted, not "has the active role": the accent is a colour and the
         guard should ask about the colour. */
      const acc = vis.some(g => [...g.querySelectorAll('*')]
        .some(el => getComputedStyle(el).color === accent));
      return { vis: vis.length, acc };
    }, frame);
    if (seen.acc) sawAccent = true;
    maxVisible = Math.max(maxVisible, seen.vis);
    const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
    if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
    prevSum = sum;

    /* one rAF tick for the scene, exactly one frame's worth. */
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);

    /* the mascot, written last so it is what renders, and checked. */
    const eye = await page.evaluate((ex, ey, bl) => window.__p6.life(ex, ey, bl),
      keyAt(EYE_KEYS, t, EASE_IO), keyAt(EYE_Y_KEYS, t, EASE_IO), blinkFrom(blinks, t));

    /* matrix(a,b,c,d,e,f): e is the x translation, f the y. both are read and
       the step is the length of the vector between two frames, so a snap on
       either axis or on both at once is one number to compare. */
    const mx = (eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',');
    const tx = parseFloat(mx[4]) || 0, ty = parseFloat(mx[5]) || 0;
    if (wideSeen === null) wideSeen = eye[1];
    else if (eye[1] !== wideSeen) eyeFaults.push({ t, what: 'wide', was: wideSeen, now: eye[1] });
    if (lastTx !== null) {
      const d = Math.hypot(tx - lastTx, ty - lastTy);
      if (d > gazeJump.d) gazeJump = { d, t };
      if (d > GAZE_LIMIT) eyeFaults.push({ t, what: 'gaze', was: [lastTx, lastTy], now: [tx, ty] });
    }
    lastTx = tx; lastTy = ty;
    if (lastBlink !== null) {
      const d = Math.abs(eye[2] - lastBlink);
      if (d > blinkJump.d) blinkJump = { d, t };
      if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: eye[2] });
    }
    lastBlink = eye[2];

    for (const s of samples) {
      if (sampled.has(s.i) || t < s.t) continue;
      sampled.add(s.i);
      const [sa, cl] = await page.evaluate(() => [window.__p6.safe(), window.__p6.clearance()]);
      safeSamples.push({ card: s.i, t: +t.toFixed(3), ...sa });
      if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
        < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
        safeWorst = { t: +t.toFixed(3), ...sa };
      }
      if (cl && (!clearWorst || cl.gap < clearWorst.gap)) clearWorst = { t: +t.toFixed(3), ...cl };
    }

    /* clip.scale is what actually gets device pixels out. a plain
       captureScreenshot hands back css pixels however high the dsf is. */
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);

    if (f % 240 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const turns = EYE_KEYS.filter((k, i) => i > 0
    && (k[1] !== EYE_KEYS[i - 1][1] || EYE_Y_KEYS[i][1] !== EYE_Y_KEYS[i - 1][1])).length;
  const holds = EYE_KEYS.filter((k, i) => i > 0
    && k[1] === EYE_KEYS[i - 1][1] && EYE_Y_KEYS[i][1] === EYE_Y_KEYS[i - 1][1]).length;
  console.log('  idle: ' + blinks.length + ' blinks over ' + seconds.toFixed(2) + 's ('
    + (seconds / blinks.length).toFixed(1) + 's apart), ' + turns + ' turns and '
    + holds + ' holds, furthest look ' + EYE_MAX.toFixed(2) + ' of the page\'s 6');
  console.log('  gaze: biggest one-frame move ' + gazeJump.d.toFixed(3) + ' at '
    + gazeJump.t.toFixed(2) + 's, limit ' + GAZE_LIMIT.toFixed(2)
    + ' — --wide held at ' + wideSeen);
  console.log('  blink: biggest one-frame lid step ' + blinkJump.d.toFixed(3)
    + ' at ' + blinkJump.t.toFixed(2) + 's, ' + (blinkSteps.length || 'none')
    + ' over the ' + BLINK_LIMIT.toFixed(2) + ' limit');
  const dev = v => Math.round(v * DSF);
  console.log('  safe area, worst of ' + safeSamples.length + ' card samples, at '
    + safeWorst.t.toFixed(2) + 's: ' + dev(safeWorst.left) + 'px left, ' + dev(safeWorst.top)
    + ' top, ' + dev(safeWorst.right) + ' right, ' + dev(safeWorst.bottom)
    + ' bottom (floor ' + SAFE * DSF + ', tightest is ' + safeWorst.worst + ')');
  console.log('  the caption never gets closer than ' + clearWorst.gap.toFixed(0)
    + 'px to the head (floor ' + HEAD_CLEARANCE + ', closest at ' + clearWorst.t.toFixed(2)
    + 's on "' + clearWorst.which + '")');

  await browser.close();
  srv.close();

  const state = {
    seconds, frames: N, built, boxes, safe: safeWorst, safeSamples: safeSamples.length,
    clearance: clearWorst, eyeFaults, blinkSteps, blinkJump, gazeJump, wide: wideSeen,
    blinks: blinks.length, turns, holds, eyeMax: EYE_MAX,
    sawAccent, maxVisible, capMoved,
  };
  fs.writeFileSync(path.join(OUT, 'post6-1080x1920.json'), JSON.stringify(state, null, 2));
  return state;
}

/* ---------- encode ----------
   the clips' settings, plus the voice. no -shortest: the video is the longer
   stream and the output should run to it, so the clip keeps its tail and ends
   on the mascot rather than on the last syllable. */
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function encode(voiceFile) {
  const out = path.join(OUT, 'post6-1080x1920.mp4');
  console.log('  encoding ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
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

/* pull frames back out of the finished mp4, so the check is against what
   shipped rather than against what we meant to ship. */
function sampleFrames(mp4, at) {
  const dir = path.join(OUT, 'verify-post6');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [t, name] of at) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', mp4, '-frames:v', '1', path.join(dir, name + '.png')]);
  }
  return dir;
}

/* ---------- go ---------- */
console.log('the boring tek — social clip #6, the honest advice post');
brandTokens();      /* fail here, before a twenty two second render, if a token has moved */

const v = await voice();
/* two words to a card, not three, and the reason is the type size.

   the fit sizes every ordinary card off the widest one, so one long card sets
   the size for all of them. measured against this script and this box:

     words   widest card                    size    cards   compressed
       1     "customer"                     40.0px    54       24
       2     "touch customer"               28.5px    33        3
       3     "work without checking."       19.8px    22        0
       4     "touch customer data without"  15.6px    21        0

   three is the safest cut and it is too small: the captions are the copy in this
   clip, and 19.8px reads as a subtitle under something else rather than as the
   thing being said. one is the real hormozi cut and this script cannot carry it
   — `a` and `human` are sixty milliseconds apart, so a card a word would be a
   strobe.

   two, at 28.5px, is 44% bigger type for the cost of three cards that go past
   quickly, and those three are `in your`, `it can` and `has a`: function word
   pairs sitting in the gaps between the words the sentences lean on. their
   entrances are compressed to fit rather than left unfinished, which is what
   `popTiming` in the engine is for. */
/* `fill` is not set here and that is deliberate: the engine's default is `card`
   now, and this clip is the reason. it shipped with `fill: 'card'` written out
   while `word` was still the default, the two were watched side by side, and
   `card` won — so the default moved and the override came out rather than being
   left behind to look like an opinion this clip still holds on its own. */
const plan = planCaptions(v.words, { style: 'pop', perCard: 2, emphasise: BEAT });
console.log(describe(plan));

const beats = plan.groups.filter(g => g.big);
console.log('  beats: ' + beats.map(g => '"' + g.words.map(w => w.word).join(' ') + '" at '
  + g.words[0].start.toFixed(2) + 's').join(', '));
/* printed rather than failed on. these are the cards the voice gave less than a
   full entrance to, and knowing which they are is how you tell a script problem
   from an engine one. a name in this list would be a script problem. */
console.log('  compressed: ' + (plan.tight.compressed.length
  ? plan.tight.compressed.map(c => '"' + c.text + '" ' + c.for.toFixed(2) + 's').join(', ')
  : 'none'));

/* the clip is as long as the voice plus a tail. nothing here is a typed
   duration: change the script and the length follows it. */
const SECONDS = +(v.seconds + TAIL).toFixed(2);
const BLINKS = blinkList(SECONDS);
console.log('  ' + SECONDS.toFixed(2) + 's = ' + v.seconds.toFixed(2)
  + 's of voice plus a ' + TAIL.toFixed(2) + 's tail, and the caption clears at '
  + plan.seconds.toFixed(2) + 's');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post6-1080x1920.json'), 'utf8'))
  : await render(plan, SECONDS, BLINKS);

const file = encode(v.file);
const p = probe(file);
const mb = (fs.statSync(file).size / 1e6).toFixed(2) + ' MB';
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with voice' : 'SILENT') + '  ' + mb + '  ' + path.relative(ROOT, file));

const dir = sampleFrames(file, [
  [0.60, 'a-opening-card'],
  [3.40, 'b-beat-one'],
  [4.90, 'c-advice-one'],
  [7.80, 'd-beat-two'],
  [9.00, 'e-advice-two'],
  [13.05, 'f-beat-three'],
  [15.40, 'g-advice-three'],
  [18.40, 'h-looks-at-you'],
  [20.90, 'i-the-whole-secret'],
  [Math.min(SECONDS - 2 / FPS, plan.seconds + 0.30), 'j-caption-clear'],
  [SECONDS - 2 / FPS, 'k-last-frame'],
]);
console.log('  frames sampled into ' + path.relative(ROOT, dir));

/* ---------- the editor's card ---------- */
console.log('\nfor the editor — ' + SECONDS.toFixed(2) + 's, ' + FPS + 'fps, '
  + VW * DSF + 'x' + VH * DSF + ', voice already in the file');
console.log('  voice: ' + v.voiceId + ' at rate ' + v.rate + ', pitch ' + v.pitch
  + ', ' + v.words.length + ' words, timings from the ' + v.timing);
console.log('  the three beats land at '
  + beats.map(g => g.words[0].start.toFixed(2)).join(', ') + 's');
console.log('  the mascot comes to the viewer at 17.95 and stays');
console.log('  caption clears ' + plan.seconds.toFixed(2) + ', tail '
  + (SECONDS - plan.seconds).toFixed(2) + 's');

if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

/* ---------- the guards ---------- */
const fail = [];
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(p.seconds + 's, wanted ' + SECONDS);
if (!p.audio) fail.push('no audio track — the voice did not mux and the clip is the wrong deliverable');
/* the mp4 must not be shorter than the voice, or the last line is cut off. */
if (p.seconds < v.seconds - 0.05) {
  fail.push('the file is ' + p.seconds.toFixed(2) + 's and the voice is '
    + v.seconds.toFixed(2) + 's — the end of the line is missing');
}

/* sync. the captions are cut from the same array the voice was measured with,
   so a drift here is a bug in the engine rather than in the reading. */
if (plan.tight.late.length) {
  fail.push(plan.tight.late.length + ' card(s) leave before their own last word is said: '
    + plan.tight.late.map(c => '"' + c.text + '"').join(', '));
}
if (state.maxVisible > 1) fail.push(state.maxVisible + ' cards were on screen at once, wanted one');
if (!state.sawAccent) fail.push('the accent was never painted');
if (!(state.capMoved > 0.01)) fail.push('the caption never moved between two frames');
if (beats.length !== BEATS_EXPECTED) {
  fail.push('found ' + beats.length + ' beat cards, the script counts out ' + BEATS_EXPECTED);
}
if (!(state.built.bigSize > state.built.size * 1.2)) {
  fail.push('the beats were fitted at ' + (state.built.bigSize || 0).toFixed(1)
    + 'px against the ordinary cards\' ' + state.built.size.toFixed(1)
    + 'px — that is not a beat');
}
if (state.built.bigSize > 44.001) {
  fail.push('a beat card is ' + state.built.bigSize.toFixed(1)
    + 'px, past the brand\'s 44px hero cap');
}

/* the mascot. the smoothness guards pass trivially on a face that never moves,
   which is exactly what a missing .m-eyes group produces, so liveness is
   checked too. */
if (state.eyeFaults.length) {
  fail.push(state.eyeFaults.length + ' eye fault(s), first at '
    + state.eyeFaults[0].t.toFixed(2) + 's (' + state.eyeFaults[0].what + ')');
}
if (state.blinkSteps.length) fail.push(state.blinkSteps.length
  + ' blink step(s) over the limit — it is flashing, not blinking');
if (!(state.gazeJump.d > 0)) fail.push('the eyes never moved — is the .m-eyes group there?');
if (!(state.blinkJump.d > 0)) fail.push('the mascot never blinked');
if (state.wide !== '1') fail.push('--wide read back as "' + state.wide + '", wanted 1');

/* the frame. */
const sa = state.safe;
const near = Math.min(sa.left, sa.top, sa.right, sa.bottom) * DSF;
if (near < SAFE * DSF - 0.5) {
  fail.push(sa.worst + ' comes within ' + Math.round(near)
    + 'px of a border, floor is ' + SAFE * DSF);
}
if (state.safeSamples !== plan.groups.length) {
  fail.push('the safe area was sampled ' + state.safeSamples
    + ' times, wanted one per card (' + plan.groups.length + ')');
}
if (!state.clearance || state.clearance.gap < HEAD_CLEARANCE) {
  fail.push('the caption comes within ' + (state.clearance ? state.clearance.gap.toFixed(0) : '?')
    + 'px of the head, wanted at least ' + HEAD_CLEARANCE);
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
