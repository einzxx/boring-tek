/* the boring tek — props: the hand written title.

   a port of kokonutui's HandWrittenTitle (components/kokonutui/hand-written-title.tsx,
   as it stood at commit 9ddbfbb before v2 dropped it), MIT. the original is a
   title with one thick stroke looping around it, drawn on by motion's
   pathLength over 2.5s on [.43,.13,.23,.96], the title rising in at .5s and a
   subtitle fading in at 1s. this is the same path in the same 1200 by 600
   box, the same stroke width, the same three timings, driven by `apply(t)`.

   what changed on the way in:
     pathLength is stroke-dasharray and stroke-dashoffset on the measured
     length, which is what motion does underneath.
     the stroke is --fg at the original's .9; the title is --display, which is
     michroma on this site, and the subtitle --body in --sub. tracking-tighter
     is gone because michroma is already wide and tight tracking on a wide
     face reads as a mistake.
     the rise is the site's --ease, the fades are linear as in the source.

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

export const HAND_DEFAULTS = {
  id: 'hand',
  width: 460,                 /* css px, the box; height follows 2:1 */
  title: 'boring on purpose',
  subtitle: 'infrastructure you never think about',
  titleSize: 26,              /* px */
  subSize: 14,
  strokeWidth: 12,            /* in the 1200 by 600 box */
  draw: 2.5,                  /* seconds */
  titleAt: 0.5, titleFor: 0.8,
  subAt: 1.0, subFor: 0.8,
  /* the original's loop. */
  d: 'M 950 90 C 1250 300, 1050 480, 600 520 C 250 520, 150 480, 150 300 C 150 120, 350 80, 600 80 C 850 80, 950 180, 950 180',
};

export function handCss(o = {}) {
  const c = { ...HAND_DEFAULTS, ...o };
  const id = c.id;
  return `.${id}{position:relative;width:${c.width}px;max-width:calc(100% - 32px);aspect-ratio:2/1}
.${id} svg{position:absolute;inset:0;width:100%;height:100%;display:block;color:var(--fg)}
.${id} path{fill:none;stroke:currentColor;stroke-width:${c.strokeWidth};stroke-linecap:round;stroke-linejoin:round;opacity:0}
.${id} .hw-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:0 60px}
.${id} h1{margin:0;font:400 ${c.titleSize}px/1.2 var(--display);color:var(--fg);opacity:0;letter-spacing:.01em}
.${id} p{margin:0;font:400 ${c.subSize}px/1.4 var(--body);color:var(--sub);opacity:0}`;
}

export function handMarkup(o = {}) {
  const c = { ...HAND_DEFAULTS, ...o };
  return `<div class="${c.id}" id="${c.id}">
  <svg viewBox="0 0 1200 600" aria-hidden="true"><path d="${c.d}"/></svg>
  <div class="hw-txt"><h1>${c.title}</h1>${c.subtitle ? `<p>${c.subtitle}</p>` : ''}</div>
</div>`;
}

export function handScript(o = {}) {
  const c = { ...HAND_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify({ id: c.id, draw: c.draw, titleAt: c.titleAt, titleFor: c.titleFor, subAt: c.subAt, subFor: c.subFor })};
  var root = document.getElementById(C.id);
  var path = root.querySelector('path'), h1 = root.querySelector('h1'), p = root.querySelector('p');
  /* measured on the first frame it is drawn on rather than at load: a path
     inside a display:none scene measures 0. */
  var L = 0;
  function measure() { L = path.getTotalLength(); if (L > 0) path.style.strokeDasharray = L + ' ' + L; }
  /* the original's own curve for the draw. */
  var drawEase = B.bezier(.43, .13, .23, .96);
  function apply(t) {
    if (!(L > 0)) measure();
    var d = drawEase(B.span(t, 0, C.draw));
    path.style.strokeDashoffset = (L * (1 - d)).toFixed(2);
    path.style.opacity = (0.9 * B.span(t, 0, 0.5)).toFixed(3);
    var a = B.ease(B.span(t, C.titleAt, C.titleAt + C.titleFor));
    h1.style.opacity = B.span(t, C.titleAt, C.titleAt + C.titleFor).toFixed(3);
    h1.style.transform = 'translateY(' + (20 * (1 - a)).toFixed(2) + 'px)';
    if (p) p.style.opacity = B.span(t, C.subAt, C.subAt + C.subFor).toFixed(3);
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}
