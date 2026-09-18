/* the boring tek — props: the ai input box.

   a port of kokonutui's AI_Input_Search (components/kokonutui/ai-input-search.tsx),
   MIT. the original is a react textarea in a rounded shell with a paperclip,
   a "search" toggle pill with a spinning globe, and a send button that lights
   when there is text. this is the same shell, the same three controls and the
   same states, as markup and css, with the typing, the toggle and the focus
   ring driven by `apply(t)`.

   what changed on the way in:
     tailwind's black/5 and white/5 surfaces became the site's own: --field for
     the shell, --line for the ring, --accent for the focused ring, --pill-on
     for the resting buttons and --accent-soft with --accent ink for the
     active ones. sky-500 is gone; the accent is the one colour that lights.
     the radius is the site's 12px field radius, not tailwind's xl.
     lucide's three icons are three small inline strokes of our own, so the
     prop carries no icon library, which is the site's rule.
     motion's spring on the globe (stiffness 260, damping 25) is the site's own
     --spring over .34s, the label's width tween is the same 0.2s, and the
     caret blinks on a fixed clock so a frame is a function of t.
     the textarea is a div. nothing here is typed by a person; the rig types.

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

export const AI_INPUT_DEFAULTS = {
  id: 'ai',
  width: 400,                 /* css px, the shell */
  placeholder: 'ask anything',
  text: 'delete the manual work we do every day',
  label: 'search',
  /* the timeline, seconds: focus, first keystroke, keys a second, the toggle. */
  focusAt: 0.3,
  typeFrom: 0.7,
  cps: 16,
  searchAt: 0.4,              /* the pill switches on here; -1 for never */
  caretHz: 1.1,
  font: 'var(--body)',
  size: 14,                   /* px */
};

const ICON = {
  clip: '<path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7-7l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.6 1.6 0 0 1-2.3-2.3l8.2-8.2"/>',
  globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19"/>',
  send: '<path d="M21.5 2.5L11 13M21.5 2.5l-6.7 19-3.8-8.5-8.5-3.8z"/>',
};
const svg = (d, cls = '') => '<svg class="ai-ic ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';

export function aiInputCss(o = {}) {
  const c = { ...AI_INPUT_DEFAULTS, ...o };
  const id = c.id;
  return `.${id}{width:${c.width}px;max-width:calc(100% - 32px);font-family:${c.font};font-size:${c.size}px;color:var(--fg)}
.${id} .ai-shell{position:relative;display:flex;flex-direction:column;border-radius:12px;background:var(--field);
  box-shadow:0 0 0 1px var(--line);transition:box-shadow .2s ease-out;text-align:left}
.${id} .ai-shell.is-focus{box-shadow:0 0 0 1px var(--accent)}
.${id} .ai-text{min-height:52px;max-height:200px;padding:12px 16px;line-height:1.35;white-space:pre-wrap;word-break:break-word}
.${id} .ai-text.is-empty{color:var(--muted);opacity:.75}
.${id} .ai-caret{display:inline-block;width:1px;height:1.05em;margin-left:1px;vertical-align:-.15em;background:var(--fg);opacity:0}
.${id} .ai-bar{height:48px;border-radius:0 0 12px 12px}
.${id} .ai-left{position:absolute;left:12px;bottom:12px;display:flex;align-items:center;gap:8px}
.${id} .ai-right{position:absolute;right:12px;bottom:12px}
.${id} .ai-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:0;border-radius:8px;
  background:var(--pill-on);color:var(--muted);cursor:pointer;padding:0;transition:background-color .2s ease-out,color .2s ease-out}
.${id} .ai-btn.is-on{background:var(--accent-soft);color:var(--accent)}
.${id} .ai-ic{width:16px;height:16px;display:block}
.${id} .ai-tog{display:flex;align-items:center;gap:6px;height:32px;padding:0 8px 0 7px;border-radius:999px;border:1px solid transparent;
  background:var(--pill-on);color:var(--muted);cursor:pointer;font:inherit;font-size:${c.size - 1}px;line-height:1;
  transition:border-color .2s ease-out,background-color .2s ease-out,color .2s ease-out}
.${id} .ai-tog.is-on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.${id} .ai-tog .ai-ic{transform-origin:center}
.${id} .ai-lab{display:block;overflow:hidden;white-space:nowrap;width:0;opacity:0}`;
}

export function aiInputMarkup(o = {}) {
  const c = { ...AI_INPUT_DEFAULTS, ...o };
  return `<div class="${c.id}" id="${c.id}">
  <div class="ai-shell" role="textbox" aria-label="${c.placeholder}">
    <div class="ai-text is-empty"><span class="ai-str">${c.placeholder}</span><span class="ai-caret"></span></div>
    <div class="ai-bar">
      <div class="ai-left">
        <button class="ai-btn ai-clip" type="button" aria-label="attach">${svg(ICON.clip)}</button>
        <button class="ai-tog" type="button">${svg(ICON.globe, 'ai-globe')}<span class="ai-lab">${c.label}</span></button>
      </div>
      <div class="ai-right"><button class="ai-btn ai-send" type="button" aria-label="send">${svg(ICON.send)}</button></div>
    </div>
  </div>
</div>`;
}

export function aiInputScript(o = {}) {
  const c = { ...AI_INPUT_DEFAULTS, ...o };
  return `(function(){
  var B = window.__bt, C = ${JSON.stringify(c)};
  var root = document.getElementById(C.id);
  var shell = root.querySelector('.ai-shell'), text = root.querySelector('.ai-text'),
      str = root.querySelector('.ai-str'), caret = root.querySelector('.ai-caret'),
      tog = root.querySelector('.ai-tog'), globe = root.querySelector('.ai-globe'),
      lab = root.querySelector('.ai-lab'), send = root.querySelector('.ai-send');
  /* the label's natural width, measured once it is drawable (a display:none
     scene measures 0), so the 0.2s tween has a mark. */
  var labW = 0;
  function measure() { lab.style.width = 'auto'; labW = lab.getBoundingClientRect().width; lab.style.width = '0'; }
  function apply(t) {
    if (!(labW > 0)) measure();
    var focused = C.focusAt >= 0 && t >= C.focusAt;
    shell.classList.toggle('is-focus', focused);
    var n = Math.max(0, Math.min(C.text.length, Math.floor((t - C.typeFrom) * C.cps)));
    var typed = n > 0 ? C.text.slice(0, n) : '';
    text.classList.toggle('is-empty', !typed);
    str.textContent = typed || C.placeholder;
    /* the caret: only while focused, on a fixed blink, off before the focus. */
    caret.style.opacity = focused && (Math.floor(t * C.caretHz * 2) % 2 === 0) ? '1' : '0';
    send.classList.toggle('is-on', !!typed);
    /* the toggle: rotate 0 to 180 and scale 1 to 1.1 on the spring, the label
       from 0 to its width over 0.2s. */
    var on = C.searchAt >= 0 && t >= C.searchAt;
    tog.classList.toggle('is-on', on);
    var p = on ? B.spring(B.span(t, C.searchAt, C.searchAt + 0.34)) : 0;
    globe.style.transform = 'rotate(' + (180 * p).toFixed(1) + 'deg) scale(' + (1 + 0.1 * p).toFixed(3) + ')';
    var q = on ? B.ease(B.span(t, C.searchAt, C.searchAt + 0.2)) : 0;
    lab.style.width = (labW * q).toFixed(1) + 'px';
    lab.style.opacity = q.toFixed(3);
  }
  window.__props.add('${c.id}', { apply: apply, el: root });
})();`;
}
