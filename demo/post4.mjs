/* the boring tek — social clip #4, "3 free ai tools for your business".
   renders out/post4-1080x1920.mp4. tooling, not the site: nothing here ships,
   nothing here edits index.html.

   post2.mjs is the template. post3 was queued and never built, so post2 is the
   last real rig. what carries over untouched: the rAF shim, the seeded prng,
   the frame loop under CDP virtual time, the michroma cell grid behind the
   statement, the wordmark fit, the gaze / blink / safe-area guards and the
   encode settings.

   what is different, and why. this clip carries four beats of multi sentence
   copy instead of two short lines, so the pill has to hold three lines and get
   wide. post2's bubble hangs off the head's right shoulder and, when it runs
   long, slides left until its right edge lands on the safe line. at these
   widths that slide is about 270px and the pill would tear away from its own
   dot trail. so the pill is anchored instead: its right edge parks on a fixed
   line inside the safe area on every beat, it grows leftward, and its
   transform origin moves to wherever the trail ends, so the spring still reads
   as coming out of the dots however wide the words are.

   vertical only. there is no square cut here: a 1080 tall frame cannot hold a
   statement, a three line bubble, the head and the wordmark. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* under out/, which is already gitignored whole. record.mjs wipes demo/frames/
   on every run, so this stays out of its way, and out of post2's. */
const FRAMES = path.join(OUT, 'frames-post4');

const FPS = Number(process.env.DEMO_FPS || 60);   /* DEMO_FPS=12 for a fast preview */
const SECONDS = 19.0;
const N = Math.round(FPS * SECONDS);
const STEP = 1000 / FPS;
const DSF = 2;                              /* css px at 2x, so 540 wide is 1080 */

/* ---------- the cut ----------
   one pass, vertical. every number below is css px in a 540x960 viewport;
   device px are double. SAFE is 48, which is the 96 device px nothing is
   allowed inside.

   the vertical budget, top to bottom, and it is tighter than post2's because
   the bubble is three lines instead of one:
     112..252    the statement, four lines, capped by a share of the frame
     ~335..435   the pill at its tallest, 9px clear of the head
     444..660    the mascot
     ~846..862   the wordmark
   the statement and the pill are the two that move if the copy changes, so the
   run prints both boxes and the guard measures the drawn ones, not these. */
const SAFE = 48;
const CUTS = [
  {
    name: 'post4-1080x1920', vw: 540, vh: 960,
    statementTop: 112,      /* 11.7%, and 224 device px clear of the top */
    statementW: 0.75,       /* of the frame, the share post2's tall cut uses */
    mascot: 216, mascotCy: 552,   /* 57.5%: lower than post2's centre, to open
                                     the sky a three line bubble needs */
    wordmarkCy: 854,        /* 89% */
    wordmarkW: 250,
    pillFont: 18,           /* post2 uses 16 for one line. the payload of this
                               clip is the words, so they get the extra 2px. */
    pillMaxW: 400,          /* a guard, not a layout: the breaks are explicit,
                               so anything reaching this means a line grew long
                               enough to re-wrap, and the check will say so. */
    pillInset: 8,           /* how far inside the safe line the pill's right
                               edge parks. 56 css px of clearance on the
                               tightest beat, 112 device px. */
  },
];

const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const ONLY_ENCODE = has('--encode-only');
const KEEP = has('--keep-frames');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- easing ---------- */
/* solved numerically so the clip moves on the same curves the site does. */
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
const EASE_IO = bezier(.45, 0, .55, 1);      /* idle eye turns, calm both ends */
const SPRING = bezier(.34, 1.4, .64, 1);     /* the site's own --spring */
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

/* ---------- the copy ----------
   no dashes anywhere a viewer can read, and the check under this block
   enforces it rather than trusting a proofread.

   the statement is set in caps by css, so the dom keeps the real lowercase
   sentence and the cells are uppercased in js. the line breaks are a design
   decision, not a wrap: the fit divides the available width by the longest
   line's cell count, so the longest line alone sets the size.

   seven words, thirty two characters. michroma's widest glyph is 1.885em, so
   one cell is nearly two ems and the longest line's character count is what
   decides everything. measured, against the 405px this cut allows:

     lines   split                                    longest   size    height
       2     3 free ai tools / for your business        17      12.6px    39
       3     3 free / ai tools for / your business      13      16.5px    63
       4     3 free / ai tools / for your / business     8      26.9px   140

   four wins outright and it is not close: 26.9px against 16.5, which is also
   larger than post2's statement at 17.9. the fit divides by the longest line,
   so the only way to buy size is to shorten that line, and the extra rows cost
   height in a place this layout has it to spend. eight is the smallest longest
   line any four way split of this sentence reaches. the block still comes out
   405px wide, the same 135 device px clear of each side, because the width is
   capped by a share of the frame rather than by the type size. */
const STATEMENT = ['3 free', 'ai tools', 'for your', 'business'];

/* the four beats. one sentence per line, which is both the readable break and
   the one an editor can cut a voice line against. every beat is three lines on
   purpose: the pill's height then never changes between beats, so only its
   width moves and nothing above the head jumps. */
const BEATS = [
  {
    on: 1.60, off: 4.50,
    lines: ['notebooklm.', 'you give it your papers.', 'it answers questions about them.'],
  },
  {
    on: 6.00, off: 8.90,
    lines: ['opal.', 'it makes small apps for you.', 'no coding.'],
  },
  {
    /* two sentences, not three, so the second takes the two lower lines.
       "it makes posts / for your social media." breaks before the preposition
       rather than after it, which is the break that reads aloud. */
    on: 10.40, off: 13.30,
    lines: ['pomelli.', 'it makes posts', 'for your social media.'],
  },
  {
    on: 14.80, off: 17.70,
    lines: ['all free.', 'from google.', 'try one today.'],
  },
];

/* em dash, en dash, figure and quotation dashes, minus, and the plain hyphen.
   none of this copy has a hyphen inside a word, so the plain one is banned too
   and this stays a hard check rather than a judgement call. */
const NO_DASH = /[-\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/;
for (const s of [...STATEMENT, ...BEATS.flatMap(b => b.lines)]) {
  if (NO_DASH.test(s)) throw new Error('a dash reached the copy: "' + s + '"');
}

/* ---------- the scene ----------
   the site's own light theme and the site's own mascot, read from source. */
function lightRoot() {
  const css = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = css.match(/\n:root\{([\s\S]*?)\n\}/);
  if (!m) throw new Error('no :root block found in index.html');
  const need = ['--bg', '--fg', '--sub', '--face', '--eye', '--bub', '--vig', '--display', '--spring'];
  const missing = need.filter(t => !m[1].includes(t + ':'));
  if (missing.length) throw new Error('light :root is missing ' + missing.join(', '));
  return m[1].trim();
}

/* the standalone svg is the dark colourway, because it is used as an avatar.
   the scene is light, so the two fills become tokens and he inverts the way the
   in page mascot does. geometry is never touched. */
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

const HERO_CAP = 44;     /* the brand's hero cap, and it is not raised here */

function sceneHtml(cut) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post4</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${lightRoot()}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${cut.vw}px;height:${cut.vh}px;color:var(--fg);font-family:var(--body)}
/* the vignette, at its light value, breathing on the site's own 34s loop. no
   grain: every platform recompresses a clip, and grain through that is noise
   rather than texture.

   the breathe is not decoration here, it is load bearing. a scene with nothing
   animating lets chrome stop producing compositor frames, and then
   Page.captureScreenshot waits for a frame that never comes and the render
   hangs on frame one. index.html always has this running, which is why the reel
   never meets the problem. over nineteen seconds it is a drift nobody can see. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}

.stage{position:relative;width:${cut.vw}px;height:${cut.vh}px;z-index:1}

/* the statement. michroma, caps, on the fixed cell grid the site uses for the
   wordmark, so a scrambling glyph cannot change the line's width. it is on
   screen for the whole clip: it decodes once and then never moves again. */
.say{
  position:absolute;left:50%;top:${cut.statementTop}px;transform:translateX(-50%);
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-transform:uppercase;letter-spacing:0;line-height:1.04;
  display:flex;flex-direction:column;gap:.35em;text-align:center;
}
.say .ln{display:block;min-height:1.04em;white-space:pre}
.say .c{display:inline-block;width:var(--cw,1em);text-align:center}

/* the mascot, centred, large. --ex/--ey/--blink are written per frame by the
   recorder, exactly as the reel writes the hero's. */
.m-zone{position:absolute;left:50%;top:${cut.mascotCy}px;transform:translate(-50%,-50%);
  display:block;width:max-content}
.mascot{position:relative;display:block;width:${cut.mascot}px;height:auto}

/* the wordmark, present for the whole clip. michroma caps, tracked wide and
   dim: the lockup subline's treatment, which is the one place the brand allows
   michroma at a small size. it signs the clip without competing with anything. */
.wordmark{
  position:absolute;left:50%;top:${cut.wordmarkCy}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking, not all of it, is what actually
     centres it. */
  text-indent:.09em;
}
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex,0) * 1px),calc(var(--ey,0) * 1px))}
.m-eye{fill:var(--eye);transform-box:fill-box;transform-origin:center;
  transform:scaleY(calc(var(--blink,1) * var(--wide,1)))}

/* the speech bubble: three dots up and right of the head, then the pill. the
   trail is index.html's shape for shape. the pill is not, and here is the
   whole of what changed and why.

   1. it holds three lines, so white-space is pre-line and the breaks in BEATS
      are the breaks that render. max-width is a tripwire, not a layout.
   2. --pshift parks its right edge on a fixed line inside the safe area, so the
      pill grows leftward over the head instead of off the right of the frame.
      the value is measured per beat by text(), never assumed.
   3. --porigin puts the transform origin back where the dots end, so the spring
      still comes out of the trail whatever the shift was.
   4. the radius is 26px, not 999px. at 100px tall a stadium's ends carry a 50px
      radius, and the top and bottom lines' first characters cross it: measured,
      the border sits at x=18.7 where the text starts at 16. a rounded rect is
      what a three line bubble has to be. the border, the fill and the token
      colours are the page's, untouched. */
.bubble{
  position:absolute;left:calc(100% + 12px);bottom:calc(100% - 18px);
  display:flex;align-items:flex-end;gap:5px;width:max-content;
  pointer-events:none;z-index:3;
}
.dot{display:block;border-radius:50%;
  background:var(--bg);border:1px solid var(--bub);
  opacity:0;transform:scale(.2)}
.d1{width:5px;height:5px}
.d2{width:7px;height:7px;margin-bottom:8px}
.d3{width:10px;height:10px;margin-bottom:18px}
.pill{
  margin-bottom:27px;margin-left:var(--pshift,0px);
  max-width:${cut.pillMaxW}px;
  padding:11px 16px;border:1px solid var(--bub);border-radius:26px;
  background:var(--bg);color:var(--fg);
  font-family:var(--body);font-size:${cut.pillFont}px;line-height:1.4;text-align:left;
  white-space:pre-line;
  transform-origin:var(--porigin,0px) bottom;opacity:0;
  scale:.7;
}
/* no css transition anywhere on the bubble, and that is deliberate. one
   captured frame carries five or six BeginFrames, so the animation timeline
   advances about 5x per frame and a .4s spring resolves in five frames. rAF is
   shimmed out of that; css transitions cannot be. so the bubble is eased in js
   and written per frame, on the site's own curves and the site's own durations,
   which is exactly how the reel drives its end card. */
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage">
  <div class="say" id="say">
${STATEMENT.map(l => '    <span class="ln">' + l + '</span>').join('\n')}
  </div>
  <div class="wordmark" id="wordmark">the boring tek</div>
  <div class="m-zone">
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${mascotBody()}
    </svg>
    <div class="bubble" id="bubble">
      <i class="dot d1"></i><i class="dot d2"></i><i class="dot d3"></i>
      <span class="pill"><span class="pill-t"></span></span>
    </div>
  </div>
</div>
<script>
/* the scene's script is serialised from post4.mjs, so anything it needs from
   node arrives here as data rather than as an interpolation inside it. */
window.__CFG = ${JSON.stringify({ HERO_CAP, SAFE })};
window.__CUT = ${JSON.stringify({ vw: cut.vw, vh: cut.vh, statementW: cut.statementW,
  wordmarkW: cut.wordmarkW, pillInset: cut.pillInset, pillMaxW: cut.pillMaxW })};
${scenePage.toString()}
scenePage();
</script>
</body>
</html>`;
}

/* ---------- the scene's own script ----------
   serialised into the page. the decode is a genuine rAF loop on the site's own
   schedule, which is the whole reason the recorder's rAF shim is installed:
   under captureScreenshot the compositor's rAF clock runs about 5x fast, and a
   1150ms decode would resolve inside four captured frames. */
function scenePage() {
  const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$*+<>/\\|';
  const DUR = 1150;
  const sayEl = document.getElementById('say');
  const lines = [...sayEl.querySelectorAll('.ln')].map(el => el.textContent.toUpperCase());
  let cells = [], flat = [], at = [], t0 = null, done = false, prev = '';

  /* the widest glyph that can appear, in em. every cell gets that advance, so
     the line's width depends only on its character count and a scrambling
     glyph cannot make it wobble. michroma is proportional; this is the fix the
     site uses for the wordmark. */
  function cellWidth() {
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    let w = 0;
    for (const ch of GLYPHS + lines.join('')) w = Math.max(w, cv.measureText(ch).width);
    return w / 100;
  }

  /* eased reveal schedule: linear time against thresholds spread by a power
     curve, so glyphs land in clusters and gaps rather than on a metronome. */
  function schedule(n) {
    const last = n > 1 ? n - 1 : 1;
    const order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    const out = new Array(n);
    order.forEach((ci, i) => { out[ci] = Math.pow(i / last, 1.75) * .88 + Math.random() * .12; });
    return out;
  }

  /* the wordmark is fitted too, so tracking changes or a longer name can never
     push it into the safe area. measured rendered, in caps, because
     text-transform is invisible to measureText. */
  function fitWordmark() {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (__CUT.wordmarkW / em).toFixed(3) + 'px';
  }

  function build() {
    const cw = cellWidth();
    sayEl.style.setProperty('--cw', cw.toFixed(4) + 'em');
    /* fit to width from the longest line's cell count, then cap. the cap is the
       brand's and is not raised for a video. */
    const units = Math.max(...lines.map(l => l.length)) * cw;
    /* the statement is capped by a share of the frame, not by a side padding.
       that is what keeps the longest line clear of the edges by a wide margin
       whatever the copy says, and it can only ever come out smaller than the
       brand's hero cap. */
    sayEl.style.fontSize =
      Math.min(__CFG.HERO_CAP, __CUT.vw * __CUT.statementW / units).toFixed(3) + 'px';
    /* the block gets the longest line's width so shorter lines centre inside a
       track that never resizes. */
    sayEl.style.width = (units).toFixed(4) + 'em';

    const lns = [...sayEl.querySelectorAll('.ln')];
    lns.forEach((el, li) => {
      el.textContent = '';
      const row = [];
      for (const ch of lines[li]) {
        const s = document.createElement('span');
        s.className = 'c';
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
        row.push({ el: s, ch });
      }
      cells.push(row);
    });
    flat = cells.flat();
    at = schedule(flat.length);
    prev = flat.map(c => c.ch).join('');
  }

  /* repaint only the cells whose glyph actually changed. never read textContent
     back to compare. */
  function paint(p) {
    let out = '';
    for (let i = 0; i < flat.length; i++) {
      const c = flat[i].ch;
      out += (c === ' ' || p >= at[i]) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    for (let i = 0; i < flat.length; i++) {
      if (out[i] !== prev[i]) flat[i].el.textContent = out[i];
    }
    prev = out;
  }

  function tick(now) {
    if (t0 === null) t0 = now;
    const p = Math.min((now - t0) / DUR, 1);
    if (!done) {
      paint(p);
      if (p >= 1) done = true;
    }
    requestAnimationFrame(tick);
  }

  window.__p4 = {
    ready: false,
    /* the beat's words and the fit that goes with them. every number here is a
       layout value — offsetLeft, offsetWidth, offsetHeight — never a bounding
       rect, because the pill is scaled by the spring and a rect would report
       the transformed box rather than the one the shift has to be solved
       against. the returned box is what will render at scale 1. */
    text(ls) {
      const b = document.getElementById('bubble');
      const pill = b.querySelector('.pill');
      const t = b.querySelector('.pill-t');
      t.textContent = ls.join('\n');
      pill.style.setProperty('--pshift', '0px');
      pill.style.setProperty('--porigin', '0px');

      /* the bubble's own left is fixed by css and does not move when the pill
         shifts, so its rect is a stable origin to measure from. */
      const bx = b.getBoundingClientRect().left;
      const natRight = bx + pill.offsetLeft + pill.offsetWidth;
      /* park the right edge inside the safe line, never outside it, and never
         push a short pill rightward. */
      const sx = Math.min(0, Math.round(__CUT.vw - __CFG.SAFE - __CUT.pillInset - natRight));
      pill.style.setProperty('--pshift', sx + 'px');
      /* the spring has to come out of the trail, not out of whichever corner
         the shift left nearest. -sx is exactly the distance from the shifted
         pill's left edge back to where the dots end. */
      pill.style.setProperty('--porigin', Math.min(-sx, pill.offsetWidth) + 'px');

      const left = b.getBoundingClientRect().left + pill.offsetLeft;
      /* how many line boxes the text actually drew. a range over pre-line text
         hands back a rect per line plus a zero width marker at each forced
         break, so counting rects reads 5 for 3 lines. distinct tops is the
         line count. */
      const rng = document.createRange();
      rng.selectNodeContents(t);
      const tops = new Set([...rng.getClientRects()].map(r => Math.round(r.top)));
      return {
        sx, want: ls.length, drawn: tops.size,
        left: +left.toFixed(1), right: +(left + pill.offsetWidth).toFixed(1),
        top: +(b.getBoundingClientRect().top + pill.offsetTop).toFixed(1),
        w: pill.offsetWidth, h: pill.offsetHeight,
      };
    },
    /* every value arrives already eased from the recorder. dots are [alpha,
       scale] in trail order, pill the same. */
    bubble(dots, pill) {
      const b = document.getElementById('bubble');
      const els = [b.querySelector('.d1'), b.querySelector('.d2'), b.querySelector('.d3')];
      els.forEach((el, i) => {
        el.style.opacity = dots[i][0].toFixed(4);
        el.style.transform = 'scale(' + dots[i][1].toFixed(4) + ')';
      });
      const p = b.querySelector('.pill');
      p.style.opacity = pill[0].toFixed(4);
      p.style.scale = pill[1].toFixed(4);
    },
    /* the mascot's idle, and the proof of it in one call. written after the
       page's rAF tick so these are the values that render, and read back from
       computed style so what is asserted is what was drawn. */
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
    boxes() {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
      return { say: r('#say'), mascot: r('.mascot'), pill: r('.pill'), wordmark: r('#wordmark') };
    },
    /* how close the nearest ink gets to each border, in css px. everything that
       can render is measured, including the dots, because the trail is the
       piece that reaches furthest right. sampled once per beat with that beat's
       pill fully sprung, so the widest bubble state is one of the samples. */
    safe() {
      const sels = ['#say', '.mascot', '.pill', '.d1', '.d2', '.d3', '#wordmark'];
      let left = 1e9, top = 1e9, right = 1e9, bottom = 1e9, worst = null;
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (!el || parseFloat(getComputedStyle(el).opacity) < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = [b.left, b.top, __CUT.vw - b.right, __CUT.vh - b.bottom];
        if (Math.min(...d) < Math.min(left, top, right, bottom)) worst = sel;
        left = Math.min(left, d[0]); top = Math.min(top, d[1]);
        right = Math.min(right, d[2]); bottom = Math.min(bottom, d[3]);
      }
      return { left, top, right, bottom, worst };
    },
  };

  document.fonts.load('400 1em Michroma').then(() => document.fonts.ready).then(() => {
    build();
    fitWordmark();
    paint(0);
    window.__p4.ready = true;
    requestAnimationFrame(tick);
  });
}

/* ---------- what gets injected before the scene's own script ---------- */
function injected() {
  /* deterministic prng. the decode rolls dice for its scramble order, its
     per character jitter and every scramble glyph. same seed, same clip. this
     seed is post4's own, so the scramble is not post2's replayed under new
     words. */
  let seed = 0x5bf03635;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };

  /* rAF off the compositor and into the recorder's hands. callbacks queue here
     and are flushed exactly once per captured frame, with a timestamp that
     advances exactly one frame, so the decode runs at a true 60fps in page
     time. this is the shim record.mjs needs for the blink; here it is the
     decode that would otherwise finish in four frames. */
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

/* ---------- a local static server, so the load sequence is the reel's ---------- */
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

/* ---------- the timeline ----------
   nineteen seconds, and it is written to loop: it opens on a scramble and
   closes with the gaze back near centre and the bubble long gone, so the cut
   back to frame zero reads as the terminal locking on again rather than as a
   jump.

   the four beats do not swap in place the way post2's two do. each one springs
   in, holds 2.90s, and springs out, and then there is empty air before the next
   one arrives. that air is the point: it is where a voice line and a logo go in
   the edit, and it is why the bubble fully exits rather than cross fading.

     beat  words in   words out   gone at   air until the next
       1     1.60       4.50       4.86       1.14s
       2     6.00       8.90       9.26       1.14s
       3    10.40      13.30      13.66       1.14s
       4    14.80      17.70      18.06       0.94s to the last frame

   eye keys are [second, units] and are eased between; a repeated value is a
   deliberate hold. the page caps eye travel at 6 units and these stay inside
   it. nothing is still at the end.

   these are post4's keys, not post2's: four beats to look at instead of two, so
   he goes up to the bubble on each one, and the amount and the direction of the
   look between beats changes every time so the pattern never turns into a
   metronome. */
const EYE_KEYS = [
  [0.00, 0], [1.35, 0],                    /* watches the statement resolve */
  [1.95, 4.8],                             /* beat 1 lands, looks at it */
  [4.20, 4.8],                             /* reads it */
  [4.70, -1.6],                            /* beat 1 gone, glances off left */
  [5.70, -1.6],
  [6.35, 5.4],                             /* beat 2 */
  [8.60, 5.4],
  [9.20, 0],                               /* settles back at the viewer */
  [10.10, 0],
  [10.75, 5.0],                            /* beat 3 */
  [13.00, 5.0],
  [13.55, -3.2],                           /* the widest look away, in the gap */
  [14.40, -3.2],
  [15.15, 4.4],                            /* beat 4 */
  [17.40, 4.4],
  [17.95, 0],                              /* deadpan at the viewer on "try one today." */
  [18.60, 0],
  [19.00, -1.2],                           /* still going when the clip ends */
];

/* seeded, so the rhythm is uneven the way a real one is and identical on every
   run. nothing starts inside the last third of a second: a blink cut in half by
   the end of the file is the one thing a loop cannot hide. post4's own seed. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const BLINKS = (() => {
  const rnd = prng(0x4f1d3);
  const out = [];
  let t = 0.85;
  while (t < SECONDS - 0.35) {
    out.push(t);
    if (rnd() < 0.22) { const d = t + 0.30; if (d < SECONDS - 0.35) out.push(d); }
    t += 1.7 + rnd() * 1.2;
  }
  return out;
})();

/* the site's own numbers: dots stagger 0/70/140ms and spring over .34s, the
   pill springs over .4s, opacity takes .2s. the exit is slowed the way the reel
   slows the site's idle line, because .2s is right for a page and abrupt in a
   clip. */
const DOT_STAGGER = [0, 0.07, 0.14], DOT_SPRING = 0.34;
const PILL_IN = 0.10, PILL_SPRING = 0.40, FADE = 0.20, EXIT = 0.36;
/* the pill is fully sprung at on + PILL_IN + PILL_SPRING. the safe area and the
   fit are sampled a little past that, at scale exactly 1. */
const SETTLED = PILL_IN + PILL_SPRING + 0.30;

/* where the bubble is at time t: [alpha, scale] for each dot, then the pill.
   at most one beat can be live at a time, and between beats this returns rest,
   which is what makes the gaps genuinely empty. */
function bubbleAt(t) {
  const rest = { dots: DOT_STAGGER.map(() => [0, 0.2]), pill: [0, 0.7] };
  const b = BEATS.find(x => t >= x.on && t < x.off + EXIT);
  if (!b) return rest;
  if (t >= b.off) {
    const e = EASE_OUT(span(t, b.off, b.off + EXIT));
    return {
      dots: DOT_STAGGER.map(() => [1 - e, lerp(1, 0.2, e)]),
      pill: [1 - e, lerp(1, 0.7, e)],
    };
  }
  const dots = DOT_STAGGER.map(d => [
    span(t, b.on + d, b.on + d + FADE),
    lerp(0.2, 1, SPRING(span(t, b.on + d, b.on + d + DOT_SPRING))),
  ]);
  const scale = lerp(0.7, 1, SPRING(span(t, b.on + PILL_IN, b.on + PILL_IN + PILL_SPRING)));
  return { dots, pill: [span(t, b.on + PILL_IN, b.on + PILL_IN + FADE), scale] };
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

/* the reel's guards, unchanged. the close is 1-.94p², so its last frame is its
   fastest: at 60fps a legitimate close steps .302 between the final two frames.
   the limit sits above that and far below a collapse, which lands near .94. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
/* the widest turn here is 8.2 units over .55s; eased, its fastest frame moves
   about .50 at 60fps. a snap moves several units in one frame. */
const GAZE_LIMIT = 1.2 * STEP / 16.6667;

/* ---------- render ---------- */
async function render(cut) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const frames = path.join(FRAMES, cut.name);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  console.log('  ' + cut.name + ': ' + cut.vw * DSF + 'x' + cut.vh * DSF);

  const { srv, port } = await serve(sceneHtml(cut));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: cut.vw, height: cut.vh, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: 'light' },
    ],
  });

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => {
    const f = expired; expired = null; if (f) f();
  });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', {
      policy: 'pauseIfNetworkFetchesPending', budget: ms,
    });
    await p;
  };

  /* load under a paused clock, so frame zero is a genuinely fresh page and the
     google fonts request costs real seconds but no virtual milliseconds. */
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  let burned = 0;
  for (let i = 0; i < 120; i++) {
    const ok = await page.evaluate(() => !!(window.__p4 && window.__p4.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__p4 && window.__p4.ready))) {
    throw new Error('the scene never became ready');
  }
  /* michroma has to be the real face. offline the whole clip renders in the
     mono fallback and looks almost right, which is the worst kind of wrong. */
  if (!await page.evaluate(() => document.fonts.check('40px Michroma'))) {
    throw new Error('michroma did not load — the clip would be set in the mono fallback');
  }
  console.log('  scene ready after ' + burned.toFixed(0) + 'ms of virtual time');

  /* every beat is fitted once, up front, before a single frame is captured. the
     pill is at opacity 0 the whole time so none of it renders, and it means the
     widest beat's geometry is known before the run rather than discovered at
     13 seconds in. the cues below re-run the same call at the right moment. */
  const fits = [];
  for (let i = 0; i < BEATS.length; i++) {
    fits.push(await page.evaluate(ls => window.__p4.text(ls), BEATS[i].lines));
  }
  const widest = fits.reduce((a, b) => (b.w > a.w ? b : a));
  await page.evaluate(ls => window.__p4.text(ls), BEATS[0].lines);

  const boxes = await page.evaluate(() => window.__p4.boxes());
  console.log('  statement ' + boxes.say.top.toFixed(0) + '..' + boxes.say.bottom.toFixed(0)
    + ', pill ' + widest.top.toFixed(0) + '..' + (widest.top + widest.h).toFixed(0)
    + ', head ' + boxes.mascot.top.toFixed(0) + '..' + boxes.mascot.bottom.toFixed(0)
    + ', wordmark ' + boxes.wordmark.top.toFixed(0) + '..' + boxes.wordmark.bottom.toFixed(0)
    + '  (css px of ' + cut.vh + ')');
  console.log('  gap between the statement and the widest pill: '
    + (widest.top - boxes.say.bottom).toFixed(0) + 'px, and the pill clears the head by '
    + (boxes.mascot.top - (widest.top + widest.h)).toFixed(0) + 'px');
  for (let i = 0; i < fits.length; i++) {
    const f = fits[i];
    console.log('  beat ' + (i + 1) + ': ' + f.w + 'x' + f.h + 'px, ' + f.drawn + ' lines, '
      + 'x ' + f.left.toFixed(0) + '..' + f.right.toFixed(0)
      + ' (shift ' + f.sx + 'px)  "' + BEATS[i].lines[0] + '"');
  }

  const fired = new Set();
  let wideSeen = null, lastTx = null, gazeJump = { d: 0, t: 0 };
  const eyeMoves = [];
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const blinkSteps = [];
  let safeWorst = null;
  const safeSamples = [];

  /* only the words are cued. everything that moves is written every frame. each
     beat's text is set a quarter second before it springs, while the pill is
     still at opacity 0, so a reflow can never land on a visible frame. */
  const cues = BEATS.map((b, i) => ({
    t: Math.max(0, b.on - 0.25),
    fn: p => p.evaluate(ls => window.__p4.text(ls), b.lines),
  }));
  /* the frame each beat gets measured on: fully sprung, scale exactly 1. fired
     on the first frame at or past the mark rather than on the nearest one, so
     the sample cannot fall between two frames under DEMO_FPS=12, where the
     grid is 83ms and none of these marks land on it. */
  const samples = BEATS.map((b, i) => ({ t: b.on + SETTLED, i }));
  const sampled = new Set();

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS;

    for (const c of cues) {
      if (fired.has(c) || c.t > t) continue;
      fired.add(c);
      await c.fn(page);
    }

    const bub = bubbleAt(t);
    await page.evaluate((d, pl) => window.__p4.bubble(d, pl), bub.dots, bub.pill);

    /* one rAF tick for the scene, exactly one frame's worth. the decode runs
       inside it. */
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);

    /* the idle, written last so it is what renders, and checked. the eyes move
       here, so the guard is on smoothness rather than stillness: no gaze step
       and no lid step bigger than a real one. both limits are frame rate
       relative, so they stay meaningful at 60 and clamp out of the way under
       DEMO_FPS=12, where one frame genuinely is 83ms of eyelid. */
    const eye = await page.evaluate((ex, ey, bl) => window.__p4.life(ex, ey, bl),
      keyAt(EYE_KEYS, t, EASE_IO), 0, blinkFrom(BLINKS, t));

    const tx = parseFloat((eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',')[4]) || 0;
    if (wideSeen === null) wideSeen = eye[1];
    else if (eye[1] !== wideSeen) eyeMoves.push({ t, what: 'wide', was: wideSeen, now: eye[1] });
    if (lastTx !== null) {
      const d = Math.abs(tx - lastTx);
      if (d > gazeJump.d) gazeJump = { d, t };
      if (d > GAZE_LIMIT) eyeMoves.push({ t, what: 'gaze', was: lastTx, now: tx });
    }
    lastTx = tx;
    if (lastBlink !== null) {
      const d = Math.abs(eye[2] - lastBlink);
      if (d > blinkJump.d) blinkJump = { d, t };
      if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: eye[2] });
    }
    lastBlink = eye[2];

    /* the safe area is measured once per beat, on the frame where that beat is
       fully on screen: the statement solid, the wordmark up, that beat's pill
       at scale 1. four samples, so the widest bubble state is measured rather
       than assumed to be the worst, and the worst of the four is what the guard
       is run against. measured live, so it is the drawn boxes that are asserted
       rather than the intended ones. */
    for (const s of samples) {
      if (sampled.has(s) || t < s.t) continue;
      sampled.add(s);
      const sa = await page.evaluate(() => window.__p4.safe());
      safeSamples.push({ beat: s.i + 1, t: +t.toFixed(3), ...sa });
      if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
        < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) safeWorst = sa;
    }

    /* clip.scale is what actually gets device pixels out. a plain
       captureScreenshot hands back css pixels however high the dsf is. */
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: cut.vw, height: cut.vh, scale: DSF },
    });
    fs.writeFileSync(path.join(frames, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);

    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const turns = EYE_KEYS.filter((k, i) => i > 0 && k[1] !== EYE_KEYS[i - 1][1]).length;
  console.log('  idle: ' + BLINKS.length + ' blinks over ' + SECONDS + 's ('
    + (SECONDS / BLINKS.length).toFixed(1) + 's apart), ' + turns + ' eye turns');
  console.log('  gaze: biggest one-frame move ' + gazeJump.d.toFixed(3) + ' units at '
    + gazeJump.t.toFixed(2) + 's, limit ' + GAZE_LIMIT.toFixed(2)
    + ' — --wide held at ' + wideSeen);
  console.log('  blink: biggest one-frame lid step ' + blinkJump.d.toFixed(3)
    + ' at ' + blinkJump.t.toFixed(2) + 's, '
    + (blinkSteps.length ? blinkSteps.length : 'none') + ' over the '
    + BLINK_LIMIT.toFixed(2) + ' limit');
  const dev = v => Math.round(v * DSF);
  for (const s of safeSamples) {
    console.log('  safe area, beat ' + s.beat + ' at ' + s.t.toFixed(2) + 's: '
      + dev(s.left) + 'px left, ' + dev(s.top) + ' top, ' + dev(s.right) + ' right, '
      + dev(s.bottom) + ' bottom (device px, tightest is ' + s.worst + ')');
  }
  console.log('  safe area, worst of the four: ' + dev(safeWorst.left) + 'px left, '
    + dev(safeWorst.top) + ' top, ' + dev(safeWorst.right) + ' right, '
    + dev(safeWorst.bottom) + ' bottom (floor ' + SAFE * DSF + ', tightest is '
    + safeWorst.worst + ')');

  await browser.close();
  srv.close();

  const state = { cut: cut.name, boxes, safe: safeWorst, safeSamples, fits, widest,
    eyeMoves, blinkSteps, blinkJump, gazeJump, wide: wideSeen };
  fs.writeFileSync(path.join(OUT, cut.name + '.json'), JSON.stringify(state, null, 2));
  return state;
}

/* ---------- encode ----------
   the reel's settings, unchanged: libx264, preset slow, crf 17, yuv420p,
   faststart, no audio. sound is added in the edit, on the recipe MEMORY.md
   carries: restaurant music under everything, a servo on the eye turns, a pop
   on each bubble, and now a voice line and a logo in each of the four gaps. */
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

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
  };
}

function encode(cut) {
  const out = path.join(OUT, cut.name + '.mp4');
  console.log('  encoding ' + cut.name + ' ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS),
    '-i', path.join(FRAMES, cut.name, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', '-an', out]);
  return out;
}

/* pull frames back out of the finished mp4, so the check is against what
   shipped rather than against what we meant to ship */
function sampleFrames(mp4, at) {
  const dir = path.join(OUT, 'verify-post4');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [t, name] of at) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', mp4, '-frames:v', '1', path.join(dir, name + '.png')]);
  }
  return dir;
}

/* ---------- go ---------- */
console.log('the boring tek — social clip #4');
const results = [];
for (const cut of CUTS) {
  const state = ONLY_ENCODE
    ? JSON.parse(fs.readFileSync(path.join(OUT, cut.name + '.json'), 'utf8'))
    : await render(cut);
  results.push({ cut, state, file: encode(cut) });
}

const mb = f => (fs.statSync(f).size / 1e6).toFixed(2) + ' MB';
for (const r of results) {
  const p = probe(r.file);
  r.probe = p;
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2) + 's  '
    + mb(r.file) + '  ' + path.relative(ROOT, r.file));
}

const dir = sampleFrames(results[0].file, [
  [0.05, 'a-decode-opens'], [0.60, 'b-decode-mid'], [1.40, 'c-statement-solid'],
  ...BEATS.flatMap((b, i) => [
    [b.on + SETTLED, String.fromCharCode(100 + i * 2) + '-beat' + (i + 1) + '-in'],
    [b.off + EXIT + 0.40, String.fromCharCode(101 + i * 2) + '-gap' + (i + 1)],
  ]),
  /* inside the last frame at any frame rate this runs at */
  [SECONDS - 2 / FPS, 'l-last-frame'],
]);
console.log('  frames sampled from ' + results[0].cut.name + ' into ' + path.relative(ROOT, dir));

/* the editor's card. printed last so it is what is left on screen. */
console.log('\nfor the editor — ' + SECONDS.toFixed(2) + 's, ' + FPS + 'fps, '
  + CUTS[0].vw * DSF + 'x' + CUTS[0].vh * DSF);
console.log('  statement is up from 0.00 to ' + SECONDS.toFixed(2) + ', solid from 1.15');
for (let i = 0; i < BEATS.length; i++) {
  const b = BEATS[i];
  const next = BEATS[i + 1];
  console.log('  beat ' + (i + 1) + '  in ' + b.on.toFixed(2)
    + '  readable ' + (b.on + PILL_IN + PILL_SPRING).toFixed(2) + '..' + b.off.toFixed(2)
    + '  out ' + b.off.toFixed(2) + '  clear ' + (b.off + EXIT).toFixed(2)
    + '  air ' + ((next ? next.on : SECONDS) - (b.off + EXIT)).toFixed(2) + 's'
    + '   ' + b.lines.join(' / '));
}

if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

const fail = [];
for (const { cut, state, probe: p } of results) {
  const tag = cut.name + ': ';
  if (p.w !== cut.vw * DSF || p.h !== cut.vh * DSF) fail.push(tag + 'not ' + cut.vw * DSF + 'x' + cut.vh * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push(tag + 'not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(tag + p.seconds + 's, wanted ' + SECONDS);
  if (state.eyeMoves.length) fail.push(tag + state.eyeMoves.length + ' eye fault(s), first at '
    + state.eyeMoves[0].t.toFixed(2) + 's (' + state.eyeMoves[0].what + ')');
  if (state.blinkSteps.length) fail.push(tag + state.blinkSteps.length
    + ' blink step(s) over the limit — it is flashing, not blinking');
  /* the smoothness guards pass trivially on a mascot that never moves, which is
     exactly what a missing .m-eyes group produces: a still face and a clean
     report. so liveness is checked too. */
  if (!(state.gazeJump.d > 0)) fail.push(tag + 'the eyes never moved — is the .m-eyes group there?');
  if (!(state.blinkJump.d > 0)) fail.push(tag + 'the mascot never blinked');
  if (state.wide !== '1') fail.push(tag + '--wide read back as "' + state.wide + '", wanted 1');

  /* the breaks in BEATS are the design. if a line got long enough for max-width
     to re-wrap it, the pill grew a fourth line, the height went with it, and the
     bubble is eating the gap under the statement. catch it here rather than in
     the frames. */
  for (let i = 0; i < state.fits.length; i++) {
    const f = state.fits[i];
    if (f.drawn !== f.want) {
      fail.push(tag + 'beat ' + (i + 1) + ' drew ' + f.drawn + ' lines, the copy asks for '
        + f.want + ' — a line is re-wrapping against max-width');
    }
    if (f.w > cut.pillMaxW) fail.push(tag + 'beat ' + (i + 1) + ' pill is ' + f.w
      + 'px wide, over the ' + cut.pillMaxW + 'px tripwire');
  }
  /* four samples, one per beat, and the widest bubble state is one of them. */
  if (state.safeSamples.length !== BEATS.length) {
    fail.push(tag + 'the safe area was sampled ' + state.safeSamples.length
      + ' times, wanted one per beat (' + BEATS.length + ')');
  }
  const sa = state.safe;
  const near = Math.min(sa.left, sa.top, sa.right, sa.bottom) * DSF;
  if (near < SAFE * DSF - 0.5) {
    fail.push(tag + sa.worst + ' comes within ' + Math.round(near)
      + 'px of a border, floor is ' + SAFE * DSF);
  }
}
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
