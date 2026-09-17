/* the boring tek — post30. the cleaner announcement.

   dark only, 1080x1920, six lines read by edge's andrew, about 23 seconds.
   slow first, then faster. voice only on the bus: no ticks, no beeps, no
   fault, einz adds the music outside.

     one    0 to 4      a chat window card, the house dark card, a small
                        header with three dots. a reply types in line by
                        line with a caret, three short lines, nunito. he sits
                        small in the card's bottom right corner, turned a
                        third toward the text, eyes neutral. the claude mark
                        pops in over the card on `claude`, the chat g p t
                        mark beside it on `chat`; both go with the card.
     two    4 to 7      he leans in. a thin scan line sweeps once across the
                        text, left to right, the cleaner's own line turned on
                        its side, and where it passes eight red dots pop in
                        between letters with a soft halo and pulse. two of
                        them get a tiny mono tag, `zero width` and `soft
                        hyphen`. then the card tilts a shade and slides down
                        into a message bubble on the right with the dots
                        still in it, one label over it: `hidden marks came
                        along`. he rides the card down, watching it, and
                        stays on the bubble's corner.
     three  7 to 10     the bubble pops out. he springs from the corner to
                        the middle at the house size with the module's own
                        glow, turns to the lens, goes delighted, the wordmark
                        pops under him, then one line: `watermark remover,
                        free`.
     four   10 to 17    a phone in the middle, its screen the real cleaner
                        page, `tools/clean/index.html` served into an iframe at
                        390 css px and scaled onto the screen, dark theme. a
                        file icon drops into the zone at +1.0 and the page's
                        own mascot follows it with its eyes; the pointer
                        presses `clean my text or file` at +3.0; the page runs
                        its own scan and its own card unfolds at +3.95 with
                        `found 6 hidden characters, 1 odd space and 3 curly
                        marks, removed.`; the download button lights once at
                        +5.5.
     five   +0.4        the phone stays, 0.4s after `done`. the pointer taps EN, RU, LV in the
                        header on the words `english`, `russian`, `latvian`,
                        and the page under it is the russian page, then the
                        latvian one, each at the same point in the same run.
                        then one line under the phone: `nothing leaves your
                        browser`.
     six    +0.5        the phone shrinks away, 0.5s after `browser`. he springs in again, calm, the
                        wordmark under him and `theboringtek.com/tools` small
                        under that. held to the end.

   the scene starts are the brief's, floored by the read: a scene never
   starts before the line before it has finished sounding plus 0.30, so a
   long take pushes what follows rather than being cut. scenes five and six
   are the exception: they start 0.40 and 0.50 after the line before them
   stops, whatever the brief said, because the brief's clock left three
   seconds of air after `done` and again after `browser`.

   **every line is subtitled**: nunito, white, one or two short lines,
   centred, always under the main thing on screen (the card, the bubble,
   the wordmark's line, the phone, the address), never over it and never
   below the bottom margin. the cards are cut to the read's own words, and
   the screen carries no full stop, post29's rule.

   **the two logos are assets**, `demo/assets/logo-claude.png` and
   `logo-chatgpt.png`, placed as backgrounds at their own ratio with their
   ink solved to one height, post19's way: nothing here touches their
   pixels. they pop over the chat card on the words that name them.

   **the read is edge at minus five per cent with a 300ms stop at every
   full stop** instead of the engine's own long one: a reader talking rather
   than reading. the endpoint refuses ssml breaks, so the stop is built in
   `take()`, see there.

     node post30.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post30.mjs         the fast preview pass
     node post30.mjs --voice             the read and the clock only, no browser
     node post30.mjs --blur              60fps with the shutter open, solved
     node post30.mjs --blur=6            the same with the count said outright
     node post30.mjs --keep-frames       leave the jpegs on disk
     node post30.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post30-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs` and nothing here reaches inside it.** two
   states, neutral and delighted, no hands, no bubble. the two entrances and
   the exit are one translate composed onto `frame.card`, post29's pattern for
   the jump; the shadow is declined, post26. `bias: 0`: he talks to the lens.

   **the phone is the real page.** three iframes, `/tools/clean/`,
   `/ru/tools/clean/` and `/lv/tools/clean/`, served straight off the repo's files by this script's own
   server, all three driven identically and one visible at a time. the page
   keeps its own script: the drop is a synthetic `drop` event with a real
   `File` in it, the press is `runBtn.click()`, the eyes follow synthetic
   `pointermove`s, and the card's line is whatever the page's own cleaner
   says about the file, which this script only reads back and asserts.
   three things are taken over so the render is a function of time: the
   page's rAF loop is driven at sixty ticks a second between frames, every
   css animation and transition in it is paused and set to the clip's clock,
   and `scrollIntoView` is replaced by a scroll this script eases itself.

   **the voice is edge, on purpose,** post29's rule: every take asks for
   `provider: 'edge'` and the sidecar is refused from anywhere else. `chat g p
   t` is spelled with spaces so the letters are read one by one.

   **no dot on a caption**, post29's rule, so the third scene's second line is
   `watermark remover, free` and the read keeps its stop. the reply in scene
   one is prose and keeps its full stops, because it is meant to look like
   a reply.

   **the scan line is the one place the accent is painted**, and it is the
   cleaner's own line: a one px accent rule with a soft band around it,
   turned on its side. the red is on the dots, their halos and the two tags,
   and nowhere else. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCues, mascotCss, mascotMarkup,
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD, GRID,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import { writeWav, applyGain, limit, loudness, decode, SR } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post30');
const SUBS = path.join(OUT, 'subframes-post30');
const VERIFY = path.join(OUT, 'verify-post30');

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
   the brief's scene starts. each is floored once the takes are measured: a
   scene starts no earlier than the line before it stops sounding plus
   AFTER_LINE. `END` is floored the same way off the last line. */
const BRIEF = [0, 4, 7, 10, 17, 21];
const BRIEF_END = 23.5;
const AFTER_LINE = 0.30;
/* scenes five and six start this long after the line before them stops,
   and the brief's own 17 and 21 are not a floor there: the read leaves
   three seconds of air otherwise. */
const GAP_AFTER = { 3: 0.40, 4: 0.50 };
const AFTER_READ = 0.60;
const SC = BRIEF.slice();
let END = BRIEF_END;
let SECONDS = 0;

/* ---------- the copy, and the read ----------
   the read keeps its stops. `chat g p t` is spaced so the letters are read
   one by one. the rate is a shade quick on the two long lines so they fit
   their scenes without the floor moving much. */
const VOICE = 'calm';
const RATE = '-5%';
const BREAK_MS = 300;
const LINES = [
  { text: 'ai tools like claude and chat g p t hide marks in your text. you cannot see them.', rate: RATE, pitch: '+1Hz' },
  { text: 'you paste it somewhere, and the marks go with it.', rate: RATE, pitch: '+1Hz' },
  { text: 'so we made a remover. free.', rate: RATE, pitch: '+2Hz' },
  { text: 'drop a file or paste your text. press the button. done.', rate: RATE, pitch: '+1Hz' },
  { text: 'it works in english, russian and latvian. and nothing leaves your browser.', rate: RATE, pitch: '+1Hz' },
  { text: 'enjoy it for free. the boring tek.', rate: RATE, pitch: '+2Hz' },
];
/* ---------- the subtitles ----------
   one card per sentence or so, cut to the read's own words by index into
   the take, the screen lines broken by hand so nothing wraps. no full stop
   on screen; the read keeps its stops. `chat g p t` is spoken letter by
   letter and written as one word. */
const SUBTITLES = [
  { line: 0, words: [0, 13], lines: ['ai tools like claude and chatgpt', 'hide marks in your text'] },
  { line: 0, words: [14, 17], lines: ['you cannot see them'] },
  { line: 1, words: [0, 9], lines: ['you paste it somewhere', 'and the marks go with it'] },
  { line: 2, words: [0, 5], lines: ['so we made a remover, free'] },
  { line: 3, words: [0, 6], lines: ['drop a file or paste your text'] },
  { line: 3, words: [7, 10], lines: ['press the button, done'] },
  { line: 4, words: [0, 6], lines: ['it works in english,', 'russian and latvian'] },
  { line: 4, words: [7, 11], lines: ['and nothing leaves your browser'] },
  { line: 5, words: [0, 3], lines: ['enjoy it for free'] },
  { line: 5, words: [4, 6], lines: ['the boring tek'] },
];
const ST = { size: 22, lh: 1.3, weight: 600, high: 700, low: 782, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 6 };
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ---------- what is on the screen ----------
   every string a viewer reads, in one place, so the copy guard can walk them. */
/* the chat window. the house dark card: --field on --bg, a --line border,
   18px radius, a small header with three dots and a hairline under it. the
   reply is three short lines that type in with a caret. */
const CARD = { w: 380, h: 200, left: 80, top: 330, radius: 18, head: 34, padX: 20, textTop: 52 };
const TXT = {
  lines: ['sure, here is the summary.', 'the plan is solid and the', 'timeline works for everyone.'],
  /* where the hidden marks sit: a line and the character the dot goes in
     front of. eight of them, inside words. */
  marks: [[0, 3], [0, 21], [1, 2], [1, 13], [1, 19], [2, 4], [2, 16], [2, 24]],
  size: 18, lh: 1.5, from: 0.5, cps: 26, linePause: 0.30, caretHz: 2.4,
};
TXT.w = CARD.w - 2 * CARD.padX;
/* two of the dots are named, in a tiny mono tag beside them */
const TAGS = [{ dot: 1, text: 'zero width' }, { dot: 4, text: 'soft hyphen' }];
const TAG = { size: 9, dx: 7, dy: -13 };
/* the message bubble the card slides into: right aligned on the safe edge,
   lower in the frame. its background lives inside the message group at the
   text's own offset, so the group moves and the text lands in it. */
const CHAT = { w: 372, pad: 16, padY: 14, top: 540, right: SAFE_CSS.right, radius: 18, tail: 4 };
CHAT.left = VW - CHAT.right - CHAT.w;
CHAT.inLeft = CARD.padX - CHAT.pad;
CHAT.inTop = CARD.textTop - CHAT.padY;
const MSG = { toX: +(CHAT.left - CHAT.inLeft - CARD.left).toFixed(3), toY: +(CHAT.top - CHAT.inTop - CARD.top).toFixed(3), tilt: 2.5 };
const LABEL = { text: 'hidden marks came along', size: 14, gap: 32 };
/* the two marks over the card, on the words that name them. assets, placed
   at their own ratio with the ink solved to one height, post19's way. */
const LOGOS = {
  ink: 45, gap: 36, cy: 0, popFor: 0.40, popFrom: 0.6,
  files: [{ key: 'claude', file: 'logo-claude.png', say: 'claude' }, { key: 'chatgpt', file: 'logo-chatgpt.png', say: 'chat' }],
};
LOGOS.cy = CARD.top - 32 - LOGOS.ink / 2;
const ASSETS = path.join(HERE, 'assets');
const DOT = { d: 5, halo: 18, period: 1.3, lo: 0.42, popFor: 0.30, popFrom: 1.8 };
/* the scan, on the second scene's clock: one pass across the text on the
   site's ease, the cleaner's own line on its side */
const SCAN = { at: 0.45, for: 0.75, w: 26, over: 14 };
/* the lean, on the second scene's clock, and the small size in the corner */
const LEAN = { at: 0, for: 0.45, s: 0.50, dx: -14, dy: -6 };
const SMALL = { s: 0.42, pad: 16 };
const HEAD_Y = 316;
const SIZE = 148;
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 300, lh: 1.16, top: 410, minCapPx: 50 };
const LINE3 = { text: 'watermark remover, free', size: 28, top: 632 };
const ADDR = { text: 'theboringtek.com/tools', size: 18, top: 636 };
const PHONE = { w: 330, h: 660, left: 105, top: 105, radius: 40, bezel: 12, vw: 390 };
PHONE.sw = PHONE.w - 2 * PHONE.bezel;
PHONE.sh = PHONE.h - 2 * PHONE.bezel;
PHONE.scale = +(PHONE.sw / PHONE.vw).toFixed(6);
PHONE.vh = Math.round(PHONE.sh / PHONE.scale);
const FILE = { name: 'essay.txt' };
/* the file the page cleans: six hidden characters, one odd space, three curly
   marks, every one of them written as an escape and never as a literal. the
   bom sits mid text because a decoder strips a leading one. */
FILE.text = 'thanks for the update. the plan looks\u200B solid and the\u00A0timeline\u200C works for us.\u2060 we will\u00AD confirm \u201Cthe budget\u201D by friday\u2014 ok\u200E.\uFEFF';
FILE.expect = { hidden: 6, space: 1, curly: 3 };
const CARD_LINE = 'found 6 hidden characters, 1 odd space and 3 curly marks, removed.';
const READY_LINE = 'essay.txt is in.';

/* ---------- the action inside the phone, on the fourth scene's clock ---------- */
const ICON = { show: 0.75, fall: 0.80, land: 1.15, enter: 1.06, gone: 1.60, w: 34, h: 42, dx: 72, dy: 8 };
const PRESS = { at: 3.0 };
/* the download button lights once the scroll has settled, which on this
   clock is before the taps begin */
const LIT = { at: 4.85, for: 0.35 };
const TAP = { for: 0.25, en: 0, ru: 0, lv: 0, appear: 0 };
const CUR = { size: 22, keys: [] };
const SCROLL = { for: 0.8, pad: 16 };

/* ---------- the entrances, the exit and the pops ---------- */
const SPRING = { for: 0.50 };                  /* the corner to the middle */
const EXIT = { for: 0.40, to: 0.6 };
const IN1 = { at: 0 }, OUT1 = { at: 0 }, IN2 = { at: 0 };
const DELIGHT = { at: 0 };
const CALM = { at: 0 };
const SLIDE = { at: 0, for: 0.60 };
const LABEL_IN = { at: 0, for: 0.30 };
const BUB_OUT = { at: 0, for: 0.28 };
const WM1 = { at: 0, for: 0.09 }, SUB1 = { at: 0, for: 0.30 };
const WM_OUT = { at: 0, for: 0.25 };
const PHONE_IN = { at: 0, for: 0.50 }, PHONE_OUT = { at: 0, for: 0.35 };
const WM2 = { at: 0, for: 0.09 }, ADDR_IN = { at: 0, for: 0.30 };

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
/* 56 rather than post29's 42: the entrance is a 714 css px rise and its
   fastest frame is 51 at the curve above; the open shutter still solves it
   inside SUB_MAX. */
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
/* the entrance from below. the site's spring is steepest on its first frame,
   and 714 css px of travel on it is an 86 px first frame, so the rise is the
   same overshoot with a slow start: 51 px at its fastest over 0.7s, 32 px
   past home before it settles. measured, see the fast things. */
const RISE = bezier(.5, 0, .3, 1.3);
const GLIDE = bezier(.45, 0, .55, 1);          /* symmetric, for the scan's pass */
/* leaving: a plain acceleration. the site's ease reversed is six times as
   steep at its end as a line, and a 700 css px exit on it is a 180 px frame. */
const EASE_IN = p => p * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
const bare = w => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

/* ---------- the marks, measured ----------
   the png header for the file's size, ffmpeg for the alpha bounding box of
   the ink, and the element's box solved so the ink is LOGOS.ink tall with
   its centre on its spot. the box keeps the file's own ratio. post19's. */
function pngFacts(file) {
  const b = fs.readFileSync(file);
  if (!(b.length > 24 && b.readUInt32BE(0) === 0x89504e47)) throw new Error(path.relative(ROOT, file) + ' is not a png');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}
function inkBox(file, w, h) {
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });
  if (raw.length !== w * h * 4) throw new Error(path.relative(ROOT, file) + ' decoded to ' + raw.length + ' bytes against ' + (w * h * 4));
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (raw[(y * w + x) * 4 + 3] <= 10) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error(path.relative(ROOT, file) + ' is empty');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
const MARKS_FILES = LOGOS.files.map((f, i) => {
  const file = path.join(ASSETS, f.file);
  if (!fs.existsSync(file)) throw new Error('no ' + path.relative(ROOT, file) + ' — the marks are assets, not something this file draws');
  const p = pngFacts(file);
  const ink = inkBox(file, p.w, p.h);
  const sc = LOGOS.ink / ink.h;
  const inkW = ink.w * sc;
  return { ...f, file, ...p, ink, sc: +sc.toFixed(6), box: { w: +(p.w * sc).toFixed(3), h: +(p.h * sc).toFixed(3) }, inkW: +inkW.toFixed(2), inkH: +(ink.h * sc).toFixed(2), i };
});
/* side by side, the pair centred on the frame: each ink's centre on its spot */
{
  const total = MARKS_FILES.reduce((a, m) => a + m.inkW, 0) + LOGOS.gap * (MARKS_FILES.length - 1);
  let x = VW / 2 - total / 2;
  for (const m of MARKS_FILES) {
    m.cx = +(x + m.inkW / 2).toFixed(3);
    m.left = +(m.cx - (m.ink.x + m.ink.w / 2) * m.sc).toFixed(3);
    m.top = +(LOGOS.cy - (m.ink.y + m.ink.h / 2) * m.sc).toFixed(3);
    x += m.inkW + LOGOS.gap;
  }
}
const markInk = m => ({ left: +(m.cx - m.inkW / 2).toFixed(2), top: +(LOGOS.cy - m.inkH / 2).toFixed(2), right: +(VW - m.cx - m.inkW / 2).toFixed(2), bottom: +(VH - LOGOS.cy - m.inkH / 2).toFixed(2) });

/* ---------- the read ----------
   one take a line, cached on the copy and the delivery, post29's shape, edge
   by name and refused from anywhere else. */
/* the endpoint refuses ssml: a `<break>` in any spelling, `time` or
   `strength`, single or double quoted, closes the connection before a byte
   of audio, and the same line without it reads fine (measured, three
   variants). so the 300ms stop is built here instead: every sentence is
   its own take, cached on its own copy, and the line is the sentences laid
   end to end with exactly BREAK_MS of silence between one's last sound and
   the next's first. the words are offset with their sentence. */
async function take(i) {
  const L = LINES[i];
  const parts = L.text.split(/(?<=[.!?])\s+/);
  const takes = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post30-l' + (i + 1) + (parts.length > 1 ? 's' + (k + 1) : '');
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
  /* the line, assembled: sentence k+1 starts sounding BREAK_MS after
     sentence k stops sounding. `pcm` is the line's own audio. */
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
    /* each sentence's file is cut at its own sound edges plus the fades'
       room, so one file's trailing silence never lies over the next's sound */
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

/* ---------- where he is ----------
   home is the middle of the frame across, HEAD_Y down. through the first two
   scenes he sits small in the card's bottom right corner, leans in on the
   second, then springs from there to home on the third. the exit drops him
   below the frame and the last entrance rises from there. */
const R_FULL = HEAD.plate.s / 2 * (SIZE / GRID);
const HOME = { x: VW / 2, y: HEAD_Y };
const R_SMALL = R_FULL * SMALL.s;
const CORNER = { x: +(CARD.left + CARD.w - SMALL.pad - R_SMALL).toFixed(3), y: +(CARD.top + CARD.h - SMALL.pad - R_SMALL).toFixed(3) };
/* the message group's own motion: where it is and how far it is tilted, on
   the slide. read by the frame and by his placement, so he rides it. */
function msgMotion(t) {
  const p = span(t, SLIDE.at, SLIDE.at + SLIDE.for);
  const e = EASE(p);
  return { x: +(MSG.toX * e).toFixed(3), y: +(MSG.toY * e).toFixed(3), rot: +(MSG.tilt * Math.sin(Math.PI * p)).toFixed(3), p };
}
/* his spot in the card's corner, carried through the group's transform:
   the offset from the card's centre turned by the tilt, plus the travel. */
function onCard(t, c) {
  const m = msgMotion(t);
  const gx = CARD.left + CARD.w / 2, gy = CARD.top + CARD.h / 2;
  const ox = HOME.x + c.dx - gx, oy = HOME.y + c.dy - gy;
  const th = m.rot * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  return { dx: +(gx + m.x + ox * cs - oy * sn - HOME.x).toFixed(3), dy: +(gy + m.y + ox * sn + oy * cs - HOME.y).toFixed(3), s: c.s, rot: m.rot, on: 1, o: 1 };
}
function placeAt(t) {
  const c0 = { dx: CORNER.x - HOME.x, dy: CORNER.y - HOME.y, s: SMALL.s };
  const c1 = { dx: c0.dx + LEAN.dx, dy: c0.dy + LEAN.dy, s: LEAN.s };
  if (t < LEAN.at) return { ...c0, rot: 0, on: 1, o: 1 };
  if (t < IN1.at) {
    const p = EASE(span(t, LEAN.at, LEAN.at + LEAN.for));
    return onCard(t, { dx: +lerp(c0.dx, c1.dx, p).toFixed(3), dy: +lerp(c0.dy, c1.dy, p).toFixed(3), s: +lerp(c0.s, c1.s, p).toFixed(5) });
  }
  if (t < IN1.at + SPRING.for) {
    const c2 = onCard(IN1.at, c1);
    const p = RISE(span(t, IN1.at, IN1.at + SPRING.for));
    return { dx: +lerp(c2.dx, 0, p).toFixed(3), dy: +lerp(c2.dy, 0, p).toFixed(3), s: +lerp(c1.s, 1, p).toFixed(5), rot: +lerp(c2.rot, 0, p).toFixed(3), on: 1, o: 1 };
  }
  if (t < OUT1.at) return { dx: 0, dy: 0, s: 1, rot: 0, on: 1, o: 1 };
  /* the exit and the last entrance happen where he stands: a shrink and a
     fade out, a spring and a fade in. a drop through the bottom edge or a
     rise from it would cross the subtitle under him. */
  if (t < OUT1.at + EXIT.for) { const p = span(t, OUT1.at, OUT1.at + EXIT.for); return { dx: 0, dy: 0, s: +lerp(1, EXIT.to, EASE_IN(p)).toFixed(5), rot: 0, on: 1, o: +(1 - span(p, 0.25, 1)).toFixed(4) }; }
  if (t < IN2.at) return { dx: 0, dy: 0, s: EXIT.to, rot: 0, on: 0, o: 0 };
  if (t < IN2.at + SPRING.for) return { dx: 0, dy: 0, s: +lerp(EXIT.to, 1, RISE(span(t, IN2.at, IN2.at + SPRING.for))).toFixed(5), rot: 0, on: 1, o: +span(t, IN2.at, IN2.at + 0.15).toFixed(4) };
  return { dx: 0, dy: 0, s: 1, rot: 0, on: 1, o: 1 };
}
/* where his clearance is checked: whenever he is drawn */
const isHome = t => placeAt(t).on === 1;
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
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}

/* ---------- the typing ----------
   a fixed pace, a pause at each line end, a caret at the end of the line
   being typed and blinking after, gone when the scan starts. */
const TYPED = [];
for (let li = 0; li < TXT.lines.length; li++) {
  for (let ci = 0; ci < TXT.lines[li].length; ci++) {
    const before = TYPED.length;
    TYPED.push({ li, ci, t: +(TXT.from + before / TXT.cps + li * TXT.linePause).toFixed(4) });
  }
}
const typedEnd = TYPED[TYPED.length - 1].t;
const charsAt = t => TYPED.filter(e => e.t <= t).length;

/* ---------- the dots ----------
   each pops the frame the scan line reaches it, which is solved once the
   dots are measured: `DOT.at[i]` on the clip's clock. */
DOT.x = [];
DOT.at = [];
function scanX(t) {
  /* a symmetric glide rather than the site's ease out: on the ease the
     whole text is crossed in the first tenth of a second and every dot pops
     at once. on the glide the pass reads as a pass and the dots spread. */
  const p = GLIDE(span(t, SCAN.at, SCAN.at + SCAN.for));
  return { x: +lerp(-SCAN.over, TXT.w + SCAN.over, p).toFixed(3), p };
}
function solveDots() {
  for (let i = 0; i < DOT.x.length; i++) {
    let at = SCAN.at + SCAN.for;
    for (let f = Math.floor(SCAN.at * 60); f <= Math.ceil((SCAN.at + SCAN.for) * 60); f++) {
      if (scanX(f / 60).x >= DOT.x[i]) { at = f / 60; break; }
    }
    DOT.at[i] = +at.toFixed(4);
  }
}

/* ---------- the pointer ----------
   a list of keys on the clip's clock, each a place inside the phone's screen
   named after the element it is over, resolved against the page's own rects
   on the frame it is drawn. between keys it moves on the site's ease. */
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
function iconAt(t, R) {
  const s4 = SC[3];
  const t4 = t - s4;
  if (t4 < ICON.show || t4 >= ICON.gone) return { o: 0, x: 0, y: 0, sx: 1, sy: 1 };
  const x = R.mascot.cx + ICON.dx, land = R.mascot.cy + ICON.dy;
  const y0 = -ICON.h - 10;
  const p = span(t4, ICON.fall, ICON.land);
  const y = lerp(y0, land, p * p);
  /* the landing squash, and then it is taken in */
  let sx = 1, sy = 1;
  if (t4 >= ICON.land) {
    const q = span(t4, ICON.land, ICON.land + 0.22);
    const k = 0.16 * (1 - POP(q));
    sx = 1 + k; sy = 1 - k;
  }
  const gone = span(t4, ICON.gone - 0.25, ICON.gone);
  const o = span(t4, ICON.show, ICON.show + 0.08) * (1 - gone);
  const sc = 1 - 0.4 * EASE(gone);
  return { o: +o.toFixed(4), x: +x.toFixed(2), y: +y.toFixed(2), sx: +(sx * sc).toFixed(4), sy: +(sy * sc).toFixed(4) };
}

/* ---------- the subtitles, on the clock ----------
   each card runs from its first word less a lead to its last word plus a
   tail, never into the next card, and sits in the high slot unless the
   phone is up, when it sits under the phone. filled in once the takes are
   measured. */
const CARDS = [];
function subAt(t) {
  const out = { o: 0, y: 0, i: -1 };
  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i];
    if (t < c.from || t >= c.to) continue;
    const o = Math.min(1, span(t, c.from, c.from + ST.fadeIn), 1 - span(t, c.to - ST.fadeOut, c.to));
    return { o: +o.toFixed(4), y: +(ST.rise * (1 - EASE(span(t, c.from, c.from + ST.fadeIn)))).toFixed(3), i, slot: c.slot };
  }
  return out;
}
function logosAt(t) {
  const cardO = 1 - span(EASE(msgMotion(t).p), 0.15, 0.75);
  return MARKS_FILES.map(m => {
    const p = span(t, m.at, m.at + LOGOS.popFor);
    return { o: +(span(t, m.at, m.at + 0.10) * cardO).toFixed(4), sc: +lerp(LOGOS.popFrom, 1, POP(p)).toFixed(4) };
  });
}

/* ---------- what one frame is ---------- */
function frameAt(t, f, R) {
  const P = placeAt(t);
  /* one: the reply types. two: the scan, the dots, the slide into the bubble. */
  const chars = charsAt(t);
  const typing = t < typedEnd + 0.02;
  const caretOn = t < SCAN.at && (typing || Math.floor(t * TXT.caretHz * 2) % 2 === 0);
  const sc = scanX(t);
  const scan = { x: sc.x, o: +(sc.p <= 0 || sc.p >= 1 ? 0 : Math.min(1, span(sc.p, 0, 0.08), 1 - span(sc.p, 0.90, 1))).toFixed(4) };
  const dots = DOT.at.map((at, i) => {
    const on = span(t, at, at + 0.12);
    const pop = POP(span(t, at, at + DOT.popFor));
    const pulse = DOT.lo + (1 - DOT.lo) * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t - at - DOT.popFor) / DOT.period + i * 0.9));
    const o = t < at + DOT.popFor ? on : on * pulse;
    const scl = t < at + DOT.popFor ? lerp(DOT.popFrom, 1, pop) : 0.92 + 0.16 * (pulse - DOT.lo) / (1 - DOT.lo);
    return { o: +o.toFixed(4), sc: +scl.toFixed(4) };
  });
  const tags = TAGS.map(g => ({ o: +EASE(span(t, DOT.at[g.dot] + 0.25, DOT.at[g.dot] + 0.45)).toFixed(4) }));
  const slide = EASE(span(t, SLIDE.at, SLIDE.at + SLIDE.for));
  const labelP = span(t, LABEL_IN.at, LABEL_IN.at + LABEL_IN.for);
  /* three: the bubble pops out */
  const outP = span(t, BUB_OUT.at, BUB_OUT.at + BUB_OUT.for);
  const outSc = t < BUB_OUT.at + 0.08 ? lerp(1, 1.05, EASE(span(t, BUB_OUT.at, BUB_OUT.at + 0.08))) : lerp(1.05, 0.6, EASE_IN(span(t, BUB_OUT.at + 0.08, BUB_OUT.at + BUB_OUT.for)));
  const outO = 1 - span(t, BUB_OUT.at + 0.10, BUB_OUT.at + BUB_OUT.for);
  const mm = msgMotion(t);
  const msg = {
    x: mm.x, y: mm.y, rot: mm.rot,
    cardO: +(1 - span(slide, 0.15, 0.75)).toFixed(4), bubO: +span(slide, 0.30, 0.90).toFixed(4),
    o: +(outP > 0 ? outO : 1).toFixed(4), sc: +(outP > 0 ? outSc : 1).toFixed(4),
  };
  const label = { o: +(EASE(labelP) * (outP > 0 ? outO : 1)).toFixed(4), y: +(8 * (1 - EASE(labelP))).toFixed(3) };
  /* three and six: the wordmark, the line under it */
  const wmOn = (t >= WM1.at && t < WM_OUT.at + WM_OUT.for) || t >= WM2.at;
  const wmIn = t >= WM2.at ? WM2 : WM1;
  const wmO = t >= WM2.at ? 1 : (t >= WM1.at ? 1 - span(t, WM_OUT.at, WM_OUT.at + WM_OUT.for) : 0);
  const l3P = t < WM_OUT.at + WM_OUT.for ? span(t, SUB1.at, SUB1.at + SUB1.for) : 0;
  const l3O = t >= WM_OUT.at ? l3P * (1 - span(t, WM_OUT.at, WM_OUT.at + WM_OUT.for)) : l3P;
  const addrP = span(t, ADDR_IN.at, ADDR_IN.at + ADDR_IN.for);
  /* four and five: the phone */
  const phIn = span(t, PHONE_IN.at, PHONE_IN.at + PHONE_IN.for);
  const phOut = span(t, PHONE_OUT.at, PHONE_OUT.at + PHONE_OUT.for);
  const phone = {
    o: +(span(t, PHONE_IN.at, PHONE_IN.at + 0.20) * (1 - phOut)).toFixed(4),
    sc: +(lerp(0.94, 1, POP(phIn)) * lerp(1, 0.90, EASE(phOut))).toFixed(5),
  };
  const vis = t >= TAP.lv ? 'lv' : t >= TAP.ru ? 'ru' : 'en';
  return {
    t: +t.toFixed(4), f,
    mo: +(P.on * P.o).toFixed(4),
    msg, txt: { chars, caret: caretOn ? 1 : 0 }, scan, dots, tags, label,
    logos: logosAt(t),
    subt: subAt(t),
    wm: {
      o: wmOn ? +wmO.toFixed(4) : 0,
      sc: +(1 + (1 - EASE(span(t, wmIn.at, wmIn.at + wmIn.for))) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    line3: { o: +l3O.toFixed(4), y: +(8 * (1 - EASE(l3P))).toFixed(3) },
    addr: { o: +EASE(addrP).toFixed(4), y: +(8 * (1 - EASE(addrP))).toFixed(3) },
    phone, vis,
    icon: iconAt(t, R),
    cur: cursorAt(t, R),
  };
}

/* ---------- the events inside the phone ----------
   each fires once, in all three pages, on the frame the clock crosses it. */
function eventsAt(t0, t1) {
  const out = [];
  const at = (tt, kind, arg) => { if (tt > t0 && tt <= t1 + 1e-9) out.push({ kind, arg }); };
  at(SC[3] + ICON.enter, 'dragenter');
  at(SC[3] + ICON.land, 'drop', { name: FILE.name, text: FILE.text });
  at(SC[3] + PRESS.at, 'press');
  at(SC[3] + LIT.at, 'lit', true);
  at(SC[3] + LIT.at + LIT.for, 'lit', false);
  for (const k of ['en', 'ru', 'lv']) { at(TAP[k], 'tap', { k, on: true }); at(TAP[k] + TAP.for, 'tap', { k, on: false }); }
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
<title>post30</title>
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
/* over the chat window: the module puts him at z 4, the card is z 3 */
#m-zone{opacity:var(--m-o,1);z-index:5}

/* ---- one and two: the chat window, the reply, the scan, the dots, the bubble ----
   one group holds the window, the bubble's background and the text; the
   group moves and tilts, the two backgrounds cross fade, and the text
   with its dots is carried. */
.msg{position:absolute;left:${CARD.left}px;top:${CARD.top}px;width:${CARD.w}px;height:${CARD.h}px;z-index:3;
  transform-origin:50% 50%;will-change:transform,opacity;pointer-events:none}
.cardbg{position:absolute;inset:0;background:var(--field);border:1px solid var(--line);border-radius:${CARD.radius}px;will-change:opacity}
.cardbg .head{position:absolute;left:0;right:0;top:0;height:${CARD.head}px;display:flex;align-items:center;gap:6px;padding:0 16px;border-bottom:1px solid var(--line)}
.cardbg .head i{display:block;width:8px;height:8px;border-radius:50%;background:var(--muted);opacity:.45}
.bubbg{position:absolute;left:${CHAT.inLeft}px;top:${CHAT.inTop}px;width:${CHAT.w}px;background:var(--pill-on);border:1px solid var(--line);
  border-radius:${CHAT.radius}px ${CHAT.radius}px ${CHAT.tail}px ${CHAT.radius}px;opacity:0;will-change:opacity}
.txt{position:absolute;left:${CARD.padX}px;top:${CARD.textTop}px;width:${TXT.w}px;text-align:left;
  font-family:var(--cap);font-weight:400;font-size:${TXT.size}px;line-height:${TXT.lh};color:var(--fg);white-space:pre}
.txt .ln{display:block;min-height:${TXT.lh}em}
.caret{display:inline-block;width:2px;height:1em;background:var(--fg);vertical-align:text-bottom;transform:translateY(.1em);margin-left:1px}
.dot{position:absolute;width:${DOT.d}px;height:${DOT.d}px;border-radius:50%;background:var(--red);opacity:0;will-change:transform,opacity}
.halo{position:absolute;width:${DOT.halo}px;height:${DOT.halo}px;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(circle,color-mix(in srgb,var(--red) 55%,transparent) 0%,color-mix(in srgb,var(--red) 22%,transparent) 40%,transparent 72%)}
.tag{position:absolute;font-family:var(--mono);font-weight:500;font-size:${TAG.size}px;line-height:1;letter-spacing:.04em;color:var(--red);opacity:0;white-space:nowrap}
.scan{position:absolute;top:${CARD.textTop - 8}px;width:${SCAN.w}px;opacity:0;pointer-events:none;will-change:transform,opacity;
  background-image:linear-gradient(to right,rgba(53,255,106,0) 0%,rgba(53,255,106,.32) 50%,rgba(53,255,106,0) 100%)}
.scan::after{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--accent)}
.label{position:absolute;left:${CHAT.left}px;width:${CHAT.w}px;top:${CHAT.top - LABEL.gap}px;text-align:center;z-index:3;
  font-family:var(--mono);font-weight:500;font-size:${LABEL.size}px;letter-spacing:.06em;color:var(--muted);opacity:0;white-space:nowrap}
/* the two marks, placed as backgrounds at their own ratio: nothing here
   reaches their pixels */
.logo{position:absolute;background-size:100% 100%;background-repeat:no-repeat;opacity:0;transform-origin:50% 50%;will-change:transform,opacity;z-index:3}
${MARKS_FILES.map(m => '#logo-' + m.key + '{left:' + m.left + 'px;top:' + m.top + 'px;width:' + m.box.w + 'px;height:' + m.box.h + 'px;background-image:url(/mark-' + m.key + '.png)}').join('\n')}
/* the subtitles: one block, two slots */
.subt{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ST.high}px;text-align:center;z-index:9;
  font-family:var(--cap);font-weight:${ST.weight};font-size:${ST.size}px;line-height:${ST.lh};color:var(--face);white-space:pre;opacity:0;will-change:transform,opacity}
.subt[data-slot=low]{top:${ST.low}px}
.subt .sl{display:block}

/* ---- three and six: the wordmark, post23's, and the line under it ---- */
.wm{position:absolute;left:50%;top:${WM.top}px;transform:translateX(-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.sub{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${LINE3.top}px;text-align:center;
  font-family:var(--cap);font-weight:600;font-size:${LINE3.size}px;line-height:1.25;color:var(--fg);white-space:nowrap;opacity:0;z-index:8}
.addr{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ADDR.top}px;text-align:center;
  font-family:var(--mono);font-weight:500;font-size:${ADDR.size}px;letter-spacing:.08em;line-height:1.3;color:var(--muted);white-space:nowrap;opacity:0;z-index:8}

/* ---- four and five: the phone ---- */
.phone{position:absolute;left:${PHONE.left}px;top:${PHONE.top}px;width:${PHONE.w}px;height:${PHONE.h}px;
  border-radius:${PHONE.radius}px;background:var(--field);border:1px solid var(--line);
  transform-origin:50% 50%;opacity:0;z-index:6;will-change:transform,opacity}
.screen{position:absolute;left:${PHONE.bezel - 1}px;top:${PHONE.bezel - 1}px;width:${PHONE.sw}px;height:${PHONE.sh}px;
  border-radius:${PHONE.radius - PHONE.bezel}px;overflow:hidden;background:#06070a}
.screen iframe{position:absolute;left:0;top:0;width:${PHONE.vw}px;height:${PHONE.vh}px;border:0;background:#06070a;
  transform:scale(${PHONE.scale});transform-origin:0 0;visibility:hidden}
.ov{position:absolute;left:0;top:0;width:${PHONE.vw}px;height:${PHONE.vh}px;transform:scale(${PHONE.scale});transform-origin:0 0;pointer-events:none}
.icon{position:absolute;left:0;top:0;width:${ICON.w}px;height:${ICON.h}px;margin:${-ICON.h / 2}px 0 0 ${-ICON.w / 2}px;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}
.icon svg{display:block;width:100%;height:100%}
.icon .sheet{fill:var(--field);stroke:var(--fg);stroke-width:1.6;stroke-linejoin:round}
.icon .fold{fill:none;stroke:var(--fg);stroke-width:1.6;stroke-linejoin:round}
.icon .text{fill:none;stroke:var(--muted);stroke-width:1.6;stroke-linecap:round}
.cur{position:absolute;left:0;top:0;width:${CUR.size}px;height:${CUR.size}px;opacity:0;transform-origin:2px 2px;will-change:transform,opacity}
.cur svg{display:block;width:100%;height:100%}
.cur .arrow{fill:var(--face);stroke:var(--eye);stroke-width:1.4;stroke-linejoin:round}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="msg" id="msg">
    <div class="cardbg" id="cardbg"><div class="head"><i></i><i></i><i></i></div></div>
    <div class="bubbg" id="bubbg"></div>
    <div class="txt" id="txt">${TXT.lines.map((l, i) => '<span class="ln" id="tl' + i + '"></span>').join('')}${TXT.marks.map((m, i) => '<span class="halo" id="halo' + i + '"></span><span class="dot" id="dot' + i + '"></span>').join('')}${TAGS.map((g, i) => '<span class="tag" id="tag' + i + '">' + g.text + '</span>').join('')}</div>
    <div class="scan" id="scan"></div>
  </div>
  <div class="label" id="label">${LABEL.text}</div>
${MARKS_FILES.map(m => '  <div class="logo" id="logo-' + m.key + '" aria-hidden="true"></div>').join('\n')}
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="sub" id="sub">${LINE3.text}</div>
  <div class="addr" id="addr">${ADDR.text}</div>
  <div class="phone" id="phone">
    <div class="screen">
      <iframe id="fr-en" src="/tools/clean/" scrolling="no"></iframe>
      <iframe id="fr-ru" src="/ru/tools/clean/" scrolling="no"></iframe>
      <iframe id="fr-lv" src="/lv/tools/clean/" scrolling="no"></iframe>
      <div class="ov">
        <div class="icon" id="icon"><svg viewBox="0 0 34 42" aria-hidden="true">
          <path class="sheet" d="M6 1.5h15l11 11v26.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-35.5a2 2 0 0 1 2-2z"/>
          <path class="fold" d="M21 1.5v11h11"/>
          <path class="text" d="M9 21h16M9 27h16M9 33h10"/>
        </svg></div>
        <div class="cur" id="cur"><svg viewBox="0 0 22 22" aria-hidden="true">
          <path class="arrow" d="M2 2l0 16.5 4.6-4.2 3.2 6.8 3-1.4-3.2-6.6 6.4-.4z"/>
        </svg></div>
      </div>
    </div>
  </div>
  <div class="subt" id="subt"><span class="sl" id="sl0"></span><span class="sl" id="sl1"></span></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P30 = ${JSON.stringify({ VW, VH, DSF, WM, TXT, CARD, CHAT, DOT, TAGS, TAG, SCAN, SUBS: SUBTITLES.map(c => c.lines), LOGOS: MARKS_FILES.map(m => m.key) })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 ${TXT.size}px Nunito'), document.fonts.load('600 ${LINE3.size}px Nunito'), document.fonts.load('${ST.weight} ${ST.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p30.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P30;
  const stage = document.getElementById('stage');
  const msg = document.getElementById('msg');
  const cardbg = document.getElementById('cardbg');
  const bubbg = document.getElementById('bubbg');
  const txt = document.getElementById('txt');
  const lns = P.TXT.lines.map((_, i) => document.getElementById('tl' + i));
  const dots = P.TXT.marks.map((_, i) => document.getElementById('dot' + i));
  const halos = P.TXT.marks.map((_, i) => document.getElementById('halo' + i));
  const tags = P.TAGS.map((_, i) => document.getElementById('tag' + i));
  const scan = document.getElementById('scan');
  const label = document.getElementById('label');
  let lastTxt = null;
  const wm = document.getElementById('wm');
  const sub = document.getElementById('sub');
  const addr = document.getElementById('addr');
  const phone = document.getElementById('phone');
  const frames = { en: document.getElementById('fr-en'), ru: document.getElementById('fr-ru'), lv: document.getElementById('fr-lv') };
  const icon = document.getElementById('icon');
  const cur = document.getElementById('cur');
  const subt = document.getElementById('subt');
  const sls = [document.getElementById('sl0'), document.getElementById('sl1')];
  const logos = P.LOGOS.map(k => document.getElementById('logo-' + k));
  let lastSub = null;
  let lastVis = null;
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  window.__p30 = {
    fit() {
      const probe = wm;
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      /* the dots, one in front of the character it is marked on, measured off
         the painted reply with every line whole; the halos and the tags sit
         off the same point. the bubble background and the scan take the text
         block's own height. */
      for (let k = 0; k < lns.length; k++) lns[k].textContent = P.TXT.lines[k];
      lastTxt = null;
      const tr = txt.getBoundingClientRect();
      const placed = [];
      P.TXT.marks.forEach(([li, ci], i) => {
        const node = lns[li].firstChild;
        const rg = document.createRange(); rg.setStart(node, ci); rg.setEnd(node, ci + 1);
        const r = rg.getBoundingClientRect();
        const cx = r.left - tr.left, cy = r.top - tr.top + r.height * 0.60;
        dots[i].style.left = (cx - P.DOT.d / 2).toFixed(2) + 'px';
        dots[i].style.top = (cy - P.DOT.d / 2).toFixed(2) + 'px';
        halos[i].style.left = (cx - P.DOT.halo / 2).toFixed(2) + 'px';
        halos[i].style.top = (cy - P.DOT.halo / 2).toFixed(2) + 'px';
        placed.push({ x: +cx.toFixed(2), y: +cy.toFixed(2), ch: lns[li].textContent[ci] });
      });
      P.TAGS.forEach((g, i) => {
        tags[i].style.left = (placed[g.dot].x + P.TAG.dx).toFixed(2) + 'px';
        tags[i].style.top = (placed[g.dot].y + P.TAG.dy).toFixed(2) + 'px';
      });
      const th = tr.height;
      bubbg.style.height = (th + 2 * P.CHAT.padY).toFixed(2) + 'px';
      scan.style.height = (th + 16).toFixed(2) + 'px';
      scan.style.left = (P.CARD.padX - P.SCAN.w / 2).toFixed(2) + 'px';
      let wide = 0;
      for (const l of lns) { const rg = document.createRange(); rg.selectNodeContents(l); wide = Math.max(wide, rg.getBoundingClientRect().width); }
      return { wm: +ws.toFixed(2), dots: placed, txt: { w: +tr.width.toFixed(2), h: +th.toFixed(2), widest: +wide.toFixed(2) } };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
      return {
        wm: { ...box(wm.getBoundingClientRect(), d), widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font },
        sub: { ...box(rg(sub), d), font: capOf(sub).font },
        addr: { ...box(rg(addr), d), font: capOf(addr).font },
        label: { ...box(rg(label), d), font: capOf(label).font },
        /* every subtitle card painted in turn: its widest line and its block */
        subs: P.SUBS.map(lines => {
          for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
          sls[1].style.display = lines[1] ? 'block' : 'none';
          let widest = 0;
          for (let k = 0; k < lines.length; k++) widest = Math.max(widest, rg(sls[k]).width);
          const b = subt.getBoundingClientRect();
          return { widestPx: +(widest * d).toFixed(1), h: +(b.height * d).toFixed(1), font: capOf(subt).font };
        }),
        logos: logos.map(el => box(el.getBoundingClientRect(), d)),
        card: box(msg.getBoundingClientRect(), d),
        txt: { ...box(txt.getBoundingClientRect(), d), font: capOf(txt).font },
        bub: box(bubbg.getBoundingClientRect(), d),
        tags: tags.map(el => ({ ...box(rg(el), d), font: capOf(el).font })),
        phone: box(phone.getBoundingClientRect(), d),
      };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      msg.style.transform = 'translate(' + o.msg.x.toFixed(3) + 'px,' + o.msg.y.toFixed(3) + 'px) rotate(' + o.msg.rot.toFixed(3) + 'deg) scale(' + o.msg.sc.toFixed(4) + ')';
      msg.style.opacity = o.msg.o.toFixed(4);
      msg.style.visibility = o.msg.o < 0.004 ? 'hidden' : 'visible';
      cardbg.style.opacity = o.msg.cardO.toFixed(4);
      bubbg.style.opacity = o.msg.bubO.toFixed(4);
      const key = o.txt.chars + ':' + o.txt.caret;
      if (key !== lastTxt) {
        lastTxt = key;
        const old = txt.querySelector('.caret'); if (old) old.remove();
        let left = o.txt.chars, cur = 0;
        for (let k = 0; k < lns.length; k++) {
          const n = Math.max(0, Math.min(P.TXT.lines[k].length, left));
          lns[k].textContent = P.TXT.lines[k].slice(0, n);
          if (n > 0 || k === 0) cur = k;
          left -= P.TXT.lines[k].length;
        }
        if (o.txt.caret) { const c = document.createElement('span'); c.className = 'caret'; lns[cur].appendChild(c); }
      }
      scan.style.opacity = o.scan.o.toFixed(4);
      scan.style.transform = 'translateX(' + o.scan.x.toFixed(3) + 'px)';
      for (let i = 0; i < dots.length; i++) {
        dots[i].style.opacity = o.dots[i].o.toFixed(4);
        dots[i].style.transform = 'scale(' + o.dots[i].sc.toFixed(4) + ')';
        halos[i].style.opacity = (o.dots[i].o * 0.9).toFixed(4);
        halos[i].style.transform = 'scale(' + o.dots[i].sc.toFixed(4) + ')';
      }
      for (let i = 0; i < tags.length; i++) tags[i].style.opacity = o.tags[i].o.toFixed(4);
      label.style.opacity = o.label.o.toFixed(4);
      label.style.transform = 'translateY(' + o.label.y.toFixed(3) + 'px)';
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      sub.style.opacity = o.line3.o.toFixed(4);
      sub.style.transform = 'translateY(' + o.line3.y.toFixed(3) + 'px)';
      addr.style.opacity = o.addr.o.toFixed(4);
      addr.style.transform = 'translateY(' + o.addr.y.toFixed(3) + 'px)';
      phone.style.opacity = o.phone.o.toFixed(4);
      phone.style.transform = 'scale(' + o.phone.sc.toFixed(5) + ')';
      phone.style.visibility = o.phone.o < 0.004 ? 'hidden' : 'visible';
      if (o.vis !== lastVis) {
        lastVis = o.vis;
        for (const k of Object.keys(frames)) frames[k].style.visibility = k === o.vis ? 'visible' : 'hidden';
      }
      icon.style.opacity = o.icon.o.toFixed(4);
      icon.style.transform = 'translate(' + o.icon.x.toFixed(2) + 'px,' + o.icon.y.toFixed(2) + 'px) scale(' + o.icon.sx.toFixed(4) + ',' + o.icon.sy.toFixed(4) + ')';
      cur.style.opacity = o.cur.o.toFixed(4);
      cur.style.transform = 'translate(' + (o.cur.x - 2).toFixed(2) + 'px,' + (o.cur.y - 2).toFixed(2) + 'px) scale(' + o.cur.sc.toFixed(4) + ')';
      for (let i = 0; i < logos.length; i++) {
        logos[i].style.opacity = o.logos[i].o.toFixed(4);
        logos[i].style.transform = 'scale(' + o.logos[i].sc.toFixed(4) + ')';
      }
      const sk = o.subt.i + ':' + (o.subt.slot || '');
      if (sk !== lastSub) {
        lastSub = sk;
        const lines = o.subt.i < 0 ? [] : P.SUBS[o.subt.i];
        for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
        sls[1].style.display = lines[1] ? 'block' : 'none';
        if (o.subt.slot) subt.setAttribute('data-slot', o.subt.slot); else subt.removeAttribute('data-slot');
      }
      subt.style.opacity = o.subt.o.toFixed(4);
      subt.style.transform = 'translateY(' + o.subt.y.toFixed(3) + 'px)';
    },
  };
}

/* ---------- the cleaner's page, taken over ----------
   runs in every frame whose path is a cleaner page, before the page's own
   script. three things are replaced so the render is a function of time:
   the theme key so the page boots dark, `scrollIntoView` so the scroll is
   eased here, and every animation and transition, paused and set to the
   clip's clock on every tick. everything else is the page's own. */
function cleanInit() {
  if (!/\/clean\/?$/.test(location.pathname)) return;
  try { localStorage.setItem('bt-theme', 'dark'); } catch (e) { }
  const anims = new Map();
  let scrollReq = null;
  Element.prototype.scrollIntoView = function () { scrollReq = { el: this, t0: null, from: 0 }; };
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = t => ((ax * t + bx) * t + cx) * t, dfx = t => (3 * ax * t + 2 * bx) * t + cx, fy = t => ((ay * t + by) * t + cy) * t;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 6; i++) { const d = dfx(t); if (Math.abs(d) < 1e-6) break; const e = fx(t) - x; if (Math.abs(e) < 1e-6) break; t -= e / d; } return fy(Math.max(0, Math.min(1, t))); };
  };
  const EASE = bez(.16, 1, .3, 1);
  const q = s => document.querySelector(s);
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  document.addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = '.big.lit{background:var(--fg)!important;color:var(--bg)!important}.lang.tap{color:var(--fg)!important;opacity:1!important}';
    document.head.appendChild(st);
  });
  const tickAnims = t => {
    for (const a of document.getAnimations()) {
      let rec = anims.get(a);
      if (!rec) { rec = { t0: t }; anims.set(a, rec); try { a.pause(); } catch (e) { } }
      try { a.currentTime = Math.max(0, (t - rec.t0) * 1000); } catch (e) { }
    }
  };
  const tickScroll = (t, dt) => {
    if (!scrollReq) return;
    const se = document.scrollingElement;
    if (scrollReq.t0 == null) { scrollReq.t0 = t; scrollReq.from = se.scrollTop; }
    const r = scrollReq.el.getBoundingClientRect();
    const vh = window.innerHeight;
    const docBottom = se.scrollTop + r.bottom;
    const to = Math.max(scrollReq.from, Math.min(se.scrollHeight - vh, docBottom - (vh - dt.pad)));
    const p = EASE(Math.max(0, Math.min(1, (t - scrollReq.t0) / dt.for)));
    se.scrollTop = scrollReq.from + (to - scrollReq.from) * p;
    if (p >= 1) scrollReq = null;
  };
  window.__clean = {
    ready() {
      /* michroma and the 500 weight are lazy on this page, nothing on load
         uses them, so they are asked for here: the download button and the
         copy pill would otherwise be judged in the fallback. */
      if (!this.kicked) { this.kicked = true; Promise.all(['400 14px "Michroma"', '400 14px "Space Grotesk"', '500 14px "Space Grotesk"'].map(f => document.fonts.load(f))).catch(() => { }); }
      return document.readyState === 'complete' && document.fonts.status === 'loaded'
        && document.fonts.check('400 14px "Space Grotesk"') && document.fonts.check('500 14px "Space Grotesk"') && document.fonts.check('400 14px "Michroma"');
    },
    fine() { return matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches; },
    step(o) {
      for (const ev of o.events) {
        if (ev.kind === 'dragenter') {
          q('.zone').dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
        } else if (ev.kind === 'drop') {
          const dt = new DataTransfer();
          dt.items.add(new File([ev.arg.text], ev.arg.name, { type: 'text/plain' }));
          q('.zone').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
        } else if (ev.kind === 'press') {
          q('.run').click();
        } else if (ev.kind === 'lit') {
          const b = q('.big'); if (b) b.classList.toggle('lit', ev.arg);
        } else if (ev.kind === 'tap') {
          const a = [...document.querySelectorAll('.lang')].find(x => x.textContent.trim().toLowerCase() === ev.arg.k);
          if (a) a.classList.toggle('tap', ev.arg.on);
        }
      }
      if (o.aim) window.dispatchEvent(new PointerEvent('pointermove', { clientX: o.aim.x, clientY: o.aim.y, bubbles: true }));
      if (o.leave) document.documentElement.dispatchEvent(new PointerEvent('pointerleave'));
      for (const now of o.nows) { window.__dmRaf(now); void document.body.offsetHeight; }
      tickAnims(o.t);
      tickScroll(o.t, o.scroll);
      return this.state();
    },
    state() {
      const m = q('.mascot'), fn = q('.fname'), qq = q('.card .q'), big = q('.big'), zone = q('.zone');
      const langs = {};
      for (const a of document.querySelectorAll('.lang')) langs[a.textContent.trim().toLowerCase()] = rect(a);
      return {
        lang: document.documentElement.lang,
        theme: document.documentElement.getAttribute('data-theme'),
        scrollTop: +document.scrollingElement.scrollTop.toFixed(2),
        ex: +(m.style.getPropertyValue('--ex') || 0), ey: +(m.style.getPropertyValue('--ey') || 0),
        blink: +(m.style.getPropertyValue('--blink') || 1),
        fname: fn.hidden ? '' : fn.textContent, q: qq ? qq.textContent : '', big: big ? big.textContent : '',
        busy: zone.classList.contains('busy'), over: zone.classList.contains('over'),
        lit: !!(big && big.classList.contains('lit')),
        cardOn: !!q('.card.on'),
        rects: { zone: rect(zone), mascot: rect(m), run: rect(q('.run')), big: big ? rect(big) : null, en: langs.en, ru: langs.ru, lv: langs.lv },
      };
    },
  };
}

function serve(html) {
  const files = {
    '/tools/clean/': path.join(ROOT, 'tools', 'clean', 'index.html'),
    '/ru/tools/clean/': path.join(ROOT, 'ru', 'tools', 'clean', 'index.html'),
    '/lv/tools/clean/': path.join(ROOT, 'lv', 'tools', 'clean', 'index.html'),
  };
  const marks = new Map(MARKS_FILES.map(m => ['/mark-' + m.key + '.png', fs.readFileSync(m.file)]));
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (marks.has(p)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(marks.get(p));
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
  await page.evaluateOnNewDocument(cleanInit);
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
  const cleanFrames = () => ['en', 'ru', 'lv'].map(k => {
    const want = k === 'en' ? '/tools/clean/' : '/' + k + '/tools/clean/';
    return page.frames().find(fr => { try { return new URL(fr.url()).pathname === want; } catch { return false; } });
  });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    const frs = cleanFrames();
    let all = ok && frs.every(Boolean);
    if (all) for (const fr of frs) { if (!await fr.evaluate(() => !!(window.__clean && window.__clean.ready())).catch(() => false)) { all = false; break; } }
    if (all) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  const FR = cleanFrames();
  if (!FR.every(Boolean)) throw new Error('the three cleaner pages did not all load');
  for (const [k, fr] of [['en', FR[0]], ['ru', FR[1]], ['lv', FR[2]]]) {
    if (!await fr.evaluate(() => window.__clean.ready())) {
      const why = await fr.evaluate(() => ({ ready: document.readyState, fonts: document.fonts.status, sg: document.fonts.check('400 14px "Space Grotesk"'), mi: document.fonts.check('400 14px "Michroma"'), faces: [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status) }));
      throw new Error('the ' + k + ' cleaner page is not ready, or its fonts did not load: ' + JSON.stringify(why));
    }
    if (!await fr.evaluate(() => window.__clean.fine())) throw new Error('the ' + k + ' cleaner page has no fine pointer, so its eyes would not follow');
  }
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['400 ' + TXT.size + 'px "Nunito"', 'the reply'], ['600 ' + LINE3.size + 'px "Nunito"', 'the captions']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const measured = await page.evaluate(() => window.__p30.measure());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the wordmark: ' + measured.wm.widestPx + ' device px wide, caps ' + measured.wm.capPx + ', clear ' + measured.wm.left + ' / ' + measured.wm.top + ' / ' + measured.wm.right + ' / ' + measured.wm.bottom);
  console.log('  the reply: ' + measured.txt.font + ', widest line ' + (built.txt.widest * DSF).toFixed(0) + ' device px of ' + (TXT.w * DSF) + ', dots on ' + built.dots.map(d => '"' + d.ch + '"').join(' '));
  console.log('  the card: ' + measured.card.w + 'x' + measured.card.h + ' device px, clear ' + measured.card.left + ' / ' + measured.card.top + ' / ' + measured.card.right + ' / ' + measured.card.bottom);
  /* the dots' places are known now, so the frame the scan reaches each is solved here */
  DOT.x = built.dots.map(d => d.x);
  solveDots();
  console.log('  the scan reaches the dots at ' + DOT.at.map(a => a.toFixed(2)).join(', '));
  for (const m of MARKS_FILES) console.log('  the ' + m.key + ' mark: ' + m.w + 'x' + m.h + ' file, ink ' + m.inkW + 'x' + m.inkH + ' css px at ' + m.cx + ', ' + LOGOS.cy + ', pops at ' + m.at.toFixed(2) + 's');
  for (const [i, c] of CARDS.entries()) console.log('  subtitle ' + (i + 1) + ' ' + c.from.toFixed(2) + ' to ' + c.to.toFixed(2) + ' ' + c.slot + ': ' + c.lines.join(' / ') + ', widest ' + measured.subs[i].widestPx + ' device px');
  console.log('  the phone: ' + measured.phone.w + 'x' + measured.phone.h + ' device px, clear ' + measured.phone.left + ' / ' + measured.phone.top + ' / ' + measured.phone.right + ' / ' + measured.phone.bottom
    + ', the page at ' + PHONE.vw + 'x' + PHONE.vh + ' css px scaled ' + PHONE.scale);

  /* the pages, at rest, before anything happens in them */
  let R = (await FR[0].evaluate(() => window.__clean.state())).rects;
  const first = await Promise.all(FR.map(fr => fr.evaluate(() => window.__clean.state())));
  console.log('  the cleaner pages: ' + first.map(s => s.lang + ' ' + s.theme).join(', ') + ', the zone at ' + R.zone.y.toFixed(0) + '..' + (R.zone.y + R.zone.h).toFixed(0)
    + ', the button at ' + R.run.cy.toFixed(0) + ' of ' + PHONE.vh + ' css px');

  const put = async (t, f, states) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f, R);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p30.apply(fr), o);
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

  /* the phone's clock: the rAF ticks a page gets between two captured
     instants, at sixty a second whatever the render rate, so the page's own
     easing runs at the speed it runs at on a phone. */
  const TICK = 1 / 60;
  let tickAt = 0;
  let lastAim = null;
  const observed = [];
  const sigs = [];
  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const t0 = idx === 0 ? -1 : (idx - 1) * (1 / (FPS * SUB));
      const { mf, o } = await put(t, f);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      /* the pages inside the phone, all three, identically */
      const nows = [];
      while (tickAt <= t + 1e-9) { nows.push(+(tickAt * 1000).toFixed(3)); tickAt += TICK; }
      const aim = o.icon.o > 0.01 ? { x: o.icon.x, y: o.icon.y } : o.cur.o > 0.01 ? { x: o.cur.x, y: o.cur.y } : null;
      const leave = !aim && !!lastAim;
      lastAim = aim;
      const step = { t, nows, aim, leave, events: eventsAt(t0, t), scroll: SCROLL };
      const states = await Promise.all(FR.map(fr => fr.evaluate(s => window.__clean.step(s), step)));
      R = states[0].rects;
      if (k === 0) observed.push({ t: +t.toFixed(4), en: strip(states[0]), ru: strip(states[1]), lv: strip(states[2]) });
      /* the liveness signature sums its subframes, post28's rule */
      let s = o.mo * 7 + o.msg.x * 11 + o.msg.o * 13 + o.msg.rot * 17 + o.msg.sc * 19 + o.msg.cardO * 23 + o.msg.bubO * 29 + o.label.o * 31
        + o.txt.chars * 223 + o.txt.caret * 227 + o.scan.x * 229 + o.scan.o * 233 + o.tags[0].o * 239 + o.tags[1].o * 241
        + o.subt.o * 251 + o.subt.i * 257 + o.subt.y * 263 + o.logos[0].o * 269 + o.logos[0].sc * 271 + o.logos[1].o * 277 + o.logos[1].sc * 281
        + o.wm.o * 37 + o.wm.sc * 41 + o.wm.glow * 43 + o.line3.o * 47 + o.addr.o * 53 + o.phone.o * 59 + o.phone.sc * 61
        + o.icon.o * 67 + o.icon.y * 71 + o.cur.o * 73 + o.cur.x * 79 + o.cur.y * 83 + o.cur.sc * 89 + (o.vis === 'en' ? 0 : o.vis === 'ru' ? 101 : 103);
      for (let d = 0; d < o.dots.length; d++) s += o.msg.o * (o.dots[d].o * (107 + d) + o.dots[d].sc * (113 + d));
      s += o.mo * (mf.card.x * 127 + mf.card.y * 131 + mf.card.rot * 137 + mf.card.sx * 139 + mf.card.sy * 149);
      for (let e = 0; e < 2; e++) s += o.mo * (mf.eyes[e].x * (151 + e) + mf.eyes[e].y * (157 + e) + mf.eyes[e].lid * (163 + e) + mf.eyes[e].sy * (167 + e));
      const vs = states[o.vis === 'en' ? 0 : o.vis === 'ru' ? 1 : 2];
      s += o.phone.o * (vs.scrollTop * 173 + vs.ex * 179 + vs.ey * 181 + vs.blink * 191 + (vs.busy ? 193 : 0) + (vs.over ? 197 : 0) + (vs.lit ? 199 : 0) + (vs.cardOn ? 211 : 0));
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (k + 1)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [TXT.from + 1.2, 'a-s1-the-reply-typing'],
    [MARKS_FILES[1].at + 0.45, 'a2-s1-the-logos'],
    [typedEnd + 0.4, 'b-s1-the-reply-whole'],
    [LEAN.at + LEAN.for * 0.9, 'c-s2-the-lean'],
    [SCAN.at + SCAN.for * 0.45, 'd-s2-the-scan'],
    [SCAN.at + SCAN.for + 0.5, 'e-s2-the-dots-and-tags'],
    [SLIDE.at + SLIDE.for * 0.5, 'f-s2-the-card-sliding'],
    [SC[2] - 0.05, 'g-s2-the-bubble'],
    [BUB_OUT.at + 0.16, 'h-s3-the-bubble-popping-out'],
    [IN1.at + SPRING.for * 0.5, 'i-s3-the-spring'],
    [DELIGHT.at + 0.9, 'j-s3-delighted'],
    [SUB1.at + 0.6, 'k-s3-the-line-under-him'],
    [PHONE_IN.at + 0.7, 'l-the-phone'],
    [SC[3] + ICON.fall + 0.2, 'm-the-file-falling'],
    [SC[3] + ICON.land + 0.12, 'n-the-file-in'],
    [SC[3] + 1.5, 'n2-s4-a-subtitle'],
    [SC[3] + PRESS.at - 0.15, 'o-the-pointer-on-the-button'],
    [SC[3] + PRESS.at + 0.5, 'p-the-scan'],
    [SC[3] + PRESS.at + 1.6, 'q-the-card'],
    [SC[3] + LIT.at + 0.2, 'r-the-download-lit'],
    [SC[4] + 0.30, 's0-s5-the-start'],
    [TAP.en + 0.1, 's-tap-en'],
    [TAP.ru + 0.4, 't-tap-ru'],
    [TAP.lv + 0.4, 'u-tap-lv'],
    [PHONE_OUT.at + 0.2, 'w-the-phone-leaving'],
    [ADDR_IN.at + 0.5, 'x-the-end-card'],
    [SECONDS - 0.06, 'y-the-last-frame'],
  ];
  /* the stills are re-driven frames, so the pages inside are wherever the
     render left them; the still shows the outer picture at that instant and
     the phone as it stands at the end of the run. */
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const o = frameAt(f / FPS, f, R);
    await page.evaluate(fr => window.__mas.apply(fr), compose(plan, f / FPS));
    await page.evaluate(fr => window.__p30.apply(fr), o);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  the head, worst frame at home at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, measured, head: worst, sigs, frames: N, observed, phoneRest: first[0].rects };
  fs.writeFileSync(path.join(OUT, 'post30.json'), JSON.stringify(state, null, 2));
  return state;
}
const strip = s => ({ scrollTop: s.scrollTop, ex: s.ex, ey: s.ey, fname: s.fname, q: s.q, big: s.big, busy: s.busy, over: s.over, lit: s.lit, cardOn: s.cardOn, lang: s.lang, theme: s.theme });

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post30-dark-1080x1920.mp4');
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
for (let i = 0; i < LINES.length; i++) {
  OFF.push(+(SC[i] + PRE - EDGE[i].start).toFixed(4));
  const soundEnd = +(EDGE[i].end + OFF[i]).toFixed(4);
  if (i < LINES.length - 1) SC[i + 1] = +(GAP_AFTER[i] != null ? soundEnd + GAP_AFTER[i] : Math.max(BRIEF[i + 1], soundEnd + AFTER_LINE)).toFixed(4);
  else END = +(soundEnd + AFTER_READ).toFixed(4);
}
SECONDS = +END.toFixed(2);
const WORDS = TAKES.map((t, i) => t.words.map(w => ({ word: w.word, start: +(w.start + OFF[i]).toFixed(4), end: +(w.end + OFF[i]).toFixed(4) })));
const SOUND = TAKES.map((t, i) => ({ start: +(EDGE[i].start + OFF[i]).toFixed(4), end: +(EDGE[i].end + OFF[i]).toFixed(4) }));
const wordAt = (i, w) => WORDS[i].find(x => bare(x.word) === w);

/* ---------- the clock, hung off the scene starts ---------- */
LEAN.at = SC[1];
SCAN.at = +(SC[1] + SCAN.at).toFixed(4);
SLIDE.at = +(SCAN.at + SCAN.for + 0.30).toFixed(4);
LABEL_IN.at = +(SLIDE.at + 0.40).toFixed(4);
BUB_OUT.at = SC[2];
IN1.at = +(SC[2] + 0.10).toFixed(4);
/* the turn to the lens and the neutral settle need their own room before
   delighted can start, the module's floor */
DELIGHT.at = +(IN1.at + 1.10).toFixed(4);
WM1.at = +(IN1.at + SPRING.for + 0.05).toFixed(4);
/* the line under him lands on `free` */
const FREE = wordAt(2, 'free');
if (!FREE) throw new Error('line three has no "free" in it');
SUB1.at = +Math.max(FREE.start, WM1.at + 0.30).toFixed(4);
OUT1.at = SC[3];
WM_OUT.at = SC[3];
CALM.at = +(SC[3] + 0.50).toFixed(4);
PHONE_IN.at = +(SC[3] + 0.15).toFixed(4);
/* the taps land on the words, floored by the pointer's travel: it leaves
   the button after the press and goes straight up to the header */
const EN = wordAt(4, 'english'), RU = wordAt(4, 'russian'), LV = wordAt(4, 'latvian');
if (!EN || !RU || !LV) throw new Error('line five is missing one of english, russian, latvian');
TAP.en = +Math.max(EN.start + 0.10, SC[3] + PRESS.at + 0.30 + 0.60).toFixed(4);
TAP.ru = +Math.max(RU.start + 0.10, TAP.en + 0.45).toFixed(4);
TAP.lv = +Math.max(LV.start + 0.10, TAP.ru + 0.45).toFixed(4);
/* the marks, on the words that name them */
for (const m of MARKS_FILES) {
  const w = wordAt(0, m.say);
  if (!w) throw new Error('line one has no "' + m.say + '" in it for the ' + m.key + ' mark');
  m.at = +w.start.toFixed(4);
}
PHONE_OUT.at = SC[5];
/* once the phone is gone, so the page's mascot and he are never on the frame together */
IN2.at = +(SC[5] + PHONE_OUT.for).toFixed(4);
WM2.at = +(IN2.at + SPRING.for + 0.05).toFixed(4);
ADDR_IN.at = +(WM2.at + 0.30).toFixed(4);
CUR.presses = [SC[3] + PRESS.at, TAP.en, TAP.ru, TAP.lv];
CUR.keys = [
  { t: +(SC[3] + 2.20).toFixed(4), at: ['mascot', 44, 96], o: 0 },
  { t: +(SC[3] + 2.40).toFixed(4), at: ['mascot', 44, 96], o: 1 },
  { t: +(SC[3] + 2.90).toFixed(4), at: ['run', 0, 0], o: 1 },
  { t: +(SC[3] + PRESS.at + 0.30).toFixed(4), at: ['run', 0, 0], o: 1 },
  { t: TAP.en, at: ['en', 0, 0], o: 1 },
  { t: +(TAP.en + 0.15).toFixed(4), at: ['en', 0, 0], o: 1 },
  { t: TAP.ru, at: ['ru', 0, 0], o: 1 },
  { t: +(TAP.ru + 0.15).toFixed(4), at: ['ru', 0, 0], o: 1 },
  { t: TAP.lv, at: ['lv', 0, 0], o: 1 },
  { t: +(TAP.lv + 0.15).toFixed(4), at: ['lv', 0, 0], o: 1 },
  { t: +(TAP.lv + 0.50).toFixed(4), at: ['lv', 40, 60], o: 0 },
];

/* ---------- the subtitles, cut to the read ---------- */
for (const [i, c] of SUBTITLES.entries()) {
  const W = WORDS[c.line];
  const [a, b] = c.words;
  if (!(W[a] && W[b] && a <= b)) throw new Error('subtitle ' + (i + 1) + ' names words ' + a + '..' + b + ' and line ' + (c.line + 1) + ' has ' + W.length);
  const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (letters(W.slice(a, b + 1).map(w => w.word).join('')) !== letters(c.lines.join(''))) {
    throw new Error('subtitle ' + (i + 1) + ' reads "' + c.lines.join(' / ') + '" and the take says "' + W.slice(a, b + 1).map(w => w.word).join(' ') + '"');
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
   three marks, two states. the seed is walked so the module's own blinks stay
   off the two landings and the two wordmark pops. */
/* he rests a third of a turn toward the text, which is on his left, and the
   spring's mark turns him to the lens. the turn channel holds from there. */
const TURN_TO_TEXT = -0.35;
const MARKS = [
  { t: 0, state: 'neutral' },
  { t: IN1.at, state: 'neutral', turn: 0, turnFor: 0.40 },
  { t: DELIGHT.at, state: 'delighted' },
  { t: CALM.at, state: 'neutral' },
];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: TURN_TO_TEXT, seed, marks: MARKS });
const CLEAR = [[IN1.at + SPRING.for - 0.20, IN1.at + SPRING.for + 0.30], [IN2.at + SPRING.for - 0.20, IN2.at + SPRING.for + 0.30]];
const SEED = (() => {
  for (let s = 1; s <= 400; s++) {
    const b = makePlan(s).idle.blinks;
    if (!b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) return s;
  }
  throw new Error('no seed under 400 keeps the module\'s blinks clear of the two landings');
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
const WAV = path.join(OUT, 'post30-mix.wav');
const RAW = path.join(OUT, 'post30-mix-raw.wav');
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
  for (let f = Math.floor(a * 60); f < Math.ceil(b * 60); f++) { const s = Math.abs(fn((f + 1) / 60) - fn(f / 60)); if (s > d) { d = s; at = f / 60; } }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const headStep = [[IN1.at, IN1.at + SPRING.for], [OUT1.at, OUT1.at + EXIT.for], [IN2.at, IN2.at + SPRING.for]]
  .map(([a, b]) => { const y = fastest(t => compose(plan, t).card.y, a, b), x = fastest(t => compose(plan, t).card.x, a, b); return y.d >= x.d ? y : x; })
  .sort((x, y) => y.d - x.d)[0];
const slideStep = fastest(t => frameAt(t, 0, null).msg.y, SLIDE.at, SLIDE.at + SLIDE.for);
const scanStep = fastest(t => frameAt(t, 0, null).scan.x, SCAN.at, SCAN.at + SCAN.for);
const FASTEST = Math.max(headStep.d, slideStep.d, scanStep.d);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log('\n  the read, edge, ' + TAKES[0].voiceId);
for (const t of TAKES) {
  const w = WORDS[t.i];
  const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"  ' + t.rate + ' ' + t.pitch + (t.cached ? '  cached' : '  fetched') + (t.sentences > 1 ? ', ' + t.sentences + ' sentences, stops of ' + t.gaps.map(g => (g * 1000).toFixed(0) + 'ms').join(', ') : '')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's in a scene of ' + SC[t.i].toFixed(2) + ' to ' + to.toFixed(2)
    + (t.i < 4 && SC[t.i] > BRIEF[t.i] + 1e-6 ? ' (the brief said ' + BRIEF[t.i].toFixed(1) + ')' : '') + ', ' + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
}
console.log('\n  the beats');
const beats = [
  [0, 'one. the chat window, him small in its corner turned to the text'],
  [TXT.from, 'the reply types, ' + TXT.cps + ' characters a second, whole by ' + typedEnd.toFixed(2)],
  ...MARKS_FILES.map(m => [m.at, 'the ' + m.key + ' mark pops over the card, on "' + m.say + '"']),
  [SC[1], 'two. he leans in over ' + LEAN.for + 's'],
  [SCAN.at, 'the scan sweeps the text, ' + SCAN.for + 's, and the dots pop as it passes'],
  [SLIDE.at, 'the card tilts ' + MSG.tilt + ' degrees and slides into the bubble over ' + SLIDE.for + 's'],
  [LABEL_IN.at, 'the label, "' + LABEL.text + '"'],
  [SC[2], 'three. the bubble pops out'],
  [IN1.at, 'he springs from the corner to the middle, ' + SPRING.for + 's, turning to the lens'],
  [WM1.at, 'the wordmark pops'],
  [DELIGHT.at, 'delighted'],
  [SUB1.at, '"' + LINE3.text + '", on the word free'],
  [SC[3], 'four. he shrinks away where he stands, the wordmark fades'],
  [PHONE_IN.at, 'the phone pops in, the english page on it'],
  [SC[3] + ICON.fall, 'the file falls'],
  [SC[3] + ICON.enter, 'the zone lights as it crosses in'],
  [SC[3] + ICON.land, 'the drop: the page names the file, the eyes were on it all the way down'],
  [SC[3] + 2.40, 'the pointer appears and goes to the button'],
  [SC[3] + PRESS.at, 'the press: the page scans for 0.95s'],
  [SC[3] + PRESS.at + 0.95, 'the page\'s own card unfolds, and the scroll follows it'],
  [SC[3] + LIT.at, 'the download button lights for ' + LIT.for + 's'],
  [SC[4], 'five, ' + GAP_AFTER[3] + 's after "done". the pointer is on its way to the header'],
  [TAP.en, 'tap EN, on the word'],
  [TAP.ru, 'tap RU: the russian page'],
  [TAP.lv, 'tap LV: the latvian page'],
  [SC[5], 'six, ' + GAP_AFTER[4] + 's after "browser". the phone shrinks away'],
  [IN2.at, 'he springs back in the middle, calm'],
  [WM2.at, 'the wordmark'],
  [ADDR_IN.at, '"' + ADDR.text + '" under it, held to the end'],
  [SECONDS, 'end, ' + AFTER_READ + 's after the last sound'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('\n  the fast things, at sixty');
console.log('    his centre moves at most ' + headStep.d + ' css px a frame on the spring, at ' + headStep.at + 's');
console.log('    the card moves at most ' + slideStep.d + ' css px a frame on its slide, the scan line ' + scanStep.d + ' on its pass');
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST / SUB).toFixed(2) + ' css px between samples' : 'closed'));
console.log('\n  the sound');
console.log('    the voice: ' + TAKES.reduce((a, t) => a + t.sentences, 0) + ' edge takes at ' + RATE + ' assembled into six lines with ' + BREAK_MS + 'ms at every stop, on the clip\'s clock, and nothing else on the bus');
console.log('    the lift: off the voice at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, took ' + best.lift.toFixed(2) + ' dB in ' + tries + ' pass' + (tries === 1 ? '' : 'es'));
console.log('    the bus: ' + (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

if (VOICE_ONLY) process.exit(0);

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post30.json'), 'utf8')) : await render(plan);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
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
  }
  for (const [i, L] of LINES.entries()) {
    if (/[—–]/.test(L.text) || /\s-\s/.test(L.text) || /!/.test(L.text) || /[A-Z]/.test(L.text)) fail.push('line ' + (i + 1) + ' breaks the copy rules: "' + L.text + '"');
    if (!/\.$/.test(L.text)) fail.push('line ' + (i + 1) + '\'s read has lost its full stop: "' + L.text + '"');
  }
  if (!/chat g p t/.test(LINES[0].text)) fail.push('line one does not spell chat g p t letter by letter');
  if (!/remover\. free\./.test(LINES[2].text)) fail.push('line three has lost the stop before free');
  if (!/free\. the boring tek\./.test(LINES[5].text)) fail.push('line six has lost the stop before the boring tek');
  for (let i = 0; i < 4; i++) if (SC[i] < BRIEF[i] - 1e-6) fail.push('scene ' + (i + 1) + ' starts at ' + SC[i] + ', before the brief\'s ' + BRIEF[i]);
  for (const [i, gap] of Object.entries(GAP_AFTER)) if (Math.abs(SC[+i + 1] - SOUND[+i].end - gap) > 1e-3) fail.push('scene ' + (+i + 2) + ' is ' + (SC[+i + 1] - SOUND[+i].end).toFixed(2) + 's after line ' + (+i + 1) + ' ends, not ' + gap);
  for (const t of TAKES) {
    if (t.rate !== RATE) fail.push('take ' + (t.i + 1) + ' is ' + t.rate);
    for (const g of t.gaps) if (Math.abs(g - BREAK_MS / 1000) > 0.006) fail.push('take ' + (t.i + 1) + ' has a ' + (g * 1000).toFixed(0) + 'ms stop, not ' + BREAK_MS);
    if (t.sentences !== t.text.split(/(?<=[.!?])\s+/).length) fail.push('take ' + (t.i + 1) + ' is ' + t.sentences + ' takes for ' + t.text.split(/(?<=[.!?])\s+/).length + ' sentences');
  }
  if (!/it works in english, russian and latvian\. and nothing leaves your browser\./.test(LINES[4].text)) fail.push('line five is not the rewrite');
  if (SECONDS > 27 || SECONDS < 18) fail.push('the film is ' + SECONDS + 's');
}

/* ---------- what is on the screen ----------
   no dashes, colons, parentheses, apostrophes or quotes anywhere a viewer
   reads; no dot on a caption. the paragraph is prose and keeps its stops;
   the address is an address. */
{
  const screen = [['the reply', TXT.lines.join(' ')], ['the tags', TAGS.map(g => g.text).join(' ')], ['the label', LABEL.text], ['the wordmark', WM.lines.join(' ')], ['the line under him', LINE3.text],
    ['the address', ADDR.text], ['the file name', FILE.name], ...SUBTITLES.map((c, i) => ['subtitle ' + (i + 1), c.lines.join(' ')])];
  for (const [what, s] of screen) {
    if (/[-—–:()'"“”‘’]/.test(s)) fail.push(what + ' carries a dash, a colon, a bracket, an apostrophe or a quote: "' + s + '"');
  }
  for (const [what, s] of [['the label', LABEL.text], ['the tags', TAGS.map(g => g.text).join(' ')], ['the line under him', LINE3.text], ...SUBTITLES.map((c, i) => ['subtitle ' + (i + 1), c.lines.join(' ')])]) {
    if (/\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  if (TXT.marks.length !== 8) fail.push('there are ' + TXT.marks.length + ' dots, not eight');
  for (const [li, ci] of TXT.marks) {
    const line = TXT.lines[li];
    if (!line || ci <= 0 || ci >= line.length || line[ci] === ' ' || line[ci - 1] === ' ') fail.push('dot at line ' + li + ' char ' + ci + ' is not between two letters');
  }
  if (TAGS.some(g => !(g.dot >= 0 && g.dot < TXT.marks.length))) fail.push('a tag names a dot that is not there');
  /* the file the page cleans carries exactly what the card says it found */
  const count = (rx, s) => (s.match(rx) || []).length;
  const hidden = count(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD\u200E\u200F\u202A-\u202E\u2066-\u2069\uFE00-\uFE0F\u2061-\u2064]/g, FILE.text);
  const space = count(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, FILE.text);
  const curly = count(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2010-\u2015\u2212]/g, FILE.text);
  if (hidden !== FILE.expect.hidden || space !== FILE.expect.space || curly !== FILE.expect.curly) fail.push('the file carries ' + hidden + ' hidden, ' + space + ' odd space, ' + curly + ' curly, not 6, 1 and 3');
  if (/^\uFEFF/.test(FILE.text)) fail.push('the file starts with a bom, which a decoder strips before the cleaner sees it');
}

/* ---------- the states are calm or happy, and nothing else is drawn ---------- */
{
  for (const m of plan.marks) if (!['neutral', 'delighted'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and only calm or happy eyes are allowed');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip has neither');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (DELIGHT.at < IN1.at + SPRING.for) fail.push('delighted starts before he has landed');
  if (!(placeAt(0).on === 1 && placeAt(IN1.at + SPRING.for + 0.01).on === 1 && placeAt(OUT1.at + EXIT.for + 0.01).on === 0 && placeAt(IN2.at + SPRING.for + 0.01).on === 1)) fail.push('he is not on, off, on in that order');
  /* small in the corner, then the house size */
  const small = compose(plan, 1.0).card, mid = compose(plan, SC[2] + 1.5).card;
  if (Math.abs(small.sx / mascotFrame(plan, 1.0).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size in the corner');
  if (Math.abs(mid.sx / mascotFrame(plan, SC[2] + 1.5).card.sx - 1) > 1e-3) fail.push('he is not at the house size in the middle');
  if (plan.bias !== TURN_TO_TEXT || plan.marks[1].turn !== 0) fail.push('he does not rest turned to the text and turn to the lens on the spring');
  /* his corner: inside the card, clear of the reply */
  const cr = headRect(plan, compose(plan, 0.5));
  const cardRight = (CARD.left + CARD.w) * DSF, cardBottom = (CARD.top + CARD.h) * DSF;
  if (VW * DSF - cr.right > cardRight || VH * DSF - cr.bottom > cardBottom) fail.push('he sticks out of the card\'s corner');
  if (state.built && cr.left < (CARD.left + CARD.padX) * DSF + state.built.txt.widest * DSF + 8) fail.push('he sits on the reply\'s longest line');
  /* and he rides the card: at the end of the slide he has moved by the card's travel, and mid slide he carries its tilt */
  const before = placeAt(SLIDE.at - 0.01), after = placeAt(SLIDE.at + SLIDE.for + 0.01), half = placeAt(SLIDE.at + SLIDE.for / 2);
  if (Math.abs((after.dx - before.dx) - MSG.toX) > 0.5 || Math.abs((after.dy - before.dy) - MSG.toY) > 0.5) fail.push('he does not ride the card: moved ' + (after.dx - before.dx).toFixed(1) + ', ' + (after.dy - before.dy).toFixed(1) + ' against the card\'s ' + MSG.toX + ', ' + MSG.toY);
  if (Math.abs(half.rot - MSG.tilt) > 0.01) fail.push('he does not tilt with the card');
  const home = compose(plan, SECONDS - 0.05).card, mod = mascotFrame(plan, SECONDS - 0.05).card;
  if (Math.abs(home.y - mod.y) > 1e-6) fail.push('he is not home on the last frame');
}

/* ---------- everything clears the safe area, the house one and the brief's ---------- */
{
  const M = state.measured;
  const floor = Math.max(BRIEF_SAFE, 0);
  const inside = (what, b, top = SAFE.top, bottom = SAFE.bottom) => {
    if (b.left < SAFE.left || b.right < SAFE.right || b.top < top || b.bottom < bottom) fail.push(what + ' is inside the house safe area: ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
    if (b.left < floor || b.right < floor || b.top < floor || b.bottom < floor) fail.push(what + ' is inside the brief\'s 120px margin');
  };
  inside('the card', M.card);
  /* and where it lands, as the bubble */
  const dx = MSG.toX * DSF, dy = MSG.toY * DSF;
  inside('the bubble', { left: M.bub.left + dx, right: M.bub.right - dx, top: M.bub.top + dy, bottom: M.bub.bottom - dy });
  inside('the label', M.label);
  /* the tags stay inside the card */
  for (const [i, g] of M.tags.entries()) {
    if (g.left < M.card.left || g.right < M.card.right || g.top < M.card.top || g.bottom < M.card.bottom) fail.push('tag ' + (i + 1) + ' is outside the card');
    if (!/monospace|Mono|Menlo|Consolas/i.test(g.font)) fail.push('tag ' + (i + 1) + ' is not mono: ' + g.font);
  }
  inside('the wordmark', M.wm);
  inside('the line under him', M.sub);
  inside('the address', M.addr);
  inside('the phone', M.phone);
  for (const [i, m] of MARKS_FILES.entries()) {
    const ink = markInk(m);
    inside('the ' + m.key + ' mark', { left: ink.left * DSF, top: ink.top * DSF, right: ink.right * DSF, bottom: ink.bottom * DSF });
    if (Math.abs(m.inkH - LOGOS.ink) > 0.01) fail.push('the ' + m.key + ' mark\'s ink is ' + m.inkH + ' css px tall, not ' + LOGOS.ink);
    if (ink.top + m.inkH > CARD.top - 8) fail.push('the ' + m.key + ' mark sits on the card');
    if (M.logos[i].w < 1) fail.push('the ' + m.key + ' mark has no box');
  }
  if (MARKS_FILES[0].cx >= MARKS_FILES[1].cx) fail.push('the marks are not claude then chat g p t, left to right');
  if (!(MARKS_FILES[1].at > MARKS_FILES[0].at)) fail.push('the chat g p t mark pops before the claude one');
  /* the subtitles: every card fits on its lines, sits in the safe area, and is under what it is under */
  const subH = Math.max(...M.subs.map(b => b.h));
  for (const [i, c] of CARDS.entries()) {
    const b = M.subs[i];
    if (!/Nunito/.test(b.font)) fail.push('subtitle ' + (i + 1) + ' is not in nunito: ' + b.font);
    if (b.widestPx > (VW - SAFE_CSS.left - SAFE_CSS.right) * DSF) fail.push('subtitle ' + (i + 1) + ' is ' + b.widestPx + ' device px wide, past the side margins');
    if (c.lines.length > 2) fail.push('subtitle ' + (i + 1) + ' has ' + c.lines.length + ' lines');
    const top = (c.slot === 'low' ? ST.low : ST.high), bottom = top + b.h / DSF;
    if (bottom > VH - SAFE_CSS.bottom) fail.push('subtitle ' + (i + 1) + ' reaches ' + bottom.toFixed(0) + ' css px, into the bottom band');
    if (bottom > VH - BRIEF_SAFE / DSF) fail.push('subtitle ' + (i + 1) + ' is inside the brief\'s bottom margin');
    if (c.slot === 'low' && top < PHONE.top + PHONE.h + 12) fail.push('subtitle ' + (i + 1) + ' is on the phone');
    if (c.slot === 'high' && !(c.to <= PHONE_IN.at + 0.2 || c.from >= PHONE_OUT.at + PHONE_OUT.for - 0.2)) fail.push('subtitle ' + (i + 1) + ' is in the high slot while the phone is up');
    if (c.slot === 'high' && c.from < SC[3]) {
      if (top < CHAT.top + (state.built.txt.h + 2 * CHAT.padY) + 8) fail.push('subtitle ' + (i + 1) + ' is on the bubble');
      if (top < CARD.top + CARD.h + 8) fail.push('subtitle ' + (i + 1) + ' is on the card');
    }
    if (c.slot === 'high' && c.from >= SC[2] && c.from < SC[3] && top < LINE3.top + LINE3.size * 1.25 + 8) fail.push('subtitle ' + (i + 1) + ' is on the line under him');
    if (c.slot === 'high' && c.from >= SC[5] && top < ADDR.top + ADDR.size * 1.3 + 8) fail.push('subtitle ' + (i + 1) + ' is on the address');
    if (c.to - c.from < 0.5) fail.push('subtitle ' + (i + 1) + ' is up for ' + (c.to - c.from).toFixed(2) + 's');
  }
  for (let i = 0; i < LINES.length; i++) if (!CARDS.some(c => c.line === i)) fail.push('line ' + (i + 1) + ' has no subtitle');
  /* he never sits on a subtitle while he is on the bubble's corner */
  {
    let worstGap = Infinity;
    for (let f = Math.floor(SLIDE.at * 60); f < Math.ceil(SC[2] * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); worstGap = Math.min(worstGap, VH * DSF - r.bottom); }
    if (VH * DSF - worstGap > ST.high * DSF - 4) fail.push('he reaches ' + ((VH * DSF - worstGap) / DSF).toFixed(0) + ' css px on the bubble, onto the subtitle slot at ' + ST.high);
  }
  if (M.phone.w > 760) fail.push('the phone is ' + M.phone.w + ' device px wide, over 760');
  if (M.phone.left < 160 || M.phone.right < 160) fail.push('the phone has less than 160 device px of air at a side');
  if (state.built.txt.widest > TXT.w + 0.5) fail.push('a reply line is ' + state.built.txt.widest + ' css px, wider than the text block');
  if (state.head && state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px, under ' + WM.minCapPx);
  for (const [what, b] of [['the reply', M.txt], ['the line under him', M.sub]]) if (!/Nunito/.test(b.font)) fail.push(what + ' is not in nunito: ' + b.font);
  /* the dots sit inside the reply's own box, and every one of them pops inside the scan's pass, left to right */
  for (const d of state.built.dots) if (d.x < 0 || d.y < 0 || d.x > state.built.txt.w || d.y > state.built.txt.h) fail.push('a dot at ' + d.x + ',' + d.y + ' is outside the reply');
  for (const [i, a] of DOT.at.entries()) if (a < SCAN.at || a > SCAN.at + SCAN.for) fail.push('dot ' + (i + 1) + ' pops at ' + a + ', outside the scan');
  {
    const order = DOT.x.map((x, i) => i).sort((a, b) => DOT.x[a] - DOT.x[b]);
    if (order.some((k, j) => j > 0 && DOT.at[k] < DOT.at[order[j - 1]] - 1e-6)) fail.push('the dots do not pop left to right');
    if (DOT.at[order[order.length - 1]] - DOT.at[order[0]] < 0.20) fail.push('the dots all pop within ' + (DOT.at[order[order.length - 1]] - DOT.at[order[0]]).toFixed(2) + 's, which is not a pass');
  }
  /* the sub line and the address share a slot, so they are never up together */
  if (WM2.at < WM_OUT.at + WM_OUT.for) fail.push('the second wordmark is born before the first has gone');
  if (SLIDE.at + SLIDE.for > BUB_OUT.at - 0.30) fail.push('the card is still sliding at ' + (SLIDE.at + SLIDE.for).toFixed(2) + 's, and the bubble pops out at ' + BUB_OUT.at);
  if (LABEL_IN.at + LABEL_IN.for > BUB_OUT.at - 0.20) fail.push('the label is still arriving when the bubble pops out');
}

/* ---------- the phone did what the page does ----------
   read back off the pages themselves, on the render's own frames. */
{
  const at = (tt, k = 'en') => { let best = null; for (const o of state.observed) if (o.t <= tt + 1e-6) best = o; return best ? best[k] : null; };
  const s4 = SC[3];
  const before = at(s4 + ICON.land - 0.05), landed = at(s4 + ICON.land + 0.25), scanning = at(s4 + PRESS.at + 0.40), carded = at(s4 + PRESS.at + 1.30), lit = at(s4 + LIT.at + 0.15), unlit = at(s4 + LIT.at + LIT.for + 0.25);
  const ru = at(TAP.ru + 0.40, 'ru'), lv = at(TAP.lv + 0.40, 'lv'), last = at(SECONDS - 0.05);
  for (const [k, s] of [['en', at(0.5)], ['ru', at(0.5, 'ru')], ['lv', at(0.5, 'lv')]]) {
    if (!s || s.lang !== k) fail.push('the ' + k + ' page reports lang ' + (s && s.lang));
    if (!s || s.theme !== 'dark') fail.push('the ' + k + ' page is not dark');
  }
  if (!before || before.fname) fail.push('the page names a file before the drop');
  if (!landed || landed.fname !== READY_LINE) fail.push('after the drop the page says "' + (landed && landed.fname) + '", not "' + READY_LINE + '"');
  if (!scanning || !scanning.busy) fail.push('the page is not scanning 0.4s after the press');
  if (!carded || !carded.cardOn) fail.push('the card is not up 1.3s after the press');
  if (!carded || carded.q !== CARD_LINE) fail.push('the card says "' + (carded && carded.q) + '", not "' + CARD_LINE + '"');
  if (!carded || !/download clean file/.test(carded.big)) fail.push('the download button reads "' + (carded && carded.big) + '"');
  if (!lit || !lit.lit) fail.push('the download button is not lit at ' + (s4 + LIT.at + 0.15).toFixed(2));
  if (!unlit || unlit.lit) fail.push('the download button is still lit after its moment');
  if (!ru || !ru.cardOn || !ru.q || ru.q === CARD_LINE || !/6/.test(ru.q)) fail.push('the russian page does not show its own card line: "' + (ru && ru.q) + '"');
  if (!lv || !lv.cardOn || !lv.q || lv.q === CARD_LINE || lv.q === (ru && ru.q) || !/6/.test(lv.q)) fail.push('the latvian page does not show its own card line: "' + (lv && lv.q) + '"');
  if (!last || last.scrollTop <= 0) fail.push('the page never scrolled to its card');
  /* the eyes: on the file as it falls, then on the pointer at the button */
  const falling = at(s4 + ICON.land - 0.02), onButton = at(s4 + PRESS.at - 0.02), calm = at(s4 + PRESS.at + 0.30);
  if (!falling || Math.hypot(falling.ex, falling.ey) < 1.0) fail.push('the eyes are not on the file as it lands: ' + (falling && falling.ex) + ', ' + (falling && falling.ey));
  if (!onButton || onButton.ey < 0.8) fail.push('the eyes are not down on the pointer at the button: ' + (onButton && onButton.ey));
  if (!calm || Math.abs(calm.ex) > 0.05 || Math.abs(calm.ey) > 0.05) fail.push('the eyes did not calm on the press');
  /* the scan runs its length and the card lands where the brief put it */
  const cardAt = state.observed.find(o => o.en.cardOn);
  if (!cardAt) fail.push('the card never appeared');
  else if (Math.abs(cardAt.t - (s4 + 4.0)) > 0.20) fail.push('the card appears at ' + cardAt.t.toFixed(2) + 's, not about ' + (s4 + 4.0).toFixed(2));
}

/* ---------- no colour but the house's: the accent on the scan line, the red on the dots, their halos and the tags ---------- */
{
  const mine = sceneHtml(plan).split('==== this clip\'s own css starts here ====')[1];
  if ((mine.match(/var\(--accent\)/g) || []).length !== 1) fail.push('the accent is painted somewhere other than the scan line');
  if ((mine.match(/var\(--red\)/g) || []).length !== 4) fail.push('the red is painted somewhere other than the dots, the halos and the tags');
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
  /* between the lines the track is silence, to the sample */
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
console.log('    the scene starts are the brief\'s, floored by the read: ' + SC.map(b => b.toFixed(2)).join(' / ') + ', end ' + END);
console.log('    the phone is the real page three times over, one visible at a time; the card\'s line is the page\'s own');
console.log('    the line under him is "' + LINE3.text + '", with a comma where the brief had a stop, post29\'s rule');
console.log('    the glow is the module\'s own two layers, not pushed');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
