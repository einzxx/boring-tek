/* the boring tek — props: background paths.

   a port of kokonutui's BackgroundPaths (components/kokonutui/background-paths.tsx)
   by @dorianbaffier, MIT. the original is a react component drawing 37 bezier
   sweeps with motion/react; this is the same 37 sweeps, the same generator,
   the same three layers at the same widths and opacities, as one svg driven
   by `apply(t)`.

   what changed on the way in:
     the purple pink blue gradient stroke is gone. the primary and secondary
     layers stroke in --fg, the accent layer in --accent, which is the whole
     brand palette: one ink, one green. opacity per path is the original's.
     motion's `y: [0, -15, 0]` repeat reverse is a cosine on the same period,
     and its 1s scale .8 to 1 entrance runs on the site's --ease.
     the generator's Math.random ids are gone; ids come from the layer index.

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

export const PATHS_DEFAULTS = {
  id: 'paths',
  /* the original's viewbox. xMidYMid slice, so a portrait stage sees the
     middle of the sweep. */
  viewBox: '-2400 -800 4800 1600',
  /* the three layers: count, base opacity and step, base width and step, the
     bob amplitude and its period in seconds. straight from the source. */
  layers: [
    { kind: 'primary',   n: 12, o0: 0.15, oStep: 0.02,  w0: 4, wStep: 0.3,  bob: 15, period: 8, g: 1.0 },
    { kind: 'secondary', n: 15, o0: 0.12, oStep: 0.015, w0: 3, wStep: 0.25, bob: 10, period: 6, g: 0.8 },
    { kind: 'accent',    n: 10, o0: 0.08, oStep: 0.12,  w0: 2, wStep: 0.2,  bob: 5,  period: 4, g: 0.6 },
  ],
  position: 1,
  enter: 1.0,           /* seconds, opacity and scale in */
  ink: 'var(--fg)',
  accent: 'var(--accent)',
};

/* generateAestheticPath, verbatim but for the types. */
function aestheticPath(index, position, type) {
  const baseAmplitude = type === 'primary' ? 150 : type === 'secondary' ? 100 : 60;
  const phase = index * 0.2;
  const segments = type === 'primary' ? 10 : type === 'secondary' ? 8 : 6;
  const startX = 2400, startY = 800, endX = -2400, endY = -800 + index * 25;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;
    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;
    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 = Math.sin(progress * Math.PI * 3 + phase) * (baseAmplitude * 0.7 * amplitudeFactor);
    const wave2 = Math.cos(progress * Math.PI * 4 + phase) * (baseAmplitude * 0.3 * amplitudeFactor);
    const wave3 = Math.sin(progress * Math.PI * 2 + phase) * (baseAmplitude * 0.2 * amplitudeFactor);
    points.push({ x: baseX * position, y: baseY + wave1 + wave2 + wave3 });
  }
  const r = v => v.toFixed(1);
  return points.map((p, i) => {
    if (i === 0) return `M ${r(p.x)} ${r(p.y)}`;
    const q = points[i - 1], tension = 0.4;
    const cp1x = q.x + (p.x - q.x) * tension, cp1y = q.y;
    const cp2x = q.x + (p.x - q.x) * (1 - tension), cp2y = p.y;
    return `C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p.x)} ${r(p.y)}`;
  }).join(' ');
}

export function pathsCss(o = {}) {
  const c = { ...PATHS_DEFAULTS, ...o };
  return `.${c.id}{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.${c.id} svg{width:100%;height:100%;display:block;color:${c.ink}}
.${c.id} .l-accent{color:${c.accent}}
.${c.id} g{transform-box:view-box;transform-origin:center}
.${c.id} path{fill:none;stroke:currentColor;stroke-linecap:round}`;
}

export function pathsMarkup(o = {}) {
  const c = { ...PATHS_DEFAULTS, ...o };
  const layers = c.layers.map((L, li) => {
    const paths = Array.from({ length: L.n }, (_, i) =>
      `<path d="${aestheticPath(i, c.position, L.kind)}" stroke-width="${(L.w0 + i * L.wStep).toFixed(2)}" style="opacity:${(L.o0 + i * L.oStep).toFixed(3)}"/>`
    ).join('\n');
    return `<g class="l l-${L.kind}" data-i="${li}">\n${paths}\n</g>`;
  }).join('\n');
  return `<div class="${c.id}" id="${c.id}"><svg viewBox="${c.viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
${layers}
</svg></div>`;
}

export function pathsScript(o = {}) {
  const c = { ...PATHS_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify({ id: c.id, layers: c.layers, enter: c.enter })};
  var root = document.getElementById(C.id);
  var gs = root.querySelectorAll('g.l');
  /* the original's initial scale is .8, .9 and .95 per layer. */
  var s0 = [0.8, 0.9, 0.95];
  function apply(t) {
    for (var i = 0; i < gs.length; i++) {
      var L = C.layers[i], p = B.ease(B.span(t, 0, C.enter));
      /* motion's [0,-15,0] with repeatType reverse and easeInOut, as one
         cosine: 0 at t=0, -bob at half the period, back at the period. */
      var y = -L.bob * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / L.period));
      var sc = B.lerp(s0[i] || 0.9, 1, p);
      gs[i].style.opacity = (L.g * p).toFixed(3);
      gs[i].style.transform = 'translateY(' + y.toFixed(2) + 'px) scale(' + sc.toFixed(4) + ')';
    }
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}
