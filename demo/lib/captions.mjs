/* the boring tek — animated captions. word by word, driven per frame.

   what this is. a caption renderer for the clips in demo/. it takes the array
   `voice.mjs` hands back — `[{word, start, end}, ...]` — and turns it into a
   scene that can be driven one frame at a time under the same rig every clip in
   here already uses: cdp virtual time, the rAF shim, ffmpeg on the other end.

   the reference. the open source pipelines that do this — captacity, and the
   caption pass inside moneyprinterturbo — all work the same way: whisper
   transcribes, the transcript comes back with a timestamp per word, and each
   word is drawn on the frames it is being said on. ours skips the transcription
   step entirely, because we wrote the line and `voice.mjs` gets the timestamps
   from the synthesiser itself. what is left is the drawing, which is this file.

   the one rule that shapes everything below: **no css transition, no css
   animation, on anything that has to hit a mark.** post2.mjs found out why and
   the note is worth repeating here. one captured frame carries five or six
   BeginFrames, so the animation timeline advances about 5x per captured frame
   and a .4s spring resolves in five frames. the rAF shim fixes rAF; nothing
   fixes transitions. so every moving value in here is eased in javascript, in
   node, and written to the element per frame. `captionFrame(plan, t)` is the
   whole animation and it is a pure function of time.

   ---------- the three styles ----------

   a. `pop`. big michroma caps, one short card at a time. the card springs in as
      a whole and the accent then walks across it, a word at a time, landing on
      whichever word is being said and kicking it as it arrives. this is the
      hormozi cut, done in our type: no yellow, no drop shadow, no stroke, no
      four words in four different colours. the restraint is the whole point,
      and it is still the loudest thing we make. `fill: 'word'` is the older
      behaviour, where a word is invisible until it is said — see `fill`.

   b. `type`. space grotesk, lines arriving from below and dimming as they are
      overtaken, the word being said at weight 500 while the rest of the line
      sits at 400. calm, brand, closest to how the site itself reads. no accent
      anywhere in this style, deliberately: it is the one that has to be able to
      run under a talking head without competing with it.

   d. `float`. space grotesk, lowercase, one short card at a time, no card
      behind it and no fill of any kind: the words sit straight on whatever is
      under them. built for footage rather than for a composed frame, which is
      the one thing the other three are not — `pop` over a screen recording is
      a michroma headline arguing with a page that already has type on it.
      the ink is `--fg` and only `--fg`, which is what makes the paper version
      free: over the dark theme the same token is the paper tone, so a clip that
      films a dark page gets light captions without a second code path.
      the accent appears on nothing except the words a clip names in `flash`,
      and then only on the frames they are actually being said on. that is a
      flash, not a highlight, and it is the whole colour budget of the style.

   c. `count`. a number and a label. the digits roll on a fixed cell grid, so a
      6 becoming an 8 cannot change the width of the line under it, which is the
      same trick `index.html` uses to stop a scrambling wordmark wobbling. for
      "40 hours a week", "3 free tools", "0 spreadsheets".

   ---------- what is fixed, and what a caller chooses ----------

   fixed, and not negotiable per clip: the two families and their weights,
   michroma at 400 only and space grotesk at 400 and 500; the colours, which are
   the page's own tokens and nothing else; and the safe box, which every style
   lays out inside and `safe()` measures against afterwards rather than trusting.

   chosen per clip: which style, the box, how many words to a card, how many
   lines to hold, and the timings. all of it is in `planCaptions()`'s options and
   all of it has a default that works.

   `captions-test.mjs` renders the three styles as five second clips, which is
   how they get judged against each other. `post6.mjs` is the first post script
   to use one of them for real, and its notes are worth reading before the
   second: almost every default in here was either confirmed or corrected by
   that clip.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

export const STYLES = ['pop', 'type', 'count', 'float'];
/* the two that cut the word list into short cards and animate identically.
   named once rather than tested for in six places, because the day a fifth
   style arrives the thing that breaks is the fifth `=== 'pop' ||`. */
const CARDED = ['pop', 'float'];

/* ---------- the tokens ----------
   lifted out of index.html at run time, both blocks, exactly as og.mjs and the
   clip scripts lift the light one. a caption cannot drift from the site if it
   never holds a colour of its own, and "both themes" is only a real claim if
   the dark values come from the same place the light ones do.

   the check is on the tokens a caption actually paints with. if one of them
   ever leaves index.html this throws here rather than rendering something
   almost right. */
const NEED = ['--bg', '--fg', '--sub', '--muted', '--accent', '--line', '--display', '--body', '--mono'];
export function brandTokens() {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const light = (src.match(/\n:root\{([\s\S]*?)\n\}/) || [])[1];
  const dark = (src.match(/\nhtml\[data-theme=dark\]\{([\s\S]*?)\n\}/) || [])[1];
  if (!light) throw new Error('no :root block found in index.html');
  if (!dark) throw new Error('no html[data-theme=dark] block found in index.html');
  const missing = NEED.filter(t => !light.includes(t + ':'));
  if (missing.length) throw new Error('the light :root is missing ' + missing.join(', '));
  /* the dark block only overrides colours, so --display and friends are not in
     it and are not expected to be. the accent must be, and it must not be the
     light one: #35ff6a is unreadable on white and #0f8a3c is muddy on black. */
  for (const t of ['--bg', '--fg', '--muted', '--accent']) {
    if (!dark.includes(t + ':')) throw new Error('the dark block is missing ' + t);
  }
  return { light: light.trim(), dark: dark.trim() };
}

/* ---------- easing ----------
   the same solver post2/post4/post5 carry, so a caption moves on the curves the
   site moves on rather than on a lookalike. */
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
      const e = fx(t) - x, d = dfx(t);
      if (Math.abs(e) < 1e-6) return fy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e > 0) hi = t; else lo = t;
      t = (lo + hi) / 2;
    }
    return fy(t);
  };
}
const EASE = bezier(.16, 1, .3, 1);        /* the site's own --ease */
const SPRING = bezier(.34, 1.4, .64, 1);   /* the site's own --spring */
const EASE_IO = bezier(.45, 0, .55, 1);
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));

/* ---------- the copy check ----------
   no punctuation dash reaches a viewer, in any language, and a caption is the
   most readable thing in a clip. hyphens inside words are spelling and stay, so
   this only catches a dash with space around it or a dash used as an em dash.
   the clip scripts ban the plain hyphen outright because their copy has no
   hyphenated words; a caption may quote a script that does, so this one is the
   narrower check. */
const DASH = /(^|\s)[-‐‑‒–—―−]+(\s|$)|[‒–—―]/;
export function checkCopy(words) {
  const line = words.map(w => w.word).join(' ');
  if (DASH.test(line)) throw new Error('a punctuation dash reached the caption: "' + line + '"');
  return line;
}

/* ---------- what actually reaches the screen ----------
   **words, and nothing else.** a caption is not prose: it is one or two words at
   a time, on screen for half a second, in caps. a full stop at the end of a card
   is punctuating a sentence the viewer cannot see, and at 44px in michroma it is
   a large black dot doing no work. so the card carries the word and the voice
   carries the sentence — **the punctuation stays in the script**, where the
   synthesiser reads it and turns it into the pause that is the actual reason it
   is there. nothing about the timing changes, because nothing about the voice
   changes.

   the one mark that survives is the question mark, because it is not
   punctuating a sentence, it is changing what the word means. `sure` and `sure?`
   are two different cards.

   it strips at the **edges only** and never inside a word, which is what makes
   it safe to run over anything:

     business.  ->  business        1,000   ->  1,000
     alone."    ->  alone           don't   ->  don't
     really?    ->  really?         e-pasts ->  e-pasts

   an apostrophe and a hyphen are spelling rather than punctuation, so neither is
   in either class, and a figure keeps its own separators — which matters,
   because the `count` style parses numbers out of these words.

   it runs *after* the grouping, deliberately. `toCards` and `toLines` break at a
   sentence end and they need the full stop to find one, so the cards are cut on
   the copy as written and only then does the copy lose its punctuation. strip
   first and every sentence in a script would run into the next. */
const PUNCT_HEAD = /^["'“‘(\[]+/;
const PUNCT_TAIL = /[,.;:!…"”)\]]+$/;
export function bareWord(word) {
  return word.replace(PUNCT_HEAD, '').replace(PUNCT_TAIL, '');
}

/* ---------- defaults ----------
   every number here is seconds unless it says px, and every one of them is
   overridable per clip. the two that matter most:

   LEAD is how long before its first word a card or a line arrives. it is small
   on purpose. a caption that appears with the word is late, because the spring
   takes 200ms to finish and the word is half said by then; a caption that
   appears half a second early is a subtitle of the future and reads as a lag in
   the other direction. 120ms is about one spring ahead.

   HOLD is how long the last word of a group stays up after it is finished. this
   is the number to raise if a platform's recompress makes the cut feel fast: it
   costs nothing but screen time and it is clamped against the next group's
   entrance, so raising it can never make two groups overlap. */
const DEFAULTS = {
  style: 'pop',
  lead: 0.12,
  hold: 0.36,
  perCard: 3,          /* pop: at most this many words on screen at once */
  maxLines: 3,         /* type: how many lines are visible before the top fades */
  capSize: 40,         /* px. under the brand's 44px hero cap, deliberately:
                          a caption must not out shout the statement above it */
  bodySize: 26,        /* px. type style, before the fit divides it down */
  floatSize: 44,       /* px. float style, and it is the brand's own hero cap.
                          space grotesk lowercase is much narrower than michroma
                          caps, so the fit almost never runs out of box and this
                          cap is what actually decides the size. it does not go
                          past 44 for the same reason the beat does not: nothing
                          we draw out shouts the headline. */
  numberSize: 96,      /* px. count style. the number is the whole point of it */
  align: 'center',
  /* `drop` is the default and it is a brand rule rather than a clip's
     preference: a caption card carries words, and the sentence it belongs to is
     carried by the voice. `keep` is there for anything that genuinely wants the
     marks on screen, and an unrecognised value throws rather than falling back,
     because a silent fallback here would answer a typo by putting the full stops
     back and nobody would think to look. see `bareWord` above for what it strips
     and what it will not touch. */
  punctuation: 'drop',
  /* pop only, and off unless a clip asks for it. a regexp or a predicate over a
     card's words; a card that matches is drawn bigger and in the accent, and
     gets fitted on its own instead of sharing the size every other card shares.
     it is for the beat in a script that is a beat — a number being counted out,
     a one word answer — and it is opt in because the whole reason every card is
     normally one size is that cards changing size read as a zoom nobody asked
     for. use it on a handful of cards, never on a third of them. */
  emphasise: null,
  /* float only, and off unless a clip asks for it. a regexp or a predicate over
     one word; a word that matches is painted in the accent on the frames it is
     being said on and in the ink on every other frame.

     it is deliberately per word rather than per card, because a highlight that
     covers a whole card is a highlighted card and the point of this is that
     three or four words in a whole clip go green. the predicate gets the word,
     its index in the flat cell list and the list itself, so a clip can flash
     the second `build` and not the first without writing a regexp that has to
     know about the copy around it. count what you mark: past a handful the
     accent stops meaning anything and the style is just a green caption. */
  flash: null,
  /* pop only. how a card fills. `card` is the default and `word` is kept for
     anything that specifically wants the old reveal.

     `word` is the style as it was first built: a word is invisible until it is
     said, then springs in on its own. it is the livelier of the two and it has
     one flaw, which only shows itself once the cards are short. a word that has
     not arrived still holds its place in the line, because a card that reflowed
     as it filled would slide the words already on screen sideways while
     somebody is reading them. so on a two word card the first word sits off
     centre by half the width of a word that is not there yet, for as long as the
     gap between them — half the card's life, on natural speech. at three words
     it is a lean; at two it reads as broken.

     `card` springs the whole card in at once and lets the accent travel across
     it as the words are said. the pop is still there, twice over: the card
     springs, and every word kicks as it is spoken. what is lost is the reveal,
     and what is gained is a card that is centred in every frame of its life. it
     is also what most caption tools actually do, and being able to read one word
     ahead is a feature of a caption rather than a leak.

     it was `word` for exactly one clip. post6 was the first thing to cut cards
     short enough for the flaw to show, `card` was added as an opt in so the
     three judged style clips would keep describing what they rendered, and then
     both were watched side by side and `card` won on every count. so this is the
     default now and the style clips were re-rendered against it. a caller that
     wants the reveal asks for it by name. */
  fill: 'card',
  /* the gap between two words on a pop card, in em. michroma carries wide side
     bearings already, so 0.30 measures like a space and reads like none: DATA
     WITHOUT came out as one word at 28px. 0.42 is a space you can see at caption
     size and it is the only number in here that exists because of the face
     rather than because of the layout.

     it is in the plan rather than typed into the css, because the fit has to
     divide by exactly the gap that renders. two copies of this number is a
     caption that overflows its box the day somebody changes one of them. */
  /* where a card is allowed to end. the default is a sentence end and that is
     what pop has always cut on; the option exists because float found the case
     it gets wrong.

     a card breaks on a full stop, on a long gap, or when it is full, and none
     of those three is a comma. so "if ai can do it, we build it" cut as
     "if ai can" / "do it we" / "build it" — and "do it we" is three words that
     were never a phrase. read aloud it is fine, because the voice puts the
     clause boundary in; read on a card it is gibberish, and a caption is read.

     so a style that cares can break on a clause mark too. it is opt in rather
     than the new default because changing where post6 and post7 cut their cards
     would re-cut two clips that are already out. */
  cardBreak: /[.!?]["')\]]?$/,
  wordGap: 0.42,
  /* the same idea for the two styles set in space grotesk, which needs less of
     it because the face is narrower and already has a real space in its
     metrics. unchanged at 0.28, and it is here only so the number the fit
     divides by and the number the css lays out with cannot drift apart. */
  bodyGap: 0.28,
  bigSize: 44,         /* px, and it is the brand's hero cap. an emphasised card
                          is the loudest thing we draw and it still does not go
                          past the number the headline stops at. */
};

/* ---------- grouping ----------
   the three styles cut the same word list three ways. all three cuts happen
   here, in node, as plain data: nothing below this line measures anything, so a
   plan can be printed, diffed and read before a browser ever opens. */

/* pop: short cards. a card breaks on a full stop, on a long gap in the audio,
   or when it is full — whichever comes first. breaking on the gap is what keeps
   a card from straddling a breath, which is the thing that makes a caption feel
   out of sync even when every timestamp is right. */
function toCards(words, o) {
  const cards = [];
  let run = [];
  const flush = () => { if (run.length) { cards.push(run); run = []; } };
  for (let i = 0; i < words.length; i++) {
    run.push(words[i]);
    const next = words[i + 1];
    const gap = next ? next.start - words[i].end : Infinity;
    if (o.cardBreak.test(words[i].word) || run.length >= o.perCard || gap > 0.45) flush();
  }
  flush();
  return cards;
}

/* type: lines. wrapped by character count here and re measured in the page,
   which is the only place the real width is knowable. a sentence end always
   breaks the line: the calm style reads as writing, and writing breaks there. */
function toLines(words, o) {
  const lines = [];
  let run = [], len = 0;
  const flush = () => { if (run.length) { lines.push(run); run = []; len = 0; } };
  for (const w of words) {
    const add = w.word.length + 1;
    if (run.length && len + add > o.wrapAt) flush();
    run.push(w); len += add;
    if (/[.!?]["')\]]?$/.test(w.word)) flush();
  }
  flush();
  return lines;
}

/* count: a number, then the words that belong to it.
   the numerals are read off the copy as written. the synthesiser says "forty"
   for `40` and hands the boundary back as `40`, so a script that wants a
   counter writes the digits. the small english words are mapped anyway, because
   `three free ai tools` is a line somebody will write and a counter that
   silently degrades to a label is a bug nobody would think to look for. */
const SPELLED = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};
function asNumber(word) {
  const bare = word.replace(/[^\p{L}\p{N}%$+.,]/gu, '');
  const m = bare.match(/^([^\d]*)(\d[\d,]*)(.*)$/u);
  if (m) return { pre: m[1], digits: m[2].replace(/,/g, ''), post: m[3] };
  const s = SPELLED[bare.toLowerCase()];
  return s === undefined ? null : { pre: '', digits: String(s), post: '' };
}
function toItems(words) {
  const items = [];
  for (const w of words) {
    const n = asNumber(w.word);
    if (n || !items.length) items.push({ number: n, words: [w], head: w });
    else items[items.length - 1].words.push(w);
  }
  return items;
}

/* ---------- the plan ----------
   grouping plus the window each group is on screen for. a group's window is
   clamped against the next one's, so however long a hold is asked for, two
   groups can never be up at the same time and the caller cannot produce that
   state by accident. */
export function planCaptions(words, opts = {}) {
  const o = { ...DEFAULTS, wrapAt: 26, ...opts };
  if (!STYLES.includes(o.style)) throw new Error('style is one of ' + STYLES.join(', ') + ', not "' + o.style + '"');
  /* named rather than coerced. a silent fallback here would answer a typo with
     the behaviour that is no longer the default, which is the one bug in this
     file nobody would think to look for. */
  if (o.fill !== 'card' && o.fill !== 'word') {
    throw new Error('fill is "card" or "word", not "' + o.fill + '"');
  }
  if (o.punctuation !== 'drop' && o.punctuation !== 'keep') {
    throw new Error('punctuation is "drop" or "keep", not "' + o.punctuation + '"');
  }
  if (!(o.cardBreak instanceof RegExp)) throw new Error('cardBreak is a regexp over a word');
  if (!Array.isArray(words) || !words.length) throw new Error('captions need a word list');
  for (const w of words) {
    if (typeof w.word !== 'string' || !(w.end > w.start) || !(w.start >= 0)) {
      throw new Error('a word is not {word, start, end} with end past start: ' + JSON.stringify(w));
    }
  }
  checkCopy(words);

  const cut = CARDED.includes(o.style) ? toCards(words, o)
    : o.style === 'type' ? toLines(words, o)
      : toItems(words).map(i => i.words);
  const meta = o.style === 'count' ? toItems(words) : null;

  /* the copy as it will be drawn. the timings are untouched: a word that loses
     a full stop is still said at exactly the second it was said at, so this
     changes what is on the card and nothing else in the file. */
  const bared = [];
  const raw = o.punctuation === 'keep' ? cut : cut.map(ws => ws.map(w => {
    const bare = bareWord(w.word);
    /* a token that is punctuation and nothing else would leave an empty cell:
       a word shaped hole in a card, measured and laid out and drawing nothing.
       it has never happened on a synthesiser's word list and it would be
       invisible if it did, which is exactly why it throws. */
    if (!bare) throw new Error('"' + w.word + '" is punctuation and nothing else, so it would draw an empty cell');
    if (bare !== w.word) bared.push({ from: w.word, to: bare });
    return { ...w, word: bare };
  }));

  /* the emphasis test runs here, in node, against the card's words as one
     string. only the answer reaches the plan, so a predicate never has to be
     serialised into the page. */
  const isBig = ws => {
    if (!o.emphasise || o.style !== 'pop') return false;
    const text = ws.map(w => w.word).join(' ');
    return o.emphasise instanceof RegExp ? o.emphasise.test(text) : !!o.emphasise(text, ws);
  };

  const groups = raw.map((ws, i) => ({
    i,
    words: ws.map(w => ({ ...w })),
    number: meta ? meta[i].number : null,
    big: isBig(ws),
    in: Math.max(0, ws[0].start - o.lead),
    out: ws[ws.length - 1].end + o.hold,
  }));
  /* two clamps, in this order, and the first one is the whole reason the second
     one is safe.

     1. a group never arrives before the previous group's last word has finished
        being said. `lead` pulls an entrance forward so the spring is done by the
        time the word is, and on sparse speech that is free. on dense speech it
        is not: adjacent cards can be twenty milliseconds apart, so a 120ms lead
        reaches back over the previous card's final word. found on post6, where
        `decide what it` and `that is the` both had a last word that was never on
        screen at all — the card had already been clamped away before `it` and
        `the` were spoken. the lead is a courtesy and the word being said is not,
        so the word wins and whatever is left of the lead is the lead.
     2. the exit of one group is never later than the entrance of the next, so a
        generous hold degrades into a straight cut rather than an overlap.

     run the other way round and the second clamp would still be able to cut a
     card off mid word, which is the bug this pair exists to make impossible. */
  for (let i = 1; i < groups.length; i++) {
    const prev = groups[i - 1].words;
    groups[i].in = Math.max(groups[i].in, prev[prev.length - 1].end);
  }
  for (let i = 0; i < groups.length - 1; i++) {
    groups[i].out = Math.min(groups[i].out, groups[i + 1].in);
  }

  /* the flat cell list is the contract with the page: build() creates one
     element per entry in this array, apply() writes one entry per frame, and
     the two can never disagree about the order. */
  const cells = [];
  groups.forEach(g => g.words.forEach((w, k) => cells.push({ g: g.i, k, ...w })));

  /* the flash, resolved here rather than in the page. the predicate runs against
     the flat cell list, which is the only place a clip can say "the second time
     this word is said, not the first" without writing a regexp that has to know
     the copy around it. only the answer reaches the plan, so nothing has to be
     serialised into the browser and the count is a number a guard can read
     before a single frame is drawn. */
  if (o.flash && o.style !== 'float') {
    throw new Error('flash is a float style option, not a ' + o.style + ' one');
  }
  const flashed = [];
  cells.forEach((c, i) => {
    const on = !o.flash ? false
      : o.flash instanceof RegExp ? o.flash.test(c.word)
        : !!o.flash(c.word, i, cells);
    c.flash = on;
    if (on) flashed.push({ i, word: c.word, at: +c.start.toFixed(3) });
  });

  const plan = {
    style: o.style, align: o.align,
    lead: o.lead, hold: o.hold, maxLines: o.maxLines,
    capSize: o.capSize, bodySize: o.bodySize, numberSize: o.numberSize,
    groups: groups.map(g => ({
      i: g.i, in: +g.in.toFixed(3), out: +g.out.toFixed(3),
      number: g.number, big: g.big,
      words: g.words.map(w => ({ word: w.word, start: w.start, end: w.end })),
    })),
    cells: cells.map(c => ({ g: c.g, k: c.k, word: c.word, start: c.start, end: c.end, flash: !!c.flash })),
    /* every word the clip lets the accent touch, in order, for the run to print
       and for a guard to count. an empty list on a style that asked for a flash
       means the predicate matched nothing, which is silent otherwise. */
    flashed,
    /* how many rolling digit columns there are, in order, so the page can build
       them and the frame function can index them without measuring anything. */
    digits: [],
    /* the fit in the page divides by this so a card at full stretch still lands
       inside the box. it costs about a tenth of the type size and it buys the
       safe area being true of every frame rather than of the resting one. */
    maxScale: CARDED.includes(o.style) ? POP_MAX_SCALE : 1,
    floatSize: o.floatSize,
    bigSize: o.bigSize,
    fill: o.fill,
    /* what the screen lost, so a run can print it and a guard can check that it
       actually happened rather than trusting that it did. */
    punctuation: o.punctuation,
    bared: { count: bared.length, examples: bared.slice(0, 6) },
    wordGap: o.wordGap, bodyGap: o.bodyGap,
    /* the short cards, for a render to print.

       `late` is a fault and should always be empty: a card whose window ends
       before its own last word is spoken is the bug the entrance clamp above
       fixes, and an empty list is that fix still holding.

       `compressed` is not a fault. it is the cards whose window is shorter than
       the full entrance, so `popTiming` scaled their entrance down to fit. they
       are the function word pairs that fall between the words a sentence leans
       on, and they are meant to go past quickly. worth printing, never worth
       failing on. */
    tight: {
      late: groups.filter(g => g.out < g.words[g.words.length - 1].start)
        .map(g => ({ i: g.i, text: g.words.map(w => w.word).join(' ') })),
      compressed: groups.filter(g => g.out - g.in < POP.in + POP.fade)
        .map(g => ({ i: g.i, for: +(g.out - g.in).toFixed(3), text: g.words.map(w => w.word).join(' ') })),
    },
    seconds: +Math.max(...groups.map(g => g.out)).toFixed(3),
  };
  if (o.style === 'count') {
    plan.groups.forEach((g, gi) => {
      if (!g.number) return;
      for (let d = 0; d < g.number.digits.length; d++) plan.digits.push({ g: gi, d });
    });
  }
  return plan;
}

/* ---------- the animation ----------
   a pure function of time. every number a frame needs comes out of here, and
   nothing in the page decides anything. */

const POP = { in: 0.20, fade: 0.10, from: 0.62, bump: 0.11, bumpFor: 0.20, outFor: 0.14, outTo: 0.94 };
/* `floor` is how lit a word is before it is said. it is a real number to argue
   with: at 0.30 the words ahead are a texture rather than text, and while that
   is a legitimate effect, a caption whose next three words cannot be read is
   working against the one job it has. 0.42 keeps the dimming obvious and keeps
   the line ahead readable. `dimStep` is the same idea one level up, for whole
   lines as they are overtaken: each line back is that much of the one in front
   of it, and `maxLines` back it is gone. the ramp is generated from those two
   rather than typed out, so `maxLines` is a real option instead of a number
   that has to be kept in agreement with a hand written list. */
const TYPE = { in: 0.34, fade: 0.28, rise: 14, dimStep: 0.43, wordFade: 0.17, floor: 0.42 };
const COUNT = { roll: 0.55, spin: 2, stagger: 0.055, label: 0.16, outFor: 0.18, rise: 10 };

/* how long a `pop` card's entrance, emphasis and exit get, for a card that may
   not be on screen long enough to afford the full ones.

   natural speech does not hand out even cards. a script read at two and a bit
   words a second still puts `has a` and `in your` in the gaps between the words
   that carry the sentence, and those pairs get two tenths of a second while
   `mistakes.` gets a whole one. an entrance that always takes 200ms would never
   finish on the short ones: the card would appear at two thirds scale, hold
   nothing, and leave — a flinch rather than a beat, and the same three cards
   flinching every time the clip loops.

   so a short card gets a short entrance rather than an unfinished one. the
   fractions are of the card's own window, which means a fast card *feels* fast,
   which is what it is. a card with room takes the full durations and nothing
   about it changes. */
function popTiming(grp) {
  const win = Math.max(0.001, grp.out - grp.in);
  return {
    in: Math.min(POP.in, win * 0.45),
    fade: Math.min(POP.fade, win * 0.30),
    bumpFor: Math.min(POP.bumpFor, win * 0.55),
    outFor: Math.min(POP.outFor, win * 0.30),
  };
}

/* a single overshoot, up and back. used for the accent word's kick in `pop`:
   it is not a second spring, it is one beat of emphasis riding on top of the
   entrance so the two never fight. */
const kick = p => (p <= 0 || p >= 1) ? 0 : Math.sin(Math.PI * EASE_IO(p));

/* the biggest a `pop` word ever gets. the entrance spring overshoots past 1 —
   that is what a spring is — and the emphasis kick rides on top of it, so the
   two multiply. the number matters because the safe area is measured against
   drawn ink and a word scales about its own centre: a card fitted to exactly
   the box width puts its outer words over the line the moment they spring.
   solved rather than guessed, because changing POP.bump should move it. */
const POP_MAX_SCALE = (() => {
  let m = 1;
  for (let i = 0; i <= 200; i++) {
    const p = i / 200;
    m = Math.max(m, lerp(POP.from, 1, SPRING(p)) * (1 + POP.bump * kick(p)));
  }
  return +m.toFixed(4);
})();

export function captionFrame(plan, t) {
  const g = [], w = [], r = [];
  let block = 0;

  const active = i => {
    const c = plan.cells[i];
    return t >= c.start && t < c.end;
  };

  /* `float` is animated by this branch and not by one of its own, and that is
     the point of it rather than a shortcut: the two styles differ in the face,
     the case and where the colour goes, and in nothing that moves. a second
     copy of the timing would be a second copy to keep in agreement. */
  if (CARDED.includes(plan.style)) {
    /* `out` is when the card is gone, not when it starts leaving. that matters
       more than it sounds: planCaptions clamps one group's out against the next
       group's in, so putting the exit inside the window is what makes "never
       two cards on screen at once" a fact rather than a hope. a card too short
       to hold its own exit starts leaving the moment it arrives instead of
       before it, which is ugly but is at least on screen. */
    const byCard = plan.fill === 'card';
    for (const grp of plan.groups) {
      const live = t >= grp.in && t < grp.out;
      if (!live) { g.push([0, byCard ? POP.from : POP.from, 0]); continue; }
      const p = popTiming(grp);
      const out = span(t, Math.max(grp.in, grp.out - p.outFor), grp.out);
      const leaving = lerp(1, POP.outTo, EASE(out));
      if (!byCard) { g.push([1 - out, leaving, 0]); continue; }
      /* in card mode the entrance lives on the card rather than on each word,
         so this is where the spring is. the two scales multiply rather than
         replace each other, which is what keeps an exit that starts before an
         entrance has finished from snapping back to 1 first. */
      const arriving = lerp(POP.from, 1, SPRING(span(t, grp.in, grp.in + p.in)));
      g.push([Math.min(span(t, grp.in, grp.in + p.fade), 1 - out), arriving * leaving, 0]);
    }
    plan.cells.forEach((c, i) => {
      const grp = plan.groups[c.g];
      if (t < grp.in || t >= grp.out) { w.push([0, POP.from, 0, 0]); return; }
      const p = popTiming(grp);
      const role = t < c.start ? 0 : active(i) ? 2 : 1;
      const bump = 1 + POP.bump * kick(span(t, c.start, c.start + p.bumpFor));
      if (byCard) { w.push([1, bump, 0, role]); return; }
      /* a word arrives a breath before it is said, so its spring has finished
         by the time the sound is on it. */
      const a = Math.max(grp.in, c.start - 0.05);
      const enter = SPRING(span(t, a, a + p.in));
      w.push([span(t, a, a + p.fade), lerp(POP.from, 1, enter) * bump, 0, role]);
    });
    return { g, w, r, b: block };
  }

  if (plan.style === 'type') {
    /* which line the words are on right now. lines below it have not arrived,
       lines above it are dimmed by how far above they are, and the block slides
       so the live line always sits on the same baseline.

       the block is bottom anchored, so its last line is the one on the floor.
       to put line `cur` there instead, the whole block is pushed down by the
       number of lines below it. the push is eased against the arriving line
       rather than stepped, or the block jumps a whole line in one frame. */
    let cur = 0;
    for (let i = 0; i < plan.groups.length; i++) if (t >= plan.groups[i].in) cur = i;
    const grp = plan.groups[cur];
    const p = EASE(span(t, grp.in, grp.in + TYPE.in));
    const rest = plan.groups.length - 1 - cur;
    block = cur === 0 ? rest : rest + (1 - p);   /* in line heights; the page multiplies */

    plan.groups.forEach((grp2, i) => {
      const d = cur - i;
      if (d < 0) { g.push([0, 1, TYPE.rise]); return; }
      const dim = d >= plan.maxLines ? 0 : Math.pow(TYPE.dimStep, d);
      const enter = span(t, grp2.in, grp2.in + TYPE.fade);
      const rise = lerp(TYPE.rise, 0, EASE(span(t, grp2.in, grp2.in + TYPE.in)));
      g.push([dim * enter, 1, rise]);
    });
    plan.cells.forEach((c, i) => {
      /* the word lifts from a floor rather than from nothing: a line that
         arrives blank and fills in is a different, busier effect. the whole
         line is legible on arrival and the word being said is simply the
         brightest thing on it. */
      const lit = span(t, c.start - 0.05, c.start - 0.05 + TYPE.wordFade);
      w.push([lerp(TYPE.floor, 1, lit), 1, 0, t < c.start ? 0 : active(i) ? 2 : 1]);
    });
    return { g, w, r, b: block };
  }

  /* count. the number rolls, the label follows it, and both leave upward. */
  for (const grp of plan.groups) {
    const live = t >= grp.in && t < grp.out;
    if (!live) { g.push([0, 1, COUNT.rise]); continue; }
    const out = span(t, Math.max(grp.in, grp.out - COUNT.outFor), grp.out);
    const inp = span(t, grp.in, grp.in + COUNT.label);
    g.push([Math.min(inp, 1 - out), 1, lerp(COUNT.rise, 0, EASE(inp)) - COUNT.rise * EASE(out)]);
  }
  plan.cells.forEach((c, i) => {
    const grp = plan.groups[c.g];
    if (t < grp.in || t >= grp.out) { w.push([0, 1, 0, 0]); return; }
    const lit = span(t, c.start - 0.05, c.start - 0.05 + COUNT.label);
    w.push([lit, 1, 0, t < c.start ? 0 : active(i) ? 2 : 1]);
  });
  /* every digit column rolls two full turns and lands on its own digit, the
     units column last. staggering from the left means the number reads as
     settling rather than as flickering, which is the same reason a real
     odometer looks calm and a slot machine does not. */
  for (const { g: gi, d } of plan.digits) {
    const grp = plan.groups[gi];
    const target = Number(grp.number.digits[d]);
    const a = grp.words[0].start + d * COUNT.stagger;
    const p = EASE(span(t, a, a + COUNT.roll));
    /* the strip is three copies of 0..9 and the column starts on the target
       digit in the first copy, then travels two whole turns to the same glyph
       in the third. so it rolls upward, counting up, and lands on the digit it
       started on — which is what makes the settle look like an odometer rather
       than like a reel that stopped somewhere. */
    r.push(target + COUNT.spin * 10 * p);
  }
  return { g, w, r, b: block };
}

/* ---------- css ----------
   tokens only, both themes, and nothing that transitions. the sizes that arrive
   as numbers here are starting points: build() in the page divides them down to
   whatever actually fits the box. */
export function captionCss(plan, box, opts = {}) {
  /* called for the check even when the blocks are not emitted: a caption laid
     over a page that already carries the tokens still must not be able to paint
     with one that has left index.html. */
  const { light, dark } = brandTokens();
  /* `tokens: false` is for a caption drawn over the live site. the page already
     declares every one of these and re-declaring them would be a second :root
     block holding the same values — harmless today and a real trap the day the
     two disagree. the caption then paints whatever the host page's theme
     resolves --fg to, which is exactly what the float style wants. */
  const decl = opts.tokens === false ? '' : `
:root{
${light}
}
html[data-theme=dark]{
${dark}
}`;
  return `${decl}
/* the caption box. every style lays out inside it and nothing is ever drawn
   outside it, which is what makes one safe area check enough for all three.
   the box is bottom anchored: a caption grows upward, because the bottom edge
   is the one a platform's own chrome creeps up from. */
.cap{
  position:absolute;
  left:${box.x}px; top:${box.y}px; width:${box.w}px; height:${box.h}px;
  display:flex; align-items:flex-end; justify-content:${plan.align === 'left' ? 'flex-start' : 'center'};
  pointer-events:none; z-index:4;
}
.cap-in{position:relative; width:100%; text-align:${plan.align}}

/* ---- a: pop ----
   michroma, caps, one card at a time. the face ships one weight and it is
   never faked: no font-weight 700, no text-stroke, no shadow. it reads heavy on
   its own, which is the entire reason it is the headline face.
   letter-spacing is 0, as it is on the headline. */
.cap-card{
  position:absolute; left:0; right:0; bottom:0;
  /* the card springs about its own baseline under the card fill, so a card
     arriving grows up out of the line the last one sat on rather than swelling
     around its own middle. under the word fill nothing scales the card and this
     is inert. (no backticks in here: this block is inside a template literal,
     and one would end the string rather than mark a name.) */
  transform-origin:center bottom;
  font-family:var(--display); font-weight:400;
  text-transform:uppercase; letter-spacing:0; line-height:1.12;
  display:flex; flex-wrap:wrap; gap:.14em ${plan.wordGap}em;
  justify-content:${plan.align === 'left' ? 'flex-start' : 'center'};
  opacity:0; will-change:opacity,transform;
}
.cap-card .cap-w{display:inline-block; transform-origin:center bottom; color:var(--fg)}
/* the word being said. one accent, the page's own, and it is the only colour
   change in the style — the spoken words behind it do not fade to grey, which
   would make the card read as a progress bar. */
.cap-card .cap-w[data-role="2"]{color:var(--accent)}
/* an emphasised card is accent all the way through, and this rule comes after
   the one above deliberately: the two have the same specificity, so the later
   one wins and a beat does not change colour halfway through being said. it is
   still the same accent, the same face and the same spring — the only thing
   that is different is the size it was fitted to. */
.cap-card[data-big="1"] .cap-w{color:var(--accent)}

/* ---- b: type ----
   space grotesk, 400 and 500, no accent. the block slides by whole line heights
   and the lines above dim by distance. */
.cap-type{position:absolute; left:0; right:0; bottom:0; will-change:transform}
.cap-line{
  font-family:var(--body); font-weight:400; letter-spacing:0;
  color:var(--fg); opacity:0; will-change:opacity,transform;
  white-space:nowrap;
}
/* the words are inline-blocks with no text node between them, so the space
   between them is a margin rather than a space character. the fit measures the
   same number, so what is measured is what is drawn. */
.cap-line .cap-w{display:inline-block; color:var(--sub); margin-right:${plan.bodyGap}em}
.cap-line .cap-w:last-child{margin-right:0}
.cap-line .cap-w[data-role="2"]{font-weight:500; color:var(--fg)}

/* ---- c: count ----
   the number on a fixed cell grid, the label under it. --cw is the widest
   glyph the face can put in a cell, measured in the page, so a 1 taking a
   third of the width of a 0 cannot make the line breathe as it rolls. */
.cap-count{position:absolute; left:0; right:0; bottom:0; will-change:opacity,transform}
/* the figure is the message in this style, so the figure carries the accent and
   nothing else in the region does. one accent per screen region, and this is
   the region. */
.cap-num{
  font-family:var(--display); font-weight:400; line-height:1;
  color:var(--accent); display:flex; justify-content:${plan.align === 'left' ? 'flex-start' : 'center'};
  align-items:flex-end;
}
.cap-cell{display:inline-block; width:var(--cw,1em); text-align:center; overflow:hidden; height:1em; position:relative}
.cap-roll{position:absolute; left:0; right:0; top:0; will-change:transform}
.cap-roll span{display:block; height:1em; line-height:1; text-align:center}
/* the prefix and the suffix do not roll. a $ or a % is not a digit and an
   animated one reads as a mistake. */
.cap-fix{display:inline-block; color:var(--accent)}
.cap-label{
  font-family:var(--body); font-weight:400; color:var(--muted);
  letter-spacing:.02em; margin-top:.28em; line-height:1.3;
}
.cap-label .cap-w{display:inline-block; margin-right:${plan.bodyGap}em}
.cap-label .cap-w:last-child{margin-right:0}
.cap-label .cap-w[data-role="2"]{color:var(--fg); font-weight:500}

/* ---- d: float ----
   space grotesk, lowercase, no card and no fill of any kind. the words sit
   straight on the footage, which is the whole reason the style exists: over a
   screen recording a michroma headline is type arguing with type.

   weight 700. index.html ships 400 and 500 and that budget is not moving —
   this is a render page, and what ships off a render page is pixels rather than
   a font request, so the demo pages carry a weight the site never will. it is
   the one place in the repo where that is true and it is deliberate.

   the colour is --fg and nothing else. over the light theme that is the ink
   and over the dark theme the same token is the paper tone, so the light on
   dark version is the token system doing its job rather than a second style. */
.cap-float{
  position:absolute; left:0; right:0; bottom:0;
  /* it springs about its own baseline, as the pop card does, so a card arriving
     grows up out of the line the last one sat on. */
  transform-origin:center bottom;
  font-family:var(--body); font-weight:700;
  letter-spacing:-.005em; line-height:1.14;
  display:flex; flex-wrap:wrap; gap:.10em ${plan.bodyGap}em;
  justify-content:${plan.align === 'left' ? 'flex-start' : 'center'};
  opacity:0; will-change:opacity,transform;
}
.cap-float .cap-w{display:inline-block; transform-origin:center bottom; color:var(--fg)}
/* the accent, and it is the entire colour budget of the style. it lands only on
   a word a clip named in flash, and only on the frames that word is actually
   being said on — so it is gone a quarter of a second later. that is what makes
   it a flash rather than a highlight, and it is why the rule is written against
   the live role rather than against the mark alone. */
.cap-float .cap-w[data-flash="1"][data-role="2"]{color:var(--accent)}
`;
}

/* ---------- markup ----------
   built from the plan alone, so the dom order is the cells' order and apply()
   can write by index without ever querying by name. */
export function captionMarkup(plan) {
  const cellsOf = gi => plan.groups[gi].words
    .map((w, k) => '<span class="cap-w" data-cell="' + plan.cells.findIndex(c => c.g === gi && c.k === k)
      + '" data-role="0">' + esc(w.word) + '</span>').join('');

  if (plan.style === 'pop') {
    return '<div class="cap"><div class="cap-in">'
      + plan.groups.map((g, i) => '<div class="cap-card" data-group="' + i + '"'
        + (g.big ? ' data-big="1"' : '') + '>' + cellsOf(i) + '</div>').join('')
      + '</div></div>';
  }
  if (plan.style === 'float') {
    /* the same cells as pop, plus the one static attribute the accent rule
       needs. it is markup rather than something apply() writes, because whether
       a word is a money word is a fact about the copy and does not change from
       one frame to the next. what does change is data-role, and the css asks
       for both before it paints. */
    const floatCells = gi => plan.groups[gi].words.map((w, k) => {
      const idx = plan.cells.findIndex(c => c.g === gi && c.k === k);
      return '<span class="cap-w" data-cell="' + idx + '" data-role="0"'
        + (plan.cells[idx].flash ? ' data-flash="1"' : '') + '>' + esc(w.word) + '</span>';
    }).join('');
    return '<div class="cap"><div class="cap-in">'
      + plan.groups.map((g, i) => '<div class="cap-float" data-group="' + i + '">'
        + floatCells(i) + '</div>').join('')
      + '</div></div>';
  }
  if (plan.style === 'type') {
    return '<div class="cap"><div class="cap-in"><div class="cap-type" id="cap-type">'
      + plan.groups.map((g, i) => '<div class="cap-line" data-group="' + i + '">' + cellsOf(i) + '</div>').join('')
      + '</div></div></div>';
  }
  /* count. one block per item: the number, then the words that belong to it.
     an item with no number at all is a label on its own, which is how a lead in
     line before the first figure is carried. */
  let roll = 0;
  const blocks = plan.groups.map((g, i) => {
    let num = '';
    if (g.number) {
      const cells = g.number.digits.split('').map(() => {
        const strip = [];
        /* three turns of 0..9 so a column can spin two of them and still land
           on a real digit rather than on the end of the strip. */
        for (let s = 0; s < 3; s++) for (let d = 0; d < 10; d++) strip.push('<span>' + d + '</span>');
        return '<i class="cap-cell"><i class="cap-roll" data-roll="' + (roll++) + '">' + strip.join('') + '</i></i>';
      }).join('');
      num = '<div class="cap-num">'
        + (g.number.pre ? '<span class="cap-fix">' + esc(g.number.pre) + '</span>' : '')
        + cells
        + (g.number.post ? '<span class="cap-fix">' + esc(g.number.post) + '</span>' : '')
        + '</div>';
    }
    /* the number's own word is not repeated in the label. */
    const labelCells = g.words.map((w, k) => (g.number && k === 0) ? '' :
      '<span class="cap-w" data-cell="' + plan.cells.findIndex(c => c.g === i && c.k === k)
      + '" data-role="0">' + esc(w.word) + '</span>').join('');
    return '<div class="cap-count" data-group="' + i + '">' + num
      + '<div class="cap-label">' + labelCells + '</div></div>';
  }).join('');
  return '<div class="cap"><div class="cap-in">' + blocks + '</div></div>';
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- the page half ----------
   serialised into the scene with .toString(), the way post5.mjs serialises its
   own. it measures, fits and then does as it is told: `apply` writes numbers,
   it never computes one. */
export function captionPage() {
  const PLAN = window.__CAP_PLAN;
  const BOX = window.__CAP_BOX;
  const cards = [...document.querySelectorAll('.cap-card,.cap-float,.cap-line,.cap-count')];
  const cells = [];
  document.querySelectorAll('.cap-w').forEach(el => { cells[+el.dataset.cell] = el; });
  const rolls = [];
  document.querySelectorAll('.cap-roll').forEach(el => { rolls[+el.dataset.roll] = el; });

  const cv = document.createElement('canvas').getContext('2d');
  const measure = (s, font) => { cv.font = font; return cv.measureText(s).width; };

  /* michroma's widest glyph, in em. the same measurement index.html makes for
     its wordmark: everything that can appear in a cell is measured and the
     widest one becomes the cell. */
  function cellEm(chars) {
    let w = 0;
    for (const ch of chars) w = Math.max(w, measure(ch, '400 100px Michroma') / 100);
    return w;
  }

  function fit() {
    /* the em gap between words. the same number the css lays out with, because
       it arrives from the plan rather than being typed here a second time. */
    const gap = PLAN.wordGap;
    if (PLAN.style === 'pop') {
      /* one size for every card, set by the widest card. cards that each fit
         their own width would change size between beats, which reads as a
         zoom nobody asked for. measured in caps, because text-transform is
         invisible to measureText and costs michroma about 15% of its width. */
      /* two widths, not one: the widest ordinary card and the widest emphasised
         one. they are fitted separately, because the whole point of an
         emphasised card is that it is not the same size as its neighbours, and
         letting one four letter beat into the shared measurement would size
         every card in the clip off a card that is meant to be an exception. */
      const emOf = ws => ws.map(w => w.word.toUpperCase())
        .reduce((a, x, i, all) => a + measure(x, '400 100px Michroma') / 100 + (i ? gap : 0), 0);
      let widest = 0, widestBig = 0;
      for (const g of PLAN.groups) {
        const em = emOf(g.words);
        if (g.big) widestBig = Math.max(widestBig, em);
        else widest = Math.max(widest, em);
      }
      /* divided by the largest scale a word reaches, because a word springs
         about its own centre and the outer ones would otherwise cross the safe
         line on the frame they arrive. */
      const fitTo = w => BOX.w / (w * PLAN.maxScale);
      /* a clip that emphasised every card has no ordinary card to size from, so
         it falls back to the big fit and the two come out the same. that is the
         right answer: if everything is a beat then nothing is. */
      const size = Math.min(PLAN.capSize, widest ? fitTo(widest) : fitTo(widestBig || 1));
      const bigSize = widestBig
        ? Math.min(PLAN.bigSize, fitTo(widestBig))
        : null;
      for (const el of cards) {
        el.style.fontSize = (el.dataset.big === '1' ? bigSize : size).toFixed(3) + 'px';
      }
      return {
        size, bigSize, widest: +widest.toFixed(3),
        widestBig: widestBig ? +widestBig.toFixed(3) : null, maxScale: PLAN.maxScale,
      };
    }
    if (PLAN.style === 'float') {
      /* one size for every card, set by the widest, for the reason pop does it:
         cards that each fit their own width change size between beats and read
         as a zoom nobody asked for.

         measured as written rather than in caps, because the style is lowercase,
         and measured at the weight it draws at, because 700 is materially wider
         than 400 and fitting against the wrong one puts the widest card over the
         safe line. divided by maxScale for the same reason pop is: a word
         springs about its own centre. */
      const gapEm = PLAN.bodyGap;
      const emOf = ws => ws.reduce((a, w, i) =>
        a + measure(w.word, '700 100px "Space Grotesk"') / 100 + (i ? gapEm : 0), 0);
      let widest = 0;
      for (const g of PLAN.groups) widest = Math.max(widest, emOf(g.words));
      const size = Math.min(PLAN.floatSize, BOX.w / (widest * PLAN.maxScale));
      for (const el of cards) el.style.fontSize = size.toFixed(3) + 'px';
      /* bigSize is null and stays null. float has no emphasised card: its beat
         is the accent landing on a word, and that does not change a size. */
      return { size, bigSize: null, widest: +widest.toFixed(3), maxScale: PLAN.maxScale };
    }
    if (PLAN.style === 'type') {
      let widest = 0;
      for (const g of PLAN.groups) {
        /* summed word by word with the css margin added between, because the
           line is drawn as inline-blocks and has no space glyphs in it. */
        const em = g.words.reduce((a, w) => a + measure(w.word, '400 100px "Space Grotesk"') / 100, 0)
          + PLAN.bodyGap * (g.words.length - 1);
        widest = Math.max(widest, em);
      }
      const size = Math.min(PLAN.bodySize, BOX.w / widest);
      for (const el of cards) el.style.fontSize = size.toFixed(3) + 'px';
      return { size, widest: +widest.toFixed(3) };
    }
    /* count. the number is fitted from its own cell grid and the label is a
       fixed share of it, clamped so a long label cannot end up as a caption on
       a caption. */
    const cw = cellEm('0123456789');
    let widestCells = 0, widestFix = 0;
    for (const g of PLAN.groups) {
      if (!g.number) continue;
      widestCells = Math.max(widestCells, g.number.digits.length);
      widestFix = Math.max(widestFix, measure((g.number.pre + g.number.post).toUpperCase(), '400 100px Michroma') / 100);
    }
    const em = widestCells * cw + widestFix;
    const size = Math.min(PLAN.numberSize, em ? BOX.w / em : PLAN.numberSize);
    let labelSize = Math.max(14, Math.min(24, size * 0.30));
    for (const g of PLAN.groups) {
      const el = document.querySelector('.cap-count[data-group="' + g.i + '"] .cap-label');
      if (!el) continue;
      const parts = g.words.filter((w, k) => !(g.number && k === 0)).map(w => w.word);
      if (!parts.length) continue;
      const w = parts.reduce((a, x) => a + measure(x, '400 100px "Space Grotesk"') / 100, 0)
        + PLAN.bodyGap * (parts.length - 1);
      if (w) labelSize = Math.min(labelSize, BOX.w / w);
    }
    document.querySelectorAll('.cap-num').forEach(el => {
      el.style.fontSize = size.toFixed(3) + 'px';
      el.style.setProperty('--cw', cw.toFixed(4) + 'em');
    });
    document.querySelectorAll('.cap-label').forEach(el => { el.style.fontSize = labelSize.toFixed(3) + 'px'; });
    return { size, labelSize, cw: +cw.toFixed(4), widest: +em.toFixed(3) };
  }

  window.__cap = {
    ready: false,
    fitted: null,
    lineHeight: 0,
    build() {
      this.fitted = fit();
      /* the line height the type style slides by, taken off a real line box
         rather than computed from the font size and a guessed leading. */
      const first = document.querySelector('.cap-line');
      this.lineHeight = first ? first.getBoundingClientRect().height : 0;
      this.ready = true;
      return { ...this.fitted, lineHeight: this.lineHeight, box: BOX };
    },
    /* one call per frame. everything it writes arrived eased. */
    apply(f) {
      for (let i = 0; i < cards.length; i++) {
        const [o, s, dy] = f.g[i];
        const el = cards[i];
        el.style.opacity = o.toFixed(4);
        el.style.transform = 'translateY(' + dy.toFixed(3) + 'px)' + (s === 1 ? '' : ' scale(' + s.toFixed(4) + ')');
        /* an invisible card must not be measured by the safe check and must not
           sit on top of the visible one, so it leaves the layout entirely. */
        el.style.visibility = o < 0.004 ? 'hidden' : 'visible';
      }
      for (let i = 0; i < cells.length; i++) {
        const el = cells[i];
        if (!el) continue;
        const [o, s, dy, role] = f.w[i];
        el.style.opacity = o.toFixed(4);
        el.style.transform = (s === 1 ? '' : 'scale(' + s.toFixed(4) + ')')
          + (dy ? ' translateY(' + dy.toFixed(3) + 'px)' : '');
        if (el.dataset.role !== String(role)) el.dataset.role = String(role);
      }
      for (let i = 0; i < rolls.length; i++) {
        if (!rolls[i]) continue;
        rolls[i].style.transform = 'translateY(' + (-f.r[i]).toFixed(4) + 'em)';
      }
      const block = document.getElementById('cap-type');
      if (block) block.style.transform = 'translateY(' + (f.b * this.lineHeight).toFixed(3) + 'px)';
    },
    /* how close the nearest visible caption ink gets to each border, in css px.
       every cell is measured, not the box: the box is where the caption was
       told to live, and this is where it actually drew. */
    safe(vw, vh) {
      let left = 1e9, top = 1e9, right = 1e9, bottom = 1e9, worst = null;
      /* the cells and the words, never .cap-num: that is a full width flex row
         and its rect is the box it centres in, which would report the box back
         to us and prove nothing about the digits inside it. */
      const seen = [...document.querySelectorAll('.cap-w,.cap-cell,.cap-fix')];
      for (const el of seen) {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        /* opacity multiplies down the tree, so a lit word inside a faded card
           is invisible and must not count. */
        let o = 1, node = el;
        while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = [b.left, b.top, vw - b.right, vh - b.bottom];
        if (Math.min(...d) < Math.min(left, top, right, bottom)) worst = el.className + ':' + el.textContent.slice(0, 12);
        left = Math.min(left, d[0]); top = Math.min(top, d[1]);
        right = Math.min(right, d[2]); bottom = Math.min(bottom, d[3]);
      }
      return { left, top, right, bottom, worst };
    },
    /* what the caption drew, for the run to print and for a guard to read. */
    boxes() {
      const vis = cards.filter(el => getComputedStyle(el).visibility !== 'hidden');
      return vis.map(el => {
        const b = el.getBoundingClientRect();
        return { group: +el.dataset.group, top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1),
          left: +b.left.toFixed(1), right: +b.right.toFixed(1) };
      });
    },
  };
}

/* ---------- a printable summary ----------
   the plan, as a card for the terminal. used by the test render and by anything
   that wants to see the cut before spending three minutes on frames. */
export function describe(plan) {
  const out = [];
  out.push('  style ' + plan.style + ', ' + plan.groups.length
    + (CARDED.includes(plan.style) ? ' cards' : plan.style === 'type' ? ' lines' : ' items')
    + ', ' + plan.cells.length + ' words, ' + plan.seconds.toFixed(2) + 's of caption');
  for (const g of plan.groups) {
    out.push('    ' + g.in.toFixed(2).padStart(5) + '..' + g.out.toFixed(2).padStart(5)
      + '  ' + (g.number ? '[' + g.number.pre + g.number.digits + g.number.post + '] ' : '')
      + g.words.map(w => w.word).join(' '));
  }
  if (plan.flashed && plan.flashed.length) {
    out.push('    the accent lands on ' + plan.flashed.length + ' word(s): '
      + plan.flashed.map(f => '"' + f.word + '" at ' + f.at.toFixed(2) + 's').join(', '));
  }
  return out.join('\n');
}
