/* the boring tek — the site video, who we are. for the intro player.

   1920x1080, built on the 960x540 wide stage of lib/aiafter.mjs, everything on
   the centre line like the ai at work video. five lines on the elevenlabs
   narrator, eleven_v4 like post51, three takes a line and one kept by
   measurement, speed 1.0, 0.42s between lines, post51's subtitles low on the
   stage. one big glowing word a line: a white outline and post49's three
   layer glow, tight round the letters. the effects are lib/sfx.mjs off the
   same word times, ducked under the read.

     frame 0   he touches down in the middle, round, the first subtitle on. the
               squash lands in the next frames and rings out, a small rebound hop
     l1  hi, we are ...        happy on `hi`, THE BORING TEK pops just after `we`, about 1.1s
     l2  we build tools ...    AI AGENTS on `ai`, two nods, a hop on `businesses`
     l3  no time for ...       the word goes, a deadpan squint on `boring`,
                               WE DO IT FOR YOU on `we`, a happy hop
     l4  a team of ...         four small copies of him pop out beside him on
                               `team`, ALWAYS READY on `always`, they nod, they
                               hop back into him on `help`
     l5  just tell us ...      TELL US on `tell`, he turns to the lens, happy on `need`
     the glitch cut, the end card 1.2s

   colour is the green accent only: a line under TEK, a dot after AI AGENTS, a
   status dot before ALWAYS READY. the copies are assets/mascot.svg, the site's
   own drawing. eyes calm, happy or squint, never wide. no hands, no sparkles.
   on screen copy has no dashes, apostrophes, quotes or colons.

   under it all a music bed from the elevenlabs music api, lib/elevenmusic.mjs,
   instrumental, the clip's exact length, ducked further under every word.

     DEMO_FPS=12 node site-who-we-are.mjs          the preview
     node site-who-we-are.mjs --stills             one still per beat, no render
     node site-who-we-are.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, VGAP, span, lerp, smooth, bump, EASE, SPRING, IO, MARGIN,
} from './lib/aiafter.mjs';
import { elevenMusic } from './lib/elevenmusic.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ---------- the read ---------- */
const LINES = [
  { key: 'r1', text: 'hi, we are the boring tek.' },
  { key: 'r2', text: 'we build tools and ai agents for businesses.' },
  { key: 'r3', text: 'no time for the boring work? we do it for you.' },
  { key: 'r4', text: 'a team of ai agents, always ready to help.' },
  { key: 'r5', text: 'just tell us what you need.' },
];
const TAKES = await readLines('site-who', LINES, 3, { model: 'eleven_v4' });
const [L1, L2, L3, L4, L5] = TAKES;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + VGAP);
const SUBS = [
  { line: 0, text: 'hi, we are' },
  { line: 0, text: 'the boring tek' },
  { line: 1, text: 'we build tools and ai agents' },
  { line: 1, text: 'for businesses' },
  { line: 2, text: 'no time for the boring work?' },
  { line: 2, text: 'we do it for you' },
  { line: 3, text: 'a team of ai agents' },
  { line: 3, text: 'always ready to help' },
  { line: 4, text: 'just tell us what you need' },
];

/* ---------- the layout, css px of the 960x540 stage ----------
   the word over him on the centre line, him in the middle, the subtitles low */
const W = 960, H = 540;
const MAS = { cx: 480, cy: 322, size: 118, scale: 1 };
const R = MAS.size * MAS.scale * 30 / 64;
const WORD = { y: 160, size: 50 };
const SUB_TOP = 446;
const TEAM = { d: 58, xs: [-214, -128, 128, 214] };
TEAM.y = MAS.cy + R - TEAM.d / 2;

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const HI = w(L1, 'hi');
/* the first word at about 1.1s, just after `we`: people press play, the hook is the voice */
const W1 = +(w(L1, 'we') + 0.08).toFixed(3);
const W2 = w(L2, 'ai');
const NODS = [+(W2 + 0.25).toFixed(3), +(W2 + 0.55).toFixed(3)];
const BIZ = w(L2, 'businesses');
const W2_OUT = +(L3.at - 0.05).toFixed(3);
const SQ3 = w(L3, 'boring');
const W3 = w(L3, 'we');
const TEAM_IN = w(L4, 'team');
const W4 = w(L4, 'always');
const TEAM_NOD = +(W4 + 0.3).toFixed(3);
const TEAM_OUT = w(L4, 'help');
const W5 = w(L5, 'tell');
const NEED = w(L5, 'need');
const CUT = +(L5.end + 0.45).toFixed(3), HOLD = 1.2;
const WORDS = [
  { at: W1, text: 'THE BORING TEK', acc: 'line' },
  { at: W2, text: 'AI AGENTS', acc: 'dot' },
  { at: W3, text: 'WE DO IT FOR YOU' },
  { at: W4, text: 'ALWAYS READY', acc: 'status' },
  { at: W5, text: 'TELL US' },
];
/* each word leaves as the next comes, AI AGENTS leaves on line 3, the last stays to the cut */
WORDS.forEach((x, i) => { x.out = i === 1 ? W2_OUT : i + 1 < WORDS.length ? +(WORDS[i + 1].at - 0.12).toFixed(3) : CUT + 1; });
const TEAM_AT = TEAM.xs.map((_, i) => +(TEAM_IN + 0.09 * i).toFixed(3));
const BACK_AT = TEAM.xs.map((_, i) => +(TEAM_OUT + 0.08 * (3 - i)).toFixed(3));
const BACK_END = +(Math.max(...BACK_AT) + 0.26).toFixed(3);
const HOPS = [{ at: 0.14, h: 9, d: 0.26 }, { at: BIZ, h: 12 }, { at: W3 + 0.05, h: 16 }, { at: NEED + 0.16, h: 10 }];

/* ---------- him ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  ...WORDS.slice(0, 4).flatMap(x => [{ at: x.at, to: AT(480, WORD.y) }, { at: x.at + 0.7, to: LENS }]),
  { at: TEAM_IN, to: AT(480 + TEAM.xs[0], TEAM.y) },
  { at: TEAM_IN + 0.5, to: AT(480 + TEAM.xs[3], TEAM.y) },
  { at: W4, to: AT(480, WORD.y) },
  { at: W4 + 0.6, to: LENS },
  { at: W5, to: LENS },
].sort((a, b) => a.at - b.at);
const BLINKS = [1.9, +(L2.at + 1.2).toFixed(3), +(L4.at + 0.1).toFixed(3), +(L5.at - 0.15).toFixed(3)];
const HAPPY = [HI, W3 + 0.1, NEED];
/* a hop: a squash to load it, the arc, a squash on the landing that rings out */
function hopAt(t, a, h, d) {
  let dy = 0, sq = 0;
  if (t >= a - 0.08 && t < a) sq += 0.07 * Math.sin(Math.PI / 2 * EASE(span(t, a - 0.08, a)));
  if (t >= a && t < a + d) { const u = (t - a) / d; dy -= 4 * h * u * (1 - u); sq -= 0.06 * Math.sin(Math.PI * u); }
  if (t >= a + d) { const dt = t - a - d; sq += 0.10 * Math.exp(-dt / 0.10) * Math.cos(2 * Math.PI * dt / 0.30); }
  return { dy, sq };
}
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const lens = { x: MAS.cx, y: MAS.cy, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.2));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  lid = Math.max(lid, 0.04 + 0.46 * bump(t, SQ3, 0.15, 0.5, 0.15));
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.3, 0.12));
  /* frame 0 is the touchdown, round and whole: the squash peaks 0.05s later
     and rings out */
  let sq = t < 0.05 ? 0.2 * Math.sin(Math.PI / 2 * t / 0.05) : 0.2 * Math.exp(-(t - 0.05) / 0.11) * Math.cos(2 * Math.PI * (t - 0.05) / 0.34);
  let dy = 0, rot = 0;
  for (const hp of HOPS) { const o = hopAt(t, hp.at, hp.h, hp.d ?? 0.32); dy += o.dy; sq += o.sq; }
  /* nods on line 2 and with the team, a small dip each */
  for (const a of [...NODS, TEAM_NOD]) dy += 5 * Math.sin(Math.PI * span(t, a, a + 0.2));
  /* the team comes home: a squash as the last one lands in him */
  { const dt = t - BACK_END; if (dt >= 0) sq += 0.12 * Math.exp(-dt / 0.10) * Math.cos(2 * Math.PI * dt / 0.30); }
  /* a small lean towards each word as it lands, and a breath */
  rot += 3 * Math.sin(2 * Math.PI * t / 3.4);
  dy += 2 * Math.sin(2 * Math.PI * t / 2.2);
  /* standing: the squash keeps his bottom on the floor */
  dy += R * sq;
  return { lid: +lid.toFixed(4), arc: +arc.toFixed(4), look, dy: +dy.toFixed(3), rot: +rot.toFixed(3), sq: +sq.toFixed(4) };
}

/* ---------- a frame ---------- */
function frame(t) {
  const words = WORDS.map(x => {
    const u = span(t, x.at, x.at + 0.45);
    const o = smooth(span(t, x.at, x.at + 0.1)) * (1 - smooth(span(t, x.out, x.out + 0.2)));
    return {
      o: +o.toFixed(3), s: +(t < x.at ? 0.6 : lerp(0.6, 1, SPRING(u))).toFixed(4),
      y: +(-16 * EASE(span(t, x.out, x.out + 0.2))).toFixed(2),
      acc: +smooth(span(t, x.at + 0.2, x.at + 0.5)).toFixed(3),
    };
  });
  const team = TEAM.xs.map((dx, i) => {
    const a = TEAM_AT[i], b = BACK_AT[i];
    if (t < a || t >= b + 0.26) return { o: 0, x: 0, y: 0, s: 0.3 };
    const out = SPRING(span(t, a, a + 0.42)), back = EASE(span(t, b, b + 0.26));
    const k = out * (1 - back);
    /* each one hops once after it lands, and nods with the team */
    const hop = 10 * Math.sin(Math.PI * span(t, a + 0.45 + 0.05 * i, a + 0.75 + 0.05 * i));
    const nod = 4 * Math.sin(Math.PI * span(t, TEAM_NOD + 0.04 * i, TEAM_NOD + 0.24 + 0.04 * i));
    return {
      o: +(smooth(span(t, a, a + 0.08)) * (1 - smooth(span(t, b + 0.16, b + 0.26)))).toFixed(3),
      x: +(dx * k).toFixed(2), y: +(-hop + nod - 18 * Math.sin(Math.PI * Math.min(1, k)) * (1 - span(t, a + 0.42, a + 0.43)) - 14 * Math.sin(Math.PI * back)).toFixed(2),
      s: +lerp(0.3, 1, Math.min(1.08, k)).toFixed(4),
    };
  });
  return { words, team };
}

/* ---------- the page ---------- */
const MASCOT = fs.readFileSync(path.join(HERE, '..', 'assets', 'mascot.svg'), 'utf8').replace(/<svg /, '<svg class="tm-s" ');
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.70)) drop-shadow(0 0 36px rgba(255,255,255,.40)) drop-shadow(0 0 70px rgba(255,255,255,.24))';
const css = `
.stage{background:radial-gradient(circle,rgba(255,255,255,.075) 0 1px,transparent 1.4px) 0 0/20px 20px,var(--bg)}
.wd{position:absolute;left:0;top:${WORD.y}px;width:${W}px;height:0;display:flex;justify-content:center;align-items:center;opacity:0;will-change:transform,opacity}
.wd b{position:relative;display:block;font:400 ${WORD.size}px/1 var(--display);color:#f7f9f8;letter-spacing:.06em;white-space:nowrap;
  -webkit-text-stroke:1.2px #fff;filter:${GLOW};transform:translateY(-50%)}
.wd .ln{position:absolute;right:.06em;bottom:-14px;height:4px;border-radius:2px;background:var(--accent);transform-origin:0 50%;
  box-shadow:0 0 10px rgba(80,255,140,.35)}
.wd .dt{display:inline-block;width:.22em;height:.22em;margin-left:.18em;border-radius:50%;background:var(--accent);vertical-align:.08em;box-shadow:0 0 10px rgba(80,255,140,.45)}
.wd .st{display:inline-block;width:.24em;height:.24em;margin-right:.36em;border-radius:50%;background:var(--accent);vertical-align:.18em;box-shadow:0 0 0 .1em rgba(80,255,140,.18),0 0 12px rgba(80,255,140,.5)}
.tm{position:absolute;left:${MAS.cx - TEAM.d / 2}px;top:${TEAM.y - TEAM.d / 2}px;width:${TEAM.d}px;height:${TEAM.d}px;z-index:5;opacity:0;will-change:transform,opacity}
.tm-s{display:block;width:100%;height:100%;filter:drop-shadow(0 0 8px rgba(255,255,255,.35)) drop-shadow(0 0 22px rgba(255,255,255,.14))}
`;
const accent = x => (x.acc === 'line' ? '<i class="ln" style="width:2.9em"></i>' : '');
const wordHtml = (x, i) => {
  const t = x.acc === 'dot' ? x.text + '<span class="dt"></span>' : x.acc === 'status' ? '<span class="st"></span>' + x.text : x.text;
  return `<div class="wd" id="wd${i}"><b>${t}${accent(x)}</b></div>`;
};
/* the copies sit under him: the rig's #mas-cut comes after markup */
const markup = `${WORDS.map(wordHtml).join('')}${TEAM.xs.map((_, i) => `<div class="tm" id="tm${i}">${MASCOT}</div>`).join('')}`;

function page() {
  const D = window.__GAGD;
  const $ = id => document.getElementById(id);
  const wd = D.words.map((_, i) => ({ el: $('wd' + i), acc: $('wd' + i).querySelector('.ln,.dt,.st') }));
  const tm = D.team.map((_, i) => $('tm' + i));
  window.__gag = {
    apply(o) {
      o.words.forEach((x, i) => {
        wd[i].el.style.opacity = x.o; wd[i].el.style.transform = 'translateY(' + x.y + 'px) scale(' + x.s + ')';
        if (wd[i].acc) { if (wd[i].acc.className === 'ln') wd[i].acc.style.transform = 'scaleX(' + x.acc + ')'; else wd[i].acc.style.opacity = x.acc; }
      });
      o.team.forEach((x, i) => { tm[i].style.opacity = x.o; tm[i].style.transform = 'translate(' + x.x + 'px,' + x.y + 'px) scale(' + x.s + ')'; });
    },
  };
}

/* ---------- the music: an elevenlabs bed, the clip's exact length ----------
   three takes cached in demo/out/music-site-who/, one kept by measurement,
   never committed */
let MUSIC;
try {
  MUSIC = await elevenMusic('site-who', {
    prompt: 'positive, warm, light, modern instrumental, a soft beat, a friendly tech feel. a gentle start, and a clean ending that resolves on the last bar. no vocals.',
    seconds: +(CUT + HOLD).toFixed(3),
  });
} catch (e) { console.error('\nSTOPPED. the music did not come: ' + (e && e.message || e)); process.exit(1); }
console.log('  music ' + MUSIC.all.join(', '));

/* ---------- the effects, off the word times, under the read ---------- */
const CUES = [
  { t: 0.0, kind: 'land', from: 'frame 0, the landing squash' },
  { t: 0.14, kind: 'bounce', opts: { f0: 240, f1: 150 }, from: 'the rebound hop' },
  { t: 0.40, kind: 'bounce', opts: { f0: 200, f1: 120 }, from: 'it lands' },
  { t: HI, kind: 'bwop', from: 'hi, happy' },
  ...WORDS.flatMap((x, i) => [
    ...(i ? [{ t: x.at - 0.06, kind: 'whoosh', opts: { len: 0.2 }, from: 'the old word goes' }] : []),
    { t: x.at, kind: 'popDeep', from: x.text + ' pops in' },
  ]),
  { t: W1 + 0.2, kind: 'sweep', opts: { len: 0.32 }, from: 'the line under TEK' },
  ...NODS.map(t => ({ t, kind: 'tock', opts: { f: 1400 }, from: 'a nod' })),
  ...HOPS.slice(1).map(h => ({ t: h.at + (h.d ?? 0.32), kind: 'bounce', from: 'a hop lands' })),
  { t: W2_OUT, kind: 'whoosh', opts: { len: 0.2 }, from: 'AI AGENTS goes' },
  { t: SQ3, kind: 'tock', opts: { f: 1100 }, from: 'the deadpan squint' },
  ...TEAM_AT.map((t, i) => ({ t, kind: 'bubble', opts: { f0: 420 + 70 * i, f1: 1100 + 160 * i }, from: 'a copy pops out' })),
  { t: TEAM_NOD, kind: 'tock', opts: { f: 1600 }, from: 'the team nods' },
  ...BACK_AT.map((t, i) => ({ t: t + 0.18, kind: 'bubble', opts: { f0: 700 - 70 * i, f1: 1500 - 160 * i }, from: 'a copy hops back' })),
  { t: BACK_END, kind: 'land', from: 'the team is home' },
  { t: NEED, kind: 'chime', from: 'happy into the lens' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));

const BEATS = [0.14, HI, ...WORDS.map(x => x.at), ...NODS, BIZ, W2_OUT, SQ3, TEAM_IN, TEAM_NOD, TEAM_OUT, BACK_END, NEED];
const STILLS = [0, 0.06, 0.45, HI + 0.2, W1 + 0.5, W2 + 0.5, BIZ + 0.2, SQ3 + 0.3, W3 + 0.5, TEAM_IN + 0.5, W4 + 0.5, TEAM_NOD + 0.15, TEAM_OUT + 0.2, BACK_END + 0.1, W5 + 0.5, NEED + 0.2, CUT - 0.1, CUT + 0.5];

const res = await runEpisode({
  name: 'site-who-we-are', post: 0, ep: 0, series: false, title: [],
  stage: { w: W, h: H, appZone: MARGIN, subTop: SUB_TOP, file: 'site-who-we-are-1920x1080.mp4' },
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  tp: -1,
  music: { pcm: MUSIC.pcm, level: -19, duck: 0.62, under: -12 },
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { sweep: -26, whoosh: -21, popDeep: -15, chime: -20, bounce: -15, tock: -11 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, page, frame, face,
    data: { words: WORDS.map(x => x.text), team: TEAM.xs },
    sleep: [],
    beats: BEATS,
    checks: ['#wd0 b', '#wd1 b', '#wd2 b', '#wd3 b', '#wd4 b', '#tm0', '#tm1', '#tm2', '#tm3'],
    hook: ['#subt'],
    copy: WORDS.map(x => x.text),
    verify: [
      /* every word sits whole inside the margins at full size */
      ...WORDS.map((x, i) => ({ at: x.at + 0.6, sel: '#wd' + i + ' b', test: r => (r && r.l >= MARGIN && r.r <= W - MARGIN ? null : x.text + ' is past the margin: ' + JSON.stringify(r)) })),
      /* the copies stand clear of him */
      { at: W4, sel: '#tm1', test: r => (r && r.r < MAS.cx - R - 6 ? null : 'a copy touches him') },
      { at: W4, sel: '#tm2', test: r => (r && r.l > MAS.cx + R + 6 ? null : 'a copy touches him') },
      /* the words stay clear of his head */
      { at: W3 + 0.6, sel: '#wd2 b', test: r => (r && r.b < MAS.cy - R - 12 ? null : 'the word reaches him') },
    ],
    log: [[L1.at, 'line 1'], [W1, 'THE BORING TEK'], [W2, 'AI AGENTS'], [SQ3, 'the squint'], [W3, 'WE DO IT FOR YOU'], [TEAM_IN, 'the team'],
      [W4, 'ALWAYS READY'], [TEAM_OUT, 'the team goes home'], [W5, 'TELL US'], [NEED, 'happy into the lens']],
  },
});
void res;
