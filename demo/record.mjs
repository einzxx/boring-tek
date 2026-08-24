/* the boring tek — demo reel recorder.
   renders out/reel-demo-1080x1920.mp4 and out/demo-1080x1080.mp4 from the
   real index.html in this repo, served locally. nothing here ships with the
   site: it is tooling, it lives in demo/, and the page it drives is the one
   in git, untouched.

   method: frame by frame Page.captureScreenshot under CDP virtual time, then
   ffmpeg. see README.md for why that beats Page.startScreencast. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FRAMES = path.join(HERE, 'frames');
const OUT = path.join(HERE, 'out');

const FPS = Number(process.env.DEMO_FPS || 60);   /* DEMO_FPS=12 for a fast preview */
const SECONDS = 24.1;
const N = FPS * SECONDS;
const STEP = 1000 / FPS;
const VW = 540, VH = 960, DSF = 2;          /* 540x960 at 2x = 1080x1920 native */
/* the square cut. a fixed band cannot hold both halves of the reel: the wide
   shots put the mascot near the top of the tall frame and the card shots put
   the card in its middle, and they are more than 1080 apart. so the cut pans
   once, slowly, while the camera is already moving to the card — the one
   moment the reframe is invisible. device px, in the 1920 tall master. */
const SQ_FROM = 200, SQ_TO = 420, SQ_AT = 5.8, SQ_OVER = 1.8;

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
/* cubic-bezier(.5,.05,.2,1) — the site's own --ease, solved numerically so the
   camera moves on the same curve the page's transitions do. */
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
    for (let i = 0; i < 6; i++) {            /* newton, then bisect to be sure */
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
const EASE = bezier(.5, .05, .2, 1);         /* the cinematic one */
const EASE_OUT = bezier(.22, 1, .36, 1);     /* cursor arrivals, eye drifts */
const SPRING = bezier(.34, 1.4, .64, 1);     /* the site's own --spring */
const EASE_IO = bezier(.45, 0, .55, 1);      /* idle eye turns, calm both ends */
const lerp = (a, b, p) => a + (b - a) * p;

/* ---------- a local static server for the real page ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};
function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); return res.end('not here');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

/* ---------- what gets injected into the page, before any of its own script ----------
   three jobs: keep the recording offline and deterministic, give the page a
   camera, and give it a cursor. none of it edits index.html. */
function injected() {
  /* deterministic prng — the page rolls dice for blink gaps, idle lines and the
     cta glitch. same seed, same reel, every run. */
  let seed = 0x9e3779b9;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };

  /* english, light theme, no autodetect surprises */
  try {
    localStorage.setItem('bt-lang', 'en');
    localStorage.setItem('bt-theme', 'light');
  } catch (e) { /* private mode, the page copes on its own */ }

  /* ---- the page's animation clock ----
     virtual time drives css transitions and timers correctly, but NOT
     requestAnimationFrame. captureScreenshot forces BeginFrames, and chrome
     emits five or six of them per capture, each carrying a timestamp 83 to
     100ms further on. measured: the page's rAF clock ran 5.5x faster than the
     capture clock. everything the page animates by hand — the wordmark decode,
     the subline typing, the bubble timers and the blink — ran at that speed.
     the blink is 280ms, so a whole one finished inside a single captured
     frame: sampled, it read 0.97 then 0.06 then 0.74 across three frames,
     which is a flash, not a blink, and there were thirteen of them in seven
     seconds.

     so rAF is taken off the compositor and handed to the recorder. callbacks
     queue here and are flushed exactly once per captured frame with a
     timestamp that advances exactly one frame. the page's loop then runs at a
     true 60fps in page time and the blink spreads over the seventeen frames it
     is supposed to take. */
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

  /* the eyes hold still for the whole reel.
     the page tracks the pointer behind `fine`, and it also snaps --ex/--ey to
     zero the instant the form opens. under a moving camera the head moves
     without a remeasure, so the aim is computed against a stale rect for a
     frame and the eyes twitch — visible on every press. answering false to
     that one media query switches the tracking off at the source: the
     pointermove, scroll and pointerleave listeners are never even registered.
     every other query is passed through untouched, so the css :hover rules,
     the cta filling under the cursor and the theme query all still work. */
  const realMM = window.matchMedia.bind(window);
  window.matchMedia = function (q) {
    if (q === '(hover: hover) and (pointer: fine)') {
      return { matches: false, media: q, onchange: null,
        addEventListener() { }, removeEventListener() { },
        addListener() { }, removeListener() { }, dispatchEvent() { return false; } };
    }
    return realMM(q);
  };

  /* NOTHING leaves this browser. the send at the end of the reel is real as far
     as the page is concerned and goes nowhere. */
  const realFetch = window.fetch;
  window.fetch = function (url) {
    const u = String(url && url.url ? url.url : url);
    if (/web3forms|workers\.dev|theboringtek/.test(u)) {
      window.__dmPosts = (window.__dmPosts || 0) + 1;
      /* a beat of latency, so the send button's busy state is on camera the
         way it would be for a real visitor. virtual time makes it exact. */
      return new Promise(res => setTimeout(() => res(new Response('{"success":true}', {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })), 480));
    }
    return realFetch.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', function () {
    /* the camera. everything the page renders goes inside one wrapper and the
       wrapper carries a css transform. fixed children (the top bar) become
       fixed to the wrapper, which is exactly what a camera wants. this listener
       is registered before the page's own script is parsed, so it runs before
       boot() — which then still finds every node it looks for, one level
       deeper. */
    const cam = document.createElement('div');
    cam.id = 'dm-cam';
    while (document.body.firstChild) cam.appendChild(document.body.firstChild);
    document.body.appendChild(cam);

    const css = document.createElement('style');
    css.textContent = [
      'html,body{overflow:hidden}',
      '#dm-cam{transform-origin:0 0;will-change:transform}',
      '#dm-ov{position:fixed;inset:0;z-index:2147483647;pointer-events:none}',
      '#dm-cur{position:absolute;left:0;top:0;width:30px;height:30px;',
      'transform-origin:5px 3px;will-change:transform;opacity:0}',
      '#dm-ring{position:absolute;left:0;top:0;width:56px;height:56px;margin:-28px 0 0 -28px;',
      'border-radius:50%;border:2px solid rgba(20,24,22,.45);opacity:0;will-change:transform,opacity}',
      '#dm-end{position:absolute;inset:0;background:#06070a;opacity:0;',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}',
      '#dm-end .fw{position:relative;width:128px;height:128px}',
      '#dm-end .f{width:128px;height:128px;display:block}',
      '#dm-eyes{transform:translate(calc(var(--dex,0) * 1px),0)}',
      '#dm-end .e{transform-box:fill-box;transform-origin:center;',
      'transform:scaleY(var(--dlid,1))}',
      /* clear of the head, not on it. the face is a white circle on black, so
         a white dot anywhere over it is invisible — on the 45 degree diagonal
         the circle edge is at box (109,19), and the trail has to start past
         it. this is where the site puts its own dots too: above and right of
         the head's box, never on the face. */
      '#dm-eb{position:absolute;left:122px;bottom:116px;width:220px;pointer-events:none}',
      '#dm-eb i{position:absolute;display:block;border-radius:50%;background:#f4f7f5;',
      'transform-origin:50% 50%}',
      '#dm-eb .d1{width:5px;height:5px;left:0;bottom:0}',
      '#dm-eb .d2{width:8px;height:8px;left:11px;bottom:11px}',
      '#dm-eb .p{position:absolute;left:26px;bottom:26px;white-space:nowrap;',
      'background:#f4f7f5;color:#06070a;border-radius:999px;padding:7px 15px;',
      'font-family:var(--body,ui-monospace,monospace);font-size:15px;line-height:1.2;',
      'transform-origin:0% 100%}',
      '#dm-end .w{font-family:Michroma,ui-monospace,monospace;font-size:25px;letter-spacing:.05em;',
      'color:#f4f7f5;text-align:center;line-height:1.4}',
      '#dm-end .s{font-family:var(--body,ui-monospace,monospace);font-size:15px;color:#8b9691;text-align:center}',
      /* the cta holds still for the whole reel. the class still lands, the
         animation simply never plays, so the push at 2.9s is onto a calm
         button rather than a shaking one. */
      '.cta.shake{animation:none !important}',
      '.cta.shake .cta-t{animation:none !important}',
      /* and the eyes never widen. eyesWide() snaps --wide from 1 to 2.2 with
         no transition the moment the form opens, which is a jump. declaring it
         on the eye itself beats the inherited inline value from .mascot. */
      '.m-eye{--wide:1 !important}',
      /* the idle line leaves calmly. the site fades its bubble in and out over
         .2s, which is right for a page and abrupt in a reel. only the exit is
         slowed; the spring entrance is the page's own. the duration lists here
         match the property lists in index.html one for one. */
      '.bubble:not(.on) .dot{transition-duration:.55s,.55s,.5s,.5s}',
      '.bubble:not(.on) .pill{transition-duration:.55s,.55s,.5s,.5s,.5s}',
      /* the check state stays clean to the end card: no start again button.
         scoped by :has(.tick) so it only ever applies to the finished pad —
         the form's own back button, which is the same .btn.ghost, is
         untouched on every step before it. */
      '.pad:has(.tick) .nav{display:none}',
    ].join('');
    document.head.appendChild(css);

    const ov = document.createElement('div');
    ov.id = 'dm-ov';
    ov.innerHTML = [
      '<div id="dm-ring"></div>',
      '<svg id="dm-cur" viewBox="0 0 24 24" fill="none">',
      '<path d="M4 2.2 L4 19.4 L8.6 15.2 L11.4 21.4 L14.6 20 L11.9 13.9 L18 13.7 Z"',
      ' fill="#f4f7f5" stroke="#141816" stroke-width="1.5" stroke-linejoin="round"/></svg>',
      '<div id="dm-end">',
      '<div class="fw">',
      '<svg class="f" viewBox="0 0 64 64" aria-hidden="true">',
      '<circle cx="32" cy="32" r="30" fill="#f4f7f5"/>',
      '<g id="dm-eyes">',
      '<rect class="e" x="15" y="36.3" width="13" height="4.4" rx="2.2" fill="#06070a"/>',
      '<rect class="e" x="36" y="36.3" width="13" height="4.4" rx="2.2" fill="#06070a"/>',
      '</g></svg>',
      '<div id="dm-eb"><i class="d1"></i><i class="d2"></i><span class="p">your move</span></div>',
      '</div>',
      '<div class="w">THEBORINGTEK.COM</div>',
      '<div class="s">tell us what you need</div>',
      '</div>',
    ].join('');
    document.body.appendChild(ov);

    const curEl = ov.querySelector('#dm-cur');
    const ringEl = ov.querySelector('#dm-ring');
    const endEl = ov.querySelector('#dm-end');
    const eyesEl = ov.querySelector('#dm-eyes');
    const dot1 = ov.querySelector('#dm-eb .d1');
    const dot2 = ov.querySelector('#dm-eb .d2');
    const pillEl = ov.querySelector('#dm-eb .p');

    window.__dm = {
      ready: true,
      cam: { tx: 0, ty: 0, z: 1 },
      /* centre page point (cx,cy) on screen at zoom z */
      setCam(cx, cy, z) {
        const tx = innerWidth / 2 - cx * z, ty = innerHeight / 2 - cy * z;
        this.cam = { tx, ty, z };
        cam.style.transform =
          'translate(' + tx.toFixed(3) + 'px,' + ty.toFixed(3) + 'px) scale(' + z.toFixed(5) + ')';
      },
      /* live screen rect — already carries whatever the camera is doing */
      screenRect(sel) {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        if (!b.width && !b.height) return null;
        return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
      },
      /* the same rect in page space, camera undone */
      pageRect(sel) {
        const r = this.screenRect(sel);
        if (!r) return null;
        const c = this.cam;
        return {
          x: (r.x - c.tx) / c.z, y: (r.y - c.ty) / c.z, w: r.w / c.z, h: r.h / c.z,
          cx: (r.cx - c.tx) / c.z, cy: (r.cy - c.ty) / c.z,
        };
      },
      /* a page point to centre on, measured from a live element. with fit set,
         the zoom is derived from the element's real size so the shot frames
         it rather than guessing a number that goes stale the moment the card
         grows a step. */
      focus(sel, o) {
        const r = this.pageRect(sel);
        if (!r) return null;
        let z = o.z || 1;
        if (o.fit) {
          z = Math.min((innerWidth - 2 * o.fit) / r.w, (innerHeight - 2 * o.fit) / r.h);
          z = Math.max(o.minZ || 1, Math.min(o.maxZ || 1.09, z));
        }
        /* the top bar is fixed and paints an opaque scrim over its top 42%.
           park the frame below it, never halfway through it, and never above
           page zero where the scrim's own edge would show against the grain. */
        const half = innerHeight / 2 / z;
        const doc = document.getElementById('dm-cam').offsetHeight;
        let cy = r.cy + (o.dy || 0);
        cy = Math.max(cy, (o.barTop === 0 ? 0 : 88) + half);
        cy = Math.min(cy, Math.max(doc - half, half));
        return { cx: r.cx, cy: cy, z: z };
      },
      cursor(x, y, scale, alpha) {
        curEl.style.opacity = alpha;
        curEl.style.transform =
          'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + scale.toFixed(3) + ')';
      },
      ring(x, y, p) {
        if (p <= 0 || p >= 1) { ringEl.style.opacity = 0; return; }
        ringEl.style.opacity = (1 - p) * 0.85;
        ringEl.style.transform =
          'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + (0.3 + p * 1.0).toFixed(3) + ')';
      },
      end(a) { endEl.style.opacity = a; },
      /* the idle line. say() and fitPill() live in the page's closure, so the
         two clamps fitPill applies are reproduced here rather than reached for.
         the text and the class are the page's own; only the placement maths is
         ours. */
      bubble(text) {
        const b = document.querySelector('.bubble'), pill = document.querySelector('.pill');
        const pt = document.querySelector('.pill-t'), th = document.querySelector('.theme');
        if (!b || !pill || !pt || !th) return;
        if (text === null) { b.classList.remove('on'); return; }
        pt.textContent = text;
        b.classList.add('on');
        pill.style.setProperty('--pshift', '0px');
        pill.style.setProperty('--pshiftY', '0px');
        const br = b.getBoundingClientRect();
        let sx = 0, sy = 0;
        const over = (br.left + pill.offsetLeft + pill.offsetWidth)
          - (document.documentElement.clientWidth - 12);
        if (over > 0) { sx = -Math.round(over); sy = -26; }
        const top = br.top + pill.offsetTop + sy, BAR = th.getBoundingClientRect().bottom + 8;
        if (top < BAR && br.bottom > BAR) sy += Math.round(BAR - top);
        pill.style.setProperty('--pshift', sx + 'px');
        pill.style.setProperty('--pshiftY', sy + 'px');
      },
      /* the end card's mascot is alive: he looks left, blinks, looks right,
         and the line pops in beside him. every value arrives already eased
         from the recorder, on the same curves the page uses. */
      endLife(dex, lid, dotA, dotS, pillA, pillS) {
        eyesEl.style.setProperty('--dex', dex.toFixed(3));
        endEl.style.setProperty('--dlid', lid.toFixed(4));
        for (const d of [dot1, dot2]) {
          d.style.opacity = dotA;
          d.style.transform = 'scale(' + dotS.toFixed(3) + ')';
        }
        pillEl.style.opacity = pillA;
        pillEl.style.transform = 'scale(' + pillS.toFixed(3) + ')';
      },
      /* the page only remeasures the mascot on resize, and the bubble refits
         with it. tracking is off, so this is only here for the pill. */
      poke() { dispatchEvent(new Event('resize')); },

      /* proof that the hero's eyes hold still. the translate on .m-eyes and
         the used value of --wide are the only two things that can move or
         resize an eye outside a blink; both must be constant for the whole
         reel. read from computed style, so a css override counts and an
         inline write that loses to it does not. */
      /* the hero mascot's idle life, and the proof of it in one call.
         written after the page's own rAF tick so these values are the ones
         that render — the page's blink engine still runs its bookkeeping, it
         just never gets the last word. tracking is off at the source, so
         nothing else writes --ex at all. reads back from computed style, so
         what is asserted is what was drawn. */
      hero(ex, ey, blink) {
        const m = document.querySelector('.mascot');
        const g = document.querySelector('.m-eyes'), e = document.querySelector('.m-eye');
        if (!m || !g || !e) return ['gone', '', 1];
        m.style.setProperty('--ex', ex.toFixed(3));
        m.style.setProperty('--ey', ey.toFixed(3));
        m.style.setProperty('--blink', blink.toFixed(4));
        const cs = getComputedStyle(e);
        return [getComputedStyle(g).transform,
          cs.getPropertyValue('--wide').trim(),
          parseFloat(cs.getPropertyValue('--blink')) || 1];
      },
    };
  }, true);
}

/* ---------- the reel ----------
   every camera move and every press names a selector. positions are measured
   in the browser at the moment the move or the press happens, never written
   down here.

   three framing rules the page itself imposes, all learned the hard way:
   - zoom never goes below 1.0. the top bar, the vignette and the grain are all
     position:fixed inside the camera wrapper, so under 1.0 their boxes float
     as visible rectangles in the margin.
   - zoom never goes above 1.09. the page is full bleed at 540 and the subline
     is its widest line, so past that it loses its first and last letter and
     reads as a bug rather than as a crop.
   - a resting shot frames either the very top of the page or everything below
     the bar, never halfway through it. the bar paints an opaque scrim over its
     own top 42%, which shows as a hard horizontal edge against the grain if
     the camera leaves sky above it.
   the camera language here is therefore vertical: reframing, not scale. */
function buildTimeline() {
  const shots = [];      /* camera */
  const cues = [];       /* one-shot actions */
  const moves = [];      /* cursor */

  const cam = (t0, t1, spec, ease) => shots.push({ t0, t1, spec, ease: ease || EASE });
  const at = (t, fn, tag) => cues.push({ t, fn, tag });
  const mv = (t0, t1, sel, dx, dy) => moves.push({ t0, t1, sel, dx: dx || 0, dy: dy || 0 });
  /* the hand leaves. the only place a coordinate is allowed, because the
     destination is off frame rather than on any element. */
  const exit = (t0, t1) => moves.push({ t0, t1, to: { cx: CURSOR_HOME.x, cy: CURSOR_HOME.y }, dx: 0, dy: 0 });
  const press = (t, sel) => cues.push({ t, press: sel });

  const CARD = { sel: '.card', fit: 10, minZ: 1.0, maxZ: 1.09, dy: -50 };
  const TOP = z => ({ cx: 270, cy: VH / 2 / z, z: z });   /* page zero at frame top */

  /* 1 — 0.0 to 3.5  the page arrives and is left alone to do it. the wordmark
         decodes, the subline types, the mascot blinks, and it gets bored. the
         line holds long enough to read twice. a slow push anchored to the top
         of the page, so it is never a still frame and the bar never splits. */
  cam(0.0, 3.5, TOP(1.05));
  at(1.35, p => p.evaluate(() => window.__dm.bubble('boring...')), 'bubble on');
  at(3.45, p => p.evaluate(() => window.__dm.bubble(null)), 'bubble off');

  /* 2 — 3.5 to 5.9  push toward the cta, taking its time. the bar leaves the
         top of frame and the cta comes to the middle. nothing glitches: the
         page's own shake is frozen for the whole reel, so the push lands on a
         calm button and then sits on it for a beat. */
  cam(3.5, 5.7, { cx: 270, cy: 545, z: 1.06 });

  /* 3 — 5.9 to 7.4  cursor enters, presses, the form unfolds, camera reframes */
  mv(5.95, 6.75, '.cta');
  press(6.85, '.cta');
  cam(7.35, 8.45, CARD);

  /* 4 — 7.4 to 13.4  the business path, with pauses a hand would take */
  mv(7.60, 8.20, '.chips .chip:nth-child(1)');           /* check my business */
  press(8.35, '.chips .chip:nth-child(1)');

  mv(8.95, 9.50, '.chips .chip:nth-child(1)');           /* ai for my business */
  press(9.60, '.chips .chip:nth-child(1)');
  mv(10.00, 10.50, '.chips .chip:nth-child(4)');         /* make my work automatic */
  press(10.65, '.chips .chip:nth-child(4)');
  mv(11.10, 11.60, '.nav .btn:last-child');              /* next */
  press(11.75, '.nav .btn:last-child');

  cam(12.05, 12.75, CARD);
  mv(12.20, 12.70, '.chips .chip:nth-child(2)');         /* 2 to 10 people */
  press(12.85, '.chips .chip:nth-child(2)');

  /* 5 — 13.4 to 19.0  last step, in the order a person would do it. the card
         arrives empty: nothing is pre filled. the name types, then the three
         optional fields land one after another a fifth of a second apart so it
         reads as the form completing rather than as a paste, then the address
         types. */
  cam(13.35, 14.20, CARD);

  const fill = (id, v) => p => p.evaluate((i, val) => {
    const e = document.getElementById(i);
    if (!e) return;
    e.value = val;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }, id, v);

  mv(13.45, 13.95, '#f-name');
  press(14.05, '#f-name');
  'Your Business name'.split('').forEach((ch, i) => {
    at(14.20 + i * 0.055, p => p.keyboard.type(ch, { delay: 0 }), 'key');
  });

  at(15.30, fill('f-reg', 'registration number'), 'fill reg');
  at(15.52, fill('f-site', 'yourweb.com'), 'fill site');
  at(15.74, fill('f-country', 'Europe'), 'fill country');

  mv(16.00, 16.40, '#f-email');
  press(16.50, '#f-email');
  'your@business.com'.split('').forEach((ch, i) => {
    at(16.65 + i * 0.060, p => p.keyboard.type(ch, { delay: 0 }), 'key');
  });

  mv(17.85, 18.30, '.nav .btn:last-child');              /* send */
  press(18.40, '.nav .btn:last-child');
  exit(19.00, 19.80);                                    /* job done, hand off */

  /* 6 — 17.5 to 23.0  pull back off the check mark to the whole page — the
         mascot's last line needs the sky above his head — then the end card,
         which now runs three and a half seconds. 1.0 is the floor: see the
         framing rules above. */
  cam(18.80, 20.10, TOP(1.0));

  return { shots, cues, moves };
}

const CURSOR_HOME = { x: VW + 70, y: VH + 70 };   /* off frame, bottom right */

/* the end card, three and a half seconds of it. the mascot looks left, blinks,
   looks right, the line pops in beside him with the site's own spring, and
   then he carries on looking around and blinking to the last frame — nothing
   freezes on the hold. eye keys are [second, units] and are eased between; a
   repeated value is a deliberate hold. all absolute, on the 23s timeline. */
const END_FROM = 20.20, END_OVER = 0.55;
const EYE_KEYS = [
  [20.35, 0], [20.69, -4.5],                     /* look left */
  [21.15, -4.5], [21.51, 4.2],                   /* and right, toward the line */
  [22.55, 4.2], [22.95, -3.0],                   /* back across */
  [23.55, -3.0], [24.05, 3.4],                   /* and over again, still going */
];
const BLINKS = [20.80, 22.15, 23.05, 23.65];
const DOTS = [21.35, 21.45];
const PILL = [21.45, 21.87];

/* the page's own lid: eases shut, holds a beat shut, eases back open. copied
   rather than reached for, because it lives in index.html's closure — but it
   is the same shape, so the end card blinks like the hero does. */
/* the close is 1-.94p², so its last frame is its fastest: at 60fps a perfectly
   legitimate close steps .302 between the final two frames. the limit sits
   above that and far below a collapse, which lands near .94. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
/* the widest idle turn is 7.4 units over .8s, and eased its fastest frame moves
   about .31 at 60fps. a snap — the form opening and slamming --ex back to zero,
   say — moves 3.7 in one frame. the limit sits between, with room. */
const GAZE_LIMIT = 1.0 * STEP / 16.6667;

function lidAt(ms) {
  const LID = .06, CLOSE = 95, HOLD = 45, OPEN = 140;
  if (ms < 0) return 1;
  if (ms < CLOSE) { const p = ms / CLOSE; return 1 - (1 - LID) * p * p; }
  if (ms < CLOSE + HOLD) return LID;
  const q = (ms - CLOSE - HOLD) / OPEN;
  if (q >= 1) return 1;
  return LID + (1 - LID) * (1 - (1 - q) * (1 - q));
}
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

/* where a set of [second, value] keys puts something at time t */
function keyAt(keys, t, ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (ease || EASE_OUT)(span(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}
/* one lid value from whichever blink in the list is running, if any */
function blinkFrom(list, t) {
  let v = 1;
  for (const b of list) v = Math.min(v, lidAt((t - b) * 1000));
  return v;
}

/* ---------- the hero mascot's idle ----------
   he is on screen for the whole reel and he should not read as a sticker.
   tracking stays off — he is not following anything, he is just alive. the
   page's own blink engine leaves 3 to 5 seconds between blinks, which is too
   sparse here, so the recorder drives both the lid and the gaze.

   generated once from a fixed seed rather than written out by hand, so the
   rhythm is uneven the way a real one is and identical on every run. the page
   caps eye travel at EX=6 user units; these turns stay well inside it. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const HERO_EYES = (() => {
  const rnd = prng(0x5eed1);
  const keys = [[0, 0]];
  let t = 1.1, side = -1, n = 0;
  while (t < SECONDS + 2) {
    const turn = 0.8 + rnd() * 0.5;                 /* slow, .8 to 1.3s */
    const rest = 1.2 + rnd() * 1.0;                 /* then sit there */
    /* every third look comes back through the middle, which is what stops it
       reading as a metronome */
    const to = (n % 3 === 2) ? 0 : side * (2.4 + rnd() * 1.3);
    keys.push([t, keys[keys.length - 1][1]]);       /* hold until now */
    keys.push([t + turn, to]);
    t += turn + rest;
    if (n % 3 !== 2) side = -side;
    n++;
  }
  return keys;
})();

const HERO_BLINKS = (() => {
  const rnd = prng(0xb11f5);
  const out = [];
  let t = 0.75;
  while (t < SECONDS) {
    out.push(t);
    if (rnd() < 0.2) out.push(t + 0.30);            /* now and then, twice */
    t += 2.0 + rnd() * 1.1;                         /* roughly every 2 to 3s */
  }
  return out;
})();

/* ---------- render ---------- */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME in record.mjs');
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const { srv, port } = await serve();
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

  /* load under a paused clock so the reel opens on a genuinely fresh page.
     pauseIfNetworkFetchesPending means the google fonts request costs real
     seconds but no virtual milliseconds. */
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  let burned = 0;
  for (let i = 0; i < 90; i++) {
    const ok = await page.evaluate(() => !!(window.__dm && window.__dm.ready
      && document.fonts.status === 'loaded' && document.querySelector('.cta'))).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__dm && window.__dm.ready))) {
    throw new Error('the page never became ready');
  }
  console.log('  page ready after ' + burned.toFixed(0) + 'ms of virtual time');

  const { shots, cues, moves } = buildTimeline();
  const presses = [];
  let cursor = Object.assign({}, CURSOR_HOME), cursorAlpha = 0;
  let pressAt = -99, pressPoint = { x: 0, y: 0 };
  let curCam = { cx: VW / 2, cy: VH / 2, z: 1 };        /* page zero at frame top */
  let camLeg = null;
  const moveFrom = new Map();
  const fired = new Set();
  let wideSeen = null, lastTx = null, gazeJump = { d: 0, t: 0 };
  const eyeMoves = [];
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const blinkSteps = [];

  const resolve = async spec => {
    if (!spec.sel) return { cx: spec.cx, cy: spec.cy, z: spec.z };
    const f = await page.evaluate((s, o) => window.__dm.focus(s, o), spec.sel, spec);
    return f || curCam;                                  /* element gone: hold */
  };

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS;

    /* --- cues --- */
    for (const c of cues) {
      if (fired.has(c) || c.t > t) continue;
      fired.add(c);
      if (c.press) {
        const r = await page.evaluate(s => window.__dm.screenRect(s), c.press);
        if (!r) { console.warn('  ! press target missing: ' + c.press + ' @' + t.toFixed(2) + 's'); continue; }
        /* press wherever the cursor actually is, and record both, so the check
           afterwards runs on real numbers rather than on intent */
        const px = cursor.x, py = cursor.y;
        const inside = px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
        presses.push({ t, frame: f, sel: c.press, cursor: { x: px, y: py }, rect: r, inside });
        pressAt = t; pressPoint = { x: px, y: py };
        await page.mouse.click(px, py, { delay: 16 });
      } else if (c.fn) {
        await c.fn(page);
      }
    }

    /* --- camera --- */
    let leg = null;
    for (const s of shots) if (t >= s.t0) leg = s;
    if (leg) {
      if (!camLeg || camLeg.leg !== leg) {
        camLeg = { leg, from: Object.assign({}, curCam), to: await resolve(leg.spec) };
      }
      const span = Math.max(leg.t1 - leg.t0, 1e-6);
      const p = leg.ease(Math.min((t - leg.t0) / span, 1));
      const to = camLeg.to;
      curCam = {
        cx: lerp(camLeg.from.cx, to.cx, p),
        cy: lerp(camLeg.from.cy, to.cy, p),
        z: lerp(camLeg.from.z, to.z, p),
      };
    }
    await page.evaluate(c => window.__dm.setCam(c.cx, c.cy, c.z), curCam);

    /* --- cursor ---
       the target is re-measured every frame, so the cursor stays glued to an
       element the camera is still moving under it. */
    let leadMove = null;
    for (const m of moves) if (t >= m.t0) leadMove = m;
    if (leadMove) {
      if (!moveFrom.has(leadMove)) moveFrom.set(leadMove, Object.assign({}, cursor));
      const from = moveFrom.get(leadMove);
      const span = Math.max(leadMove.t1 - leadMove.t0, 1e-6);
      const p = EASE_OUT(Math.min((t - leadMove.t0) / span, 1));
      const r = leadMove.sel
        ? await page.evaluate(s => window.__dm.screenRect(s), leadMove.sel)
        : leadMove.to;
      if (r) cursor = { x: lerp(from.x, r.cx + leadMove.dx, p), y: lerp(from.y, r.cy + leadMove.dy, p) };
      cursorAlpha = Math.min(1, cursorAlpha + 0.14);
    }

    const since = t - pressAt;
    let scale = 1, ringP = -1;
    if (since >= 0 && since < 0.28) {
      const q = since / 0.28;
      scale = 1 - 0.2 * Math.sin(Math.min(q * 3.4, 1) * Math.PI);
      ringP = q;
    }
    const endA = t < END_FROM ? 0 : Math.min(1, (t - END_FROM) / END_OVER);

    /* the end card's mascot: left, blink, right, the line pops, and he keeps
       looking around and blinking until the video stops */
    const dex = keyAt(EYE_KEYS, t);
    const lid = blinkFrom(BLINKS, t);
    const dotP = span(t, DOTS[0], DOTS[1]);
    const pillP = span(t, PILL[0], PILL[1]);

    await page.evaluate((x, y, s, a, rx, ry, rp, ea, life) => {
      window.__dm.cursor(x, y, s, ea > 0 ? a * (1 - ea) : a);
      window.__dm.ring(rx, ry, rp);
      window.__dm.end(ea);
      window.__dm.endLife(life[0], life[1], life[2], life[3], life[4], life[5]);
    }, cursor.x, cursor.y, scale, cursorAlpha, pressPoint.x, pressPoint.y, ringP, endA,
      [dex, lid,
        dotP, 0.3 + 0.7 * SPRING(dotP),
        Math.min(1, pillP * 3), 0.32 + 0.68 * SPRING(pillP)]);
    /* --- one rAF tick for the page, exactly one frame's worth --- */
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);

    /* --- the hero's idle, written last so it is what renders, and checked ---
       the eyes may now move, so the guard is on smoothness rather than
       stillness: no gaze step and no lid step bigger than a real one. both
       limits are frame rate relative, so they stay meaningful at 60 and clamp
       out of the way under DEMO_FPS=12, where one frame genuinely is 83ms of
       eyelid. --wide must still never budge off 1. */
    const eye = await page.evaluate((ex, ey, bl) => window.__dm.hero(ex, ey, bl),
      keyAt(HERO_EYES, t, EASE_IO), 0, blinkFrom(HERO_BLINKS, t));

    const tx = parseFloat((eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',')[4]) || 0;
    if (wideSeen === null) wideSeen = eye[1];
    else if (eye[1] !== wideSeen) eyeMoves.push({ t: t, what: 'wide', was: wideSeen, now: eye[1] });
    if (lastTx !== null) {
      const d = Math.abs(tx - lastTx);
      if (d > gazeJump.d) gazeJump = { d: d, t: t };
      if (d > GAZE_LIMIT) eyeMoves.push({ t: t, what: 'gaze', was: lastTx, now: tx });
    }
    lastTx = tx;
    if (lastBlink !== null) {
      const d = Math.abs(eye[2] - lastBlink);
      if (d > blinkJump.d) blinkJump = { d: d, t: t };
      if (d > BLINK_LIMIT) blinkSteps.push({ t: t, from: lastBlink, to: eye[2] });
    }
    lastBlink = eye[2];

    /* a real pointer follows the drawn one: the mascot's eyes track it and the
       cta lights on hover, exactly as they would for a visitor */
    if (cursorAlpha > 0 && endA === 0) {
      /* once the drawn cursor is off frame the real one parks in the top left,
         inside the bar, which is pointer-events:none. clamping it to the edge
         instead would leave it hovering whatever the last reflow put under it
         — after the send, that is one of the cards below the hero. */
      const off = cursor.x < 0 || cursor.x > VW || cursor.y < 0 || cursor.y > VH;
      await page.mouse.move(off ? 2 : cursor.x, off ? 2 : cursor.y);
      await page.evaluate(() => window.__dm.poke());
    }

    /* --- shoot, then let the page's own clock run exactly one frame --- */
    /* clip.scale is what actually gets the device pixels out. a plain
       captureScreenshot hands back css pixels — 540x960 — however high the
       viewport's deviceScaleFactor is, and the reel would be a soft upscale. */
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);

    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const posts = await page.evaluate(() => window.__dmPosts || 0);
  console.log('  ' + posts + ' form post(s), every one intercepted — nothing left the browser');
  const turns = HERO_EYES.filter((k, i) => i > 0 && k[1] !== HERO_EYES[i - 1][1]).length;
  console.log('  hero idle: ' + HERO_BLINKS.length + ' blinks over ' + SECONDS + 's ('
    + (SECONDS / HERO_BLINKS.length).toFixed(1) + 's apart), ' + turns + ' eye turns');
  console.log('  gaze: biggest one-frame move ' + gazeJump.d.toFixed(3) + ' units at '
    + gazeJump.t.toFixed(2) + 's, limit ' + GAZE_LIMIT.toFixed(2)
    + ' — --wide held at ' + wideSeen);
  console.log('  blink: biggest one-frame lid step ' + blinkJump.d.toFixed(3)
    + ' at ' + blinkJump.t.toFixed(2) + 's, '
    + (blinkSteps.length ? blinkSteps.length : 'none') + ' over the '
    + BLINK_LIMIT.toFixed(2) + ' limit');
  if (eyeMoves.length) {
    console.log('  ! ' + eyeMoves.length + ' eye fault(s), first at '
      + eyeMoves[0].t.toFixed(2) + 's (' + eyeMoves[0].what + ')');
  }

  await browser.close();
  srv.close();
  fs.writeFileSync(path.join(OUT, 'presses.json'),
    JSON.stringify({ presses, eyeMoves, blinkSteps, blinkJump, gazeJump, wide: wideSeen }, null, 2));
  return { presses, eyeMoves, blinkSteps };
}

/* ---------- encode ---------- */
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

function encode() {
  const tall = path.join(OUT, 'reel-demo-1080x1920.mp4');
  const sq = path.join(OUT, 'demo-1080x1080.mp4');
  console.log('  encoding 1080x1920 ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS),
    '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', '-an', tall]);
  console.log('  cutting 1080x1080 ...');
  /* smoothstep on the pan, and rounded to an even line so the chroma planes
     land where yuv420p wants them */
  const p = 'min(max((t-' + SQ_AT + ')/' + SQ_OVER + '\\,0)\\,1)';
  const y = SQ_FROM + '+' + (SQ_TO - SQ_FROM) + '*(3*' + p + '*' + p + '-2*' + p + '*' + p + '*' + p + ')';
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', tall,
    '-vf', 'crop=w=1080:h=1080:x=0:y=2*floor((' + y + ')/2)',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', '-an', sq]);
  return { tall, sq };
}

/* pull the exact frame of every press back out of the finished mp4, so the
   check is against what shipped rather than against what we meant to ship */
function sampleFrames(mp4, presses) {
  const dir = path.join(OUT, 'verify');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const p of presses) {
    const name = 'press-' + p.t.toFixed(2) + 's-' + p.sel.replace(/[^a-z0-9]+/gi, '_') + '.png';
    const f = path.join(dir, name);
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(p.t + 0.02),
      '-i', mp4, '-frames:v', '1', f]);
    p.sample = path.relative(HERE, f);
  }
  return dir;
}

/* ---------- go ---------- */
console.log('the boring tek — demo reel');
const { presses, eyeMoves, blinkSteps } = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'presses.json'), 'utf8'))
  : await render();
const { tall, sq } = encode();

console.log('\nverify');
let bad = 0;
for (const p of presses) {
  const dx = p.cursor.x - (p.rect.x + p.rect.w / 2);
  const dy = p.cursor.y - (p.rect.y + p.rect.h / 2);
  if (!p.inside) bad++;
  console.log('  ' + (p.inside ? 'ok  ' : 'MISS') + ' ' + p.t.toFixed(2) + 's  '
    + p.sel.padEnd(30) + ' cursor(' + p.cursor.x.toFixed(0) + ',' + p.cursor.y.toFixed(0) + ')'
    + ' in rect ' + p.rect.x.toFixed(0) + ',' + p.rect.y.toFixed(0)
    + ' ' + p.rect.w.toFixed(0) + 'x' + p.rect.h.toFixed(0)
    + '  off centre ' + dx.toFixed(0) + ',' + dy.toFixed(0));
}
const a = probe(tall), b = probe(sq);
const mb = f => (fs.statSync(f).size / 1e6).toFixed(1) + ' MB';
console.log('  ' + a.w + 'x' + a.h + ' @' + a.fps + 'fps ' + a.seconds.toFixed(2) + 's  '
  + mb(tall) + '  ' + path.relative(ROOT, tall));
console.log('  ' + b.w + 'x' + b.h + ' @' + b.fps + 'fps ' + b.seconds.toFixed(2) + 's  '
  + mb(sq) + '  ' + path.relative(ROOT, sq));

sampleFrames(tall, presses);
fs.writeFileSync(path.join(OUT, 'presses.json'),
  JSON.stringify({ presses, eyeMoves }, null, 2));
console.log('  press frames sampled from the mp4 into '
  + path.relative(ROOT, path.join(OUT, 'verify')));
if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

const fail = [];
if (a.w !== 1080 || a.h !== 1920) fail.push('the reel is not 1080x1920');
if (b.w !== 1080 || b.h !== 1080) fail.push('the square cut is not 1080x1080');
if (Math.abs(a.fps - FPS) > 0.5) fail.push('the reel is not ' + FPS + 'fps');
if (Math.abs(a.seconds - SECONDS) > 0.35) fail.push('the reel is ' + a.seconds + 's, wanted about ' + SECONDS);
if (bad) fail.push(bad + ' press(es) landed outside the target');
if (eyeMoves && eyeMoves.length) fail.push('the hero eyes jumped on ' + eyeMoves.length + ' frame(s)');
if (blinkSteps && blinkSteps.length) fail.push('the blink jumped on ' + blinkSteps.length + ' frame(s) — it is flashing, not blinking');
if (fail.length) { console.error('\nFAILED\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
