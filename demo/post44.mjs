/* the boring tek — post44. AI AFTER, ep 1. ai after reading the terms and
   conditions.

   dark only, 1080x1920. four lines on the elevenlabs narrator, eleven_v3 on
   post43's settings, three takes a line, one kept by measurement, speed 1.0,
   never stretched. the series rig is lib/aiafter.mjs: this file is the title,
   the ep number, the read and the gag. every beat is cut to the read.

     l1  we asked ai to read ...     the document scrolls fast, he reads, small nods
     l2  every word. it lasted ...   the scroll slows, a slow squint, the head drops,
                                     eyes shut on `it lasted`, the z float up, the
                                     thumb lights green and the card lands on `one`
     l3  same as you. nobody ...     he wakes, looks to the lens, `same as you.`
                                     lands on the card on `same`
     l4  tip, paste them ...         the tip grows into the card, he looks at it
     the glitch cut, the end card, held 1s

   no camera: the whole window, its title bar, the title and he stay in frame
   to the end, and the card sits on the window inside the margins. the thumb is
   honest: it moves 1% of its track over the whole scroll.

     DEMO_FPS=12 node post44.mjs         the preview
     node post44.mjs                     60fps
*/

import {
  runEpisode, readLines, place, wAt, VGAP, prng, span, lerp, smooth, bump, clamp, EASE, SPRING, IO, MARGIN, VW,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const LINES = [
  { key: 'r1', text: 'we asked ai to read the terms and conditions.' },
  { key: 'r2', text: 'every word. it lasted one percent.' },
  { key: 'r3', text: 'same as you. nobody reads them, and that is how they get you.' },
  { key: 'r4', text: 'tip, paste them into ai and ask, what is risky here? it reads them for you.' },
];
const TAKES = await readLines(44, LINES);
const [T1, T2, T3, T4] = TAKES;
place(T1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'we asked ai to read' },
  { line: 0, text: 'the terms and conditions' },
  { line: 1, text: 'every word' },
  { line: 1, text: 'it lasted one percent' },
  { line: 2, text: 'same as you' },
  { line: 2, text: 'nobody reads them' },
  { line: 2, text: 'and that is how they get you' },
  { line: 3, text: 'tip, paste them into ai' },
  { line: 3, text: 'and ask, what is risky here?' },
  { line: 3, text: 'it reads them for you' },
];

/* ---------- where things sit, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 298, size: 118 };
/* the window ends at 752, clear of the subtitles at 770 */
const DOC = { l: 84, t: 372, w: 372, h: 380, bar: 30, pad: 16 };
const BODY = { l: DOC.l + DOC.pad, t: DOC.t + DOC.bar + 10, w: DOC.w - DOC.pad * 2 - 18, h: DOC.h - DOC.bar - 20 };
const TRACK = { x: DOC.l + DOC.w - 16, t: DOC.t + DOC.bar + 10, w: 6, h: DOC.h - DOC.bar - 20 };
const THUMB = { h: 12 };
const READ = 0.01;
/* the card: on the window, its right edge 10px short of the track, its top level with the thumb */
const CARD = { r: TRACK.x - 10, t: TRACK.t - 8 };

/* ---------- the beats, off the read ---------- */
const SLOW = T1.end;
const SHUT = { at: +(wAt(T2, 'it') - 0.12).toFixed(4), for: 0.24 };
const DIP = +((SLOW + SHUT.at) / 2 - 0.2).toFixed(4);
const LABEL = +(wAt(T2, 'one') - 0.06).toFixed(4);
const HL = +(LABEL - 0.14).toFixed(4);
const WAKE = { at: +(T3.at - 0.30).toFixed(4), for: 0.40 };
const SAME = +(wAt(T3, 'same') - 0.04).toFixed(4);
const NOBODY = +(wAt(T3, 'nobody') - 0.02).toFixed(4);
const KNOW = { at: +(wAt(T3, 'how') - 0.06).toFixed(4), for: 0.40 };
const TIP = +(T4.at - 0.04).toFixed(4);
const READS = +(wAt(T4, 'reads') - 0.02).toFixed(4);
const CUT = +(T4.end + 0.35).toFixed(4);
/* the z float up for as long as he sleeps, one every half second */
const ZS = [];
for (let at = SHUT.at + 0.18; at < WAKE.at - 0.5; at += 0.5) ZS.push({ at: +at.toFixed(4), life: 1.3 });
/* asleep the lids stop at a slit, so the eyes read as shut and never vanish */
const SLEEP_LID = 0.88;

/* ---------- the scroll: fast through l1, slowing through l2, stopped as he sleeps ---------- */
const V = { fast: 760, slow: 16 };
const vAt = t => (t < SLOW ? V.fast : t < SHUT.at ? lerp(V.fast, V.slow, EASE(span(t, SLOW, SHUT.at))) : V.slow * (1 - smooth(span(t, SHUT.at, SHUT.at + 0.3))));
const DT = 1 / 600, POS = [0];
for (let i = 1; i <= CUT / DT + 2; i++) POS.push(POS[i - 1] + vAt((i - 0.5) * DT) * DT);
const scrollAt = t => POS[clamp(Math.round(t / DT), 0, POS.length - 1)];
const TOTAL = scrollAt(CUT);

/* ---------- the document: numbered sections of small grey legalese ---------- */
const HEADS = ['acceptance of terms', 'eligibility', 'your account', 'license to use', 'user content', 'data we collect', 'how we use your data',
  'third party services', 'fees and billing', 'termination', 'disclaimers', 'limitation of liability', 'indemnity', 'governing law',
  'binding arbitration', 'changes to these terms', 'severability', 'entire agreement', 'notices', 'miscellaneous'];
const WORDS = ('the user hereby agrees that any and all data content and usage shall be retained by the company its affiliates and partners in perpetuity '
  + 'without notice or liability including but not limited to third party services subject to applicable law at our sole discretion we may modify suspend '
  + 'or terminate your account license irrevocable worldwide royalty free indemnify and hold harmless binding arbitration governing jurisdiction provisions '
  + 'herein thereof pursuant to notwithstanding the foregoing consent processing retention transfer waiver of rights class action').split(' ');
const DOC_H = Math.ceil(TOTAL + BODY.h + 400);
function legalese() {
  const r = prng(0x7e44);
  let html = '<p class="dh top">terms and conditions of service</p>', h = 30, n = 0;
  while (h < DOC_H) {
    const head = HEADS[n % HEADS.length], sec = n + 1;
    html += '<p class="dh">' + sec + '. ' + head + '</p>';
    for (let k = 0, subs = 2 + Math.floor(r() * 2); k < subs; k++) {
      let s = '';
      const words = 40 + Math.floor(r() * 50);
      for (let i = 0; i < words; i++) s += (i ? ' ' : '') + WORDS[Math.floor(r() * WORDS.length)];
      html += '<p><b>' + sec + '.' + (k + 1) + '</b> ' + s + '.</p>';
      h += Math.ceil(s.length / 72) * 10 + 8;
    }
    h += 22; n++;
  }
  return html;
}

/* ---------- him ---------- */
const NODS = [];
for (let at = 0.18; at < SLOW - 0.3; at += 0.48) NODS.push({ at: +at.toFixed(3), h: 3.2, for: 0.34 });
NODS.push({ at: NOBODY, h: 4, for: 0.38 }, { at: READS, h: 4, for: 0.38 });
const BLINK = { at: 1.02, close: 0.07, hold: 0.03, open: 0.12 };
/* reading: the eyes sweep a line left to right and snap back, faster while the page flies */
const RP = [0];
for (let i = 1; i <= CUT / DT + 2; i++) { const t = (i - 0.5) * DT; RP.push(RP[i - 1] + DT * (t < SLOW ? 2.4 : lerp(2.4, 0.5, IO(span(t, SLOW, SHUT.at))))); }
/* awake again, where he looks: the lens on `same as you`, the terms on
   `nobody reads them`, the lens on `how they get you`, the tip line by line
   as it is read, and the lens on `it reads them for you`. `w` 0 is the lens */
const LENS = () => ({ x: MAS.cx, y: MAS.cy, w: 0 });
const TIPL = { l: CARD.r - 250, r: CARD.r - 40, y: CARD.t + 128, lh: 26 };
function tipRead(t) {
  const q = span(t, TIP + 0.35, READS - 0.25) * 3, i = Math.min(2, Math.floor(q)), f = q - i;
  return { x: lerp(TIPL.l, TIPL.r, IO(Math.min(1, f / 0.85))), y: TIPL.y + TIPL.lh * i, w: 1 };
}
const LOOKS = [
  { at: WAKE.at + 0.2, f: LENS },
  { at: NOBODY - 0.05, f: () => ({ x: BODY.l + BODY.w * 0.45, y: BODY.t + 180, w: 1 }) },
  { at: KNOW.at - 0.1, f: LENS },
  { at: TIP + 0.1, f: tipRead },
  { at: READS - 0.12, f: LENS },
];
function lookAt(t, reading) {
  let i = -1;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  if (i < 0) return reading;
  const cur = LOOKS[i].f(t), prev = i ? LOOKS[i - 1].f(t) : reading;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.28));
  return { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
}
function face(t) {
  const p = RP[clamp(Math.round(t / DT), 0, RP.length - 1)] % 1;
  const sweep = p < 0.8 ? IO(p / 0.8) : 1 - IO((p - 0.8) / 0.2);
  const reading = { x: BODY.l + 30 + (BODY.w - 60) * sweep, y: BODY.t + 90 + 40 * smooth(span(t, SLOW, SHUT.at)), w: 1 };
  const look = lookAt(t, reading);
  /* the lids: calm, one blink, the slow squint, shut asleep, open on l3, a knowing squint on `how they get you` */
  let lid = Math.max(0.04, 0.52 * smooth(span(t, SLOW + 0.1, SHUT.at - 0.1)));
  if (t >= BLINK.at && t < BLINK.at + BLINK.close + BLINK.hold + BLINK.open) {
    const c = BLINK.at + BLINK.close, h = c + BLINK.hold;
    lid = Math.max(lid, t < c ? IO(span(t, BLINK.at, c)) : t < h ? 1 : 1 - smooth(span(t, h, h + BLINK.open)));
  }
  lid = lerp(lid, SLEEP_LID, IO(span(t, SHUT.at, SHUT.at + SHUT.for)));
  lid = lerp(lid, 0.04, IO(span(t, WAKE.at, WAKE.at + WAKE.for)));
  lid = Math.max(lid, 0.34 * bump(t, KNOW.at, KNOW.for, T3.end - KNOW.at - KNOW.for, 0.3));
  /* small nods while he reads, the head drops as he fades, a slow breath asleep, up again on waking */
  let dy = 0;
  for (const n of NODS) dy += n.h * Math.sin(Math.PI * EASE(span(t, n.at, n.at + n.for)));
  const up = 1 - EASE(span(t, WAKE.at, WAKE.at + 0.5));
  const drop = smooth(span(t, SLOW + 0.2, SHUT.at + 0.2)) * up;
  dy += 7 * drop + 4 * bump(t, DIP, 0.35, 0.05, 0.25);
  const rot = -5 * drop - 2 * bump(t, DIP, 0.35, 0.05, 0.25);
  const zz = smooth(span(t, SHUT.at + 0.1, SHUT.at + 0.5)) * up;
  dy += zz * 1.8 * Math.sin(2 * Math.PI * (t - SHUT.at) / 1.6);
  const sq = zz * 0.018 * Math.sin(2 * Math.PI * (t - SHUT.at) / 1.6);
  return { lid: +lid.toFixed(4), look, dx: 0, dy: +dy.toFixed(3), rot: +rot.toFixed(3), sq: +sq.toFixed(4) };
}

/* ---------- a frame of the gag ---------- */
const thumbTop = t => READ * (TRACK.h - THUMB.h) * scrollAt(t) / TOTAL;
/* a line that grows into the card: the height first, the words fading up inside it */
const grow = (t, at) => ({ k: +EASE(span(t, at, at + 0.30)).toFixed(4), o: +smooth(span(t, at + 0.08, at + 0.32)).toFixed(3), y: +(8 * (1 - EASE(span(t, at + 0.08, at + 0.42)))).toFixed(3) });
function frame(t) {
  const zs = ZS.map((z, i) => {
    const p = span(t, z.at, z.at + z.life);
    const o = t < z.at ? 0 : Math.min(smooth(span(t, z.at, z.at + 0.18)), 1 - smooth(span(t, z.at + z.life - 0.4, z.at + z.life)));
    return { o: +o.toFixed(3), x: +(66 * p + 4 * Math.sin(2 * Math.PI * p * 1.3 + i)).toFixed(2), y: +(-48 * p).toFixed(2), s: +lerp(0.85, 1.6, p).toFixed(3) };
  });
  const lp = span(t, LABEL, LABEL + 0.4), hp = span(t, HL, HL + 0.45);
  return {
    y: +(-scrollAt(t)).toFixed(2),
    th: +thumbTop(t).toFixed(3),
    /* the thumb lights green, and a ring springs in round it */
    hl: +smooth(span(t, HL, HL + 0.15)).toFixed(3),
    ring: { o: +(span(t, HL, HL + 0.06) * (1 - 0.35 * smooth(span(t, HL + 0.5, HL + 1.0)))).toFixed(3), s: +lerp(2.6, 1, SPRING(hp)).toFixed(4) },
    zs,
    lb: { o: +span(t, LABEL, LABEL + 0.05).toFixed(3), s: +lerp(0.4, 1, SPRING(lp)).toFixed(4) },
    same: grow(t, SAME),
    tip: grow(t, TIP),
  };
}

const css = `
.doc{position:absolute;left:${DOC.l}px;top:${DOC.t}px;width:${DOC.w}px;height:${DOC.h}px;z-index:2;
  background:#0c0d0c;border:1px solid rgba(255,255,255,.20);border-radius:12px;overflow:hidden}
.doc-bar{position:absolute;left:0;right:0;top:0;height:${DOC.bar}px;border-bottom:1px solid rgba(255,255,255,.12);
  display:flex;align-items:center;gap:6px;padding:0 12px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--sub)}
.doc-bar i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.28);display:block}
.doc-bar i+i{margin-right:6px}
.doc-body{position:absolute;left:${BODY.l - DOC.l}px;top:${BODY.t - DOC.t}px;width:${BODY.w}px;height:${BODY.h}px;overflow:hidden}
.doc-text{position:absolute;left:0;top:0;width:100%;will-change:transform;font-family:var(--mono);font-size:6.4px;line-height:10px;
  color:rgba(255,255,255,.34);text-align:justify;hyphens:none}
.doc-text p{margin:0 0 8px}
.doc-text b{font-weight:400;color:rgba(255,255,255,.52)}
.doc-text .dh{color:rgba(255,255,255,.66);font-size:7.4px;margin:14px 0 8px;letter-spacing:.04em}
.doc-text .top{margin-top:0;font-size:8.6px;color:rgba(255,255,255,.80)}
.doc-track{position:absolute;left:${TRACK.x - DOC.l}px;top:${TRACK.t - DOC.t}px;width:${TRACK.w}px;height:${TRACK.h}px;border-radius:3px;background:rgba(255,255,255,.07)}
.doc-thumb{position:absolute;left:0;top:0;width:100%;height:${THUMB.h}px;border-radius:3px;background:rgba(255,255,255,.62);will-change:transform}
.doc-thumb i{position:absolute;inset:0;border-radius:3px;background:var(--accent);opacity:0;display:block}
.doc-ring{position:absolute;left:-6px;top:-6px;width:${TRACK.w + 12}px;height:${THUMB.h + 12}px;border:2px solid var(--accent);border-radius:6px;opacity:0;will-change:transform,opacity}
.zz{position:absolute;left:${MAS.cx + 46}px;top:${MAS.cy - 56}px;z-index:7;font-family:var(--display);font-size:22px;line-height:1;color:var(--fg);
  opacity:0;will-change:transform,opacity;text-shadow:0 0 8px rgba(255,255,255,.25)}
/* the card: the big lines and the tip, on the window, growing a line at a time */
.lbl{position:absolute;right:${VW - CARD.r}px;top:${CARD.t}px;z-index:9;transform-origin:100% 0;opacity:0;will-change:transform,opacity;
  font-family:var(--mono);line-height:1.12;letter-spacing:.03em;color:var(--accent);background:var(--bg);
  border:2px solid var(--accent);border-radius:10px;padding:14px 18px 15px;white-space:nowrap}
.lb1{font-size:32px}
.gw{height:0;overflow:hidden}
.gi{opacity:0;will-change:transform,opacity}
.lb2{padding-top:14px;font-size:19px;line-height:1.35;color:var(--fg);letter-spacing:.02em}
`;
const markup = `
<div class="doc" id="doc">
  <div class="doc-bar"><i></i><i></i>terms and conditions</div>
  <div class="doc-body"><div class="doc-text" id="doc-text">${legalese()}</div></div>
  <div class="doc-track"><div class="doc-thumb" id="doc-thumb"><i id="thumb-hl"></i></div><div class="doc-ring" id="doc-ring"></div></div>
</div>`;
const front = ZS.map((_, i) => '<div class="zz" id="zz' + i + '">z</div>').join('');
const overlay = '<div class="lbl" id="lbl"><div class="lb1">1% read.</div>'
  + '<div class="gw" id="samew"><div class="gi lb1" id="same">same as you.</div></div>'
  + '<div class="gw" id="tipw"><div class="gi lb2" id="tip">tip, paste them<br>into ai and ask<br>what is risky.</div></div></div>';

function page() {
  const $ = id => document.getElementById(id);
  const text = $('doc-text'), thumb = $('doc-thumb'), hl = $('thumb-hl'), ring = $('doc-ring'), lbl = $('lbl');
  const lines = [['same', $('same'), $('samew')], ['tip', $('tip'), $('tipw')]];
  const zs = [];
  for (let i = 0; $('zz' + i); i++) zs.push($('zz' + i));
  window.__gag = {
    apply(o) {
      text.style.transform = 'translateY(' + o.y + 'px)';
      thumb.style.transform = 'translateY(' + o.th + 'px)';
      hl.style.opacity = o.hl;
      ring.style.opacity = o.ring.o;
      ring.style.transform = 'translateY(' + o.th + 'px) scale(' + o.ring.s + ')';
      o.zs.forEach((z, i) => { zs[i].style.opacity = z.o; zs[i].style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.s + ')'; });
      lbl.style.opacity = o.lb.o;
      lbl.style.transform = 'scale(' + o.lb.s + ')';
      for (const [k, inner, wrap] of lines) {
        wrap.style.height = (o[k].k * inner.offsetHeight).toFixed(2) + 'px';
        inner.style.opacity = o[k].o;
        inner.style.transform = 'translateY(' + o[k].y + 'px)';
      }
    },
  };
}

/* at the end the window, its title bar, the title and he are whole and inside
   the margins, and the card sits on the window */
const inside = r => r && r.l >= MARGIN - 0.5 && r.t >= MARGIN - 0.5 && r.r <= VW - MARGIN + 0.5 && r.b <= 810.5;
const END = CUT - 0.05;
await runEpisode({
  post: 44, ep: 1, title: ['ai after reading', 'the terms and conditions'],
  cut: CUT,
  mascot: MAS,
  voice: TAKES, subs: SUBS,
  gag: {
    css, markup, front, overlay, page, frame, face,
    sleep: [[SHUT.at, WAKE.at + WAKE.for]],
    beats: [...LOOKS.map(l => l.at), ...NODS.map(n => n.at), BLINK.at, SLOW, DIP, SHUT.at, ...ZS.map(z => z.at), HL, LABEL, WAKE.at, SAME, KNOW.at, TIP, READS, ...TAKES.map(T => T.at)],
    checks: ['#doc', '#lbl', ...ZS.map((_, i) => '#zz' + i)],
    hook: ['#doc'],
    verify: [
      { at: HL - 0.01, sel: '#doc-text', test: r => (r && r.b > BODY.t + BODY.h + 20 ? null : 'the terms run out before the label') },
      { at: END, sel: '#doc', test: r => (inside(r) ? null : 'the window is not whole at the end') },
      { at: END, sel: '#aa-title', test: r => (inside(r) ? null : 'the title is not whole at the end') },
      { at: END, sel: '#m-card', test: r => (inside(r) ? null : 'he is not whole at the end') },
      { at: END, sel: '#lbl', test: r => (inside(r) && r.l >= DOC.l && r.r <= DOC.l + DOC.w && r.t >= DOC.t && r.b <= DOC.t + DOC.h ? null : 'the card is not on the window at the end') },
    ],
    copy: ['terms and conditions of service', '1% read.', 'same as you.', 'tip, paste them into ai and ask what is risky.', 'z', ...HEADS],
    log: [[0, 'everything on, the page flies, he reads and nods'], [SLOW, 'l1 ends, the scroll slows, the squint'], [DIP, 'a drowsy dip'],
      [SHUT.at, 'eyes shut on it lasted, the z float up'], [HL, 'the thumb lights green'], [LABEL, '1% read. on one'], [WAKE.at, 'he wakes to the lens'],
      [SAME, 'same as you. on same'], [KNOW.at, 'a knowing squint'], [TIP, 'the tip grows into the card, he looks at it']],
  },
});
