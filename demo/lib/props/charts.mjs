/* the boring tek — props: the charts. one bar, one line.

   a port of the look and the enter motion of bklit ui's BarChart and LineChart
   (packages/ui/src/charts/bar.tsx, line.tsx, grid.tsx, chart-reveal-clip.tsx,
   fade-edges.ts, line-series-terminal-marker.tsx, animation.ts), MIT. the
   originals are react over @visx and motion/react with tooltips, hover, a
   loading phase and a brush; none of that is a prop, so none of it is here.
   what is here is what the eye reads:

     the grid      horizontal rows only, dashed 4,4 in the grid colour, masked
                   so they fade out over the first and last 10% of the width.
     the bars      round topped (radius min(width/2, 8)), growing up from the
                   baseline, each one 1100ms on cubic-bezier(.85,0,.15,1) and
                   staggered so the whole spread takes 40% of that.
     the line      2.5px, round caps, a natural cubic spline, stroked through a
                   gradient that fades to nothing over 15% at each edge, and
                   revealed left to right by a clip rect growing from 0 to the
                   full width, 1100ms on the same curve. a hollow ring
                   (r 5, 1.5px) on the last point, scaling from .55 and fading
                   in over .28s on [.22,1,.36,1] once the reveal has landed.
     the labels    12px, the label colour, x categories under the plot and the
                   nice y ticks down the left.

   what changed on the way in:
     bklit's --chart-* tokens are mapped onto the site's: --chart-grid is
     --line, --chart-label is --muted, --chart-line-primary is --accent and
     --chart-foreground is --fg. there is one series colour because there is
     one accent.
     the label face is --mono. numbers on this site are mono.
     visx's curveNatural is d3-shape's natural spline, its control point solver
     ported here in twenty lines (d3-shape is ISC, Mike Bostock).
     a frame is `apply(t)`: node does the geometry, the page moves it.

   ---------------------------------------------------------------------------
   MIT License. Copyright (c) 2026 uixmat.
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to
   deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
   sell copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions: The above copyright
   notice and this permission notice shall be included in all copies or
   substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
   WITHOUT WARRANTY OF ANY KIND. https://github.com/bklit/bklit-ui
   ---------------------------------------------------------------------------
*/

export const CHART_TOKENS = {
  grid: 'var(--line)',
  label: 'var(--muted)',
  line: 'var(--accent)',
  fg: 'var(--fg)',
};

/* the enter, from animation.ts. */
export const CHART_ENTER = { duration: 1.1, ease: [.85, 0, .15, 1] };

export const BAR_DEFAULTS = {
  id: 'bar',
  width: 440, height: 260,
  margin: { top: 12, right: 12, bottom: 28, left: 40 },
  data: [
    { x: 'mon', y: 42 }, { x: 'tue', y: 71 }, { x: 'wed', y: 58 }, { x: 'thu', y: 96 },
    { x: 'fri', y: 83 }, { x: 'sat', y: 37 }, { x: 'sun', y: 24 },
  ],
  padding: 0.3,               /* visx scaleBand padding */
  rows: 5,
  labelSize: 12,
  font: 'var(--mono)',
  fill: CHART_TOKENS.line,
};

export const LINE_DEFAULTS = {
  id: 'line',
  width: 440, height: 260,
  margin: { top: 12, right: 16, bottom: 28, left: 40 },
  data: [
    { x: 'w1', y: 18 }, { x: 'w2', y: 31 }, { x: 'w3', y: 27 }, { x: 'w4', y: 46 }, { x: 'w5', y: 52 },
    { x: 'w6', y: 44 }, { x: 'w7', y: 63 }, { x: 'w8', y: 71 }, { x: 'w9', y: 66 }, { x: 'w10', y: 88 },
  ],
  rows: 5,
  labelSize: 12,
  font: 'var(--mono)',
  stroke: CHART_TOKENS.line,
  strokeWidth: 2.5,
  fadeEdges: true,
  marker: { r: 5, sw: 1.5, at: 0.28, ease: [.22, 1, .36, 1] },
};

/* ---------- ticks ----------
   d3's ticks: a step of 1, 2 or 5 times a power of ten, chosen so about
   `count` land in the domain, and the domain widened to the step. */
function niceTicks(max, count) {
  const step0 = max / count, p = Math.pow(10, Math.floor(Math.log10(step0)));
  const e = step0 / p;
  const step = (e >= 5 ? 10 : e >= 2 ? 5 : e >= 1 ? 2 : 1) * p;
  const top = Math.ceil(max / step) * step;
  const out = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(+v.toFixed(6));
  return { ticks: out, top };
}

/* ---------- the natural spline ----------
   d3-shape's curveNatural control points, per coordinate. */
function controlPoints(x) {
  const n = x.length - 1, a = new Array(n), b = new Array(n), r = new Array(n);
  let i, m;
  a[0] = 0; b[0] = 2; r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) { a[i] = 1; b[i] = 4; r[i] = 4 * x[i] + 2 * x[i + 1]; }
  a[n - 1] = 2; b[n - 1] = 7; r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) { m = a[i] / b[i - 1]; b[i] -= m; r[i] -= m * r[i - 1]; }
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}
export function naturalPath(pts) {
  if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  const [ax, bx] = controlPoints(pts.map(p => p[0]));
  const [ay, by] = controlPoints(pts.map(p => p[1]));
  let d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
  for (let i = 1; i < pts.length; i++) {
    d += ' C' + ax[i - 1].toFixed(2) + ' ' + ay[i - 1].toFixed(2) + ',' + bx[i - 1].toFixed(2) + ' ' + by[i - 1].toFixed(2)
      + ',' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
  }
  return d;
}

/* the grid rows and the two axes, shared. */
function gridAndAxes(c, iw, ih, ticks, top, xs) {
  /* `grid: false` and `labels: false` are for a chart small enough that
     rows and ticks would be noise, a sparkline in a card. */
  if (c.grid === false && c.labels === false) return '';
  const y = v => ih - (v / top) * ih;
  const rows = ticks.map(v => `<line x1="0" x2="${iw}" y1="${y(v).toFixed(2)}" y2="${y(v).toFixed(2)}"/>`).join('');
  const ylab = ticks.map(v => `<text x="-8" y="${y(v).toFixed(2)}" dy=".35em" text-anchor="end">${v}</text>`).join('');
  const xlab = xs.map(([label, x]) => `<text x="${x.toFixed(2)}" y="${ih + 18}" text-anchor="middle">${label}</text>`).join('');
  return `<defs>
    <linearGradient id="${c.id}-gf" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".1" stop-color="#fff" stop-opacity="1"/>
      <stop offset=".9" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${c.id}-gm"><rect x="0" y="0" width="${iw}" height="${ih}" fill="url(#${c.id}-gf)"/></mask>
  </defs>
  ${c.grid === false ? '' : `<g class="ch-grid" mask="url(#${c.id}-gm)">${rows}</g>`}
  ${c.labels === false ? '' : `<g class="ch-lab">${ylab}${xlab}</g>`}`;
}

function chartCss(c) {
  return `.${c.id}{width:${c.width}px;max-width:calc(100% - 32px)}
.${c.id} svg{display:block;width:100%;height:auto;overflow:visible}
.${c.id} .ch-grid line{stroke:${CHART_TOKENS.grid};stroke-width:1;stroke-dasharray:4 4}
.${c.id} .ch-lab text{font:${c.labelSize}px/1 ${c.font};fill:${CHART_TOKENS.label}}`;
}

/* ---------- the bar chart ---------- */
export function barCss(o = {}) { return chartCss({ ...BAR_DEFAULTS, ...o }); }

export function barMarkup(o = {}) {
  const c = { ...BAR_DEFAULTS, ...o };
  const iw = c.width - c.margin.left - c.margin.right, ih = c.height - c.margin.top - c.margin.bottom;
  const { ticks, top } = niceTicks(Math.max(...c.data.map(d => d.y)), c.rows);
  /* scaleBand with padding: n bands, gaps of padding*step at both ends and
     between. */
  const n = c.data.length, step = iw / (n - c.padding + 2 * c.padding), bw = step * (1 - c.padding);
  const rx = Math.min(bw / 2, 8);
  const xs = c.data.map((d, i) => [d.x, c.padding * step + i * step + bw / 2]);
  const bars = c.data.map((d, i) => {
    const x = c.padding * step + i * step, h = (d.y / top) * ih;
    return `<rect data-h="${h.toFixed(2)}" x="${x.toFixed(2)}" y="${ih}" width="${bw.toFixed(2)}" height="0" rx="${rx.toFixed(2)}" ry="${rx.toFixed(2)}" fill="${c.fill}"/>`;
  }).join('');
  return `<div class="${c.id}" id="${c.id}"><svg viewBox="0 0 ${c.width} ${c.height}" aria-hidden="true">
  <g transform="translate(${c.margin.left},${c.margin.top})">
    ${gridAndAxes(c, iw, ih, ticks, top, xs)}
    <g class="ch-bars" data-ih="${ih}">${bars}</g>
  </g></svg></div>`;
}

export function barScript(o = {}) {
  const c = { ...BAR_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify({ id: c.id, n: c.data.length, enter: CHART_ENTER })};
  var root = document.getElementById(C.id);
  var g = root.querySelector('.ch-bars'), ih = parseFloat(g.getAttribute('data-ih'));
  var rects = g.querySelectorAll('rect');
  var ease = B.bezier.apply(null, C.enter.ease);
  /* bar.tsx: 40% of the duration is the stagger spread, split over the bars. */
  var stagger = C.n > 1 ? (C.enter.duration * 0.4) / C.n : 0;
  function apply(t) {
    for (var i = 0; i < rects.length; i++) {
      var h = parseFloat(rects[i].getAttribute('data-h'));
      var p = ease(B.span(t, i * stagger, i * stagger + C.enter.duration));
      rects[i].setAttribute('height', (h * p).toFixed(2));
      rects[i].setAttribute('y', (ih - h * p).toFixed(2));
    }
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}

/* ---------- the line chart ---------- */
export function lineCss(o = {}) {
  const c = { ...LINE_DEFAULTS, ...o };
  return chartCss(c) + `
.${c.id} .ch-line{fill:none;stroke-width:${c.strokeWidth};stroke-linecap:round}
.${c.id} .ch-ring{fill:transparent;stroke:${c.stroke};stroke-width:${c.marker.sw};opacity:0}`;
}

export function lineMarkup(o = {}) {
  const c = { ...LINE_DEFAULTS, ...o };
  const iw = c.width - c.margin.left - c.margin.right, ih = c.height - c.margin.top - c.margin.bottom;
  const { ticks, top } = niceTicks(Math.max(...c.data.map(d => d.y)), c.rows);
  const n = c.data.length;
  const pts = c.data.map((d, i) => [(i / (n - 1)) * iw, ih - (d.y / top) * ih]);
  const xs = c.data.map((d, i) => [d.x, pts[i][0]]);
  const last = pts[n - 1];
  /* fade-edges.ts: 0 / 15 / 85 / 100, pinned to the viewport in user space. */
  const fade = c.fadeEdges ? `<linearGradient id="${c.id}-lf" gradientUnits="userSpaceOnUse" x1="0" x2="${iw}" y1="0" y2="0">
      <stop offset="0" stop-color="${c.stroke}" stop-opacity="0"/><stop offset=".15" stop-color="${c.stroke}" stop-opacity="1"/>
      <stop offset=".85" stop-color="${c.stroke}" stop-opacity="1"/><stop offset="1" stop-color="${c.stroke}" stop-opacity="0"/>
    </linearGradient>` : '';
  const strokeRef = c.fadeEdges ? `url(#${c.id}-lf)` : c.stroke;
  /* the reveal clip, padded by the stroke so round caps are not cut. */
  const pad = c.strokeWidth * 2;
  return `<div class="${c.id}" id="${c.id}"><svg viewBox="0 0 ${c.width} ${c.height}" aria-hidden="true">
  <g transform="translate(${c.margin.left},${c.margin.top})">
    ${gridAndAxes(c, iw, ih, ticks, top, xs)}
    <defs>${fade}
      <clipPath id="${c.id}-rc"><rect class="ch-clip" x="${-pad}" y="${-pad}" width="0" height="${ih + 2 * pad}"/></clipPath>
    </defs>
    <g clip-path="url(#${c.id}-rc)"><path class="ch-line" d="${naturalPath(pts)}" stroke="${strokeRef}"/></g>
    <circle class="ch-ring" cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="${c.marker.r}" data-iw="${iw}" data-pad="${pad}"/>
  </g></svg></div>`;
}

export function lineScript(o = {}) {
  const c = { ...LINE_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify({ id: c.id, enter: CHART_ENTER, marker: c.marker })};
  var root = document.getElementById(C.id);
  var clip = root.querySelector('.ch-clip'), ring = root.querySelector('.ch-ring');
  var iw = parseFloat(ring.getAttribute('data-iw')), pad = parseFloat(ring.getAttribute('data-pad'));
  var ease = B.bezier.apply(null, C.enter.ease), mEase = B.bezier.apply(null, C.marker.ease);
  var cx = ring.getAttribute('cx'), cy = ring.getAttribute('cy');
  function apply(t) {
    var p = ease(B.span(t, 0, C.enter.duration));
    clip.setAttribute('width', ((iw + 2 * pad) * p).toFixed(2));
    /* the terminal marker: after the reveal, .55 to 1 and 0 to 1. */
    var m = mEase(B.span(t, C.enter.duration, C.enter.duration + C.marker.at));
    ring.style.opacity = m.toFixed(3);
    ring.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + (0.55 + 0.45 * m).toFixed(3) + ') translate(' + (-cx) + ' ' + (-cy) + ')');
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}
