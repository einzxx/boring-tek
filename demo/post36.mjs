/* the boring tek — post36. the link checker announcement.

   dark only, 1080x1920, five lines read by edge's andrew, about 22 seconds
   on the brief's clock and as long as the read and the page need on the
   real one. voice only on the bus: no ticks, no beeps, einz adds the music
   outside.

     one                he sits in the middle of the frame at the house size,
                        calm, idle. on the message he springs up and lands
                        higher, and a phone notification slides in from
                        below into the room he left, with a small buzz: a
                        dark chat card with a soft shadow, a round avatar
                        with the letter P, `PayPal` in bold, `22:41` on the
                        right, and the message in two lines, `your account is
                        locked, open` and the link `https://pаypal.com/login`
                        in blue, underlined, with a cyrillic а where the
                        first a should be. no logo, only the letter and the
                        name. he looks down at it, one blink once it has
                        landed, and the scene goes straight to the phone.
     two                a phone in the middle, its screen the real link
                        checker, `tools/check/index.html` served into an
                        iframe at 390 css px and scaled onto the screen, dark
                        theme, its language switch, socials and theme toggle
                        hidden so only the tool shows. the link lifts out of
                        the bubble and flies into the field, the pointer
                        presses `check it`, the page types its own nine
                        lines, the lookalike and brand copy lines red, and
                        its own danger pill lands. he sits small on the
                        phone's bottom right corner, eyes calm and on the
                        phone, and his glow pulses red once as the pill lands.
     three              on `fake` a soft red ring sits on the page's lookalike
                        line for one second, and a small line under the
                        phone: `fake copy of paypal`.
     four               the pointer presses `check another link`, the page
                        clears itself, a new link types into the field letter
                        by letter: `https://por` and from there every letter
                        is fog, a soft blur blob over the letter, nothing
                        readable. his eyes slide from the phone to the lens,
                        one blink. `check it`, the page types its lines all
                        green, the host in the first line fogged the same
                        way, the pill says `nothing found`, he goes happy on
                        it, and the line under the phone reads `even these,
                        we only check`.
     five               the phone shrinks away. he springs in at the middle,
                        calm, the wordmark under him, `theboringtek.com/tools`
                        small under that. held to the end.

   the clock is the read's: every scene starts AFTER_LINE after the line
   before it stops sounding, no floor from a brief, post30's rule with the
   air cut to 0.2s. two places are floored by the picture as well: three
   cannot start before the danger pill is up, and five cannot start until the
   second pill has been up for PILL_HOLD.

   **the fog is only blur.** the real link is FOG.real, a plain address the
   checker finds nothing on, and only its first FOG.shown characters are ever
   readable: each letter after them is covered in the field by a soft blob of
   the page's muted grey over a backdrop blur, and the same is done to the
   host in the page's own `real address` line, because that line would print
   the host in full. the guard reads the rendered still and wants the fogged
   band flatter than the readable one. no picture anywhere.

   **every line is subtitled** under everything, post31's way: nunito, white,
   one or two short lines, centred, in the high slot under him and in the low
   slot under the phone and its caption, never over either, no full stop on
   screen.

   **the states are neutral and delighted.** the look down at the card and
   the look at the phone are one offset composed onto the eyes, in grid units,
   checked against the head silhouette the module's own way, post35's. the
   two blinks the brief names are the module's own: the seed is searched until
   one blink lands in each window and none lands on a landing.

   **the read is edge at its own pace with a 200ms stop at every full stop**,
   post31's take() copied whole: every sentence its own take, assembled with
   exactly BREAK_MS of silence between them.

     node post36.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post36.mjs         the fast preview pass
     node post36.mjs --voice             the read and the clock only, no browser
     node post36.mjs --blur              60fps with the shutter open, solved
     node post36.mjs --keep-frames       leave the jpegs on disk
     node post36.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post36-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs` and nothing here reaches inside it.** two
   states, neutral and delighted, no hands, no bubble. the exits are a shrink in place and
   the entrances a spring in place, post30's pattern under subtitles; the ride
   on the phone's corner is one translate and scale composed onto
   `frame.card`; the jump in one is a travel on post30's rise; the shadow is
   declined, post26. `bias: 0`: he faces the lens.

   **the notification's colours are the clip's own**, three hexes in NOTE:
   the card's dark chat green, the avatar's slate and the link's blue. the
   site has no token for any of them and a notification has to read as a
   notification; a guard counts where each is painted. the soft shadow
   under the card is the same call.

   **the phone is the real page**, post30's method: `/tools/check/` served
   straight off the repo's file by this script's own server into one iframe.
   the page keeps its own script: the field is set, the presses are
   `.btn.click()` and `.again.click()`, the lines, their colours, the pill
   and its words are whatever the page's own checker says, read back and
   asserted. three things are taken over so the render is a function of
   time: the page's rAF loop is driven at sixty ticks a second between
   frames, every css animation and transition in it is paused and set to the
   clip's clock, and the theme key is set before the page boots. one style
   rule is added to it, hiding the language switch, the home link, the
   socials and the theme toggle, so only the tool is on the screen.

   **the voice is edge, on purpose,** post29's rule: every take asks for
   `provider: 'edge'` and the sidecar is refused from anywhere else. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCues, mascotCss, mascotMarkup,
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect, headSD,
  STAGE, SAFE, HEAD, GRID, EYE_CX,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import { writeWav, applyGain, limit, loudness, decode, SR } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post36');
const SUBS = path.join(OUT, 'subframes-post36');
const VERIFY = path.join(OUT, 'verify-post36');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = { top: SAFE.top / DSF, bottom: SAFE.bottom / DSF, left: SAFE.left / DSF, right: SAFE.right / DSF };
/* the brief's own margin, 120 device px on every side. the house safe area is
   stricter on every side and both are checked. */
const BRIEF_SAFE = 120;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const VOICE_ONLY = argv.includes('--voice');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a === '--blur' || a.startsWith('--blur='));
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_STEP_WANT = 6.3;
const SUB_MAX = 12;
let SUB = 1;
let SUBSTEP = STEP;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the clock ----------
   the brief's scene starts, each floored once the takes are measured: a
   scene starts no earlier than the line before it stops sounding plus
   AFTER_LINE. five is floored by the picture as well, see PILL_HOLD. `END`
   is the last sound plus AFTER_READ, so the end card holds. */
const BRIEF = [0, 0, 0, 0, 0];
const BRIEF_END = 22;
const AFTER_LINE = 0.20;
const AFTER_READ = 0.80;
const SC = BRIEF.slice();
let END = BRIEF_END;
let SECONDS = 0;

/* ---------- the copy, and the read ----------
   the read keeps its stops; a full stop before `the boring tek`. the pace
   is the voice's own, fix round one's natural read. */
const VOICE = 'calm';
const RATE = '+0%';
const BREAK_MS = 200;
const LINES = [
  { text: 'you got a message. your paypal account is locked, open this link. looks real.', rate: RATE, pitch: '+1Hz' },
  { text: 'do not click. paste it in our free link checker first.', rate: RATE, pitch: '+1Hz' },
  { text: 'it found a fake letter. this is a copy of paypal, made to steal your login.', rate: RATE, pitch: '+1Hz' },
  { text: 'and it works for every link. even the ones you open at night. we do not judge, we only check.', rate: RATE, pitch: '+1Hz' },
  { text: 'free, in your browser, three languages. the boring tek.', rate: RATE, pitch: '+2Hz' },
];
/* ---------- the subtitles ----------
   one card per sentence or so, cut to the read's own words by index into
   the take, the screen lines broken by hand so nothing wraps. no full stop
   on screen; the read keeps its stops. */
const SUBTITLES = [
  { line: 0, words: [0, 3], lines: ['you got a message'] },
  { line: 0, words: [4, 11], lines: ['your paypal account is locked,', 'open this link'] },
  { line: 0, words: [12, 13], lines: ['looks real'] },
  { line: 1, words: [0, 2], lines: ['do not click'] },
  { line: 1, words: [3, 10], lines: ['paste it in our', 'free link checker first'] },
  { line: 2, words: [0, 4], lines: ['it found a fake letter'] },
  { line: 2, words: [5, 15], lines: ['this is a copy of paypal,', 'made to steal your login'] },
  { line: 3, words: [0, 5], lines: ['and it works for every link'] },
  { line: 3, words: [6, 12], lines: ['even the ones you open at night'] },
  { line: 3, words: [13, 19], lines: ['we do not judge, we only check'] },
  { line: 4, words: [0, 5], lines: ['free, in your browser,', 'three languages'] },
  { line: 4, words: [6, 8], lines: ['the boring tek'] },
];
/* two slots: high under him and the address, low under the phone and the
   line under it */
const ST = { size: 22, lh: 1.3, weight: 600, high: 660, low: 788, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 6 };
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ---------- what is on the screen ----------
   every string a viewer reads, in one place, so the copy guard can walk them. */
/* one: the notification. a phone's message card: a round avatar with one
   letter, the sender in bold, the time on the right, the message in two
   lines with the link in blue and underlined. the а in paypal is cyrillic,
   u+0430, exactly as the brief wrote it. it sits below him once he has
   jumped, slides in from below the frame and lands with a buzz. */
const NOTE = {
  w: 380, left: 80, top: 400, radius: 18, pad: 14, padX: 16,
  avatar: 40, letter: 'P', name: 'PayPal', time: '22:41', gap: 12,
  text: 'your account is locked, open', link: 'https://p\u0430ypal.com/login',
  size: 16, lh: 1.45, nameSize: 16, timeSize: 13, linkSize: 15, linkGap: 3,
  colors: { card: '#1f2c34', avatar: '#3a4b58', link: '#5ab0f6' },
  shadow: '0 14px 34px rgba(0,0,0,.48)',
  in: { at: 0, for: 0.60, from: 560 }, out: { for: 0.30 },
  /* the buzz on landing: a small sideways shake that dies out, a phone on a
     table. starts a shade before the slide settles. */
  buzz: { at: 0, for: 0.45, amp: 2.6, hz: 15 },
};
/* his jump on the message: from the middle of the frame up to S1_Y, on the
   rise, before the card comes in under him */
const JUMP = { at: 0, for: 0.50 };
const START_Y = 480;
/* the fog. the real link, a plain address the checker finds nothing on; the
   first FOG.shown characters are the only readable ones, in the field and
   in the page's own address line alike. each letter after them gets a puff,
   a soft blob of the page's muted grey, over one band of backdrop blur. */
const FOG = { real: 'https://pornhub.com', shown: 'https://por', blur: 9, puff: 22, popFor: 0.30, popFrom: 0.4, tint: 0.92 };
FOG.host = new URL(FOG.real).hostname;
FOG.hostShown = FOG.shown.slice(FOG.shown.lastIndexOf('/') + 1);
FOG.n = FOG.real.length - FOG.shown.length;
/* the two small lines under the phone, nunito, one slot: the first on
   `fake` in three, gone as four starts; the second on the nothing found
   pill in four, gone with the phone */
const CAP = { size: 19, top: 756, for: 0.30, outFor: 0.25 };
const CAP3 = { text: 'fake copy of paypal', at: 0, out: 0 };
const CAP4 = { text: 'even these, we only check', at: 0 };
/* the ring on the page's lookalike line, on `fake`: a soft red edge around
   the line's own box for one second */
const RING = { at: 0, for: 1.0, pad: 5, radius: 8, line: 3, say: 'fake' };
/* the sizes he sits at and where */
const SMALL = { s: 0.42 };
const HEAD_Y = 250;
const SIZE = 148;
const S1_Y = 300;
/* five: the wordmark and the address */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 300, lh: 1.16, top: 360, minCapPx: 50 };
const ADDR = { text: 'theboringtek.com/tools', size: 16, top: 548 };
/* the phone: 660 device px wide with 210 of air a side, the screen the page
   at 390 css px scaled onto it */
const PHONE = { w: 330, h: 630, left: 105, top: 92, radius: 40, bezel: 12, vw: 390 };
PHONE.sw = PHONE.w - 2 * PHONE.bezel;
PHONE.sh = PHONE.h - 2 * PHONE.bezel;
PHONE.scale = +(PHONE.sw / PHONE.vw).toFixed(6);
PHONE.vh = Math.round(PHONE.sh / PHONE.scale);
PHONE.cx = PHONE.left + PHONE.w / 2;
PHONE.cy = PHONE.top + PHONE.h / 2;
PHONE.bottom = PHONE.top + PHONE.h;
/* his spot on the phone: his centre this far in from the bottom right
   corner, so a quarter of him sits over the bezel */
const CORNER = { in: 8 };
CORNER.x = PHONE.left + PHONE.w - CORNER.in;
CORNER.y = PHONE.bottom - CORNER.in;
/* the page's own scan, as long as the page makes it: nine lines a quarter
   second apart plus the bold one, 2.40s under virtual time. the pulse, the
   ring's line, the captions, the happy and the scene floors hang off it,
   and the observed pill moment is asserted against it. */
const SCAN = { len: 2.40, tol: 0.30 };
const PILL_HOLD = 0.80;

/* ---------- the action inside the phone ---------- */
const FLY = { at: 0, for: 0.45 };
const PRESS1 = { at: 0 };
const PULSE = { at: 0, for: 0.70, peak: 0.55 };
const AGAIN = { at: 0 };
const TYPE = { from: 0, cps: 20, done: 0 };
const PRESS2 = { at: 0 };
const PILL1 = { at: 0 }, PILL2 = { at: 0 };
const CUR = { size: 22, keys: [], presses: [] };
/* his eyes: down at the card in one once he has landed, at the phone from
   the corner in two and three, sliding to the lens in four */
const LOOK1 = { up: 4.2, at: 0, for: 0.35, outFor: 0.30 };
const LOOK2 = { x: -3.0, y: -3.2, inFor: 0.35, at: 0 };
const EYES = { at: 0, for: 0.50 };
/* the two blinks the brief names: the window each must start in, the quiet
   before it so it reads as one */
const BLINK = { quiet: 0.60, after4: 0.05, within4: 0.45, after1: 0.25, clear1: 0.30 };

/* ---------- the entrances, the exits and the pops ---------- */
const SPRING = { for: 0.50 };
const EXIT = { for: 0.40, to: 0.6 };
const OUT1 = { at: 0 }, IN1 = { at: 0 }, OUT2 = { at: 0 }, IN2 = { at: 0 };
const HAPPY = { at: 0 }, CALM = { at: 0 };
const PHONE_IN = { at: 0, for: 0.50 }, PHONE_OUT = { at: 0, for: 0.35 };
const WM2 = { at: 0, for: 0.09 }, ADDR_IN = { at: 0, for: 0.30 };

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
const STEP_CEIL = 56;

/* ---------- the small maths ---------- */
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
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.max(0, Math.min(1, t)));
  };
}
const EASE = bezier(.16, 1, .3, 1);            /* the site's own --ease */
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const RISE = bezier(.5, 0, .3, 1.3);           /* post30's rise, the overshoot with a slow start */
const EASE_IN = p => p * p;                    /* leaving: a plain acceleration */
const GLIDE = bezier(.45, 0, .55, 1);          /* symmetric, for the card's slide: the site's ease would cross a sixth of the frame on its first frame */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
const bare = w => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

/* ---------- the read ----------
   post31's take(), whole: one take a sentence, cached on the copy and the
   delivery, edge by name and refused from anywhere else, the sentences laid
   end to end with exactly BREAK_MS of silence between one's last sound and
   the next's first. the endpoint refuses ssml breaks, which is why. */
async function take(i) {
  const L = LINES[i];
  const parts = L.text.split(/(?<=[.!?])\s+/);
  const takes = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post36-l' + (i + 1) + (parts.length > 1 ? 's' + (k + 1) : '');
    const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
    const want = parts[k].replace(/\s+/g, ' ').trim();
    let got = null;
    if (fs.existsSync(cached)) {
      const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
      if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && j.provider === 'edge' && fs.existsSync(j.file)) got = { ...j, cached: true };
    }
    if (!got) got = { ...(await speak(parts[k], { voice: VOICE, provider: 'edge', name, rate: L.rate, pitch: L.pitch })), cached: false };
    if (got.provider !== 'edge') throw new Error('take ' + (i + 1) + ' was read by ' + got.provider + ', and this clip is edge');
    if (got.timing !== 'engine') throw new Error('take ' + (i + 1) + ' came back with estimated timings, and the picture is cut to the read');
    takes.push(got);
  }
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  let total = 0;
  const off = [];
  for (let k = 0; k < takes.length; k++) {
    off.push(k === 0 ? 0 : +(off[k - 1] + edges[k - 1].end + BREAK_MS / 1000 - edges[k].start).toFixed(4));
    total = Math.max(total, off[k] + pcms[k].length / SR);
  }
  const pcm = new Float32Array(Math.ceil(total * SR));
  for (let k = 0; k < takes.length; k++) {
    const at = Math.round(off[k] * SR);
    const a = Math.max(0, Math.round((edges[k].start - PRE) * SR)), b = Math.min(pcms[k].length, Math.round((edges[k].end + POST) * SR));
    for (let j = a; j < b; j++) { const q = at + j; if (q >= 0 && q < pcm.length) pcm[q] += pcms[k][j]; }
  }
  const words = [];
  for (let k = 0; k < takes.length; k++) for (const w of takes[k].words) words.push({ word: w.word, start: +(w.start + off[k]).toFixed(4), end: +(w.end + off[k]).toFixed(4) });
  return {
    i, text: L.text, rate: L.rate, pitch: L.pitch, provider: 'edge', voiceId: takes[0].voiceId, timing: 'engine',
    words, pcm, sentences: takes.length, cached: takes.every(t => t.cached), breaks: takes.length > 1 ? BREAK_MS : 0,
    gaps: takes.slice(1).map((t, k) => +(off[k + 1] + edges[k + 1].start - off[k] - edges[k].end).toFixed(4)),
  };
}
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m > gate; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}

/* ---------- the phone's own motion ----------
   the pop in and the shrink away in five: one scale about the phone's
   centre, and one opacity. read by the frame and by his placement, so he
   rides the corner. */
function phoneAt(t) {
  const phIn = span(t, PHONE_IN.at, PHONE_IN.at + PHONE_IN.for);
  const phOut = span(t, PHONE_OUT.at, PHONE_OUT.at + PHONE_OUT.for);
  return {
    o: +(span(t, PHONE_IN.at, PHONE_IN.at + 0.20) * (1 - phOut)).toFixed(4),
    sc: +(lerp(0.94, 1, POP(phIn)) * lerp(1, 0.90, EASE(phOut))).toFixed(5),
  };
}
/* a point in the phone's own css px, carried through its scale about its centre */
const onPhone = (x, y, sc) => ({ x: +(PHONE.cx + (x - PHONE.cx) * sc).toFixed(3), y: +(PHONE.cy + (y - PHONE.cy) * sc).toFixed(3) });
/* a point in the page's css px (390 wide) onto the stage */
const pageToStage = (px, py, sc) => onPhone(PHONE.left + PHONE.bezel - 1 + px * PHONE.scale, PHONE.top + PHONE.bezel - 1 + py * PHONE.scale, sc);

/* ---------- where he is ----------
   home is the middle of the frame across, HEAD_Y down. one: the house size
   in the middle of the frame, then the jump up to S1_Y and the card comes
   in under him. two to four: small on the phone's corner, riding its scale.
   five: home. the exits are a shrink and a fade where he stands and the
   entrances a spring and a fade in the same place, post30's way under
   subtitles. */
const R_FULL = HEAD.plate.s / 2 * (SIZE / GRID);
const HOME = { x: VW / 2, y: HEAD_Y };
const R_SMALL = R_FULL * SMALL.s;
const UNDER = { x: VW / 2, y: S1_Y };
const START = { x: VW / 2, y: START_Y };
function cornerAt(t) {
  const sc = phoneAt(t).sc;
  const c = onPhone(CORNER.x, CORNER.y, sc);
  return { dx: +(c.x - HOME.x).toFixed(3), dy: +(c.y - HOME.y).toFixed(3), s: +(SMALL.s * sc).toFixed(5) };
}
function placeAt(t) {
  const c0 = { dx: START.x - HOME.x, dy: START.y - HOME.y };
  const c1 = { dx: UNDER.x - HOME.x, dy: UNDER.y - HOME.y };
  if (t < JUMP.at) return { ...c0, s: 1, rot: 0, on: 1, o: 1 };
  if (t < JUMP.at + JUMP.for) { const p = RISE(span(t, JUMP.at, JUMP.at + JUMP.for)); return { dx: c1.dx, dy: +lerp(c0.dy, c1.dy, p).toFixed(3), s: 1, rot: 0, on: 1, o: 1 }; }
  if (t < OUT1.at) return { ...c1, s: 1, rot: 0, on: 1, o: 1 };
  if (t < OUT1.at + EXIT.for) { const p = span(t, OUT1.at, OUT1.at + EXIT.for); return { ...c1, s: +lerp(1, EXIT.to, EASE_IN(p)).toFixed(5), rot: 0, on: 1, o: +(1 - span(p, 0.25, 1)).toFixed(4) }; }
  if (t < IN1.at) return { ...c1, s: EXIT.to, rot: 0, on: 0, o: 0 };
  const c = cornerAt(t);
  if (t < IN1.at + SPRING.for) return { dx: c.dx, dy: c.dy, s: +lerp(c.s * EXIT.to, c.s, RISE(span(t, IN1.at, IN1.at + SPRING.for))).toFixed(5), rot: 0, on: 1, o: +span(t, IN1.at, IN1.at + 0.15).toFixed(4) };
  if (t < OUT2.at) return { dx: c.dx, dy: c.dy, s: c.s, rot: 0, on: 1, o: 1 };
  if (t < OUT2.at + EXIT.for) { const p = span(t, OUT2.at, OUT2.at + EXIT.for); return { dx: c.dx, dy: c.dy, s: +lerp(c.s, c.s * EXIT.to, EASE_IN(p)).toFixed(5), rot: 0, on: 1, o: +(1 - span(p, 0.25, 1)).toFixed(4) }; }
  if (t < IN2.at) return { dx: 0, dy: 0, s: EXIT.to, rot: 0, on: 0, o: 0 };
  if (t < IN2.at + SPRING.for) return { dx: 0, dy: 0, s: +lerp(EXIT.to, 1, RISE(span(t, IN2.at, IN2.at + SPRING.for))).toFixed(5), rot: 0, on: 1, o: +span(t, IN2.at, IN2.at + 0.15).toFixed(4) };
  return { dx: 0, dy: 0, s: 1, rot: 0, on: 1, o: 1 };
}
const isHome = t => t >= IN2.at + SPRING.for;
/* the eyes: the look up in one, in over its window and out over the exit;
   the look at the phone from the corner, in on the landing and sliding to
   the lens in four */
function lookAt(t) {
  const up = LOOK1.up * EASE(span(t, LOOK1.at, LOOK1.at + LOOK1.for)) * (1 - EASE(span(t, OUT1.at, OUT1.at + LOOK1.outFor)));
  const at = EASE(span(t, LOOK2.at, LOOK2.at + LOOK2.inFor)) * (1 - EASE(span(t, EYES.at, EYES.at + EYES.for))) * (t < OUT2.at + EXIT.for ? 1 : 0);
  return { x: +(LOOK2.x * at).toFixed(4), y: +(up + LOOK2.y * at).toFixed(4) };
}
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const P = placeAt(t);
  f.card = {
    ...f.card,
    x: +(f.card.x + P.dx).toFixed(4),
    y: +(f.card.y + P.dy).toFixed(4),
    rot: +(f.card.rot + P.rot).toFixed(4),
    sx: +(f.card.sx * P.s).toFixed(5),
    sy: +(f.card.sy * P.s).toFixed(5),
  };
  const look = lookAt(t);
  if (look.x || look.y) f.eyes = f.eyes.map(e => ({ ...e, x: +(e.x + look.x).toFixed(4), y: +(e.y + look.y).toFixed(4) }));
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}
/* how far the eye ink is outside the head silhouette on a composed frame, the
   module's own measure, in grid units; negative is inside */
function eyeInk(plan, fr) {
  let outside = -Infinity;
  for (let k = 0; k < 2; k++) {
    const e = fr.eyes[k], cx = EYE_CX[k], cy = HEAD.eye.cy;
    const hw = HEAD.eye.w / 2 * Math.abs(e.sx), hh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) outside = Math.max(outside, headSD(cx + e.x + sx2 * hw, cy + e.y + sy2 * hh, plan));
  }
  return outside;
}

/* ---------- the pointer ----------
   post30's: a list of keys on the clip's clock, each a place inside the
   phone's screen named after the element it is over, resolved against the
   page's own rects on the frame it is drawn. between keys it moves on the
   site's ease. */
function cursorAt(t, R) {
  const K = CUR.keys;
  if (!K.length || t < K[0].t) return { o: 0, x: 0, y: 0, sc: 1 };
  const P = k => { const r = (R && R[k.at[0]]) || { cx: 0, cy: 0 }; return { x: r.cx + k.at[1], y: r.cy + k.at[2] }; };
  let a = K[0], b = null;
  for (let i = 0; i < K.length; i++) { if (K[i].t <= t) a = K[i]; else { b = K[i]; break; } }
  let x, y, o;
  if (!b) { const p = P(a); x = p.x; y = p.y; o = a.o; }
  else {
    const pa = P(a), pb = P(b), q = EASE(span(t, a.t, b.t)), lin = span(t, a.t, b.t);
    x = lerp(pa.x, pb.x, q); y = lerp(pa.y, pb.y, q); o = lerp(a.o, b.o, lin);
  }
  let sc = 1;
  for (const at of CUR.presses) {
    const d = t - at;
    if (d < 0 || d > 0.30) continue;
    sc = d < 0.08 ? 1 - 0.18 * EASE(d / 0.08) : 1 - 0.18 * (1 - POP((d - 0.08) / 0.22));
  }
  return { o: +o.toFixed(4), x: +x.toFixed(2), y: +y.toFixed(2), sc: +sc.toFixed(4) };
}

/* ---------- the typing, and the fog ----------
   the second link goes into the field letter by letter at TYPE.cps from
   TYPE.from; the field's value on a frame is the prefix typed by then. the
   fog in the field is one puff per letter past FOG.shown, popping the frame
   its letter lands, on a band of blur from the last readable letter to the
   last typed one. the fog in the page's address line is the same on the
   host's letters, measured off the page's own text on the frame. */
function typedAt(t) {
  if (t < TYPE.from) return '';
  const n = Math.min(FOG.real.length, Math.floor((t - TYPE.from) * TYPE.cps + 1e-6));
  return FOG.real.slice(0, n);
}
const puffPop = (t, at) => ({ o: +span(t, at, at + 0.08).toFixed(4), sc: +lerp(FOG.popFrom, 1, POP(span(t, at, at + FOG.popFor))).toFixed(4) });
function fieldFogAt(t, S) {
  const off = { on: 0, x: 0, y: 0, w: 0, h: 0 };
  const puffs = Array.from({ length: FOG.n }, () => ({ o: 0, sc: 1, x: 0, y: 0 }));
  if (!S || !S.field || t < TYPE.from) return { band: off, puffs };
  const n = typedAt(t).length;
  const W = S.field.widths;
  if (n <= FOG.shown.length || !W || W.length <= n) return { band: off, puffs };
  const h = FOG.puff;
  for (let i = FOG.shown.length; i < n; i++) {
    const at = TYPE.from + (i + 1) / TYPE.cps;
    const p = puffPop(t, at);
    puffs[i - FOG.shown.length] = { ...p, x: +(S.field.x + (W[i] + W[i + 1]) / 2).toFixed(2), y: +S.field.cy.toFixed(2) };
  }
  return { band: { on: 1, x: +(S.field.x + W[FOG.shown.length] - 2).toFixed(2), y: +(S.field.cy - h / 2).toFixed(2), w: +(W[n] - W[FOG.shown.length] + 4).toFixed(2), h }, puffs };
}
const TERM_SEEN = [];
function termFogAt(t, S) {
  const bands = [{ on: 0, x: 0, y: 0, w: 0, h: 0 }, { on: 0, x: 0, y: 0, w: 0, h: 0 }];
  const puffs = Array.from({ length: FOG.n }, () => ({ o: 0, sc: 1, x: 0, y: 0 }));
  if (!S || !S.host || t < TYPE.from) return { bands, puffs };
  const H = S.host;
  for (let i = 0; i < H.chars.length && i < FOG.n; i++) {
    if (TERM_SEEN[i] == null) TERM_SEEN[i] = t;
    const c = H.chars[i];
    puffs[i] = { ...puffPop(t, TERM_SEEN[i]), x: +(c.x + c.w / 2).toFixed(2), y: +(c.y + c.h / 2).toFixed(2) };
  }
  for (let k = 0; k < H.rects.length && k < 2; k++) {
    const r = H.rects[k];
    bands[k] = { on: 1, x: +(r.x - 2).toFixed(2), y: +(r.y + r.h / 2 - FOG.puff / 2).toFixed(2), w: +(r.w + 4).toFixed(2), h: FOG.puff };
  }
  return { bands, puffs };
}

/* ---------- the subtitles, on the clock ---------- */
const CARDS = [];
function subAt(t) {
  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i];
    if (t < c.from || t >= c.to) continue;
    const o = Math.min(1, span(t, c.from, c.from + ST.fadeIn), 1 - span(t, c.to - ST.fadeOut, c.to));
    return { o: +o.toFixed(4), y: +(ST.rise * (1 - EASE(span(t, c.from, c.from + ST.fadeIn)))).toFixed(3), i, slot: c.slot };
  }
  return { o: 0, y: 0, i: -1, slot: 'high' };
}

/* ---------- what one frame is ---------- */
function frameAt(t, f, S) {
  const P = placeAt(t);
  const R = S && S.rects;
  /* one: the card slides in from below once he has jumped, then fades as the link lifts out */
  const bin = GLIDE(span(t, NOTE.in.at, NOTE.in.at + NOTE.in.for));
  const bout = span(t, SC[1], SC[1] + NOTE.out.for);
  const bz = span(t, NOTE.buzz.at, NOTE.buzz.at + NOTE.buzz.for);
  const buzz = bz > 0 && bz < 1 ? NOTE.buzz.amp * Math.sin(2 * Math.PI * NOTE.buzz.hz * (t - NOTE.buzz.at)) * (1 - bz) * (1 - bz) : 0;
  const bub = { o: +(span(t, NOTE.in.at, NOTE.in.at + 0.10) * (1 - bout)).toFixed(4), x: +buzz.toFixed(3), y: +(NOTE.in.from * (1 - bin)).toFixed(3) };
  /* two: the link flies from the bubble into the field */
  const flyP = span(t, FLY.at, FLY.at + FLY.for);
  const ph = phoneAt(t);
  /* the fly sits at its start before it goes and at its end after, unseen,
     so nothing jumps on the frame it is born */
  let fly = { o: 0, x: 0, y: 0, k: 1 };
  if (S && S.link && S.field) {
    const to = pageToStage(S.field.x, S.field.cy, ph.sc);
    const e = EASE(flyP);
    const k = lerp(1, S.field.font * PHONE.scale * ph.sc / NOTE.linkSize, e);
    fly = { o: +(t >= FLY.at && flyP < 1 ? 1 : 0).toFixed(4), x: +lerp(S.link.x, to.x, e).toFixed(3), y: +lerp(S.link.cy, to.y, e).toFixed(3), k: +k.toFixed(4) };
  }
  const bl = { o: t < FLY.at ? 1 : 0 };
  /* the red pulse on danger: one swell and fall, on his centre */
  const pp = span(t, PULSE.at, PULSE.at + PULSE.for);
  const rg = { o: +(pp > 0 && pp < 1 ? PULSE.peak * Math.sin(Math.PI * pp) : 0).toFixed(4), x: +(HOME.x + P.dx).toFixed(2), y: +(HOME.y + P.dy).toFixed(2), s: P.s };
  /* three: the ring on the lookalike line, and the line under the phone */
  const rp = span(t, RING.at, RING.at + RING.for);
  const lr = R && R.lines && R.lines[RING.line];
  const ring = { o: +(rp > 0 && rp < 1 && lr ? Math.min(1, span(rp, 0, 0.15), 1 - span(rp, 0.72, 1)) : 0).toFixed(4),
    x: lr ? +(lr.x - RING.pad).toFixed(2) : 0, y: lr ? +(lr.y - RING.pad).toFixed(2) : 0, w: lr ? +(lr.w + 2 * RING.pad).toFixed(2) : 0, h: lr ? +(lr.h + 2 * RING.pad).toFixed(2) : 0 };
  const c3p = span(t, CAP3.at, CAP3.at + CAP.for);
  const cap3 = { o: +(EASE(c3p) * (1 - span(t, CAP3.out, CAP3.out + CAP.outFor))).toFixed(4), y: +(8 * (1 - EASE(c3p))).toFixed(3) };
  /* four: the line under the phone, gone with the phone */
  const c4p = span(t, CAP4.at, CAP4.at + CAP.for);
  const cap4 = { o: +(EASE(c4p) * (1 - span(t, PHONE_OUT.at, PHONE_OUT.at + PHONE_OUT.for))).toFixed(4), y: +(8 * (1 - EASE(c4p))).toFixed(3) };
  /* five: the wordmark and the address */
  const wmP = span(t, WM2.at, WM2.at + WM2.for);
  const adP = span(t, ADDR_IN.at, ADDR_IN.at + ADDR_IN.for);
  return {
    t: +t.toFixed(4), f,
    mo: +(P.on * P.o).toFixed(4),
    bub, bl, fly, phone: ph, rg, ring, cap3, cap4,
    cur: cursorAt(t, R),
    fogF: fieldFogAt(t, S),
    fogT: termFogAt(t, S),
    subt: subAt(t),
    wm: { o: t >= WM2.at ? 1 : 0, sc: +(1 + (1 - EASE(wmP)) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
    addr: { o: +EASE(adP).toFixed(4), y: +(8 * (1 - EASE(adP))).toFixed(3) },
  };
}

/* ---------- the events inside the phone ----------
   each fires once, on the frame the clock crosses it. the field's value is
   set every frame it changes, which is the typing. */
function eventsAt(t0, t1) {
  const out = [];
  const at = (tt, kind, arg) => { if (tt > t0 && tt <= t1 + 1e-9) out.push({ kind, arg }); };
  at(FLY.at + FLY.for, 'val', NOTE.link);
  at(PRESS1.at, 'press');
  at(AGAIN.at, 'again');
  const v0 = typedAt(t0), v1 = typedAt(t1);
  if (t1 >= TYPE.from && v1 !== v0) out.push({ kind: 'val', arg: v1 });
  at(PRESS2.at, 'press');
  return out;
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post36</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@400;600&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
/* ==== this clip's own css starts here ==== */
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --cap:"Nunito",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg)}

${mcss}
/* over the phone: the module puts him at z 4, the phone is z 6, the red
   pulse sits between */
#m-zone{opacity:var(--m-o,1);z-index:8}
.rg{position:absolute;left:0;top:0;width:${Math.round(R_FULL * 5.2)}px;height:${Math.round(R_FULL * 5.2)}px;margin:${-Math.round(R_FULL * 2.6)}px 0 0 ${-Math.round(R_FULL * 2.6)}px;border-radius:50%;z-index:7;opacity:0;pointer-events:none;
  background:radial-gradient(circle,color-mix(in srgb,var(--red) 62%,transparent) 0%,color-mix(in srgb,var(--red) 28%,transparent) 32%,transparent 66%);will-change:transform,opacity}

/* ---- one: the notification, a phone's message card ---- */
.bub{position:absolute;left:${NOTE.left}px;top:${NOTE.top}px;width:${NOTE.w}px;padding:${NOTE.pad}px ${NOTE.padX}px;z-index:3;
  background:${NOTE.colors.card};border-radius:${NOTE.radius}px;box-shadow:${NOTE.shadow};
  font-family:var(--cap);font-weight:400;font-size:${NOTE.size}px;line-height:${NOTE.lh};color:#ffffff;text-align:left;opacity:0;will-change:transform,opacity}
.bub .hd{display:flex;align-items:center;gap:${NOTE.gap}px;margin-bottom:${NOTE.gap - 2}px}
.bub .av{flex:0 0 auto;width:${NOTE.avatar}px;height:${NOTE.avatar}px;border-radius:50%;background:${NOTE.colors.avatar};color:#ffffff;
  display:flex;align-items:center;justify-content:center;font-weight:600;font-size:${Math.round(NOTE.avatar * 0.46)}px;line-height:1}
.bub .nm{flex:1 1 auto;font-weight:700;font-size:${NOTE.nameSize}px;line-height:1.2;white-space:nowrap}
.bub .tm{flex:0 0 auto;font-weight:400;font-size:${NOTE.timeSize}px;line-height:1.2;color:var(--muted);white-space:nowrap}
.bub .bt{display:block;white-space:nowrap}
.bub .bl{display:inline-block;margin-top:${NOTE.linkGap}px;font-family:var(--mono);font-weight:500;font-size:${NOTE.linkSize}px;line-height:1.4;letter-spacing:.01em;
  color:${NOTE.colors.link};text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
/* the link on its way: the same text, the card's mono and blue, scaled onto the field */
.fly{position:absolute;left:0;top:0;z-index:9;font-family:var(--mono);font-weight:500;font-size:${NOTE.linkSize}px;line-height:1;letter-spacing:.01em;color:${NOTE.colors.link};white-space:nowrap;
  transform-origin:0 50%;opacity:0;will-change:transform,opacity}

/* ---- two to four: the phone ---- */
.phone{position:absolute;left:${PHONE.left}px;top:${PHONE.top}px;width:${PHONE.w}px;height:${PHONE.h}px;
  border-radius:${PHONE.radius}px;background:var(--field);border:1px solid var(--line);
  transform-origin:50% 50%;opacity:0;z-index:6;will-change:transform,opacity}
.screen{position:absolute;left:${PHONE.bezel - 1}px;top:${PHONE.bezel - 1}px;width:${PHONE.sw}px;height:${PHONE.sh}px;
  border-radius:${PHONE.radius - PHONE.bezel}px;overflow:hidden;background:#06070a}
.screen iframe{position:absolute;left:0;top:0;width:${PHONE.vw}px;height:${PHONE.vh}px;border:0;background:#06070a;
  transform:scale(${PHONE.scale});transform-origin:0 0}
.ov{position:absolute;left:0;top:0;width:${PHONE.vw}px;height:${PHONE.vh}px;transform:scale(${PHONE.scale});transform-origin:0 0;pointer-events:none}
.cur{position:absolute;left:0;top:0;width:${CUR.size}px;height:${CUR.size}px;opacity:0;transform-origin:2px 2px;will-change:transform,opacity;z-index:3}
.cur svg{display:block;width:100%;height:100%}
.cur .arrow{fill:var(--face);stroke:var(--eye);stroke-width:1.4;stroke-linejoin:round}
/* the fog: a band of blur under the letters, a puff of the page's muted grey
   on each. nothing else is drawn there. */
.band{position:absolute;left:0;top:0;border-radius:${FOG.puff / 2}px;opacity:0;-webkit-backdrop-filter:blur(${FOG.blur}px);backdrop-filter:blur(${FOG.blur}px);
  background:color-mix(in srgb,var(--muted) 30%,transparent);will-change:transform,opacity}
.puff{position:absolute;left:0;top:0;width:${FOG.puff}px;height:${FOG.puff}px;margin:${-FOG.puff / 2}px 0 0 ${-FOG.puff / 2}px;border-radius:50%;opacity:0;z-index:2;
  background:radial-gradient(circle,color-mix(in srgb,var(--muted) ${Math.round(FOG.tint * 100)}%,transparent) 0%,color-mix(in srgb,var(--muted) ${Math.round(FOG.tint * 72)}%,transparent) 42%,transparent 72%);
  will-change:transform,opacity}

/* the ring on the lookalike line: the page's own red, one soft edge */
.ring{position:absolute;left:0;top:0;border-radius:${RING.radius}px;opacity:0;pointer-events:none;z-index:1;
  box-shadow:0 0 0 1.5px color-mix(in srgb,var(--red) 70%,transparent),0 0 14px 2px color-mix(in srgb,var(--red) 30%,transparent);will-change:transform,opacity}

/* ---- three and four: the line under the phone, one slot, two lines in turn ---- */
.cap{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${CAP.top}px;text-align:center;z-index:8;
  font-family:var(--cap);font-weight:600;font-size:${CAP.size}px;line-height:1.25;color:var(--fg);white-space:nowrap;opacity:0;will-change:transform,opacity}

/* ---- the subtitles: one block, two slots ---- */
.subt{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ST.high}px;text-align:center;z-index:10;
  font-family:var(--cap);font-weight:${ST.weight};font-size:${ST.size}px;line-height:${ST.lh};color:var(--face);white-space:pre;opacity:0;will-change:transform,opacity}
.subt[data-slot=low]{top:${ST.low}px}
.subt .sl{display:block}

/* ---- five: the wordmark, post23's, and the address ---- */
.wm{position:absolute;left:50%;top:${WM.top}px;transform:translateX(-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.addr{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ADDR.top}px;text-align:center;
  font-family:var(--mono);font-weight:500;font-size:${ADDR.size}px;letter-spacing:.08em;line-height:1.3;color:var(--muted);white-space:nowrap;opacity:0;z-index:8}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="rg" id="rg" aria-hidden="true"></div>
  <div class="bub" id="bub"><div class="hd"><span class="av" id="av">${NOTE.letter}</span><span class="nm" id="nm">${NOTE.name}</span><span class="tm" id="tm">${NOTE.time}</span></div><span class="bt">${NOTE.text}</span><span class="bl" id="bl">${NOTE.link}</span></div>
  <div class="fly" id="fly">${NOTE.link}</div>
  <div class="phone" id="phone">
    <div class="screen">
      <iframe id="fr" src="/tools/check/" scrolling="no"></iframe>
      <div class="ov">
        <div class="band" id="bandF"></div>
        <div class="band" id="bandT0"></div><div class="band" id="bandT1"></div>
        ${Array.from({ length: FOG.n }, (_, i) => '<i class="puff" id="pf' + i + '"></i><i class="puff" id="pt' + i + '"></i>').join('')}
        <div class="ring" id="ring"></div>
        <div class="cur" id="cur"><svg viewBox="0 0 22 22" aria-hidden="true">
          <path class="arrow" d="M2 2l0 16.5 4.6-4.2 3.2 6.8 3-1.4-3.2-6.6 6.4-.4z"/>
        </svg></div>
      </div>
    </div>
  </div>
  <div class="cap" id="cap3">${CAP3.text}</div>
  <div class="cap" id="cap4">${CAP4.text}</div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="addr" id="addr">${ADDR.text}</div>
  <div class="subt" id="subt"><span class="sl" id="sl0"></span><span class="sl" id="sl1"></span></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P36 = ${JSON.stringify({ VW, VH, DSF, WM, N: FOG.n, SUBS: SUBTITLES.map(c => c.lines) })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 ${NOTE.size}px Nunito'), document.fonts.load('700 ${NOTE.nameSize}px Nunito'), document.fonts.load('600 ${CAP.size}px Nunito'), document.fonts.load('${ST.weight} ${ST.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p36.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P36;
  const stage = document.getElementById('stage');
  const g = id => document.getElementById(id);
  const bub = g('bub'), bl = g('bl'), fly = g('fly'), phone = g('phone'), cur = g('cur'), rg = g('rg');
  const bandF = g('bandF'), bandT = [g('bandT0'), g('bandT1')];
  const pf = [], pt = [];
  for (let i = 0; i < P.N; i++) { pf.push(g('pf' + i)); pt.push(g('pt' + i)); }
  const ring = g('ring'), cap3 = g('cap3'), cap4 = g('cap4');
  const wm = g('wm'), addr = g('addr'), subt = g('subt');
  const sls = [g('sl0'), g('sl1')];
  let lastSub = null;
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  const rg2 = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  const band = (el, b) => {
    el.style.opacity = b.on ? '1' : '0';
    if (b.on) { el.style.width = b.w.toFixed(2) + 'px'; el.style.height = b.h.toFixed(2) + 'px'; el.style.transform = 'translate(' + b.x.toFixed(2) + 'px,' + b.y.toFixed(2) + 'px)'; }
  };
  const puff = (el, p) => {
    el.style.opacity = p.o.toFixed(4);
    el.style.transform = 'translate(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px) scale(' + p.sc.toFixed(4) + ')';
  };
  window.__p36 = {
    fit() {
      const probe = wm;
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      /* the bubble whole, at rest, and where its link sits: the fly starts there */
      bub.style.opacity = '1'; bub.style.transform = 'none';
      const br = bub.getBoundingClientRect(), lr = rg2(bl);
      bub.style.opacity = '0';
      return { wm: +ws.toFixed(2), bub: { top: +br.top.toFixed(2), bottom: +br.bottom.toFixed(2), h: +br.height.toFixed(2) }, link: { x: +lr.left.toFixed(2), cy: +((lr.top + lr.bottom) / 2).toFixed(2), w: +lr.width.toFixed(2) } };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      bub.style.opacity = '1'; bub.style.transform = 'none';
      const out = {
        wm: { ...box(wm.getBoundingClientRect(), d), widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font },
        addr: { ...box(rg2(addr), d), font: capOf(addr).font },
        bub: box(bub.getBoundingClientRect(), d),
        bubText: { ...box(rg2(bub.querySelector('.bt')), d), font: capOf(bub.querySelector('.bt')).font },
        name: { ...box(rg2(g('nm')), d), font: capOf(g('nm')).font },
        time: { ...box(rg2(g('tm')), d), font: capOf(g('tm')).font },
        avatar: { ...box(g('av').getBoundingClientRect(), d), font: capOf(g('av')).font, marks: bub.querySelectorAll('img,svg,picture').length },
        link: { ...box(rg2(bl), d), font: capOf(bl).font },
        phone: box(phone.getBoundingClientRect(), d),
        cap3: { ...box(rg2(cap3), d), font: capOf(cap3).font },
        cap4: { ...box(rg2(cap4), d), font: capOf(cap4).font },
        subs: P.SUBS.map(lines => {
          for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
          sls[1].style.display = lines[1] ? 'block' : 'none';
          let widest = 0;
          for (let k = 0; k < lines.length; k++) widest = Math.max(widest, rg2(sls[k]).width);
          const b = subt.getBoundingClientRect();
          return { widestPx: +(widest * d).toFixed(1), h: +(b.height * d).toFixed(1), font: capOf(subt).font };
        }),
      };
      bub.style.opacity = '0';
      return out;
    },
    /* every scene piece's painted opacity, every ancestor multiplied in,
       post34's census: the end card wants zeros */
    census() {
      const eff = el => { let o = 1; for (let n = el; n && n !== document.body; n = n.parentElement) { const v = getComputedStyle(n); o *= parseFloat(v.opacity); if (v.visibility === 'hidden' || v.display === 'none') o = 0; } return +o.toFixed(4); };
      return { bub: eff(bub), fly: eff(fly), phone: eff(phone), cap3: eff(cap3), cap4: eff(cap4), rg: eff(rg), wm: eff(wm), addr: eff(addr), him: eff(document.getElementById('m-zone')) };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      bub.style.opacity = o.bub.o.toFixed(4);
      bub.style.transform = 'translate(' + o.bub.x.toFixed(3) + 'px,' + o.bub.y.toFixed(3) + 'px)';
      bub.style.visibility = o.bub.o < 0.004 ? 'hidden' : 'visible';
      bl.style.opacity = o.bl.o.toFixed(4);
      fly.style.opacity = o.fly.o.toFixed(4);
      fly.style.transform = 'translate(' + o.fly.x.toFixed(3) + 'px,' + (o.fly.y - 7.5).toFixed(3) + 'px) scale(' + o.fly.k.toFixed(4) + ')';
      rg.style.opacity = o.rg.o.toFixed(4);
      rg.style.transform = 'translate(' + o.rg.x.toFixed(2) + 'px,' + o.rg.y.toFixed(2) + 'px) scale(' + o.rg.s.toFixed(4) + ')';
      phone.style.opacity = o.phone.o.toFixed(4);
      phone.style.transform = 'scale(' + o.phone.sc.toFixed(5) + ')';
      phone.style.visibility = o.phone.o < 0.004 ? 'hidden' : 'visible';
      cur.style.opacity = o.cur.o.toFixed(4);
      cur.style.transform = 'translate(' + (o.cur.x - 2).toFixed(2) + 'px,' + (o.cur.y - 2).toFixed(2) + 'px) scale(' + o.cur.sc.toFixed(4) + ')';
      band(bandF, o.fogF.band);
      for (let i = 0; i < P.N; i++) puff(pf[i], o.fogF.puffs[i]);
      for (let k = 0; k < 2; k++) band(bandT[k], o.fogT.bands[k]);
      for (let i = 0; i < P.N; i++) puff(pt[i], o.fogT.puffs[i]);
      ring.style.opacity = o.ring.o.toFixed(4);
      if (o.ring.o > 0) { ring.style.width = o.ring.w + 'px'; ring.style.height = o.ring.h + 'px'; ring.style.transform = 'translate(' + o.ring.x + 'px,' + o.ring.y + 'px)'; }
      cap3.style.opacity = o.cap3.o.toFixed(4);
      cap3.style.transform = 'translateY(' + o.cap3.y.toFixed(3) + 'px)';
      cap4.style.opacity = o.cap4.o.toFixed(4);
      cap4.style.transform = 'translateY(' + o.cap4.y.toFixed(3) + 'px)';
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      addr.style.opacity = o.addr.o.toFixed(4);
      addr.style.transform = 'translateY(' + o.addr.y.toFixed(3) + 'px)';
      const sk = o.subt.i + ':' + o.subt.slot;
      if (sk !== lastSub) {
        lastSub = sk;
        const lines = o.subt.i < 0 ? [] : P.SUBS[o.subt.i];
        for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
        sls[1].style.display = lines[1] ? 'block' : 'none';
        subt.setAttribute('data-slot', o.subt.slot);
      }
      subt.style.opacity = o.subt.o.toFixed(4);
      subt.style.transform = 'translateY(' + o.subt.y.toFixed(3) + 'px)';
    },
  };
}

/* ---------- the checker's page, taken over ----------
   runs in the frame whose path is the checker, before the page's own
   script. the theme key is set so the page boots dark, and every animation
   and transition in it is paused and set to the clip's clock on every tick.
   the page's own rAF loop is driven through `__dmRaf`. everything else is
   the page's own. */
function checkInit() {
  if (!/\/check\/?$/.test(location.pathname)) return;
  try { localStorage.setItem('bt-theme', 'dark'); } catch (e) { }
  /* only the tool: the language switch, the home link, the socials and the
     theme toggle are hidden. the heading and the honest line stay. */
  document.addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = '.langs,.more,.socials,.theme{display:none!important}';
    document.head.appendChild(st);
  });
  const anims = new Map();
  const q = s => document.querySelector(s);
  const rect = el => { const r = el.getBoundingClientRect(); return { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), cx: +(r.left + r.width / 2).toFixed(2), cy: +(r.top + r.height / 2).toFixed(2) }; };
  const tickAnims = t => {
    for (const a of document.getAnimations()) {
      let rec = anims.get(a);
      if (!rec) { rec = { t0: t }; anims.set(a, rec); try { a.pause(); } catch (e) { } }
      try { a.currentTime = Math.max(0, (t - rec.t0) * 1000); } catch (e) { }
    }
  };
  let cv = null;
  const textW = (el, s) => { if (!cv) cv = document.createElement('canvas').getContext('2d'); cv.font = getComputedStyle(el).font; return cv.measureText(s).width; };
  /* the first line's host, letter by letter, off the page's own text nodes:
     the caret's node is skipped, and the text may be one node while typing
     or three once the page has finished the line */
  const hostFog = (shown, host) => {
    const li = q('.tb .ln'); if (!li) return null;
    const tx = li.querySelector('.tx'); if (!tx) return null;
    const nodes = [];
    const walk = n => { for (const c of n.childNodes) { if (c.nodeType === 3) nodes.push(c); else if (c.nodeType === 1 && !c.classList.contains('cur')) walk(c); } };
    walk(tx);
    const s = nodes.map(n => n.data).join('');
    const p = s.lastIndexOf(shown);
    if (p < 0) return null;
    const a = p + shown.length, b = Math.min(s.length, p + host.length);
    if (b <= a) return null;
    const at = k => { let off = 0; for (const n of nodes) { if (k <= off + n.data.length) return [n, k - off]; off += n.data.length; } return null; };
    const chars = [];
    for (let k = a; k < b; k++) {
      const r = document.createRange(); const s0 = at(k), s1 = at(k + 1); if (!s0 || !s1) break;
      r.setStart(s0[0], s0[1]); r.setEnd(s1[0], s1[1]);
      const rr = r.getBoundingClientRect(); chars.push({ x: +rr.left.toFixed(2), y: +rr.top.toFixed(2), w: +rr.width.toFixed(2), h: +rr.height.toFixed(2) });
    }
    const r = document.createRange(); const s0 = at(a), s1 = at(b); r.setStart(s0[0], s0[1]); r.setEnd(s1[0], s1[1]);
    const rects = [...r.getClientRects()].map(rr => ({ x: +rr.left.toFixed(2), y: +rr.top.toFixed(2), w: +rr.width.toFixed(2), h: +rr.height.toFixed(2) })).filter(rr => rr.w > 0.5);
    return { chars, rects, text: s.slice(a, b) };
  };
  window.__check = {
    ready() {
      if (!this.kicked) { this.kicked = true; Promise.all(['400 14px "Space Grotesk"', '500 14px "Space Grotesk"'].map(f => document.fonts.load(f))).catch(() => { }); }
      return document.readyState === 'complete' && document.fonts.status === 'loaded'
        && document.fonts.check('400 14px "Space Grotesk"') && document.fonts.check('500 14px "Space Grotesk"');
    },
    step(o) {
      for (const ev of o.events) {
        if (ev.kind === 'val') q('.in').value = ev.arg;
        else if (ev.kind === 'press') q('.btn').click();
        else if (ev.kind === 'again') q('.again').click();
      }
      for (const now of o.nows) { window.__dmRaf(now); void document.body.offsetHeight; }
      tickAnims(o.t);
      return this.state(o.fog);
    },
    state(fog) {
      const inEl = q('.in'), btn = q('.btn'), again = q('.again'), term = q('.term'), res = q('.res'), pill = q('.pill'), m = q('.mascot'), tb = q('.tb');
      const lines = [...tb.querySelectorAll('.ln')].map(li => ({ cls: li.className.replace(/^ln\s*/, '').trim(), text: li.textContent.replace(/\u258a/g, '') }));
      const ir = rect(inEl), cs = getComputedStyle(inEl);
      const val = inEl.value;
      /* the real link's letters, where each would sit in the field: measured
         on the link itself so the fog is a function of the clock, not of what
         the field held a frame ago */
      const real = fog ? fog.real : val;
      const widths = [];
      for (let k = 0; k <= real.length; k++) widths.push(+textW(inEl, real.slice(0, k)).toFixed(2));
      return {
        lang: document.documentElement.lang,
        theme: document.documentElement.getAttribute('data-theme'),
        scrollTop: +document.scrollingElement.scrollTop.toFixed(2),
        val, lines, resOn: res.classList.contains('on'),
        pill: { cls: pill.className.replace(/^pill\s*/, '').trim(), word: pill.querySelector('b').textContent, why: pill.querySelector('span').textContent },
        ex: +(m.style.getPropertyValue('--ex') || 0), ey: +(m.style.getPropertyValue('--ey') || 0), blink: +(m.style.getPropertyValue('--blink') || 1),
        field: { x: +(ir.x + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft)).toFixed(2), cy: ir.cy, font: parseFloat(cs.fontSize), val, widths },
        host: fog && fog.on ? hostFog(fog.shown, fog.host) : null,
        rects: { in: ir, btn: rect(btn), again: rect(again), term: rect(term), res: rect(res), pill: rect(pill), mascot: rect(m), lines: [...tb.querySelectorAll('.ln')].map(rect) },
        chrome: ['.langs', '.more', '.bar .socials', '.foot .socials', '.theme'].map(sel => { const el = q(sel); return el ? rect(el).w : 0; }),
      };
    },
  };
}

function serve(html) {
  const files = { '/tools/check/': path.join(ROOT, 'tools', 'check', 'index.html') };
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (files[p]) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(files[p]));
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}
function injected() {
  let seed = 0x51d0c3a7;
  Math.random = function () { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0; return (seed >>> 0) / 4294967296; };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

/* ---------- render ---------- */
async function render(plan) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio',
      '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  await page.evaluateOnNewDocument(checkInit);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  const checkFrame = () => page.frames().find(fr => { try { return new URL(fr.url()).pathname === '/tools/check/'; } catch { return false; } });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    const fr = checkFrame();
    let all = ok && !!fr;
    if (all && !await fr.evaluate(() => !!(window.__check && window.__check.ready())).catch(() => false)) all = false;
    if (all) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  const FR = checkFrame();
  if (!FR) throw new Error('the checker page did not load');
  if (!await FR.evaluate(() => window.__check.ready())) {
    const why = await FR.evaluate(() => ({ ready: document.readyState, fonts: document.fonts.status, faces: [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status) }));
    throw new Error('the checker page is not ready, or its fonts did not load: ' + JSON.stringify(why));
  }
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['400 ' + NOTE.size + 'px "Nunito"', 'the card'], ['700 ' + NOTE.nameSize + 'px "Nunito"', 'the sender'], ['600 ' + CAP.size + 'px "Nunito"', 'the captions']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const measured = await page.evaluate(() => window.__p36.measure());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the wordmark: ' + measured.wm.widestPx + ' device px wide, caps ' + measured.wm.capPx + ', clear ' + measured.wm.left + ' / ' + measured.wm.top + ' / ' + measured.wm.right + ' / ' + measured.wm.bottom);
  console.log('  the card: ' + measured.bub.w + 'x' + measured.bub.h + ' device px, clear ' + measured.bub.left + ' / ' + measured.bub.top + ' / ' + measured.bub.right + ' / ' + measured.bub.bottom + ', the link at ' + built.link.x + ', ' + built.link.cy + ' css px, ' + built.link.w + ' wide');
  console.log('  the phone: ' + measured.phone.w + 'x' + measured.phone.h + ' device px, clear ' + measured.phone.left + ' / ' + measured.phone.top + ' / ' + measured.phone.right + ' / ' + measured.phone.bottom
    + ', the page at ' + PHONE.vw + 'x' + PHONE.vh + ' css px scaled ' + PHONE.scale);
  console.log('  the lines under the phone: ' + measured.cap3.w + ' and ' + measured.cap4.w + ' device px wide');
  for (const [i, c] of CARDS.entries()) console.log('  subtitle ' + (i + 1) + ' ' + c.from.toFixed(2) + ' to ' + c.to.toFixed(2) + ' ' + c.slot + ': ' + c.lines.join(' / ') + ', widest ' + measured.subs[i].widestPx + ' device px');

  /* the page, at rest, before anything happens in it */
  let S = await FR.evaluate(f => window.__check.state(f), { shown: FOG.hostShown, host: FOG.host, real: FOG.real, on: false });
  S.link = built.link;
  const rest = S;
  console.log('  the checker page: ' + S.lang + ' ' + S.theme + ', the field at ' + S.rects.in.y.toFixed(0) + '..' + (S.rects.in.y + S.rects.in.h).toFixed(0) + ', the button at ' + S.rects.btn.cx.toFixed(0) + ', ' + S.rects.btn.cy.toFixed(0) + ' of ' + PHONE.vw + 'x' + PHONE.vh + ' css px, the terminal ' + S.rects.term.h.toFixed(0) + ' tall');

  const put = async (t, f, S) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f, S);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p36.apply(fr), o);
    return { mf, o };
  };

  /* the head's worst clearance while he is home */
  let worst = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f / FPS;
    if (!isHome(t)) continue;
    const r = headRect(plan, compose(plan, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
  }

  /* the stills, taken on the frames themselves so the phone is what it was
     at that instant, not what it is at the end of the run */
  const STILLS = [
    [LAND1 + 0.45, 'a0-s1-the-card'],
    [RING.at + 0.40, 'a-s3-danger-ringed'],
    [TYPE.done + 0.05, 'b-s4-fog'],
    [PILL2.at + 0.60, 'c-s4-nothing-found'],
  ].map(([want, name]) => ({ f: Math.max(0, Math.min(N - 1, Math.round(want * FPS))), name, box: null }));

  const TICK = 1 / 60;
  let tickAt = 0;
  const observed = [];
  const sigs = [];
  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const t0 = idx === 0 ? -1 : (idx - 1) * (1 / (FPS * SUB));
      const { mf, o } = await put(t, f, S);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      const nows = [];
      while (tickAt <= t + 1e-9) { nows.push(+(tickAt * 1000).toFixed(3)); tickAt += TICK; }
      const step = { t, nows, events: eventsAt(t0, t), fog: { shown: FOG.hostShown, host: FOG.host, real: FOG.real, on: t >= TYPE.from } };
      const st = await FR.evaluate(s => window.__check.step(s), step);
      st.link = built.link;
      S = st;
      if (k === 0) observed.push({ t: +t.toFixed(4), ...strip(st), fogBox: fogBox(o, st) });
      /* the liveness signature sums its subframes, post28's rule */
      let s = o.mo * 7 + o.bub.o * 11 + o.bub.y * 13 + o.bub.x * 5 + o.ring.o * 3 + o.bl.o * 17 + o.fly.o * 19 + o.fly.x * 23 + o.fly.y * 29 + o.fly.k * 31
        + o.phone.o * 37 + o.phone.sc * 41 + o.rg.o * 43 + o.cap3.o * 47 + o.cap3.y * 53 + o.cap4.o * 61 + o.cap4.y * 67
        + o.cur.o * 71 + o.cur.x * 73 + o.cur.y * 79 + o.cur.sc * 83
        + o.subt.o * 251 + o.subt.i * 257 + o.subt.y * 263 + o.wm.o * 89 + o.wm.sc * 97 + o.wm.glow * 101 + o.addr.o * 103
        + o.fogF.band.on * o.fogF.band.w * 107;
      for (let i = 0; i < FOG.n; i++) s += o.fogF.puffs[i].o * (109 + i) + o.fogF.puffs[i].sc * (127 + i) + o.fogT.puffs[i].o * (139 + i) + o.fogT.puffs[i].sc * (151 + i);
      s += o.mo * (mf.card.x * 167 + mf.card.y * 173 + mf.card.rot * 179 + mf.card.sx * 181 + mf.card.sy * 191);
      for (let e = 0; e < 2; e++) s += o.mo * (mf.eyes[e].x * (193 + e) + mf.eyes[e].y * (197 + e) + mf.eyes[e].lid * (199 + e) + mf.eyes[e].sy * (211 + e));
      s += o.phone.o * (st.scrollTop * 223 + st.ex * 227 + st.ey * 229 + st.blink * 233 + st.lines.length * 239 + (st.resOn ? 241 : 0) + st.val.length * 251 + st.lines.reduce((a, l) => a + l.text.length, 0) * 3);
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (k + 1)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      if (k === 0) for (const sl of STILLS) if (sl.f === f) {
        const png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
        fs.writeFileSync(path.join(VERIFY, sl.name + '.png'), Buffer.from(png.data, 'base64'));
        sl.box = fogBox(o, st);
      }
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));
  const census = await page.evaluate(() => window.__p36.census());
  console.log('  the head, worst frame at home at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, measured, head: worst, sigs, frames: N, observed, rest: strip(rest), census, stills: STILLS };
  fs.writeFileSync(path.join(OUT, 'post36.json'), JSON.stringify(state, null, 2));
  return state;
}
const strip = s => ({ scrollTop: s.scrollTop, ex: s.ex, ey: s.ey, val: s.val, lines: s.lines, resOn: s.resOn, pill: s.pill, lang: s.lang, theme: s.theme, hostText: s.host ? s.host.text : null, hostChars: s.host ? s.host.chars.length : 0, chrome: s.chrome, rects: s.rects });
/* where the fog and the readable letters are on a frame, in device px: the
   field's fogged band, the field's readable prefix, and the page's own
   address line's fogged host */
function fogBox(o, st) {
  if (!o.fogF.band.on || !st.field) return null;
  const sc = o.phone.sc;
  const dev = (x, y) => { const p = pageToStage(x, y, sc); return { x: p.x * DSF, y: p.y * DSF }; };
  const W = st.field.widths, F = st.field, B = o.fogF.band;
  const a = dev(B.x + 2, F.cy - 7), b = dev(B.x + B.w - 2, F.cy + 7);
  const c = dev(F.x + W[0], F.cy - 7), d = dev(F.x + W[FOG.shown.length], F.cy + 7);
  let term = null;
  if (o.fogT.bands[0].on) { const r = o.fogT.bands[0]; const p = dev(r.x, r.y + 4), q = dev(r.x + r.w, r.y + r.h - 4); term = { x: p.x, y: p.y, w: q.x - p.x, h: q.y - p.y }; }
  return { fog: { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }, clear: { x: c.x, y: c.y, w: d.x - c.x, h: d.y - c.y }, term };
}
/* the luma of a box of a png, its mean and its spread, off ffmpeg's raw pixels */
function lumaOf(file, box) {
  const W = VW * DSF, H = VH * DSF;
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 });
  if (raw.length !== W * H) throw new Error(path.relative(ROOT, file) + ' decoded to ' + raw.length + ' bytes against ' + (W * H));
  const x0 = Math.max(0, Math.round(box.x)), y0 = Math.max(0, Math.round(box.y)), x1 = Math.min(W, Math.round(box.x + box.w)), y1 = Math.min(H, Math.round(box.y + box.h));
  let n = 0, s = 0, ss = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const v = raw[y * W + x]; n++; s += v; ss += v * v; }
  if (!n) return { n: 0, mean: 0, sd: 0 };
  const mean = s / n;
  return { n, mean: +mean.toFixed(1), sd: +Math.sqrt(Math.max(0, ss / n - mean * mean)).toFixed(1) };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post36-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  return out;
}
function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return { seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null, w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:\s*aac/.test(out) };
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

/* ---------- the read, and the clock floored by it ---------- */
const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const PCM = TAKES.map(t => t.pcm);
const EDGE = PCM.map(audioEdges);
const OFF = [];
const WORDS = [];
const SOUND = [];
const wordAt = (i, w, nth = 1) => { let n = 0; return WORDS[i].find(x => bare(x.word) === w && ++n === nth); };
const need = (i, w, nth = 1) => { const x = wordAt(i, w, nth); if (!x) throw new Error('line ' + (i + 1) + ' has no "' + w + '"' + (nth > 1 ? ' a ' + nth + 'nd time' : '') + ' in it: ' + WORDS[i].map(x => x.word).join(' ')); return x; };
/* each line is placed as its scene starts, because the fifth scene's start
   depends on the picture in the fourth, which depends on the fourth line's
   placement. so the clock is hung scene by scene. */
for (let i = 0; i < LINES.length; i++) {
  OFF.push(+(SC[i] + PRE - EDGE[i].start).toFixed(4));
  WORDS.push(TAKES[i].words.map(w => ({ word: w.word, start: +(w.start + OFF[i]).toFixed(4), end: +(w.end + OFF[i]).toFixed(4) })));
  SOUND.push({ start: +(EDGE[i].start + OFF[i]).toFixed(4), end: +(EDGE[i].end + OFF[i]).toFixed(4) });
  const soundEnd = SOUND[i].end;
  const floor = soundEnd + AFTER_LINE;
  if (i === 0) {
    /* one: he jumps as "message" ends, never before the module's first blink
       has had its room; the card comes in under him once he is clear of its
       box, and buzzes as it settles; he looks down once he has landed */
    JUMP.at = +Math.max(need(0, 'message').end, 1.25).toFixed(4);
    NOTE.in.at = +(JUMP.at + 0.28).toFixed(4);
    NOTE.buzz.at = +(NOTE.in.at + NOTE.in.for - 0.10).toFixed(4);
    LOOK1.at = +(JUMP.at + JUMP.for).toFixed(4);
    SC[1] = +Math.max(BRIEF[1], floor).toFixed(4);
  } else if (i === 1) {
    /* two: the bubble goes, the link flies, the phone, the press as soon as
       the pointer is on the button. three waits for the page's own pill. */
    OUT1.at = SC[1];
    IN1.at = +(SC[1] + 0.50).toFixed(4);
    LOOK2.at = +(IN1.at + 0.20).toFixed(4);
    PHONE_IN.at = +(SC[1] + 0.10).toFixed(4);
    FLY.at = +(SC[1] + 0.10).toFixed(4);
    PRESS1.at = +(FLY.at + FLY.for + 0.30).toFixed(4);
    PILL1.at = +(PRESS1.at + SCAN.len).toFixed(4);
    PULSE.at = PILL1.at;
    SC[2] = +Math.max(BRIEF[2], floor, PILL1.at).toFixed(4);
  } else if (i === 2) {
    /* three: the ring on the lookalike line and the line under the phone, both on `fake` */
    RING.at = +need(2, RING.say).start.toFixed(4);
    CAP3.at = RING.at;
    SC[3] = +Math.max(BRIEF[3], floor).toFixed(4);
    CAP3.out = SC[3];
  } else if (i === 3) {
    /* four: check another link, the typing with the fog, the eyes to the
       lens, the press, the pill, happy on it, the line under the phone. five
       waits for the pill. */
    AGAIN.at = +(SC[3] + 0.40).toFixed(4);
    TYPE.from = +(AGAIN.at + 0.20).toFixed(4);
    TYPE.done = +(TYPE.from + FOG.real.length / TYPE.cps).toFixed(4);
    EYES.at = +(SC[3] + 0.70).toFixed(4);
    PRESS2.at = +(TYPE.done + 0.25).toFixed(4);
    PILL2.at = +(PRESS2.at + SCAN.len).toFixed(4);
    HAPPY.at = PILL2.at;
    CAP4.at = +(PILL2.at + 0.05).toFixed(4);
    SC[4] = +Math.max(BRIEF[4], floor, PILL2.at + PILL_HOLD).toFixed(4);
  } else {
    /* five: the phone away, him home, calm, the wordmark, the address */
    PHONE_OUT.at = SC[4];
    OUT2.at = SC[4];
    IN2.at = +(SC[4] + EXIT.for + 0.05).toFixed(4);
    CALM.at = +(IN2.at + SPRING.for + 0.15).toFixed(4);
    WM2.at = +(IN2.at + SPRING.for + 0.05).toFixed(4);
    ADDR_IN.at = +(WM2.at + 0.30).toFixed(4);
    END = +(soundEnd + AFTER_READ).toFixed(4);
  }
}
SECONDS = +END.toFixed(2);
CUR.presses = [PRESS1.at, AGAIN.at, PRESS2.at];
CUR.keys = [
  { t: +(FLY.at + FLY.for + 0.05).toFixed(4), at: ['in', 70, 36], o: 0 },
  { t: +(FLY.at + FLY.for + 0.12).toFixed(4), at: ['in', 70, 36], o: 1 },
  { t: +(PRESS1.at - 0.10).toFixed(4), at: ['btn', 0, 0], o: 1 },
  { t: +(PRESS1.at + 0.35).toFixed(4), at: ['btn', 0, 0], o: 1 },
  { t: +(PRESS1.at + 0.70).toFixed(4), at: ['btn', 30, 40], o: 0 },
  { t: +(SC[3] + 0.05).toFixed(4), at: ['again', 34, 24], o: 0 },
  { t: +(SC[3] + 0.15).toFixed(4), at: ['again', 34, 24], o: 1 },
  { t: +(AGAIN.at - 0.05).toFixed(4), at: ['again', 0, 0], o: 1 },
  { t: +(AGAIN.at + 0.25).toFixed(4), at: ['again', 0, 0], o: 1 },
  { t: +(TYPE.done - 0.10).toFixed(4), at: ['btn', 0, 0], o: 1 },
  { t: +(PRESS2.at + 0.35).toFixed(4), at: ['btn', 0, 0], o: 1 },
  { t: +(PRESS2.at + 0.70).toFixed(4), at: ['btn', 30, 40], o: 0 },
];

/* ---------- the subtitles, cut to the read ---------- */
for (const [i, c] of SUBTITLES.entries()) {
  const W = WORDS[c.line];
  const [a, b] = c.words;
  if (!(W[a] && W[b] && a <= b)) throw new Error('subtitle ' + (i + 1) + ' names words ' + a + '..' + b + ' and line ' + (c.line + 1) + ' has ' + W.length + ': ' + W.map(w => w.word).join(' '));
  const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (letters(W.slice(a, b + 1).map(w => w.word).join('')) !== letters(c.lines.join(''))) {
    throw new Error('subtitle ' + (i + 1) + ' reads "' + c.lines.join(' / ') + '" and the take says "' + W.slice(a, b + 1).map(w => w.word).join(' ') + '" (the line is: ' + W.map(w => w.word).join(' ') + ')');
  }
  CARDS.push({ ...c, from: +(W[a].start - ST.lead).toFixed(4), to: +(W[b].end + ST.tail).toFixed(4) });
}
for (let i = 0; i + 1 < CARDS.length; i++) if (CARDS[i].to > CARDS[i + 1].from - 0.02) CARDS[i].to = +(CARDS[i + 1].from - 0.02).toFixed(4);
for (const c of CARDS) {
  const phoneUp = c.from >= PHONE_IN.at - 0.2 && c.to <= PHONE_OUT.at + 0.2;
  c.slot = phoneUp ? 'low' : 'high';
  /* a card in the high slot cannot come up while the phone is still fading
     over that slot, so it waits for the phone to be nearly gone */
  const gone = +(PHONE_OUT.at + PHONE_OUT.for - 0.15).toFixed(4);
  if (c.slot === 'high' && c.from < gone && c.to > PHONE_OUT.at) c.from = gone;
}

/* ---------- the plan ----------
   neutral, facing the lens; happy on the nothing found pill; calm again once
   he is home. the seed is searched for the two blinks the brief names:
   exactly one in the first scene once the card has landed; one in the
   window after the eyes reach the lens in four, with quiet before it; and
   none on the two landings. */
const MARKS = [{ t: 0, state: 'neutral' }, { t: HAPPY.at, state: 'delighted' }, { t: CALM.at, state: 'neutral' }];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: 0, seed, marks: MARKS });
const CLEAR = [[JUMP.at - 0.10, JUMP.at + JUMP.for + 0.20], [IN1.at + SPRING.for - 0.20, IN1.at + SPRING.for + 0.30], [IN2.at + SPRING.for - 0.20, IN2.at + SPRING.for + 0.30]];
/* one: the module's idle blink before the jump is his own; in the jump and
   the card's arrival none; exactly one once the card has landed */
const LAND1 = NOTE.in.at + NOTE.in.for;
const WIN1 = [LAND1 + BLINK.after1, OUT1.at - 0.35];
const WIN4 = [EYES.at + EYES.for + BLINK.after4, EYES.at + EYES.for + BLINK.after4 + BLINK.within4];
const twoBlinks = blinks => {
  if (blinks.some(x => x.t >= JUMP.at - 0.10 && x.t < WIN1[0])) return null;
  const inOne = blinks.filter(x => x.t >= WIN1[0] && x.t < OUT1.at);
  if (inOne.length !== 1 || inOne[0].twice || inOne[0].t >= WIN1[1]) return null;
  const inFour = blinks.filter(x => x.t >= WIN4[0] && x.t < WIN4[1]);
  if (inFour.length !== 1 || inFour[0].twice) return null;
  if (blinks.some(x => x.t >= WIN4[0] - BLINK.quiet && x.t < WIN4[0])) return null;
  if (blinks.some(x => x.t >= WIN4[1] && x.t < WIN4[1] + 0.5)) return null;
  return { one: inOne[0], four: inFour[0] };
};
let BLINKS = null;
const SEED = (() => {
  for (let s = 1; s <= 8000; s++) {
    const b = makePlan(s).idle.blinks;
    if (b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) continue;
    const two = twoBlinks(b);
    if (!two) continue;
    BLINKS = two;
    return s;
  }
  throw new Error('no seed under 8000 blinks once after the card lands and once on the look to the lens while keeping clear of the jump and the landings');
})();
const plan = makePlan(SEED);
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(HEAD_Y - halfBox).toFixed(2);
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the voice, on the clip's own clock, and nothing else on the bus ---------- */
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
for (let k = 0; k < LINES.length; k++) {
  const pcm = PCM[k], e = EDGE[k];
  const a = Math.max(0, Math.round((e.start - PRE) * SR)), b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
  const at = Math.round(OFF[k] * SR) + a, fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + (i - a);
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += pcm[i] * g;
  }
}
const MODULE_CUES = mascotCues(plan);
const WAV = path.join(OUT, 'post36-mix.wav');
const RAW = path.join(OUT, 'post36-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
function pass(lift) {
  const buf = VTRACK.slice();
  applyGain(buf, lift);
  const peak = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  return { lift: +lift.toFixed(2), buf, peak, lufs: loudness(ffmpeg, RAW).lufs };
}
const zero = pass(0);
const want = zero.lufs == null ? 0 : +(TARGET_LUFS - zero.lufs).toFixed(2);
let best = zero, tries = 1;
if (want > 0.05) {
  let lo = 0, hi = want;
  const top = pass(want); tries++;
  if (top.peak.reduction <= MAX_REDUCTION) best = top;
  else while (hi - lo > 0.20 && tries < 10) { const mid = (lo + hi) / 2, p = pass(mid); tries++; if (p.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p; } else hi = mid; }
} else if (want < -0.05) { best = pass(want); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

/* ---------- the fast things, at sixty ---------- */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  /* from the first frame inside the window: the frame before an entrance is
     somewhere else, unseen, and that is not a move */
  for (let f = Math.ceil(a * 60 - 1e-6); f < Math.ceil(b * 60); f++) { const s = Math.abs(fn((f + 1) / 60) - fn(f / 60)); if (s > d) { d = s; at = f / 60; } }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const headStep = [[JUMP.at, JUMP.at + JUMP.for], [IN1.at, IN1.at + SPRING.for], [IN2.at, IN2.at + SPRING.for]]
  .map(([a, b]) => { const y = fastest(t => compose(plan, t).card.y, a, b), x = fastest(t => compose(plan, t).card.x, a, b); return y.d >= x.d ? y : x; })
  .sort((x, y) => y.d - x.d)[0];
const REST0 = { link: { x: 100, cy: 200, w: 200 }, field: { x: 31, cy: 192, font: 13.178, val: '', widths: [0] }, rects: { in: { cx: 144, cy: 192 } } };
const flyStep = fastest(t => frameAt(t, 0, REST0).fly.y, FLY.at, FLY.at + FLY.for);
const bubStep = fastest(t => frameAt(t, 0, null).bub.y, NOTE.in.at, NOTE.in.at + NOTE.in.for);
const buzzStep = fastest(t => frameAt(t, 0, null).bub.x, NOTE.buzz.at, NOTE.buzz.at + NOTE.buzz.for);
const FASTEST = Math.max(headStep.d, flyStep.d, bubStep.d);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log('\n  the read, edge, ' + TAKES[0].voiceId);
for (const t of TAKES) {
  const w = WORDS[t.i];
  const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"  ' + t.rate + ' ' + t.pitch + (t.cached ? '  cached' : '  fetched') + (t.sentences > 1 ? ', ' + t.sentences + ' sentences, stops of ' + t.gaps.map(g => (g * 1000).toFixed(0) + 'ms').join(', ') : '')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's in a scene of ' + SC[t.i].toFixed(2) + ' to ' + to.toFixed(2)
    + (SC[t.i] > BRIEF[t.i] + 1e-6 ? ' (the brief said ' + BRIEF[t.i].toFixed(1) + ')' : '') + ', ' + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
  if (VOICE_ONLY) console.log('             words: ' + w.map((x, k) => k + ':' + x.word).join(' '));
}
console.log('\n  the beats');
const beats = [
  [0, 'one. him in the middle of the frame at the house size, calm, idle'],
  ...plan.idle.blinks.filter(b => b.t < JUMP.at).map(b => [b.t, 'an idle blink, the module\'s']),
  [JUMP.at, 'the message: he springs up ' + (START_Y - S1_Y) + ' css px, on the rise, ' + JUMP.for + 's'],
  [NOTE.in.at, 'the notification slides in from below into the room he left, ' + NOTE.in.for + 's'],
  [LOOK1.at, 'his eyes go down to the card'],
  [NOTE.buzz.at, 'the card lands with a buzz, ' + NOTE.buzz.amp + ' px at ' + NOTE.buzz.hz + ' Hz dying over ' + NOTE.buzz.for + 's'],
  [BLINKS.one.t, 'one blink, the module\'s, seed ' + SEED],
  [SC[1], 'two. the card fades, he shrinks away where he stands'],
  [FLY.at, 'the link lifts out of the card and flies to the field, ' + FLY.for + 's'],
  [PHONE_IN.at, 'the phone pops in, the checker on it'],
  [IN1.at, 'he springs in small on the phone\'s corner, eyes on the phone'],
  [PRESS1.at, 'the pointer presses check it: the page types its nine lines'],
  [PILL1.at, 'the page\'s danger pill, and his glow pulses red once'],
  [SC[2], 'three'],
  [RING.at, 'the ring on the lookalike line for ' + RING.for + 's, and "' + CAP3.text + '" under the phone, on "' + RING.say + '"'],
  [SC[3], 'four. the line under the phone goes'],
  [AGAIN.at, 'the pointer presses check another link: the page clears'],
  [TYPE.from, 'the second link types at ' + TYPE.cps + ' letters a second, fog from the ' + (FOG.shown.length + 1) + 'th'],
  [EYES.at, 'his eyes slide to the lens'],
  [BLINKS.four.t, 'one blink, the module\'s'],
  [PRESS2.at, 'check it: the page types its lines, all green, the host fogged'],
  [PILL2.at, 'the page\'s nothing found pill, he goes happy on it'],
  [CAP4.at, '"' + CAP4.text + '" under the phone'],
  [SC[4], 'five. the phone shrinks away'],
  [IN2.at, 'he springs in at the middle'],
  [CALM.at, 'calm'],
  [WM2.at, 'the wordmark pops'],
  [ADDR_IN.at, '"' + ADDR.text + '" under it, held to the end'],
  [SECONDS, 'end, ' + AFTER_READ + 's after the last sound'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('\n  the fast things, at sixty');
console.log('    his centre moves at most ' + headStep.d + ' css px a frame, at ' + headStep.at + 's');
console.log('    the link flies at most ' + flyStep.d + ' css px a frame, the card slides ' + bubStep.d + ' and buzzes ' + buzzStep.d);
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST / SUB).toFixed(2) + ' css px between samples' : 'closed'));
console.log('\n  the sound');
console.log('    the voice: ' + TAKES.reduce((a, t) => a + t.sentences, 0) + ' edge takes at ' + RATE + ' assembled into five lines with ' + BREAK_MS + 'ms at every stop, on the clip\'s clock, and nothing else on the bus');
console.log('    the lift: off the voice at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, took ' + best.lift.toFixed(2) + ' dB in ' + tries + ' pass' + (tries === 1 ? '' : 'es'));
console.log('    the bus: ' + (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

if (VOICE_ONLY) process.exit(0);

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post36.json'), 'utf8')) : await render(plan);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  four stills in ' + path.relative(ROOT, VERIFY));
if (!KEEP && !ONLY_ENCODE) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ========================================================================== */
/* the guards                                                                 */
/* ========================================================================== */
const fail = [];
console.log('\nchecks');
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('the file is ' + p.w + 'x' + p.h);
if (Math.abs(p.fps - FPS) > 0.01) fail.push('the file runs at ' + p.fps + 'fps rather than ' + FPS);
if (Math.abs(p.seconds - SECONDS) > 0.15) fail.push('the file runs ' + p.seconds.toFixed(2) + 's rather than ' + SECONDS);
if (!p.audio) fail.push('the file has no audio track');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');

/* ---------- the read is edge, in sync, and inside its scenes ---------- */
{
  for (const t of TAKES) {
    if (t.provider !== 'edge' || !/Andrew/.test(t.voiceId)) fail.push('take ' + (t.i + 1) + ' is ' + t.provider + ' ' + t.voiceId + ', not edge\'s andrew');
    const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
    if (SOUND[t.i].start < SC[t.i] - 1e-6) fail.push('line ' + (t.i + 1) + ' starts sounding at ' + SOUND[t.i].start + 's, before its scene');
    if (SOUND[t.i].end > to - AFTER_LINE + 1e-3) fail.push('line ' + (t.i + 1) + ' is still sounding at ' + SOUND[t.i].end + 's, into the next scene');
    if (t.i < LINES.length - 1 && SOUND[t.i].end > SOUND[t.i + 1].start) fail.push('lines ' + (t.i + 1) + ' and ' + (t.i + 2) + ' overlap');
    if (t.rate !== RATE) fail.push('take ' + (t.i + 1) + ' is ' + t.rate);
    for (const g of t.gaps) if (Math.abs(g - BREAK_MS / 1000) > 0.006) fail.push('take ' + (t.i + 1) + ' has a ' + (g * 1000).toFixed(0) + 'ms stop, not ' + BREAK_MS);
    if (t.sentences !== t.text.split(/(?<=[.!?])\s+/).length) fail.push('take ' + (t.i + 1) + ' is ' + t.sentences + ' takes for ' + t.text.split(/(?<=[.!?])\s+/).length + ' sentences');
  }
  for (const [i, L] of LINES.entries()) {
    if (/[—–]/.test(L.text) || /\s-\s/.test(L.text) || /!/.test(L.text) || /[A-Z]/.test(L.text)) fail.push('line ' + (i + 1) + ' breaks the copy rules: "' + L.text + '"');
    if (!/\.$/.test(L.text)) fail.push('line ' + (i + 1) + '\'s read has lost its full stop: "' + L.text + '"');
  }
  if (!/languages\. the boring tek\.$/.test(LINES[4].text)) fail.push('line five has lost the stop before the boring tek');
  for (let i = 0; i < BRIEF.length; i++) if (SC[i] < BRIEF[i] - 1e-6) fail.push('scene ' + (i + 1) + ' starts at ' + SC[i] + ', before the brief\'s ' + BRIEF[i]);
  if (SECONDS < 18 || SECONDS > 27) fail.push('the film is ' + SECONDS + 's');
  /* no air: every scene after the first starts AFTER_LINE after the line before it, unless the picture floors it */
  for (let i = 1; i < LINES.length; i++) {
    const gap = SC[i] - SOUND[i - 1].end;
    const allowed = i === 2 ? Math.max(AFTER_LINE, PILL1.at - SOUND[1].end) : i === 4 ? Math.max(AFTER_LINE, PILL2.at + PILL_HOLD - SOUND[3].end) : AFTER_LINE;
    if (gap > allowed + 0.02) fail.push('scene ' + (i + 1) + ' starts ' + gap.toFixed(2) + 's after line ' + i + ' ends, which is air');
  }
}

/* ---------- what is on the screen ----------
   no dashes, colons, parentheses, apostrophes or quotes anywhere a viewer
   reads, except inside the links; no dot on a caption. */
{
  const screen = [['the card', NOTE.text], ['the sender', NOTE.name], ['the avatar', NOTE.letter], ['the first line under the phone', CAP3.text], ['the second line under the phone', CAP4.text],
    ['the wordmark', WM.lines.join(' ')], ['the address', ADDR.text], ...SUBTITLES.map((c, i) => ['subtitle ' + (i + 1), c.lines.join(' ')])];
  for (const [what, s] of screen) {
    if (/[-—–:()'"“”‘’]/.test(s)) fail.push(what + ' carries a dash, a colon, a bracket, an apostrophe or a quote: "' + s + '"');
    if (what !== 'the address' && /\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  /* the fake link is the brief's, with its cyrillic а, and the real one is plain */
  if (NOTE.link.charCodeAt(9) !== 0x0430 || NOTE.link !== 'https://p\u0430ypal.com/login') fail.push('the card\'s link is not the brief\'s, with the cyrillic a: ' + NOTE.link);
  /* the card is a notification: one letter, the name, a clock time, and no mark */
  if (!/^[A-Z]$/.test(NOTE.letter) || NOTE.name[0] !== NOTE.letter) fail.push('the avatar letter is "' + NOTE.letter + '", not the sender\'s initial');
  if (!/^\d\d:\d\d$/.test(NOTE.time)) fail.push('the time is "' + NOTE.time + '", not a clock time');
  if (state.measured.avatar.marks) fail.push('the card carries ' + state.measured.avatar.marks + ' image(s), and the brief said no logos');
  if (/[^\x20-\x7e]/.test(FOG.real) || !FOG.real.startsWith(FOG.shown) || FOG.n !== FOG.real.length - FOG.shown.length || FOG.n < 4) fail.push('the fogged link is not ' + FOG.shown + ' plus at least four plain letters: ' + FOG.real);
  if (FOG.host.slice(0, FOG.hostShown.length) !== FOG.hostShown || FOG.host.length - FOG.hostShown.length !== FOG.n) fail.push('the host\'s fogged tail is not the field\'s: ' + FOG.host + ' against ' + FOG.real);
  if (!/[a-z]/.test(FOG.hostShown) || FOG.hostShown.length !== 3) fail.push('the readable part of the host is "' + FOG.hostShown + '", not three letters');
}

/* ---------- the states are calm or happy, and nothing else is drawn ---------- */
{
  for (const m of plan.marks) if (!['neutral', 'delighted'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and only calm or happy eyes are allowed');
  if (HAPPY.at !== PILL2.at) fail.push('happy is not on the nothing found pill');
  if (CALM.at < IN2.at + SPRING.for) fail.push('calm starts before he has landed');
  if (HAPPY.at + 1.10 > CALM.at) fail.push('the happy has no room before calm');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip has neither');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (plan.bias !== 0) fail.push('he is not facing the lens');
  /* the house size under the bubble, small on the corner, the house size home */
  const c1 = compose(plan, 1.0).card, c2 = compose(plan, SC[2] - 0.3).card, mid = compose(plan, SECONDS - 0.3).card;
  if (Math.abs(c1.sx / mascotFrame(plan, 1.0).card.sx - 1) > 1e-3) fail.push('he is not at the house size in the first scene');
  /* one: from the middle of the frame, up to S1_Y on the rise, once */
  {
    const a = placeAt(0), b = placeAt(JUMP.at + JUMP.for + 0.01);
    if (Math.abs(HOME.y + a.dy - START_Y) > 1e-6 || Math.abs(HOME.x + a.dx - VW / 2) > 1e-6) fail.push('he does not start in the middle of the frame');
    if (Math.abs(HOME.y + b.dy - S1_Y) > 1e-6) fail.push('he does not land at ' + S1_Y);
    if (!(S1_Y < START_Y)) fail.push('the jump does not go up');
    let peak = Infinity;
    for (let f = Math.ceil(JUMP.at * 60); f <= Math.ceil((JUMP.at + JUMP.for) * 60); f++) peak = Math.min(peak, HOME.y + placeAt(f / 60).dy);
    if (peak > S1_Y - 4) fail.push('the jump has no overshoot, it is not the spring');
    if (peak - R_FULL < SAFE_CSS.top) fail.push('the jump\'s peak at ' + peak.toFixed(0) + ' css px puts his head in the top band');
  }
  if (Math.abs(c2.sx / mascotFrame(plan, SC[2] - 0.3).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size on the corner');
  if (Math.abs(mid.sx / mascotFrame(plan, SECONDS - 0.3).card.sx - 1) > 1e-3) fail.push('he is not at the house size in the middle');
  if (!(placeAt(0).on === 1 && placeAt(OUT1.at + EXIT.for + 0.01).on === 0 && placeAt(IN1.at + SPRING.for + 0.01).on === 1 && placeAt(OUT2.at + EXIT.for + 0.01).on === 0 && placeAt(IN2.at + SPRING.for + 0.01).on === 1)) fail.push('he is not on, off, on, off, on in that order');
  /* above the card, clear of it: his head against the card's box on every frame the card is up, as it slides */
  if (state.built) {
    let worstGap = Infinity, at = 0;
    for (let f = Math.floor(NOTE.in.at * 60); f < Math.ceil((SC[1] + NOTE.out.for) * 60); f++) {
      const t = f / 60, r = headRect(plan, compose(plan, t));
      const hy1 = VH - r.bottom / DSF, cardTop = NOTE.top + NOTE.in.from * (1 - GLIDE(span(t, NOTE.in.at, NOTE.in.at + NOTE.in.for)));
      const gap = cardTop - hy1;
      if (gap < worstGap) { worstGap = gap; at = t; }
    }
    console.log('  his head clears the card by ' + worstGap.toFixed(1) + ' css px at the least, at ' + at.toFixed(2) + 's');
    if (worstGap < 6) fail.push('he is on the card at ' + at.toFixed(2) + 's, by ' + (-worstGap).toFixed(1) + ' css px');
    if (JUMP.at + JUMP.for > NOTE.in.at + NOTE.in.for) fail.push('he is still jumping when the card has landed');
  }
  /* on the corner: his centre on the phone's corner point, and he rides the phone's scale as it leaves */
  {
    const P = placeAt(SC[2] - 0.3), c = { x: HOME.x + P.dx, y: HOME.y + P.dy };
    if (Math.hypot(c.x - CORNER.x, c.y - CORNER.y) > 1) fail.push('he is not on the phone\'s corner: at ' + c.x.toFixed(0) + ', ' + c.y.toFixed(0) + ' against ' + CORNER.x + ', ' + CORNER.y);
    const tq = OUT2.at + 0.10, Q = placeAt(tq), q = { x: HOME.x + Q.dx, y: HOME.y + Q.dy }, want = onPhone(CORNER.x, CORNER.y, phoneAt(tq).sc);
    if (Math.hypot(q.x - want.x, q.y - want.y) > 1) fail.push('he does not ride the phone as it leaves');
    /* never on the page: his head against the screen's box, at most a corner of him, on every frame he is on the phone */
    let worstOver = 0;
    for (let f = Math.floor(IN1.at * 60); f < Math.ceil((OUT2.at + EXIT.for) * 60); f++) {
      const t = f / 60, sc = phoneAt(t).sc, r = headRect(plan, compose(plan, t));
      if (!placeAt(t).on) continue;
      const hx0 = r.left / DSF, hx1 = VW - r.right / DSF, hy0 = r.top / DSF, hy1 = VH - r.bottom / DSF;
      const s0 = onPhone(PHONE.left + PHONE.bezel, PHONE.top + PHONE.bezel, sc), s1 = onPhone(PHONE.left + PHONE.w - PHONE.bezel, PHONE.bottom - PHONE.bezel, sc);
      const ox = Math.max(0, Math.min(hx1, s1.x) - Math.max(hx0, s0.x)), oy = Math.max(0, Math.min(hy1, s1.y) - Math.max(hy0, s0.y));
      worstOver = Math.max(worstOver, ox * oy / ((hx1 - hx0) * (hy1 - hy0)));
    }
    console.log('  on the corner, at most ' + (worstOver * 100).toFixed(0) + '% of his head box is over the screen');
    if (worstOver > 0.30) fail.push('he covers ' + (worstOver * 100).toFixed(0) + '% of his head box worth of screen, which is more than a corner');
  }
  /* the looks: one offset on both eyes, ink inside the head throughout */
  {
    const u = compose(plan, LOOK1.at + LOOK1.for + 0.5), m = mascotFrame(plan, LOOK1.at + LOOK1.for + 0.5);
    if (Math.abs((u.eyes[0].y - m.eyes[0].y) - LOOK1.up) > 1e-3 || Math.abs((u.eyes[1].y - m.eyes[1].y) - LOOK1.up) > 1e-3) fail.push('his eyes are not down by ' + LOOK1.up + ' units at the card');
    if (!(LOOK1.up > 0)) fail.push('the look at the card is not down');
    if (LOOK1.at < JUMP.at + JUMP.for - 1e-6) fail.push('he looks down before he has landed');
    const v = compose(plan, SC[2] + 0.5), n = mascotFrame(plan, SC[2] + 0.5);
    if (Math.abs((v.eyes[0].x - n.eyes[0].x) - LOOK2.x) > 1e-3 || Math.abs((v.eyes[0].y - n.eyes[0].y) - LOOK2.y) > 1e-3) fail.push('his eyes are not on the phone from the corner');
    const w = compose(plan, EYES.at + EYES.for + 0.3), x = mascotFrame(plan, EYES.at + EYES.for + 0.3);
    if (Math.abs(w.eyes[0].x - x.eyes[0].x) > 1e-6 || Math.abs(w.eyes[0].y - x.eyes[0].y) > 1e-6) fail.push('his eyes are not on the lens after the slide');
    if (Math.abs(lookAt(0).y) > 1e-6 || Math.abs(lookAt(0).x) > 1e-6) fail.push('he is already looking down on the first frame');
    let ink = -Infinity, at = 0;
    for (let f = 0; f < Math.ceil(SECONDS * 60); f++) { const q = eyeInk(plan, compose(plan, f / 60)); if (q > ink) { ink = q; at = f / 60; } }
    if (ink > 0) fail.push('the eye ink lands ' + ink.toFixed(2) + ' units outside the head at ' + at.toFixed(2) + 's');
  }
  /* the two blinks are the module's, once each, in their windows, and the lids really shut */
  {
    const two = twoBlinks(plan.idle.blinks);
    if (!two) fail.push('the plan does not blink once under the bubble and once on the look to the lens');
    for (const [name, b] of [['under the bubble', BLINKS.one], ['on the look to the lens', BLINKS.four]]) {
      let shut = 0;
      for (let f = Math.floor(b.t * 60); f <= Math.ceil((b.t + 0.4) * 60); f++) { const fr = compose(plan, f / 60); shut = Math.max(shut, fr.eyes[0].lid, fr.eyes[1].lid); }
      if (shut < 0.9) fail.push('the lids only reach ' + shut.toFixed(2) + ' on the blink ' + name);
    }
    if (BLINKS.one.t < LAND1 + BLINK.after1) fail.push('the first scene\'s blink is at ' + BLINKS.one.t + ', before the card has landed at ' + LAND1.toFixed(2));
    if (plan.idle.blinks.some(x => x.t >= JUMP.at - 0.10 && x.t < LAND1 + BLINK.after1)) fail.push('a blink lands in the jump or the card\'s arrival');
    if (BLINKS.four.t < EYES.at + EYES.for) fail.push('the fourth scene\'s blink is at ' + BLINKS.four.t + ', before the eyes reach the lens');
  }
  const home = compose(plan, SECONDS - 0.05).card, mod = mascotFrame(plan, SECONDS - 0.05).card;
  if (Math.abs(home.y - mod.y) > 1e-6 || Math.abs(home.x - mod.x) > 1e-6) fail.push('he is not home on the last frame');
  /* the red pulse: once, on the pill, on his centre, and gone */
  if (Math.abs(PULSE.at - PILL1.at) > 1e-6) fail.push('the red pulse is not on the danger pill');
  if (frameAt(PULSE.at + PULSE.for + 0.01, 0, null).rg.o !== 0 || frameAt(PULSE.at - 0.01, 0, null).rg.o !== 0) fail.push('the red pulse is up outside its window');
  {
    let peakO = 0, pulses = 0, on = false;
    for (let f = 0; f < Math.ceil(SECONDS * 60); f++) { const o = frameAt(f / 60, 0, null).rg.o; peakO = Math.max(peakO, o); if (o > 0 && !on) pulses++; on = o > 0; }
    if (pulses !== 1) fail.push('the glow pulses ' + pulses + ' times, and it is one pulse');
    if (Math.abs(peakO - PULSE.peak) > 0.02) fail.push('the pulse peaks at ' + peakO);
  }
}

/* ---------- everything clears the safe area, the house one and the brief's ---------- */
{
  const M = state.measured;
  const floor = BRIEF_SAFE;
  const inside = (what, b) => {
    if (b.left < SAFE.left || b.right < SAFE.right || b.top < SAFE.top || b.bottom < SAFE.bottom) fail.push(what + ' is inside the house safe area: ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
    if (b.left < floor || b.right < floor || b.top < floor || b.bottom < floor) fail.push(what + ' is inside the brief\'s 120px margin');
  };
  inside('the card', M.bub);
  if (!/Nunito/.test(M.bubText.font)) fail.push('the card\'s text is not in nunito: ' + M.bubText.font);
  if (!/monospace|Mono|Menlo|Consolas/i.test(M.link.font)) fail.push('the card\'s link is not mono: ' + M.link.font);
  if (!/^(700|bold) /.test(M.name.font) || !/Nunito/.test(M.name.font)) fail.push('the sender is not bold nunito: ' + M.name.font);
  for (const [what, b] of [['the card\'s text', M.bubText], ['the link', M.link], ['the sender', M.name], ['the time', M.time], ['the avatar', M.avatar]]) {
    if (b.left < M.bub.left || b.right < M.bub.right || b.top < M.bub.top || b.bottom < M.bub.bottom) fail.push(what + ' leaves the card');
  }
  if (M.avatar.w < 1 || Math.abs(M.avatar.w - M.avatar.h) > 1) fail.push('the avatar is not a circle: ' + M.avatar.w + 'x' + M.avatar.h);
  if (!(M.avatar.left < M.name.left && M.name.left < M.time.left)) fail.push('the card\'s header is not avatar, name, time left to right');
  if (M.time.right > M.bub.right + 2 * NOTE.padX * DSF + 4) fail.push('the time does not sit at the card\'s right edge');
  inside('the phone', M.phone);
  if (M.phone.w > 760) fail.push('the phone is ' + M.phone.w + ' device px wide, over 760');
  if (M.phone.left < 160 || M.phone.right < 160) fail.push('the phone has less than 160 device px of air at a side');
  for (const [what, b] of [['the first line under the phone', M.cap3], ['the second line under the phone', M.cap4]]) { inside(what, b); if (!/Nunito/.test(b.font)) fail.push(what + ' is not in nunito: ' + b.font); }
  /* the lines under the phone sit under it and under him on the corner, and never together */
  {
    let low = 0;
    for (let f = Math.floor(CAP3.at * 60); f < Math.ceil(SC[4] * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); low = Math.max(low, VH - r.bottom / DSF); }
    if (low > CAP.top - 4) fail.push('he reaches ' + low.toFixed(0) + ' css px on the corner, onto the line under the phone at ' + CAP.top);
    if (CAP.top < PHONE.bottom + 8) fail.push('the line under the phone is on the phone');
    if (CAP3.out + CAP.outFor > CAP4.at) fail.push('the first line under the phone is still up when the second comes');
    if (CAP3.at + CAP.for > CAP3.out - 0.5) fail.push('the first line under the phone has no time to read');
  }
  /* the ring sits on the lookalike line, inside the terminal, and only while the line is red */
  {
    const R = state.rest.rects;
    if (!R || !R.lines) fail.push('the page reports no line boxes for the ring');
    if (RING.at < PRESS1.at + 1.3) fail.push('the ring comes at ' + RING.at.toFixed(2) + ', before the lookalike line has typed');
    if (RING.at + RING.for > AGAIN.at) fail.push('the ring is still up when the page clears');
  }
  inside('the wordmark', M.wm);
  inside('the address', M.addr);
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px, under ' + WM.minCapPx);
  const wmBottom = VH - M.wm.bottom / DSF, adTop = M.addr.top / DSF;
  if (adTop < wmBottom + 6) fail.push('the address starts at ' + adTop.toFixed(0) + ' css px, on the wordmark which ends at ' + wmBottom.toFixed(0));
  const hr = headRect(plan, compose(plan, SECONDS - 0.5));
  if ((VH * DSF - hr.bottom) / DSF > WM.top - 6) fail.push('his head reaches onto the wordmark');
  /* the subtitles: every card fits on its lines, sits in the safe area, and is under what it is under */
  for (const [i, c] of CARDS.entries()) {
    const b = M.subs[i];
    if (!/Nunito/.test(b.font)) fail.push('subtitle ' + (i + 1) + ' is not in nunito: ' + b.font);
    if (b.widestPx > (VW - SAFE_CSS.left - SAFE_CSS.right) * DSF) fail.push('subtitle ' + (i + 1) + ' is ' + b.widestPx + ' device px wide, past the side margins');
    if (c.lines.length > 2) fail.push('subtitle ' + (i + 1) + ' has ' + c.lines.length + ' lines');
    const top = c.slot === 'low' ? ST.low : ST.high, bottom = top + b.h / DSF;
    if (bottom > VH - SAFE_CSS.bottom) fail.push('subtitle ' + (i + 1) + ' reaches ' + bottom.toFixed(0) + ' css px, into the bottom band');
    if (bottom > VH - BRIEF_SAFE / DSF) fail.push('subtitle ' + (i + 1) + ' is inside the brief\'s bottom margin');
    if (c.slot === 'low' && top < PHONE.bottom + 12) fail.push('subtitle ' + (i + 1) + ' is on the phone');
    if (c.slot === 'low' && top < CAP.top + CAP.size * 1.25 + 6) fail.push('subtitle ' + (i + 1) + ' is on the line under the phone');
    if (c.slot === 'high' && !(c.to <= PHONE_IN.at + 0.2 || c.from >= PHONE_OUT.at + PHONE_OUT.for - 0.2)) fail.push('subtitle ' + (i + 1) + ' is in the high slot while the phone is up');
    if (c.slot === 'high' && c.from >= SC[4] && top < ADDR.top + ADDR.size * 1.3 + 8) fail.push('subtitle ' + (i + 1) + ' is on the address');
    if (c.to - c.from < 0.4) fail.push('subtitle ' + (i + 1) + ' is up for ' + (c.to - c.from).toFixed(2) + 's');
    if (c.line === 3 && c.to > SC[4]) fail.push('subtitle ' + (i + 1) + ' is still up in scene five');
  }
  for (let i = 0; i < LINES.length; i++) if (!CARDS.some(c => c.line === i)) fail.push('line ' + (i + 1) + ' has no subtitle');
  if (ST.high < state.built.bub.bottom + 8) fail.push('the high slot is on the card');
  /* his start in the middle of the frame clears the high slot */
  if (START_Y + R_FULL > ST.high - 4) fail.push('he starts on the subtitle slot');
  /* he never reaches a subtitle slot that is in use while he is there */
  {
    let low1 = 0, lowC = 0;
    for (let f = 0; f < Math.ceil(OUT1.at * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); low1 = Math.max(low1, VH - r.bottom / DSF); }
    for (let f = Math.floor(IN1.at * 60); f < Math.ceil((OUT2.at + EXIT.for) * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); lowC = Math.max(lowC, VH - r.bottom / DSF); }
    if (low1 > ST.high - 4) fail.push('he reaches ' + low1.toFixed(0) + ' css px under the bubble, onto the high slot at ' + ST.high);
    if (lowC > ST.low - 4) fail.push('he reaches ' + lowC.toFixed(0) + ' css px on the corner, onto the low slot at ' + ST.low);
  }
  if (state.head && state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  /* the timing of two, three and four holds together */
  if (FLY.at + FLY.for > PRESS1.at - 0.25) fail.push('the link is still flying at ' + (FLY.at + FLY.for).toFixed(2) + ', and the press is at ' + PRESS1.at);
  if (PHONE_IN.at + PHONE_IN.for > FLY.at + FLY.for + 0.1) fail.push('the phone is still popping in when the link lands');
  if (PILL1.at > SC[2] + 1e-6) fail.push('the danger pill lands at ' + PILL1.at + ', after three starts at ' + SC[2]);
  if (TYPE.done + 0.2 > PRESS2.at) fail.push('the second link is still typing at the press');
  if (PILL2.at + PILL_HOLD > SC[4] + 1e-6) fail.push('five starts ' + (SC[4] - PILL2.at).toFixed(2) + 's after the second pill, under ' + PILL_HOLD);
  if (CAP4.at + CAP.for > SC[4] - 0.5) fail.push('the second line under the phone has no time to read');
  if (Math.abs(CAP4.at - PILL2.at - 0.05) > 1e-6) fail.push('the second line under the phone is not on the nothing found pill');
  if (EYES.at + EYES.for > PRESS2.at) fail.push('the eyes are still sliding at the second press');
  if (IN2.at < PHONE_OUT.at + PHONE_OUT.for) fail.push('he springs home while the phone is still leaving');
}

/* ---------- the phone did what the page does ----------
   read back off the page itself, on the render's own frames. */
{
  const at = tt => { let best = null; for (const o of state.observed) if (o.t <= tt + 1e-6) best = o; return best; };
  const first = state.observed.find(o => o.t >= 0.5);
  if (!first || first.lang !== 'en') fail.push('the page reports lang ' + (first && first.lang));
  if (!state.rest.chrome || state.rest.chrome.some(w => w > 0)) fail.push('the page still shows its language switch, home link, socials or theme toggle: ' + JSON.stringify(state.rest.chrome));
  const ringed = at(RING.at + 0.5);
  if (!ringed || !ringed.lines[RING.line] || !/bad/.test(ringed.lines[RING.line].cls) || !/lookalike letters/.test(ringed.lines[RING.line].text)) fail.push('the ringed line is not the red lookalike line: ' + JSON.stringify(ringed && ringed.lines[RING.line]));
  if (!first || first.theme !== 'dark') fail.push('the page is not dark');
  if (!first || first.val !== '' || first.lines.length !== 1 || !/idle/.test(first.lines[0].cls)) fail.push('the page is not idle before the link lands: "' + (first && first.val) + '", ' + (first && first.lines.length) + ' lines');
  const landed = at(FLY.at + FLY.for + 0.10);
  if (!landed || landed.val !== NOTE.link) fail.push('the field holds "' + (landed && landed.val) + '" after the link lands, not the bubble\'s link');
  const scanning = at(PRESS1.at + 0.6), danger = at(PILL1.at + 0.45);
  if (!scanning || scanning.lines.length < 2 || scanning.resOn) fail.push('the page is not scanning 0.6s after the first press');
  if (!danger || !danger.resOn) fail.push('the danger pill is not up 0.45s after its moment');
  if (danger) {
    if (danger.pill.cls !== 'bad' || danger.pill.word !== 'danger') fail.push('the first pill is "' + danger.pill.cls + ' ' + danger.pill.word + '", not danger');
    if (danger.lines.length !== 9) fail.push('the first scan has ' + danger.lines.length + ' lines, not nine');
    const red = danger.lines.map((l, k) => [k, l]).filter(([, l]) => /bad/.test(l.cls)).map(([k]) => k);
    if (red.join(',') !== '3,4') fail.push('the red lines are ' + red.join(',') + ', not the lookalike and brand copy lines');
    if (!/lookalike letters/.test(danger.lines[3].text) || !/brand copy/.test(danger.lines[4].text)) fail.push('lines four and five are not lookalike letters and brand copy: ' + danger.lines[3].text + ' | ' + danger.lines[4].text);
    if (!/last/.test(danger.lines[8].cls)) fail.push('the ninth line is not the bold one');
  }
  /* the pill lands when the clock says it does */
  const pillAt = state.observed.find(o => o.t >= PRESS1.at && o.resOn);
  if (!pillAt) fail.push('the first pill never appeared');
  else if (Math.abs(pillAt.t - PILL1.at) > SCAN.tol) fail.push('the first pill appears at ' + pillAt.t.toFixed(2) + 's, not about ' + PILL1.at.toFixed(2) + ' (SCAN.len is ' + SCAN.len + ', the page took ' + (pillAt.t - PRESS1.at).toFixed(2) + ')');
  else console.log('  the page\'s scan took ' + (pillAt.t - PRESS1.at).toFixed(2) + 's to the first pill, against SCAN.len ' + SCAN.len);
  const cleared = at(AGAIN.at + 0.10);
  if (!cleared || cleared.val !== '' || cleared.resOn || cleared.lines.length !== 1) fail.push('check another link did not clear the page: "' + (cleared && cleared.val) + '", ' + (cleared && cleared.lines.length) + ' lines');
  const typed = at(TYPE.done + 0.05);
  if (!typed || typed.val !== FOG.real) fail.push('the field holds "' + (typed && typed.val) + '" when the typing is done');
  /* letter by letter: on every frame of the typing the field holds exactly the prefix the clock says */
  for (const o of state.observed) if (o.t >= TYPE.from && o.t < PRESS2.at && o.val !== typedAt(o.t)) { fail.push('the typing is not letter by letter: "' + o.val + '" at ' + o.t.toFixed(2) + ', where the clock says "' + typedAt(o.t) + '"'); break; }
  const ok = at(PILL2.at + 0.45);
  if (!ok || !ok.resOn) fail.push('the nothing found pill is not up 0.45s after its moment');
  if (ok) {
    if (ok.pill.cls !== 'ok' || ok.pill.word !== 'nothing found') fail.push('the second pill is "' + ok.pill.cls + ' ' + ok.pill.word + '", not nothing found');
    if (ok.lines.length !== 9) fail.push('the second scan has ' + ok.lines.length + ' lines, not nine');
    const green = ok.lines.slice(0, 7).every(l => l.cls === 'ok');
    if (!green) fail.push('the second scan is not all green: ' + ok.lines.map(l => l.cls || 'grey').join(', '));
    if (!/last/.test(ok.lines[8].cls) || ok.lines[7].cls !== '') fail.push('the second scan\'s last two lines are not the grey one and the bold one');
    if (ok.hostText !== FOG.host.slice(FOG.hostShown.length) || ok.hostChars !== FOG.n) fail.push('the page\'s address line fogs "' + ok.hostText + '", ' + ok.hostChars + ' letters, not the host\'s tail');
  }
  const pill2 = state.observed.find(o => o.t >= PRESS2.at && o.resOn);
  if (!pill2) fail.push('the second pill never appeared');
  else if (Math.abs(pill2.t - PILL2.at) > SCAN.tol) fail.push('the second pill appears at ' + pill2.t.toFixed(2) + 's, not about ' + PILL2.at.toFixed(2));
  /* the page's own mascot rode its caret while a line typed */
  const riding = at(PRESS1.at + 1.0);
  if (!riding || Math.hypot(riding.ex, riding.ey) < 0.5) fail.push('the page\'s mascot is not on its caret while the lines type: ' + (riding && riding.ex) + ', ' + (riding && riding.ey));
  if (state.rest.scrollTop !== 0 || (ok && ok.scrollTop !== 0)) fail.push('the page scrolled, and nothing here asked it to');
}

/* ---------- the fog is fog: nothing readable ----------
   the rendered stills, read back: the fogged band in the field is flatter
   than the readable letters beside it, and so is the fogged host in the
   page's own line. the blur is wider than the letters are tall. */
{
  const fogStill = state.stills.find(s => s.name === 'b-s4-fog'), okStill = state.stills.find(s => s.name === 'c-s4-nothing-found');
  const font = state.rest && state.observed[0] ? 13 : 13;
  if (FOG.blur < font * 0.65) fail.push('the blur is ' + FOG.blur + ' px on ' + font + ' px letters, which reads');
  if (FOG.tint < 0.85) fail.push('the puffs are ' + FOG.tint + ' of the muted grey, which shows the letters through');
  for (const [sl, what] of [[fogStill, 'the fog still'], [okStill, 'the nothing found still']]) {
    const file = sl && path.join(VERIFY, sl.name + '.png');
    if (!sl || !sl.box || !fs.existsSync(file)) { fail.push(what + ' has no fog on it to read'); continue; }
    const fog = lumaOf(file, sl.box.fog), clear = lumaOf(file, sl.box.clear);
    console.log('  ' + what + ': the readable letters spread ' + clear.sd + ' in luma, the fog ' + fog.sd + ' (' + fog.n + ' px)');
    if (!fog.n || !clear.n) fail.push(what + ' has an empty fog box');
    else if (fog.sd > clear.sd * 0.5) fail.push(what + ': the fog spreads ' + fog.sd + ' in luma against the letters\' ' + clear.sd + ', which is not fog');
    if (sl.box.term) {
      const term = lumaOf(file, sl.box.term);
      console.log('  ' + what + ': the fogged host in the page\'s line spreads ' + term.sd + ' in luma');
      if (term.n && term.sd > clear.sd * 0.5) fail.push(what + ': the host in the page\'s line is not fogged enough, ' + term.sd);
    } else if (sl === okStill) fail.push('the nothing found still has no fog on the page\'s address line');
  }
}

/* ---------- the end card is clean: nothing of the scenes is left ---------- */
{
  const c = state.census;
  for (const k of ['bub', 'fly', 'phone', 'cap3', 'cap4', 'rg']) if (c[k] > 0.004) fail.push('the end card still carries ' + k + ' at opacity ' + c[k]);
  for (const k of ['wm', 'addr', 'him']) if (c[k] < 0.996) fail.push('the end card\'s ' + k + ' is at opacity ' + c[k]);
}

/* ---------- no colour but the house's: the red on the pulse, the muted grey on the fog ---------- */
{
  const mine = sceneHtml(plan).split('==== this clip\'s own css starts here ====')[1];
  if (/var\(--accent\)/.test(mine)) fail.push('the accent is painted, and nothing here is green');
  if ((mine.match(/var\(--red\)/g) || []).length !== 4) fail.push('the red is painted somewhere other than the pulse\'s two stops and the ring\'s two');
  if ((mine.match(/var\(--muted\)/g) || []).length !== 5) fail.push('the muted grey is painted somewhere other than the fog, the time and the address');
  /* the notification's own three colours, painted where they are meant to be and nowhere else */
  const own = { card: 1, avatar: 1, link: 2 };
  for (const [k, n] of Object.entries(own)) {
    const hex = NOTE.colors[k];
    const got = (mine.match(new RegExp(hex, 'gi')) || []).length;
    if (got !== n) fail.push('the ' + k + ' colour ' + hex + ' is painted ' + got + ' time(s), not ' + n);
  }
  /* the module's own css sits between the marker and his zone rule; the hexes counted are this clip's */
  const ownCss = mine.slice(mine.indexOf('#m-zone{opacity'));
  const hexes = new Set((ownCss.match(/#[0-9a-f]{6}\b/gi) || []).map(h => h.toLowerCase()));
  const allowed = new Set([...Object.values(NOTE.colors), '#ffffff', '#06070a']);
  for (const h of hexes) if (!allowed.has(h)) fail.push('a colour of its own is painted: ' + h);
  if (/url\(|<img|\.png|\.jpg|\.svg/.test(mine.split('<body>')[0].replace(/@font-face[^}]*}/g, ''))) fail.push('the fog carries a picture');
  if (/--iris/.test(mine)) fail.push('the iris is overridden, and his eyes stay the module\'s');
}

/* ---------- the module's own report ---------- */
for (const st of rep60.states) if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
if (rep60.outside.units > 0) fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the sound is the voice and nothing else ---------- */
{
  if (lu && lu.ok) {
    if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
    if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  } else fail.push('ebur128 said nothing about the finished file');
  if (peak.reduction > MAX_REDUCTION + 1e-6) fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + MAX_REDUCTION + ' dB this clip allows');
  for (let i = 0; i < LINES.length - 1; i++) {
    const a = Math.round((SOUND[i].end + POST + 0.02) * SR), b = Math.round((SOUND[i + 1].start - PRE - 0.02) * SR);
    let m = 0; for (let j = a; j < b; j++) m = Math.max(m, Math.abs(best.buf[j]));
    if (m > 1e-4) fail.push('something sounds between lines ' + (i + 1) + ' and ' + (i + 2));
  }
}

/* ---------- the fast things, and nothing is a still ---------- */
if (headStep.d > STEP_CEIL) fail.push('his centre moves ' + headStep.d + ' css px on one frame at 60');
if (BLUR && !BLUR_ARG && FASTEST / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FASTEST / SUB).toFixed(2) + ' css px between samples');
{
  let repeats = 0, first = null, smallest = Infinity;
  for (let i = 1; i < state.sigs.length; i++) {
    const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
    if (d === 0) { repeats++; if (first == null) first = i; }
    smallest = Math.min(smallest, d);
  }
  console.log('  liveness: smallest change between frames ' + smallest.toExponential(2) + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
  if (repeats) fail.push(repeats + ' pairs of identical frames, the first at frame ' + first);
}

console.log('\n  outstanding');
console.log('    the scene starts are the read\'s plus ' + AFTER_LINE + ', floored by the page\'s pills: ' + SC.map(b => b.toFixed(2)).join(' / ') + ', end ' + END);
console.log('    the phone is the real page; the lines, their colours and both pills are the page\'s own');
console.log('    the fog covers the host in the page\'s address line as well as the field, or the line would print it');
console.log('    the glow is the module\'s own two layers, not pushed; the red is one pulse behind him');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
