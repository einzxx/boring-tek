/* the boring tek — props: beams background.

   a port of kokonutui's BeamsBackground (components/kokonutui/beams-background.tsx)
   by @dorianbaffier, MIT. the original is a canvas of thirty soft diagonal
   beams drifting upward, blurred twice (once in the canvas, once in css),
   each one pulsing on its own phase. this is the same canvas, the same beam
   model, the same two blurs, driven by `apply(t)` instead of a rAF loop.

   what changed on the way in:
     the beams were a cyan to blue hue ramp. ours paint in --accent, read out
     of the page live, so the light theme gets its readable green and the dark
     theme the phosphor one, and a theme flip mid clip is honoured on the next
     frame. the hue ramp across beams became a small lightness ramp instead,
     so the layer is not one flat colour.
     the random is seeded, so the field is identical on every run, and a beam's
     y is arithmetic on t rather than a step from the previous frame: a frame
     is a function of time and of nothing else, which is the rig's rule. when
     a beam has travelled off the top, the original re rolled it into one of
     three columns; here the re roll is a function of how many times it has
     wrapped, so it still lands in a column and still lands in the same one on
     every run.
     the backdrop filter overlay is gone. a 50px backdrop blur over a 15px
     blurred canvas is a compositor cost with no visible return at this size.

   ---------------------------------------------------------------------------
   MIT License. Copyright (c) 2025 kokonutUI.
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to
   deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
   sell copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions: The above copyright
   notice and this permission notice shall be included in all copies or
   substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
   WITHOUT WARRANTY OF ANY KIND. https://github.com/kokonut-labs/kokonutui
   ---------------------------------------------------------------------------
*/

export const BEAMS_DEFAULTS = {
  id: 'beams',
  w: 540, h: 960, dsf: 2,
  beams: 30,                 /* MINIMUM_BEAMS * 1.5 */
  intensity: 'strong',       /* subtle .7, medium .85, strong 1 */
  canvasBlur: 35,            /* ctx.filter, px */
  cssBlur: 15,               /* the second blur, on the element */
  seed: 20260918,
  ink: '--accent',           /* the token the beams read, live */
  /* the original ran at whatever rAF gave it; its speeds are per frame, so
     they are scaled by this to become per second. */
  fps: 60,
};

export function beamsCss(o = {}) {
  const c = { ...BEAMS_DEFAULTS, ...o };
  return `.${c.id}{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.${c.id} canvas{position:absolute;inset:0;width:100%;height:100%;filter:blur(${c.cssBlur}px)}`;
}

export function beamsMarkup(o = {}) {
  const c = { ...BEAMS_DEFAULTS, ...o };
  return `<div class="${c.id}" id="${c.id}"><canvas width="${c.w * c.dsf}" height="${c.h * c.dsf}"></canvas></div>`;
}

export function beamsScript(o = {}) {
  const c = { ...BEAMS_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify(c)};
  var root = document.getElementById(C.id);
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  ctx.scale(C.dsf, C.dsf);
  var W = C.w, H = C.h;
  var opacityMap = { subtle: 0.7, medium: 0.85, strong: 1 };
  var r = B.prng(C.seed);
  /* createBeam, verbatim but for the seed and the hue. */
  var beams = [];
  for (var i = 0; i < C.beams; i++) {
    beams.push({
      x: r() * W * 1.5 - W * 0.25,
      y: r() * H * 1.5 - H * 0.25,
      width: 30 + r() * 60,
      length: H * 2.5,
      angle: -35 + r() * 10,
      speed: 0.6 + r() * 1.2,
      opacity: 0.12 + r() * 0.16,
      tone: r(),
      pulse: r() * Math.PI * 2,
      pulseSpeed: 0.02 + r() * 0.03,
    });
  }
  /* resetBeam, as a function of the wrap count k rather than of the moment
     the beam left the screen. */
  function reset(b, index, k) {
    var q = B.prng(C.seed + index * 7919 + k * 104729);
    var column = index % 3, spacing = W / 3;
    return {
      x: column * spacing + spacing / 2 + (q() - 0.5) * spacing * 0.5,
      width: 100 + q() * 100,
      speed: 0.5 + q() * 0.4,
      opacity: 0.2 + q() * 0.1,
      tone: index / C.beams,
    };
  }
  var ink = [0, 0, 0], inkTheme = null;
  function readInk() {
    var th = document.documentElement.getAttribute('data-theme') || 'light';
    if (th !== inkTheme) { ink = B.rgb(C.ink); inkTheme = th; }
  }
  function colour(tone, a) {
    /* the hue ramp became a lightness ramp: up to 18% toward white across
       the field, so beams are not one flat green. */
    var k = 0.18 * tone;
    var rr = Math.round(ink[0] + (255 - ink[0]) * k), gg = Math.round(ink[1] + (255 - ink[1]) * k), bb = Math.round(ink[2] + (255 - ink[2]) * k);
    return 'rgba(' + rr + ',' + gg + ',' + bb + ',' + a.toFixed(3) + ')';
  }
  function drawBeam(b, x, y, width, speed, opacity, tone, pulse) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle * Math.PI / 180);
    var po = opacity * (0.8 + Math.sin(pulse) * 0.2) * opacityMap[C.intensity];
    var g = ctx.createLinearGradient(0, 0, 0, b.length);
    g.addColorStop(0, colour(tone, 0));
    g.addColorStop(0.1, colour(tone, po * 0.5));
    g.addColorStop(0.4, colour(tone, po));
    g.addColorStop(0.6, colour(tone, po));
    g.addColorStop(0.9, colour(tone, po * 0.5));
    g.addColorStop(1, colour(tone, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-width / 2, 0, width, b.length);
    ctx.restore();
  }
  function apply(t) {
    readInk();
    ctx.setTransform(C.dsf, 0, 0, C.dsf, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.filter = 'blur(' + C.canvasBlur + 'px)';
    var f = t * C.fps;   /* the original's frame count */
    for (var i = 0; i < beams.length; i++) {
      var b = beams[i];
      /* first pass: the beam as born, until its foot clears the top. */
      var y = b.y - b.speed * f;
      var top = -b.length - 100;
      var x = b.x, width = b.width, opacity = b.opacity, tone = b.tone;
      if (y < top) {
        /* it has wrapped. every later pass starts at H + 100 with the re
           rolled speed, so the k'th pass is found by walking the passes. the
           walk is short: a beam crosses in at most a few thousand frames. */
        var left = (b.y - top) / b.speed;     /* frames spent on pass 0 */
        var k = 1, rest = f - left, R = reset(b, i, k);
        var span = (H + 100 - top) / R.speed;
        while (rest > span) { rest -= span; k++; R = reset(b, i, k); span = (H + 100 - top) / R.speed; }
        y = H + 100 - R.speed * rest;
        x = R.x; width = R.width; opacity = R.opacity; tone = R.tone;
      }
      drawBeam(b, x, y, width, b.speed, opacity, tone, b.pulse + b.pulseSpeed * f);
    }
    ctx.filter = 'none';
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}
