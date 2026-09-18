/* the boring tek — props: the shared floor.

   every module in demo/lib/props/ is a port of somebody else's react
   component into the rig's shape: a css string, a markup string and a script
   string, no react, no framework, no npm. the page side of each one registers
   itself on `window.__props.<name>` with one method, `apply(t)`, and a frame
   is a pure function of that t. node calls it per captured frame under virtual
   time, which is the rule every clip in demo/ runs on; in a live browser
   `__props.play()` runs the same function off requestAnimationFrame.

   this file is what they share:

     propsTokens()   the site's own :root and dark blocks, lifted out of
                     index.html at run time by lib/captions.mjs, so a prop never
                     holds a colour of its own and "both themes" is a fact
                     rather than a claim.
     FONTS_LINK      the site's one google fonts request, michroma and space
                     grotesk 400/500, the whole budget.
     propsRuntime()  the in page helpers: the site's --ease and --spring as
                     solved curves, a lerp, a span, a seeded generator and the
                     __props registry. a prop uses `__bt.ease(p)` where motion
                     used `ease: [...]`.
*/

import { brandTokens } from '../captions.mjs';

export const FONTS_LINK = 'https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap';

/* the two blocks, as css. `html[data-theme=dark]` is index.html's own
   selector, so a page that flips `data-theme` on <html> flips every prop. */
export function propsTokens() {
  const { light, dark } = brandTokens();
  return ':root{\n' + light + '\n}\nhtml[data-theme=dark]{\n' + dark + '\n}\n'
    + 'html[lang=ru]{--body:var(--mono)}\n';
}

/* the base css every prop assumes. box sizing and the two families only. */
export function propsBaseCss() {
  return `*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);font-family:var(--body)}`;
}

/* the page runtime. the bezier solver is lib/captions.mjs's, serialised, so a
   prop moves on exactly the curves the site moves on. */
export function propsRuntime() {
  return `window.__bt = window.__bt || (function(){
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    var fx = function(t){ return ((ax * t + bx) * t + cx) * t; };
    var dfx = function(t){ return (3 * ax * t + 2 * bx) * t + cx; };
    var fy = function(t){ return ((ay * t + by) * t + cy) * t; };
    return function(x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, e, d;
      for (i = 0; i < 6; i++) {
        e = fx(t) - x; d = dfx(t);
        if (Math.abs(e) < 1e-6) return fy(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      var lo = 0, hi = 1; t = x;
      for (i = 0; i < 30; i++) {
        e = fx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        if (e > 0) hi = t; else lo = t;
        t = (lo + hi) / 2;
      }
      return fy(t);
    };
  }
  /* a seeded lcg, the same one lib/mascot.mjs seeds its idle from: a prop
     that needs "random" gets the same random on every run. */
  function prng(seed) {
    var s = seed >>> 0;
    return function() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  var B = {
    bezier: bezier,
    ease: bezier(.16, 1, .3, 1),        /* the site's --ease */
    spring: bezier(.34, 1.4, .64, 1),   /* the site's --spring */
    io: bezier(.45, 0, .55, 1),
    lerp: function(a, b, p){ return a + (b - a) * p; },
    span: function(t, a, b){ return b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))); },
    prng: prng,
    /* the accent, as three numbers, for anything that paints on a canvas and
       cannot take a css variable. read live, so a theme flip is honoured. */
    rgb: function(name) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      var m = v.match(/^#([0-9a-f]{6})$/i);
      if (m) return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
      m = v.match(/rgba?\(([^)]+)\)/);
      if (m) return m[1].split(',').slice(0,3).map(function(s){ return parseFloat(s); });
      return [0, 0, 0];
    },
  };
  return B;
})();
window.__props = window.__props || (function(){
  var reg = {};
  var P = {
    add: function(name, prop){ reg[name] = prop; return prop; },
    get: function(name){ return reg[name]; },
    names: function(){ return Object.keys(reg); },
    /* one t for every prop on the page. */
    apply: function(t){ for (var k in reg) reg[k].apply(t); },
    /* the live browser path: a real clock, the same function. */
    play: function(){
      var t0 = performance.now();
      function tick(now){ P.apply((now - t0) / 1000); P._raf = requestAnimationFrame(tick); }
      P._raf = requestAnimationFrame(tick);
    },
    stop: function(){ if (P._raf) cancelAnimationFrame(P._raf); P._raf = 0; },
  };
  return P;
})();`;
}
